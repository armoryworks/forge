# Roles & Permissions Reference

Comprehensive reference for all roles, permissions, and access control in Forge. Derived from actual source code (`[Authorize]` attributes on controllers, Angular `roleGuard()` on routes, and sidebar `allowedRoles` filtering).

---

## 1. Role Definitions

Forge defines six roles. Roles are **additive** -- a user can hold multiple roles simultaneously, and their effective permissions are the **union** of all assigned roles.

| Role | Description |
|------|-------------|
| **Admin** | Full system access. User management, role assignment, system settings, track type configuration, integrations, compliance forms, MFA policy, scheduled tasks, terminology, audit log, EDI. The only role that can create/modify users, configure the system, or manage compliance form templates. |
| **Manager** | Operational leadership. Everything PM can do plus: assign work to others, approve expenses, correct time entries, manage events, training administration, employee management, shop floor terminal setup, scheduling, MRP, OEE, asset management. |
| **PM** (Project Manager) | Planning and sales focus. Backlog curation, planning cycles, lead management, reporting, customer management, quotes, sales orders, estimates, customer returns. Read-only board access (no card management operations). |
| **Engineer** | Technical execution. Kanban board access, assigned work, file attachments, expense logging, time tracking, parts catalog, inventory, quality inspections, lot tracking, FMEA, PPAP. |
| **OfficeManager** | Administrative and financial operations. Customer/vendor management, purchase orders, invoices, payments, shipments, inventory, compliance form review, payroll administration, expense settings view. |
| **ProductionWorker** | Shop floor execution. Simplified task list, start/stop timer, move cards within production stages, add notes/photos, inventory viewing, lot tracking, planning cycle participation. No nav menu, dashboards, settings, or admin features in the worker view. |

---

## 2. Role Hierarchy

Roles are **not hierarchical** in a strict inheritance sense -- they are independent, additive sets of permissions. However, in practice the roles form a rough capability ladder:

```
Admin (everything)
  |
Manager (operations + PM capabilities + approvals)
  |
PM (planning + sales + reporting)          OfficeManager (finance + admin ops)
  |                                              |
Engineer (technical execution)             ProductionWorker (shop floor)
```

**Key relationships:**
- **Admin** has access to every feature and every API endpoint
- **Manager** has access to nearly everything except system configuration (users, settings, integrations, track types, reference data, terminology, audit log, EDI, MFA policy, scheduled tasks)
- **PM** and **OfficeManager** are peer roles with different domain focus (PM = sales/planning, OfficeManager = finance/procurement)
- **Engineer** has broad technical access but no financial, HR, or administrative capabilities
- **ProductionWorker** has the most restricted access, limited to direct production tasks

---

## 3. Feature Access Matrix

### 3.1 Main Application Features

| Feature / Page | Admin | Manager | PM | Engineer | OfficeManager | ProductionWorker |
|---------------|:-----:|:-------:|:--:|:--------:|:-------------:|:----------------:|
| Dashboard | x | x | x | x | x | x |
| Kanban Board | x | x | - | x | - | x |
| Backlog | x | x | x | x | - | - |
| Planning Cycles | x | x | x | - | - | - |
| Calendar | x | x | x | x | x | x |
| Chat | x | x | x | x | x | x |
| AI Assistant | x | x | x | x | x | x |
| Training (My Learning) | x | x | x | x | x | x |
| Notifications | x | x | x | x | x | x |
| Account / Profile | x | x | x | x | x | x |
| Onboarding | x | x | x | x | x | x |
| Worker View | x | x | x | x | x | x |

### 3.2 Sales Features

| Feature / Page | Admin | Manager | PM | Engineer | OfficeManager | ProductionWorker |
|---------------|:-----:|:-------:|:--:|:--------:|:-------------:|:----------------:|
| Customers | x | x | x | x | x | - |
| Customer Addresses | x | x | x | - | x | - |
| Leads | x | x | x | - | - | - |
| Quotes | x | x | x | - | x | - |
| Estimates | x | x | x | - | x | - |
| Sales Orders | x | x | x | - | x | - |
| Shipments | x | x | - | - | x | - |
| Invoices | x | x | - | - | x | - |
| Payments | x | x | - | - | x | - |
| Customer Returns | x | x | x | - | x | - |
| Approvals | x | x | x | - | x | - |

### 3.3 Supply Chain Features

