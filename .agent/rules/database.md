---
alwaysApply: true
---

database Development

## File Organization & Structure

### Schema Files

- Keep Prisma schema in `prisma/schema.prisma`
- Use descriptive model names in PascalCase: `User`, `EventRegistration`
- Group related models together in the schema file
- Use consistent naming conventions for fields and relations
- Add comments to document complex relationships and business rules

### Migration Files

- Place migrations in `prisma/migrations/`
- Use descriptive migration names: `add_user_profile_fields`
- Include both up and down migrations when possible
- Test migrations on development data before production

### Database Utilities

- Place database utilities in `src/lib/`
- Create separate files for different concerns: `prisma.ts`, `migrations.ts`
- Use TypeScript for all database-related code
- Export reusable database functions and types

## Schema Design Standards

### Model Structure

```prisma
// Standard model pattern
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  posts     Post[]
  profile   Profile?

  // Indexes for performance
  @@index([email])
  @@index([createdAt])
  @@map("users")
}
```

### Relationship Patterns

```prisma
// One-to-many relationship
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Foreign key with cascade delete
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  // Indexes for foreign keys
  @@index([authorId])
  @@index([published, createdAt])
  @@map("posts")
}

// Many-to-many relationship
model Event {
  id          String   @id @default(cuid())
  title       String
  description String?
  startDate   DateTime
  endDate     DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Many-to-many through junction table
  registrations EventRegistration[]
  @@map("events")
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Many-to-many through junction table
  registrations EventRegistration[]
  @@map("users")
}

model EventRegistration {
  id        String   @id @default(cuid())
  status    String   @default("pending") // pending, confirmed, cancelled
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Foreign keys
  userId  String
  eventId String

  // Relations
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

  // Unique constraint to prevent duplicate registrations
  @@unique([userId, eventId])
  @@index([userId])
  @@index([eventId])
  @@index([status])
  @@map("event_registrations")
}
```

### Field Types and Constraints

```prisma
model Example {
  id          String   @id @default(cuid())

  // String fields with constraints
  title       String   @db.VarChar(255)
  description String?  @db.Text
  email       String   @unique @db.VarChar(100)

  // Numeric fields
  price       Decimal  @db.Decimal(10, 2)
  quantity    Int      @default(0)

  // Boolean fields
  isActive    Boolean  @default(true)

  // Date fields
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  publishedAt DateTime?

  // JSON fields for flexible data
  metadata    Json?

  // Enum fields
  status      Status   @default(PENDING)

  @@map("examples")
}

enum Status {
  PENDING
  ACTIVE
  INACTIVE
  DELETED
}
```

## Query Optimization Patterns

### Efficient Query Patterns

```typescript
// Repository pattern for database operations
export class UserRepository {
  // Select only needed fields
  async findUserBasicInfo(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });
  }

  // Include related data efficiently
  async findUserWithPosts(userId: string, limit: number = 10) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        posts: {
          select: {
            id: true,
            title: true,
            published: true,
            createdAt: true
          },
          where: { published: true },
          orderBy: { createdAt: 'desc' },
          take: limit
        }
      }
    });
  }

  // Paginated queries with count
  async findUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      }),
      prisma.user.count()
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Complex queries with multiple conditions
  async findActiveUsersWithPosts(minPosts: number = 1) {
    return prisma.user.findMany({
      where: {
        isActive: true,
        posts: {
          some: {
            published: true
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            posts: {
              where: { published: true }
            }
          }
        }
      },
      having: {
        posts: {
          _count: {
            gte: minPosts
          }
        }
      },
      orderBy: {
        posts: {
          _count: 'desc'
        }
      }
    });
  }
}
```

### Transaction Patterns

```typescript
// Complex operations with transactions
export class EventService {
  async registerUserForEvent(userId: string, eventId: string) {
    return prisma.$transaction(async (tx) => {
      // Check if event exists and has capacity
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          maxRegistrations: true,
          _count: {
            select: {
              registrations: {
                where: { status: 'confirmed' }
              }
            }
          }
        }
      });

      if (!event) {
        throw new Error('Event not found');
      }

      if (event._count.registrations >= event.maxRegistrations) {
        throw new Error('Event is full');
      }

      // Check if user is already registered
      const existingRegistration = await tx.eventRegistration.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId
          }
        }
      });

      if (existingRegistration) {
        throw new Error('User already registered for this event');
      }

      // Create registration
      const registration = await tx.eventRegistration.create({
        data: {
          userId,
          eventId,
          status: 'confirmed'
        }
      });

      return registration;
    });
  }

  async cancelRegistration(userId: string, eventId: string) {
    return prisma.$transaction(async (tx) => {
      const registration = await tx.eventRegistration.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId
          }
        }
      });

      if (!registration) {
        throw new Error('Registration not found');
      }

      if (registration.status === 'cancelled') {
        throw new Error('Registration already cancelled');
      }

      return tx.eventRegistration.update({
        where: { id: registration.id },
        data: { status: 'cancelled' }
      });
    });
  }
}
```

