import { getSupabase } from "@/lib/supabase";
import { candidateUpdateSchema, getFieldErrors, isValidId } from "@/lib/validation";
import { jsonError, readJson, serverError } from "@/lib/api";
import { hashResumeText } from "@/lib/ai";

type Context = { params: Promise<{ id: string }> };

// GET /api/candidates/[id] -> one candidate plus their notes (newest first)
export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!isValidId(id)) return jsonError("Candidate not found.", 404);

  try {
    const supabase = getSupabase();

    const { data: candidate, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", id)
      .maybeSingle(); // returns null (not an error) when no row matches

    if (error) return serverError("get candidate", error);
    if (!candidate) return jsonError("Candidate not found.", 404);

    const { data: notes, error: notesError } = await supabase
      .from("candidate_notes")
      .select("*")
      .eq("candidate_id", id)
      .order("created_at", { ascending: false });

    if (notesError) return serverError("get notes", notesError);

    const aiSummaryIsStale =
      candidate.ai_summary !== null && candidate.ai_summary_resume_hash !== hashResumeText(candidate.resume_text);

    return Response.json({ ...candidate, notes, ai_summary_is_stale: aiSummaryIsStale });
  } catch (error) {
    return serverError("get candidate", error);
  }
}

// PATCH /api/candidates/[id] -> change stage and/or archive / unarchive
// Body: { "stage": "Interview" } or { "archived": true }
export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  if (!isValidId(id)) return jsonError("Candidate not found.", 404);

  const result = candidateUpdateSchema.safeParse(await readJson(request));
  if (!result.success) {
    const fieldErrors = getFieldErrors(result.error);
    return jsonError(fieldErrors.form ?? "Invalid update.", 400, fieldErrors);
  }

  try {
    const { data, error } = await getSupabase()
      .from("candidates")
      .update({ ...result.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) return serverError("update candidate", error);
    if (!data) return jsonError("Candidate not found.", 404);
    return Response.json(data);
  } catch (error) {
    return serverError("update candidate", error);
  }
}

// DELETE /api/candidates/[id] -> permanently delete (notes are deleted too,
// because of "on delete cascade" in the database schema)
export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!isValidId(id)) return jsonError("Candidate not found.", 404);

  try {
    const { data, error } = await getSupabase()
      .from("candidates")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) return serverError("delete candidate", error);
    if (data.length === 0) return jsonError("Candidate not found.", 404);
    return Response.json({ deleted: true });
  } catch (error) {
    return serverError("delete candidate", error);
  }
}
