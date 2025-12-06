---
trigger: always_on
glob:
description: Documentation lookup rules - check docs before coding
---

# 📚 Documentation Lookup Rules

## 1. ALWAYS CHECK DOCS BEFORE CODING

**MANDATORY**: Before implementing new components, features, or patterns:

1. **Use MCP Context7** to fetch documentation
2. **Search existing patterns** in the project
3. **Follow established patterns** found

---

## 2. MCP CONTEXT7 USAGE

```
// Step 1: Resolve library ID
mcp_resolve-library-id({ libraryName: "next.js" })

// Step 2: Get documentation
mcp_get-library-docs({
  context7CompatibleLibraryID: "/vercel/next.js",
  topic: "app router",
  mode: "code"  // or "info" for conceptual guides
})
```

---

## 3. LIBRARY REFERENCE TABLE

| Library         | Context7 ID                        | When to Check                          |
| --------------- | ---------------------------------- | -------------------------------------- |
| Next.js         | `/vercel/next.js`                  | Routing, API routes, server components |
| React           | `/facebook/react`                  | Hooks, component patterns              |
| Prisma          | `/prisma/prisma`                   | Database queries, schema               |
| next-intl       | `/amannn/next-intl`                | Translations, i18n                     |
| Zod             | `/colinhacks/zod`                  | Schema validation                      |
| React Hook Form | `/react-hook-form/react-hook-form` | Form handling                          |
| Tailwind        | `/tailwindlabs/tailwindcss`        | Styling                                |

---

## 4. CHECK PROJECT PATTERNS FIRST

Before creating new code:

1. **Types**: Search `src/types/` for existing definitions
2. **Components**: Check `src/components/` for similar patterns
3. **Utilities**: Review `src/lib/` for helpers
4. **Hooks**: Look at `src/hooks/` for reusable logic

---

## 5. FOLLOW ESTABLISHED PATTERNS

When found in docs or project:

- Use same coding style
- Match naming conventions
- Follow same error handling
- Apply same validation approach

---

## 6. WHEN TO CHECK DOCS

**Always check for:**

- New framework features (App Router, Server Components)
- Database operations (Prisma queries, relations)
- Form handling (validation, submission)
- Internationalization (translations, locales)
- State management (hooks, context)
- API design (routes, middleware)

**Check existing code for:**

- Type definitions
- Component structure
- Utility functions
- Error patterns
- Test patterns
