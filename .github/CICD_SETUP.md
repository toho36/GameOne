# 🚀 CI/CD Setup Guide

## Overview

This repository now has a **STRICT** automated CI/CD pipeline that runs the same
comprehensive checks as your local pre-push script.

🔒 **ZERO TOLERANCE**: PRs cannot be manually merged until ALL checks pass. 🚫
**NO BYPASSING**: Even admins must follow the rules. ✅ **AUTOMATION ONLY**:
Merge only happens when everything is green.

## What Happens on Every PR

### 1. 🚀 Pre-Push Validation (Required)

Runs your comprehensive pre-push checks:

- TypeScript type checking
- ESLint code quality
- Prettier formatting
- Project structure validation
- Database schema validation
- Unit tests

### 2. 🏗️ Build Verification (Required)

- Builds the Next.js application
- Verifies build artifacts
- Analyzes build size

### 3. 🗄️ Database Validation (Required)

- Sets up test PostgreSQL database in CI
- Validates Prisma schema and migrations
- Ensures database changes don't break the app

### 4. 🔒 Security Audit (Optional)

- Runs security audit on dependencies
- Won't block merges but provides warnings

### 5. ✅ CI Pipeline Success (Required)

- Summary job that confirms all critical checks passed
- This is the final gate before merge is allowed

## Auto-Merge Setup

### Automatic Enabling
- **Repository owners**: Auto-merge enables automatically for your PRs
- **Contributors**: Add the `auto-merge` label to enable auto-merge
- **Non-draft PRs only**: Draft PRs won't auto-merge

### How It Works
1. When you create/update a PR, auto-merge gets enabled
2. GitHub waits for all required status checks to pass
3. Once everything is green, GitHub automatically merges
4. Uses squash merge to keep history clean

### Troubleshooting Auto-Merge

If auto-merge fails, check:

1. **Repository Settings**: 
   - Go to Settings → General → Pull Requests
   - Enable "Allow auto-merge"
   - Enable "Allow squash merging"

2. **Workflow Permissions**:
   - Repository has Actions permissions enabled
   - Workflows have write access to pull requests

3. **Branch Protection**:
   - Run the "🛡️ Setup Branch Protection" workflow first
   - Ensure all required status checks are configured

## Branch Protection Rules

To activate branch protection (run once):

1. Go to GitHub Actions in your repository
2. Find "🛡️ Setup Branch Protection" workflow
3. Click "Run workflow"
4. Select branch (default: master)
5. Click "Run workflow"

This will configure STRICT ENFORCEMENT (Solo Development Mode):

- ✅ **Required status checks** (all CI jobs must pass)
- 👤 **Reviews: DISABLED** (configured for solo development)
- 🔒 **Enforce for admins** (even admins cannot bypass CI checks)
- 🚫 **Block force pushes**
- 💬 **Require conversation resolution**
- ⚠️ **NO MANUAL MERGE BUTTON** until all CI checks pass

**Solo Development Mode**: You can merge your own PRs once all CI checks are
green!

## Local Development

### Before Pushing

Always run locally to catch issues early:

```bash
bun run pre-push          # Run all checks
bun run pre-push --fix    # Auto-fix what can be fixed
```

### If CI Fails

1. Check the failed job in GitHub Actions
2. Run `bun run pre-push --fix` locally to auto-fix issues
3. Commit and push the fixes

## Workflow Files

- `.github/workflows/ci.yml` - Main CI pipeline
- `.github/workflows/auto-merge.yml` - Auto-merge on success
- `.github/workflows/setup-branch-protection.yml` - One-time protection setup

## Benefits

✅ **Consistency**: Same checks locally and in CI ✅ **Auto-fixing**: CI
suggests exact commands to fix issues ✅ **Fast feedback**: Parallel jobs for
faster execution ✅ **Security**: Multiple validation layers ✅ **Automation**:
Auto-merge when everything passes ✅ **Protection**: Branch protection prevents
broken code

## Troubleshooting

### "Checks haven't completed yet"

Wait for all jobs to finish. The auto-merge will trigger once the final job
passes.

### "Required status check is failing"

Check the specific job that's failing and fix the reported issues locally.

### "Auto-merge not working"

Ensure you're the repository owner or have added the `auto-merge` label to your
PR.
