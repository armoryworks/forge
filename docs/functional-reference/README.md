# Forge -- Functional Reference

> Complete functional documentation for every feature, form field, API endpoint, status lifecycle, validation rule, and user-facing behavior in Forge. This is the single source of truth for understanding what the application does and how every piece works.

## How to Use This Reference

- **End users**: Find your feature below, read its overview and field reference to understand every button, field, and status
- **Developers**: Use as the authoritative spec when building or modifying features
- **AI assistants**: Consume these docs to answer any question about application capabilities and behavior
- **Integrators**: See [API Reference](api-reference.md) for endpoint contracts and [Database Schema](database-schema.md) for the data model

## Feature Documentation

### Core Application

| Feature | File | Description |
|---------|------|-------------|
| Application Shell | [app-shell.md](app-shell.md) | Sidebar, header, breadcrumbs, global search, theme, notifications bell, keyboard shortcuts |
| Dashboard | [dashboard.md](dashboard.md) | KPI chips, 9 widgets, gridstack layout, focus mode, ambient mode, getting started banner |
| Notifications | [notifications.md](notifications.md) | Real-time SignalR alerts, notification panel, tabs, preferences, email delivery |
| Global Search | [search.md](search.md) | Cross-entity ILIKE search, AI RAG column, Ctrl+K shortcut, 6 entity types |

### Production & Scheduling

| Feature | File | Description |
|---------|------|-------------|
| Kanban Board | [kanban.md](kanban.md) | Track types, stages, drag-drop, WIP limits, job cards, bulk actions, real-time sync |
| Backlog | [backlog.md](backlog.md) | Prioritized job queue, filters, table/card views, job creation |
| Planning Cycles | [planning.md](planning.md) | Sprint-style planning, split-panel drag-to-commit, rollover, cycle progress |
| Shop Floor | [shop-floor.md](shop-floor.md) | Kiosk display, RFID/badge/barcode auth, worker cards, clock actions, job timers |
| Calendar | [calendar.md](calendar.md) | Job calendar, PO deliveries, month/week/day views, track type filter |
| Scheduling | [scheduling.md](scheduling.md) | Gantt visualization, dispatch lists, work centers, shifts, capacity load |
| MRP | [mrp.md](mrp.md) | Material requirements planning, planned orders, exceptions, demand forecasting |
| OEE | [oee.md](oee.md) | Overall equipment effectiveness (planned -- not yet implemented) |

### Engineering & Quality

| Feature | File | Description |
|---------|------|-------------|
| Parts Catalog | [parts.md](parts.md) | Parts, BOM, operations, routing, revisions, alternates, pricing, serials, 3D STL viewer |
| Inventory | [inventory.md](inventory.md) | Stock levels, locations, movements, receiving, cycle counts, reservations, UOM, replenishment |
| Quality & QC | [quality.md](quality.md) | Templates, inspections, SPC, NCRs, CAPAs, ECOs, gages, PPAP, FMEA, lot tracking |
| Assets | [assets.md](assets.md) | Asset registry, tooling, maintenance schedules, downtime logging, Six Big Losses |
| Production Lots | [lots.md](lots.md) | Lot creation, traceability query, origin tracking |

### Sales & CRM

| Feature | File | Description |
|---------|------|-------------|
| Leads | [leads.md](leads.md) | Sales pipeline, 5 stages, table/pipeline views, conversion to customer |
| Customers | [customers.md](customers.md) | Customer profiles, contacts, addresses, interactions, 10-tab detail page, stats bar |
| Estimates | [estimates.md](estimates.md) | Non-binding ballpark figures, single amount, conversion to quotes |
| Quotes | [quotes.md](quotes.md) | Line-itemized binding quotes, acceptance, conversion to sales orders |
| Sales Orders | [sales-orders.md](sales-orders.md) | Order management, line items, fulfillment tracking, drop-ship |

### Procurement & Fulfillment

| Feature | File | Description |
|---------|------|-------------|
| Vendors | [vendors.md](vendors.md) | Vendor profiles, scorecards, address management, accounting boundary |
| Purchase Orders | [purchase-orders.md](purchase-orders.md) | PO creation, lines, receiving, blanket POs, releases |
| Purchasing / RFQs | [purchasing.md](purchasing.md) | RFQ workflow, vendor comparison, award, PO auto-generation |
| Shipments | [shipments.md](shipments.md) | Packing, shipping, carrier integration, tracking, label generation |

