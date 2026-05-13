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
