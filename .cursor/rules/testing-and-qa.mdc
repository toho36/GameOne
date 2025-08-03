---
description: Testing and Quality Assurance Rules
alwaysApply: false
---

# Testing and Quality Assurance Rules

## Overview

This document defines comprehensive testing strategies, quality assurance patterns, and validation processes for the GameOne event management system. These rules ensure high code quality, reliability, and maintainability through systematic testing approaches.

## Testing Strategy

### Testing Pyramid

```
                    /\
                   /  \
                  /E2E \     <- Few, High-Value
                 /Tests \
                /________\
               /          \
              / Integration \  <- Some, Key Flows
             /    Tests     \
            /________________\
           /                  \
          /    Unit Tests      \  <- Many, Fast, Isolated
         /____________________\
```

### Test Categories and Coverage Targets

- **Unit Tests**: 90%+ coverage of business logic
- **Integration Tests**: 80%+ coverage of API endpoints and database operations
- **End-to-End Tests**: 70%+ coverage of critical user journeys
- **Performance Tests**: All API endpoints and critical workflows
- **Security Tests**: All input validation and authentication flows

## Testing Framework Configuration

### Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Environment setup
    environment: 'node',
    setupFiles: ['./src/lib/testing/setup.ts'],
    globalSetup: ['./src/lib/testing/global-setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/lib/testing/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/migrations/',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 90,
          lines: 85,
          statements: 85
        },
        'src/lib/': {
          branches: 90,
          functions: 95,
          lines: 90,
          statements: 90
        }
      }
    },

    // Test execution
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },

    // File patterns
    include: [
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      '__tests__/**/*.{js,ts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'e2e'
    ]
  },

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/tests': path.resolve(__dirname, './src/lib/testing')
    }
  }
});
```

### Test Setup Configuration

```typescript
// src/lib/testing/setup.ts
import { beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';
import { setupTestDatabase, cleanTestDatabase, teardownTestDatabase } from './database';
import { mockAuth } from './mocks/auth';
import { mockPayments } from './mocks/payments';
import { mockNotifications } from './mocks/notifications';

// Global test setup
beforeAll(async () => {
  // Setup test database
  await setupTestDatabase();

  // Setup global mocks
  mockAuth();
  mockPayments();
  mockNotifications();

  // Mock environment variables
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_ANALYTICS = 'false';
  process.env.ENABLE_PUSH_NOTIFICATIONS = 'false';
});

beforeEach(async () => {
  // Clean database before each test
  await cleanTestDatabase();

  // Reset all mocks
  vi.clearAllMocks();

  // Mock console methods to avoid noise in test output
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  // Restore console methods
  vi.restoreAllMocks();
});

afterAll(async () => {
  // Cleanup test database
  await teardownTestDatabase();
});

// Global test utilities
declare global {
  var testUtils: {
    createMockUser: () => Promise<User>;
    createMockEvent: () => Promise<Event>;
    createMockRegistration: () => Promise<Registration>;
    loginAs: (user: User) => string;
  };
}

globalThis.testUtils = {
  createMockUser: async () => {
    const userData = createMockUserData();
    return await testPrisma.user.create({ data: userData });
  },

  createMockEvent: async () => {
    const user = await globalThis.testUtils.createMockUser();
    const category = await testPrisma.eventCategory.create({
      data: createMockEventCategoryData()
    });

    const eventData = createMockEventData({
      createdById: user.id,
      categoryId: category.id
    });

    return await testPrisma.event.create({ data: eventData });
  },

  createMockRegistration: async () => {
    const user = await globalThis.testUtils.createMockUser();
    const event = await globalThis.testUtils.createMockEvent();

    const registrationData = createMockRegistrationData({
      userId: user.id,
      eventId: event.id
    });

    return await testPrisma.registration.create({ data: registrationData });
  },

  loginAs: (user: User) => {
    return generateTestToken(user);
  }
};
```

## Unit Testing Patterns

### Service Layer Testing

```typescript
// src/lib/services/__tests__/event-service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventService } from '../event-service';
import { eventRepository } from '@/lib/repositories/event-repository';
import { notificationService } from '../notification-service';
import { createMockEvent, createMockUser } from '@/lib/testing/mocks';

// Mock dependencies
vi.mock('@/lib/repositories/event-repository');
vi.mock('../notification-service');

describe('EventService', () => {
  let eventService: EventService;
  let mockEventRepository: typeof eventRepository;
  let mockNotificationService: typeof notificationService;

  beforeEach(() => {
    eventService = new EventService();
    mockEventRepository = vi.mocked(eventRepository);
    mockNotificationService = vi.mocked(notificationService);
  });

  describe('createEvent', () => {
    it('should create event successfully', async () => {
      // Arrange
      const user = createMockUser();
      const eventData = createMockEvent();
      const expectedEvent = { ...eventData, id: 'event-123' };

      mockEventRepository.create.mockResolvedValue(expectedEvent);
      mockNotificationService.sendEventCreatedNotification.mockResolvedValue();

      // Act
      const result = await eventService.createEvent(eventData, user);

      // Assert
      expect(result).toEqual(expectedEvent);
      expect(mockEventRepository.create).toHaveBeenCalledWith(eventData);
      expect(mockNotificationService.sendEventCreatedNotification).toHaveBeenCalledWith(
        expectedEvent,
        user
      );
    });

    it('should handle validation errors', async () => {
      // Arrange
      const user = createMockUser();
      const invalidEventData = { ...createMockEvent(), title: '' };

      // Act & Assert
      await expect(
        eventService.createEvent(invalidEventData, user)
      ).rejects.toThrow('Title is required');

      expect(mockEventRepository.create).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      // Arrange
      const user = createMockUser();
      const eventData = createMockEvent();

      mockEventRepository.create.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(
        eventService.createEvent(eventData, user)
      ).rejects.toThrow('Database connection failed');

      expect(mockNotificationService.sendEventCreatedNotification).not.toHaveBeenCalled();
    });
  });

  describe('registerForEvent', () => {
    it('should register user successfully', async () => {
      // Arrange
      const user = createMockUser();
      const event = createMockEvent({ maxParticipants: 100 });
      const registrationData = {
        numberOfGuests: 2,
        specialRequirements: 'Vegetarian meal'
      };

      mockEventRepository.findById.mockResolvedValue(event);
      mockEventRepository.getAvailableSpots.mockResolvedValue(50);

      const expectedRegistration = {
        id: 'reg-123',
        userId: user.id,
        eventId: event.id,
        ...registrationData
      };

      vi.mocked(registrationRepository.create).mockResolvedValue(expectedRegistration);

      // Act
      const result = await eventService.registerForEvent(
        event.id,
        user,
        registrationData
      );

      // Assert
      expect(result).toEqual(expectedRegistration);
      expect(mockEventRepository.getAvailableSpots).toHaveBeenCalledWith(event.id);
    });

    it('should reject registration when event is full', async () => {
      // Arrange
      const user = createMockUser();
      const event = createMockEvent({ maxParticipants: 10 });

      mockEventRepository.findById.mockResolvedValue(event);
      mockEventRepository.getAvailableSpots.mockResolvedValue(0);

      // Act & Assert
      await expect(
        eventService.registerForEvent(event.id, user, { numberOfGuests: 1 })
      ).rejects.toThrow('Event is full');
    });
  });

  describe('cancelRegistration', () => {
    it('should cancel registration successfully', async () => {
      // Arrange
      const user = createMockUser();
      const registration = createMockRegistration({
        userId: user.id,
        status: 'CONFIRMED'
      });

      vi.mocked(registrationRepository.findById).mockResolvedValue(registration);
      vi.mocked(registrationRepository.update).mockResolvedValue({
        ...registration,
        status: 'CANCELLED'
      });

      // Act
      const result = await eventService.cancelRegistration(registration.id, user);

      // Assert
      expect(result.status).toBe('CANCELLED');
      expect(vi.mocked(registrationRepository.update)).toHaveBeenCalledWith(
        registration.id,
        { status: 'CANCELLED', cancelledAt: expect.any(Date) }
      );
    });

    it('should enforce cancellation deadline', async () => {
      // Arrange
      const user = createMockUser();
      const pastEvent = createMockEvent({
        startDate: new Date('2023-01-01')
      });
      const registration = createMockRegistration({
        userId: user.id,
        event: pastEvent
      });

      vi.mocked(registrationRepository.findById).mockResolvedValue(registration);

      // Act & Assert
      await expect(
        eventService.cancelRegistration(registration.id, user)
      ).rejects.toThrow('Cancellation deadline has passed');
    });
  });
});
```

### Repository Testing

```typescript
// src/lib/repositories/__tests__/event-repository.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { eventRepository } from '../event-repository';
import { setupTestDatabase, cleanTestDatabase } from '@/lib/testing/database';
import { createMockEventData, createMockUserData, createMockEventCategoryData } from '@/lib/testing/mocks';

describe('EventRepository', () => {
  beforeEach(async () => {
    await cleanTestDatabase();
  });

  describe('create', () => {
    it('should create event with all required fields', async () => {
      // Arrange
      const user = await testPrisma.user.create({
        data: createMockUserData()
      });
      const category = await testPrisma.eventCategory.create({
        data: createMockEventCategoryData()
      });

      const eventData = createMockEventData({
        categoryId: category.id,
        createdById: user.id
      });

      // Act
      const event = await eventRepository.create(eventData);

      // Assert
      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.title).toBe(eventData.title);
      expect(event.categoryId).toBe(category.id);
      expect(event.createdById).toBe(user.id);
      expect(event.createdAt).toBeInstanceOf(Date);
      expect(event.updatedAt).toBeInstanceOf(Date);
    });

    it('should set default values correctly', async () => {
      // Arrange
      const user = await testUtils.createMockUser();
      const category = await testPrisma.eventCategory.create({
        data: createMockEventCategoryData()
      });

      const minimalEventData = {
        title: 'Test Event',
        description: 'Test Description',
        startDate: new Date(),
        endDate: new Date(),
        categoryId: category.id,
        createdById: user.id
      };

      // Act
      const event = await eventRepository.create(minimalEventData);

      // Assert
      expect(event.status).toBe('DRAFT');
      expect(event.currency).toBe('EUR');
      expect(event.isPrivate).toBe(false);
      expect(event.requiresApproval).toBe(false);
      expect(event.allowGuests).toBe(false);
      expect(event.tags).toEqual([]);
    });
  });

  describe('findWithFilters', () => {
    it('should filter events by status', async () => {
      // Arrange
      const user = await testUtils.createMockUser();
      const category = await testPrisma.eventCategory.create({
        data: createMockEventCategoryData()
      });

      const publishedEvent = await eventRepository.create({
        ...createMockEventData(),
        status: 'PUBLISHED',
        categoryId: category.id,
        createdById: user.id
      });

      const draftEvent = await eventRepository.create({
        ...createMockEventData(),
        status: 'DRAFT',
        categoryId: category.id,
        createdById: user.id
      });

      // Act
      const publishedEvents = await eventRepository.findWithFilters({
        status: 'PUBLISHED'
      });
      const draftEvents = await eventRepository.findWithFilters({
        status: 'DRAFT'
      });

      // Assert
      expect(publishedEvents).toHaveLength(1);
      expect(publishedEvents[0].id).toBe(publishedEvent.id);
      expect(draftEvents).toHaveLength(1);
      expect(draftEvents[0].id).toBe(draftEvent.id);
    });

    it('should filter events by date range', async () => {
      // Arrange
      const user = await testUtils.createMockUser();
      const category = await testPrisma.eventCategory.create({
        data: createMockEventCategoryData()
      });

      const futureEvent = await eventRepository.create({
        ...createMockEventData(),
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-02'),
        categoryId: category.id,
        createdById: user.id
      });

      const pastEvent = await eventRepository.create({
        ...createMockEventData(),
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-02'),
        categoryId: category.id,
        createdById: user.id
      });

      // Act
      const eventsInRange = await eventRepository.findWithFilters({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31')
      });

      // Assert
      expect(eventsInRange).toHaveLength(1);
      expect(eventsInRange[0].id).toBe(futureEvent.id);
    });
  });

  describe('getAvailableSpots', () => {
    it('should calculate available spots correctly', async () => {
      // Arrange
      const event = await testUtils.createMockEvent();
      await testPrisma.event.update({
        where: { id: event.id },
        data: { maxParticipants: 10 }
      });

      // Create confirmed registrations
      const user1 = await testUtils.createMockUser();
      const user2 = await testUtils.createMockUser();

      await testPrisma.registration.createMany({
        data: [
          {
            eventId: event.id,
            userId: user1.id,
            status: 'CONFIRMED',
            numberOfGuests: 0
          },
          {
            eventId: event.id,
            userId: user2.id,
            status: 'CONFIRMED',
            numberOfGuests: 2
          }
        ]
      });

      // Act
      const availableSpots = await eventRepository.getAvailableSpots(event.id);

      // Assert
      expect(availableSpots).toBe(8); // 10 - 2 registrations
    });

    it('should return null for unlimited events', async () => {
      // Arrange
      const event = await testUtils.createMockEvent();
      await testPrisma.event.update({
        where: { id: event.id },
        data: { maxParticipants: null }
      });

      // Act
      const availableSpots = await eventRepository.getAvailableSpots(event.id);

      // Assert
      expect(availableSpots).toBeNull();
    });
  });
});
```

## Integration Testing

### API Endpoint Testing

```typescript
// src/app/api/events/__tests__/route.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { createMockRequest } from '@/lib/testing/utils';

