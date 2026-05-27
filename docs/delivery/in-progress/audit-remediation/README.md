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

Burn down the audit findings **test-first** (TDD), **one feature at a time**: every
finding becomes a test asserting the *correct* behavior (per
`docs/business/definition-of-correct*.md`). The test is RED today, the fix makes it
GREEN, and it stays as a regression guard. Ship nothing on the release-blocker list
until its test is GREEN.

Two framing decisions drive this plan:

1. **Net-benefit inclusion.** If a finding or suggestion makes the app better *at
   all* and doesn't add cruft, gold-plating, or muddiness, it's **in** — regardless
   of severity. The smaller LOW/nit items are included on purpose. Items we
   deliberately *won't* do (by-design, false positives, out-of-scope) are recorded
   in the catalog's [Excluded appendix](findings-catalog.md#excluded--deliberately-not-doing)
   so the decision is explicit, not silently dropped.
2. **Feature-by-feature, not severity-first.** The work is organized and sequenced
   by **feature**: pick a feature, write the RED tests for *all* of its rows, fix
   them, ship a coherently-improved feature, move to the next. Severity is a per-row
   attribute and a ship-gate (below) — not the order of work. (The earlier
   severity-wave framing was replaced on 2026-05-27 per this directive.)

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

## Scope rollup

Net-benefit inclusion across all 44 phases (deduped — the flow/intersection/gating
tiers independently re-confirmed several defects the completeness tier already
logged; those are merged and cross-referenced, not double-counted). Roughly **160
actionable items** after dedup + cruft exclusion, organized into ~50 features.

| Severity | ~Count | Nature |
|----------|------:|--------|
| **BLOCKER / ship-gate** | ~18 | Crashes, authz bypasses (kanban/shop-floor/planning/time-tracking), broken MFA (crypto + login contract), payroll race, a no-op predictive-maint façade, WCAG keyboard traps |
| **HIGH** | ~45 | Data-integrity / financial correctness, IDOR / data exposure, gating coherence, dead-but-shipped surfaces, WCAG |
| **MED** | ~60 | Half-built features, cap-OFF UX dead-ends, missing edit/lifecycle paths, state-machine guards |
| **LOW** | ~40 | Dead methods, token drift, copy, read-leaks, orphan components |

Full per-feature detail: [findings-catalog.md](findings-catalog.md). Counts are
approximate because several rows bundle a sibling cluster (e.g. PRI-1/2/3).

## Ship gate (must-not-ship until GREEN)

A severity overlay on top of the feature spine: these must all be GREEN before GA,
**regardless of which feature you're working through**. They are crashes, authz
bypasses, broken crypto, data exposure, or accessibility traps.

| Area | ID(s) | What |
|------|-------|------|
| MRP | `G-38-MRP-1` | page **freezes** (infinite effect loop) when `CAP-PLAN-MRP` is OFF |
| MFA | `G-MFA-3`, `F-15-FS-01` | TOTP keyed on UTF-8 vs base32 secret (codes never match) **and** the login request/response token contract is mismatched — MFA can't work end-to-end |
| Kanban | `K-F3`, `K-F13`, `K-F15` | bulk-move bypasses irreversible-guard + skips stage events; `explode-bom` / `PUT job` ungated |
| Shop floor | `SF-04`, `SF-05`, `SF-10` | complete-job / assign-job / clock all ungated (any worker, any job, any user) |
| Planning | `P-F6` | ProductionWorker can create/activate/complete cycles (no role gate) |
| Time tracking | `TT-04` | `GET /entries` exposes **all users'** entries to any caller |
| Expenses | `F-EXP-01` | approval ungated — any user approves any expense |
| Payroll | `F-14-BE-02` | `OvertimeRule.IsDefault` atomic-swap race |
| Maintenance | `MAINT-01` | predictive-maint is a no-op mock bound in **all** envs (decide: build or remove) |
| WCAG | `SYS-01`, `B1-N01/N04`, `B1-S01`, `B2-K01`, `B3-C01/C02` | focus trap, nav landmark, skip-link order, search label, kanban + chart keyboard |

WCAG AA is declared non-negotiable in `CLAUDE.md` and gated by `npm run test:a11y`,
so the WCAG criticals are contract violations, not nice-to-haves.

## Feature-by-feature burn-down

Work **one feature to completion** before the next: write the RED tests for all of
that feature's catalog rows, fix them (blocker→high→med→low within the feature),
verify (`dotnet test` / `npm run test` + `test:a11y` / Cypress), ship the feature.
A feature pass produces a coherent, shippable improvement instead of a thin
severity-skim across everything.

**Two cross-cutting "features" are highest leverage — do them first.** They're in
Region 7 of the catalog and fixing them retires rows that recur across many other
features:

1. **Navigation shell + capability coherence** (`N-E3`, `P-F4`, `G-E2`). This is the
   phase-40 NO verdict. Making the nav cap-aware and shipping one shared
   "feature-disabled" state turns every per-feature "cap-OFF silent dead-end" row
   (RFQ, RMA, recurring, MRP, compliance, training, EDI, announcements, AI, BI,
   inventory tabs, quality tabs, customer tabs…) into a one-line consumer of the
   shared fix. Build the shared piece once, then each feature just adopts it.
