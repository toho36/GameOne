import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserPermissions } from "@/lib/kinde-auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { EventStatus } from "@prisma/client";
import { z } from "zod";
import { sendModerationNotification as sendModerationNotificationEmail } from "@/lib/services/moderation-notification-service";

const moderationActionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES", "SUSPEND", "RESTORE"]),
  reason: z.string().optional(),
  adminNote: z.string().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin permissions
    const userPermissions = await getUserPermissions();
    const hasAdminAccess = userPermissions.some((permission) =>
      ["admin:events:manage", "admin:all", "events:admin"].includes(permission)
    );

    if (!hasAdminAccess) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        moderationNotes: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        moderationHistory: {
          include: {
            performedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    logger.error("Error fetching event for moderation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin permissions
    const userPermissions = await getUserPermissions();
    const hasAdminAccess = userPermissions.some((permission) =>
      ["admin:events:manage", "admin:all", "events:admin"].includes(permission)
    );

    if (!hasAdminAccess) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { action, reason, adminNote } = moderationActionSchema.parse(body);

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const oldStatus = event.status;
    let newStatus: EventStatus;

    // Determine new status based on action
    switch (action) {
      case "APPROVE":
        newStatus = EventStatus.PUBLISHED;
        break;
      case "REJECT":
        newStatus = EventStatus.REJECTED;
        break;
      case "SUSPEND":
        newStatus = EventStatus.SUSPENDED;
        break;
      case "RESTORE":
        newStatus = event.status === "REJECTED" ? EventStatus.DRAFT : EventStatus.PUBLISHED;
        break;
      case "REQUEST_CHANGES":
        newStatus = EventStatus.DRAFT;
        break;
      default:
        newStatus = event.status;
    }

    // Perform moderation action in a transaction
    const updatedEvent = await prisma.$transaction(async (tx) => {
      // Update event status
      const updated = await tx.event.update({
        where: { id: params.id },
        data: {
          status: newStatus,
          updatedAt: new Date(),
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          moderationNotes: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          moderationHistory: {
            include: {
              performedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      });

      // Record moderation action in history
      await tx.moderationAction.create({
        data: {
          eventId: params.id,
          action,
          reason: reason || null,
          performedById: user.id,
          oldStatus,
          newStatus,
        },
      });

      // Add admin note if provided
      if (adminNote) {
        await tx.moderationNote.create({
          data: {
            eventId: params.id,
            content: adminNote,
            authorId: user.id,
            isInternal: true,
          },
        });
      }

      return updated;
    });

    // Send notification to event creator (async, don't wait)
    sendModerationNotificationEmail(action, {
      eventTitle: event.title,
      eventId: event.id,
      creatorName: event.creator.name || "User",
      creatorEmail: event.creator.email,
      adminName: user.given_name || user.family_name || "Administrator",
      reason,
      actionUrl: `${process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"}/events/${event.id}`,
    }).catch((error) => logger.error("Failed to send moderation notification:", error));

    logger.info(`Event ${params.id} moderation action: ${action} by ${user.id}`);

    return NextResponse.json(updatedEvent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    logger.error("Error performing moderation action:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
