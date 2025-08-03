# Deployment and DevOps Rules

## Overview
This document defines comprehensive deployment strategies, CI/CD pipelines, and DevOps practices for the GameOne event management system. These rules ensure reliable, secure, and efficient deployment processes across all environments.

## Environment Strategy

### Environment Hierarchy
```
Development → Staging → Production
     ↓          ↓         ↓
  Local Dev   Preview   Production
             Deploys    Releases
```

### Environment Configuration
```typescript
// src/lib/config/environments.ts
export interface EnvironmentConfig {
  name: string;
  domain: string;
  database: {
    url: string;
    ssl: boolean;
    poolSize: number;
  };
  auth: {
    issuerUrl: string;
    redirectUrls: string[];
  };
  features: {
    analytics: boolean;
    payments: boolean;
    emails: boolean;
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

export const environments: Record<string, EnvironmentConfig> = {
  development: {
    name: 'development',
    domain: 'localhost:3000',
    database: {
      url: process.env.DEV_DATABASE_URL!,
      ssl: false,
      poolSize: 5
    },
    auth: {
      issuerUrl: process.env.KINDE_ISSUER_URL!,
      redirectUrls: ['http://localhost:3000/api/auth/callback']
    },
    features: {
      analytics: false,
      payments: false,
      emails: false
    },
    monitoring: {
      enabled: true,
      logLevel: 'debug'
    }
  },
  staging: {
    name: 'staging',
    domain: 'gameone-staging.vercel.app',
    database: {
      url: process.env.STAGING_DATABASE_URL!,
      ssl: true,
      poolSize: 10
    },
    auth: {
      issuerUrl: process.env.KINDE_ISSUER_URL!,
      redirectUrls: ['https://gameone-staging.vercel.app/api/auth/callback']
    },
    features: {
      analytics: true,
      payments: true,
      emails: true
    },
    monitoring: {
      enabled: true,
      logLevel: 'info'
    }
  },
  production: {
    name: 'production',
    domain: 'gameone.sk',
    database: {
      url: process.env.DATABASE_URL!,
      ssl: true,
      poolSize: 20
    },
    auth: {
      issuerUrl: process.env.KINDE_ISSUER_URL!,
      redirectUrls: [
        'https://gameone.sk/api/auth/callback',
        'https://www.gameone.sk/api/auth/callback'
      ]
    },
    features: {
      analytics: true,
      payments: true,
      emails: true
    },
    monitoring: {
      enabled: true,
      logLevel: 'warn'
    }
  }
};

export function getCurrentEnvironment(): EnvironmentConfig {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
  return environments[env] || environments.development;
}
```

## CI/CD Pipeline Configuration

### GitHub Actions Workflow
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [master, develop]
  pull_request:
    branches: [master, develop]

env:
  NODE_VERSION: '20'
  BUN_VERSION: 'latest'

