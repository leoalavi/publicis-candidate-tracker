# Candidate Tracker

A small applicant tracking system for moving candidates through a hiring pipeline
(Applied → Screening → Interview → Offer → Rejected).

> **Assessment demo only.** There is no authentication (out of scope for this exercise),
> so anyone who can reach the app can read and change the data. Use fictional data only.

## Features

- Add a candidate (name, email, optional phone, role, resume/cover letter text, stage, optional source)
- Resume text can be pasted, or loaded from a **.txt** file (PDF and Word are not supported)
- Candidate list with filters (stage, role) and sorting (date added, or pipeline stage)
- Candidate detail page with the full profile, resume text and notes history
- Change a candidate's stage (any stage to any stage, no workflow rules)
- Append-only, timestamped notes
- Archive / restore a candidate, or delete permanently (both ask for confirmation)

## Tech stack

| Part | Choice |
|---|---|
| Framework | Next.js (App Router) with React and TypeScript |
| Styling | Tailwind CSS |
| Backend API | Next.js Route Handlers (`src/app/api/...`) |
| Database | Supabase (PostgreSQL), accessed with `@supabase/supabase-js` |
| Validation | Zod |
| Tests | Vitest |

## Getting started

You need **Node.js 22** (or newer) and a free [Supabase](https://supabase.com) account.

### 1. Install

```bash
git clone <this-repo-url>
cd <repo-folder>
npm install
```

### 2. Create the database

1. Create a new project in the Supabase dashboard.
2. Open **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it.
   This creates the `candidates` and `candidate_notes` tables.
3. (Optional) Run [`supabase/seed.sql`](supabase/seed.sql) the same way to add 6 fictional candidates.
   Re-running it resets both tables to the sample data.

### 3. Add your keys

```bash
cp .env.example .env.local
```

Fill in `.env.local` from **Project Settings → API Keys** in Supabase:

- `SUPABASE_URL`: your project URL, e.g. `https://abcd1234.supabase.co`
- `SUPABASE_SECRET_KEY`: a **secret** key (starts with `sb_secret_`)

The secret key is only used by server code (the API routes). It is never sent to the browser.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm test` | Run the Vitest tests once |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm run build` | Production build |

The tests do not need a database: the API route tests replace Supabase with a fake client.

## How it fits together

```
Browser page (React state + fetch)
        │  JSON over HTTP
        ▼
Route Handler in src/app/api/...   ← validates input with Zod
        │  supabase-js + secret key (server only)
        ▼
Supabase PostgreSQL
```

- The browser **never** talks to Supabase directly. Every read and write goes through our API routes.
- Row Level Security is enabled on both tables with **no policies**, so Supabase's public
  (publishable/anon) key cannot read or write anything. Only the server, with the secret key, can.
- The same Zod rules run in the form (quick feedback) and in the API (the check that matters,
  because the API can be called without the form).

### API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/candidates` | Active candidates (`?archived=true` for archived ones) |
| POST | `/api/candidates` | Create a candidate |
| GET | `/api/candidates/[id]` | One candidate with their notes (newest first) |
| PATCH | `/api/candidates/[id]` | Change `stage` and/or `archived` |
| DELETE | `/api/candidates/[id]` | Delete permanently (notes are deleted too) |
| POST | `/api/candidates/[id]/notes` | Add a note |

Errors are returned as `{ "error": "message", "fieldErrors": { "field": "message" } }`
with status 400 (invalid input), 404 (not found) or 500 (unexpected server error).

## Project structure

```
src/
  app/
    page.tsx                      Candidate list (filters, sorting)
    candidates/new/page.tsx       Add candidate page
    candidates/[id]/page.tsx      Candidate detail page
    api/candidates/...            Route Handlers (the backend)
  components/                     CandidateForm, NotesSection, StageBadge, shared styles
  lib/
    types.ts                      Stage list and data types
    validation.ts                 Zod schemas
    candidates.ts                 Filter / sort / date helpers
    supabase.ts                   Server-only Supabase client
    api.ts, api-client.ts         Error helpers for the server and the browser
supabase/
  schema.sql, seed.sql            Database tables and sample data
tests/                            Vitest tests
```

## Known limitations

- No authentication or authorisation (out of scope for the assessment).
- Resume upload accepts plain-text `.txt` files only (max 200 KB). PDF and Word files are rejected
  with a message asking the user to paste the text instead.
- The list loads all candidates and filters/sorts them in the browser. This is fine for a small
  demo, but a large dataset would need server-side filtering and pagination.
- Role is free text, so slightly different spellings (e.g. "Frontend engineer" vs
  "Frontend Engineer") appear as separate roles in the filter.
- Archive and delete use the browser's built-in confirmation dialog.
- The AI candidate summary is not implemented yet.
