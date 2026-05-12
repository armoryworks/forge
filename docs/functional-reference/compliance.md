# Compliance Forms

## Overview

The Compliance Forms feature manages employee tax withholding forms, employment eligibility verification, direct deposit enrollment, and policy acknowledgments. It spans two user contexts: employees fill out and sign their forms via the Account area (`/account/tax-forms/*`) or the onboarding wizard (`/onboarding`), while administrators manage form templates, monitor completion status, review identity documents, and complete employer-side processes (I-9 Section 2) via the Admin area (`/admin/compliance`).

The system supports six compliance form types:

| Form Type | Enum Value | Description |
|-----------|------------|-------------|
| W-4 | `W4` | Federal income tax withholding elections |
| I-9 | `I9` | Employment eligibility verification (requires identity documents) |
| State Withholding | `StateWithholding` | State-specific tax withholding (resolved by employee work location) |
| Direct Deposit | `DirectDeposit` | Bank account information for payroll deposits |
| Workers' Comp | `WorkersComp` | Workers' compensation policy acknowledgment |
| Handbook | `Handbook` | Employee handbook acknowledgment |

All six form types are handled by the onboarding wizard for new employees. After onboarding completion, employees can review their submitted forms at `/account/tax-forms/{profileCompletionKey}`. W-4 and State Withholding can be resubmitted; I-9 cannot be changed after completion per legal requirements.

### Profile Completeness & Job Assignment Blocking

Each compliance form is tied to a `profileCompletionKey` on the `ComplianceFormTemplate` entity. The `EmployeeProfileService` tracks completion via `ProfileCompleteness`, which aggregates all required items. Templates with `blocksJobAssignment = true` prevent the employee from being assigned jobs until completed. The `canBeAssignedJobs` flag on `ProfileCompleteness` reflects this gate.

### Sensitive Form Handling

Forms containing PII (W-4, I-9, State Withholding) are marked as sensitive. After submission, saved form data is not displayed back to the employee. If the employee chooses to resubmit (where allowed), they start with a blank form rather than pre-populated data.

---

## Routes & Navigation

| Route | Component | Description |
|-------|-----------|-------------|
| `/account/tax-forms` | `AccountTaxFormsComponent` | Lists all compliance form templates with completion status |
| `/account/tax-forms/:formType` | `AccountTaxFormDetailComponent` | Detail view for a specific compliance form |
| `/onboarding` | `OnboardingWizardComponent` | Multi-step guided wizard for all six form types |
| `/admin/compliance` | Admin tab in `AdminComponent` | Compliance templates panel + per-user compliance detail panel |

Sidebar navigation: Account section, under "Tax & Compliance Forms".

Wizard-managed forms (all six types) redirect incomplete forms from `/account/tax-forms/:formType` to `/onboarding`. Completed wizard forms show a read-only summary at their detail route.

---

## Access & Permissions

### Employee Self-Service

All authenticated users can access their own compliance forms:

- `GET /api/v1/compliance-forms` -- list all active templates
- `GET /api/v1/compliance-forms/submissions/me` -- list own submissions
- `GET /api/v1/compliance-forms/submissions/me/{formType}` -- get specific submission
- `PUT /api/v1/compliance-forms/{id}/form-data` -- save draft form data
- `POST /api/v1/compliance-forms/{id}/submit-form` -- submit form data
- `POST /api/v1/compliance-forms/{id}/submit` -- create initial submission
- `GET /api/v1/compliance-forms/my-state-definition` -- get state-specific form definition
- `GET /api/v1/compliance-forms/submissions/{id}/pdf` -- download own submission PDF

### Admin/Manager/Office Manager

