---
type: "always_apply"
---

# TypeScript Standards (STRICT)

## Non-negotiables

1. All component/feature prop types live in separate `.types.ts` files
2. Use `interface` for component props and extensible object shapes
3. Use `type` for unions, primitives, intersections, and function signatures
4. No `any`; prefer precise types or `unknown` with type guards
5. Type-only imports with `import type { ... } from ...`
6. Consistent naming: `ComponentNameProps`, `EventStatus`, `ID`, `Handler`

## Organization

- src/types/
  - components/ ... UI/feature component prop and helper types
  - features/ ... domain types by feature (events, users, registration,
    payments, etc.)
  - common/ ... shared base/utility types (Optional, Nullable, AsyncState,
    Pagination, etc.)
  - api/ ... request/response/error/pagination contracts
- Feature-local types can live under `src/components/features/<feature>/types/`
  when highly specific

## Interface vs type usage

- Interface: component props, models intended for extension
- Type: unions (e.g., `type Status = 'loading' | 'success' | 'error'`), function
  signatures, intersections

## Naming

- Interfaces & types: PascalCase
- Enums: PascalCase enum name with SCREAMING_SNAKE values
- Generic params: T, TData, TResult

## Example patterns

- Props (separate file):
  - `export interface EventCardProps { event: PublicEvent; onSelect?: (e: PublicEvent) => void }`
- Unions:
  - `export type ComponentVariant = 'default' | 'outline' | 'ghost'`
- Function signatures:
  - `export type AsyncHandler<T, R = void> = (data: T) => Promise<R>`

## Type guards

Provide utilities in `src/types/utils/guards.ts` for runtime checks (isString,
isNumber, isObject, isEventStatus, etc.) and use them when handling `unknown`.

## API contracts

- Request/response types live under `src/types/api/`
- Prefer discriminated unions for error handling when needed
- Base shapes: `BaseRequest`, `ApiResponse<T>`, `PaginatedResponse<T>`

## Environment and globals

- Use ambient module augmentation responsibly for third-party libs only (if
  needed)
- Keep environment types in a dedicated file (e.g.,
  `src/types/global/environment.ts`)

## Enforcement checklist

- [ ] No inline prop types in `.tsx`
- [ ] Props use `interface`
- [ ] Union variants use `type`
- [ ] Type-only imports used where applicable
- [ ] Guards present for `unknown`/runtime data
