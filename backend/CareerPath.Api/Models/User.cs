namespace CareerPath.Api.Models;

public enum UserRole
{
    Student,
    Expert,
}

public class User
{
    public int Id { get; set; }
    public required string Email { get; set; }
    public string PasswordHash { get; set; } = "";
    public required string DisplayName { get; set; }
    public UserRole Role { get; set; } = UserRole.Student;
    public string? ExpertTitle { get; set; }
    public string Headline { get; set; } = "";
    public string Bio { get; set; } = "";
    public string? Location { get; set; }
    public List<string> Skills { get; set; } = [];

    /// <summary>Slugs of the sub-fields (career paths) this user follows.</summary>
    public List<string> InterestSlugs { get; set; } = [];

    public bool OpenToCollaborate { get; set; } = true;
    public string CollaborationNote { get; set; } = "";
    public string? GitHubUrl { get; set; }
    public string? LinkedInUrl { get; set; }

    /// <summary>Only shown to people with an accepted collaboration.</summary>
    public string? ContactHandle { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
