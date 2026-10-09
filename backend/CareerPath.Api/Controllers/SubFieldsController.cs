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
[Route("api/subfields")]
public class SubFieldsController(AppDbContext db, ProfileService profiles) : ControllerBase
{
    [HttpGet("{slug}")]
    public async Task<ActionResult<SubFieldDetailDto>> Get(string slug)
    {
        var subField = await db.SubFields.AsNoTracking()
            .Include(s => s.Field)
            .Include(s => s.RoadmapSteps)
            .Include(s => s.Communities)
            .AsSplitQuery()
            .FirstOrDefaultAsync(s => s.Slug == slug);
        if (subField is null)
        {
            return NotFound();
        }

        var userId = User.GetUserId();
        List<int> completedStepIds = [];
        var isJoined = false;
        if (userId is not null)
        {
            completedStepIds = await db.RoadmapProgress
                .Where(p => p.UserId == userId && p.RoadmapStep.SubFieldId == subField.Id)
                .Select(p => p.RoadmapStepId)
                .ToListAsync();
            var interests = await db.Users.Where(u => u.Id == userId).Select(u => u.InterestSlugs).FirstOrDefaultAsync();
            isJoined = interests?.Contains(slug) ?? false;
        }

        var learners = await profiles.GetLearnersByPathAsync();
        var topicCount = await db.Topics.CountAsync(t => t.SubFieldId == subField.Id);

        return new SubFieldDetailDto(
            subField.Id,
            subField.Slug,
            subField.Name,
            subField.Icon,
            subField.Tagline,
            subField.Description,
            subField.DayInTheLife,
            subField.EntryDifficulty,
            subField.TimeToJobReady,
            subField.KeySkills,
            subField.FirstJobs,
            subField.GoodFitIf,
            subField.ThinkTwiceIf,
            new FieldRefDto(subField.Field.Slug, subField.Field.Name),
            subField.RoadmapSteps
                .OrderBy(s => s.Order)
                .Select(s => new RoadmapStepDto(s.Id, s.Order, s.Title, s.Description, s.Level, s.EstimatedHours, s.ResourceTitle, s.ResourceUrl))
                .ToList(),
            subField.Communities
                .Select(c => new CommunityLinkDto(c.Id, c.Name, c.Url, c.Platform, c.Description))
                .ToList(),
            learners.GetValueOrDefault(slug)?.Count ?? 0,
            topicCount,
            isJoined,
            completedStepIds);
    }

    [HttpGet("{slug}/people")]
    public async Task<ActionResult<SubFieldPeopleDto>> GetPeople(string slug)
    {
        var subField = await db.SubFields.AsNoTracking()
            .Where(s => s.Slug == slug)
            .Select(s => new { s.Slug, Total = s.RoadmapSteps.Count })
            .FirstOrDefaultAsync();
        if (subField is null)
        {
            return NotFound();
        }

        var learnerIds = ((await profiles.GetLearnersByPathAsync()).GetValueOrDefault(slug) ?? []).ToList();
        var users = await db.Users.AsNoTracking().Where(u => learnerIds.Contains(u.Id)).ToListAsync();
        var progress = await profiles.GetPathProgressAsync();
        var members = (await profiles.ToSummariesAsync(users))
            .Select(user => new PathMemberDto(user, progress.GetValueOrDefault((user.Id, slug)), subField.Total))
            .OrderByDescending(m => m.Completed)
            .ThenByDescending(m => m.User.Xp)
            .ToList();

        return new SubFieldPeopleDto(
            members.Where(m => m.User.Role == UserRole.Expert).ToList(),
            members.Where(m => m.User.Role == UserRole.Student).ToList());
    }

    [Authorize]
    [HttpPost("{slug}/join")]
    public Task<ActionResult<JoinResultDto>> Join(string slug) => SetJoined(slug, joined: true);

    [Authorize]
    [HttpDelete("{slug}/join")]
    public Task<ActionResult<JoinResultDto>> Leave(string slug) => SetJoined(slug, joined: false);

    private async Task<ActionResult<JoinResultDto>> SetJoined(string slug, bool joined)
    {
        if (!await db.SubFields.AnyAsync(s => s.Slug == slug))
        {
            return NotFound();
        }

        var user = await db.Users.FindAsync(User.RequireUserId());
        if (user is null)
        {
            return Unauthorized();
        }

        var isJoined = user.InterestSlugs.Contains(slug);
        if (joined && !isJoined)
        {
            user.InterestSlugs = [.. user.InterestSlugs, slug];
        }
        else if (!joined && isJoined)
        {
            user.InterestSlugs = user.InterestSlugs.Where(s => s != slug).ToList();
        }
        await db.SaveChangesAsync();

        var learners = await profiles.GetLearnersByPathAsync();
        return new JoinResultDto(user.InterestSlugs.Contains(slug), learners.GetValueOrDefault(slug)?.Count ?? 0);
    }
}
