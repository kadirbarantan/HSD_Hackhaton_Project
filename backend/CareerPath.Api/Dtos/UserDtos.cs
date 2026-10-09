using System.ComponentModel.DataAnnotations;
using CareerPath.Api.Models;

namespace CareerPath.Api.Dtos;

public record CompetencyDto(int Id, string Slug, string Name, string Category, string Icon, string Description);

public record UserCompetencyDto(string Slug, string Name, string Category, string Icon, CompetencyLevel Level);

public record GitHubProjectDto(
    int Id,
    string Name,
    string? Description,
    string? Language,
    List<string> Topics,
    int Stars,
    int Forks,
    string Url,
    DateTime? PushedAt,
    bool IsDisplayed = true,
    bool IsPrivate = false);

public record UserSummaryDto(
    int Id,
    string DisplayName,
    string Headline,
    string? Location,
    string? University,
    string? Program,
    int? StudyYear,
    List<string> Skills,
    List<UserCompetencyDto> Competencies,
    bool OpenToJoin,
    string LookingForNote,
    int WeeklyHours,
    string? GitHubUsername,
    int ProjectCount);

public record ProfileStatsDto(int Listings, int Collaborations, int Projects, int Competencies);

public record ContactDto(string Email, string? ContactHandle);

public record UserProfileDto(
    UserSummaryDto User,
    string Bio,
    string? LinkedInUrl,
    string? PortfolioUrl,
    DateTime JoinedAt,
    DateTime? GitHubSyncedAt,
    List<GitHubProjectDto> Projects,
    List<ListingDto> Listings,
    ProfileStatsDto Stats,
    bool IsSelf,
    ContactDto? Contact,
    List<GitHubProjectDto>? AllProjects = null);

public record CompetencyChoice(
    [Required] string Slug,
    CompetencyLevel Level);

public record UpdateProfileRequest(
    [Required, StringLength(60, MinimumLength = 2)] string DisplayName,
    [StringLength(120)] string? Headline,
    [StringLength(1000)] string? Bio,
    [StringLength(60)] string? Location,
    [StringLength(80)] string? University,
    [StringLength(80)] string? Program,
    [Range(1, 6)] int? StudyYear,
    List<string>? Skills,
    List<CompetencyChoice>? Competencies,
    [Range(0, 60)] int WeeklyHours,
    bool OpenToJoin,
    [StringLength(280)] string? LookingForNote,
    [StringLength(39)] string? GitHubUsername,
    [StringLength(200)] string? LinkedInUrl,
    [StringLength(200)] string? PortfolioUrl,
    [StringLength(80)] string? ContactHandle,
    List<string>? DisplayedProjects = null,
    List<int>? DisplayedProjectIds = null);

public record UpdateDisplayedProjectsRequest(
    List<string>? DisplayedProjects = null,
    List<int>? DisplayedProjectIds = null);

/// <summary>Result of importing public repositories from the GitHub REST API.</summary>
public record GitHubSyncResultDto(
    bool Success,
    string? Error,
    string? Username,
    int ImportedCount,
    DateTime? SyncedAt,
    List<GitHubProjectDto> Projects);

/// <summary>A person worth inviting to one of the viewer's own listings.</summary>
public record SuggestionDto(UserSummaryDto User, int ListingId, string ListingTitle, MatchDto Match);

public record PlatformStatsDto(int Members, int OpenListings, int Competencies, int Collaborations, int Projects);