## Migration Management

### Safe Migration Patterns

```typescript
// Migration utilities
export class MigrationManager {
  async addColumnSafely(tableName: string, columnName: string, columnDef: string) {
    // Step 1: Add column as nullable
    await prisma.$executeRawUnsafe(`
      ALTER TABLE ${tableName}
      ADD COLUMN ${columnName} ${columnDef};
    `);

    // Step 2: Update existing records with default value
    await prisma.$executeRawUnsafe(`
      UPDATE ${tableName}
      SET ${columnName} = 'default_value'
      WHERE ${columnName} IS NULL;
    `);

    // Step 3: Make column not nullable
    await prisma.$executeRawUnsafe(`
      ALTER TABLE ${tableName}
      ALTER COLUMN ${columnName} SET NOT NULL;
    `);
  }

  async addIndexSafely(tableName: string, indexName: string, columns: string[]) {
    const columnsList = columns.join(', ');

    await prisma.$executeRawUnsafe(`
      CREATE INDEX CONCURRENTLY ${indexName}
      ON ${tableName} (${columnsList});
    `);
  }

  async dropIndexSafely(indexName: string) {
    await prisma.$executeRawUnsafe(`
      DROP INDEX CONCURRENTLY IF EXISTS ${indexName};
    `);
  }
}
```

### Data Migration Patterns

```typescript
// Data transformation utilities
export class DataMigrationService {
  async migrateUserData() {
    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: '@olddomain.com'
        }
      }
    });

    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: user.email.replace('@olddomain.com', '@newdomain.com'),
          updatedAt: new Date()
        }
      });
    }
  }

  async cleanupOrphanedRecords() {
    // Delete registrations for non-existent events
    await prisma.eventRegistration.deleteMany({
      where: {
        event: null
      }
    });

    // Delete registrations for non-existent users
    await prisma.eventRegistration.deleteMany({
      where: {
        user: null
      }
    });
  }
}
```

## Performance Optimization

### Indexing Strategies

```sql
-- Single column indexes for frequent WHERE clauses
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_events_start_date ON events(start_date);

-- Composite indexes for multi-column queries
CREATE INDEX CONCURRENTLY idx_posts_author_published ON posts(author_id, published);
CREATE INDEX CONCURRENTLY idx_registrations_user_status ON event_registrations(user_id, status);

-- Partial indexes for filtered queries
CREATE INDEX CONCURRENTLY idx_active_users ON users(id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_published_posts ON posts(id) WHERE published = true;

-- Text search indexes
CREATE INDEX CONCURRENTLY idx_posts_title_search ON posts USING gin(to_tsvector('english', title));
CREATE INDEX CONCURRENTLY idx_events_description_search ON events USING gin(to_tsvector('english', description));
```

### Query Performance Monitoring

```typescript
// Performance monitoring middleware
export const performanceMiddleware: Prisma.Middleware = async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const end = Date.now();

  const duration = end - start;

  // Log slow queries
  if (duration > 1000) {
    console.warn(`Slow query detected: ${params.model}.${params.action} - ${duration}ms`);
    console.warn(`Query:`, params);
  }

  // Log all queries in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`${params.model}.${params.action} - ${duration}ms`);
  }

  return result;
};

// Apply middleware to Prisma client
prisma.$use(performanceMiddleware);
```

### Connection Pooling

```typescript
// Prisma client with connection pooling
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// For serverless environments
export const prismaEdge = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=1&pool_timeout=20'
    }
  }
});
```

## Security Implementation

### Row-Level Security

```sql
-- Enable RLS for sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for data access
CREATE POLICY user_own_data ON users
  USING (auth.uid() = id);

CREATE POLICY user_own_registrations ON event_registrations
  USING (auth.uid() = user_id);

CREATE POLICY public_events ON events
  FOR SELECT
  USING (published = true);
```

### Data Encryption

```typescript
// Sensitive data encryption utilities
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ALGORITHM = 'aes-256-gcm';

export class EncryptionService {
  static encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  static decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// Usage in Prisma operations
export async function createUserWithEncryptedData(data: CreateUserInput) {
  return prisma.user.create({
    data: {
      ...data,
      email: data.email.toLowerCase(),
      // Encrypt sensitive fields
      ssn: data.ssn ? EncryptionService.encrypt(data.ssn) : null,
      phone: data.phone ? EncryptionService.encrypt(data.phone) : null
    }
  });
}
```

### Audit Trails

