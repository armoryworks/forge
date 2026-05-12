# Expenses

## Overview

Expenses track business spending submitted by employees. Each expense has a submitter, date, amount, category, optional description, optional receipt attachment, and optional job association. Expenses go through an approval workflow where managers review and approve or reject submissions.

The feature includes three sub-views: the main expense list, a dedicated approval queue for managers, and an upcoming expenses forecast based on recurring expense schedules.

Expenses are not accounting-bounded -- they are always available regardless of accounting provider status. However, expenses have accounting integration fields (`ExternalId`, `ExternalRef`, `Provider`) to support optional sync with external systems.

## Routes

| Path | Component | Lazy-loaded |
|------|-----------|-------------|
| `/expenses` | `ExpensesComponent` | Yes |
| `/expenses/approval` | `ExpenseApprovalQueueComponent` | Yes |
| `/expenses/upcoming` | `UpcomingExpensesComponent` | Yes |

**Access roles:** All authenticated users can submit expenses (`[Authorize]` on `ExpensesController`). Settings management requires Admin or Manager. Approval requires a user with sufficient permissions (Admin, Manager).

## Page Layout -- Main Expense List

The main page is a full-height flex column:

1. **Page header** (`PageHeaderComponent`) -- title "Expenses" with subtitle and "Create Expense" button.
2. **Filters bar** -- search input, status select, total amount display.
3. **Data table** -- sortable, filterable expense list with inline approval actions.
4. **Expense create dialog** (conditional) -- rendered when creating a new expense.

### Toolbar Controls

| Control | Type | Purpose |
|---------|------|---------|
| Search | `InputComponent` | Server-side filter (triggers on Enter) |
| Status | `SelectComponent` | Server-side filter by expense status |
| Total | Inline text | Displays sum of all visible expenses |
| Create Expense | Button (primary) | Opens the create expense dialog |

## Filters

Filters trigger a server-side reload via query parameters on `GET /api/v1/expenses`.

### Search

Free-text search applied server-side via `?search=` parameter. Triggers on Enter.

### Status Filter

Dropdown with options: All Statuses, Pending, Approved, Rejected, Self-Approved.

## List View (DataTable)

Table ID: `expenses`

| Column | Field | Sortable | Filterable | Type | Width | Align |
|--------|-------|----------|------------|------|-------|-------|
| Date | `expenseDate` | Yes | No | date | auto | left |
| Category | `category` | Yes | No | text | auto | left |
| Description | `description` | No | No | text | auto | left |
| Job | `jobNumber` | No | No | text | auto | left |
| Submitted By | `userName` | Yes | No | text | auto | left |
| Amount | `amount` | Yes | No | number | auto | right |
| Status | `status` | Yes | Yes (enum) | enum | auto | left |
| Actions | `actions` | No | No | -- | 80px | right |

**Custom cell rendering:**
- **Date:** muted text, formatted `MM/dd/yyyy`.
- **Category:** displayed as a neutral chip.
- **Job:** muted text, shows em-dash when null.
- **Amount:** currency pipe.
- **Status:** colored chip. Pending = warning, Approved/SelfApproved = success, Rejected = error.
- **Actions:** for Pending expenses, shows approve (check, success) and reject (close, danger) icon buttons. Clicking either triggers immediate status update.

**Empty state:** `receipt_long` icon with "No expenses found" message and help text.

## Create Expense Dialog

Opened as an inline `DialogComponent` (not a MatDialog). Title: "New Expense".

### Form Fields

| Field | Label | Type | Required | Validation | data-testid |
|-------|-------|------|----------|------------|-------------|
| Amount | Amount | Currency input (`mask="currency"`, `prefix="$"`) | Yes | `Validators.required`, `Validators.min(0.01)` | `expense-amount` |
| Date | Date | Datepicker | Yes | `Validators.required` | `expense-date` |
| Category | Category | Select (from reference data) | Yes | `Validators.required` | `expense-category` |
| Description | Description | Textarea | No | -- | `expense-description` |

**Category options:** loaded from `ReferenceDataService.getAsOptions('expense_category')`. Admin-configurable via the reference data management screen.

**Default values:** Amount = 0, Date = today, Category = empty, Description = empty.

### Save Behavior

- Submit button shows "Submit Expense" with save icon.
- Disabled when form invalid or saving in progress.
- Validation popover on hover.
- On save: calls `ExpensesService.createExpense()`, clears draft, closes dialog, reloads list, shows "Expense submitted" snackbar.
- The submitting user is automatically set server-side from the JWT claims.

### Draft Support

