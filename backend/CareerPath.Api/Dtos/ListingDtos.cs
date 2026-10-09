using System.ComponentModel.DataAnnotations;
using CareerPath.Api.Models;

namespace CareerPath.Api.Dtos;

public record ListingNeedDto(string Slug, string Name, string Category, string Icon, bool IsPrimary);

/// <summary>Where the viewer stands with a listing, so the UI knows whether to offer "Apply".</summary>
public record ViewerApplicationDto(int Id, ApplicationOrigin Origin, ApplicationStatus Status);

public record ListingDto(
    int Id,
    string Title,
    string Summary,
    string Description,
    UserSummaryDto Owner,
    List<ListingNeedDto> Needs,
    List<string> Stack,
    string? ProjectUrl,
    int TeamSize,
    int HoursPerWeek,
    string Timeline,
    ListingStatus Status,
    string? OutcomeNote,
    DateTime CreatedAt,
    int ApplicationCount,
    /// <summary>Applications the owner still has to answer. Invitations are waiting on the other person, so they do not count.</summary>
    int PendingCount,
    bool IsOwner,
    MatchDto? Match,
    ViewerApplicationDto? MyApplication);

public record NeedRequest(
    [Required] string Slug,
    bool IsPrimary);

public record SaveListingRequest(
    [Required, StringLength(90, MinimumLength = 5)] string Title,
    [Required, StringLength(200, MinimumLength = 10)] string Summary,
    [StringLength(4000)] string? Description,
    [MinLength(1)] List<NeedRequest> Needs,
    List<string>? Stack,
    [StringLength(200)] string? ProjectUrl,
    [Range(1, 20)] int TeamSize,
    [Range(1, 40)] int HoursPerWeek,
    [StringLength(60)] string? Timeline);

public record CloseListingWithNoteRequest(
    [Required, StringLength(1000, MinimumLength = 5)] string Note);