| Feature / Page | Admin | Manager | PM | Engineer | OfficeManager | ProductionWorker |
|---------------|:-----:|:-------:|:--:|:--------:|:-------------:|:----------------:|
| Parts Catalog | x | x | x | x | x | x |
| Inventory | x | x | - | x | x | x |
| Lots / Traceability | x | x | - | x | - | x |
| Vendors | x | x | - | - | x | - |
| Purchase Orders | x | x | - | - | x | - |
| RFQs / Purchasing | x | x | - | - | x | - |
| MRP | x | x | - | - | - | - |
| Scheduling | x | x | - | - | - | - |
| OEE | x | x | - | - | - | - |

### 3.4 Resources & Quality

| Feature / Page | Admin | Manager | PM | Engineer | OfficeManager | ProductionWorker |
|---------------|:-----:|:-------:|:--:|:--------:|:-------------:|:----------------:|
| Assets | x | x | - | - | - | - |
| Time Tracking | x | x | x | x | x | x |
| Employees | x | x | - | - | - | - |
| Expenses | x | x | - | x | x | - |
| Reports | x | x | x | - | - | - |
| Quality / QC | x | x | - | x | - | - |

### 3.5 Admin Features

| Feature / Page | Admin | Manager | PM | Engineer | OfficeManager | ProductionWorker |
|---------------|:-----:|:-------:|:--:|:--------:|:-------------:|:----------------:|
| Admin Panel (entry) | x | x | - | - | x | - |
| Users | x | - | - | - | - | - |
| Track Types | x | - | - | - | - | - |
| Reference Data | x | - | - | - | - | - |
| Terminology | x | - | - | - | - | - |
| Settings | x | - | - | - | - | - |
| Integrations | x | - | - | - | - | - |
| AI Assistants | x | - | - | - | - | - |
| Teams | x | - | - | - | - | - |
| Sales Tax | x | - | - | - | - | - |
| Audit Log | x | - | - | - | - | - |
| EDI | x | - | - | - | - | - |
| MFA Policy | x | - | - | - | - | - |
| Time Corrections | x | x | - | - | - | - |
| Events | x | x | - | - | - | - |
| Training (Admin) | x | x | - | - | - | - |
| Compliance | x | x | - | - | x | - |
| Shop Floor Setup | x | x | - | - | - | - |

---

## 4. API Endpoint Permissions

Permissions are enforced via `[Authorize(Roles = "...")]` on controllers and individual action methods. A class-level `[Authorize]` (no roles) means any authenticated user can access. Method-level attributes override or restrict the class-level default.

### 4.1 Admin-Only Endpoints

| Controller | Endpoint | Notes |
|-----------|----------|-------|
| `AdminController` | All endpoints (class-level) | Users, track types, ref data, settings, integrations, company profile, labor rates, MFA policy |
| `AccountingController` | All write operations | Sync, disconnect, map, settings |
| `AiAssistantsController` | Create/Update/Delete assistants | Admin CRUD for AI assistants |
| `BiApiKeysController` | All endpoints | BI API key management |
| `CompanyLocationsController` | All endpoints | Company location CRUD |
| `CurrenciesController` | All endpoints | Currency management |
| `ExchangeRatesController` | All endpoints | Exchange rate management |
| `LanguagesController` | All endpoints | Language management |
| `PlantsController` | All endpoints | Plant/facility management |
| `ScheduledTasksController` | All endpoints | Scheduled task configuration |
| `WebhooksController` | All endpoints | Webhook configuration |
| `TerminologyController` | PUT (update) | Terminology customization |
| `ReviewsController` | PUT settings | Review cycle settings |

### 4.2 Admin + Manager Endpoints

