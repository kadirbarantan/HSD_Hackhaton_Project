using System.ComponentModel.DataAnnotations;
using CareerPath.Api.Models;

namespace CareerPath.Api.Dtos;

public enum CollaborationDirection
{
    Incoming,
    Outgoing,
}

public record CollaborationDto(
    int Id,
    CollaborationDirection Direction,
    UserSummaryDto OtherUser,
    string Message,
    string? SubFieldSlug,
    string? SubFieldName,
    CollaborationStatus Status,
    DateTime CreatedAt,
    DateTime? RespondedAt,
    ContactDto? Contact);

public record CreateCollaborationRequest(
    [Range(1, int.MaxValue)] int ReceiverId,
    [Required, StringLength(500, MinimumLength = 10)] string Message,
    string? SubFieldSlug);
