---
trigger: always_on
alwaysApply: true
description: Guidelines for adding/editing rules and workflows to keep single source of truth
---

# 📐 Rule & Workflow Maintenance

## Single Source of Truth

All rules and workflows are stored in `.agent/` with junctions to `.cursor/`:

| Source | Junction |
|--------|----------|
| `.agent/rules/` | `.cursor/rules/` |
| `.agent/workflows/` | `.cursor/commands/` |

> [!CAUTION]
> **NEVER** edit files directly in `.cursor/rules/` or `.cursor/commands/`.
> Always edit in `.agent/` — changes propagate automatically via junctions.

---

## Creating New Rules

### File Location
- Create in `.agent/rules/` only
- Use `.md` extension (not `.mdc`)
- Use kebab-case: `my-new-rule.md`

### Required Frontmatter
``yaml
---
trigger: always_on
alwaysApply: true
description: Brief description of rule purpose
---
``

### Content Guidelines
- Start with H1 heading matching the file purpose
- Use numbered sections for organization
- Include code examples with ✅ CORRECT and ❌ FORBIDDEN patterns
- Keep under 12KB if possible (Antigravity limit)

---

## Creating New Workflows

### File Location
- Create in `.agent/workflows/` only
- Use `.md` extension
- Use kebab-case: `my-workflow.md`

### Required Frontmatter
``yaml
---
description: What this workflow does
---
``

### Content Guidelines
- Clear step-by-step instructions
- Include `// turbo` annotation for auto-run safe commands
- Include exact commands to run
- Define clear success criteria

---

## Updating the Index

After adding new rule files, update `.agent/rules/antigravity.md`:

1. Add entry to the Rule Files table
2. Include file link with focus description

---

## Validation Checklist

Before committing rule/workflow changes:

- [ ] File is in `.agent/` (not `.cursor/`)
- [ ] Has required frontmatter
- [ ] Uses `.md` extension
- [ ] Index updated (for rules)
- [ ] Under 12KB size limit
- [ ] Follows existing naming convention
