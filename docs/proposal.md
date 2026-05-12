# Forge

## Open Source Manufacturing Operations Platform

### Production · R&D Workflow · Job Tracking · Engineer Focus Dashboard

Version 2.0 | March 2026 | GNU Licensed

---

## 1. Executive Summary

Small and mid-size manufacturers commonly operate with QuickBooks as their primary business system. While QuickBooks handles financial reporting adequately for accounting staff and external CPAs, it does not align with the day-to-day operational reality of a production shop. It does not support production job tracking, R&D tooling workflows, CAD/STL file management, cycle-based work planning, or the focused work patterns required by engineering teams.

Forge is a purpose-built operational companion application — a locally hosted, containerized web application that sits alongside QuickBooks rather than replacing it. QuickBooks remains the financial system of record. Forge becomes the operational system of record: managing jobs, production workflow, R&D iterations, CAD file attachments, production traceability, lead management, and a focus-oriented engineer dashboard.

The application is built on proven open-source technology, runs entirely in Docker containers on local infrastructure, and carries no ongoing SaaS fees or vendor dependencies. It is open-sourced under the GNU license and designed to be company-agnostic — all branding, workflows, and configurations are user-defined.

---

## 2. Problem Statement

The following pain points are common in small manufacturing operations:

- **QuickBooks is not designed for manufacturing operations.** It thinks in accounting primitives (debits, credits, chart of accounts) rather than shop primitives (jobs, materials, machines, deadlines).
- **No job tracking system** connecting quotes, production runs, quality holds, and shipping in a single workflow.
- **R&D and tooling work lacks a structured workflow.** Iterations, test results, and CAD file versions are managed ad hoc.
- **CAD, STL, and CAM files have no attachment mechanism** connected to jobs or parts. File management is disconnected from work management.
- **Engineers struggle with focus and task prioritization** when using complex multi-screen systems. Current tooling does not accommodate focused work patterns.
- **The QuickBooks interface is not approachable for shop-floor staff**, resulting in errors, avoidance, and workarounds.
- **No lead management** for potential customers before they become accounting system customers.
- **No production traceability** for lot tracking, material traceability, or quality records.
- **No cycle-based work planning** for organizing and curating work across planning cycles.

---

## 3. Proposed Solution

A locally hosted, containerized web application with the following architecture:

### 3.1 System Architecture

| Component | Technology |
|---|---|
| Frontend | Angular 21 + Angular Material |
| Backend | .NET 9 Web API |
| Database | PostgreSQL + pgvector |
| File Storage | MinIO (local S3-compatible object storage) |
| 3D Viewer | Three.js (STL inline rendering) |
| Real-time Sync | SignalR (WebSocket pub-sub) |
| Containerization | Docker Compose |
| Authentication | ASP.NET Identity (JWT bearer tokens) |
| Accounting Integration | Pluggable — QuickBooks Online (default), extensible to Xero, Sage, etc. |

### 3.2 Docker Compose — 7 Containers (AI optional)

| Container | Purpose |
|---|---|
| `forge-ui` | Nginx serving Angular build, proxies API calls |
| `forge-api` | .NET 9 Web API, QB integration, business logic |
| `forge` | PostgreSQL + pgvector with persistent volume |
| `forge-storage` | MinIO with persistent volume |
| `forge-backup` | Scheduled backup jobs (pg_dump + rclone) |
| `forge-ai` | Ollama LLM runtime (optional -- app works without it) |
| `forge-backup-target` | MinIO replica on secondary machine (separate compose) |

### 3.3 Relationship to Accounting Systems

The external accounting system (QuickBooks Online by default) is retained as the financial system of record. The application avoids data duplication — it reads and writes to the accounting system for all financial entities (customers, vendors, items, estimates, sales orders, purchase orders, invoices, payments, employees, time activities).

The application owns only what the accounting system cannot handle: Kanban board state, job card operational fields, file attachments, activity logs, leads, assets, production traceability, planning cycle management, and custom workflows.

**Pluggable accounting integration:**
- `IAccountingService` defines a common interface for all accounting operations
- **QuickBooks Online is the default** provider — pre-selected in admin setup, first and most complete implementation
- Additional providers (Xero, FreshBooks, Sage, etc.) can be added by implementing the same interface
- The admin setup wizard lets the operator select their accounting system and complete provider-specific setup (OAuth, API keys, first sync)
- The app works in **standalone mode** without any accounting provider — all financial sync features degrade gracefully

**Key integration patterns:**

- All accounting write operations go through a persistent sync queue — if the accounting system is unavailable, operations queue up and the app continues working
- Accounting data is cached locally with timestamps — the app never shows blank screens due to provider downtime
- Orphan detection runs periodically to flag references to accounting records that no longer exist
- A system health panel surfaces connection status, queue depth, failed operations, and cache freshness
- `MOCK_INTEGRATIONS=true` environment variable swaps all accounting calls to local mock responses during development

### 3.4 Deployment Flexibility

The application is designed for on-premise deployment initially — Docker Compose on a local machine, accessed via browser on the LAN. However, the containerized architecture is inherently cloud-ready:

- All configuration via environment variables and appsettings.json — no hardcoded hostnames or paths
- Health check endpoints on the API for orchestrator liveness/readiness probes
- Stateless API — horizontal scaling supported
- MinIO is S3-compatible — can be swapped for any S3 provider in cloud deployments
- PostgreSQL can be replaced with a managed database service (Azure Database for PostgreSQL, AWS RDS, etc.)
- Same Docker images run on: Docker Compose (local), Kubernetes, Azure Container Apps, AWS ECS, Google Cloud Run, or any Docker host

No code changes required to move from on-premise to cloud. Only configuration changes.

### 3.5 Open Source Design

- GNU licensed, no company-specific code committed
- All branding, company names, and logos configurable in system settings
- Default seed data is generic — track types, stages, and roles are sensible defaults that can be modified
- SMTP provider, calendar, backup targets all configurable
- Accounting integration is pluggable — QuickBooks Online is the default, additional providers can be added, and the app functions in standalone mode without any accounting system

---

## 4. Application Modules

### 4.1 Kanban Board — Configurable Track Types

The core of the application is a Kanban-style job board with configurable workflow tracks.

**Built-in Track Types:**

**Production Track** (aligned to accounting document lifecycle):

| Stage | Accounting Document |
|---|---|
| Quote Requested | — |
| Quoted | Estimate created |
| Order Confirmed | Estimate → Sales Order |
| Materials Ordered | Purchase Order(s) created |
| Materials Received | PO marked received |
| In Production | — |
| QC / Review | — |
| Shipped | Sales Order → Invoice |
| Invoiced / Sent | Invoice delivered |
| Payment Received | Payment recorded |

**R&D / Tooling Track:**
Concept → Design → CAD Review → Prototype / Test → Iteration → Tooling Approval → Handoff to Production

**Maintenance Track:**
Reported → Assessed → Parts Ordered → Scheduled → In Progress → Completed → Verified

**Other (generic):**
Open → In Progress → Done

**Custom Track Types:**
Administrators can create new track types with custom names, colors, icons, stage sequences, and per-track custom fields. Custom fields are defined using a JSON template system — no schema changes required.

