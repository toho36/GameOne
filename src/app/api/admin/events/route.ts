import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserPermissions } from "@/lib/kinde-auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

const adminEventsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
  status: z
    .enum([
      "DRAFT",
      "PUBLISHED",
      "CANCELLED",
      "COMPLETED",
      "POSTPONED",
      "PENDING_APPROVAL",
      "REJECTED",
      "SUSPENDED",
    ])
    .optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "startDate", "title", "status"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  needsModeration: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

export async function GET(request: NextRequest) {
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
    const validatedQuery = adminEventsQuerySchema.parse(query);

    const { page, limit, status, search, sortBy, sortOrder, needsModeration } = validatedQuery;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (needsModeration) {
      where.status = {
        in: ["PENDING_APPROVAL", "DRAFT"],
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { creator: { name: { contains: search, mode: "insensitive" } } },
        { creator: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await prisma.event.count({ where });

    // Get events with all necessary data
    const events = await prisma.event.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        manager: {
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
          take: 3, // Only get latest 3 notes for overview
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
          take: 5, // Only get latest 5 actions for overview
        },
        _count: {
          select: {
            registrations: true,
            moderationNotes: true,
            moderationHistory: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Get status counts for filter badges
    const statusCounts = await prisma.event.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    const statusCountsMap = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get events needing moderation count
    const moderationCount = await prisma.event.count({
      where: {
        status: {
          in: ["PENDING_APPROVAL", "DRAFT"],
        },
      },
    });

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
      filters: {
        statusCounts: statusCountsMap,
        moderationCount,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    logger.error("Error fetching admin events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Get moderation dashboard statistics
 */
export async function POST(request: NextRequest) {
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
    const { action } = body;

    if (action === "get_stats") {
      // Get comprehensive moderation statistics
      const [eventsByStatus, recentActions, topModerators, dailyStats] = await Promise.all([
        // Events by status
        prisma.event.groupBy({
          by: ["status"],
          _count: {
            id: true,
          },
        }),

        // Recent moderation actions (last 30 days)
        prisma.moderationAction.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          include: {
            event: {
              select: {
                id: true,
                title: true,
              },
            },
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
          take: 10,
        }),

        // Top moderators by action count (last 30 days)
        prisma.moderationAction.groupBy({
          by: ["performedById"],
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: "desc",
            },
          },
          take: 5,
        }),

        // Daily moderation stats (last 7 days)
        prisma.moderationAction.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          select: {
            action: true,
            createdAt: true,
          },
        }),
      ]);

      // Process top moderators to include user names
      const moderatorIds = topModerators.map((m) => m.performedById);
      const moderatorUsers = await prisma.user.findMany({
        where: {
          id: {
            in: moderatorIds,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      const topModeratorsWithNames = topModerators.map((moderator) => {
        const user = moderatorUsers.find((u) => u.id === moderator.performedById);
        return {
          ...moderator,
          moderator: user,
        };
      });

      // Process daily stats
      const dailyStatsMap = dailyStats.reduce(
        (acc: Record<string, any>, action) => {
          const date = action.createdAt.toISOString().split("T")[0];
          if (!date) return acc;

          if (!acc[date]) {
            acc[date] = {
              date,
              total: 0,
              approved: 0,
              rejected: 0,
              suspended: 0,
              restored: 0,
              changesRequested: 0,
            };
          }

          const stats = acc[date];
          if (stats) {
            stats.total++;

            switch (action.action) {
              case "APPROVE":
                stats.approved++;
                break;
              case "REJECT":
                stats.rejected++;
                break;
              case "SUSPEND":
                stats.suspended++;
                break;
              case "RESTORE":
                stats.restored++;
                break;
              case "REQUEST_CHANGES":
                stats.changesRequested++;
                break;
            }
          }

          return acc;
        },
        {} as Record<string, any>
      );

      const dailyStatsArray = Object.values(dailyStatsMap).sort(
        (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      return NextResponse.json({
        eventsByStatus,
        recentActions,
        topModerators: topModeratorsWithNames,
        dailyStats: dailyStatsArray,
        summary: {
          totalEvents: eventsByStatus.reduce((sum: number, item: any) => sum + item._count.id, 0),
          pendingApproval:
            eventsByStatus.find((item: any) => item.status === "PENDING_APPROVAL")?._count?.id || 0,
          totalActionsLast30Days: recentActions.length,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error("Error in admin events POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
