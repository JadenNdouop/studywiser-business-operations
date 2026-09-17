/**
 * Central place to read the Supabase connection settings from the environment.
 * These two values are public (safe to expose to the browser): the anon key is
 * only powerful in combination with Row Level Security, which this app enforces.
 * The powerful service-role key is never read here or shipped to the client.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Missing Supabase environment variables. Copy .env.example to .env.local " +
        "and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } as const;
}
