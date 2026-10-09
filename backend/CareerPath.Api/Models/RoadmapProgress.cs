namespace CareerPath.Api.Models;

public class RoadmapProgress
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int RoadmapStepId { get; set; }
    public RoadmapStep RoadmapStep { get; set; } = null!;
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}
