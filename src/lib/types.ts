// Shared types used by both the API routes and the React pages.

// The pipeline stages, in pipeline order. This array is the single source of
// truth: the dropdowns, the validation and the "sort by stage" order all use it.
export const STAGES = ["Applied", "Screening", "Interview", "Offer", "Rejected"] as const;

export type Stage = (typeof STAGES)[number];

// One row of the `candidates` table (column names match the database).
export type Candidate = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  resume_text: string;
  stage: Stage;
  source: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
  ai_summary: string | null;
  ai_summary_generated_at: string | null;
  ai_summary_resume_hash: string | null;
};

// One row of the `candidate_notes` table.
export type CandidateNote = {
  id: string;
  candidate_id: string;
  note_text: string;
  created_at: string;
};

// What GET /api/candidates/[id] returns.
// ai_summary_is_stale is true when the resume changed after the summary was made.
export type CandidateWithNotes = Candidate & { notes: CandidateNote[]; ai_summary_is_stale: boolean };

// What POST /api/candidates/[id]/summary returns.
export type AiSummaryResult = {
  ai_summary: string;
  ai_summary_generated_at: string;
  ai_summary_is_stale: boolean;
};
