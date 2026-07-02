---
title: Functional Backlog — 2026-07-02 Planning Session
type: delivery
status: pending
id: functional-backlog-2026-07-02
owner:
updated: 2026-07-02
---

# Functional Backlog — 2026-07-02 planning session

Distilled requirements from a planning conversation. Banter and already-shipped
functionality have been filtered out; this lists only **new** work and
**augmentations** to existing design. Each cluster below is a candidate effort —
scaffold it with `/new-effort <slug>` and `git mv` it to `in-progress/` when work
starts. Nothing here is started.

**Legend:** `NEW` = no design footprint today · `AUGMENT` = extends existing
design/impl (doc cited) · `BUG` = defect against current behaviour.

> Source material (a confidential meeting transcript) is intentionally **not**
> reproduced here — only derived requirements, per `CLAUDE.md` § "Client &
> Meeting Transcripts".

---

## A. Compliance Calendar  *(candidate effort: `compliance-calendar`)*

- [ ] `AUGMENT` Rebuild the calendar around an **Event → Event-Type → Super-Group**
  hierarchy. Admin can define custom event types and super-groups; ship seeded
  default compliance buckets. Today's calendar is read-only jobs + PO deliveries
  with a fixed 4-value event-type enum (`functional-reference/calendar.md`,
  `functional-reference/events.md`).
- [ ] `AUGMENT` Seed regulatory events: fire-marshal annual, OSHA inspections,
  I-9, quarterly estimated tax, BOI. Only I-9 exists today, as compliance
  *status* not a calendar event (`functional-reference/compliance.md`).
- [ ] `AUGMENT` **Forced-acknowledgement** alerts — blocking, must-ack, eventually
  audible. Extends the existing bell/severity/Alerts-tab/sound model
  (`functional-reference/notifications.md`); the blocking modal is the new part.
