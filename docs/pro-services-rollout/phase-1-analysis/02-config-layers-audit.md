# Artifact 2 — Config Layers Audit

State-of-play for the six existing config layers the application already runs on. Each layer gets the same treatment: what it is, how much of the codebase actually uses it today, what its gaps are relative to the Pro Services + Hybrid rollout, and what we should do with it.

This audit is the foundation for Artifact 3 (gap punch list) and Artifact 5 (preset format extension). Read it before either of those.

---

## Summary table

| # | Layer | Substrate exists? | Adoption today | Gap to Pro Services | Treatment |
|---|---|---|---|---|---|
| 1 | TerminologyService | ✅ | ~0% (0 `\| terminology` uses vs 4,297 `\| translate`) | Vocabulary swap is the headline Pro Services need and there's no path to it without adoption | **Adopt** — bundle terminology overrides into presets (D1), seed `terminology_overrides` per preset, retrofit entity-noun + status-verb usages to `\| terminology` |
| 2 | CapabilityCatalog | ✅ | ~95% (139 capabilities; gating middleware + behavior wired) | ~6 net-new caps needed for Pro Services + Cloud Storage + Migration | **Extend** — add `CAP-O2C-DELIVERABLE`, `CAP-EXT-CLOUD-STORAGE` umbrella + 3 providers, `CAP-ACCT-MIGRATION`, plus any uncovered service-shop verticals surfaced in the inventory matrix |
| 3 | Reference Data | ✅ | ~25% of expected groups seeded (15 of ~50-60 needed) | Major. Pro Services groups (engagement_type, project_phase, resource_skill, time_billable_status, etc.) don't exist | **Backfill** — seed missing groups, formalize per-preset seed bundles |
| 4 | Workflow Definitions | ✅ | 100% (only Part covered today; pattern proven, ready to extend) | Service-side workflows (Project, Engagement, Deliverable) need new definitions | **Extend** — author Pro Services workflow definitions; track types remain admin-editable post-install |
| 5 | Custom Fields | Partial (JSONB column exists on Job, Part, Lead) | ~0% in seed data | No admin UI; no per-preset defaults | **Build out OR descope** — recommend descope for Phase 3, prefer first-class columns gated by capability; reconsider after Pro Services real-world data |
| 6 | Presets | ✅ | 100% of installed presets apply correctly (8 records) | Format carries capability state only. Misses terminology, ref data, track types, roles, reports, folder maps | **Extend the schema** (Artifact 5). Add PRESET-08 (Pro Services) + PRESET-09 (Hybrid) records on the new schema |

---

## 1. TerminologyService — adoption is the gap, not the substrate

### What it is

`shared/services/terminology.service.ts` is an Angular service that:

- Loads a map of `{key → label}` from `GET /api/v1/terminology` at app init.
- Exposes `resolve(key)` and a corresponding `| terminology` pipe.
- Falls back to a humanized version of the key (`'entity_job'` → `"Job"`, `'status_in_production'` → `"In Production"`) when no override exists.
- Has an admin live-preview setter (`set(key, label)`).

The backend has a `terminology` endpoint and presumably a database table to back overrides. The substrate is end-to-end.

### How much it's used today

The exact opposite of what the design intended.

```
$ grep -c "| terminology" qb-engineer-ui/src/app
0

$ grep -c "| translate" qb-engineer-ui/src/app
4,297
```

**Zero adoption.** Every entity noun and status verb in the UI is rendered through `| translate`, which goes to ngx-translate's static `en.json` / `es.json` bundles. There is no path from the admin Terminology screen to most of what the user sees on a kanban card, a job detail, a parts list, a customer detail, etc.

The TerminologyService isn't broken — it's just unused.

### Why this matters for Pro Services

The first-order Pro Services adaptation is vocabulary:

- "Part" → "Service Item" / "Deliverable"
- "Job" → "Engagement" / "Project"
- "BOM" → (often hidden entirely; on Hybrid: "Service Components" or "Bundle")
- "Work Center" → "Resource" / "Practitioner"
- "In Production" → "In Delivery" / "Executing"
- "Shipped" → "Delivered" / "Completed"

