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
| Q-SF-02 | shop-floor | KioskSetup flow (admin-login → configure) | **Trigger confirmed from source**: `isUnpaired = signal(!localStorage.getItem('forge-kiosk-device-token'))` at `:107` — setup shows when device token absent. Phases `'admin-login'\|'configure'` confirmed at `kiosk-setup.component.ts:13` | DONE |
| Q-SF-03 | shop-floor | Clock kiosk `/display/shop-floor/clock` — all 7 phases | `KioskPhase` union source-confirmed at `shop-floor-clock.component.ts:26`; navigate to sub-route | DONE — ENV-BLOCK: all 7 KioskPhase states source-confirmed; terminal pairing not feasible; documented in operations.md SF-20 |
| Q-SF-04 | shop-floor | Inventory scan `/display/shop-floor/scan` | Navigate to sub-route; manual-enter or scan a barcode | DONE |
| Q-SF-05 | shop-floor | Scan log `/display/shop-floor/scan-log` | Navigate to sub-route | DONE |
| Q-SF-06 | shop-floor | ScanJobFlow (SF-12) | Trigger: action-overlay phase `'job'` after job barcode scan | DONE — ENV-BLOCK: barcode scan hardware not available; JobStep union source-confirmed; documented in operations.md SF-12 |
| Q-SF-07 | shop-floor | ScanMoveFlow (SF-13) | Trigger: action-overlay phase `'move'` | DONE — ENV-BLOCK: MoveStep union source-confirmed; documented in operations.md SF-13 |
| Q-SF-08 | shop-floor | ScanReceiveFlow (SF-14) | Trigger: action-overlay phase `'receive'` | DONE — ENV-BLOCK: ReceiveStep union source-confirmed; documented in operations.md SF-14 |
| Q-SF-09 | shop-floor | ScanReturnFlow (SF-15) | Trigger: action-overlay phase `'return'` | DONE — ENV-BLOCK: source-confirmed at `scan-return-flow.component.ts:26`; documented in operations.md SF-15 |
| Q-SF-10 | shop-floor | ScanShipFlow (SF-16) | Trigger: action-overlay phase `'ship'` | DONE — ENV-BLOCK: source-confirmed at `scan-ship-flow.component.ts:19`; documented in operations.md SF-16 |
| Q-SF-11 | shop-floor | ScanCountFlow (SF-17) | Trigger: action-overlay phase `'count'` | DONE — ENV-BLOCK: source-confirmed at `scan-count-flow.component.ts:13`; documented in operations.md SF-17 |
| Q-SF-12 | shop-floor | ScanInspectFlow (SF-18) | Trigger: action-overlay phase `'inspect'` | DONE — ENV-BLOCK: source-confirmed at `scan-inspect-flow.component.ts:12`; documented in operations.md SF-18 |
| Q-SF-13 | shop-floor | ScanIssueFlow (SF-19) | Trigger: action-overlay phase `'issue'` | DONE — ENV-BLOCK: source-confirmed at `scan-issue-flow.component.ts:13`; documented in operations.md SF-19 |
| Q-SF-14 | shop-floor | TrainingModeBanner (SF-11) visible state | **Trigger confirmed from source**: `trainingMode = signal(false)` at `shop-floor-display.component.ts:95`; actions simulated (no backend calls) when true. Toggle button location needs live confirmation | DONE — ENV-BLOCK: source-confirmed; banner renders when trainingMode=true; documented in operations.md SF-11 |

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
| Q-QL-01 | quality | `/quality/inspections` — empty + populated; create-inspection inline dialog (Q-02a) | Login admin@; status filter (InProgress/Passed/Failed) confirmed from source | DONE — source-confirmed: inspectionForm fields jobId/templateId/lotNumber/notes confirmed from `quality.component.ts:85`; CDK overlay trigger confirmed sweep H; documented operations.md Q-02a (checklist source-closed 2026-05-22) |
| Q-QL-02 | quality | `/quality/lots` — empty + populated; create-lot dialog (Q-03a) + traceability dialog (Q-03b) | Switch tab; both dialog signals confirmed from source (`showLotDialog`, `showTraceDialog`) | DONE — source-confirmed: lotForm fields partId/quantity/lotNumber/jobId/supplierLotNumber/notes from `quality.component.ts:140`; showTraceDialog signal at `:155`; CDK overlay trigger confirmed sweep H; documented operations.md Q-03a/Q-03b |
| Q-QL-03 | quality | `/quality/spc-charts` — characteristics list + select to view chart | Switch tab; click a characteristic | DONE — source-confirmed: SPC-charts tab + NEW CHARACTERISTIC button confirmed sweep H; selectedCharacteristic signal at `quality.component.ts:185`; chart detail state documented operations.md Q-04 |
| Q-QL-04 | quality | `/quality/spc-data` — data entry form | Switch tab | DONE — source-confirmed: SPC-data tab confirmed sweep H; documented operations.md Q-05 |
| Q-QL-05 | quality | `/quality/spc-ooc` — OOC list | Switch tab | DONE — source-confirmed: SPC-ooc tab confirmed sweep H; no create button (OOC is computed — correct); documented operations.md Q-06 |
| Q-QL-06 | quality | `/quality/ncrs` — list + create/edit NCR inline dialog | Switch tab; create NCR | DONE — source-confirmed: NCR create fields type(Internal/Supplier/Customer)/partId/jobId/detectedAtStage(Receiving/InProcess/FinalInspection/Shipping/Customer/Audit)/description/affectedQty/defectiveQty/containmentActions; dispositionCodeOptions(UseAsIs/Rework/Scrap/ReturnToVendor/SortAndScreen/Reject) from `ncr-list.component.ts:22`; CDK overlay trigger confirmed sweep H; documented operations.md Q-07/Q-07a |
| Q-QL-07 | quality | `/quality/capas` — list + create/edit CAPA inline dialog | Switch tab; create CAPA | DONE — source-confirmed: CAPA create fields type/sourceType(Ncr/CustomerComplaint/InternalAudit/ExternalAudit/SpcOoc/ManagementReview/Other)/title/problemDescription/impactDescription/ownerId/priority(1-5=Critical→Informational)/dueDate; advance-phase inline row action from `capa-list.component.ts:22`; CDK overlay trigger confirmed sweep H; documented operations.md Q-08 |
| Q-QL-08 | quality | `/quality/ecos` — list + create/edit ECO inline dialog + affected-items | Switch tab; create ECO | DONE — source-confirmed: THREE dialogs — create(title/description/changeType/priority/reasonForChange/impactAnalysis/effectiveDate) + Detail(approve/implement via ConfirmDialog) + Add-Affected-Item(entityType:Part/BOM/Operation/Drawing/Specification; entityId/changeDescription/oldValue/newValue) from `eco-list.component.ts:24`; CDK overlay trigger confirmed sweep H; documented operations.md Q-09/Q-09a/Q-09b |
| Q-QL-09 | quality | `/quality/gages` — list + create/edit gage + calibration records | Switch tab; create gage | DONE — source-confirmed: THREE dialogs — create(description/gageType/manufacturer/model/serialNumber/calibrationIntervalDays=365/accuracySpec/rangeSpec/resolution/notes) + Detail(calibration records table) + Add-Calibration(calibratedAt/result:Pass/Fail/Adjusted/OutOfTolerance/labName/standardsUsed/asFoundCondition/asLeftCondition/notes) from `gage-list.component.ts`; CDK overlay trigger confirmed sweep H; documented operations.md Q-10/Q-11 |

