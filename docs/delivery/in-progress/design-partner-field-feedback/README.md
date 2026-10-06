---
title: Design-partner field feedback — triage and build order
type: delivery
status: in-progress
id: design-partner-field-feedback
owner:
updated: 2026-10-06
---

# Design-partner field feedback — triage and build order

Distilled from five weeks of field use by the molding design partner (2026-08-25 → 2026-10-06),
on a LAN-only single-box install. Source conversation is confidential and stays out of this repo;
only the derived requirements are recorded here.

The partner's evaluation has been **blocked or near-blocked for most of that window** — first by
part numbering, now by the job/part/quantity gap. Items are ordered by what unblocks evaluation,
not by size.

## P0 — Install is running on a frozen clock

`docker-compose.yml` defaults `ASPNETCORE_ENVIRONMENT` to `Development`, and `.env.example` ships
the same. `Program.cs` reads `IsDevelopment()` to pick `MockClock`, which latches `_now` at
construction and never advances. Every install that didn't override this has a clock frozen at the
moment its API container last started.

Confirmed in the field: 22 MRP runs failed against a unique index on `run_number`, every one
regenerating the identical `MRP-<frozen timestamp>` string at eleven different wall-clock times.
Document indexing had not advanced its watermark in six days.

- [ ] Flip the compose default and `.env.example` to `Production`
- [ ] Startup line should state the clock in use at any level, not only Development
- [ ] Refuse to boot with `MockClock` unless an explicit opt-in var is also set
- [ ] Re-test timers and MRP on the partner box after the flip
- [ ] Decide whether the partner's `created_at` values (all frozen) need a backfill or are throwaway

Secondary effects of the same default: rate limiting is disabled, OpenAPI/Scalar and the dev clock
endpoint are exposed, and EF SQL logging is verbose enough that 3000 log lines covered 11 minutes.

## P1 — A job cannot carry a part and a quantity

The partner's actual task is "tell production to make N of part X by date D". This is the current
blocker.

- [x] Draft/cancelled/shipped SO lines no longer offered for job assignment (`58b4757a`)
- [x] Auto-created jobs record a `JobPart` row with part + quantity (`58b4757a`)
- [ ] Manual job creation must accept part + quantity (the auto path is wired, the manual one is not)
- [ ] Job card should show part number and quantity, not only the generated title
- [ ] Default auto-generated job title is not useful — derive from part number
- [ ] Over-allocation across jobs on the same SO line: **warn, do not block** (decided)

## P2 — Job status model is ambiguous and has no exit

Two status fields render on a job (header and the J-### area) with no defined interplay, and
neither offers a way to retire a mistaken entry.

- [ ] Define the two status fields' relationship; a change in one must drive the other
- [ ] Add an unambiguous "entered in error" disposition, plus "other"
- [ ] Archive currently leaves the card on the production column — it must leave the board
- [ ] Kanban filter for active-only jobs, defaulted on
- [ ] Operation-level status: allow marking an operation complete or partially complete from the
      job view, not only via shop-floor scanning

The last point is a design correction, not a defect. The board was built on the assumption that
operational data arrives from shop-floor scans and no one sets status by hand. That holds for a
floor of machinists punching QR codes; it does not hold for a shop where a single engineer drives
the work. Manual status entry needs functional parity with the scan-driven path.

- [ ] Estimated remaining time on the job card: quantity x sum of remaining operations
- [ ] Ability to break operations out into their own sub-jobs
- [ ] Concurrency: a 9-step routing may have steps worked simultaneously. The one-timer-at-a-time
      model cannot express this. Needs design before more timer work.

## P3 — Shop floor and mobile

- [ ] Terminal configuration hangs on "saving" (re-test after P0; may be clock)
- [ ] Terminal name not persisted while team name is
- [ ] Page renders larger than the display until refreshed — initial scaling bug
- [ ] Timer start reports a conflict while the control still offers "start"; stop is reachable only
      from the desktop header (re-test after P0)
- [ ] Mobile parity: stopping a timer must be possible where it was started

## P4 — Master data gaps

- [ ] Clone a part. Families of 20+ near-identical part numbers differ by number, description and
      one or two fields; re-keying all of it is the daily cost.
- [ ] Vendor edit does not default the existing company name
- [ ] Vendors need multiple addresses (warehouses vs. billing); customers already have this
- [ ] Multiple contacts, emails and phone numbers per vendor and customer
- [ ] Fax number field — still required by some trading partners for PO transmission
- [ ] Part number validation rejects more than one hyphen
- [ ] Duplicate part number surfaces only as a generic save error; needs a field-anchored message

## P5 — Settings discoverability and reactivity

- [x] Discovery wizard question could not be completed when the intended answer was "neither"
- [x] Discovery question for whether employee paperwork applies at all
- [x] Per-user non-employee opt-out for service accounts and consultants
- [ ] Onboarding banner persists after the profile is completed; re-running reports success and the
      banner stays
- [ ] Manual-numbering lives under Settings; it was looked for under Capabilities. Decide the rule
      for which switches are capabilities and which are settings, then move or cross-link.
- [ ] Toggling manual numbering requires a hard refresh to take effect
- [ ] No `*.allow_manual_numbers` row exists in `system_settings` on a fresh install

## P6 — Internal work orders

Making a part for internal consumption currently requires listing the shop as its own vendor and
customer, duplicating the part as both bought and made. The intended model is a sub-assembly work
order baked into the part, needing neither vendor nor customer.

- [ ] Design the internal-WO path; confirm against the partner's actual department-to-department flow

## P7 — Install and upgrade ergonomics

Five weeks of upgrades needed repeated hand-holding. Recurring failures:

- [ ] Version picker lists build hashes, some months old, instead of version numbers
- [ ] Status output read a hardcoded version from an informational file
- [ ] LAN access lost after several upgrades, restored only by re-running setup
- [ ] Upgrades failed the health gate and auto-rolled back with no actionable cause surfaced
- [ ] Node engine requirement (>=22) is not checked before the npm install is attempted
- [ ] `minio/minio` now requires authentication to pull — blocks every fresh install

## Open input

The partner is preparing a cradle-to-grave numbered list of the actions they expect to be able to
take, written without reference to current behaviour. Fold that in when it arrives; it is the
clearest statement of the target workflow available.
