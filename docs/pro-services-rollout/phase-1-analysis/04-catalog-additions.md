# Artifact 4 — Catalog Additions Punch List

Concrete additions to the capability catalog, entity model, and database schema to support the Pro Services + Hybrid + Cloud Storage + Migration rollout. Each row is a discrete code change with rough effort and dependency information.

This artifact is the foundation for Phase 2 (Foundations). After this lands, Phase 3 (Build everything achievable) implements features that use the new catalog entries.

> **Addendum (Wave 7b, 2026-05-11):** The Pro Services vocabulary captured below as "Engagement track" is superseded by the agile/scrum task-type retune. PRESET-08 now seeds **five task types** (Epic, Project, Story, Bug, Spike) instead of a single Engagement track, and the entity rename is **Job → Task** (not Job → Project). See [phase-2-foundations/wave-07b-retune-to-agile-tasks.md](../phase-2-foundations/wave-07b-retune-to-agile-tasks.md). Capability names (`CAP-PS-ENGAGEMENT`, etc.) are unchanged.

---

## 1. New capabilities

Format: `CODE | Area | Name | Default | Depends on | Mutex with`. Sorted by phase that adds them.

### Phase 2 (must ship before any Pro Services / Cloud / Migration work)

| Code | Area | Name | Default | Depends | Mutex |
|---|---|---|---|---|---|
| `CAP-EXT-CLOUD-STORAGE` | EXT | Cloud storage integration (umbrella) | off | — | — |
| `CAP-EXT-CLOUD-STORAGE-GDRIVE` | EXT | Google Drive provider | off | `CAP-EXT-CLOUD-STORAGE` | — |
| `CAP-EXT-CLOUD-STORAGE-ONEDRIVE` | EXT | OneDrive provider | off | `CAP-EXT-CLOUD-STORAGE` | — |
| `CAP-EXT-CLOUD-STORAGE-DROPBOX` | EXT | Dropbox provider | off | `CAP-EXT-CLOUD-STORAGE` | — |
| `CAP-ACCT-MIGRATION` | ACCT | Accounting mode migration wizard | off | — | — |
| `CAP-O2C-DELIVERABLE` | O2C | Deliverable / artifact tracking | off | — | — |

**Notes:**
- Three storage providers are NOT mutually exclusive with each other. Per **D9**, hybrid storage (some entities link to Drive, some to OneDrive) is explicitly supported via the `entity_cloud_links` table (see §3 below).
- `CAP-ACCT-MIGRATION` is auto-disabled outside the eligibility window. Eligibility logic lives in the migration handler (see Artifact 6 §migration spec).
- `CAP-O2C-DELIVERABLE` is light-touch: lets Pro Services shops track "things produced and given to the client" without forcing them through the Part/Inventory/Shipment chain.

### Phase 3a (Pro Services functional)

| Code | Area | Name | Default | Depends | Mutex |
|---|---|---|---|---|---|
| `CAP-PS-ENGAGEMENT` | PS | Engagement (Job-as-engagement) axis fields + Engagement track surfaces | off | — | — |
| `CAP-PS-RETAINER` | PS | Retainer / prepaid-hours billing | off | `CAP-O2C-RECURRING`, `CAP-PS-ENGAGEMENT` | — |
| `CAP-PS-TIME-BILLABLE` | PS | Billable / non-billable time split | off | (TimeEntry billable column exists) | — |
| `CAP-PS-RATE-CARDS` | PS | Per-resource / per-role bill rates | off | — | — |
| `CAP-PS-PROJECT-COST` | PS | Engagement costing (T&M, fixed-bid) | off | `CAP-PS-ENGAGEMENT` | — |
| `CAP-PS-UTILIZATION` | PS | Utilization dashboard widgets | off | `CAP-PS-ENGAGEMENT` + `CAP-PS-TIME-BILLABLE` | — |

