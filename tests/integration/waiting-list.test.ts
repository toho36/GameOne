/**
 * Integration tests for waiting list promotion logic
 * Tests waiting list management, position tracking, and promotion workflows
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { testDb } from '../setup/test-setup'
import { dbHelper, DatabaseTestHelper } from '../helpers/database'
import { dbAssert } from '../helpers/assertions'

describe('Waiting List Integration Tests', () => {
  let helper: DatabaseTestHelper
  let testData: any

  beforeEach(async () => {
    helper = new DatabaseTestHelper(testDb)
    
    // Create base test scenario with small capacity for waiting list testing
    testData = await helper.createTestScenario({
      userCount: 10,
      eventCapacity: 3, // Small capacity to force waiting list usage
      registrationCount: 0,
      waitingListCount: 0,
      pendingPaymentCount: 0
    })
  })

  afterEach(async () => {
    // Cleanup handled by test setup rollback
  })

  describe('Basic Waiting List Management', () => {
    it('should add users to waiting list when event is at capacity', async () => {
      const event = testData.event
      const users = testData.users

      // Fill event to capacity
      for (let i = 0; i < event.capacity; i++) {
        await helper.createTestRegistration(event.id, users[i + 1].id, {
          status: 'CONFIRMED'
        })
      }

      // Add users to waiting list
      const waitingUsers = users.slice(event.capacity + 1, event.capacity + 4)
      const waitingEntries = []

      for (let i = 0; i < waitingUsers.length; i++) {
        const entry = await helper.createTestWaitingListEntry(
          event.id,
          waitingUsers[i].id
        )
        waitingEntries.push(entry)
      }

      // Verify waiting list positions
      for (let i = 0; i < waitingEntries.length; i++) {
        await dbAssert.expectWaitingListPosition(waitingEntries[i].id, i + 1)
      }

      // Verify waiting list order
      await dbAssert.expectWaitingListOrder(event.id)
    })

    it('should maintain correct position numbering', async () => {
      const event = testData.event
      const users = testData.users

      // Create waiting list entries
      const entries = []
      for (let i = 0; i < 5; i++) {
        const entry = await helper.createTestWaitingListEntry(
          event.id,
          users[i + 1].id
        )
        entries.push(entry)
      }

      // Verify sequential positioning
      for (let i = 0; i < entries.length; i++) {
        await dbAssert.expectWaitingListPosition(entries[i].id, i + 1)
      }

      // Verify overall order
      await dbAssert.expectWaitingListOrder(event.id)
    })

    it('should handle guest waiting list entries', async () => {
      const event = testData.event

      // Create guest waiting list entry
      const guestEntry = await testDb.waitingList.create({
        data: {
          eventId: event.id,
          userId: null,
          position: 1,
          isGuestRequest: true,
          guestEmail: 'guest@example.com',
          guestName: 'Guest User',
          guestPhone: '+421900123456',
          registrationType: 'INDIVIDUAL',
          isGroupEntry: false,
          groupSize: 1
        }
      })

      // Verify guest entry
      expect(guestEntry.userId).toBeNull()
      expect(guestEntry.isGuestRequest).toBe(true)
      expect(guestEntry.guestEmail).toBe('guest@example.com')
      await dbAssert.expectWaitingListPosition(guestEntry.id, 1)
    })

    it('should support group waiting list entries', async () => {
      const event = testData.event
      const user = testData.users[1]

      const friendsData = [
        { name: 'Waiting Friend 1', email: 'wf1@example.com' },
        { name: 'Waiting Friend 2', email: 'wf2@example.com' }
      ]

      const groupEntry = await helper.createTestWaitingListEntry(event.id, user.id, {
        registrationType: 'GROUP',
        isGroupEntry: true,
        groupSize: 3,
        friendsData
      })

      // Verify group waiting list entry
      expect(groupEntry.isGroupEntry).toBe(true)
      expect(groupEntry.groupSize).toBe(3)
      expect(groupEntry.friendsData).toEqual(friendsData)
      await dbAssert.expectWaitingListPosition(groupEntry.id, 1)
    })
  })

  describe('Waiting List Position Management', () => {
    it('should maintain positions when entries are removed', async () => {
      const event = testData.event
      const users = testData.users

      // Create 5 waiting list entries
      const entries = []
      for (let i = 0; i < 5; i++) {
        const entry = await helper.createTestWaitingListEntry(
          event.id,
          users[i + 1].id
        )
        entries.push(entry)
      }

      // Remove middle entry (position 3)
      await testDb.waitingList.delete({
        where: { id: entries[2].id }
      })

      // Update positions of remaining entries
      await testDb.waitingList.updateMany({
        where: {
          eventId: event.id,
          position: { gt: 3 }
        },
        data: {
          position: {
            decrement: 1
          }
        }
      })

      // Verify new positions
      const remainingEntries = await testDb.waitingList.findMany({
        where: { eventId: event.id },
        orderBy: { position: 'asc' }
      })

      expect(remainingEntries).toHaveLength(4)
      remainingEntries.forEach((entry, index) => {
        expect(entry.position).toBe(index + 1)
      })
    })

    it('should handle bulk position updates', async () => {
      const event = testData.event
      const users = testData.users

      // Create waiting list entries
      const entries = []
      for (let i = 0; i < 6; i++) {
        const entry = await helper.createTestWaitingListEntry(
          event.id,
          users[i + 1].id
        )
        entries.push(entry)
      }

      // Remove first two entries and update positions
      await testDb.waitingList.deleteMany({
        where: {
          id: {
            in: [entries[0].id, entries[1].id]
          }
        }
      })

      // Bulk update remaining positions
      const remainingEntries = await testDb.waitingList.findMany({
        where: { eventId: event.id },
        orderBy: { position: 'asc' }
      })

      for (let i = 0; i < remainingEntries.length; i++) {
        await testDb.waitingList.update({
          where: { id: remainingEntries[i].id },
          data: { position: i + 1 }
        })
      }

      // Verify updated positions
      await dbAssert.expectWaitingListOrder(event.id)
    })

    it('should prevent duplicate positions', async () => {
      const event = testData.event
      const users = testData.users

      // Create first entry
      await helper.createTestWaitingListEntry(event.id, users[1].id)

      // Attempt to create entry with same position should be handled by helper
      // (which automatically assigns next position)
      const secondEntry = await helper.createTestWaitingListEntry(event.id, users[2].id)

      await dbAssert.expectWaitingListPosition(secondEntry.id, 2)
    })
  })

  describe('Waiting List Promotion Logic', () => {
    it('should promote next user when spot becomes available', async () => {
      const event = testData.event
      const users = testData.users
      const bankAccount = testData.bankAccount

      // Fill event to capacity
      const registrations = []
      for (let i = 0; i < event.capacity; i++) {
        const registration = await helper.createTestRegistration(event.id, users[i + 1].id, {
          status: 'CONFIRMED'
        })
        registrations.push(registration)
      }

      // Add users to waiting list
      const waitingUser1 = users[event.capacity + 1]
      const waitingUser2 = users[event.capacity + 2]
      
      const waitingEntry1 = await helper.createTestWaitingListEntry(event.id, waitingUser1.id)
      const waitingEntry2 = await helper.createTestWaitingListEntry(event.id, waitingUser2.id)

      // Cancel one registration to open a spot
      await testDb.registration.update({
        where: { id: registrations[0].id },
        data: { status: 'CANCELLED' }
      })

      // Promote first waiting list user (create pending payment)
      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        waitingUser1.id,
        bankAccount.id,
        {
          promotedFromWaitingList: true,
          waitingListPosition: waitingEntry1.position
        }
      )

      // Update waiting list entry to track promotion
      await testDb.waitingList.update({
        where: { id: waitingEntry1.id },
        data: {
          pendingPaymentId: pendingPayment.id,
          promotedAt: new Date()
        }
      })

      // Verify promotion
      expect(pendingPayment.promotedFromWaitingList).toBe(true)
      expect(pendingPayment.waitingListPosition).toBe(1)

      const updatedEntry = await testDb.waitingList.findUnique({
        where: { id: waitingEntry1.id }
      })
      expect(updatedEntry?.promotedAt).toBeTruthy()
      expect(updatedEntry?.pendingPaymentId).toBe(pendingPayment.id)

      // Second user should remain in waiting list with updated position
      await dbAssert.expectWaitingListPosition(waitingEntry2.id, 2)
    })

    it('should handle group promotion from waiting list', async () => {
      const event = testData.event
      const user = testData.users[1]
      const bankAccount = testData.bankAccount

      const friendsData = [
        { name: 'Promoted Friend', email: 'promoted@example.com' }
      ]

      // Create group waiting list entry
      const groupWaitingEntry = await helper.createTestWaitingListEntry(event.id, user.id, {
        registrationType: 'GROUP',
        isGroupEntry: true,
        groupSize: 2,
        friendsData
      })

      // Promote group from waiting list
      const groupPendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          registrationType: 'GROUP',
          totalParticipants: 2,
          amount: event.price * 2,
          friendsData,
          promotedFromWaitingList: true,
          waitingListPosition: groupWaitingEntry.position
        }
      )

      // Update waiting list entry
      await testDb.waitingList.update({
        where: { id: groupWaitingEntry.id },
        data: {
          pendingPaymentId: groupPendingPayment.id,
          promotedAt: new Date()
        }
      })

      // Verify group promotion
      expect(groupPendingPayment.registrationType).toBe('GROUP')
      expect(groupPendingPayment.totalParticipants).toBe(2)
      expect(groupPendingPayment.friendsData).toEqual(friendsData)
      expect(groupPendingPayment.promotedFromWaitingList).toBe(true)
    })

    it('should complete promotion workflow from waiting list to registration', async () => {
      const event = testData.event
      const user = testData.users[1]
      const bankAccount = testData.bankAccount

      // Create waiting list entry
      const waitingEntry = await helper.createTestWaitingListEntry(event.id, user.id)

      // Step 1: Promote to pending payment
      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          promotedFromWaitingList: true,
          waitingListPosition: waitingEntry.position
        }
      )

      // Step 2: Payment received
      await testDb.pendingPayment.update({
        where: { id: pendingPayment.id },
        data: {
          status: 'PAYMENT_RECEIVED',
          paidAt: new Date(),
          verifiedAt: new Date()
        }
      })

      // Step 3: Create registration
      const registration = await helper.createTestRegistration(event.id, user.id, {
        status: 'CONFIRMED',
        registrationSource: 'PROMOTED_FROM_WAITING_LIST',
        pendingPaymentId: pendingPayment.id,
        promotedFromWaitingList: true,
        waitingListPosition: waitingEntry.position
      })

      // Step 4: Mark payment as processed
      await testDb.pendingPayment.update({
        where: { id: pendingPayment.id },
        data: {
          status: 'PROCESSED',
          processedAt: new Date()
        }
      })

      // Step 5: Update waiting list entry
      await testDb.waitingList.update({
        where: { id: waitingEntry.id },
        data: {
          pendingPaymentId: pendingPayment.id,
          promotedAt: new Date()
        }
      })

      // Verify complete workflow
      await dbAssert.expectPendingPaymentStatus(pendingPayment.id, 'PROCESSED')
      await dbAssert.expectRegistrationStatus(registration.id, 'CONFIRMED')
      
      expect(registration.promotedFromWaitingList).toBe(true)
      expect(registration.waitingListPosition).toBe(waitingEntry.position)
      expect(registration.pendingPaymentId).toBe(pendingPayment.id)
    })
  })

  describe('Multiple Event Waiting Lists', () => {
    it('should maintain separate waiting lists per event', async () => {
      const creator = testData.creator
      const users = testData.users

      // Create second event
      const event2 = await helper.createTestEvent(creator.id, {
        title: 'Second Event',
        slug: 'second-event-test',
        capacity: 2
      })

      // Add users to both waiting lists
      const event1Entry = await helper.createTestWaitingListEntry(testData.event.id, users[1].id)
      const event2Entry = await helper.createTestWaitingListEntry(event2.id, users[1].id)

      // Verify separate positioning
      await dbAssert.expectWaitingListPosition(event1Entry.id, 1)
      await dbAssert.expectWaitingListPosition(event2Entry.id, 1)

      // Add more users to each
      const event1Entry2 = await helper.createTestWaitingListEntry(testData.event.id, users[2].id)
      const event2Entry2 = await helper.createTestWaitingListEntry(event2.id, users[3].id)

      await dbAssert.expectWaitingListPosition(event1Entry2.id, 2)
      await dbAssert.expectWaitingListPosition(event2Entry2.id, 2)

      // Verify each event has its own waiting list
      const event1WaitingList = await testDb.waitingList.findMany({
        where: { eventId: testData.event.id },
        orderBy: { position: 'asc' }
      })

      const event2WaitingList = await testDb.waitingList.findMany({
        where: { eventId: event2.id },
        orderBy: { position: 'asc' }
      })

      expect(event1WaitingList).toHaveLength(2)
      expect(event2WaitingList).toHaveLength(2)
    })

    it('should allow same user on multiple event waiting lists', async () => {
      const creator = testData.creator
      const user = testData.users[1]

      // Create multiple events
      const events = []
      for (let i = 0; i < 3; i++) {
        const event = await helper.createTestEvent(creator.id, {
          title: `Event ${i + 1}`,
          slug: `event-${i + 1}-test`,
          capacity: 1
        })
        events.push(event)
      }

      // Add same user to all waiting lists
      const entries = []
      for (const event of events) {
        const entry = await helper.createTestWaitingListEntry(event.id, user.id)
        entries.push(entry)
      }

      // Verify user is on all waiting lists
      for (let i = 0; i < entries.length; i++) {
        await dbAssert.expectWaitingListPosition(entries[i].id, 1)
        expect(entries[i].userId).toBe(user.id)
      }
    })
  })

  describe('Waiting List Edge Cases', () => {
    it('should handle waiting list for events with zero capacity', async () => {
      const creator = testData.creator
      const user = testData.users[1]

      // Create zero capacity event
      const zeroCapacityEvent = await helper.createTestEvent(creator.id, {
        capacity: 0,
        title: 'Zero Capacity Event'
      })

      // Add user to waiting list
      const waitingEntry = await helper.createTestWaitingListEntry(
        zeroCapacityEvent.id,
        user.id
      )

      // Verify waiting list entry exists
      await dbAssert.expectWaitingListPosition(waitingEntry.id, 1)
    })

    it('should handle waiting list when capacity is increased', async () => {
      const event = testData.event
      const users = testData.users

      // Fill to capacity and add waiting list
      for (let i = 0; i < event.capacity; i++) {
        await helper.createTestRegistration(event.id, users[i + 1].id, {
          status: 'CONFIRMED'
        })
      }

      const waitingEntries = []
      for (let i = 0; i < 3; i++) {
        const entry = await helper.createTestWaitingListEntry(
          event.id,
          users[event.capacity + i + 1].id
        )
        waitingEntries.push(entry)
      }

      // Increase capacity
      await testDb.event.update({
        where: { id: event.id },
        data: { capacity: event.capacity + 2 }
      })

      // Now there should be room for 2 people from waiting list
      const hasCapacity = await helper.hasCapacity(event.id)
      expect(hasCapacity).toBe(true)

      // Waiting list should still exist until promoted
      const waitingCount = await helper.getWaitingListCount(event.id)
      expect(waitingCount).toBe(3)
    })

    it('should handle waiting list position gaps', async () => {
      const event = testData.event
      const users = testData.users

      // Create entries with gaps in positions (simulating data issues)
      await testDb.waitingList.create({
        data: {
          eventId: event.id,
          userId: users[1].id,
          position: 1,
          registrationType: 'INDIVIDUAL',
          isGroupEntry: false,
          groupSize: 1
        }
      })

      await testDb.waitingList.create({
        data: {
          eventId: event.id,
          userId: users[2].id,
          position: 3, // Gap at position 2
          registrationType: 'INDIVIDUAL',
          isGroupEntry: false,
          groupSize: 1
        }
      })

      await testDb.waitingList.create({
        data: {
          eventId: event.id,
          userId: users[3].id,
          position: 5, // Gap at position 4
          registrationType: 'INDIVIDUAL',
          isGroupEntry: false,
          groupSize: 1
        }
      })

      // Fix positions to be sequential
      const entries = await testDb.waitingList.findMany({
        where: { eventId: event.id },
        orderBy: { position: 'asc' }
      })

      for (let i = 0; i < entries.length; i++) {
        await testDb.waitingList.update({
          where: { id: entries[i].id },
          data: { position: i + 1 }
        })
      }

      // Verify positions are now sequential
      await dbAssert.expectWaitingListOrder(event.id)
    })
  })

  describe('Waiting List Data Consistency', () => {
    it('should maintain referential integrity with users', async () => {
      const event = testData.event
      const user = testData.users[1]

      // Create waiting list entry
      const waitingEntry = await helper.createTestWaitingListEntry(event.id, user.id)

      // Verify user relationship
      const entryWithUser = await testDb.waitingList.findUnique({
        where: { id: waitingEntry.id },
        include: { user: true }
      })

      expect(entryWithUser?.user?.id).toBe(user.id)
      expect(entryWithUser?.user?.email).toBe(user.email)
    })

    it('should maintain referential integrity with events', async () => {
      const event = testData.event
      const user = testData.users[1]

      // Create waiting list entry
      const waitingEntry = await helper.createTestWaitingListEntry(event.id, user.id)

      // Verify event relationship
      const entryWithEvent = await testDb.waitingList.findUnique({
        where: { id: waitingEntry.id },
        include: { event: true }
      })

      expect(entryWithEvent?.event?.id).toBe(event.id)
      expect(entryWithEvent?.event?.title).toBe(event.title)
    })

    it('should link waiting list entries to pending payments correctly', async () => {
      const event = testData.event
      const user = testData.users[1]
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

      // Link them
      await testDb.waitingList.update({
        where: { id: waitingEntry.id },
        data: {
          pendingPaymentId: pendingPayment.id,
          promotedAt: new Date()
        }
      })

      // Verify linkage
      const linkedEntry = await testDb.waitingList.findUnique({
        where: { id: waitingEntry.id },
        include: { pendingPayment: true }
      })

      expect(linkedEntry?.pendingPaymentId).toBe(pendingPayment.id)
      expect(linkedEntry?.pendingPayment?.id).toBe(pendingPayment.id)
      expect(linkedEntry?.pendingPayment?.promotedFromWaitingList).toBe(true)
    })
  })
})