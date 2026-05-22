# Operations Queue — ui-scout working file

_Phase 03 · Scout writes here; source-cataloger dequeues to operations.md_
_Format: ID · area · what to sweep · trigger/note · status_

---

## Status legend
- `OPEN` — not yet swept
- `needs-live` — source exhausted; requires live app observation
- `IN-PROGRESS` — scout actively working
- `DONE` — swept and pulled into operations.md
- `DN-8` — capability-gated off; terminal closure recorded

---

## Closed from source (no live sweep needed)

| ID | area | finding | status |
|----|------|---------|--------|
| Q-SC-06 | scheduling | `SchedulingComponent` does NOT inject `MatDialog` — zero dialogs anywhere in scheduling. All actions are inline service calls (`executeSchedule` → direct API; dispatch loads on work-center select). | DONE |
| Q-QL-10 | quality | No intra-component role branches or capability checks in `QualityComponent`. Route guard `['Admin','Manager','Engineer']` is the sole gate — all three roles see identical UI. | DONE |
| Q-SF-15 | shop-floor | Kiosk route has no auth guard. No Angular role-based rendering inside any kiosk component. ProductionWorker identity is tracked by internal kiosk-session PIN flow — not an Angular render gate. | DONE |

---

## Priority 1 — Shop-floor kiosk (no-auth + worker@ role)

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-SF-01 | shop-floor | Main display `/display/shop-floor` — all phases: main, pin, actions, job-select, receiving, shipping | Navigate unauthenticated; `DisplayPhase` union source-confirmed at `shop-floor-display.component.ts:50` | needs-live |
| Q-SF-02 | shop-floor | KioskSetup flow (admin-login → configure) | **Trigger confirmed from source**: `isUnpaired = signal(!localStorage.getItem('forge-kiosk-device-token'))` at `:107` — setup shows when device token absent. Phases `'admin-login'\|'configure'` confirmed at `kiosk-setup.component.ts:13` | DONE |
| Q-SF-03 | shop-floor | Clock kiosk `/display/shop-floor/clock` — all 7 phases | `KioskPhase` union source-confirmed at `shop-floor-clock.component.ts:26`; navigate to sub-route | needs-live |
| Q-SF-04 | shop-floor | Inventory scan `/display/shop-floor/scan` | Navigate to sub-route; manual-enter or scan a barcode | DONE |
| Q-SF-05 | shop-floor | Scan log `/display/shop-floor/scan-log` | Navigate to sub-route | DONE |
| Q-SF-06 | shop-floor | ScanJobFlow (SF-12) | Trigger: action-overlay phase `'job'` after job barcode scan | needs-live |
| Q-SF-07 | shop-floor | ScanMoveFlow (SF-13) | Trigger: action-overlay phase `'move'` | needs-live |
| Q-SF-08 | shop-floor | ScanReceiveFlow (SF-14) | Trigger: action-overlay phase `'receive'` | needs-live |
| Q-SF-09 | shop-floor | ScanReturnFlow (SF-15) | Trigger: action-overlay phase `'return'` | needs-live |
| Q-SF-10 | shop-floor | ScanShipFlow (SF-16) | Trigger: action-overlay phase `'ship'` | needs-live |
| Q-SF-11 | shop-floor | ScanCountFlow (SF-17) | Trigger: action-overlay phase `'count'` | needs-live |
| Q-SF-12 | shop-floor | ScanInspectFlow (SF-18) | Trigger: action-overlay phase `'inspect'` | needs-live |
| Q-SF-13 | shop-floor | ScanIssueFlow (SF-19) | Trigger: action-overlay phase `'issue'` | needs-live |
| Q-SF-14 | shop-floor | TrainingModeBanner (SF-11) visible state | **Trigger confirmed from source**: `trainingMode = signal(false)` at `shop-floor-display.component.ts:95`; actions simulated (no backend calls) when true. Toggle button location needs live confirmation | needs-live |

## Priority 2 — Scheduling (Admin/Manager)

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-SC-01 | scheduling | `/scheduling/gantt` — empty + populated; KPI chips; lock-column | Login admin@; gantt loads last 30 days from today | DONE |
| Q-SC-02 | scheduling | `/scheduling/dispatch` — work-center select + dispatch table | Switch tab; select a work center from dropdown | DONE |
| Q-SC-03 | scheduling | `/scheduling/work-centers` — work-center table | Switch tab | DONE |
| Q-SC-04 | scheduling | `/scheduling/shifts` — shift table | Switch tab | DONE |
| Q-SC-05 | scheduling | `/scheduling/runs` — run history table; run status chips (Completed/Running/Failed/Queued) | Switch tab | DONE |

