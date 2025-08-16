import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { EventStatus, EventType, RegistrationStatus, AuditAction } from "@prisma/client";
import type { Event } from "@prisma/client";

export interface CreateEventRequest {
  title: string;
  description?: string;
  type: EventType;
  startDate: string;
  capacity: number;
  requiresApproval: boolean;
  allowWaitingList: boolean;
  isOnline: boolean;
  requiresPayment: boolean;
  tags: string[];
}

export interface GetEventsQuery {
  page?: number;
  limit?: number;
  status?: EventStatus;
  type?: EventType;
  search?: string;
  creatorId?: string;
}

export interface GetEventsResponse {
  events: Event[];
  total: number;
  page: number;
  totalPages: number;
}

export interface EventAnalyticsResponse {
  registrationStats: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    waitingList: number;
  };
  paymentStats: {
    totalRevenue: number;
    paidCount: number;
    pendingCount: number;
    completionRate: number;
  };
  timeline: Array<{
    date: string;
    registrations: number;
    payments: number;
  }>;
  demographics: {
    registrationTypes: Record<string, number>;
    sources: Record<string, number>;
  };
}

export class EventService {
  async createEvent(data: CreateEventRequest, creatorId: string): Promise<Event> {
    return await prisma.$transaction(async (tx) => {
      const slug = await this.generateUniqueSlug(data.title, tx);

      const event = await tx.event.create({
        data: {
          title: data.title,
          slug,
          description: data.description || null,
          type: data.type,
          status: EventStatus.DRAFT,
          capacity: data.capacity,
          startDate: new Date(data.startDate),
          isOnline: data.isOnline,
          requiresApproval: data.requiresApproval,
          allowWaitingList: data.allowWaitingList,
          requiresPayment: data.requiresPayment,
          tags: data.tags,
          creatorId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: creatorId,
          action: AuditAction.CREATE,
          resource: "events",
          resourceId: event.id,
          newData: event,
          description: `Created event: ${event.title}`,
        },
      });

      logger.info(`Event created: ${event.id} by user ${creatorId}`);
      return event;
    });
  }

  async updateEvent(
    id: string,
    data: Partial<CreateEventRequest>,
    userId: string
  ): Promise<{ event: Event; warnings: string[] }> {
    return await prisma.$transaction(async (tx) => {
      const existingEvent = await tx.event.findUnique({
        where: { id },
        include: {
          registrations: {
            where: { status: RegistrationStatus.CONFIRMED },
          },
        },
      });

      if (!existingEvent) {
        throw new Error("Event not found");
      }

      if (existingEvent.creatorId !== userId) {
        throw new Error("Unauthorized");
      }

      const warnings: string[] = [];

      if (data.capacity && data.capacity < existingEvent.registrations.length) {
        warnings.push(
          `New capacity (${data.capacity}) is less than current confirmed registrations (${existingEvent.registrations.length})`
        );
      }

      const updatedEvent = await tx.event.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.description !== undefined && { description: data.description || null }),
          ...(data.type && { type: data.type }),
          ...(data.capacity && { capacity: data.capacity }),
          ...(data.startDate && { startDate: new Date(data.startDate) }),
          ...(data.requiresApproval !== undefined && { requiresApproval: data.requiresApproval }),
          ...(data.allowWaitingList !== undefined && { allowWaitingList: data.allowWaitingList }),
          ...(data.isOnline !== undefined && { isOnline: data.isOnline }),
          ...(data.requiresPayment !== undefined && { requiresPayment: data.requiresPayment }),
          ...(data.tags && { tags: data.tags }),
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.UPDATE,
          resource: "events",
          resourceId: id,
          oldData: existingEvent,
          newData: updatedEvent,
          description: `Updated event: ${updatedEvent.title}`,
        },
      });

      logger.info(`Event updated: ${id} by user ${userId}`);
      return { event: updatedEvent, warnings };
    });
  }

  async deleteEvent(id: string, userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const existingEvent = await tx.event.findUnique({
        where: { id },
        include: {
          registrations: {
            where: { status: RegistrationStatus.CONFIRMED },
          },
        },
      });

      if (!existingEvent) {
        throw new Error("Event not found");
      }

      if (existingEvent.creatorId !== userId) {
        throw new Error("Unauthorized");
      }

      if (existingEvent.registrations.length > 0) {
        throw new Error(
          `Cannot delete event with confirmed registrations. Please cancel the event instead.`
        );
      }

      await tx.event.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.DELETE,
          resource: "events",
          resourceId: id,
          oldData: existingEvent,
          description: `Deleted event: ${existingEvent.title}`,
        },
      });

      logger.info(`Event deleted: ${id} by user ${userId}`);
    });
  }

  async getEvents(query: GetEventsQuery): Promise<GetEventsResponse> {
    const { page = 1, limit = 10, status, type, search, creatorId } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (creatorId) {
      where.creatorId = creatorId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: "desc" },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              registrations: {
                where: { status: RegistrationStatus.CONFIRMED },
              },
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      events,
      total,
      page,
      totalPages,
    };
  }

  async getEventById(id: string): Promise<Event | null> {
    return await prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            registrations: {
              where: { status: RegistrationStatus.CONFIRMED },
            },
          },
        },
      },
    });
  }

  async getEventAnalytics(eventId: string, userId: string): Promise<EventAnalyticsResponse> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { creatorId: true },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    if (event.creatorId !== userId) {
      throw new Error("Unauthorized");
    }

    const registrationStats = await prisma.registration.groupBy({
      by: ["status"],
      where: { eventId },
      _count: { status: true },
    });

    const waitingListCount = await prisma.waitingList.count({
      where: { eventId },
    });

    const regStats = {
      total: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      waitingList: waitingListCount,
    };

    registrationStats.forEach((stat) => {
      regStats.total += stat._count.status;
      switch (stat.status) {
        case RegistrationStatus.CONFIRMED:
          regStats.confirmed = stat._count.status;
          break;
        case RegistrationStatus.PENDING:
          regStats.pending = stat._count.status;
          break;
        case RegistrationStatus.CANCELLED:
          regStats.cancelled = stat._count.status;
          break;
      }
    });

    return {
      registrationStats: regStats,
      paymentStats: {
        totalRevenue: 0,
        paidCount: 0,
        pendingCount: 0,
        completionRate: 0,
      },
      timeline: [],
      demographics: {
        registrationTypes: {},
        sources: {},
      },
    };
  }

  private async generateUniqueSlug(title: string, tx?: any): Promise<string> {
    const client = tx || prisma;

    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    if (!baseSlug) {
      baseSlug = "event";
    }

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await client.event.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
