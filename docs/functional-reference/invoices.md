# Invoices

## Overview

Invoices represent billing documents sent to customers for completed work, shipments, or standalone charges. Each invoice has a header (customer, dates, terms), one or more line items (part/description, quantity, unit price), and computed totals (subtotal, tax, grand total, balance due).

**Accounting Boundary:** Invoices are an accounting-bounded feature. In standalone mode (no accounting provider connected), full CRUD is available. When an accounting provider (QuickBooks, Xero, etc.) is connected, invoices become read-only cached copies synced from the external system. The UI shows a banner indicating the provider manages invoicing. The `AccountingService.isStandalone` signal controls this behavior.

Invoice numbers are auto-generated sequentially by the server via `IInvoiceRepository.GenerateNextInvoiceNumberAsync()`.

## Route

| Path | Component | Lazy-loaded |
|------|-----------|-------------|
| `/invoices` | `InvoicesComponent` | Yes |

**Access roles:** Admin, Manager, OfficeManager (enforced by `InvoicesController` `[Authorize(Roles)]`).

**URL state:**
- `?detail=invoice:{id}` -- opens the invoice detail dialog for the specified invoice. Set when a row is clicked, cleared on dialog close.

## Page Layout

The page is a full-height flex column with these zones:

1. **Page header** (`PageHeaderComponent`) -- title "Invoices" with subtitle, "Uninvoiced Jobs" button (with badge count), and "New Invoice" button.
2. **Accounting banner** (conditional) -- shown when `isStandalone()` is `false`, displays the connected provider name.
3. **Uninvoiced nudge banner** (conditional) -- amber warning banner shown when uninvoiced jobs exist. Clickable to open the uninvoiced jobs panel. Displays count.
4. **Filters bar** -- search input and status select.
5. **Data table** -- sortable, filterable invoice list.
6. **Invoice create dialog** (conditional) -- rendered when creating a new invoice.
7. **Uninvoiced jobs panel** (conditional) -- dialog listing jobs ready for invoicing.

### Toolbar Controls

| Control | Type | Purpose |
|---------|------|---------|
| Search | `InputComponent` | Free-text filter (triggers on Enter) |
| Status | `SelectComponent` | Filter by invoice status |
| Uninvoiced Jobs | Button | Opens the uninvoiced jobs panel |
| New Invoice | Button (primary) | Opens the create invoice dialog |

## Filters

Server-side filtering via query parameters on `GET /api/v1/invoices`.

### Status Filter

Dropdown with options: All Statuses, Draft, Sent, Partially Paid, Paid, Overdue, Voided. Selecting a status reloads the invoice list from the API with the `?status=` parameter.

### Search

Free-text search is applied server-side. Triggers on Enter key press.

## List View (DataTable)

Table ID: `invoices`

| Column | Field | Sortable | Filterable | Type | Width | Align |
|--------|-------|----------|------------|------|-------|-------|
| Invoice # | `invoiceNumber` | Yes | No | text | 120px | left |
| Customer | `customerName` | Yes | No | text | auto | left |
| Status | `status` | Yes | Yes (enum) | enum | 130px | left |
| Invoice Date | `invoiceDate` | Yes | No | date | 110px | left |
| Due Date | `dueDate` | Yes | No | date | 110px | left |
| Total | `total` | Yes | No | number | 100px | right |
| Paid | `amountPaid` | Yes | No | number | 100px | right |
| Balance | `balanceDue` | Yes | No | number | 100px | right |
| Created | `createdAt` | Yes | No | date | 110px | left |

**Custom cell rendering:**
- **Invoice #:** monospace styling via `.inv-number` class.
- **Status:** colored chip. Draft/Voided = muted, Sent = info, Partially Paid = warning, Paid = success, Overdue = error.
- **Dates:** muted text, formatted `MM/dd/yyyy`.
- **Monetary values:** `currency` pipe.
- **Balance Due:** warning color when balance > 0 and not overdue; error color when overdue.

**Row click:** opens the invoice detail dialog via `DetailDialogService`.

**Empty state:** `receipt_long` icon with "No invoices found" message.

## Detail View (Dialog)

Invoice details open as a full `MatDialog` via `DetailDialogService` at URL `?detail=invoice:{id}`. The dialog contains `InvoiceDetailPanelComponent`.

### Detail Panel Layout

**Header:** receipt icon, invoice number, customer name (linked via `EntityLinkComponent`), close button.

**Info grid:** 2-column grid showing:

| Field | Display |
|-------|---------|
| Status | Colored chip |
| Customer | Entity link to customer detail |
| Sales Order | Entity link (conditional, shown only if linked) |
| Shipment | Entity link (conditional, shown only if linked) |
| Invoice Date | `MM/dd/yyyy` |
| Due Date | `MM/dd/yyyy` |
| Credit Terms | Plain text (conditional) |

**Notes section:** shown only if notes exist.

**Line items table:**

| Column | Align |
|--------|-------|
| Part # | left (monospace) |
| Description | left |
| Qty | right |
| Unit Price | right (currency) |
| Total | right (currency) |

**Totals section:**

| Row | Style |
|-----|-------|
| Subtotal | normal |
| Tax (rate%) | normal |
| Total | bold |
| Amount Paid | normal |
| Balance Due | bold, distinct styling |

**Timestamps:** Created and Updated dates.

**Actions:** context-dependent buttons:
- **Send** (primary) -- visible only when status is `Draft`. Transitions to `Sent`.
- **Void** -- visible when status is `Draft` or `Sent`. Opens confirmation dialog (severity: warn).
- **Delete** (danger) -- visible only when status is `Draft`. Opens confirmation dialog (severity: danger). Soft-deletes the invoice.

**Activity log:** `EntityActivitySectionComponent` showing the invoice's activity history.

### Status-Based Action Rules

| Current Status | Send | Void | Delete |
|----------------|------|------|--------|
| Draft | Yes | Yes | Yes |
| Sent | No | Yes | No |
| PartiallyPaid | No | No | No |
| Paid | No | No | No |
| Overdue | No | No | No |
| Voided | No | No | No |

## Create Invoice Dialog

Opened via `InvoiceDialogComponent`. Width: `1100px`. Split layout with main panel (line items) and sidebar (details + notes + summary).

### Form Fields (Sidebar)

| Field | Label | Type | Required | Validation | data-testid |
|-------|-------|------|----------|------------|-------------|
| Customer | Customer | Select (from API) | Yes | `Validators.required` | `invoice-customer` |
| Sales Order ID | Sales Order ID | Number input | No | -- | -- |
| Invoice Date | Invoice Date | Datepicker | Yes | `Validators.required` | `invoice-date` |
| Due Date | Due Date | Datepicker | Yes | `Validators.required`, must be >= invoice date | `invoice-due-date` |
| Credit Terms | Credit Terms | Select | No | -- | `invoice-credit-terms` |
| Tax Rate | Tax Rate (%) | Number input | Yes | `Validators.required`, `Validators.min(0)` | `invoice-tax-rate` |
| Shipment ID | Shipment ID | Number input | No | -- | -- |
| Notes | Notes | Textarea (3 rows) | No | -- | `invoice-notes` |

**Credit Terms options:** sourced from `CREDIT_TERMS_OPTIONS` constant (DueOnReceipt, Net15, Net30, Net45, Net60, Net90).

**Customer options:** loaded from `CustomerService.getCustomers()` on dialog open. First option is "-- Select Customer --" with null value.

### Line Items (Main Panel)

Line items are managed as a local signal array (`lines`). Each line has:

| Field | Label | Type | Required | Validation | data-testid |
|-------|-------|------|----------|------------|-------------|
| Part ID | Part ID | Number input | No | -- | -- |
| Part # | Part # | Text input | No | -- | -- |
| Description | Description | Text input | Yes | `Validators.required` | `invoice-line-desc` |
| Quantity | Qty | Number input | Yes | `Validators.required`, `Validators.min(1)` | `invoice-line-qty` |
| Unit Price | Price | Number input | Yes | `Validators.required`, `Validators.min(0)` | `invoice-line-price` |

**Add button:** disabled when the line form is invalid. Adds the line to the array and resets the form.

**Remove:** each row has a danger icon button (close icon) to remove the line.

**Lines table** (shown when lines exist): Part #, Description, Qty, Unit Price, Total (computed), Remove button. Footer row shows the line total.

### Summary Section (Sidebar)

Computed from line items and tax rate:
- **Subtotal:** sum of all line totals (`quantity * unitPrice`).
- **Tax:** subtotal * tax rate (displayed as percentage).
- **Total:** subtotal + tax amount.

### Save Behavior

- Submit button disabled when: form invalid, no line items, or saving in progress.
- Validation popover on submit button shows violations on hover.
- On save: calls `InvoiceService.createInvoice()`, clears draft, shows success snackbar, emits `saved` event.
- Server auto-generates the invoice number.

