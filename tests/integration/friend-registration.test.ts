/**
 * Integration tests for friend registration workflows
 * Tests group registrations, friend data storage, and complex friend scenarios
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { testDb } from '../setup/test-setup'
import { dbHelper, DatabaseTestHelper } from '../helpers/database'
import { dbAssert } from '../helpers/assertions'

describe('Friend Registration Integration Tests', () => {
  let helper: DatabaseTestHelper
  let testData: any

  beforeEach(async () => {
    helper = new DatabaseTestHelper(testDb)
    
    // Create base test scenario
    testData = await helper.createTestScenario({
      userCount: 8,
      eventCapacity: 20,
      registrationCount: 0,
      waitingListCount: 0,
      pendingPaymentCount: 0
    })
  })

  afterEach(async () => {
    // Cleanup handled by test setup rollback
  })

  describe('Basic Friend Registration', () => {
    it('should create group registration with friend data', async () => {
      const user = testData.users[1]
      const event = testData.event

      const friendsData = [
        {
          name: 'John Friend',
          email: 'john.friend@example.com',
          phone: '+421900111222',
          dietaryRequirements: 'Vegetarian',
          specialRequests: 'Wheelchair accessible seating'
        },
        {
          name: 'Jane Buddy',
          email: 'jane.buddy@example.com',
          phone: '+421900333444',
          dietaryRequirements: 'Gluten-free',
          specialRequests: 'None'
        }
      ]

      // Create group registration
      const registration = await helper.createTestRegistration(event.id, user.id, {
        status: 'CONFIRMED',
        registrationType: 'GROUP',
        isGroupLeader: true,
        groupSize: 3, // User + 2 friends
        friendsData,
        dietaryRequirements: 'None'
      })

      // Verify group registration data
      await dbAssert.expectFriendRegistrationData(registration.id, friendsData)
      await dbAssert.expectGroupRegistration(registration.id, 3)

      // Verify stored data structure
      const storedRegistration = await testDb.registration.findUnique({
        where: { id: registration.id }
      })

      expect(storedRegistration?.isGroupLeader).toBe(true)
      expect(storedRegistration?.groupSize).toBe(3)
      expect(storedRegistration?.registrationType).toBe('GROUP')
      expect(storedRegistration?.friendsData).toEqual(friendsData)
    })

    it('should handle single friend registration', async () => {
      const user = testData.users[1]
      const event = testData.event

      const singleFriend = {
        name: 'Solo Friend',
        email: 'solo@example.com',
        phone: '+421900555666'
      }

      const registration = await helper.createTestRegistration(event.id, user.id, {
        status: 'CONFIRMED',
        registrationType: 'GROUP',
        isGroupLeader: true,
        groupSize: 2, // User + 1 friend
        friendsData: [singleFriend]
      })

      // Verify single friend data
      await dbAssert.expectFriendRegistrationData(registration.id, [singleFriend])
      await dbAssert.expectGroupRegistration(registration.id, 2)
    })

    it('should support group registration without friend details', async () => {
      const user = testData.users[1]
      const event = testData.event

      // Create group registration with minimal friend data
      const minimalFriends = [
        { name: 'Friend One' },
        { name: 'Friend Two' },
        { name: 'Friend Three' }
      ]

      const registration = await helper.createTestRegistration(event.id, user.id, {
        registrationType: 'GROUP',
        isGroupLeader: true,
        groupSize: 4, // User + 3 friends
        friendsData: minimalFriends
      })

      // Verify minimal data is stored
      const storedRegistration = await testDb.registration.findUnique({
        where: { id: registration.id }
      })

      expect(storedRegistration?.friendsData).toEqual(minimalFriends)
      expect(storedRegistration?.groupSize).toBe(4)
    })
  })

  describe('Friend Pending Payments', () => {
    it('should create group pending payment with friends data', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      const friendsData = [
        {
          name: 'Payment Friend 1',
          email: 'paymentfriend1@example.com',
          dietaryRequirements: 'Vegan'
        },
        {
          name: 'Payment Friend 2',
          email: 'paymentfriend2@example.com',
          specialRequests: 'Late arrival'
        }
      ]

      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          registrationType: 'GROUP',
          totalParticipants: 3,
          amount: event.price * 3,
          friendsData
        }
      )

      // Verify group payment data
      expect(pendingPayment.registrationType).toBe('GROUP')
      expect(pendingPayment.totalParticipants).toBe(3)
      expect(pendingPayment.amount).toBe(event.price * 3)
      expect(pendingPayment.friendsData).toEqual(friendsData)
    })

    it('should calculate correct amount for group payment', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      const groupSizes = [2, 3, 5, 8]

      for (const groupSize of groupSizes) {
        const friendsData = Array.from({ length: groupSize - 1 }, (_, i) => ({
          name: `Friend ${i + 1}`,
          email: `friend${i + 1}@example.com`
        }))

        const pendingPayment = await helper.createTestPendingPayment(
          event.id,
          user.id,
          bankAccount.id,
          {
            registrationType: 'GROUP',
            totalParticipants: groupSize,
            amount: event.price * groupSize,
            friendsData,
            variableSymbol: `${Date.now()}${groupSize}` // Unique symbol
          }
        )

        // Verify calculation
        expect(pendingPayment.totalParticipants).toBe(groupSize)
        expect(pendingPayment.amount).toBe(event.price * groupSize)
        expect(pendingPayment.friendsData).toHaveLength(groupSize - 1)
      }
    })

    it('should handle group payment to registration conversion', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      const friendsData = [
        { name: 'Convert Friend', email: 'convert@example.com' }
      ]

      // Create verified group pending payment
      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          status: 'PAYMENT_RECEIVED',
          registrationType: 'GROUP',
          totalParticipants: 2,
          amount: event.price * 2,
          friendsData
        }
      )

      // Convert to registration
      const registration = await helper.createTestRegistration(event.id, user.id, {
        status: 'CONFIRMED',
        registrationType: 'GROUP',
        registrationSource: 'PENDING_PAYMENT_CONFIRMED',
        isGroupLeader: true,
        groupSize: 2,
        friendsData,
        pendingPaymentId: pendingPayment.id
      })

      // Mark payment as processed
      await testDb.pendingPayment.update({
        where: { id: pendingPayment.id },
        data: {
          status: 'PROCESSED',
          processedAt: new Date()
        }
      })

      // Verify conversion
      await dbAssert.expectPendingPaymentStatus(pendingPayment.id, 'PROCESSED')
      await dbAssert.expectRegistrationStatus(registration.id, 'CONFIRMED')
      expect(registration.pendingPaymentId).toBe(pendingPayment.id)
      expect(registration.friendsData).toEqual(friendsData)
    })
  })

  describe('Friend Data Validation and Storage', () => {
    it('should store comprehensive friend information', async () => {
      const user = testData.users[1]
      const event = testData.event

      const comprehensiveFriend = {
        name: 'Comprehensive Friend',
        email: 'comprehensive@example.com',
        phone: '+421900777888',
        dietaryRequirements: 'Vegetarian, No nuts, Lactose-free',
        specialRequests: 'Wheelchair access, Quiet area, Early check-in',
        emergencyContact: 'Parent (+421900999000)',
        notes: 'First time attendee, very excited!',
        company: 'Tech Corp',
        jobTitle: 'Developer'
      }

      const registration = await helper.createTestRegistration(event.id, user.id, {
        registrationType: 'GROUP',
        isGroupLeader: true,
        groupSize: 2,
        friendsData: [comprehensiveFriend]
      })

      // Verify all data is stored
      const storedRegistration = await testDb.registration.findUnique({
        where: { id: registration.id }
      })

      const storedFriend = (storedRegistration?.friendsData as any[])[0]
      expect(storedFriend).toEqual(comprehensiveFriend)
    })

    it('should handle special characters in friend data', async () => {
      const user = testData.users[1]
      const event = testData.event

      const specialCharacterFriend = {
        name: 'Ján Novák-Dvořák',
        email: 'jan.novak@príklad.sk',
        phone: '+421 900 123 456',
        dietaryRequirements: 'Požadavky s diakritikou: žiadne orechy',
        specialRequests: 'Špecifické požiadavky: prístup pre vozíčkárov'
      }

      const registration = await helper.createTestRegistration(event.id, user.id, {
        registrationType: 'GROUP',
        isGroupLeader: true,
        groupSize: 2,
        friendsData: [specialCharacterFriend]
      })

      // Verify special characters are preserved
      const storedRegistration = await testDb.registration.findUnique({
        where: { id: registration.id }
      })

      const storedFriend = (storedRegistration?.friendsData as any[])[0]
      expect(storedFriend.name).toBe('Ján Novák-Dvořák')
      expect(storedFriend.email).toBe('jan.novak@príklad.sk')
      expect(storedFriend.dietaryRequirements).toContain('žiadne orechy')
    })

    it('should validate friend data structure', async () => {
      const user = testData.users[1]
      const event = testData.event

      // Test with invalid friend data (missing required name)
      const invalidFriendData = [
        { email: 'noname@example.com' } // Missing name
      ]

      // This should still work at database level (validation happens at application level)
      const registration = await helper.createTestRegistration(event.id, user.id, {
        registrationType: 'GROUP',
        friendsData: invalidFriendData
      })

      // Verify data is stored as-is
      const storedRegistration = await testDb.registration.findUnique({
        where: { id: registration.id }
      })

      expect(storedRegistration?.friendsData).toEqual(invalidFriendData)
    })
  })

  describe('Complex Friend Registration Scenarios', () => {
    it('should handle large group registrations', async () => {
      const user = testData.users[1]
      const event = testData.event

      // Create large group (limit testing)
      const largeGroupSize = 10
      const friendsData = Array.from({ length: largeGroupSize - 1 }, (_, i) => ({
        name: `Friend ${i + 1}`,
        email: `friend${i + 1}@example.com`,
        phone: `+421900${String(i + 1).padStart(6, '0')}`,
        dietaryRequirements: i % 3 === 0 ? 'Vegetarian' : i % 3 === 1 ? 'Vegan' : 'None',
        specialRequests: i % 2 === 0 ? 'Early arrival' : 'Standard'
      }))

      const registration = await helper.createTestRegistration(event.id, user.id, {
        registrationType: 'GROUP',
        isGroupLeader: true,
        groupSize: largeGroupSize,
        friendsData
      })

      // Verify large group handling
      await dbAssert.expectGroupRegistration(registration.id, largeGroupSize)
      await dbAssert.expectFriendRegistrationData(registration.id, friendsData)

      // Verify individual friend data
      const storedRegistration = await testDb.registration.findUnique({
        where: { id: registration.id }
      })

      const storedFriends = storedRegistration?.friendsData as any[]
      expect(storedFriends).toHaveLength(largeGroupSize - 1)
      
      // Check some specific friends
      expect(storedFriends[0].name).toBe('Friend 1')
      expect(storedFriends[8].name).toBe('Friend 9')
    })

    it('should handle mixed individual and group registrations for same event', async () => {
      const users = testData.users
      const event = testData.event

      // Create individual registration
      const individualReg = await helper.createTestRegistration(event.id, users[1].id, {
        status: 'CONFIRMED',
        registrationType: 'INDIVIDUAL'
      })

      // Create group registration
      const groupReg = await helper.createTestRegistration(event.id, users[2].id, {
        status: 'CONFIRMED',
        registrationType: 'GROUP',
        isGroupLeader: true,
        groupSize: 3,
        friendsData: [
          { name: 'Group Friend 1', email: 'gf1@example.com' },
          { name: 'Group Friend 2', email: 'gf2@example.com' }
        ]
      })

      // Create another individual registration
      const individual2Reg = await helper.createTestRegistration(event.id, users[3].id, {
        status: 'CONFIRMED',
        registrationType: 'INDIVIDUAL'
      })

      // Verify all registrations exist with correct types
      await dbAssert.expectRegistrationStatus(individualReg.id, 'CONFIRMED')
      await dbAssert.expectRegistrationStatus(groupReg.id, 'CONFIRMED')
      await dbAssert.expectRegistrationStatus(individual2Reg.id, 'CONFIRMED')

      // Verify capacity calculation (should count each registration as 1)
      const effectiveCount = await helper.getEffectiveRegistrationCount(event.id)
      expect(effectiveCount).toBe(3)
    })

    it('should handle friend registration with waiting list promotion', async () => {
      const user = testData.users[1]
      const event = testData.event

      const friendsData = [
        { name: 'Waiting Friend', email: 'waiting@example.com' }
      ]

      // Create waiting list entry for group
      const waitingEntry = await helper.createTestWaitingListEntry(event.id, user.id, {
        registrationType: 'GROUP',
        isGroupEntry: true,
        groupSize: 2,
        friendsData
      })

      // Verify waiting list entry
      expect(waitingEntry.isGroupEntry).toBe(true)
      expect(waitingEntry.groupSize).toBe(2)
      expect(waitingEntry.friendsData).toEqual(friendsData)

      // Promote from waiting list (create pending payment)
      const bankAccount = testData.bankAccount
      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          registrationType: 'GROUP',
          totalParticipants: 2,
          amount: event.price * 2,
          friendsData,
          promotedFromWaitingList: true,
          waitingListPosition: waitingEntry.position
        }
      )

      // Update waiting list entry to track promotion
      await testDb.waitingList.update({
        where: { id: waitingEntry.id },
        data: {
          pendingPaymentId: pendingPayment.id,
          promotedAt: new Date()
        }
      })

      // Verify promotion tracking
      expect(pendingPayment.promotedFromWaitingList).toBe(true)
      expect(pendingPayment.waitingListPosition).toBe(waitingEntry.position)
      expect(pendingPayment.friendsData).toEqual(friendsData)
    })
  })

  describe('Friend Registration Business Rules', () => {
    it('should prevent group leader from registering twice', async () => {
      const user = testData.users[1]
      const event = testData.event

      // Create first group registration
      await helper.createTestRegistration(event.id, user.id, {
        registrationType: 'GROUP',
        isGroupLeader: true,
        groupSize: 2,
        friendsData: [{ name: 'First Friend', email: 'first@example.com' }]
      })

      // Attempt second registration should fail
      await dbAssert.expectConstraintViolation(
        () => helper.createTestRegistration(event.id, user.id, {
          registrationType: 'GROUP',
          isGroupLeader: true,
          groupSize: 3,
          friendsData: [
            { name: 'Second Friend 1', email: 'second1@example.com' },
            { name: 'Second Friend 2', email: 'second2@example.com' }
          ]
        }),
        'unique_constraint'
      )
    })

    it('should support friend modification through data updates', async () => {
      const user = testData.users[1]
      const event = testData.event

      const originalFriends = [
        { name: 'Original Friend', email: 'original@example.com' }
      ]

      const registration = await helper.createTestRegistration(event.id, user.id, {
        registrationType: 'GROUP',
        isGroupLeader: true,
        groupSize: 2,
        friendsData: originalFriends
      })

      // Update friend data
      const updatedFriends = [
        { 
          name: 'Updated Friend', 
          email: 'updated@example.com',
          phone: '+421900123456',
          dietaryRequirements: 'Vegetarian'
        }
      ]

      await testDb.registration.update({
        where: { id: registration.id },
        data: {
          friendsData: updatedFriends
        }
      })

      // Verify update
      const updatedRegistration = await testDb.registration.findUnique({
        where: { id: registration.id }
      })

      expect(updatedRegistration?.friendsData).toEqual(updatedFriends)
    })

    it('should handle friend cancellation scenarios', async () => {
      const user = testData.users[1]
      const event = testData.event

      const friendsData = [
        { name: 'Friend 1', email: 'friend1@example.com' },
        { name: 'Friend 2', email: 'friend2@example.com' },
        { name: 'Friend 3', email: 'friend3@example.com' }
      ]

      const registration = await helper.createTestRegistration(event.id, user.id, {
        status: 'CONFIRMED',
        registrationType: 'GROUP',
        isGroupLeader: true,
        groupSize: 4,
        friendsData
      })

      // Simulate friend cancellation (remove one friend)
      const remainingFriends = friendsData.slice(0, 2)

      await testDb.registration.update({
        where: { id: registration.id },
        data: {
          groupSize: 3, // Updated size
          friendsData: remainingFriends
        }
      })

      // Verify friend removal
      const updatedRegistration = await testDb.registration.findUnique({
        where: { id: registration.id }
      })

      expect(updatedRegistration?.groupSize).toBe(3)
      expect(updatedRegistration?.friendsData).toHaveLength(2)
      expect(updatedRegistration?.friendsData).toEqual(remainingFriends)
    })
  })

  describe('Friend Registration Data Integrity', () => {
    it('should maintain data consistency across related tables', async () => {
      const user = testData.users[1]
      const event = testData.event
      const bankAccount = testData.bankAccount

      const friendsData = [
        { name: 'Consistent Friend', email: 'consistent@example.com' }
      ]

      // Create complete workflow: pending payment -> registration
      const pendingPayment = await helper.createTestPendingPayment(
        event.id,
        user.id,
        bankAccount.id,
        {
          status: 'PAYMENT_RECEIVED',
          registrationType: 'GROUP',
          totalParticipants: 2,
          friendsData
        }
      )

      const registration = await helper.createTestRegistration(event.id, user.id, {
        status: 'CONFIRMED',
        registrationType: 'GROUP',
        isGroupLeader: true,
        groupSize: 2,
        friendsData,
        pendingPaymentId: pendingPayment.id
      })

      // Verify data consistency
      expect(pendingPayment.friendsData).toEqual(registration.friendsData)
      expect(pendingPayment.totalParticipants).toBe(registration.groupSize)
      expect(pendingPayment.registrationType).toBe(registration.registrationType)
    })

    it('should handle friend data serialization correctly', async () => {
      const user = testData.users[1]
      const event = testData.event

      const complexFriendsData = [
        {
          name: 'Complex Friend',
          email: 'complex@example.com',
          metadata: {
            preferences: {
              seating: 'front',
              dietary: ['vegetarian', 'gluten-free']
            },
            history: {
              previousEvents: 5,
              memberSince: '2020-01-01'
            }
          },
          tags: ['vip', 'returning', 'special-needs']
        }
      ]

      const registration = await helper.createTestRegistration(event.id, user.id, {
        registrationType: 'GROUP',
        isGroupLeader: true,
        groupSize: 2,
        friendsData: complexFriendsData
      })

      // Verify complex data structure is preserved
      const storedRegistration = await testDb.registration.findUnique({
        where: { id: registration.id }
      })

      const storedFriend = (storedRegistration?.friendsData as any[])[0]
      expect(storedFriend.metadata.preferences.seating).toBe('front')
      expect(storedFriend.metadata.preferences.dietary).toEqual(['vegetarian', 'gluten-free'])
      expect(storedFriend.tags).toEqual(['vip', 'returning', 'special-needs'])
    })
  })
})