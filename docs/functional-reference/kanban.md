# Kanban Board

## Overview

The Kanban Board is the primary job management interface in Forge. It presents jobs as cards organized into columns representing workflow stages, with each board scoped to a specific track type (Production, R&D/Tooling, Maintenance, etc.). The board supports drag-and-drop movement between stages, real-time multi-user sync via SignalR, multi-select bulk operations, and two view modes: a standard column-based board view and a team-based swimlane view.

The board is the visual representation of work flowing through the manufacturing pipeline. Jobs progress left-to-right through stages that mirror the physical workflow -- from quoting through production to invoicing. Each track type defines its own set of stages, colors, WIP limits, and irreversibility rules.

## Route

| Path | Component | Lazy-loaded |
|------|-----------|-------------|
| `/kanban` | `KanbanComponent` | Yes |

**Access roles:** Admin, Manager, PM, Engineer, ProductionWorker, OfficeManager (inherited from `JobsController` authorization: `Authorize(Roles = "Admin,Manager,PM,Engineer,ProductionWorker,OfficeManager")`).

**URL state:**
- `?detail=job:{id}` -- opens the job detail dialog for the specified job. Set automatically when a card is clicked, cleared on dialog close. Supports shared links, bookmarks, and notifications.
- `?myWork=true` -- filters the board to show only jobs assigned to the current user. Persisted to `UserPreferencesService` under key `kanban:myWorkOnly`.

The selected track type is managed via component state (not URL), defaulting to the track type marked `isDefault` or the first available type.

## Track Types

Track types represent distinct workflow categories. Each defines its own ordered sequence of stages through which jobs progress. The system ships with four seeded track types, and administrators can create custom ones.

### Seeded Track Types

| Track Type | Code | Description |
|------------|------|-------------|
| Production | `production` | Standard manufacturing workflow: quote-to-cash pipeline aligned with accounting documents |
| R&D/Tooling | `rd_tooling` | Research and development projects with iteration tracking |
| Maintenance | `maintenance` | Equipment and facility maintenance work orders |
| Other | `other` | Catch-all for miscellaneous work that does not fit other categories |

### Track Type Model

```typescript
interface TrackType {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isDefault: boolean;
  sortOrder: number;
  stages: Stage[];
}
```

Backend entity (`TrackType.cs`):

| Property | Type | Description |
|----------|------|-------------|
| `Name` | string | Display name |
| `Code` | string | Immutable identifier |
| `Description` | string? | Optional description |
| `IsDefault` | bool | Whether this is the initially-selected track type |
| `SortOrder` | int | Display order in the track type selector |
| `IsActive` | bool | Soft visibility toggle |
| `IsShopFloor` | bool | Whether this track type appears on the shop floor display |
| `CustomFieldDefinitions` | string? | JSONB column storing custom field schemas for jobs on this track |

### Track Type Selector

The track type selector is rendered as a row of toggle buttons in the page header. Clicking a button:

1. Sets `selectedTrackTypeId` to the chosen track type.
2. Calls `BoardHubService.joinBoard(trackTypeId)` to subscribe to SignalR events for that board.
3. Fetches the board data via `KanbanService.getBoard(trackTypeId)`.

The board data is built client-side by `KanbanService.buildBoard()`: it fetches the track type (to get the stage list) and all non-archived jobs for that track type, then groups jobs into columns by stage name.

### Custom Field Definitions

Each track type can define custom fields (stored as JSONB on the `TrackType` entity). Jobs on that track type store their custom field values in the `CustomFieldValues` JSONB column on the `Job` entity. The API exposes endpoints for reading and updating both definitions and values.

## Board Layout

### Columns

Each column represents a workflow stage. Columns are rendered left-to-right in `sortOrder` sequence. The column structure:

```typescript
interface BoardColumn {
  stage: Stage;
  jobs: KanbanJob[];
}
```

### Stage Model

```typescript
interface Stage {
  id: number;
  name: string;
  code: string;
  sortOrder: number;
  color: string;
  wipLimit: number | null;
  accountingDocumentType: string | null;
  isIrreversible: boolean;
}
```

Backend entity (`JobStage.cs`):

| Property | Type | Description |
|----------|------|-------------|
| `Name` | string | Stage display name (e.g., "In Production") |
| `Code` | string | Immutable identifier (e.g., "in_production") |
| `SortOrder` | int | Left-to-right position on the board |
| `Color` | string | Hex color code for the stage header border and tint |
| `WIPLimit` | int? | Maximum number of jobs allowed in this stage (null = unlimited) |
| `AccountingDocumentType` | enum? | Links stage to an accounting document type (Quote, SalesOrder, Invoice, Payment) |
| `IsIrreversible` | bool | If true, jobs cannot be dragged into this column -- they can only be moved into it programmatically via accounting integration |
| `IsShopFloor` | bool | Whether jobs in this stage appear on the shop floor display |
| `IsActive` | bool | Soft visibility toggle |

### Column Header

Each column header displays:

- **Stage name** -- text label
- **Job count** -- number of jobs currently in the column
- **WIP limit** (if set) -- displayed as `/ N` after the count. When the job count meets or exceeds the WIP limit, the count/limit text turns red (`column__wip--warn` class) and the column receives the `column--over-wip` class.
- **Lock icon** -- shown when `isIrreversible` is true. Tooltip: "This stage is locked -- jobs cannot be moved here by drag."

### Column Body

The column body is the drop zone for job cards. It has a white background (`--surface`) with a 2px inset border tinted by the stage's color via the `--col-tint` CSS custom property. When a column has no jobs, an `EmptyStateComponent` is shown with the `work` icon and "No jobs in this stage" message.

### Production Track Stages (QB-Aligned)

The Production track type ships with stages aligned to the QuickBooks accounting workflow:

| Stage | Irreversible | Accounting Doc Type | Description |
|-------|-------------|---------------------|-------------|
| Quote Requested | No | -- | Customer has requested a price |
| Quoted | No | Estimate | Estimate has been sent |
| Order Confirmed | No | SalesOrder | Customer has accepted; sales order created |
| Materials Ordered | No | -- | Purchase orders placed for materials |
| Materials Received | No | -- | Materials arrived |
| In Production | No | -- | Active manufacturing work |
| QC/Review | No | -- | Quality control inspection |
| Shipped | Yes | Invoice | Product shipped; invoice generated |
| Invoiced/Sent | Yes | -- | Invoice delivered to customer |
| Payment Received | Yes | Payment | Customer payment recorded |

