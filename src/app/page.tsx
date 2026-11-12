"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StageBadge } from "@/components/StageBadge";
import { cardClass, inputClass, labelClass } from "@/components/ui";
import { apiRequest } from "@/lib/api-client";
import {
  filterAndSortCandidates,
  formatDate,
  getUniqueRoles,
  type ListFilters,
  type SortOption,
} from "@/lib/candidates";
import { STAGES, type Candidate, type Stage } from "@/lib/types";

// The dashboard: loads candidates from GET /api/candidates once, then filters
// and sorts them in the browser (fine for a small list, see README).
export default function CandidateListPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [filters, setFilters] = useState<ListFilters>({ stage: "all", role: "all", sort: "newest" });

  // Re-load from the API whenever the "show archived" checkbox changes.
  useEffect(() => {
    let ignore = false; // stops an old, slow request overwriting a newer one

    apiRequest<Candidate[]>(`/api/candidates?archived=${showArchived}`)
      .then((data) => {
        if (!ignore) setCandidates(data);
      })
      .catch((err: Error) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [showArchived]);

  function handleArchivedToggle(checked: boolean) {
    setIsLoading(true);
    setError(null);
    setShowArchived(checked);
  }

  const visibleCandidates = filterAndSortCandidates(candidates, filters);
  const roles = getUniqueRoles(candidates);
  const hasActiveFilters = filters.stage !== "all" || filters.role !== "all";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{showArchived ? "Archived candidates" : "Candidates"}</h1>
        <p className="text-sm text-slate-600">Track applicants through the hiring pipeline.</p>
      </div>

      {/* Filters */}
      <div className={`${cardClass} grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end`}>
        <div>
          <label htmlFor="stage-filter" className={labelClass}>Stage</label>
          <select
            id="stage-filter"
            className={inputClass}
            value={filters.stage}
            onChange={(e) => setFilters({ ...filters, stage: e.target.value as Stage | "all" })}
          >
            <option value="all">All stages</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="role-filter" className={labelClass}>Role</label>
          <select
            id="role-filter"
            className={inputClass}
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="all">All roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className={labelClass}>Sort by</label>
          <select
            id="sort"
            className={inputClass}
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value as SortOption })}
          >
            <option value="newest">Date added (newest first)</option>
            <option value="oldest">Date added (oldest first)</option>
            <option value="stage">Stage (pipeline order)</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 sm:pb-2">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => handleArchivedToggle(e.target.checked)}
            className="h-4 w-4"
          />
          Show archived
        </label>
      </div>

      {/* Loading, error, empty and list states */}
      {isLoading ? (
        <p className={cardClass} role="status">Loading candidates…</p>
      ) : error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          Could not load candidates: {error}
        </p>
      ) : visibleCandidates.length === 0 ? (
        <div className={`${cardClass} text-center text-sm text-slate-600`}>
          {hasActiveFilters ? (
            <p>No candidates match these filters.</p>
          ) : showArchived ? (
            <p>No archived candidates.</p>
          ) : (
            <p>
              No candidates yet.{" "}
              <Link href="/candidates/new" className="text-blue-700 underline">Add the first one</Link>.
            </p>
          )}
        </div>
      ) : (
        <CandidateTable candidates={visibleCandidates} />
      )}
    </div>
  );
}

function CandidateTable({ candidates }: { candidates: Candidate[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Candidates</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
          <tr>
            <th scope="col" className="px-4 py-2 font-medium">Name</th>
            <th scope="col" className="hidden px-4 py-2 font-medium sm:table-cell">Role</th>
            <th scope="col" className="px-4 py-2 font-medium">Stage</th>
            <th scope="col" className="hidden px-4 py-2 font-medium sm:table-cell">Source</th>
            <th scope="col" className="hidden px-4 py-2 font-medium md:table-cell">Added</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link href={`/candidates/${candidate.id}`} className="font-medium text-blue-700 hover:underline">
                  {candidate.name}
                </Link>
                <div className="break-all text-xs text-slate-500">{candidate.email}</div>
                {/* On phones the Role column is hidden, so show the role here instead. */}
                <div className="text-xs text-slate-700 sm:hidden">{candidate.role}</div>
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">{candidate.role}</td>
              <td className="px-4 py-3"><StageBadge stage={candidate.stage} /></td>
              <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{candidate.source ?? "—"}</td>
              <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{formatDate(candidate.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
