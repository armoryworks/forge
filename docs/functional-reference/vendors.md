# Vendors

## Overview

Vendors represent external suppliers from which the organization purchases materials, components, and services. The vendor module provides a searchable list, detail dialogs with tabbed views (info, purchase orders, scorecard), and full CRUD operations. Vendors are the counterpart to customers in the procurement workflow -- every purchase order references a vendor.

Vendor records support accounting integration via `ExternalId`, `ExternalRef`, and `Provider` fields. When an accounting provider (e.g., QuickBooks) is connected, vendor management becomes read-only in the application (see Accounting Boundary below).

## Route

| Path | Component | Lazy-loaded |
|------|-----------|-------------|
| `/vendors` | `VendorsComponent` | Yes |

**Access roles:** Admin, Manager, OfficeManager (enforced on both the `VendorsController` and the Angular route guard).

**URL state:**
- `?detail=vendor:{id}` -- opens the vendor detail dialog for the specified vendor. Set automatically when a row is clicked, cleared on dialog close. Survives page refresh and is shareable as a direct link.

## Page Layout

The page is a full-height flex column with three zones:

1. **Page header** (`PageHeaderComponent`) -- title "Vendors" with subtitle, and "New Vendor" button.
2. **Filter bar** -- search input and active/inactive status dropdown.
3. **Content area** -- a `DataTableComponent` showing all vendors matching the current filters. Loading state uses `LoadingBlockDirective` on the table wrapper.

### Toolbar Controls

| Control | Type | Purpose |
|---------|------|---------|
| Search | `InputComponent` | Free-text filter on company name, contact, etc. Triggers on Enter key |
| Status | `SelectComponent` | Filter by active status: All, Active, Inactive |
| New Vendor | Button (primary) | Opens the vendor create dialog |

## Vendor List

The vendor list renders via `DataTableComponent` with `tableId="vendors"`. Supports all standard DataTable features: column sorting, per-column filtering, column visibility/reorder, and preference persistence.

Rows are clickable (`[clickableRows]="true"`). Clicking a row opens the vendor detail dialog via `DetailDialogService`.

### Columns

| Field | Header | Type | Sortable | Filterable | Width | Notes |
|-------|--------|------|----------|------------|-------|-------|
| `companyName` | Company Name | text | Yes | No | auto | Rendered with `.vendor-name` styling |
| `contactName` | Contact | text | Yes | No | auto | Displays em-dash when null |
| `email` | Email | text | Yes | No | auto | Displays em-dash when null |
| `phone` | Phone | text | Yes | No | auto | Displays em-dash when null |
| `isActive` | Active | enum | Yes | Yes | 80px | Chip: green "Active" or muted "Inactive" |
| `poCount` | POs | number | Yes | No | 70px | Center-aligned count of purchase orders |
| `createdAt` | Created | date | Yes | No | 110px | Formatted `MM/dd/yyyy` |

**Empty state:** Icon `store` with message "No vendors found."

### Filters

Filters are applied server-side. The list endpoint accepts `search` and `isActive` query parameters.

- **Search** -- free-text match (server-side, typically searches `companyName`, `contactName`, `email`). Applied on Enter key press.
- **Status** -- tri-state dropdown: All (null), Active (true), Inactive (false).

## Vendor Detail Dialog

Opened via `DetailDialogService.open()` as a full `MatDialog`. The URL updates to `?detail=vendor:{id}`. The dialog wraps `VendorDetailPanelComponent`, which fetches the full vendor detail from the API on load.

### Header

Displays the `store` material icon, vendor company name, and (if present) the contact name beneath it. Action buttons: **Edit** (pencil icon) and **Close** (X icon).

### Tabs

The detail panel has three tabs managed by an `activeTab` signal:

| Tab | Key | Content |
|-----|-----|---------|
| Info | `info` | Contact details, address, notes, accounting info, timestamps, activity log, action buttons |
| Purchase Orders | `purchase-orders` | DataTable of all POs for this vendor, with count in tab label |
| Scorecard | `scorecard` | Vendor performance scorecard with KPI chips and graded sections |