Irreversible stages (Shipped, Invoiced/Sent, Payment Received) cannot accept cards via drag-and-drop because the corresponding accounting documents (invoices, payments) are irreversible once created.

## Job Cards

Job cards are the visual representation of individual jobs on the board. Each card is rendered by `JobCardComponent`, a dumb component that takes a `KanbanJob` input and emits click events.

### Card Visual Elements

From top to bottom:

1. **Cover photo** (optional) -- if `coverPhotoUrl` is set, a cropped image banner appears at the top of the card.
2. **Priority border** -- a left border colored by priority:
   - Low: `#94a3b8` (slate)
   - Normal: `#0d9488` (teal)
   - High: `#f59e0b` (amber)
   - Urgent: `#dc2626` (red)
3. **Selection check** -- when the card is in the multi-select set, a checkmark overlay appears.
4. **Header row**:
   - **Job number** -- clickable button (`card__job-number`) that opens the job detail dialog. Click is stopped from propagating to the card click handler.
   - **Hold indicator** -- `pause_circle` icon shown when `activeHolds.length > 0`. Tooltip lists all active hold names, one per line.
   - **Overdue indicator** -- `warning` icon shown when `isOverdue` is true.
5. **Title** -- job title text.
6. **Footer row** (flexible, showing whichever elements are present):
   - **Assignee avatar** -- `AvatarComponent` with the assignee's initials and color, size `sm`.
   - **Customer name** -- text span with the customer name.
   - **Billing status** -- icon (`paid` for Invoiced, `pending` for Uninvoiced) with color styling.
   - **Accounting reference** -- `receipt_long` icon with the external reference number (e.g., QuickBooks invoice number). Tooltip shows the document type and reference.
   - **Disposition indicator** -- `assignment_turned_in` icon shown when the job has been disposed. Tooltip shows the disposition type.
   - **Child job count** -- `account_tree` icon with a count badge when `childJobCount > 0`.
   - **Due date** -- formatted as `MM/dd/yyyy`. Receives `card__due--overdue` class when the job is overdue.

### KanbanJob Model

```typescript
interface KanbanJob {
  id: number;
  jobNumber: string;
  title: string;
  stageName: string;
  stageColor: string;
  assigneeId: number | null;
  assigneeInitials: string | null;
  assigneeColor: string | null;
  priorityName: string;
  dueDate: Date | null;
  isOverdue: boolean;
  customerName: string | null;
  billingStatus: string | null;
  externalRef: string | null;
  accountingDocumentType: string | null;
  disposition: string | null;
  childJobCount: number;
  activeHolds: string[];
  coverPhotoUrl: string | null;
}
```

### Card Interactions

- **Click** -- if Ctrl/Cmd is held, toggles multi-select. If no multi-select is active, opens the job detail dialog. If multi-select is active and no modifier key, clears the selection.
- **Job number click** -- always opens the job detail dialog (does not toggle multi-select).
- **Drag** -- initiates drag-and-drop to move the card between stages or reorder within a column.
- **Keyboard** -- cards have `role="button"` and `tabindex="0"`. Pressing Enter triggers the card click handler.

## Views

The board supports two view modes, toggled via icon buttons in the page header.

### Board View (Default)

Standard kanban column layout. Each stage is a vertical column containing its job cards. Columns are rendered by `BoardColumnComponent` and connected as CDK drag-drop lists. All columns share a common set of drop list IDs so cards can be dragged between any two columns.

### Team View (Swimlane)

A grid layout where rows represent team members and columns represent stages. Each cell contains the jobs assigned to that user in that stage. This view makes workload distribution visible at a glance.

**Row composition:**
- One row per user who has assigned jobs (auto-detected from the job data).
- If the Team Members filter is active, only selected users appear as rows.
- An "Unassigned" row always appears at the bottom if there are unassigned jobs (or if no team filter is active).

**Swimlane data model:**

```typescript
interface SwimlaneRow {
  user: UserRef | null; // null = Unassigned
  cells: SwimlaneCellData[]; // one per stage, same order as columns
}

interface SwimlaneCellData {
  jobs: KanbanJob[];
}
```

**Swimlane drag-and-drop:** Dropping a card into a different column changes its stage. Dropping a card into a different row changes its assignee. Both can happen in a single drop operation. Stage changes call `moveJobStage()`, assignee changes call `updateJob()`. Both are optimistic -- the UI updates immediately, and on API error, the board is fully reloaded.

**Performance:** Jobs are pre-grouped by `assigneeId` per column using a `Map` to avoid O(n*m) filtering in the `swimlaneRows` computed signal.

## Filters

### Track Type Selector

A row of toggle buttons in the page header. Each button corresponds to a track type. Selecting one loads the board for that track type.

### Team Members Filter

A multi-select dropdown (`SelectComponent` with `[multiple]="true"`) populated from the user list. When one or more users are selected:
- **Board view:** Only jobs assigned to the selected users are shown in each column.
- **Team view:** Only the selected users appear as swimlane rows.

When no users are selected, all jobs and users are shown.

### My Work Toggle

A toggle button that filters the board to show only jobs assigned to the currently authenticated user. The state is:
- Reflected in the URL as `?myWork=true`.
- Persisted to `UserPreferencesService` under key `kanban:myWorkOnly`.

The filter is additive with the Team Members filter -- both are applied together in the `filteredColumns` computed signal.

### Barcode/NFC Scanner Integration

The board responds to barcode scanner input via `ScannerService` (context: `kanban`). When a scan is detected:
1. The scanned value is matched case-insensitively against all job numbers on the board.
2. If a match is found, the job detail dialog opens and a success snackbar appears.
3. If no match is found, an error snackbar displays the scanned value.

## Drag and Drop

Job cards can be dragged between columns (stage change) and reordered within a column (position change). The implementation uses Angular CDK Drag and Drop.

### Moving Between Stages

1. User drags a card from one column to another.
2. The `canEnter` predicate on the target column checks: if the target stage is irreversible, only cards already in that column can be dropped (preventing new cards from being dragged in).
3. On drop, `transferArrayItem` moves the card in the local data immediately (optimistic UI).
4. `KanbanService.moveJobStage(jobId, targetStageId)` is called via `PATCH /api/v1/jobs/{id}/stage`.
5. On API error, `transferArrayItem` reverses the move (rollback).
6. Position updates are sent for all cards in the target column.

### Reordering Within a Column

