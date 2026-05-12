# Payments

## Overview

Payments record money received from customers and apply it against outstanding invoices. Each payment has a header (customer, method, amount, date, reference) and zero or more invoice applications that link specific dollar amounts to specific invoices. A single payment can be applied across multiple invoices (split payment), and a payment can have unapplied funds (overpayment or advance).

**Accounting Boundary:** Payments are an accounting-bounded feature. In standalone mode (no accounting provider connected), full CRUD is available. When an accounting provider is connected, payments become read-only cached copies synced from the external system. The UI shows a managed-by-provider banner. The `AccountingService.isStandalone` signal controls this behavior.

Payment numbers are auto-generated sequentially by the server via `IPaymentRepository.GenerateNextPaymentNumberAsync()`.

## Route

| Path | Component | Lazy-loaded |
|------|-----------|-------------|
| `/payments` | `PaymentsComponent` | Yes |

**Access roles:** Admin, Manager, OfficeManager (enforced by `PaymentsController` `[Authorize(Roles)]`).

**URL state:**
- `?detail=payment:{id}` -- opens the payment detail dialog for the specified payment. Set when a row is clicked, cleared on dialog close.

## Page Layout

The page is a full-height flex column with these zones:

1. **Page header** (`PageHeaderComponent`) -- title "Payments" with subtitle and "New Payment" button.
2. **Accounting banner** (conditional) -- shown when `isStandalone()` is `false`, displays the connected provider name.
3. **Filters bar** -- search input and payment method select.
4. **Data table** -- sortable, filterable payment list.
5. **Payment create dialog** (conditional) -- rendered when creating a new payment.

### Toolbar Controls

| Control | Type | Purpose |
|---------|------|---------|
| Search | `InputComponent` | Client-side filter on payment number, customer name, reference number |
| Method | `SelectComponent` | Client-side filter by payment method |
| New Payment | Button (primary) | Opens the create payment dialog |

## Filters

All filters operate client-side on the full payment list loaded at page init. The `filteredPayments` computed signal applies search term and method filter in sequence.

### Search

Free-text, case-insensitive match against `paymentNumber`, `customerName`, and `referenceNumber`. Filters reactively as the user types.

### Method Filter

Dropdown with options: All Methods, Cash, Check, Credit Card, Bank Transfer, Wire, Other.

## List View (DataTable)

Table ID: `payments`

| Column | Field | Sortable | Filterable | Type | Width | Align |
|--------|-------|----------|------------|------|-------|-------|
| Payment # | `paymentNumber` | Yes | No | text | 120px | left |
| Customer | `customerName` | Yes | No | text | auto | left |
| Method | `method` | Yes | Yes (enum) | enum | 100px | left |
| Amount | `amount` | Yes | No | number | 100px | right |
| Applied | `appliedAmount` | Yes | No | number | 100px | right |
| Unapplied | `unappliedAmount` | Yes | No | number | 100px | right |
| Date | `paymentDate` | Yes | No | date | 110px | left |
| Reference # | `referenceNumber` | Yes | No | text | 120px | left |
| Created | `createdAt` | Yes | No | date | 110px | left |

**Custom cell rendering:**
- **Payment #:** monospace styling via `.pmt-number` class.
- **Method:** translated label.
- **Monetary values:** `currency` pipe.
- **Unapplied:** warning color when unapplied amount > 0.
- **Dates:** muted text, formatted `MM/dd/yyyy`.
- **Reference #:** muted text, shows "---" when null.

**Row click:** opens the payment detail dialog via `DetailDialogService`.

**Empty state:** `payments` icon with "No payments found" message.

## Detail View (Dialog)

Payment details open as a full `MatDialog` via `DetailDialogService` at URL `?detail=payment:{id}`. The dialog contains `PaymentDetailPanelComponent`.

### Detail Panel Layout

**Header:** payments icon, payment number, customer name, close button.

**Info grid:**

