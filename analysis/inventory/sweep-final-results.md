# Forge UI Component Inventory — Live Sweep Results
**Date**: 2026-05-22  
**Environment**: http://localhost:4200 (dev server, seeded demo data)  
**Auth**: admin@forge.local / ForgeRun!2026 (id=2, role=Admin)  
**Method**: Playwright headless Chromium + localStorage token injection  
**Coverage note**: MRP capability is disabled (`CAP-PLAN-MRP`) — that section documented from source HTML only. Maintenance resolve dialog documented from source HTML only (no prediction records to seed via API).

---

## SF-01 / SF-02: Kiosk Setup — Admin Login Phase

**Route**: `/shop-floor` (before pairing)  
**Component**: `app-root` + kiosk setup shell

### Phase 1 — Admin Login
**Text observed**: "Terminal Setup — An administrator must configure this kiosk before use"

| Field | Type | Notes |
|-------|------|-------|
| Admin Email | text (email) | `input[formControlName="email"]` |
| Password | password | `input[type="password"]`, visibility toggle button |

**Button**: `login SIGN IN AS ADMIN`

---

## SF-03 / SF-04: Kiosk Setup — Configure Phase

**Component**: kiosk configure phase (reached after SIGN IN AS ADMIN)  
**Text observed**: "dns Configure Terminal — Name this terminal and assign it to a team"

| Field | Type | Notes |
|-------|------|-------|
| Terminal Name | text | free text |
| Team | select | options: "Floor Team A (0 members)"; also shows "add CREATE NEW TEAM" link |

**Buttons**: `check ACTIVATE TERMINAL`

---

## SF-05 through SF-19: Shop Floor Main Display (post-pairing)

**Route**: `/shop-floor` (after activation)  
**Text observed**: "Shop Floor — 0 WORKING 0 ON BREAK 0 UNASSIGNED 0 DONE TODAY"

**Components live on page**:
- `app-shop-floor-display`
- `app-training-mode-banner`
- `app-kiosk-session-bar`
- `app-kiosk-search-bar`
- `app-avatar` (one per employee listed)
- `app-scan-action-overlay`
- `app-offline-banner`
- `app-loading-overlay`
- `app-toast-container`
- `app-keyboard-shortcuts-help`
- `app-chat-preview-popup`
- `app-demo-marker`

**Header stats row**: `0 WORKING | 0 ON BREAK | 0 UNASSIGNED | 0 DONE TODAY`  
**Controls**: `text_decrease 12px text_increase` (font size), `receipt_long` (logs), `devices` (devices), `undo` (undo), `dark_mode` (theme toggle)  
**Clock**: live time display `05:49:44 PM`

**Employee avatar grid** (each `app-avatar`): initials badge + name + IN/OUT status  
Employees shown: Admin Two (AT), Alex Engineer (AE), Casey OfficeManager (CO), Forge Admin (FA), Lead Intake Service (LI), Morgan Manager (MM), Pat PM (PP), Sam Worker (SW)

**Bottom bar**: `contactless Scan your badge or RFID to clock in`

---

## SF-20: Shop Floor Clock View

**Route**: `/shop-floor/clock` (accessed via `devices` icon on main display)  
**Component**: `app-shop-floor-clock`

**Components live on page**:
- `app-root`
- `app-shop-floor-clock`
- `app-kiosk-search-bar`
- `app-barcode-scan-input`
- `app-offline-banner`
- `app-loading-overlay`
- `app-toast-container`
- `app-keyboard-shortcuts-help`
- `app-chat-preview-popup`
- `app-demo-marker`

**Text observed**: "FLOOR TEAM A — 05:49:44 PM — Friday, May 22, 2026"  
**Stats**: `0 WORKING | 0 ON BREAK | 0 OFF | 0 ACTIVE JOBS | 0 DONE TODAY`  
**Sections**: `group TEAM STATUS — No employees registered` | `assignment ACTIVE JOBS — No active jobs`  
**Footer**: `qr_code_scanner person CLOCK IN MANUALLY`

---

## K-01 through K-06: Kanban Board

**Route**: `/kanban` (or `/board`)  
**Components live on page**:
- `app-kanban`
- `app-page-header`
- `app-select` (view filter)
- `app-board-column` (one per stage)
- `app-job-card` (one per job in column)
- `app-empty-state` (empty columns)