1. User drags a card within the same column.
2. `moveItemInArray` reorders the local data.
3. For each card in the column, `KanbanService.updateJobPosition(jobId, index)` is called via `PATCH /api/v1/jobs/{id}/position`.

### Irreversible Stage Enforcement

Columns with `isIrreversible: true` display a lock icon and enforce a drop predicate: `canEnter` returns `true` only if the drag source is the same container. This means:
- Cards already in an irreversible column can be reordered within it.
- No card can be dragged into an irreversible column from outside.
- Cards can be dragged out of an irreversible column to non-irreversible columns.

Jobs reach irreversible stages through the accounting integration (e.g., creating an invoice moves a job to "Shipped" automatically).

## Multi-Select and Bulk Operations

### Multi-Select

- **Ctrl+Click** (or Cmd+Click on macOS) on a card toggles it in/out of the selection set.
- When any cards are selected, a bulk action bar appears at the bottom of the board.
- Clicking a card without Ctrl when a selection exists clears the selection.
- The selection count is displayed in the bulk bar.
- Selected cards show a checkmark overlay and receive the `card--selected` CSS class.

### Bulk Action Bar

A fixed-position bar at the bottom of the board, visible when `selectionCount() > 0`. Contains:

| Action | Icon | Behavior |
|--------|------|----------|
| Move | `drive_file_move` | Opens a menu listing all stages. Clicking a stage moves all selected jobs to that stage via `PATCH /api/v1/jobs/bulk/stage`. |
| Assign | `person` | Opens a menu listing all users plus "Unassign". Clicking assigns all selected jobs via `PATCH /api/v1/jobs/bulk/assign`. |
| Priority | `flag` | Opens a menu listing Low, Normal, High, Urgent. Clicking sets priority on all selected jobs via `PATCH /api/v1/jobs/bulk/priority`. |
| Archive | `archive` | Opens a `ConfirmDialogComponent` with severity `warn`. On confirmation, archives all selected jobs via `PATCH /api/v1/jobs/bulk/archive`. |
| Close (X) | `close` | Clears the selection without performing any action. |

### Bulk Operation Response

All bulk endpoints return:

```typescript
interface BulkResult {
  successCount: number;
  failureCount: number;
  errors: { jobId: number; message: string }[];
}
```

After any bulk operation, the selection is cleared and the board is reloaded.

## Job Detail Dialog

The job detail dialog opens as a full `MatDialog` (via `DetailDialogService`) when:
- A card's job number is clicked.
- A card body is clicked (without Ctrl/multi-select).
- The URL contains `?detail=job:{id}` (deep link, bookmark, or notification).

The dialog component is `JobDetailDialogComponent`, which wraps `JobDetailPanelComponent`. The URL is updated to `?detail=job:{id}` on open and cleared on close.

### Layout

The detail panel has a two-column layout:

- **Header bar**: job number, stage chip (colored by stage color), and action buttons (timer start/stop, cover photo, edit, close).
- **Left column (main content)**: title, description, R&D iteration info, disposition info, subtasks, sub-jobs, BOM explosion, linked cards, parts, cost analysis, operation time analysis, and activity/comments/notes/history.
- **Right column (sidebar)**: status timeline with holds, barcode/QR, details metadata, files, and time entries.

### Header Actions

| Button | Icon | Action |
|--------|------|--------|
| Start Timer | `play_circle` | Starts a time tracking timer for the job via `TimeTrackingService.startTimer()` |
| Stop Timer | `stop_circle` | Stops the active timer. Shown only when a timer is running. |
| Cover Photo | `add_photo_alternate` | Opens the cover photo upload dialog |
| Edit | `edit` | Closes the detail dialog and opens the job edit dialog |
| Close | `close` | Closes the detail dialog |

### Sidebar -- Details Section

Displays read-only metadata about the job:

| Field | Description |
|-------|-------------|
| Priority | Priority name with a colored dot |
| Assignee | Avatar + name, or "Unassigned". Clickable -- opens a mat-menu to reassign the job inline. |
| Customer | Customer name as an `EntityLinkComponent` (navigates to customer detail) |
| Due Date | Formatted as MM/dd/yyyy |
| Start Date | Formatted as MM/dd/yyyy |
| Track | Track type name |
| Part | Part number as an `EntityLinkComponent` (shown only if `partId` is set) |
| Parent Job | Parent job number as an `EntityLinkComponent` (shown only if `parentJobId` is set) |

### Sidebar -- Files Section

Displays attached files and a `FileUploadZoneComponent` for uploading new files.

Each file row shows:
- File type icon (image, PDF, spreadsheet, document, or generic attachment)
- File name
- File size + upload date
- Download button
- Delete button (danger style)

### Sidebar -- Time Section

Lists all time entries for the job. Shows:
- Total time (formatted as `Xh Ym`)
- Per-entry: user name, date, duration, and optional notes

### Main Content Sections

**Title and Description:** The job title as an `h1`, followed by the description paragraph. If no description exists, a muted "No description" placeholder is shown.

**R&D Iteration (conditional):** Shown when the job is on the R&D/Tooling track or has `iterationCount > 0`. Displays the iteration version (e.g., "v3") and iteration notes.

**Disposition (conditional):** Shown when the job has been disposed. Displays the disposition type (human-readable label), notes, and date.

**Cost Analysis:** The `JobCostTabComponent` displays a cost summary comparing estimated vs actual costs across material, labor, burden, and subcontract categories. Shows quoted price, margin, and variance percentages. Includes a material issues data table and a "Recalculate Costs" action (Admin/Manager only).

**Operation Time Analysis:** The `OperationTimeTabComponent` shows per-operation time analysis -- estimated vs actual setup/run minutes, total time, efficiency percentage, and a visual progress bar. Includes totals and overall efficiency.

**Activity Section:** The shared `EntityActivitySectionComponent` provides a tabbed view of:
- All activity (combined feed)
- Comments (user-submitted, supports @mentions)
- Notes (internal notes with rich text)
- History (automated change log entries)

### Status Timeline

The `StatusTimelineComponent` in the sidebar shows the job's status lifecycle:
- Current workflow status
- Active holds (if any)
- Status history with timestamps

A "Dispose" button is shown when the job has not yet been disposed. Clicking it opens the Dispose Job dialog.

## Create Job Dialog

The create job dialog opens from the "New Job" button in the page header. It uses `JobDialogComponent` in `create` mode.

### Form Fields