### Info Tab

Displays a read-only grid of vendor fields:

| Field | Display Condition | Notes |
|-------|-------------------|-------|
| Status | Always | Active (green chip) or Inactive (muted chip) |
| Email | When present | Plain text |
| Phone | When present | Plain text |
| Payment Terms | When present | Plain text |
| Address | When any address field is present | Formatted multi-line: street, city/state/zip, country |
| Notes | When present | Pre-formatted text block |
| External ID | When present | Shown under "Accounting" section label -- indicates linked accounting record |
| Created At | Always | Formatted `MM/dd/yyyy` |
| Updated At | Always | Formatted `MM/dd/yyyy` |

Below the info grid, the tab renders:

- **Activity Section** (`EntityActivitySectionComponent`) -- chronological activity log for entity type `Vendor`.
- **Action Buttons:**
  - **Activate / Deactivate** -- toggles `isActive` via `updateVendor()`. Icon changes based on current state (`block` for deactivate, `check_circle` for activate).
  - **Delete** -- opens a `ConfirmDialogComponent` with `severity: 'danger'`. On confirmation, soft-deletes the vendor and closes the detail dialog.

### Purchase Orders Tab

Renders a `DataTableComponent` with `tableId="vendor-pos"` showing all purchase orders associated with this vendor (loaded inline with the vendor detail response).

| Field | Header | Width | Notes |
|-------|--------|-------|-------|
| `poNumber` | PO # | 120px | Styled as `.po-number` |
| `status` | Status | 140px | Chip with status-specific coloring |
| `lineCount` | Lines | 70px | Center-aligned |
| `expectedDeliveryDate` | Expected | 110px | Date formatted `MM/dd/yyyy` |
| `createdAt` | Created | 110px | Date formatted `MM/dd/yyyy` |

Rows are clickable. Clicking a PO navigates to `/purchase-orders?detail=purchase-order:{id}`.

**Empty state:** Icon `receipt_long` with message "No purchase orders."

**Status chip colors:**

| Status | Chip Class |
|--------|-----------|
| Draft | `chip--muted` |
| Submitted | `chip--info` |
| Acknowledged | `chip--primary` |
| PartiallyReceived | `chip--warning` |
| Received | `chip--success` |
| Closed | `chip--muted` |
| Cancelled | `chip--error` |

### Scorecard Tab

Renders `VendorScorecardTabComponent`, which loads scorecard data from `GET /api/v1/vendors/{id}/scorecard`. The scorecard defaults to a 12-month lookback period if no date range is specified.

**Header section:**
- Overall grade displayed as a colored chip (A=success, B=info, C=warning, D/F=error)
- Numeric score out of 100
- Period date range

**KPI chips** (four compact metrics):
- On-Time Delivery (%)
- Quality Acceptance (%)
- Quantity Accuracy (%)
- Total Spend (currency)

**Scored sections** (weighted):

| Section | Weight | Metrics |
|---------|--------|---------|
| Delivery | 40% | Total POs, Lines Received, On-Time %, Late Deliveries |
| Quality | 30% | Inspected, Rejected, NCRs, Acceptance Rate % |
| Price | 20% | Total Spend, Avg Price Variance % |
| Quantity | 10% | Quantity Accuracy % |

**Empty state:** Icon `analytics` with message "No scorecard data available."

## Create / Edit Vendor Dialog

Both create and edit use the same `VendorDialogComponent`. When editing, the `vendor` input is populated with the full `VendorDetail` and the form is pre-filled.

**Dialog:** `<app-dialog>` with `width="860px"`, `splitLayout="true"`. Supports draft auto-save (`entityType: 'vendor'`).

### Form Fields

The dialog uses a split layout with a main section and sidebar.

**Main Section -- Contact:**

