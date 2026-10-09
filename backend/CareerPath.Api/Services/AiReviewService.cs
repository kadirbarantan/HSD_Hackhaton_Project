using System.Text;
using System.Text.Json;
using CareerPath.Api.Dtos;
using CareerPath.Api.Models;
using Microsoft.Extensions.Options;

namespace CareerPath.Api.Services;

public class AiOptions
{
    /// <summary>Leave empty to run entirely on the built-in rule-based writer.</summary>
    public string ApiKey { get; set; } = "";

    /// <summary>Any OpenAI-compatible endpoint works: OpenAI, Azure OpenAI, Groq, OpenRouter, Ollama.</summary>
    public string BaseUrl { get; set; } = "https://api.openai.com/v1/";

    public string Model { get; set; } = "gpt-4o-mini";
    public int TimeoutSeconds { get; set; } = 25;

    public bool Enabled => !string.IsNullOrWhiteSpace(ApiKey);
}

/// <summary>
/// Writes the suitability report a listing owner reads before answering an application.
/// Uses a language model when one is configured and falls back to a deterministic writer
/// otherwise, so the feature always produces something useful, offline and during a demo.
/// </summary>
public class AiReviewService(HttpClient http, IOptions<AiOptions> options, ILogger<AiReviewService> logger)
{
    public const string RuleBasedSource = "Rule-based";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<(AiReviewContent Content, string Source)> WriteAsync(
        Application application,
        MatchDto match,
        CancellationToken cancellationToken)
    {
        var brief = BuildBrief(application, match);

        if (options.Value.Enabled)
        {
            try
            {
                var content = await AskModelAsync(brief, cancellationToken);
                if (content is not null)
                {
                    return (content, options.Value.Model);
                }
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "The language model call failed; falling back to the rule-based review.");
            }
        }

