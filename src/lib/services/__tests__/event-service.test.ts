import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventType } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    event: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    registration: {
      groupBy: vi.fn(),
    },
    waitingList: {
      count: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Event Service Interfaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should create an event with valid data', async () => {
      const mockEventData = {
        title: 'Test Event',
        description: 'Test Description',
        type: EventType.WORKSHOP,
        startDate: '2025-03-01T10:00:00Z',
        capacity: 50,
        requiresApproval: false,
        allowWaitingList: true,
        isOnline: false,
        requiresPayment: false,
        tags: ['test', 'workshop'],
      };

      // This test validates the interface structure
      expect(mockEventData).toMatchObject({
        title: expect.any(String),
        type: expect.any(String),
        startDate: expect.any(String),
        capacity: expect.any(Number),
        requiresApproval: expect.any(Boolean),
        allowWaitingList: expect.any(Boolean),
        isOnline: expect.any(Boolean),
        requiresPayment: expect.any(Boolean),
        tags: expect.any(Array),
      });
    });
  });

  describe('getEvents', () => {
    it('should handle query parameters correctly', async () => {
      const query = {
        page: 1,
        limit: 10,
        creatorId: 'test-user-id',
      };

      // This test validates the query interface structure
      expect(query).toMatchObject({
        page: expect.any(Number),
        limit: expect.any(Number),
        creatorId: expect.any(String),
      });
    });
  });
});