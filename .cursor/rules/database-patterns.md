# Database Schema and ORM Patterns

## Overview
This document defines comprehensive patterns for database schema design, Prisma ORM usage, and data management conventions in the GameOne event management system. All database operations should follow consistent patterns for performance, maintainability, and data integrity.

## Schema Design Principles

### Naming Conventions
- **Tables**: PascalCase singular nouns (e.g., `User`, `Event`, `Registration`)
- **Fields**: camelCase (e.g., `firstName`, `createdAt`, `isVerified`)
- **Indexes**: snake_case with descriptive names (e.g., `idx_events_start_date`, `idx_users_email`)
- **Constraints**: descriptive names (e.g., `fk_event_category`, `uk_user_email`)

### Field Standards
- **IDs**: Use `String` with `@id @default(cuid())` for primary keys
- **Timestamps**: Always include `createdAt` and `updatedAt` with `@default(now())` and `@updatedAt`
- **Soft Deletes**: Use `deletedAt DateTime?` instead of hard deletes
- **Metadata**: Use `Json` type for flexible data storage
- **Enums**: Define as Prisma enums for type safety

### Relationship Patterns
- **One-to-Many**: Use explicit foreign keys with proper cascade rules
- **Many-to-Many**: Create explicit junction tables for better control
- **Self-Relations**: Use clear naming for parent/child relationships
- **Optional Relations**: Use `?` for nullable foreign keys

## Current Database Schema Analysis

### Core Models Structure
```prisma
// User Management
model User {
  id              String    @id @default(cuid())
  kindeId         String    @unique
  email           String    @unique
  name            String?
  givenName       String?
  familyName      String?
  picture         String?
  isVerified      Boolean   @default(false)
  phone           String?
  locale          String?
  timezone        String?
  lastActiveAt    DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  profile         Profile?
  userRoles       UserRole[]
  events          Event[]
  registrations   Registration[]
  payments        Payment[]
  videoReactions  VideoReaction[]
  auditLogs       AuditLog[]

  @@map("users")
}

// Role-Based Access Control
model Role {
  id          String     @id @default(cuid())
  name        String     @unique
  description String?
  permissions Json       @default("{}")
  isSystem    Boolean    @default(false)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Relations
  userRoles   UserRole[]

  @@map("roles")
}

model UserRole {
  id        String    @id @default(cuid())
  userId    String
  roleId    String
  assignedAt DateTime @default(now())
  assignedBy String?
  expiresAt  DateTime?
  isActive   Boolean  @default(true)

  // Relations
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@map("user_roles")
}
```

### Event Management Schema
```prisma
model Event {
  id                      String       @id @default(cuid())
  title                   String
  description             String
  shortDescription        String?
  startDate               DateTime
  endDate                 DateTime
  registrationStartDate   DateTime?
  registrationEndDate     DateTime?
  maxParticipants         Int?
  price                   Decimal?     @db.Decimal(10, 2)
  currency                String       @default("EUR")
  location                String?
  status                  EventStatus  @default(DRAFT)
  categoryId              String
  tags                    String[]     @default([])
  isPrivate               Boolean      @default(false)
  requiresApproval        Boolean      @default(false)
  allowGuests             Boolean      @default(false)
  maxGuestsPerRegistration Int         @default(0)
  metadata                Json         @default("{}")
  createdById             String
  createdAt               DateTime     @default(now())
  updatedAt               DateTime     @updatedAt

  // Relations
  category        EventCategory    @relation(fields: [categoryId], references: [id])
  createdBy       User            @relation(fields: [createdById], references: [id])
  registrations   Registration[]
  waitingList     WaitingList[]
  feedback        EventFeedback[]
  documents       EventDocument[]

  @@index([startDate])
  @@index([status, startDate])
  @@index([categoryId])
  @@map("events")
}

enum EventStatus {
  DRAFT
  PUBLISHED
  CANCELLED
  COMPLETED
}
```

