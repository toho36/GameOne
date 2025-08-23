import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/events/[id]/publish - Publish or unpublish event
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const { action } = body; // 'publish' or 'unpublish'

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { kindeId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if event exists and user has permission
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user is creator or manager
    if (existingEvent.creatorId !== dbUser.id && existingEvent.managerId !== dbUser.id) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Validate action
    if (!action || !["publish", "unpublish"].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "publish" or "unpublish"' },
        { status: 400 }
      );
    }

    // Determine new status
    const newStatus = action === "publish" ? "PUBLISHED" : "DRAFT";

    // Validate event can be published
    if (action === "publish") {
      // Check required fields for publication
      if (!existingEvent.title || !existingEvent.startDate || !existingEvent.capacity) {
        return NextResponse.json(
          { error: "Event must have title, start date, and capacity to be published" },
          { status: 400 }
        );
      }

      // Check if start date is in the future
      if (new Date() >= existingEvent.startDate) {
        return NextResponse.json(
          { error: "Cannot publish events that have already started" },
          { status: 400 }
        );
      }

      // Check payment settings
      if (existingEvent.requiresPayment && !existingEvent.bankAccountId) {
        return NextResponse.json(
          { error: "Bank account must be selected for paid events" },
          { status: 400 }
        );
      }

      // Check location settings
      if (!existingEvent.isOnline && !existingEvent.venue) {
        return NextResponse.json(
          { error: "Venue must be specified for in-person events" },
          { status: 400 }
        );
      }

      if (existingEvent.isOnline && !existingEvent.onlineUrl) {
        return NextResponse.json(
          { error: "Online URL must be specified for online events" },
          { status: 400 }
        );
      }
    }

    // Update event status
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: newStatus,
        // Set registration start date to now if not set and publishing
        registrationStartDate:
          action === "publish" && !existingEvent.registrationStartDate
            ? new Date()
            : existingEvent.registrationStartDate,
      },
    });

    return NextResponse.json({
      success: true,
      event: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        status: updatedEvent.status,
      },
      message:
        action === "publish" ? "Event published successfully" : "Event unpublished successfully",
    });
  } catch (error) {
    console.error("Event publish/unpublish error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}
