using System.Text.Json;
using CareerPath.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CareerPath.Api.Data;

/// <summary>
/// Creates the SQLite database on first run, loads the competency catalog from
/// Data/Seed/competencies.json and fills it with a demo community so the app is never empty.
/// Run with --reset-db to start over.
/// </summary>
public static class DbSeeder
{
    public const string DemoEmail = "demo@example.com";
    public const string DemoPassword = "demo1234";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static async Task InitializeAsync(IServiceProvider services, bool reset)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(DbSeeder));

        if (reset)
        {
            await db.Database.EnsureDeletedAsync();
            logger.LogInformation("Deleted the existing database (--reset-db).");
        }

        var created = await db.Database.EnsureCreatedAsync();
        await RoadmapSchema.UpgradeAsync(db);
        if (!created)
        {
            return;
        }

        await SeedCompetenciesAsync(db);
        await SeedCommunityAsync(db, scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>());
        logger.LogInformation("Seeded the database. Demo login: {Email} / {Password}", DemoEmail, DemoPassword);
    }

    private static async Task SeedCompetenciesAsync(AppDbContext db)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "competencies.json");
        await using var stream = File.OpenRead(path);
        var competencies = await JsonSerializer.DeserializeAsync<List<Competency>>(stream, JsonOptions)
            ?? throw new InvalidOperationException($"Could not read the competency catalog from {path}.");

        for (var i = 0; i < competencies.Count; i++)
        {
            competencies[i].SortOrder = i;
        }

        db.Competencies.AddRange(competencies);
        await db.SaveChangesAsync();
    }

    private static async Task SeedCommunityAsync(AppDbContext db, IPasswordHasher<User> passwordHasher)
    {
        var now = DateTime.UtcNow;
        var catalog = await db.Competencies.ToDictionaryAsync(c => c.Slug);
        var passwordHash = passwordHasher.HashPassword(new User { Email = "", DisplayName = "" }, DemoPassword);

        User AddUser(User user, (string Slug, CompetencyLevel Level)[] competencies, GitHubProject[] projects)
        {
            user.PasswordHash = passwordHash;
            foreach (var (slug, level) in competencies)
            {
                user.Competencies.Add(new UserCompetency { Competency = catalog[slug], Level = level });
            }
            user.Projects.AddRange(projects);
            if (projects.Length > 0)
            {
                user.GitHubSyncedAt = now.AddDays(-2);
            }
            db.Users.Add(user);
            return user;
        }

        static GitHubProject Repo(
            string owner,
            string name,
            string language,
            int stars,
            string description,
            string[] topics,
            int pushedDaysAgo) => new()
            {
                Name = name,
                Description = description,
                Language = language,
                Topics = [.. topics],
                Stars = stars,
                Forks = stars / 4,
                Url = $"https://github.com/{owner}/{name}",
                PushedAt = DateTime.UtcNow.AddDays(-pushedDaysAgo),
            };

        // ----------------------------------------------------------------- people

        var kaan = AddUser(
            new User
            {
                Email = DemoEmail,
                DisplayName = "Kaan Erdem",
                Headline = "Second-year computer engineering student who likes building APIs.",
                Bio = "I write C# for coursework and for fun. I can hold up the back end of a project, but anything visual is well outside what I can do, so I am looking for people who can cover that.",
                Location = "Istanbul",
                University = "Istanbul Technical University",
                Program = "Computer Engineering",
                StudyYear = 2,
                Skills = ["C#", "ASP.NET Core", "SQL", "Unity", "Git"],
                WeeklyHours = 10,
                LookingForNote = "Happy to take the back end of almost anything.",
                GitHubUsername = "kaanerdem",
                ContactHandle = "Discord: kaan.dev",
                CreatedAt = now.AddDays(-60),
            },
            [("backend", CompetencyLevel.Comfortable), ("gamedev", CompetencyLevel.Learning)],
            [
                Repo("kaanerdem", "study-planner-api", "C#", 12, "Small ASP.NET Core API for planning study sessions.", ["aspnetcore", "api", "sqlite"], 6),
                Repo("kaanerdem", "unity-platformer-prototype", "C#", 3, "Two-week Unity prototype from a university workshop.", ["unity", "gamedev"], 40),
                Repo("kaanerdem", "sqlite-notes", "C#", 1, "Notes app I wrote to learn Entity Framework Core.", ["sqlite", "efcore"], 90),
            ]);

        var zeynep = AddUser(
            new User
            {
                Email = "zeynep@example.com",
                DisplayName = "Zeynep Kaya",
                Headline = "Illustrator and pixel artist studying visual communication design.",
                Bio = "I draw, animate and design interfaces. I have shipped art for two game jams and I am slowly learning Blender. I cannot program, so I only join projects that already have a developer.",
                Location = "Istanbul",
                University = "Mimar Sinan Fine Arts University",
                Program = "Visual Communication Design",
                StudyYear = 3,
                Skills = ["Figma", "Aseprite", "Pixel art", "Photoshop", "Illustration"],
                WeeklyHours = 12,
                LookingForNote = "Looking for a programmer to make my art playable.",
                GitHubUsername = "zeynep-draws",
                ContactHandle = "Discord: zeynep.draws",
                CreatedAt = now.AddDays(-85),
            },
            [("graphics", CompetencyLevel.Strong), ("uiux", CompetencyLevel.Comfortable), ("art3d", CompetencyLevel.Learning)],
            [
                Repo("zeynep-draws", "cozy-tileset", "GDScript", 9, "Free 16x16 pixel art tileset with a small Godot demo scene.", ["pixelart", "gamedev", "art"], 11),
                Repo("zeynep-draws", "portfolio", "HTML", 2, "My illustration portfolio, hand written.", ["css", "portfolio"], 30),
            ]);

        var emre = AddUser(
            new User
            {
                Email = "emre@example.com",
                DisplayName = "Emre Şahin",
                Headline = "Final-year software engineering student. C# back ends and Docker.",
                Bio = "I have built several ASP.NET Core APIs and I am comfortable deploying them. Design is my blind spot: my own projects look terrible until someone else touches them.",
                Location = "Istanbul",
                University = "Yildiz Technical University",
                Program = "Software Engineering",
                StudyYear = 4,
                Skills = ["C#", "ASP.NET Core", "PostgreSQL", "Docker", "Azure", "TypeScript"],
                WeeklyHours = 15,
                LookingForNote = "I can take the whole back end if someone handles the interface.",
                GitHubUsername = "emre-dotnet",
                ContactHandle = "Discord: emre.dotnet",
                CreatedAt = now.AddDays(-150),
            },
            [("backend", CompetencyLevel.Strong), ("devops", CompetencyLevel.Comfortable), ("qa", CompetencyLevel.Learning)],
            [
                Repo("emre-dotnet", "minimal-api-starter", "C#", 48, "Opinionated ASP.NET Core starter with auth and EF Core wired up.", ["aspnetcore", "api", "dotnet"], 4),
                Repo("emre-dotnet", "docker-compose-lab", "Shell", 24, "Compose files I use to run Postgres, Redis and Seq locally.", ["docker", "devops", "postgresql"], 12),
                Repo("emre-dotnet", "jwt-auth-sample", "C#", 9, "Minimal JWT authentication example for students.", ["aspnetcore", "security"], 60),
            ]);

        var elif = AddUser(
            new User
            {
                Email = "elif@example.com",
                DisplayName = "Elif Yılmaz",
                Headline = "Statistics student who would rather clean data than write CSS.",
                Bio = "Third year statistics. I work with messy public datasets and I am preparing for my first Kaggle competition. I can produce the numbers and the charts, but I have never built a real interface.",
                Location = "Ankara",
                University = "Middle East Technical University",
                Program = "Statistics",
                StudyYear = 3,
                Skills = ["Python", "Pandas", "scikit-learn", "SQL", "R", "Matplotlib"],
                WeeklyHours = 8,
                LookingForNote = "I bring the analysis. Someone else should bring the front end.",
                GitHubUsername = "elif-data",
                ContactHandle = "Discord: elif.data",
                CreatedAt = now.AddDays(-120),
            },
            [("dataanalysis", CompetencyLevel.Strong), ("ml", CompetencyLevel.Comfortable)],
            [
                Repo("elif-data", "air-quality-notebooks", "Jupyter Notebook", 7, "Exploring five years of Ankara air quality measurements.", ["pandas", "dataviz", "jupyter"], 8),
                Repo("elif-data", "survey-cleaner", "Python", 2, "Script that turns exported survey forms into tidy data.", ["pandas", "python"], 45),
            ]);

        var can = AddUser(
            new User
            {
                Email = "can@example.com",
                DisplayName = "Can Öztürk",
                Headline = "High school senior who builds websites for local shops.",
                Bio = "I taught myself HTML, CSS and JavaScript, and I am halfway through learning React. I want to join a real project with people who know more than me.",
                Location = "Izmir",
                University = "Izmir Science High School",
                Program = "High school, science track",
                Skills = ["HTML", "CSS", "JavaScript", "React", "Tailwind"],
                WeeklyHours = 6,
                LookingForNote = "Looking for my first real project, however small.",
                GitHubUsername = "can-codes",
                ContactHandle = "Discord: can_codes",
                CreatedAt = now.AddDays(-70),
            },
            [("frontend", CompetencyLevel.Comfortable)],
            [
                Repo("can-codes", "shop-landing-pages", "JavaScript", 3, "Three landing pages I built for shops in my neighbourhood.", ["html", "css", "javascript"], 9),
                Repo("can-codes", "react-todo", "TypeScript", 1, "Learning React by rebuilding the classic todo app properly.", ["react", "typescript"], 20),
            ]);

        var mert = AddUser(
            new User
            {
                Email = "mert@example.com",
                DisplayName = "Mert Demir",
                Headline = "Unity hobbyist. Three jam games finished, none of them pretty.",
                Bio = "I prototype fast in Unity and I can model simple low-poly props in Blender. What I never manage is sound and marketing.",
                Location = "Bursa",
                University = "Bursa Uludag University",
                Program = "Computer Engineering",
                StudyYear = 2,
                Skills = ["Unity", "C#", "Blender", "Shader Graph"],
                WeeklyHours = 10,
                LookingForNote = "Up for any game jam team.",
                GitHubUsername = "mertdev",
                ContactHandle = "Discord: mertdev",
                CreatedAt = now.AddDays(-95),
            },
            [("gamedev", CompetencyLevel.Strong), ("art3d", CompetencyLevel.Comfortable)],
            [
                Repo("mertdev", "coop-puzzle-prototype", "C#", 15, "Two-player puzzle prototype made in a 48 hour jam.", ["unity", "gamedev", "c#"], 5),
                Repo("mertdev", "lowpoly-prop-pack", "Python", 4, "Blender scripts for generating low-poly props.", ["blender", "3d", "lowpoly"], 35),
            ]);

        var aisha = AddUser(
            new User
            {
                Email = "aisha@example.com",
                DisplayName = "Aisha Khan",
                Headline = "Exchange student, CTF player, Linux person.",
                Bio = "I spend most evenings on CTF challenges. I can write Python tooling and break things on purpose, but I have never designed anything a normal person would want to use.",
                Location = "Istanbul",
                University = "Bogazici University",
                Program = "Computer Science (exchange)",
                StudyYear = 3,
                Skills = ["Linux", "Python", "Wireshark", "Networking", "Docker"],
                WeeklyHours = 9,
                LookingForNote = "Want to turn my CTF notes into something other students can use.",
                GitHubUsername = "aisha-ctf",
                ContactHandle = "Discord: aisha_ctf",
                CreatedAt = now.AddDays(-80),
            },
            [("security", CompetencyLevel.Comfortable), ("backend", CompetencyLevel.Learning)],
            [
                Repo("aisha-ctf", "ctf-writeups", "Python", 31, "Write-ups and helper scripts from two years of beginner CTFs.", ["ctf", "security", "python"], 3),
                Repo("aisha-ctf", "log-parser", "Python", 4, "Turns messy auth logs into something readable.", ["python", "security"], 50),
            ]);

        var lucas = AddUser(
            new User
            {
                Email = "lucas@example.com",
                DisplayName = "Lucas Martin",
                Headline = "Android developer. Switched from business informatics.",
                Bio = "I published my first Android app last year and I am now building a second one. I can design a passable screen in Figma, but anything server-side stops me.",
                Location = "Eskisehir",
                University = "Anadolu University",
                Program = "Business Informatics",
                StudyYear = 4,
                Skills = ["Kotlin", "Jetpack Compose", "Firebase", "Figma"],
                WeeklyHours = 12,
                LookingForNote = "Need a back-end partner, always.",
                GitHubUsername = "lucas-kt",
                ContactHandle = "Discord: lucas.kt",
                CreatedAt = now.AddDays(-110),
            },
            [("mobile", CompetencyLevel.Strong), ("uiux", CompetencyLevel.Learning)],
            [
                Repo("lucas-kt", "habit-tracker-android", "Kotlin", 22, "Offline-first habit tracker built with Jetpack Compose.", ["android", "kotlin", "jetpackcompose"], 7),
                Repo("lucas-kt", "compose-components", "Kotlin", 6, "Reusable Compose components I keep copying between projects.", ["android", "kotlin"], 25),
            ]);

        var deniz = AddUser(
            new User
            {
                Email = "deniz@example.com",
                DisplayName = "Deniz Çelik",
                Headline = "First-year student. Writes very good README files.",
                Bio = "I am new to programming, but I am good at explaining things. I would like to join a project as the person who writes the documentation and tests the rough edges.",
                Location = "Ankara",
                University = "Hacettepe University",
                Program = "Computer Engineering",
                StudyYear = 1,
                Skills = ["JavaScript", "Markdown", "Git"],
                WeeklyHours = 7,
                LookingForNote = "I will document anything.",
                GitHubUsername = "deniz-writes",
                ContactHandle = "Discord: deniz.c",
                CreatedAt = now.AddDays(-25),
            },
            [("writing", CompetencyLevel.Comfortable), ("frontend", CompetencyLevel.Learning)],
            [
                Repo("deniz-writes", "beginner-git-guide", "Markdown", 18, "Git explained for people who have never used a terminal.", ["documentation", "tutorial", "git"], 14),
            ]);

        var selin = AddUser(
            new User
            {
                Email = "selin@example.com",
                DisplayName = "Selin Aydın",
                Headline = "Industrial engineering student who keeps teams on schedule.",
                Bio = "I have run three student club projects end to end. I write the plan, chase the deadlines and talk to the people who will actually use the thing. I do not write production code.",
                Location = "Izmir",
                University = "Ege University",
                Program = "Industrial Engineering",
                StudyYear = 3,
                Skills = ["Notion", "Jira", "Excel", "SQL", "User research"],
                WeeklyHours = 10,
                LookingForNote = "Every student project I have seen died from having no plan. I fix that.",
                ContactHandle = "Discord: selin.pm",
                CreatedAt = now.AddDays(-40),
            },
            [("product", CompetencyLevel.Strong), ("dataanalysis", CompetencyLevel.Comfortable)],
            []);

        var burak = AddUser(
            new User
            {
                Email = "burak@example.com",
                DisplayName = "Burak Koç",
                Headline = "Final-year CS student working on Turkish NLP.",
                Bio = "My graduation project is a Turkish sentiment model. I am comfortable with PyTorch and FastAPI, and completely lost the moment a project needs a user interface.",
                Location = "Istanbul",
                University = "Sabanci University",
                Program = "Computer Science",
                StudyYear = 4,
                Skills = ["Python", "PyTorch", "FastAPI", "Airflow", "Docker", "Hugging Face"],
                WeeklyHours = 14,
                LookingForNote = "Looking for someone to put a face on my models.",
                GitHubUsername = "burak-ml",
                ContactHandle = "Discord: burak.ml",
                CreatedAt = now.AddDays(-130),
            },
            [("ml", CompetencyLevel.Strong), ("dataeng", CompetencyLevel.Comfortable), ("backend", CompetencyLevel.Comfortable)],
            [
                Repo("burak-ml", "turkish-sentiment-bert", "Python", 64, "Fine-tuned BERT for Turkish product reviews, with a small FastAPI server.", ["nlp", "machinelearning", "pytorch", "huggingface"], 2),
                Repo("burak-ml", "feature-store-lite", "Python", 11, "A tiny feature store for student machine learning projects.", ["pipeline", "etl", "python"], 28),
            ]);

        AddUser(
            new User
            {
                Email = "ece@example.com",
                DisplayName = "Ece Polat",
                Headline = "Design student who learned to code her own interfaces.",
                Bio = "I started in graphic design and taught myself React so I could build what I design instead of handing over a PDF. I have never written a line of server code and I have no interest in starting.",
                Location = "Ankara",
                University = "Bilkent University",
                Program = "Communication Design",
                StudyYear = 3,
                Skills = ["React", "TypeScript", "Tailwind", "Figma", "Accessibility"],
                WeeklyHours = 10,
                LookingForNote = "I will take the whole interface if you own the back end.",
                GitHubUsername = "ece-ui",
                ContactHandle = "Discord: ece.ui",
                CreatedAt = now.AddDays(-65),
            },
            [("frontend", CompetencyLevel.Strong), ("uiux", CompetencyLevel.Comfortable)],
            [
                Repo("ece-ui", "accessible-form-kit", "TypeScript", 37, "React form components that actually work with a screen reader.", ["react", "typescript", "accessibility"], 5),
                Repo("ece-ui", "tailwind-dashboard", "TypeScript", 14, "Dashboard layout I keep reusing, built with Tailwind.", ["react", "tailwind", "css"], 18),
            ]);

        AddUser(
            new User
            {
                Email = "ipek@example.com",
                DisplayName = "İpek Demirtaş",
                Headline = "Game artist. Two jams, one unfinished RPG.",
                Bio = "I draw characters and environments and I know enough Unity to import my own assets and set up the scene properly, which saves the programmer a lot of arguing.",
                Location = "Izmir",
                University = "Dokuz Eylul University",
                Program = "Animation and Game Design",
                StudyYear = 2,
                Skills = ["Aseprite", "Photoshop", "Unity", "Spine", "Pixel art"],
                WeeklyHours = 10,
                LookingForNote = "Looking for a programmer who finishes things.",
                GitHubUsername = "ipek-art",
                ContactHandle = "Discord: ipek.art",
                CreatedAt = now.AddDays(-35),
            },
            [("graphics", CompetencyLevel.Comfortable), ("art3d", CompetencyLevel.Learning)],
            [
                Repo("ipek-art", "jam-art-dump", "C#", 6, "Art and the Unity scene setup from two game jams.", ["unity", "pixelart", "gamedev"], 10),
            ]);

        AddUser(
            new User
            {
                Email = "tuna@example.com",
                DisplayName = "Tuna Bulut",
                Headline = "Music student who scores student games for free.",
                Bio = "I compose and do sound design. I have scored four student games and I can wire the audio up in Unity with FMOD myself so nobody has to explain it to me.",
                Location = "Istanbul",
                University = "Istanbul Technical University",
                Program = "Music Technology",
                StudyYear = 3,
                Skills = ["FMOD", "Ableton", "Sound design", "Unity"],
                WeeklyHours = 8,
                LookingForNote = "Send me your prototype and I will send you a soundtrack.",
                GitHubUsername = "tuna-audio",
                ContactHandle = "Discord: tuna.audio",
                CreatedAt = now.AddDays(-28),
            },
            [("audio", CompetencyLevel.Strong), ("gamedev", CompetencyLevel.Learning)],
            [
                Repo("tuna-audio", "unity-fmod-template", "C#", 13, "Unity project wired up with FMOD, ready to drop sound into.", ["unity", "audio", "fmod", "gamedev"], 16),
            ]);

        var ayse = AddUser(
            new User
            {
                Email = "ayse@example.com",
                DisplayName = "Ayşe Arslan",
                Headline = "Psychology student, exam season, not available right now.",
                Bio = "I analyse survey data for research projects and I am curious whether this could be a career. Taking a break from side projects until my exams are over.",
                Location = "Ankara",
                University = "Ankara University",
                Program = "Psychology",
                StudyYear = 2,
                Skills = ["Python", "SPSS", "Excel"],
                WeeklyHours = 3,
                OpenToJoin = false,
                CreatedAt = now.AddDays(-18),
            },
            [("dataanalysis", CompetencyLevel.Learning), ("writing", CompetencyLevel.Comfortable)],
            []);

        await db.SaveChangesAsync();

        // ----------------------------------------------------------------- listings

        Listing AddListing(
            User owner,
            string title,
            string summary,
            string description,
            (string Slug, bool IsPrimary)[] needs,
            string[] stack,
            int hoursPerWeek,
            string timeline,
            int teamSize,
            int daysAgo,
            ListingStatus status = ListingStatus.Open)
        {
            var listing = new Listing
            {
                Owner = owner,
                Title = title,
                Summary = summary,
                Description = description,
                Stack = [.. stack],
                HoursPerWeek = hoursPerWeek,
                Timeline = timeline,
                TeamSize = teamSize,
                Status = status,
                CreatedAt = now.AddDays(-daysAgo),
                ClosedAt = status == ListingStatus.Closed ? now.AddDays(-daysAgo / 2) : null,
            };
            foreach (var (slug, isPrimary) in needs)
            {
                listing.Needs.Add(new ListingNeed { Competency = catalog[slug], IsPrimary = isPrimary });
            }
            db.Listings.Add(listing);
            return listing;
        }

        var jamGame = AddListing(
            kaan,
            "Co-op puzzle game for the next 48-hour jam",
            "I can write the Unity gameplay. I need someone who can make it look and sound like a real game.",
            "The idea is a two-player puzzle game where each player only sees half of the room and has to describe it to the other. I have a rough prototype with movement and the room loading working.\n\nWhat I cannot do at all is art. I need a tileset, a character, a simple UI and ideally some sound. The jam is in three weeks and runs over a weekend, so most of the work is preparing assets beforehand.",
            [("graphics", true), ("audio", false)],
            ["Unity", "C#"],
            10,
            "3 weeks of prep, then one weekend",
            1,
            6);

        var habitWeb = AddListing(
            emre,
            "Web version of a habit tracker, back end already written",
            "ASP.NET Core API with auth and the database are done. Everything the user sees is missing.",
            "I built the API last semester: accounts, habits, daily check-ins, streaks, all tested. The problem is that I opened Figma, stared at it for an hour and closed it again.\n\nI am looking for someone who can design and build the web client in React. I will keep owning the API and the deployment, and I am happy to pair on anything you have not done before.",
            [("frontend", true), ("uiux", false)],
            ["ASP.NET Core", "React", "TypeScript", "PostgreSQL"],
            8,
            "8 weeks",
            1,
            12);

        var campusApp = AddListing(
            lucas,
            "Android app for campus club events",
            "The app is half built in Compose. I need someone to own the server side.",
            "Students at my university find out about club events through a mess of Instagram stories. The app lets clubs publish events and students follow the ones they care about.\n\nThe Android side is mine. What I need is an API with accounts, events and push notifications, plus someone who actually enjoys that work. Bonus if you have an opinion about how we store images.",
            [("backend", true), ("graphics", false)],
            ["Kotlin", "Firebase", "REST", "PostgreSQL"],
            6,
            "One semester",
            2,
            20);

        var newsSummariser = AddListing(
            burak,
            "Turkish news summariser with an open model",
            "The model works in a notebook. It needs a web app and someone to decide what it should actually do.",
            "I fine-tuned a summarisation model for Turkish news and wrapped it in a FastAPI endpoint. Right now it is a text box in a terminal.\n\nI want to turn it into something people would use daily. That needs a real interface, and honestly it needs someone to tell me what the product should be, because every feature sounds equally good to me.",
            [("frontend", true), ("product", false)],
            ["Python", "FastAPI", "PyTorch", "React"],
            10,
            "10 weeks",
            1,
            9);

        var airQuality = AddListing(
            elif,
            "Open data dashboard for Ankara air quality",
            "I have the analysis and the charts in notebooks. I cannot turn them into a website.",
            "Five years of measurements, cleaned, with some genuinely interesting seasonal patterns. It deserves to be more than a notebook nobody opens.\n\nI am looking for someone to build a small public dashboard: a map, a few charts and a date filter. I will prepare the data and the endpoints.",
            [("frontend", true), ("uiux", false)],
            ["Python", "Pandas", "React", "Plotly"],
            6,
            "6 weeks",
            1,
            16);

        AddListing(
            aisha,
            "Beginner-friendly CTF practice platform",
            "Challenges and the Docker setup are mine. I need the website around them.",
            "I have written about twenty beginner security challenges and each one runs in its own container. There is no website: right now people clone a repository and read a text file.\n\nI want a proper site where students can register, start a challenge and submit a flag. I can build the challenge runner. I need help with everything a user sees, and with deploying it somewhere that will not fall over.",
            [("frontend", true), ("devops", false)],
            ["Python", "Flask", "Docker"],
            8,
            "Ongoing",
            1,
            4);

        var cozyFarm = AddListing(
            zeynep,
            "Cozy farming game, art is finished",
            "A full set of art and animation waiting for someone to make it playable.",
            "I made all of the art for a small farming game during a jam and never found a programmer. Tileset, four characters, animations and the UI are all done.\n\nIt would be a shame to leave it in a folder. Looking for someone who can build the game loop in Godot or Unity.",
            [("gamedev", true)],
            ["Godot", "Unity"],
            8,
            "3 months",
            1,
            55,
            ListingStatus.Closed);

        await db.SaveChangesAsync();

        // ----------------------------------------------------------------- requests

        void Apply(
            Listing listing,
            User applicant,
            string message,
            int daysAgo,
            ApplicationStatus status = ApplicationStatus.Pending,
            ApplicationOrigin origin = ApplicationOrigin.Applied)
        {
            db.Applications.Add(new Application
            {
                Listing = listing,
                Applicant = applicant,
                Origin = origin,
                Message = message,
                Status = status,
                CreatedAt = now.AddDays(-daysAgo),
                RespondedAt = status == ApplicationStatus.Pending ? null : now.AddDays(-daysAgo + 1),
            });
        }

        // Waiting for the demo account to answer.
        Apply(jamGame, zeynep, "Hi Kaan, this is exactly the kind of jam I want to be in. I can do the tileset, the two characters and the UI, and I have done a jam under deadline before so I know how to cut scope. I cannot do sound, but I know someone who might. My pixel art is on my profile.", 3);
        Apply(jamGame, deniz, "Hello! I am a first-year student and I would love to be part of a jam team. I cannot draw, but I can write the itch.io page, the README and test the build on different machines so you two can keep working.", 2);

        // Sent by the demo account.
        Apply(campusApp, kaan, "Hi Lucas, I saw you need the server side. I have built an ASP.NET Core API with accounts and EF Core before (study-planner-api on my profile) and this is the part of a project I actually enjoy. I have about ten hours a week.", 5);

        Apply(habitWeb, can, "Hi Emre, I am still in high school, so I understand if this is not what you had in mind. I have built three small sites for real shops and I am working through React properly. I would take this seriously and I learn fast.", 7);
        Apply(habitWeb, zeynep, "Zeynep, your tileset and your portfolio are lovely. My API is finished but the app has no design at all. Would you take the interface for this one?", 4, ApplicationStatus.Pending, ApplicationOrigin.Invited);

        Apply(newsSummariser, can, "Hi Burak, I would like to build the interface for this. I have not worked with an API like yours before, but I can do the React side and I am happy to be told when I get it wrong.", 6);
        Apply(newsSummariser, selin, "Hi Burak, thanks for the invitation. I would be glad to help decide what this should be. I would start by talking to ten students who read news in Turkish and work backwards from that.", 3, ApplicationStatus.Pending, ApplicationOrigin.Invited);

        Apply(airQuality, deniz, "Hi Elif, I am only a first-year student but I would love to try the front end for this.", 10, ApplicationStatus.Rejected);

        Apply(campusApp, emre, "Hi Lucas, I can take the whole API and the deployment. I have done exactly this stack before and my minimal-api-starter repository is more or less the skeleton for it.", 14, ApplicationStatus.Accepted);
        Apply(cozyFarm, mert, "I would love to make this playable. I work in Unity mostly, but I have used Godot for one jam and your art is far better than anything I could make myself.", 45, ApplicationStatus.Accepted);

        await db.SaveChangesAsync();
    }
}
