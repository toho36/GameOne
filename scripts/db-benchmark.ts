#!/usr/bin/env bun
/**
 * Database performance benchmark script
 * Tests database performance under various load scenarios
 */

import { PrismaClient } from '@prisma/client'
import { performance } from 'perf_hooks'

const prisma = new PrismaClient()

interface BenchmarkResult {
  operation: string
  iterations: number
  totalDuration: number
  averageDuration: number
  minDuration: number
  maxDuration: number
  opsPerSecond: number
  success: boolean
  errors: number
}

class DatabaseBenchmark {
  private results: BenchmarkResult[] = []

  private async runBenchmark(
    operation: string,
    iterations: number,
    testFunction: () => Promise<void>
  ): Promise<BenchmarkResult> {
    console.log(`🏃 Running ${operation} benchmark (${iterations} iterations)...`)

    const durations: number[] = []
    let errors = 0
    const startTime = performance.now()

    for (let i = 0; i < iterations; i++) {
      const iterationStart = performance.now()
      try {
        await testFunction()
        const iterationDuration = performance.now() - iterationStart
        durations.push(iterationDuration)
      } catch (error) {
        errors++
        console.warn(`  Error in iteration ${i + 1}:`, error)
      }
    }

    const totalDuration = performance.now() - startTime
    const successfulIterations = iterations - errors
    const averageDuration = durations.length > 0 ? 
      durations.reduce((a, b) => a + b, 0) / durations.length : 0
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0
    const opsPerSecond = successfulIterations > 0 ? 
      (successfulIterations / (totalDuration / 1000)) : 0

    const result: BenchmarkResult = {
      operation,
      iterations,
      totalDuration,
      averageDuration,
      minDuration,
      maxDuration,
      opsPerSecond,
      success: errors === 0,
      errors
    }

    this.results.push(result)
    return result
  }

  async benchmarkUserOperations(): Promise<void> {
    // User creation benchmark
    await this.runBenchmark('User Creation', 100, async () => {
      const user = await prisma.user.create({
        data: {
          email: `benchmark-${Date.now()}-${Math.random()}@test.com`,
          name: 'Benchmark User',
          status: 'ACTIVE'
        }
      })
      // Clean up immediately
      await prisma.user.delete({ where: { id: user.id } })
    })

    // User lookup benchmark
    const testUser = await prisma.user.create({
      data: {
        email: `lookup-test-${Date.now()}@test.com`,
        name: 'Lookup Test User',
        status: 'ACTIVE'
      }
    })

    await this.runBenchmark('User Lookup by ID', 1000, async () => {
      await prisma.user.findUnique({ where: { id: testUser.id } })
    })

    await this.runBenchmark('User Lookup by Email', 1000, async () => {
      await prisma.user.findUnique({ where: { email: testUser.email } })
    })

    // Clean up test user
    await prisma.user.delete({ where: { id: testUser.id } })
  }

