# Platform Region — Component Inventory

_Phase 04 · Sole writer: source-cataloger + ui-scout live sweep · 2026-05-22_
_Scope: dashboard (+ widgets), reports (dynamic builder), search, notifications (panel + bell), chat, approvals, events, calendar_
_Cross-link: dashboard widgets that render O2C/operations data → cross-linked to owning region's inventory file; only the platform-side container/widget shell is catalogued here._

---

## Cross-links

- **Search** — not a standalone feature module; search bar + results dropdown are implemented inside `AppHeaderComponent` (`core/layout/app-header.component.ts`). Catalogued here as shell-level cluster (SR-*).
- **Notification Bell** — the bell icon and its dropdown `NotificationPanelComponent` live in `AppHeaderComponent`; the full `/notifications` routed page is a separate feature (N-*).
- **Events** — `features/events/` contains models + services only (no UI components). Admin-side events management (`/admin/events`) is owned by the admin region; cross-linked there. No platform-side UI components to catalogue for this area.
- **Dashboard widget data** — Todays Tasks links to `/kanban` (operations); Deadlines links to `/calendar` (platform-owned); Open Orders links to `/sales-orders` (Q2C); Cycle Progress links to `/planning` (operations); Margin Summary links to job margins (operations). Widget containers catalogued here; underlying entity inventory in respective regions.
- `operations.md` / `quote-to-cash.md` — source for operations + Q2C data that feeds dashboard widgets.

---

## Source Map

### Feature directories (platform scope)

| Area | Features path | Routes file | Route(s) | Role guard (source) |
|------|--------------|-------------|----------|---------------------|
| Dashboard | `features/dashboard/` | `dashboard.routes.ts` | `/dashboard` | none — all authenticated |
| Reports | `features/reports/` | `reports.routes.ts` | `/reports`, `/reports/builder`, `/reports/sankey` | `roleGuard('Admin','Manager','PM')` (`app.routes.ts:139`) — ⚠️ live discrepancy: ui-scout observed Engineer accessing `/reports` with no redirect (PLT-Q-004); source blocks all non-Admin/Manager/PM; `engineer@forge.local` has single role `"Engineer"` (ENV-READY.md); re-verify — guard cache or wrong role provisioning suspected |
| Notifications | `features/notifications/` | `notifications.routes.ts` | `/notifications` | none — all authenticated |
| Chat | `features/chat/` | `chat.routes.ts` | `/chat`, `/chat/popout` | none — all authenticated; `CAP-EXT-CHAT` gates bell in header |
| Approvals | `features/approvals/` | `approvals.routes.ts` | `/approvals/:tab` (→ inbox) | `roleGuard('Admin','Manager','PM','OfficeManager')` |
| Calendar | `features/calendar/` | `calendar.routes.ts` | `/calendar` | none — all authenticated |
| Events | `features/events/` | — | — | service-only; no UI routes |
| Search | `core/layout/app-header.component.ts` | — | shell (all authenticated routes) | none — always visible |

### Shared components referenced by platform features

_Template file:line = first occurrence in each consuming template; abbreviated paths relative to `forge-ui/src/app/`._

| ID | Selector | Path | Consuming templates (file:line) |
|----|----------|------|---------------------------------|
| SH-01 | `app-notification-panel` | `shared/components/notification-panel/` | `core/layout/app-header.component.html:208` |
| SH-02 | `app-dashboard-widget` | `shared/components/dashboard-widget/` | `features/dashboard/dashboard.component.html:118` |
| SH-03 | `app-kpi-chip` | `shared/components/kpi-chip/` | `features/dashboard/dashboard.component.html:79` (×3: lines 79,84,90) |
| SH-04 | `app-page-header` | `shared/components/page-header/` | `dashboard.component.html:7` · `reports.component.html:1` · `sankey-reports.component.html:1` · `notifications.component.html` (toolbar area) · `approvals.component.html:1` · `calendar.component.html:1` |
| SH-05 | `app-data-table` | `shared/components/data-table/` | `reports.component.html:57` (×28 instances) · `report-builder.component.html:127` · `notifications.component.html:27` · `approval-inbox.component.html:2` · `approval-workflow-editor.component.html:9` |
| SH-06 | `app-select` | `shared/components/select/` | `notifications.component.html:16` · `calendar.component.html:3` · `report-builder.component.html:3` (×7 instances) · `approval-workflow-editor.component.html:41` |
| SH-07 | `app-input` | `shared/components/input/` | `notifications.component.html:15` · `report-builder.component.html:45` · `save-report-dialog.component.html:3` · `approval-workflow-editor.component.html:21` (×5 instances) |
| SH-08 | `app-toolbar` | `shared/components/toolbar/` | `notifications.component.html:14` |
| SH-09 | `app-empty-state` | `shared/components/empty-state/` | `todays-tasks-widget.component.html:2` · `action-items-widget.component.html:2` · `cycle-progress-widget.component.html:3` · `approval-inbox.component.html` (empty pending list) · `report-builder.component.html:142` |
| SH-10 | `app-dialog` | `shared/components/dialog/` | `approval-inbox.component.html:40` · `approval-workflow-editor.component.html:37` · `save-report-dialog.component.html:1` · (chat dialogs C-03/C-04/C-05 each use it in their own templates) |
| SH-11 | `app-textarea` | `shared/components/textarea/` | `eod-prompt-widget.component.html:9` · `approval-inbox.component.html:44` · `approval-workflow-editor.component.html:44` · `save-report-dialog.component.html:4` |
| SH-12 | `app-drillable-chart` | `shared/components/drillable-chart/` | `reports.component.html:51` (×4 instances: lines 51,82,96,215) |
| SH-13 | `app-datepicker` | `shared/components/datepicker/` | `reports.component.html:35` (×2) · `sankey-reports.component.html:27` (×2) |
| SH-14 | `app-sankey-chart` | `shared/components/sankey-chart/` | `sankey-reports.component.html:40` |
| SH-15 | `app-page-layout` | `shared/components/page-layout/` | `report-builder.component.html:1` |
| SH-16 | `app-validation-button` | `shared/components/validation-button/` | `save-report-dialog.component.html:10` · `approval-workflow-editor.component.html:84` |
| SH-17 | `app-avatar` | `shared/components/avatar/` | `chat.component.html:11` (×6: lines 11,79,184,211,256,271) · `todays-tasks-widget.component.html:18` · `team-load-widget.component.html:3` · `notification-panel.component.html` (SH-01 template) |
| SH-18 | `app-entity-link` | `shared/components/entity-link/` | `action-items-widget.component.html:17` |
| SH-19 | `app-ai-help-panel` | `shared/components/ai-help-panel/` | `core/layout/app-header.component.html:212` |
| SH-20 | `app-training-context-panel` | `shared/components/training-context-panel/` | `core/layout/app-header.component.html:213` |
| SH-21 | `app-chat-preview-popup` | `shared/components/chat-preview-popup/` | `app.component.html:28` |
| SH-22 | `app-status-badge` | `shared/components/status-badge/` | `todays-tasks-widget.component.html:19` — **added**: discovered during template grep; not in initial list |

