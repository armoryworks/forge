# Purchase Orders

## Overview

Purchase Orders (POs) manage the procurement lifecycle from draft through receiving and closure. Each PO is associated with a vendor and contains one or more line items, each referencing a part from the parts catalog. The system tracks ordered vs. received quantities per line, supports partial receiving, and automatically transitions PO status based on receiving activity.

POs support two modes:
- **Standard POs** -- one-time orders with fixed line quantities.
- **Blanket POs** -- long-term agreements with a total committed quantity, released incrementally via the release sub-system.

POs optionally link to a job (`JobId`), connecting the procurement workflow to the production kanban board. When a job moves to the "Materials Ordered" stage on the kanban board, it typically corresponds to a PO being submitted for that job.

## Route

| Path | Component | Lazy-loaded |
|------|-----------|-------------|
| `/purchase-orders` | `PurchaseOrdersComponent` | Yes |

**Access roles:** Admin, Manager, OfficeManager (enforced on both the `PurchaseOrdersController` and the Angular route guard).

**URL state:**
- `?detail=purchase-order:{id}` -- opens the PO detail dialog for the specified purchase order. Set automatically when a row is clicked, cleared on dialog close. Survives page refresh and is shareable as a direct link.

## Page Layout

The page is a full-height flex column with three zones:

1. **Page header** (`PageHeaderComponent`) -- title "Purchase Orders" with subtitle, and "New PO" button.
2. **Filter bar** -- search input, vendor dropdown, and status dropdown.
3. **Content area** -- a `DataTableComponent` showing all POs matching the current filters. Loading state uses `LoadingBlockDirective` on the table wrapper.

### Toolbar Controls

| Control | Type | Purpose |
|---------|------|---------|
| Search | `InputComponent` | Free-text filter. Triggers on Enter key |
| Vendor | `SelectComponent` | Filter by vendor. Options loaded from `GET /api/v1/vendors/dropdown` |
| Status | `SelectComponent` | Filter by PO status. Static options: All, Draft, Submitted, Acknowledged, Partially Received, Received, Closed, Cancelled |
| New PO | Button (primary) | Opens the PO create dialog |

## PO List

The PO list renders via `DataTableComponent` with `tableId="purchase-orders"`. Supports all standard DataTable features: column sorting, per-column filtering, column visibility/reorder, and preference persistence.

Rows are clickable (`[clickableRows]="true"`). Clicking a row opens the PO detail dialog via `DetailDialogService`.

### Columns

| Field | Header | Type | Sortable | Filterable | Width | Notes |
|-------|--------|------|----------|------------|-------|-------|
| `poNumber` | PO # | text | Yes | No | 120px | Styled as `.po-number` |
| `vendorName` | Vendor | text | Yes | No | auto | Vendor company name |
| `jobNumber` | Job | text | Yes | No | 100px | Em-dash when null |
| `status` | Status | enum | Yes | Yes | 140px | Chip with status-specific coloring |
| `lineCount` | Lines | number | Yes | No | 70px | Center-aligned |
| `totalOrdered` | Ordered | number | Yes | No | 90px | Center-aligned total ordered qty |
| `totalReceived` | Received | number | Yes | No | 90px | Center-aligned total received qty |
| `expectedDeliveryDate` | Expected | date | Yes | No | 110px | Formatted `MM/dd/yyyy`, em-dash when null |
| `createdAt` | Created | date | Yes | No | 110px | Formatted `MM/dd/yyyy` |

**Empty state:** Icon `description` with message "No purchase orders found."

**Status chip colors:**

| Status | Chip Class | Description |
|--------|-----------|-------------|
| Draft | `chip--muted` | PO created but not yet sent to vendor |
| Submitted | `chip--info` | PO sent to vendor, awaiting acknowledgment |
| Acknowledged | `chip--primary` | Vendor confirmed receipt of PO |
| PartiallyReceived | `chip--warning` | Some (not all) line items received |
| Received | `chip--success` | All line items fully received |
| Closed | `chip--muted` | PO completed and closed out |
| Cancelled | `chip--error` | PO cancelled |

### Filters

Filters are applied server-side. The list endpoint accepts `vendorId`, `jobId`, `status`, and `search` query parameters.