| Field | Control | Validators | Required | Notes |
|-------|---------|-----------|----------|-------|
| Title | `InputComponent` | `required`, `maxLength(200)` | Yes | Placeholder: "Enter job title" |
| Description | `TextareaComponent` | -- | No | 3 rows |
| Track Type | `SelectComponent` | `required` | Yes | Only shown in create mode. Options from loaded track types. Defaults to the default track type. |
| Customer | `SelectComponent` | -- | No | Options from `getCustomers()`. Includes "-- None --" option with null value. |
| Assignee | `SelectComponent` | -- | No | Options from `getUsers()`. Includes "-- Unassigned --" option with null value. Users with incomplete profiles show a warning badge. |
| Priority | `SelectComponent` | -- | No | Options: Low, Normal, High, Urgent. Defaults to "Normal". |
| Due Date | `DatepickerComponent` | -- | No | Converted to ISO UTC string via `toIsoDate()` before submission. |

### Validation

Validation uses the popover pattern (`ValidationPopoverDirective` on the submit button). The submit button is disabled when the form is invalid, still loading reference data, or saving. Hovering over the disabled button shows a popover listing violations.

Field labels for validation messages: Title, Track Type.

### Draft Support

The dialog supports draft auto-save via the `DraftConfig` integration with `DialogComponent`. Drafts are keyed as `job:{id|new}`.

### Submission

- **Create mode:** `POST /api/v1/jobs` with `{ title, description?, trackTypeId, assigneeId?, customerId?, priority?, dueDate? }`. On success, the dialog closes and the board reloads. Returns 201 with the created `JobDetail`.
- **Edit mode:** `PUT /api/v1/jobs/{id}` with `{ title, description, assigneeId, customerId, priority, dueDate }`. The track type cannot be changed in edit mode. On success, the dialog closes and the board reloads.

## Edit Job Dialog

The edit dialog uses the same `JobDialogComponent` in `edit` mode. All fields are the same as create mode except:
- Track Type is not shown (cannot be changed after creation).
- The form is pre-populated with the existing job data.
- The submit button label changes to "Save Changes".

The edit dialog is reached by clicking the edit button in the job detail panel. The detail dialog closes first, then the edit dialog opens.

## Subtasks

Subtasks are checklist items within a job. They are displayed in the job detail panel's main content area.

### Display

- A section header shows "Subtasks" with a completion count (e.g., "3/5").
- Each subtask is a labeled checkbox with the subtask text. Completed subtasks receive the `subtask--done` class (strikethrough).
- Below the list, an inline add form provides an input field and an add button.

### Operations

| Operation | UI Element | API Call |
|-----------|-----------|----------|
| Toggle completion | Checkbox change | `PATCH /api/v1/jobs/{id}/subtasks/{subtaskId}` with `{ isCompleted }` |
| Add subtask | Input + Enter key or Add button | `POST /api/v1/jobs/{id}/subtasks` with `{ text }` |

Toggle is optimistic -- the checkbox state and `completedAt` timestamp update locally before the API call.

### Subtask Model

```typescript
interface Subtask {
  id: number;
  jobId: number;
  text: string;
  isCompleted: boolean;
  assigneeId: number | null;
  sortOrder: number;
  completedAt: Date | null;
}
```

Backend entity (`JobSubtask.cs`) additionally includes `CompletedById` (FK to the user who completed it).

## Job Links

Jobs can be linked to other jobs with a relationship type. Links are displayed in the "Linked Cards" section of the job detail panel.

### Link Types

| Value | Display Label | Icon | Description |
|-------|--------------|------|-------------|
| `RelatedTo` | related to | `link` | General association between jobs |
| `Blocks` | blocks | `block` | This job blocks the linked job |
| `BlockedBy` | blocked by | `block` | This job is blocked by the linked job |
| `Parent` | parent of | `account_tree` | Parent-child hierarchy |
| `Child` | child of | `account_tree` | Child-parent hierarchy (inverse of Parent) |
| `HandoffFrom` | -- | -- | Created by the R&D-to-production handoff feature |
| `HandoffTo` | -- | -- | Created by the R&D-to-production handoff feature |

The create-link form only offers three options for user-created links: RelatedTo, Blocks, and Parent. BlockedBy and Child are the inverse representations. HandoffFrom/HandoffTo are system-generated.

### Link Display

Each link row shows:
- Link type icon
- Link type label (human-readable)
- Linked job number (as an `EntityLinkComponent`, clickable)
- Linked job title
- Linked job stage chip (colored by stage color)
- Delete button (X icon)

### Adding a Link

1. User types in the search input (minimum 2 characters, debounced 300ms).
2. `KanbanService.searchJobs(term)` returns matching jobs.
3. Results are filtered to exclude the current job and already-linked jobs, limited to 8.
4. User clicks a result to select it.
5. User selects a link type from the dropdown (default: RelatedTo).
6. User clicks the Add button.
7. `POST /api/v1/jobs/{id}/links` with `{ targetJobId, linkType }`.

### Link Model

```typescript
interface JobLink {
  id: number;
  sourceJobId: number;
  targetJobId: number;
  linkType: string;
  linkedJobId: number;
  linkedJobNumber: string;
  linkedJobTitle: string;
  linkedJobStageName: string;
  linkedJobStageColor: string;
  createdAt: Date;
}
```

## Job Parts

Parts can be associated with jobs. The "Parts" section in the job detail panel shows associated parts and allows adding/removing them.

### Display

Each part row shows:
- Settings icon
- Part number (as an `EntityLinkComponent`, navigates to part detail)
- Part description
- Quantity (formatted as "x1", "x5", etc.)
- Remove button (X icon)

### Adding a Part

1. User types in the search input (minimum 2 characters, debounced 300ms).
2. `KanbanService.searchParts(term)` returns matching parts.
3. Results are filtered to exclude already-linked parts, limited to 8.
4. User clicks a result to select it.
5. User clicks the Add button.
6. `POST /api/v1/jobs/{id}/parts` with `{ partId, quantity: 1 }`.

### Removing a Part

Click the X button on a part row. Calls `DELETE /api/v1/jobs/{id}/parts/{jobPartId}`.

### JobPart Model

```typescript
interface JobPart {
  id: number;
  jobId: number;
  partId: number;
  partNumber: string;
  partDescription: string;
  partStatus: string;
  quantity: number;
  notes: string | null;
}
```

## BOM Explosion

