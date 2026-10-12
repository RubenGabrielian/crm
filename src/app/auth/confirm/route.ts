import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createAuthClient } from "@/lib/supabase/server";

/**
 * Landing point for the link in the verification email (for people who click
 * the link instead of typing the code). Handles both link formats Supabase uses.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const auth = await createAuthClient();
  let verified = false;

  if (code) {
    const { error } = await auth.auth.exchangeCodeForSession(code);
    verified = !error;
  } else if (tokenHash && type) {
    const { error } = await auth.auth.verifyOtp({ token_hash: tokenHash, type });
    verified = !error;
  }

  const url = request.nextUrl.clone();
  url.search = "";
  url.pathname = verified ? "/dashboard" : "/auth/login";
  if (!verified) url.searchParams.set("error", "link");
  return NextResponse.redirect(url);
}
