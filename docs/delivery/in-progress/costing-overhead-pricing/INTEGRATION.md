---
type: delivery
status: in-progress
---

# Integration — reconciling the spec with Forge's existing costing engine

Discovered 2026-08-21 while starting the build. The [SPEC.md](./SPEC.md) reads greenfield, but
Forge **already has a standard-costing + overhead + variance engine**. This note records what
exists, what's new, and the architecture decision so the build doesn't duplicate or break it.

## What already exists (do NOT rebuild)

| Concern | Where | Notes |
|---|---|---|
| Work center | `forge.core/Entities/WorkCenter.cs` | Has `LaborCostPerHour`, `BurdenRatePerHour`, `NumberOfMachines`, `DailyCapacityHours`, `EfficiencyPercent`. **Reuse this** — do not create a new WorkCenter. |
| Cost center (GL dimension) | `forge.core/Entities/Accounting/CostCenter.cs` | A **GL reporting dimension** on JournalLine, `Book`-scoped. This is NOT the spec's costing cost-center (sqft/headcount/inventoriable). Different concept, same word — keep them separate. |
| Costing profile / tiers | `forge.core/Entities/CostingProfile.cs`, `forge.api/Features/Costing/{Get,Update}CostingProfile.cs` | Tier 1 (flat burden) / Tier 2 (departmental %) selection. |
| Standard cost rollup | `forge.api/Features/Accounting/StandardCostRollupService.cs` + `StandardCostResolver.cs` | Recursive BOM rollup → **3 buckets** (material/labor/overhead), Tier 1/2. Cycle-guarded, subcontract-aware. |
| Overhead pool (GL) | `forge.api/Features/Accounting/OverheadPoolService.cs` | Period overhead pool via GL accounts (`OVERHEAD_CONTROL`/`OVERHEAD_APPLIED`), spending variance, period close. **Dark behind `CAP-ACCT-FULLGL`.** |
| Production variances | `forge.api/Features/Accounting/ProductionVariancePostingService.cs` | Efficiency/spending variance posting into the GL. |
| Persisted cost calc | `forge.core/Entities/CostCalculation.cs` | Existing persisted rollup result. |
| Capability | `CAP-COSTING-TIER3-ABC` (MFG) | Already in the catalog, described as *"Cost pools allocated by drivers (machine hours, square footage) — engine not yet implemented; cost pools, drivers, and allocation rules will land in a separate effort."* **This feature IS that engine.** Gate the whole thing here — no new capability, no facts-count churn. |

## The decision

The spec is the **Tier-3 ABC engine** — the not-yet-built layer the catalog already anticipates.
Build it as an **additive** module so it cannot break the existing (dark-but-built) Tier-1/2 +
FULLGL machinery:

1. **Reuse `WorkCenter`.** The new frozen-per-period rates (`WorkCenterCostRate`) reference it by id.
2. **Do NOT couple to the GL `Book`/`CostCenter`.** The spec is explicit that costing must work with
   an *external* GL (QBO) — i.e. independent of `CAP-ACCT-FULLGL`. The costing cost-center is a
   distinct entity (`CostingCostCenter`, sqft/headcount/inventoriable/type) — not the GL dimension.
3. **New entities live in `Forge.Core.Entities.Costing`** with non-colliding names: `CostingPeriod`,
   `CostingCostCenter`, `OverheadCostPool`, `OverheadPoolBudget`, `WorkCenterCostRate`,
   `CostAllocationRule`, `ItemStandardCost`, `ItemBurden`.
4. **Richer decomposition.** The spec's 8 cost elements (MAT/MOH/LAB/LOH/MCH/MOHV/MOHF/SUB) supersede
   the existing 3 buckets. The new `CostRollEvaluator` (pure, in `Forge.Core.Costing`) produces the
   8-element roll; the existing `StandardCostRollupService` stays for Tier 1/2. Tier-3, when the
   capability is on, uses the new evaluator.
5. **Gate everything behind `CAP-COSTING-TIER3-ABC`.** New controllers carry
   `[RequiresCapability("CAP-COSTING-TIER3-ABC")]`.
