# Database Migration Guide

## 🛡️ Safe Migration Strategies

### Environment Setup

Create different database URLs for different environments:

```bash
# .env.local (development)
DATABASE_URL="postgresql://dev-user:password@localhost:5432/gameone_dev"
DIRECT_URL="postgresql://dev-user:password@localhost:5432/gameone_dev"

# .env.production (production)
DATABASE_URL="postgresql://prod-user:password@your-neon-db.com/gameone_prod"
DIRECT_URL="postgresql://prod-user:password@your-neon-db.com/gameone_prod"

# .env.staging (staging)
DATABASE_URL="postgresql://staging-user:password@your-neon-db.com/gameone_staging"
DIRECT_URL="postgresql://staging-user:password@your-neon-db.com/gameone_staging"
```

## 📋 Migration Commands by Environment

### Development (Safe to Reset)

```bash
# Add new fields/features
npx prisma migrate dev --name add-new-feature

# Reset database (loses all data)
npx prisma migrate reset --force

# Generate client
npx prisma generate
```

### Staging (Preserve Data)

```bash
# Apply pending migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

### Production (Preserve Data)

```bash
# Apply pending migrations safely
npx prisma migrate deploy

# Generate client
npx prisma generate
```

## 🔄 Migration Workflow

### 1. Development Workflow

```bash
# 1. Make schema changes
# 2. Create migration
npx prisma migrate dev --name descriptive-name

# 3. Test locally
npm run dev

# 4. Commit migration files
git add prisma/migrations/
git commit -m "Add new feature migration"
```

### 2. Staging Deployment

```bash
# 1. Deploy to staging
git push origin staging

# 2. Apply migrations
npx prisma migrate deploy

# 3. Test staging
```

### 3. Production Deployment

```bash
# 1. Deploy to production
git push origin main

# 2. Apply migrations (preserves data)
npx prisma migrate deploy

# 3. Monitor for issues
```

## ⚠️ Important Rules

### ✅ Safe Operations (Preserve Data)

- Adding new fields with default values
- Adding new tables
- Adding new enums
- Adding indexes
- Adding foreign keys

### ❌ Dangerous Operations (May Lose Data)

- Changing field types
- Removing fields
- Changing enum values
- Renaming tables/fields

### 🔧 For Dangerous Operations

```bash
# 1. Create backup
pg_dump your-database > backup.sql

# 2. Use migration scripts
npx prisma migrate dev --name dangerous-change

# 3. Test thoroughly
# 4. Deploy with caution
```

## 🛠️ Migration Best Practices

### 1. Always Use Descriptive Names

```bash
# Good
npx prisma migrate dev --name add-payment-status-tracking

# Bad
npx prisma migrate dev --name update
```

### 2. Test Migrations Locally First

```bash
# 1. Create local database
npx prisma migrate dev

# 2. Test your application
npm run dev

# 3. Only then deploy
```

### 3. Use Environment Variables

```bash
# .env.local
DATABASE_URL="your-dev-database"

# .env.production
DATABASE_URL="your-prod-database"
```

### 4. Monitor Migration Status

```bash
# Check migration status
npx prisma migrate status

# View migration history
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma
```

## 🚨 Emergency Procedures

### If Migration Fails in Production

```bash
# 1. Rollback to previous migration
npx prisma migrate resolve --rolled-back migration-name

# 2. Fix the issue
# 3. Create new migration
npx prisma migrate dev --name fix-migration-issue

# 4. Deploy again
npx prisma migrate deploy
```

### If Database is Out of Sync

```bash
# 1. Check what's different
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-database

# 2. Create migration to sync
npx prisma migrate dev --name sync-database

# 3. Deploy
npx prisma migrate deploy
```

## 📊 Migration Checklist

Before deploying any migration:

- [ ] Test locally with `npx prisma migrate dev`
- [ ] Test with sample data
- [ ] Check application functionality
- [ ] Review migration SQL (in `prisma/migrations/`)
- [ ] Backup production database
- [ ] Deploy to staging first
- [ ] Test staging thoroughly
- [ ] Deploy to production
- [ ] Monitor for issues

## 🔍 Useful Commands

```bash
# Check current migration status
npx prisma migrate status

# View database schema
npx prisma db pull

# Generate client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Reset database (development only)
npx prisma migrate reset --force
```

## 📝 Example: Adding New Feature

```bash
# 1. Add new field to schema
# model Registration {
#   newField String?
# }

# 2. Create migration
npx prisma migrate dev --name add-new-field

# 3. Test locally
npm run dev

# 4. Deploy to staging
npx prisma migrate deploy

# 5. Deploy to production
npx prisma migrate deploy
```

This workflow ensures your production data is always safe while allowing you to
develop and test new features effectively.
