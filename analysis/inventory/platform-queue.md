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
| PLT-Q-007 | Chat | CreateAnnouncementDialogComponent (C-06) — not in chat.component.ts imports; verify if rendered | MEDIUM | ✅ CLOSED — admin-owned; used by `features/admin/announcements-panel/`; cross-linked |
| PLT-Q-008 | Chat | ShareEntityDialogComponent (C-07) — not in chat.component.ts imports; verify | MEDIUM | ✅ CLOSED — confirmed unused; no imports anywhere; removed from denominator |
| PLT-Q-009 | Chat | EntityMentionPopoverComponent (C-08) — not in chat.component.ts imports; verify | MEDIUM | ✅ CLOSED — confirmed unused; no imports anywhere; removed from denominator |
| PLT-Q-010 | Chat | ChatChannelHeaderComponent (C-09) — not in chat.component.ts; check ChatPopoutComponent imports | MEDIUM | ✅ CLOSED — source-confirmed: ChatPopoutComponent line 19 + mobile-chat |
| PLT-Q-011 | Chat | ChatChannelListComponent (C-10) — not in chat.component.ts; check ChatPopoutComponent imports | MEDIUM | ✅ CLOSED — source-confirmed: ChatPopoutComponent line 17 + mobile-chat |
| PLT-Q-012 | Chat | ChatMessageAreaComponent (C-11) — not in chat.component.ts; check ChatPopoutComponent imports | MEDIUM | ✅ CLOSED — source-confirmed: ChatPopoutComponent line 18 + mobile-chat |
| PLT-Q-013 | Chat | ChatMessageAttachmentComponent (C-12) — not in chat.component.ts; verify render path | MEDIUM | ✅ CLOSED — confirmed unused; no imports anywhere; removed from denominator |
| PLT-Q-014 | Chat | ChatThreadPanelComponent (C-13) — not in chat.component.ts; verify vs C-14 | MEDIUM | ✅ CLOSED — source-confirmed: ChatPopoutComponent line 20 + mobile-chat (C-13 = active; C-14 = unused duplicate) |
| PLT-Q-015 | Chat | ThreadPanelComponent (C-14) — not in chat.component.ts; verify vs C-13 | MEDIUM | ✅ CLOSED — confirmed unused duplicate; not imported anywhere; removed from denominator |
| PLT-Q-016 | Chat | ChatPopoutComponent (C-02) — verify `/chat/popout` route reachable, live render | HIGH | open (live render still needed) |
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

---

## Notes

- **Denominator corrected**: 38 → 32 feature + 21 shared = 53 total (5 chat components removed: C-06 admin-owned, C-07/C-08/C-12/C-14 unused).
- C-09/C-10/C-11/C-13 also used by `features/mobile/pages/mobile-chat.component.ts` (cross-region usage; components owned by platform/chat).
- The `chat-preview-popup` (SH-21) is always mounted in app.component — verify when it renders (entity share from within chat → inline popup?).
- Dashboard KPI chips in the page header (not widget KPIs) — confirm `KpiChipComponent` usage in dashboard.component.html (imported at line 24).
- `MentionRenderPipe` (chat/pipes/mention-render.pipe.ts) — pipe, not a component; imported in chat.component.ts line 24; renders @-mentions. Note in inventory but does not count toward component denominator.
