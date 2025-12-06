---
trigger: always_on
glob:
description: TypeScript type safety rules - no any, type guards, validation
---

# 🔐 TypeScript Safety Rules

## 1. NO `any` TYPE - EVER

```typescript
// ❌ FORBIDDEN
function processData(data: any) {}
const result: any = fetchData();

// ✅ REQUIRED
function processData(data: EventData) {}
const result: EventResponse = fetchData();

// ✅ When unknown, use type guards
function processUnknown(data: unknown): EventData {
  if (isEventData(data)) {
    return data;
  }
  throw new Error("Invalid data format");
}
```

---

## 2. NO ASSERTIONS - USE TYPE GUARDS

```typescript
// ❌ FORBIDDEN
const user = data as User;
const event = response as Event;
const element = document.querySelector(".btn") as HTMLButtonElement;
const items = data!;

// ✅ Type guards
function isUser(data: unknown): data is User {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "email" in data &&
    typeof (data as User).id === "string" &&
    typeof (data as User).email === "string"
  );
}

function getUser(data: unknown): User {
  if (!isUser(data)) {
    throw new Error("Invalid user data");
  }
  return data;
}

// ✅ DOM elements
const element = document.querySelector(".btn");
if (element instanceof HTMLButtonElement) {
  element.click();
}

// ✅ Optional chaining
const name = user?.name ?? "Default";
```

---

## 3. VALIDATE ALL API RESPONSES

```typescript
// ❌ FORBIDDEN
const response = await fetch("/api/events");
const events: Event[] = await response.json();

// ✅ REQUIRED
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function isEvent(data: unknown): data is Event {
  return (
    typeof data === "object" && data !== null && "id" in data && "title" in data
  );
}

function isEventArray(data: unknown): data is Event[] {
  return Array.isArray(data) && data.every(isEvent);
}

const response = await fetch("/api/events");
const json: unknown = await response.json();

if (!isApiResponse(json) || !json.success || !isEventArray(json.data)) {
  throw new Error("Invalid API response");
}
const events = json.data;
```

---

## 4. REUSE EXISTING TYPES

```typescript
// ❌ FORBIDDEN - duplicating
interface UserData {
  id: string;
  name: string;
}
interface UserInfo {
  id: string;
  name: string;
} // duplicate!

// ✅ Import and reuse
import type { User } from "@prisma/client";
import type { EventCreationFormData } from "@/types/event/event-creation.types";

// ✅ Extend when needed
interface ExtendedUser extends User {
  registrations: Registration[];
}

// ✅ Pick/Omit
type UserSummary = Pick<User, "id" | "name" | "email">;
type UserWithoutPassword = Omit<User, "password">;
```

---

## 5. SAFE ARRAY ACCESS

Project has `noUncheckedIndexedAccess: true`:

```typescript
// ❌ FORBIDDEN
const firstItem = items[0];
firstItem.name; // Error - might be undefined

// ✅ Check first
const firstItem = items[0];
if (firstItem !== undefined) {
  console.log(firstItem.name);
}

// ✅ Optional chaining
const firstName = items[0]?.name ?? "Unknown";

// ✅ Array methods
const found = items.find((item) => item.id === targetId);
if (found !== undefined) {
  processItem(found);
}
```

---

## 6. PRISMA TYPE USAGE

```typescript
// ✅ Use Prisma types directly
import type {
  Event,
  Registration,
  User,
  RegistrationStatus,
  RegistrationPaymentStatus,
  PaymentMethod,
} from "@prisma/client";

// ✅ Use Prisma utilities
import type { Prisma } from "@prisma/client";
type EventCreateInput = Prisma.EventCreateInput;
type EventWithRelations = Prisma.EventGetPayload<{
  include: { registrations: true };
}>;

// ❌ NEVER redefine enums
enum MyStatus {
  PENDING = "PENDING",
} // DON'T
```

---

## 7. ZOD VALIDATION

```typescript
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(1).max(200),
  capacity: z.number().int().positive(),
  price: z.number().nonnegative(),
}) satisfies z.ZodType<EventCreationFormData>;

// Safe parse
const result = eventSchema.safeParse(data);
if (!result.success) {
  const errors = result.error.flatten();
}
```

---

## 8. API RESPONSE PATTERN

```typescript
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  errors?: Record<string, string>;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

function isApiSuccess<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}
```
