/**
 * Database test helper utilities
 * Provides common database operations and test data factories
 */

import { PrismaClient, Prisma } from '@prisma/client'
import { testDb } from '../setup/test-setup'

// Test data factories
export interface TestUserData {
  email?: string
  name?: string
  firstName?: string
  lastName?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION'
  preferredLocale?: string
  phoneNumber?: string
}

export interface TestEventData {
  title?: string
  slug?: string
  description?: string
  capacity?: number
  price?: number
  currency?: string
  startDate?: Date
  endDate?: Date
  venue?: string
  requiresPayment?: boolean
  allowWaitingList?: boolean
}

export interface TestRegistrationData {
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED' | 'ATTENDED' | 'NO_SHOW'
  registrationType?: 'INDIVIDUAL' | 'GROUP' | 'ADMIN_CREATED'
  isGroupLeader?: boolean
  groupSize?: number
  friendsData?: any[]
  dietaryRequirements?: string
  specialRequests?: string
  requiresPayment?: boolean
}

export interface TestPendingPaymentData {
  status?: 'AWAITING_PAYMENT' | 'PAYMENT_RECEIVED' | 'EXPIRED' | 'CANCELLED' | 'PROCESSED'
  amount?: number
  currency?: string
  method?: 'BANK_TRANSFER' | 'QR_CODE' | 'CASH' | 'CARD' | 'OTHER'
  registrationType?: 'INDIVIDUAL' | 'GROUP' | 'ADMIN_CREATED'
  totalParticipants?: number
  friendsData?: any[]
  expiresAt?: Date
}

export interface TestWaitingListData {
  position?: number
  registrationType?: 'INDIVIDUAL' | 'GROUP' | 'ADMIN_CREATED'
  isGroupEntry?: boolean
  groupSize?: number
  friendsData?: any[]
}

/**
 * Database test utilities class
 */
export class DatabaseTestHelper {
  private db: PrismaClient

  constructor(database: PrismaClient = testDb) {
    this.db = database
  }