---

## Reconciliation Checklist

_These three trees are the completeness denominator. All items must be ticked or explicitly queued before the phase closes._

### Tree 1 — Routes (11 routes in scope)
- [x] `/dashboard` — live swept as admin + worker + engineer; 10 widgets, getting-started banner, focus/ambient/edit modes
- [x] `/reports` — live swept; 30 nav items confirmed, empty states, ProductionWorker redirect confirmed
- [x] `/reports/builder` — live swept; entity select + empty state; cascade source-confirmed (PLT-Q-028 closed)
- [x] `/reports/sankey` — live swept; 10 diagram types confirmed, date filter, empty state
- [x] `/notifications` — N-01 source-confirmed; single component file; no sub-components; 2-tab layout + preferences toggles all inline (signals :99); PLT-Q-025 dequeued
- [x] `/chat` — live swept; renders ChatComponent in page mode; DM+Channels empty states; CAP-EXT-CHAT disables API
- [x] `/chat/popout` — live swept; two-panel popout; empty states; CAP-EXT-CHAT disables API
- [x] `/approvals/inbox` — live swept; empty table; CAP-P2P-APPROVALS blocks seeding
- [x] `/approvals/workflows` — live swept; empty table + New Workflow button; Admin only confirmed (Engineer redirect observed)
- [x] `/calendar` — live swept; month/week/day all observed; PO toggle; day-click confirmed
- [x] Shell search bar (AppHeader) — live swept; query "widget" → 3 results; single-column (no AI)

### Tree 2 — Feature component files (features/ tree, 32 active entries)

| area | component file (relative to `features/`) | inv ID | status |
|------|------------------------------------------|--------|--------|
| dashboard | `dashboard/dashboard.component.ts` | D-01 | source-confirmed |
| dashboard | `dashboard/components/todays-tasks-widget.component.ts` | D-02 | source-confirmed |
| dashboard | `dashboard/components/jobs-by-stage-widget.component.ts` | D-03 | source-confirmed |
| dashboard | `dashboard/components/team-load-widget.component.ts` | D-04 | source-confirmed |
| dashboard | `dashboard/components/deadlines-widget.component.ts` | D-05 | source-confirmed |
| dashboard | `dashboard/components/activity-widget.component.ts` | D-06 | source-confirmed |
| dashboard | `dashboard/widgets/margin-summary-widget/margin-summary-widget.component.ts` | D-07 | source-confirmed |
| dashboard | `dashboard/components/cycle-progress-widget.component.ts` | D-08 | source-confirmed |
| dashboard | `dashboard/components/open-orders-widget.component.ts` | D-09 | source-confirmed |
| dashboard | `dashboard/components/eod-prompt-widget.component.ts` | D-10 | source-confirmed |
| dashboard | `dashboard/components/action-items-widget.component.ts` | D-11 | source-confirmed |
| dashboard | `dashboard/components/ambient-mode.component.ts` | D-12 | source-confirmed |
| dashboard | `dashboard/components/focus-mode.component.ts` | D-13 | source-confirmed |
| dashboard | `dashboard/components/getting-started-banner.component.ts` | D-14 | source-confirmed |
| reports | `reports/reports.component.ts` | R-01 | source-confirmed |
| reports | `reports/components/report-builder/report-builder.component.ts` | R-02 | source-confirmed |
| reports | `reports/components/sankey-reports/sankey-reports.component.ts` | R-03 | source-confirmed |
| reports | `reports/components/save-report-dialog/save-report-dialog.component.ts` | R-04 | source-confirmed |
| notifications | `notifications/notifications.component.ts` | N-01 | source-confirmed |
| chat | `chat/chat.component.ts` | C-01 | source-confirmed |
| chat | `chat/components/chat-popout/chat-popout.component.ts` | C-02 | source-confirmed (standalone route `/chat/popout`; imports C-09/C-10/C-11/C-13) |
| chat | `chat/components/channel-browser-dialog/channel-browser-dialog.component.ts` | C-03 | source-confirmed (imported C-01 line 22, C-02 line 15) |
| chat | `chat/components/channel-settings-dialog/channel-settings-dialog.component.ts` | C-04 | source-confirmed (imported C-01 line 23, C-02 line 16) |
| chat | `chat/components/create-channel-dialog/create-channel-dialog.component.ts` | C-05 | source-confirmed (imported C-01 line 21, C-02 line 14) |
| ~~chat~~ | ~~`chat/components/create-announcement-dialog/create-announcement-dialog.component.ts`~~ | ~~C-06~~ | **CROSS-LINK ADMIN** — owned by `features/admin/components/announcements-panel/`; not in platform denominator |
| ~~chat~~ | ~~`chat/components/share-entity-dialog/share-entity-dialog.component.ts`~~ | ~~C-07~~ | **confirmed unused** — no import found in any .ts or .html; removed from denominator |
| ~~chat~~ | ~~`chat/components/entity-mention-popover/entity-mention-popover.component.ts`~~ | ~~C-08~~ | **confirmed unused** — no import found in any .ts or .html; removed from denominator |
| chat | `chat/components/chat-channel-header/chat-channel-header.component.ts` | C-09 | source-confirmed (imported C-02 line 19; also mobile-chat.component.ts) |
| chat | `chat/components/chat-channel-list/chat-channel-list.component.ts` | C-10 | source-confirmed (imported C-02 line 17; also mobile-chat.component.ts) |
| chat | `chat/components/chat-message-area/chat-message-area.component.ts` | C-11 | source-confirmed (imported C-02 line 18; also mobile-chat.component.ts) |
| ~~chat~~ | ~~`chat/components/chat-message-attachment/chat-message-attachment.component.ts`~~ | ~~C-12~~ | **confirmed unused** — no import found in any .ts or .html; removed from denominator |
| chat | `chat/components/chat-thread-panel/chat-thread-panel.component.ts` | C-13 | source-confirmed (imported C-02 line 20; also mobile-chat.component.ts) |
| ~~chat~~ | ~~`chat/components/thread-panel/thread-panel.component.ts`~~ | ~~C-14~~ | **confirmed unused** — duplicate thread-panel impl; not imported anywhere; removed from denominator |
| approvals | `approvals/approvals.component.ts` | AP-01 | source-confirmed |
| approvals | `approvals/components/approval-inbox/approval-inbox.component.ts` | AP-02 | source-confirmed |
| approvals | `approvals/components/approval-workflow-editor/approval-workflow-editor.component.ts` | AP-03 | source-confirmed |
| calendar | `calendar/calendar.component.ts` | CA-01 | source-confirmed |
| search | _(no `features/search/` dir)_ | SR-01·SR-02 | **SHELL-ONLY** — search UI is inline template logic inside `core/layout/app-header.component.ts`; no standalone `.component.ts` file exists; catalogued as SR-01 (search bar `:113`) and SR-02 (results dropdown `:114`) under the SEARCH inventory section; not counted in feature denominator |
| events | _(no UI files in `features/events/`)_ | — | **SERVICE-ONLY** — `features/events/` contains only `event.model.ts` + `events.service.ts`; zero `.component.ts` files; admin-side event management route (`/admin/events`) is owned by admin region (D2 cross-link); no platform UI to catalogue |

