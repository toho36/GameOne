/**
 * Performance tests for concurrent registrations
 * Tests database performance under load and concurrent access patterns
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { testDb } from '../setup/test-setup'
import { dbHelper, DatabaseTestHelper } from '../helpers/database'
import { dbAssert } from '../helpers/assertions'

describe('Concurrent Registration Performance Tests', () => {
  let helper: DatabaseTestHelper
  let testData: any

  beforeEach(async () => {
    helper = new DatabaseTestHelper(testDb)
    
    // Create larger test scenario for performance testing
    testData = await helper.createTestScenario({
      userCount: 50,
      eventCapacity: 20,
      registrationCount: 0,
      waitingListCount: 0,
      pendingPaymentCount: 0
    })
  })

  afterEach(async () => {
    // Cleanup handled by test setup rollback
  })

  describe('Concurrent Registration Creation', () => {
    it('should handle simultaneous registration attempts', async () => {
      const event = testData.event
      const users = testData.users.slice(1, 11) // 10 users

      // Measure time for concurrent registrations
      const startTime = Date.now()

      // Create promises for simultaneous registrations
      const registrationPromises = users.map((user, index) =>
        helper.createTestRegistration(event.id, user.id, {
          status: 'PENDING',
          registrationType: 'INDIVIDUAL'
        })
      )

      // Execute all registrations concurrently
      const results = await Promise.allSettled(registrationPromises)
      const endTime = Date.now()

      const duration = endTime - startTime
      console.log(`Concurrent registrations completed in ${duration}ms`)

      // All registrations should succeed
      const successful = results.filter(r => r.status === 'fulfilled')
      expect(successful).toHaveLength(users.length)

      // Should complete in reasonable time (under 2 seconds for 10 registrations)
      expect(duration).toBeLessThan(2000)

      // Verify all registrations were created
      const registrationCount = await testDb.registration.count({
        where: { eventId: event.id }
      })
      expect(registrationCount).toBe(users.length)
    })

    it('should handle concurrent capacity checking', async () => {
      const event = testData.event
      const users = testData.users

      // Fill event almost to capacity
      for (let i = 0; i < event.capacity - 2; i++) {
        await helper.createTestRegistration(event.id, users[i + 1].id, {
          status: 'CONFIRMED'
        })
      }

      // Attempt to register multiple users for remaining spots
      const competingUsers = users.slice(event.capacity + 1, event.capacity + 6) // 5 users for 2 spots

      const startTime = Date.now()

      // Create concurrent registration attempts
      const promises = competingUsers.map(user =>
        Promise.resolve().then(async () => {
          const hasCapacity = await helper.hasCapacity(event.id)
          if (hasCapacity) {
            return helper.createTestRegistration(event.id, user.id, {
              status: 'CONFIRMED'
            })
          } else {
            return helper.createTestWaitingListEntry(event.id, user.id)
          }
        })
      )

      const results = await Promise.allSettled(promises)
      const endTime = Date.now()

      const duration = endTime - startTime
      console.log(`Concurrent capacity checking completed in ${duration}ms`)

      // Should complete in reasonable time
      expect(duration).toBeLessThan(1000)

      // Verify final state is consistent
      const finalRegistrationCount = await helper.getEffectiveRegistrationCount(event.id)
      expect(finalRegistrationCount).toBeLessThanOrEqual(event.capacity)

      const waitingListCount = await helper.getWaitingListCount(event.id)
      expect(waitingListCount).toBeGreaterThan(0)
    })

    it('should maintain data consistency under concurrent load', async () => {
      const event = testData.event
      const users = testData.users.slice(1, 21) // 20 users

      const startTime = Date.now()

      // Mix of operations to simulate real load
      const operations = []

      // Registrations
      for (let i = 0; i < 10; i++) {
        operations.push(
          helper.createTestRegistration(event.id, users[i].id, {
            status: 'CONFIRMED'
          })
        )
      }

      // Pending payments
      for (let i = 10; i < 15; i++) {
        operations.push(
          helper.createTestPendingPayment(
            event.id,
            users[i].id,
            testData.bankAccount.id,
            {
              status: 'PAYMENT_RECEIVED'
            }
          )
        )
      }

      // Waiting list entries
      for (let i = 15; i < 20; i++) {
        operations.push(
          helper.createTestWaitingListEntry(event.id, users[i].id)
        )
      }

      // Execute all operations concurrently
      const results = await Promise.allSettled(operations)
      const endTime = Date.now()

      const duration = endTime - startTime
      console.log(`Mixed concurrent operations completed in ${duration}ms`)

      // All operations should succeed
      const successful = results.filter(r => r.status === 'fulfilled')
      expect(successful).toHaveLength(operations.length)

      // Verify data consistency
      const registrationCount = await testDb.registration.count({
        where: { eventId: event.id }
      })
      
      const pendingPaymentCount = await testDb.pendingPayment.count({
        where: { eventId: event.id }
      })
      
      const waitingListCount = await testDb.waitingList.count({
        where: { eventId: event.id }
      })

      expect(registrationCount).toBe(10)
      expect(pendingPaymentCount).toBe(5)
      expect(waitingListCount).toBe(5)

      // Should complete in reasonable time
      expect(duration).toBeLessThan(3000)
    })
  })

  describe('Concurrent Payment Processing', () => {
    it('should handle concurrent payment verifications', async () => {
      const event = testData.event
      const users = testData.users.slice(1, 16) // 15 users
      const bankAccount = testData.bankAccount

      // Create pending payments
      const pendingPayments = await Promise.all(
        users.map(user =>
          helper.createTestPendingPayment(event.id, user.id, bankAccount.id, {
            status: 'AWAITING_PAYMENT'
          })
        )
      )

      const startTime = Date.now()

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

      const results = await Promise.allSettled(verificationPromises)
      const endTime = Date.now()

      const duration = endTime - startTime
      console.log(`Concurrent payment verifications completed in ${duration}ms`)

      // All verifications should succeed
      const successful = results.filter(r => r.status === 'fulfilled')
      expect(successful).toHaveLength(pendingPayments.length)

      // Should complete in reasonable time
      expect(duration).toBeLessThan(1500)

      // Verify all payments are verified
      for (const payment of pendingPayments) {
        await dbAssert.expectPendingPaymentStatus(payment.id, 'PAYMENT_RECEIVED')
      }
    })

    it('should handle concurrent QR code generation', async () => {
      const event = testData.event
      const users = testData.users.slice(1, 26) // 25 users
      const bankAccount = testData.bankAccount

      const startTime = Date.now()

      // Create pending payments with QR codes concurrently
      const paymentPromises = users.map((user, index) =>
        helper.createTestPendingPayment(event.id, user.id, bankAccount.id, {
          method: 'QR_CODE',
          variableSymbol: `${Date.now()}${index}` // Ensure uniqueness
        })
      )

      const pendingPayments = await Promise.all(paymentPromises)
      const endTime = Date.now()

      const duration = endTime - startTime
      console.log(`Concurrent QR code generation completed in ${duration}ms`)

      // Should complete in reasonable time
      expect(duration).toBeLessThan(2000)

      // Verify all QR codes are generated and unique
      const qrCodes = pendingPayments.map(p => p.qrCodeData).filter(Boolean)
      const uniqueQrCodes = new Set(qrCodes)
      
      expect(qrCodes).toHaveLength(pendingPayments.length)
      expect(uniqueQrCodes.size).toBe(qrCodes.length) // All unique

      // Verify all variable symbols are unique
      const variableSymbols = pendingPayments.map(p => p.variableSymbol).filter(Boolean)
      const uniqueVariableSymbols = new Set(variableSymbols)
      
      expect(uniqueVariableSymbols.size).toBe(variableSymbols.length)
    })
  })

  describe('Concurrent Waiting List Operations', () => {
    it('should handle concurrent waiting list additions', async () => {
      const event = testData.event
      const users = testData.users.slice(1, 21) // 20 users

      // Fill event to capacity first
      for (let i = 0; i < event.capacity; i++) {
        await helper.createTestRegistration(event.id, users[i].id, {
          status: 'CONFIRMED'
        })
      }

      const remainingUsers = users.slice(event.capacity)
      const startTime = Date.now()

      // Add users to waiting list concurrently
      const waitingListPromises = remainingUsers.map(user =>
        helper.createTestWaitingListEntry(event.id, user.id)
      )

      const waitingEntries = await Promise.all(waitingListPromises)
      const endTime = Date.now()

      const duration = endTime - startTime
      console.log(`Concurrent waiting list additions completed in ${duration}ms`)

      // Should complete in reasonable time
      expect(duration).toBeLessThan(1500)

      // Verify all entries have correct positions
      await dbAssert.expectWaitingListOrder(event.id)

      // Verify count
      const waitingListCount = await helper.getWaitingListCount(event.id)
      expect(waitingListCount).toBe(remainingUsers.length)
    })

    it('should handle concurrent waiting list promotions', async () => {
      const event = testData.event
      const users = testData.users.slice(1, 11) // 10 users
      const bankAccount = testData.bankAccount

      // Create waiting list entries
      const waitingEntries = await Promise.all(
        users.map(user =>
          helper.createTestWaitingListEntry(event.id, user.id)
        )
      )

      const startTime = Date.now()

      // Simulate concurrent promotions (first 5 users)
      const promotionPromises = waitingEntries.slice(0, 5).map(entry =>
        helper.createTestPendingPayment(
          event.id,
          entry.userId!,
          bankAccount.id,
          {
            promotedFromWaitingList: true,
            waitingListPosition: entry.position
          }
        )
      )

      const promotions = await Promise.all(promotionPromises)
      const endTime = Date.now()

      const duration = endTime - startTime
      console.log(`Concurrent waiting list promotions completed in ${duration}ms`)

      // Should complete in reasonable time
      expect(duration).toBeLessThan(1000)

      // Verify promotions
      for (const promotion of promotions) {
        expect(promotion.promotedFromWaitingList).toBe(true)
        expect(promotion.waitingListPosition).toBeGreaterThan(0)
      }
    })
  })

  describe('Database Query Performance', () => {
    it('should efficiently query event capacity with many registrations', async () => {
      const creator = testData.creator
      const users = testData.users

      // Create event with larger capacity
      const largeEvent = await helper.createTestEvent(creator.id, {
        capacity: 200,
        title: 'Large Performance Event'
      })

      // Create many registrations with various statuses
      const registrations = []
      for (let i = 0; i < 100; i++) {
        const status = i % 4 === 0 ? 'CONFIRMED' : 
                      i % 4 === 1 ? 'PENDING' : 
                      i % 4 === 2 ? 'CANCELLED' : 'ATTENDED'
        
        registrations.push(
          helper.createTestRegistration(largeEvent.id, users[i % users.length].id, {
            status,
            // Avoid duplicate user constraints for cancelled registrations
            ...(status === 'CANCELLED' ? {} : { userId: users[(i % (users.length - 1)) + 1].id })
          })
        )
      }

      // Create in batches to avoid overwhelming database
      const batchSize = 20
      for (let i = 0; i < registrations.length; i += batchSize) {
        const batch = registrations.slice(i, i + batchSize)
        await Promise.all(batch)
      }

      // Measure capacity calculation performance
      const startTime = Date.now()
      
      const effectiveCount = await helper.getEffectiveRegistrationCount(largeEvent.id)
      const hasCapacity = await helper.hasCapacity(largeEvent.id)
      
      const endTime = Date.now()
      const duration = endTime - startTime

      console.log(`Capacity calculation for ${registrations.length} registrations completed in ${duration}ms`)

      // Should complete quickly (under 100ms)
      expect(duration).toBeLessThan(100)

      // Verify reasonable results
      expect(effectiveCount).toBeGreaterThan(0)
      expect(effectiveCount).toBeLessThan(100) // Not all registrations count
      expect(hasCapacity).toBe(true) // Should have capacity available
    })

    it('should efficiently handle bulk status updates', async () => {
      const event = testData.event
      const users = testData.users.slice(1, 31) // 30 users
      const bankAccount = testData.bankAccount

      // Create many pending payments
      const pendingPayments = await Promise.all(
        users.map((user, index) =>
          helper.createTestPendingPayment(event.id, user.id, bankAccount.id, {
            status: 'AWAITING_PAYMENT',
            variableSymbol: `${Date.now()}${index}`
          })
        )
      )

      const startTime = Date.now()

      // Bulk update all payments to expired
      await testDb.pendingPayment.updateMany({
        where: {
          id: {
            in: pendingPayments.map(p => p.id)
          }
        },
        data: {
          status: 'EXPIRED'
        }
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      console.log(`Bulk status update for ${pendingPayments.length} payments completed in ${duration}ms`)

      // Should complete quickly (under 200ms)
      expect(duration).toBeLessThan(200)

      // Verify all payments are updated
      const expiredCount = await testDb.pendingPayment.count({
        where: {
          eventId: event.id,
          status: 'EXPIRED'
        }
      })

      expect(expiredCount).toBe(pendingPayments.length)
    })

    it('should handle complex queries with joins efficiently', async () => {
      const event = testData.event
      const users = testData.users.slice(1, 21) // 20 users

      // Create mix of data
      await Promise.all([
        // Registrations
        ...users.slice(0, 10).map(user =>
          helper.createTestRegistration(event.id, user.id, {
            status: 'CONFIRMED'
          })
        ),
        // Pending payments
        ...users.slice(10, 15).map(user =>
          helper.createTestPendingPayment(
            event.id,
            user.id,
            testData.bankAccount.id,
            {
              status: 'PAYMENT_RECEIVED'
            }
          )
        ),
        // Waiting list
        ...users.slice(15, 20).map(user =>
          helper.createTestWaitingListEntry(event.id, user.id)
        )
      ])

      const startTime = Date.now()

      // Complex query with multiple joins
      const eventWithAll = await testDb.event.findUnique({
        where: { id: event.id },
        include: {
          registrations: {
            include: {
              user: true,
              pendingPayment: true
            }
          },
          pendingPayments: {
            include: {
              user: true
            }
          },
          waitingList: {
            include: {
              user: true
            }
          }
        }
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      console.log(`Complex query with joins completed in ${duration}ms`)

      // Should complete in reasonable time (under 300ms)
      expect(duration).toBeLessThan(300)

      // Verify data is complete
      expect(eventWithAll?.registrations).toHaveLength(10)
      expect(eventWithAll?.pendingPayments).toHaveLength(5)
      expect(eventWithAll?.waitingList).toHaveLength(5)

      // Verify joins worked
      expect(eventWithAll?.registrations[0].user).toBeTruthy()
      expect(eventWithAll?.pendingPayments[0].user).toBeTruthy()
      expect(eventWithAll?.waitingList[0].user).toBeTruthy()
    })
  })

  describe('Stress Testing', () => {
    it('should handle high-volume registration scenarios', async () => {
      const creator = testData.creator

      // Create high-capacity event
      const stressEvent = await helper.createTestEvent(creator.id, {
        capacity: 500,
        title: 'Stress Test Event'
      })

      // Create many users for stress testing
      const stressUsers = []
      for (let i = 0; i < 100; i++) {
        const user = await helper.createTestUser({
          email: `stress-user-${i}@test.com`,
          name: `Stress User ${i}`
        })
        stressUsers.push(user)
      }

      const startTime = Date.now()

      // Create registrations in batches
      const batchSize = 25
      const registrationResults = []

      for (let i = 0; i < stressUsers.length; i += batchSize) {
        const batch = stressUsers.slice(i, i + batchSize)
        const batchPromises = batch.map(user =>
          helper.createTestRegistration(stressEvent.id, user.id, {
            status: 'CONFIRMED'
          })
        )
        
        const batchResults = await Promise.allSettled(batchPromises)
        registrationResults.push(...batchResults)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      console.log(`Stress test: ${stressUsers.length} registrations completed in ${duration}ms`)

      // Should complete in reasonable time (under 10 seconds)
      expect(duration).toBeLessThan(10000)

      // Most registrations should succeed
      const successful = registrationResults.filter(r => r.status === 'fulfilled')
      expect(successful.length).toBeGreaterThan(stressUsers.length * 0.9) // At least 90% success

      // Verify final count
      const finalCount = await testDb.registration.count({
        where: { eventId: stressEvent.id }
      })
      expect(finalCount).toBe(successful.length)
    })

    it('should maintain performance with large datasets', async () => {
      // This test verifies that performance doesn't degrade significantly with large datasets
      const creator = testData.creator
      const event = testData.event

      // Create baseline measurement with small dataset (already exists)
      const smallDataStartTime = Date.now()
      const smallDataCount = await helper.getEffectiveRegistrationCount(event.id)
      const smallDataHasCapacity = await helper.hasCapacity(event.id)
      const smallDataDuration = Date.now() - smallDataStartTime

      // Create larger dataset
      const largeEvent = await helper.createTestEvent(creator.id, {
        capacity: 1000,
        title: 'Large Dataset Event'
      })

      // Add 200 registrations
      const users = testData.users
      for (let i = 0; i < Math.min(200, users.length - 1); i++) {
        await helper.createTestRegistration(largeEvent.id, users[i + 1].id, {
          status: i % 2 === 0 ? 'CONFIRMED' : 'PENDING'
        })
      }

      // Measure performance with large dataset
      const largeDataStartTime = Date.now()
      const largeDataCount = await helper.getEffectiveRegistrationCount(largeEvent.id)
      const largeDataHasCapacity = await helper.hasCapacity(largeEvent.id)
      const largeDataDuration = Date.now() - largeDataStartTime

      console.log(`Small dataset query: ${smallDataDuration}ms`)
      console.log(`Large dataset query: ${largeDataDuration}ms`)

      // Performance shouldn't degrade significantly (less than 10x slower)
      expect(largeDataDuration).toBeLessThan(smallDataDuration * 10)

      // Both should be reasonably fast
      expect(smallDataDuration).toBeLessThan(100)
      expect(largeDataDuration).toBeLessThan(500)

      // Verify correctness
      expect(largeDataCount).toBeGreaterThan(0)
      expect(largeDataHasCapacity).toBe(true)
    })
  })
})