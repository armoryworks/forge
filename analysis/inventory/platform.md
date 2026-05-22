# Platform Region — Component Inventory

_Phase 04 · Sole writer: source-cataloger · Started: 2026-05-22_
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
| Reports | `features/reports/` | `reports.routes.ts` | `/reports`, `/reports/builder`, `/reports/sankey` | `roleGuard('Admin','Manager','PM')` |
| Notifications | `features/notifications/` | `notifications.routes.ts` | `/notifications` | none — all authenticated |
| Chat | `features/chat/` | `chat.routes.ts` | `/chat`, `/chat/popout` | none — all authenticated; `CAP-EXT-CHAT` gates bell in header |
| Approvals | `features/approvals/` | `approvals.routes.ts` | `/approvals/:tab` (→ inbox) | `roleGuard('Admin','Manager','PM','OfficeManager')` |
| Calendar | `features/calendar/` | `calendar.routes.ts` | `/calendar` | none — all authenticated |
| Events | `features/events/` | — | — | service-only; no UI routes |
| Search | `core/layout/app-header.component.ts` | — | shell (all authenticated routes) | none — always visible |

### Shared components referenced by platform features

| Component | Selector | Path | Used by |
|-----------|----------|------|---------|
| `app-notification-panel` | `NotificationPanelComponent` | `shared/components/notification-panel/` | AppHeader (notification bell dropdown) |
| `app-dashboard-widget` | `DashboardWidgetComponent` | `shared/components/dashboard-widget/` | D-01 (dashboard page — widget shell) |
| `app-kpi-chip` | `KpiChipComponent` | `shared/components/kpi-chip/` | D-01 (dashboard KPI strip) |
| `app-page-header` | `PageHeaderComponent` | `shared/components/page-header/` | D-01, R-01, N-01, AP-01, CA-01 |
| `app-data-table` | `DataTableComponent` | `shared/components/data-table/` | N-01, AP-02, AP-03, R-01, R-02 |
| `app-select` | `SelectComponent` | `shared/components/select/` | N-01, CA-01, R-02 |
| `app-input` | `InputComponent` | `shared/components/input/` | N-01, AP-03, R-02 |
| `app-toolbar` | `ToolbarComponent` | `shared/components/toolbar/` | N-01 |
| `app-empty-state` | `EmptyStateComponent` | `shared/components/empty-state/` | AP-02, R-02 |
| `app-dialog` | `DialogComponent` | `shared/components/dialog/` | AP-02, AP-03, R-02, C-03, C-04, C-05 |
| `app-textarea` | `TextareaComponent` | `shared/components/textarea/` | AP-02, AP-03 |
| `app-drillable-chart` | `DrillableChartComponent` | `shared/components/drillable-chart/` | R-01 (expense drill-down) |
| `app-datepicker` | `DatepickerComponent` | `shared/components/datepicker/` | R-01 (date range), R-03 (sankey date range) |
| `app-sankey-chart` | `SankeyChartComponent` | `shared/components/sankey-chart/` | R-03 |
| `app-page-layout` | `PageLayoutComponent` | `shared/components/page-layout/` | R-02 (report-builder page layout) |
| `app-validation-button` | `ValidationButtonComponent` | `shared/components/validation-button/` | AP-03, R-02 |
| `app-avatar` | `AvatarComponent` | `shared/components/avatar/` | C-01 (chat message avatars), notification-panel |
| `app-entity-link` | `EntityLinkComponent` | `shared/components/entity-link/` | D-11 (action-items widget follow-up tasks) |
| `app-ai-help-panel` | `AiHelpPanelComponent` | `shared/components/ai-help-panel/` | AppHeader (AI help side-panel) |
| `app-training-context-panel` | `TrainingContextPanelComponent` | `shared/components/training-context-panel/` | AppHeader (training context panel) |
| `app-chat-preview-popup` | `ChatPreviewPopupComponent` | `shared/components/chat-preview-popup/` | app.component (shell-level chat preview popup) |

---

## Reconciliation Checklist

