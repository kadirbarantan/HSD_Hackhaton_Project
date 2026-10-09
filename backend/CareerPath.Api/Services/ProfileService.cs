using CareerPath.Api.Data;
using CareerPath.Api.Dtos;
using CareerPath.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CareerPath.Api.Services;

public class ProfileService(AppDbContext db, ListingService listings)
{
    /// <summary>Loads everything the match scorer and the profile page need in one query.</summary>
    public IQueryable<User> UsersWithGraph() => db.Users
        .Include(u => u.Competencies).ThenInclude(c => c.Competency)
        .Include(u => u.Projects);

    public static UserSummaryDto ToSummary(User user) => new(
        user.Id,
        user.DisplayName,
        user.Headline,
        user.Location,
        user.University,
        user.Program,
        user.StudyYear,
        user.Skills,
        user.Competencies
            .OrderByDescending(c => c.Level)
            .ThenBy(c => c.Competency.SortOrder)
            .Select(c => new UserCompetencyDto(
                c.Competency.Slug,
                c.Competency.Name,
                c.Competency.Category,
                c.Competency.Icon,
                c.Level))
            .ToList(),
        user.OpenToJoin,
        user.LookingForNote,
        user.WeeklyHours,
        user.GitHubUsername,
        user.Projects.Count);

    public async Task<MeDto> GetMeAsync(User user) => new(
        user.Id,
        user.Email,
        user.DisplayName,
        user.OpenToJoin,
        await db.UserCompetencies.CountAsync(c => c.UserId == user.Id),
        await db.Listings.CountAsync(l => l.OwnerId == user.Id && l.Status == ListingStatus.Open),
        await CountPendingDecisionsAsync(user.Id));

    /// <summary>Requests this user has to answer: applications to their listings, plus invitations they received.</summary>
    public Task<int> CountPendingDecisionsAsync(int userId) => db.Applications
        .CountAsync(a => a.Status == ApplicationStatus.Pending
            && (a.Origin == ApplicationOrigin.Applied
                ? a.Listing.OwnerId == userId
                : a.ApplicantId == userId));

    public async Task<UserProfileDto?> GetProfileAsync(int userId, int? viewerId)
    {
        var user = await UsersWithGraph().AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
        {
            return null;
        }

        var viewer = viewerId is null || viewerId == userId
            ? null
            : await UsersWithGraph().AsNoTracking().FirstOrDefaultAsync(u => u.Id == viewerId);

        var theirListings = await listings.WithGraph().AsNoTracking()
            .Where(l => l.OwnerId == userId)
            .OrderByDescending(l => l.Status == ListingStatus.Open)
            .ThenByDescending(l => l.CreatedAt)
            .ToListAsync();

        var accepted = await db.Applications
            .CountAsync(a => a.Status == ApplicationStatus.Accepted
                && (a.ApplicantId == userId || a.Listing.OwnerId == userId));

        return new UserProfileDto(
            ToSummary(user),
            user.Bio,
            user.LinkedInUrl,
            user.PortfolioUrl,
            user.CreatedAt,
            user.GitHubSyncedAt,
            user.Projects
                .OrderByDescending(p => p.Stars)
                .ThenByDescending(p => p.PushedAt)
                .Select(GitHubService.ToDto)
                .ToList(),
            theirListings.Select(l => listings.ToDto(l, viewer, viewerId)).ToList(),
            new ProfileStatsDto(theirListings.Count, accepted, user.Projects.Count, user.Competencies.Count),
            viewerId == userId,
            await CanSeeContactAsync(userId, viewerId)
                ? new ContactDto(user.Email, user.ContactHandle)
                : null);
    }

    /// <summary>
    /// Contact details stay hidden until two people have actually agreed to work together,
    /// which matters because many users here are under 18.
    /// </summary>
    public async Task<bool> CanSeeContactAsync(int userId, int? viewerId)
    {
        if (viewerId is null)
        {
            return false;
        }
        if (viewerId == userId)
        {
            return true;
        }

        return await db.Applications.AnyAsync(a => a.Status == ApplicationStatus.Accepted
            && ((a.ApplicantId == userId && a.Listing.OwnerId == viewerId)
                || (a.ApplicantId == viewerId && a.Listing.OwnerId == userId)));
    }
}
