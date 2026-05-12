# Status Lifecycle

## Overview

The status lifecycle system provides polymorphic workflow tracking and hold management for any entity in the application. It uses a single `StatusEntry` table with `EntityType`/`EntityId` columns to associate status records with jobs, parts, purchase orders, sales orders, or any other entity type. Status entries are divided into two categories:

- **Workflow** -- The current state of an entity in its process (e.g., "In Production", "Shipped", "Invoiced"). Only one workflow status can be active at a time per entity. Setting a new workflow status automatically closes the previous one.
- **Hold** -- A blocking condition applied to an entity (e.g., "Material Hold", "QC Hold", "Customer Hold"). Multiple holds can be active simultaneously. Holds are independent of the workflow status and must be explicitly released.

The frontend provides three components: `StatusTimelineComponent` (displays active status, holds, and history), `SetStatusDialogComponent` (sets a new workflow status), and `AddHoldDialogComponent` (adds a new hold).

---

## StatusEntry Entity

**Location:** `forge-api/forge.core/Entities/StatusEntry.cs`

Extends `BaseAuditableEntity` (inherits `Id`, `CreatedAt`, `UpdatedAt`, `DeletedAt`, `DeletedBy`, `CreatedBy`).

| Property | Type | Description |
|----------|------|-------------|
| `EntityType` | `string` | Polymorphic entity type (e.g., `"job"`, `"purchase-order"`, `"sales-order"`) |
| `EntityId` | `int` | ID of the associated entity |
| `StatusCode` | `string` | Machine-readable status code (from reference data) |
| `StatusLabel` | `string` | Human-readable status label (resolved from reference data, fallback to code) |
| `Category` | `string` | `"workflow"` or `"hold"` |
| `StartedAt` | `DateTimeOffset` | When this status became active |
| `EndedAt` | `DateTimeOffset?` | When this status was closed (null = active) |
| `Notes` | `string?` | Optional notes (for holds, release notes are appended with `---` separator) |
| `SetById` | `int?` | User who set this status |

### Active Status Rules

- **Workflow:** Exactly one active entry per entity (where `Category == "workflow"` and `EndedAt == null`). Setting a new workflow status closes the current one.
- **Hold:** Zero or more active entries per entity (where `Category == "hold"` and `EndedAt == null`). Duplicate hold types (same `StatusCode`) on the same entity are rejected.

---

## API Endpoints

**Controller:** `forge-api/forge.api/Controllers/StatusTrackingController.cs`

Route prefix: `/api/v1/status-tracking`. All endpoints require `[Authorize]`.

| Method | Route | Description | Response |
|--------|-------|-------------|----------|
| `GET` | `/{entityType}/{entityId}/history` | Full status history (workflow + holds) | `List<StatusEntryResponseModel>` |
| `GET` | `/{entityType}/{entityId}/active` | Current workflow status + active holds | `ActiveStatusResponseModel` |
| `POST` | `/{entityType}/{entityId}/workflow` | Set a new workflow status | `StatusEntryResponseModel` |
| `POST` | `/{entityType}/{entityId}/holds` | Add a new hold | `201 Created` + `StatusEntryResponseModel` |
| `POST` | `/holds/{id}/release` | Release an active hold | `StatusEntryResponseModel` |

### ActiveStatusResponseModel

```typescript
interface ActiveStatus {
  workflowStatus: StatusEntry | null;  // Current active workflow (may be null if none set)
  activeHolds: StatusEntry[];          // All active holds (EndedAt == null)
}
```

---

## MediatR Handlers

All handlers live in `forge-api/forge.api/Features/StatusTracking/`.

### SetWorkflowStatus

**Command:** `SetWorkflowStatusCommand(EntityType, EntityId, SetStatusRequestModel)`

**Behavior:**
1. Finds all active workflow entries for the entity (`Category == "workflow"` and `EndedAt == null`).
2. Closes each by setting `EndedAt = DateTimeOffset.UtcNow`.
3. Resolves the status label from the `reference_data` table (falls back to the status code if no matching reference data is found).
4. Creates a new `StatusEntry` with `Category = "workflow"`, `StartedAt = now`, `EndedAt = null`.
5. Saves and returns the new entry with `SetBy` user information.

**Validation (FluentValidation):**
- `EntityType`: not empty, max 50 characters
- `EntityId`: greater than 0
- `StatusCode`: not empty, max 50 characters
- `Notes`: max 2000 characters (when provided)

### AddHold

**Command:** `AddHoldCommand(EntityType, EntityId, AddHoldRequestModel)`

**Behavior:**
1. Checks for an existing active hold with the same `StatusCode` on the same entity. If found, throws `InvalidOperationException` (prevents duplicate holds of the same type).
2. Resolves the status label from `reference_data`.
3. Creates a new `StatusEntry` with `Category = "hold"`, `StartedAt = now`, `EndedAt = null`.
4. Saves and returns the new entry.

**Validation:** Same rules as SetWorkflowStatus.

### ReleaseHold

**Command:** `ReleaseHoldCommand(StatusEntryId, ReleaseHoldRequestModel?)`