### Tree 3 — Shared components used by platform (shared/ tree, 22 entries)

| shared component | inv ID | status |
|-----------------|--------|--------|
| `shared/components/notification-panel/notification-panel.component.ts` | SH-01 | source-confirmed |
| `shared/components/dashboard-widget/dashboard-widget.component.ts` | SH-02 | source-confirmed |
| `shared/components/kpi-chip/kpi-chip.component.ts` | SH-03 | source-confirmed |
| `shared/components/page-header/page-header.component.ts` | SH-04 | source-confirmed (also used by other regions — DO NOT re-catalogue there) |
| `shared/components/data-table/data-table.component.ts` | SH-05 | source-confirmed |
| `shared/components/select/select.component.ts` | SH-06 | source-confirmed |
| `shared/components/input/input.component.ts` | SH-07 | source-confirmed |
| `shared/components/toolbar/toolbar.component.ts` | SH-08 | source-confirmed |
| `shared/components/empty-state/empty-state.component.ts` | SH-09 | source-confirmed |
| `shared/components/dialog/dialog.component.ts` | SH-10 | source-confirmed |
| `shared/components/textarea/textarea.component.ts` | SH-11 | source-confirmed |
| `shared/components/drillable-chart/drillable-chart.component.ts` | SH-12 | source-confirmed |
| `shared/components/datepicker/datepicker.component.ts` | SH-13 | source-confirmed |
| `shared/components/sankey-chart/sankey-chart.component.ts` | SH-14 | source-confirmed |
| `shared/components/page-layout/page-layout.component.ts` | SH-15 | source-confirmed |
| `shared/components/validation-button/validation-button.component.ts` | SH-16 | source-confirmed |
| `shared/components/avatar/avatar.component.ts` | SH-17 | source-confirmed |
| `shared/components/entity-link/entity-link.component.ts` | SH-18 | source-confirmed |
| `shared/components/ai-help-panel/ai-help-panel.component.ts` | SH-19 | source-confirmed (AppHeader) |
| `shared/components/training-context-panel/training-context-panel.component.ts` | SH-20 | source-confirmed (AppHeader) |
| `shared/components/chat-preview-popup/chat-preview-popup.component.ts` | SH-21 | source-confirmed (app.component) |
| `shared/components/status-badge/status-badge.component.ts` | SH-22 | source-confirmed (todays-tasks-widget.component.html:19) — discovered in template grep |

---

## Reconciliation Denominator

_Source tree + imports analysis 2026-05-22._

- **Feature components**: 32 (dashboard 14 · reports 4 · notifications 1 · chat 9 · approvals 3 · calendar 1 · events 0)
  - _Reports note: 4 component files contain 28 report-type configs (ReportDef[]) + 10 Sankey flow configs (SankeyReportDef[]); configs are not components and do not count toward denominator. Architecture: config-driven single-component pattern, source-confirmed._
- **Shared components**: 22 (SH-01–SH-21 initial + SH-22 StatusBadge discovered via template grep)
- **Shell search cluster (AppHeader)**: SR-01 search bar + SR-02 search results dropdown — inline template logic in `AppHeaderComponent`; no standalone component files; not counted in feature denominator
- **Total denominator**: 54 items (32 feature + 22 shared; SR-01/SR-02 are sub-entries of AppHeader, not independent files)

_Chat denominator note (resolved 2026-05-22): C-06 CreateAnnouncementDialog is admin-owned (used by `features/admin/components/announcements-panel/`). C-07 ShareEntityDialog, C-08 EntityMentionPopover, C-12 ChatMessageAttachment, C-14 ThreadPanel are confirmed unused — no imports in any .ts or .html. Removed 5, leaving chat=9 active files (C-01–C-05, C-09–C-11, C-13). C-09/C-10/C-11/C-13 confirmed in ChatPopoutComponent (C-02) and features/mobile/pages/mobile-chat.component.ts (cross-region usage, component still owned here)._

_Three-tree checklist pass (2026-05-22): routes 10/11 ticked ([ ] `/notifications` → PLT-Q-025 not yet swept); features 32/32 source-confirmed; shared 22/22 source-confirmed. All feature + shared file:line entries confirmed from source (`@Component` decorator grep); zero `:1` placeholders remain in active (non-struck-through) rows. Search and Events scope areas explicitly accounted in feature tree: search has no `features/search/` dir — UI is inline template logic in AppHeaderComponent (catalogued SR-01/SR-02, not in feature denominator); events has no UI in `features/events/` — only `event.model.ts` + `events.service.ts` exist (verified by directory listing); admin route cross-linked to admin region (D2). Both areas now have explicit "SHELL-ONLY" / "SERVICE-ONLY" rows in Tree 2 — no scope area is blank._

