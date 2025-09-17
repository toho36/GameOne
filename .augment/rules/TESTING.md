---
type: "always_apply"
---

# Testing Strategy (Vitest + RTL)

## Tools

- Vitest (configured via `vitest.config.ts`)
- @testing-library/react, @testing-library/user-event, @testing-library/jest-dom
- jsdom test environment

## Locations

- Component tests near component or under `src/test`
- Hook and util tests co-located or under `src/test`
- Keep test files small and focused; 1 behavior per test where possible

## Principles

- Test user-observable behavior, not implementation details
- Cover loading, error, empty, and success states
- Mock network via ky layer boundaries (prefer mocking `getJson/postJson`)
- Mock timers/dates when appropriate

## Component test skeleton

```ts
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventCard } from '@/components/features/events/event-card'

describe('EventCard', () => {
  it('renders title and description', () => {
    render(<EventCard event={{ id: '1', title: 'T', description: 'D' } as any} />)
    expect(screen.getByText('T')).toBeInTheDocument()
    expect(screen.getByText('D')).toBeInTheDocument()
  })
})
```

## Hook test skeleton

```ts
import { renderHook, act } from '@testing-library/react'
import { useToast } from '@/hooks/use-toast'

test('useToast exposes toast function', () => {
  const { result } = renderHook(() => useToast())
  act(() => result.current.toast({ title: 'Hello' }))
  // assert side-effect or state in provider
})
```

## API route tests (optional light coverage)

- Prefer integration via feature hooks/components where feasible
- If testing routes directly, validate status codes and JSON shape

## Coverage

- Target critical UI paths and business logic
- Keep tests fast and deterministic

## Commands

- `bun run test`
- `bun run test:coverage`
- `bun run test:ui` (when needed)

## Checklist

- [ ] Tests for new components/hooks
- [ ] States covered: loading/error/empty/success
- [ ] Mocks confined to external boundaries (network/time)
- [ ] No reliance on implementation details