When a job has a `partId` set and has no child jobs (`childJobCount === 0`), an "Explode BOM" button appears. Clicking it:

1. Opens a `ConfirmDialogComponent` (severity: warn) asking for confirmation, showing the part number.
2. On confirmation, calls `POST /api/v1/jobs/{id}/explode-bom`.
3. The API traverses the part's bill of materials and:
   - Creates child jobs for "Make" BOM entries (sub-assemblies that need manufacturing).
   - Identifies "Buy" items (materials that need purchasing).
   - Identifies "Stock" items (materials available from inventory).
4. A summary snackbar reports the results (e.g., "BOM exploded: 3 sub-jobs created, 5 buy items, 2 stock items.").
5. The job detail and child jobs list are reloaded.

### BOM Explosion Response

```typescript
interface BomExplosionResponse {
  parentJobId: number;
  createdJobs: BomExplosionChildJob[];
  buyItems: BomExplosionBuyItem[];
  stockItems: BomExplosionStockItem[];
}
```

## Sub-Jobs (Child Jobs)

When a job has child jobs (either from BOM explosion or manual `ParentJobId` assignment), they are displayed in a "Sub-Jobs" section. Each child job row shows:
- Job number (as an `EntityLinkComponent`)
- Job title
- Current stage (as a muted chip)

### ChildJob Model

```typescript
interface ChildJob {
  id: number;
  jobNumber: string;
  title: string;
  stage: string;
  partNumber: string | null;
  quantity: number | null;
  createdAt: Date;
}
```

## File Attachments

Files are managed via the `FileUploadZoneComponent` in the sidebar. The component handles drag-and-drop and click-to-browse uploads.

### Upload

Files are uploaded to `POST /api/v1/jobs/{jobId}/files` as multipart form data. After upload, the file list is refreshed from the API.

### Download

Clicking the download button opens the file URL (`/api/v1/files/{fileId}`) in a new tab.

### Delete

Clicking the delete button removes the file via `DELETE /api/v1/files/{fileId}`. The file is soft-deleted (MinIO object retained).

### File Icons

The detail panel maps content types to Material icons:
- `image/*` -- `image`
- `*pdf*` -- `picture_as_pdf`
- `*spreadsheet*` or `*excel*` -- `table_chart`
- `*word*` or `*document*` -- `description`
- Everything else -- `attach_file`

## Cover Photo

Jobs can have a cover photo displayed at the top of their card on the board. The cover photo is managed via a dedicated dialog.

### Cover Photo Upload Dialog

Opened from the camera icon button in the job detail header. The dialog (`CoverPhotoUploadDialogComponent`):

1. Loads all files attached to the job.
2. Filters to image files only (`contentType.startsWith('image/')`).
3. Displays existing images as selectable thumbnails.
4. Includes a `FileUploadZoneComponent` for uploading new images.
5. Selecting an image calls `PATCH /api/v1/jobs/{id}/cover-photo` with `{ fileAttachmentId }`.
6. A "Remove Cover" option calls the same endpoint with `{ fileAttachmentId: null }`.

## Activity Log

The activity section is rendered by the shared `EntityActivitySectionComponent` with `entityType="Job"`. It provides four filterable tabs:

- **All** -- combined feed of comments, notes, and history entries
- **Comments** -- user-submitted comments with @mention support
- **Notes** -- internal notes with rich text editing
- **History** -- automated change log entries (field changes, stage moves, assignment changes)

### Activity Model

```typescript
interface Activity {
  id: number;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  description: string;
  userInitials: string | null;
  userName: string | null;
  createdAt: Date;
}
```

### Notes

Job notes are separate from activity comments. They support:
- Creation via `POST /api/v1/jobs/{id}/notes` with `{ text, mentionedUserIds? }`
- Deletion via `DELETE /api/v1/jobs/{id}/notes/{noteId}`
- @mentions that trigger notifications

```typescript
interface JobNote {
  id: number;
  text: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  createdAt: Date;
  updatedAt: Date | null;
}
```

## Job Disposition

Disposition determines what happens to a job's output after completion. The disposition dialog (`DisposeJobDialogComponent`) opens from the "Dispose" button in the job detail sidebar.

### Disposition Dialog

| Field | Control | Validators | Required |
|-------|---------|-----------|----------|
| Disposition | `SelectComponent` | `required` | Yes |
| Notes | `TextareaComponent` | `maxLength(2000)` | No |

### Disposition Options

| Value | Display Label | Description |
|-------|--------------|-------------|
| `ShipToCustomer` | Ship to Customer | Output is shipped to the customer |
| `AddToInventory` | Add to Inventory | Output is added to stock inventory |
| `CapitalizeAsAsset` | Capitalize as Asset | Output is capitalized as a company asset (e.g., tooling) |
| `Scrap` | Scrap | Output is scrapped |
| `HoldForReview` | Hold for Review | Output is held pending further decision |

Submission calls `POST /api/v1/jobs/{id}/dispose` with `{ disposition, notes? }`. On success, the job detail is updated to show the disposition information.

## R&D Handoff to Production

Jobs on the R&D/Tooling track can be "handed off" to production, which creates a new job on the Production track linked to the original R&D job. The API endpoint is `POST /api/v1/jobs/{id}/handoff-to-production`. This creates a `HandoffFrom`/`HandoffTo` link pair between the two jobs.

## Status Lifecycle

The job detail sidebar includes a `StatusTimelineComponent` that manages the job's workflow status and holds.

### Workflow Statuses

Jobs transition through statuses defined by their track type's stages. Each status transition is recorded as a `StatusEntry` with timestamps, creating an audit trail.

### Holds

Jobs can be placed on hold at any time. Holds are displayed as:
- Active hold indicators on the job card (pause icon with tooltip).
- Hold entries in the status timeline with type and notes.

Holds are added via `AddHoldDialogComponent` and resolved through the status timeline UI. A job can have multiple concurrent active holds.

## Cost Analysis

The `JobCostTabComponent` provides a financial analysis of the job, visible in the detail panel.

### Cost Summary

Compares estimated vs actual costs across four categories:

| Category | Estimated | Actual | Variance |
|----------|----------|--------|----------|
| Material | From job estimates | From material issues | Actual - Estimated |
| Labor | From job estimates | From time entries x labor rates | Actual - Estimated |
| Burden | From job estimates | Calculated overhead | Actual - Estimated |
| Subcontract | From job estimates | From PO lines | Actual - Estimated |

