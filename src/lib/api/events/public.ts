import { prisma } from "@/lib/prisma";
import type { PublicEvent } from "@/types/features/event-registration";

export async function getPublicEventById(id: string): Promise<PublicEvent | null> {
  try {
    const event = await prisma.event.findUnique({
      where: {
        id,
        status: "PUBLISHED",
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        registrations: {
          where: { status: "CONFIRMED" },
          select: { id: true },
        },
        _count: {
          select: {
            registrations: {
              where: { status: "CONFIRMED" },
            },
          },
        },
      },
    });

    if (!event) {
      return null;
    }

    // Transform to public format
    const now = new Date();

    // Determine if registration is open based on control mode
    let registrationOpen = false;

    if (event.registrationStartDate || event.registrationEndDate) {
      // Both scheduled and manual control modes set dates
      const registrationStart = event.registrationStartDate || event.createdAt;
      const registrationEnd = event.registrationEndDate || event.startDate;
      registrationOpen = now >= registrationStart && now <= registrationEnd;
    } else {
      // Fallback for events without registration dates (legacy events)
      registrationOpen = true;
    }

    const confirmedParticipants = event._count.registrations;
    const availableSpots = event.capacity
      ? Math.max(0, event.capacity - confirmedParticipants)
      : undefined;

    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      description: event.description || undefined,
      shortDescription: event.shortDescription || undefined,
      startDate: event.startDate,
      endDate: event.endDate || undefined,
      registrationStartDate: event.registrationStartDate || undefined,
      registrationEndDate: event.registrationEndDate || undefined,
      capacity: event.capacity,
      price: event.price ? Number(event.price) : undefined,
      currency: event.currency,
      venue: event.venue || undefined,
      status: event.status,
      tags: event.tags,
      requiresApproval: event.requiresApproval,
      category: event.category
        ? {
            id: event.category.id,
            name: event.category.name,
            slug: event.category.slug,
            color: event.category.color || undefined,
            isActive: true, // Default value since not selected
            sortOrder: 0, // Default value since not selected
          }
        : undefined,
      registrationOpen,
      availableSpots,
      confirmedParticipants,
      waitingListCount: 0, // TODO: Implement waiting list count
      averageRating: undefined, // TODO: Implement rating system
      canRegister: true, // TODO: Implement permission checking
      canEdit: false, // Public users can't edit events
      canDelete: false, // Public users can't delete events
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function getPublicEvent(slug: string): Promise<PublicEvent | null> {
  try {
    const event = await prisma.event.findUnique({
      where: {
        slug,
        status: "PUBLISHED",
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        registrations: {
          where: { status: "CONFIRMED" },
          select: { id: true },
        },
        _count: {
          select: {
            registrations: {
              where: { status: "CONFIRMED" },
            },
          },
        },
      },
    });

    if (!event) {
      return null;
    }

    // Transform to public format
    const now = new Date();

    // Determine if registration is open based on control mode
    let registrationOpen = false;

    if (event.registrationStartDate || event.registrationEndDate) {
      // Both scheduled and manual control modes set dates
      const registrationStart = event.registrationStartDate || event.createdAt;
      const registrationEnd = event.registrationEndDate || event.startDate;
      registrationOpen = now >= registrationStart && now <= registrationEnd;
    } else {
      // Fallback for events without registration dates (legacy events)
      registrationOpen = true;
    }

    const confirmedParticipants = event._count.registrations;
    const availableSpots = event.capacity
      ? Math.max(0, event.capacity - confirmedParticipants)
      : undefined;

    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      description: event.description || undefined,
      shortDescription: event.shortDescription || undefined,
      startDate: event.startDate,
      endDate: event.endDate || undefined,
      registrationStartDate: event.registrationStartDate || undefined,
      registrationEndDate: event.registrationEndDate || undefined,
      capacity: event.capacity,
      price: event.price ? Number(event.price) : undefined,
      currency: event.currency,
      venue: event.venue || undefined,
      status: event.status,
      tags: event.tags,
      requiresApproval: event.requiresApproval,
      category: event.category
        ? {
            id: event.category.id,
            name: event.category.name,
            slug: event.category.slug,
            color: event.category.color || undefined,
            isActive: true, // Default value since not selected
            sortOrder: 0, // Default value since not selected
          }
        : undefined,
      registrationOpen,
      availableSpots,
      confirmedParticipants,
      waitingListCount: 0, // TODO: Implement waiting list count
      averageRating: undefined, // TODO: Implement rating system
      canRegister: true, // TODO: Implement permission checking
      canEdit: false, // Public users can't edit events
      canDelete: false, // Public users can't delete events
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  } catch {
    return null;
  }
}