**Card Movement Rules:**
- Cards move freely forward and backward unless an accounting document at that stage is irreversible
- Irreversible stages (Invoice, Payment): drag is blocked with an explanation
- Reversible accounting stages (Estimate, Sales Order, unfulfilled PO): backward move triggers a double confirmation showing the specific accounting document that will be voided, including reference number, customer, and dollar amount
- Both confirmations are logged in the audit trail

**Bulk Operations:**
Multi-select cards via Ctrl+Click or a toolbar toggle for selection mode. Available on both the board and list views. Bulk actions include: Move to Stage (select target stage), Assign To (select user), Set Priority (select level), and Archive. A floating action bar appears when cards are selected showing the count and available actions. Selection persists across stage columns on the board view. Confirmation dialog summarizes the operation before executing (e.g., "Move 5 cards to In Production?"). All bulk changes are individually logged in the audit trail.

**Board Scope:**
The Kanban board shows only planned work that is active. All cards (active, archived, backlog) are accessible from the full task list view.

### 4.2 Job Card Detail

Each card contains:

**Universal fields (all track types):**
- Title, description
- Customer or asset reference (depending on track type)
- Due date and priority flag
- Assigned user(s)
- File attachments (versioned by revision)
- Activity log (timestamped history of all changes)
- Subtasks (lightweight checklist: text, optional assignee, done/not done)
- Linked cards (related to, blocks/blocked by, parent/child)
- Time entries
- Accounting document references and billing status (read-only)

**Custom fields (per track type):**
Defined via JSON template. Supported types: text, number, boolean, date, select, multiselect, textarea. Rendered dynamically by Angular form generator.

**R&D-specific:**
- Iteration counter
- Per-revision test results and notes
- Approval gate before production handoff

**Production traceability:**
- Production runs tab (multiple runs per job)
- Lot number, material lot, machine, operator, quantity produced/rejected
- QC sign-off with checklist
- Traceability profile controls which fields are required (see Section 4.12)

**Activity Log UI:**
The activity log on each job card is rendered as a vertical timeline showing every change to the card. Each entry displays the user, timestamp, and old-to-new values for the changed field. Entries are color-coded: blue for user actions (stage moves, field edits, assignments), gray for system events (accounting document created, sync completed, auto-archive). Inline comments with @mentions are interspersed in the timeline — posting a comment is a single text input at the top of the log. @mentions trigger a notification to the referenced user. The timeline is filterable by action type (stage changes, field edits, comments, system events, file uploads) via filter chips above the log. Long timelines paginate with "Load older" at the bottom. The same activity log component is reused on part records, assets, and leads.

### 4.3 Part / Product / Assembly Catalog

A structured part catalog with recursive Bill of Materials (BOM) supporting assemblies nested to any depth. CAD/STL files attach at the part level. Parts link to accounting system items for pricing.

**Part record:**
- Part number (auto-generated or manual), description
- Revision level (A, B, C or 1, 2, 3)
- Status: Draft, Active, Obsolete
- Part type: Part or Assembly
- Material/resin specification
- Mold/tool reference (links to asset)
- Accounting item linkage (external ID) for pricing/invoicing — pricing read-only from accounting system
- Customer(s) who order this part
- Default traceability profile
- Custom fields (same JSON system)
- CAD/STL/CAM files attached at the part level, versioned by revision

**Recursive BOM structure:**
Parts can be components of assemblies. Assemblies can contain sub-assemblies to the nth tier:

```
Assembly A (top-level product)
├── Sub-Assembly B (qty: 2)
│   ├── Part C - Molded housing (qty: 1)
│   ├── Part D - Insert pin (qty: 4)
│   └── Part E - Gasket (qty: 1)
├── Sub-Assembly F (qty: 1)
│   ├── Part G - Cover plate (qty: 1)
│   └── Sub-Assembly H (qty: 1)
│       ├── Part J - Spring (qty: 2)
│       └── Part K - Bushing (qty: 1)
└── Part L - Fastener kit (qty: 1)
```

Each BOM entry includes: child part reference, quantity, reference designator (optional), sort order, source type (In-House / Purchased — admin can relabel), and notes.

**Part detail screen:**
- Specs, material, mold reference, accounting item link
- Files tab — CAD/STL/CAM versioned by revision with inline STL viewer
- BOM tab — interactive expandable/collapsible tree view to any depth
- Where Used — reverse lookup showing which assemblies contain this part
- Job history — all jobs that produced this part
- Revision history — full change log with change descriptions

**Revision control:**
- Each revision can have its own files (updated drawings, new STL)
- Releasing a new revision preserves the full history
- Jobs reference a specific part revision so production records are exact
- Obsolete revisions cannot be used on new jobs

**How parts connect to jobs:**
- Job card references a part (or assembly) instead of having specs typed in each time
- "New production run for Part #12345 Rev C" → card pre-populates with specs, material, mold, files, traceability profile
- Repeat orders are instant — no re-entering specifications
- For assembly jobs, the BOM shows required components

**How parts connect to R&D workflow:**
- R&D / Tooling track cards can create or update a part record as their output
- When an R&D card reaches "Tooling Approval" or "Handoff to Production," the associated part's status is set to Active
- R&D iteration notes, test results, and file revisions feed into the part's revision history
- Flow: R&D card (design work) → produces/updates a Part → Part is used on Production cards (manufacturing)

**How parts connect to QB:**
- Each part/assembly can link to an accounting item by external ID
- Estimates and Invoices reference the accounting item for pricing
- Parts without an accounting item link can exist in the catalog (internal components not sold individually)

### 4.4 CAD / STL / CAM File Management

Each job card maintains a structured file panel organized by revision:

| File Type | Notes |
|---|---|
| .STEP / .F3D / .SLDPRT | Native CAD files, all revisions retained |
| .STL | Mesh files; inline 3D preview via Three.js |
| .NC / .TAP | CNC/CAM toolpaths |
| .PDF | Drawings, specs, customer documents |
| .JPG / .PNG | Photos of parts, test results, defect documentation |
| Notes (inline) | Per-revision freeform notes |

Files are stored in MinIO. The database stores metadata (filename, revision, uploader, timestamp, job association). Files are never deleted — only superseded by newer revisions.

**STL Viewer:** Reusable Angular component wrapping Three.js. Rotate, zoom, pan, wireframe toggle, full-screen expand. Lazy-loaded to minimize bundle size.

**File access:** Default open to all authenticated users. Optional per-file restriction (toggle on, pick users/roles). Employee documents are always restricted.

**File size:** No limit by default. Configurable limit available in system settings. Chunked upload with progress bar for large files.

### 4.5 Customizable Dashboard

A widget-based dashboard with role-appropriate defaults and full per-user customization.

**Role-based default layouts:**
Each role gets a sensible starting dashboard. Users can rearrange, add, remove, and resize widgets to build their own view. Layout saved per-user.

- **Engineer default:** Daily priorities, assigned jobs, overdue items, recent activity, cycle progress, notifications
- **PM default:** Backlog count, cycle progress chart, overdue jobs, lead pipeline, team workload, notifications
- **Manager default:** Team overview, expense approvals pending, cycle progress, overdue, notifications
- **Admin default:** System health summary, user activity, accounting sync status, storage usage, notifications

