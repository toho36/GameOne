import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');
    const location = searchParams.get('location');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const tags = searchParams.get('tags')?.split(',') || [];
    const sortBy = searchParams.get('sortBy') || 'startDate';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build where clause
    const where: Prisma.EventWhereInput = {
      status: 'PUBLISHED',
      isOnline: false, // Only show in-person events for now
      startDate: {
        gte: new Date() // Only show future events
      }
    };

    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Add category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Add venue filter
    if (location) {
      where.OR = [
        { venue: { contains: location, mode: 'insensitive' } },
        { city: { contains: location, mode: 'insensitive' } },
        { address: { contains: location, mode: 'insensitive' } }
      ];
    }

    // Add date filters
    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }
    if (endDate) {
      if (where.startDate && typeof where.startDate === 'object') {
        where.startDate = { ...where.startDate, lte: new Date(endDate) };
      } else {
        where.startDate = { lte: new Date(endDate) };
      }
    }

    // Add price filters
    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {};
      if (priceMin !== undefined && priceMin !== null) where.price.gte = parseFloat(priceMin);
      if (priceMax !== undefined && priceMax !== null) where.price.lte = parseFloat(priceMax);
    }

    // Add tags filter
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    // Build order by
    const orderBy: Prisma.EventOrderByWithRelationInput = {};
    if (sortBy && sortOrder) {
      orderBy[sortBy as keyof Prisma.EventOrderByWithRelationInput] = sortOrder as 'asc' | 'desc';
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
              color: true
            }
          },
          registrations: {
            where: { status: 'CONFIRMED' },
            select: { id: true }
          },
          _count: {
            select: {
              registrations: {
                where: { status: 'CONFIRMED' }
              }
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.event.count({ where })
    ]);

    // Transform events to public format
    const publicEvents = events.map(event => {
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
        description: event.description,
        shortDescription: event.shortDescription,
        startDate: event.startDate,
        endDate: event.endDate,
        registrationStartDate: event.registrationStartDate,
        registrationEndDate: event.registrationEndDate,
        maxParticipants: event.capacity,
        price: event.price ? parseFloat(event.price.toString()) : undefined,
        currency: event.currency,
        location: event.venue || event.city || event.address,
        status: event.status,
        tags: event.tags,
        isPrivate: false, // Public API endpoint
        requiresApproval: event.requiresApproval,
        allowGuests: true, // Default to true for public events
        maxGuestsPerRegistration: 5, // Default value
        category: event.category,
        registrationOpen: now >= registrationStart && now <= registrationEnd,
        availableSpots,
        confirmedParticipants,
        waitingListCount: 0, // TODO: Implement waiting list count
        averageRating: undefined, // TODO: Implement rating system
        canRegister: true, // TODO: Implement permission checking
        canEdit: false, // Public users can't edit events
        canDelete: false // Public users can't delete events
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      success: true,
      data: publicEvents,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: '1.0.0'
      }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch events';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
