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
  // Match internationalized pathnames, auth routes, and dashboard
  matcher: [
    // Internationalized routes
    "/",
    "/(en|cs)/:path*",
    // Auth routes
    "/api/auth/:path*",
    // Dashboard and other protected routes
    "/dashboard/:path*",
    "/(en|cs)/dashboard/:path*",
  ],
};