**Page header controls**: `view_column` (column toggle), `people Team Members (All assigned users)`, `person MY WORK`, `add NEW JOB`  
**Tooltip**: "Drag cards between columns to move jobs. Ctrl+Click to multi-select for bulk actions."

**Board columns (stages)**: QUOTE REQUESTED, QUOTED, ORDER CONFIRMED, IN PROGRESS, ON HOLD, READY FOR QC, IN QC, COMPLETE, SHIPPED  
Sub-boards (filter tabs): PRODUCTION, R&D/TOOLING, MAINTENANCE

**Live data**: J-1 "Test widget" in ORDER CONFIRMED column

**Job card** (`app-job-card`) text: job number + title + stage badge

---

## K-07: Job Detail — Edit Dialog

**Trigger**: `edit` icon-button inside job detail panel  
**Dialog title**: "EDIT JOB"  
**Dialog component**: opens as CDK overlay (`mat-dialog-container`)

| Field | Type | Placeholder/Notes |
|-------|------|-------------------|
| Title | text | "Job title" |
| Description | textarea | — |
| Customer | select | (Acme Corp pre-filled for J-1) |
| Assignee | select | — |
| Priority | select | (Normal pre-filled) |
| Due Date | text/date | — |

**Buttons**: `CANCEL` | `save SAVE CHANGES`

---

## K-08: Job Detail — Cost Analysis Tab

**Section**: scrollable `jd-section` within job detail panel (not a Material tab)  
**Component in panel**: `app-job-cost-tab`  
**Coverage**: Section heading confirmed present. Inner field content not individually captured (requires scroll within panel). Source template at `job-detail-panel.component.html`.

**Section label**: "COST ANALYSIS"  
**Child component**: `app-job-cost-tab`

---

## K-09: Job Detail — Operation Time Tab

**Section**: scrollable `jd-section` within job detail panel  
**Component in panel**: `app-operation-time-tab`  
**Coverage**: Section heading confirmed present.

**Section label**: "OPERATION TIME"  
**Child component**: `app-operation-time-tab`  
**Data table**: `app-data-table` (confirmed present in panel component list)

---

## K-03 through K-06: Job Detail Panel — All Sections

**Trigger**: Click job card on Kanban board  
**Rendering pattern**: `DetailDialogService` → `MatDialog.open()` → CDK overlay  
**Components inside dialog**:
- `app-job-detail-dialog`
- `app-job-detail-panel`
- `app-input`
- `app-select`
- `app-job-cost-tab`
- `app-operation-time-tab`
- `app-data-table`
- `app-entity-activity-section`
- `app-status-timeline`
- `app-barcode-info`
- `app-entity-link`
- `app-file-upload-zone`

**Header**: job number (J-1), status chip `ORDER CONFIRMED expand_more`, action buttons: `play_circle` (start timer), `add_photo_alternate` (photos), `edit` (edit dialog), `close`

**Description**: "Test widget — Auto-created from Sales Order SO-00001, Line 1. Qty: 5.0000."

**Panel sections** (in scroll order):
1. **SUBTASKS** — text input "Add a subtask..." + `add` button + `account_tree EXPLODE BOM`
2. **LINKED CARDS** — search "Search jobs..." + Type select + `add` button
3. **PARTS** — search "Search parts..." + `add` button
4. **COST ANALYSIS** — `app-job-cost-tab`
5. **OPERATION TIME** — `app-operation-time-tab` + `app-data-table`
6. **ACTIVITY** — `app-entity-activity-section` with tabs: ALL, CONVERSATION, NOTES, HISTORY
7. **DETAILS** — `app-status-timeline`, `app-barcode-info`, `app-entity-link`
8. **FILES** — `app-file-upload-zone` (`download grid_on settings` controls)
9. **TIME** — time entries sub-section

---

## Q-02a: Quality — New QC Inspection Dialog

**Route**: `/quality` → Inspections tab  
**Trigger**: `add NEW INSPECTION` button  
**Rendering pattern**: `app-dialog` inline (`.dialog-backdrop`)  
**Dialog title**: "NEW QC INSPECTION"

| Field | Type | Notes |
|-------|------|-------|
| Template | select | — |
| Job ID | number | — |
| Lot Number | text | — |
| Notes | textarea | — |

**Buttons**: `CANCEL` | `CREATE INSPECTION`  
**Validation indicator**: `warning 1` (1 required field)