## Prisma Client Patterns

### Client Configuration (`src/lib/prisma.ts`)
```typescript
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Extend Prisma Client with custom methods
class ExtendedPrismaClient extends PrismaClient {
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' }
      ],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    // Add logging for database operations
    this.$on('query', (e) => {
      logger.debug('Database Query', {
        query: e.query,
        params: e.params,
        duration: e.duration
      });
    });

    this.$on('error', (e) => {
      logger.error('Database Error', { target: e.target }, e);
    });
  }

  // Soft delete utilities
  async softDelete(model: string, where: any) {
    return (this as any)[model].update({
      where,
      data: { deletedAt: new Date() }
    });
  }

  // Restore soft deleted records
  async restore(model: string, where: any) {
    return (this as any)[model].update({
      where,
      data: { deletedAt: null }
    });
  }

  // Find with soft delete filtering
  async findManyActive(model: string, args: any = {}) {
    return (this as any)[model].findMany({
      ...args,
      where: {
        ...args.where,
        deletedAt: null
      }
    });
  }

  // Transaction with retry logic
  async transactionWithRetry<T>(
    fn: (tx: PrismaClient) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.$transaction(fn);
      } catch (error) {
        if (attempt === maxRetries) throw error;
        
        logger.warn(`Transaction attempt ${attempt} failed, retrying...`, {
          error: error instanceof Error ? error.message : String(error),
          attempt
        });
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
    
    throw new Error('Transaction failed after all retries');
  }
}

// Global instance with connection pooling
declare global {
  // eslint-disable-next-line no-var
  var __prisma: ExtendedPrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new ExtendedPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Connection management
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed', {}, error as Error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Database disconnection failed', {}, error as Error);
  }
}
```

### Repository Pattern Implementation

#### Base Repository (`src/lib/repositories/base-repository.ts`)
```typescript
import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FindManyOptions<T> {
  where?: Partial<T>;
  include?: any;
  select?: any;
  pagination?: PaginationOptions;
  sort?: SortOptions;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  protected model: any;
  protected prisma: PrismaClient;

  constructor(model: any) {
    this.model = model;
    this.prisma = prisma;
  }

  // Create operations
  async create(data: CreateInput): Promise<T> {
    return this.model.create({
      data,
      include: this.getDefaultIncludes()
    });
  }

  async createMany(data: CreateInput[]): Promise<{ count: number }> {
    return this.model.createMany({ data });
  }

  // Read operations
  async findById(id: string, include?: any): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
      include: include || this.getDefaultIncludes()
    });
  }

  async findMany(options: FindManyOptions<T> = {}): Promise<T[]> {
    const { where, include, select, sort } = options;
    
    return this.model.findMany({
      where: {
        ...where,
        deletedAt: null // Filter soft-deleted records
      },
      include: include || this.getDefaultIncludes(),
      select,
      ...(sort && {
        orderBy: { [sort.field]: sort.direction }
      })
    });
  }

  async findManyPaginated(
    options: FindManyOptions<T> = {}
  ): Promise<PaginatedResult<T>> {
    const { where, include, select, pagination = {}, sort } = options;
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, Math.max(1, pagination.limit || 20));
    const offset = pagination.offset ?? (page - 1) * limit;

    const whereClause = {
      ...where,
      deletedAt: null
    };

    const [data, total] = await Promise.all([
      this.model.findMany({
        where: whereClause,
        include: include || this.getDefaultIncludes(),
        select,
        skip: offset,
        take: limit,
        ...(sort && {
          orderBy: { [sort.field]: sort.direction }
        })
      }),
      this.model.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  async findFirst(where: Partial<T>, include?: any): Promise<T | null> {
    return this.model.findFirst({
      where: {
        ...where,
        deletedAt: null
      },
      include: include || this.getDefaultIncludes()
    });
  }

  // Update operations
  async update(id: string, data: UpdateInput): Promise<T> {
    return this.model.update({
      where: { id },
      data,
      include: this.getDefaultIncludes()
    });
  }

  async updateMany(where: Partial<T>, data: Partial<UpdateInput>): Promise<{ count: number }> {
    return this.model.updateMany({
      where,
      data
    });
  }

  // Delete operations
  async delete(id: string): Promise<T> {
    return this.model.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: this.getDefaultIncludes()
    });
  }

  async hardDelete(id: string): Promise<T> {
    return this.model.delete({
      where: { id }
    });
  }

  async restore(id: string): Promise<T> {
    return this.model.update({
      where: { id },
      data: { deletedAt: null },
      include: this.getDefaultIncludes()
    });
  }

  // Utility methods
  async exists(where: Partial<T>): Promise<boolean> {
    const record = await this.model.findFirst({
      where: {
        ...where,
        deletedAt: null
      },
      select: { id: true }
    });
    return !!record;
  }

  async count(where?: Partial<T>): Promise<number> {
    return this.model.count({
      where: {
        ...where,
        deletedAt: null
      }
    });
  }

  // Batch operations
  async createBatch(items: CreateInput[], batchSize: number = 100): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await this.model.createMany({
        data: batch,
        skipDuplicates: true
      });
    }
  }

  // Abstract methods to be implemented by subclasses
  protected abstract getDefaultIncludes(): any;

  // Search functionality (to be overridden for specific search needs)
  async search(query: string, options: FindManyOptions<T> = {}): Promise<T[]> {
    // Default implementation - override in subclasses for specific search logic
    return this.findMany(options);
  }
}
```