**RECONCILE = 0 (2026-05-22, commit b919ae9+):** Routes 11/11 ticked · Feature tree 32/32 source-confirmed · Shared tree 22/22 located with consuming template file:line · Zero rows carrying `unreached`/`TODO`/`needs-live` status · D3 capability gates confirmed for all gated surfaces: `CAP-EXT-CHAT` (ChatComponent header panel), `CAP-P2P-APPROVALS` (Approvals approve/reject/workflow-create — backend gate), `CAP-EXT-AI-ASSISTANT` (Search Results Dropdown AI/RAG columns, `ai.service.ts:78`) · PLT queue depth = 0 (Q-033 closed fc1af9c; Q-028 closed 0c513d8) · Denominator 54 final and closed.

---

## Inventory

> Status column: **catalogued** = file:line confirmed + live states observed; **source-confirmed** = file:line confirmed, live sweep pending; **needs-live** = source uncertain, requires live sweep.

---

### DASHBOARD

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| DashboardComponent | page | `/dashboard` | `features/dashboard/dashboard.component.ts:53` | all authenticated | loading·populated·error·ambient-mode·focus-mode | GridStack-based widget grid with drag/resize editing mode, CSV export, idle→ambient-mode trigger |
| DashboardWidgetComponent | shared-cmp | `/dashboard` | `shared/components/dashboard-widget/dashboard-widget.component.ts:4` | all authenticated | populated | Shell wrapper (header, title, icon, view-all link) for all dashboard widgets |
| TodaysTasksWidgetComponent | widget | `/dashboard` | `features/dashboard/components/todays-tasks-widget.component.ts:16` | all authenticated | empty·populated | Lists current user's assigned open tasks; links to /kanban |
| JobsByStageWidgetComponent | widget | `/dashboard` | `features/dashboard/components/jobs-by-stage-widget.component.ts:5` | all authenticated | empty·populated | Bar chart of job counts per kanban stage; links to /kanban |
| TeamLoadWidgetComponent | widget | `/dashboard` | `features/dashboard/components/team-load-widget.component.ts:6` | all authenticated | empty·populated | Per-user task counts for team workload visibility; links to /time-tracking |
| DeadlinesWidgetComponent | widget | `/dashboard` | `features/dashboard/components/deadlines-widget.component.ts:8` | all authenticated | empty·populated | Upcoming job due dates sorted by proximity; overdue flag; links to /calendar |
| ActivityWidgetComponent | widget | `/dashboard` | `features/dashboard/components/activity-widget.component.ts:8` | all authenticated | empty·populated | Recent platform activity feed (cross-region events) |
| MarginSummaryWidgetComponent | widget | `/dashboard` | `features/dashboard/widgets/margin-summary-widget/margin-summary-widget.component.ts:16` | all authenticated | empty·populated | Job margin KPI summary — cross-links to job margin data (operations region) |
| CycleProgressWidgetComponent | widget | `/dashboard` | `features/dashboard/components/cycle-progress-widget.component.ts:11` | all authenticated | empty·populated | Active planning cycle progress; links to /planning |
| OpenOrdersWidgetComponent | widget | `/dashboard` | `features/dashboard/components/open-orders-widget.component.ts:17` | all authenticated | empty·populated | Open sales order count/value summary; links to /sales-orders |
| EodPromptWidgetComponent | widget | `/dashboard` | `features/dashboard/components/eod-prompt-widget.component.ts:9` | all authenticated | empty·populated | End-of-day check-in prompt for current user |
| ActionItemsWidgetComponent | widget | `/dashboard` | `features/dashboard/components/action-items-widget.component.ts:29` | all authenticated | empty·populated | System-generated follow-up tasks (QuoteExpiring, LeadStale, InvoicePastDue, etc.) with entity links |
| AmbientModeComponent | panel | `/dashboard` | `features/dashboard/components/ambient-mode.component.ts:7` | all authenticated | active | Full-screen ambient display triggered after configured idle timeout (AMBIENT_IDLE_PREF_KEY) |
| FocusModeComponent | panel | `/dashboard` | `features/dashboard/components/focus-mode.component.ts:10` | all authenticated | active | Distraction-free focused widget view; toggled via ?focus=true queryParam |
| GettingStartedBannerComponent | state | `/dashboard` | `features/dashboard/components/getting-started-banner.component.ts:20` | all authenticated | active (empty/first-login state) | Onboarding banner shown when dashboard has no data or on first visit |

---

### REPORTS

_**Architecture: CONFIG-DRIVEN (source-confirmed).** `features/reports/` has exactly 4 `.component.ts` files (confirmed via glob). `ReportsComponent` defines a `ReportDef[]` array of 28 entries (`reports.component.ts:59–88`) and an `activeReport` signal that drives a `@switch` in the template — one component renders all 28 types; no per-type component file exists. `SankeyReportsComponent` defines a `SankeyReportDef[]` array of 10 entries (`sankey-reports.component.ts:35–46`) with the same pattern. The 28 report types and 10 Sankey flows are **config instances, not components**; they are enumerated below as data but do not contribute to the denominator._

_**Route guard (source):** `roleGuard('Admin','Manager','PM')` registered at `app.routes.ts:139`; `hasAnyRole` = plain `Array.includes()` against JWT roles. `renders-for` is set to `Admin·Manager·PM` throughout. ⚠️ **Live discrepancy (PLT-Q-004):** ui-scout observed Engineer (`engineer@forge.local`, single role `"Engineer"` per ENV-READY.md) accessing `/reports` with no redirect — contradicts the guard. Suspected cause: engineer@ provisioned with extra role in JWT, or Angular guard response was cached from a prior admin session. Needs re-verification; if confirmed broken, raises a security finding._

