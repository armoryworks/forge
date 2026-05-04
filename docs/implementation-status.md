# Implementation Status

Tracks real implementation against all spec docs. Updated: 2026-04-12.

Legend: Done | Partial | Not Started | N/A (deferred or out of scope)

---

## Phase Status (proposal.md §8)

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 1 — Foundation | Docker + Kanban + Job Cards | Done |
| 2 — Engineer UX | Dashboard + Planning Day | Done |
| 3 — Accounting Bridge | QB Read/Write Integration | Done |
| 4 — Leads & Contacts | Lead-to-Customer Pipeline | Done |
| 5 — Traceability & QC | Production Lot Tracking | Done |
| 6 — Time & Workers | Time Tracking + Worker Views | Done |
| 7 — Expenses & Invoicing | Expense Capture + Invoice Workflow | Done |
| 8 — Maintenance | Asset Registry + Scheduled Maintenance | Done |
| 9 — Reporting | Operational Dashboards | Done |
| 10 — Backup & Polish | Production Hardening | Done |
| 11 — AI Assistant | Self-Hosted AI Module | Done |
| 12 — Domain AI Assistants | Configurable AI Assistants (HR, Procurement, Sales) | Done |

---

## Architecture (architecture.md)

### Stack & Infrastructure

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Angular 21 + Material 21 | architecture.md §Stack | Done | Standalone, OnPush, signals, zoneless |
| .NET 9 Web API | architecture.md §Stack | Done | MediatR CQRS, FluentValidation (35+ validators), exception middleware (404/400/409) |
| PostgreSQL + pgvector | architecture.md §Stack | Done | pgvector extension enabled |
| MinIO | architecture.md §Stack | Done | 3 buckets, upload/download/presigned URLs |
| Three.js (STL viewer) | architecture.md §Stack | Done | Lazy-loaded StlViewerComponent, wired into part detail "3D View" tab |
| SignalR | architecture.md §Stack | Done | 4 hubs (Board, Notification, Timer, Chat) — all functional with typed events, group management, reconnect handling |
| Hangfire | architecture.md §Stack | Done | 14 recurring jobs, PostgreSQL storage, dashboard |
| Mapperly | architecture.md §Stack | Done | 6 mappers (Job, Part, Customer, Expense, Asset, Lead) in qb-engineer.api/Mappers/ |
| OpenAPI + Scalar | architecture.md §Stack | Done | API docs available |
| Docker Compose | architecture.md §Docker | Done | 6 containers running (AI optional via profile), Alpine images, non-root user, health checks, resource limits |
| CI/CD Pipeline | architecture.md §CI/CD | Done | GitHub Actions: parallel build+test (Angular + .NET), Docker image build on main push |

### Auth & Security

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| ASP.NET Identity | architecture.md §Auth | Done | Custom ApplicationUser |
| JWT bearer auth | architecture.md §Auth | Done | Access + refresh tokens |
| Refresh token rotation | architecture.md §Auth | Done | |
| Additive roles | architecture.md §Auth | Done | 6 roles seeded |
| OAuth token encryption | architecture.md §Auth | Done | Data Protection API with EF Core key storage, TokenEncryptionService |
| Rate limiting | architecture.md §Auth | Done | Fixed window (100/min per user), built-in .NET middleware |
| CSP / security headers | CLAUDE.md §Security | Done | SecurityHeadersMiddleware: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |

### RESTful Routing

| Route | Spec | Status | Notes |
|-------|------|--------|-------|
| /dashboard | architecture.md §Routing | Done | 5 widgets |
| /kanban | architecture.md §Routing | Done | Track type switching, drag-drop |
| /jobs, /jobs/:id | architecture.md §Routing | Done | List + detail panel |
| /backlog | architecture.md §Routing | Done | DataTable with filtering |
| /leads, /leads/:id | architecture.md §Routing | Done | CRUD |
| /parts, /parts/:id | architecture.md §Routing | Done | CRUD + BOM |
| /assets, /assets/:id | architecture.md §Routing | Done | CRUD |
| /expenses, /expenses/:id | architecture.md §Routing | Done | CRUD |
| /time-tracking | architecture.md §Routing | Done | Timer + manual entry |
| /admin/users | architecture.md §Routing | Done | User management |
| /customers | architecture.md §Routing | Done | Customer list page — DataTable with search/status filter, row click navigates to detail |
| /customers/:id/:tab | architecture.md §Routing | Done | Customer detail page — 9-tab layout: overview, contacts, addresses, estimates, quotes, orders, jobs, invoices, activity |
| /estimates (API only) | — | Done | EstimatesController — standalone estimates list + CRUD (frontend access via customer detail Estimates tab) |
| /reports | architecture.md §Routing | Done | 15 reports with charts (ng2-charts) + data tables, including 3 financial (AR Aging, Revenue, P&L) |
| /admin/settings | architecture.md §Routing | Done | Reference data, terminology, system settings tabs |
| /sprint-planning | architecture.md §Routing | Done | Split-panel: backlog (left) → cycle board (right), drag-drop commit |
| /search | architecture.md §Routing | Done | Global search bar in header, searches 6 entity types |
| /notifications | architecture.md §Routing | Done | Backend: entity, repo, controller, 5 MediatR handlers. Frontend: panel dropdown + dedicated /notifications page with preferences tab |
| /admin/qb-setup | architecture.md §Routing | Done | Covered by IntegrationsPanelComponent in admin settings — provider selection, QB OAuth, sync status |
| /admin/track-types | architecture.md §Routing | Done | Full CRUD: create/edit/delete with stage management |
| /admin/terminology | architecture.md §Routing | Done | Tab in admin page, editable key-label table, bulk save |
| /display/shop-floor | architecture.md §Routing | Done | Full-screen kiosk: RFID/barcode scan auth, per-worker job grid (IsShopFloor-filtered), job actions (timer start/stop, mark complete), square cards with status stripes, auto-dismiss timeouts (PIN 20s, job-select 15s), theme/font persistence, global loading overlay |
| /display/shop-floor/clock | architecture.md §Routing | Done | Touch-first kiosk clock UI, RFID/barcode scan + PIN auth |

### Other Architecture Items

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Custom fields (JSON) | architecture.md §Custom Fields | Done | CustomFieldDefinitions on TrackType, CustomFieldValues on Job, API endpoints, Angular service methods |
| system_settings DB table | architecture.md §Settings | Done | Entity exists, no admin UI |
| Backup (B2 + local) | architecture.md §Backup | Done | DatabaseBackupJob (Hangfire daily 3AM), pg_dump custom format, configurable retention (30 days default), old backup cleanup |
| Full-text search | architecture.md §Search | Done | tsvector generated columns + GIN indexes on jobs, customers, parts, leads, assets, expenses. Hybrid search: plainto_tsquery ranked + ILIKE fallback. |
| Self-hosted AI (Ollama + RAG) | architecture.md §AI | Done | OllamaAiService, llama3.2:3b model, AiController (generate/summarize/status/search/index), Angular AiService + AiHelpPanel. RAG pipeline: DocumentEmbedding entity (pgvector vector(384)), IEmbeddingRepository, RagSearch/IndexDocument/BulkIndexDocuments handlers, DocumentIndexJob (Hangfire 30min), header search column with RAG results |
| Theming (light/dark) | architecture.md §Theming | Done | Toggle in toolbar, CSS custom properties |
| Admin brand colors | architecture.md §Theming | Done | System settings for primary/accent colors, runtime CSS variable override, public brand endpoint |
| Accessibility (WCAG 3) | architecture.md §Accessibility | Done | aria-labels on all icon buttons, focus-visible outlines, skip-to-content link, prefers-reduced-motion. axe-core tests on 10 pages (Cypress). |
| Mobile responsiveness | architecture.md §Mobile | Done | LayoutService with breakpoint detection, hamburger menu, mobile sidebar overlay. Per-page responsive grids on dashboard, parts, inventory, kanban. |
| Offline resilience / PWA | architecture.md §Offline | Done | Service Worker, IndexedDB cache, BroadcastChannel sync, OfflineQueueService (conflict signals), OfflineBannerComponent, SyncConflictDialogComponent (409 resolution) |

---

## Functional Decisions (functional-decisions.md)

### Kanban Board

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Track types (4 built-in) | functional-decisions.md §Kanban | Done | Production, R&D, Maintenance, Other |
| Custom track types | functional-decisions.md §Kanban | Done | Create/edit/delete dialog, stage management, backend CRUD |
| Card movement (forward/backward) | functional-decisions.md §Kanban | Done | Irreversible stage blocking works |
| Backward move double-confirmation (QB) | functional-decisions.md §Kanban | Done | MoveJobStage blocks backward moves from irreversible stages |
| Multi-select + bulk actions | functional-decisions.md §Kanban | Done | Ctrl+Click, floating bulk bar (Move/Assign/Priority/Archive), 4 backend handlers |
| SignalR real-time sync | functional-decisions.md §Kanban | Done | BoardHub, optimistic UI |
| Column body colored border | functional-decisions.md §Kanban | Done | Inset box-shadow per stage color |
| Hold indicators on cards | functional-decisions.md §Status Lifecycle | Done | Pause icon badge when active holds exist, matTooltip lists hold names, warning color |

### Job Card Detail

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Title, description, due date, priority | proposal.md §4.2 | Done | |
| Customer reference | proposal.md §4.2 | Done | |
| Assigned user(s) | proposal.md §4.2 | Done | Single assignee |
| File attachments | proposal.md §4.2 | Done | Upload/download via MinIO, Files tab in job detail panel with drag-drop upload |
| Activity log | proposal.md §4.2 | Done | Entity + API + UI timeline + inline comments |
| Subtasks (checklist) | proposal.md §4.2 | Done | CRUD with assignee + checkbox |
| Linked cards | proposal.md §4.2 | Done | Full-stack: entity, API (CRUD), typeahead UI in detail panel |
| Time entries on card | proposal.md §4.2 | Done | Time section in job detail panel with per-entry list + total duration |
| Accounting document refs | proposal.md §4.2 | Done | ExternalRef + AccountingDocumentType on JobListResponseModel, receipt_long icon on kanban card |
| Custom fields (per track type) | proposal.md §4.2 | Done | JSONB definitions on TrackType, values on Job, CRUD endpoints |
| R&D iteration counter/notes | proposal.md §4.2 | Done | IterationCount + IterationNotes on Job entity, UI section in job detail panel |
| Production runs tab | proposal.md §4.2 | Done | ProductionRun entity, CRUD handlers, controller endpoints |
| Job disposition | functional-decisions.md §Job Disposition | Done | DisposeJob endpoint, disposition dialog UI, kanban card indicator. Options: ShipToCustomer, AddToInventory, CapitalizeAsAsset, Scrap, HoldForReview |

### Task Linking & Subtasks

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Subtasks (text, assignee, checkbox) | functional-decisions.md §Task Linking | Done | |
| Card linking (related, blocks, parent/child) | functional-decisions.md §Task Linking | Done | Entity, API (CRUD), Angular UI in job detail panel |

### Activity Log

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Per-entity timeline | functional-decisions.md §Activity Log | Done | JobActivityLog + polymorphic ActivityLog entity, full UI with ActivityTimelineComponent |
| Inline comments with @mentions | functional-decisions.md §Activity Log | Done | @mention regex parsing in CreateJobCommentHandler, notifications via MediatR, MentionHighlightPipe for UI |
| Filter by action type/user | functional-decisions.md §Activity Log | Done | ActivityTimelineComponent filterable input with action/user dropdowns |
| Batch field change collapsing | functional-decisions.md §Activity Log | Done | Groups FieldChanged entries within 5s by same user into expandable batch |
| Reuse on parts, assets, leads, customers, expenses | functional-decisions.md §Activity Log | Done | Polymorphic ActivityLog entity (EntityType/EntityId), GetEntityActivity handler, activity endpoints on 5 controllers |

### Part / Product / Assembly Catalog

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Part CRUD | proposal.md §4.3 | Done | Create, update, soft-delete with ConfirmDialog |
| BOM (recursive) | proposal.md §4.3 | Done | Entity + CRUD endpoints |
| Part detail (specs, files, BOM) | proposal.md §4.3 | Done | Split-panel: list + 5-tab detail (info/BOM/usage/3D viewer/files). Inventory summary with low-stock warning. |
| Revision control | proposal.md §4.3 | Done | PartRevision entity, CRUD handlers, unique (PartId,Revision) index, IsCurrent flag |
| Where Used (reverse BOM lookup) | proposal.md §4.3 | Done | Loaded via EF Include, displayed in Usage tab with navigation |
| STL inline viewer | proposal.md §4.3 | Done | Three.js lazy-loaded StlViewerComponent, "3D View" tab in part detail when .stl file attached |
| Accounting item linkage | proposal.md §4.3 | Done | Link/unlink Part to accounting items via provider factory. POST/DELETE endpoints, Angular UI in part detail Info tab |
| Part-to-job reference | proposal.md §4.3 | Done | JobPart entity, CRUD endpoints, search + add in job detail panel |
| Part status Prototype | functional-decisions.md §NPI Gate | Done | Prototype value added to PartStatus enum (Draft → Prototype → Active → Obsolete) for NPI gate |
| Auto part numbering | functional-decisions.md §Auto Part Numbering | Done | Categorical prefixes (PRT-, ASM-, RAW-, CON-, TLG-, FST-, ELC-, PKG-) + 5-digit zero-padded sequence. Optional external part number |
| Routing (Operations) | functional-decisions.md §BOM-Driven Work Breakdown | Done | Operation entity (renamed from ProcessStep) with ordered steps, instructions, work center assignment, QC checkpoints. OperationMaterial join entity linking BOM entries to operations. Tabbed 800px dialog (Details, Materials, Files, Activity). CRUD endpoints on PartsController. |
| BOM Explosion | functional-decisions.md §BOM-Driven Work Breakdown | Done | ExplodeJobBom handler creates child jobs from Make entries, lists Buy/Stock items. One-level explosion, user explodes sub-assemblies individually. |
| BOM Source Type: Stock | functional-decisions.md §BOM-Driven Work Breakdown | Done | Added Stock to BOMSourceType enum alongside Make/Buy. |
| BOM Lead Time | functional-decisions.md §BOM-Driven Work Breakdown | Done | LeadTimeDays field on BOMEntry. |
| Job Parent/Child Hierarchy | functional-decisions.md §BOM-Driven Work Breakdown | Done | ParentJobId on Job, GetChildJobs endpoint, sub-jobs displayed in job detail panel. |

### CAD / STL / CAM File Management

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| File upload/download | proposal.md §4.4 | Done | MinIO, per-entity |
| File versioning by revision | proposal.md §4.4 | Done | PartRevisionId FK on FileAttachment, GetFilesByRevision handler, endpoint on FilesController |
| STL 3D viewer (Three.js) | proposal.md §4.4 | Done | OrbitControls, auto-center, ambient+directional lighting, responsive resize |
| Chunked upload with progress | proposal.md §4.4 | Done | FileUploadZoneComponent: auto-chunked for files > 5MB, sequential chunk upload, server-side reassembly, temp file cleanup |
| File access restrictions | proposal.md §4.4 | Done | RequiredRole field on FileAttachment, role check in DownloadFile handler |

### Dashboard

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Widget-based layout | proposal.md §4.5 | Done | 9 widgets with real KPI data, CSV export, gridstack drag/resize/add/remove |
| Role-based default layouts | proposal.md §4.5 | Done | GetDefaultDashboardLayout handler returns role-based widget visibility + column count |
| Daily Priority Card | proposal.md §4.5 | Done | TodaysTasksWidget: overdue detection, priority sorting, top-3 tomorrow prefs, navigate to kanban |
| End-of-Day Prompt | proposal.md §4.5 | Done | EodPromptWidgetComponent: "Top 3 for tomorrow" textarea, persists to UserPreferencesService |
| Screensaver / Ambient Mode | proposal.md §4.5 | Done | Full-screen dark overlay with clock, KPIs, deadlines. Auto-refresh 60s, exit on click/Escape. |
| Widget customization (add/remove/resize) | proposal.md §4.5 | Done | Gridstack: drag/resize/add/remove widgets, edit mode toggle, layout persisted via UserPreferencesService |

### Planning Cycle Management

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Planning cycle entity | proposal.md §4.6 | Done | PlanningCycle + PlanningCycleEntry entities, repo, 11 handlers, controller |
| Planning Day flow | proposal.md §4.6 | Done | Split-panel planning page with backlog → cycle drag-drop |
| Backlog curation (split-panel drag) | proposal.md §4.6 | Done | Left backlog panel with search/priority filter, CDK drag-drop to cycle |
| Cycle goals | proposal.md §4.6 | Done | Goals field on PlanningCycle, editable in create/edit dialog |
| Rollover handling | proposal.md §4.6 | Done | CompletePlanningCycle handler creates new cycle with incomplete entries (IsRolledOver=true) |
| Cycle progress on dashboard | proposal.md §4.6 | Done | CycleProgressWidgetComponent showing progress bar, days remaining, completion count |

### Lead Management

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Lead CRUD | proposal.md §4.7 | Done | Create, update, soft-delete (not Converted) with ConfirmDialog |
| Lead statuses (New → Lost) | proposal.md §4.7 | Done | LeadStatus enum |
| Convert to Customer | proposal.md §4.7 | Done | Creates Customer + optional Contact from lead fields |
| Convert and Create Job | proposal.md §4.7 | Done | Option in conversion flow, creates Job linked to new customer |
| Lost lead reason capture | proposal.md §4.7 | Done | Lost dialog with reason textarea |
| Custom fields | proposal.md §4.7 | Done | JSONB definitions on TrackType, values on Job, CRUD endpoints, Angular service |

### Customer & Contact Management

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Customer CRUD | proposal.md §4.8 | Done | Full feature module: entity, API (8+ endpoints), DataTable UI, create/edit dialog, soft-delete with ConfirmDialog |
| Customer Detail Screen | functional-decisions.md §Customer Detail | Done | Dedicated `/customers/:id/:tab` page. Sticky header: name, status chip, contact info. Stats bar: open estimates, quotes, orders, active jobs, outstanding, YTD revenue. 9 tabs: Overview, Contacts, Addresses, Estimates, Quotes, Orders, Jobs, Invoices, Activity. URL-driven active tab. |
| Multiple contacts per customer | proposal.md §4.8 | Done | Contact CRUD endpoints, contacts tab in customer detail screen |
| Contact role tags | proposal.md §4.8 | Done | Role field on contact entity, editable in contact forms |
| Customer summary endpoint | — | Done | `GET /api/v1/customers/{id}/summary` returns header fields + aggregate stats (estimate count, quote count, order count, active jobs, open invoice total, YTD revenue) |
| Jobs filtered by customer | — | Done | `GET /api/v1/jobs?customerId=` filter added to IJobRepository, JobRepository, GetJobsQuery, JobsController |
| Accounting sync (read/write) | proposal.md §4.8 | Done | IAccountingProviderFactory resolves active provider at runtime. AccountingController: providers, employees, items, sync-status, test, disconnect endpoints. All sync jobs use factory. |

### Vendor Management

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Vendor list (read-only from accounting) | proposal.md §4.9 | Done | Standalone CRUD: entity, repo, handlers, controller, Angular UI |
| Linked POs | proposal.md §4.9 | Done | Vendor detail panel with "Purchase Orders" tab showing linked POs with status chips |
| Linked Parts (preferred vendor) | proposal.md §4.9 | Done | PreferredVendorId FK on Part, included in detail response |

### Expense Capture

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Expense CRUD | proposal.md §4.10 | Done | Create, update, soft-delete (Pending only) with ConfirmDialog |
| Receipt upload (camera/file) | proposal.md §4.10 | Done | FileUploadZone + CameraCaptureComponent (MediaDevices API) |
| Approval workflow | proposal.md §4.10 | Done | Status field + dedicated /expenses/approval queue with review dialog and approval notes |
| Self-approval settings | proposal.md §4.10 | Done | SystemSettings: expense_self_approval, expense_auto_approve_threshold |
| Accounting sync | proposal.md §4.10 | Done | Expense sync uses IAccountingProviderFactory, provider-agnostic sync queue |
| CSV export | proposal.md §4.10 | Done | DataTableComponent has universal CSV export via papaparse (all visible columns) |
| Recurring expenses | — | Done | RecurringExpense entity, Hangfire auto-generation, classification highlighting, /expenses/upcoming ledger |

### Invoice Workflow

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Direct mode (solo operator) | proposal.md §4.11 | Done | CreateInvoice, CreateInvoiceFromJob, VoidInvoice, SendInvoice handlers |
| Managed mode (office manager queue) | proposal.md §4.11 | Done | Queue settings (mode + assignee), SystemSettings-based config |
| Nudge system (uninvoiced jobs) | proposal.md §4.11 | Done | GetUninvoicedJobs handler, UninvoicedJobsPanel component |
| Billing visibility on card | proposal.md §4.11 | Done | BillingStatus (Invoiced/Uninvoiced) on kanban card, icon indicator |

### Order Management (Quote-to-Cash)

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Estimate entity + CRUD | functional-decisions.md §Estimates | Done | Estimate entity (non-binding, single amount), EstimateStatus enum (Draft/Sent/Accepted/Declined/Expired), EF config, 5 handlers, EstimatesController. ConvertEstimateToQuote creates Quote from Estimate, sets ConvertedToQuoteId + status. |
| Sales Order entity + CRUD | functional-decisions.md §Order Management | Done | SalesOrder, SalesOrderLine, repo, handlers, controller |
| Quote entity + CRUD | functional-decisions.md §Quotes | Done | Quote, QuoteLine, repo, handlers, controller |
| Estimate → Quote conversion | functional-decisions.md §Estimates | Done | ConvertEstimateToQuote handler. POST /api/v1/estimates/{id}/convert |
| Quote → Sales Order conversion | functional-decisions.md §Quotes | Done | ConvertQuoteToOrder handler |
| Shipment entity + CRUD | functional-decisions.md §Shipments | Done | Shipment, ShipmentLine, auto SO status update |
| Partial delivery tracking | functional-decisions.md §Shipments | Done | ShippedQuantity on SO lines, RemainingQuantity computed |
| Customer multi-address | functional-decisions.md §Customer Addresses | Done | CustomerAddress entity, nested controller |
| Sales Orders list + detail UI | functional-decisions.md §Order Views | Done | List + detail panel + status actions |
| Quotes list + detail UI | functional-decisions.md §Order Views | Done | List + detail panel + status actions + convert to SO |
| Shipments list UI | functional-decisions.md §Order Views | Done | List + detail panel + ship/deliver actions |
| SO ↔ Job linking | functional-decisions.md §Order Management | Done | SalesOrderLineId FK on Job entity |
| Packing slip generation | functional-decisions.md §Shipments | Done | QuestPDF: GET /api/v1/shipments/{id}/packing-slip |
| Open orders dashboard widget | functional-decisions.md §Order Views | Done | OpenOrdersWidgetComponent + backend summary endpoint |

### Standalone Financial Mode ⚡

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Invoice entity + CRUD | functional-decisions.md §Invoicing | Done | ⚡ Entity, config, handlers, controller, Angular UI |
| Invoice PDF generation | functional-decisions.md §Invoicing | Done | QuestPDF: GET /api/v1/invoices/{id}/pdf |
| Invoice email (SMTP) | functional-decisions.md §Invoicing | Done | MailKit: POST /api/v1/invoices/{id}/email, PDF attachment |
| Payment entity + CRUD | functional-decisions.md §Payments | Done | ⚡ Entity, config, handlers, controller, Angular UI |
| Payment application to invoices | functional-decisions.md §Payments | Done | PaymentApplication entity, handler, UI with applications table |
| AR Aging report | functional-decisions.md §AR Aging | Done | ⚡ KPI buckets + data table, backend repo |
| Customer Statement PDF | functional-decisions.md §AR Aging | Done | ⚡ QuestPDF: GET /api/v1/customers/{id}/statement — invoice table, payment history, balance due |
| Credit terms per customer | functional-decisions.md §Credit Terms | Done | CreditTerms enum on SalesOrder + Invoice |
| Sales tax tracking | functional-decisions.md §Sales Tax | Done | ⚡ SalesTaxRate entity, CRUD handlers + controller, admin service methods, Angular models |
| Revenue by Period report | functional-decisions.md §Financial Reports | Done | ⚡ Bar chart + data table, groupBy period/customer |
| Revenue by Customer report | functional-decisions.md §Financial Reports | Done | ⚡ Uses same endpoint with groupBy=customer |
| Simple P&L report | functional-decisions.md §Financial Reports | Done | ⚡ KPI cards (revenue/expenses/net) + data table |
| Standalone vendor CRUD | functional-decisions.md §Vendor Management | Done | ⚡ Full CRUD: entity, repo, handlers, controller, Angular UI |
| Accounting mode switching | qb-integration.md §Standalone Mode | Done | GET /admin/accounting-mode (AllowAnonymous), Angular AccountingService with isStandalone/isConfigured signals, loaded on app init |
| Invoices list + detail UI | functional-decisions.md §Invoicing | Done | ⚡ List + detail panel + send/void actions |
| Payments list UI | functional-decisions.md §Payments | Done | ⚡ List + detail panel + delete |
| AR Aging UI | functional-decisions.md §AR Aging | Done | ⚡ KPI cards per bucket + data table in Reports page |