#### Event Repository (`src/lib/repositories/event-repository.ts`)
```typescript
import { Event, Prisma } from '@prisma/client';
import { BaseRepository } from './base-repository';
import { prisma } from '@/lib/prisma';

export type EventCreateInput = Prisma.EventCreateInput;
export type EventUpdateInput = Prisma.EventUpdateInput;
export type EventWithRelations = Prisma.EventGetPayload<{
  include: {
    category: true;
    createdBy: { select: { id: true; name: true; email: true } };
    registrations: { select: { id: true; status: true } };
    _count: { select: { registrations: true; waitingList: true } };
  }
}>;

export interface EventFilters {
  status?: string;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  tags?: string[];
  isPrivate?: boolean;
  priceMin?: number;
  priceMax?: number;
  search?: string;
}

export class EventRepository extends BaseRepository<Event, EventCreateInput, EventUpdateInput> {
  constructor() {
    super(prisma.event);
  }

  protected getDefaultIncludes() {
    return {
      category: true,
      createdBy: {
        select: { id: true, name: true, email: true }
      },
      registrations: {
        where: { deletedAt: null },
        select: { id: true, status: true }
      },
      _count: {
        select: {
          registrations: {
            where: { status: 'CONFIRMED', deletedAt: null }
          },
          waitingList: {
            where: { deletedAt: null }
          }
        }
      }
    };
  }

  // Event-specific queries
  async findBySlug(slug: string): Promise<EventWithRelations | null> {
    return this.model.findUnique({
      where: { slug },
      include: this.getDefaultIncludes()
    });
  }

  async findUpcoming(limit: number = 10): Promise<EventWithRelations[]> {
    return this.model.findMany({
      where: {
        startDate: { gte: new Date() },
        status: 'PUBLISHED',
        deletedAt: null
      },
      include: this.getDefaultIncludes(),
      orderBy: { startDate: 'asc' },
      take: limit
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<EventWithRelations[]> {
    return this.model.findMany({
      where: {
        AND: [
          { startDate: { gte: startDate } },
          { endDate: { lte: endDate } },
          { deletedAt: null }
        ]
      },
      include: this.getDefaultIncludes(),
      orderBy: { startDate: 'asc' }
    });
  }

  async findByCategory(categoryId: string): Promise<EventWithRelations[]> {
    return this.model.findMany({
      where: {
        categoryId,
        deletedAt: null
      },
      include: this.getDefaultIncludes(),
      orderBy: { startDate: 'desc' }
    });
  }

  // Advanced filtering
  async findWithFilters(filters: EventFilters): Promise<EventWithRelations[]> {
    const whereClause: Prisma.EventWhereInput = {
      deletedAt: null
    };

    if (filters.status) {
      whereClause.status = filters.status as any;
    }

    if (filters.categoryId) {
      whereClause.categoryId = filters.categoryId;
    }

    if (filters.startDate && filters.endDate) {
      whereClause.AND = [
        { startDate: { gte: filters.startDate } },
        { endDate: { lte: filters.endDate } }
      ];
    } else if (filters.startDate) {
      whereClause.startDate = { gte: filters.startDate };
    } else if (filters.endDate) {
      whereClause.endDate = { lte: filters.endDate };
    }

    if (filters.location) {
      whereClause.location = { contains: filters.location, mode: 'insensitive' };
    }

    if (filters.tags && filters.tags.length > 0) {
      whereClause.tags = { hasSome: filters.tags };
    }

    if (filters.isPrivate !== undefined) {
      whereClause.isPrivate = filters.isPrivate;
    }

    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      whereClause.price = {};
      if (filters.priceMin !== undefined) {
        whereClause.price.gte = filters.priceMin;
      }
      if (filters.priceMax !== undefined) {
        whereClause.price.lte = filters.priceMax;
      }
    }

    if (filters.search) {
      whereClause.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { shortDescription: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return this.model.findMany({
      where: whereClause,
      include: this.getDefaultIncludes(),
      orderBy: { startDate: 'desc' }
    });
  }

  // Registration management
  async getAvailableSpots(eventId: string): Promise<number | null> {
    const event = await this.findById(eventId);
    if (!event || !event.maxParticipants) return null;

    const confirmedRegistrations = await prisma.registration.count({
      where: {
        eventId,
        status: 'CONFIRMED',
        deletedAt: null
      }
    });

    return Math.max(0, event.maxParticipants - confirmedRegistrations);
  }

  async isRegistrationOpen(eventId: string): Promise<boolean> {
    const event = await this.findById(eventId);
    if (!event) return false;

    const now = new Date();
    const registrationStart = event.registrationStartDate || event.createdAt;
    const registrationEnd = event.registrationEndDate || event.startDate;

    return now >= registrationStart && now <= registrationEnd && event.status === 'PUBLISHED';
  }

  // Analytics queries
  async getEventStatistics(eventId: string) {
    const [
      event,
      registrationCount,
      confirmedCount,
      waitingListCount,
      totalRevenue
    ] = await Promise.all([
      this.findById(eventId),
      prisma.registration.count({
        where: { eventId, deletedAt: null }
      }),
      prisma.registration.count({
        where: { eventId, status: 'CONFIRMED', deletedAt: null }
      }),
      prisma.waitingList.count({
        where: { eventId, deletedAt: null }
      }),
      prisma.registration.aggregate({
        where: { eventId, status: 'CONFIRMED', deletedAt: null },
        _sum: { totalAmount: true }
      })
    ]);

    return {
      event,
      registrations: {
        total: registrationCount,
        confirmed: confirmedCount,
        waitingList: waitingListCount
      },
      revenue: totalRevenue._sum.totalAmount || 0,
      availableSpots: await this.getAvailableSpots(eventId)
    };
  }

  // Bulk operations
  async publishEvents(eventIds: string[]): Promise<{ count: number }> {
    return this.model.updateMany({
      where: {
        id: { in: eventIds },
        status: 'DRAFT'
      },
      data: {
        status: 'PUBLISHED',
        updatedAt: new Date()
      }
    });
  }

  async cancelEvents(eventIds: string[], reason?: string): Promise<{ count: number }> {
    return this.model.updateMany({
      where: {
        id: { in: eventIds }
      },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
        ...(reason && {
          metadata: {
            cancellationReason: reason,
            cancelledAt: new Date().toISOString()
          }
        })
      }
    });
  }
}

// Export singleton instance
export const eventRepository = new EventRepository();
```