### Finance

| Feature | File | Description |
|---------|------|-------------|
| Invoices | [invoices.md](invoices.md) | Invoice lifecycle, line items, tax, PDF generation, email (⚡ standalone) |
| Payments | [payments.md](payments.md) | Payment recording, invoice application, methods (⚡ standalone) |
| Expenses | [expenses.md](expenses.md) | Expense capture, receipt upload, approval workflow, recurring templates |
| Payroll | [payroll.md](payroll.md) | Pay stubs, tax documents, deductions, employee self-service |
| Sales Tax | [sales-tax.md](sales-tax.md) | Per-jurisdiction tax rates, effective dates, customer rate lookup |

### People & Administration

| Feature | File | Description |
|---------|------|-------------|
| Admin Panel | [admin.md](admin.md) | Users, roles, track types, reference data, terminology, settings, 16 tabs |
| Authentication & MFA | [auth.md](auth.md) | Login, SSO, TOTP MFA, tiered kiosk auth, setup tokens, recovery codes |
| Employee Account | [account.md](account.md) | Profile, security, customization, compliance forms, pay stubs, 11 routes |
| Time Tracking | [time-tracking.md](time-tracking.md) | Timers, manual entry, corrections, clock events, pay periods, overtime |
| Compliance Forms | [compliance.md](compliance.md) | W-4, I-9, state withholding, dynamic forms, PDF extraction, DocuSeal signing |
| Events | [events.md](events.md) | Meetings, trainings, safety events, attendees, RSVP, 15-min reminders |
| Employees | [employees.md](employees.md) | Employee management, 10-tab detail, profiles, teams, shifts, scan identifiers |
| Approvals | [approvals.md](approvals.md) | Multi-step approval workflows, delegation, escalation, audit trail |
| Leave Management | [leave.md](leave.md) | Leave policies, accrual rates, balance tracking, request workflow |
| Onboarding | [onboarding.md](onboarding.md) | 7-step new employee wizard, profile completion, guided setup |

### Communication & AI

| Feature | File | Description |
|---------|------|-------------|
| Chat | [chat.md](chat.md) | 1:1 DMs, group rooms (API), SignalR real-time, slide-out panel |
| AI Assistant | [ai.md](ai.md) | Ollama RAG, 4 configurable assistants, document Q&A, smart search |
| Training (LMS) | [training.md](training.md) | 46 modules, 8 paths, articles, walkthroughs, quizzes, progress tracking |
| EDI | [edi.md](edi.md) | X12/EDIFACT trading partners, transaction lifecycle, field mappings |

### Reporting & Analytics

| Feature | File | Description |
|---------|------|-------------|
| Reports | [reports.md](reports.md) | 28 pre-built reports, dynamic builder, 28 entity sources, Sankey diagrams, export |
| Customer Returns | [customer-returns.md](customer-returns.md) | RMA lifecycle, inspection, rework job creation, resolution |

### System & Infrastructure

| Feature | File | Description |
|---------|------|-------------|
| File Storage | [file-storage.md](file-storage.md) | MinIO S3 storage, uploads, chunked upload, lightbox gallery, camera capture |
| Status Lifecycle | [status-lifecycle.md](status-lifecycle.md) | Polymorphic status tracking, workflow + holds, timeline component |
| Barcode & Scanning | [scanning.md](scanning.md) | USB scanner, NFC/RFID, QR codes, label printing, context-aware routing |
| Real-Time (SignalR) | [signalr.md](signalr.md) | 4 hubs (Board, Notification, Timer, Chat), reconnection, connection banner |
| Offline & PWA | [offline.md](offline.md) | Service worker, IndexedDB cache, offline action queue, sync conflicts |

## Cross-Cutting References

| Document | Description |
|----------|-------------|
| [API Reference](api-reference.md) | Authentication, pagination, error format, 50+ domain sections, all endpoints |
| [Database Schema](database-schema.md) | 200+ entities, relationships, 100+ enums, pgvector, conventions |
| [Roles & Permissions](roles-permissions.md) | 6 roles, feature access matrix, API permissions, kiosk tiers, MFA policy |
| [Integrations](integrations.md) | Accounting (QB), shipping, USPS, Ollama AI, MinIO, DocuSeal, SMTP, Hangfire |