**Notes:**
- New area `PS` (Professional Services). Mirrors `MFG` area for manufacturing.
- **G-17 spike resolved 2026-05-10:** Engagement = Job on the Engagement track type. Capability renamed `CAP-PS-PROJECT` → `CAP-PS-ENGAGEMENT`. Pro Services axis fields land on `Job`, not on Project or a new entity. Full writeup: [phase-2-foundations/spike-01-engagement-entity.md](../phase-2-foundations/spike-01-engagement-entity.md).
- `CAP-PS-TIME-BILLABLE` is independent of `CAP-PS-ENGAGEMENT` — a shop can split billable/non-billable without modeling full engagements.
- Existing `CAP-EXT-PROJECT` (Project entity with WBS + earned value) stays as-is. Default-off for PRESET-08; PRESET-07 (Enterprise) keeps it on for heavyweight project accounting.

### Phase 3b+ (optional, candidate for descope)

| Code | Area | Name | Default | Depends | Mutex |
|---|---|---|---|---|---|
| `CAP-PS-SOW` | PS | Statement of Work entity (distinct from Quote) | off | `CAP-O2C-QUOTE` | — |
| `CAP-PS-MILESTONE-BILLING` | PS | Milestone-based invoicing on engagements | off | `CAP-PS-ENGAGEMENT` | — |
| `CAP-PS-EXPENSE-PASSTHRU` | PS | Pass-through expense to invoice | off | `CAP-O2C-INVOICE` | — |
| `CAP-PS-SUBCONTRACTOR-MGMT` | PS | Subcontractor (1099) management | off | `CAP-MD-VENDORS` | — |

**Notes:**
- Discuss in Phase 3 grooming whether these ship or land in a later phase. SOW vs Quote question is biggest — SOW often differs enough from Quote (deliverable list, milestone schedule, T&M cap) to warrant separation, but parity-via-Quote-fields might cover 80%.

---

## 2. Capability dependency / mutex edges

Register in `CapabilityCatalogRelations.cs`:

```text
DEPENDENCY EDGES (new):
  CAP-EXT-CLOUD-STORAGE-GDRIVE     depends_on  CAP-EXT-CLOUD-STORAGE
  CAP-EXT-CLOUD-STORAGE-ONEDRIVE   depends_on  CAP-EXT-CLOUD-STORAGE
  CAP-EXT-CLOUD-STORAGE-DROPBOX    depends_on  CAP-EXT-CLOUD-STORAGE
  CAP-PS-RETAINER                  depends_on  CAP-O2C-RECURRING, CAP-PS-ENGAGEMENT
  CAP-PS-PROJECT-COST              depends_on  CAP-PS-ENGAGEMENT
  CAP-PS-UTILIZATION               depends_on  CAP-PS-ENGAGEMENT, CAP-PS-TIME-BILLABLE
  CAP-PS-SOW                       depends_on  CAP-O2C-QUOTE
  CAP-PS-MILESTONE-BILLING         depends_on  CAP-PS-ENGAGEMENT
  CAP-PS-EXPENSE-PASSTHRU          depends_on  CAP-O2C-INVOICE
  CAP-PS-SUBCONTRACTOR-MGMT        depends_on  CAP-MD-VENDORS

MUTEX EDGES (new):
  (none — Phase 2 explicitly allows hybrid storage. Existing mutex
   CAP-ACCT-EXTERNAL ⊥ CAP-ACCT-BUILTIN remains the only one.)
```

---

## 3. New database tables

### 3.1 `terminology_overrides`

Holds the active per-install terminology mappings. Source of truth for what `TerminologyService.load()` returns.

```sql
CREATE TABLE terminology_overrides (
    id              BIGSERIAL PRIMARY KEY,
    key             TEXT NOT NULL UNIQUE,
    label           TEXT NOT NULL,
    is_admin_edited BOOLEAN NOT NULL DEFAULT FALSE,
    source_preset_id TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_terminology_source_preset ON terminology_overrides(source_preset_id);
```

`is_admin_edited` lets the apply-preset pipeline skip overwriting user-edited keys (see Artifact 2 §1 conflict semantics).

### 3.2 `cloud_storage_providers`

Per-install configured providers + OAuth state. One row per provider per install (multiple if hybrid).

