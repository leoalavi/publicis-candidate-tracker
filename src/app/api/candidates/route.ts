import { getSupabase } from "@/lib/supabase";
import { candidateSchema, getFieldErrors } from "@/lib/validation";
import { jsonError, readJson, serverError } from "@/lib/api";

// GET /api/candidates            -> active candidates
// GET /api/candidates?archived=true -> archived candidates
export async function GET(request: Request) {
  const showArchived = new URL(request.url).searchParams.get("archived") === "true";

  try {
    const { data, error } = await getSupabase()
      .from("candidates")
      .select("*")
      .eq("archived", showArchived)
      .order("created_at", { ascending: false });

    if (error) return serverError("list candidates", error);
    return Response.json(data);
  } catch (error) {
    return serverError("list candidates", error);
  }
}

// POST /api/candidates -> create a candidate
export async function POST(request: Request) {
  const body = await readJson(request);
  const result = candidateSchema.safeParse(body);

  if (!result.success) {
    return jsonError("Please fix the highlighted fields.", 400, getFieldErrors(result.error));
  }

  try {
    const { data, error } = await getSupabase()
      .from("candidates")
      .insert(result.data)
      .select()
      .single();

    if (error) return serverError("create candidate", error);
    return Response.json(data, { status: 201 });
  } catch (error) {
    return serverError("create candidate", error);
  }
}
