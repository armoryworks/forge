---
title: Audit Remediation (44-phase forge-analysis response)
type: delivery
status: in-progress
id: audit-remediation
owner:
updated: 2026-05-27
---

# Audit Remediation

The distilled, actionable response to the completed **44-phase `forge-analysis`
audit**. This is the master TODO: the deduplicated finding catalog, the
root-cause grouping, the severity-ordered burn-down, and the test-driven workflow
that turns each finding into a permanent regression guard.

> **Raw evidence is NOT here.** The 89 finding files + 293 screenshots live in the
> private `armoryworks/forge-analysis` repo (`findings/`). This effort holds only
> what belongs in the shared product repo: the verdict, the prioritized plan, and
> the test contracts. Finding IDs below trace back to the evidence by ID.

## Goal

Burn down the audit findings **test-first** (TDD): every finding becomes a test
asserting the *correct* behavior (per `docs/business/definition-of-correct*.md`).
The test is RED today, the fix makes it GREEN, and it stays as a regression guard.
Ship nothing on the release-blocker list until its test is GREEN.

## What the audit found

- **Coverage:** complete. 380/380 feature components, ~130 routes, 0 residue
  (`forge-analysis/findings/coverage-gap-merge.md`, phase 41).
- **Headline verdict (gating, phase 40):** **NO** — the system does *not*
  communicate cross-area unavailability coherently. Two structural causes, found
  independently by the flow tier (ph30) and the gating tier (ph40):
  1. **Navigation is capability-blind** (`NavTreeService.filterTree()` filters by
     role only) — the sidebar advertises features that are turned off.
  2. **No page-level "feature disabled" state** — `*appCap` clears the DOM
     silently; cap-OFF pages render full chrome over an empty table with a generic
     "no data" message, indistinguishable from a genuinely empty list.
  The user is led to a feature, then dropped into a silent dead-end. Fixing the
  two root causes collapses ~25 per-feature symptom findings at once.

## Severity rollup

Net of de-duplication against the pre-existing backlog (the flow tier independently
re-confirmed several api defects already logged — those are cross-referenced, not
double-counted).

| Severity | Count | Nature |
|----------|------:|--------|
| **BLOCKER / release-gating** | 8 | Must-not-ship: a crash, an authz bypass, a broken-MFA crypto bug, and WCAG keyboard traps |
| **HIGH** | ~42 | Data-integrity / financial correctness, security authz, gating coherence, WCAG |
| **MED** | ~32 | Mostly per-feature gating-UX symptoms + consistency drift |
| **LOW** | ~13 | Token drift, copy, read-leaks |

Full per-finding detail: [findings-catalog.md](findings-catalog.md).

## Release blockers (must-not-ship until GREEN)

These gate any release regardless of wave ordering.

| ID | What | Layer |
|----|------|-------|
| **G-38-MRP-1** | MRP page **freezes** (infinite effect loop, JS main thread dead) when `CAP-PLAN-MRP` is OFF | Cypress E2E + route guard |
| **G-MFA-3** | TOTP HMAC keyed on UTF-8 bytes vs the base32 QR secret → **standard authenticator codes never match**; MFA enrolment is broken | xUnit (crypto) |
| **G-38-MRP-3 / F-07B-03** | **ProductionWorker can create/activate/complete planning cycles** — no role gate on the mutations (live-confirmed POST→201) | WebApplicationFactory |
| **F-EXP-01** | Expense approval (`PATCH /expenses/{id}/status`) has **no role/self gate** — any user approves any expense | WebApplicationFactory |
| **SYS-01** | Inline `app-dialog` does **not trap focus** (0/12) — keyboard users escape into the page behind the modal (WCAG 2.1.2) | Cypress + axe |
| **B1-N04 / B1-S01** | Skip link not first in tab order + global search input has **no accessible name** (WCAG 2.4.1 / 4.1.2) | Cypress + axe |

WCAG AA is declared non-negotiable in `CLAUDE.md` and gated by `npm run test:a11y`,
so the WCAG criticals are contract violations, not nice-to-haves.

## Burn-down waves (root-cause ordered)

Sequenced so each wave fixes a *root cause* and resolves its symptom cluster,
rather than chasing per-screen symptoms. See the catalog for the finding→test map.

