namespace CareerPath.Api.Services;

public static class XpRules
{
    public const int StepCompleted = 20;
    public const int TopicCreated = 10;
    public const int ReplyPosted = 5;
    public const int CollaborationAccepted = 25;
    public const int XpPerLevel = 100;

    private static readonly string[] LevelTitles =
        ["Explorer", "Learner", "Apprentice", "Builder", "Pathfinder", "Trailblazer"];

    public static int LevelFor(int xp) => xp / XpPerLevel + 1;

    public static string TitleFor(int level) => LevelTitles[Math.Clamp(level, 1, LevelTitles.Length) - 1];
}

public record UserStats(int StepsCompleted, int Topics, int Replies, int Collaborations)
{
    public int Xp =>
        StepsCompleted * XpRules.StepCompleted
        + Topics * XpRules.TopicCreated
        + Replies * XpRules.ReplyPosted
        + Collaborations * XpRules.CollaborationAccepted;
}
