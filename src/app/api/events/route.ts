/**
 * Events API endpoint - Thin handler for GameOne
 * Refactored from 254 lines following project standards
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/api/common/auth";
import { eventsService } from "@/lib/api/events/service";

// GET /api/events - List events with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return authResult.response;
    }

    // Delegate to service
    const result = await eventsService.getEvents(request, authResult.data.user.id);

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Events fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();

    // Delegate to service
    const result = await eventsService.createEvent(body, authResult.data.user.id);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          errors: result.errors,
        },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    logger.error("Event creation error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
