/**
 * Events business logic service for GameOne
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { eventCreationSchema } from "@/lib/validation/event-creation";

/**
 * Create slug from title
 */
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Events service class
 */
export class EventsService {
  /**
   * Get events with filtering and pagination for a specific user
   */
  async getEvents(request: NextRequest, userId: string) {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;

    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const city = searchParams.get("city");
    const requiresPayment = searchParams.get("requiresPayment");
    const sortBy = searchParams.get("sortBy") || "startDate";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Build where clause - only show user's own events
    const where: any = {
      creatorId: userId, // Only show events created by this user
    };

    if (status) where.status = status;
    if (type) where.type = type;
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (requiresPayment) where.requiresPayment = requiresPayment === "true";

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get events with related data
    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          manager: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              registrations: {
                where: {
                  status: { in: ["CONFIRMED", "PENDING"] },
                },
              },
              waitingList: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    // Transform events for response
    const transformedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      slug: event.slug,
      type: event.type,
      status: event.status,
      startDate: event.startDate,
      endDate: event.endDate,
      capacity: event.capacity,
      price: event.price,
      currency: event.currency,
      venue: event.venue,
      city: event.city,
      isOnline: event.isOnline,
      registrationCount: event._count.registrations,
      waitingListCount: event._count.waitingList,
      availableSpots: Math.max(0, event.capacity - event._count.registrations),
      isRegistrationOpen: new Date() <= (event.registrationEndDate || event.startDate),
      isPastEvent: new Date() > event.startDate,
      creatorName: event.creator.name || event.creator.email,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }));

    return {
      events: transformedEvents,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + events.length < totalCount,
      },
    };
  }

  /**
   * Create new event
   */
  async createEvent(data: any, userId: string) {
    // Validate request body
    const validation = eventCreationSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
        status: 400,
      };
    }

    const validatedData = validation.data;

    // Create unique slug
    let slug = createSlug(validatedData.title);
    const existingSlug = await prisma.event.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        title: validatedData.title,
        slug,
        description: validatedData.description ?? null,
        shortDescription: null, // Not used in simplified form
        type: validatedData.type as any, // Convert to EventType
        status: validatedData.status || data.status || "DRAFT",
        capacity: validatedData.capacity,
        price: validatedData.price ?? null,
        currency: validatedData.currency ?? "CZK",
        startDate: validatedData.startDate,
        endDate: validatedData.endDate ?? null,
        timezone: validatedData.timezone ?? "Europe/Prague",
        venue: validatedData.venue ?? null,
        address: null, // Not used in simplified form
        city: null, // Not used in simplified form
        country: validatedData.country ?? "Czech Republic",
        isOnline: validatedData.isOnline ?? false,
        onlineUrl: null, // Not used in simplified form
        registrationStartDate: null, // Not used in simplified form
        registrationEndDate: null, // Not used in simplified form
        requiresApproval: validatedData.requiresApproval ?? false,
        allowWaitingList: validatedData.allowWaitingList ?? true,
        maxWaitingList: null, // Not used in simplified form
        requiresPayment: validatedData.requiresPayment ?? false,
        bankAccountId: validatedData.bankAccountId ?? null,
        tags: validatedData.tags ?? [],
        imageUrl: null, // Not used in simplified form
        websiteUrl: null, // Not used in simplified form
        creatorId: userId,
      },
    });

    return {
      success: true,
      data: {
        success: true,
        event: {
          id: event.id,
          title: event.title,
          slug: event.slug,
          status: event.status,
        },
        message: "Event created successfully",
      },
    };
  }
}

export const eventsService = new EventsService();
