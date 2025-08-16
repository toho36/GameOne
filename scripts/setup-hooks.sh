#!/bin/bash

# Setup script to configure Git hooks for the project
# This script enables automated validation before commits

echo "🔧 Setting up Git hooks for GameOne project..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a Git repository"
    echo "Make sure you run this script from the project root directory."
    exit 1
fi

# Configure Git to use our custom hooks directory
echo "📁 Configuring Git hooks directory..."
git config core.hooksPath .githooks

# Make sure hook scripts are executable
echo "🔐 Making hook scripts executable..."
chmod +x .githooks/*

# Verify the setup
if [ -x ".githooks/pre-commit" ]; then
    echo "✅ Pre-commit hook is configured and executable"
else
    echo "❌ Error: Pre-commit hook setup failed"
    exit 1
fi

# Test the hook (dry run)
echo "🧪 Testing hooks configuration..."
if command -v bun &> /dev/null; then
    echo "✅ Bun is available"
    
    # Check if required scripts exist
    if grep -q "validate-structure" package.json; then
        echo "✅ Validation scripts are configured"
    else
        echo "❌ Warning: Validation scripts not found in package.json"
    fi
else
    echo "⚠️  Warning: Bun is not installed. Hooks will fail without Bun."
    echo "Install Bun from: https://bun.sh"
fi

echo ""
echo "🎉 Git hooks setup completed!"
echo ""
echo "📋 What happens now:"
echo "  • Before each commit, the following checks will run:"
echo "    - TypeScript type checking"
echo "    - ESLint code quality"
echo "    - Project structure validation"
echo "    - Code formatting check"
echo "    - Forbidden patterns check"
echo ""
echo "💡 Manual commands:"
echo "  bun run check-all           - Run all checks manually"
echo "  bun run validate-structure  - Check project structure"
echo "  bun run type-check         - TypeScript validation"
echo "  bun run lint               - Code quality check"
echo ""
echo "🚫 To bypass hooks (not recommended):"
echo "  git commit --no-verify"
echo ""
echo "📚 Structure guidelines:"
echo "  • .cursor/rules/project-structure.mdc"
echo "  • .claude/agents/project-structure.md"