Today there is no plausible way to deliver this without either (a) installing a second `en.json` (the "pro" locale), which forks the whole i18n bundle and breaks language overlays, or (b) adopting `TerminologyService` on the affected surfaces.

Per **D1**, option (b) is the chosen path: terminology bundles are preset attributes, not a separate layer.

### Gap to close

1. **Adoption sweep.** Identify the ~150-300 i18n keys that name entities and statuses (the renamable 🏷️ tier in the inventory matrix), and route those through `| terminology` instead of `| translate`. Other keys (form labels, button text, error messages, etc.) stay on `| translate` — they aren't vocabulary, they're UI copy.
2. **Per-preset terminology seed.** Each preset record carries a `terminologyBundle: Record<string, string>` JSON field. Apply-preset writes the bundle into the `terminology_overrides` table (so admin edits and preset switches share the same persistence).
3. **Hybrid behavior.** PRESET-09 (Hybrid) carries a partial bundle — e.g., renames "Job" → "Engagement" but leaves "Part" alone — because Hybrid shops do both make and service work.
4. **Conflict semantics.** When a user has edited a terminology key and a preset is re-applied that contains a different value for that key, prompt (don't overwrite). Track per-key "admin-edited" flag so apply-preset can identify what's safe to overwrite.

### Treatment

**Adopt.** This is the most user-visible single piece of Pro Services support. Without it, a Pro Services install reads as a manufacturing app with one preset toggled.

---

## 2. CapabilityCatalog — the substrate is mature; we add ~6 capabilities

### What it is

`qb-engineer.api/Capabilities/CapabilityCatalog.cs` is a static C# list of `CapabilityDefinition` records — code, area, name, description, default-on flag, optional required-roles list. The seeder upserts these into the `capabilities` table on startup (INSERT-on-missing only, never overwrites the `Enabled` column).

Gating is wired at two seams:

- **`CapabilityGateMiddleware`** — controller side. Reads `[RequiresCapability("CAP-X")]` attribute, short-circuits with `403 + envelope` when disabled.
- **`CapabilityGateBehavior`** — MediatR pipeline. Same attribute, same envelope, for handler-side enforcement (e.g., when a controller fans out to multiple commands).
- **`[CapabilityBootstrap]`** — exempts auth + descriptor + capability admin endpoints so admins can never lock themselves out.

Mutex and dependency edges live in `CapabilityCatalogRelations.cs`. Today there is exactly one mutex (`CAP-ACCT-EXTERNAL ⊥ CAP-ACCT-BUILTIN`) and a modest dependency graph.

### How much it's used today

**~95% saturated.** 139 capability rows in the catalog. Most controllers carry `[RequiresCapability]`; the integration surface (cloud storage, accounting, AI) is already wrapped.

The Phase 4 rollout (per `phase-4-output/PHASE-4-CLOSEOUT.md`) closed this layer out as production-ready.

### Gap to close

For the Pro Services + Cloud Storage + Migration rollout, the catalog needs:

1. **`CAP-O2C-DELIVERABLE`** — Pro Services entity: a deliverable / artifact / report produced as part of an engagement. Used by service shops that don't have parts but do have things they "ship."
2. **`CAP-EXT-CLOUD-STORAGE`** — umbrella for cloud storage integration (gates the whole `cloud-storage` admin page + the per-entity folder-link UI).
3. **`CAP-EXT-CLOUD-STORAGE-GDRIVE`** — Google Drive provider sub-cap.
4. **`CAP-EXT-CLOUD-STORAGE-ONEDRIVE`** — OneDrive provider sub-cap.
5. **`CAP-EXT-CLOUD-STORAGE-DROPBOX`** — Dropbox provider sub-cap.
6. **`CAP-ACCT-MIGRATION`** — accounting mode migration wizard. Auto-gated to `false` outside the eligibility window per Artifact 6.

Possibly:
7. **`CAP-PS-PROJECT`** — Pro Services project entity (if it lands as a distinct table rather than reusing Job).
8. **`CAP-PS-TIME-BILLABLE`** — billable / non-billable split on time entries (independent of having time-tracking enabled).
9. **`CAP-PS-RETAINER`** — retainer / prepaid-hours model.

(7-9 are tentative; the inventory matrix will confirm whether they map onto existing or new caps.)

### Dependency / mutex edges to add

- `CAP-EXT-CLOUD-STORAGE-GDRIVE` depends on `CAP-EXT-CLOUD-STORAGE`
- `CAP-EXT-CLOUD-STORAGE-ONEDRIVE` depends on `CAP-EXT-CLOUD-STORAGE`
- `CAP-EXT-CLOUD-STORAGE-DROPBOX` depends on `CAP-EXT-CLOUD-STORAGE`
- No mutex between the three providers (hybrid use is explicitly allowed per D9 — see `entity_cloud_links` table in Artifact 4).
- `CAP-ACCT-MIGRATION` depends on a transitionable accounting mode (defined as either built-in with at least one transactional row, or external with `IsConfigured`). Eligibility logic lives in the migration handler, not the catalog edge.

### Treatment

**Extend.** The catalog mechanism is in good shape; we register the new capabilities, add the edges, and move on.

---

## 3. Reference Data — substrate fine, seed coverage low

### What it is

`reference_data` table — single store for all categorical lookups: priorities, statuses, expense categories, lead sources, contact roles, currencies, state withholding codes, etc. Grouped by `group_code`. Admin-editable post-install via the `/admin/reference-data` page.

Frontend: `ReferenceDataService.getAsOptions(groupCode, { ... })` is the canonical accessor — feeds every dropdown and autocomplete in the UI.

### How much it's used today

The substrate is fine. Adoption is uneven.

Currently seeded in `SeedData.Essential.cs`:

```
asset_hold_type      contact_role          job_hold_type
job_priority         job_workflow_status   lead_source
po_workflow_status   quote_workflow_status return_reason
so_workflow_status   state_withholding     expense_category
currency             clock_event_type
```

15 groups seeded. The codebase uses `ReferenceDataService.getAsOptions` from ~40 sites — most of which point at one of the above groups; some point at groups that exist in the database but aren't seeded (UOMs, tax codes for non-US shops, employee skill categories); a few point at groups that don't exist at all yet.

### Why this matters for Pro Services

Pro Services needs categories the manufacturing seed doesn't have. Minimum set:

- `engagement_type` — Consulting / Project / Retainer / Ongoing Service / etc.
- `project_phase` — Discovery / Design / Build / Deliver / Maintain (configurable)
- `resource_skill` — practitioner skills for resource assignment
- `time_billable_status` — Billable / Non-Billable / Internal / Travel
- `time_activity_type` — Discovery / Design / Build / Testing / Documentation / Travel / Admin
- `deliverable_type` — Report / Code / Design / Documentation / Training / Other
- `service_uom` — Hour / Day / Week / Sprint / Engagement / Fixed Bid
- `client_segment` — Enterprise / Mid-Market / SMB / Public-Sector (replaces / sits alongside `customer_segment` if used)
- `engagement_status` — Proposal / Won / Active / Paused / Complete / Lost
- `retainer_status` — Active / Expired / Renewed

There may be more (Artifact 1 will surface them via the inventory matrix), but this is the floor.

### Treatment

**Backfill.** Each preset's seed bundle declares which ref-data groups it owns + their initial values. PRESET-04 (Production Manufacturer) seeds the manufacturing set; PRESET-08 (Pro Services) seeds the services set; PRESET-09 (Hybrid) seeds both. The apply-preset pipeline upserts these into `reference_data` on apply, respecting an `IsSeedData` flag (so admin-customized values aren't clobbered).

