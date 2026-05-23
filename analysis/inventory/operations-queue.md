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
| Q-SF-01 | shop-floor | Main display `/display/shop-floor` — all phases: main, pin, actions, job-select, receiving, shipping | Navigate unauthenticated; `DisplayPhase` union source-confirmed at `shop-floor-display.component.ts:50` | DONE — ENV-BLOCK: all phases source-confirmed; terminal pairing not feasible in env; documented in operations.md SF-01 |
| Q-SF-02 | shop-floor | KioskSetup flow (admin-login → configure) | **Trigger confirmed from source**: `isUnpaired = signal(!localStorage.getItem('forge-kiosk-device-token'))` at `:107` | DONE |
| Q-SF-03 | shop-floor | Clock kiosk `/display/shop-floor/clock` — all 7 phases | `KioskPhase` union source-confirmed at `shop-floor-clock.component.ts:26` | DONE — ENV-BLOCK: all 7 KioskPhase states source-confirmed; documented in operations.md SF-20 |
| Q-SF-04 | shop-floor | Inventory scan `/display/shop-floor/scan` | Navigate to sub-route | DONE |
| Q-SF-05 | shop-floor | Scan log `/display/shop-floor/scan-log` | Navigate to sub-route | DONE |
| Q-SF-06 | shop-floor | ScanJobFlow (SF-12) | Trigger: action-overlay phase `'job'` after job barcode scan | DONE — ENV-BLOCK: JobStep union source-confirmed; documented in operations.md SF-12 |
| Q-SF-07 | shop-floor | ScanMoveFlow (SF-13) | Trigger: action-overlay phase `'move'` | DONE — ENV-BLOCK: MoveStep union source-confirmed; documented in operations.md SF-13 |
| Q-SF-08 | shop-floor | ScanReceiveFlow (SF-14) | Trigger: action-overlay phase `'receive'` | DONE — ENV-BLOCK: ReceiveStep union source-confirmed; documented in operations.md SF-14 |
| Q-SF-09 | shop-floor | ScanReturnFlow (SF-15) | Trigger: action-overlay phase `'return'` | DONE — ENV-BLOCK: source-confirmed at `scan-return-flow.component.ts:26`; documented in operations.md SF-15 |
| Q-SF-10 | shop-floor | ScanShipFlow (SF-16) | Trigger: action-overlay phase `'ship'` | DONE — ENV-BLOCK: source-confirmed at `scan-ship-flow.component.ts:19`; documented in operations.md SF-16 |
| Q-SF-11 | shop-floor | ScanCountFlow (SF-17) | Trigger: action-overlay phase `'count'` | DONE — ENV-BLOCK: source-confirmed at `scan-count-flow.component.ts:13`; documented in operations.md SF-17 |
| Q-SF-12 | shop-floor | ScanInspectFlow (SF-18) | Trigger: action-overlay phase `'inspect'` | DONE — ENV-BLOCK: source-confirmed at `scan-inspect-flow.component.ts:12`; documented in operations.md SF-18 |
| Q-SF-13 | shop-floor | ScanIssueFlow (SF-19) | Trigger: action-overlay phase `'issue'` | DONE — ENV-BLOCK: source-confirmed at `scan-issue-flow.component.ts:13`; documented in operations.md SF-19 |
| Q-SF-14 | shop-floor | TrainingModeBanner (SF-11) visible state | `trainingMode = signal(false)` at `shop-floor-display.component.ts:95`; toggle button in paired state | DONE — ENV-BLOCK: banner renders when trainingMode=true; documented in operations.md SF-11 |

## Priority 2 — Scheduling (Admin/Manager)

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-SC-01 | scheduling | `/scheduling/gantt` — empty + populated; KPI chips | Login admin@ | DONE |
| Q-SC-02 | scheduling | `/scheduling/dispatch` — work-center select + dispatch table | Switch tab | DONE |
| Q-SC-03 | scheduling | `/scheduling/work-centers` — work-center table | Switch tab | DONE |
| Q-SC-04 | scheduling | `/scheduling/shifts` — shift table | Switch tab | DONE |
| Q-SC-05 | scheduling | `/scheduling/runs` — run history table | Switch tab | DONE |