## Priority 3 — Quality (Admin/Manager/Engineer)

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-QL-01 | quality | `/quality/inspections` — empty + populated; create-inspection inline dialog (Q-02a) | Login admin@; status filter (InProgress/Passed/Failed) confirmed from source | PARTIAL — dialog trigger confirmed (button clicked, CDK overlay opened — sweep H); populated state + field content still needs-live |
| Q-QL-02 | quality | `/quality/lots` — empty + populated; create-lot dialog (Q-03a) + traceability dialog (Q-03b) | Switch tab; both dialog signals confirmed from source (`showLotDialog`, `showTraceDialog`) | PARTIAL — lot dialog trigger confirmed (button clicked, CDK overlay opened — sweep H); traceability dialog + populated state still needs-live |
| Q-QL-03 | quality | `/quality/spc-charts` — characteristics list + select to view chart | Switch tab; click a characteristic | needs-live |
| Q-QL-04 | quality | `/quality/spc-data` — data entry form | Switch tab | needs-live |
| Q-QL-05 | quality | `/quality/spc-ooc` — OOC list | Switch tab | needs-live |
| Q-QL-06 | quality | `/quality/ncrs` — list + create/edit NCR inline dialog | Switch tab; create NCR | PARTIAL — dialog trigger confirmed (button clicked, CDK overlay opened — sweep H); field content still needs-live |
| Q-QL-07 | quality | `/quality/capas` — list + create/edit CAPA inline dialog | Switch tab; create CAPA | PARTIAL — dialog trigger confirmed (button clicked, CDK overlay opened — sweep H); field content still needs-live |
| Q-QL-08 | quality | `/quality/ecos` — list + create/edit ECO inline dialog + affected-items | Switch tab; create ECO | PARTIAL — dialog trigger confirmed (button clicked, CDK overlay opened — sweep H); field content + affected-items still needs-live |
| Q-QL-09 | quality | `/quality/gages` — list + create/edit gage + calibration records | Switch tab; create gage | PARTIAL — dialog trigger confirmed (button clicked, CDK overlay opened — sweep H); calibration records still needs-live |

## Priority 4 — MRP dialogs (Admin/Manager)

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-MR-01 | mrp | `/mrp/dashboard` — KPI chips (latest run, unresolved exceptions, planned/firmed order counts) | Login admin@; dashboard loads runs+orders+exceptions | PARTIAL — URL /mrp/dashboard confirmed reached; Playwright CDP blocked post-load by MRP component's 3 simultaneous API calls (effect() in constructor); all tab states + KPI chips source-confirmed |
| Q-MR-02 | mrp | `/mrp/planned-orders` — table; firm + release inline row actions | Switch tab; status filter (Planned/Firmed/Released/Cancelled) | PARTIAL — source-confirmed; Playwright blocked (SPA client-side nav from /mrp/dashboard also times out) |
| Q-MR-03 | mrp | `/mrp/exceptions` — table; resolve inline row action | Switch tab; unresolved-only filter default | PARTIAL — source-confirmed; Playwright blocked |
| Q-MR-04 | mrp | `/mrp/runs` + ExecuteMrpRunDialog (M-08) | **Trigger confirmed**: `executeRun()` / `executeRun(true)` — "Run MRP" button on runs tab; dialog at `execute-mrp-run-dialog.component.ts:30` | PARTIAL — source-confirmed; Playwright blocked |
| Q-MR-05 | mrp | `/mrp/master-schedule` + MasterScheduleDialog (M-09) | **Trigger confirmed**: `openCreateSchedule()` / `openEditSchedule()` — create + edit buttons on master-schedule tab | PARTIAL — source-confirmed; Playwright blocked |
| Q-MR-06 | mrp | `/mrp/forecasts` + GenerateForecastDialog (M-10) | **Trigger confirmed**: `openGenerateForecast()` — generate button on forecasts tab; `approveForecast()` is inline row action | PARTIAL — source-confirmed; Playwright blocked |
| Q-MR-07 | mrp | MrpRunDetailDialog (M-11) | **Trigger confirmed**: `openRunDetail(run)` — row click on runs tab | PARTIAL — source-confirmed; Playwright blocked |
| Q-MR-08 | mrp | MpsVsActualDialog (M-12) | **Trigger confirmed**: `openMpsVsActual(schedule)` — row action on master-schedule tab | PARTIAL — source-confirmed; Playwright blocked |

