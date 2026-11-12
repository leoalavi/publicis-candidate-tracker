// Used by the React pages (in the browser) to call our own API routes.
// It turns a failed response into an Error with a readable message.

export class ApiError extends Error {
  fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.error ?? `Request failed (${response.status})`, data?.fieldErrors);
  }
  return data as T;
}