```sql
CREATE TABLE cloud_storage_providers (
    id                  BIGSERIAL PRIMARY KEY,
    provider_code       TEXT NOT NULL,  -- 'gdrive' | 'onedrive' | 'dropbox'
    mode                TEXT NOT NULL,  -- 'per_user' | 'service_account' (D3)
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    root_folder_id      TEXT,           -- provider-side root (where qb-engineer files live)
    service_account_id  TEXT,           -- when mode='service_account'
    oauth_token_encrypted BYTEA,        -- encrypted via ITokenEncryptionService
    refresh_token_encrypted BYTEA,
    token_expires_at    TIMESTAMPTZ,
    last_connected_at   TIMESTAMPTZ,
    last_error          TEXT,
    settings            JSONB,           -- provider-specific extras
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_cloud_storage_provider_active
    ON cloud_storage_providers(provider_code)
    WHERE deleted_at IS NULL AND is_active = TRUE;
```

Per **D3** — both `per_user` and `service_account` modes supported. `mode` determines whether `oauth_token_encrypted` is per-user (in a side table) or single service account on this row.

### 3.3 `user_cloud_storage_links`

When provider mode is `per_user`, per-user OAuth tokens.

```sql
CREATE TABLE user_cloud_storage_links (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES asp_net_users(id) ON DELETE CASCADE,
    provider_id         BIGINT NOT NULL REFERENCES cloud_storage_providers(id) ON DELETE CASCADE,
    external_user_id    TEXT,            -- provider's user ID (e.g., Google account email)
    oauth_token_encrypted BYTEA NOT NULL,
    refresh_token_encrypted BYTEA NOT NULL,
    token_expires_at    TIMESTAMPTZ,
    last_used_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_user_cloud_storage_link_unique
    ON user_cloud_storage_links(user_id, provider_id);
```

### 3.4 `entity_cloud_links`

The hybrid-storage table. Per-entity link to a folder on a specific provider. Per **D9** — supports multiple providers on one install; each entity binds to one provider.

```sql
CREATE TABLE entity_cloud_links (
    id              BIGSERIAL PRIMARY KEY,
    entity_type     TEXT NOT NULL,       -- 'Job' | 'Customer' | 'Quote' | etc.
    entity_id       BIGINT NOT NULL,
    provider_id     BIGINT NOT NULL REFERENCES cloud_storage_providers(id) ON DELETE RESTRICT,
    folder_external_id TEXT NOT NULL,    -- provider's folder ID
    folder_path     TEXT,                 -- human-readable path (cached)
    folder_url      TEXT,                 -- direct URL to the folder
    created_by_user_id UUID,
    created_via     TEXT NOT NULL,        -- 'preset_apply' | 'manual' | 'auto_create'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_entity_cloud_link_unique
    ON entity_cloud_links(entity_type, entity_id, provider_id);

CREATE INDEX idx_entity_cloud_link_provider
    ON entity_cloud_links(provider_id);
```

Per **D2** — `created_via` distinguishes preset-apply seeds (which use suggestions) from manual links (admin or user attached a folder after creation) from auto-create (the dual-path sync-first + outbox-fallback flow).

### 3.5 `accounting_migration_*` (see Artifact 6)

Three tables: `accounting_migration_sessions`, `accounting_migration_rows`, `accounting_migration_audit`. Full schema in Artifact 6 §data-model.

### 3.6 `engagement_axes` on `jobs` table

Per G-17 spike (2026-05-10), Pro Services engagements are Jobs on the Engagement track type. Axis fields land on `jobs`, NOT on `projects`. Project entity stays unchanged (heavyweight project accounting for Enterprise installs).

```sql
ALTER TABLE jobs ADD COLUMN engagement_type_id BIGINT REFERENCES reference_data(id);
ALTER TABLE jobs ADD COLUMN project_phase_id BIGINT REFERENCES reference_data(id);
ALTER TABLE jobs ADD COLUMN billing_model TEXT;  -- 't_and_m' | 'fixed_bid' | 'retainer'
ALTER TABLE jobs ADD COLUMN retainer_hours NUMERIC(10,2);
ALTER TABLE jobs ADD COLUMN retainer_balance_hours NUMERIC(10,2);
ALTER TABLE jobs ADD COLUMN sow_id BIGINT REFERENCES quotes(id);  -- nullable; SOW lives in Quote per spec
```

`budget_amount` / `budget_currency` are NOT added — Job already carries `QuotedPrice` + estimated cost fields (`EstimatedMaterialCost`, `EstimatedLaborCost`, `EstimatedBurdenCost`, `EstimatedSubcontractCost`) which serve the same purpose. Pro Services use of these fields differs by interpretation, not by schema.

