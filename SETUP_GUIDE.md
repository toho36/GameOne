# 🚀 CI/CD Setup Guide

## Step-by-Step Configuration Instructions

### 1. 🔧 Vercel Account Setup

#### A. Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Verify your email address

#### B. Import Your Repository

1. In Vercel dashboard, click **"New Project"**
2. Import your `GameOne` repository from GitHub
3. Configure project settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `bun run vercel:build`
   - **Install Command**: `bun install`
   - **Output Directory**: `.next`

#### C. Get Vercel Tokens & IDs

1. Go to [Vercel Settings > Tokens](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Name it "GitHub Actions CI/CD"
4. Set scope to your account/team
5. **Save the token** - you'll need it for GitHub secrets

6. Get Organization ID:
   - Go to your team/account settings
   - Copy the **Team ID** (this is your ORG_ID)

7. Get Project ID:
   - Go to your project settings
   - In the "General" tab, copy the **Project ID**

### 2. 🔑 Configure GitHub Repository Secrets

#### A. Access Repository Secrets

1. Go to your GitHub repository
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables**
4. Click **Actions**

#### B. Add Required Secrets

Click **"New repository secret"** for each of these:

##### Essential Secrets (Required):

```
Name: VERCEL_TOKEN
Value: [Your Vercel token from step 1C]

Name: VERCEL_ORG_ID
Value: [Your Vercel organization/team ID]

Name: VERCEL_PROJECT_ID
Value: [Your Vercel project ID]
```

##### Optional Secrets (Recommended):

```
Name: CODECOV_TOKEN
Value: [Get from codecov.io after signing up]

Name: SEMGREP_APP_TOKEN
Value: [Get from semgrep.dev after signing up]
```

#### C. Verify Secrets Configuration

After adding secrets, you should see:

- ✅ VERCEL_TOKEN
- ✅ VERCEL_ORG_ID
- ✅ VERCEL_PROJECT_ID
- ✅ CODECOV_TOKEN (optional)
- ✅ SEMGREP_APP_TOKEN (optional)

### 3. 🌍 Configure Environment Variables in Vercel

#### A. Access Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** tab
3. Click **Environment Variables** in sidebar

#### B. Add Environment Variables by Environment

##### Production Environment:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=GameOne
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_TELEMETRY_DISABLED=1

# Database (Replace with your production database)
DATABASE_URL=postgresql://user:password@host:5432/gameone_prod
DIRECT_URL=postgresql://user:password@host:5432/gameone_prod

# Authentication (Kinde - Production)
KINDE_CLIENT_ID=your_production_client_id
KINDE_CLIENT_SECRET=your_production_client_secret
KINDE_ISSUER_URL=https://your-domain.kinde.com
KINDE_SITE_URL=https://your-domain.vercel.app
KINDE_POST_LOGOUT_REDIRECT_URL=https://your-domain.vercel.app
KINDE_POST_LOGIN_REDIRECT_URL=https://your-domain.vercel.app/dashboard

# Email (Resend - Production)
RESEND_API_KEY=re_your_production_api_key
DEFAULT_FROM_EMAIL=noreply@your-domain.com
DEFAULT_REPLY_TO_EMAIL=support@your-domain.com

# Email Settings
EMAIL_TEST_MODE=false
EMAIL_RATE_LIMIT_PER_MINUTE=50
EMAIL_RATE_LIMIT_PER_HOUR=1000

# Security
ENCRYPTION_KEY=your-32-character-production-key
JWT_SECRET=your-production-jwt-secret
```

##### Preview/Staging Environment:

```bash
# Same as production but with staging values
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-staging-domain.vercel.app
DATABASE_URL=postgresql://user:password@host:5432/gameone_staging
# ... other staging-specific values
```

### 4. 🗄️ Database Setup

#### A. Choose a Database Provider

Recommended options:

- **[Neon](https://neon.tech)** - PostgreSQL with branching
- **[Supabase](https://supabase.com)** - PostgreSQL with additional features
- **[PlanetScale](https://planetscale.com)** - MySQL alternative
- **[Railway](https://railway.app)** - Simple PostgreSQL hosting

#### B. Create Production Database

1. Sign up for your chosen provider
2. Create a new database project
3. Get the connection string
4. Add it to Vercel environment variables as `DATABASE_URL`

#### C. Run Database Migrations

```bash
# Set your DATABASE_URL locally for setup
export DATABASE_URL="your_production_database_url"

# Generate Prisma client
bun run db:generate

# Deploy migrations
bun run db:migrate:deploy

# Seed initial data (optional)
bun run db:seed
```

### 5. 🔐 Authentication Setup (Kinde)

#### A. Create Kinde Account

1. Go to [kinde.com](https://kinde.com)
2. Sign up for an account
3. Create a new application

#### B. Configure Kinde Application

1. In Kinde dashboard, go to **Applications**
2. Create new application or use existing
3. Configure settings:
   - **Application type**: Regular web application
   - **Allowed callback URLs**:
     - `https://your-domain.vercel.app/api/auth/kinde_callback`
     - `http://localhost:3000/api/auth/kinde_callback` (for development)
   - **Allowed logout redirect URLs**:
     - `https://your-domain.vercel.app`
     - `http://localhost:3000` (for development)

#### C. Get Kinde Credentials

1. Copy **Client ID**
2. Copy **Client Secret**
3. Copy **Domain** (your Kinde issuer URL)
4. Add these to Vercel environment variables

### 6. 📧 Email Setup (Resend)

#### A. Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for an account
3. Verify your email

#### B. Configure Domain (Optional but Recommended)

1. In Resend dashboard, go to **Domains**
2. Add your domain
3. Configure DNS records as shown
4. Verify domain

#### C. Get API Key

1. Go to **API Keys** in Resend dashboard
2. Create new API key
3. Copy the key (starts with `re_`)
4. Add to Vercel environment variables

### 7. ✅ Test Your Configuration

#### A. Test Local Development

```bash
# Copy environment variables locally
cp .env.example .env.local

# Add your actual values to .env.local
# Run development server
bun run dev

# Test authentication
# Visit http://localhost:3000 and try logging in
```

#### B. Test Staging Deployment

```bash
# Push to develop branch to trigger staging deployment
git checkout develop
git push origin develop

# Check GitHub Actions for deployment status
# Visit your staging URL to test
```

#### C. Test Production Deployment

```bash
# Push to master branch to trigger production deployment
git checkout master
git merge develop
git push origin master

# Check GitHub Actions for deployment status
# Visit your production URL to test
```

### 8. 🔍 Verification Checklist

Before going live, verify:

#### GitHub Actions ✅

- [ ] CI workflow runs successfully
- [ ] Type checking passes
- [ ] Tests pass
- [ ] Security scans complete
- [ ] Build succeeds
- [ ] Deployment completes

#### Vercel Deployment ✅

- [ ] Application loads successfully
- [ ] Authentication works (login/logout)
- [ ] Database connection works
- [ ] Email sending works
- [ ] API endpoints respond correctly
- [ ] No console errors

#### Security ✅

- [ ] HTTPS is enabled
- [ ] Security headers are present
- [ ] Environment variables are secure
- [ ] No secrets in code
- [ ] Authentication redirects work

### 🆘 Troubleshooting Common Issues

#### Deployment Fails

1. **Check GitHub Actions logs** for detailed error messages
2. **Verify all secrets** are correctly configured
3. **Check Vercel function logs** for runtime errors
4. **Ensure environment variables** match between local and production

#### Authentication Issues

1. **Verify Kinde callback URLs** match your deployment URLs
2. **Check Kinde credentials** are correct in environment variables
3. **Ensure HTTPS** is used for production callbacks

#### Database Connection Issues

1. **Verify DATABASE_URL** format and credentials
2. **Check database provider** status and IP restrictions
3. **Run migrations** on production database
4. **Test connection** using database provider's tools

#### Email Issues

1. **Verify Resend API key** is correct and active
2. **Check domain configuration** if using custom domain
3. **Test email sending** through Resend dashboard
4. **Verify rate limits** are appropriate for your usage

### 📞 Getting Help

If you encounter issues:

1. **Check documentation**: Review `DEPLOYMENT.md` for detailed guides
2. **GitHub Actions logs**: Look for specific error messages
3. **Vercel logs**: Check function logs for runtime issues
4. **Provider status pages**: Check if external services are down
5. **Community support**: Use provider documentation and communities

### 🎉 Success!

Once everything is configured, you'll have:

- ✅ Automated CI/CD pipeline
- ✅ Multi-environment deployments
- ✅ Secure secret management
- ✅ Production-ready infrastructure
- ✅ Monitoring and maintenance

Your application is now ready for production use with enterprise-grade CI/CD! 🚀

---

**Next Steps**: Follow this guide step by step, then test your deployment
end-to-end.
