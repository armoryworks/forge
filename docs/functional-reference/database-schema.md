# Database Schema Reference

> Comprehensive schema reference for the Forge PostgreSQL database.
> Auto-generated from entity definitions in `forge.core/Entities/` and `forge.data/Context/`.

---

## 1. Overview

- **Database:** PostgreSQL with `timestamptz` columns (all timestamps UTC)
- **ORM:** Entity Framework Core with Npgsql provider
- **Naming:** All tables, columns, keys, and indexes use `snake_case` (auto-converted in `AppDbContext.OnModelCreating`)
- **Soft deletes:** All `BaseAuditableEntity` types have a global query filter on `deleted_at IS NULL`
- **Timestamps:** `created_at` and `updated_at` auto-set by `AppDbContext.SetTimestamps()` via injectable `IClock`
- **Identity:** ASP.NET Identity with `int` primary keys (`IdentityDbContext<ApplicationUser, IdentityRole<int>, int>`)
- **Extensions:** `vector` (pgvector for AI/RAG embeddings)
- **Primary keys:** `id` (int, auto-increment) on all entities
- **Foreign keys:** `{table_singular}_id` convention
- **Entity configuration:** Fluent API via `IEntityTypeConfiguration<T>` classes (no data annotations)

---

## 2. Base Entities

### BaseEntity

| Column | Type | Notes |
|--------|------|-------|
| `id` | `int` | PK, auto-increment |

Soft delete: No. Timestamps: No.

### BaseAuditableEntity (extends BaseEntity)

| Column | Type | Notes |
|--------|------|-------|
| `id` | `int` | PK, auto-increment |
| `created_at` | `timestamptz` | Auto-set on insert |
| `updated_at` | `timestamptz` | Auto-set on insert and update |
| `deleted_at` | `timestamptz?` | Soft delete timestamp |
| `deleted_by` | `text?` | User who performed the delete |

Soft delete: Yes (global query filter `deleted_at IS NULL`). Computed: `is_deleted` (not persisted).

### ApplicationUser (extends IdentityUser\<int\>)

Table: `asp_net_users` (ASP.NET Identity convention, snake_cased)

| Column | Type | Notes |
|--------|------|-------|
| `id` | `int` | PK |
| `first_name` | `text` | |
| `last_name` | `text` | |
| `initials` | `text?` | |
| `avatar_color` | `text?` | |
| `is_active` | `bool` | Default `true` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |
| `setup_token` | `text?` | One-time setup token |
| `setup_token_expires_at` | `timestamptz?` | |
| `pin_hash` | `text?` | PBKDF2-hashed PIN for kiosk auth |
| `employee_barcode` | `text?` | Barcode for scan auth |
| `team_id` | `int?` | FK -> `teams` |
| `work_location_id` | `int?` | FK -> `company_locations` |
| `accounting_employee_id` | `text?` | QB Employee ID for time sync |
| `google_id` | `text?` | SSO |
| `microsoft_id` | `text?` | SSO |
| `oidc_subject_id` | `text?` | SSO |
| `oidc_provider` | `text?` | SSO |
| `mfa_enabled` | `bool` | |
| `mfa_enforced_by_policy` | `bool` | |
| `mfa_enabled_at` | `timestamptz?` | |
| `mfa_recovery_codes_remaining` | `int` | |

Plus all standard Identity columns: `user_name`, `normalized_user_name`, `email`, `normalized_email`, `email_confirmed`, `password_hash`, `security_stamp`, `concurrency_stamp`, `phone_number`, `phone_number_confirmed`, `two_factor_enabled`, `lockout_end`, `lockout_enabled`, `access_failed_count`.

---

## 3. Entities by Domain

### 3.1 Kanban / Jobs

#### TrackType

Table: `track_types` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `name` | `text` | |
| `code` | `text` | |
| `description` | `text?` | |
| `is_default` | `bool` | |
| `sort_order` | `int` | |
| `is_active` | `bool` | Default `true` |
| `is_shop_floor` | `bool` | Default `true` |
| `custom_field_definitions` | `text?` | JSONB |

#### JobStage

Table: `job_stages` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `track_type_id` | `int` | FK -> `track_types` |
| `name` | `text` | |
| `code` | `text` | |
| `sort_order` | `int` | |
| `color` | `text` | Default `#94a3b8` |
| `wip_limit` | `int?` | |
| `accounting_document_type` | `text?` | Enum: AccountingDocumentType |
| `is_irreversible` | `bool` | |
| `is_shop_floor` | `bool` | |
| `is_active` | `bool` | Default `true` |

#### Job

Table: `jobs` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `job_number` | `text` | |
| `title` | `text` | |
| `description` | `text?` | |
| `track_type_id` | `int` | FK -> `track_types` |
| `current_stage_id` | `int` | FK -> `job_stages` |
| `assignee_id` | `int?` | FK -> `asp_net_users` |
| `priority` | `text` | Enum: JobPriority |
| `customer_id` | `int?` | FK -> `customers` |
| `due_date` | `timestamptz?` | |
| `start_date` | `timestamptz?` | |
| `completed_date` | `timestamptz?` | |
| `is_archived` | `bool` | |
| `board_position` | `int` | |
| `part_id` | `int?` | FK -> `parts` |
| `parent_job_id` | `int?` | FK -> `jobs` (self-ref) |
| `sales_order_line_id` | `int?` | FK -> `sales_order_lines` |
| `mrp_planned_order_id` | `int?` | FK -> `mrp_planned_orders` |
| `external_id` | `text?` | Accounting integration |
| `external_ref` | `text?` | |
| `provider` | `text?` | |
| `iteration_count` | `int` | R&D iteration tracking |
| `iteration_notes` | `text?` | |
| `is_internal` | `bool` | |
| `internal_project_type_id` | `int?` | FK -> `reference_data` |
| `estimated_material_cost` | `decimal` | |
| `estimated_labor_cost` | `decimal` | |
| `estimated_burden_cost` | `decimal` | |
| `estimated_subcontract_cost` | `decimal` | |
| `quoted_price` | `decimal` | |
| `disposition` | `text?` | Enum: JobDisposition |
| `disposition_notes` | `text?` | |
| `disposition_at` | `timestamptz?` | |
| `custom_field_values` | `text?` | JSONB |
| `cover_photo_file_id` | `int?` | FK -> `file_attachments` |

#### JobSubtask

Table: `job_subtasks` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `job_id` | `int` | FK -> `jobs` |
| `text` | `text` | |
| `is_completed` | `bool` | |
| `assignee_id` | `int?` | |
| `sort_order` | `int` | |
| `completed_at` | `timestamptz?` | |
| `completed_by_id` | `int?` | |

#### JobActivityLog

Table: `job_activity_logs` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `job_id` | `int` | FK -> `jobs` |
| `user_id` | `int?` | |
| `action` | `text` | Enum: ActivityAction |
| `field_name` | `text?` | |
| `old_value` | `text?` | |
| `new_value` | `text?` | |
| `description` | `text` | |
| `created_at` | `timestamptz` | |

#### JobLink

Table: `job_links` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `source_job_id` | `int` | FK -> `jobs` |
| `target_job_id` | `int` | FK -> `jobs` |
| `link_type` | `text` | Enum: JobLinkType |
| `created_at` | `timestamptz` | |

#### JobNote

Table: `job_notes` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `job_id` | `int` | FK -> `jobs` |
| `text` | `text` | |
| `created_by` | `int?` | |

#### JobPart

Table: `job_parts` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `job_id` | `int` | FK -> `jobs` |
| `part_id` | `int` | FK -> `parts` |
| `quantity` | `decimal` | Default `1` |
| `notes` | `text?` | |

#### PlanningCycle

Table: `planning_cycles` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `name` | `text` | |
| `start_date` | `timestamptz` | |
| `end_date` | `timestamptz` | |
| `goals` | `text?` | |
| `status` | `text` | Enum: PlanningCycleStatus |
| `duration_days` | `int` | Default `14` |

#### PlanningCycleEntry

Table: `planning_cycle_entries` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `planning_cycle_id` | `int` | FK -> `planning_cycles` |
| `job_id` | `int` | FK -> `jobs` |
| `committed_at` | `timestamptz` | |
| `completed_at` | `timestamptz?` | |
| `is_rolled_over` | `bool` | |
| `sort_order` | `int` | |

---

### 3.2 Parts & BOM

#### Part

Table: `parts` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `part_number` | `text` | |
| `description` | `text` | |
| `revision` | `text` | Default `"A"` |
| `status` | `text` | Enum: PartStatus |
| `part_type` | `text` | Enum: PartType |
| `material` | `text?` | |
| `mold_tool_ref` | `text?` | |
| `external_part_number` | `text?` | |
| `external_id` | `text?` | Accounting integration |
| `external_ref` | `text?` | |
| `provider` | `text?` | |
| `preferred_vendor_id` | `int?` | FK -> `vendors` |
| `min_stock_threshold` | `decimal?` | |
| `reorder_point` | `decimal?` | |
| `reorder_quantity` | `decimal?` | |
| `lead_time_days` | `int?` | |
| `safety_stock_days` | `int?` | |
| `lot_sizing_rule` | `text?` | Enum: LotSizingRule |
| `fixed_order_quantity` | `decimal?` | |
| `minimum_order_quantity` | `decimal?` | |
| `order_multiple` | `decimal?` | |
| `planning_fence_days` | `int?` | |
| `demand_fence_days` | `int?` | |
| `is_mrp_planned` | `bool` | |
| `requires_receiving_inspection` | `bool` | |
| `receiving_inspection_template_id` | `int?` | |
| `inspection_frequency` | `text` | Enum: ReceivingInspectionFrequency |
| `inspection_skip_after_n` | `int?` | |
| `is_serial_tracked` | `bool` | |
| `custom_field_values` | `text?` | JSONB |
| `stock_uom_id` | `int?` | FK -> `units_of_measure` |
| `purchase_uom_id` | `int?` | FK -> `units_of_measure` |
| `sales_uom_id` | `int?` | FK -> `units_of_measure` |
| `tooling_asset_id` | `int?` | FK -> `assets` |

