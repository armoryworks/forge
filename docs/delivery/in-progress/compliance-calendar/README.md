---
title: Compliance Calendar → generalized event organizer
type: delivery
status: in-progress
id: compliance-calendar
owner:
updated: 2026-07-02
---

# Compliance Calendar → generalized event organizer

> **Status: IMPLEMENTATION IN PROGRESS — Stages 1–4 done & verified; Stage 5 next (2026-07-03).** Derived from
> the 2026-07-02 planning session, cluster A of
> `delivery/pending/functional-backlog-2026-07-02`. All five design forks (A‑1…A‑5)
> are decided (see [Locked decisions](#locked-decisions)). This spec is ready to
> code against once the [kickoff reconciliation](#reconciliation-with-existing-code)
> is confirmed against live code.

## Implementation progress

Branch `feature/compliance-calendar` (forge-api + forge-db), not yet merged to main
(schema migration → branch per repo convention).

- [x] **Stage 1a — taxonomy tables.** `CalendarSuperGroup` + `CalendarEventType`
  entities/configs (forge-api), `calendar_super_groups` / `calendar_event_types`
  tables + indexes + FK (forge-db), schema re-assembled, DbSets registered.
  Verified: `dotnet build -c Release -warnaserror` green; round-trip + unique-key
  test against real Postgres green (`CalendarTaxonomySchemaTests`). Entity names are
  `Calendar`-prefixed to avoid colliding with the legacy `EventType` enum.
- [x] **Stage 1b — Event linkage + seed/backfill.** Added `Event.EventTypeId` FK
  (nullable, expand phase) + nav; `events.event_type_id` column/FK/index (forge-db);
  `SeedData.Calendar` seeds 3 baseline Super-Groups + the 4 legacy-promoted Event-Types
  and backfills existing events from the enum (idempotent, wired into boot seed).
  Verified: Release `-warnaserror` green; seed/backfill + round-trip tests on real
  Postgres green (`CalendarTaxonomySeedTests`). Legacy `event_type` enum column
  retained until Stage 7 (contract).
- [x] **Stage 1c — ACL + saved-view entities.** `CalendarSuperGroupRoleVisibility`
  (A-2 per-group role allow-list; unique (group,role), cascade on group delete) +
  `CalendarSavedView` (A-3; `int[]` layer selections, personal/role-default, master vs
  `module:<area>` scope). Entities/configs/DbSets + forge-db tables/indexes/FK.
  Verified: Release `-warnaserror` green; round-trip + unique-grant tests on real
  Postgres green (`CalendarAclSavedViewSchemaTests`). **`RegulatoryChangeProposal`
  deferred to Stage 8** — it is the Watchtower (cluster B) hook and B isn't built;
  building it now would risk rework.
- [x] **Stage 2 — server-side ACL enforcement.** `ICalendarVisibilityService` /
  `CalendarVisibilityService` computes visible Super-Group ids from the user's roles +
  the allow-list (Admin/null-user → unrestricted). Enforced in `GetEvents` (filter) and
  `GetEventById` (non-visible → 404, no existence leak). No schema change. Verified:
  Release `-warnaserror` green; 24 calendar+Events tests green incl. 3 new visibility
  tests. Note: `GetUpcomingEventsForUser` left unfiltered by design — it's already
  attendee-scoped (being invited is its own grant).
- [x] **Stage 3 — overlay calendar COMPLETE.** `GET /api/v1/calendar/super-groups`
  (`GetCalendarSuperGroups` + `CalendarController`, visibility-filtered);
  `CreateEvent`/`UpdateEvent` accept `EventTypeId` (validated; enum dual-write during
  expand); forge-ui `CalendarSuperGroup`/`CalendarEventType` models +
  `calendar.service.getSuperGroups()` + `CalendarLayersComponent` (dumb layer list) +
  wired into the calendar as a collapsible panel with pref-persisted selection.
  Verified: API Release/-warnaserror + Postgres tests green; UI lint + i18n-parity +
  build green. `EventResponseModel` now carries `superGroupId`/`eventTypeId`, and the
  **all three views (month/week/day) render events filtered by the selected layers**
  (colour per layer, degrades to empty if events are gated), and the admin events
  dialog has an **Event-Type picker** (populated from the visibility-filtered taxonomy;
  `eventTypeId` flows through create/update). Verified: API + UI gates green throughout.
  Calendar controller is `[Authorize]`-only for now (see `blocking-questions.md`).
- [~] **Stage 4 — saved views DONE; module-embedded scoped calendar pending.**
  `GET/POST/DELETE /api/v1/calendar/saved-views` (personal + role-default, scope-aware,
  ownership-guarded delete) + UI: the layer panel has a saved-view selector (applies a
  view's layers), a save-current-as control, and applies a role-default view on load.
  Verified: API Release/-warnaserror + Postgres test green; UI lint + i18n + build green.
  **Remaining:** embed a scope-filtered calendar in the compliance module
  (`scope: module:compliance`) — a routing/embedding task once a compliance module route exists.
- [ ] Stages 5–8 — see [staged plan](#staged-plan-proposed). Stage 8 (Watchtower
  integration incl. `RegulatoryChangeProposal`) is blocked on cluster B.

## Goal

Rebuild the Calendar around an abstract **`Event → Event-Type → Super-Group`**
hierarchy. Compliance is the first driver, but Super-Groups are a *general*
organizing primitive for any event-driven important items (maintenance, tax, HR
deadlines, production milestones). The current calendar is a **read-only**
visualization of job due-dates + PO deliveries; this makes it authorable,
role-scoped, and the home of a seeded compliance program.

Supersedes the fixed 4-value event-type enum. Absorbs three other cluster-A items:
"multiple calendars + master" (via the overlay model), "forced-acknowledgement
alerts" (reminder-tier escalation), and "calendar items link to a doc/URL" (evidence).

---

## Reconciliation with existing code

**This is the #1 thing to confirm at kickoff — the design assumes it.**

Forge already has:
- **`Event` entity** (`forge.core/Entities/Event.cs`) — `Title`, `Start/EndTime`,
  `Location`, `EventType` (enum), `IsRequired`, `IsCancelled`, `ReminderSentAt`,
  `IsAllDay`, `IsSystemGenerated`, `Attendees`. Good base — already has all-day,
  reminders, required flag, system-generated flag, attendee collection.
- **`EventType` enum** (`forge.core/Enums/EventType.cs`) = `Meeting | Training |
  Safety | Other`. **This is the backlog's "fixed 4-value event-type enum."**
- **Events feature** (`admin/events`, `EventsController`, `Event`/`EventAttendee`)
  for meetings/training/safety with RSVP + reminder job.
- **Calendar** (`/calendar`, `CalendarComponent`) — read-only job + PO-delivery
  overlay; no create/edit.

**Chosen approach: extend, don't fork.**
- **Promote the `EventType` enum → an `EventType` reference table** (configurable,
  admin-CRUD) with an FK to a new **`SuperGroup`** table. The four enum values
  become *seeded* Event-Types under appropriate Super-Groups (e.g. `Safety` under a
  Safety super-group; `Training` under HR/People; `Meeting` under an Operations/
  General super-group).
- **Extend the existing `Event` entity** rather than introduce a parallel one:
  swap the `EventType` enum field for `EventTypeId` FK, add recurrence + the tiered
  workflow fields. The existing Events (meetings/training/safety) become ordinary
  events under seeded types — one unified model.
- **Jobs + PO deliveries stay synthetic overlay layers** (not `Event` rows) for
  now; they render as their own toggleable layers alongside Super-Group layers.

> ⚠️ Verify at kickoff: every current read/write of the `EventType` enum and the
> `Event` entity (EventsController, reminder job, calendar synth, seed data) must be
> migrated to the FK. Enum→table is a breaking data migration — additive columns
> first, backfill, then drop the enum column (expand/contract).

---

## Locked decisions

| # | Fork | Decision |
|---|------|----------|
| **A‑1** | Event-Type membership | **Pure single-parent tree.** Each Event-Type → exactly one Super-Group; each Event → exactly one Event-Type. No tags, no multi-label. Multi-group appearance = **deliberate duplicate**. |
| **A‑2** | Access control | **Per-Super-Group role mapping**, enforced server-side. Operational groups default-visible; compliance/regulated groups default-hidden, granted to Compliance/Manager/Admin roles. |
| **A‑3** | Display | **Overlay model**: Super-Group layers = "calendars," all-on = master consolidating calendar. **Role-default + personal saved views.** Compliance (and a few others) also get a **module-embedded scoped calendar** in their functional area that still rolls up to master. |
| **A‑4** | Event depth | **Tiered.** Reminders by default; an Event-Type/Super-Group flagged **`requiresTracking`** upgrades its events to workflow objects (status, owner, completion stamp, evidence). Forced-ack = escalation; doc/URL = evidence. |
| **A‑5** | Seed upkeep | **Recurrence-rule seeds**, admin-activated, refreshed via the **cluster-E signed update bundle**, **plus live Watchtower (cluster B) sync** that *proposes* changes for admin confirmation. Air-gapped degrades to rules + bundle + "seed as-of ⟨date⟩". ATF/FDA gated on industry. |

### Resolved deferred details
- **Duplicate linkage (A‑1):** deliberate duplicates share a nullable
  `LinkedEventGroupId`. Editing one offers "update the N linked copies too."
  Duplicates are otherwise independent rows honoring their own group's ACL.
- **Status set (A‑4):** `Open → InProgress → Done`, plus `Waived` (with reason) and
  derived `Overdue`. Only present on `requiresTracking` events.
- **Forced-ack (A‑4):** an alert flag `IsBlocking` + `AcknowledgedByUserId/At`;
  blocking modal on the reminder tier, "eventually audible" per backlog.
- **Evidence (A‑4):** link to a **`DocumentSet`** (the new doc-management entity
  from cluster E) *or* an external URL. Reuses `DocumentSetLink`.
- **Watchtower interface (A‑5):** Watchtower emits `RegulatoryChangeProposal`s
  referencing an Event/EventType; admin confirm → apply. Calendar never mutates
  from an external source without confirmation (guards the I‑9 "36 hours" trap).

---

## Proposed data model

New / changed (`forge.core/Entities`, `forge.data/Configuration`, `forge-db`):

- **`SuperGroup`** — `Id, Key, Name, Description, IsSystem, SortOrder, DefaultVisible,
  IndustryGate (nullable enum: Firearms/Food/Medical/…), Color`.
- **`EventType`** — `Id, SuperGroupId (FK), Key, Name, Color, RequiresTracking,
  IsSystem, SortOrder`. Replaces the enum.
- **`Event`** (extend existing) — add `EventTypeId (FK)`, `RecurrenceRule` (RFC-5545
  RRULE string, nullable = one-off), `LinkedEventGroupId (nullable)`, seed provenance
  (`SeedKey`, `SeedAsOf`), and — when the type `RequiresTracking` — `Status`,
  `OwnerUserId`, `CompletedByUserId/At`, `WaivedReason`. Keep `IsBlocking`/
  `AcknowledgedAt` for forced-ack. Evidence via `DocumentSetLink` or `ExternalUrl`.
- **`SuperGroupRoleVisibility`** — `SuperGroupId, Role`. The A‑2 allow-list.
- **`CalendarSavedView`** — `Id, Name, OwnerUserId (nullable = role-default),
  RoleKey (nullable), Scope (Master | Module:<area>), SelectedSuperGroupIds,
  SelectedEventTypeIds, IsDefault`.
- **`RegulatoryChangeProposal`** (A‑5 hook) — `Id, SourceRef, TargetEventTypeId/EventId,
  ProposedChange (json), Status (Pending/Applied/Dismissed), ReviewedBy/At`.

Recurrence: store RRULE; expand to occurrences server-side for a date window
(don't materialize infinite rows). One-off events have null RRULE.

---

## Staged implementation plan (proposed)

1. **Model + migration (expand):** `SuperGroup`, `EventType` table, `Event` FK +
   new columns (additive/nullable), role-visibility, saved views. Seed the four
   legacy enum values as Event-Types; backfill existing `Event` rows.
2. **Server-side ACL:** enforce Super-Group visibility on every Event read (calendar,
   planning, dashboard, EventsController). Default-deny for shop-floor.
3. **Authorable calendar + overlay UI:** checkbox layer list (Super-Groups → nested
   Event-Types), filter chips, create/edit. Retire read-only limitation.
4. **Saved views:** role-default + personal; module-embedded scoped calendar
   component (compliance area first).
5. **Tiered workflow:** status/owner/completion/evidence on `requiresTracking`
   events; forced-ack blocking modal; DocumentSet evidence linkage.
6. **Recurrence + seeding:** RRULE engine; seeded compliance Super-Groups/Types as
   recurring, admin-activated suggested defaults; "seed as-of" disclaimer; ATF/FDA
   industry gating.
7. **Contract migration:** drop the `EventType` enum column once all reads use the FK.
8. **Watchtower integration (depends on cluster B):** `RegulatoryChangeProposal`
   inbox + admin confirm/apply. Bundle-refresh of seeds (depends on cluster E).

Migration safety: additive columns + backfill before any drop (expand/contract);
`pg_dump` before the contract step.

---

## Open questions / verify at kickoff

- Confirm the enum→table migration touch-points (EventsController, reminder job,
  calendar synth, any seed/i18n referencing `EventType`).
- Should the existing Events **RSVP/attendee** model extend to all event types, or
  stay meeting/training-only? (Likely keep attendees optional, meeting-centric.)
- Default seed Super-Group list + which get module-embedded scoped calendars
  (compliance + ? maintenance? HR?).
- Role catalog: does "Compliance Officer" exist, or do we grant via Manager/Admin +
  a new role? (See `roles-auth.md`.)

## Cross-links
- Backlog cluster A — `delivery/pending/functional-backlog-2026-07-02`.
- Regulatory sources (B) — reference `regulatory-source-inventory` (`docs/domain/`).
- Air-gap bundle (E) — seed refresh vehicle; effort TBD.
- Existing: `functional-reference/calendar.md`, `functional-reference/events.md`,
  `functional-reference/notifications.md`, `roles-auth.md`.
