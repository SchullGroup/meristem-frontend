import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Define protected routes (all routes starting with dashboard layout)
  // Since your dashboard is in a group (dashboard), it maps to the root or sub-paths.
  // We check if it's NOT the login page or public assets.
  const isLoginPage = pathname === "/login";
  const isPublicFile = pathname.includes(".") || pathname.startsWith("/_next");
  const isRoot = pathname === "/";

  // If the user is trying to access the dashboard/root and has no token, redirect to login
  if (!token && !isLoginPage && !isPublicFile) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If the user has a token and tries to access the login page, redirect to home
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