Draft config: `entityType: 'expense'`, `entityId: 'new'`, `route: '/expenses'`.

## Approval Workflow

### Inline Approval (Main List)

On the main expenses list, Pending expenses show approve/reject icon buttons in the Actions column. Clicking either:
1. Calls `ExpensesService.updateExpenseStatus(id, { status: 'Approved' | 'Rejected' })`.
2. Reloads the expense list.
3. Shows a success snackbar.

### Approval Queue (`/expenses/approval`)

A dedicated page for reviewing pending expenses. Uses `PageLayoutComponent`.

**Data:** loads only Pending expenses via `getExpenses(undefined, 'Pending', search)`.

**Table columns:**

| Column | Field | Sortable | Type | Width |
|--------|-------|----------|------|-------|
| Date | `expenseDate` | Yes | date | 110px |
| Submitted By | `userName` | Yes | text | 160px |
| Category | `category` | Yes | text | 120px |
| Description | `description` | No | text | auto |
| Job | `jobNumber` | No | text | 100px |
| Amount | `amount` | Yes | number | 100px |
| Actions | -- | No | -- | 100px |

**Review dialog:** clicking a row opens a review dialog where the approver can add optional notes and then approve or reject. The dialog shows expense details and a notes textarea.

**Total display:** shows the sum of all pending expenses.

### Status Transitions

| From | To | Triggered By |
|------|----|-------------|
| (new) | Pending | Expense creation |
| Pending | Approved | Manager/Admin approval |
| Pending | Rejected | Manager/Admin rejection |
| (new) | SelfApproved | Self-approval (when allowed by settings) |

Status updates use `PATCH /api/v1/expenses/{id}/status` with optional `approvalNotes`.

## Expense Settings

Admin-configurable settings controlling approval behavior.

| Setting | Type | Description |
|---------|------|-------------|
| `allowSelfApproval` | boolean | Whether users can approve their own expenses |
| `autoApproveThreshold` | decimal? | Expenses at or below this amount are auto-approved |

- `GET /api/v1/expenses/settings` -- Admin, Manager only.
- `PUT /api/v1/expenses/settings` -- Admin only.

## Recurring Expenses

Recurring expenses define templates for periodic business expenses (rent, subscriptions, utilities). They generate actual expense records on schedule via Hangfire background jobs.

### Recurring Expense Fields

| Field | Type | Notes |
|-------|------|-------|
| Amount | decimal | Fixed amount per occurrence |
| Category | string | Expense category |
| Classification | string | Business classification |
| Description | string | |
| Vendor | string? | Vendor/payee name |
| Frequency | RecurrenceFrequency | Weekly, Biweekly, Monthly, Quarterly, Annually |
| Next Occurrence Date | Date | Next scheduled generation |
| Last Generated Date | Date? | When the last expense was created |
| End Date | Date? | Optional end date for the recurrence |
| Is Active | boolean | Whether the recurrence is active |
| Auto Approve | boolean | Whether generated expenses bypass approval |

### Recurrence Frequencies

`Weekly` | `Biweekly` | `Monthly` | `Quarterly` | `Annually`

## Upcoming Expenses (`/expenses/upcoming`)

A forecast view showing expenses expected within a configurable time window (default 90 days). Generated from active recurring expense schedules.

**Each upcoming item shows:** description, category, classification, vendor, amount, due date, frequency, auto-approve status.

## Receipt Upload

Expenses support receipt attachment via `receiptFileId`. The create request accepts an optional `receiptFileId` (string) referencing a `FileAttachment` uploaded via the Files API. The current create dialog does not include a file upload zone inline -- receipts must be uploaded separately.

## Delete

Expenses can be deleted by any authenticated user. Deletion opens a confirmation dialog (severity: danger) and calls `DELETE /api/v1/expenses/{id}`. Soft-delete only.

## Activity Log

`GET /api/v1/expenses/{id}/activity` returns the polymorphic activity log for an expense entity.

## API Endpoints

