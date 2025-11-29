import { prisma } from "@/lib/prisma";
import type { PublicEvent } from "@/types/features/event-registration";

const capacityPaymentStatuses = [
  "PAYMENT_SENT_AWAITING_VERIFICATION",
  "PAYMENT_VERIFIED",
  "VERIFIED_CASH",
] as const;

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
      },
    });

    if (!event) {
      return null;
    }

    // Compute counts based on payment status taking capacity
    const [confirmedParticipants, waitingListCount] = await Promise.all([
      prisma.registration.count({
        where: {
          eventId: event.id,
          paymentStatus: { in: capacityPaymentStatuses as any },
          status: { notIn: ["CANCELLED", "REJECTED"] as any },
        },
      }),
      prisma.waitingList.count({ where: { eventId: event.id } }),
    ]);

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
      waitingListCount,
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
      },
    });

    if (!event) {
      return null;
    }

    const [confirmedParticipants, waitingListCount] = await Promise.all([
      prisma.registration.count({
        where: {
          eventId: event.id,
          paymentStatus: { in: capacityPaymentStatuses as any },
          status: { notIn: ["CANCELLED", "REJECTED"] as any },
        },
      }),
      prisma.waitingList.count({ where: { eventId: event.id } }),
    ]);

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
      waitingListCount,
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

export interface GetPublicEventsOptions {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  priceMin?: number;
  priceMax?: number;
  tags?: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getPublicEvents(options: GetPublicEventsOptions = {}) {
  const {
    page = 1,
    limit = 12,
    search = "",
    categoryId,
    location,
    startDate,
    endDate,
    priceMin,
    priceMax,
    tags,
    sortBy = "startDate",
    sortOrder = "asc",
  } = options;

  // Build where clause
  const where: any = {
    status: "PUBLISHED",
    isOnline: false, // Only show in-person events for now
    startDate: {
      gte: new Date(), // Only show future events
    },
  };

  // Add search filter
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
    ];
  }

  // Add category filter
  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Add venue filter
  if (location) {
    where.OR = [
      { venue: { contains: location, mode: "insensitive" } },
      { city: { contains: location, mode: "insensitive" } },
      { address: { contains: location, mode: "insensitive" } },
    ];
  }

  // Add date filters
  if (startDate) {
    where.startDate = { gte: new Date(startDate) };
  }
  if (endDate) {
    if (where.startDate && typeof where.startDate === "object") {
      where.startDate = { ...where.startDate, lte: new Date(endDate) };
    } else {
      where.startDate = { lte: new Date(endDate) };
    }
  }

  // Add price filters
  if (priceMin !== undefined || priceMax !== undefined) {
    where.price = {};
    if (priceMin !== undefined) where.price.gte = priceMin;
    if (priceMax !== undefined) where.price.lte = priceMax;
  }

  // Add tags filter
  if (tags && tags.length > 0) {
    where.tags = { hasSome: tags };
  }

  // Build order by
  const orderBy: any = {};
  if (sortBy && sortOrder) {
    orderBy[sortBy] = sortOrder;
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
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
      orderBy,
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  // Transform events to public format
  const publicEvents = events.map((event) => {
    const now = new Date();
    const registrationStart = event.registrationStartDate || event.createdAt;
    const registrationEnd = event.registrationEndDate || event.startDate;

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
            isActive: true,
            sortOrder: 0,
          }
        : undefined,
      registrationOpen: now >= registrationStart && now <= registrationEnd,
      availableSpots,
      confirmedParticipants,
      waitingListCount: 0, // TODO: Implement waiting list count
      averageRating: undefined,
      canRegister: true,
      canEdit: false,
      canDelete: false,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    } as PublicEvent;
  });

  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: publicEvents,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
}
