# Employees

## Overview

The Employees feature provides a dedicated management interface for viewing and managing employee records, distinct from the Admin user management panel. While the Admin panel (`/admin/users`) focuses on user account administration (creating accounts, assigning roles, managing setup tokens, scan identifiers), the Employees feature (`/employees`) provides a comprehensive employee profile view with ten detail tabs spanning time tracking, pay, training, compliance, jobs, events, expenses, documents, and activity.

The feature serves Admin and Manager roles as a read-only dashboard into each employee's operational footprint across the entire system. Employee creation and account management remain in the Admin panel -- the Employees feature surfaces employee data from across all other features in a unified view.

---

## Routes & Navigation

| Route | Component | Description |
|-------|-----------|-------------|
| `/employees` | `EmployeeListComponent` | Employee list page with filters and DataTable |
| `/employees/:id` | Redirects to `/employees/:id/overview` | Default redirect to overview tab |
| `/employees/:id/:tab` | `EmployeeDetailComponent` | Employee detail page with tab navigation |

The feature is lazy-loaded via `EMPLOYEES_ROUTES` in `employees.routes.ts`. The detail page uses `:tab` route parameters with a redirect from the bare `:id` path to `:id/overview`.

Available tabs: `overview`, `time`, `pay`, `training`, `compliance`, `jobs`, `events`, `expenses`, `documents`, `activity`.

---

## Access & Permissions

The `EmployeesController` requires Admin or Manager role for all endpoints:

```
[Authorize(Roles = "Admin,Manager")]
```

| Role | Access |
|------|--------|
| Admin | Full read access to all employees and all tabs |
| Manager | Full read access to all employees and all tabs |
| Engineer | No access |
| Production Worker | No access |
| PM | No access |
| Office Manager | No access |

Managers see employees scoped by the backend -- `GetEmployeeListQuery` receives the caller's user ID and admin status, allowing the backend to apply visibility rules (e.g., managers may only see their team members, though current implementation shows all).

---

## Employee List

The `EmployeeListComponent` renders a `PageHeaderComponent` with inline filters and a DataTable.

### Page Header & Filters

| Control | Type | Behavior |
|---------|------|----------|
| Search | `<app-input>` with `FormControl` | Free-text search (sent as `?search=` to API) |
| Role | `<app-select>` with null option | Filters by role. Options loaded from `ReferenceDataService.getRolesAsOptions()` with "-- All Roles --" null option. |
| Status | `<app-select>` with null option | Filters by active status. Options: All, Active, Inactive. |

Filters are applied via `loadEmployees()`, which sends all filter values as query parameters to `GET /api/v1/employees`.

### DataTable Columns

| Column | Field | Type | Width | Sortable | Filterable |
|--------|-------|------|-------|----------|------------|
| Name | `name` | text | auto | Yes | No |
| Role | `role` | enum | 130px | Yes | Yes (options from roles API) |
| Team | `teamName` | text | 120px | Yes | No |
| Title | `jobTitle` | text | 140px | Yes | No |
| Email | `email` | text | auto | Yes | No |
| Phone | `phone` | text | 130px | Yes | No |
| Status | `isActive` | -- | 80px | Yes | No |
| Start Date | `startDate` | date | 100px | Yes | No |

The Name column renders with an `<app-avatar>` showing the employee's initials and avatar color, followed by the name in "Last, First" format.

Clicking a row navigates to `/employees/:id` (which redirects to the overview tab).

---

## Employee Detail

The `EmployeeDetailComponent` displays a header area with the employee's avatar, name, role, team, and email, followed by tab navigation and tab content.

### Header

- Avatar with initials and color
- Display name in "Last, First" format
- Role badge
- Back link to `/employees`

### Stats Bar

The `EmployeeStats` are loaded via `GET /api/v1/employees/:id/stats` and display key metrics:

| Stat | Field | Description |
|------|-------|-------------|
| Hours This Period | `hoursThisPeriod` | Total hours tracked in the current pay period |
| Compliance | `compliancePercent` | Percentage of compliance forms completed |
| Active Jobs | `activeJobCount` | Number of currently assigned jobs |
| Training Progress | `trainingProgressPercent` | Percentage of training modules completed |
| Outstanding Expenses | `outstandingExpenseCount` / `outstandingExpenseTotal` | Count and total of unprocessed expenses |

### Tab Navigation