Per **the user's directive** that seed data should be JSON-based: the bundles live alongside preset definitions as embedded JSON, not as ad-hoc seed methods. Format spec in Artifact 5.

---

## 4. Workflow Definitions — substrate proven; needs Pro Services definitions

### What it is

`qb-engineer.api/Workflows/` houses the workflow substrate:

- `WorkflowSeedData.cs` — embedded JSON definitions, one per entity type. Today covers `Part` with 14 combo-specific definitions per the Pillar 6 audit.
- `IWorkflowEntityCreator`, `IWorkflowEntityPromoter` — interfaces that handle the gathering → ready promotion lifecycle.
- `PartWorkflowAdapter.cs` — the only production adapter; bridges the JSON definition to the Part entity.
- `PredicateEvaluator.cs` + `EntityReadinessService.cs` — evaluate the readiness predicates declared in the JSON.

The pattern is proven on Part (Pillar 6 of Phase 4 closed it out). It's ready to extend to other entities — service-side workflows would be straightforward additions.

### How much it's used today

100% for Part. 0% elsewhere — no other entity has a workflow definition. Job creation, Customer creation, Lead creation, etc. all use simple `Create*Handler` MediatR commands without the multi-step gathering pattern.

### Gap to close

For Pro Services, the candidate new workflow definitions are:

- **Engagement / Project workflow** — multi-step intake (client → scope → budget → SOW → start). May live on `Job` with axis fields rather than a new entity, depending on inventory matrix outcome.
- **Deliverable workflow** — what defines a deliverable as "ready to ship" (review state, sign-off state, file attached, etc.).
- **Retainer workflow** — initial-balance / start-date / billing-cycle setup.

These are optional. The minimum needed for PRESET-08 to function is workflow on Engagement/Project; the rest can land in Phase 3+.

### Track types — adjacent, not workflow definitions

Worth noting: kanban stages per track type live in `JobStage` entity (not in workflow definitions). Default track types (Production, R&D, Maintenance) are seeded in `SeedData.Essential.cs` with hardcoded stages. Pro Services and Hybrid need their own default track types + stages bundled into the preset.

Per the user's "seed data as part of the stereotype harnesses" directive, track-type + stage seeds become a preset-bundle field — see Artifact 5.

### Treatment

**Extend.** Author the Engagement/Project workflow definition for PRESET-08; defer Deliverable and Retainer workflows to Phase 3b or later if needed.

---

## 5. Custom Fields — exists in entity shape, not in admin UI or seed

### What it is

Three entities carry a `CustomFieldValues` JSONB column today: `Job`, `Part`, `Lead`. The new-lead-fork dialog already serializes shape-specific extras into `Lead.CustomFieldValues` (see `new-lead-fork-dialog.component.ts:212-216`).

`qb-engineer.core/Models/CustomFieldDefinitionModel.cs` exists but has no admin UI plumbing — no `custom_field_definitions` table seeder, no `/admin/custom-fields` page, no field-resolver service.

### How much it's used today

- **Storage path: live.** Lead extras round-trip through Lead.CustomFieldValues.
- **Definition path: nonexistent.** No table defining "what fields are valid for Lead on this install."
- **Render path: nonexistent.** No dynamic-field-renderer component reading from a definitions table.

### Gap to close

To support custom fields properly:
1. `custom_field_definitions` table — `(entityType, key, label, dataType, required, defaultValue, sortOrder)`.
2. Admin CRUD UI.
3. Per-entity dynamic-form-section component reading definitions + writing into the entity's JSONB column.
4. Preset-bundled defaults per entity.

### Treatment

**Descope from Phase 3 OR build out.** Recommend descope. Two reasons:

1. The Pro Services rollout has higher-leverage wins (terminology + ref data + workflow defs) that get a service shop to "this fits my business" faster than custom fields would.
2. Several Pro Services concepts that would be candidates for custom fields (engagement_type, project_phase, etc.) are better modeled as first-class capability-gated columns or as ref-data choices, which lights up downstream features (reports, filters, sorts) that JSONB doesn't.

If real-world Pro Services data reveals genuine "every shop is different" fields that don't generalize, we can build out the layer in a later phase. For now, leave the column there but skip the admin UI work.

---

## 6. Presets — the harness exists, the contents are too thin

### What it is

`PresetCatalog.cs` is a static list of immutable `PresetDefinition` records. The record (per Artifact 5a) carries five fields: `Id`, `Name`, `Description`, `TargetProfile`, `EnabledCapabilities`. Eight rows: PRESET-01 through PRESET-07 + PRESET-CUSTOM.

`ApplyPreset.cs` (MediatR handler) toggles capability state to match the chosen preset. It does NOT touch terminology, ref data, track types, roles, or reports.

`DiscoveryRecommendationEngine.cs` is a pure stateless function that recommends a preset from 22 question answers across A/B/C branches.

### How much it's used today