| Endpoint | Roles | Description |
|----------|-------|-------------|
| `GET /api/v1/compliance-forms/{id}` | Admin | Get template details |
| `POST /api/v1/compliance-forms` | Admin | Create template |
| `PUT /api/v1/compliance-forms/{id}` | Admin | Update template |
| `DELETE /api/v1/compliance-forms/{id}` | Admin | Soft-delete template |
| `PUT /api/v1/compliance-forms/{id}/form-definition` | Admin | Update form definition JSON |
| `POST /api/v1/compliance-forms/{id}/extract-definition` | Admin | Extract form definition from PDF |
| `POST /api/v1/compliance-forms/{id}/extract-raw` | Admin | Diagnostic raw PDF extraction |
| `POST /api/v1/compliance-forms/{id}/compare-visual` | Admin | Visual comparison of rendered form vs. PDF |
| `POST /api/v1/compliance-forms/{id}/upload` | Admin | Upload manual override document |
| `POST /api/v1/compliance-forms/{id}/blank-pdf-template` | Admin | Set blank PDF for fill-and-sign flow |
| `POST /api/v1/compliance-forms/{id}/sync` | Admin | Sync single template from source URL |
| `POST /api/v1/compliance-forms/sync-all` | Admin | Sync all auto-sync templates |
| `GET /api/v1/compliance-forms/admin/users/{userId}` | Admin, Manager, OfficeManager | Per-user compliance detail |
| `POST /api/v1/compliance-forms/admin/users/{userId}/remind` | Admin, Manager, OfficeManager | Send compliance reminder notification |
| `GET /api/v1/compliance-forms/admin/i9-pending` | Admin, Manager, OfficeManager | List I-9s pending Section 2 |
| `POST /api/v1/compliance-forms/submissions/{id}/complete-i9-section2` | Admin, Manager, OfficeManager | Complete I-9 employer section |
| `GET /api/v1/compliance-forms/versions/{versionId}/comparison` | Admin | Get visual comparison results |

---

## Entities

### ComplianceFormTemplate

Defines a compliance form type and its configuration. Located in `forge.core/Entities/ComplianceFormTemplate.cs`.

| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary key (auto-increment) |
| Name | string | Display name (e.g., "W-4 Federal Withholding") |
| FormType | ComplianceFormType | Enum: W4, I9, StateWithholding, DirectDeposit, WorkersComp, Handbook |
| Description | string | User-facing description |
| Icon | string | Material icon name |
| SourceUrl | string? | URL to official government PDF (e.g., IRS W-4 PDF) |
| Sha256Hash | string? | SHA-256 hash of source PDF for change detection |
| IsAutoSync | bool | Whether to automatically re-download and re-extract from source URL |
| IsActive | bool | Whether the template is available to employees |
| SortOrder | int | Display ordering |
| RequiresIdentityDocs | bool | Whether the form requires identity document uploads (true for I-9) |
| DocuSealTemplateId | int? | DocuSeal template ID for e-signing |
| LastSyncedAt | DateTimeOffset? | When the template was last synced from source |
| ManualOverrideFileId | int? | FK to FileAttachment for admin-uploaded PDF |
| BlocksJobAssignment | bool | Whether incomplete form prevents job assignment |
| ProfileCompletionKey | string | Key used for profile completeness tracking (e.g., "w4", "i9") |
| AcroFieldMapJson | string? | JSON mapping from dynamic form field IDs to AcroForm field names in the government PDF |
| FilledPdfTemplateId | int? | FK to FileAttachment for the blank PDF template used in fill-and-sign flow |
| CurrentFormDefinitionVersionId | int? | FK to the active FormDefinitionVersion |
| FormDefinitionJson | string? | Denormalized copy of the active form definition JSON |
| FormDefinitionRevision | string? | Denormalized revision label |
| CreatedAt | DateTimeOffset | Audit timestamp |
| UpdatedAt | DateTimeOffset | Audit timestamp |

### ComplianceFormSubmission

Tracks an employee's interaction with a compliance form. Located in `forge.core/Entities/ComplianceFormSubmission.cs`.

| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary key |
| TemplateId | int | FK to ComplianceFormTemplate |
| UserId | int | FK to ApplicationUser (the employee) |
| DocuSealSubmissionId | int? | DocuSeal submission identifier (for webhook correlation) |
| Status | ComplianceSubmissionStatus | Pending, Opened, Completed, Expired, Declined |
| SignedAt | DateTimeOffset? | When the form was signed |
| SignedPdfFileId | int? | FK to FileAttachment for the final signed PDF |
| DocuSealSubmitUrl | string? | URL for the DocuSeal signing iframe |
| FormDataJson | string? | JSON of the employee's form field values |
| FormDefinitionVersionId | int? | FK to FormDefinitionVersion (pins to exact version) |
| FilledPdfFileId | int? | FK to FileAttachment for the AcroForm-filled PDF (before signing) |
| I9Section1SignedAt | DateTimeOffset? | When employee signed I-9 Section 1 |
| I9Section2SignedAt | DateTimeOffset? | When employer signed I-9 Section 2 |
| I9EmployerUserId | int? | FK to the admin/manager who completed Section 2 |
| I9DocumentListType | string? | "A" or "B+C" -- document list chosen for Section 2 |
| I9DocumentDataJson | string? | JSON with document types, numbers, issuing authority, expiration |
| I9Section2OverdueAt | DateTimeOffset? | Deadline for Section 2 (first day of work + 3 business days) |
| I9ReverificationDueAt | DateTimeOffset? | When work authorization documents expire |

