# Forge — Spine Requirements & Definition of Done

**Owner:** `[BA]` · **Validation source:** `[DOM]` (Definition of Correct §A1–§A9) · **Updated:** 2026-05-21
**Status:** Living document. Sections marked `[STUB]` are placeholders that will be fleshed out as QA charters run. The estimating engine section (§2) is fully authored per DOM Ruling #10.

> **How to read this doc:** Each `REQ-` entry is a testable requirement tied to the Domain Specialist's invariant catalog (`DISCOVERY.md §2A` → `INV-` IDs) and to the AUDIT.md ledger (`F-###`). Every `REQ-` has a Definition of Done (DoD) that is the acceptance criterion eng-lead and QA use to close the work item. Gap findings that map to a `REQ-` live in `spine-gap-analysis.md` (`GAP-###`).

---

## Spine stage map

| Stage | REQ group | Invariants | Key gaps filed |
|-------|-----------|------------|---------------|
| Customer / Lead | REQ-CUST | INV-AR1 (upstream) | — |
| **Quote / Estimate** | **REQ-QUOTE** | **INV-Q1, Q2, Q3, Q4** | **F-028 (BLOCKER), GAP-QUOTE-01** |
| Sales Order | REQ-SO | INV-SO1, SO2 | F-033, F-034 |
| Job / Production | REQ-JOB | INV-J1, J2 | F-029 |
| Shop Floor | REQ-SF | INV-SF1, SF2, SF3 | — |
| Inventory | REQ-INV | INV-INV1–4 | F-030 |
| Shipment | REQ-SHIP | INV-SH1, SH2, SH3 | F-020, F-030 |
| Invoice | REQ-INVOICE | INV-IN1–4 | F-021, F-031, F-032 |
| Payment | REQ-PAY | INV-AR1 | F-026, F-027, F-035 |
| QBO Sync | REQ-QBO | INV-QBO1–3 | F-021 (BLOCKER) |
| Auth / Identity | REQ-AUTH | — | (auth audit separate) |

---

## §1 Customer / Lead `[STUB]`

> Full requirements to be authored during C1 charter run. Key invariant: customer record is the root of all A/R attribution (INV-AR1).

---

## §2 Quote / Estimate — Estimating Engine MVP

> **DOM Ruling #10 (2026-05-21):** F-028 (no estimating engine) is elevated to **BLOCKER, PRIMARY**. The quote is the spine's entry point and the cost baseline for every downstream margin calculation. These requirements are the acceptance criteria for the estimating-engine build. Validate all REQ-QUOTE-* items directly against Domain Specialist §A1 before marking any DoD closed.

### Context and current gap

The app today accepts `UnitPrice` as a manual entry on each quote line — there is no computation from cost inputs. The routing entity (`Operation`) carries `SetupMinutes`, `RunMinutesEach`, `RunMinutesLot`, `BurdenRate`, and work-center labor rates, but nothing assembles them into a price (`CreateQuote.cs:82` — verified 2026-05-20). This means every quote is a guess and the quoted-vs-actual margin (F-029) has no estimated baseline to compare against. Root cause and gap: `GAP-QUOTE-01` / `F-028`.

### REQ-QUOTE-01 — Cost buildup: labor and burden

**Statement:** Given a quote line for part P at quantity Q with routing R, the system shall compute a deterministic unit cost from the routing using the formula:

```
unit_labor_cost(Q) = (SetupMinutes / Q + RunMinutesEach + RunMinutesLot / lot_size)
                     × (WorkCenter.LaborRatePerHour / 60)

unit_burden_cost(Q) = (SetupMinutes / Q + RunMinutesEach + RunMinutesLot / lot_size)
                      × (WorkCenter.BurdenRatePerHour / 60)

total_labor_burden(Q) = Σ_ops [ unit_labor_cost_op(Q) + unit_burden_cost_op(Q) ]
```

**Rules:**
- Setup (`SetupMinutes`) is amortized over quantity Q — it is a one-time cost per run, not a per-unit cost. This is the single most common estimating error: quoting setup as per-unit doubles the cost at low quantities.
- `RunMinutesEach` is per-unit; `RunMinutesLot` is per-lot (divide by lot_size, default lot_size = Q unless explicitly overridden).
- If a work center has no labor/burden rate, the system shall surface a validation error — it shall not silently default to $0 (which would produce an invalid cost and distort every downstream margin).

**INV-Q3** (setup once not per-unit): `unit_labor_cost(Q=1) × 1 > unit_labor_cost(Q=10) × 10` when setup is present — i.e., total setup cost is fixed regardless of Q.