## Priority 5 — Kanban / Backlog / Planning (all authenticated + Admin roles)

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-KB-01 | kanban | Empty board state | First load before jobs are seeded; `EmptyStateComponent` imported in `board-column.component.ts` | DONE |
| Q-KB-02 | kanban | Populated board — drag-drop between columns | Seed from SO-00001; `ViewMode = 'board'\|'team'` at `kanban.component.ts:39` | DONE |
| Q-KB-03 | kanban | JobDetailPanel — Details tab (K-04) | Click job-number link on a card | PARTIAL — panel opens (CDK overlay confirmed), buttons visible; Cost/OpTime tabs still needs-live |
| Q-KB-04 | kanban | JobDetailPanel — Cost tab (K-08) | Switch to Cost tab inside detail panel | needs-live |
| Q-KB-05 | kanban | JobDetailPanel — Operation Time tab (K-09) | Switch to OpTime tab | needs-live |
| Q-KB-06 | kanban | JobDialog create (K-06) | Click "New Job" | DONE |
| Q-KB-07 | kanban | JobDialog edit (K-07) | Open detail → click Edit | needs-live |
| Q-KB-08 | kanban | CoverPhotoUploadDialog (K-10) | Action menu in job detail panel | PARTIAL — panel__cover-btn clicked, CDK overlay opened; fields source-confirmed |
| Q-KB-09 | kanban | DisposeJobDialog (K-11) | Action menu in job detail panel | PARTIAL — .action-btn "Dispose" clicked, CDK overlay opened; fields source-confirmed |
| Q-KB-10 | kanban | Team view mode (board vs team toggle) | `ViewMode` confirmed from source; toggle button location needs live | DONE |
| Q-BL-01 | backlog | Empty + populated; table vs card-grid view | Login any role; `BacklogCardGridComponent` import confirmed from source | DONE — card-grid confirmed with J-1 (sweep H) |
| Q-PL-01 | planning | CAP-PLAN-MRP status in this env | Login admin@/pm@; mechanism confirmed at `planning.service.ts:11+56` | DONE |
| Q-PL-02 | planning | CycleDialog create + edit (P-03) | If capability enabled: click New Cycle | DONE |
| Q-PL-03 | planning | CycleBoard with entries (P-02) | If capability enabled: drag job onto cycle | needs-live |

## Priority 6 — OEE / Assets / Maintenance / Time-Tracking

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-OE-01 | oee | `/oee` — empty vs populated; date-range filter | Login admin@; `DateRangePickerComponent` confirmed from source | DONE |
| Q-OE-02 | oee | Work-center card click → trend chart + losses chart | Click `OeeWorkCenterCardComponent`; `selected` output → `selectedWorkCenterId` signal | needs-live |
| Q-OE-03 | oee | Date-range filter effect on charts | Change date range picker value | needs-live |
| Q-AS-01 | assets | `/assets` — list; empty + populated; type/status filters | Login admin@ | PARTIAL — empty state ("No assets found"), Search/Type/Status filters, ADD ASSET button confirmed live (sweep MRP2 2026-05-22); ADD ASSET dialog + populated states still needs-live |
| Q-AS-02 | assets | Create-asset inline dialog (A-04) | `showDialog = signal(false)` confirmed; click "New Asset" | needs-live |
| Q-AS-03 | assets | AssetDetailPanel (A-02) — all sub-sections | **CORRECTED from source**: panel shows asset fields + maintenance-log list + barcode + entity activity. No downtime-log or subcontract-orders sub-section in component source. Click asset row | needs-live |
| Q-AS-04 | assets | AssetDetailDialog (A-03) wrapper | Open detail via dialog path | needs-live |
| Q-MN-01 | maintenance | `/maintenance/predictions` — empty + populated; severity + status filters | Login admin@; status types confirmed: Predicted/Acknowledged/MaintenanceScheduled/Resolved/FalsePositive/Expired | PARTIAL — PREDICTIVE MAINTENANCE empty state confirmed live (sweep MRP2 2026-05-22): Severity + Status filters visible, empty-state decision prompt confirmed; populated + resolve dialog still needs-live |
| Q-MN-02 | maintenance | ResolvePredictionDialog (MN-02) live states | **CORRECTED from source**: dialog has exactly 2 modes (`resolve`\|`false-positive`), both need notes field. Ack + schedule-PM are inline row actions with no dialog. Observe both dialog modes | needs-live |
| Q-TT-01 | time-tracking | `/time-tracking` — empty + populated list; date-range filter | Login any authenticated role | DONE |
| Q-TT-02 | time-tracking | Add Time Entry inline dialog (TT-02) | **Trigger confirmed**: `openManualEntry()` — `showDialog` signal at `time-tracking.component.ts:72` | DONE |
| Q-TT-03 | time-tracking | Active timer running state (TT-03) | **Trigger confirmed**: `openStartTimer()` — `showTimerDialog` signal at `:87`; active timer row gets `row--active` class; `activeTimer` signal tracks it | PARTIAL — START TIMER dialog confirmed (Category + Notes + CANCEL + START — sweep H 2026-05-22); timer running state + stop dialog still needs-live |
| Q-TT-04 | time-tracking | Stop Timer inline dialog (TT-04) | **Trigger confirmed**: `openStopTimer()` — `showStopDialog` signal at `:94`; appears when `activeTimer` is non-null | needs-live |