## Query Optimization Patterns

### Index Strategy
```prisma
model Event {
  // ... fields ...

  // Single field indexes
  @@index([startDate])
  @@index([status])
  @@index([categoryId])
  
  // Composite indexes for common queries
  @@index([status, startDate])
  @@index([categoryId, startDate])
  @@index([isPrivate, status, startDate])
  
  // Full-text search indexes (PostgreSQL specific)
  @@index([title], type: Gin)
  @@index([description], type: Gin)
}

model Registration {
  // ... fields ...

  // Indexes for registration queries
  @@index([eventId, status])
  @@index([userId, status])
  @@index([createdAt])
  @@index([paymentStatus])
}

model User {
  // ... fields ...

  // Unique constraints serve as indexes
  @@unique([email])
  @@unique([kindeId])
  
  // Additional indexes
  @@index([lastActiveAt])
  @@index([isVerified])
}
```

### Query Performance Patterns
```typescript
// Efficient pagination with cursor-based approach
export async function getCursorPaginatedEvents(
  cursor?: string,
  limit: number = 20,
  filters: EventFilters = {}
) {
  const whereClause = buildEventWhereClause(filters);

  return prisma.event.findMany({
    where: whereClause,
    take: limit + 1, // Take one extra to determine if there's a next page
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1 // Skip the cursor
    }),
    include: {
      category: true,
      _count: {
        select: { registrations: true }
      }
    },
    orderBy: { startDate: 'desc' }
  });
}

// Efficient counting with separate queries
export async function getEventCountByStatus() {
  const [draft, published, cancelled, completed] = await Promise.all([
    prisma.event.count({ where: { status: 'DRAFT', deletedAt: null } }),
    prisma.event.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
    prisma.event.count({ where: { status: 'CANCELLED', deletedAt: null } }),
    prisma.event.count({ where: { status: 'COMPLETED', deletedAt: null } })
  ]);

  return { draft, published, cancelled, completed };
}

// Batch loading to avoid N+1 problems
export async function loadEventsWithRegistrations(eventIds: string[]) {
  const [events, registrations] = await Promise.all([
    prisma.event.findMany({
      where: { id: { in: eventIds } },
      include: { category: true }
    }),
    prisma.registration.findMany({
      where: { eventId: { in: eventIds }, deletedAt: null },
      include: { user: { select: { id: true, name: true, email: true } } }
    })
  ]);

  // Group registrations by event
  const registrationsByEvent = registrations.reduce((acc, reg) => {
    if (!acc[reg.eventId]) acc[reg.eventId] = [];
    acc[reg.eventId].push(reg);
    return acc;
  }, {} as Record<string, any[]>);

  // Combine data
  return events.map(event => ({
    ...event,
    registrations: registrationsByEvent[event.id] || []
  }));
}
```