**Production Worker** does not use the dashboard — they get the simplified task list view.

**Available widgets include:** daily priorities, assigned jobs, overdue jobs, cycle progress/progress chart, backlog count, recent activity, lead pipeline, team workload, expense approvals, maintenance due, my time summary, notifications feed, system health (admin).

**Daily Priority Card:**
- Top 3 tasks for today
- Count of jobs needing action
- Time-based prompts for approaching deadlines
- Upcoming maintenance due dates

**End-of-Day Prompt:**
At a configurable time, an overlay prompts: "What are your top 3 for tomorrow?" — locking in the next day's priorities.

**Screensaver / Ambient Mode:**
On idle, the browser enters a full-screen ambient display showing current priorities in large, readable format. Restores on mouse movement.

**Combined view for solo operators:**
When one person wears all hats, the default layout combines widgets from all roles: today's priorities (engineer), backlog/cycle status (manager), uninvoiced jobs and expense summary (owner), active leads (sales). The user can customize from there.

### 4.6 Planning Cycle Management

**Planning cycle cadence:**
- Default 2-week duration (configurable)
- Day 1 is Planning Day

**Planning Day flow:**
1. **Maintenance due this cycle** — system scans asset schedules, prompts to auto-create and assign cards
2. **Rollover** — unfinished tasks from previous cycle: keep, return to backlog, or archive
3. **Backlog curation** — split-panel screen: prioritized backlog (left), this cycle (right). Drag to commit.
4. **Cycle goals** — optional freeform text displayed on dashboard for the duration

**Backlog:**
- New jobs arrive in backlog by default
- Prioritized list — drag to reorder
- Badge count in nav
- Any user with PM/Manager/Admin role can curate

**Cycle visibility:**
- Dashboard shows cycle number and day count
- End-of-cycle summary: committed vs. completed, rollover rate

### 4.7 Lead Management

Leads represent potential customers before they exist in the accounting system.

**Lead record:**
- Company name, contacts (multiple), source, status, notes, files
- Custom fields via JSON template (same system as track types and customers)
- Statuses: New → Contacted → Quoting → Converted → Lost

**Conversion:**
- "Convert to Customer" creates a customer in the accounting system via API and links records
- "Convert and Create Job" does both in one step
- Internal quotes can auto-generate an Estimate in the accounting system on conversion
- All lead history preserved and linked to the customer record

**Lost leads:** Reason captured (price, capability, timing, competitor, no response). Searchable, can be reopened.

### 4.8 Customer & Contact Management

**Customers** are read/written from the accounting system — no duplication. The app displays accounting data and adds operational context.

**Contacts:**
- Multiple contacts per customer or lead, no limit
- Fields: name, title, phone, email, role tag (Primary, Technical, Billing, Shipping, Other)
- Sortable — drag to reorder, most-used contacts at top
- Auto-sort suggestion based on usage frequency
- Primary contact syncs to/from QB; additional contacts live in the app
- Contacts carry over from lead to customer on conversion

**Customer custom fields:** Same JSON template system. Configurable by admin.

### 4.9 Vendor Management

Vendors are read-only from the accounting system — no local creation, editing, or deletion. The app displays vendor data from the accounting cache and provides operational context.

**Vendor list:** Searchable, sortable table of all vendors synced from the accounting system. Filterable by status (active/inactive). Search matches on vendor name, company name, email, and phone.

**Vendor detail (read-only):**
- Company name, contact info, address, terms, balance — all from accounting cache
- **Linked Purchase Orders** — all POs issued to this vendor with status, dates, and totals
- **Linked Parts** — parts where this vendor is set as the preferred vendor (see Part Catalog)
- Last synced timestamp with manual refresh button

**No local vendor creation:** Vendors must be created in the accounting system. The app's vendor list updates on the next sync cycle. If a user needs a vendor that does not exist, the UI displays a prompt directing them to create it in the accounting system first.

### 4.10 Expense Capture

**Engineer experience — 5 questions:**
1. What was it for? (category dropdown)
2. How much? (dollar amount)
3. Which job? (optional job picker)
4. Snap the receipt (camera/file upload to MinIO)
5. Notes (optional)

**Approval:**
- Per-user setting: `canSelfApproveExpenses` (boolean) and `selfApprovalLimit` (dollar threshold, nullable)
- Self-approved: expense writes to accounting system immediately
- Not self-approved: goes to approval queue for Manager/Admin
- Bulk approve option for multiple small items

**Expense history:** Searchable, filterable, role-scoped (engineers see own, managers see all). Export to CSV.

### 4.11 Invoice Workflow

**System setting:** `invoiceWorkflow` — `direct` or `managed`

**Direct mode (solo operator):**
- Job hits Shipped → engineer confirms "Ready to invoice"
- App shows confirmation with Sales Order details from QB
- Engineer can adjust line items
- Double confirmation → Invoice created in accounting system via API
- Card auto-advances

**Managed mode (with office manager):**
- Engineer confirms ready → goes to office manager queue
- Office manager reviews, creates invoice, or sends back with notes

**Nudge system:**
- Escalating visual urgency for shipped-but-not-invoiced jobs
- 0–2 days: informational | 3–5 days: yellow | 5+ days: red
- Surfaces on dashboard

**Billing visibility (read-only on card):**
- Total order amount, deposits, progress billed, remaining balance, payment status
- All from accounting cache, no edit capability

### 4.12 Production Traceability

Data model supports FDA 21 CFR Part 820 / ISO 13485 level traceability. Low friction by default, full rigor when needed.

**Traceability profiles** (JSON templates) control which fields are required per job:

**Standard profile (default):**
- Lot number, material lot, machine, operator, quantity, QC pass/fail

**Medical / regulated profile:**
- Full device history record: incoming inspection, certificate of conformance, process parameters (temperature, pressure, cycle time), in-process inspection, dimensional results, final QC checklist, sample retention, packaging/labeling

**Profile assignment:** At customer level (all jobs for this customer), job level (override), or track type level (default).

**Production runs:** Multiple runs per job card. Each run logs lot number, material, machine, operator, quantities, QC results.

**QC checklists:** Defined per part/mold as reusable templates. Inspector checks items, system timestamps and logs identity.

**Lot lookup:** Search by lot number → full forward and backward traceability chain from raw material to customer shipment.

### 4.13 Asset / Equipment Registry

**Asset record:** Name, type (Machine, Tooling, Facility, Vehicle, Other), location, manufacturer, model, serial number, status (Active, Down, Retired), photo, notes.

**Maintenance integration:**
- Maintenance cards reference an asset instead of a customer
- Asset detail shows all linked maintenance history and total downtime

**Scheduled maintenance:**
- Recurring rules per asset: description, interval (days or machine hours), last completed
- Machine hours manually updated on asset record
- On Planning Day: system scans for due maintenance, prompts to auto-create and assign cards
- Overdue schedules escalate visually and surface on manager/owner dashboard

**Downtime logging:** Start/stop datetime fields on maintenance cards.

### 4.14 Time Tracking

