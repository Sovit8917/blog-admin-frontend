import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Pass through requests so client-side useRequireAuth can verify the session against backend API
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};