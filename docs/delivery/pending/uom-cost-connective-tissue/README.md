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

> ⚠️ This assumes **one `PackSize` per vendor-part**. It breaks when a vendor offers the same part
> in multiple **purchase forms** — not just packs of N, but e.g. thermoplastic in 1/8/16/32 sqft
> sheets, or resin sold by the kg and used by the gram. See [Purchase forms (beyond a "pack")](#purchase-forms-beyond-a-pack)
> below; it changes the schema, the derivation, **and** inventory + PO handling.

**New derivation service (the connective tissue):** a small `VendorCostResolver` (or extend
the existing `PartSourcingResolver`) exposing:
- `GetCostPerStockUnitAsync(partId, requestedQty)` → resolves preferred `VendorPart` + the
  applicable `VendorPartPriceTier` (by `MinQuantity`) + `PackSize` → returns cost in the
  part's stock UoM. **Bidirectional:** also `GetPackPriceFromUnitCost(...)`.

**Threading:**
- **PO line:** in the single-form baseline, `PurchaseOrderLine.UnitPrice` is interpreted **per its
  `UomId`** (per bag) and `PartLandedCostService` becomes UoM-aware (convert to per-base-unit via
  `PackSize`/conversion before landed-cost math). With purchase forms, the line gains a
  `PurchaseFormId` FK — see [Purchase order impact](#purchase-order-impact-raised-in-review).
- **BOM rollup:** BOM line cost = `consumptionQty (stock units) × costPerStockUnit`. Surface a
  rolled-up material cost on the part.

**UI:**
- Surface `BOMEntry.UomId` in the BOM editor (UoM select; default = component's stock UoM).
- Show a derived per-unit preview next to pack pricing on the vendor price-tier surface
  ("$12 / bag of 100  ≈  $0.12 / ea").
- (Optional) a part cost card showing rolled-up material cost from the BOM.

## Purchase forms (beyond a "pack")

A "pack of N" is just the **count-dimension** special case. The general idea: a vendor offers the
same part/material in several **purchase forms**, and each form maps to a **content quantity in
the part's base (stock) UoM** — whatever dimension that UoM lives in:

| Part — base/stock UoM | Vendor purchase forms | Content (base UoM) | Derived cost |
|---|---|---|---|
| Fastener — **each** | bag/100, bag/500, box/5000 | 100, 500, 5000 ea | $12 / 100 = $0.12/ea |
| Thermoplastic — **sqft** (area) | 1 sqft, 2×4, 4×4, 4×8 sheet | 1, 8, 16, 32 sqft | $50 / 8 = $6.25/sqft |
| Resin — **g** (mass) | 1 kg bar, 25 kg pail | 1 000, 25 000 g | $400 / 25 000 = $0.016/g |
| Wire — **mm** (length) | 100 m reel, 500 m reel | 100 000, 500 000 mm | … |

The invariant: **the base/stock UoM is the common denominator**, and every form declares how much
of it the form contains. "Pack size" was the count instance of "content quantity," and the cost
generalizes to `costPerBaseUnit = tierPrice ÷ contentQuantity`.

**Current model can't represent multiple forms.** `(VendorId, PartId)` is unique → one
`VendorPart` → one `PackSize`; price tiers are quantity breaks, not forms. (The config comment's
"separate row" workaround is blocked by that very unique index.)

### Recommended: a `VendorPartPurchaseForm` child (name TBD — *not* "pack")

Child of `VendorPart` ("purchase form" / "offering" / "order unit"):
- `Label` / `VendorSku` — "2×4 sheet", "1 kg bar", "bag/100"
- `ContentQuantity` + `ContentUomId` — content in a base UoM (8 sqft, 1000 g, 100 ea);
  `ContentUomId` must be in the same `UomCategory` as (or convertible to) `Part.StockUomId`
- `MinOrderQty`
- **price tiers reparented here** — quantity-break pricing lives *per form*

```
VendorPart (vendor↔part: AVL, preferred, lead time, certs)
 ├─ PurchaseForm "2×4 sheet"  (8 sqft,  SKU TP-2X4)  ── tiers: qty-break pricing
 ├─ PurchaseForm "4×8 sheet"  (32 sqft, SKU TP-4X8)  ── tiers: …
 └─ PurchaseForm "1 kg bar"   (1000 g)               ── tiers: …
```

Three axes, cleanly separated: **form/SKU** (the new entity) · **qty-break price** (tiers, now
under the form) · **vendor↔part relationship** (`VendorPart`). Rejected: multiple `VendorPart`
rows (duplicates AVL/preferred/lead-time, ambiguous "preferred"); content on each tier (conflates
form choice with volume discounts — you'd lose "the 4×8 sheet, AND a discount when buying 50").

### Order unit: a label, not a universal UoM

"Sheet" / "bar" / "reel" have **no universal size**, so they shouldn't be global `UnitOfMeasure`
rows — the *form* carries its content-in-base-UoM. `UomCategory` already blocks nonsense (a
"sheet" worth 8 *grams* for an area part). A real UoM is only warranted if a "Packaging/Form"
category is added, and even then "sheet" is meaningless without the form's content.

### Continuous bulk needs no form row

Buy kg, stock g, same dimension → that's a global `UomConversion` (1 kg = 1000 g) the engine
already has. Forms are specifically for **vendor/SKU-specific orderable sizes** ("2×4 sheet",
"bag/100") that can't be a universal conversion. The model degrades gracefully: simple bulk
material needs nothing new; only multi-form parts need a form row.

### Inventory implications (raised in review)

On-hand is tracked in the **base/stock UoM**, always — never in "forms." Consequences:
- **Receiving converts form → base.** Receiving 2 "4×8 sheets" adds 2 × 32 = 64 sqft on-hand,
  not "2 sheets." `BinContent.Quantity` stays in base UoM.
- **Discrete carriers become continuous on receipt.** You don't track "1 sheet remaining" — you
  track "30 sqft remaining" after cutting 2 sqft off a 32 sqft sheet. (If physical sheet/offcut
  identity ever matters — true remnant tracking — that's a separate, larger effort; flag, don't
  build it here.)
- **Reorder math** (`AutoPurchaseOrderJob`) computes need in base UoM, then rounds *up to a whole
  number of the chosen form* (need 50 sqft → 2 × 32 sqft sheets); the form drives the PO line.
- **PO / receiving line** references the form (qty in forms) and converts to base UoM into the bin.

### Purchase order impact (raised in review)

Forms are a purchasing concept, so the PO is where they're chosen and committed:
- **PO line references the form.** Add `PurchaseOrderLine.PurchaseFormId` (FK). `OrderedQuantity` /
  `ReceivedQuantity` are counted **in forms** (2 sheets, 3 bags) and `UnitPrice` is **per form**
  (from the selected tier) — the line reads "2 × 4×8 sheet @ $50".
- **Base UoM is derived, not the stored order qty.** `baseQty = OrderedQuantity ×
  form.ContentQuantity` (2 × 32 = 64 sqft) drives receiving-into-bin and landed cost
  (`PartLandedCostService` divides by content for per-base-unit).
- **Picking the form.** The form list on a PO line comes from the chosen vendor-part's forms;
  default to the preferred / most-economical form for the line qty (see "cost selection"),
  buyer-overridable.
- **Receiving** converts forms → base UoM (above); over/under-receipt is still counted in forms,
  the bin delta is in base UoM.
- **Auto-PO** already rounds to whole packs — generalize to "whole forms" and stamp the chosen
  `PurchaseFormId` on the generated line.
- **Existing `PurchaseOrderLine.UomId`** can stay for display (the form's order-unit label), but
  the form FK is the source of truth — `UomId` alone can't recover the content size.
- **Vendor RFQ / quote intake** maps naturally: a vendor quoting "$50 per 4×8, $400 per drum" is
  authoring forms + tiers — the same bidirectional vendor-side editor seeds PO pricing.

### UI (raised in review) — guided + non-guided, vendor-authored, bidirectional

- **Vendor side authors the forms.** On the vendor-part / sources surface, the user defines each
  purchase form (label, content-in-base-UoM, MOQ) and its price tiers. Render it
  **bidirectionally**: enter "$50 per 4×8 (32 sqft)" → the row shows "≈ $6.25/sqft"; or enter a
  target $/sqft → back-solve the form price. One control, read/written both ways.
- **Non-guided (power user):** a forms sub-table on the vendor-part editor — add/edit/remove forms
  inline, each with its own tier list (today's tier editor, one level deeper).
- **Guided (part-creation wizard):** keep it light — the base UoM is already captured "at the top
  of part creation." A "how do you buy this?" step offers the common shapes (single each-pack, a
  sheet set, bulk-by-weight) and pre-fills sensible forms; full multi-form authoring defers to the
  non-guided vendor editor. Don't force the whole form matrix on someone creating a simple part.
- **Consuming side stays simple:** BOM / issue UIs work purely in the base UoM — forms are a
  purchasing-side concept and never leak into consumption.

### Consequence for cost selection

Cheapest per-base-unit **depends on the quantity needed** (a 1 sqft piece for one part vs. a 4×8
for a run). `GetCostPerBaseUnitAsync(partId, qty)` either (a) picks the optimal form for `qty`, or
(b) takes an explicit form choice from the buyer; PO lines + auto-PO reference a **form**, not just
the vendor-part. True offcut/yield/scrap optimization ("a 32 sqft sheet yields 30 usable") is out
of scope here.

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
5. **Multiple purchase forms per vendor:** in scope? (See [Purchase forms](#purchase-forms-beyond-a-pack).)
   If yes, it needs a `VendorPartPurchaseForm` child (content-in-base-UoM, any dimension) +
   reparenting price tiers + a `PurchaseOrderLine.PurchaseFormId` FK — the biggest change, touching
   schema, cost derivation, **inventory** (receive form→base) and **PO/receiving** — and it decides
   whether the resolver auto-selects the optimal form for a quantity or the buyer picks one. If no
   (one form per vendor-part is good enough for now), the single-`PackSize` model stands as-is.
6. **Order unit — label vs. UoM:** carry the form's order unit as a free label + content-in-base
   (recommended), or add a "Packaging/Form" `UomCategory` and make "sheet"/"bar" first-class UoMs?
7. **Form selection on a PO line:** auto-pick the most-economical form for the line quantity, or
   require the buyer to choose the form explicitly (auto-pick as a default they can override)?

## Suggested phasing (once decisions land)

- **P1 — Derivation + preview (no/minimal schema):** `VendorCostResolver.GetCostPerStockUnit`,
  unit tests for the $12/100 → $0.12 case, and the price-tier UI "≈ $/ea" preview. Highest
  value, lowest risk.
- **P2 — BOM consumption UoM:** surface `BOMEntry.UomId` in the create/edit UI + request model;
  default to the component's stock UoM.
- **P3 — Cost threading:** make `PartLandedCostService` UoM-aware; BOM material-cost rollup on
  the part cost card.
- **P4 — (if approved in decision #2)** explicit `PackUomId`/`PriceUomId` migration + backfill.
- **P5 — (if approved in decision #5) purchase forms, end-to-end.** `VendorPartPurchaseForm` entity
  (content-in-base-UoM) + reparent price tiers + `PurchaseOrderLine.PurchaseFormId` FK +
  form-aware resolver, receiving (form→base into bin), auto-PO ("whole forms"), and the
  vendor-side bidirectional forms/tier editor (non-guided) + a light "how do you buy this?" guided
  step. Biggest change — schema + cost + inventory + PO + UI — sequence last, on its own.

## Not in scope

Full standard-cost / actual-cost accounting, multi-level BOM cost with yield/scrap factors,
and currency conversion on tiers (tiers already snapshot currency) — those are separate efforts
if/when needed.
