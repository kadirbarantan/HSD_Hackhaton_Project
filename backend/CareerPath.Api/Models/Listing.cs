namespace CareerPath.Api.Models;

public enum ListingStatus
{
    Open,
    Closed,
    Completed,
    Cancelled,
}

/// <summary>A project post looking for collaborators in areas the owner cannot cover alone.</summary>
public class Listing
{
    public int Id { get; set; }
    public int OwnerId { get; set; }
    public User Owner { get; set; } = null!;

    public required string Title { get; set; }
    public required string Summary { get; set; }
    public string Description { get; set; } = "";

    /// <summary>Technologies the project uses, matched against applicant skills and repositories.</summary>
    public List<string> Stack { get; set; } = [];

    public string? ProjectUrl { get; set; }

    /// <summary>How many people are already on the team, including the owner.</summary>
    public int TeamSize { get; set; } = 1;

    /// <summary>Hours per week expected from a collaborator.</summary>
    public int HoursPerWeek { get; set; } = 5;

    public string Timeline { get; set; } = "";
    public ListingStatus Status { get; set; } = ListingStatus.Open;
    public string? OutcomeNote { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }

    public List<ListingNeed> Needs { get; set; } = [];
    public List<Application> Applications { get; set; } = [];
}

/// <summary>A competency the listing owner is missing and wants a collaborator for.</summary>
public class ListingNeed
{
    public int ListingId { get; set; }
    public Listing Listing { get; set; } = null!;
    public int CompetencyId { get; set; }
    public Competency Competency { get; set; } = null!;

    /// <summary>Must-have needs weigh double in the match score.</summary>
    public bool IsPrimary { get; set; }
}