        return (WriteWithRules(application, match), RuleBasedSource);
    }

    // ---------------------------------------------------------------- language model

    private const string SystemPrompt = """
        You advise student developers who are choosing collaborators for side projects. You receive a
        project listing and one person who wants to join it. Judge how well that person suits THIS
        project and write it up for the project owner.

        Rules:
        - Use only facts from the brief. Never invent repositories, grades, jobs or experience.
        - Be concrete. Name the repositories, competency levels and technologies you are reasoning from.
        - Be honest. If there is a real risk, say it plainly. Do not flatter.
        - Write to the owner in plain English, second person ("you"), no jargon, no emoji.

        Reply with JSON only, exactly this shape:
        {
          "verdict": "Strong fit" | "Good fit" | "Possible fit" | "Weak fit",
          "summary": "2-3 sentences for the owner",
          "strengths": [{ "title": "max 8 words", "detail": "one sentence" }],
          "risks": [{ "title": "max 8 words", "detail": "one sentence" }],
          "questions": ["something to ask before deciding"],
          "suggestedFirstTask": "one sentence proposing a small first piece of work"
        }
        Give 2 to 4 strengths, 1 to 4 risks and 2 to 4 questions.
        """;

    private async Task<AiReviewContent?> AskModelAsync(string brief, CancellationToken cancellationToken)
    {
        var request = new
        {
            model = options.Value.Model,
            temperature = 0.3,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new { role = "system", content = SystemPrompt },
                new { role = "user", content = brief },
            },
        };

        using var response = await http.PostAsJsonAsync("chat/completions", request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning(
                "The language model replied with {Status}: {Body}",
                (int)response.StatusCode,
                await response.Content.ReadAsStringAsync(cancellationToken));
            return null;
        }

        var completion = await response.Content.ReadFromJsonAsync<ChatCompletion>(JsonOptions, cancellationToken);
        var json = completion?.Choices.FirstOrDefault()?.Message.Content;
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        var content = JsonSerializer.Deserialize<AiReviewContent>(json, JsonOptions);
        return content is null || string.IsNullOrWhiteSpace(content.Summary) ? null : content;
    }

    private record ChatCompletion(List<Choice> Choices);

    private record Choice(Message Message);

    private record Message(string? Content);

    // ---------------------------------------------------------------- shared brief

    private static string BuildBrief(Application application, MatchDto match)
    {
        var listing = application.Listing;
        var applicant = application.Applicant;
        var brief = new StringBuilder();

        brief.AppendLine("PROJECT");
        brief.AppendLine($"Title: {listing.Title}");
        brief.AppendLine($"Summary: {listing.Summary}");
        if (!string.IsNullOrWhiteSpace(listing.Description))
        {
            brief.AppendLine($"Details: {listing.Description}");
        }
        brief.AppendLine($"Looking for: {DescribeNeeds(listing)}");
        brief.AppendLine($"Stack: {Or(string.Join(", ", listing.Stack), "not specified")}");
        brief.AppendLine($"Commitment: {listing.HoursPerWeek} hours a week, {Or(listing.Timeline, "open-ended")}, team of {listing.TeamSize}");
        brief.AppendLine($"The owner already covers: {Or(DescribeCompetencies(listing.Owner), "nothing listed")}");

        brief.AppendLine();
        brief.AppendLine("APPLICANT");
        brief.AppendLine($"Name: {applicant.DisplayName}");
        brief.AppendLine($"Headline: {Or(applicant.Headline, "none")}");
        brief.AppendLine($"Studying: {Or(DescribeStudies(applicant), "not stated")}");
        brief.AppendLine($"Available: {(applicant.WeeklyHours > 0 ? $"{applicant.WeeklyHours} hours a week" : "not stated")}");
        brief.AppendLine($"Competencies: {Or(DescribeCompetencies(applicant), "none listed")}");
        brief.AppendLine($"Skills: {Or(string.Join(", ", applicant.Skills), "none listed")}");
        if (!string.IsNullOrWhiteSpace(applicant.Bio))
        {
            brief.AppendLine($"About: {applicant.Bio}");
        }

        brief.AppendLine(applicant.Projects.Count == 0
            ? "Public repositories: none imported from GitHub"
            : "Public repositories:");
        foreach (var project in applicant.Projects.OrderByDescending(p => p.Stars).Take(8))
        {
            brief.AppendLine($"  - {project.Name}: {Or(project.Language, "unknown language")}, "
                + $"{project.Stars} stars. {Or(project.Description, "No description.")}");
        }

        brief.AppendLine();
        brief.AppendLine(application.Origin == ApplicationOrigin.Invited
            ? "NOTE: the owner invited this person, they did not apply on their own."
            : "Their message to the owner:");
        brief.AppendLine($"\"{application.Message}\"");

        brief.AppendLine();
        brief.AppendLine($"OUR MATCH SCORE: {match.Score}/100 ({match.Label})");
        foreach (var part in match.Parts)
        {
            brief.AppendLine($"  - {part.Name}: {part.Score}/{part.Max} ({part.Detail})");
        }
        foreach (var reason in match.Reasons)
        {
            brief.AppendLine($"  - {reason.Kind}: {reason.Title}. {reason.Detail}");
        }

        return brief.ToString();
    }

    // ---------------------------------------------------------------- rule-based writer

    private static AiReviewContent WriteWithRules(Application application, MatchDto match)
    {
        var listing = application.Listing;
        var applicant = application.Applicant;
        var firstName = MatchService.FirstName(applicant.DisplayName);

        var covered = listing.Needs
            .Where(need => applicant.Competencies.Any(c => c.CompetencyId == need.CompetencyId))
            .ToList();
        var missingPrimary = listing.Needs
            .Where(need => need.IsPrimary && applicant.Competencies.All(c => c.CompetencyId != need.CompetencyId))
            .ToList();

        var strengths = match.Reasons
            .Where(r => r.Kind == MatchReasonKind.Strength)
            .Select(r => new ReviewPointDto(r.Title, r.Detail))
            .ToList();
        var risks = match.Reasons
            .Where(r => r.Kind == MatchReasonKind.Gap)
            .Select(r => new ReviewPointDto(r.Title, r.Detail))
            .ToList();

        if (DescribeStudies(applicant) is { Length: > 0 } studies)
        {
            strengths.Insert(0, new ReviewPointDto("Relevant background", $"{firstName} is studying {studies}."));
        }
        if (risks.Count == 0)
        {
            risks.Add(new ReviewPointDto(
                "Nothing obvious on paper",
                $"The profile covers what you asked for, so the open question is how {firstName} works in a team."));
        }

        var summary = new StringBuilder();
        summary.Append($"{firstName} scores {match.Score} out of 100 for this listing, which we read as a {match.Label.ToLowerInvariant()}. ");
        summary.Append(covered.Count > 0
            ? $"They cover {MatchService.JoinList(covered.Select(n => n.Competency.Name))}"
            : "They do not list any of the areas you asked for");
        summary.Append(applicant.Projects.Count > 0
            ? $" and have {applicant.Projects.Count} public {(applicant.Projects.Count == 1 ? "repository" : "repositories")} to look at. "
            : " and have no public code to look at yet. ");
        summary.Append(missingPrimary.Count > 0
            ? $"Before you decide, settle how {MatchService.JoinList(missingPrimary.Select(n => n.Competency.Name))} would get done."
            : "The main thing left to check is whether your working styles and schedules line up.");

        return new AiReviewContent(
            match.Label,
            summary.ToString(),
            strengths.Take(4).ToList(),
            risks.Take(4).ToList(),
            BuildQuestions(application, firstName, missingPrimary),
            SuggestFirstTask(application, firstName, covered, missingPrimary));
    }

    private static List<string> BuildQuestions(Application application, string firstName, List<ListingNeed> missingPrimary)
    {
        var applicant = application.Applicant;
        var listing = application.Listing;
        var questions = new List<string>();

        foreach (var need in missingPrimary.Take(2))
        {
            questions.Add($"You need {need.Competency.Name} and {firstName} does not list it. "
                + "Ask whether they would pick it up, or whether you need a third person.");
        }

        var learning = applicant.Competencies
            .Where(c => c.Level == CompetencyLevel.Learning && listing.Needs.Any(n => n.CompetencyId == c.CompetencyId))
            .Select(c => c.Competency.Name)
            .ToList();
        if (learning.Count > 0)
        {
            questions.Add($"{firstName} marks {MatchService.JoinList(learning)} as still learning. "
                + "Ask what they have actually built with it.");
        }

        if (applicant.Projects.Count == 0)
        {
            questions.Add($"There is no public code on {firstName}'s profile. "
                + "Ask for anything they have built, including coursework.");
        }

        if (applicant.WeeklyHours > 0 && applicant.WeeklyHours < listing.HoursPerWeek)
        {
            questions.Add($"{firstName} has {applicant.WeeklyHours} hours a week and you asked for {listing.HoursPerWeek}. "
                + "Ask whether that is a hard limit or just exam season.");
        }

        // Always leave the owner with at least three things to raise, even for a perfect-looking profile.
        string[] always =
        [
            $"Ask what {firstName} wants out of this: a portfolio piece, a grade, or something people actually use.",
            "Ask how they prefer to work, whether that is scheduled calls, messages or long weekend sessions.",
            "Agree who owns which part and how often you check in, before either of you writes anything.",
        ];
        questions.AddRange(always.Take(Math.Max(0, 3 - questions.Count)));

        return questions.Take(4).ToList();
    }

    private static string SuggestFirstTask(
        Application application,
        string firstName,
        List<ListingNeed> covered,
        List<ListingNeed> missingPrimary)
    {
        if (covered.Count == 0)
        {
            var area = missingPrimary.FirstOrDefault()?.Competency.Name ?? application.Listing.Needs[0].Competency.Name;
            return $"Before committing, agree a small trial task in {area} that {firstName} can finish in a week, then review it together.";
        }

        var strongest = covered
            .OrderByDescending(need => application.Applicant.Competencies
                .Where(c => c.CompetencyId == need.CompetencyId)
                .Select(c => MatchService.LevelFactor(c.Level))
                .FirstOrDefault())
            .First();

        return $"Hand {firstName} one self-contained piece of {strongest.Competency.Name.ToLowerInvariant()} "
            + "they can finish in about a week, so you both find out how the other works before the project grows.";
    }

    // ---------------------------------------------------------------- formatting helpers

    private static string DescribeNeeds(Listing listing) => MatchService.JoinList(
        listing.Needs.Select(n => $"{n.Competency.Name} ({(n.IsPrimary ? "must-have" : "nice to have")})"));

    private static string DescribeCompetencies(User user) => string.Join(
        ", ",
        user.Competencies.Select(c => $"{c.Competency.Name} ({MatchService.LevelWord(c.Level)})"));

    private static string DescribeStudies(User user)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(user.Program))
        {
            parts.Add(user.Program);
        }
        if (user.StudyYear is { } year)
        {
            parts.Add($"year {year}");
        }
        if (!string.IsNullOrWhiteSpace(user.University))
        {
            parts.Add($"at {user.University}");
        }
        return string.Join(", ", parts);
    }

    private static string Or(string? value, string fallback) => string.IsNullOrWhiteSpace(value) ? fallback : value;
}
