namespace CareerPath.Api.Models;

/// <summary>
/// A public repository imported from the GitHub REST API. Cached locally so profile pages
/// and match scoring never depend on GitHub being reachable.
/// </summary>
public class GitHubProject
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? Language { get; set; }
    public List<string> Topics { get; set; } = [];
    public int Stars { get; set; }
    public int Forks { get; set; }
    public required string Url { get; set; }
    public DateTime? PushedAt { get; set; }
    public bool IsDisplayed { get; set; } = true;
    public bool IsPrivate { get; set; } = false;
}
