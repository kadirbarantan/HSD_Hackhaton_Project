using System.Text.Json;
using CareerPath.Api.Data;
using CareerPath.Api.Dtos;
using CareerPath.Api.Extensions;
using CareerPath.Api.Models;
using CareerPath.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace CareerPath.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/applications/{id:int}/roadmap")]
public class RoadmapsController(AppDbContext db, ListingService listings, RoadmapService generator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<RoadmapPageDto>> Get(int id, CancellationToken ct)
    {
        var application = await LoadApplication(id, ct);
        if (application is null) return NotFound();
        if (application.Status != ApplicationStatus.Accepted) return NotAccepted();
        return ToPage(application, await LoadRoadmap(id, ct));
    }

    [HttpPost]
    public async Task<ActionResult<RoadmapPageDto>> Create(int id, CancellationToken ct)
    {
        var application = await LoadApplication(id, ct);
        if (application is null) return NotFound();
        if (application.Status != ApplicationStatus.Accepted) return NotAccepted();
        var existing = await LoadRoadmap(id, ct);
        if (existing is not null) return ToPage(application, existing);

        var (content, source) = await generator.GenerateAsync(application, ct);
        var roadmap = new Roadmap
        {
            ApplicationId = id,
            ContentJson = JsonSerializer.Serialize(content, RoadmapService.JsonOptions),
            Source = source,
            Progress = content.Milestones.SelectMany((m, index) => m.Tasks.Select(t => new RoadmapProgress
            {
                MilestoneIndex = index, UserId = t.UserId,
            })).ToList(),
        };
        db.Roadmaps.Add(roadmap);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException exception) when (exception.InnerException is SqliteException { SqliteExtendedErrorCode: 2067 })
        {
            // Another participant finished generation first. Return their saved plan, never replace it.
            db.ChangeTracker.Clear();
            var winner = await LoadRoadmap(id, ct);
            if (winner is null) throw;
            return ToPage(application, winner);
        }
        return ToPage(application, roadmap);
    }

    [HttpPut("milestones/{index:int}/progress")]
    public async Task<ActionResult<RoadmapPageDto>> Update(int id, int index, UpdateRoadmapProgressRequest request, CancellationToken ct)
    {
        var application = await LoadApplication(id, ct);
        if (application is null) return NotFound();
        if (application.Status != ApplicationStatus.Accepted) return NotAccepted();
        var userId = User.RequireUserId();
        var changed = await db.RoadmapProgress
            .Where(p => p.Roadmap.ApplicationId == id && p.MilestoneIndex == index && p.UserId == userId)
            .ExecuteUpdateAsync(set => set.SetProperty(p => p.Completed, request.Completed), ct);
        if (changed == 0) return NotFound();
        return ToPage(application, await LoadRoadmap(id, ct));
    }

    private Task<Application?> LoadApplication(int id, CancellationToken ct)
    {
        var userId = User.RequireUserId();
        return listings.ApplicationsWithGraph().AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id && (a.ApplicantId == userId || a.Listing.OwnerId == userId), ct);
    }

    private Task<Roadmap?> LoadRoadmap(int id, CancellationToken ct) => db.Roadmaps.AsNoTracking().Include(r => r.Progress)
        .FirstOrDefaultAsync(r => r.ApplicationId == id, ct);

    private ObjectResult NotAccepted() => Problem(statusCode: StatusCodes.Status409Conflict,
        title: "Accept the request before creating or viewing your shared roadmap.");

    private static RoadmapPageDto ToPage(Application application, Roadmap? roadmap) => new(
        application.Id, application.ListingId, application.Listing.Title,
        [ProfileService.ToSummary(application.Listing.Owner), ProfileService.ToSummary(application.Applicant)],
        roadmap is null ? null : new RoadmapDto(roadmap.Id,
            JsonSerializer.Deserialize<RoadmapContent>(roadmap.ContentJson, RoadmapService.JsonOptions)!,
            roadmap.Source, roadmap.Source != RoadmapService.TemplateSource, roadmap.CreatedAt,
            roadmap.Progress.OrderBy(p => p.MilestoneIndex).ThenBy(p => p.UserId)
                .Select(p => new RoadmapProgressDto(p.MilestoneIndex, p.UserId, p.Completed)).ToList()));
}
