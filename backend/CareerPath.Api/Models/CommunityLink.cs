namespace CareerPath.Api.Models;

public class CommunityLink
{
    public int Id { get; set; }
    public int SubFieldId { get; set; }
    public SubField SubField { get; set; } = null!;
    public required string Name { get; set; }
    public required string Url { get; set; }
    public required string Platform { get; set; }
    public required string Description { get; set; }
}