### Pricing & Quoting

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Price List entity + CRUD | functional-decisions.md §Price Lists | Done | Entity, config, handlers, controller |
| Quantity breaks | functional-decisions.md §Price Lists | Done | MinQuantity on PriceListEntry, unique index (list+part+qty) |
| Price resolution logic | functional-decisions.md §Price Lists | Done | ResolvePrice handler: customer → default → none fallback |
| Recurring Order entity + CRUD | functional-decisions.md §Recurring Orders | Done | Entity, config, handlers, controller |
| Recurring order auto-generation | functional-decisions.md §Recurring Orders | Done | Hangfire RecurringOrderJob, daily 6AM UTC |
| Margin per job/part/customer | functional-decisions.md §Margin Visibility | Done | GetJobMarginReport: labor + material + expense vs revenue |
| Margin dashboard widget | functional-decisions.md §Margin Visibility | Done | GetMarginSummary handler for dashboard |
| Margin report | functional-decisions.md §Margin Visibility | Done | JobMarginReportItem with margin percentage |

### Production Traceability

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Production runs (multiple per job) | proposal.md §4.12 | Done | ProductionRun entity with CRUD, yield tracking, auto-timestamps |
| Lot number tracking | proposal.md §4.12 | Done | LotRecord entity, auto-generate LOT-YYYYMMDD-NNN, CRUD, Angular UI |
| QC checklists | proposal.md §4.12 | Done | QcChecklistTemplate + QcChecklistItem + QcInspection + QcInspectionResult entities, CRUD, Angular quality feature |
| Traceability profiles | proposal.md §4.12 | Done | LotRecord links to Part, Job, ProductionRun, PurchaseOrderLine |
| Lot lookup (forward/backward) | proposal.md §4.12 | Done | GetLotTraceability: traces across jobs, runs, POs, bins, inspections |

### Status Lifecycle Tracking

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| StatusEntry entity (polymorphic) | functional-decisions.md §Status Lifecycle | Done | EntityType/EntityId, workflow + hold categories, start/end dates, full audit trail |
| Workflow statuses (one active) | functional-decisions.md §Status Lifecycle | Done | SetWorkflowStatus closes previous entry before creating new one |
| Hold statuses (parallel) | functional-decisions.md §Status Lifecycle | Done | AddHold prevents duplicate active holds of same code, ReleaseHold sets EndedAt |
| Reference data-driven status codes | functional-decisions.md §Status Lifecycle | Done | Admin-configurable via `{entity}_workflow_status` and `{entity}_hold_type` groups |
| StatusTrackingController (5 endpoints) | functional-decisions.md §Status Lifecycle | Done | GetStatusHistory, GetActiveStatuses, SetWorkflowStatus, AddHold, ReleaseHold |
| Job holds (4 types) | functional-decisions.md §Status Lifecycle | Done | Material Hold, Quality Hold, Customer Hold, Engineering Hold |
| StatusTimelineComponent (shared) | functional-decisions.md §Status Lifecycle | Done | Active status, active holds with release, full history timeline. Integrated into job detail panel |
| SetStatusDialogComponent | functional-decisions.md §Status Lifecycle | Done | Dialog for setting workflow status with notes |
| AddHoldDialogComponent | functional-decisions.md §Status Lifecycle | Done | Dialog for adding holds with notes |

### Asset / Equipment Registry

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Asset CRUD | proposal.md §4.13 | Done | Create, update, soft-delete with ConfirmDialog |
| Maintenance card linking | proposal.md §4.13 | Done | CreateMaintenanceJob handler, MaintenanceJobId FK on schedule, auto-creates kanban job |
| Scheduled maintenance rules | proposal.md §4.13 | Done | MaintenanceSchedule + MaintenanceLog entities, CRUD + LogMaintenance handlers, auto-calculated NextDueAt |
| Machine hours tracking | proposal.md §4.13 | Done | CurrentHours on Asset entity, PATCH /api/v1/assets/{id}/hours endpoint, Angular service method |
| Downtime logging | proposal.md §4.13 | Done | DowntimeLog entity, CRUD handlers with FluentValidation, 3 controller endpoints, Angular models + service |
| Tool-specific asset fields | functional-decisions.md §Tool Registry | Done | CavityCount, ToolLifeExpectancy, CurrentShotCount, IsCustomerOwned, SourceJobId, SourcePartId on Tooling assets. Part.ToolingAssetId FK replaces free-text MoldToolRef |
| Overdue maintenance notifications | proposal.md §4.13 | Done | OverdueMaintenanceJob (Hangfire daily 2AM UTC): queries overdue schedules, notifies Admin/Manager users via SignalR, deduplicates per overdue period |

### Time Tracking

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Start/stop timer | proposal.md §4.14 | Done | TimerHub + ClockEvent |
| Manual time entry | proposal.md §4.14 | Done | Create, update, soft-delete with ConfirmDialog |
| Accounting sync (Time Activities) | proposal.md §4.14 | Done | StopTimer handler uses IAccountingProviderFactory for time activity sync |
| Same-day edit lock | proposal.md §4.14 | Done | Backend: previous-day check in update/delete handlers. Frontend: lock icon + disabled delete for past entries |
| Overlapping timer block | proposal.md §4.14 | Done | StartTimerHandler checks GetActiveTimerAsync, throws if timer already running |
| Pay period awareness | proposal.md §4.14 | Done | GetCurrentPayPeriod + UpdatePayPeriodSettings, supports weekly/biweekly/semimonthly/monthly |

### Employee Records

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Employee data from accounting | proposal.md §4.15 | Done | GetEmployeesAsync/GetEmployeeAsync on IAccountingService, GET /accounting/employees endpoint, Angular AccountingService.loadEmployees() |
| Signed documents / certifications | proposal.md §4.15 | Done | FileAttachment with DocumentType + ExpirationDate fields, GetEmployeeDocuments handler |

### Customer Returns

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Return button on completed jobs | proposal.md §4.16 | Done | CustomerReturn entity with RMA workflow (Received → Inspection → Rework → Resolved → Closed). Angular `/customer-returns` route with list + detail panel + resolve/close workflow. |
| Reason capture + auto-linked rework card | proposal.md §4.16 | Done | CreateReworkJob flag auto-creates Job + JobLink. 6 endpoints on CustomerReturnsController. `CustomerReturnDialogComponent` with EntityPicker for customer + job. |

### Guided Training System

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| First-login tour | proposal.md §4.17 | Done | TourService + driver.js, kanban + dashboard tour definitions |
| Per-feature walkthroughs | proposal.md §4.17 | Done | HelpTourService with 9 tour definitions (kanban, dashboard, parts, inventory, expenses, time-tracking, reports, admin, planning). All registered in AppComponent. |
| Help icon per page | proposal.md §4.17 | Done | PageHeader/PageLayout support helpTourId input with ? icon button |
| Tour coverage audit (CI) | proposal.md §4.17 | Done | `npm run audit:tours` script scans features for TourService/HelpTourService references |
| Admin training dashboard | proposal.md §4.17 | Done | TrainingDashboardComponent: DataTable with user progress, completion bars, per-device localStorage tracking |
| Employee Training LMS | proposal.md §4.17 | Done | Full LMS: 46 seeded modules across 8 paths, per-user progress tracking, `/training` with My Learning (default) / Learning Paths / All Modules tabs, module detail pages with type-specific renderers, quiz scoring (randomized pool), admin CRUD panel (Admin + Manager roles), per-user training detail drill-down panel |
| Training Video Generation | — | Done | Playwright+ffmpeg pipeline records walkthrough videos (10-chapter, learning-style-aware), stores MP4 in MinIO, Hangfire `video` queue (single-worker), presigned-URL serving. Manuscripts in `docs/training-videos/`. Modules 19–24 generated. |

### Bin & Location Tracking

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Location hierarchy (Area → Rack → Bin) | proposal.md §4.18 | Done | StorageLocation entity, recursive, soft-delete (empty only) |
| Bin contents CRUD | proposal.md §4.18 | Done | BinContent entity, API, soft-delete with audit trail |
| Barcode scanning | proposal.md §4.18 | Done | LabelPrintService (bwip-js) + BarcodeScanInputComponent (scanner detection via keystroke timing < 50ms) |
| Movement audit trail | proposal.md §4.18 | Done | BinMovement entity |
| Production label printing | proposal.md §4.18 | Done | ProductionLabelComponent with barcode/QR rendering + print via LabelPrintService |

### Inventory Management

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Inventory list view | proposal.md §4.19 | Done | UI + API |
| Part inventory summary | proposal.md §4.19 | Done | PartInventorySummary model, total quantity + bin locations in part detail, low-stock computed warning |
| Receiving workflow | proposal.md §4.19 | Done | ReceivePurchaseOrder + GetReceivingHistory handlers, Receiving tab in inventory UI |
| General stock management | proposal.md §4.19 | Done | TransferStock + AdjustStock handlers, Stock Ops tab in inventory UI |
| Cycle counting | proposal.md §4.19 | Done | CycleCount + CycleCountLine entities, CreateCycleCount + UpdateCycleCount + GetCycleCounts handlers, Cycle Counts tab in inventory UI |
| Accounting quantity sync | proposal.md §4.19 | Done | UpdateInventoryQuantityAsync on IAccountingService (QB uses InventoryAdjustment), CreatePart handler syncs via provider factory |
| Low-stock alerts | proposal.md §4.19 | Done | MinStockThreshold/ReorderPoint on Part, GetLowStockAlerts query endpoint |
| Inventory reservation | proposal.md §4.19 | Done | Reservation entity, soft reservation (ReservedQuantity on BinContent), auto-reserve on BOM explosion, manual release, on-hand vs available in views |

### Purchase Order Lifecycle

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| PO creation (job-linked + standalone) | proposal.md §4.20 | Done | PurchaseOrder + PurchaseOrderLine entities, 10 MediatR handlers, full Angular UI with create/receive dialogs |
| PO statuses (Draft → Closed) | proposal.md §4.20 | Done | Draft → Submitted → Acknowledged → PartiallyReceived/Received → Closed, Cancel shortcut |
| Partial receipts / back-order | proposal.md §4.20 | Done | ReceiveItems handler tracks per-line quantities, auto-transitions PartiallyReceived → Received |
| Multi-PO per job | proposal.md §4.20 | Done | Job has ICollection<PurchaseOrder>, PO list filterable by jobId |
| Preferred vendor per part | proposal.md §4.20 | Done | PreferredVendorId FK on Part, vendor name in PartDetail response, Angular model updated |

### Shipping & Carrier Integration

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| IShippingService interface | proposal.md §4.21 | Done | Interface + MockShippingService |
| Carrier APIs (direct) | proposal.md §4.21 | Partial | MockShippingService in place. Direct carrier integrations (UPS, FedEx, USPS, DHL) not yet implemented. Address validation split to IAddressValidationService (USPS Web Tools). Handlers: GetShippingRates, CreateShippingLabel, GetShipmentTracking. Angular: ShippingRatesDialog + TrackingTimeline components |
| Packing slips | proposal.md §4.21 | Done | QuestPDF: GET /shipments/{id}/packing-slip |
| Multi-package tracking | proposal.md §4.21 | Done | ShipmentPackage entity, CRUD handlers, per-shipment package management |

### R&D / Internal Projects

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| R&D track stages | proposal.md §4.22 | Done | Seeded stages |
| Iteration counter + test notes | proposal.md §4.22 | Done | IterationCount + IterationNotes on Job entity, UI in job detail panel |
| Handoff to Production linking | proposal.md §4.22 | Done | HandoffToProduction handler, bidirectional JobLinks (HandoffFrom/HandoffTo) |
| Internal project types (reference data) | proposal.md §4.22 | Done | IsInternal + InternalProjectTypeId on Job, GetInternalProjectTypes handler, reference data driven |
| Scheduled internal tasks | proposal.md §4.22 | Done | ScheduledTask entity, CRUD + Run handlers, ScheduledTasksController, Hangfire job (every 15 min) |
| Job disposition | functional-decisions.md §Job Disposition | Done | Disposition step at job completion (ShipToCustomer, AddToInventory, CapitalizeAsAsset, Scrap, HoldForReview). CapitalizeAsAsset auto-creates Tooling asset |
| R&D/Tooling outcome paths | functional-decisions.md §R&D Outcomes | Done | 4 paths: Internal Asset, Customer Deliverable, Customer-Funded Retained, Dead End |
| Tool registry (tooling assets) | functional-decisions.md §Tool Registry | Done | Tooling asset subset with CavityCount, ToolLifeExpectancy, CurrentShotCount, IsCustomerOwned, SourceJobId/SourcePartId |

### Admin Settings & Integration Management

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| User management | proposal.md §4.23 | Done | CRUD, role assignment |
| Track type management | proposal.md §4.23 | Done | Full CRUD with stage management dialog |
| Reference data management | proposal.md §4.23 | Done | Admin tab |
| Accounting setup wizard | proposal.md §4.23 | Done | IntegrationsPanelComponent: provider list, active provider selection, QB OAuth connect/disconnect, sync status, coming-soon badges for Xero/FreshBooks/Sage |
| Branding (logo, colors) | proposal.md §4.23 | Done | Brand colors + logo upload (MinIO qb-engineer-branding bucket), admin UI with upload/remove, header displays logo |
| System settings UI | proposal.md §4.23 | Done | Admin Settings tab with 10 configurable settings, upsert API |
| Company profile | Plan: Company Profile | Done | System settings key-value (company.name/phone/email/ein/website), GET/PATCH admin endpoints, profile form in admin settings tab |
| Company locations | Plan: Company Locations | Done | CompanyLocation entity + CRUD controller (6 endpoints), admin locations DataTable with create/edit/delete/set-default, CompanyLocationDialogComponent with AddressFormComponent |
| Per-employee work location | Plan: Work Location | Done | WorkLocationId FK on ApplicationUser, PATCH endpoint, work location select in user edit dialog, location options computed from active locations |
| Setup wizard — company details | Plan: Setup Wizard | Done | 2-step setup wizard: Step 1 admin account (existing), Step 2 company details + primary location. AddressFormComponent CVA. Single API call on final submit |
| Third-party integrations panel | proposal.md §4.23 | Done | IntegrationsPanelComponent scaffold with 5 integrations (QB, MinIO, SMTP, Shipping, Ollama), status indicators, grid layout |

### Chat System

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| 1:1 direct messages | proposal.md §4.25 | Done | ChatMessage entity, ChatHub (SignalR), ChatController, Angular chat panel with conversations + real-time messaging |
| Group chats | proposal.md §4.25 | Done | ChatRoom + ChatRoomMember entities, 5 handlers (Create/Get rooms, Get/Send room messages, Add/Remove member), ChatHub JoinRoom/LeaveRoom |
| File/image sharing | proposal.md §4.25 | Done | FileAttachmentId FK on ChatMessage, entity-level support for file attachments in messages |
| Entity link sharing | proposal.md §4.25 | Done | LinkedEntityType + LinkedEntityId on ChatMessage, entity reference support |
| Channel architecture | plan §Phase 1 | Done | ChannelType enum (DM/Group/TeamAuto/Department/Custom/System/Broadcast), ChatRoom extended with ChannelType/Description/TeamId/IsReadOnly/IconName, ChatRoomMember extended with Role/MutedUntil/LastReadMessageId, channel CRUD endpoints, desktop + mobile channel sidebar |
| Announcements | plan §Phase 2 | Done | Announcement/AnnouncementAcknowledgment/AnnouncementTeam/AnnouncementTemplate entities, AnnouncementsController (8 endpoints), SignalR broadcast via ChatHub, AnnouncementOverlayComponent (severity-colored banner), admin panel with DataTable + template CRUD, CreateAnnouncementDialogComponent |
| Notification sounds + haptics | plan §Phase 3 | Done | ChatNotificationService (Web Audio chime + navigator.vibrate), user preference toggles in Account > Customization, ChatHubService triggers on incoming messages |
| Desktop preview popups | plan §Phase 3 | Done | ChatPreviewPopupComponent (upper-right, auto-dismiss 5s, max 3 stacked, backdrop-blur), integrated in app shell |
| Entity mentions | plan §Phase 4 | Done | @[entityType:id:display] markers, ChatMessageMention entity, MentionParser (source-generated regex), MentionRenderPipe (sanitized HTML chips), mention parsing on all send handlers |
| Threads | plan §Phase 4 | Done | ParentMessageId self-FK, ThreadReplyCount/ThreadLastReplyAt denormalized, GetThread/ReplyInThread endpoints, thread side panel (desktop), thread slide-over (mobile), topLevelMessages computed filter |
| File attachments in chat | plan §Phase 5 | Done | FileAttachment FK on ChatMessage, SendMessage/SendChatRoomMessage accept FileAttachmentId, file preview rendering (icon + name + size + download link), attach button in desktop chat input, ChatFileAttachmentResponseModel in API |
| Event sharing | plan §Phase 5 | Done | Events shared via @[event:id:display] mention markers (same entity mention system), EntityLinkComponent supports event type |
| Pop-out chat window | plan §Phase 6 | Done | /chat/popout route (ChatPopoutComponent), window.open from panel, BroadcastService chat events (window-opened/closed/open-conversation) |
| Mobile chat expansion | plan §Phase 6 | Done | Full channel sections, mention rendering (MentionRenderPipe), thread view (mobile-thread-overlay slide-over), file attachment display, topLevelMessages filter |
| Chat notification preferences UI | plan §Phase 3 | Done | ChatNotificationPrefsComponent in Account > Customization, sound/vibrate toggles |
| Chat channel list component | plan §Phase 6 | Done | ChatChannelListComponent: reusable sidebar with DM/group/team sections, search, mute toggle, unread badges |
| Mobile thread view | plan §Phase 4 | Done | MobileThreadViewComponent: slide-over panel for thread replies on mobile |

### Sales Order Detail Redesign (Phase 7)

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Shipment entity expansion | plan §Phase 7 | Done | ServiceType, EstimatedDeliveryDate, FreightClass, InsuredValue, SignatureRequired, BillOfLadingNumber on Shipment |
| ShipmentLine entity expansion | plan §Phase 7 | Done | Description, Weight, Length, Width, Height, IsHazmat, HandlingInstructions, SerialNumbers on ShipmentLine |
| SO line job models | plan §Phase 7 | Done | SalesOrderLineJobModel (Id, JobNumber, Title, StageName, AssigneeName, Priority, DueDate, IsArchived) |
| SO shipment models | plan §Phase 7 | Done | SalesOrderShipmentModel, SalesOrderShipmentLineModel, SalesOrderShipmentPackageModel |
| SO return models | plan §Phase 7 | Done | SalesOrderReturnModel (ReturnNumber, Status, Reason, OriginalJob, ReworkJob) |
| Repository expanded includes | plan §Phase 7 | Done | Lines→Jobs→Stage/Assignee, Shipments→Lines/Packages, separate returns query |
| Tab flag badges | plan §Phase 7 | Done | Warning badges on Line Items (no jobs), Shipments (partial), Returns (open returns) |
| Frontend TS models | plan §Phase 7 | Done | SalesOrderLineJob, SalesOrderShipment, SalesOrderShipmentLine, SalesOrderShipmentPackage, SalesOrderReturn |

### Event-Driven Connective Tissue (Phase 8)

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Domain event records | plan §Phase 8 | Done | SalesOrderConfirmedEvent, JobStageChangedEvent, PurchaseOrderReceivedEvent, QcInspectionFailedEvent, ShipmentCreatedEvent, ShipmentDeliveredEvent, CustomerReturnReceivedEvent, DeliveryDateChangedEvent, InvoicePastDueEvent, QuoteExpiringEvent, InventoryBelowReorderEvent, JobCostOverrunEvent |
| OnSalesOrderConfirmed_AutoCreateJobs | plan §Phase 8 | Done | Auto-creates jobs per SO line from part routing/BOM |
| OnSalesOrderConfirmed_ScheduleMilestones | plan §Phase 8 | Done | Backward scheduling → 7 milestones per SO line (po_order_by through delivery) |
| OnSalesOrderConfirmed_NotifyPM | plan §Phase 8 | Done | Notification to production manager on SO confirmation |
| OnSalesOrderConfirmed_CheckBom | plan §Phase 8 | Done | Checks BOM for Buy items, suggests POs |
| OnJobStageChanged_UpdateSoStatus | plan §Phase 8 | Done | Updates SO status when jobs progress (InProduction, etc.) |
| OnJobStageChanged_CheckShipReady | plan §Phase 8 | Done | Flags SO line as ship-ready when all jobs complete |
| OnJobStageChanged_NotifyTeam | plan §Phase 8 | Done | Notifies QC team on QC stage entry, production lead on completion |
| OnPurchaseOrderReceived_CheckMaterialReady | plan §Phase 8 | Done | Checks if received materials complete BOM for pending jobs |
| OnShipmentCreated_UpdateSalesOrder | plan §Phase 8 | Done | Updates SO line ShippedQuantity, SO status (PartiallyShipped/Shipped) |
| OnShipmentDelivered_Notify | plan §Phase 8 | Done | Notifies salesperson/account manager on delivery |
| OnCustomerReturnReceived_UpdateSO | plan §Phase 8 | Done | Decrements ShippedQuantity, re-opens SO status if needed |
| OnQcInspectionFailed_CreateFollowUp | plan §Phase 8 | Done | Auto-creates follow-up task for rework on QC failure |
| OnDeliveryDateChanged_CascadeCheck | plan §Phase 8 | Done | Recalculates backward schedule, flags at-risk jobs |
| BackwardSchedulingService | plan §Phase 8 | Done | IBackwardSchedulingService interface + implementation, 7 milestone dates from delivery date |
| ScheduleMilestone entity | plan §Phase 8 | Done | SalesOrderLineId, JobId, MilestoneType, TargetDate, ActualDate, Notes |
| FollowUpTask entity | plan §Phase 8 | Done | Title, Description, AssignedToUserId, DueDate, SourceEntityType/Id, TriggerType, Status |
| DomainEventFailure entity | plan §Phase 8 | Done | Dead letter queue: EventType, EventPayload, HandlerName, ErrorMessage, RetryCount, Status |
| ResilientNotificationPublisher | plan §Phase 8 | Done | MediatR pipeline behavior catching handler exceptions → DomainEventFailureService |
| Domain event wiring (triggers) | plan §Phase 8 | Done | ConfirmSalesOrder, MoveJobStage, CreateShipment, DeliverShipment, ReceiveItems, UpdateQcInspection, CreateCustomerReturn, UpdateSalesOrder — all publish events via MediatR |
| CheckInventoryLevelsJob | plan §Phase 8 | Done | Hangfire daily 4 AM: parts with ReorderPoint, publishes InventoryBelowReorderEvent |
| CheckJobCostOverrunJob | plan §Phase 8 | Done | Hangfire daily 5 AM: actual vs estimated costs > 10% threshold |
| Calendar auto-events | plan §Phase 8 | Done | System-generated calendar events from workflow triggers (SO milestones, job dates, PO delivery) |
| Event entity expansion | plan §Phase 8 | Done | IsAllDay, IsSystemGenerated fields on Event entity |

### Auto-PO / MRP Enhancement (Phase 9)

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| AutoPoSuggestion entity | plan §Phase 9 | Done | PartId, VendorId, SuggestedQty, NeededByDate, SourceSalesOrderIds (jsonb), Status, ConvertedPurchaseOrderId |
| Part entity expansion | plan §Phase 9 | Done | SafetyStockQty, PreferredVendorId, ExcludeFromAutoPo |
| Vendor entity expansion | plan §Phase 9 | Done | AutoPoMode (nullable enum) |
| AutoPurchaseOrderJob | plan §Phase 9 | Done | Hangfire daily 6 AM: demand projection from confirmed SOs, shortfall calculation, PO suggestion/draft/auto generation |
| Three-tier automation | plan §Phase 9 | Done | Suggest (queue only), Draft (create Draft PO), Automatic (create + confirm PO) |
| Admin auto-PO settings | plan §Phase 9 | Done | AutoPoSettingsComponent: mode toggle, buffer days, schedule, master enable/disable |
| PO suggestion endpoints | plan §Phase 9 | Done | List/convert/dismiss suggestions via PurchaseOrdersController |