#### BOMEntry

Table: `bom_entries` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `parent_part_id` | `int` | FK -> `parts` |
| `child_part_id` | `int` | FK -> `parts` |
| `quantity` | `decimal` | Default `1` |
| `reference_designator` | `text?` | |
| `sort_order` | `int` | |
| `source_type` | `text` | Enum: BOMSourceType |
| `lead_time_days` | `int?` | |
| `notes` | `text?` | |
| `uom_id` | `int?` | FK -> `units_of_measure` |

#### Operation

Table: `operations` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `part_id` | `int` | FK -> `parts` |
| `step_number` | `int` | |
| `title` | `text` | |
| `instructions` | `text?` | |
| `work_center_id` | `int?` | FK -> `work_centers` |
| `asset_id` | `int?` | FK -> `assets` |
| `estimated_minutes` | `int?` | |
| `is_qc_checkpoint` | `bool` | |
| `qc_criteria` | `text?` | |
| `referenced_operation_id` | `int?` | FK -> `operations` (self-ref) |
| `setup_minutes` | `decimal` | |
| `run_minutes_each` | `decimal` | |
| `run_minutes_lot` | `decimal` | |
| `overlap_percent` | `decimal` | |
| `scrap_factor` | `decimal` | |
| `is_subcontract` | `bool` | |
| `subcontract_vendor_id` | `int?` | FK -> `vendors` |
| `subcontract_cost` | `decimal?` | |
| `subcontract_lead_time_days` | `int?` | |
| `subcontract_instructions` | `text?` | |
| `labor_rate` | `decimal` | |
| `burden_rate` | `decimal` | |
| `estimated_labor_cost` | `decimal` | |
| `estimated_burden_cost` | `decimal` | |

#### OperationMaterial

Table: `operation_materials` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `operation_id` | `int` | FK -> `operations` |
| `bom_entry_id` | `int` | FK -> `bom_entries` |
| `quantity` | `decimal` | Default `1` |
| `notes` | `text?` | |

#### PartRevision

Table: `part_revisions` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `part_id` | `int` | FK -> `parts` |
| `revision` | `text` | |
| `change_description` | `text?` | |
| `change_reason` | `text?` | |
| `effective_date` | `timestamptz` | |
| `is_current` | `bool` | |

#### PartAlternate

Table: `part_alternates` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `part_id` | `int` | FK -> `parts` |
| `alternate_part_id` | `int` | FK -> `parts` |
| `priority` | `int` | Default `1` |
| `type` | `text` | Enum: AlternateType |
| `conversion_factor` | `decimal?` | |
| `is_approved` | `bool` | |
| `approved_by_id` | `int?` | |
| `approved_at` | `timestamptz?` | |
| `notes` | `text?` | |
| `is_bidirectional` | `bool` | |

#### PartPrice

Table: `part_prices` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `part_id` | `int` | FK -> `parts` |
| `unit_price` | `decimal` | |
| `effective_from` | `timestamptz` | |
| `effective_to` | `timestamptz?` | |
| `notes` | `text?` | |

---

### 3.3 Customers & Contacts

#### Customer

Table: `customers` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `name` | `text` | |
| `company_name` | `text?` | |
| `email` | `text?` | |
| `phone` | `text?` | |
| `is_active` | `bool` | Default `true` |
| `credit_limit` | `decimal?` | |
| `is_on_credit_hold` | `bool` | |
| `credit_hold_reason` | `text?` | |
| `credit_hold_at` | `timestamptz?` | |
| `credit_hold_by_id` | `int?` | |
| `last_credit_review_date` | `timestamptz?` | |
| `credit_review_frequency_days` | `int?` | |
| `external_id` | `text?` | Accounting integration |
| `external_ref` | `text?` | |
| `provider` | `text?` | |

#### Contact

Table: `contacts` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `customer_id` | `int` | FK -> `customers` |
| `first_name` | `text` | |
| `last_name` | `text` | |
| `email` | `text?` | |
| `phone` | `text?` | |
| `role` | `text?` | |
| `is_primary` | `bool` | |

#### ContactInteraction

Table: `contact_interactions` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `contact_id` | `int` | FK -> `contacts` |
| `user_id` | `int` | |
| `type` | `text` | Enum: InteractionType |
| `subject` | `text` | |
| `body` | `text?` | |
| `interaction_date` | `timestamptz` | |
| `duration_minutes` | `int?` | |

#### CustomerAddress

Table: `customer_addresses` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `customer_id` | `int` | FK -> `customers` |
| `label` | `text` | |
| `address_type` | `text` | Enum: AddressType |
| `line1` | `text` | |
| `line2` | `text?` | |
| `city` | `text` | |
| `state` | `text` | |
| `postal_code` | `text` | |
| `country` | `text` | Default `"US"` |
| `is_default` | `bool` | |

#### CustomerReturn

Table: `customer_returns` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `return_number` | `text` | |
| `customer_id` | `int` | FK -> `customers` |
| `original_job_id` | `int` | FK -> `jobs` |
| `rework_job_id` | `int?` | FK -> `jobs` |
| `reason` | `text` | |
| `notes` | `text?` | |
| `status` | `text` | Enum: CustomerReturnStatus |
| `return_date` | `timestamptz` | |
| `inspected_by_id` | `int?` | |
| `inspected_at` | `timestamptz?` | |
| `inspection_notes` | `text?` | |

#### CreditHold

Table: `credit_holds` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `customer_id` | `int` | FK -> `customers` |
| `reason` | `text` | Enum: CreditHoldReason |
| `notes` | `text?` | |
| `placed_by_id` | `int` | |
| `placed_at` | `timestamptz` | |
| `released_by_id` | `int?` | |
| `released_at` | `timestamptz?` | |
| `release_notes` | `text?` | |
| `is_active` | `bool` | Default `true` |

---

### 3.4 Order Management

#### Quote

Table: `quotes` | Base: `BaseAuditableEntity` | Soft delete: Yes

Shared table for both Estimates and Quotes via `type` discriminator.

| Column | Type | Notes |
|--------|------|-------|
| `type` | `text` | Enum: QuoteType (Estimate or Quote) |
| `customer_id` | `int` | FK -> `customers` |
| `status` | `text` | Enum: QuoteStatus |
| `expiration_date` | `timestamptz?` | |
| `notes` | `text?` | |
| `assigned_to_id` | `int?` | |
| `title` | `text?` | Estimate-specific |
| `description` | `text?` | Estimate-specific |
| `estimated_amount` | `decimal?` | Estimate-specific |
| `quote_number` | `text?` | Quote-specific |
| `shipping_address_id` | `int?` | FK -> `customer_addresses` |
| `sent_date` | `timestamptz?` | |
| `accepted_date` | `timestamptz?` | |
| `tax_rate` | `decimal` | |
| `source_estimate_id` | `int?` | FK -> `quotes` (self-ref) |
| `converted_at` | `timestamptz?` | |
| `external_id` | `text?` | |
| `external_ref` | `text?` | |
| `provider` | `text?` | |

#### QuoteLine

Table: `quote_lines` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `quote_id` | `int` | FK -> `quotes` |
| `part_id` | `int?` | FK -> `parts` |
| `description` | `text` | |
| `quantity` | `int` | |
| `unit_price` | `decimal` | |
| `line_number` | `int` | |
| `notes` | `text?` | |

#### SalesOrder

Table: `sales_orders` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `order_number` | `text` | |
| `customer_id` | `int` | FK -> `customers` |
| `quote_id` | `int?` | FK -> `quotes` |
| `shipping_address_id` | `int?` | FK -> `customer_addresses` |
| `billing_address_id` | `int?` | FK -> `customer_addresses` |
| `status` | `text` | Enum: SalesOrderStatus |
| `credit_terms` | `text?` | Enum: CreditTerms |
| `confirmed_date` | `timestamptz?` | |
| `requested_delivery_date` | `timestamptz?` | |
| `customer_po` | `text?` | |
| `notes` | `text?` | |
| `tax_rate` | `decimal` | |
| `external_id` | `text?` | |
| `external_ref` | `text?` | |
| `provider` | `text?` | |

#### SalesOrderLine

Table: `sales_order_lines` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `sales_order_id` | `int` | FK -> `sales_orders` |
| `part_id` | `int?` | FK -> `parts` |
| `description` | `text` | |
| `quantity` | `int` | |
| `unit_price` | `decimal` | |
| `line_number` | `int` | |
| `shipped_quantity` | `int` | |
| `notes` | `text?` | |
| `uom_id` | `int?` | FK -> `units_of_measure` |

#### Shipment

