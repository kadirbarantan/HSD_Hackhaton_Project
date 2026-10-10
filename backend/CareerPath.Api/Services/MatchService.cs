using CareerPath.Api.Dtos;
using CareerPath.Api.Models;

namespace CareerPath.Api.Services;

/// <summary>
/// Scores how well a student fits a project listing, out of 100. The score is split into four
/// parts and every part explains itself, so an owner can see exactly why someone ranks where they do.
/// Entities must be loaded with their competencies and projects before they are scored.
/// </summary>
public class MatchService
{
    /// <summary>Who is reading the score. The same numbers are shown to both sides of a request.</summary>
    public enum MatchVoice
    {
        /// <summary>The listing owner, weighing up someone else.</summary>
        Owner,

        /// <summary>The applicant, looking at a project that is not theirs.</summary>
        Applicant,
    }

    /// <summary>Picks between the two ways of writing the same reason, so neither side reads about itself in the third person.</summary>
    private readonly record struct Voice(MatchVoice Reader, string Name)
    {
        public string Pick(string toOwner, string toApplicant) => Reader == MatchVoice.Owner ? toOwner : toApplicant;
    }

    public const int NeedsMax = 55;
    public const int StackMax = 20;
    public const int EvidenceMax = 15;
    public const int AvailabilityMax = 10;

    private static readonly Dictionary<string, string> Aliases = new()
    {
        ["js"] = "javascript",
        ["ts"] = "typescript",
        ["py"] = "python",
        ["csharp"] = "c#",
        ["dotnet"] = ".net",
        ["postgres"] = "postgresql",
        ["k8s"] = "kubernetes",
        ["reactjs"] = "react",
        ["nodejs"] = "node",
        ["tailwindcss"] = "tailwind",
    };

    public MatchDto Score(User applicant, Listing listing, MatchVoice reader = MatchVoice.Owner)
    {
        var parts = new List<MatchPartDto>();
        var reasons = new List<MatchReasonDto>();
        var voice = new Voice(reader, FirstName(applicant.DisplayName));

        parts.Add(ScoreNeeds(applicant, listing, voice, reasons));
        parts.Add(ScoreStack(applicant, listing, voice, reasons));
        parts.Add(ScoreEvidence(applicant, listing, voice, reasons));
        parts.Add(ScoreAvailability(applicant, listing, voice, reasons));

        AddComplementaryReason(applicant, listing, voice, reasons);

        var total = parts.Sum(p => p.Score);
        return new MatchDto(total, LabelFor(total), parts, reasons);
    }

    private static MatchPartDto ScoreNeeds(User applicant, Listing listing, Voice voice, List<MatchReasonDto> reasons)
    {
        var levels = applicant.Competencies.ToDictionary(c => c.CompetencyId, c => c.Level);
        var covered = new List<(ListingNeed Need, CompetencyLevel Level)>();
        var missing = new List<ListingNeed>();
        double earned = 0;
        double possible = 0;

        foreach (var need in listing.Needs)
        {
            var weight = need.IsPrimary ? 2d : 1d;
            possible += weight;
            if (levels.TryGetValue(need.CompetencyId, out var level))
            {
                earned += weight * LevelFactor(level);
                covered.Add((need, level));
            }
            else
            {
                missing.Add(need);
            }
        }

        var score = possible == 0 ? NeedsMax : (int)Math.Round(NeedsMax * earned / possible);

        if (covered.Count > 0)
        {
            reasons.Add(new MatchReasonDto(
                MatchReasonKind.Strength,
                voice.Pick(
                    $"Covers {covered.Count} of {listing.Needs.Count} areas you need",
                    $"You cover {covered.Count} of {listing.Needs.Count} areas this project needs"),
                JoinList(covered.Select(c => $"{c.Need.Competency.Name} ({LevelWord(c.Level)})"))));
        }

        var missingPrimary = missing.Where(n => n.IsPrimary).ToList();
        if (missingPrimary.Count > 0)
        {
            var these = missingPrimary.Count == 1 ? "this" : "these";
            reasons.Add(new MatchReasonDto(
                MatchReasonKind.Gap,
                $"Missing {JoinList(missingPrimary.Select(n => n.Competency.Name))}",
                voice.Pick($"You marked {these} as a must-have.", $"The owner marked {these} as a must-have.")));
        }

        var missingExtra = missing.Where(n => !n.IsPrimary).ToList();
        if (missingExtra.Count > 0)
        {
            reasons.Add(new MatchReasonDto(
                MatchReasonKind.Gap,
                $"Does not cover {JoinList(missingExtra.Select(n => n.Competency.Name))}",
                "Nice to have rather than essential."));
        }

        var learning = covered.Where(c => c.Level == CompetencyLevel.Learning).ToList();
        if (learning.Count > 0)
        {
            reasons.Add(new MatchReasonDto(
                MatchReasonKind.Gap,
                $"Still learning {JoinList(learning.Select(c => c.Need.Competency.Name))}",
                voice.Pick(
                    $"{voice.Name} has it on their profile but rates it as a beginner level.",
                    "It is on your profile, but you rated it as a beginner level.")));
        }

        return new MatchPartDto("Needed areas", score, NeedsMax, $"{covered.Count} of {listing.Needs.Count} covered");
    }