describe('/api/events', () => {
  describe('GET', () => {
    it('should return paginated events', async () => {
      // Arrange
      const user = await testUtils.createMockUser();
      await Promise.all([
        testUtils.createMockEvent(),
        testUtils.createMockEvent(),
        testUtils.createMockEvent()
      ]);

      const request = createMockRequest('GET', '/api/events?page=1&limit=2');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBe(3);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(2);
      expect(data.pagination.hasNext).toBe(true);
    });

    it('should filter events by status', async () => {
      // Arrange
      const user = await testUtils.createMockUser();
      const category = await testPrisma.eventCategory.create({
        data: createMockEventCategoryData()
      });

      await testPrisma.event.createMany({
        data: [
          {
            ...createMockEventData(),
            status: 'PUBLISHED',
            categoryId: category.id,
            createdById: user.id
          },
          {
            ...createMockEventData(),
            status: 'DRAFT',
            categoryId: category.id,
            createdById: user.id
          }
        ]
      });

      const request = createMockRequest('GET', '/api/events?status=PUBLISHED');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe('PUBLISHED');
    });

    it('should handle search queries', async () => {
      // Arrange
      const user = await testUtils.createMockUser();
      const category = await testPrisma.eventCategory.create({
        data: createMockEventCategoryData()
      });

      const searchableEvent = await testPrisma.event.create({
        data: {
          ...createMockEventData(),
          title: 'React Workshop 2024',
          description: 'Learn modern React patterns',
          categoryId: category.id,
          createdById: user.id
        }
      });

      await testPrisma.event.create({
        data: {
          ...createMockEventData(),
          title: 'Vue Conference',
          description: 'Vue.js latest features',
          categoryId: category.id,
          createdById: user.id
        }
      });

      const request = createMockRequest('GET', '/api/events?search=React');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].title).toBe('React Workshop 2024');
    });
  });

  describe('POST', () => {
    it('should create event with valid data', async () => {
      // Arrange
      const user = await testUtils.createMockUser();
      const category = await testPrisma.eventCategory.create({
        data: createMockEventCategoryData()
      });

      const eventData = {
        title: 'New Event',
        description: 'Event description',
        startDate: new Date('2025-06-01').toISOString(),
        endDate: new Date('2025-06-02').toISOString(),
        categoryId: category.id,
        maxParticipants: 50,
        price: 25.00
      };

      const token = testUtils.loginAs(user);
      const request = createMockRequest('POST', '/api/events', eventData, {
        Authorization: `Bearer ${token}`
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(eventData.title);
      expect(data.data.createdById).toBe(user.id);
    });

    it('should validate required fields', async () => {
      // Arrange
      const user = await testUtils.createMockUser();
      const invalidEventData = {
        description: 'Missing title'
      };

      const token = testUtils.loginAs(user);
      const request = createMockRequest('POST', '/api/events', invalidEventData, {
        Authorization: `Bearer ${token}`
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details.fieldErrors.title).toBeDefined();
    });

    it('should require authentication', async () => {
      // Arrange
      const eventData = createMockEventData();
      const request = createMockRequest('POST', '/api/events', eventData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should check permissions', async () => {
      // Arrange
      const userWithoutPermissions = await testPrisma.user.create({
        data: {
          ...createMockUserData(),
          // No roles or permissions
        }
      });

      const eventData = createMockEventData();
      const token = testUtils.loginAs(userWithoutPermissions);
      const request = createMockRequest('POST', '/api/events', eventData, {
        Authorization: `Bearer ${token}`
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });
});
```

## End-to-End Testing

### E2E Test Setup (Playwright)

```typescript
// e2e/setup/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';
import { setupTestDatabase } from '../utils/database';

async function globalSetup(config: FullConfig) {
  // Setup test database
  await setupTestDatabase();

  // Start the application in test mode
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Pre-authenticate test users
  await createTestUsers();

  await browser.close();
}

export default globalSetup;
```

### Critical User Journey Tests

```typescript
// e2e/event-registration.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs, createTestEvent } from './utils/helpers';

test.describe('Event Registration Flow', () => {
  test('user can successfully register for an event', async ({ page }) => {
    // Arrange
    const event = await createTestEvent({
      title: 'React Workshop',
      maxParticipants: 20,
      price: 50
    });

    await loginAs(page, 'user@example.com');

    // Act - Navigate to event page
    await page.goto(`/events/${event.id}`);

    // Verify event details are displayed
    await expect(page.locator('h1')).toContainText('React Workshop');
    await expect(page.locator('[data-testid=event-price]')).toContainText('€50');

    // Start registration
    await page.click('[data-testid=register-button]');

    // Fill registration form
    await page.fill('[data-testid=guest-count]', '2');
    await page.fill('[data-testid=special-requirements]', 'Vegetarian meal');

    // Accept terms
    await page.check('[data-testid=accept-terms]');

    // Continue to payment
    await page.click('[data-testid=continue-payment]');

    // Select payment method
    await page.click('[data-testid=payment-method-bank-transfer]');

    // Complete registration
    await page.click('[data-testid=complete-registration]');

    // Assert - Verify success
    await expect(page.locator('[data-testid=success-message]')).toBeVisible();
    await expect(page.locator('[data-testid=registration-id]')).toBeVisible();

    // Verify user receives confirmation email
    const emails = await getTestEmails();
    expect(emails).toContainEqual(
      expect.objectContaining({
        to: 'user@example.com',
        subject: expect.stringContaining('Registration Confirmation')
      })
    );
  });

  test('user cannot register when event is full', async ({ page }) => {
    // Arrange
    const event = await createTestEvent({
      title: 'Limited Workshop',
      maxParticipants: 1
    });

    // Fill the event
    await createTestRegistration({
      eventId: event.id,
      status: 'CONFIRMED'
    });

    await loginAs(page, 'user@example.com');

    // Act
    await page.goto(`/events/${event.id}`);

    // Assert
    await expect(page.locator('[data-testid=register-button]')).toBeDisabled();
    await expect(page.locator('[data-testid=event-full-message]')).toBeVisible();
  });

  test('user can join waiting list when event is full', async ({ page }) => {
    // Arrange
    const event = await createTestEvent({
      title: 'Popular Workshop',
      maxParticipants: 1,
      allowWaitingList: true
    });

    await createTestRegistration({
      eventId: event.id,
      status: 'CONFIRMED'
    });

    await loginAs(page, 'user@example.com');

    // Act
    await page.goto(`/events/${event.id}`);
    await page.click('[data-testid=join-waiting-list]');

    // Assert
    await expect(page.locator('[data-testid=waiting-list-success]')).toBeVisible();
    await expect(page.locator('[data-testid=waiting-list-position]')).toContainText('1');
  });

  test('user can cancel registration within deadline', async ({ page }) => {
    // Arrange
    const event = await createTestEvent({
      title: 'Cancellable Event',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    const user = await createTestUser('user@example.com');
    const registration = await createTestRegistration({
      eventId: event.id,
      userId: user.id,
      status: 'CONFIRMED'
    });

    await loginAs(page, 'user@example.com');

    // Act
    await page.goto('/my-registrations');
    await page.click(`[data-testid=cancel-registration-${registration.id}]`);

    // Confirm cancellation
    await page.click('[data-testid=confirm-cancellation]');

    // Assert
    await expect(page.locator('[data-testid=cancellation-success]')).toBeVisible();

    // Verify registration status is updated
    await page.reload();
    await expect(page.locator(`[data-testid=registration-${registration.id}] [data-testid=status]`))
      .toContainText('Cancelled');
  });
});
```

## Performance Testing

### Load Testing with Artillery

```yaml
# artillery/load-test.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 100
      name: "Sustained high load"
  defaults:
    headers:
      Content-Type: "application/json"

scenarios:
  - name: "Event browsing"
    weight: 60
    flow:
      - get:
          url: "/api/events"
          capture:
            - json: "$.data[0].id"
              as: "eventId"
      - get:
          url: "/api/events/{{ eventId }}"
      - think: 2

  - name: "Event registration"
    weight: 30
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test{{ $randomInt(1, 1000) }}@example.com"
            password: "testpassword"
          capture:
            - json: "$.token"
              as: "authToken"
      - get:
          url: "/api/events"
          headers:
            Authorization: "Bearer {{ authToken }}"
      - post:
          url: "/api/registrations"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            eventId: "{{ $randomString() }}"
            numberOfGuests: "{{ $randomInt(0, 3) }}"

  - name: "Event management"
    weight: 10
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "admin@example.com"
            password: "adminpassword"
          capture:
            - json: "$.token"
              as: "adminToken"
      - get:
          url: "/api/admin/events"
          headers:
            Authorization: "Bearer {{ adminToken }}"
      - post:
          url: "/api/events"
          headers:
            Authorization: "Bearer {{ adminToken }}"
          json:
            title: "Test Event {{ $randomString() }}"
            description: "Performance test event"
            startDate: "{{ $randomISOTimestamp() }}"
            endDate: "{{ $randomISOTimestamp() }}"
```

### Database Performance Testing

```typescript
// src/lib/testing/performance/database.test.ts
import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';
import { eventRepository } from '@/lib/repositories/event-repository';
import { createBulkTestData } from '../utils/bulk-data';

describe('Database Performance', () => {
  it('should handle large dataset queries efficiently', async () => {
    // Arrange - Create 10,000 events
    await createBulkTestData({
      events: 10000,
      users: 1000,
      registrations: 50000
    });

    // Act - Measure query performance
    const startTime = performance.now();

    const result = await eventRepository.findManyPaginated({
      pagination: { page: 1, limit: 20 },
      sort: { field: 'startDate', direction: 'desc' },
      where: { status: 'PUBLISHED' }
    });

    const endTime = performance.now();
    const queryTime = endTime - startTime;

    // Assert - Query should complete within reasonable time
    expect(queryTime).toBeLessThan(100); // 100ms
    expect(result.data).toHaveLength(20);
    expect(result.pagination.total).toBeGreaterThan(0);
  });

  it('should efficiently handle concurrent registrations', async () => {
    // Arrange
    const event = await testUtils.createMockEvent();
    const users = await Promise.all(
      Array.from({ length: 100 }, () => testUtils.createMockUser())
    );

    // Act - Simulate concurrent registrations
    const startTime = performance.now();

    const registrationPromises = users.map(user =>
      eventRepository.createRegistration({
        eventId: event.id,
        userId: user.id,
        numberOfGuests: 0
      })
    );

    const results = await Promise.allSettled(registrationPromises);

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Assert
    expect(totalTime).toBeLessThan(5000); // 5 seconds for 100 concurrent registrations

    const successfulRegistrations = results.filter(
      result => result.status === 'fulfilled'
    );

    expect(successfulRegistrations.length).toBeGreaterThan(0);
  });
});
```

## Security Testing

### Input Validation Testing

```typescript
// src/lib/security/__tests__/validation.test.ts
import { describe, it, expect } from 'vitest';
import { SecurityValidator } from '../validation';

describe('SecurityValidator', () => {
  describe('sanitizeInput', () => {
    it('should remove SQL injection patterns', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'/*",
        "' UNION SELECT * FROM passwords--"
      ];

      maliciousInputs.forEach(input => {
        const sanitized = SecurityValidator.sanitizeInput(input);
        expect(sanitized).not.toContain("'");
        expect(sanitized).not.toContain(';');
        expect(sanitized).not.toContain('--');
      });
    });

    it('should remove XSS patterns', () => {
      const xssInputs = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("xss")',
        '<svg onload="alert(1)">'
      ];

      xssInputs.forEach(input => {
        const sanitized = SecurityValidator.sanitizeHtml(input);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onload');
      });
    });
  });

  describe('validateFile', () => {
    it('should reject files that are too large', () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt', {
        type: 'text/plain'
      });

      const result = SecurityValidator.validateFile(largeFile);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('File too large');
    });

    it('should reject unauthorized file types', () => {
      const executableFile = new File(['malicious'], 'virus.exe', {
        type: 'application/octet-stream'
      });

      const result = SecurityValidator.validateFile(executableFile);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('File type not allowed');
    });
  });
});
```

### Authentication Testing

```typescript
// src/lib/auth/__tests__/security.test.ts
import { describe, it, expect } from 'vitest';
import { AuthService } from '../auth-service';
import { createMockRequest } from '@/lib/testing/utils';

describe('Authentication Security', () => {
  describe('token validation', () => {
    it('should reject expired tokens', async () => {
      const expiredToken = generateTestToken({
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      });

      const result = await AuthService.validateToken(expiredToken);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should reject tokens with invalid signatures', async () => {
      const tamperedToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.tampered.signature';

      const result = await AuthService.validateToken(tamperedToken);

      expect(result.valid).toBe(false);
    });

    it('should reject tokens from wrong issuer', async () => {
      const maliciousToken = generateTestToken({
        iss: 'https://malicious-issuer.com'
      });

      const result = await AuthService.validateToken(maliciousToken);

      expect(result.valid).toBe(false);
    });
  });

  describe('rate limiting', () => {
    it('should block excessive login attempts', async () => {
      const requests = Array.from({ length: 6 }, () =>
        createMockRequest('POST', '/api/auth/login', {
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      );

      const responses = [];
      for (const request of requests) {
        const response = await AuthService.login(request);
        responses.push(response);
      }

      // First 5 should be allowed (though fail authentication)
      expect(responses.slice(0, 5).every(r => r.status !== 429)).toBe(true);

      // 6th should be rate limited
      expect(responses[5].status).toBe(429);
    });
  });
});
```

## Accessibility Testing

### Automated a11y Testing

```typescript
// src/components/__tests__/accessibility.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { EventCard } from '../features/events/event-card';
import { RegistrationForm } from '../features/registration/registration-form';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('EventCard should have no accessibility violations', async () => {
    const mockEvent = createMockEvent();
    const { container } = render(<EventCard event={mockEvent} />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('RegistrationForm should have proper labels and ARIA attributes', async () => {
    const mockEvent = createMockEvent();
    const { container, getByLabelText } = render(
      <RegistrationForm event={mockEvent} onSubmit={vi.fn()} />
    );

    // Check for proper labeling
    expect(getByLabelText('Number of guests')).toBeInTheDocument();
    expect(getByLabelText('Special requirements')).toBeInTheDocument();

    // Check ARIA attributes
    const form = container.querySelector('form');
    expect(form).toHaveAttribute('aria-describedby');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support keyboard navigation', async () => {
    const { container } = render(<EventCard event={createMockEvent()} />);

    const interactiveElements = container.querySelectorAll(
      'button, [role="button"], a, input, select, textarea'
    );

    interactiveElements.forEach(element => {
      expect(element).toHaveAttribute('tabindex', expect.any(String));
    });
  });
});
```

## Test Data Management

### Test Data Factory

```typescript
// src/lib/testing/factory.ts
export class TestDataFactory {
  private static userCounter = 0;
  private static eventCounter = 0;

  static createUser(overrides: Partial<User> = {}): User {
    this.userCounter++;
    return {
      id: `user-${this.userCounter}`,
      email: `user${this.userCounter}@example.com`,
      name: `Test User ${this.userCounter}`,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  static createEvent(overrides: Partial<Event> = {}): Event {
    this.eventCounter++;
    const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

    return {
      id: `event-${this.eventCounter}`,
      title: `Test Event ${this.eventCounter}`,
      description: `Description for test event ${this.eventCounter}`,
      startDate,
      endDate,
      status: 'PUBLISHED',
      currency: 'EUR',
      isPrivate: false,
      requiresApproval: false,
      allowGuests: true,
      maxGuestsPerRegistration: 3,
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  static createRegistration(overrides: Partial<Registration> = {}): Registration {
    return {
      id: `reg-${Date.now()}`,
      eventId: 'event-1',
      userId: 'user-1',
      status: 'CONFIRMED',
      numberOfGuests: 0,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  static reset(): void {
    this.userCounter = 0;
    this.eventCounter = 0;
  }
}
```

This comprehensive testing framework ensures the GameOne application maintains high quality and reliability through systematic testing at all levels.
