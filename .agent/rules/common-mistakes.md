---
trigger: always_on
glob:
description: Common AI coding mistakes to avoid
---

# 🚫 Common AI Mistakes to Avoid

## 1. OBJECT PROPERTY ACCESS

```typescript
// ❌ MISTAKE
function getTitle(data: Record<string, unknown>) {
  return data.title as string;
}

// ✅ CORRECT
function getTitle(data: Record<string, unknown>): string {
  if (typeof data.title !== "string") {
    throw new Error("Missing or invalid title");
  }
  return data.title;
}
```

---

## 2. NULL VS UNDEFINED

```typescript
// ❌ MISTAKE - inconsistent
if (value !== null) {
} // Misses undefined
if (value !== undefined) {
} // Misses null

// ✅ CORRECT
if (value != null) {
} // Catches both
if (value !== null && value !== undefined) {
}
value ?? defaultValue; // Nullish coalescing
```

---

## 3. PROMISE HANDLING

```typescript
// ❌ MISTAKE
const data = await fetchEvents();

// ✅ CORRECT
const response: unknown = await fetchEvents();
if (!isEventArray(response)) {
  throw new Error("Invalid response");
}
const events = response;
```

---

## 4. MAP/FILTER OPERATIONS

```typescript
// ❌ MISTAKE - filter doesn't narrow types
const active = events.filter((e) => e.isActive);
// Still (Event | undefined)[] if source had undefined

// ✅ CORRECT - explicit narrowing
const active = events.filter((e): e is Event => e !== undefined && e.isActive);
```

---

## 5. JSON PARSING

```typescript
// ❌ MISTAKE
const data = JSON.parse(jsonString) as Config;

// ✅ CORRECT
const parsed: unknown = JSON.parse(jsonString);
if (!isConfig(parsed)) {
  throw new Error("Invalid config");
}
const config = parsed;
```

---

## 6. ENVIRONMENT VARIABLES

```typescript
// ❌ MISTAKE
const apiKey = process.env.API_KEY; // string | undefined

// ✅ CORRECT
function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}
const apiKey = getRequiredEnv("API_KEY");
```

---

## 7. OPTIONAL DEFAULTS

```typescript
// ✅ Use defaults in destructuring
interface Props {
  showHeader?: boolean;
  maxItems?: number;
}

function Component({ showHeader = true, maxItems = 10 }: Props) {
  // Use defaults directly
}
```

---

## 8. ARRAY INDEX WITH noUncheckedIndexedAccess

```typescript
// ❌ MISTAKE
const first = items[0];
first.name; // Error!

// ✅ CORRECT
const first = items[0];
if (first !== undefined) {
  first.name;
}

// ✅ Or use optional chaining
const name = items[0]?.name ?? "Default";
```

---

## 9. CREATING DUPLICATE TYPES

```typescript
// ❌ MISTAKE - redefining existing types
interface MyEvent {
  id: string;
  title: string;
}

// ✅ CORRECT - import existing
import type { Event } from "@prisma/client";
```

---

## 10. TRUSTING EXTERNAL DATA

```typescript
// ❌ MISTAKE
const response = await fetch(url);
const data: MyType = await response.json();

// ✅ CORRECT
const response = await fetch(url);
const json: unknown = await response.json();
if (!isMyType(json)) {
  throw new Error("Invalid response");
}
```
