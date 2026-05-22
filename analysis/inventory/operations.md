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
- [x] `/kanban` — live swept 2026-05-22
- [x] `/backlog` — live swept 2026-05-22
- [x] `/planning` — live swept 2026-05-22
- [x] `/scheduling/:tab` (gantt · dispatch · work-centers · shifts · runs) — live swept 2026-05-22
- [x] `/display/shop-floor` (main display) — unpaired state observed; QUEUE OPS-Q-001 for paired
- [x] `/display/shop-floor/clock` — redirected to setup; QUEUE OPS-Q-002 for paired
- [x] `/display/shop-floor/scan` — idle-scan state observed 2026-05-22
- [x] `/display/shop-floor/scan-log` — empty state observed 2026-05-22
- [x] `/worker` — live swept (worker@ role) 2026-05-22
- [x] `/time-tracking` — live swept 2026-05-22; manual-entry dialog confirmed
- [x] `/oee` — empty state (no work centers) swept 2026-05-22
- [x] `/quality/:tab` (inspections · lots · spc-charts · spc-data · spc-ooc · ncrs · capas · ecos · gages) — all 9 tabs reached 2026-05-22
- [x] `/mrp/:tab` (dashboard · planned-orders · exceptions · runs · master-schedule · forecasts) — sweep D in progress (partial)
- [x] `/assets` — sweep D in progress (partial)
- [x] `/maintenance/predictions` — sweep D in progress (partial)

### Live sweep states (ticked = observed live by ui-scout)

**ui-scout sweeps A/B/D run 2026-05-22. Sweep C (OEE confirmed empty, quality had slow load fixed in sweep D).**

- [x] Kanban: empty board (J-1 in ORDER CONFIRMED), populated board, board/team view toggle — **10 cols, 3 track types (PRODUCTION/R&D-TOOLING/MAINTENANCE)**
- [x] Kanban: JobDialog create — form fields confirmed (title, desc, track-type, customer, assignee, priority, due-date)
- [ ] Kanban: JobDetailPanel — all sections (Details / Cost / OpTime / subtasks / parts / links / files / time / activity) — **QUEUE OPS-Q-004**
- [ ] Kanban: JobDialog edit, CoverPhotoUploadDialog, DisposeJobDialog — **QUEUE OPS-Q-004**
- [x] Backlog: populated table (J-1 visible), table view mode, filters (Track/Priority/Assignee), NEW JOB button visible
- [ ] Backlog: card-grid view mode toggle — **QUEUE OPS-Q-015**
- [x] Planning: empty-cycle state ("No planning cycle selected / CREATE FIRST CYCLE"), NEW CYCLE button, backlog panel showing J-1, CycleDialog create (fields: name, start, end, goals)
- [ ] Planning: CycleBoard populated (drag entry) — **QUEUE OPS-Q-013**
- [x] Scheduling: all 5 tabs reached — gantt/dispatch/work-centers/shifts/runs — all empty states confirmed, KPI chips (0/0/0), RUN SCHEDULER button visible on gantt
- [x] Shop-floor: KioskSetup admin-login form (email/password), configure-terminal form (terminal name, team select, CREATE NEW TEAM, ACTIVATE TERMINAL) — unpaired state
- [x] Shop-floor: /scan route — InventoryScan "Inventory Scan Mode" idle prompt (0 scanned, SCAN PART BARCODE)
- [x] Shop-floor: /scan-log route — ScanDailyLog with date/action-type filters, empty state
- [ ] Shop-floor: /clock route (paired) — ShopFloorClockComponent; redirected to setup when unpaired — **QUEUE OPS-Q-002**
- [ ] Shop-floor: main display live/paired state, KPI stats bar, scan flows — **QUEUE OPS-Q-001, Q-003**
- [x] Time-tracking: empty table, date-range filters, START TIMER button, MANUAL ENTRY button, add-entry dialog (date/category/hours/minutes/notes/LOG ENTRY)
- [ ] Time-tracking: timer running state, stop-timer dialog — **QUEUE OPS-Q-017**
- [x] OEE: empty state confirmed (no work centers); KPI chips (0.0% AVG OEE, 0/0 WORLD CLASS); date-range presets (Last 30 Days / This Month / This Week)
- [ ] OEE: work-center cards, trend chart, six-big-losses chart — **QUEUE OPS-Q-010**
- [x] Quality: all 9 tabs reached and confirmed; create buttons confirmed per tab (NEW INSPECTION / NEW LOT / NEW CHARACTERISTIC / NEW NCR / NEW CAPA / NEW ECO / NEW GAGE; spc-ooc has no create)
- [ ] Quality: inspection detail/run, lot traceability, SPC chart/data populated, NCR/CAPA/ECO/Gage create dialogs — **QUEUE OPS-Q-006–Q-008**
- [ ] MRP: all 6 tabs + 5 dialogs — sweep D started MRP but results pending — **QUEUE OPS-Q-009**
- [ ] Assets: list, create-dialog, detail-panel — **QUEUE OPS-Q-011**
- [ ] Maintenance: predictions list, resolve-prediction dialog — **QUEUE OPS-Q-012**

---

## Reconciliation Denominator

_Source tree glob 2026-05-22 — authoritative file count from `forge-ui/src/app/features/` (operations areas only). **64 feature component files** across 12 areas + **27 shared component files** imported by those features = **91 checklist items total**._

_Status: **catalogued** = source line confirmed + live states observed; **needs-live** = source confirmed, live sweep not yet reached; **not-yet-located** = source gap (none found — zero gaps)._

### Feature components (64 files)