Tabs navigate via route parameters (`/employees/:id/:tab`). The active tab is derived from the route and data loads per-tab via `effect()`.

---

## Detail Tabs

### Overview Tab

`EmployeeOverviewTabComponent` -- displays the employee's profile information in read-only format.

**Personal Information:**
- Email (work)
- Personal email
- Phone
- Start date
- Department
- Job title

**Address:**
- Street 1, Street 2
- City, State, ZIP

**Emergency Contact:**
- Name
- Phone
- Relationship

**System Information:**
- Work location name
- PIN configured (yes/no)
- RFID identifier (yes/no)
- Barcode identifier (yes/no)
- Compliance progress (X of Y items complete)

### Time Tab

`EmployeeTimeTabComponent` -- shows the employee's time entries.

Data loaded via `GET /api/v1/employees/:id/time-summary` with optional `?period=` filter.

**Fields per entry:**

| Field | Type | Description |
|-------|------|-------------|
| date | date | Entry date |
| durationMinutes | number | Duration in minutes |
| category | string | Time category |
| notes | string | Entry notes |
| jobNumber | string | Associated job number |
| jobTitle | string | Associated job title |
| isManual | boolean | Whether the entry was manually created |

### Pay Tab

`EmployeePayTabComponent` -- shows pay stubs for the employee.

Data loaded via `GET /api/v1/employees/:id/pay-summary`.

**Fields per pay stub:**

| Field | Type | Description |
|-------|------|-------------|
| payPeriodStart | date | Pay period start date |
| payPeriodEnd | date | Pay period end date |
| payDate | date | Payment date |
| grossPay | currency | Gross pay amount |
| netPay | currency | Net pay amount |
| totalDeductions | currency | Total deductions |
| totalTaxes | currency | Total taxes |

### Training Tab

`EmployeeTrainingTabComponent` -- shows training module progress.

Data loaded via `GET /api/v1/employees/:id/training`.

**Fields per training entry:**

| Field | Type | Description |
|-------|------|-------------|
| moduleName | string | Training module name |
| moduleType | string | Module type (Article/Video/Walkthrough/QuickRef/Quiz) |
| pathName | string | Training path name |
| status | string | Completion status |
| quizScore | number | Quiz score (if applicable) |
| completedAt | date | Completion date |
| startedAt | date | Start date |

### Compliance Tab

`EmployeeComplianceTabComponent` -- shows compliance form submission status.

Data loaded via `GET /api/v1/employees/:id/compliance`.

**Fields per compliance entry:**

| Field | Type | Description |
|-------|------|-------------|
| formName | string | Compliance form template name |
| formType | string | Form type (W4, I9, etc.) |
| status | string | Submission status (Pending/Opened/Completed/Expired/Declined) |
| signedAt | date | When the form was signed |
| createdAt | date | When the submission was created |

### Jobs Tab

`EmployeeJobsTabComponent` -- shows jobs assigned to the employee.

Data loaded via `GET /api/v1/employees/:id/jobs`.

**Fields per job:**

| Field | Type | Description |
|-------|------|-------------|
| jobNumber | string | Job number |
| title | string | Job title |
| stageName | string | Current kanban stage |
| stageColor | string | Stage color for chip display |
| trackTypeName | string | Track type name |
| priority | string | Job priority |
| dueDate | date | Due date |

### Events Tab

`EmployeeEventsTabComponent` -- shows upcoming events where the employee is an attendee.

Data loaded via `EventsService.getUpcomingEventsForUser(employeeId)` (`GET /api/v1/events/upcoming/:userId`).

**DataTable columns:**

| Column | Field | Width | Description |
|--------|-------|-------|-------------|
| Title | `title` | auto | Event title |
| Type | `eventType` | 120px | Event type with icon |
| Start | `startTime` | 160px | Start date/time |
| End | `endTime` | 160px | End date/time |
| Location | `location` | 140px | Event location |
| Required | `isRequired` | 90px | Whether attendance is mandatory |
| RSVP | `status` | 100px | Attendee's RSVP status |

The RSVP column value is computed by finding the attendee record matching the employee's user ID within the event's attendees array.

### Expenses Tab

`EmployeeExpensesTabComponent` -- shows the employee's expense reports.

Data loaded via `GET /api/v1/employees/:id/expenses`.

**Fields per expense:**

