# F-028 Estimating Engine — Interface Contract (`[ENG-LEAD]` 2026-05-21)

**Status:** Contract published to unblock the FE thin slice (#12). Internal math resolves
against the BA's MVP REQ + DoD (in flight) — **the contract below is stable regardless of how
those open questions resolve** (they affect engine internals, not the DTO shape), which is
exactly why FE can build against it now without building on guesses.

**Scope:** the bounded MVP per DOM Ruling #10. NOT genealogy, NOT templated/historical
estimating, NOT what-if/analytics/win-rate. Build to this and no more.

---

## 1. Architectural shape — pure function, no side effects

```
IEstimatingEngine.Compute(EstimateRequest request) → EstimateResult
```

The engine is a **pure, synchronous, side-effect-free function.** It touches no DB, no clock,
no randomness. A MediatR handler loads the part's routing + rates + material tiers, materializes
them into the `EstimateRequest` snapshot, calls `Compute`, and decides whether to persist the
result as Quote/Estimate lines. Keeping the engine pure is what makes the §A1 invariants —
especially **deterministic stable recompute** — provable and unit-testable without a database.

This also keeps pricing **server-authoritative** (consistent with INV-Q2): the FE renders inputs
and displays the result; it computes nothing.

---

## 2. Request DTO (the snapshot the engine consumes)

```
EstimateRequest {
  PartId: int
  BreakQuantities: int[]            // ascending; one full rollup computed per break
  Pricing: {
    Mode: "Margin" | "Markup"       // TYPED + EXCLUSIVE — never a bare "markup %"
    Value: decimal                   // 0 ≤ margin < 1 ; markup ≥ 0
  }
  Operations: [ {
    StepNumber: int
    WorkCenterId: int?
    SetupMinutes: decimal            // once per lot (fixed → amortizes over qty)
    RunMinutesEach: decimal          // scales with yield-adjusted qty
    RunMinutesLot: decimal           // once per lot
    ScrapFactor: decimal             // 0..1
    LaborRatePerHour: decimal        // resolved rate (see §6 open Q on precedence)
    BurdenRatePerHour: decimal
    IsSubcontract: bool
    SubcontractUnitCost: decimal?    // OSP
    SubcontractMinimum: decimal?     // vendor minimum charge
    Materials: [ {
      PartId: int
      QtyPerUnit: decimal
      DropFactor: decimal            // 0..1, additive waste
      Uom: string                    // converted to stocking UoM
      UnitCost: decimal              // resolved from VendorPartPriceTier
    } ]
  } ]
  NreLines: [ { Description: string, Amount: decimal } ]   // tooling/NRE — counted ONCE
}
```

## 3. Result DTO (what the FE renders)

```
EstimateResult {
  Breaks: [ {
    Quantity: int
    Cost: {
      LaborCost, BurdenCost, MaterialCost, OspCost, NreCost, TotalCost: decimal
    }
    UnitCost: decimal                // TotalCost / Quantity
    UnitPrice: decimal               // derived via Pricing.Mode (§5)
    ExtendedPrice: decimal           // UnitPrice × Quantity
    EffectiveMargin: decimal         // recomputed (price−cost)/price, for display + assertion
  } ]
  InputHash: string                  // SHA256 of normalized inputs — proves stable recompute
  Warnings: string[]                 // monotonicity flag, missing rate, tier gap, etc.
}
```

---

## 4. Cost math (engine internals — subject to BA REQ refinement)

Per operation, at break quantity `Q`:
- **Yield-adjusted qty:** `Qeff = Q / (1 − ScrapFactor)`  *(scrap convention — see open Q #1)*
- **Labor minutes:** `SetupMinutes + RunMinutesEach × Qeff + RunMinutesLot`
- **Labor cost:** `(minutes / 60) × LaborRatePerHour`
- **Burden cost:** `(minutes / 60) × BurdenRatePerHour`
- **OSP (if `IsSubcontract`):** `max(SubcontractUnitCost × Qeff, SubcontractMinimum)`

Per material line, at `Q`:
- **Required:** `QtyPerUnit × Qeff × (1 + DropFactor)`, UoM-converted
- **Cost:** `Required × UnitCost`

Lot-level: **NRE/tooling counted exactly once** — not per unit, not multiplied by break qty.

**Total cost at break `Q`:** `Σops(labor+burden+OSP) + Σmaterials(cost) + NRE`

## 5. Margin vs markup — never interchanged (§A1)

- **Margin:** `price = cost / (1 − margin)`
- **Markup:** `price = cost × (1 + markup)`

`Pricing.Mode` is a typed discriminated input so the wrong formula can never be silently applied.
`EffectiveMargin` is always recomputed on output so the displayed margin is the *realized* one,
not the input.

## 6. Invariant guarantees the engine asserts

1. **Deterministic stable recompute** — pure function of inputs; same inputs → byte-identical
   output. `InputHash` lets the caller/tests verify this.
2. **Qty-break monotonicity** — `UnitPrice` is non-increasing as `BreakQuantities` ascend (setup
   amortizes). A violation indicates a data error (e.g., tier price inversion) → emitted as a
   `Warning`, not silently shipped.
3. **`TotalCost = Σ lines`, NRE counted once.**
4. **margin ≠ markup** — enforced by typing (§5).

---

## 7. FE thin slice (~1wk) — what it builds against this contract

Renders: routing/material input grid → **Compute** → breaks table (cost breakdown + unit price +
extended price per qty break) + realized-margin display + warnings panel. **No client-side math** —
it POSTs an `EstimateRequest`-shaped payload and renders `EstimateResult`. The contract is frozen;
FE does not wait on the BA REQ.

## 8. Open questions deferred to the BA MVP REQ (NOT guessed)

These affect engine internals only — **DTO shape is stable regardless**, so they do not block FE:

1. **Scrap convention:** divide-by-yield `Q/(1−scrap)` vs additive `Q×(1+scrap)`?
2. **Rate precedence:** `WorkCenter.LaborCostPerHour`/`BurdenRatePerHour` vs `Operation.LaborRate`/
   `BurdenRate` — which is authoritative; is op-level an override or a snapshot?
3. **OSP cost basis:** `SubcontractCost` per-unit vs per-lot; vendor minimum source.
4. **Material unit-cost selection:** which `VendorPartPriceTier` (preferred vendor / lowest /
   purchase-qty-matched)?
5. **`RunMinutesLot`** once-per-lot in addition to per-each — confirm.
6. **Rounding:** per-line vs per-total, decimal places (model is `decimal(18,4)`).

When the REQ lands, these resolve inside `Compute`; the contract above does not change.

---

## 9. Persisted form — `QuoteLine.CostBreakdown` (for the FE thin slice to mock against)

The engine's per-line cost components persist on each quote line as `QuoteLine.CostBreakdown`
(JSON or child table — REQ §292). This is the per-line projection of `EstimateResult.Breaks[].Cost`,
**minus NRE** (NRE/tooling is counted once at the estimate level, never folded per-line — §A1):

```json
QuoteLine.CostBreakdown = {
  "labor":    0.00,   // decimal(18,4)
  "burden":   0.00,
  "material": 0.00,
  "osp":      0.00,
  "total":    0.00    // = labor + burden + material + osp
}
```

The quote line itself also carries `unitPrice`, `extendedPrice`, and `effectiveMargin`
(from `EstimateResult.Breaks[]`). **NRE/tooling** is a separate estimate-level line, not inside
any `CostBreakdown`.

**FE thin slice builds against:** `EstimateResult` (the breaks table — §3) for the compute preview,
and `QuoteLine.CostBreakdown` (above) for the saved per-line detail. Both shapes are frozen.
Mock these directly; the engine internals do not affect either shape.

---

## 10. Compute endpoint — the `useMock=false` flip target (`[ENG-LEAD]` 2026-05-21)

`POST /api/v1/estimates/compute`

A **thin client contract**: FE sends identifiers; the server materializes the routing/rate/tier
snapshot from the part and invokes the pure engine. FE does **not** send the `Operations[]`
snapshot — that is the engine's *internal* input (§2), materialized server-side.

```
Request — EstimateComputeRequest {
  partId: int,
  breakQuantities: int[],                       // ascending
  pricing: { mode: "Margin" | "Markup", value: decimal }
}

Response 200 — EstimateResult                   // the §3 shape FE ALREADY mocks — unchanged
  (ValidationErrors empty on 200)

Response 422 — blocking validation (REQ-QUOTE-01/02/05) {
  validationErrors: [ { code, message, context? } ]
}
  codes: MISSING_WORKCENTER_RATE | MISSING_UOM_CONVERSION
       | MISSING_PART_COST | MARGIN_OUT_OF_RANGE
```

The 422 cases are **hard blocks** (quote line cannot save), not warnings — the engine never
silently defaults a missing rate/cost to $0 (REQ-QUOTE-01/02 DoD).

**The flip is clean because the 200 response shape is identical to the mock.** FE: set
`useMock=false`, POST `EstimateComputeRequest`, render `EstimateResult` on 200 (existing binding,
no change), surface `validationErrors` on 422. No response-shape migration on the FE side.

**No DB migration** is required for this endpoint — it reads existing `Operation`/`WorkCenter`/
`OperationMaterial`/`VendorPart`/`VendorPartPriceTier` and returns a computed result. Persisting
`CostBreakdown` onto the quote line (§9) is a *separate, later* migration routed through DevOps
serialization — it does not gate the compute endpoint or the FE flip.

