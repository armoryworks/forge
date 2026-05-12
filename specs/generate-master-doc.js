const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType, PageBreak, TableBorders,
  convertInchesToTwip, ExternalHyperlink, TabStopPosition, TabStopType
} = require("docx");
const fs = require("fs");
const path = require("path");

// ─── Helper functions ───

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text, bold: true, size: 36, font: "Segoe UI" })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 }, children: [new TextRun({ text, bold: true, size: 28, font: "Segoe UI" })] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 250, after: 100 }, children: [new TextRun({ text, bold: true, size: 24, font: "Segoe UI" })] });
}
function p(text) {
  return new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text, size: 20, font: "Segoe UI" })] });
}
function pBold(label, text) {
  return new Paragraph({ spacing: { after: 100 }, children: [
    new TextRun({ text: label, bold: true, size: 20, font: "Segoe UI" }),
    new TextRun({ text, size: 20, font: "Segoe UI" })
  ]});
}
function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 20, font: "Segoe UI" })]
  });
}
function bulletBold(label, text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 60 },
    children: [
      new TextRun({ text: label, bold: true, size: 20, font: "Segoe UI" }),
      new TextRun({ text, size: 20, font: "Segoe UI" })
    ]
  });
}
function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbering1", level },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 20, font: "Segoe UI" })]
  });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
function spacer() {
  return new Paragraph({ spacing: { after: 100 }, children: [] });
}
function divider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
    children: []
  });
}

function simpleTable(headers, rows, colWidths) {
  const borderStyle = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
  // Calculate equal column widths if not provided (in twips — 9360 twips = 6.5 inches usable page width)
  const totalWidth = 9360;
  const widths = colWidths || headers.map(() => Math.floor(totalWidth / headers.length));
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: headers.map((h, i) => new TableCell({
          borders,
          width: { size: widths[i], type: WidthType.DXA },
          shading: { type: ShadingType.SOLID, color: "E2E8F0" },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, font: "Segoe UI" })] })]
        }))
      }),
      ...rows.map(row => new TableRow({
        children: row.map((cell, i) => new TableCell({
          borders,
          width: { size: widths[i], type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: cell, size: 18, font: "Segoe UI" })] })]
        }))
      }))
    ]
  });
}

// ─── Build document ───

