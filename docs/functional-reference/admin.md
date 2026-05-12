# Admin Panel -- Functional Reference

## Overview

The Admin Panel is the centralized configuration hub for Forge. It provides system-wide management of users, production track types, reference data, terminology, company settings, integrations, training, AI assistants, compliance, sales tax, audit logging, time corrections, events, EDI, and MFA policy enforcement.

Access is role-gated. Admin users see all 16 tabs. Managers see a subset (Training, Time Corrections, Events, Compliance). Non-admin/non-manager users see only the Compliance tab for their own employee compliance status.

---

## Routes

| Property | Value |
|----------|-------|
| Path | `/admin/:tab` |
| Component | `AdminComponent` |
| Route file | `features/admin/admin.routes.ts` |
| Lazy loaded | Yes, via `loadChildren` in `app.routes.ts` |
| Default redirect | `/admin` redirects to `/admin/users` (Admin) or `/admin/compliance` (non-Admin) |
| Guards | `authGuard` (inherited from parent layout route) |
| Access | All authenticated users (tab-level role checks within the component) |

### Valid Tab Slugs

| Tab Slug | Label | Admin Only | Manager + Admin |
|----------|-------|:----------:|:---------------:|
| `users` | Users | Yes | -- |
| `track-types` | Track Types | Yes | -- |
| `reference-data` | Reference Data | Yes | -- |
| `terminology` | Terminology | Yes | -- |
| `settings` | System Settings | Yes | -- |
| `integrations` | Integrations | Yes | -- |
| `ai-assistants` | AI Assistants | Yes | -- |
| `teams` | Teams & Kiosks | Yes | -- |
| `sales-tax` | Sales Tax | Yes | -- |
| `audit-log` | Audit Log | Yes | -- |
| `edi` | EDI | Yes | -- |
| `mfa` | MFA Policy | Yes | -- |
| `training` | Training | -- | Yes |
| `time-corrections` | Time Corrections | -- | Yes |
| `events` | Events | -- | Yes |
| `compliance` | Compliance | -- | -- (all roles) |

If the URL contains an invalid tab slug or a tab the user lacks permission for, the component falls back to the user's default tab.

---

## Component File Structure

| File | Purpose |
|------|---------|
| `admin.component.ts` | Main smart component; tab routing, data loading, user/track type CRUD |
| `admin.component.html` | Template with conditional `@if` blocks per tab |
| `admin.component.scss` | Admin-specific layout, accordion, settings grid |
| `admin.routes.ts` | Route config with `:tab` param |
| `services/admin.service.ts` | HTTP service for all admin API calls |

### Sub-Panel Components

| Component | File Path | Tab |
|-----------|-----------|-----|
| `IntegrationsPanelComponent` | `components/integrations-panel/` | integrations |
| `TrainingPanelComponent` | `components/training-panel/` | training |
| `AiAssistantsPanelComponent` | `components/ai-assistants-panel/` | ai-assistants |
| `TeamsPanelComponent` | `components/teams-panel/` | teams |
| `SalesTaxPanelComponent` | `components/sales-tax-panel/` | sales-tax |
| `AuditLogPanelComponent` | `components/audit-log-panel/` | audit-log |
| `TimeCorrectionsPanelComponent` | `components/time-corrections-panel/` | time-corrections |
| `EventsPanelComponent` | `components/events-panel/` | events |
| `EdiPanelComponent` | `components/edi-panel/` | edi |
| `MfaPolicyPanelComponent` | `components/mfa-policy-panel/` | mfa |
| `ComplianceTemplatesPanelComponent` | `components/compliance-templates-panel/` | compliance |
| `UserCompliancePanelComponent` | `components/user-compliance-panel/` | compliance |

### Dialog Components