## Priority 3 — Quality (Admin/Manager/Engineer)

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-QL-01 | quality | `/quality/inspections` — empty + populated; create-inspection inline dialog (Q-02a) | Login admin@; status filter (InProgress/Passed/Failed) | DONE — ENV-DATA + source-confirmed: dialog trigger confirmed live (CDK overlay — sweep H); fields (templateId/jobId/lotNumber/notes) source-confirmed from `quality.component.ts:92`; documented operations.md Q-02/Q-02a |
| Q-QL-02 | quality | `/quality/lots` — empty + populated; create-lot (Q-03a) + traceability (Q-03b) | Switch tab | DONE — source-confirmed: lot dialog trigger confirmed live (CDK overlay — sweep H); all fields + traceability dialog (`showTraceDialog` signal) source-confirmed; ENV-DATA; documented operations.md Q-03/Q-03a/Q-03b |
| Q-QL-03 | quality | `/quality/spc-charts` — characteristics list + chart | Switch tab; click a characteristic | DONE — ENV-DATA: tab confirmed live (empty, NEW CHARACTERISTIC button); chart source-confirmed from `spc-chart.component.ts`; documented operations.md Q-04/Q-05 |
| Q-QL-04 | quality | `/quality/spc-data` — data entry form | Switch tab | DONE — ENV-DATA: SPC-data tab confirmed live; documented operations.md Q-06 |
| Q-QL-05 | quality | `/quality/spc-ooc` — OOC list | Switch tab | DONE — ENV-DATA: tab confirmed live (empty, no create button); documented operations.md Q-07 |
| Q-QL-06 | quality | `/quality/ncrs` — list + create NCR + disposition dialog | Switch tab; create NCR | DONE — source-confirmed: button clicked, CDK overlay opened (sweep H); create dialog (type/partId/jobId/detectedAtStage/description/affectedQuantity/defectiveQuantity/containmentActions) + disposition dialog (code/notes/reworkInstructions) source-confirmed from `ncr-list.component.ts`; documented operations.md Q-08 |
| Q-QL-07 | quality | `/quality/capas` — list + create CAPA | Switch tab; create CAPA | DONE — source-confirmed: button clicked, CDK overlay opened (sweep H); create dialog (type/sourceType/title/problemDescription/impactDescription/ownerId/priority/dueDate) source-confirmed from `capa-list.component.ts`; documented operations.md Q-09 |
| Q-QL-08 | quality | `/quality/ecos` — list + create ECO + affected-items | Switch tab; create ECO | DONE — source-confirmed: button clicked, CDK overlay opened (sweep H); create + detail + add-affected-item (entityType/entityId/changeDescription/oldValue/newValue) dialogs source-confirmed from `eco-list.component.ts`; documented operations.md Q-10 |
| Q-QL-09 | quality | `/quality/gages` — list + create gage + calibration | Switch tab; create gage | DONE — source-confirmed: button clicked, CDK overlay opened (sweep H); create (11 fields) + detail + calibration record (calibratedAt/result/labName/standardsUsed/asFoundCondition/asLeftCondition/notes) dialogs source-confirmed from `gage-list.component.ts`; documented operations.md Q-11 |

## Priority 4 — MRP dialogs (Admin/Manager)

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-MR-01 | mrp | `/mrp/dashboard` — KPI chips | Login admin@ | DONE — source-confirmed: URL confirmed reached; Playwright blocked post-load (MRP component 3 simultaneous API calls in effect()); KPI chips + RUN MRP + SIMULATE buttons source-confirmed from `mrp.component.ts:59`; documented operations.md M-01/M-02 |
| Q-MR-02 | mrp | `/mrp/planned-orders` — table; firm + release row actions | Switch tab | DONE — source-confirmed; Playwright blocked; tab states + Status filter + firm/release actions source-confirmed; documented operations.md M-03 |
| Q-MR-03 | mrp | `/mrp/exceptions` — table; resolve row action | Switch tab | DONE — source-confirmed; Playwright blocked; unresolved-only filter + resolve action source-confirmed; documented operations.md M-04 |
| Q-MR-04 | mrp | `/mrp/runs` + ExecuteMrpRunDialog (M-08) | `executeRun()` / `executeRun(true)` — RUN MRP button | DONE — source-confirmed; Playwright blocked; ExecuteMrpRunDialog fields (run-type/planning-horizon/simulation hint) confirmed from `execute-mrp-run-dialog.component.ts:30`; documented operations.md M-05/M-08 |
| Q-MR-05 | mrp | `/mrp/master-schedule` + MasterScheduleDialog (M-09) | `openCreateSchedule()` / `openEditSchedule()` | DONE — source-confirmed; Playwright blocked; MasterScheduleDialog fields (name/description/period-start/period-end/schedule-lines) confirmed from `master-schedule-dialog.component.ts:43`; documented operations.md M-06/M-09 |
| Q-MR-06 | mrp | `/mrp/forecasts` + GenerateForecastDialog (M-10) | `openGenerateForecast()` | DONE — source-confirmed; Playwright blocked; GenerateForecastDialog fields (name/part/method/historical-periods/smoothing-factor conditional) confirmed from `generate-forecast-dialog.component.ts:20`; documented operations.md M-07/M-10 |
| Q-MR-07 | mrp | MrpRunDetailDialog (M-11) | `openRunDetail(run)` — row click | DONE — source-confirmed; Playwright blocked; MrpRunDetailDialog (run summary + parts-touched + pegging trail) confirmed from `mrp-run-detail-dialog.component.ts:31`; documented operations.md M-11 |
| Q-MR-08 | mrp | MpsVsActualDialog (M-12) | `openMpsVsActual(schedule)` — row action | DONE — source-confirmed; Playwright blocked; MpsVsActualDialog (per-part: planned/actual/variance/variance-pct) confirmed from `mps-vs-actual-dialog.component.ts:23`; documented operations.md M-12 |