Full rationale: [phase-2-foundations/spike-01-engagement-entity.md](../phase-2-foundations/spike-01-engagement-entity.md).

### 3.7 `time_entries` extensions

Per the inventory matrix 🔧 row — billable / non-billable split.

```sql
ALTER TABLE time_entries ADD COLUMN is_billable BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE time_entries ADD COLUMN bill_rate NUMERIC(10,2);
ALTER TABLE time_entries ADD COLUMN bill_rate_currency TEXT;
ALTER TABLE time_entries ADD COLUMN activity_type_id BIGINT REFERENCES reference_data(id);  -- discovery/design/build/etc.
```

Default `is_billable = true` to keep manufacturing semantics intact (existing time entries treated as billable, which they effectively are for cost-rollup purposes).

**Note:** No `project_id` column. Per G-17 spike, Pro Services engagements are Jobs; `TimeEntry.JobId` already exists in the schema and serves as the engagement linkage.

---

## 4. New / extended entities

### 4.1 `TerminologyOverride` (new)

Mirrors `terminology_overrides` table. EF Core entity in `qb-engineer.core/Entities/`.

```csharp
public class TerminologyOverride : BaseEntity
{
    public string Key { get; set; } = default!;
    public string Label { get; set; } = default!;
    public bool IsAdminEdited { get; set; }
    public string? SourcePresetId { get; set; }
}
```

Replaces the existing `TerminologyEntry` / `TranslatedLabel` substrate if those are unused; otherwise alongside. (Phase 2 spike confirms.)

### 4.2 `CloudStorageProvider` (new)

Mirrors `cloud_storage_providers` table.

```csharp
public class CloudStorageProvider : BaseEntity
{
    public string ProviderCode { get; set; } = default!;   // 'gdrive' | 'onedrive' | 'dropbox'
    public CloudStorageProviderMode Mode { get; set; }
    public bool IsActive { get; set; }
    public string? RootFolderId { get; set; }
    public string? ServiceAccountId { get; set; }
    public byte[]? OAuthTokenEncrypted { get; set; }
    public byte[]? RefreshTokenEncrypted { get; set; }
    public DateTime? TokenExpiresAt { get; set; }
    public DateTime? LastConnectedAt { get; set; }
    public string? LastError { get; set; }
    public string? Settings { get; set; }  // JSON
}

public enum CloudStorageProviderMode { PerUser, ServiceAccount }
```

### 4.3 `UserCloudStorageLink` (new)

Mirrors `user_cloud_storage_links` table.

### 4.4 `EntityCloudLink` (new)

Mirrors `entity_cloud_links` table. Polymorphic via `EntityType` + `EntityId` (no FK on `EntityId` because it could reference multiple tables; rely on application-layer enforcement).

### 4.5 Extensions to existing entities

| Entity | Field added | Purpose |
|---|---|---|
| `TimeEntry` | `IsBillable`, `BillRate`, `BillRateCurrency`, `ActivityTypeId` | Pro Services billable split (Job linkage already exists) |
| `Job` | `EngagementTypeId`, `ProjectPhaseId`, `BillingModel`, `RetainerHours`, `RetainerBalanceHours`, `SowId` | Pro Services engagement axes (per G-17 spike) |
| `PresetDefinition` | `TerminologyBundle`, `ReferenceDataSeed`, `TrackTypeSeed`, `RoleSeed`, `ReportVisibilityFilter`, `FolderMapSuggestions` | See Artifact 5 |
| `Invoice` | (none new — services billing reuses existing schema) | — |
| `Quote` | (none new — SOW reuses Quote unless CAP-PS-SOW lands as its own entity) | — |

### 4.6 New `Deliverable` entity (gated by `CAP-O2C-DELIVERABLE`)

Lightweight tracking for engagement artifacts. Per G-17 spike, primary link is `JobId`; `ProjectId` retained as optional FK for Enterprise installs that roll engagements up into projects.