## Transaction Patterns

### Complex Business Logic Transactions
```typescript
// Event registration with payment processing
export async function createEventRegistration(
  userId: string,
  eventId: string,
  registrationData: CreateRegistrationInput
): Promise<RegistrationWithPayment> {
  return prisma.transactionWithRetry(async (tx) => {
    // 1. Check event availability
    const event = await tx.event.findUnique({
      where: { id: eventId },
      include: { registrations: { where: { status: 'CONFIRMED' } } }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.maxParticipants) {
      const confirmedCount = event.registrations.length;
      if (confirmedCount >= event.maxParticipants) {
        throw new Error('Event is full');
      }
    }

    // 2. Create registration
    const registration = await tx.registration.create({
      data: {
        userId,
        eventId,
        ...registrationData,
        status: event.requiresApproval ? 'PENDING' : 'CONFIRMED'
      }
    });

    // 3. Create payment if required
    let payment = null;
    if (event.price && event.price > 0) {
      payment = await tx.payment.create({
        data: {
          userId,
          registrationId: registration.id,
          amount: event.price,
          currency: event.currency,
          status: 'PENDING',
          method: registrationData.paymentMethod || 'BANK_TRANSFER'
        }
      });
    }

    // 4. Create audit log
    await tx.auditLog.create({
      data: {
        action: 'REGISTRATION_CREATED',
        entityType: 'Registration',
        entityId: registration.id,
        userId,
        metadata: {
          eventId,
          paymentId: payment?.id,
          requiresApproval: event.requiresApproval
        }
      }
    });

    // 5. Update registration count cache (if using cache)
    // This would be handled by a cache invalidation service

    return {
      registration,
      payment
    };
  });
}

// Batch event creation with validation
export async function createEventsFromImport(
  events: CreateEventInput[],
  userId: string
): Promise<{ created: Event[]; errors: string[] }> {
  const created: Event[] = [];
  const errors: string[] = [];

  // Process in batches to avoid transaction timeouts
  const batchSize = 10;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    
    await prisma.transactionWithRetry(async (tx) => {
      for (const eventData of batch) {
        try {
          // Validate category exists
          const category = await tx.eventCategory.findUnique({
            where: { id: eventData.categoryId }
          });

          if (!category) {
            errors.push(`Invalid category for event: ${eventData.title}`);
            continue;
          }

          // Create event
          const event = await tx.event.create({
            data: {
              ...eventData,
              createdById: userId
            }
          });

          created.push(event);

          // Create audit log
          await tx.auditLog.create({
            data: {
              action: 'EVENT_CREATED',
              entityType: 'Event',
              entityId: event.id,
              userId,
              metadata: { source: 'import', batchIndex: i }
            }
          });

        } catch (error) {
          errors.push(`Failed to create event "${eventData.title}": ${error.message}`);
        }
      }
    });
  }

  return { created, errors };
}
```

