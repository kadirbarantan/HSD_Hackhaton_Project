using System.ComponentModel.DataAnnotations;
using CareerPath.Api.Models;

namespace CareerPath.Api.Dtos;

public record ReviewPointDto(string Title, string Detail);

/// <summary>What an LLM (or the rule-based writer) returns about one applicant.</summary>
public record AiReviewContent(
    string Verdict,
    string Summary,
    List<ReviewPointDto> Strengths,
    List<ReviewPointDto> Risks,
    List<string> Questions,
    string SuggestedFirstTask);

public record AiReviewDto(
    AiReviewContent Content,
    string Source,
    bool IsAi,
    int MatchScore,
    DateTime CreatedAt);

public record ApplicationDto(
    int Id,
    int ListingId,
    string ListingTitle,
    UserSummaryDto Applicant,
    UserSummaryDto Owner,
    ApplicationOrigin Origin,
    string Message,
    ApplicationStatus Status,
    DateTime CreatedAt,
    DateTime? RespondedAt,
    MatchDto Match,
    bool CanDecide,
    bool CanWithdraw,
    AiReviewDto? Review,
    ContactDto? Contact);

public record ApplyRequest(
    [Required, StringLength(800, MinimumLength = 20)] string Message);

public record InviteRequest(
    [Range(1, int.MaxValue)] int UserId,
    [Required, StringLength(800, MinimumLength = 20)] string Message);
