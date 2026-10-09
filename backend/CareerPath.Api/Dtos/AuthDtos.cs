using System.ComponentModel.DataAnnotations;

namespace CareerPath.Api.Dtos;

public record RegisterRequest(
    [Required, EmailAddress, StringLength(254)] string Email,
    [Required, StringLength(100, MinimumLength = 6)] string Password,
    [Required, StringLength(60, MinimumLength = 2)] string DisplayName);

public record LoginRequest(
    [Required] string Email,
    [Required] string Password);

/// <param name="PendingDecisions">Requests waiting for this user's answer, across their listings and their invitations.</param>
public record MeDto(
    int Id,
    string Email,
    string DisplayName,
    bool OpenToJoin,
    int CompetencyCount,
    int OpenListings,
    int PendingDecisions);

public record AuthResponse(string Token, MeDto User);