6. **Variances / GL posting reuse the existing services** (`OverheadPoolService`,
   `ProductionVariancePostingService`) where FULLGL is on; where the shop runs QBO, the spec's
   summary-journal push (§7) is the path. That reconciliation is build-order steps 3+, later.

## Open reconciliations (decide as those steps land)

> **Two of these are now settled by the code — see "Reconciliations settled" below.**

- **`ItemStandardCost` vs `CostCalculation`** — the new per-period frozen item cost vs the existing
  persisted calc. Likely `ItemStandardCost` is the Tier-3 period-frozen record; `CostCalculation`
  stays the Tier-1/2 live calc. Confirm before wiring the roll to persistence.
- **`WorkCenter.BurdenRatePerHour`** (existing flat rate) vs the new pool-derived
  `WorkCenterCostRate` — Tier-3 derives rates from pools at freeze; Tier-1 keeps the flat field.
- **Freeze** composes `WorkCenterCostRate` from the pools that feed each work center — the mapping
  of pool→work-center needs a link (pool carries an optional `WorkCenterId`, else applies to all in
  its cost center by driver).

## Build status (2026-08-21)

**Done + committed (forge-api `d20f1981`, held locally, not pushed):**
- Tier-3 domain layer — 8 entities in `Forge.Core.Entities.Costing`, 7 enums, the pure
  `CostRollEvaluator` (8-element roll, spec §3.1) + 3 passing fixture tests. forge.core builds
  `-warnaserror` clean; the whole solution compiles.

**Remaining — gated on a Postgres-capable environment:**
1. **Schema + EF** (all-or-nothing): write `forge-db/schema/tables/*.sql` for the 8 tables,
   run `forge-db assemble` to regenerate `forge.data/Schema/forge-schema.sql`, add the 8
   `DbSet`s to `AppDbContext`. Must be verified against a real Postgres — EF model errors and
   schema drift surface at model-build / the `PostgresFixture` collection, not at `dotnet build`.
   This dev box has no local Postgres, so it was deliberately NOT wired blind (the same class of
   unverifiable boot-time change that caused an earlier prod boot-loop).
2. **API**: MediatR CRUD for periods/cost-centers/pools/budgets/work-center-rates; the **freeze**
   command (stage-1 allocation → pool `DerivedRate` → compose `WorkCenterCostRate`); a **cost-roll**
   query that adapts live BOM/routing into `CostRollItem` and calls the evaluator, persisting
   `ItemStandardCost`. Controllers carry `[RequiresCapability("CAP-COSTING-TIER3-ABC")]`.
3. **UI**: Admin → Costing area (cost centers, pools/budgets, work-center rates, periods + freeze,
   roll report). Needs the API + the docker stack for visual verification.

A stateless "what-if roll" endpoint over the evaluator (no DB) is the one API slice that could be
built + tested here; deferred so the first API surface matches the real persisted feature.

## Build status update — full vertical slice landed (2026-08-21)

Steps 1–2 of the build order are now end-to-end (domain → schema → API → UI), all committed
local/held:
- **Schema** (forge-db `212ea89`): 8 tables + FKs, embedded `forge-schema.sql` regenerated.
- **API** (forge-api `12808979`): 8 DbSets; MediatR CRUD for periods/cost-centers/pools/budgets;
  `FreezeCostingPeriod` (derive pool rates → compose `WorkCenterCostRate`); `Tier3CostingController`
  at `/api/v1/costing/tier3` gated by `CAP-COSTING-TIER3-ABC`. Compiles + Architecture ratchet +
  cost-roll tests green.
- **UI** (forge-ui `6671f53c`): `/costing` (Admin,Manager) — URL-tabbed periods/freeze/rates,
  cost centers, pools/budgets. build + lint + lint:standards + lint:i18n green.

**Still to do (own increments):**
- **Visual verification** of the UI — needs the docker stack or the static-serve+Playwright
  substitute; not run on this box. Do before the bundled release.