- [ ] `NEW` **Multiple calendars + a master consolidating calendar**, role-based
  visibility (e.g. floor workers don't see compliance).
- [ ] `NEW` **Sync out to Google/Apple** calendars so users get phone push when
  away from Forge. Only a MailKit `.ics` email-attach library note exists today
  (`libraries.md`).
- [ ] `NEW` **Compliance timeline view** — lives *in the compliance module, not
  reporting*. Color-coded by classification (ATF/OSHA/EPA/tax/local); vertical
  connector down to a scalable year axis (1/3/6/12mo/custom); two overflow modes:
  (a) non-scaling **scroll** widget with a date-tick indicator + keyboard /
  horizontal-scroll, or (b) proportional shrink with **mouse-over expand**; up to
  10 Y-stack positions; x-adjustable connector lines to avoid overlap; WCAG;
  per-event-type colors (auto-unique + custom override); full-saturation border +
  theme-dimmed readable fill; click item → open in context.
- [ ] `AUGMENT` Calendar items link to a stored document **or** an external URL
  (see cluster E doc-management).

## B. Regulatory Watchtower  *(candidate effort: `regulatory-watchtower`)*

- [ ] `NEW` Industry-filtered monitor of external regulatory sources; alerts to
  upcoming regulations before they take effect. Runs on an internet-connected
  box — **cannot** be air-gapped (contrast cluster E). Nearest existing concept
  is compliance-form auto-sync of known gov PDFs, which is not horizon-scanning.

## C. Compliance / Traceability / Parts  *(candidate effort: `regulated-parts-safety`)*

- [ ] `NEW` **GS1 barcode integration** — model the barcode registry as a
  *vendor* and the barcode license as a *part*, so renewal flows through normal
  purchasing/accounting; expiry-driven auto-reorder (min qty 1, ~1-yr burndown,
  pay shortly before expiry). Generic auto-reorder fields exist
  (`kickoff-prompt.md`); the expiry→reorder wiring is new. (Context: basic
  barcoding is free; GS1-registered barcodes are required for Amazon FBA.)
- [ ] `AUGMENT` Make **lot traceability mandatory** per selected regulated
  industry (today it is optional / "half built") and extend to **component
  genealogy** (today lot→part only — `industry-comparison.md`, `CAP-QC-RECALL`).
- [ ] `AUGMENT` **Per-business-type mandatory validation fields** injected at named
  process steps; multi-select (firearms/ATF + food/FDA + medical); "general/none"
  excludes the mandatory others. Building blocks exist (industry selection →
  capability gating, traceability profiles marking fields required —
  `narrative-thread-mapper-design.md`, `CAP-MD-PART-COMPLIANCE`).
- [ ] `NEW` **"Safety" tab on parts AND assemblies** for SDS documents;
  assemblies **auto-aggregate the unique/deduped SDS set** from BOM materials;
  account for manufacturing-SDS vs consumer-SDS. SDS storage was deferred
  (`CAP-INV-HAZMAT`); the aggregation/dedupe is entirely new.

## D. AI Architecture  *(candidate effort: `ai-fleet-orchestration`)*

- [ ] `AUGMENT` **Multi-instance topology** — ~5 scaling toward ~a dozen models,
  each in its own Docker container on its own dedicated low-cost box; ~1GB
  per-model training cap. Docs today describe a single `forge-ai` container
  (`ai-system.md`, `libraries.md`).
- [ ] `NEW` **Master orchestrator AI** trained only on brief sub-agent
  descriptions; delegates to and coordinates specialized agents.
- [ ] `NEW` **Scheduled self-retraining on DB changes** (parts, orders, customers,
  costing). ⚠️ See "Decisions" — docs currently disclaim LLM fine-tuning
  (RAG-only).
- [ ] `AUGMENT` **Infra-awareness** — warn when too many AI capabilities are
  enabled for the host; recommend offloading each to a mini-PC / Raspberry Pi;
  store models redundantly across boxes for failover. Extends the hardware-sizing
  table in `libraries.md`.
- [ ] `AUGMENT` **Default training directory** of shipped `.md` files —
  per-manufacturing-type compliance-suggestion docs + full
  module/screen/field/nav/data-mapping docs. Extends existing RAG-over-`/app/docs`.
- [ ] `NEW` **AI-provenance icon** on every AI-generated artifact (POs, SOs,
  customer notes, chat alerts) so humans apply extra scrutiny.
- [ ] New agents not yet in docs (each a sub-item; some overlap existing designs):
  - [ ] `NEW` Accounting AI for a double-entry immutable ledger — ⚠️ see "Decisions".
  - [ ] `AUGMENT` In-app assistant that automates minutiae + drives pub/sub
    (extends the Q&A assistant, `ai.md`).
  - [ ] `NEW` Chat-participant AI — records + suggests context in group chats,
    handles alerts/emails/lead+customer contact.
  - [ ] `AUGMENT` Production BOM/routing similar-or-version suggester (reserved
    "Similar parts" slot only today, `part-ux-review-2026-05-04.md`).
  - [ ] `NEW` R&D validation AI.
  - [ ] `NEW` Loose "missing-but-expected field" validation AI.
  - [ ] `NEW` Shipping/receiving automation AI.
  - [ ] `AUGMENT` General multimodal/vision analysis (today scoped to PDF
    form-definition verification only).
  - [ ] `AUGMENT` Shop-floor **scan-to-job** AI — auto BOM inventory subtraction +
    move to production/shadow location (extends the manual `ScanActionOverlay`).
  - [ ] `NEW` Cost/billing estimation AI from vendor/customer history (today a
    deterministic engine, `estimating-engine-contract.md`).
  - [ ] `NEW` Employee-management AI.
  - [ ] `AUGMENT` Coordinator AI across VOIP + email + customer contact (a
    `CAP-EXT-VOIP-SYNC` capability exists; the AI coordination is new).
  - Already designed/built, **not** TODO: NL smart search + nav suggestions,
    token-streaming help, QC anomaly detection, predictive maintenance, PDF/
    compliance-form extraction + verifier.

## E. Infrastructure / Security  *(candidate effort: `airgap-skiff-mode`)*

- [ ] `NEW` **Air-gap / "SKIFF" mode** — run isolated on the LAN as a "private
  box": LAN-reachable, WAN-blocked via DNS reroute + firewall + specific ports;
  security lives in infra, not app code. On-prem LAN hosting exists; the isolated
  mode does not (`proposal.md`, `roles-auth.md`).
- [ ] `NEW` **Narrow "critical tunnel"** so an air-gapped box syncs only select
  external services (shipping carrier, email) while isolating everything else.
- [ ] `NEW` **Encrypted USB transfer** for updating air-gapped installs —
  transparent internal keys, auto-decrypt on the destination Forge box,
  unreadable elsewhere. Not built.
- [ ] `AUGMENT` **VPN / tunnel** for offsite warehouse / shop-floor-on-phones
  (works as long as it reaches the LAN). Mentioned in passing today
  (`roles-auth.md`, `proposal.md`); needs a real design.
- [ ] `AUGMENT` **Document/content-management linkage** — the file bucket +
  entity association exists (`functional-reference/file-storage.md`); this adds
  compliance-calendar items linking to a stored legal doc OR external URL, and
  optional Google Drive sync (BE-partial today).

## F. Bugs

- [ ] `BUG` **Breadcrumb middle segment not interactive** — clicking a
  mid-breadcrumb crumb (e.g. "Operations") does not navigate. Likely broken
  everywhere the middle piece isn't a link; current design only specs a two-level
  breadcrumb (`functional-reference/app-shell.md`), so this is a bug **and** a
  design gap.

---

## Decisions to make before building

1. **"Replace QuickBooks" / double-entry-ledger AI contradicts current scope.**
   `kickoff-prompt.md` states *"This is NOT an accounting system — QuickBooks
   Online handles that,"* and `CAP-ACCT-FULLGL` is an aspirational, never-enabled
   placeholder. The accounting-AI / immutable-ledger ambition is a **strategic
   pivot**, not an increment — decide explicitly before any work; respect the
   dependency-direction rule in `delivery/in-progress/inventory-override/design.md`.
2. **AI self-training vs RAG-only.** `ai-system.md` currently disclaims LLM
   fine-tuning (RAG + prompt engineering are "the only levers"). Scheduled model
   self-training (cluster D) is a direction change — confirm before building.
3. **I-9 timing.** Requirement should follow the real USCIS rule — Section 2 by
   the employee's first day of work + 3 business days (as `compliance.md` already
   encodes). Do not use the "36 hours" figure from the discussion.

## How to pick this up

Each `## ` cluster above is a candidate effort. When starting one:
`/new-effort <candidate-slug>`, move the relevant checklist here into that
effort's spec, and update this backlog's items to link the new effort.
