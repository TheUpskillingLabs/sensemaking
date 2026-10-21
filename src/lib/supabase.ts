import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when the build has the two public env vars it needs. */
export const configured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** The browser client. Only the project URL and the anon (public) key ever reach the browser. */
export function supabase(): SupabaseClient {
  if (!client) {
    if (!url || !anonKey) throw new Error("This app isn't configured yet: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing.");
    client = createClient(url, anonKey, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        // Its own storage key, so this app never collides with another Supabase app on a shared domain.
        storageKey: "sensemaking.stakeholder-profiles.auth",
      },
    });
  }
  return client;
}
