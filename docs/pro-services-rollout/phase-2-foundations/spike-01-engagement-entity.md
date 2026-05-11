# Spike 01 — Where do Pro Services Engagements live?

**Question:** Phase 1 Artifact 3 task **G-17** asks whether Pro Services engagements should (A) extend the existing `Project` entity with axis fields, or (B) stand up a new `Engagement` entity. The hypothesis was (A) because `Project` was "lightly used."

**Spike outcome:** Neither A nor B. **Path C — Engagements are Jobs on the Engagement track type.**

This spike walks the evidence and explains why.

---

## What I found in the code

### Project is NOT lightly used

The Artifact 3 hypothesis was wrong. `Project` is a fully-built **project accounting** entity:

- **Fields:** `BudgetTotal`, `ActualTotal`, `CommittedTotal`, `EstimateAtCompletionTotal`, `RevenueRecognized`, `PercentComplete`, `PlannedStartDate / EndDate`, `ActualStartDate / EndDate`
- **Child entities:** `WbsElement` (Work Breakdown Structure, hierarchical), `WbsCostEntry` (per-element actual costs)
- **API:** Full controller (`ProjectsController`) with 13 endpoints including `/summary`, `/earned-value`, `/recalculate`, `/wbs/{id}/link-job`
- **Service:** `IProjectAccountingService` (with `MockProjectAccountingService` impl) — earned-value metrics, project totals roll-up
- **Migration:** `20260412175829_AddBackToBackKanbanProjectAccounting` — landed as part of the back-to-back kanban + project accounting feature
- **Gated by:** `CAP-EXT-PROJECT` (renamed in spec from `CAP-EXT-PROJECTS` — only enabled in PRESET-07 Enterprise today)
- **UI:** None today. Backend-only. (No `features/projects/` folder.)

This is heavyweight financial project tracking aimed at large engineering / construction / enterprise installs — the kind of thing that integrates with earned-value reporting and PMI-style WBS hierarchies. Not a Pro Services "engagement" tracker.

### Job IS the work-tracking primitive

The codebase has a different "lightly used" entity worth looking at: **Job**.

- Every track type has Jobs; every kanban card IS a Job
- Already linked to Customer, Part, Asset, ActivityLog, TimeEntry, ClockEvent, BOM revision, Sales Order Line, MRP planned order
- Already carries financial fields: `EstimatedMaterialCost`, `EstimatedLaborCost`, `EstimatedBurdenCost`, `EstimatedSubcontractCost`, `QuotedPrice`
- Already has internal-project support: `IsInternal`, `InternalProjectTypeId`
- Has a `ParentJobId` self-link, R&D `IterationCount`, accounting external ref
- Has 56 properties across all features it integrates with
- **Tagged 🏷️ (renamable) in Artifact 1's inventory matrix** — "Job → Engagement" is the headline rename

The CLAUDE.md Phase 3 WU-18 design decision is informative here:

> SO is a query-side projection over Job stages, not a standalone entity.

The codebase already treats Job as the work-tracking primitive that other concepts project over. Sales Orders are projections of Job. **Engagements should be too.**

### PRESET-08 already implies this

In Artifact 5 §3.3 example, PRESET-08's `TrackTypeBundle` already creates an **Engagement** track type with stages (Proposal → Won → Discovery → Active → Review → Delivered → Invoiced → Paid). Jobs live on track types. **Jobs on the Engagement track type ARE the engagements.**

The terminology bundle's `entity_job: "Engagement"` rename already exists in the Artifact 5 PRESET-08 example. The whole rollout was building toward this without naming it.

---

## Path comparison

### Path A — Extend Project with axis fields (original hypothesis)

| | |
|---|---|
| Effort | 3-4 days (Artifact 3 estimate). **REVISED: 6-8 days.** Project's WBS/earned-value baggage adds work to cap-gate features Pro Services doesn't need. |
| Pro | Single source of truth for project-shaped entities |
| Con | Project is the wrong primitive. Its semantics (earned value, WBS hierarchy, PMI-style budgeting) are not what an engagement is. Service shops would carry heavyweight financial fields they never use. Project also has no UI — building Pro Services on it means building UI from scratch. |
| Con | Terminology gets weird: Pro Services renames "Project" to "Engagement," but Enterprise installs still see "Project" with the same backing entity — two different mental models on one table. |

### Path B — New `Engagement` entity

