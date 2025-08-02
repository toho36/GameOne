#!/usr/bin/env bun
/**
 * Database health check script
 * Quick health check for monitoring and CI/CD pipelines
 */

import { PrismaClient } from '@prisma/client'
import { performance } from 'perf_hooks'

const prisma = new PrismaClient()

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    name: string
    status: 'pass' | 'fail' | 'warn'
    duration: number
    message: string
  }[]
  summary: {
    totalChecks: number
    passed: number
    warnings: number
    failed: number
    totalDuration: number
  }
  timestamp: string
}

class DatabaseHealthChecker {
  private healthCheck: HealthCheck = {
    status: 'healthy',
    checks: [],
    summary: {
      totalChecks: 0,
      passed: 0,
      warnings: 0,
      failed: 0,
      totalDuration: 0
    },
    timestamp: new Date().toISOString()
  }

  private addCheck(name: string, status: 'pass' | 'fail' | 'warn', duration: number, message: string) {
    this.healthCheck.checks.push({ name, status, duration, message })
    this.healthCheck.summary.totalChecks++
    
    if (status === 'pass') this.healthCheck.summary.passed++
    else if (status === 'warn') this.healthCheck.summary.warnings++
    else this.healthCheck.summary.failed++
  }

  async checkConnection(): Promise<void> {
    const startTime = performance.now()
    
    try {
      await prisma.$queryRaw`SELECT 1 as test`
      const duration = performance.now() - startTime
      
      if (duration > 2000) {
        this.addCheck('database_connection', 'warn', duration, 
          `Connection slow: ${duration.toFixed(2)}ms`)
      } else {
        this.addCheck('database_connection', 'pass', duration, 
          `Connected: ${duration.toFixed(2)}ms`)
      }
    } catch (error) {
      const duration = performance.now() - startTime
      this.addCheck('database_connection', 'fail', duration, 
        `Connection failed: ${error}`)
    }
  }

  async checkBasicQueries(): Promise<void> {
    // User count query
    const userStartTime = performance.now()
    try {
      const userCount = await prisma.user.count()
      const userDuration = performance.now() - userStartTime
      
      if (userDuration > 1000) {
        this.addCheck('user_query', 'warn', userDuration, 
          `User count query slow: ${userDuration.toFixed(2)}ms (${userCount} users)`)
      } else {
        this.addCheck('user_query', 'pass', userDuration, 
          `User count query: ${userDuration.toFixed(2)}ms (${userCount} users)`)
      }
    } catch (error) {
      const userDuration = performance.now() - userStartTime
      this.addCheck('user_query', 'fail', userDuration, 
        `User query failed: ${error}`)
    }

    // Event count query
    const eventStartTime = performance.now()
    try {
      const eventCount = await prisma.event.count()
      const eventDuration = performance.now() - eventStartTime
      
      if (eventDuration > 1000) {
        this.addCheck('event_query', 'warn', eventDuration, 
          `Event count query slow: ${eventDuration.toFixed(2)}ms (${eventCount} events)`)
      } else {
        this.addCheck('event_query', 'pass', eventDuration, 
          `Event count query: ${eventDuration.toFixed(2)}ms (${eventCount} events)`)
      }
    } catch (error) {
      const eventDuration = performance.now() - eventStartTime
      this.addCheck('event_query', 'fail', eventDuration, 
        `Event query failed: ${error}`)
    }

    // Registration count query
    const regStartTime = performance.now()
    try {
      const registrationCount = await prisma.registration.count()
      const regDuration = performance.now() - regStartTime
      
      if (regDuration > 1000) {
        this.addCheck('registration_query', 'warn', regDuration, 
          `Registration count query slow: ${regDuration.toFixed(2)}ms (${registrationCount} registrations)`)
      } else {
        this.addCheck('registration_query', 'pass', regDuration, 
          `Registration count query: ${regDuration.toFixed(2)}ms (${registrationCount} registrations)`)
      }
    } catch (error) {
      const regDuration = performance.now() - regStartTime
      this.addCheck('registration_query', 'fail', regDuration, 
        `Registration query failed: ${error}`)
    }
  }

