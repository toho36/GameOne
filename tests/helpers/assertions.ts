/**
 * Custom test assertions for database testing
 * Provides domain-specific assertion helpers
 */

import { expect } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { testDb } from '../setup/test-setup'

/**
 * Database assertion helpers
 */
export class DatabaseAssertions {
  private db: PrismaClient

  constructor(database: PrismaClient = testDb) {
    this.db = database
  }

  /**
   * Asserts that a user exists in the database
   */
  async expectUserToExist(userId: string) {
    const user = await this.db.user.findUnique({ where: { id: userId } })
    expect(user).toBeTruthy()
    expect(user!.id).toBe(userId)
    return user
  }

  /**
   * Asserts that an event exists in the database
   */
  async expectEventToExist(eventId: string) {
    const event = await this.db.event.findUnique({ where: { id: eventId } })
    expect(event).toBeTruthy()
    expect(event!.id).toBe(eventId)
    return event
  }

  /**
   * Asserts that a registration exists with specific status
   */
  async expectRegistrationStatus(registrationId: string, expectedStatus: string) {
    const registration = await this.db.registration.findUnique({
      where: { id: registrationId }
    })
    expect(registration).toBeTruthy()
    expect(registration!.status).toBe(expectedStatus)
    return registration
  }

  /**
   * Asserts that a pending payment exists with specific status
   */
  async expectPendingPaymentStatus(pendingPaymentId: string, expectedStatus: string) {
    const pendingPayment = await this.db.pendingPayment.findUnique({
      where: { id: pendingPaymentId }
    })
    expect(pendingPayment).toBeTruthy()
    expect(pendingPayment!.status).toBe(expectedStatus)
    return pendingPayment
  }

  /**
   * Asserts that a waiting list entry exists at specific position
   */
  async expectWaitingListPosition(waitingListId: string, expectedPosition: number) {
    const waitingEntry = await this.db.waitingList.findUnique({
      where: { id: waitingListId }
    })
    expect(waitingEntry).toBeTruthy()
    expect(waitingEntry!.position).toBe(expectedPosition)
    return waitingEntry
  }

