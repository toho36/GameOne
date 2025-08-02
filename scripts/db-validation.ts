#!/usr/bin/env bun
/**
 * Database validation and health check script
 * Validates database schema, data integrity, and performance
 */

import { PrismaClient } from '@prisma/client'
import { performance } from 'perf_hooks'

const prisma = new PrismaClient()

interface ValidationResult {
  category: string
  test: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  duration?: number
  details?: any
}

class DatabaseValidator {
  private results: ValidationResult[] = []

  private addResult(category: string, test: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, duration?: number, details?: any) {
    this.results.push({
      category,
      test,
      status,
      message,
      duration,
      details
    })
  }

  async validateConnection() {
    const category = 'Connection'
    const startTime = performance.now()

    try {
      await prisma.$queryRaw`SELECT 1`
      const duration = performance.now() - startTime
      
      if (duration > 1000) {
        this.addResult(category, 'Database Connection', 'WARNING', 
          `Connection successful but slow (${duration.toFixed(2)}ms)`, duration)
      } else {
        this.addResult(category, 'Database Connection', 'PASS', 
          `Connected successfully (${duration.toFixed(2)}ms)`, duration)
      }
    } catch (error) {
      const duration = performance.now() - startTime
      this.addResult(category, 'Database Connection', 'FAIL', 
        `Failed to connect: ${error}`, duration)
    }
  }

