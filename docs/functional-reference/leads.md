# Leads

## Overview

The Leads feature is Forge's sales pipeline management tool. It tracks prospective customers from initial contact through conversion to a full customer record, providing visibility into the sales funnel for PM, Manager, and Admin roles.

Leads represent companies or individuals who have expressed interest but are not yet customers in the system. The feature supports two views -- a sortable/filterable data table and a visual drag-and-drop pipeline board -- and provides a conversion workflow that creates a Customer (and optionally a Job) from a qualified lead.

Key capabilities:

- **Pipeline tracking** with five statuses: New, Contacted, Quoting, Converted, Lost
- **Dual view modes**: data table (default) and kanban-style pipeline board
- **Drag-and-drop** status transitions in pipeline view
- **Lead-to-Customer conversion** with optional Job creation
- **Follow-up date tracking** with overdue highlighting
- **Lead source tracking** via admin-configurable reference data
- **Activity log** per lead (comments, notes, history)
- **Draft auto-save** for the create/edit dialog

---

## Routes & Navigation

| Route | Component | Description |
|-------|-----------|-------------|
| `/leads` | `LeadsComponent` | Main leads list (table or pipeline view) |

The leads page is a single-route feature. Detail viewing is handled via a `MatDialog` overlay (`LeadDetailDialogComponent`) opened from the list. The URL updates to `?detail=lead:{id}` when a detail dialog is open, making detail links shareable and bookmarkable.

**Sidebar navigation:** Leads appears in the main sidebar navigation.

**Lazy loading:** The feature module is lazy-loaded via `loadComponent` in `app.routes.ts`.

---

## Access & Permissions

| Role | Access |
|------|--------|
| Admin | Full CRUD, convert, delete |
| Manager | Full CRUD, convert, delete |
| PM | Full CRUD, convert, delete |
| Engineer | No access |
| Production Worker | No access |
| Office Manager | No access |

The controller enforces `[Authorize(Roles = "Admin,Manager,PM")]` on all endpoints. Users without these roles receive a `403 Forbidden` response.

---

## Lead List

### Table View (Default)

The table view uses `AppDataTableComponent` with `tableId="leads"` for column preference persistence.

#### Columns

| Column | Field | Sortable | Filterable | Type | Notes |
|--------|-------|----------|------------|------|-------|
| Company | `companyName` | Yes | No | text | Bold font weight (600) |
| Contact | `contactName` | Yes | No | text | Muted text; displays `--` when null |
| Source | `source` | Yes | No | text | Muted text; displays `--` when null |
| Status | `status` | Yes | Yes (enum) | enum | Rendered as colored chip (see Status Chips below) |
| Follow-Up | `followUpDate` | Yes | No | date | Format: `MM/dd/yyyy`; red + bold when overdue |
| Created | `createdAt` | Yes | No | date | Format: `MM/dd/yyyy`; muted text |

#### Status Chips

| Status | Chip Class | Visual |
|--------|-----------|--------|
| New | `chip--primary` | Primary color background |
| Contacted | `chip--info` | Info/blue background |
| Quoting | `chip--warning` | Warning/amber background |
| Converted | `chip--success` | Success/green background |
| Lost | `chip--muted` | Muted/gray background |

#### Status Filter Options (Column Filter)

The Status column's enum filter presents: New, Contacted, Quoting, Converted, Lost.

#### Row Click

Clicking any row opens the lead detail dialog (`LeadDetailDialogComponent`) with `?detail=lead:{id}` URL sync.

#### Filter Bar

Located above the data table, the filter bar contains:

| Control | Type | Behavior |
|---------|------|----------|
| Search | `<app-input>` | Filters by company name, contact name, or email (server-side). Triggers on Enter key. |
| Status | `<app-select>` | Dropdown with "All Statuses" (null) + 5 status options. Triggers reload on change. |

Search and status filters are sent as query parameters to `GET /api/v1/leads`. Both filters are applied server-side.

#### Empty State

When no leads match the filters:
- **Icon:** `person_search`
- **Message:** "No leads found"
- **Help text:** "No leads help" (i18n)

### Pipeline View

The pipeline view displays leads as draggable cards grouped into five status columns, similar to a kanban board.

#### Switching Views

Two icon buttons in the page header toggle between views:
- **Table view** (`view_list` icon) -- default
- **Pipeline view** (`view_column` icon)

