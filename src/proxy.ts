import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before every admin page: keeps the Supabase session fresh and sends
 * signed-out visitors to the login page. The landing page stays public and the
 * public checkout is not matched.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() checks the session with Supabase, so a forged cookie doesn't pass.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  // The landing page and the promo video page are public for everyone.
  const isLandingPage =
    request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/promo";

  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    // Carry over any refreshed session cookies.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (!user && !isAuthPage && !isLandingPage) return redirectTo("/auth/login");
  if (user && isAuthPage) return redirectTo("/dashboard");
  return response;
}

export const config = {
  // Everything except the public checkout, incoming webhooks (they carry no
  // session), Next.js internals and static files.
  matcher: ["/((?!checkout|api/webhooks|_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
