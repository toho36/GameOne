import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/kinde-auth";
import { logger } from "@/lib/logger";
import { EventService, EventAnalyticsResponse } from "@/lib/services";
import { broadcastAnalyticsUpdate } from "@/lib/utils/sse-manager";
import {
  AnalyticsResponse,
  AnalyticsCacheEntry,
  AnalyticsQueryParams,
  AnalyticsRefreshResponse,
  AnalyticsAPIError,
} from "@/types/analytics";

const eventService = new EventService();

// In-memory cache for analytics data (TTL: 5 minutes)
const analyticsCache = new Map<string, AnalyticsCacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Analytics API error codes
const ERROR_CODES = {
  NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
  EVENT_NOT_FOUND: "EVENT_NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_PARAMETERS: "INVALID_PARAMETERS",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  CACHE_ERROR: "CACHE_ERROR",
} as const;

/**
 * Create a standardized error response
 */
function createErrorResponse(
  errorCode: keyof typeof ERROR_CODES,
  message: string,
  status: number,
  details?: Record<string, any>
): NextResponse<AnalyticsAPIError> {
  const error: AnalyticsAPIError = {
    error: message,
    details: details ? { code: errorCode, ...details } : { code: errorCode },
    timestamp: new Date().toISOString(),
  };

  logger.error(`Analytics API Error: ${errorCode}`, {
    message,
    status,
    details,
    timestamp: error.timestamp,
  });

  return NextResponse.json(error, { status });
}

/**
 * Get cached analytics data if available and not expired
 */
function getCachedAnalytics(eventId: string): EventAnalyticsResponse | null {
  try {
    const entry = analyticsCache.get(eventId);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      analyticsCache.delete(eventId);
      logger.debug("Cache entry expired and removed", {
        eventId,
        expiredAt: now - entry.timestamp,
      });
      return null;
    }

    logger.debug("Cache hit", { eventId, age: now - entry.timestamp });
    return entry.data;
  } catch (error) {
    logger.error("Error accessing analytics cache", { eventId, error });
    return null;
  }
}

/**
 * Cache analytics data with error handling
 */
function setCachedAnalytics(eventId: string, data: EventAnalyticsResponse): boolean {
  try {
    const cacheEntry: AnalyticsCacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: CACHE_TTL,
    };

    analyticsCache.set(eventId, cacheEntry);
    logger.debug("Analytics data cached", { eventId, timestamp: cacheEntry.timestamp });
    return true;
  } catch (error) {
    logger.error("Error caching analytics data", { eventId, error });
    return false;
  }
}

/**
 * Parse and validate query parameters
 */
function parseQueryParams(searchParams: URLSearchParams): AnalyticsQueryParams {
  return {
    skipCache: searchParams.get("skipCache") === "true",
    includeRealTime: searchParams.get("realTime") === "true",
  };
}

