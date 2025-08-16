import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/kinde-auth";
import { logger } from "@/lib/logger";
import { EventService } from "@/lib/services";

const eventService = new EventService();

/**
 * GET /api/events/[id]/analytics
 * Get analytics data for a specific event
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get event analytics
    const analytics = await eventService.getEventAnalytics(params.id, user.id);

    return NextResponse.json(analytics);
  } catch (error) {
    logger.error("Error fetching event analytics:", error);

    if (error instanceof Error) {
      if (error.message === "Event not found") {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