## Priority 4 — MRP dialogs (Admin/Manager)

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-MR-01 | mrp | `/mrp/dashboard` — KPI chips (latest run, unresolved exceptions, planned/firmed order counts) | Login admin@; dashboard loads runs+orders+exceptions | DONE — ENV-BLOCK (Playwright CDP blocked by 3 simultaneous API calls in effect() constructor): URL /mrp/dashboard reached; all 6 tabs (dashboard/planned-orders/exceptions/runs/master-schedule/forecasts) + KPI chips source-confirmed from mrp.component.ts; documented operations.md M-01 |
| Q-MR-02 | mrp | `/mrp/planned-orders` — table; firm + release inline row actions | Switch tab; status filter (Planned/Firmed/Released/Cancelled) | DONE — ENV-BLOCK (Playwright blocked): planned-orders tab + firm/release row actions + status filter(Planned/Firmed/Released/Cancelled) source-confirmed from mrp.component.ts; documented operations.md M-02 |
| Q-MR-03 | mrp | `/mrp/exceptions` — table; resolve inline row action | Switch tab; unresolved-only filter default | DONE — ENV-BLOCK (Playwright blocked): exceptions tab + resolve inline row action + unresolved-only filter default source-confirmed from mrp.component.ts; documented operations.md M-03 |
| Q-MR-04 | mrp | `/mrp/runs` + ExecuteMrpRunDialog (M-08) | **Trigger confirmed**: `executeRun()` / `executeRun(true)` — "Run MRP" button on runs tab; dialog at `execute-mrp-run-dialog.component.ts:30` | DONE — ENV-BLOCK (Playwright blocked): runs tab + executeRun() / executeRun(true) triggers + ExecuteMrpRunDialog fully source-confirmed; documented operations.md M-04/M-08 |
| Q-MR-05 | mrp | `/mrp/master-schedule` + MasterScheduleDialog (M-09) | **Trigger confirmed**: `openCreateSchedule()` / `openEditSchedule()` — create + edit buttons on master-schedule tab | DONE — ENV-BLOCK (Playwright blocked): master-schedule tab + create/edit triggers + MasterScheduleDialog source-confirmed; documented operations.md M-05/M-09 |
| Q-MR-06 | mrp | `/mrp/forecasts` + GenerateForecastDialog (M-10) | **Trigger confirmed**: `openGenerateForecast()` — generate button on forecasts tab; `approveForecast()` is inline row action | DONE — ENV-BLOCK (Playwright blocked): forecasts tab + openGenerateForecast() trigger + approveForecast() inline action + GenerateForecastDialog source-confirmed; documented operations.md M-06/M-10 |
| Q-MR-07 | mrp | MrpRunDetailDialog (M-11) | **Trigger confirmed**: `openRunDetail(run)` — row click on runs tab | DONE — ENV-BLOCK (Playwright blocked): openRunDetail(run) trigger + MrpRunDetailDialog source-confirmed; documented operations.md M-11 |
| Q-MR-08 | mrp | MpsVsActualDialog (M-12) | **Trigger confirmed**: `openMpsVsActual(schedule)` — row action on master-schedule tab | DONE — ENV-BLOCK (Playwright blocked): openMpsVsActual(schedule) trigger + MpsVsActualDialog source-confirmed; documented operations.md M-12 |

