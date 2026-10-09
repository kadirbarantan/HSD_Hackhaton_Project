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
[Route("api/applications")]
public class ApplicationsController(
    AppDbContext db,
    ListingService listings,
    MatchService matches,
    AiReviewService reviews) : ControllerBase
{
    /// <summary>Everything the signed-in user sent or has to answer, in one inbox.</summary>
    [HttpGet]
    public async Task<List<ApplicationDto>> List()
    {
        var userId = User.RequireUserId();
        var applications = await listings.ApplicationsWithGraph().AsNoTracking()
            .Where(a => a.ApplicantId == userId || a.Listing.OwnerId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return applications.Select(a => listings.ToApplicationDto(a, userId)).ToList();
    }

    [HttpPost("{id:int}/accept")]
    public Task<ActionResult<ApplicationDto>> Accept(int id) => RespondAsync(id, ApplicationStatus.Accepted);

    [HttpPost("{id:int}/reject")]
    public Task<ActionResult<ApplicationDto>> Reject(int id) => RespondAsync(id, ApplicationStatus.Rejected);

    /// <summary>Takes back a request you sent, before the other side answers it.</summary>
    [HttpPost("{id:int}/withdraw")]
    public async Task<ActionResult<ApplicationDto>> Withdraw(int id)
    {
        var userId = User.RequireUserId();
        var application = await Load(id);
        if (application is null || application.SenderId != userId)
        {
            return NotFound();
        }
        if (application.Status != ApplicationStatus.Pending)
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "This request has already been answered.");
        }

        application.Status = ApplicationStatus.Withdrawn;
        application.RespondedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return listings.ToApplicationDto(application, userId);
    }

    /// <summary>
    /// Writes a suitability report on the applicant for the listing owner. Uses a language model
    /// when one is configured, and the built-in rule-based writer when it is not.
    /// </summary>
    [HttpPost("{id:int}/review")]
    public async Task<ActionResult<AiReviewDto>> Review(int id, CancellationToken cancellationToken)
    {
        var userId = User.RequireUserId();
        var application = await Load(id);
        if (application is null || application.Listing.OwnerId != userId)
        {
            return NotFound();
        }

        var match = matches.Score(application.Applicant, application.Listing);
        var (content, source) = await reviews.WriteAsync(application, match, cancellationToken);

        var review = application.Review ?? new AiReview { ApplicationId = application.Id, ContentJson = "", Source = source };
        review.ContentJson = ListingService.SerializeReview(content);
        review.Source = source;
        review.MatchScore = match.Score;
        review.CreatedAt = DateTime.UtcNow;

        if (application.Review is null)
        {
            db.AiReviews.Add(review);
            application.Review = review;
        }
        await db.SaveChangesAsync();

        return ListingService.ToReviewDto(review)!;
    }

    private async Task<ActionResult<ApplicationDto>> RespondAsync(int id, ApplicationStatus status)
    {
        var userId = User.RequireUserId();
        var application = await Load(id);
        if (application is null || application.DeciderId != userId)
        {
            return NotFound();
        }
        if (application.Status != ApplicationStatus.Pending)
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "This request has already been answered.");
        }

        application.Status = status;
        application.RespondedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return listings.ToApplicationDto(application, userId);
    }

    private Task<Application?> Load(int id) => listings.ApplicationsWithGraph().FirstOrDefaultAsync(a => a.Id == id);
}
