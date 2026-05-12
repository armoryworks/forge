# Payroll

## Overview

Payroll provides employee self-service access to pay stubs and tax documents, along with admin capabilities for uploading and managing these records. The feature is split into two perspectives:

1. **Employee self-service** -- employees view their own pay stubs and tax documents from the Account section.
2. **Admin/Manager** -- administrators upload pay stubs and tax documents for employees, and trigger payroll data syncs from external providers.

Payroll records can originate from two sources:
- **Manual** -- uploaded directly by an admin/manager via the API.
- **Accounting** -- synced from a connected accounting provider (e.g., QuickBooks Payroll).

Forge does not perform payroll calculations, tax withholding, or paycheck generation. It is a document distribution and self-service portal, not a payroll processing system.

## Routes

Payroll pages are nested under the Account section:

| Path | Component | Lazy-loaded |
|------|-----------|-------------|
| `/account/pay-stubs` | `AccountPayStubsComponent` | Yes |
| `/account/tax-documents` | `AccountTaxDocumentsComponent` | Yes |

**Access roles:** All authenticated users can view their own pay stubs and tax documents (`[Authorize]` on employee self-service endpoints). Admin, Manager, and OfficeManager can view/upload/delete records for any user.

**Navigation:** Both pages are accessible from the Account sidebar navigation within the `/account` layout.

## Pay Stubs

### Employee View (`/account/pay-stubs`)

Displays the authenticated user's pay stubs in a DataTable.

**Page layout:**
1. **Title** -- "Pay Stubs" heading with subtitle.
2. **Data table** -- sortable pay stub list.

**Table ID:** `account-pay-stubs`

| Column | Field | Sortable | Type | Width | Align |
|--------|-------|----------|------|-------|-------|
| Pay Date | `payDate` | Yes | date | 120px | left |
| Period | `period` | No | text | 200px | left |
| Gross Pay | `grossPay` | Yes | number | 120px | right |
| Net Pay | `netPay` | Yes | number | 120px | right |
| Deductions | `totalDeductions` | Yes | number | 120px | right |
| Source | `source` | Yes | text | 100px | left |
| Actions | -- | No | -- | 60px | left |

**Custom cell rendering:**
- **Pay Date:** formatted `MM/dd/yyyy`.
- **Period:** displays `payPeriodStart` -- `payPeriodEnd` range, both formatted `MM/dd/yyyy`.
- **Monetary values:** `currency` pipe.
- **Source:** chip. `Accounting` = info ("Synced"), `Manual` = muted ("Manual").
- **Actions:** download icon button (visible only when `fileAttachmentId` is not null). Opens the pay stub PDF in a new browser tab.

**Empty state:** `payments` icon with "No pay stubs" message.

**Data loading:** `PayrollService.loadMyPayStubs()` called on component init. Fetches `GET /api/v1/payroll/pay-stubs/me`.

### Pay Stub Entity

**PayStub** (`forge.core/Entities/PayStub.cs`): extends `BaseAuditableEntity`.

| Property | Type | Notes |
|----------|------|-------|
| UserId | int | FK to ApplicationUser |
| PayPeriodStart | DateTimeOffset | Start of pay period |
| PayPeriodEnd | DateTimeOffset | End of pay period |
| PayDate | DateTimeOffset | Date the payment was issued |
| GrossPay | decimal | Total before deductions |
| NetPay | decimal | Take-home pay |
| TotalDeductions | decimal | Sum of all deductions |
| TotalTaxes | decimal | Sum of tax deductions |
| FileAttachmentId | int? | FK to FileAttachment (PDF) |
| Source | PayrollDocumentSource | Manual or Accounting |
| ExternalId | string? | ID in the external payroll system |

### Deductions

Each pay stub can have multiple deductions:

**PayStubDeduction** (`forge.core/Entities/PayStubDeduction.cs`): extends `BaseEntity`.

| Property | Type | Notes |
|----------|------|-------|
| PayStubId | int | FK to PayStub |
| Category | PayStubDeductionCategory | Enum (see below) |
| Description | string | Human-readable label |
| Amount | decimal | Deduction amount |

### Deduction Categories

The `PayStubDeductionCategory` enum defines:

| Value | Description |
|-------|-------------|
| FederalTax | Federal income tax |
| StateTax | State income tax |
| SocialSecurity | Social Security (FICA) |
| Medicare | Medicare (FICA) |
| HealthInsurance | Health insurance premium |
| Retirement401k | 401(k) retirement contribution |
| Dental | Dental insurance |
| Vision | Vision insurance |
| Hsa | Health Savings Account |
| Fsa | Flexible Spending Account |
| LifeInsurance | Life insurance |
| DisabilityInsurance | Disability insurance |
| UnionDues | Union dues |
| GarnishmentChildSupport | Court-ordered garnishment/child support |
| Other | Miscellaneous deduction |

## Tax Documents

### Employee View (`/account/tax-documents`)

Displays the authenticated user's tax documents (W-2, 1099, etc.) in a DataTable.

