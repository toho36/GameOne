---
trigger: always_on
glob: "src/components/**/*,src/app/**/*.tsx,src/hooks/**/*"
description: Frontend React component and UI rules
---

# 🎨 Frontend Rules

## 1. COMPONENT STRUCTURE

```typescript
// ✅ REQUIRED pattern
import type { ComponentProps } from './component.types';

export function Component({ prop1, prop2 }: ComponentProps) {
  // 1. Hooks at top
  // 2. Derived state
  // 3. Event handlers
  // 4. Early returns
  // 5. Main render
  return <div>...</div>;
}
```

---

## 2. HOOKS RULES

```typescript
// ✅ Custom hooks for reusable logic
export function useEventData(eventId: string) {
  const [data, setData] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Return object for easy destructuring
  return { data, isLoading, error };
}

// ❌ Don't put hooks in conditions
if (condition) {
  const hook = useHook(); // FORBIDDEN
}
```

---

## 3. STATE MANAGEMENT

```typescript
// ✅ Use appropriate state location
// Local: useState for component-only state
// Lifted: props/context for shared state
// Server: React Query/SWR for API data

// ✅ Derive state instead of syncing
const total = items.reduce((sum, item) => sum + item.price, 0);

// ❌ Don't sync state
useEffect(() => {
  setTotal(items.reduce(...)); // AVOID
}, [items]);
```

---

## 4. EVENT HANDLERS

```typescript
// ✅ Typed handlers
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
};

const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  // Form logic
};

// ✅ Use useCallback for memoized callbacks
const handleChange = useCallback((id: string) => {
  setSelected(id);
}, []);
```

---

## 5. CONDITIONAL RENDERING

```typescript
// ✅ Early returns for states
if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;

// ✅ Ternaries for simple conditions
return (
  <div>
    {isActive ? <ActiveBadge /> : <InactiveBadge />}
  </div>
);

// ✅ && for optional elements
return (
  <div>
    {showHeader && <Header />}
  </div>
);
```

---

## 6. FORMS

```typescript
// ✅ Use react-hook-form with Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: { title: "" },
});

// ✅ Handle loading/error states
const handleSubmit = form.handleSubmit(async (data) => {
  try {
    setIsSubmitting(true);
    await submitData(data);
  } catch (error) {
    form.setError("root", { message: "Failed" });
  } finally {
    setIsSubmitting(false);
  }
});
```

---

## 7. ACCESSIBILITY

```typescript
// ✅ REQUIRED attributes
<button
  type="button"
  aria-label="Close dialog"
  aria-pressed={isPressed}
  disabled={isLoading}
>
  {isLoading ? <Spinner /> : 'Submit'}
</button>

// ✅ Semantic HTML
<nav> <main> <article> <aside> <footer>

// ✅ Focus management
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => {
  inputRef.current?.focus();
}, []);
```

---

## 8. STYLING WITH TAILWIND

```typescript
// ✅ Use cn() for conditional classes
import { cn } from '@/lib/utils';

<button
  className={cn(
    'px-4 py-2 rounded',
    isActive && 'bg-primary text-white',
    isDisabled && 'opacity-50 cursor-not-allowed'
  )}
>

// ✅ Extract repeated patterns
const buttonStyles = 'px-4 py-2 rounded font-medium';
```

---

## 9. SERVER VS CLIENT COMPONENTS

```typescript
// ✅ Default to Server Components
// Server components can:
// - Fetch data directly
// - Access backend resources
// - Keep sensitive data on server

// ✅ Use "use client" ONLY when needed:
// - useState, useEffect, other hooks
// - Browser APIs (window, document)
// - Event handlers (onClick, onChange)
// - Third-party client libraries

// ❌ WRONG - unnecessary client component
"use client"; // Don't add if not needed!
export function StaticCard({ title }: { title: string }) {
  return <div>{title}</div>; // No interactivity = server component
}

// ✅ CORRECT - split client/server
// ServerWrapper.tsx (no "use client")
export function ServerWrapper() {
  const data = await fetchData(); // Server-side fetch
  return <ClientComponent data={data} />;
}

// ClientComponent.tsx
"use client";
export function ClientComponent({ data }: Props) {
  const [isOpen, setIsOpen] = useState(false); // Needs client
  return <button onClick={() => setIsOpen(true)}>{data.title}</button>;
}
```

---

## 10. INTERNATIONALIZATION (next-intl)

```typescript
// ✅ Import translations
import { useTranslations } from 'next-intl';

export function EventCard({ event }: EventCardProps) {
  const t = useTranslations('Event');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      {/* With interpolation */}
      <p>{t('spotsLeft', { count: event.availableSpots })}</p>
    </div>
  );
}

// ✅ Server components - use getTranslations
import { getTranslations } from 'next-intl/server';

export async function EventPage() {
  const t = await getTranslations('Event');
  return <h1>{t('title')}</h1>;
}

// ✅ Locale-aware navigation
import { Link, useRouter } from '@/i18n/navigation';

<Link href="/events">{t('viewEvents')}</Link>

// ✅ Translation file structure (messages/en.json)
{
  "Event": {
    "title": "Events",
    "description": "Browse upcoming events",
    "spotsLeft": "{count, plural, =0 {No spots} =1 {1 spot} other {# spots}} left"
  }
}
```