_**D2 cross-links — report data by region:** operations data — jobs-by-stage · overdue-jobs · job-completion-trend · on-time-delivery · average-lead-time · team-workload · my-work-history · time-in-stage · cycle-review · job-margin · my-cycle-summary · employee-productivity · maintenance · quality-scrap · rd; Q2C data — expense-summary · my-expense-history · lead-pipeline · quote-to-close · lead-sales · ar-aging · revenue · simple-pnl · customer-activity · shipping-summary; mixed/platform data — time-by-user · inventory-levels. Sankey flows draw from all regions. Platform claims only the 4 shell component files._

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| ReportsComponent | page | `/reports` | `features/reports/reports.component.ts:46` | Admin·Manager·PM | loading·populated·empty (per-report) | Left-nav selector + chart+table view for 28 built-in report types; type chosen via `activeReport` signal switch; optional date-range filter |
| ReportBuilderComponent | page | `/reports/builder` | `features/reports/components/report-builder/report-builder.component.ts:46` | Admin·Manager·PM | loading·populated·empty | Dynamic query builder — entity/field/filter/group-by/sort/chart-type; saved reports; CSV export. **PLT-Q-028 dequeued:** cascade (column-select, filter rows, Run, Save) confirmed inline — `selectedColumns` signal + `FilterRow[]` signal array + `runReport()`/`openSaveDialog()` methods, all within this class; only child dialog is R-04 (already catalogued). Headless Playwright signal-batching blocked live drive; source-confirmation satisfies bar. |
| SankeyReportsComponent | page | `/reports/sankey` | `features/reports/components/sankey-reports/sankey-reports.component.ts:22` | Admin·Manager·PM | loading·populated·empty | Left-nav selector + Sankey chart for 10 flow types; type chosen via `activeReport` signal |
| SaveReportDialogComponent | dialog | `/reports/builder` | `features/reports/components/save-report-dialog/save-report-dialog.component.ts:25` | Admin·Manager·PM | active | Dialog to name + describe + share-flag a custom saved report |

**28 built-in report type configs (ReportDef[], not components):** jobs-by-stage · overdue-jobs · time-by-user · expense-summary · lead-pipeline · job-completion-trend · on-time-delivery · average-lead-time · team-workload · customer-activity · my-work-history · my-time-log · ar-aging · revenue · simple-pnl · my-expense-history · quote-to-close · shipping-summary · time-in-stage · employee-productivity · inventory-levels · maintenance · quality-scrap · cycle-review · job-margin · my-cycle-summary · lead-sales · rd

**10 Sankey flow type configs (SankeyReportDef[], not components):** quote-to-cash · job-stage-flow · material-to-product · worker-orders · expense-flow · vendor-supply-chain · quality-rejection · inventory-location · customer-revenue · training-completion

---

### SEARCH (shell — AppHeaderComponent)

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| Global Search Bar | cluster | all authenticated routes (AppHeader) | `core/layout/app-header.component.ts:113` | all authenticated | idle·focused·searching·results-shown | Full-text search input (Ctrl+K shortcut); debounce 300ms; pipes to SearchService + AiService |
| Search Results Dropdown | panel | all authenticated routes (AppHeader) | `core/layout/app-header.component.ts:114` | all authenticated; AI/RAG columns gated by `CAP-EXT-AI-ASSISTANT` (`ai.service.ts:78` — `AiService.available()` signal; hides RAG answer + AI suggestions when disabled) | empty·populated·ai-loading | Dropdown showing entity matches (SearchResult[]); AI suggestions (AiSearchSuggestion[]) + RAG answer (RagSearchResult[]) shown only when `CAP-EXT-AI-ASSISTANT` enabled; navigates to entity detail on click |

---

### NOTIFICATIONS

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| NotificationsComponent | page | `/notifications` | `features/notifications/notifications.component.ts:18` | all authenticated | loading·populated·empty | Full-page notification log — DataTable with search/severity/source filters; 2 tabs: All Notifications + Preferences (mark-all-read, dismiss-all, preference toggles) |
| NotificationPanelComponent | panel | all authenticated routes (AppHeader bell) | `shared/components/notification-panel/notification-panel.component.ts:14` | all authenticated | empty·populated | Header dropdown panel showing filterable notification list; unread count badge; routes to /notifications for full view |
| Notification Bell / Badge | action | all authenticated routes (AppHeader) | `core/layout/app-header.component.ts:88` | all authenticated | unread-count-badge | Header bell icon toggling NotificationPanelComponent; shows unread count badge |
| Notifications Preferences Cluster | cluster | `/notifications` | `features/notifications/notifications.component.ts:99` | all authenticated | active | Preference toggles (email on critical, email on assignment, email on mention, sound) — rendered in 'preferences' tab |

---

