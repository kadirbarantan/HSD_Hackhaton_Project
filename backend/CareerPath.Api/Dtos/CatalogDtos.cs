using CareerPath.Api.Models;

namespace CareerPath.Api.Dtos;

public record PlatformStatsDto(int Paths, int RoadmapSteps, int Members, int Experts, int Topics, int Collaborations);

public record FieldSummaryDto(int Id, string Slug, string Name, string Description, string Icon, bool IsActive, int SubFieldCount);

public record SubFieldCardDto(
    int Id,
    string Slug,
    string Name,
    string Icon,
    string Tagline,
    int EntryDifficulty,
    string TimeToJobReady,
    int StepCount,
    int LearnerCount,
    int TopicCount);

public record FieldDetailDto(
    int Id,
    string Slug,
    string Name,
    string Description,
    string Icon,
    bool IsActive,
    List<SubFieldCardDto> SubFields);

public record FieldRefDto(string Slug, string Name);

public record RoadmapStepDto(
    int Id,
    int Order,
    string Title,
    string Description,
    StepLevel Level,
    int EstimatedHours,
    string ResourceTitle,
    string ResourceUrl);

public record CommunityLinkDto(int Id, string Name, string Url, string Platform, string Description);

public record SubFieldDetailDto(
    int Id,
    string Slug,
    string Name,
    string Icon,
    string Tagline,
    string Description,
    string DayInTheLife,
    int EntryDifficulty,
    string TimeToJobReady,
    List<string> KeySkills,
    List<string> FirstJobs,
    List<string> GoodFitIf,
    List<string> ThinkTwiceIf,
    FieldRefDto Field,
    List<RoadmapStepDto> Roadmap,
    List<CommunityLinkDto> Communities,
    int LearnerCount,
    int TopicCount,
    bool IsJoined,
    List<int> CompletedStepIds);

public record JoinResultDto(bool IsJoined, int LearnerCount);

public record PathMemberDto(UserSummaryDto User, int Completed, int Total);

public record SubFieldPeopleDto(List<PathMemberDto> Experts, List<PathMemberDto> Learners);

public record ProgressResultDto(
    string SubFieldSlug,
    List<int> CompletedStepIds,
    int Completed,
    int Total,
    int Xp,
    int Level,
    string LevelTitle,
    bool LeveledUp);
