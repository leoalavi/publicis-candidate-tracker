"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NotesSection } from "@/components/NotesSection";
import { StageBadge } from "@/components/StageBadge";
import { cardClass, dangerButtonClass, inputClass, labelClass, secondaryButtonClass } from "@/components/ui";
import { apiRequest } from "@/lib/api-client";
import { formatDate } from "@/lib/candidates";
import { STAGES, type Candidate, type CandidateNote, type CandidateWithNotes, type Stage } from "@/lib/types";

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [candidate, setCandidate] = useState<CandidateWithNotes | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false); // true while a stage/archive/delete request runs

  useEffect(() => {
    let ignore = false;
    apiRequest<CandidateWithNotes>(`/api/candidates/${id}`)
      .then((data) => {
        if (!ignore) setCandidate(data);
      })
      .catch((err: Error) => {
        if (!ignore) setLoadError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  // Sends a PATCH and merges the updated fields into what's on screen.
  async function updateCandidate(changes: { stage?: Stage; archived?: boolean }) {
    setIsBusy(true);
    setActionError(null);
    try {
      const updated = await apiRequest<Candidate>(`/api/candidates/${id}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });
      setCandidate((previous) => (previous ? { ...previous, ...updated } : previous));
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setIsBusy(false);
    }
  }

  function handleArchiveToggle() {
    if (!candidate) return;
    const message = candidate.archived
      ? `Restore ${candidate.name} to the active list?`
      : `Archive ${candidate.name}? They will be hidden from the main list but can be restored later.`;
    if (window.confirm(message)) updateCandidate({ archived: !candidate.archived });
  }

  async function handleDelete() {
    if (!candidate) return;
    const confirmed = window.confirm(
      `Permanently delete ${candidate.name} and all their notes? This cannot be undone.`,
    );
    if (!confirmed) return;

    setIsBusy(true);
    setActionError(null);
    try {
      await apiRequest(`/api/candidates/${id}`, { method: "DELETE" });
      router.push("/");
    } catch (err) {
      setActionError((err as Error).message);
      setIsBusy(false);
    }
  }

  function handleNoteAdded(note: CandidateNote) {
    setCandidate((previous) => (previous ? { ...previous, notes: [note, ...previous.notes] } : previous));
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          {loadError}
        </p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className={cardClass} role="status">Loading candidate…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BackLink />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{candidate.name}</h1>
          <p className="text-slate-600">{candidate.role}</p>
        </div>
        <div className="flex items-center gap-2">
          {candidate.archived && (
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">Archived</span>
          )}
          <StageBadge stage={candidate.stage} />
        </div>
      </div>

      {actionError && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {actionError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Left: profile + resume */}
        <div className="space-y-4 md:col-span-2">
          <section className={cardClass} aria-labelledby="profile-heading">
            <h2 id="profile-heading" className="mb-3 text-lg font-semibold">Profile</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
              <Detail label="Email" value={candidate.email} />
              <Detail label="Phone" value={candidate.phone ?? "—"} />
              <Detail label="Source" value={candidate.source ?? "—"} />
              <Detail label="Added" value={formatDate(candidate.created_at)} />
              <Detail label="Last updated" value={formatDate(candidate.updated_at)} />
            </dl>
          </section>

          <section className={cardClass} aria-labelledby="resume-heading">
            <h2 id="resume-heading" className="mb-3 text-lg font-semibold">Resume / cover letter</h2>
            <p className="max-h-96 overflow-y-auto whitespace-pre-wrap text-sm leading-6">{candidate.resume_text}</p>
          </section>

          <NotesSection candidateId={candidate.id} notes={candidate.notes} onNoteAdded={handleNoteAdded} />
        </div>

        {/* Right: actions */}
        <aside className={`${cardClass} h-fit space-y-4`} aria-label="Candidate actions">
          <div>
            <label htmlFor="stage" className={labelClass}>Pipeline stage</label>
            <select
              id="stage"
              className={inputClass}
              value={candidate.stage}
              disabled={isBusy}
              onChange={(e) => updateCandidate({ stage: e.target.value as Stage })}
            >
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500" aria-live="polite">
              {isBusy ? "Saving…" : "Changes save automatically."}
            </p>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-200 pt-4">
            <button type="button" className={secondaryButtonClass} onClick={handleArchiveToggle} disabled={isBusy}>
              {candidate.archived ? "Restore candidate" : "Archive candidate"}
            </button>
            <button type="button" className={dangerButtonClass} onClick={handleDelete} disabled={isBusy}>
              Delete permanently
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function BackLink() {
  return <Link href="/" className="text-sm text-blue-700 hover:underline">← Back to candidates</Link>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}
