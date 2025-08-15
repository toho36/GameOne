# 🚀 Deployment Guide

This document provides comprehensive instructions for deploying the GameOne application using the implemented CI/CD pipeline.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment Environments](#deployment-environments)
- [Security Configuration](#security-configuration)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Accounts & Services

1. **GitHub Account** - For code repository and CI/CD
2. **Vercel Account** - For hosting and deployment
3. **Database Provider** - PostgreSQL (Neon, Supabase, or PlanetScale)
4. **Email Service** - Resend account for email functionality
5. **Authentication** - Kinde account for user management

### Required Secrets

Configure these secrets in your GitHub repository settings:

```bash
# Vercel Deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Code Coverage (Optional)
CODECOV_TOKEN=your_codecov_token

# Security Scanning (Optional)
SEMGREP_APP_TOKEN=your_semgrep_token
```

## 🌍 Environment Setup

### 1. Copy Environment Variables

```bash
cp .env.example .env.local
```

### 2. Configure Required Variables

Update `.env.local` with your actual values:

```bash
# Production URLs
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
KINDE_SITE_URL=https://your-domain.vercel.app
KINDE_POST_LOGOUT_REDIRECT_URL=https://your-domain.vercel.app
KINDE_POST_LOGIN_REDIRECT_URL=https://your-domain.vercel.app/dashboard

# Database (Production)
DATABASE_URL="your_production_database_url"
DIRECT_URL="your_production_direct_url"

# Authentication
KINDE_CLIENT_ID=your_production_client_id
KINDE_CLIENT_SECRET=your_production_client_secret
KINDE_ISSUER_URL=https://your-domain.kinde.com

# Email
RESEND_API_KEY=your_production_resend_key
DEFAULT_FROM_EMAIL=noreply@your-domain.com
DEFAULT_REPLY_TO_EMAIL=support@your-domain.com
```

### 3. Configure Vercel Environment Variables

In your Vercel dashboard, add these environment variables:

- **Production Environment**: All variables from `.env.example` with production values
- **Preview Environment**: Same as production but with staging values
- **Development Environment**: Development-specific values

## 🔄 CI/CD Pipeline

### Pipeline Overview

The CI/CD pipeline consists of several stages:

1. **🧪 Test & Quality Checks**
   - Type checking with TypeScript
   - Code linting with ESLint
   - Format checking with Prettier
   - Unit tests with Vitest
   - Code coverage reporting

2. **🔒 Security Scan**
   - Dependency vulnerability audit
   - CodeQL security analysis
   - Semgrep security scanning

3. **🏗️ Build Application**
   - Production build generation
   - Build artifact uploading

4. **🚀 Deployment**
   - Staging deployment (develop branch)
   - Production deployment (master branch)

### Branch Strategy

- **`master`** → Production deployment
- **`develop`** → Staging deployment
- **Feature branches** → Pull request checks only

### Automated Workflows

#### Main CI/CD Pipeline
- **Trigger**: Push to master/develop, PRs to master/develop
- **File**: `.github/workflows/ci.yml`

#### Security Scanning
- **Trigger**: Weekly + Push to master + PRs
- **File**: `.github/workflows/security.yml`

#### Dependency Updates
- **Trigger**: Weekly + Manual trigger
- **File**: `.github/workflows/dependency-update.yml`

## 🌐 Deployment Environments

### Staging Environment
- **URL**: `https://gameone-staging.vercel.app`
- **Branch**: `develop`
- **Database**: Staging database
- **Purpose**: Testing and QA

### Production Environment
- **URL**: `https://your-domain.com`
- **Branch**: `master`
- **Database**: Production database
- **Purpose**: Live application

## 🔒 Security Configuration

### Vercel Security Headers

The `vercel.json` configuration includes:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
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
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

### Environment Variable Security

- **Never commit** `.env` files to version control
- Use **Vercel's environment variable management**
- Implement **secret rotation** for production
- Use **different secrets** for each environment

## 📊 Monitoring & Maintenance

### Automated Maintenance

1. **Dependency Updates**
   - Weekly automated dependency updates
   - Security vulnerability scanning
   - Automated PR creation for updates

2. **Health Monitoring**
   - API health checks at `/api/health`
   - Automated cleanup jobs via cron
   - Error tracking and alerting

3. **Performance Monitoring**
   - Vercel Analytics integration
   - Core Web Vitals tracking
   - API response time monitoring

### Manual Monitoring

1. **Database Health**
   ```bash
   # Check database connection
   curl https://your-domain.com/api/health
   ```

2. **Email Service Status**
   ```bash
   # Test email functionality
   curl -X POST https://your-domain.com/api/send-email/validate
   ```

## 🔧 Deployment Commands

### Local Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run tests
bun run test

# Type checking
bun run type-check

# Linting
bun run lint

# Production build
bun run build
```

### Manual Deployment

```bash
# Deploy to Vercel (if needed)
vercel deploy

# Deploy to production
vercel deploy --prod
```

## 🛠️ Troubleshooting

### Common Issues

#### Build Failures
1. **TypeScript Errors**
   ```bash
   bun run type-check
   ```
   Fix any type errors before deployment.

2. **Missing Environment Variables**
   - Check Vercel dashboard environment variables
   - Ensure all required variables are set

3. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check database provider status
   - Ensure IP allowlisting if required

#### Deployment Issues

1. **Vercel Deployment Fails**
   - Check GitHub Actions logs
   - Verify Vercel secrets are configured
   - Check build output for errors

2. **Authentication Issues**
   - Verify Kinde configuration
   - Check redirect URLs match environment
   - Ensure client secrets are correct

#### Performance Issues

1. **Slow API Responses**
   - Check database query performance
   - Monitor Vercel function logs
   - Optimize database indexes

2. **High Error Rates**
   - Check Vercel function logs
   - Monitor error tracking
   - Review recent deployments

### Debug Commands

```bash
# Check deployment status
vercel logs --follow

# Test API endpoints locally
curl http://localhost:3000/api/health

# Run full test suite
bun run test --coverage

# Check for security vulnerabilities
bun audit
```

### Getting Help

1. **Check GitHub Actions logs** for CI/CD issues
2. **Review Vercel deployment logs** for runtime issues
3. **Monitor error tracking** for application errors
4. **Check database logs** for data-related issues

## 🎯 Best Practices

1. **Always test in staging** before production deployment
2. **Use feature flags** for new functionality
3. **Monitor deployment metrics** after each release
4. **Keep dependencies updated** for security
5. **Regular backup verification** for production data
6. **Document configuration changes** in this file

## 📞 Support

For deployment issues:
1. Check this documentation
2. Review GitHub Actions logs
3. Check Vercel deployment logs
4. Contact the development team

---

**Last Updated**: January 2025
**Version**: 1.0.0