| Controller | Endpoint | Notes |
|-----------|----------|-------|
| `AdminController` | `GET /roles`, shift assignments | Role listing, shift management |
| `ApprovalsController` | Configure approvals | Approval workflow setup |
| `EdiController` | All endpoints | EDI trading partner management |
| `EmployeesController` | All endpoints | Employee management |
| `EventsController` | Create/Update/Delete events | Event administration |
| `InventoryController` | Create/Update/Delete locations, bins | Inventory structure management |
| `JobsController` | `PATCH /{id}/assign-batch` | Bulk job assignment |
| `KanbanCardsController` | Bulk move, bulk assign, bulk priority | Board bulk operations |
| `LeaveController` | Approve/reject leave, policy | Leave management |
| `MachineConnectionsController` | All endpoints | Machine/IoT connections |
| `MrpController` | All endpoints | Material requirements planning |
| `NcrCapaController` | Create/Update/Close NCRs | Non-conformance management |
| `QualityController` | Create/Update QC templates, production runs | QC template admin |
| `ReplenishmentController` | All endpoints | Inventory replenishment |
| `ReportBuilderController` | Seed/delete/manage templates | Report template management |
| `SalesTaxController` | Create/Update rates | Sales tax rate management |
| `SchedulingController` | All endpoints | Production scheduling |
| `ShiftsController` | All endpoints | Shift management |
| `ShopFloorController` | Teams, terminals CRUD | Shop floor configuration |
| `SpcController` | Control chart config | Statistical process control |
| `TimeTrackingController` | Lock period, corrections, overtime | Time admin operations |
| `TrainingController` | User progress, enrollment admin | Training oversight |
| `WorkCentersController` | All endpoints | Work center configuration |
| `ECommerceController` | All endpoints | E-commerce integration |
| `PredictiveMaintenanceController` | Create/manage predictions | Predictive maintenance admin |
| `ReviewsController` | Create/manage review cycles | Performance reviews |
| `CpqController` | Pricing rules management | Configure-price-quote rules |

### 4.3 Admin + Manager + OfficeManager Endpoints

| Controller | Endpoint | Notes |
|-----------|----------|-------|
| `ComplianceFormsController` | View employee submissions | Employee form submission review |
| `CustomerReturnsController` | All endpoints | Customer return processing |
| `IdentityDocumentsController` | Admin view/manage | Employee identity document review |
| `InvoicesController` | All endpoints | Invoice CRUD (standalone mode) |
| `PaymentsController` | All endpoints | Payment CRUD (standalone mode) |
| `PayrollController` | Admin upload/manage | Pay stub and tax document admin |
| `PriceListsController` | All endpoints | Price list management |
| `PurchaseOrdersController` | All endpoints | Purchase order management |
| `PurchasingController` | All endpoints | RFQ management |
| `RecurringOrdersController` | All endpoints | Recurring order templates |
| `ShipmentsController` | All endpoints | Shipment management |
| `VendorsController` | All endpoints | Vendor CRUD |

### 4.4 Admin + Manager + PM Endpoints

| Controller | Endpoint | Notes |
|-----------|----------|-------|
| `LeadsController` | All endpoints | Lead management |
| `ReportsController` | All endpoints | Report viewing |

### 4.5 Admin + Manager + PM + OfficeManager Endpoints

| Controller | Endpoint | Notes |
|-----------|----------|-------|
| `CustomerAddressesController` | All endpoints | Customer address management |
| `EstimatesController` | All endpoints | Estimate CRUD |
| `QuotesController` | All endpoints | Quote CRUD |
| `ReportBuilderController` | Run/view reports | Report execution (not template mgmt) |
| `SalesOrdersController` | All endpoints | Sales order management |
| `SankeyReportsController` | All endpoints | Sankey flow reports |

### 4.6 Admin + Manager + Engineer Endpoints

| Controller | Endpoint | Notes |
|-----------|----------|-------|
| `AssetsController` | All endpoints | Asset CRUD |
| `FmeaController` | FMEA CRUD | Failure mode & effects analysis |
| `PpapController` | PPAP submissions | Production part approval |
| `QualityController` | Create/manage inspections | QC inspection execution |
| `SerialsController` | All endpoints | Serial number tracking |

### 4.7 Broadly Accessible Endpoints (All or Most Roles)

| Controller | Roles | Notes |
|-----------|-------|-------|
| `JobsController` | All 6 roles | Job CRUD (class-level) |
| `PartsController` | All 6 roles | Part catalog (class-level) |
| `CustomersController` | Admin, Manager, OfficeManager, PM, Engineer | Customer data |
| `InventoryController` | Admin, Manager, OfficeManager, Engineer, ProductionWorker | Inventory viewing (write restricted to Admin+Manager) |
| `KanbanCardsController` | Admin, Manager, OfficeManager, Engineer, ProductionWorker | Card operations (bulk ops restricted) |
| `PlanningCyclesController` | Admin, Manager, PM, Engineer, ProductionWorker | Planning participation |
| `LotsController` | Admin, Manager, Engineer, ProductionWorker | Lot tracking |
| `PickWavesController` | Admin, Manager, OfficeManager, Engineer, ProductionWorker | Pick wave operations |