  async validateSchema() {
    const category = 'Schema Validation'

    // Check required tables exist
    const requiredTables = [
      'users', 'events', 'registrations', 'pending_payments', 
      'waiting_list', 'payments', 'bank_accounts', 'roles'
    ]

    for (const tableName of requiredTables) {
      try {
        const startTime = performance.now()
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "${tableName}"`)
        const duration = performance.now() - startTime
        
        this.addResult(category, `Table: ${tableName}`, 'PASS', 
          `Table exists and accessible`, duration)
      } catch (error) {
        this.addResult(category, `Table: ${tableName}`, 'FAIL', 
          `Table not found or inaccessible: ${error}`)
      }
    }

    // Check indexes exist
    try {
      const indexes = await prisma.$queryRaw`
        SELECT 
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `
      
      const indexCount = (indexes as any[]).length
      if (indexCount > 0) {
        this.addResult(category, 'Database Indexes', 'PASS', 
          `Found ${indexCount} indexes`, undefined, { count: indexCount })
      } else {
        this.addResult(category, 'Database Indexes', 'WARNING', 
          'No indexes found - this may impact performance')
      }
    } catch (error) {
      this.addResult(category, 'Database Indexes', 'FAIL', 
        `Failed to check indexes: ${error}`)
    }
  }

  async validateDataIntegrity() {
    const category = 'Data Integrity'

    // Check for orphaned registrations
    try {
      const orphanedRegistrations = await prisma.registration.findMany({
        where: {
          AND: [
            { userId: { not: null } },
            { user: null }
          ]
        }
      })

      if (orphanedRegistrations.length === 0) {
        this.addResult(category, 'Orphaned Registrations', 'PASS', 
          'No orphaned registrations found')
      } else {
        this.addResult(category, 'Orphaned Registrations', 'FAIL', 
          `Found ${orphanedRegistrations.length} orphaned registrations`, 
          undefined, { count: orphanedRegistrations.length })
      }
    } catch (error) {
      this.addResult(category, 'Orphaned Registrations', 'FAIL', 
        `Failed to check orphaned registrations: ${error}`)
    }

    // Check for invalid pending payment amounts
    try {
      const invalidAmounts = await prisma.pendingPayment.findMany({
        where: {
          OR: [
            { amount: { lte: 0 } },
            { amount: null }
          ]
        }
      })

      if (invalidAmounts.length === 0) {
        this.addResult(category, 'Payment Amounts', 'PASS', 
          'All payment amounts are valid')
      } else {
        this.addResult(category, 'Payment Amounts', 'FAIL', 
          `Found ${invalidAmounts.length} payments with invalid amounts`, 
          undefined, { count: invalidAmounts.length })
      }
    } catch (error) {
      this.addResult(category, 'Payment Amounts', 'FAIL', 
        `Failed to check payment amounts: ${error}`)
    }

    // Check waiting list position consistency
    try {
      const events = await prisma.event.findMany({
        include: {
          waitingList: {
            orderBy: { position: 'asc' }
          }
        }
      })

      let inconsistentEvents = 0
      for (const event of events) {
        if (event.waitingList.length > 0) {
          let hasGaps = false
          for (let i = 0; i < event.waitingList.length; i++) {
            if (event.waitingList[i].position !== i + 1) {
              hasGaps = true
              break
            }
          }
          if (hasGaps) {
            inconsistentEvents++
          }
        }
      }

      if (inconsistentEvents === 0) {
        this.addResult(category, 'Waiting List Positions', 'PASS', 
          'All waiting list positions are consistent')
      } else {
        this.addResult(category, 'Waiting List Positions', 'WARNING', 
          `Found ${inconsistentEvents} events with inconsistent waiting list positions`,
          undefined, { count: inconsistentEvents })
      }
    } catch (error) {
      this.addResult(category, 'Waiting List Positions', 'FAIL', 
        `Failed to check waiting list positions: ${error}`)
    }

    // Check for duplicate registrations
    try {
      const duplicates = await prisma.$queryRaw`
        SELECT "userId", "eventId", COUNT(*)
        FROM "registrations"
        WHERE "userId" IS NOT NULL
        GROUP BY "userId", "eventId"
        HAVING COUNT(*) > 1
      `

      const duplicateCount = (duplicates as any[]).length
      if (duplicateCount === 0) {
        this.addResult(category, 'Duplicate Registrations', 'PASS', 
          'No duplicate registrations found')
      } else {
        this.addResult(category, 'Duplicate Registrations', 'FAIL', 
          `Found ${duplicateCount} duplicate registrations`, 
          undefined, { count: duplicateCount })
      }
    } catch (error) {
      this.addResult(category, 'Duplicate Registrations', 'FAIL', 
        `Failed to check duplicate registrations: ${error}`)
    }
  }

  async validateBusinessRules() {
    const category = 'Business Rules'

    // Check events with negative capacity
    try {
      const negativeCapacityEvents = await prisma.event.findMany({
        where: { capacity: { lt: 0 } }
      })

      if (negativeCapacityEvents.length === 0) {
        this.addResult(category, 'Event Capacity', 'PASS', 
          'All events have valid capacity')
      } else {
        this.addResult(category, 'Event Capacity', 'FAIL', 
          `Found ${negativeCapacityEvents.length} events with negative capacity`,
          undefined, { count: negativeCapacityEvents.length })
      }
    } catch (error) {
      this.addResult(category, 'Event Capacity', 'FAIL', 
        `Failed to check event capacity: ${error}`)
    }

    // Check for events with end date before start date
    try {
      const invalidDateEvents = await prisma.event.findMany({
        where: {
          AND: [
            { endDate: { not: null } },
            { endDate: { lt: prisma.event.fields.startDate } }
          ]
        }
      })

      if (invalidDateEvents.length === 0) {
        this.addResult(category, 'Event Dates', 'PASS', 
          'All event dates are valid')
      } else {
        this.addResult(category, 'Event Dates', 'FAIL', 
          `Found ${invalidDateEvents.length} events with end date before start date`,
          undefined, { count: invalidDateEvents.length })
      }
    } catch (error) {
      this.addResult(category, 'Event Dates', 'FAIL', 
        `Failed to check event dates: ${error}`)
    }

    // Check for expired pending payments that are still awaiting
    try {
      const now = new Date()
      const expiredPendingPayments = await prisma.pendingPayment.findMany({
        where: {
          status: 'AWAITING_PAYMENT',
          expiresAt: { lt: now }
        }
      })

      if (expiredPendingPayments.length === 0) {
        this.addResult(category, 'Expired Payments', 'PASS', 
          'No expired pending payments found')
      } else {
        this.addResult(category, 'Expired Payments', 'WARNING', 
          `Found ${expiredPendingPayments.length} expired pending payments that should be cleaned up`,
          undefined, { count: expiredPendingPayments.length })
      }
    } catch (error) {
      this.addResult(category, 'Expired Payments', 'FAIL', 
        `Failed to check expired payments: ${error}`)
    }
  }

  async validatePerformance() {
    const category = 'Performance'

    // Test basic query performance
    const queries = [
      {
        name: 'User Lookup',
        query: () => prisma.user.findFirst({ where: { status: 'ACTIVE' } })
      },
      {
        name: 'Event with Registrations',
        query: () => prisma.event.findFirst({
          include: {
            registrations: { take: 10 },
            pendingPayments: { take: 10 },
            waitingList: { take: 10 }
          }
        })
      },
      {
        name: 'Registration Count',
        query: () => prisma.registration.count()
      },
      {
        name: 'Payment Status Summary',
        query: () => prisma.pendingPayment.groupBy({
          by: ['status'],
          _count: { status: true }
        })
      }
    ]

    for (const { name, query } of queries) {
      try {
        const startTime = performance.now()
        await query()
        const duration = performance.now() - startTime

        if (duration > 1000) {
          this.addResult(category, name, 'WARNING', 
            `Query completed but slow (${duration.toFixed(2)}ms)`, duration)
        } else if (duration > 500) {
          this.addResult(category, name, 'WARNING', 
            `Query performance could be improved (${duration.toFixed(2)}ms)`, duration)
        } else {
          this.addResult(category, name, 'PASS', 
            `Query performed well (${duration.toFixed(2)}ms)`, duration)
        }
      } catch (error) {
        this.addResult(category, name, 'FAIL', 
          `Query failed: ${error}`)
      }
    }
  }

  async validateDataCounts() {
    const category = 'Data Counts'

    try {
      const counts = await Promise.all([
        prisma.user.count(),
        prisma.event.count(),
        prisma.registration.count(),
        prisma.pendingPayment.count(),
        prisma.waitingList.count(),
        prisma.payment.count()
      ])

      const [userCount, eventCount, registrationCount, pendingPaymentCount, waitingListCount, paymentCount] = counts

      this.addResult(category, 'Record Counts', 'PASS', 
        'Database record counts retrieved successfully', undefined, {
          users: userCount,
          events: eventCount,
          registrations: registrationCount,
          pendingPayments: pendingPaymentCount,
          waitingList: waitingListCount,
          payments: paymentCount
        })

      // Check for reasonable data distribution
      if (eventCount > 0 && registrationCount === 0) {
        this.addResult(category, 'Data Distribution', 'WARNING', 
          'Events exist but no registrations found')
      } else if (registrationCount > 0 && eventCount === 0) {
        this.addResult(category, 'Data Distribution', 'FAIL', 
          'Registrations exist but no events found - data integrity issue')
      } else {
        this.addResult(category, 'Data Distribution', 'PASS', 
          'Data distribution appears normal')
      }

    } catch (error) {
      this.addResult(category, 'Record Counts', 'FAIL', 
        `Failed to get record counts: ${error}`)
    }
  }

  async runAllValidations() {
    console.log('🔍 Starting database validation...\n')

    const startTime = performance.now()

    await this.validateConnection()
    await this.validateSchema()
    await this.validateDataIntegrity()
    await this.validateBusinessRules()
    await this.validatePerformance()
    await this.validateDataCounts()

    const totalDuration = performance.now() - startTime

    this.printResults(totalDuration)
    return this.results
  }

  private printResults(totalDuration: number) {
    console.log('\n📊 Validation Results Summary')
    console.log('═'.repeat(80))

    const categories = [...new Set(this.results.map(r => r.category))]
    
    let totalTests = 0
    let passCount = 0
    let warningCount = 0
    let failCount = 0

    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category)
      
      console.log(`\n📁 ${category}`)
      console.log('─'.repeat(40))

      for (const result of categoryResults) {
        const statusIcon = result.status === 'PASS' ? '✅' : 
                          result.status === 'WARNING' ? '⚠️' : '❌'
        
        const durationStr = result.duration ? ` (${result.duration.toFixed(2)}ms)` : ''
        console.log(`  ${statusIcon} ${result.test}: ${result.message}${durationStr}`)
        
        if (result.details) {
          console.log(`     Details: ${JSON.stringify(result.details)}`)
        }

        totalTests++
        if (result.status === 'PASS') passCount++
        else if (result.status === 'WARNING') warningCount++
        else failCount++
      }
    }

    console.log('\n🎯 Summary')
    console.log('─'.repeat(40))
    console.log(`Total Tests: ${totalTests}`)
    console.log(`✅ Passed: ${passCount}`)
    console.log(`⚠️  Warnings: ${warningCount}`)
    console.log(`❌ Failed: ${failCount}`)
    console.log(`⏱️  Total Duration: ${totalDuration.toFixed(2)}ms`)

    if (failCount === 0 && warningCount === 0) {
      console.log('\n🎉 All validations passed!')
    } else if (failCount === 0) {
      console.log('\n✨ All critical validations passed (warnings noted)')
    } else {
      console.log('\n🚨 Critical validation failures detected!')
    }

    console.log('\n' + '═'.repeat(80))
  }

  getFailureCount(): number {
    return this.results.filter(r => r.status === 'FAIL').length
  }
}

async function main() {
  const validator = new DatabaseValidator()
  
  try {
    await validator.runAllValidations()
    
    const failureCount = validator.getFailureCount()
    process.exit(failureCount > 0 ? 1 : 0)
    
  } catch (error) {
    console.error('❌ Validation failed with error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run validation if script is executed directly
if (require.main === module) {
  main()
}

export { DatabaseValidator }