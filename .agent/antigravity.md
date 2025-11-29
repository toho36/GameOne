# Antigravity Agent Rules - Comprehensive Edition

## 🌌 Identity & Mission

I am **Antigravity**, a powerful agentic AI designed for advanced coding tasks.
My mission is to deliver **premium, high-performance, and aesthetically
stunning** solutions. I do not just "make it work"; I make it **shine**.

---

## 🚨 CRITICAL RULES (NON-NEGOTIABLE)

### 1. File Size Limits (ABSOLUTE)

- **MAXIMUM 300 lines per file** - STRICT LIMIT - NO EXCEPTIONS
- **WARNING at 200 lines** - Plan refactoring immediately
- **UI Components**: MAX 100 lines (simple, reusable)
- **Layout Components**: MAX 150 lines
- **Hook Functions**: MAX 50 lines
- **Utility Functions**: MAX 30 lines

### 2. Refactoring Triggers (IMMEDIATE ACTION REQUIRED)

- **200+ lines**: STOP and plan refactoring
- **JSX >50 lines**: Extract sub-components
- **Logic >50 lines**: Extract custom hooks
- **>7 props**: Consider composition or reducer
- **>5 hooks** in component: Extract custom hooks
- **>3 event handlers**: Extract to hooks
- **Nested JSX >3 levels**: Extract sub-components

### 3. Naming Conventions (STRICT)

- **Files**: `kebab-case.tsx` / `kebab-case.ts`
- **Components**: `PascalCase` (exported function name)
- **Hooks**: `use-kebab-case.ts` (file), `useCamelCase` (function)
- **Types**: `kebab-case.types.ts` (file)
- **Props**: `ComponentNameProps` (interface)
- **Directories**: `kebab-case/`

### 4. Type System (STRICT ENFORCEMENT)

- **NO INLINE TYPES** for components - MANDATORY separate `.types.ts` files
- **Use `interface` for:**
  - Component props: `ComponentNameProps`
  - Object shapes that extend/inherit
  - API contracts and data models
- **Use `type` for:**
  - Unions: `type Status = 'pending' | 'completed' | 'failed'`
  - Primitives: `type ID = string`
  - Function signatures: `type Handler = (e: Event) => void`
  - Intersections, conditionals, mapped types
- **Type-only imports**: `import type { ... } from ...`
- **No `any`**: Use precise types or `unknown` with type guards

---

## 📁 Project Structure (STRICT)

### Required Directories

```
src/
├── app/
│   ├── [locale]/            # Next.js App Router pages
│   └── api/                 # API route handlers (route.ts)
├── components/
│   ├── ui/                  # Primitives, <100 lines, forwardRef, cva variants
│   ├── layout/              # Shell/layout, <150 lines
│   ├── auth/                # Auth components
│   ├── features/            # Complex composed components
│   │   └── <feature>/
│   │       ├── components/  # Sub-components
│   │       ├── hooks/       # Feature hooks
│   │       └── types/       # Feature types
│   └── providers/           # Context providers
├── types/
│   ├── components/          # UI/feature component prop types
│   ├── features/            # Domain types by feature
│   ├── global/              # Shared base/utility types
│   └── api/                 # Request/response contracts
├── hooks/                   # Global reusable hooks
├── lib/
│   ├── api/                 # Ky client, services, query-keys
│   ├── auth.ts
│   ├── prisma.ts
│   ├── utils.ts
│   └── validation/
├── styles/                  # globals.css
└── test/                    # Shared test utilities
```

### File Placement Rules

- **UI primitives**: `src/components/ui/` - style-only, forwardRef, <100 lines
- **Layouts**: `src/components/layout/` - header/footer/sidebar
- **Features**: `src/components/features/<feature>/` - composed components,
  split into sub-components/hooks/types
- **API routes**: `src/app/api/<resource>/route.ts`
- **Pages**: `src/app/[locale]/<page>/page.tsx`
- **Types**: ALWAYS in separate `.types.ts` files

---

## 🎯 Component Standards

### Structure (MANDATORY ORDER)

1. **Imports** (React/Next → Third-party → Internal `@/` → Type imports)
2. **Props interface** (from `.types.ts`)
3. **Hooks** (5-7 max; extract if more)
4. **Handlers** (extract if >3 or >50 lines)
5. **Render** (extract sub-components when JSX >50 lines)

### Server vs Client Components

- **Default to server components**
- Add `"use client"` ONLY when necessary:
  - Browser APIs (localStorage, window)
  - Interactivity (onClick, onChange)
  - State (useState, useReducer)
  - Effects (useEffect)
- Keep client components SMALL; lift heavy logic to hooks/utilities

### Export Patterns

- **Named exports** for components/hooks (PREFERRED)
- **Default export** ONLY for pages/layouts

### Example Component

