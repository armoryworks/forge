---
title: UoM Cost Connective Tissue (purchase-pack → per-unit cost → BOM)
type: delivery
status: pending
id: uom-cost-connective-tissue
owner:
updated: 2026-05-28
---

# UoM Cost Connective Tissue

> **Status: PENDING — design proposal for review. No code yet.** This documents the gap,
> what already exists, a recommended model, and the open decisions that need Dan's call
> before implementation. Raised from client notes (2026-05-28).

## The client's scenario

> "The vendor may not sell specific parts on a per-unit basis — they may sell a package of
> 100 — but in a BOM you are only using *x* of them (1 to N). Then the cost basis changes:
> a bag of 100 costs $12, the individual part is $0.12. There has to be some connective
> tissue that is fairly comprehensive between purchase order, part, and BOM."

Concretely: **buying UoM ≠ consuming UoM**, and the **cost must convert** along that chain.
Buy a bag (1 bag = 100 each, $12/bag); stock + consume in *each* ($0.12/each); a BOM that
uses 3 each should cost 3 × $0.12 = $0.36.

## What already exists (do NOT rebuild)

The hard infrastructure is already in place — this is the good news. (File paths are current
as of the 2026-05-28 exploration; re-verify the exact lines before coding.)

| Capability | Where | State |
|---|---|---|
| `UnitOfMeasure` entity (Code/Name/Symbol, `UomCategory`, base-unit flag, decimal places) | `forge.core/Entities/UnitOfMeasure.cs` | ✅ |
| `UomConversion` (FromUom→ToUom, factor, **`PartId` for part-specific**, `IsReversible`) | `forge.core/Entities/UomConversion.cs` | ✅ |
| `UomService.ConvertAsync` / `TryConvertAsync` (part-specific + global, bidirectional) | `forge.data/Services/UomService.cs` | ✅ |
| `Part.StockUomId` / `PurchaseUomId` / `SalesUomId` | `forge.core/Entities/Part.cs` | ✅ |
| UoM capture at part creation/edit (stock/purchase/sales pickers) | `forge-ui/.../parts/components/part-clusters/part-uom-cluster/` | ✅ |
| `VendorPart.PackSize` + `MinOrderQty` | `forge.core/Entities/VendorPart.cs` | ✅ |
| Auto-PO **rounds order qty up to pack multiples** (need 3, pack 100 → orders 100) | `forge.api/Jobs/AutoPurchaseOrderJob.cs` | ✅ |
| `BOMEntry.UomId` (consumption UoM column) | `forge.core/Entities/BOMEntry.cs` | ✅ (entity only) |
| `PurchaseOrderLine.UomId` + decimal qty | `forge.core/Entities/PurchaseOrderLine.cs` | ✅ |
| `VendorPartPriceTier` (UnitPrice, MinQuantity, Currency, FreightIncluded) | `forge.core/Entities/VendorPartPriceTier.cs` | ✅ |

**The conversion engine and the UoM fields are done.** The missing piece is specifically the
**cost half**: nothing divides pack price by pack size to get per-unit cost, and nothing
threads that cost from the vendor tier → PO → BOM.

## The gap (what's missing)

1. **Ambiguous price basis.** `VendorPartPriceTier.UnitPrice` has no declared unit — is "$12"
   per each or per pack? `VendorPart.PackSize` is dimensionless — is "100" each, lb, kg?
2. **No cost-per-unit derivation.** `$12 ÷ 100 = $0.12/each` is computed nowhere.
   `PartLandedCostService` and `PartPricingResolver` assume the PO unit price is already
   per-each.
3. **BOM consumption UoM not surfaced.** `BOMEntry.UomId` exists on the entity but the BOM
   editor UI doesn't expose a picker; `CreateBOMEntryRequestModel` has no UoM field — so BOM
   always implicitly consumes in the component's stock UoM.
4. **No cost rollup / preview.** No "≈ $0.12/ea" shown beside a $12 pack tier; no BOM material
   cost rollup that uses the derived per-unit cost.

