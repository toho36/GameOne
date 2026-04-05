# New Repo Best Practices Transfer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Produce a durable transfer document that extracts the most useful engineering, product, and workflow lessons from the current GameOne repo and turns them into concrete rules for a new repo.

**Architecture:** This work is documentation-first. The output is a single high-signal document that analyzes the current repo and organizes conclusions into six sections: Keep, Change, Do Not Carry Over, Patterns to Preserve, Patterns to Redesign, and New Repo Rules From Day One. The plan keeps scope intentionally narrow: extract only reusable best practices and anti-patterns relevant to the future new repo, especially around registration logic, domain modeling, type safety, testing, data fetching, docs, and operational ergonomics.

**Tech Stack:** Markdown, existing GameOne codebase, git history, current docs under `docs/`, Prisma schema, Next.js app structure, existing planning docs under `docs/plans/`.

---

## Output artifact target

The implementation created by this plan should produce:

- `docs/NEW-REPO-BEST-PRACTICES.md`

Optional supporting notes may be created temporarily during drafting, but the final durable artifact should be the single markdown document above.

## Scope boundaries

Include only lessons that help the future repo:
- ship event registration correctly
- support future social/community features
- support possible SpacetimeDB-first architecture decisions
- remain cheap, snappy, maintainable, and agent-friendly

Do **not** turn this into:
- a complete migration plan
- a full architecture spec for the new repo
- a vague essay about coding philosophy
- a line-by-line rewrite proposal for the old repo

---

### Task 1: Inventory the current repo sources to mine for transferable practices

**Files:**
- Modify: `docs/plans/2026-04-05-new-repo-best-practices-transfer.md`
- Read only: `README.md`
- Read only: `.github/CICD_SETUP.md`
- Read only: `prisma/schema.prisma`
- Read only: `package.json`
- Read only: `src/lib/prisma.ts`
- Read only: `src/lib/api/events/public.ts`
- Read only: `src/app/api/**/route.ts`
- Read only: `src/components/**`
- Read only: `docs/accessibility.md`
- Read only: `docs/design-system.md`
- Read only: `docs/responsive-specs.md`
- Read only: `docs/schema-relations.md`

**Step 1: Write the failing checklist note**

Create a short scratch checklist in the plan file noting the required source categories:

```md
- product/readme sources
- deployment/ops docs
- schema/domain model
- runtime/dependency stack
- API/data-fetching patterns
- component structure/design docs
- tests and verification patterns
- current planning docs
```

**Step 2: Run the inventory commands**

Run:
```bash
rg -n "^#|^##" README.md .github/CICD_SETUP.md docs/*.md
find src/app/api -name 'route.ts' | sort | head -50
find src -name '*.test.ts' -o -name '*.test.tsx' | sort
```
Expected:
- a visible inventory of the documentation and implementation surfaces worth mining

**Step 3: Record exact source list for drafting**

Append a curated source list section to the plan scratchpad like:

```md
## Drafting source list
- README.md
- .github/CICD_SETUP.md
- package.json
- prisma/schema.prisma
- src/lib/prisma.ts
- src/lib/api/events/public.ts
- docs/accessibility.md
- docs/design-system.md
- docs/responsive-specs.md
- docs/schema-relations.md
```

**Step 4: Verify the inventory is sufficient**

Run:
```bash
test -f README.md && test -f prisma/schema.prisma && test -f package.json && echo ok
```
Expected:
- `ok`

**Step 5: Commit**

```bash
git add docs/plans/2026-04-05-new-repo-best-practices-transfer.md
git commit -m "docs: start source inventory for new repo best practices transfer"
```

---

### Task 2: Draft the document skeleton with the six approved sections

**Files:**
- Create: `docs/NEW-REPO-BEST-PRACTICES.md`

**Step 1: Write the failing structure check**

Create a temporary shell check command that will fail until all headings exist:

```bash
for h in \
  "# New Repo Best Practices" \
  "## Keep" \
  "## Change" \
  "## Do Not Carry Over" \
  "## Patterns to Preserve" \
  "## Patterns to Redesign" \
  "## New Repo Rules From Day One"; do
  rg -F "$h" docs/NEW-REPO-BEST-PRACTICES.md
 done
```

