-- Phase 2: store the AI-generated candidate summary.
-- Additive and safe to re-run: only adds nullable columns, deletes nothing.

alter table candidates
  add column if not exists ai_summary              text,
  add column if not exists ai_summary_generated_at timestamptz,
  -- SHA-256 of the resume text the summary was made from. If the resume
  -- changes later, the hashes no longer match and the summary is shown as stale.
  add column if not exists ai_summary_resume_hash  text;