- **Search** -- free-text match against PO number, vendor name, etc.
- **Vendor** -- dropdown populated from `GET /api/v1/vendors/dropdown`. Default: "All Vendors."
- **Status** -- dropdown with all `PurchaseOrderStatus` enum values. Default: "All Statuses."

## PO Detail Dialog

Opened via `DetailDialogService.open()` as a full `MatDialog`. The URL updates to `?detail=purchase-order:{id}`. The dialog wraps `PoDetailPanelComponent`, which fetches the full PO detail from the API on load.

### Header

Displays the `description` material icon, PO number as the primary title, and vendor name as a clickable `EntityLinkComponent` (type `vendor`). Action button: **Close** (X icon).

### Info Section

A read-only grid of PO metadata:

| Field | Display Condition | Notes |
|-------|-------------------|-------|
| Status | Always | Colored chip |
| Job | When `jobNumber` is present | Rendered as `EntityLinkComponent` (type `job`) when `jobId` is present |
| Expected Delivery | When present | Formatted `MM/dd/yyyy` |
| Submitted | When present | Date the PO was submitted to vendor |
| Acknowledged | When present | Date the vendor acknowledged the PO |
| Received | When present | Date all items were received |

### Blanket PO Section

Rendered only when `po.isBlanket` is true. Shows additional fields:

| Field | Notes |
|-------|-------|
| Type | "Blanket PO" chip (primary) |
| Total Qty | Total committed quantity |
| Released | Quantity released so far |
| Remaining | Computed: `totalQty - releasedQty` |
| Agreed Price | Agreed unit price (currency formatted) |
| Expires | Blanket expiration date |

### Barcode Section

Renders `BarcodeInfoComponent` with `entityType="PurchaseOrder"`, showing the PO number as a scannable barcode. Compact mode.

### Notes Section

Displayed when `po.notes` is present. Read-only pre-formatted text.

### Line Items Section

A hand-built `<table>` (not DataTable) showing all PO line items:

| Column | Alignment | Notes |
|--------|-----------|-------|
| Part # | left | Monospace font |
| Description | left | Line item description |
| Ordered | right | Ordered quantity |
| Received | right | Color-coded: green when fully received, yellow/warning when partially received |
| Unit Price | right | Currency formatted |
| Total | right | `orderedQuantity * unitPrice`, currency formatted |

### Releases Section (Blanket POs Only)

Rendered only for blanket POs. Shows a `DataTableComponent` with `tableId="po-blanket-releases"` listing all releases. A "New Release" button opens the create release dialog.

**Release columns:**

| Field | Header | Width | Type | Notes |
|-------|--------|-------|------|-------|
| `releaseNumber` | # | 60px | number | Auto-incremented |
| `partNumber` | Part | 120px | text | Monospace |
| `quantity` | Qty | 80px | number | Right-aligned |
| `requestedDeliveryDate` | Req. Delivery | 120px | date | `MM/dd/yyyy` |
| `status` | Status | 110px | enum | Colored chip |

**Release status colors:**

| Status | Chip Class |
|--------|-----------|
| Open | `chip--info` |
| Sent | `chip--primary` |
| PartialReceived | `chip--warning` |
| Received | `chip--success` |
| Cancelled | `chip--error` |

### Timestamps

Created and Updated dates displayed at the bottom, formatted `MM/dd/yyyy`.

### Action Buttons

Action buttons are conditionally rendered based on the current PO status:

| Action | Button Style | Visible When | data-testid | Behavior |
|--------|-------------|--------------|-------------|----------|
| Submit | Primary | `Draft` | `po-submit-btn` | Transitions to `Submitted`, sets `submittedDate` |
| Acknowledge | Primary | `Submitted` | `po-acknowledge-btn` | Transitions to `Acknowledged`, sets `acknowledgedDate` |
| Receive Items | Primary | `Acknowledged` or `PartiallyReceived` | `po-receive-btn` | Opens the receive dialog |
| Close | Default | `Received` | `po-close-btn` | Transitions to `Closed` |
| Cancel | Default | `Draft`, `Submitted`, or `Acknowledged` | `po-cancel-btn` | Opens confirm dialog, then transitions to `Cancelled` |
| Delete | Danger | `Draft` only | `po-delete-btn` | Opens confirm dialog, soft-deletes the PO |

### Activity Section

`EntityActivitySectionComponent` with `entityType="PurchaseOrder"` renders the chronological activity log at the bottom of the detail panel.

