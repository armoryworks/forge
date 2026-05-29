---
title: UoM Cost Connective Tissue (vendor purchase option → per-unit cost → BOM)
type: delivery
status: in-progress
id: uom-cost-connective-tissue
owner:
updated: 2026-05-28
---

# UoM Cost Connective Tissue

> **Status: IN PROGRESS (2026-05-28).** Dan green-lit the **full multi-option** model **with the
> cost derivation**. Decisions locked: #6 → additive (tier/PO-line nullable `PurchaseOptionId`, no
> price-tier reparent; per-(vendor,option) SKU/MOQ deferred); #10 → label-only for v1 (structured
> dimensions deferred with fit/yield). Building backend-first on branch
> `feature/uom-purchase-options`, verified against the Testcontainers Postgres harness.

## Terminology

The size/form a part comes in (and is bought in) is called a **purchase option** throughout this
doc — *not* a "pack." A "pack of 100" is just the count-dimension instance of the general idea (a
part may come as a 32 sqft sheet, a 1 kg bar, a 500 m reel…), so a UoM-neutral name matters.
**Purchase option** is the recommended term; *vendor offering* or *order unit* are acceptable
synonyms — the name is cheap to change, the concept is what counts. Purchase options live at the
**Part** level (the sizes are part-intrinsic); vendors price the ones they carry. The only place
"pack" survives is the **existing** `VendorPart.PackSize` column, named in code today.

## The client's scenario

> "The vendor may not sell specific parts on a per-unit basis — they may sell a package of
> 100 — but in a BOM you are only using *x* of them (1 to N). Then the cost basis changes:
> a bag of 100 costs $12, the individual part is $0.12. There has to be some connective
> tissue that is fairly comprehensive between purchase order, part, and BOM."

Concretely: **buying UoM ≠ consuming UoM**, and the **cost must convert** along that chain.
Buy a purchase option (1 bag = 100 each, $12/bag); stock + consume in *each* ($0.12/each); a
BOM that uses 3 each should cost 3 × $0.12 = $0.36.

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
| Auto-PO **rounds order qty up to whole `PackSize` multiples** (need 3, size 100 → orders 100) | `forge.api/Jobs/AutoPurchaseOrderJob.cs` | ✅ |
| `BOMEntry.UomId` (consumption UoM column) | `forge.core/Entities/BOMEntry.cs` | ✅ (entity only) |
| `PurchaseOrderLine.UomId` + decimal qty | `forge.core/Entities/PurchaseOrderLine.cs` | ✅ |
| `VendorPartPriceTier` (UnitPrice, MinQuantity, Currency, FreightIncluded) | `forge.core/Entities/VendorPartPriceTier.cs` | ✅ |

**The conversion engine and the UoM fields are done.** The missing piece is specifically the
**cost half**: nothing divides purchase-option price by its content to get per-unit cost, and
nothing threads that cost from the vendor tier → PO → BOM.

## The gap (what's missing)

1. **Ambiguous price basis.** `VendorPartPriceTier.UnitPrice` has no declared unit — is "$12"
   per each or per purchase option? `VendorPart.PackSize` is dimensionless — is "100" each, lb, kg?
2. **No cost-per-unit derivation.** `$12 ÷ 100 = $0.12/each` is computed nowhere.
   `PartLandedCostService` and `PartPricingResolver` assume the PO unit price is already
   per-each.
3. **BOM consumption UoM not surfaced.** `BOMEntry.UomId` exists on the entity but the BOM
   editor UI doesn't expose a picker; `CreateBOMEntryRequestModel` has no UoM field — so BOM
   always implicitly consumes in the component's stock UoM.
4. **No cost rollup / preview.** No "≈ $0.12/ea" shown beside a $12 purchase-option tier; no BOM
   material cost rollup that uses the derived per-unit cost.

## Recommended model

**Define the contract first (this is mostly a derivation problem, not a schema problem):**

- `Part.PurchaseUomId` = the UoM you buy in (e.g. **BAG**). `Part.StockUomId` = the UoM you
  stock and consume in (e.g. **EA**) — this is the **base UoM**.
- `VendorPart.PackSize` (existing column) = **how much of the base UoM one purchase option
  contains, for this vendor** (e.g. 100 EA per BAG) — the content quantity of the single option.
  It's vendor-scoped because two vendors may sell the same part in different sizes.
