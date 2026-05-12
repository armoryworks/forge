# Customers

## Overview

The Customers feature provides full customer relationship management within Forge. It serves as the central hub for all customer-related data -- contact information, addresses, estimates, quotes, sales orders, jobs, invoices, credit status, and interaction history. Customers are a core entity that links to nearly every other domain in the system (order management, production, financials).

The feature has two main views: a searchable/filterable customer list at `/customers`, and a dedicated multi-tab customer detail page at `/customers/:id/:tab` with 10 tabs covering all aspects of the customer relationship.

---

## Routes & Navigation

| Route | Component | Description |
|-------|-----------|-------------|
| `/customers` | `CustomersComponent` | Customer list with search, filters, and create dialog |
| `/customers/:id` | (redirect) | Redirects to `/customers/:id/overview` |
| `/customers/:id/:tab` | `CustomerDetailComponent` | Full customer detail page with tabbed layout |

### Tab Routes

The `:tab` parameter accepts the following values:

| Tab Segment | Label | Description |
|-------------|-------|-------------|
| `overview` | Overview | Account details, accounting integration, credit status |
| `contacts` | Contacts | Contact cards with CRUD |
| `interactions` | Interactions | Call/email/meeting/note log with DataTable |
| `addresses` | Addresses | Multi-address display (billing, shipping, etc.) |
| `estimates` | Estimates | Non-binding estimates with create/edit/convert |
| `quotes` | Quotes | Formal quotes linked to customer (read-only list) |
| `orders` | Orders | Sales orders linked to customer (read-only list) |
| `jobs` | Jobs | Production jobs linked to customer (read-only list) |
| `invoices` | Invoices | Invoices linked to customer (read-only list) |
| `activity` | Activity | Chronological activity timeline |

Tab navigation uses the URL-as-source-of-truth pattern. The `activeTab` signal derives from `ActivatedRoute.paramMap`, and `switchTab()` navigates via `router.navigate(['..', tab])`. Browser back/forward navigates between tabs naturally.

---

## Access & Permissions

### CustomersController

```
[Authorize(Roles = "Admin,Manager,OfficeManager,PM,Engineer")]
```

All authenticated users with the roles Admin, Manager, OfficeManager, PM, or Engineer can access the customer list and detail pages, create/update/delete customers, manage contacts, log interactions, and view summaries.

### CustomerAddressesController

```
[Authorize(Roles = "Admin,Manager,OfficeManager,PM")]
```

Address management (CRUD) is restricted to Admin, Manager, OfficeManager, and PM roles. Engineers can view the addresses tab but cannot create, update, or delete addresses through the API.

### EstimatesController

```
[Authorize(Roles = "Admin,Manager,OfficeManager,PM")]
```

Estimate CRUD and convert-to-quote are restricted to Admin, Manager, OfficeManager, and PM roles.

Production Worker role has no access to the Customers feature.

---

## Customer List

### Location

`/customers` -- the `CustomersComponent`.

### Page Header

Title and subtitle are i18n-driven (`customers.title`, `customers.subtitle`). A primary action button "Create Customer" with the `add` icon opens the create dialog.

### Filters

The filter bar contains two controls:

| Control | Type | Description |
|---------|------|-------------|
| Search | `<app-input>` | Free-text search. Triggers on Enter key press. Passed as `?search=` query parameter to the API. |
| Status | `<app-select>` | Options: All (null), Active (true), Inactive (false). Passed as `?isActive=` query parameter to the API. |

Filters are applied by calling `loadCustomers()` which sends both parameters to `GET /api/v1/customers`.

### Table Columns

The customer list uses `<app-data-table>` with `tableId="customers"` (preferences persisted per user).

| Field | Header | Sortable | Filterable | Type | Width | Notes |
|-------|--------|----------|------------|------|-------|-------|
| `name` | Name | Yes | No | text | auto | Bold styling via `.customer-name` |
| `companyName` | Company | Yes | No | text | auto | Muted text; shows dash if null |
| `email` | Email | Yes | No | text | auto | Muted text; shows dash if null |
| `phone` | Phone | Yes | No | text | auto | Muted text; shows dash if null |
| `isActive` | Active | Yes | Yes | enum | 80px | Chip: green `Active` or muted `Inactive` |
| `contactCount` | Contacts | Yes | No | text | 90px | Center-aligned count |
| `jobCount` | Jobs | Yes | No | text | 70px | Center-aligned count |
| `createdAt` | Created | Yes | No | date | 110px | Format: `MM/dd/yyyy` |

### Row Click

Clicking a row navigates to `/customers/{id}` (which redirects to `/customers/{id}/overview`).

### Loading State

The table area uses `[appLoadingBlock]="loading()"` for component-level loading overlay.

### Empty State

Icon: `people`. Message: i18n key `customers.noCustomersFound`.

---

## Customer Detail Page

### Location

`/customers/:id/:tab` -- the `CustomerDetailComponent`.

### Header Section

The header is a sticky section above the tab content containing:

1. **Back link** -- "Customers" with `chevron_left` icon, links to `/customers`.
2. **Action buttons** -- "Edit" button (opens edit dialog) and Archive button (icon-only `archive` icon, opens confirmation).
3. **Identity block**:
   - Customer name as `<h1>`.
   - Active/Inactive chip (green success or muted).
   - Provider chip (shown only if `customer.provider` is set) -- blue info chip with `sync` icon and provider name, tooltip "Synced with {provider}".
   - Company name (shown only if set) as a subtitle paragraph.
   - Contact row with clickable `mailto:` and `tel:` links for email and phone.

### Stats Bar

A horizontal row of 6 metric tiles displayed below the identity block. Each stat shows a large value and a label. Clickable stats navigate to the corresponding tab.

| Stat | Value Source | Label | Clickable Tab |
|------|-------------|-------|---------------|
| Open Estimates | `c.estimateCount` | "Open Estimates" | `estimates` |
| Open Quotes | `c.quoteCount` | "Open Quotes" | `quotes` |
| Open Orders | `c.orderCount` | "Open Orders" | `orders` |
| Active Jobs | `c.activeJobCount` | "Active Jobs" | `jobs` |
| Outstanding | `c.openInvoiceTotal` (currency) | "Outstanding" | `invoices` |
| YTD Revenue | `c.ytdRevenue` (currency) | "YTD Revenue" | Not clickable |

The active tab's stat tile gets a `.cd-stat--active` visual highlight.

### Tab Bar

A horizontal `<nav>` with `role="tablist"` containing buttons for all 10 tabs. Each button has `role="tab"`, `aria-selected`, and `aria-label` attributes. The active tab gets `.cd-tab--active` styling.

### Tab Content

Tab content renders below the header in a `.cd-content` area. Each tab is conditionally rendered with `@if (activeTab() === 'tabName')` blocks.

---

## Overview Tab

Component: `CustomerOverviewTabComponent`

Input: the full `CustomerSummary` object.

### Account Details Section

Displays the following fields in a label-value layout:

| Label | Value | Notes |
|-------|-------|-------|
| Customer Name | `name` | Always shown |
| Company | `companyName` | Hidden if null |
| Email | `email` | Clickable `mailto:` link; hidden if null |
| Phone | `phone` | Clickable `tel:` link; hidden if null |
| Status | Active/Inactive chip | Green success or muted |
| Customer Since | `createdAt` | Format: `MM/dd/yyyy` |

### Accounting Integration Section

Shown only when `customer.provider` is set. Displays:

| Label | Value | Notes |
|-------|-------|-------|
| Provider | `provider` | e.g., "QuickBooks" |
| External ID | `externalId` | Monospace font; shown only if set |
| Reference | `externalRef` | Monospace font; shown only if set |

### Credit Status Card

The `CreditStatusCardComponent` is embedded in the overview tab. It loads credit status data independently via `GET /api/v1/customers/{id}/credit-status`.

#### Credit Status Display

- **Header**: "Credit Status" title with a risk-level chip (Low=green, Medium=yellow, High=red, OnHold=red).
- **Hold banner**: When `isOnHold` is true, a prominent banner shows a `block` icon, "Credit Hold" text, the hold reason, and a "Release" button.
- **Metrics grid**:

| Metric | Value | Notes |
|--------|-------|-------|
| Credit Limit | Currency or "None" | "None" when `creditLimit` is null |
| Open AR | `openArBalance` (currency) | |
| Pending Orders | `pendingOrdersTotal` (currency) | |
| Total Exposure | `totalExposure` (currency) | Red text when over limit |
| Available Credit | `availableCredit` (currency) | Red text when negative; shown only when credit limit is set |
| Utilization | `utilizationPercent` (percent) | Shown only when credit limit is set |

- **Utilization bar**: Visual progress bar capped at 100%, turns red when over limit. Shown only when a credit limit is set.
- **Place Hold action**: A "Place Hold" button with `block` icon (hidden when already on hold). Opens a dialog requiring a reason (textarea, max 500 chars, required).

#### Credit Hold Dialog

- Title: "Place Credit Hold"
- Warning text: "Customer will be blocked from new orders while on hold."
- Fields: Hold Reason (textarea, required, max 500 characters)
- Footer: Cancel / Place Hold

---

## Contacts Tab

Component: `CustomerContactsClusterComponent`

### Toolbar

A toolbar with a spacer and "Add Contact" primary button.

### Contact Cards

Contacts display as a grid of cards. Each card shows:

- **Avatar** (`<app-avatar>` with initials from first + last name, size `lg`).
- **Name** in `Last, First` format.
- **Primary badge**: A blue "Primary" chip if `isPrimary` is true. The card gets a `.contact-card--primary` class for visual differentiation.
- **Role** (shown if set).
- **Email** as clickable `mailto:` link with `email` icon.
- **Phone** as clickable `tel:` link with `phone` icon.
- **Actions**: Edit (pencil icon button) and Delete (trash icon button, danger variant).

### Empty State

Icon: `person_off`. Message: "No contacts yet". CTA: "Add First Contact" button.

### Contact Form Dialog

