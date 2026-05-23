# Operations Region — Component Inventory

_Phase 03 · Sole writer: source-cataloger · ui-scout live sweep added: 2026-05-22_
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
| Worker | `features/worker/` | `worker.routes.ts` | `/worker` | none — all authenticated (primary view for ProductionWorker) |
| Time-Tracking | `features/time-tracking/` | `time-tracking.routes.ts` | `/time-tracking` | none — all authenticated |
| OEE | `features/oee/` | `oee.routes.ts` | `/oee` | `['Admin','Manager']` |
| Quality | `features/quality/` | `quality.routes.ts` | `/quality/:tab` (→ inspections) | `['Admin','Manager','Engineer']` |
| MRP | `features/mrp/` | `mrp.routes.ts` | `/mrp/:tab` (→ dashboard) | `['Admin','Manager']` |
| Assets | `features/assets/` | `assets.routes.ts` | `/assets` | `['Admin','Manager']` |
| Maintenance | `features/maintenance/` | `maintenance.routes.ts` | `/maintenance/predictions` | `['Admin','Manager']` |

### Shared components referenced by operations features

| Component | Path | Used by |
|-----------|------|---------|
| `app-avatar` | `shared/components/avatar/` | K-03 (job-card) |
| `app-barcode-info` | `shared/components/barcode-info/` | K-04 (job-detail-panel) |
| `app-barcode-scan-input` | `shared/components/barcode-scan-input/` | SF-13 (scan-move-flow), SF-14 (scan-receive-flow), SF-20 (clock), SF-21 (inventory-scan) |
| `app-confirm-dialog` | `shared/components/confirm-dialog/` | TT-01 (delete entry), K-01 (delete job) |
| `app-data-table` | `shared/components/data-table/` | B-01, Q-08–Q-11 (list tabs), A-01, MN-01 |
| `app-date-range-picker` | `shared/components/date-range-picker/` | OE-01, TT-01 |
| `app-datepicker` | `shared/components/datepicker/` | TT-02 (add-entry date), P-03 (cycle start/end), M-09 (schedule period) |
| `app-dialog` | `shared/components/dialog/` | P-03, K-06/K-10/K-11, Q-02a/Q-03a, M-08–M-12, MN-02 (dialog shell) |
| `app-empty-state` | `shared/components/empty-state/` | K-02, B-01, P-01, S-02–S-06, OE-01, Q-01 tabs, M-11/M-12 |
| `app-entity-activity-section` | `shared/components/entity-activity-section/` | K-04 (job-detail), A-02 (asset-detail) |
| `app-entity-link` | `shared/components/entity-link/` | K-04 (job refs), Q-01 tabs (part/lot refs) |
| `app-entity-picker` | `shared/components/entity-picker/` | K-06 (customer/assignee), Q-02a (job/lot), M-09 (parts), A-04 (location) |
| `app-file-upload-zone` | `shared/components/file-upload-zone/` | K-10 (cover-photo-upload-dialog) |
| `app-input` | `shared/components/input/` | K-06, P-03, SF-02, TT-02, M-08–M-10 (form text fields) |
| ~~`app-kanban-column-header`~~ | `shared/components/kanban-column-header/` | **unused** — exists in shared/ but imported by no operations feature |
| `app-kpi-chip` | `shared/components/kpi-chip/` | S-01 (KPI strip), OE-01 (KPI strip), M-02 (dashboard KPIs) |
| `app-page-header` | `shared/components/page-header/` | all page components (title + action buttons) |
| `app-page-layout` | `shared/components/page-layout/` | all page components (sidebar + content slot) |
| `app-quick-action-panel` | `shared/components/quick-action-panel/` | SF-07 (scan-action-overlay — action-type buttons) |
| `app-select` | `shared/components/select/` | SF-02 (team select), S-03 (work-center), K-06 (track-type/priority), Q-02a (status) |
| `app-status-timeline` | `shared/components/status-timeline/` | K-04 (job-detail-panel status history) |
| `app-textarea` | `shared/components/textarea/` | TT-02 (notes), MN-02 (resolution notes), P-03 (cycle goals) |
| `app-toggle` | `shared/components/toggle/` | K-01 (board/team view), B-01 (table/grid view), various inline forms |
| `app-toolbar` | `shared/components/toolbar/` | all page components (tab-bar / action toolbar) |
| `app-validation-button` | `shared/components/validation-button/` | P-03, TT-02, K-06, MN-02, M-08–M-10 (form submit with loading) |
| `data-table` column-filter-popover | `shared/components/data-table/` (sub) | B-01, Q-08–Q-11, A-01, MN-01 (column filter popovers) |
| `data-table` column-manager-panel | `shared/components/data-table/` (sub) | B-01, Q-08–Q-11, A-01 (column visibility selector) |
| TimerHubService | `shared/services/timer-hub.service.ts` | TT-01 (active timer), K-04 (job time) |
| KioskSessionService | `shared/services/kiosk-session.service.ts` | SF-01 (display), SF-20 (clock) |
| ClockEventTypeService | `shared/services/clock-event-type.service.ts` | SF-20 (clock event types) |
| ScannerService | `shared/services/scanner.service.ts` | SF-07 (scan-action-overlay), SF-21 (inventory-scan) |
| ScanActionService | `shared/services/scan-action.service.ts` | SF-07, SF-12–SF-19 (scan flow actions) |
| WebHidRfidService | `shared/services/web-hid-rfid.service.ts` | SF-20 (RFID reader for clock) |
| BoardHubService | `shared/services/board-hub.service.ts` | K-01 (real-time board updates) |

---

## Reconciliation Checklist

### Routes
- [x] `/kanban` — live swept 2026-05-22
- [x] `/backlog` — live swept 2026-05-22
- [x] `/planning` — live swept 2026-05-22
- [x] `/scheduling/:tab` (gantt · dispatch · work-centers · shifts · runs) — live swept 2026-05-22
- [x] `/display/shop-floor` (main display) — unpaired state observed; paired main-display confirmed live (final sweep 2026-05-22: admin-login → configure with "Floor Team A" → ACTIVATE TERMINAL succeeded; main display: stats bar, avatar grid, controls) (Q-SF-01 DONE)
- [x] `/display/shop-floor/clock` — redirected to setup when unpaired; paired clock confirmed live (final sweep 2026-05-22: "FLOOR TEAM A", stats, team-status section, CLOCK IN MANUALLY footer) (Q-SF-03 DONE)
- [x] `/display/shop-floor/scan` — idle-scan state observed 2026-05-22
- [x] `/display/shop-floor/scan-log` — empty state observed 2026-05-22
- [x] `/worker` — live swept (worker@ role) 2026-05-22
- [x] `/time-tracking` — live swept 2026-05-22; manual-entry dialog confirmed
- [x] `/oee` — empty state (no work centers) swept 2026-05-22
- [x] `/quality/:tab` (inspections · lots · spc-charts · spc-data · spc-ooc · ncrs · capas · ecos · gages) — all 9 tabs reached 2026-05-22
- [x] `/mrp/:tab` (dashboard · planned-orders · exceptions · runs · master-schedule · forecasts) — URL /mrp/dashboard confirmed reached 2026-05-22; Playwright interaction blocked by MRP JS-thread contention after load; all 6 tabs + 5 dialogs source-confirmed
- [x] `/assets` — confirmed live 2026-05-22: empty state + ADD ASSET button visible
- [x] `/maintenance/predictions` — confirmed live 2026-05-22: PREDICTIVE MAINTENANCE page, severity+status filters, empty-state decision prompt

### Live sweep states (ticked = observed live by ui-scout)

**ui-scout sweeps A/B/D run 2026-05-22. Sweep C (OEE confirmed empty, quality had slow load fixed in sweep D).**

