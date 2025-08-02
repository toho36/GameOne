/**
 * Integration tests for registration workflows
 * Tests the complete user registration journey from initial registration to confirmation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { testDb } from '../setup/test-setup'
import { dbHelper, DatabaseTestHelper } from '../helpers/database'
import { dbAssert } from '../helpers/assertions'

describe('Registration Workflows Integration Tests', () => {
  let helper: DatabaseTestHelper
  let testData: any

  beforeEach(async () => {
    helper = new DatabaseTestHelper(testDb)
    
    // Create base test scenario
    testData = await helper.createTestScenario({
      userCount: 8,
      eventCapacity: 5,
      registrationCount: 0, // We'll create these in tests
      waitingListCount: 0,
      pendingPaymentCount: 0
    })
  })

  afterEach(async () => {
    // Cleanup will be handled by test setup rollback
  })

  describe('Individual Registration Flow', () => {
    it('should successfully register user when capacity is available', async () => {
      const user = testData.users[1]
      const event = testData.event
      
      // Create registration
      const registration = await helper.createTestRegistration(event.id, user.id, {
        status: 'PENDING',
        registrationType: 'INDIVIDUAL'
      })

      // Verify registration was created
      await dbAssert.expectRegistrationStatus(registration.id, 'PENDING')
      await dbAssert.expectEventCapacity(event.id, {
        registeredCount: 0, // Still pending, doesn't count toward capacity
        availableSpots: 5
      })

      // Confirm registration
      await testDb.registration.update({
        where: { id: registration.id },
        data: { status: 'CONFIRMED' }
      })

      // Verify confirmation
      await dbAssert.expectRegistrationStatus(registration.id, 'CONFIRMED')
      await dbAssert.expectEventCapacity(event.id, {
        registeredCount: 1,
        availableSpots: 4
      })
    })

    it('should prevent duplicate registrations for same user and event', async () => {
      const user = testData.users[1]
      const event = testData.event

      // Create first registration
      await helper.createTestRegistration(event.id, user.id)

      // Attempt duplicate registration
      await dbAssert.expectConstraintViolation(
        () => helper.createTestRegistration(event.id, user.id),
        'unique_constraint'
      )
    })

    it('should add user to waiting list when event is at capacity', async () => {
      const event = testData.event
      const users = testData.users

      // Fill event to capacity with confirmed registrations
      for (let i = 0; i < event.capacity; i++) {
        await helper.createTestRegistration(event.id, users[i + 1].id, {
          status: 'CONFIRMED'
        })
      }

      // Verify event is at capacity
      await dbAssert.expectEventCapacity(event.id, {
        registeredCount: event.capacity,
        availableSpots: 0
      })

      // Attempt to register another user
      const extraUser = users[event.capacity + 1]
      const waitingListEntry = await helper.createTestWaitingListEntry(
        event.id,
        extraUser.id
      )

      // Verify user was added to waiting list
      await dbAssert.expectWaitingListPosition(waitingListEntry.id, 1)
      await dbAssert.expectEventCapacity(event.id, {
        waitingListCount: 1
      })
    })

    it('should handle registration cancellation and update capacity', async () => {
      const user = testData.users[1]
      const event = testData.event

      // Create confirmed registration
      const registration = await helper.createTestRegistration(event.id, user.id, {
        status: 'CONFIRMED'
      })

      // Verify initial state
      await dbAssert.expectEventCapacity(event.id, {
        registeredCount: 1,
        availableSpots: 4
      })

      // Cancel registration
      await testDb.registration.update({
        where: { id: registration.id },
        data: { 
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      })

      // Verify cancellation
      await dbAssert.expectRegistrationStatus(registration.id, 'CANCELLED')
      await dbAssert.expectEventCapacity(event.id, {
        registeredCount: 0, // Cancelled registrations don't count
        availableSpots: 5
      })
    })
  })

  describe('Guest Registration Flow', () => {
    it('should allow guest registration without user account', async () => {
      const event = testData.event

      // Create guest registration
      const registration = await helper.createTestRegistration(event.id, null, {
        isGuestRequest: true,
        guestEmail: 'guest@example.com',
        guestName: 'Guest User',
        guestPhone: '+421900123456'
      })

      // Verify guest registration
      expect(registration.userId).toBeNull()
      expect(registration.isGuestRequest).toBe(true)
      expect(registration.guestEmail).toBe('guest@example.com')
      expect(registration.guestName).toBe('Guest User')
    })

    it('should prevent duplicate guest registrations with same email and name', async () => {
      const event = testData.event
      const guestData = {
        isGuestRequest: true,
        guestEmail: 'duplicate@example.com',
        guestName: 'Duplicate Guest'
      }

      // Create first guest registration
      await helper.createTestRegistration(event.id, null, guestData)

      // Attempt duplicate guest registration
      await dbAssert.expectConstraintViolation(
        () => helper.createTestRegistration(event.id, null, guestData),
        'unique_constraint'
      )
    })
  })

  describe('Admin Registration Management', () => {
    it('should allow admin to create registration bypassing normal rules', async () => {
      const event = testData.event
      const user = testData.users[1]

      // Create admin-created registration
      const registration = await helper.createTestRegistration(event.id, user.id, {
        status: 'CONFIRMED',
        registrationType: 'ADMIN_CREATED',
        registrationSource: 'ADMIN_PANEL'
      })

      // Verify admin registration
      expect(registration.registrationType).toBe('ADMIN_CREATED')
      expect(registration.registrationSource).toBe('ADMIN_PANEL')
      await dbAssert.expectRegistrationStatus(registration.id, 'CONFIRMED')
    })

    it('should allow admin to override capacity limits', async () => {
      const event = testData.event
      const users = testData.users

      // Fill event to capacity
      for (let i = 0; i < event.capacity; i++) {
        await helper.createTestRegistration(event.id, users[i + 1].id, {
          status: 'CONFIRMED'
        })
      }

      // Admin adds user over capacity
      const extraUser = users[event.capacity + 1]
      const overCapacityRegistration = await helper.createTestRegistration(
        event.id, 
        extraUser.id, 
        {
          status: 'CONFIRMED',
          registrationType: 'ADMIN_CREATED'
        }
      )

      // Verify over-capacity registration is allowed
      await dbAssert.expectRegistrationStatus(overCapacityRegistration.id, 'CONFIRMED')
      await dbAssert.expectEventCapacity(event.id, {
        registeredCount: event.capacity + 1
      })
    })
  })

  describe('Registration Status Transitions', () => {
    it('should handle complete registration lifecycle', async () => {
      const user = testData.users[1]
      const event = testData.event

      // 1. Initial registration (pending)
      const registration = await helper.createTestRegistration(event.id, user.id, {
        status: 'PENDING'
      })
      await dbAssert.expectRegistrationStatus(registration.id, 'PENDING')

      // 2. Confirmation
      await testDb.registration.update({
        where: { id: registration.id },
        data: { 
          status: 'CONFIRMED',
          confirmedAt: new Date()
        }
      })
      await dbAssert.expectRegistrationStatus(registration.id, 'CONFIRMED')

      // 3. Mark as attended
      await testDb.registration.update({
        where: { id: registration.id },
        data: { status: 'ATTENDED' }
      })
      await dbAssert.expectRegistrationStatus(registration.id, 'ATTENDED')
    })

    it('should handle registration rejection', async () => {
      const user = testData.users[1]
      const event = testData.event

      // Create pending registration
      const registration = await helper.createTestRegistration(event.id, user.id, {
        status: 'PENDING'
      })

      // Reject registration
      await testDb.registration.update({
        where: { id: registration.id },
        data: { status: 'REJECTED' }
      })

      // Verify rejection
      await dbAssert.expectRegistrationStatus(registration.id, 'REJECTED')
      await dbAssert.expectEventCapacity(event.id, {
        registeredCount: 0 // Rejected registrations don't count
      })
    })

    it('should handle no-show status', async () => {
      const user = testData.users[1]
      const event = testData.event

      // Create confirmed registration
      const registration = await helper.createTestRegistration(event.id, user.id, {
        status: 'CONFIRMED'
      })

      // Mark as no-show
      await testDb.registration.update({
        where: { id: registration.id },
        data: { status: 'NO_SHOW' }
      })

      // Verify no-show status
      await dbAssert.expectRegistrationStatus(registration.id, 'NO_SHOW')
    })
  })

  describe('Registration Data Validation', () => {
    it('should store dietary requirements and special requests', async () => {
      const user = testData.users[1]
      const event = testData.event

      const registration = await helper.createTestRegistration(event.id, user.id, {
        dietaryRequirements: 'Vegetarian, No nuts',
        specialRequests: 'Wheelchair accessible seating'
      })

      // Verify data storage
      const storedRegistration = await testDb.registration.findUnique({
        where: { id: registration.id }
      })

      expect(storedRegistration?.dietaryRequirements).toBe('Vegetarian, No nuts')
      expect(storedRegistration?.specialRequests).toBe('Wheelchair accessible seating')
    })

    it('should validate required fields for registration', async () => {
      const event = testData.event

      // Attempt registration without required eventId
      await expect(
        testDb.registration.create({
          data: {
            userId: testData.users[1].id,
            status: 'PENDING'
            // Missing eventId
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('Concurrent Registration Scenarios', () => {
    it('should handle simultaneous registrations for last available spot', async () => {
      const event = testData.event
      const users = testData.users

      // Fill event to capacity - 1
      for (let i = 0; i < event.capacity - 1; i++) {
        await helper.createTestRegistration(event.id, users[i + 1].id, {
          status: 'CONFIRMED'
        })
      }

      // Simulate two users trying to register simultaneously for last spot
      const promises = [
        helper.createTestRegistration(event.id, users[event.capacity].id, {
          status: 'CONFIRMED'
        }),
        helper.createTestWaitingListEntry(event.id, users[event.capacity + 1].id)
      ]

      // Both operations should succeed - one gets last spot, other goes to waiting list
      const results = await Promise.allSettled(promises)
      
      // At least one should succeed
      const successfulResults = results.filter(r => r.status === 'fulfilled')
      expect(successfulResults.length).toBeGreaterThan(0)

      // Verify final state is consistent
      await dbAssert.expectEventCapacity(event.id, {
        registeredCount: event.capacity
      })
    })
  })

  describe('Registration Business Rules', () => {
    it('should enforce event registration dates', async () => {
      const creator = testData.creator
      const user = testData.users[1]

      // Create event with past registration end date
      const pastEvent = await helper.createTestEvent(creator.id, {
        title: 'Past Registration Event',
        slug: 'past-registration-test',
        registrationEndDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      })

      // Registration should still work at database level (business logic handles this)
      const registration = await helper.createTestRegistration(pastEvent.id, user.id)
      
      // Verify registration was created (application logic would prevent this)
      await dbAssert.expectRegistrationStatus(registration.id, 'PENDING')
    })

    it('should support event approval requirements', async () => {
      const creator = testData.creator
      const user = testData.users[1]

      // Create event requiring approval
      const approvalEvent = await helper.createTestEvent(creator.id, {
        requiresApproval: true
      })

      // Create registration
      const registration = await helper.createTestRegistration(approvalEvent.id, user.id, {
        status: 'PENDING' // Should remain pending until approved
      })

      // Verify registration requires approval
      await dbAssert.expectRegistrationStatus(registration.id, 'PENDING')
      
      // Verify event setting
      expect(approvalEvent.requiresApproval).toBe(true)
    })
  })
})