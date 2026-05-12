# New User Guide — Getting Started with Forge

## Who This Guide Is For

This guide is for **employees who have already been set up by their administrator** and are getting oriented with the system. Your admin has already created your account and provided your credentials or PIN — you're already in.

---

## What You See First: The Dashboard

After logging in you land on the **Dashboard** (`/dashboard`). This is your personal home base. It shows:

- **Today's Tasks** — jobs assigned to you with due times
- **Active Timer** — if you have a timer running, it appears here
- **Deadlines** — upcoming job due dates
- **Cycle Progress** — how the current planning sprint is tracking
- **Open Orders** — sales orders in progress (managers/office staff)
- **Margin Summary** — financial snapshot (managers)

The dashboard is customizable — click **Customize** in the top right to add, remove, or rearrange widgets.

---

## Navigating the Application

The **left sidebar** is your main navigation. Icons expand to labels when you hover or click the chevron at the bottom. The sidebar is the same for everyone, but some pages are only accessible based on your role.

The **header bar** (top strip) contains:
- **Search** (`Ctrl+K`) — find any job, part, customer, or file instantly
- **Chat** — internal messaging
- **This AI assistant** — ask questions about how to use the system
- **Notifications bell** — alerts and updates
- **Theme toggle** — switch between light and dark mode
- **User menu** (top right) — your profile, account settings, logout

---

## Where to Go Based on Your Role

### Engineer / Production Worker
Your primary workspace is the **Kanban Board** (`/kanban`). Jobs assigned to you appear as cards. Drag them between columns as work progresses.

Key pages:
- `/kanban` — your job board
- `/time-tracking` — clock in/out, start timers linked to jobs
- `/parts` — part specs, BOMs, 3D STL viewer
- `/inventory` — check stock levels, bin locations
- `/quality` — QC inspection checklists
- `/account` — your profile, tax forms (W-4, state withholding), pay stubs

### Project Manager / PM
Your focus is planning and throughput.

Key pages:
- `/backlog` — all jobs, filterable by status/priority/assignee
- `/planning` — sprint cycle management, drag jobs into active cycle
- `/reports` — margin, velocity, on-time delivery, capacity utilization
- `/leads` — sales pipeline

### Office Manager
Your focus is customers, orders, and financials.

Key pages:
- `/customers` — customer database with contacts and order history
- `/invoices` — invoice lifecycle
- `/payments` — record and apply payments
- `/shipments` — packing slips, tracking, partial delivery
- `/purchase-orders` — POs to vendors, receiving

### Manager / Admin
You have access to everything above, plus:
- `/admin` — user management, track types, terminology, integrations, compliance
- `/expenses` — approval queue for submitted expenses
- `/reports` — full report library

---

## Common First Tasks

### Finding Your Assigned Jobs
Go to **Kanban** (`/kanban`). Your jobs appear across all columns. Use the **Swimlane** toggle (people icon in toolbar) to filter the board to show only your cards.

### Logging Time
Go to **Time Tracking** (`/time-tracking`) → click **Start Timer** → link it to a job. Or use the timer directly from a job card on the Kanban board.

### Completing Your Employee Profile
Go to **My Account** (`/account`). A yellow banner at the top of the dashboard indicates if any required items are missing (emergency contact, tax forms, documents). These may block job assignment if not completed.

### Updating Tax Forms (W-4, State Withholding)
Go to **My Account** (`/account`) → **Tax Forms** tab. You can complete or update your W-4 and state withholding forms here without going through HR.

### Searching for Anything
Press `Ctrl+K` from anywhere in the application. This searches across all jobs, parts, customers, and files simultaneously.

---

## Key Concepts

**Jobs** — the central unit of work. A job moves through stages on the Kanban board (Quote → Production → QC → Shipped → Invoiced → Paid). Everything ties back to a job: time entries, files, parts, notes.

**Track Types** — jobs are organized by track: Production, R&D/Tooling, Maintenance, and custom types. Switch between tracks using the tabs at the top of the Kanban board.

**Stages** — the columns on the Kanban board. Each stage maps to a business milestone. Moving a card to "Shipped" or "Invoiced" stages has downstream effects (shipment records, invoices).

**Priority** — jobs have a priority (Critical, High, Medium, Low) shown as a colored indicator on the card. Critical jobs appear with a red indicator.

---

## Getting Help

- **This AI assistant** — click the robot icon in the header bar and ask any question about using the system
- **Help Tour** — click the `help_outline` icon on the Kanban board or other pages for a guided feature tour
- **Keyboard Shortcuts** — press `?` from most pages to see available shortcuts
- **Your manager or admin** — for role or access questions, account issues, or anything not covered here

There is no external support line for this application. All help is provided through this AI assistant or within your organization.
