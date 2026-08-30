import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * The admin console previously relied entirely on `useRequireAuth` — a
 * client-side effect that fires *after* the whole dashboard shell (layout,
 * sidebar, page JS) has already been downloaded and mounted, then calls
 * the API to check the session before redirecting an unauthenticated
 * visitor to /login. That's a real cost (bundle + a network round trip)
 * paid on every single unauthenticated hit to a protected URL, and it's
 * pure waste since the outcome — bounce to /login — was decidable from
 * the request alone.
 *
 * This mirrors blog-frontend's middleware: a fast, DB-free check against
 * Better Auth's own session-cookie *existence and signature*, using the
 * admin instance's differently-named `admin_session` cookie (see the
 * backend's src/auth/better-auth.ts `adminAuth` config). It's optimistic,
 * not authoritative — the real check (is this actually a staff account?)
 * still happens server-side wherever the session is used, both in
 * `useRequireAuth`'s `fetchMe()` call and, more importantly, in
 * `adminAuth`'s own `session.create.before` hook, which refuses to mint an
 * admin-console session for a non-staff account in the first place. So a
 * forged or stale cookie still gets rejected — this middleware only saves
 * the round trip for the common case of "no cookie at all".
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request, {
    cookieName: "admin_session",
    cookiePrefix: "",
  });

  if (!isPublicPath(pathname) && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed-in staff hitting /login directly (bookmark, stale tab) should
  // land back in the dashboard instead of seeing the login form again.
  if (pathname === "/login" && sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next's own internals and static assets — the admin
  // app is a dashboard behind a login wall by default, so this protects
  // new routes automatically instead of needing an ever-growing allowlist.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
