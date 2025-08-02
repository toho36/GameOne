/**
 * Global test setup - runs once before all tests
 * Handles database initialization and cleanup
 */

import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function setup() {
  console.log('🔧 Setting up test environment...')
  
  try {
    // Ensure test database exists and is migrated
    console.log('📊 Setting up test database...')
    
    // Reset database to clean state
    await prisma.$executeRaw`DROP SCHEMA IF EXISTS public CASCADE;`
    await prisma.$executeRaw`CREATE SCHEMA public;`
    
    // Apply migrations
    execSync('bun prisma migrate deploy', { 
      stdio: 'inherit',
      env: { 
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
      }
    })
    
    console.log('✅ Test database setup complete')
  } catch (error) {
    console.error('❌ Failed to setup test database:', error)
    throw error
  }
}

export async function teardown() {
  console.log('🧹 Cleaning up test environment...')
  
  try {
    // Disconnect from database
    await prisma.$disconnect()
    console.log('✅ Test environment cleanup complete')
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error)
    throw error
  }
}

export default setup