- **EF model ↔ schema** end-to-end validation on Postgres (CI integration stage / PostgresFixture).
- **Spec steps 3–10**: wire the roll to live BOM/routing + persist `ItemStandardCost`; WIP posting +
  variances (reconcile with existing `ProductionVariancePostingService`); bank-feed classification;
  QBO summary journals; pricing (cost-to-sell/floor/target) + quote guidance; analytics; prompt engine.

## Verified on Postgres (2026-08-21) — the "blocked" caveat was wrong

Docker was available all along (uid in the `docker` group, just not active in the shell — `sg docker -c`).
`CostingTier3PostgresTests` (forge-api `7dfe9d6d`) runs the 8 costing tables + EF model + freeze against
real pgvector via the PostgresFixture: schema applies cleanly, all 8 entities round-trip, freeze derives
the pool rate (8000/400=20) and composes the work-center rate. **2/2 pass.** So schema + EF + freeze are
now verified, not just compiled. Remaining unverified: UI visual-verify (Playwright); spec steps 3–10.

## A note on numbering

Two numbering schemes were in play and they collide. [SPEC.md](./SPEC.md) §10 is the
**build order** (1 = foundation, 2 = cost roll, 3 = WIP posting and variances, …). The
"Build status" sections below originally numbered their own increments 1/2/3, where "3" meant
"wire the roll to live BOM/routing". **Use the SPEC §10 numbering from here on.** In those
terms: build-order step 1 landed 2026-08-21, and build-order **step 2 (the cost roll, spec §3)
is complete as of 2026-08-27**. The next unbuilt increment is build-order step 3 (spec §4).

## Build status update — the cost roll, spec §3 (2026-08-26/27)

The cost roll is no longer an unwired evaluator: it reads live BOM + routing and persists
`ItemStandardCost`.

- **forge-db**: `bomlines` += `component_type` + `scrap_pct` (additive, defaulted) — the two fields
  spec §1.2 requires and `CostRollEvaluator` already branched on. Embedded schema regenerated.
- **forge.core**: `CostRollGraph` adapts live facts into the evaluator's shape — minutes/ms → hours,
  `SetupMinutes` + `RunMinutesLot` fold into the per-lot charge the evaluator amortizes, standard lot
  size = FixedOrderQuantity ?? MinimumOrderQuantity ?? 1, phantom detected from the *part* as well as
  the line, subcontract ops charge SUB only. Kahn sort rolls components before assemblies and drops
  BOM cycles instead of recursing into them. `CostElementJson` persists the spec's uppercase element map.
- **forge-api**: `POST /costing/tier3/periods/{id}/roll` (409 until the period is frozen, 409 on a
  closed period; re-roll updates in place and bumps `RollVersion`) + `GET .../item-costs`.
- **forge-ui**: `/costing/standards` — period picker loads what is already rolled, Roll button
  re-rolls, table shows all eight elements + total + lot + version, and the roll's diagnostics
  (cyclic parts, unrated work centers) surface as a warning band rather than being swallowed.
- **Verified**: 2404 forge-api tests green including a new Postgres roll test (schema + EF + roll +
  re-roll versioning, 19.90 standard from a seeded BOM/routing); 8 new pure `CostRollGraph` tests;
  forge-ui lint/lint:i18n/lint:standards/1498 tests/build green; Playwright static-serve screenshot
  of `/costing/standards` (no overflow, no raw i18n keys) — that pass caught and fixed a real gap
  (selecting a period showed nothing until you rolled).

**Not in this step:** `CostToSell` stays null (spec §6), labor crew is fixed at 1.0 (no crew field on
`Operation` yet), and operation-level `ScrapFactor` is not applied — the evaluator takes scrap on BOM
lines only. Spec steps 4–10 (WIP posting + variances, bank feed, QBO summary journals, pricing,
analytics, prompt engine) remain.

## Spec §3 closed out (2026-08-27)

The three residuals the roll shipped with are done, so build-order step 2 is complete:

- **§1.2 BOM fields are reachable.** `component_type` and `scrap_pct` landed with the roll but
  nothing could write them — phantom, expensed and scrap were dead columns. Both are now on the
  create/update commands (scrap validated 0–1), count as structural changes so they capture a BOM
  revision, are recorded in the revision snapshot (`bom_revision_lines` gained the same two
  columns), and are settable from both BOM authoring surfaces as a Component Type select and a
  Scrap % input. The Postgres roll test seeds 5% scrap and asserts material rolls at 10.50, not
  10.00 — the column is proven to reach the standard.
