import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { DEMO_MODE } from "@/lib/demo-mode";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/** Routes an unauthenticated visitor is allowed to reach. */
const PUBLIC_ROUTES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/auth",
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * Runs on every request (see src/middleware.ts). It refreshes the Supabase
 * auth session cookie and enforces the app's access rules:
 *   - not signed in + protected route  -> redirect to /login
 *   - signed in + auth route (/login…) -> redirect to /dashboard
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Demo mode: no backend, no auth — let every request through.
  if (DEMO_MODE) {
    return supabaseResponse;
  }

  // If env vars are missing (e.g. before setup), don't crash every request —
  // let the page render and surface the configuration error itself.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: getUser() revalidates the token with Supabase Auth; do not
  // trust getSession() alone for authorization decisions.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const publicRoute = isPublicRoute(pathname);

  if (!user && !publicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Signed-in users shouldn't sit on the login/forgot pages. (reset-password is
  // reached mid-recovery with a session, so it's allowed through.)
  if (
    user &&
    (pathname === "/login" || pathname === "/forgot-password")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
