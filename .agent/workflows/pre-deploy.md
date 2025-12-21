---
description: Pre-deployment validation and checks
---

# Pre-Deployment Checklist

Comprehensive checks before deploying to production.

## Quick Check (Auto-run)

// turbo-all

```bash
# Run all pre-deployment checks
bun run pre-deploy
```

This runs:

1. Format check (Prettier)
2. Type safety (ESLint + TypeScript) - **Catches unused imports/variables**,
   syntax errors, and type mismatches.
3. Unit tests (Vitest)

**Note:** This matches the same checks that run in GitHub Actions CI, ensuring
that if `pre-deploy` passes locally, your code should pass CI as well. Running
this command before pushing prevents build failures in production.

## Manual Steps

1. **Review changes**
   - Check all modified files
   - Ensure no debug code or console.logs
   - Verify no sensitive data in commits

2. **Database migrations**
   - Ensure migrations are created and tested
   - Review migration SQL for data safety
   - Backup production DB if schema changes

3. **Environment variables**
   - Verify all required vars are in Vercel
   - Check `process.env["VAR"]` usage (bracket notation)
   - No hardcoded secrets

4. **Test in staging** (if available)
   - Deploy to staging first
   - Run smoke tests
   - Check error monitoring

5. **Deploy**

```bash
git push origin main
# Vercel auto-deploys from main branch
```

6. **Post-deployment verification**
   - Check deployment logs in Vercel
   - Verify site loads correctly
   - Test critical paths (auth, payments, registration)
   - Monitor error rates

## Rollback Plan

If issues arise:

1. **Quickly revert** in Vercel dashboard (instant rollback)
2. **Fix and redeploy** if minor issue
3. **Database rollback** if schema issues (requires backup)
