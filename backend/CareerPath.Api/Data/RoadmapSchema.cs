using Microsoft.EntityFrameworkCore;

namespace CareerPath.Api.Data;

/// <summary>Additive upgrade for databases created with EnsureCreated before roadmaps existed.</summary>
public static class RoadmapSchema
{
    public static async Task UpgradeAsync(AppDbContext db)
    {
        await using var transaction = await db.Database.BeginTransactionAsync();
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "Roadmaps" (
                "Id" INTEGER NOT NULL CONSTRAINT "PK_Roadmaps" PRIMARY KEY AUTOINCREMENT,
                "ApplicationId" INTEGER NOT NULL,
                "ContentJson" TEXT NOT NULL,
                "Source" TEXT NOT NULL,
                "CreatedAt" TEXT NOT NULL,
                CONSTRAINT "FK_Roadmaps_Applications_ApplicationId" FOREIGN KEY ("ApplicationId") REFERENCES "Applications" ("Id") ON DELETE CASCADE
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_Roadmaps_ApplicationId" ON "Roadmaps" ("ApplicationId");
            CREATE TABLE IF NOT EXISTS "RoadmapProgress" (
                "RoadmapId" INTEGER NOT NULL,
                "MilestoneIndex" INTEGER NOT NULL,
                "UserId" INTEGER NOT NULL,
                "Completed" INTEGER NOT NULL,
                CONSTRAINT "PK_RoadmapProgress" PRIMARY KEY ("RoadmapId", "MilestoneIndex", "UserId"),
                CONSTRAINT "FK_RoadmapProgress_Roadmaps_RoadmapId" FOREIGN KEY ("RoadmapId") REFERENCES "Roadmaps" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_RoadmapProgress_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
            );
            CREATE INDEX IF NOT EXISTS "IX_RoadmapProgress_UserId" ON "RoadmapProgress" ("UserId");
            """);
        await transaction.CommitAsync();
    }
}
