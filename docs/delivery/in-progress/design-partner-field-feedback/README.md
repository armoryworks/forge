---
title: Design-partner field feedback — triage and build order
type: delivery
status: in-progress
id: design-partner-field-feedback
owner:
updated: 2026-10-08
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

- [x] Flip the compose default and `.env.example` to `Production` (`00f8b18`)
- [x] Startup line should state the clock in use at any level, not only Development (`71f37790`)
- [x] Refuse to boot with `MockClock` unless an explicit opt-in var is also set (`71f37790`)
- [ ] Re-test timers and MRP on the partner box after the flip
- [ ] Decide whether the partner's `created_at` values (all frozen) need a backfill or are throwaway

Secondary effects of the same default: rate limiting is disabled, OpenAPI/Scalar and the dev clock
endpoint are exposed, and EF SQL logging is verbose enough that 3000 log lines covered 11 minutes.

## P1 — A job cannot carry a part and a quantity

The partner's actual task is "tell production to make N of part X by date D". This is the current
blocker.

- [x] Draft/cancelled/shipped SO lines no longer offered for job assignment (`58b4757a`)
- [x] Auto-created jobs record a `JobPart` row with part + quantity (`58b4757a`)
- [x] Manual job creation accepts part + quantity (`199335e1`)
- [x] Job card should show part number and quantity, not only the generated title (wave 1)
- [x] Default auto-generated job title is not useful — derive from part number (wave 1)
- [ ] Over-allocation across jobs on the same SO line: **warn, do not block** (decided)

## P2 — Job status model is ambiguous and has no exit

Two status fields render on a job (header and the J-### area) with no defined interplay, and
neither offers a way to retire a mistaken entry.

- [x] Define the two status fields' relationship; a change in one must drive the other (board status is the source of truth; Completed retired (wave 1, owner to confirm))
- [x] `EnteredInError` and `Other` dispositions; the first archives (`199335e1`)
- [x] Archive left the card on the board: the client never subscribed to `boardUpdated`, so all
      four bulk operations were silently dropped (`c927d584`)
- [x] Kanban filter for active-only jobs, defaulted on (wave 1, on by default)
- [x] Operation-level status: allow marking an operation complete or partially complete from the
      job view, not only via shop-floor scanning (wave 2 operation status)

The last point is a design correction, not a defect. The board was built on the assumption that
operational data arrives from shop-floor scans and no one sets status by hand. That holds for a
floor of machinists punching QR codes; it does not hold for a shop where a single engineer drives
the work. Manual status entry needs functional parity with the scan-driven path.

- [x] Estimated remaining time on the job card: quantity x sum of remaining operations (wave 2 operation status)
- [ ] Ability to break operations out into their own sub-jobs
- [x] Concurrency: a 9-step routing may have steps worked simultaneously. The one-timer-at-a-time
      model cannot express this. Needs design before more timer work. (wave 2 operation timers; labour double-booking is an owner decision)

## P3 — Shop floor and mobile

- [x] Terminal configuration hangs on "saving" (re-test after P0; may be clock) (wave 1, plain-HTTP id generation)
- [x] Terminal name not persisted while team name is (wave 1)
- [x] Page renders larger than the display until refreshed — initial scaling bug (wave 1, partner to re-test)
- [x] Timer start reports a conflict while the control still offers "start"; stop is reachable only
      from the desktop header (re-test after P0) (wave 1)
- [x] Mobile parity: stopping a timer must be possible where it was started (wave 1)

## P4 — Master data gaps

- [x] Clone a part. Families of 20+ near-identical part numbers differ by number, description and
      one or two fields; re-keying all of it is the daily cost. (wave 1)
- [x] Vendor edit does not default the existing company name (wave 1)
- [x] Vendors need multiple addresses (warehouses vs. billing); customers already have this (wave 2)
- [x] Multiple contacts, emails and phone numbers per vendor and customer (wave 2)
- [x] Fax number field — still required by some trading partners for PO transmission (wave 1; sending POs by fax is an owner decision)
- [x] Part number validation rejects more than one hyphen (not a defect: several hyphens are accepted)
- [x] Duplicate part number surfaces only as a generic save error; needs a field-anchored message (wave 1)

## P5 — Settings discoverability and reactivity

- [x] Discovery wizard question could not be completed when the intended answer was "neither"
- [x] Discovery question for whether employee paperwork applies at all
- [x] Per-user non-employee opt-out for service accounts and consultants
- [x] Onboarding banner persists after the profile is completed; re-running reports success and the
      banner stays (wave 1)
- [x] Manual-numbering lives under Settings; it was looked for under Capabilities. Decide the rule
      for which switches are capabilities and which are settings, then move or cross-link. (wave 1 Numbering section; wave 2 capability search finds settings)
- [x] Toggling manual numbering requires a hard refresh to take effect (wave 1)
- [x] No `*.allow_manual_numbers` row exists in `system_settings` on a fresh install (resolved by the Numbering section: a missing row reads as off)

## P6 — Internal work orders

Making a part for internal consumption currently requires listing the shop as its own vendor and
customer, duplicating the part as both bought and made. The intended model is a sub-assembly work
order baked into the part, needing neither vendor nor customer.

- [ ] Design the internal-WO path; confirm against the partner's actual department-to-department flow

## P7 — Install and upgrade ergonomics

Five weeks of upgrades needed repeated hand-holding. Recurring failures:

- [x] Version picker lists build hashes, some months old, instead of version numbers (wave 1)
- [x] Status output read a hardcoded version from an informational file (wave 1)
- [x] LAN access lost after several upgrades, restored only by re-running setup (wave 1 watchdog fix)
- [x] Upgrades failed the health gate and auto-rolled back with no actionable cause surfaced (wave 1)
- [x] Node engine requirement (>=22) is not checked before the npm install is attempted (wave 1)
- [ ] `minio/minio` now requires authentication to pull — blocks every fresh install

## Open input

The partner is preparing a cradle-to-grave numbered list of the actions they expect to be able to
take, written without reference to current behaviour. Fold that in when it arrives; it is the
clearest statement of the target workflow available.

## Status after the overnight sweep (2026-10-08)

Two build waves landed on main: 37 packages in wave 1 and 74 in wave 2, each gated (full build,
tests, lint, i18n parity, standards ratchets) and reviewed before push. Operation-level status
ships behind the `shop-floor.operation-tracking` setting, default off.

Still open:

- [ ] `minio/minio` is gone from Docker Hub and quay.io no longer serves it, so a fresh install
      cannot pull `forge-storage`. Upgrades are unaffected (only versioned services are pulled).
      Needs a replacement S3-compatible backend and a migration path for existing volumes.
- [ ] Over-allocation warning when several jobs cover the same sales-order line (decided: warn).
- [ ] Breaking a job's operations out into their own sub-jobs.
- [ ] Partner re-test on beta.27: timers, terminal setup, first-paint scaling, MRP.

Owner decisions raised by the sweep: internal production orders; retiring the legacy phone pages;
kiosk re-authentication per tap; approved-source enforcement on POs; PO revisions after submit;
sending POs by fax; backdated receipts; NCR disposition phases 2-3; terminology overrides;
small-shop discovery presets; numbering backfill on live installs; the orphaned `job_parts.job_id1`
column; the owner's unpushed scrap-percent schema commit; the frozen `created_at` values; labour
double-booking when operation timers overlap; managed scrap/rework reason codes.

