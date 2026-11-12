import { beforeEach, describe, expect, it, vi } from "vitest";

// These tests call the real route handler functions, but replace the Supabase
// client with a fake one, so no real database is needed. They check that bad
// input is rejected BEFORE anything is sent to the database.

const fakeDb = vi.hoisted(() => ({
  insert: vi.fn(),
  update: vi.fn(),
  result: { data: null as unknown, error: null as unknown },
}));

vi.mock("@/lib/supabase", () => {
  // Mimics the chain used in the routes, e.g. .from().update().eq().select().maybeSingle()
  const chain = {
    eq: () => chain,
    select: () => chain,
    single: async () => fakeDb.result,
    maybeSingle: async () => fakeDb.result,
  };
  return {
    getSupabase: () => ({
      from: () => ({
        insert: (row: unknown) => {
          fakeDb.insert(row);
          return chain;
        },
        update: (changes: unknown) => {
          fakeDb.update(changes);
          return chain;
        },
      }),
    }),
  };
});

import { POST as createCandidate } from "@/app/api/candidates/route";
import { PATCH as updateCandidate } from "@/app/api/candidates/[id]/route";

const VALID_ID = "6f1c2a3e-1111-4222-8333-444455556666";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/test", { method: "POST", body: JSON.stringify(body) });
}

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  fakeDb.result = { data: null, error: null };
});

describe("POST /api/candidates", () => {
  it("returns 400 with field errors and does not touch the database when input is invalid", async () => {
    const response = await createCandidate(jsonRequest({ name: "", email: "nope" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.fieldErrors.name).toBe("Name is required");
    expect(body.fieldErrors.email).toBe("Enter a valid email address");
    expect(fakeDb.insert).not.toHaveBeenCalled();
  });

  it("returns 400 for a body that is not JSON", async () => {
    const request = new Request("http://localhost/api/test", { method: "POST", body: "not json" });
    const response = await createCandidate(request);
    expect(response.status).toBe(400);
  });

  it("inserts cleaned data and returns 201 when input is valid", async () => {
    fakeDb.result = { data: { id: VALID_ID }, error: null };

    const response = await createCandidate(
      jsonRequest({ name: " Sam ", email: "sam@example.com", role: "QA", resume_text: "CV", phone: "" }),
    );

    expect(response.status).toBe(201);
    expect(fakeDb.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Sam", phone: null, stage: "Applied" }),
    );
  });
});

describe("PATCH /api/candidates/[id] (stage change)", () => {
  it("rejects an invalid stage with 400 and does not update the database", async () => {
    const response = await updateCandidate(jsonRequest({ stage: "Hired" }), context(VALID_ID));

    expect(response.status).toBe(400);
    expect(fakeDb.update).not.toHaveBeenCalled();
  });

  it("returns 404 for an ID that is not a UUID", async () => {
    const response = await updateCandidate(jsonRequest({ stage: "Offer" }), context("abc"));
    expect(response.status).toBe(404);
  });

  it("updates the stage and the updated_at timestamp", async () => {
    fakeDb.result = { data: { id: VALID_ID, stage: "Offer" }, error: null };

    const response = await updateCandidate(jsonRequest({ stage: "Offer" }), context(VALID_ID));

    expect(response.status).toBe(200);
    expect(fakeDb.update).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "Offer", updated_at: expect.any(String) }),
    );
  });

  it("returns 404 when no candidate has that ID", async () => {
    fakeDb.result = { data: null, error: null };
    const response = await updateCandidate(jsonRequest({ stage: "Offer" }), context(VALID_ID));
    expect(response.status).toBe(404);
  });
});
