# 🚀 CI/CD Setup Guide

## Overview

This repository now has a **STRICT** automated CI/CD pipeline that runs the same
comprehensive checks as your local pre-push script. 

🔒 **ZERO TOLERANCE**: PRs cannot be manually merged until ALL checks pass.
🚫 **NO BYPASSING**: Even admins must follow the rules.
✅ **AUTOMATION ONLY**: Merge only happens when everything is green.

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

### 3. 🔒 Security Audit (Optional)

- Runs security audit on dependencies
- Won't block merges but provides warnings

### 4. ✅ CI Pipeline Success (Required)

- Summary job that confirms all critical checks passed
- This is the final gate before merge is allowed

## Auto-Merge Setup

### For Repository Owners

PRs from the repository owner automatically enable auto-merge when checks pass.

### For Contributors

Add the `auto-merge` label to your PR to enable automatic merging.

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

**Solo Development Mode**: You can merge your own PRs once all CI checks are green!

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
