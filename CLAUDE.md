# Claude Agent Instructions for GameOne Project

## 🎯 Core Mission

Enforce strict code quality standards with a **maximum 300-line limit per
file/component** and proper TypeScript architecture using feature-based
organization.

## 🚨 CRITICAL RULES - NO EXCEPTIONS

### Mandatory Code Size Limits

- **MAXIMUM 300 lines per file/component** - ABSOLUTE LIMIT
- **Plan refactoring at 200 lines** - proactive approach
- **Extract sub-components at 50+ lines of JSX**
- **Extract custom hooks at 50+ lines of logic**
- **Functions should not exceed 50 lines**

### TypeScript Standards (STRICT ENFORCEMENT)

#### Interface vs Type Usage

**Use `interface` for:**

- Component props: `ComponentNameProps`
- Object shapes that extend/inherit
- API contracts and data models
- When extension is needed (`extends`)

**Use `type` for:**

- Union types: `type Status = 'pending' | 'completed' | 'failed'`
- Primitive aliases: `type ID = string`
- Complex operations (intersections, conditionals, mapped types)
- Function signatures: `type Handler = (event: Event) => void`

#### Type Organization (MANDATORY)

- **ALL types in separate `.types.ts` files**
- **NO inline type definitions for components**
- Organize in `src/types/` by domain (api, auth, common, components)
- Feature-specific types in feature folders

### Folder Structure Enforcement

#### Required Project Structure

```
src/
├── components/
│   ├── ui/                    # Simple reusable components (<100 lines)
│   ├── layout/                # Layout components
│   ├── auth/                  # Authentication components
│   └── features/              # Complex feature components
│       └── feature-name/
│           ├── components/    # Sub-components
│           ├── hooks/         # Feature hooks
│           ├── types/         # Feature types
│           └── index.ts
├── types/                     # Global types (SEPARATED)
│   ├── api/, auth/, common/, components/
├── hooks/                     # Global reusable hooks
├── utils/, services/, lib/
```

## 🔧 Component Generation Rules

### Before Creating ANY Component

1. **Estimate final line count** - if >200 lines, plan sub-components
2. **Create types file FIRST** (`component-name.types.ts`)
3. **Determine feature vs UI placement**
4. **Plan accessibility from start**
5. **Consider mobile responsiveness**

### Mandatory Component Structure

```typescript
// 1. Imports (organized)
import React from 'react'
import { externalLibs } from 'external'

import { internalUtils } from '@/lib/utils'

import type { ComponentProps } from './component.types'

import { internalComponents } from '@/components'

// 2. Component (MAX 250 lines implementation)
export function ComponentName(props: ComponentProps) {
  // Hooks (max 5-7)
  // Logic (extract if >50 lines)
  // Event handlers (extract if >3 handlers)
  // Early returns/guards
  // Render (extract sub-components if >50 lines JSX)

  return <div>{/* JSX */}</div>
}

export default ComponentName
```

### Refactoring Triggers (IMMEDIATE ACTION REQUIRED)

- **File approaches 200 lines**: Plan refactoring
- **File reaches 300 lines**: STOP and refactor immediately
- **Component has >7 props**: Consider composition/reducer
- **More than 5 hooks**: Extract custom hooks
- **JSX nesting >3 levels**: Extract sub-components
- **Event handlers >50 lines**: Extract to hooks
- **Duplicate logic**: Extract utilities/hooks

## 🏗️ Architecture Patterns

### Feature-Based Organization

- Complex components (>100 lines) go in `features/`
- Simple UI components (<100 lines) go in `ui/`
- Group related functionality together
- Co-locate types, hooks, and sub-components

### Composition Over Size

```typescript
// ❌ BAD: Large monolithic component
export function LargeComponent() {
  // 400+ lines of everything
}

// ✅ GOOD: Composed smaller components
export function MainComponent() {
  return (
    <div>
      <ComponentHeader />
      <ComponentBody />
      <ComponentFooter />
    </div>
  )
}
```

### Performance & Quality Standards

- **Lazy load** components >200 lines
- **Error boundaries** for all features
- **Loading states** for all async operations
- **Accessibility** WCAG 2.1 AA compliance
- **Mobile-first** responsive design
- **Test coverage** for all components

## 🧪 Testing Requirements

- **Every component must have tests**
- **Co-locate tests** with components
- **Test user interactions**, not implementation
- **Mock external dependencies**
- **Descriptive test names**

## 📋 Development Workflow

### Code Generation Process

1. **Check existing patterns** first
2. **Create types file** (separate)
3. **Plan component structure** (sub-components if needed)
4. **Implement with size limits in mind**
5. **Add error handling & loading states**
6. **Implement accessibility**
7. **Write tests**
8. **Review against checklist**

### Pre-Commit Checklist (BLOCKERS)

- [ ] **File under 300 lines** (CRITICAL)
- [ ] **Types in separate file**
- [ ] **Correct interface/type usage**
- [ ] **Proper folder organization**
- [ ] **Error handling included**
- [ ] **Loading states implemented**
- [ ] **Accessibility attributes**
- [ ] **Tests written**
- [ ] **No TypeScript errors**
- [ ] **Follows established patterns**

## 🔍 Code Review Standards

### Automatic Rejection Criteria

- Files exceeding 300 lines
- Missing type definition files
- Incorrect interface/type usage
- No error handling for async operations
- Missing accessibility attributes
- No tests
- Poor folder organization

### Quality Gates

- TypeScript strict mode compliance
- ESLint/Prettier formatted
- Bundle size impact considered
- Performance implications reviewed
- Accessibility tested

## 🎨 Styling Standards

- **Tailwind CSS only** - no custom CSS
- **Use `cn()` utility** for conditional classes
- **Mobile-first** responsive design
- **Consistent spacing** scale (4, 8, 12, 16, 24, 32, 48, 64px)
- **Semantic color usage**

## 💡 Best Practices Reminders

### Always Remember

- **Small components are better** than large ones
- **Composition over inheritance**
- **Single responsibility** per component
- **Extract early and often**
- **Types first, implementation second**
- **Accessibility is not optional**
- **Performance matters**
- **Tests are mandatory**

### Common Extraction Patterns

- **Custom hooks** for complex state logic
- **Utility functions** for pure calculations
- **Sub-components** for repeated JSX patterns
- **Constants** for magic numbers/strings
- **Types** for reusable type definitions

## 🚀 Quick Reference

### Commands to Run

- Type check: `npm run type-check` or `npx tsc --noEmit`
- Lint: `npm run lint`
- Test: `npm run test`
- Build: `npm run build`

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `use-hook-name.ts`
- Utils: `kebab-case.ts`
- Types: `component-name.types.ts`
- Tests: `component-name.test.tsx`

### Import Order

1. React/Next.js
2. External libraries
3. Internal utilities/services
4. **Types (separate section)**
5. Internal components/hooks

---

**Remember: When in doubt, break it down further! Small, focused components are
always better than large, complex ones.**
