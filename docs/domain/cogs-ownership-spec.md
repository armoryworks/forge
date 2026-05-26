# COGS Ownership — Canonical Authority Spec (gates F-030 COGS half, rides BE-2b Wave-1)

**Author:** Domain / Industry Specialist
**Status:** Canonical. Authority boundary for cost-of-goods-sold recognition. Parallel in form to `be-2c-qbo-tax-spec.md`, **opposite in conclusion** — and the reason for the inversion is the core of this ruling.
**Anchors:** `definition-of-correct.md` §A6 (Shipment / COGS), §A9 (QBO seam, item model, valuation ownership), Ruling #1 (invoice decoupled from ship), Ruling #11 (COGS = job-actual-cost at ship). New: **Ruling #12**.
**Orchestrator tracking:** ORCH item **#16 (F-030 COGS-ownership) ≡ Ruling #12** in this doc. The "who posts COGS and when" question for the F-030[COGS] → BE-2b split is answered under *Authority boundary* + *Trigger — recognition at SHIP*.
**Invariant:** COGS is recognized **exactly once**, at ship, at job-actual-cost, by exactly one system.

---

## The model (one sentence)

**For manufactured / custom job output, the APP owns COGS recognition** — it authors the COGS GL entry at ship from the job's actual cost and syncs it to QBO — **because QBO structurally cannot compute a job shop's COGS.** This is the inverse of the tax spec, and the inversion is principled, not arbitrary.

---

## Why COGS ≠ tax (the decisive reasoning)

The tax spec hands authority to QBO because QBO *has the information* tax needs (jurisdiction rules, nexus, rate tables) and the app does not. **COGS is the mirror image: the app has the information and QBO does not.**

