import { beforeEach, describe, expect, it, vi } from "vitest";

// Tests for POST /api/candidates/[id]/summary and the "stale" flag on GET.
// Supabase is replaced by a tiny in-memory fake holding ONE candidate row,
// and the Gemini call (generateCandidateSummary) is mocked.

const fake = vi.hoisted(() => ({
  row: null as Record<string, unknown> | null,
  failSave: false,
  updates: [] as Record<string, unknown>[],
}));

vi.mock("@/lib/supabase", () => {
  function table(name: string) {
    let pendingUpdate: Record<string, unknown> | null = null;
    const query = {
      select: () => query,
      eq: () => query,
      order: async () => ({ data: [], error: null }), // notes list (always empty here)
      update: (changes: Record<string, unknown>) => {
        pendingUpdate = changes;
        return query;
      },
      maybeSingle: async () => {
        if (pendingUpdate) {
          if (fake.failSave) return { data: null, error: { message: "db down" } };
          fake.updates.push(pendingUpdate);
          if (fake.row) Object.assign(fake.row, pendingUpdate);
        }
        return { data: name === "candidates" ? fake.row : null, error: null };
      },
    };
    return query;
  }
  return { getSupabase: () => ({ from: table }) };
});

const generateCandidateSummary = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai")>();
  return { ...actual, generateCandidateSummary };
});

import { AiSummaryError, hashResumeText } from "@/lib/ai";
import { POST as generateSummary } from "@/app/api/candidates/[id]/summary/route";
import { GET as getCandidate } from "@/app/api/candidates/[id]/route";

const ID = "6f1c2a3e-1111-4222-8333-444455556666";
const RESUME = "Backend engineer with Java and Spring Boot experience.";

function callSummary(id = ID) {
  return generateSummary(new Request("http://localhost", { method: "POST" }), { params: Promise.resolve({ id }) });
}

beforeEach(() => {
  vi.clearAllMocks();
  fake.failSave = false;
  fake.updates = [];
  fake.row = { id: ID, resume_text: RESUME, ai_summary: null, ai_summary_generated_at: null, ai_summary_resume_hash: null };
});

describe("POST /api/candidates/[id]/summary", () => {
  it("generates a summary, saves it with the resume hash and returns it", async () => {
    generateCandidateSummary.mockResolvedValue("Backend engineer skilled in Java and Spring Boot.");

    const response = await callSummary();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(generateCandidateSummary).toHaveBeenCalledWith(RESUME); // text comes from the DB, not the request
    expect(body.ai_summary).toBe("Backend engineer skilled in Java and Spring Boot.");
    expect(body.ai_summary_is_stale).toBe(false);
    expect(fake.row?.ai_summary_resume_hash).toBe(hashResumeText(RESUME));
  });

  it("regenerating replaces the stored summary", async () => {
    generateCandidateSummary.mockResolvedValueOnce("First summary.").mockResolvedValueOnce("Second summary.");

    await callSummary();
    await callSummary();

    expect(fake.updates).toHaveLength(2);
    expect(fake.row?.ai_summary).toBe("Second summary.");
  });

  it("returns 404 for an unknown candidate without calling the AI", async () => {
    fake.row = null;
    const response = await callSummary();
    expect(response.status).toBe(404);
    expect(generateCandidateSummary).not.toHaveBeenCalled();
  });

  it("returns 404 for an ID that is not a UUID", async () => {
    const response = await callSummary("not-a-uuid");
    expect(response.status).toBe(404);
  });

  it("passes AI errors through with their status and message, and saves nothing", async () => {
    generateCandidateSummary.mockRejectedValue(new AiSummaryError("Rate limit reached.", 429));

    const response = await callSummary();

    expect(response.status).toBe(429);
    expect((await response.json()).error).toBe("Rate limit reached.");
    expect(fake.updates).toHaveLength(0);
  });

  it("returns 500 with a clear message if saving the summary fails", async () => {
    generateCandidateSummary.mockResolvedValue("A summary.");
    fake.failSave = true;

    const response = await callSummary();

    expect(response.status).toBe(500);
    expect((await response.json()).error).toContain("could not be saved");
  });
});

describe("GET /api/candidates/[id] stale summary flag", () => {
  async function getStaleFlag() {
    const response = await getCandidate(new Request("http://localhost"), { params: Promise.resolve({ id: ID }) });
    return (await response.json()).ai_summary_is_stale;
  }

  it("is false when the summary was made from the current resume", async () => {
    Object.assign(fake.row!, { ai_summary: "Summary.", ai_summary_resume_hash: hashResumeText(RESUME) });
    expect(await getStaleFlag()).toBe(false);
  });

  it("is true when the resume changed after the summary was made", async () => {
    Object.assign(fake.row!, { ai_summary: "Summary.", ai_summary_resume_hash: hashResumeText("an older resume") });
    expect(await getStaleFlag()).toBe(true);
  });

  it("is false when there is no summary yet", async () => {
    expect(await getStaleFlag()).toBe(false);
  });
});