| Field | Type | Description |
|-------|------|-------------|
| expenseDate | date | Expense date |
| category | string | Expense category |
| description | string | Expense description |
| amount | currency | Expense amount |
| status | string | Approval status |

### Documents Tab

`EmployeeDocumentsTabComponent` -- shows uploaded documents and certifications.

Data loaded via admin service document endpoints.

### Activity Tab

`EmployeeActivityTabComponent` -- shows activity log entries.

Data loaded via `GET /api/v1/employees/:id/activity`, which queries the polymorphic `ActivityLog` table for `EntityType = "Employee"`.

---

## Admin User Management (Related)

While the Employees feature is a read-only dashboard, employee account management is handled in the Admin panel at `/admin/users`. The following documents the admin user management form fields for completeness.

### User Create Dialog

Opened via the "New User" button in the admin users tab.

| Field | Control | FormControl | Required | Validators | Notes |
|-------|---------|-------------|----------|------------|-------|
| First Name | `<app-input>` | `firstName` | Yes | `required`, `maxLength(100)` | |
| Last Name | `<app-input>` | `lastName` | Yes | `required`, `maxLength(100)` | |
| Email | `<app-input>` | `email` | Yes | `required`, `email`, `maxLength(256)` | Only shown for new users |
| Initials | `<app-input>` | `initials` | No | `maxLength(3)` | Auto-generated if not set |
| Role | `<app-select>` | `role` | Yes | `required` | Options loaded from `GET /api/v1/admin/roles` |
| Avatar Color | Color picker | `avatarColor` signal | No | -- | Grid of preset color swatches |

On creation, the admin receives a setup token (6-digit code) that the employee uses to complete their account setup (set password, PIN).

### User Edit Dialog

Same fields as create, plus:

| Field | Control | FormControl | Required | Notes |
|-------|---------|-------------|----------|-------|
| Work Location | `<app-select>` | `workLocationId` | No | Only shown when multiple locations exist. Options from company locations. |
| Active | `<app-toggle>` | `isActive` | No | Toggle employee active status |
| Scan Identifiers | Section | -- | No | RFID/NFC/Barcode/Biometric identifiers |

### Scan Identifiers (within edit dialog)

Manage scan identifiers for kiosk authentication:

| Control | Type | Notes |
|---------|------|-------|
| Existing identifiers list | Read-only | Shows type + value + remove button per identifier |
| Type selector | `<app-select>` | Options: RFID Card, NFC Tag, Barcode, Biometric |
| Value input | `<app-input>` | Identifier value (can be scanned from reader) |
| Add button | `action-btn action-btn--sm` | Adds the identifier |
| RFID Reader | Section | WebHID RFID reader pairing, connection status, relay client setup |
| Employee Barcode | `<app-barcode-info>` | Barcode from central barcode table |

### Setup Token Flow

When an admin creates a new user:
1. A setup token is generated (6-digit alphanumeric code)
2. The token and expiration date are displayed in a banner
3. Admin copies the code and shares it with the employee
4. Employee navigates to the setup page and enters the code
5. Employee sets their password, PIN, and completes their profile

For existing users without a password:
- Admin can click "Get Setup Code" to regenerate a setup token
- Admin can also send setup invite via email

---

## ApplicationUser Entity

The `ApplicationUser` extends `IdentityUser<int>` and is located in `forge.data/Context/ApplicationUser.cs`.

| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary key (from IdentityUser) |
| Email | string | Email address (from IdentityUser) |
| FirstName | string | Employee first name |
| LastName | string | Employee last name |
| Initials | string? | Display initials (e.g., "DH") |
| AvatarColor | string? | Hex color for avatar display |
| IsActive | bool | Whether the user is active |
| CreatedAt | DateTimeOffset | Account creation timestamp |
| UpdatedAt | DateTimeOffset | Last update timestamp |
| SetupToken | string? | Account setup token (6-digit code) |
| SetupTokenExpiresAt | DateTimeOffset? | Setup token expiration |
| PinHash | string? | PBKDF2-hashed PIN for kiosk auth |
| EmployeeBarcode | string? | Barcode value for kiosk scan |
| TeamId | int? | FK to team assignment |
| WorkLocationId | int? | FK to CompanyLocation (determines state withholding) |
| WorkLocation | CompanyLocation? | Navigation property |
| AccountingEmployeeId | string? | QuickBooks Employee ID for time sync |
| GoogleId | string? | Google SSO identity link |
| MicrosoftId | string? | Microsoft SSO identity link |
| OidcSubjectId | string? | Generic OIDC subject ID |
| OidcProvider | string? | OIDC provider name |
| MfaEnabled | bool | Whether MFA is enabled |
| MfaEnforcedByPolicy | bool | Whether MFA is enforced by admin policy |
| MfaEnabledAt | DateTimeOffset? | When MFA was enabled |
| MfaRecoveryCodesRemaining | int | Count of unused recovery codes |