A job shop's COGS for a shipped part is the **job's full actual cost = material + labor + burden + outside-processing**, prorated to shipped qty (Ruling #11). QBO's automatic COGS mechanism only fires for **QBO "Inventory"-type items**, and it recognizes COGS at the item's **purchased average cost** — it has **zero visibility into the labor, burden, and OSP value-add** that a job shop layers onto raw material to produce a finished part. So:

- If you let QBO auto-recognize COGS on a manufactured part, it captures (at best) the raw-material cost and **misses all the labor/burden/OSP** — understating COGS and overstating margin, the exact number a job shop runs on.
- QBO literally cannot produce the right figure because the value-add never enters its inventory engine.

Therefore the app must own it. This also resolves §A9's "who owns inventory valuation" for the COGS direction: **the app owns operational cost and authors COGS; QBO records what the app posts.**

---

## Authority boundary

**Rule: an item's COGS is owned by exactly one system, determined by item type. Never both.**

| Item type in QBO | COGS owner | Mechanism |
|---|---|---|
| **Manufactured / custom job output** (the job-shop norm — non-inventory / service items per §A9) | **APP** | App authors COGS GL entry at ship, at job-actual-cost, synced to QBO. QBO does NOT auto-recognize (non-inventory items don't). |
| **True resale / pass-through** (a QBO Inventory item bought and sold with no value-add — rare in a job shop) | **QBO** | QBO auto-recognizes COGS at average cost when the inventory-item invoice posts. App stays OUT. |

The danger zone is **double-recognition**: if a manufactured part were mistakenly set up as a QBO Inventory item, QBO would auto-post COGS *and* the app would post its job-cost COGS → the same goods costed twice. The guard:

> **Manufactured parts MUST be non-inventory / service items in QBO** (already the §A9 item-model call), so QBO never auto-recognizes, and the app's authored COGS is the only entry. Conversely, the app MUST NOT author COGS for any item that is a QBO Inventory item.

---

## What the app MAY / MUST NOT send

**MAY:**
- A **COGS recognition entry at ship** — either a journal entry (`Debit COGS / Credit Inventory-Asset-or-WIP`) or a COGS posting linked to the synced sales transaction — valued at `job_actual_cost × (shipped_qty / job_good_qty)`.
- Manufactured parts as **non-inventory / service items** on the invoice (so QBO posts revenue only, not auto-COGS).

**MUST NOT:**
- Rely on QBO to *compute* manufactured COGS (it can't — no labor/burden/OSP visibility).
- Send manufactured parts as **QBO Inventory items** (would trigger duplicate auto-COGS).
- **Double-post** — app COGS entry *and* QBO auto-COGS for the same goods.
- Recognize COGS at job completion or at invoice — recognition trigger is **ship** (see below).

---

## Trigger — recognition at SHIP

COGS recognizes at **shipment** (transfer of control), atomically with the inventory relief (Ruling #11 / §A6 / INV-SH2), **not** at invoice and **not** at job completion. This matches COGS to the asset leaving the building and aligns with revenue recognition under FOB-origin.

**Matching nuance (flag, not a blocker):** revenue is billed via the job-stage→invoice path (Ruling #1), which may not coincide with ship. At the small-shop bar, ship-triggered COGS with closely-following invoicing is correct and GAAP-acceptable. **If** revenue (invoice) and COGS (ship) routinely land in *different accounting periods*, that becomes a matching refinement to revisit — DEFER, not in F-030 scope. The fix that makes invoice bill shipped-qty (Ruling #1) keeps them close.

---

## Read-back verification (mirrors the tax spec's TxnTaxDetail read-back)

After posting, the app verifies two things against QBO:

1. **Cent-parity:** the COGS amount recorded in QBO's COGS account for the shipment equals the app's computed `job_actual_cost × (shipped/job_good_qty)` to the cent.
2. **No double-recognition:** the invoice's line items are confirmed **non-inventory** in QBO, so QBO did not also auto-post COGS. (This is the COGS analogue of "tax computed once" — here it's "COGS recognized once.")

---

## Definition of Done — COGS correctness (Ruling #12)

1. COGS recognized at **ship**, atomically with inventory relief, **exactly once** (idempotent on retry — INV-SH2).
2. COGS value = `job_actual_cost × (shipped_qty / job_good_qty)`, sourced from `JobCostService` (material + labor + burden + OSP) — **not** from QBO's item cost.
3. Manufactured parts are **non-inventory / service items** in QBO; the app authors the COGS entry; QBO does **not** auto-recognize for them.
4. The app does **not** author COGS for any item that is a QBO Inventory item (those are QBO-owned, the rare resale case).
5. No double-recognition: for any shipment, COGS appears in QBO **once** (app-authored XOR QBO-auto, never both).
6. Read-back: QBO COGS-account entry == app-computed COGS to the cent.
7. Partial shipment recognizes COGS for the shipped portion only (prorated), remainder deferred to its shipment.
8. A real-goods shipment never produces $0 COGS (mirrors the $0-invoice defect class).

---

## What I need from eng-lead before this is wired (flagged per orchestrator)

The **authority ruling above is final and buildable now.** The exact GL wiring needs three facts about how the engine/invoice posting currently works:

1. **Raw-material asset model in QBO:** are raw materials currently QBO Inventory items, or expensed-at-purchase / periodic-JE'd? This determines what the app's COGS entry *credits* (a QBO inventory-asset account vs. an app-tracked WIP/asset account). If raw is already a QBO inventory item, we must avoid QBO managing that asset's COGS independently.
2. **Current invoice-posting path:** does the existing QBO sync post *any* COGS or inventory-asset entries today, or revenue only? (BA found the job-stage path posts $0 documents — need to confirm whether COGS is touched at all.) This tells us if we're adding COGS from scratch (likely) or correcting an existing entry.
3. **QBO account structure:** confirm a COGS account and an inventory-asset (or WIP) account exist and are mapped, so the app's JE has valid targets.

These are wiring details for BE-2b (Wave-1); none change the authority boundary. Flag to eng-lead when BE-2b is scoped.
