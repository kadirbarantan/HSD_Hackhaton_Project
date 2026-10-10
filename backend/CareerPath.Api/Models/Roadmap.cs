namespace CareerPath.Api.Models;

public class Roadmap
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public Application Application { get; set; } = null!;
    public required string ContentJson { get; set; }
    public required string Source { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<RoadmapProgress> Progress { get; set; } = [];
}

public class RoadmapProgress
{
    public int RoadmapId { get; set; }
    public Roadmap Roadmap { get; set; } = null!;
    public int MilestoneIndex { get; set; }
    public int UserId { get; set; }
    public bool Completed { get; set; }
}