Table: `shipments` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `shipment_number` | `text` | |
| `sales_order_id` | `int` | FK -> `sales_orders` |
| `shipping_address_id` | `int?` | FK -> `customer_addresses` |
| `status` | `text` | Enum: ShipmentStatus |
| `carrier` | `text?` | |
| `tracking_number` | `text?` | |
| `shipped_date` | `timestamptz?` | |
| `delivered_date` | `timestamptz?` | |
| `shipping_cost` | `decimal?` | |
| `weight` | `decimal?` | |
| `notes` | `text?` | |

#### ShipmentLine

Table: `shipment_lines` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `shipment_id` | `int` | FK -> `shipments` |
| `sales_order_line_id` | `int?` | FK -> `sales_order_lines` |
| `part_id` | `int?` | FK -> `parts` |
| `quantity` | `int` | |
| `notes` | `text?` | |

#### ShipmentPackage

Table: `shipment_packages` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `shipment_id` | `int` | FK -> `shipments` |
| `tracking_number` | `text?` | |
| `carrier` | `text?` | |
| `weight` | `decimal?` | |
| `length` | `decimal?` | |
| `width` | `decimal?` | |
| `height` | `decimal?` | |
| `status` | `text` | Default `"Pending"` |

#### RecurringOrder

Table: `recurring_orders` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `name` | `text` | |
| `customer_id` | `int` | FK -> `customers` |
| `shipping_address_id` | `int?` | FK -> `customer_addresses` |
| `interval_days` | `int` | |
| `next_generation_date` | `timestamptz` | |
| `last_generated_date` | `timestamptz?` | |
| `is_active` | `bool` | Default `true` |
| `notes` | `text?` | |

#### RecurringOrderLine

Table: `recurring_order_lines` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `recurring_order_id` | `int` | FK -> `recurring_orders` |
| `part_id` | `int` | FK -> `parts` |
| `description` | `text` | |
| `quantity` | `int` | |
| `unit_price` | `decimal` | |
| `line_number` | `int` | |

---

### 3.5 Financials (Accounting Boundary)

These entities operate in standalone mode. When an accounting provider is connected, they become read-only caches.

#### Invoice

Table: `invoices` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `invoice_number` | `text` | |
| `customer_id` | `int` | FK -> `customers` |
| `sales_order_id` | `int?` | FK -> `sales_orders` |
| `shipment_id` | `int?` | FK -> `shipments` |
| `status` | `text` | Enum: InvoiceStatus |
| `invoice_date` | `timestamptz` | |
| `due_date` | `timestamptz` | |
| `credit_terms` | `text?` | Enum: CreditTerms |
| `tax_rate` | `decimal` | |
| `notes` | `text?` | |
| `external_id` | `text?` | |
| `external_ref` | `text?` | |
| `provider` | `text?` | |
| `last_synced_at` | `timestamptz?` | |

#### InvoiceLine

Table: `invoice_lines` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `invoice_id` | `int` | FK -> `invoices` |
| `part_id` | `int?` | FK -> `parts` |
| `description` | `text` | |
| `quantity` | `int` | |
| `unit_price` | `decimal` | |
| `line_number` | `int` | |

#### Payment

Table: `payments` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `payment_number` | `text` | |
| `customer_id` | `int` | FK -> `customers` |
| `method` | `text` | Enum: PaymentMethod |
| `amount` | `decimal` | |
| `payment_date` | `timestamptz` | |
| `reference_number` | `text?` | |
| `notes` | `text?` | |
| `external_id` | `text?` | |
| `external_ref` | `text?` | |
| `provider` | `text?` | |
| `last_synced_at` | `timestamptz?` | |

#### PaymentApplication

Table: `payment_applications` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `payment_id` | `int` | FK -> `payments` |
| `invoice_id` | `int` | FK -> `invoices` |
| `amount` | `decimal` | |

#### PriceList

Table: `price_lists` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `name` | `text` | |
| `description` | `text?` | |
| `customer_id` | `int?` | FK -> `customers` |
| `is_default` | `bool` | |
| `is_active` | `bool` | Default `true` |
| `effective_from` | `timestamptz?` | |
| `effective_to` | `timestamptz?` | |

#### PriceListEntry

Table: `price_list_entries` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `price_list_id` | `int` | FK -> `price_lists` |
| `part_id` | `int` | FK -> `parts` |
| `unit_price` | `decimal` | |
| `min_quantity` | `int` | Default `1` |

#### SalesTaxRate

Table: `sales_tax_rates` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `name` | `text` | |
| `code` | `text` | |
| `state_code` | `text?` | 2-letter US state |
| `rate` | `decimal` | Decimal fraction (e.g., 0.0725 = 7.25%) |
| `effective_from` | `timestamptz` | |
| `effective_to` | `timestamptz?` | |
| `is_default` | `bool` | |
| `is_active` | `bool` | Default `true` |
| `description` | `text?` | |

---

### 3.6 Purchasing & Vendors

#### Vendor

Table: `vendors` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `company_name` | `text` | |
| `contact_name` | `text?` | |
| `email` | `text?` | |
| `phone` | `text?` | |
| `address` | `text?` | |
| `city` | `text?` | |
| `state` | `text?` | |
| `zip_code` | `text?` | |
| `country` | `text?` | |
| `payment_terms` | `text?` | |
| `notes` | `text?` | |
| `is_active` | `bool` | Default `true` |
| `external_id` | `text?` | |
| `external_ref` | `text?` | |
| `provider` | `text?` | |

#### PurchaseOrder

Table: `purchase_orders` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `po_number` | `text` | |
| `vendor_id` | `int` | FK -> `vendors` |
| `job_id` | `int?` | FK -> `jobs` |
| `status` | `text` | Enum: PurchaseOrderStatus |
| `submitted_date` | `timestamptz?` | |
| `acknowledged_date` | `timestamptz?` | |
| `expected_delivery_date` | `timestamptz?` | |
| `received_date` | `timestamptz?` | |
| `notes` | `text?` | |
| `is_blanket` | `bool` | |
| `blanket_total_quantity` | `decimal?` | |
| `blanket_released_quantity` | `decimal?` | |
| `blanket_expiration_date` | `timestamptz?` | |
| `agreed_unit_price` | `decimal?` | |
| `external_id` | `text?` | |
| `external_ref` | `text?` | |
| `provider` | `text?` | |

#### PurchaseOrderLine

Table: `purchase_order_lines` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `purchase_order_id` | `int` | FK -> `purchase_orders` |
| `part_id` | `int` | FK -> `parts` |
| `description` | `text` | |
| `ordered_quantity` | `int` | |
| `received_quantity` | `int` | |
| `unit_price` | `decimal` | |
| `notes` | `text?` | |
| `mrp_planned_order_id` | `int?` | FK -> `mrp_planned_orders` |
| `uom_id` | `int?` | FK -> `units_of_measure` |

#### PurchaseOrderRelease

Table: `purchase_order_releases` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `purchase_order_id` | `int` | FK -> `purchase_orders` |
| `release_number` | `int` | |
| `purchase_order_line_id` | `int` | FK -> `purchase_order_lines` |
| `quantity` | `decimal` | |
| `requested_delivery_date` | `timestamptz` | |
| `actual_delivery_date` | `timestamptz?` | |
| `status` | `text` | Enum: PurchaseOrderReleaseStatus |
| `receiving_record_id` | `int?` | FK -> `receiving_records` |
| `notes` | `text?` | |

#### ReceivingRecord

Table: `receiving_records` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `purchase_order_line_id` | `int` | FK -> `purchase_order_lines` |
| `quantity_received` | `int` | |
| `received_by` | `text?` | |
| `storage_location_id` | `int?` | FK -> `storage_locations` |
| `notes` | `text?` | |
| `inspection_status` | `text` | Enum: ReceivingInspectionStatus |
| `inspected_by_id` | `int?` | |
| `inspected_at` | `timestamptz?` | |
| `inspection_notes` | `text?` | |
| `inspected_quantity_accepted` | `decimal?` | |
| `inspected_quantity_rejected` | `decimal?` | |
| `qc_inspection_id` | `int?` | |

#### ReceivingInspection

Table: `receiving_inspections` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `receiving_record_id` | `int` | FK -> `receiving_records` |
| `qc_inspection_id` | `int?` | FK -> `qc_inspections` |
| `result` | `text` | Enum: ReceivingInspectionResult |
| `accepted_quantity` | `decimal?` | |
| `rejected_quantity` | `decimal?` | |
| `notes` | `text?` | |
| `inspected_by_id` | `int` | |
| `inspected_at` | `timestamptz` | |
| `ncr_id` | `int?` | |

#### RequestForQuote

Table: `request_for_quotes` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `rfq_number` | `text` | |
| `part_id` | `int` | FK -> `parts` |
| `quantity` | `decimal` | |
| `required_date` | `timestamptz` | |
| `status` | `text` | Enum: RfqStatus |
| `description` | `text?` | |
| `special_instructions` | `text?` | |
| `response_deadline` | `timestamptz?` | |
| `sent_at` | `timestamptz?` | |
| `awarded_at` | `timestamptz?` | |
| `awarded_vendor_response_id` | `int?` | |
| `generated_purchase_order_id` | `int?` | |
| `notes` | `text?` | |

#### RfqVendorResponse

