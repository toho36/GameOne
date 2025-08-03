# API Structure and Routing Rules

## Overview
This document defines the comprehensive API structure and routing conventions for the GameOne event management system. All APIs should follow RESTful principles with consistent patterns for authentication, error handling, and response formatting.

## Directory Structure

```
src/app/api/
├── auth/                   # Authentication endpoints
│   ├── login/
│   ├── logout/
│   ├── register/
│   ├── verify/
│   └── refresh/
├── users/                  # User management
│   ├── route.ts           # GET /api/users, POST /api/users
│   ├── [id]/
│   │   ├── route.ts       # GET/PUT/DELETE /api/users/{id}
│   │   ├── profile/
│   │   ├── roles/
│   │   └── events/
├── events/                 # Event management
│   ├── route.ts           # GET /api/events, POST /api/events
│   ├── [id]/
│   │   ├── route.ts       # GET/PUT/DELETE /api/events/{id}
│   │   ├── registrations/
│   │   ├── feedback/
│   │   ├── documents/
│   │   └── analytics/
├── registrations/          # Registration system
│   ├── route.ts
│   ├── [id]/
│   ├── waiting-list/
│   └── bulk/
├── payments/               # Payment processing
│   ├── route.ts
│   ├── [id]/
│   ├── qr-codes/
│   ├── bank-transfers/
│   └── webhooks/
├── videos/                 # Video content
│   ├── route.ts
│   ├── [id]/
│   ├── categories/
│   └── reactions/
├── notifications/          # Notification system
│   ├── route.ts
│   ├── templates/
│   └── logs/
├── admin/                  # Administrative endpoints
│   ├── audit-logs/
│   ├── system-config/
│   ├── analytics/
│   └── reports/
├── cron/                   # Scheduled jobs
│   ├── cleanup/
│   ├── notifications/
│   └── analytics/
└── health/                 # System health
    ├── route.ts           # Basic health check
    ├── database/
    └── detailed/
```

## Route Naming Conventions

### RESTful Resource Patterns
- **Collections**: `/api/{resource}` (e.g., `/api/events`)
- **Individual Resources**: `/api/{resource}/{id}` (e.g., `/api/events/123`)
- **Sub-resources**: `/api/{resource}/{id}/{sub-resource}` (e.g., `/api/events/123/registrations`)
- **Actions**: `/api/{resource}/{id}/{action}` (e.g., `/api/events/123/publish`)

### HTTP Methods
- `GET` - Retrieve data (collections or individual resources)
- `POST` - Create new resources or perform actions
- `PUT` - Update entire resources (replace)
- `PATCH` - Partial updates
- `DELETE` - Remove resources

### Query Parameters
- **Pagination**: `?page=1&limit=20&offset=0`
- **Filtering**: `?status=active&category=workshop&dateFrom=2024-01-01`
- **Sorting**: `?sortBy=createdAt&sortOrder=desc`
- **Search**: `?search=keyword&searchFields=title,description`
- **Includes**: `?include=registrations,feedback&expand=user,event`

## Request/Response Patterns

### Standard Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}
```

### Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable error message
    details?: {
      field?: string;       // Field that caused validation error
      expected?: string;    // Expected value or format
      received?: string;    // What was actually received
      constraints?: string[]; // Validation constraints violated
    };
    stack?: string;         // Stack trace (development only)
  };
  meta: {
    timestamp: string;
    requestId: string;
    path: string;
  };
}
```

### Status Codes
- **200 OK** - Successful GET, PUT, PATCH
- **201 Created** - Successful POST with resource creation
- **204 No Content** - Successful DELETE or action with no response body
- **400 Bad Request** - Invalid request data or parameters
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource does not exist
- **409 Conflict** - Resource already exists or conflict with current state
- **422 Unprocessable Entity** - Validation errors
- **429 Too Many Requests** - Rate limiting
- **500 Internal Server Error** - Server-side errors

## Authentication and Authorization

### Authentication Headers
```typescript
// For Kinde Auth (user requests)
Authorization: Bearer {access_token}

// For cron jobs and internal services
X-Vercel-Cron-Secret: {cron_secret}

// For API keys (if implemented)
X-API-Key: {api_key}
```

### Role-Based Access Control
```typescript
interface RoutePermissions {
  public?: boolean;           // No authentication required
  authenticated?: boolean;    // Requires valid user token
  roles?: string[];          // Specific roles required
  permissions?: string[];    // Specific permissions required
  owner?: boolean;          // Must be resource owner
  admin?: boolean;          // Admin access required
}
```