- **§3.2 purchased item standards.** The roll was taking every purchased component from
  `ManualCostOverride`, which shops do not maintain. Purchased material now comes from the
  quantity-weighted **landed** cost of the last N receipts (PO unit price + the freight allocated
  to that receipt); an explicit override still wins, and a part with no receipt history falls back
  to its persisted cost calculation. `GET /costing/tier3/purchased-standards` is the pre-freeze
  review — carried vs proposed, the drift, the receipts behind it, flagged past the threshold —
  surfaced as the Purchased tab with a flagged-only filter. N and the threshold are the system
  settings `costing.purchasedStandardReceipts` (3) and `costing.purchasedStandardDriftPct` (5),
  seeded with the same values the code falls back to.
- **§3.3 "where does the cost come from".** The stacked bar per part by element ships behind the
  Classic/Visual toggle on the Standards tab. Its palette was validated (lightness, chroma, CVD
  and normal-vision separation on every adjacent pair) rather than chosen by eye, and reuses the
  rate chart's conversion hues so the two charts read as one system.

**Still open in §3, deliberately:** the *indented* roll report — each operation's individual
contribution, this level beside lower level, per item. The persisted standard carries this-level
and rolled-up totals, so the table and chart cover the "what"; a per-operation breakdown needs
either a detail endpoint that re-runs the evaluator for one item or per-op rows persisted at roll
time. Worth doing when someone needs to argue with a number, not before.

**Also not built, and still true:** `CostToSell` stays null (spec §6), labor crew is fixed at 1.0
(no crew field on `Operation`), and operation-level `ScrapFactor` is not applied — the evaluator
takes scrap on BOM lines only.

## What build-order step 3 is, and whether it is documented

**Yes, and it is the best-specified step in the document.** SPEC §4 gives the WIP posting formulas
per element, the material-issue rule, PPV at receipt rather than issue, the overhead-applied
posting, the `POST /costing-periods/{id}/close` endpoint, and the four variance formulas (spending,
volume, efficiency, plus the labor rate/efficiency and material usage splits) with a worked
example of the generated explanation text. §11 carries its test fixtures (800 budgeted press-hours
against 620 actual, electricity 9% over, expected volume variance ≈ fixed_rate × 180) and reserves
the case-ID areas ABSB and VARI.

The one thing §4 does *not* settle is the reconciliation this repo has to make: Forge already has
`OverheadPoolService` and `ProductionVariancePostingService` posting variances into the FULLGL,
and §4 describes the same concepts for a shop whose GL is QBO. Which of those two owns the posting
— and whether Tier-3 variances feed the existing services or a parallel path — is an open
reconciliation, the same shape as the ones listed above. Decide it before writing the code.

## Reconciliations settled (2026-08-27)

Two of the three open reconciliations were answered by building the roll; recording them so they
are not re-litigated:

- **`ItemStandardCost` vs `CostCalculation`** — settled as proposed. `ItemStandardCost` is the
  Tier-3 **period-frozen** record, written only by the period roll and versioned per re-roll.
  `CostCalculation` stays the Tier-1/2 **live** calc and is untouched by Tier-3; the roll reads it
  only as the last fallback for a purchased part with no override and no receipt history. Nothing
  writes both, so the two cannot drift into disagreement about the same number.
- **`WorkCenter.BurdenRatePerHour` vs pool-derived rates** — settled as proposed, with one detail
  worth knowing: `FreezeCostingPeriod` uses the work center's flat `LaborCostPerHour` and
  `BurdenRatePerHour` as the *base* labour and machine rates and layers the pool-derived overhead
  on top as the LOH/MOHV/MOHF components. Tier-1 keeps the flat fields as its whole answer. So the
  flat rates are not dead under Tier-3 — they are its labour and machine base.

