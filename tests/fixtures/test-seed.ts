/**
 * Comprehensive test data generation for the registration system
 * Creates realistic test scenarios for all registration workflows
 */

import { PrismaClient, NotificationType } from '@prisma/client'

const prisma = new PrismaClient()

export interface TestScenarioOptions {
  createUsers?: boolean
  createEvents?: boolean
  createRegistrationScenarios?: boolean
  createPaymentScenarios?: boolean
  createFriendRegistrations?: boolean
  createWaitingListScenarios?: boolean
  createPerformanceData?: boolean
}

/**
 * Comprehensive test data seeder
 */
export class TestDataSeeder {
  private prisma: PrismaClient

  constructor(database: PrismaClient = prisma) {
    this.prisma = database
  }

  /**
   * Seeds comprehensive test data for all scenarios
   */
  async seedTestData(options: TestScenarioOptions = {}) {
    const {
      createUsers = true,
      createEvents = true,
      createRegistrationScenarios = true,
      createPaymentScenarios = true,
      createFriendRegistrations = true,
      createWaitingListScenarios = true,
      createPerformanceData = false
    } = options

    console.log('🌱 Seeding comprehensive test data...')

    // Clean existing test data
    await this.cleanTestData()

    // Create base data
    const { users, roles, bankAccounts } = await this.createBaseData()

    // Create events if requested
    let events: any[] = []
    if (createEvents) {
      events = await this.createTestEvents(users.slice(0, 3)) // First 3 users as event creators
    }

    // Create registration scenarios
    if (createRegistrationScenarios && events.length > 0) {
      await this.createRegistrationScenarios(events, users, bankAccounts)
    }

    // Create payment scenarios
    if (createPaymentScenarios && events.length > 0) {
      await this.createPaymentScenarios(events, users, bankAccounts)
    }

    // Create friend registration scenarios
    if (createFriendRegistrations && events.length > 0) {
      await this.createFriendRegistrationScenarios(events, users, bankAccounts)
    }

    // Create waiting list scenarios
    if (createWaitingListScenarios && events.length > 0) {
      await this.createWaitingListScenarios(events, users)
    }

    // Create performance test data
    if (createPerformanceData && events.length > 0) {
      await this.createPerformanceTestData(events[0], bankAccounts[0])
    }

    console.log('🎉 Test data seeding complete!')
    
    return {
      users,
      roles,
      bankAccounts,
      events
    }
  }