## EmployeeProfile Entity

The `EmployeeProfile` entity stores employee-specific profile data separate from the authentication identity. Located in `forge.core/Entities/EmployeeProfile.cs`.

| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary key |
| UserId | int | FK to ApplicationUser |
| DateOfBirth | DateTimeOffset? | Date of birth |
| Gender | string? | Gender |
| Street1 | string? | Address line 1 |
| Street2 | string? | Address line 2 |
| City | string? | City |
| State | string? | State code |
| ZipCode | string? | ZIP code |
| Country | string? | Country |
| PhoneNumber | string? | Personal phone |
| PersonalEmail | string? | Personal email (distinct from work email) |
| EmergencyContactName | string? | Emergency contact name |
| EmergencyContactPhone | string? | Emergency contact phone |
| EmergencyContactRelationship | string? | Emergency contact relationship |
| StartDate | DateTimeOffset? | Employment start date |
| Department | string? | Department name |
| JobTitle | string? | Job title |
| EmployeeNumber | string? | Employee number/ID |
| PayType | PayType? | Hourly or Salary |
| HourlyRate | decimal? | Hourly pay rate (when PayType = Hourly) |
| SalaryAmount | decimal? | Salary amount (when PayType = Salary) |
| W4CompletedAt | DateTimeOffset? | When W-4 was completed |
| StateWithholdingCompletedAt | DateTimeOffset? | When state withholding was completed |
| I9CompletedAt | DateTimeOffset? | When I-9 was completed |
| I9ExpirationDate | DateTimeOffset? | When I-9 work authorization expires |
| DirectDepositCompletedAt | DateTimeOffset? | When direct deposit was set up |
| WorkersCompAcknowledgedAt | DateTimeOffset? | When workers' comp was acknowledged |
| HandbookAcknowledgedAt | DateTimeOffset? | When handbook was acknowledged |
| OnboardingBypassedAt | DateTimeOffset? | When user self-certified onboarding complete |

---

## Work Location Assignment

An employee's `WorkLocationId` on `ApplicationUser` determines:

1. **State withholding form** -- The work location's state drives which state withholding form is presented during onboarding. States are categorized as no-tax, federal-W4, or state-specific-form.

2. **Admin assignment** -- The work location select in the admin user edit dialog is only shown when multiple company locations exist. Options come from `CompanyLocation` entities.

3. **Default location** -- Employees without a `WorkLocationId` default to the company's default location (the `CompanyLocation` with `IsDefault = true`).

---

## Role Assignment

Roles are assigned in the admin user create/edit dialog via the Role select field. Available roles are loaded from `GET /api/v1/admin/roles`, which returns all ASP.NET Identity roles.

| Role | Description |
|------|-------------|
| Admin | Full system access |
| Manager | Team management, reports, time corrections, events |
| Engineer | Kanban, assigned work, files, expenses, time tracking |
| PM | Backlog, planning, leads, reporting |
| ProductionWorker | Simple task list, timer, card moves |
| OfficeManager | Customer/vendor, invoicing, employee documents |

Role assignment is single-role per user (the UI uses a single-select, not multi-select). The backend `UpdateAdminUserCommand` handles role changes via ASP.NET Identity's `UserManager`.

---

## API Endpoints

### Employee List & Detail

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/employees` | Admin, Manager | List employees (query: `search`, `teamId`, `role`, `isActive`) |
| GET | `/api/v1/employees/{id}` | Admin, Manager | Get employee detail |
| GET | `/api/v1/employees/{id}/stats` | Admin, Manager | Get employee stats (hours, compliance, jobs, training, expenses) |

### Per-Employee Data Tabs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/employees/{id}/time-summary` | Admin, Manager | Time entries (query: `period`) |
| GET | `/api/v1/employees/{id}/pay-summary` | Admin, Manager | Pay stubs |
| GET | `/api/v1/employees/{id}/jobs` | Admin, Manager | Assigned jobs |
| GET | `/api/v1/employees/{id}/expenses` | Admin, Manager | Expenses |
| GET | `/api/v1/employees/{id}/training` | Admin, Manager | Training progress |
| GET | `/api/v1/employees/{id}/compliance` | Admin, Manager | Compliance form submissions |
| GET | `/api/v1/employees/{id}/activity` | Admin, Manager | Activity log entries |

