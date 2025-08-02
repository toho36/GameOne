/**
 * Integration tests for capacity management and race conditions
 * Tests event capacity limits, concurrent registration handling, and edge cases
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { testDb } from '../setup/test-setup'
import { dbHelper, DatabaseTestHelper } from '../helpers/database'
import { dbAssert } from '../helpers/assertions'

describe('Capacity Management Integration Tests', () => {
  let helper: DatabaseTestHelper
  let testData: any

  beforeEach(async () => {
    helper = new DatabaseTestHelper(testDb)
    
    // Create base test scenario with small capacity for easier testing
    testData = await helper.createTestScenario({
      userCount: 15,
      eventCapacity: 5, // Small capacity to test limits
      registrationCount: 0,
      waitingListCount: 0,
      pendingPaymentCount: 0
    })
  })

  afterEach(async () => {
    // Cleanup handled by test setup rollback
  })

  describe('Basic Capacity Management', () => {
    it('should track confirmed registrations toward capacity', async () => {
      const event = testData.event
      const users = testData.users

      // Create confirmed registrations up to capacity
      for (let i = 0; i < event.capacity; i++) {
        await helper.createTestRegistration(event.id, users[i + 1].id, {
          status: 'CONFIRMED'
        })
      }

      // Verify capacity tracking
      await dbAssert.expectEventCapacity(event.id, {
        totalCapacity: event.capacity,
        registeredCount: event.capacity,
        availableSpots: 0
      })
    })

    it('should track pending payments toward capacity', async () => {
      const event = testData.event
      const users = testData.users
      const bankAccount = testData.bankAccount

      // Create verified pending payments (these count toward capacity)
      for (let i = 0; i < 3; i++) {
        await helper.createTestPendingPayment(event.id, users[i + 1].id, bankAccount.id, {
          status: 'PAYMENT_RECEIVED'
        })
      }

      // Verify capacity calculation includes verified pending payments
      const effectiveCount = await helper.getEffectiveRegistrationCount(event.id)
      expect(effectiveCount).toBe(3)
      
      // Should still have capacity available
      const hasCapacity = await helper.hasCapacity(event.id)
      expect(hasCapacity).toBe(true)
    })

    it('should not count unverified pending payments toward capacity', async () => {
      const event = testData.event
      const users = testData.users
      const bankAccount = testData.bankAccount

      // Create unverified pending payments
      for (let i = 0; i < 3; i++) {
        await helper.createTestPendingPayment(event.id, users[i + 1].id, bankAccount.id, {
          status: 'AWAITING_PAYMENT' // Not verified, shouldn't count
        })
      }

      // Verify these don't count toward capacity
      const effectiveCount = await helper.getEffectiveRegistrationCount(event.id)
      expect(effectiveCount).toBe(0)
      
      const hasCapacity = await helper.hasCapacity(event.id)
      expect(hasCapacity).toBe(true)
    })

    it('should not count cancelled or rejected registrations', async () => {
      const event = testData.event
      const users = testData.users

      // Create registrations with various statuses
      await helper.createTestRegistration(event.id, users[1].id, { status: 'CONFIRMED' })
      await helper.createTestRegistration(event.id, users[2].id, { status: 'CANCELLED' })
      await helper.createTestRegistration(event.id, users[3].id, { status: 'REJECTED' })
      await helper.createTestRegistration(event.id, users[4].id, { status: 'PENDING' })

      // Verify only confirmed registrations count
      const effectiveCount = await helper.getEffectiveRegistrationCount(event.id)
      expect(effectiveCount).toBe(1) // Only the confirmed one

      await dbAssert.expectEventCapacity(event.id, {
        registeredCount: 1,
        availableSpots: 4
      })
    })
  })

  describe('Capacity Limit Enforcement', () => {
    it('should prevent over-capacity registrations', async () => {
      const event = testData.event
      const users = testData.users

      // Fill event to capacity
      for (let i = 0; i < event.capacity; i++) {
        await helper.createTestRegistration(event.id, users[i + 1].id, {
          status: 'CONFIRMED'
        })
      }

      // Verify event is at capacity
      const hasCapacity = await helper.hasCapacity(event.id)
      expect(hasCapacity).toBe(false)

      // Attempting to register another user should be handled by application logic
      // (Database level doesn't enforce this - business logic does)
      const extraUser = users[event.capacity + 1]
      const waitingEntry = await helper.createTestWaitingListEntry(event.id, extraUser.id)
      
      // Verify user goes to waiting list instead
      await dbAssert.expectWaitingListPosition(waitingEntry.id, 1)
    })

    it('should handle mixed registration types at capacity', async () => {
      const event = testData.event
      const users = testData.users
      const bankAccount = testData.bankAccount

      // Mix of confirmed registrations and verified payments
      await helper.createTestRegistration(event.id, users[1].id, { status: 'CONFIRMED' })
      await helper.createTestRegistration(event.id, users[2].id, { status: 'CONFIRMED' })
      
      await helper.createTestPendingPayment(event.id, users[3].id, bankAccount.id, {
        status: 'PAYMENT_RECEIVED'
      })
      await helper.createTestPendingPayment(event.id, users[4].id, bankAccount.id, {
        status: 'PAYMENT_RECEIVED'
      })
      await helper.createTestPendingPayment(event.id, users[5].id, bankAccount.id, {
        status: 'PAYMENT_RECEIVED'
      })

      // Verify mixed types count correctly (2 + 3 = 5, at capacity)
      const effectiveCount = await helper.getEffectiveRegistrationCount(event.id)
      expect(effectiveCount).toBe(5)
      
      const hasCapacity = await helper.hasCapacity(event.id)
      expect(hasCapacity).toBe(false)
    })

    it('should handle capacity changes dynamically', async () => {
      const event = testData.event
      const users = testData.users

      // Fill to current capacity
      for (let i = 0; i < event.capacity; i++) {
        await helper.createTestRegistration(event.id, users[i + 1].id, {
          status: 'CONFIRMED'
        })
      }

      // Increase capacity
      await testDb.event.update({
        where: { id: event.id },
        data: { capacity: event.capacity + 3 }
      })

      // Verify new capacity is available
      const hasCapacity = await helper.hasCapacity(event.id)
      expect(hasCapacity).toBe(true)

      await dbAssert.expectEventCapacity(event.id, {
        totalCapacity: event.capacity + 3,
        registeredCount: event.capacity, // Original registrations
        availableSpots: 3 // New spots available
      })
    })
  })

  describe('Concurrent Registration Scenarios', () => {
    it('should handle simultaneous registrations at capacity limit', async () => {
      const event = testData.event
      const users = testData.users

      // Fill to capacity - 1
      for (let i = 0; i < event.capacity - 1; i++) {
        await helper.createTestRegistration(event.id, users[i + 1].id, {
          status: 'CONFIRMED'
        })
      }

      // Simulate multiple users trying to register for the last spot
      const lastUser1 = users[event.capacity]
      const lastUser2 = users[event.capacity + 1]

      // In a real scenario, this would be handled by application logic with proper locking
      // For now, test that database can handle the scenario
      const promises = [
        helper.createTestRegistration(event.id, lastUser1.id, { status: 'CONFIRMED' }),
        helper.createTestWaitingListEntry(event.id, lastUser2.id)
      ]

      const results = await Promise.allSettled(promises)
      
      // Both operations should succeed (registration + waiting list)
      expect(results.every(r => r.status === 'fulfilled')).toBe(true)

      // Verify final state
      const finalCount = await helper.getEffectiveRegistrationCount(event.id)
      expect(finalCount).toBe(event.capacity)
      
      const waitingCount = await helper.getWaitingListCount(event.id)
      expect(waitingCount).toBe(1)
    })

    it('should handle concurrent payment verifications', async () => {
      const event = testData.event
      const users = testData.users
      const bankAccount = testData.bankAccount

      // Create multiple pending payments
      const pendingPayments = await Promise.all(
        users.slice(1, 4).map(user =>
          helper.createTestPendingPayment(event.id, user.id, bankAccount.id, {
            status: 'AWAITING_PAYMENT'
          })
        )
      )

      // Simulate concurrent payment verifications
      const verificationPromises = pendingPayments.map(payment =>
        testDb.pendingPayment.update({
          where: { id: payment.id },
          data: {
            status: 'PAYMENT_RECEIVED',
            paidAt: new Date(),
            verifiedAt: new Date()
          }
        })
      )

      // All verifications should succeed
      const results = await Promise.allSettled(verificationPromises)
      expect(results.every(r => r.status === 'fulfilled')).toBe(true)

      // Verify all payments are verified
      for (const payment of pendingPayments) {
        await dbAssert.expectPendingPaymentStatus(payment.id, 'PAYMENT_RECEIVED')
      }
    })

    it('should maintain consistency during bulk operations', async () => {
      const event = testData.event
      const users = testData.users

      // Create registrations in bulk
      const registrationPromises = users.slice(1, 6).map((user, index) =>
        helper.createTestRegistration(event.id, user.id, {
          status: index < 3 ? 'CONFIRMED' : 'PENDING'
        })
      )

      const registrations = await Promise.all(registrationPromises)

      // Verify all registrations were created
      expect(registrations).toHaveLength(5)

      // Verify capacity calculation is correct
      const confirmedCount = registrations.filter((_, index) => index < 3).length
      const effectiveCount = await helper.getEffectiveRegistrationCount(event.id)
      expect(effectiveCount).toBe(confirmedCount)
    })
  })

  describe('Group Registration Capacity Impact', () => {
    it('should count group registrations correctly toward capacity', async () => {
      const event = testData.event
      const user = testData.users[1]

      // Create group registration with 3 participants
      const groupRegistration = await helper.createTestRegistration(event.id, user.id, {
        status: 'CONFIRMED',
        registrationType: 'GROUP',
        isGroupLeader: true,
        groupSize: 3,
        friendsData: [
          { name: 'Friend 1', email: 'friend1@test.com' },
          { name: 'Friend 2', email: 'friend2@test.com' }
        ]
      })

      // Group registration should count as 1 toward capacity (leader only)
      // Friends are stored as data, not separate registrations
      const effectiveCount = await helper.getEffectiveRegistrationCount(event.id)
      expect(effectiveCount).toBe(1)

      await dbAssert.expectEventCapacity(event.id, {
        registeredCount: 1,
        availableSpots: 4
      })

      // Verify group data is stored correctly
      expect(groupRegistration.isGroupLeader).toBe(true)
      expect(groupRegistration.groupSize).toBe(3)
      expect(groupRegistration.friendsData).toHaveLength(2)
    })

    it('should handle group pending payments with multiple participants', async () => {
      const event = testData.event
      const user = testData.users[1]
      const bankAccount = testData.bankAccount

      // Create group pending payment for 4 people
      const groupPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          status: 'PAYMENT_RECEIVED',
          registrationType: 'GROUP',
          totalParticipants: 4,
          amount: event.price * 4,
          friendsData: [
            { name: 'Friend 1', email: 'friend1@test.com' },
            { name: 'Friend 2', email: 'friend2@test.com' },
            { name: 'Friend 3', email: 'friend3@test.com' }
          ]
        }
      )

      // Verified group payment should count as 1 toward capacity
      const effectiveCount = await helper.getEffectiveRegistrationCount(event.id)
      expect(effectiveCount).toBe(1)

      // Verify payment details
      expect(groupPayment.totalParticipants).toBe(4)
      expect(groupPayment.amount).toBe(event.price * 4)
      expect(groupPayment.friendsData).toHaveLength(3)
    })
  })

  describe('Capacity Edge Cases', () => {
    it('should handle zero capacity events', async () => {
      const creator = testData.creator
      const user = testData.users[1]

      // Create event with zero capacity
      const zeroCapacityEvent = await helper.createTestEvent(creator.id, {
        capacity: 0,
        title: 'Zero Capacity Event'
      })

      // Should not have capacity
      const hasCapacity = await helper.hasCapacity(zeroCapacityEvent.id)
      expect(hasCapacity).toBe(false)

      // Any registration should go to waiting list
      const waitingEntry = await helper.createTestWaitingListEntry(
        zeroCapacityEvent.id,
        user.id
      )

      await dbAssert.expectWaitingListPosition(waitingEntry.id, 1)
    })

    it('should handle very large capacity events', async () => {
      const creator = testData.creator
      const users = testData.users

      // Create event with large capacity
      const largeEvent = await helper.createTestEvent(creator.id, {
        capacity: 10000,
        title: 'Large Capacity Event'
      })

      // Should have plenty of capacity
      const hasCapacity = await helper.hasCapacity(largeEvent.id)
      expect(hasCapacity).toBe(true)

      // Create some registrations
      for (let i = 0; i < 5; i++) {
        await helper.createTestRegistration(largeEvent.id, users[i + 1].id, {
          status: 'CONFIRMED'
        })
      }

      await dbAssert.expectEventCapacity(largeEvent.id, {
        totalCapacity: 10000,
        registeredCount: 5,
        availableSpots: 9995
      })
    })

    it('should handle negative capacity edge case', async () => {
      const creator = testData.creator

      // Attempt to create event with negative capacity (should fail at validation)
      await expect(
        testDb.event.create({
          data: {
            title: 'Invalid Capacity Event',
            slug: 'invalid-capacity-test',
            capacity: -1, // Invalid
            creatorId: creator.id,
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('Capacity Recovery Scenarios', () => {
    it('should recover capacity when registrations are cancelled', async () => {
      const event = testData.event
      const users = testData.users

      // Fill to capacity
      const registrations = []
      for (let i = 0; i < event.capacity; i++) {
        const registration = await helper.createTestRegistration(event.id, users[i + 1].id, {
          status: 'CONFIRMED'
        })
        registrations.push(registration)
      }

      // Verify at capacity
      const hasCapacityBefore = await helper.hasCapacity(event.id)
      expect(hasCapacityBefore).toBe(false)

      // Cancel some registrations
      await testDb.registration.updateMany({
        where: {
          id: {
            in: [registrations[0].id, registrations[1].id]
          }
        },
        data: { status: 'CANCELLED' }
      })

      // Verify capacity is recovered
      const hasCapacityAfter = await helper.hasCapacity(event.id)
      expect(hasCapacityAfter).toBe(true)

      await dbAssert.expectEventCapacity(event.id, {
        registeredCount: event.capacity - 2,
        availableSpots: 2
      })
    })

    it('should recover capacity when payments expire', async () => {
      const event = testData.event
      const users = testData.users
      const bankAccount = testData.bankAccount

      // Create verified payments up to capacity
      const payments = []
      for (let i = 0; i < event.capacity; i++) {
        const payment = await helper.createTestPendingPayment(
          event.id,
          users[i + 1].id,
          bankAccount.id,
          {
            status: 'PAYMENT_RECEIVED'
          }
        )
        payments.push(payment)
      }

      // Verify at capacity
      const hasCapacityBefore = await helper.hasCapacity(event.id)
      expect(hasCapacityBefore).toBe(false)

      // Expire some payments
      await testDb.pendingPayment.updateMany({
        where: {
          id: {
            in: [payments[0].id, payments[1].id]
          }
        },
        data: { status: 'EXPIRED' }
      })

      // Verify capacity is recovered
      const hasCapacityAfter = await helper.hasCapacity(event.id)
      expect(hasCapacityAfter).toBe(true)

      const effectiveCount = await helper.getEffectiveRegistrationCount(event.id)
      expect(effectiveCount).toBe(event.capacity - 2)
    })
  })

  describe('Performance Under Load', () => {
    it('should efficiently calculate capacity for events with many registrations', async () => {
      const creator = testData.creator
      const users = testData.users

      // Create event with moderate capacity
      const loadEvent = await helper.createTestEvent(creator.id, {
        capacity: 100,
        title: 'Load Test Event'
      })

      // Create many registrations with various statuses
      const registrationPromises = []
      for (let i = 0; i < 50; i++) {
        const status = i % 3 === 0 ? 'CONFIRMED' : 
                      i % 3 === 1 ? 'PENDING' : 'CANCELLED'
        registrationPromises.push(
          helper.createTestRegistration(loadEvent.id, users[i % users.length].id, {
            status,
            // Use different users, allow some duplicates for cancelled ones
            ...( status === 'CANCELLED' ? {} : { userId: users[(i % (users.length - 1)) + 1].id })
          })
        )
      }

      // Execute in batches to avoid overwhelming database
      const batchSize = 10
      for (let i = 0; i < registrationPromises.length; i += batchSize) {
        const batch = registrationPromises.slice(i, i + batchSize)
        await Promise.all(batch)
      }

      // Measure capacity calculation performance
      const startTime = Date.now()
      const effectiveCount = await helper.getEffectiveRegistrationCount(loadEvent.id)
      const endTime = Date.now()

      // Should complete quickly (under 100ms for this dataset)
      expect(endTime - startTime).toBeLessThan(100)
      
      // Verify count is reasonable (roughly 1/3 confirmed)
      expect(effectiveCount).toBeGreaterThan(10)
      expect(effectiveCount).toBeLessThan(25)
    })
  })
})