Used for both create ("New Contact") and edit ("Edit Contact") operations.

| Field | Control | Required | Validators | Notes |
|-------|---------|----------|------------|-------|
| First Name | `<app-input>` | Yes | `required`, `maxLength(100)` | |
| Last Name | `<app-input>` | Yes | `required`, `maxLength(100)` | |
| Email | `<app-input type="email">` | No | `email`, `maxLength(200)` | |
| Phone | `<app-input mask="phone">` | No | -- | Format: `(XXX) XXX-XXXX` |
| Role | `<app-select>` | No | -- | Options loaded from reference data (`contact_role` group) with "-- None --" null option |
| Primary Contact | `<app-toggle>` | No | -- | Boolean toggle |

**Layout**: First Name / Last Name in a dialog row. Email / Phone in a dialog row. Role / Primary Contact in a dialog row.

**Delete confirmation**: ConfirmDialog with severity `warn`. Message: "Remove {firstName} {lastName} from this customer?"

---

## Interactions Tab

Component: `CustomerInteractionsClusterComponent`

### Toolbar

- **Contact filter**: `<app-select>` with options dynamically loaded from the customer's contacts. Default "-- All Contacts --" null option.
- **Type filter**: `<app-select>` with options: All Types, Call, Email, Meeting, Note.
- **Spacer + "Log Interaction" primary button**.

Changing either filter reloads the interaction list. Contact filter is sent as `?contactId=` to the API. Type filter is applied client-side after the API response.

### Interactions Table

Uses `<app-data-table>` with `tableId="customer-interactions"`. Loading overlay via `[appLoadingBlock]`.

| Field | Header | Sortable | Filterable | Type | Width | Notes |
|-------|--------|----------|------------|------|-------|-------|
| `type` | Type | Yes | Yes | enum | 100px | Chip with icon: `phone` (Call), `email` (Email), `groups` (Meeting), `note` (Note) |
| `subject` | Subject | Yes | No | text | auto | |
| `contactName` | Contact | Yes | No | text | 160px | |
| `userName` | Logged By | Yes | No | text | 160px | |
| `interactionDate` | Date | Yes | No | date | 120px | Format: `MM/dd/yyyy` |
| `durationMinutes` | Duration | Yes | No | number | 90px | Formatted as `Xh Ym` or `Xm`; dash if null |
| `actions` | (empty) | No | No | -- | 80px | Edit and Delete icon buttons |

Empty state icon: `forum`. Message: "No interactions recorded".

### Interaction Form Dialog

Title: "Log Interaction" (create) or "Edit Interaction" (edit). Width: 520px.

| Field | Control | Required | Validators | Notes |
|-------|---------|----------|------------|-------|
| Type | `<app-select>` | Yes | `required` | Options: Call, Email, Meeting, Note. Default: Call |
| Contact | `<app-select>` | No | -- | Options from customer contacts with "-- All Contacts --" null option |
| Subject | `<app-input>` | Yes | `required`, `maxLength(200)` | |
| Date | `<app-datepicker>` | Yes | `required` | Default: today |
| Duration (minutes) | `<app-input type="number">` | No | -- | |
| Notes | `<app-textarea>` | No | -- | 4 rows |

**Layout**: Type / Contact in a dialog row. Subject full width. Date / Duration in a dialog row. Notes full width.

**Delete confirmation**: ConfirmDialog with severity `danger`. Message: "Delete '{subject}'? This cannot be undone."

---

## Addresses Tab

Component: `CustomerAddressesClusterComponent`

### Display

Addresses are fetched from `GET /api/v1/customers/{customerId}/addresses` and displayed as a list of cards. Each card shows:

- **Header**: Address type as a muted chip (e.g., "Billing", "Shipping"). "Default" blue primary chip if `isDefault` is true.
- **Lines**: `line1`, `line2` (if set), `city, state zipCode`, `country`.

### Empty State

Icon: `location_off`. Message: "No addresses on file".

Note: The addresses tab currently displays addresses in read-only mode. Address CRUD is available through the `CustomerAddressesController` API but the UI tab does not currently include create/edit/delete actions.

### Address Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Address ID |
| `type` | string | Address type (e.g., Billing, Shipping) |
| `line1` | string | Street address line 1 |
| `line2` | string (optional) | Street address line 2 |
| `city` | string | City |
| `state` | string | State code |
| `zipCode` | string | ZIP / postal code |
| `country` | string | Country |
| `isDefault` | boolean | Whether this is the default address |

---

## Estimates Tab

Component: `CustomerEstimatesTabComponent`

Estimates are non-binding ballpark figures. They are stored in the `quotes` table with `type='Estimate'` and are managed through the separate `EstimatesController` at `/api/v1/estimates`.

### Toolbar

"New Estimate" primary button.

### Estimates Table

Uses `<app-data-table>` with `tableId="customer-estimates"`. Rows are clickable (opens the edit dialog).