**Behavior:**
1. Loads the `StatusEntry` by ID. Throws `KeyNotFoundException` if not found.
2. Validates that the entry is an active hold (`Category == "hold"` and `EndedAt == null`). Throws `InvalidOperationException` otherwise.
3. Sets `EndedAt = DateTimeOffset.UtcNow`.
4. If release notes are provided, appends them to existing notes with a `\n---\nRelease: ` separator. If no existing notes, uses the release notes directly.
5. Saves and returns the updated entry.

### GetStatusHistory

**Query:** `GetStatusHistoryQuery(EntityType, EntityId)`

Returns all status entries for an entity (both workflow and hold), ordered chronologically. Includes `SetByName` resolved from the user who created each entry.

### GetActiveStatus

**Query:** `GetActiveStatusQuery(EntityType, EntityId)`

Returns the current active workflow status (single entry where `Category == "workflow"` and `EndedAt == null`) and all active holds (entries where `Category == "hold"` and `EndedAt == null`).

---

## Request/Response Models

### SetStatusRequest (Frontend)

```typescript
interface SetStatusRequest {
  statusCode: string;   // Reference data code
  notes?: string;       // Optional notes
}
```

### AddHoldRequest (Frontend)

```typescript
interface AddHoldRequest {
  statusCode: string;   // Reference data code for hold type
  notes?: string;       // Optional reason for the hold
}
```

### ReleaseHoldRequest (Frontend)

```typescript
interface ReleaseHoldRequest {
  notes?: string;       // Optional release notes
}
```

### StatusEntry (Frontend)

```typescript
interface StatusEntry {
  id: number;
  entityType: string;
  entityId: number;
  statusCode: string;
  statusLabel: string;
  category: 'workflow' | 'hold';
  startedAt: Date;
  endedAt: Date | null;
  notes: string | null;
  setById: number | null;
  setByName: string | null;
  createdAt: Date;
}
```

---

## Reference Data Integration

Status codes and hold types are managed through the centralized `reference_data` table. Each entity type has two reference data groups:

| Group Code Pattern | Category | Example |
|-------------------|----------|---------|
| `{entityType}_workflow_status` | Workflow statuses | `job_workflow_status` |
| `{entityType}_hold_type` | Hold types | `job_hold_type` |

The `StatusTimelineComponent` loads these reference data groups on initialization to populate the status and hold type dropdowns. The `AdminService.getReferenceData()` call retrieves all groups, and the component filters by the relevant group codes.

When a status is set, the handler resolves the `StatusLabel` from the reference data `Label` field (matching by `Code` where `IsActive == true`). If no matching reference data entry is found, the status code itself is used as the label.

---

## Frontend Services

### StatusTrackingService

**Location:** `forge-ui/src/app/shared/services/status-tracking.service.ts`

HTTP service (`providedIn: 'root'`) that wraps all status tracking API calls.

| Method | Parameters | Returns | API Call |
|--------|-----------|---------|----------|
| `getHistory` | `entityType, entityId` | `Observable<StatusEntry[]>` | `GET /{entityType}/{entityId}/history` |
| `getActiveStatus` | `entityType, entityId` | `Observable<ActiveStatus>` | `GET /{entityType}/{entityId}/active` |
| `setWorkflowStatus` | `entityType, entityId, request` | `Observable<StatusEntry>` | `POST /{entityType}/{entityId}/workflow` |
| `addHold` | `entityType, entityId, request` | `Observable<StatusEntry>` | `POST /{entityType}/{entityId}/holds` |
| `releaseHold` | `holdId, request?` | `Observable<StatusEntry>` | `POST /holds/{holdId}/release` |

---

## Frontend Components

### StatusTimelineComponent

**Location:** `forge-ui/src/app/shared/components/status-timeline/`

Displays the active workflow status, active holds, and full status history for any entity. Provides buttons to set a new status, add a hold, or release an existing hold.

**Inputs:**

| Input | Type | Description |
|-------|------|-------------|
| `entityType` | `string` (required) | Entity type for API calls |
| `entityId` | `number` (required) | Entity ID for API calls |

**Behavior:**

1. On initialization (or when `entityType`/`entityId` change), loads:
   - Status history and active status via `StatusTrackingService` (parallel `forkJoin`)
   - Reference data options for workflow statuses and hold types via `AdminService.getReferenceData()`
2. Displays the current active workflow status prominently.
3. Lists active holds with release buttons.
4. Shows the full chronological history of all workflow transitions and hold events.
5. Uses `LoadingBlockDirective` for section-level loading state.

**Actions:**

| Button | Opens | Purpose |
|--------|-------|---------|
| Set Status | `SetStatusDialogComponent` | Change the workflow status |
| Add Hold | `AddHoldDialogComponent` | Apply a new hold |
| Release (per hold) | `ConfirmDialogComponent` | Confirm and release a specific hold |

After any action succeeds, the component reloads the full status data and shows a success snackbar.

### SetStatusDialogComponent