**Two input methods:**
- Start/stop timer on a task
- Manual entry after the fact

**Primary audience:** Part-time production workers logging hours for payroll.

**Accounting integration:** Time entries write to the accounting system as Time Activities — employee, customer, hours, date, service item, notes. Financial person runs payroll in the accounting system using this data.

**Validation:**
- Same-day edits allowed; after end of day, entries lock (Admin override with audit trail)
- Overlapping timers blocked
- Missing time flagged in system health panel

**Pay period awareness:** Configurable schedule (weekly, biweekly). Workers see period hour totals. PM/Admin see summary for all workers.

### 4.15 Employee Records

Employee master data (name, address, SSN, pay rate, tax info, direct deposit) lives in QB. The app reads it via API — no duplication.

**App-only storage (if needed):**
- Signed documents, certifications, training records
- Stored in MinIO `forge-employee-docs` bucket
- Always restricted: visible only to the employee + Admin + Office Manager
- `TODO: [ANALYSIS]` — evaluate whether this feature is needed or if the accounting system covers all requirements

### 4.16 Customer Returns

**Engineer experience:**
- One button on completed job cards: "Customer Return"
- Three questions: What happened? (dropdown), How many? (quantity), Photo? (optional upload)

**System behavior by reason:**
- Defective / Wrong Part → auto-creates linked rework card in backlog
- Damaged in Shipping → flags for office manager / admin
- Customer Changed Mind → flags for office manager / admin
- All cases → credit memo handled by financial person in accounting system (or guided prompt in direct mode)

### 4.17 In-App Guided Training System

Built-in walkthrough system to eliminate external training documentation and reduce onboarding friction.

**Tour types:**
- **First-login tour** — step-by-step overlay highlighting key UI elements. Role-aware content (engineer sees different tour than production worker).
- **Per-feature walkthroughs** — triggered on first access to a feature (Planning Day, expense submission, etc.). Short 3-5 step tooltip sequences.
- **Help icon on every page** — persistent (?) icon always visible, replays the tour for the current screen on demand. Not limited to first visit.
- **Help mode toggle** — overlays contextual help icons on all interactive elements. Click any icon for a brief explanation.

**Tour coverage audit (developer tooling):**
- **Build-time check:** Unit test scans all routable components and fails if any route is missing a registered tour definition. CI enforces complete coverage.
- **Runtime sync check (dev mode only):** When `DEV_MODE=true`, an overlay highlights: (1) UI elements referenced by tours that no longer exist in the DOM (stale tour), and (2) elements that have no tour reference (uncovered). Ensures tours stay in sync with the implementation as the UI evolves.

**Admin training dashboard:**
- Shows which users have completed which walkthroughs
- Identifies users who may need hands-on assistance

**Implementation:** Tour definitions stored as JSON (updatable without code changes). driver.js library (zero-dependency, MIT licensed). `tour_completions` table tracks per-user progress.

### 4.18 Bin & Location Tracking

Physical storage locations organized in a hierarchy (Area → Rack/Shelf → Bin). Every bin has a printable barcode label.

**Location hierarchy:** Recursive structure — areas contain racks, racks contain shelves, shelves contain bins. Admin manages the hierarchy from a settings screen.

**What goes in bins:** Parts, raw materials, production run output, assemblies, tooling. Each entry tracks entity, quantity, lot number, status (stored / reserved / ready_to_ship / qc_hold), who placed it, and when.

**Scanning:** Scan a bin barcode → see contents. Scan a part/lot barcode → see which bin(s) it's in. Move items between bins by scanning source → selecting items → scanning destination.

**Ready-to-ship:** Finished goods marked `ready_to_ship` in their bin are surfaced on job cards at the shipping stage and appear on packing slips with bin locations for easy picking.

**Audit trail:** All movements logged immutably — who moved what, from where, to where, when, and why.

**Production label printing:** When a new production task or run is created, the system prompts to print barcode labels. Labels include both a scannable barcode and human-readable info: job number, part/product name, customer name (if applicable), lot number, quantity in this bin, and "Label X of N" for large orders split across multiple bins. Users specify how many labels to print and the system auto-divides quantities across them.

### 4.19 Inventory Management