| Method | Path | Auth Roles | Request Body | Response | Description |
|--------|------|------------|--------------|----------|-------------|
| GET | `/api/v1/expenses` | Any authenticated | -- | `ExpenseResponseModel[]` | List expenses. Query: `?userId=&status=&search=` |
| POST | `/api/v1/expenses` | Any authenticated | `CreateExpenseRequestModel` | `ExpenseResponseModel` (201) | Create expense |
| PATCH | `/api/v1/expenses/{id}/status` | Any authenticated | `UpdateExpenseStatusRequestModel` | `ExpenseResponseModel` | Update expense status |
| DELETE | `/api/v1/expenses/{id}` | Any authenticated | -- | 204 | Soft-delete expense |
| GET | `/api/v1/expenses/{id}/activity` | Any authenticated | -- | `ActivityResponseModel[]` | Get expense activity log |
| GET | `/api/v1/expenses/settings` | Admin, Manager | -- | `ExpenseSettingsResponse` | Get expense settings |
| PUT | `/api/v1/expenses/settings` | Admin | `{ allowSelfApproval, autoApproveThreshold }` | 204 | Update expense settings |
| GET | `/api/v1/expenses/recurring` | Any authenticated | -- | `RecurringExpenseResponseModel[]` | List recurring expenses. Query: `?classification=` |
| POST | `/api/v1/expenses/recurring` | Any authenticated | `CreateRecurringExpenseRequestModel` | `RecurringExpenseResponseModel` (201) | Create recurring expense |
| PATCH | `/api/v1/expenses/recurring/{id}` | Any authenticated | Partial update | `RecurringExpenseResponseModel` | Update recurring expense |
| DELETE | `/api/v1/expenses/recurring/{id}` | Any authenticated | -- | 204 | Delete recurring expense |
| GET | `/api/v1/expenses/upcoming` | Any authenticated | -- | `UpcomingExpenseResponseModel[]` | Get upcoming expenses. Query: `?daysAhead=90&classification=` |

### Request/Response Models

**CreateExpenseRequestModel:**
```
{
  amount: decimal (required, > 0),
  category: string (required, max 100 chars),
  description: string (required, max 500 chars),
  jobId: int? (optional),
  receiptFileId: string? (optional),
  expenseDate: DateTimeOffset (required)
}
```

**UpdateExpenseStatusRequestModel:**
```
{
  status: ExpenseStatus (required: "Approved" | "Rejected"),
  approvalNotes: string? (optional)
}
```

**ExpenseResponseModel:**
```
{
  id, userId, userName, jobId, jobNumber,
  amount, category, description, receiptFileId,
  status, approvedBy, approvedByName, approvalNotes,
  expenseDate, createdAt
}
```

**CreateRecurringExpenseRequestModel:**
```
{
  amount: decimal (required),
  category: string (required),
  classification: string (required),
  description: string (required),
  vendor: string? (optional),
  frequency: RecurrenceFrequency (required),
  startDate: string (required, ISO date),
  endDate: string? (optional, ISO date),
  autoApprove: boolean (required)
}
```

## Status Lifecycle

```
(new) --> Pending --> Approved
                  |-> Rejected
(new) --> SelfApproved  (when settings allow)
```

- **Pending:** default status on creation. Awaiting manager review.
- **Approved:** manager has approved the expense.
- **Rejected:** manager has rejected the expense.
- **SelfApproved:** the submitter approved their own expense (requires `allowSelfApproval` setting enabled).

All statuses are terminal -- there is no resubmission or appeal workflow.

## Entity

**Expense** (`forge.core/Entities/Expense.cs`): extends `BaseAuditableEntity`.

| Property | Type | Notes |
|----------|------|-------|
| UserId | int | FK to ApplicationUser (submitter) |
| JobId | int? | FK to Job (optional association) |
| Amount | decimal | |
| Category | string | From reference data |
| Description | string | |
| ReceiptFileId | string? | FK to FileAttachment |
| Status | ExpenseStatus | Enum |
| ApprovedBy | int? | FK to ApplicationUser (approver) |
| ApprovalNotes | string? | Notes from the approver |
| ExternalExpenseId | string? | Legacy external ID |
| ExternalId | string? | Accounting provider ID |
| ExternalRef | string? | Accounting provider reference |
| Provider | string? | Provider name |
| ExpenseDate | DateTimeOffset | Date the expense occurred |

## Known Limitations

1. **No expense editing.** Submitted expenses cannot be modified. They must be deleted and re-created.
2. **No receipt upload in dialog.** The create dialog does not include an inline file upload component. Receipts must be uploaded via the Files API separately and the `receiptFileId` passed programmatically.
3. **No multi-item expenses.** Each expense is a single amount. There is no line-item breakdown within a single expense record.
4. **No resubmission workflow.** Rejected expenses cannot be resubmitted -- the user must create a new expense.
5. **No expense detail dialog.** Unlike invoices and payments, expenses do not have a detail dialog. All information is visible in the table row.
6. **No budget tracking.** There is no budget or spending limit feature to compare actual expenses against.
7. **Approval is not role-gated in the UI.** The approve/reject buttons appear for all users on the main list. Server-side enforcement via user ID determines who can approve.
