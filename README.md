# Career Path

**Find your path in tech, and the people walking it.**

Career Path helps students choose a direction in IT with honest reality checks, follow a step-by-step roadmap of free
resources, learn from verified experts and team up with other students on the same journey.

Built for the Education Hackathon, topic **Personal and Learning Development** (with XP and levels from
**Fun Learning and Motivation**).

## What it does

- **Explore career paths.** Six IT paths (Game Development, Web, Data Science & AI, Cybersecurity, Mobile, Cloud &
  DevOps). Each has a reality check: a day in the life, entry difficulty, time to job-ready, key skills, first jobs,
  "a good fit if" and "think twice if".
- **Follow a roadmap.** 8-9 steps per path, from beginner to job-ready, each linked to a free resource. Ticking off a
  step earns XP and levels you up.
- **Join the communities.** Hand-picked links to the most active communities for each path.
- **Discuss.** Ask questions or share experiences per path. Answers from verified experts are pinned and highlighted.
- **Find collaborators.** Public student profiles (paths, progress, skills, what they are looking for), a searchable
  people directory, and explainable match suggestions ("Also on the Web Development path", "Brings skills you don't
  list: SQL, Docker").
- **Collaborate safely.** Send a collaboration request (or ask an expert for mentoring). Email and contact handle are
  only revealed after the other person accepts.
- **Not sure where to start?** A 5-question quiz suggests a path.

## Tech stack

| Part | Stack |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router |
| Backend | ASP.NET Core (.NET 10) Web API, EF Core, SQLite, JWT authentication |
| API docs | OpenAPI + Scalar UI at `http://localhost:5080/scalar` |

## Getting started

Prerequisites: [.NET 10 SDK](https://dotnet.microsoft.com/download) and [Node.js](https://nodejs.org/) 20.19+ or 22.12+.

Start the API (terminal 1). The SQLite database is created and filled with demo data on first run:

```bash
cd backend
dotnet run --project CareerPath.Api
```

Start the web app (terminal 2):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server forwards `/api` calls to the API on port 5080.

To reset the demo data (do this right before presenting), stop the API and run:

```bash
cd backend
dotnet run --project CareerPath.Api -- --reset-db
```

## Demo accounts

All demo accounts use the password `demo1234`. The login page has a "Fill in demo login" button.

| Account | Who |
| --- | --- |
| `demo@example.com` | **Kaan Erdem**, student on Game and Web Development. Has progress, a pending request from Zeynep and more. |
| `zeynep@example.com` | Zeynep Kaya, pixel artist looking for a programmer |
| `burak@example.com` | Burak Koç, expert (Lead Gameplay Programmer) |
| `ece@example.com`, `selin@example.com`, `deniz@example.com`, `kerem@example.com` | Experts for web/mobile, data, security and DevOps |
| `mert@`, `can@`, `elif@`, `aisha@`, `lucas@`, `emre@`, `ayse@example.com` | Other students |

## Demo script (about 3 minutes)

1. **Home → Explore IT careers → Game Development.** Show the reality check: day in the life, difficulty,
   "think twice if".
2. **Log in as the demo account.** Header shows level and XP.
3. **Roadmap tab.** Tick steps 3 and 4: XP goes up and the level-up toast appears.
4. **Discussions tab → "Unity or Godot..."** The expert answer is pinned on top.
5. **People tab.** Students on the same path with their progress. Zeynep already sent a request.
6. **Collaborations.** Accept Zeynep's request: her contact details appear and both get +25 XP.
7. **People page.** Suggested collaborators with the reasons for each match.

## Project structure

```text
backend/
  CareerPath.Api/
    Controllers/        HTTP endpoints (all under /api)
    Models/             EF Core entities
    Dtos/               Request and response records
    Services/           Tokens, XP rules, profiles, match suggestions
    Data/               DbContext, seeder and Seed/catalog.json (fields, paths, roadmaps, communities)
    CareerPath.Api.http Ready-made requests for testing the API
  check-links.ps1       Checks every link in the catalog
frontend/
  src/
    lib/                API client, types (mirror of the DTOs), hooks, formatting, styles
    auth/               Auth context and provider (JWT stored in localStorage)
    components/         Shared UI: layout, cards, avatars, collaborate dialog...
    pages/              One file per page; pages/subfield/ holds the career path tabs
```

## API overview

| Method and route | Purpose |
| --- | --- |
| `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | Accounts and the signed-in user (XP, level, pending requests) |
| `GET /api/stats`, `GET /api/fields`, `GET /api/fields/{slug}` | Platform numbers, fields and their career paths |
| `GET /api/subfields/{slug}` | Career path detail with roadmap and communities |
| `GET /api/subfields/{slug}/people`, `POST`/`DELETE /api/subfields/{slug}/join` | People on a path, join or leave |
| `POST`/`DELETE /api/progress/{stepId}` | Complete or undo a roadmap step |
| `GET`/`POST /api/subfields/{slug}/topics`, `GET /api/topics/recent`, `GET /api/topics/{id}`, `POST /api/topics/{id}/replies` | Discussions |
| `GET /api/users`, `GET /api/users/suggestions`, `GET /api/users/{id}`, `PUT /api/users/me` | People directory, matches, profiles |
| `GET`/`POST /api/collaborations`, `POST /api/collaborations/{id}/accept`, `/decline`, `DELETE /api/collaborations/{id}` | Collaboration requests |

Errors use the standard ProblemDetails format. Protected endpoints need `Authorization: Bearer <token>`.

## Team split

| Who | Owns |
| --- | --- |
| Front-end developer | Everything in `frontend/src`: pages, components, styling |
| Back-end developer 1 | Auth, users and profiles, collaborations, match suggestions (`AuthController`, `UsersController`, `CollaborationsController`, `ProfileService`, `MatchService`) |
| Back-end developer 2 | Career content, roadmap progress, discussions and seed data (`FieldsController`, `SubFieldsController`, `ProgressController`, `TopicsController`, `Data/`) |

When an API response changes, update the matching record in `backend/CareerPath.Api/Dtos` and the interface in
`frontend/src/lib/types.ts` together.

## Ideas for after the MVP

- More fields (healthcare, design, business...) are already listed as "coming soon" and only need content in
  `catalog.json`.
- Expert verification flow (experts are seeded for now; new sign-ups are students).
- Notifications for new replies and collaboration requests.
- Team spaces for accepted collaborations (shared goals, checklists).