### FormDefinitionVersion

Versioned, effective-dated form definitions. Located in `forge.core/Entities/FormDefinitionVersion.cs`.

| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary key |
| TemplateId | int? | FK to ComplianceFormTemplate (null for state-specific forms) |
| StateCode | string? | State code for state withholding forms (e.g., "CA", "ID") |
| FormDefinitionJson | string | The extracted form definition JSON |
| SourceUrl | string? | URL the source PDF was downloaded from |
| Sha256Hash | string? | SHA-256 hash for change detection |
| EffectiveDate | DateTimeOffset | When this version becomes active |
| ExpirationDate | DateTimeOffset? | When this version expires (null = currently active) |
| Revision | string | Human-readable version label |
| ExtractedAt | DateTimeOffset | When the PDF was extracted |
| FieldCount | int | Number of form fields |
| IsActive | bool | Admin can deactivate without deleting |
| VisualComparisonJson | string? | Serialized visual comparison results |
| VisualSimilarityScore | double? | Average structural similarity score (0.0-1.0) |
| VisualComparisonPassed | bool? | Pass/fail from last comparison |

### IdentityDocument

Identity documents uploaded by employees for I-9 verification. Located in `forge.core/Entities/IdentityDocument.cs`.

| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary key |
| UserId | int | FK to ApplicationUser |
| DocumentType | IdentityDocumentType | See identity document types below |
| FileAttachmentId | int | FK to FileAttachment |
| VerifiedAt | DateTimeOffset? | When an admin verified the document |
| VerifiedById | int? | FK to the admin who verified |
| ExpiresAt | DateTimeOffset? | Document expiration date |
| Notes | string? | Admin notes |

#### Identity Document Types

Following the I-9 List A / List B / List C classification:

**List A** (identity + employment authorization -- one document suffices):
- `Passport` -- U.S. passport
- `PermanentResidentCard` -- Permanent Resident Card
- `EmploymentAuthorizationDoc` -- Employment Authorization Document
- `ForeignPassportI551` -- Foreign passport with I-551 stamp

**List B** (identity only -- must be paired with a List C document):
- `DriversLicense`
- `StateIdCard`
- `SchoolId`
- `VoterRegistrationCard`
- `MilitaryId`

**List C** (employment authorization only -- must be paired with a List B document):
- `SsnCard` -- Social Security card
- `BirthCertificate` -- U.S. birth certificate
- `CitizenshipCertificate`

**Generic identifiers** (used when uploading without specifying exact type):
- `ListA`, `ListB`, `ListC`, `Other`

The system validates that employees provide either one List A document OR one List B + one List C document before I-9 submission.

---

## Template System

### Admin Compliance Templates Panel

The compliance templates panel at `/admin/compliance` provides a DataTable listing all templates with columns for icon, name, form type, auto-sync status, last synced date, active status, and actions.

Admin actions per template:
- **Edit** -- opens `ComplianceTemplateDialogComponent` to modify template properties
- **Sync** -- re-downloads the source PDF and re-extracts the form definition
- **Extract** -- triggers the PDF extraction pipeline to generate a form definition
- **Delete** -- soft-deletes the template (ConfirmDialog)

Global actions:
- **Sync All** -- syncs all auto-sync enabled templates
- **New Template** -- opens create dialog
- **State Withholding** -- opens `StateWithholdingDialogComponent` for per-state configuration

### Template Properties (Create/Edit Dialog)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | text | Yes | Template display name |
| Form Type | select | Yes | One of the six ComplianceFormType values |
| Description | textarea | No | User-facing description |
| Icon | text | No | Material icon name |
| Source URL | text | No | URL to official government PDF |
| Profile Completion Key | text | Yes | Key for completeness tracking |
| Auto Sync | toggle | No | Enable automatic re-download from source URL |
| Blocks Job Assignment | toggle | No | Whether incomplete form blocks job assignment |
| Requires Identity Docs | toggle | No | Whether the form requires identity document uploads |
| Is Active | toggle | No | Whether the template is available to employees |
| Sort Order | number | No | Display ordering |

