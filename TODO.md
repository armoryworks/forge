# Forge — Open TODOs

Project-level open issues. Discovered during work, intentionally deferred,
or waiting on something else. Move items to a CHANGELOG / decision log
once they're resolved.

---

## 🚧 Work in progress — tomorrow

- [ ] Finalize the `forge-ui` lead/account UX work:
  - complete inline account creation for lead edit and bulk-assign flows.
  - add regression coverage for account list refresh and newly created-account selection.
  - verify with `npm run lint && npm run lint:i18n && npm run test -- --watch=false`, plus `ng build --configuration development`.
- [ ] Continue the repo bug backlog sweep:
  - review `forge/forge/AUDIT.md`, `forge-api/forge.tests/Remediation/BACKLOG.md`, and local TODOs.
  - surface the highest-impact actionable fixes for tomorrow (invoice/payment balance, auth scope, shipment/quote invariants, lead/account flow polish).
- [ ] Create tracked issue-style entries for each discovered bug and follow-up work item.

## ⏸️ DEFERRED — §5A GL Workspace UI remainder (blocked, 2026-07-06)

The §5A read/create/advisory/reverse surface is **built + on `main`** (endpoints: ledger register,
chart-of-accounts, AI-explain, anomaly-scan, reverse; components: ledger view w/ explain+anomaly+reverse,
manual-entry editor, reverse dialog; dashboard tiles). All gates green except the Playwright screenshot.
What remains is blocked, not merely undone:

- **[DONE 2026-07-07] Screenshot-verification of shipped §5A surfaces** — ledger, editor, dashboard, and the new
  Reverse/correct prefill flow all visually verified; 4 UI bugs found + fixed in the loop.
- **[DONE 2026-07-07] §5A find-in-context + account lens + split-pane correction** — all landed +
  visual-verified: ledger find bar (highlight/cycle, peers never hidden) on a new generic
  `DataTableComponent.scrollToRow()` locate primitive; `/accounting/ledger/:accountId` lens with a
  TB-seeded running-balance column + account drill-down links; click-to-center reversal chips; and the
  §5A.2 split-pane correction (original pinned above the pre-seeded compose form via `?correctionOf=`).
  *Remaining nice-to-have (not blocking):* CDK-virtualized rendering for very large books; UI surfacing
  of the engine's late-posting fallback.
- **[decision-ready: design drafted 2026-07-07] Two-track training feature (§5A.4 / items 7–9).**
  All three gating artifacts are DRAFTED for review at
  `docs/delivery/in-progress/accounting-suite/training-design.md`: sandbox demo-`Book` seed spec (12-account
  CoA, one quarter, 5 planted errors), the fix-it scenario JSON schema (6 validator types, bait-then-correct
  flow), the 8-card QB crosswalk, and the 2-question intake router. **Build starts once Daniel settles the
  5 OPEN DECISIONS in that doc** (sandbox isolation, reset carve-out, scenario storage, gate softness, crosswalk tone).
- **[DONE 2026-07-07] §7A COMPLETE (v1, PS-run).** The hard-gate is wired into `ToggleCapabilityHandler`
  AND the conversion tooling shipped: `POST /accounting/conversion/opening-journal` (CSV-template lines →
  one idempotent `Source=Conversion` entry) + `GET /accounting/conversion/tie-out` (TB readable pre-FULLGL),
  both gated `CAP-ACCT-MIGRATION` (not FULLGL — chicken-and-egg). **Proven live on dev end-to-end:**
  MIGRATION on → opening journal posted (idempotent re-post returned the same entry) → tie-out balanced →
  FULLGL off→on passed the gate. Dev caveat resolved (dev book now has its Conversion journal).
  Remaining §7A work is per-customer execution (AP/SLP cutovers) + the AR/AP open-item load at real cutover.

## ⏸️ DEFERRED — Activity-Based Costing (ABC), AI-assisted

Advanced managerial overhead-allocation layer on top of the GL — **not scoped for
Phases 0–5**. Near-term costing (standard/weighted-avg/FIFO + `Job`/`CostCenter`
dimensions) already covers job-margin + valuation, which SMB adopters ask for first.
**Revisit** when a customer needs product costs where overhead is large and unevenly
consumed. Cheap to add later: Forge already emits ABC's cost drivers (setups,
inspections, moves) as operational events, so a future add (prefer *Time-Driven* ABC)
is just an allocation layer over cost centers — no schema rework. AI stays **advisory
only** (driver discovery, method recommendation, anomaly flagging, plain-language
explanation) and **never in the immutable posting path**. Validate demand with the
design-partner customers before building. Context: `ACCOUNTING_SUITE_PLAN.md` (§5A is
the GL Workspace + training slice this would eventually layer onto).

## ✅ RESOLVED — Shop floor footer falls off-screen at increased font sizes