Also displays:
- Quoted price
- Total estimated vs actual cost
- Variance percentage
- Actual margin and margin percentage

### Material Issues Table

A `DataTableComponent` listing all material issues (parts issued to the job):
- Part number and description
- Quantity and unit/total cost
- Issue type (Issue, Return, Scrap)
- Issue date and issuer
- Return button (for reversing an issue)

### Recalculate Costs

Admin/Manager users can trigger cost recalculation via `POST /api/v1/jobs/{id}/recalculate-costs`.

## Operation Time Analysis

The `OperationTimeTabComponent` shows per-operation time tracking data.

### Per-Operation Data

```typescript
interface OperationTimeAnalysis {
  operationId: number;
  operationName: string;
  operationSequence: number;
  estimatedSetupMinutes: number;
  estimatedRunMinutes: number;
  actualSetupMinutes: number;
  actualRunMinutes: number;
  actualTotalMinutes: number;
  setupVarianceMinutes: number;
  runVarianceMinutes: number;
  efficiencyPercent: number;
  entryCount: number;
}
```

Displayed as a `DataTableComponent` with columns for sequence number, operation name, estimated/actual setup and run times, total, efficiency percentage, and a visual progress bar. Efficiency is color-coded: green (>=100%), yellow (>=80%), red (<80%).

Summary row shows total estimated time, total actual time, and overall efficiency.

## Real-Time Sync (SignalR)

The board uses the `BoardHub` SignalR hub for real-time multi-user synchronization. When any user modifies a job on the board, all other users viewing the same board see the change automatically.

### Connection Lifecycle

1. `KanbanComponent.ngOnInit()` calls `boardHub.connect()` to establish a SignalR connection.
2. When a track type is selected, `boardHub.joinBoard(trackTypeId)` adds the connection to the SignalR group `board:{trackTypeId}`.
3. `KanbanComponent.ngOnDestroy()` calls `boardHub.disconnect()`.

### Server Hub Methods

The `BoardHub` (at `/hubs/board`) exposes:

| Method | Parameter | Description |
|--------|-----------|-------------|
| `JoinBoard` | `trackTypeId: int` | Subscribes to board events for a track type |
| `LeaveBoard` | `trackTypeId: int` | Unsubscribes from board events |
| `JoinJob` | `jobId: int` | Subscribes to job-specific events |
| `LeaveJob` | `jobId: int` | Unsubscribes from job-specific events |

### Client Event Handlers

The kanban component registers four event handlers:

| Event | Callback |
|-------|----------|
| `jobCreated` | Reloads the board |
| `jobMoved` | Reloads the board |
| `jobUpdated` | Reloads the board |
| `jobPositionChanged` | Reloads the board |

All four trigger a full board reload (fetch track type + jobs, rebuild columns). This is a deliberate simplicity choice -- partial updates would require complex state diffing.

### Server-Side Broadcasting

MediatR handlers for job operations inject `IHubContext<BoardHub>` and broadcast events to the relevant board group after `SaveChangesAsync()`:

```csharp
await boardHub.Clients.Group($"board:{trackTypeId}")
    .SendAsync("jobCreated", new BoardJobCreatedEvent(...), cancellationToken);
```

### Optimistic UI

Drag-and-drop operations update the local state immediately:
- **Stage moves:** `transferArrayItem` reorders arrays before the API call. On error, the move is reversed.
- **Position changes:** `moveItemInArray` reorders immediately, then API calls fire for each affected position.
- **Swimlane drops:** Both stage and assignee changes happen optimistically. On error, the entire board is reloaded.

## API Endpoints

### Jobs (`/api/v1/jobs`)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| GET | `/api/v1/jobs` | List jobs | Query: `trackTypeId`, `stageId`, `assigneeId`, `isArchived`, `search`, `customerId` | `JobListResponseModel[]` |
| GET | `/api/v1/jobs/{id}` | Get job detail | -- | `JobDetailResponseModel` |
| POST | `/api/v1/jobs` | Create job | `{ title, description?, trackTypeId, assigneeId?, customerId?, priority?, dueDate? }` | 201 + `JobDetailResponseModel` |
| PUT | `/api/v1/jobs/{id}` | Update job | `{ title, description, assigneeId, customerId, priority, dueDate, ... }` | `JobDetailResponseModel` |
| PATCH | `/api/v1/jobs/{id}/stage` | Move job to stage | `{ stageId }` | `JobDetailResponseModel` |
| PATCH | `/api/v1/jobs/{id}/position` | Update board position | `{ position }` | 204 |
| PATCH | `/api/v1/jobs/{id}/cover-photo` | Set/remove cover photo | `{ fileAttachmentId }` (null to remove) | 204 |
| POST | `/api/v1/jobs/{id}/dispose` | Dispose job | `{ disposition, notes? }` | `JobDetailResponseModel` |
| POST | `/api/v1/jobs/{id}/handoff-to-production` | R&D to production handoff | `{}` | 201 + `{ jobId }` |
| POST | `/api/v1/jobs/{id}/explode-bom` | Explode BOM into child jobs | `{}` | `BomExplosionResponseModel` |
| GET | `/api/v1/jobs/{id}/child-jobs` | List child jobs | -- | `ChildJobResponseModel[]` |
| GET | `/api/v1/jobs/internal-project-types` | List internal project types | -- | `ReferenceDataResponseModel[]` |
| GET | `/api/v1/jobs/calendar.ics` | Export jobs as iCal | Query: `assigneeId?`, `trackTypeId?` | `text/calendar` file |

### Subtasks (`/api/v1/jobs/{id}/subtasks`)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| GET | `/api/v1/jobs/{id}/subtasks` | List subtasks | -- | `SubtaskResponseModel[]` |
| POST | `/api/v1/jobs/{id}/subtasks` | Create subtask | `{ text }` | 201 + `SubtaskResponseModel` |
| PATCH | `/api/v1/jobs/{id}/subtasks/{subtaskId}` | Update subtask | `{ isCompleted }` | `SubtaskResponseModel` |

### Job Links (`/api/v1/jobs/{id}/links`)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| GET | `/api/v1/jobs/{id}/links` | List links | -- | `JobLinkResponseModel[]` |
| POST | `/api/v1/jobs/{id}/links` | Create link | `{ targetJobId, linkType }` | 201 + `JobLinkResponseModel` |
| DELETE | `/api/v1/jobs/{id}/links/{linkId}` | Delete link | -- | 204 |