| | |
|---|---|
| Effort | 7-9 days. New entity + table + EF config + CRUD handlers + controller + repository + Customer/Status/Budget de-duplication with Project. |
| Pro | Clean semantics. Engagement and Project are clearly different things. |
| Con | Two entities that look similar (both have Customer FK, status, budget). Future "should this go on Project or Engagement?" decisions multiply. |
| Con | Doesn't reuse existing kanban / time-tracking / activity-log integration. Need to re-wire all of that for Engagement. |
| Con | Doesn't match the WU-18 design pattern (Job is the primitive; other concepts project over it). |

### Path C — Engagements are Jobs on the Engagement track type (recommended)

| | |
|---|---|
| Effort | 2-3 days. Add axis fields to Job (gated by `CAP-PS-PROJECT`); Engagement track type comes from PRESET-08 bundle (already specced in Artifact 5); terminology renames Job → Engagement (already in PRESET-08 bundle). |
| Pro | Massive reuse. Kanban, time tracking, customer linkage, activity log, status entries, file attachments, billable hours, costing — all work for free. |
| Pro | Matches the established pattern (WU-18: Job is the primitive). |
| Pro | The Engagement track type is the bridge: stages match service-shop semantics (Proposal → Discovery → Active → Delivered → Invoiced → Paid) while leaving the Job entity's manufacturing-flavored stages on other track types untouched. |
| Pro | Project entity stays available (unchanged) for Enterprise installs that want real earned-value project accounting on top of their Jobs. The `ProjectId` FK on `WbsElement` continues to work; we could later add a `JobId` link from `WbsElement` if Pro Services adopts WBS. |
| Con | Job carries some manufacturing baggage (Disposition enum, ParentJobId, PartId, BomRevisionIdAtRelease). These are nullable today — Pro Services Jobs simply don't fill them. Cap-gating the UI surfaces (Disposition picker, Part picker, BOM revision link) is light work. |
| Con | "Job" as a service shop's primary entity is sub-optimal vocabulary. Solved by terminology overlay (already in PRESET-08 bundle). |

---

## Why C wins

Three reinforcing reasons:

1. **The work is already in Artifact 5.** PRESET-08's TrackTypeBundle creates the Engagement track + stages. PRESET-08's TerminologyBundle renames Job → Engagement. The bundle apply pipeline (Artifact 5 §4) sews this together. Path C makes the engagement entity story consistent with the bundle story.

2. **Job is already overloaded — productively.** The R&D / Internal / Maintenance / Production track types all use Job today with slight semantic variations driven by track type. Pro Services Engagement is "yet another track-type-driven variation" — exactly the pattern Job was built for.

3. **Project's heavy financial features are orthogonal.** Project = "here's a multi-month thing with WBS, budget, earned value." Engagement = "here's a client thing with a billing model, hours bought, deliverables." A shop that grows into needing project accounting can later wire Project to its Jobs via the existing `LinkJobToWbs` endpoint. Path C doesn't preclude Path A; it sequences them in the right order.

---

## Implications for the rest of Phase 2

### Capability changes

**Removed** from Artifact 4 §1:
- ~~`CAP-PS-PROJECT` (separate Engagement entity gate)~~

**Replaced with:**
- `CAP-PS-ENGAGEMENT` — Pro Services engagement features on Job. Toggles UI surfaces (engagement axis fields on Job detail, Engagement track type visibility, etc.).
- `CAP-PS-PROJECT-COST` retains its meaning but now means "project-style costing on Job-with-engagement-axes," not "costing for the Engagement entity."

The other Pro Services caps (`CAP-PS-RETAINER`, `CAP-PS-TIME-BILLABLE`, `CAP-PS-RATE-CARDS`, `CAP-PS-UTILIZATION`) are unaffected.

### Schema changes

**Removed** from Artifact 4 §3.6:
- ~~`engagement_axes` on `projects` table~~

**Replaced with:** `engagement_axes` on `jobs` table:

```sql
ALTER TABLE jobs ADD COLUMN engagement_type_id BIGINT REFERENCES reference_data(id);
ALTER TABLE jobs ADD COLUMN project_phase_id BIGINT REFERENCES reference_data(id);
ALTER TABLE jobs ADD COLUMN billing_model TEXT;  -- 't_and_m' | 'fixed_bid' | 'retainer'
ALTER TABLE jobs ADD COLUMN retainer_hours NUMERIC(10,2);
ALTER TABLE jobs ADD COLUMN retainer_balance_hours NUMERIC(10,2);
ALTER TABLE jobs ADD COLUMN sow_id BIGINT;  -- nullable FK to quotes (SOW lives in Quote per spec)
```

`Job.budget_amount` / `Job.budget_currency` are NOT added — Job already carries `QuotedPrice` + cost estimates which serve the same purpose.

### TimeEntry → Job linkage