Unified inventory tracking built on the bin/location system. The app owns the physical state (what's where, how much); the accounting system owns the financial value.

**Inventory sources:** Job-linked POs (materials for a specific order), general stock POs (inventory not tied to any customer), production output, and customer returns.

**Part inventory summary:** For each part — total on-hand, reserved (allocated to jobs), available (on-hand minus reserved), on order (open POs), and bin locations with quantities. Low-stock items highlighted with configurable minimum thresholds. Optional auto-reorder per part: admin enables it, system generates a draft PO with a cancellation window before submission.

**Receiving workflow:** PO arrives → user scans/selects items and enters quantities → system prompts for bin location (pre-filled from part default) → bin contents updated → syncs to accounting system.

**General stock:** Parts received on POs without a job reference go into general inventory bins. When a production run later needs that part, the system can reserve stock from general inventory (status: stored → reserved). Reserved parts appear on a pick list with bin locations.

**Cycle counting:** Admin initiates a count for a location or full inventory. System generates a count sheet listing expected quantities per bin. Worker counts actual quantities. Discrepancies flagged for review. Adjustments synced to accounting.

**Accounting sync:** Inventory quantities sync to the accounting system's item records. Cost tracking and valuation reports come from the accounting system — the app tracks quantities and locations, not dollar values.

### 4.20 Purchase Order Lifecycle

Purchase orders manage material procurement for both job-linked and general stock needs. POs are created in the app and synced to the accounting system.

**PO creation modes:**
- **Job-linked PO** — created from a job card's BOM. The system pre-fills line items from the BOM with quantities needed, preferred vendors, and part descriptions. The PO references the job so receiving is tracked against that order.
- **Standalone PO (general stock)** — created independently for replenishing inventory not tied to a specific job. User selects parts and quantities manually.

**PO statuses:**

| Status | Description |
|---|---|
| Draft | Created but not yet sent to vendor. Editable. |
| Submitted | Sent to vendor (email or manual). Line items locked. |
| Acknowledged | Vendor confirmed receipt and acceptance. |
| Partially Received | Some line items received; remainder on back-order. |
| Received | All line items received in full. |
| Closed | PO completed and finalized. No further receipts expected. |

**Partial receipts and back-order tracking:** Each receiving event records which line items were received, in what quantity, by whom, and into which bin. Remaining quantities are automatically tracked as back-ordered. The PO stays in "Partially Received" until all lines are fulfilled or the PO is manually closed. Back-ordered items are visible on the job card and in inventory reports.

**Multi-PO per job:** A single job can have multiple purchase orders — different vendors, phased ordering, or supplemental material needs. The job card's materials tab shows all linked POs with their statuses and a consolidated view of what has been received vs. what is outstanding.

**Preferred vendor per part:** Each part record can designate a preferred vendor (selected from the accounting system's vendor list). When generating a PO from a BOM, the system groups line items by preferred vendor and suggests creating separate POs per vendor. Parts without a preferred vendor prompt the user to select one.

### 4.21 Shipping & Carrier Integration

When a job reaches the "Shipped" stage, the system supports printing shipping labels and packing slips for outbound packages.

**Pluggable carrier integration** — same pattern as accounting: `IShippingService` interface with provider-specific implementations. Multiple carriers can be active simultaneously. Supported: UPS, FedEx, USPS, DHL, EasyPost (meta-carrier), or manual mode (no API — user enters tracking number).

**Shipping workflow:** Job reaches "Shipped" → system pre-fills ship-to from customer, items/weights from job → user selects carrier and service → carrier API returns label PDF + tracking number → label printed → tracking number stored on job card.

**Rate shopping:** When multiple carriers are active, rates displayed side-by-side. User picks cheapest/fastest/preferred.

**Multi-package:** Large orders ship in multiple boxes — each gets its own label and tracking number. All tracking numbers visible on the job card.

**Packing slips:** Generated by the app — ship-to, ship-from, items with quantities, bin locations (pick list), job reference, PO number, special instructions.

**Tracking:** Tracking number displayed on job card (clickable link to carrier page). Optional background polling for delivery confirmation with notification on delivery.

### 4.22 R&D / Internal Projects

**R&D / Tooling Track** — a purpose-built Kanban workflow for engineering development: Concept → Design → CAD Review → Prototype / Test → Iteration → Tooling Approval → Handoff to Production. Cards can loop backward from test to design without penalty (R&D is non-linear). Each iteration through testing increments a counter with logged test notes and file revisions. On "Handoff to Production," a linked Production track card is created and the associated part record is set to Active.

**Internal Projects** — non-customer, non-R&D operational work: tooling development, process improvement, fixture design, material testing, machine qualification, facility maintenance, and open-ended tasks. Internal project types are configurable as reference data by admin.

**Facility & Operational Tasks** — recurring tasks like sweeping, cleaning, inventory cycle counts, organizing workstations, safety walkthroughs, and SOP reviews. These are tracked as cards on the board like any other work.

**Scheduled Internal Tasks** — admin creates recurring task schedules (daily, weekly, biweekly, monthly, or custom interval) with a default assignee, description, and estimated duration. On Planning Day, due internal tasks are presented alongside maintenance schedules for auto-card creation. Completion history is tracked per schedule. Overdue scheduled tasks surface on the manager dashboard.

### 4.23 Admin Settings & Integration Management

The admin settings screen is the central hub for all system configuration — integrations, branding, reference data, and operational settings. Everything is configured through the UI; no config file editing required for day-to-day operation.

**Third-Party Integrations** — all managed from a unified Integrations tab with consistent connection status indicators, credential entry, test-connection buttons, and disconnect options:

| Integration | Credential Type | Notes |
|---|---|---|
| Accounting (QB Online default) | OAuth 2.0 | Single active provider; setup wizard on first run |
| Shipping Carriers | API key / OAuth per carrier | Multiple carriers active simultaneously; Manual mode always available |
| Email / SMTP | Host, port, username, password | Test-send button to verify delivery |
| AI Provider (optional) | Local Ollama URL or cloud API key | Self-hosted default; app works fully without AI |

**Accounting setup flow:**
1. **Provider selection** — QuickBooks Online is pre-selected as the default. Other available providers listed (Xero, Sage, etc. as implemented). Admin can also choose "Standalone" to skip accounting integration entirely.
2. **Provider-specific setup:**
   - **QuickBooks Online (default):** Instructions with links to Intuit Developer portal, Client ID / Client Secret fields, "Connect to QuickBooks" OAuth 2.0 redirect, authorize, tokens stored encrypted
   - **Other providers:** Each provider defines its own credential fields, auth flow, and setup instructions via the provider implementation
3. First sync pulls customers, vendors, items, employees into local cache
4. Confirmation screen showing sync results and record counts
5. Connection status always visible in admin settings with disconnect/reconnect/switch provider options
6. Token expiry warnings surface in system health panel — admin re-authenticates when needed
7. Provider can be switched later — admin selects new provider, completes setup, old data preserved

**Branding** — logo upload, application name, three brand color pickers (Primary, Accent, Warn), default theme mode. Changes apply immediately at runtime. Contrast validation warns if colors violate WCAG 3 accessibility thresholds.

**Reference Data** — single management screen for all lookup/dropdown values (expense categories, lead sources, job priorities, shipping carriers, etc.). Admin can add, rename, reorder, and deactivate values. New groups can be added for custom categorization.

**System Settings** — planning cycle duration, planning day toggle, auto-archive days, file upload limits, invoice workflow mode, default user role, backup schedule, terminology overrides.

### 4.24 Self-Hosted AI Assistant (Optional)

An optional local AI module that runs entirely on-premise. No cloud calls, no data leaves the network. The application works fully without it — AI features degrade gracefully to manual workflows.

**Infrastructure:** Ollama (Docker container) running open-source LLM models. pgvector extension on existing PostgreSQL for vector/embedding storage. No additional database needed.

**AI-powered features:**

| Feature | Description |
|---|---|
| Smart search | Natural language queries translated to structured searches: "overdue jobs for Acme" |
| Job description drafting | Generate card descriptions from part + customer + spec context |
| QC anomaly detection | Analyze production run data for reject rate patterns and quality drift |
| Maintenance prediction | Suggest scheduling adjustments from machine hours and downtime history |
| Document Q&A (RAG) | Ask questions against indexed specs, SOPs, and drawings |
| Notification summary | Summarize a day's notifications into a morning brief |
| Expense categorization | Auto-suggest category from description |

**Manufacturing-specific training:**

The AI uses a RAG (Retrieval-Augmented Generation) approach:

1. Base model starts with open-source manufacturing knowledge (ISO standards, GD&T, material properties, process parameters)
2. Local production data is indexed into pgvector: part specs, BOM structures, QC results, maintenance logs, SOPs
3. When a user asks a question, relevant local documents are retrieved and fed as context to the LLM
4. The model answers grounded in your actual production data, not generic training
5. Re-indexing runs periodically as new data is added — AI knowledge stays current

**Hardware scaling:**

| Setup | Model | Performance |
|---|---|---|
| CPU only, 16GB RAM | 7B parameter model | Usable but slow |
| GPU, 16GB+ VRAM | 7-13B parameter model | Responsive |
| GPU, 48GB+ VRAM | 70B parameter model | Full capability |

**Integration pattern:** Same mockable service layer as accounting and other integrations. `IAiService` with `OllamaAiService` and `MockAiService` implementations. `MOCK_INTEGRATIONS=true` returns canned AI responses during development.

### 4.25 Chat System

Built-in real-time messaging using the existing SignalR infrastructure. No third-party chat dependency — keeps all data local.

**Chat types:**
- **1:1 direct messages** between any two users
- **Group chats** — created by any user, named channels with invited members
- **Admin-created channels** — pre-built team channels (e.g., "Shop Floor", "Engineering")

**UX:**
- Chat icon always visible in toolbar (next to notification bell) with unread count badge
- Opens as a dismissable popover panel — click outside or press Escape to close. User stays on their current page.
- Message history searchable
- File/image sharing via existing MinIO upload
- @mention triggers a notification in the recipient's bell queue
- "Share to chat" action on job cards, parts, expenses — inserts an entity link
- Entity references in messages (`#JOB-1234`) auto-link to the source

**What chat is NOT:** not a replacement for the notification system. Notifications handle system events and structured alerts. Chat handles informal, real-time team communication.

### 4.26 Calendar View

A visual calendar displaying scheduled work across all track types. Provides a time-oriented perspective complementing the Kanban board's status-oriented view.

**Views:** Month, week, and day layouts. Month view is the default. Week and day views show time slots. Navigation via previous/next arrows and a date picker for jumping to a specific date.

**Color coding by type:**
- **Production jobs** — primary brand color
- **Maintenance tasks** — orange/warn color
- **R&D / Internal tasks** — accent color
- **Facility / scheduled tasks** — gray

Colors follow the admin-configured brand palette. A legend is always visible below the calendar header.

**Dense day handling:** When a day has more items than can be displayed in the cell (threshold varies by viewport), the cell shows a summary block (e.g., "8 tasks") instead of individual items. Clicking the summary block expands to a popover listing all items for that day with title, type, assignee, and status. Clicking an item navigates to its card detail.

**Filtering:** Filter bar above the calendar with options for: track type, assignee, status (active/completed/overdue), and priority. Filters persist during the session. Active filter count shown as a badge on the filter button.

**Dashboard widget:** A mini month-view widget available for the customizable dashboard. Shows color-coded dots on days with scheduled work. Clicking a day navigates to the full calendar day view. Compact enough for a single dashboard grid cell.

**Export:** `.ics` export for any filtered calendar view — downloads a standard iCalendar file importable into Google Calendar, Outlook, Apple Calendar, or any standards-compliant client. Per-item `.ics` export also available from job card detail.

### 4.27 Shared Component Library & UI Patterns

Centralized shared Angular components eliminate per-feature HTML duplication and enforce consistent behavior across the entire application.

**Data Table** — A single, reusable table component used everywhere. Users can configure which columns are visible, drag to reorder, resize widths, sort and filter per column header. A gear icon opens column management; "Reset to Default" restores original settings. All preferences are persisted per user and per table instance so each user sees their preferred layout on every login.

**Form Field Wrappers** — Shared components for text inputs, selects, autocompletes, textareas, date pickers, and toggles. Each wraps Angular Material form fields with floating labels and reactive form integration, reducing per-form HTML to single-line component tags.

**Validation Pattern** — No inline validation error messages beneath fields. Instead, the submit button disables when the form is invalid. Hovering over the disabled button displays a popover listing all current violations (e.g., "Part Number is required", "Quantity must be at least 1"). Validation re-runs on every field change, updating the list live. A final validation check runs before executing the action.

**Page Layout Shell** — Standard layout component enforcing: static header (page title, breadcrumbs, toolbar), scrollable content area, and sticky action footer with buttons right-aligned (primary action furthest right).

**Additional Shared Components** — Confirmation dialog (severity-based styling), entity picker (typeahead search for any entity type), file upload zone (drag-and-drop with progress), status badge (colored chip from reference data), detail side panel (slide-out from right), user avatar (image with initials fallback), toolbar (horizontal filter/action bar), date range picker (with presets).

**User Preferences** — All per-user UI settings (table configs, theme mode, sidebar state, dashboard layout, locale, notification preferences) stored in a centralized table. Loaded on app init, debounced sync to server on changes, restored on login from any device.

---

## 5. User Interface

### 5.1 Roles (Additive)

Users can hold multiple roles. Permissions are the union of all assigned roles.

| Role | Access |
|---|---|
| Engineer | Kanban board, assigned work, files, expenses, daily prompts, time tracking |
| PM | Backlog curation, Planning Day, lead management, reporting, priority setting |
| Production Worker | Simplified task list, start/stop timer, limited card movement, notes/photos |
| Manager | Everything PM + assign work, approve expenses, set priorities for others |
| Office Manager | Customer/vendor management, invoice queue, employee docs |
| Admin | Everything + user management, role assignment, system settings, configuration |

### 5.2 Navigation & Views

**Full Task List:**
Searchable, filterable grid of every job ever created (backlog, active, archived). Sortable columns, multi-select filters, saved filter presets, CSV export.

**Global Search:**
Persistent search bar (Ctrl+K) searching across all entities including jobs, customers, leads, parts/assemblies (part number, description, material, BOM contents), files, expenses, assets, and contacts. Results grouped by type with highlighted matching text. Powered by Postgres full-text search with JSONB indexing.

- **Faceted filtering:** Results display entity type facets (Jobs, Parts, Customers, Leads, Assets, Files, Expenses) with match counts per type. Clicking a facet filters results to that type. Multiple facets can be selected simultaneously.
- **Fuzzy matching:** `pg_trgm` extension enables trigram-based similarity search — tolerates typos, partial matches, and minor spelling variations. Similarity threshold configurable in system settings.
- **Recent searches:** The search dropdown shows the user's last 10 searches below the input before typing begins. Clicking a recent search re-executes it. Recent searches are per-user and stored locally.
- **Keyboard navigation:** Arrow keys navigate results, Enter opens the selected result, Tab cycles through facet filters, Escape closes the search panel. Full keyboard-driven workflow without mouse.
- **Scoped search:** List views (job list, part catalog, customer list, etc.) include an inline search bar that searches within that entity type only. Uses the same full-text and trigram infrastructure but scoped to the current view's data. Scoped search supports column-specific filtering (e.g., search by part number only).

**Production Worker View:**
Simplified list of assigned tasks. Big start/stop timer. Mark complete or advance to next stage. Add notes/photos. No nav menu or admin features.

**Shop Floor Display & Time Clock Kiosk:**
Dedicated route (`/display/shop-floor`), no login required for the read-only overview. Shows active production jobs, machine status, worker presence and current task, cycle progress, maintenance alerts. Large text, high contrast, auto-refreshes via SignalR. Browser kiosk mode.

**Time Clock** — integrated into the shop floor display as a passive scan listener. The kiosk idles on the overview and waits for a scan event (badge, barcode, NFC). No UI buttons needed to initiate — the worker just scans. Clock events sync to the accounting system as Time Activities. If no scan hardware is configured by admin, workers fall back to logging into the app normally to clock in/out.

**Production Quick Actions** — when a clocked-in worker scans again, they are prompted: "Update Task" or "Clock Out". Update Task shows quick actions for their current task (mark complete, update quantity, update status, start new run). Clock Out first prompts the worker to address any outstanding production runs or in-progress tasks before ending their shift. Large buttons optimized for gloved hands. After action (or idle timeout), the screen returns to the overview.

### 5.3 Unified Notification System

Everything is a notification — user-authored messages and system-generated alerts flow through one system. One bell icon, one panel.

**User-authored notifications:**
- Post to everyone, a specific user, or self (private reminder)
- Inline reply from the notification panel — no page navigation needed

**System-generated notifications:**
Job assignments, due dates, expense approvals/rejections, overdue jobs, maintenance due, cycle reminders, accounting sync failures, missing time entries, lead follow-up reminders. Created automatically by background jobs and event handlers.

**Notification UX:**
- Bell icon → dropdown panel with filter tabs: All | Messages | Alerts
- Filterable by: source (user/system), date range, severity, notification type, read/unread, dismissed/active
- **Link to source**: notifications with an entity reference show "View" link → navigates to job card, expense, lead, part, asset, etc.
- **Dismiss**: non-essential items can be dismissed. Non-dismissable items persist until resolved — includes system health (accounting token expiry, backup failure) AND production/task status (QC failed, job blocked, overdue past threshold, pending approvals)
- **Pin** important items to top
- **Bulk actions**: "Mark all read", "Dismiss all"
- **New notification** button to quickly post a user-authored message
- Per-user preference per type: in-app only, in-app + email, or muted

**System health panel (admin)** remains a separate view for operational monitoring but critical health alerts ALSO appear in the bell queue for admin users.

**Email notifications:** Via SMTP with `.ics` calendar attachments for scheduled events.

**Email Templates:**
All outbound emails use a branded wrapper template that pulls from admin branding settings — logo, application name, and brand colors. The wrapper provides a consistent header (logo + app name), content area, and footer (unsubscribe link, app URL). Variable substitution populates dynamic content: `{{user.name}}`, `{{job.title}}`, `{{job.url}}`, `{{notification.message}}`, `{{cycle.name}}`, etc. Templates are code-defined in v1 — stored as Razor views or string templates in the API project, not editable by admin through the UI. Admin-editable templates are deferred to a future version. All template text passes through the terminology system, so relabeled concepts (e.g., "Work Order" instead of "Job") appear correctly in emails. Templates also respect the recipient's language preference via the i18n system.

### 5.4 Theming & Accessibility

**User-selectable light/dark mode:**
- Toggle in the toolbar switches between light and dark themes
- Preference saved per-user, admin sets the system default
- Both themes auto-generated from the same brand palette

**Admin-controlled brand colors:**
- Admin settings screen exposes 3 color pickers: Primary, Accent, Warn
- Changes apply at runtime — no code rebuild required
- Logo and app name also configurable in admin settings
- **Contrast validation**: the UI warns the admin if selected color combinations violate WCAG 3 accessibility thresholds, preventing inaccessible configurations from being saved

**WCAG 3 compliance target:**
- APCA-based contrast scoring for text and interactive elements
- Reduced motion support, keyboard navigation, screen reader compatibility
- axe-core automated accessibility checks in E2E test suite
- Minimum 44x44px touch targets on mobile views

### 5.5 Mobile Responsiveness

Same Angular build, responsive layouts. Below 768px, navigation simplifies to a subset of views:

**Available on mobile:** Daily priorities, timer, card detail (read), expense capture with camera, notifications, production run logging, maintenance reporting.

**Desktop only:** Full Kanban board, Planning Day, reporting, admin/configuration.

---

## 6. Technical Approach

### 6.1 Development Principles

- Plain language throughout — no accounting jargon in operational views
- Role-based entry points — UI adapts to assigned roles
- Progressive disclosure — simple defaults, detail on demand
- Search-first navigation — one search bar finds anything
- Forgiving by design — edits logged, corrections straightforward
- Confirmation in plain English before consequential actions
- Double confirmation with consequence explanation for QB-affecting operations

### 6.2 Integration & Mocking Strategy

All external integrations abstracted behind a service layer. `MOCK_INTEGRATIONS=true` swaps real implementations for mock services returning controlled test data.

| Integration | Purpose | Mock Scenarios |
|---|---|---|
| Accounting (QB Online default) | Customer, invoice, estimate, PO, time activity CRUD via `IAccountingService` | Success, auth failure, rate limit, orphaned reference |
| SMTP Email | Notifications, .ics calendar events | Intercepted and logged, not sent |
| MinIO / S3 | File storage for attachments, receipts, documents | Local MinIO instance in Docker |
| Backblaze B2 | Off-site backup | Skipped in dev |

### 6.3 Custom Fields System (JSON-based)

A reusable custom field system used across track types, leads, and customers:

- `custom_fields_template` JSONB column defines the field schema per entity type
- `custom_field_values` JSONB column stores values per record
- Supported field types: text, number, boolean, date, select, multiselect, textarea
- Angular dynamic form generator renders fields from template
- Changes to templates apply to new records immediately; existing data preserved
- Searchable via Postgres JSONB operators with `jsonb_path_ops` index

### 6.4 Settings Architecture

**appsettings.json** — infrastructure (connection strings, JWT key, MOCK_INTEGRATIONS, CORS, SMTP, logging)

**system_settings DB table** — operational settings changed at runtime by Admin:
- File upload limits, storage warning thresholds
- Invoice workflow mode (direct/managed)
- Planning cycle duration, planning day enabled
- Nudge timing thresholds, auto-archive days
- Default role for new users
- Backup schedule and retention

### 6.5 Terminology & Localization (i18n)

Two layers: admin-configurable terminology (relabel concepts) and full language translation.

**Admin-Configurable Terminology:**
- `terminology` table: `key` (internal code reference, never changes), `locale`, `label`
- Admin settings screen: two-column list — concept on the left, editable label on the right
- Admin custom labels override all language translations
- Angular `TerminologyService` loads the label map on app init
- Angular `terminology` pipe on all user-facing labels: `{{ 'entity_job' | terminology }}`
- Tour/walkthrough definitions reference terminology keys — tours auto-translate

**Example configurable terms:**

| Key | Default (en) | A shop might relabel to |
|---|---|---|
| `source_type_make` | In-House | Manufactured |
| `source_type_buy` | Purchased | Outsourced |
| `entity_job` | Job | Work Order |
| `entity_sprint` | Planning Cycle | Work Period |
| `entity_backlog` | Backlog | Queue |
| `stage_qc` | QC / Review | Inspection |
| `entity_lot` | Lot | Batch |
| `entity_part` | Part | Component |
| `entity_assembly` | Assembly | Product |

**Language Translation (i18n):**
- English is the complete default language — ships with every label translated
- Additional language packs as JSON seed files: `/assets/i18n/en.json`, `/assets/i18n/es.json`, etc.
- Spanish ships as the first additional language (high priority for US manufacturing workforce)
- Community can contribute additional translations via PRs on the open source repo
- `ngx-translate` library handles lazy-loading locale files in Angular

**Language selection:**
- System-wide default language configurable in system settings by Admin
- Per-user language preference set during registration and editable in user profile
- User preference overrides system default
- Login screen and registration form available in all installed languages

**Label resolution priority:**
1. Admin custom label (if set for the user's locale)
2. User's selected language translation
3. System default language translation
4. English fallback

**What gets translated:** All UI labels, buttons, menus, tooltips, tour content, notification messages, column headers, error messages.

**What does NOT get translated:** User-entered data (job descriptions, notes, part names), accounting data (customer names, item descriptions).

### 6.6 Audit Trail

**System audit:** Every create, update, delete logged automatically. Immutable records: timestamp, user, entity, action, old value, new value. Searchable by Admin.

**`TODO: [ANALYSIS]` convention:** Business decisions pending stakeholder input are tagged `// TODO: [ANALYSIS]` in code and shown as UI banners. Searchable separately from development TODOs.

### 6.7 Backup Strategy

**Primary — Backblaze B2 (off-site):**
- `forge-backup` container runs scheduled jobs
- Daily `pg_dump` → compress → upload to B2
- Daily `rclone sync` for MinIO files to B2
- Retention: 7 daily, 4 weekly, 3 monthly
- Status visible in system health panel

**Secondary — local machine replication (on-site):**
- MinIO bucket replication to a second machine on LAN
- Postgres dumps to same secondary machine
- Immediate recovery from primary machine failure

---

## 7. Reporting

All reporting is operational/delivery focused. Financial reporting stays in the accounting system. Pre-built views with date range pickers, filters, and CSV export. Charts via ng2-charts (Chart.js). No custom report builder. Reports are role-gated — employees see their own data, management sees team-wide views.

### My Reports (All Authenticated Users)
Every employee can view their own historical data:
- **My Work History** — jobs/tasks completed, filterable by date range, track type, customer
- **My Time Log** — hours per day/week/month by job or internal task, weekly/monthly totals
- **My Expense History** — submitted expenses with approval status
- **My Cycle Summary** — committed vs completed per cycle, personal throughput
- **My Training Progress** — completed tours, pending modules

### Operational Reports (PM, Manager, Admin)
- **Jobs by Stage** — snapshot across kanban stages, filterable by track type, customer, assignee
- **Overdue Jobs** — past due date, sorted by severity
- **On-Time Delivery Rate** — trend over time
- **Average Lead Time** — quote-to-ship, filterable by customer, part, track type
- **Time in Stage (Bottleneck Analysis)** — average dwell time per stage
- **Team Workload** — assignments per worker, capacity, unassigned jobs
- **Employee Productivity** — hours by employee, jobs completed, on-time rate
- **Labor Hours by Job** — time entries per job (hours, not dollars)
- **Expense Summary** — by category, employee, status, date range
- **Cycle Review** — committed vs delivered, rollover rate, throughput trend
- **Customer Activity** — jobs per customer, lead time, on-time rate, return rate
- **Quote-to-Close Rate** — estimates sent vs orders confirmed

### Inventory & Production Reports (PM, Manager, Admin)
- **Inventory Levels** — stock by part/location, low-stock highlights, reorder status
- **Inventory Movement** — receipts, consumption, adjustments, transfers
- **Quality / Scrap Rate** — rejected vs produced, by part/job/employee
- **Cycle Time by Part** — average production time, useful for quoting
- **Shipping Summary** — by carrier, cost trends, delivery confirmation rates

### Maintenance Reports (PM, Manager, Admin)
- **Scheduled vs Unscheduled** — ratio and trend
- **Downtime by Asset** — hours, production impact
- **Overdue Schedules** and **Maintenance Compliance** — adherence rate

### Lead & Sales Reports (PM, Manager, Admin)
- **Active Leads by Status** — pipeline view
- **Conversion Rate** — leads to customers over time
- **Follow-up Overdue** — past-due follow-ups
- **Return Rate** — by reason, part, customer

### R&D & Internal Reports (PM, Manager, Admin)
- **R&D Iterations** — cycles per project before production-ready
- **Concept to Production** — handoff time
- **Internal Task Adherence** — scheduled task completion rates, overdue trends

### Admin-Only Reports
- **System Audit Log** — who changed what, when, filterable and searchable
- **Integration Health** — sync queue, failure rates, last sync per integration
- **Storage Usage** — by bucket, growth trend
- **User Activity** — login frequency, last active, role distribution
- **Employee Onboarding Status** — unclaimed accounts, active/inactive roster

### Scheduled Email Digest (Optional)
Weekly summary email to managers/admin: overdue jobs, cycle progress, maintenance due, low stock. Configurable per user (opt-in, frequency, content). Requires SMTP.

---

## 8. Phased Delivery Plan

| Phase | Deliverable | Includes |
|---|---|---|
| 1 — Foundation | Docker Compose + Kanban board + job cards | Project scaffolding, all containers, EF Core schema, Production + R&D + Maintenance + Other tracks, card CRUD, file attachments, basic customer records (accounting read), mock integration layer |
| 2 — Engineer UX | Focus dashboard + Planning Day | Personalized filtered view, daily priority widget, ambient screensaver, end-of-day prompt, cycle cadence, backlog curation, planning day flow |
| 3 — Accounting Bridge | Full accounting read/write integration | Sync queue, caching, orphan detection, estimate/SO/PO/invoice lifecycle, stage-to-document mapping, OAuth token management |
| 4 — Leads & Contacts | Lead-to-customer pipeline | Lead CRUD, conversion flow, multiple contacts per entity, custom fields for leads/customers |
| 5 — Traceability & QC | Production lot tracking | Production run logging, traceability profiles, QC checklists, lot lookup, material traceability |
| 6 — Time & Workers | Time tracking + worker views | Start/stop timer, manual entry, accounting Time Activity sync, production worker simplified view, shop floor display |
| 7 — Expenses & Invoicing | Expense capture + invoice workflow | Daily expense prompt, receipt upload, self-approval/queue, invoice nudge system, direct/managed mode |
| 8 — Maintenance | Asset registry + scheduled maintenance | Asset CRUD, maintenance schedules, Planning Day integration, downtime logging |
| 9 — Reporting | Operational dashboards | All report views, charts, CSV export |
| 10 — Backup & Polish | Production hardening | B2 backup, local replication, email notifications, .ics calendar, mobile responsive layouts |
| 11 — AI Assistant | Self-hosted AI module | Ollama container, pgvector setup, RAG pipeline, smart search, document Q&A, QC anomaly detection, maintenance prediction |

---

## 9. Out of Scope (Initial Build)

- General ledger, chart of accounts, or accounting replacement — the accounting system handles this
- Benefits administration — not applicable
- CRM / sales pipeline beyond lead management
- Native mobile app — responsive browser is sufficient
- Cloud hosting required initially — local LAN deployment with VPN for remote access; however, Docker containers are cloud-ready for deployment to any container host (Kubernetes, Azure Container Apps, AWS ECS, etc.) when needed
- Full MRP (Material Requirements Planning) with automated procurement — inventory tracking is included, but demand-driven auto-ordering is out of scope
- Custom report builder
- Data migration from legacy systems (greenfield deployment)
- NACHA / ACH payroll file generation — accounting system handles payroll

---

## 10. Success Criteria

- Engineer can view all assigned jobs and today's priorities without opening the accounting system
- Jobs flow through stages aligned to the accounting system's document lifecycle with automatic record creation
- Any job card can have CAD/STL files attached and viewable inline within 3 clicks
- R&D iteration history is fully captured and searchable
- Planning Day curates work from a prioritized backlog into 2-week cycles
- Leads convert to accounting system customers with full history preserved
- Production lot numbers trace backward to raw material and forward to customer shipment
- Scheduled maintenance auto-generates cards on Planning Day
- Part-time workers can log time that feeds directly into accounting system payroll
- Expenses are captured with receipt photos in under 60 seconds
- Shop floor display shows real-time job status and team presence
- The app functions with accounting system unavailable — sync queue holds operations until reconnection
- No company-specific code — fully configurable for any small manufacturer
