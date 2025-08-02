# Database Testing Framework

This comprehensive testing framework validates the GameOne event registration system database implementation against the requirements specified in `registration-system-analysis.md`.

## 📁 Structure

```
tests/
├── setup/                  # Test configuration and setup
│   ├── global-setup.ts    # Global test environment setup
│   └── test-setup.ts      # Per-test database management
├── helpers/               # Test utilities and assertions
│   ├── database.ts        # Database test helper utilities
│   └── assertions.ts      # Custom database assertions
├── fixtures/              # Test data and seeding
│   └── test-seed.ts       # Comprehensive test data generator
├── integration/           # Integration tests
│   ├── registration-workflows.test.ts    # Registration flow tests
│   ├── payment-workflows.test.ts         # Payment system tests
│   ├── capacity-management.test.ts       # Capacity and race condition tests
│   ├── friend-registration.test.ts       # Friend registration tests
│   ├── waiting-list.test.ts              # Waiting list management tests
│   └── data-integrity.test.ts            # Data integrity and constraints
└── performance/           # Performance tests
    └── concurrent-registrations.test.ts  # Load and concurrency tests
```

## 🚀 Quick Start

### Prerequisites

1. **Database Setup**: Ensure you have a test database configured
2. **Environment Variables**: Set `TEST_DATABASE_URL` or `DATABASE_URL`
3. **Dependencies**: Run `bun install` to install dependencies

### Running Tests

```bash
# Run all database tests
bun run test:db

# Run tests in watch mode
bun run test:db:watch

# Run specific test suites
bun test tests/integration/registration-workflows.test.ts
bun test tests/performance/concurrent-registrations.test.ts

# Generate test data
bun run test:seed

# Generate performance test data
bun run test:seed:performance
```

### Database Health Checks

```bash
# Quick health check
bun run db:health

# Comprehensive validation
bun run db:validate

# Performance benchmark
bun run db:benchmark

# JSON output for CI/CD
bun run db:health:json
```

## 🧪 Test Categories

### 1. Registration Workflows (`registration-workflows.test.ts`)

Tests the complete user registration journey:

- **Individual Registration Flow**: Standard user registration process
- **Guest Registration Flow**: Non-authenticated user registrations
- **Admin Registration Management**: Administrative overrides and management
- **Registration Status Transitions**: Status lifecycle management
- **Registration Data Validation**: Data integrity and validation
- **Concurrent Registration Scenarios**: Race condition handling
- **Registration Business Rules**: Event constraints and rules

**Key Scenarios Tested:**
- User registers when capacity is available
- User prevention from duplicate registrations
- Users added to waiting list when at capacity
- Registration cancellation and capacity recovery
- Guest registrations without user accounts
- Admin bypass of normal registration rules

### 2. Payment Workflows (`payment-workflows.test.ts`)

Tests the payment system implementation:

- **Pending Payment Creation**: QR code generation and payment setup
- **Payment Status Transitions**: Payment lifecycle management
- **Payment Method Support**: QR code, bank transfer, cash payments
- **Group Payment Scenarios**: Multi-participant payment handling
- **Payment Validation**: Amount and data validation
- **Payment Integration**: Links between payments and registrations

**Key Scenarios Tested:**
- QR code generation with unique variable symbols
- Payment status transitions (awaiting → received → processed)
- Group payment amount calculations
- Payment expiration handling
- Payment to registration conversion workflow

### 3. Capacity Management (`capacity-management.test.ts`)

Tests event capacity limits and concurrent access:

- **Basic Capacity Management**: Registration counting and limits
- **Capacity Limit Enforcement**: Prevention of over-registration
- **Concurrent Registration Scenarios**: Race condition handling
- **Group Registration Capacity Impact**: Group size calculations
- **Capacity Edge Cases**: Zero capacity, large capacity scenarios
- **Capacity Recovery Scenarios**: Cancellation and expiration handling

**Key Scenarios Tested:**
- Confirmed registrations count toward capacity
- Verified pending payments count toward capacity
- Unverified pending payments don't count
- Concurrent registrations for last available spot
- Capacity recovery when registrations are cancelled