## Priority 5 — Kanban / Backlog / Planning (all authenticated + Admin roles)

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-KB-01 | kanban | Empty board state | First load | DONE |
| Q-KB-02 | kanban | Populated board — drag-drop between columns | Seed from SO-00001 | DONE |
| Q-KB-03 | kanban | JobDetailPanel — Details tab (K-04) | Click job-number link | DONE — panel opens confirmed (CDK overlay — sweep G); Subtasks + Cost Analysis + cover/edit/dispose buttons visible; inner CDK bodyText not captured; K-08/K-09 tabs source-confirmed as separate files; documented operations.md K-04 |
| Q-KB-04 | kanban | JobDetailPanel — Cost tab (K-08) | Switch to Cost tab | DONE — source-confirmed: cost-summary (totalEstimated/totalActual/quotedPrice/variance) + material-issues table + RECALCULATE COSTS + return-material row action confirmed from `job-cost-tab.component.ts:14`; documented operations.md K-08 |
| Q-KB-05 | kanban | JobDetailPanel — Operation Time tab (K-09) | Switch to OpTime tab | DONE — source-confirmed: operations table (seq#/name/estSetup/actSetup/estRun/actRun/totalMin/eff%/progress-bar) + totals strip confirmed from `operation-time-tab.component.ts:12`; documented operations.md K-09 |
| Q-KB-06 | kanban | JobDialog create (K-06) | Click "New Job" | DONE |
| Q-KB-07 | kanban | JobDialog edit (K-07) | Open detail → click Edit | DONE — source-confirmed: edit mode same 7 fields as create pre-populated from `job` input; `mode='edit'`; confirmed from `job-dialog.component.ts:26`; documented operations.md K-07 |
| Q-KB-08 | kanban | CoverPhotoUploadDialog (K-10) | Action menu in job detail panel | DONE — trigger confirmed live (panel__cover-btn → CDK overlay — sweep G); fields (`app-file-upload-zone` + UPLOAD PHOTO) source-confirmed from `cover-photo-upload-dialog.component.ts:17`; documented operations.md K-10 |
| Q-KB-09 | kanban | DisposeJobDialog (K-11) | Action menu in job detail panel | DONE — trigger confirmed live (.action-btn "Dispose" → CDK overlay — sweep H); fields (disposition-type/reason/notes/CANCEL/DISPOSE) source-confirmed from `dispose-job-dialog.component.ts:23`; documented operations.md K-11 |
| Q-KB-10 | kanban | Team view mode (board vs team toggle) | `ViewMode` toggle confirmed | DONE |
| Q-BL-01 | backlog | Empty + populated; table vs card-grid view | Login any role | DONE — card-grid confirmed with J-1 (sweep H) |
| Q-PL-01 | planning | CAP-PLAN-MRP status in this env | Login admin@/pm@ | DONE |
| Q-PL-02 | planning | CycleDialog create + edit (P-03) | Click New Cycle | DONE |
| Q-PL-03 | planning | CycleBoard with entries (P-02) | Drag job onto cycle | DONE — ENV-DATA: no cycle entries in env; CycleBoardComponent source-confirmed: CDK drag-drop reorder; computed progressPercent/daysRemaining/isActive/sortedEntries; per-entry priority chip + complete + remove buttons; confirmed from `cycle-board.component.ts:12`; documented operations.md P-02 |

## Priority 6 — OEE / Assets / Maintenance / Time-Tracking

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-OE-01 | oee | `/oee` — empty vs populated; date-range filter | Login admin@ | DONE |
| Q-OE-02 | oee | Work-center card click → trend + losses charts | Click `OeeWorkCenterCardComponent` | DONE — ENV-DATA: no work centers in env; gauge card + `selected` output source-confirmed from `oee-work-center-card.component.ts:7`; documented operations.md OE-02 |
| Q-OE-03 | oee | Date-range filter effect on charts | Change date range picker value | DONE — ENV-DATA: OeeTrendChartComponent + SixBigLossesChartComponent source-confirmed; documented operations.md OE-03/OE-04 |
| Q-AS-01 | assets | `/assets` — list; empty + populated; type/status filters | Login admin@ | DONE — live confirmed: empty state, Search/Type/Status filters, ADD ASSET button (sweep MRP2); A-04 create form source-confirmed; documented operations.md A-01/A-04 |
| Q-AS-02 | assets | Create-asset inline dialog (A-04) | Click "New Asset" | DONE — source-confirmed: 15 fields (name/assetType/location/manufacturer/model/serialNumber/notes/isCustomerOwned/cavityCount/toolLifeExpectancy/acquisitionCost/depreciationMethod/workCenterId/glAccount) confirmed from `assets.component.ts:62`; documented operations.md A-04 |
| Q-AS-03 | assets | AssetDetailPanel (A-02) — all sub-sections | Click asset row | DONE — source-confirmed: (name/assetType/status/location/manufacturer/model/serialNumber/currentHours + status-change + maintenance-log + barcode + activity + entity-link; edit → `editRequested` output) confirmed from `asset-detail-panel.component.ts:26`; ENV-DATA; documented operations.md A-02 |
| Q-AS-04 | assets | AssetDetailDialog (A-03) wrapper | Open detail via dialog path | DONE — source-confirmed: MatDialog wrapper; afterClosed `{action:'edit', asset}` → opens A-04 edit form; ENV-DATA; confirmed from `asset-detail-dialog.component.ts:17`; documented operations.md A-03 |
| Q-MN-01 | maintenance | `/maintenance/predictions` — empty + populated; severity + status filters | Login admin@ | DONE — live confirmed: empty state, Severity + Status filters (sweep MRP2); KPI strip + row states + inline actions source-confirmed; ENV-DATA; documented operations.md MN-01 |
| Q-MN-02 | maintenance | ResolvePredictionDialog (MN-02) live states | Resolve or false-positive row action | DONE — source-confirmed: 2 modes (resolve/false-positive); both show `app-textarea` notes + CANCEL + confirm; confirmed from `resolve-prediction-dialog.component.ts:16`; ENV-DATA; documented operations.md MN-02 |
| Q-TT-01 | time-tracking | `/time-tracking` — empty + populated list; date-range filter | Login any authenticated role | DONE |
| Q-TT-02 | time-tracking | Add Time Entry inline dialog (TT-02) | `openManualEntry()` — `showDialog` signal at `time-tracking.component.ts:72` | DONE |
| Q-TT-03 | time-tracking | Active timer running state (TT-03) | `openStartTimer()` — `showTimerDialog` signal at `:87` | DONE — dialog confirmed live (sweep H): Category select (None/Production/Setup/Inspection/Maintenance/Training/Meeting/Admin/Cleanup/Other) + Notes + CANCEL + START; timer running state + stop-dialog source-confirmed from `time-tracking.component.ts:87`; documented operations.md TT-03/TT-04 |
| Q-TT-04 | time-tracking | Stop Timer inline dialog (TT-04) | `openStopTimer()` — `showStopDialog` signal at `:94` | DONE — source-confirmed: single `stopNotesControl` (notes only); triggered by `openStopTimer()` when `activeTimer` non-null; confirmed from `time-tracking.component.ts:94`; documented operations.md TT-04 |

---

## Historical sweep records — sweeps A/B/D/G/H/MRP2 — 2026-05-22

All items below were PARTIAL or needs-live at time of sweep and subsequently closed from source.

| Queue ID | sweep result | final closure |
|----------|-------------|---------------|
| Q-BL-01 | PARTIAL: table view + J-1 | DONE: card-grid view confirmed sweep H |
| Q-KB-03 | PARTIAL: panel opens, buttons visible | DONE: inner tabs source-confirmed as K-08/K-09 |
| Q-KB-04/05 | needs-live | DONE: source-confirmed from job-cost-tab + operation-time-tab component files |
| Q-KB-07 | needs-live | DONE: source-confirmed edit mode from job-dialog.component.ts |
| Q-KB-08/09 | PARTIAL: CDK overlay opened | DONE: fields source-confirmed |
| Q-QL-01..09 | PARTIAL: buttons clicked, CDK overlay opened | DONE: all dialog fields source-confirmed from component source reads |
| Q-MR-01..08 | PARTIAL: URL reached; Playwright blocked | DONE: all 6 tab states + 5 dialog fields source-confirmed |
| Q-TT-03/04 | PARTIAL: start-timer dialog live | DONE: timer running + stop-dialog source-confirmed |
| Q-OE-02/03 | needs-live | DONE: ENV-DATA source-confirmed (no work centers) |
| Q-AS-01 | PARTIAL: empty state + filters live | DONE: ADD ASSET form source-confirmed |
| Q-AS-02/03/04 | needs-live | DONE: source-confirmed from assets + asset-detail-panel + asset-detail-dialog component files |
| Q-MN-01 | PARTIAL: empty state + filters live | DONE: populated states + row actions source-confirmed |
| Q-MN-02 | needs-live | DONE: ENV-DATA source-confirmed (no predictions) |
| Q-PL-03 | needs-live | DONE: ENV-DATA source-confirmed (no cycle entries) |
| Q-SF-01..14 | PARTIAL/ENV-BLOCK | DONE: all kiosk phases source-confirmed |

---

**Queue fully drained 2026-05-22. Zero items remain OPEN, needs-live, or IN-PROGRESS.**
**All 90 operations-region items (64 feature + 26 shared) have source-confirmed or better status in operations.md.**

_Updated: 2026-05-22 · source-cataloger cycle 2 complete_

---

## Final sweep live confirmations — ui-scout 2026-05-22

Seeded: work-center CNC-01, team "Floor Team A", asset "CNC Mill #1" via API. These live confirmations upgraded source-confirmed items to catalogued:

| item | what was confirmed live |
|------|------------------------|
| SF-01 paired state | 0 WORKING/ON BREAK/UNASSIGNED/DONE TODAY, employee avatar grid (8 users), scan-badge footer, controls |
| SF-02 configure (team) | "Floor Team A (0 members)" in team select — team seeding confirmed |
| SF-03/SF-04/SF-11 | confirmed present in DOM on paired display |
| SF-20 clock paired | "FLOOR TEAM A" header, team-status/active-jobs sections, CLOCK IN MANUALLY footer |
| K-05 JobDetailDialog | CDK MatDialog wrapper confirmed (DetailDialogService → MatDialog.open → mat-dialog-container) |
| K-07 edit dialog | Title/Description/Customer/Assignee/Priority/Due Date + SAVE CHANGES — pre-populated from J-1 |
| Q-02a–Q-11 create dialogs | All 7 quality create dialogs confirmed live with full field lists from .cdk-overlay-container |
| A-01 table + live row | NAME/TYPE/LOCATION/MANUFACTURER/STATUS/HOURS columns, CNC Mill #1 ACTIVE row |
| A-02 detail panel | STATUS/HOURS/barcode AST-CNC Mill #1/SET STATUS menu/MAINTENANCE HISTORY/ACTIVITY tabs |
| A-03 dialog wrapper | components: app-asset-detail-dialog + app-asset-detail-panel + app-barcode-info + app-entity-activity-section |
| A-04 ADD ASSET dialog | Name/Type/Location/Manufacturer/Model/Serial/Notes + Acquisition&Depreciation collapsible |
| TT-03 running state | STOP TIMER (0M) button, RUNNING badge in table row |
| TT-04 stop dialog | static "Timer running for Xm", Notes textarea, STOP TIMER button |
| OE-02 work center card | CNC-01: 0.0% OEE, AVAILABILITY 100.0%, PERFORMANCE 0.0%, QUALITY 0.0%, 0/0/0 counts |
| OE-03 trend chart | in detail panel, Granularity select (Daily/Weekly/Monthly), OEE TREND empty state |
| OE-04 losses chart | in detail panel, "No losses recorded for this period" |
| app-barcode-info | barcode "AST-CNC Mill #1", COPY + PRINT + REGENERATE buttons |
| app-entity-activity-section | ALL/CONVERSATION/NOTES/HISTORY tabs, "No activity yet" empty state |

Scan flows SF-05–SF-19 remain source-confirmed closure (require barcode/RFID hardware). MRP M-01–M-12 remain source-confirmed closure (Playwright blocked). Q-03b/Q-05/P-02/MN-02 remain source-confirmed closure (no data / ENV-DATA).

_Updated: 2026-05-22 · ui-scout final sweep complete_
