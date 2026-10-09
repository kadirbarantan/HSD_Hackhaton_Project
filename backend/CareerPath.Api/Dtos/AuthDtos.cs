using System.ComponentModel.DataAnnotations;
using CareerPath.Api.Models;

namespace CareerPath.Api.Dtos;

public record RegisterRequest(
    [Required, EmailAddress, StringLength(254)] string Email,
    [Required, StringLength(100, MinimumLength = 6)] string Password,
    [Required, StringLength(60, MinimumLength = 2)] string DisplayName);

public record LoginRequest(
    [Required] string Email,
    [Required] string Password);

public record MeDto(
    int Id,
    string Email,
    string DisplayName,
    UserRole Role,
    string? ExpertTitle,
    List<string> InterestSlugs,
    int Xp,
    int Level,
    string LevelTitle,
    int XpPerLevel,
    int PendingRequests);

public record AuthResponse(string Token, MeDto User);
