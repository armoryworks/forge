# CLAUDE.md slim — proposal

> **Status:** proposal, not yet executed. The actual slim is a separate PR after this proposal is reviewed
> and the rules-stay vs reference-moves split is locked in.

## Why

`CLAUDE.md` is 2,328 lines and is loaded into every Claude Code session. Every prompt pays the
context cost. The audit found ~600 lines of "Usage Guide" reference material plus several large
operational/test/historical blocks that don't drive behavior on every interaction; they're consulted
when working in a specific area. Those can move out without losing anything if the move is done
carefully.

## The consistency problem

When CLAUDE.md was previously slimmed, behavior consistency drifted. The cause was treating "rule"
and "reference" as the same kind of content. They aren't:

- A **rule** must fire every interaction. ("Never use raw `<input>`.") If it moves out, Claude
  doesn't read the destination doc proactively → the rule stops firing → drift.
- A **reference** is consulted when working in a specific area. ("How does the `<app-data-table>`
  filter slot work?") This can live in a separate doc, but lookup has to actually happen.

The slim must:
1. **Keep every rule in CLAUDE.md verbatim.** Behavior-shaping content stays.
2. **Move only reference / usage material out.** And only if there's a reliable way to make sure
   the right doc gets consulted at the right time.

## What stays in CLAUDE.md (rules pile)

These are the lines that fire on every interaction. Touching them risks regressions in already-
established behavior.

### Critical rules

- The "ONE OBJECT PER FILE" rule.
- Naming-conventions tables (Angular, .NET, person-names, dates, DB, Docker).
- Import-ordering rules.
- All "Never X / Always Y" lists at the top of the Angular Patterns, .NET Patterns, and
  "What NOT to Do" sections.
- The Save-Action rule, validation-button stereotype rule, button-taxonomy table.
- The accounting-boundary rules (which features are gated behind capability mutex).
- The capability-gating section (the rule, not the deep-dive).
- The activity-logging rules (definitional vs transactional split, indexing-points rule, rollup
  rule, action-verb conventions, helper handles current user).
- Loading-states decision matrix.
- The auto-restart-API rule, visual-verification rule.
- The space-efficiency rule.
- The branch + PR workflow (hard rules — the long workflow narrative can move; the rules stay).
- Form-control-wrappers rule, dialog-pattern rule, date-handling rule, URL-as-source-of-truth rule.

### Architectural facts (Claude needs these to navigate)

- Project structure tree (the directory layout).
- Tech-stack list.
- The shared-components TABLE (one row per component with selector + key inputs). The
  *implementation example* moves out; the table that says "this exists, here's its selector" stays.
- The shared-services and shared-directives tables.
- Entity tables (entities by domain, enum lists). These are how Claude learns what entities exist.
- Features-implemented and Planned-features tables (status snapshot).
- Pillar 1 + Pillar 3 summaries (one paragraph each — see "moves" pile for the deep blocks).

### Standards already codified in CLAUDE.md

- SCSS design system (variables, mixins, shared classes, button taxonomy, icon standards).
- Material theme overrides discipline.
- API conventions (RESTful, status codes, error handling).
- Testing conventions (Vitest, xUnit, Cypress, Playwright entry points + helpers).
- Pagination patterns.
- Multi-tab handling, offline resilience.

## What moves out (reference pile)

Each item below has a destination doc and an inbound trigger so the lookup happens at the right
moment. The content stays in CLAUDE.md until its destination + trigger are both in place.

### 1. Per-component "Usage Guide" sections → `docs/ui-components.md`

Approx 600 lines covering one usage block per shared component:

- `AppDataTableComponent`, `ConfirmDialogComponent`, `DetailSidePanelComponent`, `SlideoutComponent`
- `DetailDialogService`, `PageLayoutComponent`, `EntityLinkComponent`, `EntityPickerComponent`
- `FileUploadZoneComponent`, `AutocompleteComponent`, `ToolbarComponent` + `SpacerDirective`
- `DateRangePickerComponent`, `ActivityTimelineComponent`, `ListPanelComponent`
- `KanbanColumnHeaderComponent`, `QuickActionPanelComponent`, `MiniCalendarWidgetComponent`
- `ScannerService`, `LoadingService`, `LoadingBlockDirective`, `HttpErrorInterceptor`
- `TerminologyService` + `TerminologyPipe`, `NotificationService`
- SignalR services (`SignalrService`, `BoardHubService`, `NotificationHubService`, `TimerHubService`,
  `ConnectionBannerComponent`)
- Form Draft / Unsaved Changes system

The component **TABLE** (with selector + key inputs) stays in CLAUDE.md — Claude needs that to know
the component exists. The example markup + behavior detail moves to ui-components.md.

**Inbound trigger:** PreToolUse hook on `Write|Edit` matching
`qb-engineer-ui/src/app/features/**/*.component.html` or `**/*.component.ts`. Hook injects:
*"Editing a feature component: consult `docs/ui-components.md` for shared-component usage and
`docs/coding-standards.md` for form-control rules."*

### 2. Branch + PR Workflow (long form) → `docs/branch-pr-workflow.md`

About 130 lines. The hard rules (10 bullets at the bottom of the section) STAY in CLAUDE.md; the
long narrative ("Effort branches", "Per-feature work inside an effort", "Wrapping the effort", PR
template) moves out.

**Inbound trigger:** PreToolUse hook on `Bash` matching `git push|gh pr create|gh pr merge`. Hook
injects: *"Branch + PR operation detected: see `docs/branch-pr-workflow.md` for the full effort/PR
sequence; CLAUDE.md has the hard rules."*

### 3. Pillar 1 + Pillar 3 deep blocks → `docs/architectural-pillars.md`

About 80 lines documenting the part-type decomposition + vendor-part intersection in detail. CLAUDE.md
keeps a one-paragraph summary pointing at the deep doc.

Most of this material is also being captured in `docs/functional-reference/parts.md` (Sections 17 and
21) as part of the Pillars 1 + 3 drift fix. Once `parts.md` lands, the CLAUDE.md block can be reduced
to a pointer at parts.md without creating a separate `architectural-pillars.md`.

**Decision:** drop the separate file; CLAUDE.md points directly at `parts.md` Section 17 + 21 for
the deep model.

### 4. Capability Gating deep block → `docs/functional-reference/capabilities.md`

The capabilities deep-dive is being written as part of this same audit follow-up (sibling to
`workflow-engine.md`). Once landed, CLAUDE.md keeps the rule ("every new endpoint either reuses an
existing capability or registers a new one") and the one-line "see capabilities.md for full model"
pointer.

**Inbound trigger:** PreToolUse hook on `Write|Edit` matching `**/Controllers/*.cs` or
`**/Features/**/*.cs`. Injects: *"Editing a controller / handler: confirm capability tagging — see
`docs/functional-reference/capabilities.md` for the registration + tagging pattern."*

### 5. E2E Simulation Framework + IClock + Docker scripts + Port Conflict diagnostic
→ `docs/operations.md` + `docs/testing-strategy.md` (both already exist)

Operational guidance (~150 lines) that's rarely consulted during code generation. Move the
narrative; keep one pointer line in CLAUDE.md.

**Inbound trigger:** PreToolUse hook on `Bash` matching `docker compose|playwright|setup\.sh|refresh\.sh`.
Injects: *"Docker/Playwright operation: see `docs/operations.md` for setup, refresh, and port-conflict
diagnostic; `docs/testing-strategy.md` for test commands."*

### 6. Shared component / service / directive tables (full version) → `docs/ui-components.md`

The CLAUDE.md tables are stale (audit found ~25 missing components, ~20 missing services). Two
options:

**Option A (recommended):** ui-components.md becomes the authoritative full table. CLAUDE.md keeps a
**short** version listing only the most frequently-used components (DataTable, Dialog, Input,
Select, ValidationButton, EntityPicker, etc. — maybe 15-20 entries) plus a "see ui-components.md
for the full catalog" line.

**Option B:** keep the full table in CLAUDE.md, just synchronize it with reality. Pays no slim
benefit but eliminates the drift.

Recommend A — the full table is reference material that reads well when scanning a doc; cramming
all of it into CLAUDE.md just inflates context for the 80% case where Claude touches one of the
top-20 components.

## What does NOT move

These were considered for extraction and rejected:

- **Activity logging rules** — these MUST fire whenever a handler is being written. They're behavior
  rules, not reference. Stay in CLAUDE.md as-is.
- **Form-control wrappers + Dialog pattern + Validation pattern** — same. Behavior rules.
- **Date Handling rule** — behavior rule. Stay.
- **The "What NOT to Do" list** — behavior rules. Stay.
- **Loading-states decision matrix** — behavior rule (decides which loading mechanism to use).
  Could be extracted but high risk of regression; the matrix is consulted on most data-fetching
  code paths. Recommend keep in CLAUDE.md.
- **URL-as-source-of-truth rule** — behavior rule. Stay.
- **Naming convention tables** — behavior rule. Stay.

## Hook design

The slim relies on PreToolUse hooks to make sure the right reference doc gets consulted at the
right moment. Hooks live in `.claude/settings.json` (project-scoped, committed). Skeleton:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "If the file path matches a UI component (qb-engineer-ui/src/app/features/**/*.component.{html,ts} or qb-engineer-ui/src/app/shared/components/**/*.{html,ts}), respond with the contents of docs/ui-components.md filtered to the components referenced in the file. Otherwise respond with empty string."
          }
        ]
      }
    ]
  }
}
```

Tradeoffs:
- **Prompt hooks cost LLM calls.** Every Write/Edit pays a small inference round-trip. Acceptable
  if the alternative is bloated CLAUDE.md.
- **Hook patterns can go stale.** If a folder is renamed and the hook isn't updated, the trigger
  silently stops firing. Mitigation: keep patterns coarse (`**/components/**`, not specific paths)
  and review the hook list as part of any folder restructure.
- **Hook errors are silent in the UI.** A broken hook = a missing inject. A periodic sanity check
  (e.g., a `chore/audit-hooks` task quarterly) catches drift.

Alternative if hooks feel risky: leave the full content in CLAUDE.md but use clear section
boundaries + a TOC at the top so Claude can skim and self-jump to relevant sections rather than
processing the entire 2,328 lines as one wall of context. (This is less aggressive but
zero-regression-risk.)

## Recommended sequence

1. **Land the audit follow-up docs first.** `parts.md` drift fix, `workflow-engine.md`,
   `capabilities.md`, `ui-components.md` updates. These are the destinations the slim relies on.
2. **Add the hooks.** Test that they fire and inject the right docs. Don't slim CLAUDE.md yet —
   verify the trigger mechanism works in isolation.
3. **Slim in chunks**, reviewing behavior consistency after each:
   - Move per-component Usage Guides → ui-components.md (biggest win, lowest risk since the
     content already largely exists in ui-components.md)
   - Move Branch+PR long-form → branch-pr-workflow.md
   - Reduce Capability Gating block to a pointer at capabilities.md
   - Reduce Pillar 1/3 blocks to pointers at parts.md
   - Move Operations / E2E Simulation / Docker scripts → operations.md
4. **Pause and observe.** Run a few sessions with the slimmed CLAUDE.md, watch for behavior drift.
   Roll back any extraction that regresses.

## Expected size

| Block | Current | After slim | Notes |
|-------|---------|-----------|-------|
| Critical rules (kept verbatim) | ~400 lines | ~400 lines | No change. |
| Architectural facts + naming + structure | ~250 | ~250 | No change. |
| Shared components/services/directives table | ~280 | ~80 | Top-20 only; pointer at ui-components.md |
| Per-component Usage Guides | ~600 | 0 | Moves to ui-components.md |
| Pattern docs (form, dialog, validation, save action, etc.) | ~250 | ~250 | Behavior rules — stay verbatim |
| Activity logging rules | ~80 | ~80 | Behavior rules — stay |
| Loading states + decision matrix | ~80 | ~80 | Behavior rule — stay |
| Branch + PR Workflow | ~300 | ~50 | Hard rules stay; long form → branch-pr-workflow.md |
| Pillar 1 + Pillar 3 deep blocks | ~80 | ~10 | Pointer at parts.md |
| Capability gating | ~25 | ~10 | Pointer at capabilities.md |
| Operational (Docker, E2E sim, port diagnostics) | ~150 | ~20 | Pointer at operations.md / testing-strategy.md |
| Misc tail (security, multi-tab, offline, CI/CD, versioning, etc.) | ~150 | ~150 | Reference but small enough to keep |
| **Total** | **2,328** | **~1,380** | ~40% reduction |

40% reduction without losing any behavior rules. Could go further later if the hook trigger
mechanism proves reliable and additional reference blocks can be confidently extracted.

## Risk if we don't do this

CLAUDE.md keeps growing. Every new shared component or pattern adds ~30-50 lines. At 2,328 today
and the audit naming ~25 missing components, we're effectively a few months from 3,000+. The
context cost compounds — both in latency per turn and in the budget remaining for the actual code
under discussion. The slim is preventive maintenance, not an emergency fix.