  async checkCriticalOperations(): Promise<void> {
    // Test write operation (create and delete a test record)
    const writeStartTime = performance.now()
    try {
      // Create test user
      const testUser = await prisma.user.create({
        data: {
          email: `health-check-${Date.now()}@test.com`,
          name: 'Health Check Test User',
          status: 'ACTIVE'
        }
      })

      // Delete test user
      await prisma.user.delete({
        where: { id: testUser.id }
      })

      const writeDuration = performance.now() - writeStartTime
      
      if (writeDuration > 2000) {
        this.addCheck('write_operation', 'warn', writeDuration, 
          `Write operation slow: ${writeDuration.toFixed(2)}ms`)
      } else {
        this.addCheck('write_operation', 'pass', writeDuration, 
          `Write operation: ${writeDuration.toFixed(2)}ms`)
      }
    } catch (error) {
      const writeDuration = performance.now() - writeStartTime
      this.addCheck('write_operation', 'fail', writeDuration, 
        `Write operation failed: ${error}`)
    }

    // Test transaction
    const transactionStartTime = performance.now()
    try {
      await prisma.$transaction(async (tx) => {
        const count = await tx.user.count()
        return count
      })

      const transactionDuration = performance.now() - transactionStartTime
      
      if (transactionDuration > 2000) {
        this.addCheck('transaction', 'warn', transactionDuration, 
          `Transaction slow: ${transactionDuration.toFixed(2)}ms`)
      } else {
        this.addCheck('transaction', 'pass', transactionDuration, 
          `Transaction: ${transactionDuration.toFixed(2)}ms`)
      }
    } catch (error) {
      const transactionDuration = performance.now() - transactionStartTime
      this.addCheck('transaction', 'fail', transactionDuration, 
        `Transaction failed: ${error}`)
    }
  }

  async checkDataConsistency(): Promise<void> {
    // Check for orphaned records (quick version)
    const orphanStartTime = performance.now()
    try {
      const orphanedRegistrations = await prisma.registration.count({
        where: {
          AND: [
            { userId: { not: null } },
            { user: null }
          ]
        }
      })

      const orphanDuration = performance.now() - orphanStartTime
      
      if (orphanedRegistrations > 0) {
        this.addCheck('data_consistency', 'warn', orphanDuration, 
          `Found ${orphanedRegistrations} orphaned registrations`)
      } else {
        this.addCheck('data_consistency', 'pass', orphanDuration, 
          `No orphaned records found`)
      }
    } catch (error) {
      const orphanDuration = performance.now() - orphanStartTime
      this.addCheck('data_consistency', 'fail', orphanDuration, 
        `Data consistency check failed: ${error}`)
    }
  }

  private calculateOverallStatus(): void {
    const totalDuration = this.healthCheck.checks.reduce((sum, check) => sum + check.duration, 0)
    this.healthCheck.summary.totalDuration = totalDuration

    if (this.healthCheck.summary.failed > 0) {
      this.healthCheck.status = 'unhealthy'
    } else if (this.healthCheck.summary.warnings > 0) {
      this.healthCheck.status = 'degraded'
    } else {
      this.healthCheck.status = 'healthy'
    }
  }

  async performHealthCheck(): Promise<HealthCheck> {
    console.log('🏥 Running database health check...')

    const overallStartTime = performance.now()

    await this.checkConnection()
    await this.checkBasicQueries()
    await this.checkCriticalOperations()
    await this.checkDataConsistency()

    const overallDuration = performance.now() - overallStartTime
    this.healthCheck.summary.totalDuration = overallDuration

    this.calculateOverallStatus()

    return this.healthCheck
  }

  printHealthCheck(): void {
    const status = this.healthCheck.status
    const statusIcon = status === 'healthy' ? '🟢' : 
                      status === 'degraded' ? '🟡' : '🔴'
    
    console.log(`\n${statusIcon} Database Status: ${status.toUpperCase()}`)
    console.log('─'.repeat(50))

    for (const check of this.healthCheck.checks) {
      const icon = check.status === 'pass' ? '✅' : 
                   check.status === 'warn' ? '⚠️' : '❌'
      
      console.log(`${icon} ${check.name}: ${check.message}`)
    }

    console.log('\n📊 Summary:')
    console.log(`   Total Checks: ${this.healthCheck.summary.totalChecks}`)
    console.log(`   ✅ Passed: ${this.healthCheck.summary.passed}`)
    console.log(`   ⚠️  Warnings: ${this.healthCheck.summary.warnings}`)
    console.log(`   ❌ Failed: ${this.healthCheck.summary.failed}`)
    console.log(`   ⏱️  Duration: ${this.healthCheck.summary.totalDuration.toFixed(2)}ms`)
    
    console.log(`\n🕒 Checked at: ${this.healthCheck.timestamp}`)
  }

  getExitCode(): number {
    return this.healthCheck.status === 'unhealthy' ? 1 : 0
  }
}

async function main() {
  const checker = new DatabaseHealthChecker()
  
  try {
    const result = await checker.performHealthCheck()
    
    if (process.argv.includes('--json')) {
      // JSON output for programmatic use
      console.log(JSON.stringify(result, null, 2))
    } else {
      // Human-readable output
      checker.printHealthCheck()
    }
    
    process.exit(checker.getExitCode())
    
  } catch (error) {
    console.error('❌ Health check failed with error:', error)
    
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify({
        status: 'unhealthy',
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Export for programmatic use
export { DatabaseHealthChecker }

// Run if called directly
if (require.main === module) {
  main()
}