### Routes
- [ ] `/dashboard` — source confirmed; live sweep needed
- [ ] `/reports` — source confirmed; live sweep needed
- [ ] `/reports/builder` — source confirmed; live sweep needed
- [ ] `/reports/sankey` — source confirmed; live sweep needed
- [ ] `/notifications` — source confirmed; live sweep needed
- [ ] `/chat` — source confirmed; live sweep needed
- [ ] `/chat/popout` — source confirmed; live sweep needed
- [ ] `/approvals/inbox` (default tab) — source confirmed; live sweep needed
- [ ] `/approvals/workflows` — source confirmed; Admin/Manager only (computed); live sweep needed
- [ ] `/calendar` — source confirmed; live sweep needed
- [ ] Shell search bar (AppHeader) — source confirmed; live sweep needed

### Feature component files (features/ tree)

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
| chat | `chat/components/chat-popout/chat-popout.component.ts` | C-02 | needs-live (not imported in chat.component.ts — verify via routes) |
| chat | `chat/components/channel-browser-dialog/channel-browser-dialog.component.ts` | C-03 | source-confirmed (imported C-01 line 22) |
| chat | `chat/components/channel-settings-dialog/channel-settings-dialog.component.ts` | C-04 | source-confirmed (imported C-01 line 23) |
| chat | `chat/components/create-channel-dialog/create-channel-dialog.component.ts` | C-05 | source-confirmed (imported C-01 line 21) |
| chat | `chat/components/create-announcement-dialog/create-announcement-dialog.component.ts` | C-06 | needs-live (not imported in chat.component.ts — verify import path) |
| chat | `chat/components/share-entity-dialog/share-entity-dialog.component.ts` | C-07 | needs-live (not imported in chat.component.ts — verify import path) |
| chat | `chat/components/entity-mention-popover/entity-mention-popover.component.ts` | C-08 | needs-live (not imported in chat.component.ts — verify import path) |
| chat | `chat/components/chat-channel-header/chat-channel-header.component.ts` | C-09 | needs-live (not imported in chat.component.ts — may be sub-component of C-02 popout) |
| chat | `chat/components/chat-channel-list/chat-channel-list.component.ts` | C-10 | needs-live (not imported in chat.component.ts — may be sub-component of C-02 popout) |
| chat | `chat/components/chat-message-area/chat-message-area.component.ts` | C-11 | needs-live (not imported in chat.component.ts — may be sub-component of C-02 popout) |
| chat | `chat/components/chat-message-attachment/chat-message-attachment.component.ts` | C-12 | needs-live (not imported in chat.component.ts — verify) |
| chat | `chat/components/chat-thread-panel/chat-thread-panel.component.ts` | C-13 | needs-live (not imported in chat.component.ts — verify) |
| chat | `chat/components/thread-panel/thread-panel.component.ts` | C-14 | needs-live (not imported in chat.component.ts — verify; separate from C-13?) |
| approvals | `approvals/approvals.component.ts` | AP-01 | source-confirmed |
| approvals | `approvals/components/approval-inbox/approval-inbox.component.ts` | AP-02 | source-confirmed |
| approvals | `approvals/components/approval-workflow-editor/approval-workflow-editor.component.ts` | AP-03 | source-confirmed |
| calendar | `calendar/calendar.component.ts` | CA-01 | source-confirmed |

### Shared components used by platform (shared/ tree)

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

---

## Reconciliation Denominator

_Source tree + imports analysis 2026-05-22._

- **Feature components**: 38 (dashboard 14 · reports 4 · notifications 1 · chat 14 · approvals 3 · calendar 1 · events 0)
- **Shared components**: 21
- **Shell search/bell cluster (AppHeader)**: 2 (SR-01 search bar, SR-02 notification bell; these are clusters in AppHeaderComponent, not standalone files)
- **Total denominator**: 59 items (38 feature + 21 shared; SR items are sub-entries of AppHeader, not separate files)

_Note: C-06–C-14 (9 chat sub-components) exist in the features/chat/components/ directory tree but were NOT found in chat.component.ts imports. They may be used by C-02 (ChatPopoutComponent) or by a refactored implementation. All 9 are flagged `needs-live` in the queue (PLT-Q-007 through PLT-Q-015). If confirmed unused, denominator will drop by up to 9._

---

## Inventory

> Status column: **catalogued** = file:line confirmed + live states observed; **source-confirmed** = file:line confirmed, live sweep pending; **needs-live** = source uncertain, requires live sweep.

---