  /**
   * Creates base data required for all tests
   */
  private async createBaseData() {
    console.log('👥 Creating test users and roles...')

    // Create test roles (simplified for testing)
    const userRole = await this.prisma.role.upsert({
      where: { name: 'TEST_USER' },
      update: {},
      create: {
        name: 'TEST_USER',
        displayName: 'Test User',
        description: 'User role for testing',
        permissions: ['events.view', 'events.register'],
        isDefault: true
      }
    })

    const adminRole = await this.prisma.role.upsert({
      where: { name: 'TEST_ADMIN' },
      update: {},
      create: {
        name: 'TEST_ADMIN',
        displayName: 'Test Admin',
        description: 'Admin role for testing',
        permissions: ['*'],
        priority: 10
      }
    })

    // Create test users with various profiles
    const userProfiles = [
      { email: 'john.doe@test.com', name: 'John Doe', firstName: 'John', lastName: 'Doe' },
      { email: 'jane.smith@test.com', name: 'Jane Smith', firstName: 'Jane', lastName: 'Smith' },
      { email: 'admin@test.com', name: 'Test Admin', firstName: 'Test', lastName: 'Admin' },
      { email: 'alice.johnson@test.com', name: 'Alice Johnson', firstName: 'Alice', lastName: 'Johnson' },
      { email: 'bob.wilson@test.com', name: 'Bob Wilson', firstName: 'Bob', lastName: 'Wilson' },
      { email: 'carol.brown@test.com', name: 'Carol Brown', firstName: 'Carol', lastName: 'Brown' },
      { email: 'david.miller@test.com', name: 'David Miller', firstName: 'David', lastName: 'Miller' },
      { email: 'emma.davis@test.com', name: 'Emma Davis', firstName: 'Emma', lastName: 'Davis' },
      { email: 'frank.garcia@test.com', name: 'Frank Garcia', firstName: 'Frank', lastName: 'Garcia' },
      { email: 'grace.rodriguez@test.com', name: 'Grace Rodriguez', firstName: 'Grace', lastName: 'Rodriguez' }
    ]

    const users = []
    for (const [index, profile] of userProfiles.entries()) {
      const roleId = index === 2 ? adminRole.id : userRole.id // Third user is admin
      const user = await this.prisma.user.create({
        data: {
          ...profile,
          primaryRoleId: roleId,
          status: 'ACTIVE',
          preferredLocale: 'en'
        }
      })
      
      // Create user role assignment
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId
        }
      })

      users.push(user)
    }

    // Create test bank accounts
    const bankAccounts = await Promise.all([
      this.prisma.bankAccount.create({
        data: {
          name: 'Primary Test Account',
          bankName: 'Test Bank',
          accountNumber: '1234567890',
          bankCode: '1100',
          iban: 'SK8911000000001234567890',
          swift: 'TESTSKBX',
          isDefault: true,
          isActive: true,
          qrCodeEnabled: true
        }
      }),
      this.prisma.bankAccount.create({
        data: {
          name: 'Secondary Test Account',
          bankName: 'Test Bank 2',
          accountNumber: '0987654321',
          bankCode: '0900',
          iban: 'SK3109000000000987654321',
          swift: 'TEST2SKB',
          isDefault: false,
          isActive: true,
          qrCodeEnabled: true
        }
      })
    ])

    console.log(`✅ Created ${users.length} test users and ${bankAccounts.length} bank accounts`)

    return { users, roles: [userRole, adminRole], bankAccounts }
  }

  /**
   * Creates test events with various configurations
   */
  private async createTestEvents(creators: any[]) {
    console.log('🎪 Creating test events...')

    const eventTemplates = [
      {
        title: 'Small Workshop (Capacity 5)',
        slug: 'small-workshop-test',
        capacity: 5,
        price: 25.00,
        description: 'A small workshop for testing capacity limits',
        venue: 'Small Conference Room'
      },
      {
        title: 'Medium Conference (Capacity 20)',
        slug: 'medium-conference-test',
        capacity: 20,
        price: 50.00,
        description: 'A medium-sized conference for testing group registrations',
        venue: 'Main Conference Hall'
      },
      {
        title: 'Large Meetup (Capacity 100)',
        slug: 'large-meetup-test',
        capacity: 100,
        price: 10.00,
        description: 'A large meetup for testing performance and scalability',
        venue: 'Convention Center'
      },
      {
        title: 'Free Event (No Payment)',
        slug: 'free-event-test',
        capacity: 15,
        price: 0,
        description: 'A free event for testing non-payment scenarios',
        venue: 'Community Center',
        requiresPayment: false
      },
      {
        title: 'Premium Workshop (High Price)',
        slug: 'premium-workshop-test',
        capacity: 8,
        price: 150.00,
        description: 'A premium workshop for testing high-value payments',
        venue: 'Exclusive Training Room'
      }
    ]

    const events = []
    for (const [index, template] of eventTemplates.entries()) {
      const creator = creators[index % creators.length]
      const startDate = new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000) // Weeks in future
      
      const event = await this.prisma.event.create({
        data: {
          ...template,
          creatorId: creator.id,
          startDate,
          endDate: new Date(startDate.getTime() + 4 * 60 * 60 * 1000), // 4 hours later
          status: 'PUBLISHED',
          currency: 'EUR',
          requiresPayment: template.requiresPayment ?? true,
          allowWaitingList: true
        }
      })
      events.push(event)
    }

    console.log(`✅ Created ${events.length} test events`)
    return events
  }

  /**
   * Creates various registration scenarios
   */
  private async createRegistrationScenarios(events: any[], users: any[], bankAccounts: any[]) {
    console.log('📝 Creating registration scenarios...')

    const smallWorkshop = events[0] // Capacity 5
    const mediumConference = events[1] // Capacity 20

    // Scenario 1: Fill small workshop to capacity with confirmed registrations
    for (let i = 0; i < 3; i++) {
      await this.prisma.registration.create({
        data: {
          userId: users[i + 3].id, // Start from 4th user
          eventId: smallWorkshop.id,
          status: 'CONFIRMED',
          registrationType: 'INDIVIDUAL',
          requiresPayment: true
        }
      })
    }

    // Scenario 2: Add pending registrations to medium conference
    for (let i = 0; i < 5; i++) {
      await this.prisma.registration.create({
        data: {
          userId: users[i + 4].id,
          eventId: mediumConference.id,
          status: 'PENDING',
          registrationType: 'INDIVIDUAL',
          requiresPayment: true
        }
      })
    }

    console.log('✅ Created registration scenarios')
  }

  /**
   * Creates payment scenarios with various statuses
   */
  private async createPaymentScenarios(events: any[], users: any[], bankAccounts: any[]) {
    console.log('💳 Creating payment scenarios...')

    const smallWorkshop = events[0]
    const mediumConference = events[1]
    const bankAccount = bankAccounts[0]

    // Scenario 1: Pending payments awaiting verification
    for (let i = 0; i < 2; i++) {
      await this.prisma.pendingPayment.create({
        data: {
          userId: users[i + 5].id,
          eventId: smallWorkshop.id,
          bankAccountId: bankAccount.id,
          status: 'AWAITING_PAYMENT',
          amount: smallWorkshop.price,
          currency: 'EUR',
          paymentMethod: 'QR_CODE',
          registrationType: 'INDIVIDUAL',
          totalParticipants: 1,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          variableSymbol: `${Date.now()}${i}`,
          qrCodeData: `SPD*1.0*ACC:${bankAccount.iban}*AM:${smallWorkshop.price}*CC:EUR*VS:${Date.now()}${i}`
        }
      })
    }

    // Scenario 2: Payment received but not yet processed
    await this.prisma.pendingPayment.create({
      data: {
        userId: users[7].id,
        eventId: mediumConference.id,
        bankAccountId: bankAccount.id,
        status: 'PAYMENT_RECEIVED',
        amount: mediumConference.price,
        currency: 'EUR',
        paymentMethod: 'QR_CODE',
        registrationType: 'INDIVIDUAL',
        totalParticipants: 1,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        variableSymbol: `${Date.now()}7`,
        paidAt: new Date(),
        verifiedAt: new Date()
      }
    })

    // Scenario 3: Expired payment
    await this.prisma.pendingPayment.create({
      data: {
        userId: users[8].id,
        eventId: mediumConference.id,
        bankAccountId: bankAccount.id,
        status: 'EXPIRED',
        amount: mediumConference.price,
        currency: 'EUR',
        paymentMethod: 'QR_CODE',
        registrationType: 'INDIVIDUAL',
        totalParticipants: 1,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
        variableSymbol: `${Date.now()}8`
      }
    })

    console.log('✅ Created payment scenarios')
  }

  /**
   * Creates friend registration scenarios
   */
  private async createFriendRegistrationScenarios(events: any[], users: any[], bankAccounts: any[]) {
    console.log('👥 Creating friend registration scenarios...')

    const mediumConference = events[1]
    const bankAccount = bankAccounts[0]

    // Scenario 1: Group registration with friends data
    const friendsData = [
      {
        name: 'Michael Friend',
        email: 'michael.friend@test.com',
        phone: '+421900111222',
        dietaryRequirements: 'Vegetarian',
        specialRequests: 'Wheelchair accessible seating'
      },
      {
        name: 'Sarah Buddy',
        email: 'sarah.buddy@test.com',
        phone: '+421900333444',
        dietaryRequirements: 'Gluten-free',
        specialRequests: 'None'
      }
    ]

    // Create pending payment for group registration
    await this.prisma.pendingPayment.create({
      data: {
        userId: users[9].id,
        eventId: mediumConference.id,
        bankAccountId: bankAccount.id,
        status: 'AWAITING_PAYMENT',
        amount: mediumConference.price * 3, // User + 2 friends
        currency: 'EUR',
        paymentMethod: 'QR_CODE',
        registrationType: 'GROUP',
        totalParticipants: 3,
        friendsData,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        variableSymbol: `${Date.now()}9`
      }
    })

    // Scenario 2: Confirmed group registration
    await this.prisma.registration.create({
      data: {
        userId: users[6].id,
        eventId: mediumConference.id,
        status: 'CONFIRMED',
        registrationType: 'GROUP',
        isGroupLeader: true,
        groupSize: 2,
        friendsData: [friendsData[0]], // One friend
        dietaryRequirements: 'None',
        requiresPayment: true
      }
    })

    console.log('✅ Created friend registration scenarios')
  }

  /**
   * Creates waiting list scenarios
   */
  private async createWaitingListScenarios(events: any[], users: any[]) {
    console.log('⏳ Creating waiting list scenarios...')

    const smallWorkshop = events[0] // Already at capacity
    
    // Add users to waiting list
    for (let i = 0; i < 3; i++) {
      // Find available user (not already registered)
      let userIndex = i + 7
      while (userIndex < users.length) {
        const existingRegistration = await this.prisma.registration.findFirst({
          where: {
            userId: users[userIndex].id,
            eventId: smallWorkshop.id
          }
        })
        
        if (!existingRegistration) break
        userIndex++
      }

      if (userIndex < users.length) {
        await this.prisma.waitingList.create({
          data: {
            userId: users[userIndex].id,
            eventId: smallWorkshop.id,
            position: i + 1,
            registrationType: 'INDIVIDUAL',
            isGroupEntry: false,
            groupSize: 1
          }
        })
      }
    }

    // Add group waiting list entry
    if (users.length > 10) {
      await this.prisma.waitingList.create({
        data: {
          userId: users[9].id,
          eventId: smallWorkshop.id,
          position: 4,
          registrationType: 'GROUP',
          isGroupEntry: true,
          groupSize: 2,
          friendsData: [{
            name: 'Waiting Friend',
            email: 'waiting.friend@test.com'
          }]
        }
      })
    }

    console.log('✅ Created waiting list scenarios')
  }

  /**
   * Creates performance test data for load testing
   */
  private async createPerformanceTestData(event: any, bankAccount: any) {
    console.log('🚀 Creating performance test data...')

    const userBatch = []
    const registrationBatch = []

    // Create 50 test users for performance testing
    for (let i = 0; i < 50; i++) {
      userBatch.push({
        email: `perftest-user-${i}@test.com`,
        name: `Performance Test User ${i}`,
        firstName: `PerfUser${i}`,
        lastName: 'Test',
        status: 'ACTIVE',
        preferredLocale: 'en'
      })
    }

    // Bulk create users (if supported)
    const perfUsers = await this.prisma.user.createMany({
      data: userBatch,
      skipDuplicates: true
    })

    // Get created users for registration
    const createdUsers = await this.prisma.user.findMany({
      where: {
        email: {
          startsWith: 'perftest-user-'
        }
      },
      take: 50
    })

    // Create various registration states for performance testing
    const registrationPromises = createdUsers.slice(0, 30).map((user, index) => {
      const status = index % 3 === 0 ? 'CONFIRMED' : 
                    index % 3 === 1 ? 'PENDING' : 'CANCELLED'
      
      return this.prisma.registration.create({
        data: {
          userId: user.id,
          eventId: event.id,
          status,
          registrationType: 'INDIVIDUAL',
          requiresPayment: true
        }
      })
    })

    await Promise.all(registrationPromises)

    // Create pending payments for remaining users
    const pendingPaymentPromises = createdUsers.slice(30, 45).map((user, index) => {
      return this.prisma.pendingPayment.create({
        data: {
          userId: user.id,
          eventId: event.id,
          bankAccountId: bankAccount.id,
          status: index % 2 === 0 ? 'AWAITING_PAYMENT' : 'PAYMENT_RECEIVED',
          amount: event.price,
          currency: 'EUR',
          paymentMethod: 'QR_CODE',
          registrationType: 'INDIVIDUAL',
          totalParticipants: 1,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          variableSymbol: `${Date.now()}${index}${user.id.slice(-4)}`
        }
      })
    })

    await Promise.all(pendingPaymentPromises)

    // Create waiting list entries
    const waitingListPromises = createdUsers.slice(45).map((user, index) => {
      return this.prisma.waitingList.create({
        data: {
          userId: user.id,
          eventId: event.id,
          position: index + 1,
          registrationType: 'INDIVIDUAL',
          isGroupEntry: false,
          groupSize: 1
        }
      })
    })

    await Promise.all(waitingListPromises)

    console.log('✅ Created performance test data (50 users with various states)')
  }

  /**
   * Cleans all test data
   */
  private async cleanTestData() {
    console.log('🧹 Cleaning existing test data...')

    // Clean in dependency order
    await this.prisma.registrationHistory.deleteMany({
      where: {
        user: {
          email: {
            contains: 'test.com'
          }
        }
      }
    })

    await this.prisma.payment.deleteMany({
      where: {
        user: {
          email: {
            contains: 'test.com'
          }
        }
      }
    })

    await this.prisma.registration.deleteMany({
      where: {
        user: {
          email: {
            contains: 'test.com'
          }
        }
      }
    })

    await this.prisma.waitingList.deleteMany({
      where: {
        user: {
          email: {
            contains: 'test.com'
          }
        }
      }
    })

    await this.prisma.pendingPayment.deleteMany({
      where: {
        user: {
          email: {
            contains: 'test.com'
          }
        }
      }
    })

    await this.prisma.event.deleteMany({
      where: {
        slug: {
          endsWith: '-test'
        }
      }
    })

    await this.prisma.userRole.deleteMany({
      where: {
        user: {
          email: {
            contains: 'test.com'
          }
        }
      }
    })

    await this.prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test.com'
        }
      }
    })

    await this.prisma.bankAccount.deleteMany({
      where: {
        name: {
          contains: 'Test'
        }
      }
    })

    await this.prisma.role.deleteMany({
      where: {
        name: {
          startsWith: 'TEST_'
        }
      }
    })

    console.log('✅ Test data cleanup complete')
  }
}

// Main function for running as script
async function main() {
  const seeder = new TestDataSeeder()
  
  try {
    await seeder.seedTestData({
      createUsers: true,
      createEvents: true,
      createRegistrationScenarios: true,
      createPaymentScenarios: true,
      createFriendRegistrations: true,
      createWaitingListScenarios: true,
      createPerformanceData: process.argv.includes('--performance')
    })
  } catch (error) {
    console.error('❌ Error seeding test data:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { TestDataSeeder }