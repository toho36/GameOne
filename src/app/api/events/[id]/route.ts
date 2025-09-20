import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { eventUpdateSchema } from "@/lib/validation/event-creation";

// Helper function to create user with default role and active status
async function createUserWithDefaults(kindeUser: any) {
  // Get default USER role
  const defaultRole = await prisma.role.findUnique({
    where: { name: "USER" },
  });

  return await prisma.user.create({
    data: {
      kindeId: kindeUser.id,
      email: kindeUser.email || "",
      name: kindeUser.given_name || kindeUser.family_name || kindeUser.email || "User",
      firstName: kindeUser.given_name || "",
      lastName: kindeUser.family_name || "",
      status: "ACTIVE", // Set to ACTIVE by default
      primaryRoleId: defaultRole?.id, // Assign default USER role
    },
    include: {
      primaryRole: true,
      userRoles: { where: { isActive: true }, include: { role: true } },
    },
  });
}

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/events/[id] - Get single event
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: eventId } = params;

    // Find event by ID or slug
    const event = await prisma.event.findFirst({
      where: {
        OR: [{ id: eventId }, { slug: eventId }],
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        manager: {
          select: { id: true, name: true, email: true },
        },
        bankAccount: {
          select: { id: true, name: true, bankName: true, accountNumber: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: { in: ["CONFIRMED", "PENDING"] },
              },
            },
            waitingList: true,
            pendingPayments: {
              where: {
                status: "PENDING",
              },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    logger.error("Event fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

// PUT /api/events/[id] - Update event
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: eventId } = params;
    const body = await request.json();

    // Get user from database, create if doesn't exist
    let dbUser = await prisma.user.findUnique({
      where: { kindeId: user.id },
      include: {
        primaryRole: true,
        userRoles: { where: { isActive: true }, include: { role: true } },
      },
    });

    if (!dbUser) {
      // Create user if they don't exist in database with defaults
      dbUser = await createUserWithDefaults(user);
    }

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

    // Role-based edit permissions:
    // - ADMIN and MODERATOR: can edit ANY event
    // - EVENT_MANAGER: can only edit events they created
    // - Regular users: can only edit events they created
    if (isAdmin || isModerator) {
      // Admin and Moderator can edit any event - no additional checks
    } else if (isEventManager) {
      // Event Manager can only edit events they created
      if (existingEvent.creatorId !== dbUser.id) {
        return NextResponse.json(
          { error: "Event Managers can only edit events they created" },
          { status: 403 }
        );
      }
    } else {
      // Regular users can only edit events they created
      if (existingEvent.creatorId !== dbUser.id) {
        return NextResponse.json(
          { error: "You can only edit events you created" },
          { status: 403 }
        );
      }
    }

    // Validate request body
    const validation = eventUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: data.title,
        description: data.description ?? null,
        shortDescription: null, // Not used in simplified form
        type: data.type as any, // Convert to EventType
        status: data.status || body.status || existingEvent.status,
        capacity: data.capacity,
        price: data.price ?? null,
        currency: data.currency ?? "CZK",
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        timezone: data.timezone ?? "Europe/Prague",
        venue: data.venue ?? null,
        address: null, // Not used in simplified form
        city: null, // Not used in simplified form
        country: data.country ?? "Czech Republic",
        isOnline: data.isOnline ?? false,
        onlineUrl: null, // Not used in simplified form
        registrationStartDate: data.registrationStartDate ?? null,
        registrationEndDate: data.registrationEndDate ?? null,
        requiresApproval: data.requiresApproval ?? false,
        allowWaitingList: data.allowWaitingList ?? true,
        maxWaitingList: null, // Not used in simplified form
        requiresPayment: data.requiresPayment ?? false,
        bankAccountId: data.bankAccountId ?? null,
        tags: data.tags ?? [],
        imageUrl: null, // Not used in simplified form
        websiteUrl: null, // Not used in simplified form
      },
    });

    return NextResponse.json({
      success: true,
      event: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        slug: updatedEvent.slug,
        status: updatedEvent.status,
      },
      message: "Event updated successfully",
    });
  } catch (error) {
    logger.error("Event update error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

// DELETE /api/events/[id] - Delete event
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: eventId } = params;

    // Get user from database, create if doesn't exist
    let dbUser = await prisma.user.findUnique({
      where: { kindeId: user.id },
      include: {
        primaryRole: true,
        userRoles: { where: { isActive: true }, include: { role: true } },
      },
    });

    if (!dbUser) {
      // Create user if they don't exist in database with defaults
      dbUser = await createUserWithDefaults(user);
    }

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if event exists and user has permission
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            registrations: true,
            waitingList: true,
          },
        },
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user has elevated role or is creator
    const roleNamesDel: string[] = [
      ...(dbUser?.primaryRole?.name ? [dbUser.primaryRole.name] : []),
      ...((dbUser?.userRoles ?? []).map((ur: any) => ur.role?.name).filter(Boolean) as string[]),
    ];
    const isAdminDel = roleNamesDel.includes("ADMIN");
    const isModeratorDel = roleNamesDel.includes("MODERATOR");
    const isEventManagerDel = roleNamesDel.includes("EVENT_MANAGER");

    // Role-based delete permissions:
    // - ADMIN and MODERATOR: can delete ANY event
    // - EVENT_MANAGER: can only delete events they created
    // - Regular users: can only delete events they created
    if (isAdminDel || isModeratorDel) {
      // Admin and Moderator can delete any event - no additional checks
    } else if (isEventManagerDel) {
      // Event Manager can only delete events they created
      if (existingEvent.creatorId !== dbUser.id) {
        return NextResponse.json(
          { error: "Event Managers can only delete events they created" },
          { status: 403 }
        );
      }
    } else {
      // Regular users can only delete events they created
      if (existingEvent.creatorId !== dbUser.id) {
        return NextResponse.json(
          { error: "You can only delete events you created" },
          { status: 403 }
        );
      }
    }

    // Check if event has registrations
    if (existingEvent._count.registrations > 0 || existingEvent._count.waitingList > 0) {
      return NextResponse.json(
        { error: "Cannot delete event with existing registrations" },
        { status: 400 }
      );
    }

    // Delete event
    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    logger.error("Event deletion error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
