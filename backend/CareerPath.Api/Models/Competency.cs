namespace CareerPath.Api.Models;

/// <summary>
/// A skill area a project can need and a student can offer, e.g. "Backend development" or "UI/UX design".
/// Seeded from Data/Seed/competencies.json.
/// </summary>
public class Competency
{
    public int Id { get; set; }
    public required string Slug { get; set; }
    public required string Name { get; set; }
    public required string Category { get; set; }
    public string Icon { get; set; } = "Compass";
    public string Description { get; set; } = "";

    /// <summary>Technologies that count as evidence for this competency when matching.</summary>
    public List<string> Keywords { get; set; } = [];

    public int SortOrder { get; set; }
}

public enum CompetencyLevel
{
    Learning,
    Comfortable,
    Strong,
}

/// <summary>A competency a user claims, with how confident they are in it.</summary>
public class UserCompetency
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int CompetencyId { get; set; }
    public Competency Competency { get; set; } = null!;
    public CompetencyLevel Level { get; set; } = CompetencyLevel.Comfortable;
}
