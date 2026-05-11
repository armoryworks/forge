# Artifact 5 — Preset Format Extension Spec

How the `PresetDefinition` record changes to carry JSON-bundled seed data, and how `ApplyPreset.cs` evolves to seed/sync those bundles. This is the architectural framing the user named — **"stereotype = capability set + JSON seed bundle"** — turned into a concrete schema.

Read Artifact 5a (current preset format) first if you haven't.

---

## 1. Design goals

1. **Capture the full stereotype.** A preset should describe enough that applying it transforms a generic install into one that looks and feels right for the buyer profile. Capability state alone is not enough — terminology, ref data, track types, roles, reports, and folder-maps are equally part of the stereotype.
2. **JSON-bundled, not parallel C# tables.** Per the user's directive that seed data should be JSON-based. Bundles travel alongside the preset record, not as a parallel set of static C# classes per preset. This keeps add/edit/refactor of a preset localized to one file.
3. **Preserve admin edits.** Re-applying a preset must not silently overwrite admin customization. Each bundle's apply step honors an "admin-edited" flag.
4. **Transactional apply.** The whole apply pipeline runs in one DB transaction. If any step fails, no partial state is written. SignalR push happens after commit.
5. **Activity-logged.** Each bundle's apply produces one `ActivityLog` row tagged `preset-applied` with a summary of what changed.

---

## 2. Extended `PresetDefinition` record

```csharp
public sealed record PresetDefinition
{
    // === Existing fields (unchanged) ===
    public string Id { get; init; } = default!;                        // "PRESET-08"
    public string Name { get; init; } = default!;                      // "Pro Services"
    public string Description { get; init; } = default!;
    public string TargetProfile { get; init; } = default!;
    public HashSet<string> EnabledCapabilities { get; init; } = new();

    // === New fields (the bundle) ===
    public TerminologyBundle? TerminologyBundle { get; init; }
    public ReferenceDataBundle? ReferenceDataBundle { get; init; }
    public TrackTypeBundle? TrackTypeBundle { get; init; }
    public RoleBundle? RoleBundle { get; init; }
    public ReportVisibilityBundle? ReportVisibilityBundle { get; init; }
    public FolderMapBundle? FolderMapBundle { get; init; }
    public WorkflowDefinitionBundle? WorkflowDefinitionBundle { get; init; }
    public DashboardBundle? DashboardBundle { get; init; }
}
```

Each bundle is nullable so existing presets (PRESET-01 through PRESET-07) can opt in incrementally — null = "preset doesn't override this layer; apply leaves it alone."

---

## 3. The seven bundles

### 3.1 `TerminologyBundle`

```csharp
public sealed record TerminologyBundle
{
    /// <summary>
    /// Key → label mapping. Keys match the terminology key convention
    /// (entity_*, status_*, action_*, label_*). Apply writes these into
    /// the `terminology_overrides` table.
    /// </summary>
    public Dictionary<string, string> Labels { get; init; } = new();

    /// <summary>
    /// Locale-specific overlays. Optional. The default Labels mapping is
    /// treated as en-US unless a locale entry overrides.
    /// </summary>
    public Dictionary<string, Dictionary<string, string>>? LocaleOverlays { get; init; }

    /// <summary>
    /// Conflict policy for apply. Default = SkipAdminEdited.
    /// </summary>
    public TerminologyConflictPolicy ConflictPolicy { get; init; } = TerminologyConflictPolicy.SkipAdminEdited;
}

public enum TerminologyConflictPolicy
{
    SkipAdminEdited,    // Don't touch keys the admin has edited (default)
    Overwrite,          // Re-seed all keys regardless (use for first-apply / migration)
    Prompt              // Apply pipeline returns conflict list; UI presents merge dialog
}
```

**PRESET-08 example:**

```csharp
TerminologyBundle = new()
{
    Labels = new()
    {
        ["entity_job"] = "Engagement",
        ["entity_part"] = "Service Item",
        ["entity_work_center"] = "Resource",
        ["entity_planning_cycle"] = "Sprint",
        ["status_in_production"] = "In Delivery",
        ["status_shipped"] = "Delivered",
        ["action_start_production"] = "Start Delivery",
        ["label_bom"] = "Components",
        // ... ~30-40 more
    },
}
```

**PRESET-09 (Hybrid) example:**

```csharp
TerminologyBundle = new()
{
    Labels = new()
    {
        // Partial overlay — renames Job to keep both worlds happy
        ["entity_job"] = "Engagement",            // Hybrid renames Job
        ["entity_planning_cycle"] = "Sprint",     // and planning cycle
        // Leaves entity_part, entity_work_center, etc. alone — physical
        // and service entities coexist with manufacturing vocabulary
    },
}
```