---

## Q-03a: Quality — New Lot Record Dialog

**Route**: `/quality` → Lots tab  
**Trigger**: `add NEW LOT` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "NEW LOT RECORD"

| Field | Type | Notes |
|-------|------|-------|
| Part ID | number | required |
| Quantity | number | required |
| Lot Number | text | placeholder "Auto-generated if blank" |
| Job ID | number | optional |
| Supplier Lot # | text | optional |
| Notes | textarea | optional |

**Buttons**: `CANCEL` | `warning 1 CREATE LOT`  
**Validation indicator**: `warning 1`

---

## Q-08: Quality — Create Non-Conformance (NCR) Dialog

**Route**: `/quality` → NCRs tab  
**Trigger**: `add NEW NCR` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "CREATE NON-CONFORMANCE"

| Field | Type | Default/Notes |
|-------|------|---------------|
| Type | select | "Internal" (default) |
| Detection Stage | select | "Receiving" (default) |
| Part ID | number | optional |
| Job ID | number | optional |
| Description | textarea | required |
| Affected Quantity | number | required |
| Defective Quantity | number | optional |
| Containment Actions | textarea | optional |

**Buttons**: `CANCEL` | `warning 3 CREATE`  
**Validation indicator**: `warning 3` (3 required fields)

---

## Q-09: Quality — Create CAPA Dialog

**Route**: `/quality` → CAPAs tab  
**Trigger**: `add NEW CAPA` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "CREATE CAPA"

| Field | Type | Default/Notes |
|-------|------|---------------|
| Type | select | "Corrective" (default) |
| Source | select | "Other" (default) |
| Title | text | required |
| Problem Description | textarea | required |
| Impact Description | textarea | optional |
| Owner ID | number | required |
| Priority | select | "3 — Medium" (default) |
| Due Date | date | optional |

**Buttons**: `CANCEL` | `warning 4 CREATE`  
**Validation indicator**: `warning 4`

---

## Q-10: Quality — Create Engineering Change Order (ECO) Dialog

**Route**: `/quality` → ECOs tab  
**Trigger**: `add NEW ECO` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "CREATE ENGINEERING CHANGE ORDER"

| Field | Type | Default/Notes |
|-------|------|---------------|
| Title | text | required |
| Change Type | select | required |
| Revision | text | optional |
| Priority | select | "Normal" (default) |
| Description | textarea | required |
| Reason for Change | textarea | optional |
| Impact Analysis | textarea | optional |
| Effective Date | date | optional |

**Buttons**: `CANCEL` | `warning 2 CREATE`  
**Validation indicator**: `warning 2`

---

## Q-11: Quality — New Gage Dialog

**Route**: `/quality` → Gages tab  
**Trigger**: `add NEW GAGE` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "NEW GAGE"

| Field | Type | Notes |
|-------|------|-------|
| Description | text | required |
| Gage Type | text | optional |
| Manufacturer | text | optional |
| Model | text | optional |
| Serial Number | text | optional |
| Calibration Interval (Days) | number | required |
| Accuracy Spec | text | optional |
| Range Spec | text | optional |
| Resolution | text | optional |
| Notes | textarea | optional |

**Buttons**: `CANCEL` | `warning 1 save CREATE`  
**Validation indicator**: `warning 1`

---

## Q-12: Quality — New SPC Characteristic Dialog

**Route**: `/quality` → SPC tab  
**Trigger**: `add NEW CHARACTERISTIC` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "NEW CHARACTERISTIC"

| Field | Type | Notes |
|-------|------|-------|
| Part ID | number | required |
| Operation ID | number | optional |
| Name | text | required |
| Description | textarea | optional |
| Measurement Type | select | "Variable" (default) |
| Nominal Value | number | required |
| Unit of Measure | text | optional |
| Lower Spec Limit | number | required |
| Upper Spec Limit | number | required |
| Sample Size (n) | number | required |
| Decimal Places | number | required |
| Sample Frequency | text | optional |
| Notify on OOC | toggle | optional |
| Active | toggle | default on |

**Buttons**: `CANCEL` | `warning 5 CREATE`  
**Validation indicator**: `warning 5`

---

## MRP-01: MRP Dashboard (source-only — capability disabled)

**Route**: `/mrp`  
**Note**: `CAP-PLAN-MRP` feature flag is disabled. Page hangs on API calls. All data below from source HTML (`mrp.component.html`).