```csharp
public class Deliverable : BaseEntity
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public long? JobId { get; set; }              // primary linkage (Engagement-track Job)
    public long? ProjectId { get; set; }          // optional Project rollup (Enterprise)
    public long? CustomerId { get; set; }
    public long DeliverableTypeId { get; set; }   // ref_data
    public string Status { get; set; } = "Draft"; // Draft / In Review / Approved / Delivered
    public DateTime? DueDate { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public Guid? DeliveredByUserId { get; set; }
    public string? FileAttachmentIds { get; set; }  // JSON array of FK ids
    public string? CloudLinkExternalId { get; set; }
}

CREATE INDEX idx_deliverable_job ON deliverables(job_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deliverable_project ON deliverables(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deliverable_customer ON deliverables(customer_id) WHERE deleted_at IS NULL;
```

If Phase 2 review finds this is over-engineered, fall back to "deliverables are just `FileAttachment` rows tagged with type=deliverable on a Job."

---

## 5. New presets

### PRESET-08 — Pro Services

- **Target profile:** Headcount 5-50 (services-only). Consulting / agency / engineering services / professional services firms.
- **Capability set:**
  - On: `CAP-O2C-LEAD`, `CAP-O2C-QUOTE`, `CAP-O2C-INVOICE`, `CAP-O2C-CASH`, `CAP-O2C-RECURRING`, `CAP-O2C-DELIVERABLE`, `CAP-PS-ENGAGEMENT`, `CAP-PS-TIME-BILLABLE`, `CAP-PS-RATE-CARDS`, `CAP-PS-PROJECT-COST`, `CAP-PS-UTILIZATION`, `CAP-PS-RETAINER`, `CAP-ACCT-BUILTIN` (default), `CAP-QC-COMPLIANCE-FORMS` (per D7 — NDAs/MSAs).
  - Off: `CAP-MD-PARTS`, `CAP-MD-BOM`, `CAP-MD-ROUTING`, all `CAP-INV-*`, all `CAP-MFG-*`, all `CAP-QC-*` except compliance forms, `CAP-PLAN-MRP`, `CAP-MFG-OEE`, `CAP-MFG-SHOPFLOOR`, `CAP-O2C-SHIP`, `CAP-O2C-PICKPACK`, `CAP-P2P-RECEIVE`.
- **Terminology bundle:** ~40 renames (entity_job → Engagement, entity_part → Service Item, work_center → Resource, etc.). Full list in Artifact 5.
- **Reference-data seed:** all 10 Pro Services groups (engagement_type, project_phase, resource_skill, time_billable_status, time_activity_type, deliverable_type, service_uom, engagement_status, retainer_status, client_segment).
- **Track-type seed:** Engagement track with stages (Proposal → Won → Discovery → Active → Review → Delivered → Invoiced → Paid). R&D track optional.
- **Role seed:** Practitioner, Engagement Manager, Account Manager, Delivery Lead, Admin.
- **Report-visibility filter:** Engagement P&L, Utilization, Billable %, AR Aging, Time by Activity, Project Margin, Retainer Burn-Down. (~7-10 reports.)
- **Folder-mapping suggestions:** `/{Customer}/{Project}/`, with sub-folders Proposal, Contracts, Deliverables, Working, Final.

### PRESET-09 — Hybrid

- **Target profile:** Headcount 10-100. Shops that both make products AND sell services (e.g., engineering firm with a small fab shop; product company with a services arm).
- **Capability set:** Union of PRESET-04 (Production Manufacturer) + PRESET-08 (Pro Services).
- **Terminology bundle:** Partial — renames Job→Engagement only when the install opts in; default keeps "Job" in both contexts. ~10-15 renames covering shared service vocabulary.
- **Reference-data seed:** Union — manufacturing groups + Pro Services groups.
- **Track-type seed:** Production AND Engagement tracks (multi-track-type already supported).
- **Role seed:** Union — all manufacturing roles + all Pro Services roles.
- **Report-visibility filter:** All reports apply.
- **Folder-mapping suggestions:** Two templates — manufacturing template for goods-side jobs, services template for engagements.

### PRESET-CUSTOM extensions

The existing PRESET-CUSTOM record gets a default `bundle = empty` — admins start from a blank slate. Apply preset doesn't touch terminology, ref data, etc., on Custom.

---

## 6. Capability bootstrap exemptions

The following endpoints / handlers need to be added to the `[CapabilityBootstrap]` list so admins can manage the new capabilities before they're enabled:

- `POST /api/v1/cloud-storage/providers` — admin connects first cloud provider.
- `GET /api/v1/cloud-storage/providers` — admin lists providers.
- `POST /api/v1/accounting-migration/sessions` — admin starts migration.
- `GET /api/v1/accounting-migration/sessions/{id}/status` — admin tracks progress.
- `POST /api/v1/presets/{id}/apply` — admin applies a preset (already exempt? confirm).

(The existing `[CapabilityBootstrap]` rule keeps capability admin + auth endpoints accessible regardless of state — these additions extend that to the new admin pages.)

---

## 7. Effort sizing

Rough estimates, in engineering-day units. "Days" = focused full-time work, not calendar days.

| Item | Days |
|---|---|
| Register 6 Phase-2 capabilities + edges + audit-log strings | 0.5 |
| Register 6 Phase-3a capabilities + edges | 0.5 |
| Migration: `terminology_overrides` table + EF entity + repository | 1 |
| Migration: 3 cloud-storage tables + EF entities | 1.5 |
| Migration: 3 migration-session tables (per Artifact 6) | 1.5 |
| Migration: `TimeEntry` billable columns + handler updates | 1 |
| Migration: `Project` axis columns + entity updates | 1 |
| Migration: `Deliverable` entity + table + repository + CRUD handlers | 2 |
| `PresetDefinition` field additions (Artifact 5) | 0.5 |
| PRESET-08 + PRESET-09 records authored | 1 |
| PRESET-08 terminology bundle authored | 1 |
| PRESET-08 reference-data seed bundle authored | 1 |
| PRESET-08 track-type + stage seed bundle authored | 0.5 |
| PRESET-09 partial bundles authored | 1 |
| Cloud storage interface `ICloudStorageIntegrationService` | 0.5 |
| Google Drive provider implementation | 4 |
| OneDrive provider implementation | 3 |
| Dropbox provider implementation | 3 |
| Hybrid storage `entity_cloud_links` routing logic | 2 |
| Folder auto-create dual-path (sync + outbox fallback per D2) | 2 |
| Discovery wizard "make/sell time/both" top question + branch | 1.5 |
| Discovery Pro Services sub-tree (4-6 questions) | 1 |
| Apply-preset pipeline extensions (terminology, ref data, track types, roles, reports, folder maps) | 4 |
| **Total Phase 2 (foundations only, no provider builds)** | **~21 days** |
| **Total Phase 2 + cloud provider builds** | **~34 days** |
| Pro Services UI adoption (rename ~150-300 places via `\| terminology`) | 5-8 |
| Pro Services dashboard widget set | 3 |
| Pro Services report set (~7-10 new reports) | 5 |
| Pro Services workflow definitions | 3 |
| Project entity axis-field UI | 2 |
| TimeEntry billable UI | 1 |
| Deliverable UI | 2 |
| **Total Phase 3a (Pro Services functional)** | **~21-24 days** |
| Migration tooling (per Artifact 6) | ~15 days (its own punch list) |
| **Total Phase 3b (Migration tooling)** | **~15 days** |

**Grand total Phases 2-3:** ~70-75 days of focused engineering work.

Notes:
- Numbers are rough estimates for sizing decisions; they will sharpen during Phase 2 spike.
- Cloud provider builds (Drive / OneDrive / Dropbox) can run in parallel — three providers don't have to be sequential.
- Pro Services UI adoption is the biggest single line item (5-8 days) and is parallelizable to capability work.

---

## 8. Out-of-scope (deferred from this rollout)

For clarity on what's explicitly NOT in scope:

- **Multi-tenant architecture.** Stays single-tenant per database.
- **Custom field admin UI.** Per Artifact 2 §5, descoped.
- **Generic workflow editor.** Pro Services workflow defs are seeded JSON; no admin editor in this phase.
- **Resource-leveling scheduling.** `CAP-PS-UTILIZATION` is dashboard-only — actual capacity-balanced auto-scheduling is a later phase.
- **Sage / NetSuite / Wave / Zoho accounting providers.** Stays at QuickBooks + Xero. (Migration tooling spec is provider-agnostic but only QB direction tested in Phase 3b.)
- **Project Gantt UI.** Out of scope; reuses existing kanban.
- **Time-off integration with retainer balance.** Out of scope; retainer is hours-bought, time entries debit; PTO is separate.

These exclusions can be revisited after Phase 3 ships and ArmoryWorks real-world data informs next priorities.
