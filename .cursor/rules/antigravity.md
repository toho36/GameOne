---
trigger: always_on
alwaysApply: true
glob:
description: Main rules index linking to specialized rule files
---

# ðŸŽ¯ GameOne Project Rules

> Event registration system: Next.js, TypeScript, Prisma, React

## ðŸ“š Rule Files

| File                                                                | Focus                                 |
| ------------------------------------------------------------------- | ------------------------------------- |
| [typescript-safety.md](mdc:.agent/rules/typescript-safety.md)       | No `any`, type guards, API validation |
| [file-structure.md](mdc:.agent/rules/file-structure.md)             | Organization, imports, 300-line limit |
| [documentation-lookup.md](mdc:.agent/rules/documentation-lookup.md) | MCP Context7, check docs first        |
| [common-mistakes.md](mdc:.agent/rules/common-mistakes.md)           | AI pitfalls to avoid                  |
| [frontend.md](mdc:.agent/rules/frontend.md)                         | React components, hooks, UI patterns  |
| [backend.md](mdc:.agent/rules/backend.md)                           | API routes, Prisma, server actions    |
| [data-fetching.md](mdc:.agent/rules/data-fetching.md)               | Ky client, React Query patterns       |
| [database.md](mdc:.agent/rules/database.md)                         | Prisma patterns, migrations, queries  |
| [testing.md](mdc:.agent/rules/testing.md)                           | Vitest, testing patterns, mocks       |
| [security.md](mdc:.agent/rules/security.md)                         | Auth, RBAC, input validation          |
| [rule-maintenance.md](mdc:.agent/rules/rule-maintenance.md)         | Maintaining unified rule sources      |

---

## ðŸš¨ CRITICAL RULES

1. **CHECK DOCS** â†’ Use MCP Context7 first
2. **NO `any`** â†’ Use `unknown` + type guards
3. **NO assertions** â†’ No `as Type`, no `!`
4. **SEPARATE types** â†’ `.types.ts` files
5. **REUSE types** â†’ Import from Prisma/`src/types/`
6. **SAFE arrays** â†’ Check `[0]` with `?.` or guards
7. **VALIDATE API** â†’ Type guards for responses
8. **MAX 300 lines** â†’ Refactor if larger
9. **USE Prisma types** â†’ Never redefine enums

---

## ðŸ”§ KEY IMPORTS

```typescript
import type {
  Event,
  Registration,
  User,
  RegistrationStatus,
} from "@prisma/client";
import type { EventCreationFormData } from "@/types/event/event-creation.types";
```