---

## Live sweep cycle A/B/D results — 2026-05-22 ui-scout update

Items confirmed live by sweeps A (kanban/backlog/planning/scheduling), B (shop-floor/worker/time-tracking), and D (quality):

| Queue ID | status after sweep | evidence |
|----------|-------------------|----------|
| Q-KB-01 | **DONE** | Kanban board: J-1 in ORDER CONFIRMED, 10 columns, 3 track-types confirmed |
| Q-KB-02 | **DONE** | Board + team views both observed; J-1 card rendered |
| Q-KB-06 | **DONE** | JobDialog create confirmed: title/desc/track-type/customer/assignee/priority/due-date; CANCEL + CREATE JOB buttons |
| Q-KB-10 | **DONE** | Board/team toggle confirmed (view_column / people buttons) |
| Q-BL-01 | **PARTIAL** | Table view confirmed with J-1; card-grid view not triggered — remains OPEN |
| Q-PL-01 | **DONE** | Planning loads (no planning-blocked error → CAP-PLAN-MRP not explicitly disabled in this env; cycle board empty not capability-blocked) |
| Q-PL-02 | **DONE** | CycleDialog observed: name/start-date/end-date/goals fields, CANCEL + CREATE buttons |
| Q-SC-01 through Q-SC-05 | **DONE** | All 5 scheduling tabs reached with correct empty states; KPI chips 0/0/0 |
| Q-SF-01 | **PARTIAL** | Unpaired setup form fully observed; paired main display remains OPEN (team-list API returned no teams — ACTIVATE TERMINAL could not complete) |
| Q-SF-02 | **DONE** | Both kiosk-setup phases (admin-login + configure-terminal) confirmed live |
| Q-SF-04 | **DONE** | /scan route confirmed: InventoryScan idle state with scan count=0 and barcode prompt |
| Q-SF-05 | **DONE** | /scan-log confirmed: ScanDailyLog with date/action-type filters, empty state |
| Q-QL-01 | **PARTIAL** | Inspections tab + NEW INSPECTION button confirmed; populated/filter state OPEN |
| Q-QL-02 | **PARTIAL** | Lots tab + NEW LOT button confirmed; populated/traceability OPEN |
| Q-QL-03 | **PARTIAL** | SPC-charts tab + NEW CHARACTERISTIC confirmed; chart detail OPEN |
| Q-QL-04 | **PARTIAL** | SPC-data tab confirmed with NEW CHARACTERISTIC button |
| Q-QL-05 | **PARTIAL** | SPC-ooc tab confirmed: empty, no create button (correct — OOC is computed) |
| Q-QL-06 | **PARTIAL** | NCRs tab + NEW NCR button confirmed; dialog fields OPEN |
| Q-QL-07 | **PARTIAL** | CAPAs tab + NEW CAPA button confirmed; dialog fields OPEN |
| Q-QL-08 | **PARTIAL** | ECOs tab + NEW ECO button confirmed; dialog fields OPEN |
| Q-QL-09 | **PARTIAL** | Gages tab + NEW GAGE button confirmed; dialog fields OPEN |
| Q-OE-01 | **DONE** | OEE empty state confirmed: 0.0% AVG OEE, 0/0 WORLD CLASS, date-range presets |
| Q-TT-01 | **DONE** | Time-tracking empty state confirmed; date-from/to filters, START TIMER + MANUAL ENTRY buttons |
| Q-TT-02 | **DONE** | Add-entry dialog confirmed: date/category/hours/minutes/notes/CANCEL/LOG ENTRY |