### Draft Support

Draft config: `entityType: 'invoice'`, `entityId: 'new'`, `route: '/invoices'`. Snapshots both form values and line items array.

## Uninvoiced Jobs Panel

Dialog listing jobs that have reached a completed/shipped state but do not yet have an associated invoice. Opened from the "Uninvoiced Jobs" header button or the nudge banner.

Width: `620px`.

**Each job row shows:**
- Job number and title
- Customer name (if assigned)
- Completed date (`MM/dd/yyyy`)
- "Invoice" button (primary, small) -- disabled if no customer is assigned

**Create from job:** clicking "Invoice" calls `InvoiceService.createInvoiceFromJob(jobId)` which creates an invoice pre-populated from the job data. On success, both the invoice list and uninvoiced jobs list are reloaded.

**Empty state:** checkmark icon with "All jobs invoiced" message.

## Tax Calculation

Tax is calculated as a flat percentage applied to the subtotal:
- `TaxAmount = Subtotal * TaxRate`
- `Total = Subtotal + TaxAmount`

The tax rate is stored as a decimal fraction (0-1) in the database. The UI displays and accepts it as a percentage (0-100) with a `%` suffix, converting on save.

Server-side validation ensures `TaxRate >= 0` and `TaxRate < 1`.

## Sales Order and Shipment Linking

Invoices can optionally link to a Sales Order (`salesOrderId`) and/or a Shipment (`shipmentId`). These are entered as numeric IDs during creation and displayed as entity links in the detail view. The linked SO number and shipment number are resolved server-side and included in the detail response.

## PDF Generation

`GET /api/v1/invoices/{id}/pdf` generates a PDF document server-side using QuestPDF (`InvoicePdfDocument`). Returns `application/pdf` with filename `invoice-{id}.pdf`.

## Email

`POST /api/v1/invoices/{id}/email` sends the invoice to a recipient. Request body: `{ recipientEmail: string }`.

## Invoice Queue Settings

Admin-configurable queue settings control how uninvoiced jobs are routed:
- `GET /api/v1/invoices/queue-settings` -- returns `{ mode, assignedUserId, assignedUserName }`.
- `PUT /api/v1/invoices/queue-settings` -- Admin only. Body: `{ mode, assignedUserId }`.

## API Endpoints

| Method | Path | Auth Roles | Request Body | Response | Description |
|--------|------|------------|--------------|----------|-------------|
| GET | `/api/v1/invoices` | Admin, Manager, OfficeManager | -- | `InvoiceListItemModel[]` | List invoices. Query: `?customerId=&status=` |
| GET | `/api/v1/invoices/{id}` | Admin, Manager, OfficeManager | -- | `InvoiceDetailResponseModel` | Get invoice detail |
| POST | `/api/v1/invoices` | Admin, Manager, OfficeManager | `CreateInvoiceRequestModel` | `InvoiceListItemModel` (201) | Create invoice |
| POST | `/api/v1/invoices/{id}/send` | Admin, Manager, OfficeManager | -- | 204 | Mark invoice as Sent |
| POST | `/api/v1/invoices/{id}/email` | Admin, Manager, OfficeManager | `{ recipientEmail }` | 204 | Email invoice |
| POST | `/api/v1/invoices/{id}/void` | Admin, Manager, OfficeManager | -- | 204 | Void invoice |
| GET | `/api/v1/invoices/{id}/pdf` | Admin, Manager, OfficeManager | -- | `application/pdf` | Download invoice PDF |
| DELETE | `/api/v1/invoices/{id}` | Admin, Manager, OfficeManager | -- | 204 | Soft-delete invoice |
| GET | `/api/v1/invoices/uninvoiced-jobs` | Admin, Manager, OfficeManager | -- | `UninvoicedJobResponseModel[]` | List uninvoiced jobs |
| POST | `/api/v1/invoices/from-job/{jobId}` | Admin, Manager, OfficeManager | -- | `InvoiceListItemModel` (201) | Create invoice from job |
| GET | `/api/v1/invoices/queue-settings` | Admin, Manager, OfficeManager | -- | `InvoiceQueueSettingsResponse` | Get queue settings |
| PUT | `/api/v1/invoices/queue-settings` | Admin | `{ mode, assignedUserId }` | 204 | Update queue settings |

### Request/Response Models

