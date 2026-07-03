---
title: Blocking Questions & Issues Inventory
type: delivery
status: in-progress
id: blocking-questions
updated: 2026-07-03
---

# Blocking Questions & Issues Inventory

Running log of things that need the owner's input, captured during autonomous build
work **without stopping**. Each entry records the assumption made (or task skipped)
so work kept moving. Owner answers in batch; resolved entries move to Resolved.

Format: `[effort · stage] question — assumption/skip taken → (status)`.

## Open

- **[compliance-calendar · A-2] Compliance role model.** Is there a dedicated
  Compliance/ComplianceOfficer role, or should compliance Super-Groups be granted to
  `Manager`/`Admin` + an optional custom role? → **Assumed**: enforcement grants by
  existing roles (`Admin` always; others via `CalendarSuperGroupRoleVisibility`); no
  new role seeded. Revisit if a Compliance role is wanted.
- **[compliance-calendar] Merge cadence.** When should `feature/compliance-calendar`
  (schema branch) merge to `main`? → **Assumed** (owner: "continue"): keep on the
  branch through the remaining stages; merge later.

## Resolved

_(none yet)_
