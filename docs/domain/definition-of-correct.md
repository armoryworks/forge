# Definition of Correct — Machine Shop Quote-to-Cash Platform

**Author:** Domain / Industry Specialist
**Status:** v2 — segment confirmed, **leads with the quote-to-cash spine** (orchestrator scope call).
**Confirmed customer:** small-to-mid **discrete / job machine shop**, **QuickBooks Online (QBO) as book of record**, with **quality-regulated ambitions** (app carries FMEA / PPAP / SPC / CAPA depth).

> This is the domain model, not an audit. It defines real-world correct behavior the software must match. BA maps app→this; QA turns the invariants & edge cases into coverage; "fixed" (eng) = the invariant holds and the edge case is handled; orchestrator sizes effort to spine-first.

---

## Resolved assumptions (were open in v1)

| Question | Resolved answer | Consequence |
|---|---|---|
| Segment | **Job / discrete shop**, small-to-mid | Estimating engine + **per-job costing (quoted vs actual margin)** is the heart. Quote math is the #1 trust feature. |
| QB edition / book of record | **QBO**, and it is the **financial book of record** | App = system of *operations*; QBO = system of *financial record*. Sync ownership must be explicit & one-directional per field. QBO uses **average cost**. Tier matters (see §A9). |
| Quality posture | Regulated *ambitions*; FMEA/PPAP/SPC/CAPA present | Deep quality = **differentiator, not day-one spine correctness** — *except* the lot/serial traceability that touches shipped product, which IS spine table-stakes. |

Still to confirm: margin-vs-markup convention used in pricing (§A1.2); QBO subscription **tier** (Simple Start/Essentials vs Plus/Advanced — gates inventory/PO/class, §A9); whether **customer-supplied/consigned material** occurs (§A5); whether tax is computed by the **app or by QBO Automated Sales Tax** (double-tax risk, §A9).

---

# PART A — THE SPINE: Definition of Correct (lead)

The market-ready bar lives here:
`Quote/cost math → Sales Order → Job/Production → Shop-floor → Inventory consumption → Shipment → Invoice → Payment → QBO reconciliation.`

For each stage: **Correct =** the real-world behavior · **Won't tolerate wrong** (day-one table-stakes for this customer) · **Invariants** (assertable by QA) · **Edge cases** that bite here.

### A1. Quote / cost math — *the product's trust anchor*
**Correct:** Build price from the routing + material + outside processing, then mark up.
- Per-op estimate: `setup_hrs + run_time_per_pc × qty`, each op at its work-center **labor and/or machine-burden rate**.
- Material: stock selection, qty-needed **including drop/cutoff/scrap factor** (you buy more than the net part), priced per UOM with conversion.
- Outside processing (heat-treat/plate/grind): per-pc or per-lot, honoring **vendor minimum charges**.
- Overhead/burden applied by a defined method (machine-hour rate, labor-burden %, or shop rate).
- Markup → price; **quantity breaks** (setup amortized over qty); min lot charge; optional NRE/tooling; **expiration** date.

**Won't tolerate wrong:** the priced unit at each qty break; **setup-vs-run separation**; **margin vs markup** discipline; material scrap factor & UOM; rounding. A shop owner catches a quote off by a few percent and loses trust immediately.

**Invariants:**
- Recompute is **deterministic & stable** (same inputs → identical total; no drift from rate lookups or rounding order).
- **Qty-break monotonicity:** unit price non-increasing as qty rises, absent a real cost step.
- `total = Σ lines`; `line = unit×qty + adders`; NRE/tooling counted **once**.
- `margin = (price−cost)/price` and `markup = (price−cost)/cost` are not interchanged (40% markup = 28.6% margin).

**Edge cases:** rev-specific quotes; expired quote can't convert to order without re-pricing; material-price volatility vs validity window; rounding precision carried forward.

### A2. Sales Order
**Correct:** Accepted quote → SO. **Price locked** from the accepted quote, customer **PO# captured**, promised ship date, multi-line, partial-ship allowance, order acknowledgment.

**Won't tolerate wrong:** price **locked from the accepted quote** (never silently recalculated at current rates); part **+ revision** and qty exactly as ordered; no silent change to a confirmed order.

**Invariants:** `SO_line.price == accepted_quote.price` for that qty (unless an explicit change order); ordered qty immutable except via **change order with audit trail + re-acknowledgment**; SO references a valid part+rev.

**Edge cases:** change orders (qty/price/date) with audit + re-ack; partial cancellation; discrete vs blanket/release (job shop = mostly discrete; blanket releases are a production-shop feature — flag, not spine).

### A3. Job / Work Order (routing + BOM + cost baseline)
**Correct:** SO line → job(s). Job carries the **routing** (op sequence, work centers), **BOM** (material + qty), and a **required start qty** (order qty + expected scrap/yield allowance). Job-cost accumulator opens; **estimated cost from the quote is carried as the variance baseline**.

**Won't tolerate wrong:** job tied to the **right part+rev**; required material = BOM × job qty + scrap allowance; estimated-cost baseline preserved for variance.