### DASHBOARD

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| DashboardComponent | page | `/dashboard` | `features/dashboard/dashboard.component.ts:53` | all authenticated | loading·populated·error·ambient-mode·focus-mode | GridStack-based widget grid with drag/resize editing mode, CSV export, idle→ambient-mode trigger |
| DashboardWidgetComponent | shared-cmp | `/dashboard` | `shared/components/dashboard-widget/dashboard-widget.component.ts:1` | all authenticated | populated | Shell wrapper (header, title, icon, view-all link) for all dashboard widgets |
| TodaysTasksWidgetComponent | widget | `/dashboard` | `features/dashboard/components/todays-tasks-widget.component.ts:1` | all authenticated | empty·populated | Lists current user's assigned open tasks; links to /kanban |
| JobsByStageWidgetComponent | widget | `/dashboard` | `features/dashboard/components/jobs-by-stage-widget.component.ts:1` | all authenticated | empty·populated | Bar chart of job counts per kanban stage; links to /kanban |
| TeamLoadWidgetComponent | widget | `/dashboard` | `features/dashboard/components/team-load-widget.component.ts:1` | all authenticated | empty·populated | Per-user task counts for team workload visibility; links to /time-tracking |
| DeadlinesWidgetComponent | widget | `/dashboard` | `features/dashboard/components/deadlines-widget.component.ts:1` | all authenticated | empty·populated | Upcoming job due dates sorted by proximity; overdue flag; links to /calendar |
| ActivityWidgetComponent | widget | `/dashboard` | `features/dashboard/components/activity-widget.component.ts:1` | all authenticated | empty·populated | Recent platform activity feed (cross-region events) |
| MarginSummaryWidgetComponent | widget | `/dashboard` | `features/dashboard/widgets/margin-summary-widget/margin-summary-widget.component.ts:1` | all authenticated | empty·populated | Job margin KPI summary — cross-links to job margin data (operations region) |
| CycleProgressWidgetComponent | widget | `/dashboard` | `features/dashboard/components/cycle-progress-widget.component.ts:1` | all authenticated | empty·populated | Active planning cycle progress; links to /planning |
| OpenOrdersWidgetComponent | widget | `/dashboard` | `features/dashboard/components/open-orders-widget.component.ts:1` | all authenticated | empty·populated | Open sales order count/value summary; links to /sales-orders |
| EodPromptWidgetComponent | widget | `/dashboard` | `features/dashboard/components/eod-prompt-widget.component.ts:1` | all authenticated | empty·populated | End-of-day check-in prompt for current user |
| ActionItemsWidgetComponent | widget | `/dashboard` | `features/dashboard/components/action-items-widget.component.ts:1` | all authenticated | empty·populated | System-generated follow-up tasks (QuoteExpiring, LeadStale, InvoicePastDue, etc.) with entity links |
| AmbientModeComponent | panel | `/dashboard` | `features/dashboard/components/ambient-mode.component.ts:1` | all authenticated | active | Full-screen ambient display triggered after configured idle timeout (AMBIENT_IDLE_PREF_KEY) |
| FocusModeComponent | panel | `/dashboard` | `features/dashboard/components/focus-mode.component.ts:1` | all authenticated | active | Distraction-free focused widget view; toggled via ?focus=true queryParam |
| GettingStartedBannerComponent | state | `/dashboard` | `features/dashboard/components/getting-started-banner.component.ts:1` | all authenticated | active (empty/first-login state) | Onboarding banner shown when dashboard has no data or on first visit |

---

### REPORTS

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| ReportsComponent | page | `/reports` | `features/reports/reports.component.ts:46` | Admin·Manager·PM | loading·populated·empty (per-report) | Left-nav report selector + chart+table view for 28 built-in report types with optional date-range filter |
| ReportBuilderComponent | page | `/reports/builder` | `features/reports/components/report-builder/report-builder.component.ts:46` | Admin·Manager·PM | loading·populated·empty | Dynamic query builder — entity/field/filter/group-by/sort/chart-type selection; saved reports; CSV export |
| SankeyReportsComponent | page | `/reports/sankey` | `features/reports/components/sankey-reports/sankey-reports.component.ts:22` | Admin·Manager·PM | loading·populated·empty | Sankey flow diagrams for process-flow analysis (flow report types with date range) |
| SaveReportDialogComponent | dialog | `/reports/builder` | `features/reports/components/save-report-dialog/save-report-dialog.component.ts:25` | Admin·Manager·PM | active | Dialog to name + describe + share-flag a custom saved report |