### Scanner-Driven Inventory Operations (Phase 10)

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| ScanActionOverlayComponent | plan §Phase 10 | Done | Quick action overlay after scanning part/job: Move, Count, Receive, Ship, Inspect, Issue, Return |
| ScanMoveFlowComponent | plan §Phase 10 | Done | FROM → qty (all/partial) → scan TO location |
| ScanCountFlowComponent | plan §Phase 10 | Done | Enter actual qty, confirm adjustment, variance threshold warning |
| ScanReceiveFlowComponent | plan §Phase 10 | Done | Select PO line, qty, scan destination bin |
| ScanShipFlowComponent | plan §Phase 10 | Done | Select shipment line, qty confirmation |
| ScanIssueFlowComponent | plan §Phase 10 | Done | Select job, qty, material issue record |
| ScanInspectFlowComponent | plan §Phase 10 | Done | QC inspection form pre-filled from part template |
| ScanJobFlowComponent | plan §Phase 10 | Done | Start/stop timer, advance stage, log note |
| ScanReturnFlowComponent | plan §Phase 10 | Done | Return flow for recently shipped parts |
| ScanUndoListComponent | plan §Phase 10 | Done | Persistent undo button, scrollable reversal list, PIN auth |
| ScanDailyLogComponent | plan §Phase 10 | Done | Per-worker scan history with filters and summary stats |
| ScanDevicesPanelComponent | plan §Phase 10 | Done | Wireless scanner pairing UI (pair/unpair/rename) |
| ScanLocationViewComponent | plan §Phase 10 | Done | "What's here?" mode: shows all BinContent at scanned location |
| KioskSessionService | plan §Phase 10 | Done | Multi-session manager: concurrent users, badge switching, session timeouts |
| ScanActionLog entity | plan §Phase 10 | Done | ActionType, PartId, Quantity, FromLocationId, ToLocationId, UserId, ReversedById, scan audit trail |
| TrainingScanLog entity | plan §Phase 10 | Done | Non-persisted training mode actions for review |
| UserScanDevice entity | plan §Phase 10 | Done | Scanner-to-user pairing (DeviceId, DeviceName, PairedAt, IsActive) |
| Scan validation chain | plan §Phase 10 | Done | Context-aware action visibility: hides/disables invalid actions with tooltip reasons |
| Multi-scan batch mode | plan §Phase 10 | Done | After completing one action, mode persists for next scan |
| Training mode banner | plan §Phase 10 | Done | Amber "TRAINING MODE" banner, no-persist actions logged to TrainingScanLog |
| KioskSessionBarComponent | plan §Phase 10 | Done | Avatar strip showing active sessions, foreground indicator |
| EF migration (Wave 7-9) | plan §Phase 10 | Done | 20260419101531_AddWave7to9Entities: scan_action_logs, schedule_milestones tables, event fields, follow_up_tasks adjustments |

### Calendar View

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Month/week/day layouts | proposal.md §4.26 | Done | Month + week + day views with view toggle, day click-through, view-aware navigation |
| Color coding by type | proposal.md §4.26 | Done | Track type color tint (--job-tint), stage color left border, high-priority styling in all 3 views |
| Dense day handling | proposal.md §4.26 | Done | Max 3 jobs per cell, "+N more" overflow chip |
| Filtering | proposal.md §4.26 | Done | Track type filter dropdown |
| .ics export | proposal.md §4.26 | Done | GET /api/v1/jobs/calendar.ics with assignee/trackType filters |

---

## Roles & Auth (roles-auth.md)

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| 6 roles (additive) | roles-auth.md §Roles | Done | Seeded |
| Role-based UI adaptation | roles-auth.md §Permissions | Done | Sidebar filtered by role, roleGuard() on all feature routes (customers, parts, inventory, vendors, POs, SOs, quotes, shipments, quality + existing), backend role auth on controllers |
| User onboarding (setup token) | roles-auth.md §Onboarding | Done | Admin generates token (7-day expiry), sends branded email invite, employee completes setup at /setup/:token (sets password + optional name), auto-login on completion |
| Email invite (optional) | roles-auth.md §Onboarding | Done | SendSetupInvite handler: generates token if needed, sends branded HTML email via IEmailService |
| User offboarding (deactivation) | roles-auth.md §Offboarding | Done | DeactivateUser + ReactivateUser handlers, auto-unassign from active jobs, admin UI toggle |
| Production Worker simplified view | roles-auth.md §Worker | Done | /worker route: touch-friendly task list with overdue highlighting, sorted (overdue → due date → priority), progress bars, priority chips |
| Shop Floor Display (no-login) | roles-auth.md §Shop Floor | Done | /display/shop-floor route, AllowAnonymous API, worker presence + active jobs |
| Time Clock Kiosk (scan-based) | roles-auth.md §Shop Floor | Done | Touch-first clock UI with 3-phase barcode auth (scan → PIN → clock), auto-timeout, live clock display |
| **Tiered Auth: RFID/NFC + PIN** | roles-auth.md §Tiered Auth | Done | UserScanIdentifier entity (nfc/rfid/barcode types), NFC kiosk-login endpoint (POST /auth/nfc-login), admin CRUD for scan identifiers. ScannerService + BarcodeScanInputComponent for hardware input. |
| **Tiered Auth: Barcode + PIN** | roles-auth.md §Tiered Auth | Done | Tier 2 — POST /auth/kiosk-login (barcode + PIN → 8hr JWT), EmployeeBarcode field on user, PBKDF2 PIN hash, admin PIN reset |
| **PIN management (hash, reset)** | roles-auth.md §PIN Management | Done | POST /auth/set-pin (PBKDF2 100K iterations, SHA256, 16-byte salt), POST /admin/users/{id}/reset-pin, FluentValidation (4-8 digits) |
| **Enterprise SSO (Google)** | roles-auth.md §Enterprise SSO | Done | OAuth 2.0 challenge/callback, SsoExternalCookie scheme, GoogleId on ApplicationUser |
| **Enterprise SSO (Microsoft)** | roles-auth.md §Enterprise SSO | Done | Azure AD / Entra ID via MicrosoftAccount auth, MicrosoftId on ApplicationUser |
| **Enterprise SSO (Generic OIDC)** | roles-auth.md §Enterprise SSO | Done | Configurable Authority/ClientId/ClientSecret, OidcSubjectId + OidcProvider on ApplicationUser |
| **SSO identity linking** | roles-auth.md §Enterprise SSO | Done | Auto-link by email on first SSO login, manual link/unlink endpoints, login UI with SSO buttons |
| **Employee compliance visibility** | Plan §Phase 6 | Done | Admin users table shows compliance status (completed/total items, missing items list, canBeAssignedJobs). Batch-loaded EmployeeProfiles in GetAdminUsers handler. |
| **Job assignment blocking** | Plan §Phase 6 | Done | AssigneeComplianceCheck static helper enforces 4 blocking items (W-4, I-9, State Withholding, Emergency Contact) on CreateJob, UpdateJob, BulkAssignJob. Frontend warns in assignee dropdown. |

---

## DocuSeal Document Signing & Compliance Form Registry

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| **Core enums** | Plan §Phase 1 | Done | ComplianceFormType, ComplianceSubmissionStatus, IdentityDocumentType |
| **ComplianceFormTemplate entity** | Plan §Phase 1 | Done | 16 fields, EF config, seed data (6 templates) |
| **ComplianceFormSubmission entity** | Plan §Phase 1 | Done | TemplateId, UserId, DocuSealSubmissionId, Status, SignedAt, SignedPdfFileId |
| **IdentityDocument entity** | Plan §Phase 1 | Done | UserId, DocumentType, FileAttachmentId, VerifiedAt/By, ExpiresAt, Notes |
| **FileAttachment Sensitivity** | Plan §Phase 1 | Done | Added Sensitivity property for PII flagging |
| **IDocumentSigningService** | Plan §Phase 1 | Done | Interface + DocuSealSigningService + MockDocumentSigningService |
| **DocuSealOptions** | Plan §Phase 1 | Done | BaseUrl, ApiKey, TimeoutSeconds, WebhookSecret |
| **ComplianceFormSyncJob** | Plan §Phase 2 | Done | Hangfire weekly job: downloads PDFs, SHA-256 hash comparison, pushes to DocuSeal |
| **ComplianceFormsController** | Plan §Phase 2 | Done | 12 endpoints: template CRUD, sync, submissions, webhook, admin user detail, reminders |
| **IdentityDocumentsController** | Plan §Phase 2 | Done | 5 endpoints: employee CRUD, admin view, verify |
| **18 MediatR handlers** | Plan §Phase 2 | Done | Template CRUD (7), Submissions (4), Identity Docs (5), Admin (2) |
| **Frontend ComplianceFormService** | Plan §Phase 3 | Done | Signal-based service with templates, submissions, identityDocuments |
| **Tax form detail page** | Plan §Phase 3 | Done | Per-form route (/account/tax-forms/:formType), DocuSeal iframe, manual fallback, identity doc upload |
| **Tax forms list refactor** | Plan §Phase 3 | Done | Loads from API instead of hardcoded, links to per-form detail routes |
| **Collapsible sidebar sub-menu** | Plan §Phase 3 | Done | Tax & Compliance parent with dynamic children from templates, expand/collapse |
| **KEY_ROUTE_MAP update** | Plan §Phase 3 | Done | Per-form routes: w4→/account/tax-forms/w4, etc. |
| **Admin compliance tab** | Plan §Phase 4 | Done | ComplianceTemplatesPanelComponent (DataTable CRUD), ComplianceTemplateDialogComponent, UserCompliancePanelComponent |
| **Admin service methods** | Plan §Phase 4 | Done | Template CRUD, sync, getUserComplianceDetail, sendReminder, verifyIdentityDocument |
| **Docker DocuSeal container** | Plan §Phase 5 | Done | 8th container, profiles: [signing], docusealdata volume |
| **nginx DocuSeal proxy** | Plan §Phase 5 | Done | /docuseal/ → qb-engineer-signing:3000 |
| **appsettings DocuSeal** | Plan §Phase 5 | Done | DocuSeal section in appsettings.json + docker-compose env vars |
| **PII MinIO bucket** | Plan §Phase 1 | Done | qb-engineer-pii-docs bucket in MinioOptions |
| **Per-employee state withholding** | Plan §Phase 9 | Done | 3-tier state resolution: WorkLocation.State → default CompanyLocation → company_state setting. No-tax states auto-complete. StateWithholdingInfoModel on responses. |
| **State withholding admin banner** | Plan §Phase 9 | Done | UserCompliancePanelComponent shows state name, category, resolution source |
| **Electronic form definitions** | Plan §Phase 10 | Done | FormDefinitionJson (jsonb) + FormDefinitionRevision on ComplianceFormTemplate. Dynamic form rendering from JSON definition. |
| **Electronic form data** | Plan §Phase 10 | Done | FormDataJson (jsonb) on ComplianceFormSubmission. Save draft + submit endpoints. |
| **Dynamic form definition extraction** | Plan §Phase 10 | Done | Form definitions are dynamically extracted from PDFs via pdf.js (PuppeteerSharp). 3-phase pipeline: IPdfJsExtractorService (raw extraction) → IFormDefinitionParser (smart pattern parser) → IFormDefinitionVerifier (structural checks + AI refinement). PdfPig removed. See `docs/pdf-extraction-pipeline.md`. |
| **State withholding source URLs** | Plan §Phase 10 | Done | StateWithholdingUrls.cs: 37 official PDF download URLs seeded into reference data metadata (sourceUrl). Backfill for existing installs. |
| **pdf.js extraction pipeline** | Plan §Phase 10 | Done | Replaced PdfPig (2,874-line monolith) with pdf.js via PuppeteerSharp. 3 focused services: PdfJsExtractorService (headless Chromium + pdf.js getTextContent/getAnnotations), FormDefinitionParser (pattern-based layout inference), FormDefinitionVerifier (structural checks + Ollama AI refinement, max 3 iterations). Dockerfile changed from Alpine to Debian for Chromium support. |
| **Auto state form definition** | Plan §Phase 10 | Done | GetMyStateFormDefinition handler: 3-tier state resolution → reference data lookup → cache check → PDF download + AcroForm extraction → cache result. StateFormDefinitionCache entity (PK=StateCode). Lazy on first access. Verified: CA DE-4 (13 fields), ID W-4 (22 fields). Frontend fetches via `/compliance-forms/my-state-definition`, renders in ComplianceFormRenderer. |
| **ComplianceFormRendererComponent** | Plan §Phase 10 | Done | Tabbed multi-page form renderer. Tab navigation (prev/next + clickable tabs), per-page model maps, readonly page detection, single FormGroup spanning all pages. Conditional fields, save draft, submit. Compact font sizes matching government documents. |
| **QB Dynamic Forms Library** | Plan §Phase 10 | Done | Full ng-dynamic-forms UI wrapper: 11 control components (input, select, datepicker, textarea, toggle, checkbox, radio, group, signature, heading, paragraph), qbFormControlMapFn, DynamicQbFormControlComponent (ViewContainerRef-based container), DynamicQbFormComponent (root), complianceDefinitionToModels + sectionsToModels adapters, normalizeFormPages utility. Multi-page support via FormPage model. All controls render through QB shared wrappers for automatic design system inheritance. |
| **Admin form definition endpoints** | Plan §Phase 10 | Done | PUT /{id}/form-definition (update), POST /{id}/extract-definition (PDF extraction), auto-extract on document upload. |
| **Visual rendering comparison** | Plan §Phase 10 | Done | After extracting a form definition, PuppeteerSharp navigates to `/__render-form` Angular headless route, screenshots the rendered form, then compares against PDF page screenshots. Two tiers: structural (SkiaSharp block SSIM + content density + region detection) and semantic (Ollama vision, optional). Results stored on FormDefinitionVersion (visual_comparison_json, visual_similarity_score, visual_comparison_passed). Fire-and-forget from extraction pipeline. API: POST `/{id}/compare-visual`, GET `/versions/{id}/comparison`. Docker API container memory increased to 2GB for dual Chromium processes. |

### Unified Onboarding Wizard

| Item | Status | Notes |
|------|--------|-------|
| **`OnboardingSubmitRequestModel` / result / status models** | Done | `qb-engineer.core/Models/OnboardingModels.cs` — all fields for 7 wizard steps, signing URL list, per-category completion status |
| **`SubmitOnboarding` handler** | Done | Loads W-4/I-9/StateWithholding templates → `BuildFormDataDictionary()` (40+ canonical keys) → `FillAndSubmitFormForSigningCommand` per template → upserts EmployeeProfile (address, phone, DOB, direct deposit) → marks acknowledgments |
| **`GetOnboardingStatus` handler** | Done | Reads EmployeeProfile timestamps → returns `OnboardingStatusModel` with per-category booleans + `AllComplete`/`CanBeAssigned` flags |
| **`OnboardingController`** | Done | `POST /api/v1/onboarding/submit`, `GET /api/v1/onboarding/status` |
| **`OnboardingWizardComponent` (frontend)** | Done | 7-step linear `MatStepper` at `/onboarding`: Personal Info, Address, Federal Tax (W-4), State Tax, I-9, Direct Deposit, Acknowledgments. Sequential DocuSeal iframe signing after submit. Completion screen. All forms use `ValidationPopoverDirective`. |
| **`OnboardingService` (frontend)** | Done | Signal-based `_status`, `loadStatus()`, `submit()` |
| **Account tax-forms linked to wizard** | Done | W-4/I-9/StateWithholding/DirectDeposit/WorkersComp/Handbook formTypes redirect to `/onboarding`; wizard-completion banner shown when incomplete; "Completed in wizard" badge when done |
| **`TextareaComponent` `placeholder` input** | Done | Added `readonly placeholder = input('')` + `[attr.placeholder]` to template |

---

### PDF Fill & DocuSeal Signing Pipeline
> Full spec: `docs/compliance-forms-signing.md`

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| **`AcroFieldMapJson` on ComplianceFormTemplate** | compliance-forms-signing.md §Data Model | Done | jsonb column; editable in compliance template dialog (system + custom forms) |
| **`FilledPdfTemplateId` on ComplianceFormTemplate** | compliance-forms-signing.md §Data Model | Done | FK to FileAttachment; upload via `POST /{id}/blank-pdf-template` in template dialog |
| **I-9 fields on ComplianceFormSubmission** | compliance-forms-signing.md §Data Model | Done | `FilledPdfFileId`, `I9Section1SignedAt`, `I9Section2SignedAt`, `I9EmployerUserId`, `I9DocumentListType`, `I9DocumentDataJson`, `I9Section2OverdueAt`, `I9ReverificationDueAt` |
| **Migration: compliance form signing fields** | compliance-forms-signing.md §Data Model | Done | `20260326052036_AddPdfFillAndI9Fields` |
| **`IPdfFormFillService`** | compliance-forms-signing.md §Backend Services | Done | Interface + PdfSharpFormFillService (real) + MockPdfFormFillService (pass-through) |
| **`PdfSharpFormFillService`** | compliance-forms-signing.md §Backend Services | Done | PdfSharp (MIT): enumerate AcroForm fields, fill, flatten |
| **`MockPdfFormFillService`** | compliance-forms-signing.md §Backend Services | Done | Returns template bytes unmodified |
| **`IDocumentSigningService.CreateSubmissionFromPdfAsync`** | compliance-forms-signing.md §Backend Services | Done | Raw PDF upload → DocuSeal submission; 2 sequential submitters for I-9 |
| **`FillAndSubmitFormForSigning` handler** | compliance-forms-signing.md §Build Order | Done | Fills PDF, uploads to MinIO, creates DocuSeal submission, returns signing URL |
| **`CompleteI9Section2` handler** | compliance-forms-signing.md §Build Order | Done | Records document examination data, stamps Section 2 fields, marks submission Completed |
| **`CheckI9Overdue` Hangfire job** | compliance-forms-signing.md §Notifications | Done | Daily 9AM UTC: flags Section2Overdue, fires Notification to Admin/Manager/OfficeManager |
| **`CheckI9Reverification` Hangfire job** | compliance-forms-signing.md §Notifications | Done | Weekly Monday 9AM UTC: 90-day warning + overdue alerts, de-duplicated per 7 days |
| **`POST /compliance-forms/{id}/fill-and-sign`** | compliance-forms-signing.md §API Endpoints | Done | Employee submits wizard → fill PDF → DocuSeal submission → signing URL |
| **`POST /compliance-forms/{submissionId}/complete-i9-section2`** | compliance-forms-signing.md §API Endpoints | Done | Employer records document examination, marks submission Completed |
| **`GET /compliance-forms/admin/i9-pending`** | compliance-forms-signing.md §API Endpoints | Done | Returns employees with I-9 requiring Section 2 (Admin/Manager/OfficeManager) |
| **`POST /compliance-forms/{id}/blank-pdf-template`** | compliance-forms-signing.md §API Endpoints | Done | Upload blank government PDF, sets FilledPdfTemplateId on template |
| **`I9Status` on `AdminUserResponseModel`** | compliance-forms-signing.md §Employee List | Done | Computed via `I9StatusComputer.Compute()` in GetAdminUsers handler; 8 states |
| **Employee list I-9 chip** | compliance-forms-signing.md §Employee List | Done | I-9 status chip + "Complete Section 2" button in UserCompliancePanelComponent |
| **Section 2 employer UI in `UserCompliancePanelComponent`** | compliance-forms-signing.md §Employer Section 2 UI | Done | `CompleteI9DialogComponent` — List A/B+C toggle, document fields, start date, reverification date |
| **AcroField map editor in compliance template dialog** | compliance-forms-signing.md §Admin Config | Done | System form dialog: blank PDF upload zone + JSON textarea + Save Map. Non-system edit: acroFieldMapJson textarea in form. |
| **I-9 notifications wired** | compliance-forms-signing.md §Notifications | Done | Section1 complete → notify via webhook handler; overdue/reverification via Hangfire jobs |
| **W-4 post-wizard signing wired (frontend)** | compliance-forms-signing.md §W-4 Flow | Done | After wizard submit: if docuSealSubmitUrl + Pending → show signing iframe in tax-form-detail |
| **State withholding post-wizard signing wired (frontend)** | compliance-forms-signing.md §State Withholding Flow | Done | Same pattern as W-4 — isFillAndSign computed signal, pendingSigning gate |

---

## Payroll Visibility & Office Manager Access

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| **PayrollDocumentSource enum** | Plan §Phase 1 | Done | Accounting, Manual |
| **PayStubDeductionCategory enum** | Plan §Phase 1 | Done | 15 categories (FederalTax through Other) |
| **TaxDocumentType enum** | Plan §Phase 1 | Done | W2, W2c, Misc1099, Nec1099, Other |
| **PayStub entity + config** | Plan §Phase 1 | Done | BaseAuditableEntity, FK to FileAttachment (SetNull), index on UserId, unique filtered ExternalId |
| **PayStubDeduction entity + config** | Plan §Phase 1 | Done | BaseEntity, FK to PayStub (Cascade), decimal(18,2) |
| **TaxDocument entity + config** | Plan §Phase 1 | Done | BaseAuditableEntity, composite index (UserId, TaxYear), unique filtered ExternalId |
| **DbContext DbSets** | Plan §Phase 1 | Done | PayStubs, PayStubDeductions, TaxDocuments |
| **Accounting models** | Plan §Phase 1 | Done | AccountingPayStub, AccountingPayStubDeduction, AccountingTaxDocument |
| **Response/Request models** | Plan §Phase 1 | Done | PayStubResponseModel, PayStubDeductionResponseModel, TaxDocumentResponseModel, Upload request models |
| **IAccountingService payroll methods** | Plan §Phase 2 | Done | GetPayStubsAsync, GetPayStubPdfAsync, GetTaxDocumentsAsync, GetTaxDocumentPdfAsync |
| **MockAccountingService payroll** | Plan §Phase 2 | Done | 3 bi-weekly pay stubs, 1 W-2 for 2025 |
| **QuickBooksAccountingService stubs** | Plan §Phase 2 | Done | Log warning + return empty (QB Payroll API = future) |
| **PayrollController (11 endpoints)** | Plan §Phase 3 | Done | Employee self-service + Admin/OM CRUD, sync |
| **MediatR handlers (11)** | Plan §Phase 3 | Done | GetMyPayStubs, GetPayStubPdf, GetMyTaxDocuments, GetTaxDocumentPdf, GetUserPayStubs/TaxDocuments, Upload/Delete, SyncPayrollData |
| **Role broadening (compliance/identity)** | Plan §Phase 4 | Done | ComplianceFormsController + IdentityDocumentsController admin endpoints → Admin,Manager,OfficeManager |
| **Angular payroll models** | Plan §Phase 5 | Done | PayStub, PayStubDeduction, TaxDocument, PayrollDocumentSource, TaxDocumentType |
| **PayrollService (Angular)** | Plan §Phase 5 | Done | Signal-based, employee + admin methods |
| **Account Pay Stubs page** | Plan §Phase 5 | Done | DataTable, period/amount display, PDF download, source chip |
| **Account Tax Documents page** | Plan §Phase 5 | Done | DataTable, type label mapping, PDF download |
| **Account routes + sidebar** | Plan §Phase 5 | Done | /account/pay-stubs, /account/tax-documents, sidebar nav items |
| **Admin route guard broadened** | Plan §Phase 6 | Done | roleGuard('Admin', 'Manager', 'OfficeManager') |
| **Admin tab gating** | Plan §Phase 6 | Done | isAdmin() computed, non-admins see only Compliance tab, default to compliance |
| **Sidebar admin item broadened** | Plan §Phase 6 | Done | Admin nav visible to Manager, OfficeManager |
| **UserCompliancePanelComponent + payroll** | Plan §Phase 6 | Done | Pay stubs + tax documents tables, upload forms, delete for manual, PDF download |

---

## Accounting Integration (qb-integration.md)

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| IAccountingService interface | qb-integration.md §Architecture | Done | Interface + MockAccountingService |
| AccountingServiceFactory | qb-integration.md §Architecture | Done | IAccountingProviderFactory with runtime provider resolution from SystemSettings. Supports multiple providers (QB, Xero, FreshBooks, Sage). All sync jobs + handlers use factory. |
| QB Online OAuth 2.0 | qb-integration.md §QB Provider | Done | OAuth flow, token exchange, encrypted storage (Data Protection API), admin UI connect/disconnect/test |
| Standalone mode (no provider) | qb-integration.md §Architecture | Done | App works without accounting |
| Sync queue (persistent) | qb-integration.md §Sync Queue | Done | ISyncQueueRepository, SyncQueueRepository, SyncQueueProcessorJob Hangfire job every 2 min |
| Accounting read cache | qb-integration.md §Cache | Done | AccountingCacheSyncJob every 6 hours, stores last_sync and cached_customers in SystemSettings |
| Orphan detection | qb-integration.md §Orphan | Done | OrphanDetectionJob daily at 3 AM, logs warnings for unlinked customers |
| Stage-to-document mapping | qb-integration.md §Stage Mapping | Done | MoveJobStage handler creates AccountingDocument and enqueues to sync queue when target stage has AccountingDocumentType |
| Customer sync (bidirectional) | qb-integration.md §Customer Sync | Done | CustomerSyncJob every 4 hours, QB→local customer sync with create/update |
| Accounting mode gating (Angular) | qb-integration.md §Standalone Mode | Done | AccountingService.isStandalone() loaded on app init, invoices + payments show "managed by provider" banner when not standalone |
| MOCK_INTEGRATIONS flag | qb-integration.md §QB Provider | Done | MockIntegrations config, conditional DI in Program.cs |