| area | component file (relative to `features/`) | inv ID | status |
|------|------------------------------------------|--------|--------|
| kanban | `kanban/kanban.component.ts` | K-01 | catalogued — empty + populated + board/team views confirmed |
| kanban | `kanban/components/board-column.component.ts` | K-02 | catalogued — seen in populated board |
| kanban | `kanban/components/job-card.component.ts` | K-03 | catalogued — J-1 card confirmed |
| kanban | `kanban/components/job-detail-panel.component.ts` | K-04 | needs-live |
| kanban | `kanban/components/job-detail-dialog.component.ts` | K-05 | needs-live |
| kanban | `kanban/components/job-dialog.component.ts` | K-06/K-07 | partial — create form confirmed; edit mode needs-live |
| kanban | `kanban/components/job-cost-tab.component.ts` | K-08 | needs-live |
| kanban | `kanban/components/operation-time-tab.component.ts` | K-09 | needs-live |
| kanban | `kanban/components/cover-photo-upload-dialog.component.ts` | K-10 | needs-live |
| kanban | `kanban/components/dispose-job-dialog.component.ts` | K-11 | needs-live |
| backlog | `backlog/backlog.component.ts` | B-01 | catalogued — table + J-1 + filters confirmed |
| backlog | `backlog/components/backlog-card-grid/backlog-card-grid.component.ts` | B-02 | needs-live |
| planning | `planning/planning.component.ts` | P-01 | catalogued — empty-cycle state + NEW CYCLE confirmed |
| planning | `planning/components/cycle-board/cycle-board.component.ts` | P-02 | needs-live |
| planning | `planning/components/cycle-dialog/cycle-dialog.component.ts` | P-03 | catalogued — create form fields confirmed |
| scheduling | `scheduling/scheduling.component.ts` | S-01 | catalogued — all 5 tab empty states + KPIs confirmed |
| shop-floor | `shop-floor/shop-floor-display.component.ts` | SF-01 | partial — setup phases confirmed; paired main-display needs-live |
| shop-floor | `shop-floor/components/kiosk-setup/kiosk-setup.component.ts` | SF-02 | catalogued — admin-login + configure-terminal phases confirmed |
| shop-floor | `shop-floor/components/kiosk-search-bar/kiosk-search-bar.component.ts` | SF-03 | needs-live |
| shop-floor | `shop-floor/components/kiosk-session-bar/kiosk-session-bar.component.ts` | SF-04 | needs-live |
| shop-floor | `shop-floor/components/numeric-keypad/numeric-keypad.component.ts` | SF-05 | needs-live |
| shop-floor | `shop-floor/components/pin-prompt-dialog/pin-prompt-dialog.component.ts` | SF-06 | needs-live |
| shop-floor | `shop-floor/components/scan-action-overlay/scan-action-overlay.component.ts` | SF-07 | needs-live |
| shop-floor | `shop-floor/components/scan-undo-list/scan-undo-list.component.ts` | SF-08 | needs-live |
| shop-floor | `shop-floor/components/scan-devices-panel/scan-devices-panel.component.ts` | SF-09 | needs-live |
| shop-floor | `shop-floor/components/scan-location-view/scan-location-view.component.ts` | SF-10 | needs-live |
| shop-floor | `shop-floor/components/training-mode-banner/training-mode-banner.component.ts` | SF-11 | needs-live |
| shop-floor | `shop-floor/components/scan-job-flow/scan-job-flow.component.ts` | SF-12 | needs-live |
| shop-floor | `shop-floor/components/scan-move-flow/scan-move-flow.component.ts` | SF-13 | needs-live |
| shop-floor | `shop-floor/components/scan-receive-flow/scan-receive-flow.component.ts` | SF-14 | needs-live |
| shop-floor | `shop-floor/components/scan-return-flow/scan-return-flow.component.ts` | SF-15 | needs-live |
| shop-floor | `shop-floor/components/scan-ship-flow/scan-ship-flow.component.ts` | SF-16 | needs-live |
| shop-floor | `shop-floor/components/scan-count-flow/scan-count-flow.component.ts` | SF-17 | needs-live |
| shop-floor | `shop-floor/components/scan-inspect-flow/scan-inspect-flow.component.ts` | SF-18 | needs-live |
| shop-floor | `shop-floor/components/scan-issue-flow/scan-issue-flow.component.ts` | SF-19 | needs-live |
| shop-floor | `shop-floor/clock/shop-floor-clock.component.ts` | SF-20 | needs-live |
| shop-floor | `shop-floor/scan/inventory-scan.component.ts` | SF-21 | catalogued — idle-scan state confirmed |
| shop-floor | `shop-floor/components/scan-daily-log/scan-daily-log.component.ts` | SF-22 | catalogued — empty state + filters confirmed |
| time-tracking | `time-tracking/time-tracking.component.ts` | TT-01–TT-04 | partial — empty page + add-entry dialog confirmed; timer start/stop (TT-03/04) needs-live |
| oee | `oee/oee.component.ts` | OE-01 | catalogued — empty state + KPI chips + date presets confirmed |
| oee | `oee/components/oee-work-center-card/oee-work-center-card.component.ts` | OE-02 | needs-live |
| oee | `oee/components/oee-trend-chart/oee-trend-chart.component.ts` | OE-03 | needs-live |
| oee | `oee/components/six-big-losses-chart/six-big-losses-chart.component.ts` | OE-04 | needs-live |
| quality | `quality/quality.component.ts` | Q-01–Q-03 | partial — all 9 tabs + create buttons confirmed; inline dialogs Q-02a/Q-03a/Q-03b needs-live |
| quality | `quality/components/spc-characteristics.component.ts` | Q-04 | catalogued — empty state + NEW CHARACTERISTIC button |
| quality | `quality/components/spc-chart.component.ts` | Q-05 | needs-live |
| quality | `quality/components/spc-data-entry.component.ts` | Q-06 | catalogued — empty state + NEW CHARACTERISTIC button |
| quality | `quality/components/spc-ooc-list.component.ts` | Q-07 | catalogued — empty state (no create button) |
| quality | `quality/components/ncr-list.component.ts` | Q-08 | partial — empty + NEW NCR button confirmed; create/edit dialog needs-live |
| quality | `quality/components/capa-list.component.ts` | Q-09 | partial — empty + NEW CAPA button confirmed; create/edit dialog needs-live |
| quality | `quality/components/eco-list.component.ts` | Q-10 | partial — empty + NEW ECO button confirmed; create/edit + affected-items needs-live |
| quality | `quality/components/gage-list.component.ts` | Q-11 | partial — empty + NEW GAGE button confirmed; create/edit + calibration needs-live |
| mrp | `mrp/mrp.component.ts` | M-01–M-07 | needs-live |
| mrp | `mrp/components/execute-mrp-run-dialog.component.ts` | M-08 | needs-live |
| mrp | `mrp/components/master-schedule-dialog.component.ts` | M-09 | needs-live |
| mrp | `mrp/components/generate-forecast-dialog.component.ts` | M-10 | needs-live |
| mrp | `mrp/components/mrp-run-detail-dialog.component.ts` | M-11 | needs-live |
| mrp | `mrp/components/mps-vs-actual-dialog.component.ts` | M-12 | needs-live |
| assets | `assets/assets.component.ts` | A-01/A-04 | needs-live |
| assets | `assets/components/asset-detail-panel/asset-detail-panel.component.ts` | A-02 | needs-live |
| assets | `assets/components/asset-detail-dialog/asset-detail-dialog.component.ts` | A-03 | needs-live |
| maintenance | `maintenance/pages/predictions/predictions.component.ts` | MN-01 | needs-live |
| maintenance | `maintenance/components/resolve-prediction-dialog/resolve-prediction-dialog.component.ts` | MN-02 | needs-live |
| worker | `worker/worker.component.ts` | W-01/W-02 | catalogued — task cards confirmed (Worker Sam) |

