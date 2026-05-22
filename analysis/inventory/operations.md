# Operations Region — Component Inventory

_Phase 03 · Sole writer: source-cataloger · Started: 2026-05-22_
_Scope: jobs/kanban, backlog, planning, scheduling, shop-floor/kiosk, time-tracking, OEE, quality, MRP, assets, maintenance_
_Cross-link: Customer Returns → see [quote-to-cash.md §Segment 8](./quote-to-cash.md#segment-8-customer-returns) — NOT re-catalogued here_

---

## Cross-links

- **Customer Returns (RMA)** — fully catalogued in `quote-to-cash.md §Segment 8`. CAP-O2C-RMA is DISABLED in this env (DN-8 terminal closure). No operations-side returns/RMA surface is reachable.
- **PO Receiving** — catalogued in `quote-to-cash.md §Segment 5 (Purchasing & POs)`. Shop-floor `/scan` receive flow cross-links below.
- `master-data.md` — work-center definitions used by scheduling/OEE reference master-data inventory.

---

## Source Map

### Feature directories (operations scope)

| Area | Features path | Routes file | Route(s) | Role guard (source) |
|------|--------------|-------------|----------|---------------------|
| Kanban | `features/kanban/` | `kanban.routes.ts` | `/kanban` | none — all authenticated |
| Backlog | `features/backlog/` | `backlog.routes.ts` | `/backlog` | none — all authenticated |
| Planning | `features/planning/` | `planning.routes.ts` | `/planning` | `['Admin','Manager','PM']` |
| Scheduling | `features/scheduling/` | `scheduling.routes.ts` | `/scheduling/:tab` (→ gantt) | `['Admin','Manager']` |
| Shop-Floor | `features/shop-floor/` | `shop-floor.routes.ts` | `/display/shop-floor[/clock\|/scan\|/scan-log]` | **none — public kiosk, no auth guard** |
| Time-Tracking | `features/time-tracking/` | `time-tracking.routes.ts` | `/time-tracking` | none — all authenticated |
| OEE | `features/oee/` | `oee.routes.ts` | `/oee` | `['Admin','Manager']` |
| Quality | `features/quality/` | `quality.routes.ts` | `/quality/:tab` (→ inspections) | `['Admin','Manager','Engineer']` |
| MRP | `features/mrp/` | `mrp.routes.ts` | `/mrp/:tab` (→ dashboard) | `['Admin','Manager']` |
| Assets | `features/assets/` | `assets.routes.ts` | `/assets` | `['Admin','Manager']` |
| Maintenance | `features/maintenance/` | `maintenance.routes.ts` | `/maintenance/predictions` | `['Admin','Manager']` |

### Shared components referenced by operations features

| Component | Path | Used by |
|-----------|------|---------|
| `app-kanban-column-header` | `shared/components/kanban-column-header/` | kanban board |
| `app-entity-activity-section` | `shared/components/entity-activity-section/` | job detail panel |
| `app-status-timeline` | `shared/components/status-timeline/` | job detail panel |
| `app-barcode-info` | `shared/components/barcode-info/` | job detail panel |
| TimerHubService | `shared/services/timer-hub.service.ts` | time-tracking |
| KioskSessionService | `shared/services/kiosk-session.service.ts` | shop-floor display |
| ClockEventTypeService | `shared/services/clock-event-type.service.ts` | shop-floor clock |
| ScannerService | `shared/services/scanner.service.ts` | shop-floor, quality |
| ScanActionService | `shared/services/scan-action.service.ts` | shop-floor scan |
| WebHidRfidService | `shared/services/web-hid-rfid.service.ts` | shop-floor clock |
| BoardHubService | `shared/services/board-hub.service.ts` | kanban |
| `app-barcode-scan-input` | `shared/components/barcode-scan-input/` | shop-floor clock, inventory-scan |

---

## Reconciliation Checklist

### Routes
- [x] `/kanban`
- [x] `/backlog`
- [x] `/planning`
- [x] `/scheduling/:tab` (gantt · dispatch · work-centers · shifts · runs)
- [x] `/display/shop-floor` (main display)
- [x] `/display/shop-floor/clock`
- [x] `/display/shop-floor/scan`
- [x] `/display/shop-floor/scan-log`
- [x] `/time-tracking`
- [x] `/oee`
- [x] `/quality/:tab` (inspections · lots · spc-charts · spc-data · spc-ooc · ncrs · capas · ecos · gages)
- [x] `/mrp/:tab` (dashboard · planned-orders · exceptions · runs · master-schedule · forecasts)
- [x] `/assets`
- [x] `/maintenance/predictions`

### Live sweep states (ticked = observed live by ui-scout)
- [ ] Kanban: empty board (no jobs), populated board, job card interactions
- [ ] Kanban: JobDetailPanel — all tabs (Details / Cost / Operation Time)
- [ ] Kanban: JobDialog create, JobDialog edit
- [ ] Kanban: CoverPhotoUploadDialog, DisposeJobDialog
- [ ] Backlog: empty state, populated table, card-grid view
- [ ] Planning: CAP-PLAN-MRP disabled state (expected in this env); cycle dialog
- [ ] Scheduling: gantt / dispatch / work-centers / shifts / runs tabs
- [ ] Shop-floor: kiosk setup, clock kiosk, scan kiosk, scan-log
- [ ] Shop-floor: all scan flow components (job/move/receive/return/ship/count/inspect/issue)
- [ ] Time-tracking: empty, populated, add-entry dialog, timer running
- [ ] OEE: empty vs populated; work-center card click → trend/losses charts
- [ ] Quality: inspections / lots / spc-charts / spc-data / spc-ooc / ncrs / capas / ecos / gages tabs
- [ ] MRP: all 6 tabs; each dialog
- [ ] Assets: list, create-dialog, detail-panel, detail-dialog
- [ ] Maintenance: predictions page; resolve-prediction dialog

---

## Component Inventory

Schema: component · type · route · file `path:line` · renders-for · states · purpose

---

### Area 1 — Kanban (`/kanban`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| K-01 | `app-kanban` / KanbanComponent | page | `/kanban` | `features/kanban/kanban.component.ts:42` | all authenticated | TODO:live | Job board — board/team view toggle, drag-drop columns, job list |
| K-02 | `app-board-column` / BoardColumnComponent | cluster | `/kanban` | `features/kanban/components/board-column.component.ts:9` | all authenticated | TODO:live | Single stage column; renders job cards; WIP-limit indicator |
| K-03 | `app-job-card` / JobCardComponent | cluster | `/kanban` | `features/kanban/components/job-card.component.ts:12` | all authenticated | TODO:live | Compact job card with priority dot, avatar, hold badge |
| K-04 | `app-job-detail-panel` / JobDetailPanelComponent | panel | `/kanban` (slide-out) | `features/kanban/components/job-detail-panel.component.ts:43` | all authenticated | TODO:live | Full job detail: fields, subtasks, links, BOM, files, activity; hosts Cost + OpTime tabs |
| K-05 | `app-job-detail-dialog` / JobDetailDialogComponent | dialog | `/kanban` | `features/kanban/components/job-detail-dialog.component.ts:20` | all authenticated | TODO:live | Dialog wrapper around JobDetailPanelComponent (same content, modal variant) |
| K-06 | `app-job-dialog` / JobDialogComponent (create) | form | `/kanban` | `features/kanban/components/job-dialog.component.ts:27` | all authenticated | TODO:live | Create new job: title, customer, track-type, priority, assignees, due-date |
| K-07 | `app-job-dialog` / JobDialogComponent (edit) | form | `/kanban` | `features/kanban/components/job-dialog.component.ts:27` | all authenticated | TODO:live | Edit existing job metadata |
| K-08 | `app-job-cost-tab` / JobCostTabComponent | tab | `/kanban` (inside K-04) | `features/kanban/components/job-cost-tab.component.ts:15` | all authenticated | TODO:live | Job cost summary + material-issues table within detail panel |
| K-09 | `app-operation-time-tab` / OperationTimeTabComponent | tab | `/kanban` (inside K-04) | `features/kanban/components/operation-time-tab.component.ts:14` | all authenticated | TODO:live | Est vs actual setup/run minutes per operation sequence |
| K-10 | `app-cover-photo-upload-dialog` / CoverPhotoUploadDialogComponent | dialog | `/kanban` (from K-04) | `features/kanban/components/cover-photo-upload-dialog.component.ts:18` | all authenticated | TODO:live | Upload/view cover photo for a job |
| K-11 | `app-dispose-job-dialog` / DisposeJobDialogComponent | dialog | `/kanban` (from K-04) | `features/kanban/components/dispose-job-dialog.component.ts:24` | all authenticated | TODO:live | Mark job as disposed (scrapped / cancelled / other) with reason |
| K-12 | KanbanService | service | `/kanban` | `features/kanban/services/kanban.service.ts:1` | n/a | n/a | Primary kanban data service (board, jobs, CRUD, BOM, files, parts) |
| K-13 | JobCostService | service | `/kanban` | `features/kanban/services/job-cost.service.ts:1` | n/a | n/a | Job cost summary + operation-time data |

---

### Area 2 — Backlog (`/backlog`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| B-01 | `app-backlog` / BacklogComponent | page | `/backlog` | `features/backlog/backlog.component.ts:1` | all authenticated | TODO:live | Unscheduled job queue — table + card-grid view modes, search/filter, open job detail |
| B-02 | `app-backlog-card-grid` / BacklogCardGridComponent | cluster | `/backlog` | `features/backlog/components/backlog-card-grid/backlog-card-grid.component.ts:7` | all authenticated | TODO:live | Card-grid layout for backlog jobs (alternative to table view) |
| B-03 | BacklogService | service | `/backlog` | `features/backlog/services/backlog.service.ts:1` | n/a | n/a | Backlog job list data |

> BacklogComponent re-uses `JobDetailDialogComponent` (K-05) and `JobDialogComponent` (K-06/07) from kanban.

---

### Area 3 — Planning (`/planning`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| P-01 | `app-planning` / PlanningComponent | page | `/planning` | `features/planning/planning.component.ts:32` | Admin · Manager · PM | TODO:live | Planning-cycle management: cycle selector, backlog drag-onto-cycle board |
| P-02 | `app-cycle-board` / CycleBoardComponent | panel | `/planning` (embedded) | `features/planning/components/cycle-board/cycle-board.component.ts:12` | Admin · Manager · PM | TODO:live | Cycle entry board: progress bar, days-remaining, drag-to-reorder entries |
| P-03 | `app-cycle-dialog` / CycleDialogComponent | form | `/planning` | `features/planning/components/cycle-dialog/cycle-dialog.component.ts:16` | Admin · Manager · PM | TODO:live | Create / edit planning cycle (name, start, end, notes) |
| P-04 | CAP-PLAN-MRP disabled state | state | `/planning` | `features/planning/planning.component.ts:62` + `planning.service.ts:11` | Admin · Manager · PM | DN-8: capability gate | Board renders empty with capability-disabled banner when CAP-PLAN-MRP is off |
| P-05 | PlanningService | service | `/planning` | `features/planning/services/planning.service.ts:13` | n/a | n/a | Cycle CRUD + entry management; pre-checks CAP-PLAN-MRP (`planning.service.ts:56`) |

> **CAP-PLAN-MRP**: Defined as `PLANNING_CAPABILITY = 'CAP-PLAN-MRP'` at `planning.service.ts:11`. `isDisabled()` check at `planning.service.ts:56`. Capability-disabled banner on `planning.component.ts:62`. Status in this env: **TODO:confirm live** (likely disabled — no seed cycles).

---

### Area 4 — Scheduling (`/scheduling/:tab`)

Tabs (from `scheduling.component.ts:29`): `gantt` · `dispatch` · `work-centers` · `shifts` · `runs`

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| S-01 | `app-scheduling` / SchedulingComponent | page | `/scheduling/:tab` | `features/scheduling/scheduling.component.ts:32` | Admin · Manager | TODO:live | Tab host for all scheduling views |
| S-02 | Gantt tab | tab | `/scheduling/gantt` | `features/scheduling/scheduling.component.ts:29` | Admin · Manager | TODO:live | Gantt chart of scheduled operations |
| S-03 | Dispatch tab | tab | `/scheduling/dispatch` | `features/scheduling/scheduling.component.ts:29` | Admin · Manager | TODO:live | Dispatch list — work released to floor |
| S-04 | Work-centers tab | tab | `/scheduling/work-centers` | `features/scheduling/scheduling.component.ts:29` | Admin · Manager | TODO:live | Work-center load view |
| S-05 | Shifts tab | tab | `/scheduling/shifts` | `features/scheduling/scheduling.component.ts:29` | Admin · Manager | TODO:live | Shift definitions |
| S-06 | Runs tab | tab | `/scheduling/runs` | `features/scheduling/scheduling.component.ts:29` | Admin · Manager | TODO:live | Schedule run history |
| S-07 | SchedulingService | service | `/scheduling` | `features/scheduling/services/scheduling.service.ts:1` | n/a | n/a | Schedule data (gantt, dispatch, work-centers, shifts, runs) |

> All tabs are rendered within the single SchedulingComponent; tab model types at `scheduling.model.ts` include: `ScheduleRun`, `ScheduledOperation`, `WorkCenter`, `DispatchListItem`, `WorkCenterLoad`, `Shift`.

---

### Area 5 — Shop-Floor / Kiosk (`/display/shop-floor`)

Route is under `/display/` path with **no auth guard** — public kiosk terminal.

#### 5A — Main Display (`/display/shop-floor`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| SF-01 | `app-shop-floor-display` / ShopFloorDisplayComponent | page | `/display/shop-floor` | `features/shop-floor/shop-floor-display.component.ts:52` | all (public) | TODO:live | Main kiosk display: phases = main/pin/actions/job-select/receiving/shipping |
| SF-02 | `app-kiosk-setup` / KioskSetupComponent | panel | `/display/shop-floor` (phase=setup) | `features/shop-floor/components/kiosk-setup/kiosk-setup.component.ts:16` | all (public) | TODO:live | Admin-login + team/terminal config before kiosk goes live |
| SF-03 | `app-kiosk-search-bar` / KioskSearchBarComponent | cluster | `/display/shop-floor` | `features/shop-floor/components/kiosk-search-bar/kiosk-search-bar.component.ts:12` | all (public) | TODO:live | Worker search/lookup bar on kiosk main screen |
| SF-04 | `app-kiosk-session-bar` / KioskSessionBarComponent | cluster | `/display/shop-floor` | `features/shop-floor/components/kiosk-session-bar/kiosk-session-bar.component.ts:9` | all (public) | TODO:live | Logged-in worker session info bar |
| SF-05 | `app-numeric-keypad` / NumericKeypadComponent | cluster | `/display/shop-floor` | `features/shop-floor/components/numeric-keypad/numeric-keypad.component.ts:20` | all (public) | TODO:live | Touch-friendly numeric entry (PIN, quantities) |
| SF-06 | `app-pin-prompt-dialog` / PinPromptDialogComponent | dialog | `/display/shop-floor` (phase=pin) | `features/shop-floor/components/pin-prompt-dialog/pin-prompt-dialog.component.ts:9` | all (public) | TODO:live | PIN entry dialog for worker auth on kiosk |
| SF-07 | `app-scan-action-overlay` / ScanActionOverlayComponent | panel | `/display/shop-floor` + `/display/shop-floor/scan` | `features/shop-floor/components/scan-action-overlay/scan-action-overlay.component.ts:52` | all (public) | TODO:live | Action selection overlay after barcode scan; hosts all 8 scan-flow sub-components |
| SF-08 | `app-scan-undo-list` / ScanUndoListComponent | panel | `/display/shop-floor` | `features/shop-floor/components/scan-undo-list/scan-undo-list.component.ts:12` | all (public) | TODO:live | Recent scan history with undo capability |
| SF-09 | `app-scan-devices-panel` / ScanDevicesPanelComponent | panel | `/display/shop-floor` | `features/shop-floor/components/scan-devices-panel/scan-devices-panel.component.ts:13` | all (public) | TODO:live | Connected scan device management panel |
| SF-10 | `app-scan-location-view` / ScanLocationViewComponent | panel | `/display/shop-floor` | `features/shop-floor/components/scan-location-view/scan-location-view.component.ts:7` | all (public) | TODO:live | Current inventory location view on kiosk |
| SF-11 | `app-training-mode-banner` / TrainingModeBannerComponent | state | `/display/shop-floor` | `features/shop-floor/components/training-mode-banner/training-mode-banner.component.ts:4` | all (public) | TODO:live | Banner shown when kiosk is in training mode |

#### 5B — Scan Flows (rendered within SF-01 or SF-07)

| # | component | type | file | purpose |
|---|-----------|------|------|---------|
| SF-12 | `app-scan-job-flow` / ScanJobFlowComponent | panel | `features/shop-floor/components/scan-job-flow/scan-job-flow.component.ts:14` | Report time/progress on a job |
| SF-13 | `app-scan-move-flow` / ScanMoveFlowComponent | panel | `features/shop-floor/components/scan-move-flow/scan-move-flow.component.ts:16` | Move inventory to a different location |
| SF-14 | `app-scan-receive-flow` / ScanReceiveFlowComponent | panel | `features/shop-floor/components/scan-receive-flow/scan-receive-flow.component.ts:16` | Receive PO items (cross-ref: Q2C PO-receiving) |
| SF-15 | `app-scan-return-flow` / ScanReturnFlowComponent | panel | `features/shop-floor/components/scan-return-flow/scan-return-flow.component.ts:26` | Return material to stock |
| SF-16 | `app-scan-ship-flow` / ScanShipFlowComponent | panel | `features/shop-floor/components/scan-ship-flow/scan-ship-flow.component.ts:19` | Ship outbound order items |
| SF-17 | `app-scan-count-flow` / ScanCountFlowComponent | panel | `features/shop-floor/components/scan-count-flow/scan-count-flow.component.ts:13` | Physical inventory count |
| SF-18 | `app-scan-inspect-flow` / ScanInspectFlowComponent | panel | `features/shop-floor/components/scan-inspect-flow/scan-inspect-flow.component.ts:12` | QC inspection on kiosk |
| SF-19 | `app-scan-issue-flow` / ScanIssueFlowComponent | panel | `features/shop-floor/components/scan-issue-flow/scan-issue-flow.component.ts:13` | Issue material to a job |

> All scan-flow components render for `all (public)` — they are inside the no-auth kiosk route. States: TODO:live-sweep with ProductionWorker (worker@, ForgeRun!2026).

#### 5C — Sub-routes

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| SF-20 | `app-shop-floor-clock` / ShopFloorClockComponent | page | `/display/shop-floor/clock` | `features/shop-floor/clock/shop-floor-clock.component.ts:29` | all (public) | TODO:live | Dedicated clock-in/out kiosk; phases: setup/dashboard/identifying/pin/job-scanned/manual-login/clock |
| SF-21 | `app-inventory-scan` / InventoryScanComponent | page | `/display/shop-floor/scan` | `features/shop-floor/scan/inventory-scan.component.ts:12` | all (public) | TODO:live | Standalone barcode-scan terminal for inventory transactions |
| SF-22 | `app-scan-daily-log` / ScanDailyLogComponent | page | `/display/shop-floor/scan-log` (also embedded in SF-01) | `features/shop-floor/components/scan-daily-log/scan-daily-log.component.ts:27` | all (public) | TODO:live | Daily scan activity log — shown inline on main display and at /scan-log route |

#### 5D — Services

| component | file | purpose |
|-----------|------|---------|
| ShopFloorService | `features/shop-floor/services/shop-floor.service.ts:1` | Worker lookup, terminal config, job/floor data |
| ScanDeviceService | `features/shop-floor/services/scan-device.service.ts:1` | Barcode/RFID device management |
| ScanValidationService | `features/shop-floor/services/scan-validation.service.ts:1` | Validate scan inputs before action |

---

### Area 6 — Time-Tracking (`/time-tracking`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| TT-01 | `app-time-tracking` / TimeTrackingComponent | page | `/time-tracking` | `features/time-tracking/time-tracking.component.ts:27` | all authenticated | TODO:live | Time entry list, add/edit/correct entries, clock-in/out, active-timer display |
| TT-02 | Add/Edit Time Entry dialog | form | `/time-tracking` (inline DialogComponent) | `features/time-tracking/time-tracking.component.ts:27` | all authenticated | TODO:live | Inline dialog: date, job, operation, duration, notes |
| TT-03 | TimeTrackingService | service | `/time-tracking` | `features/time-tracking/services/time-tracking.service.ts:1` | n/a | n/a | Time entries, clock events, timer control, pay periods |
| TT-04 | TimerHubService (shared) | service | shared | `shared/services/timer-hub.service.ts:1` | n/a | n/a | SignalR hub for real-time timer events (used by TT + job detail panel) |

---

### Area 7 — OEE (`/oee`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| OE-01 | `app-oee` / OeeComponent | page | `/oee` | `features/oee/oee.component.ts:25` | Admin · Manager | TODO:live | OEE dashboard: work-center card grid, date-range filter, trend + losses charts |
| OE-02 | `app-oee-work-center-card` / OeeWorkCenterCardComponent | cluster | `/oee` | `features/oee/components/oee-work-center-card/oee-work-center-card.component.ts:7` | Admin · Manager | TODO:live | Per-work-center OEE gauge card; click selects for detail charts |
| OE-03 | `app-oee-trend-chart` / OeeTrendChartComponent | cluster | `/oee` (detail panel) | `features/oee/components/oee-trend-chart/oee-trend-chart.component.ts:8` | Admin · Manager | TODO:live | Line chart: OEE + availability + performance + quality over time |
| OE-04 | `app-six-big-losses-chart` / SixBigLossesChartComponent | cluster | `/oee` (detail panel) | `features/oee/components/six-big-losses-chart/six-big-losses-chart.component.ts:9` | Admin · Manager | TODO:live | Bar chart: Six Big Losses (equipment failure, setup, idling, speed, defects, yield) |
| OE-05 | OeeService | service | `/oee` | `features/oee/services/oee.service.ts:1` | n/a | n/a | OEE calculations, trend data, six-big-losses by work-center |

---

### Area 8 — Quality (`/quality/:tab`)

Tabs (from `quality.component.ts:38`): `inspections` · `lots` · `spc-charts` · `spc-data` · `spc-ooc` · `ncrs` · `capas` · `ecos` · `gages`

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| Q-01 | `app-quality` / QualityComponent | page | `/quality/:tab` | `features/quality/quality.component.ts:42` | Admin · Manager · Engineer | TODO:live | Tab host for all quality views; inspections and lots rendered inline |
| Q-02 | Inspections tab (inline in Q-01) | tab | `/quality/inspections` | `features/quality/quality.component.ts:42` | Admin · Manager · Engineer | TODO:live | QC inspection list: create/edit inspections against QC templates |
| Q-03 | Lots tab (inline in Q-01) | tab | `/quality/lots` | `features/quality/quality.component.ts:42` | Admin · Manager · Engineer | TODO:live | Lot records table with traceability lookups |
| Q-04 | `app-spc-characteristics` / SpcCharacteristicsComponent | tab | `/quality/spc-charts` | `features/quality/components/spc-characteristics.component.ts:20` | Admin · Manager · Engineer | TODO:live | SPC characteristics list; select characteristic to view chart |
| Q-05 | `app-spc-chart` / SpcChartComponent | tab | `/quality/spc-charts` (detail) | `features/quality/components/spc-chart.component.ts:12` | Admin · Manager · Engineer | TODO:live | Control chart for selected SPC characteristic |
| Q-06 | `app-spc-data-entry` / SpcDataEntryComponent | tab | `/quality/spc-data` | `features/quality/components/spc-data-entry.component.ts:10` | Admin · Manager · Engineer | TODO:live | Enter new SPC measurement data points |
| Q-07 | `app-spc-ooc-list` / SpcOocListComponent | tab | `/quality/spc-ooc` | `features/quality/components/spc-ooc-list.component.ts:16` | Admin · Manager · Engineer | TODO:live | Out-of-control alerts list |
| Q-08 | `app-ncr-list` / NcrListComponent | tab | `/quality/ncrs` | `features/quality/components/ncr-list.component.ts:22` | Admin · Manager · Engineer | TODO:live | Non-conformance records list + inline create/edit dialog |
| Q-09 | `app-capa-list` / CapaListComponent | tab | `/quality/capas` | `features/quality/components/capa-list.component.ts:22` | Admin · Manager · Engineer | TODO:live | Corrective and preventive actions list + inline create/edit dialog |
| Q-10 | `app-eco-list` / EcoListComponent | tab | `/quality/ecos` | `features/quality/components/eco-list.component.ts:24` | Admin · Manager · Engineer | TODO:live | Engineering change orders list + inline create/edit dialog + affected-items |
| Q-11 | `app-gage-list` / GageListComponent | tab | `/quality/gages` | `features/quality/components/gage-list.component.ts:23` | Admin · Manager · Engineer | TODO:live | Gage R&R list + calibration records; inline create/edit |
| Q-12 | QualityService | service | `/quality` | `features/quality/services/quality.service.ts:1` | n/a | n/a | Inspections, QC templates, lot records, lot traceability, gages, calibration |
| Q-13 | NcrCapaService | service | `/quality` | `features/quality/services/ncr-capa.service.ts:1` | n/a | n/a | NCR and CAPA CRUD |
| Q-14 | EcoService | service | `/quality` | `features/quality/services/eco.service.ts:1` | n/a | n/a | ECO CRUD + affected-items |
| Q-15 | SpcService | service | `/quality` | `features/quality/services/spc.service.ts:1` | n/a | n/a | SPC characteristics, measurements, OOC events |

---

### Area 9 — MRP (`/mrp/:tab`)

Tabs (from `mrp.component.ts:55`): `dashboard` · `planned-orders` · `exceptions` · `runs` · `master-schedule` · `forecasts`

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| M-01 | `app-mrp` / MrpComponent | page | `/mrp/:tab` | `features/mrp/mrp.component.ts:59` | Admin · Manager | TODO:live | Tab host for all MRP views |
| M-02 | Dashboard tab (inline in M-01) | tab | `/mrp/dashboard` | `features/mrp/mrp.component.ts:59` | Admin · Manager | TODO:live | MRP summary KPIs |
| M-03 | Planned-orders tab (inline in M-01) | tab | `/mrp/planned-orders` | `features/mrp/mrp.component.ts:59` | Admin · Manager | TODO:live | MRP-generated planned purchase/work orders |
| M-04 | Exceptions tab (inline in M-01) | tab | `/mrp/exceptions` | `features/mrp/mrp.component.ts:59` | Admin · Manager | TODO:live | MRP exceptions / alerts |
| M-05 | Runs tab (inline in M-01) | tab | `/mrp/runs` | `features/mrp/mrp.component.ts:59` | Admin · Manager | TODO:live | MRP run history |
| M-06 | Master-schedule tab (inline in M-01) | tab | `/mrp/master-schedule` | `features/mrp/mrp.component.ts:59` | Admin · Manager | TODO:live | Master production schedule |
| M-07 | Forecasts tab (inline in M-01) | tab | `/mrp/forecasts` | `features/mrp/mrp.component.ts:59` | Admin · Manager | TODO:live | Demand forecasts |
| M-08 | `ExecuteMrpRunDialogComponent` | dialog | `/mrp` | `features/mrp/components/execute-mrp-run-dialog.component.ts:1` | Admin · Manager | TODO:live | Trigger a new MRP run |
| M-09 | `MasterScheduleDialogComponent` | dialog | `/mrp` | `features/mrp/components/master-schedule-dialog.component.ts:1` | Admin · Manager | TODO:live | Create/edit master schedule entry |
| M-10 | `GenerateForecastDialogComponent` | dialog | `/mrp` | `features/mrp/components/generate-forecast-dialog.component.ts:1` | Admin · Manager | TODO:live | Generate demand forecast |
| M-11 | `MrpRunDetailDialogComponent` | dialog | `/mrp` | `features/mrp/components/mrp-run-detail-dialog.component.ts:1` | Admin · Manager | TODO:live | View MRP run detail + planned orders |
| M-12 | `MpsVsActualDialogComponent` | dialog | `/mrp` | `features/mrp/components/mps-vs-actual-dialog.component.ts:1` | Admin · Manager | TODO:live | MPS vs actual comparison chart |
| M-13 | MrpService | service | `/mrp` | `features/mrp/services/mrp.service.ts:1` | n/a | n/a | MRP run execution, planned orders, exceptions, forecasts, master schedule |

---

### Area 10 — Assets (`/assets`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| A-01 | `app-assets` / AssetsComponent | page | `/assets` | `features/assets/assets.component.ts:27` | Admin · Manager | TODO:live | Asset list with search/type/status filters; create-asset dialog inline |
| A-02 | `app-asset-detail-panel` / AssetDetailPanelComponent | panel | `/assets` (slide-out) | `features/assets/components/asset-detail-panel/asset-detail-panel.component.ts:17` | Admin · Manager | TODO:live | Asset detail: fields, downtime log, maintenance log, subcontract orders |
| A-03 | `app-asset-detail-dialog` / AssetDetailDialogComponent | dialog | `/assets` | `features/assets/components/asset-detail-dialog/asset-detail-dialog.component.ts:1` | Admin · Manager | TODO:live | Dialog wrapper around AssetDetailPanelComponent |
| A-04 | Create/Edit Asset form (inline in A-01) | form | `/assets` | `features/assets/assets.component.ts:27` | Admin · Manager | TODO:live | Asset fields: name, type, status, location, description; draft-aware |
| A-05 | AssetsService | service | `/assets` | `features/assets/services/assets.service.ts:1` | n/a | n/a | Asset CRUD, downtime log, maintenance log, subcontract orders |

---

### Area 11 — Maintenance (`/maintenance/predictions`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| MN-01 | `app-predictions` / PredictionsComponent | page | `/maintenance/predictions` | `features/maintenance/pages/predictions/predictions.component.ts:42` | Admin · Manager | TODO:live | Predictive maintenance dashboard: KPI strip (active/critical/accuracy) + predictions table |
| MN-02 | `app-resolve-prediction-dialog` / ResolvePredictionDialogComponent | dialog | `/maintenance/predictions` | `features/maintenance/components/resolve-prediction-dialog/resolve-prediction-dialog.component.ts:16` | Admin · Manager | TODO:live | Resolve / acknowledge / schedule-PM / mark-false-positive on a prediction |
| MN-03 | PredictiveMaintenanceService | service | `/maintenance` | `features/maintenance/services/predictive-maintenance.service.ts:1` | n/a | n/a | Predictive maintenance data + resolve actions |

---

### Customer Returns (cross-link)

> **NOT catalogued here.** Fully inventoried in `quote-to-cash.md §Segment 8`. CAP-O2C-RMA is DISABLED in this env (DN-8 terminal closure confirmed at `po-dialog.component.ts:309-317` pattern). No operations-side RMA screen is reachable.

---

## Open Items / Queue Summary

_This section tracks entries that need live-sweep confirmation. All TODO:live states are queued for ui-scout._

### Priority live-sweep targets

1. **Shop-floor kiosk (SF-01–SF-22)** — entire area unswept; requires no-auth browse + ProductionWorker (worker@, ForgeRun!2026) for role-specific flows. Highest priority gap.
2. **Scheduling tabs (S-02–S-06)** — Admin/Manager only; gantt in particular may have sub-components not visible from source.
3. **Quality tabs (Q-02–Q-11)** — 9 tabs; inline dialogs within each list component need live trigger.
4. **MRP dialogs (M-08–M-12)** — 5 dialogs; need live trigger conditions.
5. **Planning CAP-PLAN-MRP state** — confirm whether capability is enabled or disabled in this env.

### Known incomplete (awaiting source read)
- ~~Scan-flow components SF-12–SF-19: exact `path:line` selector declarations not yet confirmed.~~ **CLOSED** — all 8 selectors confirmed.
- ~~SPC components Q-04–Q-07: exact `path:line` selectors pending read.~~ **CLOSED** — all 4 confirmed.
- ~~Asset detail panel A-02: exact `path:line` pending read.~~ **CLOSED** — `:17` confirmed.
- ~~MN-02: exact `path:line` pending read.~~ **CLOSED** — `:16` confirmed.
- ~~Kiosk sub-components SF-03–SF-11, SF-22: `path:line` stubs at `:1`.~~ **CLOSED** — all 10 confirmed.
- Quality inline inspection/lot panel dialogs: may have additional dialog components inside QualityComponent not surfaced by source scan. **Pending live sweep.**

**Source side carries zero `:1` placeholders as of this commit.**

---

_Commit: all source stubs closed — zero `:1` placeholders remain; 57-item live queue open_
_Next: dequeue ui-scout live results (states + dialog triggers) as they land_