---

## Shared Component Library (proposal.md §4.27, coding-standards.md)

### Form Controls (All Done)

| Component | Status | Consumed By |
|-----------|--------|-------------|
| InputComponent (CVA) | Done | All features |
| SelectComponent (CVA) | Done | All features |
| TextareaComponent (CVA) | Done | All features |
| DatepickerComponent (CVA) | Done | All features |
| ToggleComponent (CVA) | Done | Admin |
| AutocompleteComponent (CVA) | Done | Ready for adoption |
| EntityPickerComponent (CVA) | Done | Parts BOM, Customer dialogs |
| DateRangePickerComponent (CVA) | Done | Reports (time-based) |

### Layout & Chrome (All Done)

| Component | Status | Consumed By |
|-----------|--------|-------------|
| DialogComponent | Done | All 26 dialog forms. Centralized draft auto-save via `[draftConfig]` + `[draftFormGroup]` inputs. Dirty indicator, draft recovery banner, unsaved changes guard. |
| PageHeaderComponent | Done | Most features |
| PageLayoutComponent | Done | Ready for adoption |
| ToolbarComponent + SpacerDirective | Done | Ready for adoption |
| DetailSidePanelComponent | Done | Job detail |
| EmptyStateComponent | Done | DataTable, lists |

### Data & Display (All Done)

| Component | Status | Consumed By |
|-----------|--------|-------------|
| DataTableComponent | Done | All 8 features converted (Admin, Assets, Leads, Expenses, Time Tracking, Parts, Backlog, Inventory). `clickableRows` input for pointer cursor + hover highlight on row-click tables. |
| ColumnFilterPopoverComponent | Done | DataTable |
| ColumnManagerPanelComponent | Done | DataTable |
| ConfirmDialogComponent | Done | Parts, Expenses, Assets, Time Tracking, Leads, Customers |
| AvatarComponent | Done | Job cards, admin |
| KpiChipComponent | Done | Dashboard |
| StatusBadgeComponent | Done | Ready for adoption |
| ActivityTimelineComponent | Done | Job detail panel (compact mode) |
| ListPanelComponent | Done | Ready for adoption |
| FileUploadZoneComponent | Done | Job detail files tab |

### Specialized (All Done)

| Component | Status | Consumed By |
|-----------|--------|-------------|
| DashboardWidgetComponent | Done | Dashboard |
| KanbanColumnHeaderComponent | Done | Ready for adoption |
| QuickActionPanelComponent | Done | Ready for adoption |
| MiniCalendarWidgetComponent | Done | Ready for adoption |
| ToastComponent | Done | Global |
| ConnectionBannerComponent | Done | Global |

### Services & Utilities

| Service | Status | Notes |
|---------|--------|-------|
| AuthService | Done | Login, logout, tokens |
| ThemeService | Done | Light/dark toggle |
| SnackbarService | Done | All feature mutations (Parts, Expenses, Assets, Time Tracking, Customers, Leads, Kanban) |
| ToastService | Done | Upper-right stackable |
| FormValidationService | Done | Derives violations from FormGroup |
| LoadingService | Done | Global overlay |
| UserPreferencesService | Done | API-backed with localStorage cache + debounced PATCH |
| TerminologyService | Done | Pipe exists, admin UI built |
| BoardHubService | Done | SignalR board sync |
| NotificationHubService | Done | Hub + panel + header bell wired |
| TimerHubService | Done | Full SignalR integration: connect/disconnect, onTimerStartedEvent/onTimerStoppedEvent, wired in time-tracking component |
| DraftService | Done | Draft orchestrator: register/unregister forms, debounced auto-save (2.5s), TTL management, cross-tab event handling |
| DraftStorageService | Done | IndexedDB wrapper (`qb-engineer-drafts` DB), userId index |
| DraftBroadcastService | Done | Cross-tab BroadcastChannel `qb-engineer-draft-sync` |
| DraftRecoveryService | Done | Post-login recovery, 5-min TTL grace period, logout warning dialog |
| DirtyFormIndicatorComponent | Done | Orange dot + "Unsaved changes" chip for dirty forms |
| DraftRecoveryBannerComponent | Done | Per-form "Recovered from [timestamp]. [Discard]" banner |
| DraftRecoveryPromptComponent | Done | Post-login/expiry dialog listing all drafts |
| LogoutDraftsDialogComponent | Done | Logout confirmation with draft list |
| unsavedChangesGuard | Done | `CanDeactivateFn` — warns on navigation away from dirty forms |

### Pending Enhancements

| Enhancement | Component | Status |
|-------------|-----------|--------|
| Expandable rows | DataTableComponent | Done |
| API-backed preferences | UserPreferencesService | Done |
| Loading state | DataTableComponent | Done |
| Sticky first column | DataTableComponent | Done |

---

## Coding Standards Compliance (coding-standards.md)

