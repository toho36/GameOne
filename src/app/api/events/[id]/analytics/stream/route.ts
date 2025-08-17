import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/kinde-auth";
import { logger } from "@/lib/logger";
import { EventService } from "@/lib/services";
import {
  addSSEConnection,
  removeSSEConnection,
  sendConnectionEstablished,
  sendInitialData,
  sendHeartbeat,
  broadcastAnalyticsUpdate as broadcastUpdate,
} from "@/lib/utils/sse-manager";

const eventService = new EventService();

/**
 * GET /api/events/[id]/analytics/stream
 * Server-Sent Events endpoint for real-time analytics updates
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify user has access to this event and get initial analytics
    let initialAnalytics;
    try {
      initialAnalytics = await eventService.getEventAnalytics(params.id, user.id);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Event not found") {
          return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }
        if (error.message === "Unauthorized") {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      }
      throw error;
    }

    let heartbeatInterval: ReturnType<typeof setInterval>;
    let streamController: ReadableStreamDefaultController | null = null;

    // Create readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        streamController = controller;

        // Add this controller to the SSE manager
        addSSEConnection(params.id, controller);

        // Send initial connection confirmation
        sendConnectionEstablished(params.id, controller);

        // Send initial analytics data
        sendInitialData(params.id, controller, initialAnalytics);

        // Set up periodic heartbeat to keep connection alive
        heartbeatInterval = setInterval(() => {
          try {
            sendHeartbeat(params.id);
          } catch {
            // Connection is broken, clean up
            clearInterval(heartbeatInterval);
            if (streamController) {
              removeSSEConnection(params.id, streamController);
            }
          }
        }, 30000); // Send heartbeat every 30 seconds

        logger.info("SSE connection established", { eventId: params.id, userId: user.id });
      },

      cancel() {
        // Clean up connection on client disconnect
        clearInterval(heartbeatInterval);
        if (streamController) {
          removeSSEConnection(params.id, streamController);
        }
        logger.info("SSE connection cancelled", { eventId: params.id, userId: user.id });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    });
  } catch (error) {
    logger.error("Error setting up SSE stream:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Export function to broadcast updates to SSE connections
 * This is used by the main analytics route
 */
export function broadcastAnalyticsUpdate(eventId: string, data: any): void {
  broadcastUpdate(eventId, data);
}
