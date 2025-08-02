# GameOne Database Setup Guide

Complete guide for setting up PostgreSQL database with Neon on Vercel for the GameOne event management application.

## 🏗️ Architecture Overview

### Technology Stack
- **Database**: Neon PostgreSQL (Serverless)
- **ORM**: Prisma with optimized serverless configuration
- **Deployment**: Vercel with automatic deployments
- **Runtime**: Bun for enhanced performance

### Connection Strategy
- **Development**: Direct connection to Neon with pooling
- **Production**: Serverless-optimized connections with connection pooling
- **Migrations**: Direct (non-pooled) connections for schema changes

## 🚀 Quick Start

### 1. Database Setup (Already Completed)
You have already set up Neon PostgreSQL with the following configuration:

```env
DATABASE_URL="postgres://neondb_owner:npg_LoO5Kg4yMPiQ@ep-ancient-base-a2km2l61-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgres://neondb_owner:npg_LoO5Kg4yMPiQ@ep-ancient-base-a2km2l61.eu-central-1.aws.neon.tech/neondb?sslmode=require"
```

### 2. Initialize Database Schema

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database (for development)
bun run db:push

# Or create and run migrations (recommended for production)
bun run db:migrate

# Seed the database with initial data
bun run db:seed:dev
```

### 3. Verify Setup

```bash
# Check database connection and health
bun run dev
# Visit: http://localhost:3000/api/health

# Open Prisma Studio to inspect data
bun run db:studio
# Visit: http://localhost:5555
```

## 📋 Available Scripts

### Development Scripts
```bash
# Basic database operations
bun run db:generate          # Generate Prisma client
bun run db:push              # Push schema changes (development)
bun run db:studio            # Open Prisma Studio

# Migration management
bun run db:migrate           # Create and apply new migration
bun run db:migrate:status    # Check migration status
bun run db:migrate:reset     # Reset database and apply all migrations

# Data seeding
bun run db:seed              # Run seed script
bun run db:seed:dev          # Run seed for development
bun run db:seed:prod         # Run seed for production

# Database utilities
bun run db:reset             # Reset database and seed
bun run db:dev:setup         # Complete development setup
bun run db:dev:refresh       # Refresh development database
```

### Production Scripts
```bash
# Deployment scripts
bun run db:deploy            # Deploy migrations and seed production
bun run db:verify            # Verify database status
bun run vercel:build         # Build with Prisma generation
bun run vercel:deploy        # Deploy to Vercel with verification
```

## 🔧 Environment Configuration

### Development (.env.local)
```env
# Neon Database URLs
DATABASE_URL="postgres://neondb_owner:npg_LoO5Kg4yMPiQ@ep-ancient-base-a2km2l61-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgres://neondb_owner:npg_LoO5Kg4yMPiQ@ep-ancient-base-a2km2l61.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Debug settings
DATABASE_DEBUG="true"
PRISMA_DEBUG="true"
```

### Production (Vercel Dashboard)
Set these environment variables in your Vercel project dashboard:

```env
DATABASE_URL="postgres://neondb_owner:npg_LoO5Kg4yMPiQ@ep-ancient-base-a2km2l61-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgres://neondb_owner:npg_LoO5Kg4yMPiQ@ep-ancient-base-a2km2l61.eu-central-1.aws.neon.tech/neondb?sslmode=require"
POSTGRES_URL="postgres://neondb_owner:npg_LoO5Kg4yMPiQ@ep-ancient-base-a2km2l61-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
POSTGRES_URL_NON_POOLING="postgres://neondb_owner:npg_LoO5Kg4yMPiQ@ep-ancient-base-a2km2l61.eu-central-1.aws.neon.tech/neondb?sslmode=require"
DATABASE_DEBUG="false"
PRISMA_DEBUG="false"
```

## 🚀 Deployment Workflow

### Automatic Deployment
1. **Push to Git**: Any push to main branch triggers Vercel deployment
2. **Build Process**: 
   - Vercel runs `bun run vercel:build`
   - Prisma client is generated
   - Next.js application is built
3. **Database Migration**: Migrations run automatically during build
4. **Health Check**: Verify deployment at `/api/health`

### Manual Deployment
```bash
# 1. Verify local changes
bun run db:verify
bun run type-check
bun run lint

