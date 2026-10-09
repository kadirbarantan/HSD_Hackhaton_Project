namespace CareerPath.Api.Models;

public enum TopicKind
{
    Question,
    Advice,
    Experience,
    Resource,
}

public class Topic
{
    public int Id { get; set; }
    public int SubFieldId { get; set; }
    public SubField SubField { get; set; } = null!;
    public int AuthorId { get; set; }
    public User Author { get; set; } = null!;
    public TopicKind Kind { get; set; }
    public required string Title { get; set; }
    public required string Body { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<Reply> Replies { get; set; } = [];
}