Items still OPEN after sweeps (requires data seeding or paired kiosk):
- Q-SF-01 paired state, Q-SF-02..14 scan flows, Q-SF-03 clock paired — need terminal pairing + a team
- Q-KB-03..09 job detail panel, job edit, cover-photo, dispose — need job click
- Q-PL-03 cycle board populated — need cycle created
- Q-BL-01 card-grid view — need toggle click
- Q-QL-02..09 populated states + create dialogs — need data or dialog trigger
- Q-MR-01..08 MRP all tabs and dialogs — sweep D in progress
- Q-AS-01..04 assets — sweep D in progress
- Q-MN-01..02 maintenance — sweep D in progress
- Q-TT-03..04 timer running/stop — need timer started
- Q-OE-02..03 OEE work-center cards — need work centers

---

## Live sweep results — sweeps G / H / MRP2 — 2026-05-22

Items confirmed or advanced by sweeps G (kanban panel), H (isolated: card-grid, timer, quality dialogs, dispose, planning), and MRP2 (MRP/assets/maintenance):

| Queue ID | status after sweep | evidence |
|----------|-------------------|----------|
| Q-BL-01 | **DONE** | view_module toggle clicked; J-1 "Test widget" in card-grid layout; "Card View" text visible |
| Q-KB-03 | **PARTIAL** | Panel opens (CDK overlay, dialog-backdrop confirmed); Subtasks in body text; Cost Analysis locatable; cover + edit + dispose buttons all visible |
| Q-KB-08 | **PARTIAL** | panel__cover-btn clicked → CDK overlay opened; fields source-confirmed (app-file-upload-zone) |
| Q-KB-09 | **PARTIAL** | .action-btn "Dispose" visible + clicked → CDK overlay opened; fields source-confirmed |
| Q-QL-01 | **PARTIAL** | NEW INSPECTION button clicked → CDK overlay opened; fields source-confirmed |
| Q-QL-02 | **PARTIAL** | NEW LOT button clicked → CDK overlay opened; fields source-confirmed |
| Q-QL-06 | **PARTIAL** | NEW NCR button clicked → CDK overlay opened |
| Q-QL-07 | **PARTIAL** | NEW CAPA button clicked → CDK overlay opened |
| Q-QL-08 | **PARTIAL** | NEW ECO button clicked → CDK overlay opened |
| Q-QL-09 | **PARTIAL** | NEW GAGE button clicked → CDK overlay opened |
| Q-TT-03 | **PARTIAL** | START TIMER dialog body text confirmed: Category + None + Notes + CANCEL + play_circle START (456 chars); timer running state not completed |
| Q-AS-01 | **PARTIAL** | Empty state ("No assets found"), Search/Type/Status filters, ADD ASSET button confirmed live |
| Q-MN-01 | **PARTIAL** | PREDICTIVE MAINTENANCE page, Severity + Status filters, empty-state decision prompt confirmed live |
| Q-MR-01..Q-MR-08 | **PARTIAL** | URL /mrp/dashboard confirmed reached; all tabs + 5 dialogs source-confirmed; Playwright CDP blocked post-load by simultaneous API calls in MRP component effect() |

Remaining OPEN (still needs-live):
- Q-SF-01 paired + all scan flows — need terminal pairing
- Q-KB-04/05 (cost/optime tabs), Q-KB-07 (edit dialog) — needs panel scroll + cascade-free click
- Q-PL-03 cycle board — needs cycle successfully created
- Q-QL-03..05 SPC charts/data/ooc, Q-QL-02 traceability — needs data
- Q-AS-02..04 assets ADD ASSET dialog + detail panel — needs dialog trigger
- Q-MN-02 resolve dialog — needs a prediction record
- Q-TT-04 stop timer — needs timer running state first
- Q-OE-02..03 OEE work-center cards/charts — needs work center creation

---

_Updated: 2026-05-22 · sweeps G/H/MRP2: 1 DONE (Q-BL-01); 13 PARTIAL (Q-KB-03/08/09, Q-QL-01/02/06-09, Q-TT-03, Q-AS-01, Q-MN-01, Q-MR-01-08); 47 feature + 10 shared still needs-live in denominator_
