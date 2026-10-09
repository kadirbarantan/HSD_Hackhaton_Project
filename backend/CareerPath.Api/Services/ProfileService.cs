using CareerPath.Api.Data;
using CareerPath.Api.Dtos;
using CareerPath.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CareerPath.Api.Services;

public class ProfileService(AppDbContext db)
{
    public async Task<Dictionary<int, UserStats>> GetStatsAsync(IEnumerable<int> userIds)
    {
        var ids = userIds.Distinct().ToList();

        var steps = await db.RoadmapProgress
            .Where(p => ids.Contains(p.UserId))
            .GroupBy(p => p.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count);

        var topics = await db.Topics
            .Where(t => ids.Contains(t.AuthorId))
            .GroupBy(t => t.AuthorId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count);

        var replies = await db.Replies
            .Where(r => ids.Contains(r.AuthorId))
            .GroupBy(r => r.AuthorId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count);

        var accepted = await db.CollaborationRequests
            .Where(c => c.Status == CollaborationStatus.Accepted && (ids.Contains(c.SenderId) || ids.Contains(c.ReceiverId)))
            .Select(c => new { c.SenderId, c.ReceiverId })
            .ToListAsync();
        var collaborations = accepted
            .SelectMany(c => new[] { c.SenderId, c.ReceiverId })
            .GroupBy(id => id)
            .ToDictionary(g => g.Key, g => g.Count());

        return ids.ToDictionary(id => id, id => new UserStats(
            steps.GetValueOrDefault(id),
            topics.GetValueOrDefault(id),
            replies.GetValueOrDefault(id),
            collaborations.GetValueOrDefault(id)));
    }

    public async Task<UserStats> GetStatsForUserAsync(int userId) => (await GetStatsAsync([userId]))[userId];

    public Task<Dictionary<string, InterestDto>> GetPathLookupAsync() =>
        db.SubFields.AsNoTracking()
            .OrderBy(s => s.Field.SortOrder).ThenBy(s => s.SortOrder)
            .Select(s => new InterestDto(s.Slug, s.Name, s.Field.Slug))
            .ToDictionaryAsync(s => s.Slug);

    /// <summary>Number of completed roadmap steps per (user, sub-field slug).</summary>
    public async Task<Dictionary<(int UserId, string Slug), int>> GetPathProgressAsync()
    {
        var rows = await db.RoadmapProgress
            .Select(p => new { p.UserId, p.RoadmapStep.SubField.Slug })
            .GroupBy(p => new { p.UserId, p.Slug })
            .Select(g => new { g.Key.UserId, g.Key.Slug, Count = g.Count() })
            .ToListAsync();

        return rows.ToDictionary(r => (r.UserId, r.Slug), r => r.Count);
    }

    /// <summary>
    /// People on each path: users who joined it or completed at least one of its steps.
    /// </summary>
    public async Task<Dictionary<string, HashSet<int>>> GetLearnersByPathAsync()
    {
        var interests = await db.Users.AsNoTracking().Select(u => new { u.Id, u.InterestSlugs }).ToListAsync();
        var progress = await db.RoadmapProgress
            .Select(p => new { p.UserId, p.RoadmapStep.SubField.Slug })
            .Distinct()
            .ToListAsync();

        var learners = new Dictionary<string, HashSet<int>>();
        void Add(string slug, int userId)
        {
            if (!learners.TryGetValue(slug, out var set))
            {
                learners[slug] = set = [];
            }
            set.Add(userId);
        }

        foreach (var user in interests)
        {
            foreach (var slug in user.InterestSlugs)
            {
                Add(slug, user.Id);
            }
        }
        foreach (var row in progress)
        {
            Add(row.Slug, row.UserId);
        }

        return learners;
    }

    public static UserSummaryDto ToSummary(User user, UserStats stats, IReadOnlyDictionary<string, InterestDto> paths)
    {
        var level = XpRules.LevelFor(stats.Xp);
        return new UserSummaryDto(
            user.Id,
            user.DisplayName,
            user.Headline,
            user.Role,
            user.ExpertTitle,
            user.Location,
            user.Skills,
            user.InterestSlugs.Where(paths.ContainsKey).Select(slug => paths[slug]).ToList(),
            user.OpenToCollaborate,
            user.CollaborationNote,
            stats.Xp,
            level,
            XpRules.TitleFor(level));
    }

