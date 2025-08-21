# Production Database Issues - Complete Fix Guide

## 🚨 Issues Identified

### 1. **Users Not Being Added to Database**
- **Problem**: Kinde authentication works but users aren't created in your database
- **Root Cause**: `/api/auth/me` endpoint only returned Kinde user info, didn't create database records
- **Status**: ✅ **FIXED** - Updated endpoint to auto-create users

### 2. **Database Connection Errors in Production**
- **Problem**: `Error validating datasource: the URL must start with the protocol prisma:// or prisma+postgres://`
- **Root Cause**: Data Proxy configuration mismatch with direct database connection
- **Status**: ✅ **FIXED** - Removed Data Proxy config

### 3. **New Database Created on Branch Push**
- **Problem**: Vercel creates new databases for different branches
- **Root Cause**: Environment variable configuration issues
- **Status**: 🔧 **NEEDS CONFIGURATION**

## 🛠️ Fixes Applied

### Fix 1: User Creation in `/api/auth/me`

**File**: `src/app/api/auth/me/route.ts`

**What it does now**:
- ✅ Checks if user exists in database
- ✅ Automatically creates user if they don't exist
- ✅ Assigns default USER role
- ✅ Returns complete user profile with roles and permissions

**Code Changes**:
```typescript
// Before: Only returned Kinde user info
return NextResponse.json({
  id: user.id,
  email: user.email,
  // ... basic info only
});

// After: Creates user in database and returns complete profile
let dbUser = await prisma.user.findUnique({
  where: { kindeId: user.id },
  include: { userRoles: { include: { role: true } } }
});

if (!dbUser) {
  // Create user with default role
  dbUser = await prisma.user.create({
    data: {
      kindeId: user.id,
      email: user.email || "",
      name: `${user.given_name} ${user.family_name}`,
      status: "ACTIVE",
      preferredLocale: "en"
    }
  });
  
  // Assign default USER role
  await prisma.userRole.create({
    data: {
      userId: dbUser.id,
      roleId: defaultRole.id,
      assignedBy: dbUser.id,
      isActive: true
    }
  });
}
```

### Fix 2: Database Connection Configuration

**Files Modified**:
- `vercel.json` - Removed `PRISMA_GENERATE_DATAPROXY: "true"`
- `prisma/schema.prisma` - Removed `engineType = "library"`

**What this fixes**:
- ✅ Eliminates Data Proxy protocol errors
- ✅ Enables direct PostgreSQL connections
- ✅ Fixes production database connectivity

## 🔧 Remaining Configuration Needed

### Environment Variables in Vercel

**Go to your Vercel dashboard**:
1. Select your GameOne project
2. Go to Settings → Environment Variables
3. Ensure these are set correctly:

```bash
# Database (use your actual values)
DATABASE_URL="postgresql://username:password@host:port/database"

# Kinde Auth
KINDE_CLIENT_ID="your_kinde_client_id"
KINDE_CLIENT_SECRET="your_kinde_client_secret"
KINDE_ISSUER_URL="https://your-domain.kinde.com"
KINDE_SITE_URL="https://your-vercel-domain.vercel.app"
KINDE_POST_LOGOUT_REDIRECT_URL="https://your-vercel-domain.vercel.app"
KINDE_POST_LOGIN_REDIRECT_URL="https://your-vercel-domain.vercel.app"

# Other required
CRON_SECRET="your_cron_secret"
NODE_ENV="production"
```

### Database URL Format

**Use this format** (NOT Data Proxy):
```bash
# ✅ CORRECT - Direct PostgreSQL connection
DATABASE_URL="postgresql://username:password@host:port/database"

# ❌ WRONG - Data Proxy (causes errors)
DATABASE_URL="prisma://aws-us-east-1.prisma-data.com/__PROJECT_ID__"
```

## 🚀 Deployment Steps

### 1. **Create Pull Request**
```bash
# Create feature branch
git checkout -b fix/production-database-issues

# Push changes
git push origin fix/production-database-issues

# Create PR on GitHub to merge into master
```

### 2. **Verify Environment Variables**
- Check Vercel dashboard for correct `DATABASE_URL`
- Ensure all Kinde variables are set
- Verify `NODE_ENV=production`

### 3. **Deploy and Test**
- Merge PR to master
- Vercel will auto-deploy
- Test user registration flow
- Check database for new users

## 🧪 Testing the Fix

### Test User Creation Locally
```bash
# Start your app
bun run dev

# Register a new user with Kinde
# Check if they appear in database
bun run scripts/check-current-user.ts
```

### Test Production Deployment
1. Deploy to Vercel
2. Register new user on production
3. Check Vercel logs for any errors
4. Verify user appears in production database

## 📊 Monitoring and Debugging

### Check Production Logs
```bash
# In Vercel dashboard
# Go to Functions → View Function Logs
# Look for any database connection errors
```

### Health Check Endpoint
```bash
# Test your health endpoint
curl https://your-domain.vercel.app/api/health

# Should return:
{
  "status": "healthy",
  "database": {
    "status": "connected",
    "responseTime": <number>
  }
}
```

### Database Connection Test
```bash
# If you have database access
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

## 🔍 Troubleshooting

### If Users Still Aren't Created

1. **Check Vercel logs** for errors
2. **Verify environment variables** are correct
3. **Test database connection** manually
4. **Check if `/api/auth/me` is being called**

### If Database Connection Still Fails

1. **Verify `DATABASE_URL` format** (postgresql:// not prisma://)
2. **Check database credentials** and permissions
3. **Ensure database is accessible** from Vercel's IP ranges
4. **Check firewall and security group** settings

### If New Databases Keep Being Created

1. **Check Vercel project settings** for preview deployments
2. **Verify environment variables** are consistent across branches
3. **Check if you have multiple Vercel projects** for the same repo

## ✅ Success Criteria

**The fix is working when**:
- ✅ New users register with Kinde
- ✅ Users automatically appear in database
- ✅ Users can access protected features
- ✅ Health endpoint shows database as "connected"
- ✅ No more Data Proxy protocol errors

## 📞 Support

If issues persist after applying these fixes:
1. Check Vercel function logs
2. Verify all environment variables
3. Test database connectivity manually
4. Check Prisma client generation

---

**Last Updated**: $(date)
**Status**: Ready for deployment
