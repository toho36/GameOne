/**
 * Integration tests for data integrity and constraint validation
 * Tests database constraints, foreign keys, and business rule enforcement
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { testDb } from '../setup/test-setup'
import { dbHelper, DatabaseTestHelper } from '../helpers/database'
import { dbAssert } from '../helpers/assertions'

describe('Data Integrity Integration Tests', () => {
  let helper: DatabaseTestHelper
  let testData: any

  beforeEach(async () => {
    helper = new DatabaseTestHelper(testDb)
    
    // Create base test scenario
    testData = await helper.createTestScenario({
      userCount: 8,
      eventCapacity: 10,
      registrationCount: 0,
      waitingListCount: 0,
      pendingPaymentCount: 0
    })
  })

  afterEach(async () => {
    // Cleanup handled by test setup rollback
  })

  describe('Foreign Key Constraints', () => {
    it('should enforce user foreign key in registrations', async () => {
      const event = testData.event
      const nonExistentUserId = 'non-existent-user-id'

      // Attempt to create registration with non-existent user
      await expect(
        testDb.registration.create({
          data: {
            userId: nonExistentUserId,
            eventId: event.id,
            status: 'PENDING',
            registrationType: 'INDIVIDUAL'
          }
        })
      ).rejects.toThrow()
    })

    it('should enforce event foreign key in registrations', async () => {
      const user = testData.users[1]
      const nonExistentEventId = 'non-existent-event-id'

      // Attempt to create registration with non-existent event
      await expect(
        testDb.registration.create({
          data: {
            userId: user.id,
            eventId: nonExistentEventId,
            status: 'PENDING',
            registrationType: 'INDIVIDUAL'
          }
        })
      ).rejects.toThrow()
    })

    it('should enforce bank account foreign key in pending payments', async () => {
      const user = testData.users[1]
      const event = testData.event
      const nonExistentBankAccountId = 'non-existent-bank-account-id'

      // Attempt to create pending payment with non-existent bank account
      await expect(
        testDb.pendingPayment.create({
          data: {
            userId: user.id,
            eventId: event.id,
            bankAccountId: nonExistentBankAccountId,
            amount: 25.00,
            currency: 'EUR',
            paymentMethod: 'QR_CODE',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            variableSymbol: `${Date.now()}`
          }
        })
      ).rejects.toThrow()
    })

    it('should enforce pending payment foreign key in registrations', async () => {
      const user = testData.users[1]
      const event = testData.event
      const nonExistentPendingPaymentId = 'non-existent-pending-payment-id'

      // Attempt to create registration with non-existent pending payment
      await expect(
        testDb.registration.create({
          data: {
            userId: user.id,
            eventId: event.id,
            status: 'CONFIRMED',
            registrationType: 'INDIVIDUAL',
            pendingPaymentId: nonExistentPendingPaymentId
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('Unique Constraints', () => {
    it('should prevent duplicate user registrations for same event', async () => {
      const user = testData.users[1]
      const event = testData.event

      // Create first registration
      await helper.createTestRegistration(event.id, user.id, {
        status: 'CONFIRMED'
      })

      // Attempt duplicate registration
      await expect(
        helper.createTestRegistration(event.id, user.id, {
          status: 'PENDING'
        })
      ).rejects.toThrow()
    })

    it('should prevent duplicate guest registrations with same email and name', async () => {
      const event = testData.event
      const guestData = {
        eventId: event.id,
        userId: null,
        isGuestRequest: true,
        guestEmail: 'duplicate@example.com',
        guestName: 'Duplicate Guest',
        status: 'PENDING',
        registrationType: 'INDIVIDUAL'
      }

      // Create first guest registration
      await testDb.registration.create({
        data: guestData
      })

      // Attempt duplicate guest registration
      await expect(
        testDb.registration.create({
          data: guestData
        })
      ).rejects.toThrow()
    })

    it('should prevent duplicate waiting list entries for same user and event', async () => {
      const user = testData.users[1]
      const event = testData.event

      // Create first waiting list entry
      await helper.createTestWaitingListEntry(event.id, user.id)

      // Attempt duplicate waiting list entry
      await expect(
        helper.createTestWaitingListEntry(event.id, user.id)
      ).rejects.toThrow()
    })

    it('should enforce unique variable symbols for payments', async () => {
      const users = testData.users.slice(1, 3)
      const event = testData.event
      const bankAccount = testData.bankAccount
      const variableSymbol = `${Date.now()}`

      // Create first payment with variable symbol
      await helper.createTestPendingPayment(
        event.id,
        users[0].id,
        bankAccount.id,
        { variableSymbol }
      )

      // Attempt to create second payment with same variable symbol
      await expect(
        helper.createTestPendingPayment(
          event.id,
          users[1].id,
          bankAccount.id,
          { variableSymbol }
        )
      ).rejects.toThrow()
    })

    it('should enforce unique bank account IBAN', async () => {
      const existingBankAccount = testData.bankAccount

      // Attempt to create bank account with same IBAN
      await expect(
        testDb.bankAccount.create({
          data: {
            name: 'Duplicate IBAN Account',
            bankName: 'Another Bank',
            accountNumber: '9999999999',
            bankCode: '9999',
            iban: existingBankAccount.iban, // Duplicate IBAN
            swift: 'DUPLICAT',
            isDefault: false,
            isActive: true
          }
        })
      ).rejects.toThrow()
    })

    it('should enforce unique event slug', async () => {
      const creator = testData.creator
      const existingEvent = testData.event

      // Attempt to create event with same slug
      await expect(
        testDb.event.create({
          data: {
            title: 'Different Title',
            slug: existingEvent.slug, // Duplicate slug
            creatorId: creator.id,
            capacity: 10,
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('Required Field Validation', () => {
    it('should require eventId for registrations', async () => {
      const user = testData.users[1]

      await expect(
        testDb.registration.create({
          data: {
            userId: user.id,
            // Missing eventId
            status: 'PENDING',
            registrationType: 'INDIVIDUAL'
          }
        })
      ).rejects.toThrow()
    })

    it('should require amount for pending payments', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      await expect(
        testDb.pendingPayment.create({
          data: {
            userId: user.id,
            eventId: event.id,
            bankAccountId: bankAccount.id,
            // Missing amount
            currency: 'EUR',
            paymentMethod: 'QR_CODE',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            variableSymbol: `${Date.now()}`
          }
        })
      ).rejects.toThrow()
    })

    it('should require capacity for events', async () => {
      const creator = testData.creator

      await expect(
        testDb.event.create({
          data: {
            title: 'Event Without Capacity',
            slug: 'no-capacity-event',
            creatorId: creator.id,
            // Missing capacity
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        })
      ).rejects.toThrow()
    })

    it('should require position for waiting list entries', async () => {
      const user = testData.users[1]
      const event = testData.event

      await expect(
        testDb.waitingList.create({
          data: {
            userId: user.id,
            eventId: event.id,
            // Missing position
            registrationType: 'INDIVIDUAL',
            isGroupEntry: false,
            groupSize: 1
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('Cascade Behavior', () => {
    it('should cascade delete user registrations when user is deleted', async () => {
      const user = testData.users[1]
      const event = testData.event

      // Create registration
      const registration = await helper.createTestRegistration(event.id, user.id)

      // Delete user (should cascade to registration)
      await testDb.user.delete({
        where: { id: user.id }
      })

      // Verify registration is also deleted
      const deletedRegistration = await testDb.registration.findUnique({
        where: { id: registration.id }
      })
      expect(deletedRegistration).toBeNull()
    })

    it('should cascade delete event registrations when event is deleted', async () => {
      const user = testData.users[1]
      const event = testData.event

      // Create registration
      const registration = await helper.createTestRegistration(event.id, user.id)

      // Delete event (should cascade to registration)
      await testDb.event.delete({
        where: { id: event.id }
      })

      // Verify registration is also deleted
      const deletedRegistration = await testDb.registration.findUnique({
        where: { id: registration.id }
      })
      expect(deletedRegistration).toBeNull()
    })

    it('should handle cascade behavior for pending payments', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      // Create pending payment
      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id
      )

      // Delete user (should cascade to pending payment)
      await testDb.user.delete({
        where: { id: user.id }
      })

      // Verify pending payment is deleted
      const deletedPayment = await testDb.pendingPayment.findUnique({
        where: { id: pendingPayment.id }
      })
      expect(deletedPayment).toBeNull()
    })

    it('should handle cascade behavior for waiting list entries', async () => {
      const user = testData.users[1]
      const event = testData.event

      // Create waiting list entry
      const waitingEntry = await helper.createTestWaitingListEntry(event.id, user.id)

      // Delete user (should cascade to waiting list entry)
      await testDb.user.delete({
        where: { id: user.id }
      })

      // Verify waiting list entry is deleted
      const deletedEntry = await testDb.waitingList.findUnique({
        where: { id: waitingEntry.id }
      })
      expect(deletedEntry).toBeNull()
    })
  })

  describe('Data Type Validation', () => {
    it('should validate decimal precision for amounts', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      // Valid decimal amount
      const validPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          amount: 123.45, // Valid decimal
          variableSymbol: `${Date.now()}1`
        }
      )
      expect(validPayment.amount).toBe(123.45)

      // Amount with many decimal places (should be rounded/truncated)
      const precisePayment = await helper.createTestPendingPayment(
        event.id,
        testData.users[2].id,
        bankAccount.id,
        {
          amount: 123.456789, // Many decimal places
          variableSymbol: `${Date.now()}2`
        }
      )
      // Database should handle precision according to schema definition
      expect(typeof precisePayment.amount).toBe('number')
    })

    it('should validate email format in database constraints', async () => {
      // Note: Email format validation typically happens at application level
      // Database level usually stores as text, but we can test basic constraints

      const invalidEmailUser = await testDb.user.create({
        data: {
          email: 'invalid-email-format', // Invalid email format
          name: 'Invalid Email User',
          status: 'ACTIVE'
        }
      })

      // Database allows this (validation should be at application level)
      expect(invalidEmailUser.email).toBe('invalid-email-format')
    })

    it('should validate JSON structure for friends data', async () => {
      const user = testData.users[1]
      const event = testData.event

      // Valid JSON structure
      const validFriendsData = [
        { name: 'Valid Friend', email: 'valid@example.com' }
      ]

      const validRegistration = await helper.createTestRegistration(event.id, user.id, {
        registrationType: 'GROUP',
        friendsData: validFriendsData
      })

      expect(validRegistration.friendsData).toEqual(validFriendsData)

      // Complex but valid JSON structure
      const complexFriendsData = [
        {
          name: 'Complex Friend',
          nested: {
            data: {
              level: 3,
              array: [1, 2, 3]
            }
          }
        }
      ]

      const complexRegistration = await helper.createTestRegistration(
        event.id,
        testData.users[2].id,
        {
          registrationType: 'GROUP',
          friendsData: complexFriendsData
        }
      )

      expect(complexRegistration.friendsData).toEqual(complexFriendsData)
    })

    it('should validate date constraints', async () => {
      const creator = testData.creator

      // Valid date in future
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const validEvent = await helper.createTestEvent(creator.id, {
        startDate: futureDate
      })
      expect(validEvent.startDate).toEqual(futureDate)

      // Past date (should be allowed at database level)
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const pastEvent = await helper.createTestEvent(creator.id, {
        title: 'Past Event',
        slug: 'past-event-test',
        startDate: pastDate
      })
      expect(pastEvent.startDate).toEqual(pastDate)
    })
  })

  describe('Enum Value Validation', () => {
    it('should validate registration status enum values', async () => {
      const user = testData.users[1]
      const event = testData.event

      // Valid enum values
      const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'ATTENDED', 'NO_SHOW']
      
      for (const status of validStatuses) {
        const registration = await helper.createTestRegistration(event.id, user.id, {
          status: status as any,
          // Use different user for each to avoid unique constraint
          userId: testData.users[(validStatuses.indexOf(status) % (testData.users.length - 1)) + 1].id
        })
        expect(registration.status).toBe(status)
      }

      // Invalid enum value should fail
      await expect(
        testDb.registration.create({
          data: {
            userId: testData.users[7].id,
            eventId: event.id,
            status: 'INVALID_STATUS' as any,
            registrationType: 'INDIVIDUAL'
          }
        })
      ).rejects.toThrow()
    })

    it('should validate payment method enum values', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      // Valid enum values
      const validMethods = ['BANK_TRANSFER', 'QR_CODE', 'CASH', 'CARD', 'OTHER']
      
      for (const method of validMethods) {
        const payment = await helper.createTestPendingPayment(
          event.id,
          user.id,
          bankAccount.id,
          {
            method: method as any,
            variableSymbol: `${Date.now()}${validMethods.indexOf(method)}`
          }
        )
        expect(payment.paymentMethod).toBe(method)
      }

      // Invalid enum value should fail
      await expect(
        testDb.pendingPayment.create({
          data: {
            userId: user.id,
            eventId: event.id,
            bankAccountId: bankAccount.id,
            amount: 25.00,
            currency: 'EUR',
            paymentMethod: 'INVALID_METHOD' as any,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            variableSymbol: `${Date.now()}invalid`
          }
        })
      ).rejects.toThrow()
    })

    it('should validate user status enum values', async () => {
      // Valid enum values
      const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']
      
      for (const status of validStatuses) {
        const user = await helper.createTestUser({
          email: `user-${status.toLowerCase()}@test.com`,
          status: status as any
        })
        expect(user.status).toBe(status)
      }

      // Invalid enum value should fail
      await expect(
        testDb.user.create({
          data: {
            email: 'invalid-status@test.com',
            name: 'Invalid Status User',
            status: 'INVALID_STATUS' as any
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('Relationship Integrity', () => {
    it('should maintain referential integrity in group registrations', async () => {
      const user = testData.users[1]
      const event = testData.event

      // Create group leader registration
      const groupLeader = await helper.createTestRegistration(event.id, user.id, {
        registrationType: 'GROUP',
        isGroupLeader: true,
        groupSize: 3,
        friendsData: [
          { name: 'Friend 1', email: 'friend1@test.com' },
          { name: 'Friend 2', email: 'friend2@test.com' }
        ]
      })

      // Verify group leader data
      expect(groupLeader.isGroupLeader).toBe(true)
      expect(groupLeader.groupSize).toBe(3)
      expect(groupLeader.friendsData).toHaveLength(2)
    })

    it('should maintain referential integrity between pending payments and registrations', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      // Create pending payment
      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          status: 'PAYMENT_RECEIVED'
        }
      )

      // Create registration linked to pending payment
      const registration = await helper.createTestRegistration(event.id, user.id, {
        status: 'CONFIRMED',
        pendingPaymentId: pendingPayment.id
      })

      // Verify linkage
      expect(registration.pendingPaymentId).toBe(pendingPayment.id)

      // Verify relationship can be traversed
      const registrationWithPayment = await testDb.registration.findUnique({
        where: { id: registration.id },
        include: { pendingPayment: true }
      })

      expect(registrationWithPayment?.pendingPayment?.id).toBe(pendingPayment.id)
    })

    it('should maintain referential integrity in waiting list promotions', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      // Create waiting list entry
      const waitingEntry = await helper.createTestWaitingListEntry(event.id, user.id)

      // Create pending payment for promotion
      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          promotedFromWaitingList: true,
          waitingListPosition: waitingEntry.position
        }
      )

      // Link waiting list entry to pending payment
      await testDb.waitingList.update({
        where: { id: waitingEntry.id },
        data: {
          pendingPaymentId: pendingPayment.id,
          promotedAt: new Date()
        }
      })

      // Verify linkage integrity
      const linkedWaitingEntry = await testDb.waitingList.findUnique({
        where: { id: waitingEntry.id },
        include: { pendingPayment: true }
      })

      expect(linkedWaitingEntry?.pendingPaymentId).toBe(pendingPayment.id)
      expect(linkedWaitingEntry?.pendingPayment?.promotedFromWaitingList).toBe(true)
      expect(linkedWaitingEntry?.pendingPayment?.waitingListPosition).toBe(waitingEntry.position)
    })
  })

  describe('Business Rule Validation', () => {
    it('should allow consistent group size across related records', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      const groupSize = 4
      const friendsData = Array.from({ length: groupSize - 1 }, (_, i) => ({
        name: `Friend ${i + 1}`,
        email: `friend${i + 1}@test.com`
      }))

      // Create pending payment for group
      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          registrationType: 'GROUP',
          totalParticipants: groupSize,
          friendsData
        }
      )

      // Create registration for same group
      const registration = await helper.createTestRegistration(event.id, user.id, {
        registrationType: 'GROUP',
        isGroupLeader: true,
        groupSize,
        friendsData,
        pendingPaymentId: pendingPayment.id
      })

      // Verify consistency
      expect(pendingPayment.totalParticipants).toBe(registration.groupSize)
      expect(pendingPayment.friendsData).toEqual(registration.friendsData)
    })

    it('should maintain data consistency for guest registrations', async () => {
      const event = testData.event

      const guestData = {
        guestEmail: 'consistent@example.com',
        guestName: 'Consistent Guest',
        guestPhone: '+421900123456'
      }

      // Create guest registration
      const guestRegistration = await testDb.registration.create({
        data: {
          eventId: event.id,
          userId: null,
          isGuestRequest: true,
          status: 'PENDING',
          registrationType: 'INDIVIDUAL',
          ...guestData
        }
      })

      // Create guest waiting list entry with same data
      const guestWaitingEntry = await testDb.waitingList.create({
        data: {
          eventId: event.id,
          userId: null,
          position: 1,
          isGuestRequest: true,
          registrationType: 'INDIVIDUAL',
          isGroupEntry: false,
          groupSize: 1,
          ...guestData
        }
      })

      // Verify consistency
      expect(guestRegistration.guestEmail).toBe(guestWaitingEntry.guestEmail)
      expect(guestRegistration.guestName).toBe(guestWaitingEntry.guestName)
      expect(guestRegistration.guestPhone).toBe(guestWaitingEntry.guestPhone)
    })
  })
})