### 4. Friend Registration (`friend-registration.test.ts`)

Tests group and friend registration functionality:

- **Basic Friend Registration**: Group registration with friend data
- **Friend Pending Payments**: Group payment processing
- **Friend Data Validation**: Complex friend information storage
- **Complex Friend Registration Scenarios**: Large groups and edge cases
- **Friend Registration Business Rules**: Duplicate prevention and limits
- **Friend Registration Data Integrity**: Consistency across tables

**Key Scenarios Tested:**
- Group registration with friend data storage
- Friend data preservation through payment workflow
- Large group registration handling
- Friend data modification and cancellation
- Mixed individual and group registrations

### 5. Waiting List Management (`waiting-list.test.ts`)

Tests waiting list functionality and promotion logic:

- **Basic Waiting List Management**: Position tracking and ordering
- **Waiting List Position Management**: Position updates and gaps
- **Waiting List Promotion Logic**: Automatic promotion workflows
- **Multiple Event Waiting Lists**: Cross-event waiting list isolation
- **Waiting List Edge Cases**: Zero capacity and position gaps
- **Waiting List Data Consistency**: Referential integrity

**Key Scenarios Tested:**
- Users added to waiting list when event is full
- Position numbering maintenance
- Promotion workflow from waiting list to registration
- Group waiting list entries
- Cross-event waiting list independence

### 6. Data Integrity (`data-integrity.test.ts`)

Tests database constraints and data consistency:

- **Foreign Key Constraints**: Referential integrity enforcement
- **Unique Constraints**: Duplicate prevention
- **Required Field Validation**: Mandatory field enforcement
- **Cascade Behavior**: Deletion and update propagation
- **Data Type Validation**: Format and type checking
- **Relationship Integrity**: Complex relationship validation

**Key Scenarios Tested:**
- Foreign key constraint enforcement
- Unique constraint violations
- Cascade deletion behavior
- Enum value validation
- JSON data structure validation

### 7. Performance Testing (`concurrent-registrations.test.ts`)

Tests system performance under load:

- **Concurrent Registration Creation**: Simultaneous registration handling
- **Concurrent Payment Processing**: Payment verification under load
- **Concurrent Waiting List Operations**: Waiting list management under load
- **Database Query Performance**: Query optimization validation
- **Stress Testing**: High-volume scenarios
- **Performance Benchmarking**: Response time measurement

**Key Scenarios Tested:**
- 10+ simultaneous registrations
- Concurrent capacity checking
- Mixed operations under load
- Query performance with large datasets
- Stress testing with 100+ operations

## 🛠️ Test Utilities

### Database Helper (`helpers/database.ts`)

Provides utilities for test data creation:

```typescript
import { dbHelper } from '../helpers/database'

// Create test scenario with users, events, bank accounts
const testData = await dbHelper.createTestScenario({
  userCount: 10,
  eventCapacity: 5,
  registrationCount: 3,
  waitingListCount: 2,
  pendingPaymentCount: 2
})

// Create individual test objects
const user = await dbHelper.createTestUser({ email: 'test@example.com' })
const event = await dbHelper.createTestEvent(creatorId, { capacity: 50 })
const registration = await dbHelper.createTestRegistration(eventId, userId)
```

### Database Assertions (`helpers/assertions.ts`)

Provides domain-specific assertions:

```typescript
import { dbAssert } from '../helpers/assertions'

// Verify registration status
await dbAssert.expectRegistrationStatus(registrationId, 'CONFIRMED')

// Verify event capacity
await dbAssert.expectEventCapacity(eventId, {
  registeredCount: 5,
  availableSpots: 10
})

// Verify friend registration data
await dbAssert.expectFriendRegistrationData(registrationId, friendsArray)

// Verify waiting list order
await dbAssert.expectWaitingListOrder(eventId)
```

### Test Data Seeder (`fixtures/test-seed.ts`)

Generates comprehensive test scenarios:

```typescript
import { TestDataSeeder } from '../fixtures/test-seed'

const seeder = new TestDataSeeder()
await seeder.seedTestData({
  createUsers: true,
  createEvents: true,
  createRegistrationScenarios: true,
  createPaymentScenarios: true,
  createFriendRegistrations: true,
  createWaitingListScenarios: true,
  createPerformanceData: false
})
```

## 📊 Validation Scripts

### Database Validation (`scripts/db-validation.ts`)

Comprehensive database health and integrity check:

```bash
bun run db:validate
```

**Validates:**
- Database connection and schema
- Data integrity and relationships
- Business rule compliance
- Performance benchmarks
- Record counts and distribution

### Health Check (`scripts/db-health-check.ts`)

Quick health check for monitoring:

```bash
bun run db:health        # Human-readable output
bun run db:health:json   # JSON output for automation
```

**Checks:**
- Database connectivity
- Basic query performance
- Critical operations (read/write/transaction)
- Data consistency

### Performance Benchmark (`scripts/db-benchmark.ts`)

Performance testing under controlled load:

```bash
bun run db:benchmark
```

**Benchmarks:**
- User operations (create, lookup)
- Registration operations (create, capacity calculation)
- Payment operations (create, status updates)
- Complex queries with joins and aggregations

## ⚙️ Configuration

### Test Configuration (`vitest.config.ts`)

- **Environment**: Node.js environment for database testing
- **Setup**: Global setup for database initialization
- **Isolation**: Transaction-based test isolation
- **Timeouts**: 30-second timeouts for database operations
- **Coverage**: Comprehensive coverage reporting

### Environment Variables

```bash
# Test database (required)
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/gameone_test"
DIRECT_URL="postgresql://user:password@localhost:5432/gameone_test"

# Optional test configuration
VITEST_LOG_SQL="true"           # Enable SQL query logging
DISABLE_EMAIL_NOTIFICATIONS="true"
DISABLE_SMS_NOTIFICATIONS="true"
LOG_LEVEL="error"               # Reduce log noise during tests
```

## 📈 Test Coverage

The testing framework covers:

- **100% of registration workflows** specified in `registration-system-analysis.md`
- **All payment status transitions** and business rules
- **Complete capacity management** scenarios including edge cases
- **Friend registration workflows** with complex data structures
- **Waiting list management** and promotion logic
- **Database constraints** and integrity rules
- **Performance characteristics** under concurrent load

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Database Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      
      - run: bun install
      - run: bun run db:push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          
      - run: bun run db:health
      - run: bun run test:db
      - run: bun run db:validate
```

## 🔧 Maintenance

### Regular Tasks

1. **Update test data** when schema changes
2. **Add new test scenarios** for new features
3. **Monitor performance benchmarks** for regression detection
4. **Review validation scripts** for new business rules

### Best Practices

1. **Use transactions** for test isolation
2. **Clean up test data** in teardown
3. **Test edge cases** and error conditions
4. **Validate performance** under realistic load
5. **Document complex scenarios** with clear descriptions

## 📝 Schema Validation

The tests validate that the current Prisma schema supports all requirements from `registration-system-analysis.md`:

### ✅ Implemented Features

- Three-table system (PendingPayment, Registration, WaitingList)
- Payment status tracking and transitions
- Friend registration with JSON data storage
- Capacity management with proper counting
- Waiting list position management
- QR code generation and variable symbols
- Bank account integration
- Guest registration support

### ⚠️ Architecture Notes

The current schema uses `PendingPaymentStatus` enum instead of the `RegistrationPaymentStatus` specified in the analysis. This is architecturally sound as it separates pending payments from registrations, but the status transitions must be carefully managed at the application level.

## 🎯 Success Criteria

Tests are considered successful when:

- **All integration tests pass** with proper data flow
- **Performance tests** complete within acceptable timeframes
- **Database validation** reports no integrity issues
- **Health checks** confirm system readiness
- **Capacity management** handles concurrent access correctly
- **Friend registration** preserves data integrity
- **Payment workflows** complete successfully
- **Waiting list logic** maintains correct ordering

This testing framework ensures the database can reliably handle the complex friend registration workflows, payment processing, and capacity management as outlined in the registration system analysis.