## Create PO Dialog

The create dialog uses `PoDialogComponent` with `<app-dialog>` at `width="1000px"` and `splitLayout="true"`. Supports draft auto-save (`entityType: 'purchase-order'`, `entityId: 'new'`).

### Layout

**Main section (left):** Line items table and add-line form.
**Sidebar (right):** Order details (vendor, job ID), notes, and summary.

### Sidebar Fields

| Field | Control | FormControl | Validators | data-testid | Notes |
|-------|---------|-------------|-----------|-------------|-------|
| Vendor | `SelectComponent` | `vendorId` | `Validators.required` | `po-vendor` | Options from `GET /api/v1/vendors/dropdown` |
| Job ID | `InputComponent` (number) | `jobId` | none | `po-job-id` | Optional job link |
| Notes | `TextareaComponent` | `notes` | none | -- | 3 rows |

**Summary section:** Displays the computed line total (subtotal) as currency.

### Line Items

Lines are managed via a signal-based array (`lines` signal), not a FormArray. Each line entry contains:

| Field | Type | Description |
|-------|------|-------------|
| `partId` | number | Part ID from the catalog |
| `partNumber` | string | Display part number |
| `description` | string | Part description |
| `orderedQuantity` | number | Quantity to order |
| `unitPrice` | number | Unit price |

**Add-line form** (4-column inline row):

| Field | Control | Validators | data-testid | Notes |
|-------|---------|-----------|-------------|-------|
| Part | `AutocompleteComponent` | `Validators.required` | `po-line-part` | Options from `GET /api/v1/parts` (excluding assemblies). Format: "PartNumber -- Description" |
| Qty | `InputComponent` (number) | `required`, `min(1)` | `po-line-qty` | Default: 1 |
| Price | `InputComponent` (number) | `required`, `min(0)` | `po-line-price` | Default: 0. Auto-fills from part's `defaultPrice` when a part is selected |
| Add | Button (sm) | -- | `po-add-line-btn` | Disabled when line form is invalid |

**Price auto-fill behavior:** When a part is selected and that part has a `defaultPrice`, the unit price field is automatically populated and a "LIST" badge appears next to the price field (with tooltip "List price -- edit to override"). Manually editing the price clears the badge. This helps users start from the catalog price while allowing overrides.

**Lines table** (shown when at least one line exists):

| Column | Alignment | Notes |
|--------|-----------|-------|
| Part # | left | Monospace |
| Description | left | |
| Qty | right | |
| Unit Price | right | Currency |
| Total | right | `qty * unitPrice`, currency |
| Actions | -- | Remove button (danger icon-btn with `close` icon) |

Footer row shows the grand total.

**Empty state:** "No line items added yet" message when no lines exist.

### Validation

The save button uses a computed `violations` signal that combines:
1. Standard `FormValidationService` violations from the header form (vendor is required).
2. A custom check: "At least one line item is required" when `lines().length === 0`.

The save button is disabled when `form.invalid || lines().length === 0 || saving()`.

### Save Behavior

`POST /api/v1/purchase-orders` with:
```json
{
  "vendorId": 1,
  "jobId": null,
  "notes": "Rush order",
  "lines": [
    { "partId": 42, "quantity": 100, "unitPrice": 2.50 }
  ]
}
```

On success: clears draft, shows snackbar "PO created", emits `saved` event.

The backend auto-generates the PO number (sequential: `PO-00001`, `PO-00002`, etc.) and creates a barcode record for the new PO.

## Receiving Workflow

Receiving is the process of recording physical receipt of ordered materials. It is handled via the `ReceiveDialogComponent`.

### Opening the Receive Dialog

The "Receive Items" button is visible in the detail panel when the PO status is `Acknowledged` or `PartiallyReceived`. Clicking it opens the receive dialog.

### Receive Dialog

`<app-dialog>` with `width="700px"`. Supports draft auto-save (`entityType: 'po-receipt'`).

**If all lines are fully received:** Shows an empty state with icon `check_circle` and message "All items have been received."

**Otherwise:** Displays a table of receivable lines (lines where `remainingQuantity > 0`):

| Column | Alignment | Notes |
|--------|-----------|-------|
| Part # | left | Monospace |
| Description | left | |
| Ordered | right | Total ordered quantity |
| Received | right | Already received quantity |
| Remaining | right | `ordered - received` |
| Receive Qty | right | Numeric input, `min=0`, `max=remainingQuantity` |

