import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/kinde-auth";
import { logger } from "@/lib/logger";
import { EventService } from "@/lib/services";
import { eventFormSchema } from "@/lib/schemas/event-schemas";
import type { CreateEventRequest } from "@/lib/services";
import { z } from "zod";

const eventService = new EventService();

/**
 * GET /api/events
 * Get events with filtering, pagination, and user-specific queries
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const creatorId = searchParams.get("creatorId");

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }

    const queryParams: any = {
      page,
      limit,
      creatorId: creatorId || user.id, // Default to user's events
    };

    if (status) queryParams.status = status;
    if (type) queryParams.type = type;
    if (search) queryParams.search = search;

    const result = await eventService.getEvents(queryParams);

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error fetching events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/events
 * Create a new event with authentication middleware
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = eventFormSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const eventData = validationResult.data;

    // Create event
    const event = await eventService.createEvent(eventData as CreateEventRequest, user.id);

    return NextResponse.json(
      {
        success: true,
        event,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error creating event:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
