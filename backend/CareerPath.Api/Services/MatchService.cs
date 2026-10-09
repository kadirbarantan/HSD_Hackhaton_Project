using CareerPath.Api.Data;
using CareerPath.Api.Dtos;
using CareerPath.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CareerPath.Api.Services;

/// <summary>
/// Suggests students to collaborate with, based on shared paths, similar progress and skills.
/// Every suggestion comes with human-readable reasons so the match is explainable.
/// </summary>
public class MatchService(AppDbContext db, ProfileService profiles)
{
    private const int SharedPathScore = 30;
    private const int SimilarStageScore = 15;
    private const int ComplementarySkillScore = 5;
    private const int CommonSkillScore = 3;

    public async Task<List<SuggestionDto>> GetSuggestionsAsync(int userId, int take = 6)
    {
        var users = await db.Users.AsNoTracking().ToListAsync();
        var me = users.FirstOrDefault(u => u.Id == userId);
        if (me is null)
        {
            return [];
        }

        var progress = await profiles.GetPathProgressAsync();
        var paths = await profiles.GetPathLookupAsync();
        var alreadyInTouch = (await db.CollaborationRequests
                .Where(c => c.Status != CollaborationStatus.Declined && (c.SenderId == userId || c.ReceiverId == userId))
                .Select(c => c.SenderId == userId ? c.ReceiverId : c.SenderId)
                .ToListAsync())
            .ToHashSet();

        HashSet<string> PathsOf(User user) => user.InterestSlugs
            .Concat(progress.Keys.Where(k => k.UserId == user.Id).Select(k => k.Slug))
            .Where(paths.ContainsKey)
            .ToHashSet();

        var myPaths = PathsOf(me);
        var mySkills = me.Skills.Select(Normalize).ToHashSet();

        var candidates = new List<(User User, int Score, List<string> Reasons)>();
        foreach (var other in users)
        {
            if (other.Id == userId || other.Role != UserRole.Student || !other.OpenToCollaborate || alreadyInTouch.Contains(other.Id))
            {
                continue;
            }

            var sharedPaths = PathsOf(other).Intersect(myPaths).ToList();
            var commonSkills = other.Skills.Where(s => mySkills.Contains(Normalize(s))).ToList();
            var newSkills = other.Skills.Where(s => !mySkills.Contains(Normalize(s))).ToList();
            if (sharedPaths.Count == 0 && commonSkills.Count == 0)
            {
                continue;
            }

            var score = 0;
            var reasons = new List<string>();

            if (sharedPaths.Count > 0)
            {
                score += SharedPathScore * sharedPaths.Count;
                reasons.Add($"Also on the {JoinNames(sharedPaths.Select(s => paths[s].Name))} path");

                var similarStage = sharedPaths.FirstOrDefault(slug =>
                {
                    var mine = progress.GetValueOrDefault((userId, slug));
                    var theirs = progress.GetValueOrDefault((other.Id, slug));
                    return mine + theirs > 0 && Math.Abs(mine - theirs) <= 1;
                });
                if (similarStage is not null)
                {
                    score += SimilarStageScore;
                    reasons.Add($"At a similar stage in {paths[similarStage].Name}");
                }
            }

            if (newSkills.Count > 0)
            {
                score += ComplementarySkillScore * Math.Min(newSkills.Count, 4);
                reasons.Add($"Brings skills you don't list: {string.Join(", ", newSkills.Take(3))}");
            }

            if (commonSkills.Count > 0)
            {
                score += CommonSkillScore * Math.Min(commonSkills.Count, 3);
                reasons.Add($"You both know {JoinNames(commonSkills.Take(2))}");
            }

            candidates.Add((other, score, reasons));
        }

        var top = candidates
            .OrderByDescending(c => c.Score)
            .ThenBy(c => c.User.DisplayName)
            .Take(take)
            .ToList();

        var summaries = await profiles.ToSummariesAsync(top.Select(c => c.User).ToList());
        return top.Select((c, i) => new SuggestionDto(summaries[i], LabelFor(c.Score), c.Reasons)).ToList();
    }

    private static string Normalize(string skill) => skill.Trim().ToLowerInvariant();

    private static string JoinNames(IEnumerable<string> names)
    {
        var list = names.ToList();
        return list.Count <= 1 ? string.Join("", list) : $"{string.Join(", ", list[..^1])} and {list[^1]}";
    }

    private static string LabelFor(int score) => score switch
    {
        >= 60 => "Great match",
        >= 35 => "Good match",
        _ => "Possible match",
    };
}
