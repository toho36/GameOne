---
description: Fix code quality issues and run validations
---

# Code Quality Workflow

Identify and fix code quality issues before committing.

## Quick Fix (Auto-run where possible)

// turbo

1. **Format code**

```bash
bun run format
```

// turbo 2. **Fix linting errors**

```bash
bun run lint:fix
```

// turbo 3. **Type check**

```bash
bun run type-check
```

// turbo 4. **Validate structure**

```bash
bun run validate-structure
```

## Manual Review

5. **Check file sizes**
   - Any files >200 lines? Plan refactoring
   - Any files >300 lines? MUST refactor NOW

6. **Review types**
   - Are prop types in separate `.types.ts` files?
   - Using `interface` for props, `type` for unions?
   - No `any` types?

7. **Review imports**
   - Using `@/` alias (not `../../../`)?
   - Type-only imports with `import type`?
   - Correct order (React → libs → internal → types)?

8. **Review data fetching**
   - Using Ky helpers (not raw `fetch`)?
   - Using React Query for server state?
   - Proper error handling?

9. **Review accessibility**
   - Semantic HTML?
   - ARIA labels where needed?
   - Keyboard navigation?

10. **Review i18n**
    - All user-visible text translated?
    - Using `useTranslations()` from next-intl?

## Pre-Commit

// turbo 11. **Run all checks**

```bash
bun run check-all
```

This runs the comprehensive pre-push checks including:

- TypeScript type checking
- ESLint
- Prettier
- Structure validation
- Database schema validation (if applicable)
- Tests

## Auto-Fix Option

```bash
bun run pre-push-fix
# Attempts to auto-fix linting and formatting issues
```
