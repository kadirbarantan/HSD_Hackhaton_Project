using CareerPath.Api.Data;
using CareerPath.Api.Dtos;
using CareerPath.Api.Extensions;
using CareerPath.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CareerPath.Api.Controllers;

[ApiController]
[Route("api")]
public class TopicsController(AppDbContext db) : ControllerBase
{
    private const int ExcerptLength = 180;

    [HttpGet("subfields/{slug}/topics")]
    public async Task<ActionResult<List<TopicSummaryDto>>> GetForSubField(string slug)
    {
        if (!await db.SubFields.AnyAsync(s => s.Slug == slug))
        {
            return NotFound();
        }

        return await QuerySummariesAsync(db.Topics.Where(t => t.SubField.Slug == slug));
    }

    [HttpGet("topics/recent")]
    public Task<List<TopicSummaryDto>> GetRecent([FromQuery] int take = 4) =>
        QuerySummariesAsync(db.Topics, Math.Clamp(take, 1, 20));

    [HttpGet("topics/{id:int}")]
    public async Task<ActionResult<TopicDetailDto>> Get(int id)
    {
        var topic = await db.Topics.AsNoTracking()
            .Include(t => t.Author)
            .Include(t => t.SubField).ThenInclude(s => s.Field)
            .Include(t => t.Replies).ThenInclude(r => r.Author)
            .AsSplitQuery()
            .FirstOrDefaultAsync(t => t.Id == id);

        return topic is null ? NotFound() : ToDetail(topic);
    }

    [Authorize]
    [HttpPost("subfields/{slug}/topics")]
    public async Task<ActionResult<TopicDetailDto>> Create(string slug, CreateTopicRequest request)
    {
        var subField = await db.SubFields.Include(s => s.Field).FirstOrDefaultAsync(s => s.Slug == slug);
        if (subField is null)
        {
            return NotFound();
        }

        var author = await db.Users.FindAsync(User.RequireUserId());
        if (author is null)
        {
            return Unauthorized();
        }

        var topic = new Topic
        {
            SubField = subField,
            Author = author,
            Kind = request.Kind,
            Title = request.Title.Trim(),
            Body = request.Body.Trim(),
        };
        db.Topics.Add(topic);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = topic.Id }, ToDetail(topic));
    }

    [Authorize]
    [HttpPost("topics/{id:int}/replies")]
    public async Task<ActionResult<ReplyDto>> CreateReply(int id, CreateReplyRequest request)
    {
        if (!await db.Topics.AnyAsync(t => t.Id == id))
        {
            return NotFound();
        }

        var author = await db.Users.FindAsync(User.RequireUserId());
        if (author is null)
        {
            return Unauthorized();
        }

        var reply = new Reply { TopicId = id, Author = author, Body = request.Body.Trim() };
        db.Replies.Add(reply);
        await db.SaveChangesAsync();

        return new ReplyDto(reply.Id, reply.Body, ToAuthor(author), reply.CreatedAt);
    }

    private async Task<List<TopicSummaryDto>> QuerySummariesAsync(IQueryable<Topic> source, int? take = null)
    {
        var rows = await source.AsNoTracking()
            .Select(t => new
            {
                t.Id,
                t.Title,
                t.Kind,
                t.Body,
                t.CreatedAt,
                Author = new AuthorDto(t.Author.Id, t.Author.DisplayName, t.Author.Role, t.Author.ExpertTitle),
                ReplyCount = t.Replies.Count,
                HasExpertReply = t.Replies.Any(r => r.Author.Role == UserRole.Expert),
                LastReplyAt = t.Replies.Max(r => (DateTime?)r.CreatedAt),
                SubFieldSlug = t.SubField.Slug,
                SubFieldName = t.SubField.Name,
                FieldSlug = t.SubField.Field.Slug,
            })
            .ToListAsync();

        var summaries = rows
            .Select(t => new TopicSummaryDto(
                t.Id,
                t.Title,
                t.Kind,
                Excerpt(t.Body),
                t.Author,
                t.CreatedAt,
                t.LastReplyAt ?? t.CreatedAt,
                t.ReplyCount,
                t.HasExpertReply,
                t.SubFieldSlug,
                t.SubFieldName,
                t.FieldSlug))
            .OrderByDescending(t => t.LastActivityAt);

        return (take is null ? summaries : summaries.Take(take.Value)).ToList();
    }

    private static TopicDetailDto ToDetail(Topic topic) => new(
        topic.Id,
        topic.Title,
        topic.Kind,
        topic.Body,
        ToAuthor(topic.Author),
        topic.CreatedAt,
        topic.SubField.Slug,
        topic.SubField.Name,
        topic.SubField.Field.Slug,
        topic.Replies
            .OrderByDescending(r => r.Author.Role == UserRole.Expert)
            .ThenBy(r => r.CreatedAt)
            .Select(r => new ReplyDto(r.Id, r.Body, ToAuthor(r.Author), r.CreatedAt))
            .ToList());

    private static AuthorDto ToAuthor(User user) => new(user.Id, user.DisplayName, user.Role, user.ExpertTitle);

    private static string Excerpt(string body) =>
        body.Length <= ExcerptLength ? body : body[..ExcerptLength].TrimEnd() + "...";
}
