namespace CareerPath.Api.Models;

public class User
{
    public int Id { get; set; }
    public required string Email { get; set; }
    public string PasswordHash { get; set; } = "";
    public required string DisplayName { get; set; }
    public string Headline { get; set; } = "";
    public string Bio { get; set; } = "";
    public string? Location { get; set; }

    // Academic background
    public string? University { get; set; }
    public string? Program { get; set; }

    /// <summary>Year of study, 1-6. Null when the user has not said.</summary>
    public int? StudyYear { get; set; }

    /// <summary>Free-text technologies. Competencies say "what I can do", skills say "what I use".</summary>
    public List<string> Skills { get; set; } = [];

    /// <summary>Hours per week the user can put into a side project. 0 means "not said".</summary>
    public int WeeklyHours { get; set; }

    public bool OpenToJoin { get; set; } = true;
    public string LookingForNote { get; set; } = "";

    public string? GitHubUsername { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? PortfolioUrl { get; set; }

    /// <summary>Only shown once an application between two people has been accepted.</summary>
    public string? ContactHandle { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? GitHubSyncedAt { get; set; }

    public List<UserCompetency> Competencies { get; set; } = [];
    public List<GitHubProject> Projects { get; set; } = [];
}
