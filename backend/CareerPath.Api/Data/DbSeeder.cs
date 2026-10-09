using System.Text.Json;
using System.Text.Json.Serialization;
using CareerPath.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CareerPath.Api.Data;

/// <summary>
/// Creates the SQLite database on first run and fills it with the career catalog
/// (Data/Seed/catalog.json) and a small demo community. Run with --reset-db to start over.
/// </summary>
public static class DbSeeder
{
    public const string DemoEmail = "demo@example.com";
    public const string DemoPassword = "demo1234";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

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

        if (!await db.Database.EnsureCreatedAsync())
        {
            return;
        }

        await SeedCatalogAsync(db);
        await SeedCommunityAsync(db, scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>());
        logger.LogInformation("Created and seeded the database. Demo login: {Email} / {Password}", DemoEmail, DemoPassword);
    }

    private static async Task SeedCatalogAsync(AppDbContext db)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "catalog.json");
        await using var stream = File.OpenRead(path);
        var fields = await JsonSerializer.DeserializeAsync<List<Field>>(stream, JsonOptions)
            ?? throw new InvalidOperationException($"Could not read the catalog from {path}.");

        for (var f = 0; f < fields.Count; f++)
        {
            fields[f].SortOrder = f;
            for (var s = 0; s < fields[f].SubFields.Count; s++)
            {
                var subField = fields[f].SubFields[s];
                subField.SortOrder = s;
                for (var r = 0; r < subField.RoadmapSteps.Count; r++)
                {
                    subField.RoadmapSteps[r].Order = r + 1;
                }
            }
        }

        db.Fields.AddRange(fields);
        await db.SaveChangesAsync();
    }

    private static async Task SeedCommunityAsync(AppDbContext db, IPasswordHasher<User> passwordHasher)
    {
        var now = DateTime.UtcNow;
        var paths = await db.SubFields.Include(s => s.RoadmapSteps).ToDictionaryAsync(s => s.Slug);
        var passwordHash = passwordHasher.HashPassword(new User { Email = "", DisplayName = "" }, DemoPassword);

        User AddUser(User user)
        {
            user.PasswordHash = passwordHash;
            db.Users.Add(user);
            return user;
        }

        void Complete(User user, string slug, params int[] stepOrders)
        {
            foreach (var order in stepOrders)
            {
                db.RoadmapProgress.Add(new RoadmapProgress
                {
                    User = user,
                    RoadmapStep = paths[slug].RoadmapSteps.Single(s => s.Order == order),
                    CompletedAt = now.AddDays(-40 + order * 4),
                });
            }
        }

        Topic Discuss(string slug, User author, TopicKind kind, TimeSpan ago, string title, string body)
        {
            var topic = new Topic
            {
                SubField = paths[slug],
                Author = author,
                Kind = kind,
                Title = title,
                Body = body,
                CreatedAt = now - ago,
            };
            db.Topics.Add(topic);
            return topic;
        }

        void Answer(Topic topic, User author, TimeSpan ago, string body) =>
            topic.Replies.Add(new Reply { Author = author, Body = body, CreatedAt = now - ago });

        static TimeSpan Days(double days) => TimeSpan.FromDays(days);
        static TimeSpan Hours(double hours) => TimeSpan.FromHours(hours);

        // Experts
        var burak = AddUser(new User
        {
            Email = "burak@example.com",
            DisplayName = "Burak Koç",
            Role = UserRole.Expert,
            ExpertTitle = "Lead Gameplay Programmer",
            Headline = "10 years in game studios, 6 shipped titles on console and mobile.",
            Bio = "I started by making small Flash games as a teenager and now lead a gameplay team. Once a month I review student portfolios, so ask me anything about breaking into the games industry.",
            Location = "Istanbul",
            Skills = ["C#", "C++", "Unity", "Unreal Engine", "Game AI"],
            InterestSlugs = ["game-development"],
            CollaborationNote = "Happy to mentor game jam teams and review portfolios.",
            ContactHandle = "LinkedIn: Burak Koç",
            CreatedAt = now.AddDays(-120),
        });
        var ece = AddUser(new User
        {
            Email = "ece@example.com",
            DisplayName = "Ece Polat",
            Role = UserRole.Expert,
            ExpertTitle = "Senior Front-end Engineer",
            Headline = "Building design systems with React and TypeScript. Bootcamp mentor.",
            Bio = "I moved into tech from graphic design six years ago. Today I build accessible interfaces for web and React Native apps, and I mentor career changers.",
            Location = "Ankara",
            Skills = ["React", "TypeScript", "CSS", "Accessibility", "React Native"],
            InterestSlugs = ["web-development", "mobile-development"],
            CollaborationNote = "Open to reviewing front-end portfolios and CVs.",
            ContactHandle = "LinkedIn: Ece Polat",
            CreatedAt = now.AddDays(-110),
        });
        var selin = AddUser(new User
        {
            Email = "selin@example.com",
            DisplayName = "Selin Aydın",
            Role = UserRole.Expert,
            ExpertTitle = "Senior Data Scientist",
            Headline = "PhD in statistics, now building recommendation models in e-commerce.",
            Bio = "I have worked on forecasting, recommendation systems and experimentation. I love helping students turn coursework into real portfolio projects.",
            Location = "Izmir",
            Skills = ["Python", "PyTorch", "SQL", "Statistics", "MLOps"],
            InterestSlugs = ["data-science-ai"],
            CollaborationNote = "I can advise one Kaggle team per season.",
            ContactHandle = "LinkedIn: Selin Aydın",
            CreatedAt = now.AddDays(-100),
        });
        var deniz = AddUser(new User
        {
            Email = "deniz@example.com",
            DisplayName = "Deniz Çelik",
            Role = UserRole.Expert,
            ExpertTitle = "Security Engineer, Red Team",
            Headline = "Former SOC analyst turned penetration tester. OSCP certified.",
            Bio = "I spent three years in a security operations center before moving to offensive security. I organise a small local CTF meetup.",
            Location = "Istanbul",
            Skills = ["Penetration testing", "Python", "Web security", "Active Directory"],
            InterestSlugs = ["cybersecurity"],
            CollaborationNote = "Ask me about CTF teams and first security jobs.",
            ContactHandle = "LinkedIn: Deniz Çelik",
            CreatedAt = now.AddDays(-95),
        });
        var kerem = AddUser(new User
        {
            Email = "kerem@example.com",
            DisplayName = "Kerem Aksoy",
            Role = UserRole.Expert,
            ExpertTitle = "Cloud & DevOps Engineer",
            Headline = "Running Kubernetes in production for a fintech company.",
            Bio = "I started as a system administrator and moved into cloud engineering. I care about simple, boring infrastructure that never wakes anyone up at night.",
            Location = "Ankara",
            Skills = ["Kubernetes", "Terraform", "Azure", "AWS", "CI/CD"],
            InterestSlugs = ["cloud-devops"],
            CollaborationNote = "Happy to review homelab and DevOps portfolio projects.",
            ContactHandle = "LinkedIn: Kerem Aksoy",
            CreatedAt = now.AddDays(-90),
        });

        // Students
        var kaan = AddUser(new User
        {
            Email = DemoEmail,
            DisplayName = "Kaan Erdem",
            Headline = "Computer engineering student exploring game development.",
            Bio = "First-year student. I fell in love with games through modding and now I want to build my own. I also enjoy web development and might combine both one day.",
            Location = "Istanbul",
            Skills = ["C#", "Python", "Unity"],
            InterestSlugs = ["game-development", "web-development"],
            CollaborationNote = "Looking for teammates for the next game jam.",
            ContactHandle = "Discord: kaan.dev",
            CreatedAt = now.AddDays(-20),
        });
        var mert = AddUser(new User
        {
            Email = "mert@example.com",
            DisplayName = "Mert Demir",
            Headline = "Second-year CS student and Unity hobbyist.",
            Bio = "I build small 3D prototypes in Unity on weekends. My dream is to work on co-op games.",
            Location = "Bursa",
            Skills = ["C#", "Unity", "Blender"],
            InterestSlugs = ["game-development"],
            CollaborationNote = "Building a co-op puzzle game and looking for a level designer.",
            ContactHandle = "Discord: mertdev",
            CreatedAt = now.AddDays(-45),
        });
        var zeynep = AddUser(new User
        {
            Email = "zeynep@example.com",
            DisplayName = "Zeynep Kaya",
            Headline = "Illustrator learning to make games.",
            Bio = "I study visual communication design and draw pixel art. I made my first game in a jam last month and I'm hooked.",
            Location = "Istanbul",
            Skills = ["Pixel art", "Aseprite", "Godot", "UI design"],
            InterestSlugs = ["game-development"],
            CollaborationNote = "I draw and animate. Looking for a programmer for a cozy farming game.",
            ContactHandle = "Discord: zeynep.draws",
            CreatedAt = now.AddDays(-60),
        });
        var can = AddUser(new User
        {
            Email = "can@example.com",
            DisplayName = "Can Öztürk",
            Headline = "High school senior teaching himself web development.",
            Bio = "I build websites for local shops in my free time and I want to study software engineering next year.",
            Location = "Izmir",
            Skills = ["HTML", "CSS", "JavaScript"],
            InterestSlugs = ["web-development"],
            CollaborationNote = "Looking for a study buddy to go through React together.",
            ContactHandle = "Discord: can_codes",
            CreatedAt = now.AddDays(-35),
        });
        var elif = AddUser(new User
        {
            Email = "elif@example.com",
            DisplayName = "Elif Yılmaz",
            Headline = "Statistics student moving into machine learning.",
            Bio = "Third-year statistics student. I enjoy finding stories in messy datasets and I'm preparing for my first Kaggle competition.",
            Location = "Ankara",
            Skills = ["Python", "Pandas", "SQL", "R"],
            InterestSlugs = ["data-science-ai"],
            CollaborationNote = "Looking for a team for a Kaggle competition.",
            ContactHandle = "Discord: elif.data",
            CreatedAt = now.AddDays(-50),
        });
        var aisha = AddUser(new User
        {
            Email = "aisha@example.com",
            DisplayName = "Aisha Khan",
            Headline = "Exchange student and CTF player.",
            Bio = "I'm studying computer science on an exchange programme. Most evenings I'm solving CTF challenges or TryHackMe rooms.",
            Location = "Istanbul",
            Skills = ["Linux", "Networking", "Python", "Wireshark"],
            InterestSlugs = ["cybersecurity"],
            CollaborationNote = "Weekly CTF practice partner wanted.",
            ContactHandle = "Discord: aisha_ctf",
            CreatedAt = now.AddDays(-40),
        });
        var lucas = AddUser(new User
        {
            Email = "lucas@example.com",
            DisplayName = "Lucas Martin",
            Headline = "Self-taught Android developer.",
            Bio = "I switched from studying economics to building Android apps. My first app helps students track study habits.",
            Location = "Eskisehir",
            Skills = ["Kotlin", "Jetpack Compose", "Figma"],
            InterestSlugs = ["mobile-development"],
            CollaborationNote = "Building a habit tracker app and need someone for the back end.",
            ContactHandle = "Discord: lucas.kt",
            CreatedAt = now.AddDays(-30),
        });
        var emre = AddUser(new User
        {
            Email = "emre@example.com",
            DisplayName = "Emre Şahin",
            Headline = "Back-end developer in training who loves C#.",
            Bio = "Software engineering student. I build APIs with ASP.NET Core and I'm learning Docker and the cloud.",
            Location = "Istanbul",
            Skills = ["C#", "ASP.NET Core", "SQL", "Docker"],
            InterestSlugs = ["web-development", "cloud-devops"],
            CollaborationNote = "Back-end dev looking for a front-end partner for a side project.",
            ContactHandle = "Discord: emre.dotnet",
            CreatedAt = now.AddDays(-75),
        });
        var ayse = AddUser(new User
        {
            Email = "ayse@example.com",
            DisplayName = "Ayşe Arslan",
            Headline = "Psychology student curious about data.",
            Bio = "I analyse survey data for my research projects and I'm exploring whether data science could be my career.",
            Location = "Ankara",
            Skills = ["Python", "Excel", "SPSS"],
            InterestSlugs = ["data-science-ai"],
            OpenToCollaborate = false,
            ContactHandle = "Discord: ayse.a",
            CreatedAt = now.AddDays(-15),
        });

        // Roadmap progress
        Complete(kaan, "game-development", 1, 2);
        Complete(kaan, "web-development", 1);
        Complete(mert, "game-development", 1, 2, 3);
        Complete(zeynep, "game-development", 1, 2, 3, 6);
        Complete(can, "web-development", 1, 2);
        Complete(elif, "data-science-ai", 1, 2, 3, 4);
        Complete(aisha, "cybersecurity", 1, 2, 3);
        Complete(lucas, "mobile-development", 1, 2, 3);
        Complete(emre, "web-development", 1, 2, 3, 6, 7);
        Complete(emre, "cloud-devops", 1, 3);
        Complete(ayse, "data-science-ai", 1);

        // Game development discussions
        var engine = Discuss("game-development", mert, TopicKind.Question, Days(5),
            "Unity or Godot for my first real project?",
            "I've done a few Unity tutorials, but everyone on my feed seems to be switching to Godot. I want to build a small 2D platformer and eventually get a job at a studio. Does the engine I start with actually matter?");
        Answer(engine, zeynep, Days(4.5),
            "I started with Godot because it's light and opens instantly on my old laptop. GDScript felt a lot like Python, so it was easy to pick up. I can't say much about studio jobs though.");
        Answer(engine, burak, Days(3),
            "Short answer: the engine matters much less than finishing games. The core skills transfer everywhere: game loops, vectors, state machines and debugging. If your goal is a studio job, check local job listings; in many markets Unity and Unreal show up more often, so C# with Unity is a safe bet. If you mainly want to learn fast and ship small games, Godot is fantastic. Either way: pick one, make three tiny games, and only then think about switching.");
        Answer(engine, kaan, Days(2),
            "This is really helpful, thanks! I'll stick with Unity since I already know some C#.");

        var jam = Discuss("game-development", zeynep, TopicKind.Experience, Days(9),
            "I finished my first game jam! Here is what I learned",
            "Last weekend I joined a 48-hour jam on itch.io with two people I met online. My lessons: 1) Cut your idea in half, then in half again. 2) Make the game playable in the first 6 hours, even if it's ugly. 3) Sound effects make a huge difference. 4) Submit an hour early, because uploads always break. We placed 34th out of about 400 entries and I made two new friends.");
        Answer(jam, mert, Days(8.5),
            "Congrats! Would you be up for teaming up for the next one? I can handle the programming.");
        Answer(jam, burak, Days(7),
            "Great write-up. Point 2 is what separates people who finish from people who don't. Studios love seeing jam games in a portfolio because they prove you can ship under a deadline.");

        var portfolio = Discuss("game-development", kaan, TopicKind.Question, Days(1),
            "How do I build a portfolio without any professional experience?",
            "I'm a first-year student. Every job post asks for a portfolio, but so far I've only followed tutorials. What should a beginner game developer's portfolio actually contain?");
        Answer(portfolio, burak, Hours(20),
            "Three to five small, finished, playable games beat one huge unfinished project. For each one show a 20-30 second gameplay clip, a link to play it in the browser, your exact role, and one technical problem you solved. Jam games count! Keep it all on a simple one-page site.");

        // Web development discussions
        var ai = Discuss("web-development", can, TopicKind.Question, Days(6),
            "Is web development still worth learning now that AI writes code?",
            "I'm 17 and just started HTML and CSS. Some people say AI will replace junior web developers. Should I keep going?");
        Answer(ai, ece, Days(5.5),
            "Yes, keep going. AI tools make developers faster, but someone still has to understand the problem, check the code, fix what the AI gets wrong and make good decisions about design, accessibility and security. Learn the fundamentals properly and learn to use AI tools well. People who can do both are exactly who teams want to hire.");
        Answer(ai, emre, Days(5),
            "Agreed. I use AI every day, but I'd be lost if I didn't understand what it generates.");

        var dotnet = Discuss("web-development", emre, TopicKind.Resource, Days(12),
            "Free resources that actually helped me learn ASP.NET Core",
            "Sharing what worked for me: the official Microsoft Learn web API tutorial, then building a small to-do API with Entity Framework Core and SQLite, then adding JWT authentication. Happy to help anyone stuck on C# back-end topics.");
        Answer(dotnet, can, Days(11),
            "Saving this! Would you recommend learning the back end before React?");
        Answer(dotnet, emre, Days(10.5),
            "Either order works. Pick one, get comfortable, and then add the other.");

        // Data science discussions
        var masters = Discuss("data-science-ai", elif, TopicKind.Question, Days(4),
            "Do I need a master's degree to become a data scientist?",
            "I'm in my third year of a statistics degree. Many job posts ask for a master's. Is it required, or can strong projects replace it?");
        Answer(masters, selin, Days(3),
            "It depends on the role. Research-heavy machine learning positions often expect a graduate degree, but many data analyst and data scientist roles hire people with a bachelor's and a strong portfolio. With a statistics background you already have the hardest foundation. Add solid SQL, two or three end-to-end projects with real data, and a Kaggle competition. You can consider a master's later, possibly while working.");
        Answer(masters, ayse, Days(2),
            "Thank you both, this is reassuring for me too.");

        var firstJob = Discuss("data-science-ai", selin, TopicKind.Advice, Days(14),
            "What I wish I knew before my first data science job",
            "1) Around 80% of the work is understanding and cleaning data. 2) A simple model people trust beats a complex one nobody understands. 3) SQL matters more than you think. 4) Communication is a core skill: practise explaining your results to non-technical friends.");
        Answer(firstJob, elif, Days(13),
            "Point 2 is so true. In my internship nobody cared about my fancy model until I explained it with one simple chart.");

        // Cybersecurity discussions
        var team = Discuss("cybersecurity", aisha, TopicKind.Question, Days(3),
            "Should I start with blue team or red team?",
            "Penetration testing looks exciting, but most entry-level jobs seem to be SOC analyst roles. Where should a beginner start?");
        Answer(team, deniz, Days(2),
            "I started as a SOC analyst and I'm grateful I did. Defending teaches you what real attacks look like in logs, which makes you a much better pentester later. SOC roles are also far more common as a first job. Practise both in labs, but aim your CV at blue team roles first.");

        Discuss("cybersecurity", aisha, TopicKind.Question, Days(10),
            "Looking for CTF teammates (beginner friendly)",
            "I play picoCTF and TryHackMe rooms most evenings. Does anyone want to form a small team for the next beginner CTF on CTFtime?");

        // Mobile development discussions
        var native = Discuss("mobile-development", lucas, TopicKind.Question, Days(7),
            "Native Kotlin or Flutter for my first job?",
            "I've been learning Kotlin with Jetpack Compose, but I see a lot of Flutter job posts too. Should I switch?");
        Answer(native, ece, Days(6),
            "Both are very hireable. Look at the job posts in your city and count them. Whatever you choose, the fundamentals carry over: state management, networking, offline storage and good UI. Finish and publish one great app before switching stacks.");

        // Cloud and DevOps discussions
        var kubernetes = Discuss("cloud-devops", kerem, TopicKind.Advice, Days(8),
            "You don't need Kubernetes yet",
            "Many beginners jump straight to Kubernetes. Start with Linux, networking and Docker instead. Deploy one app to a single cloud VM, automate it with a CI pipeline, and then you'll understand why Kubernetes exists.");
        Answer(kubernetes, emre, Days(7),
            "This saved me. I was trying to learn Helm charts before I even understood Docker networking.");

        // Collaboration requests
        db.CollaborationRequests.AddRange(
            new CollaborationRequest
            {
                Sender = zeynep,
                Receiver = kaan,
                SubFieldSlug = "game-development",
                Message = "Hi Kaan! I saw you're on the game development path and know some C#. I'm an illustrator making a cozy farming game in Godot and I need a programmer. Want to team up for the next jam?",
                CreatedAt = now.AddHours(-5),
            },
            new CollaborationRequest
            {
                Sender = emre,
                Receiver = can,
                SubFieldSlug = "web-development",
                Message = "Hey Can, I'm a back-end developer and you're learning the front end. Want to build a small full-stack project together?",
                Status = CollaborationStatus.Accepted,
                CreatedAt = now.AddDays(-9),
                RespondedAt = now.AddDays(-8),
            },
            new CollaborationRequest
            {
                Sender = mert,
                Receiver = zeynep,
                SubFieldSlug = "game-development",
                Message = "Loved your jam write-up! I can program in Unity. Would you like to team up for the next jam?",
                CreatedAt = now.AddDays(-7),
            },
            new CollaborationRequest
            {
                Sender = aisha,
                Receiver = elif,
                SubFieldSlug = "data-science-ai",
                Message = "Hi Elif! I'd love to try a project that mixes data science and security, like detecting unusual activity in network logs. Interested?",
                Status = CollaborationStatus.Accepted,
                CreatedAt = now.AddDays(-4),
                RespondedAt = now.AddDays(-3),
            },
            new CollaborationRequest
            {
                Sender = lucas,
                Receiver = emre,
                SubFieldSlug = "mobile-development",
                Message = "Hi Emre, I'm building a habit tracker app in Kotlin and need a back end for syncing. Would you like to build it with me?",
                CreatedAt = now.AddDays(-2),
            });

        await db.SaveChangesAsync();
    }
}
