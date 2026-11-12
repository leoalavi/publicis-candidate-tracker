import { describe, expect, it } from "vitest";
import { filterCandidates, getUniqueRoles, sortCandidates } from "@/lib/candidates";
import type { Candidate, Stage } from "@/lib/types";

// Builds a test candidate with only the fields these tests care about.
function makeCandidate(name: string, stage: Stage, role: string, createdAt: string): Candidate {
  return {
    id: name,
    name,
    email: `${name}@example.com`,
    phone: null,
    role,
    resume_text: "text",
    stage,
    source: null,
    archived: false,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

const candidates = [
  makeCandidate("ana", "Screening", "Frontend Engineer", "2026-01-03T00:00:00Z"),
  makeCandidate("ben", "Applied", "Backend Engineer", "2026-01-01T00:00:00Z"),
  makeCandidate("cai", "Rejected", "Frontend Engineer", "2026-01-05T00:00:00Z"),
  makeCandidate("dee", "Interview", "Backend Engineer", "2026-01-02T00:00:00Z"),
  makeCandidate("eve", "Applied", "Frontend Engineer", "2026-01-04T00:00:00Z"),
];

const names = (list: Candidate[]) => list.map((candidate) => candidate.name);

describe("filterCandidates", () => {
  it("returns everything when both filters are 'all'", () => {
    expect(filterCandidates(candidates, { stage: "all", role: "all", sort: "newest" })).toHaveLength(5);
  });

  it("filters by stage", () => {
    const result = filterCandidates(candidates, { stage: "Applied", role: "all", sort: "newest" });
    expect(names(result)).toEqual(["ben", "eve"]);
  });

  it("filters by stage AND role together", () => {
    const result = filterCandidates(candidates, { stage: "Applied", role: "Frontend Engineer", sort: "newest" });
    expect(names(result)).toEqual(["eve"]);
  });
});

describe("sortCandidates", () => {
  it("sorts by date added, newest first", () => {
    expect(names(sortCandidates(candidates, "newest"))).toEqual(["cai", "eve", "ana", "dee", "ben"]);
  });

  it("sorts by date added, oldest first", () => {
    expect(names(sortCandidates(candidates, "oldest"))).toEqual(["ben", "dee", "ana", "eve", "cai"]);
  });

  it("sorts by PIPELINE order, not alphabetically, newest first within a stage", () => {
    // Alphabetical would wrongly put Interview before Screening and Rejected before Screening.
    const result = sortCandidates(candidates, "stage");
    expect(result.map((c) => c.stage)).toEqual(["Applied", "Applied", "Screening", "Interview", "Rejected"]);
    expect(names(result)).toEqual(["eve", "ben", "ana", "dee", "cai"]);
  });

  it("does not change the original array", () => {
    const before = names(candidates);
    sortCandidates(candidates, "stage");
    expect(names(candidates)).toEqual(before);
  });
});

describe("getUniqueRoles", () => {
  it("returns each role once, alphabetically", () => {
    expect(getUniqueRoles(candidates)).toEqual(["Backend Engineer", "Frontend Engineer"]);
  });
});