View mode is persisted to `localStorage` under the key `leads-view-mode`.

#### Pipeline Columns

Five columns, one per status, displayed left to right: **New**, **Contacted**, **Quoting**, **Converted**, **Lost**.

Each column has:
- **Header:** Uppercase status name + count badge (muted chip)
- **Body:** Scrollable card list with CDK drag-drop enabled
- **Empty state:** Centered inbox icon + "No leads" text when the column is empty
- **Muted appearance:** Converted and Lost columns render at 75% opacity with a flat background header

All columns are connected for drag-and-drop (`cdkDropListConnectedTo`), allowing cards to be dragged between any two columns.

#### Pipeline Cards

Each card displays:
- **Company name** (bold, truncated with ellipsis)
- **Contact name** with avatar (initials-based `AvatarComponent`, size `sm`) -- shown only when contact name is present
- **Source** with `label` Material icon -- shown only when source is present
- **Follow-up date** with `event` Material icon -- shown only when date is present; red + bold when overdue

Cards are clickable (opens detail dialog) and keyboard-accessible (Enter key).

#### Drag Preview

While dragging, a compact preview shows just the company name (max 220px, truncated). The original card position shows a dashed-border placeholder (60px height).

#### Pipeline Filter Bar

The pipeline view has its own toolbar with only a search input (no status filter, since all statuses are visible as columns).

#### Drag-and-Drop Behavior

| Scenario | Behavior |
|----------|----------|
| Drag to same column | No action (reorder within column is a no-op) |
| Drag to different column (not Lost) | Optimistic status update; API `PATCH` to update status; rolls back on error |
| Drag to Lost column | Optimistic move + opens Lost Reason dialog; on confirm, sends `PATCH` with status + `lostReason`; on cancel, lead stays in Lost column visually (no rollback) |
| Drag to Converted column | Sends `PATCH` with `status: Converted` (note: this only updates the status field; it does NOT trigger the full conversion workflow that creates a Customer) |

---

## Lead Detail Dialog

Opened via `DetailDialogService.open()` with `MatDialog`. URL syncs to `?detail=lead:{id}`.

### Header

- **Icon:** `business` (Material outlined, muted color)
- **Company name** (bold)
- **Contact name** (smaller, muted) -- shown only when present
- **Edit button** (pencil icon, `icon-btn`) -- closes dialog and opens the edit form
- **Close button** (X icon, `icon-btn`) -- closes dialog, clears URL param

### Info Grid (2-column)

Displays the following fields in a 2-column grid layout:

| Field | Label | Always Shown | Notes |
|-------|-------|-------------|-------|
| Status | "Status" | Yes | Colored chip matching status |
| Email | "Email" | Only if present | Plain text |
| Phone | "Phone" | Only if present | Plain text |
| Source | "Source" | Only if present | Plain text |
| Follow-Up | "Follow-Up" | Only if present | `MM/dd/yyyy`; red + bold when overdue |
| Lost Reason | "Lost Reason" | Only if present | Plain text; only appears on Lost leads |

### Notes Section

Shown below the info grid when notes are present. Displays the full notes text in secondary color, 1.5 line height.

### Status Update Buttons

**Visible when:** Status is not Converted and not Lost.

A row of status buttons (New, Contacted, Quoting, Lost) allows quick status transitions. The "Converted" status is excluded from this button group -- conversion is handled separately.

| Button | Behavior |
|--------|----------|
| Status that matches current | Appears with active styling (primary border + color) |
| Click non-active status (not Lost) | Sends `PATCH` to update status; refreshes lead |
| Click "Lost" | Opens Lost Reason dialog (same as drag-to-Lost) |

### Convert Actions

**Visible when:** Status is not Converted and not Lost.

Two stacked buttons:

| Button | Icon | Label | Behavior |
|--------|------|-------|----------|
| Convert to Customer | `person` | "Convert to Customer" | Opens confirmation dialog, then calls `POST /api/v1/leads/{id}/convert?createJob=false` |
| Convert & Create Job | `work` | "Convert & Create Job" | Calls `POST /api/v1/leads/{id}/convert?createJob=true` directly (no confirmation dialog) |

Both buttons are disabled while `saving()` is true.

### Converted Info Banner

**Visible when:** Status is Converted.

Green banner with `check_circle` icon and "Converted" message text, confirming the lead has been converted to a customer.

