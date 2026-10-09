using CareerPath.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace CareerPath.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Field> Fields => Set<Field>();
    public DbSet<SubField> SubFields => Set<SubField>();
    public DbSet<RoadmapStep> RoadmapSteps => Set<RoadmapStep>();
    public DbSet<CommunityLink> CommunityLinks => Set<CommunityLink>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RoadmapProgress> RoadmapProgress => Set<RoadmapProgress>();
    public DbSet<Topic> Topics => Set<Topic>();
    public DbSet<Reply> Replies => Set<Reply>();
    public DbSet<CollaborationRequest> CollaborationRequests => Set<CollaborationRequest>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // SQLite stores dates without a time zone; everything is written as UTC, so read it back as UTC.
        configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
        configurationBuilder.Properties<DateTime?>().HaveConversion<UtcDateTimeConverter>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Field>().HasIndex(f => f.Slug).IsUnique();

        modelBuilder.Entity<SubField>().HasIndex(s => s.Slug).IsUnique();

        modelBuilder.Entity<RoadmapStep>().Property(s => s.Level).HasConversion<string>();

        modelBuilder.Entity<User>(user =>
        {
            user.HasIndex(u => u.Email).IsUnique();
            user.Property(u => u.Role).HasConversion<string>();
        });

        modelBuilder.Entity<RoadmapProgress>().HasKey(p => new { p.UserId, p.RoadmapStepId });

        modelBuilder.Entity<Topic>(topic =>
        {
            topic.Property(t => t.Kind).HasConversion<string>();
            topic.HasOne(t => t.Author).WithMany().HasForeignKey(t => t.AuthorId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Reply>()
            .HasOne(r => r.Author).WithMany().HasForeignKey(r => r.AuthorId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CollaborationRequest>(request =>
        {
            request.Property(c => c.Status).HasConversion<string>();
            request.HasOne(c => c.Sender).WithMany().HasForeignKey(c => c.SenderId).OnDelete(DeleteBehavior.Restrict);
            request.HasOne(c => c.Receiver).WithMany().HasForeignKey(c => c.ReceiverId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}

public class UtcDateTimeConverter() : ValueConverter<DateTime, DateTime>(
    value => value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime(),
    value => DateTime.SpecifyKind(value, DateTimeKind.Utc));
