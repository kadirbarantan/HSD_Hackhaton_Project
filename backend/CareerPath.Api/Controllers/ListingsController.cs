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
[Route("api/listings")]
public class ListingsController(AppDbContext db, ListingService listings, ProfileService profiles) : ControllerBase
{
    private const int MaxNeeds = 5;
    private const int MaxStack = 12;
    private const int MaxOpenListings = 10;

    [HttpGet]
    public async Task<List<ListingDto>> List(
        [FromQuery] string? search,
        [FromQuery] string? competency,
        [FromQuery] int? ownerId,
        [FromQuery] bool includeClosed = false)
    {
        var viewerId = User.GetUserId();
        var viewer = await LoadViewerAsync(viewerId);

        var query = listings.WithGraph().AsNoTracking();
        if (!includeClosed)
        {
            query = query.Where(l => l.Status == ListingStatus.Open);
        }
        if (ownerId is not null)
        {
            query = query.Where(l => l.OwnerId == ownerId);
        }
        if (!string.IsNullOrWhiteSpace(competency))
        {
            query = query.Where(l => l.Needs.Any(n => n.Competency.Slug == competency));
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(l =>
                EF.Functions.Like(l.Title, $"%{term}%")
                || EF.Functions.Like(l.Summary, $"%{term}%")
                || EF.Functions.Like(l.Description, $"%{term}%"));
        }

        var results = (await query.ToListAsync())
            .Select(listing => listings.ToDto(listing, viewer, viewerId))
            .ToList();

        // Someone browsing for a project cares about where they fit, not about what is newest.
        return viewer is null
            ? results.OrderByDescending(l => l.CreatedAt).ToList()
            : results.OrderByDescending(l => l.Match?.Score ?? -1).ThenByDescending(l => l.CreatedAt).ToList();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ListingDto>> Get(int id)
    {
        var viewerId = User.GetUserId();
        var listing = await listings.WithGraph().AsNoTracking().FirstOrDefaultAsync(l => l.Id == id);
        return listing is null ? NotFound() : listings.ToDto(listing, await LoadViewerAsync(viewerId), viewerId);
    }

    /// <summary>Everyone who applied to or was invited to this listing. Owner only.</summary>
    [Authorize]
    [HttpGet("{id:int}/applications")]
    public async Task<ActionResult<List<ApplicationDto>>> Applications(int id)
    {
        var userId = User.RequireUserId();
        if (!await db.Listings.AnyAsync(l => l.Id == id && l.OwnerId == userId))
        {
            return NotFound();
        }

        var applications = await listings.ApplicationsWithGraph().AsNoTracking()
            .Where(a => a.ListingId == id)
            .ToListAsync();

        return applications
            .Select(a => listings.ToApplicationDto(a, userId))
            .OrderBy(a => a.Status)
            .ThenByDescending(a => a.Match.Score)
            .ToList();
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ListingDto>> Create(SaveListingRequest request)
    {
        var userId = User.RequireUserId();
        var openCount = await db.Listings.CountAsync(l => l.OwnerId == userId && l.Status == ListingStatus.Open);
        if (openCount >= MaxOpenListings)
        {
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: $"You already have {MaxOpenListings} open listings. Close one before posting another.");
        }

        var listing = new Listing { OwnerId = userId, Title = "", Summary = "" };
        if (await ApplyAsync(listing, request) is { } error)
        {
            return error;
        }

        db.Listings.Add(listing);
        await db.SaveChangesAsync();
        return await ReloadAsync(listing.Id, userId);
    }

    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ListingDto>> Update(int id, SaveListingRequest request)
    {
        var userId = User.RequireUserId();
        var listing = await db.Listings.Include(l => l.Needs).FirstOrDefaultAsync(l => l.Id == id && l.OwnerId == userId);
        if (listing is null)
        {
            return NotFound();
        }

        if (await ApplyAsync(listing, request) is { } error)
        {
            return error;
        }

        await db.SaveChangesAsync();
        return await ReloadAsync(id, userId);
    }

    [Authorize]
    [HttpPost("{id:int}/close")]
    public Task<ActionResult<ListingDto>> Close(int id) => SetStatusAsync(id, ListingStatus.Closed);

    [Authorize]
    [HttpPost("{id:int}/reopen")]
    public Task<ActionResult<ListingDto>> Reopen(int id) => SetStatusAsync(id, ListingStatus.Open);

    [Authorize]
    [HttpPost("{id:int}/complete")]
    public async Task<ActionResult<ListingDto>> Complete(int id, CloseListingWithNoteRequest request)
    {
        var userId = User.RequireUserId();
        var listing = await db.Listings
            .Include(l => l.Applications)
            .FirstOrDefaultAsync(l => l.Id == id && l.OwnerId == userId);
        if (listing is null)
        {
            return NotFound();
        }

        listing.Status = ListingStatus.Completed;
        listing.OutcomeNote = request.Note.Trim();
        listing.ClosedAt = DateTime.UtcNow;

        foreach (var app in listing.Applications.Where(a => a.Status == ApplicationStatus.Accepted))
        {
            app.Status = ApplicationStatus.Completed;
            app.RespondedAt ??= DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        return await ReloadAsync(id, userId);
    }

    [Authorize]
    [HttpPost("{id:int}/cancel")]
    public async Task<ActionResult<ListingDto>> Cancel(int id, CloseListingWithNoteRequest request)
    {
        var userId = User.RequireUserId();
        var listing = await db.Listings
            .Include(l => l.Applications)
            .FirstOrDefaultAsync(l => l.Id == id && l.OwnerId == userId);
        if (listing is null)
        {
            return NotFound();
        }

        listing.Status = ListingStatus.Cancelled;
        listing.OutcomeNote = request.Note.Trim();
        listing.ClosedAt = DateTime.UtcNow;

        foreach (var app in listing.Applications.Where(a => a.Status == ApplicationStatus.Accepted))
        {
            app.Status = ApplicationStatus.Cancelled;
            app.RespondedAt ??= DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        return await ReloadAsync(id, userId);
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.RequireUserId();
        var listing = await db.Listings
            .Include(l => l.Needs)
            .Include(l => l.Applications).ThenInclude(a => a.Review)
            .FirstOrDefaultAsync(l => l.Id == id && l.OwnerId == userId);
        if (listing is null)
        {
            return NotFound();
        }

        db.AiReviews.RemoveRange(listing.Applications.Where(a => a.Review is not null).Select(a => a.Review!));
        db.Applications.RemoveRange(listing.Applications);
        db.ListingNeeds.RemoveRange(listing.Needs);
        db.Listings.Remove(listing);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize]
    [HttpPost("{id:int}/apply")]
    public async Task<ActionResult<ApplicationDto>> Apply(int id, ApplyRequest request)
    {
        var userId = User.RequireUserId();
        var listing = await db.Listings.FirstOrDefaultAsync(l => l.Id == id);
        if (listing is null)
        {
            return NotFound();
        }
        if (listing.OwnerId == userId)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "This is your own listing.");
        }
        if (listing.Status != ListingStatus.Open)
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "This listing is closed.");
        }