| Field | Header | Sortable | Filterable | Type | Width | Notes |
|-------|--------|----------|------------|------|-------|-------|
| `title` | Title | Yes | No | text | auto | |
| `estimatedAmount` | Amount | Yes | No | number | 120px | Currency formatted, right-aligned |
| `status` | Status | Yes | Yes | enum | 110px | Chip with color by status |
| `validUntil` | Valid Until | Yes | No | date | 110px | Format: `MM/dd/yyyy` |
| `createdAt` | Created | Yes | No | date | 100px | Format: `MM/dd/yyyy` |
| `actions` | (empty) | No | No | -- | 100px | Convert-to-quote and Delete buttons |

### Status Chip Colors

| Status | Chip Class |
|--------|-----------|
| Draft | `chip--muted` |
| Sent | `chip--info` |
| Accepted | `chip--success` |
| Declined | `chip--error` |
| Expired | `chip--warning` |
| ConvertedToQuote | `chip--primary` |

### Actions Column

- **Convert to Quote** (`forward` icon): Shown only when `generatedQuoteId` is null (not yet converted). Opens ConfirmDialog with severity `info`. On confirmation, calls `POST /api/v1/estimates/{id}/convert`. The estimate is marked as Accepted and a new formal Quote is created.
- **Delete** (`delete` icon, danger): Opens ConfirmDialog with severity `danger`.

### Estimate Form Dialog

Title: "New Estimate" (create) or "Edit Estimate" (edit). Width: 520px.

| Field | Control | Required | Validators | Notes |
|-------|---------|----------|------------|-------|
| Title | `<app-input>` | Yes | `required`, `maxLength(300)` | |
| Description | `<app-textarea>` | No | -- | 2 rows |
| Estimated Amount | `<app-input mask="currency">` | Yes | `required`, `min(0)` | Dollar prefix |
| Valid Until | `<app-datepicker>` | No | -- | |
| Status | `<app-select>` | No | -- | Only shown when editing. Options: Draft, Sent, Accepted, Declined, Expired |
| Notes | `<app-textarea>` | No | -- | 2 rows |

**Layout**: Title full width. Description full width. Estimated Amount / Valid Until in a dialog row. Status full width (edit only). Notes full width.

---

## Quotes Tab

Component: `CustomerQuotesTabComponent`

Displays formal, binding quotes associated with this customer. Data loaded from `GET /api/v1/quotes?customerId={id}`. This is a read-only list -- quote CRUD is handled in the dedicated Quotes feature (`/quotes`).

### Quotes Table

Uses `<app-data-table>` with `tableId="customer-quotes"`. Rows are clickable (navigates to `/quotes?id={quoteId}`).

| Field | Header | Sortable | Filterable | Type | Width | Notes |
|-------|--------|----------|------------|------|-------|-------|
| `quoteNumber` | Quote # | Yes | No | text | 100px | |
| `status` | Status | Yes | No | text | 110px | Chip with color by status |
| `lineCount` | Lines | Yes | No | text | 70px | Center-aligned |
| `total` | Total | Yes | No | number | 120px | Currency formatted, right-aligned |
| `expirationDate` | Expires | Yes | No | date | 100px | Format: `MM/dd/yyyy` |
| `createdAt` | Created | Yes | No | date | 100px | Format: `MM/dd/yyyy` |

### Quote Status Chip Colors

| Status | Chip Class |
|--------|-----------|
| Draft | `chip--muted` |
| Sent | `chip--info` |
| Accepted | `chip--success` |
| Declined | `chip--error` |
| Expired | `chip--warning` |
| ConvertedToOrder | `chip--primary` |

Empty state icon: `request_quote`. Message: "No quotes yet".

---

## Orders Tab

Component: `CustomerOrdersTabComponent`

Displays sales orders associated with this customer. Data loaded from `GET /api/v1/orders?customerId={id}`. Read-only list -- sales order CRUD is in the Sales Orders feature (`/sales-orders`).

### Orders Table

Uses `<app-data-table>` with `tableId="customer-orders"`. Rows are clickable (navigates to `/sales-orders?id={orderId}`).

| Field | Header | Sortable | Filterable | Type | Width | Notes |
|-------|--------|----------|------------|------|-------|-------|
| `orderNumber` | SO # | Yes | No | text | 100px | |
| `status` | Status | Yes | No | text | 120px | Chip with color by status |
| `lineCount` | Lines | Yes | No | text | 70px | Center-aligned |
| `total` | Total | Yes | No | number | 120px | Currency formatted, right-aligned |
| `requestedDeliveryDate` | Req. Date | Yes | No | date | 100px | Format: `MM/dd/yyyy` |
| `createdAt` | Created | Yes | No | date | 100px | Format: `MM/dd/yyyy` |

### Sales Order Status Chip Colors

| Status | Chip Class |
|--------|-----------|
| Draft | `chip--muted` |
| Confirmed | `chip--info` |
| InProduction | `chip--primary` |
| Shipped | `chip--success` |
| Completed | `chip--success` |
| Cancelled | `chip--error` |

Empty state icon: `shopping_cart`. Message: "No sales orders yet".

---

## Jobs Tab

Component: `CustomerJobsTabComponent`