### Route Protection Examples
```typescript
// Public endpoint
export const config = { public: true };

// Authenticated users only
export const config = { authenticated: true };

// Specific roles
export const config = { 
  authenticated: true, 
  roles: ['admin', 'moderator'] 
};

// Resource owner or admin
export const config = { 
  authenticated: true, 
  owner: true,
  fallbackRoles: ['admin'] 
};
```

## File Structure for Route Handlers

### Route Handler Template
```typescript
// src/app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateEventData } from '@/lib/validations/event';
import { createApiResponse, createErrorResponse } from '@/lib/api-utils';

// GET /api/events
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const user = await auth.getUser(request);
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    // Build query with filters
    const where = {
      ...(status && { status }),
      // Add other filters
    };

    // Execute query with pagination
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          registrations: {
            select: { id: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.event.count({ where })
    ]);

    // Return formatted response
    return createApiResponse(events, {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('GET /api/events error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to fetch events', 500);
  }
}

// POST /api/events
export async function POST(request: NextRequest) {
  try {
    // Authentication and authorization
    const user = await auth.getUser(request);
    if (!user || !user.permissions.includes('event:create')) {
      return createErrorResponse('FORBIDDEN', 'Insufficient permissions', 403);
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = validateEventData(body);
    
    if (!validationResult.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid event data', 422, {
        details: validationResult.errors
      });
    }

    // Create resource
    const event = await prisma.event.create({
      data: {
        ...validationResult.data,
        createdById: user.id
      },
      include: {
        category: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Return created resource
    return createApiResponse(event, { status: 201 });

  } catch (error) {
    console.error('POST /api/events error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'Failed to create event', 500);
  }
}
```

## API Utilities and Helpers

### Response Helpers Location
```typescript
// src/lib/api-utils.ts
export function createApiResponse<T>(
  data: T, 
  options?: { 
    status?: number; 
    pagination?: PaginationInfo;
    meta?: Record<string, any>;
  }
): NextResponse;

export function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: any
): NextResponse;

export function validatePagination(
  searchParams: URLSearchParams
): { page: number; limit: number; offset: number };

export function buildWhereClause(
  filters: Record<string, any>
): Prisma.WhereInput;
```

### Validation Helpers Location
```typescript
// src/lib/validations/
├── event.ts        # Event validation schemas
├── user.ts         # User validation schemas
├── registration.ts # Registration validation schemas
├── payment.ts      # Payment validation schemas
└── common.ts       # Common validation utilities
```

## Cron Jobs and Background Tasks

### Cron Route Structure
```typescript
// src/app/api/cron/[job]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { job: string } }
) {
  // Verify cron authentication
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { job } = params;

  switch (job) {
    case 'cleanup':
      return await handleCleanup();
    case 'notifications':
      return await handleNotifications();
    case 'analytics':
      return await handleAnalytics();
    default:
      return NextResponse.json({ error: 'Unknown job' }, { status: 404 });
  }
}
```

## Performance and Caching

### Database Query Optimization
- Use `select` to limit fields returned
- Use `include` strategically for relations
- Implement cursor-based pagination for large datasets
- Use database indexes for frequently queried fields
- Batch related queries with `Promise.all()`

### Response Caching Headers
```typescript
// Cache for static data
export const revalidate = 3600; // 1 hour

// Dynamic with conditional caching
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    'ETag': generateETag(data)
  }
});
```

### Rate Limiting
```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});
```

## Testing Patterns

### API Route Testing Structure
```typescript
// __tests__/api/events.test.ts
import { GET, POST } from '@/app/api/events/route';
import { createMockRequest } from '@/lib/test-utils';

describe('/api/events', () => {
  describe('GET', () => {
    it('should return paginated events', async () => {
      const request = createMockRequest('GET', '/api/events?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.pagination).toBeDefined();
    });
  });

  describe('POST', () => {
    it('should create new event with valid data', async () => {
      const eventData = { title: 'Test Event', description: 'Test' };
      const request = createMockRequest('POST', '/api/events', eventData);
      const response = await POST(request);
      
      expect(response.status).toBe(201);
    });
  });
});
```

## Documentation Requirements

### API Documentation
- Each route handler should include JSDoc comments
- Document expected request/response formats
- Include example usage and error scenarios
- Maintain OpenAPI/Swagger specification for public APIs

### Changelog and Versioning
- Use semantic versioning for API changes
- Document breaking changes and migration guides
- Maintain backward compatibility when possible
- Version endpoints when necessary: `/api/v1/events`, `/api/v2/events`