# Operations Queue — ui-scout working file

_Phase 03 · Scout writes here; source-cataloger dequeues to operations.md_
_Format: ID · area · what to sweep · trigger/note · status_

---

## Status legend
- `OPEN` — not yet swept
- `IN-PROGRESS` — scout actively working
- `DONE` — swept; source-cataloger to pull into operations.md
- `DN-8` — capability-gated off; terminal closure recorded

---

## Priority 1 — Shop-floor kiosk (no-auth + worker@ role)

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-SF-01 | shop-floor | Main display `/display/shop-floor` — phases: main, pin, actions, job-select | Navigate to route unauthenticated; capture all phase transitions | OPEN |
| Q-SF-02 | shop-floor | KioskSetup flow (admin-login → configure) | Phase 'setup' shown when no terminal configured | OPEN |
| Q-SF-03 | shop-floor | Clock kiosk `/display/shop-floor/clock` — phases: setup/dashboard/identifying/pin/job-scanned/manual-login/clock | Navigate to sub-route | OPEN |
| Q-SF-04 | shop-floor | Inventory scan `/display/shop-floor/scan` | Navigate to sub-route; scan or manual-entry a barcode | OPEN |
| Q-SF-05 | shop-floor | Scan log `/display/shop-floor/scan-log` | Navigate to sub-route | OPEN |
| Q-SF-06 | shop-floor | ScanJobFlow (SF-12) | Trigger from action-overlay after job barcode scan | OPEN |
| Q-SF-07 | shop-floor | ScanMoveFlow (SF-13) | Trigger from action-overlay — move action | OPEN |
| Q-SF-08 | shop-floor | ScanReceiveFlow (SF-14) | Trigger from action-overlay — receive action | OPEN |
| Q-SF-09 | shop-floor | ScanReturnFlow (SF-15) | Trigger from action-overlay — return action | OPEN |
| Q-SF-10 | shop-floor | ScanShipFlow (SF-16) | Trigger from action-overlay — ship action | OPEN |
| Q-SF-11 | shop-floor | ScanCountFlow (SF-17) | Trigger from action-overlay — count action | OPEN |
| Q-SF-12 | shop-floor | ScanInspectFlow (SF-18) | Trigger from action-overlay — inspect action | OPEN |
| Q-SF-13 | shop-floor | ScanIssueFlow (SF-19) | Trigger from action-overlay — issue action | OPEN |
| Q-SF-14 | shop-floor | TrainingModeBanner (SF-11) | Confirm how to trigger training mode; check setting in kiosk-setup | OPEN |
| Q-SF-15 | shop-floor | ProductionWorker sweep — confirm any role-specific rendering differences in kiosk | Login as worker@, ForgeRun!2026; check for worker-gated content vs public content | OPEN |

## Priority 2 — Scheduling (Admin/Manager)

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-SC-01 | scheduling | `/scheduling/gantt` — populate + empty | Login admin@ or manager@; need jobs with scheduled operations | OPEN |
| Q-SC-02 | scheduling | `/scheduling/dispatch` | Switch tab | OPEN |
| Q-SC-03 | scheduling | `/scheduling/work-centers` | Switch tab | OPEN |
| Q-SC-04 | scheduling | `/scheduling/shifts` | Switch tab | OPEN |
| Q-SC-05 | scheduling | `/scheduling/runs` | Switch tab | OPEN |
| Q-SC-06 | scheduling | Any dialogs/panels within scheduling tabs not visible from source | Sweep all tab interactions | OPEN |

## Priority 3 — Quality (Admin/Manager/Engineer)

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-QL-01 | quality | `/quality/inspections` — empty + populated; create-inspection dialog | Login admin@; may need a job/part to attach inspection to | OPEN |
| Q-QL-02 | quality | `/quality/lots` — empty + populated; lot traceability | Switch tab | OPEN |
| Q-QL-03 | quality | `/quality/spc-charts` — characteristics list + chart detail | Switch tab; select a characteristic | OPEN |
| Q-QL-04 | quality | `/quality/spc-data` — data entry form | Switch tab | OPEN |
| Q-QL-05 | quality | `/quality/spc-ooc` — OOC list | Switch tab | OPEN |
| Q-QL-06 | quality | `/quality/ncrs` — list + create/edit NCR dialog | Switch tab; create NCR | OPEN |
| Q-QL-07 | quality | `/quality/capas` — list + create/edit CAPA dialog | Switch tab; create CAPA | OPEN |
| Q-QL-08 | quality | `/quality/ecos` — list + create/edit ECO dialog + affected items | Switch tab; create ECO | OPEN |
| Q-QL-09 | quality | `/quality/gages` — list + create/edit gage + calibration records | Switch tab; create gage | OPEN |
| Q-QL-10 | quality | Engineer-only render differences (if any) | Login engineer@; check for any capability/role differences vs admin | OPEN |

