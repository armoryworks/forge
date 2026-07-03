---
title: Blocking Questions & Issues Inventory
type: delivery
status: in-progress
id: blocking-questions
updated: 2026-07-03
---

# Blocking Questions & Issues Inventory

Running log captured during autonomous build work **without stopping**. After the
"pick them all up" pass, everything **codeable and verifiable in this environment**
is done and merged to `main`. What remains needs the owner's decision, external
infrastructure (multi-container AI stack / network / ML training), or a runtime the
sandbox lacks.

## Open — needs the owner's decision

- **[compliance-calendar A-2] Compliance role model.** Dedicated Compliance role vs.
  grant compliance groups to `Manager`/`Admin` + custom role. Assumed the latter (no new
  role seeded); enforcement works via `CalendarSuperGroupRoleVisibility`.
- **[compliance-calendar Stage 3] Calendar capability gating.** `CalendarController` /
  `WatchtowerController` are `[Authorize]`(-roles) only; no dedicated `CAP-*` added.
  Revisit when the capability catalog is next touched.
- **[compliance-calendar A-3] Module-embedded scoped calendar.** Needs a new
  **compliance feature module + nav route** in `forge-ui` to host a `scope:module:compliance`
  calendar — an IA/nav decision (where the compliance module lives), not just code.
- **[deferred, per owner] Stale-doc corrections.** `kickoff-prompt.md` ("NOT an accounting
  system"), `ai-system.md` (RAG-only) still assert the old stances; correct **after current
  efforts complete** (accounting GL + AI tiers are accepted directions). See
  [[inbuilt-accounting-accepted]] (memory).

## Open — needs external infrastructure (not verifiable in this sandbox)

- **[ai-fleet D] AI topology/ML.** Master orchestrator, LoRA/fine-tune tiers, multi-instance
  topology, provider-aware Accounting AI (needs the dark GL enabled), hybrid live-retrieval
  wiring. Design complete; the codeable seams are done (`ClientDocResolver`, `AiHardwareAdvisor`,
  `AiProvenance` stamper). The rest needs the multi-container AI stack + a model-sizing research pass.
- **[watchtower B] Real feed clients + scheduling.** Per-feed-type `IRegulatoryFeedClient`
  impls (Federal Register API, RSS, GovDelivery email, scrape) + a Hangfire recurring poll.
  Network-dependent; the poller/API/seed + an offline-safe mock are done.
- **[regulated-parts C] Remaining wiring.** GS1 expiry→renewal-PO Hangfire job (reuses
  purchasing) + a company barcode-mode setting; the Part fields, `ComplianceService`
  (enforcement + BOM-SDS aggregation) are done. Plus the SDS/genealogy/profile admin UIs.
- **[compliance-calendar] UI polish.** Full status dialog (owner picker, waive reason,
  evidence upload) — the quick Mark-done/Acknowledge actions are shipped.

## Resolved (this session)

- **B Watchtower backend** — entities, source seeder, poller (offline-safe mock seam),
  sources/proposals/apply/dismiss API. Merged.
- **A-8** — applying a proposal creates a system compliance-calendar deadline. Merged.
- **A-4 status-management (core)** — Mark-done + Acknowledge write API + UI actions. Merged.
- **C-1/C-3 enforcement + aggregation** — `ComplianceService` (active-profile union + missing
  fields + on-the-fly BOM-SDS dedupe). Merged.
- **C-4** — GS1 license-as-part Part fields + due-window logic. Merged.
- **D codeable** — D-2 doc-override resolver, hardware-sizing advisor, AI-provenance stamper. Merged.
- **Merge cadence** — all effort branches merged to `main` (verified) once "no intervention" was set.
