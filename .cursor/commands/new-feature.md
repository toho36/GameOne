---
description: Create a new feature component with proper structure
---

# New Feature Component

Creates a complete feature component structure with all required files following
project standards.

## Steps

1. **Determine feature name** (e.g., `user-profile`, `event-dashboard`)

2. **Create feature directory structure**

```bash
mkdir -p src/components/features/<feature-name>/components
mkdir -p src/components/features/<feature-name>/hooks
mkdir -p src/components/features/<feature-name>/types
```

3. **Create main component file** at
   `src/components/features/<feature-name>/<feature-name>.tsx`
   - Use kebab-case for filename
   - Export function in PascalCase
   - Keep under 300 lines (plan sub-components if needed)

4. **Create types file** at
   `src/components/features/<feature-name>/<feature-name>.types.ts`
   - Define `<ComponentName>Props` interface
   - Define any variant/status types needed
   - Use `interface` for props, `type` for unions

5. **Create index.ts** for clean exports

```typescript
export { FeatureName } from "./<feature-name>";
export type { FeatureNameProps } from "./<feature-name>.types";
```

6. **Add test file** at
   `src/components/features/<feature-name>/<feature-name>.test.tsx`

7. **Run validation**

```bash
bun run validate-structure
bun run type-check
```

## Example Structure

```
src/components/features/user-dashboard/
├── components/          # Sub-components (<100 lines each)
├── hooks/              # Feature-specific hooks
├── types/              # Feature-specific types
├── user-dashboard.tsx  # Main component (<300 lines)
├── user-dashboard.types.ts
├── user-dashboard.test.tsx
└── index.ts
```
