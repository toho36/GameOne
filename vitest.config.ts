import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Test environment configuration
    environment: 'node',
    
    // Global test setup and teardown
    globalSetup: ['./tests/setup/global-setup.ts'],
    setupFiles: ['./tests/setup/test-setup.ts'],
    
    // Test file patterns
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      '.next',
      'tests/e2e/**',
      'tests/fixtures/**',
      'tests/helpers/**',
      'tests/setup/**'
    ],
    
    // Test execution configuration
    testTimeout: 30000, // 30 seconds for database operations
    hookTimeout: 30000,
    teardownTimeout: 10000,
    
    // Parallel execution settings
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    
    // Database test isolation
    isolate: true,
    
    // Coverage configuration for database testing
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/**/*.{js,ts}',
        'prisma/**/*.{js,ts}',
        'tests/helpers/**/*.{js,ts}'
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{js,ts}',
        'src/**/*.spec.{js,ts}',
        'node_modules/**',
        '.next/**',
        'coverage/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Reporter configuration
    reporter: ['verbose', 'junit', 'json'],
    outputFile: {
      junit: './test-results/junit.xml',
      json: './test-results/test-results.json'
    },
    
    // Environment variables for testing
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      DIRECT_URL: process.env.TEST_DIRECT_URL || process.env.DIRECT_URL,
      // Disable external services during testing
      DISABLE_EMAIL_NOTIFICATIONS: 'true',
      DISABLE_SMS_NOTIFICATIONS: 'true',
      LOG_LEVEL: 'error' // Reduce log noise during tests
    }
  },
  
  // Path resolution for imports
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/prisma': resolve(__dirname, './prisma'),
      '@/tests': resolve(__dirname, './tests'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/types': resolve(__dirname, './src/types')
    }
  },
  
  // ESM support
  esbuild: {
    target: 'node18'
  }
})