Table: `rfq_vendor_responses` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `rfq_id` | `int` | FK -> `request_for_quotes` |
| `vendor_id` | `int` | FK -> `vendors` |
| `response_status` | `text` | Enum: RfqResponseStatus |
| `unit_price` | `decimal?` | |
| `lead_time_days` | `int?` | |
| `minimum_order_quantity` | `decimal?` | |
| `tooling_cost` | `decimal?` | |
| `quote_valid_until` | `timestamptz?` | |
| `notes` | `text?` | |
| `invited_at` | `timestamptz?` | |
| `responded_at` | `timestamptz?` | |
| `is_awarded` | `bool` | |
| `decline_reason` | `text?` | |

#### VendorScorecard

Table: `vendor_scorecards` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `vendor_id` | `int` | FK -> `vendors` |
| `period_start` | `date` | |
| `period_end` | `date` | |
| `total_purchase_orders` | `int` | |
| `on_time_delivery_percent` | `decimal` | |
| `quality_acceptance_percent` | `decimal` | |
| `total_spend` | `decimal` | |
| `overall_score` | `decimal` | |
| `grade` | `text` | Enum: VendorGrade |
| `calculated_at` | `timestamptz` | |
| *(plus many detail columns)* | | |

#### SubcontractOrder

Table: `subcontract_orders` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `job_id` | `int` | FK -> `jobs` |
| `operation_id` | `int` | FK -> `operations` |
| `vendor_id` | `int` | FK -> `vendors` |
| `purchase_order_id` | `int?` | FK -> `purchase_orders` |
| `quantity` | `decimal` | |
| `unit_cost` | `decimal` | |
| `status` | `text` | Enum: SubcontractStatus |
| *(plus tracking/notes columns)* | | |

---

### 3.7 Inventory

#### StorageLocation

Table: `storage_locations` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `name` | `text` | |
| `location_type` | `text` | Enum: LocationType |
| `parent_id` | `int?` | FK -> `storage_locations` (self-ref, hierarchical) |
| `barcode` | `text?` | |
| `description` | `text?` | |
| `sort_order` | `int` | |
| `is_active` | `bool` | Default `true` |

#### BinContent

Table: `bin_contents` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `location_id` | `int` | FK -> `storage_locations` |
| `entity_type` | `text` | Default `"part"` |
| `entity_id` | `int` | Polymorphic FK |
| `quantity` | `decimal` | |
| `lot_number` | `text?` | |
| `job_id` | `int?` | FK -> `jobs` |
| `status` | `text` | Enum: BinContentStatus |
| `placed_by` | `int` | |
| `placed_at` | `timestamptz` | |
| `removed_at` | `timestamptz?` | |
| `removed_by` | `int?` | |
| `notes` | `text?` | |
| `uom_id` | `int?` | FK -> `units_of_measure` |
| `reserved_quantity` | `decimal` | |

#### BinMovement

Table: `bin_movements` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `entity_type` | `text` | Default `"part"` |
| `entity_id` | `int` | |
| `quantity` | `decimal` | |
| `lot_number` | `text?` | |
| `from_location_id` | `int?` | FK -> `storage_locations` |
| `to_location_id` | `int?` | FK -> `storage_locations` |
| `moved_by` | `int` | |
| `moved_at` | `timestamptz` | |
| `reason` | `text?` | Enum: BinMovementReason |

#### Reservation

Table: `reservations` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `part_id` | `int` | FK -> `parts` |
| `bin_content_id` | `int` | FK -> `bin_contents` |
| `job_id` | `int?` | FK -> `jobs` |
| `sales_order_line_id` | `int?` | FK -> `sales_order_lines` |
| `quantity` | `decimal` | |
| `notes` | `text?` | |

#### CycleCount / CycleCountLine

Table: `cycle_counts` | Base: `BaseAuditableEntity`
Table: `cycle_count_lines` | Base: `BaseEntity`

Cycle count header links to a location + counter user. Lines compare expected vs actual quantity per bin content.

#### LotRecord

Table: `lot_records` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `lot_number` | `text` | |
| `part_id` | `int` | FK -> `parts` |
| `job_id` | `int?` | FK -> `jobs` |
| `production_run_id` | `int?` | FK -> `production_runs` |
| `purchase_order_line_id` | `int?` | FK -> `purchase_order_lines` |
| `quantity` | `int` | |
| `expiration_date` | `timestamptz?` | |
| `supplier_lot_number` | `text?` | |
| `notes` | `text?` | |

#### SerialNumber / SerialHistory

Table: `serial_numbers` | Base: `BaseAuditableEntity` | Soft delete: Yes
Table: `serial_histories` | Base: `BaseEntity`

Serial tracking with full lifecycle history. Supports parent-child hierarchy for assemblies.

#### ReorderSuggestion

Table: `reorder_suggestions` | Base: `BaseAuditableEntity` | Soft delete: Yes

Auto-generated replenishment suggestions with burn rate analysis, stock projection, and PO creation workflow.

---

### 3.8 Time Tracking & Labor

#### TimeEntry

Table: `time_entries` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `job_id` | `int?` | FK -> `jobs` |
| `user_id` | `int` | |
| `date` | `date` | |
| `duration_minutes` | `int` | |
| `category` | `text?` | |
| `notes` | `text?` | |
| `timer_start` | `timestamptz?` | |
| `timer_stop` | `timestamptz?` | |
| `is_manual` | `bool` | |
| `is_locked` | `bool` | |
| `accounting_time_activity_id` | `text?` | |
| `operation_id` | `int?` | FK -> `operations` |
| `entry_type` | `text` | Enum: TimeEntryType |
| `labor_cost` | `decimal` | |
| `burden_cost` | `decimal` | |

#### ClockEvent

Table: `clock_events` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | `int` | |
| `event_type` | `text` | Enum: ClockEventType |
| `event_type_code` | `text` | Reference-data-driven code |
| `operation_id` | `int?` | |
| `reason` | `text?` | |
| `scan_method` | `text?` | |
| `timestamp` | `timestamptz` | |
| `source` | `text?` | |

#### TimeCorrectionLog

Table: `time_correction_logs` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `time_entry_id` | `int` | FK -> `time_entries` |
| `corrected_by_user_id` | `int` | |
| `reason` | `text` | |
| `original_job_id` | `int?` | |
| `original_date` | `date` | |
| `original_duration_minutes` | `int` | |
| `original_start_time` | `timestamptz?` | |
| `original_end_time` | `timestamptz?` | |
| `original_category` | `text?` | |
| `original_notes` | `text?` | |

#### LaborRate

Table: `labor_rates` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | `int` | |
| `standard_rate_per_hour` | `decimal` | |
| `overtime_rate_per_hour` | `decimal` | |
| `doubletime_rate_per_hour` | `decimal?` | |
| `effective_from` | `date` | |
| `effective_to` | `date?` | |
| `notes` | `text?` | |

---

### 3.9 Assets & Maintenance

#### Asset

Table: `assets` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `name` | `text` | |
| `asset_type` | `text` | Enum: AssetType |
| `location` | `text?` | |
| `manufacturer` | `text?` | |
| `model` | `text?` | |
| `serial_number` | `text?` | |
| `status` | `text` | Enum: AssetStatus |
| `photo_file_id` | `text?` | |
| `current_hours` | `decimal` | |
| `notes` | `text?` | |
| `is_customer_owned` | `bool` | Tooling-specific |
| `cavity_count` | `int?` | |
| `tool_life_expectancy` | `int?` | |
| `current_shot_count` | `int` | |
| `source_job_id` | `int?` | FK -> `jobs` |
| `source_part_id` | `int?` | FK -> `parts` |

#### MaintenanceSchedule / MaintenanceLog

Table: `maintenance_schedules` | Base: `BaseAuditableEntity`
Table: `maintenance_logs` | Base: `BaseEntity`

Preventive maintenance scheduling with interval-based triggers and completed maintenance log entries.

#### DowntimeLog

Table: `downtime_logs` | Base: `BaseAuditableEntity` | Soft delete: Yes

Tracks equipment downtime with Six Big Losses categories (DowntimeCategory enum) for OEE calculation.

---

### 3.10 Leads & Expenses

#### Lead

Table: `leads` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `company_name` | `text` | |
| `contact_name` | `text?` | |
| `email` | `text?` | |
| `phone` | `text?` | |
| `source` | `text?` | |
| `status` | `text` | Enum: LeadStatus |
| `notes` | `text?` | |
| `follow_up_date` | `timestamptz?` | |
| `lost_reason` | `text?` | |
| `converted_customer_id` | `int?` | FK -> `customers` |
| `custom_field_values` | `text?` | JSONB |
| `created_by` | `int` | |

#### Expense

Table: `expenses` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | `int` | |
| `job_id` | `int?` | FK -> `jobs` |
| `amount` | `decimal` | |
| `category` | `text` | |
| `description` | `text` | |
| `receipt_file_id` | `text?` | |
| `status` | `text` | Enum: ExpenseStatus |
| `approved_by` | `int?` | |
| `approval_notes` | `text?` | |
| `expense_date` | `timestamptz` | |
| `external_id` | `text?` | |
| `external_ref` | `text?` | |
| `provider` | `text?` | |

#### RecurringExpense

Table: `recurring_expenses` | Base: `BaseAuditableEntity` | Soft delete: Yes

Auto-generates expense entries on a recurring schedule (weekly, monthly, etc.).

---

### 3.11 Quality

#### QcChecklistTemplate / QcChecklistItem

Table: `qc_checklist_templates` | Base: `BaseAuditableEntity`
Table: `qc_checklist_items` | Base: `BaseEntity`

Quality checklist definitions linked to parts. Items define inspection criteria.