Displays production jobs linked to this customer. Data loaded from `GET /api/v1/jobs?customerId={id}`. Read-only list -- job management is in the Kanban feature.

### Jobs Table

Uses `<app-data-table>` with `tableId="customer-jobs"`. Rows are clickable (navigates to `/board?job={jobId}`).

| Field | Header | Sortable | Filterable | Type | Width | Notes |
|-------|--------|----------|------------|------|-------|-------|
| `jobNumber` | Job # | Yes | No | text | 90px | |
| `title` | Title | Yes | No | text | auto | |
| `stageName` | Stage | Yes | No | text | 140px | Chip with `--chip-color` set to stage color |
| `priority` | Priority | Yes | No | text | 90px | |
| `dueDate` | Due | Yes | No | date | 100px | Format: `MM/dd/yyyy` |
| `createdAt` | Created | Yes | No | date | 100px | Format: `MM/dd/yyyy` |

Empty state icon: `work_off`. Message: "No jobs linked to this customer".

---

## Invoices Tab

Component: `CustomerInvoicesTabComponent`

Displays invoices linked to this customer. Data loaded from `GET /api/v1/invoices?customerId={id}`. Read-only list -- invoice management is in the Invoices feature (`/invoices`).

### Invoices Table

Uses `<app-data-table>` with `tableId="customer-invoices"`. Rows are clickable (navigates to `/invoices?id={invoiceId}`).

| Field | Header | Sortable | Filterable | Type | Width | Notes |
|-------|--------|----------|------------|------|-------|-------|
| `invoiceNumber` | Invoice # | Yes | No | text | 110px | |
| `status` | Status | Yes | No | text | 120px | Chip with color by status |
| `total` | Total | Yes | No | number | 120px | Currency formatted, right-aligned |
| `dueDate` | Due Date | Yes | No | date | 100px | Format: `MM/dd/yyyy` |
| `createdAt` | Created | Yes | No | date | 100px | Format: `MM/dd/yyyy` |

### Invoice Status Chip Colors

| Status | Chip Class |
|--------|-----------|
| Draft | `chip--muted` |
| Sent | `chip--info` |
| PartiallyPaid | `chip--warning` |
| Paid | `chip--success` |
| Overdue | `chip--error` |
| Void | `chip--muted` |

Empty state icon: `receipt_long`. Message: "No invoices yet".

---

## Activity Tab

Component: `CustomerActivityTabComponent`

Displays a chronological activity timeline for the customer using the shared `<app-activity-timeline>` component. Data loaded from `GET /api/v1/customers/{id}/activity`.

The timeline shows all logged activities for the customer entity, including field changes, contact modifications, estimate actions, and other tracked operations. Each entry includes a description, timestamp, and user attribution (initials and color).

### Loading State

Shows the `hourglass_empty` icon while loading.

---

## Create Customer Dialog

Opened from the customer list page via the "Create Customer" button.

| Field | Control | Required | Validators | data-testid |
|-------|---------|----------|------------|-------------|
| Name | `<app-input>` | Yes | `required` | `customer-name` |
| Company Name | `<app-input>` | No | -- | `customer-company` |
| Email | `<app-input type="email">` | No | `email` | `customer-email` |
| Phone | `<app-input>` | No | -- | `customer-phone` |

**Layout**: Name full width. Company Name full width. Email / Phone in a dialog row.

**Validation**: Hover popover on submit button shows violations. Submit button disabled when form is invalid or saving.

**On save**: Creates customer via `POST /api/v1/customers`, shows success snackbar, and navigates to `/customers/{newId}`.

---

## Edit Customer Dialog

Opened from the customer detail page header via the "Edit" button. Width: 520px.

| Field | Control | Required | Validators |
|-------|---------|----------|------------|
| Name | `<app-input>` | Yes | `required`, `maxLength(200)` |
| Company Name | `<app-input>` | No | -- |
| Email | `<app-input type="email">` | No | `email`, `maxLength(200)` |
| Phone | `<app-input mask="phone">` | No | -- |

Note: The `isActive` field is included in the form group but not rendered in the edit dialog template. Active/inactive status is managed through the form model but the toggle is not currently exposed in the dialog UI.

**On save**: Updates customer via `PUT /api/v1/customers/{id}`, shows success snackbar, and reloads the customer summary.

---

## Archive Customer

Triggered by the archive icon button in the customer detail header. Opens a `ConfirmDialogComponent` with severity `warn`. On confirmation, calls `DELETE /api/v1/customers/{id}` (soft delete), shows success snackbar, and navigates back to `/customers`.

---

## Customer Statement PDF

The API provides a PDF statement endpoint at `GET /api/v1/customers/{id}/statement`. This generates a PDF file (`statement-{id}.pdf`) via QuestPDF on the server. The endpoint is available but not currently exposed in the UI.

---

## API Endpoints

### Customers

#### List Customers