| Component | File Path | Used By |
|-----------|-----------|---------|
| `TrackTypeDialogComponent` | `components/track-type-dialog.component.ts` | Track Types tab |
| `CompanyLocationDialogComponent` | `components/company-location-dialog/` | Settings tab |
| `AiAssistantDialogComponent` | `components/ai-assistant-dialog/` | AI Assistants tab |
| `ComplianceTemplateDialogComponent` | `components/compliance-template-dialog/` | Compliance tab |
| `CompleteI9DialogComponent` | `components/complete-i9-dialog/` | Compliance tab |
| `SalesTaxDialogComponent` | `components/sales-tax-dialog/` | Sales Tax tab |
| `StateWithholdingDialogComponent` | `components/state-withholding-dialog/` | Settings tab |
| `IntegrationConfigDialogComponent` | `components/integration-config-dialog/` | Integrations tab |
| `TrainingModuleDialogComponent` | `components/training-panel/training-module-dialog.component.ts` | Training tab |
| `TrainingPathDialogComponent` | `components/training-panel/training-path-dialog.component.ts` | Training tab |
| `TrainingDetailDialogComponent` | `components/training-detail-dialog/` | Training tab |
| `WalkthroughPreviewDialogComponent` | `components/training-panel/walkthrough-preview-dialog.component.ts` | Training tab |

---

## Users Tab (`/admin/users`)

### User List

Displays all users in a `DataTableComponent` (tableId: `admin-users`).

**Columns:**

| Column | Field | Type | Sortable | Filterable | Width |
|--------|-------|------|:--------:|:----------:|-------|
| Avatar | `avatar` | Custom template | -- | -- | 36px |
| Name | `name` | Custom (`Last, First`) | Yes | -- | -- |
| Email | `email` | Custom (muted text) | Yes | -- | -- |
| Role | `role` | Custom (chip) | Yes | Yes (enum) | -- |
| Location | `workLocationName` | Text | Yes | Yes (text) | 150px |
| Compliance | `compliance` | Custom (chip with count) | Yes | -- | 130px |
| Status | `status` | Custom (dot + text or "Pending Setup") | Yes | -- | -- |
| Actions | `actions` | Custom (icon buttons) | -- | -- | 140px |

**Action buttons per row:**
- **RFID badge** (icon: `contactless`) -- shown when user has RFID identifier assigned
- **Barcode badge** (icon: `qr_code_scanner`) -- shown when user has barcode identifier assigned
- **Get Setup Code** (icon: `vpn_key`) -- shown only for users without a password; generates setup token and opens edit dialog
- **Edit** (icon: `edit`) -- opens the user edit dialog
- **Activate/Deactivate** (icon: `person`/`person_off`) -- toggles user active status

**Compliance column behavior:**
- Green chip with check icon when `canBeAssignedJobs` is true (all required items complete)
- Red chip with warning icon when `canBeAssignedJobs` is false; tooltip shows missing items

### Create User Dialog

Opened via the "Add User" button. Uses the shared `DialogComponent` (width: 520px).

**Form fields:**

| Field | Control | Validators | Required |
|-------|---------|-----------|:--------:|
| First Name | `app-input` | `required`, `maxLength(100)` | Yes |
| Last Name | `app-input` | `required`, `maxLength(100)` | Yes |
| Email | `app-input` (type: email) | `required`, `email`, `maxLength(256)` | Yes |
| Initials | `app-input` | `maxLength(3)` | -- |
| Role | `app-select` | `required` | Yes |
| Avatar Color | Color picker (10 preset swatches) | -- | -- |

**Behavior:**
- On save, calls `POST /api/v1/admin/users` which returns a `CreateUserResponse` including `setupToken` and `setupTokenExpiresAt`.
- The setup token is displayed in a banner within the dialog after creation. The admin copies this token and shares it with the new employee.
- Email field is only shown during creation, not when editing.

### Edit User Dialog

Same dialog as create, with additional sections when editing:

**Additional fields (edit only):**

| Field | Control | Notes |
|-------|---------|-------|
| Work Location | `app-select` | Shown only when multiple company locations exist. Options include "-- Default --" plus all active locations. |
| Active toggle | `app-toggle` | Activates/deactivates the user |

**Scan Identifiers section (edit only):**
- Lists existing scan identifiers (RFID, NFC, barcode, biometric) with type label, value, and delete button
- RFID reader integration via `WebHidRfidService`: connect/disconnect button, auto-detect tapped cards
- RFID Relay Client setup section with download link for the relay setup script
- Add form: type select (RFID Card, NFC Tag, Barcode, Biometric) + value input + Add button
- Keyboard-wedge barcode scanner auto-fills the value field when a scan is detected

**Employee Barcode section (edit only):**
- `BarcodeInfoComponent` showing the user's generated barcode from the central barcode table

