using System.Net;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using CareerPath.Api.Controllers;
using CareerPath.Api.Data;
using CareerPath.Api.Dtos;
using CareerPath.Api.Models;
using CareerPath.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

// Isolated executable integration checks: no external model, credentials or demo data changes.
var directory = Path.Combine(Path.GetTempPath(), "careerpath-roadmap-checks-" + Guid.NewGuid());
Directory.CreateDirectory(directory);
var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseSqlite($"Data Source={Path.Combine(directory, "checks.db")};Default Timeout=10").Options;
var assertions = 0;
void Check(bool condition, string name)
{
    if (!condition) throw new Exception("FAIL: " + name);
    assertions++;
    Console.WriteLine("PASS: " + name);
}

RoadmapService Generator(Stub handler, bool enabled = true, double timeout = 5) => new(
    new HttpClient(handler) { BaseAddress = new Uri("https://model.invalid/"), Timeout = TimeSpan.FromSeconds(timeout) },
    Options.Create(new AiOptions { ApiKey = enabled ? "test-only" : "", Model = "test-model" }),
    NullLogger<RoadmapService>.Instance);

RoadmapsController Controller(AppDbContext db, int userId, RoadmapService generator) => new(db, new ListingService(db, new MatchService()), generator)
{
    ControllerContext = new ControllerContext
    {
        HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", userId.ToString())], "test")) },
    },
};