---

## Dynamic Form Rendering

### ComplianceFormDefinition Model

The form definition is a JSON structure that describes the form layout. Located in `shared/models/compliance-form-definition.model.ts`.

```typescript
interface ComplianceFormDefinition {
  formType: string;
  title: string;
  formNumber: string;
  revision: string;
  agency: string;
  sections?: FormSection[];      // Flat sections (legacy/simple forms)
  pages?: FormPage[];            // Multi-page forms rendered as tabs
  formLayout?: 'default' | 'government';  // Layout mode
  maxWidth?: string;             // e.g., "850px"
  formStyles?: Record<string, string>;    // CSS custom property overrides
}
```

### Pages and Sections

Multi-page forms use `pages` arrays; each page contains one or more sections. Simple forms use flat `sections` arrays. The `normalizeFormPages()` utility always returns `FormPage[]`, wrapping flat sections in a single page if needed.

```typescript
interface FormPage {
  id: string;
  title: string;
  readonly?: boolean;   // Read-only pages (e.g., instructions)
  sections: FormSection[];
}

interface FormSection {
  id: string;
  title: string;
  subtitle?: string;
  instructions?: string;
  optional?: boolean;
  fields: FormFieldDefinition[];
  // Government layout metadata:
  layout?: 'default' | 'section' | 'form-header' | 'step' | 'step-amounts'
           | 'tip' | 'exempt' | 'sign' | 'employers-only' | 'form-footer'
           | 'worksheet' | 'instructions';
  shaded?: boolean;
  stepNumber?: string;
  stepName?: string;
  amountColumnWidth?: string;
  innerColumnWidth?: string;
  heavyBorder?: boolean;
  gridColumns?: string;
  style?: Record<string, string>;
  html?: string;
}
```

### Form Field Types

```typescript
interface FormFieldDefinition {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'currency' | 'ssn' | 'date'
       | 'select' | 'radio' | 'checkbox' | 'signature' | 'heading'
       | 'paragraph' | 'html';
  label: string;
  hint?: string;
  required?: boolean;
  options?: FormFieldOption[];
  maxlength?: number;
  mask?: string;
  width?: 'full' | 'half' | 'third' | 'quarter';
  dependsOn?: FormFieldDependency;
  defaultValue?: string | number | boolean;
  // Government layout metadata:
  fieldLayout?: 'amount-line' | 'amount-line-inner' | 'amount-line-total'
               | 'grid-cell' | 'checkbox-dots' | 'signature-field'
               | 'signature-date' | 'filing-status' | 'worksheet-line';
  amountLabel?: string;
  gridColumn?: string;
  gridRow?: string;
  style?: Record<string, string>;
  displayText?: string;
  worksheetLineNumber?: string;
  html?: string;
}
```

### Conditional Field Visibility

Fields can declare a `dependsOn` dependency:

```typescript
interface FormFieldDependency {
  field: string;      // ID of the controlling field
  value: string | boolean;  // Value that triggers visibility
  operator?: 'eq' | 'neq' | 'truthy';
}
```

The `ComplianceFormRendererComponent.shouldShowField()` method evaluates these dependencies at render time.

### ComplianceFormRendererComponent

Located at `features/account/components/compliance-form-renderer/`. This component:

1. Accepts a `ComplianceFormDefinition` input and optional `initialData` for pre-population
2. Uses `sectionsToModels()` from `compliance-form-adapter.ts` to convert the definition into ng-dynamic-forms `DynamicFormControlModel[]`
3. Builds a single `FormGroup` spanning all pages (tabs)
4. Renders pages as tabs with Previous/Next navigation
5. Auto-sets today's date on signature-date fields
6. Provides Save Draft and Submit buttons
7. Supports `readonly` mode and `extraValidation` callback for additional checks (e.g., identity document validation)

**Inputs:**

| Input | Type | Description |
|-------|------|-------------|
| definition | ComplianceFormDefinition | Required. The form definition JSON |
| initialData | Record<string, unknown> | Pre-populated form values |
| readonly | boolean | Disables all form controls |
| saving | boolean | Shows save-in-progress state |
| submitting | boolean | Shows submit-in-progress state |
| extraValidation | () => string[] | Additional validation messages (e.g., identity doc requirements) |