### 4.8 Any Authenticated User Endpoints

These controllers use `[Authorize]` without role restrictions:

| Controller | Notes |
|-----------|-------|
| `AddressesController` | Address validation |
| `AiController` | AI generate/search/summarize |
| `AndonController` | Andon board signals |
| `BarcodesController` | Barcode generation |
| `ChatController` | Chat messaging |
| `CopqController` | Cost of poor quality |
| `CpqController` | CPQ quote generation (read) |
| `DashboardController` | Dashboard data |
| `DownloadsController` | File downloads |
| `EmployeeProfileController` | Own employee profile |
| `EntityActivityController` | Activity log viewing |
| `EventsController` | Event listing (read) |
| `ExpensesController` | Own expenses (settings restricted) |
| `FilesController` | File upload/download |
| `FmeaController` | FMEA viewing (write restricted) |
| `LeaveController` | Own leave requests |
| `NcrCapaController` | NCR viewing (write restricted) |
| `NotificationsController` | Own notifications |
| `OnboardingController` | Onboarding flow |
| `PayrollController` | Own pay stubs/tax docs |
| `PpapController` | PPAP viewing (write restricted) |
| `PredictiveMaintenanceController` | View predictions |
| `PricingController` | Price lookup |
| `QualityController` | QC viewing (template mgmt restricted) |
| `ReferenceDataController` | Lookup data (write restricted to Admin) |
| `ReviewsController` | Own reviews |
| `SalesTaxController` | Rate lookup (write restricted) |
| `SearchController` | Global search |
| `SpcController` | SPC chart viewing (config restricted) |
| `StatusTrackingController` | Status lifecycle operations |
| `TerminologyController` | Read terminology (update Admin-only) |
| `TimeTrackingController` | Own time entries (admin ops restricted) |
| `TrackTypesController` | Track type listing |
| `TrainingController` | My learning/modules (admin restricted) |
| `UserIntegrationsController` | Own integration settings |
| `UserPreferencesController` | Own UI preferences |
| `UsersController` | User lookup |

### 4.9 Anonymous / Unauthenticated Endpoints

| Controller | Endpoint | Notes |
|-----------|----------|-------|
| `AuthController` | Login, setup, token validation, SSO, kiosk login, scan login, NFC login, MFA challenge/validate/recovery | Authentication flow |
| `ShopFloorController` | Overview, clock status, search, identify scan, clock in/out, teams list, terminal lookup | Kiosk display (trusted LAN) |
| `StorageController` | All endpoints | Static file serving |
| `ReferenceDataController` | `GET /groups` | Lookup group listing |
| `ComplianceFormsController` | DocuSeal webhook | External webhook callback |
| `AdminController` | `GET /setup-status`, `GET /setup-requirements` | Initial setup check |
| `AccountingController` | OAuth callbacks | QB/Xero/etc. OAuth redirect handlers |

---

## 5. UI Navigation (Sidebar)

The sidebar filters items based on the authenticated user's roles via `allowedRoles` on each `NavItem`. Items without `allowedRoles` are visible to all authenticated users.

### 5.1 Operations Group

| Nav Item | Route | Visible To |
|----------|-------|-----------|
| Dashboard | `/dashboard` | All roles |
| Board | `/kanban` | Admin, Manager, Engineer, ProductionWorker |
| Backlog | `/backlog` | Admin, Manager, PM, Engineer |
| Planning | `/planning` | Admin, Manager, PM |
| Calendar | `/calendar` | All roles |

### 5.2 Sales Group

| Nav Item | Route | Visible To |
|----------|-------|-----------|
| Customers | `/customers` | Admin, Manager, PM, OfficeManager |
| Leads | `/leads` | Admin, Manager, PM |
| Quotes | `/quotes` | Admin, Manager, PM, OfficeManager |
| Sales Orders | `/sales-orders` | Admin, Manager, PM, OfficeManager |
| Shipments | `/shipments` | Admin, Manager, OfficeManager |
| Invoices | `/invoices` | Admin, Manager, OfficeManager |
| Payments | `/payments` | Admin, Manager, OfficeManager |
| Customer Returns | `/customer-returns` | Admin, Manager, PM, OfficeManager |

### 5.3 Supply Group