**DoD:**
- [ ] Given Op: Setup=60min, Run=2min/ea, WC.LaborRate=$60/hr — at Q=10: unit labor = (6+2) min × $1/min = $8.00/ea (not $7.00 if setup were omitted, not $10.00 if setup were per-unit).
- [ ] At Q=1: unit labor = (60+2) × $1 = $62.00. At Q=100: unit labor = (0.6+2) × $1 = $2.60. Monotonically non-increasing (INV-Q2).
- [ ] Missing WC rate → validation error surfaced to UI, quote line cannot save.
- [ ] Recomputing the same line with identical inputs produces the identical unit cost (INV-Q1 determinism).

---

### REQ-QUOTE-02 — Cost buildup: material

**Statement:** Given a quote line for part P at quantity Q, the system shall compute material cost from the BOM using:

```
material_cost_per_unit = Σ_bom_lines [
    (child_qty_per_parent × scrap_factor × uom_conversion_to_purchased_uom)
    × purchased_unit_cost
]
```

**Rules:**
- `scrap_factor` = `1 + scrap_rate` (e.g., 5% scrap → multiply by 1.05). Applied at the BOM line level, not at the quote level.
- `uom_conversion` bridges the BOM's design UOM (e.g., "inches") to the purchased UOM (e.g., "feet") via a defined conversion factor on the UOM pair. If no conversion exists, surface a validation error — do not silently pass through unconverted quantities.
- `purchased_unit_cost` resolves from the part's cost calculation or `manual_cost_override` (whichever is authoritative per the costing policy). If neither exists, the system shall block the estimate and surface "part has no cost" — not default to $0.
- Material cost is computed at the parent quantity (per unit of finished part), not at Q. Material scales linearly with Q (no setup amortization for material).

**DoD:**
- [ ] BOM line: 2 inches aluminum per part, scrap 10%, purchased in feet at $3/ft → material_cost = (2 in × 1.10 / 12 in/ft) × $3 = $0.55/ea. Deterministic recompute produces $0.55 every time.
- [ ] Part with NULL cost → validation error; quote line blocked.
- [ ] UOM without conversion defined → validation error; quote line blocked.
- [ ] Changing `purchased_unit_cost` and recomputing the quote updates the material cost correctly (INV-Q1).

---

### REQ-QUOTE-03 — Cost buildup: outside services (OSP)

**Statement:** The system shall support OSP line items on a quote representing work performed by a vendor (plating, heat treat, painting, etc.) with the following rules:

```
osp_unit_cost = MAX(vendor_unit_price × Q, vendor_minimum_charge) / Q
```

**Rules:**
- Vendor minimums are enforced at the quote line level. If the vendor charges a minimum of $50 and the quoted quantity produces a raw cost of $30, the effective cost is $50 / Q.
- At higher quantities the minimum may no longer bind — the system shall automatically use `vendor_unit_price × Q` once it exceeds the minimum.
- OSP cost is a pass-through: it contributes to total cost and therefore to margin, but is not marked up separately unless the user adds an explicit OSP margin override.
- The vendor and service type shall be captured on the OSP line item for downstream PO generation traceability.

**DoD:**
- [ ] Vendor min=$50, unit rate=$8, Q=5: effective cost = MAX(8×5=40, 50)/5 = $10.00/ea.
- [ ] Same, Q=10: effective cost = MAX(8×10=80, 50)/10 = $8.00/ea (minimum no longer binds).
- [ ] OSP cost flows into total_cost for margin calculation.
- [ ] Vendor reference captured and surfaced to PO creation path.

---

### REQ-QUOTE-04 — Quantity breaks and setup amortization

**Statement:** A quote shall support multiple quantity break tiers (e.g., Q=10, Q=25, Q=50, Q=100) with independently computed unit prices per tier. Unit prices shall be monotonically non-increasing as quantity increases, unless a genuine cost step occurs (e.g., a tooling charge that only applies at a specific tier).

**Rules:**
- Setup amortization is the primary driver of price reduction at higher quantities (REQ-QUOTE-01). The system shall correctly recompute `unit_labor_cost(Q)` at each break tier.
- If a user manually overrides a break price that violates monotonicity (e.g., Q=50 priced higher than Q=25 with no cost step justification), the system shall surface a warning — it shall not silently accept a price grid that a customer would correctly reject as inconsistent.
- NRE (non-recurring engineering) charges and tooling fees are counted once at the job level, not per unit. They appear as a fixed line on the quote and do not scale with Q.

**INV-Q2** (qty-break monotonicity): `unit_price(Qn) ≤ unit_price(Qn-1)` for all break tiers where no discrete cost step is explicitly justified.
**INV-Q4** (setup-vs-run separation): The system shall distinguish setup cost from run cost in the cost breakdown display so the customer (and the estimator) can see why high-Q orders are cheaper.