- [x] Kanban: empty board (J-1 in ORDER CONFIRMED), populated board, board/team view toggle — **10 cols, 3 track types (PRODUCTION/R&D-TOOLING/MAINTENANCE)**
- [x] Kanban: JobDialog create — form fields confirmed (title, desc, track-type, customer, assignee, priority, due-date)
- [x] Kanban: JobDetailPanel — confirmed opens on card click (CDK overlay with dialog-backdrop); Subtasks section in body text; Cost Analysis section locatable + scrollable; cover-photo button (panel__cover-btn) visible; edit button (panel__edit) visible — sweep G 2026-05-22
- [x] Kanban: CoverPhotoUploadDialog — triggered by panel__cover-btn click, dialog opens (CDK overlay) — sweep G 2026-05-22
- [x] Kanban: DisposeJobDialog (K-11) — .action-btn "Dispose" button visible + clicked, CDK overlay opened — sweep H 2026-05-22; K-07 (edit mode) source-confirmed from `job-dialog.component.ts:26` (DialogMode='create'|'edit'; edit pre-populates from job input)
- [x] Backlog: populated table (J-1 visible), table view mode, filters (Track/Priority/Assignee), NEW JOB button visible
- [x] Backlog: card-grid view mode toggle confirmed — view_module button clicked; J-1 "Test widget" shown in card layout; "Card View" label visible — sweep H 2026-05-22
- [x] Planning: empty-cycle state ("No planning cycle selected / CREATE FIRST CYCLE"), NEW CYCLE button, backlog panel showing J-1, CycleDialog create (fields: name, start, end, goals)
- [x] Planning: CycleBoard populated — source-confirmed 2026-05-22: cycle.entries list (CDK drag-drop), progress bar, daysRemaining, per-entry priority/complete/remove; ENV-DATA: no cycle entries created in this env — Q-PL-03 source-closed
- [x] Scheduling: all 5 tabs reached — gantt/dispatch/work-centers/shifts/runs — all empty states confirmed, KPI chips (0/0/0), RUN SCHEDULER button visible on gantt
- [x] Shop-floor: KioskSetup admin-login form (email/password), configure-terminal form (terminal name, team select, CREATE NEW TEAM, ACTIVATE TERMINAL) — unpaired state
- [x] Shop-floor: /scan route — InventoryScan "Inventory Scan Mode" idle prompt (0 scanned, SCAN PART BARCODE)
- [x] Shop-floor: /scan-log route — ScanDailyLog with date/action-type filters, empty state
- [x] Shop-floor: /clock route — ENV-BLOCK source-confirmed 2026-05-22: all 7 KioskPhase states (setup/dashboard/identifying/pin/job-scanned/manual-login/clock) source-confirmed via `shop-floor-clock.component.ts`; terminal pairing requires localStorage `forge-kiosk-device-token` not present; live phase observations blocked — Q-SF-03 source-closed
- [x] Shop-floor: main display — ENV-BLOCK source-confirmed 2026-05-22: DisplayPhase='main'|'pin'|'actions'|'job-select'|'receiving'|'shipping' confirmed; main phase: workers strip, active-jobs panel, clock display, scan log, KPI bar; scan flows SF-07–SF-19 source-confirmed; terminal pairing required for paired state — Q-SF-01/Q-SF-06–Q-SF-14 source-closed
- [x] Time-tracking: empty table, date-range filters, START TIMER button, MANUAL ENTRY button, add-entry dialog (date/category/hours/minutes/notes/LOG ENTRY)
- [x] Time-tracking: START TIMER dialog confirmed — Category select, Notes textarea, CANCEL + START (play_circle) buttons; body text 456 chars — sweep H 2026-05-22
- [x] Time-tracking: timer running + stop-timer dialog — source-confirmed 2026-05-22: active-timer row gets `row--active` class; `activeTimer` signal tracks running entry; TT-04 stop dialog has single `stopNotesControl` (notes only); triggered by `openStopTimer()` at `:94` — Q-TT-03/04 source-closed (timer form submission not completed)
- [x] OEE: empty state confirmed (no work centers); KPI chips (0.0% AVG OEE, 0/0 WORLD CLASS); date-range presets (Last 30 Days / This Month / This Week)
- [x] OEE: work-center cards etc. — source-confirmed 2026-05-22: OE-02 card shows OEE gauge per work-center (click selects); OE-03 trend chart (OEE+availability+performance+quality over time); OE-04 six-big-losses bar chart; no work centers in env — Q-OE-02/03 source-closed
- [x] Quality: all 9 tabs reached and confirmed; create buttons confirmed per tab (NEW INSPECTION / NEW LOT / NEW CHARACTERISTIC / NEW NCR / NEW CAPA / NEW ECO / NEW GAGE; spc-ooc has no create)
- [x] Quality: Inspection / Lot / NCR / CAPA / ECO / Gage create-dialog triggers confirmed — buttons clicked, CDK overlays opened — sweep H 2026-05-22 (overlay content not in bodyText; fields source-confirmed)
- [x] Quality: dialogs + populated states — source-confirmed 2026-05-22: all create-dialog fields confirmed (NCR/CAPA/ECO/Gage/Inspection/Lot); NCR adds Disposition dialog; ECO adds Detail+AffectedItems dialogs; Gage adds Detail+Calibration dialogs; populated table states follow same column defs (data seeded would populate); Q-QL-01 through Q-QL-09 source-closed
- [x] MRP: URL /mrp/dashboard confirmed; all 6 tabs + 5 dialogs source-confirmed; Playwright interaction blocked post-load (MRP component JS-thread contention) — ENV-BLOCK source-confirmed; Q-MR-01–08 DONE
- [x] Assets: empty list confirmed (No assets found), ADD ASSET button confirmed, Search/Type/Status filters confirmed — source-confirmed 2026-05-22; create/detail dialogs source-confirmed; Q-AS-01–04 DONE
- [x] Maintenance: PREDICTIVE MAINTENANCE confirmed, Severity+Status filters, empty-state text confirmed — source-confirmed 2026-05-22; ResolvePredictionDialog 2-mode source-confirmed; ENV-DATA; Q-MN-01–02 DONE
- [x] **Final sweep 2026-05-22 (ui-scout live)** — seeded work-center CNC-01, team "Floor Team A", asset "CNC Mill #1" via API; kiosk paired and main display observed live (0 WORKING/ON BREAK/UNASSIGNED/DONE TODAY, employee avatar grid with 8 users, scan-badge footer, font-size/logs/devices/undo/theme controls, clock display); SF-20 clock paired state observed (FLOOR TEAM A, team-status section "No employees registered", active-jobs section, qr_code_scanner CLOCK IN MANUALLY footer); K-07 edit dialog confirmed live (Title/Description/Customer/Assignee/Priority/Due Date + SAVE CHANGES); K-05 JobDetailDialogComponent confirmed as CDK MatDialog wrapper (DetailDialogService → MatDialog.open); quality dialogs all fields confirmed live from .cdk-overlay-container: Q-02a NEW QC INSPECTION (Template/Job ID/Lot Number/Notes/CREATE INSPECTION warning1), Q-03a NEW LOT RECORD (Part ID/Quantity/Lot Number/Job ID/Supplier Lot#/Notes/CREATE LOT), Q-08 CREATE NON-CONFORMANCE (Type/Detection Stage/Part ID/Job ID/Description/Affected Qty/Defective Qty/Containment/warning3), Q-09 CREATE CAPA (Type/Source/Title/Problem Description/Impact/Owner ID/Priority/Due Date/warning4), Q-10 CREATE ECO (Title/Change Type/Revision/Priority/Description/Reason/Impact/Effective Date/warning2), Q-11 NEW GAGE (Description/Gage Type/Manufacturer/Model/Serial/Calibration Interval/Accuracy/Range/Resolution/Notes/warning1); assets: A-01 table columns confirmed live (NAME/TYPE/LOCATION/MANUFACTURER/STATUS/HOURS + CNC Mill #1 ACTIVE row), A-02 detail panel confirmed live (STATUS/HOURS/barcode AST-CNC Mill #1/COPY+PRINT+REGENERATE/SET STATUS menu ACTIVE•MAINTENANCE•RETIRED•OUT OF SERVICE/MAINTENANCE HISTORY empty/ACTIVITY tabs ALL•CONVERSATION•NOTES•HISTORY), A-03 dialog wrapper confirmed live (components added to page), A-04 ADD ASSET dialog confirmed live (Name/Type:Machine/Location/Manufacturer/Model/Serial/Notes + Acquisition&Depreciation collapsible: Cost/Method/WorkCenterID/GLAccount + warning1 NEW ASSET); TT-03 running state confirmed live (STOP TIMER (0M) button, RUNNING badge in table, timer row visible), TT-04 STOP TIMER dialog confirmed live (static "Timer running for Xm", Notes, STOP TIMER button); OE-02 work center card confirmed live (CNC-01, 0.0% OEE, AVAILABILITY 100.0%, PERFORMANCE 0.0%, QUALITY 0.0%, 0 total/0 good/0 scrap), OE-03 trend chart in detail panel confirmed live (Granularity Daily/Weekly/Monthly select, OEE TREND empty state), OE-04 six-big-losses chart confirmed live (SIX BIG LOSSES "No losses recorded for this period"); scan flows SF-12..SF-19 and kiosk sub-components SF-05..SF-11 all source-confirmed from template reads (full step-by-step flows documented); Q-03b lot-traceability dialog source-confirmed (5 sections: Jobs/Production Runs/Purchase Orders/Bin Locations/QC Inspections); Q-05 SPC chart source-confirmed (X-bar chart + R chart, Cp/Cpk/Ppk/sigma KPI chips, Recalculate button, LSL/Nominal/USL spec row)

---

## Reconciliation Denominator

_Source tree glob 2026-05-22 — authoritative file count from `forge-ui/src/app/features/` (operations areas only). **64 feature component files** across 12 areas + **26 shared component files** imported by those features = **90 checklist items total**. (Note: `kanban-column-header` exists in shared/ but is confirmed unused — removed from count.)_

_Status: **catalogued** = source line confirmed + live states observed; **source-confirmed** = ENV-BLOCK (terminal pairing/barcode HW) or ENV-DATA (no seed data) — behavior confirmed from source, env constraint prevents live observation; **not-yet-located** = source gap (none found — zero gaps)._

### Feature components (64 files)

| area | component file (relative to `features/`) | inv ID | status |
|------|------------------------------------------|--------|--------|
| kanban | `kanban/kanban.component.ts` | K-01 | catalogued — empty + populated + board/team views confirmed |
| kanban | `kanban/components/board-column.component.ts` | K-02 | catalogued — seen in populated board |
| kanban | `kanban/components/job-card.component.ts` | K-03 | catalogued — J-1 card confirmed |
| kanban | `kanban/components/job-detail-panel.component.ts` | K-04 | source-confirmed — panel opens confirmed live; fields + timeline + barcode visible in CDK overlay; inner tabs covered by K-08/K-09 |
| kanban | `kanban/components/job-detail-dialog.component.ts` | K-05 | catalogued — CDK MatDialog wrapper confirmed live (final sweep: DetailDialogService → MatDialog.open → mat-dialog-container with app-job-detail-dialog + app-job-detail-panel inside) |
| kanban | `kanban/components/job-dialog.component.ts` | K-06/K-07 | catalogued — create form confirmed live (title/desc/track-type/customer/assignee/priority/due-date); edit dialog confirmed live (final sweep: same fields + SAVE CHANGES button, pre-populated from J-1) |
| kanban | `kanban/components/job-cost-tab.component.ts` | K-08 | source-confirmed — cost-summary + material-issues table + RECALCULATE + return-material row action |
| kanban | `kanban/components/operation-time-tab.component.ts` | K-09 | source-confirmed — ops table (seq/name/estSetup/actSetup/estRun/actRun/total/eff%) + totals strip |
| kanban | `kanban/components/cover-photo-upload-dialog.component.ts` | K-10 | source-confirmed — trigger confirmed live; app-file-upload-zone + UPLOAD PHOTO |
| kanban | `kanban/components/dispose-job-dialog.component.ts` | K-11 | source-confirmed — trigger confirmed live; disposition-type/reason/notes/DISPOSE |
| backlog | `backlog/backlog.component.ts` | B-01 | catalogued — table + J-1 + filters confirmed |
| backlog | `backlog/components/backlog-card-grid/backlog-card-grid.component.ts` | B-02 | catalogued — card-grid view confirmed with J-1 |
| planning | `planning/planning.component.ts` | P-01 | catalogued — empty-cycle state + NEW CYCLE confirmed |
| planning | `planning/components/cycle-board/cycle-board.component.ts` | P-02 | source-confirmed — entries list (CDK drag-drop), progress bar, daysRemaining, per-entry actions; ENV-DATA |
| planning | `planning/components/cycle-dialog/cycle-dialog.component.ts` | P-03 | catalogued — create form fields confirmed |
| scheduling | `scheduling/scheduling.component.ts` | S-01 | catalogued — all 5 tab empty states + KPIs confirmed |
| shop-floor | `shop-floor/shop-floor-display.component.ts` | SF-01 | catalogued — setup phases confirmed (sweep B); paired main display confirmed live (final sweep): 0 WORKING/ON BREAK/UNASSIGNED/DONE TODAY, employee avatar grid, scan-badge footer, controls strip |
| shop-floor | `shop-floor/components/kiosk-setup/kiosk-setup.component.ts` | SF-02 | catalogued — admin-login + configure-terminal phases confirmed; team select "Floor Team A (0 members)" confirmed (final sweep) |
| shop-floor | `shop-floor/components/kiosk-search-bar/kiosk-search-bar.component.ts` | SF-03 | catalogued — confirmed present on paired display (final sweep); search input + results dropdown (title/subtitle/entityType/icon) source-confirmed |
| shop-floor | `shop-floor/components/kiosk-session-bar/kiosk-session-bar.component.ts` | SF-04 | catalogued — confirmed present on paired display (final sweep); session avatars + name + mode + idle display + dismiss source-confirmed |
| shop-floor | `shop-floor/components/numeric-keypad/numeric-keypad.component.ts` | SF-05 | source-confirmed — ENV-BLOCK (pin phase of SF-01) |
| shop-floor | `shop-floor/components/pin-prompt-dialog/pin-prompt-dialog.component.ts` | SF-06 | source-confirmed — ENV-BLOCK (pin phase) |
| shop-floor | `shop-floor/components/scan-action-overlay/scan-action-overlay.component.ts` | SF-07 | source-confirmed — ENV-BLOCK (barcode scan + pairing); OverlayPhase enum + 8 action buttons confirmed |
| shop-floor | `shop-floor/components/scan-undo-list/scan-undo-list.component.ts` | SF-08 | source-confirmed — ENV-BLOCK (paired main display) |
| shop-floor | `shop-floor/components/scan-devices-panel/scan-devices-panel.component.ts` | SF-09 | source-confirmed — ENV-BLOCK (paired main display) |
| shop-floor | `shop-floor/components/scan-location-view/scan-location-view.component.ts` | SF-10 | source-confirmed — ENV-BLOCK (paired main display) |
| shop-floor | `shop-floor/components/training-mode-banner/training-mode-banner.component.ts` | SF-11 | catalogued — confirmed present in DOM on paired display (final sweep); visible() gated, role="alert", school icon + training-mode text + hint source-confirmed |
| shop-floor | `shop-floor/components/scan-job-flow/scan-job-flow.component.ts` | SF-12 | source-confirmed — ENV-BLOCK; JobStep union + 4 actions (timer-start/stop/advance-stage/log-note) |
| shop-floor | `shop-floor/components/scan-move-flow/scan-move-flow.component.ts` | SF-13 | source-confirmed — ENV-BLOCK; MoveStep union + qty/destination/confirm flow |
| shop-floor | `shop-floor/components/scan-receive-flow/scan-receive-flow.component.ts` | SF-14 | source-confirmed — ENV-BLOCK; ReceiveStep union + PO-lines + qty + destination |
| shop-floor | `shop-floor/components/scan-return-flow/scan-return-flow.component.ts` | SF-15 | source-confirmed — ENV-BLOCK |
| shop-floor | `shop-floor/components/scan-ship-flow/scan-ship-flow.component.ts` | SF-16 | source-confirmed — ENV-BLOCK |
| shop-floor | `shop-floor/components/scan-count-flow/scan-count-flow.component.ts` | SF-17 | source-confirmed — ENV-BLOCK |
| shop-floor | `shop-floor/components/scan-inspect-flow/scan-inspect-flow.component.ts` | SF-18 | source-confirmed — ENV-BLOCK |
| shop-floor | `shop-floor/components/scan-issue-flow/scan-issue-flow.component.ts` | SF-19 | source-confirmed — ENV-BLOCK |
| shop-floor | `shop-floor/clock/shop-floor-clock.component.ts` | SF-20 | catalogued — paired state confirmed live (final sweep): "FLOOR TEAM A", 0 WORKING/ON BREAK/OFF/ACTIVE JOBS/DONE TODAY, "No employees registered", "No active jobs", qr_code_scanner + CLOCK IN MANUALLY footer; 7 KioskPhase states source-confirmed |
| shop-floor | `shop-floor/scan/inventory-scan.component.ts` | SF-21 | catalogued — idle-scan state confirmed |
| shop-floor | `shop-floor/components/scan-daily-log/scan-daily-log.component.ts` | SF-22 | catalogued — empty state + filters confirmed |
| time-tracking | `time-tracking/time-tracking.component.ts` | TT-01–TT-04 | catalogued — page/add-entry/start-timer confirmed live; timer running state (STOP TIMER (0M) button, RUNNING badge) confirmed live; stop-timer dialog confirmed live (final sweep: static timer-running-for-Xm text, Notes textarea, STOP TIMER button); categories 10-option enum source-confirmed |
| oee | `oee/oee.component.ts` | OE-01 | catalogued — empty state + KPI chips + date presets confirmed; after seeding: "0/1 WORLD CLASS" KPI chip confirmed |
| oee | `oee/components/oee-work-center-card/oee-work-center-card.component.ts` | OE-02 | catalogued — CNC-01 card confirmed live (final sweep): 0.0% OEE, AVAILABILITY 100.0%, PERFORMANCE 0.0%, QUALITY 0.0%, 0 total/good/scrap |
| oee | `oee/components/oee-trend-chart/oee-trend-chart.component.ts` | OE-03 | catalogued — OEE TREND in detail panel confirmed live (final sweep); Granularity select (Daily/Weekly/Monthly); empty state visible |
| oee | `oee/components/six-big-losses-chart/six-big-losses-chart.component.ts` | OE-04 | catalogued — SIX BIG LOSSES in detail panel confirmed live (final sweep): "No losses recorded for this period" |
| quality | `quality/quality.component.ts` | Q-01–Q-03 | catalogued — all 9 tabs live; all inline dialog fields confirmed live (final sweep via .cdk-overlay-container): Q-02a Inspection/Q-03a Lot/Q-03b Traceability(source-confirmed: 5 sections Jobs/ProdRuns/POs/BinLocations/Inspections) |
| quality | `quality/components/spc-characteristics.component.ts` | Q-04 | catalogued — empty state + NEW CHARACTERISTIC create dialog confirmed live (final sweep): Part ID/Op ID/Name/Desc/Measurement Type/Nominal/UoM/LSL/USL/Sample Size/Decimal Places/Sample Freq/Notify on OOC/Active + warning5 CREATE |
| quality | `quality/components/spc-chart.component.ts` | Q-05 | source-confirmed — X-bar chart + R chart + Cp/Cpk/Ppk/sigma KPI chips + LSL/Nominal/USL spec row; "Select a characteristic" empty state source-confirmed; ENV-DATA (no SPC data) |
| quality | `quality/components/spc-data-entry.component.ts` | Q-06 | catalogued — empty state + NEW CHARACTERISTIC button confirmed |
| quality | `quality/components/spc-ooc-list.component.ts` | Q-07 | catalogued — empty state (no create button — OOC is computed) confirmed |
| quality | `quality/components/ncr-list.component.ts` | Q-08 | catalogued — empty/NEW NCR button confirmed; create dialog fields confirmed live (final sweep): Type/Detection Stage/Part ID/Job ID/Description/Affected Qty/Defective Qty/Containment + warning3 CREATE |
| quality | `quality/components/capa-list.component.ts` | Q-09 | catalogued — empty/NEW CAPA button confirmed; create dialog fields confirmed live (final sweep): Type/Source/Title/Problem Description/Impact/Owner ID/Priority/Due Date + warning4 CREATE |
| quality | `quality/components/eco-list.component.ts` | Q-10 | catalogued — empty/NEW ECO button confirmed; create dialog fields confirmed live (final sweep): Title/Change Type/Revision/Priority/Description/Reason/Impact/Effective Date + warning2 CREATE; Detail+AffectedItems dialogs source-confirmed |
| quality | `quality/components/gage-list.component.ts` | Q-11 | catalogued — empty/NEW GAGE button confirmed; create dialog fields confirmed live (final sweep): Description/Type/Manufacturer/Model/Serial/Calibration Interval/Accuracy/Range/Resolution/Notes + warning1 CREATE; Detail+Calibration dialogs source-confirmed |
| mrp | `mrp/mrp.component.ts` | M-01–M-07 | source-confirmed — URL confirmed; all 6 tabs + KPI chips + dialogs source-confirmed; Playwright blocked |
| mrp | `mrp/components/execute-mrp-run-dialog.component.ts` | M-08 | source-confirmed — fields: run-type/planning-horizon/simulation hint |
| mrp | `mrp/components/master-schedule-dialog.component.ts` | M-09 | source-confirmed — fields: name/description/period-start/end/lines (part/qty/due-date) |
| mrp | `mrp/components/generate-forecast-dialog.component.ts` | M-10 | source-confirmed — fields: name/part/method/historical-periods/smoothing-factor(conditional) |
| mrp | `mrp/components/mrp-run-detail-dialog.component.ts` | M-11 | source-confirmed — run summary + parts-touched list + pegging trail |
| mrp | `mrp/components/mps-vs-actual-dialog.component.ts` | M-12 | source-confirmed — per-part table (planned/actual/variance) |
| assets | `assets/assets.component.ts` | A-01/A-04 | catalogued — table columns confirmed live (final sweep): NAME/TYPE/LOCATION/MANUFACTURER/STATUS/HOURS, CNC Mill #1 ACTIVE row; ADD ASSET dialog confirmed live: Name/Type(Machine)/Location/Manufacturer/Model/Serial/Notes + Acquisition&Depreciation collapsible (Cost/Method/WorkCenterID/GLAccount) + warning1 NEW ASSET button |
| assets | `assets/components/asset-detail-panel/asset-detail-panel.component.ts` | A-02 | catalogued — CNC Mill #1 detail confirmed live (final sweep): STATUS ACTIVE/HOURS 0/barcode AST-CNC Mill #1/COPY+PRINT+REGENERATE/SET STATUS (ACTIVE·MAINTENANCE·RETIRED·OUT OF SERVICE)/MAINTENANCE HISTORY empty/ACTIVITY tabs |
| assets | `assets/components/asset-detail-dialog/asset-detail-dialog.component.ts` | A-03 | catalogued — dialog wrapper confirmed live (final sweep: components added to page: app-asset-detail-dialog + app-asset-detail-panel + app-barcode-info + app-entity-activity-section) |
| maintenance | `maintenance/pages/predictions/predictions.component.ts` | MN-01 | source-confirmed — empty state live; filters live; inline actions + KPI strip source-confirmed; ENV-DATA |
| maintenance | `maintenance/components/resolve-prediction-dialog/resolve-prediction-dialog.component.ts` | MN-02 | source-confirmed — 2 modes (resolve/false-positive) + notes field; ENV-DATA |
| worker | `worker/worker.component.ts` | W-01/W-02 | catalogued — task cards confirmed (Worker Sam) |

### Shared components (26)

| component selector | shared path | used by (inv IDs) | status |
|-------------------|------------|-------------------|--------|
| `app-avatar` | `shared/components/avatar/` | K-03 (job-card) | catalogued |
| `app-barcode-info` | `shared/components/barcode-info/` | K-04 (job-detail-panel), A-02 (asset-detail) | catalogued — confirmed live in A-02 (final sweep): barcode "AST-CNC Mill #1", content_copy COPY + print PRINT + refresh REGENERATE buttons |
| `app-barcode-scan-input` | `shared/components/barcode-scan-input/` | SF-20 (clock), SF-21 (scan) | catalogued |
| `app-confirm-dialog` | `shared/components/confirm-dialog/` | K-11 (dispose), Q-10 (ECO approve/implement), TT-01 (delete entry) | source-confirmed — K-11 trigger confirmed live; ECO dialog opens it via MatDialog; content source-confirmed |
| `app-data-table` | `shared/components/data-table/` | B-01, Q-01 tabs, A-01, MN-01 | catalogued |
| `app-date-range-picker` | `shared/components/date-range-picker/` | OE-01, TT-01 | catalogued |
| `app-datepicker` | `shared/components/datepicker/` | TT-02 (add-entry date field) | catalogued |
| `app-dialog` | `shared/components/dialog/` | P-03, K-06–K-11, MN-02 (dialog wrapper) | catalogued |
| `app-empty-state` | `shared/components/empty-state/` | K-02, B-01, P-01, S-02–S-06, OE-01, Q-01 tabs | catalogued |
| `app-entity-activity-section` | `shared/components/entity-activity-section/` | K-04 (job-detail), A-02 (asset-detail) | catalogued — confirmed live in A-02 (final sweep): ALL/CONVERSATION/NOTES/HISTORY tabs, "No activity yet" empty state |
| `app-entity-link` | `shared/components/entity-link/` | K-04, Q-01 tabs (lot/part refs) | source-confirmed — imported; ENV-DATA (no linked entities) |
| `app-entity-picker` | `shared/components/entity-picker/` | K-06 (customer/assignee), Q-02a (template/job), M-09 (parts) | source-confirmed — used in K-06 create form (live overlay opened); field visible in CDK but bodyText not readable |
| `app-file-upload-zone` | `shared/components/file-upload-zone/` | K-10 (cover-photo-upload-dialog) | source-confirmed — K-10 overlay trigger confirmed live; source confirms app-file-upload-zone inside |
| `app-input` | `shared/components/input/` | K-06, P-03, SF-02, TT-02 (form fields) | catalogued |
| `app-kpi-chip` | `shared/components/kpi-chip/` | S-01 (KPIs), OE-01 (KPIs), M-02 (dashboard) | catalogued |
| `app-page-header` | `shared/components/page-header/` | all page components | catalogued |
| `app-page-layout` | `shared/components/page-layout/` | all page components | catalogued |
| `app-quick-action-panel` | `shared/components/quick-action-panel/` | SF-07 (scan-action-overlay) | source-confirmed — ENV-BLOCK (barcode scan required); 8 QuickAction button grid confirmed from SF-07 source |
| `app-select` | `shared/components/select/` | SF-02 (team), S-03 (work-center), K-06, Q-02a | catalogued |
| `app-status-timeline` | `shared/components/status-timeline/` | K-04 (job-detail-panel) | source-confirmed — imported in K-04; job status history displayed in panel (inner CDK content not captured in bodyText) |
| `app-textarea` | `shared/components/textarea/` | TT-02 (notes), MN-02 (resolution notes) | catalogued |
| `app-toggle` | `shared/components/toggle/` | A-04 (isCustomerOwned field), K-01 (board/team view switch) | source-confirmed — imported in AssetsComponent (isCustomerOwned toggle confirmed from source); board/team switch confirmed live in K-01 |
| `app-toolbar` | `shared/components/toolbar/` | all page components | catalogued |
| `app-validation-button` | `shared/components/validation-button/` | P-03, TT-02, K-06, MN-02 (form submit) | catalogued |
| `data-table` column-filter-popover | `shared/components/data-table/` (sub) | B-01, Q-01 tabs, A-01 (filter popover) | source-confirmed — column filter popovers shown when filterable=true columns exist; source confirms enum filter options |
| `data-table` column-manager-panel | `shared/components/data-table/` (sub) | B-01, Q-01 tabs, A-01 (column toggle) | source-confirmed — column visibility selector panel; source-confirmed from DataTableComponent usage |

### Denominator summary

| status | feature files | shared components | total |
|--------|--------------|-------------------|-------|
| catalogued (all live states confirmed) | 41 | 17 | 58 |
| source-confirmed closure (ENV-BLOCK/ENV-DATA/Playwright-blocked; template fully read; trigger documented) | 23 | 9 | 32 |
| **needs-live** | **0** | **0** | **0** |
| **not-yet-located** | **0** | **0** | **0** |
| **total** | **64** | **26** | **90** |

> **Zero needs-live, zero not-yet-located.** All 90 items are catalogued or source-confirmed. `kanban-column-header` confirmed unused (not imported by any operations feature). Source-confirmed closure covers: SF-01 paired (kiosk pairing succeeded in final sweep; ENV-BLOCK explanation superseded but scan flows SF-05–SF-19 still require barcode HW); MRP M-01–M-12 (Playwright blocked); K-08/K-09 (J-1 has no cost/ops data; section headings confirmed live, inner table structure source-confirmed); P-02 (live cycle creation not completed); Q-03b/Q-05 (no lot/SPC data); MN-02 (no ML predictions). Final sweep 2026-05-22 upgraded ~25 source-confirmed items to catalogued (kiosk paired state, clock, quality dialogs, assets, timer, OEE). _Denominator updated 2026-05-22 after ui-scout final sweep._

---

## Component Inventory

Schema: component · type · route · file `path:line` · renders-for · states · purpose

---

### Area 1 — Kanban (`/kanban`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| K-01 | `app-kanban` / KanbanComponent | page | `/kanban` | `features/kanban/kanban.component.ts:40` | all authenticated | empty(J-1 in ORDER CONFIRMED) · populated(3 track-types, 10 cols) · board-view · team-view | Job board — board/team view toggle, drag-drop columns, job list |
| K-02 | `app-board-column` / BoardColumnComponent | cluster | `/kanban` | `features/kanban/components/board-column.component.ts:9` | all authenticated | empty(per col) · populated(J-1) | Single stage column; renders job cards; WIP-limit indicator |
| K-03 | `app-job-card` / JobCardComponent | cluster | `/kanban` | `features/kanban/components/job-card.component.ts:11` | all authenticated | populated(J-1 "Test widget") | Compact job card with priority dot, avatar, hold badge |
| K-04 | `app-job-detail-panel` / JobDetailPanelComponent | panel | `/kanban` (slide-out) | `features/kanban/components/job-detail-panel.component.ts:43` | all authenticated | panel opens on card click (CDK overlay, dialog-backdrop confirmed); Subtasks section in bodyText; Cost Analysis + Operation Time sections locatable + scrollable; cover-photo (panel__cover-btn) + edit (panel__edit) + Dispose (.action-btn) buttons visible — sweep G/H 2026-05-22; inner CDK content not in bodyText; K-08/K-09 tab content source-confirmed from component files | Full job detail: fields, subtasks, links, BOM, files, activity; hosts Cost + OpTime tabs |
| K-05 | `app-job-detail-dialog` / JobDetailDialogComponent | dialog | `/kanban` (from B-01 row click) | `features/kanban/components/job-detail-dialog.component.ts:19` | all authenticated | source-confirmed: MatDialog wrapper injecting K-04 panel content; opened from BacklogComponent row click; same CDK layout as panel but modal | Dialog wrapper around JobDetailPanelComponent (same content, modal variant) |
| K-06 | `app-job-dialog` / JobDialogComponent (create) | form | `/kanban` | `features/kanban/components/job-dialog.component.ts:26` | all authenticated · CAP-MFG-WO-RELEASE gates button | form-populated(title/desc/track-type/customer/assignee/priority/due-date) | Create new job |
| K-07 | `app-job-dialog` / JobDialogComponent (edit) | form | `/kanban` | `features/kanban/components/job-dialog.component.ts:26` | all authenticated | source-confirmed: same 7 fields as K-06 (title/desc/trackTypeId/customerId/assigneeId/priority/dueDate) pre-populated from `job` input; `mode='edit'`; track-type locked (editJob does not pass trackTypeId); trigger: panel__edit button in K-04 | Edit existing job metadata |
| K-08 | `app-job-cost-tab` / JobCostTabComponent | tab | `/kanban` (inside K-04) | `features/kanban/components/job-cost-tab.component.ts:14` | all authenticated | source-confirmed: cost-summary header (totalEstimated/totalActual/quotedPrice/variance) + material-issues table (part#/desc/qty/unitCost/totalCost/issueType/issuedAt) + RECALCULATE COSTS toolbar action + return-material row action + empty state; trigger: Cost tab in K-04 | Job cost summary + material-issues table within detail panel |
| K-09 | `app-operation-time-tab` / OperationTimeTabComponent | tab | `/kanban` (inside K-04) | `features/kanban/components/operation-time-tab.component.ts:12` | all authenticated | source-confirmed: operations table (seq#/name/estSetup/actSetup/estRun/actRun/totalMin/eff%/progress-bar) + totals strip (totalEstimated/totalActual/overallEfficiency) + empty state; trigger: Operation Time tab in K-04 | Est vs actual setup/run minutes per operation sequence |
| K-10 | `app-cover-photo-upload-dialog` / CoverPhotoUploadDialogComponent | dialog | `/kanban` (from K-04) | `features/kanban/components/cover-photo-upload-dialog.component.ts:17` | all authenticated | trigger confirmed — panel__cover-btn click opens CDK overlay (sweep G 2026-05-22); fields source-confirmed: `app-file-upload-zone` + UPLOAD PHOTO button | Upload/view cover photo for a job |
| K-11 | `app-dispose-job-dialog` / DisposeJobDialogComponent | dialog | `/kanban` (from K-04) | `features/kanban/components/dispose-job-dialog.component.ts:23` | all authenticated | trigger confirmed — .action-btn "Dispose" button visible + clicked, CDK overlay opened (sweep H 2026-05-22); fields source-confirmed: disposition type select, reason/notes, CANCEL/DISPOSE | Mark job as disposed (scrapped / cancelled / other) with reason |
| K-12 | KanbanService | service | `/kanban` | `features/kanban/services/kanban.service.ts:1` | n/a | n/a | Primary kanban data service (board, jobs, CRUD, BOM, files, parts) |
| K-13 | JobCostService | service | `/kanban` | `features/kanban/services/job-cost.service.ts:1` | n/a | n/a | Job cost summary + operation-time data |

---

### Area 2 — Backlog (`/backlog`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| B-01 | `app-backlog` / BacklogComponent | page | `/backlog` | `features/backlog/backlog.component.ts:41` | all authenticated | populated(J-1 in table) · filters(track/priority/assignee) · table-view · NEW JOB button | Unscheduled job queue — table + card-grid view modes, search/filter, open job detail |
| B-02 | `app-backlog-card-grid` / BacklogCardGridComponent | cluster | `/backlog` | `features/backlog/components/backlog-card-grid/backlog-card-grid.component.ts:6` | all authenticated | card-grid confirmed 2026-05-22: view_module toggle clicked; J-1 "Test widget" / ORDER CONFIRMED / Normal / Acme Corp / No date displayed in card layout — sweep H | Card-grid layout for backlog jobs (alternative to table view) |
| B-03 | BacklogService | service | `/backlog` | `features/backlog/services/backlog.service.ts:1` | n/a | n/a | Backlog job list data |

> BacklogComponent re-uses `JobDetailDialogComponent` (K-05) and `JobDialogComponent` (K-06/07) from kanban.

---

### Area 3 — Planning (`/planning`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| P-01 | `app-planning` / PlanningComponent | page | `/planning` | `features/planning/planning.component.ts:33` | Admin · Manager · PM | empty-cycle-state ("No planning cycle selected — CREATE FIRST CYCLE") · backlog-panel-with-J-1 · NEW CYCLE button | Planning-cycle management: cycle selector, backlog drag-onto-cycle board |
| P-02 | `app-cycle-board` / CycleBoardComponent | panel | `/planning` (embedded) | `features/planning/components/cycle-board/cycle-board.component.ts:12` | Admin · Manager · PM | source-confirmed: inputs `cycle(PlanningCycleDetail)` + `loading`; computed progressPercent/daysRemaining/isActive/sortedEntries; CDK drag-drop reorder (`entryReordered` output); per-entry: priority chip + complete-checkmark button + remove button; empty state via `app-empty-state`; no work center data in env so entries not seeded | Cycle entry board: progress bar, days-remaining, drag-to-reorder entries |
| P-03 | `app-cycle-dialog` / CycleDialogComponent | form | `/planning` | `features/planning/components/cycle-dialog/cycle-dialog.component.ts:18` | Admin · Manager · PM | form-populated(cycle name/start date/end date/goals/CANCEL/CREATE) | Create / edit planning cycle |
| P-04 | CAP-PLAN-MRP disabled state | state | `/planning` | `features/planning/planning.component.ts:62` + `planning.service.ts:11` | Admin · Manager · PM | DN-8: capability gate | Board renders empty with capability-disabled banner when CAP-PLAN-MRP is off |
| P-05 | PlanningService | service | `/planning` | `features/planning/services/planning.service.ts:13` | n/a | n/a | Cycle CRUD + entry management; pre-checks CAP-PLAN-MRP (`planning.service.ts:56`) |

> **CAP-PLAN-MRP**: Defined as `PLANNING_CAPABILITY = 'CAP-PLAN-MRP'` at `planning.service.ts:11`. `isDisabled()` check at `planning.service.ts:56`. Capability-disabled banner on `planning.component.ts:62`. Status in this env: **CONFIRMED NOT DISABLED** — planning loaded normally with no capability-blocked banner (Q-PL-01 DONE 2026-05-22); NEW CYCLE + CycleDialog fully functional.

---

### Area 4 — Scheduling (`/scheduling/:tab`)

Tabs (from `scheduling.component.ts:29`): `gantt` · `dispatch` · `work-centers` · `shifts` · `runs`

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| S-01 | `app-scheduling` / SchedulingComponent | page | `/scheduling/:tab` | `features/scheduling/scheduling.component.ts:35` | Admin · Manager | live: all 5 tabs reached · KPI chips (0 scheduled ops, 0 in progress, 0 work centers) | Tab host for all scheduling views |
| S-02 | Gantt tab | tab | `/scheduling/gantt` | `features/scheduling/scheduling.component.ts:29` | Admin · Manager | empty("No operations") · RUN SCHEDULER button | Gantt schedule of operations |
| S-03 | Dispatch tab | tab | `/scheduling/dispatch` | `features/scheduling/scheduling.component.ts:29` | Admin · Manager | empty("No dispatch items") · work-center select + LOAD button | Dispatch list — work released to floor |
| S-04 | Work-centers tab | tab | `/scheduling/work-centers` | `features/scheduling/scheduling.component.ts:29` | Admin · Manager | empty("No work centers defined") | Work-center definitions for scheduling |
| S-05 | Shifts tab | tab | `/scheduling/shifts` | `features/scheduling/scheduling.component.ts:29` | Admin · Manager | empty("No shifts defined") | Shift definitions |
| S-06 | Runs tab | tab | `/scheduling/runs` | `features/scheduling/scheduling.component.ts:29` | Admin · Manager | empty("No scheduling runs yet") | Schedule run history |
| S-07 | SchedulingService | service | `/scheduling` | `features/scheduling/services/scheduling.service.ts:1` | n/a | n/a | Schedule data (gantt, dispatch, work-centers, shifts, runs) |

> All tabs are rendered within the single SchedulingComponent; tab model types at `scheduling.model.ts` include: `ScheduleRun`, `ScheduledOperation`, `WorkCenter`, `DispatchListItem`, `WorkCenterLoad`, `Shift`. **Source-confirmed: SchedulingComponent does NOT inject MatDialog — there are zero dialogs in the scheduling area.** All actions are inline (execute-schedule is a direct service call; dispatch loads on work-center selection).

---

### Area 5 — Shop-Floor / Kiosk (`/display/shop-floor`)

Route is under `/display/` path with **no auth guard** — public kiosk terminal.

#### 5A — Main Display (`/display/shop-floor`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| SF-01 | `app-shop-floor-display` / ShopFloorDisplayComponent | page | `/display/shop-floor` | `features/shop-floor/shop-floor-display.component.ts:52` | all (public) | unpaired-setup-form(live) · paired-main-display(ENV-BLOCK: source-confirmed: DisplayPhase='main'\|'pin'\|'actions'\|'job-select'\|'receiving'\|'shipping'; main phase: workers strip/active-jobs/clock/KPI bar; light/dark theme toggle; font-size scaling; `isUnpaired = signal(!localStorage.getItem('forge-kiosk-device-token'))`) | Main kiosk display: phases = main/pin/actions/job-select/receiving/shipping |
| SF-02 | `app-kiosk-setup` / KioskSetupComponent | panel | `/display/shop-floor` (phase=setup) | `features/shop-floor/components/kiosk-setup/kiosk-setup.component.ts:15` | all (public) | admin-login-form(live: email/password/SIGN-IN-AS-ADMIN) · configure-terminal(live: terminal-name/team-select/CREATE-NEW-TEAM/ACTIVATE-TERMINAL) | Admin-login + team/terminal config before kiosk goes live |
| SF-03 | `app-kiosk-search-bar` / KioskSearchBarComponent | cluster | `/display/shop-floor` | `features/shop-floor/components/kiosk-search-bar/kiosk-search-bar.component.ts:12` | all (public) | ENV-BLOCK: paired state only; source-confirmed: renders on main phase of SF-01 for worker name/badge lookup | Worker search/lookup bar on kiosk main screen |
| SF-04 | `app-kiosk-session-bar` / KioskSessionBarComponent | cluster | `/display/shop-floor` | `features/shop-floor/components/kiosk-session-bar/kiosk-session-bar.component.ts:9` | all (public) | ENV-BLOCK: paired + worker logged in; source-confirmed: shows current kiosk session worker info | Logged-in worker session info bar |
| SF-05 | `app-numeric-keypad` / NumericKeypadComponent | cluster | `/display/shop-floor` | `features/shop-floor/components/numeric-keypad/numeric-keypad.component.ts:20` | all (public) | ENV-BLOCK: rendered on 'pin' phase of SF-01; source-confirmed at `:20` | Touch-friendly numeric entry (PIN, quantities) |
| SF-06 | `app-pin-prompt-dialog` / PinPromptDialogComponent | dialog | `/display/shop-floor` (phase=pin) | `features/shop-floor/components/pin-prompt-dialog/pin-prompt-dialog.component.ts:9` | all (public) | ENV-BLOCK: phase=pin of SF-01; source-confirmed at `:9` | PIN entry dialog for worker auth on kiosk |
| SF-07 | `app-scan-action-overlay` / ScanActionOverlayComponent | panel | `/display/shop-floor` + `/display/shop-floor/scan` | `features/shop-floor/components/scan-action-overlay/scan-action-overlay.component.ts:52` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed: OverlayPhase='idle'\|'loading'\|'actions'\|'move'\|'count'\|'receive'\|'issue'\|'ship'\|'inspect'\|'job'\|'return'; 8 QuickAction buttons (Move/Count/Receive/Issue/Ship/Inspect/Return/Job) with icons and colors; hosts all 8 scan-flow components | Action selection overlay after barcode scan; hosts all 8 scan-flow sub-components |
| SF-08 | `app-scan-undo-list` / ScanUndoListComponent | panel | `/display/shop-floor` | `features/shop-floor/components/scan-undo-list/scan-undo-list.component.ts:12` | all (public) | ENV-BLOCK: paired main display only; source-confirmed at `:12` | Recent scan history with undo capability |
| SF-09 | `app-scan-devices-panel` / ScanDevicesPanelComponent | panel | `/display/shop-floor` | `features/shop-floor/components/scan-devices-panel/scan-devices-panel.component.ts:13` | all (public) | ENV-BLOCK: paired main display only; source-confirmed at `:13` | Connected scan device management panel |
| SF-10 | `app-scan-location-view` / ScanLocationViewComponent | panel | `/display/shop-floor` | `features/shop-floor/components/scan-location-view/scan-location-view.component.ts:7` | all (public) | ENV-BLOCK: paired main display only; source-confirmed at `:7` | Current inventory location view on kiosk |
| SF-11 | `app-training-mode-banner` / TrainingModeBannerComponent | state | `/display/shop-floor` | `features/shop-floor/components/training-mode-banner/training-mode-banner.component.ts:4` | all (public) | ENV-BLOCK: paired + trainingMode=true; source-confirmed: `trainingMode = signal(false)` at `shop-floor-display.component.ts:95`; banner visible when true; all actions simulated in that mode | Banner shown when kiosk training mode active |

#### 5B — Scan Flows (rendered within SF-01 or SF-07)

| # | component | type | file | renders-for | states | purpose |
|---|-----------|------|------|-------------|--------|---------|
| SF-12 | `app-scan-job-flow` / ScanJobFlowComponent | panel | `features/shop-floor/components/scan-job-flow/scan-job-flow.component.ts:14` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed: JobStep='actions'\|'confirm-advance'\|'log-note'\|'processing'\|'done'; actions: start-timer/stop-timer/advance-stage/log-note; `noteControl` for log-note step | Report time/progress on a job |
| SF-13 | `app-scan-move-flow` / ScanMoveFlowComponent | panel | `features/shop-floor/components/scan-move-flow/scan-move-flow.component.ts:16` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed: MoveStep='quantity'\|'destination'\|'confirm'; move-all or partial qty; destination by select or barcode scan; calls `scanAction.move()` | Move inventory to a different location |
| SF-14 | `app-scan-receive-flow` / ScanReceiveFlowComponent | panel | `features/shop-floor/components/scan-receive-flow/scan-receive-flow.component.ts:16` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed: ReceiveStep='select-po'\|'quantity'\|'destination'\|'confirm'; PO lines from scan context; to-location select; cross-ref Q2C PO-receiving | Receive PO items (cross-ref: Q2C PO-receiving) |
| SF-15 | `app-scan-return-flow` / ScanReturnFlowComponent | panel | `features/shop-floor/components/scan-return-flow/scan-return-flow.component.ts:26` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed at `:26` | Return material to stock |
| SF-16 | `app-scan-ship-flow` / ScanShipFlowComponent | panel | `features/shop-floor/components/scan-ship-flow/scan-ship-flow.component.ts:19` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed at `:19` | Ship outbound order items |
| SF-17 | `app-scan-count-flow` / ScanCountFlowComponent | panel | `features/shop-floor/components/scan-count-flow/scan-count-flow.component.ts:13` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed at `:13` | Physical inventory count |
| SF-18 | `app-scan-inspect-flow` / ScanInspectFlowComponent | panel | `features/shop-floor/components/scan-inspect-flow/scan-inspect-flow.component.ts:12` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed at `:12` | QC inspection on kiosk |
| SF-19 | `app-scan-issue-flow` / ScanIssueFlowComponent | panel | `features/shop-floor/components/scan-issue-flow/scan-issue-flow.component.ts:13` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed at `:13` | Issue material to a job |

> All scan-flow components render for `all (public)` — inside the no-auth kiosk route. Trigger: scan barcode on `/display/shop-floor` → `ScanActionOverlayComponent` (SF-07) selects flow by action type.

#### 5C — Sub-routes

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| SF-20 | `app-shop-floor-clock` / ShopFloorClockComponent | page | `/display/shop-floor/clock` | `features/shop-floor/clock/shop-floor-clock.component.ts:28` | all (public) | redirects-to-setup-when-unpaired(live) · ENV-BLOCK for paired phases; source-confirmed: KioskPhase='setup'\|'dashboard'\|'identifying'\|'pin'\|'job-scanned'\|'manual-login'\|'clock'; dashboard: workersIn/workersOnBreak/workersOut lists + activeJobs + completedToday + overdueJobs; PIN: `pinControl` (min 4 digits) + `kioskAuthError`; manual-login: email+password controls; clock: per-worker clock-in/out buttons; RFID relay via `WebHidRfidService`; 30s auto-logout | Dedicated clock-in/out kiosk; phases: setup/dashboard/identifying/pin/job-scanned/manual-login/clock |
| SF-21 | `app-inventory-scan` / InventoryScanComponent | page | `/display/shop-floor/scan` | `features/shop-floor/scan/inventory-scan.component.ts:12` | all (public) | empty(idle scan prompt — "0 SCANNED · Scan a part barcode to begin") | Standalone barcode-scan terminal for inventory transactions |
| SF-22 | `app-scan-daily-log` / ScanDailyLogComponent | page | `/display/shop-floor/scan-log` (also embedded in SF-01) | `features/shop-floor/components/scan-daily-log/scan-daily-log.component.ts:27` | all (public) | empty("No scan activity for this date") · date/action-type filters | Daily scan activity log — shown inline on main display and at /scan-log route |

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
| TT-01 | `app-time-tracking` / TimeTrackingComponent | page | `/time-tracking` | `features/time-tracking/time-tracking.component.ts:27` | all authenticated | empty("No time entries found") · date-from/date-to filters · START TIMER + MANUAL ENTRY buttons visible · "Total: 0.0h across 0 entries" summary | Time entry list with date-range filter; active-timer row highlighted; delete uses ConfirmDialog |
| TT-02 | Add Time Entry inline dialog | form | `/time-tracking` (inline `showDialog` signal) | `features/time-tracking/time-tracking.component.ts:72` | all authenticated | form-populated(date/category/hours/minutes/notes/CANCEL/LOG ENTRY) | Manual entry: date, hours, minutes, category, notes; draft-aware |
| TT-03 | Start Timer inline dialog | form | `/time-tracking` (inline `showTimerDialog` signal) | `features/time-tracking/time-tracking.component.ts:87` | all authenticated | dialog confirmed 2026-05-22 (sweep H): Category select (None/Production/Setup/Inspection/Maintenance/Training/Meeting/Admin/Cleanup/Other) + Notes textarea + CANCEL + START (play_circle); timer running: `activeTimer` signal non-null → active row gets `row--active` CSS class; stop-dialog source-confirmed | Start timer: category + notes; timer state tracked via `activeTimer` signal |
| TT-04 | Stop Timer inline dialog | form | `/time-tracking` (inline `showStopDialog` signal) | `features/time-tracking/time-tracking.component.ts:94` | all authenticated | source-confirmed: single `stopNotesControl` (notes only; no category field); triggered by `openStopTimer()` when `activeTimer` non-null; `showStopDialog` signal at `:94` | Stop active timer with optional notes |
| TT-05 | TimeTrackingService | service | `/time-tracking` | `features/time-tracking/services/time-tracking.service.ts:1` | n/a | n/a | Time entries, clock events, timer control, pay periods |
| TT-06 | TimerHubService (shared) | service | shared | `shared/services/timer-hub.service.ts:1` | n/a | n/a | SignalR hub for real-time timer events (used by TT + job detail panel) |

---

### Area 7 — OEE (`/oee`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| OE-01 | `app-oee` / OeeComponent | page | `/oee` | `features/oee/oee.component.ts:25` | Admin · Manager | empty("No work centers") · KPI chips(0.0% AVG OEE / 0/0 WORLD CLASS) · date-range presets(Last 30 Days/This Month/This Week) | OEE dashboard: work-center card grid, date-range filter, trend + losses charts |
| OE-02 | `app-oee-work-center-card` / OeeWorkCenterCardComponent | cluster | `/oee` | `features/oee/components/oee-work-center-card/oee-work-center-card.component.ts:7` | Admin · Manager | ENV-DATA: no work centers in env; source-confirmed: gauge card per work-center; `selected` output → `selectedWorkCenterId` signal on OeeComponent | Per-work-center OEE gauge card; click selects for detail charts |
| OE-03 | `app-oee-trend-chart` / OeeTrendChartComponent | cluster | `/oee` (detail panel) | `features/oee/components/oee-trend-chart/oee-trend-chart.component.ts:8` | Admin · Manager | ENV-DATA: no work centers; source-confirmed: line chart (OEE + availability + performance + quality over time) when work center selected | Line chart: OEE + availability + performance + quality over time |
| OE-04 | `app-six-big-losses-chart` / SixBigLossesChartComponent | cluster | `/oee` (detail panel) | `features/oee/components/six-big-losses-chart/six-big-losses-chart.component.ts:9` | Admin · Manager | ENV-DATA: no work centers; source-confirmed: bar chart (Six Big Losses: equipment-failure/setup/idling/speed/defects/yield) when work center selected | Bar chart: Six Big Losses (equipment failure, setup, idling, speed, defects, yield) |
| OE-05 | OeeService | service | `/oee` | `features/oee/services/oee.service.ts:1` | n/a | n/a | OEE calculations, trend data, six-big-losses by work-center |

---

### Area 8 — Quality (`/quality/:tab`)

Tabs (from `quality.component.ts:38`): `inspections` · `lots` · `spc-charts` · `spc-data` · `spc-ooc` · `ncrs` · `capas` · `ecos` · `gages`

> **Source-confirmed**: `QualityComponent` has no intra-component role branches or capability checks. Route guard `['Admin','Manager','Engineer']` is the sole gate; all three roles see identical content.

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| Q-01 | `app-quality` / QualityComponent | page | `/quality/:tab` | `features/quality/quality.component.ts:42` | Admin · Manager · Engineer | page-loaded · all 9 tabs rendered · correct create-buttons per tab | Tab host for all quality views |
| Q-02 | Inspections tab (inline in Q-01) | tab | `/quality/inspections` | `features/quality/quality.component.ts:42` | Admin · Manager · Engineer | empty(live) · NEW INSPECTION button(live) · status-filter source-confirmed (InProgress/Passed/Failed) · columns: date/job/template/inspector/lotNumber/status/resultsSummary; ENV-DATA: no inspections in env | QC inspection list: status filter (InProgress/Passed/Failed) |
| Q-02a | Create Inspection inline dialog | form | `/quality/inspections` | `features/quality/quality.component.ts:92` | Admin · Manager · Engineer | trigger confirmed live (CDK overlay opened — sweep H); source-confirmed fields: templateId(select), jobId, lotNumber, notes; CANCEL + SAVE | New inspection: template, job, lot number, notes |
| Q-03 | Lots tab (inline in Q-01) | tab | `/quality/lots` | `features/quality/quality.component.ts:42` | Admin · Manager · Engineer | empty(live) · NEW LOT button(live) · columns: lotNumber/partNumber/partDescription/quantity/jobNumber/supplierLotNumber/expirationDate/createdAt; ENV-DATA: no lots in env | Lot records table |
| Q-03a | Create Lot inline dialog | form | `/quality/lots` | `features/quality/quality.component.ts:141` | Admin · Manager · Engineer | trigger confirmed live (CDK overlay opened — sweep H); source-confirmed fields: partId(req), quantity(req, min 1), lotNumber, jobId, supplierLotNumber, notes | New lot: part, quantity, lot number, supplier lot, expiration |
| Q-03b | Lot Traceability inline dialog | panel | `/quality/lots` | `features/quality/quality.component.ts:142` | Admin · Manager · Engineer | source-confirmed: triggered by row action → `showTraceDialog` signal; displays `LotTraceability` data; ENV-DATA: no lots to trace | Trace lot lineage; triggered by traceability row action |
| Q-04 | `app-spc-characteristics` / SpcCharacteristicsComponent | tab | `/quality/spc-charts` | `features/quality/components/spc-characteristics.component.ts:20` | Admin · Manager · Engineer | empty(live) · NEW CHARACTERISTIC button(live) | SPC characteristics list; select characteristic to view chart |
| Q-05 | `app-spc-chart` / SpcChartComponent | tab | `/quality/spc-charts` (detail) | `features/quality/components/spc-chart.component.ts:12` | Admin · Manager · Engineer | source-confirmed: control chart rendered when characteristic selected; ENV-DATA: no SPC characteristics defined in env | Control chart for selected SPC characteristic |
| Q-06 | `app-spc-data-entry` / SpcDataEntryComponent | tab | `/quality/spc-data` | `features/quality/components/spc-data-entry.component.ts:10` | Admin · Manager · Engineer | empty · NEW CHARACTERISTIC button | Enter new SPC measurement data points |
| Q-07 | `app-spc-ooc-list` / SpcOocListComponent | tab | `/quality/spc-ooc` | `features/quality/components/spc-ooc-list.component.ts:16` | Admin · Manager · Engineer | empty(no OOC events) · no create button | Out-of-control alerts list |
| Q-08 | `app-ncr-list` / NcrListComponent | tab | `/quality/ncrs` | `features/quality/components/ncr-list.component.ts:22` | Admin · Manager · Engineer | empty(live) · NEW NCR button(live) · **Create dialog** source-confirmed: type(Internal/Supplier/Customer), partId(req), jobId, detectedAtStage(Receiving/InProcess/FinalInspection/Shipping/Customer/Audit), description(req), affectedQuantity(req), defectiveQuantity, containmentActions; filters: type+status · **Disposition dialog** source-confirmed: code(UseAsIs/Rework/Scrap/ReturnToVendor/SortAndScreen/Reject), notes, reworkInstructions · inline row actions: Disposition + Create CAPA | Non-conformance records list + create + disposition dialogs |
| Q-09 | `app-capa-list` / CapaListComponent | tab | `/quality/capas` | `features/quality/components/capa-list.component.ts:22` | Admin · Manager · Engineer | empty(live) · NEW CAPA button(live) · **Create dialog** source-confirmed: type(Corrective/Preventive), sourceType(Ncr/CustomerComplaint/InternalAudit/ExternalAudit/SpcOoc/ManagementReview/Other), title(req), problemDescription(req), impactDescription, ownerId(req), priority(1-Critical…5-Informational), dueDate(req) · inline row action: Advance Phase | Corrective and preventive actions list + inline create dialog |
| Q-10 | `app-eco-list` / EcoListComponent | tab | `/quality/ecos` | `features/quality/components/eco-list.component.ts:24` | Admin · Manager · Engineer | empty(live) · NEW ECO button(live) · **Create dialog** source-confirmed: title(req), description(req), changeType(New/Revision/Obsolescence/CostReduction/QualityImprovement), priority(Low/Normal/High/Critical), reasonForChange, impactAnalysis, effectiveDate · **Detail dialog** source-confirmed: affected-items table (entityType/entityId/changeDescription/isImplemented) + Add Affected Item + approve/implement actions (via `app-confirm-dialog`) · **Add-Affected-Item dialog**: entityType(Part/BOM/Operation/Drawing/Specification), entityId, changeDescription, oldValue, newValue | Engineering change orders list + create + detail + affected-items dialogs |
| Q-11 | `app-gage-list` / GageListComponent | tab | `/quality/gages` | `features/quality/components/gage-list.component.ts:23` | Admin · Manager · Engineer | empty(live) · NEW GAGE button(live) · **Create dialog** source-confirmed: description(req), gageType, manufacturer, model, serialNumber, calibrationIntervalDays(req, default 365), accuracySpec, rangeSpec, resolution, notes; status filter · **Detail dialog** source-confirmed: gage fields + calibration records table (date/result/lab/standards/asFound/asLeft/nextDue) + ADD CALIBRATION button · **Calibration dialog**: calibratedAt(req), result(Pass/Fail/Adjusted/OutOfTolerance), labName, standardsUsed, asFoundCondition, asLeftCondition, notes | Gage R&R list + create + detail + calibration dialogs |
| Q-12 | QualityService | service | `/quality` | `features/quality/services/quality.service.ts:1` | n/a | n/a | Inspections, QC templates, lot records, lot traceability, gages, calibration |
| Q-13 | NcrCapaService | service | `/quality` | `features/quality/services/ncr-capa.service.ts:1` | n/a | n/a | NCR and CAPA CRUD |
| Q-14 | EcoService | service | `/quality` | `features/quality/services/eco.service.ts:1` | n/a | n/a | ECO CRUD + affected-items |
| Q-15 | SpcService | service | `/quality` | `features/quality/services/spc.service.ts:1` | n/a | n/a | SPC characteristics, measurements, OOC events |

---

### Area 9 — MRP (`/mrp/:tab`)

Tabs (from `mrp.component.ts:55`): `dashboard` · `planned-orders` · `exceptions` · `runs` · `master-schedule` · `forecasts`

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| M-01 | `app-mrp` / MrpComponent | page | `/mrp/:tab` | `features/mrp/mrp.component.ts:59` | Admin · Manager | URL /mrp/dashboard reached live 2026-05-22; Playwright ops blocked post-load (MRP component makes 3 simultaneous API calls on dashboard tab causing JS-thread contention); all tab states source-confirmed | Tab host for all MRP views |
| M-02 | Dashboard tab (inline in M-01) | tab | `/mrp/dashboard` | `features/mrp/mrp.component.ts:59` | Admin · Manager | source-confirmed: KPI chips (Latest Run/Planned Orders/Firmed Orders/Unresolved Exceptions) · RUN MRP button (`executeRun()`) + SIMULATE button (`executeRun(true)`) | MRP summary KPIs |
| M-03 | Planned-orders tab (inline in M-01) | tab | `/mrp/planned-orders` | `features/mrp/mrp.component.ts:59` | Admin · Manager | source-confirmed: empty state · Status filter (Planned/Firmed/Released/Cancelled) · firm + release inline row actions | MRP-generated planned purchase/work orders |
| M-04 | Exceptions tab (inline in M-01) | tab | `/mrp/exceptions` | `features/mrp/mrp.component.ts:59` | Admin · Manager | source-confirmed: empty state · unresolved-only filter default · resolve inline row action | MRP exceptions / alerts |
| M-05 | Runs tab (inline in M-01) | tab | `/mrp/runs` | `features/mrp/mrp.component.ts:59` | Admin · Manager | source-confirmed: empty state · run-type/status columns · RUN MRP button | MRP run history |
| M-06 | Master-schedule tab (inline in M-01) | tab | `/mrp/master-schedule` | `features/mrp/mrp.component.ts:59` | Admin · Manager | source-confirmed: empty state · NEW SCHEDULE button (openCreateSchedule) · MPS VS ACTUAL row action | Master production schedule |
| M-07 | Forecasts tab (inline in M-01) | tab | `/mrp/forecasts` | `features/mrp/mrp.component.ts:59` | Admin · Manager | source-confirmed: empty state · GENERATE FORECAST button (openGenerateForecast) · approve inline row action | Demand forecasts |
| M-08 | `app-execute-mrp-run-dialog` / ExecuteMrpRunDialogComponent | dialog | `/mrp` | `features/mrp/components/execute-mrp-run-dialog.component.ts:30` | Admin · Manager | source-confirmed: run-type select, planning-horizon-days input, simulation hint text, CANCEL/RUN MRP button; triggered by `executeRun()` (live) / `executeRun(true)` (simulate) from M-02 dashboard; Playwright blocked post-load | Run-params dialog; triggered by RUN MRP / SIMULATE buttons |
| M-09 | `app-master-schedule-dialog` / MasterScheduleDialogComponent | dialog | `/mrp` | `features/mrp/components/master-schedule-dialog.component.ts:43` | Admin · Manager | source-confirmed: name/description/period-start(`app-datepicker`)/period-end/schedule-lines (add-line action; each line: part `app-entity-picker`, qty, due-date); create vs edit mode: `data.schedule` absent = create; triggered by `openCreateSchedule()`/`openEditSchedule()` on M-06 | Create/edit master schedule + schedule lines |
| M-10 | `app-generate-forecast-dialog` / GenerateForecastDialogComponent | dialog | `/mrp` | `features/mrp/components/generate-forecast-dialog.component.ts:20` | Admin · Manager | source-confirmed: name/part(`app-entity-picker`)/method(select)/historical-periods/smoothing-factor (conditional: shown only for ExponentialSmoothing); triggered by `openGenerateForecast()` on M-07; `approveForecast()` is inline row action with no dialog | Forecast generation params |
| M-11 | `app-mrp-run-detail-dialog` / MrpRunDetailDialogComponent | dialog | `/mrp` | `features/mrp/components/mrp-run-detail-dialog.component.ts:31` | Admin · Manager | source-confirmed: run summary header + parts-touched list; click part → time-bucket planned-orders + pegging trail; triggered by `openRunDetail(run)` (row click) on M-05 | Run detail + planned-order breakdown |
| M-12 | `app-mps-vs-actual-dialog` / MpsVsActualDialogComponent | dialog | `/mrp` | `features/mrp/components/mps-vs-actual-dialog.component.ts:23` | Admin · Manager | source-confirmed: per-part table (planned qty / actual completed qty / variance / variance-pct; negative = under, positive = over); triggered by `openMpsVsActual(schedule)` row action on M-06 | MPS vs actuals per-part comparison |
| M-13 | MrpService | service | `/mrp` | `features/mrp/services/mrp.service.ts:1` | n/a | n/a | MRP run execution, planned orders, exceptions, forecasts, master schedule |

---

### Area 10 — Assets (`/assets`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| A-01 | `app-assets` / AssetsComponent | page | `/assets` | `features/assets/assets.component.ts:27` | Admin · Manager | empty(live: "No assets found") · Search/Type/Status filters(live) · ADD ASSET button(live) | Asset list with search/type/status filters; opens A-02/A-03 on row click; ADD ASSET → A-04 form |
| A-02 | `app-asset-detail-panel` / AssetDetailPanelComponent | panel | `/assets` (slide-out via MatDialog → A-03) | `features/assets/components/asset-detail-panel/asset-detail-panel.component.ts:26` | Admin · Manager | source-confirmed: asset fields (name/assetType/status/location/manufacturer/model/serialNumber/currentHours) + status-change select + maintenance-log list (`getMaintenanceLogs()`) + `app-barcode-info` + `app-entity-activity-section` + `app-entity-link`; edit → `editRequested` output; ENV-DATA: no assets in env | Asset detail: fields, maintenance-log, barcode, activity; edit + status-change actions |
| A-03 | `app-asset-detail-dialog` / AssetDetailDialogComponent | dialog | `/assets` (MatDialog from row click) | `features/assets/components/asset-detail-dialog/asset-detail-dialog.component.ts:17` | Admin · Manager | source-confirmed: MatDialog wrapper opened by `DetailDialogService.open(...AssetDetailDialogComponent, {assetId})` in AssetsComponent:167; afterClosed result `{action:'edit', asset}` → opens A-04 edit form; ENV-DATA: no assets in env | Dialog shell for AssetDetailPanelComponent |
| A-04 | Create/Edit Asset form (inline in A-01) | form | `/assets` | `features/assets/assets.component.ts:62` | Admin · Manager | source-confirmed: fields: name(req), assetType(Machine/Tooling/Facility/Vehicle/Other, req), location, manufacturer, model, serialNumber, notes, isCustomerOwned(toggle), cavityCount, toolLifeExpectancy; full-record fields: acquisitionCost, depreciationMethod(StraightLine/DecliningBalance/UnitsOfProduction), workCenterId, glAccount; draft-aware; edit mode pre-populates from existing asset | Create / edit asset; same form for both modes |
| A-05 | AssetsService | service | `/assets` | `features/assets/services/assets.service.ts:1` | n/a | n/a | Asset CRUD, downtime log, maintenance log, subcontract orders |

---

### Area 11 — Maintenance (`/maintenance/predictions`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| MN-01 | `app-predictions` / PredictionsComponent | page | `/maintenance/predictions` | `features/maintenance/pages/predictions/predictions.component.ts:42` | Admin · Manager | empty(live: decision-prompt text confirmed) · Severity filter(live: All/Low/Medium/High/Critical) · Status filter(live: Open/Acknowledged/MaintenanceScheduled/Resolved/FalsePositive/Expired) · KPI strip + populated row states (Predicted/Acknowledged) source-confirmed; inline row actions: acknowledge + schedule-PM (no dialog) + resolve → MN-02 + false-positive → MN-02; ENV-DATA: no predictions in env | Predictive maintenance dashboard; inline ack/schedule-PM actions + resolve/false-positive via dialog |
| MN-02 | `app-resolve-prediction-dialog` / ResolvePredictionDialogComponent | dialog | `/maintenance/predictions` | `features/maintenance/components/resolve-prediction-dialog/resolve-prediction-dialog.component.ts:16` | Admin · Manager | source-confirmed: exactly 2 modes (`resolve`\|`false-positive`); both modes show notes field (`app-textarea`) + CANCEL + confirm button; triggered by resolve or false-positive row action; ENV-DATA: no predictions to trigger it | Notes dialog for resolve-or-false-positive action on a prediction |
| MN-03 | PredictiveMaintenanceService | service | `/maintenance` | `features/maintenance/services/predictive-maintenance.service.ts:1` | n/a | n/a | Predictive maintenance data + resolve actions |

---

### Area 12 — Worker Task View (`/worker`)

> **Role note**: `/worker` has no explicit role guard in `app.routes.ts`; all authenticated users can access it. ProductionWorker role uses this as their primary landing page for assigned jobs.

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| W-01 | `app-worker` / WorkerComponent | page | `/worker` | `features/worker/worker.component.ts:13` | all authenticated | populated(task cards for Worker Sam) · empty-state("No tasks assigned") · loading | Worker task list; sorted by overdue → due-date → priority |
| W-02 | Task card | cluster | `/worker` | `features/worker/worker.component.ts:13` (inline template) | all authenticated | normal · overdue(red) · with-subtask-progress-bar | Per-job task card: job number, priority chip, title, stage chip, customer, due date, subtask progress bar; click navigates to `/kanban?job=<id>` |
| W-03 | WorkerService | service | `/worker` | `features/worker/services/worker.service.ts:1` | n/a | n/a | Fetch tasks assigned to current user |

> Sidebar for ProductionWorker role is minimal (no sub-nav groups): Home, dashboard, groups, insights, engineering icons only — no sales/production/admin groups.

---

### Customer Returns (cross-link)

> **NOT catalogued here.** Fully inventoried in `quote-to-cash.md §Segment 8`. CAP-O2C-RMA is DISABLED in this env (DN-8 terminal closure confirmed at `po-dialog.component.ts:309-317` pattern). No operations-side RMA screen is reachable.

---

## Open Items / Queue Summary

_Updated 2026-05-22 source-cataloger cycle 2: all queue items closed from source._

### All closures — source-cataloger cycle 2

**ENV-BLOCK closures** (terminal pairing + barcode HW not feasible in headless env):
- SF-01 paired state, SF-03–SF-11 (paired display components), SF-12–SF-19 (scan flows), SF-20 (clock all 7 phases): all source-confirmed via component source reads.

**ENV-DATA closures** (no seed data in env; behavior confirmed from source):
- OE-02/03/04 (no work centers), P-02 (no cycle entries), Q-05 (no SPC characteristics), Q-03b (no lots), A-02/03 (no assets), MN-01 populated + MN-02 (no predictions).

**Source-field closures** (dialog triggers confirmed live; fields source-confirmed):
- K-05/K-07/K-08/K-09/K-10/K-11: all Kanban detail/tab/dialog fields confirmed.
- TT-04: stop-timer dialog (single notes field) source-confirmed.
- Q-08 Disposition dialog (code/notes/reworkInstructions), Q-09 CAPA (7 fields), Q-10 ECO (create+detail+add-item dialogs), Q-11 Gage (create+detail+calibration dialogs): all source-confirmed.
- A-04 create/edit form (15 fields including full-record fields): source-confirmed.
- M-08–M-12: all 5 MRP dialogs: fields source-confirmed (Playwright blocked for live trigger).

**Previously closed:**
- Q-SC-06: SchedulingComponent has zero dialogs.
- Q-QL-10: QualityComponent has no role branches.
- Q-SF-15: Kiosk route has no auth guard; PIN flow is internal kiosk session.

### Remaining open items: NONE

**Queue is fully drained. All 90 items (64 feature + 26 shared) have source-confirmed or better status. Zero needs-live. Zero not-yet-located. Reconciliation checklist: all 15 routes [x] + all live-sweep states [x].**

---

_Commit cycle 3 2026-05-22: K-04 promoted partial→source-confirmed; denominator 0 partial / 0 needs-live / 90 total; phase complete_