**Outputs:**

| Output | Type | Description |
|--------|------|-------------|
| save | Record<string, unknown> | Emitted when user saves draft |
| submitForm | Record<string, unknown> | Emitted when user submits |
| back | void | Emitted when user navigates back |

### Government Form Layout

When `formLayout` is `'government'`, the renderer applies IRS-style native rendering instead of Material form field wrappers. This preserves the visual fidelity of government forms with step-based sections, amount lines, shaded areas, and signature blocks. Section `layout` values control the rendering strategy:

- `form-header` -- Title banner at form top
- `step` -- Numbered step section with step label
- `step-amounts` -- Step section with amount column at right edge
- `sign` -- Signature block with signature field + date
- `exempt` -- Exemption checkbox area
- `tip` -- Informational callout
- `employers-only` -- Employer-only section (read-only for employees)
- `worksheet` -- Worksheet with numbered lines
- `instructions` -- Read-only instructional content (rendered as HTML)
- `form-footer` -- Footer section

---

## PDF Extraction Pipeline

The PDF extraction pipeline converts government fillable PDFs into `ComplianceFormDefinition` JSON. This is an admin-triggered process used when creating or updating compliance form templates.

### Architecture

1. **Admin triggers extraction** via `POST /api/v1/compliance-forms/{id}/extract-definition`
2. **PDF acquisition** -- downloads from `SourceUrl` or retrieves from MinIO (`ManualOverrideFileId`)
3. **Raw extraction** (`IPdfJsExtractorService`) -- PuppeteerSharp launches headless Chromium, loads a bundled `pdf-extract.html` page, passes PDF bytes to pdf.js which extracts text content (with fonts, positions) and form field annotations (types, positions, options)
4. **Pattern-based parsing** (`IFormDefinitionParser`) -- groups text items into sections by font size/weight, assigns fields to sections by position, detects government form patterns (step sections, amount lines, filing status, signature blocks, form headers, shaded sections)
5. **AI-assisted verification** (`IFormDefinitionVerifier`) -- structural checks validate the result (field count matches, all annotations mapped, no orphaned fields). If checks fail, the Ollama AI service corrects the JSON. Maximum 3 refinement iterations before flagging for human review.
6. **Version creation** -- a new `FormDefinitionVersion` is created with the extracted JSON, SHA-256 hash, field count, and effective date. The previous active version's `ExpirationDate` is set.

### Visual Comparison

After extraction, admins can run `POST /api/v1/compliance-forms/{id}/compare-visual` to compare the rendered form against the original PDF. This produces a `VisualComparisonResult` with structural similarity scores per page, stored on the `FormDefinitionVersion`.

### State Withholding Forms

State withholding forms are resolved per-employee based on their `WorkLocationId`, which determines the state. The `GetMyStateFormDefinitionQuery` handler:

1. Looks up the employee's work location state
2. Categorizes the state: `no_tax` (no income tax), `federal` (uses federal W-4), or `state_form` (has its own form)
3. For `state_form` states, retrieves the active `FormDefinitionVersion` for that state code
4. Returns the form definition JSON and state metadata

---

## Submission Workflow

### Employee Flow

1. **Template listing** -- Employee visits `/account/tax-forms` to see all compliance form templates with completion status. Incomplete wizard-managed forms link to `/onboarding`.

2. **Onboarding wizard** -- New employees complete all six forms in a guided multi-step wizard at `/onboarding`. The wizard collects:
   - Personal information (name, DOB, SSN, email, phone)
   - Address
   - W-4 tax withholding elections
   - State withholding (if applicable)
   - I-9 citizenship status and authorization details
   - Direct deposit bank account information
   - Workers' comp and handbook acknowledgments

3. **Form data submission** -- On wizard completion, data is saved and forms requiring government PDFs enter the fill-and-sign flow.

4. **Fill-and-sign flow** (for templates with `AcroFieldMapJson` + `FilledPdfTemplateId`):
   a. Backend fills the blank government PDF with the employee's data using AcroForm field mapping
   b. Filled PDF is uploaded to MinIO and stored as `FilledPdfFileId`
   c. DocuSeal submission is created with the filled PDF
   d. Employee receives a `DocuSealSubmitUrl` for the signing iframe
   e. Employee signs in the embedded DocuSeal iframe
   f. DocuSeal webhook confirms completion, signed PDF stored as `SignedPdfFileId`

