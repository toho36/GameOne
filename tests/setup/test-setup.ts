/**
 * Test setup - runs before each test file
 * Handles per-test database state management
 */

import { beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'

// Global test database instance
export const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  },
  log: process.env.VITEST_LOG_SQL === 'true' ? ['query', 'info', 'warn', 'error'] : ['error']
})

// Clean database state before each test
beforeEach(async () => {
  // Start a transaction that will be rolled back after the test
  await testDb.$executeRaw`BEGIN;`
})

// Clean database state after each test
afterEach(async () => {
  // Rollback the transaction to restore clean state
  await testDb.$executeRaw`ROLLBACK;`
})