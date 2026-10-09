using CareerPath.Api.Data;
using CareerPath.Api.Dtos;
using CareerPath.Api.Extensions;
using CareerPath.Api.Models;
using CareerPath.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CareerPath.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/collaborations")]
public class CollaborationsController(AppDbContext db, ProfileService profiles) : ControllerBase
{
    [HttpGet]
    public async Task<List<CollaborationDto>> List()
    {
        var userId = User.RequireUserId();
        var requests = await db.CollaborationRequests.AsNoTracking()
            .Include(c => c.Sender)
            .Include(c => c.Receiver)
            .Where(c => c.SenderId == userId || c.ReceiverId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return await ToDtosAsync(userId, requests);
    }

    [HttpPost]
    public async Task<ActionResult<CollaborationDto>> Create(CreateCollaborationRequest request)
    {
        var userId = User.RequireUserId();
        if (request.ReceiverId == userId)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "You can't send a collaboration request to yourself.");
        }

        var sender = await db.Users.FindAsync(userId);
        if (sender is null)
        {
            return Unauthorized();
        }

        var receiver = await db.Users.FindAsync(request.ReceiverId);
        if (receiver is null)
        {
            return NotFound();
        }

        var alreadyInTouch = await db.CollaborationRequests.AnyAsync(c =>
            c.Status != CollaborationStatus.Declined
            && ((c.SenderId == userId && c.ReceiverId == receiver.Id) || (c.SenderId == receiver.Id && c.ReceiverId == userId)));
        if (alreadyInTouch)
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "You already have a pending or accepted request with this person.");
        }

        var slug = string.IsNullOrWhiteSpace(request.SubFieldSlug) ? null : request.SubFieldSlug;
        if (slug is not null && !await db.SubFields.AnyAsync(s => s.Slug == slug))
        {
            slug = null;
        }

        var collaboration = new CollaborationRequest
        {
            Sender = sender,
            Receiver = receiver,
            Message = request.Message.Trim(),
            SubFieldSlug = slug,
        };
        db.CollaborationRequests.Add(collaboration);
        await db.SaveChangesAsync();

        return (await ToDtosAsync(userId, [collaboration]))[0];
    }

    [HttpPost("{id:int}/accept")]
    public Task<ActionResult<CollaborationDto>> Accept(int id) => Respond(id, CollaborationStatus.Accepted);

    [HttpPost("{id:int}/decline")]
    public Task<ActionResult<CollaborationDto>> Decline(int id) => Respond(id, CollaborationStatus.Declined);

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Cancel(int id)
    {
        var userId = User.RequireUserId();
        var request = await db.CollaborationRequests.FirstOrDefaultAsync(c => c.Id == id && c.SenderId == userId);
        if (request is null)
        {
            return NotFound();
        }
        if (request.Status != CollaborationStatus.Pending)
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "Only pending requests can be cancelled.");
        }

        db.CollaborationRequests.Remove(request);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<ActionResult<CollaborationDto>> Respond(int id, CollaborationStatus status)
    {
        var userId = User.RequireUserId();
        var request = await db.CollaborationRequests
            .Include(c => c.Sender)
            .Include(c => c.Receiver)
            .FirstOrDefaultAsync(c => c.Id == id && c.ReceiverId == userId);
        if (request is null)
        {
            return NotFound();
        }
        if (request.Status != CollaborationStatus.Pending)
        {
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "This request has already been answered.");
        }

        request.Status = status;
        request.RespondedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return (await ToDtosAsync(userId, [request]))[0];
    }

    private async Task<List<CollaborationDto>> ToDtosAsync(int userId, List<CollaborationRequest> requests)
    {
        var others = requests
            .Select(r => r.SenderId == userId ? r.Receiver : r.Sender)
            .DistinctBy(u => u.Id)
            .ToList();
        var summaries = (await profiles.ToSummariesAsync(others)).ToDictionary(s => s.Id);
        var paths = await profiles.GetPathLookupAsync();

        return requests.Select(r =>
        {
            var outgoing = r.SenderId == userId;
            var other = outgoing ? r.Receiver : r.Sender;
            var pathName = r.SubFieldSlug is not null && paths.TryGetValue(r.SubFieldSlug, out var path) ? path.Name : null;

            return new CollaborationDto(
                r.Id,
                outgoing ? CollaborationDirection.Outgoing : CollaborationDirection.Incoming,
                summaries[other.Id],
                r.Message,
                r.SubFieldSlug,
                pathName,
                r.Status,
                r.CreatedAt,
                r.RespondedAt,
                r.Status == CollaborationStatus.Accepted ? new ContactDto(other.Email, other.ContactHandle) : null);
        }).ToList();
    }
}
