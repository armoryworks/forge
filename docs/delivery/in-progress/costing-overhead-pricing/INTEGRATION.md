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