    private static MatchPartDto ScoreStack(User applicant, Listing listing, Voice voice, List<MatchReasonDto> reasons)
    {
        var vocabulary = Vocabulary(applicant);
        var matched = listing.Stack.Where(tech => vocabulary.Contains(Normalize(tech))).ToList();

        if (listing.Stack.Count == 0)
        {
            return new MatchPartDto("Shared technologies", (int)(StackMax * 0.6), StackMax, "No stack listed on this project");
        }

        var score = (int)Math.Round((double)StackMax * matched.Count / listing.Stack.Count);

        if (matched.Count > 0)
        {
            reasons.Add(new MatchReasonDto(
                MatchReasonKind.Strength,
                voice.Pick($"Already works with {JoinList(matched.Take(4))}", $"You already work with {JoinList(matched.Take(4))}"),
                voice.Pick($"From {voice.Name}'s skills and imported repositories.", "From your skills and imported repositories.")));
        }
        else
        {
            reasons.Add(new MatchReasonDto(
                MatchReasonKind.Gap,
                voice.Pick("No overlap with your stack yet", "No overlap with their stack yet"),
                voice.Pick(
                    $"Your project uses {JoinList(listing.Stack.Take(4))}, which {voice.Name} has not listed.",
                    $"This project uses {JoinList(listing.Stack.Take(4))}, none of which you have listed.")));
        }

        return new MatchPartDto("Shared technologies", score, StackMax, $"{matched.Count} of {listing.Stack.Count} matched");
    }

    private static MatchPartDto ScoreEvidence(User applicant, Listing listing, Voice voice, List<MatchReasonDto> reasons)
    {
        var publicProjects = applicant.Projects.Where(p => !p.IsPrivate).ToList();
        if (publicProjects.Count == 0)
        {
            reasons.Add(new MatchReasonDto(
                MatchReasonKind.Gap,
                "No public projects imported",
                voice.Pick(
                    $"{voice.Name} has not connected a GitHub account, so none of this is backed by code.",
                    "You have not connected a GitHub account, so none of this is backed by code.")));
            return new MatchPartDto("Proof of work", 0, EvidenceMax, "No repositories");
        }

        var wanted = listing.Stack.Select(Normalize)
            .Concat(listing.Needs.SelectMany(n => n.Competency.Keywords).Select(Normalize))
            .ToHashSet();

        var relevant = publicProjects
            .Where(p => Tags(p).Any(wanted.Contains))
            .OrderByDescending(p => p.Stars)
            .ThenByDescending(p => p.PushedAt)
            .ToList();

        var score = Math.Min(EvidenceMax, 4 + relevant.Count * 4);

        if (relevant.Count > 0)
        {
            reasons.Add(new MatchReasonDto(
                MatchReasonKind.Strength,
                $"{relevant.Count} public {(relevant.Count == 1 ? "repository fits" : "repositories fit")} this project",
                JoinList(relevant.Take(2).Select(DescribeProject))));
        }
        else
        {
            reasons.Add(new MatchReasonDto(
                MatchReasonKind.Gap,
                $"None of the {publicProjects.Count} imported repositories match this project",
                voice.Pick(
                    $"{voice.Name} writes code publicly, but not yet in your area.",
                    "You write code publicly, but not yet in this area.")));
        }

        return new MatchPartDto("Proof of work", score, EvidenceMax, $"{relevant.Count} relevant of {publicProjects.Count}");
    }

