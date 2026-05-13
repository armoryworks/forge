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

## 🚧 Phase C vertical restructure — Identity-and-onward blocked on cross-references

**Where things stand (commits b8e2885, 7000243, db5a9e4 on `armoryworks/forge` and `armoryworks/forge-api`).**

1. ✅ Plan written: `docs/vertical-restructure-plan.md` defines the 11
   verticals, classification rules, migration order, and stopping
   criteria.
2. ✅ Skeleton created: all 14 csproj projects exist (11 verticals +
   Platform + Database + Host), wired into `forge.slnx`, empty but
   build-clean.
3. ✅ Forge.Platform foundation migrated: `BaseEntity` +
   `BaseAuditableEntity` + `IConcurrencyVersioned` + `IClock` +
   `SystemClock` + `MockClock`. Implicit-using strategy on the
   existing csprojs handles the ~249 entity files that inherit
   `BaseEntity` without per-file edits.
4. ❌ Forge.Identity entity migration attempted, rolled back.

**What blocked the Identity migration.**

Moved 9 simple Identity entities + 9 configs (UserMfaDevice,
MfaRecoveryCode, UserPreference, UserScanDevice, UserScanIdentifier,
UserIntegration, UserCloudStorageLink, OAuthStateToken,
KioskTerminal) from `forge.core/Entities` and `forge.data/Configuration`
into `Forge.Identity/Entities` and `Forge.Identity/Configuration`,
updated namespaces. Build broke on inbound and outbound dependencies
that need untangling:

**Inbound — `forge.core` references Identity entities.** Three files
in `forge.core` use moved entities:

- `forge.core/Entities/CloudStorageProvider.cs` — navigation collection
  of `UserCloudStorageLink`.
- `forge.core/Interfaces/ICloudStorageTokenManager.cs` — service
  interface managing `UserCloudStorageLink`.
- `forge.core/Interfaces/IUserIntegrationService.cs` — manages
  `UserIntegration`.
- `forge.core/Interfaces/IUserPreferenceRepository.cs` — manages
  `UserPreference`.

Can't add `forge.core → Forge.Identity` reference because…

**Outbound — Identity files need types from `forge.core` and
`forge.data`.** The moved configs reference `ApplicationUser` (in
`forge.data/Context/ApplicationUser.cs`) and the moved entities use
enums from `forge.core/Enums/MfaDeviceType.cs` etc.

…adding `Forge.Identity → forge.core` would close a cycle.

**Resolution path for next session.**

The clean fix is to move *more* in one coordinated pass so the
graph un-circles:

1. **Move `ApplicationUser` to `Forge.Identity/Entities/ApplicationUser.cs`**
   (namespace `Forge.Identity.Entities`). It's the natural owner. But
   it extends `IdentityUser<int>` from
   `Microsoft.AspNetCore.Identity.EntityFrameworkCore`, has a
   navigation to `CompanyLocation` (still in `forge.core/Entities`),
   and implements `IActiveAware` (interface in
   `forge.core/Interfaces`). So plan to also:
2. **Move `IActiveAware` to `Forge.Platform/Common/IActiveAware.cs`**
   (cross-cutting marker interface — multiple verticals' entities
   implement it).
3. **Move enums Identity entities depend on** (`MfaDeviceType`,
   etc.) to `Forge.Identity/Enums/`, OR move all enums to
   `Forge.Platform/Enums/` since they're declared once and
   referenced by many entities — easier than per-vertical enum
   splits.
4. **Move the four `forge.core` files that reference Identity
   entities into `Forge.Identity`** — they're cohesive with the
   vertical anyway (cloud storage token management, user preference
   repo). After this, `forge.core` has zero inbound references *to*
   Identity entities, so the circular-dep risk dissolves.
5. **Keep `ApplicationUser`'s `WorkLocationId` navigation to
   `CompanyLocation`** by referencing `forge.core` from
   `Forge.Identity` (acceptable — `CompanyLocation` is `MasterData`
   territory and once it moves in a later session,
   `Forge.Identity → Forge.MasterData` is the clean state).
   Alternative: lazy-resolve `CompanyLocation` via just the FK int
   id and drop the navigation property.

**`AppDbContext` impact to watch for.** `AppDbContext` lives in
`forge.data/Context/AppDbContext.cs` and extends
`IdentityDbContext<ApplicationUser, IdentityRole<int>, int>`. Once
`ApplicationUser` moves to `Forge.Identity`, `forge.data` references
`Forge.Identity` (the implicit-using directives in `forge.data.csproj`
already point at `Forge.Identity.Entities` from the rollback —
verify they're still there or re-add). `IdentityDbContext` itself
stays from the Microsoft NuGet package.

**Estimated effort for the next session.** ~2 hours of focused work
to land Forge.Identity cleanly (entities + configs only, controllers
still deferred), assuming the moves above unblock everything. If
`AppDbContext`'s identity-typed DbSets surface fresh issues, budget
~1 more hour.

**Where to pick up.**
Current branch is at db5a9e4. Read
`docs/vertical-restructure-plan.md` first for the architectural
intent, then read this section for the unblocking sequence. Don't
re-do the moves piecemeal; do them together in the right order.