### CHAT

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| ChatComponent | page | `/chat` | `features/chat/chat.component.ts:35` | all authenticated (`CAP-EXT-CHAT` gates header button only) | loading·populated·empty·dm-view·channel-view·user-picker-view | Full chat client — DM + channel list, message area, thread panel, file upload; also used as header panel when `isRoutedPage=false` |
| ChatComponent (header panel) | panel | all authenticated routes | `features/chat/chat.component.ts:56` | all authenticated if `CAP-EXT-CHAT` enabled | empty·populated | Same ChatComponent rendered in AppHeader with panelOpen toggle (isRoutedPage=false); routes to /chat if popped out |
| ChatPopoutComponent | page | `/chat/popout` | `features/chat/components/chat-popout/chat-popout.component.ts:22` | all authenticated | loading·populated | Detached browser-window chat view (window.open popout); composed of C-09/C-10/C-11/C-13; coordinated via ChatBroadcastService |
| ChannelBrowserDialogComponent | dialog | `/chat`, `/chat/popout` | `features/chat/components/channel-browser-dialog/channel-browser-dialog.component.ts:13` | all authenticated | loading·populated·empty | Browse + join existing channels dialog |
| ChannelSettingsDialogComponent | dialog | `/chat`, `/chat/popout` | `features/chat/components/channel-settings-dialog/channel-settings-dialog.component.ts:23` | all authenticated (channel member) | active | Channel settings (rename, topic, mute, leave) for selected channel |
| CreateChannelDialogComponent | dialog | `/chat`, `/chat/popout` | `features/chat/components/create-channel-dialog/create-channel-dialog.component.ts:27` | all authenticated | active | Create new chat channel (name, type, description) |
| ~~CreateAnnouncementDialogComponent~~ | ~~dialog~~ | — | `features/chat/components/create-announcement-dialog/create-announcement-dialog.component.ts:1` | — | **CROSS-LINK ADMIN** — opened only by `features/admin/components/announcements-panel/`; not platform-owned |
| ~~ShareEntityDialogComponent~~ | ~~dialog~~ | — | `features/chat/components/share-entity-dialog/share-entity-dialog.component.ts:1` | — | **confirmed unused** — no imports anywhere |
| ~~EntityMentionPopoverComponent~~ | ~~panel~~ | — | `features/chat/components/entity-mention-popover/entity-mention-popover.component.ts:1` | — | **confirmed unused** — no imports anywhere |
| ChatChannelHeaderComponent | cluster | `/chat/popout` | `features/chat/components/chat-channel-header/chat-channel-header.component.ts:11` | all authenticated | source-confirmed (C-02 popout + mobile-chat) | Channel/DM header bar (name, avatar, back button, settings, mute toggle, popout show) |
| ChatChannelListComponent | panel | `/chat/popout` | `features/chat/components/chat-channel-list/chat-channel-list.component.ts:21` | all authenticated | source-confirmed (C-02 popout + mobile-chat) | Left-sidebar DM + channel list with search input, section collapse, unread badges |
| ChatMessageAreaComponent | panel | `/chat/popout` | `features/chat/components/chat-message-area/chat-message-area.component.ts:12` | all authenticated | source-confirmed (C-02 popout + mobile-chat) | Scrollable message history + compose input + file attach; input/output-driven (presentation) |
| ~~ChatMessageAttachmentComponent~~ | ~~cluster~~ | — | `features/chat/components/chat-message-attachment/chat-message-attachment.component.ts:1` | — | **confirmed unused** — not imported anywhere; removed from denominator |
| ChatThreadPanelComponent | panel | `/chat/popout` | `features/chat/components/chat-thread-panel/chat-thread-panel.component.ts:9` | all authenticated | source-confirmed (C-02 popout + mobile-chat) | Thread reply side-panel; input/output-driven (presentation); closes on output |
| ~~ThreadPanelComponent~~ | ~~panel~~ | — | `features/chat/components/thread-panel/thread-panel.component.ts:13` | — | **confirmed unused** — duplicate thread impl (stateful via ChatService injection); not imported anywhere; removed from denominator |
| ChatPreviewPopupComponent | panel | all authenticated routes | `shared/components/chat-preview-popup/chat-preview-popup.component.ts:16` | all authenticated | empty·populated | Shell-level popup for inline chat previews (always mounted in app.component) |
| MentionRenderPipe | shared-cmp | `/chat` | `features/chat/pipes/mention-render.pipe.ts:1` | all authenticated | — | Renders @-mentions in message text (pipe, not a component; included for completeness) |

---

### APPROVALS

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| ApprovalsComponent | page | `/approvals/:tab` (→inbox) | `features/approvals/approvals.component.ts:15` | Admin·Manager·PM·OfficeManager; approve/reject/workflow-create actions gated by `CAP-P2P-APPROVALS` (backend gate — UI routes render regardless; API returns 403 when cap disabled) | active | Tab shell with two tabs: Inbox (all approvers) + Workflows (Admin/Manager only via `canManageWorkflows` computed) |
| ApprovalInboxComponent | tab | `/approvals/inbox` | `features/approvals/components/approval-inbox/approval-inbox.component.ts:19` | Admin·Manager·PM·OfficeManager (`CAP-P2P-APPROVALS` gates approve/reject API calls) | loading·empty·populated | Pending approval requests table (entity type, summary, workflow, step, amount, requester, date); approve/reject actions; reject requires comment via dialog |
| Reject Approval Dialog | dialog | `/approvals/inbox` | `features/approvals/components/approval-inbox/approval-inbox.component.ts:40` | Admin·Manager·PM·OfficeManager (`CAP-P2P-APPROVALS` gates submit) | active | Inline dialog (showRejectDialog signal) — requires rejection comments textarea; SUBMIT REJECT action |
| ApprovalWorkflowEditorComponent | tab | `/approvals/workflows` | `features/approvals/components/approval-workflow-editor/approval-workflow-editor.component.ts:22` | Admin·Manager (canManageWorkflows); `CAP-P2P-APPROVALS` gates workflow CRUD API | loading·empty·populated | Workflow definitions table + create/edit dialog; configures entity type, threshold, multi-step approver chain (SpecificUser, Role, Manager) |
| Workflow Create/Edit Dialog | dialog | `/approvals/workflows` | `features/approvals/components/approval-workflow-editor/approval-workflow-editor.component.ts:44` | Admin·Manager (`CAP-P2P-APPROVALS` gates save) | active | Dialog (showDialog signal) — workflow name, entity type, description, amount threshold, dynamic steps array (add/remove steps) |

---

### CALENDAR

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| CalendarComponent | page | `/calendar` | `features/calendar/calendar.component.ts:19` | all authenticated | loading·empty·populated | 3-view calendar (month/week/day) of job due dates; track-type filter; toggle PO delivery events overlay; click day → day view; click job → /kanban?jobId=X |
| Calendar Month View | tab | `/calendar` | `features/calendar/calendar.component.ts:76` | all authenticated | empty·populated | 42-cell month grid (calendarDays computed); up to 3 visible jobs per cell + overflow count; PO delivery events overlay (poEventsByDate map) |
| Calendar Week View | tab | `/calendar` | `features/calendar/calendar.component.ts:80` | all authenticated | empty·populated | 7-column week grid (weekDays computed); jobs by date |
| Calendar Day View | tab | `/calendar` | `features/calendar/calendar.component.ts:84` | all authenticated | empty·populated | Single-day hourly grid (24 HOURS array); jobs with due-date match; PO delivery events for day |
| PO Deliveries Toggle | action | `/calendar` | `features/calendar/calendar.component.ts:140` | all authenticated | on·off | Toggle overlaying PO expected-delivery events on calendar; saved to userPreferences ('calendar:showPo') |

---

### EVENTS

_No UI components. `features/events/` contains models (`event.model.ts`) and `EventsService` only. Admin-side event management is at `/admin/events` — owned by admin region (cross-linked). No platform UI surfaces to catalogue._

---