/**
 * GET /api/events/[id]/analytics
 * Get comprehensive analytics data for a specific event with caching
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const startTime = Date.now();
  let user;

  try {
    // Validate event ID parameter
    if (!params.id || typeof params.id !== "string" || params.id.trim().length === 0) {
      return createErrorResponse("INVALID_PARAMETERS", "Invalid event ID provided", 400, {
        eventId: params.id,
      });
    }

    // Authenticate user
    user = await getCurrentUser();
    if (!user) {
      return createErrorResponse("NOT_AUTHENTICATED", "Authentication required", 401);
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = parseQueryParams(searchParams);

    // Check cache first unless explicitly skipped
    if (!queryParams.skipCache) {
      const cachedData = getCachedAnalytics(params.id);
      if (cachedData) {
        const response: AnalyticsResponse = {
          ...cachedData,
          cached: true,
          cacheTimestamp: analyticsCache.get(params.id)?.timestamp,
          timestamp: new Date().toISOString(),
        };

        logger.info("Serving analytics from cache", {
          eventId: params.id,
          userId: user.id,
          responseTime: Date.now() - startTime,
        });

        return NextResponse.json(response);
      }
    }

    // Get fresh analytics data
    const analytics = await eventService.getEventAnalytics(params.id, user.id);

    // Cache the result
    const cacheSuccess = setCachedAnalytics(params.id, analytics);
    if (!cacheSuccess) {
      logger.warn("Failed to cache analytics data", { eventId: params.id });
    }

    // Broadcast real-time update if requested
    if (queryParams.includeRealTime) {
      try {
        broadcastAnalyticsUpdate(params.id, analytics);
        logger.debug("Real-time update broadcast", { eventId: params.id });
      } catch (broadcastError) {
        logger.error("Failed to broadcast real-time update", {
          eventId: params.id,
          error: broadcastError,
        });
        // Don't fail the request if broadcast fails
      }
    }

    const response: AnalyticsResponse = {
      ...analytics,
      cached: false,
      timestamp: new Date().toISOString(),
    };

    logger.info("Serving fresh analytics data", {
      eventId: params.id,
      userId: user.id,
      cached: false,
      responseTime: Date.now() - startTime,
    });

    return NextResponse.json(response);
  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (error instanceof Error) {
      if (error.message === "Event not found") {
        return createErrorResponse("EVENT_NOT_FOUND", "Event not found", 404, {
          eventId: params.id,
          userId: user?.id,
          responseTime,
        });
      }
      if (error.message === "Unauthorized") {
        return createErrorResponse("UNAUTHORIZED", "Access denied to this event", 403, {
          eventId: params.id,
          userId: user?.id,
          responseTime,
        });
      }
    }

    logger.error("Unexpected error fetching event analytics", {
      error,
      eventId: params.id,
      userId: user?.id,
      responseTime,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createErrorResponse("INTERNAL_ERROR", "Internal server error", 500, {
      eventId: params.id,
      responseTime,
    });
  }
}

/**
 * POST /api/events/[id]/analytics/refresh
 * Manually refresh analytics cache and broadcast update
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const startTime = Date.now();
  let user;

  try {
    // Validate event ID parameter
    if (!params.id || typeof params.id !== "string" || params.id.trim().length === 0) {
      return createErrorResponse("INVALID_PARAMETERS", "Invalid event ID provided", 400, {
        eventId: params.id,
      });
    }

    // Authenticate user
    user = await getCurrentUser();
    if (!user) {
      return createErrorResponse("NOT_AUTHENTICATED", "Authentication required", 401);
    }

    // Get fresh analytics data
    const analytics = await eventService.getEventAnalytics(params.id, user.id);

    // Update cache
    const cacheSuccess = setCachedAnalytics(params.id, analytics);
    if (!cacheSuccess) {
      logger.warn("Failed to update cache during refresh", { eventId: params.id, userId: user.id });
    }

    // Broadcast to all connected SSE clients
    try {
      broadcastAnalyticsUpdate(params.id, analytics);
      logger.debug("Analytics update broadcast after refresh", { eventId: params.id });
    } catch (broadcastError) {
      logger.error("Failed to broadcast analytics update after refresh", {
        eventId: params.id,
        error: broadcastError,
      });
      // Don't fail the request if broadcast fails
    }

    const response: AnalyticsRefreshResponse = {
      success: true,
      message: "Analytics refreshed successfully",
      data: {
        ...analytics,
        cached: false,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    logger.info("Analytics cache refreshed and broadcast", {
      eventId: params.id,
      userId: user.id,
      responseTime: Date.now() - startTime,
    });

    return NextResponse.json(response);
  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (error instanceof Error) {
      if (error.message === "Event not found") {
        return createErrorResponse("EVENT_NOT_FOUND", "Event not found", 404, {
          eventId: params.id,
          userId: user?.id,
          responseTime,
        });
      }
      if (error.message === "Unauthorized") {
        return createErrorResponse("UNAUTHORIZED", "Access denied to this event", 403, {
          eventId: params.id,
          userId: user?.id,
          responseTime,
        });
      }
    }

    logger.error("Unexpected error refreshing analytics", {
      error,
      eventId: params.id,
      userId: user?.id,
      responseTime,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createErrorResponse("INTERNAL_ERROR", "Failed to refresh analytics", 500, {
      eventId: params.id,
      responseTime,
    });
  }
}