`TimeEntry.ProjectId` (proposed in Artifact 4 §3.7) becomes `TimeEntry.JobId` for engagements. Job-linked time entries already exist in the schema. Pro Services billable hours are TimeEntries on Engagement-track Jobs with `IsBillable = true`.

### Deliverable entity

`Deliverable` (Artifact 4 §4.6) keeps its `JobId` FK (already in the spec) and drops the `ProjectId` FK as the primary link. Pro Services deliverables hang off Jobs (engagements), not Projects.

### Workflow definitions

G-12 (Pro Services workflow definition) targets Job (engagement-track) intake, not a separate Engagement entity. Same effort estimate.

### Apply-preset pipeline

Unchanged. PRESET-08's TrackTypeBundle creates the Engagement track + stages. PRESET-08's TerminologyBundle renames Job → Engagement. The Path C decision just confirms the existing design.

---

## Revised Phase 2 effort

Original Artifact 4 §7 estimate for Phase 2 foundations: ~21 days (no provider builds).

After Path C revision:

| Item | Original | Revised | Delta |
|---|---|---|---|
| Project axis columns + entity updates | 1 | — | -1 |
| Job axis columns + entity updates | — | 1.5 | +1.5 |
| `CAP-PS-PROJECT` registration | (in 0.5) | — | — |
| `CAP-PS-ENGAGEMENT` registration | — | (in 0.5) | — |
| TimeEntry.ProjectId → TimeEntry.JobId | — | (already in Job) | -0.5 |
| **Net** | | | **0 days net change** |

Phase 2 stays at ~21 days. The naming changes; the work doesn't materially shift.

Phase 3a's "Project entity axis-field UI" line item (2 days in Artifact 4 §7) becomes "Job detail panel — Pro Services axis fields cluster" — also 2 days. The work product is a new cluster on the existing Job detail panel, gated by `CAP-PS-ENGAGEMENT`.

---

## What I'm NOT changing

For clarity:

- **Project entity stays.** Unchanged. Enterprise installs continue to use it via PRESET-07.
- **`CAP-EXT-PROJECT` stays.** Enables Project entity, project accounting service, WBS, earned value. Pro Services installs leave it off.
- **`WbsElement` / `WbsCostEntry`** stay. Children of Project; Pro Services doesn't touch.
- **Job's manufacturing fields** (Disposition, ParentJobId, PartId, BomRevisionIdAtRelease) stay. They're nullable; Pro Services Jobs don't fill them. UI surfaces cap-gate.

---

## What to update in the Phase 1 artifacts

The Phase 1 artifacts are reference documents now; the right move is a small addendum, not a rewrite. Suggested edits, scoped tight:

- **Artifact 3 G-17** — append "Spike result: Path C (Job-as-engagement). See `phase-2-foundations/spike-01-engagement-entity.md`."
- **Artifact 4 §1** — replace `CAP-PS-PROJECT` with `CAP-PS-ENGAGEMENT` (same intent, different name).
- **Artifact 4 §3.6** — note that the axis columns target `jobs` table, not `projects`.
- **Artifact 4 §3.7** — `TimeEntry.JobId` already exists; drop the proposed `ProjectId` column.
- **Artifact 5 §3.3** — no change (already specifies Engagement track type on Job).

Will apply these in a follow-up commit so the addendum trail is clean.

---

## Open questions (for Phase 3 grooming)

1. **Should Pro Services installs see `Project` at all?** Default-off via `CAP-EXT-PROJECT` keeps it hidden. PRESET-08 leaves it off. PRESET-09 (Hybrid) leaves it off unless the shop separately enables it. Confirm in Phase 3a UI work.

2. **Does Engagement-as-Job affect kanban behavior?** Engagement track type Jobs progress through service-shop stages. Multi-select bulk actions, WIP limits, archival — all work as-is. Confirm at Phase 3a kanban smoke test.

3. **Retainer balance tracking — entity or projection?** Retainer balance lives on the engagement Job. Time entries against the engagement debit the balance. Is the debit handler a real-time `Job.RetainerBalanceHours -= entry.Hours`, or a projection / view? Real-time write is simpler; pick that unless reporting needs the audit trail. Decide in Phase 3a `CAP-PS-RETAINER` implementation.

4. **What about Project FK on Job?** Today: none. After Pro Services + Path C: still none. If a shop later wants to roll up multiple Engagement-Jobs under a single Project for financial reporting, add `Project.LinkedJobs` via the existing `WbsElement.LinkedJobId` mechanism. Don't preempt.

---

## Decision recorded

**Path C — Engagement = Job on Engagement track type.** Confirmed 2026-05-10. Phase 2 foundations work proceeds on this basis.
