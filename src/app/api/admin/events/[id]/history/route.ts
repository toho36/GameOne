import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserPermissions } from "@/lib/kinde-auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

const historyQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),
  type: z.enum(["actions", "notes", "all"]).optional().default("all"),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const { page, limit, type } = historyQuerySchema.parse(query);

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const skip = (page - 1) * limit;

    let history: any[] = [];
    let totalCount = 0;

    if (type === "actions" || type === "all") {
      // Get moderation actions
      const actions = await prisma.moderationAction.findMany({
        where: { eventId: params.id },
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        ...(type === "actions" ? { skip, take: limit } : {}),
      });

      const actionsWithType = actions.map((action) => ({
        ...action,
        type: "action" as const,
        content: action.reason,
        author: action.performedBy,
        isInternal: true,
      }));

      history.push(...actionsWithType);
    }

    if (type === "notes" || type === "all") {
      // Get moderation notes
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
        orderBy: { createdAt: "desc" },
        ...(type === "notes" ? { skip, take: limit } : {}),
      });

      const notesWithType = notes.map((note) => ({
        ...note,
        type: "note" as const,
        action: null,
        reason: null,
        oldStatus: null,
        newStatus: null,
        performedBy: note.author,
      }));

      history.push(...notesWithType);
    }

    // Sort combined history by date if getting all types
    if (type === "all") {
      history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      totalCount = history.length;
      history = history.slice(skip, skip + limit);
    } else {
      // Get separate counts for pagination
      if (type === "actions") {
        totalCount = await prisma.moderationAction.count({
          where: { eventId: params.id },
        });
      } else if (type === "notes") {
        totalCount = await prisma.moderationNote.count({
          where: { eventId: params.id },
        });
      }
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Get summary statistics
    const [actionCounts, noteCounts] = await Promise.all([
      prisma.moderationAction.groupBy({
        by: ["action"],
        where: { eventId: params.id },
        _count: {
          id: true,
        },
      }),
      prisma.moderationNote.groupBy({
        by: ["isInternal"],
        where: { eventId: params.id },
        _count: {
          id: true,
        },
      }),
    ]);

    const actionCountsMap = actionCounts.reduce(
      (acc, item) => {
        acc[item.action] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    const noteCountsMap = noteCounts.reduce(
      (acc, item) => {
        acc[item.isInternal ? "internal" : "external"] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      event,
      history,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext,
        hasPrev,
      },
      summary: {
        actions: actionCountsMap,
        notes: noteCountsMap,
        totalActions: actionCounts.reduce((sum, item) => sum + item._count.id, 0),
        totalNotes: noteCounts.reduce((sum, item) => sum + item._count.id, 0),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    logger.error("Error fetching event moderation history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Export moderation history for an event
 */
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
    const { format = "json" } = body;

    // Get all history for export
    const [event, actions, notes] = await Promise.all([
      prisma.event.findUnique({
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
      }),
      prisma.moderationAction.findMany({
        where: { eventId: params.id },
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.moderationNote.findMany({
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
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const exportData = {
      event: {
        id: event.id,
        title: event.title,
        status: event.status,
        creator: event.creator,
        createdAt: event.createdAt,
        exportedAt: new Date().toISOString(),
        exportedBy: {
          id: user.id,
          name: user.given_name || user.family_name || "Administrator",
          email: user.email,
        },
      },
      moderationActions: actions.map((action) => ({
        id: action.id,
        action: action.action,
        reason: action.reason,
        oldStatus: action.oldStatus,
        newStatus: action.newStatus,
        performedBy: action.performedBy,
        createdAt: action.createdAt,
      })),
      moderationNotes: notes.map((note) => ({
        id: note.id,
        content: note.content,
        isInternal: note.isInternal,
        author: note.author,
        createdAt: note.createdAt,
      })),
      summary: {
        totalActions: actions.length,
        totalNotes: notes.length,
        totalInternalNotes: notes.filter((n) => n.isInternal).length,
        totalExternalNotes: notes.filter((n) => !n.isInternal).length,
      },
    };

    if (format === "csv") {
      // Convert to CSV format
      const csvLines = [
        "Type,Date,Action/Content,Performed By,Internal,Old Status,New Status,Reason",
      ];

      // Add actions
      actions.forEach((action) => {
        csvLines.push(
          [
            "Action",
            action.createdAt.toISOString(),
            action.action,
            action.performedBy.name || action.performedBy.email,
            "N/A",
            action.oldStatus || "",
            action.newStatus || "",
            `"${(action.reason || "").replace(/"/g, '""')}"`,
          ].join(",")
        );
      });

      // Add notes
      notes.forEach((note) => {
        csvLines.push(
          [
            "Note",
            note.createdAt.toISOString(),
            `"${note.content.replace(/"/g, '""')}"`,
            note.author.name || note.author.email,
            note.isInternal ? "Yes" : "No",
            "",
            "",
            "",
          ].join(",")
        );
      });

      const csvContent = csvLines.join("\n");

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="event-${event.id}-moderation-history.csv"`,
        },
      });
    }

    // Return JSON format
    return NextResponse.json(exportData);
  } catch (error) {
    logger.error("Error exporting event moderation history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