**"Receive All" button:** Sets each line's receive quantity to its remaining quantity in one click.

**Save button:** Disabled when no line has a quantity > 0, or while saving. Label: "Receive Items."

### Receiving Backend Logic

`POST /api/v1/purchase-orders/{id}/receive` processes each line:

1. Validates the PO is not `Closed` or `Cancelled`.
2. For each receive line:
   - Validates `quantity > 0` and `quantity <= remainingQuantity`.
   - Increments `ReceivedQuantity` on the `PurchaseOrderLine`.
   - Creates a `ReceivingRecord` with the received quantity, optional storage location, and notes.
3. After processing all lines:
   - If all lines have `remainingQuantity <= 0`: status transitions to `Received`, `ReceivedDate` is set.
   - Else if any line has `receivedQuantity > 0`: status transitions to `PartiallyReceived`.
4. Saves all changes atomically.

### ReceivingRecord Entity

Each receipt creates a `ReceivingRecord`:

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `Id` | int | No | Auto-increment PK |
| `PurchaseOrderLineId` | int | No | FK to the PO line |
| `QuantityReceived` | int | No | Amount received in this receipt |
| `ReceivedBy` | string | Yes | Who performed the receiving |
| `StorageLocationId` | int | Yes | FK to `StorageLocation` (inventory destination) |
| `Notes` | string | Yes | Receipt notes |
| `InspectionStatus` | ReceivingInspectionStatus | No | Default: `NotRequired` |
| `InspectedById` | int | Yes | FK to user who inspected |
| `InspectedAt` | DateTimeOffset | Yes | Inspection timestamp |
| `InspectionNotes` | string | Yes | QC inspection notes |
| `InspectedQuantityAccepted` | decimal | Yes | Quantity passing inspection |
| `InspectedQuantityRejected` | decimal | Yes | Quantity failing inspection |
| `QcInspectionId` | int | Yes | FK to `QcInspection` |
| `CreatedAt` | DateTimeOffset | No | Auto-set |
| `CreatedBy` | string | Yes | From `BaseAuditableEntity` |

**ReceivingInspectionStatus enum:** `NotRequired`, `Pending`, `InProgress`, `Passed`, `Failed`, `Waived`, `PartialAccept`

### Partial Receiving

The system fully supports partial receiving:

- A PO with 3 lines can have each line received independently, in different batches.
- Each receipt creates a separate `ReceivingRecord`, allowing audit trail of when and how much was received.
- The PO transitions to `PartiallyReceived` after any partial receipt, and to `Received` only when all lines are fully received.
- The receive dialog only shows lines with `remainingQuantity > 0`, automatically filtering out completed lines.

## Blanket PO Releases

Blanket POs are long-term purchase agreements where a total quantity is committed at an agreed price, but materials are released (ordered for delivery) in increments over time.

### Blanket PO Fields on `PurchaseOrder` Entity

| Field | Type | Description |
|-------|------|-------------|
| `IsBlanket` | bool | Flags this PO as a blanket order |
| `BlanketTotalQuantity` | decimal? | Total committed quantity |
| `BlanketReleasedQuantity` | decimal? | Quantity released so far |
| `BlanketRemainingQuantity` | decimal? | Computed: `total - released` |
| `BlanketExpirationDate` | DateTimeOffset? | When the blanket agreement expires |
| `AgreedUnitPrice` | decimal? | Negotiated unit price for all releases |

### PurchaseOrderRelease Entity

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `Id` | int | No | Auto-increment PK |
| `PurchaseOrderId` | int | No | FK to the blanket PO |
| `ReleaseNumber` | int | No | Sequential within the PO |
| `PurchaseOrderLineId` | int | No | FK to the specific PO line |
| `Quantity` | decimal | No | Quantity being released |
| `RequestedDeliveryDate` | DateTimeOffset | No | When delivery is needed |
| `ActualDeliveryDate` | DateTimeOffset | Yes | When delivery actually occurred |
| `Status` | PurchaseOrderReleaseStatus | No | Default: `Open` |
| `ReceivingRecordId` | int | Yes | FK to `ReceivingRecord` when received |
| `Notes` | string | Yes | Release notes |
| `CreatedAt` | DateTimeOffset | No | Auto-set |