- **Wave 0 — Release blockers.** The 8 must-not-ship items above. Nothing ships until these are GREEN.
- **Wave 1 — Financial & data-integrity correctness (api).** The handler/EF defects: QBO sync never enqueued, no `invoiced ≤ shipped` guard, shipping doesn't relieve inventory + reservation leaks, zero-line convert, BOM cycle, lead-convert atomicity, calendar set-default 500, job advances past open NCRs, expense↔vendor orphan. TDD via xUnit + EF `TestDbContext` + `WebApplicationFactory`.
- **Wave 2 — Capability-gating coherence (ui).** The phase-40 NO verdict. Three root-cause fixes — (a) make `NavTreeService` capability-aware, (b) ship a shared "feature-disabled" state (`CapNotDirective` / explained-unavailable component) on cap-gated routes, (c) guard the MRP page — collapse the ~25 `G-37/38/39-*` symptoms. TDD via Cypress.
- **Wave 3 — WCAG 2.2 AA (a11y).** 16 findings, 5 critical. Fix the *shared* components (`app-dialog` focus trap, `validation-button` live region, sidebar landmarks/`aria-current`, global search combobox, `app-data-table` caption, kanban keyboard move, chart text-alt + keyboard) so fixes propagate app-wide. TDD via Cypress + axe.
- **Wave 4 — Editability & discoverability (ui + api).** Draft quote/SO edit paths, Draft-SO list visibility + Confirm path, lead "Convert" row-action, bulk-assign null guard, nav orphans (quality module, notifications, chat).
- **Wave 5 — Consistency & polish (ui).** Design-token drift (hardcoded hex), currency-component usage, page-shell consistency, wiring `unsavedChangesGuard`, surfacing price-lists + vendor price-tiers.

## Where things live (single source of truth per layer)

| Artifact | Home | Role |
|----------|------|------|
| **Master finding catalog + waves** | this effort ([findings-catalog.md](findings-catalog.md)) | the prioritized TODO across *all* layers |
| **api-layer test execution** | `forge-api/forge.tests/Remediation/BACKLOG.md` + `*RemediationTests.cs` | the live `grep "Skip = \"RED"` burn-down for xUnit/EF/integration findings |
| **ui-layer test execution** | `forge-ui` Vitest `*.spec.ts` + `cypress/e2e/` + `npm run test:a11y` | Cypress/Vitest/axe finding tests |
| **Raw evidence (findings + screenshots)** | private `armoryworks/forge-analysis` (`findings/`) | the audit's source material; reference by finding ID |
| **Definition-of-correct** | `docs/business/definition-of-correct*.md` | the assertion source for each test |

## Definition of Done

- Every BLOCKER and HIGH finding has a written test (RED → GREEN) and the fix landed.
- `npm run test:a11y` passes (WCAG criticals closed).
- The phase-40 coherence verdict flips to YES: nav is cap-aware and every cap-gated
  surface renders an explained-unavailable state (verified by Cypress).
- MED/LOW findings either fixed or explicitly deferred with a one-line reason here.
- On completion: `git mv` this effort to `docs/delivery/complete/`, set
  `status: complete`, and graduate durable rules (e.g. the gating-UX contract, the
  WCAG component contracts) into `docs/business/` + `docs/technical/`.

## Notes

- **De-dup discipline:** the flow tier (27–30) restated several api defects the
  completeness/intersection tiers already logged. The catalog lists each defect
  **once** under its root-cause theme and notes the corroborating phases — a defect
  confirmed by both a unit-level and a flow-level phase is *higher confidence*, not
  two findings.
- **Writing the test sharpens the finding** (e.g. `AUDIT-S3` "5 header fields
  dropped" collapsed to a single `Notes` drop + a separate SO-edit UI gap once
  checked against `Quote.cs`). Expect refinement during burn-down; record it here.
- **Single-role seeding caveat** (ph40): the live stack was seeded one user per
  role, so true multi-role compose scenarios were inferred, not exercised. Not a
  gap — a validation caveat to keep in mind when writing role-matrix tests.

## Evidence

- Coverage close: `forge-analysis/findings/coverage-gap-merge.md`
- Gating verdict: `forge-analysis/findings/gating/40-intersection-synthesis.md` (+ `.evidence.md`)
- Per-finding sources: `forge-analysis/findings/{completeness,intersections,flow,uiux,gating}/`