    public async Task<List<UserSummaryDto>> ToSummariesAsync(IReadOnlyCollection<User> users)
    {
        if (users.Count == 0)
        {
            return [];
        }

        var stats = await GetStatsAsync(users.Select(u => u.Id));
        var paths = await GetPathLookupAsync();
        return users.Select(u => ToSummary(u, stats[u.Id], paths)).ToList();
    }

    public async Task<MeDto> GetMeAsync(User user)
    {
        var stats = await GetStatsForUserAsync(user.Id);
        var level = XpRules.LevelFor(stats.Xp);
        var pending = await db.CollaborationRequests
            .CountAsync(c => c.ReceiverId == user.Id && c.Status == CollaborationStatus.Pending);

        return new MeDto(
            user.Id,
            user.Email,
            user.DisplayName,
            user.Role,
            user.ExpertTitle,
            user.InterestSlugs,
            stats.Xp,
            level,
            XpRules.TitleFor(level),
            XpRules.XpPerLevel,
            pending);
    }

    public async Task<UserProfileDto?> GetProfileAsync(int userId, int? viewerId)
    {
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
        {
            return null;
        }

        var stats = await GetStatsForUserAsync(userId);
        var paths = await GetPathLookupAsync();

        var completedByPath = await db.RoadmapProgress
            .Where(p => p.UserId == userId)
            .Select(p => p.RoadmapStep.SubField.Slug)
            .GroupBy(slug => slug)
            .Select(g => new { Slug = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Slug, x => x.Count);

        var totals = await db.SubFields
            .OrderBy(s => s.Field.SortOrder).ThenBy(s => s.SortOrder)
            .Select(s => new { s.Slug, Total = s.RoadmapSteps.Count })
            .ToListAsync();

        var followed = user.InterestSlugs.Concat(completedByPath.Keys).ToHashSet();
        var pathProgress = totals
            .Where(t => followed.Contains(t.Slug) && paths.ContainsKey(t.Slug))
            .Select(t => new PathProgressDto(
                t.Slug,
                paths[t.Slug].Name,
                paths[t.Slug].FieldSlug,
                completedByPath.GetValueOrDefault(t.Slug),
                t.Total))
            .ToList();

        var recentTopics = await db.Topics
            .Where(t => t.AuthorId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(5)
            .Select(t => new ProfileTopicDto(t.Id, t.Title, t.SubField.Name, t.CreatedAt, t.Replies.Count))
            .ToListAsync();

        var (connection, showContact) = await GetConnectionAsync(userId, viewerId);

        return new UserProfileDto(
            ToSummary(user, stats, paths),
            user.Bio,
            user.GitHubUrl,
            user.LinkedInUrl,
            user.CreatedAt,
            pathProgress,
            recentTopics,
            new ProfileStatsDto(stats.StepsCompleted, stats.Topics, stats.Replies, stats.Collaborations),
            XpRules.XpPerLevel,
            connection,
            showContact ? new ContactDto(user.Email, user.ContactHandle) : null);
    }

    private async Task<(ConnectionDto Connection, bool ShowContact)> GetConnectionAsync(int userId, int? viewerId)
    {
        if (viewerId is null)
        {
            return (new ConnectionDto(ConnectionState.None, null), false);
        }
        if (viewerId == userId)
        {
            return (new ConnectionDto(ConnectionState.Self, null), true);
        }

        var request = await db.CollaborationRequests.AsNoTracking()
            .Where(c => c.Status != CollaborationStatus.Declined
                && ((c.SenderId == viewerId && c.ReceiverId == userId) || (c.SenderId == userId && c.ReceiverId == viewerId)))
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (request is null)
        {
            return (new ConnectionDto(ConnectionState.None, null), false);
        }
        if (request.Status == CollaborationStatus.Accepted)
        {
            return (new ConnectionDto(ConnectionState.Connected, request.Id), true);
        }

        var state = request.SenderId == viewerId ? ConnectionState.Outgoing : ConnectionState.Incoming;
        return (new ConnectionDto(state, request.Id), false);
    }
}
