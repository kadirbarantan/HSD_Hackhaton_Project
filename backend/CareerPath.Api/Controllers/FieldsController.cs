using CareerPath.Api.Data;
using CareerPath.Api.Dtos;
using CareerPath.Api.Models;
using CareerPath.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CareerPath.Api.Controllers;

[ApiController]
[Route("api")]
public class FieldsController(AppDbContext db, ProfileService profiles) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<PlatformStatsDto> GetStats() => new(
        await db.SubFields.CountAsync(s => s.Field.IsActive),
        await db.RoadmapSteps.CountAsync(),
        await db.Users.CountAsync(),
        await db.Users.CountAsync(u => u.Role == UserRole.Expert),
        await db.Topics.CountAsync(),
        await db.CollaborationRequests.CountAsync(c => c.Status == CollaborationStatus.Accepted));

    [HttpGet("fields")]
    public Task<List<FieldSummaryDto>> GetFields() =>
        db.Fields.AsNoTracking()
            .OrderBy(f => f.SortOrder)
            .Select(f => new FieldSummaryDto(f.Id, f.Slug, f.Name, f.Description, f.Icon, f.IsActive, f.SubFields.Count))
            .ToListAsync();

    [HttpGet("fields/{slug}")]
    public async Task<ActionResult<FieldDetailDto>> GetField(string slug)
    {
        var field = await db.Fields.AsNoTracking().FirstOrDefaultAsync(f => f.Slug == slug);
        if (field is null)
        {
            return NotFound();
        }

        var subFields = await db.SubFields.AsNoTracking()
            .Where(s => s.FieldId == field.Id)
            .OrderBy(s => s.SortOrder)
            .Select(s => new
            {
                s.Id,
                s.Slug,
                s.Name,
                s.Icon,
                s.Tagline,
                s.EntryDifficulty,
                s.TimeToJobReady,
                StepCount = s.RoadmapSteps.Count,
                TopicCount = db.Topics.Count(t => t.SubFieldId == s.Id),
            })
            .ToListAsync();
        var learners = await profiles.GetLearnersByPathAsync();

        return new FieldDetailDto(
            field.Id,
            field.Slug,
            field.Name,
            field.Description,
            field.Icon,
            field.IsActive,
            subFields.Select(s => new SubFieldCardDto(
                s.Id,
                s.Slug,
                s.Name,
                s.Icon,
                s.Tagline,
                s.EntryDifficulty,
                s.TimeToJobReady,
                s.StepCount,
                learners.GetValueOrDefault(s.Slug)?.Count ?? 0,
                s.TopicCount)).ToList());
    }
}
