import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local",
  );
}

// There is no auth yet, so one stateless client is enough. When sign-in is
// added, switch to per-request clients from @supabase/ssr.
export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
