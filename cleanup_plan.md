# Codebase Cleanup & Rule Standardization Plan

## Goal

Clean up the codebase to follow best practices, enforce consistent naming
conventions, and resolve linting/formatting issues.

## 1. Rule Standardization

- **Conflict Resolution**: The project uses **kebab-case** for filenames
  (enforced by `validate-structure.ts` and observed in `src/components`), but
  `CLAUDE.md` and `.cursorrules` incorrectly state PascalCase.
- **Action**:
  - Updated `.agent/antigravity.md` to enforce **kebab-case** filenames.
  - Will update `CLAUDE.md` and `.cursorrules` to match the reality
    (kebab-case).

## 2. Environment Setup

- **Issue**: `bun` is not available in the current environment, but the project
  is set up for Bun.
- **Action**:
  - Attempt `npm install` to enable running lint and scripts via Node.js.
  - Use `npx tsx` to run TypeScript validation scripts.

## 3. Cleanup Execution

- **Linting**: Run `npm run lint` and fix errors.
- **Formatting**: Run `prettier` (via `npm run format` if available, or
  `npx prettier --write .`).
- **Structure Validation**: Run `scripts/validate-structure.ts` and fix reported
  errors (e.g., renaming files if they violate kebab-case).
- **Unused Files**: Identify and remove unused files if obvious (e.g., empty
  directories, temp files).

## 4. Verification

- Ensure all checks pass:
  - Lint
  - Type Check
  - Structure Validation

## 5. Documentation

- Update `.agent/antigravity.md` with any new findings.
- Create `.agent/workflows/cleanup.md` for future use.