Expected:
- FAIL because file does not exist yet

**Step 2: Create the minimal document skeleton**

Write this initial content:

```md
# New Repo Best Practices

## Purpose

This document extracts the most useful practices, mistakes, and reusable patterns from the current GameOne repo so the next repo starts cleaner, faster, and with fewer architectural regrets.

## Keep

_TBD_

## Change

_TBD_

## Do Not Carry Over

_TBD_

## Patterns to Preserve

_TBD_

## Patterns to Redesign

_TBD_

## New Repo Rules From Day One

_TBD_
```

**Step 3: Run the structure check**

Run the command from Step 1 again.
Expected:
- PASS for all headings

**Step 4: Format sanity check**

Run:
```bash
bun run format:check docs/NEW-REPO-BEST-PRACTICES.md 2>/dev/null || prettier --check docs/NEW-REPO-BEST-PRACTICES.md
```
Expected:
- PASS or clearly indicates whether markdown formatting is acceptable in current setup

**Step 5: Commit**

```bash
git add docs/NEW-REPO-BEST-PRACTICES.md
git commit -m "docs: add best practices transfer skeleton for new repo"
```

---

### Task 3: Fill the “Keep” and “Patterns to Preserve” sections from the current repo

**Files:**
- Modify: `docs/NEW-REPO-BEST-PRACTICES.md`
- Read only: `package.json`
- Read only: `src/lib/prisma.ts`
- Read only: `docs/design-system.md`
- Read only: `docs/accessibility.md`
- Read only: `docs/responsive-specs.md`
- Read only: selected tests in `src/**/__tests__`

**Step 1: Write the failing content check**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
text = Path('docs/NEW-REPO-BEST-PRACTICES.md').read_text()
assert 'TBD' in text
print('still incomplete')
PY
```
Expected:
- PASS with `still incomplete`

**Step 2: Replace `_TBD_` in `## Keep` with concrete bullets**

The section should include practical items like:

```md
## Keep

- Strict TypeScript-first mindset. The current repo keeps type-checking meaningful; the new repo should preserve strict typing as a default constraint.
- Clear domain naming around events, registrations, payments, and users. The current repo’s domain language is usable and should be retained even if the storage model changes.
- Documented design references. The existing `docs/accessibility.md`, `docs/design-system.md`, and `docs/responsive-specs.md` show that UI decisions should be written down, not left implicit.
- Explicit local quality commands in `package.json` (`type-check`, `test:run`, `format:check`, etc.). The new repo should expose the same style of obvious, discoverable developer commands.
- Separation between public-event read models and internal/admin logic. The current repo’s public-event shaping is a pattern worth preserving even if implemented differently.
```

**Step 3: Replace `_TBD_` in `## Patterns to Preserve` with concrete bullets**

Include practical patterns such as:

```md
## Patterns to Preserve

- Keep a dedicated public read-model layer for user-facing event data rather than exposing raw storage rows directly.
- Keep validation and transformation close to domain boundaries.
- Keep docs for accessibility, responsive behavior, and design tokens in-repo.
- Keep tests around domain-critical UI states and registration behavior.
- Keep environment variables explicit in `.env.example` with comments grouped by purpose.
```

**Step 4: Run the completion check**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
text = Path('docs/NEW-REPO-BEST-PRACTICES.md').read_text()
assert '## Keep' in text
assert '## Patterns to Preserve' in text
assert '_TBD_' in text or 'TBD' in text
print('partial draft complete')
PY
```
Expected:
- PASS with `partial draft complete`

**Step 5: Commit**

```bash
git add docs/NEW-REPO-BEST-PRACTICES.md
git commit -m "docs: capture keep and preserve sections for new repo"
```

---

### Task 4: Fill the “Change” and “Patterns to Redesign” sections using current repo pain points

**Files:**
- Modify: `docs/NEW-REPO-BEST-PRACTICES.md`
- Read only: `src/app/sitemap.ts`
- Read only: `src/lib/api/events/public.ts`
- Read only: `src/lib/prisma.ts`
- Read only: current planning docs under `docs/plans/`

**Step 1: Write the failing content check**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
text = Path('docs/NEW-REPO-BEST-PRACTICES.md').read_text()
assert '## Change' in text
assert '## Patterns to Redesign' in text
print('sections present, content not verified')
PY
```
Expected:
- PASS

