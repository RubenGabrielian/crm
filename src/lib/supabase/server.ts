import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

/**
 * Supabase client bound to the signed-in user's session cookies.
 * Use it for anything that depends on who is logged in.
 */
export async function createAuthClient() {
  // The auth library reads the clock to check session expiry, which is only
  // allowed once the render is tied to a real request.
  await connection();
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components can't write cookies; the proxy refreshes the session instead.
          }
        },
      },
    },
  );
}
