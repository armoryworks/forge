---
title: Definition of Correct — discrete / job-shop quote-to-cash platform
type: domain
status: stable
id: definition-of-correct
updated: 2026-09-14
---

# Definition of Correct — Discrete / Job-Shop Quote-to-Cash Platform

**Author:** Domain / Industry Specialist
**Status:** v3 — September 2026 refresh. Written in standard vocabulary (see `docs/delivery/in-progress/domain-doc-refresh/vocabulary-audit.md`); folds in order authorization evidence, the native double-entry ledger and standard costing; the four v2 open questions are resolved or restated as assumptions. **Still leads with the quote-to-cash spine.**
**Segment:** small-to-mid **discrete / job shop**, making to customer order, with **quality-regulated ambitions** (FMEA / PPAP / SPC / CAPA depth). The platform is one application — commercial spine, production, inventory, purchasing, quality and people — not an ERP with a bolted-on MES.

> This is the domain model, not an audit. It defines real-world correct behaviour the software must match. BA maps the product to this; QA turns the invariants, conservation laws and edge cases into coverage; "fixed" (engineering) = the invariant holds and the edge case is handled. Where the software would fail a rule below, **the rule stands and the failure is the finding.**

---

## How to read a rule in this document

Three facts about the platform make an unqualified rule untestable. Every rule below therefore carries a **Presumes** line.

1. **Every feature is switchable per install.** A shop may not have leads, authorization evidence, lot control, returns or the native ledger. A rule names the **feature** it presumes (in plain words, e.g. *lot/serial traceability*). When that feature is off, the rule is **not applicable** — it is **not passed**. QA must record the feature state with every result; a green check against a switched-off feature is a vacuous pass and must be reported as *not exercised*. Where the product documentation does not state a default, this document does not guess one: the test plan records the install's actual setting.
2. **Accounting runs in exactly one of two modes.**
   - **Mode X — external book of record.** An external accounting system (QuickBooks Online is the integrated one) owns receivables, revenue, cost of sale, tax liability, cash and inventory asset value. The platform is operations-only and owns quantities, lots, work-order cost and operational records.
   - **Mode N — native ledger.** The platform runs its own double-entry general ledger with sub-ledgers, period close and statements. It is off by default; enabling it requires opening balances.
   - A rule marked **X/N** holds in both. A rule about receivables, revenue, cost of sale, tax or inventory value that does not say which mode it applies to is defective.