**PurchaseOrderReleaseStatus enum:** `Open`, `Sent`, `PartialReceived`, `Received`, `Cancelled`

### Create Release Dialog

Accessed from the "New Release" button in the releases section of a blanket PO detail. `<app-dialog>` at `width="420px"`.

| Field | Control | Validators | Notes |
|-------|---------|-----------|-------|
| Line Item | `SelectComponent` | Required | Options from the PO's line items |
| Quantity | `InputComponent` (number) | Required, min 0.01 | Amount to release |
| Requested Delivery Date | `DatepickerComponent` | Required | When delivery is needed |
| Notes | `TextareaComponent` | None | Optional |

On save: `POST /api/v1/purchase-orders/{id}/releases`, shows snackbar "Release created", reloads releases and PO detail.

### Update Release

`PATCH /api/v1/purchase-orders/{id}/releases/{releaseNum}` supports updating:
- `quantity`
- `requestedDeliveryDate`
- `actualDeliveryDate`
- `status`
- `notes`

## Job and Inventory Linking

### Job Linking

- POs can optionally reference a `JobId`, connecting procurement to the production workflow.
- The job link is set during PO creation via the "Job ID" field.
- In the PO detail, the job number is rendered as an `EntityLinkComponent` (type `job`), allowing direct navigation to the job detail.
- On the kanban board, the "Materials Ordered" stage typically corresponds to POs being submitted.

### Inventory Integration

- `ReceivingRecord` has an optional `StorageLocationId` FK, allowing received materials to be directed to a specific storage location.
- The `ReceiveLineRequest` model includes an optional `storageLocationId` field.
- The receiving UI currently sends receive requests without a storage location -- the field is available in the API but not yet exposed in the receive dialog form.

### MRP Integration

- `PurchaseOrderLine` has an optional `MrpPlannedOrderId` FK, linking the line to an MRP planned order.
- `PurchaseOrderLine` has an optional `UomId` FK for unit of measure tracking.

## Status Lifecycle and Transitions

### State Machine

```
Draft ──> Submitted ──> Acknowledged ──> PartiallyReceived ──> Received ──> Closed
  │           │              │                                     │
  │           │              │                                     └──> (terminal)
  │           │              │
  └───────────┴──────────────┴─────────────────────────────────────────> Cancelled
```

### Transition Rules (Backend Enforcement)

| From | To | Trigger | Validation |
|------|----|---------|-----------|
| Draft | Submitted | `POST /{id}/submit` | Status must be `Draft` |
| Submitted | Acknowledged | `POST /{id}/acknowledge` | Status must be `Submitted`. Optional: sets `ExpectedDeliveryDate` |
| Acknowledged / PartiallyReceived | PartiallyReceived | `POST /{id}/receive` | At least one line partially received, not all complete |
| Acknowledged / PartiallyReceived | Received | `POST /{id}/receive` | All lines fully received. Sets `ReceivedDate` |
| Received | Closed | `POST /{id}/close` | Status must be `Received` |
| Draft / Submitted / Acknowledged | Cancelled | `POST /{id}/cancel` | Cannot cancel `Received` or `Closed` POs |
| Draft | (soft-deleted) | `DELETE /{id}` | Status must be `Draft` |

**Automatic transitions:** The `Received` status is set automatically when a receive action completes all remaining line quantities. The `PartiallyReceived` status is set automatically when some but not all lines are complete.

### Dates Set by Transitions

| Transition | Date Field Set |
|------------|---------------|
| Draft -> Submitted | `SubmittedDate` = now (UTC) |
| Submitted -> Acknowledged | `AcknowledgedDate` = now (UTC) |
| * -> Received | `ReceivedDate` = now (UTC) |

## API Endpoints

### Base URL: `/api/v1/purchase-orders`