```prisma
// Audit trail model
model AuditLog {
  id        String   @id @default(cuid())
  table     String
  recordId  String
  action    String   // CREATE, UPDATE, DELETE
  oldData   Json?
  newData   Json?
  userId    String?
  timestamp DateTime @default(now())

  @@index([table, recordId])
  @@index([userId, timestamp])
  @@map("audit_logs")
}
```

```typescript
// Audit trail middleware
export const auditMiddleware: Prisma.Middleware = async (params, next) => {
  const result = await next(params);

  if (['create', 'update', 'delete'].includes(params.action)) {
    await prisma.auditLog.create({
      data: {
        table: params.model,
        recordId: params.action === 'create' ? result.id : params.args.where?.id,
        action: params.action.toUpperCase(),
        oldData: params.action === 'update' ? params.args.data : null,
        newData: ['create', 'update'].includes(params.action) ? result : null,
        userId: getCurrentUserId() // Implement based on your auth system
      }
    });
  }

  return result;
};

prisma.$use(auditMiddleware);
```

## Backup & Recovery

### Automated Backup Script

```bash
#!/bin/bash
# backup-database.sh

export PGPASSWORD=$DATABASE_PASSWORD
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

# Create backup
pg_dump -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME \
  --no-owner --no-privileges --clean --if-exists \
  > "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress backup
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Recovery Utilities

```typescript
// Database recovery utilities
export class RecoveryService {
  async createRestorePoint(label: string) {
    const result = await prisma.$queryRaw`
      SELECT pg_create_restore_point(${label})
    `;

    return result;
  }

  async getWALPosition() {
    const result = await prisma.$queryRaw`
      SELECT pg_current_wal_lsn()
    `;

    return result;
  }

  async checkDatabaseHealth() {
    const [
      userCount,
      activeConnections,
      slowQueries
    ] = await Promise.all([
      prisma.user.count(),
      prisma.$queryRaw`SELECT count(*) FROM pg_stat_activity`,
      prisma.$queryRaw`
        SELECT query, mean_time, calls
        FROM pg_stat_statements
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 10
      `
    ]);

    return {
      userCount,
      activeConnections,
      slowQueries,
      timestamp: new Date()
    };
  }
}
```

## File Templates

### Model Template

```prisma
model ModelName {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Add your fields here
  name      String
  description String?

  // Add relationships here
  // relatedModel RelatedModel[]

  // Add indexes here
  @@index([name])
  @@map("model_names")
}
```

### Repository Template

```typescript
export class ModelNameRepository {
  async findById(id: string) {
    return prisma.modelName.findUnique({
      where: { id }
    });
  }

  async findMany(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.modelName.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.modelName.count()
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async create(data: CreateModelNameInput) {
    return prisma.modelName.create({
      data
    });
  }

  async update(id: string, data: UpdateModelNameInput) {
    return prisma.modelName.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.modelName.delete({
      where: { id }
    });
  }
}
```

## Development Workflow

### Before Creating New Code

1. Check existing schema for similar patterns
2. Plan the data model and relationships
3. Consider indexing strategy for performance
4. Think about data validation and constraints
5. Plan migration strategy for schema changes

### Code Review Checklist

- [ ] Schema follows naming conventions
- [ ] Proper indexes are defined
- [ ] Relationships are correctly modeled
- [ ] Data validation is implemented
- [ ] Performance considerations are addressed
- [ ] Security measures are in place
- [ ] Migration strategy is planned
- [ ] Backup and recovery procedures are documented
- [ ] Code follows established patterns

## Common Patterns

### Soft Delete Pattern

```prisma
model SoftDeleteExample {
  id        String   @id @default(cuid())
  name      String
  deletedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([deletedAt])
  @@map("soft_delete_examples")
}
```

```typescript
// Soft delete repository methods
export class SoftDeleteRepository {
  async findActive() {
    return prisma.softDeleteExample.findMany({
      where: {
        deletedAt: null
      }
    });
  }

  async softDelete(id: string) {
    return prisma.softDeleteExample.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async restore(id: string) {
    return prisma.softDeleteExample.update({
      where: { id },
      data: { deletedAt: null }
    });
  }
}
```

### Polymorphic Relationships

```prisma
model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Polymorphic relationship
  commentableType String // 'Post' or 'Event'
  commentableId   String

  @@unique([commentableType, commentableId, id])
  @@index([commentableType, commentableId])
  @@map("comments")
}
```

```typescript
// Polymorphic query patterns
export class CommentRepository {
  async findCommentsForEntity(type: string, id: string) {
    return prisma.comment.findMany({
      where: {
        commentableType: type,
        commentableId: id
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async addComment(type: string, id: string, content: string) {
    return prisma.comment.create({
      data: {
        content,
        commentableType: type,
        commentableId: id
      }
    });
  }
}
```

description:
globs:
alwaysApply: false

---
