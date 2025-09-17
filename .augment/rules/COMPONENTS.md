---
type: "always_apply"
---

# Components & Hooks (STRICT)

## Size limits (no exceptions)

- MAX 300 lines per component/file
- Refactor at 200 lines
- Extract sub-components when JSX > 50 lines
- Extract custom hooks when logic > 50 lines
- Functions should generally not exceed ~50 lines

## Placement

- `src/components/ui/`  primitives, forwardRef, cva variants, <100 lines each
- `src/components/layout/`  shell/layout components, <150 lines
- `src/components/features/<feature>/`  composed feature UIs; split into
  `components/`, `hooks/`, `types/` as it grows
- `src/components/providers/`  context providers

## Structure (component)

1. Imports (React/Next > third-party > internal `@/` > type imports)
2. Props interface from `.types.ts`
3. Hooks (5-7 max; extract if more)
4. Handlers (extract if >3 or long)
5. Render (extract sub-components when JSX > 50 lines)

## Server vs Client

- Default to server components
- Add "use client" only when necessary (browser APIs, interactivity, state)
- Keep client components small; lift heavy logic to hooks/utilities

## Styling

- Tailwind CSS only; use `cn()` utility for conditionals
- Use `class-variance-authority` (cva) for variants in UI primitives

## Accessibility

- Semantic HTML first
- Keyboard support, focus management
- Proper ARIA roles/labels where needed
- Color contrast compliance

## Internationalization

- Use `next-intl`; all user-visible text must be translated
- Use locale-aware `Link` from `@/i18n/navigation`

## Data fetching

- Do NOT use `fetch` directly; use ky helpers from `@/lib/api/client`
- Prefer React Query for server state (caching, deduping, retries)

## Export patterns

- Named exports for components/hooks
- Default export reserved for pages/layouts only

## Example (pattern snippet)

- Import order
  - React/Next
  - Third-party
  - Internal `@/...`
  - `import type { ... }` last
- Props import
  - `import type { EventCardProps } from './event-card.types'`

## Testing

- Render with Testing Library
- Test user flows: loading, error, empty, interaction events
- Avoid implementation details; assert UI and behavior

## Checklist

- [ ] <300 lines (refactor if 200)
- [ ] Props defined in `.types.ts` and imported via `import type`
- [ ] No `any`; clear unions and interfaces
- [ ] Accessible and translated UI
- [ ] Data fetched via ky helpers and React Query if applicable
- [ ] Tests added/updated
