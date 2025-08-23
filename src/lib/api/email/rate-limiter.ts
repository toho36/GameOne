/**
 * Rate limiting service for email API
 */

import { NextRequest } from "next/server";

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  maxRequestsPerMinute: 10,
  maxRequestsPerHour: 100,
};

/**
 * Simple in-memory rate limiter
 * Note: In production, use Redis or a proper rate limiting service
 */
class SimpleRateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Checks if a request is within rate limits
   */
  isAllowed(key: string, windowMs: number, maxRequests: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove requests outside the window
    const validRequests = requests.filter((time) => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }
}

export const rateLimiter = new SimpleRateLimiter();

/**
 * Extracts client identifier for rate limiting
 */
export function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown";

  return `ip:${ip}`;
}

/**
 * Validates rate limits for the request
 */
export function checkRateLimit(request: NextRequest): boolean {
  const clientId = getClientId(request);

  // Check per-minute limit
  if (!rateLimiter.isAllowed(clientId, 60 * 1000, rateLimitConfig.maxRequestsPerMinute)) {
    return false;
  }

  // Check per-hour limit
  if (
    !rateLimiter.isAllowed(`${clientId}:hour`, 60 * 60 * 1000, rateLimitConfig.maxRequestsPerHour)
  ) {
    return false;
  }

  return true;
}