| Method | Path | Auth Roles | Request Body | Response | Description |
|--------|------|------------|-------------|----------|-------------|
| GET | `/` | Admin, Manager, OfficeManager | -- | `PurchaseOrderListItem[]` | List POs with optional `?vendorId`, `?jobId`, `?status`, `?search` |
| GET | `/{id}` | Admin, Manager, OfficeManager | -- | `PurchaseOrderDetailResponseModel` | Full PO detail with lines |
| POST | `/` | Admin, Manager, OfficeManager | `CreatePurchaseOrderRequestModel` | `PurchaseOrderListItem` (201) | Create PO with lines |
| PUT | `/{id}` | Admin, Manager, OfficeManager | `UpdatePurchaseOrderRequestModel` | 204 | Update notes and expected delivery date |
| DELETE | `/{id}` | Admin, Manager, OfficeManager | -- | 204 | Soft-delete (Draft only) |
| POST | `/{id}/submit` | Admin, Manager, OfficeManager | -- | 204 | Transition Draft -> Submitted |
| POST | `/{id}/acknowledge` | Admin, Manager, OfficeManager | `{ expectedDeliveryDate? }` | 204 | Transition Submitted -> Acknowledged |
| POST | `/{id}/receive` | Admin, Manager, OfficeManager | `ReceiveItemsRequestModel` | 204 | Record received quantities |
| POST | `/{id}/cancel` | Admin, Manager, OfficeManager | -- | 204 | Cancel the PO |
| POST | `/{id}/close` | Admin, Manager, OfficeManager | -- | 204 | Close a Received PO |
| GET | `/calendar` | Admin, Manager, OfficeManager | -- | `PoCalendarResponseModel[]` | POs for calendar view with `?from` and `?to` date range |
| GET | `/{id}/releases` | Admin, Manager, OfficeManager | -- | `PurchaseOrderRelease[]` | List releases for a blanket PO |
| POST | `/{id}/releases` | Admin, Manager, OfficeManager | `CreatePurchaseOrderReleaseRequestModel` | `PurchaseOrderRelease` (201) | Create a new release |
| PATCH | `/{id}/releases/{releaseNum}` | Admin, Manager, OfficeManager | `UpdatePurchaseOrderReleaseRequestModel` | 204 | Update a release |

### Request / Response Shapes

**CreatePurchaseOrderRequestModel:**
```json
{
  "vendorId": 1,
  "jobId": null,
  "notes": "Rush order for Job 1055",
  "lines": [
    { "partId": 42, "quantity": 100, "unitPrice": 2.50, "notes": null },
    { "partId": 55, "quantity": 50, "unitPrice": 8.75, "notes": "Use latest rev" }
  ]
}
```

**Validation rules (FluentValidation):**
- `vendorId` must be > 0
- `lines` must not be empty ("At least one line item is required")
- Each line: `partId` > 0, `quantity` > 0, `unitPrice` >= 0

**UpdatePurchaseOrderRequestModel:**
```json
{
  "notes": "Updated notes",
  "expectedDeliveryDate": "2026-05-01T00:00:00Z"
}
```

**ReceiveItemsRequestModel:**
```json
{
  "lines": [
    { "lineId": 10, "quantity": 50, "storageLocationId": null, "notes": null },
    { "lineId": 11, "quantity": 25, "storageLocationId": 3, "notes": "Shelf B" }
  ]
}
```

**AcknowledgePurchaseOrderRequestModel:**
```json
{
  "expectedDeliveryDate": "2026-05-15T00:00:00Z"
}
```

**CreatePurchaseOrderReleaseRequestModel:**
```json
{
  "purchaseOrderLineId": 10,
  "quantity": 25,
  "requestedDeliveryDate": "2026-06-01T00:00:00Z",
  "notes": "Monthly release"
}
```

**UpdatePurchaseOrderReleaseRequestModel:**
```json
{
  "quantity": 30,
  "requestedDeliveryDate": "2026-06-15T00:00:00Z",
  "actualDeliveryDate": "2026-06-14T00:00:00Z",
  "status": "Received",
  "notes": "Delivered early"
}
```

**PurchaseOrderListItem:**
```json
{
  "id": 5,
  "poNumber": "PO-00005",
  "vendorId": 1,
  "vendorName": "Acme Supply Co.",
  "jobId": 1055,
  "jobNumber": "JOB-1055",
  "status": "Acknowledged",
  "lineCount": 3,
  "totalOrdered": 250,
  "totalReceived": 0,
  "expectedDeliveryDate": "2026-05-01T00:00:00Z",
  "isBlanket": false,
  "createdAt": "2026-04-10T00:00:00Z"
}
```