2. **Shared-component spine + WCAG** (`app-dialog` focus trap + dialog-pattern
   consolidation, `app-data-table` caption, sidebar landmarks, validation-button
   live region, search combobox). Fixing the shared component fixes it everywhere
   it's used — so the per-feature WCAG/dialog rows mostly evaporate.

**Then proceed through the feature spine** (the catalog's region order is a
reasonable default — it follows the value chain and front-loads the ship-gate
features):

- **Region 1 — Master Data:** Leads (the `L3` 500 blocks the whole worker queue) → Customers → Vendors → Parts/BOM → Inventory → Lots.
- **Region 2 — Quote-to-Cash + Expenses:** Quotes/Estimates → Sales Orders → Purchasing/Receiving → Shipments → **Invoices** (QBO-sync blocker) → Payments → Returns → **Expenses** (approval blocker).
- **Region 3 — Operations:** **Kanban** + **Shop Floor** + **Planning** + **Time Tracking** (cluster the authz blockers) → Scheduling → OEE → Quality → **MRP** → Assets → **Maintenance** (mock-façade decision).
- **Region 4 — Platform:** Reports → Approvals (needs Users `ManagerId` first) → Dashboard → Notifications → Calendar → Chat → Search.
- **Region 5 — Admin + Account:** Admin Core (calendar/location set-default 500) → Users → Capabilities → MFA → Payroll (overtime race) → Training → EDI/Announcements/BI/Events.
- **Region 6 — Access + Edge:** **Auth/MFA** (login contract blocker) → Onboarding → Portal → Mobile → AI.

Within each feature, the catalog row's `Test` column names the layer (xUnit / EF /
integration / Vitest / Cypress / axe). api rows also appear in
`forge-api/forge.tests/Remediation/BACKLOG.md` for the `grep "Skip = \"RED"` view.

## RED test status (2026-05-27)

The TDD burn-down has started, top-down. **42 RED tests across 29 files** now
encode the definition-of-correct for the **api-layer findings of Regions 1–5**, in
`forge-api/forge.tests/Remediation/<Feature>/` — all `[Fact(Skip="RED: …")]`,
suite builds green (`dotnet build -warnaserror`). Live list:
`grep -rn 'Skip = "RED' forge.tests/Remediation`. Per-feature coverage + the
deferred set are mapped in that suite's `BACKLOG.md`.

**Not yet covered (tracked for the next passes):**
- **UI layer** (Vitest/Cypress/axe) — all of Regions 6 (Auth/MFA-login-contract,
  Onboarding, Portal, Mobile, AI) and 7 (nav cap-coherence, shared-component spine,
  WCAG), plus the UI rows inside Regions 1–5. Kept out of the .NET run on purpose;
  needs a forge-ui spec pass.
- **Real-Postgres** findings the InMemory harness can't reproduce (set-default
  unique-index races: working-calendar/CompanyLocation, OvertimeRule) — need a
  Testcontainers integration harness.
- **Crypto / complex-seed** api findings (G-MFA-3 TOTP, F-JQ1, invoiced≤shipped,
  approval audit, lead-convert atomicity) — listed in the suite BACKLOG with why.
- A handful of catalog rows turned out **stale** (already implemented): report
  export/schedules, EDI mapping CRUD, customer-return DELETE.

## Where things live (single source of truth per layer)

| Artifact | Home | Role |
|----------|------|------|
| **Master finding catalog + waves** | this effort ([findings-catalog.md](findings-catalog.md)) | the prioritized TODO across *all* layers |
| **api-layer test execution** | `forge-api/forge.tests/Remediation/BACKLOG.md` + `*RemediationTests.cs` | the live `grep "Skip = \"RED"` burn-down for xUnit/EF/integration findings |
| **ui-layer test execution** | `forge-ui` Vitest `*.spec.ts` + `cypress/e2e/` + `npm run test:a11y` | Cypress/Vitest/axe finding tests |
| **Raw evidence (findings + screenshots)** | private `armoryworks/forge-analysis` (`findings/`) | the audit's source material; reference by finding ID |
| **Definition-of-correct** | `docs/business/definition-of-correct*.md` | the assertion source for each test |

## Definition of Done

- Every **in-scope** catalog row (all severities, not just BLOCKER/HIGH) has a
  written test (RED → GREEN) and the fix landed — *or* is moved to the Excluded
  appendix with a one-line reason. Net-benefit means nothing is silently dropped.
- The ship-gate table is fully GREEN; `npm run test:a11y` passes.
- The phase-40 coherence verdict flips to YES: nav is cap-aware and every cap-gated
  surface renders an explained-unavailable state (verified by Cypress).
- Each feature is checked off only when *all* its rows are GREEN (feature-complete,
  not severity-complete).
- On completion: `git mv` this effort to `docs/delivery/complete/`, set
  `status: complete`, and graduate durable rules (the gating-UX contract, the WCAG
  component contracts, the dialog-pattern partition) into `docs/business/` +
  `docs/technical/`.

## Notes

- **De-dup discipline:** the flow / intersection / gating tiers restated several
  defects the completeness tier already logged. The catalog lists each defect
  **once** under its owning feature and notes corroborating phases with "(also X)" —
  a defect confirmed by both a unit-level and a flow-level phase is *higher
  confidence*, not two findings.
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