**Invariants:** `job.part_rev == SO_line.part_rev`; `job.estimated_cost` traceable to the quote basis; `start_qty ≥ order_qty` when a scrap allowance is applied.

**Edge cases:** **ECO/rev change after job release** (mid-WIP); splitting one SO line into multiple jobs or combining lines; make-to-stock vs make-to-order.

### A4. Shop-floor execution
**Correct:** Operators report **time and qty per operation**: good qty, scrap qty (**reason code**), rework. Labor + machine time accrue to **that job's** actual cost. Op completion advances the routing; final op produces finished qty.

**Won't tolerate wrong:** per-op quantity balance; labor cost accrues to the correct job; cannot complete more good parts than were started minus scrap.

**Invariants:**
- Per op: `qty_in = qty_good_out + qty_scrapped + qty_at_op`.
- Cumulative good qty at final op ≤ `start_qty − Σ scrap`.
- `job_actual_labor = Σ(reported_time × rate)`, drawn only from that job's reports.

**Edge cases:** **scrap mid-routing forcing a re-run** (do we still have enough good parts to fill the order?); **rework loops** (op redone, added cost); split lots across machines; partial op completion; time spanning shifts/operators.

### A5. Inventory consumption (raw receipt → issue to job)
**Correct:** Raw material received against PO → **on-hand by lot/heat**; issued to job → on-hand ↓, WIP/job-cost ↑. **UOM conversion** buy→stock→issue. The **lot consumed is recorded** (this is the traceability link forward to the shipment).

**Won't tolerate wrong:** inventory **quantity accuracy**; **UOM conversion**; **no silent negative** on-hand; issued material **costed by the defined method**; **lot issued is recorded** and ties forward to the shipped product.

**Invariants:**
- `on_hand = Σ receipts − Σ issues − Σ shipments ± adjustments` per item/lot/location; never silently negative.
- Issue cost uses the defined method (with QBO as record, reconcile to **average cost** at the financial layer).
- Every issue records the lot → consumable forward into shipment traceability.