### Reopen Action

**Visible when:** Status is Lost.

A single "Reopen Lead" button with `replay` icon. Calls `PATCH` to set status back to `New`.

### Activity Section

The `EntityActivitySectionComponent` is rendered at the bottom of the detail body with `entityType="Lead"` and `entityId` bound to the current lead's ID. It provides:

- **Tabs:** All, Comments, Notes, History
- **Comment posting** with @mentions
- **Chronological activity timeline** with user avatars

Activity data is fetched from `GET /api/v1/leads/{id}/activity`.

---

## Create/Edit Lead Dialog

Both create and edit use the same `<app-dialog>` with draft auto-save support (`DraftConfig` with `entityType: 'lead'`).

### Dialog Title

- **Create:** "Create Lead" (i18n: `leads.createLead`)
- **Edit:** "Edit Lead" (i18n: `leads.editLead`)

### Form Fields

| Field | Component | Label | FormControl | Type | Required | Validation | data-testid |
|-------|-----------|-------|-------------|------|----------|------------|-------------|
| Company Name | `<app-input>` | "Company Name" | `companyName` | text | Yes | `Validators.required` | `lead-company-name` |
| Contact Name | `<app-input>` | "Contact Name" | `contactName` | text | No | -- | `lead-contact-name` |
| Email | `<app-input>` | "Email" | `email` | email | No | `Validators.email` | `lead-email` |
| Phone | `<app-input>` | "Phone" | `phone` | text | No | -- | `lead-phone` |
| Source | `<app-select>` | "Source" | `source` | select | No | -- | `lead-source` |
| Follow-Up Date | `<app-datepicker>` | "Follow-Up Date" | `followUpDate` | date | No | -- | `lead-follow-up` |
| Notes | `<app-textarea>` | "Notes" | `notes` | textarea | No | -- | `lead-notes` |

**Layout:** Email and Phone are in a 2-column `.dialog-row`. Source and Follow-Up Date are in a second `.dialog-row`. All other fields are full-width.

### Source Options

Loaded from `ReferenceDataService.getAsOptions('lead_source')` at construction time. Options use the `label` field as the value (not `code`). Includes a "None" null option.

### Footer Buttons

| Button | Position | Behavior |
|--------|----------|----------|
| Cancel | Left | Closes dialog without saving |
| Save / Create Lead | Right (primary) | Disabled when form invalid or saving; shows validation popover on hover when invalid; `save` Material icon |

### Validation Popover

The submit button uses `[appValidationPopover]="leadViolations"` which displays a hover popover listing all validation errors with human-readable field labels.

### Save Behavior

- **Create:** `POST /api/v1/leads` with the form data. On success: clears draft, closes dialog, reloads list.
- **Edit:** `PATCH /api/v1/leads/{id}` with the form data. On success: clears draft, closes dialog, reloads list.

Empty optional strings are sent as `undefined` (omitted from the request body). Dates are converted via `toIsoDate()` to ISO 8601 format (`YYYY-MM-DDT00:00:00Z`).

### Draft Support

The dialog supports auto-save drafts via the `DraftConfig`:
- **Create:** `entityType: 'lead'`, `entityId: 'new'`
- **Edit:** `entityType: 'lead'`, `entityId: '{leadId}'`

Drafts are saved to IndexedDB and recovered on the next dialog open or post-login recovery prompt.

---

## Lead Stages / Status Pipeline

Leads progress through a five-stage pipeline:

```
New --> Contacted --> Quoting --> Converted
                          \----> Lost
```

### Status Definitions

| Status | Description | Terminal | Can Transition To |
|--------|-------------|---------|-------------------|
| New | Freshly created lead, no contact made | No | Contacted, Quoting, Lost |
| Contacted | Initial contact has been made | No | New, Quoting, Lost |
| Quoting | Actively preparing or discussing a quote | No | New, Contacted, Lost |
| Converted | Converted to a Customer record | Yes | -- (irreversible) |
| Lost | Lead declined or went cold | Semi | New (via "Reopen Lead") |

### Transition Rules

- **Any non-terminal status** can transition to any other non-terminal status or to Lost via the status buttons or pipeline drag-and-drop.
- **Moving to Lost** always prompts for a lost reason (optional text).
- **Conversion** is a separate workflow (not a simple status change) -- see "Convert to Customer" below.
- **Reopening** a Lost lead sets status back to New.
- **Converted leads cannot be deleted** (enforced server-side; returns `InvalidOperationException` mapped to `409 Conflict`).
- **Lost leads cannot be converted** (enforced server-side).