### Job Parts (`/api/v1/jobs/{id}/parts`)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| GET | `/api/v1/jobs/{id}/parts` | List job parts | -- | `JobPartResponseModel[]` |
| POST | `/api/v1/jobs/{id}/parts` | Add part to job | `{ partId, quantity?, notes? }` | 201 + `JobPartResponseModel` |
| PATCH | `/api/v1/jobs/{id}/parts/{jobPartId}` | Update job part | `{ quantity, notes }` | `JobPartResponseModel` |
| DELETE | `/api/v1/jobs/{id}/parts/{jobPartId}` | Remove part from job | -- | 204 |

### Custom Fields (`/api/v1/jobs/{id}/custom-fields`)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| GET | `/api/v1/jobs/{id}/custom-fields` | Get custom field values | -- | `Record<string, unknown>` |
| PUT | `/api/v1/jobs/{id}/custom-fields` | Update custom field values | `{ values: Record<string, unknown> }` | `Record<string, unknown>` |

### Activity and Notes

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| GET | `/api/v1/jobs/{id}/activity` | Get activity log | -- | `ActivityResponseModel[]` |
| POST | `/api/v1/jobs/{id}/comments` | Add comment | `{ comment, mentionedUserIds? }` | `ActivityResponseModel` |
| GET | `/api/v1/jobs/{id}/notes` | List notes | -- | `JobNoteResponseModel[]` |
| POST | `/api/v1/jobs/{id}/notes` | Create note | `{ text, mentionedUserIds? }` | `JobNoteResponseModel` |
| DELETE | `/api/v1/jobs/{id}/notes/{noteId}` | Delete note | -- | 204 |
| GET | `/api/v1/jobs/{id}/history` | Get change history | -- | `ActivityResponseModel[]` |

### Job Costing

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| GET | `/api/v1/jobs/{id}/cost-summary` | Cost summary | -- | `JobCostSummaryModel` |
| GET | `/api/v1/jobs/{id}/material-issues` | Material issues | Query: `page`, `pageSize` | `MaterialIssueResponseModel[]` |
| POST | `/api/v1/jobs/{id}/material-issues` | Issue material | `{ partId, operationId?, quantity, ... }` | `MaterialIssueResponseModel` |
| POST | `/api/v1/jobs/{id}/material-issues/{issueId}/return` | Return material | -- | `MaterialIssueResponseModel` |
| POST | `/api/v1/jobs/{id}/recalculate-costs` | Recalculate costs | -- | 204 |
| GET | `/api/v1/jobs/{id}/operation-time-summary` | Operation time analysis | -- | `OperationTimeAnalysisModel[]` |

### Bulk Operations (`/api/v1/jobs/bulk`)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| PATCH | `/api/v1/jobs/bulk/stage` | Bulk move to stage | `{ jobIds, stageId }` | `BulkOperationResponseModel` |
| PATCH | `/api/v1/jobs/bulk/assign` | Bulk assign | `{ jobIds, assigneeId }` (null to unassign) | `BulkOperationResponseModel` |
| PATCH | `/api/v1/jobs/bulk/priority` | Bulk set priority | `{ jobIds, priority }` | `BulkOperationResponseModel` |
| PATCH | `/api/v1/jobs/bulk/archive` | Bulk archive | `{ jobIds }` | `BulkOperationResponseModel` |

### Track Types (`/api/v1/track-types`)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| GET | `/api/v1/track-types` | List all track types | -- | `TrackTypeResponseModel[]` |
| GET | `/api/v1/track-types/{id}` | Get track type with stages | -- | `TrackTypeResponseModel` |
| GET | `/api/v1/track-types/{id}/custom-fields` | Get custom field definitions | -- | `CustomFieldDefinitionModel[]` |
| PUT | `/api/v1/track-types/{id}/custom-fields` | Update custom field definitions | `{ definitions: [...] }` | `CustomFieldDefinitionModel[]` |

### Kanban Replenishment Cards (`/api/v1/kanban-cards`)

Note: This is a separate system from the job kanban board. It manages inventory replenishment kanban cards (pull-based inventory triggers).

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| GET | `/api/v1/kanban-cards` | List replenishment cards | Query: `workCenterId?`, `partId?`, `status?`, `page`, `pageSize` | Paginated cards |
| GET | `/api/v1/kanban-cards/{id}` | Get card detail | -- | `KanbanCardDetailResponseModel` |
| POST | `/api/v1/kanban-cards` | Create card (Admin/Manager) | `CreateKanbanCardRequestModel` | 201 + `KanbanCardResponseModel` |
| PUT | `/api/v1/kanban-cards/{id}` | Update card (Admin/Manager) | `UpdateKanbanCardRequestModel` | `KanbanCardResponseModel` |
| DELETE | `/api/v1/kanban-cards/{id}` | Delete card (Admin/Manager) | -- | 204 |
| POST | `/api/v1/kanban-cards/{id}/trigger` | Trigger replenishment | `TriggerKanbanReplenishmentRequestModel` | 204 |
| POST | `/api/v1/kanban-cards/{id}/confirm` | Confirm replenishment | `ConfirmKanbanReplenishmentRequestModel` | 204 |
| GET | `/api/v1/kanban-cards/triggered` | List triggered cards | -- | `KanbanCardResponseModel[]` |
| GET | `/api/v1/kanban-cards/board` | Get board by work center | -- | `KanbanBoardWorkCenterResponseModel[]` |

## Enums

### JobPriority

| Value | Color | Description |
|-------|-------|-------------|
| `Low` | `#94a3b8` (slate) | Low-priority work, done when capacity allows |
| `Normal` | `#0d9488` (teal) | Standard priority (default) |
| `High` | `#f59e0b` (amber) | Elevated priority, should be addressed soon |
| `Urgent` | `#dc2626` (red) | Critical priority, needs immediate attention |

### JobDisposition

| Value | Label | Description |
|-------|-------|-------------|
| `ShipToCustomer` | Ship to Customer | Job output shipped to the customer |
| `AddToInventory` | Add to Inventory | Job output added to stock |
| `CapitalizeAsAsset` | Capitalize as Asset | Job output recorded as a capital asset |
| `Scrap` | Scrap | Job output scrapped |
| `HoldForReview` | Hold for Review | Job output held for further decision |

### JobLinkType