### Admin User Management (at `/api/v1/admin`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/admin/users` | Admin | List all users |
| POST | `/api/v1/admin/users` | Admin | Create user (returns setup token) |
| PUT | `/api/v1/admin/users/{id}` | Admin | Update user (name, role, location, active status) |
| GET | `/api/v1/admin/roles` | Admin, Manager | List available roles |
| POST | `/api/v1/admin/users/{id}/setup-token` | Admin | Regenerate setup token |
| POST | `/api/v1/admin/users/{id}/send-invite` | Admin | Send setup invite email |
| POST | `/api/v1/admin/users/{id}/reset-pin` | Admin | Reset user's kiosk PIN |
| POST | `/api/v1/admin/users/{id}/deactivate` | Admin | Deactivate user |
| POST | `/api/v1/admin/users/{id}/reactivate` | Admin | Reactivate user |
| GET | `/api/v1/admin/users/{id}/documents` | Admin | Get employee documents |

### Employee Profile (Self-Service at `/api/v1/employee-profile`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/employee-profile` | All | Get own profile |
| PUT | `/api/v1/employee-profile` | All | Update own profile (personal/address/emergency fields) |
| GET | `/api/v1/employee-profile/completeness` | All | Get profile completeness status |
| POST | `/api/v1/employee-profile/acknowledge/{formType}` | All | Acknowledge a compliance form |

### Response Models

**EmployeeListItem:**

```typescript
interface EmployeeListItem {
  id: number;
  firstName: string;
  lastName: string;
  initials?: string;
  avatarColor?: string;
  email: string;
  phone?: string;
  role: string;
  teamName?: string;
  teamId?: number;
  isActive: boolean;
  jobTitle?: string;
  department?: string;
  startDate?: string;
  createdAt: string;
}
```

**EmployeeDetail:**

```typescript
interface EmployeeDetail {
  id: number;
  firstName: string;
  lastName: string;
  initials?: string;
  avatarColor?: string;
  email: string;
  phone?: string;
  role: string;
  teamName?: string;
  teamId?: number;
  isActive: boolean;
  jobTitle?: string;
  department?: string;
  startDate?: string;
  createdAt: string;
  workLocationId?: number;
  workLocationName?: string;
  pinConfigured: boolean;
  hasRfidIdentifier: boolean;
  hasBarcodeIdentifier: boolean;
  personalEmail?: string;
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  complianceCompletedItems: number;
  complianceTotalItems: number;
}
```

**EmployeeStats:**

```typescript
interface EmployeeStats {
  hoursThisPeriod: number;
  compliancePercent: number;
  activeJobCount: number;
  trainingProgressPercent: number;
  outstandingExpenseCount: number;
  outstandingExpenseTotal: number;
}
```

---

## Known Limitations

1. **Read-only feature** -- The Employees feature is entirely read-only. All employee data modification (profile updates, role changes, status changes) happens in the Admin panel or via the employee's own Account pages. There are no edit actions in the Employees feature.

2. **No direct employee creation** -- Employees are created through the Admin user management panel. The Employees feature has no "New Employee" button.

3. **Manager scope not enforced** -- While the backend receives the caller's user ID and admin status for the employee list query, the current implementation does not restrict managers to only their team members. All managers see all employees.

4. **No export** -- There is no export/download functionality for employee lists or detail data. Reporting on employee data is available through the Reports module.

5. **No inline profile editing** -- The overview tab shows profile data in read-only format. Managers cannot edit an employee's profile from this view -- they must use the Admin panel.

6. **Events tab shows only upcoming** -- The employee events tab calls `getUpcomingEventsForUser()`, which only returns future events. Past event history is not available in this view.

7. **No pagination** -- The employee list loads all employees in a single API call without pagination. This may become a performance concern for organizations with hundreds of employees.

8. **Single role per user** -- The admin user form uses a single-select for role assignment. Users cannot hold multiple roles simultaneously.
