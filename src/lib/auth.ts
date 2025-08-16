import type { NextRequest } from "next/server";
import { logger } from "./logger";
// ================================
// ENVIRONMENT DETECTION
// ================================

/**
 * Detect if we're in a local development environment
 */
export function isLocalEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

/**
 * Get the appropriate base URL based on environment
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Client-side
    return isLocalEnvironment() ? "http://localhost:3000" : "https://gameonebaby.vercel.app";
  }
  // Server-side
  return process.env["VERCEL_URL"]
    ? `https://${process.env["VERCEL_URL"]}`
    : (process.env["KINDE_SITE_URL"] ?? "http://localhost:3000");
}

/**
 * Get Kinde authentication configuration
 */
export function getAuthConfig() {
  const baseUrl = getBaseUrl();

  return {
    authUrl: process.env["NEXT_PUBLIC_KINDE_AUTH_URL"] ?? "https://gameone.kinde.com",
    clientId: process.env["NEXT_PUBLIC_KINDE_CLIENT_ID"] ?? "f5a3fab0fe644cf080282bcd90979fe4",
    logoutUrl: process.env["NEXT_PUBLIC_KINDE_LOGOUT_URL"] ?? baseUrl,
    redirectUrl: process.env["NEXT_PUBLIC_KINDE_REDIRECT_URL"] ?? `${baseUrl}/dashboard`,
    baseUrl,
  };
}

// ================================
// KINDE AUTHENTICATION HELPERS
// ================================

/**
 * Get the appropriate Kinde redirect URL based on environment
 */
export function getKindeRedirectUrl(): string {
  const baseUrl = getBaseUrl();
  return process.env["NEXT_PUBLIC_KINDE_REDIRECT_URL"] ?? `${baseUrl}/dashboard`;
}

/**
 * Get the appropriate Kinde logout URL based on environment
 */
export function getKindeLogoutUrl(): string {
  const baseUrl = getBaseUrl();
  return process.env["NEXT_PUBLIC_KINDE_LOGOUT_URL"] ?? baseUrl;
}

/**
 * Check if the current request is from production or development
 */
export function isProductionRequest(request: NextRequest): boolean {
  const host = request.headers.get("host") ?? "";
  const referer = request.headers.get("referer") ?? "";

  // Check if it's coming from Vercel
  if (host.includes("vercel.app") || referer.includes("vercel.app")) {
    return true;
  }

  // Check if it's coming from localhost
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return false;
  }

  // Default to production if we can't determine
  return process.env.NODE_ENV === "production";
}

/**
 * Get the appropriate Kinde configuration based on the request environment
 */
export function getKindeConfigForRequest(request: NextRequest) {
  const isProduction = isProductionRequest(request);
  const baseUrl = isProduction
    ? `https://${process.env["VERCEL_URL"] ?? "gameonebaby.vercel.app"}`
    : "http://localhost:3000";

  return {
    authUrl: process.env["NEXT_PUBLIC_KINDE_AUTH_URL"] ?? "https://gameone.kinde.com",
    clientId: process.env["NEXT_PUBLIC_KINDE_CLIENT_ID"] ?? "f5a3fab0fe644cf080282bcd90979fe4",
    logoutUrl: isProduction ? baseUrl : "http://localhost:3000",
    redirectUrl: isProduction ? `${baseUrl}/dashboard` : "http://localhost:3000/dashboard",
    baseUrl,
    isProduction,
  };
}

// ================================
// CRON JOB AUTHENTICATION
// ================================

/**
 * Verifies that a cron request is coming from Vercel
 * Uses Vercel's cron secret for authentication
 */
export async function verifyVercelCronSecret(request: NextRequest): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return {
        success: false,
        error: "Missing authorization header",
      };
    }

    // Extract the bearer token
    const token = authHeader.replace("Bearer ", "");

    // Get the expected cron secret from environment
    const expectedSecret = process.env["CRON_SECRET"];

    if (!expectedSecret) {
      return {
        success: false,
        error: "Cron secret not configured",
      };
    }

    // Compare tokens
    if (token !== expectedSecret) {
      return {
        success: false,
        error: "Invalid cron secret",
      };
    }

    // Additional Vercel-specific headers verification
    const userAgent = request.headers.get("user-agent");
    const vercelSource = request.headers.get("x-vercel-source");

    // Verify it's coming from Vercel (optional additional security)
    if (process.env.NODE_ENV === "production") {
      if (!userAgent?.includes("vercel") && !vercelSource) {
        return {
          success: false,
          error: "Request not from Vercel",
        };
      }
    }

    return { success: true };
  } catch (error) {
    logger.error("Error verifying cron secret:", error);
    return {
      success: false,
      error: "Authentication error",
    };
  }
}

/**
 * Rate limiting for cron jobs to prevent abuse
 */
export function isRateLimited(): boolean {
  // In a real implementation, you'd use Redis or a database
  // For now, we'll use in-memory storage (not ideal for production)

  // This is a simplified implementation
  // In production, use Redis or database-backed rate limiting
  return false; // Allow all requests for now
}

/**
 * Log cron job execution for monitoring
 */
export async function logCronExecution(
  jobName: string,
  success: boolean,
  duration: number,
  details?: Record<string, unknown>
): Promise<void> {
  const logEntry = {
    jobName,
    success,
    duration,
    timestamp: new Date().toISOString(),
    details,
  };

  // Log to console (in production, you might want to use a proper logging service)
  logger.info("Cron job execution:", JSON.stringify(logEntry, null, 2));

  // TODO: In production, store this in your database for monitoring
  // await prisma.cronJobLog.create({ data: logEntry });
}