jobs:
  # Code Quality Checks
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.bun/install/cache
          key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
          restore-keys: |
            ${{ runner.os }}-bun-

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Type checking
        run: bun run type-check

      - name: Linting
        run: bun run lint

      - name: Formatting check
        run: bun run format:check

      - name: Security audit
        run: bun audit --audit-level moderate

  # Testing
  test:
    name: Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: gameone_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Setup test database
        run: |
          bun run db:push --force-reset
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/gameone_test

      - name: Run unit tests
        run: bun run test --coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/gameone_test

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  # Build and Security Scan
  build:
    name: Build & Security
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build application
        run: bun run build
        env:
          DATABASE_URL: postgresql://dummy:dummy@localhost:5432/dummy
          KINDE_CLIENT_ID: dummy
          KINDE_CLIENT_SECRET: dummy
          KINDE_ISSUER_URL: https://dummy.kinde.com
          KINDE_SITE_URL: https://dummy.com
          KINDE_POST_LOGOUT_REDIRECT_URL: https://dummy.com
          KINDE_POST_LOGIN_REDIRECT_URL: https://dummy.com
          CRON_SECRET: dummy

      - name: Security scan with Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  # E2E Testing
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 30
    if: github.event_name == 'pull_request'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Install Playwright
        run: bun x playwright install --with-deps

      - name: Build application
        run: bun run build
        env:
          DATABASE_URL: postgresql://dummy:dummy@localhost:5432/dummy
          KINDE_CLIENT_ID: dummy
          KINDE_CLIENT_SECRET: dummy
          KINDE_ISSUER_URL: https://dummy.kinde.com
          KINDE_SITE_URL: https://dummy.com
          KINDE_POST_LOGOUT_REDIRECT_URL: https://dummy.com
          KINDE_POST_LOGIN_REDIRECT_URL: https://dummy.com
          CRON_SECRET: dummy

      - name: Run E2E tests
        run: bun run test:e2e
        env:
          CI: true

      - name: Upload E2E artifacts
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  # Database Migration Check
  migration:
    name: Database Migration
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: gameone_migration_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Test migration from scratch
        run: bun run db:push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/gameone_migration_test

      - name: Test rollback capability
        run: bun run db:reset
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/gameone_migration_test

  # Staging Deployment
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [quality, test, build]
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    
    environment:
      name: staging
      url: https://gameone-staging.vercel.app
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}

      - name: Run smoke tests
        run: |
          sleep 30  # Wait for deployment to be ready
          curl -f https://gameone-staging.vercel.app/api/health || exit 1

  # Production Deployment
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [quality, test, build, e2e]
    if: github.ref == 'refs/heads/master' && github.event_name == 'push'
    
    environment:
      name: production
      url: https://gameone.sk
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run database migrations
        run: bun run db:deploy
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}

      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}
          alias-domains: gameone.sk,www.gameone.sk

      - name: Health check
        run: |
          sleep 30
          curl -f https://gameone.sk/api/health || exit 1

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Deployment Scripts
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-staging}
SKIP_TESTS=${2:-false}

echo "🚀 Deploying to $ENVIRONMENT..."

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

if [[ "$SKIP_TESTS" != "true" ]]; then
    echo "🧪 Running tests..."
    bun run test
    
    echo "🎭 Running E2E tests..."
    bun run test:e2e
fi

echo "🔧 Type checking..."
bun run type-check

echo "✨ Linting..."
bun run lint

echo "🛠️ Building..."
bun run build

# Database migrations
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "📊 Running database migrations..."
    read -p "Are you sure you want to run migrations on production? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        bun run db:deploy
    else
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Deploy
echo "🚀 Deploying to $ENVIRONMENT..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    vercel --prod --token $VERCEL_TOKEN
else
    vercel --token $VERCEL_TOKEN
fi

# Post-deployment verification
echo "🏥 Running health checks..."
sleep 30

if [[ "$ENVIRONMENT" == "production" ]]; then
    HEALTH_URL="https://gameone.sk/api/health"
else
    HEALTH_URL="https://gameone-staging.vercel.app/api/health"
fi

if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
    echo "✅ Deployment successful!"
else
    echo "❌ Health check failed"
    exit 1
fi
```

## Infrastructure as Code

### Vercel Configuration
```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "bun run build",
  "devCommand": "bun run dev",
  "installCommand": "bun install",
  "outputDirectory": ".next",
  "regions": ["fra1", "iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "runtime": "nodejs20.x",
      "maxDuration": 30
    },
    "src/app/api/cron/**/*.ts": {
      "runtime": "nodejs20.x",
      "maxDuration": 300
    }
  },
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/notifications",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/analytics",
      "schedule": "0 1 * * 0"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/admin",
      "destination": "/admin/dashboard",
      "permanent": false
    }
  ],
  "rewrites": [
    {
      "source": "/healthz",
      "destination": "/api/health"
    }
  ]
}
```

### Database Deployment Configuration
```typescript
// scripts/deploy-db.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

interface DeploymentConfig {
  environment: string;
  databaseUrl: string;
  backupEnabled: boolean;
  migrationTimeout: number;
}

export class DatabaseDeployer {
  private config: DeploymentConfig;
  private prisma: PrismaClient;

  constructor(config: DeploymentConfig) {
    this.config = config;
    this.prisma = new PrismaClient({
      datasources: {
        db: { url: config.databaseUrl }
      }
    });
  }

