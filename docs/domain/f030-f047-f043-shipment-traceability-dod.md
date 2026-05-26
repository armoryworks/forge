# F-030 / F-047 / F-043 — Shipment Relief, COGS, Lot/Serial & SO→Job Linkage: Domain-Correct DoD

**Author:** Domain / Industry Specialist
**Status:** Canonical acceptance contract for wave assignment. Backend builds to this; QA tests against it.
**Anchors:** `definition-of-correct.md` §A3 (Job), §A5 (Inventory), §A6 (Shipment), PART C conservation laws, Ruling #8 (lot/serial commercial must-build). New: **Ruling #11** (shipment relief & COGS).

---

## Critical framing: this is a JOB SHOP, not a distributor

The naive fix — "add a `−Σshipments` term to raw-material on-hand" — is **wrong for this model and will double-relieve.** In a discrete make-to-order job shop the material is already relieved from raw inventory at **issue-to-job** (`MaterialIssue`, which the BA confirms works). Relieving raw material again at ship would count the same consumption twice.

The correct mental model is layered by inventory class:

```
Raw material:   on_hand = Σreceipts − Σissues ± adj          (relieved at ISSUE-to-job — already correct)
WIP / job cost: = Σissues(material) + labor + burden + OSP    (accumulates; REQ-JOB-03 works)
Finished goods: on_hand = Σcompleted − Σshipped ± adj          (IF FG is carried as stock)
COGS:           recognized at SHIP = cost of goods shipped     (THE F-030 GAP)
```

So F-030 is **not** "decrement raw bins at ship." It is: **recognize COGS at ship from the job's actual cost, and relieve finished-goods stock at ship (only if FG is carried), without re-relieving raw material.**

---

## Ruling #11 — Shipment inventory relief & COGS recognition (F-030)

### (a) Recognition timing — at SHIP, not at invoice

