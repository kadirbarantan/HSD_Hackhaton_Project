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
public class UsersController(AppDbContext db, ProfileService profiles, MatchService matches) : ControllerBase
{
    private const int MaxSkills = 15;
    private const int MaxSkillLength = 40;

    [HttpGet]
    public async Task<List<UserSummaryDto>> List(
        [FromQuery] string? search,
        [FromQuery] string? path,
        [FromQuery] UserRole? role,
        [FromQuery] bool openOnly = false)
    {
        IEnumerable<User> users = await db.Users.AsNoTracking().ToListAsync();

        if (role is not null)
        {
            users = users.Where(u => u.Role == role);
        }
        if (openOnly)
        {
            users = users.Where(u => u.OpenToCollaborate);
        }
        if (!string.IsNullOrWhiteSpace(path))
        {
            var learners = (await profiles.GetLearnersByPathAsync()).GetValueOrDefault(path) ?? [];
            users = users.Where(u => learners.Contains(u.Id));
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            users = users.Where(u =>
                Matches(u.DisplayName, term)
                || Matches(u.Headline, term)
                || Matches(u.ExpertTitle, term)
                || u.Skills.Any(s => Matches(s, term)));
        }

        var summaries = await profiles.ToSummariesAsync(users.ToList());
        return summaries
            .OrderByDescending(u => u.OpenToCollaborate)
            .ThenByDescending(u => u.Xp)
            .ToList();
    }

    [Authorize]
    [HttpGet("suggestions")]
    public Task<List<SuggestionDto>> Suggestions() => matches.GetSuggestionsAsync(User.RequireUserId());

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
        var user = await db.Users.FindAsync(userId);
        if (user is null)
        {
            return Unauthorized();
        }

        var validSlugs = await db.SubFields.Select(s => s.Slug).ToListAsync();

        user.DisplayName = request.DisplayName.Trim();
        user.Headline = request.Headline?.Trim() ?? "";
        user.Bio = request.Bio?.Trim() ?? "";
        user.Location = Clean(request.Location);
        user.Skills = (request.Skills ?? [])
            .Select(s => s.Trim())
            .Where(s => s.Length is > 0 and <= MaxSkillLength)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(MaxSkills)
            .ToList();
        user.InterestSlugs = (request.InterestSlugs ?? []).Where(validSlugs.Contains).Distinct().ToList();
        user.OpenToCollaborate = request.OpenToCollaborate;
        user.CollaborationNote = request.CollaborationNote?.Trim() ?? "";
        user.GitHubUrl = CleanUrl(request.GitHubUrl);
        user.LinkedInUrl = CleanUrl(request.LinkedInUrl);
        user.ContactHandle = Clean(request.ContactHandle);
        await db.SaveChangesAsync();

        return (await profiles.GetProfileAsync(userId, userId))!;
    }

    private static bool Matches(string? value, string term) =>
        value?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false;

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string? CleanUrl(string? value)
    {
        var url = Clean(value);
        if (url is null)
        {
            return null;
        }

        var hasScheme = url.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || url.StartsWith("https://", StringComparison.OrdinalIgnoreCase);
        return hasScheme ? url : $"https://{url}";
    }
}