```typescript
// event-card.tsx
import { cn } from '@/lib/utils'
import type { EventCardProps } from './event-card.types'

export function EventCard({ event, onSelect, className }: EventCardProps) {
  return (
    <div className={cn('rounded-lg border p-4', className)} onClick={() => onSelect?.(event)}>
      <h3 className="font-semibold">{event.title}</h3>
      <p className="text-sm text-muted-foreground">{event.description}</p>
    </div>
  )
}
```

```typescript
// event-card.types.ts
import type { ComponentProps } from "react";

export interface EventCardProps extends ComponentProps<"div"> {
  event: PublicEvent;
  onSelect?: (event: PublicEvent) => void;
}

export type EventCardVariant = "default" | "compact" | "detailed";
```

---

## 🌐 Data Fetching (MANDATORY STANDARDS)

### DO NOT use raw `fetch()`

**ALWAYS use**:

- **Ky helpers** from `@/lib/api/client.ts`:
  - `getJson<T>()`, `postJson<T>()`, `putJson<T>()`, `patchJson<T>()`,
    `deleteJson<T>()`
- **React Query** for server state (caching, retries, deduping)

### Query Keys

- Location: `src/lib/api/query-keys.ts`
- Use stable keys: `['events', params]` for cache correctness

### Example Patterns

```typescript
// Fetching with React Query + Ky
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api/client";
import { eventsKeys } from "@/lib/api/query-keys";

export function usePublicEvents(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: eventsKeys.list(params),
    queryFn: () =>
      getJson<{ events: Event[]; pagination: Pagination }>(
        `/api/events?page=${params.page}&limit=${params.limit}`
      ),
  });
}

// Mutation
import { useMutation } from "@tanstack/react-query";
import { postJson } from "@/lib/api/client";

export function useRegisterEvent(eventId: string) {
  return useMutation({
    mutationFn: (payload: { numberOfGuests: number }) =>
      postJson(`/api/events/${eventId}/register`, payload),
  });
}
```

---

## 🎨 Styling & Aesthetics

### Tailwind CSS (ONLY)

- **Use `cn()` utility** for conditional classes
- **Use `class-variance-authority` (cva)** for variants in UI primitives
- **Mobile-first** responsive design
- **Dark mode support** for all designs

### Responsiveness

- Always test against mobile views first
- Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`

### Accessibility (WCAG 2.1 AA)

- Semantic HTML first
- Keyboard navigation support
- Proper ARIA roles/labels
- Color contrast compliance
- Focus management

---

## 🌍 Internationalization

### next-intl (MANDATORY)

- ALL user-visible text MUST be translated
- Use `useTranslations()`
- Use locale-aware `Link` from `@/i18n/navigation`

```typescript
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function EventCard({ event }: EventCardProps) {
  const t = useTranslations('Events')

  return (
    <div>
      <h3>{event.title}</h3>
      <Link href={`/events/${event.id}`}>{t('viewDetails')}</Link>
    </div>
  )
}
```

---

## ⚙️ Import Conventions (STRICT)

### Order (MANDATORY)

1. React/Next.js
2. Third-party libraries
3. Internal via `@/` alias (**NEVER use `../../../`**)
4. Type-only imports with `import type { ... }`

### Environment Variables

- **ALWAYS use bracket notation**: `process.env["NODE_ENV"]`
- **NEVER dot notation**: ~~`process.env.NODE_ENV`~~
- Never access env vars in client code unless explicitly safe

---

## ✅ Pre-Commit Checklist (BLOCKERS)

- [ ] File <300 lines (CRITICAL)
- [ ] Types in separate `.types.ts` file
- [ ] Correct interface/type usage
- [ ] Proper folder organization (ui/features/layout)
- [ ] Error handling for async operations
- [ ] Loading states implemented
- [ ] Accessibility attributes (ARIA, semantic HTML)
- [ ] Internationalization (next-intl)
- [ ] Tests written/updated
- [ ] No TypeScript errors
- [ ] Data fetched via Ky + React Query (NO raw fetch)
- [ ] Follows established patterns

---

## 🧠 Mental Workflow

### Before Writing Code

1. **Estimate final line count** - if >200 lines, plan sub-components
2. **Create types file FIRST** (`component-name.types.ts`)
3. **Determine placement** (ui/ vs features/)
4. **Plan accessibility** from start
5. **Plan mobile responsiveness**

### While Writing Code

- "Is this file growing too large?" → **Refactor**.
- "Did I define types inline?" → **Move to `.types.ts`**.
- "Does this look basic?" → **Add polish**.
- "Am I using fetch()?" → **Use Ky helpers**.
- "Is this text translated?" → **Use next-intl**.

### After Writing Code

- Run `bun run validate-structure`
- Run `bun run type-check`
- Run `bun run lint`
- Run `bun run format`

---

## 🔥 Common Extraction Patterns

- **Custom hooks** for complex state logic (>50 lines)
- **Utility functions** for pure calculations
- **Sub-components** for repeated JSX patterns (>50 lines)
- **Constants** for magic numbers/strings
- **Types** for reusable type definitions

---

_Generated by Antigravity - Enforced automatically in the IDE_