The capability state path works. Admin can pick a preset, the capability state migrates, the UI re-derives capability-gated visibility.

What doesn't work: everything adjacent. After a preset apply, the install's terminology is still the same, the reference data is still the same (manufacturing-flavored regardless of which preset was just picked), the track types are still Production/R&D/Maintenance/Other, the roles are still the eleven manufacturing roles, the reports are still all 30.

### Gap to close

Extend the preset format to carry:

- `terminologyBundle: Record<string, string>` (D1)
- `referenceDataSeed: Record<string, ReferenceDataSeed[]>` (per user's JSON-seed directive)
- `trackTypeSeed: TrackTypeSeed[]`
- `roleSeed: RoleSeed[]`
- `reportVisibilityFilter: string[]` (which reports apply)
- `folderMapSuggestions: FolderMapSuggestion[]` (cloud-storage default folder map, per D2)

Full schema in Artifact 5.

Extend `ApplyPreset.cs` to read these fields and seed/sync each in its own pipeline step, transactionally with capability state changes. Activity-log a `preset-applied` row per affected adjacency.

Add PRESET-08 (Pro Services) and PRESET-09 (Hybrid) records using the new schema.

### Discovery wizard (D4)

The wizard today asks 22 manufacturing-flavored questions across A/B/C branches (small / mid / large headcount). Per **D4** it gains one new top-of-funnel question:

> "Do you make products, sell time, or both?"

- "Make products" → routes into the existing 22-question tree (PRESET-01 through PRESET-07).
- "Sell time" → bypasses the manufacturing tree, lands on a Pro Services sub-tree (4-6 questions for PRESET-08 specifics: retainer model, team size, regulated services, etc.) and recommends PRESET-08.
- "Both" → asks a brief "which is bigger, and by how much" question, then recommends PRESET-09.

The recommendation engine grows a small sub-tree; the existing logic remains for the make path.

### Treatment

**Extend.** The harness is the right shape; the contents need fields and migrations to match what Pro Services needs.

---

## Cross-cutting observations

### Adoption is the bottleneck, not substrate

Five of the six layers (1, 2, 3, 4, 6) have the right substrate. The gap is in coverage / adoption / seed content, not in design. Layer 5 (custom fields) is the only one where substrate is genuinely incomplete, and we're recommending descope.

This means **Phase 2 (Foundations) is heavier on data + schema than on architecture.** The biggest workstreams are:

- Adopt `| terminology` in ~150-300 places (Layer 1).
- Backfill ~30-40 missing ref-data groups (Layer 3).
- Extend preset schema + apply pipeline + add 2 records (Layer 6).
- Register 6-9 new capabilities + edges (Layer 2).

### "Stereotype = capability set + JSON seed bundle"

The architectural framing the user named is correct and load-bearing: a preset is the union of its capability state (Layer 2) and its seed bundles for the other adjacencies (Layers 1, 3, 4, 6). Layer 5 (custom fields), if it stays, would also bundle.

The apply-preset pipeline becomes: capability delta → terminology override seed → reference-data seed → track-type seed → role seed → report-visibility seed → folder-map suggestion seed → audit row → SignalR push. All in one transaction.

### Hybrid is genuinely first-class

PRESET-09 (Hybrid) carries the union of its make + service parts at every layer — capability set, terminology bundle (partial; only renames what needs renaming), ref-data seed, track-type seed (both Production AND Project / Engagement tracks), role seed, report-visibility filter (all reports apply).

Treating Hybrid as a third stereotype (rather than a "manufacturing + service mode" toggle) is the right call because the seed content actually differs — partial terminology, both track types, both ref-data groups. That's a stereotype, not a flag.

### What's NOT a config layer

Worth saying out loud so we don't accidentally introduce a seventh layer:

- **System settings** (`SystemSetting` table) — install-level config (company name, fiscal year start, primary currency). Set once, rarely changed. Distinct from preset bundles, which describe a buyer profile and can be re-applied.
- **User preferences** (`user_preferences` table) — per-user UI prefs (theme, dashboard layout, table column widths). Survives logins, follows the user across devices. Not a preset concern.
- **Workflow runs** — per-entity-instance state. Not a definition.

Keep these clearly separate from the six audited layers.