| Field | Display |
|-------|---------|
| Customer | Entity link to customer detail |
| Method | Translated label |
| Payment Date | `MM/dd/yyyy` |
| Reference # | Plain text (conditional) |
| Amount | Currency |
| Applied | Currency |
| Unapplied | Currency (warning color when > 0) |

**Notes section:** shown only if notes exist.

**Applications table** (when applications exist):

| Column | Align |
|--------|-------|
| Invoice # | left (monospace) |
| Amount | right (currency) |

**Timestamps:** Created and Updated dates.

**Activity log:** `EntityActivitySectionComponent` showing payment history (tabs limited to `['history']`).

**Actions:**
- **Delete** (danger) -- visible only when the payment has zero applications. Opens confirmation dialog (severity: danger).

### Delete Rules

A payment can only be deleted if it has no invoice applications. This prevents orphaned invoice status changes. Payments with applications must be addressed through the accounting system or by first removing the applications.

## Create Payment Dialog

Opened via `PaymentDialogComponent`. Width: `960px`. Split layout with main panel (invoice applications) and sidebar (payment details + notes + summary).

### Form Fields (Sidebar)

| Field | Label | Type | Required | Validation | data-testid |
|-------|-------|------|----------|------------|-------------|
| Customer | Customer | Select (from API) | Yes | `Validators.required` | `payment-customer` |
| Method | Payment Method | Select | Yes | `Validators.required` | `payment-method` |
| Amount | Amount | Number input | Yes | `Validators.required`, `Validators.min(0.01)` | `payment-amount` |
| Payment Date | Payment Date | Datepicker | Yes | `Validators.required` | `payment-date` |
| Reference # | Reference # | Text input | No | -- | `payment-ref` |
| Notes | Notes | Textarea (3 rows) | No | -- | `payment-notes` |

**Payment Method options:** Cash, Check, Credit Card, Bank Transfer, Wire, Other. First option is "-- Select Method --" with null value.

**Customer options:** loaded from `CustomerService.getCustomers()` on dialog open. First option is "-- Select Customer --" with null value.

### Invoice Applications (Main Panel)

Applications are managed as a local signal array. Each application entry:

| Field | Label | Type | Required | Validation |
|-------|-------|------|----------|------------|
| Invoice ID | Invoice ID | Number input | Yes | `Validators.required` |
| Invoice # | Invoice # | Text input | Yes | `Validators.required` |
| Amount | Amount | Number input | Yes | `Validators.required`, `Validators.min(0.01)` |

**Add button:** disabled when the application form is invalid. Adds the application and resets the form.

**Remove:** each row has a danger icon button.

**Applications table** (when entries exist): Invoice #, Amount, Remove. Footer shows total applied.

### Summary Section (Sidebar)

Shows computed total applied across all applications.

### Save Behavior

- Submit button disabled when: form invalid or saving in progress.
- Applications are optional -- a payment can be recorded without applying to any invoice (advance payment / credit on account).
- Server-side validation: total applied amount cannot exceed payment amount.
- Server-side validation: each application amount cannot exceed the invoice's balance due.
- On save: calls `PaymentService.createPayment()`, clears draft, shows success snackbar, emits `saved` event.

### Draft Support

Draft config: `entityType: 'payment'`, `entityId: 'new'`, `route: '/payments'`. Snapshots both form values and applications array.

## Payment Application to Invoices

When a payment is created with invoice applications, the server automatically updates invoice statuses:

1. For each application, the handler loads the target invoice and calculates its current balance.
2. If the application amount exceeds the invoice balance, the request is rejected with an error.
3. A `PaymentApplication` record is created linking the payment to the invoice.
4. Invoice status transitions:
   - If new balance reaches zero: status changes to `Paid`.
   - If invoice was `Sent` or `Overdue` and has remaining balance: status changes to `PartiallyPaid`.

This means recording a payment can cascade status changes across multiple invoices in a single transaction.

## Payment Methods

The `PaymentMethod` enum defines accepted payment types:

| Value | Display Label |
|-------|---------------|
| Cash | Cash |
| Check | Check |
| CreditCard | Credit Card |
| BankTransfer | Bank Transfer |
| Wire | Wire |
| Other | Other |