**Report types in ReportsComponent (28 built-in)**: jobs-by-stage · overdue-jobs · time-by-user · expense-summary · lead-pipeline · job-completion-trend · on-time-delivery · average-lead-time · team-workload · customer-activity · my-work-history · my-time-log · ar-aging · revenue · simple-pnl · my-expense-history · quote-to-close · shipping-summary · time-in-stage · employee-productivity · inventory-levels · maintenance · quality-scrap · cycle-review · job-margin · my-cycle-summary · lead-sales · rd  
_(Each renders a chart + data table section inside ReportsComponent; no separate component files — all driven by `activeReport` signal switch.)_

---

### SEARCH (shell — AppHeaderComponent)

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| Global Search Bar | cluster | all authenticated routes (AppHeader) | `core/layout/app-header.component.ts:113` | all authenticated | idle·focused·searching·results-shown | Full-text search input (Ctrl+K shortcut); debounce 300ms; pipes to SearchService + AiService |
| Search Results Dropdown | panel | all authenticated routes (AppHeader) | `core/layout/app-header.component.ts:114` | all authenticated | empty·populated·ai-loading | Dropdown showing entity matches (SearchResult[]), AI suggestions (AiSearchSuggestion[]), RAG results (RagSearchResult[]) + generated answer; navigates to entity detail on click |

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
| ChatPopoutComponent | page | `/chat/popout` | `features/chat/components/chat-popout/chat-popout.component.ts:1` | all authenticated | loading·populated | Detached browser-window chat view (window.open popout); coordinated with main window via ChatBroadcastService |
| ChannelBrowserDialogComponent | dialog | `/chat` | `features/chat/components/channel-browser-dialog/channel-browser-dialog.component.ts:1` | all authenticated | loading·populated·empty | Browse + join existing channels dialog |
| ChannelSettingsDialogComponent | dialog | `/chat` | `features/chat/components/channel-settings-dialog/channel-settings-dialog.component.ts:1` | all authenticated (channel member) | active | Channel settings (rename, topic, mute, leave) for selected channel |
| CreateChannelDialogComponent | dialog | `/chat` | `features/chat/components/create-channel-dialog/create-channel-dialog.component.ts:1` | all authenticated | active | Create new chat channel (name, type, description) |
| CreateAnnouncementDialogComponent | dialog | `/chat` | `features/chat/components/create-announcement-dialog/create-announcement-dialog.component.ts:1` | all authenticated | needs-live (not in chat.component.ts imports — verify if used in popout or elsewhere) | Create broadcast/announcement message to a channel |
| ShareEntityDialogComponent | dialog | `/chat` | `features/chat/components/share-entity-dialog/share-entity-dialog.component.ts:1` | all authenticated | needs-live (not in chat.component.ts imports — verify) | Share a linked entity (job, order, etc.) into a chat conversation |
| EntityMentionPopoverComponent | panel | `/chat` | `features/chat/components/entity-mention-popover/entity-mention-popover.component.ts:1` | all authenticated | needs-live (not in chat.component.ts imports — verify) | @-mention entity picker popover within chat message input |
| ChatChannelHeaderComponent | cluster | `/chat` or `/chat/popout` | `features/chat/components/chat-channel-header/chat-channel-header.component.ts:1` | all authenticated | needs-live (not in chat.component.ts imports — likely C-02 popout sub-component) | Channel header bar (name, topic, settings button) |
| ChatChannelListComponent | panel | `/chat` or `/chat/popout` | `features/chat/components/chat-channel-list/chat-channel-list.component.ts:1` | all authenticated | needs-live (not in chat.component.ts imports — likely C-02 popout sub-component) | Sidebar channel list panel |
| ChatMessageAreaComponent | panel | `/chat` or `/chat/popout` | `features/chat/components/chat-message-area/chat-message-area.component.ts:1` | all authenticated | needs-live (not in chat.component.ts imports — likely C-02 popout sub-component) | Scrollable message history area with input |
| ChatMessageAttachmentComponent | cluster | `/chat` | `features/chat/components/chat-message-attachment/chat-message-attachment.component.ts:1` | all authenticated | needs-live (not in chat.component.ts imports — verify) | File attachment preview/download within a chat message |
| ChatThreadPanelComponent | panel | `/chat` | `features/chat/components/chat-thread-panel/chat-thread-panel.component.ts:1` | all authenticated | needs-live (not in chat.component.ts imports — verify vs C-14) | Thread reply panel side-panel for a parent message |
| ThreadPanelComponent | panel | `/chat` | `features/chat/components/thread-panel/thread-panel.component.ts:1` | all authenticated | needs-live (not in chat.component.ts imports — verify vs C-13) | Alternative/refactored thread reply panel |
| ChatPreviewPopupComponent | panel | all authenticated routes | `shared/components/chat-preview-popup/chat-preview-popup.component.ts:1` | all authenticated | empty·populated | Shell-level popup for inline chat previews (always mounted in app.component) |
| MentionRenderPipe | shared-cmp | `/chat` | `features/chat/pipes/mention-render.pipe.ts:1` | all authenticated | — | Renders @-mentions in message text (pipe, not a component; included for completeness) |