**DoD:**
- [ ] Three-tier quote (Q=10/25/100): unit price is non-increasing across tiers when costs are identical (INV-Q2).
- [ ] NRE tooling charge of $500 appears once on the quote, not multiplied by Q.
- [ ] Monotonicity violation → UI warning displayed; quote can still be saved with override and justification captured.
- [ ] Cost breakdown separates setup cost from run cost per operation per tier.

---

### REQ-QUOTE-05 — Margin-to-price conversion

**Statement:** Given a cost buildup (`total_unit_cost`) and a target margin percentage, the system shall compute the selling unit price using the **margin convention**:

```
unit_price = total_unit_cost / (1 − target_margin_pct)
```

**CRITICAL:** The margin convention is `margin = (price − cost) / price`. This is NOT the same as markup (`markup = (price − cost) / cost`). The system must enforce this distinction. A 40% target margin yields `price = cost / 0.60`, which is a 66.7% markup. Confusing these misprices every quote — a 40% markup would yield only a 28.6% margin.

**Rules:**
- The target margin percentage is entered by the estimator per quote line (or defaulted from a work-center or part-family default margin).
- The system shall display both the computed margin percent and the implied markup percent clearly so estimators understand what they are setting.
- Margin must be in range (0%, 100%) exclusive. A target margin of 100% is mathematically undefined (`price = cost / 0 = ∞`). The system shall reject 100% and surface a validation error.
- The system shall display `margin = (price − cost) / price` on the quote summary for every line and for the total, so the estimator can validate the target was achieved.

**DoD:**
- [ ] `cost = $100, target_margin = 40%` → `price = $100 / 0.60 = $166.67` (not $140.00). System displays `margin = ($166.67 − $100) / $166.67 = 40.0%`. ✓
- [ ] `cost = $100, target_margin = 40%` — the system also displays `markup = ($166.67 − $100) / $100 = 66.7%` as a secondary figure.
- [ ] `target_margin = 100%` → validation error.
- [ ] `target_margin = 0%` → `price = cost` (valid, zero-margin sale; user must confirm).

---

### REQ-QUOTE-06 — Quote total and line integrity

**Statement:** The quote total shall equal the sum of all line totals, and each line total shall equal `unit_price × quantity`. NRE/tooling charges are summed at face value (not per-unit).

```
quote_total = Σ_lines (unit_price × line_qty) + Σ_nre_charges
```

**INV-Q1** (deterministic recompute): Triggering a recompute of the quote with identical inputs (costs, rates, quantities, target margin) shall produce the identical `quote_total`. The system shall not accumulate rounding errors across recomputes.

**Rules:**
- `quote_total` is always computed — never stored as a mutable field that can drift from its component lines.
- If any input to a line changes (BOM cost update, rate change, UOM correction), the system shall flag the quote as `Stale` and require explicit recompute + re-accept before it can be converted to a Sales Order.
- Rounding: unit prices shall be rounded to the nearest cent at the line level; totals are the sum of rounded line totals (not a re-round of an unrounded total).

**DoD:**
- [ ] Quote with 3 lines: sum of line totals matches displayed `quote_total` to the cent.
- [ ] BOM cost change after quote creation → quote marked `Stale`; conversion to SO blocked until recomputed and re-accepted.
- [ ] Recompute 5× with same inputs → identical `quote_total` each time (INV-Q1).

---

### REQ-QUOTE-07 — Downstream couplings

**Statement:** An accepted quote feeds three downstream consumers and these couplings are enforced:

**A. Price lock → Sales Order (INV-SO1)**
When a quote is converted to a Sales Order, `SO.line.unit_price` shall equal `Quote.line.unit_price` at the moment of conversion. This price is immutable on the SO — it cannot be edited after conversion. Subsequent quote recomputes do not affect a converted SO.

**DoD-A:**
- [ ] Convert quote at $166.67/ea → SO shows $166.67/ea. Edit quote to $180/ea and recompute → SO still shows $166.67/ea. (REQ-SO-01 / INV-SO1)

**B. Estimated cost baseline → Job (INV-J1 / F-029)**
When a job is created from a SO line, the job's `EstimatedMaterialCost`, `EstimatedLaborCost`, `EstimatedBurdenCost`, and `EstimatedSubcontractCost` shall be populated from the accepted quote's cost breakdown — not left NULL (current defect: F-029).

**DoD-B:**
- [ ] Job created from SO: `Job.EstimatedMaterialCost > 0`, `Job.EstimatedLaborCost > 0` (where routing has ops). `Job.EstimatedMarginPercent = (QuotedPrice − EstimatedTotalCost) / QuotedPrice × 100` is computable and non-zero.

**C. Quoted-vs-actual margin (INV-J2)**
With estimated costs populated (DoD-B), the job cost summary shall compute:
```
ActualMarginPercent = (QuotedPrice − ActualTotalCost) / QuotedPrice × 100
VariancePercent     = ActualMarginPercent − EstimatedMarginPercent
```
Both figures shall appear on the job cost report when the job has actual cost entries (time, material issues).