---

## 11. DATA FETCHING (React Query)

```typescript
// ✅ Use centralized API client
import { getJson, postJson } from '@/lib/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsKeys } from '@/lib/api/query-keys';

// ✅ Query hook pattern
export function useEvents(params: { page: number; limit: number }) {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  }).toString();

  return useQuery({
    queryKey: eventsKeys.list(params),
    queryFn: () => getJson<{ events: Event[]; pagination: Pagination }>(
      `/api/events?${search}`
    ),
    staleTime: 30_000,
  });
}

// ✅ Mutation hook pattern
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEventInput) =>
      postJson<Event>('/api/events', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.lists() });
    },
  });
}

// ✅ Usage in components
function EventList() {
  const { data, isLoading, error } = useEvents({ page: 1, limit: 10 });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  // Defensive: always check data
  const events = Array.isArray(data?.events) ? data.events : [];

  return events.map(event => <EventCard key={event.id} event={event} />);
}

// ❌ DON'T use raw fetch in components
const data = await fetch('/api/events'); // Use getJson instead
```

---

## 12. IMAGE OPTIMIZATION

```typescript
import Image from 'next/image';

// ✅ REQUIRED: Use Next.js Image component
<Image
  src={event.imageUrl}
  alt={event.title}           // Always provide alt text
  width={400}
  height={300}
  priority={isAboveFold}      // For LCP images
  placeholder="blur"          // Optional: blur placeholder
  blurDataURL={event.blurUrl} // Base64 blur image
/>

// ✅ Responsive images
<Image
  src={event.imageUrl}
  alt={event.title}
  fill                        // Fill parent container
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover"
/>

// ✅ External images - configure in next.config.js
// next.config.js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'example.com' },
  ],
}

// ❌ DON'T use <img> tags
<img src={url} /> // Use <Image> instead
```

---

## 13. ERROR BOUNDARIES

```typescript
// error.tsx (Next.js App Router convention)
'use client';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Try again
      </button>
    </div>
  );
}

// ✅ Custom error boundary for specific sections
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}
```

---

## 14. NAMING CONVENTIONS

| Type                | Convention                  | Example                      |
| ------------------- | --------------------------- | ---------------------------- |
| Components          | PascalCase                  | `EventCard`, `UserProfile`   |
| Component files     | PascalCase.tsx              | `EventCard.tsx`              |
| Hooks               | camelCase with `use` prefix | `useEventData`, `useAuth`    |
| Hook files          | use-kebab-case.ts           | `use-event-data.ts`          |
| Variables/Functions | camelCase                   | `eventData`, `handleSubmit`  |
| Constants           | UPPER_SNAKE_CASE            | `MAX_ITEMS`, `API_URL`       |
| Types/Interfaces    | PascalCase                  | `EventCardProps`, `UserData` |
| Type files          | kebab-case.types.ts         | `event-card.types.ts`        |
| CSS classes         | kebab-case                  | `event-card`, `user-profile` |
| Translation keys    | camelCase                   | `eventTitle`, `submitButton` |
| Query keys          | camelCase with factory      | `eventsKeys.list()`          |

```typescript
// ✅ CORRECT naming examples
const MAX_EVENTS = 100; // Constant
const eventData = await fetchEvents(); // Variable
function handleSubmit() {} // Function
function EventCard() {} // Component
function useEventData() {} // Hook
interface EventCardProps {} // Interface
type EventStatus = "active" | "inactive"; // Type
```

---

## 15. CODE COMMENTS

```typescript
// ✅ Explain "why", not "what"
// ❌ Bad: Increment counter
// ✅ Good: Track retry attempts to prevent infinite loops
retryCount++;

// ✅ Document complex business logic
/**
 * Calculates available spots considering:
 * - Confirmed registrations (take full spots)
 * - Pending payments (reserve spots for 24h)
 * - Cancelled registrations (return spots)
 */
function calculateAvailableSpots(event: Event): number {
  // ...
}

// ✅ Use JSDoc for public APIs
/**
 * Fetches event details with registrations
 * @param eventId - The event's unique identifier
 * @returns Event with nested registrations or null if not found
 * @throws {Error} If user is not authenticated
 */
export async function getEventWithRegistrations(
  eventId: string
): Promise<EventWithRegistrations | null> {
  // ...
}

// ✅ Mark TODOs with context
// TODO(username): Implement pagination after MVP - Issue #123
```

---

## 16. CODE REVIEW CHECKLIST

Before submitting code:

- [ ] TypeScript compiles without errors
- [ ] All props have proper interfaces in `.types.ts` files
- [ ] No `any` types or type assertions
- [ ] Component is responsive across breakpoints
- [ ] Accessibility: ARIA labels, keyboard navigation, semantic HTML
- [ ] Internationalization: All text uses translation keys
- [ ] Loading and error states are handled
- [ ] Images use Next.js `<Image>` component
- [ ] Data fetching uses React Query hooks
- [ ] Code follows naming conventions
- [ ] File is under 300 lines