#### QcInspection / QcInspectionResult

Table: `qc_inspections` | Base: `BaseAuditableEntity`
Table: `qc_inspection_results` | Base: `BaseEntity`

Inspection records linked to jobs and/or production runs with pass/fail results per checklist item.

#### NonConformance

Table: `non_conformances` | Base: `BaseAuditableEntity` | Soft delete: Yes

NCR tracking with detection stage, containment, disposition, cost impact, and CAPA linkage. Links to parts, jobs, customers, vendors.

#### CorrectiveAction / CapaTask

Table: `corrective_actions` | Base: `BaseAuditableEntity` | Soft delete: Yes
Table: `capa_tasks` | Base: `BaseEntity`

Full CAPA lifecycle: root cause analysis (5-Why, Fishbone, 8D, etc.), containment, corrective/preventive actions, verification, effectiveness check.

#### SpcCharacteristic / SpcMeasurement / SpcControlLimit / SpcOocEvent

Table: `spc_characteristics`, `spc_measurements`, `spc_control_limits`, `spc_ooc_events`

Statistical Process Control with X-bar/R charts, Cp/Cpk/Pp/Ppk calculations, out-of-control event detection and CAPA linkage.

#### FmeaAnalysis / FmeaItem

Table: `fmea_analyses`, `fmea_items`

FMEA (Failure Mode and Effects Analysis) with RPN (Severity x Occurrence x Detection) scoring for design and process analysis.

#### PpapSubmission / PpapElement

Table: `ppap_submissions`, `ppap_elements`

PPAP (Production Part Approval Process) tracking with 18-element checklists, customer submission workflow.

---

### 3.12 Production & Scheduling

#### ProductionRun

Table: `production_runs` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `job_id` | `int` | FK -> `jobs` |
| `part_id` | `int` | FK -> `parts` |
| `operator_id` | `int?` | |
| `work_center_id` | `int?` | FK -> `work_centers` |
| `run_number` | `text` | |
| `target_quantity` | `int` | |
| `completed_quantity` | `int` | |
| `scrap_quantity` | `int` | |
| `rework_quantity` | `int` | |
| `status` | `text` | Enum: ProductionRunStatus |
| `started_at` | `timestamptz?` | |
| `completed_at` | `timestamptz?` | |
| `setup_time_minutes` | `decimal?` | |
| `run_time_minutes` | `decimal?` | |
| `ideal_cycle_time_seconds` | `decimal?` | |
| `actual_cycle_time_seconds` | `decimal?` | |

#### WorkCenter

Table: `work_centers` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `name` | `text` | |
| `code` | `text` | |
| `description` | `text?` | |
| `company_location_id` | `int?` | FK -> `company_locations` |
| `asset_id` | `int?` | FK -> `assets` |
| `daily_capacity_hours` | `decimal` | Default `8` |
| `efficiency_percent` | `decimal` | Default `100` |
| `number_of_machines` | `int` | Default `1` |
| `labor_cost_per_hour` | `decimal` | |
| `burden_rate_per_hour` | `decimal` | |
| `ideal_cycle_time_seconds` | `decimal?` | |
| `is_active` | `bool` | |
| `sort_order` | `int` | |

#### Shift / WorkCenterShift / WorkCenterCalendar / ShiftAssignment

Shift definitions, work center shift assignments by day-of-week (flags enum), calendar overrides for holidays/maintenance, and employee shift assignments.

#### ScheduledOperation / ScheduleRun

Finite capacity scheduling with forward/backward scheduling, Gantt-chart-ready operation timing.

#### MaterialIssue

Table: `material_issues` | Base: `BaseAuditableEntity` | Soft delete: Yes

Material issue/return/scrap tracking against jobs, with bin content deduction and cost calculation.

---

### 3.13 MRP (Material Requirements Planning)

#### MrpRun / MrpDemand / MrpSupply / MrpPlannedOrder / MrpException

Table: `mrp_runs`, `mrp_demands`, `mrp_supplies`, `mrp_planned_orders`, `mrp_exceptions`

Full MRP explosion: demand from sales orders/master schedules/forecasts, supply from inventory/POs/planned orders, planned order generation (purchase or manufacture), exception management.

#### MasterSchedule / MasterScheduleLine

Master Production Schedule with period-based planning quantities per part.

#### DemandForecast / ForecastOverride

Demand forecasting with moving average, exponential smoothing, and manual override support.

---

### 3.14 Training & LMS

#### TrainingModule

Table: `training_modules` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `title` | `text` | |
| `slug` | `text` | |
| `summary` | `text` | |
| `content_type` | `text` | Enum: TrainingContentType |
| `content_json` | `text` | JSONB |
| `cover_image_url` | `text?` | |
| `estimated_minutes` | `int` | |
| `tags` | `text?` | |
| `app_routes` | `text?` | |
| `is_published` | `bool` | |
| `is_onboarding_required` | `bool` | |
| `sort_order` | `int` | |
| `created_by_user_id` | `int?` | |

#### TrainingPath / TrainingPathModule / TrainingPathEnrollment

Learning paths with ordered module sequences, role-based auto-assignment, and enrollment tracking.

#### TrainingProgress

Table: `training_progress` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | `int` | |
| `module_id` | `int` | FK -> `training_modules` |
| `status` | `text` | Enum: TrainingProgressStatus |
| `quiz_score` | `int?` | |
| `quiz_attempts` | `int?` | |
| `started_at` | `timestamptz?` | |
| `completed_at` | `timestamptz?` | |
| `time_spent_seconds` | `int` | |
| `quiz_answers_json` | `text?` | JSONB |
| `quiz_session_json` | `text?` | JSONB (random question selection) |
| `walkthrough_step_reached` | `int?` | |

---

### 3.15 HR & Employee

#### EmployeeProfile

Table: `employee_profiles` | Base: `BaseAuditableEntity` | Soft delete: Yes

Per-user personal, address, contact, emergency contact, employment, and compliance tracking fields. Links to `asp_net_users` via `user_id`.

#### ComplianceFormTemplate / ComplianceFormSubmission / FormDefinitionVersion / IdentityDocument

Compliance form system (W-4, I-9, state withholding) with PDF extraction, versioned form definitions, DocuSeal signing integration, and identity document upload/verification.

#### PayStub / PayStubDeduction / TaxDocument

Payroll documents with line-item deductions and tax document management.

#### Event / EventAttendee

Table: `events` | Base: `BaseAuditableEntity`
Table: `event_attendees` | Base: `BaseEntity`

Company events (Meeting, Training, Safety, Other) with RSVP tracking and 15-minute reminder jobs.

#### LeavePolicy / LeaveBalance / LeaveRequest

PTO/leave accrual policies, per-employee balances, and request/approval workflow.

#### ReviewCycle / PerformanceReview

Performance review cycles with self-assessment, manager review, and acknowledgment workflow.

#### OvertimeRule

Table: `overtime_rules` | Base: `BaseAuditableEntity`

Configurable daily/weekly overtime and doubletime thresholds with multipliers.

---

### 3.16 Chat & Notifications

#### ChatRoom / ChatRoomMember / ChatMessage

Table: `chat_rooms`, `chat_room_members`, `chat_messages`

1:1 DMs and group rooms with file/entity sharing. Real-time via SignalR ChatHub.

#### Notification

Table: `notifications` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | `int` | |
| `type` | `text` | |
| `severity` | `text` | Default `"info"` |
| `source` | `text` | Default `"system"` |
| `title` | `text` | |
| `message` | `text` | |
| `is_read` | `bool` | |
| `is_pinned` | `bool` | |
| `is_dismissed` | `bool` | |
| `entity_type` | `text?` | Polymorphic link |
| `entity_id` | `int?` | |
| `sender_id` | `int?` | |

---

### 3.17 AI / RAG

#### DocumentEmbedding

Table: `document_embeddings` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `entity_type` | `text` | |
| `entity_id` | `int` | |
| `chunk_text` | `text` | |
| `chunk_index` | `int` | |
| `source_field` | `text?` | |
| `embedding` | `vector(384)` | pgvector column |
| `model_name` | `text` | |

Used by the Ollama RAG pipeline for smart search and document Q&A. The `embedding` column uses pgvector's `vector(384)` type for cosine similarity search.

#### AiAssistant

Table: `ai_assistants` | Base: `BaseAuditableEntity` | Soft delete: Yes

Configurable AI assistants with system prompts, allowed entity types, temperature settings, and starter questions.

---

### 3.18 EDI (Electronic Data Interchange)

#### EdiTradingPartner / EdiTransaction / EdiMapping

X12/EDIFACT trading partner management with transport configuration (AS2, SFTP, VAN, API), transaction lifecycle (receive, parse, validate, process, acknowledge), field/value mappings, and retry support.

---

### 3.19 Security & Auth

#### UserMfaDevice

Table: `user_mfa_devices` | Base: `BaseAuditableEntity` | Soft delete: Yes

TOTP, SMS, Email, WebAuthn device registration with verification, lockout, and usage tracking.

#### MfaRecoveryCode

Table: `mfa_recovery_codes` | Base: `BaseAuditableEntity` | Soft delete: Yes

One-time recovery codes (hashed) with usage tracking.

#### UserScanIdentifier

Table: `user_scan_identifiers` | Base: `BaseAuditableEntity` | Soft delete: Yes

NFC/RFID/barcode identifiers linked to users for kiosk authentication.

---

### 3.20 Files & Storage