```
GET /api/v1/customers?search={term}&isActive={bool}
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
```

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Free-text search filter |
| `isActive` | boolean | No | Filter by active status |

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Hartman, Daniel J",
    "companyName": "Acme Manufacturing",
    "email": "daniel@acme.com",
    "phone": "(555) 123-4567",
    "isActive": true,
    "contactCount": 3,
    "jobCount": 12,
    "createdAt": "2024-01-15T00:00:00Z"
  }
]
```

#### Get Customer Dropdown

```
GET /api/v1/customers/dropdown
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
```

Returns a lightweight list of customers for use in dropdown selects (entity pickers, form selects, etc.).

**Response:** `200 OK` -- array of `CustomerResponseModel`.

#### Get Customer Detail

```
GET /api/v1/customers/{id}
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Acme Manufacturing",
  "companyName": "Acme Corp",
  "email": "info@acme.com",
  "phone": "(555) 123-4567",
  "isActive": true,
  "externalId": "123",
  "externalRef": "CUST-001",
  "provider": "QuickBooks",
  "createdAt": "2024-01-15T00:00:00Z",
  "updatedAt": "2024-06-01T00:00:00Z",
  "contacts": [
    {
      "id": 1,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@acme.com",
      "phone": "(555) 234-5678",
      "role": "Purchasing Manager",
      "isPrimary": true
    }
  ],
  "jobs": [
    {
      "id": 100,
      "jobNumber": "JOB-100",
      "title": "CNC Housing",
      "stageName": "In Production",
      "stageColor": "#4CAF50",
      "dueDate": "2024-12-01T00:00:00Z"
    }
  ]
}
```

#### Get Customer Summary

```
GET /api/v1/customers/{id}/summary
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
```

Returns aggregated metrics used by the detail page header and stats bar.

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Acme Manufacturing",
  "companyName": "Acme Corp",
  "email": "info@acme.com",
  "phone": "(555) 123-4567",
  "isActive": true,
  "externalId": "123",
  "externalRef": "CUST-001",
  "provider": "QuickBooks",
  "createdAt": "2024-01-15T00:00:00Z",
  "updatedAt": "2024-06-01T00:00:00Z",
  "estimateCount": 2,
  "quoteCount": 5,
  "orderCount": 3,
  "activeJobCount": 4,
  "openInvoiceCount": 2,
  "openInvoiceTotal": 15000.00,
  "ytdRevenue": 125000.00
}
```

#### Create Customer

```
POST /api/v1/customers
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
Content-Type: application/json

{
  "name": "Acme Manufacturing",
  "companyName": "Acme Corp",
  "email": "info@acme.com",
  "phone": "(555) 123-4567"
}
```

**Response:** `201 Created` with `Location` header.

```json
{
  "id": 1,
  "name": "Acme Manufacturing",
  "companyName": "Acme Corp",
  "email": "info@acme.com",
  "phone": "(555) 123-4567",
  "isActive": true,
  "contactCount": 0,
  "jobCount": 0,
  "createdAt": "2024-01-15T00:00:00Z"
}
```

#### Update Customer

```
PUT /api/v1/customers/{id}
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
Content-Type: application/json

{
  "name": "Acme Manufacturing Inc.",
  "companyName": "Acme Corp",
  "email": "info@acme.com",
  "phone": "(555) 123-4567",
  "isActive": true
}
```

**Response:** `204 No Content`

#### Delete (Archive) Customer

```
DELETE /api/v1/customers/{id}
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
```

**Response:** `204 No Content`. Soft-deletes the customer (sets `DeletedAt`).

---

### Contacts

#### Create Contact

```
POST /api/v1/customers/{customerId}/contacts
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@acme.com",
  "phone": "(555) 234-5678",
  "role": "Purchasing Manager",
  "isPrimary": true
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@acme.com",
  "phone": "(555) 234-5678",
  "role": "Purchasing Manager",
  "isPrimary": true
}
```

#### Update Contact

```
PUT /api/v1/customers/{customerId}/contacts/{contactId}
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@acme.com",
  "phone": "(555) 234-5678",
  "role": "VP Purchasing",
  "isPrimary": true
}
```

**Response:** `200 OK` -- returns the updated `ContactResponseModel`.

#### Delete Contact

```
DELETE /api/v1/customers/{customerId}/contacts/{contactId}
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
```

**Response:** `204 No Content`

---

### Contact Interactions

#### List Interactions

```
GET /api/v1/customers/{customerId}/interactions?contactId={contactId}
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
```

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contactId` | int | No | Filter by specific contact |

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "contactId": 1,
    "contactName": "Smith, Jane",
    "userId": 5,
    "userName": "Hokanson, Daniel",
    "type": "Call",
    "subject": "Discuss Q4 order schedule",
    "body": "Called to confirm delivery timeline for remaining Q4 orders.",
    "interactionDate": "2024-11-01T00:00:00Z",
    "durationMinutes": 15,
    "createdAt": "2024-11-01T14:30:00Z"
  }
]
```

#### Create Interaction

```
POST /api/v1/customers/{customerId}/interactions
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
Content-Type: application/json

{
  "contactId": 1,
  "type": "Call",
  "subject": "Discuss Q4 order schedule",
  "body": "Called to confirm delivery timeline.",
  "interactionDate": "2024-11-01T00:00:00Z",
  "durationMinutes": 15
}
```

