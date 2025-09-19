/**
 * Events API endpoint - Thin handler for GameOne
 * Uses permission checks, response helpers, and delegates to service layer
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { requirePermissions } from "@/lib/api/common/auth";
import { ok, created, error as errorResponse } from "@/lib/api/common/response";
import { eventsService } from "@/lib/api/events/service";

// GET /api/events - List events with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermissions(["events.view"]);
    if (!authResult.success) return authResult.response;

    const result = await eventsService.getEvents(request, authResult.data.user);
    return ok(result);
  } catch (err) {
    logger.error("Events fetch error:", err);
    return errorResponse("Failed to fetch events", 500);
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermissions(["events.create"]);
    if (!authResult.success) return authResult.response;

    const body = await request.json();
    const result = await eventsService.createEvent(body, authResult.data.user.id);

    if (!result.success) {
      return errorResponse(
        result.error || "Validation failed",
        result.status || 400,
        result.errors
      );
    }

    return created(result.data);
  } catch (err) {
    logger.error("Event creation error:", err);
    return errorResponse("Failed to create event", 500);
  }
}