**Page layout:**
1. **Title** -- "Tax Documents" heading with subtitle.
2. **Data table** -- sortable tax document list.

**Table ID:** `account-tax-documents`

| Column | Field | Sortable | Type | Width | Align |
|--------|-------|----------|------|-------|-------|
| Tax Year | `taxYear` | Yes | number | 100px | left |
| Document Type | `documentType` | Yes | text | 160px | left |
| Employer | `employerName` | Yes | text | auto | left |
| Source | `source` | Yes | text | 100px | left |
| Actions | -- | No | -- | 60px | left |

**Custom cell rendering:**
- **Document Type:** resolved to human-readable label (W-2, W-2c, 1099-MISC, 1099-NEC, Other).
- **Employer:** shows em-dash when null.
- **Source:** chip. `Accounting` = info ("Synced"), `Manual` = muted ("Manual").
- **Actions:** download icon button (visible only when `fileAttachmentId` is not null). Opens the document PDF in a new browser tab.

**Empty state:** `receipt_long` icon with "No tax documents" message.

**Data loading:** `PayrollService.loadMyTaxDocuments()` called on component init. Fetches `GET /api/v1/payroll/tax-documents/me`.

### Tax Document Entity

**TaxDocument** (`forge.core/Entities/TaxDocument.cs`): extends `BaseAuditableEntity`.

| Property | Type | Notes |
|----------|------|-------|
| UserId | int | FK to ApplicationUser |
| DocumentType | TaxDocumentType | Enum |
| TaxYear | int | Tax year (e.g., 2025) |
| EmployerName | string? | Name of the employer |
| FileAttachmentId | int? | FK to FileAttachment (PDF) |
| Source | PayrollDocumentSource | Manual or Accounting |
| ExternalId | string? | ID in the external payroll system |

### Document Types

The `TaxDocumentType` enum defines:

| Value | Display Label | Description |
|-------|---------------|-------------|
| W2 | W-2 | Wage and Tax Statement |
| W2c | W-2c | Corrected Wage and Tax Statement |
| Misc1099 | 1099-MISC | Miscellaneous Income |
| Nec1099 | 1099-NEC | Nonemployee Compensation |
| Other | Other | Other tax documents |

## Admin Operations

Admins, Managers, and Office Managers have elevated endpoints for managing payroll records across all employees.

### View User Records

- `GET /api/v1/payroll/pay-stubs/users/{userId}` -- list pay stubs for a specific user.
- `GET /api/v1/payroll/tax-documents/users/{userId}` -- list tax documents for a specific user.

### Upload Pay Stub

`POST /api/v1/payroll/pay-stubs/users/{userId}`

Creates a new pay stub record for the specified user with source = `Manual`.

**Request body (UploadPayStubRequestModel):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| payPeriodStart | DateTimeOffset | Yes | Start of pay period |
| payPeriodEnd | DateTimeOffset | Yes | End of pay period |
| payDate | DateTimeOffset | Yes | Payment date |
| grossPay | decimal | Yes | Gross pay amount |
| netPay | decimal | Yes | Net pay amount |
| fileAttachmentId | int | Yes | FK to uploaded PDF |

`TotalDeductions` is computed as `grossPay - netPay`. `TotalTaxes` defaults to 0 for manual uploads. The PDF must be uploaded first via the Files API.

### Upload Tax Document

`POST /api/v1/payroll/tax-documents/users/{userId}`

Creates a new tax document record for the specified user with source = `Manual`.

**Request body (UploadTaxDocumentRequestModel):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| documentType | TaxDocumentType | Yes | W2, W2c, Misc1099, Nec1099, Other |
| taxYear | int | Yes | Tax year |
| fileAttachmentId | int | Yes | FK to uploaded PDF |

### Delete Records

- `DELETE /api/v1/payroll/pay-stubs/{id}` -- Admin/Manager/OfficeManager only.
- `DELETE /api/v1/payroll/tax-documents/{id}` -- Admin/Manager/OfficeManager only.

Both are soft deletes.

### Payroll Sync

`POST /api/v1/payroll/sync` triggers a sync of payroll data from the connected accounting provider. Returns the count of records synced. Admin/Manager/OfficeManager only.

## PDF Access

Pay stub and tax document PDFs are accessed via redirect endpoints:

- `GET /api/v1/payroll/pay-stubs/{id}/pdf` -- returns a redirect to `/api/v1/files/{fileAttachmentId}`. Returns 404 if no PDF is attached.
- `GET /api/v1/payroll/tax-documents/{id}/pdf` -- same pattern.

Both endpoints verify the requesting user either owns the record or has admin/manager/office-manager role. This ensures employees can only access their own documents.

The frontend opens PDFs in a new browser tab via `window.open()`.

## Document Sources

The `PayrollDocumentSource` enum defines:

| Value | Description |
|-------|-------------|
| Accounting | Synced from an external payroll/accounting system |
| Manual | Uploaded directly by an admin/manager |

Both sources are displayed identically in the employee view. The source badge helps employees understand whether a document was system-generated or manually provided.

## PayrollService (Frontend)