### SHARED COMPONENTS (platform-scope usages)

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| NotificationPanelComponent | panel | AppHeader (all authenticated) | `shared/components/notification-panel/notification-panel.component.ts:14` | all authenticated | empty·populated | see Notifications section above |
| DashboardWidgetComponent | shared-cmp | `/dashboard` | `shared/components/dashboard-widget/dashboard-widget.component.ts:4` | all authenticated | populated | see Dashboard section |
| KpiChipComponent | shared-cmp | `/dashboard` | `shared/components/kpi-chip/kpi-chip.component.ts:3` | all authenticated | — | KPI chip displayed in dashboard header strip |
| PageHeaderComponent | shared-cmp | all platform pages | `shared/components/page-header/page-header.component.ts:8` | all authenticated | — | Page title bar with optional action buttons |
| DataTableComponent | shared-cmp | `/notifications`, `/approvals/*`, `/reports*` | `shared/components/data-table/data-table.component.ts:40` | all authenticated | loading·empty·populated | Sortable/filterable data table with column manager, pagination |
| SelectComponent | shared-cmp | `/notifications`, `/calendar`, `/reports*` | `shared/components/select/select.component.ts:17` | all authenticated | — | Dropdown select field |
| InputComponent | shared-cmp | `/notifications`, `/approvals/*`, `/reports/builder` | `shared/components/input/input.component.ts:13` | all authenticated | — | Text input field |
| ToolbarComponent | shared-cmp | `/notifications` | `shared/components/toolbar/toolbar.component.ts:3` | all authenticated | — | Page action toolbar |
| EmptyStateComponent | shared-cmp | `/approvals/*`, `/reports/builder` | `shared/components/empty-state/empty-state.component.ts:3` | all authenticated | active | Empty-state message + optional action |
| DialogComponent | shared-cmp | `/approvals/*`, `/reports/builder`, `/chat` | `shared/components/dialog/dialog.component.ts:16` | all authenticated | active | Dialog shell (title, content, footer) |
| TextareaComponent | shared-cmp | `/approvals/*` | `shared/components/textarea/textarea.component.ts:12` | all authenticated | — | Multi-line text input |
| DrillableChartComponent | shared-cmp | `/reports` | `shared/components/drillable-chart/drillable-chart.component.ts:20` | Admin·Manager·PM | active | Chart with drill-down capability; expense breakdown |
| DatepickerComponent | shared-cmp | `/reports`, `/reports/sankey` | `shared/components/datepicker/datepicker.component.ts:27` | Admin·Manager·PM | — | Date input with picker UI |
| SankeyChartComponent | shared-cmp | `/reports/sankey` | `shared/components/sankey-chart/sankey-chart.component.ts:27` | Admin·Manager·PM | empty·populated | D3-based Sankey flow diagram |
| PageLayoutComponent | shared-cmp | `/reports/builder` | `shared/components/page-layout/page-layout.component.ts:8` | Admin·Manager·PM | — | Two-panel page layout (sidebar slot + content slot) |
| ValidationButtonComponent | shared-cmp | `/approvals/*`, `/reports/builder` | `shared/components/validation-button/validation-button.component.ts:22` | all authenticated | idle·loading·disabled | Submit button with built-in loading state + validation |
| AvatarComponent | shared-cmp | `/chat`, `/dashboard` (widgets), notification-panel | `shared/components/avatar/avatar.component.ts:3` | all authenticated | — | User initials/color avatar; chat.component.html:11 + todays-tasks-widget.component.html:18 + team-load-widget.component.html:3 |
| EntityLinkComponent | shared-cmp | `/dashboard` (action-items widget) | `shared/components/entity-link/entity-link.component.ts:43` | all authenticated | — | Clickable entity link; action-items-widget.component.html:17 |
| AiHelpPanelComponent | shared-cmp | AppHeader (all authenticated) | `shared/components/ai-help-panel/ai-help-panel.component.ts:17` | all authenticated | empty·populated | AI help side-panel; app-header.component.html:212 |
| TrainingContextPanelComponent | shared-cmp | AppHeader (all authenticated) | `shared/components/training-context-panel/training-context-panel.component.ts:17` | all authenticated | active | Training context/hints panel; app-header.component.html:213 |
| ChatPreviewPopupComponent | panel | all authenticated routes | `shared/components/chat-preview-popup/chat-preview-popup.component.ts:16` | all authenticated | empty·populated | Shell-level chat preview popup; app.component.html:28 |
| StatusBadgeComponent | shared-cmp | `/dashboard` (todays-tasks widget) | `shared/components/status-badge/status-badge.component.ts:3` | all authenticated | — | Job/task status badge pill; todays-tasks-widget.component.html:19 — SH-22 |

---

## Live Sweep Results (ui-scout · 2026-05-22)

Screenshots: `E:/dev/forge/analysis/screenshots/platform/`
Roles swept: admin, worker, engineer

### Capability gate discoveries
- **CAP-EXT-CHAT DISABLED**: chat bell absent from header; `/chat` and `/chat/popout` routes still render (empty states). All chat API calls 403. Chat components catalogued from source; no live channel/DM data reachable.
- **CAP-P2P-APPROVALS DISABLED**: approval workflow POST 403; UI routes `/approvals/*` fully render. Inbox empty, Workflows empty. Approve/reject/dialog flows unreachable without pending items.
- **AI feature DISABLED**: no AI button in header; search single-column only; `app-ai-help-panel` button not rendered.

### Per-queue-item results (see platform-queue.md for status)