3. **Labels are re-mappable, and production statuses are configurable.** One shop's "work order" is another's "job" or "project" (the product's shipped label is *Job*); each shop defines its own work-order types and ordered statuses (the product calls them *track types* and *stages*), and may mark a status *irreversible* (no backward move) or *mandatory* (may not be skipped). This document therefore **never** says "a work order moves from Released to In Process to Complete." It states **what must be true before work may advance** — the preconditions a status change must satisfy regardless of what the shop has named it.

**Independence.** This document is written from standards and trade practice, not from the application. Four rulings in the log were first made in May 2026 against product behaviour reported by discovery work; v3 marks each with a **Provenance** line saying which part is domain doctrine and which part only describes observed behaviour. Nothing else here depends on knowledge of the implementation.

**Companion documents not refreshed in v3.** `cogs-ownership-spec.md`, `be-2c-qbo-tax-spec.md`, `f026-f027-payment-balance-dod.md` and `f030-f047-f043-shipment-traceability-dod.md` are engineering acceptance contracts written against specific build items and implementation artefacts. They are not addenda to this definition, and restating them in pure domain terms would remove the implementation detail they exist to pin down. They keep May vocabulary (*job*, *stage*). **Where they conflict with v3, v3 governs** — notably: the external system values inventory FIFO, not average cost (§A9); cost of sale in Mode N is at standard where standard costing is on (§A11); work-order advancement is by precondition, not stage name (§A3).

**Standard vocabulary used throughout:** *work order* (never "job"; *job-order costing* remains the name of the costing method), *allocation* (not reservation), *order authorization evidence* (the product's *attestation*; not "acceptance", which in ASC 606 means the customer accepting delivered goods and on the shop floor means acceptance inspection), *approval workflow* (the product's *gated sequence*; *hold point* is reserved for a planned inspection stop), *procurement type* (the product's *sourcing*), *item type* (the product's *inventory class*), *production board* (the product's *kanban*), *open work orders* (the product's *backlog*), *feature* for a switchable part of the product (the product calls these *capabilities*; this document does not, because *capability* means process capability, Cp/Cpk).

---

## Resolved assumptions

| Question | Resolved answer | Consequence |
|---|---|---|
| Segment | **Discrete / job shop**, small-to-mid, make-to-order dominant | Estimating + **work-order costing (quoted vs actual margin)** is the heart. Quote math is the #1 trust feature. |
| Book of record | **Either mode, never both.** Mode X was the May assumption; Mode N now exists. | Every financial rule names its mode (§ How to read). Mode switch is a controlled cut-over at a period boundary (§A10). |
| Costing method | **Feature-dependent, both legitimate.** With *standard costing* on: inventory and WIP at standard, variances by cause (§A11). With it off: **actual job-order costing** — work-order cost is actual material, labor, burden and OSP, and the only variance is quoted vs actual. **Mode X:** the external system values inventory at its own method (QuickBooks Online: FIFO — see Q2); the platform measures work-order cost. | Mode X carries two legitimate cost figures; the difference is itemised per item (§A5), never absorbed. |
| Quality posture | Regulated *ambitions* | Deep quality = **differentiator**, *except* lot/serial traceability touching shipped product = **spine**. Regulated delta: `definition-of-correct-regulated-addendum.md`. |
| Shop-floor surface | **Kiosk and mobile data collection**, no machine-data layer | MES expectations about equipment telemetry do **not** apply. Expectations about operator attribution, per-operation reporting, traceability and hold points **do**. Rules are surface-independent: kiosk, mobile and desktop must produce identical records. |

### The four v2 open questions

| # | v2 question | v3 disposition | Consequence |
|---|---|---|---|
| Q1 | Margin or markup convention in pricing | **Resolved as a rule, not a guess.** Neither is assumed. Every pricing percentage carries its convention explicitly; the platform may accept either, must store which, and must display the other beside it. Default for test fixtures: **target margin on price**. | `margin = (price − cost) / price`; `markup = (price − cost) / cost`; 40 % markup = 28.6 % margin. An unlabelled percentage is a defect (§A1). |
| Q2 | Which external-accounting subscription tier is assumed | **Explicit assumption (Mode X only), not a resolution:** the connected company file supports **inventory quantity tracking, purchase orders and class tracking**. Intuit's published plan documentation places these in the Plus and Advanced plans and states that QuickBooks Online values inventory **FIFO**; the v2 statement "average cost" was wrong (average cost is QuickBooks Desktop's method). Neither fact was re-verified against Intuit's current pages during this refresh; plan contents change, so the test plan must record the connected plan's actual features. | If the connected plan lacks inventory tracking, inventory asset value and cost of sale cannot ride on item transactions; they are posted by **periodic journal entry** from platform valuations. The platform must **detect and declare** a missing plan feature at connection time; a silently failing inventory or PO sync is a defect. Because the external value is FIFO and the platform's is standard or actual, per-item differences are expected and itemised (§A5). Irrelevant in Mode N. |
| Q3 | Whether customer-supplied or consigned material occurs | **Explicit assumption: it occurs.** Grounds are trade practice, not this product: contract machining on customer-supplied (free-issue) material and customer-owned tooling is routine in job shops, and ISO 9001:2015 §8.5.3 (mirrored in AS9100D and IATF 16949) requires every certified shop to control "property belonging to customers or external providers" — a clause that would be empty if the case did not arise. Whether a given shop has it is a fact about that shop. | Three distinct ownership cases must never be conflated: **supplier consignment** (vendor-owned stock at the shop; liability arises on consumption), **customer consignment** (shop-owned stock at the customer; revenue on consumption), **customer-supplied material** (customer-owned stock at the shop; never the shop's asset). Rules in §A5; conservation law in Part C. **If a shop has none**, the ownership rules are not exercised and the ownership law reduces to owned = physical. |
| Q4 | Whether sales tax is computed by the platform or the external system | **Resolved by mode.** Mode X: the external system computes (Ruling #2). Mode N: the platform, or a tax engine it calls, computes. **Marketplace orders:** where the marketplace is the facilitator, it collects and remits; the seller computes none. | In every mode exactly one system authors the tax figure for a given invoice. Two computing = double tax or a mismatch between invoice and liability. Invariant *tax-once* (Part C). |

### Assumptions this version adds

- **Construction vertical is out of scope for v3.** The rules assume discrete goods transferred at a point in time. Construction brings revenue recognised over time (ASC 606-10-25-27), retainage and pay applications (AIA G702/G703). **Consequence:** §A6–A7 shipment-bound invoicing rules do not transfer to it unchanged; a construction addendum is required before that vertical is tested.
- **Document numbers are editable until issue, immutable after.** The product allows editing human-readable numbers within a lifecycle window and resolves superseded numbers. That is acceptable only up to issue (§A12). **Consequence:** tests must treat any post-issue renumbering as a defect.
- **The in-application training library carries no correctness obligations.** It is product help. *Training* in the quality sense (operator competence records, ISO 9001 §7.2) is covered in Part D.

---

# PART A — THE SPINE: Definition of Correct (lead)

The market-ready bar lives here:
`Quote/cost math → Order authorization & sales order → Work order → Shop-floor execution → Inventory → Shipment → Invoice → Payment → Book of record (Mode X seam | Mode N ledger) → Standard costing.`

For each stage: **Presumes** (feature · mode) · **Correct =** real-world behaviour · **Won't tolerate wrong** (day-one table-stakes) · **Invariants** (assertable by QA) · **Edge cases** that bite here.

### A1. Quote / cost math — *the product's trust anchor*
**Presumes:** feature *quoting* (and *estimating* for the budgetary form) · mode X/N.

**Correct:** Build price from the routing + material + outside processing, then apply margin or markup.
- Per-operation cost: `setup_hrs + run_time_per_pc × qty`, each operation at its work center's **labor and/or machine-burden rate**. In Mode N with standard costing on, the rates are the **current frozen standards** (§A11).
- Material: stock selection, quantity needed **including drop/cutoff/scrap factor** (you buy more than the net part), priced per UOM with conversion.
- Outside processing (heat-treat/plate/grind): per-piece or per-lot, honouring **vendor minimum charges**.
- Overhead/burden applied by a defined method (machine-hour rate, labor-burden %, or shop rate).
- Margin or markup → price; **quantity breaks** (setup amortised over qty); minimum lot charge; optional NRE/tooling; **expiration** date.
- **Estimate vs quote are two forms of one commercial document.** A *budgetary estimate* is early, non-binding and need not be itemised; a *quote* is binding, line-itemised and priced. Conversion runs **one way** (estimate → quote) and is traceable. Do not collapse them. In Mode X, note the external system's *Estimate* document is a **quote** in this vocabulary.
- **Customer-supplied material** is excluded from material cost and price (no margin on material the shop does not buy), but handling and scrap-risk may be priced.

**Won't tolerate wrong:** the priced unit at each qty break; **setup-vs-run separation**; **margin vs markup** discipline (every percentage labelled); material scrap factor & UOM; rounding. A shop owner catches a quote off by a few percent and loses trust immediately.

**Invariants:**
- Recompute is **deterministic & stable** (same inputs → identical total; no drift from rate lookups or rounding order).
- A quote records the **rate and cost basis it was priced on**; a later change to rates marks the quote stale for re-pricing but **does not silently change** a sent quote.
- **Qty-break monotonicity:** unit price non-increasing as qty rises, unless the quote itemises a **cost step** between the two breaks — a cost that exists at the higher quantity and not the lower (an additional setup, a second material lot or bar size, a vendor price that rises with quantity, an added outside-processing minimum). An unitemised increase is a defect.
- `total = Σ lines`; `line = unit × qty + adders`; NRE/tooling counted **once**.
- `margin = (price−cost)/price` and `markup = (price−cost)/cost` are never interchanged; a percentage without a stated convention is refused.
- Estimate → quote link is one-way; a quote never converts back to an estimate.

**Edge cases:** revision-specific quotes; expired quote cannot convert to an order without re-pricing; material-price volatility vs validity window; rounding precision carried forward; estimate never itemised then converted; stale quote after a standard-cost roll.

### A2. Order authorization and sales order
**Presumes:** feature *sales orders* · for authorization evidence, feature *order authorization evidence* (and whether evidence is **required before release** is an install setting — record it) · mode X/N.

**Correct:** Accepted quote → sales order. **Price locked** from the accepted quote, customer PO number captured, promised ship date, multi-line, partial-ship allowance. The seller issues an **order acknowledgment** (seller → buyer); the buyer's authorisation is captured as **order authorization evidence** (buyer → seller). These are different artefacts and flow in opposite directions.

**Order authorization evidence** — why it matters: a contract exists for revenue purposes only when the parties have approved it (ASC 606-10-25-1(a)); a job shop that cuts metal on an unapproved order owns the scrap and the dispute. Evidence may arrive by **customer purchase order, written/email acceptance, portal acceptance, e-signature, or recorded verbal order**.
- The **channel** is recorded; the **evidence artefact is retained** and a **content hash taken at capture**, so later tampering is detectable.
- Evidence binds to **the order content it accepted** (lines, quantities, prices, dates as they stood). Accepting version 1 does not accept version 2.
- **Revocation is an appended fact**, not an erasure: the original evidence, who revoked, when and why all remain.
- A **verbal order** is evidence of intent, not a signed writing; for goods of $500 or more the UCC statute of frauds (§2-201(1)) makes it unenforceable on its own. Between merchants, a written confirmation sent by the seller and not objected to within ten days satisfies the statute (§2-201(2)). **Rule:** a recorded verbal order suffices for release **once the seller's written order acknowledgment has been sent to the customer**; the platform shows the ten-day objection window, and an objection received inside it revokes the evidence.
- When the customer's PO carries terms that differ from the quote, the difference is a **battle of the forms** (UCC §2-207). Correct behaviour is to surface it, not to pick one silently.

**Won't tolerate wrong:** price **locked from the accepted quote** (never silently recalculated at current rates); part **+ revision** and qty exactly as ordered; no silent change to a confirmed order; **work never released against an order whose required evidence is absent or revoked**.

**Invariants:**
- `order_line.price == accepted_quote.price` for that qty, unless an explicit change order.
- Ordered qty, price and date immutable except via **change order with audit trail + re-acknowledgment**; a change that **increases** the customer's obligation (qty, price, earlier date) invalidates prior authorization evidence for the changed lines until re-accepted.
- Order references a valid part + revision.
- Acceptance evidence is **append-only**: `hash(stored artefact) == hash recorded at capture`; revocation never deletes or alters the original.
- If evidence is required: `release(work order for line) ⇒ ∃ unrevoked evidence covering the line's current version`.

**Edge cases:** change orders with audit + re-ack; partial cancellation; discrete vs blanket/release orders (blanket = flag, not spine); evidence revoked **after** material issued (work stops at the next precondition; costs incurred stand and are the customer dispute's evidence); evidence by email whose attachment later changes; verbal order later contradicted; customer PO number duplicated across two orders; authorization evidence switched off mid-order (existing evidence retained).

**Marketplace and retail orders** (feature *retail / marketplace orders*): the counterparty splits into partner roles, and which party holds which role depends on the channel.
- **Third-party marketplace selling** (the shop lists on a marketplace): the shop is normally **seller of record**; the consumer is **sold-to, bill-to and ship-to**; the marketplace is the **payer** that collects from the consumer and remits proceeds net of its fees. The cash receivable is from the marketplace; the customer relationship, returns and recall run to the consumer.
- **Wholesale / drop-ship to a retailer** (the retailer buys from the shop and resells): the retailer is **sold-to, bill-to and payer**; the consumer is **ship-to** only.
- The seller is usually **principal** (ASC 606-10-55-36 to -40): revenue at the gross price, marketplace fees as selling expense — agency is an explicit order setting, never a default.
- Tax: under US marketplace-facilitator laws the facilitator collects and remits on facilitated sales; the seller authors none (§A7).

### A3. Work order (routing + BOM + cost baseline)
**Presumes:** feature *work orders* (always present; the label may differ); *routings & work centers* for operation-level rules; *standard costing* for §A11 baselines · mode X/N.

**Correct:** Sales order line → work order(s) (make-to-order), or a planned/stock replenishment → work order (make-to-stock). The work order carries the **routing** (operation sequence, work centers), **BOM** (material + qty), and a **required start qty** (order qty + expected scrap/yield allowance). The cost accumulator opens; the **quote's estimated cost is carried as the quoted-margin baseline** and, in Mode N with standard costing, the **standard cost at release is the variance baseline** (§A11). Maintenance and tooling work orders are work-order *types*, not a different kind of object.

**What must be true before work may advance** (independent of how the shop names its statuses):

| Before… | …this must be true |
|---|---|
| **Release** (first point at which production labor may be reported or material issued) | Part + revision is valid and current (or the use of a superseded revision is explicitly authorised); routing and BOM exist for that revision; if authorization evidence is required, it exists unrevoked (§A2); no blocking hold; for a customer-supplied material BOM line, the material is received or its expected arrival is recorded. |
| **Starting an operation** | The work order is released; prior operations required by the routing have reported enough good quantity to start this one; operator is identified; any inspection **hold point** preceding it is passed, and any approval-workflow step (approval, permit) it requires is complete and unexpired. |
| **Passing any status the shop marks mandatory** | That status has actually been entered — skipping is refused, including by bulk moves and imports. |
| **Moving backward past a status marked irreversible** | Refused. A shipment, invoice or payment already raised is reversed by its own reversal flow (Ruling #3), never by moving the work order back. |
| **Shipping or receipt to stock of finished quantity** | Final-operation good qty covers the quantity; required final inspection / hold points satisfied; lot/serial assigned where the part is lot/serial controlled. |
| **Close** | No negative WIP. Issued material or labor not yet reconciled does **not** block close: close proceeds with a warning, the unreconciled amount goes to closing variance, and any charge arriving after close posts to that variance (Mode N) rather than reopening the work order (Ruling #4). |

A status change that would violate any row is refused **whatever the shop named the statuses**, and whether the change comes from the board, the kiosk, mobile, a bulk action or an automation.

**Pre-release work.** Engineering, CNC programming, fixture design and first-article planning legitimately happen before release. They may be charged to the work order before release **only as non-production cost** (engineering / NRE element), never as production labor against an operation.

**Won't tolerate wrong:** work order tied to the **right part + revision**; required material = BOM × qty + scrap allowance; baseline preserved for variance; no production labor or material issue before release.

**Invariants:** `work_order.part_rev == order_line.part_rev`; `work_order.estimated_cost` traceable to the quote basis; `start_qty ≥ order_qty` when a scrap allowance is applied; a work order's status history shows no skipped mandatory status and no backward move past an irreversible one; `production labor reported or material issued ⇒ work order released at that time`; pre-release charges carry the non-production element.

**Edge cases:** **ECO/revision change after release** (mid-WIP); splitting one order line across work orders or combining lines; parent/child work orders from multi-level BOMs; make-to-stock vs make-to-order; shop re-orders or renames statuses while work orders are open (open work orders must not silently gain or lose preconditions they already satisfied); mandatory status added after work orders passed that point; label remapped mid-life.

### A4. Shop-floor execution
**Presumes:** feature *shop-floor data collection* (kiosk / mobile / desktop — same rules); *time tracking* for labor; **operation-level reporting** for the per-operation rules · mode X/N.

**Correct:** Operators report **time and quantity** — per operation where the shop reports at operation level, per work order where it does not (both are legitimate; work-order-level reporting gives up per-operation balance and labor efficiency by operation): good qty, scrap qty (**reason code**), rework. **Attendance time** (clock in/out of a shift, feeds payroll) and **labor time** (clock on/off an operation, feeds work-order cost) are separate records; the gap between them is indirect labor and is reported, not lost. Labor and machine time accrue to **that work order's** actual cost. Operation completion advances the routing; the final operation produces finished qty.

**Won't tolerate wrong:** per-operation quantity balance; labor cost accrues to the correct work order and operation; cannot complete more good parts than were started minus scrap; every report attributed to an identified operator (badge/scan + PIN or equivalent).

**Invariants:**
- Per operation (operation-level reporting on): `qty_in = qty_good_out + qty_scrapped + qty_at_op`. Work-order level: `completed_good + scrapped ≤ start_qty`.
- Cumulative good qty at final operation ≤ `start_qty − Σ scrap`.
- `work_order_actual_labor = Σ(reported_labor_time × rate)`, drawn only from that work order's reports.
- Per operator per day: `Σ labor time ≤ attendance time` (labor on concurrent operations is split equally across them unless the shop has configured another split; it is never counted in full on each).
- A record made offline on mobile or kiosk carries its **event time**, not its sync time.

**Edge cases:** **scrap mid-routing forcing a re-run** (still enough good parts?); **rework loops** (operation redone, added cost); split lots across machines; partial operation completion; time spanning shifts/operators/midnight; operator forgets to clock off; two operators on one operation; offline reports syncing after the work order closed.

### A5. Inventory (receipt → allocation → issue)
**Presumes:** feature *inventory*; *lot/serial traceability* for lot rules; *consignment* for ownership rules · mode X/N (valuation rules name their mode).

**Correct:** Material received against a PO → **on hand by location and lot/heat**; allocated to a work order → available ↓; issued → on hand ↓, WIP ↑. **UOM conversion** buy → stock → issue. The **lot consumed is recorded** (the traceability link forward to the shipment). Valuation: **Mode N** — at standard, with purchase price variance at receipt (§A11); **Mode X** — quantities in the platform, value in the external system at its method.

**Ownership** (three cases, never conflated):
- **Supplier consignment** — vendor-owned stock at the shop: quantity tracked, **not** on the shop's balance sheet; a payable (and in Mode N an inventory/cost entry) arises **on consumption**.
- **Customer consignment** — shop-owned stock at the customer's site: remains the shop's inventory; revenue and cost of sale arise **when the customer consumes** (ASC 606-10-55-79 to -80).
- **Customer-supplied (free-issue) material** — customer-owned at the shop: quantity and lot tracked, **zero value**, never in inventory valuation, WIP or cost of sale; scrap of it is reported to the customer and may be a liability.

**Won't tolerate wrong:** inventory **quantity accuracy**; **UOM conversion**; **no silent negative** on hand; issued material **costed by the mode's method**; **lot issued is recorded** and ties forward to shipped product; **no valuation of stock the shop does not own**.

**Invariants:**
- `on_hand = Σ receipts − Σ issues − Σ shipments ± adjustments` per item/lot/location; never silently negative.
- `available = on_hand − allocated`; allocation never exceeds on hand; a lot quantity is never allocated twice.
- Every issue records the lot → consumable forward into shipment traceability.
- `inventory value (owned) excludes supplier-consigned and customer-supplied quantities`.
- Mode X: per item, `platform value − external value = Σ (platform unit cost − external FIFO unit cost) × qty` for owned stock, listed item by item; any residual beyond one cent per item is a defect. Mode N: see Part C ledger laws.

**Edge cases:** customer-supplied material scrapped; supplier-consigned stock consumed then returned; lot **split/merge**; backflush vs explicit issue; **material shortage** (partial issue + backorder); scrap returned-to-stock vs written off; UOM rounding (issue 3.0001 ft); cycle-count adjustment on an allocated lot; bin transfer of an allocated lot.

### A6. Shipment
**Presumes:** feature *shipments*; *lot/serial traceability* for trace rules · cost-of-sale and revenue timing: **mode named per invariant**.

**Correct:** Pick finished qty (full or **partial**), packing slip, ship transaction **relieves inventory**; **cost of sale** is recognised when **control transfers** to the customer (ASC 606-10-25-30 — shipping terms such as FOB origin/destination or Incoterms are strong evidence, but control indicators govern); **lot/serial of shipped product recorded** (recall scope); freight captured.
- Mode X: the platform records the physical and traceability facts and supplies the external system what it needs to post cost of sale once.
- Mode N: the shipment posts `Dr cost of sale / Cr finished goods` at standard where standard costing is on, otherwise at actual work-order unit cost, in the period control transfers.

**Won't tolerate wrong:** `shipped_qty ≤ remaining order qty (+ tolerance)`; partial shipments clean; inventory relieved **exactly once**; **lot/serial of shipped product captured** (table-stakes even pre-regulation); cost of sale at the correct cost and in the correct period.

**Invariants:**
- `shipped_qty ≤ ordered − already_shipped + over_ship_tolerance`.
- Each shipment relieves inventory **once** (idempotent under retry and duplicate submission).
- Shipment carries lot/serial linking back to the **consumed material lots**.
- `cost_of_sale = shipped_qty × unit_cost` (unit cost per mode); Mode N: posted in the period of control transfer.
- Customer-supplied material content contributes **zero** to cost of sale.

**Edge cases:** partial ship + backorder; over-ship within tolerance; ship spanning **multiple lots**; short-ship from scrap; drop-ship; **FOB origin vs destination** across a period end; **bill-and-hold** (revenue before shipment only if all ASC 606-10-55-83 criteria are met — otherwise not); shipment on the last day of a closed period (Mode N).

### A7. Invoice
**Presumes:** feature *invoicing*; *sales tax* for tax rules · mode named: tax authorship differs (Q4, Ruling #2).

**Correct:** Invoice from shipment(s) for goods — bill **what shipped**; price from the **locked order**; **freight**; **sales tax** (taxable vs exempt with **resale/manufacturing-exemption certificate**, jurisdiction by ship-to, shipping taxability by state); terms; may consolidate shipments or be partial. Non-goods billing (deposit, NRE, tooling, progress/milestone) is invoiced on its own billing event, not on shipment.
- Mode X: invoice → external system **idempotently**; the external system computes tax (Ruling #2).
- Mode N: invoice posts `Dr receivables / Cr revenue / Cr tax payable` once; the platform (or its tax engine) computes tax once. A **deposit** invoiced before performance is a **contract liability**, not revenue (ASC 606-10-45-2).
- Marketplace-facilitator orders: **no tax** authored by the seller; the facilitator's collection is recorded for reconciliation only.

**Won't tolerate wrong:** `invoiced_qty ≤ shipped_qty` for goods; price = locked order price; **tax correctness** (certificates honoured, right jurisdiction, computed **once**); freight; rounding consistent with the book of record; **no duplicate invoicing** of a shipment; issued invoice number immutable.

**Invariants:** `invoiced_qty ≤ shipped_qty` per goods line; `invoice_line.price == order_line.price`; `invoice_total = Σ lines + freight + tax` (fixed rounding rule); each shipped quantity invoiced **at most once**; exactly one system authored the tax figure.

**Edge cases:** partial / consolidated invoice; **credit memo / RMA**; exemption-certificate expiry between order and invoice; freight billed vs actual & freight taxability; deposit then final invoice netting the deposit; marketplace order with facilitator tax; invoice dated in a closed period (Mode N).

### A8. Payment
**Presumes:** feature *payments* · Mode X: direction of truth for cash receipts must be declared (recorded in the external system and mirrored, **or** recorded in the platform and pushed — never both); Mode N: platform is the book.

**Correct:** Customer payment applied to invoice(s); receivables ↓; partial payments; over/under payment; credit-memo application; an intended overpayment becomes **unapplied customer credit**, never a negative invoice balance.

**Won't tolerate wrong:** payment applied to the **correct invoice(s)**; receivables balance accurate; no over-application; no double recording across systems.

**Invariants:** `receivables = Σ invoices − Σ payments − Σ credits` per customer (payer); applied amount ≤ open invoice balance (excess → explicit unapplied credit); applications sum to the payment amount; each payment recorded in exactly one system of origin.

**Edge cases:** partial payment; one remittance across many invoices; overpayment → credit; short-pay/dispute; marketplace payout net of fees (gross receivable, fee as expense); payment received against a voided invoice; **direction of truth** for cash receipts (Mode X).

### A9. Book of record — Mode X (external accounting seam)
**Presumes:** mode **X**; feature *accounting integration*; tier assumption Q2.

**The boundary (must be explicit):** **the external system owns financial truth** (receivables, revenue, cost of sale, tax liability, cash, inventory **asset value**). **The platform owns operations** (quotes, orders, work orders, shop floor, operational inventory qty/lots/WIP, work-order costing). Each synced object/field has **one owning system and one direction**.

**Correct:**
- **Customers:** one canonical mapping, **no duplicates**; for marketplace orders, the payer is the mapped customer.
- **Items (decided):** custom make-to-order parts sync as **non-inventory items**, one per part number (not a generic "Machining" item, which destroys sales-by-part reporting); non-production services as **service items**; purchased raw material and stocked components as **inventory items** where the plan supports inventory, otherwise non-inventory items with inventory value posted by periodic journal entry (Q2). A part's item type does not change once synced.
- **Invoices:** platform → external, **idempotent**, with correct tax inputs.
- **Payments:** one declared direction (§A8); mirror without duplication.
- **Cost of sale / inventory valuation:** the external system values its inventory items **FIFO**; the platform tracks standard or actual work-order cost. For make-to-order parts synced as non-inventory items, cost of sale is posted by **journal entry from the platform's shipment cost** in the period of shipment; for inventory items, the external system's own FIFO relief governs. One path per item type, never both.
- **Tax:** computed by **exactly one** system — the external system's automated sales tax, from platform-supplied inputs (Ruling #2).
- **Estimate / quote naming:** the external system's *Estimate* is a quote; a budgetary estimate does not sync as a binding document.

**Won't tolerate wrong (these silently corrupt the books):** idempotency (retried sync never double-posts); entity dedup; tax computed once; amount/rounding parity to the cent; **failed sync surfaced & retryable** — never swallowed; out-of-band edits in the external system (void/delete/edit) detected, not blindly re-pushed; dependency order (customer before invoice, item before line).

**Invariants:**
- Each posted platform invoice/payment ↔ **exactly one** external document (stable external id).
- `Σ platform receivables == external receivables` to the cent once the sync queue is empty. While the queue is not empty, the difference equals the sum of the queued and failed documents, listed individually; any unlisted difference is a defect.
- Every external invoice line maps to a known platform item (no orphans).

**Edge cases:** **tier gating** (Q2); rate limits / token expiry / outage → queue + retry; sandbox vs production; tax jurisdiction by ship-to address; user edits/voids an invoice externally after sync; multi-currency (out of scope domestically — flag if it appears).

### A10. Book of record — Mode N (native double-entry ledger)
**Presumes:** mode **N**; feature *native ledger* (off by default); sub-ledgers for receivables, payables, inventory and WIP.

**Correct:** Every operational event with financial effect (receipt, issue, labor report, completion to stock, shipment, invoice, payment, vendor bill, adjustment, variance) is included in **exactly one posted, balanced journal entry**, in the period in which the event occurred. The entry may be per event or **summarised** (e.g. a daily labor or issue summary by work order and account) — standard practice — provided each summarised entry lists the events it contains. Sub-ledgers reconcile to their control accounts. Period close locks posting; corrections are **reversing or adjusting entries**, never edits to posted entries. Statements (trial balance, balance sheet, income statement) are derived from posted entries only.

**Enablement and cut-over:**
- The ledger may not be enabled until **opening balances** are loaded and balance (`Σ debits == Σ credits`), with sub-ledger openings (open receivables, open payables, inventory by item at the opening valuation, open WIP by work order) agreeing to their control accounts.
- Cut-over is at a **period boundary**. From the cut-over date the external system stops receiving postings for the same events; **no event is posted in both books** and none falls between them.

**Won't tolerate wrong:** unbalanced entries; double posting (retry, re-entry to a status, duplicate submission); posting into a closed period; sub-ledger ≠ control account; editing or deleting a posted entry; events that change quantities without the matching value entry.

**Invariants:** see Part C ledger laws; additionally, every posted entry traces to its originating event(s) or is a manual adjustment with preparer and a different approver (segregation of duties).

**Rule for late events:** an event whose date falls in a closed period is **refused** for posting at that date. It may be posted in the first open period — posting date and event date both kept — only by a user holding the period-adjustment permission. Nobody reopens a period as a side effect.

**Edge cases:** event dated in a closed period (per rule above); reopening a period (authorised, logged, re-close re-runs checks); opening balances loaded twice; mode switched mid-period; late vendor bill for a receipt in a closed period (GRNI clears in the open period); year-end close to retained earnings.

### A11. Standard costing and variances
**Presumes:** feature *standard costing* — **optional**; many job shops legitimately run actual job-order costing, and with the feature off this section is not exercised. Mode **N** for posting; in mode **X**, variances are **measured and reported** (and optionally summarised by journal entry) but the external system's valuation governs the books.

**Correct:** Standard cost per item **rolls up** from the BOM (material standards) and the routing (setup and run labor and burden at work-center standard rates) plus outside processing. Standards are **frozen** for a costing period; a new roll takes effect prospectively with a **revaluation** of on-hand inventory (Mode N: `Dr/Cr inventory / Cr/Dr revaluation`). Inventory and WIP carry at standard; actual departures are captured as **variances**, each named by cause:

| Variance | Measured at | Formula |
|---|---|---|
| Purchase price (PPV) | Receipt (or vendor bill, declared once) | `(actual price − standard price) × qty received` |
| Material usage | Issue / work-order close | `(actual qty − standard qty for good output) × standard price` |
| Labor rate | Labor report | `(actual rate − standard rate) × actual hours` |
| Labor efficiency | Operation / work-order close | `(actual hours − standard hours for good output) × standard rate` |
| Overhead (spending, volume) | Period close | Declared method; volume variance uses planned vs actual base |
| Outside processing price | Vendor bill | `(actual − standard) × qty` |
| Scrap / yield | Operation reporting | Standard cost of scrapped quantity beyond allowance |

Inventory write-downs (shrinkage, obsolescence, lower of cost and net realisable value — ASC 330-10-35-1B) are **not** variances.

**Won't tolerate wrong:** price and quantity effects mixed in one variance; variances computed on started rather than **good** output; standards changed mid-period without revaluation; customer-supplied material given a standard material cost; a variance posted twice or never.

**Invariants:**
- Per work order at close: `actual cost = standard cost of good output + Σ variances` (to the cent, with a declared rounding account).
- Per period: `Σ variances posted == Σ variances measured`.
- Standard cost of an item == roll-up of its current BOM and routing at the frozen rates (recompute is deterministic, as §A1).

**Edge cases:** routing changed after release (variance vs the standard at release, not the new one); rework operations not on the standard routing (efficiency variance, not a new standard); partial completion across a period end; zero-standard items; alternate BOM used; standards roll with open work orders in WIP.

### A12. Document numbers
**Presumes:** immutability after issue presumes **nothing** — it holds whatever features are on. Editing before issue presumes feature *editable document numbers*. Mode X/N.

**Correct:** Where the feature is on, human-readable numbers may be edited **until the document is issued** (sent, posted, shipped, received); where it is off they are never edited. After issue the number is **immutable**. Any superseded number is retained and resolves to the same document, and is **never reused** for another. Completeness testing relies on this (PCAOB AS 1105; statutory invoice numbering such as EU VAT Directive 2006/112/EC art. 226(2) for customers who need it).

**Invariants:** `issued ⇒ number frozen`; uniqueness holds across current **and** superseded numbers of the same document type; the number sent to the external system (Mode X) is the issued number.

**Edge cases:** renumber a draft invoice then issue; attempt renumber after issue; two documents claiming a superseded number; external system rejecting a duplicate number.

---

# PART B — Calibration for THIS customer: day-one vs differentiator

**Day-one spine correctness (bugs here are trust-killers):**
- Quote / cost math (§A1) and **work-order costing actual-vs-quoted margin** (the job shop's reason to exist).
- **Order authorization evidence integrity** where the shop requires it (§A2) — releasing work against a revoked or missing order is the most expensive mistake a job shop makes.
- **Work-order advancement preconditions** (§A3) — they hold regardless of the shop's status names.
- Inventory **quantity accuracy + UOM + ownership** (§A5).
- **Lot/serial traceability where it touches shipped product** — consumed lot → shipment → customer (§A5–A6).
- **Tax & shipping on invoices** — exemption certificates, jurisdiction, tax-once in the active mode (§A7).
- **Book-of-record integrity** — Mode X sync idempotent, reconciling, tax-once (§A9); Mode N entries balanced, once, in period, sub-ledgers agree (§A10).
- Order → ship → invoice → payment **quantity/price/money flow** (§A2, A6–A8).

**Differentiators (must work eventually, but a bug here doesn't break trust the way a wrong invoice does):**
- **FMEA, PPAP, SPC, CAPA** depth; FAI/AS9102 (unless selling to aerospace now).
- Finite-capacity scheduling / advanced planning / MRP suggestions.
- Supplier scorecards, supplier quality portals.
- **Variance analytics depth** (§A11 reporting). Note: variance *posting* correctness in Mode N is spine, because it lands on the statements.

**The calibration line to hold:** deep quality features are differentiators, **but the lot/serial data backbone and the inspection hold points beneath them must be correct on day one**. *FMEA/PPAP/SPC/CAPA = differentiator; the traceability records and gates under them = spine.*

---

# PART C — Cross-cutting conservation laws (QA asserts these globally)

Every law carries **[feature · mode]**. With the feature off, the law is *not exercised*. Mode X/N = both.

**Quantity**
- `ordered = shipped + remaining + cancelled` per order line. **[sales orders, shipments · X/N]**
- `invoiced_qty ≤ shipped_qty` per goods line (non-goods billing — deposit, NRE, milestone — excluded by line type, not by exception). **[invoicing, shipments · X/N]**
- `on_hand = Σ receipts − Σ issues − Σ shipments ± adjustments`, per item/location (and lot where lot-controlled); **never silently negative**. **[inventory; lot/serial traceability for the per-lot form · X/N]**
- `available = on_hand − allocated`; no over-allocation; no lot quantity allocated to two work orders. **[inventory · X/N]**
- Per operation: `qty_in = qty_good_out + qty_scrapped + qty_at_op`; at work-order level `completed_good + scrapped ≤ start_qty`. **[shop-floor data collection; operation-level reporting for the per-operation form · X/N]**
- Per operator per day: `Σ labor time ≤ attendance time`. **[time tracking with attendance and labor both recorded · X/N]**
- **Ownership:** `owned + supplier-consigned + customer-supplied on_hand = physical on_hand`; only owned is ever valued. **[inventory; consignment · X/N]**

**Traceability**
- Every shipped lot/serial traces back to consumed material lots; every consumed lot traces forward to its shipments. **[lot/serial traceability · X/N]**

**Money**
- `receivables = Σ invoices − Σ payments − Σ credits` per payer. **[invoicing, payments · X/N]**
- **Tax-once:** exactly one system authored each invoice's tax; marketplace-facilitator orders carry no seller-authored tax. **[sales tax; retail / marketplace orders for the second clause · X/N]**
- Quote total is a deterministic, stable recompute of its lines. **[quoting · X/N]**
- **Mirror:** each posted invoice/payment/PO/vendor bill ↔ exactly one external record; amounts/tax/entity/date match; receivables equal to the cent once the queue is empty (§A9). **[accounting integration · X]**
- **Balance:** every posted entry `Σ debits == Σ credits`; trial balance nets to zero. **[native ledger · N]**
- **Once:** every financial event is included in exactly one posted entry (per-event or summarised); reversals are additional entries, never deletions. **[native ledger · N]**
- **Sub-ledger:** receivables, payables, inventory, WIP and GRNI sub-ledgers each equal their control account. **[native ledger; inventory for inventory/WIP/GRNI · N]**
- **Inventory value:** `GL inventory == Σ (owned on_hand × unit cost)` — standard where standard costing is on, otherwise the configured actual method. **[native ledger, inventory · N]**
- **WIP:** `GL WIP == Σ open work orders (material + labor + burden + OSP charged − relieved)`; each work order nets to zero at close, the remainder in closing variance. **[native ledger, work orders · N]**
- **Standard:** per closed work order `actual = standard of good output + Σ variances`. **[native ledger, standard costing · N; measured-only in X]**
- **Period:** no entry is posted to a closed period except by an authorised adjustment (§A10). **[native ledger · N]**
- **No dual book:** no financial event is posted both externally and natively. **[native ledger or accounting integration · X/N at cut-over]**

**Records**
- Posted entries, issued document numbers and quality records are **append-only**; corrections are new facts referencing the old. **[always · X/N]** Authorization evidence likewise. **[order authorization evidence · X/N]**

---

# PART D — Surrounding modules (fuller model, post-spine)

Calibrated to job shop + either accounting mode + quality ambitions; these support the spine but are **not** the day-one market-ready gate.

- **Identity** (X/N): roles/permissions with **segregation of duties** (who approves a quote, releases work without authorization evidence, posts an invoice, adjusts inventory, overrides price, reopens a period, posts a manual journal), approval thresholds. *Spine-adjacent table-stakes for control integrity.*
- **Master data** (X/N): parts (**+ revision**) with **procurement type** (make / buy / subcontract / phantom), **item type** (raw, component, subassembly, finished good, consumable, tooling) and a shop taxonomy as independent attributes; customers with partner roles; vendors; work centers (+ rates, standards); BOM; routing templates; **UOM + conversions**; tax codes; terms; shop calendars. *Table-stakes (feeds the spine).*
- **Planning** (X/N): MRP/MPS explode BOMs, net against on hand, allocations and open supply, and propose planned orders; a planned order is **firmed** and **released** as a work order or PO. The shop's own period plan (the product's *planning cycle*) is a scheduling convenience and must not be confused with the MRP replanning cycle. Three distinct events: **scheduling** a work order into that period plan (the product's *commit*) — a capacity intention; **firming** a planned order — MRP may no longer change it; **release** — the work order may consume labor and material. None implies another. *Nice-to-have depth; correct netting is table-stakes where MRP is on.*
- **People** (X/N): employees + **labor rates** + attendance and labor time → feeds work-order cost (spine). **Operator competence records** (who is qualified for which operation, with expiry — ISO 9001 §7.2) gate special-process sign-off when the regulated addendum is active. Pay statements and leave are HR records, not costing inputs.
- **Procurement** (X/N): PO → receive → three-way match; **outside-processing POs** that track parts offsite & back; subcontracting distinct from outside processing; partial receipts + tolerance; supplier consignment. Mode N: receipt posts `Dr inventory (at standard) / Cr GRNI` with PPV; vendor bill clears GRNI. *Material side of the spine = table-stakes; RFQ/scorecards = nice-to-have.*
- **Quality** (X/N): certificate of conformance + mill test report attachment & forwarding + **lot/serial trace = table-stakes where it touches shipped product**; inspection plans with inspection **hold points**; inspection hold points, commercial approvals and permits with expiry are all configured through one general **approval workflow** — a rule "inspection must pass before X" is a rule about that workflow step, and holds wherever it is configured; NCR with **disposition** (use-as-is, rework, scrap, return to vendor) belongs to nonconforming material only; FMEA/PPAP/SPC/CAPA/FAI = **differentiators**.
- **Maintenance** (X/N): PM/downtime affects capacity; gage calibration ties to quality; **customer-owned tooling** is tracked but never capitalised or depreciated by the shop (Mode N). *Nice-to-have.*
- **Returns** (feature *returns*; mode named): RMA → receive → inspect → disposition → credit / replace / rework work order. Mode N: credit memo reverses revenue and receivables; returned goods re-enter inventory at the value of their disposition.
- **Insights** (X/N): the right KPIs — on-time delivery %, **quoted-vs-actual margin per work order**, quote win-rate & turnaround, machine utilisation, scrap/rework %, inventory turns, **DSO**, first-pass yield, **order backlog** (booked but unshipped, in the standard sense), and in Mode N variance by cause. *Existence of the right KPIs = table-stakes; depth = nice-to-have.*

---

## Edge-case master list (QA scenario seeds, spine-weighted)
Partial shipments/backorders + over-ship tolerance · scrap/rework + replacement re-runs + yield shorts · lot split/merge & serial genealogy on shipped product · **part revision control + ECO effectivity (wrong-rev build = classic costly defect)** · outside-processing partial returns/loss · **sales-tax exemption/resale certificate tracking + expiry** · freight terms (FOB origin/destination → control-transfer timing across period end) · credit memos/RMA/warranty · **customer-supplied material scrapped; supplier-consigned stock consumed; customer consignment consumed at the customer** · UOM conversion everywhere · negative/over-allocation of inventory · period/timezone on ship-vs-invoice date · rounding/precision drift quote→order→invoice→book of record · **Mode X idempotency, dedup, tax-once, tier gating, out-of-band edits** · **authorization evidence missing, revoked after material issue, or accepting a superseded order version** · **mandatory status skipped by bulk move; backward move past an irreversible status; statuses renamed or re-ordered with work orders open** · **the same rule exercised with its feature switched off (must report *not exercised*, not *pass*)** · **Mode N: opening balances loaded twice; posting into a closed period; retry double-posts; sub-ledger drift; mode switched mid-period** · **standard cost roll with open WIP; variance on started vs good output; rework not on standard routing** · **marketplace order: payer ≠ ship-to, facilitator tax, payout net of fees** · **document renumbered after issue; superseded number reused** · **labor overlapping attendance; offline kiosk/mobile report syncing after close** · **customer-owned tooling in the asset register depreciated** · bill-and-hold without criteria met.

---

# PART E — Coverage map (for QA)

One row per rule family. **Feature** = the switchable feature that must be on for the rule to be exercisable (otherwise record *not exercised*). **Mode** = accounting mode(s). **Oracle** = the assertion that decides pass/fail.

| Rule | Feature presumed | Mode | Oracle | Seed cases |
|---|---|---|---|---|
| A1 quote math | quoting (estimating for budgetary form) | X/N | deterministic recompute; qty-break monotonic; margin/markup labelled; stale on rate change, sent quote unchanged | rate change after send; 40 % markup vs margin; NRE once |
| A2 price lock / change order | sales orders | X/N | order price == accepted quote; change ⇒ audit + re-ack | qty increase; partial cancel |
| A2 authorization evidence | order authorization evidence (+ required-before-release setting) | X/N | hash matches; revocation appended; no release without unrevoked evidence for current version | revoke after issue; version 2 unaccepted; verbal order |
| A2 marketplace roles | retail / marketplace orders | X/N | receivable on payer; consumer on ship-to; gross revenue unless agency set | facilitator tax; payout net of fees |
| A3 advancement preconditions | work orders; routings; approval workflow for approval-step rows | X/N | refused status changes per table in §A3 from every surface | mandatory skip via bulk; irreversible back-move; rename statuses mid-flight |
| A4 shop-floor balance | shop-floor data collection; time tracking; operation-level reporting for per-op checks | X/N | per-op qty balance; labor ≤ attendance; operator attributed; event time kept | offline sync; overlapping labor; forgot clock-off |
| A5 quantity & allocation | inventory | X/N | on-hand law; available law; no double allocation | cycle count on allocated lot; shortage |
| A5 ownership | consignment; inventory | X/N (value rules N) | owned + consigned + customer-supplied = physical; only owned valued | free-issue scrap; supplier consignment consumed |
| A5/A6 traceability | lot/serial traceability | X/N | forward and backward trace complete | multi-lot ship; lot split/merge |
| A6 shipment | shipments | X/N; cost-of-sale period N | relieve once; shipped ≤ remaining + tolerance; cost of sale in control-transfer period | FOB destination across period end; bill-and-hold |
| A7 invoice & tax | invoicing; sales tax | X (external tax) / N (native tax) | invoiced ≤ shipped; price locked; tax-once; deposit as contract liability (N) | certificate expiry; consolidated invoice |
| A8 payment | payments | X (declared direction) / N | receivables law; no over-application; one system of origin | one remittance many invoices; overpayment |
| A9 external seam | accounting integration | X | one external doc per posted doc; receivables parity; failures surfaced; tier declared | retry; out-of-band void; lower tier |
| A10 native ledger | native ledger | N | balanced; once; sub-ledger == control; closed period locked; opening balances gate | double opening load; closed-period post; mid-period switch |
| A11 standard costing | standard costing (optional — off means actual job-order costing) | N posts / X measures | actual = standard of good output + Σ variances; posted == measured; roll deterministic | roll with open WIP; rework off-routing |
| A12 document numbers | none for post-issue immutability; editable document numbers for pre-issue edits | X/N | issued ⇒ frozen; no reuse of superseded | renumber after issue |
| Part C records | (per record type) | X/N | append-only: evidence, entries, issued numbers, quality records | edit posted entry; delete evidence |
| Addendum §R | quality; lot/serial traceability; approval workflow; competence records | X/N | per `definition-of-correct-regulated-addendum.md` | cert-before-use; cal-gate |

---

# Domain Rulings Log

Decisions where "is this correct?" needed a domain verdict, not an engineering one. These bind the BA's feature-vs-defect classification.

**Provenance.** Rulings #1, #2, #4 and #5 were first written in May 2026 in answer to product behaviour reported by discovery and back-end review (an invoice raised by a board status; a flat per-customer tax rate; missing guards on cancel/void transitions; a migration default for line taxability). v3 removes the implementation detail but does **not** pretend those rulings arose independently. Each carries a Provenance line separating **what is domain doctrine** — derivable from the cited standards and practice, and binding whatever the product does — from **what is observation-informed** — the choice of which question to rule on and the description of the model judged. Ruling #3 is doctrine throughout.

### Ruling #1 — Status-driven invoicing (vs invoice-from-shipment)
**Presumes:** feature *invoicing* with a work-order status configured to raise an invoice · mode X/N.

**Provenance — observation-informed model, doctrinal verdict.** The model judged here (a work-order status whose entry raises an invoice; invoicing from the work order; a shipment that updates shipped quantity without raising an invoice) was reported by May discovery, not derived. The verdict and the four guardrails rest on ASC 606-10-25-30 (revenue on transfer of control) and on standard billing practice (goods billed on shipment; non-goods on their own billing event), and would be the same for any system that lets an operational status raise an invoice.

**Verdict: (b) acceptable model, but only with guardrails — degrades to (c) a genuine correctness gap if any guardrail is absent.**

**Why not a flat defect:** billing on completion is a legitimate, common pattern for **ship-complete** custom work, and a status-driven document trigger is *necessary* for billing events with **no shipment at all** (deposits, NRE, tooling, progress billing). The risk is entirely in the **quantity binding and ordering guarantees** for *goods* invoices.

**Why not "correct as-is":** tying invoicing to a board status decouples it from the shipment, breaking the link to **actually shipped quantity** in exactly the cases that bite job shops — partial shipments, short ships from scrap, and invoice-before-ship.

**Required guardrails (each, if violated, makes this a defect):**
1. **Bill shipped qty, not work-order/order qty.** The goods invoice quantity derives from `order_line.shipped_qty − already_invoiced`, never the work-order or order qty.
2. **Shipment is a precondition.** The triggering status must sit at/after shipment, or entering it requires `shipped_qty > 0` for goods lines. (Otherwise goods are invoiced before control transfers → premature revenue.)
3. **Idempotent trigger.** Re-entering the status (moved back then forward) must not raise a second invoice for the same quantity.
4. **Partial-ship support or explicit ship-complete-only.** A one-shot full-quantity trigger cannot represent partial shipments; the model must invoice the shipped portion and leave the remainder billable.

**Invariants for this model:**
- `Σ invoiced_qty(line) ≤ Σ shipped_qty(line)`; trigger quantity = `shipped − already_invoiced`.
- **Precondition:** goods invoice requires `shipped_qty > 0`.
- **Idempotency:** a line's billable quantity is invoiced at most once; status re-entry does not duplicate — in Mode X, at the sync boundary (a retried or duplicate send collapses to one external invoice via a stable external id); in Mode N, at posting (one receivables/revenue entry).
- **Reverse-leakage check (reconciliation, not a gate):** flag `shipped_qty > invoiced_qty` aging beyond terms — status-driven invoicing can leave **shipped-but-never-billed** work if a work order is never advanced.

**Financial consequence if guardrail #1 fails:** revenue and receivables overstated and **decoupled from cost-of-sale timing** (cost recognised at ship for the partial quantity, revenue for the full) → distorts **work-order margin**, the one number a job shop runs on; over-billed customers; the book of record no longer reconciles.

**BA action:** classify as feature-with-guardrails if 1–4 hold; defect if any fails. Determine by behaviour: what quantity a triggered invoice carries after a partial shipment; whether the triggering status can be entered with nothing shipped; whether re-entry raises a second invoice; whether a partial shipment leaves the remainder billable.

### Ruling #2 — Sales-tax authorship
**Presumes:** feature *sales tax* · **Mode X** for 2a; **Mode N** for 2c; both for 2b.

**Provenance — observation-informed model, doctrinal verdict.** The model judged (a single flat rate per customer authored by the platform, alongside the external system computing its own tax) was reported by the May back-end review. The verdicts rest on *South Dakota v. Wayfair* (2018) and destination-based sourcing, on the principle that one system authors each financial figure, and on exemption-certificate practice; they bind any design.

**Verdict 2a (Mode X) — the external system's automated sales tax is authoritative; the platform must not author a tax figure.** The platform sends the **inputs** the tax engine needs — ship-to address (jurisdiction), per-line taxability (taxable / non-taxable), customer **exempt status + reason/certificate** — and reads the computed tax back for display and reconciliation only.
- *Why not "platform computes and pushes":* (1) the external engine recomputes regardless, so a pushed figure is overridden or conflicts; (2) it forces a small shop to own multi-jurisdiction rates, nexus and taxability rules — an unbounded liability the book of record already solves; (3) the book of record must own the financial number; (4) its tax records are the audit-defensible artefact.
- **Invariant:** *tax is computed exactly once, by the external engine, from platform-supplied inputs; stored tax equals the returned tax to the cent.*

**Verdict 2b (both modes) — a flat rate per customer is a correctness defect.** It cannot represent ship-to **jurisdiction** (the legal basis after *South Dakota v. Wayfair*, 2018), multiple ship-to addresses, **resale/exemption certificates** (the dominant B2B job-shop case), rate changes over time, or freight/labor taxability differences. Spine defect, high severity. The fix is not a rate table in the platform: capture **(i)** ship-to per shipment/order, **(ii)** per-item taxability, **(iii)** customer exemption + **certificate lifecycle (number, expiry, alerts)**.
- *Pre-invoice estimate nuance:* an **estimated** tax on a quote or order is fine if labelled non-authoritative ("plus applicable tax").

**Verdict 2c (Mode N) — the platform or a tax engine it calls is authoritative**, from the same three inputs; the flat-rate model is still defective. Tax payable posts once with the invoice. Marketplace-facilitator orders carry no seller-authored tax in any mode.

### Ruling #3 — What must be true before a cancel, void or receipt is allowed
**Presumes:** features *sales orders*, *invoicing*, *purchasing* · mode X/N (Mode X external-document effects noted).

**Provenance — doctrine.** Derived from document-control and three-way-match practice (AICPA purchase-to-pay controls; APICS order management). The May version was written as guard specifications for reported transitions; v3 states the rules only.

**Governing principle:** past facts don't unwind. Received inventory, shipped goods and applied payments are real-world events. Reversing them is a dedicated reversal flow (RMA/return, vendor debit memo, payment unapplication, credit memo), not a state change on the originating document. This is the line between **cancel remaining** (legal: drop the open commitment) and **reverse what happened** (separate flow).

Conditions are stated as facts about the document, not as status names, because the facts are what the rule protects. "Refused" means no change is made and the reason is shown.

#### Cancel a sales order

| Condition | Legal? | Behaviour |
|---|---|---|
| Not yet confirmed to the customer | ✓ Allow | No commitment; no financial effect |
| Awaiting customer acceptance | ✓ Allow | Cancel with customer notification |
| Confirmed, nothing shipped | ✓ Allow | Cancel; hold or cancel unstarted operations on linked work orders |
| Some quantity shipped | ✓ Allow — **cancel remainder only** | See note 1 |
| Everything shipped | ✗ Refused | Closed commitment |
| Any portion invoiced (and not credited) | ✗ Refused for the invoiced portion | Only a credit memo reverses it |
| Already cancelled | Idempotent no-op | Retry, not an error |

**Note 1 — some quantity shipped:** cancel the *unshipped remainder* only. Shipped lines stand. Outcome: order **short-closed** (not "cancelled" — that word implies nothing shipped). Returned goods are an RMA. Holding/cancelling unstarted operations on linked work orders is mandatory alongside.

#### Void an invoice

| Condition | Legal? | Behaviour |
|---|---|---|
| Not yet issued (draft) | ✗ Refused | Drafts are deleted, not voided; there is nothing posted to reverse |
| Issued, zero payments applied | ✓ Allow | Primary path. Mode X: void the external document once. Mode N: reversing entry in the open period. |
| Issued, any payment applied | ✗ Refused | Show the applied payments; offer "unapply, then void" or "issue credit memo" |
| Fully paid | ✗ Refused | Credit memo + refund is the reversal path |
| Already voided | ✗ Refused | Terminal — re-voiding is an error, not a retry |
| Balance zeroed by credit memo | ✗ Refused | Effectively settled |

**Guard:** `issued AND payments_applied_total == 0`. Missing either is a high-severity spine defect.

#### Cancel a purchase order

| Condition | Legal? | Behaviour |
|---|---|---|
| Not yet sent | ✓ Allow | No commitment |
| Sent, not acknowledged | ✓ Allow | Surface vendor-notification flag (informational) |
| Acknowledged, nothing received | ✓ Allow | Flag that vendor notification is the shop's responsibility |
| Some received, **no vendor bill** matched (GRNI only) | ✓ Allow-with-compensation | Cancel remainder; PO short-closed; GRNI untouched. See note 2 |
| Some received, **vendor bill matched or in matching** | ✗ Refused | Payable exists: "issue a debit memo first." Guard: `matched_bill_qty > 0` |
| Everything received | ✗ Refused | Nothing to cancel — close the PO |
| Already short-closed or cancelled | Idempotent no-op | |
| Closed | ✗ Refused | Terminal |

**Note 2 — GRNI ≠ a posted payable.** GRNI only (received, not invoiced): an accrual (`Dr inventory / Cr GRNI`) that clears when the vendor bill arrives and is three-way matched — even after short-close. Matched bill (`Dr GRNI / Cr payables`): a real liability, parallel to "invoiced" on the sales side → refused. **The guard is `matched_bill_qty > 0`, not `received_qty > 0`.**

**Compensation (atomic):** unreceived lines cancelled; PO short-closed; expected receipt qty = 0 on cancelled lines; GRNI untouched; no inventory or ledger reversal; received material already issued to a work order unaffected. If compensation cannot complete atomically → refused with the reason.

#### Receive goods against a purchase order

| Condition | Legal? | Behaviour |
|---|---|---|
| PO not yet approved | ✗ Refused **as a receipt against that PO** | A receipt against an unapproved PO breaks three-way match. The goods are received instead through the **unplanned-receipt flow** (note 3) |
| Approved, open | ✓ Allow | Primary path |
| Partially received | ✓ Allow | Continuing delivery |
| Fully received | ✗ Refused by default | Over-receipt requires explicit exception + supervisor approval |
| Cancelled or closed | ✗ Refused | |

**Note 3:** when goods arrive before approval, either approve the PO first (rush approval) or book them through the **unplanned-receipt flow**: elevated permission, reason code, goods held in receiving (not available, not issuable) until the PO is approved and matched. Never treat an unapproved PO as approved. Supplier-consigned receipts create quantity, not value (§A5).

### Ruling #4 — Reversibility matrix
**Presumes:** as Ruling #3, plus *shipments*, *payments*, *work orders* · mode X/N.

**Provenance — observation-informed scope, doctrinal rules.** Which transitions are tabulated was prompted by the May review of missing guards; each disposition is derived from the governing principle of Ruling #3 (past facts don't unwind), from ASC 606 and from payables/receivables practice. The "refused / allow-with-compensation / idempotent" binary is domain language for what the business must experience, not an implementation contract.

**The governing binary:**
- **Refused:** the condition makes the change categorically illegal — the real-world event cannot be undone, or reversal would take an irreversible financial action the user has not explicitly authorised. No change is made.
- **Allow-with-compensation:** legal, but must atomically trigger a compensating record. Allowing without it is a silent inconsistency. If compensation cannot complete atomically → refused with the reason.
- **Idempotent no-op:** already in the target condition; succeed without re-executing.

**Voiding an invoice with a payment applied — refused, not auto-reversed:** (1) Mode X: the external system rejects a void on an invoice with applied payments, leaving the platform half-changed; (2) the payment may be bank-reconciled in a closed period, so reversal is a period adjustment requiring accountant intent; (3) one remittance often covers several invoices — auto-unapplying it breaks the others silently. The user decides explicitly: "unapply payment, then void" or "issue credit memo." (Full table in Ruling #3.)

#### Quote

| Action | Refused when | Idempotent when |
|---|---|---|
| Send | Already accepted, converted or rejected | Already sent |
| Accept | Not yet sent, rejected or converted | Already accepted |
| Reject | Not yet sent, accepted or converted | Already rejected |
| Convert to order | Not accepted, or expired | — (a second conversion is **refused**, not idempotent: it would create a duplicate order) |

#### Sales order

| Action | Condition | Disposition |
|---|---|---|
| Confirm | Already confirmed, some shipped, or cancelled | Refused |
| Confirm | Acceptance evidence required and absent or revoked | Refused |
| Cancel | Nothing shipped | Allow; cascade hold/cancel to unstarted work-order operations |
| Cancel | Some shipped | Allow-with-compensation — short-close; work-order cascade; shipped lines stand |
| Cancel | Everything shipped, or invoiced | Refused |
| Cancel | Already cancelled | Idempotent no-op |

#### Shipment

| Action | Condition | Disposition | Notes |
|---|---|---|---|
| Ship | Already shipped, delivered or cancelled | Refused | A further shipment is a new shipment |
| Record delivery | Not shipped, or cancelled | Refused | |
| Record delivery | Already delivered | Idempotent no-op | |
| Void shipment | Invoiced | Refused — absolute | Void the invoice (or credit) first; otherwise cost of sale and revenue diverge |
| Void shipment | Delivery confirmed | Refused | Now an RMA |
| Void shipment | Shipped, not invoiced | Allow-with-compensation | Data-entry window only. Atomic: restore lot/qty to on hand; reverse cost of sale (Mode N: reversing entry in the open period); decrement order shipped qty; mark shipment voided. Elevated permission + reason code. |

#### Invoice

| Action | Condition | Disposition | Notes |
|---|---|---|---|
| Send | Voided or cancelled | Refused | |
| Send | Already sent or paid | Allow | Re-send is a notification, not a financial change |
| Void | *(Ruling #3 table)* | | |

#### Payment

| Action | Condition | Disposition | Notes |
|---|---|---|---|
| Apply | Invoice fully paid, voided or cancelled | Refused | |
| Apply | Amount > invoice balance | Refused | Require the explicit overpayment path → unapplied credit |
| Apply | **The same payment** (same payment record, or a resubmission carrying the same remittance reference, payer and date) already applied to this invoice | Idempotent no-op | Retry guard. Idempotency is keyed on the payment's identity, **never on its amount**: a second, distinct payment for the same amount is a new payment and is applied (or becomes unapplied credit) |
| Refund | Amount ≤ the payment's **unapplied** amount | Allow | Standard refund of credit; full or partial |
| Refund | Amount > unapplied amount but ≤ original payment | Refused | Unapply from invoices (or issue a credit memo) first, which raises the unapplied amount |
| Refund | Amount > original payment | Refused | |
| Refund | Nothing unapplied (already fully refunded or fully applied) | Refused | Re-refunding is an error |

#### Work order

| Action | Condition | Disposition | Notes |
|---|---|---|---|
| Enter an invoice-raising status | Nothing invoiceable (`shipped − invoiced == 0`) | Allow the move, raise no invoice | Do not block production for an accounting edge case |
| Move back past an invoice-raising status, invoice exists | Status not marked irreversible | Allow the move — invoice stands | The move is operational; re-entry must not raise a second invoice (Ruling #1 guardrail 3) |
| Move back past a status marked irreversible | — | Refused | Reverse the document through its own flow |
| Close | Negative WIP | Refused | Material/labor charged to the wrong work order; resolve first |
| Close | Issued material or labor not yet reconciled | Allow-with-warning | Same rule as §A3: unreconciled amount to closing variance; later charges post to that variance, not a reopen. Don't freeze production for accounting cleanup |
| Cancel | Material issued | Allow-with-compensation | Return issued material to inventory (lot-tracked) or record a cancellation variance; never write off silently. Customer-supplied material is returned to the customer's stock, never written off |
| Re-open | Closed | Allow-with-compensation | Reverse close entries (Mode N: in the open period); reopen operations; flag for management review |

#### Atomicity — three allow-with-compensation cases carry complex compensating records

1. **Cancel a partially shipped order:** order line conditions, order short-close, work-order cascade — all or nothing.
2. **Void a shipment before invoicing:** inventory lot/qty, cost of sale, order shipped qty — if the cost reversal fails, the inventory restore must not stand.
3. **Cancel a work order with issued material:** distinguish material merely issued (return transaction, lot-tracked) from material consumed as scrap (variance entry).

In all three: if compensation cannot complete atomically, refuse with the reason — never leave a half-compensated document.

### Ruling #5 — Default taxability for labor and operation lines
**Presumes:** feature *sales tax* with per-line taxability **and a jurisdiction-aware tax engine** — Mode X: the external system's automated sales tax; Mode N: only where the platform computes by jurisdiction or calls a tax engine. **Without such an engine the default below does not apply**: every line's taxability must be set by the shop per its own jurisdictions, and this ruling is not exercised.

**Provenance — observation-informed question, doctrinal verdict.** The question (what a migration should default existing lines to) arose from May engineering work. The verdict rests on state fabrication-labor rules and on the asymmetry of error below.

**Context:** each invoice and sales-order line carries a taxability category (taxable / non-taxable) as the input the tax engine consumes. Material lines take taxability from the part master. This ruling covers labor, operation and service lines.

**Verdict: default labor/operation lines to *taxable*, not *non-taxable*, for a fabrication job shop.**

**Why non-taxable is wrong here:** "labor is non-taxable" is correct for pure-service businesses and wrong for fabrication. In several US states, labor that fabricates or produces tangible personal property for the customer is part of the taxable sales price — for example California (Cal. Code Regs. tit. 18, §1526, *Producing, Fabricating and Processing Property*) and Texas (34 Tex. Admin. Code §3.300, *Manufacturing; Custom Manufacturing; Fabricating; Processing*). Rules differ by state, which is exactly why the category must defer to a jurisdiction-aware engine rather than assert non-taxable. Marking a line non-taxable tells the engine not to tax it regardless of jurisdiction → systematic under-collection in fabrication-taxing states.

**Why taxable is correct:** *taxable* means "eligible for jurisdiction-based determination." Where fabrication labor is not taxed, the engine returns 0 %; where it is, it applies the rate. The platform asserts **category**; the engine determines **rate and applicability**.

| Line type | Default | Rationale |
|---|---|---|
| Production operations (turning, milling, grinding, welding, assembly) | **Taxable** | Fabrication labor producing tangible property — defer to the engine |
| Outside processing (heat treat, plating) | **Taxable** | True object is the treated part |
| Non-production services (engineering consultation, programming billed as a service) | **Non-taxable** | Pure service, no tangible property produced |
| NRE / tooling charges | **Taxable** (line-level override allowed) | Tooling is tangible property; customer-owned tooling sold to the customer is still a sale |

**If a single migration default must cover all operation/labor lines: taxable.** Correcting a taxable line down is trivial; a non-taxable line that silently under-taxed surfaces in year-end reconciliation or audit, not day to day — the worst kind of defect.

**Error asymmetry:** taxable default + jurisdiction doesn't tax = 0 %, no harm. Non-taxable default + jurisdiction taxes fabrication = under-collection, audit exposure, silent liability.