  /**
   * Creates a test user with default or custom data
   */
  async createTestUser(data: TestUserData = {}): Promise<any> {
    const userData = {
      email: data.email || `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: data.name || 'Test User',
      firstName: data.firstName || 'Test',
      lastName: data.lastName || 'User',
      status: data.status || 'ACTIVE',
      preferredLocale: data.preferredLocale || 'en',
      phoneNumber: data.phoneNumber || '+421900123456',
      ...data
    }

    return this.db.user.create({
      data: userData,
      include: {
        primaryRole: true,
        profile: true
      }
    })
  }

  /**
   * Creates multiple test users
   */
  async createTestUsers(count: number, baseData: TestUserData = {}): Promise<any[]> {
    const users = []
    for (let i = 0; i < count; i++) {
      users.push(await this.createTestUser({
        ...baseData,
        email: `test-user-${i}-${Date.now()}@example.com`,
        name: `Test User ${i + 1}`
      }))
    }
    return users
  }

  /**
   * Creates a test event with default or custom data
   */
  async createTestEvent(creatorId: string, data: TestEventData = {}): Promise<any> {
    const eventData = {
      title: data.title || 'Test Event',
      slug: data.slug || `test-event-${Date.now()}`,
      description: data.description || 'A test event for testing purposes',
      capacity: data.capacity || 50,
      price: data.price || 25.00,
      currency: data.currency || 'EUR',
      startDate: data.startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      endDate: data.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours later
      venue: data.venue || 'Test Venue',
      city: 'Bratislava',
      country: 'Slovakia',
      requiresPayment: data.requiresPayment ?? true,
      allowWaitingList: data.allowWaitingList ?? true,
      creatorId,
      ...data
    }

    return this.db.event.create({
      data: eventData,
      include: {
        creator: true,
        registrations: true,
        waitingList: true,
        pendingPayments: true
      }
    })
  }

  /**
   * Creates a test bank account
   */
  async createTestBankAccount(data: any = {}): Promise<any> {
    const bankData = {
      name: data.name || 'Test Bank Account',
      bankName: data.bankName || 'Test Bank',
      accountNumber: data.accountNumber || '1234567890',
      bankCode: data.bankCode || '1100',
      iban: data.iban || `SK89110000000012345${Math.floor(Math.random() * 10000)}`,
      swift: data.swift || 'TESTSKBX',
      isDefault: data.isDefault ?? false,
      isActive: data.isActive ?? true,
      qrCodeEnabled: data.qrCodeEnabled ?? true,
      ...data
    }

    return this.db.bankAccount.create({
      data: bankData
    })
  }

  /**
   * Creates a test pending payment
   */
  async createTestPendingPayment(
    eventId: string, 
    userId: string | null, 
    bankAccountId: string,
    data: TestPendingPaymentData = {}
  ): Promise<any> {
    const pendingPaymentData = {
      eventId,
      userId,
      bankAccountId,
      status: data.status || 'AWAITING_PAYMENT',
      amount: data.amount || 25.00,
      currency: data.currency || 'EUR',
      paymentMethod: data.method || 'QR_CODE',
      registrationType: data.registrationType || 'INDIVIDUAL',
      totalParticipants: data.totalParticipants || 1,
      friendsData: data.friendsData || [],
      expiresAt: data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      variableSymbol: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
      ...data
    }

    return this.db.pendingPayment.create({
      data: pendingPaymentData,
      include: {
        user: true,
        event: true,
        bankAccount: true
      }
    })
  }

  /**
   * Creates a test registration
   */
  async createTestRegistration(
    eventId: string, 
    userId: string | null, 
    data: TestRegistrationData = {}
  ): Promise<any> {
    const registrationData = {
      eventId,
      userId,
      status: data.status || 'PENDING',
      registrationType: data.registrationType || 'INDIVIDUAL',
      isGroupLeader: data.isGroupLeader ?? true,
      groupSize: data.groupSize || 1,
      friendsData: data.friendsData || [],
      dietaryRequirements: data.dietaryRequirements,
      specialRequests: data.specialRequests,
      requiresPayment: data.requiresPayment ?? true,
      ...data
    }

    return this.db.registration.create({
      data: registrationData,
      include: {
        user: true,
        event: true,
        payment: true,
        pendingPayment: true
      }
    })
  }

  /**
   * Creates a test waiting list entry
   */
  async createTestWaitingListEntry(
    eventId: string, 
    userId: string | null, 
    data: TestWaitingListData = {}
  ): Promise<any> {
    // Get next position in waiting list
    const lastEntry = await this.db.waitingList.findFirst({
      where: { eventId },
      orderBy: { position: 'desc' }
    })
    
    const nextPosition = (lastEntry?.position || 0) + 1

    const waitingListData = {
      eventId,
      userId,
      position: data.position || nextPosition,
      registrationType: data.registrationType || 'INDIVIDUAL',
      isGroupEntry: data.isGroupEntry ?? false,
      groupSize: data.groupSize || 1,
      friendsData: data.friendsData || [],
      ...data
    }

    return this.db.waitingList.create({
      data: waitingListData,
      include: {
        user: true,
        event: true
      }
    })
  }

  /**
   * Gets registration count for an event (effective capacity usage)
   */
  async getEffectiveRegistrationCount(eventId: string): Promise<number> {
    // Count confirmed registrations and pending payments that are paid/verified
    const [confirmedRegistrations, verifiedPendingPayments] = await Promise.all([
      this.db.registration.count({
        where: {
          eventId,
          status: {
            in: ['CONFIRMED', 'ATTENDED']
          }
        }
      }),
      this.db.pendingPayment.count({
        where: {
          eventId,
          status: {
            in: ['PAYMENT_RECEIVED', 'PROCESSED']
          }
        }
      })
    ])

    return confirmedRegistrations + verifiedPendingPayments
  }

  /**
   * Gets waiting list count for an event
   */
  async getWaitingListCount(eventId: string): Promise<number> {
    return this.db.waitingList.count({
      where: { eventId }
    })
  }

  /**
   * Checks if event has capacity available
   */
  async hasCapacity(eventId: string): Promise<boolean> {
    const event = await this.db.event.findUnique({
      where: { id: eventId },
      select: { capacity: true }
    })
    
    if (!event) throw new Error('Event not found')
    
    const currentCount = await this.getEffectiveRegistrationCount(eventId)
    return currentCount < event.capacity
  }

  /**
   * Creates a complete test scenario with user, event, and registration data
   */
  async createTestScenario(options: {
    userCount?: number
    eventCapacity?: number
    registrationCount?: number
    waitingListCount?: number
    pendingPaymentCount?: number
  } = {}) {
    const {
      userCount = 10,
      eventCapacity = 5,
      registrationCount = 3,
      waitingListCount = 2,
      pendingPaymentCount = 2
    } = options

    // Create users
    const users = await this.createTestUsers(userCount)
    const creator = users[0]
    
    // Create bank account
    const bankAccount = await this.createTestBankAccount({ isDefault: true })
    
    // Create event
    const event = await this.createTestEvent(creator.id, { 
      capacity: eventCapacity,
      bankAccountId: bankAccount.id
    })

    // Create registrations
    const registrations = []
    for (let i = 0; i < Math.min(registrationCount, userCount - 1); i++) {
      const registration = await this.createTestRegistration(event.id, users[i + 1].id, {
        status: 'CONFIRMED'
      })
      registrations.push(registration)
    }

    // Create pending payments
    const pendingPayments = []
    for (let i = 0; i < Math.min(pendingPaymentCount, userCount - registrationCount - 1); i++) {
      const userIndex = registrationCount + i + 1
      if (userIndex < userCount) {
        const pendingPayment = await this.createTestPendingPayment(
          event.id, 
          users[userIndex].id, 
          bankAccount.id
        )
        pendingPayments.push(pendingPayment)
      }
    }

    // Create waiting list entries
    const waitingListEntries = []
    for (let i = 0; i < waitingListCount; i++) {
      const userIndex = registrationCount + pendingPaymentCount + i + 1
      if (userIndex < userCount) {
        const waitingEntry = await this.createTestWaitingListEntry(
          event.id, 
          users[userIndex].id
        )
        waitingListEntries.push(waitingEntry)
      }
    }

    return {
      users,
      creator,
      event,
      bankAccount,
      registrations,
      pendingPayments,
      waitingListEntries
    }
  }

  /**
   * Cleans up all test data (useful for manual cleanup in tests)
   */
  async cleanup(): Promise<void> {
    // Clean up in dependency order
    await this.db.registrationHistory.deleteMany()
    await this.db.auditLog.deleteMany()
    await this.db.notificationLog.deleteMany()
    await this.db.payment.deleteMany()
    await this.db.registration.deleteMany()
    await this.db.waitingList.deleteMany()
    await this.db.pendingPayment.deleteMany()
    await this.db.event.deleteMany()
    await this.db.userRole.deleteMany()
    await this.db.profile.deleteMany()
    await this.db.user.deleteMany()
    await this.db.bankAccount.deleteMany()
  }
}

// Export singleton instance
export const dbHelper = new DatabaseTestHelper()