### 3.2 `ReferenceDataBundle`

```csharp
public sealed record ReferenceDataBundle
{
    /// <summary>
    /// Map of group_code → list of ref-data values to seed for that group.
    /// Apply upserts these into the reference_data table with IsSeedData=true.
    /// </summary>
    public Dictionary<string, List<ReferenceDataValueSeed>> Groups { get; init; } = new();

    /// <summary>
    /// Conflict policy for apply.
    /// </summary>
    public ReferenceDataConflictPolicy ConflictPolicy { get; init; } = ReferenceDataConflictPolicy.UpsertSeed;
}

public sealed record ReferenceDataValueSeed
{
    public string Code { get; init; } = default!;
    public string Label { get; init; } = default!;
    public int SortOrder { get; init; }
    public string? Metadata { get; init; }  // JSON string for color, icon, etc.
}

public enum ReferenceDataConflictPolicy
{
    UpsertSeed,         // Add missing values, leave admin-customized values alone (default)
    Overwrite,          // Re-seed all values
    Skip                // Don't touch existing groups, only seed empty ones
}
```

**PRESET-08 example:**

```csharp
ReferenceDataBundle = new()
{
    Groups = new()
    {
        ["engagement_type"] = new()
        {
            new() { Code = "consulting", Label = "Consulting", SortOrder = 1 },
            new() { Code = "project", Label = "Project", SortOrder = 2 },
            new() { Code = "retainer", Label = "Retainer", SortOrder = 3 },
            new() { Code = "ongoing_service", Label = "Ongoing Service", SortOrder = 4 },
        },
        ["project_phase"] = new()
        {
            new() { Code = "discovery", Label = "Discovery", SortOrder = 1 },
            new() { Code = "design", Label = "Design", SortOrder = 2 },
            new() { Code = "build", Label = "Build", SortOrder = 3 },
            new() { Code = "deliver", Label = "Deliver", SortOrder = 4 },
            new() { Code = "maintain", Label = "Maintain", SortOrder = 5 },
        },
        ["time_billable_status"] = new()
        {
            new() { Code = "billable", Label = "Billable", SortOrder = 1, Metadata = "{\"color\":\"#15803d\"}" },
            new() { Code = "non_billable", Label = "Non-Billable", SortOrder = 2, Metadata = "{\"color\":\"#94a3b8\"}" },
            new() { Code = "internal", Label = "Internal", SortOrder = 3 },
            new() { Code = "travel", Label = "Travel (non-billable)", SortOrder = 4 },
        },
        // ... ~7 more groups
    },
}
```

### 3.3 `TrackTypeBundle`

```csharp
public sealed record TrackTypeBundle
{
    public List<TrackTypeSeed> TrackTypes { get; init; } = new();
    public TrackTypeConflictPolicy ConflictPolicy { get; init; } = TrackTypeConflictPolicy.UpsertByCode;
}

public sealed record TrackTypeSeed
{
    public string Code { get; init; } = default!;
    public string Name { get; init; } = default!;
    public int SortOrder { get; init; }
    public bool IsDefault { get; init; }
    public bool IsShopFloor { get; init; }
    public List<JobStageSeed> Stages { get; init; } = new();
}

public sealed record JobStageSeed
{
    public string Code { get; init; } = default!;
    public string Name { get; init; } = default!;
    public int SortOrder { get; init; }
    public string Color { get; init; } = "#94a3b8";
    public bool IsShopFloor { get; init; }
    public bool IsIrreversible { get; init; }
    public AccountingDocumentType? AccountingDocumentType { get; init; }
    public int? WipLimit { get; init; }
}

public enum TrackTypeConflictPolicy
{
    UpsertByCode,       // Add if track-type's code missing; leave existing alone (default)
    AddOnly,            // Only add new track types; never modify or delete
    Replace             // Full replacement (dangerous — only for first-time apply)
}
```

**PRESET-08 example (excerpt):**

