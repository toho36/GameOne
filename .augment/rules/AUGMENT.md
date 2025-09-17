---
type: "always_apply"
---

# Augment Agent — Core Rules (GameOne)

## Mission

- Enforce strict code quality with small, focused files and explicit TypeScript.
- Follow feature-based architecture and consistent structure.
- Prefer server components; keep client code minimal and accessible.

## Absolute Rules — No Exceptions

1. Max 300 lines per file/component
2. Plan refactor at 200 lines
3. Extract sub-components when JSX > 50 lines
4. Extract custom hooks when logic > 50 lines
5. Use interface for component props; use type for unions/primitives/functions
6. All component/feature types live in separate `.types.ts` files (no inline
   prop types)
7. Use named exports; default export only for pages/layouts
8. Use `@/` path alias; never `../../../`
9. Environment variables via bracket notation: `process.env["VAR_NAME"]`
10. No `any`. Prefer precise types or `unknown` + type guards

## Project Shape (validated against repo)

- src/app — App Router with `[locale]`, `api/`, middleware
- src/components — ui/, layout/, auth/, features/, providers/
- src/types — bank-account/, components/, event/, features/, etc.
- src/lib — api/ (ky client, services, query keys), auth, utils, prisma,
  validation
- src/hooks — global reusable hooks
- messages/ — i18n catalogs (en, cs)
- prisma/ — schema + migrations + seed

## Import Order

1. React/Next imports
2. Third-party libs
3. Internal utilities/services/components using `@/`
4. Type-only imports using `import type { ... } from ...`

## Data Fetching (standardized)

- Never use raw fetch in app code. Use `src/lib/api/client.ts` helpers:
  `getJson`, `postJson`, `putJson`, `patchJson`, `deleteJson`
- Prefer React Query (v5) for server state with stable `queryKey`s from
  `src/lib/api/query-keys.ts`
- API responses may be `{ success, data }`; ky helpers auto-unwrap

## Accessibility & i18n

- WCAG 2.1 AA: semantic HTML, ARIA where needed, keyboard navigation, focus
  management
- Use `next-intl`; all user-facing text must go through translation messages;
  use locale-aware `Link` from `@/i18n/navigation`

## Styling

- Tailwind CSS only; use `cn()` utility for conditional classes
- Mobile-first; extract repeated patterns

## Testing

- All components and utilities require tests (Vitest + @testing-library/\*)
- Test interactions and outcomes, not implementation details
- Co-locate tests near subject or under `src/test` following existing patterns

## Error Handling

- Components: graceful loading/error/empty states; add Error Boundaries for
  complex client areas
- API routes: zod validation, try/catch, clear status codes, no sensitive
  leakage, bracket env access

## Security (high level)

- Validate all inputs server-side with zod
- Never expose secrets in client bundles
- Enforce auth/authorization in API and server-only code paths
- Rate limit sensitive actions (see `src/lib/api/email/rate-limiter.ts`
  reference)

## Pre-commit Quality Gate (blocking)

- [ ] File < 300 lines (or refactored)
- [ ] Types in separate `.types.ts` files
- [ ] No `any`; correct interface/type usage
- [ ] Folder/file placement matches structure rules
- [ ] Loading, error, and empty states implemented
- [ ] Accessibility attributes present
- [ ] Tests exist and pass locally
- [ ] Type-check and lint pass

## Commands

- bun run type-check
- bun run lint
- bun run test
- bun run build
- bun run pre-push

## When to Ask

- Potential breaking refactors
- Security-sensitive changes
- Schema or API contract changes