#### FileAttachment

Table: `file_attachments` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `file_name` | `text` | |
| `content_type` | `text` | |
| `size` | `bigint` | |
| `bucket_name` | `text` | MinIO bucket |
| `object_key` | `text` | MinIO object key |
| `entity_type` | `text` | Polymorphic |
| `entity_id` | `int` | |
| `uploaded_by_id` | `int` | |
| `document_type` | `text?` | |
| `expiration_date` | `timestamptz?` | |
| `part_revision_id` | `int?` | FK -> `part_revisions` |
| `required_role` | `text?` | |
| `sensitivity` | `text?` | |

---

### 3.21 System & Configuration

#### ReferenceData

Table: `reference_data` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `group_code` | `text` | Lookup group |
| `code` | `text` | Immutable value code |
| `label` | `text` | Admin-editable display label |
| `sort_order` | `int` | |
| `is_active` | `bool` | Default `true` |
| `is_seed_data` | `bool` | |
| `effective_from` | `timestamptz?` | |
| `effective_to` | `timestamptz?` | |
| `parent_id` | `int?` | FK -> `reference_data` (recursive) |
| `metadata` | `text?` | JSONB |

#### SystemSetting

Table: `system_settings` | Base: `BaseEntity` | Soft delete: No

| Column | Type | Notes |
|--------|------|-------|
| `key` | `text` | e.g., `company.name`, `company.phone` |
| `value` | `text` | |
| `description` | `text?` | |

#### TerminologyEntry

Table: `terminology_entries` | Base: `BaseAuditableEntity` | Soft delete: Yes

Admin-configurable label resolution (e.g., `entity_job` -> "Work Order").

#### UserPreference

Table: `user_preferences` | Base: `BaseAuditableEntity` | Soft delete: Yes

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | `int` | |
| `key` | `text` | e.g., `table:parts-list`, `theme:mode` |
| `value_json` | `text` | JSONB |

#### CompanyLocation

Table: `company_locations` | Base: `BaseAuditableEntity` | Soft delete: Yes

Multi-location support with address fields, default flag, and employee work location assignment.

#### SyncQueueEntry

Table: `sync_queue_entries` | Base: `BaseEntity` | Soft delete: No

Accounting sync queue for pending/failed operations.

#### StatusEntry

Table: `status_entries` | Base: `BaseAuditableEntity` | Soft delete: Yes

Polymorphic workflow status tracking (via `entity_type`/`entity_id`) with holds and timeline support.

#### ActivityLog

Table: `activity_logs` | Base: `BaseEntity` | Soft delete: No

Polymorphic activity log (via `entity_type`/`entity_id`) with field-level change tracking.

#### AuditLogEntry

Table: `audit_log_entries` | Base: `BaseEntity` | Soft delete: No

Security audit trail with IP address and user agent tracking.

#### EntityNote

Table: `entity_notes` | Base: `BaseAuditableEntity` | Soft delete: Yes

Polymorphic notes (via `entity_type`/`entity_id`).

#### SavedReport / ReportSchedule

Report builder saved configurations and scheduled email delivery via Hangfire.

#### ScheduledTask

Admin-defined recurring tasks with cron expressions and Hangfire execution.

---

### 3.22 Barcode Registry

#### Barcode

Table: `barcodes` | Base: `BaseAuditableEntity` | Soft delete: Yes

Central barcode registry with dedicated FK columns (exactly one non-null): `user_id`, `part_id`, `job_id`, `sales_order_id`, `purchase_order_id`, `asset_id`, `storage_location_id`.

---

### 3.23 Advanced Manufacturing

#### KanbanCard / KanbanTriggerLog

Two-bin kanban replenishment system with auto/manual/scan triggers.

#### PickWave / PickLine

Warehouse pick wave planning with zone/batch/discrete strategies.

#### ConsignmentAgreement / ConsignmentTransaction

Inbound/outbound consignment inventory with reconciliation and consumption tracking.

#### AbcClassificationRun / AbcClassification

ABC inventory analysis with run history and per-part classification.

#### EngineeringChangeOrder / EcoAffectedItem

ECO workflow with affected item tracking and approval integration.

#### ProductConfigurator / ConfiguratorOption / ProductConfiguration

Configure-Price-Quote (CPQ) with option types, pricing rules, BOM/routing impact, and validation.

---

### 3.24 Multi-Plant / Multi-Currency / Multi-Language

#### Plant / InterPlantTransfer / InterPlantTransferLine

Multi-plant with inter-plant material transfers.

#### Currency / ExchangeRate

Multi-currency with API/manual/bank rate sources.

#### SupportedLanguage / TranslatedLabel

UI localization with completion tracking and per-label approval.

#### UnitOfMeasure / UomConversion

UoM system with category-based organization and part-specific conversion factors.

---

### 3.25 IoT & Predictive Maintenance

#### MachineConnection / MachineTag / MachineDataPoint

OPC-UA machine connectivity with configurable tags and threshold alerting.

#### AndonAlert

Shop floor andon alert system with help/quality/material/maintenance/safety types.

#### MaintenancePrediction / MlModel / PredictionFeedback

ML-based predictive maintenance with model versioning and prediction accuracy feedback.

---

### 3.26 Project Accounting

#### Project / WbsElement / WbsCostEntry

Work Breakdown Structure (WBS) project accounting with budget vs actual tracking.

---

### 3.27 E-Commerce & Webhooks

#### ECommerceIntegration / ECommerceOrderSync

Multi-platform e-commerce integration (Shopify, WooCommerce, Amazon, etc.) with order import.

#### WebhookSubscription / WebhookDelivery

Outbound webhook system with HMAC signing, retry, and auto-disable on failure.

#### BiApiKey

BI tool API keys with hash storage, expiration, IP restrictions, and entity-set scoping.

---

### 3.28 Approval Workflows

#### ApprovalWorkflow / ApprovalStep / ApprovalRequest / ApprovalDecision

Configurable multi-step approval chains with role/user/manager approver types, auto-approve thresholds, delegation, and escalation.

---

### 3.29 Document Control

#### ControlledDocument / DocumentRevision

ISO-style document control with check-out/check-in, revision workflow, and periodic review scheduling.

---

### 3.30 User Integrations

#### UserIntegration

Table: `user_integrations` | Base: `BaseAuditableEntity` | Soft delete: Yes

Per-user OAuth integrations (calendar, messaging, storage) with encrypted credentials.

---

## 4. Enums Reference

