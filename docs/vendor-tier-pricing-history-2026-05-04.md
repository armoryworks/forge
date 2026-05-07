# Vendor-Part Price-Tier Pricing History (SCD Type 2) — 2026-05-04

## Context

`VendorPartPriceTier` rows today are mutated in place when edited — a tier
that used to be `100+ @ $5` becomes `100+ @ $4.50` with no record that it
ever was the older value. The UI compounded the loss: tiers were
add-or-delete-only ("to change a tier, delete + re-add"). Combined with PO
line items that snapshot their unit price at purchase time but reference
the tier id for traceability, an in-place mutation made it impossible to
answer "what was this part priced at on the day this PO was placed?"

## Decision

Apply **SCD Type 2** to `vendor_part_price_tiers`:

- The schema already has `effective_from` and `effective_to`. No new
  columns needed.
- **Editing** a tier: stamp the existing row with `effective_to = today`
  and INSERT a new row with the new values, `effective_from = today`,
  `effective_to = NULL`. Same `min_quantity`. Tier ids are preserved on
  the closed-out row so PO line items pointing at it stay traceable.
- **Deleting** a tier: stamp `effective_to = today`. No physical delete.
- **"Currently effective" default filter**: rows where
  `effective_from <= today AND (effective_to IS NULL OR effective_to >= today)`.
  The list endpoint defaults to this; `?showHistory=true` returns all
  rows including superseded.

## UI changes (companion)

1. **Currency moves from tier-row to vendor-source level.** Multi-currency
   tier tables for a single vendor source are an analytical edge case —
   collapsing them into one source confuses comparison. New `currency`
   column on `VendorPart`, backfilled from the most-common tier currency
   per source. Tier rows keep their `currency` field for historical
   integrity but the UI stops surfacing or editing it.
2. **Tier table redesign:**
   - Three columns: Min Qty, Unit Price, Effective From (Currency dropped)
   - Empty editable row always at the bottom — typing into it commits a
     new tier on row-blur, then animates the next empty row in with a
     full green border that fades to default over 1000ms
   - Existing rows are click-to-edit (click cell → swap to input → blur
     saves via the SCD Type 2 supersede path)
   - Drop the explicit `+ ADD TIER` button (the empty row IS the affordance)
   - "Show history" toggle reveals superseded rows greyed-out with
     their effective windows
   - Effective From defaults to today on new rows (date-picker present
     for the rare case where a tier kicks in later)
   - **Tier table is hidden when the parent vendor source is in
     read-only mode.** It only renders inside the edit surface.

## Activity logging

Per the indexing-points + rollup rules in `CLAUDE.md`:

- A tier supersede (close-old + insert-new) is ONE activity row, not two.
  Action verb `price-tier-superseded`, description summarizes both old
  and new values.
- Logged on both Part AND Vendor (indexing-points rule applies because
  VendorPart bridges them).

## Customer-side follow-up (DEFERRED — not in this PR)

The same SCD Type 2 + show-history pattern applies symmetrically on the
customer side. **This is intentionally deferred to a follow-up effort to
keep this PR focused, but the design must be applied identically when we
get there.**

- **Symmetric entity**: `PriceListEntry` (customer-specific pricing on
  parts/products) is the customer-side analogue of
  `VendorPartPriceTier`. Edits today mutate in place; needs the same
  supersede pattern.
- **Customer detail page** needs a **"Products" tab** showing the
  inverse list of what's currently on the part page: every part /
  product this customer has purchased, with their per-customer pricing
  history visible (using the same toggle pattern). Mirrors the existing
  Sources tab on parts which lists vendors.
- **Activity logging on `PriceListEntry`** mutations needs the same
  indexing-points treatment — log on Customer + Part. Today no
  activity is written for PriceListEntry CRUD.

The data model already supports it (`PriceListEntry` has effective dates
in `PriceList`). No new schema needed for the customer side beyond what
this PR introduces.

## What's NOT in scope

- The earlier discussion about ripping out the `Pricing` tab on Part
  altogether (replacing the flat price-history table with a derived
  weighted-avg cost from POs). That's a separate, larger architectural
  rework. The Pricing tab here continues to display whatever it does
  today; the tier history is a vendor-source concern, not a part-level
  one.
- Per-customer purchase history aggregation (volume-weighted avg cost
  trends, etc.) — emerges naturally once the customer-side
  `PriceListEntry` history exists, but a separate feature.

## Migration safety

- Adding `currency` to `vendor_parts` is non-breaking (new column,
  backfilled).
- Keeping `currency` on `vendor_part_price_tiers` (don't drop) preserves
  historical integrity; new inserts snapshot the parent's currency at
  insert time.
- Existing tier rows aren't touched by the migration. New writes go
  through the supersede path; old writes that mutated in place are now
  immutable. The audit timeline starts with this deploy.

## Tests

- E2E: edit a tier from `100+ @ $5` to `100+ @ $4.50` → list returns
  one currently-effective row; `?showHistory=true` returns both with the
  superseded row's `effective_to` stamped.
- E2E: delete a tier → list excludes it; `?showHistory=true` includes
  it with `effective_to` stamped.
- E2E: PO created against the original tier id continues to resolve
  the tier (read still works on superseded ids).
- Unit: handler tests for the supersede path (close old, insert new,
  same min_qty path).