COGS and inventory relief occur at **shipment** (transfer of control per FOB terms), **not** at invoice. This is the matching principle (COGS matches revenue at the point control transfers) and the §A6 spine call. It is *correct* that COGS-at-ship is decoupled from invoice-at-job-stage (Ruling #1) — they are different events: ship moves goods + cost; invoice bills. For a small job shop, ship-point recognition is the standard simplification (FOB-origin and FOB-destination differ by delivery date, but ship-point is acceptable at this bar; the FOB nuance is a DEFER refinement).

### (b) Valuation — job-actual-cost is the COGS basis; use what forge has

For a job shop the **cost object is the job, not a finished-goods unit**. COGS at ship = the job's accumulated **actual cost** (material issued + labor + burden + OSP), prorated to shipped quantity:

```
COGS(shipment) = job_actual_cost × (shipped_qty / job_good_qty)
```

- Forge **supports this today**: `JobCostService` sums `MaterialIssue` cost + `TimeEntry` labor/burden + OSP PO lines (REQ-JOB-03 mechanism works). That is the COGS basis to use — no FG unit-cost engine or FIFO/avg layer is needed.
- The underlying raw-material valuation inconsistency (last-purchase-price vs QBO average, GAP-INV-02) is a **separate MAJOR**, not an F-030 blocker. F-030 recognizes *a consistent* COGS from job cost; GAP-INV-02 corrects the material-valuation feeding it later. Per the earlier costing-method ruling: the app owns operational cost, COGS posts to QBO via the synced invoice; valuation method is immaterial to F-030's correctness as long as the job-cost basis is consistent.
- Domain expectation if/when valuation is hardened: **weighted-average** on raw material (matches QBO average cost). Not FIFO, not standard — those add reconciliation drift against QBO.

### (c) Conservation invariants (per inventory class — the anti-double-relief guard)

1. **No re-relief of raw:** raw material relieved at issue is NOT relieved again at ship. The ship relief applies to **finished-goods stock** (if carried) or is a **WIP→COGS** cost relief (if MTO-direct, no FG bin).
2. **Shipped = relieved:** for FG-carried items, `shipped_qty == FG_relieved_qty` — no inventory created or destroyed at ship.
3. **Idempotent relief (§A6 / INV-SH2):** confirming a shipment relieves inventory and recognizes COGS **exactly once**; re-trigger / retry does not double-relieve or double-book COGS.
4. **On-hand completeness:** for any item carried as shippable stock, `on_hand = Σreceipts − Σissues − Σshipments ± adj` — the `−Σshipments` term applies to **FG/shippable items**, not to raw that already relieved at issue.
5. **COGS recognized:** every shipment of goods recognizes COGS > 0 (a $0-COGS shipment of real parts is a defect, mirrors the $0-invoice class).

### (d) Partial / over-ship handling

- Partial ship: relieve and recognize COGS for the **shipped portion only**, prorated; remainder stays on-hand / billable.
- Over-ship guard (§A6): `shipped ≤ ordered − already_shipped + tolerance`; the existing `CreateShipment` guard is correct — keep it.
- COGS proration must use shipped qty, not job/order qty (parallels Ruling #1's billing-basis logic on the cost side).

### F-030 acceptance checks

1. Confirming a shipment recognizes COGS = job_actual_cost × (shipped/job_good_qty), > 0 for real goods.
2. Inventory relief at ship applies to FG/shippable stock only; raw material issued-to-job is **not** re-relieved (no double count).
3. Relief + COGS are **idempotent** — retry/re-confirm does not double-relieve or double-book (INV-SH2).
4. For FG-carried items, on-hand includes the `−Σshipments` term; `shipped_qty == relieved_qty`.
5. Partial shipment relieves/recognizes the shipped portion only; remainder preserved.
6. No shipment of real parts produces $0 COGS.

---

## F-047 — Lot/serial backbone (Ruling #8, unchanged) + the F-030 gating verdict

### Scope recap (Ruling #8)

Lot capture **table-stakes** for all shipped material; serial only for serial-designated parts; minimum linkage `shipment_line → lot → receipt + job`, forward+backward queryable. MVP = 3 `lot_id` FKs + the two queries. Genealogy/cert-forwarding/recall DEFER.

### The gating verdict: F-047 does NOT gate F-030 — but they share the ship-confirm code path

**Correctness-independent:** F-030's quantity relief and COGS recognition do **not require** the lot backbone. COGS comes from job-actual-cost (not lot-cost), and quantity relief decrements stock by qty. So F-030 can be *correct* — relief + COGS — with zero lot tracking. **F-047 is not a hard predecessor.**

**Code-path-adjacent:** both modify the **same ship-confirm transaction**. F-047's core deliverable (stamp the consumed lot on the shipment line) happens at the *exact moment* F-030 introduces the relief. Doing them as two separate touches means opening the atomic relief transaction twice and the second reopens the first's idempotency guarantee.

**The determining factor for one-touch vs sequential (eng-lead to verify in schema):**
- **If forge's `BinContents` is lot-keyed** (on-hand tracked per lot): then F-030's relief must *select which lot* to decrement (FEFO/operator-pick) — that selection is lot logic, so F-030 and F-047 are **coupled and should be one coordinated touch.**
- **If `BinContents` is qty-only** (not lot-keyed): F-030 relieves by quantity with no lot decision; F-047 is **purely additive** (records the lot reference on the shipment line for traceability), fully independent.

**Verdict for the wave call:** treat F-030 as the structural BLOCKER (relief + COGS — the inventory/financial-correctness foundation) and F-047 as the traceability data the relief carries. **Best implemented as one coordinated change to the ship-confirm handler.** If sequenced, **F-030 first, F-047 layered on** (stamp the lot onto the relief F-030 builds). F-047 annotates F-030; it never blocks it. Eng-lead checks the `BinContents` lot-keying to make the final one-touch-vs-sequential call.

---

## F-043 — SO→Job linkage (light touch)

Mostly engineering-wiring, but there **is** a domain dimension on *what data must flow SO→Job*, and it **overlaps F-028's est-cost→Job (F-029)**.

**Data that must flow SO→Job at creation/release (domain-mandatory):**
1. `sales_order_line_id` — which SO line the job fulfills (the dropped FK; non-negotiable — without it job cost never traces to a customer order and quoted-vs-actual margin is uncomputable).
2. `part_id + part_revision` — must match SO line exactly (INV-J1: `job.part_rev == SO_line.part_rev`).
3. `bom_revision_id` — pinned at release (already works per BA).
4. **order qty as a job field** — currently only in Description text (GAP-JOB-03); needs to be structured data (INV-J2: `start_qty ≥ order_qty`).

**Overlap with F-028/F-029:** F-043 establishes the structural link (1–4); F-029 then flows **estimated cost** from quote→job along that link (item 5). **F-043 is a soft predecessor to F-029** — you cannot flow est-cost from the quote to the job if the job doesn't know which SO/quote it came from. So: F-043 builds the linkage (1–4), which *enables* F-029's est-cost population (5). Sequence F-043 before/with F-029. They are not the same fix, but F-043 unblocks F-029.

**No new ruling needed** — this is the existing F-043 linkage call (sales_order_line_id + part_rev + bom_rev mandatory) plus the order-qty-as-field point. Anchor: §A3, INV-J1/J2.

---

## Summary of wave-relevant verdicts

| Fix | Domain call | Gating |
|---|---|---|
| F-030 | COGS at ship from job-actual-cost; relieve FG (not raw — already issued); idempotent; partial-prorated | Foundation BLOCKER |
| F-047 | Lot stamp on shipment line + 3 FKs + queries (Ruling #8) | Does NOT gate F-030; share ship-confirm path → one coordinated touch (or F-030 first) |
| F-043 | SO-line + part_rev + bom_rev + order-qty must flow to Job | Soft predecessor to F-029 (est-cost flow) |