| Field | Control | FormControl | Validators | data-testid | Notes |
|-------|---------|-------------|-----------|-------------|-------|
| Company Name | `InputComponent` | `companyName` | `Validators.required` | `vendor-company` | Required (marked with `*`) |
| Contact Name | `InputComponent` | `contactName` | none | `vendor-contact` | Optional primary contact |
| Email | `InputComponent` (type=email) | `email` | `Validators.email` | `vendor-email` | Validated email format |
| Phone | `InputComponent` | `phone` | none | `vendor-phone` | Free-text phone number |

**Main Section -- Notes:**

| Field | Control | FormControl | Notes |
|-------|---------|-------------|-------|
| Notes | `TextareaComponent` | `notes` | 3 rows, optional |

**Sidebar -- Address:**

Uses the shared `AddressFormComponent` (CVA) bound to `formControlName="address"`. All address fields are optional (`requireLine1`, `requireCity`, `requireState`, `requirePostalCode` all set to `false`). Line 2 is hidden (`showLine2="false"`).

Address fields: Street address, City, State (dropdown), ZIP code, Country.

**Sidebar -- Settings:**

| Field | Control | FormControl | Notes |
|-------|---------|-------------|-------|
| Payment Terms | `SelectComponent` | `paymentTerms` | Options from `PAYMENT_TERMS_OPTIONS` constant |
| Active | `ToggleComponent` | `isActive` | Only shown when editing (`@if (isEditing)`) |

### Validation

Validation uses the standard popover pattern (`ValidationPopoverDirective` on the save button). Hovering the disabled save button shows a bulleted list of violations.

### Save Behavior

- **Create:** `POST /api/v1/vendors` -- on success, shows snackbar "Vendor created", clears draft, emits `saved` event.
- **Edit:** `PUT /api/v1/vendors/{id}` -- on success, shows snackbar "Vendor updated", clears draft, emits `saved` event.
- Address fields are flattened via `fromAddressToVendor()` utility before sending to the API.
- The save button is disabled while `saving()` is true or the form is invalid.

## Address Management

Vendor addresses are stored as flat fields directly on the `Vendor` entity (`Address`, `City`, `State`, `ZipCode`, `Country`). This is a single-address model -- unlike customers, which support multiple addresses via the `CustomerAddress` entity.

The `AddressFormComponent` handles state dropdown rendering, and the `fromAddressToVendor()` / `toAddress()` utilities convert between the flat vendor fields and the structured `Address` object used by the form component.

## Accounting Boundary

Vendor management falls under the accounting boundary. When an accounting provider is connected (`IAccountingService.IsConfigured` is true), vendor CRUD becomes read-only -- vendors are synced from the accounting system and cannot be created, edited, or deleted in the application.

**Fields indicating accounting integration:**
- `ExternalId` -- the vendor's ID in the external accounting system
- `ExternalRef` -- an optional reference string from the external system
- `Provider` -- the accounting provider name (e.g., "QuickBooksOnline")

When `externalId` is present, the vendor detail info tab shows it under an "Accounting" section.

## Performance Report

A cross-vendor comparison endpoint is available at `GET /api/v1/vendors/performance-report`. The `VendorService.getPerformanceReport()` method returns an array of `VendorComparisonRow` items:

| Field | Type | Description |
|-------|------|-------------|
| `vendorId` | number | Vendor ID |
| `vendorName` | string | Company name |
| `onTimePercent` | number | On-time delivery percentage |
| `qualityPercent` | number | Quality acceptance percentage |
| `totalSpend` | number | Total spend in the period |
| `overallScore` | number | Composite score (0-100) |
| `grade` | VendorGrade | Letter grade: A, B, C, D, or F |
| `trend` | string | Trend indicator |

This endpoint supports optional `dateFrom` and `dateTo` query parameters.

## API Endpoints

### Base URL: `/api/v1/vendors`