| Nav Item | Route | Visible To |
|----------|-------|-----------|
| Parts | `/parts` | Admin, Manager, Engineer, PM |
| Inventory | `/inventory` | Admin, Manager, Engineer, OfficeManager |
| Lots | `/lots` | Admin, Manager, Engineer |
| Vendors | `/vendors` | Admin, Manager, OfficeManager |
| Purchase Orders | `/purchase-orders` | Admin, Manager, OfficeManager |
| RFQs | `/purchasing` | Admin, Manager, OfficeManager |
| MRP | `/mrp` | Admin, Manager |
| Scheduling | `/scheduling` | Admin, Manager |
| OEE | `/oee` | Admin, Manager |

### 5.4 Resources Group

| Nav Item | Route | Visible To |
|----------|-------|-----------|
| Assets | `/assets` | Admin, Manager |
| Time | `/time-tracking` | All roles |
| Employees | `/employees` | Admin, Manager |
| Expenses | `/expenses` | Admin, Manager, Engineer, OfficeManager |
| Approvals | `/approvals` | Admin, Manager, PM, OfficeManager |
| Reports | `/reports` | Admin, Manager, PM |
| AI | `/ai` | All roles |
| Training | `/training/library` | All roles |

### 5.5 Bottom Navigation

| Nav Item | Route | Visible To |
|----------|-------|-----------|
| Shop Floor | `/display/shop-floor` | Admin, Manager |
| Admin | `/admin` | Admin, Manager, OfficeManager |

### 5.6 Admin Sub-Navigation

| Admin Tab | Route | Visible To |
|----------|-------|-----------|
| Users | `/admin/users` | Admin |
| Track Types | `/admin/track-types` | Admin |
| Ref Data | `/admin/reference-data` | Admin |
| Terminology | `/admin/terminology` | Admin |
| Settings | `/admin/settings` | Admin |
| Integrations | `/admin/integrations` | Admin |
| AI Assistants | `/admin/ai-assistants` | Admin |
| Teams | `/admin/teams` | Admin |
| Sales Tax | `/admin/sales-tax` | Admin |
| Audit Log | `/admin/audit-log` | Admin |
| Time Corrections | `/admin/time-corrections` | Admin, Manager |
| Events | `/admin/events` | Admin, Manager |
| EDI | `/admin/edi` | Admin |
| MFA Policy | `/admin/mfa` | Admin |
| Training | `/admin/training` | Admin, Manager |
| Compliance | `/admin/compliance` | Admin, Manager, OfficeManager |

---

## 6. Special Permissions

Beyond basic feature access, certain operations require elevated roles regardless of feature-level access.

### 6.1 User Management

| Operation | Required Roles |
|----------|---------------|
| Create user accounts | Admin |
| Update user roles | Admin |
| Deactivate/reactivate users | Admin |
| Reset user credentials | Admin |
| Generate setup tokens | Admin |
| View all users list (admin panel) | Admin |
| View roles list | Admin, Manager |

### 6.2 Expense Approval

| Operation | Required Roles |
|----------|---------------|
| Submit own expenses | All authenticated |
| View expense settings | Admin, Manager |
| Update expense settings | Admin |
| Approve/reject others' expenses | Admin, Manager (via approval workflow) |
| Self-approve expenses | Controlled by per-user `canSelfApproveExpenses` flag + `selfApprovalLimit` |

### 6.3 Time Management

| Operation | Required Roles |
|----------|---------------|
| Log own time entries | All authenticated |
| Start/stop own timer | All authenticated |
| View own clock events | All authenticated |
| Correct others' time entries | Admin, Manager |
| View correction audit log | Admin, Manager |
| Lock pay periods | Admin, Manager |
| Configure pay period settings | Admin |
| View overtime breakdown | Admin, Manager |
| Create overtime rules | Admin |

### 6.4 Kanban Board Operations

| Operation | Required Roles |
|----------|---------------|
| View board | Admin, Manager, Engineer, ProductionWorker (OfficeManager via KanbanCards) |
| Move cards between stages | Admin, Manager, Engineer, ProductionWorker, OfficeManager |
| Create/update jobs | All 6 roles (via JobsController) |
| Bulk move cards | Admin, Manager |
| Bulk assign cards | Admin, Manager |
| Bulk set priority | Admin, Manager |

### 6.5 Inventory Management