## Priority 4 — MRP dialogs (Admin/Manager)

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-MR-01 | mrp | `/mrp/dashboard` — empty + populated | Login admin@; may be empty without an MRP run | OPEN |
| Q-MR-02 | mrp | `/mrp/planned-orders` | Switch tab | OPEN |
| Q-MR-03 | mrp | `/mrp/exceptions` | Switch tab | OPEN |
| Q-MR-04 | mrp | `/mrp/runs` + ExecuteMrpRunDialog | Switch tab; click "Run MRP" | OPEN |
| Q-MR-05 | mrp | `/mrp/master-schedule` + MasterScheduleDialog | Switch tab; create entry | OPEN |
| Q-MR-06 | mrp | `/mrp/forecasts` + GenerateForecastDialog | Switch tab; generate forecast | OPEN |
| Q-MR-07 | mrp | MrpRunDetailDialog | Click run in runs list | OPEN |
| Q-MR-08 | mrp | MpsVsActualDialog | Trigger from master-schedule tab | OPEN |

## Priority 5 — Kanban / Backlog / Planning (all authenticated + Admin roles)

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-KB-01 | kanban | Empty board (no jobs) | First load; check empty-state component | OPEN |
| Q-KB-02 | kanban | Populated board — drag-drop between columns | Need seeded jobs; SO-00001 exists (reuse) | OPEN |
| Q-KB-03 | kanban | JobDetailPanel — Details tab | Click job number | OPEN |
| Q-KB-04 | kanban | JobDetailPanel — Cost tab (K-08) | Switch to Cost tab in detail panel | OPEN |
| Q-KB-05 | kanban | JobDetailPanel — Operation Time tab (K-09) | Switch to OpTime tab | OPEN |
| Q-KB-06 | kanban | JobDialog create (K-06) | Click "New Job" | OPEN |
| Q-KB-07 | kanban | JobDialog edit (K-07) | Open detail → click Edit | OPEN |
| Q-KB-08 | kanban | CoverPhotoUploadDialog (K-10) | Action in job detail panel | OPEN |
| Q-KB-09 | kanban | DisposeJobDialog (K-11) | Action in job detail panel | OPEN |
| Q-KB-10 | kanban | Team view mode (vs board view) | Toggle view mode button | OPEN |
| Q-BL-01 | backlog | Empty + populated backlog; table vs card view | Login any role | OPEN |
| Q-PL-01 | planning | CAP-PLAN-MRP status — enabled or disabled in this env | Login admin@/pm@; note state seen | OPEN |
| Q-PL-02 | planning | CycleDialog create + edit | If capability enabled: click New Cycle | OPEN |
| Q-PL-03 | planning | CycleBoard with entries | If capability enabled: add job to cycle | OPEN |

## Priority 6 — OEE / Assets / Maintenance / Time-Tracking

| ID | area | target | trigger / note | status |
|----|------|--------|----------------|--------|
| Q-OE-01 | oee | `/oee` — empty (no work centers) vs populated | Login admin@ | OPEN |
| Q-OE-02 | oee | Work-center card click → trend chart + losses chart | Click card | OPEN |
| Q-OE-03 | oee | Date-range filter effect | Change date range | OPEN |
| Q-AS-01 | assets | `/assets` — list; empty + populated | Login admin@ | OPEN |
| Q-AS-02 | assets | Create-asset dialog (inline A-01) | Click New Asset | OPEN |
| Q-AS-03 | assets | AssetDetailPanel — all sub-sections (downtime, maintenance, subcontracts) | Click asset row | OPEN |
| Q-AS-04 | assets | AssetDetailDialog (dialog wrapper of A-02) | Open detail via dialog path | OPEN |
| Q-MN-01 | maintenance | `/maintenance/predictions` — empty + populated | Login admin@ | OPEN |
| Q-MN-02 | maintenance | ResolvePredictionDialog — all action types (ack/schedule/resolve/false-positive) | Click action on prediction row | OPEN |
| Q-TT-01 | time-tracking | `/time-tracking` — empty + populated list | Login any authenticated role | OPEN |
| Q-TT-02 | time-tracking | Add time entry dialog | Click New Entry | OPEN |
| Q-TT-03 | time-tracking | Active timer running state | Start timer; check header/status | OPEN |
| Q-TT-04 | time-tracking | Correct time entry (correction log) | Edit a submitted entry | OPEN |

---

_Initialized: 2026-05-22 · 57 queue items · All OPEN pending ui-scout sweep_