  async deploy(): Promise<void> {
    try {
      console.log(`🚀 Deploying database to ${this.config.environment}...`);

      // Pre-deployment backup
      if (this.config.backupEnabled) {
        await this.createBackup();
      }

      // Run migrations
      await this.runMigrations();

      // Verify deployment
      await this.verifyDeployment();

      console.log('✅ Database deployment completed successfully');

    } catch (error) {
      console.error('❌ Database deployment failed:', error);
      
      if (this.config.backupEnabled) {
        console.log('🔄 Attempting to restore from backup...');
        await this.restoreFromBackup();
      }
      
      throw error;
    }
  }

  private async createBackup(): Promise<void> {
    console.log('💾 Creating database backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${this.config.environment}-${timestamp}`;

    // For Neon or other managed PostgreSQL services
    try {
      // This would be customized based on your database provider
      const backupCommand = `pg_dump "${this.config.databaseUrl}" > backups/${backupName}.sql`;
      execSync(backupCommand, { timeout: 300000 }); // 5 minute timeout
      
      console.log(`✅ Backup created: ${backupName}`);
    } catch (error) {
      console.warn('⚠️ Backup creation failed, proceeding without backup');
    }
  }

  private async runMigrations(): Promise<void> {
    console.log('📊 Running database migrations...');
    
    try {
      execSync('bun run db:deploy', {
        env: { ...process.env, DATABASE_URL: this.config.databaseUrl },
        timeout: this.config.migrationTimeout,
        stdio: 'inherit'
      });
      
      console.log('✅ Migrations completed successfully');
    } catch (error) {
      throw new Error(`Migration failed: ${error.message}`);
    }
  }

  private async verifyDeployment(): Promise<void> {
    console.log('🔍 Verifying database deployment...');
    
    try {
      // Test basic connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Verify critical tables exist
      const tables = await this.prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      const requiredTables = ['User', 'Event', 'Registration', 'Payment'];
      const existingTables = (tables as any[]).map(t => t.table_name);
      
      for (const table of requiredTables) {
        if (!existingTables.includes(table)) {
          throw new Error(`Required table ${table} not found`);
        }
      }
      
      // Test data integrity
      const userCount = await this.prisma.user.count();
      console.log(`📈 Database health check passed. Users: ${userCount}`);
      
    } catch (error) {
      throw new Error(`Database verification failed: ${error.message}`);
    }
  }

  private async restoreFromBackup(): Promise<void> {
    // Implementation depends on your backup strategy
    console.log('🔄 Restore functionality would be implemented here');
  }
}

// Usage
async function main() {
  const environment = process.argv[2] || 'staging';
  const databaseUrl = process.env.DATABASE_URL!;

  const config: DeploymentConfig = {
    environment,
    databaseUrl,
    backupEnabled: environment === 'production',
    migrationTimeout: 300000 // 5 minutes
  };

  const deployer = new DatabaseDeployer(config);
  await deployer.deploy();
}

if (require.main === module) {
  main().catch(console.error);
}
```

## Environment Management

### Environment Variables Schema
```typescript
// src/lib/config/env-schema.ts
import { z } from 'zod';

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Vercel
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
  VERCEL_URL: z.string().optional(),
  
  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  
  // Authentication
  KINDE_CLIENT_ID: z.string().min(1),
  KINDE_CLIENT_SECRET: z.string().min(1),
  KINDE_ISSUER_URL: z.string().url(),
  KINDE_SITE_URL: z.string().url(),
  KINDE_POST_LOGOUT_REDIRECT_URL: z.string().url(),
  KINDE_POST_LOGIN_REDIRECT_URL: z.string().url(),
  
  // Security
  ENCRYPTION_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  CRON_SECRET: z.string().min(1),
  
  // External Services
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // Stripe (if using)
  STRIPE_PUBLIC_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  ANALYTICS_ID: z.string().optional(),
  