`PayrollService` (`account/services/payroll.service.ts`) is a singleton service managing payroll state.

**Signals:**
- `payStubs: Signal<PayStub[]>` -- read-only signal of current user's pay stubs.
- `taxDocuments: Signal<TaxDocument[]>` -- read-only signal of current user's tax documents.

**Employee methods:**
- `loadMyPayStubs()` -- fetches and caches pay stubs.
- `loadMyTaxDocuments()` -- fetches and caches tax documents.
- `downloadPayStubPdf(id)` -- opens PDF in new tab.
- `downloadTaxDocumentPdf(id)` -- opens PDF in new tab.

**Admin methods:**
- `getUserPayStubs(userId)` -- returns Observable.
- `getUserTaxDocuments(userId)` -- returns Observable.
- `uploadPayStub(userId, request)` -- creates a manual pay stub.
- `uploadTaxDocument(userId, request)` -- creates a manual tax document.
- `deletePayStub(id)` -- soft-deletes a pay stub.
- `deleteTaxDocument(id)` -- soft-deletes a tax document.
- `syncPayroll()` -- triggers accounting sync.

## API Endpoints

### Employee Self-Service

| Method | Path | Auth | Response | Description |
|--------|------|------|----------|-------------|
| GET | `/api/v1/payroll/pay-stubs/me` | Any authenticated | `PayStubResponseModel[]` | Get own pay stubs |
| GET | `/api/v1/payroll/pay-stubs/{id}/pdf` | Any authenticated | Redirect to file | Download own pay stub PDF |
| GET | `/api/v1/payroll/tax-documents/me` | Any authenticated | `TaxDocumentResponseModel[]` | Get own tax documents |
| GET | `/api/v1/payroll/tax-documents/{id}/pdf` | Any authenticated | Redirect to file | Download own tax document PDF |

### Admin / Manager / Office Manager

| Method | Path | Auth Roles | Request Body | Response | Description |
|--------|------|------------|--------------|----------|-------------|
| GET | `/api/v1/payroll/pay-stubs/users/{userId}` | Admin, Manager, OM | -- | `PayStubResponseModel[]` | List user's pay stubs |
| POST | `/api/v1/payroll/pay-stubs/users/{userId}` | Admin, Manager, OM | `UploadPayStubRequestModel` | `PayStubResponseModel` (201) | Upload pay stub |
| DELETE | `/api/v1/payroll/pay-stubs/{id}` | Admin, Manager, OM | -- | 204 | Delete pay stub |
| GET | `/api/v1/payroll/tax-documents/users/{userId}` | Admin, Manager, OM | -- | `TaxDocumentResponseModel[]` | List user's tax documents |
| POST | `/api/v1/payroll/tax-documents/users/{userId}` | Admin, Manager, OM | `UploadTaxDocumentRequestModel` | `TaxDocumentResponseModel` (201) | Upload tax document |
| DELETE | `/api/v1/payroll/tax-documents/{id}` | Admin, Manager, OM | -- | 204 | Delete tax document |
| POST | `/api/v1/payroll/sync` | Admin, Manager, OM | -- | `int` | Trigger payroll sync |

### Response Models

**PayStubResponseModel:**
```
{
  id: int,
  userId: int,
  payPeriodStart: DateTimeOffset,
  payPeriodEnd: DateTimeOffset,
  payDate: DateTimeOffset,
  grossPay: decimal,
  netPay: decimal,
  totalDeductions: decimal,
  totalTaxes: decimal,
  fileAttachmentId: int?,
  source: PayrollDocumentSource,
  externalId: string?,
  deductions: PayStubDeductionResponseModel[]
}
```

**TaxDocumentResponseModel:**
```
{
  id: int,
  userId: int,
  documentType: TaxDocumentType,
  taxYear: int,
  employerName: string?,
  fileAttachmentId: int?,
  source: PayrollDocumentSource,
  externalId: string?
}
```

## Known Limitations

1. **No payroll processing.** Forge does not calculate wages, taxes, or deductions. It is a document portal only.
2. **No deduction detail in UI.** The employee pay stubs view shows `totalDeductions` as a single sum. Individual deduction line items exist in the data model but are not displayed in the current UI.
3. **No admin upload UI.** While admin upload endpoints exist, there is no dedicated admin UI for uploading pay stubs or tax documents. Admin operations are performed via direct API calls or integrated into the employee detail section of the admin module.
4. **No payroll sync implementation.** The `POST /api/v1/payroll/sync` endpoint exists but the QB Payroll sync integration returns stub data. Real QB Payroll API integration is not yet implemented.
5. **No pay stub editing.** Pay stubs cannot be modified after creation. To correct data, delete and re-upload.
6. **No year/period filtering.** The employee views do not offer filters for tax year or pay period. All records are shown in a single list.
7. **Manual deductions always zero.** When uploading a pay stub manually, `TotalTaxes` defaults to 0 and individual deduction records are not created. Only synced stubs have detailed deduction breakdowns.
8. **PDF required for download.** The download button only appears when `fileAttachmentId` is set. Records without an attached PDF show no download action.
