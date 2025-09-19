import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/events/[id]/publish - Publish or unpublish event
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: eventId } = params;
    const body = await request.json();
    const { action } = body; // 'publish' or 'unpublish'

    // Get user from database with roles
    const dbUser = await prisma.user.findUnique({
      where: { kindeId: user.id },
      include: {
        primaryRole: true,
        userRoles: { where: { isActive: true }, include: { role: true } },
      },
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

    // Check if user has elevated role or is creator/manager
    const roleNames: string[] = [
      ...(dbUser?.primaryRole?.name ? [dbUser.primaryRole.name] : []),
      ...((dbUser?.userRoles ?? []).map((ur: any) => ur.role?.name).filter(Boolean) as string[]),
    ];
    const isAdmin = roleNames.includes("ADMIN");
    const isModerator = roleNames.includes("MODERATOR");
    const isEventManager = roleNames.includes("EVENT_MANAGER");

    // Role-based publish permissions:
    // - ADMIN and MODERATOR: can publish/unpublish ANY event
    // - EVENT_MANAGER: can only publish/unpublish events they created
    // - Regular users: can only publish/unpublish events they created
    if (isAdmin || isModerator) {
      // Admin and Moderator can publish/unpublish any event - no additional checks
    } else if (isEventManager) {
      // Event Manager can only publish/unpublish events they created
      if (existingEvent.creatorId !== dbUser.id) {
        return NextResponse.json(
          { error: "Event Managers can only publish/unpublish events they created" },
          { status: 403 }
        );
      }
    } else {
      // Regular users can only publish/unpublish events they created
      if (existingEvent.creatorId !== dbUser.id) {
        return NextResponse.json(
          { error: "You can only publish/unpublish events you created" },
          { status: 403 }
        );
      }
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
    logger.error("Event publish/unpublish error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}
