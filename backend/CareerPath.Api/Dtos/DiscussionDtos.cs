using System.ComponentModel.DataAnnotations;
using CareerPath.Api.Models;

namespace CareerPath.Api.Dtos;

public record AuthorDto(int Id, string DisplayName, UserRole Role, string? ExpertTitle);

public record TopicSummaryDto(
    int Id,
    string Title,
    TopicKind Kind,
    string Excerpt,
    AuthorDto Author,
    DateTime CreatedAt,
    DateTime LastActivityAt,
    int ReplyCount,
    bool HasExpertReply,
    string SubFieldSlug,
    string SubFieldName,
    string FieldSlug);

public record ReplyDto(int Id, string Body, AuthorDto Author, DateTime CreatedAt);

public record TopicDetailDto(
    int Id,
    string Title,
    TopicKind Kind,
    string Body,
    AuthorDto Author,
    DateTime CreatedAt,
    string SubFieldSlug,
    string SubFieldName,
    string FieldSlug,
    List<ReplyDto> Replies);

public record CreateTopicRequest(
    [Required, StringLength(140, MinimumLength = 5)] string Title,
    [Required, StringLength(5000, MinimumLength = 10)] string Body,
    TopicKind Kind = TopicKind.Question);

public record CreateReplyRequest(
    [Required, StringLength(5000, MinimumLength = 2)] string Body);
