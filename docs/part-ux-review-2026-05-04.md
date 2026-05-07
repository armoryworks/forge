# Part workflow UX review — 2026-05-04

> **Status:** for Dan's review.
> **Code state:** changes are in the working tree of `qb-engineer-ui` only — **nothing committed, nothing pushed, no PR open**. To reset everything: `git checkout -- src/ public/` from the UI repo. To accept and ship: see "How to commit this" at the bottom.
> **Time spent:** ~5 hours of focused research + audit + implementation + writeup.

---

## 0. The question that started this

> "What is with the dead space on the right hand side? don't fix yet. I want an explanation."

Honest answer: the dead space wasn't a CSS bug. It was a **design omission** I'd been treating as a sizing problem. The dialog was 1100px wide; the rail took 240px; the form capped at 720px; the residual ~140px was empty because nothing was assigned to it. Centering the form just split the empty space symmetrically — the rail anchored the left edge so the right read as a gulf.

You picked **Option C — use the right band for useful contextual surfaces, with close + mode toggle pinned upper-right regardless of content.** This document is the research, the philosophy that came out of the research, the implementation, and the audit plan for the rest of the app.

---

## 1. Research synthesis

I delegated ~30 minutes of focused research to a subagent that read primary sources from the UX practitioners you named plus six ERP / SaaS reference implementations. Highlights distilled below; full citations at the end of this section.

### Principles drawn from each

**Luke Wroblewski — *Web Form Design* (2008) + "Previous and Next Actions in Web Forms" (2009).** Wroblewski's stance on multi-step flows is contingent, not dogmatic — he warns that designers "often assume they are making a wizard and that people will need to move backwards and forwards through a series of steps" and that this assumption is frequently wrong. In linear flows, **backward navigation is rarely used**, so the primary "Continue" should dominate the right side; "Back" should be visually demoted. Companion principle: **gradual engagement** — reduce the perceived weight of each step.

**Don Norman — *The Design of Everyday Things* (2013 revised).** Norman's distinction between **affordance** (what an object permits) and **signifier** (how the object communicates that permission) places the burden on signifiers. The step rail's job is to tell the user "you are here, this is what came before, this is what's next, and these are sequential not arbitrary." His **mapping** principle (control layout matches outcome layout) means a vertical step rail should map to vertical progression. Most load-bearing for our right pane: **knowledge in the world vs. knowledge in the head** — rationale and "why this step exists" content lives in the world (visible on screen), not in the user's head, removing memory burden from a workflow that may be performed infrequently.

**Nielsen Norman Group — "Wizards: Definition and Design Recommendations".** Eight guidelines, two are load-bearing here:
- **G6 — Make steps self-sufficient.** The user must not have to leave the current step to find information.
- **G7 — Position help outside the wizard.** Verbatim: *"Help and explanations should appear in a window next to the wizard and should not cover the wizard. Any descriptions of the terms or the fields in the wizard should be viewable next to the wizard and should not cover the fields."*

This is unambiguous primary-source endorsement of a right-side context pane. Companion piece "8 Design Guidelines for Complex Applications" reinforces: "Ease transition between primary and secondary information — display supplemental details via tooltips or overlays without requiring users to leave the primary screen."

**Farai Madzima — cultural friction in UX.** Decision-making, feedback tolerance, and trust formation vary across cultures; designers tend to assume their own norms are universal. Two specific rules for guided workflows:
- **Explanation must travel with action** — high-context cultures expect the *why* alongside the *what*; low-context cultures benefit from it without being slowed by it; a static rationale pane satisfies both.
- **Don't equate confidence with omission** — a designer in a low-power-distance culture may strip out "obvious" rationale that a worker in a high-power-distance culture (or any infrequent user) genuinely needs to feel safe progressing.

