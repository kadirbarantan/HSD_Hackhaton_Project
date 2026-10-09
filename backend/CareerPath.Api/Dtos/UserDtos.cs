using System.ComponentModel.DataAnnotations;
using CareerPath.Api.Models;

namespace CareerPath.Api.Dtos;

public record InterestDto(string Slug, string Name, string FieldSlug);

public record UserSummaryDto(
    int Id,
    string DisplayName,
    string Headline,
    UserRole Role,
    string? ExpertTitle,
    string? Location,
    List<string> Skills,
    List<InterestDto> Interests,
    bool OpenToCollaborate,
    string CollaborationNote,
    int Xp,
    int Level,
    string LevelTitle);

public record PathProgressDto(string Slug, string Name, string FieldSlug, int Completed, int Total);

public record ProfileTopicDto(int Id, string Title, string SubFieldName, DateTime CreatedAt, int ReplyCount);

public record ProfileStatsDto(int StepsCompleted, int Topics, int Replies, int Collaborations);

public enum ConnectionState
{
    None,
    Self,
    Outgoing,
    Incoming,
    Connected,
}

public record ConnectionDto(ConnectionState State, int? RequestId);

public record ContactDto(string Email, string? ContactHandle);

public record UserProfileDto(
    UserSummaryDto User,
    string Bio,
    string? GitHubUrl,
    string? LinkedInUrl,
    DateTime JoinedAt,
    List<PathProgressDto> Paths,
    List<ProfileTopicDto> RecentTopics,
    ProfileStatsDto Stats,
    int XpPerLevel,
    ConnectionDto Connection,
    ContactDto? Contact);

public record UpdateProfileRequest(
    [Required, StringLength(60, MinimumLength = 2)] string DisplayName,
    [StringLength(120)] string? Headline,
    [StringLength(1000)] string? Bio,
    [StringLength(60)] string? Location,
    List<string>? Skills,
    List<string>? InterestSlugs,
    bool OpenToCollaborate,
    [StringLength(280)] string? CollaborationNote,
    [StringLength(200)] string? GitHubUrl,
    [StringLength(200)] string? LinkedInUrl,
    [StringLength(80)] string? ContactHandle);

public record SuggestionDto(UserSummaryDto User, string MatchLabel, List<string> Reasons);
