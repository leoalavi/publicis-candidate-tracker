-- Candidate Tracker database schema.
-- Run this once in the Supabase SQL Editor (or via the Supabase MCP/CLI).

create table if not exists candidates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  role        text not null,
  resume_text text not null,
  stage       text not null default 'Applied'
              check (stage in ('Applied', 'Screening', 'Interview', 'Offer', 'Rejected')),
  source      text,
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Notes are append-only: the app only ever inserts rows here.
-- Deleting a candidate also deletes their notes (on delete cascade).
create table if not exists candidate_notes (
  id           uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates (id) on delete cascade,
  note_text    text not null,
  created_at   timestamptz not null default now()
);

create index if not exists candidate_notes_candidate_id_idx on candidate_notes (candidate_id);

-- Row Level Security ON with no policies = the public (publishable/anon) key
-- cannot read or write anything. Only the server, using the secret key,
-- can access these tables. The browser always goes through our API routes.
alter table candidates enable row level security;
alter table candidate_notes enable row level security;