    private static MatchPartDto ScoreAvailability(User applicant, Listing listing, Voice voice, List<MatchReasonDto> reasons)
    {
        if (applicant.WeeklyHours <= 0)
        {
            reasons.Add(new MatchReasonDto(
                MatchReasonKind.Gap,
                "Availability unknown",
                voice.Pick(
                    $"{voice.Name} has not said how many hours a week they can give.",
                    "You have not said how many hours a week you can give.")));
            return new MatchPartDto("Availability", 4, AvailabilityMax, "Not stated");
        }

        var ratio = (double)applicant.WeeklyHours / Math.Max(1, listing.HoursPerWeek);
        var score = ratio switch
        {
            >= 1 => AvailabilityMax,
            >= 0.6 => 6,
            _ => 2,
        };

        var detail = voice.Pick(
            $"{applicant.WeeklyHours} h/week available, you asked for {listing.HoursPerWeek}",
            $"You have {applicant.WeeklyHours} h/week, this project asks for {listing.HoursPerWeek}");
        reasons.Add(ratio >= 1
            ? new MatchReasonDto(MatchReasonKind.Strength, "Has enough time", detail)
            : new MatchReasonDto(
                MatchReasonKind.Gap,
                voice.Pick("Less time than you asked for", "Less time than this project asks for"),
                detail));

        return new MatchPartDto("Availability", score, AvailabilityMax, $"{applicant.WeeklyHours} h/week");
    }

    /// <summary>
    /// The whole point of a listing is to find someone who covers what the owner cannot, so say
    /// so explicitly when the applicant brings something the owner does not have.
    /// </summary>
    private static void AddComplementaryReason(User applicant, Listing listing, Voice voice, List<MatchReasonDto> reasons)
    {
        if (listing.Owner?.Competencies is not { Count: > 0 } ownerCompetencies)
        {
            return;
        }

        // Anything already named in the needs is covered by the first reason, so only mention the rest.
        var accountedFor = ownerCompetencies.Select(c => c.CompetencyId)
            .Concat(listing.Needs.Select(n => n.CompetencyId))
            .ToHashSet();
        var extra = applicant.Competencies
            .Where(c => !accountedFor.Contains(c.CompetencyId) && c.Level != CompetencyLevel.Learning)
            .Select(c => c.Competency.Name)
            .Take(3)
            .ToList();

        if (extra.Count > 0)
        {
            reasons.Add(new MatchReasonDto(
                MatchReasonKind.Strength,
                voice.Pick("Brings areas you do not cover yourself", "You bring areas the owner does not cover"),
                voice.Pick($"{voice.Name} also offers {JoinList(extra)}.", $"You also offer {JoinList(extra)}.")));
        }
    }

    public static string DescribeProject(GitHubProject project)
    {
        var bits = new List<string>();
        if (project.Language is not null)
        {
            bits.Add(project.Language);
        }
        if (project.Stars > 0)
        {
            bits.Add($"{project.Stars} {(project.Stars == 1 ? "star" : "stars")}");
        }
        return bits.Count == 0 ? project.Name : $"{project.Name} ({string.Join(", ", bits)})";
    }

    /// <summary>Everything a user has claimed or published, normalised for comparison.</summary>
    public static HashSet<string> Vocabulary(User user) => user.Skills
        .Select(Normalize)
        .Concat(user.Projects.SelectMany(Tags))
        .Where(t => t.Length > 0)
        .ToHashSet();

    private static IEnumerable<string> Tags(GitHubProject project) =>
        project.Topics.Append(project.Language ?? "").Select(Normalize).Where(t => t.Length > 0);

    /// <summary>Lower-cases and strips punctuation so "Node.js", "node" and "NodeJS" all compare equal.</summary>
    public static string Normalize(string value)
    {
        var cleaned = new string(value.Where(c => char.IsLetterOrDigit(c) || c is '#' or '+').ToArray()).ToLowerInvariant();
        return Aliases.GetValueOrDefault(cleaned, cleaned);
    }

    public static double LevelFactor(CompetencyLevel level) => level switch
    {
        CompetencyLevel.Strong => 1.0,
        CompetencyLevel.Comfortable => 0.8,
        _ => 0.5,
    };

    public static string LevelWord(CompetencyLevel level) => level switch
    {
        CompetencyLevel.Strong => "strong",
        CompetencyLevel.Comfortable => "comfortable",
        _ => "learning",
    };

    public static string LabelFor(int score) => score switch
    {
        >= 75 => "Strong fit",
        >= 55 => "Good fit",
        >= 35 => "Possible fit",
        _ => "Weak fit",
    };

    public static string FirstName(string displayName) => displayName.Split(' ')[0];

    public static string JoinList(IEnumerable<string> values)
    {
        var list = values.ToList();
        return list.Count switch
        {
            0 => "",
            1 => list[0],
            _ => $"{string.Join(", ", list[..^1])} and {list[^1]}",
        };
    }
}
