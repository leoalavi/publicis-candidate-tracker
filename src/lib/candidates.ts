import { STAGES, type Candidate, type Stage } from "./types";

// Plain functions for the candidate list. They don't touch React or the
// database, which makes them easy to read and easy to unit test.

export type SortOption = "newest" | "oldest" | "stage";

export type ListFilters = {
  stage: Stage | "all";
  role: string; // "all" or an exact role name
  sort: SortOption;
};

export function filterCandidates(candidates: Candidate[], filters: ListFilters): Candidate[] {
  return candidates.filter((candidate) => {
    const stageMatches = filters.stage === "all" || candidate.stage === filters.stage;
    const roleMatches = filters.role === "all" || candidate.role === filters.role;
    return stageMatches && roleMatches;
  });
}

// Position of a stage in the pipeline: Applied = 0 ... Rejected = 4.
function stageOrder(stage: Stage): number {
  return STAGES.indexOf(stage);
}

function newestFirst(a: Candidate, b: Candidate): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

// Returns a NEW sorted array (it does not change the array passed in).
export function sortCandidates(candidates: Candidate[], sort: SortOption): Candidate[] {
  const copy = [...candidates];

  if (sort === "newest") return copy.sort(newestFirst);
  if (sort === "oldest") return copy.sort((a, b) => newestFirst(b, a));

  // "stage": pipeline order (not alphabetical), newest first within a stage.
  return copy.sort((a, b) => stageOrder(a.stage) - stageOrder(b.stage) || newestFirst(a, b));
}

export function filterAndSortCandidates(candidates: Candidate[], filters: ListFilters): Candidate[] {
  return sortCandidates(filterCandidates(candidates, filters), filters.sort);
}

// Unique role names, alphabetically, for the "Role" filter dropdown.
export function getUniqueRoles(candidates: Candidate[]): string[] {
  return [...new Set(candidates.map((candidate) => candidate.role))].sort();
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