        return await AddApplicationAsync(listing, userId, ApplicationOrigin.Applied, request.Message, userId);
    }

    /// <summary>The owner asks someone to join. That person then accepts or rejects.</summary>
    [Authorize]
    [HttpPost("{id:int}/invite")]
    public async Task<ActionResult<ApplicationDto>> Invite(int id, InviteRequest request)
    {
        var userId = User.RequireUserId();
        var listing = await db.Listings.FirstOrDefaultAsync(l => l.Id == id && l.OwnerId == userId);
        if (listing is null)
        {
            return NotFound();
        }
        if (listing.Status != ListingStatus.Open)
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "Reopen the listing before inviting people.");
        }
        if (request.UserId == userId)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "You cannot invite yourself.");
        }
        if (!await db.Users.AnyAsync(u => u.Id == request.UserId))
        {
            return NotFound();
        }

        return await AddApplicationAsync(listing, request.UserId, ApplicationOrigin.Invited, request.Message, userId);
    }

    private async Task<ActionResult<ApplicationDto>> AddApplicationAsync(
        Listing listing,
        int applicantId,
        ApplicationOrigin origin,
        string message,
        int viewerId)
    {
        var existing = await db.Applications
            .FirstOrDefaultAsync(a => a.ListingId == listing.Id && a.ApplicantId == applicantId);
        if (existing is not null && existing.Status != ApplicationStatus.Withdrawn)
        {
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: origin == ApplicationOrigin.Applied
                    ? "You have already been in touch about this listing."
                    : "There is already a request between you and this person for this listing.");
        }

        if (existing is not null)
        {
            db.Applications.Remove(existing);
        }

        var application = new Application
        {
            ListingId = listing.Id,
            ApplicantId = applicantId,
            Origin = origin,
            Message = message.Trim(),
        };
        db.Applications.Add(application);
        await db.SaveChangesAsync();

        var saved = await listings.ApplicationsWithGraph().AsNoTracking().FirstAsync(a => a.Id == application.Id);
        return listings.ToApplicationDto(saved, viewerId);
    }

    /// <summary>Writes the request onto the listing. Returns an error result when something is wrong.</summary>
    private async Task<ActionResult<ListingDto>?> ApplyAsync(Listing listing, SaveListingRequest request)
    {
        var slugs = request.Needs
            .Select(need => need.Slug)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(MaxNeeds)
            .ToList();

        var competencies = await db.Competencies
            .Where(c => slugs.Contains(c.Slug))
            .ToDictionaryAsync(c => c.Slug, c => c.Id);
        if (competencies.Count == 0)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Choose at least one area you need help with.");
        }

        listing.Title = request.Title.Trim();
        listing.Summary = request.Summary.Trim();
        listing.Description = Input.Text(request.Description);
        listing.Stack = Input.Tags(request.Stack, MaxStack, 30);
        listing.ProjectUrl = Input.Url(request.ProjectUrl);
        listing.TeamSize = Math.Clamp(request.TeamSize, 1, 20);
        listing.HoursPerWeek = Math.Clamp(request.HoursPerWeek, 1, 40);
        listing.Timeline = Input.Text(request.Timeline);

        listing.Needs.Clear();
        foreach (var need in request.Needs.Where(n => slugs.Contains(n.Slug)))
        {
            if (competencies.TryGetValue(need.Slug, out var competencyId)
                && listing.Needs.All(existing => existing.CompetencyId != competencyId))
            {
                listing.Needs.Add(new ListingNeed { CompetencyId = competencyId, IsPrimary = need.IsPrimary });
            }
        }

        return null;
    }

    private async Task<ActionResult<ListingDto>> SetStatusAsync(int id, ListingStatus status)
    {
        var userId = User.RequireUserId();
        var listing = await db.Listings.FirstOrDefaultAsync(l => l.Id == id && l.OwnerId == userId);
        if (listing is null)
        {
            return NotFound();
        }

        listing.Status = status;
        listing.ClosedAt = status == ListingStatus.Closed ? DateTime.UtcNow : null;
        await db.SaveChangesAsync();
        return await ReloadAsync(id, userId);
    }

    private async Task<ListingDto> ReloadAsync(int id, int viewerId)
    {
        var listing = await listings.WithGraph().AsNoTracking().FirstAsync(l => l.Id == id);
        return listings.ToDto(listing, await LoadViewerAsync(viewerId), viewerId);
    }

    private Task<User?> LoadViewerAsync(int? viewerId) => viewerId is null
        ? Task.FromResult<User?>(null)
        : profiles.UsersWithGraph().AsNoTracking().FirstOrDefaultAsync(u => u.Id == viewerId);
}
