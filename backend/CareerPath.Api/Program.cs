using System.Text.Json.Serialization;
using CareerPath.Api.Data;
using CareerPath.Api.Models;
using CareerPath.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwt = jwtSection.Get<JwtOptions>() ?? new JwtOptions();
if (jwt.Key.Length < 32)
{
    throw new InvalidOperationException(
        "Jwt:Key must be at least 32 characters. Set it in appsettings.Development.json or the Jwt__Key environment variable.");
}

builder.Services.Configure<JwtOptions>(jwtSection);
builder.Services.Configure<AiOptions>(builder.Configuration.GetSection("Ai"));
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = jwt.SigningKey,
            NameClaimType = "name",
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [])
    .AllowAnyHeader()
    .AllowAnyMethod()));

builder.Services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddSingleton<TokenService>();
builder.Services.AddScoped<ProfileService>();
builder.Services.AddScoped<ListingService>();
builder.Services.AddScoped<MatchService>();

// Both integrations talk to the outside world, so they get their own clients with their own timeouts.
builder.Services.AddHttpClient<GitHubService>(client =>
{
    client.BaseAddress = new Uri("https://api.github.com/");
    client.Timeout = TimeSpan.FromSeconds(15);
    client.DefaultRequestHeaders.Add("Accept", "application/vnd.github+json");
    client.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");
    client.DefaultRequestHeaders.Add("User-Agent", "CareerPath-Hackathon-App");

    // Optional: lifts the rate limit from 60 to 5000 requests an hour.
    var token = builder.Configuration["GitHub:Token"];
    if (!string.IsNullOrWhiteSpace(token))
    {
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
    }
});

void ConfigureAiClient(IServiceProvider provider, HttpClient client)
{
    var ai = provider.GetRequiredService<Microsoft.Extensions.Options.IOptions<AiOptions>>().Value;
    client.BaseAddress = new Uri(ai.BaseUrl.EndsWith('/') ? ai.BaseUrl : ai.BaseUrl + "/");
    client.Timeout = TimeSpan.FromSeconds(ai.TimeoutSeconds);
    if (ai.Enabled)
    {
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {ai.ApiKey}");
    }
}
builder.Services.AddHttpClient<AiReviewService>(ConfigureAiClient);
builder.Services.AddHttpClient<RoadmapService>(ConfigureAiClient);

var app = builder.Build();

await DbSeeder.InitializeAsync(app.Services, reset: args.Contains("--reset-db"));

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