---

### APPROVALS

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| ApprovalsComponent | page | `/approvals/:tab` (→inbox) | `features/approvals/approvals.component.ts:15` | Admin·Manager·PM·OfficeManager | active | Tab shell with two tabs: Inbox (all approvers) + Workflows (Admin/Manager only via `canManageWorkflows` computed) |
| ApprovalInboxComponent | tab | `/approvals/inbox` | `features/approvals/components/approval-inbox/approval-inbox.component.ts:19` | Admin·Manager·PM·OfficeManager | loading·empty·populated | Pending approval requests table (entity type, summary, workflow, step, amount, requester, date); approve/reject actions; reject requires comment via dialog |
| Reject Approval Dialog | dialog | `/approvals/inbox` | `features/approvals/components/approval-inbox/approval-inbox.component.ts:40` | Admin·Manager·PM·OfficeManager | active | Inline dialog (showRejectDialog signal) — requires rejection comments textarea; SUBMIT REJECT action |
| ApprovalWorkflowEditorComponent | tab | `/approvals/workflows` | `features/approvals/components/approval-workflow-editor/approval-workflow-editor.component.ts:22` | Admin·Manager (canManageWorkflows) | loading·empty·populated | Workflow definitions table + create/edit dialog; configures entity type, threshold, multi-step approver chain (SpecificUser, Role, Manager) |
| Workflow Create/Edit Dialog | dialog | `/approvals/workflows` | `features/approvals/components/approval-workflow-editor/approval-workflow-editor.component.ts:44` | Admin·Manager | active | Dialog (showDialog signal) — workflow name, entity type, description, amount threshold, dynamic steps array (add/remove steps) |

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
| DashboardWidgetComponent | shared-cmp | `/dashboard` | `shared/components/dashboard-widget/dashboard-widget.component.ts:1` | all authenticated | populated | see Dashboard section |
| KpiChipComponent | shared-cmp | `/dashboard` | `shared/components/kpi-chip/kpi-chip.component.ts:1` | all authenticated | — | KPI chip displayed in dashboard header strip |
| PageHeaderComponent | shared-cmp | all platform pages | `shared/components/page-header/page-header.component.ts:1` | all authenticated | — | Page title bar with optional action buttons |
| DataTableComponent | shared-cmp | `/notifications`, `/approvals/*`, `/reports*` | `shared/components/data-table/data-table.component.ts:1` | all authenticated | loading·empty·populated | Sortable/filterable data table with column manager, pagination |
| SelectComponent | shared-cmp | `/notifications`, `/calendar`, `/reports*` | `shared/components/select/select.component.ts:1` | all authenticated | — | Dropdown select field |
| InputComponent | shared-cmp | `/notifications`, `/approvals/*`, `/reports/builder` | `shared/components/input/input.component.ts:1` | all authenticated | — | Text input field |
| ToolbarComponent | shared-cmp | `/notifications` | `shared/components/toolbar/toolbar.component.ts:1` | all authenticated | — | Page action toolbar |
| EmptyStateComponent | shared-cmp | `/approvals/*`, `/reports/builder` | `shared/components/empty-state/empty-state.component.ts:1` | all authenticated | active | Empty-state message + optional action |
| DialogComponent | shared-cmp | `/approvals/*`, `/reports/builder`, `/chat` | `shared/components/dialog/dialog.component.ts:1` | all authenticated | active | Dialog shell (title, content, footer) |
| TextareaComponent | shared-cmp | `/approvals/*` | `shared/components/textarea/textarea.component.ts:1` | all authenticated | — | Multi-line text input |
| DrillableChartComponent | shared-cmp | `/reports` | `shared/components/drillable-chart/drillable-chart.component.ts:1` | Admin·Manager·PM | active | Chart with drill-down capability; expense breakdown |
| DatepickerComponent | shared-cmp | `/reports`, `/reports/sankey` | `shared/components/datepicker/datepicker.component.ts:1` | Admin·Manager·PM | — | Date input with picker UI |
| SankeyChartComponent | shared-cmp | `/reports/sankey` | `shared/components/sankey-chart/sankey-chart.component.ts:1` | Admin·Manager·PM | empty·populated | D3-based Sankey flow diagram |
| PageLayoutComponent | shared-cmp | `/reports/builder` | `shared/components/page-layout/page-layout.component.ts:1` | Admin·Manager·PM | — | Two-panel page layout (sidebar slot + content slot) |
| ValidationButtonComponent | shared-cmp | `/approvals/*`, `/reports/builder` | `shared/components/validation-button/validation-button.component.ts:1` | all authenticated | idle·loading·disabled | Submit button with built-in loading state + validation |
| AvatarComponent | shared-cmp | `/chat`, notification-panel | `shared/components/avatar/avatar.component.ts:1` | all authenticated | — | User initials/color avatar |
| EntityLinkComponent | shared-cmp | `/dashboard` (action-items widget) | `shared/components/entity-link/entity-link.component.ts:1` | all authenticated | — | Clickable entity link (job, quote, invoice, etc.) |
| AiHelpPanelComponent | shared-cmp | AppHeader (all authenticated) | `shared/components/ai-help-panel/ai-help-panel.component.ts:1` | all authenticated | empty·populated | AI help side-panel from header; RAG-powered assistance |
| TrainingContextPanelComponent | shared-cmp | AppHeader (all authenticated) | `shared/components/training-context-panel/training-context-panel.component.ts:1` | all authenticated | active | Training context/hints panel from header |
| ChatPreviewPopupComponent | panel | all authenticated routes | `shared/components/chat-preview-popup/chat-preview-popup.component.ts:1` | all authenticated | empty·populated | Shell-level popup for inline chat entity share previews |