5. **Simple acknowledgment flow** (for WorkersComp, Handbook):
   - Employee clicks acknowledge button
   - `EmployeeProfileService.acknowledgeForm()` records the completion timestamp

6. **Re-submission** -- After completion, employees can resubmit W-4 and State Withholding forms. I-9 cannot be changed after completion. Sensitive forms (W-4, I-9, State Withholding) don't pre-fill data on resubmission.

### Admin Flow

1. **User compliance detail** -- Admin selects a user in the compliance panel to view their submission status, identity documents, and payroll records.

2. **I-9 Section 2 completion** -- For I-9 forms where Section 1 is complete, admin/manager:
   a. Opens the `CompleteI9DialogComponent`
   b. Selects document list type (List A or List B + C)
   c. Enters document details (type, number, issuing authority, expiration)
   d. Sets employee start date and reverification due date
   e. Submits via `POST /compliance-forms/submissions/{id}/complete-i9-section2`

3. **Identity document verification** -- Admin can verify uploaded identity documents, which stamps `VerifiedAt` and `VerifiedById`.

4. **Compliance reminders** -- Admin can send reminder notifications to employees with incomplete forms via `POST /compliance-forms/admin/users/{userId}/remind`.

5. **I-9 pending queue** -- `GET /compliance-forms/admin/i9-pending` returns all I-9 submissions awaiting Section 2 completion, with overdue status tracking.

### I-9 Compliance Status

The admin user list shows I-9 compliance status as a computed field:

| Status | Description |
|--------|-------------|
| NotStarted | No I-9 submission exists |
| Section1InProgress | Submission created but Section 1 not signed |
| Section1Complete | Employee signed Section 1, awaiting employer Section 2 |
| Section2InProgress | Employer started Section 2 |
| Complete | Both sections complete |
| Section2Overdue | Section 2 deadline passed (first day of work + 3 business days) |
| ReverificationDue | Work authorization documents expiring soon |
| ReverificationOverdue | Work authorization documents expired |

---

## DocuSeal Integration

DocuSeal provides the electronic signature ceremony for government forms (W-4, I-9).

### Webhook

The `POST /api/v1/compliance-forms/webhook` endpoint (unauthenticated) receives DocuSeal callbacks:

- **Event types handled**: `form.completed`, `submitter.completed`
- **Processing**: Extracts submission ID and completion timestamp, marks the submission as Completed, updates the employee profile completion timestamps
- **Signed PDF**: DocuSeal hosts the signed PDF; the webhook handler can retrieve and store it

### Signing Flow

1. Backend creates a DocuSeal submission with the pre-filled PDF
2. Frontend embeds the DocuSeal signing URL in an iframe via `DomSanitizer.bypassSecurityTrustResourceUrl()`
3. Employee signs within the iframe
4. DocuSeal fires a webhook on completion
5. Backend processes the webhook and marks the form complete

---

## Onboarding Wizard Form Fields

### Step 1: Personal Information

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| firstName | text | Yes | |
| middleName | text | No | |
| lastName | text | Yes | |
| otherLastNames | text | No | Other surnames used |
| dateOfBirth | date | Yes | |
| ssn | text (masked) | Yes | SSN format XXX-XX-XXXX |
| email | email | Yes | |
| phone | text (masked) | Yes | Phone format (XXX) XXX-XXXX |

### Step 2: Address

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| street1 | text | Yes | |
| street2 | text | No | |
| city | text | Yes | |
| addressState | select | Yes | US state dropdown |
| zipCode | text (masked) | Yes | ZIP format XXXXX or XXXXX-XXXX |

### Step 3: W-4 Federal Withholding

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| w4FilingStatus | radio | Yes | Single, Married Filing Jointly, Head of Household |
| w4MultipleJobs | checkbox | No | Multiple jobs or spouse works |
| w4ClaimDependentsAmount | currency | No | Dependents credit amount |
| w4OtherIncome | currency | No | Other income (Step 4a) |
| w4Deductions | currency | No | Deductions (Step 4b) |
| w4ExtraWithholding | currency | No | Extra withholding per pay period (Step 4c) |
| w4ExemptFromWithholding | checkbox | No | Exempt from withholding |

### Step 4: State Withholding