### Shared components (27)

| component selector | shared path | used by (inv IDs) | status |
|-------------------|------------|-------------------|--------|
| `app-avatar` | `shared/components/avatar/` | K-03 (job-card) | catalogued |
| `app-barcode-info` | `shared/components/barcode-info/` | K-04 (job-detail-panel) | needs-live |
| `app-barcode-scan-input` | `shared/components/barcode-scan-input/` | SF-20 (clock), SF-21 (scan) | catalogued |
| `app-confirm-dialog` | `shared/components/confirm-dialog/` | TT-01 (delete entry), K-04 (dispose?) | needs-live |
| `app-data-table` | `shared/components/data-table/` | B-01, Q-01 tabs, A-01, MN-01 | catalogued |
| `app-date-range-picker` | `shared/components/date-range-picker/` | OE-01, TT-01 | catalogued |
| `app-datepicker` | `shared/components/datepicker/` | TT-02 (add-entry date field) | catalogued |
| `app-dialog` | `shared/components/dialog/` | P-03, K-06–K-11, MN-02 (dialog wrapper) | catalogued |
| `app-empty-state` | `shared/components/empty-state/` | K-02, B-01, P-01, S-02–S-06, OE-01, Q-01 tabs | catalogued |
| `app-entity-activity-section` | `shared/components/entity-activity-section/` | K-04 (job-detail), A-02 (asset-detail) | needs-live |
| `app-entity-link` | `shared/components/entity-link/` | K-04, Q-01 tabs (lot/part refs) | needs-live |
| `app-entity-picker` | `shared/components/entity-picker/` | K-06 (customer/assignee), Q-02a, A-04 | needs-live |
| `app-file-upload-zone` | `shared/components/file-upload-zone/` | K-10 (cover-photo-upload-dialog) | needs-live |
| `app-input` | `shared/components/input/` | K-06, P-03, SF-02, TT-02 (form fields) | catalogued |
| `app-kanban-column-header` | `shared/components/kanban-column-header/` | K-02 (board-column header) | catalogued |
| `app-kpi-chip` | `shared/components/kpi-chip/` | S-01 (KPIs), OE-01 (KPIs), M-02 (dashboard) | catalogued |
| `app-page-header` | `shared/components/page-header/` | all page components | catalogued |
| `app-page-layout` | `shared/components/page-layout/` | all page components | catalogued |
| `app-quick-action-panel` | `shared/components/quick-action-panel/` | K-04 (job actions), A-02 (asset actions) | needs-live |
| `app-select` | `shared/components/select/` | SF-02 (team), S-03 (work-center), K-06, Q-02a | catalogued |
| `app-status-timeline` | `shared/components/status-timeline/` | K-04 (job-detail-panel) | needs-live |
| `app-textarea` | `shared/components/textarea/` | TT-02 (notes), MN-02 (resolution notes) | catalogued |
| `app-toggle` | `shared/components/toggle/` | inline forms (not yet observed in live sweep) | needs-live |
| `app-toolbar` | `shared/components/toolbar/` | all page components | catalogued |
| `app-validation-button` | `shared/components/validation-button/` | P-03, TT-02, K-06, MN-02 (form submit) | catalogued |
| `data-table` column-filter-popover | `shared/components/data-table/` (sub) | B-01, Q-01 tabs, A-01 (filter popover) | needs-live |
| `data-table` column-manager-panel | `shared/components/data-table/` (sub) | B-01, Q-01 tabs, A-01 (column toggle) | needs-live |