**Symptom.** On `/display/shop-floor` (the kiosk display), clicking `A+`
pushed the bottom "Scan your badge or RFID to clock in" action bar
(`.sf-action-bar`) below the viewport — visibly broken at the first A+ step
and worse at each step up.

**Actual root cause (the SW hypothesis was a red herring).** The font-scale
control applies CSS `zoom` to the component host (`applyFontSize()` →
`el.style.zoom = scale`), and `:host` was `height: 100vh; overflow: hidden`.
`zoom` magnifies the host's *entire* box — including its `100vh` height — so
the host rendered at `scale × 100vh` and grew taller than the viewport. Its
own `overflow: hidden` then clipped against that oversized host box (not the
viewport), so the action bar (last flex child) sat below the fold. Measured
in a real paired-kiosk Chromium session: host height = `768 × zoom` at every
step (896 / 1024 / 1152 / 1280 px against a 768 px viewport). The earlier
`min-height: 0` work couldn't help — the overflow is at the host level, not
inside `.sf-body`. The service worker only ever masked *verification* of the
prior attempts (it serves the same bundle); it was never the cause. Verified
with the SW blocked entirely and the bug still reproduced.

**Fix (commit pending on `armoryworks/forge-ui`).** Divide the zoom back out
of the host height so the host stays exactly one viewport tall at any scale:
- `shop-floor-display.component.ts` — `applyFontSize()` also sets a matching
  `--sf-zoom` custom property alongside `el.style.zoom`.
- `shop-floor-display.component.scss` — `:host { height: calc(100vh / var(--sf-zoom, 1)); }`
  (and `.sf-error` switched from `100vh` to `100%` for the same reason).

With the host pinned to the viewport, `overflow: hidden` clips at the
viewport, `flex-shrink: 0` keeps the header + action bar pinned, and
`.sf-body` (`flex: 1; min-height: 0; overflow-y: auto`) absorbs the extra
content as internal scroll.

**Verified** against rendered behavior on the seeded instance (rebuilt
`forge-ui` container, fresh Chromium context, service worker blocked): footer
bottom == viewport bottom and host height == viewport height at all five font
scales (12→20px) and on the way back down. Screenshots confirm the footer
visible at max zoom with the worker grid scrolling within the body.

---

## ❌ Phase C vertical restructure — ABANDONED, reversed to horizontal (2026-05-20)

> The vertical-bounded-context split was **fully reversed** (forge-api
> `7b842e1`). `main` is back to the horizontal `forge.api` / `forge.core` /
> `forge.data` / `forge.integrations` + `forge.tests` layout. All 14 scaffold
> projects (incl. `Forge.Platform`) are deleted; `BaseEntity` / `IClock` /
> `SystemClock` / `MockClock` are restored to their original homes in
> forge.core / forge.integrations. `docs/vertical-restructure-plan.md` is now
> historical only.
>
> **Why abandoned:** the split delivered little organizational value — only
> leaf-vertical *data layers* (Identity, Maintenance, Insights) extracted
> cleanly; every handler/controller stayed in `forge.api`, so the
> work-a-feature-in-isolation payoff never materialized. The structural
> overhead (14 projects, implicit-using shims, FK-name pins, per-vertical
> config scans) was added without the benefit.
>
> **The decisive learning (keep if anyone revisits this):** the codebase has
> dense concrete cross-entity navigation. "Hub" entities (`Part`, `Vendor`,
> `Customer`, `PurchaseOrder`, `SalesOrder`, `Job`) are referenced *into* by
> dozens of still-in-core entities — e.g. 10 forge.core entities hold
> `PurchaseOrder` navs, ~137 code sites touch `.PurchaseOrder`. Extracting a
> hub vertical forces a `forge.core → vertical` cycle unless every inbound nav
> is first converted to the FK-only pattern (a large behavioral change). That
> coupling is itself evidence the domain boundaries aren't clean enough to
> justify vertical slicing for a pre-beta single-developer codebase. The
> horizontal layout is the right fit; revisit verticals only at team scale and
> only after deliberately decoupling the hub entities.

<details><summary>Historical: what had been done before the reversal</summary>

1. Plan: `docs/vertical-restructure-plan.md` — 11 verticals + 3
   cross-cutting projects, dependency-DAG rule (Platform + earlier-in-DAG;
   no cycles; concrete navs OK).
2. ✅ Skeleton: all 14 csproj projects exist, wired into `forge.slnx`.
3. ✅ `Forge.Platform`: `BaseEntity` / `BaseAuditableEntity` /
   `IConcurrencyVersioned` / `IClock` / `SystemClock` / `MockClock`.
   (Enums were **not** moved — they stay in `forge.core/Enums`; verticals
   reach them via their `forge.core` DAG edge.)
4. ✅ **`Forge.Identity`** data layer: 12 entities (`ApplicationUser` +
   user-scoped + cloud-storage cluster), 12 configs, 4 interfaces.
