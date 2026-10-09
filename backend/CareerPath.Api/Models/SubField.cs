namespace CareerPath.Api.Models;

public class SubField
{
    public int Id { get; set; }
    public int FieldId { get; set; }
    public Field Field { get; set; } = null!;
    public required string Slug { get; set; }
    public required string Name { get; set; }
    public required string Icon { get; set; }
    public required string Tagline { get; set; }
    public required string Description { get; set; }
    public required string DayInTheLife { get; set; }

    /// <summary>How hard it is to get a first job, from 1 (easiest) to 5 (hardest).</summary>
    public int EntryDifficulty { get; set; }

    public required string TimeToJobReady { get; set; }
    public List<string> KeySkills { get; set; } = [];
    public List<string> FirstJobs { get; set; } = [];
    public List<string> GoodFitIf { get; set; } = [];
    public List<string> ThinkTwiceIf { get; set; } = [];
    public int SortOrder { get; set; }
    public List<RoadmapStep> RoadmapSteps { get; set; } = [];
    public List<CommunityLink> Communities { get; set; } = [];
}