| Value | Inverse | Description |
|-------|---------|-------------|
| `RelatedTo` | `RelatedTo` | Symmetric general association |
| `Blocks` | `BlockedBy` | This job prevents the linked job from progressing |
| `BlockedBy` | `Blocks` | This job is prevented from progressing by the linked job |
| `Parent` | `Child` | This job is the parent of the linked job |
| `Child` | `Parent` | This job is a child of the linked job |
| `HandoffFrom` | `HandoffTo` | This job was created from an R&D handoff |
| `HandoffTo` | `HandoffFrom` | This R&D job was handed off to create the linked production job |

### AccountingDocumentType (on JobStage)

Used to link stages to accounting documents for irreversibility:
- `Estimate` -- linked to QB Estimate
- `SalesOrder` -- linked to QB Sales Order
- `Invoice` -- linked to QB Invoice
- `Payment` -- linked to QB Payment

## Job Entity (Backend)

The `Job` entity (`forge.core/Entities/Job.cs`) extends `BaseAuditableEntity` and includes:

### Core Fields

| Property | Type | Description |
|----------|------|-------------|
| `JobNumber` | string | Auto-generated unique identifier (e.g., "J-00042") |
| `Title` | string | User-provided job title |
| `Description` | string? | Optional job description |
| `TrackTypeId` | int | FK to the track type |
| `CurrentStageId` | int | FK to the current stage |
| `AssigneeId` | int? | FK to the assigned user |
| `Priority` | JobPriority | Enum: Low, Normal, High, Urgent |
| `CustomerId` | int? | FK to the customer |
| `DueDate` | DateTimeOffset? | Target completion date |
| `StartDate` | DateTimeOffset? | Actual start date |
| `CompletedDate` | DateTimeOffset? | Actual completion date |
| `IsArchived` | bool | Soft archive flag (archived jobs hidden from board) |
| `BoardPosition` | int | Sort position within a column |

### Hierarchy and Relationships

| Property | Type | Description |
|----------|------|-------------|
| `PartId` | int? | FK to the primary part being manufactured |
| `ParentJobId` | int? | FK to parent job (for sub-jobs) |
| `SalesOrderLineId` | int? | FK to the sales order line that created this job |
| `MrpPlannedOrderId` | int? | FK to MRP planned order |

### Accounting Integration

| Property | Type | Description |
|----------|------|-------------|
| `ExternalId` | string? | ID in the external accounting system |
| `ExternalRef` | string? | Reference number (e.g., invoice number) |
| `Provider` | string? | Accounting provider name (e.g., "QuickBooks") |

### R&D Tracking

| Property | Type | Description |
|----------|------|-------------|
| `IterationCount` | int | Number of R&D iterations |
| `IterationNotes` | string? | Notes about the current iteration |

### Internal Projects

| Property | Type | Description |
|----------|------|-------------|
| `IsInternal` | bool | Whether this is an internal (non-customer) job |
| `InternalProjectTypeId` | int? | FK to reference data for internal project type |

### Job Costing

| Property | Type | Description |
|----------|------|-------------|
| `EstimatedMaterialCost` | decimal | Estimated material cost |
| `EstimatedLaborCost` | decimal | Estimated labor cost |
| `EstimatedBurdenCost` | decimal | Estimated overhead/burden cost |
| `EstimatedSubcontractCost` | decimal | Estimated subcontract cost |
| `EstimatedTotalCost` | decimal | Computed sum of all estimated costs |
| `QuotedPrice` | decimal | Price quoted to the customer |
| `EstimatedMarginPercent` | decimal | Computed margin percentage |

### Disposition

| Property | Type | Description |
|----------|------|-------------|
| `Disposition` | JobDisposition? | What happened to the job output |
| `DispositionNotes` | string? | Notes about the disposition |
| `DispositionAt` | DateTimeOffset? | When disposition was recorded |

### Other

| Property | Type | Description |
|----------|------|-------------|
| `CustomFieldValues` | string? | JSONB column for track-type-specific custom fields |
| `CoverPhotoFileId` | int? | FK to the file attachment used as cover photo |

### Navigation Properties

The Job entity has navigation properties to: `Part`, `ParentJob`, `ChildJobs`, `TrackType`, `CurrentStage`, `Customer`, `Subtasks`, `ActivityLogs`, `PlanningCycleEntries`, `SalesOrderLine`, `PurchaseOrders`, `JobParts`, `MrpPlannedOrder`, `Notes`, `MaterialIssues`, `CoverPhotoFile`.

## Component Architecture

```
KanbanComponent (smart)
├── PageHeaderComponent (shared)
├── BoardColumnComponent (per stage, board view)
│   ├── JobCardComponent (per job)
│   └── EmptyStateComponent (when empty)
├── JobCardComponent (swimlane view, rendered inline)
├── AvatarComponent (swimlane user labels)
├── SelectComponent (team member filter)
├── JobDialogComponent (create/edit)
│   └── DialogComponent (shared shell)
├── JobDetailDialogComponent (MatDialog wrapper)
│   └── JobDetailPanelComponent (full detail view)
│       ├── AvatarComponent
│       ├── FileUploadZoneComponent
│       ├── InputComponent
│       ├── SelectComponent
│       ├── EntityLinkComponent
│       ├── EntityActivitySectionComponent
│       ├── StatusTimelineComponent
│       ├── BarcodeInfoComponent
│       ├── JobCostTabComponent
│       │   └── DataTableComponent
│       └── OperationTimeTabComponent
│           └── DataTableComponent
├── DisposeJobDialogComponent (MatDialog)
│   └── DialogComponent (shared shell)
├── CoverPhotoUploadDialogComponent (MatDialog)
│   └── FileUploadZoneComponent
├── ConfirmDialogComponent (bulk archive, BOM explosion)
└── Bulk Action Bar (inline in template)
```

### Services

| Service | Scope | Purpose |
|---------|-------|---------|
| `KanbanService` | `providedIn: 'root'` | All job/board/subtask/link/part/file/BOM API calls |
| `JobCostService` | `providedIn: 'root'` | Job costing, material issues, operation time, profitability |
| `BoardHubService` | `providedIn: 'root'` (shared) | SignalR connection for board events |
| `LoadingService` | `providedIn: 'root'` (shared) | Global loading overlay for board/track type loads |
| `ScannerService` | `providedIn: 'root'` (shared) | Barcode/NFC scanner input detection |
| `DetailDialogService` | `providedIn: 'root'` (shared) | URL-synced dialog opener |
| `TimeTrackingService` | `providedIn: 'root'` (shared) | Timer start/stop from job detail |
