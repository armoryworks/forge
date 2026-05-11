# Artifact 5a — Current Preset Format (Reference)

Pre-extension state of qb-engineer's preset definition format. This brief is the factual baseline that the extension spec (Artifact 5) builds on. **No proposed changes here** — only what exists today.

## 1. Preset record shape

The preset catalog lives at `qb-engineer-server/qb-engineer.api/Capabilities/Discovery/PresetCatalog.cs` as a static list of immutable C# records. The record definition itself is in `PresetDefinition.cs`.

### 1.1 Current `PresetDefinition` fields

```
PresetDefinition
├── Id                    // e.g. "PRESET-01"
├── Name                  // "Two-Person Shop"
├── Description           // Long-form prose describing the target buyer
├── TargetProfile         // String summarizing headcount / regulation / multi-site
└── EnabledCapabilities   // HashSet<string> of capability codes
```

Five fields total. The record is immutable; presets are values, not entities. There is no per-preset persistence — the catalog is read-only at runtime.

### 1.2 What's missing for stereotype harnesses (D1 + the user's "JSON-based seed" note)

The current shape carries only capability state. It does not carry:

- Default terminology overrides.
- Default reference-data seeds.
- Default track types or kanban stages.
- Default ApplicationRoles.
- Default report-visibility filter.
- Default folder-mapping suggestions (for cloud storage).

These are the fields the extension spec (Artifact 5) adds. The user's directive that seed data should be JSON-based aligns with extending the preset format to carry JSON-typed fields for each of the above.

## 2. Apply pipeline

When an admin selects a preset, `ApplyPreset.cs` (MediatR command handler) does the following:

1. Loads the preset by ID from the static catalog.
2. Loads the current capability snapshot for the install from the database.
3. Computes the delta: which capability codes are in `preset.EnabledCapabilities` but not currently enabled (turn on); which are currently enabled but not in the preset (turn off).
4. Validates the delta against dependency edges and mutex constraints in `CapabilityCatalogRelations.cs`.
5. Writes the resulting changes to the `capabilities` table inside one transaction.
6. Emits an `ActivityLog` row tagged `preset-applied` with the preset ID and delta summary.
7. Pushes a SignalR `capabilityChanged` event so connected admins see the UI update.

**What it doesn't do today**: touch track types, reference data, roles, terminology, reports, or folder mappings. Capability state is the only thing the apply pipeline writes.

The extension changes this. After the extension, the apply pipeline grows additional steps to seed/sync the JSON-bundled fields per preset — described in Artifact 5.

## 3. Adjacent seeds — current state

For each adjacent seed surface that the extension makes preset-scoped, the current state:

### Track types

- Seeded once at install via `DataSeeder.cs` with four hardcoded types: Production, R&D, Maintenance, Other.
- All four are manufacturing-flavored by default.
- Track types are admin-editable post-install (rename, add new, soft-delete) via the admin Track Types page.
- **Not preset-scoped today.** A Pro Services install sees Production / R&D / Maintenance / Other on day one.

### ApplicationRoles

- Seeded once at install with 11 hardcoded roles (the F-015 inflation over the 6 in the original spec).
- Role definitions include role name + default permission set.
- Roles are admin-creatable post-install.
- **Not preset-scoped today.**

### Reference data

- Seeded once at install via `ReferenceDataSeeder.cs` (or equivalent) with default values for currencies, UOMs, tax codes, expense categories, lead sources, priorities, statuses, and ~15 other categorical lookups.
- Admin-editable via the admin Reference Data page.
- **Not preset-scoped today.** Pro Services and Manufacturing presets receive identical reference-data seed.

### Kanban stages

- Defined per track type as a list of stages with name, color, ordering, and an `IsShopFloor` flag.
- Seeded with each default track type at install.
- Production track type's stages are manufacturing-flavored ("Materials Ordered", "In Production", "QC/Review", etc.).
- Admin-editable post-install via the Track Types admin page.
- **Not preset-scoped today.**

### Report library

- Reports are registered statically in code (operational, financial, etc.).
- All ~30 reports visible to every install regardless of capability or preset.
- **Not preset-scoped today.** A Pro Services install sees Quality / Scrap Rate / Inventory Levels reports alongside the services-applicable ones.

### Cloud-storage folder mappings

- Does not exist today. Introduced as part of the Drive integration work (Amendment 2 / D9).
- **Not preset-scoped today** because it doesn't exist today. The extension introduces it as preset-scoped from the start.

## 4. The three representative presets summarized

### PRESET-01 — Two-Person Shop

- Headcount: 1-3.
- Target: lightest manufacturing entry-point.
- Capability set: 41 default-on capabilities only (the baseline). No additional opt-ins enabled.
- Notable: `CAP-ACCT-BUILTIN` on; `CAP-ACCT-EXTERNAL` off. No formal floor (no `CAP-MFG-SHOPFLOOR`). No inspection workflow.

### PRESET-04 — Production Manufacturer

- Headcount: 25-200.
- Target: canonical "real factory" preset; centroid of the Manufacturing stereotype.
- Capability set: baseline + multi-op routing, shop floor, variance tracking, optional approvals, optional MRP, full operational reporting.
- Notable: `CAP-ACCT-EXTERNAL` on (QuickBooks-typical); `CAP-MFG-SHOPFLOOR` on; `CAP-MFG-ROUTING-MULTIOP` on; `CAP-INV-CYCLECOUNT` on.

### PRESET-07 — Enterprise

- Headcount: 200+.
- Target: large-scale manufacturer with regulatory / multi-site / advanced-planning needs.
- Capability set: baseline + full QC stack + APS + MPS + CPQ + EDI + multi-currency + BI export + payroll + training + projects.
- Notable: every regulated-mfg capability on; APS scheduling on; multi-currency on; the full report library applies.

## 5. Discovery wizard flow at a glance

`DiscoveryRecommendationEngine.cs` is a pure stateless function:

- Inputs: customer's answers to 22 questions across 6 branches (A/B/C, determined by headcount and complexity signals).
- Branches:
  - **A** — small (< 10 headcount).
  - **B** — mid (10-100).
  - **C** — large (100+).
- Regulation override and soft signals (lot/serial tracking, audit pressure, multi-site) can shift the preset choice within a branch.
- Output: a recommendation with:
  - Preset ID (one of PRESET-01 through PRESET-07).
  - Confidence (0-1).
  - Rationale string.
  - Decision factors.
  - 1-2 alternative presets if applicable.
- Per-install capability deltas computed at preview/apply time (engine + current-snapshot comparison).

**What the wizard doesn't do today (D4 amendment)**: ask the "make / sell time / both" question. Today's first question routes inside the assumed-manufacturing tree. The extension adds one new top-question before the existing 22, routing "make" to the existing tree, "sell time" directly to PRESET-08, and "both" to PRESET-09.

## 6. Key files for the extension to touch

- `PresetDefinition.cs` — gains new fields.
- `PresetCatalog.cs` — existing 8 records gain values for the new fields; PRESET-08 and PRESET-09 added.
- `ApplyPreset.cs` — apply pipeline grows steps for terminology / refdata / tracktype / role / report seeding.
- `CapabilityCatalogRelations.cs` — relations involving PRESET-08 and PRESET-09 registered.
- `DiscoveryRecommendationEngine.cs` — first-question routing added.
- `DataSeeder.cs` and adjacent seeders — refactored to read from preset-scoped seed JSON rather than hardcoded constants.

Artifact 5 details the field-by-field schema for the extension and the migration path from hardcoded seeds to JSON-bundled seeds.
