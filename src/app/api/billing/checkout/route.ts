import { NextResponse, type NextRequest } from "next/server";
import { createProCheckout } from "@/lib/billing/lemonsqueezy";
import { getCurrentUser } from "@/lib/tenant/get-current-tenant";

/** Starts a Numa Pro checkout for the signed-in user and sends them to it. */
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${origin}/auth/login`, 303);

  try {
    const url = await createProCheckout({
      userId: user.id,
      email: user.email,
      redirectUrl: `${origin}/billing?paid=1`,
    });
    // 303 turns the form POST into a GET on the Lemon Squeezy page.
    return NextResponse.redirect(url, 303);
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(`${origin}/billing?error=checkout`, 303);
  }
}
