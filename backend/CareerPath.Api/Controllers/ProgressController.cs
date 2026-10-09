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
[Authorize]
[Route("api/progress")]
public class ProgressController(AppDbContext db, ProfileService profiles) : ControllerBase
{
    [HttpPost("{stepId:int}")]
    public Task<ActionResult<ProgressResultDto>> Complete(int stepId) => SetCompleted(stepId, completed: true);

    [HttpDelete("{stepId:int}")]
    public Task<ActionResult<ProgressResultDto>> Undo(int stepId) => SetCompleted(stepId, completed: false);

    private async Task<ActionResult<ProgressResultDto>> SetCompleted(int stepId, bool completed)
    {
        var userId = User.RequireUserId();
        var step = await db.RoadmapSteps.Include(s => s.SubField).FirstOrDefaultAsync(s => s.Id == stepId);
        if (step is null)
        {
            return NotFound();
        }

        var user = await db.Users.FindAsync(userId);
        if (user is null)
        {
            return Unauthorized();
        }

        var levelBefore = XpRules.LevelFor((await profiles.GetStatsForUserAsync(userId)).Xp);
        var existing = await db.RoadmapProgress.FindAsync(userId, stepId);

        if (completed && existing is null)
        {
            db.RoadmapProgress.Add(new RoadmapProgress { UserId = userId, RoadmapStepId = stepId });
            if (!user.InterestSlugs.Contains(step.SubField.Slug))
            {
                user.InterestSlugs = [.. user.InterestSlugs, step.SubField.Slug];
            }
        }
        else if (!completed && existing is not null)
        {
            db.RoadmapProgress.Remove(existing);
        }
        await db.SaveChangesAsync();

        var completedStepIds = await db.RoadmapProgress
            .Where(p => p.UserId == userId && p.RoadmapStep.SubFieldId == step.SubFieldId)
            .Select(p => p.RoadmapStepId)
            .ToListAsync();
        var total = await db.RoadmapSteps.CountAsync(s => s.SubFieldId == step.SubFieldId);
        var xp = (await profiles.GetStatsForUserAsync(userId)).Xp;
        var level = XpRules.LevelFor(xp);

        return new ProgressResultDto(
            step.SubField.Slug,
            completedStepIds,
            completedStepIds.Count,
            total,
            xp,
            level,
            XpRules.TitleFor(level),
            level > levelBefore);
    }
}