| Method | Path | Auth Roles | Request Body | Response | Description |
|--------|------|------------|-------------|----------|-------------|
| GET | `/` | Admin, Manager, OfficeManager | -- | `VendorListItem[]` | List vendors with optional `?search` and `?isActive` filters |
| GET | `/dropdown` | Admin, Manager, OfficeManager | -- | `VendorResponse[]` | Lightweight id+name list for dropdowns |
| GET | `/{id}` | Admin, Manager, OfficeManager | -- | `VendorDetailResponseModel` | Full vendor detail including purchase orders |
| POST | `/` | Admin, Manager, OfficeManager | `CreateVendorRequestModel` | `VendorListItem` (201) | Create a new vendor |
| PUT | `/{id}` | Admin, Manager, OfficeManager | `UpdateVendorRequestModel` | 204 | Update vendor fields |
| DELETE | `/{id}` | Admin, Manager, OfficeManager | -- | 204 | Soft-delete vendor |
| GET | `/{id}/scorecard` | Admin, Manager, OfficeManager | -- | `VendorScorecardResponseModel` | Vendor performance scorecard with optional `?dateFrom` and `?dateTo` |
| GET | `/performance-report` | Admin, Manager, OfficeManager | -- | `VendorComparisonRow[]` | Cross-vendor performance comparison with optional `?dateFrom` and `?dateTo` |

### Request / Response Shapes

**CreateVendorRequestModel:**
```json
{
  "companyName": "string (required)",
  "contactName": "string?",
  "email": "string?",
  "phone": "string?",
  "address": "string?",
  "city": "string?",
  "state": "string?",
  "zipCode": "string?",
  "country": "string?",
  "paymentTerms": "string?",
  "notes": "string?"
}
```

**UpdateVendorRequestModel:**
```json
{
  "companyName": "string?",
  "contactName": "string?",
  "email": "string?",
  "phone": "string?",
  "address": "string?",
  "city": "string?",
  "state": "string?",
  "zipCode": "string?",
  "country": "string?",
  "paymentTerms": "string?",
  "notes": "string?",
  "isActive": "boolean?"
}
```

**VendorListItem:**
```json
{
  "id": 1,
  "companyName": "Acme Supply Co.",
  "contactName": "Smith, John A",
  "email": "john@acme.com",
  "phone": "(555) 123-4567",
  "isActive": true,
  "poCount": 12,
  "createdAt": "2025-01-15T00:00:00Z"
}
```

**VendorDetail (GET /{id} response):**
```json
{
  "id": 1,
  "companyName": "Acme Supply Co.",
  "contactName": "Smith, John A",
  "email": "john@acme.com",
  "phone": "(555) 123-4567",
  "address": "123 Industrial Blvd",
  "city": "Springfield",
  "state": "IL",
  "zipCode": "62704",
  "country": "US",
  "paymentTerms": "Net 30",
  "notes": "Preferred metals supplier",
  "isActive": true,
  "externalId": "QB-V-001",
  "createdAt": "2025-01-15T00:00:00Z",
  "updatedAt": "2025-06-10T00:00:00Z",
  "purchaseOrders": [
    {
      "id": 5,
      "poNumber": "PO-00005",
      "vendorId": 1,
      "vendorName": "Acme Supply Co.",
      "jobId": null,
      "jobNumber": null,
      "status": "Received",
      "lineCount": 3,
      "totalOrdered": 150,
      "totalReceived": 150,
      "expectedDeliveryDate": "2025-06-01T00:00:00Z",
      "isBlanket": false,
      "createdAt": "2025-05-15T00:00:00Z"
    }
  ]
}
```

**VendorScorecardResponseModel:**
```json
{
  "vendorId": 1,
  "vendorName": "Acme Supply Co.",
  "periodStart": "2024-06-01",
  "periodEnd": "2025-06-01",
  "totalPurchaseOrders": 24,
  "totalLinesReceived": 87,
  "onTimeDeliveryPercent": 91.5,
  "lateDeliveries": 3,
  "qualityAcceptancePercent": 98.2,
  "totalInspected": 87,
  "totalRejected": 2,
  "totalNcrs": 1,
  "totalSpend": 145230.50,
  "avgPriceVariancePercent": 2.1,
  "quantityAccuracyPercent": 97.8,
  "overallScore": 88.4,
  "grade": "B"
}
```

