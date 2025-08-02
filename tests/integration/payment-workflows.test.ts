/**
 * Integration tests for payment workflows
 * Tests payment status transitions, QR code generation, and payment verification
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { testDb } from '../setup/test-setup'
import { dbHelper, DatabaseTestHelper } from '../helpers/database'
import { dbAssert } from '../helpers/assertions'

describe('Payment Workflows Integration Tests', () => {
  let helper: DatabaseTestHelper
  let testData: any

  beforeEach(async () => {
    helper = new DatabaseTestHelper(testDb)
    
    // Create base test scenario
    testData = await helper.createTestScenario({
      userCount: 6,
      eventCapacity: 10,
      registrationCount: 0,
      waitingListCount: 0,
      pendingPaymentCount: 0
    })
  })

  afterEach(async () => {
    // Cleanup handled by test setup rollback
  })

  describe('Pending Payment Creation', () => {
    it('should create pending payment with QR code data', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      // Create pending payment
      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          amount: 25.00,
          method: 'QR_CODE'
        }
      )

      // Verify pending payment creation
      await dbAssert.expectPendingPaymentStatus(pendingPayment.id, 'AWAITING_PAYMENT')
      await dbAssert.expectQRCodeGeneration(pendingPayment.id)

      // Verify QR code data format
      expect(pendingPayment.qrCodeData).toContain('SPD*1.0')
      expect(pendingPayment.qrCodeData).toContain(bankAccount.iban)
      expect(pendingPayment.qrCodeData).toContain('25.00')
      expect(pendingPayment.variableSymbol).toMatch(/^\d+$/)
    })

    it('should generate unique variable symbols for each payment', async () => {
      const users = testData.users.slice(1, 4)
      const event = testData.event
      const bankAccount = testData.bankAccount

      // Create multiple pending payments
      const pendingPayments = await Promise.all(
        users.map(user => 
          helper.createTestPendingPayment(event.id, user.id, bankAccount.id)
        )
      )

      // Verify all variable symbols are unique
      const variableSymbols = pendingPayments.map(p => p.variableSymbol)
      const uniqueSymbols = new Set(variableSymbols)
      expect(uniqueSymbols.size).toBe(variableSymbols.length)
    })

    it('should handle guest pending payments', async () => {
      const event = testData.event
      const bankAccount = testData.bankAccount

      // Create guest pending payment
      const pendingPayment = await testDb.pendingPayment.create({
        data: {
          eventId: event.id,
          userId: null,
          bankAccountId: bankAccount.id,
          isGuestRequest: true,
          guestEmail: 'guest@example.com',
          guestName: 'Guest User',
          guestPhone: '+421900123456',
          status: 'AWAITING_PAYMENT',
          amount: 25.00,
          currency: 'EUR',
          paymentMethod: 'QR_CODE',
          registrationType: 'INDIVIDUAL',
          totalParticipants: 1,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          variableSymbol: `${Date.now()}guest`
        }
      })

      // Verify guest payment
      expect(pendingPayment.userId).toBeNull()
      expect(pendingPayment.isGuestRequest).toBe(true)
      expect(pendingPayment.guestEmail).toBe('guest@example.com')
      await dbAssert.expectPendingPaymentStatus(pendingPayment.id, 'AWAITING_PAYMENT')
    })

    it('should set appropriate expiration time', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
        }
      )

      // Verify expiration is in the future
      expect(pendingPayment.expiresAt.getTime()).toBeGreaterThan(Date.now())
      
      // Verify it's approximately 48 hours from now (allowing 1 minute variance)
      const expectedExpiry = Date.now() + 48 * 60 * 60 * 1000
      const variance = Math.abs(pendingPayment.expiresAt.getTime() - expectedExpiry)
      expect(variance).toBeLessThan(60 * 1000) // Less than 1 minute variance
    })
  })

  describe('Payment Status Transitions', () => {
    it('should transition from AWAITING_PAYMENT to PAYMENT_RECEIVED', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      // Create pending payment
      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id
      )

      // Simulate payment received
      await testDb.pendingPayment.update({
        where: { id: pendingPayment.id },
        data: {
          status: 'PAYMENT_RECEIVED',
          paidAt: new Date(),
          verifiedAt: new Date()
        }
      })

      // Verify status transition
      await dbAssert.expectPendingPaymentStatus(pendingPayment.id, 'PAYMENT_RECEIVED')
      
      // Verify timestamps
      const updatedPayment = await testDb.pendingPayment.findUnique({
        where: { id: pendingPayment.id }
      })
      expect(updatedPayment?.paidAt).toBeTruthy()
      expect(updatedPayment?.verifiedAt).toBeTruthy()
    })

    it('should handle payment expiration', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      // Create pending payment with past expiry
      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          expiresAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        }
      )

      // Mark as expired
      await testDb.pendingPayment.update({
        where: { id: pendingPayment.id },
        data: { status: 'EXPIRED' }
      })

      // Verify expiration
      await dbAssert.expectPendingPaymentStatus(pendingPayment.id, 'EXPIRED')
    })

    it('should handle payment cancellation', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      // Create pending payment
      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id
      )

      // Cancel payment
      await testDb.pendingPayment.update({
        where: { id: pendingPayment.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      })

      // Verify cancellation
      await dbAssert.expectPendingPaymentStatus(pendingPayment.id, 'CANCELLED')
    })

    it('should process payment to create registration', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      // Create verified pending payment
      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          status: 'PAYMENT_RECEIVED'
        }
      )

      // Process payment to create registration
      const registration = await testDb.registration.create({
        data: {
          userId: user.id,
          eventId: event.id,
          status: 'CONFIRMED',
          registrationType: 'INDIVIDUAL',
          registrationSource: 'PENDING_PAYMENT_CONFIRMED',
          pendingPaymentId: pendingPayment.id,
          requiresPayment: true
        }
      })

      // Mark pending payment as processed
      await testDb.pendingPayment.update({
        where: { id: pendingPayment.id },
        data: {
          status: 'PROCESSED',
          processedAt: new Date()
        }
      })

      // Verify processing
      await dbAssert.expectPendingPaymentStatus(pendingPayment.id, 'PROCESSED')
      await dbAssert.expectRegistrationStatus(registration.id, 'CONFIRMED')
      
      // Verify linkage
      expect(registration.pendingPaymentId).toBe(pendingPayment.id)
    })
  })

  describe('Payment Method Support', () => {
    it('should support QR code payments', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          method: 'QR_CODE'
        }
      )

      expect(pendingPayment.paymentMethod).toBe('QR_CODE')
      expect(pendingPayment.qrCodeData).toBeTruthy()
    })

    it('should support bank transfer payments', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          method: 'BANK_TRANSFER'
        }
      )

      expect(pendingPayment.paymentMethod).toBe('BANK_TRANSFER')
      expect(pendingPayment.variableSymbol).toBeTruthy()
    })

    it('should support cash payments', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          method: 'CASH',
          status: 'PAYMENT_RECEIVED' // Cash is immediately verified
        }
      )

      expect(pendingPayment.paymentMethod).toBe('CASH')
      await dbAssert.expectPendingPaymentStatus(pendingPayment.id, 'PAYMENT_RECEIVED')
    })
  })

  describe('Group Payment Scenarios', () => {
    it('should handle group payment with friends data', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      const friendsData = [
        {
          name: 'Friend One',
          email: 'friend1@example.com',
          dietaryRequirements: 'Vegetarian'
        },
        {
          name: 'Friend Two',
          email: 'friend2@example.com',
          specialRequests: 'Wheelchair access'
        }
      ]

      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          registrationType: 'GROUP',
          totalParticipants: 3, // User + 2 friends
          amount: event.price * 3,
          friendsData
        }
      )

      // Verify group payment
      expect(pendingPayment.registrationType).toBe('GROUP')
      expect(pendingPayment.totalParticipants).toBe(3)
      expect(pendingPayment.amount).toBe(event.price * 3)
      expect(pendingPayment.friendsData).toEqual(friendsData)
    })

    it('should calculate correct amount for group registration', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      const groupSize = 4
      const expectedAmount = event.price * groupSize

      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          registrationType: 'GROUP',
          totalParticipants: groupSize,
          amount: expectedAmount
        }
      )

      expect(pendingPayment.amount).toBe(expectedAmount)
      expect(pendingPayment.totalParticipants).toBe(groupSize)
    })
  })

  describe('Payment Validation', () => {
    it('should validate payment amounts', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      // Test zero amount (should fail)
      await expect(
        testDb.pendingPayment.create({
          data: {
            eventId: event.id,
            userId: user.id,
            bankAccountId: bankAccount.id,
            amount: 0, // Invalid amount
            currency: 'EUR',
            paymentMethod: 'QR_CODE',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            variableSymbol: `${Date.now()}`
          }
        })
      ).rejects.toThrow()
    })

    it('should validate required fields', async () => {
      const user = testData.users[1]
      const event = testData.event

      // Test missing required fields
      await expect(
        testDb.pendingPayment.create({
          data: {
            eventId: event.id,
            userId: user.id,
            // Missing bankAccountId, amount, etc.
            currency: 'EUR',
            paymentMethod: 'QR_CODE',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        })
      ).rejects.toThrow()
    })

    it('should validate currency format', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          currency: 'USD'
        }
      )

      expect(pendingPayment.currency).toBe('USD')
    })
  })

  describe('Payment Integration with Registration System', () => {
    it('should link payment to registration correctly', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      // Create and verify pending payment
      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          status: 'PAYMENT_RECEIVED'
        }
      )

      // Create registration linked to payment
      const registration = await helper.createTestRegistration(
        event.id,
        user.id,
        {
          status: 'CONFIRMED',
          pendingPaymentId: pendingPayment.id
        }
      )

      // Verify linkage
      const fullRegistration = await testDb.registration.findUnique({
        where: { id: registration.id },
        include: { pendingPayment: true }
      })

      expect(fullRegistration?.pendingPaymentId).toBe(pendingPayment.id)
      expect(fullRegistration?.pendingPayment?.id).toBe(pendingPayment.id)
    })

    it('should handle payment workflow for waiting list promotion', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      // Create waiting list entry
      const waitingListEntry = await helper.createTestWaitingListEntry(
        event.id,
        user.id
      )

      // Promote from waiting list by creating pending payment
      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          promotedFromWaitingList: true,
          waitingListPosition: waitingListEntry.position
        }
      )

      // Verify promotion tracking
      expect(pendingPayment.promotedFromWaitingList).toBe(true)
      expect(pendingPayment.waitingListPosition).toBe(waitingListEntry.position)

      // Update waiting list entry to reference pending payment
      await testDb.waitingList.update({
        where: { id: waitingListEntry.id },
        data: {
          pendingPaymentId: pendingPayment.id,
          promotedAt: new Date()
        }
      })

      // Verify linkage
      const updatedEntry = await testDb.waitingList.findUnique({
        where: { id: waitingListEntry.id },
        include: { pendingPayment: true }
      })

      expect(updatedEntry?.pendingPaymentId).toBe(pendingPayment.id)
      expect(updatedEntry?.promotedAt).toBeTruthy()
    })
  })

  describe('Payment Cleanup and Expiration', () => {
    it('should identify expired payments for cleanup', async () => {
      const users = testData.users.slice(1, 4)
      const event = testData.event
      const bankAccount = testData.bankAccount

      // Create payments with different expiration times
      const expiredPayment = await helper.createTestPendingPayment(
        event.id,
        users[0].id,
        bankAccount.id,
        {
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired yesterday
        }
      )

      const validPayment = await helper.createTestPendingPayment(
        event.id,
        users[1].id,
        bankAccount.id,
        {
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires tomorrow
        }
      )

      // Query for expired payments
      const expiredPayments = await testDb.pendingPayment.findMany({
        where: {
          expiresAt: {
            lt: new Date()
          },
          status: 'AWAITING_PAYMENT'
        }
      })

      // Verify only expired payment is found
      expect(expiredPayments).toHaveLength(1)
      expect(expiredPayments[0].id).toBe(expiredPayment.id)
    })

    it('should handle bulk payment status updates', async () => {
      const users = testData.users.slice(1, 4)
      const event = testData.event
      const bankAccount = testData.bankAccount

      // Create multiple expired payments
      const expiredPayments = await Promise.all(
        users.map(user =>
          helper.createTestPendingPayment(event.id, user.id, bankAccount.id, {
            expiresAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
          })
        )
      )

      // Bulk update expired payments
      await testDb.pendingPayment.updateMany({
        where: {
          id: {
            in: expiredPayments.map(p => p.id)
          }
        },
        data: {
          status: 'EXPIRED'
        }
      })

      // Verify all payments were updated
      for (const payment of expiredPayments) {
        await dbAssert.expectPendingPaymentStatus(payment.id, 'EXPIRED')
      }
    })
  })
})