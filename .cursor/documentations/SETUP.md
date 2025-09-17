# 🚀 GameOne Template Setup Guide

This comprehensive guide will help you set up a new application using the
GameOne template. This template includes authentication, payments,
internationalization, CI/CD, and a robust database schema.

## 📋 Prerequisites

Before starting, ensure you have:

- **Bun** (>= 1.0.0) - [Download](https://bun.sh)
- **Node.js** (>= 18.0.0) - for compatibility
- **Git** - for version control
- **PostgreSQL database** - local or hosted (Neon, Supabase, Railway, etc.)

## 🛠️ Initial Setup

### 1. Clone and Initialize Project

```bash
# Clone the template
git clone <your-template-repo-url> my-new-app
cd my-new-app

# Remove existing git history and initialize new repo
rm -rf .git
git init
git add .
git commit -m "Initial commit from GameOne template"

# Add your remote repository
git remote add origin <your-new-repo-url>
git push -u origin master
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

## 🔐 Required Services & Environment Variables

### Database (Required)

**Service**: PostgreSQL Database **Options**:

- [Neon](https://neon.tech) (Recommended - Serverless PostgreSQL)
- [Supabase](https://supabase.com) (PostgreSQL with additional features)
- [Railway](https://railway.app) (Simple deployment platform)
- [Vercel Postgres](https://vercel.com/storage/postgres) (If using Vercel)

**Setup Steps**:

1. Create a new PostgreSQL database
2. Get your connection URL (usually in format:
   `postgresql://user:password@host:port/dbname`)
3. Add to `.env.local`:

```env
DATABASE_URL="postgresql://user:password@host:port/dbname"
DIRECT_URL="postgresql://user:password@host:port/dbname"  # Same as DATABASE_URL for most providers
```

### Authentication (Required)

**Service**: [Kinde Auth](https://kinde.com) **Why**: Modern authentication with
user management, SSO, and security features

**Setup Steps**:

1. Sign up at [kinde.com](https://kinde.com)
2. Create a new application
3. Configure your application settings:
   - Add your domain URLs (localhost:3000 for development)
   - Set redirect URLs:
     - `http://localhost:3000/api/auth/kinde_callback` (development)
     - `https://yourdomain.com/api/auth/kinde_callback` (production)
   - Set logout URLs:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
4. Get your credentials from Kinde dashboard
5. Add to `.env.local`:

```env
KINDE_CLIENT_ID=your_kinde_client_id
KINDE_CLIENT_SECRET=your_kinde_client_secret
KINDE_ISSUER_URL=https://your-domain.kinde.com
KINDE_SITE_URL=http://localhost:3000
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3000/dashboard
```

### Email Service (Required)

**Service**: [Resend](https://resend.com) **Why**: Modern email API with great
deliverability and developer experience

**Setup Steps**:

1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Add your domain (optional but recommended for production)
4. Add to `.env.local`:

```env
RESEND_API_KEY=re_your_resend_api_key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
DEFAULT_REPLY_TO_EMAIL=support@yourdomain.com
```

### Basic Configuration (Required)

Add these basic configuration values to `.env.local`:

```env
# App Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_NAME="Your App Name"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Security (Generate secure random strings)
ENCRYPTION_KEY=your-32-character-encryption-key  # Generate with: openssl rand -base64 32
JWT_SECRET=your-jwt-secret-key                    # Generate with: openssl rand -base64 64

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_MONITORING=false

# Development Settings
PRISMA_DEBUG=false
DATABASE_DEBUG=false
NEXT_TELEMETRY_DISABLED=1

# Email Settings
EMAIL_TEST_MODE=true
EMAIL_RATE_LIMIT_PER_MINUTE=10
EMAIL_RATE_LIMIT_PER_HOUR=100
```

## 🚀 Database Setup

### 1. Initialize Database

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database (for development)
bun run db:push

# Or use migrations (for production)
bun run db:migrate

# Seed database with initial data
bun run db:seed
```

### 2. Verify Database Connection

```bash
# Open Prisma Studio to verify everything is working
bun run db:studio
```

## 🎨 Customization

### 1. Update App Information

Edit the following files with your app information:

- `package.json` - Update name, description, version
- `src/app/[locale]/layout.tsx` - Update metadata
- `messages/en.json` and `messages/cs.json` - Update translations

### 2. Configure Internationalization

The template supports English and Czech by default. To modify:

1. **Add/Remove Languages**: Edit `src/i18n/routing.ts`
2. **Update Translations**: Edit files in `messages/` directory
3. **Add New Translation Keys**: Update all language files

### 3. Customize Database Schema

1. Edit `prisma/schema.prisma` to match your needs
2. Run migrations: `bun run db:migrate`
3. Update seed data in `prisma/seed.ts`

## 🔧 Development

### Start Development Server

```bash
bun run dev
```

Visit `http://localhost:3000` to see your application.

### Project Structure Validation

This template includes automated project structure validation to ensure
consistency:

```bash
# Setup git hooks for automatic validation
bun run setup-hooks

# Manually validate project structure
bun run validate-structure

# Run all quality checks
bun run check-all
```

### Available Commands

```bash
# Development
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server

# Code Quality
bun run lint         # Run ESLint
bun run lint:fix     # Auto-fix ESLint errors
bun run format       # Format with Prettier
bun run type-check   # TypeScript type checking

# Project Structure
bun run validate-structure # Validate file organization
bun run setup-hooks       # Enable git pre-commit hooks
bun run check-all         # Run all validations

# Testing
bun run test         # Run tests
bun run test:coverage # Run tests with coverage

# Database
bun run db:generate  # Generate Prisma client
bun run db:push      # Push schema changes
bun run db:migrate   # Run migrations
bun run db:seed      # Seed database
bun run db:studio    # Open Prisma Studio
```

## 🌐 Deployment

### Option 1: Vercel (Recommended)

The template is optimized for Vercel deployment:

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically

**Required Vercel Environment Variables**:

- All variables from your `.env.local` except development URLs
- Update URLs to production domains

### Option 2: Other Platforms

The template can be deployed to any platform supporting Node.js:

- Railway
- DigitalOcean App Platform
- AWS
- Google Cloud Run

## 📊 Optional Services

### Analytics & Monitoring

**Vercel Analytics**:

```env
VERCEL_ANALYTICS_ID=your_vercel_analytics_id
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

**Sentry Error Tracking** (✅ Fully Implemented):

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project (choose Next.js platform)
3. Get your DSN from project settings
4. Add to `.env.local`:

```env
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

**Optional: Advanced Sentry Features** For source map uploads and better
debugging, add:

```env
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

**PostHog Analytics**:

1. Sign up at [posthog.com](https://posthog.com)
2. Get your project API key
3. Add to `.env.local`:

```env
POSTHOG_KEY=your_posthog_key
```

### File Storage

**Vercel Blob Storage**:

```env
BLOB_READ_WRITE_TOKEN=your_blob_token
```

### Caching

**Redis** (for production caching):

```env
REDIS_URL=redis://localhost:6379
```

## 🔄 CI/CD Setup

### GitHub Actions

The template includes a CI pipeline (`.github/workflows/ci.yml`) that:

- Runs type checking
- Runs linting
- Runs tests
- Integrates with Vercel for deployment

**Setup**:

1. Push to GitHub
2. Enable GitHub Actions in repository settings
3. CI will run automatically on push/PR

### CodeRabbit Integration

For automated code reviews:

1. Install CodeRabbit app on your GitHub repository
2. CodeRabbit will automatically review PRs

## 🛡️ Security Configuration

### Production Security Checklist

- [ ] Change all default secrets and API keys
- [ ] Use strong, unique passwords for all services
- [ ] Enable 2FA on all service accounts
- [ ] Configure proper CORS settings
- [ ] Set up proper CSP headers
- [ ] Review and configure rate limiting
- [ ] Set up monitoring and alerting

### Environment Variable Security

- Never commit `.env` files to version control
- Use different API keys for development and production
- Regularly rotate API keys and secrets
- Use environment variable management tools in production

## 🆘 Troubleshooting

### Common Issues

**Database Connection Issues**:

- Verify DATABASE_URL format
- Check if database server is running
- Ensure database exists and credentials are correct

**Kinde Authentication Issues**:

- Verify redirect URLs match exactly
- Check if client ID and secret are correct
- Ensure KINDE_ISSUER_URL doesn't have trailing slash

**Build Issues**:

- Run `bun run type-check` to identify TypeScript errors
- Check if all environment variables are set
- Verify all dependencies are installed

**Email Issues**:

- Verify Resend API key is valid
- Check if sender email domain is verified
- Review email rate limits

### Getting Help

1. Check this guide first
2. Review error logs and console output
3. Check the [template repository issues](your-repo-issues-url)
4. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details

## 🎯 Next Steps

After completing the setup:

1. **Customize the UI**: Update components in `src/components/`
2. **Add Your Features**: Build on the existing user management and event system
3. **Configure Production**: Set up production environment variables
4. **Deploy**: Push to your chosen deployment platform
5. **Monitor**: Set up analytics and error tracking

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Bun Documentation](https://bun.sh/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Kinde Documentation](https://kinde.com/docs)
- [Resend Documentation](https://resend.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

## 🤝 Contributing

If you improve this template:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Happy coding! 🚀**

This template provides a solid foundation for modern web applications with
authentication, payments, internationalization, and best practices built-in.