| Operation | Required Roles |
|----------|---------------|
| View inventory/stock | Admin, Manager, OfficeManager, Engineer, ProductionWorker |
| Create/update storage locations | Admin, Manager |
| Create/update bins | Admin, Manager |
| Perform bin movements | Admin, Manager |
| Delete storage locations | Admin, Manager |

### 6.6 Quality Operations

| Operation | Required Roles |
|----------|---------------|
| View QC inspections | All authenticated |
| Create/update inspections | Admin, Manager, Engineer |
| Create/update QC templates | Admin, Manager |
| Manage production runs | Admin, Manager |

### 6.7 Training Administration

| Operation | Required Roles |
|----------|---------------|
| View/complete training modules | All authenticated |
| Create/update/delete modules | Admin |
| Create/update training paths | Admin |
| View user progress | Admin, Manager |
| Manage enrollments | Admin, Manager |

### 6.8 Compliance & HR

| Operation | Required Roles |
|----------|---------------|
| Submit own compliance forms | All authenticated |
| Manage compliance form templates | Admin |
| View employee submissions | Admin, Manager, OfficeManager |
| View/manage identity documents | Admin, Manager, OfficeManager |
| Upload pay stubs / tax documents | Admin, Manager, OfficeManager |
| View own pay stubs / tax documents | All authenticated |

### 6.9 System Configuration

| Operation | Required Roles |
|----------|---------------|
| Company profile | Admin |
| Company locations | Admin |
| System settings | Admin |
| Integrations (QB, SSO, etc.) | Admin |
| Track type configuration | Admin |
| Reference data management | Admin |
| Terminology customization | Admin |
| Scheduled tasks | Admin |
| Webhooks | Admin |
| Languages/currencies/plants | Admin |
| Sales tax rate deletion | Admin |
| BI API keys | Admin |

---

## 7. Kiosk / Shop Floor Authentication

The shop floor display (`/display/shop-floor`) uses a tiered authentication system optimized for speed in a manufacturing environment.

### 7.1 Authentication Tiers

| Tier | Method | Speed | Use Case |
|------|--------|-------|----------|
| **Tier 1** | RFID / NFC badge tap + PIN | Fastest | Primary kiosk auth. Employee taps badge, enters 4-6 digit PIN. |
| **Tier 2** | Barcode scan + PIN | Fast | Fallback for workers without NFC. USB barcode scanner reads badge. |
| **Tier 3** | Username + Password | Standard | Desktop/mobile login. Also available as "Manual Login" on kiosk. |
| **Tier 4** | Enterprise SSO (Google/Microsoft/OIDC) | Standard | Cloud deployments only. Not applicable to kiosk (no browser redirect). |

### 7.2 Kiosk Endpoints (Anonymous)

The shop floor display operates on a trusted LAN without requiring authentication for read operations:

- `GET /api/v1/display/shop-floor` -- Overview (jobs, workers, status)
- `GET /api/v1/display/shop-floor/clock-status` -- Worker clock status
- `GET /api/v1/display/shop-floor/search` -- Kiosk search (jobs + parts only)
- `POST /api/v1/display/shop-floor/identify-scan` -- Identify scanned badge/barcode
- `POST /api/v1/display/shop-floor/clock` -- Clock in/out
- `GET /api/v1/display/shop-floor/teams` -- Team listing
- `GET /api/v1/display/shop-floor/terminal` -- Terminal config lookup

### 7.3 Kiosk Management (Admin + Manager)

Terminal and team configuration requires authentication:

- `POST /api/v1/display/shop-floor/teams` -- Create team
- `PUT/DELETE /api/v1/display/shop-floor/teams/{id}` -- Update/delete team
- `GET/PUT /api/v1/display/shop-floor/teams/{id}/members` -- Team membership
- `GET /api/v1/display/shop-floor/terminals` -- List terminals
- `POST /api/v1/display/shop-floor/terminal` -- Setup terminal

### 7.4 PIN Management

- PINs are separate from passwords -- short numeric codes (4-6 digits) for quick kiosk auth only
- PINs are hashed at rest (PBKDF2), never stored in plaintext
- Users set their own PIN during account setup (required only if scan hardware is configured)
- Admin can reset a user's PIN (generates temporary PIN, user must change on next scan)
- Lockout after 5 consecutive failed PIN attempts (configurable), admin reset required

### 7.5 Role-to-Tier Mapping

