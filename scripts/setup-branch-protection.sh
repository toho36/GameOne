#!/bin/bash

# Script to manually apply branch protection rules using GitHub CLI
# Usage: ./scripts/setup-branch-protection.sh

echo "🛡️ Setting up strict branch protection for master branch..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

echo "🔧 Applying branch protection rules..."

# Apply branch protection with required status checks
gh api repos/:owner/:repo/branches/master/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["🚀 Pre-Push Validation"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews=null \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field required_conversation_resolution=true

if [ $? -eq 0 ]; then
    echo "✅ Branch protection rules applied successfully!"
    echo "🔒 STRICT MODE ENABLED:"
    echo "  - All CI checks must pass before merge"
    echo "  - Even admins cannot bypass these rules"
    echo "  - No force pushes allowed"
    echo "  - Required status checks: Pre-Push Validation (includes all checks + build)"
else
    echo "❌ Failed to apply branch protection rules"
    echo "You may need to apply these manually in GitHub Settings"
fi