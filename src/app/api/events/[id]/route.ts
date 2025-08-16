import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/kinde-auth";
import { logger } from "@/lib/logger";
import { EventService } from "@/lib/services";
import { eventFormSchema } from "@/lib/schemas/event-schemas";
import { z } from "zod";

const eventService = new EventService();

/**
 * GET /api/events/[id]
 * Get a specific event by ID
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const event = await eventService.getEventById(params.id);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    logger.error("Error fetching event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/events/[id]
 * Update an event with permission checks
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body (partial update)
    const partialEventSchema = eventFormSchema.partial();
    const validationResult = partialEventSchema.safeParse(body);

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

    // Update event
    const result = await eventService.updateEvent(params.id, eventData as any, user.id);

    return NextResponse.json({
      success: true,
      event: result.event,
      warnings: result.warnings,
    });
  } catch (error) {
    logger.error("Error updating event:", error);

    if (error instanceof Error) {
      if (error.message === "Event not found") {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

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

/**
 * DELETE /api/events/[id]
 * Delete an event with registration validation
 */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Delete event
    await eventService.deleteEvent(params.id, user.id);

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting event:", error);

    if (error instanceof Error) {
      if (error.message === "Event not found") {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      if (error.message.includes("Cannot delete event with confirmed registrations")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