| Enum | Values | Used By |
|------|--------|---------|
| `AbcClass` | A, B, C | AbcClassification |
| `AccountingDocumentType` | Estimate, SalesOrder, PurchaseOrder, Invoice, Payment | JobStage |
| `ActivityAction` | Created, FieldChanged, StageMoved, SubtaskAdded, SubtaskCompleted, CommentAdded, Assigned, Unassigned, Archived, Restored | JobActivityLog |
| `AddressType` | Billing, Shipping, Both | CustomerAddress |
| `AlternateType` | Substitute, Equivalent, Superseded | PartAlternate |
| `AndonAlertStatus` | Active, Acknowledged, Resolved | AndonAlert |
| `AndonAlertType` | Help, Quality, Material, Maintenance, Safety | AndonAlert |
| `ApprovalDecisionType` | Approve, Reject, Delegate, Escalate | ApprovalDecision |
| `ApprovalRequestStatus` | Pending, Approved, Rejected, Escalated, Cancelled, AutoApproved | ApprovalRequest |
| `ApproverType` | SpecificUser, Role, Manager | ApprovalStep |
| `AssetStatus` | Active, Maintenance, Retired, OutOfService | Asset |
| `AssetType` | Machine, Tooling, Facility, Vehicle, Other | Asset |
| `AttendeeStatus` | Invited, Accepted, Declined, Attended | EventAttendee |
| `BOMSourceType` | Make, Buy, Stock | BOMEntry |
| `BarcodeEntityType` | User, Part, Job, SalesOrder, PurchaseOrder, Asset, StorageLocation | Barcode |
| `BinContentStatus` | Stored, Reserved, ReadyToShip, QcHold | BinContent |
| `BinMovementReason` | Receive, Pick, Restock, QcRelease, Ship, Move, Adjustment, Return, Transfer, CycleCount | BinMovement |
| `CalibrationResult` | Pass, Fail, Adjusted, OutOfTolerance | CalibrationRecord |
| `CapaSourceType` | Ncr, CustomerComplaint, InternalAudit, ExternalAudit, SpcOoc, ManagementReview, Other | CorrectiveAction |
| `CapaStatus` | Open, RootCauseAnalysis, ActionPlanning, Implementation, Verification, EffectivenessCheck, Closed | CorrectiveAction |
| `CapaTaskStatus` | Open, InProgress, Completed, Cancelled | CapaTask |
| `CapaType` | Corrective, Preventive | CorrectiveAction |
| `ClockEventType` | ClockIn, ClockOut, BreakStart, BreakEnd, LunchStart, LunchEnd | ClockEvent |
| `ComplianceFormType` | W4, I9, StateWithholding, DirectDeposit, WorkersComp, Handbook | ComplianceFormTemplate |
| `ComplianceSubmissionStatus` | Pending, Opened, Completed, Expired, Declined | ComplianceFormSubmission |
| `ConfigurationStatus` | Draft, Quoted, Ordered, Cancelled | ProductConfiguration |
| `ConfiguratorOptionType` | Select, MultiSelect, Checkbox, Quantity, Text, Numeric | ConfiguratorOption |
| `ConsignmentAgreementStatus` | Draft, Active, Suspended, Expired, Terminated | ConsignmentAgreement |
| `ConsignmentDirection` | Inbound, Outbound | ConsignmentAgreement |
| `ConsignmentTransactionType` | Receipt, Consumption, Return, Adjustment, Reconciliation | ConsignmentTransaction |
| `ControlledDocumentStatus` | Draft, InReview, Released, Obsolete | ControlledDocument |
| `CreditHoldReason` | OverCreditLimit, PastDue, NewCustomer, PaymentHistory, BankruptcyFiling, DisputedInvoices, ManualHold, Other | CreditHold |
| `CreditTerms` | DueOnReceipt, Net15, Net30, Net45, Net60, Net90 | Invoice, SalesOrder |
| `CustomerReturnStatus` | Received, UnderInspection, ReworkOrdered, Resolved, Closed | CustomerReturn |
| `DaysOfWeek` | [Flags] None, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday | WorkCenterShift |
| `DocumentRevisionStatus` | Draft, InReview, Approved, Rejected, Superseded | DocumentRevision |
| `DowntimeCategory` | EquipmentFailure, SetupAdjustment, Idling, ReducedSpeed, ProcessDefects, ReducedYield | DowntimeLog |
| `ECommerceOrderSyncStatus` | Pending, Imported, Failed, Skipped, Cancelled | ECommerceOrderSync |
| `ECommercePlatform` | Shopify, WooCommerce, Amazon, BigCommerce, Magento | ECommerceIntegration |
| `EcoChangeType` | New, Revision, Obsolescence, CostReduction, QualityImprovement | EngineeringChangeOrder |
| `EcoPriority` | Low, Normal, High, Critical | EngineeringChangeOrder |
| `EcoStatus` | Draft, Review, Approved, InImplementation, Implemented, Cancelled | EngineeringChangeOrder |
| `EdiDirection` | Inbound, Outbound | EdiTransaction |
| `EdiFormat` | X12, Edifact | EdiTradingPartner |
| `EdiTransactionStatus` | Received, Parsing, Parsed, Validating, Validated, Processing, Applied, Error, Acknowledged, Rejected | EdiTransaction |
| `EdiTransportMethod` | As2, Sftp, Van, Email, Api, Manual | EdiTradingPartner |
| `EventType` | Meeting, Training, Safety, Other | Event |
| `ExchangeRateSource` | Manual, Api, Bank | ExchangeRate |
| `ExpenseStatus` | Pending, Approved, Rejected, SelfApproved | Expense |
| `FmeaStatus` | Draft, Active, Closed, Superseded | FmeaAnalysis |
| `FmeaType` | Design, Process | FmeaAnalysis |
| `ForecastMethod` | MovingAverage, ExponentialSmoothing, WeightedMovingAverage | DemandForecast |
| `ForecastStatus` | Draft, Approved, Applied, Expired | DemandForecast |
| `GageStatus` | InService, DueForCalibration, OutForCalibration, OutOfService, Retired | Gage |
| `IdentityDocumentType` | ListA, ListB, ListC, Passport, DriversLicense, SsnCard, BirthCertificate, ... (13 values) | IdentityDocument |
| `InterPlantTransferStatus` | Draft, Approved, Shipped, InTransit, Received, Cancelled | InterPlantTransfer |
| `InteractionType` | Call, Email, Meeting, Note | ContactInteraction |
| `InvoiceStatus` | Draft, Sent, PartiallyPaid, Paid, Overdue, Voided | Invoice |
| `JobDisposition` | ShipToCustomer, AddToInventory, CapitalizeAsAsset, Scrap, HoldForReview | Job |
| `JobLinkType` | RelatedTo, Blocks, BlockedBy, Parent, Child, HandoffFrom, HandoffTo | JobLink |
| `JobPriority` | Low, Normal, High, Urgent | Job |
| `KanbanCardStatus` | Full, Triggered, InReplenishment, Empty | KanbanCard |
| `KanbanSupplySource` | Production, Purchase | KanbanCard |
| `KanbanTriggerType` | Manual, Scan, AutoLevel | KanbanTriggerLog |
| `LeadStatus` | New, Contacted, Quoting, Converted, Lost | Lead |
| `LeaveRequestStatus` | Pending, Approved, Denied, Cancelled | LeaveRequest |
| `LocationType` | Area, Rack, Shelf, Bin | StorageLocation |
| `LotSizingRule` | LotForLot, FixedQuantity, MinMax, EconomicOrderQuantity, MultiplesOf | Part |
| `MachineConnectionStatus` | Disconnected, Connecting, Connected, Error | MachineConnection |
| `MachineDataQuality` | Good, Bad, Uncertain | MachineDataPoint |
| `MaintenancePredictionSeverity` | Low, Medium, High, Critical | MaintenancePrediction |
| `MaintenancePredictionStatus` | Predicted, Acknowledged, MaintenanceScheduled, Resolved, FalsePositive, Expired | MaintenancePrediction |
| `MasterScheduleStatus` | Draft, Active, Completed, Cancelled | MasterSchedule |
| `MaterialIssueType` | Issue, Return, Scrap | MaterialIssue |
| `MfaDeviceType` | Totp, Sms, Email, WebAuthn | UserMfaDevice |
| `MlModelStatus` | Training, Active, Inactive, Failed | MlModel |
| `MrpDemandSource` | SalesOrder, MasterSchedule, Forecast, ManualDemand, DependentDemand | MrpDemand |
| `MrpExceptionType` | Expedite, Defer, Cancel, PastDue, ShortSupply, OverSupply, LeadTimeViolation | MrpException |
| `MrpOrderType` | Purchase, Manufacture | MrpPlannedOrder |
| `MrpPlannedOrderStatus` | Planned, Firmed, Released, Cancelled | MrpPlannedOrder |
| `MrpRunStatus` | Queued, Running, Completed, Failed | MrpRun |
| `MrpRunType` | Full, NetChange, Simulation | MrpRun |
| `MrpSupplySource` | OnHand, PurchaseOrder, PlannedOrder, ProductionRun, InTransit | MrpSupply |
| `NcrDetectionStage` | Receiving, InProcess, FinalInspection, Shipping, Customer, Audit | NonConformance |
| `NcrDispositionCode` | UseAsIs, Rework, Scrap, ReturnToVendor, SortAndScreen, Reject | NonConformance |
| `NcrStatus` | Open, UnderReview, Contained, Dispositioned, Closed | NonConformance |
| `NcrType` | Internal, Supplier, Customer | NonConformance |
| `PartStatus` | Active, Obsolete, Draft, Prototype | Part |
| `PartType` | Part, Assembly, RawMaterial, Consumable, Tooling, Fastener, Electronic, Packaging | Part |
| `PayStubDeductionCategory` | FederalTax, StateTax, SocialSecurity, Medicare, HealthInsurance, Retirement401k, ... (15 values) | PayStubDeduction |
| `PayType` | Hourly, Salary, Contract | EmployeeProfile |
| `PaymentMethod` | Cash, Check, CreditCard, BankTransfer, Wire, Other | Payment |
| `PayrollDocumentSource` | Accounting, Manual | PayStub, TaxDocument |
| `PickLineStatus` | Pending, Picked, Short, Skipped | PickLine |
| `PickWaveStatus` | Draft, Released, InProgress, Completed, Cancelled | PickWave |
| `PickWaveStrategy` | Zone, Batch, Discrete, WaveByCarrier | PickWave |
| `PlanningCycleStatus` | Planning, Active, Completed | PlanningCycle |
| `PpapElementStatus` | NotStarted, InProgress, Complete, NotApplicable | PpapElement |
| `PpapStatus` | Draft, InProgress, Submitted, Approved, Rejected, Interim | PpapSubmission |
| `PpapSubmissionReason` | NewPart, EngineeringChange, Tooling, Correction, SupplierChange, InactiveRestart, Other | PpapSubmission |
| `ProductionRunStatus` | Planned, InProgress, Completed, Cancelled | ProductionRun |
| `ProjectStatus` | Planning, Active, OnHold, Complete, Cancelled | Project |
| `PurchaseOrderReleaseStatus` | Open, Sent, PartialReceived, Received, Cancelled | PurchaseOrderRelease |
| `PurchaseOrderStatus` | Draft, Submitted, Acknowledged, PartiallyReceived, Received, Closed, Cancelled | PurchaseOrder |
| `QuoteStatus` | Draft, Sent, Accepted, Declined, Expired, ConvertedToQuote, ConvertedToOrder | Quote |
| `QuoteType` | Estimate, Quote | Quote |
| `ReceivingInspectionFrequency` | Every, FirstArticle, SkipLot, Random | Part |
| `ReceivingInspectionResult` | Accept, Reject, ConditionalAccept, Quarantine | ReceivingInspection |
| `ReceivingInspectionStatus` | NotRequired, Pending, InProgress, Passed, Failed, Waived, PartialAccept | ReceivingRecord |
| `RecurrenceFrequency` | Weekly, Biweekly, Monthly, Quarterly, Annually | RecurringExpense |
| `ReorderSuggestionStatus` | Pending, Approved, Dismissed, Expired | ReorderSuggestion |
| `ReportExportFormat` | Pdf, Csv, Xlsx | ReportSchedule |
| `ReportFilterOperator` | Equals, NotEquals, Contains, StartsWith, GreaterThan, LessThan, ... (12 values) | Report filters |
| `ReviewCycleStatus` | Draft, Active, Completed | ReviewCycle |
| `ReviewStatus` | NotStarted, SelfAssessment, ManagerReview, Discussion, Completed | PerformanceReview |
| `RfqResponseStatus` | Pending, Received, Declined, Awarded, NotAwarded | RfqVendorResponse |
| `RfqStatus` | Draft, Sent, Receiving, EvaluatingResponses, Awarded, Cancelled, Expired | RequestForQuote |
| `RootCauseMethod` | FiveWhy, Fishbone, FaultTree, EightD, Pareto, IsIsNot | CorrectiveAction |
| `SalesOrderStatus` | Draft, Confirmed, InProduction, PartiallyShipped, Shipped, Completed, Cancelled | SalesOrder |
| `ScheduleDirection` | Forward, Backward | ScheduleRun |
| `ScheduleRunStatus` | Queued, Running, Completed, Failed | ScheduleRun |
| `ScheduledOperationStatus` | Scheduled, InProgress, Complete, Cancelled | ScheduledOperation |
| `SerialNumberStatus` | Available, InUse, Shipped, Returned, Scrapped, Quarantined | SerialNumber |
| `ShipmentStatus` | Pending, Packed, Shipped, InTransit, Delivered, Cancelled | Shipment |
| `SpcMeasurementType` | Variable, Attribute | SpcCharacteristic |
| `SpcOocSeverity` | Warning, OutOfControl, OutOfSpec | SpcOocEvent |
| `SpcOocStatus` | Open, Acknowledged, CapaCreated, Resolved | SpcOocEvent |
| `SubcontractStatus` | Pending, Sent, InProcess, Shipped, Received, QcPending, Complete, Rejected | SubcontractOrder |
| `SyncStatus` | Pending, Processing, Completed, Failed | SyncQueueEntry |
| `TaxDocumentType` | W2, W2c, Misc1099, Nec1099, Other | TaxDocument |
| `TimeEntryType` | Setup, Run, Teardown, Inspection, Rework, Wait, Other | TimeEntry |
| `TrainingContentType` | Article=0, Walkthrough=2, QuickRef=3, Quiz=4 | TrainingModule |
| `TrainingProgressStatus` | NotStarted, InProgress, Completed | TrainingProgress |
| `UomCategory` | Count, Length, Weight, Volume, Area, Time | UnitOfMeasure |
| `VendorGrade` | A, B, C, D, F | VendorScorecard |
| `WbsCostCategory` | Labor, Material, Subcontract, Other | WbsCostEntry |
| `WbsElementType` | Phase, Deliverable, WorkPackage, Milestone | WbsElement |

