"use client";

import { useState } from "react";
import { cardClass, inputClass, primaryButtonClass } from "./ui";
import { apiRequest } from "@/lib/api-client";
import { formatDate } from "@/lib/candidates";
import type { CandidateNote } from "@/lib/types";
import { noteSchema } from "@/lib/validation";

type Props = {
  candidateId: string;
  notes: CandidateNote[];
  onNoteAdded: (note: CandidateNote) => void;
};

// Shows the note history (newest first) and a form to add a new note.
// Notes are append-only: there is no edit or delete button on purpose.
export function NotesSection({ candidateId, notes, onNoteAdded }: Props) {
  const [noteText, setNoteText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = noteSchema.safeParse({ note_text: noteText });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const note = await apiRequest<CandidateNote>(`/api/candidates/${candidateId}/notes`, {
        method: "POST",
        body: JSON.stringify(result.data),
      });
      onNoteAdded(note);
      setNoteText("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={cardClass} aria-labelledby="notes-heading">
      <h2 id="notes-heading" className="mb-3 text-lg font-semibold">Notes</h2>

      <form onSubmit={handleSubmit} noValidate className="mb-4 space-y-2">
        <label htmlFor="note_text" className="sr-only">New note</label>
        <textarea
          id="note_text"
          rows={3}
          className={inputClass}
          placeholder="Add a note, e.g. 'Phone screen went well'"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby="note-error"
        />
        <p id="note-error" className="text-sm text-red-700" role="alert">{error}</p>
        <button type="submit" className={primaryButtonClass} disabled={isSaving}>
          {isSaving ? "Adding…" : "Add note"}
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-slate-600">No notes yet.</p>
      ) : (
        <ol className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="border-l-2 border-slate-200 pl-3">
              <p className="whitespace-pre-wrap text-sm">{note.note_text}</p>
              <time dateTime={note.created_at} className="text-xs text-slate-500">
                {formatDate(note.created_at)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