## Data Migration Patterns

### Schema Migrations
```typescript
// Example migration for adding new fields
export async function migrateAddEventMetadata() {
  console.log('Starting metadata migration...');

  const events = await prisma.event.findMany({
    where: { metadata: {} }
  });

  console.log(`Found ${events.length} events to migrate`);

  const batchSize = 100;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    
    await prisma.transactionWithRetry(async (tx) => {
      for (const event of batch) {
        await tx.event.update({
          where: { id: event.id },
          data: {
            metadata: {
              version: '1.0',
              migrated: true,
              migratedAt: new Date().toISOString(),
              // Preserve existing metadata
              ...event.metadata as any
            }
          }
        });
      }
    });

    console.log(`Migrated ${Math.min(i + batchSize, events.length)} of ${events.length} events`);
  }

  console.log('Migration completed successfully');
}

// Data cleanup migration
export async function cleanupOrphanedRecords() {
  console.log('Starting orphaned records cleanup...');

  // Clean up registrations for deleted events
  const orphanedRegistrations = await prisma.registration.findMany({
    where: {
      event: null
    },
    select: { id: true }
  });

  if (orphanedRegistrations.length > 0) {
    await prisma.registration.updateMany({
      where: {
        id: { in: orphanedRegistrations.map(r => r.id) }
      },
      data: { deletedAt: new Date() }
    });
    console.log(`Cleaned up ${orphanedRegistrations.length} orphaned registrations`);
  }

  // Clean up payments without registrations
  const orphanedPayments = await prisma.payment.findMany({
    where: {
      registration: null
    },
    select: { id: true }
  });

  if (orphanedPayments.length > 0) {
    await prisma.payment.updateMany({
      where: {
        id: { in: orphanedPayments.map(p => p.id) }
      },
      data: { deletedAt: new Date() }
    });
    console.log(`Cleaned up ${orphanedPayments.length} orphaned payments`);
  }

  console.log('Cleanup completed successfully');
}
```