async function main() {
  const doc = new Document({
    numbering: {
      config: [{
        reference: "numbering1",
        levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.LEFT }]
      }]
    },
    sections: [{
      properties: {
        page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(0.75), left: convertInchesToTwip(1), right: convertInchesToTwip(1) } }
      },
      children: [
        // ════════════════════════════════════════
        // TITLE PAGE
        // ════════════════════════════════════════
        spacer(), spacer(), spacer(), spacer(), spacer(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "QB Engineer", bold: true, size: 56, font: "Segoe UI", color: "1E40AF" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 50 }, children: [new TextRun({ text: "Open Source Manufacturing Operations Platform", size: 28, font: "Segoe UI", color: "475569" })] }),
        spacer(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 50 }, children: [new TextRun({ text: "Production · R&D Workflow · Job Tracking · Engineer Focus Dashboard", size: 22, font: "Segoe UI", italics: true, color: "64748B" })] }),
        spacer(), spacer(),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Master Specification Document", bold: true, size: 24, font: "Segoe UI" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 50 }, children: [new TextRun({ text: "Version 2.0 | March 2026 | GNU Licensed", size: 20, font: "Segoe UI", color: "64748B" })] }),
        spacer(), spacer(), spacer(), spacer(),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "This document consolidates all functional specifications, architecture decisions,", size: 18, font: "Segoe UI", color: "64748B" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "integration design, and workflow definitions for the QB Engineer platform.", size: 18, font: "Segoe UI", color: "64748B" })] }),

        pageBreak(),

        // ════════════════════════════════════════
        // TABLE OF CONTENTS (manual)
        // ════════════════════════════════════════
        h1("Table of Contents"),
        spacer(),
        p("1. Executive Summary"),
        p("2. Problem Statement"),
        p("3. Architecture & Tech Stack"),
        p("4. Application Modules"),
        p("    4.1 Kanban Board — Configurable Track Types"),
        p("    4.2 Job Card Detail"),
        p("    4.3 Part / Product / Assembly Catalog"),
        p("    4.4 CAD / STL / CAM File Management"),
        p("    4.5 Customizable Dashboard"),
        p("    4.6 Planning Cycle Management"),
        p("    4.7 Lead Management"),
        p("    4.8 Customer & Contact Management"),
        p("    4.9 Expense Capture"),
        p("    4.10 Invoice Workflow"),
        p("    4.11 Production Traceability"),
        p("    4.12 Asset / Equipment Registry"),
        p("    4.13 Time Tracking"),
        p("    4.14 Customer Returns"),
        p("    4.15 In-App Guided Training"),
        p("    4.16 Bin & Location Tracking"),
        p("    4.17 Inventory Management & Purchase Orders"),
        p("    4.18 Vendor Management"),
        p("    4.19 Shipping & Carrier Integration"),
        p("    4.20 R&D / Internal Projects"),
        p("    4.21 Admin Settings & Integration Management"),
        p("    4.22 Calendar View"),
        p("    4.23 Production Label Printing"),
        p("    4.24 Chat System"),
        p("5. Shop Floor Display & Time Clock Kiosk"),
        p("6. User Interface & Roles"),
        p("7. Accounting Integration"),
        p("8. Notification System"),
        p("9. Reporting"),
        p("10. Technical Approach"),
        p("11. Phased Delivery Plan"),
        p("12. Out of Scope"),
        p("13. Success Criteria"),

        pageBreak(),

        // ════════════════════════════════════════
        // 1. EXECUTIVE SUMMARY
        // ════════════════════════════════════════
        h1("1. Executive Summary"),
        p("Small and mid-size manufacturers commonly operate with QuickBooks as their primary business system. While QuickBooks handles financial reporting adequately for accounting staff and external CPAs, it does not align with the day-to-day operational reality of a production shop. It does not support production job tracking, R&D tooling workflows, CAD/STL file management, cycle-based work planning, or the focused work patterns required by engineering teams."),
        spacer(),
        p("QB Engineer is a purpose-built operational companion application — a locally hosted, containerized web application that sits alongside your accounting system rather than replacing it. The accounting system remains the financial system of record. QB Engineer becomes the operational system of record: managing jobs, production workflow, R&D iterations, CAD file attachments, production traceability, lead management, inventory tracking, and a focus-oriented engineer dashboard."),
        spacer(),
        p("The application is built on proven open-source technology, runs entirely in Docker containers on local infrastructure, and carries no ongoing SaaS fees or vendor dependencies. It is open-sourced under the GNU license and designed to be company-agnostic — all branding, workflows, and configurations are user-defined."),

        divider(),

        // ════════════════════════════════════════
        // 2. PROBLEM STATEMENT
        // ════════════════════════════════════════
        h1("2. Problem Statement"),
        p("The following pain points are common in small manufacturing operations:"),
        bullet("QuickBooks is not designed for manufacturing operations. It thinks in accounting primitives (debits, credits, chart of accounts) rather than shop primitives (jobs, materials, machines, deadlines)."),
        bullet("No job tracking system connecting quotes, production runs, quality holds, and shipping in a single workflow."),
        bullet("R&D and tooling work lacks a structured workflow. Iterations, test results, and CAD file versions are managed ad hoc."),
        bullet("CAD, STL, and CAM files have no attachment mechanism connected to jobs or parts."),
        bullet("Engineers struggle with focus and task prioritization when using complex multi-screen systems."),
        bullet("The QuickBooks interface is not approachable for shop-floor staff, resulting in errors, avoidance, and workarounds."),
        bullet("No lead management for potential customers before they exist in the accounting system."),
        bullet("No production traceability for lot tracking, material traceability, or quality records."),
        bullet("No cycle-based work planning for organizing and curating work across planning cycles."),
        bullet("No inventory management for tracking physical stock locations, quantities, and movements."),

        divider(),

        // ════════════════════════════════════════
        // 3. ARCHITECTURE & TECH STACK
        // ════════════════════════════════════════
        h1("3. Architecture & Tech Stack"),

        h2("3.1 System Architecture"),
        simpleTable(
          ["Component", "Technology"],
          [
            ["Frontend", "Angular 21 + Angular Material (zoneless, Signal Forms, Vitest)"],
            ["Backend", ".NET 9 Web API (C#)"],
            ["Database", "PostgreSQL + pgvector extension"],
            ["File Storage", "MinIO (local S3-compatible object storage)"],
            ["3D Viewer", "Three.js (STL inline rendering)"],
            ["Real-time Sync", "SignalR (WebSocket pub-sub)"],
            ["Background Jobs", "Hangfire + Hangfire.PostgreSql"],
            ["Object Mapping", "Mapperly (source-generated)"],
            ["API Docs", "OpenAPI + Scalar"],
            ["Containerization", "Docker Compose"],
            ["Authentication", "ASP.NET Identity (JWT bearer tokens)"],
            ["Accounting", "Pluggable — QuickBooks Online (default), extensible to Xero, Sage, etc."],
          ],
          [2800, 6560]
        ),

        h2("3.2 Docker Compose — 7 Containers"),
        simpleTable(
          ["Container", "Purpose"],
          [
            ["forge-ui", "Nginx serving Angular build, proxies API calls"],
            ["forge-api", ".NET 9 Web API, accounting integration, business logic"],
            ["forge-db", "PostgreSQL + pgvector with persistent volume"],
            ["forge-storage", "MinIO with persistent volume"],
            ["forge-backup", "Scheduled backup jobs (pg_dump + rclone)"],
            ["forge-ai", "Ollama LLM runtime (optional — app works without it)"],
            ["forge-backup-target", "MinIO replica on secondary machine (separate compose)"],
          ],
          [2800, 6560]
        ),

        h2("3.3 Authentication"),
        bullet("ASP.NET Identity with custom ApplicationUser"),
        bullet("JWT bearer tokens for Angular SPA"),
        bullet("Refresh token rotation (long-lived sessions for workstation use)"),
        bullet("Roles are additive — users can hold multiple"),
        bullet("Accounting provider OAuth tokens stored on shared AccountingConnection (single company-level connection)"),
        bullet("Token encryption via ASP.NET Data Protection API (keys in Postgres)"),

        h2("3.4 Pluggable Accounting Integration"),
        bullet("IAccountingService common interface — customers, invoices, estimates, POs, payments, time activities, employees, vendors, items"),
        bullet("QuickBooks Online is the default and primary provider — pre-selected in admin setup"),
        bullet("Additional providers (Xero, FreshBooks, Sage) implement the same interface"),
        bullet("AccountingServiceFactory resolves the active provider from system_settings.accountingProvider"),
        bullet("Each provider owns: auth flow, API client, DTO mapping to/from common models"),
        bullet("Sync queue, caching, and orphan detection are provider-agnostic"),
        bullet("App works in standalone mode (no provider) — financial features degrade gracefully"),

        h2("3.5 Deployment Flexibility"),
        p("Designed for on-premise deployment initially — Docker Compose on a local machine, accessed via browser on the LAN. However, the containerized architecture is inherently cloud-ready:"),
        bullet("All configuration via environment variables and appsettings.json"),
        bullet("Health check endpoints for orchestrator liveness/readiness probes"),
        bullet("Stateless API — horizontal scaling supported"),
        bullet("MinIO is S3-compatible — can be swapped for any S3 provider"),
        bullet("PostgreSQL can be replaced with a managed database service"),
        bullet("Same Docker images run on: Docker Compose, Kubernetes, Azure Container Apps, AWS ECS, or any Docker host"),

        h2("3.6 Backup Strategy"),
        pBold("Primary — Backblaze B2 (off-site): ", "Daily pg_dump + rclone sync for MinIO. Retention: 7 daily, 4 weekly, 3 monthly."),
        pBold("Secondary — Local machine replication (on-site): ", "MinIO bucket replication + DB dumps to a second machine on LAN."),
        p("Backup status visible in system health panel."),

        divider(),

        // ════════════════════════════════════════
        // 4. APPLICATION MODULES
        // ════════════════════════════════════════
        h1("4. Application Modules"),

        // 4.1 Kanban Board
        h2("4.1 Kanban Board — Configurable Track Types"),
        p("The core of the application is a Kanban-style job board with configurable workflow tracks."),
        h3("Built-in Track Types"),
        pBold("Production Track ", "(aligned to accounting document lifecycle):"),
        simpleTable(
          ["Stage", "Accounting Document"],
          [
            ["Quote Requested", "—"],
            ["Quoted", "Estimate created"],
            ["Order Confirmed", "Estimate → Sales Order"],
            ["Materials Ordered", "Purchase Order(s) created"],
            ["Materials Received", "PO marked received"],
            ["In Production", "—"],
            ["QC / Review", "—"],
            ["Shipped", "Sales Order → Invoice"],
            ["Invoiced / Sent", "Invoice delivered"],
            ["Payment Received", "Payment recorded"],
          ],
          [3120, 6240]
        ),
        spacer(),
        pBold("R&D / Tooling Track: ", "Concept → Design → CAD Review → Prototype / Test → Iteration → Tooling Approval → Handoff to Production"),
        pBold("Maintenance Track: ", "Reported → Assessed → Parts Ordered → Scheduled → In Progress → Completed → Verified"),
        pBold("Other (generic): ", "Open → In Progress → Done"),
        pBold("Custom Track Types: ", "Administrators can create new track types with custom names, colors, icons, stage sequences, and per-track custom fields."),
        spacer(),
        h3("Card Movement Rules"),
        bullet("Cards move freely forward and backward unless an accounting document at that stage is irreversible"),
        bullet("Irreversible stages (Invoice, Payment): drag is blocked with an explanation"),
        bullet("Reversible stages (Estimate, Sales Order, unfulfilled PO): backward move triggers a double confirmation showing the document to be voided"),
        bullet("Both confirmations are logged in the audit trail"),
        bullet("In standalone mode (no accounting provider): all movements are free"),

        // 4.2 Job Card
        h2("4.2 Job Card Detail"),
        h3("Universal Fields (all track types)"),
        bullet("Title, description, customer or asset reference"),
        bullet("Due date and priority flag"),
        bullet("Assigned user(s)"),
        bullet("File attachments (versioned by revision)"),
        bullet("Activity log (timestamped history of all changes)"),
        bullet("Subtasks (lightweight checklist: text, optional assignee, done/not done)"),
        bullet("Linked cards (related to, blocks/blocked by, parent/child)"),
        bullet("Time entries"),
        bullet("Accounting document references and billing status (read-only)"),
        h3("Custom Fields"),
        p("Defined via JSON template per track type. Supported types: text, number, boolean, date, select, multiselect, textarea. Rendered dynamically by Angular form generator."),
        h3("Production Traceability"),
        bullet("Production runs tab (multiple runs per job)"),
        bullet("Lot number, material lot, machine, operator, quantity produced/rejected"),
        bullet("QC sign-off with checklist"),

        // 4.3 Part Catalog
        h2("4.3 Part / Product / Assembly Catalog"),
        p("A structured part catalog with recursive Bill of Materials (BOM) supporting assemblies nested to any depth. CAD/STL files attach at the part level. Parts link to accounting system items for pricing."),
        h3("Part Record"),
        bullet("Part number (auto-generated or manual), description, revision level"),
        bullet("Status: Draft, Active, Obsolete"),
        bullet("Part type: Part or Assembly"),
        bullet("Material/resin specification, mold/tool reference"),
        bullet("Accounting item linkage for pricing/invoicing"),
        bullet("Default storage location (bin)"),
        bullet("Minimum stock level and reorder quantity"),
        bullet("CAD/STL/CAM files versioned by revision"),
        h3("Recursive BOM"),
        p("Parts can be components of assemblies. Assemblies can contain sub-assemblies to the nth tier. Each BOM entry includes: child part reference, quantity, reference designator, sort order, source type (In-House / Purchased), and notes."),
        h3("Revision Control"),
        bullet("Each revision can have its own files (updated drawings, new STL)"),
        bullet("Jobs reference a specific part revision so production records are exact"),
        bullet("Obsolete revisions cannot be used on new jobs"),

        // 4.4 File Management
        h2("4.4 CAD / STL / CAM File Management"),
        simpleTable(
          ["File Type", "Notes"],
          [
            [".STEP / .F3D / .SLDPRT", "Native CAD files, all revisions retained"],
            [".STL", "Mesh files; inline 3D preview via Three.js"],
            [".NC / .TAP", "CNC/CAM toolpaths"],
            [".PDF", "Drawings, specs, customer documents"],
            [".JPG / .PNG", "Photos of parts, test results, defect documentation"],
          ],
          [2800, 6560]
        ),
        spacer(),
        bullet("Files stored in MinIO, metadata in database. Files never deleted — only superseded."),
        bullet("STL Viewer: rotate, zoom, pan, wireframe toggle, full-screen expand"),
        bullet("Default open to all authenticated users; optional per-file restriction"),
        bullet("No file size limit by default (configurable). Chunked upload with progress bar."),

        // 4.5 Dashboard
        h2("4.5 Customizable Dashboard"),
        p("Widget-based dashboard with role-appropriate defaults and full per-user customization."),
        simpleTable(
          ["Role", "Default Widgets"],
          [
            ["Engineer", "Daily priorities, assigned jobs, overdue items, recent activity, cycle progress"],
            ["PM", "Backlog count, cycle progress chart, overdue jobs, lead pipeline, team workload"],
            ["Manager", "Team overview, expense approvals pending, cycle progress, overdue"],
            ["Admin", "System health, user activity, accounting sync status, storage usage"],
          ],
          [1800, 7560]
        ),
        spacer(),
        pBold("Daily Priority Card: ", "Top 3 tasks for today, count of jobs needing action, approaching deadlines."),
        pBold("End-of-Day Prompt: ", "At configurable time, overlay prompts: \"What are your top 3 for tomorrow?\""),
        pBold("Screensaver / Ambient Mode: ", "On idle, full-screen display of current priorities. Restores on mouse movement."),

        // 4.6 Sprint Management
        h2("4.6 Planning Cycle Management"),
        p("Default 2-week duration (configurable). Day 1 is Planning Day."),
        h3("Planning Day Flow"),
        numbered("Maintenance due this cycle — system scans asset schedules, prompts to auto-create and assign cards"),
        numbered("Rollover — unfinished tasks from previous cycle: keep, return to backlog, or archive"),
        numbered("Backlog curation — split-panel screen: prioritized backlog (left), this cycle (right). Drag to commit."),
        numbered("Cycle goals — optional freeform text displayed on dashboard for the duration"),

        // 4.7 Lead Management
        h2("4.7 Lead Management"),
        p("Leads represent potential customers before they exist in the accounting system."),
        bullet("Statuses: New → Contacted → Quoting → Converted → Lost"),
        bullet("\"Convert to Customer\" creates a customer in the accounting system and links records"),
        bullet("\"Convert and Create Job\" does both in one step"),
        bullet("Internal quotes can auto-generate an Estimate on conversion"),
        bullet("Lost leads: reason captured (price, capability, timing, competitor, no response). Searchable, can be reopened."),

        // 4.8 Customer & Contacts
        h2("4.8 Customer & Contact Management"),
        p("Customers are read/written from the accounting system — no duplication. Multiple contacts per customer or lead."),
        bullet("Fields: name, title, phone, email, role tag (Primary, Technical, Billing, Shipping, Other)"),
        bullet("Sortable — drag to reorder, auto-sort suggestion based on usage frequency"),
        bullet("Primary contact syncs to/from accounting; additional contacts live in the app"),
        bullet("Contacts carry over from lead to customer on conversion"),

        // 4.9 Expense Capture
        h2("4.9 Expense Capture"),
        p("Engineer experience — 5 questions, under 60 seconds:"),
        numbered("What was it for? (category dropdown)"),
        numbered("How much? (dollar amount)"),
        numbered("Which job? (optional job picker)"),
        numbered("Snap the receipt (camera/file upload to MinIO)"),
        numbered("Notes (optional)"),
        spacer(),
        pBold("Self-approval: ", "Per-user setting with optional dollar threshold. Self-approved expenses write to accounting immediately."),
        pBold("Approval queue: ", "Non-self-approved expenses go to Manager/Admin queue. Bulk approve available."),

        // 4.10 Invoice Workflow
        h2("4.10 Invoice Workflow"),
        h3("Direct Mode (Solo Operator)"),
        p("Job hits Shipped → engineer confirms → reviews line items → double confirmation → Invoice created in accounting."),
        h3("Managed Mode (With Office Manager)"),
        p("Engineer confirms ready → goes to office manager queue → office manager reviews, creates invoice, or sends back with notes."),
        h3("Nudge System"),
        bullet("0–2 days: informational (green)"),
        bullet("3–5 days: warning (yellow)"),
        bullet("5+ days: urgent (red)"),
        p("Surfaces on dashboard. Timing configurable by admin."),

        // 4.11 Traceability
        h2("4.11 Production Traceability"),
        p("Data model supports FDA 21 CFR Part 820 / ISO 13485 level traceability. Low friction by default, full rigor when needed."),
        h3("Traceability Profiles"),
        pBold("Standard (default): ", "Lot number, material lot, machine, operator, quantity, QC pass/fail"),
        pBold("Medical / Regulated: ", "Full device history record: incoming inspection, CoC, process parameters, dimensional results, final QC checklist, sample retention, packaging/labeling"),
        pBold("Profile assignment: ", "At customer level, job level (override), or track type level (default)."),
        spacer(),
        pBold("Lot lookup: ", "Search by lot number → full forward and backward traceability chain from raw material to customer shipment."),

        // 4.12 Assets
        h2("4.12 Asset / Equipment Registry"),
        p("Asset record: Name, type (Machine, Tooling, Facility, Vehicle, Other), location, manufacturer, model, serial number, status, photo, notes."),
        h3("Scheduled Maintenance"),
        bullet("Recurring rules per asset: description, interval (days or machine hours), last completed"),
        bullet("On Planning Day: system scans for due maintenance, prompts to auto-create and assign cards"),
        bullet("Overdue schedules escalate visually and surface on manager/owner dashboard"),
        pBold("Downtime logging: ", "Start/stop datetime fields on maintenance cards."),

        // 4.13 Time Tracking
        h2("4.13 Time Tracking"),
        bullet("Two input methods: start/stop timer on a task, or manual entry"),
        bullet("Primary audience: part-time production workers logging hours for payroll"),
        bullet("Time entries write to accounting system as Time Activities"),
        bullet("Same-day edits allowed; after end of day, entries lock (Admin override with audit trail)"),
        bullet("Overlapping timers blocked, missing time flagged"),
        bullet("Pay period awareness: configurable schedule, workers see period hour totals"),

        // 4.14 Customer Returns
        h2("4.14 Customer Returns"),
        p("One button on completed job cards: \"Customer Return\" — 3 questions."),
        bulletBold("Defective / Wrong Part: ", "auto-creates linked rework card in backlog"),
        bulletBold("Damaged in Shipping: ", "flags for office manager / admin"),
        bulletBold("Customer Changed Mind: ", "flags for office manager / admin"),
        p("All cases → credit memo handled by financial person in accounting system."),

        // 4.15 Training
        h2("4.15 In-App Guided Training System"),
        bullet("First-login tour — role-aware step-by-step overlay"),
        bullet("Per-feature walkthroughs — triggered on first access (3-5 step tooltip sequences)"),
        bullet("Help icon (?) on every page — replays the tour on demand"),
        bullet("Help mode toggle — contextual help icons on all interactive elements"),
        bullet("Build-time check: CI fails if any route is missing a tour definition"),
        bullet("Admin training dashboard: shows which users have completed which walkthroughs"),

        // 4.16 Bin & Location Tracking
        h2("4.16 Bin & Location Tracking"),
        p("Physical storage locations organized in a hierarchy (Area → Rack/Shelf → Bin). Every bin has a printable barcode label."),
        h3("Location Hierarchy"),
        bullet("Recursive structure — areas contain racks, racks contain shelves, shelves contain bins"),
        bullet("Admin manages hierarchy from a settings screen"),
        bullet("Only bins (leaf nodes) hold inventory — parent levels are organizational"),
        h3("Location & Bin Labels"),
        bullet("Bin labels: barcode, bin code, location path, optional QR code"),
        bullet("Location labels (semi-permanent): larger labels for shelves/racks showing name and hierarchy path"),
        bullet("Admin can bulk-print all labels for a new area or rack"),
        bullet("Admin-configurable label dimensions (sticker sheets, thermal roll, full-page, custom)"),
        h3("Scanning UX"),
        bullet("Scan a bin barcode → see contents with options to add, remove, or move items"),
        bullet("Scan a part/lot barcode → see which bin(s) it's in (\"Where is this?\")"),
        bullet("Move items: scan source → select items → scan destination → confirm"),
        h3("Default Bin Locations"),
        bullet("Parts can have a default storage location configured on the part record"),
        bullet("Track types / stages can have default output bins"),
        bullet("System pre-fills bin from default; prompts if no default set"),
        h3("Ready-to-Ship"),
        p("Finished goods marked ready_to_ship surface on job cards at shipping stage and appear on packing slips with bin locations for picking."),
        pBold("Audit trail: ", "All movements logged immutably — who, what, from, to, when, why."),

        // 4.17 Inventory Management & Purchase Orders
        h2("4.17 Inventory Management & Purchase Orders"),
        p("Unified inventory tracking built on the bin/location system. The app owns the physical state (what's where, how much); the accounting system owns the financial value."),

        h3("Purchase Order Lifecycle"),
        p("Industry-standard PO workflow: Draft → Submitted → Acknowledged → Partially Received → Received → Closed."),
        bullet("From a job: create PO from BOM — parts, quantities, and preferred vendor pre-populated"),
        bullet("Standalone: general stock replenishment, not tied to a specific job"),
        bullet("Auto-reorder: system generates draft PO when stock drops below minimum (optional per part)"),
        bullet("Partial receipts: each line tracks ordered, received, and remaining qty. Back-ordered items stay open."),
        bullet("Multi-PO per job: different vendors, staggered orders. Job tracks all linked POs."),
        bullet("Preferred vendor per part: auto-selected on PO creation, stored on part record"),

        h3("Receiving Workflow"),
        numbered("PO arrives at \"Materials Received\" stage (or standalone receive)"),
        numbered("User scans/selects items, enters quantities"),
        numbered("System prompts for bin location (pre-filled from part default)"),
        numbered("Bin contents updated, movement logged"),
        numbered("If PO is job-linked → associated with that job. If general stock → unallocated."),
        numbered("Receive syncs to accounting system (updates PO status, can trigger bill creation)"),

        h3("Allocation, Reservation & Reorder"),
        bullet("Parts reserved for a job when production starts — deducted from available, pick list generated"),
        bullet("Minimum stock levels per part — low-stock alert on dashboard and notification bell"),
        bullet("Optional auto-reorder: draft PO with cancellation window before submission"),
        bullet("Cycle counting: printable count sheets, discrepancy review, admin approval, accounting sync"),
        spacer(),

        // 4.18 Vendor Management
        h2("4.18 Vendor Management"),
        p("Vendors are created and maintained in the accounting system. The app syncs vendor records and displays them as read-only."),
        bullet("Searchable/filterable vendor list with company name, contact info, status"),
        bullet("Read-only vendor detail: address, phone, email, payment terms from accounting"),
        bullet("Linked data: POs issued, parts with this vendor as preferred, receiving history"),
        bullet("No local vendor creation — 'Add Vendor' prompts to create in accounting system first"),
        bullet("Vendor status (active/inactive) from accounting. Inactive hidden from PO selection."),
        spacer(),

        // 4.19 Shipping & Carrier Integration
        h2("4.19 Shipping & Carrier Integration"),
        p("When a job reaches the \"Shipped\" stage, the system supports printing shipping labels and packing slips."),
        h3("Pluggable Carrier Integration"),
        p("Same pattern as accounting — IShippingService interface with provider-specific implementations. Multiple carriers can be active simultaneously."),
        bullet("Supported: UPS, FedEx, USPS, DHL, EasyPost (meta-carrier), or Manual (no API)"),
        bullet("Admin configures carriers in settings with API keys/credentials and ship-from address"),
        bullet("Default carrier and service level configurable, overridable per shipment"),
        h3("Shipping Workflow"),
        numbered("Job reaches \"Shipped\" or user clicks \"Prepare Shipment\""),
        numbered("System pre-fills ship-to from customer, items/weights from job and part catalog"),
        numbered("User selects carrier and service level (or enters manual tracking number)"),
        numbered("Carrier API returns label PDF + tracking number"),
        numbered("Label printed, tracking number stored on job card"),
        h3("Additional Features"),
        bullet("Rate shopping: multiple carriers show rates side-by-side — user picks best option"),
        bullet("Multi-package: each box gets its own label and tracking number"),
        bullet("Packing slips: items, quantities, bin locations (pick list), ship-to, job reference"),
        bullet("Tracking number on job card (clickable link to carrier page)"),
        bullet("Optional delivery confirmation polling with notification"),
        spacer(),

        // 4.20 R&D / Internal Projects
        h2("4.20 R&D / Internal Projects"),
        h3("R&D / Tooling Track"),
        p("Purpose-built Kanban workflow for engineering development: Concept → Design → CAD Review → Prototype / Test → Iteration → Tooling Approval → Handoff to Production."),
        bullet("Iteration loop — cards move backward from test to design without penalty. R&D is non-linear."),
        bullet("Customer field optional — R&D work may be speculative or customer-driven"),
        bullet("Part catalog integration — R&D cards create or update part records. On handoff, the part status is set to Active."),
        bullet("Iteration tracking — each test cycle increments a counter with logged notes and file revisions"),
        bullet("Handoff creates a linked Production track card with full design history"),
        h3("Internal Projects"),
        p("Non-customer operational work tracked on the board like any other card."),
        bullet("Project types (admin-configurable): tooling development, process improvement, fixture design, material testing, machine qualification, facility maintenance"),
        bullet("Open-ended tasks: inventory counts, sweeping, cleaning, organizing workstations, safety walkthroughs, SOP reviews"),
        bullet("Time entries log hours against internal categories (not billable to a customer)"),
        h3("Scheduled Internal Tasks"),
        p("Recurring facility and operational tasks that auto-generate cards on a schedule — same pattern as scheduled maintenance."),
        bullet("Admin creates schedules: task name, recurrence (daily/weekly/biweekly/monthly/custom), default assignee, estimated duration"),
        bullet("On Planning Day: due tasks are presented for auto-card creation alongside maintenance schedules"),
        bullet("Completion history tracked per schedule — adherence rate, average duration, overdue trends"),
        bullet("Overdue scheduled tasks surface on manager dashboard"),
        spacer(),

        // 4.21 Admin Settings & Integration Management
        h2("4.21 Admin Settings & Integration Management"),
        p("The admin settings screen is the central hub for all system configuration — integrations, branding, reference data, user management, and operational settings. Everything is configured through the UI."),

        h3("Third-Party Integrations"),
        p("All managed from a unified Integrations tab with consistent connection status indicators, credential entry, test-connection buttons, and disconnect options."),
        simpleTable(
          ["Integration", "Credential Type", "Notes"],
          [
            ["Accounting (QB Online default)", "OAuth 2.0", "Single active provider; setup wizard on first run"],
            ["Shipping Carriers", "API key / OAuth per carrier", "Multiple carriers active simultaneously"],
            ["Email / SMTP", "Host, port, username, password", "Test-send to verify; falls back to no-send if unconfigured"],
            ["AI Provider (optional)", "Local Ollama URL or cloud API key", "Self-hosted default; app works fully without AI"],
          ],
          [2600, 2200, 4560]
        ),

        h3("User Management"),
        bulletBold("Onboarding: ", "Admin creates user record (name, role, department). Two claim methods: on-site setup code (default) or optional email invite. Employee sets their own password."),
        bulletBold("Offboarding: ", "Admin deactivates account — never hard-deleted. Historical records preserved. Active tasks reassigned. Immediate session revocation available for terminations."),
        bulletBold("Role assignment: ", "Admin assigns/modifies roles at any time. Role changes take effect on next login."),

        h3("Branding"),
        bullet("Logo upload, application name, three brand color pickers (Primary, Accent, Warn)"),
        bullet("Default theme mode (light/dark) — users can override per-account"),
        bullet("Contrast validation warns if colors violate WCAG 3 accessibility thresholds"),
        bullet("Changes apply immediately at runtime — no rebuild or restart"),

        h3("Reference Data"),
        bullet("Single management screen for all lookup/dropdown values across the application"),
        bullet("Add, rename, reorder, deactivate values within any group; add new groups for custom categorization"),
        bullet("Deactivated values hidden from new records but preserved on existing records"),

        h3("System Settings"),
        bullet("Planning cycle duration, planning day toggle, auto-archive days, nudge timing thresholds"),
        bullet("File upload size limit, storage warning threshold, invoice workflow mode"),
        bullet("Default role for new users, backup schedule and retention, terminology overrides"),
        spacer(),

        // 4.22 Calendar View
        h2("4.22 Calendar View"),
        p("Visual calendar showing jobs, maintenance, and internal tasks across time. Month, week, and day views."),
        bullet("Color-coded by type: jobs (blue), maintenance (amber), internal tasks (gray), planning cycle boundaries (green)"),
        bullet("Dense days: when a day has 3+ events, shows summary block (\"5 tasks\") — click to expand full list"),
        bullet("Click any event to navigate to its detail screen"),
        bullet("Filter by track type, assignee, status, customer"),
        bullet("Dashboard widget: mini month view showing event count per day"),
        bullet(".ics export for any filtered view — import into external calendars"),
        spacer(),

        // 4.23 Production Label Printing
        h2("4.23 Production Label Printing"),
        p("When a new production task or run is created, the system prompts to print barcode labels."),
        h3("Label Contents"),
        bullet("Scannable barcode — unique label ID (e.g., LBL-00042-003) resolving to run, lot, and split"),
        bullet("Job number, part/product name, customer name"),
        bullet("Lot number, quantity in this bin"),
        bullet("\"Label X of N\" for multi-bin position"),
        bullet("Production/run date and due date"),
        h3("Multi-Bin Workflow"),
        numbered("User enters total quantity and number of bins (labels)"),
        numbered("System auto-divides quantity across labels (user can adjust)"),
        numbered("Each label shows its specific quantity and position (X of N)"),
        numbered("Labels printed → attached to containers"),
        numbered("Each label scanned into specific bin location"),
        h3("Label Format"),
        bullet("Admin-configurable: sticker sheets (Avery-style), thermal roll, full-page printout, custom dimensions"),
        bullet("Print preview shows exact layout before printing"),
        bullet("Labels reprinted from production run detail screen or job card"),

        // 4.24 Chat
        h2("4.24 Chat System"),
        p("Built-in real-time messaging using existing SignalR infrastructure. No third-party dependency."),
        bullet("1:1 direct messages between any two users"),
        bullet("Group chats — created by any user, named channels with invited members"),
        bullet("Admin-created channels (e.g., \"Shop Floor\", \"Engineering\")"),
        bullet("Chat icon in toolbar with unread count badge"),
        bullet("Opens as dismissable popover panel — user stays on current page"),
        bullet("File/image sharing via existing MinIO upload"),
        bullet("@mention triggers notification in recipient's bell queue"),
        bullet("Entity references (#JOB-1234) auto-link to source"),

        h2("4.25 Shared Component Library & UI Patterns"),
        p("Centralized shared Angular components eliminate per-feature HTML duplication and enforce consistent behavior. Full specs in coding-standards.md Standards #34–37."),
        bulletBold("Data Table: ", "User-configurable columns (show/hide, drag-reorder, resize), per-column sort and filter, gear icon for column management, preferences persisted per user via unique tableId"),
        bulletBold("Form Field Wrappers: ", "AppInput, AppSelect, AppAutocomplete, AppTextarea, AppDatepicker, AppToggle — floating label, reactive form integration, minimal HTML per usage"),
        bulletBold("Validation Pattern: ", "No inline errors. Submit button disables when invalid. Hover popover lists all violations. Live revalidation. Final validation gate before action."),
        bulletBold("Page Layout Shell: ", "Static header, scrollable content, sticky action footer with buttons right-aligned (primary furthest right)"),
        bulletBold("Additional Components: ", "Confirmation Dialog, Entity Picker, File Upload Zone, Status Badge, Detail Side Panel, Avatar, Toolbar, Date Range Picker"),
        bulletBold("User Preferences: ", "Centralized user_preferences table. Key-pattern storage (table:{id}, theme:mode, etc.). Debounced server sync. Restored on login from any device."),
        bulletBold("Layout Rules: ", "No horizontal scrolling (except Kanban). Compact card headers always visible. Dialogs: standard sizes (400/600/800px). Destructive buttons separated on far left."),

        divider(),

        // ════════════════════════════════════════
        // 5. SHOP FLOOR DISPLAY & TIME CLOCK
        // ════════════════════════════════════════
        h1("5. Shop Floor Display & Time Clock Kiosk"),
        p("Dedicated route (/display/shop-floor), no login required for read-only overview. Large text, high contrast, auto-refreshes via SignalR. Browser kiosk mode."),
        p("When idle (no scan interaction), the display shows a live \"who's here, doing what\" board: all clocked-in workers with their names, current task/assignment, and time on task. Also shows active production jobs, machine status, completed-today counts, maintenance alerts, and cycle progress."),

        h2("5.1 Time Clock — Passive Scan Listener"),
        p("The kiosk idles on the overview and waits for a scan event (badge, barcode, NFC). No UI buttons needed to initiate — the worker just scans."),
        spacer(),
        pBold("On scan (not clocked in): ", "System identifies worker, clocks them in, shows brief confirmation overlay, returns to overview."),
        pBold("On scan (clocked in, has tasks): ", "Three-choice prompt: \"Update Task\", \"Clock Out\", or \"Break / Lunch\"."),
        pBold("On scan (clocked in, no tasks): ", "Three-choice prompt: \"Clock Out\", \"Break / Lunch\", or \"Cancel\"."),
        spacer(),
        p("If no scan hardware is configured by admin, workers fall back to logging in normally."),

        h2("5.2 Production Quick Actions"),
        p("When a clocked-in worker chooses \"Update Task\":"),
        bullet("Mark task/production run complete"),
        bullet("Update quantity complete (produced, rejected)"),
        bullet("Update current state (brief status note)"),
        bullet("Start new production run"),
        p("Large buttons optimized for gloved hands (44x44px+ touch targets). After action or idle timeout, screen returns to overview."),

        h2("5.3 Clock Out Flow"),
        bullet("If worker has outstanding production runs / in-progress tasks: prompted to update each one"),
        bullet("For each item: Update Qty, Mark Complete, or Leave As-Is"),
        bullet("If no outstanding items: clock out proceeds immediately"),
        bullet("Clock events sync to accounting system as Time Activities"),

        h2("5.4 Break / Lunch"),
        bullet("Available for all workers — with or without assigned tasks"),
        bullet("Logs a clock-out event with break or lunch reason tag"),
        bullet("Return from break: next scan auto-clocks back in — \"Welcome back, [Name]\""),
        bullet("Break duration calculated and logged"),
        bullet("Overlong breaks (configurable threshold) flagged on manager dashboard"),

        divider(),

        // ════════════════════════════════════════
        // 6. USER INTERFACE & ROLES
        // ════════════════════════════════════════
        h1("6. User Interface & Roles"),

        h2("6.1 Roles (Additive)"),
        p("Users can hold multiple roles. Permissions are the union of all assigned roles."),
        simpleTable(
          ["Role", "Access"],
          [
            ["Engineer", "Kanban board, assigned work, files, expenses, daily prompts, time tracking"],
            ["PM", "Backlog curation, Planning Day, lead management, reporting, priority setting"],
            ["Production Worker", "Simplified task list, start/stop timer, limited card movement, notes/photos"],
            ["Manager", "Everything PM + assign work, approve expenses, set priorities for others"],
            ["Office Manager", "Customer/vendor management, invoice queue, employee docs"],
            ["Admin", "Everything + user management, role assignment, system settings, configuration"],
          ],
          [2200, 7160]
        ),

        h2("6.2 Navigation & Views"),
        bulletBold("Full Task List: ", "Searchable, filterable grid of every job. Sortable, multi-select filters, saved presets, CSV export."),
        bulletBold("Global Search: ", "Persistent search bar (Ctrl+K) across all entities. Results grouped by type. Postgres full-text search."),
        bulletBold("Production Worker View: ", "Simplified task list, big timer, mark complete, add notes/photos. No nav menu or admin features."),

        h2("6.3 Theming & Accessibility"),
        bullet("User-selectable light/dark mode toggle in toolbar"),
        bullet("Admin controls 3 brand colors (primary, accent, warn) — runtime, no rebuild"),
        bullet("Contrast validation warns admin if colors violate WCAG 3 thresholds"),
        bullet("Logo and app name configurable in admin settings"),
        bullet("APCA-based contrast scoring, reduced motion support, keyboard navigation"),
        bullet("Minimum 44x44px touch targets on mobile views"),

        h2("6.4 UX & Visual Design"),
        bullet("Navigation designed for machinists — large, clear, unambiguous"),
        bullet("4px border radius default (no pills except chips). Industrial aesthetic."),
        bullet("Content centered on large screens (~1400px max-width). Kanban/shop floor use full width."),
        bullet("Minimal margin and padding — lean spacing that maximizes usable area"),
        bullet("Maximum 2 levels of navigation depth"),

        h2("6.5 Mobile Responsiveness"),
        pBold("Available on mobile: ", "Daily priorities, timer, card detail (read), expense capture, notifications, production run logging, maintenance reporting."),
        pBold("Desktop only: ", "Full Kanban board, Planning Day, reporting, admin/configuration."),

        divider(),

        // ════════════════════════════════════════
        // 7. ACCOUNTING INTEGRATION
        // ════════════════════════════════════════
        h1("7. Accounting Integration"),
        p("All accounting operations go through IAccountingService — a pluggable interface. QuickBooks Online is the default provider."),

        h2("7.1 What Lives in the Accounting System"),
        p("Customers, Vendors, Items, Estimates, Sales Orders, Purchase Orders, Invoices, Payments, Employee records, Time Activities."),

        h2("7.2 What Lives in QB Engineer Only"),
        p("Kanban state, job card operational fields, file attachments, activity logs, leads, assets, traceability, planning cycles, backlog, custom workflows, user accounts, production runs, QC records, inventory tracking."),

        h2("7.3 Sync Queue"),
        bullet("All accounting write operations go through a persistent queue"),
        bullet("If accounting system is down, operations queue up, app continues working"),
        bullet("Retries with backoff, flags failures in system health panel"),

        h2("7.4 Read Cache"),
        bullet("Accounting data cached locally with last_synced timestamp"),
        bullet("App reads from cache first, background sync refreshes periodically"),
        bullet("Cache staleness shown in system health panel"),

        h2("7.5 Orphan Detection"),
        bullet("Background job compares accounting lists against stored IDs"),
        bullet("Orphaned references flagged in system health panel"),
        bullet("Resolution: re-link, archive, or dismiss"),

        h2("7.6 Stage-to-Document Mapping (QB Online)"),
        simpleTable(
          ["Stage", "Accounting Document"],
          [
            ["Quoted", "Estimate"],
            ["Order Confirmed", "Sales Order"],
            ["Materials Ordered", "Purchase Order(s)"],
            ["Shipped", "Invoice"],
            ["Payment Received", "Payment"],
          ],
          [3120, 6240]
        ),

        divider(),

        // ════════════════════════════════════════
        // 8. NOTIFICATION SYSTEM
        // ════════════════════════════════════════
        h1("8. Notification System"),
        p("Everything is a notification — user-authored messages and system-generated alerts flow through one system. One bell icon, one panel."),
        spacer(),
        pBold("User-authored: ", "Post to everyone, a specific user, or self (private reminder). Inline reply from the panel."),
        pBold("System-generated: ", "Job assignments, due dates, expense approvals, overdue jobs, maintenance due, planning cycle reminders, accounting sync failures, missing time entries, lead follow-up reminders."),
        spacer(),
        h3("Notification UX"),
        bullet("Bell icon → dropdown panel with filter tabs: All | Messages | Alerts"),
        bullet("Link to source: \"View\" link navigates to the relevant entity"),
        bullet("Non-dismissable items persist until resolved (system health, production status)"),
        bullet("Pin important items, bulk mark read / dismiss"),
        bullet("Per-user preference per type: in-app only, in-app + email, or muted"),
        pBold("Email: ", "Via SMTP with .ics calendar attachments for scheduled events."),

        h3("Disconnection & Offline Queue"),
        bullet("Persistent banner on connection loss: \"Connection lost. Changes will be saved and sent when reconnected.\""),
        bullet("Write operations queue in IndexedDB with badge count"),
        bullet("On reconnection: drain progress shown"),
        bullet("Conflicts flagged with resolution options — no silent data loss"),

        divider(),

        // ════════════════════════════════════════
        // 9. REPORTING
        // ════════════════════════════════════════
        h1("9. Reporting"),
        p("All reporting is operational/delivery focused. Financial reporting stays in the accounting system. Pre-built views with date range pickers, filters, and CSV export. Charts via ng2-charts (Chart.js). Reports are role-gated."),
        spacer(),

        h2("9.1 My Reports (All Authenticated Users)"),
        p("Every employee can view their own historical data:"),
        bullet("My Work History — jobs/tasks completed, filterable by date range, track type, customer"),
        bullet("My Time Log — hours per day/week/month by job or internal task, weekly/monthly totals"),
        bullet("My Expense History — submitted expenses with approval status"),
        bullet("My Planning Cycle Summary — planned work vs completed per cycle, personal throughput"),
        bullet("My Training Progress — completed tours, pending modules"),

        h2("9.2 Operational Reports (PM, Manager, Admin)"),
        bullet("Jobs by Stage — snapshot across kanban, filterable by track type, customer, assignee"),
        bullet("Overdue Jobs — past due, sorted by severity, with days overdue"),
        bullet("On-Time Delivery Rate — trend over time"),
        bullet("Average Lead Time — quote-to-ship, by customer/part/track type"),
        bullet("Time in Stage (Bottleneck Analysis) — average dwell time per stage"),
        bullet("Team Workload — assignments per worker, capacity view"),
        bullet("Employee Productivity — hours by employee, jobs completed, on-time rate"),
        bullet("Labor Hours by Job — time entries per job (hours, not dollars)"),
        bullet("Expense Summary — by category, employee, status, date range"),
        bullet("Cycle Review — planned work vs delivered, rollover, throughput trend"),
        bullet("Customer Activity — jobs per customer, lead time, on-time rate, return rate"),
        bullet("Quote-to-Close Rate — estimates sent vs orders confirmed"),

        h2("9.3 Inventory & Production Reports"),
        bullet("Inventory Levels — stock by part/location, low-stock highlights, reorder status"),
        bullet("Inventory Movement — receipts, consumption, adjustments, transfers over time"),
        bullet("Quality / Scrap Rate — rejected vs produced, by part/job/employee"),
        bullet("Cycle Time by Part — average production time, useful for quoting"),
        bullet("Shipping Summary — by carrier, cost trends, delivery confirmation rates"),

        h2("9.4 Maintenance, Leads & R&D Reports"),
        bullet("Scheduled vs Unscheduled maintenance ratio and trend"),
        bullet("Downtime by Asset — hours, production impact"),
        bullet("Maintenance Compliance — schedule adherence rate"),
        bullet("Active Leads by Status, Conversion Rate, Follow-up Overdue"),
        bullet("Return Rate — by reason, part, customer"),
        bullet("R&D Iterations, Concept to Production time, Internal Task Adherence"),

        h2("9.5 Admin-Only Reports"),
        bullet("System Audit Log — who changed what, when, filterable and searchable"),
        bullet("Integration Health — sync queue, failure rates, last sync per integration"),
        bullet("Storage Usage — by bucket, growth trend"),
        bullet("User Activity — login frequency, last active, role distribution"),
        bullet("Employee Onboarding Status — unclaimed accounts, active/inactive roster"),

        h2("9.6 Scheduled Email Digest (Optional)"),
        bullet("Weekly summary to managers/admin: overdue jobs, cycle progress, maintenance due, low stock"),
        bullet("Configurable per user: opt-in, frequency, content selection. Requires SMTP."),

        divider(),

        // ════════════════════════════════════════
        // 10. TECHNICAL APPROACH
        // ════════════════════════════════════════
        h1("10. Technical Approach"),
        h2("10.1 Development Principles"),
        bullet("Plain language throughout — no accounting jargon in operational views"),
        bullet("Role-based entry points — UI adapts to assigned roles"),
        bullet("Progressive disclosure — simple defaults, detail on demand"),
        bullet("Search-first navigation — one search bar finds anything"),
        bullet("Forgiving by design — edits logged, corrections straightforward"),
        bullet("Confirmation in plain English before consequential actions"),

        h2("10.2 Custom Fields System (JSON-based)"),
        bullet("custom_fields_template JSONB column defines field schema per entity type"),
        bullet("custom_field_values JSONB column stores values per record"),
        bullet("Supported: text, number, boolean, date, select, multiselect, textarea"),
        bullet("Searchable via Postgres JSONB operators"),

        h2("10.3 Terminology & Localization"),
        bullet("Admin-configurable terminology — relabel any concept (Job → Work Order, Planning Cycle → Work Period, etc.)"),
        bullet("Full i18n: English default, Spanish ships as first additional language"),
        bullet("Community can contribute translations via PRs"),
        bullet("Per-user language preference, admin sets system default"),

        h2("10.4 Audit Trail"),
        p("Every create, update, delete logged automatically. Immutable records: timestamp, user, entity, action, old value, new value. Searchable by Admin."),

        divider(),

        // ════════════════════════════════════════
        // 11. PHASED DELIVERY
        // ════════════════════════════════════════
        h1("11. Phased Delivery Plan"),
        simpleTable(
          ["Phase", "Deliverable", "Includes"],
          [
            ["1 — Foundation", "Docker Compose + Kanban + job cards", "All containers, EF Core schema, tracks, card CRUD, files, mock layer"],
            ["2 — Engineer UX", "Dashboard + Planning Day", "Priorities, ambient mode, end-of-day prompt, planning cycle cadence, backlog"],
            ["3 — Accounting Bridge", "Full accounting integration", "Sync queue, caching, orphan detection, document lifecycle, OAuth"],
            ["4 — Leads & Contacts", "Lead-to-customer pipeline", "Lead CRUD, conversion, contacts, custom fields"],
            ["5 — Traceability & QC", "Production lot tracking", "Production runs, profiles, QC checklists, lot lookup"],
            ["6 — Time & Workers", "Time tracking + worker views", "Timer, manual entry, time activity sync, worker view, shop floor"],
            ["7 — Expenses & Invoicing", "Expense capture + invoicing", "Expense prompt, receipts, approval, invoice nudge, direct/managed"],
            ["8 — Maintenance", "Asset registry + maintenance", "Asset CRUD, schedules, planning cycle integration, downtime"],
            ["9 — Reporting", "Operational dashboards", "All report views, charts, CSV export"],
            ["10 — Backup & Polish", "Production hardening", "B2 backup, replication, email, .ics, mobile responsive"],
            ["11 — AI Assistant", "Self-hosted AI module", "Ollama, pgvector, RAG, smart search, document Q&A"],
          ],
          [1800, 2800, 4760]
        ),

        divider(),

        // ════════════════════════════════════════
        // 12. OUT OF SCOPE
        // ════════════════════════════════════════
        h1("12. Out of Scope (Initial Build)"),
        bullet("General ledger, chart of accounts, or accounting replacement"),
        bullet("Benefits administration"),
        bullet("CRM / sales pipeline beyond lead management"),
        bullet("Native mobile app — responsive browser is sufficient"),
        bullet("Cloud hosting required initially (Docker is cloud-ready when needed)"),
        bullet("Full MRP with automated procurement (inventory tracking is included)"),
        bullet("Custom report builder"),
        bullet("Data migration from legacy systems (greenfield deployment)"),
        bullet("NACHA / ACH payroll file generation"),

        divider(),

        // ════════════════════════════════════════
        // 13. SUCCESS CRITERIA
        // ════════════════════════════════════════
        h1("13. Success Criteria"),
        bullet("Engineer can view all assigned jobs and today's priorities without opening the accounting system"),
        bullet("Jobs flow through stages aligned to the accounting document lifecycle with automatic record creation"),
        bullet("Any job card can have CAD/STL files attached and viewable inline within 3 clicks"),
        bullet("R&D iteration history is fully captured and searchable"),
        bullet("Planning Day curates work from a prioritized backlog into 2-week cycles"),
        bullet("Leads convert to accounting system customers with full history preserved"),
        bullet("Production lot numbers trace backward to raw material and forward to customer shipment"),
        bullet("Scheduled maintenance auto-generates cards on Planning Day"),
        bullet("Part-time workers can log time that feeds directly into accounting system payroll"),
        bullet("Expenses are captured with receipt photos in under 60 seconds"),
        bullet("Shop floor display shows real-time job status and team presence"),
        bullet("Physical inventory tracked across bin locations with full movement audit trail"),
        bullet("The app functions with accounting system unavailable — sync queue holds operations until reconnection"),
        bullet("No company-specific code — fully configurable for any small manufacturer"),

        spacer(), spacer(),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "— End of Document —", italics: true, size: 20, font: "Segoe UI", color: "94A3B8" })] }),
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, "QB-Engineer-Master-Specification.docx");
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated: ${outPath}`);
  console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch(err => { console.error(err); process.exit(1); });