```csharp
TrackTypeBundle = new()
{
    TrackTypes = new()
    {
        new()
        {
            Code = "engagement",
            Name = "Engagement",
            SortOrder = 1,
            IsDefault = true,
            Stages = new()
            {
                new() { Code = "proposal", Name = "Proposal", SortOrder = 1, Color = "#94a3b8" },
                new() { Code = "won", Name = "Won", SortOrder = 2, Color = "#0d9488", AccountingDocumentType = AccountingDocumentType.SalesOrder },
                new() { Code = "discovery", Name = "Discovery", SortOrder = 3, Color = "#0ea5e9" },
                new() { Code = "active", Name = "Active Delivery", SortOrder = 4, Color = "#f59e0b" },
                new() { Code = "review", Name = "In Review", SortOrder = 5, Color = "#ec4899" },
                new() { Code = "delivered", Name = "Delivered", SortOrder = 6, Color = "#15803d" },
                new() { Code = "invoiced", Name = "Invoiced", SortOrder = 7, Color = "#dc2626", AccountingDocumentType = AccountingDocumentType.Invoice, IsIrreversible = true },
                new() { Code = "paid", Name = "Paid", SortOrder = 8, Color = "#16a34a", AccountingDocumentType = AccountingDocumentType.Payment, IsIrreversible = true },
            },
        },
    },
}
```

### 3.4 `RoleBundle`

```csharp
public sealed record RoleBundle
{
    public List<RoleSeed> Roles { get; init; } = new();
    public RoleConflictPolicy ConflictPolicy { get; init; } = RoleConflictPolicy.AddOnly;
}

public sealed record RoleSeed
{
    public string Code { get; init; } = default!;       // "engagement_manager"
    public string Name { get; init; } = default!;       // "Engagement Manager"
    public string? Description { get; init; }
    public List<string> DefaultCapabilities { get; init; } = new();  // CAP-* codes granted
    public List<string> DefaultPermissions { get; init; } = new();   // permission keys
}

public enum RoleConflictPolicy
{
    AddOnly,            // Add missing roles; never modify existing (default — safest)
    UpsertByCode        // Add or update by code
}
```

**Conservative default: `AddOnly`.** Roles tend to accumulate org-specific permission grants; re-applying a preset should never strip permissions an admin added.

### 3.5 `ReportVisibilityBundle`

```csharp
public sealed record ReportVisibilityBundle
{
    /// <summary>
    /// Report codes that should be visible under this preset. Absence
    /// means hidden. Empty list = hide all (rare). Null bundle = show all
    /// (preserves current behavior).
    /// </summary>
    public HashSet<string> VisibleReportCodes { get; init; } = new();
}
```

**PRESET-08 example:**

```csharp
ReportVisibilityBundle = new()
{
    VisibleReportCodes = new()
    {
        "report.engagement_pl",
        "report.utilization_by_practitioner",
        "report.billable_percent",
        "report.ar_aging",
        "report.time_by_activity",
        "report.project_margin",
        "report.retainer_burn_down",
        "report.deliverable_status",
        "report.client_revenue",
        "report.expense_summary",
    },
}
```

### 3.6 `FolderMapBundle`

```csharp
public sealed record FolderMapBundle
{
    /// <summary>
    /// Default folder layout suggestions per entity type. Used by D9 cloud
    /// storage auto-create. Each entry says: when an entity of type X is
    /// created, suggest creating a folder at path Y (with token substitution).
    /// </summary>
    public List<FolderMapSuggestion> Suggestions { get; init; } = new();
}

public sealed record FolderMapSuggestion
{
    public string EntityType { get; init; } = default!;     // "Project" | "Customer" | "Job"
    public string PathTemplate { get; init; } = default!;   // "/{Customer}/{Project}/"
    public List<string> SubfolderNames { get; init; } = new();  // ["Proposal", "Contracts", "Deliverables"]
    public bool AutoCreateOnEntityCreate { get; init; } = true;
}
```

**Tokens** supported in `PathTemplate`: `{Customer}`, `{Project}`, `{Job}`, `{Year}`, `{Month}`, `{EngagementType}`, `{Quarter}`.

**PRESET-08 example:**

```csharp
FolderMapBundle = new()
{
    Suggestions = new()
    {
        new()
        {
            EntityType = "Customer",
            PathTemplate = "/{Customer}/",
            SubfolderNames = new() { "00-General", "01-Contracts", "02-Engagements" },
        },
        new()
        {
            EntityType = "Project",
            PathTemplate = "/{Customer}/02-Engagements/{Project}/",
            SubfolderNames = new() { "Proposal", "Contracts", "Discovery", "Working", "Deliverables", "Final" },
        },
    },
}
```

### 3.7 `WorkflowDefinitionBundle`

```csharp
public sealed record WorkflowDefinitionBundle
{
    /// <summary>
    /// Workflow definition JSON strings keyed by entity type. Apply
    /// upserts these into workflow_definitions table.
    /// </summary>
    public Dictionary<string, string> DefinitionsByEntityType { get; init; } = new();
}
```