State-specific fields, loaded dynamically based on the employee's work location state. Common fields:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| stateFilingStatus | select | Varies | State-specific filing status options |
| stateAllowances | number | No | Number of allowances |
| stateAdditionalWithholding | currency | No | Additional state withholding amount |
| stateExempt | checkbox | No | Exempt from state withholding |

States fall into three categories:
- **no_tax** (e.g., TX, FL, WA) -- no state withholding form needed
- **federal** (e.g., some states use the federal W-4) -- uses W-4 data
- **state_form** -- has its own extracted form definition

### Step 5: I-9 Employment Eligibility

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| i9CitizenshipStatus | radio | Yes | 1=US Citizen, 2=Noncitizen National, 3=LPR, 4=Alien Authorized |
| i9AlienRegNumber | text | Conditional | Required for status 3 (LPR) |
| i9I94Number | text | Conditional | Required for status 4 |
| i9ForeignPassportNumber | text | Conditional | Required for status 4 |
| i9ForeignPassportCountry | text | Conditional | Required for status 4 |
| i9WorkAuthExpiry | date | Conditional | Required for status 4 |
| i9PreparedByPreparer | checkbox | No | Indicates form prepared by translator/preparer |
| i9PreparerFirstName | text | Conditional | Required if preparer used |
| i9PreparerLastName | text | Conditional | Required if preparer used |
| i9PreparerAddress | text | Conditional | |
| i9PreparerCity | text | Conditional | |
| i9PreparerState | text | Conditional | |
| i9PreparerZip | text | Conditional | |
| i9DocumentChoice | radio | No | "A" (single List A doc) or "BC" (List B + List C) |
| i9ListAType | select | Conditional | List A document type |
| i9ListADocNumber | text | Conditional | Document number |
| i9ListAAuthority | text | Conditional | Issuing authority |
| i9ListAExpiry | date | Conditional | Expiration date |
| i9ListAFileAttachmentId | file upload | Conditional | Uploaded document image |
| i9ListBType | select | Conditional | List B document type |
| i9ListBDocNumber | text | Conditional | |
| i9ListBAuthority | text | Conditional | |
| i9ListBExpiry | date | Conditional | |
| i9ListBFileAttachmentId | file upload | Conditional | |
| i9ListCType | select | Conditional | List C document type |
| i9ListCDocNumber | text | Conditional | |
| i9ListCAuthority | text | Conditional | |
| i9ListCExpiry | date | Conditional | |
| i9ListCFileAttachmentId | file upload | Conditional | |

### Step 6: Direct Deposit

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| bankName | text | Yes | |
| routingNumber | text | Yes | 9-digit routing number |
| accountNumber | text | Yes | |
| accountType | select | Yes | Checking, Savings |
| voidedCheckFileAttachmentId | file upload | No | Voided check image |

### Step 7: Acknowledgments

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| acknowledgeWorkersComp | checkbox | Yes | Workers' compensation policy |
| acknowledgeHandbook | checkbox | Yes | Employee handbook |

---

## Admin I-9 Section 2 Dialog Fields

The `CompleteI9DialogComponent` is opened from the user compliance panel for I-9 submissions where Section 1 is complete.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| documentListType | radio | Yes | "A" (one List A document) or "BC" (List B + List C) |
| startDate | date | Yes | Employee's first day of employment |
| reverificationDueAt | date | No | Work authorization expiration (null for permanent docs) |
| List A: documentType | select | Conditional | Type of List A document |
| List A: documentNumber | text | Conditional | |
| List A: issuingAuthority | text | Conditional | |
| List A: expirationDate | date | Conditional | |
| List B: documentType | select | Conditional | Type of List B document |
| List B: documentNumber | text | Conditional | |
| List B: issuingAuthority | text | Conditional | |
| List B: expirationDate | date | Conditional | |
| List C: documentType | select | Conditional | Type of List C document |
| List C: documentNumber | text | Conditional | |
| List C: issuingAuthority | text | Conditional | |
| List C: expirationDate | date | Conditional | |

---

## API Endpoints