## Recommended model

**Define the contract first (this is mostly a derivation problem, not a schema problem):**

- `Part.PurchaseUomId` = the UoM you buy in (e.g. **BAG**). `Part.StockUomId` = the UoM you
  stock and consume in (e.g. **EA**).
- `VendorPart.PackSize` = **how many stock units are in one purchase unit, for this vendor**
  (e.g. 100 EA per BAG). It stays vendor-scoped because two vendors may pack the same part
  differently (bags of 100 vs 50).
- `VendorPartPriceTier.UnitPrice` = price **per purchase unit** (per BAG).
- **Derived:** `costPerStockUnit = tier.UnitPrice ÷ PackSize` (→ $12 ÷ 100 = $0.12/EA). The
  existing part-specific `UomConversion` (1 BAG = 100 EA) is the same fact expressed in the
  conversion engine, so `UomService` can validate/round-trip it; `PackSize` is the vendor's
  concrete instance of that factor.

> ⚠️ This assumes **one `PackSize` per vendor-part**, which holds only if a vendor offers the
> part in a single pack. If one vendor sells multiple pack sizes (bag of 100 *and* drum of 5000),
> the model needs a pack-option level — see [Multiple pack sizes per vendor](#multiple-pack-sizes-per-vendor-raised-in-review)
> below; it changes both the schema and the derivation.

**New derivation service (the connective tissue):** a small `VendorCostResolver` (or extend
the existing `PartSourcingResolver`) exposing:
- `GetCostPerStockUnitAsync(partId, requestedQty)` → resolves preferred `VendorPart` + the
  applicable `VendorPartPriceTier` (by `MinQuantity`) + `PackSize` → returns cost in the
  part's stock UoM. **Bidirectional:** also `GetPackPriceFromUnitCost(...)`.

**Threading:**
- **PO line:** `PurchaseOrderLine.UnitPrice` is interpreted **per its `UomId`**. If `UomId =
  BAG`, the price is per bag and `OrderedQuantity` is in bags; `PartLandedCostService` must
  become UoM-aware (convert to per-stock-unit via `PackSize`/conversion before landed-cost
  math). This is the one existing service that needs a correctness fix.
- **BOM rollup:** BOM line cost = `consumptionQty (stock units) × costPerStockUnit`. Surface a
  rolled-up material cost on the part.

**UI:**
- Surface `BOMEntry.UomId` in the BOM editor (UoM select; default = component's stock UoM).
- Show a derived per-unit preview next to pack pricing on the vendor price-tier surface
  ("$12 / bag of 100  ≈  $0.12 / ea").
- (Optional) a part cost card showing rolled-up material cost from the BOM.

## Multiple pack sizes per vendor (raised in review)

**The current model can't represent this.** `VendorPartConfiguration` puts a **unique index on
`(VendorId, PartId)`**, so a vendor has exactly one `VendorPart` row per part — and therefore one
`PackSize`. `VendorPartPriceTier` rows are **quantity breaks** keyed by `MinQuantity`
("$5/ea @ 1–99, $4.50 @ 100–499"), *not* pack sizes. So "the same vendor sells widget-X as a bag
of 100 **and** a drum of 5000" has nowhere to live. (The config comment suggests "model as a
vendor alternate part on a separate row," but the unique index blocks exactly that — the
suggested workaround can't be inserted.)

Three orthogonal axes are collapsed today:

1. **Pack configuration** — *which* purchasable SKU (bag-100, drum-5000). No home today.
2. **Quantity-break pricing** — buy ≥N of a *chosen* pack, pay less. Today's `VendorPartPriceTier`.
3. **Vendor↔part relationship** — AVL approval, preferred flag, lead time, certs. Today's `VendorPart`.

**Recommended: introduce a pack-option level.** Add `VendorPartPackOption` as a child of
`VendorPart` — `{ PackUomId, PackSize, VendorSku?, MinOrderQty }` — and **reparent
`VendorPartPriceTier` from `VendorPart` to the pack option**:

```
VendorPart (vendor↔part: AVL, preferred, lead time, certs)
 ├─ PackOption "bag of 100"   (PackSize 100, SKU ABC-100)  ── tiers: qty-break pricing
 ├─ PackOption "bag of 500"   (PackSize 500, SKU ABC-500)  ── tiers: …
 └─ PackOption "drum of 5000" (PackSize 5000)              ── tiers: …
```

Rejected alternatives:
- **Drop the `(vendor,part)` unique index + multiple `VendorPart` rows** (one per pack):
  duplicates AVL/cert/lead-time/preferred metadata across rows and makes "preferred vendor for
  this part" ambiguous (preferred *which* pack?).
- **Put `PackSize`/`PackUom` on each `VendorPartPriceTier`:** conflates pack choice with volume
  discounts — you lose "bag of 100, AND a discount when buying 50 bags."

**Consequence for the cost derivation:** with multiple packs, the cheapest *per-unit* option
**depends on the quantity needed** (drum @ $0.08/ea is cheaper per unit but forces buying 5000;
bag @ $0.12/ea suits small runs). So `GetCostPerStockUnitAsync(partId, qty)` must either (a) pick
the optimal pack option for `qty`, or (b) take an explicit pack-option choice from the buyer. PO
lines and auto-PO pack-rounding would then reference a **pack option**, not just the vendor-part.
This is meaningfully bigger than the single-pack derivation and is likely its own phase.

## Open decisions (need Dan's call before coding)

1. **Confirm the contract:** `tier.UnitPrice` is *per purchase pack* and `PackSize` is
   *stock-units-per-pack*. (The alternative — UnitPrice already per-each — makes PackSize
   purely an ordering-multiple and changes all the math.)
2. **Schema: explicit vs. implicit.** Add `VendorPartPriceTier.PriceUomId` (and/or
   `VendorPart.PackUomId`) to make the basis self-describing and remove ambiguity — **or**
   rely on the documented PackSize contract with no schema change? (Recommendation: a single
   explicit `PackUomId` on `VendorPart` is cheap insurance against future ambiguity; beta = a
   clean migration. But it's a judgment call.)
3. **PO unit-price basis:** store PO line price *per purchase unit* (per bag, with `UomId`) and
   convert in landed-cost — **or** normalize to per-each at PO entry? (The former preserves the
   vendor document faithfully; the latter is simpler downstream but loses the "as quoted" view.)
4. **Scope of v1:** just the per-unit cost *derivation + price-tier UI preview* first — or the
   full BOM material-cost rollup in the same pass?
5. **Multiple pack sizes per vendor:** in scope? (See section above.) If yes, it needs the
   `VendorPartPackOption` entity + reparenting price tiers — a larger schema change than the
   single-pack derivation — and decides whether the resolver auto-selects the optimal pack for a
   quantity or the buyer picks one. If no (one pack per vendor-part is "good enough" for now),
   the single-`PackSize` model in this proposal stands as-is.

## Suggested phasing (once decisions land)

- **P1 — Derivation + preview (no/minimal schema):** `VendorCostResolver.GetCostPerStockUnit`,
  unit tests for the $12/100 → $0.12 case, and the price-tier UI "≈ $/ea" preview. Highest
  value, lowest risk.
- **P2 — BOM consumption UoM:** surface `BOMEntry.UomId` in the create/edit UI + request model;
  default to the component's stock UoM.
- **P3 — Cost threading:** make `PartLandedCostService` UoM-aware; BOM material-cost rollup on
  the part cost card.
- **P4 — (if approved in decision #2)** explicit `PackUomId`/`PriceUomId` migration + backfill.
- **P5 — (if approved in decision #5)** `VendorPartPackOption` entity + reparent price tiers +
  pack-aware resolver / PO lines. Biggest schema change — sequence last, on its own.

## Not in scope

Full standard-cost / actual-cost accounting, multi-level BOM cost with yield/scrap factors,
and currency conversion on tiers (tiers already snapshot currency) — those are separate efforts
if/when needed.