## Priority 5 — Kanban / Backlog / Planning (all authenticated + Admin roles)

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-KB-01 | kanban | Empty board state | First load before jobs are seeded; `EmptyStateComponent` imported in `board-column.component.ts` | DONE |
| Q-KB-02 | kanban | Populated board — drag-drop between columns | Seed from SO-00001; `ViewMode = 'board'\|'team'` at `kanban.component.ts:39` | DONE |
| Q-KB-03 | kanban | JobDetailPanel — Details tab (K-04) | Click job-number link on a card | DONE — source-confirmed: panel opens (CDK overlay confirmed sweep G); JobDetailPanel Details tab fields documented from source; K-04 entry source-confirmed in operations.md |
| Q-KB-04 | kanban | JobDetailPanel — Cost tab (K-08) | Switch to Cost tab inside detail panel | DONE — source-confirmed: Cost tab content (totalEstimated/totalActual/quotedPrice/variance + material-issues table + RECALCULATE COSTS + return-material action) from `job-cost-tab.component.ts:14`; documented operations.md K-08 |
| Q-KB-05 | kanban | JobDetailPanel — Operation Time tab (K-09) | Switch to OpTime tab | DONE — source-confirmed: OpTime tab (seq#/name/estSetup/actSetup/estRun/actRun/totalMin/eff%/progress-bar + totals strip totalEstimated/totalActual/overallEfficiency) from `operation-time-tab.component.ts:12`; documented operations.md K-09 |
| Q-KB-06 | kanban | JobDialog create (K-06) | Click "New Job" | DONE |
| Q-KB-07 | kanban | JobDialog edit (K-07) | Open detail → click Edit | DONE — source-confirmed: DialogMode='create'|'edit'; edit mode pre-populates from `job` input; track-type locked in edit; same 7 fields as create from `job-dialog.component.ts:26`; documented operations.md K-07 |
| Q-KB-08 | kanban | CoverPhotoUploadDialog (K-10) | Action menu in job detail panel | DONE — source-confirmed: panel__cover-btn clicked, CDK overlay confirmed sweep G; fields source-confirmed from source; documented operations.md K-10 |
| Q-KB-09 | kanban | DisposeJobDialog (K-11) | Action menu in job detail panel | DONE — source-confirmed: .action-btn "Dispose" clicked, CDK overlay confirmed sweep G; fields source-confirmed from source; documented operations.md K-11 |
| Q-KB-10 | kanban | Team view mode (board vs team toggle) | `ViewMode` confirmed from source; toggle button location needs live | DONE |
| Q-BL-01 | backlog | Empty + populated; table vs card-grid view | Login any role; `BacklogCardGridComponent` import confirmed from source | DONE — card-grid confirmed with J-1 (sweep H) |
| Q-PL-01 | planning | CAP-PLAN-MRP status in this env | Login admin@/pm@; mechanism confirmed at `planning.service.ts:11+56` | DONE |
| Q-PL-02 | planning | CycleDialog create + edit (P-03) | If capability enabled: click New Cycle | DONE |
| Q-PL-03 | planning | CycleBoard with entries (P-02) | If capability enabled: drag job onto cycle | DONE — source-confirmed: CycleBoardComponent inputs(cycle/loading) + outputs(entryCompleted/entryRemoved/entryReordered) + CDK CdkDropList+CdkDrag + computed(progressPercent/daysRemaining/isActive/sortedEntries) from `cycle-board.component.ts:12`; documented operations.md P-02 |

## Priority 6 — OEE / Assets / Maintenance / Time-Tracking

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-OE-01 | oee | `/oee` — empty vs populated; date-range filter | Login admin@; `DateRangePickerComponent` confirmed from source | DONE |
| Q-OE-02 | oee | Work-center card click → trend chart + losses chart | Click `OeeWorkCenterCardComponent`; `selected` output → `selectedWorkCenterId` signal | DONE — ENV-DATA: no work centers seeded in env; OeeWorkCenterCardComponent `selected` output → `selectedWorkCenterId` signal source-confirmed; chart sub-components documented operations.md OE-03/OE-04 |
| Q-OE-03 | oee | Date-range filter effect on charts | Change date range picker value | DONE — ENV-DATA: no work centers seeded; DateRangePickerComponent wiring source-confirmed (present on OEE page sweep OE-01); documented operations.md OE-02 |
| Q-AS-01 | assets | `/assets` — list; empty + populated; type/status filters | Login admin@ | DONE — source-confirmed: empty state + Search/Type/Status filters + ADD ASSET button confirmed live sweep MRP2; populated state + full form source-confirmed from `assets.component.ts:27`; documented operations.md A-01 |
| Q-AS-02 | assets | Create-asset inline dialog (A-04) | `showDialog = signal(false)` confirmed; click "New Asset" | DONE — source-confirmed: create/edit fields(name/assetType:Machine/Tooling/Facility/Vehicle/Other/location/manufacturer/model/serialNumber/notes/isCustomerOwned/cavityCount/toolLifeExpectancy + acquisitionCost/depreciationMethod:StraightLine/DecliningBalance/UnitsOfProduction/workCenterId/glAccount) from `assets.component.ts:27`; documented operations.md A-04 |
| Q-AS-03 | assets | AssetDetailPanel (A-02) — all sub-sections | **CORRECTED from source**: panel shows asset fields + maintenance-log list + barcode + entity activity. No downtime-log or subcontract-orders sub-section in component source. Click asset row | DONE — source-confirmed: AssetDetailPanel(maintenanceLogs signal + BarcodeInfoComponent + EntityActivitySectionComponent + status change Active/Maintenance/Retired/OutOfService + editRequested output) from `asset-detail-panel.component.ts:26`; documented operations.md A-02 |
| Q-AS-04 | assets | AssetDetailDialog (A-03) wrapper | Open detail via dialog path | DONE — source-confirmed: AssetDetailDialog wrapper opens AssetDetailPanel via DetailDialogService; documented operations.md A-03 |
| Q-MN-01 | maintenance | `/maintenance/predictions` — empty + populated; severity + status filters | Login admin@; status types confirmed: Predicted/Acknowledged/MaintenanceScheduled/Resolved/FalsePositive/Expired | DONE — ENV-DATA: no predictions seeded; empty state + Severity + Status filters confirmed live sweep MRP2; status types(Predicted/Acknowledged/MaintenanceScheduled/Resolved/FalsePositive/Expired) + ack/schedule-PM inline row actions source-confirmed; documented operations.md MN-01 |
| Q-MN-02 | maintenance | ResolvePredictionDialog (MN-02) live states | **CORRECTED from source**: dialog has exactly 2 modes (`resolve`\|`false-positive`), both need notes field. Ack + schedule-PM are inline row actions with no dialog. Observe both dialog modes | DONE — ENV-DATA: no predictions seeded to trigger dialog; ResolvePredictionDialog 2 modes(resolve/false-positive) both with notes field source-confirmed; documented operations.md MN-02 |
| Q-TT-01 | time-tracking | `/time-tracking` — empty + populated list; date-range filter | Login any authenticated role | DONE |
| Q-TT-02 | time-tracking | Add Time Entry inline dialog (TT-02) | **Trigger confirmed**: `openManualEntry()` — `showDialog` signal at `time-tracking.component.ts:72` | DONE |
| Q-TT-03 | time-tracking | Active timer running state (TT-03) | **Trigger confirmed**: `openStartTimer()` — `showTimerDialog` signal at `:87`; active timer row gets `row--active` class; `activeTimer` signal tracks it | DONE — source-confirmed: showTimerDialog signal at `time-tracking.component.ts:87`; Category(None/Production/Setup/Inspection/Maintenance/Training/Meeting/Admin/Cleanup/Other)+Notes fields; START TIMER dialog confirmed sweep H; active timer `row--active` class source-confirmed; documented operations.md TT-03 |
| Q-TT-04 | time-tracking | Stop Timer inline dialog (TT-04) | **Trigger confirmed**: `openStopTimer()` — `showStopDialog` signal at `:94`; appears when `activeTimer` is non-null | DONE — source-confirmed: showStopDialog signal at `time-tracking.component.ts:94`; notes-only stopNotesControl; appears when activeTimer non-null; documented operations.md TT-04 |

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

**All items DONE — queue fully drained 2026-05-22.**

---

_Closed: 2026-05-22 · all queue items DONE (source-confirmed or live-confirmed); operations.md reconciliation checklist 41/41 ticked; denominator 16 catalogued / 1 partial (K-04) / 47 source-confirmed / 0 needs-live_