try
{
    await using var db = new AppDbContext(options);
    await db.Database.EnsureCreatedAsync();
    var backend = new Competency { Slug = "backend", Name = "Backend development", Category = "Engineering" };
    var graphics = new Competency { Slug = "graphics", Name = "Graphic design", Category = "Design" };
    var audio = new Competency { Slug = "audio", Name = "Sound and music", Category = "Design" };
    var owner = new User { Email = "owner@example.test", DisplayName = "Owner Student", Skills = ["C#"], WeeklyHours = 6,
        Competencies = [new UserCompetency { Competency = backend, Level = CompetencyLevel.Comfortable }] };
    var partner = new User { Email = "partner@example.test", DisplayName = "Artist Student", Skills = ["Aseprite"], WeeklyHours = 4,
        Competencies = [new UserCompetency { Competency = graphics, Level = CompetencyLevel.Learning }],
        Projects = [new GitHubProject { Name = "pixel-art-demo", Language = "Lua", Url = "https://example.test/demo", Topics = ["art"] }] };
    var outsider = new User { Email = "outsider@example.test", DisplayName = "Outside Student" };
    var listing = new Listing { Owner = owner, Title = "Build a collaborative game", Summary = "A small game with art and sound", Stack = ["C#"],
        Needs = [new ListingNeed { Competency = graphics, IsPrimary = true }, new ListingNeed { Competency = audio }] };
    var application = new Application { Listing = listing, Applicant = partner, Message = "Let us build this together", Status = ApplicationStatus.Accepted };
    var invitation = new Application { Listing = listing, Applicant = outsider, Message = "Please join our project", Origin = ApplicationOrigin.Invited, Status = ApplicationStatus.Accepted };
    var pendingListing = new Listing { Owner = owner, Title = "Pending project", Summary = "Pending" };
    var pending = new Application { Listing = pendingListing, Applicant = partner, Message = "Pending", Status = ApplicationStatus.Pending };
    db.Applications.AddRange(application, invitation, pending);
    await db.SaveChangesAsync();

    // Explicit opt-in smoke check: sends only these synthetic profiles to the configured provider.
    if (args.Contains("--live-ai"))
    {
        var configuration = new ConfigurationBuilder()
            .AddUserSecrets(typeof(RoadmapService).Assembly, optional: true)
            .AddEnvironmentVariables().Build();
        var ai = configuration.GetSection("Ai").Get<AiOptions>() ?? new AiOptions();
        Check(ai.Enabled, "live model credentials are configured (never printed)");
        using var client = new HttpClient
        {
            BaseAddress = new Uri(ai.BaseUrl.TrimEnd('/') + "/"),
            Timeout = TimeSpan.FromSeconds(ai.TimeoutSeconds),
        };
        client.DefaultRequestHeaders.Authorization = new("Bearer", ai.ApiKey);
        var live = new RoadmapService(client, Options.Create(ai), NullLogger<RoadmapService>.Instance);
        var generated = await live.GenerateAsync(application, default);
        Check(generated.Source != RoadmapService.TemplateSource, "live provider generated an AI roadmap without fallback");
        Check(RoadmapService.IsValid(generated.Content, owner.Id, partner.Id), "live roadmap passes content and participant validation");
        Console.WriteLine($"Live model: {generated.Source}; shared milestones: {generated.Content.Milestones.Count}");
    }

    // Simulate the previous schema, then upgrade twice and preserve the existing records.
    await db.Database.ExecuteSqlRawAsync("DROP TABLE RoadmapProgress; DROP TABLE Roadmaps;");
    await RoadmapSchema.UpgradeAsync(db);
    await RoadmapSchema.UpgradeAsync(db);
    Check(await db.Users.CountAsync() == 3 && await db.Listings.CountAsync() == 2 && await db.Applications.CountAsync() == 3,
        "existing database upgrade is idempotent and preserves records");

    var template = RoadmapService.CreateTemplate(application);
    Check(RoadmapService.IsValid(template, owner.Id, partner.Id), "starter plan meets the same contract as AI output");
    Check(template.Milestones.Count == 5 && template.Milestones[1].Tasks[0].Title.Contains("API and data flow")
        && template.Milestones[1].Tasks[1].Title.Contains("visual assets"), "student tracks match their distinct competencies");
    Check(template.Gaps.Any(g => g.Contains("Sound and music")), "missing team skills are explicitly identified");
    var offlineHandler = new Stub((_, _) => throw new Exception("Offline mode must not call model"));
    var offline = Generator(offlineHandler, false);
    Check((await offline.GenerateAsync(application, default)).Source == RoadmapService.TemplateSource && offlineHandler.Calls == 0,
        "missing key uses the starter template without a model call");

    var validJson = JsonSerializer.Serialize(template, RoadmapService.JsonOptions);
    string? capturedBrief = null;
    var validHandler = new Stub(async (request, ct) =>
    {
        capturedBrief = await request.Content!.ReadAsStringAsync(ct);
        return Stub.Reply(validJson);
    });
    Check((await Generator(validHandler).GenerateAsync(application, default)).Source == "test-model", "valid model output is used");
    Check(capturedBrief!.Contains("pixel-art-demo") && capturedBrief.Contains("weeklyHours")
        && capturedBrief.Contains("Owner Student") && capturedBrief.Contains("Artist Student")
        && !capturedBrief.Contains("owner@example.test"), "model brief includes both students and evidence but no contact details");
    foreach (var invalidJson in new[] { "not json", "{}", "null", validJson.Replace($"\"userId\":{partner.Id}", "\"userId\":9999"), validJson.Replace("\"estimatedHours\":2", "\"estimatedHours\":0") })
    {
        var result = await Generator(new Stub((_, _) => Task.FromResult(Stub.Reply(invalidJson)))).GenerateAsync(application, default);
        Check(result.Source == RoadmapService.TemplateSource, "invalid JSON, missing content, participants or effort falls back");
    }
    var timedOut = await Generator(new Stub(async (_, ct) => { await Task.Delay(1000, ct); return Stub.Reply(validJson); }), timeout: 0.02)
        .GenerateAsync(application, default);
    Check(timedOut.Source == RoadmapService.TemplateSource, "model timeout falls back");
    var unavailable = await Generator(new Stub((_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable))))
        .GenerateAsync(application, default);
    Check(unavailable.Source == RoadmapService.TemplateSource, "model HTTP failure falls back");
    using (var cancellation = new CancellationTokenSource())
    {
        cancellation.Cancel();
        try
        {
            await Generator(new Stub(async (_, ct) => { await Task.Delay(1000, ct); return Stub.Reply(validJson); }))
                .GenerateAsync(application, cancellation.Token);
            throw new Exception("Canceled request should not return a fallback");
        }
        catch (OperationCanceledException) { Check(true, "caller cancellation is propagated"); }
    }

    var ownerApi = Controller(db, owner.Id, offline);
    Check((await ownerApi.Get(application.Id, default)).Value!.Roadmap is null, "accepted request initially has an empty roadmap");
    Check((await Controller(db, outsider.Id, offline).Get(application.Id, default)).Result is NotFoundResult, "outsider cannot read roadmap");
    Check((await Controller(db, outsider.Id, offline).Create(application.Id, default)).Result is NotFoundResult, "outsider cannot generate roadmap");
    Check((await Controller(db, outsider.Id, offline).Update(application.Id, 0, new(true), default)).Result is NotFoundResult, "outsider cannot update roadmap");
    Check((await ownerApi.Create(pending.Id, default)).Result is ObjectResult { StatusCode: 409 }, "pending requests cannot generate roadmap");
    foreach (var status in new[] { ApplicationStatus.Rejected, ApplicationStatus.Withdrawn })
    {
        pending.Status = status;
        await db.SaveChangesAsync();
        Check((await ownerApi.Get(pending.Id, default)).Result is ObjectResult { StatusCode: 409 }, $"{status} request cannot access roadmap");
    }

    // Force two generations to finish together, exercising the database uniqueness race.
    var barrier = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
    var arrivals = 0;
    var raceGenerator = Generator(new Stub(async (_, ct) =>
    {
        if (Interlocked.Increment(ref arrivals) == 2) barrier.TrySetResult();
        await barrier.Task.WaitAsync(ct);
        return Stub.Reply(validJson);
    }));
    await using var raceDb1 = new AppDbContext(options);
    await using var raceDb2 = new AppDbContext(options);
    var raceResults = await Task.WhenAll(
        Controller(raceDb1, owner.Id, raceGenerator).Create(application.Id, default),
        Controller(raceDb2, partner.Id, raceGenerator).Create(application.Id, default));
    var savedId = raceResults[0].Value!.Roadmap!.Id;
    Check(raceResults[1].Value!.Roadmap!.Id == savedId && await db.Roadmaps.CountAsync(r => r.ApplicationId == application.Id) == 1,
        "simultaneous creation returns a single saved roadmap to both students");
    Check((await ownerApi.Create(application.Id, default)).Value!.Roadmap!.Id == savedId, "repeat generation returns saved plan");
    var partnerApi = Controller(db, partner.Id, offline);
    Check((await partnerApi.Get(application.Id, default)).Value!.Roadmap!.Id == savedId, "both participants see the same plan");
    await Task.WhenAll(
        Controller(raceDb1, owner.Id, offline).Update(application.Id, 0, new(true), default),
        Controller(raceDb2, partner.Id, offline).Update(application.Id, 0, new(true), default));
    var progress = (await partnerApi.Get(application.Id, default)).Value!.Roadmap!.Progress;
    Check(progress.Count(p => p.MilestoneIndex == 0 && p.Completed) == 2, "simultaneous progress writes preserve both students' updates");
    await ownerApi.Update(application.Id, 0, new(false), default);
    progress = (await partnerApi.Get(application.Id, default)).Value!.Roadmap!.Progress;
    Check(progress.Single(p => p.MilestoneIndex == 0 && p.UserId == partner.Id).Completed
        && !progress.Single(p => p.MilestoneIndex == 0 && p.UserId == owner.Id).Completed, "unchecking your task preserves partner completion");
    Check((await ownerApi.Update(application.Id, 99, new(true), default)).Result is NotFoundResult, "invalid milestone cannot create progress");

    var inviteRoadmap = (await Controller(db, outsider.Id, offline).Create(invitation.Id, default)).Value!.Roadmap!;
    Check(inviteRoadmap.Id != savedId && (await ownerApi.Get(invitation.Id, default)).Value!.Roadmap!.Id == inviteRoadmap.Id,
        "accepted invitations work and different pairs have separate plans");
    await using (var reopened = new AppDbContext(options))
    {
        await RoadmapSchema.UpgradeAsync(reopened);
        var persisted = (await Controller(reopened, partner.Id, offline).Get(application.Id, default)).Value!.Roadmap!;
        Check(persisted.Id == savedId && persisted.Progress.Any(p => p.Completed), "saved plan and progress survive reopening the database");
    }
    await db.Applications.Where(a => a.Id == invitation.Id).ExecuteDeleteAsync();
    Check(!await db.Roadmaps.AnyAsync(r => r.Id == inviteRoadmap.Id) && !await db.RoadmapProgress.AnyAsync(p => p.RoadmapId == inviteRoadmap.Id),
        "deleting an application cascades to its roadmap and progress");
    await db.Listings.Where(l => l.Id == listing.Id).ExecuteDeleteAsync();
    Check(!await db.Roadmaps.AnyAsync() && !await db.RoadmapProgress.AnyAsync(), "deleting a listing cascades to all roadmap data");
    Console.WriteLine($"All {assertions} roadmap checks passed.");
}
finally
{
    SqliteConnection.ClearAllPools();
    Directory.Delete(directory, recursive: true);
}

sealed class Stub(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> send) : HttpMessageHandler
{
    public int Calls;
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        Interlocked.Increment(ref Calls);
        return send(request, cancellationToken);
    }
    public static HttpResponseMessage Reply(string json) => new(HttpStatusCode.OK)
    {
        Content = new StringContent(JsonSerializer.Serialize(new { choices = new[] { new { message = new { content = json } } } }), Encoding.UTF8, "application/json"),
    };
}