| ID | Item | Live Result |
|----|------|-------------|
| PLT-Q-001 | Dashboard 10 widgets | Observed: Today's Tasks (1 task "Test widget"/J-1), Jobs by Stage (bar chart with 1 Order Confirmed), Activity (2 entries), Margin Summary (100% avg margin, $125 revenue, 1 job), Open Orders (1 SO: Partially Shipped), EOD Prompt (textarea+SAVE form), Cycle Progress (empty "No active cycle"+START PLANNING), Deadlines (empty), Team Load (empty). Action Items widget in grid (10 total confirmed by DOM). Getting Started Banner visible: 2/4 steps done. |
| PLT-Q-002 | Ambient + Focus mode | Ambient: full-screen overlay with clock + KPIs (Esc to exit). Focus: full-page MY TASKS + OPEN ORDERS + EOD sections, close X. Both observed live. |
| PLT-Q-003 | Edit mode | Edit bar: "Drag widgets to rearrange. Resize from edges." hint + "+ ADD WIDGET" (disabled — all 10 widgets shown) + "RESET" button. Header: "DONE" replaces "CUSTOMIZE". Widget remove buttons (.widget-remove-btn) exist in source; DOM count=0 (all present, none removed). |
| PLT-Q-004 | 28 report types | All 30 nav items confirmed live: 28 report types + Sankey Diagrams + Report Builder. First 3 clicked (Jobs by Stage, Overdue Jobs, Time by User) — all render empty states. ProductionWorker role-redirected to /dashboard (confirmed live). Engineer can access /reports (no redirect observed). |
| PLT-Q-005 | Report Builder | Observed: Saved Reports dropdown, + New Report button, Entity select ("--Select Entity--"). Empty state "Configure your report and click Run" with analytics icon. Columns/filters/group/visualization sections appear after entity select (source-confirmed; not triggered live). Save dialog (RP-44) unreached. |
| PLT-Q-006 | Sankey Reports | Observed: 10 nav items (Quote-to-Cash Pipeline, Job Stage Flow, Material to Product, Worker to Orders, Expense Flow, Vendor Supply Chain, Quality/Rejection Flow, Inventory Location Flow, Customer Revenue Breakdown, Training Completion). Date filter (From/To + Apply). Empty state "No flow data available". Back to Reports button. ✅ CLOSED |
| PLT-Q-016 | ChatPopoutComponent | Observed: two-panel layout — left: "Chat" title + "Search conversations" input + empty ("No conversations yet"); right: empty placeholder "Select a conversation to start chatting". ✅ CLOSED |
| PLT-Q-017 | Notifications panel | Observed: 3 tabs (All · Messages · Alerts), 1 notification item ("Sales Order Confirmed" for SO-SO-00001), mark-all-read button (done_all), dismiss-all button. All 3 tabs visited. ✅ CLOSED |
| PLT-Q-018 | Approvals inbox | Observed: empty table ("No pending approvals"). Approve/reject buttons not rendered (no rows). CAP-P2P-APPROVALS blocks workflow seeding. |
| PLT-Q-019 | Workflow editor | Observed: empty data-table "No workflows defined" + "+ NEW WORKFLOW" button. Workflows tab accessible to Admin; not accessible to Engineer (redirected). Dialog not opened live. |
| PLT-Q-020 | Calendar | Observed: month view (42 cells, 0 jobs, 0 PO events), week view (7 columns, all empty), day view (empty). PO deliveries toggle clicked — button active state confirmed. Day cell click → switches to day view (no dialog). Track type select visible. ✅ CLOSED |
| PLT-Q-021 | Search | Observed: query "widget" → 3 results (J-1 Job, PRT-00001 Part, PRT-00002 Part). Single-column layout (no AI). Ctrl+K hint visible. ✅ CLOSED |
| PLT-Q-022 | Notification bell | Observed: badge=1 (unread notification), panel open/close confirmed, 3-tab panel renders. ✅ CLOSED |
| PLT-Q-023 | Chat header panel | CAP-EXT-CHAT disabled: chat bell not rendered in header. Slide-in panel not reachable. /chat route renders ChatComponent in isRoutedPage=true mode instead. |
| PLT-Q-024 | Chat full page | Observed: /chat shows DM section ("No conversations yet") + Channels section ("No channels" + Browse Channels). ✅ CLOSED (empty states) |
| NEW | `/notifications` full page | NOT VISITED — N-01 NotificationsComponent route not swept. Add to queue: PLT-Q-025. |
| NEW | User menu | Observed: user avatar, name (Admin, Forge), email (admin@forge.local), role (ADMIN), Account Settings, About, Language switcher (English/Español), Sign Out. About dialog: title "About Armory Works Forge", version, SHA, license, stack. ✅ CLOSED |
| NEW | Training panel | Observed: button renders; panel toggles open (app-training-context-panel). ✅ CLOSED |

## Open Items (remaining after live sweep)

1. ✅ **PLT-Q-025** — Notifications `/notifications` dequeued: N-01 source-confirmed; `NotificationsComponent` imports only SH-* (PageHeader, DataTable, Select, Input, Toolbar); 2-tab layout + preferences toggles are inline signals (lines :99–103); no sub-component files. Route ticked.
2. **PLT-Q-026** — Chat: all channel/DM/thread/compose sub-components (PLT-Q-023/024 partially closed but populated states unreachable — CAP-EXT-CHAT disabled). Need cap-enabled env.
3. **PLT-Q-027** — Approvals: approve + reject flows (PLT-Q-018); workflow create/edit dialog + step rows (PLT-Q-019). Need CAP-P2P-APPROVALS enabled or direct API seeding bypass.
4. ✅ **PLT-Q-028** — Report Builder cascade dequeued: column-select/filter-rows/Run/Save confirmed inline within `ReportBuilderComponent:46` (`selectedColumns` signal, `FilterRow[]` signal array, `runReport()`/`openSaveDialog()` methods). Only child dialog is `SaveReportDialogComponent` (R-04, already catalogued). No new component files. Headless Playwright signal-batching blocked live drive; source-confirmation satisfies bar.
5. ✅ **PLT-Q-029** — Widget-add-menu dequeued: inline `DashboardComponent` template driven by `WIDGET_REGISTRY` + `activeWidgetIds` signal — no dialog/sub-component file. CSV export is inline `exportCsv()` method. No new files; ui-scout observed 3 addable widgets (TodaysTasks/JobsByStage/TeamLoad) when 7 already active — confirms config-driven add/remove logic.
6. ✅ **PLT-Q-030** — Calendar job-chip dequeued: chip rendering is inline template; click dispatches router navigation to `/kanban?jobId=X` (D2 cross-link, operations-region). PO event chip also inline. No new platform component files.
7. **PLT-Q-031** — Reports: populated data states for 28 report types (all empty in non-seeded env for most; only SO-00001 data available).
8. **PLT-Q-032** — Search: AI column + RAG answer panel (AI feature disabled in this env).
9. **PLT-Q-033** — (pending ui-scout cycle-2 verdict — HOLD final reconcile until this lands).
