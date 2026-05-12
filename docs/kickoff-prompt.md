# Forge — Claude Code Project Initialization

You are helping build **Forge**, an open-source (GNU licensed), locally hosted operational web application for small manufacturers. This is NOT an accounting system — QuickBooks Online handles that. This is the operational layer: job tracking, R&D workflow, file management, production traceability, lead management, planning cycles, and an engineer focus dashboard.

**Nothing company-specific should be committed.** All branding, workflows, track types, and configurations are user-defined. This app must work for any small manufacturer who connects their own QB Online account.

---

## Core Principles

- Plain language everywhere (no accounting jargon in operational views)
- Role-based entry points (engineer sees Kanban, PM sees backlog, worker sees task list)
- All external integrations behind a mockable service layer
- Locally hosted in Docker, no cloud dependency, no SaaS fees — but cloud-deployable without code changes (all config via environment variables, health check endpoints, stateless API)
- Solo-operator friendly — scales gracefully from 1 user to a team
- Avoid data duplication — read/write QB for financial entities, own only what QB can't handle
- In-app guided walkthroughs for training — no external docs required
- Ask before making opinionated architecture decisions

---

## Tech Stack

- **Frontend:** Angular 21 + Angular Material (latest stable, zoneless, Signal Forms)
- **Backend:** .NET 9 Web API (C#)
- **Database:** PostgreSQL + pgvector extension (for AI vector storage) + pg_trgm extension (for fuzzy/typo-tolerant search)
- **File Storage:** MinIO (local S3-compatible object storage)
- **3D Viewer:** Three.js (STL inline rendering, direct wrap in Angular service)
- **Real-time:** SignalR (WebSocket pub-sub for board sync + notifications)
- **Auth:** ASP.NET Identity (JWT bearer tokens, additive roles)
- **QB Integration:** QuickBooks Online REST API (OAuth 2.0)
- **Charts:** ng2-charts (Chart.js wrapper)
- **Dashboard Grid:** gridstack (drag/resize/serialize widget layouts)
- **Guided Tours:** driver.js (zero-dependency, MIT licensed)
- **i18n:** ngx-translate (lazy-loaded locale JSON files, English default + Spanish)
- **Object Mapping:** Mapperly (source-generated, replaces AutoMapper which is now commercial)
- **Background Jobs:** Hangfire + Hangfire.PostgreSql (sync queue, maintenance, backups, notifications)
- **API Docs:** Microsoft.AspNetCore.OpenApi + Scalar (replaces Swashbuckle)
- **Testing:** xUnit + Vitest (Angular 21 default) + Cypress (E2E)
- **Containerization:** Docker Compose (7 containers — 6 core + optional AI)
- **State Management:** Angular Signals (not NgRx), zoneless Angular (no zone.js)
- **AI (optional):** Ollama (self-hosted LLM), pgvector (embeddings), RAG for document Q&A

See `docs/libraries.md` for the complete library reference with all packages and justifications.

---

## Coding Standards

See `docs/coding-standards.md` for the full 37-standard reference. Key rules enforced:

- One object per file (Angular and .NET)
- SCSS only, BEM naming, max 3 levels nesting, no hardcoded colors
- Type suffix in all Angular filenames (`.component.ts`, `.service.ts`, `.pipe.ts`, etc.)
- `shared/` for reusable, `features/` for domain modules (lazy-loaded), `core/` for singleton bootstrap
- No inline templates, no inline styles, no `style="..."` in HTML — all styling via CSS classes
- OnPush change detection everywhere, no function calls in templates — signals and computed signals only
- Services return signals, components never call `.subscribe()`
- RESTful `/api/v1/` endpoints, MediatR CQRS, FluentValidation, thin controllers
- Global error handling (Angular interceptor + .NET middleware with Problem Details)
- Int auto-increment PKs, `snake_case` tables/columns, Fluent API config (no data annotations)
- **Soft delete everywhere** — `deleted_at` (nullable timestamp) + `deleted_by` (FK) on all tables, EF Core global query filter excludes deleted records
- `IOptions<T>` for .NET config, `environment.ts` for Angular — no hardcoded values
- Every feature lazy-loaded, heavy libs (Three.js, driver.js, ng2-charts) loaded on demand
- **WCAG 3 accessibility** — APCA contrast scoring, reduced motion support, axe-core screen reader testing, 44x44px touch targets
- **Light and dark themes** — user-selectable toggle, preference saved per-user, admin sets default. All brand colors in `_variables.scss` — single file change for rebranding.
- **Clean HTML templates** — leverage `ng-content`, `ng-template`, shared layout components for common structural patterns. Semantic HTML, no `div` soup.
- **C# class inheritance** — `BaseEntity`, `BaseHandler`, `BaseCrudController` abstract base classes. Interfaces for all services. Records for DTOs. Composition over deep hierarchies.
- **Static code analysis** — ESLint + Prettier (Angular), .NET Analyzers + StyleCop (.NET), medium scrutiny level, CI blocks on errors
- **CI/CD pipeline** — GitHub Actions: build → unit tests → integration tests → E2E → Docker build → release. PRs require passing CI.
- **Automatic versioning** — version from git tags, injected at build time, `scripts/build.sh` and `scripts/build.bat` for local builds
- SignalR: one hub per domain, optimistic UI, auto-reconnect with backoff
- RESTful routing: all UI states URL-addressable (deep linking), API follows `/api/v1/` resource naming. Key Angular routes include `/calendar` (calendar view — consolidated view of due dates, sprints, maintenance schedules, and expected deliveries).
- **All API endpoints require auth** except login, register, refresh, health, and shop floor display. Role-based and policy-based authorization.
- **Client-side storage** — IndexedDB for lookup data caches (customers, parts, track types), localStorage for tokens and preferences, `AuthInterceptor` handles token appending and silent refresh
- **Print support** — `@media print` stylesheets, printable work orders/packing slips/QC reports/labels, server-side PDF via QuestPDF
- **Pagination** — offset-based for lists (`?page=1&pageSize=25`), cursor-based for feeds (chat, activity, notifications), `PaginatedDataSource<T>` shared class
- **Global loading system** — `LoadingService` with message queue, animated spinner overlay, 300ms fade transitions, independent message dismissal. Component-level `LoadingBlockDirective` for partial blocking.
- **Offline resilience** — service worker caches app shell, IndexedDB serves last-known data, action queue for writes, reconnect-and-drain
- **CSP security headers** — `default-src 'self'`, no inline scripts, `frame-ancestors 'none'`, HSTS in production
- **Multi-tab handling** — auth/theme sync via BroadcastChannel, per-tab SignalR connections, shared IndexedDB cache
- **UX for non-technical users** — large touch targets, icon + text nav labels, no ambiguous patterns, max 2 nav levels, 4px border radius default (no pills except chips), centered content on large screens, minimal margin/padding, industrial aesthetic
- **Disconnection resilience** — persistent banner on connection loss, operations queue in IndexedDB, drain on reconnect with progress, no silent data loss
- **Shared component library** — `AppDataTableComponent` (user-configurable columns, sort, filter, drag, resize, preference persistence per `tableId`), form field wrappers (`AppInputComponent`, `AppSelectComponent`, `AppAutocompleteComponent`, `AppTextareaComponent`, `AppDatepickerComponent`, `AppToggleComponent`), `ConfirmDialogComponent`, `EntityPickerComponent`, `FileUploadZoneComponent`, `StatusBadgeComponent`, `PageLayoutComponent`, `DetailSidePanelComponent`, `AvatarComponent`, `ToolbarComponent`, `DateRangePickerComponent`
- **No inline validation errors** — submit button disables when form is invalid, hover popover lists all violations, live revalidation on field change, final validation gate before action execution
- **Layout rules** — static header/footer, scrollable content area, action buttons lower-right (primary furthest right), compact card headers always visible, no horizontal scrolling (except Kanban/wide tables), dialog sizes standardized (small/medium/large)
- **User preferences** — centralized `user_preferences` table with key-pattern storage, `UserPreferencesService` with debounced server sync, restored on login from any device
- **Shop floor time clock kiosk** — passive scan listener (badge/barcode/NFC), no UI needed to initiate clock-in. Scan while clocked in shows production quick actions. Falls back to app login if no scan hardware configured.
- **Production label printing** — prompt on production task/run creation. Labels include barcode + human-readable info (job number, part/product name, customer name, lot, quantity, "Label X of N" for multi-bin splits). User specifies label count; system auto-divides quantities.
- Cypress E2E tests covering 95% common use cases — runs against full Docker stack with mocks

---

## Naming Convention

| Item | Name |
|---|---|
| .NET Solution | `forge.sln` |
| API Project | `forge.api` |
| Data/EF Layer | `forge.data` |
| Core/Domain | `forge.core` |
| Integrations | `forge.integrations` |
| Tests | `forge.tests` |
| Angular App | `forge-ui` |
| C# Namespaces | `Forge.Api`, `Forge.Data`, `Forge.Core`, etc. |
| Docker Services | `forge-ui`, `forge-api`, `forge`, `forge-storage`, `forge-backup` |
| Postgres DB | `forge` |
| MinIO Buckets | `forge-job-files`, `forge-receipts`, `forge-employee-docs` |

---

## Docker Compose — 7 Containers (AI optional)

```yaml
# Target structure:
services:
  forge-ui:       # Nginx + Angular build, proxies /api to backend
  forge-api:      # .NET 9 Web API
  forge:       # PostgreSQL + pgvector with persistent volume
  forge-storage:  # MinIO with persistent volume
  forge-backup:   # Scheduled pg_dump + rclone to Backblaze B2
  forge-ai:       # Ollama LLM runtime (optional — app works without it)
  # Separate compose for secondary backup target on another machine
```

---

## Authentication & Roles

Use ASP.NET Identity with a custom `ApplicationUser` extending `IdentityUser`.

**Roles are additive (users can hold multiple):**

| Role | Access |
|---|---|
| Engineer | Kanban board, assigned work, files, expenses, daily prompts, time tracking |
| PM | Backlog curation, planning cycles, lead management, reporting, priority setting |
| Production Worker | Simplified task list, start/stop timer, limited card movement, notes/photos |
| Manager | Everything PM + assign work, approve expenses, set priorities for others |
| Office Manager | Customer/vendor management, invoice queue, employee docs |
| Admin | Everything + user management, role assignment, system settings, track type config, QB setup |

**User-level settings:** `canSelfApproveExpenses` (bool), `selfApprovalLimit` (decimal, nullable), notification preferences, default dashboard view.

**First-run:** Seed default roles + default admin account (credentials to console, forced password change).

---

## QuickBooks Online Integration

**Architecture:** QB is the source of truth for financial entities. The app reads/writes via QB Online REST API. No data duplication.

**Lives in QB (read/write via API):** Customers, Vendors, Items, Estimates, Sales Orders, Purchase Orders, Invoices, Payments, Employees, Time Activities.

**Lives in app only:** Kanban state, job card operational fields, files, activity logs, leads, assets, traceability, planning cycles, backlog, custom workflows, user accounts.

**QB identifier storage:** Every entity with a QB counterpart stores `ListID` (or `TxnID`) as the immutable cross-reference key, plus `FullName`/`RefNumber` as human-readable reference.

**Sync queue:** All QB write operations go through a persistent queue table. If QB is unavailable, operations queue and the app works normally. Queue drains when QB reconnects. Retries with backoff. Failed operations surface in system health panel.

**Read cache:** QB data cached in Postgres with `last_synced` timestamp. App reads cache first, background sync refreshes. Stale data is usable — no blank screens.

**Orphan detection:** Background job compares QB lists against stored IDs. Flags missing references in system health panel.

**Mock layer:** `MOCK_INTEGRATIONS=true` environment variable swaps QB HTTP client for local JSON fixture responses.

**Admin Accounting Setup Wizard (in-app):**
1. Provider selection screen — QuickBooks Online is the default and pre-selected. Other providers listed as available options.
2. Provider-specific setup flow:
   - **QuickBooks Online (default):** Instructions with links to Intuit Developer portal, Client ID / Client Secret fields, "Connect to QuickBooks" OAuth 2.0 flow
   - **Other providers:** Each provider defines its own setup steps, auth flow, and credential fields via the provider implementation
3. First sync pulls customers, vendors, items, employees into local cache
4. Confirmation screen showing sync results
5. Connection status always visible in admin settings with disconnect/reconnect/switch provider
6. Token expiry warnings in system health panel — admin re-authenticates when needed
7. **Standalone mode:** admin can skip accounting setup entirely — app operates without financial sync

---

## Database Schema

**Global conventions applied to all mutable tables:**
- `created_at` (timestamp), `updated_at` (timestamp) — set via EF Core `SaveChanges` override
- `deleted_at` (nullable timestamp), `deleted_by` (FK → users, nullable) — soft delete, no hard deletes
- EF Core global query filter: `entity.HasQueryFilter(e => e.DeletedAt == null)`
- Primary keys: `id` (int, auto-increment)
- Table/column names: `snake_case`
- Exception: `audit_log` is immutable (no updated_at, no soft delete)

### Core Tables

**users / ASP.NET Identity tables** — `AspNetUsers`, `AspNetRoles`, `AspNetUserRoles`, etc. Custom `ApplicationUser` with: display_name, default_dashboard_view, can_self_approve_expenses, self_approval_limit, notification_preferences (JSONB), is_active (bool, default true), department (string, nullable), manager_id (FK to AspNetUsers, nullable), badge_id (string, unique, nullable — barcode/NFC/card identifier for shop floor scan).

**user_invitations** — id, user_id (FK to AspNetUsers), setup_code (string, unique, nullable), invite_token (string, unique, nullable — for email invite link), claim_method (string — 'code' / 'email'), expires_at (timestamp), claimed_at (timestamp, nullable), created_by (FK), created_at. One active invitation per unclaimed user.

**system_settings** — key (string PK), value (string), data_type (string), updated_by (FK), updated_at (timestamp). Runtime-configurable operational settings.

**accounting_connection** — id, provider (string — 'quickbooks', 'xero', 'sage', etc.), provider_config (JSONB, encrypted — provider-specific credentials like client_id, client_secret, realm_id), access_token (encrypted), refresh_token (encrypted), token_expiry, last_synced, status. Single active connection at a time.

**accounting_sync_queue** — id, provider (string), entity_type, entity_id, operation (create/update/delete), payload (JSONB), status (pending/processing/failed/completed), attempt_count, error_message, created_at, processed_at.

**shipping_connection** — id, carrier_code (string — 'ups', 'fedex', 'usps', 'dhl', 'easypost'), carrier_config (JSONB, encrypted — API keys, account numbers, OAuth tokens as applicable), ship_from_address (JSONB), is_default (bool), is_active (bool), last_verified (timestamp), status (string — connected/error/unconfigured), created_by (FK), created_at, updated_at. Multiple active carriers allowed simultaneously.

**smtp_settings** — id, host (string), port (int), username (string, encrypted), password (string, encrypted), sender_address (string), sender_name (string), use_tls (bool, default true), is_verified (bool), verified_at (timestamp), updated_by (FK), updated_at. Single row — admin-managed via UI, overrides appsettings.json SMTP values when present.

**reference_data** — id, group_id (FK, nullable — self-referencing for hierarchy), code (string, unique within group), label (string), sort_order (int), is_active (bool, default true), metadata (JSONB, nullable — for group-specific extra fields).

Centralized lookup table for all reference/dropdown data. The `group_id` column enables recursive grouping — top-level rows (group_id = null) define the group, child rows belong to that group.

Example groups and their values:
- **expense_category** → Office Supplies, Tooling, Raw Material, Travel, Shipping, Maintenance, Other
- **return_reason** → Defective, Wrong Part, Damaged in Shipping, Customer Changed Mind
- **lead_source** → Referral, Website, Trade Show, Cold Call, Existing Customer
- **contact_role** → Primary, Technical, Billing, Shipping, Other
- **job_priority** → Low, Medium, High, Critical
- **asset_type** → Machine, Tooling, Facility, Vehicle, Other
- **asset_status** → Active, Down, Retired
- **lead_status** → New, Contacted, Quoting, Converted, Lost
- **part_status** → Draft, Active, Obsolete
- **qc_disposition** → Accept, Reject, Rework, Scrap
- **internal_task_type** → Tooling Development, Process Improvement, Fixture Design, Material Testing, Machine Qualification, Facility Maintenance, Inventory Task, Facility Cleaning, Administrative, Custom
- **shipping_carrier** → UPS, FedEx, USPS, DHL, EasyPost, Manual

Admin can add/rename/reorder/deactivate values per group via admin settings. Deactivated values are hidden from dropdowns but preserved on existing records. Code values are immutable (used in code logic); labels are admin-editable.

### Track Types & Jobs

**track_types** — id, name, color, icon, is_built_in, custom_fields_template (JSONB), created_by, created_at.

**track_stages** — id, track_type_id (FK), name, sort_order, qb_document_type (nullable), color, icon, is_terminal.

**jobs** — id, track_type_id (FK), current_stage_id (FK), title, description, customer_qb_id, asset_id (FK, nullable), assigned_to (FK), priority, due_date, sprint_id (FK, nullable), backlog_position, custom_field_values (JSONB), is_archived, created_by, created_at, updated_at.

**job_subtasks** — id, job_id (FK), description, assigned_to (FK, nullable), is_complete, sort_order.

**job_links** — id, source_job_id (FK), target_job_id (FK), link_type (related_to/blocks/blocked_by/parent/child).

**job_activity_log** — id, job_id (FK), user_id (FK), action, field_changed, old_value, new_value, notes, timestamp.

**job_qb_documents** — id, job_id (FK), qb_document_type, qb_txn_id, qb_ref_number, amount, status, created_at.

### Internal Task Schedules

**internal_task_schedules** — id, name, description, category (FK → reference_data, internal task type), track_type_id (FK — which track to create cards on), recurrence_rule (string — daily/weekly/biweekly/monthly/custom), recurrence_interval (int, nullable — for custom intervals in days), day_of_week (int, nullable — for weekly schedules), default_assignee_id (FK → users, nullable), estimated_duration_minutes (int, nullable), auto_create_mode (planning_day/immediate — when to create the card), is_active (bool), last_generated_at (timestamp, nullable), created_by (FK), created_at.

**internal_task_history** — id, schedule_id (FK → internal_task_schedules), job_id (FK → jobs — the generated card), created_at, completed_at (nullable), completed_by (FK, nullable), duration_minutes (int, nullable).

### Shipments

**shipments** — id, job_id (FK), carrier_provider (string — ups/fedex/usps/dhl/easypost/manual), service_level (string, nullable), ship_from_address (JSONB), ship_to_address (JSONB), total_packages (int), total_weight (decimal, nullable), shipping_cost (decimal, nullable), status (draft/label_created/shipped/delivered/voided), created_by (FK), created_at, shipped_at (nullable), delivered_at (nullable).

**shipment_packages** — id, shipment_id (FK), package_number (int), tracking_number (string, nullable), label_url (string, nullable — MinIO path to label PDF), weight (decimal, nullable), dimensions_length (decimal, nullable), dimensions_width (decimal, nullable), dimensions_height (decimal, nullable).

**shipment_items** — id, shipment_id (FK), package_id (FK → shipment_packages, nullable), part_id (FK, nullable), description, quantity (decimal), bin_location_id (FK → storage_locations, nullable — for pick list).

### Parts / Products / Assemblies

**parts** — id, part_number, description, revision, status (draft/active/obsolete), part_type (part/assembly), material_spec, asset_id (FK, nullable — mold/tool), qb_item_list_id (nullable), traceability_profile_id (FK, nullable), default_location_id (FK → storage_locations, nullable — default bin for storing this part), min_stock_level (decimal, nullable — triggers low-stock alert when on-hand drops below), reorder_quantity (decimal, nullable — suggested reorder amount), auto_reorder_enabled (bool, default false — admin enables per part), auto_reorder_delay_hours (int, default 24 — cancellation window before PO is submitted), preferred_vendor_id (FK, nullable — linked to accounting vendor), preferred_vendor_name (string, nullable — denormalized for display), custom_field_values (JSONB), created_by, created_at, updated_at.

**part_bom** (self-referencing join for recursive BOM) — id, parent_part_id (FK → parts), child_part_id (FK → parts), quantity (decimal), reference_designator (nullable), sort_order, source_type (in_house/purchased — labels admin-configurable via terminology system), notes.

**part_revisions** — id, part_id (FK), revision (string), change_description, status (draft/released/obsolete), changed_by (FK), changed_at.

**part_files** — id, part_id (FK), file_metadata_id (FK), revision (string — which part revision this file belongs to).

### Files

**file_metadata** — id, bucket, object_key, original_filename, mime_type, size_bytes, revision_number, entity_type, entity_id, uploaded_by (FK), uploaded_at, superseded_by (FK, nullable), restricted (bool, default false).

**file_access** — id, file_id (FK), user_id (FK, nullable), role (string, nullable).

### Leads & Contacts

**leads** — id, company_name, source, status, custom_field_values (JSONB), converted_customer_qb_id (nullable), lost_reason, created_by, created_at, updated_at.

**contacts** — id, entity_type (lead/customer), entity_id, name, title, phone, email, role_tag, sort_order, is_primary.

### Customers (cached from QB)

**customer_cache** — qb_list_id (PK), qb_full_name, custom_field_values (JSONB), last_synced.

### Assets & Maintenance

**assets** — id, name, type, location, manufacturer, model, serial_number, status, photo_file_id (FK, nullable), current_hours, notes, created_at.

**maintenance_schedules** — id, asset_id (FK), description, interval_type (days/hours), interval_value, last_completed_at, last_completed_hours, next_due_at, next_due_hours, is_active.

### Bin & Location Tracking

**storage_locations** — id, name, location_type (area/rack/shelf/bin), parent_id (FK, nullable — self-referencing for hierarchy), barcode (string, unique, nullable — only bins get barcodes), description (nullable), sort_order, is_active (bool), created_at.

**bin_contents** — id, location_id (FK → storage_locations), entity_type (part/production_run/assembly/tooling), entity_id, quantity (decimal), lot_number (nullable), job_id (FK, nullable — null for general inventory stock, set when reserved for a specific job), status (stored/reserved/ready_to_ship/qc_hold), placed_by (FK → users), placed_at (timestamp), removed_at (nullable timestamp), removed_by (FK, nullable), notes (nullable).

**bin_movements** — id, entity_type, entity_id, quantity (decimal), lot_number (nullable), from_location_id (FK, nullable — null if initial placement), to_location_id (FK, nullable — null if removed/shipped), moved_by (FK → users), moved_at (timestamp), reason (nullable — e.g., 'pick', 'restock', 'qc_release', 'ship'). Immutable audit trail of all inventory movements.

**inventory_counts** — id, initiated_by (FK), location_scope (nullable — specific location_id, or null for full inventory), status (in_progress/completed/cancelled), started_at, completed_at, notes.

**inventory_count_items** — id, count_id (FK → inventory_counts), location_id (FK), part_id (FK), expected_quantity (decimal), actual_quantity (decimal, nullable — null until counted), discrepancy (decimal, computed), reviewed_by (FK, nullable), adjustment_synced (bool, default false).

### Purchase Orders & Receiving

**purchase_orders** — id, po_number (string, unique, auto-generated), vendor_id (FK, nullable — linked via accounting sync), vendor_name (string — denormalized for display), job_id (FK, nullable — null for general stock POs), status (string — 'draft'/'submitted'/'acknowledged'/'partially_received'/'received'/'closed'/'cancelled'), expected_delivery_date (date, nullable), notes (text, nullable), cancellation_reason (text, nullable), accounting_po_id (string, nullable — external ID from accounting system), created_by (FK), created_at, updated_at.

**purchase_order_lines** — id, purchase_order_id (FK), part_id (FK), description (string), quantity_ordered (decimal), quantity_received (decimal, default 0), unit_cost (decimal, nullable), line_notes (string, nullable), sort_order (int).

**receiving_records** — id, purchase_order_id (FK, nullable — null for standalone receives), purchase_order_line_id (FK, nullable), part_id (FK), quantity_received (decimal), bin_location_id (FK), lot_number (string, nullable), received_by (FK), received_at (timestamp), notes (text, nullable).

### Planning Cycles

**sprints** — id, sprint_number, start_date, end_date, goals (text, nullable), status (planning/active/completed).

### Time Tracking & Clock Events

**time_entries** — id, job_id (FK), user_id (FK), date, duration_minutes, category, notes, timer_start, timer_stop, is_manual, is_locked, accounting_time_activity_id (nullable), created_at.

**clock_events** — id, user_id (FK), event_type (clock_in/clock_out), reason (nullable — 'end_of_shift', 'break', 'lunch'; null for clock_in), scan_method (barcode/nfc/badge/app_login), timestamp, source (kiosk/app). Tracks worker clock-in/out events from the shop floor kiosk or the app.

**user_scan_identifiers** — id, user_id (FK), identifier_type (barcode/nfc/badge), identifier_value (string), is_active (bool). Maps scan hardware IDs to user accounts. Admin assigns these when setting up employee badges. A user can have multiple active identifiers (e.g., badge + barcode).

### Expenses

**expenses** — id, user_id (FK), job_id (FK, nullable), amount, category, description, receipt_file_id (FK, nullable), status (pending/approved/rejected/self_approved), approved_by (FK, nullable), approval_notes, qb_expense_id (nullable), created_at.

### Traceability

**traceability_profiles** — id, name, config (JSONB), is_default.

**production_runs** — id, job_id (FK), lot_number, material_lot, machine_asset_id (FK), operator_id (FK), run_date, quantity_produced, quantity_rejected, process_parameters (JSONB), notes, created_at.

**production_labels** — id, label_code (string, unique — e.g., 'LBL-00042-003'), production_run_id (FK), split_index (int — 1-based position in multi-label set), total_labels (int — N in "X of N"), quantity (decimal — qty for this specific label/bin), printed_at (nullable timestamp), printed_by (FK, nullable). One barcode per label — resolves to full run context.

**qc_checklists** — id, name, items (JSONB). Template definitions.

**qc_records** — id, production_run_id (FK), checklist_id (FK, nullable), results (JSONB), disposition (accept/reject/rework/scrap), inspector_id (FK), inspected_at, notes.

### Dashboard

**user_dashboard_layouts** — id, user_id (FK), layout (JSONB — array of widget configs: widget_key, position, size, settings), updated_at. Role-based defaults applied on first login; user customizes from there.

### Notifications (unified — includes user-authored messages)

**notifications** — id, author_id (FK, nullable — null for system-generated), user_id (FK, nullable — null means "everyone"), visibility (everyone/user/self), type (string — message/assignment/due_date/expense_status/overdue/maintenance_due/sync_alert/sprint_reminder/time_missing/lead_followup), severity (info/warning/critical, default info), title (nullable), message (text), entity_type (nullable), entity_id (nullable), is_pinned (bool, default false), is_read (bool, default false), is_dismissed (bool, default false), dismissable (bool, default true), source (user/system), created_at.

### Audit

**audit_log** — id, user_id (FK), entity_type, entity_id, action (create/update/delete), field_changed, old_value, new_value, timestamp. Immutable.

### Returns

**customer_returns** — id, job_id (FK), reason, quantity, notes, photo_file_id (FK, nullable), rework_job_id (FK, nullable), reported_by (FK), created_at.

### Terminology

**terminology** — id, key (string — internal code reference, never changes), locale (string — 'en', 'es', 'custom', etc.), label (string). Composite unique on (key, locale). Admin custom labels stored with locale='custom' and override everything. Angular `terminology` pipe resolves: admin custom → user locale → system default → English fallback.

**User language:** `preferred_locale` field on `ApplicationUser`. Set during registration, editable in profile. Login/registration screens available in all installed languages. Language packs as JSON files: `/assets/i18n/en.json`, `/assets/i18n/es.json`. Uses `ngx-translate` for Angular i18n.

### Chat

**chat_channels** — id, name (nullable — null for 1:1 DMs), type (direct/group), created_by (FK), created_at.

**chat_members** — id, channel_id (FK), user_id (FK), joined_at, last_read_at (timestamp — for unread tracking).

**chat_messages** — id, channel_id (FK), sender_id (FK), content (text), file_id (FK, nullable — for file/image attachments), entity_type (nullable), entity_id (nullable — for "Share to chat" links), created_at, edited_at (nullable).

### Guided Tours

**tour_completions** — id, user_id (FK), tour_key (string), completed_at. Tracks which walkthroughs each user has finished.

### User Preferences

**user_preferences** — id, user_id (FK), preference_key (string), preference_value (JSONB), updated_at. Composite unique on (user_id, preference_key). Stores all per-user UI settings: table column configs, theme mode, sidebar state, dashboard layout, notification preferences, default view selections. Key patterns: `table:{tableId}`, `theme:mode`, `sidebar:collapsed`, `dashboard:layout`, `locale:language`, `notify:{type}`, `default:{area}`. API: `GET /api/v1/user-preferences`, `PATCH /api/v1/user-preferences`, `DELETE /api/v1/user-preferences/{key}`.

---

## Integration Service Layer

Create `/src/integrations/` (or `forge.integrations` project) with interfaces + real + mock implementations:

```
forge.integrations/
  Accounting/
    IAccountingService.cs      — common interface for all accounting operations
    AccountingServiceFactory.cs — resolves the active provider from system_settings
    Providers/
      QuickBooks/
        QuickBooksAccountingService.cs  — QB Online REST API implementation
        QuickBooksAuthService.cs        — OAuth 2.0 flow for QB
        QuickBooksMapper.cs             — maps QB DTOs to/from common models
        Models/                         — QB-specific request/response DTOs
        Fixtures/                       — QB mock JSON data
      Xero/                            — future: same structure
      Sage/                            — future: same structure
    Mock/
      MockAccountingService.cs          — returns JSON fixture data for any provider
    Models/                             — common accounting DTOs (Customer, Invoice, Estimate, PurchaseOrder, Payment, TimeActivity, Employee, Vendor, Item)
  Email/
    IEmailService.cs
    SmtpEmailService.cs
    MockEmailService.cs        — logs to console
  Storage/
    IStorageService.cs
    MinioStorageService.cs
    MockStorageService.cs      — local filesystem fallback
  Backup/
    IBackupService.cs
    B2BackupService.cs
    LocalBackupService.cs
  AI/
    IAiService.cs              — interface for all AI operations
    OllamaAiService.cs         — real Ollama REST API implementation
    MockAiService.cs           — returns canned responses
    Models/                    — AI request/response DTOs
    Fixtures/                  — mock AI response data
```

**Pluggable accounting integration:**
- `IAccountingService` defines common operations: sync customers, create/read invoices, create/read estimates, create POs, record payments, sync time activities, sync employees, sync vendors, sync items
- QuickBooks Online is the default (and first) provider implementation
- Additional providers (Xero, FreshBooks, Sage, etc.) implement the same interface
- `AccountingServiceFactory` reads `accountingProvider` from `system_settings` and resolves the correct implementation via DI
- The app works in **standalone mode** with no accounting provider configured — all accounting features degrade gracefully (no sync, no financial document creation, local-only operation)
- Each provider has its own auth flow, API client, and DTO mapping — but the rest of the app only sees `IAccountingService`

Use dependency injection to swap mock/real based on `MOCK_INTEGRATIONS` environment variable.

**AI service capabilities (all optional, graceful degradation):**
- Smart search: natural language to structured query translation
- Job description drafting from part + customer + specs
- QC anomaly detection from production run data patterns
- Maintenance prediction from machine hours and downtime history
- Document Q&A via RAG (index specs, SOPs, drawings into pgvector)
- Notification summarization (morning brief)
- Expense auto-categorization

**RAG pipeline:** pgvector extension on existing Postgres instance stores embeddings. Hangfire background job re-indexes on data changes. Embedding model (nomic-embed-text) and LLM (Llama 3.3 / Mistral / Qwen3) run via Ollama. Manufacturing base knowledge from open-source training data, augmented with local production data.

---

## In-App Guided Training System

Built-in walkthrough system to reduce training burden. No external documentation required.

**Components:**
- Tour definitions stored as JSON (easy to update without code changes)
- driver.js library (zero-dependency, MIT licensed) for step-by-step overlays
- `tour_completions` table tracks per-user progress
- Admin training dashboard shows which users completed which tours

**Tour types:**
- **First-login tour** — highlights nav, search, board, card detail. Role-aware content.
- **Per-feature tours** — triggered on first access (planning cycles, expense submission, etc.). 3-5 step tooltip sequences.
- **Role-based tours** — different content for Engineer vs. Production Worker vs. Admin.
- **Help icon on every page** — persistent (?) icon always visible on every screen. Replays the tour for the current screen on demand. Not limited to first visit — always accessible.
- **Help mode toggle** — overlays contextual help icons on all interactive elements. Click for explanation.

**Tour coverage audit (developer tooling):**
- **Build-time test:** A unit test scans all routable components and fails if any route is missing a registered tour definition. CI enforces this — no screen ships without a tour.
- **Runtime sync check:** When `DEV_MODE=true`, an overlay highlights: (1) DOM elements referenced by tours that no longer exist (stale tour step), and (2) interactive elements with no tour reference (uncovered). Ensures tours stay in sync as the UI evolves.
- Tour definitions are JSON — every route must have a corresponding tour JSON entry.

---

## Phase 1 Scope (Start Here)

Build the foundation:

1. **Docker Compose** — all 6 containers running with `docker compose up`
2. **Database** — EF Core migrations, full schema, seed data (roles, default track types/stages, default admin)
3. **Auth** — ASP.NET Identity, JWT, login/logout, role-based authorization
4. **Kanban board** — Production + R&D + Maintenance + Other tracks
5. **Job card CRUD** — universal fields, custom fields (JSON), activity log
6. **File attachments** — upload to MinIO, versioned by revision, metadata in Postgres
7. **STL viewer** — Three.js Angular component, lazy-loaded
8. **Basic customer list** — read from accounting cache (mocked initially)
9. **Mock integration layer** — accounting mock service with JSON fixtures
10. **Admin settings** — system_settings CRUD, accounting setup wizard (UI ready, mocked backend)
11. **First-login guided tour** — basic walkthrough of the Kanban board

**Do NOT build in Phase 1:** Planning cycles, leads, traceability, time tracking, expenses, invoicing, reporting, notifications, shop floor display, backup.

---

## Settings Architecture

**appsettings.json** (infrastructure, changes at deployment):
- ConnectionStrings (Postgres, MinIO)
- JWT signing key, token expiration
- SMTP configuration (host, port, credentials)
- `MOCK_INTEGRATIONS` flag
- CORS origins
- Logging levels

**system_settings DB table** (operational, changed at runtime by Admin):
- `maxFileUploadSizeMb` (null = unlimited)
- `storageWarningThresholdGb` (null = disabled)
- `invoiceWorkflow` ("direct" / "managed")
- `sprintDurationDays` (default 14)
- `planningDayEnabled` (default true)
- `autoArchiveDays` (default 30)
- Nudge timing thresholds
- Default role for new users
- Backup schedule and retention
- `accountingProvider` (string — 'quickbooks', 'xero', 'sage', or null for standalone)
- `themePrimaryColor`, `themeAccentColor`, `themeWarnColor` (hex strings)
- `appName` (string), `appLogoFileId` (FK to file_metadata, nullable)
- `defaultThemeMode` ("light" / "dark")

---

## Convention: TODO Tags

- `// TODO:` — normal development task
- `// TODO: [ANALYSIS]` — business decision pending, needs stakeholder input. Also show as a UI banner on affected screens.
- Search for `[ANALYSIS]` to find all pending business decisions.

Current `[ANALYSIS]` items:
- Employee document storage — may be redundant with QB
- Scheduled email report delivery
- FDA 21 CFR Part 11 electronic signature compliance

---

## Key Architectural Decisions Already Made

- **Pluggable accounting integration** — `IAccountingService` interface with QuickBooks Online as the default provider. Additional providers (Xero, Sage, etc.) can be added by implementing the same interface. App works in standalone mode with no provider.
- **No data duplication** — the accounting system is source of truth for financial entities
- **Accounting sync queue** — all writes queued, app works when the accounting system is down
- **JSON custom fields** — no dynamic schema, JSONB columns with templates
- **Additive roles** — users hold multiple roles, permissions are the union
- **Traceability profiles** — FDA-capable data model, low-friction defaults
- **Planning cycle-based work planning** — 2-week cycles with Planning Day curation
- **Leads in app, customers in QB** — leads convert to QB customers on demand
- **Self-approval permissions** — per-user flag + dollar threshold for expenses
- **Direct/managed invoice mode** — system setting for solo vs. team operation
- **Unified notification system** — one bell, one table. User-authored messages + system-generated alerts. Dismissable/non-dismissable per type. Non-dismissable includes system health AND production/task status (QC failed, job blocked, overdue, pending approvals). Inline reply, link to source entity, pin to top.
- **Dashboard** — role-based default widget layouts, per-user customizable (rearrange, add, remove, resize), saved as JSON per user
- **Shop floor display** — dedicated read-only route, no auth, kiosk mode
- **In-app guided tours** — role-based walkthroughs, per-user completion tracking, build-time coverage audit
- **Recursive part/assembly catalog** — parts own CAD files, BOM nested to nth tier, linked to QB Items, make/buy tracking on BOM entries
- **Global search** — Postgres full-text across all entities including parts (part number, description, material, BOM), jobs, customers, leads, files, assets, contacts, expenses. Uses `tsvector` columns with GIN indexes for exact/stemmed matching, plus `pg_trgm` extension with GiST/GIN trigram indexes for fuzzy/typo-tolerant matching
- **Admin-configurable terminology + i18n** — all user-facing labels go through a terminology pipe with locale support, admin can relabel any term, per-user language preference set at registration, English + Spanish ship by default, community can add more
- **R&D → Part lifecycle** — R&D cards produce/update parts, part becomes Active on handoff to production, revision history feeds from R&D iterations
- **Self-hosted AI (optional)** — Ollama in Docker, pgvector for embeddings, RAG pipeline for document Q&A, manufacturing-specific training from open-source data + local production data. Graceful degradation when AI unavailable.
- **Soft delete everywhere** — `deleted_at` + `deleted_by` on all mutable tables, EF Core global query filter
- **Admin-controlled theming** — 3 brand colors (primary/accent/warn) configurable in admin UI at runtime, contrast validation warns before saving inaccessible colors, light/dark mode user-selectable
- **WCAG 3 accessibility target** — APCA contrast scoring, reduced motion, axe-core E2E testing
- **CI/CD via GitHub Actions** — build, lint, unit tests, integration tests, E2E, Docker build, release. PRs require passing CI.
- **Automatic versioning** — semantic version from git tags, `scripts/build.sh` and `scripts/build.bat` for local builds
- **Bespoke chat system** — 1:1 DMs + group channels built on existing SignalR, all data stays local, file sharing via MinIO, @mentions trigger notifications
- **Hangfire for background jobs** — QB sync queue processing, maintenance schedule checks, backup jobs, notification generation, orphan detection, AI embedding indexing

Start by scaffolding the Docker Compose and project structure, then implement the database schema with EF Core migrations, then build the Kanban board UI. Ask me before making any opinionated architecture decisions.