**Response:** `201 Created` -- returns `ContactInteractionResponseModel`.

#### Update Interaction

```
PATCH /api/v1/customers/{customerId}/interactions/{interactionId}
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
Content-Type: application/json
```

Same request body as create. **Response:** `200 OK` -- returns updated `ContactInteractionResponseModel`.

#### Delete Interaction

```
DELETE /api/v1/customers/{customerId}/interactions/{interactionId}
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
```

**Response:** `204 No Content`

---

### Customer Addresses

#### List Addresses

```
GET /api/v1/customers/{customerId}/addresses
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM
```

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "type": "Billing",
    "line1": "123 Main St",
    "line2": "Suite 200",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701",
    "country": "US",
    "isDefault": true
  }
]
```

#### Create Address

```
POST /api/v1/customers/{customerId}/addresses
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM
Content-Type: application/json

{
  "label": "Main Office",
  "addressType": "Billing",
  "line1": "123 Main St",
  "line2": "Suite 200",
  "city": "Springfield",
  "state": "IL",
  "postalCode": "62701",
  "country": "US",
  "isDefault": true
}
```

**Response:** `201 Created` -- returns `CustomerAddressResponseModel`.

#### Update Address

```
PUT /api/v1/customers/{customerId}/addresses/{id}
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM
Content-Type: application/json
```

Same fields as create. **Response:** `204 No Content`.

#### Delete Address

```
DELETE /api/v1/customers/{customerId}/addresses/{id}
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM
```

**Response:** `204 No Content`

---

### Credit Management

#### Get Credit Status

```
GET /api/v1/customers/{id}/credit-status
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
```

**Response:** `200 OK`

```json
{
  "customerId": 1,
  "customerName": "Acme Manufacturing",
  "creditLimit": 50000.00,
  "openArBalance": 12000.00,
  "pendingOrdersTotal": 8000.00,
  "totalExposure": 20000.00,
  "availableCredit": 30000.00,
  "utilizationPercent": 40.0,
  "isOnHold": false,
  "holdReason": null,
  "isOverLimit": false,
  "riskLevel": "Low"
}
```

#### Place Credit Hold

```
POST /api/v1/customers/{id}/credit-hold
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
Content-Type: application/json

{
  "reason": "Overdue invoices exceeding 90 days"
}
```

**Response:** `204 No Content`

#### Release Credit Hold

```
POST /api/v1/customers/{id}/credit-release
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
```

**Response:** `204 No Content`

#### Credit Risk Report

```
GET /api/v1/customers/credit-risk-report
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
```

Returns credit status for all customers, used for risk analysis reporting.

**Response:** `200 OK` -- array of `CreditStatusResponseModel`.

---

### Customer Activity

```
GET /api/v1/customers/{id}/activity
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
```

**Response:** `200 OK` -- array of `ActivityResponseModel` (see shared `ActivityItem` model).

---

### Customer Statement

```
GET /api/v1/customers/{id}/statement
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM, Engineer
```

**Response:** `200 OK` -- `application/pdf` binary file, filename `statement-{id}.pdf`.

---

### Estimates

#### List Estimates

```
GET /api/v1/estimates?customerId={id}&status={status}
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM
```

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `customerId` | int | No | Filter by customer |
| `status` | QuoteStatus | No | Filter by status (Draft, Sent, Accepted, Declined, Expired) |

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "customerId": 1,
    "customerName": "Acme Manufacturing",
    "title": "CNC Housing Prototype",
    "estimatedAmount": 15000.00,
    "status": "Sent",
    "validUntil": "2024-12-31T00:00:00Z",
    "generatedQuoteId": null,
    "assignedToName": "Hokanson, Daniel",
    "createdAt": "2024-10-01T00:00:00Z"
  }
]
```

#### Get Estimate Detail

```
GET /api/v1/estimates/{id}
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM
```

**Response:** `200 OK` -- returns `EstimateDetailResponseModel` (extends list item with `description`, `notes`, `assignedToId`, `convertedAt`, `updatedAt`).

#### Create Estimate

```
POST /api/v1/estimates
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM
Content-Type: application/json

{
  "customerId": 1,
  "title": "CNC Housing Prototype",
  "description": "Initial estimate for prototype run",
  "estimatedAmount": 15000.00,
  "validUntil": "2024-12-31T00:00:00Z",
  "notes": "Pending material pricing confirmation"
}
```

**Response:** `201 Created` with `Location` header.

#### Update Estimate

```
PUT /api/v1/estimates/{id}
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM
Content-Type: application/json

{
  "title": "CNC Housing Prototype - Revised",
  "estimatedAmount": 18000.00,
  "status": "Sent",
  "validUntil": "2025-01-31T00:00:00Z"
}
```

**Response:** `204 No Content`

#### Delete Estimate

```
DELETE /api/v1/estimates/{id}
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM
```

**Response:** `204 No Content`

#### Convert Estimate to Quote

```
POST /api/v1/estimates/{id}/convert
Authorization: Bearer {token}
Roles: Admin, Manager, OfficeManager, PM
```