**Location:** `forge-ui/src/app/shared/components/set-status-dialog/`

A `MatDialog`-based form for selecting a new workflow status.

**Dialog data:**

```typescript
interface SetStatusDialogData {
  entityType: string;
  entityId: number;
  currentStatusCode?: string;   // Highlighted as current
  statusOptions: SelectOption[];  // Available workflow statuses from reference data
}
```

**Form fields:**
- **Status** (required) -- `<app-select>` populated with workflow status options
- **Notes** (optional) -- `<app-textarea>` for transition notes, max 2000 characters

**Validation:** Uses `FormValidationService.getViolations()` with `ValidationPopoverDirective` on the save button. Save button is disabled while the form is invalid or saving.

**On save:** Calls `StatusTrackingService.setWorkflowStatus()`. Closes the dialog with the created `StatusEntry` on success.

### AddHoldDialogComponent

**Location:** `forge-ui/src/app/shared/components/add-hold-dialog/`

A `MatDialog`-based form for adding a hold to an entity.

**Dialog data:**

```typescript
interface AddHoldDialogData {
  entityType: string;
  entityId: number;
  holdOptions: SelectOption[];  // Available hold types from reference data
}
```

**Form fields:**
- **Hold Type** (required) -- `<app-select>` populated with hold type options
- **Reason** (optional) -- `<app-textarea>` for hold reason, max 2000 characters

**Validation:** Same pattern as `SetStatusDialogComponent`.

**On save:** Calls `StatusTrackingService.addHold()`. Closes the dialog with the created `StatusEntry` on success.

---

## Workflow vs Hold Comparison

| Aspect | Workflow | Hold |
|--------|----------|------|
| Category value | `"workflow"` | `"hold"` |
| Active entries per entity | Exactly one (or zero if never set) | Zero or more |
| Setting a new one | Automatically closes the current | Independent; does not affect others |
| Duplicate check | Previous is closed, not rejected | Same status code on same entity is rejected |
| Release mechanism | Replaced by setting a new status | Explicit release via `POST /holds/{id}/release` |
| Release notes | N/A (new status has its own notes) | Appended to existing notes with separator |
| Reference data group | `{entityType}_workflow_status` | `{entityType}_hold_type` |
| UI trigger | "Set Status" button | "Add Hold" button |
| UI release | N/A | "Release" button per hold |

---

## Entity Types Using Status Tracking

The system is designed to be polymorphic and can be used by any entity. The `entityType` string is freeform but should match the reference data group naming convention. Typical entity types include:

- `job` -- Production job workflow (Quote Requested through Payment Received)
- `purchase-order` -- PO lifecycle (Draft, Submitted, Acknowledged, Received, Closed)
- `sales-order` -- SO lifecycle (Draft, Confirmed, In Production, Shipped, Invoiced)
- `shipment` -- Shipment tracking (Pending, In Transit, Delivered)
- `part` -- Part lifecycle (Draft, Prototype, Active, Obsolete)

---

## Usage Example

Embedding the status timeline in a detail panel:

```html
<app-status-timeline
  [entityType]="'job'"
  [entityId]="job().id" />
```

The component is self-contained: it loads its own data, manages its own loading state, and opens dialogs for status changes. No additional wiring is needed from the parent component.

---

## Key Files

| File | Purpose |
|------|---------|
| `forge-api/forge.core/Entities/StatusEntry.cs` | Polymorphic status entry entity |
| `forge-api/forge.api/Controllers/StatusTrackingController.cs` | REST API for status tracking |
| `forge-api/forge.api/Features/StatusTracking/SetWorkflowStatus.cs` | Set workflow status handler |
| `forge-api/forge.api/Features/StatusTracking/AddHold.cs` | Add hold handler |
| `forge-api/forge.api/Features/StatusTracking/ReleaseHold.cs` | Release hold handler |
| `forge-api/forge.api/Features/StatusTracking/GetStatusHistory.cs` | Get full history handler |
| `forge-api/forge.api/Features/StatusTracking/GetActiveStatus.cs` | Get active status + holds handler |
| `forge-ui/src/app/shared/services/status-tracking.service.ts` | Frontend HTTP service |
| `forge-ui/src/app/shared/components/status-timeline/status-timeline.component.ts` | Timeline display + action triggers |
| `forge-ui/src/app/shared/components/set-status-dialog/set-status-dialog.component.ts` | Workflow status change dialog |
| `forge-ui/src/app/shared/components/add-hold-dialog/add-hold-dialog.component.ts` | Hold creation dialog |
| `forge-ui/src/app/shared/models/status-entry.model.ts` | Frontend `StatusEntry` interface |
| `forge-ui/src/app/shared/models/active-status.model.ts` | Frontend `ActiveStatus` interface |
| `forge-ui/src/app/shared/models/set-status-request.model.ts` | `SetStatusRequest` interface |
| `forge-ui/src/app/shared/models/add-hold-request.model.ts` | `AddHoldRequest` interface |
| `forge-ui/src/app/shared/models/release-hold-request.model.ts` | `ReleaseHoldRequest` interface |
