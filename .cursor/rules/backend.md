---
alwaysApply: true
trigger: always_on
glob: "src/app/api/**/*,src/lib/**/*,prisma/**/*"
description: Backend API routes, Prisma, and server action rules
---

# ⚙️ Backend Rules

## 1. API ROUTE STRUCTURE

```typescript
// src/app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { Event } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Fetch data
    const events = await prisma.event.findMany();

    // 3. Return typed response
    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## 2. INPUT VALIDATION

```typescript
// ✅ ALWAYS validate with Zod
import { z } from "zod";

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  capacity: z.number().int().positive(),
  startDate: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  const body: unknown = await request.json();

  const result = createEventSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const data = result.data; // Typed!
}
```

---

## 3. PRISMA QUERIES

```typescript
// ✅ Use proper includes/selects
const event = await prisma.event.findUnique({
  where: { id: eventId },
  include: {
    registrations: {
      where: { status: "CONFIRMED" },
      include: { user: true },
    },
    bankAccount: true,
  },
});

// ✅ Type the result
import type { Prisma } from "@prisma/client";

type EventWithRegistrations = Prisma.EventGetPayload<{
  include: { registrations: { include: { user: true } } };
}>;

// ✅ Always check null
if (event === null) {
  return NextResponse.json(
    { success: false, error: "Event not found" },
    { status: 404 }
  );
}
```

---

## 4. TRANSACTIONS

```typescript
// ✅ Use transactions for multiple operations
const result = await prisma.$transaction(async (tx) => {
  const registration = await tx.registration.create({
    data: { userId, eventId, status: 'PENDING' },
  });

  await tx.event.update({
    where: { id: eventId },
    data: { currentRegistrations: { increment: 1 } },
  });

  return registration;
});

// ✅ Handle transaction errors
try {
  await prisma.$transaction([...]);
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Unique constraint violation
    }
  }
  throw error;
}
```

---

## 5. ERROR HANDLING

```typescript
// ✅ Consistent error response format
interface ApiErrorResponse {
  success: false;
  error: string;
  errors?: Record<string, string[]>;
}

// ✅ Log errors with context
catch (error) {
  console.error('[API] POST /events error:', {
    error,
    userId: user?.id,
    body: sanitizedBody, // Remove sensitive data
  });

  return NextResponse.json<ApiErrorResponse>({
    success: false,
    error: 'Failed to create event',
  }, { status: 500 });
}
```

---

## 6. SERVER ACTIONS

```typescript
// src/lib/actions/events.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createEventAction(formData: FormData) {
  // 1. Auth check
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  // 2. Parse & validate
  const rawData = Object.fromEntries(formData);
  const result = eventSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, errors: result.error.flatten() };
  }

  // 3. Create
  const event = await prisma.event.create({
    data: { ...result.data, organizerId: user.id },
  });

  // 4. Revalidate & redirect
  revalidatePath("/events");
  redirect(`/events/${event.id}`);
}
```

---

## 7. AUTHORIZATION

```typescript
// ✅ Check ownership/permissions
async function checkEventOwnership(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true },
  });

  if (event === null) {
    throw new Error("Event not found");
  }

  if (event.organizerId !== userId) {
    throw new Error("Not authorized");
  }

  return true;
}

// ✅ Use middleware for common checks
export async function withAuth(handler: (user: User) => Promise<NextResponse>) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handler(user);
}
```

---

## 8. RATE LIMITING & SECURITY

```typescript
// ✅ Sanitize user input
import DOMPurify from 'isomorphic-dompurify';

const sanitizedDescription = DOMPurify.sanitize(data.description);

// ✅ Never expose internal errors
catch (error) {
  // Log full error internally
  console.error('Internal error:', error);

  // Return generic message to client
  return { success: false, error: 'Something went wrong' };
}
```
