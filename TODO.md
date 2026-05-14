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

## 🚧 Phase C vertical restructure — Identity data layer done, handlers/controllers blocked on `IAppDbContext`

**Where things stand.**

1. ✅ Plan written: `docs/vertical-restructure-plan.md` defines the 11
   verticals, classification rules, migration order, stopping criteria.
   Dependency rule **amended** (wrapper `b824227`): "Platform only" →
   "Platform + earlier-in-DAG verticals; no cycles; concrete navs OK"
   (EF Core can't map interface-typed navigations, so verticals must
   reference each other's projects for cross-vertical navs).
2. ✅ Skeleton created: all 14 csproj projects exist, wired into the
   solution, build-clean.
3. ✅ `Forge.Platform` foundation migrated: `BaseEntity` /
   `BaseAuditableEntity` / `IConcurrencyVersioned` / `IClock` /
   `SystemClock` / `MockClock`.
4. ✅ **Enums centralized** (`forge-api` `f6fdb09`): all 167 enum files
   moved `forge.core/Enums/` → `Forge.Platform/Enums/`. Implicit-using
   shims on the 5 consuming csprojs; 865 explicit `using` lines dropped.
5. ✅ **`Forge.Identity` data layer migrated** (`forge-api` `594ec36`):
   12 entities (`ApplicationUser` + 9 user-scoped + the cloud-storage
   cluster `CloudStorageProvider` / `UserCloudStorageLink` /
   `EntityCloudLink`), 4 interfaces, 12 EF configs. `forge.core` has
   zero references to `Forge.Identity` — the old circular edge is gone.
   `Forge.Identity → forge.core` is a one-way DAG dep (CompanyLocation,
   RoleTemplate, IActiveAware). `AppDbContext` gained a second
   `ApplyConfigurationsFromAssembly(typeof(ApplicationUser).Assembly)`.
   Build `-warnaserror` + 815 tests green. **PR:**
   `armoryworks/forge-api#1` (open, awaiting review).
6. ⛔ **Handlers + controllers NOT moved — blocked.** See below.

**Why handlers/controllers are blocked.**

The plan wants verticals to own their controllers + MediatR handlers,
but moving Identity's handlers closes a cycle:

- 16 of 41 Identity handlers take the **concrete `AppDbContext`** (in
  `forge.data`). `forge.data → Forge.Identity` already exists, so
  `Forge.Identity → forge.data` would be circular.
- 12 handlers also `using Forge.Api.Data` / `Forge.Api.Services` —
  `forge.api → Forge.Identity` already exists, so that's circular too.
- There is **no `IAppDbContext`** — handlers bind the concrete context.

This is the "significant refactor on its own" the plan flagged. It must
be solved before *any* vertical can take its handlers.

## ⏭️ Next effort — extract `IAppDbContext` (its own branch/PR)

Infrastructure prerequisite for every vertical's handler migration.
**Design direction: interface-segregated DbSets, not one fat interface.**

A single `IAppDbContext` exposing all ~250 `DbSet<T>`s would have to
reference every vertical's entity types — inverting the dependency graph
(whatever holds it depends on everything). Instead:

1. **Per-vertical context interface owned by the vertical.** E.g.
   `IIdentityDbContext` in `Forge.Identity`, exposing only Identity's
   `DbSet<T>`s (`ApplicationUser`, `UserPreference`, `UserMfaDevice`, …)
   plus `SaveChangesAsync` / `Database` / `Entry()` / whatever handlers
   actually use. `Forge.Identity` references only its own entities —
   no outward dep.
2. **`AppDbContext` implements all of them.** `AppDbContext :
   IdentityDbContext<…>, IIdentityDbContext, ISalesDbContext, …` — it
   already has every `DbSet`, so implementation is "free" (the DbSet
   properties satisfy the interface members).
3. **Handlers rebind to the vertical interface.** Identity handlers take
   `IIdentityDbContext` instead of `AppDbContext`. DI registers
   `AppDbContext` as the impl for each interface (`AddScoped<IIdentityDbContext>(sp => sp.GetRequiredService<AppDbContext>())`).
4. **Relocate the `Forge.Api.Services` / `Forge.Api.Data` bits Identity
   handlers need** — `ITokenService`, session store, etc. — into
   `Forge.Platform` (if cross-cutting) or `Forge.Identity` (if
   Identity-owned). Audit the 12 handlers' `using Forge.Api.*` lines to
   scope this.

Once `IIdentityDbContext` exists and the service deps are relocated,
moving Identity's Features + controllers becomes mechanical (controllers
go into a web-capable `Forge.Identity` via `FrameworkReference
Microsoft.AspNetCore.App`, registered as an application part in
`Program.cs`). The same `I{Vertical}DbContext` pattern then unblocks
MasterData, Sales, and the rest.

**Where to pick up.** Branch `feature/forge-identity-vertical` is at
`forge-api` `594ec36` (PR #1). Start `IAppDbContext` extraction as a
fresh branch — ideally after PR #1 merges so it's reviewed
independently. Read `docs/vertical-restructure-plan.md` for intent,
then this section for the sequence.