  /**
   * Asserts event capacity and registration counts
   */
  async expectEventCapacity(eventId: string, expected: {
    totalCapacity?: number
    registeredCount?: number
    pendingPaymentCount?: number
    waitingListCount?: number
    availableSpots?: number
  }) {
    const event = await this.db.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: true,
        pendingPayments: true,
        waitingList: true
      }
    })

    expect(event).toBeTruthy()

    if (expected.totalCapacity !== undefined) {
      expect(event!.capacity).toBe(expected.totalCapacity)
    }

    if (expected.registeredCount !== undefined) {
      const confirmedRegistrations = event!.registrations.filter(r => 
        ['CONFIRMED', 'ATTENDED'].includes(r.status)
      ).length
      expect(confirmedRegistrations).toBe(expected.registeredCount)
    }

    if (expected.pendingPaymentCount !== undefined) {
      const activePendingPayments = event!.pendingPayments.filter(p => 
        ['AWAITING_PAYMENT', 'PAYMENT_RECEIVED'].includes(p.status)
      ).length
      expect(activePendingPayments).toBe(expected.pendingPaymentCount)
    }

    if (expected.waitingListCount !== undefined) {
      expect(event!.waitingList.length).toBe(expected.waitingListCount)
    }

    if (expected.availableSpots !== undefined) {
      const confirmedRegistrations = event!.registrations.filter(r => 
        ['CONFIRMED', 'ATTENDED'].includes(r.status)
      ).length
      const verifiedPendingPayments = event!.pendingPayments.filter(p => 
        ['PAYMENT_RECEIVED', 'PROCESSED'].includes(p.status)
      ).length
      const usedCapacity = confirmedRegistrations + verifiedPendingPayments
      const availableSpots = event!.capacity - usedCapacity
      expect(availableSpots).toBe(expected.availableSpots)
    }

    return event
  }

  /**
   * Asserts that friend registration data is properly stored
   */
  async expectFriendRegistrationData(registrationId: string, expectedFriends: any[]) {
    const registration = await this.db.registration.findUnique({
      where: { id: registrationId }
    })
    expect(registration).toBeTruthy()
    expect(registration!.friendsData).toBeDefined()
    
    const friendsData = registration!.friendsData as any[]
    expect(friendsData).toHaveLength(expectedFriends.length)
    
    for (let i = 0; i < expectedFriends.length; i++) {
      expect(friendsData[i]).toMatchObject(expectedFriends[i])
    }
    
    return registration
  }

  /**
   * Asserts that group registration relationships are correct
   */
  async expectGroupRegistration(groupLeaderId: string, expectedGroupSize: number) {
    const groupLeader = await this.db.registration.findUnique({
      where: { id: groupLeaderId },
      include: { groupMembers: true }
    })
    
    expect(groupLeader).toBeTruthy()
    expect(groupLeader!.isGroupLeader).toBe(true)
    expect(groupLeader!.groupSize).toBe(expectedGroupSize)
    expect(groupLeader!.groupMembers).toHaveLength(expectedGroupSize - 1) // excluding leader
    
    return groupLeader
  }

  /**
   * Asserts that database constraints are enforced
   */
  async expectConstraintViolation(operation: () => Promise<any>, constraintType: string) {
    await expect(operation()).rejects.toThrow()
    // You could check for specific Prisma error codes here
  }

  /**
   * Asserts that payment QR code data is properly generated
   */
  async expectQRCodeGeneration(pendingPaymentId: string) {
    const pendingPayment = await this.db.pendingPayment.findUnique({
      where: { id: pendingPaymentId }
    })
    
    expect(pendingPayment).toBeTruthy()
    expect(pendingPayment!.qrCodeData).toBeTruthy()
    expect(pendingPayment!.variableSymbol).toBeTruthy()
    expect(pendingPayment!.variableSymbol).toMatch(/^\d+$/) // Should be numeric
    
    return pendingPayment
  }

  /**
   * Asserts that audit trail is properly created
   */
  async expectAuditTrail(userId: string, action: string, resource: string) {
    const auditLogs = await this.db.auditLog.findMany({
      where: {
        userId,
        action,
        resource
      },
      orderBy: { timestamp: 'desc' },
      take: 1
    })
    
    expect(auditLogs).toHaveLength(1)
    expect(auditLogs[0].action).toBe(action)
    expect(auditLogs[0].resource).toBe(resource)
    
    return auditLogs[0]
  }

  /**
   * Asserts that notification was created and has correct status
   */
  async expectNotificationCreated(userId: string, type: string, status: string = 'PENDING') {
    const notifications = await this.db.notificationLog.findMany({
      where: {
        userId,
        type
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    })
    
    expect(notifications).toHaveLength(1)
    expect(notifications[0].type).toBe(type)
    expect(notifications[0].status).toBe(status)
    
    return notifications[0]
  }

  /**
   * Asserts that waiting list positions are properly maintained
   */
  async expectWaitingListOrder(eventId: string) {
    const waitingListEntries = await this.db.waitingList.findMany({
      where: { eventId },
      orderBy: { position: 'asc' }
    })
    
    // Check that positions are sequential starting from 1
    waitingListEntries.forEach((entry, index) => {
      expect(entry.position).toBe(index + 1)
    })
    
    return waitingListEntries
  }

  /**
   * Asserts that user cannot register twice for the same event
   */
  async expectNoDuplicateRegistration(userId: string, eventId: string) {
    const registrations = await this.db.registration.findMany({
      where: { userId, eventId }
    })
    
    expect(registrations).toHaveLength(1)
    return registrations[0]
  }
}

// Export singleton instance
export const dbAssert = new DatabaseAssertions()

// Export individual assertion functions for convenience
export const {
  expectUserToExist,
  expectEventToExist,
  expectRegistrationStatus,
  expectPendingPaymentStatus,
  expectWaitingListPosition,
  expectEventCapacity,
  expectFriendRegistrationData,
  expectGroupRegistration,
  expectConstraintViolation,
  expectQRCodeGeneration,
  expectAuditTrail,
  expectNotificationCreated,
  expectWaitingListOrder,
  expectNoDuplicateRegistration
} = dbAssert