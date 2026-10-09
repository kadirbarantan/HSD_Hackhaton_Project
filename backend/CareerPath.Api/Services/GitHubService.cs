using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using CareerPath.Api.Data;
using CareerPath.Api.Dtos;
using CareerPath.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CareerPath.Api.Services;

/// <summary>
/// Imports a student's public repositories from the GitHub REST API so their profile shows real,
/// verifiable work instead of a self-written skill list. Results are cached in our database, so
/// profiles and match scoring keep working when GitHub is slow, rate limited or unreachable.
/// </summary>
public class GitHubService(HttpClient http, AppDbContext db, ILogger<GitHubService> logger)
{
    public const int MaxDisplayedProjects = 10;
    public const int MaxImportedProjects = 50;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };

    public async Task<GitHubSyncResultDto> SyncAsync(User user, CancellationToken cancellationToken)
    {
        var username = user.GitHubUsername;
        if (string.IsNullOrWhiteSpace(username))
        {
            return Failed(null, "Add your GitHub username to your profile first.");
        }
        if (!IsValidUsername(username))
        {
            return Failed(username, $"\"{username}\" is not a valid GitHub username.");
        }

        List<RepoResponse> repos;
        try
        {
            using var response = await http.GetAsync(
                $"users/{Uri.EscapeDataString(username)}/repos?per_page=100&sort=pushed&type=owner",
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return Failed(username, DescribeFailure(response));
            }

            repos = await response.Content.ReadFromJsonAsync<List<RepoResponse>>(JsonOptions, cancellationToken) ?? [];
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
        {
            logger.LogWarning(exception, "Could not reach the GitHub API for {Username}.", username);
            return Failed(username, "Could not reach GitHub. Check your connection and try again.");
        }

        var existing = await db.GitHubProjects.Where(p => p.UserId == user.Id).ToListAsync(cancellationToken);
        var previouslyDisplayed = existing
            .Where(p => p.IsDisplayed && !p.IsPrivate)
            .Select(p => p.Url)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var publicRepos = repos
            .Where(repo => !repo.Fork && !repo.Archived && !repo.Private)
            .OrderByDescending(repo => repo.StargazersCount)
            .ThenByDescending(repo => repo.PushedAt)
            .Take(MaxImportedProjects)
            .ToList();

        var displayedCount = 0;
        var picked = new List<GitHubProject>();

        foreach (var repo in publicRepos)
        {
            bool isDisplayed;
            if (previouslyDisplayed.Count > 0)
            {
                isDisplayed = previouslyDisplayed.Contains(repo.HtmlUrl) && displayedCount < MaxDisplayedProjects;
            }
            else
            {
                isDisplayed = displayedCount < MaxDisplayedProjects;
            }

            if (isDisplayed)
            {
                displayedCount++;
            }

            picked.Add(new GitHubProject
            {
                UserId = user.Id,
                Name = repo.Name,
                Description = Truncate(repo.Description, 200),
                Language = repo.Language,
                Topics = repo.Topics ?? [],
                Stars = repo.StargazersCount,
                Forks = repo.ForksCount,
                Url = repo.HtmlUrl,
                PushedAt = repo.PushedAt?.UtcDateTime,
                IsDisplayed = isDisplayed,
                IsPrivate = false,
            });
        }

        db.GitHubProjects.RemoveRange(existing);
        db.GitHubProjects.AddRange(picked);
        user.GitHubSyncedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Imported {Count} repositories for {Username} ({Displayed} displayed).", picked.Count, username, displayedCount);
        return new GitHubSyncResultDto(true, null, username, picked.Count, user.GitHubSyncedAt, picked.Select(ToDto).ToList());
    }

    public static GitHubProjectDto ToDto(GitHubProject project) => new(
        project.Id,
        project.Name,
        project.Description,
        project.Language,
        project.Topics,
        project.Stars,
        project.Forks,
        project.Url,
        project.PushedAt,
        project.IsDisplayed,
        project.IsPrivate);

    private static GitHubSyncResultDto Failed(string? username, string error) =>
        new(false, error, username, 0, null, []);

    private static string DescribeFailure(HttpResponseMessage response) => response.StatusCode switch
    {
        HttpStatusCode.NotFound => "GitHub does not know this username.",
        HttpStatusCode.Forbidden or HttpStatusCode.TooManyRequests =>
            "GitHub is rate limiting us. Wait a few minutes, or set a GitHub:Token in configuration.",
        _ => $"GitHub replied with {(int)response.StatusCode}.",
    };

    private static bool IsValidUsername(string username) =>
        username.Length <= 39 && username.All(c => char.IsAsciiLetterOrDigit(c) || c == '-');

    private static string? Truncate(string? value, int max) =>
        value is null || value.Length <= max ? value : value[..max];

    private record RepoResponse(
        string Name,
        string? Description,
        string? Language,
        List<string>? Topics,
        [property: JsonPropertyName("stargazers_count")] int StargazersCount,
        [property: JsonPropertyName("forks_count")] int ForksCount,
        [property: JsonPropertyName("html_url")] string HtmlUrl,
        DateTimeOffset? PushedAt,
        bool Fork,
        bool Archived,
        bool Private);
}