### Denominator summary

| status | feature files | shared components | total |
|--------|--------------|-------------------|-------|
| catalogued (all states confirmed) | 13 | 16 | 29 |
| partial (reached; some states queued) | 7 | 0 | 7 |
| needs-live (not yet reached) | 44 | 11 | 55 |
| **not-yet-located** | **0** | **0** | **0** |
| **total** | **64** | **27** | **91** |

> **Zero not-yet-located.** Every component file in the source tree maps to an inventory entry. Remaining work: 55 items across 44 feature files + 11 shared components awaiting live-sweep confirmation.

---

## Component Inventory

Schema: component · type · route · file `path:line` · renders-for · states · purpose

---

### Area 1 — Kanban (`/kanban`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| K-01 | `app-kanban` / KanbanComponent | page | `/kanban` | `features/kanban/kanban.component.ts:42` | all authenticated | empty(J-1 in ORDER CONFIRMED) · populated(3 track-types, 10 cols) · board-view · team-view | Job board — board/team view toggle, drag-drop columns, job list |
| K-02 | `app-board-column` / BoardColumnComponent | cluster | `/kanban` | `features/kanban/components/board-column.component.ts:9` | all authenticated | empty(per col) · populated(J-1) | Single stage column; renders job cards; WIP-limit indicator |
| K-03 | `app-job-card` / JobCardComponent | cluster | `/kanban` | `features/kanban/components/job-card.component.ts:12` | all authenticated | populated(J-1 "Test widget") | Compact job card with priority dot, avatar, hold badge |
| K-04 | `app-job-detail-panel` / JobDetailPanelComponent | panel | `/kanban` (slide-out) | `features/kanban/components/job-detail-panel.component.ts:43` | all authenticated | **unreached — QUEUE OPS-Q-004** | Full job detail: fields, subtasks, links, BOM, files, activity; hosts Cost + OpTime tabs |
| K-05 | `app-job-detail-dialog` / JobDetailDialogComponent | dialog | `/kanban` | `features/kanban/components/job-detail-dialog.component.ts:20` | all authenticated | **unreached — QUEUE OPS-Q-004** | Dialog wrapper around JobDetailPanelComponent (same content, modal variant) |
| K-06 | `app-job-dialog` / JobDialogComponent (create) | form | `/kanban` | `features/kanban/components/job-dialog.component.ts:27` | all authenticated · CAP-MFG-WO-RELEASE gates button | form-populated(title/desc/track-type/customer/assignee/priority/due-date) | Create new job |
| K-07 | `app-job-dialog` / JobDialogComponent (edit) | form | `/kanban` | `features/kanban/components/job-dialog.component.ts:27` | all authenticated | **unreached** — queue OPS-Q-004 | Edit existing job metadata |
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
| B-01 | `app-backlog` / BacklogComponent | page | `/backlog` | `features/backlog/backlog.component.ts:1` | all authenticated | populated(J-1 in table) · filters(track/priority/assignee) · table-view · NEW JOB button | Unscheduled job queue — table + card-grid view modes, search/filter, open job detail |
| B-02 | `app-backlog-card-grid` / BacklogCardGridComponent | cluster | `/backlog` | `features/backlog/components/backlog-card-grid/backlog-card-grid.component.ts:7` | all authenticated | **unreached — QUEUE OPS-Q-015** | Card-grid layout for backlog jobs (alternative to table view) |
| B-03 | BacklogService | service | `/backlog` | `features/backlog/services/backlog.service.ts:1` | n/a | n/a | Backlog job list data |

> BacklogComponent re-uses `JobDetailDialogComponent` (K-05) and `JobDialogComponent` (K-06/07) from kanban.

---

### Area 3 — Planning (`/planning`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| P-01 | `app-planning` / PlanningComponent | page | `/planning` | `features/planning/planning.component.ts:32` | Admin · Manager · PM | empty-cycle-state ("No planning cycle selected — CREATE FIRST CYCLE") · backlog-panel-with-J-1 · NEW CYCLE button | Planning-cycle management: cycle selector, backlog drag-onto-cycle board |
| P-02 | `app-cycle-board` / CycleBoardComponent | panel | `/planning` (embedded) | `features/planning/components/cycle-board/cycle-board.component.ts:12` | Admin · Manager · PM | **unreached — QUEUE OPS-Q-013** | Cycle entry board: progress bar, days-remaining, drag-to-reorder entries |
| P-03 | `app-cycle-dialog` / CycleDialogComponent | form | `/planning` | `features/planning/components/cycle-dialog/cycle-dialog.component.ts:16` | Admin · Manager · PM | form-populated(cycle name/start date/end date/goals/CANCEL/CREATE) | Create / edit planning cycle |
| P-04 | CAP-PLAN-MRP disabled state | state | `/planning` | `features/planning/planning.component.ts:62` + `planning.service.ts:11` | Admin · Manager · PM | DN-8: capability gate | Board renders empty with capability-disabled banner when CAP-PLAN-MRP is off |
| P-05 | PlanningService | service | `/planning` | `features/planning/services/planning.service.ts:13` | n/a | n/a | Cycle CRUD + entry management; pre-checks CAP-PLAN-MRP (`planning.service.ts:56`) |

