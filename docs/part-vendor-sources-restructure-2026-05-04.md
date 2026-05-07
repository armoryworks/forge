# Vendor Sources panel restructure — 2026-05-04

> **Status:** for Dan's review.
> **Code state:** changes are in the working tree of `qb-engineer-ui`. **Nothing committed, nothing pushed, no PR open.** Stacks on top of the part-UX-philosophy work from earlier in the day.
> Companion doc: `docs/part-ux-review-2026-05-04.md`.

---

## What changed and why

Dan's screenshot of the old Vendor Parts step turned up three problems: the empty state hid the preferred vendor that had already been picked on the prior step, "Add Vendor" was the wrong language ("vendor" reads as a Vendor entity, but the action is really "add a per-part source row"), and dialog-based editing forced the user to re-pick the vendor at the top of the dialog — the very vendor whose row they'd just clicked on.

After your Q&A clarification, the new shape is:

- **Inline grouped editor on the page.** Each vendor source is a stacked card with its 1:1 fields editable inline + a nested price-tiers mini-table.
- **Preferred vendor at the top, always.** Even when no `VendorPart` row exists for that pairing yet — the panel renders a "stub" card (PREFERRED chip + "Fill in details to add this source" warning) that becomes a real row on the user's first field blur.
- **Visual indicator on rows with no tiers.** A "No tiers — needs pricing" warn-chip in the row header + a subtle warning-tinted background. Per Dan: tiers are operationally required because PO creation reads them; a row without tiers is informational only.
- **"Set as preferred" action on non-preferred rows.** Sets `Part.preferredVendorId` AND the row's `isPreferred` flag in one click; the server enforces single-preferred uniqueness.
- **Inline-create-vendor anywhere a vendor can be picked.** The "+ Add another vendor source" button reveals an `EntityPicker` with the standard inline-create affordance — typing a name not in the system surfaces "Create new vendor 'X'".
- **Step renamed.** "Vendor Parts" → "Vendor Sources" (rail label, page title, hint, rationale all updated).

---

## Files touched (working tree only — nothing committed)

### New shared component

- `src/app/features/parts/components/vendor-sources-panel/vendor-sources-panel.component.{ts,html,scss}` — the new orchestrator. Inputs: `partId`, `partLabel`, `preferredVendorId`, `preferredVendorName`. Outputs: `(changed)`, `(preferredVendorChanged)`. Internally manages the load, sort, per-row dirty-tracking forms with save-on-blur, tier inline editor, stub group rendering, set-as-preferred, remove-row, add-vendor flow.

### Wired into both consumers

- `src/app/features/parts/workflow/part-vendor-parts-step/part-vendor-parts-step.component.{ts,html}` — slim wrapper around the panel. Bridges the workflow shell's `entity` input to the panel's required inputs. Always passes `[editing]="true"` (the workflow IS edit mode). Handles `(preferredVendorChanged)` by patching `Part.preferredVendorId` so the FK matches the row's flag.
- `src/app/features/parts/components/part-detail-panel/part-detail-panel.component.{ts,html}` — replaces `<app-vendor-part-list-panel>` (and the dialog handlers it required) with `<app-vendor-sources-panel>`. Wires the existing `editing()` signal so the Sources tab matches the rest of the detail page's view/edit mode behavior. Drops six dialog-handler methods + four dialog imports.

### Global read-only field treatment (added late in the iteration)

After the first pass at edit-mode gating shipped a custom label/value template branch, Dan flagged that read-only and editable views had **wildly different dimensions** (label/value at ~24px row vs. Material outlined field at ~56px row). Toggling Edit caused the whole grid to reflow. He asked for global styling rules so read-only and editable layouts are pixel-identical.

The fix pattern (Option 1 from the recommendation): **extend every shared form-control wrapper with `[isReadonly]` + add a global SCSS rule that strips the Material outlined-field border when active.** Same Material chrome dimensions in both modes; only the border + interactive affordances change.