**PurchaseOrderDetail (GET /{id} response):**
```json
{
  "id": 5,
  "poNumber": "PO-00005",
  "vendorId": 1,
  "vendorName": "Acme Supply Co.",
  "jobId": 1055,
  "jobNumber": "JOB-1055",
  "status": "Acknowledged",
  "submittedDate": "2026-04-11T00:00:00Z",
  "acknowledgedDate": "2026-04-12T00:00:00Z",
  "expectedDeliveryDate": "2026-05-01T00:00:00Z",
  "receivedDate": null,
  "notes": "Rush order",
  "isBlanket": false,
  "blanketTotalQuantity": null,
  "blanketReleasedQuantity": null,
  "blanketRemainingQuantity": null,
  "blanketExpirationDate": null,
  "agreedUnitPrice": null,
  "lines": [
    {
      "id": 10,
      "partId": 42,
      "partNumber": "PT-0042",
      "description": "Aluminum Bracket",
      "orderedQuantity": 100,
      "receivedQuantity": 0,
      "remainingQuantity": 100,
      "unitPrice": 2.50,
      "lineTotal": 250.00,
      "notes": null
    }
  ],
  "createdAt": "2026-04-10T00:00:00Z",
  "updatedAt": "2026-04-12T00:00:00Z"
}
```

## Entity Models

### PurchaseOrder (extends `BaseAuditableEntity`)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `Id` | int | No | Auto-increment PK |
| `PONumber` | string | No | Auto-generated sequential (e.g., "PO-00001") |
| `VendorId` | int | No | FK to `Vendor` |
| `JobId` | int | Yes | FK to `Job` (optional link) |
| `Status` | PurchaseOrderStatus | No | Default: `Draft` |
| `SubmittedDate` | DateTimeOffset | Yes | Set when submitted |
| `AcknowledgedDate` | DateTimeOffset | Yes | Set when acknowledged |
| `ExpectedDeliveryDate` | DateTimeOffset | Yes | Set during acknowledge or update |
| `ReceivedDate` | DateTimeOffset | Yes | Set when all lines received |
| `Notes` | string | Yes | Free-text |
| `IsBlanket` | bool | No | Default: `false` |
| `BlanketTotalQuantity` | decimal | Yes | Blanket: total committed qty |
| `BlanketReleasedQuantity` | decimal | Yes | Blanket: released so far |
| `BlanketExpirationDate` | DateTimeOffset | Yes | Blanket: agreement expiry |
| `AgreedUnitPrice` | decimal | Yes | Blanket: negotiated price |
| `ExternalId` | string | Yes | Accounting system ID |
| `ExternalRef` | string | Yes | Accounting system reference |
| `Provider` | string | Yes | Accounting provider name |
| `CreatedAt` | DateTimeOffset | No | Auto-set |
| `UpdatedAt` | DateTimeOffset | No | Auto-set |
| `CreatedBy` | string | Yes | From `BaseAuditableEntity` |
| `DeletedAt` | DateTimeOffset | Yes | Soft-delete timestamp |

**Navigation properties:**
- `Vendor` -- `Vendor` (required)
- `Job` -- `Job?` (optional)
- `Lines` -- `ICollection<PurchaseOrderLine>`
- `Releases` -- `ICollection<PurchaseOrderRelease>`

### PurchaseOrderLine (extends `BaseEntity`)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `Id` | int | No | Auto-increment PK |
| `PurchaseOrderId` | int | No | FK to `PurchaseOrder` |
| `PartId` | int | No | FK to `Part` |
| `Description` | string | No | Defaults to part description |
| `OrderedQuantity` | int | No | Quantity ordered |
| `ReceivedQuantity` | int | No | Default: 0. Incremented by receiving |
| `UnitPrice` | decimal | No | Price per unit |
| `Notes` | string | Yes | Line-level notes |
| `MrpPlannedOrderId` | int | Yes | FK to MRP planned order |
| `UomId` | int | Yes | FK to `UnitOfMeasure` |

**Computed property:** `RemainingQuantity` = `OrderedQuantity - ReceivedQuantity`

**Navigation properties:**
- `PurchaseOrder` -- `PurchaseOrder` (required)
- `Part` -- `Part` (required)
- `MrpPlannedOrder` -- `MrpPlannedOrder?`
- `Uom` -- `UnitOfMeasure?`
- `ReceivingRecords` -- `ICollection<ReceivingRecord>`
- `Releases` -- `ICollection<PurchaseOrderRelease>`

