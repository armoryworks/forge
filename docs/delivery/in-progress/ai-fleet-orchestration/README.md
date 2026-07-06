---
title: AI Fleet Orchestration + per-client customization
type: delivery
status: in-progress
id: ai-fleet-orchestration
owner:
updated: 2026-07-04
---

# AI Fleet Orchestration + per-client customization

> **Status: DESIGN LOCKED; D‑2 + advisor seams now WIRED (2026-07-03); rest infra/AI-deferred.**
> Implemented + verified on main: `ClientDocResolver` (D‑2 Tier‑0 per-client `.md` override
> merge, client-wins) is now **wired into the doc-index job** via the `ClientDocsPath` setting;
> `AiHardwareAdvisor` is now **exposed** at `POST /api/v1/ai/hardware-advice`. RAG quality: the
> indexer now pulls **text-attachment bodies** (not just filenames); the dead `SmartSearchAsync`
> no-op was removed. **Deferred (infra/AI-heavy — need the multi-container AI stack + a
> research pass, logged in `blocking-questions.md`):** multi-instance topology, master
> orchestrator, LoRA/fine-tune tiers, hardware sizing matrix numbers, AI-provenance icon
> surfacing (stamper unwired), embedding ANN index, hybrid DB freshness wiring, and the
> provider-aware Accounting AI. Design below is complete.
> Derived
> from the 2026-07-02 planning session, cluster D of
> `delivery/pending/functional-backlog-2026-07-02`. Extends the existing single
> `forge-ai` RAG stack toward a multi-instance fleet with per-client, hardware-gated
> customization. The "Accounting AI" piece rides the **existing native GL** (see
> [Reconciliation](#reconciliation-with-existing-code)), not a new build.

## Goal

Evolve Forge's AI from one `forge-ai` container into a **fleet** of specialized,
orchestrated agents, each customizable per client, with the **depth of
customization chosen by the client's hardware/budget** rather than fixed. RAG stays
the floor; heavier "training" is an opt-in upgrade tier.

---

## Reconciliation with existing code

**What exists today (extend, don't rebuild):**
- **RAG stack** — `AiController`, `DocumentEmbedding`, Ollama, Hangfire indexing,
  smart search, document Q&A (`ai-system.md`). Single `forge-ai` container.
- **Configurable assistants** — `AiAssistantsController`, `AiAssistant` entity,
  domain assistants (HR/Procurement/Sales) with an admin panel.
- **Native Accounting Suite** — full double-entry GL (`GlAccount`, `JournalEntry/
  Line`, `Book`, `FiscalPeriod`, AP/AR, bank rec, fixed assets, payroll), reached
  via `IPostingEngine`; selectable as the `forge-native` provider in
  `IAccountingProviderFactory`, **dark behind `CAP-ACCT-FULLGL`**. External
  providers (QBO/Xero/etc.) resolve through the same factory.

**Implications:** D‑2/D‑3 extend the RAG + Hangfire indexing already in place. The
Accounting AI is a **provider-aware layer over the existing factory/posting seams** —
no ledger is built here. The multi-instance topology extends the single-container
model in `ai-system.md`/`libraries.md`.

---

## Locked decisions

| # | Topic | Decision |
|---|-------|----------|
| **D‑crux** | Customization depth | **Configurable tier, hardware/budget-gated, chosen in the onboarding workflow** (see [tiers](#customization-tiers)). |
| **Pivot #2** | RAG vs self-training | **RAG is the mandatory floor; self-training (LoRA/fine-tune) is an opt-in higher tier.** `ai-system.md`'s "RAG-only, fine-tuning disclaimed" stance is superseded by "RAG by default; fine-tuning optional." |
| **Pivot #1** | Accounting AI | **No new decision** — native GL already exists (dark). Accounting AI is **provider-aware**: assists external providers; operates within the native GL when `forge-native` is active. |
| **D‑2** | Per-client scaffold | Onboarding-time pipeline builds a client-unique scaffold from shipped baseline `.md` + a **client override layer** (same-named/targeted file shadows baseline; client wins) + injected DB context. |
| **D‑3** | DB freshness | **Hybrid** — embed stable/semantic content (incremental Hangfire reindex on row change); **live-retrieve volatile facts** (stock, status, price, cost) at answer-time via mapped queries/tool-calls. |

### Customization tiers
Selected in onboarding by budget/hardware; the [hardware matrix](#dcross--hardware-recommendation-schemes) is the same model run in reverse.

| Tier | Hardware | Customization |
|------|----------|---------------|
| **0 — floor** | shoebox / Pi | RAG scaffold only (index + persona + injectable `.md`); volatile data via live retrieval. Always available. |
| **1 — mid** | mid box | RAG scaffold **+ per-client LoRA adapters** over a shared base; scheduled adapter refresh. |
| **2 — heavy** | heavyweight | RAG + LoRA + optional fuller fine-tune / larger base models / more concurrent agents. |

---

## D‑2 — Per-client knowledge scaffold

- **Layered docs:** shipped baseline `.md` (per manufacturing type — compliance
  suggestions, module/screen/field/nav/data-mapping) + a writable **client override
  dir**. Index = merge(base, client), client precedence. "Overwrite to modify" =
  drop a same-named file in the client dir. Extends RAG-over-`/app/docs`.
- **Onboarding workflow:** ingest client docs + DB context → build the client's
  index/persona (Tier 0), optionally train adapters (Tier 1+).

## D‑3 — DB reconsumption + freshness
- **Targeted extractors** map DB entities → retrievable context per domain (parts,
  orders, customers, costing).
- **Embed** stable/semantic content, reindexed incrementally on change (existing
  Hangfire job). **Live-retrieve** volatile facts via mapped queries/tool-calls.
- **Open line-drawing:** which facts are "semantic" vs "volatile" (e.g. is BOM cost
  embedded or live?). To settle in the spec detail.

## D‑cross — Hardware recommendation schemes
- A **sizing matrix + in-app advisor** (the backlog "infra-awareness" item) across
  topologies: **1 AI/box**, **N AI/box (combinations)**, **all-on-one** — keyed on
  each capability's customization tier (scaffold vs LoRA adapter vs full model are
  very different footprints) and the ~1GB/model budget goal.
- Advisor warns when enabled capabilities exceed the host budget; recommends
  offloading to a mini-PC/Pi; supports redundant model storage for failover.
- ⚠️ **Needs a research pass** for current local-model sizing (Ollama models,
  quantization tiers) before publishing numbers — do not fabricate.

## Additive core (from backlog, no pivots)
- Multi-instance topology (~5 → ~dozen models, own container/box each).
- **Master orchestrator AI** trained only on brief sub-agent descriptions; delegates.
- **AI-provenance icon** on every AI-generated artifact (POs/SOs/notes/alerts).
- **Default training directory** of shipped `.md` (feeds D‑2).
- Provider-aware **Accounting AI** + the rest of the agent roster (see cluster D of
  the backlog; some already designed/built — NL search, QC anomaly, predictive
  maintenance, PDF/compliance-form extraction).

---

## Staged plan (proposed)
1. Per-client scaffold + `.md` override layer (Tier 0) on the existing RAG stack.
2. Hybrid freshness: extractors + live-retrieval tool-calls; wire to Hangfire reindex.
3. Multi-instance topology + master orchestrator.
4. Hardware sizing matrix + in-app advisor (after research pass).
5. Provenance icons; provider-aware Accounting AI over the factory/posting seams.
6. Tier 1 (LoRA) pipeline for heavy-hardware clients.

## Open questions
- D‑3 semantic-vs-volatile line per domain.
- Orchestrator model + delegation protocol.
- LoRA training rig + retrain cadence (Tier 1+); who runs it (client box vs central).
- Hardware sizing numbers (research pass).

## Cross-links
- Backlog cluster D — `delivery/pending/functional-backlog-2026-07-02`.
- Existing: `ai-system.md`, `libraries.md`, `ACCOUNTING_SUITE_PLAN` + `PHASE*_STATUS.md`.
- Related efforts: `compliance-calendar` (A‑5 seed/AI), `forge-deploy/docs/airgap-bundle.md`.

---

## Wrap-up notes (2026-07-04) — accomplishable-AI pass

Triaged the deferred list into "buildable now" vs "hardware/research-blocked", then executed the buildable slice.

- **ANN index (embedding search) — SHIPPED.** `forge-db/schema/indexes/ix_document_embeddings_embedding_hnsw.sql`:
  HNSW over `document_embeddings.embedding` with `vector_cosine_ops` (matches `EmbeddingRepository.CosineDistance`;
  the pg17 image supports HNSW). To land: regenerate the embedded schema
  (`forge-db assemble --repo <forge-db> --out forge.data/Schema/forge-schema.sql`), then `plan`/`apply` on existing
  dev DBs (fresh DBs get it at boot). HNSW is approximate NN — tune `hnsw.ef_search` for recall. No forge-api change.
- **AI-provenance surfacing — DEFERRED (decision 2026-07-04).** Verified `StampAsync` is never called and **nothing
  persists an AI-generated business artifact today** — every AI path (chat/help/search/summarize/RAG/PDF-compare/PO
  price-override) returns ephemeral text; `BulkLeadIntake` is a deterministic CSV pipeline, not AI. The stamper (entity
  + service + DI + tests) stays as forward-scaffolding. Wire provenance into the **first feature that actually persists
  AI output** (an "AI drafts a PO/SO/note" flow) — a 2-line `StampAsync` + a badge — rather than building UI that renders
  on zero rows and can't be visually verified.
- **D-3 hybrid RAG freshness — IMPLEMENTED (forge-api).** Embeds stay stable/semantic (the indexer already embeds only
  text fields); volatile facts are live-retrieved at answer-time via a deterministic mapped-query provider (no tool-call
  loop). New: `ILiveContextProvider` + `LiveContextProvider` (Part on-hand from `BinContent`, `Status`, manual cost;
  extensible switch), `EntityReference` + `LiveContextFact` models; wired into `RagSearchHandler`'s answer context
  ("Current data (live — authoritative…)") + DI in `Program.cs`. Confirmed embed/live split: embed
  descriptions/specs/BOM/profiles; live-retrieve stock/status/price/cost. **Follow-ups:** apply the same
  `liveContext.GetFactsAsync` injection to `AiHelpChat`/`AssistantChat` context builders; add a `PostgresFixture`-backed
  `LiveContextProviderTests`; extend the provider switch (Job stage, Customer open-order rollups) as those gain volatile value.

**Still hardware/research-blocked (unchanged):** multi-instance topology + master orchestrator (needs the multi-container
AI stack), LoRA/fine-tune tiers (training rig), hardware sizing-matrix numbers (advisor endpoint is wired; the numbers need
a local-model-sizing research pass — do not fabricate), Accounting AI over the native GL (waits on the Phase-0 GL engine).