---

## Convert to Customer

The conversion workflow creates a new Customer entity (and optionally a Job) from the lead's data.

### Data Mapping

| Lead Field | Customer Field | Notes |
|------------|---------------|-------|
| `companyName` | `Name`, `CompanyName` | Both fields receive the company name |
| `email` | `Email` | Carried over if present |
| `phone` | `Phone` | Carried over if present |

### Contact Creation

If the lead has a `contactName`, a `Contact` is created under the new customer:
- `FirstName`: First word of the contact name
- `LastName`: Remainder of the contact name (empty string if single word)
- `Email`: From lead email
- `Phone`: From lead phone
- `IsPrimary`: `true`

### Job Creation (Optional)

When `createJob=true`:
- Job is created on the **default active track type**
- Title: `"New Job -- {companyName}"`
- Description: Lead's notes
- Customer: The newly created customer
- No assignee, priority, or due date

If no default active track type exists, no job is created (silently skipped).

### Post-Conversion State

- Lead status set to `Converted`
- Lead's `convertedCustomerId` set to the new customer's ID
- Lead becomes read-only in the detail panel (no status buttons, no convert buttons)
- Green "Converted" banner displayed in detail

### Confirmation Flow

The "Convert to Customer" button shows a `ConfirmDialogComponent` with:
- **Title:** "Convert Lead?" (i18n)
- **Message:** "This will convert {companyName} to a customer." (i18n, interpolated)
- **Confirm label:** "Convert" (i18n)
- **Severity:** `info`

The "Convert & Create Job" button does **not** show a confirmation -- it executes immediately.

### Success Feedback

A snackbar notification is shown:
- **Convert only:** "Lead converted to customer" (i18n)
- **Convert with job:** "Lead converted to customer with job" (i18n)

On error, a snackbar error is shown: "Conversion failed" (i18n).

---

## Activity / Notes

The detail panel includes an `EntityActivitySectionComponent` at the bottom, which provides:

- **Activity tabs:** All, Comments, Notes, History
- **Comment posting:** Users can add comments with @mention support
- **Chronological timeline:** Shows all activity entries with user avatars, timestamps, and descriptions
- **Endpoint:** `GET /api/v1/leads/{id}/activity` returns `ActivityResponseModel[]`

Activity entries are created automatically by the system when lead fields change (status updates, field edits) and manually when users post comments or notes.

---

## Every Button/Action

### Page Header

| Button | Icon | Label | Behavior | Disabled When |
|--------|------|-------|----------|---------------|
| Table view toggle | `view_list` | Tooltip: "Table view" | Switches to table view, saves to localStorage | Never |
| Pipeline view toggle | `view_column` | Tooltip: "Pipeline view" | Switches to pipeline view, saves to localStorage | Never |
| New Lead | `add` | "Create Lead" | Opens create lead dialog | Never |

### Filter Bar (Table View)

| Control | Behavior |
|---------|----------|
| Search input | Enter key triggers `applyFilters()` which reloads leads from API |
| Status select | Changing value triggers filter (included in next API call) |

### Data Table

| Interaction | Behavior |
|-------------|----------|
| Row click | Opens `LeadDetailDialogComponent` via `DetailDialogService` |
| Column header click | Sorts by that column (DataTable built-in) |
| Shift+click column header | Multi-column sort |
| Right-click column header | Context menu (sort, filter, hide, reset) |
| Gear icon | Column manager panel (visibility, reorder, reset) |

### Detail Dialog

| Button/Action | Icon | Location | Behavior | Disabled When |
|---------------|------|----------|----------|---------------|
| Edit | `edit` | Header (icon button) | Closes dialog, opens edit form pre-filled | Never |
| Close | `close` | Header (icon button) | Closes dialog, clears `?detail=` URL param | Never |
| Status buttons (New/Contacted/Quoting/Lost) | -- | Status actions section | Updates lead status via `PATCH` | Lead is Converted or Lost |
| Convert to Customer | `person` | Convert actions section | Confirmation dialog, then `POST .../convert` | `saving()` is true; hidden when Converted/Lost |
| Convert & Create Job | `work` | Convert actions section | `POST .../convert?createJob=true` | `saving()` is true; hidden when Converted/Lost |
| Reopen Lead | `replay` | Status actions (Lost leads only) | Sets status to New via `PATCH` | Hidden unless Lost |

