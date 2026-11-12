import { getSupabase } from "@/lib/supabase";
import { getFieldErrors, isValidId, noteSchema } from "@/lib/validation";
import { jsonError, readJson, serverError } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

// POST /api/candidates/[id]/notes -> add a note. Body: { "note_text": "..." }
// Notes are append-only, so there is deliberately no PUT/PATCH/DELETE here.
export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  if (!isValidId(id)) return jsonError("Candidate not found.", 404);

  const result = noteSchema.safeParse(await readJson(request));
  if (!result.success) {
    return jsonError("Please fix the note.", 400, getFieldErrors(result.error));
  }

  try {
    const { data, error } = await getSupabase()
      .from("candidate_notes")
      .insert({ candidate_id: id, note_text: result.data.note_text })
      .select()
      .single();

    // 23503 = Postgres "foreign key violation": the candidate doesn't exist.
    if (error?.code === "23503") return jsonError("Candidate not found.", 404);
    if (error) return serverError("add note", error);
    return Response.json(data, { status: 201 });
  } catch (error) {
    return serverError("add note", error);
  }
}
