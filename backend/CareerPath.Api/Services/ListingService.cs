using System.Text.Json;
using CareerPath.Api.Data;
using CareerPath.Api.Dtos;
using CareerPath.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CareerPath.Api.Services;

/// <summary>Turns listings and applications into the shapes the web app reads, match scores included.</summary>
public class ListingService(AppDbContext db, MatchService matches)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    /// <summary>Everything needed to score a listing and render its card in one query.</summary>
    public IQueryable<Listing> WithGraph() => db.Listings
        .Include(l => l.Owner).ThenInclude(u => u.Competencies).ThenInclude(c => c.Competency)
        .Include(l => l.Owner).ThenInclude(u => u.Projects)
        .Include(l => l.Needs).ThenInclude(n => n.Competency)
        .Include(l => l.Applications);

    public IQueryable<Application> ApplicationsWithGraph() => db.Applications
        .Include(a => a.Review)
        .Include(a => a.Applicant).ThenInclude(u => u.Competencies).ThenInclude(c => c.Competency)
        .Include(a => a.Applicant).ThenInclude(u => u.Projects)
        .Include(a => a.Listing).ThenInclude(l => l.Needs).ThenInclude(n => n.Competency)
        .Include(a => a.Listing).ThenInclude(l => l.Owner).ThenInclude(u => u.Competencies).ThenInclude(c => c.Competency)
        .Include(a => a.Listing).ThenInclude(l => l.Owner).ThenInclude(u => u.Projects);

    public ListingDto ToDto(Listing listing, User? viewer, int? viewerId)
    {
        var isOwner = viewerId == listing.OwnerId;
        var mine = viewerId is null
            ? null
            : listing.Applications.FirstOrDefault(a => a.ApplicantId == viewerId);

        return new ListingDto(
            listing.Id,
            listing.Title,
            listing.Summary,
            listing.Description,
            ProfileService.ToSummary(listing.Owner),
            listing.Needs
                .OrderByDescending(n => n.IsPrimary)
                .ThenBy(n => n.Competency.SortOrder)
                .Select(n => new ListingNeedDto(
                    n.Competency.Slug,
                    n.Competency.Name,
                    n.Competency.Category,
                    n.Competency.Icon,
                    n.IsPrimary))
                .ToList(),
            listing.Stack,
            listing.ProjectUrl,
            listing.TeamSize,
            listing.HoursPerWeek,
            listing.Timeline,
            listing.Status,
            listing.OutcomeNote,
            listing.CreatedAt,
            listing.Applications.Count(a => a.Status != ApplicationStatus.Withdrawn),
            listing.Applications.Count(a =>
                a.Status == ApplicationStatus.Pending && a.Origin == ApplicationOrigin.Applied),
            isOwner,
            // The viewer is the would-be applicant here, so the reasons are written to them.
            viewer is null || isOwner ? null : matches.Score(viewer, listing, MatchService.MatchVoice.Applicant),
            mine is null ? null : new ViewerApplicationDto(mine.Id, mine.Origin, mine.Status));
    }

    public ApplicationDto ToApplicationDto(Application application, int viewerId)
    {
        var listing = application.Listing;
        var isOwner = listing.OwnerId == viewerId;
        var accepted = application.Status == ApplicationStatus.Accepted || application.Status == ApplicationStatus.Completed;
        var other = isOwner ? application.Applicant : listing.Owner;

        return new ApplicationDto(
            application.Id,
            listing.Id,
            listing.Title,
            ProfileService.ToSummary(application.Applicant),
            ProfileService.ToSummary(listing.Owner),
            application.Origin,
            application.Message,
            application.Status,
            application.CreatedAt,
            application.RespondedAt,
            matches.Score(
                application.Applicant,
                listing,
                viewerId == application.ApplicantId ? MatchService.MatchVoice.Applicant : MatchService.MatchVoice.Owner),
            application.Status == ApplicationStatus.Pending && viewerId == application.DeciderId,
            application.Status == ApplicationStatus.Pending && viewerId == application.SenderId,
            application.Status == ApplicationStatus.Accepted && (isOwner || viewerId == application.ApplicantId),
            // The write-up judges the applicant, so only the listing owner ever sees it.
            isOwner ? ToReviewDto(application.Review) : null,
            accepted ? new ContactDto(other.Email, other.ContactHandle) : null);
    }

    public static AiReviewDto? ToReviewDto(AiReview? review)
    {
        if (review is null)
        {
            return null;
        }

        var content = JsonSerializer.Deserialize<AiReviewContent>(review.ContentJson, JsonOptions);
        return content is null
            ? null
            : new AiReviewDto(
                content,
                review.Source,
                review.Source != AiReviewService.RuleBasedSource,
                review.MatchScore,
                review.CreatedAt);
    }

    public static string SerializeReview(AiReviewContent content) =>
        JsonSerializer.Serialize(content, JsonOptions);
}
