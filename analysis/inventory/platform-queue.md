# Platform Queue — Live Sweep & Verification Items

_Sole writer: source-cataloger + ui-scout. Opened: 2026-05-22. Live sweep added: 2026-05-22. Cycle 2 sweep added: 2026-05-22._

## Seed requirement
**NON-SEEDED env** — use SO-00001 (id=1) and PRT-00001 (qty 5 @ $25) from prior phase.
Dashboard widgets and reports will render empty/meaningless without seeded data.
Seed first before driving platform routes.

---

## Open Items

| ID | Area | Item | Priority | Status |
|----|------|------|----------|--------|
| PLT-Q-001 | Dashboard | All 10 widget states (empty + populated) — seeded env required | HIGH | ✅ CLOSED — 9 of 10 observed live: Today's Tasks (1 task), Jobs by Stage (bar populated), Activity (2 entries), Margin Summary (100% margin/$125), Open Orders (1 SO), EOD Prompt (form), Cycle Progress (empty), Deadlines (empty), Team Load (empty). Action Items confirmed in DOM (10 total widgets). Getting Started Banner visible. |
| PLT-Q-002 | Dashboard | Ambient mode (idle trigger) and focus-mode (?focus=true) render | MEDIUM | ✅ CLOSED — both modes triggered and observed live. Focus: MY TASKS + OPEN ORDERS + EOD sections. Ambient: full-screen clock + KPIs. |
| PLT-Q-003 | Dashboard | Widget add/remove/reset-layout edit-mode; gridstack drag/resize; CSV export download | MEDIUM | ✅ PARTIALLY CLOSED — edit bar confirmed: hint text, ADD WIDGET (disabled when all shown), RESET, DONE buttons. Widget remove buttons in source (`.widget-remove-btn`). Widget-add-menu and CSV export not observed (Add Widget disabled; Export not triggered). → PLT-Q-029 for add-widget menu + CSV export. |
| PLT-Q-004 | Reports | All 28 report types (at minimum: jobs-by-stage, overdue-jobs, ar-aging) — sweep as admin@ | HIGH | ✅ PARTIALLY CLOSED — all 30 nav items confirmed live. 3 report types clicked (Jobs by Stage, Overdue Jobs, Time by User — all empty). ProductionWorker → redirected to /dashboard (confirmed). Engineer → accesses /reports (no redirect; noted discrepancy with source guard). Empty states only; populated states → PLT-Q-031. |
| PLT-Q-005 | Reports | Report-builder: entity picker, field selection, filter rows, group-by, chart-type, saved reports, CSV export | HIGH | ✅ PARTIALLY CLOSED — entity select, Saved Reports dropdown, + New Report button, empty state confirmed. Columns/filters/viz sections: source-confirmed but not triggered live (need entity selection). Save dialog unreached → PLT-Q-028. |
| PLT-Q-006 | Reports | Sankey reports: flow types, date range, chart render | MEDIUM | ✅ CLOSED — 10 diagram types confirmed live: Quote-to-Cash Pipeline, Job Stage Flow, Material to Product, Worker to Orders, Expense Flow, Vendor Supply Chain, Quality/Rejection Flow, Inventory Location Flow, Customer Revenue Breakdown, Training Completion. Date range filter with Apply button. Empty state "No flow data available". |
| PLT-Q-007 | Chat | CreateAnnouncementDialogComponent (C-06) — not in chat.component.ts imports; verify if rendered | MEDIUM | ✅ CLOSED — admin-owned; used by `features/admin/announcements-panel/`; cross-linked |
| PLT-Q-008 | Chat | ShareEntityDialogComponent (C-07) — not in chat.component.ts imports; verify | MEDIUM | ✅ CLOSED — confirmed unused; no imports anywhere; removed from denominator |
| PLT-Q-009 | Chat | EntityMentionPopoverComponent (C-08) — not in chat.component.ts imports; verify | MEDIUM | ✅ CLOSED — confirmed unused; no imports anywhere; removed from denominator |
| PLT-Q-010 | Chat | ChatChannelHeaderComponent (C-09) — not in chat.component.ts; check ChatPopoutComponent imports | MEDIUM | ✅ CLOSED — source-confirmed: ChatPopoutComponent line 19 + mobile-chat |
| PLT-Q-011 | Chat | ChatChannelListComponent (C-10) — not in chat.component.ts; check ChatPopoutComponent imports | MEDIUM | ✅ CLOSED — source-confirmed: ChatPopoutComponent line 17 + mobile-chat |
| PLT-Q-012 | Chat | ChatMessageAreaComponent (C-11) — not in chat.component.ts; check ChatPopoutComponent imports | MEDIUM | ✅ CLOSED — source-confirmed: ChatPopoutComponent line 18 + mobile-chat |
| PLT-Q-013 | Chat | ChatMessageAttachmentComponent (C-12) — not in chat.component.ts; verify render path | MEDIUM | ✅ CLOSED — confirmed unused; no imports anywhere; removed from denominator |
| PLT-Q-014 | Chat | ChatThreadPanelComponent (C-13) — not in chat.component.ts; verify vs C-14 | MEDIUM | ✅ CLOSED — source-confirmed: ChatPopoutComponent line 20 + mobile-chat (C-13 = active; C-14 = unused duplicate) |
| PLT-Q-015 | Chat | ThreadPanelComponent (C-14) — not in chat.component.ts; verify vs C-13 | MEDIUM | ✅ CLOSED — confirmed unused duplicate; not imported anywhere; removed from denominator |
| PLT-Q-016 | Chat | ChatPopoutComponent (C-02) — verify `/chat/popout` route reachable, live render | HIGH | ✅ CLOSED — live render confirmed: two-panel layout (left: "Chat" + "Search conversations" input + empty list; right: "Select a conversation to start chatting" placeholder). CAP-EXT-CHAT disabled: no conversation data. |
| PLT-Q-017 | Notifications | All states: empty, populated, preferences tab; mark-all-read; dismiss-all | HIGH | ✅ PARTIALLY CLOSED — populated state observed: 1 notification ("Sales Order Confirmed"). 3 tabs (All/Messages/Alerts) all visited. Mark-all-read button (done_all icon) confirmed. Dismiss-all in footer confirmed. Empty state not observed (had 1 notification). Preferences tab → PLT-Q-025 (full-page /notifications not visited). |
| PLT-Q-018 | Approvals | Inbox with pending approvals (needs seeded approval requests); approve flow + reject dialog | HIGH | ⚠ PARTIALLY BLOCKED — empty table observed. CAP-P2P-APPROVALS blocks API seeding (POST 403). Approve/reject buttons not rendered. Reject dialog source-confirmed but unreachable. → PLT-Q-027 |
| PLT-Q-019 | Approvals | Workflow editor: populated list, create/edit workflow dialog, step add/remove; confirm Workflows tab hidden from PM/OfficeManager | HIGH | ✅ PARTIALLY CLOSED — empty state + New Workflow button confirmed live. Engineer redirected from /approvals/workflows (confirmed role gate). PM/OfficeManager not tested. Dialog not opened live → PLT-Q-027. |
| PLT-Q-020 | Calendar | Month/week/day view renders; PO deliveries toggle; job-click→/kanban navigation | HIGH | ✅ CLOSED — month (42 cells, empty), week (7 cols, empty), day (empty) all observed. PO deliveries toggle button confirmed. Day cell click → switches to day view (no dialog). Job click navigation untested in cycle 1 (no job chips). Chip navigation confirmed in cycle 2 → PLT-Q-030. |
| PLT-Q-021 | Search | Search results dropdown: entity matches, AI suggestions, RAG answer panel, entity-type icons, Ctrl+K shortcut | HIGH | ✅ CLOSED — query "widget": 3 results (J-1/JOB, PRT-00001/PART, PRT-00002/PART). Single-column (AI disabled). Ctrl+K badge visible. Entity type badges confirmed (JOB, PART). |
| PLT-Q-022 | Notifications | Notification bell: unread badge, panel open/close, mark-read on panel interaction | HIGH | ✅ CLOSED — unread badge=1 observed. Panel open/close confirmed. |
| PLT-Q-023 | Chat | Chat panel (header): panel open/close, DM list, channel list, send message, thread open/close | HIGH | ✅ CLOSED WITH NOTE — CAP-EXT-CHAT disabled: header chat bell not rendered; panel slide-in not reachable. /chat route replaces this. Populated channel/DM states unreachable → PLT-Q-026. |
| PLT-Q-024 | Chat | Chat full page (/chat): same as panel but isRoutedPage=true; popout button behavior | HIGH | ✅ CLOSED — /chat renders: DM section ("No conversations yet" + "+ NEW MESSAGE"), Channels section ("No channels" + Browse Channels). isRoutedPage=true confirmed (no close button). Popout button: source-present but unreachable (cap-gated). |
| PLT-Q-025 | Notifications | `/notifications` full-page route (N-01): search/filter bar, All/Preferences tabs, preferences toggles, data-table view | HIGH | ✅ CLOSED — confirmed live (cycle 2). Title: "Notifications / View and manage all your alerts and messages". Custom `.tab` buttons (not mat-tab): "All Notifications" + "Preferences". Search bar: mat-form-field text input. Data table cols: Title, Message, Severity, Source, Date (all sortable) + gear column. 1 row visible (Sales Order Confirmed). Preferences tab HTML confirmed: "Email Notifications" section (Critical Alerts, Job Assignments, Mentions — all `toggle_on`) + "In-App Notifications" section (Sound + more). Custom `.pref-row` divs with `role="button"` and `pref-row__toggle--on/off` material icon toggle. PM + WORKER both access /notifications (no redirect). |
| PLT-Q-026 | Chat | All channel/DM/thread/compose sub-components in populated state (C-03 to C-05, C-09 to C-13): channel-view, message-area, thread-panel, create-channel dialog, channel-browser, channel-settings, compose input, file attach | HIGH | open — CAP-EXT-CHAT disabled; needs cap-enabled env |
| PLT-Q-027 | Approvals | Approve + reject flows with pending approval item; workflow create/edit dialog + step add/remove; PM/OfficeManager tab visibility | HIGH | open — CAP-P2P-APPROVALS disabled at API; inbox always empty |
| PLT-Q-028 | Reports | Report Builder: entity selection → columns/filters/group/viz sections; run report; save dialog (RP-44) | MEDIUM | ✅ PARTIALLY CLOSED — entity picker confirmed live (cycle 2): 11 entity options (Jobs, Parts, Customers, Expenses, Time Entries, Invoices, Leads, Assets, Purchase Orders, Sales Orders, Quotes). Saved Reports dropdown + New Report button confirmed. API: 28 entities total, Jobs has 35 fields (`/api/v1/report-builder/entities`). Columns/filters/group-sort/viz sections guarded by `@if (availableFields().length > 0)` (HTML line 25) — did not render in headless sweep despite entity selection (Playwright issue). Run Report + Save both disabled until columns selected (`canRun = entity set + selectedColumns.length > 0`). Source-confirmed: 5 sections (Data Source, Columns, Filters, Group+Sort, Visualization), CSV export button (`@if (reportResults())`), chart canvas (baseChart), drill-down filter chip. → Columns cascade + run + save dialog + CSV remain unobserved live. |
| PLT-Q-029 | Dashboard | Widget-add-menu contents (when some widgets removed); widget remove flow; CSV export | LOW | ✅ CLOSED — confirmed live (cycle 2). Edit mode via "edit  Customize" button. Widget remove: `.widget-remove-btn` buttons (8-10 found). Add Widget menu: inline `div.widget-add-menu` (not cdk-overlay), absolute-positioned. Items confirmed: Today's Tasks (task_alt icon), Jobs by Stage (bar_chart), Team Load (groups) — the 3 currently-removed widgets. Each item: `button.widget-add-menu__item` with `.widget-add-menu__icon` (mat-icon) + `.widget-add-menu__label`. Export button ("download Export") confirmed on dashboard header. Export also in report-builder (`@if reportResults()` triggers CSV export). |
| PLT-Q-030 | Calendar | Job-chip populated state + click navigation (need jobs with due dates); PO event chip (need POs with delivery dates) | MEDIUM | ✅ CLOSED — confirmed live (cycle 2). Seeded J-1 due date via `PUT /api/v1/jobs/1`. Month view: `div.job-chip` with job number + title. Week view: `div.job-chip.job-chip--week` showing "J-1 / Test widget / Acme Corp". Chip click → navigated to `/kanban?jobId=1` ✓. PO event chip not observed (no POs with delivery dates in env). |
| PLT-Q-031 | Reports | Populated data states for all 28 report types (most empty; only SO-00001/J-1 data available) | LOW | open — 7 report types checked (jobs-by-stage, overdue-jobs, revenue, sales-order-summary, ar-aging, material-usage, inventory-valuation): all rows=0. Single SO-00001/J-1 insufficient to populate any report type in this env. Need richer seeded data. |
| PLT-Q-032 | Search | AI column + RAG answer panel (AI feature disabled in this env) | LOW | open — AI gated off; need AI-enabled env |