**Files extended with `[isReadonly]` input** (`src/app/shared/components/`):
- `input/` — already had `isReadonly` (no change to TS); added `[class.app-readonly-field]` binding on `<mat-form-field>`.
- `textarea/` — new `isReadonly` input + binding + pass-through to inner `<textarea>`'s `readonly` attribute.
- `currency-input/` — same pattern.
- `datepicker/` — new `isReadonly` input + binding + `[disabled]` on the `<mat-datepicker-toggle>` (the global rule then hides the toggle button entirely).
- `select/` — new `isReadonly` input + binding + `[disabled]="disabled() || isReadonly()"` on the `<mat-select>` (mat-select doesn't support a true readonly; the global rule strips the disabled tint so it visually reads as data).

**New global SCSS rules** (`src/styles.scss` under the existing Material override section):
- `.mat-mdc-form-field.app-readonly-field` — root selector that the wrappers stamp.
- Hides all three notched-outline border parts (`__leading`, `__notch`, `__trailing`).
- Forces value text + caret to non-interactive read state (full color, no caret, default cursor) — overrides Material's disabled tint via `!important + -webkit-text-fill-color`.
- Hides the icon-suffix slot, the datepicker-toggle button, the select arrow wrapper, and the textarea resize handle.
- Removes hover + focus border states.

**Vendor-sources panel swap:** the dual-template approach (separate `rowFields` + `rowReadonly` templates with custom label/value SCSS) was deleted. Both modes now use the SAME `rowFields` template — every input just carries `[isReadonly]="!editing()"`. The previously-added `vendor-source__field-readonly` SCSS block was also removed; the global rule does the work.

**Verified visually:** read-only and editable Sources tab screenshots show identical field positions / row heights / column widths. Only the border lines + the action button row swap.

### Edit-mode gating on the panel (initial pass — superseded)

Dan caught a screenshot where the part-detail Sources tab was rendering editable input boxes even when the user wasn't in edit mode — same problem the rest of the page solves with `@if (editing()) { …form } @else { …label/value }`. Added a parallel `[editing]` input on `VendorSourcesPanelComponent`:

- **When false:**
  - All form inputs replaced with label/value pairs matching the part-cluster convention (`cluster__label` / `cluster__value` styling).
  - Action buttons hidden: "Set as preferred", "Remove row", "Add tier", "Add another vendor source".
  - Tier-row delete buttons hidden; tier table loses its actions column.
  - Tier-add inline form hidden.
  - Preferred-vendor stub renders as a condensed read-only card (vendor name + Preferred chip + "Source not yet configured" notice) — no field grid, no warn-chip prompting the user to fill in details (since they can't act on it).
- **When true:** existing inline-editable behavior unchanged.

The workflow step always passes `editing=true` (it IS the edit surface). The part detail page wires `[editing]="editing()"` to its existing signal — so toggling the Edit pencil now flips the Sources tab between read-only and editable in lockstep with the other clusters.

New i18n keys: `vendorSources.stubHintReadonly`, `vendorSources.noTiersInline`, `vendorSources.empty.helpReadonly`. Added in en + es.

Verified screenshots in `e2e/screenshots/part-ux-audit/`:
- `part-detail-sources-readonly-1920x1080.png` — read-only render: just the preferred-vendor card with the "Source not yet configured" notice, no inputs, no buttons.
- `part-detail-sources-edit-1920x1080.png` — edit render: full inline form on the stub + "+ Add another vendor source" button.

### i18n

- `public/assets/i18n/en.json` + `es.json`:
  - New block `vendorSources.*` — preferred chip, warnings, action labels, empty state, tier sub-keys, confirm dialogs (~30 keys).
  - `workflow.parts.steps.vendorParts` value: "Vendor Parts" → **"Vendor Sources"**.
  - `parts.workflow.vendorParts.title` + `.hint` + new `.rationale` (the rationale explicitly mentions PO pricing dependency).
  - Filled missing `vendorPart.certifications` key that wasn't present.

### Server contract

- `src/app/features/parts/models/update-part-request.model.ts` — added optional `preferredVendorId?: number` so the type matches what the server's PATCH endpoint already accepts. (Server side was already wired; only the TypeScript interface was missing the field.)

### Test infrastructure

- `e2e/tests/vendor-sources-screenshot.spec.ts` — direct-navigation Playwright harness that creates an authenticated context, picks a Buy + Subassembly part with a preferred vendor, and screenshots the Vendor Sources step at 1920×1080 and 414×896. Outputs to `e2e/screenshots/part-ux-audit/`.

### Intentionally NOT deleted

The old `VendorPartFormDialogComponent`, `VendorPartListPanelComponent`, `VendorPartPriceTiersDialogComponent`, and their specs are **kept**. Reason: the **vendor detail page** (`features/vendors/components/vendor-detail-panel/`) still consumes them for the **inverse** direction (one vendor, many parts in its catalog) — that surface has different cardinality and would need its own design pass before sharing the new component.

---

## Decisions you confirmed (recap)

| Q | Your answer | Reflected in the code as |
|---|---|---|
| 1 — Set-as-preferred from a row? | Yes | "Set as preferred" button on non-preferred row headers; emits `(preferredVendorChanged)` to the wrapper which patches `Part.preferredVendorId` |
| 2 — Tierless row = invalid? | Yes — visual indicator | "No tiers — needs pricing" warn-chip in the row header + `--no-tiers` class tints the row warning-light |
| 3 — Step name "Vendor Sources"? | Yes | Rail label + page title + i18n all updated |
| 4 — Refactor part-detail consumer too? | (a) yes | Part detail panel's Sources tab uses the new component |
| 5 — Inline-create-vendor on add? | Yes, anywhere a vendor can be selected | `EntityPicker` with `[createNewLabel]="vendor"` + the standard create-new flow |

---

## Screenshots

All in `qb-engineer-ui/e2e/screenshots/part-ux-audit/`.

- **`vendor-sources-panel-1920x1080.png`** — desktop, with the **Acme PREFERRED stub group** at the top showing all 12 editable fields in a 3-column grid, "+ Add another vendor source" below, and the right context pane with the new "Why this step?" rationale that explicitly explains PO pricing dependency.
- **`vendor-sources-panel-414x896.png`** — mobile (414×896), same content reflowed: rail icons-only on left, fields stacked 1-column, right pane dropped beneath the form as a collapsible.

---

## Follow-ups Dan flagged + that I noticed

### 1. **PO creation should validate price tiers exist for the requested quantity** (Dan, mid-effort)

> *"We will need to have validation in place for functionality that uses this pricing in calculations (purchase orders) and make the user aware that there is no valid pricing for that quantity of materials."*

This is a separate effort that lands in the **PO line creation flow**, not in the Vendor Sources panel itself. The intersection points:

- **Server side** — when computing line price during PO line create / edit, look up the chosen vendor's `VendorPartPriceTier` rows for the `(part, vendor)` pair. Find the tier with the highest `MinQuantity` ≤ requested quantity AND `EffectiveFrom <= today AND (EffectiveTo IS NULL OR EffectiveTo >= today)`. If no matching tier: return a typed "no-pricing-found" failure with `partId`, `vendorId`, `requestedQuantity` so the client can surface a precise error.
- **Client side** — PO line dialog should:
  - Show the resolved unit price + which tier matched, inline next to the qty/price field, the moment a vendor + qty + part triple is committed.
  - When the server returns "no-pricing-found", show a blocking error on the line: "No valid price tier on `{vendor}` for `{qty}` `{uom}`. Add a tier on the part's Vendor Sources page or pick a different vendor." Include a deep-link to the part's Vendor Sources tab.
  - Disable Save on the line until either a tier exists or the user explicitly enters a manual override price (with audit log).
- **Cross-cutting** — at PO creation time, also flag any line whose chosen vendor has the row but **no tiers at all** (the same warn-chip the panel shows on the part side). This catches the empty-row case before the user gets to qty entry.
- **Backend test coverage** — needs cases for (a) qty matches a tier exactly, (b) qty falls between two tiers (highest-min-qty-≤-requested wins), (c) qty below lowest tier (probably should fail — no tier covers a 1-unit purchase if the lowest tier is 50+), (d) tier exists but is closed (`effectiveTo` past), (e) no tiers exist.

This is its own focused effort. Estimated scope: ~1 day server (price resolver + endpoint + tests) + ~1 day client (line dialog rework + error surfacing + deep-link). I'll flag this as the **next vendor-sources follow-up effort** unless you'd rather sequence it differently.

### 2. **Vendor detail page** consumes the old VendorPart list/dialog stack

The vendor detail page's Catalog tab is still on the old shape. Open question: does it want the same inline-grouped pattern or its own design (the cardinality is opposite — one vendor, many parts)? Worth a separate design conversation before refactoring.

### 3. **Save-on-blur reliability**

The new panel saves each row's 1:1 fields on blur via a debounced PATCH. Two edge cases I haven't stress-tested:

- **Rapid blur sequence.** Tab through three fields quickly — the current code fires three PATCH calls. The server handles them serially but the client doesn't currently coalesce. Acceptable for now; could add a 250ms debounce on the form's `valueChanges` if it becomes annoying.
- **Conflict (409) on save.** No error UI today beyond a snackbar. If the row was deleted in another tab and the user blurs a field locally, they get a generic "couldn't save" toast. Could enhance with sync-conflict resolution (we have `<app-sync-conflict-dialog>` shared) but didn't bundle here.

### 4. **The stub group's first-blur create**

The "fill in details to add this source" stub creates the VendorPart row on the first field blur. If the user blurs an empty field by tabbing through, no save happens (the form isn't dirty for an empty value). That's correct — but worth being explicit: the row only gets created when there's actually data to save. If the user tabs through everything without typing, the panel state is unchanged.

### 5. **Auth-expiry leaves modal dialogs over /login** (Dan flagged 2026-05-04)

Repro: a session times out (or otherwise enters an auth-error state) while a workflow dialog or `<app-dialog>`-wrapped surface is open. The auth interceptor fires, the route redirects to `/login` — but **the open MatDialog stays mounted over the login page**. Screenshot shared shows the legacy `VendorPartFormDialog` (Add Vendor Source) floating on top of `/login`, fully interactive, with no underlying app context.

Why this happens: MatDialog's overlay is appended to `document.body` (or a CDK overlay container), not to the routed-component subtree. Route changes don't tear it down. The auth interceptor only handles HTTP redirection; it has no hook to clear the dialog stack.

Cleanest fix: add a `MatDialog.closeAll()` (and the same for any custom overlay containers — `LoadingService`, `ToastService` panels) inside the auth interceptor's 401 path AND inside `AuthService.logout()`. Plus an explicit "logout effect" listener that drops in-flight workflow context (`WorkflowService.clearContext`, draft service flushes, etc.) before navigation.

Estimated scope: ~30 min for the interceptor + AuthService changes; another 30 min to audit every overlay container in the app for the same pattern. Worth doing as a tiny standalone PR — it's user-visible, easy to verify with a deliberate session-timeout test, and the blast radius is small.

**Park until: vendor-sources work above is validated and committed.** Per Dan's instruction.

### 6. **Inline price-tier editing scope**

Today: tiers can be **added** (form at the bottom of the row's tier table) or **deleted** (X button per row). Tiers cannot be **edited in place** — to change a tier's `unitPrice` or `minQuantity`, the user has to delete + re-add. This is intentional (the existing dialog had the same constraint, and tier changes are audit-relevant — the price-tier history dialog tracks them) but worth confirming you're OK with it. Alternative: inline edit each tier's row, which adds ~80 LOC of state-tracking and a save-on-blur per cell.

---

## Verification

- [x] `tsc --noEmit -p tsconfig.app.json` clean
- [x] `npm run lint:i18n` — every key referenced in code is present in en.json
- [x] Existing vendor-parts-cluster specs (3 files, 7 tests) still pass — old components are intact for the vendor detail page consumer
- [x] Container rebuilt + recreated; deployed UI verified to render the new panel correctly via Playwright screenshots at desktop + mobile

---

## How to commit when ready

The new files + the modifications stack on top of the part-UX-philosophy work that's also still uncommitted. Two commit shapes possible:

**Option A — one big effort PR** containing both passes (philosophy + vendor-sources):
```bash
cd qb-engineer-ui
git checkout -b effort/part-ux-philosophy-and-vendor-sources
git add public/assets/i18n/ \
        src/app/shared/components/workflow/ \
        src/app/features/parts/ \
        e2e/tests/part-ux-audit.spec.ts \
        e2e/tests/vendor-sources-screenshot.spec.ts
# Plus the umbrella docs
cd .. && git add docs/part-ux-review-2026-05-04.md docs/part-vendor-sources-restructure-2026-05-04.md
```

**Option B — two stacked branches** so the philosophy can land independently (risk: vendor-sources stack-on-top adds the dependency on the philosophy's `currentStepRationaleKey` lookup; the rationale convention `{entityPlural}.workflow.{stepId}.rationale` is what the new vendor-sources rationale text uses).

I'd lean Option A — they're conceptually one continuous "make Part workflow great" effort, and splitting them creates rebase work on the second PR for no real value.

To **discard** instead: `cd qb-engineer-ui && git checkout -- public/ src/ && git clean -fd e2e/tests/vendor-sources-screenshot.spec.ts src/app/features/parts/components/vendor-sources-panel/`.