**Step 2: Fill `## Change` with concrete changes, not vague complaints**

Include items like:

```md
## Change

- Redesign registration logic around a formal state machine instead of allowing state meaning to spread across UI and service code.
- Reduce hidden runtime coupling between build-time rendering and live database access.
- Replace implicit capacity logic with explicit occupancy rules (`occupies_capacity` or equivalent derived semantics).
- Separate registration status from payment status from day one.
- Choose a single authoritative model for participants, guests, friends, and admin-added attendees.
```

**Step 3: Fill `## Patterns to Redesign` with precise redesign targets**

Include patterns like:

```md
## Patterns to Redesign

- Redesign status modeling so payment states and registration placement are not conflated.
- Redesign data access to avoid build-time failures caused by live infrastructure dependencies during static generation.
- Redesign append-only history handling so hot interactive data is separated from archival data.
- Redesign guest/friend registration to use participant records rather than fake user accounts.
- Redesign admin overrides so over-capacity entries are explicit, auditable, and visible in UI.
```

**Step 4: Run the content quality check**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
text = Path('docs/NEW-REPO-BEST-PRACTICES.md').read_text()
required = [
  'state machine',
  'payment status',
  'registration status',
  'build-time',
  'archive',
]
for item in required:
    assert item in text.lower(), item
print('change/redesign section has required themes')
PY
```
Expected:
- PASS

**Step 5: Commit**

```bash
git add docs/NEW-REPO-BEST-PRACTICES.md
git commit -m "docs: capture change and redesign sections for new repo"
```

---

### Task 5: Fill the “Do Not Carry Over” section with explicit anti-patterns

**Files:**
- Modify: `docs/NEW-REPO-BEST-PRACTICES.md`
- Read only: current repo status patterns, environment usage, and docs

**Step 1: Write the failing anti-pattern check**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
text = Path('docs/NEW-REPO-BEST-PRACTICES.md').read_text()
assert '## Do Not Carry Over' in text
print('section exists')
PY
```
Expected:
- PASS

**Step 2: Fill the section with explicit anti-pattern bullets**

Use content like:

```md
## Do Not Carry Over

- Do not carry over ambiguous status enums that try to encode registration state, payment state, and queue placement all at once.
- Do not carry over build-critical routes that depend directly on live infrastructure without a fallback or runtime strategy.
- Do not carry over undocumented edge-case logic for waiting-list promotion, payment rejection, or admin overbooking.
- Do not carry over provider-specific assumptions from Vercel free-tier constraints into the new architecture.
- Do not carry over guest registration as an afterthought; define the participant model at the start.
- Do not carry over hidden operational behavior that exists only in conversation and not in markdown specs.
```

**Step 3: Run the anti-pattern verification**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
text = Path('docs/NEW-REPO-BEST-PRACTICES.md').read_text().lower()
required = ['ambiguous status', 'build-critical', 'waiting-list', 'vercel', 'participant']
for item in required:
    assert item in text, item
print('anti-pattern section complete')
PY
```
Expected:
- PASS

**Step 4: Markdown sanity check**

Run:
```bash
prettier --check docs/NEW-REPO-BEST-PRACTICES.md
```
Expected:
- PASS

**Step 5: Commit**

```bash
git add docs/NEW-REPO-BEST-PRACTICES.md
git commit -m "docs: capture anti-patterns not to carry into new repo"
```

---

### Task 6: Fill “New Repo Rules From Day One” as operational rules, not aspirations

**Files:**
- Modify: `docs/NEW-REPO-BEST-PRACTICES.md`

**Step 1: Write the failing rules check**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
text = Path('docs/NEW-REPO-BEST-PRACTICES.md').read_text()
assert '## New Repo Rules From Day One' in text
print('rules section exists')
PY
```
Expected:
- PASS

**Step 2: Fill the section with numbered rules**

Use concrete rules like:

