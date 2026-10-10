# CollabMe

**Find the people who cover what you cannot.**

Student projects usually die because one person can build half of them. CollabMe is where a student posts the
project they are stuck on, says plainly which areas are outside their own expertise, and gets matched with the people
who fill exactly those gaps.

Built for the Education Hackathon, topic **Personal and Learning Development**.

## What it does

- **Post what you cannot do.** A listing names up to five areas you need someone else for. Starred areas are
  must-haves and count double in the score.
- **Get a match score you can argue with.** Every applicant is scored out of 100 and the score is never a black box:
  it breaks into needed areas (55), shared technologies (20), proof of work on GitHub (15) and availability (10),
  each with a one-line explanation plus named strengths and gaps.
- **Profiles backed by code.** Students pick their competencies with a confidence level, list their tools, and
  connect GitHub. Their public repositories are imported through the GitHub API and used as evidence in the score, so
  "I know Unity" is worth less than a Unity repository with stars on it.
- **Decide with a second opinion.** Before accepting or declining a request, the listing owner can ask for a written
  suitability report on the applicant: what fits, what does not, three questions to ask them, and a sensible first
  task. Only the owner ever sees it.
- **Requests go both ways.** Students apply to listings, and owners invite people the match score surfaced. Either
  way the receiving side accepts or declines.
- **Contact details stay private.** Email and handle are only revealed once a request has been accepted. Many users
  here are under 18.

## Where the AI is, and where it is not

The match score is **not** AI. It is a deterministic, inspectable formula, so the same profile always produces the
same number and the UI can show exactly how it was built. That is on purpose: a score nobody can explain is a score
nobody trusts.

The AI sits one step later, where judgement actually helps. `POST /api/applications/{id}/review` sends the project,
the applicant's profile and the match breakdown to a language model and gets back a structured report (verdict,
summary, strengths, risks, questions, suggested first task).

**It works with no API key.** If `Ai:ApiKey` is empty, or the call fails or times out, the same report is written by a
rule-based writer from the match reasons, and the UI says so ("Written by the built-in reviewer" instead of "Written
by gpt-4o-mini"). The demo never depends on the conference Wi-Fi.

## Tech stack

| Part | Stack |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router |
| Backend | ASP.NET Core (.NET 10) Web API, EF Core, SQLite, JWT authentication |
| External APIs | GitHub REST API (repository import), any OpenAI-compatible chat completions endpoint (optional) |
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

### Optional configuration

Both of these are optional. Everything works without them; set them in `backend/CareerPath.Api/appsettings.json` or as
environment variables.

| Setting | What it does |
| --- | --- |
| `GitHub:Token` | A personal access token with no scopes. Raises the GitHub rate limit from 60 to 5000 requests an hour. Only matters if many people import repositories during the same demo. |
| `Ai:ApiKey` | Turns on the model-written suitability report. Leave empty to use the built-in rule-based writer. |
| `Ai:BaseUrl` | Defaults to `https://api.openai.com/v1/`. Point it at any OpenAI-compatible endpoint, including a local one. |
| `Ai:Model` | Defaults to `gpt-4o-mini`. |

## Demo accounts

All demo accounts use the password `demo1234`. The login page has a "Fill in demo login" button.

| Account | Who |
| --- | --- |
| `demo@example.com` | **Kaan Erdem**, backend student. Owns a game jam listing with people waiting for an answer, and has applied to another project. |
| `zeynep@example.com` | Zeynep Kaya, pixel artist. Applied to Kaan's jam listing and owns a finished-art game that needs a programmer. |
| `ipek@example.com`, `tuna@example.com`, `mert@example.com` | Artist, audio student and Unity hobbyist: the people Kaan's listing surfaces as worth asking |
| `burak@example.com`, `emre@example.com`, `elif@example.com`, `lucas@example.com`, `aisha@example.com` | Other listing owners |
| `ece@`, `selin@`, `deniz@`, `can@`, `ayse@example.com` | Other students |

## Demo script (about 3 minutes)

1. **Home.** One line: students post what they cannot do, and get scored matches for exactly that.
2. **Log in as the demo account → Requests.** Two people want in on the jam listing. Deniz scores 10, Zeynep 55.
3. **Open "How we scored this" on Zeynep.** Four components, named strengths and gaps. Nothing hidden.
4. **"Assess this applicant".** The suitability report: what fits, what to watch, what to ask her, and a first task.
5. **Accept.** Her contact details appear. They did not exist a second earlier.
6. **People → Worth asking.** İpek at 67 and Tuna at 52, each scored against what the listing is still missing.
   Invite İpek; now she is the one who decides.
7. **Her profile.** The repositories under "Public repositories" came from the GitHub API, not from a text box.

## Project structure

```text
backend/
  CareerPath.Api/
    Controllers/        HTTP endpoints (all under /api)
    Models/             EF Core entities
    Dtos/               Request and response records
    Services/           Match scoring, AI review, GitHub import, profiles, listings, tokens
    Data/               DbContext, seeder and Seed/competencies.json
    CareerPath.Api.http Ready-made requests for testing the API
frontend/
  src/
    lib/                API client, types (mirror of the DTOs), hooks, formatting, styles
    auth/               Auth context and provider (JWT stored in localStorage)
    components/         Shared UI: match score, application card, AI review panel, dialogs
    pages/              One file per page
```

## API overview

| Method and route | Purpose |
| --- | --- |
| `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | Accounts and the signed-in user |
| `GET /api/stats`, `GET /api/competencies` | Platform numbers and the competency catalog |
| `GET /api/listings`, `GET /api/listings/{id}` | Browse and read listings, each with the viewer's own match score |
| `POST /api/listings`, `PUT`/`DELETE /api/listings/{id}`, `POST /api/listings/{id}/close`, `/reopen` | Manage your listings |
| `GET /api/listings/{id}/applications` | Everyone who applied or was invited, owner only |
| `POST /api/listings/{id}/apply`, `POST /api/listings/{id}/invite` | The two directions a request can go |
| `GET /api/applications`, `POST /api/applications/{id}/accept`, `/reject`, `/withdraw` | The requests inbox |
| `POST /api/applications/{id}/review` | Write (or rewrite) the suitability report. Owner only |
| `GET /api/users`, `GET /api/users/suggestions`, `GET /api/users/{id}`, `PUT /api/users/me` | Directory, people worth inviting, profiles |
| `POST /api/users/me/github` | Import the signed-in user's public repositories from GitHub |

Errors use the standard ProblemDetails format. Protected endpoints need `Authorization: Bearer <token>`.

## Team split

| Who | Owns |
| --- | --- |
| Front-end developer | Everything in `frontend/src`: pages, components, styling |
| Back-end developer 1 | Auth, profiles, the competency catalog and the GitHub import (`AuthController`, `UsersController`, `ProfileService`, `GitHubService`) |
| Back-end developer 2 | Listings, requests, match scoring and the AI review (`ListingsController`, `ApplicationsController`, `MatchService`, `AiReviewService`) |

When an API response changes, update the matching record in `backend/CareerPath.Api/Dtos` and the interface in
`frontend/src/lib/types.ts` together.

## Ideas for after the MVP

- Weight the score by what a person has actually finished here, not only by what they claim.
- Let the owner mark which need an accepted person took, so a listing can close one gap at a time.
- Notifications when a request is answered.
- A shared checklist for teams that formed, so the match is the start of something rather than the end.