**Setup Token banner:**
- Shown when user has no password and admin generates a setup code
- Displays the token, expiration date, and a copy button
- "Account Not Set Up" banner shown for passwordless users when no active token exists, with a "Get Setup Code" button

### Setup Token Generation

Admin can generate setup tokens for users who have not completed account setup:

1. Admin clicks "Get Setup Code" (vpn_key icon) on the user row or within the edit dialog
2. Calls `POST /api/v1/admin/users/{id}/setup-token`
3. Returns `{ token, expiresAt }`
4. Token displayed in the dialog with copy-to-clipboard action
5. Employee uses this token at the `/setup/{token}` route to set their password

---

## Roles and Permissions

Roles are loaded from the API via `GET /api/v1/admin/roles` (accessible to Admin and Manager roles).

### Role Definitions

| Role | Access Level |
|------|-------------|
| Engineer | Kanban board, assigned work, files, expenses, time tracking |
| PM | Backlog, planning, leads, reporting, priority (read-only board) |
| Production Worker | Simple task list, start/stop timer, move cards, notes/photos |
| Manager | Everything PM + assign work, approve expenses, set priorities |
| Office Manager | Customer/vendor management, invoice queue, employee documents |
| Admin | Full system access including user management, roles, settings, track types |

Roles are additive -- a user has one primary role that determines their permissions.

---

## Track Types Tab (`/admin/track-types`)

### Track Type List

Displayed as an accordion list. Each track type shows:
- Track type name + code
- Default badge (if applicable)
- Stage count
- Edit and Delete action buttons (delete disabled for default track type)

**Expanded view** shows a nested table of stages with columns:

| Column | Description |
|--------|-------------|
| Order | `sortOrder` integer |
| Stage | Stage name with colored left border |
| Code | Stage code (muted text) |
| Color | Color swatch + hex value |
| WIP Limit | WIP limit number or em dash |
| Document Type | Accounting document type or em dash |
| Irreversible | Lock icon if true, em dash if false |

### Track Type Dialog

Opens for create or edit. Uses the shared `DialogComponent` (width: 680px). Supports draft recovery via `DraftService`.

**Form fields:**

| Field | Control | Notes |
|-------|---------|-------|
| Name | `app-input` | Required |
| Code | `app-input` | Auto-generated suggestion, manually editable |
| Description | `app-input` | Optional |

**Stages section:**
- Add Stage button creates a new stage row
- Each stage row has:
  - Up/Down arrows for reordering
  - Color picker (native `input[type=color]`)
  - Name input (text)
  - Code input (text)
  - WIP Limit input (number)
  - Irreversible checkbox (lock icon)
  - Remove button (X icon)
- At least one stage is required to save

**API calls:**
- Create: `POST /api/v1/admin/track-types`
- Update: `PUT /api/v1/admin/track-types/{id}`
- Delete: `DELETE /api/v1/admin/track-types/{id}` (confirmation dialog, disallowed for default)

---

## Reference Data Tab (`/admin/reference-data`)

### Reference Data Groups

Displayed as an accordion list grouped by `groupCode`. Each group header shows the formatted group name and entry count.

**Expanded view** shows a nested table:

| Column | Description |
|--------|-------------|
| Order | `sortOrder` integer |
| Code | Immutable code (muted text) |
| Label | Admin-editable label |
| Effective From | Date or em dash |
| Effective To | Date or em dash |
| Status | Active/Inactive dot indicator |

**API calls:**
- List: `GET /api/v1/admin/reference-data`
- Create: `POST /api/v1/admin/reference-data`
- Update: `PUT /api/v1/admin/reference-data/{id}`
- Delete: `DELETE /api/v1/admin/reference-data/{id}`

---

## Terminology Tab (`/admin/terminology`)

Displays a table of all configurable terminology entries with three columns:

| Column | Description |
|--------|-------------|
| Key | The terminology key (e.g., `entity_job`) |
| Default Label | The system default label |
| Custom Label | Editable text input for admin override |

Changes are tracked in a local `Map<string, string>`. The "Save Changes" button is enabled only when changes exist.

**API calls:**
- List: `GET /api/v1/terminology`
- Update: `PUT /api/v1/terminology` (bulk update all entries)

