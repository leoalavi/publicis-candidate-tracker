// Small helpers so every API route returns errors in the same shape:
//   { error: "message", fieldErrors?: { fieldName: "message" } }

export function jsonError(message: string, status: number, fieldErrors?: Record<string, string>) {
  return Response.json({ error: message, fieldErrors }, { status });
}

// For unexpected problems (e.g. database down). We log the real error on the
// server, but only send a generic message to the browser.
export function serverError(context: string, error: unknown) {
  console.error(`[api] ${context}:`, error);
  return jsonError("Something went wrong on the server. Please try again.", 500);
}

// request.json() throws if the body isn't valid JSON; this returns null instead.
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
