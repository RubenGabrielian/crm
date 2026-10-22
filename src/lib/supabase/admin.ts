import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/**
 * Supabase client with the secret key, for the few things only an admin can do
 * (issuing login codes). Null when SUPABASE_SECRET_KEY is not set.
 * Never import this into client code.
 */
export function getAdminClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  client =
    url && key
      ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
      : null;
  return client;
}

/**
 * The admin client for the public checkout, which has no session. Throws when
 * SUPABASE_SECRET_KEY is missing, since checkout can't work without it.
 */
export function requireAdminClient(): SupabaseClient {
  const admin = getAdminClient();
  if (!admin) throw new Error("SUPABASE_SECRET_KEY is not set; the public checkout needs it.");
  return admin;
}