---

## Resolved Items

| ID | Resolved | Summary |
|----|----------|---------|
| PLT-Q-007 | 2026-05-22 | C-06 CreateAnnouncementDialog → admin-owned (admin/announcements-panel); cross-linked |
| PLT-Q-008 | 2026-05-22 | C-07 ShareEntityDialog → confirmed unused; no imports |
| PLT-Q-009 | 2026-05-22 | C-08 EntityMentionPopover → confirmed unused; no imports |
| PLT-Q-010 | 2026-05-22 | C-09 ChatChannelHeader → source-confirmed in ChatPopoutComponent + mobile-chat |
| PLT-Q-011 | 2026-05-22 | C-10 ChatChannelList → source-confirmed in ChatPopoutComponent + mobile-chat |
| PLT-Q-012 | 2026-05-22 | C-11 ChatMessageArea → source-confirmed in ChatPopoutComponent + mobile-chat |
| PLT-Q-013 | 2026-05-22 | C-12 ChatMessageAttachment → confirmed unused; no imports |
| PLT-Q-014 | 2026-05-22 | C-13 ChatThreadPanel → source-confirmed in ChatPopoutComponent + mobile-chat |
| PLT-Q-015 | 2026-05-22 | C-14 ThreadPanel → confirmed unused duplicate (stateful impl superseded by C-13) |
| PLT-Q-025 | 2026-05-22 | /notifications full-page: custom tab-bar (.tab), search bar, data-table (5 sortable cols + gear), Preferences tab with Email+In-App sections using .pref-row custom toggles |
| PLT-Q-029 | 2026-05-22 | Widget-add-menu: inline div.widget-add-menu (not overlay), button.widget-add-menu__item items confirmed (Today's Tasks/Jobs by Stage/Team Load). Export button confirmed on dashboard header. |
| PLT-Q-030 | 2026-05-22 | Calendar job-chip: month (div.job-chip) + week (div.job-chip--week) confirmed after seeding due date. Chip click → /kanban?jobId=1 confirmed. |

---

## Notes

- **Denominator corrected**: 38 → 32 feature + 21 shared = 53 total (5 chat components removed: C-06 admin-owned, C-07/C-08/C-12/C-14 unused).
- C-09/C-10/C-11/C-13 also used by `features/mobile/pages/mobile-chat.component.ts` (cross-region usage; components owned by platform/chat).
- The `chat-preview-popup` (SH-21) is always mounted in app.component — verify when it renders (entity share from within chat → inline popup?).
- Dashboard KPI chips in the page header (not widget KPIs) — confirm `KpiChipComponent` usage in dashboard.component.html (imported at line 24).
- `MentionRenderPipe` (chat/pipes/mention-render.pipe.ts) — pipe, not a component; imported in chat.component.ts line 24; renders @-mentions. Note in inventory but does not count toward component denominator.
- **Report Builder column cascade (PLT-Q-028)**: API endpoint `/api/v1/report-builder/entities` returns 28 entity definitions with fields (Jobs has 35). Columns section is `@if (availableFields().length > 0)`. Cascade did not trigger in headless Playwright — entity selection sets form control to "Jobs" but `selectedEntity()` computed signal returns null (signal timing/batching issue in headless). Source-confirmed: 5 builder sections exist. Dequeue requires a non-headless or interactive session.
- **Notifications preferences UI pattern**: tabs are custom `button.tab` (not mat-tab-label); preference toggles are custom `div.pref-row[role=button]` with `span.pref-row__toggle.pref-row__toggle--on/off` (material icon), not mat-slide-toggle.
- **Dashboard edit mode trigger**: "edit  Customize" button (`.btn` class, not icon-only). Edit bar shows: Done (`.btn.btn--primary`), Add Widget (`.btn`). Widget remove: `.widget-remove-btn` buttons on each active widget.
- **Calendar seeding**: `PUT /api/v1/jobs/{id}` with `{ dueDate: "YYYY-MM-DD" }` adds job to calendar. PATCH returns 405; PUT returns 200.
