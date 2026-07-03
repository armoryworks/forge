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

- **[compliance-calendar · A/Stage 3] Calendar capability gating.** The new
  `CalendarController` (taxonomy read) is `[Authorize]`-only; the Events controller uses
  `CAP-MD-EMPLOYEES`. Should the calendar get its own capability (e.g. `CAP-*-CALENDAR`)
  in the catalog, or stay ungated? → **Assumed**: `[Authorize]` only for now (per-group
  visibility already enforced by A-2); revisit when the capability catalog is touched.

## Deferred UI follow-ups (non-blocking; backend done)

Recorded per the autonomous-execution rule (skip individual tasks, keep moving toward
breadth through cluster E). Backends are implemented + verified; these UI pieces remain:
- **[compliance-calendar A-4] Status-management UI** — mark done/in-progress/waive,
  forced-ack modal, evidence (DocumentSet/URL) attach. API (`/events/{id}/status`,
  `/acknowledge`) + response fields are done.
- **[compliance-calendar A-3] Module-embedded scoped calendar** — embed a
  `scope: module:compliance` calendar in a compliance module route (needs that route).
- **[regulated-parts-safety C-4] Barcode + GS1 license** — standard barcoding default,
  opt-in GS1 with license-as-part (non-inventory PartKind) + expiry-driven renewal PO.
  Deferred (touches the critical `parts` table + a scheduled job).
- **[regulated-parts-safety C-1/C-3] Enforcement + aggregation** — enforce
  `ComplianceFieldRule` (required field @ process step) server-side; compute the deduped
  assembly BOM SDS set on-the-fly. Backends/entities exist; the query/enforcement layer + UI remain.

- **[ai-fleet-orchestration D] Infra/AI implementation** — multi-instance topology,
  master orchestrator, LoRA/fine-tune tiers, hardware sizing matrix + in-app advisor,
  AI-provenance icons, hybrid DB-freshness wiring, provider-aware Accounting AI. Needs the
  multi-container AI stack + a current-model sizing research pass; not verifiable in this
  env. Design complete; D‑2 (`.md` override resolver) implemented.

## Resolved

_(none yet)_