### Enums

**PurchaseOrderStatus:** `Draft`, `Submitted`, `Acknowledged`, `PartiallyReceived`, `Received`, `Closed`, `Cancelled`

**PurchaseOrderReleaseStatus:** `Open`, `Sent`, `PartialReceived`, `Received`, `Cancelled`

**ReceivingInspectionStatus:** `NotRequired`, `Pending`, `InProgress`, `Passed`, `Failed`, `Waived`, `PartialAccept`

## File Structure

```
forge-ui/src/app/features/purchase-orders/
  purchase-orders.component.ts / .html / .scss
  purchase-orders.routes.ts
  services/
    purchase-order.service.ts
    purchase-order.service.spec.ts
  models/
    purchase-order-list-item.model.ts
    purchase-order-detail.model.ts
    purchase-order-line.model.ts
    purchase-order-release.model.ts
    create-purchase-order-request.model.ts
    create-purchase-order-line-request.model.ts
    receive-items-request.model.ts
    receive-line-request.model.ts
  components/
    po-dialog/
      po-dialog.component.ts / .html / .scss
    po-detail-dialog/
      po-detail-dialog.component.ts
    po-detail-panel/
      po-detail-panel.component.ts / .html / .scss
    receive-dialog/
      receive-dialog.component.ts / .html / .scss

forge-api/
  forge.api/
    Controllers/PurchaseOrdersController.cs
    Features/PurchaseOrders/
      CreatePurchaseOrder.cs
      UpdatePurchaseOrder.cs
      DeletePurchaseOrder.cs
      GetPurchaseOrders.cs
      GetPurchaseOrderById.cs
      GetPurchaseOrdersForCalendar.cs
      SubmitPurchaseOrder.cs
      AcknowledgePurchaseOrder.cs
      ReceiveItems.cs
      CancelPurchaseOrder.cs
      ClosePurchaseOrder.cs
      CreatePurchaseOrderRelease.cs
      GetPurchaseOrderReleases.cs
      UpdatePurchaseOrderRelease.cs
  forge.core/
    Entities/
      PurchaseOrder.cs
      PurchaseOrderLine.cs
      PurchaseOrderRelease.cs
      ReceivingRecord.cs
    Enums/
      PurchaseOrderStatus.cs
      PurchaseOrderReleaseStatus.cs
      ReceivingInspectionStatus.cs
```

## Known Limitations

1. **No PO editing after creation** -- the `UpdatePurchaseOrder` endpoint only allows updating `notes` and `expectedDeliveryDate`. Line items cannot be added, removed, or modified after creation. To change lines, the PO must be cancelled and recreated.
2. **No storage location in receive UI** -- the `ReceiveLineRequest` model supports `storageLocationId`, but the receive dialog does not expose a storage location picker. Received items are recorded without a destination location.
3. **No server-side pagination** -- the PO list endpoint returns all matching POs. This is acceptable for typical PO volumes but could become a concern for high-volume operations.
4. **No RFQ management** -- there is no formal Request for Quotation workflow. POs are created directly without a vendor bidding/quoting process.
5. **Blanket PO creation via UI** -- the create dialog does not include blanket PO fields (`isBlanket`, `blanketTotalQuantity`, `agreedUnitPrice`, `blanketExpirationDate`). Blanket POs must be created via direct API calls or seeded data. Once created, the UI fully supports viewing blanket details and creating releases.
6. **No receiving inspection workflow in UI** -- the `ReceivingRecord` entity supports inspection fields (`InspectionStatus`, `InspectedBy`, `InspectedAt`, quantities accepted/rejected, `QcInspectionId`), but the receive dialog does not expose inspection controls. Inspection data must be managed separately via the Quality module.
7. **Calendar endpoint** -- `GET /purchase-orders/calendar` exists but is not consumed by a dedicated PO calendar view. It may be used by the general calendar feature.
8. **Job link is by ID only** -- the create dialog accepts a raw job ID number. There is no job picker or autocomplete -- the user must know the job ID to link a PO.
9. **No line-level receiving notes in UI** -- the `ReceiveLineRequest` supports `notes` per line, but the receive dialog does not render note inputs per line.
10. **No PO PDF generation** -- unlike jobs (which support work order PDFs), there is no server-side PDF generation for purchase orders.
