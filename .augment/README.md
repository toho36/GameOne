# Augment Rules for GameOne

This folder defines the authoritative rules Augment Agent must follow when reading, generating, editing, and reviewing code in this repository.

- Scope: Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS, shadcn/ui, Prisma, next-intl, React Query, ky
- Source of truth: Consolidated from .cursor and .claude guidance and verified against the current codebase layout

Quick links to rules:
- ./rules/AUGMENT.md — Core mission and absolute rules
- ./rules/PROJECT_STRUCTURE.md — Required folder/file structure and naming
- ./rules/TYPES.md — TypeScript standards (strict), separation, naming
- ./rules/COMPONENTS.md — Component architecture, size limits, accessibility
- ./rules/API_CLIENT.md — Data-fetching standard (ky + React Query)
- ./rules/TESTING.md — Testing strategy (Vitest + RTL)
- ./rules/SECURITY.md — Security, auth, env, API patterns

Validation commands (non-destructive):
- bun run type-check
- bun run lint
- bun run test
- bun run build
- bun run pre-push

How Augment should use these:
1) Plan with these rules before creating or editing files
2) If a rule conflicts with existing code, prefer refactoring to compliance; if unsafe, flag and ask
3) Enforce file/component size limits and type separation proactively
4) Default to smallest change that achieves compliance and passes checks