### Templates (Admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/compliance-forms` | List all templates (query: `includeInactive`) |
| GET | `/api/v1/compliance-forms/{id}` | Get template by ID |
| POST | `/api/v1/compliance-forms` | Create template |
| PUT | `/api/v1/compliance-forms/{id}` | Update template |
| DELETE | `/api/v1/compliance-forms/{id}` | Soft-delete template |
| POST | `/api/v1/compliance-forms/{id}/upload` | Upload manual override document |
| POST | `/api/v1/compliance-forms/{id}/blank-pdf-template` | Set blank PDF for fill-and-sign |
| PUT | `/api/v1/compliance-forms/{id}/form-definition` | Update form definition JSON |
| POST | `/api/v1/compliance-forms/{id}/extract-definition` | Extract form definition from PDF |
| POST | `/api/v1/compliance-forms/{id}/extract-raw` | Diagnostic raw PDF extraction |
| POST | `/api/v1/compliance-forms/{id}/compare-visual` | Visual comparison of rendered form |
| GET | `/api/v1/compliance-forms/versions/{versionId}/comparison` | Get comparison results |
| POST | `/api/v1/compliance-forms/{id}/sync` | Sync template from source URL |
| POST | `/api/v1/compliance-forms/sync-all` | Sync all auto-sync templates |

### Submissions (Employee Self-Service)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/compliance-forms/submissions/me` | List own submissions |
| GET | `/api/v1/compliance-forms/submissions/me/{formType}` | Get submission by form type |
| POST | `/api/v1/compliance-forms/{id}/submit` | Create initial submission |
| PUT | `/api/v1/compliance-forms/{id}/form-data` | Save draft form data |
| POST | `/api/v1/compliance-forms/{id}/submit-form` | Submit completed form data |
| GET | `/api/v1/compliance-forms/submissions/{id}/pdf` | Download submission PDF |
| GET | `/api/v1/compliance-forms/my-state-definition` | Get state-specific form definition |

### Admin User Compliance

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/compliance-forms/admin/users/{userId}` | Per-user compliance detail |
| POST | `/api/v1/compliance-forms/admin/users/{userId}/remind` | Send compliance reminder |
| GET | `/api/v1/compliance-forms/admin/i9-pending` | List I-9s pending Section 2 |
| POST | `/api/v1/compliance-forms/submissions/{id}/complete-i9-section2` | Complete I-9 Section 2 |

### Identity Documents (Employee Self-Service)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/identity-documents/me` | List own identity documents |
| POST | `/api/v1/identity-documents/me` | Upload identity document (query: `fileAttachmentId`) |
| DELETE | `/api/v1/identity-documents/me/{id}` | Delete identity document |

### Onboarding Wizard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/onboarding/status` | Get onboarding completion status |
| POST | `/api/v1/onboarding/submit` | Submit all onboarding data |
| POST | `/api/v1/onboarding/save` | Save data without submitting (returns forms to sign) |
| POST | `/api/v1/onboarding/preview-pdf` | Preview filled PDF (base64) |
| POST | `/api/v1/onboarding/sign-form` | Initiate signing ceremony for a form |
| POST | `/api/v1/onboarding/bypass` | Self-certify onboarding complete |
| POST | `/api/v1/onboarding/i9-document` | Upload I-9 identity document |
| POST | `/api/v1/onboarding/voided-check` | Upload voided check image |

### DocuSeal Webhook

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/compliance-forms/webhook` | DocuSeal completion webhook (unauthenticated) |

---

## Known Limitations

1. **I-9 resubmission blocked** -- Once an I-9 is completed, the system does not allow the employee to modify it. Legal requirements mandate this, but there is no admin override for corrections.

2. **State withholding coverage** -- Not all 50 states have extracted form definitions. States are categorized into three groups (no tax, federal W-4, state form), but state-specific form extraction depends on admin uploading the source PDF and triggering extraction.

3. **DocuSeal dependency** -- The fill-and-sign flow requires a running DocuSeal instance (Docker `signing` profile). Without it, forms with `AcroFieldMapJson` cannot complete the signing ceremony. The system degrades to form data collection only.

4. **PDF extraction accuracy** -- The pdf.js + pattern parser pipeline handles most government forms well, but complex layouts may require manual JSON editing of the form definition. The AI verification loop helps but is not guaranteed to produce a perfect result.

5. **Single submission per template per user** -- Each user has one submission per template. Resubmission overwrites the previous submission rather than creating a new version.

6. **No automated I-9 Section 2 deadline enforcement** -- The system tracks `I9Section2OverdueAt` and displays overdue status, but does not automatically escalate or block operations when the deadline passes.

7. **Identity document verification is manual** -- Admins must manually verify identity documents. There is no automated document verification (OCR, facial recognition, etc.).