> **CAP-PLAN-MRP**: Defined as `PLANNING_CAPABILITY = 'CAP-PLAN-MRP'` at `planning.service.ts:11`. `isDisabled()` check at `planning.service.ts:56`. Capability-disabled banner on `planning.component.ts:62`. Status in this env: **TODO:confirm live** (likely disabled — no seed cycles).

---

### Area 4 — Scheduling (`/scheduling/:tab`)

Tabs (from `scheduling.component.ts:29`): `gantt` · `dispatch` · `work-centers` · `shifts` · `runs`

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| S-01 | `app-scheduling` / SchedulingComponent | page | `/scheduling/:tab` | `features/scheduling/scheduling.component.ts:32` | Admin · Manager | live: all 5 tabs reached · KPI chips (0 scheduled ops, 0 in progress, 0 work centers) | Tab host for all scheduling views |
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
| SF-01 | `app-shop-floor-display` / ShopFloorDisplayComponent | page | `/display/shop-floor` | `features/shop-floor/shop-floor-display.component.ts:52` | all (public) | unpaired-setup-form(live) · paired-main-display(**QUEUE OPS-Q-001**) | Main kiosk display: phases = main/pin/actions/job-select/receiving/shipping |
| SF-02 | `app-kiosk-setup` / KioskSetupComponent | panel | `/display/shop-floor` (phase=setup) | `features/shop-floor/components/kiosk-setup/kiosk-setup.component.ts:16` | all (public) | admin-login-form(live: email/password/SIGN-IN-AS-ADMIN) · configure-terminal(live: terminal-name/team-select/CREATE-NEW-TEAM/ACTIVATE-TERMINAL) | Admin-login + team/terminal config before kiosk goes live |
| SF-03 | `app-kiosk-search-bar` / KioskSearchBarComponent | cluster | `/display/shop-floor` | `features/shop-floor/components/kiosk-search-bar/kiosk-search-bar.component.ts:12` | all (public) | **QUEUE OPS-Q-001** (paired state only) | Worker search/lookup bar on kiosk main screen |
| SF-04 | `app-kiosk-session-bar` / KioskSessionBarComponent | cluster | `/display/shop-floor` | `features/shop-floor/components/kiosk-session-bar/kiosk-session-bar.component.ts:9` | all (public) | **QUEUE OPS-Q-001** (paired state only) | Logged-in worker session info bar |
| SF-05 | `app-numeric-keypad` / NumericKeypadComponent | cluster | `/display/shop-floor` | `features/shop-floor/components/numeric-keypad/numeric-keypad.component.ts:20` | all (public) | **QUEUE OPS-Q-001** (paired state only) | Touch-friendly numeric entry (PIN, quantities) |
| SF-06 | `app-pin-prompt-dialog` / PinPromptDialogComponent | dialog | `/display/shop-floor` (phase=pin) | `features/shop-floor/components/pin-prompt-dialog/pin-prompt-dialog.component.ts:9` | all (public) | **QUEUE OPS-Q-001** (paired state only) | PIN entry dialog for worker auth on kiosk |
| SF-07 | `app-scan-action-overlay` / ScanActionOverlayComponent | panel | `/display/shop-floor` + `/display/shop-floor/scan` | `features/shop-floor/components/scan-action-overlay/scan-action-overlay.component.ts:52` | all (public) | **QUEUE OPS-Q-003** (requires barcode scan) | Action selection overlay after barcode scan; hosts all 8 scan-flow sub-components |
| SF-08 | `app-scan-undo-list` / ScanUndoListComponent | panel | `/display/shop-floor` | `features/shop-floor/components/scan-undo-list/scan-undo-list.component.ts:12` | all (public) | **QUEUE OPS-Q-001** | Recent scan history with undo capability |
| SF-09 | `app-scan-devices-panel` / ScanDevicesPanelComponent | panel | `/display/shop-floor` | `features/shop-floor/components/scan-devices-panel/scan-devices-panel.component.ts:13` | all (public) | **QUEUE OPS-Q-001** | Connected scan device management panel |
| SF-10 | `app-scan-location-view` / ScanLocationViewComponent | panel | `/display/shop-floor` | `features/shop-floor/components/scan-location-view/scan-location-view.component.ts:7` | all (public) | **QUEUE OPS-Q-001** | Current inventory location view on kiosk |
| SF-11 | `app-training-mode-banner` / TrainingModeBannerComponent | state | `/display/shop-floor` | `features/shop-floor/components/training-mode-banner/training-mode-banner.component.ts:4` | all (public) | **QUEUE OPS-Q-001** | Banner shown when kiosk training mode active; triggered by `trainingMode = signal(false)` in ShopFloorDisplayComponent:95; actions are simulated (no backend calls) when true |

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
| SF-20 | `app-shop-floor-clock` / ShopFloorClockComponent | page | `/display/shop-floor/clock` | `features/shop-floor/clock/shop-floor-clock.component.ts:29` | all (public) | redirects-to-setup-when-unpaired · **QUEUE OPS-Q-002** | Dedicated clock-in/out kiosk; phases: setup/dashboard/identifying/pin/job-scanned/manual-login/clock |
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
| TT-03 | Start Timer inline dialog | form | `/time-tracking` (inline `showTimerDialog` signal) | `features/time-tracking/time-tracking.component.ts:87` | all authenticated | **QUEUE OPS-Q-017** | Start timer: category + notes; timer state tracked via `activeTimer` signal |
| TT-04 | Stop Timer inline dialog | form | `/time-tracking` (inline `showStopDialog` signal) | `features/time-tracking/time-tracking.component.ts:94` | all authenticated | **QUEUE OPS-Q-017** | Stop active timer with optional notes |
| TT-05 | TimeTrackingService | service | `/time-tracking` | `features/time-tracking/services/time-tracking.service.ts:1` | n/a | n/a | Time entries, clock events, timer control, pay periods |
| TT-06 | TimerHubService (shared) | service | shared | `shared/services/timer-hub.service.ts:1` | n/a | n/a | SignalR hub for real-time timer events (used by TT + job detail panel) |

