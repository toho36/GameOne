---
type: "always_apply"
---

# Project Structure & Naming (STRICT)

Authoritative structure validated against current codebase. All new code must
conform.

## Directories (required)

- src/app
  - [locale]/ ... pages and layouts (App Router)
  - api/ ... route handlers grouped by resource
- src/components
  - ui/ ... shadcn/ui and simple reusable UI (<100 lines)
  - layout/ ... layout & shell components (<150 lines)
  - auth/ ... auth components (login, profile)
  - features/ ... complex feature components (compose sub-components)
  - providers/ ... context providers (e.g., query, theme)
- src/types
  - components/, features/, event/, bank-account/, etc.
  - All component/feature prop and domain types in `.types.ts` files
- src/lib
  - api/ ... ky client (client.ts), services, query-keys, common helpers
  - auth.ts, prisma.ts, logger.ts, utils.ts, validation/, email/, notifications/
- src/hooks ... global reusable hooks
- messages ... i18n catalogs (en.json, cs.json)
- prisma ... schema.prisma + migrations + seed.ts
- src/styles ... globals.css
- src/test ... shared test setup/utilities

## File naming

- Components: kebab-case.tsx (e.g., event-card.tsx)
- Hooks: use-name.ts
- Types: kebab-case.types.ts for component/feature types; domain types under
  src/types/\*
- API routes: route.ts under src/app/api/<resource>
- Pages: page.tsx; Layouts: layout.tsx
- Providers: kebab-case.tsx
- Utilities: kebab-case.ts

## Exports

- Named exports for components, hooks, utils
- Default export only for pages/layouts

## Imports (order & style)

1. React/Next
2. Third-party libs
3. Internal via `@/` alias (never `../../../`)
4. Type-only imports with `import type { ... } from ...`

## Environment variables

- Always bracket notation: `process.env["NODE_ENV"]`
- Never access env vars in client code unless explicitly needed and safe

## Page organization (example)

- src/app/[locale]/events/page.tsx  server component by default
- src/app/api/events/route.ts  GET/POST handlers
- src/app/api/events/[id]/route.ts  item handlers
- src/app/api/events/[id]/register/route.ts  action endpoints

## Component placement

- ui/: primitive, style-only components, forwardRef, variants via cva
- layout/: header/footer/sidebar/nav shells
- features/: complex composed components; extract sub-components/hooks/types

## Validation rules

- MUST use the designated directory for each artifact
- MUST follow kebab-case file names and export patterns
- MUST keep files under 300 lines (refactor at 200)
- MUST add tests for new components/utilities
- MUST wire i18n via next-intl for user-visible strings

## Examples (conventions)

- Type import & alias usage:
  - `import type { Event } from "@/types/features/events"`
- Internal import:
  - `import { cn } from "@/lib/utils"`
- UI component path:
  - `src/components/ui/button.tsx` with `button.types.ts`
