---
description: Validate rule and workflow files before committing
---

# Validate Rules & Workflows

Manual checklist to ensure rule and workflow files follow the
single-source-of-truth pattern.

## When to Run

Before committing changes to:

- `.agent/rules/*.md`
- `.agent/workflows/*.md`

---

## Validation Steps

### 1. Check File Location

``powershell

# List all rule files

Get-ChildItem .agent\rules\*.md

# List all workflow files

Get-ChildItem .agent\workflows\*.md ``

✅ **All files should be in** `.agent/` **folders only**

---

### 2. Verify Frontmatter

For **rules** (`.agent/rules/*.md`): ``yaml

---

trigger: always_on alwaysApply: true description: Brief description

---

``

For **workflows** (`.agent/workflows/*.md`): ``yaml

---

## description: What this workflow does

``

---

### 3. Check File Size

``powershell

# Check rule file sizes (should be < 12KB)

Get-ChildItem .agent\rules\*.md | Select-Object Name,
@{N='KB';E={[math]::Round(.Length/1KB,2)}} ``

✅ **Each file should be < 12 KB**

---

### 4. Verify Index is Updated

Open `.agent/rules/antigravity.md` and confirm:

- New rule files are listed in the table
- Links use correct format: `[filename.md](mdc:.agent/rules/filename.md)`

---

### 5. Test Junction Links

``powershell

# Verify junctions exist

Get-Item .cursor\rules | Select-Object Name, LinkType, Target Get-Item
.cursor\commands | Select-Object Name, LinkType, Target ``

✅ **Both should show** `LinkType: Junction`

---

### 6. Check Git Status

`powershell git status .agent/ `

✅ **Files in** `.agent/` **should be tracked, not ignored**

---

## Success Criteria

- [ ] All files in correct `.agent/` location
- [ ] Required frontmatter present
- [ ] File sizes < 12 KB
- [ ] Index updated (for rules)
- [ ] Junctions working
- [ ] Git tracking files correctly
