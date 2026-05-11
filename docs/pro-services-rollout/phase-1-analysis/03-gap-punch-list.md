# Artifact 3 — Gap-and-Treatment Punch List

Concrete code work for items tagged 🔧 (Needs decoupling) in Artifact 1's inventory matrix. Each row is one discrete decoupling task. Together they're the scope of the "manufacturing-implicit assumptions" cleanup needed before Pro Services can run cleanly.

This is distinct from Artifact 4 (catalog additions = new capabilities + tables + entities) — the punch list here is about lifting baked-in assumptions on existing code paths.

---

## Severity tiers

| Tier | Meaning | Phase target |
|---|---|---|
| **P1 — blocking** | Pro Services demo won't work without this | Phase 2 / 3a |
| **P2 — major friction** | Pro Services works but feels wrong without this | Phase 3a |
| **P3 — polish** | Pro Services works fine; this elevates from acceptable to good | Phase 3b+ |

---

## Punch list

### G-01 — Adopt `| terminology` on entity nouns and status verbs

- **Tier:** P1
- **Where:** ~150-300 sites across `qb-engineer-ui/src/app/features/` and `core/layout/`. Today: 0 uses of `| terminology`, 4,297 uses of `| translate`.
- **Problem:** TerminologyService loads bundles, the substrate works end-to-end, but no template pipes to it. So a preset's terminology bundle has nowhere to land at render time.
- **Treatment:** Sweep entity-noun + status-verb i18n keys (those tagged 🏷️ in Artifact 1) and switch their templates from `| translate` to `| terminology`. Sweep is mechanical:
  - Identify keys: `entity_*`, `status_*`, `action_start_production`, etc. — the keys named at noun/verb granularity. Skip `form_*`, `error_*`, `button_*` keys (these are UI copy, stay on translate).
  - For each identified key, find every `{{ 'key' | translate }}` usage; change to `{{ 'key' | terminology }}`.
  - When `TerminologyService.resolve('key')` falls back, humanize produces the same string `translate` produced (entity_job → "Job"), so the change is no-op for installs without overrides.
- **Risk:** Low — fallback behavior matches existing humanization.
- **Effort:** 5-8 engineering days (mechanical but high-volume).
- **Dependencies:** None (substrate exists).

### G-02 — Split `TimeEntry` into billable / non-billable

