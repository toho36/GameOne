import { describe, it, expect, vi } from 'vitest';
import { eventFormSchema } from '@/lib/schemas/event-schemas';
import { EventType } from '@prisma/client';

// Mock the auth module
vi.mock('@/lib/kinde-auth', () => ({
  getCurrentUser: vi.fn(),
}));

// Mock the service
vi.mock('@/lib/services/event-service', () => ({
  EventService: vi.fn().mockImplementation(() => ({
    createEvent: vi.fn(),
    getEvents: vi.fn(),
  })),
}));

describe('Event API Routes', () => {
  describe('Event Form Schema', () => {
    it('should validate correct event data', () => {
      const validEventData = {
        title: 'Test Workshop',
        description: 'A comprehensive workshop',
        type: EventType.WORKSHOP,
        startDate: '2025-03-01T10:00:00Z',
        capacity: 30,
        requiresApproval: false,
        allowWaitingList: true,
        isOnline: false,
        requiresPayment: false,
        tags: ['workshop', 'test'],
      };

      const result = eventFormSchema.safeParse(validEventData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid event data', () => {
      const invalidEventData = {
        title: '', // Empty title should fail
        type: EventType.WORKSHOP,
        startDate: '2025-03-01T10:00:00Z',
        capacity: 0, // Zero capacity should fail
        requiresApproval: false,
        allowWaitingList: true,
        isOnline: false,
        requiresPayment: false,
        tags: [],
      };

      const result = eventFormSchema.safeParse(invalidEventData);
      expect(result.success).toBe(false);
    });
  });
});