Converts the estimate to a formal quote. The estimate is marked as `ConvertedToQuote` (via `Accepted` transition) and a new `Quote`-type record is created with a `source_estimate_id` FK back to the original estimate.

**Response:** `200 OK`

```json
{
  "id": 50,
  "quoteNumber": "QUO-00050"
}
```

---

## Data Models

### CustomerSummary (detail page header)

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Customer ID |
| `name` | string | Customer name |
| `companyName` | string (optional) | Company name |
| `email` | string (optional) | Email address |
| `phone` | string (optional) | Phone number |
| `isActive` | boolean | Active status |
| `externalId` | string (optional) | External accounting system ID |
| `externalRef` | string (optional) | External reference number |
| `provider` | string (optional) | Accounting provider name (e.g., "QuickBooks") |
| `createdAt` | string (ISO) | Creation timestamp |
| `updatedAt` | string (ISO) | Last update timestamp |
| `estimateCount` | number | Open estimate count |
| `quoteCount` | number | Open quote count |
| `orderCount` | number | Open sales order count |
| `activeJobCount` | number | Active job count |
| `openInvoiceCount` | number | Open invoice count |
| `openInvoiceTotal` | number | Total outstanding invoice amount |
| `ytdRevenue` | number | Year-to-date revenue |

### CreditStatus

| Field | Type | Description |
|-------|------|-------------|
| `customerId` | number | Customer ID |
| `customerName` | string | Customer name |
| `creditLimit` | number (nullable) | Credit limit; null means no limit |
| `openArBalance` | number | Open accounts receivable balance |
| `pendingOrdersTotal` | number | Total of pending/confirmed orders |
| `totalExposure` | number | AR + pending orders combined |
| `availableCredit` | number | Credit limit minus total exposure |
| `utilizationPercent` | number | Percentage of credit limit used |
| `isOnHold` | boolean | Whether customer is on credit hold |
| `holdReason` | string (nullable) | Reason for credit hold |
| `isOverLimit` | boolean | Whether exposure exceeds credit limit |
| `riskLevel` | `'Low' \| 'Medium' \| 'High' \| 'OnHold'` | Calculated risk level |

### ContactInteraction

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Interaction ID |
| `contactId` | number | Associated contact ID |
| `contactName` | string | Contact display name |
| `userId` | number | User who logged the interaction |
| `userName` | string | User display name |
| `type` | `'Call' \| 'Email' \| 'Meeting' \| 'Note'` | Interaction type |
| `subject` | string | Subject line |
| `body` | string (nullable) | Detailed notes |
| `interactionDate` | string (ISO) | When the interaction occurred |
| `durationMinutes` | number (nullable) | Duration in minutes |
| `createdAt` | string (ISO) | Record creation timestamp |

### Estimate

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Estimate ID |
| `customerId` | number | Customer ID |
| `customerName` | string | Customer name |
| `title` | string | Estimate title |
| `estimatedAmount` | number | Ballpark dollar amount |
| `status` | EstimateStatus | Draft, Sent, Accepted, Declined, Expired, ConvertedToQuote |
| `validUntil` | string (ISO, optional) | Expiration date |
| `generatedQuoteId` | number (optional) | ID of quote created from this estimate |
| `assignedToName` | string (optional) | Assigned user name |
| `createdAt` | string (ISO) | Creation timestamp |

---

## Known Limitations

1. **Addresses tab is read-only in the UI.** The `CustomerAddressesController` supports full CRUD (create, update, delete), but the `CustomerAddressesClusterComponent` only fetches and displays addresses. There are no create, edit, or delete buttons in the tab. Address management must be done through the API directly or through other features that use addresses (e.g., sales orders, shipments).

2. **Edit dialog does not expose isActive toggle.** The edit form group includes an `isActive` FormControl, but the dialog template does not render a toggle for it. There is no UI mechanism to deactivate a customer other than archiving (soft delete).

3. **Customer Statement PDF is not linked in the UI.** The `GET /api/v1/customers/{id}/statement` endpoint generates a PDF statement, but no button or link in the customer detail page triggers a download.

4. **Quotes, Orders, Jobs, and Invoices tabs are read-only.** These tabs display data from their respective feature APIs filtered by customer ID but do not provide create/edit/delete actions. Users must navigate to the dedicated feature pages for CRUD operations.

5. **Type filter on Interactions tab is client-side.** The contact filter sends `?contactId=` to the API, but the type filter is applied after the API response using `Array.filter()`. This means all interactions are fetched and then filtered in the browser.

6. **Contact roles come from reference data.** The role dropdown in the contact form loads options from the `contact_role` reference data group via `ReferenceDataService`. If no reference data entries exist for this group, only the "-- None --" option will appear.

7. **Credit risk report endpoint exists but has no dedicated UI.** `GET /api/v1/customers/credit-risk-report` returns credit status for all customers, but there is no page or report that consumes it directly (it may be used by the Reports module).

8. **No pagination on the customer list.** The list endpoint returns all customers matching the filter criteria without pagination. For large customer bases, this could be a performance concern.