### Lost Reason Dialog

| Button | Behavior |
|--------|----------|
| Cancel | Closes dialog without saving |
| Confirm Lost | Sends `PATCH` with `status: Lost` and optional `lostReason`; closes dialog; reloads leads |

### Create/Edit Dialog

| Button | Icon | Behavior | Disabled When |
|--------|------|----------|---------------|
| Cancel | -- | Closes dialog without saving | Never |
| Save Changes / Create Lead | `save` | Saves lead via API, clears draft, closes dialog, reloads list | Form invalid OR `saving()` is true |

---

## API Endpoints

All endpoints require authentication and one of the roles: Admin, Manager, PM.

Base URL: `/api/v1/leads`

### GET /api/v1/leads

List all leads with optional filtering.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | `LeadStatus` (string enum) | No | Filter by status |
| `search` | `string` | No | Case-insensitive search across `companyName`, `contactName`, `email` |

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "companyName": "Acme Corp",
    "contactName": "Jane Smith",
    "email": "jane@acme.com",
    "phone": "(555) 123-4567",
    "source": "Trade Show",
    "status": "New",
    "notes": "Met at booth 42",
    "followUpDate": "2026-04-20T00:00:00Z",
    "lostReason": null,
    "convertedCustomerId": null,
    "createdAt": "2026-04-10T14:30:00Z",
    "updatedAt": "2026-04-10T14:30:00Z"
  }
]
```

Results are ordered by `createdAt` descending (newest first). No pagination -- all matching leads are returned.

### GET /api/v1/leads/{id}

Get a single lead by ID.

**Response:** `200 OK` with `LeadResponseModel`, or `404 Not Found`.

### POST /api/v1/leads

Create a new lead.

**Request Body:**

```json
{
  "companyName": "Acme Corp",
  "contactName": "Jane Smith",
  "email": "jane@acme.com",
  "phone": "(555) 123-4567",
  "source": "Trade Show",
  "notes": "Met at booth 42",
  "followUpDate": "2026-04-20T00:00:00Z"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `companyName` | `string` | Yes | Not empty, max 200 chars |
| `contactName` | `string` | No | Max 200 chars |
| `email` | `string` | No | Valid email format (when non-empty) |
| `phone` | `string` | No | Max 50 chars |
| `source` | `string` | No | -- |
| `notes` | `string` | No | -- |
| `followUpDate` | `DateTimeOffset` | No | ISO 8601 format |

**Response:** `201 Created` with `LeadResponseModel` and `Location` header.

New leads are created with `status: New` and `createdBy` set to the authenticated user.

### PATCH /api/v1/leads/{id}

Update an existing lead. All fields are optional (partial update semantics).

**Request Body:**

```json
{
  "companyName": "Acme Corp Updated",
  "status": "Contacted",
  "lostReason": "Budget constraints"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `companyName` | `string` | No | Max 200 chars |
| `contactName` | `string` | No | -- |
| `email` | `string` | No | Valid email format |
| `phone` | `string` | No | Max 50 chars |
| `source` | `string` | No | -- |
| `status` | `LeadStatus` | No | `New`, `Contacted`, `Quoting`, `Converted`, `Lost` |
| `notes` | `string` | No | -- |
| `followUpDate` | `DateTimeOffset` | No | ISO 8601 format |
| `lostReason` | `string` | No | Typically set when status changes to Lost |

**Response:** `200 OK` with updated `LeadResponseModel`.

Returns `404` if the lead ID does not exist.

### POST /api/v1/leads/{id}/convert

Convert a lead to a customer, optionally creating a job.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `createJob` | `bool` | `false` | When `true`, also creates a Job on the default track type |

**Response:** `200 OK`

```json
{
  "customerId": 42,
  "jobId": null
}
```

`jobId` is present only when `createJob=true` and a default track type exists.

**Error Responses:**

| Condition | Status | Message |
|-----------|--------|---------|
| Lead not found | `404` | "Lead {id} not found" |
| Already converted | `409` | "Lead has already been converted." |
| Lost lead | `409` | "Cannot convert a lost lead." |

### DELETE /api/v1/leads/{id}

Soft-delete a lead (sets `deletedAt` timestamp).

**Response:** `204 No Content`

**Error Responses:**

| Condition | Status | Message |
|-----------|--------|---------|
| Lead not found | `404` | "Lead {id} not found" |
| Converted lead | `409` | "Converted leads cannot be deleted." |

### GET /api/v1/leads/{id}/activity

Get the activity log for a lead.

**Response:** `200 OK` with `ActivityResponseModel[]`.

---

## Status Lifecycle

```
                +-------+
                |  New  |<---------+
                +---+---+          |
                    |              |
              (contact)       (reopen)
                    |              |
                +---v---+     +----+---+
                |Contact|     |  Lost  |
                | -ed   |     +--------+
                +---+---+          ^
                    |              |
              (quote)        (mark lost - any
                    |         non-terminal)
                +---v---+         |
                |Quoting+---------+
                +---+---+
                    |
              (convert)
                    |
              +-----v-----+
              | Converted  |  (terminal)
              +-----------+
```

### Status Transitions Summary

| From | To | Trigger | Notes |
|------|----|---------|-------|
| New | Contacted | Status button or drag | -- |
| New | Quoting | Status button or drag | -- |
| New | Lost | Status button or drag | Prompts for lost reason |
| Contacted | New | Status button or drag | -- |
| Contacted | Quoting | Status button or drag | -- |
| Contacted | Lost | Status button or drag | Prompts for lost reason |
| Quoting | New | Status button or drag | -- |
| Quoting | Contacted | Status button or drag | -- |
| Quoting | Lost | Status button or drag | Prompts for lost reason |
| Any non-terminal | Converted | Convert buttons only | Creates Customer; not available via status buttons or drag |
| Lost | New | "Reopen Lead" button | Resets to New |

---

## Response Model Reference

### LeadResponseModel

```
LeadResponseModel(
    Id: int,
    CompanyName: string,
    ContactName: string?,
    Email: string?,
    Phone: string?,
    Source: string?,
    Status: LeadStatus,
    Notes: string?,
    FollowUpDate: DateTimeOffset?,
    LostReason: string?,
    ConvertedCustomerId: int?,
    CreatedAt: DateTimeOffset,
    UpdatedAt: DateTimeOffset
)
```

### ConvertLeadResponseModel

```
ConvertLeadResponseModel(
    CustomerId: int,
    JobId: int?
)
```

### LeadStatus Enum

```
New = 0
Contacted = 1
Quoting = 2
Converted = 3
Lost = 4
```

Serialized as strings in JSON responses (`JsonStringEnumConverter`).

---

## Known Limitations

1. **No pagination.** The `GET /api/v1/leads` endpoint returns all matching leads without pagination. This works for small-to-medium lead volumes but may degrade with thousands of leads.

2. **No estimated value field.** The `LeadItem` model and `Lead` entity do not include an estimated deal value. The pipeline view has a placeholder `formatValue()` method that always returns `null`. Adding monetary value tracking would require a schema migration.

3. **Pipeline drag to Converted does not run conversion.** Dragging a card to the "Converted" column in pipeline view only updates the `status` field via `PATCH`. It does **not** create a Customer or Contact. True conversion requires using the "Convert to Customer" buttons in the detail dialog.

4. **No pipeline reordering.** Dragging within the same pipeline column is a no-op. Cards within a column are not positionally ordered -- they follow the API's default sort (newest first via `createdAt DESC`).

5. **No delete from UI.** The `DELETE` endpoint exists in the API, and `LeadsService.deleteLead()` is implemented, but there is no delete button in the UI (neither in the list nor the detail dialog). Deletion is API-only.

6. **Search triggers on Enter only (table view).** The search input in table view does not auto-search on keystroke -- the user must press Enter. Pipeline view search filters client-side on keystroke.

7. **Lost reason is optional.** The lost reason dialog does not require text -- the user can confirm without entering a reason.

8. **No bulk operations.** There is no multi-select or bulk status update capability on the leads list or pipeline.

9. **Follow-up date overdue check is client-side.** The overdue highlighting compares the follow-up date against `new Date()` in the browser. There is no server-side overdue flag or scheduled notification for overdue follow-ups.

10. **Contact name splitting is naive.** During conversion, the contact name is split on the first space. Names like "Mary Jane Watson" become `FirstName: "Mary"`, `LastName: "Jane Watson"`. Single-word names result in an empty `LastName`.
