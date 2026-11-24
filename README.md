# Lead Manager

A small full-stack app to capture and track sales leads: add, list, edit, delete,
search, filter by status, sort, paginate, and see a count of leads per status.

## Tech used

- **Backend:** Node.js + Express (plain JavaScript)
- **Database:** SQLite, one `leads` table, file-based — no server to install
- **Frontend:** React + Vite, plain CSS, no UI library
- **Tests:** Jest + Supertest for the API

Why this stack: it is the stack I know best, it runs with two commands and no
paid services, and every part is small enough to explain line by line. SQLite
keeps the data in a single file (`backend/leads.db`, created on first run), so
there is nothing to set up before the app works.

One note: the database uses Node's built-in `node:sqlite` module (Node 22+)
instead of the `better-sqlite3` package. Same SQL, same single-file database,
but no native build step — `npm install` just works on any machine.

## How to run it locally

You need Node.js 22 or newer.

```bash
# Terminal 1 — backend (http://localhost:4000)
cd backend
npm install
npm start

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser. The frontend talks to the API at
`http://localhost:4000/api` (change it with `VITE_API_URL` in a `.env` file —
see `.env.example`).

Run the API tests:

```bash
cd backend
npm test
```

## API

| Method | Endpoint | What it does |
| ------ | -------- | ------------ |
| GET | `/api/leads?search=&status=&sort=&order=&page=&limit=` | List leads, paginated |
| GET | `/api/leads/stats` | Total + count per status |
| GET | `/api/leads/:id` | One lead |
| POST | `/api/leads` | Create a lead |
| PUT | `/api/leads/:id` | Update a lead |
| DELETE | `/api/leads/:id` | Delete a lead |

Search matches name, company, or email. Sort by `name`, `company`, or
`created_at`, order `asc` / `desc`. Page size defaults to 10, max 50.

Validation (same rules on frontend and backend): name is required, email is
required and must look like an email, phone is optional but if given must be
digits/spaces/`+`/`-`/brackets with at least 7 digits, source must be one of
the list below, status must be New / Contacted / Qualified / Lost. Bad input
gets a `400` with a list of errors; a missing lead gets a `404`.

## Database

```sql
leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  source TEXT,
  status TEXT NOT NULL CHECK(status IN ('New','Contacted','Qualified','Lost')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
```

Indexes on `status` and `name`, since those are the two fields we filter and
search on.

## Assumptions I made

- **Lead sources** are a fixed list: Website, Referral, LinkedIn, Cold Call,
  Email, Other. The brief did not give a list, so I picked the six most common
  ones for a small sales team.
- **Single user, no login (v1).** See "What I cut" below.
- **Phone is optional**, name and email are required — a lead without a way to
  reach them is not much use, but a phone number is not always known yet.
- **Timestamps** are stored as ISO strings (`created_at`, `updated_at`).
- **One SQLite file** is enough here: this is a single-user tool, not a
  multi-user service, so there is no need for Postgres yet.

## What I cut (and why)

- **Authentication.** The brief lists it as a bonus only if the core is solid.
  A login screen would add friction for the reviewer and risk to the core
  features, so v1 has no auth and every lead belongs to the one user. With
  more time I would add JWT login and a `user_id` on each lead so each user
  only sees their own leads.
- **No deployment in this repo.** The app runs locally with the two commands
  above; hosting is a separate step.

## What I would improve with more time

- JWT login + per-user leads (above).
- Lead detail page with a notes/activity history per lead.
- Export leads to CSV.
- Swap SQLite for Postgres when more than one person needs to use it at once.
- Frontend tests (React Testing Library) — right now only the API is tested.

## What I am proud of / what was tricky

I am most proud that the whole thing actually works end to end with no mock
data — the table you see is the real database. The trickiest part was keeping
the validation identical on both sides: the frontend checks input before it
sends anything, and the backend checks it again so bad data can never sneak in
through the API directly. Getting search, filter, sort and pagination to all
work together in one query took a few tries to get right.