---

### Area 7 — OEE (`/oee`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| OE-01 | `app-oee` / OeeComponent | page | `/oee` | `features/oee/oee.component.ts:25` | Admin · Manager | empty("No work centers") · KPI chips(0.0% AVG OEE / 0/0 WORLD CLASS) · date-range presets(Last 30 Days/This Month/This Week) | OEE dashboard: work-center card grid, date-range filter, trend + losses charts |
| OE-02 | `app-oee-work-center-card` / OeeWorkCenterCardComponent | cluster | `/oee` | `features/oee/components/oee-work-center-card/oee-work-center-card.component.ts:7` | Admin · Manager | **QUEUE OPS-Q-010** (requires work centers) | Per-work-center OEE gauge card; click selects for detail charts |
| OE-03 | `app-oee-trend-chart` / OeeTrendChartComponent | cluster | `/oee` (detail panel) | `features/oee/components/oee-trend-chart/oee-trend-chart.component.ts:8` | Admin · Manager | **QUEUE OPS-Q-010** | Line chart: OEE + availability + performance + quality over time |
| OE-04 | `app-six-big-losses-chart` / SixBigLossesChartComponent | cluster | `/oee` (detail panel) | `features/oee/components/six-big-losses-chart/six-big-losses-chart.component.ts:9` | Admin · Manager | **QUEUE OPS-Q-010** | Bar chart: Six Big Losses (equipment failure, setup, idling, speed, defects, yield) |
| OE-05 | OeeService | service | `/oee` | `features/oee/services/oee.service.ts:1` | n/a | n/a | OEE calculations, trend data, six-big-losses by work-center |

---

### Area 8 — Quality (`/quality/:tab`)

Tabs (from `quality.component.ts:38`): `inspections` · `lots` · `spc-charts` · `spc-data` · `spc-ooc` · `ncrs` · `capas` · `ecos` · `gages`

> **Source-confirmed**: `QualityComponent` has no intra-component role branches or capability checks. Route guard `['Admin','Manager','Engineer']` is the sole gate; all three roles see identical content.

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| Q-01 | `app-quality` / QualityComponent | page | `/quality/:tab` | `features/quality/quality.component.ts:42` | Admin · Manager · Engineer | page-loaded · all 9 tabs rendered · correct create-buttons per tab | Tab host for all quality views |
| Q-02 | Inspections tab (inline in Q-01) | tab | `/quality/inspections` | `features/quality/quality.component.ts:42` | Admin · Manager · Engineer | empty(no inspections) · NEW INSPECTION button visible · status-filter **QUEUE OPS-Q-006** | QC inspection list: status filter (InProgress/Passed/Failed) |
| Q-02a | Create Inspection inline dialog | form | `/quality/inspections` | `features/quality/quality.component.ts:92` | Admin · Manager · Engineer | form seen — **QUEUE OPS-Q-006** confirm fields | New inspection: template, job, lot number, notes |
| Q-03 | Lots tab (inline in Q-01) | tab | `/quality/lots` | `features/quality/quality.component.ts:42` | Admin · Manager · Engineer | empty(no lots) · NEW LOT button · **QUEUE OPS-Q-007** | Lot records table |
| Q-03a | Create Lot inline dialog | form | `/quality/lots` | `features/quality/quality.component.ts:141` | Admin · Manager · Engineer | **QUEUE OPS-Q-007** | New lot: part, quantity, lot number, supplier lot, expiration |
| Q-03b | Lot Traceability inline dialog | panel | `/quality/lots` | `features/quality/quality.component.ts:142` | Admin · Manager · Engineer | **QUEUE OPS-Q-007** | Trace lot lineage; triggered by `showTraceDialog` signal |
| Q-04 | `app-spc-characteristics` / SpcCharacteristicsComponent | tab | `/quality/spc-charts` | `features/quality/components/spc-characteristics.component.ts:20` | Admin · Manager · Engineer | empty · NEW CHARACTERISTIC button | SPC characteristics list; select characteristic to view chart |
| Q-05 | `app-spc-chart` / SpcChartComponent | tab | `/quality/spc-charts` (detail) | `features/quality/components/spc-chart.component.ts:12` | Admin · Manager · Engineer | **QUEUE OPS-Q-008** | Control chart for selected SPC characteristic |
| Q-06 | `app-spc-data-entry` / SpcDataEntryComponent | tab | `/quality/spc-data` | `features/quality/components/spc-data-entry.component.ts:10` | Admin · Manager · Engineer | empty · NEW CHARACTERISTIC button | Enter new SPC measurement data points |
| Q-07 | `app-spc-ooc-list` / SpcOocListComponent | tab | `/quality/spc-ooc` | `features/quality/components/spc-ooc-list.component.ts:16` | Admin · Manager · Engineer | empty(no OOC events) · no create button | Out-of-control alerts list |
| Q-08 | `app-ncr-list` / NcrListComponent | tab | `/quality/ncrs` | `features/quality/components/ncr-list.component.ts:22` | Admin · Manager · Engineer | empty · NEW NCR button | Non-conformance records list + inline create/edit dialog |
| Q-09 | `app-capa-list` / CapaListComponent | tab | `/quality/capas` | `features/quality/components/capa-list.component.ts:22` | Admin · Manager · Engineer | empty · NEW CAPA button | Corrective and preventive actions list + inline create/edit dialog |
| Q-10 | `app-eco-list` / EcoListComponent | tab | `/quality/ecos` | `features/quality/components/eco-list.component.ts:24` | Admin · Manager · Engineer | empty · NEW ECO button | Engineering change orders list + inline create/edit dialog + affected-items |
| Q-11 | `app-gage-list` / GageListComponent | tab | `/quality/gages` | `features/quality/components/gage-list.component.ts:23` | Admin · Manager · Engineer | empty · NEW GAGE button | Gage R&R list + calibration records; inline create/edit |
| Q-12 | QualityService | service | `/quality` | `features/quality/services/quality.service.ts:1` | n/a | n/a | Inspections, QC templates, lot records, lot traceability, gages, calibration |
| Q-13 | NcrCapaService | service | `/quality` | `features/quality/services/ncr-capa.service.ts:1` | n/a | n/a | NCR and CAPA CRUD |
| Q-14 | EcoService | service | `/quality` | `features/quality/services/eco.service.ts:1` | n/a | n/a | ECO CRUD + affected-items |
| Q-15 | SpcService | service | `/quality` | `features/quality/services/spc.service.ts:1` | n/a | n/a | SPC characteristics, measurements, OOC events |

