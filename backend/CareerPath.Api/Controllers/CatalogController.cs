using CareerPath.Api.Data;
using CareerPath.Api.Dtos;
using CareerPath.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CareerPath.Api.Controllers;

[ApiController]
public class CatalogController(AppDbContext db) : ControllerBase
{
    /// <summary>The fixed vocabulary of skill areas that listings ask for and profiles offer.</summary>
    [HttpGet("api/competencies")]
    public Task<List<CompetencyDto>> Competencies() => db.Competencies.AsNoTracking()
        .OrderBy(c => c.SortOrder)
        .Select(c => new CompetencyDto(c.Id, c.Slug, c.Name, c.Category, c.Icon, c.Description))
        .ToListAsync();

    [HttpGet("api/stats")]
    public async Task<PlatformStatsDto> Stats() => new(
        await db.Users.CountAsync(),
        await db.Listings.CountAsync(l => l.Status == ListingStatus.Open),
        await db.Competencies.CountAsync(),
        await db.Applications.CountAsync(a => a.Status == ApplicationStatus.Accepted),
        await db.GitHubProjects.CountAsync());
}
