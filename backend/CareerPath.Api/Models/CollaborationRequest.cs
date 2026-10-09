namespace CareerPath.Api.Models;

public enum CollaborationStatus
{
    Pending,
    Accepted,
    Declined,
}

public class CollaborationRequest
{
    public int Id { get; set; }
    public int SenderId { get; set; }
    public User Sender { get; set; } = null!;
    public int ReceiverId { get; set; }
    public User Receiver { get; set; } = null!;
    public required string Message { get; set; }
    public string? SubFieldSlug { get; set; }
    public CollaborationStatus Status { get; set; } = CollaborationStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }
}