  async benchmarkRegistrationOperations(): Promise<void> {
    // Create test event and users for registration benchmarks
    const testUser = await prisma.user.create({
      data: {
        email: `reg-test-${Date.now()}@test.com`,
        name: 'Registration Test User',
        status: 'ACTIVE'
      }
    })

    const testEvent = await prisma.event.create({
      data: {
        title: 'Benchmark Test Event',
        slug: `benchmark-event-${Date.now()}`,
        capacity: 1000,
        creatorId: testUser.id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    // Registration creation benchmark
    const registrations: string[] = []
    await this.runBenchmark('Registration Creation', 100, async () => {
      const user = await prisma.user.create({
        data: {
          email: `reg-user-${Date.now()}-${Math.random()}@test.com`,
          name: 'Registration Benchmark User',
          status: 'ACTIVE'
        }
      })

      const registration = await prisma.registration.create({
        data: {
          userId: user.id,
          eventId: testEvent.id,
          status: 'CONFIRMED',
          registrationType: 'INDIVIDUAL'
        }
      })

      registrations.push(registration.id)
    })

    // Registration lookup benchmark
    if (registrations.length > 0) {
      const sampleRegistrationId = registrations[0]
      await this.runBenchmark('Registration Lookup', 1000, async () => {
        await prisma.registration.findUnique({
          where: { id: sampleRegistrationId },
          include: { user: true, event: true }
        })
      })
    }

    // Event capacity calculation benchmark
    await this.runBenchmark('Event Capacity Calculation', 500, async () => {
      const confirmedCount = await prisma.registration.count({
        where: {
          eventId: testEvent.id,
          status: { in: ['CONFIRMED', 'ATTENDED'] }
        }
      })

      const pendingPaymentCount = await prisma.pendingPayment.count({
        where: {
          eventId: testEvent.id,
          status: { in: ['PAYMENT_RECEIVED', 'PROCESSED'] }
        }
      })

      // Simulate capacity calculation
      const effectiveCount = confirmedCount + pendingPaymentCount
      const availableSpots = Math.max(0, testEvent.capacity - effectiveCount)
    })

    // Clean up
    await prisma.registration.deleteMany({ where: { eventId: testEvent.id } })
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'reg-user-' } }
    })
    await prisma.event.delete({ where: { id: testEvent.id } })
    await prisma.user.delete({ where: { id: testUser.id } })
  }

  async benchmarkPaymentOperations(): Promise<void> {
    // Create test data
    const testUser = await prisma.user.create({
      data: {
        email: `payment-test-${Date.now()}@test.com`,
        name: 'Payment Test User',
        status: 'ACTIVE'
      }
    })

    const testEvent = await prisma.event.create({
      data: {
        title: 'Payment Benchmark Event',
        slug: `payment-benchmark-${Date.now()}`,
        capacity: 1000,
        creatorId: testUser.id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    const bankAccount = await prisma.bankAccount.create({
      data: {
        name: 'Benchmark Bank Account',
        bankName: 'Test Bank',
        accountNumber: '1234567890',
        bankCode: '1100',
        iban: `SK89110000000012345${Date.now()}`,
        swift: 'TESTSKBX'
      }
    })

    // Pending payment creation benchmark
    const payments: string[] = []
    await this.runBenchmark('Pending Payment Creation', 100, async () => {
      const user = await prisma.user.create({
        data: {
          email: `payment-user-${Date.now()}-${Math.random()}@test.com`,
          name: 'Payment Benchmark User',
          status: 'ACTIVE'
        }
      })

      const payment = await prisma.pendingPayment.create({
        data: {
          userId: user.id,
          eventId: testEvent.id,
          bankAccountId: bankAccount.id,
          amount: 25.00,
          currency: 'EUR',
          paymentMethod: 'QR_CODE',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          variableSymbol: `${Date.now()}${Math.random().toString().slice(2, 8)}`
        }
      })

      payments.push(payment.id)
    })

    // Payment status update benchmark
    await this.runBenchmark('Payment Status Update', 200, async () => {
      if (payments.length > 0) {
        const randomPaymentId = payments[Math.floor(Math.random() * payments.length)]
        await prisma.pendingPayment.update({
          where: { id: randomPaymentId },
          data: {
            status: 'PAYMENT_RECEIVED',
            paidAt: new Date(),
            verifiedAt: new Date()
          }
        })
      }
    })

    // Clean up
    await prisma.pendingPayment.deleteMany({ where: { eventId: testEvent.id } })
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'payment-user-' } }
    })
    await prisma.bankAccount.delete({ where: { id: bankAccount.id } })
    await prisma.event.delete({ where: { id: testEvent.id } })
    await prisma.user.delete({ where: { id: testUser.id } })
  }

  async benchmarkComplexQueries(): Promise<void> {
    // Create test data for complex queries
    const testUser = await prisma.user.create({
      data: {
        email: `complex-test-${Date.now()}@test.com`,
        name: 'Complex Query Test User',
        status: 'ACTIVE'
      }
    })

    const testEvent = await prisma.event.create({
      data: {
        title: 'Complex Query Event',
        slug: `complex-query-${Date.now()}`,
        capacity: 50,
        creatorId: testUser.id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    // Create sample registrations
    for (let i = 0; i < 20; i++) {
      const user = await prisma.user.create({
        data: {
          email: `complex-user-${i}-${Date.now()}@test.com`,
          name: `Complex User ${i}`,
          status: 'ACTIVE'
        }
      })

      await prisma.registration.create({
        data: {
          userId: user.id,
          eventId: testEvent.id,
          status: i % 3 === 0 ? 'CONFIRMED' : i % 3 === 1 ? 'PENDING' : 'CANCELLED',
          registrationType: 'INDIVIDUAL'
        }
      })
    }

    // Complex join query benchmark
    await this.runBenchmark('Complex Join Query', 100, async () => {
      await prisma.event.findUnique({
        where: { id: testEvent.id },
        include: {
          registrations: {
            include: {
              user: true
            },
            orderBy: { registeredAt: 'desc' }
          },
          creator: true
        }
      })
    })

    // Aggregation query benchmark
    await this.runBenchmark('Aggregation Query', 200, async () => {
      await prisma.registration.groupBy({
        by: ['status'],
        where: { eventId: testEvent.id },
        _count: { status: true }
      })
    })

    // Clean up
    await prisma.registration.deleteMany({ where: { eventId: testEvent.id } })
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'complex-user-' } }
    })
    await prisma.event.delete({ where: { id: testEvent.id } })
    await prisma.user.delete({ where: { id: testUser.id } })
  }

  async runAllBenchmarks(): Promise<void> {
    console.log('🚀 Starting database performance benchmarks...\n')

    const overallStartTime = performance.now()

    await this.benchmarkUserOperations()
    await this.benchmarkRegistrationOperations()
    await this.benchmarkPaymentOperations()
    await this.benchmarkComplexQueries()

    const overallDuration = performance.now() - overallStartTime

    this.printResults(overallDuration)
  }

  private printResults(overallDuration: number): void {
    console.log('\n📊 Benchmark Results')
    console.log('═'.repeat(80))

    for (const result of this.results) {
      const statusIcon = result.success ? '✅' : '❌'
      const errorInfo = result.errors > 0 ? ` (${result.errors} errors)` : ''
      
      console.log(`\n${statusIcon} ${result.operation}${errorInfo}`)
      console.log('─'.repeat(40))
      console.log(`   Iterations: ${result.iterations}`)
      console.log(`   Total Duration: ${result.totalDuration.toFixed(2)}ms`)
      console.log(`   Average Duration: ${result.averageDuration.toFixed(2)}ms`)
      console.log(`   Min Duration: ${result.minDuration.toFixed(2)}ms`)
      console.log(`   Max Duration: ${result.maxDuration.toFixed(2)}ms`)
      console.log(`   Operations/Second: ${result.opsPerSecond.toFixed(2)}`)
    }

    console.log('\n🎯 Summary')
    console.log('─'.repeat(40))
    console.log(`Total Benchmarks: ${this.results.length}`)
    console.log(`Successful: ${this.results.filter(r => r.success).length}`)
    console.log(`Failed: ${this.results.filter(r => !r.success).length}`)
    console.log(`Overall Duration: ${overallDuration.toFixed(2)}ms`)

    // Performance analysis
    console.log('\n📈 Performance Analysis')
    console.log('─'.repeat(40))

    const slowOperations = this.results.filter(r => r.averageDuration > 100)
    if (slowOperations.length > 0) {
      console.log('⚠️  Slow Operations (>100ms average):')
      slowOperations.forEach(op => {
        console.log(`   ${op.operation}: ${op.averageDuration.toFixed(2)}ms`)
      })
    } else {
      console.log('✅ All operations performing well (<100ms average)')
    }

    const fastOperations = this.results.filter(r => r.averageDuration < 10)
    if (fastOperations.length > 0) {
      console.log('\n🚀 Fast Operations (<10ms average):')
      fastOperations.forEach(op => {
        console.log(`   ${op.operation}: ${op.averageDuration.toFixed(2)}ms`)
      })
    }

    console.log('\n' + '═'.repeat(80))
  }

  getResults(): BenchmarkResult[] {
    return this.results
  }
}

async function main() {
  const benchmark = new DatabaseBenchmark()
  
  try {
    await benchmark.runAllBenchmarks()
    
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(benchmark.getResults(), null, 2))
    }
    
  } catch (error) {
    console.error('❌ Benchmark failed with error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Export for programmatic use
export { DatabaseBenchmark }

// Run if called directly
if (require.main === module) {
  main()
}