## API Endpoints

| Method | Path | Auth Roles | Request Body | Response | Description |
|--------|------|------------|--------------|----------|-------------|
| GET | `/api/v1/payments` | Admin, Manager, OfficeManager | -- | `PaymentListItemModel[]` | List payments. Query: `?customerId=` |
| GET | `/api/v1/payments/{id}` | Admin, Manager, OfficeManager | -- | `PaymentDetailResponseModel` | Get payment detail |
| POST | `/api/v1/payments` | Admin, Manager, OfficeManager | `CreatePaymentRequestModel` | `PaymentListItemModel` (201) | Create payment |
| DELETE | `/api/v1/payments/{id}` | Admin, Manager, OfficeManager | -- | 204 | Soft-delete payment |

### Request/Response Models

**CreatePaymentRequestModel:**
```
{
  customerId: int (required, > 0),
  method: string (required, non-empty, enum name),
  amount: decimal (required, > 0),
  paymentDate: DateTimeOffset (required),
  referenceNumber: string? (optional),
  notes: string? (optional),
  applications: CreatePaymentApplicationModel[]? (optional)
}
```

**CreatePaymentApplicationModel:**
```
{
  invoiceId: int (required, > 0),
  amount: decimal (required, > 0)
}
```

**Validation rules (server):**
- `applications.sum(amount) <= payment.amount` -- total applied cannot exceed payment amount.
- Each `application.amount <= invoice.balanceDue` -- cannot over-apply to an invoice.

**PaymentListItemModel:**
```
{
  id, paymentNumber, customerId, customerName, method,
  amount, appliedAmount, unappliedAmount,
  paymentDate, referenceNumber, createdAt
}
```

**PaymentDetailResponseModel:**
```
{
  id, paymentNumber, customerId, customerName, method,
  amount, appliedAmount, unappliedAmount,
  paymentDate, referenceNumber, notes,
  applications: [{ id, invoiceId, invoiceNumber, amount }],
  createdAt, updatedAt
}
```

## Entity

**Payment** (`forge.core/Entities/Payment.cs`): extends `BaseAuditableEntity`.

| Property | Type | Notes |
|----------|------|-------|
| PaymentNumber | string | Auto-generated |
| CustomerId | int | FK to Customer |
| Method | PaymentMethod | Enum |
| Amount | decimal | Total payment amount |
| PaymentDate | DateTimeOffset | |
| ReferenceNumber | string? | Check number, transaction ID, etc. |
| Notes | string? | |
| ExternalId | string? | Accounting provider ID |
| ExternalRef | string? | Accounting provider reference |
| Provider | string? | Provider name |
| LastSyncedAt | DateTimeOffset? | Last sync timestamp |
| AppliedAmount | decimal | Computed: sum of application amounts |
| UnappliedAmount | decimal | Computed: amount - appliedAmount |

**PaymentApplication** (`forge.core/Entities/PaymentApplication.cs`): extends `BaseEntity`.

| Property | Type | Notes |
|----------|------|-------|
| PaymentId | int | FK to Payment |
| InvoiceId | int | FK to Invoice |
| Amount | decimal | Amount applied to this invoice |

## Known Limitations

1. **No editing after creation.** Payments cannot be modified. To correct a payment, delete it (if no applications) and re-create.
2. **No application modification.** Invoice applications cannot be added, removed, or adjusted after payment creation.
3. **Delete requires zero applications.** A payment with applications cannot be deleted. This prevents inconsistent invoice statuses.
4. **No refund support.** Negative payments or refund transactions are not modeled. Refunds must be handled externally.
5. **No payment receipt PDF.** Unlike invoices, there is no server-side PDF generation for payment receipts.
6. **Client-side filtering only.** The payment list is loaded in full and filtered client-side. This works for reasonable volumes but does not scale to very large payment histories.
7. **Standalone mode only.** When an accounting provider is connected, all payment CRUD operations are disabled.
