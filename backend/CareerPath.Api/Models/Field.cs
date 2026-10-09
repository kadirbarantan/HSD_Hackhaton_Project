namespace CareerPath.Api.Models;

public class Field
{
    public int Id { get; set; }
    public required string Slug { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required string Icon { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public List<SubField> SubFields { get; set; } = [];
}