---

## Open Items (for live-sweep completion)

1. **PLT-Q-001** — Dashboard: all 10 widget states (empty + populated) not yet observed live. NON-SEEDED env — must seed data first (SO-00001 / PRT-00001 from prior phase).
2. **PLT-Q-002** — Dashboard: ambient-mode render (idle trigger); focus-mode render (?focus=true).
3. **PLT-Q-003** — Dashboard: widget add/remove/reset-layout edit-mode; gridstack drag/resize; CSV export.
4. **PLT-Q-004** — Reports: 28 report types — need live sweep; roleGuard(Admin/Manager/PM) so sweep as admin@.
5. **PLT-Q-005** — Reports: report-builder (entity/field/filter/chart-type forms, saved reports, CSV export).
6. **PLT-Q-006** — Reports: sankey reports (flow types, date range, chart render).
7. **PLT-Q-007–Q-015** — Chat: C-06 CreateAnnouncementDialog, C-07 ShareEntityDialog, C-08 EntityMentionPopover, C-09 ChatChannelHeader, C-10 ChatChannelList, C-11 ChatMessageArea, C-12 ChatMessageAttachment, C-13 ChatThreadPanel, C-14 ThreadPanel — NOT in chat.component.ts imports; need to verify if used in ChatPopoutComponent (C-02) or elsewhere. If unused, remove from denominator.
8. **PLT-Q-016** — Chat: C-02 ChatPopoutComponent — verify route `/chat/popout` is actually reachable (standalone route in app.routes.ts line 43-45 exists with authGuard only).
9. **PLT-Q-017** — Notifications: all states (empty/populated), preferences tab.
10. **PLT-Q-018** — Approvals: inbox with pending approvals (needs seeded approval requests); approve + reject flow.
11. **PLT-Q-019** — Approvals: workflow editor + create/edit workflow dialog; confirm Workflows tab hidden from PM/OfficeManager.
12. **PLT-Q-020** — Calendar: month/week/day view renders; PO deliveries toggle; job-click navigation.
13. **PLT-Q-021** — Search: results dropdown populated (min 2 chars); AI suggestions; RAG answer; entity-type icons.
14. **PLT-Q-022** — Notification bell: unread count badge; panel open/close; mark-read behavior.