---

### Area 9 — MRP (`/mrp/:tab`)

Tabs (from `mrp.component.ts:55`): `dashboard` · `planned-orders` · `exceptions` · `runs` · `master-schedule` · `forecasts`

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| M-01 | `app-mrp` / MrpComponent | page | `/mrp/:tab` | `features/mrp/mrp.component.ts:59` | Admin · Manager | sweep D in progress — **QUEUE OPS-Q-009** | Tab host for all MRP views |
| M-02 | Dashboard tab (inline in M-01) | tab | `/mrp/dashboard` | `features/mrp/mrp.component.ts:59` | Admin · Manager | KPI chips: Latest Run/Planned Orders/Firmed Orders/Unresolved Exceptions · RUN MRP + SIMULATE buttons · **QUEUE OPS-Q-009** for populated | MRP summary KPIs |
| M-03 | Planned-orders tab (inline in M-01) | tab | `/mrp/planned-orders` | `features/mrp/mrp.component.ts:59` | Admin · Manager | empty — **QUEUE OPS-Q-009** | MRP-generated planned purchase/work orders |
| M-04 | Exceptions tab (inline in M-01) | tab | `/mrp/exceptions` | `features/mrp/mrp.component.ts:59` | Admin · Manager | empty — **QUEUE OPS-Q-009** | MRP exceptions / alerts |
| M-05 | Runs tab (inline in M-01) | tab | `/mrp/runs` | `features/mrp/mrp.component.ts:59` | Admin · Manager | empty — **QUEUE OPS-Q-009** | MRP run history |
| M-06 | Master-schedule tab (inline in M-01) | tab | `/mrp/master-schedule` | `features/mrp/mrp.component.ts:59` | Admin · Manager | empty — **QUEUE OPS-Q-009** | Master production schedule |
| M-07 | Forecasts tab (inline in M-01) | tab | `/mrp/forecasts` | `features/mrp/mrp.component.ts:59` | Admin · Manager | empty — **QUEUE OPS-Q-009** | Demand forecasts |
| M-08 | `ExecuteMrpRunDialogComponent` | dialog | `/mrp` | `features/mrp/components/execute-mrp-run-dialog.component.ts:1` | Admin · Manager | source-confirmed: run-type select, planning-horizon-days input, simulation hint, CANCEL/RUN MRP button · **QUEUE OPS-Q-009** live-trigger | Run-params dialog; triggered by `executeRun()` / `executeRun(true)` |
| M-09 | `MasterScheduleDialogComponent` | dialog | `/mrp` | `features/mrp/components/master-schedule-dialog.component.ts:1` | Admin · Manager | source-confirmed: name/description/period-start/period-end/lines (add-line action) · **QUEUE OPS-Q-009** live-trigger | Create/edit master schedule |
| M-10 | `GenerateForecastDialogComponent` | dialog | `/mrp` | `features/mrp/components/generate-forecast-dialog.component.ts:1` | Admin · Manager | source-confirmed: name/part/method/historical-periods fields · **QUEUE OPS-Q-009** live-trigger | Forecast generation params |
| M-11 | `MrpRunDetailDialogComponent` | dialog | `/mrp` | `features/mrp/components/mrp-run-detail-dialog.component.ts:1` | Admin · Manager | **QUEUE OPS-Q-009** | Run detail + planned-order breakdown; triggered by run row click |
| M-12 | `MpsVsActualDialogComponent` | dialog | `/mrp` | `features/mrp/components/mps-vs-actual-dialog.component.ts:1` | Admin · Manager | **QUEUE OPS-Q-009** | MPS vs actual comparison chart; triggered by master-schedule row action |
| M-13 | MrpService | service | `/mrp` | `features/mrp/services/mrp.service.ts:1` | n/a | n/a | MRP run execution, planned orders, exceptions, forecasts, master schedule |

---