---

## 5. Entity Relationships

### 5.1 Job / Kanban Domain

```
TrackType 1──* JobStage
    │
    └──* Job
         ├── *──1 JobStage (current_stage_id)
         ├── *──? Customer
         ├── *──? Part
         ├── *──? Job (parent_job_id, self-ref)
         ├── *──? SalesOrderLine
         ├── 1──* JobSubtask
         ├── 1──* JobActivityLog
         ├── 1──* JobNote
         ├── 1──* JobPart ──* Part
         ├── 1──* PlanningCycleEntry ──* PlanningCycle
         ├── 1──* PurchaseOrder
         ├── 1──* MaterialIssue
         └── *──* Job (via JobLink: source/target)
```

### 5.2 Customer / Order-to-Cash

```
Customer
 ├── 1──* Contact ──* ContactInteraction
 ├── 1──* CustomerAddress
 ├── 1──* Quote (Estimate or Quote type)
 │         └── 1──* QuoteLine ──? Part
 ├── 1──* SalesOrder
 │         ├── 1──* SalesOrderLine ──? Part
 │         │         └── 1──* ShipmentLine
 │         ├── 1──* Shipment
 │         │         ├── 1──* ShipmentLine
 │         │         └── 1──* ShipmentPackage
 │         └── 1──* Invoice (standalone mode)
 ├── 1──* Invoice ──* InvoiceLine ──? Part
 │         └── 1──* PaymentApplication
 ├── 1──* Payment ──* PaymentApplication ──* Invoice
 ├── 1──* PriceList ──* PriceListEntry ──* Part
 ├── 1──* RecurringOrder ──* RecurringOrderLine ──* Part
 ├── 1──* CustomerReturn ──* Job (original + rework)
 └── 1──* CreditHold
```

### 5.3 Part / BOM / Operations

```
Part
 ├── 1──* BOMEntry (as parent_part_id)
 │         └── *──1 Part (child_part_id)
 ├── 1──* BOMEntry (as child, via UsedInBOM)
 ├── 1──* Operation
 │         ├── *──? WorkCenter
 │         ├── *──? Asset
 │         └── 1──* OperationMaterial ──* BOMEntry
 ├── 1──* PartRevision ──* FileAttachment
 ├── 1──* PartAlternate
 ├── 1──* PartPrice
 ├── 1──* SerialNumber ──* SerialHistory
 ├── *──? Vendor (preferred_vendor_id)
 ├── *──? Asset (tooling_asset_id)
 └── *──? UnitOfMeasure (stock/purchase/sales UOM)
```

### 5.4 Inventory

```
StorageLocation (hierarchical via parent_id)
 ├── 1──* BinContent
 │         ├── *──? Job
 │         ├── *──? UnitOfMeasure
 │         └── 1──* Reservation
 └── BinMovement (from_location / to_location)

LotRecord ──* Part, ──? Job, ──? ProductionRun, ──? PurchaseOrderLine
SerialNumber ──* Part, ──? Job, ──? StorageLocation (parent/child hierarchy)
```

### 5.5 Quality

```
QcChecklistTemplate ──? Part
 └── 1──* QcChecklistItem

QcInspection ──? Job, ──? ProductionRun, ──? QcChecklistTemplate
 └── 1──* QcInspectionResult ──? QcChecklistItem

NonConformance ──* Part, ──? Job, ──? CorrectiveAction, ──? Customer, ──? Vendor

CorrectiveAction
 └── 1──* CapaTask

SpcCharacteristic ──* Part, ──? Operation
 ├── 1──* SpcMeasurement
 ├── 1──* SpcControlLimit
 └── (SpcOocEvent ──* SpcMeasurement)
```

### 5.6 Training

```
TrainingPath
 ├── 1──* TrainingPathModule ──* TrainingModule
 └── 1──* TrainingPathEnrollment (user enrollment)

TrainingModule
 └── 1──* TrainingProgress (per-user progress)
```

### 5.7 MRP

```
MrpRun
 ├── 1──* MrpDemand ──* Part
 ├── 1──* MrpSupply ──* Part
 ├── 1──* MrpPlannedOrder ──* Part
 │         ├── *──? PurchaseOrder (released)
 │         ├── *──? Job (released)
 │         └── *──? MrpPlannedOrder (parent, hierarchical)
 └── 1──* MrpException ──* Part
```

---

## 6. Conventions

### Naming
- **Tables:** PascalCase entity name -> snake_case table (e.g., `SalesOrderLine` -> `sales_order_lines`)
- **Columns:** PascalCase property name -> snake_case column (e.g., `CustomerId` -> `customer_id`)
- **Primary keys:** Constraint names snake_cased
- **Foreign keys:** Constraint names snake_cased
- **Indexes:** Index names snake_cased

### Global Query Filters
All `BaseAuditableEntity` types have `WHERE deleted_at IS NULL` applied automatically. Use `.IgnoreQueryFilters()` to include soft-deleted records.

### Timestamp Handling
- All `DateTimeOffset` properties map to PostgreSQL `timestamptz`
- `created_at` auto-set on insert (via `IClock.UtcNow`)
- `updated_at` auto-set on insert and every update
- `IClock` abstraction allows testable time (production: `SystemClock`, E2E: `SimulationClock`)

### JSON Columns
Properties ending in `Json` (e.g., `ContentJson`, `FormDefinitionJson`, `CustomFieldValues`, `Metadata`) store JSON text. PostgreSQL JSONB operators available for queries.

### Enum Serialization
All enums serialize as strings via `JsonStringEnumConverter`. Stored as `text` columns in PostgreSQL.

### Polymorphic Patterns
Several entities use `entity_type` (string) + `entity_id` (int) for polymorphic associations:
- `FileAttachment` (files for any entity)
- `ActivityLog` / `StatusEntry` / `EntityNote` / `Notification`
- `BinContent` / `BinMovement` (part, production_run, assembly, tooling)
- `DocumentEmbedding` (AI/RAG chunks for any entity)

### Accounting Integration Fields
Entities that sync with external accounting (QB, Xero, etc.) share a standard pattern:
- `external_id` — ID in the external system
- `external_ref` — Human-readable reference
- `provider` — Integration provider name
- `last_synced_at` — Last sync timestamp (on some entities)

---

## 7. pgvector / AI

The `document_embeddings` table uses the pgvector extension for vector similarity search:

```sql
-- Extension enabled in OnModelCreating
builder.HasPostgresExtension("vector");

-- Column type
embedding vector(384)  -- 384-dimensional (all-MiniLM-L6-v2 model)
```

Used by the Ollama RAG pipeline (`OllamaAiService`) for:
- Smart search across 6 entity types
- Document Q&A
- AI assistant context retrieval

Indexed via `DocumentIndexJob` (Hangfire, 30-min interval) and on-demand via `AiController`.