**CreateInvoiceRequestModel:**
```
{
  customerId: int (required, > 0),
  salesOrderId: int? (optional),
  shipmentId: int? (optional),
  invoiceDate: DateTimeOffset (required),
  dueDate: DateTimeOffset (required, >= invoiceDate),
  creditTerms: string? (optional, enum name),
  taxRate: decimal (required, >= 0, < 1),
  notes: string? (optional),
  lines: CreateInvoiceLineModel[] (required, non-empty)
}
```

**CreateInvoiceLineModel:**
```
{
  partId: int? (optional),
  description: string (required, non-empty),
  quantity: int (required, > 0),
  unitPrice: decimal (required, >= 0)
}
```

**InvoiceListItemModel:**
```
{
  id, invoiceNumber, customerId, customerName, status,
  invoiceDate, dueDate, total, amountPaid, balanceDue, createdAt
}
```

**InvoiceDetailResponseModel:**
```
{
  id, invoiceNumber, customerId, customerName,
  salesOrderId, salesOrderNumber, shipmentId, shipmentNumber,
  status, invoiceDate, dueDate, creditTerms, taxRate,
  subtotal, taxAmount, total, amountPaid, balanceDue,
  notes, lines[], paymentApplications[], createdAt, updatedAt
}
```

## Status Lifecycle

```
Draft --> Sent --> PartiallyPaid --> Paid
  |         |
  |         +--> Overdue (system-driven, when past due date)
  |         |
  |         +--> Voided
  +--> Voided
  +--> Deleted (soft)
```

- **Draft:** initial state on creation. Can be sent, voided, or deleted.
- **Sent:** invoice has been marked as sent to the customer. Can receive partial/full payment or be voided.
- **PartiallyPaid:** at least one payment application exists but balance remains. Transitions automatically when a payment is applied.
- **Paid:** balance due reaches zero. Transitions automatically when final payment is applied.
- **Overdue:** system-driven status when the due date passes with outstanding balance.
- **Voided:** invoice cancelled. Terminal state.

Payment application automatically transitions invoice status (see Payments documentation).

## Entity

**Invoice** (`forge.core/Entities/Invoice.cs`): extends `BaseAuditableEntity`.

| Property | Type | Notes |
|----------|------|-------|
| InvoiceNumber | string | Auto-generated |
| CustomerId | int | FK to Customer |
| SalesOrderId | int? | FK to SalesOrder |
| ShipmentId | int? | FK to Shipment |
| Status | InvoiceStatus | Enum |
| InvoiceDate | DateTimeOffset | |
| DueDate | DateTimeOffset | |
| CreditTerms | CreditTerms? | Enum |
| TaxRate | decimal | Stored as fraction (0-1) |
| Notes | string? | |
| ExternalId | string? | Accounting provider ID |
| ExternalRef | string? | Accounting provider reference |
| Provider | string? | Provider name |
| LastSyncedAt | DateTimeOffset? | Last sync timestamp |
| Subtotal | decimal | Computed: sum of line totals |
| TaxAmount | decimal | Computed: subtotal * taxRate |
| Total | decimal | Computed: subtotal + taxAmount |
| AmountPaid | decimal | Computed: sum of payment applications |
| BalanceDue | decimal | Computed: total - amountPaid |

**InvoiceLine** (`forge.core/Entities/InvoiceLine.cs`): extends `BaseEntity`.

| Property | Type | Notes |
|----------|------|-------|
| InvoiceId | int | FK to Invoice |
| PartId | int? | FK to Part (optional) |
| Description | string | Required |
| Quantity | int | |
| UnitPrice | decimal | |
| LineNumber | int | Sequential ordering |
| LineTotal | decimal | Computed: quantity * unitPrice |

## Known Limitations

1. **No inline editing.** Invoices cannot be edited after creation. To correct an invoice, void it and create a new one.
2. **No partial line updates.** Individual line items cannot be added or removed after invoice creation.
3. **Tax rate is flat.** A single tax rate applies to the entire invoice. Per-line or per-category tax rates are not supported.
4. **No recurring invoices.** Recurring invoicing is handled via `RecurringOrder` entities, not as a native invoice feature.
5. **Overdue detection is not real-time.** The Overdue status is set via background processes, not at query time.
6. **Email send is fire-and-forget.** No delivery confirmation or tracking of email status.
7. **Standalone mode only.** When an accounting provider is connected, all invoice CRUD operations are disabled. The feature becomes a read-only view of synced data.