## Testing Patterns

### Database Testing Setup
```typescript
// src/lib/testing/database.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL
    }
  }
});

// Setup test database
export async function setupTestDatabase() {
  // Reset database
  await testPrisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE');
  await testPrisma.$executeRawUnsafe('CREATE SCHEMA public');
  
  // Run migrations
  execSync('npx prisma db push --force-reset', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
  });
  
  await testPrisma.$connect();
}

// Clean test database
export async function cleanTestDatabase() {
  const tablenames = await testPrisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }
}

// Teardown test database
export async function teardownTestDatabase() {
  await testPrisma.$disconnect();
}

export { testPrisma };
```

### Repository Testing
```typescript
// __tests__/repositories/event-repository.test.ts
import { eventRepository } from '@/lib/repositories/event-repository';
import { setupTestDatabase, cleanTestDatabase, teardownTestDatabase } from '@/lib/testing/database';
import { createMockEvent, createMockUser, createMockEventCategory } from '@/lib/testing/mocks';

describe('EventRepository', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanTestDatabase();
  });

  describe('create', () => {
    it('should create an event with all required fields', async () => {
      const user = await testPrisma.user.create({ data: createMockUser() });
      const category = await testPrisma.eventCategory.create({ data: createMockEventCategory() });
      
      const eventData = {
        ...createMockEvent(),
        categoryId: category.id,
        createdById: user.id
      };

      const event = await eventRepository.create(eventData);

      expect(event).toBeDefined();
      expect(event.title).toBe(eventData.title);
      expect(event.categoryId).toBe(category.id);
      expect(event.createdById).toBe(user.id);
    });
  });

  describe('findWithFilters', () => {
    it('should filter events by status', async () => {
      const user = await testPrisma.user.create({ data: createMockUser() });
      const category = await testPrisma.eventCategory.create({ data: createMockEventCategory() });
      
      await Promise.all([
        eventRepository.create({ ...createMockEvent({ status: 'PUBLISHED' }), categoryId: category.id, createdById: user.id }),
        eventRepository.create({ ...createMockEvent({ status: 'DRAFT' }), categoryId: category.id, createdById: user.id })
      ]);

      const publishedEvents = await eventRepository.findWithFilters({ status: 'PUBLISHED' });
      const draftEvents = await eventRepository.findWithFilters({ status: 'DRAFT' });

      expect(publishedEvents).toHaveLength(1);
      expect(draftEvents).toHaveLength(1);
      expect(publishedEvents[0].status).toBe('PUBLISHED');
      expect(draftEvents[0].status).toBe('DRAFT');
    });
  });

  describe('getAvailableSpots', () => {
    it('should calculate available spots correctly', async () => {
      const user = await testPrisma.user.create({ data: createMockUser() });
      const category = await testPrisma.eventCategory.create({ data: createMockEventCategory() });
      
      const event = await eventRepository.create({
        ...createMockEvent({ maxParticipants: 10 }),
        categoryId: category.id,
        createdById: user.id
      });

      // Create some confirmed registrations
      await Promise.all([
        testPrisma.registration.create({
          data: { eventId: event.id, userId: user.id, status: 'CONFIRMED', numberOfGuests: 0 }
        }),
        testPrisma.registration.create({
          data: { eventId: event.id, userId: user.id, status: 'CONFIRMED', numberOfGuests: 2 }
        })
      ]);

      const availableSpots = await eventRepository.getAvailableSpots(event.id);
      expect(availableSpots).toBe(8); // 10 - 2 registrations
    });
  });
});
```

This comprehensive database pattern documentation provides a solid foundation for maintaining consistent, performant, and reliable database operations in the GameOne application.