All roles can use all authentication tiers. The tier selection is based on the **environment**, not the role:

| Environment | Primary Tier | Fallback |
|------------|-------------|----------|
| Shop floor kiosk | Tier 1 (NFC) or Tier 2 (barcode) | Tier 3 (manual login link) |
| Desktop browser | Tier 3 (credentials) | Tier 4 (SSO, if configured) |
| Mobile app | Tier 3 (credentials) | Tier 4 (SSO, if configured) |

---

## 8. MFA Policy

MFA (Multi-Factor Authentication) uses TOTP (Time-based One-Time Password) and is managed via the Admin panel.

### 8.1 MFA Endpoints

| Endpoint | Auth Required | Notes |
|----------|:------------:|-------|
| `POST /auth/mfa/setup` | Yes | Begin MFA setup (any authenticated user) |
| `POST /auth/mfa/verify-setup` | Yes | Verify TOTP setup |
| `DELETE /auth/mfa/disable` | Yes | Disable own MFA |
| `DELETE /auth/mfa/devices/{id}` | Yes | Remove a device |
| `GET /auth/mfa/status` | Yes | Check own MFA status |
| `POST /auth/mfa/challenge` | No | Create challenge during login |
| `POST /auth/mfa/validate` | No | Validate TOTP code during login |
| `POST /auth/mfa/recovery` | No | Use recovery code |
| `POST /auth/mfa/recovery-codes` | Yes | Generate new recovery codes |

### 8.2 Admin MFA Policy

| Endpoint | Required Role | Notes |
|----------|:------------:|-------|
| `GET /admin/mfa/compliance` | Admin | View MFA compliance status across all users |
| `PUT /admin/mfa/policy` | Admin | Set which roles are required to have MFA enabled |

The MFA policy is role-based:
- Admin configures which roles **must** have MFA enabled (e.g., require MFA for Admin and Manager roles)
- The `SetMfaPolicy` command accepts a list of `RequiredRoles`
- Users in required roles who haven't set up MFA will be prompted/enforced
- Non-required roles can still opt in to MFA voluntarily

### 8.3 MFA Flow

1. **Login** -- User submits credentials (Tier 3) or scan+PIN (Tier 1/2)
2. **MFA check** -- If user has MFA enabled, server returns a `challengeToken` instead of a JWT
3. **Challenge** -- Client prompts for TOTP code or recovery code
4. **Validation** -- Client submits code; on success, server returns the full JWT
5. **Remember device** -- Optional; skips MFA for trusted devices (time-limited)

---

## 9. Angular Guards

The Angular frontend enforces route-level access via guards defined in `shared/guards/`:

| Guard | File | Purpose |
|-------|------|---------|
| `authGuard` | `auth.guard.ts` | Redirects unauthenticated users to `/login` |
| `roleGuard(...roles)` | `role.guard.ts` | Checks `AuthService.hasAnyRole(allowedRoles)`. Redirects unauthorized users to `/dashboard`. |
| `setupRequiredGuard` | `setup.guard.ts` | Only allows access to `/setup` when initial setup is needed |
| `setupCompleteGuard` | `setup.guard.ts` | Only allows access to `/login` when setup is complete |
| `mobileRedirectGuard` | `mobile-redirect.guard.ts` | Redirects mobile devices to `/m` routes |
| `unsavedChangesGuard` | `unsaved-changes.guard.ts` | Warns before navigating away from dirty forms |

The `roleGuard` is a factory function that returns a `CanActivateFn`. Usage:

```typescript
canActivate: [roleGuard('Admin', 'Manager', 'PM')]
```

**Important:** The route guard only controls navigation. API endpoints independently enforce authorization via `[Authorize(Roles)]` attributes. A user who somehow reaches a restricted page will still be blocked by the API.

---

## 10. Role Assignment Rules

- Roles are stored in `AspNetUserRoles` (ASP.NET Identity)
- Only **Admin** can assign or modify roles
- Roles are not mutually exclusive -- a user can hold any combination
- Common combinations:
  - Solo operator: Admin (single user has all access)
  - Shop supervisor: Manager + Engineer
  - Office admin: OfficeManager + PM
  - Floor worker: ProductionWorker (minimal access)
- The UI adapts: nav items, dashboard widgets, available actions, and form options all filter based on the user's role set
- Deactivated users retain their roles but cannot authenticate
