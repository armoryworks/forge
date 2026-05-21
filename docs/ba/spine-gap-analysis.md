# Forge — Spine Gap Analysis

**Owner:** `[BA]` · **Validation:** `[DOM]` · **Updated:** 2026-05-21
**North star scope:** PRIMARY (quote-to-cash spine + QBO sync + Auth). Gaps are prioritized against this scope — DEFER-scope gaps from `docs/gap-inventory.md` are not duplicated here.

> **Taxonomy:** Type = `GAP` (missing) or `BUG` (wrong). Priority = `[ORCH]`-owned. Severity = `[QA]`-owned. All spine GAPare cross-referenced to AUDIT.md (`F-###`) and to `spine-requirements-and-dod.md` (`REQ-###`).

---

## P0 — SHOWSTOPPER (blocks ship)

### GAP-QUOTE-01 · No estimating/pricing engine — quotes are manual dollar containers

**REQ refs:** REQ-QUOTE-01 through REQ-QUOTE-07
**AUDIT ref:** F-028 (BLOCKER, P0 per DOM Ruling #10 2026-05-21)
**Invariants violated:** INV-Q1 (determinism), INV-Q2 (monotonicity), INV-Q3 (setup once), INV-Q4 (setup-vs-run separation)
**Root cause (code-verified 2026-05-20):** `CreateQuote.cs:82` sums `Quantity × UnitPrice` — `UnitPrice` is manually entered. `Operation` entity carries `SetupMinutes`, `RunMinutesEach`, `RunMinutesLot`, `BurdenRate` but nothing assembles them into a price. `ICpqService.CalculatePrice()` interface exists; only mock implementation, returns `BasePrice` with no computation.
**Downstream impact:** F-029 (estimated costs never populated → margin reports garbage), F-003 (dashboard shows $0 revenue). The entire quoted-vs-actual margin capability depends on this engine existing.
**DoD:** All six REQ-QUOTE-01–06 DoD checklists green + REQ-QUOTE-07 downstream couplings (price lock + job estimated-cost baseline). Validated by `[DOM]` against §A1.
**Fast-follow (out of MVP):** Templated estimating, what-if scenarios, estimating analytics, win-rate-feedback pricing.

---

### GAP-INVOICE-01 · No "invoice from shipment at SO-locked price" handler

**REQ refs:** REQ-INVOICE-01 (stub — §8)
**AUDIT ref:** F-021 (BLOCKER, P0 ratified by `[ORCH]` 2026-05-21) — note: F-021 covers the BUG (broken automation); this GAP covers the missing automated flow.
**Invariant:** INV-IN1 (`invoiced ≤ shipped`), INV-IN2 (invoice amount = SO-locked price × shipped qty)
**Description:** There is no handler that, given a shipment, generates an invoice at `SO.line.unit_price × shipped_qty`. The existing `CreateInvoiceFromJob` (MoveJobStage path) produces a `$0` placeholder. `CreateInvoice` is fully manual. The result: revenue is never captured automatically; the `invoiced ≤ shipped` invariant has no enforced automation path.
**DoD:** An "invoice from shipment" action (or automatic trigger on ship-confirm) creates an invoice with lines at SO-locked unit prices × shipped quantities; `invoiced_qty ≤ shipped_qty` enforced; the resulting invoice enqueues to QBO sync (not a $0 placeholder).

---

## P1 — CRITICAL (day-one customer demand)

### GAP-JOB-01 · Job estimated costs never populated from quote

**REQ refs:** REQ-JOB-02 (stub — §4), REQ-QUOTE-07-B
**AUDIT ref:** F-029 (MAJOR, P1)
**Invariant:** INV-J1 (job created with estimated cost baseline)
**Description:** `Job.EstimatedMaterialCost`, `EstimatedLaborCost`, `EstimatedBurdenCost`, `EstimatedSubcontractCost` default to 0 in production — only the dev seed populates them. Estimated-vs-actual margin is unmeasurable. **Depends on GAP-QUOTE-01** (the engine must exist before it can populate estimated costs).
**DoD:** On job creation from SO line, estimated costs populated from accepted quote's cost breakdown (REQ-QUOTE-07-B DoD).

---

### GAP-SHIP-02 · Shipment does not relieve inventory or recognize COGS

**REQ refs:** REQ-SHIP-02 (stub — §7), REQ-INV-01
**AUDIT ref:** F-030 (BLOCKER, P0 — severity already elevated; listing here for GAP cross-reference)
**Invariant:** INV-SH2 (ship-confirm relieves inventory exactly once), INV-INV1 (on_hand includes −Σshipments)
**Description:** `ShipShipment.cs` and all pick/pack handlers never decrement `bin_contents`. On-hand overstates by everything ever shipped. No COGS recognized at ownership transfer.
**DoD:** Ship-confirm decrements `bin_contents` idempotently (`inventory_relieved_at` set-once); `on_hand = Σreceipts − Σissues − Σshipments` holds (INV-INV1); COGS journal entry created.

---

### GAP-INVOICE-02 · Per-line taxability code missing — QBO AST will mis-tax mixed invoices

**REQ refs:** REQ-INVOICE-02 (stub — §8)
**AUDIT ref:** F-032 (MAJOR, P1)
**Description:** `InvoiceLine` and `SalesOrderLine` have no `tax_code` field. QBO AST requires per-line TAX/NON designation to correctly tax mixed invoices (taxable material + non-taxable labor/services). Without it, all lines default to taxable in QBO. **Prerequisite for F-031 fix.**
**DoD:** `tax_code` column on `invoice_lines` and `sales_order_lines`; propagated from part master; QBO payload includes per-line tax code.

---

### GAP-INVOICE-03 · Exemption cert expiry not modeled — expired certs silently continue

**REQ refs:** REQ-INVOICE-02
**AUDIT ref:** F-032 (combined)
**Description:** `Customer.TaxExemptionId` and `IsTaxExempt` exist; `ExemptionExpiryDate` does not. No expiry check or alert.
**DoD:** `exemption_expiry_date` on `customers`; background job alerts on approaching/expired certs; cert expiry blocks exempt status after expiry date.

---

### GAP-SO-01 · Short-Closed terminal state absent from SO and PO status enums

**REQ refs:** REQ-SO-03 (stub — §3)
**AUDIT ref:** F-034 (MAJOR, P2 — but prerequisite for cancel-remainder Wave-1 work, making it effectively P1 as a dependency)
**Description:** `SalesOrderStatus` and `PurchaseOrderStatus` have no `ShortClosed` value. Cancel-remainder compensation (F-033 fix) cannot be correctly implemented without it — transitions land in `Cancelled`, corrupting fulfillment reporting.
**DoD:** `ShortClosed` added to both enums; migration applied; report filters and A/R aging handle `ShortClosed` as closed-but-revenue-bearing (not voided).

---

## P2 — IMPORTANT (impacts correctness; fixable post-launch with workaround)

### GAP-INVOICE-04 · Credit-memo / overpayment model absent

**REQ refs:** REQ-PAY-02 (stub — §9)
**AUDIT ref:** F-035 (MAJOR, P1 — listed here for GAP cross-reference on the model gap)
**Description:** No `customer_credits` or `credit_memos` entity. Overpayments have nowhere to land except as an `invoiced > total` violation. QBO supports credit memos as first-class entities; the app has no local analog to sync.
**DoD:** `customer_credits` entity (amount, source payment, customer FK, applied/unapplied status); overpayment flow routes excess to credit on account; QBO sync includes credit memo entity type.

---

## Fast-follow items (OUT of MVP — P3/P4)

| GAP | Description | Scope |
|-----|-------------|-------|
| GAP-QUOTE-02 | Templated / historical-cost estimating | P3 |
| GAP-QUOTE-03 | What-if scenario comparison on quotes | P3 |
| GAP-QUOTE-04 | Estimating analytics (win rate, margin distribution) | P3 |
| GAP-QUOTE-05 | Win-rate-feedback pricing | P4 |
| GAP-JOB-02 | WIP closure invariant (INV-J3) — job-cost ledger closes to ~$0 at job completion | P3 |

---

*As QA charters surface new gaps, append here with REQ reference and AUDIT finding cross-link.*