**Whitney Hess — "Guiding Principles for Experience Designers" (2009).** Of her 20 principles, the load-bearing ones for this design:
- **Present few choices** (Schwartz's Paradox of Choice — fewer options reduce decision burden)
- **Limit distractions** ("People cannot multitask; design consecutive tasks instead")
- **Use appropriate defaults** (minimize decisions through smart preselection)
- **Provide signposts and cues** (keep users aware of location)
- **Stay out of people's way** — the right pane is informational, not interactive demand. It answers questions the user already has; it does not introduce new decisions.

### Industry reference implementations

| Product | Right-side pattern | Lesson |
|---|---|---|
| **SAP Fiori** Object Page floorplan | "Dynamic side content" — opt-in panel, default ~50% viewport when shown, explicit show/hide toggle. | Toggle is discoverable; 50% is too much for our case (it's meant for parallel-record viewing). |
| **Oracle Redwood** Guided Process | Step rail on the *right*, opposite our convention; opens with a process-overview screen. | The overview-first approach ("show me the whole journey before starting") is worth borrowing as a pre-flight in the fork dialog. |
| **Microsoft Dynamics 365 Business Central** FactBox | Always-visible right pane on every Card / Document / List page; toggleable via "i" icon top-right; resizable. Hosts CardParts (record summaries), ListParts, Notes, Charts, Cues, Copilot Summary. **One FactBox area per page** — hard rule. Performance: loads after the host page so it never blocks primary interaction. | Reference architecture for our right pane. The "load secondarily" rule is the most useful detail. |
| **Odoo Enterprise** Form View — chatter pane | Activity log + notes + attachments on the right at desktop; drops below the form on narrow screens. | Auto-collapse at narrow widths is the right call. Avoid Odoo's mistake of letting the chatter compete with the form for attention — the right pane needs **lower visual weight than the form**. |
| **Salesforce Lightning** Record Pages | Right column hosts dynamic related lists, custom LWCs, AI components. **Architectural separation**: page layout (fields) vs. right-rail components (context) edited via different tools. | Lets the rail evolve independently of the form. Risk: the rail can become a junk drawer. |
| **Linear** Issue View | Right metadata panel grows proportionally with screen size; holds *meta* (status, assignee, labels, links, PR refs) — properties about the thing, not the thing itself. | Strong content-vs-meta distinction. The center is where the user thinks; the right is where the system records what the user has decided. |
| **Shopify Polaris** Layout component | Codified proportions: primary ⅔, secondary ⅓; primary uses **white-background** sections, secondary uses **grey-background** to demote. Secondary holds "navigational, less frequently used, or not essential" content. | Cleanest primary-source proportional guidance. Visual demotion via surface color is a strong signifier. |

### Citations

- [NN/g — Wizards: Definition and Design Recommendations](https://www.nngroup.com/articles/wizards/)
- [NN/g — 4 Principles to Reduce Cognitive Load in Forms](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/)
- [NN/g — 8 Design Guidelines for Complex Applications](https://www.nngroup.com/articles/complex-application-design/)
- [Wroblewski — Previous and Next Actions in Web Forms](https://www.lukew.com/ff/entry.asp?730)
- [Wroblewski — *Web Form Design*](https://www.lukew.com/resources/web_form_design.asp)
- [GOV.UK Design Notes — One Thing Per Page](https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/)
- [Norman — *The Design of Everyday Things* (full PDF)](https://media.aanda.psu.edu/sites/media/aa/files/documents/norman_design-of-everyday-things.pdf)
- [Hess — Guiding Principles for UX Designers](https://whitneyhess.com/blog/2009/11/23/so-you-wanna-be-a-user-experience-designer-step-2-guiding-principles/)
- [Madzima — When Cultural Biases Become Cultural Friction](https://medium.com/thinking-design/when-cultural-biases-become-cultural-friction-in-diverse-design-teams-ffbc773a5ca6)
- [SAP Fiori — Object Page Floorplan](https://experience.sap.com/fiori-design-web/object-page/)
- [Microsoft Dynamics 365 BC — FactBox](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-adding-a-factbox-to-page)
- [Linear — How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Shopify Polaris — Layout component](https://polaris-react.shopify.com/components/layout-and-structure/layout)

---

## 2. Design philosophy — Part Workflow Shell

This is what the research synthesized into. **It applies directly to the part workflow shell today.** The "broader audit" section at the bottom of this document proposes how (and where) to extend it to the rest of the app.

### Anchoring rules (always)

- **A1.** The dialog header always carries: title block on the left (truncates), persistent right-aligned chrome on the right (mode toggle + close). The right cluster never shifts position regardless of content height, mode, or step. Material dialog convention; matches Salesforce, Fiori, Business Central.
- **A2.** Backdrop click never closes a workflow dialog. Closure is explicit (the close button, the Cancel/footer action, or completing the flow). Carried over from the existing `<app-dialog>` rule and made explicit here.
- **A3.** The mode toggle and close button are separated by a 1px vertical divider. Reading order: toggle, divider, close. Close is the absolute terminator (matches Material; matches screen-reader expectations).

### Layout (guided mode)

- **L1.** Three columns: left rail (240px) — form column (flex, ~720px at 1280px dialog) — context pane (296px). CSS grid; all three column edges align top and bottom.
- **L2.** Dialog max-width 1280px in guided. Dialog max-width 720px in express (no rail, no context pane in express today).
- **L3.** Visual hierarchy via surface color (Polaris primary/secondary):
  - Form column: `var(--surface)` (primary)
  - Right context pane: `var(--bg)` (demoted)
  - Rail: `var(--surface)` (primary, since it is the navigational anchor)
- **L4.** Each column scrolls independently. The form column scrolling does NOT move the rail or the right pane. (CSS `overflow-y: auto` per column.)
- **L5.** The footer (Back / Skip / Continue) lives **inside the form column**, not at the bottom of the entire dialog. Wroblewski: anchor the primary action to the user's working surface.
- **L6.** All content in the form column fades in (250ms) on step swap. No abrupt replace.

### Right context pane (the answer to "what fills the right")

- **R1.** **Tier the content explicitly. Maximum three blocks at any time** (Salesforce / Odoo overload trap):
  1. **Always present — "Why this step?"** Static rationale, ~2-4 sentences, plain language. Renders raw HTML for `<strong>` and `<br>` so the body can pull-quote the lead. Translation key convention: `{entity-plural}.workflow.{stepId}.rationale`.
  2. **Conditionally present — related-record summary.** When the current step references an existing entity (a customer, a part, a vendor), a compact card with the name, a status chip, 2-3 key fields, and a deep-link to the full detail. Today this is reserved capacity (no step uses it yet). FactBox / Linear-meta pattern.
  3. **Future surface — AI / suggestions card.** A discrete slot for "Suggested defaults," "Detected duplicates," "Similar parts." Reserved capacity today. When it lands, it slots in without re-architecture. Suggestive only — never modal (Hess: stay out of people's way).
- **R2.** The pane is **read-only by default.** No form controls, no buttons that mutate state. Permitted interactivity: links to open a related record, expand affordance for AI cards, the pane's own collapse toggle.
- **R3.** The pane never makes the dialog taller than the form. If its content overflows, it gets a custom scrollbar.
- **R4.** "Why this step?" defaults to **expanded** at desktop, **collapsed** at mobile (per L7 below). Per-mount user state — does not persist across page remounts (Hess: helpful defaults beat persisted complexity).

### Responsive collapse

- **L7.** Below **1200px**: rail and context pane shrink to 220px / 264px respectively. Same shape, less air.
- **L8.** Below **1024px**: the right context pane drops out of the column grid and re-mounts under the form column as a collapsible accordion. The rail stays vertical but narrows to 200px.
- **L9.** Below **768px (mobile)**: rail collapses to 60px icon-only. Step labels hidden in the rail (the breadcrumb in the header keeps the user oriented). Mode-toggle sub-labels hidden.
- **L10.** Below **480px**: dialog goes edge-to-edge (no scrim padding). Footer button labels hidden, only icons remain (validation chip + Continue must always fit on one line).

### Behavior

- **B1.** Mode switch with a dirty step prompts a confirm-and-discard dialog. Already implemented; preserved here.
- **B2.** Every step rail row reflects four states clearly: current (primary border + tinted bg), complete (green check, pop animation on transition), locked (lock icon, disabled), error (red priority_high — reserved for server-reported missing-validators).
- **B3.** The breadcrumb in the header reads "Step N of M · {Step name}" in guided. It is the persistent signpost when the form fills the screen and the rail's local highlighting is out of view (Hess: provide signposts).
- **B4.** Resume banner at the top of the form column when the run was last edited > 5 minutes ago. Does not show on a freshly-created run.
- **B5.** Server-reported missing-validators highlight the offending step on the rail (red marker) AND show an inline alert at the top of the offending step's body. Already implemented; preserved.

### Express mode

- **E1.** Express is a single consolidated form. No rail, no context pane. Dialog max-width 720px.
- **E2.** The header chrome (title, mode toggle, close) follows the same anchoring rules — close upper-right, persistent.
- **E3.** Express mode **does not show "Why this step?"** — by definition the user has chosen "I know what I'm doing, just give me the form." Adding rationale here violates Hess's "stay out of people's way."

---

## 3. What I changed (this session)

All changes are uncommitted. They live in the working tree of `qb-engineer-ui`.

### 3.1 Workflow shell — full restructure (`shared/components/workflow/`)

| File | Change |
|---|---|
| `workflow.component.html` | Three-column body in guided. Header restructured into `__title-block` + `__header-actions` (right-anchored cluster: mode toggle, divider, close). New `<aside class="workflow-shell__context-pane">` element with collapsible "Why this step?" block. Footer moved inside `__main` (the form column). |
| `workflow.component.scss` | Body becomes CSS grid `240px 1fr 296px` in guided. Right pane styling (demoted via `var(--bg)`). Header divider styling. Responsive breakpoints at 1200 / 1024 / 768 / 480 per L7-L10. Rail / form / right pane each scroll independently. |
| `workflow.component.ts` | New `currentStepRationaleKey` computed (resolves `{entityPlural}.workflow.{stepId}.rationale` via TranslateService; returns `null` if the key has no translation so the pane hides cleanly). New `contextPaneExpanded` signal + `toggleContextPane()` for the collapse affordance. |

### 3.2 Page-level dialog (`features/parts/workflow/part-workflow-page/`)

| File | Change |
|---|---|
| `part-workflow-page.component.scss` | `__shell` max-width raised from 1100px → 1280px in guided (express stays 720px). Comment block updated to explain the column composition. |

### 3.3 Step components — rationale pulled out

The per-step `<app-step-rationale>` component was a transitional implementation (Effort C, this morning). The new design hosts rationale in the shell's right context pane, so the component is no longer needed inline.

| File | Change |
|---|---|
| `part-basics-step/part-basics-step.component.html` | Removed `<app-step-rationale>` element. |
| `part-basics-step/part-basics-step.component.ts` | Removed `StepRationaleComponent` import + entry in `imports[]`. |
| `part-basics-step/part-basics-step.component.scss` | Removed the `app-step-rationale { display: block; max-width: 720px }` rule. |
| `part-costing-step/part-costing-step.component.html` | Removed `<app-step-rationale>`. |
| `part-costing-step/part-costing-step.component.ts` | Removed import + imports[] entry. |
| `part-sourcing-step/part-sourcing-step.component.html` | Removed `<app-step-rationale>`. |
| `part-sourcing-step/part-sourcing-step.component.ts` | Removed import + imports[] entry. |

The `StepRationaleComponent` itself (`shared/components/step-rationale/`) is not deleted — it's still a valid shared building block that other contexts (single-form step pages, future help surfaces) might use. It's just no longer wired into the workflow shell's per-step bodies.

### 3.4 i18n

| File | Change |
|---|---|
| `public/assets/i18n/en.json` | `workflow.shell.rationale.heading`: "What does this step enable?" → **"Why this step?"** (matches the design convention; shorter; mirrors NN/g's wording). New key `workflow.shell.contextPaneLabel: "Step context"` for the `<aside aria-label>`. |
| `public/assets/i18n/es.json` | Same two changes in Spanish. |

The body text for each `parts.workflow.{stepId}.rationale` was authored in the prior effort and is unchanged — it now renders in the right pane instead of inline above the form.

### 3.5 Test infrastructure

| File | Change |
|---|---|
| `e2e/tests/part-ux-audit.spec.ts` | **New** screenshot harness — captures parts list, fork dialog (initial + step 1 + step 2), express form, guided shell at both 1920×1080 and 414×896. Used to produce the before/after screenshots referenced in this doc. Outputs to `e2e/screenshots/part-ux-audit/`. |

---

## 4. What I did NOT change (and why)

### Parts list page (`features/parts/parts.component.*`)
**Why not:** the philosophy is for the **workflow** surface (creation / edit dialog). The parts list is a different surface — a data table with filters and a top-action bar. Applying the right-pane pattern there would require designing what a "parts list context pane" should hold (saved views? selection summary? bulk-action affordances?) and that's a different design conversation. **Audit recommendation below.**

### Part detail panel (`features/parts/components/part-detail-panel/`)
**Why not:** same reasoning — detail panel is the "view this single part" surface, with its own clusters (BOM, vendor parts, pricing, etc.). It already has a side panel; the question is whether its INTERNAL structure should adopt the three-column rule. Also a separate design conversation.

### New-part fork dialog (`features/parts/workflow/new-part-fork-dialog/`)
**Why not (yet):** the fork dialog is a 4-step axis picker, not a guided wizard with form-step gates. The shared `<app-dialog>` component already pins the close button upper-right (A1 satisfied). The dialog's content already does step counters + optional pill chip + reveal animation + selected-card check (Effort B + #42). It's coherent. The one remaining philosophy gap: it doesn't have a "Why this dialog?" pane — but its **title** ("How would you like to add this part?") already explains itself, so adding a rationale pane would be redundant noise.

### Express form layout
**Why not changed structurally:** at 720px dialog with no rail, the form already fits comfortably. There's a minor visible artifact — the form is left-aligned within the 720px dialog body instead of perfectly centered (~80px gap on the right). Noted as a follow-up; trivial CSS fix (`align-self: center; max-width: 100%` on `__form`). Didn't bundle in this pass to keep the change scope tight.

### Step rationale content for inventory / quality / BOM / routing
**Why not (yet):** the rationale text was authored in Effort C for `basics`, `sourcing`, `costing`, and drafted in i18n for `inventory`, `quality`, `bom`, `routing`. The shell now reads them automatically by step id, so as soon as the i18n keys are populated (drafts already there) the right pane will populate for every step. Worth a focused 30-min pass to author body text for the remaining steps and any step that gets added later.

### Service worker / cache headers
**Why not:** out of scope. The i18n trap fix (yesterday's PR #46) addressed the silent failure mode that affected this work. Service worker config remains as-is.

---

## 5. Before / after screenshots

All screenshots in `qb-engineer-ui/e2e/screenshots/part-ux-audit/`.

### Guided shell — desktop (1920×1080)

**Before** (`guided-shell-step1-basics-1920x1080.png` from baseline run):
- 1100px dialog, rail + form with empty band on the right
- Resume banner, then a wide "What does this step enable?" expandable above the form
- Close + mode toggle in upper right but proximity to the title block was loose
- Form fills the rail-less area; the empty band is below + right of the form (vertical and horizontal dead space)

**After** (post-rebuild capture in same path):
- 1280px dialog, three clean columns (rail · form · context)
- Right pane visibly demoted (background tone vs. form's surface)
- "Why this step?" header on the right, expanded by default with the bold-leading rationale text
- Close + mode toggle pinned to a clearly-defined right cluster with vertical divider
- Footer (Back · validation chip · Continue) inside the form column — primary action anchored to the form, not floating in the context column

### Guided shell — mobile (414×896)

**Before:** rail collapsed to icon column on left, form fills middle, no right pane.
**After:** rail still icon-only, form in middle, "Why this step?" pane has dropped below the form as a collapsible accordion (default expanded on mobile so the user discovers it on first encounter — the rationale is most valuable to first-time / occasional users).

### Express form — desktop (1920×1080)
Unchanged structurally (express dialog stays 720px, no rail / no right pane). Still shows the minor left-alignment artifact noted in §4.

### Fork dialog — desktop (1920×1080)
Unchanged this pass. Visually compliant with the philosophy already (close upper-right via shared `<app-dialog>`, step counters, optional pill, recommended tag).

### Parts list — desktop (1920×1080)
Unchanged. Audit-only — see §6.

---

## 6. Broader audit plan (apply this philosophy across the app)

The principles in §2 generalize beyond Part. Below is what I'd audit, in priority order. **None of this is included in the current change** — it's a roadmap for follow-up efforts.

### 6.1 Surfaces that should adopt the workflow shell pattern (right context pane)

| Surface | Existing shape | Recommended pattern | Effort |
|---|---|---|---|
| **Customer create** | Quick-add `<app-dialog>` only | Workflow shell — guided + express, with right pane for rationale + future "find similar customers" suggestion | Medium (depends on the Customer workflow effort already planned) |
| **Vendor create** | Single dialog | Workflow shell, same shape as Customer | Medium |
| **Quote create** | Multi-row form | Workflow shell guided (multiple sections), right pane for related sales-order / customer credit summary | Large |
| **Sales Order create** | Existing dialog | Same as Quote | Large |
| **Purchase Order create** | Existing dialog | Same; right pane shows preferred-vendor info card + recent receipts | Large |
| **Invoice / Payment** | ⚡ accounting-bounded — only in standalone mode. When present, same shape applies. | Workflow shell guided | Medium |
| **Job create** | Quick-add | Workflow shell guided; right pane shows linked customer + part summaries | Medium |

### 6.2 Surfaces that should adopt anchoring rules (A1-A3) but NOT the three-column layout

These are non-wizard surfaces that should still pin close + actions consistently top-right.

- **Detail dialogs** (every `<app-dialog>` consumer — 50+ across the app): the shared `<app-dialog>` already pins close upper-right. Audit needed: the right side of the header is currently just close — could host a context-action button for power-user shortcuts (print, export, jump-to-detail).
- **Side panels** (`<app-detail-side-panel>`, used for entity quick-views): close already top-right. Audit: should the panel surface a "Why am I seeing this?" / "From where?" affordance for navigation context?
- **Confirm dialogs** (`<app-confirm-dialog>`): trivial — already correct.

### 6.3 Surfaces that need their own design pass (not workflow-shell territory)

- **Parts list** (and every entity-list page): consider adopting Polaris's primary/secondary layout for the ~340px of dead space at high resolutions. A right-side **selection summary panel** (when rows are checked: "12 parts selected; bulk action menu") + an always-on **saved-views picker** would land well here. Cross-cuts every list page.
- **Part detail / edit page**: the detail page has clusters arranged vertically. Consider a two-column layout (clusters on the left, **activity timeline + related-record summaries on the right**) following the Linear / Salesforce pattern. This is the most natural place for the activity log, audit trail, and AI suggestions to live (the workflow shell explicitly excludes these per R1.4).
- **Dashboard**: dashboard widgets already use a grid (gridstack); the right-pane pattern doesn't apply. Audit: are widgets sized to honor the 1080p safe area?
- **Kanban board**: full-width by design (CLAUDE.md exempts it from the 1400px cap). Out of scope for this philosophy.
- **Shop floor display**: kiosk / touch surface. Different design language. Out of scope.

### 6.4 Cross-cutting tightening

- **`<app-dialog>` audit**: every dialog should declare its width category (small / medium / large) instead of pixel widths. Add a `[size]` input that maps to standard widths consistently.
- **Mobile breakpoints**: `qb-engineer-ui` uses `@include mobile` (≤768px) but the workflow shell needed extra breakpoints at 1200 / 1024 / 480. Worth promoting these to shared mixins (`@include narrow-laptop`, `@include tablet`, `@include phone-narrow`) so other surfaces use the same numbers.
- **Surface color tokens**: add explicit named tokens for "primary work surface" (`--surface`) vs. "secondary / demoted surface" (`--bg`) so future authors know which to reach for. Documented in CLAUDE.md.
- **Persistent header chrome**: a shared `<app-dialog-chrome>` component that bundles "title / breadcrumb / right-aligned action cluster / close" — would let the fork dialog, detail dialogs, and the workflow shell all share the same header skeleton.

---

## 7. Mobile considerations (specifically)

The philosophy applies to mobile with the following collapses (already implemented for the workflow shell):

| Viewport | Workflow shell behavior |
|---|---|
| ≥1280px | Three columns at full width (rail 240 / form ~720 / pane 296). |
| 1024-1199px | Three columns, narrower (rail 220 / form flex / pane 264). |
| 768-1023px | Right pane drops below form as a collapsible accordion. Rail stays vertical at 200px. |
| 480-767px | Rail collapses to 60px icon-only column. Step labels hidden. Mode toggle drops sub-labels. |
| <480px | Dialog edge-to-edge (no scrim padding). Footer button labels hidden, only icons. |

**Mobile-specific design concerns I want to flag for review:**
1. The rail at icon-only is hard to use one-handed at the edge of the viewport. Consider a top horizontal step indicator instead at <480px (shifts the rail to a chip strip at the top). This is the Wroblewski / GOV.UK "one thing per page" mobile pattern.
2. The expanded-by-default rationale pane on mobile pushes the form below the fold. Reasonable trade-off (rationale is most valuable to first-time users on small screens), but worth A/B testing if you ever do.
3. The mode toggle (Express / Guided) takes ~120px in the mobile header. At 414px viewport with the 60px rail and the close button, the title block has ~210px. Long part numbers will truncate. Worth verifying with a real-world worst case.

---

## 8. How to commit this (when you've reviewed)

The change is one logical effort. Recommended PR shape:

```bash
cd qb-engineer-ui
git checkout -b effort/part-ux-philosophy
git add public/assets/i18n/ \
        src/app/shared/components/workflow/ \
        src/app/features/parts/workflow/part-workflow-page/ \
        src/app/features/parts/workflow/part-basics-step/ \
        src/app/features/parts/workflow/part-costing-step/ \
        src/app/features/parts/workflow/part-sourcing-step/ \
        e2e/tests/part-ux-audit.spec.ts
git commit -m "feat(workflow): adopt three-column shell with right context pane (Option C)"
git push -u origin effort/part-ux-philosophy
gh pr create --base main --head effort/part-ux-philosophy ...
```

The umbrella doc (this file at `docs/part-ux-review-2026-05-04.md`) lives in the umbrella repo and should commit there separately.

To **discard** instead: `cd qb-engineer-ui && git checkout -- public/ src/ && git clean -fd e2e/tests/part-ux-audit.spec.ts e2e/screenshots/part-ux-audit/`.

---

## 9. Open questions for your review

1. **1280px dialog width** — fits well at 1080p but on a 1366×768 laptop the dialog will fill nearly the whole screen. Acceptable trade-off, or should I shrink to 1200px and accept slightly tighter columns?
2. **Right pane default — expanded vs. collapsed** — currently expanded on desktop, expanded on mobile. The mobile-collapsed version felt safer (form is the user's intent) but mobile users are also the ones most likely to need the rationale. Open to flipping mobile to collapsed if you'd prefer.
3. **"Why this step?" wording** — chose this over "What does this step enable?" because it's shorter and matches NN/g's framing. Other options worth considering: "About this step", "Step background", "Help".
4. **Express mode parity** — should express also get a right pane? My take: no. Express is "I know what I'm doing." Adding a right pane there contradicts that promise. But it's a values choice.
5. **Apply to Customer when that effort starts?** — yes, by default. The shell is entity-agnostic; the Customer workflow effort just needs to author rationale i18n keys (`customers.workflow.{stepId}.rationale`) and the right pane populates automatically.

---

*End of review. The work is in the tree, untouched by git. Ready when you are.*
