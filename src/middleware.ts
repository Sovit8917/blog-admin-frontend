import { NextRequest, NextResponse } from "next/server";

// NOTE: This middleware can no longer gate on the session cookie's
// presence. The backend (Better Auth) lives on a different domain
// (e.g. onrender.com) than this frontend (e.g. vercel.app), so the
// `admin_session` / `__Secure-admin_session` cookie's `Domain` is the
// *backend's* domain — it is only ever attached to requests made to
// that backend, and is structurally invisible to middleware running on
// this frontend's own domain. Checking for it here always fails in
// production, regardless of whether the user actually has a valid
// session, and redirects them straight back to /login before the app
// ever loads.
//
// Route protection now happens client-side instead, via
// `useRequireAuth()` (src/hooks/useRequireAuth.ts), which calls
// `fetchMe()` — a real cross-domain fetch with `credentials: include`
// straight to the backend, where the cookie *is* visible. That hook
// redirects to /login itself if the session check fails.
//
// If/when the API is moved behind the same site as this frontend (e.g.
// a Vercel rewrite proxying /backend/* to the Render API, or a shared
// subdomain), the cookie will become first-party and this middleware
// can safely go back to checking it directly for a flash-free redirect.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};