- `VendorPartPriceTier.UnitPrice` = price **per purchase option** (per BAG).
- **Derived:** `costPerBaseUnit = tier.UnitPrice ÷ PackSize` (→ $12 ÷ 100 = $0.12/EA). The
  existing part-specific `UomConversion` (1 BAG = 100 EA) is the same fact expressed in the
  conversion engine, so `UomService` can validate/round-trip it; `PackSize` is the vendor's
  concrete instance of that factor.

> ⚠️ This assumes **one purchase option per vendor-part** (one `PackSize`). It breaks when a
> vendor offers the same part in several sizes — not just packs of N, but e.g. thermoplastic in
> 1/8/16/32 sqft sheets, or resin sold by the kg and used by the gram. See
> [Purchase options (multiple buy sizes per vendor)](#purchase-options-multiple-buy-sizes-per-vendor)
> below; it changes the schema, the derivation, **and** inventory + PO handling.

**New derivation service (the connective tissue):** a small `VendorCostResolver` (or extend
the existing `PartSourcingResolver`) exposing:
- `GetCostPerBaseUnitAsync(partId, requestedQty)` → resolves preferred `VendorPart` + the
  applicable `VendorPartPriceTier` (by `MinQuantity`) + content size → returns cost in the
  part's base UoM. **Bidirectional:** also `GetPurchasePriceFromUnitCost(...)`.

**Threading:**
- **PO line:** in the single-option baseline, `PurchaseOrderLine.UnitPrice` is interpreted **per
  its `UomId`** (per bag) and `PartLandedCostService` becomes UoM-aware (convert to per-base-unit
  via `PackSize`/conversion before landed-cost math). With multiple purchase options, the line
  gains a `PurchaseOptionId` FK — see [Purchase order impact](#purchase-order-impact).
- **BOM rollup:** BOM line cost = `consumptionQty (base units) × costPerBaseUnit`. Surface a
  rolled-up material cost on the part.

**UI:**
- Surface `BOMEntry.UomId` in the BOM editor (UoM select; default = component's stock UoM).
- Show a derived per-unit preview next to purchase-option pricing on the vendor price-tier
  surface ("$12 / bag of 100  ≈  $0.12 / ea").
- (Optional) a part cost card showing rolled-up material cost from the BOM.

## Purchase options (multiple buy sizes per vendor)

A "pack of N" is just the **count-dimension** special case. The general idea: a part comes in
several **purchase options** (sizes / forms), each mapping to a **content quantity in the part's
base (stock) UoM** — whatever dimension that UoM lives in. Vendors then price the options they
carry:

| Part — base/stock UoM | Purchase options (sizes) | Content (base UoM) | Derived cost |
|---|---|---|---|
| Fastener — **each** | bag/100, bag/500, box/5000 | 100, 500, 5000 ea | $12 / 100 = $0.12/ea |
| Thermoplastic — **sqft** (area) | 1 sqft, 2×4, 4×4, 4×8 sheet | 1, 8, 16, 32 sqft | $50 / 8 = $6.25/sqft |
| Resin — **g** (mass) | 1 kg bar, 25 kg pail | 1 000, 25 000 g | $400 / 25 000 = $0.016/g |
| Wire — **mm** (length) | 100 m reel, 500 m reel | 100 000, 500 000 mm | … |

The invariant: **the base/stock UoM is the common denominator**, and every option declares how
much of it the option contains. "Pack size" was the count instance of "content quantity," and the
cost generalizes to `costPerBaseUnit = tierPrice ÷ contentQuantity`.

**Current model can't represent multiple options.** `(VendorId, PartId)` is unique → one
`VendorPart` → one `PackSize`; price tiers are quantity breaks, not options. (The config
comment's "separate row" workaround is blocked by that very unique index.)

### Recommended: part-level `PartPurchaseOption` + vendor pricing that references it

Options live at the **Part** level, because content quantity is **part-intrinsic** — a "2×4
sheet" is 8 sqft no matter who sells it. Defining it once avoids vendors disagreeing on the same
form's size and lets you compare vendors for the *same* option.

- **`PartPurchaseOption`** — child of `Part` (1..*): `{ Label, ContentQuantity, ContentUomId }`.
  The catalog of sizes/forms the part comes in (8 sqft sheet, 16 sqft sheet…). `ContentUomId`
  must share a `UomCategory` with (or convert to) `Part.StockUomId`.
- **Vendor pricing references the option.** `VendorPartPriceTier` gains a nullable
  `PurchaseOptionId` (null = priced per base unit / the lone default option). Each tier is one
  *(vendor, option, min-qty, price)*.
- **Vendor-specific bits stay vendor-side.** `VendorSku` and `MinOrderQty` differ per *(vendor,
  option)* — Acme's SKU/MOQ for the 32 sqft sheet ≠ Globex's — so they don't belong on the
  part-level option. Two ways to structure (decision below):
  - *Simple:* tier carries `PurchaseOptionId`; SKU/MOQ kept per-vendor (denormalized).
  - *Normalized:* a `VendorPartOption` junction `{ VendorPartId, PurchaseOptionId, VendorSku,
    MinOrderQty }` owns the tiers — one more entity, fully clean.

```
Part "Thermoplastic 1/8in grade-X"  (stock UoM = sqft)
 ├─ PartPurchaseOption "2×4 sheet"  (8 sqft)
 ├─ PartPurchaseOption "4×4 sheet"  (16 sqft)
 └─ PartPurchaseOption "4×8 sheet"  (32 sqft)

VendorPart (Acme ↔ part)          VendorPart (Globex ↔ part)
 ├─ tier: 4×8 @ $50 (qty ≥ 1)      └─ tier: 4×8 @ $48 (qty ≥ 10)   ← same option, compare vendors
 └─ tier: 2×4 @ $14 (qty ≥ 1)
```

**Cardinality:** a tier → one option (many-to-one); an option ← many vendors' tiers
(option↔vendor is many-to-many). The "selectable column on the tier grid" *is* that
`PurchaseOptionId` FK; pricing becomes an option × qty-break (× vendor) matrix.

**Progressive disclosure (graceful defaults):**
- **0 options** → bought/priced **per single base unit** — today's behavior, no UI change.
- **1 option** → treat it as the lone purchase unit; no selector shown.
- **>1 options** → the tier grid shows a **Purchase Option** column to tag each tier.

Rejected: content quantity per vendor (duplicates the geometry; vendors can disagree); content on
each tier (conflates option choice with volume discounts — you'd lose "the 4×8 sheet, AND a
discount when buying 50").

### Order unit: a label, not a universal UoM

"Sheet" / "bar" / "reel" have **no universal size**, so they shouldn't be global `UnitOfMeasure`
rows — the *option* carries its content-in-base-UoM. `UomCategory` already blocks nonsense (a
"sheet" worth 8 *grams* for an area part). A real UoM is only warranted if a "Packaging" category
is added, and even then "sheet" is meaningless without the option's content.

### Same content quantity, different shape

Two options can share the **same content + UoM** yet be physically different — 32 sqft as a
**4×8 sheet** vs. 32 sqft as a **64 ft × 6 in roll**. This needs no special handling, because
content and shape are **orthogonal**:

- **Content + UoM is not a uniqueness key.** Each option is its own row (`Label`, `VendorSku`,
  price tiers); two 32-sqft options coexist and are distinguished by label.
- **For cost + inventory they're identical: 32 sqft.** Both add 32 sqft of on-hand and carry a
  $/sqft cost — the base UoM is the right denominator for money and stock, and shape changes
  neither.
- **Physical shape is an optional descriptive layer.** Add structured **dimensions** to the option
  (a small typed set — length × width for sheet/roll, diameter for round stock — each with its own
  UoM) for (i) human disambiguation in the UI and (ii) future fit/yield checks. Keep dimensions
  **orthogonal** to `ContentQuantity`: content drives cost/inventory, dimensions describe geometry.
- **Fit / yield is downstream.** "Can my 12-in-wide part be cut from a 6-in roll?" and "how many
  blanks per 4×8 sheet, how much scrap?" are nesting/yield problems — out of scope here (see *Not
  in scope*); capturing dimensions now just seeds that work. Corollary: **auto-picking the cheapest
  option optimizes cost, not fit** — until yield logic exists a too-narrow-but-cheaper roll could
  be auto-selected, so the buyer must be able to override.

### Continuous bulk needs no extra row

Buy kg, stock g, same dimension → that's a global `UomConversion` (1 kg = 1000 g) the engine
already has. Purchase options are specifically for **vendor/SKU-specific orderable sizes** ("2×4
sheet", "bag/100") that can't be a universal conversion. The model degrades gracefully: simple
bulk material needs nothing new; only multi-option parts need an option row.

### Inventory implications

On-hand is tracked in the **base/stock UoM**, always — never in purchase options. Consequences:
- **Receiving converts option → base.** Receiving 2 "4×8 sheets" adds 2 × 32 = 64 sqft on-hand,
  not "2 sheets." `BinContent.Quantity` stays in base UoM.
- **Discrete carriers become continuous on receipt.** You don't track "1 sheet remaining" — you
  track "30 sqft remaining" after cutting 2 sqft off a 32 sqft sheet. (If physical sheet/offcut
  identity ever matters — true remnant tracking — that's a separate, larger effort; flag, don't
  build it here.)
- **Reorder math** (`AutoPurchaseOrderJob`) computes need in base UoM, then rounds *up to a whole
  number of the chosen option* (need 50 sqft → 2 × 32 sqft sheets); the option drives the PO line.
- **PO / receiving line** references the option (qty in options) and converts to base UoM into the bin.

### Purchase order impact

Purchase options are a purchasing concept, so the PO is where they're chosen and committed:
- **PO line references the option.** Add `PurchaseOrderLine.PurchaseOptionId` (FK). `OrderedQuantity`
  / `ReceivedQuantity` are counted **in options** (2 sheets, 3 bags) and `UnitPrice` is **per
  option** (from the selected tier) — the line reads "2 × 4×8 sheet @ $50".
- **Base UoM is derived, not the stored order qty.** `baseQty = OrderedQuantity ×
  option.ContentQuantity` (2 × 32 = 64 sqft) drives receiving-into-bin and landed cost
  (`PartLandedCostService` divides by content for per-base-unit).
- **Picking the option.** The option list on a PO line comes from the part's options the chosen
  vendor carries (has pricing for); default to the most-economical option for the line qty (see
  "cost selection"), buyer-overridable.
- **Receiving** converts options → base UoM (above); over/under-receipt is still counted in
  options, the bin delta is in base UoM.
- **Auto-PO** already rounds to whole `PackSize` multiples — generalize to "whole options" and
  stamp the chosen `PurchaseOptionId` on the generated line.
- **Existing `PurchaseOrderLine.UomId`** can stay for display (the option's order-unit label), but
  the option FK is the source of truth — `UomId` alone can't recover the content size.
- **Vendor RFQ / quote intake** maps naturally: a vendor quoting "$50 per 4×8, $400 per drum" is
  authoring options + tiers — the same bidirectional vendor-side editor seeds PO pricing.

### UI — guided + non-guided, vendor-authored, bidirectional

- **Vendor side authors the options.** On the vendor-part / sources surface, the user defines each
  purchase option (label, content-in-base-UoM, MOQ) and its price tiers. Render it
  **bidirectionally**: enter "$50 per 4×8 (32 sqft)" → the row shows "≈ $6.25/sqft"; or enter a
  target $/sqft → back-solve the option price. One control, read/written both ways.
- **Non-guided (power user):** an options sub-table on the vendor-part editor — add/edit/remove
  options inline, each with its own tier list (today's tier editor, one level deeper).
- **Guided (part-creation wizard):** keep it light — the base UoM is already captured "at the top
  of part creation." A "how do you buy this?" step offers the common shapes (buy-as-each, a
  sheet set, bulk-by-weight) and pre-fills sensible options; full multi-option authoring defers to
  the non-guided vendor editor. Don't force the whole option matrix on someone creating a simple part.
- **Consuming side stays simple:** BOM / issue UIs work purely in the base UoM — purchase options
  are a purchasing-side concept and never leak into consumption.

### Consequence for cost selection

Cheapest per-base-unit **depends on the quantity needed** (a 1 sqft piece for one part vs. a 4×8
for a run). `GetCostPerBaseUnitAsync(partId, qty)` either (a) picks the optimal option for `qty`,
or (b) takes an explicit option choice from the buyer; PO lines + auto-PO reference an **option**,
not just the vendor-part. True offcut/yield/scrap optimization ("a 32 sqft sheet yields 30
usable") is out of scope here.

## Open decisions (need Dan's call before coding)

1. **Confirm the contract:** `tier.UnitPrice` is *per purchase option* and `PackSize` is the
   option's *content in the base UoM*. (The alternative — UnitPrice already per-each — makes
   `PackSize` purely an ordering-multiple and changes all the math.)
2. **Schema: explicit vs. implicit.** Add `VendorPartPriceTier.PriceUomId` (and/or a
   `ContentUomId` alongside `PackSize`) to make the basis self-describing and remove ambiguity —
   **or** rely on the documented `PackSize` contract with no schema change? (Recommendation: an
   explicit content UoM is cheap insurance against future ambiguity; beta = a clean migration. But
   it's a judgment call.)
3. **PO unit-price basis:** store PO line price *per purchase option* (per bag, with `UomId`) and
   convert in landed-cost — **or** normalize to per-each at PO entry? (The former preserves the
   vendor document faithfully; the latter is simpler downstream but loses the "as quoted" view.)
4. **Scope of v1:** just the per-unit cost *derivation + price-tier UI preview* first — or the
   full BOM material-cost rollup in the same pass?
5. **Multiple purchase options per part:** in scope? (See
   [Purchase options](#purchase-options-multiple-buy-sizes-per-vendor).) If yes, it needs a
   part-level `PartPurchaseOption` child (content-in-base-UoM, any dimension), a nullable
   `VendorPartPriceTier.PurchaseOptionId`, and a `PurchaseOrderLine.PurchaseOptionId` FK — the
   biggest change, touching schema, cost derivation, **inventory** (receive option→base) and
   **PO/receiving** — and it decides whether the resolver auto-selects the optimal option for a
   quantity or the buyer picks one. If no (one size per part is good enough for now), the
   single-`PackSize` model stands as-is.
6. **Vendor SKU / MOQ structure:** keep `VendorSku` + `MinOrderQty` denormalized per vendor, or
   add a `VendorPartOption` junction `{VendorPartId, PurchaseOptionId, VendorSku, MinOrderQty}`
   that owns the tiers (cleaner, one more entity)?
7. **Order unit — label vs. UoM:** carry the option's order unit as a free label + content-in-base
   (recommended), or add a "Packaging" `UomCategory` and make "sheet"/"bar" first-class UoMs?
8. **Option selection on a PO line:** auto-pick the most-economical option for the line quantity,
   or require the buyer to choose the option explicitly (auto-pick as a default they can override)?
9. **Name:** confirm `PartPurchaseOption` / "purchase option" (vs. *vendor offering* / *order
   unit*) before any code locks it into entity + API names.
10. **Option dimensions:** capture physical shape now (structured `Dimensions` on the option, e.g.
    length × width / diameter — seeds future fit/yield), or defer and rely on `Label` alone for
    v1? (Two same-content options like 4×8 sheet vs 64×6 roll already work via distinct labels;
    structured dimensions only buy future nesting/fit logic + richer display.)

## Suggested phasing (once decisions land)

- **P1 — Derivation + preview (no/minimal schema):** `VendorCostResolver.GetCostPerBaseUnit`,
  unit tests for the $12/100 → $0.12 case, and the price-tier UI "≈ $/ea" preview. Highest
  value, lowest risk.
- **P2 — BOM consumption UoM:** surface `BOMEntry.UomId` in the create/edit UI + request model;
  default to the component's stock UoM.
- **P3 — Cost threading:** make `PartLandedCostService` UoM-aware; BOM material-cost rollup on
  the part cost card.
- **P4 — (if approved in decision #2)** explicit content-UoM / `PriceUomId` migration + backfill.
- **P5 — (if approved in decision #5) purchase options, end-to-end.** Part-level
  `PartPurchaseOption` entity (content-in-base-UoM) + nullable `VendorPartPriceTier.PurchaseOptionId`
  (and, per decision #6, an optional `VendorPartOption` junction for vendor SKU/MOQ) +
  `PurchaseOrderLine.PurchaseOptionId` FK + option-aware resolver, receiving (option→base into
  bin), auto-PO ("whole options"), and the vendor-side bidirectional options/tier editor
  (non-guided) + a light "how do you buy this?" guided step. Biggest change — schema + cost +
  inventory + PO + UI — sequence last, on its own.

## Not in scope

Full standard-cost / actual-cost accounting, multi-level BOM cost with yield/scrap factors,
**nesting / fit / yield optimization** (cutting parts from a sheet/roll by geometry — distinct
from area-based cost/inventory), and currency conversion on tiers (tiers already snapshot
currency) — those are separate efforts if/when needed.
