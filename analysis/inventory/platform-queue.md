# Platform Queue — Live Sweep & Verification Items

_Sole writer: source-cataloger. Opened: 2026-05-22. Close each item by ticking ✅ and recording what was observed._

## Seed requirement
**NON-SEEDED env** — use SO-00001 (id=1) and PRT-00001 (qty 5 @ $25) from prior phase.
Dashboard widgets and reports will render empty/meaningless without seeded data.
Seed first before driving platform routes.

---

## Open Items

| ID | Area | Item | Priority | Status |
|----|------|------|----------|--------|
| PLT-Q-001 | Dashboard | All 10 widget states (empty + populated) — seeded env required | HIGH | open |
| PLT-Q-002 | Dashboard | Ambient mode (idle trigger) and focus-mode (?focus=true) render | MEDIUM | open |
| PLT-Q-003 | Dashboard | Widget add/remove/reset-layout edit-mode; gridstack drag/resize; CSV export download | MEDIUM | open |
| PLT-Q-004 | Reports | All 28 report types (at minimum: jobs-by-stage, overdue-jobs, ar-aging) — sweep as admin@ | HIGH | open |
| PLT-Q-005 | Reports | Report-builder: entity picker, field selection, filter rows, group-by, chart-type, saved reports, CSV export | HIGH | open |
| PLT-Q-006 | Reports | Sankey reports: flow types, date range, chart render | MEDIUM | open |
| PLT-Q-007 | Chat | CreateAnnouncementDialogComponent (C-06) — not in chat.component.ts imports; verify if rendered | MEDIUM | open |
| PLT-Q-008 | Chat | ShareEntityDialogComponent (C-07) — not in chat.component.ts imports; verify | MEDIUM | open |
| PLT-Q-009 | Chat | EntityMentionPopoverComponent (C-08) — not in chat.component.ts imports; verify | MEDIUM | open |
| PLT-Q-010 | Chat | ChatChannelHeaderComponent (C-09) — not in chat.component.ts; check ChatPopoutComponent imports | MEDIUM | open |
| PLT-Q-011 | Chat | ChatChannelListComponent (C-10) — not in chat.component.ts; check ChatPopoutComponent imports | MEDIUM | open |
| PLT-Q-012 | Chat | ChatMessageAreaComponent (C-11) — not in chat.component.ts; check ChatPopoutComponent imports | MEDIUM | open |
| PLT-Q-013 | Chat | ChatMessageAttachmentComponent (C-12) — not in chat.component.ts; verify render path | MEDIUM | open |
| PLT-Q-014 | Chat | ChatThreadPanelComponent (C-13) — not in chat.component.ts; verify vs C-14 | MEDIUM | open |
| PLT-Q-015 | Chat | ThreadPanelComponent (C-14) — not in chat.component.ts; verify vs C-13 | MEDIUM | open |
| PLT-Q-016 | Chat | ChatPopoutComponent (C-02) — verify `/chat/popout` route reachable, live render | HIGH | open |
| PLT-Q-017 | Notifications | All states: empty, populated, preferences tab; mark-all-read; dismiss-all | HIGH | open |
| PLT-Q-018 | Approvals | Inbox with pending approvals (needs seeded approval requests); approve flow + reject dialog | HIGH | open |
| PLT-Q-019 | Approvals | Workflow editor: populated list, create/edit workflow dialog, step add/remove; confirm Workflows tab hidden from PM/OfficeManager | HIGH | open |
| PLT-Q-020 | Calendar | Month/week/day view renders; PO deliveries toggle; job-click→/kanban navigation | HIGH | open |
| PLT-Q-021 | Search | Search results dropdown: entity matches, AI suggestions, RAG answer panel, entity-type icons, Ctrl+K shortcut | HIGH | open |
| PLT-Q-022 | Notifications | Notification bell: unread badge, panel open/close, mark-read on panel interaction | HIGH | open |
| PLT-Q-023 | Chat | Chat panel (header): panel open/close, DM list, channel list, send message, thread open/close | HIGH | open |
| PLT-Q-024 | Chat | Chat full page (/chat): same as panel but isRoutedPage=true; popout button behavior | HIGH | open |

---

## Resolved Items

_(none yet — fill in as live sweep completes)_

---

## Notes

- C-06 through C-14 denominator adjustment: if any of these 9 chat sub-components are confirmed unused/unreachable, reduce feature denominator accordingly and note in platform.md.
- The `chat-preview-popup` (SH-21) is always mounted in app.component — verify when it renders (entity share from within chat → inline popup?).
- Dashboard KPI chips in the page header (not widget KPIs) — confirm `KpiChipComponent` usage in dashboard.component.html (imported at line 24).
- `MentionRenderPipe` (chat/pipes/mention-render.pipe.ts) — pipe, not a component; imported in chat.component.ts line 24; renders @-mentions. Note in inventory but does not count toward component denominator.