- **Tier:** P1
- **Where:** `qb-engineer.core/Entities/TimeEntry.cs`, `qb-engineer.api/Features/TimeTracking/*`, `qb-engineer-ui/src/app/features/time-tracking/`.
- **Problem:** TimeEntry today has no billable flag. Pro Services invoicing depends on knowing which hours are billable; reports (utilization, billable %) depend on the split. Today everything's treated as cost-bearing time, which is wrong for non-billable internal work.
- **Treatment:**
  - Add columns `IsBillable` (bool, default true), `BillRate` (numeric, nullable), `BillRateCurrency` (text, nullable), `ActivityTypeId` (FK to reference_data) on `time_entries` table (see Artifact 4 §3.7).
  - Update TimeEntry entity, models, handlers.
  - Add billable toggle + activity-type select to time-entry UI (cap-gated by `CAP-PS-TIME-BILLABLE` so manufacturing installs don't see the new fields).
  - Update existing reports that aggregate time to respect the flag (or surface both totals).
- **Risk:** Low — default true preserves existing behavior.
- **Effort:** 1.5-2 engineering days backend + 1 day UI.
- **Dependencies:** `CAP-PS-TIME-BILLABLE` registered (Artifact 4 §1).

### G-03 — Track-type seed becomes preset-scoped

- **Tier:** P1
- **Where:** `SeedData.Essential.cs` (hardcoded `Production / R&D / Maintenance / Other` track types + their stages).
- **Problem:** Track-type seed is install-time, hardcoded, manufacturing-flavored. Pro Services install gets Production as a default track on day one — completely wrong fit.
- **Treatment:**
  - Refactor `SeedData.Essential.cs` to NOT seed track types directly. Instead, mark them as "expected to be seeded by preset apply."
  - Move the existing 3 track types into PRESET-04's `TrackTypeBundle` (so PRESET-04 first-apply still produces the current default state).
  - PRESET-08's `TrackTypeBundle` carries Engagement (per Artifact 5 §3.3 example).
  - PRESET-09's bundle carries both manufacturing track types AND Engagement.
  - First-time-install bootstrap: ensure the default preset (per onboarding) gets applied before the user lands on the kanban page. (Already happens via setup wizard's "Pick preset" step — verify.)
- **Risk:** Medium — touches install bootstrap. Need an integration test that confirms a fresh-install + PRESET-04 → same track-type+stages as today.
- **Effort:** 2 engineering days backend + 1 day to author bundles.
- **Dependencies:** Preset format extension (Artifact 5) — bundles need to be carrying this data.

### G-04 — Kanban-stage seed becomes preset-scoped

- **Tier:** P1
- **Where:** Same as G-03.
- **Problem:** Same as G-03 — stages are hardcoded mfg-flavored (Quote Requested → Quoted → Order Confirmed → ... → Payment Received).
- **Treatment:** Bundled with G-03. Stages are children of the track type in `TrackTypeSeed`.
- **Risk:** Same.
- **Effort:** Folded into G-03.

### G-05 — Role seed becomes preset-scoped

- **Tier:** P1
- **Where:** Wherever the 11 mfg-flavored ApplicationRoles get seeded today (`SeedData.Essential.cs` or via Identity bootstrap).
- **Problem:** Seeded roles are mfg-flavored (Engineer, Production Worker, etc.). Pro Services needs Practitioner, Engagement Manager, Account Manager, Delivery Lead.
- **Treatment:**
  - Refactor role seed into preset's `RoleBundle`.
  - PRESET-04's `RoleBundle` carries the existing 11 roles (so PRESET-04 first-apply produces the current state).
  - PRESET-08's `RoleBundle` carries the 4-5 Pro Services roles (per Artifact 4 §5).
  - PRESET-09's `RoleBundle` carries the union.
- **Risk:** Medium — RoleBundle apply policy is `AddOnly` (Artifact 5 §3.4), so re-apply never removes admin-customized roles. Need to ensure first-apply seeds correctly.
- **Effort:** 1 engineering day backend + 0.5 day to author bundles.
- **Dependencies:** Preset format extension.

### G-06 — Reference-data seed becomes per-preset

- **Tier:** P1
- **Where:** `SeedData.Essential.cs` reference-data block (~136 rows across 15 groups today).
- **Problem:** Seed is mfg-flavored; misses Pro Services groups entirely (no engagement_type, project_phase, etc.).
- **Treatment:**
  - Refactor the existing seeded rows into PRESET-04's `ReferenceDataBundle`.
  - Author PRESET-08's `ReferenceDataBundle` with the 10 Pro Services groups (per Artifact 2 §3).
  - PRESET-09's bundle = union.
  - Apply pipeline uses `UpsertSeed` policy (default) — adds missing values, leaves admin-edited alone.
- **Risk:** Low — `UpsertSeed` is the right default.
- **Effort:** 1 engineering day backend (seed-method refactor) + 1 day to author PRESET-08 bundle + 0.5 day for PRESET-09.
- **Dependencies:** Preset format extension.

### G-07 — Report library gets per-preset visibility filter

- **Tier:** P2
- **Where:** `qb-engineer.api/Features/Reports/`, `qb-engineer-ui/src/app/features/reports/`. ~30 reports registered statically today.
- **Problem:** Every install sees all 30 reports regardless of preset. A Pro Services install sees "Scrap Rate," "Inventory Levels," "OEE by Work Center" — irrelevant clutter.
- **Treatment:**
  - Add `ReportVisibilityBundle` to preset format (Artifact 5 §3.5).
  - Add `report_visibility_settings` table per install (or store on `SystemSetting`).
  - Reports list endpoint filters by visibility settings.
  - Phase 3 ships 7-10 net-new Pro Services reports (engagement P&L, utilization, billable %, project margin, retainer burn-down, etc. — Artifact 4 §5).
- **Risk:** Low.
- **Effort:** 2 engineering days for visibility filter + 5 days for new Pro Services reports (the reports themselves, not the filter).
- **Dependencies:** Preset format extension.

### G-08 — Dashboard widget set becomes per-preset

- **Tier:** P2
- **Where:** `qb-engineer-ui/src/app/features/dashboard/`. Default widget set is utilization / scrap rate / OEE / WIP — manufacturing-flavored.
- **Problem:** Pro Services install gets a dashboard that doesn't describe what an engagement manager cares about. The widgets are still useful for Hybrid but irrelevant for pure services.
- **Treatment:**
  - Add `DashboardBundle` to preset format (Artifact 5 §3.8).
  - Implement Pro Services widgets: Utilization KPI, Billable % KPI, AR Aging chart, Active Engagements list, Recent Deliverables list, Upcoming Milestones calendar.
  - Apply-preset seeds default dashboard layout per role.
- **Risk:** Low — user can still drag widgets around post-apply; the seed is just a starting point.
- **Effort:** 3 engineering days for the new widgets + 1 day for the seed logic.
- **Dependencies:** Preset format extension. `CAP-PS-UTILIZATION` for utilization widget.

### G-09 — `CostCalculation` accommodates Pro Services costing model

- **Tier:** P2
- **Where:** `qb-engineer.core/Entities/CostCalculation.cs`, `CostingProfile.cs`, `CostCalculationInputs.cs`.
- **Problem:** Costing today is part-cost-flavored: rolls up BOM material cost + operation labor + overhead per unit. Pro Services costing is different: per-engagement T&M (time × rate) + pass-through expenses + fixed-bid amortization. The existing entity shape doesn't make this hard, but the existing handlers assume part-cost semantics.
- **Treatment:**
  - Audit existing costing handlers; identify which assume Part vs which work on any costable entity.
  - For entities that need engagement-level costing (Project / Job-as-engagement / Deliverable), write a parallel costing handler family (`CalculateEngagementCost`, `CalculateProjectCost`, etc.) that uses existing CostCalculation entity shape.
  - Add billing-model field to Project (`t_and_m | fixed_bid | retainer`) — Artifact 4 §3.6.
  - Hour-bucket cost rollup: sum TimeEntry where ProjectId = X and IsBillable = true, multiply by bill rate, add pass-through expenses.
- **Risk:** Medium — costing is a corner of the codebase with implicit assumptions; may surface unexpected joins to Parts.
- **Effort:** 3-4 engineering days.
- **Dependencies:** G-02 (TimeEntry billable), Project axis fields, `CAP-PS-PROJECT-COST`.

### G-10 — Folder-mapping suggestions in preset

- **Tier:** P2
- **Where:** New surface; today doesn't exist.
- **Problem:** Per D9, cloud storage gains folder-map suggestions per preset. Without this, every install starts with an empty folder layout and admins have to figure out their own conventions per entity type.
- **Treatment:**
  - Add `FolderMapBundle` to preset format (Artifact 5 §3.6).
  - PRESET-08 carries `/Customer/Project/{Proposal,Contracts,Deliverables,Working,Final}` layout.
  - PRESET-04 carries `/Customer/Job/{Drawings,Quote,Production,Shipping}` layout.
  - PRESET-09 carries both.
  - Folder auto-create (dual-path per D2) reads the suggestion when an entity is created.
- **Risk:** Low — suggestions, not enforcement.
- **Effort:** 2 engineering days + 1 day to author bundles.
- **Dependencies:** Cloud storage core (Artifact 4 §3.2-3.4), Preset format extension.

### G-11 — Discovery wizard top question + Pro Services sub-tree

- **Tier:** P2
- **Where:** `qb-engineer.api/Capabilities/Discovery/DiscoveryQuestionCatalog.cs`, `DiscoveryRecommendationEngine.cs`.
- **Problem:** Per D4 — the 22-question wizard assumes manufacturing from question 1. Pro Services prospects either don't see themselves in the questions or get steered to a mfg preset.
- **Treatment:**
  - Add one new top-of-funnel question: "Do you make products, sell time, or both?"
  - "Make" → routes into existing A/B/C tree.
  - "Sell time" → routes into new Pro Services sub-tree (4-6 questions: retainer model? team size? regulated services? etc.). Recommendation lands on PRESET-08.
  - "Both" → asks "which is bigger" question then recommends PRESET-09.
  - Extend `DiscoveryRecommendationEngine.cs` with the new branch logic.
- **Risk:** Low — additive.
- **Effort:** 1.5 engineering days backend + 0.5 day UI.
- **Dependencies:** PRESET-08 + PRESET-09 records exist.

### G-12 — Pro Services workflow definition for Project / Engagement

- **Tier:** P2
- **Where:** `qb-engineer.api/Workflows/WorkflowSeedData.cs`.
- **Problem:** Part is the only entity with a workflow definition today. Engagement intake (client → scope → budget → SOW → kickoff) benefits from the same multi-step gathering pattern.
- **Treatment:**
  - Author Engagement workflow definition JSON.
  - Implement `IWorkflowEntityCreator` adapter for Project entity.
  - Register definition in WorkflowSeedData.
  - Seed via PRESET-08's `WorkflowDefinitionBundle` (Artifact 5 §3.7).
- **Risk:** Low — substrate is proven on Part.
- **Effort:** 3 engineering days.
- **Dependencies:** `CAP-PS-PROJECT`, Preset format extension.

### G-13 — Pro Services dashboard widgets (`utilization_by_practitioner`, `billable_percent`, `project_margin`, `retainer_burn_down`)

- **Tier:** P2
- **Where:** `qb-engineer-ui/src/app/features/dashboard/widgets/`.
- **Problem:** No widget describes a service-shop's key metrics.
- **Treatment:** Build the 4 widgets (or more, per Artifact 4 §5). Each uses existing dashboard-widget plumbing.
- **Risk:** Low.
- **Effort:** Folded into G-08's 3-day estimate.
- **Dependencies:** G-08 plumbing, `CAP-PS-UTILIZATION`.

### G-14 — Cap-gated "Engineer" role permissions

- **Tier:** P3
- **Where:** Role-permission mapping (wherever it lives — `RoleTemplate` entity or hardcoded).
- **Problem:** Per D6, the Engineer role's permissions are split between "mfg engineer can move cards through production stages" and "services engineer / designer has different action scope." Decision: don't split into role variants; gate the action-permissions by capability.
- **Treatment:**
  - Map Engineer-role actions to capabilities (e.g., "move card through production stages" requires `CAP-MFG-SHOPFLOOR`, "approve compliance form" requires `CAP-QC-COMPLIANCE-FORMS`).
  - Pro Services install with `CAP-MFG-*` off → Engineer can't see mfg actions in their kanban; everything else applies normally.
- **Risk:** Low.
- **Effort:** 1.5 engineering days.
- **Dependencies:** Existing capability gating.

### G-15 — Apply-preset pipeline grows seven layer-apply methods

- **Tier:** P1
- **Where:** `qb-engineer.api/Capabilities/Discovery/ApplyPreset.cs`.
- **Problem:** Pipeline today only writes capability state. To carry stereotypes, it needs to seed terminology, ref data, track types, roles, reports, folder maps, workflow defs, dashboards.
- **Treatment:** Add 7-8 layer-apply methods, each transactional with capability state. See Artifact 5 §4.
- **Risk:** Medium — re-apply semantics need care; conflict policies have to be respected.
- **Effort:** 4 engineering days.
- **Dependencies:** Preset format extension, ref-data + terminology table schemas (Artifact 4 §3.1).

### G-16 — Service UOMs in seed (Hour, Day, Week, Sprint, Engagement, Fixed-Bid)

- **Tier:** P2
- **Where:** UoM seed (today mfg UOMs only).
- **Problem:** Pro Services quotes / invoices need service UOMs.
- **Treatment:**
  - Add service UOMs to PRESET-08's seed (under a UOMs sub-bundle if we keep UoM separate from ref-data; otherwise as a ref-data group under `service_uom`).
  - Recommend ref-data group `service_uom` for simplicity — UoM table is more complex than needed for service hours.
- **Risk:** Low.
- **Effort:** 0.5 engineering day.
- **Dependencies:** Ref-data bundle.

### G-17 — Verify Project entity is the right home for Engagement (vs new Engagement entity)

- **Tier:** P1 spike, then implementation per spike outcome.
- **Where:** `qb-engineer.core/Entities/Project.cs` — exists but lightly used today.
- **Problem:** Pro Services needs a first-class "engagement" entity. Question: extend `Project` with axis fields, or stand up new `Engagement` entity?
- **Treatment:**
  - Phase 2 spike: read current Project usage; identify what touches it; estimate cost of extension vs new entity.
  - Recommend extension (cheaper, reuses existing infra) unless spike surfaces blocker.
  - Add axis fields per Artifact 4 §3.6.
- **Risk:** Medium — wrong call here ramifies through Phase 3.
- **Effort:** 1 day spike + 1-2 days implementation per outcome.
- **Dependencies:** None for spike.

### G-18 — Bootstrap exemption for cloud-storage admin endpoints

- **Tier:** P1
- **Where:** `qb-engineer.api/Capabilities/RequiresCapabilityAttribute.cs` / `CapabilityBootstrap` list.
- **Problem:** Admin connects first cloud-storage provider → endpoint must be reachable even though `CAP-EXT-CLOUD-STORAGE` is off. Same for accounting migration.
- **Treatment:** Mark `POST /api/v1/cloud-storage/providers`, `GET /api/v1/cloud-storage/providers`, migration endpoints (per Artifact 4 §6) as `[CapabilityBootstrap]`.
- **Risk:** Low.
- **Effort:** 0.5 engineering day.
- **Dependencies:** Cloud storage controllers built.

### G-19 — Cap-gated `parts/`, `inventory/`, `quality/`, `mrp/`, `oee/`, `shop-floor/` routes hidden cleanly

- **Tier:** P2
- **Where:** Route configs + sidebar nav.
- **Problem:** Most feature routes already check capability via guards. Pro Services install with all `CAP-MFG-*` + `CAP-INV-*` off should never see these in the sidebar or land on them via direct URL.
- **Treatment:** Audit route guards + sidebar nav builder. Add `capabilityGuard` where missing. Sidebar nav should hide entire nav groups when all sub-items are cap-disabled.
- **Risk:** Low.
- **Effort:** 1.5 engineering days.
- **Dependencies:** None (existing infrastructure).

### G-20 — Activity log for preset apply per layer

- **Tier:** P3
- **Where:** `ApplyPreset.cs`.
- **Problem:** Today's activity log row says "preset applied: PRESET-XX." Doesn't say which layer changed what.
- **Treatment:** Each layer-apply method returns counts (added/updated/skipped/conflicted). Pipeline emits one activity row per layer that produced any change.
- **Risk:** Low.
- **Effort:** 0.5 engineering day (folded into G-15).
- **Dependencies:** G-15.

---

## Effort summary

| Tier | Days |
|---|---|
| P1 (blocking) — G-01 + G-02 + G-03/04/05 + G-06 + G-15 + G-17 + G-18 | ~22-25 |
| P2 (major friction) — G-07 + G-08 + G-09 + G-10 + G-11 + G-12 + G-13 + G-16 + G-19 | ~18-22 |
| P3 (polish) — G-14 + G-20 | ~2-3 |
| **Total** | **~42-50 engineering days** |

Numbers overlap with Artifact 4's effort sizing (G-03/04/05/06/15 are the preset-bundle work counted there). Don't double-count: the union is ~70 engineering days, not 42 + the catalog additions estimate.

---

## Sequencing recommendation

Phase 2 (Foundations) — focus on substrate:

1. G-15 (apply-preset extension)
2. G-03/04/05/06 (preset bundles refactor)
3. G-11 (discovery wizard top question)
4. G-17 (Project entity spike)
5. G-02 (TimeEntry billable)
6. G-18 (bootstrap exemptions)
7. G-01 (terminology adoption sweep — parallelizable, can run alongside)

Phase 3a (Pro Services functional) — features:

8. G-07 (report visibility) + Pro Services reports
9. G-08 + G-13 (dashboard + widgets)
10. G-09 (cost calc)
11. G-10 (folder maps)
12. G-12 (workflow def)
13. G-16 (service UOMs)
14. G-19 (route guards audit)

Phase 3b (polish) —

15. G-14 (Engineer role gating)
16. G-20 (per-layer activity log)
17. Migration tooling per Artifact 6 (independent track — can run in parallel with 3a)

---

## Items deliberately NOT on this list

For clarity:

- **Custom field admin UI.** Descoped per Artifact 2 §5 (recommend prefer first-class capability-gated columns).
- **Per-entity workflow editor.** Workflow defs are seeded JSON; admin editor is a separate later effort.
- **Multi-tenant.** Stays single-tenant.
- **Service shop kiosk / mobile-first.** Not in this phase. Existing kiosk is mfg-only by design.
- **Time approval workflows.** Not in this phase. Time-tracking adds billable flag; approval flow remains current.
- **Subcontractor 1099 management.** Behind `CAP-PS-SUBCONTRACTOR-MGMT` per Artifact 4 §1, deferred to Phase 3b or later.

These can revisit after Phase 3 ships and ArmoryWorks real-world data tells us where the next pain points are.
