import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import { prisma } from "@/lib/prisma";
import { eventUpdateSchema } from "@/lib/validation/event-creation";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/events/[id] - Get single event
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const eventId = params.id;

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
    console.error("Event fetch error:", error);
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

    const eventId = params.id;
    const body = await request.json();

    // Get user from database, create if doesn't exist
    let dbUser = await prisma.user.findUnique({
      where: { kindeId: user.id },
    });

    if (!dbUser) {
      // Create user if they don't exist in database
      dbUser = await prisma.user.create({
        data: {
          kindeId: user.id,
          email: user.email || "",
          name: user.given_name || user.family_name || user.email || "User",
          firstName: user.given_name || "",
          lastName: user.family_name || "",
        },
      });
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
        registrationStartDate: null, // Not used in simplified form
        registrationEndDate: null, // Not used in simplified form
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
    console.error("Event update error:", error);
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

    const eventId = params.id;

    // Get user from database, create if doesn't exist
    let dbUser = await prisma.user.findUnique({
      where: { kindeId: user.id },
    });

    if (!dbUser) {
      // Create user if they don't exist in database
      dbUser = await prisma.user.create({
        data: {
          kindeId: user.id,
          email: user.email || "",
          name: user.given_name || user.family_name || user.email || "User",
          firstName: user.given_name || "",
          lastName: user.family_name || "",
        },
      });
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

    // Check if user is creator
    if (existingEvent.creatorId !== dbUser.id) {
      return NextResponse.json({ error: "Only event creator can delete events" }, { status: 403 });
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
    console.error("Event deletion error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