```md
## New Repo Rules From Day One

1. Registration status and payment status must be modeled separately.
2. Capacity must be enforced by a single authoritative rule, not duplicated across UI and backend.
3. Participant records must support self, friend, guest, and admin-created attendees explicitly.
4. Hot interactive data and cold historical data must be separated by design.
5. Every critical state transition must be documented in markdown before implementation.
6. Every new environment variable must be added to `.env.example` with a comment.
7. Every domain-critical flow must have at least one automated test at the state-transition level.
8. Build-time rendering must never depend on fragile live infrastructure without an explicit fallback strategy.
9. Admin override actions must be explicit, auditable, and visible in admin UI.
10. Agent-oriented workflows, prompts, and docs must remain externalized and versioned in the repo.
```

**Step 3: Run rules verification**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
text = Path('docs/NEW-REPO-BEST-PRACTICES.md').read_text()
for i in range(1, 11):
    assert f'{i}.' in text
print('10 rules present')
PY
```
Expected:
- PASS

**Step 4: Final content completion check**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
text = Path('docs/NEW-REPO-BEST-PRACTICES.md').read_text()
assert '_TBD_' not in text
assert 'TBD' not in text
print('document fully drafted')
PY
```
Expected:
- PASS

**Step 5: Commit**

```bash
git add docs/NEW-REPO-BEST-PRACTICES.md
git commit -m "docs: add day-one rules for new repo"
```

---

### Task 7: Add cross-links from planning docs and validate the artifact

**Files:**
- Modify: `README.md`
- Modify: `docs/plans/2026-04-05-spacetimedb-foundation-and-spike.md`
- Modify: `docs/plans/2026-04-05-new-repo-best-practices-transfer.md`
- Test: repository-level markdown verification commands

**Step 1: Add discoverability links**

Add one reference in `README.md` under repository references:

```md
- [New repo best practices transfer](./docs/NEW-REPO-BEST-PRACTICES.md)
```

Add one short line in the SpacetimeDB spike plan near the final verdict section:

```md
See also: `docs/NEW-REPO-BEST-PRACTICES.md` for transferable rules and anti-patterns extracted from the current repo.
```

**Step 2: Run verification commands**

Run:
```bash
prettier --check docs/NEW-REPO-BEST-PRACTICES.md README.md docs/plans/2026-04-05-spacetimedb-foundation-and-spike.md
```
Expected:
- PASS

**Step 3: Run repository sanity commands**

Run:
```bash
bun run format:check
bun run type-check
bun run test:run
```
Expected:
- note any unrelated repo failures, but the document work itself should not introduce new issues

**Step 4: Write a short summary block at the bottom of the document**

Append:

```md
## Summary

The current GameOne repo contains reusable strengths in domain language, documentation habits, and type-safety discipline. The new repo should preserve those strengths while intentionally redesigning registration state modeling, archival boundaries, participant handling, and infrastructure coupling.
```

**Step 5: Commit**

```bash
git add README.md docs/NEW-REPO-BEST-PRACTICES.md docs/plans/2026-04-05-spacetimedb-foundation-and-spike.md docs/plans/2026-04-05-new-repo-best-practices-transfer.md
git commit -m "docs: finalize best practices transfer for new repo"
```

---

## Final verdict to capture in the document

The final authored document should clearly communicate these conclusions:

- The current GameOne repo should be treated as a **reference system**, not the literal starting point for the new repo.
- The new repo should preserve the current repo’s strongest habits:
  - explicit docs
  - strict typing mindset
  - domain naming clarity
  - dedicated quality commands
- The new repo should explicitly redesign:
  - registration logic
  - payment state modeling
  - waiting-list promotion semantics
  - participant modeling for friends and admin-added attendees
  - hot/cold data boundaries
- The new repo should start with written rules, not tacit assumptions.

## Notes for the implementer

- Keep the document practical. Every bullet should change behavior in the new repo.
- Avoid abstract advice like “write cleaner code” or “keep things modular.” Replace abstractions with enforceable rules.
- Prefer examples from the current repo only when they help explain a concrete keep/change decision.
- If a section grows too long, compress it into bullets with one sentence of rationale each.
- The target reader is the future engineer opening the new repo with no prior context.
