import { getSupabase } from "@/lib/supabase";
import { isValidId } from "@/lib/validation";
import { jsonError, serverError } from "@/lib/api";
import { AiSummaryError, generateCandidateSummary, hashResumeText } from "@/lib/ai";

type Context = { params: Promise<{ id: string }> };

// POST /api/candidates/[id]/summary -> generate (or regenerate) the AI summary.
// The resume is loaded from the database, never taken from the request body,
// so the summary always matches what is stored for this candidate.
export async function POST(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!isValidId(id)) return jsonError("Candidate not found.", 404);

  try {
    const supabase = getSupabase();

    const { data: candidate, error: loadError } = await supabase
      .from("candidates")
      .select("resume_text")
      .eq("id", id)
      .maybeSingle();

    if (loadError) return serverError("load candidate for summary", loadError);
    if (!candidate) return jsonError("Candidate not found.", 404);

    const summary = await generateCandidateSummary(candidate.resume_text);

    // Regenerating simply overwrites the previous summary.
    const { data: saved, error: saveError } = await supabase
      .from("candidates")
      .update({
        ai_summary: summary,
        ai_summary_generated_at: new Date().toISOString(),
        ai_summary_resume_hash: hashResumeText(candidate.resume_text),
      })
      .eq("id", id)
      .select("ai_summary, ai_summary_generated_at")
      .maybeSingle();

    if (saveError) {
      console.error("[api] save summary:", saveError);
      return jsonError("The summary was generated but could not be saved. Please try again.", 500);
    }
    if (!saved) return jsonError("Candidate not found.", 404);

    return Response.json({ ...saved, ai_summary_is_stale: false });
  } catch (error) {
    if (error instanceof AiSummaryError) return jsonError(error.message, error.status);
    return serverError("generate summary", error);
  }
}