**DoD-C:**
- [ ] Job with estimated margin 40% and actual costs → job cost report shows estimated margin 40%, actual margin X%, variance Y%. All three computable without NULL errors.

---

### Out of MVP scope — fast-follow items

The following are explicitly deferred. They should not be built in the MVP sprint. File as GAP items in `spine-gap-analysis.md` with P2 priority.

| Feature | Reason deferred |
|---|---|
| Templated / historical-cost estimating | Requires a cost history corpus; MVP must build the cost engine first |
| What-if scenario comparison | UI complexity; core engine must be stable first |
| Estimating analytics (win rate, quote-to-SO ratio, margin distribution) | Requires converted quote history to exist |
| Win-rate-feedback pricing (adjust margins based on win/loss patterns) | Requires analytics corpus |

---

### F-028 acceptance summary for eng-lead

F-028 is a **P0 BLOCKER**. The estimating engine build closes it. Acceptance requires all six REQ-QUOTE-01 through REQ-QUOTE-06 DoD checklists to be green, plus REQ-QUOTE-07 downstream couplings (price lock + estimated cost baseline). QA validates against DOM §A1 invariants INV-Q1 through INV-Q4 and the REQ-QUOTE-07 DoD items. The domain specialist is the final validation oracle.

**Schema additions the engine requires (flag for eng-lead sizing):**
- `WorkCenter.LaborRatePerHour` and `WorkCenter.BurdenRatePerHour` — verify these exist or add them.
- `BomEntry.ScrapRate` (decimal, per-line) — verify exists or add.
- `BomEntry.UomConversionFactor` or a UOM conversion table.
- `QuoteLine.TargetMarginPct` — new field.
- `QuoteLine.EstimatedUnitCost` — computed/stored cost breakdown.
- `QuoteLine.CostBreakdown` — JSON or child table holding `labor`, `burden`, `material`, `osp` components.
- `Quote.Status` enum needs `Stale` value (REQ-QUOTE-06).
- `Job.EstimatedMaterialCost`, `EstimatedLaborCost`, `EstimatedBurdenCost`, `EstimatedSubcontractCost` — exist on entity (Job.cs:49-56) but are never populated in production code (F-029). The estimating engine populates these on job creation from SO.

---

## §3 Sales Order `[STUB]`

> Key requirements: price lock from accepted quote (REQ-SO-01 / INV-SO1); state machine whitelist guards (REQ-SO-02 / INV-SO2 — see F-033); Short-Closed terminal state (F-034).

---

## §4 Job / Production `[STUB]`

> Key requirements: estimated cost baseline populated on job release (REQ-JOB-02 — see F-029, depends on F-028); WIP closure invariant INV-J3 (proposed — BA H-008).

---

## §5 Shop Floor `[STUB]`

> Key requirements: kanban stage progression guards; time clock tied to job/op; stage-trigger idempotency (F-021 related).

---

## §6 Inventory `[STUB]`

> Key requirements: on_hand = Σ receipts − Σ issues − Σ shipments (INV-INV1 — see F-030); negative on_hand blocked (INV-INV2); lot/serial capture at issue (INV-INV3).

---

## §7 Shipment `[STUB]`

> Key requirements: shipped ≤ ordered per line (INV-SH1 — see F-020); inventory relieved on ship-confirm (INV-SH2 — see F-030); idempotency on re-confirm (INV-SH3).

---

## §8 Invoice `[STUB]`

> Key requirements: invoiced ≤ shipped (INV-IN1 — see F-021); invoice generated from shipment at SO-locked price (INV-IN2 — GAP-INVOICE-01); QBO AST is sole tax authority (F-031); real Invoice syncs to QBO (F-021 BLOCKER).

---

## §9 Payment `[STUB]`

> Key requirements: applied ≤ open balance (INV-AR1 — see F-026, F-035); no over-application under concurrency (F-026); credit-memo model for overpayment (F-035 gap).

---

## §10 QBO Sync `[STUB]`

> Key requirements: customer/invoice/payment push idempotent on retry (INV-QBO1 — see F-021 BLOCKER); amount parity to the cent (INV-QBO2/QBO3 — deferred to real-QB-sandbox milestone per §6 Known Coverage Holes).

---

## §11 Auth / Identity `[STUB]`

> Cross-cutting PRIMARY scope. Key items: MFA-bypass (F-034 confirmed live per auth-surface audit); no-lockout. Requirements to be authored from auth-surface audit deliverable.

---

*Next: as QA charters run, promote stubs to full REQ sections. Tag `[DOM]` for validation before marking any DoD closed.*
