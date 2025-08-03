/**
 * Prisma Client Configuration for Serverless Environment
 * Optimized for Vercel deployment with connection pooling
 */

import { PrismaClient } from '@prisma/client'

// Global variable to store Prisma client instance
declare global {

  var __prisma: PrismaClient | undefined
}

/**
 * Connection pool configuration for serverless environments
 * These settings ensure efficient connection management in Vercel Functions
 */
const connectionPoolConfig = {
  // Maximum number of connections in the pool
  connectionLimit: 20,
  // Connection timeout in seconds
  poolTimeout: 20,
  // Enable connection pooling
  pool: {
    min: 0, // Minimum connections (0 for serverless)
    max: 20, // Maximum connections
    acquireTimeoutMillis: 30000, // Time to wait for connection
    createTimeoutMillis: 30000, // Time to wait for connection creation
    destroyTimeoutMillis: 5000, // Time to wait for connection destruction
    idleTimeoutMillis: 30000, // Time before idle connection is closed
    reapIntervalMillis: 1000, // How often to check for idle connections
    createRetryIntervalMillis: 100, // Time between retry attempts
  },
}

/**
 * Prisma Client configuration for different environments
 */
const createPrismaClient = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'

  // Base configuration
  const baseConfig = {
    datasources: {
      db: {
        url: process.env.DATABASE_URL ?? '',
      },
    },
  }

  // Development configuration
  if (isDevelopment) {
    return new PrismaClient({
      ...baseConfig,
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    })
  }

  // Production configuration
  if (isProduction) {
    const productionUrl = `${process.env.DATABASE_URL}?connection_limit=${connectionPoolConfig.connectionLimit}&pool_timeout=${connectionPoolConfig.poolTimeout}`

    return new PrismaClient({
      ...baseConfig,
      log: ['error'],
      datasources: {
        db: {
          url: productionUrl,
        },
      },
    })
  }

  // Default configuration
  return new PrismaClient({
    ...baseConfig,
    log: ['error'],
  })
}

/**
 * Global Prisma client instance with connection reuse
 * In serverless environments, we want to reuse connections across invocations
 */
export const prisma = globalThis.__prisma ?? createPrismaClient()

// Store the client globally in development to prevent multiple instances
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

/**
 * Connection health check utility
 * Useful for monitoring database connectivity
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}

/**
 * Graceful disconnection utility
 * Important for proper cleanup in serverless environments
 */
export const disconnectPrisma = async (): Promise<void> => {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error disconnecting Prisma:', error)
  }
}

/**
 * Database transaction helper with retry logic
 * Handles connection issues gracefully in serverless environments
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      // Don't retry on certain types of errors
      if (
        error instanceof Error &&
        (error.message.includes('Unique constraint') ||
          error.message.includes('Foreign key constraint') ||
          error.message.includes('Check constraint'))
      ) {
        throw error
      }

      if (attempt === maxRetries) {
        throw lastError
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new Error('Retry operation failed')
}

/**
 * Query optimization helper for large datasets
 * Implements cursor-based pagination for better performance
 */
export const paginateQuery = (
  model: {
    findMany: (options: {
      where?: object
      orderBy?: object
      take?: number
      cursor?: { id: string }
      skip?: number
      select?: object
      include?: object
    }) => Promise<unknown[]>
  },
  options: {
    where?: object
    orderBy?: object
    take?: number
    cursor?: string
    select?: object
    include?: object
  } = {}
) => {
  const {
    where = {},
    orderBy = { id: 'asc' },
    take = 50,
    cursor,
    select,
    include
  } = options

  const queryOptions: {
    where: object
    orderBy: object
    take: number
    cursor?: { id: string }
    skip?: number
    select?: object
    include?: object
  } = {
    where,
    orderBy,
    take: take + 1, // Take one extra to check if there are more results
  }

  if (cursor) {
    queryOptions.cursor = { id: cursor }
    queryOptions.skip = 1 // Skip the cursor item
  }

  if (select) {
    queryOptions.select = select
  }

  if (include) {
    queryOptions.include = include
  }

  return model.findMany(queryOptions)
}

/**
 * Database metrics and monitoring
 * Useful for tracking performance in production
 */
export const getDatabaseMetrics = async () => {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      ORDER BY tablename, attname
      LIMIT 10
    `

    return result
  } catch (error) {
    console.error('Failed to get database metrics:', error)
    return null
  }
}

// Export default instance
export default prisma