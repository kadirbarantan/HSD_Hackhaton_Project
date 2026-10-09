namespace CareerPath.Api.Models;

public enum StepLevel
{
    Beginner,
    Intermediate,
    JobReady,
}

public class RoadmapStep
{
    public int Id { get; set; }
    public int SubFieldId { get; set; }
    public SubField SubField { get; set; } = null!;
    public int Order { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public StepLevel Level { get; set; }
    public int EstimatedHours { get; set; }
    public required string ResourceTitle { get; set; }
    public required string ResourceUrl { get; set; }
}
