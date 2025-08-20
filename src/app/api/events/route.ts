import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import { prisma } from "@/lib/prisma";
import { eventCreationSchema } from "@/lib/validation/event-creation";

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
  });
}

// Create slug from title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET /api/events - List events with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get user from database, create if doesn't exist
    let dbUser = await prisma.user.findUnique({
      where: { kindeId: user.id },
    });

    if (!dbUser) {
      // Create user if they don't exist in database with defaults
      dbUser = await createUserWithDefaults(user);
    }

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
      creatorId: dbUser.id, // Only show events created by this user
    };

    if (status) where.status = status;
    if (type) where.type = type;
    // Note: creatorId filter ignored since we only show user's own events
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

    return NextResponse.json({
      events: transformedEvents,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + events.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Events fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get user from database, create if doesn't exist
    let dbUser = await prisma.user.findUnique({
      where: { kindeId: user.id },
    });

    if (!dbUser) {
      // Create user if they don't exist in database with defaults
      dbUser = await createUserWithDefaults(user);
    }

    const body = await request.json();

    // Validate request body
    const validation = eventCreationSchema.safeParse(body);
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

    // Create unique slug
    let slug = createSlug(data.title);
    const existingSlug = await prisma.event.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        title: data.title,
        slug,
        description: data.description ?? null,
        shortDescription: null, // Not used in simplified form
        type: data.type as any, // Convert to EventType
        status: data.status || body.status || "DRAFT",
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
        creatorId: dbUser.id,
      },
    });

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        status: event.status,
      },
      message: "Event created successfully",
    });
  } catch (error) {
    console.error("Event creation error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
