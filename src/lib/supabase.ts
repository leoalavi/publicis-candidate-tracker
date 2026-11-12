import { createClient } from "@supabase/supabase-js";

// Creates a Supabase client for SERVER code only (our API route handlers).
//
// It uses the secret key, which can bypass Row Level Security. That is why it
// must never reach the browser: the env variable names have no NEXT_PUBLIC_
// prefix, so Next.js will not include them in client-side JavaScript.
export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY. Copy .env.example to .env.local and fill them in.",
    );
  }

  return createClient(url, secretKey, {
    // We have no logged-in users, so there is no session to store.
    auth: { persistSession: false },
  });
}