After saving, the `TerminologyService` is refreshed so labels update across the application immediately.

---

## System Settings Tab (`/admin/settings`)

This tab contains four sections: Company Profile, Company Locations, Pay Period Locking, and System Settings.

### Company Profile Section

**Form fields:**

| Field | Control | Validators |
|-------|---------|-----------|
| Company Name | `app-input` | -- |
| Phone | `app-input` (mask: phone) | -- |
| Email | `app-input` (type: email) | `email` |
| EIN | `app-input` (placeholder: XX-XXXXXXX) | -- |
| Website | `app-input` (placeholder: https://) | -- |

**API calls:**
- Load: `GET /api/v1/admin/company-profile`
- Save: `PATCH /api/v1/admin/company-profile`

### Company Locations Section

Displays locations in a `DataTableComponent` (tableId: `admin-locations`).

**Columns:**

| Column | Field | Width |
|--------|-------|-------|
| Name | `name` | -- |
| Address | `address` (custom: line1, line2, city) | -- |
| State | `state` | 80px |
| Phone | `phone` | 140px |
| Default | `default` (chip if default) | 80px |
| Actions | `actions` | 120px |

**Actions per row:**
- Set as Default (star icon) -- not shown for current default
- Edit (edit icon) -- opens `CompanyLocationDialogComponent`
- Delete (delete icon) -- not shown for default location

#### Company Location Dialog

Width: 520px. Supports draft recovery.

**Form fields:**

| Field | Control | Validators | Required |
|-------|---------|-----------|:--------:|
| Location Name | `app-input` | `required`, `maxLength(100)` | Yes |
| Phone | `app-input` (mask: phone) | -- | -- |
| Address | `app-address-form` (US fixed, compact) | -- | -- |
| Active | `app-toggle` (edit only) | -- | -- |

**API calls:**
- Create: `POST /api/v1/company-locations`
- Update: `PUT /api/v1/company-locations/{id}`
- Delete: `DELETE /api/v1/company-locations/{id}`
- Set Default: `POST /api/v1/company-locations/{id}/set-default`

### Pay Period Locking Section

| Field | Control | Description |
|-------|---------|-------------|
| Lock entries through | `app-datepicker` | Selects the lock-through date |
| Lock Period button | `action-btn` | Locks all time entries through the selected date |

Calls `POST /api/v1/time-tracking/lock-period`. Shows a confirmation dialog before executing. Returns `{ lockedCount }`.

### System Settings Section

Displays a grid of configurable settings, each with a label, description, and control.

**Defined settings:**

| Key | Label | Type |
|-----|-------|------|
| `app.name` | Application Name | text |
| `app.company_name` | Company Name | text |
| `planning.cycle_duration_days` | Planning Cycle (Days) | number |
| `planning.nudge_hour` | Daily Nudge Hour (24h) | number |
| `files.max_upload_size_mb` | Max Upload Size (MB) | number |
| `jobs.default_priority` | Default Job Priority | text |
| `jobs.auto_archive_days` | Auto-Archive After (Days) | number |
| `notifications.email_enabled` | Email Notifications | boolean (Enabled/Disabled select) |
| `theme.primary_color` | Primary Brand Color | text (hex) |
| `theme.accent_color` | Accent Brand Color | text (hex) |

### Logo Upload Section

- Preview of current logo (if uploaded)
- Remove button (delete icon) to clear current logo
- Upload button (file input, accepts `image/*`)
- 5MB size limit enforced server-side

**API calls:**
- Upload: `POST /api/v1/admin/logo` (multipart form data, 5MB limit)
- Delete: `DELETE /api/v1/admin/logo`
- Get: `GET /api/v1/admin/logo` (public, no auth required)

---

## Integrations Tab (`/admin/integrations`)

Delegated to `IntegrationsPanelComponent`. Displays configured integration providers with status, connection settings, and test connectivity buttons.

**API calls:**
- List: `GET /api/v1/admin/integrations`
- Update: `PUT /api/v1/admin/integrations/{provider}`
- Test: `POST /api/v1/admin/integrations/{provider}/test`

---

## Training Tab (`/admin/training`)

Delegated to `TrainingPanelComponent`. Contains three sub-tabs: Content, Paths, and User Progress.

### Content Sub-Tab

Displays training modules in a `DataTableComponent` (tableId: `admin-training-modules`). Shows module name, content type (Article, Video, Walkthrough, QuickRef, Quiz), published status, and action buttons (edit, preview, delete).

Search filter for module names. "New Module" button opens `TrainingModuleDialogComponent`.

### Paths Sub-Tab

Displays learning paths with module assignments. "New Path" button opens `TrainingPathDialogComponent`.

### User Progress Sub-Tab

Displays a training dashboard (`TrainingDashboardComponent`) with per-user progress tracking. Clicking a user opens `UserTrainingDetailPanelComponent` for drill-down into individual module completion status.

---

## AI Assistants Tab (`/admin/ai-assistants`)

Delegated to `AiAssistantsPanelComponent`. Displays all AI assistants in a `DataTableComponent` (tableId: `admin-ai-assistants`).

**Columns:**

| Column | Description |
|--------|-------------|
| Icon | Material icon with assistant color |
| Name | Assistant name + "Built-in" chip if applicable |
| Category | Category chip (e.g., HR, Procurement, Sales) |
| Entity Types | Count of allowed entity types or "All" |
| Status | Active/Inactive dot indicator |
| Actions | Edit button; Delete button (hidden for built-in assistants) |

Clicking a row opens `AiAssistantDialogComponent` for editing. Built-in assistants can be edited but not deleted.

---

## Teams & Kiosks Tab (`/admin/teams`)

Delegated to `TeamsPanelComponent`. Manages shop floor teams and kiosk terminal assignments.

**API calls (via `AdminService`):**
- Teams: `GET/POST/PUT/DELETE /api/v1/display/shop-floor/teams`
- Team Members: `GET/PUT /api/v1/display/shop-floor/teams/{id}/members`
- Kiosk Terminals: `GET /api/v1/display/shop-floor/terminals`

---

## Sales Tax Tab (`/admin/sales-tax`)

Delegated to `SalesTaxPanelComponent`. Manages per-state/jurisdiction sales tax rates.

**API calls:**
- List: `GET /api/v1/sales-tax-rates`
- Create: `POST /api/v1/sales-tax-rates`
- Update: `PUT /api/v1/sales-tax-rates/{id}`
- Delete: `DELETE /api/v1/sales-tax-rates/{id}`

---

## Audit Log Tab (`/admin/audit-log`)

Delegated to `AuditLogPanelComponent`. Displays a paginated, filterable log of all system actions.

**Filters:**

| Filter | Control | Description |
|--------|---------|-------------|
| Entity Type | `app-select` | Filter by entity type |
| Action | `app-input` | Filter by action name |
| From Date | `app-datepicker` | Start date range |
| To Date | `app-datepicker` | End date range |

Uses `mat-paginator` for pagination (25/50/100 page sizes).

**API call:** `GET /api/v1/admin/audit-log` with query parameters: `userId`, `action`, `entityType`, `from`, `to`, `page`, `pageSize`. Returns paginated result with `data`, `page`, `pageSize`, `totalCount`, `totalPages`.

---

## Time Corrections Tab (`/admin/time-corrections`)

Delegated to `TimeCorrectionsPanelComponent`. Allows Admin and Manager roles to correct employee time entries with a full audit trail.

**Filters:**

| Filter | Control | Description |
|--------|---------|-------------|
| Employee | `app-select` | Filter by user |
| From Date | `app-datepicker` | Start date range |
| To Date | `app-datepicker` | End date range |

**Two DataTable sections:**

1. **Time Entries** -- displays current time entries for the selected employee/date range. Each row has an edit button that opens a correction dialog. Columns: date, description, timer start, timer stop, duration.

2. **Correction History** -- displays all `TimeCorrectionLog` records showing original values, corrected values, reason, and who made the correction.

---

## Events Tab (`/admin/events`)

Delegated to `EventsPanelComponent`. Manages company events (meetings, training, safety, other).

**List view** uses `DataTableComponent` (tableId: `admin-events`) with a type filter select. Columns: title, event type (with icon chip), start time, end time, required attendance flag, and action buttons (edit, cancel).

### Event Dialog

Width: 600px.

**Form fields:**

| Field | Control | Validators | Required |
|-------|---------|-----------|:--------:|
| Title | `app-input` | `maxLength(200)` | Yes |
| Event Type | `app-select` | Required | Yes |
| Location | `app-input` | -- | -- |
| Start Date | `app-datepicker` | Required | Yes |
| Start Time | `app-input` (placeholder: HH:MM) | Required | Yes |
| End Date | `app-datepicker` | Required | Yes |
| End Time | `app-input` (placeholder: HH:MM) | Required | Yes |
| Description | `app-textarea` (3 rows) | -- | -- |
| Attendees | `app-select` (multiple) | -- | -- |
| Required Attendance | `app-toggle` | -- | -- |

**Event types:** Meeting, Training, Safety, Other.

---

## EDI Tab (`/admin/edi`)

Delegated to `EdiPanelComponent`. Contains two sub-tabs: Trading Partners and Transactions.

### Trading Partners Sub-Tab

Displays EDI trading partners in a `DataTableComponent` (tableId: `edi-partners`). Shows partner name, format (X12/EDIFACT), customer/vendor links, active status, error count, and action buttons (test connection, edit, delete).

### Transactions Sub-Tab

Displays EDI transactions in a `DataTableComponent` (tableId: `edi-transactions`). Filterable by direction (Inbound/Outbound) and status. Shows document type, direction, status, received timestamp, related entity, and partner name. Rows are clickable for transaction detail view.

---

## MFA Policy Tab (`/admin/mfa`)

Delegated to `MfaPolicyPanelComponent`. Allows admins to enforce MFA requirements by role.

### Policy Controls

| Field | Control | Description |
|-------|---------|-------------|
| Required for Roles | `app-select` (multiple) | Multi-select of roles that must have MFA enabled |
| Save button | `action-btn` | Saves the policy via `PUT /api/v1/admin/mfa/policy` |

### User Compliance Table

Displays all users in a `DataTableComponent` (tableId: `mfa-compliance`).

**Columns:**

| Column | Field | Description |
|--------|-------|-------------|
| Name | `fullName` | User's full name |
| Email | `email` | User's email |
| Role | `role` | User's role (filterable) |
| MFA Enabled | `mfaEnabled` | Green "Enabled" chip or gray "Disabled" chip |
| Device Type | `mfaDeviceType` | Device type string or em dash |
| Enforced | `isEnforcedByPolicy` | Yellow "Enforced" chip or em dash |

**API calls:**
- Compliance status: `GET /api/v1/admin/mfa/compliance`
- Set policy: `PUT /api/v1/admin/mfa/policy` with `{ requiredRoles: string[] }`

---

## Compliance Tab (`/admin/compliance`)

Contains two sections:

### Compliance Templates Section

Delegated to `ComplianceTemplatesPanelComponent`. Manages compliance form templates (W-4, I-9, state withholding forms, etc.). CRUD operations for templates, PDF upload, definition extraction, and DocuSeal sync.

### Per-User Compliance Section

A user picker (`app-select`) populated from the user list allows admins to select any user and view their compliance detail via `UserCompliancePanelComponent`. Shows form submission status, identity documents, and I-9 completion workflow.

---

## API Endpoints Summary

All endpoints are under `/api/v1/admin` and require the `Admin` role unless noted.

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List all users |
| POST | `/admin/users` | Create user (returns setup token) |
| PUT | `/admin/users/{id}` | Update user |
| POST | `/admin/users/{id}/setup-token` | Generate setup token |
| POST | `/admin/users/{id}/send-invite` | Send setup invite email |
| POST | `/admin/users/{id}/reset-pin` | Reset user's kiosk PIN |
| POST | `/admin/users/{id}/deactivate` | Deactivate user |
| POST | `/admin/users/{id}/reactivate` | Reactivate user |
| GET | `/admin/users/{id}/documents` | Get employee documents |
| GET | `/admin/users/{id}/scan-identifiers` | List scan identifiers |
| POST | `/admin/users/{id}/scan-identifiers` | Add scan identifier |
| DELETE | `/admin/users/{id}/scan-identifiers/{sid}` | Remove scan identifier |
| PATCH | `/admin/users/{id}/work-location` | Update work location |
| GET | `/admin/users/{id}/employee-profile` | Get employee profile |
| PUT | `/admin/users/{id}/employee-profile` | Update employee profile |
| GET | `/admin/roles` | List roles (Admin + Manager) |

### Track Types

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/track-types` | List all track types with stages |
| POST | `/admin/track-types` | Create track type |
| PUT | `/admin/track-types/{id}` | Update track type |
| DELETE | `/admin/track-types/{id}` | Delete track type |

### Reference Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/reference-data` | List all groups with entries |
| POST | `/admin/reference-data` | Create reference data entry |
| PUT | `/admin/reference-data/{id}` | Update reference data entry |
| DELETE | `/admin/reference-data/{id}` | Delete reference data entry |

### System Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/system-settings` | List all settings |
| PUT | `/admin/system-settings` | Upsert settings (bulk) |
| GET | `/admin/brand` | Get brand settings (public, no auth) |
| GET | `/admin/logo` | Get company logo (public, no auth) |
| POST | `/admin/logo` | Upload logo (5MB limit, images only) |
| DELETE | `/admin/logo` | Delete logo |

### Company Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/company-profile` | Get company profile |
| PATCH | `/admin/company-profile` | Update company profile |

### Other Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/audit-log` | Paginated audit log |
| GET | `/admin/storage-usage` | Storage usage by bucket |
| GET | `/admin/integrations` | List integration providers |
| PUT | `/admin/integrations/{provider}` | Update integration settings |
| POST | `/admin/integrations/{provider}/test` | Test integration connection |
| GET | `/admin/labor-rates/{userId}` | Get user labor rates |
| POST | `/admin/labor-rates` | Create labor rate |
| GET | `/admin/shift-assignments` | List shift assignments (Admin + Manager) |
| POST | `/admin/shift-assignments` | Create shift assignment |
| DELETE | `/admin/shift-assignments/{id}` | Delete shift assignment |
| GET | `/admin/mfa/compliance` | Get MFA compliance status |
| PUT | `/admin/mfa/policy` | Set MFA policy |

---

## Data Models

### AdminUser

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | User ID |
| `email` | string | User email |
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `initials` | string or null | Display initials (up to 3 chars) |
| `avatarColor` | string or null | Hex color for avatar |
| `isActive` | boolean | Whether user is active |
| `roles` | string[] | Assigned roles |
| `createdAt` | Date | Account creation timestamp |
| `hasPassword` | boolean | Whether user has completed setup |
| `hasPendingSetupToken` | boolean | Whether an active setup token exists |
| `hasRfidIdentifier` | boolean | Whether user has RFID scan identifier |
| `hasBarcodeIdentifier` | boolean | Whether user has barcode scan identifier |
| `canBeAssignedJobs` | boolean | Whether user has completed all required compliance |
| `complianceCompletedItems` | number | Count of completed compliance items |
| `complianceTotalItems` | number | Total required compliance items |
| `missingComplianceItems` | string[] | List of missing compliance item names |
| `workLocationId` | number or null | Assigned work location |
| `workLocationName` | string or null | Work location name |
| `i9Status` | I9ComplianceStatus or null | I-9 form status |

### CreateUserRequest

| Field | Type | Required |
|-------|------|:--------:|
| `email` | string | Yes |
| `firstName` | string | Yes |
| `lastName` | string | Yes |
| `initials` | string | -- |
| `avatarColor` | string | -- |
| `role` | string | Yes |

---

## Known Limitations

1. **Reference data entries cannot be reordered via drag-and-drop** -- `sortOrder` is a manual numeric field. No inline editing is available; entries are managed via API calls.

2. **Track type deletion** does not cascade -- if jobs exist on the track type, the server returns a 409 conflict. The default track type cannot be deleted at all.

3. **Terminology edits are global** -- there is no per-user or per-role terminology override. Changes apply to all users immediately.

4. **System settings are free-form key-value pairs** -- the UI defines a fixed list of known settings. Settings created via API that are not in the UI's `settingDefinitions` array will not be visible in the admin panel.

5. **Setup tokens expire** -- the expiration period is server-configured. Expired tokens cannot be used; the admin must generate a new one.

6. **User email cannot be changed after creation** -- the email field is only shown in the create form, not the edit form. Email changes require direct database modification.

7. **RFID reader support** requires the WebHID API (Chromium-based browsers only) and the RFID Relay Client installed on the machine with the NFC/RFID reader connected.
