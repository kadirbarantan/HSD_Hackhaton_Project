using CareerPath.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace CareerPath.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Competency> Competencies => Set<Competency>();
    public DbSet<UserCompetency> UserCompetencies => Set<UserCompetency>();
    public DbSet<GitHubProject> GitHubProjects => Set<GitHubProject>();
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<ListingNeed> ListingNeeds => Set<ListingNeed>();
    public DbSet<Application> Applications => Set<Application>();
    public DbSet<AiReview> AiReviews => Set<AiReview>();
    public DbSet<Roadmap> Roadmaps => Set<Roadmap>();
    public DbSet<RoadmapProgress> RoadmapProgress => Set<RoadmapProgress>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // SQLite stores dates without a time zone; everything is written as UTC, so read it back as UTC.
        configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
        configurationBuilder.Properties<DateTime?>().HaveConversion<UtcDateTimeConverter>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

        modelBuilder.Entity<Competency>().HasIndex(c => c.Slug).IsUnique();

        modelBuilder.Entity<UserCompetency>(entity =>
        {
            entity.HasKey(c => new { c.UserId, c.CompetencyId });
            entity.Property(c => c.Level).HasConversion<string>();
            entity.HasOne(c => c.User).WithMany(u => u.Competencies).HasForeignKey(c => c.UserId);
            entity.HasOne(c => c.Competency).WithMany().HasForeignKey(c => c.CompetencyId);
        });

        modelBuilder.Entity<GitHubProject>()
            .HasOne(p => p.User).WithMany(u => u.Projects).HasForeignKey(p => p.UserId);

        modelBuilder.Entity<Listing>(entity =>
        {
            entity.Property(l => l.Status).HasConversion<string>();
            entity.HasOne(l => l.Owner).WithMany().HasForeignKey(l => l.OwnerId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ListingNeed>(entity =>
        {
            entity.HasKey(n => new { n.ListingId, n.CompetencyId });
            entity.HasOne(n => n.Listing).WithMany(l => l.Needs).HasForeignKey(n => n.ListingId);
            entity.HasOne(n => n.Competency).WithMany().HasForeignKey(n => n.CompetencyId);
        });

        modelBuilder.Entity<Application>(entity =>
        {
            entity.Property(a => a.Status).HasConversion<string>();
            entity.Property(a => a.Origin).HasConversion<string>();
            entity.Ignore(a => a.DeciderId);
            entity.Ignore(a => a.SenderId);
            entity.HasIndex(a => new { a.ListingId, a.ApplicantId }).IsUnique();
            entity.HasOne(a => a.Listing).WithMany(l => l.Applications).HasForeignKey(a => a.ListingId);
            entity.HasOne(a => a.Applicant).WithMany().HasForeignKey(a => a.ApplicantId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AiReview>()
            .HasOne(r => r.Application).WithOne(a => a.Review).HasForeignKey<AiReview>(r => r.ApplicationId);

        modelBuilder.Entity<Roadmap>(entity =>
        {
            entity.HasIndex(r => r.ApplicationId).IsUnique();
            entity.HasOne(r => r.Application).WithOne().HasForeignKey<Roadmap>(r => r.ApplicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<RoadmapProgress>(entity =>
        {
            entity.HasKey(p => new { p.RoadmapId, p.MilestoneIndex, p.UserId });
            entity.HasOne(p => p.Roadmap).WithMany(r => r.Progress).HasForeignKey(p => p.RoadmapId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<User>().WithMany().HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}

public class UtcDateTimeConverter() : ValueConverter<DateTime, DateTime>(
    value => value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime(),
    value => DateTime.SpecifyKind(value, DateTimeKind.Utc));