**PRESET-08 example:**

```csharp
WorkflowDefinitionBundle = new()
{
    DefinitionsByEntityType = new()
    {
        ["Project"] = @"{...JSON workflow def for project intake → discovery → active...}",
        ["Deliverable"] = @"{...JSON workflow def for deliverable draft → review → approved → delivered...}",
    },
}
```

Validation: each workflow JSON must parse, reference known validator IDs, and not collide with existing definitions for the same entity type. (Apply pipeline does this check before commit.)

### 3.8 `DashboardBundle`

```csharp
public sealed record DashboardBundle
{
    /// <summary>
    /// Default dashboard widget layout for this preset's primary roles.
    /// </summary>
    public Dictionary<string, List<DashboardWidgetSeed>> LayoutsByRole { get; init; } = new();
}

public sealed record DashboardWidgetSeed
{
    public string WidgetCode { get; init; } = default!;     // "billable_percent_kpi"
    public int X { get; init; }
    public int Y { get; init; }
    public int Width { get; init; }
    public int Height { get; init; }
    public Dictionary<string, string>? Config { get; init; }
}
```

**PRESET-08 example** seeds an "Engagement Manager" dashboard with widgets: Utilization KPI, Billable % KPI, AR Aging chart, Active Engagements list, Recent Deliverables list, Upcoming Milestones calendar.

---

## 4. Apply pipeline — new shape

`ApplyPreset.cs` after the extension:

```text
ApplyPresetHandler.Handle(presetId, ConflictPolicies overrides)
  1. Load preset from PresetCatalog
  2. Begin DB transaction
  3. Apply capability state (existing behavior — delta + validate + write)
  4. Apply TerminologyBundle → upsert terminology_overrides
  5. Apply ReferenceDataBundle → upsert reference_data
  6. Apply TrackTypeBundle → upsert track_types + job_stages
  7. Apply RoleBundle → upsert application_roles (AddOnly conservative)
  8. Apply ReportVisibilityBundle → upsert report_visibility settings
  9. Apply FolderMapBundle → upsert folder_map_suggestions
 10. Apply WorkflowDefinitionBundle → upsert workflow_definitions
 11. Apply DashboardBundle → upsert dashboard_layouts (per role)
 12. Write ActivityLog row tagged "preset-applied" with delta summary per layer
 13. Commit transaction
 14. Push SignalR: capabilityChanged, terminologyChanged, refDataChanged,
     trackTypesChanged, roleChanged, reportVisibilityChanged
```

Per-layer apply is its own method (`ApplyTerminologyBundle`, `ApplyReferenceDataBundle`, etc.) — each returns a `LayerApplyResult { AddedCount, UpdatedCount, SkippedCount, ConflictedKeys }` for activity logging.

---

## 5. Conflict resolution UI

For the `Prompt` conflict policy (and as a preview mode for all policies), an admin-facing diff modal:

```
┌─ Preview: Apply PRESET-08 to this install ─────────────────┐
│                                                             │
│ Capability changes (will be applied):                       │
│   + CAP-PS-PROJECT      will turn ON                        │
│   + CAP-PS-RETAINER     will turn ON                        │
│   − CAP-MD-PARTS        will turn OFF                       │
│   − CAP-INV-LOTS        will turn OFF                       │
│   (8 more...)                                               │
│                                                             │
│ Terminology overrides (will be applied):                    │
│   entity_job: "Job" → "Engagement"                          │
│   ⚠ entity_customer: "Customer" → "Client"                  │
│      (you edited this to "Account" — keep yours?)           │
│   (37 more, 3 with conflicts...)                            │
│                                                             │
│ Reference data (will be added):                             │
│   New group: engagement_type (4 values)                     │
│   New group: project_phase (5 values)                       │
│   (8 more...)                                               │
│                                                             │
│ Track types (will be added):                                │
│   + Engagement (8 stages)                                   │
│                                                             │
│ Roles (will be added):                                      │
│   + Engagement Manager                                      │
│   + Practitioner                                            │
│   + Account Manager                                         │
│   + Delivery Lead                                           │
│                                                             │
│ Reports filter (will be applied):                           │
│   Hide 18 reports, show 12 reports                          │
│                                                             │
│ Cloud folder layout (suggested):                            │
│   Per-customer folder + 6-subfolder project layout          │
│                                                             │
│        [ Resolve conflicts... ]  [ Cancel ]  [ Apply ]      │
└─────────────────────────────────────────────────────────────┘
```

"Resolve conflicts..." opens a per-key modal that lets admin keep theirs / take preset's per row.

