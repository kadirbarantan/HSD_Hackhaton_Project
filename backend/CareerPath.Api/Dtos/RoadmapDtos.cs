namespace CareerPath.Api.Dtos;

public record RoadmapTaskDto(int UserId, string Title, string SkillToPractice, string Deliverable, double EstimatedHours);
public record RoadmapMilestoneDto(string Title, string Outcome, string Coordination, List<RoadmapTaskDto> Tasks);
public record RoadmapContent(string Summary, List<string> Gaps, List<RoadmapMilestoneDto> Milestones);
public record RoadmapProgressDto(int MilestoneIndex, int UserId, bool Completed);
public record RoadmapDto(int Id, RoadmapContent Content, string Source, bool IsAi, DateTime CreatedAt, List<RoadmapProgressDto> Progress);
public record RoadmapPageDto(int ApplicationId, int ListingId, string ListingTitle, List<UserSummaryDto> Students, RoadmapDto? Roadmap);
public record UpdateRoadmapProgressRequest(bool Completed);
