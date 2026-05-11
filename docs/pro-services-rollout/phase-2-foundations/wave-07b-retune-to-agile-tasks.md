# Wave 7b Addendum — Retune PRESET-08/09 to Agile Task Types

**Date:** 2026-05-11

The Pro Services vocabulary captured in earlier Phase 1/2 docs was:
> Job → Project, Customer → Client, Work Center → Consultant

After implementation work began, the user clarified that this should
follow traditional agile/scrum naming, not the original triple. This
addendum captures the corrected vocabulary so the Phase 1 artifacts'
references stay readable in context.

---

## The corrected vocabulary

- **Job → Task** (the work-tracking primitive — was "Project")
- **Track Type → Task Type** (new rename; the agile category dimension)
- **Customer → Client** (unchanged)
- **Work Center → Consultant** (unchanged)
- **Planning Cycle → Sprint** (unchanged)
- **Status verbs:**
  - "In Production" → "In Progress" (was "In Delivery")
  - "Shipped" → "Done" (was "Delivered")
  - "Start Production" → "Start Work" (was "Start Delivery")
- **Label plurals:** "Jobs" → "Tasks"; "Customers" → "Clients"

The G-17 spike's conclusion holds: **Engagement = Job** at the entity
level. The terminology overlay just gives that Job a more agile-flavored
display name ("Task").

---

## Five task types replace the single Engagement track

PRESET-08 and PRESET-09 now seed five `TrackType` rows (each with its
own per-task-type status set) instead of a single "Engagement" track:

| Task type code | Stages |
|---|---|
| `ps_epic`     | Draft → Refined → In Progress → Review → Done |
| `ps_project`  | Proposal → Won → Discovery → Active Delivery → In Review → Delivered → Invoiced → Paid (the original 8-stage lifecycle — keeps SalesOrder / Invoice / Payment accounting hooks; this is the canonical agency engagement shape and the `IsDefault` track on PRESET-08) |
| `ps_story`    | Backlog → Ready → In Progress → Review → Done |
| `ps_bug`      | Reported → Triaged → In Progress → Review → Resolved → Verified |
| `ps_spike`    | Defined → In Progress → Outcome → Closed |

Codes use the `ps_` prefix to avoid colliding with manufacturing track
type codes (`production`, `rnd`, `maintenance`, etc.).

---

## What this changes in earlier Phase 1 artifacts

The following references are out of date and should be read with this
addendum in mind:

- **Artifact 1 (inventory matrix) §3 "Default track types" row** —
  references "Engagement track + stages (Proposal → Active → Wrap-up)."
  Reality: five task-type tracks, named above.
- **Artifact 4 (catalog additions) §3.6 PRESET-08 spec** — references
  "Engagement track with stages." Reality: five tracks.
- **Artifact 5 (preset format extension) §3.3 examples** — uses
  "engagement" as the track code. Reality: `ps_project` is the default
  track; `ps_epic`, `ps_story`, `ps_bug`, `ps_spike` are the others.
- **G-17 spike writeup (phase-2-foundations/spike-01-engagement-entity.md)** —
  recommends `CAP-PS-ENGAGEMENT` as the capability name; the decision
  about Job-as-the-primitive still holds, but the user-facing vocabulary
  on top is "Task" not "Engagement." Capability name unchanged.

Folder map paths also updated: `/02-Engagements/` → `/02-Tasks/` in
both Customer and Job suggestions.

---

## What did NOT change

- The G-17 architectural decision: Engagement IS a Job on a non-mfg
  TrackType. The terminology overlay decides display naming; the
  underlying entity stays `Job`.
- The capability name `CAP-PS-ENGAGEMENT`. Renaming it again to
  `CAP-PS-TASK` would churn a wider surface for marginal benefit; the
  capability description has been refined but the code stays.
- The 6 Pro Services capability codes (CAP-PS-ENGAGEMENT,
  CAP-PS-TIME-BILLABLE, CAP-PS-RATE-CARDS, CAP-PS-PROJECT-COST,
  CAP-PS-UTILIZATION, CAP-PS-RETAINER).
- The bundle schema (Artifact 5 §2). Just the *contents* of PRESET-08's
  TrackTypeBundle and TerminologyBundle changed.
- The PRESET-08 ReferenceDataBundle (engagement_type / project_phase /
  time_billable_status / etc.) — the agile vocabulary lives on the
  TrackType axis, not in reference data.

---

## Test coverage

`PresetBrowserTests.ApplyPreset08_Seeds_Terminology_RefData_TrackType_Roles`
asserts the five task-type tracks land (with the right stage counts
per type) and that the Task/Client/Consultant + "Task Type" renames
are persisted to terminology_entries.

The `entity_track_type` → "Task Type" rename was added as a new
assertion in the same test.