# 2. Deploy to Vercel
bun run vercel:deploy

# 3. Run database deployment (if needed)
# This runs in Vercel Functions automatically
```

## 📊 Database Schema Overview

The GameOne application includes comprehensive schemas for:

### Core Features
- **User Management**: Users, roles, profiles with role-based permissions
- **Event Management**: Events, categories, registrations, waiting lists
- **Payment Processing**: Payments, bank accounts, Slovak banking integration
- **Video Sharing**: Video clips, comments, reactions, categories
- **Notifications**: Email/SMS templates, delivery tracking
- **Audit Logging**: Comprehensive activity tracking

### Key Optimizations
- **Indexes**: Strategic indexing for query performance
- **Connection Pooling**: Optimized for serverless environments
- **Data Types**: Efficient data types for Slovak/Czech markets
- **Relationships**: Proper foreign key constraints with cascade handling

## 🔍 Monitoring & Health Checks

### Health Check Endpoint
```bash
curl https://your-app.vercel.app/api/health
```

Response includes:
- Database connectivity status
- Application health metrics
- Memory and performance data
- Environment information

### Prisma Studio Access
```bash
# Local development
bun run db:studio

# Production (tunnel required)
# Set up secure tunnel to production database
```

## 🛠️ Troubleshooting

### Common Issues

#### Connection Errors
```bash
# Check connection string format
echo $DATABASE_URL

# Test direct connection
bunx prisma db execute --stdin <<< "SELECT 1"

# Verify schema synchronization
bun run db:migrate:status
```

#### Migration Issues
```bash
# Reset migrations (DESTRUCTIVE - Development only)
bun run db:migrate:reset

# Manual migration
bunx prisma migrate resolve --applied "migration_name"
```

#### Performance Issues
```bash
# Check connection pooling
echo $DATABASE_URL | grep "connection_limit"

# Monitor with health check
curl localhost:3000/api/health | jq '.metrics'
```

### Environment-Specific Issues

#### Development
- Ensure `.env.local` has correct Neon credentials
- Check Neon dashboard for connection limits
- Verify local Bun installation

#### Production
- Verify environment variables in Vercel dashboard
- Check Vercel function logs for database errors
- Monitor Neon dashboard for performance metrics

## 🔐 Security Best Practices

### Connection Security
- All connections use SSL/TLS encryption
- Environment variables are securely managed
- No credentials in source code

### Access Control
- Role-based permission system
- Audit logging for all database changes
- Rate limiting on API endpoints

### Data Protection
- Input validation with Prisma
- SQL injection protection
- GDPR-compliant data handling

## 📈 Performance Optimization

### Database Level
- **Connection Pooling**: Configured for serverless
- **Query Optimization**: Strategic indexes and query patterns
- **Caching**: Application-level caching for frequently accessed data

### Application Level
- **Prisma Configuration**: Optimized for serverless environments
- **Connection Management**: Proper connection lifecycle
- **Error Handling**: Retry logic for transient failures

## 🔄 Backup & Recovery

### Automatic Backups
Neon provides automatic backups with point-in-time recovery.

### Manual Backup
```bash
# Create manual backup
bun run db:backup

# Restore from backup (contact Neon support for PITR)
```

## 📞 Support & Resources

### Documentation Links
- [Neon Documentation](https://neon.tech/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Documentation](https://vercel.com/docs)

### Monitoring
- **Neon Dashboard**: Monitor database performance
- **Vercel Dashboard**: Application and function metrics
- **Health Endpoint**: `/api/health` for status monitoring

### Emergency Contacts
- **Database Issues**: Neon support through dashboard
- **Deployment Issues**: Vercel support
- **Application Issues**: Check Vercel function logs

---

## ✅ Checklist for New Deployments

- [ ] Environment variables configured in Vercel
- [ ] Database connection tested
- [ ] Migrations applied successfully
- [ ] Seed data populated
- [ ] Health check endpoint responds
- [ ] Prisma Studio accessible (development)
- [ ] Performance monitoring set up
- [ ] Backup strategy confirmed

---

*This setup provides a production-ready, scalable database configuration optimized for the Slovak/Czech event management market with proper internationalization and payment processing support.*