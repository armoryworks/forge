# Forge — Open TODOs

Project-level open issues. Discovered during work, intentionally deferred,
or waiting on something else. Move items to a CHANGELOG / decision log
once they're resolved.

---

## 🐛 Shop floor footer falls off-screen at increased font sizes

**Symptom.** On `/display/shop-floor` (the kiosk display), clicking the
`A+` font-scale button pushes the bottom "Scan your badge or RFID to
clock in" action bar (`.sf-action-bar`) below the viewport. User reports
it's visibly broken even at the first A+ step (20px).

**What was tried (commits 43f17ef + 27a994b on `armoryworks/forge-ui`).**

1. `shop-floor-clock.component.scss` — added `min-height: 0` +
   `grid-template-rows: minmax(0, 1fr)` to `.sf-body`; `min-height: 0` to
   `.sf-section`; `flex-shrink: 0` to `.sf-section__title`; `flex: 1` +
   `min-height: 0` to `.sf-team-list` and `.sf-jobs-list`. Mis-targeted —
   that component is the `/display/shop-floor/clock` subroute, not the
   one the user lands on.
2. `shop-floor-display.component.scss` — same `min-height: 0` added to
   `.sf-body`. **Container verified to ship the new rule** (chunk-ELC3SYUG.js
   contains `min-height:0` in the rendered `.sf-body[_ngcontent-%COMP%]`
   rule), but user reports the layout still breaks after a hard refresh.

**Open hypotheses.**

- **Service worker stale assets.** `ngsw-config.json` has
  `installMode: prefetch, updateMode: prefetch` on `/*.css`, `/*.js`,
  `/index.html`. SW may keep serving the cached old bundle even after
  hard refresh on a kiosk session. Mitigation: unregister SW via
  DevTools (Application → Service Workers → Unregister) and reload.
- **`min-height: 0` insufficient.** Some other element in the flex
  column (between `.sf-header` and `.sf-action-bar`) — possibly
  `<app-training-mode-banner>` or `<app-kiosk-session-bar>`, which
  have no explicit `:host` styles and inherit `display: inline` by
  default — may be eating vertical space or not behaving as expected
  as flex children. Need to inspect the actual rendered DOM at the
  problematic font scale to know.
- **Some outer wrapper not constrained.** `<main id="main-content">`
  in `app.component.html` (the `@else` / no-shell branch) has no
  height constraint; relies on inner `:host { height: 100vh }` of
  shop-floor-display to constrain. If anything between root and the
  kiosk display is misbehaving, the host won't actually clip overflow.

**To investigate.**

1. Get a paired-kiosk Playwright session running so the actual layout
   can be screenshot-verified at each font scale (the throwaway specs
   in this session landed on the unpaired Terminal Setup screen and
   couldn't measure the real chrome).
2. Open the kiosk in DevTools and inspect the computed height of
   `<app-shop-floor-display>` and `.sf-body` at xl font — confirm
   whether `:host` is genuinely 100vh and whether body is honoring
   the flex: 1 + min-height: 0 contract.
3. Try ALSO setting `flex-shrink: 0` explicitly on
   `<app-training-mode-banner>` and `<app-kiosk-session-bar>` via
   `app-training-mode-banner, app-kiosk-session-bar { flex-shrink: 0; }`
   in shop-floor-display.component.scss in case their lack of
   `:host { display: block }` is breaking flex sizing.

**Files touched so far.**
- `forge-ui/src/app/features/shop-floor/clock/shop-floor-clock.component.scss`
- `forge-ui/src/app/features/shop-floor/shop-floor-display.component.scss`

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