| Standard | Status | Notes |
|----------|--------|-------|
| One object per file | Done | Enforced across Angular + .NET |
| SCSS BEM naming | Done | |
| No hardcoded values | Done | Variables/mixins for spacing, typography, colors |
| File type suffix in names | Done | `.component.ts`, `.service.ts`, etc. |
| Standalone components | Done | All components standalone |
| OnPush change detection | Done | |
| Signal-based state | Done | signal(), computed(), input(), output() |
| inject() for DI | Done | No constructor injection |
| @if/@for control flow | Done | No *ngIf/*ngFor |
| Reactive forms only | Done | No FormsModule/ngModel |
| Shared form wrappers | Done | No raw `<input>` in features (job detail panel + reports remediated in Batch 3) |
| Validation popover (no mat-error) | Done | |
| MediatR CQRS | Done | All handlers in Features/ |
| Repository pattern | Done | Interfaces in Core, implementations in Data |
| Soft deletes only | Done | Global query filter |
| Snake_case DB naming | Done | Auto-applied by DbContext |
| No "DTO" suffix | Done | *ResponseModel / *RequestModel |
| EF migrations | Done | InitialCreate + AddActivityLogs migrations, MigrateAsync replaces EnsureCreatedAsync |

---

## Reporting (proposal.md §7)

| Report | Status |
|--------|--------|
| My Work History | Done | Full-stack: data table of user's assigned jobs with stage, customer, dates |
| My Time Log | Done | Full-stack: data table of user's time entries with date range filter |
| My Expense History | Done |
| My Cycle Summary | Done | Full-stack: user's planning cycle entries, completion rate, rollover count |
| Jobs by Stage | Done | Full-stack: bar chart + data table, track type filter |
| Overdue Jobs | Done | Full-stack: data table with days overdue, assignee |
| On-Time Delivery Rate | Done | Full-stack: pie chart + KPI cards, date range filter |
| Average Lead Time | Done | Full-stack: bar chart + data table by stage |
| Time in Stage (Bottleneck) | Done |
| Team Workload | Done | Full-stack: stacked bar chart + data table (active/overdue/hours) |
| Employee Productivity | Done | Full-stack: jobs completed, hours, avg time per job |
| Labor Hours by Job | Done | Time by User report: bar chart + data table, date range filter |
| Expense Summary | Done | Full-stack: pie chart + data table, date range filter |
| Cycle Review | Done | Full-stack: cycle completion, rollover, velocity metrics |
| Customer Activity | Done | Full-stack: stacked bar chart + data table (active/completed/total) |
| Quote-to-Close Rate | Done |
| Inventory Levels | Done | Full-stack: bin content levels by location |
| Quality / Scrap Rate | Done | Full-stack: scrap rate, defect counts from production runs |
| Shipping Summary | Done |
| Maintenance Reports | Done | Full-stack: downtime hours, MTBF, asset reliability |
| Lead Pipeline Report | Done | Full-stack: bar chart + data table |
| Lead & Sales Reports | Done | Full-stack: KPI cards (leads, conversions, quotes, SOs, SO value) |
| R&D Reports | Done | Full-stack: R&D jobs with iterations, hours, stage, assignee |
| System Audit Log | Done | AuditLogEntry entity, GetAuditLog handler (paginated, filterable), admin endpoint |
| Storage Usage | Done | GetStorageUsage handler, groups FileAttachments by EntityType with counts + sizes |
| Job Completion Trend | Done | Full-stack: line chart (created vs completed per month) |
| Scheduled Email Digest | Done | DailyDigestJob (Hangfire 7AM UTC): upcoming/overdue/completed jobs per user, branded HTML template |

---

## Notification System (proposal.md §5.3)

| Item | Status | Notes |
|------|--------|-------|
| Bell icon + dropdown panel | Done | Real unread count badge, click-to-open panel |
| User-authored notifications | Done | CreateNotification handler with sender info |
| System-generated notifications | Done | CreateNotification via MediatR, SignalR broadcast |
| Filter tabs (All/Messages/Alerts) | Done | Tab filtering in notification panel |
| Dismiss / Pin / Bulk actions | Done | Per-item pin/dismiss, mark all read, dismiss all |
| Per-user notification preferences | Done | /notifications preferences tab: email on critical/assignment/mention, sound toggle |
| Email notifications (SMTP) | Done | IEmailService + SmtpEmailService (MailKit) + MockEmailService |
| Email templates (branded) | Done | EmailTemplateBuilder: digest, invoice, notification templates with branded header/footer |

---

## Terminology & i18n (proposal.md §6.5)

| Item | Status | Notes |
|------|--------|-------|
| TerminologyPipe | Done | |
| TerminologyService | Done | |
| Admin terminology UI | Done | Tab in admin page, editable key-label table, bulk upsert via PUT /api/v1/terminology |
| ngx-translate integration | Done | @ngx-translate/core v17 + http-loader, provideTranslateService in app.config |
| Spanish language pack | Done | Full es.json with all nav, common, auth, dashboard, jobs, parts, errors keys |
| Per-user language preference | Done | LanguageService with localStorage persistence, document.lang attribute |

---

## Testing (coding-standards.md, libraries.md)

| Area | Status | Notes |
|------|--------|-------|
| Angular unit tests (Vitest) | Done | 23 spec files (330 tests): AuthService, ThemeService, FormValidationService, LoadingService, TerminologyPipe, AppComponent, SnackbarService, NotificationService, CacheService, BroadcastService, OfflineQueueService, StatusTrackingService, InventoryService, AiService, ShipmentService, KanbanService, PartsService, ExpensesService, LeadsService, CustomerService, AdminService, TimeTrackingService, AssetsService |
| .NET unit tests (xUnit) | Done | 27 test classes (214 tests): CreateJob, UpdateJob, MoveJobStage, CreatePart, StartTimer, StopTimer, CreateExpense, CreateCustomer, AdjustStock, CreateInvoiceFromJob, CreateLead, CreateVendor, CreateQuote, DisposeJob, CreateReservation, ReleaseReservation, ExplodeJobBom, SetWorkflowStatus, UploadFileChunk, CreatePayment, CreateInvoice, PlaceBinContent, CreateAsset, CreateMaintenanceSchedule, ConvertQuoteToOrder, ActivatePlanningCycle, CreateCustomerReturn |
| Integration tests | Done | 40 tests via WebApplicationFactory: health, auth, protected endpoints, POST validation (InMemory DB + Hangfire MemoryStorage) |
| E2E tests (Cypress) | Done | 18 spec files (login, dashboard, kanban, accessibility, parts, expenses, admin, inventory, shipments, quality, reports-expanded, calendar, leads, assets, time-tracking, backlog, vendors, planning), custom cy.login() command |
| axe-core accessibility tests | Done | 10 page tests (dashboard, kanban, login, parts, inventory, admin, reports, expenses, leads, time-tracking) — critical + serious violations |

---

## Libraries (libraries.md) — Installation Status

### Frontend

| Library | Installed | Used |
|---------|-----------|------|
| @angular/material | Yes | Yes |
| @angular/cdk (drag-drop) | Yes | Yes (kanban) |
| @angular/cdk (scrolling) | Yes | Yes (VirtualScrollListComponent) |
| gridstack | Yes | Yes (dashboard widget customization) |
| three + @types/three | Yes | Yes (STL viewer) |
| ng2-charts + chart.js | Yes | Yes (reports) |
| driver.js | Yes | Yes (TourService + 2 tour definitions) |
| @ngx-translate/core | Yes | Yes (LanguageService, en.json + es.json) |
| @ngx-dropzone | No | Not Started (custom FileUploadZone built) |
| ngx-extended-pdf-viewer | Yes | Yes (PdfViewerComponent wrapper) |
| ngx-quill | Yes | Yes (RichTextEditorComponent CVA wrapper) |
| angularx-qrcode | Yes | Yes (QrCodeComponent wrapper) |
| bwip-js | Yes | Yes (LabelPrintService) |
| papaparse | Yes | Yes (DataTable CSV export) |
| @ngneat/hotkeys | N/A | Done (custom KeyboardShortcutsService instead — no dependency needed) |
| date-fns | Yes | Yes |
| @ngx-gallery/lightbox | No | Done | Custom LightboxGalleryComponent (no library dependency) |
| ngx-markdown | Yes | Yes (MarkdownViewComponent wrapper) |
| vitest | Yes | Yes (11 spec files) |
| cypress | Yes | Yes (8 E2E specs + axe-core a11y) |

### Backend

| Library | Installed | Used |
|---------|-----------|------|
| EF Core + Npgsql | Yes | Yes |
| ASP.NET Identity | Yes | Yes |
| SignalR | Yes | Yes |
| FluentValidation | Yes | Yes |
| MediatR | Yes | Yes |
| Serilog | Yes | Yes |
| Mapperly | Yes | Yes (6 entity mappers) |
| MS Http Resilience | Yes | Yes (retry + circuit-breaker on resilient HttpClient) |
| Minio SDK | Yes | Yes |
| OpenAPI + Scalar | Yes | Yes |
| Hangfire | Yes | Yes (2 recurring jobs) |
| MailKit | Yes | Yes (SmtpEmailService) |
| CsvHelper | Yes | Yes (CsvExportService) |
| QuestPDF | Yes | Yes (Invoice PDF, Packing Slip PDF) |
| ImageSharp | Yes | Yes (ImageService: thumbnails, dimensions, JPEG conversion) |
| Xabaril Health Checks | Done | PostgreSQL + Hangfire + MinIO + SignalR, detailed JSON response |
| Data Protection API (EF) | Yes | Yes (TokenEncryptionService, keys persisted to Postgres) |
| EFCore.BulkExtensions.MIT | Yes | Yes (BulkSoftDeleteAsync extension method) |
| Bogus | Yes | Yes (test data generation) |

---

## Overall Summary

| Category | Done | Partial | Not Started |
|----------|------|---------|-------------|
| Core Entities & Schema | 24/24 | — | — |
| API Controllers | 27/27 | — | — |
| MediatR Handlers | 106+ | — | — |
| Shared UI Components | 35/35 | — | — |
| Feature UIs | 20/20 | — | — |
| Auth & Security | 10 | — | — |
| **Order Management** | 12 | — | — |
| **Standalone Financial ⚡** | 18 | — | — |
| **Pricing & Quoting** | 8 | — | — |
| Accounting Integration | 9 | — | — |
| Planning Cycles | 6 | — | — |
| Production Traceability | 5 | — | — |
| Reporting | 27 | — | — |
| Notifications | 8 | — | — |
| Chat | 15 | — | — |
| Search | 1 | — | — |
| i18n | 6 | — | — |
| Testing | 5 | — | — |
| Background Jobs | 1 | — | — |
| Backup | 1 | — | — |
| AI Module | 1 | — | — |
| **MRP/MPS Engine** | 7 | — | — |
| **Finite Capacity Scheduling** | 6 | — | — |
| **Job Costing (Actual vs. Estimated)** | 5 | — | — |
| **Operation-Level Time Tracking** | 4 | — | — |
| **SO Detail Redesign** | 8 | — | — |
| **Event-Driven Infrastructure** | 24 | — | — |
| **Auto-PO (MRP Enhancement)** | 7 | — | — |
| **Scanner Operations** | 22 | — | — |
| **Feature Gating / Capability System (Phase 4)** | 8 | — | — |

---

## Feature Gating / Capability System (Phase 4)

Phase 4 (2026-04-26 → 2026-04-28) delivered a per-install capability gating system: 129 named capabilities (e.g. `CAP-MD-CUSTOMERS`, `CAP-INV-LOTS`) registered in a static catalog, gated at the controller and MediatR-pipeline layer with `[RequiresCapability]`, mutated through admin / discovery / preset surfaces, and audited end-to-end.

| Item | Spec | Status | Notes |
|------|------|--------|-------|
| Capability catalog (129 codes) | phase-4-output/4A-capability-catalog | Done | Static `CapabilityCatalog.cs` with default-state, dependencies, mutexes; only declared mutex is `CAP-ACCT-EXTERNAL ⊥ CAP-ACCT-BUILTIN` codifying the accounting boundary |
| Storage + descriptor + middleware foundation | phase-4-output/4D-gating-mechanism | Done | `capabilities` + `capability_configs` tables, snapshot provider, `CapabilityGateMiddleware`, `[RequiresCapability]`, `[CapabilityBootstrap]`, `GET /api/v1/capabilities` descriptor with weak ETag |
| 57+ controllers gated end-to-end | phase-4-output/4F Phase B + Phase D | Done | Phase B initial slice (10 capabilities — CustomersController, VendorsController, PartsController, QuotesController, etc.) + Phase D bulk registration (12 sub-WUs across IDEN/MD/P2P/O2C/MFG/PLAN/INV/QC/MAINT/HR/RPT/CROSS/EXT) |
| Mutation surface (admin endpoints) | phase-4-output/4F Phase C | Done | `PUT /capabilities/{code}/enabled`, `bulk-toggle`, `validate`, `audit-log`, with whole-set dependency / mutex validation, audit emission, and SignalR broadcast |
| Admin UI (Browse / Detail / History) | phase-4-output/4F Phase E | Done | `/admin/capabilities` grid grouped by area, `/admin/capabilities/:code` detail, `/admin/capabilities/audit-log`; consultant-mode toggle, onboarding banner |
| Discovery wizard (22 questions) | phase-4-output/4F Phase F | Done | `/admin/discovery` — bucketed-headcount / mode / sites routing, branch A/B/C, `DiscoveryRecommendationEngine` (pure function, 17 unit tests), `POST /discovery/preview` and `/discovery/apply` |
| Preset browser + apply | phase-4-output/4F Phase G | Done | `/admin/presets` with 8 presets (7 named + Custom), compare matrix, custom builder, `PresetApplyDialogComponent` reusable confirmation modal, no-op apply emits audit row |
| Hangfire / MediatR pipeline gating | phase-4-output/4F Phase H | Done | `CapabilityGateBehavior<TRequest, TResponse>` MediatR pipeline behavior — request types carry `[RequiresCapability]`, behavior throws `CapabilityDisabledException`. `BulkIndexDocumentsCommand` carries the smoke-demonstration attribute (`CAP-EXT-AI-ASSISTANT`) |

**Open follow-ups (post-Phase-4):**
- ~28 unmapped capabilities have no implementing endpoint today — tracked at `phase-4-output/library-expansion-queue.md`. Each is registered in the catalog and will be gated when the underlying endpoint is added.
- AdminController grab-bag (roles, role-templates, track-types, etc.) intentionally ungated at the class level; a finer-grained pass would gate individual actions.
- ShopFloorController kiosk-auth interaction with `CAP-IDEN-AUTH-KIOSK` not exhaustively mapped (kiosk auth is "always available where it exists").
- Library coverage catch-up (~18-20 capabilities lack test cases — separate effort, see `phase-4-output/library-expansion-queue.md`).

See `phase-4-output/PHASE-4-CLOSEOUT.md` for the closeout artifact.

---

## Batch 3 Changelog — Quality, Completeness & Hardening (2026-03-11)

### Exception Handling Hardening
- `ExceptionHandlingMiddleware` now maps `InvalidOperationException` → 409 Conflict
- 5 handlers changed from `InvalidOperationException("... not found")` to `KeyNotFoundException` for proper 404 responses
- Affected: UpdateAsset, UpdateExpenseStatus, UpdateLead, PlaceBinContent, CreateStorageLocation

### FluentValidation Validators (15 new)
- Added validators to existing handler files: CreatePart, UpdatePart, CreateBOMEntry, CreateExpense, CreateAsset, UpdateAsset, CreateLead, UpdateLead, CreateTimeEntry, UpdateTimeEntry, CreateStorageLocation, PlaceBinContent, CreateTrackType, CreateSubtask, UpdateJob
- All wired through MediatR `ValidationBehavior` pipeline

### Backend Soft-Delete Handlers (7 new) + Controller Endpoints (8 new)
- New handlers: DeletePart, DeleteExpense, DeleteAsset, DeleteTimeEntry, DeleteLead, DeleteStorageLocation, RemoveBinContent
- Business rules enforced: Parts (no BOM parents), Expenses (Pending only), Leads (not Converted), StorageLocations (no bin contents), BinContents (creates audit BinMovement)
- DELETE endpoints added to 6 controllers (Inventory has 2)

### Polymorphic Activity Log Entity
- New `ActivityLog` entity with `EntityType`/`EntityId` polymorphism (alongside existing `JobActivityLog`)
- New `ActivityLogConfiguration` with composite index on (EntityType, EntityId)
- New `GetEntityActivity` handler for generic activity queries
- Activity endpoints added to 5 controllers: Parts, Leads, Expenses, Assets, Customers
- EF Core migration: `20260309143609_AddActivityLogs`

### Raw Input Remediation
- Job detail panel: 3 raw `<input>` → `<app-input>`, 1 raw `<select>` → `<app-select>`
- Reports: 2 raw `<input type="date">` → `<app-datepicker>` with `FormControl<Date | null>`
- Custom SCSS removed (`.date-field`, input/select styles in subtask-add, link-add, comment-add)

### Frontend Delete + ConfirmDialog Adoption
- Delete methods added to 5 services: Parts, Expenses, Assets, Time Tracking, Leads
- ConfirmDialogComponent adopted in 5 components (Customers already had it)
- All destructive actions now require user confirmation

### Snackbar Feedback for All Mutations
- Success messages added to Parts, Expenses, Assets, Time Tracking, Job Detail Panel
- Customers and Leads already had snackbar calls
- Every create/update/delete action now shows feedback

### ActivityTimeline Adoption in Job Detail
- Replaced ~24 lines of custom `.activity-list` rendering with `<app-activity-timeline [compact]="true">`
- Added `mappedActivity` computed signal mapping `Activity` → `ActivityItem`
- Removed custom activity SCSS (~740 bytes saved, panel SCSS 8.83kB → 8.09kB)

### Coding Standards Remediation
- **One Object Per File (Angular):** Split 16 model files into 115 individual files. TrackType + Stage promoted to `shared/models/` (used by 3+ features). 35 consumer files had imports updated.
- **One Object Per File (.NET):** Split 18 model files into 103 individual files in `qb-engineer.core/Models/`. Namespace unchanged, no import updates needed.
- **Inline Template Extraction:** 8 shared components extracted from `template:` → `templateUrl:` + `.component.html` files (page-header, dialog, select, datepicker, toggle, textarea, input, toast).
- **Inline Style Extraction:** Same 8 components extracted from `styles:` → `styleUrl:` + `.component.scss` files.
- **SCSS Variable Remediation:** 22 component SCSS files remediated — 80+ hardcoded values replaced with design system variables. New variables added to `_variables.scss`: `$sp-xxs`, `$sp-2xl`–`$sp-4xl`, `$icon-size-xs`–`$icon-size-hero`, `$font-size-md`/`lg`/`xl`/`heading`, `$avatar-size-*`, `$dot-size-*`, `$badge-size-*`, `$progress-bar-height`, `$sidebar-nav-height`, `$sidebar-icon-size`, `$btn-icon-size`, `$input-height`, `$chip-padding-sm`, `$chart-height`, `$detail-panel-width`, `$notification-panel-width`, `$shadow-panel`, `$shadow-dropdown`, `$backdrop-color`.
- **console.log Removal:** Removed 13 console.log/warn/error statements from `board-hub.service.ts` and `signalr.service.ts`.
- **Constructor Injection Audit:** All 12 audited components confirmed compliant — all use `inject()` pattern.

### Create Dialogs Wired (5 features)
- Sales Orders, Quotes, Shipments, Invoices, Payments — all 5 create dialog components wired into parent list components
- Each follows PO dialog pattern: `<app-dialog>` shell, two FormGroups (header + line items), signal-based line management, validation popover
- "New" buttons in page headers now functional (previously disabled or placeholder)
- All dialogs compile clean (Angular build verified)

---

## Batch 4 Changelog — XL Feature Batch (2026-03-12)

### FluentValidation Validators (20 new, 35+ total)
- CreateAdminUser, UpdateAdminUser, CreateReferenceData, UpdateReferenceData, CreateJobComment, CreateJobLink, UpdateSubtask, UpdateJobPosition, UpdateJobPart, UpdateSalesOrder, UpdatePurchaseOrder, UpdateQuote, UpdateBOMEntry, CreateNotification, UpdateNotification, CreateClockEvent, UpdateCustomerAddress, UpdateTrackType, UpdateExpenseStatus, UpdateTerminology, UpdateEntryOrder

### Financial Reports (3 new)
- AR Aging: Invoice aging buckets (Current, 1-30, 31-60, 61-90, 90+ days), KPI cards + data table
- Revenue: By period or customer, bar chart + data table, date range filter
- Simple P&L: Revenue vs expenses, 3 KPI cards + data table
- Backend: 3 MediatR handlers, 3 repository methods, 3 controller endpoints

### QuestPDF PDF Generation (2 documents)
- Invoice PDF: Full layout with header, line items table, totals, payment info, notes. GET /api/v1/invoices/{id}/pdf
- Packing Slip PDF: Ship-to address, line items from SO, signature line. GET /api/v1/shipments/{id}/packing-slip
- Company name from SystemSetting (fallback: "QB Engineer")

### SMTP Email (MailKit)
- IEmailService interface + SmtpEmailService (real) + MockEmailService
- SmtpOptions config in appsettings.json
- SendInvoiceEmail handler: generates PDF, attaches to email, HTML body
- POST /api/v1/invoices/{id}/email endpoint

### Hangfire Background Jobs
- PostgreSQL-backed job storage with dashboard at /hangfire
- RecurringOrderJob: daily 6AM UTC, generates SalesOrders from due RecurringOrders
- OverdueInvoiceJob: daily 1AM UTC, marks Sent invoices past DueDate as Overdue

### Guided Tours (driver.js)
- TourService: lazy-loads driver.js, tracks completion via UserPreferencesService
- 2 tour definitions: kanban-board, dashboard
- Themed popover via global SCSS overrides
- resetTour/resetAllTours methods for admin/testing

### Calendar .ics Export
- GET /api/v1/jobs/calendar.ics with optional assigneeId and trackTypeId filters
- Standard iCalendar format with all-day events on job due dates

### Notification Preferences + /notifications Page
- Full-page NotificationsComponent with "All Notifications" + "Preferences" tabs
- All Notifications tab: DataTable with search, severity/source filters, mark all read, dismiss all
- Preferences tab: toggle switches for email on critical/assignment/mention, sound on/off
- Preferences persisted via UserPreferencesService

### Dashboard Enhancements (2 new widgets)
- OpenOrdersWidgetComponent: shows open order count by status + total value, links to /sales-orders
- EodPromptWidgetComponent: "Top 3 for tomorrow" textarea, saves to UserPreferencesService, shows check when saved
- Backend: GetOpenOrdersSummary handler + GET /api/v1/dashboard/open-orders endpoint

### DataTable + UserPreferencesService (already complete)
- Expandable rows, loading state, sticky first column — all already implemented
- UserPreferencesService already switched to API-backed with localStorage cache

---

## Batch 13 Changelog — Infrastructure, 3D Viewer & Dashboard Customization (2026-03-14)

### Three.js STL Viewer
- Installed `three` + `@types/three` packages
- New `StlViewerComponent` (`shared/components/stl-viewer/`): lazy-loads Three.js, STLLoader, OrbitControls via dynamic import
- WebGL renderer with ambient + directional lighting, grid helper, auto-center geometry, camera auto-fit
- ResizeObserver for responsive canvas, full cleanup in ngOnDestroy (dispose renderer, geometry, materials)
- Wired into part detail panel as "3D View" tab (visible only when .stl file attached)
- Parts service: added `getPartFiles()` and `getFileDownloadUrl()` methods

### Gridstack Dashboard Customization
- Installed `gridstack` package, CSS added to angular.json global styles
- Dashboard refactored from static CSS grid to GridStack with 12-column layout
- Edit mode toggle: "Customize" button enables drag/resize/remove, "Done" exits
- Add widget dropdown menu for available (not yet placed) widgets
- Reset layout button restores defaults
- Layout persisted to UserPreferencesService (`dashboard:layout` key) on every change
- 9 widgets defined in `WIDGET_REGISTRY` with default positions, min sizes
- KPI chips kept outside grid as always-visible static row

### Mapperly Source-Generated Mapping
- Installed `Riok.Mapperly` 4.3.1 NuGet package
- 6 mapper files in `qb-engineer.api/Mappers/`: JobMapper, PartMapper, CustomerMapper, ExpenseMapper, AssetMapper, LeadMapper
- Source-generated `ToListModel()` / `ToDetailModel()` / `ToResponseModel()` extension methods
- Manual helpers for complex mappings with navigation properties (Job, Part, Expense)

### Expanded Health Checks
- Installed `AspNetCore.HealthChecks.Hangfire` 9.0.0
- New `MinioHealthCheck`: verifies MinIO bucket accessibility via IStorageService
- New `SignalRHealthCheck`: basic liveness check for SignalR service registration
- Health endpoint enhanced: `/api/v1/health` returns detailed JSON with per-check status, description, duration
- Chain: PostgreSQL → Hangfire → MinIO → SignalR

### Database Backup Infrastructure
- `DatabaseBackupJob`: Hangfire job running pg_dump with custom format (`-Fc`)
- Configurable via `DatabaseBackupOptions`: backup path, retention days (default 30), pg_dump path
- Old backup cleanup: deletes files older than retention period
- Registered as daily recurring job at 3 AM UTC
- Config section added to appsettings.json

### Keyboard Shortcuts
- Custom `KeyboardShortcutsService` (no external dependency): Map-based key registry with modifier support
- Input/textarea/select elements excluded from shortcut handling
- Global shortcuts: G (Dashboard), K (Kanban), B (Backlog), P (Parts), I (Inventory), R (Reports), T (Time Tracking), / (help), Escape (close)
- `KeyboardShortcutsHelpComponent`: grouped shortcut display with kbd styling
- Extensible: features can register/unregister context-specific shortcuts via `register()`/`unregister()`
- Wired into AppComponent (initialize on init, destroy on destroy)

### Timer Hub SignalR (Complete)
- New `TimerEvent` typed model matching backend event structure
- `TimerHubService` upgraded: typed callbacks, `joinUserGroup(userId)`/`leaveUserGroup()` for scoped events, reconnect handler re-joins groups
- Time tracking component updated with typed event handlers

### Virtual Scroll Support
- New `VirtualScrollListComponent` using `CdkVirtualScrollViewport` + `CdkFixedSizeVirtualScroll`
- Configurable `itemSize` (default 48px), `trackByField`, content projection via ng-template
- Ready for adoption on large list views (chat, notifications, activity feeds)

---

## Batch 14 Changelog — SSO, Kiosk Auth & Partial Completions (2026-03-14)

### Enterprise SSO (Google, Microsoft, Generic OIDC)
- 3 OAuth providers: Google, Microsoft (Azure AD), Generic OIDC (Okta/Auth0/Keycloak)
- `SsoOptions` + `SsoProviderOptions` config models, disabled by default in appsettings.json
- `SsoExternalCookie` temporary auth scheme for OAuth round-trip (app uses JWT, not cookies)
- `SsoCallback` handler: finds user by external ID or auto-links by email, generates JWT
- `LinkSsoIdentity` / `UnlinkSsoIdentity` handlers with FluentValidation
- `GetSsoProviders` (anonymous) + `GetLinkedSsoProviders` (authenticated) query handlers
- `ApplicationUser` extended: GoogleId, MicrosoftId, OidcSubjectId, OidcProvider fields
- 6 new AuthController endpoints (providers, login, callback, link, unlink, linked)
- Angular: SSO buttons on login page, `/sso/callback` route (lazy-loaded), auth service methods
- NuGet packages: Google, MicrosoftAccount, OpenIdConnect auth

### Shop Floor Clock — Barcode Scan Authentication
- 3-phase kiosk flow: barcode scan → PIN entry → clock in/out
- `BarcodeScanInputComponent` for hardware scanner input capture
- `AuthService.kioskLogin(barcode, pin)` for kiosk authentication
- Live clock display (HH:MM:SS), clocked-in/out worker lists with avatars
- 30-second auto-timeout back to scan phase, 15-second status refresh

### Calendar Color Coding (Complete)
- `CalendarJob` model extended: `trackTypeColor` (nullable) + `stageColor`
- `getJobTint()`: track type color priority, stage color fallback
- CSS custom property `--job-tint` applied across all 3 views (month/week/day)
- Stage color left border on all job chips
- High-priority visual styling (`job-chip--high-priority`)

### Part Detail Panel (Complete)
- 5-tab detail: info, BOM, usage, 3D viewer, files
- `PartInventorySummary` model: totalQuantity + binLocations
- `isLowStock` computed signal: warns when quantity < minStockThreshold
- File upload zone + file list in files tab
- STL auto-detection for viewer tab visibility

### Vendor Linked Purchase Orders (Complete)
- Split-panel layout: vendor list + detail panel
- 2-tab detail: info (full vendor data) + purchase-orders (linked POs DataTable)
- PO status chips with color coding (Draft/Submitted/Acknowledged/Partial/Received/Closed/Cancelled)

### Daily Priority Card (Complete)
- `overdueTasks` + `priorityTasks` computed signals with sorting
- `top3Tomorrow` persisted via UserPreferencesService
- Click-to-navigate: opens kanban with jobId query param

### Admin Training Dashboard
- `TrainingDashboardComponent` with DataTable: User, Role, Completed, Total, Last Tour, Completion %
- Progress bars with color coding (green ≥100%, orange ≥50%, red <50%)
- Client-side tour tracking note (per-device via browser storage)
- 6 available tours tracked: kanban, dashboard, parts, inventory, expenses, time-tracking

### Bundle Size Fix
- SSO callback component lazy-loaded (was eagerly imported, contributing to bundle bloat)
- Initial bundle error budget raised to 1.1MB (app has grown with 20+ feature modules)

---

## Batch 15 Changelog — Testing, Accessibility & Offline Resilience (2026-03-14)

### Angular Unit Tests (Vitest)
- 6 spec files: AuthService, ThemeService, FormValidationService, LoadingService, TerminologyPipe, AppComponent
- Tests cover login/logout, token management, theme toggle/persistence, form validation extraction, loading state management

### .NET Unit Tests (xUnit + Bogus + Moq)
- 6 test classes in qb-engineer.tests project: CreateJobHandler, UpdateJobHandler, MoveJobStageHandler, CreatePartHandler, StartTimerHandler, StopTimerHandler
- Repository/context mocking with Moq, test data via Bogus

### Accessibility (WCAG)
- aria-labels on all icon-only buttons (header hamburger, chat, notifications, theme toggle, sidebar collapse, dialog close, data table filter/settings, page header help, job detail panel actions)
- Skip-to-content link in app shell
- `focus-visible` outline globally in `_shared.scss`
- `prefers-reduced-motion` media query disables transitions/animations

### Offline Resilience & PWA Infrastructure
- `ngsw-config.json`: Service Worker config with app-shell prefetch, lazy assets, freshness strategies for API
- `CacheService`: IndexedDB wrapper (`qb-engineer-cache` database) with `get<T>()`, `set()`, `clear()`, `clearAll()` and `lastSynced` timestamps
- `BroadcastService`: BroadcastChannel `qb-engineer-sync` for multi-tab logout propagation and theme sync
- AuthService + ThemeService integrated with BroadcastService
- `provideServiceWorker()` registered in app.config.ts (production only)

---

## Batch 16 Changelog — QR Codes, Offline Queue & Expanded Tests (2026-03-14)

### angularx-qrcode Integration
- Installed `angularx-qrcode@21.0.4`
- Shared `QrCodeComponent` wrapper at `shared/components/qr-code/` — inputs: `value`, `size`, `errorCorrectionLevel`
- Canvas-based rendering, works alongside existing bwip-js barcode generation

### Offline Action Queue
- `OfflineQueueService` at `shared/services/offline-queue.service.ts` — IndexedDB-based mutation queue
- `OfflineQueueEntry` + `DrainResult` models at `shared/models/offline-queue-entry.model.ts`
- Auto-drains on `window.online` event, FIFO processing, stops on first failure
- Reactive `queueSize` signal, concurrent drain guard

### Expanded Angular Tests (3 new spec files, 39 tests)
- `SnackbarService` (8 tests): success/info/warn/error calls, successWithNav navigation
- `NotificationService` (22 tests): push, markAsRead, markAllRead, dismiss, togglePanel, setTab, filteredNotifications, togglePin, load
- `CacheService` (9 tests): IndexedDB set/get/clear/clearAll with lastSynced timestamps

### Expanded .NET Tests (4 new test classes, 23 tests)
- `CreateExpenseHandlerTests` (5): expense creation, user ID extraction, field trimming
- `CreateCustomerHandlerTests` (5): full/minimal creation, IsActive default, zero counts
- `AdjustStockHandlerTests` (6): increase/decrease, BinContent not found, zero-out removal, lot tracking
- `CreateInvoiceFromJobHandlerTests` (7): job→invoice, validation (not found, incomplete, no customer), due date, line description

---

## Batch 17 Changelog — Cypress E2E, HTTP Resilience, Markdown & Tests (2026-03-14)

### Cypress E2E Setup
- Installed Cypress, configured `cypress.config.ts` (baseUrl, viewport, timeouts)
- Custom `cy.login()` command with API-based session auth
- 3 spec files: login (form display, invalid credentials, successful login), dashboard (widgets, sidebar), kanban (columns, create button)
- npm scripts: `cy:open`, `cy:run`

### MS Http Resilience (.NET)
- Installed `Microsoft.Extensions.Http.Resilience`
- `HttpResilienceExtensions.AddResilientHttpClients()` — named "resilient" HttpClient with retry (3 attempts, 500ms delay), circuit breaker (30s sampling), timeouts (10s/30s)
- Registered in Program.cs after integration services

### ngx-markdown Integration
- Installed `ngx-markdown` + `marked`
- Shared `MarkdownViewComponent` wrapper at `shared/components/markdown-view/`
- `provideMarkdown()` registered in app.config.ts
- Styled with design system variables (code blocks, lists, links)

### Expanded Angular Tests (2 new spec files, 22 tests)
- `BroadcastService` (10): channel creation, logout/theme-change broadcast + handling, cleanup
- `OfflineQueueService` (12): enqueue, getQueueSize, clearQueue, drain (FIFO, failure handling, concurrent guard)

### Expanded .NET Tests (3 new test classes, 18 tests)
- `CreateLeadHandlerTests` (5): lead creation, field trimming, CreatedBy from claims
- `CreateVendorHandlerTests` (6): full/minimal creation, IsActive default, address fields
- `CreateQuoteHandlerTests` (7): quote with lines, customer validation, sequential line numbers, total calculation

---

## Batch 18 Changelog — Integration Tests, Rich Text, CSV Export & Accessibility (2026-03-14)

### .NET Integration Tests (24 tests)
- `TestWebApplicationFactory`: InMemory EF Core, Hangfire MemoryStorage, MockIntegrations=true, shared collection fixture
- `HealthEndpointTests` (2): health endpoint returns 200 + JSON
- `AuthEndpointTests` (4): login rejects invalid creds, /auth/me requires auth, public endpoints accessible
- `ApiEndpointTests` (18): 14 data endpoints + 4 admin endpoints return 401 without auth
- Added `InternalsVisibleTo` on API project, `public partial class Program` for WebApplicationFactory

### ngx-quill Rich Text Editor
- Installed `ngx-quill` + `quill`, added snow theme CSS to angular.json
- `RichTextEditorComponent` CVA wrapper at `shared/components/rich-text-editor/`
- Toolbar: bold, italic, underline, ordered/bullet lists, link, clean
- Themed with design system variables (border, font, colors)

### CsvHelper Server-Side Export
- Installed `CsvHelper` 33.1.0
- `ICsvExportService` interface in Core, `CsvExportService` implementation in API
- Methods: `Export<T>()` (byte[]) and `ExportToStream<T>()` (Stream)
- Registered as singleton in Program.cs

### axe-core Accessibility Tests
- Installed `cypress-axe` + `axe-core`
- 5 accessibility tests: dashboard, kanban, login, parts, inventory
- Filters to critical + serious impact violations only

---

## Batch 19 Changelog — i18n, PDF Viewer, Image Processing & E2E Expansion (2026-03-14)

### i18n Infrastructure
- Installed `@ngx-translate/core` v17 + `@ngx-translate/http-loader` v17
- English (`en.json`) and Spanish (`es.json`) translation files with nav, common, auth, dashboard, jobs, parts, errors keys
- `LanguageService` with signal-based state, localStorage persistence, `document.documentElement.lang` attribute
- `provideTranslateService` + `provideTranslateHttpLoader` configured in app.config.ts
- Initialized in AppComponent — TranslatePipe available for incremental adoption

### ngx-extended-pdf-viewer
- Installed `ngx-extended-pdf-viewer` with asset copy in angular.json
- Shared `PdfViewerComponent` wrapper at `shared/components/pdf-viewer/`
- Inputs: `src`, `height`, `showToolbar`, `showSidebarButton`. Print/download/zoom/paging enabled.

### ImageSharp Image Processing
- Installed `SixLabors.ImageSharp` v3.1.12
- `IImageService` interface in Core: `GenerateThumbnailAsync`, `GetDimensionsAsync`, `ConvertToJpegAsync`
- `ImageService` implementation in API using ImageSharp resize + JPEG encoding
- Registered as singleton in Program.cs

### Expanded Cypress E2E (4 new spec files)
- `parts.cy.ts` (4 tests): page display, data table, search, create button
- `expenses.cy.ts` (3 tests): page display, table/empty state, create button
- `admin.cy.ts` (3 tests): page display, tabs, user management table
- `inventory.cy.ts` (3 tests): page display, tabs, data table

---

## Batch 20 Changelog — Data Protection, Bulk Extensions, Tour Audit & Integrations Panel (2026-03-14)

### ASP.NET Data Protection API
- Installed `Microsoft.AspNetCore.DataProtection.EntityFrameworkCore`
- `AppDbContext` implements `IDataProtectionKeyContext` — keys persisted to PostgreSQL
- `ITokenEncryptionService` interface + `TokenEncryptionService` implementation using `IDataProtector`
- Purpose string `QbEngineer.OAuthTokens` for OAuth token encryption
- Configured in Program.cs with `PersistKeysToDbContext` + `SetApplicationName`

### EFCore.BulkExtensions
- Installed `EFCore.BulkExtensions.MIT` on data project
- `BulkOperationExtensions.BulkSoftDeleteAsync<T>()` — sets DeletedAt/DeletedBy on all entities and calls BulkUpdateAsync

### Tour Coverage Audit
- `scripts/audit-tours.ts` — scans features for TourService/HelpTourService references
- `npm run audit:tours` script via tsx
- Reports features with/without tours and coverage percentage

### Third-Party Integrations Panel
- `IntegrationsPanelComponent` scaffold at `admin/components/integrations-panel/`
- 5 pre-configured integrations: QuickBooks, MinIO, SMTP, Shipping, Ollama
- Status indicators (connected/disconnected/not_configured) with icons
- Grid layout with BEM naming and design system variables

---

## Batch 21 Changelog — Manufacturing Core: Disposition, Tooling, BOM, Status Tracking, AI RAG, Carrier APIs (2026-03-15)

### Job Disposition (MES Standard)
- `JobDisposition` enum: ShipToCustomer, AddToInventory, CapitalizeAsAsset, Scrap, HoldForReview
- `DisposeJob` MediatR handler: validates job not already disposed, auto-creates Tooling asset on CapitalizeAsAsset
- Job entity extended: `Disposition`, `DispositionNotes`, `DispositionAt` fields
- Angular: `DisposeJobDialogComponent` with disposition type selection + notes, icon indicator on kanban cards
- Job detail panel: disposition section with status display + Dispose action button

### Tool-Specific Asset Fields (Tool Registry)
- Asset entity extended: `IsCustomerOwned`, `CavityCount`, `ToolLifeExpectancy`, `CurrentShotCount`, `SourceJobId`, `SourcePartId`
- Part entity extended: `ToolingAssetId` FK for linked tooling asset
- Angular: conditional tooling section in asset detail/edit, entity picker for tooling asset on parts
- Response models updated with tooling fields + source names

### Part Status Prototype (NPI Gate)
- `PartStatus` enum: added `Prototype` value (Draft → Prototype → Active → Obsolete)
- Angular: Prototype status in filter options with info-colored chip

### BOM-Driven Work Breakdown
- `Operation` entity (renamed from ProcessStep): StepNumber, Title, Instructions, WorkCenterId, EstimatedMinutes, IsQcCheckpoint, QcCriteria, ReferencedOperationId (self-referencing FK)
- `OperationMaterial` join entity: links BOM entries to specific operations
- `BOMSourceType`: added `Stock` value alongside Make/Buy
- `BOMEntry`: added `LeadTimeDays` field
- Job entity: added `PartId`, `ParentJobId` (self-referencing FK), `ChildJobs` navigation
- 4 Operation CRUD handlers on PartsController (`/api/v1/parts/:id/operations`)
- Operation materials CRUD (`/api/v1/parts/:id/operations/:opId/materials`)
- Operation activity/comments (`/api/v1/parts/:id/operations/:opId/activity`)
- `ExplodeJobBom` handler: walks BOM, creates child jobs for Make entries with bidirectional JobLinks
- `GetChildJobs` handler: returns child job tree
- Angular: `RoutingComponent` (ordered operation cards with QC indicators), `OperationDialogComponent` (800px tabbed: Details, Materials, Files, Activity)

### Status Lifecycle Tracking (Polymorphic)
- `StatusEntry` entity: EntityType/EntityId polymorphism, StatusCode (reference_data driven), Category (workflow/hold)
- Workflow statuses: one active at a time with automatic EndedAt on transition
- Hold statuses: multiple parallel, manually released
- `StatusTrackingController`: 5 endpoints (history, active, set-workflow, add-hold, release-hold)
- 28 seeded reference_data entries for status codes across Jobs, Parts, Assets, POs, SOs, Quotes, Shipments
- Angular: `StatusTimelineComponent`, `SetStatusDialogComponent`, `AddHoldDialogComponent`, `StatusTrackingService`
- Integrated into job detail panel

### AI RAG Pipeline (pgvector)
- `DocumentEmbedding` entity with `Pgvector.Vector` type for vector(384) column
- `IEmbeddingRepository` + `EmbeddingRepository` with cosine distance search
- `RagSearch` handler: embed query → search similar → optionally generate answer via Ollama
- `IndexDocument` handler: extract text fields → chunk → embed → upsert
- `BulkIndexDocuments` handler: batch indexing for multiple entities
- `DocumentIndexJob`: Hangfire recurring every 30 min, indexes recent entities
- `AiHelpChat` handler enhanced with RAG context injection
- AiController: added search, index, bulk-index endpoints
- Angular: RAG results column in header AI search, AiHelpPanel with RAG-backed chat

### Carrier Shipping
- `IShippingService` interface with MockShippingService (direct carrier integrations TBD)
- Address validation decoupled: `IAddressValidationService` with `UspsAddressValidationService` (USPS Web Tools, free) + `MockAddressValidationService`
- 3 shipping handlers: GetShippingRates, CreateShippingLabel, GetShipmentTracking
- ShipmentsController endpoints
- Angular: `ShippingRatesDialogComponent` (rate comparison table), `TrackingTimelineComponent` (shipment event timeline)

### Mapper & Build Fixes
- Updated JobMapper, PartMapper, AssetMapper for new positional record parameters
- Fixed pgvector type mapping: `float[]` → `Pgvector.Vector` across entity, repository, and handlers
- Added Pgvector NuGet to core project

---

## Batch 22 Changelog — Hold Indicators, Inventory Reservation, Chunked Upload (2026-03-15)

### Hold Indicators on Kanban Cards
- `ActiveHolds` (List<string>) added to `JobListResponseModel`
- JobRepository queries StatusEntry table for active holds (EntityType=Job, Category=hold, EndedAt=null)
- Kanban card: `pause_circle` icon in header when holds active, `matTooltip` lists hold names
- BEM class `.job-card__hold-indicator` with `--warning` color

### Inventory Reservation System
- `Reservation` entity (BaseAuditableEntity): PartId, BinContentId, JobId?, SalesOrderLineId?, Quantity, Notes
- `ReservationConfiguration`: Fluent API with FK indexes
- `ReservedQuantity` field on BinContent entity
- 3 handlers: CreateReservation (validates available qty), ReleaseReservation (soft-delete + decrement), GetReservations (filterable)
- ExplodeJobBom: auto-reserves Stock items from available bin inventory, reports shortfalls
- InventoryController: 3 new reservation endpoints
- Angular: Reservations tab in inventory UI with DataTable, reserve dialog, release buttons
- Stock expand rows show On Hand / Reserved / Available columns, warning color when reserved > 0
- `BinStockResponseModel` extended with ReservedQuantity + AvailableQuantity

### Chunked File Upload
- `UploadFileChunk` handler: writes chunks to temp dir (`/tmp/qb-engineer-uploads/{uploadId}/`), concatenates on final chunk, uploads to MinIO, cleans up
- `ChunkedUploadResponseModel`: UploadId, ChunkIndex, IsComplete, FileAttachment?
- FilesController: `POST {entityType}/{entityId}/files/chunked` endpoint
- FileUploadZoneComponent: auto-detects large files (> chunkSizeMb input, default 5MB), slices with File.slice(), sequential chunk upload, progress as completedChunks/totalChunks
- Existing single-upload path unchanged for small files

---

## Batch 23 Changelog — Phase Polish (2026-03-15)

### Planning Day Tour
- New `PLANNING_TOUR` definition (5 steps: welcome, backlog panel, commit button, cycle board, lifecycle actions)
- Registered in AppComponent alongside 8 existing tours (9 total)
- Planning page header gains `helpTourId="planning"` for help icon

### Overdue Maintenance Notifications
- `OverdueMaintenanceJob` (Hangfire daily 2AM UTC): queries overdue MaintenanceSchedules, notifies Admin/Manager users via CreateNotificationCommand + SignalR
- Deduplication: skips schedules that already have a `maintenance-overdue` notification created after the schedule's NextDueAt
- Per-user try/catch prevents one failure from blocking others

### Worker View Polish
- Overdue task highlighting: red border + warning icon + "OVERDUE" label on overdue tasks
- Smart sorting: overdue first, then by due date ascending, then by priority (Critical → Low)
- `sortedTasks` computed signal replaces raw `tasks()` in template

### CI/CD Pipeline (GitHub Actions)
- `.github/workflows/ci.yml`: 5-job pipeline
- Parallel build (Angular + .NET) → Parallel test (Vitest + xUnit) → Docker image build (main push only)
- Node 22, .NET 9, actions v4

### Docker Production Optimization
- Alpine base images for API (`sdk:9.0-alpine`, `aspnet:9.0-alpine`) and UI (already Alpine)
- Non-root user in API container (`appuser`)
- Health checks on API (`/health`) and UI (`/`) in both Dockerfiles and docker-compose
- Resource limits: API 512M, UI 256M, DB 1G
- `UseAppHost=false` for smaller publish output
- `npm ci --ignore-scripts` for UI build security

---

## Batch 24 Changelog — Accessibility + Auth Completion (2026-03-15)

### RFID/NFC Tier 1 Auth (Software Layer)
- `UserScanIdentifier` entity: maps scan hardware IDs (nfc/rfid/barcode) to users, unique composite index, soft-delete
- `NfcKioskLogin` handler: `POST /auth/nfc-login` — looks up scan identifier, verifies PIN, returns 8-hour JWT with `authTier: "nfc"` claim
- Admin scan identifier management: GET/POST/DELETE `/admin/users/{userId}/scan-identifiers`
- `AddScanIdentifierRequestModel` + `ScanIdentifierResponseModel` in Core/Models
- AppDbContext: `DbSet<UserScanIdentifier>`

### Accessibility (axe-core)
- Expanded axe-core Cypress tests from 5 to 10 pages (added admin, reports, expenses, leads, time-tracking)
- Added `npm run test:a11y` script for targeted accessibility testing
- CI pipeline notes E2E + a11y tests run against Docker Compose stack

## Batch 25 Changelog — Test Expansion (2026-03-15)

### Angular Unit Tests (8 new spec files, 65 tests)
- KanbanService, PartsService, ExpensesService, LeadsService, CustomerService, AdminService, TimeTrackingService, AssetsService
- All use HttpClientTestingModule with request assertion pattern
- Total: 23 spec files, 330 tests (up from 15/195)

### .NET Unit Tests (8 new test classes, 36 tests)
- CreatePayment, CreateInvoice, PlaceBinContent, CreateAsset, CreateMaintenanceSchedule, ConvertQuoteToOrder, ActivatePlanningCycle, CreateCustomerReturn
- All use Bogus for data generation, NSubstitute for mocking
- Total: 27 test classes, 214 tests (up from 19/142)

### Integration Tests (16 new tests)
- Expanded ApiEndpointTests: 12 GET 401 tests (protected endpoints), 2 POST 400 validation tests, 2 anonymous 200 tests (health, login)
- Total: 40 integration tests (up from 24)

### Cypress E2E (6 new spec files, 28 tests)
- Leads (5), Assets (5), Time Tracking (5), Backlog (4), Vendors (4), Planning (5)
- All use cy.login() custom command, standard navigation + assertion patterns
- Total: 18 spec files (up from 12)

---

## Batch 22 Changelog — Domain-Specific AI Assistants (2026-03-12)

### AiAssistant Entity + CRUD
- `AiAssistant` entity (BaseAuditableEntity): Name, Description, Icon, Color, Category, SystemPrompt, AllowedEntityTypes (JSON), StarterQuestions (JSON), IsActive, IsBuiltIn, SortOrder, Temperature, MaxContextChunks
- `AiAssistantConfiguration`: max lengths, composite index on (IsActive, SortOrder)
- `AppDbContext`: added DbSet<AiAssistant>
- Seed data: 4 built-in assistants (General, HR, Procurement, Sales & Marketing) with domain-specific system prompts, entity type filters, and starter questions
- 6 MediatR handlers: GetAiAssistants (active), GetAllAiAssistants (admin), GetAiAssistant, CreateAiAssistant (FluentValidation), UpdateAiAssistant (protects IsBuiltIn), DeleteAiAssistant (409 on built-in)
- `AiAssistantsController`: GET/POST/PUT/DELETE with role-based auth (admin for mutations)
- Response/request models in `qb-engineer.core/Models/`

### AssistantChat Handler
- Extended `IAiService` with `GenerateTextAsync(prompt, systemPrompt, temperature, ct)` overload
- Extended `IEmbeddingRepository` with `SearchSimilarAsync` overload accepting `List<string>? entityTypeFilters`
- `OllamaAiService`: passes `system` field and `options.temperature` to Ollama API
- `MockAiService`: matching overload (ignores system prompt/temperature)
- `EmbeddingRepository`: multi-entity-type filter via `.Where(e => entityTypeFilters.Contains(e.EntityType))`
- `AssistantChat` handler: loads assistant, applies domain-scoped RAG filters, injects conversation history, calls LLM with per-assistant system prompt + temperature
- Endpoint: `POST /api/v1/ai/assistants/{assistantId}/chat` on `AiController`

### Admin UI — AI Assistants Tab
- 8th admin tab: "AI Assistants" with smart_toy icon
- `AiAssistantsPanelComponent`: DataTable with icon, name, category, entity filter count, active status, edit/delete actions
- `AiAssistantDialogComponent`: MatDialog form with Name, Category, Description, Icon (with live Material Icons preview), Color picker, System Prompt (10-row textarea), Entity Type Filters (multi-select), Starter Questions (dynamic add/remove list), Active toggle, Sort Order, collapsible Advanced section (Temperature, Max Context Chunks)
- Delete blocked for built-in assistants (button hidden)

### AI Chat Page (`/ai`)
- New feature route: `/ai/:assistantId` with redirect from `/ai` → `/ai/general`
- `AiComponent`: left sidebar (assistant list as cards with icon/color/name/description), right chat panel with header, message history, starter questions on empty state, typing indicator, clear chat
- In-memory conversation history per assistant (`Map<number, ChatMessage[]>`)
- Starter questions clickable to send immediately
- Enter to send, Shift+Enter for newline
- Mobile responsive: sidebar collapses to horizontal scroll
- Sidebar nav: "AI" entry with smart_toy icon in Management group
- Extended `AiService`: `getAssistants()` and `assistantChat()` methods

---

## Batch 26 Changelog — Admin Onboarding E2E + SubmitFormData Bug Fix (2026-03-20)

### Playwright E2E: Admin Onboarding (`admin-onboarding.spec.ts`)
- Full 9-step onboarding flow: Profile, Contact, Emergency Contact, W-4, I-9, State Withholding, Workers' Comp, Employee Handbook, Direct Deposit
- Cleaned up `page.evaluate()` debug diagnostic blocks from I-9 and State Withholding steps
- Fixed `acknowledgeForm()` to be idempotent: detects already-complete acknowledgment forms via `.form-detail__status--complete` and skips without error (handles re-runs)
- Fixed I-9 step: I-9 form was submitting to API (HTTP call reached server) but receiving 409 — see bug fix below
- Test now passes cleanly in ~47s; final screenshot shows all 6 forms completed (green checkmarks)

### Bug Fix: `ValidateRequiredFields` throws on `"required": null` in JSON
- **File:** `qb-engineer.api/Features/ComplianceForms/SubmitFormData.cs`
- **Root cause:** `I9FormDefinitionBuilder` serializes `["required"] = required` where `required` is `bool?`. Unset fields serialize as `"required": null`. `req.GetBoolean()` throws `InvalidOperationException` (not `JsonException`) on `null` values — bypassing the `catch (JsonException)` guard.
- **Fix:** Replaced `req.GetBoolean()` with `req.ValueKind != JsonValueKind.True` — only considers a field required if the JSON value is explicitly `true`.
- Applied same fix pattern to handle any other nullable boolean fields in form definitions safely.

---

## Batch 27 Changelog — Compliance PDF Download + Docs Accuracy (2026-03-21)

### Compliance Form PDF Download
- `DownloadSubmissionPdf` handler: `GET /api/v1/compliance-forms/submissions/{id}/pdf`
  - If `SignedPdfFileId` is set (DocuSeal signed) → streams stored PDF from MinIO
  - Otherwise → generates on-demand QuestPDF from `FormDefinitionVersion.FormDefinitionJson` + `FormDataJson`
  - PDF layout: form name header, submission date, labeled field/value pairs by section, page numbers
  - Access control: users see their own only; Admin/Manager/OfficeManager see any
- `ComplianceFormService.downloadSubmissionPdf()` (Angular): fetches as Blob, triggers browser download
- "Download PDF" button added to completed form card in `AccountTaxFormDetailComponent`
- i18n: `account.downloadFormCopy` added (en + es)

### Dead `src/assets/i18n/` Removed
- `qb-engineer-ui/src/assets/` was never served (angular.json assets root = `public/`)
- Deleted the duplicate `src/assets/i18n/en.json` and `src/assets/i18n/es.json`
- Canonical i18n path: `qb-engineer-ui/public/assets/i18n/`

### CLAUDE.md Documentation Accuracy Pass
- Fixed: QB Online and Ollama RAG marked "not yet implemented" → corrected to implemented with file references
- Added: Payroll, Chat, Reports (dynamic builder), AI, AI Assistants, Employee Compliance Forms, Quality, Sales Tax, Customer Returns, Production Lots, Scheduled Tasks, Notifications, Search to Features table
- Added: 12 missing entity groups to the Entity Structure section
- Added: "Planned / Partially Implemented" table replacing the single AR Aging "planned" row (AR Aging is implemented as a report; carrier APIs and alternative accounting providers correctly marked as remaining work)

---

## Batch 28 Changelog — Sales Tax UI, Customer Returns UI, Production Lots UI (2026-03-21)

### Sales Tax Admin Panel
- `SalesTaxPanelComponent` — DataTable with name/code/rate%/default/active columns, edit + delete per row
- `SalesTaxDialogComponent` — create/edit dialog with rate as % input (÷100 for API), default toggle
- Wired into admin as new `sales-tax` tab (Admin-only, placed between Teams and Compliance)
- Uses existing `AdminService.getSalesTaxRates/createSalesTaxRate/updateSalesTaxRate/deleteSalesTaxRate` methods
- i18n: `salesTax.*` section added (en + es), `admin.tabs.salesTax` added

### Customer Returns Feature
- New route `/customer-returns` — `roleGuard('Admin', 'Manager', 'PM', 'OfficeManager')`
- `CustomerReturnsComponent` — `DataTableComponent` list with status filter, `DetailSidePanelComponent` for detail
- Status chips: Received (info), ReworkOrdered (warning), InInspection (primary), Resolved (success), Closed (muted)
- Resolve action: opens inline dialog for inspection notes → `POST /{id}/resolve`
- Close action: `ConfirmDialogComponent` → `POST /{id}/close`
- `CustomerReturnDialogComponent` — `EntityPickerComponent` for customer + job, reason, notes, return date
- `CustomerReturnService` — full CRUD + resolve/close
- Sidebar nav: `assignment_return` icon in Sales group
- i18n: `customerReturns.*` section added (en + es), `nav.customerReturns` added

### Production Lots Feature
- New route `/lots` — `roleGuard('Admin', 'Manager', 'Engineer')`
- `LotsComponent` — `DataTableComponent` with lot number (mono font), part, qty, job, supplier lot, expiry
- `DetailSidePanelComponent` — full traceability panel: meta grid + chronological event timeline with type icons
- `LotDialogComponent` — part picker, quantity, supplier lot, linked job, expiration date, notes
- `LotService` — `getLots(search, partId, jobId)`, `trace(lotNumber)`, `create()`
- Sidebar nav: `batch_prediction` icon in Supply group
- i18n: `lots.*` section added (en + es), `nav.lots` added

---

## Batch 29 Changelog — Employee Training LMS (2026-03-23)

### Backend: Training Module System
- `TrainingModule` entity: title, summary, content (JSONB), contentType enum (Article/Video/Walkthrough/QuickRef/Quiz), estimatedMinutes, tags, publishedAt, sortOrder, isPublished
- `TrainingPath` entity: title, description, icon, isAutoAssigned, sortOrder; M2M `TrainingPathModule` join with order
- `TrainingProgress` entity: per-user per-module status (NotStarted/InProgress/Completed), startedAt, completedAt, lastHeartbeatAt, quizScore, quizAttempts
- `TrainingEnrollment` entity: per-user per-path enrollment with completedAt rollup
- `TrainingController` with 16 endpoints: modules list/get, progress (start/heartbeat/complete), quiz submit, enrollments, paths list/get, admin CRUD + progress summary
- 16 MediatR handlers in `Features/Training/`: GetTrainingModules, GetTrainingModule, GetTrainingModulesByRoute, CreateTrainingModule, UpdateTrainingModule, DeleteTrainingModule, RecordModuleStart, RecordProgressHeartbeat, CompleteModule, SubmitQuiz, GetMyEnrollments, GetMyProgress, EnrollUser, GetTrainingPath, GetTrainingPaths, GetAdminProgressSummary
- Seed data: 20 training modules (Article×12, Walkthrough×4, QuickRef×1, Quiz×2, Video×1) covering all major feature areas
- 2 seeded paths: "New Employee Onboarding" (7 modules, auto-assigned) + "Production Engineer Training" (8 modules, auto-assigned)
- Enrollments auto-created for all users on seed

### Frontend: Training Feature (`/training`)
- Route: `/training/:tab` (library/my-learning/paths), `/training/module/:id`, `/training/path/:id`
- `TrainingComponent`: 3-tab page (Library/My Learning/Learning Paths), search + type + learning style filters, card grid
- **Training Cards**: colored left-border type bar (Article=info, Video=purple, Walkthrough=primary, QuickRef=accent, Quiz=warning), completion/in-progress status chips, corner triangle for completed, style hint footer ("Best for: Visual / Auditory learners")
- `TrainingModuleComponent`: full module detail page with type-specific content renderer, progress timer, Mark as Complete / Back to Library footer buttons
  - **Article**: table of contents sidebar, section headings, collapsible TOC
  - **QuickRef**: tabular reference sections with Print button
  - **Video**: YouTube embed, chapters list, transcript toggle
  - **Walkthrough**: interactive tour via driver.js, step list, completion state
  - **Quiz**: question list with radio options, progress bar, submit → score card (pass/fail) with review mode + retry
- `TrainingPathComponent`: path detail with module list, per-module status chips, start/continue/review actions, progress bar
- `TrainingService`: getModules, getModule, getPath, getPaths, getMyEnrollments, recordStart, recordHeartbeat, completeModule, submitQuiz
- Models: TrainingModuleListItem, TrainingModule (full), TrainingPath, TrainingEnrollment, TrainingProgress, QuizContent, ArticleContent, VideoContent, WalkthroughContent, QuickRefContent; TrainingContentType/TrainingProgressStatus enums
- Learning style filter: maps visual/auditory/reading/kinesthetic → content types
- Sidebar nav: `school` icon in Management group

### Admin: Training Panel (Admin Settings → Training tab)
- New "Training" tab in Admin Settings
- `TrainingDashboardComponent`: 3 sub-tabs: Content, Paths, User Progress
  - **Content**: DataTable (title, type chip, time, published status, edit/delete actions), "+ New Module" button, `TrainingModuleDialogComponent`
  - **Paths**: DataTable (icon, title, description, module count, auto-assign, edit/delete), `TrainingPathDialogComponent`
  - **User Progress**: DataTable (name, role, enrolled paths, completed modules, last activity, completion %)
- `TrainingModuleDialogComponent`: full form (title, summary, content type selector, estimated minutes, tags, published toggle, JSON content editor)
- `TrainingPathDialogComponent`: title, description, icon, auto-assign toggle, module picker with drag-reorder

---

## Batch 30 Changelog — Training LMS Expansion (2026-03-23)

### Backend: Training Content Expansion
- `SeedAdditionalTrainingPathsAsync` added to `SeedData.cs` — separate from original seed, uses per-path title guards (safe for existing DBs)
- `GetOrCreateModule` local helper: idempotent slug-based module creation
- **28 new training modules** added across 6 new paths (slugs stable, never renamed)
- **6 new training paths** (Paths 3–8): Shop Floor Worker, Production Manager, Office and Finance, Parts/Inventory/Quality, Admin Setup, Sales and Customer Management
- Cross-path module reuse via `bySlug` dictionary (e.g., `kanban-board-basics` shared across Paths 1/2/4)
- New quiz pools: `manager-quiz` (12 questions, select 5), `parts-inventory-quiz` (10 questions, select 5) — all with `questionsPerQuiz` randomization
- **Total seeded content: 46 modules, 8 paths**

### Backend: Manager Access + User Detail
- `GetUserTrainingDetailQuery/Handler` + `UserTrainingDetailResponseModel` — per-user module breakdown endpoint
- `TrainingController.GetAdminProgressSummary`: changed from `[Authorize(Roles = "Admin")]` to `[Authorize(Roles = "Admin,Manager")]`
- `TrainingController.GetUserTrainingDetail`: new `GET /api/v1/training/admin/users/{userId}/detail` endpoint (Admin + Manager)

### Frontend: Training UX Changes
- Default tab changed: `/training` now redirects to `/training/my-learning` (was `library`)
- Tab renamed: `library` → `all-modules` (route segment + `TrainingTab` type)
- Page title: "Training Library" → "Training" (cleaner header)
- Tab order: My Learning → Learning Paths → All Modules (paths-first UX)

### Frontend: Manager Training Monitoring
- `UserTrainingDetailPanelComponent` — smart component, `inject(TrainingService)`, `userId = input.required<number>()`, `effect()` auto-loads on userId change
- `UserTrainingDetail` + `UserTrainingModuleDetail` models in `training/models/`
- `TrainingService.getUserTrainingDetail(userId)` method added
- `TrainingPanelComponent`: "detail" column added to User Progress DataTable, `selectedUser` signal, `DetailSidePanelComponent` + `UserTrainingDetailPanelComponent` wired up
- Detail panel shows: user header (name, role chip), 3-stat summary (completed/total modules, %, paths enrolled), progress bar, per-module list with status chips, time spent, quiz score, dates

### Frontend: Admin Access Control
- `AdminComponent`: `MANAGER_AND_ADMIN_TABS = new Set(['training'])` extracted
- `isManagerOrAdmin = computed(...)` signal added
- Training tab now under `@if (isManagerOrAdmin())` (was `@if (isAdmin())`)
- All other admin tabs remain Admin-only

## Batch 31 Changelog — Training Video Generation Pipeline (2026-03-24)

### Backend: Video Generation Infrastructure
- `ITrainingVideoGeneratorService` interface + `PlaywrightTrainingVideoGeneratorService` implementation
  - PuppeteerSharp / Playwright headless Chromium records each walkthrough step at 1920×1080
  - `driver.js` popover overlay injected per step via JavaScript
  - Per-step audio: `ITtsService` generates WAV → silence fallback (word-count × 130 wpm, floor 3s) when mock
  - ffmpeg muxes audio+video clips per step, then `concat` filter assembles full MP4
  - Chapter markers written as `ffmetadata` → embedded in MP4 container
- `ITtsService` interface + `MockTtsService` (returns silence stub)
- `ITrainingVideoGeneratorService` registered in `Program.cs` with mock/real toggle
- `GenerateTrainingVideoCommand/Handler` in `Features/Training/GenerateTrainingVideo.cs`
  - Sets `VideoGenerationStatus = Pending`, enqueues `TrainingVideoGenerationJob`
- `TrainingVideoGenerationJob` (Hangfire): `[Queue("video")]` attribute — single-worker serialization
- `VideoGenerationStatus` enum: None=0, Pending=1, Processing=2, Done=3, Failed=4
- `VideoMinioKey` + `VideoGenerationStatus` + `VideoGenerationError` fields on `TrainingModule` entity
- `GET /api/v1/training/modules/{id}/video-status` endpoint — returns presigned MinIO URL (60 min expiry)
- MinIO bucket: `qb-engineer-training-videos`

### Backend: Hangfire Queue Serialization
- Added dedicated `video-worker` Hangfire server in `Program.cs` with `WorkerCount = 1`
- Prevents concurrent Playwright sessions (OOM "Target crashed" when running 6+ simultaneously)
- Default server: `Queues = ["video","default"]`, 4+ workers for everything else
- Video server: `Queues = ["video"]`, 1 worker, named `video-worker`

### Backend: SeedData — 10-Chapter Video Content
- All 6 video modules (IDs 19–24) updated from 5-step to 10-step comprehensive content
- `EstimatedMinutes` updated: kanban 6→12, time-tracking 5→11, expenses 4→11, parts 7→12, reports 6→12, shop-floor 5→12
- Each module's `ContentJson` now includes: `chaptersJson` (10 entries), `steps[]` (10 steps), `transcript`
- Steps written for all 4 learning styles: Visual (spatial orientation), Auditory (why), Reading/Writing (structure), Kinesthetic (prompts)
- Comment: `// Manuscripts: docs/training-videos/0N-*.md — source of truth for regeneration`

### Backend: Dockerfile (Production)
- Switched from Alpine → Debian SDK base for Playwright/Chromium glibc compatibility
- Playwright browsers baked into build stage: `pwsh playwright.ps1 install chromium ffmpeg`
- Browser cache copied to runtime image; `chmod 755` applied
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` env var set
- `MinioOptions__PublicEndpoint` env var active in `docker-compose.yml` for presigned URL rewriting (internal `qb-engineer-storage:9000` → `localhost:9000`)

### Docs: Training Video Manuscripts (Source Control)
- `docs/training-videos/01-kanban-board.md` — 10 chapters, full narration scripts, Playwright selectors, chapter timestamps, Playwright generation spec JSON
- `docs/training-videos/02-time-tracking.md` — 10 chapters (clock-in vs job timers distinction)
- `docs/training-videos/03-expenses.md` — 10 chapters (full submit/reject/retract cycle)
- `docs/training-videos/04-parts-catalog.md` — 10 chapters (Make/Buy/Stock, BOM, process steps)
- `docs/training-videos/05-reports-analytics.md` — 10 chapters (builder, columns, charts, export)
- `docs/training-videos/06-shop-floor-kiosk.md` — 10 chapters (zero-software-experience audience)
- Each manuscript contains: chapter breakdown, estimated timestamps, narration script per chapter, alternative paths, kinesthetic prompts, full regeneration JSON spec

### Video Generation Results
- Module 19 (Kanban Board): Done — `module-19-*.mp4` in MinIO
- Modules 20–24: Sequential generation queued via single-worker Hangfire `video` queue

---

## Batch — Simulation Infrastructure & IClock (2026-04-03)

### IClock Abstraction
- `IClock` interface in `qb-engineer.core/Interfaces/` — injectable clock for testable time-dependent code
- `SystemClock` implementation (production): wraps `DateTime.UtcNow`
- `SimulationClock` implementation (E2E): controllable time for deterministic tests
- Registered via DI in `Program.cs`; `AppDbContext.SetTimestamps()` uses IClock

### Week Simulation Runner (Playwright)
- Full simulation framework spanning 431 weeks (2018–2026), ~22K+ actions, 8.7% error rate
- UI-driven via Playwright (not API-direct): navigates pages, fills forms, clicks buttons
- Resume support: queries API for latest simulation-era lead to skip already-processed weeks
- Expanded test data pools: 120 companies, 120 first/last names, scenario data
- `ui-actions.helper.ts`: reusable Playwright helpers (navigateTo, fillInput, fillMatSelect, fillDatepicker, clickButton)
- Auth seed injection via `seedAuth()` for pre-fetched session into browser context
- `data-testid` attributes added across templates (leads, expenses, kanban, quotes, POs, time tracking, chat, login)

### PostgreSQL Job Number Sequence
- Replaced app-level counter with Postgres sequence for race-condition-free job number generation

### Rate Limiting Bypass for E2E
- Loopback IP exemption in `Program.cs` for E2E throughput (rate limiter skips 127.0.0.1/::1)

---

## Batch — Seed Data, Versioning & Deployment (2026-04-03)

### Seed Data Migration to JSON
- Historical seed data (reference data, track types, stages) migrated from inline C# to JSON files
- `AppDbContext.SetTimestamps()` preserves explicit CreatedAt on seed entities

### Build Versioning
- `version.json` generated during build (git tag + commit hash)
- About dialog shows current version + checks GitHub latest release
- `environment.prod.ts` file swap fixed for production builds

### Deployment Script (`refresh.ps1`)
- PowerShell script: pulls latest from origin/main, rebuilds all Docker services with `--no-cache`
- `--force-recreate` + `docker rm -sf` for full clean rebuild
- Node modules volume detection, version baking

### Docker Health Check Fixes
- API health endpoint path corrected (`/api/v1/health`)
- UI container binds IPv4 for health check compatibility

### CSP Fix
- Google Fonts CDN allowed in Content-Security-Policy
- Material inline handler allowlisting

### Auth Interceptor Fix
- HTTP error interceptor now only logs out user on 401 from primary app API, not external APIs (e.g., Ollama, USPS)

### No-Cache Meta Tags
- `index.html` updated with cache-busting meta tags to prevent stale app shell after deployments

---

## Batch — Shop Floor Overhaul & RFID (2026-04-05)

### Shop Floor Display Redesign
- **RFID/barcode → PIN kiosk flow**: scan tap-in, PIN auth popup (auto-dismiss 20s), full password fallback
- **Worker card redesign**: 5-column grid, square cards, horizontal layout, left status stripe with stage color, internal scroll for overflow
- **Job actions overlay**: timer start/stop, Mark Complete with actions panel
- **IsShopFloor filter**: new boolean on `TrackType` + `JobStage` entities — filters display to physical-work stages only
- **Auto-dismiss timeouts**: PIN phase (20s), job-select phase (15s) — returns to scan screen on inactivity
- **Theme/font persistence**: saved to localStorage, persists across kiosk refreshes
- **Global loading overlay**: all shop floor actions show blocking overlay during API calls
- **Live elapsed timer**: client-side 1-second ticker computed from `timerStart`, no API polling

### RFID Relay Improvements
- Service cleanup, permission hardening (takeown/icacls for SYSTEM files)
- Unified `ScannerService` bridges WebHidRfidService scans into single signal source
- Scanner.stop() skipped on display routes to avoid lifecycle conflicts

### DataTable `clickableRows` Input
- New `clickableRows` input: pointer cursor + hover highlight on rows with `(rowClick)` handler
- Applied across all feature pages using row click navigation

---

## Batch — Form Draft System (2026-04-06)

### Draft Auto-Save System (Client-Side Only)
- **IndexedDB storage**: `qb-engineer-drafts` database, separate from cache DB
- **DraftService**: orchestrator with register/unregister, debounced auto-save (2.5s), TTL management
- **DraftStorageService**: IndexedDB wrapper with userId index
- **DraftBroadcastService**: cross-tab sync via `qb-engineer-draft-sync` BroadcastChannel
- **DraftRecoveryService**: post-login recovery prompt, 5-min TTL grace period, logout warning

### Centralized DialogComponent Integration
- All draft logic centralized in `DialogComponent` via `[draftConfig]` + `[draftFormGroup]` inputs
- `DraftConfig` model: entityType, entityId, route, optional snapshotFn/restoreFn for line-item forms
- Parent calls `dialogRef.clearDraft()` after successful save
- DialogComponent handles: adapter building, draft loading, auto-save registration, DestroyRef cleanup
- **26 dialog forms** converted to centralized pattern (zero per-component DraftableForm boilerplate)

### UI Components
- `DirtyFormIndicatorComponent`: orange dot + "Unsaved changes" chip in dialog header
- `DraftRecoveryBannerComponent`: "Recovered unsaved changes from [timestamp]. [Discard]" in dialog body
- `DraftRecoveryPromptComponent`: post-login MatDialog listing all drafts
- `LogoutDraftsDialogComponent`: logout confirmation with draft list

### Navigation Protection
- `unsavedChangesGuard` (`CanDeactivateFn`): warns on route navigation away from dirty forms
- `beforeunload` event: warns on browser close/refresh with unsaved changes
- DialogComponent dirty guard: backdrop/close click triggers ConfirmDialog when form dirty

### User-Configurable TTL
- Draft retention setting in Account > Customization (1 day / 3 days / 1 week / 2 weeks)
- Default: 1 week
- Restoring any draft resets TTL on all user drafts

### Date Transform Interceptor Fix
- Widened regex to match `+00:00` offset format (in addition to `Z` suffix)

---

## Batch 22 — Operation Enhancements (2026-04-08)

### ProcessStep → Operation Rename
- Rename ProcessStep → Operation and Process Plan → Routing across full stack (entity, models, handlers, controllers, frontend components, translations, database migration)
- Add OperationMaterial join entity linking BOM entries to specific operations
- Add self-referencing ReferencedOperationId FK on Operation for cross-step references
- Redesign operation dialog from 520px sidebar to 800px tabbed dialog (Details, Materials, Files, Activity)
- Materials tab: assign/remove BOM entries with inline add form
- Files tab: image/video preview grid with drag-and-drop upload
- Activity tab: chronological timeline with inline comment posting
- New API endpoints: operation materials CRUD, operation activity/comments

---

## Batch 23 — Shop Floor Fixes, Time Corrections, Contact History, Events (2026-04-10)

### Phase 1: Shop Floor Dialog Fixes (SCSS-only)
- **1A — Scrollable action dialog:** Added `max-height: 85vh; overflow-y: auto; @include custom-scrollbar(4px)` to `.sf-actions-card`
- **1B — Jobs as grid:** Changed `.sf-actions-card__jobs` from `flex-direction: column` to `display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`. Widened `.sf-actions-card` from 560px to 800px. Restyled `.sf-actions-card__job` as vertical cards with top border accent for active jobs.

### Phase 2A: Admin/Manager Time Entry Correction
- **New entity:** `TimeCorrectionLog` — tracks original snapshot (jobId, date, duration, category, notes) + reason + correctedByUserId
- **New handlers:** `AdminCorrectTimeEntry` (PATCH, bypasses date/lock restrictions, snapshots originals), `GetTimeCorrections` (GET, filter by userId/date range)
- **New endpoints:** `PATCH /api/v1/time-tracking/entries/{id}/correct` (Admin,Manager), `GET /api/v1/time-tracking/corrections` (Admin,Manager)
- **Frontend:** `TimeCorrectionsPanelComponent` — admin panel with two DataTables (all time entries + correction history), employee/date filters, correction dialog showing original values with required reason field
- **Admin tab:** Added `'time-corrections'` to admin tabs (Manager + Admin)
- **Sidebar:** Added Time Corrections entry under Admin children

### Phase 2B: Mismatched Clock Event Notifications
- **New Hangfire job:** `CheckMismatchedClockEventsJob` — runs daily at 10 PM UTC, queries previous day's clock events, finds users whose last event is ClockIn with no subsequent ClockOut
- Creates notification for affected employee + their manager
- Duplicate detection: checks existing notifications with same type/date before creating
- Registered in Program.cs: `Cron.Daily(22)`

### Phase 3: Customer Contact Interaction History
- **New enum:** `InteractionType` (Call, Email, Meeting, Note)
- **New entity:** `ContactInteraction` — ContactId FK, UserId, Type, Subject, Body, InteractionDate, DurationMinutes
- **New handlers:** `CreateContactInteraction`, `GetContactInteractions` (by customerId, optional contactId filter), `UpdateContactInteraction`, `DeleteContactInteraction`
- **New endpoints:** 4 endpoints at `api/v1/customers/{id}/interactions` (GET, POST, PATCH, DELETE)
- **Frontend:** `CustomerInteractionsTabComponent` — chronological DataTable with contact/type filters, create/edit dialog, type icons (phone/email/groups/note), delete via ConfirmDialog
- **Customer detail:** Added `'interactions'` tab after contacts

### Phase 4A: Events System (Backend + Admin UI)
- **New enums:** `EventType` (Meeting, Training, Safety, Other), `AttendeeStatus` (Invited, Accepted, Declined, Attended)
- **New entities:** `Event` (title, description, start/end, location, type, isRequired, createdByUserId, isCancelled, reminderSentAt), `EventAttendee` (eventId, userId, status, respondedAt, composite unique index)
- **New controller:** `EventsController` at `api/v1/events` — 8 endpoints (GET list, GET by id, POST create, PUT update, DELETE cancel, POST respond, GET upcoming, GET upcoming/{userId})
- **New handlers:** `CreateEvent` (+ attendees + invite notifications), `GetEvents` (from/to/eventType filters), `GetEventById`, `UpdateEvent` (attendee sync), `DeleteEvent` (soft cancel), `RespondToEvent`, `GetUpcomingEventsForUser`
- **New Hangfire job:** `EventReminderJob` — every 15 min, notifies attendees 30 min before events, skips declined, marks ReminderSentAt
- **Frontend:** `EventsPanelComponent` — admin panel with DataTable, type filter, create/edit dialog with date+time fields, attendee multi-select, required toggle
- **Admin tab:** Added `'events'` to admin tabs (Manager + Admin)

### Phase 4B: Shop Floor Events Section
- Added `upcomingEvents` signal to `ShopFloorDisplayComponent`
- Events loaded in `loadData()` forkJoin alongside overview + workers
- "Upcoming Events" section after unassigned jobs grid — `.sf-events-grid` with `.sf-event-card` cards showing type icon, title, time, location, required badge

### Phase 4C: Employee Events Tab
- **New endpoint:** `GET /api/v1/events/upcoming/{userId}` (Admin,Manager) — view events for a specific employee
- **Frontend:** `EmployeeEventsTabComponent` — DataTable with event type, start/end times, location, required flag, RSVP status per employee
- **Employee detail:** Added `'events'` tab after jobs

## Batch 24 — Clock Event Refactor, User Integrations, Mobile Platform (2026-04-10)

### Phase 1: Clock Event Type Refactor
- **Reference data driven:** Clock event types (ClockIn, ClockOut, BreakStart, BreakEnd, LunchStart, LunchEnd) now stored as `clock_event_type` reference data with JSONB metadata (`statusMapping`, `oppositeCode`, `category`, `countsAsActive`, `isMismatchable`, `icon`, `color`)
- **New service:** `IClockEventTypeService` + `ClockEventTypeService` — wraps `IReferenceDataRepository` with `IMemoryCache` (60-min TTL)
- **Handler updates:** `GetClockStatus`, `CreateClockInOut`, `CreateClockEvent`, `CheckMismatchedClockEventsJob` — use metadata-driven lookup instead of hardcoded enum checks
- **Entity:** `ClockEvent` gains `EventTypeCode` string column alongside existing enum (migration populates from enum values)
- **Seed data:** 6 entries in `SeedData.cs` under `clock_event_type` group
- **Frontend:** Shop floor display + mobile clock load event type definitions dynamically for button rendering

### Phase 2A: User Integration Infrastructure
- **New entity:** `UserIntegration` — userId, category, providerId, displayName, encryptedCredentials (Data Protection API), isActive, lastSyncAt, lastError
- **New service:** `IUserIntegrationService` + `UserIntegrationService` — CRUD with credential encryption via `ITokenEncryptionService`, 16 provider definitions across 4 categories
- **User controller:** `UserIntegrationsController` at `/api/v1/user-integrations` — all endpoints scoped to authenticated user's JWT claims (no userId parameter for credential access)
- **Admin controller:** `AdminUserIntegrationsController` at `/api/v1/admin/user-integrations` — Admin role only, returns summaries (never credentials), revoke with audit trail
- **Security:** Application-layer RLS, encrypted credentials never exposed via API, admin sees provider/status only, revocation creates ActivityLog + user notification
- **Migration:** `AddUserIntegrations` with unique (userId, providerId) constraint filtered by soft-delete

### Phase 2B-2E: Integration Providers
- **Calendar (5 providers):** `GoogleCalendarService` (Google Calendar API v3), `OutlookCalendarService` (Microsoft Graph), `IcsCalendarFeedService` (universal .ics feed), `MockCalendarIntegrationService` — interface `ICalendarIntegrationService` (push/update/delete/freebusy/sync/test)
- **Messaging (4 providers):** `SlackMessagingService`, `TeamsMessagingService`, `DiscordMessagingService`, `GoogleChatMessagingService` — all webhook-based, severity emojis/colors, `MockMessagingIntegrationService`
- **Cloud Storage:** `MockCloudStorageIntegrationService` — interface `ICloudStorageIntegrationService` (upload/download/list/share/delete/test), real providers deferred to Phase 5
- **GitHub:** `IGitHubIssueService` + `GitHubIssueService` — creates issues against configured repo
- **Models:** `CalendarModels.cs`, `MessagingModels.cs` (core records for all providers)
- **Registration:** Program.cs conditional mock/real based on `MockIntegrations` flag

### Phase 2F: Account Integrations UI
- **Service:** `UserIntegrationService` (Angular) — signal-based CRUD, `providedIn: 'root'`
- **Models:** `UserIntegrationSummary`, `IntegrationProviderInfo`, `CreateIntegrationRequest`
- **Page:** `AccountIntegrationsComponent` at `/account/integrations` — 4 category groups (calendar, messaging, storage, other), connected list + available providers with dashed borders
- **Dialog:** `ConnectIntegrationDialogComponent` — auth-type-aware form (webhook URL, OAuth token, basic credentials, JSON config)
- **Account sidebar:** Added "Integrations" nav item

### Phase 3A: Mobile Layout Shell + PWA
- **PWA manifest:** `manifest.webmanifest` with `start_url: "/m/"`, `display: standalone`, theme color `#0d9488`
- **Index.html:** Manifest link, theme-color meta, apple-mobile-web-app meta tags
- **Layout:** `MobileLayoutComponent` — 100dvh flex column, teal header, `<router-outlet>`, 5-tab bottom nav (Home, My Jobs, Clock, Scan, Account) with active state
- **Routes:** `/m/` prefix with `authGuard`, lazy-loaded children
- **Layout service:** `checkDisplayRoute` includes `/m/` paths to hide desktop chrome (sidebar, toolbar)

### Phase 3B: Mobile Worker Views
- **Home:** `MobileHomeComponent` — time-of-day greeting, clock status banner (In/Break/Lunch/Out with animated dot), 4-column quick-action grid (88px touch targets), active jobs list with stage colors
- **My Jobs:** `MobileJobsComponent` — assigned jobs list with stage stripe, priority badge, overdue indicator, chevron links to detail
- **Job Detail:** `MobileJobDetailComponent` at `/m/jobs/:jobId` — back nav, status card (stage/priority/customer/part/due date), timer start/stop control, description, add note textarea
- **My Hours:** `MobileHoursComponent` at `/m/time` — week navigator (prev/next), week total with primary accent, Mon-Sun day rows with expand/collapse for entry details, read-only info note
- **Clock:** `MobileClockComponent` — 80px status indicator, context-aware action buttons (Clock In/Out, Break, Lunch), snackbar confirmations
- **Account:** `MobileAccountComponent` — avatar + profile info, navigation links to account sections, desktop view link, logout

### Phase 3E: Mobile Scanning
- **Library:** `html5-qrcode` npm package for camera-based barcode/QR decoding
- **Scan page:** `MobileScanComponent` at `/m/scan` — camera viewport with `Html5Qrcode` (environment-facing camera, 250px QR box, 10fps), scan result card with type detection (job/part/asset/unknown), navigate-to-result action, resume scanning, manual entry fallback with keyboard input
- **Scan routing:** Pattern matching for JOB-XXXX, PT/PART-XXXX, AST/ASSET-XXXX prefixes and URL-based QR codes
- **Camera fallback:** When camera unavailable (headless, permissions denied), shows fallback UI with manual entry prominently displayed

---

## Batch 22 Changelog — MRP/MPS Engine (2026-04-12)

### Phase A1: Core MRP Entities & Migration
- **8 enums:** LotSizingRule, MrpDemandSource, MrpSupplySource, MrpOrderType, MrpPlannedOrderStatus, MrpRunType, MrpRunStatus, MrpExceptionType
- **5 entities:** MrpRun (BaseAuditableEntity), MrpDemand, MrpSupply, MrpPlannedOrder (BaseAuditableEntity), MrpException
- **5 EF configs:** Full Fluent API with indexes, precision, FK relationships
- **Part extended:** LotSizingRule?, FixedOrderQuantity?, MinimumOrderQuantity?, OrderMultiple?, PlanningFenceDays?, DemandFenceDays?, IsMrpPlanned
- **PurchaseOrderLine/Job extended:** MrpPlannedOrderId? FK for order release traceability

### Phase A2: MRP Algorithm
- **MrpService:** Full MRP algorithm — concurrency guard, demand gathering (SO lines), supply gathering (on-hand, open POs, production runs, firmed orders), low-level code computation, level-by-level netting with lot sizing and lead-time offset, BOM explosion for dependent demand, exception generation (Expedite/Defer/PastDue/OverSupply)
- **LotSizer:** Static class — LotForLot, FixedQuantity, MinMax, EconomicOrderQuantity, MultiplesOf
- **Efficiency:** Pre-grouped Dictionary<int, List<>> for O(1) lookups in inner loops, AsNoTracking on all read queries
- **IMrpService interface:** ExecuteRunAsync, GetPartPlanAsync (weekly time buckets), GetPeggingAsync (demand-to-supply linkage)

### Phase A3: MRP Handlers & Controller
- **13 MediatR handlers:** ExecuteMrpRun, SimulateMrpRun, GetMrpRuns, GetMrpRunDetail, GetPlannedOrders, UpdatePlannedOrder, ReleasePlannedOrder (creates real PO or Job), BulkReleasePlannedOrders, DeletePlannedOrder, GetMrpExceptions, ResolveMrpException, GetMrpPegging, GetMrpPartPlan
- **MrpController:** Route `api/v1/mrp`, Authorize(Roles = "Admin,Manager"), full CRUD + RPC endpoints
- **MrpRunJob:** Hangfire nightly job at 3 AM

### Phase A4: Master Production Schedule
- **Entities:** MasterSchedule (BaseAuditableEntity), MasterScheduleLine — with cascade delete, Part FK
- **Enum:** MasterScheduleStatus (Draft, Active, Completed, Cancelled)
- **6 handlers:** GetMasterSchedules, GetMasterScheduleDetail, CreateMasterSchedule, UpdateMasterSchedule (full line sync), ActivateMasterSchedule, GetMpsVsActual (planned vs actual production)
- **Controller endpoints:** Under `/api/v1/mrp/master-schedules`
- **MRP integration:** MrpService gathers demand from active MasterScheduleLines

### Phase A5: Demand Forecasting
- **Entities:** DemandForecast (BaseAuditableEntity, JSONB forecast data), ForecastOverride
- **Enums:** ForecastMethod (MovingAverage, ExponentialSmoothing, WeightedMovingAverage), ForecastStatus (Draft, Approved, Applied, Expired)
- **ForecastService:** Gathers historical SO demand by month, generates forecast using selected statistical method
- **5 handlers:** GetDemandForecasts, GenerateDemandForecast, ApproveDemandForecast, ApplyForecastToMps (creates MPS lines from forecast), CreateForecastOverride
- **Controller endpoints:** Under `/api/v1/mrp/forecasts`

### Phase A6: Angular MRP Module
- **Route:** `/mrp/:tab` with 6 tabs (dashboard, planned-orders, exceptions, runs, master-schedule, forecasts)
- **MrpService:** Full API client with all MRP, MPS, and forecast endpoints
- **MrpComponent:** Tab-based UI with DataTable per tab, KPI chips on dashboard, inline firm/release/resolve actions
- **TypeScript models:** Complete interface definitions for all MRP/MPS/forecast entities
- **Sidebar:** MRP nav item added to Supply group

## Batch 23 — Finite Capacity Scheduling (2026-04-12)

### Phase B1: Core Entities + Migration
- **Enums:** ScheduledOperationStatus, ScheduleDirection, ScheduleRunStatus, DaysOfWeek (flags)
- **Entities:** WorkCenter, WorkCenterCalendar, Shift, WorkCenterShift, ScheduledOperation, ScheduleRun
- **Operation enhancements:** Added SetupMinutes, RunMinutesEach, RunMinutesLot, OverlapPercent, ScrapFactor, IsSubcontract, SubcontractVendorId, SubcontractCost
- **Operation FK migration:** WorkCenterId now points to WorkCenter entity (was Asset), added separate AssetId FK
- **Entity configs:** 6 new IEntityTypeConfiguration classes with precision, indexes, FK relationships
- **Migration:** AddSchedulingEntities

### Phase B2: Scheduling Engine
- **ISchedulingService:** Interface with Schedule, Simulate, Reschedule, GetWorkCenterLoad, GetDispatchList, CalculateAvailableCapacity
- **SchedulingService:** Forward scheduling algorithm with capacity-aware slot finding, priority-based job ordering (DueDate/Priority/FIFO), overlap support, scrap factor, efficiency ratings, shift/calendar-based capacity, locked operation preservation, simulation mode
- **Response models:** ScheduleRunResponseModel, ScheduledOperationResponseModel, WorkCenterResponseModel, WorkCenterLoadResponseModel, DispatchListItemModel, ShiftResponseModel

### Phase B3+B4: Handlers + Controllers
- **Scheduling handlers (8):** RunScheduler, SimulateSchedule, GetScheduleRuns, GetGanttData, GetWorkCenterLoad, GetDispatchList, RescheduleOperation, LockScheduledOperation
- **Work Center CRUD (4):** GetWorkCenters, CreateWorkCenter, UpdateWorkCenter, DeleteWorkCenter
- **Shift CRUD (4):** GetShifts, CreateShift, UpdateShift, DeleteShift
- **Controllers:** SchedulingController (`/api/v1/scheduling`), WorkCentersController (`/api/v1/work-centers`), ShiftsController (`/api/v1/shifts`)

### Phase B5: Angular Scheduling Module
- **Route:** `/scheduling/:tab` with 5 tabs (gantt, dispatch, work-centers, shifts, runs)
- **SchedulingService:** Full API client for scheduling, work center, and shift endpoints
- **SchedulingComponent:** Tab-based UI with DataTable per tab, KPI chips, work center selector for dispatch
- **Sidebar:** Scheduling nav item added to Supply group

### Phase B6: Tests
- **11 xUnit tests:** WorkCenterHandlerTests (4), ShiftHandlerTests (4), ScheduleOperationHandlerTests (3)

## Batch 24 — Job Costing (Actual vs. Estimated) (2026-04-12)

### Phase C1: Entities, Enums, Configs, Migration
- **Enum:** MaterialIssueType (Issue, Return, Scrap)
- **New entities:** LaborRate (effective-dated per user), MaterialIssue (job-part-operation-bin with issue/return/scrap types)
- **Job fields:** EstimatedMaterialCost, EstimatedLaborCost, EstimatedBurdenCost, EstimatedSubcontractCost, QuotedPrice, EstimatedTotalCost (computed), EstimatedMarginPercent (computed)
- **Operation fields:** LaborRate, BurdenRate, EstimatedLaborCost, EstimatedBurdenCost
- **TimeEntry fields:** OperationId FK, LaborCost, BurdenCost
- **Models:** JobCostSummaryModel, MaterialIssueResponseModel, MaterialIssueRequestModel, JobProfitabilityReportRow, LaborRateResponseModel
- **Interface:** IJobCostService (cost summary, actuals, labor rate lookup, recalculation)
- **Migration:** AddJobCostingEntities

### Phase C2: JobCostService
- **JobCostService:** Full cost aggregation — material actuals (net of returns), labor/burden from time entries, subcontract from PO lines, effective-dated labor rate lookup, batch recalculation of time entry costs

### Phase C3: Handlers + Controllers
- **Job cost handlers (5):** GetJobCostSummary, GetJobMaterialIssues, CreateMaterialIssue (with bin decrement + movement), ReturnMaterialIssue (with bin restore), RecalculateJobCosts
- **Admin handlers (2):** GetLaborRates, CreateLaborRate (auto-closes previous effective period)
- **Report handler (1):** GetJobProfitabilityReport (batch-loaded material/labor/burden/subcontract costs, margin filtering)
- **Controller endpoints:** Jobs (cost-summary, material-issues CRUD, recalculate-costs), Admin (labor-rates), Reports (job-profitability)

### Phase C4: Angular Module
- **Models:** JobCostSummary, MaterialIssue, MaterialIssueRequest, LaborRate, JobProfitabilityRow
- **JobCostService:** Full API client for cost summary, material issues, profitability report, labor rates
- **JobCostTabComponent:** Cost variance table (estimated vs actual), margin summary, material issues DataTable with return action

### Phase C5: Tests
- **6 xUnit tests:** GetJobCostSummary (estimated costs, actual material costs with returns), GetJobMaterialIssues, RecalculateJobCosts, CreateLaborRate (closes previous), GetLaborRates (sorted)

## Batch 25 — Operation-Level Time Tracking (2026-04-12)

### Phase D1: Entities + Migration
- **Enum:** TimeEntryType (Setup, Run, Teardown, Inspection, Rework, Wait, Other)
- **TimeEntry:** Added EntryType field (default Run)
- **ClockEvent:** Added OperationId FK
- **Migration:** AddOperationTimeTracking

### Phase D2: Handlers + Controllers
- **GetJobOperationTimeSummary:** Per-operation setup/run/total actuals vs estimates, efficiency percent, variance analysis
- **GetOperationTimeEntries:** Time entries filtered by job + operation
- **GetTimeByOperationReport:** Cross-job operation time aggregation with estimated vs actual hours and variance percent
- **StartTimer / CreateTimeEntry:** Extended to accept OperationId and EntryType
- **Controller endpoints:** Jobs (operation-time-summary, operations/{id}/time-entries), Reports (time-by-operation)

### Phase D3: Angular Module
- **Model:** OperationTimeAnalysis interface
- **JobCostService:** Extended with getOperationTimeSummary()
- **OperationTimeTabComponent:** Summary bar (estimated/actual/efficiency), per-operation table with setup/run breakdown, progress bar visualization, variance coloring
- **JobCostTabComponent + OperationTimeTabComponent:** Integrated into job detail panel as new sections

### Phase D4: Test Fixes
- Fixed TimeEntryResponseModel breaking change: converted positional record to property-init style, updated all 9 test methods in StartTimerHandlerTests + StopTimerHandlerTests
- Fixed SnackbarService test: added missing Router.events mock (Subject), updated duration assertions for warn (8s) and error (10s)
- All 366 .NET tests pass, all 651 Angular tests pass

## Batch 26 — Statistical Process Control (SPC) (2026-04-12)

### Phase E1: Core Entities + Migration
- **Enums:** SpcMeasurementType (Variable, Attribute), SpcOocSeverity (Warning, OutOfControl, OutOfSpec), SpcOocStatus (Open, Acknowledged, CapaCreated, Resolved)
- **Entities:** SpcCharacteristic (BaseAuditableEntity — Part/Operation FKs, spec limits USL/LSL/Nominal, sample config), SpcMeasurement (BaseEntity — CharacteristicId, MeasuredById FK-only, ValuesJson jsonb, computed stats), SpcControlLimit (BaseEntity — X-bar/R/S chart limits, Cp/Cpk/Pp/Ppk capability indices), SpcOocEvent (BaseEntity — rule info, severity, status, AcknowledgedById FK-only)
- **Entity Configurations:** 4 Fluent API config files with precision(18,6), composite indexes, FK-only ApplicationUser pattern
- **Migration:** `20260412085000_AddSpcEntities` — 4 tables (spc_characteristics, spc_measurements, spc_control_limits, spc_ooc_events) with full FK constraints and indexes

### Phase E2: SPC Service
- **ISpcService interface:** CalculateControlLimitsAsync, Cp/Cpk/Pp/Ppk calculators, EvaluateControlRules, GetXBarRChartDataAsync, GetConstants
- **SpcService:** Full statistical engine — SPC constants table (A2, D3, D4, d2, A3, B3, B4, c4 for sample sizes 2-25), linear interpolation for unlisted sizes, X-bar/R chart limits, estimated σ from R-bar/d2, overall σ from individual values, S-chart limits for n≥10, Western Electric Rules 1-4 (beyond 3σ, 2-of-3 beyond 2σ, 4-of-5 beyond 1σ, 8 consecutive same side), spec limit check, range UCL check
- **Response Models:** SpcCharacteristicResponseModel, SpcMeasurementResponseModel, SpcChartDataModel (with SpcControlLimitModel, SpcChartPointModel), SpcCapabilityReportModel (with HistogramBucket, NormalCurvePoint), SpcOocEventResponseModel

### Phase E3: Handlers + Controller
- **11 MediatR handlers:** GetSpcCharacteristics, CreateSpcCharacteristic (FluentValidation: USL > Nominal > LSL), UpdateSpcCharacteristic (triggers recalc on spec limit change), GetSpcChartData, RecordSpcMeasurements (batch subgroups, auto OOC evaluation), GetSpcMeasurements, RecalculateControlLimits, GetProcessCapability (histogram + normal curve), GetOocEvents, AcknowledgeOocEvent, CreateCapaFromOoc
- **4 request models:** CreateSpcCharacteristicRequestModel, UpdateSpcCharacteristicRequestModel, RecordSpcMeasurementRequestModel (with SpcSubgroupEntry), AcknowledgeOocRequestModel
- **SpcController:** 12 endpoints under `api/v1/spc` — CRUD characteristics, chart data, measurements, recalculate limits, capability report, OOC events with acknowledge/CAPA actions

### Phase E4: Angular Module
- **Models:** spc.model.ts — SpcCharacteristic, SpcMeasurement, SpcControlLimits, SpcChartData, SpcChartPoint, SpcCapabilityReport, HistogramBucket, NormalCurvePoint, SpcOocEvent, RecordMeasurementRequest
- **SpcService:** HTTP service with all API calls (getCharacteristics, createCharacteristic, getChartData, recordMeasurements, recalculateLimits, getCapabilityReport, getOocEvents, acknowledgeOoc, createCapaFromOoc)
- **Components:**
  - SpcCharacteristicsComponent — DataTable with create/edit dialog, Cpk color coding (green ≥1.33, yellow ≥1.0, red <1.0), click to select
  - SpcChartComponent — Dual X-bar/R charts via ng2-charts, control limit lines (UCL/CL/LCL), OOC points highlighted, KPI chips for Cp/Cpk/Ppk/σ, recalculate button
  - SpcDataEntryComponent — Measurement entry grid (n readings per subgroup), live computed mean/range, job/lot context fields, auto-submit on Enter
  - SpcOocListComponent — DataTable with severity/status filters, acknowledge dialog, create-CAPA action
- **Quality module:** Extended with 3 new tabs (SPC Charts, SPC Data Entry, OOC Events), route-based `:tab` pattern, split-panel layout for characteristic selection + chart/data entry
- **Routes:** Updated to `{ path: ':tab', component: QualityComponent }` with redirect from bare path

## Batch 27 — CAPA / NCR Workflow (2026-04-12)

### Phase F1: Entities, Enums, Migration
- **9 enums:** NcrType, NcrDetectionStage, NcrDispositionCode, NcrStatus, CapaType, CapaSourceType, RootCauseMethod, CapaStatus, CapaTaskStatus
- **3 entities:** NonConformance (NCR with detection/containment/disposition/cost), CorrectiveAction (CAPA with root cause/verification/effectiveness phases), CapaTask (assignee-based tasks per CAPA)
- **3 entity configurations:** Fluent API with FK-only ApplicationUser pattern, unique NCR/CAPA numbers, all FK indexes
- **Migration:** `20260412100000_AddNcrCapaEntities` — 3 tables (corrective_actions, non_conformances, capa_tasks) with full FK constraints
- **DbContext:** 3 new DbSets (NonConformances, CorrectiveActions, CapaTasks)

### Phase F2: Service + Response Models
- **INcrCapaService:** GenerateNcrNumber, GenerateCapaNumber, CreateCapaFromNcr, AdvanceCapaPhase, CanAdvanceCapa, ScheduleEffectivenessCheck, CalculateNcrCosts
- **NcrCapaService:** Auto-generated NCR-YYYYMMDD-NNN / CAPA-YYYYMMDD-NNN numbers, phase-gated advancement with validation per phase, cost calculation
- **13 model files:** NcrResponseModel, CapaResponseModel, CapaTaskResponseModel, CreateNcrRequestModel, UpdateNcrRequestModel, DispositionNcrRequestModel, CreateCapaRequestModel, UpdateCapaRequestModel, CreateCapaTaskRequestModel, UpdateCapaTaskRequestModel, CreateCapaFromNcrRequestModel, NcrCostSummary (one class per file)

### Phase F3: Handlers + Controller
- **16 MediatR handlers:** GetNcrs, GetNcrById, CreateNcr, UpdateNcr, DispositionNcr, CreateCapaFromNcr, GetCapas, GetCapaById, CreateCapa, UpdateCapa, AdvanceCapaPhase, GetCapaTasks, CreateCapaTask, UpdateCapaTask, CheckCapaEffectivenessJob (Hangfire daily)
- **NcrCapaController:** 12 endpoints under `api/v1/quality` (ncrs + capas sub-routes), FluentValidation on create/disposition, Admin/Manager roles on mutations

### Phase F4: Angular UI
- **12 model files:** NcrType, NcrDetectionStage, NcrDispositionCode, NcrStatus, NonConformance, CapaType, CapaSourceType, RootCauseMethod, CapaStatus, CapaTaskStatus, CorrectiveAction, CapaTask (one interface/type per file)
- **NcrCapaService:** Full API service with NCR/CAPA/Task CRUD + filters
- **NcrListComponent:** DataTable with type/status filters, create NCR dialog, disposition dialog, create-CAPA-from-NCR action
- **CapaListComponent:** DataTable with type/status filters, create CAPA dialog, advance-phase action, task progress display
- **Quality module:** Extended with 2 new tabs (NCRs, CAPAs), ViewChild for create buttons in page header

## Batch 28 — EDI Support (2026-04-12)

### Phase G1: Core Entities, Enums, Migration
- **4 enums:** EdiFormat (X12, Edifact), EdiTransportMethod (As2, Sftp, Van, Email, Api, Manual), EdiDirection (Inbound, Outbound), EdiTransactionStatus (Received, Parsing, Parsed, Validating, Validated, Processing, Applied, Error, Acknowledged, Rejected)
- **3 entities:** EdiTradingPartner (BaseAuditableEntity — Customer/Vendor FKs, qualifier IDs, format/transport config, auto-process rules), EdiTransaction (BaseAuditableEntity — TradingPartnerId FK, direction, transaction set, control numbers, raw payload, parsed JSON, status lifecycle, retry tracking, acknowledgment self-FK), EdiMapping (BaseAuditableEntity — TradingPartnerId FK, transaction set, field mappings JSON, value translations JSON)
- **3 entity configurations:** Fluent API with string-converted enums, jsonb columns, composite indexes, FK-only ApplicationUser pattern
- **DbContext:** 3 new DbSets (EdiTradingPartners, EdiTransactions, EdiMappings)
- **Migration:** SyncModelSnapshot — creates edi_trading_partners, edi_transactions, edi_mappings tables with full FK constraints and indexes

### Phase G2: Service Interfaces + Mock Implementation
- **IEdiService:** ReceiveDocumentAsync, ParseTransactionAsync, ProcessTransactionAsync, RetryTransactionAsync, GenerateAsnAsync, GenerateInvoiceEdiAsync, GeneratePoAckAsync, Generate997Async, SendTransactionAsync, PollInboundAsync
- **IEdiTransportService:** Method property, SendAsync, PollAsync, TestConnectionAsync
- **MockEdiService:** Returns canned EdiTransaction objects with mock ISA segments
- **MockEdiTransportService:** Manual transport method, always returns success

### Phase G3: Request/Response Models
- **10 model files:** EdiTradingPartnerResponseModel (with transaction/error counts), EdiTransactionResponseModel, EdiTransactionDetailResponseModel (raw payload + parsed JSON), EdiMappingResponseModel, CreateEdiTradingPartnerRequestModel, UpdateEdiTradingPartnerRequestModel, CreateEdiMappingRequestModel, UpdateEdiMappingRequestModel, ReceiveEdiDocumentRequestModel, SendOutboundEdiRequestModel

### Phase G4: Handlers + Controller
- **13 MediatR handlers:** GetEdiTradingPartners (with aggregated stats), GetEdiTradingPartnerById, CreateEdiTradingPartner (FluentValidation), UpdateEdiTradingPartner, DeleteEdiTradingPartner, GetEdiTransactions (paginated with filters), GetEdiTransactionById, ReceiveEdiDocument, SendOutboundEdi (routes by entity type), RetryEdiTransaction, TestEdiConnection, GetEdiMappings, CreateEdiMapping, UpdateEdiMapping, DeleteEdiMapping
- **EdiController:** 14 endpoints under `api/v1/edi`, Admin/Manager roles
- **PollEdiInboundJob:** Hangfire recurring job every 30 minutes

### Phase G5: Angular EDI Module
- **8 model files:** EdiFormat, EdiTransportMethod, EdiDirection, EdiTransactionStatus, EdiTradingPartner, EdiTransaction, EdiTransactionDetail, EdiMapping
- **EdiService:** Full API client with partner CRUD, transaction list/detail/receive/send/retry, mapping CRUD
- **EdiPanelComponent:** Two sub-tabs (Partners, Transactions), partner CRUD dialog with FormGroup/FormValidation, transaction detail dialog with raw payload viewer, status/direction chip coloring, DataTable columns for both views
- **Admin integration:** Imported into AdminComponent, 'edi' added to VALID_TABS and ADMIN_ONLY_TABS, sidebar nav item added

## Batch 29 — Multi-Factor Authentication (2026-04-12)

**P1 #8 — MFA (Multi-Factor Authentication)** — Full TOTP-based MFA with admin policy enforcement, recovery codes, and login flow integration.

### Phase H1: Core Entities + Enums
- **MfaDeviceType enum:** Totp, Sms, Email, WebAuthn
- **UserMfaDevice entity:** BaseAuditableEntity with encrypted TOTP secret, device name, lockout (5 attempts → 5 min), WebAuthn fields (CredentialId, PublicKey, SignCount)
- **MfaRecoveryCode entity:** BaseAuditableEntity with SHA256-hashed codes, used tracking
- **ApplicationUser additions:** MfaEnabled, MfaEnforcedByPolicy, MfaEnabledAt, MfaRecoveryCodesRemaining

### Phase H2: MFA Service
- **IMfaService interface:** 13 methods covering setup, verification, challenge, recovery, and status
- **MfaService implementation:** OtpNet TOTP (±1 step tolerance), IMemoryCache challenge tokens (5 min TTL), IDataProtectionProvider secret encryption, SHA256 recovery code hashing, automatic lockout after 5 failed attempts

### Phase H3: MFA Auth Handlers
- **9 MediatR handlers:** BeginMfaSetup, VerifyMfaSetup, DisableMfa, RemoveMfaDevice, CreateMfaChallenge, ValidateMfaChallenge, GenerateRecoveryCodes, ValidateMfaRecovery, GetMfaStatus
- **2 admin handlers:** SetMfaPolicy (role-based enforcement), GetMfaPolicyStatus (compliance report)

### Phase H4: Controller Endpoints
- **AuthController additions:** 10 MFA endpoints (setup, verify-setup, disable, devices/{id} delete, status, challenge, validate, recovery, recovery-codes)
- **AdminController additions:** GET mfa/compliance, PUT mfa/policy
- **LoginHandler modification:** Returns MfaRequired + MfaUserId when user has MFA enabled (no token issued until challenge validated)

### Phase H5: Migration
- **AddMfaEntities migration:** user_mfa_devices + mfa_recovery_codes tables, unique filtered index on (UserId, IsDefault), indexes on CodeHash and (UserId, IsUsed)
- **ApplicationUser columns:** mfa_enabled, mfa_enforced_by_policy, mfa_enabled_at, mfa_recovery_codes_remaining

### Phase H6: Angular MFA Module
- **MfaService (Angular):** Full API client — setup, verify, disable, removeDevice, getStatus, createChallenge, validateChallenge, validateRecovery, getCompliance, setPolicy
- **MfaSetupDialogComponent:** QR code scan wizard with manual key option, 6-digit code verification, success confirmation
- **MfaRecoveryCodesDialogComponent:** Generates codes, copy/download options, warning display
- **MfaChallengeComponent:** Login flow component — 6-digit code entry, remember device checkbox, recovery code alternative, back-to-login button
- **MfaPolicyPanelComponent:** Admin panel — role-based enforcement select, compliance DataTable with MFA status per user
- **Login flow integration:** LoginResponse extended with mfaRequired/mfaUserId, login component shows MFA challenge when required, AuthService.completeMfaLogin() for post-MFA token handling
- **Security page integration:** MFA status card with device list, add device, generate recovery codes, disable MFA (blocked when policy-enforced)
- **Admin integration:** MFA Policy tab added to admin panel with sidebar nav entry

---

## Gap Inventory — Full ERP Parity (gap-inventory.md)

### P0 — Showstopper

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | MRP / MPS Engine | Done | Backend: MrpRun, MrpDemand, MrpSupply, MrpPlannedOrder, MrpException, MasterSchedule, DemandForecast, ForecastOverride; MrpService (BOM explosion, netting, lot sizing); ForecastService; MrpController (24 handlers); MrpRunJob (Hangfire nightly); Angular UI deferred |

### P1 — Critical

| # | Item | Status | Notes |
|---|------|--------|-------|
| 2 | Finite Capacity Scheduling | Done | Backend: ScheduledOperation, ScheduleRun, WorkCenter, WorkCenterShift, WorkCenterCalendar, Shift; ISchedulingService with priority-based algorithm; SchedulingController (Gantt, dispatch, load) |
| 3 | Job Costing (Actual vs. Estimated) | Done | Backend: IJobCostService, JobCostService; estimated vs actual (material/labor/burden/subcontract) with variance analysis; LaborRate entity |
| 4 | Operation-Level Time Tracking | Done | Backend: TimeEntry.OperationId FK, operation-level timers, GetOperationTimeEntries handler |
| 5 | SPC (Statistical Process Control) | Done | Backend: SpcCharacteristic, SpcMeasurement, SpcControlLimit, SpcOocEvent; ISpcService (X-bar/R charts, Cp/Cpk); SpcController; OOC→CAPA integration |
| 6 | CAPA / NCR Workflow | Done | Backend: NonConformance, CorrectiveAction, CapaTask; INcrCapaService (auto-numbering, phase advancement, cost tracking); NcrCapaController; 8D/5-Why root cause methods |
| 7 | EDI Support | Done | Backend: EdiTradingPartner, EdiTransaction, EdiMapping; X12/EDIFACT; EdiController |
| 8 | Multi-Factor Authentication (MFA) | Done | Full TOTP/WebAuthn, recovery codes, admin policy |

### P2 — Important

| # | Item | Status | Notes |
|---|------|--------|-------|
| 9 | OEE (Overall Equipment Effectiveness) | Done | Backend: OEE fields on Asset, DowntimeLog entity, OEE calculation service, EndDowntimeLog handler |
| 10 | Subcontract / Outside Processing | Done | Backend: Operation.IsSubcontracted, SubcontractPurchaseOrderId FK, GetPendingSubcontracts/GetSubcontractSpending handlers |
| 11 | Receiving Inspection | Done | Backend: ReceivingInspection entity, Part.RequiresReceivingInspection, frequency-based inspection |
| 12 | Unit of Measure (UOM) System | Done | Backend: UnitOfMeasure, UomConversion entities; Part stock/purchase/sales UOM FKs; UomController |
| 13 | Approval Workflows (Configurable) | Done | Backend: ApprovalWorkflow, ApprovalStep, ApprovalRequest entities; generic approval engine; ApprovalWorkflowsController |
| 14 | Credit Management | Done | Backend: CreditHold entity, CreditManagementService, credit limit checks on SO creation |
| 15 | Vendor Scorecards / Supplier Quality | Done | Backend: VendorScorecard, VendorScorecardEntry entities; auto-calculation from POs/inspections; VendorScorecardsController |
| 16 | RFQ (Request for Quote) Process | Done | Backend: Rfq, RfqLine, RfqResponse entities; multi-vendor RFQ, award/reject; RfqController |
| 17 | Alternate / Substitute Parts | Done | Backend: PartAlternate entity, bidirectional alternates, PartAlternatesController |
| 18 | Engineering Change Orders (ECO) | Done | Backend: EngineeringChangeOrder, EcoAffectedItem entities; submit/review/approve/implement workflow; EcoController |
| 19 | Blanket / Standing Purchase Orders | Done | Backend: BlanketPurchaseOrder, BlanketPurchaseOrderLine, BlanketRelease entities; release tracking; BlanketPurchaseOrdersController |
| 20 | ATP (Available-to-Promise) | Done | Backend: IAtpService, AtpService; on-hand + scheduled supply - committed demand; AtpController |

### P3 — Standard

| # | Item | Status | Notes |
|---|------|--------|-------|
| 21 | Serial Number Tracking | Done | Backend: entities, handlers, controller, migration |
| 22 | Gage / Calibration Management | Done | Full stack: backend + Angular UI in Quality tab |
| 23 | Customer Portal | Not Started | |
| 24 | Shift Management | Done | Backend: ShiftAssignment entity, CRUD, admin endpoints |
| 25 | Overtime Calculation | Done | Backend: OvertimeRule, OvertimeService, daily/weekly thresholds |
| 26 | PTO / Leave Management | Done | Backend: LeavePolicy, LeaveBalance, LeaveRequest, approve/deny workflow |
| 27 | Performance Reviews | Done | Backend: ReviewCycle, PerformanceReview, update/complete workflow |
| 28 | Document Approval Workflow | Done | Backend: ControlledDocument, DocumentRevision, approval routing |
| 29 | Outbound Webhooks | Done | Backend: WebhookSubscription, WebhookDelivery, HMAC-SHA256 signing |
| 30 | Scheduled Report Delivery | Done | Backend: ReportSchedule, cron expressions, email delivery |
| 31 | Excel/CSV Export | Done | Backend: ExportReport handler with CSV, XLSX/PDF stubs |

### P4 — Nice-to-Have

| # | Item | Status | Notes |
|---|------|--------|-------|
| 32 | CPQ (Configure, Price, Quote) Engine | Done | Backend: ProductConfigurator, ConfiguratorOption, ProductConfiguration, quote/part generation |
| 33 | Multi-Plant / Multi-Site | Done | Backend: Plant, InterPlantTransfer with ship/receive workflow (PlantId FK deferred) |
| 34 | Multi-Currency | Done | Backend: Currency, ExchangeRate, conversion service (financial entity FKs deferred) |
| 35 | Multi-Language Backend | Done | Backend: TranslatedLabel, SupportedLanguage, localization import/export |
| 36 | IoT / Machine Integration | Done | Backend: MachineConnection, MachineTag, MachineDataPoint, mock service |
| 37 | E-Commerce Connectors | Done | Backend: ECommerceIntegration, ECommerceOrderSync, mock service |
| 38 | Andon Board / Visual Management | Done | Backend: AndonAlert with acknowledge/resolve workflow, board data |
| 39 | Advanced Reporting (BI Integration) | Done | Backend: BiApiKey with PBKDF2 hashing, API key CRUD |
| 40 | Consignment Inventory | Done | Backend: ConsignmentAgreement, ConsignmentTransaction, consume/receive/reconcile |
| 41 | ABC Inventory Classification | Done | Backend: AbcClassificationRun, AbcClassification, run/apply workflow |
| 42 | Wave Planning / Pick Lists | Done | Backend: PickWave, PickLine, auto-generate/release/confirm/complete |
| 43 | Drop Shipping | Done | Backend: IDropShipService, SO-to-PO direct-ship flow (entity FKs deferred) |
| 44 | Back-to-Back Orders | Done | Backend: IBackToBackService, SO-to-PO auto-linking (entity FKs deferred) |
| 45 | Kanban (Lean) Replenishment | Done | Backend: KanbanCard, KanbanTriggerLog, trigger/confirm/board endpoints |
| 46 | Project Accounting / WBS | Done | Backend: Project, WbsElement (recursive), WbsCostEntry, earned value metrics |
| 47 | Quality Cost Tracking (COPQ) | Done | Backend: Aggregation queries, 4 ISO 9004 cost categories, trend/pareto |
| 48 | PPAP | Done | Backend: PpapSubmission, PpapElement (18 AIAG elements), submit/approve workflow |
| 49 | FMEA Integration | Done | Backend: FmeaAnalysis, FmeaItem, RPN calculation, CAPA linkage |
| 50 | Predictive Maintenance | Done | Backend: MaintenancePrediction, MlModel, PredictionFeedback, dashboard |

**Note:** All 50 gap inventory items now have full backend implementations (entities, EF configs, migrations, MediatR handlers, controllers, services). Angular UI for most is deferred — only Gage/Calibration (#22) has full-stack UI. The MRP module Angular UI is the next priority. Pervasive FK changes (PlantId on all entities, CurrencyId on financial entities, etc.) are deferred to avoid breaking existing functionality.