**Tabs** (implemented as `button.tab`, not `[role="tab"]`):
1. Dashboard
2. Planned Orders
3. Exceptions
4. Run History
5. Master Schedule
6. Forecasts

**Dashboard + Run History tabs**: `RUN MRP` button + `SIMULATE` button

---

## MRP-02: Execute MRP Run Dialog (source-only)

**Source**: `execute-mrp-run-dialog.component.html`  
**Dialog title**: "EXECUTE MRP RUN"

| Field | Type | Notes |
|-------|------|-------|
| Run Type | select | options: Full, Net Change |
| Planning Horizon Days | number | range 1–730, suffix "days" |

**Buttons**: `CANCEL` | `RUN MRP`

---

## MRP-03: Master Schedule Dialog (source-only)

**Source**: `master-schedule-dialog.component.html`

| Field | Type | Notes |
|-------|------|-------|
| Name | text | required |
| Description | textarea | optional |
| Period Start | date | required |
| Period End | date | required |
| Lines (repeating) | — | `add ADD LINE` button |
| — Part | entity-picker | required |
| — Quantity | number | required |
| — Due Date | date | required |
| — Notes | text | optional |

---

## MRP-04: Generate Forecast Dialog (source-only)

**Source**: `generate-forecast-dialog.component.html`

| Field | Type | Notes |
|-------|------|-------|
| Name | text | required |
| Part | entity-picker | required |
| Method | select | required |
| Historical Periods | number | range 2–60, required |
| Forecast Periods | number | range 1–36, required |
| Smoothing Factor | number | optional (shown when method = Exponential Smoothing) |

---

## ASSET-01: Assets List Page

**Route**: `/assets`  
**Components live on page**:
- `app-assets`
- `app-page-header`
- `app-input` (Search)
- `app-select` (Type filter, Status filter)
- `app-data-table`

**Page header buttons**: `add ADD ASSET`  
**Table columns**: (checkbox), NAME, TYPE, LOCATION, MANUFACTURER, STATUS, HOURS, (actions: download, grid_on, settings)

**Live data row**: `precision_manufacturing CNC Mill #1 | Machine | — | — | ACTIVE | —`

---

## ASSET-02: Add Asset Dialog

**Route**: `/assets` → `ADD ASSET` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "ADD ASSET"

| Field | Type | Default/Notes |
|-------|------|---------------|
| Name | text | required |
| Type | select | "Machine" (default) |
| Location | text | optional |
| Manufacturer | text | optional |
| Model | text | optional |
| Serial Number | text | optional |
| Notes | textarea | optional |
| **Acquisition & Depreciation section** | | collapsible |
| Acquisition Cost | number | optional |
| Depreciation Method | select | optional |
| Work Center ID | number | optional |
| GL Account (optional) | text | optional |

**Buttons**: `CANCEL` | `warning 1 save NEW ASSET`

---

## ASSET-03: Asset Detail Panel

**Trigger**: Click any row in assets table  
**Components added to page**: `app-asset-detail-dialog`, `app-asset-detail-panel`, `app-barcode-info`, `app-entity-activity-section`