**Edge cases:** **customer-supplied / consigned material** (don't cost as owned; track qty; scrap = liability — *confirm if in play*); lot **split/merge**; backflush vs explicit issue; **material shortage** (partial issue + material backorder); scrap returned-to-stock vs written-off; UOM rounding (issue 3.0001 ft).

### A6. Shipment
**Correct:** Pick finished qty (full or **partial**), packing slip, ship transaction **relieves inventory** and **recognizes COGS**, ownership transfers per **FOB terms**; **lot/serial of shipped product recorded** (recall scope); freight captured.

**Won't tolerate wrong:** `shipped_qty ≤ remaining order qty (+ tolerance)`; partial shipments clean; inventory relieved **exactly once**; **lot/serial of shipped product captured** (this is the traceability that touches shipped product → **table-stakes even pre-full-regulation**); COGS at correct cost.

**Invariants:**
- `shipped_qty ≤ ordered − already_shipped + over_ship_tolerance`.
- Each shipment relieves inventory **once** (idempotent).
- Shipment carries lot/serial linking back to the **consumed material lots**.
- `COGS = shipped_qty × unit_cost`.

**Edge cases:** partial ship + backorder; over-ship within tolerance; ship spanning **multiple lots**; short-ship from scrap; drop-ship; **FOB origin vs destination** (revenue-recognition timing & risk transfer).

### A7. Invoice
**Correct:** Invoice from shipment(s) — bill **what shipped**; price from the **locked SO**; **freight**; **sales tax** (taxable vs exempt w/ **resale/mfg-exemption cert**, jurisdiction by ship-to, shipping taxability by state); terms; may consolidate multiple shipments or be partial.

**Won't tolerate wrong:** `invoiced_qty ≤ shipped_qty`; price = SO locked price; **tax correctness** (exemption certs honored, right jurisdiction, computed **once**); freight; **rounding consistent with QBO**; **no duplicate invoicing** of a shipment.

**Invariants:** `invoiced_qty ≤ shipped_qty` per line; `invoice_line.price == SO.price`; `invoice_total = Σ lines + freight + tax` (fixed rounding rule); each shipment invoiced **at most once**.

**Edge cases:** partial invoice / consolidated invoice; **credit memo / RMA**; exemption-cert expiry; freight billed vs actual & freight taxability; deposit/NRE/tooling progress billing.

### A8. Payment
**Correct:** Customer payment applied to invoice(s); A/R ↓; partial payments; over/under payment; credit-memo application. *(With QBO as book of record, confirm whether cash receipt is recorded in QBO and mirrored, or recorded in-app and pushed.)*

**Won't tolerate wrong:** payment applied to the **correct invoice(s)**; A/R balance accurate; no over-application.

**Invariants:** `A/R = Σ invoices − Σ payments − Σ credits`; applied amount ≤ open invoice balance (or explicitly creates a credit/overpayment); applications sum correctly.

**Edge cases:** partial payment; one payment across many invoices; overpayment → credit; short-pay/dispute; **direction of truth** for cash receipts between app and QBO.

### A9. QuickBooks Online reconciliation — *book of record seam*
**The boundary (must be explicit):** **QBO owns financial truth** (A/R, revenue, COGS, tax liability, cash, inventory **asset value**). **The app owns operations** (quotes, jobs, shop floor, operational inventory qty/lots/WIP, job costing). Each synced object/field has **one owning system and one direction**.

**Correct:**
- **Customers:** one canonical mapping app↔QBO, **no duplicates**.
- **Items:** for a job shop most invoiced parts are **custom/non-stock** → typically QBO **non-inventory or service items** (or a generic "Machining" item), not QBO inventory items. Raw materials may be QBO inventory **only if tier supports it**. Decide and hold it consistent.
- **Invoices:** app → QBO, **idempotent**, with correct tax mapping.
- **Payments:** typically recorded in QBO (book of record) — confirm; mirror without duplication.
- **COGS / inventory valuation:** QBO is **average cost**; the app may track a different operational cost. Decide who owns valuation. For custom parts the clean pattern is COGS posted via the synced ship/invoice transaction while operational inventory stays in the app; raw-material asset via QBO inventory items **or** periodic journal entries.
- **Tax:** computed by **exactly one** system — either the app or **QBO Automated Sales Tax (AST)**. If both compute, you double-tax. Exemption cert → customer flagged tax-exempt in QBO.

**Won't tolerate wrong (these silently corrupt the books):**
- **Idempotency:** retried sync never double-posts an invoice/payment.
- **Entity dedup:** no split customer/item records.
- **Tax computed once**, exemptions honored, jurisdiction right.
- **Amount/rounding parity:** app total == QBO total to the cent.
- **Failed sync surfaced & retryable** — never swallowed (a silent failure = out-of-balance books nobody sees).
- **Out-of-band QBO edits** (void/delete/edit) detected, not blindly re-pushed.
- **Dependency order:** customer before invoice, item before line.

**Invariants:**
- Each posted app invoice/payment ↔ **exactly one** QBO doc (stable external id).
- `Σ app A/R == QBO A/R` (or reconciles with a known, explained delta).
- Every QBO invoice line maps to a known app item (no orphans).

**Edge cases:** **QBO tier gating** — Simple Start/Essentials have **no inventory, no PO, no class tracking**; inventory tracking needs **Plus/Advanced** (this can invalidate an inventory-sync design outright — confirm tenant tier); API **rate limits / token expiry / outage** → queue + retry; sandbox vs production; **AST jurisdiction by ship-to address**; user edits/voids invoice in QBO after sync; multi-currency (out of scope domestically — flag if it appears).

---

# PART B — Calibration for THIS customer: day-one vs differentiator

**Day-one spine correctness (must hit market-ready — bugs here are trust-killers):**
- Quote / cost math (§A1) and **job costing actual-vs-quoted margin** (the job shop's reason to exist).
- Inventory **quantity accuracy + UOM** (§A5).
- **Lot/serial traceability where it touches shipped product** — consumed lot → shipment → customer (§A5–A6).
- **Tax & shipping on invoices** — exemption certs, jurisdiction (§A7).
- **QBO sync integrity** — idempotent, reconciling, tax-once (§A9).
- Order → ship → invoice → payment **quantity/price/money flow** (§A2, A6–A8).

**Differentiators (real value, NOT day-one spine correctness — must work eventually, but a bug here doesn't break trust the way a wrong invoice does):**
- **FMEA, PPAP, SPC, CAPA** depth; FAI/AS9102 (unless selling to aerospace *now*).
- Finite-capacity scheduling / advanced planning / MRP suggestions.
- Vendor scorecards, supplier quality portals.

**The calibration line to hold:** the deep quality features are differentiators, **but the lot/serial data backbone they sit on must be correct on day one** because that same data rides on shipped product. So: *FMEA/PPAP/SPC/CAPA = differentiator; the traceability records under them = spine.*

---

# PART C — Cross-cutting conservation laws (QA asserts these globally)
- `ordered = shipped + remaining + cancelled` per line.
- `invoiced_qty ≤ shipped_qty` (except explicit prepay/deposit).
- `on_hand = Σ receipts − Σ issues − Σ shipments ± adjustments`, per item/lot/location; **never silently negative**.
- `available = on_hand − allocated`; no over-allocation / same lot to two jobs.
- `WIP = material + labor + burden + OSP − relieved at completion`; nets ~0 at job close.
- `A/R = Σ invoices − Σ payments − Σ credits`.
- **QBO mirror:** each posted invoice/payment/PO/bill ↔ exactly one QBO record; amounts/tax/entity/date match.
- Quote total is a deterministic, stable recompute of its lines.

---

# PART D — Surrounding modules (fuller model, post-spine)

Calibrated to job-shop + QBO + quality-ambitions; these support the spine but are **not** the day-one market-ready gate.

- **Identity:** roles/permissions with **segregation of duties** (who approves a quote, posts an invoice, adjusts inventory, overrides price), approval thresholds. *Spine-adjacent table-stakes for control integrity.*
- **MasterData:** parts (**+ revision**), customers, vendors, work centers (+ rates), BOM, routing templates, **UOM + conversions**, tax codes, terms. Everything upstream depends on this being clean. *Table-stakes (feeds the spine).*
- **People:** employees + **labor rates** + time → feeds job cost (spine). Skills/scheduling = nice-to-have.
- **Procurement:** PO → receive → 3-way match; **outside-processing POs** that track parts offsite & back; partial receipts + tolerance. *Material side of the spine = table-stakes; vendor RFQ/scorecards = nice-to-have.*
- **Quality:** CofC + cert (mill-test-report) attachment & forwarding + **lot/serial trace = table-stakes where it touches shipped product**; FMEA/PPAP/SPC/CAPA/FAI = **differentiators**.
- **Maintenance:** PM/downtime affects capacity; gauge calibration ties to quality. *Nice-to-have.*
- **Insights:** must carry the right KPIs — on-time delivery %, **quoted-vs-actual margin per job**, quote win-rate & turnaround, machine utilization, scrap/rework %, inventory turns, **DSO**, first-pass yield. *Existence of the right KPIs = table-stakes; depth = nice-to-have.*

---

## Edge-case master list (QA scenario seeds, spine-weighted)
Partial shipments/backorders + over-ship tolerance · scrap/rework + replacement re-runs + yield shorts · lot split/merge & serial genealogy on shipped product · **part revision control + ECO effectivity (wrong-rev build = classic costly defect)** · outside-processing partial returns/loss · **sales-tax exemption/resale cert tracking + expiry** · freight terms (FOB origin/dest → rev-rec timing) · credit memos/RMA/warranty · **customer-supplied/consigned material** · UOM conversion everywhere · negative/over-allocation of inventory · period/timezone on ship-vs-invoice date · rounding/precision drift quote→order→invoice→QBO · **QBO idempotency, dedup, tax-once, tier-gating, out-of-band edits**.

---

# Domain Rulings Log

Decisions where "is this correct?" needed a domain verdict, not an engineering one. These bind the BA's feature-vs-defect classification.

### Ruling #1 — Job-stage-driven invoicing (vs invoice-from-shipment)
**Design observed (Discovery):** Invoicing is triggered by a kanban Job **stage** configured with `AccountingDocumentType → CreateInvoice`; the supported manual path is invoice-from-**job**. `ShipmentCreatedEvent` updates SO shipped qty but does **not** create an invoice.

**Verdict: (b) acceptable model, but only with guardrails — degrades to (c) a genuine correctness gap if any guardrail is absent.**

**Why not a flat defect:** Billing on job completion is a legitimate, common pattern for **ship-complete** custom work, and a job/stage-driven document engine is *necessary* for billing events that have **no shipment at all** (deposits, NRE, tooling, progress billing). The automation mechanism is sound. The risk is entirely in the **quantity binding and ordering guarantees** for *goods* invoices.

**Why not "correct as-is":** Tying invoicing to a job-board stage decouples it from the shipment, breaking the link to **actually-shipped quantity** in exactly the cases that bite job shops — partial shipments, short ships from scrap, and invoice-before-ship.

**Required guardrails (each, if violated, makes this a defect):**
1. **Bill shipped qty, not job/order qty.** The `CreateInvoice` line qty must derive from `SO.shippedQty − alreadyInvoiced`, never the job/order qty. (Otherwise over-invoices on every partial/short ship.)
2. **Shipment is a precondition.** The trigger stage must sit at/after shipment, or stage-advance must require `shippedQty > 0` for goods lines. (Otherwise invoices goods before transfer of control → premature rev-rec.)
3. **Idempotent trigger.** Re-entering the stage (cards move backward/forward) must not emit a second invoice for the same qty. Guard once-per-unbilled-shipped-qty.
4. **Partial-ship support or explicit ship-complete-only.** A one-shot full-qty trigger cannot represent partial shipments; if the shop ever ships partial (job shops usually do — short ship from scrap is near-universal), the model must invoice the shipped portion and leave the remainder billable.

**Reframed invariants for this model (replace the shipment-centric ones for QA):**
- `Σ invoiced_qty(line) ≤ Σ shipped_qty(line)` — enforced at stage-triggered invoice creation, qty = `min(unbilled, shipped − already_invoiced)`.
- **Precondition:** goods invoice requires `shipped_qty > 0` (no invoice-before-ship).
- **Idempotency:** a job/line's billable qty is invoiced at most once; stage re-entry does not duplicate.
- **Reverse-leakage check (reconciliation, not a hard gate):** every shipped qty is *eventually* invoiced — flag `shipped_qty > invoiced_qty` aging beyond terms (stage-driven invoicing can leave **shipped-but-never-billed** if a card is never advanced).

**Financial consequence if guardrail #1 fails:** revenue/A/R overstated and **decoupled from COGS timing** (COGS recognized at ship for the partial qty, revenue for the full qty) → distorts **job margin**, the one number a job shop runs on. Plus over-billed customers and QBO reconciliation breaks.

**BA action:** classify as feature-with-guardrails if 1–4 hold; defect if any fails. Resolve which by checking: (i) what qty the `CreateInvoice` handler reads; (ii) which stage carries the trigger and whether shipment gates entry; (iii) whether the trigger is idempotent on stage re-entry; (iv) whether partial shipments are supported at all.

**Update — `CreateInvoice` runs through the QBO sync queue.** This *is* the idempotency test surface (ties guardrail #3 to §A9): stage re-entry must not enqueue a second `CreateInvoice`, and the queue needs a **stable external id** so a retried/duplicate enqueue collapses to one QBO invoice. Net: the model's two failure modes — wrong billing basis (#1, partial-ship) and duplicate emission (#3, stage re-entry) — are *both* observable at the sync-queue boundary, which is where QA should assert them. The kanban-stage *trigger* is a legitimate, likely-intended design; "no invoice-from-shipment action" is **not** itself the defect. The defect, if any, is narrower: does it bill **shipped qty** and leave the remainder billable? If yes → workflow/UX nit. If it fires full-job-qty on a partial ship → spine correctness gap.

### Ruling #2 — Sales-tax ownership and the local tax model
**Design observed (back-end audit):** app computes tax locally as flat `TaxAmount = Subtotal × TaxRate` (one rate per customer) and sends **no** tax detail to QBO. In integrated mode QBO Automated Sales Tax (AST) computes its *own* tax independently → two systems, no declared owner = the §A9 double-tax/mismatch trap, live.

**Verdict 2a — Owner: QBO Automated Sales Tax is authoritative. The app must stop authoring a tax figure.** Correct model: the app sends QBO the **inputs AST needs to be correct** — ship-to address (jurisdiction), per-line taxability (`TaxCodeRef` TAX/NON), and customer **tax-exempt status + reason/cert** — and QBO computes the authoritative `TxnTaxDetail`. The app reads the result back for display/reconciliation only.
- *Why not "app computes and pushes detail":* (1) modern QBO Online AST is effectively mandatory and will **recompute regardless**, so a pushed figure is overridden or conflicts; (2) it forces a small shop to own multi-jurisdiction rate tables + nexus + taxability rules and keep them current — an unbounded compliance liability QBO already solves; (3) the **book of record must own the financial number**; (4) QBO's tax records are the audit-defensible artifact, a flat local rate is not.
- **Invariant:** *Tax is computed exactly once, by QBO AST, from app-supplied inputs (ship-to jurisdiction, per-line taxability, customer exemption). The app never authors tax; the stored tax equals QBO's returned tax **to the cent**.*

**Verdict 2b — The flat `Subtotal × TaxRate` model is a genuine correctness defect, independent of the wiring.** One rate per customer cannot represent: ship-to **jurisdiction** rate determination (the legal basis post-Wayfair), multiple ship-to addresses, **resale/exemption certs** (the *dominant* B2B job-shop case — most shop invoices are non-taxable with a cert on file), rate changes over time, or freight/labor taxability differences. This is a **spine** defect (lands on invoice correctness *and* QBO integrity), high severity.
- **But adopting 2a dissolves it:** the app no longer needs a jurisdiction rate engine — it needs to capture and pass the right *inputs*. So the fix is not "build rate tables in the app," it is: **remove/deprecate the local flat rate**, and instead capture **(i)** ship-to address per shipment/order, **(ii)** per-item taxability, **(iii)** customer exemption status + **cert lifecycle (number, expiry, alerts)** as an app operational responsibility that sets the customer's taxable/exempt status in QBO.
- *Pre-invoice estimate nuance:* showing an **estimated** tax on a quote/order is fine if labeled non-authoritative ("plus applicable tax"); the authoritative figure is QBO's at invoice time. Don't let the app's estimate masquerade as the booked tax.

**Eng-lead payload contract (essence):** app→QBO invoice carries ship-to address + per-line `TaxCodeRef` + customer exempt flag/reason; QBO returns `TxnTaxDetail`; app stores & asserts cent-parity; local `TaxAmount = Subtotal × TaxRate` is retired as a source of truth.

### Ruling #3 — Legal source-state whitelist (spine state machine)

**Design context (back-end audit F-033):** four spine state-transition handlers have missing or incomplete source-state guards. The HTTP machinery already returns 409 on an illegal transition; this ruling specifies the exact legal source-state sets for each transition.

**Governing principle:** past facts don't unwind. Received inventory, shipped goods, and applied payments are real-world events. The correct domain operation for reversing them is a dedicated reversal workflow (RMA/return, vendor debit memo, payment unapplication), not a state transition on the originating document. Any guard that blocks a cancel/void on a committed document is protecting this principle. This is also the line between **cancel remaining** (legal: drop the open commitment) and **reverse what happened** (needs a separate flow).

#### CancelSalesOrder

| Source state | Legal? | Behavior |
|---|---|---|
| Draft | ✓ Allow | No commitment; no GL impact |
| Pending (awaiting ack) | ✓ Allow | Cancel with customer notification |
| Confirmed / Open | ✓ Allow | Cancel; cascade WO hold/cancel to unstarted ops |
| PartiallyShipped | ✓ Allow — **cancel remainder only** | See §R3-note-1 below |
| FullyShipped | ✗ Hard-block 409 | All goods delivered; SO is a closed commitment |
| Invoiced (any portion) | ✗ Hard-block 409 | Financial record in QBO; only credit memo reverses this |
| Already Cancelled | Idempotent no-op | Re-cancel is a retry, not an error — silent success |

**§R3-note-1 — PartiallyShipped:** Cancel the *unshipped remainder* only. Shipped lines are permanent facts and stand. Correct outcome: SO status → **Short-Closed** (not "Cancelled" — that word implies nothing shipped). No reversal of shipment lines; if goods need to return, that is an RMA flow. A WO cascade (hold/cancel unstarted ops) is mandatory alongside this status change.

#### VoidInvoice

| Source state | Legal? | Behavior |
|---|---|---|
| Draft | ✗ Hard-block 409 | Drafts are deleted, not voided. Void is a financial reversal of a *posted* record; no QBO document to reverse. Return 409 with "use Delete." |
| Posted / Sent — zero payments applied | ✓ Allow | Primary legal path. Must enqueue QBO void. |
| Posted — any payment applied | ✗ Hard-block 409 | Block; surface named payments; offer "unapply then void" or "issue credit memo." |
| Fully Paid | ✗ Hard-block 409 | Settled. Credit memo + refund is the reversal path. |
| Already Voided | ✗ Hard-block 409 | Terminal. Not idempotent — re-voiding is an error, not a retry. |
| Credited (credit memo zeroed balance) | ✗ Hard-block 409 | Effectively settled. |

**Guard logic for VoidInvoice:** two-condition whitelist: `state == Posted AND payments_applied_total == 0`. Both must hold. Missing either is a high-severity spine bug.

#### CancelPurchaseOrder

| Source state | Legal? | Behavior |
|---|---|---|
| Draft | ✓ Allow | No commitment; cancel freely |
| Submitted / Sent (not yet acknowledged) | ✓ Allow | One-sided commitment; surface vendor-notification flag (informational, not a block) |
| Acknowledged (vendor committed, zero received) | ✓ Allow | Allow; flag that vendor notification is the shop's responsibility |
| PartiallyReceived — **no vendor bill** (GRNI only) | ✓ Allow-with-compensation | Cancel remainder; PO → Short-Closed; GRNI untouched. See §R3-note-2 |
| PartiallyReceived — **vendor bill matched or in-matching** for any received qty | ✗ Hard-block 409 | AP liability exists. Block: "Lines X have matched vendor bills — issue a debit memo first." Guard condition: `matched_bill_qty > 0` |
| Fully Received (any bill state) | ✗ Hard-block 409 | Nothing to cancel. Return 409: "All items received — use Close PO." |
| ShortClosed | Idempotent no-op | Cancel intent already fulfilled — silent success |
| Already Cancelled | Idempotent no-op | Silent success |
| Closed | ✗ Hard-block 409 | Terminal |

**§R3-note-2 — PartiallyReceived:** The disposition depends on whether a matched vendor bill exists — this is the key guard-shape difference vs. CancelSalesOrder.

**GRNI ≠ a posted AP liability.** Two distinct post-receipt states carry different dispositions:
- **GRNI only (Received-Not-Invoiced, no vendor bill):** a soft accrual (`Debit Inventory / Credit GRNI`). Represents an obligation to pay, but no AP document exists. This accrual resolves naturally when the vendor's bill arrives and is 3-way matched — even after a Short-Close. **Does not trigger a hard-block.** Disposition: Allow-with-compensation (cancel remainder, Short-Closed). No accrual reversal.
- **Matched/posted AP bill (3-way match in progress or completed):** real AP liability (`Debit GRNI / Credit AP`). Structural parallel to "Invoiced" on the SO side. **Hard-block 409.** Correct reversal is a debit memo, not a PO cancel.

**The guard condition is `matched_bill_qty > 0`, not `received_qty > 0`.** Those are different fields.

**Compensation for PartiallyReceived + no bill (atomic):**
1. Unreceived PO lines → Cancelled
2. PO status → **Short-Closed** (not "Cancelled" — that word implies nothing was received)
3. `expected_receipt_qty = 0` on cancelled lines
4. GRNI accrual for received lines: **untouched** — resolves via normal AP match when vendor bill arrives
5. No inventory write. No GL reversal. Received material already issued to a job is unaffected — independent fact.

If compensation writes cannot complete atomically → return 409 and surface the reason.

#### ReceiveItems (Goods Receipt against PO)

| Source state | Legal? | Behavior |
|---|---|---|
| Draft | ✗ Hard-block 409 | **Always.** Breaks three-way match; puts inventory on books with no authorization |
| Pending Approval | ✗ Hard-block 409 | Same; uncommitted intent |
| Approved / Open | ✓ Allow | Primary legal state |
| Partially Received | ✓ Allow | Continuing a partial delivery |
| Fully Received | ✗ Hard-block 409 (default) | Over-receipt requires explicit exception + supervisor approval; default block |
| Cancelled | ✗ Hard-block 409 | |
| Closed | ✗ Hard-block 409 | |

**§R3-note-3 — Draft hard-block is non-negotiable.** The correct pattern when goods arrive before PO approval is either (a) approve the PO first (rush-approval path) or (b) receive "without PO" as a distinct flow with elevated permission. Under no circumstance should the system silently treat a Draft as Approved.

---

### Ruling #4 — State-transition reversibility matrix (F-033, full matrix)

**Tags: backend-engineer (whitelist guard implementation), eng-lead (atomic compensation design, QBO void API contract)**

**The governing binary:**
- **Hard-block (409):** source state makes the transition categorically illegal. Return 409, no mutation. Real-world event cannot be undone, or auto-reversal would take an irreversible financial action the user has not explicitly authorized.
- **Allow-with-compensation:** transition is legal but must atomically trigger a compensating write. Compensation is mandatory — allow without it is a silent inconsistency bug. If compensating writes cannot complete atomically, return 409 and surface the reason.
- **Idempotent no-op:** already in target state; return success without re-executing. Distinct from 409.

#### VoidInvoice — priority-1 disposition (no source-state check exists today)

**Sub-question: voiding an invoice with a payment already applied — hard-block or allow-with-reversal?**

**Hard-block.** Auto-reversing a payment as a side effect of voiding is unsafe: (1) QBO's API rejects a void on an invoice with applied payments — the call fails, leaving the app half-mutated; (2) the payment may be bank-reconciled in a closed period, making reversal a period-adjustment requiring accountant intent; (3) a single remittance often covers multiple invoices — auto-unapplying it as a side effect of voiding one invoice breaks the others silently. The user must decide explicitly. Surface which payments are applied; offer two explicit exits — "unapply payment, then void" or "issue credit memo."

| Source state | Disposition |
|---|---|
| Draft | Hard-block 409 — use Delete |
| Posted, zero payments applied | Allow (primary legal path; enqueue QBO void) |
| Posted, any payment applied | Hard-block 409 — surface payments, offer unapply or credit memo |
| Fully Paid | Hard-block 409 |
| Already Voided | Hard-block 409 (not idempotent — re-voiding is an error) |
| Credited | Hard-block 409 |

#### Quote

| Transition | Illegal source states | Disposition |
|---|---|---|
| Send | Accepted, Converted, Rejected | Hard-block 409 |
| Send | Already Sent | Idempotent no-op |
| Accept | Draft, Rejected, Converted | Hard-block 409 |
| Accept | Already Accepted | Idempotent no-op |
| Reject | Draft, Accepted, Converted | Hard-block 409 |
| Reject | Already Rejected | Idempotent no-op |
| Convert-to-Order | Draft, Sent, Rejected, Expired | Hard-block 409 — must be Accepted |
| Convert-to-Order | Already Converted | Hard-block 409 (not idempotent — double-conversion creates duplicate SO) |

#### Sales Order

| Transition | Source | Disposition | Notes |
|---|---|---|---|
| Confirm | Already Confirmed, PartiallyShipped, Cancelled | Hard-block 409 | |
| Cancel | Draft, Pending, Confirmed | Allow | Cascade WO hold/cancel |
| Cancel | PartiallyShipped | Allow-with-compensation | Cancel remainder; SO → Short-Closed; WO cascade; shipped lines permanent |
| Cancel | FullyShipped, Invoiced | Hard-block 409 | |
| Cancel | Already Cancelled | Idempotent no-op | |

#### Shipment

| Transition | Source | Disposition | Notes |
|---|---|---|---|
| Ship (pick → shipped) | Already Shipped, Delivered, Cancelled | Hard-block 409 | Second shipment = new Shipment entity |
| Deliver | Not yet Shipped, Cancelled | Hard-block 409 | |
| Deliver | Already Delivered | Idempotent no-op | |
| Un-ship (void shipment) | Invoiced | Hard-block 409 — absolute | QBO invoice references this shipment; voiding without voiding invoice first creates unrecoverable COGS/revenue mismatch |
| Un-ship | Delivered | Hard-block 409 | Customer confirmed receipt; this is now an RMA |
| Un-ship | Shipped, not yet invoiced | Allow-with-compensation | Narrow window (data-entry error). Compensation (atomic): restore lot/qty to on-hand; reverse COGS accrual; decrement SO shipped qty; mark shipment Voided. Requires elevated permission + reason code. |

#### Invoice (full)

| Transition | Source | Disposition | Notes |
|---|---|---|---|
| Send | Voided, Cancelled | Hard-block 409 | |
| Send | Already Sent, Paid | Idempotent / Allow | Re-send is a notification action, not a financial state change |
| Void | *(see VoidInvoice table above)* | | |

#### Payment

| Transition | Source | Disposition | Notes |
|---|---|---|---|
| Apply | Invoice fully paid, Voided, Cancelled | Hard-block 409 | |
| Apply | Amount > invoice balance | Hard-block 409 | Require explicit over-payment workflow; do not silently create credit |
| Apply | Already applied at this amount | Idempotent no-op | Retry guard |
| Refund | Already refunded in full | Hard-block 409 | Not idempotent — re-refunding is an error |
| Refund | Amount > original payment | Hard-block 409 | |
| Refund | Partial (amount ≤ unapplied balance) | Allow | Standard partial refund |

#### Job / Work Order

| Transition | Source | Disposition | Notes |
|---|---|---|---|
| Advance to billable trigger stage | Nothing invoiceable (shipped − invoiced == 0) | Allow stage move, suppress invoice | Do not block workflow for an accounting edge case; emit no CreateInvoice event |
| Retreat past trigger stage, invoice already created | | Allow stage move — invoice stands | Stage retreat is operational; the invoice is not reversed. Block only re-triggering a second invoice on re-entry (idempotency guard on the invoice handler, not the stage move) |
| Close with negative WIP | | Hard-block 409 | Data integrity defect — material/labor on wrong job; must be resolved before close |
| Close with open unaccounted issuance | | Allow-with-warning | Flag open issuance; allow close and variance. Don't freeze production for accounting cleanup |
| Cancel with issued material | | Allow-with-compensation | Compensation: return issued material to inventory (lot-tracked) or flag as job-cancellation variance. Do not write off material silently |
| Re-open a closed job | | Allow-with-compensation | Compensation: reverse WIP-close entries, reopen associated WO ops. Flag for management review |

#### Atomicity note for eng-lead — three allow-with-compensation cases carry complex compensating writes

1. **Cancel PartiallyShipped SO:** touches SO line statuses, SO aggregate status (Short-Closed), and WO cascade. Must be atomic.
2. **Un-ship (void shipment, pre-invoice):** touches inventory lot/qty, COGS accrual, and SO shipped qty. All three must succeed or none should. If COGS reversal fails, the inventory restore must roll back.
3. **Cancel Job with issued material:** compensation is a lot-tracked warehouse return transaction (if material was merely issued) or a variance entry (if consumed as scrap). The handler must distinguish consumed vs. merely issued.

In all three: if compensating writes cannot complete atomically, return 409 and surface the reason — do not leave the entity in a half-compensated state.

### Ruling #5 — Default `tax_code` for labor/operation lines (F-032 migration)

**Context:** F-032 migration adds per-line `tax_code` (TAX/NON) to `invoice_lines` and `sales_order_lines` as the taxability input QBO AST consumes. Material-line default is settled (part-master drives taxability). This ruling covers labor/operation/service lines.

**Verdict: default labor/operation lines to TAX, not NON, for a fabrication job shop.**

**Why NON is wrong here:** The eng-lead's instinct ("labor is non-taxable by default") is correct for pure-service businesses. It is wrong for a fabrication shop. Fabrication labor that produces tangible personal property (TPP) is taxable in a significant number of US manufacturing states (CA, TX, NY, OH, MI, IL, and others) under the "true object" test: when the customer's purpose is acquiring a finished machined part, the entire transaction including labor is the sale of TPP. Defaulting NON asserts to QBO AST "this line is explicitly non-taxable" — AST then will not tax it regardless of jurisdiction. In a fabrication-taxing state this produces systematic under-collection on every labor line.

**Why TAX is correct:** TAX asserts "this line is eligible for jurisdiction-based tax determination." In states that don't tax fabrication labor, AST returns 0%. In states that do, it applies the rate. This is Ruling #2's ownership model working correctly: **the app asserts category, QBO AST determines rate and applicability.** NON overrides AST; TAX defers to it. For fabrication labor, deferring is correct.

**Line-type defaults:**

| Line type | Default | Rationale |
|---|---|---|
| Production operations (turning, milling, grinding, welding, assembly) | **TAX** | Fabrication labor producing TPP — defer to AST |
| Outside processing (heat treat, plating, OSP sent out) | **TAX** | True object is the treated part (TPP); OSP is part of the manufactured good's cost |
| Non-production service lines (engineering consultation, programming billed as a service) | **NON** | Pure service, no TPP produced — explicitly non-taxable in most jurisdictions |
| NRE / tooling charges | **TAX** (with override flag) | Tooling produces tangible property; TAX is the safer default; allow line-level override |

**If a single migration default must cover all operation/labor lines: TAX.** The shop's accountant can flag specific non-production service lines NON; correcting a TAX line down (AST returns 0% where exempt) is trivial. Correcting a NON line that silently under-taxed in a fabrication state shows up in year-end reconciliation, not day-to-day operation — the worst kind of defect.

**Error asymmetry:** TAX default + jurisdiction doesn't tax = AST returns 0%, no harm. NON default + jurisdiction taxes fabrication = under-collection, audit exposure, silent liability accumulation.
