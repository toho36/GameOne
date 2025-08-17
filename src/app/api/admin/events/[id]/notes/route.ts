import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserPermissions } from "@/lib/kinde-auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { sendAdminNoteNotification } from "@/lib/services/moderation-notification-service";

const noteSchema = z.object({
  content: z.string().min(1, "Note content is required").max(2000, "Note too long"),
  isInternal: z.boolean().default(true),
});

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
    const { content, isInternal } = noteSchema.parse(body);

    // Verify event exists
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

    // Create the note
    const note = await prisma.moderationNote.create({
      data: {
        eventId: params.id,
        content,
        authorId: user.id,
        isInternal,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If not internal, send notification to event creator
    if (!isInternal) {
      sendAdminNoteNotification({
        eventTitle: event.title,
        eventId: event.id,
        creatorName: event.creator.name || "User",
        creatorEmail: event.creator.email,
        adminName: user.given_name || user.family_name || "Administrator",
        noteContent: content,
        actionUrl: `${process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"}/events/${event.id}`,
      }).catch((error) => logger.error("Failed to send note notification:", error));
    }

    logger.info(`Admin note added to event ${params.id} by ${user.id}`, {
      noteId: note.id,
      isInternal,
    });

    return NextResponse.json(note);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    logger.error("Error creating admin note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const notes = await prisma.moderationNote.findMany({
      where: { eventId: params.id },
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
    });

    return NextResponse.json(notes);
  } catch (error) {
    logger.error("Error fetching admin notes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
