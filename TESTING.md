# Testing Guide

This document outlines the comprehensive testing setup for the GameOne
application, ensuring code quality and reliability for future development.

## Test Setup Overview

The project uses **Vitest** as the primary testing framework with the following
configuration:

- **Framework**: Vitest with React Testing Library
- **Environment**: jsdom for DOM simulation
- **Coverage**: V8 provider with HTML, JSON, and text reports
- **Mocking**: Built-in Vitest mocking for external dependencies

## Test Structure

```
src/
├── test/
│   ├── setup.ts              # Global test setup and mocks
│   ├── utils.tsx              # Custom render functions and utilities
│   └── __tests__/
│       ├── translations.test.ts    # i18n consistency tests
│       └── integration.test.tsx    # Integration test examples
├── components/
│   ├── auth/__tests__/
│   │   └── auth-buttons.test.tsx
│   └── __tests__/
│       └── language-switcher.test.tsx
├── lib/__tests__/
│   ├── utils.test.ts          # Utility function tests
│   └── prisma.test.ts         # Database utility tests
├── hooks/__tests__/
│   └── use-toast.test.ts      # Custom hook tests
└── app/api/
    ├── health/__tests__/
    │   └── route.test.ts      # Health API tests
    └── auth/me/__tests__/
        └── route.test.ts      # Auth API tests
```

## Running Tests

### Available Commands

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage report
bun run test:coverage

# Open Vitest UI
bun run test:ui
```

### Test Categories

#### 1. Unit Tests

Test individual components, functions, and hooks in isolation.

**Examples:**

- `src/lib/__tests__/utils.test.ts` - Tests the `cn()` utility function
- `src/hooks/__tests__/use-toast.test.ts` - Tests the toast hook functionality
- `src/components/auth/__tests__/auth-buttons.test.tsx` - Tests auth button
  components

#### 2. Integration Tests

Test component interactions and feature workflows.

**Examples:**

- `src/test/__tests__/integration.test.tsx` - Tests auth flow integration
- `src/components/__tests__/language-switcher.test.tsx` - Tests i18n component
  integration

#### 3. API Route Tests

Test Next.js API routes with proper mocking.

**Examples:**

- `src/app/api/health/__tests__/route.test.ts` - Tests health check endpoint
- `src/app/api/auth/me/__tests__/route.test.ts` - Tests user authentication
  endpoint

#### 4. Translation Tests

Ensure i18n consistency and completeness.

**Examples:**

- `src/test/__tests__/translations.test.ts` - Validates translation file
  consistency
- `src/i18n/__tests__/routing.test.ts` - Tests i18n routing configuration

## Test Utilities

### Custom Render Function

The project includes a custom render function with pre-configured providers:

```typescript
import { render, screen } from '@/test/utils'

// Automatically includes all providers
render(<YourComponent />)
```

### Mock Data Factories

Consistent test data creation:

```typescript
import { createMockUser, createMockEvent } from "@/test/utils";

const user = createMockUser({ email: "custom@example.com" });
const event = createMockEvent({ title: "Custom Event" });
```

### Mock Providers

Test components with different auth and i18n states:

```typescript
import { MockAuthProvider, MockI18nProvider } from '@/test/utils'

render(
  <MockAuthProvider isAuthenticated={true}>
    <YourComponent />
  </MockAuthProvider>
)
```

## Mocking Strategy

### External Dependencies

- **Kinde Auth**: Mocked in `setup.ts` with configurable auth states
- **Next-intl**: Mocked with simple key-based translation function
- **Prisma**: Mocked with controllable database responses
- **Next.js Navigation**: Mocked router and navigation functions

### Environment Variables

Test environment variables are set in `setup.ts`:

```typescript
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/testdb";
// ... other test env vars
```

## Coverage Goals

### Current Coverage Targets

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### Coverage Exclusions

The following are excluded from coverage reports:

- `node_modules/`
- `dist/`, `.next/`
- `**/*.d.ts` (TypeScript declarations)
- `**/*.config.{js,ts}` (Configuration files)
- `prisma/` (Database schema and migrations)
- `public/` (Static assets)

## Test Patterns

### Component Testing

```typescript
describe('ComponentName', () => {
  it('renders correctly with default props', () => {
    render(<ComponentName />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('handles user interactions', async () => {
    const user = userEvent.setup()
    render(<ComponentName />)

    await user.click(screen.getByRole('button'))
    expect(mockFunction).toHaveBeenCalled()
  })
})
```

### API Route Testing

```typescript
describe("/api/endpoint", () => {
  it("returns expected data structure", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("expectedField");
  });
});
```

### Hook Testing

```typescript
describe("useCustomHook", () => {
  it("provides expected functionality", () => {
    const { result } = renderHook(() => useCustomHook());

    expect(result.current.someFunction).toBeDefined();

    act(() => {
      result.current.someFunction();
    });

    expect(result.current.someState).toBe("expectedValue");
  });
});
```

## Quality Assurance

### Pre-deployment Checks

The `pre-deploy` script runs all quality checks:

```bash
bun run pre-deploy
```

This includes:

1. Code formatting check
2. ESLint validation
3. TypeScript type checking
4. Test suite execution (add `&& bun run test` to script)

### Continuous Integration

Tests are designed to run in CI environments with:

- Fast execution (jsdom, no browser dependencies)
- Reliable mocking (no external service dependencies)
- Clear failure reporting
- Coverage reporting

## Best Practices

### Writing Tests

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive names**: Test names should explain what's being tested
3. **Single responsibility**: One assertion per test when possible
4. **Mock external dependencies**: Keep tests isolated
5. **Test user behavior**: Focus on what users do, not implementation details

### Maintaining Tests

1. **Update tests with code changes**: Keep tests in sync with implementation
2. **Regular test reviews**: Ensure tests remain valuable
3. **Refactor test utilities**: Share common testing patterns
4. **Monitor coverage**: Maintain good coverage without targeting 100%

### Future Enhancements

1. **E2E Testing**: Consider Playwright for critical user journeys
2. **Visual Regression**: Add screenshot testing for UI components
3. **Performance Testing**: Add performance benchmarks for critical paths
4. **Database Testing**: Add integration tests with test database

## Troubleshooting

### Common Issues

1. **Module resolution**: Ensure path aliases work in test environment
2. **Async operations**: Use proper awaits and waitFor utilities
3. **Mock lifecycle**: Clear mocks between tests
4. **Environment variables**: Set test-specific env vars in setup

### Debugging Tests

1. Use `screen.debug()` to see rendered DOM
2. Add `console.log` for debugging test state
3. Use Vitest UI for interactive debugging
4. Check mock call history with `vi.mocked(fn).mock.calls`

This testing setup ensures that future development can proceed with confidence,
knowing that breaking changes will be caught early and the application maintains
high quality standards.