### Area 10 — Assets (`/assets`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| A-01 | `app-assets` / AssetsComponent | page | `/assets` | `features/assets/assets.component.ts:27` | Admin · Manager | sweep D in progress — **QUEUE OPS-Q-011** | Asset list with search/type/status filters; ADD ASSET button |
| A-02 | `app-asset-detail-panel` / AssetDetailPanelComponent | panel | `/assets` (slide-out) | `features/assets/components/asset-detail-panel/asset-detail-panel.component.ts:17` | Admin · Manager | **QUEUE OPS-Q-011** | Asset detail: status/location/manufacturer/model/serial/hours; tooling-details section; maintenance-log list; entity activity |
| A-03 | `app-asset-detail-dialog` / AssetDetailDialogComponent | dialog | `/assets` | `features/assets/components/asset-detail-dialog/asset-detail-dialog.component.ts:1` | Admin · Manager | **QUEUE OPS-Q-011** | Dialog wrapper around AssetDetailPanelComponent |
| A-04 | Create/Edit Asset form (inline in A-01) | form | `/assets` | `features/assets/assets.component.ts:27` | Admin · Manager | source-confirmed: name/type/status/location/description fields · ADD ASSET button · **QUEUE OPS-Q-011** live-trigger | Asset fields |
| A-05 | AssetsService | service | `/assets` | `features/assets/services/assets.service.ts:1` | n/a | n/a | Asset CRUD, downtime log, maintenance log, subcontract orders |

---

### Area 11 — Maintenance (`/maintenance/predictions`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| MN-01 | `app-predictions` / PredictionsComponent | page | `/maintenance/predictions` | `features/maintenance/pages/predictions/predictions.component.ts:42` | Admin · Manager | sweep D in progress — source-confirmed: KPI strip(active/critical/pending-ack/scheduled/accuracy/downtime-prevented) · severity+status filters · predictions table · **QUEUE OPS-Q-012** live | Predictive maintenance dashboard |
| MN-02 | `app-resolve-prediction-dialog` / ResolvePredictionDialogComponent | dialog | `/maintenance/predictions` | `features/maintenance/components/resolve-prediction-dialog/resolve-prediction-dialog.component.ts:16` | Admin · Manager | source-confirmed: 2 modes(resolve/false-positive) · notes field · CANCEL/confirm button · **QUEUE OPS-Q-012** live-trigger | Notes dialog for resolve-or-false-positive; ack + schedule-PM are inline row actions with no dialog |
| MN-03 | PredictiveMaintenanceService | service | `/maintenance` | `features/maintenance/services/predictive-maintenance.service.ts:1` | n/a | n/a | Predictive maintenance data + resolve actions |

---

### Area 12 — Worker Task View (`/worker`)

> **Role note**: `/worker` has no explicit role guard in `app.routes.ts`; all authenticated users can access it. ProductionWorker role uses this as their primary landing page for assigned jobs.

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| W-01 | `app-worker` / WorkerComponent | page | `/worker` | `features/worker/worker.component.ts:18` | all authenticated | populated(task cards for Worker Sam) · empty-state("No tasks assigned") · loading | Worker task list; sorted by overdue → due-date → priority |
| W-02 | Task card | cluster | `/worker` | `features/worker/worker.component.ts:18` (inline template) | all authenticated | normal · overdue(red) · with-subtask-progress-bar | Per-job task card: job number, priority chip, title, stage chip, customer, due date, subtask progress bar; click navigates to `/kanban?job=<id>` |
| W-03 | WorkerService | service | `/worker` | `features/worker/services/worker.service.ts:1` | n/a | n/a | Fetch tasks assigned to current user |

> Sidebar for ProductionWorker role is minimal (no sub-nav groups): Home, dashboard, groups, insights, engineering icons only — no sales/production/admin groups.

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

### Source-side closures (no live needed)
- ~~SF-12–SF-19, Q-04–Q-07, A-02, MN-02, SF-03–SF-11, SF-22: path:line stubs.~~ **CLOSED** — all source gaps resolved.
- **Q-SC-06 CLOSED**: `SchedulingComponent` does not inject `MatDialog` — **zero dialogs** in scheduling area. All actions are inline service calls.
- **Q-QL-10 CLOSED**: No intra-component role branches in `QualityComponent`. Route guard is the sole gate — Admin/Manager/Engineer see identical UI.
- **Q-SF-15 CLOSED**: Kiosk route has no auth guard; no Angular role-based rendering inside any kiosk component. ProductionWorker uses internal PIN-based kiosk session — not a render gate.
- **Q-MN-02 CORRECTED** from source: dialog has exactly 2 modes (`resolve`/`false-positive`). Ack + schedule-PM are inline row actions with no dialog.
- **A-02 CORRECTED** from source: panel shows asset fields + maintenance-log list + barcode + entity activity. No downtime-log or subcontract-orders sub-section in the component.
- **Q-02a, Q-03a, Q-03b ADDED** from source: inline dialogs in QualityComponent confirmed via `showInspectionDialog`, `showLotDialog`, `showTraceDialog` signals.
- **TT-02/03/04 SPLIT** from source: time-tracking has 3 distinct inline dialogs (add-entry, start-timer, stop-timer) confirmed via signals at component lines 72/87/94. No correction-dialog found in component source.
- **M-08–M-12 triggers confirmed** from source: all 5 MRP dialog open-methods located (`executeRun`, `openCreateSchedule`/`openEditSchedule`, `openGenerateForecast`, `openRunDetail`, `openMpsVsActual`).

**Source side fully resolved. Remaining 54 queue items are `needs-live`.**

---

_Commit: 3 queue items closed from source, 54 tagged needs-live; operations.md corrections applied_
_Next: dequeue ui-scout live results (states + dialog triggers) as they land_
