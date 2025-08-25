import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { type NextRequest, NextResponse } from "next/server";

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware(routing);

// Simple middleware that handles internationalization and auth routes
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle auth routes - they should NOT be internationalized
  if (pathname.startsWith("/api/auth/")) {
    // Let Kinde handle auth routes directly
    return NextResponse.next();
  }

  // For all other routes, apply internationalization
  return intlMiddleware(request);
}

export const config = {
  // Match internationalized pathnames, auth routes, and feature routes
  matcher: [
    // Internationalized routes
    "/",
    "/(en|cs)/:path*",
    // Auth routes
    "/api/auth/:path*",
    // Feature routes (now siblings, not nested under dashboard)
    "/manage-events/:path*",
    "/(en|cs)/manage-events/:path*",
    "/users/:path*",
    "/(en|cs)/users/:path*",
    "/bank-accounts/:path*",
    "/(en|cs)/bank-accounts/:path*",
    "/test/:path*",
    "/(en|cs)/test/:path*",
    // Dashboard (main page only)
    "/dashboard",
    "/(en|cs)/dashboard",
  ],
};
