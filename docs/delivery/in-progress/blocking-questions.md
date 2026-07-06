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
  wiring. Design complete; the codeable seams are done and now WIRED: `ClientDocResolver` feeds
  the doc-index job (per-client `.md` override), `AiHardwareAdvisor` is exposed at
  `POST /api/v1/ai/hardware-advice`. The rest needs the multi-container AI stack + a model-sizing research pass.
- **[ai-fleet D] AI-provenance surfacing.** The `AiProvenance` stamper is wired to nothing yet —
  no create-path stamps AI-generated POs/SOs/notes, and there's no UI badge. Deferred: it touches
  many transactional handlers + entity views (broad surface); do as its own effort.
- **[ai-fleet D] Embedding ANN index.** `document_embeddings.embedding` has no ivfflat/hnsw index —
  similarity search is an exact full scan (fine at current scale). Adding it is a forge-db schema
  change; deferred to avoid colliding with the concurrent compliance/role schema work.
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
- **D cracks wired** — `ClientDocResolver` now feeds the doc-index job (`ClientDocsPath` setting);
  `AiHardwareAdvisor` exposed at `POST /ai/hardware-advice`; RAG now indexes text-attachment bodies
  (not just filenames); removed the dead `SmartSearchAsync` no-op (+ orphaned `AiSearchResult`);
  corrected `ai-system.md` model name to `gemma3:4b`. Build clean, 1803 tests green. Merged.
- **Merge cadence** — all effort branches merged to `main` (verified) once "no intervention" was set.

## Autonomous session (2026-07-05) — §5A GL Workspace + Accounting-AI (backend + data layer)

> **NOT committed/pushed** — per the overnight safety stance (no Docker/infra ops, no push to main while unattended, because snap-Docker teardown is broken and the stack can't be safely recovered if it goes down). All changes are **staged in the `forge-api` + `forge-ui` working trees** for review.

**Landed (built + tested locally):**
- **§5A ledger register endpoint** — `GET /api/v1/accounting/ledger` (`forge.api/Features/Accounting/GetLedgerRegister.cs`): newest-first, offset-paginated, filter by date/status/account; per-line account labels + drill-back refs (`reversalOfEntryId`/`reversedByEntryId`/`source`+`sourceType`/`sourceId`). Gated `CAP-ACCT-FULLGL`. Read-only (no `IPostingEngine`). **This is the missing prerequisite for the ledger-view UI** — no list endpoint existed before (only `journal-entries/pending` + `exports/gl-detail.csv`). 5 InMemory tests green.
- **Accounting-AI advisory endpoint** — `GET /api/v1/accounting/journal-entries/{id}/explain` (`ExplainJournalEntry.cs`): read-only; narrates a JE via `IAiService`, degrades to a deterministic summary when the assistant is offline. Embodies the **advises-never-posts** guardrail (no `IPostingEngine` dependency). 3 tests green (Moq `IAiService`).
- **forge-ui data layer** — `GeneralLedgerService.getLedgerRegister()` + `explainJournalEntry()` + TS models (`LedgerRegisterPage/Entry/Line`, `LedgerRegisterFilter`, `JournalEntryExplanation`, `JournalEntryStatus`/`JournalSource`). eslint clean, 3 new GL-service specs green.
- **Verification:** `dotnet build -c Release -warnaserror` green (forge.api + forge.tests); 8 new .NET tests green; forge-ui eslint clean + 8 GL-service specs green. **No i18n keys added** (lint:i18n unaffected).
- Reconciled the stale `forge-api/CLAUDE.md` ⚡ Accounting Boundary (GL is real/dark, not "never-in-app"; `CAP-ACCT-FULLGL` is a real toggle, not a placeholder).

**Blocked / deferred (couldn't safely do unattended):**
- **[block: visual-verify / Docker] §5A Angular components** — `LedgerViewComponent` (virtualized register + find-in-context), `LedgerWorkspaceComponent` split-pane + `JournalEntryEditorComponent`, the AI-explanation panel, and the two-track training feature. Buildable, but the project's non-negotiable visual verification needs a UI-container rebuild, unavailable while snap-Docker teardown is broken (AppArmor re-enforced) and unsafe to fix unattended. This is the bulk of §5A.6 items 1–9.
- **[needs owner judgment] Reverse-entry endpoint** — §5A's "Reverse / correct" action needs `POST journal-entries/{id}/reverse` through the posting engine's reversal + the §5.7 `REVERSE_JE` maker-checker path. It's a posting-path mutation with SoD/governance semantics — deferred from an unattended run.
- **[design] Second AI advisory (anomaly flagging)** — a read-only "flag unusual entries" advisory is a clean follow-on to explain, but "what's anomalous" is a design choice; deferred.
- **[per BACKLOG] Remediation RED items** — the remaining `Skip="RED"` findings are explicitly deferred for design decisions or complex multi-entity seeding (AUDIT-21-S1, PRI-1/2/3, P06-3/S-MV1, MRP-03, BE-3/E-1, F-26B-01/03, AUDIT-S6, G-39-EMAIL-1). Not picked up unattended.

**Assumptions (reasonable defaults — flag if wrong):**
- Ledger register uses a NEW richer result model (`LedgerRegisterEntry/Line`) rather than reusing `ManualJournalEntryResult`, because the register/drill-back UI needs `source` + reversal refs + per-line account labels the manual result lacks.
- The explain endpoint is gated on `CAP-ACCT-FULLGL` only (query-record attribute); AI availability is a runtime graceful-degrade, not a second `CAP-EXT-AI-ASSISTANT` attribute (multiple-`[RequiresCapability]` semantics were unverified). Confirm whether explain should also hard-require `CAP-EXT-AI-ASSISTANT`.