5. ✅ **`IIdentityDbContext`** unblocker: per-vertical segregated DbContext
   interface in `Forge.Identity`; `AppDbContext` implements it; DI resolves
   it to the single `AppDbContext` scope. 3 clean Scanner handlers rebound
   as proof. This is the pattern that lets any vertical's handlers move
   without a `→ forge.data` cycle.
6. ✅ **`Forge.Maintenance`** data layer: 8 entities + 8 configs + 2
   interfaces (`IMachineDataService`, `IPredictiveMaintenanceService`).
7. ✅ **`Forge.Insights`** data layer: `SavedReport` / `ReportSchedule` /
   `AiAssistant` / `DocumentEmbedding` + configs + report/embedding repo
   interfaces (`Pgvector` pkg for the vector column).

**The proven per-vertical recipe** (each lands green + DB-neutral on `main`):

1. `git mv` the vertical's entities → `Forge.X/Entities` (namespace →
   `Forge.X.Entities`), configs → `Forge.X/Configuration`, owned interfaces
   → `Forge.X/Interfaces`.
2. Write `Forge.X.csproj`: net10 + `Microsoft.EntityFrameworkCore`, refs
   `Forge.Platform` + `forge.core` (+ `Forge.Identity` if any config has an
   `ApplicationUser` FK, + other earlier verticals as needed), and
   project-level implicit `<Using>`s (Platform/Core/Identity + own
   Entities/Interfaces) so consumers don't churn per-file usings.
3. Wire `forge.data` (+ `AppDbContext.OnModelCreating`
   `ApplyConfigurationsFromAssembly(typeof(Forge.X.Entities.SomeMarker).Assembly)`),
   `forge.api`, `forge.integrations` (only if it implements the vertical's
   services), `forge.tests` — project ref + implicit usings each.
4. Build `-warnaserror`; fix the handful of **fully-qualified**
   `Forge.Core.Entities.Moved` / `Context.ApplicationUser` refs to bare
   names (the implicit usings resolve them). Move any forge.core interface
   that references a moved entity into the vertical (forge.core must never
   reference a vertical).
5. **DB-neutral gate**: `dotnet ef migrations has-pending-model-changes`.
   Relocating configs to a new assembly churns EF's *default* FK constraint
   names (double- vs single-underscore) for unnamed relationships. Run a
   throwaway `migrations add` to enumerate the churned names, pin each with
   `.HasConstraintName("<existing name>")`, `migrations remove`. Update the
   moved entities' type-label strings in `AppDbContextModelSnapshot.cs`.
   Re-run until **"No changes."**
6. `dotnet test` (full suite), commit, `git merge --ff-only` to `main`, push.

**⚠️ Leaf vs hub — the blocker discovered 2026-05-19.** The three done so far
(Identity, Maintenance, Insights) are **leaf** verticals: nothing else holds a
concrete navigation INTO their entities, so they extract cleanly. The rest are
**hub** verticals — entities still in `forge.core` (belonging to not-yet-migrated
verticals) carry concrete nav properties pointing *into* them, which forces a
`forge.core → vertical` edge and closes a cycle (the vertical also needs
`→ forge.core` for its own unmigrated deps).

Concretely, a Procurement attempt failed: 10 `forge.core` entities (`Job`,
`Barcode`, `ConsignmentTransaction`, `AutoPoSuggestion`, `MrpPlannedOrder`,
`LotRecord`, `SubcontractOrder`, …) have `PurchaseOrder` / `PurchaseOrderLine`
navs. forge.core can't reference `Forge.Procurement`.

**Resolution (needs a deliberate decision — do NOT auto-roll):** convert those
inbound concrete navs to the established **FK-only pattern** (keep the `int` FK,
drop the nav property) before extracting the hub vertical — same pattern
`forge.core` already uses for `ApplicationUser`. But this is a behavioral change:
~137 code sites reference `.PurchaseOrder` / `.PurchaseOrderLine` alone (Includes,
property access). Each hub vertical (Procurement, Sales=`SalesOrder`,
Production=`Job`, MasterData=`Part`/`Vendor`/`Customer`, Inventory) has its own
inbound-nav fan-in to convert first. This warrants its own reviewed effort, not
an unsupervised pass.

**Remaining verticals** (blocked on the above): Procurement, Sales, Production,
Inventory, Quality, People, Operations, **MasterData**. MasterData is also the
largest + most classification-ambiguous — do it with focus.

**Handlers/controllers** still live in `forge.api`. The `I{Vertical}DbContext`
pattern (proven for Identity) unblocks moving them, but each also needs the
`Forge.Api.Services` / `Forge.Api.Data` helper deps relocated (to
`Forge.Platform` if cross-cutting, or the vertical if owned). That's the
follow-on once data layers are extracted.

</details>