## Entity Model

**`Vendor` (extends `BaseAuditableEntity`):**

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `Id` | int | No | Auto-increment PK |
| `CompanyName` | string | No | Required |
| `ContactName` | string | Yes | Primary contact name |
| `Email` | string | Yes | Contact email |
| `Phone` | string | Yes | Contact phone |
| `Address` | string | Yes | Street address |
| `City` | string | Yes | |
| `State` | string | Yes | |
| `ZipCode` | string | Yes | |
| `Country` | string | Yes | |
| `PaymentTerms` | string | Yes | e.g., "Net 30", "Net 60" |
| `Notes` | string | Yes | Free-text notes |
| `IsActive` | bool | No | Default: `true` |
| `ExternalId` | string | Yes | Accounting system ID |
| `ExternalRef` | string | Yes | Accounting system reference |
| `Provider` | string | Yes | Accounting provider name |
| `CreatedAt` | DateTimeOffset | No | Auto-set by `AppDbContext` |
| `UpdatedAt` | DateTimeOffset | No | Auto-set by `AppDbContext` |
| `CreatedBy` | string | Yes | From `BaseAuditableEntity` |
| `DeletedAt` | DateTimeOffset | Yes | Soft-delete timestamp |
| `DeletedBy` | string | Yes | Who deleted |

**Navigation properties:**
- `PurchaseOrders` -- `ICollection<PurchaseOrder>` (one-to-many)

## File Structure

```
forge-ui/src/app/features/vendors/
  vendors.component.ts / .html / .scss
  vendors.routes.ts
  services/
    vendor.service.ts
    vendor.service.spec.ts
  models/
    vendor-list-item.model.ts
    vendor-detail.model.ts
    vendor-response.model.ts
    vendor-scorecard.model.ts
    create-vendor-request.model.ts
    update-vendor-request.model.ts
  components/
    vendor-dialog/
      vendor-dialog.component.ts / .html / .scss
    vendor-detail-dialog/
      vendor-detail-dialog.component.ts
    vendor-detail-panel/
      vendor-detail-panel.component.ts / .html / .scss
    vendor-scorecard-tab/
      vendor-scorecard-tab.component.ts / .html / .scss

forge-api/
  forge.api/
    Controllers/VendorsController.cs
    Features/Vendors/
      CreateVendor.cs
      UpdateVendor.cs
      DeleteVendor.cs
      GetVendors.cs
      GetVendorById.cs
      GetVendorDropdown.cs
      GetVendorScorecard.cs
      GetVendorPerformanceReport.cs
  forge.core/
    Entities/Vendor.cs
```

## Known Limitations

1. **Single address model** -- vendors support only one address. Unlike customers (which have a `CustomerAddress` entity supporting multiple addresses with types), vendors store address fields directly on the entity.
2. **No vendor contacts entity** -- the vendor has a single `ContactName` field. There is no separate contacts table for vendors (unlike customers which have a `Contact` entity supporting multiple contacts per customer).
3. **Scorecard date range is not exposed in the UI** -- the scorecard tab always loads with the default 12-month lookback. The API supports `dateFrom` and `dateTo` parameters, but the UI does not render date range controls.
4. **No server-side pagination** -- the vendor list endpoint returns all vendors matching the filters. This is acceptable for typical vendor counts (< 1000) but could become a performance concern for very large installations.
5. **Accounting boundary is not enforced in the UI** -- while the backend rejects mutations when an accounting provider is connected, the UI does not currently check `AccountingService.isStandalone` to hide create/edit/delete controls. The user would see error responses from the API rather than pre-hidden buttons.
6. **No vendor merge/deduplication** -- there is no mechanism to merge duplicate vendor records or detect potential duplicates during creation.