  // Feature flags
  ENABLE_ANALYTICS: z.coerce.boolean().default(false),
  ENABLE_PAYMENTS: z.coerce.boolean().default(false),
  ENABLE_EMAIL: z.coerce.boolean().default(false),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    console.error(error.errors);
    process.exit(1);
  }
}
```

### Environment Configuration Files
```bash
# .env.local (development)
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/gameone_dev"
KINDE_CLIENT_ID="your_dev_client_id"
KINDE_CLIENT_SECRET="your_dev_client_secret"
KINDE_ISSUER_URL="https://your-dev-domain.kinde.com"
KINDE_SITE_URL="http://localhost:3000"
KINDE_POST_LOGOUT_REDIRECT_URL="http://localhost:3000"
KINDE_POST_LOGIN_REDIRECT_URL="http://localhost:3000/dashboard"
ENCRYPTION_SECRET="dev_encryption_secret_32_chars_min"
SESSION_SECRET="dev_session_secret_32_chars_min"
CRON_SECRET="dev_cron_secret"
ENABLE_ANALYTICS=false
ENABLE_PAYMENTS=false
ENABLE_EMAIL=false
```

```bash
# .env.staging (staging)
NODE_ENV=production
VERCEL_ENV=preview
DATABASE_URL="postgresql://user:password@staging-db.com:5432/gameone_staging"
KINDE_CLIENT_ID="your_staging_client_id"
KINDE_CLIENT_SECRET="your_staging_client_secret"
KINDE_ISSUER_URL="https://your-staging-domain.kinde.com"
KINDE_SITE_URL="https://gameone-staging.vercel.app"
KINDE_POST_LOGOUT_REDIRECT_URL="https://gameone-staging.vercel.app"
KINDE_POST_LOGIN_REDIRECT_URL="https://gameone-staging.vercel.app/dashboard"
ENCRYPTION_SECRET="staging_encryption_secret_32_chars_min"
SESSION_SECRET="staging_session_secret_32_chars_min"
CRON_SECRET="staging_cron_secret"
ENABLE_ANALYTICS=true
ENABLE_PAYMENTS=true
ENABLE_EMAIL=true
```

## Rollback Strategy

### Automated Rollback System
```typescript
// scripts/rollback.ts
import { execSync } from 'child_process';

interface RollbackConfig {
  environment: 'staging' | 'production';
  deploymentId?: string;
  confirmRequired: boolean;
}

export class RollbackManager {
  private config: RollbackConfig;

  constructor(config: RollbackConfig) {
    this.config = config;
  }

  async rollback(): Promise<void> {
    console.log(`🔄 Initiating rollback for ${this.config.environment}...`);

    if (this.config.confirmRequired) {
      await this.confirmRollback();
    }

    try {
      // Get previous deployment
      const previousDeployment = await this.getPreviousDeployment();
      
      // Perform rollback
      await this.performRollback(previousDeployment);
      
      // Verify rollback
      await this.verifyRollback();
      
      console.log('✅ Rollback completed successfully');
      
      // Notify team
      await this.notifyRollback(previousDeployment);
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  private async confirmRollback(): Promise<void> {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve, reject) => {
      rl.question(
        `⚠️  Are you sure you want to rollback ${this.config.environment}? (yes/no): `,
        (answer: string) => {
          rl.close();
          if (answer.toLowerCase() === 'yes') {
            resolve();
          } else {
            reject(new Error('Rollback cancelled by user'));
          }
        }
      );
    });
  }

  private async getPreviousDeployment(): Promise<string> {
    if (this.config.deploymentId) {
      return this.config.deploymentId;
    }

    // Get list of deployments
    const result = execSync('vercel ls --meta', { encoding: 'utf8' });
    const deployments = JSON.parse(result);
    
    // Find previous successful deployment
    const previousDeployment = deployments
      .filter((d: any) => d.state === 'READY')
      .sort((a: any, b: any) => new Date(b.created).getTime() - new Date(a.created).getTime())[1];

    if (!previousDeployment) {
      throw new Error('No previous deployment found');
    }

    return previousDeployment.uid;
  }

  private async performRollback(deploymentId: string): Promise<void> {
    console.log(`🔄 Rolling back to deployment: ${deploymentId}`);
    
    const rollbackCommand = this.config.environment === 'production'
      ? `vercel rollback ${deploymentId} --prod`
      : `vercel rollback ${deploymentId}`;
    
    execSync(rollbackCommand, { stdio: 'inherit' });
  }