**Detail panel content** (CNC Mill #1):
```
precision_manufacturing  CNC Mill #1  Machine  [edit] [close]
STATUS    ACTIVE
HOURS     0
qr_code_2 BARCODE   AST-CNC Mill #1   [content_copy] [print PRINT] [refresh REGENERATE]
SET STATUS ▶ [ACTIVE] [MAINTENANCE] [RETIRED] [OUT OF SERVICE]
MAINTENANCE HISTORY
  build_circle  No maintenance logs
ACTIVITY
  [ALL] [CONVERSATION] [NOTES] [HISTORY]
  No activity yet.
```

**Barcode ID format**: `AST-{asset name}`  
**Status options in SET STATUS menu**: ACTIVE, MAINTENANCE, RETIRED, OUT OF SERVICE  
**Source fields** (from `asset-detail-panel.component.html`): Status, Location, Manufacturer, Model, Serial Number, Hours; optional Tooling Details section; Notes section; Maintenance History section; Activity section

---

## TIME-01: Time Tracking Page

**Route**: `/time-tracking`  
**Components live on page**:
- `app-time-tracking`
- `app-page-header`
- `app-datepicker` (From / To date range)
- `app-data-table`
- `app-empty-state`

**Page header buttons**: `play_circle START TIMER` | `edit_note MANUAL ENTRY`  
**Summary row**: "Total: 0.0h across 0 entries"

**Table columns** (visible when timer running): DATE, USER, JOB, CATEGORY, DURATION, NOTES, TYPE, (actions: delete)

---

## TIME-02: Start Timer Dialog

**Trigger**: `play_circle START TIMER` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "START TIMER"

| Field | Type | Default/Notes |
|-------|------|---------------|
| Category | select | "None" (default) |
| Notes | textarea | optional |

**Buttons**: `CANCEL` | `play_circle START`

---

## TIME-03: Running Timer State

**Observed after starting timer**: Button changes to `stop_circle STOP TIMER (0M)`  
**Table row**: `timer | 05/22/2026 06:00 PM | Forge Admin | — | — | RUNNING | — | TIMER | [delete]`  
**Active row indicator**: `RUNNING` badge in DURATION column

---

## TIME-04: Stop Timer Dialog

**Trigger**: `stop_circle STOP TIMER` button (visible when timer running)  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "STOP TIMER"

| Field | Type | Notes |
|-------|------|-------|
| (info) | static text | "Timer running for Xm" |
| Notes (optional) | textarea | optional |

**Buttons**: `CANCEL` | `stop_circle STOP TIMER`

---

## TIME-05: Manual Log Time Entry Dialog

**Trigger**: `edit_note MANUAL ENTRY` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "LOG TIME ENTRY"

| Field | Type | Default/Notes |
|-------|------|---------------|
| Date | date | — |
| Category | select | "None" (default) |
| Hours | number | — |
| Minutes | number | — |
| Notes | textarea | optional |

**Buttons**: `CANCEL` | `save LOG ENTRY`

---

## OEE-01: OEE Dashboard Page

**Route**: `/oee`  
**Components live on page**:
- `app-oee`
- `app-page-layout`
- `app-date-range-picker` (From / To)
- `app-kpi-chip` (AVG OEE summary)
- `app-oee-work-center-card` (one per work center)
- `app-select` (Granularity, inside detail panel)
- `app-oee-trend-chart`
- `app-six-big-losses-chart`

**Page date presets**: `LAST 30 DAYS` | `THIS MONTH` | `THIS WEEK`  
**KPI chip**: `0.0% AVG OEE | 0/1 WORLD CLASS`

---

## OEE-02: OEE Work Center Card

**Component**: `app-oee-work-center-card`  
**Live data** (CNC-01):
```
CNC-01
[world-class badge — not shown at 0%]
0.0% OEE
AVAILABILITY  100.0%
PERFORMANCE   0.0%
QUALITY       0.0%
0 total   0 good   0 scrap
```

**Card fields** (from `oee-work-center-card.component.html`):
- Work center name
- World-class badge (shown when OEE >= threshold)
- OEE % gauge
- AVAILABILITY %, PERFORMANCE %, QUALITY % factor rows
- total / good / scrap counts

---

## OEE-03: OEE Detail Panel

**Trigger**: Click a work center card  
**Panel renders inline** (right side of same page — no new route or CDK overlay)

**Detail panel content** (CNC-01):
```
CNC-01 — Detail
Granularity: [Daily ▾]   (app-select)
OEE TREND               (app-oee-trend-chart — empty state)
SIX BIG LOSSES          (app-six-big-losses-chart)
  check_circle  No losses recorded for this period
```

**Granularity options** (from source): Daily, Weekly, Monthly

---

## PLAN-01: Planning Page

**Route**: `/planning`  
**Components live on page**:
- `app-planning`
- `app-page-header`
- `app-select` (Cycle selector)
- `app-input` (Backlog search)
- `app-empty-state` ("No planning cycle selected")
- `app-cycle-dialog` (when NEW CYCLE clicked)
- `app-dialog`
- `app-dirty-form-indicator`
- `app-datepicker`
- `app-textarea`
- `app-validation-button`

**Page header buttons**: `add NEW CYCLE`  
**Empty state buttons**: `CREATE FIRST CYCLE`

**Backlog panel** (left side, always visible):  
```
Backlog  1 JOBS
[Search] [Priority ▾]
J-1  Test widget  ORDER CONFIRMED  Normal
```

---

## PLAN-02: New Planning Cycle Dialog

**Trigger**: `add NEW CYCLE` button  
**Rendering pattern**: `app-dialog` inline via `app-cycle-dialog`  
**Dialog title**: "NEW PLANNING CYCLE"

| Field | Type | Placeholder/Notes |
|-------|------|-------------------|
| Cycle Name | text | "e.g. Sprint 12" |
| Start Date | date | required |
| End Date | date | required |
| Goals | textarea | optional |

**Buttons**: `CANCEL` | `warning 1 save CREATE`  
**Validation indicator**: `warning 1` (Cycle Name required)

---

## PLAN-03: Cycle Board (source-only — cycle not created in sweep)

**Source**: `cycle-board.component.html`  
**Component**: `app-cycle-board`  
**Note**: Cycle board renders only after a cycle exists. Board was not populated during sweep (cycle creation with valid dates not completed in Playwright run).

**Board structure** (from source):
- Board header: cycle name, start/end dates, job count, completion stats
- Progress bar (% complete)
- Goals text
- CDK drag-drop list: `cdkDropList`
- Each entry row: job number, title, stage chip, priority chip, assignee avatar, rolled-over badge (if carried from previous cycle)

---

## MAINT-01: Predictive Maintenance Page

**Route**: `/maintenance/predictions`  
**Components live on page**:
- `app-predictions`
- `app-page-layout`
- `app-toolbar`
- `app-select` (Severity filter, Status filter)
- `app-data-table`
- `app-empty-state`

**Filter defaults**: Severity: "All severities", Status: "Open (not yet resolved)"  
**Page description**: "Open predictions need a decision: acknowledge, schedule preventive work, resolve, or mark false-positive. Resolved + false-positive close the loop and feed the model accuracy stats."

**Empty state** (no seeded predictions): "No predictions match the current filter. Lower-severity alerts may be hidden — try Status: All."

**No ADD button** (predictions come from ML model, not manually created).  
**Maintenance predictions POST endpoint returns 404** — no way to seed via API.

---

## MAINT-02: Resolve Prediction Dialog (source-only — no predictions to trigger)

**Source**: `resolve-prediction-dialog.component.html`  
**Trigger**: resolve or mark-false-positive action button on a prediction row  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: dynamic — "Resolve Prediction" OR "Mark as False Positive" (based on mode)

| Field | Type | Notes |
|-------|------|-------|
| Notes | textarea | required, 4 rows, maxlength 2000 |

**Hint text**: dynamic based on mode (resolve vs false-positive)  
**Buttons**: `CANCEL` | primary action button (label changes by mode)

---

## App-Wide Shared Components

Components present on nearly every admin page:
- `app-root` — shell
- `app-header` — top bar with search (`Ctrl+K`), training (`school`), notifications, theme toggle, user menu
- `app-sidebar` — left nav with route icons
- `app-chat` — AI chat panel trigger
- `app-ai-help-panel` — AI help drawer
- `app-training-context-panel` — training context overlay
- `app-connection-banner` — WebSocket status
- `app-announcement-overlay` — system announcements
- `app-onboarding-banner` — first-run onboarding prompt
- `app-offline-banner` — offline indicator
- `app-loading-overlay` — full-page loading spinner
- `app-toast-container` — toast/snackbar notifications
- `app-keyboard-shortcuts-help` — `Ctrl+K` shortcuts modal
- `app-chat-preview-popup` — AI chat floating preview
- `app-demo-marker` — demo mode indicator badge

### Dialog Rendering Patterns

| Pattern | Components | Used By |
|---------|-----------|---------|
| Inline app-dialog | `app-dialog`, `.dialog-backdrop > .dialog` with `.dialog__header/.dialog__body/.dialog__footer` | Quality dialogs, Asset dialogs, Timer dialogs, Planning cycle, OEE (not applicable), Maintenance resolve |
| CDK MatDialog | `.cdk-overlay-container > mat-dialog-container` | Kanban job detail dialog |

### Validation Button Pattern

`app-validation-button` shows `warning N` count of required-but-empty fields; turns to `save` icon when form is valid.

### Activity Section Pattern

`app-entity-activity-section` appears in asset detail panel and job detail panel. Tabs: ALL, CONVERSATION, NOTES, HISTORY.

### Barcode Info Pattern

`app-barcode-info` renders barcode + copy + print + regenerate controls. Format varies: `AST-{name}` for assets, `J-{id}` for jobs.
