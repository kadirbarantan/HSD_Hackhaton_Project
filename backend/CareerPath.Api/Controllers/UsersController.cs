using CareerPath.Api.Data;
using CareerPath.Api.Dtos;
using CareerPath.Api.Extensions;
using CareerPath.Api.Models;
using CareerPath.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CareerPath.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController(
    AppDbContext db,
    ProfileService profiles,
    ListingService listings,
    MatchService matches,
    GitHubService gitHub) : ControllerBase
{
    private const int MaxSkills = 15;
    private const int MaxCompetencies = 8;
    private const int MaxSuggestions = 6;

    [HttpGet]
    public async Task<List<UserSummaryDto>> List(
        [FromQuery] string? search,
        [FromQuery] string? competency,
        [FromQuery] bool openOnly = false)
    {
        IEnumerable<User> users = await profiles.UsersWithGraph().AsNoTracking().ToListAsync();

        if (openOnly)
        {
            users = users.Where(u => u.OpenToJoin);
        }
        if (!string.IsNullOrWhiteSpace(competency))
        {
            users = users.Where(u => u.Competencies.Any(c => c.Competency.Slug == competency));
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            users = users.Where(u =>
                Contains(u.DisplayName, term)
                || Contains(u.Headline, term)
                || Contains(u.University, term)
                || Contains(u.Program, term)
                || u.Skills.Any(skill => Contains(skill, term))
                || u.Competencies.Any(c => Contains(c.Competency.Name, term)));
        }

        return users
            .OrderByDescending(u => u.OpenToJoin)
            .ThenByDescending(u => u.Competencies.Count)
            .ThenBy(u => u.DisplayName)
            .Select(ProfileService.ToSummary)
            .ToList();
    }

    /// <summary>People worth inviting to the signed-in user's own open listings.</summary>
    [Authorize]
    [HttpGet("suggestions")]
    public async Task<List<SuggestionDto>> Suggestions()
    {
        var userId = User.RequireUserId();
        var myListings = await listings.WithGraph().AsNoTracking()
            .Where(l => l.OwnerId == userId && l.Status == ListingStatus.Open)
            .ToListAsync();
        if (myListings.Count == 0)
        {
            return [];
        }

        var candidates = await profiles.UsersWithGraph().AsNoTracking()
            .Where(u => u.Id != userId && u.OpenToJoin)
            .ToListAsync();

        var best = new Dictionary<int, SuggestionDto>();
        foreach (var listing in myListings)
        {
            var alreadyInTouch = listing.Applications
                .Where(a => a.Status != ApplicationStatus.Withdrawn)
                .Select(a => a.ApplicantId)
                .ToHashSet();

            foreach (var candidate in candidates.Where(c => !alreadyInTouch.Contains(c.Id)))
            {
                var match = matches.Score(candidate, listing);
                if (best.TryGetValue(candidate.Id, out var existing) && existing.Match.Score >= match.Score)
                {
                    continue;
                }
                best[candidate.Id] = new SuggestionDto(
                    ProfileService.ToSummary(candidate),
                    listing.Id,
                    listing.Title,
                    match);
            }
        }

        return best.Values
            .Where(s => s.Match.Score >= 35)
            .OrderByDescending(s => s.Match.Score)
            .ThenBy(s => s.User.DisplayName)
            .Take(MaxSuggestions)
            .ToList();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserProfileDto>> Get(int id)
    {
        var profile = await profiles.GetProfileAsync(id, User.GetUserId());
        return profile is null ? NotFound() : profile;
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<ActionResult<UserProfileDto>> UpdateMe(UpdateProfileRequest request)
    {
        var userId = User.RequireUserId();
        var user = await db.Users.Include(u => u.Competencies).FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
        {
            return Unauthorized();
        }

        user.DisplayName = request.DisplayName.Trim();
        user.Headline = Input.Text(request.Headline);
        user.Bio = Input.Text(request.Bio);
        user.Location = Input.Optional(request.Location);
        user.University = Input.Optional(request.University);
        user.Program = Input.Optional(request.Program);
        user.StudyYear = request.StudyYear;
        user.Skills = Input.Tags(request.Skills, MaxSkills);
        user.WeeklyHours = Math.Clamp(request.WeeklyHours, 0, 60);
        user.OpenToJoin = request.OpenToJoin;
        user.LookingForNote = Input.Text(request.LookingForNote);
        user.LinkedInUrl = Input.Url(request.LinkedInUrl);
        user.PortfolioUrl = Input.Url(request.PortfolioUrl);
        user.ContactHandle = Input.Optional(request.ContactHandle);

        var newUsername = Input.GitHubUsername(request.GitHubUsername);
        if (!string.Equals(newUsername, user.GitHubUsername, StringComparison.OrdinalIgnoreCase))
        {
            // The cached repositories belong to the old account, so they are no longer this person's work.
            db.GitHubProjects.RemoveRange(await db.GitHubProjects.Where(p => p.UserId == userId).ToListAsync());
            user.GitHubUsername = newUsername;
            user.GitHubSyncedAt = null;
        }

        await ApplyCompetenciesAsync(user, request.Competencies);
        await db.SaveChangesAsync();

        return (await profiles.GetProfileAsync(userId, userId))!;
    }

    /// <summary>Imports the user's public repositories from GitHub so their profile shows real work.</summary>
    [Authorize]
    [HttpPost("me/github")]
    public async Task<ActionResult<GitHubSyncResultDto>> SyncGitHub(CancellationToken cancellationToken)
    {
        var user = await db.Users.FindAsync([User.RequireUserId()], cancellationToken);
        return user is null ? Unauthorized() : await gitHub.SyncAsync(user, cancellationToken);
    }

    private async Task ApplyCompetenciesAsync(User user, List<CompetencyChoice>? choices)
    {
        var wanted = (choices ?? [])
            .Where(choice => !string.IsNullOrWhiteSpace(choice.Slug))
            .DistinctBy(choice => choice.Slug, StringComparer.OrdinalIgnoreCase)
            .Take(MaxCompetencies)
            .ToList();

        var slugs = wanted.Select(choice => choice.Slug).ToList();
        var ids = await db.Competencies
            .Where(c => slugs.Contains(c.Slug))
            .ToDictionaryAsync(c => c.Slug, c => c.Id);

        user.Competencies.RemoveAll(existing => !wanted.Any(choice =>
            ids.TryGetValue(choice.Slug, out var id) && id == existing.CompetencyId));

        foreach (var choice in wanted)
        {
            if (!ids.TryGetValue(choice.Slug, out var competencyId))
            {
                continue;
            }

            var existing = user.Competencies.FirstOrDefault(c => c.CompetencyId == competencyId);
            if (existing is null)
            {
                user.Competencies.Add(new UserCompetency { CompetencyId = competencyId, Level = choice.Level });
            }
            else
            {
                existing.Level = choice.Level;
            }
        }
    }

    private static bool Contains(string? value, string term) =>
        value?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false;
}