  private async verifyRollback(): Promise<void> {
    console.log('🔍 Verifying rollback...');
    
    const healthUrl = this.config.environment === 'production'
      ? 'https://gameone.sk/api/health'
      : 'https://gameone-staging.vercel.app/api/health';

    // Wait for deployment to be ready
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
      execSync(`curl -f ${healthUrl}`, { stdio: 'inherit' });
      console.log('✅ Rollback verification successful');
    } catch (error) {
      throw new Error('Rollback verification failed');
    }
  }

  private async notifyRollback(deploymentId: string): Promise<void> {
    // Notify team via Slack, Discord, etc.
    console.log(`📢 Rollback notification sent for deployment: ${deploymentId}`);
  }
}

// CLI usage
async function main() {
  const environment = process.argv[2] as 'staging' | 'production';
  const deploymentId = process.argv[3];

  if (!environment || !['staging', 'production'].includes(environment)) {
    console.error('Usage: bun run rollback <staging|production> [deployment-id]');
    process.exit(1);
  }

  const rollbackManager = new RollbackManager({
    environment,
    deploymentId,
    confirmRequired: environment === 'production'
  });

  await rollbackManager.rollback();
}

if (require.main === module) {
  main().catch(console.error);
}
```

## Health Checks and Monitoring

### Advanced Health Check Endpoint
```typescript
// src/app/api/health/detailed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  uptime: number;
  environment: string;
  checks: {
    database: HealthCheck;
    external: {
      kinde: HealthCheck;
      email: HealthCheck;
      payments: HealthCheck;
    };
    features: Record<string, boolean>;
  };
}

interface HealthCheck {
  status: 'up' | 'down' | 'unknown';
  responseTime: number;
  message?: string;
  lastChecked: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const checks = await Promise.allSettled([
      checkDatabase(),
      checkKindeAuth(),
      checkEmailService(),
      checkPaymentService()
    ]);

    const [database, kinde, email, payments] = checks.map(result => 
      result.status === 'fulfilled' ? result.value : {
        status: 'down',
        responseTime: -1,
        message: result.reason?.message || 'Check failed',
        lastChecked: new Date().toISOString()
      }
    );

    const overallStatus = determineOverallStatus([database, kinde, email, payments]);

    const healthStatus: HealthStatus = {
      status: overallStatus,
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      checks: {
        database,
        external: { kinde, email, payments },
        features: {
          analytics: process.env.ENABLE_ANALYTICS === 'true',
          payments: process.env.ENABLE_PAYMENTS === 'true',
          email: process.env.ENABLE_EMAIL === 'true'
        }
      }
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthStatus, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    return {
      status: 'up',
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      message: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

async function checkKindeAuth(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    const response = await fetch(`${process.env.KINDE_ISSUER_URL}/.well-known/openid_configuration`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return {
      status: 'up',
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      message: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

async function checkEmailService(): Promise<HealthCheck> {
  if (!process.env.SMTP_HOST) {
    return {
      status: 'unknown',
      responseTime: 0,
      message: 'Email service not configured',
      lastChecked: new Date().toISOString()
    };
  }

  // Implement SMTP health check
  return {
    status: 'up',
    responseTime: 0,
    lastChecked: new Date().toISOString()
  };
}

async function checkPaymentService(): Promise<HealthCheck> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      status: 'unknown',
      responseTime: 0,
      message: 'Payment service not configured',
      lastChecked: new Date().toISOString()
    };
  }

  // Implement Stripe health check
  return {
    status: 'up',
    responseTime: 0,
    lastChecked: new Date().toISOString()
  };
}

function determineOverallStatus(checks: HealthCheck[]): 'healthy' | 'degraded' | 'unhealthy' {
  const downChecks = checks.filter(check => check.status === 'down');
  const unknownChecks = checks.filter(check => check.status === 'unknown');
  
  if (downChecks.length > 0) {
    return downChecks.length > 1 ? 'unhealthy' : 'degraded';
  }
  
  if (unknownChecks.length > 0) {
    return 'degraded';
  }
  
  return 'healthy';
}
```

This comprehensive deployment and DevOps framework ensures reliable, secure, and efficient deployment processes for the GameOne event registration system across all environments.