---

## 6. Migration of existing PRESET-01 through PRESET-07

These remain on the bundle = null shape initially. Phase 2 work backfills bundles for them where worthwhile:

| Preset | Worth backfilling bundles? | Why |
|---|---|---|
| PRESET-01 (Two-Person Shop) | Partial | Terminology bundle (slim shop wording), simplified report filter |
| PRESET-02 (Small Manufacturer) | Partial | Report filter (hide enterprise-only reports) |
| PRESET-03 (Mid Manufacturer) | No | No customization beyond capability state |
| PRESET-04 (Production Manufacturer) | No | Defaults already mfg-flavored; preset is the baseline |
| PRESET-05 (Regulated Manufacturer) | Yes | Compliance form template seed |
| PRESET-06 (Aerospace / Aero-Defense) | Yes | Compliance form template + ITAR-flavored ref data |
| PRESET-07 (Enterprise) | No | Just turns more capabilities on |
| PRESET-08 (Pro Services) | **Yes — full** | Net-new stereotype |
| PRESET-09 (Hybrid) | **Yes — full** | Net-new stereotype |
| PRESET-CUSTOM | No | Bundle = empty by definition |

For the ones marked No: keep `null` bundles; apply pipeline skips those layers.

---

## 7. Re-apply semantics

Important detail: a preset can be re-applied. Re-application is NOT the same as first-time apply because admin customizations may exist.

**Per-bundle re-apply behavior:**

| Bundle | Re-apply default | Notes |
|---|---|---|
| Capability state | Toggle delta to match | Existing behavior |
| Terminology | SkipAdminEdited | Don't clobber renames the admin made post-install |
| Ref data | UpsertSeed | Add missing values from seed; leave admin values alone |
| Track types | UpsertByCode | Add missing track types; leave admin-edited stages alone |
| Roles | AddOnly | Never modify or remove existing role |
| Report visibility | Replace | Visibility filter is preset's call (admin has separate per-user pref) |
| Folder maps | UpsertByEntityType | Re-suggesting doesn't break existing folders |
| Workflow defs | UpsertByEntityType | Existing workflow runs continue on old definition; new runs use new |
| Dashboard | AddOnly per role | Adds widgets that don't exist; leaves user-arranged layouts intact |

**Apply produces an audit row.** The activity log captures: who applied, which preset, which layer changed what (counts), which conflicts the admin resolved one-way-or-the-other.

---

## 8. Definition format storage

**Today:** Presets are static C# records in `PresetCatalog.cs`. Compiled into the binary, read-only.

**This extension keeps that for now.** The bundles are still static initializer fields on the C# record. JSON-bundled = JSON in C# string literals where appropriate (workflow def JSON, ref data values), but the bundle objects themselves are typed records.

**Future option (not in scope):** Move preset definitions out of C# into `presets/*.json` files that ship alongside the binary. Would allow non-engineer authors (consultants, integration partners) to define new presets without recompiling. Worth considering if Pro Services real-world data shows we want a dozen+ stereotypes.

---

## 9. What apply-preset does NOT touch

For clarity:

- **Existing entity data** (customers, jobs, parts, invoices). Apply changes config, not data.
- **User accounts / passwords / MFA.** Identity-layer.
- **`SystemSetting`** (company name, fiscal year start, etc.). Set during onboarding, not by preset.
- **Per-user preferences** (theme, dashboard arrangement after they've customized it, table column prefs).
- **Open workflow runs.** Re-applied workflow definitions only take effect for new runs.
- **Cloud storage tokens / OAuth state.** Connecting providers is admin-driven via `/admin/cloud-storage`, not preset-driven. (The folder map is a *suggestion* — apply doesn't actually create folders.)

Stay disciplined on this. Preset apply is a config operation, not a data-migration operation.

---

## 10. Backward compatibility checklist

- Existing PRESET-01 through PRESET-07 records continue to function with `null` bundles for all new fields. Pipeline skips null bundles.
- Existing `EnabledCapabilities` field unchanged.
- Existing `ApplyPreset.cs` behavior preserved when bundles are null (capability-only apply).
- Database migration adds new tables (`terminology_overrides`, `folder_map_suggestions`, `report_visibility_settings`, etc.) without altering existing tables.
- Existing static `PresetCatalog.All` enumerable adds PRESET-08 and PRESET-09 to the end of the list — no reordering.

The extension is purely additive at the record + pipeline + DB level. The only behavioral change is that PRESET-08 / PRESET-09 apply does seed adjacencies, which is the desired behavior.