Still open: **pool → work-center mapping breadth.** A pool carries an optional `WorkCenterId` and
the freeze only composes rates from pools that name one. The "else applies to every work center in
its cost center, by driver" half was never built, so a pool with no `WorkCenterId` currently
absorbs nowhere. Decide and build this with build-order step 3 — under-absorption is exactly what
that step measures, and a silently unallocated pool would show up there as a variance nobody can
explain.

## Build-order step 3 — period close and variances (2026-08-27)

Built to decision [D1](./DECISIONS.md): Tier-3 **measures**, and does not decide where the numbers post.

- **Schema.** `costing_wip_transactions` (absorption trail), `costing_variances` (named variance with the
  quantities and rates behind it plus a generated explanation), `overhead_actuals` (what a pool really
  cost, and from which source). `work_centers` gains `costing_cost_center_id` — this closes the gap
  flagged above, where a pool naming a cost center rather than a work center had no way to resolve
  which work centers it measures.
- **`VarianceCalculator`** (pure, `Forge.Core.Costing`) — the §4.2 formulas plus the sentence each number
  gets. Positive is unfavorable throughout. The wording follows the spec's worked example: it calls a
  miss a "volume problem, not a cost problem" only when spending is genuinely on budget, and never when
  the rate is the real story. Explanations are generated English formatted en-US and stored as a record
  of what the close concluded — they are not re-rendered per viewer and do not go through i18n.
- **`DriverActualsResolver`** — measures each pool's driver from data production already captures: time
  entries for hour and labor-dollar drivers, production runs for units, receiving records for receipt
  count, and routing for the standard hours the period's output should have taken. Continuous posting
  during the period (§4.1's "as it happens") is **not** built; deriving at close produces the same
  period totals without touching every production handler, and the derived WIP rows are the trail.
- **`CloseCostingPeriod`** — refuses an unfrozen period (nothing to measure against) and a closed one,
  records spending/volume/efficiency per pool, writes the per-work-order absorption trail, auto-opens
  the next period with budgets carried forward, and replaces its own rows on a re-close rather than
  stacking a second set.
- **UI** — a Variances tab: close the period, read the variances with their explanations, see the
  overhead actuals they were measured against.

**Two things this deliberately does NOT do.**

1. **It posts nothing.** No journal entry, to either ledger. That is D1's invariant — exactly one path
   posts a given dollar, and on a FULLGL install the existing job close is already that path. Emitting
   Tier-3 variances outward arrives with the QBO adapter (build-order step 5), at which point the
   FULLGL reconciliation gets decided with real numbers in front of it.
2. **Machine hours and labor hours are the same number.** Time entries are the only hour source and crew
   size is not modelled on `Operation` — the same reason the cost roll fixes crew at 1.0. A pool on a
   machine-hour driver and one on a labor-hour driver will measure identically until a crew field or
   machine telemetry lands. `DriverActualsResolver` is where they diverge when it does.

**Also not sourced:** the material-dollar driver. A pool using it is **reported as skipped** by the
close rather than measured as zero — a zero would read as "absorbed nothing" and manufacture a large
volume variance out of nothing. PPV, material usage, labor rate/efficiency and subcontract price are
enumerated in `VarianceType` but only the three overhead variances are computed; the rest need the
per-job standard-vs-actual comparison that build-order step 3's job side would add.

## Step 3, second pass — corrected to standard practice (2026-08-27)

Two things changed after checking the implementation against standard cost accounting rather than against
the spec's formula block. Both are recorded as [D2](./DECISIONS.md).

- **The overhead model was wrong and is fixed.** Spending is now measured against the flexible budget
  (static budget for the fixed share, `rate × actual_qty` for the variable share), so spending + volume
  articulate to total under/over-absorption. A purely variable pool records no volume variance at all.
  Efficiency is reported alongside and its explanation says explicitly not to add it to the other two.
- **The job side is built.** Purchase price at receipt, material usage, and the labor rate/efficiency
  split — named separately rather than lumped, each holding one factor at standard.

**Now genuinely complete for build-order step 3** except subcontract price, which stays uncomputed on
purpose: one outside-processing PO line can cover several routing operations across jobs, so attribution
would be a guess rather than a measurement.
