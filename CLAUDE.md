# QB Engineer — Project Rules

> Loaded into every Claude Code session. These rules override defaults. Follow exactly.
> Full specs in `docs/`. When in doubt, check `docs/coding-standards.md` first.

## SELF-MAINTENANCE RULE

**After every session that introduces a new pattern, convention, architectural decision, or workflow change — update this file.** This is the single source of truth for project rules across sessions. If a decision is made during implementation (new shared component, naming convention, SCSS pattern, API convention, etc.), add it here before the session ends. Outdated or missing rules cause rework. Keep this file current.

Also update `docs/coding-standards.md` or the relevant doc file if the change is significant enough to be spec-level.

**Implementation tracking:** Check `docs/implementation-status.md` at the start of every session. When completing a feature or sub-feature, update its status (Not Started → Partial → Done) in that file before ending the session. This is the master progress tracker.

## Auto-Restart API

**When any .NET backend change is made that requires a restart (controller changes, entity changes, Program.cs, appsettings, etc.), automatically rebuild and restart the API container:**

```bash
docker compose up -d --build qb-engineer-api
```

Do not ask the user — just do it after verifying the build passes.

## Visual Verification (Non-Negotiable)

**After any UI fix or visual change, take a Playwright screenshot and examine it before considering the task complete.** This catches issues that code review alone misses (wrong spacing, overlapping elements, broken layouts, missing gaps).

**How to verify:**
1. Run `npx playwright test screenshot-verify` from `qb-engineer-ui/`
2. Examine the screenshot at `e2e/screenshots/{page}.png`
3. If the screenshot shows the fix didn't work (hot-reload missed, wrong CSS, etc.), iterate

**Reusable screenshot script:** `qb-engineer-ui/e2e/tests/screenshot-verify.spec.ts` — set `TARGET_PATH` env var or edit the route inline. Default: `/dashboard`.

Do not ask the user — just verify visually after every UI change.

---

## Branch + PR Workflow (Non-Negotiable)

**Every non-trivial set of changes lands via a feature branch + PR into a per-effort integration branch.** Direct pushes to `main` are blocked server-side by branch protection on all source repos.

**Branch model (corrected 2026-05-03 after the first develop-as-integration pass — Dan wants per-effort branches with descriptive names, not one long-running develop):**

- `main` = released code. Never targeted directly by feature branches. Only updated when an effort wraps and a consolidation PR brings the whole effort in.
- **Effort branches** (e.g. `effort/inline-create`, `effort/quality-and-mrp-pass`) = where one cohesive batch of work accumulates. Created off `main` at the start of an effort. Lives until the effort wraps, then merged to main and deleted.
- `feature/*` (`fix/*`, `chore/*`, `refactor/*`, `docs/*`) = work-in-progress branches, branched FROM the current effort branch, merged TO the current effort branch.
- When the effort is done: Claude opens **ONE** PR (effort branch → main); the user reviews and approves. That's the only review checkpoint.

**Per-feature PRs into the effort branch are auto-merged after CI green.** Claude opens the PR with `gh pr merge --auto --squash`, then GitHub merges automatically once required checks pass. **If CI fails, Claude is responsible for fixing it** — don't leave failing PRs sitting open.

Dependabot is configured to target `develop` (legacy from the first pass — ignore for per-effort work; Dependabot PRs bypass the effort-branch model and target `develop` directly. Sync `develop` from `main` periodically as a parking branch for them).

### When a branch is required

Required for:
- Multi-file changes
- Anything that introduces a new pattern, convention, or shared component
- Schema / DTO / wire-contract changes
- New features
- Refactors that span more than one component
- Migrations
- Workflow / CI / deploy config changes

Skippable only for:
- Single-line typo fixes
- Comment-only changes
- Fixes the user explicitly tags as "tiny" / "quick" / "just push it"

When unclear, ask once at the start: *"Branch this or push direct?"* — and remember the answer for the rest of the conversation.

### Naming

`feat/<short-name>` · `fix/<short-name>` · `chore/<short-name>` · `refactor/<short-name>` · `docs/<short-name>`

Names ≤5 words. Use kebab-case. The PR title carries the full context — the branch name just needs to be searchable.

Examples: `feat/oem-on-vendorpart`, `fix/sourcing-step-mock-shape`, `chore/document-branch-pr-workflow`, `refactor/part-sourcing-resolver`.

### Flow

**Starting an effort:**
- If no effort branch exists for the work the user just asked about, ask once: *"What should we name the effort branch? (e.g. `effort/quality-pass`, `effort/inline-create`)"* — kebab-case, ≤4 words. Then create it: `git fetch origin && git checkout main && git pull --ff-only origin main && git checkout -b effort/<name> && git push -u origin effort/<name>`.
- If an effort branch already exists for ongoing related work, branch new features off it (don't open a parallel effort).

**Per-feature work inside an effort:**
1. **Before starting:** `git fetch origin && git checkout effort/<current> && git pull --ff-only origin effort/<current> && git checkout -b <type>/<short-name>`. Types: `feat`, `fix`, `chore`, `refactor`, `docs`. Names ≤5 words, kebab-case.
2. **Commit on the branch as you work.** Multiple commits are fine — auto-merge will squash.
3. **Validate locally before push.** Same gates CI runs:
    - **UI repo (`qb-engineer-ui`):** `npm run lint && npm run lint:i18n && npm run test -- --watch=false`. The `lint:i18n` script (added 2026-05-03) catches the recurring "{key.path} renders raw because en.json is missing it" bug class — `tsc --noEmit`, `ng build`, and `vitest` all silently allow missing keys (vitest specs use a mocked TranslateLoader). When you add a `'foo.bar' | translate` reference, run this before pushing.

      **i18n files live at `qb-engineer-ui/public/assets/i18n/{en,es}.json`. NEVER edit `src/assets/i18n/` — that path is intentionally non-existent.** Angular CLI's static-asset directory migrated from `src/assets/` to `public/` and the migrated project kept `public/assets/i18n/` as the only bundled source (per `angular.json`). For ~3 sessions before 2026-05-04, edits went to a phantom `src/assets/i18n/` that wasn't in any build — every new key showed up at runtime as a raw `foo.bar` token while `tsc`, `ng build`, `vitest`, AND the early `lint:i18n` all stayed green. The fix: deleted `src/assets/i18n/` and the lint script now hard-fails if it ever reappears. Don't recreate it. If you need to add a translation, the path is `public/assets/i18n/en.json` (and `es.json`). Server-supplied keys (workflow step labelKeys, validator displayNameKey/missingMessageKey) are scanned by `lint:i18n` from `qb-engineer-server/qb-engineer.api/Workflows/*.cs` automatically.
    - **Server repo (`qb-engineer-server`):** `dotnet build -warnaserror && dotnet test`.

    Spec tests live under a separate `tsconfig.spec.json` that prod-build doesn't compile, so `tsc --noEmit` and `ng build` alone are not enough — explicit test runs are mandatory.
4. **Push + open PR + enable auto-merge — no approval gate.**
   ```
   git push -u origin <branch>
   gh pr create --base effort/<current> --title "..." --body "$(cat <<'EOF'...EOF)"
   gh pr merge <pr-number> --auto --squash
   ```
   Brief one-line summary in chat with the PR URL. No approval needed; per-feature review is not how Dan works.
5. **Watch CI.** If checks fail, fix the issue, push, and let auto-merge re-evaluate. Don't leave failing PRs sitting open. If you can't fix it (truly stuck), surface that to the user with the failure context.

**Wrapping the effort:**
6. **When the user signals the effort is done** (or you've finished everything they asked for in this effort), open the consolidation PR yourself: `gh pr create --base main --head effort/<current> --title "..." --body "$(cat <<'EOF'...EOF)"`. Use the PR template below; the body summarizes everything that landed in the effort branch (list each merged feature PR + its impact).
7. **STOP and ask the user to review and approve** the effort → main PR. Don't auto-merge this one. This is the only review checkpoint — make the description thorough enough to support a real review.

### PR template

```
## Summary
- 2-4 bullets: what changed at a high level

## Why
The problem this solves, the user request that triggered it, or the
incident it prevents recurring. One short paragraph.

## Scope
Files / areas touched, anything notable a reviewer would want to know
upfront (e.g. "introduces a new shared component", "renames a public
endpoint", "migrates 14 files").

## Test plan
- [x] Local: <what was verified, with command output if useful>
- [ ] Deploy: <what should be re-verified once the new image lands on
      the server — only include if there's something the live env
      reveals that local can't>

## Migration / operational notes
Only if applicable. New env var, new migration, version-bump action
required, etc. If none, omit this section entirely.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### Hard rules

- **Per-feature PRs into an effort branch**: open + auto-merge without approval. The user's review point is the consolidated effort → main PR, not each piece.
- **Effort → main PRs**: NEVER auto-merge. Open with the consolidated description, STOP, and wait for the user's explicit review and approval.
- **Don't open a parallel effort branch** when the user's request is a continuation of work already on an open effort. Branch new features off the existing effort instead.
- **Don't force-push to a feature branch after auto-merge has run.** Once squashed, the branch's history is in the effort branch; force-pushing the now-deleted feature branch does nothing useful.
- **Don't delete the effort branch yourself after the consolidation PR merges** — let GitHub do that via "delete branch on merge", or the user will.
- **Don't bypass branch protection** even when an error suggests it would help. If a hotfix really must skip the branch flow, surface that to the user and get explicit "yes, push direct" before doing it.

---

## Space Efficiency (Application-Wide Rule)

**Every UI screen must fit and be usable at 1080p (1920×1080) without scrolling off-screen or hiding primary content.** This is a hard constraint, not a nice-to-have.

### Rules

1. **Reactive design first.** Use CSS to make layouts adapt — tighter spacing at shorter viewports via height-based media queries (`@media (max-height: 900px)`), fewer/smaller gaps, denser grids.

2. **Dedicated mobile/narrow UI** only when reactive design isn't practical (e.g. kanban board, shop floor kiosk).

3. **No redundant chrome.** Do not add a border/divider AND a large gap between every section. Pick one visual separator — either a thin border OR whitespace, not both. A single divider after the first content block (hero/title area) is sufficient; section-to-section separation uses gap alone.

4. **Collapsible empty sections.** Sections that have no items (subtasks, linked cards, parts, etc.) must not render their full add-form at all times. Show just the section header + an inline [+] toggle. Expand on demand. Sections with content are always visible.

5. **Spacing scale for dense panels** (detail panels, dialogs, sidebars):
   - Panel body padding: `$sp-lg` (16px) max, `$sp-md` (8px) preferred
   - Section gap: `$sp-md` (8px) between sections
   - Section internal gap: `$sp-sm` (4px)
   - Sidebar section padding: `$sp-md $sp-lg`
   - Hero/title area: `$sp-xs` gap between title and subtitle

6. **Section titles.** Use `$font-size-xxs` uppercase labels (`color: var(--text-muted)`) — not the larger `$font-size-xs` variant. Section titles are navigational aids, not headings.

7. **Test at 1080p.** After any layout change, screenshot at the default kanban job detail panel size (or relevant view) and verify the primary content is visible without scrolling.

---

## Project Structure

```
qb-engineer-wrapper/
├── qb-engineer-ui/          # Angular 21 + Material 21
│   └── src/
│       ├── styles/           # _variables, _mixins, _shared, _reset
│       ├── styles.scss       # Material theme + overrides
│       └── app/
│           ├── shared/       # Reusable components, services, directives, pipes, utils
│           ├── features/     # Feature modules (kanban, backlog, admin, etc.)
│           └── core/         # Singleton services (layout, nav, toolbar, sidebar)
├── qb-engineer-server/       # .NET 9 solution
│   ├── qb-engineer.api/      # Controllers, Features/ (MediatR handlers), Middleware
│   ├── qb-engineer.core/     # Entities, Interfaces, Models, Enums
│   ├── qb-engineer.data/     # DbContext, Repositories, Migrations, Configuration
│   └── qb-engineer.integrations/
├── docs/                     # Specs: coding-standards, architecture, functional-decisions, ui-components, roles-auth, libraries
└── docker-compose.yml        # 5 core + 3 optional profiles (ai, tts, signing)
```

---

## Critical Rules

### ONE OBJECT PER FILE (Non-Negotiable)
- **Angular:** One component, service, pipe, directive, guard, interceptor, or model per file. No barrel files (`index.ts`).
- **.NET:** One class, interface, enum, or record per file. Exception: related request/response pair if < 20 lines total.
- **Never mash multiple classes, enums, services, or components into a single file.**

### Naming Conventions

**Angular (TypeScript):**

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case + type suffix | `job-card.component.ts`, `job.service.ts`, `job.model.ts` |
| Classes | PascalCase + type suffix | `JobCardComponent`, `JobService` |
| Variables/properties | camelCase | `jobList`, `isLoading` |
| Observables | camelCase + `$` suffix | `jobs$`, `notifications$` |
| Signals | camelCase, no suffix | `jobs`, `isLoading` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Enums | PascalCase name + members | `JobStatus.InProduction` |
| Interfaces | PascalCase, no `I` prefix | `Job`, `Notification` |
| CSS classes | BEM | `job-card__header--active` |
| Control flow | `@if`/`@for` | Never `*ngIf`/`*ngFor` |

**.NET (C#):**

| Item | Convention | Example |
|------|-----------|---------|
| Files | PascalCase | `JobService.cs` |
| Classes/methods/properties | PascalCase | `JobService.GetActiveJobs()` |
| Private fields | _camelCase | `_jobRepository` |
| Parameters/locals | camelCase | `jobId`, `isActive` |
| Interfaces | `I` prefix | `IJobService` |
| Constants | PascalCase | `MaxRetryCount` |
| Namespaces | `QbEngineer.{Project}.{Folder}` | `QbEngineer.Api.Controllers` |
| Models | `*ResponseModel` / `*RequestModel` | **Never "DTO"** |

**Person Names:** When displaying a person's full name, always use `Last, First MI` format (e.g., "Hartman, Daniel J"). This applies everywhere: headers, dropdowns, tables, avatars, reports, PDFs.

**Date Display:** Dates shown to users use `MM/dd/yyyy` (e.g., "03/11/2026"). When time is included, use `MM/dd/yyyy hh:mm` (e.g., "03/11/2026 02:30"). This applies to tables, detail panels, reports, PDFs — all user-facing date rendering.

**Database:** snake_case for tables/columns (auto-converted by EF Core)
**Docker:** services named `qb-engineer-*`

### Import Ordering

**TypeScript:** (1) Angular core → (2) Angular Material → (3) Third-party (rxjs, three, etc.) → (4) App shared → (5) Feature-relative. Blank line between groups.

**C#:** (1) System → (2) Microsoft → (3) Third-party (FluentValidation, MediatR, etc.) → (4) QbEngineer

### Tech Stack
- **Frontend:** Angular 21, Angular Material 21, SCSS, standalone components, zoneless (signals)
- **Backend:** .NET 9, MediatR (CQRS), FluentValidation, EF Core + Npgsql
- **Database:** PostgreSQL with `timestamptz` columns (all DateTimes must be UTC)
- **Storage:** MinIO (S3-compatible), **Auth:** ASP.NET Identity + JWT + tiered kiosk auth (RFID/NFC/barcode + PIN) + optional SSO (Google/Microsoft/OIDC) + TOTP MFA
- **Real-time:** SignalR, **Background:** Hangfire, **Mapping:** Mapperly (source-generated), **Logging:** Serilog
- **Date lib:** date-fns (tree-shakeable, official Material adapter)
- **Charts:** ng2-charts (Chart.js), **Dashboard grid:** gridstack, **Tours:** driver.js
- **PDF:** QuestPDF (server), **Barcodes:** bwip-js, **QR:** angularx-qrcode
- **Testing:** Vitest (Angular), xUnit + Bogus (.NET), Cypress (E2E)

---

## Angular Patterns

### Component Rules
- `standalone: true`, `ChangeDetectionStrategy.OnPush` on every component
- Signal-based state: `signal()`, `computed()`, `input()`, `output()`
- `inject()` for DI — never constructor injection
- No inline templates — always `.component.html` + `.component.scss`
- No inline `style="..."` — all styling via CSS classes
- No function calls in template bindings — use `computed()` signals
- Decorator order: `selector`, `standalone`, `imports`, `templateUrl`, `styleUrl`, `changeDetection`
- Max template `@if` block: ~20 lines before extracting to child component
- Smart components (features): inject services, manage state via signals
- Dumb components (shared): `input()`/`output()` only, no service injection

### Form Controls — ALWAYS Use Shared Wrappers
Never raw `<input>`, `<select>`, or `<textarea>` in feature templates.

| Component | Selector | Key Inputs |
|-----------|----------|------------|
| `InputComponent` | `<app-input>` | `label`, `type`, `placeholder`, `prefix`, `suffix`, `maxlength`, `isReadonly`, `mask`, `required` |
| `SelectComponent` | `<app-select>` | `label`, `options: SelectOption[]`, `multiple`, `placeholder`, `required` |
| `TextareaComponent` | `<app-textarea>` | `label`, `rows`, `maxlength` |
| `DatepickerComponent` | `<app-datepicker>` | `label` |
| `ToggleComponent` | `<app-toggle>` | `label` |
| `CurrencyInputComponent` | `<app-currency-input>` | `label`, `placeholder`, `currencySymbol` (default `$`), `min`, `max`, `step`, `required`. Use for any monetary amount. Avoids the recurring `<app-input prefix="$">` floating-label overlap (`$lanual cost override`) by laying the symbol out via Material's `matTextPrefix` slot. Emits `number \| null`. |

All implement `ControlValueAccessor`. Use with `ReactiveFormsModule` (`FormGroup`/`FormControl`) — never `ngModel` / `FormsModule`.

**Required field indicator:** When a field has `Validators.required`, pass `[required]="true"` to the shared wrapper. This adds the HTML `required` attribute which Angular Material uses to append `*` to the label automatically. Always pair `Validators.required` in the FormControl with `[required]="true"` on the template wrapper.

**Input masks:** `InputComponent` supports `mask="phone"` (formats `(XXX) XXX-XXXX`), `mask="zip"` (formats `XXXXX` or `XXXXX-XXXX`), and `mask="ssn"` (formats `XXX-XX-XXXX`). Pair masks with corresponding `Validators.pattern()` on the FormControl.

```typescript
// SelectOption (from select.component.ts)
interface SelectOption { value: unknown; label: string; }

// Null option pattern for optional selects:
{ value: null, label: '-- None --' }
```

### Save Action — Required on Every Editable Surface (Non-Negotiable)

Every screen, panel, dialog, or cluster that has an edit mode MUST surface an explicit, visible Save action. Auto-save-on-blur is permitted as a safety net (catches the field that's still focused) but is NEVER the only path — the user must always have a clear button to commit work and exit edit mode.

- **Visible at all times in edit mode**, not just on dirty state. A disabled Save button (with the `<app-validation-button>` stereotype surfacing why) still tells the user "this is where you save."
- **Pair with Cancel.** Cancel reverts in-progress edits (reload from server is fine if change-tracking isn't local) and exits edit mode.
- **Placement**: lower-right of the surface, equal-width, primary furthest right — matches `cluster__actions` in part-clusters and the `<app-dialog>` footer convention.
- **The wrapping panel emits a `cancelled` event**; the parent (which owns the `editing()` signal) flips it back to false. Save typically also emits `cancelled` after committing — the user is "done editing" either way.
- Auto-save-on-blur, when used, is documented in code comments as a backup behavior, not the primary one. The Save button is what the user looks for and what we test for.
- This rule applies regardless of how the panel saves underneath (per-field PATCH, single PUT, batched mutations) — the user-facing affordance is uniform.

Surfaces this applies to today: every `part-*-cluster` (identity, inventory, cost, quality, uom, material, mrp, pricing-add), `customer-identity-cluster`, `vendor-sources-panel`, every dialog with a form. New editable surfaces inherit the rule by default.

### Form Validation — No Inline Errors, Click-to-Reveal Stereotype
Validation uses a dedicated warning-icon button paired with the disabled submit button — NOT `mat-error` beneath fields, NOT hover popover on the submit button. `mat-form-field` subscript wrapper is globally `display: none`.

**The `<app-validation-button>` stereotype** wraps the submit button. When the form has violations AND is not loading, it renders a compact red warning-triangle icon + count badge to the LEFT of the shrunken submit button. Clicking the icon opens a CDK overlay popover listing violations. Popover auto-positions (right of icon → below → above) with push to stay on-screen. Click-outside / Escape closes with 150ms debounce. Popover auto-closes 1.2s after all violations clear so the user sees the all-clear.

```typescript
// Component class:
readonly violations = FormValidationService.getViolations(this.form, {
  fieldName: 'Human Label',
});
```

```html
<!-- Standard submit button wrap (dialog footer, page action bar, login form, etc.): -->
<app-validation-button [violations]="violations" [loading]="saving()">
  <button class="action-btn action-btn--primary"
    [disabled]="form.invalid || saving()"
    (click)="save()">Save</button>
</app-validation-button>
```

- `[violations]` — the `Signal<string[]>` from `FormValidationService.getViolations()` (pass the signal itself, not the value)
- `[loading]` — boolean coerced; hides the icon during save so users don't see a warning during a pending request
- Icon button auto-hides when there are 0 violations — submit button expands back to full width
- Submit button stays `[disabled]="form.invalid || saving()"` — the stereotype only surfaces WHY it's disabled
- Invalid fields get subtle visual indicator (field highlighting, not text)
- `FormValidationService` + `ValidationButtonComponent` (in `shared/components/validation-button/`)
- Async validators: button shows spinner icon while pending
- Server-side 400 errors: mapped to toast (form was already client-valid)

**When to use which:**
- `<app-validation-button>` — the default; use on every disabled submit button (dialogs, pages, login, forms). Visible, click-to-reveal, doesn't cover the fields being validated.
- `[appValidationPopover]` directive (legacy, still exported) — only for buttons where a wrapping element can't work (rare); hover-triggered. Do not use on new code.

### Dialog Pattern — ALWAYS Use `<app-dialog>`
Never build custom dialog shells. Every dialog uses the shared component.

```html
<app-dialog [title]="'Create Job'" width="520px" (closed)="close()">
  <div [formGroup]="form">
    <app-input label="Title" formControlName="title" />
    <div class="dialog-row">
      <app-select label="Customer" formControlName="customerId" [options]="customerOptions" />
      <app-datepicker label="Due Date" formControlName="dueDate" />
    </div>
  </div>

  <div dialog-footer>
    <button class="action-btn" (click)="close()">Cancel</button>
    <button class="action-btn action-btn--primary"
      [appValidationPopover]="violations"
      [disabled]="form.invalid || saving()"
      (click)="save()">Save</button>
  </div>
</app-dialog>
```

- `width` input: small (420px default), medium (520px), large (800px)
- `.dialog__body` auto-applies flex column + gap to projected form containers
- `.dialog-row` = 2-column grid for side-by-side fields (1-column on mobile)
- Footer buttons: equal width, horizontal, cancel left, primary right

### Date Handling
- Angular sends dates via `toIsoDate()` from `shared/utils/date.utils.ts`
- Format: `"YYYY-MM-DDT00:00:00Z"` — full ISO with explicit UTC (never date-only strings)
- .NET `AppDbContext.NormalizeDateTimes()` converts `DateTimeKind.Unspecified` → UTC before save
- Postgres `timestamptz` always requires UTC

### Page Filter Pattern
Filters use standalone `FormControl` (not inside a `FormGroup`):

```typescript
readonly searchControl = new FormControl('');
readonly filterSignal = toSignal(this.searchControl.valueChanges, { initialValue: '' });
```

```html
<app-input label="Search" [formControl]="searchControl" />
<app-select label="Status" [formControl]="statusControl" [options]="statusOptions" />
```

### URL as Source of Truth (Non-Negotiable)
**All significant UI state must be reflected in the URL.** The user must be able to copy-paste a URL and land on the exact same view. This includes:
- **Active tab** → route segment (e.g., `/admin/integrations`, `/inventory/receiving`)
- **Multi-step wizard / stepper step** → query param (e.g., `/onboarding?step=2`)
- **Selected entity / detail dialog** → `?detail=type:id` query param via `DetailDialogService` (e.g., `/kanban?detail=job:1055`, `/parts?detail=part:42`)
- **Active filters** → query params (e.g., `/backlog?status=open&priority=high`)
- **Pagination** → query params (e.g., `/parts?page=2&pageSize=50`)

This ensures:
- Direct links and bookmarks work
- Browser back/forward navigates correctly
- External redirects (OAuth callbacks, email links, shared links) target the right view
- Refresh preserves state

**Never store navigational state in signals/services alone.** Signals derive from the URL, not the other way around.

**Tab pattern:** Use a `:tab` route parameter with a redirect from the bare path:
```typescript
// feature.routes.ts
export const FEATURE_ROUTES: Routes = [
  { path: '', redirectTo: 'first-tab', pathMatch: 'full' },
  { path: ':tab', component: FeatureComponent },
];

// feature.component.ts
private readonly route = inject(ActivatedRoute);
protected readonly activeTab = toSignal(
  this.route.paramMap.pipe(map(p => p.get('tab') ?? 'first-tab')),
  { initialValue: 'first-tab' },
);

protected switchTab(tab: string): void {
  this.router.navigate(['..', tab], { relativeTo: this.route });
}
```

Tab clicks call `switchTab()` which navigates; the `activeTab` signal reacts to the route change. Data loading per tab uses `effect()` on `activeTab`.

**Multi-step wizard / stepper pattern:** Use a `?step=N` query param:
```typescript
// Read step from URL (never from a plain signal):
private readonly route = inject(ActivatedRoute);
protected readonly currentStepIndex = toSignal(
  this.route.queryParamMap.pipe(map(p => {
    const n = parseInt(p.get('step') ?? '0', 10);
    return isNaN(n) || n < 0 || n > MAX_STEP ? 0 : n;
  })),
  { initialValue: 0 },
);

// Write step to URL (never mutate a signal directly):
protected nextStep(): void {
  const next = Math.min((this.currentStepIndex() ?? 0) + 1, MAX_STEP);
  this.router.navigate([], { relativeTo: this.route, queryParams: { step: next }, queryParamsHandling: 'merge' });
}
protected prevStep(): void {
  const prev = Math.max((this.currentStepIndex() ?? 0) - 1, 0);
  this.router.navigate([], { relativeTo: this.route, queryParams: { step: prev }, queryParamsHandling: 'merge' });
}
```

`mat-stepper` binds via `[selectedIndex]="currentStepIndex()"`. Back/forward browser navigation moves through steps naturally.

### Service Conventions
- `providedIn: 'root'` (tree-shakeable singletons)
- All HTTP calls in services, never in components
- Return signals or `toSignal()` — components never call `.subscribe()` directly
- Error handling at service level — expose `error` signal
- One service per domain concern, max ~200 lines

### Error Handling (Angular)
- HTTP errors caught in services via `catchError` — services expose `error` signal
- Global `HttpErrorInterceptor`: 401 → redirect login, 403 → access denied snackbar, 500 → error toast with copy button
- No `try/catch` wrapping individual HTTP calls in components
- Form validation errors via popover (not inline `mat-error`)

### Client-Side Storage
- **IndexedDB** (wrapper service): lookup data caches (customers, parts, track types, etc.) with `last_synced` timestamp
- **localStorage**: JWT tokens, user preferences (theme, locale, sidebar state). Minimal — no large objects.
- **In-memory signals**: transient UI state (filters, scroll positions, form drafts). Lost on tab close.
- Stale cache is usable — show cached data immediately, refresh in background

### Lazy Loading & Bundles
- Every feature module lazy-loaded via `loadComponent` in route config
- Heavy libraries loaded on demand: Three.js (dynamic import), driver.js (first tour), ng2-charts (reporting)
- No feature code in main bundle — `shared/` and `core/` only
- Bundle budget: warning 500KB, error 1MB (initial)

### Folder Structure
```
shared/components/   ← reusable: dialog, input, select, datepicker, toggle, textarea, avatar, etc.
shared/services/     ← auth, theme, form-validation, toast, snackbar, cache
shared/directives/   ← validation-popover
shared/utils/        ← date.utils.ts
shared/guards/       ← auth.guard, setup.guard
shared/interceptors/ ← auth.interceptor
shared/models/       ← shared interfaces, enums
shared/pipes/        ← terminology, date-format
shared/validators/   ← shared form validators
features/{name}/     ← component + routes + models/ + services/ + components/
```

Promotion rule: used by 2+ features → move to `shared/`.

---

## SCSS Design System

### NEVER hardcode values. Always use variables/mixins.

**Spacing:** `$sp-xxs: 1px` | `$sp-xs: 2px` | `$sp-sm: 4px` | `$sp-md: 8px` | `$sp-lg: 16px` | `$sp-xl: 24px` | `$sp-2xl: 32px` | `$sp-3xl: 48px` | `$sp-4xl: 80px`

**Typography:** `$font-size-xxs: 9px` | `$font-size-xs: 10px` | `$font-size-sm: 11px` | `$font-size-base: 12px` | `$font-size-title: 13px` | `$font-size-md: 14px` | `$font-size-lg: 16px` | `$font-size-xl: 18px` | `$font-size-kpi: 20px` | `$font-size-heading: 32px`

**Fonts:** `$font-family-primary: 'Space Grotesk'` | `$font-family-mono: 'IBM Plex Mono'`

**Borders:** `$border-width: 2px` | `$border-width-thin: 1px` | `$border-width-accent: 3px` (status/indicator left/top borders) | `$border-radius: 0px` (sharp corners everywhere)

**Z-index:** `$z-sticky: 100` | `$z-sidebar: 200` | `$z-dropdown: 300` | `$z-dialog: 400` | `$z-snackbar: 500` | `$z-loading: 900` | `$z-toast: 1000`

**Breakpoints:** `$breakpoint-mobile: 768px` | `$breakpoint-tablet: 1024px` | `$breakpoint-desktop: 1200px` | `$breakpoint-wide: 1400px`

**Transitions:** `$transition-fast: 150ms ease` | `$transition-normal: 250ms ease` | `$transition-sidebar: 200ms ease`

**Icon Sizes:** `$icon-size-xs: 14px` | `$icon-size-sm: 16px` | `$icon-size-md: 18px` | `$icon-size-lg: 20px` | `$icon-size-xl: 24px` | `$icon-size-xxl: 32px` | `$icon-size-hero: 48px`

**Icon Standards (Material Icons Outlined):**
| Action | Icon | Notes |
|--------|------|-------|
| Save/Create | `save` | All save, create, submit buttons |
| Add/New | `add` | All "New X" / "Add X" buttons (never `person_add`, `add_business`, `add_circle_outline`) |
| Edit | `edit` | All edit operations; `edit_note` for manual time entry only |
| Delete | `delete` | All deletions (never `delete_outline`); `delete_sweep` for "clear all" |
| Close | `close` | Dialogs, panels, dismissals |
| Search | `search` | Search inputs |
| Download | `download` | Export/download; `cloud_download` for sync conflict only |
| Loading spinner | `sync` | In-progress operations (with spin animation) |
| Refresh | `refresh` | User-triggered refresh actions |
| Page loading | `hourglass_empty` | Initial page load placeholders |
| Expand/collapse | `expand_more` / `expand_less` | Vertical toggle sections |
| Navigation | `chevron_right` / `chevron_left` | Sidebar, directional nav |

**Component Sizing:** `$btn-icon-size: 24px` | `$avatar-size-xs: 18px` | `$avatar-size-sm: 20px` | `$avatar-size-md: 28px` | `$avatar-size-lg: 36px` | `$dot-size-sm: 8px` | `$dot-size-md: 12px` | `$progress-bar-height: 4px` | `$sidebar-nav-height: 36px` | `$sidebar-icon-size: 20px` | `$badge-size-sm: 14px` | `$badge-size-md: 16px` | `$input-height: 2rem` | `$chart-height: 300px`

**Sizing:** `$sidebar-width-collapsed: 52px` | `$sidebar-width-expanded: 200px` | `$header-height: 44px` | `$detail-panel-width: 400px` | `$notification-panel-width: 380px`

**Shadows:** `$shadow-panel: -4px 0 12px rgba(0,0,0,0.1)` | `$shadow-dropdown: 0 4px 16px rgba(0,0,0,0.15)` | `$backdrop-color: rgba(0,0,0,0.3)`

### CSS Custom Properties (Theme Colors)
```
--primary, --primary-light, --primary-dark, --header
--accent, --accent-light
--success, --success-light, --info, --info-light
--warning, --warning-light, --error, --error-light
--bg, --surface, --border
--text, --text-secondary, --text-muted
```
Dark theme auto-swaps via `[data-theme='dark']` on `<html>`.

### SCSS Rules
- BEM naming: `block__element--modifier`
- Max 3 levels nesting — flatten with BEM instead of deep nesting
- No `!important` unless overriding third-party (with comment)
- Component SCSS should be thin — most styling from variables, mixins, Material
- Before writing new styles, check `_variables.scss` and `_mixins.scss` first

### Key Mixins (from `_mixins.scss`)
- `@include uppercase-label($size, $spacing, $weight)` — all-caps small labels
- `@include flex-center` / `@include flex-between` — common flex patterns
- `@include custom-scrollbar($width)` — themed scrollbar
- `@include mobile` / `@include tablet` / `@include desktop` — responsive breakpoints
- `@include truncate` — text ellipsis

### Shared Classes (from `_shared.scss`)
- `.page-header` — 48px height, `$sp-sm $sp-lg` padding, form fields zero margin
- `.action-btn` — outlined neutral (2rem height). Modifiers below.
- `.icon-btn` / `.icon-btn--danger` / `.icon-btn--active` — 24x24 icon buttons
- `.dialog-backdrop`, `.dialog`, `.dialog__header`, `.dialog__body`, `.dialog__footer`
- `.dialog-row` — 2-column grid for side-by-side dialog fields (1-column on mobile)
- `.dialog__body > *` — auto flex column + gap to projected form containers
- `.dialog__footer .action-btn` — equal-width buttons
- `.tab-bar`, `.tab`, `.tab--active`, `.tab-panel`, `.panel-header`
- `.chip` / `.chip--primary|success|warning|error|info|muted` — color-mix backgrounds
  - DB-driven colors: `[style.--chip-color]="color"`, fills column width in `<td>`
  - Dark theme: 15% opacity bg (vs 10% light)
- `.page-loading` — centered loading state
- `.snackbar--success|info|warn|error` — colored snackbar variants

### Button Taxonomy (Non-Negotiable)

Six stereotypes. Choose by **intent**, never aesthetic. Each page MUST have at most one filled (primary-weight) button visible at a time — that button is the page's key action.

| Class | Look | Use for | Typical icon |
|-------|------|---------|--------------|
| `.action-btn` | Outlined neutral | Secondary actions, Cancel | any |
| `.action-btn--primary` | Filled teal | **Save / Submit / Continue / Confirm / Approve** (commit work) | `save`, `check`, `send`, `arrow_forward` |
| `.action-btn--create` | Filled green | **New / Add / Create** (initiate entity creation) | `add`, `post_add`, `person_add`, `add_circle*` |
| `.action-btn--destructive` | Filled red | **Delete / Archive / Block** (primary destructive in confirm dialog) | `delete`, `archive`, `block` |
| `.action-btn--danger` | Outlined red | Low-risk destructive cue (row-level delete's text twin) | `delete`, `remove_circle` |
| `.action-btn--warn` | Outlined amber | Cautionary, non-destructive (Hold, Flag) | `flag`, `pause` |
| `.action-btn--link` | Text-only teal | Quiet action embedded in content ("Forgot password?") | none or tiny |
| `.action-btn--sm` | Compact size | Size modifier — combines with any of the above | any |

**Placement rules:**
- **Page toolbar / page-header**: the "New X" button is `--create`. Lives on the right side of the page header.
- **Empty-state CTA**: the "Add first X" button is `--create`.
- **Dialog footer**: Save is `--primary`, Cancel is plain `.action-btn`. Both sit lower-right, equal-width, primary furthest right.
- **ConfirmDialog** (`severity: 'danger'`): the confirm button auto-maps to `--destructive`. Cancel is plain.
- **Never** mix `--create` and `--primary` on the same page header. A page-header is for starting new work; form rows are for committing it.

**Never** use `--primary` on buttons whose intent is entity creation, and never use `--create` on Save/Submit buttons. The color is a signal about what will happen, not a style preference.

### Material Theme Overrides (styles.scss)
- All shapes: 0px (sharp corners)
- Form field height: compact (40px container, 8px vertical padding)
- Density: -1
- Subscript wrapper: `display: none` globally (validation via popover, not `mat-error`)
- Error colors: mapped to `var(--error)`
- Text size: 12px, subscript: 10px

---

## .NET Patterns

### Architecture
- MediatR CQRS: Commands + Queries in `Features/` folder, one handler per file
- FluentValidation: validators alongside handlers (can share file if small)
- Repository pattern: interfaces in `Core/Interfaces/`, implementations in `Data/Repositories/`
- Global exception middleware: `KeyNotFoundException` → 404, `ValidationException` → 400, business exceptions → 409
- Controllers are thin — delegate to MediatR handlers, one controller per aggregate root
- All endpoints `[Authorize]` by default; exceptions: login, register, refresh, health, display
- No `try/catch` in controllers — middleware handles everything
- Problem Details (RFC 7807) for all error responses
- Logging via Serilog: structured, contextual (request ID, user ID, entity ID)

### C# Class Structure
- Interfaces for all services (`IJobService`, `IStorageService`)
- Abstract base classes for shared behavior:
  - `BaseEntity` — `Id`, `CreatedAt`, `UpdatedAt`, `DeletedAt`, `DeletedBy`
  - `BaseAuditableEntity` — extends BaseEntity with `CreatedBy`
- Records for models/value objects — immutable by default
- Composition over deep inheritance — max 2 levels
- Integration pattern: interface + real impl + mock impl (e.g., `IAiService` / `OllamaAiService` / `MockAiService`)
- Entity config: one `IEntityTypeConfiguration<T>` per entity, Fluent API only (no data annotations)

### Database (PostgreSQL + EF Core)
- `AppDbContext` auto-applies:
  - Snake_case naming for all tables/columns/keys/indexes
  - `SetTimestamps()` — auto-sets `CreatedAt`/`UpdatedAt` on `BaseEntity`
  - `NormalizeDateTimes()` — converts `DateTimeKind.Unspecified` to UTC before save
  - Global query filter: `DeletedAt == null` on all `BaseEntity` types
- Soft deletes only — no hard deletes (`DeletedAt` timestamp + `DeletedBy` FK)
- Fluent API in separate `IEntityTypeConfiguration<T>` classes (no data annotations)
- Foreign key indexes explicit on all FK columns
- `reference_data` table: centralized lookup/dropdown values with `group_id` grouping and immutable `code` field
- Primary keys: `id` (int, auto-increment). Foreign keys: `{table_singular}_id`

### API Conventions
- RESTful: `/api/v1/jobs`, `/api/v1/jobs/{id}`, `/api/v1/jobs/{id}/subtasks`
- Plural nouns for collections; no verbs except RPC-like (`/archive`)
- POST → 201 + Location header; DELETE/PUT no-body → 204
- `IOptions<T>` for config — never raw `IConfiguration` in services
- `MOCK_INTEGRATIONS=true` env var bypasses all external API calls with mock responses

### JSON Serialization
- `JsonStringEnumConverter` — enums serialize as strings
- CamelCase property naming (ASP.NET Core default)

### Pagination
- **Offset-based** for standard lists: `?page=1&pageSize=25&sort=createdAt&order=desc` → response: `{ data, page, pageSize, totalCount, totalPages }`
- **Cursor-based** for real-time feeds (chat, activity, notifications): `?cursor=eyJ...&limit=50`
- Default page size: 25, max: 100
- Client: small datasets (< 100) client-side filter; medium (100-1000) `mat-paginator`; large/unbounded virtual scroll
- `PaginatedDataSource<T>` shared class wraps API pagination

---

## UI Layout Rules

### Button Placement
- Action buttons in **lower-right** of page/dialog
- Primary action **furthest right**
- Secondary (Cancel) to the left
- Destructive actions separated on far left
- Order: `[Destructive]` — gap — `[Secondary]` `[Primary]`
- Dialog footer: equal-width buttons, horizontal, same row

### Page Structure
- Header (sticky top): title, breadcrumbs, optional filter bar
- Content area (scrollable): all content scrolls here
- Action bar (sticky bottom): action buttons right-aligned
- Page chrome (header, sidebar, action bar) **never scrolls**
- No horizontal scrolling except kanban board and wide data tables (sticky first column)

### Aesthetic
- Dense, compact, professional engineering tool feel
- Sharp corners: `$border-radius: 0px` everywhere (Material chips retain rounded)
- Small fonts: 12px base, 11px tables, 9-10px labels
- Minimal padding — tight but readable
- `Space Grotesk` for UI, `IBM Plex Mono` for code/data
- Content max-width: 1400px centered (except kanban + shop floor = full width)
- No full-bleed layouts on ultra-wide monitors

### Notifications: Snackbar vs Toast
- **Snackbar** (bottom-center): brief confirmations — "Job saved", "Part created. [View Part]". Single at a time. Auto-dismiss 4s (errors never).
- **Toast** (upper-right): detailed errors with copy button, stack traces, sync conflicts. Stackable (max 5). Auto-dismiss: info 8s, warning 12s, error never.
- `SnackbarService`: `.success(msg)`, `.error(msg)`, `.info(msg)`, `.successWithNav(msg, route)`
- `ToastService`: `.show({ severity, title, message, details?, autoDismissMs? })`
- Creation navigation: snackbar includes "View Job" action button when creating entities

### Loading States — ALWAYS Evaluate
**When writing any code that involves data fetching, route transitions, or long-running operations, you MUST evaluate whether to use the loading system.** Do not skip this step.

#### Global Overlay (`LoadingService` + `LoadingOverlayComponent`)
Full-screen blocking overlay with SVG spinner + stacked message queue. Applies `inert` on main content. Use for operations where the user cannot meaningfully interact with any part of the page.

**When to use:**
- **Route transitions** — automatic via `RouteLoadingService` (initialized in `AppComponent.ngOnInit()`)
- **Auth flows** — login, setup, logout (entire app state changing)
- **Initial page loads with aggregate data** — dashboard (multi-widget), kanban board (full board), backlog (forkJoin of jobs + track types + users)
- **Bulk operations** — bulk move, bulk assign, bulk archive (page reorg on completion)
- **Long-running generation** — PDF export, report generation, data sync
- **Full-page saves** — operations that navigate away or fundamentally change page state on completion

**API:**
```typescript
private readonly loading = inject(LoadingService);

// Track an Observable — auto start/stop
this.loading.track('Loading board...', this.kanbanService.getBoard(id)).subscribe(...)

// Track a Promise
await this.loading.trackPromise('Generating report...', this.reportService.generate());

// Manual control (for complex flows)
this.loading.start('save-job', 'Saving job...');
this.loading.stop('save-job');
```

#### Component-Level Block (`LoadingBlockDirective`)
Local spinner overlay on a specific element. Keeps rest of page interactive. Use for section-scoped loading.

**When to use:**
- **List/table loads** — filtered data refresh (parts, expenses, leads, assets, etc.)
- **Tab-scoped loads** — switching tabs within a page (admin tabs, inventory tabs)
- **Detail panel loads** — side panel or detail section content
- **Per-widget/per-section** — dashboard widget content, chart data, individual card content

**API:** `[appLoadingBlock]="loading()"` on the container element

#### Empty States
All list views must show `<app-empty-state>` when data is empty — icon + message + optional CTA.

#### Decision Matrix

| Scenario | Use | Reason |
|----------|-----|--------|
| Route navigation | Global (automatic) | `RouteLoadingService` handles it |
| Login / Setup submit | Global | Entire app state changing |
| Dashboard initial load | Global | Multi-widget aggregate, nothing useful to show partially |
| Kanban board load / switch track | Global | Full board reorganization |
| Backlog forkJoin load | Global | Multi-resource, page unusable until complete |
| Bulk move/assign/archive | Global | Page reorgs on completion |
| PDF/report generation | Global | Long-running, user must wait |
| List page data refresh | Component-level | Table area only, filters/header remain interactive |
| Tab switch within page | Component-level | Only the tab panel content changes |
| Detail panel / side panel | Component-level | Main list remains visible and interactive |
| Form dialog save | Button disabled (`saving()` signal) | Dialog stays open, button shows disabled state |
| Quick inline action | Snackbar on completion | Too fast for spinner, feedback via toast |

---

## Shared Components (Built)

| Component | Path | Purpose |
|-----------|------|---------|
| `InputComponent` | `shared/components/input/` | Material text input wrapper (CVA) |
| `SelectComponent` | `shared/components/select/` | Material select wrapper (CVA) |
| `TextareaComponent` | `shared/components/textarea/` | Material textarea wrapper (CVA) |
| `DatepickerComponent` | `shared/components/datepicker/` | Material datepicker wrapper (CVA) |
| `ToggleComponent` | `shared/components/toggle/` | Material slide-toggle wrapper (CVA) |
| `CurrencyInputComponent` | `shared/components/currency-input/` | Currency-amount wrapper (CVA) — uses Material `matTextPrefix` slot to avoid the recurring `<app-input prefix="$">` floating-label overlap |
| `DialogComponent` | `shared/components/dialog/` | Shared dialog shell (content projection) |
| `PageHeaderComponent` | `shared/components/page-header/` | Standard page header bar |
| `AvatarComponent` | `shared/components/avatar/` | User avatar with initials fallback |
| `KpiChipComponent` | `shared/components/kpi-chip/` | Compact metric display |
| `StatusBadgeComponent` | `shared/components/status-badge/` | Colored status indicator |
| `DashboardWidgetComponent` | `shared/components/dashboard-widget/` | Dashboard widget shell |
| `ToastComponent` | `shared/components/toast/` | Stackable upper-right toasts |
| `EmptyStateComponent` | `shared/components/empty-state/` | Icon + message + optional CTA for empty lists |
| `DataTableComponent` | `shared/components/data-table/` | Configurable data table (see below) |
| `ColumnFilterPopoverComponent` | `shared/components/data-table/column-filter-popover/` | Per-column filter overlay (text/number/date/enum) |
| `ColumnManagerPanelComponent` | `shared/components/data-table/column-manager-panel/` | Column visibility, reorder, reset overlay |
| `ColumnCellDirective` | `shared/directives/column-cell.directive.ts` | Tags `ng-template` by field for custom cell rendering |
| `RowExpandDirective` | `shared/directives/row-expand.directive.ts` | Tags `ng-template` for expandable row content |
| `ConfirmDialogComponent` | `shared/components/confirm-dialog/` | MatDialog-based confirmation for destructive actions |
| `DetailSidePanelComponent` | `shared/components/detail-side-panel/` | Slide-out right panel (400px, Escape/backdrop close) |
| `PageLayoutComponent` | `shared/components/page-layout/` | Standard page shell (toolbar + content + actions) |
| `EntityPickerComponent` | `shared/components/entity-picker/` | Typeahead entity search via API (CVA) |
| `EntityLinkComponent` | `shared/components/entity-link/` | Inline clickable cross-entity reference link |
| `FileUploadZoneComponent` | `shared/components/file-upload-zone/` | Drag-and-drop file upload with progress |
| `AutocompleteComponent` | `shared/components/autocomplete/` | mat-autocomplete form field wrapper (CVA) |
| `ToolbarComponent` | `shared/components/toolbar/` | Horizontal flex filter/action bar |
| `SpacerDirective` | `shared/directives/spacer.directive.ts` | Pushes toolbar items right (`flex: 1`) |
| `DateRangePickerComponent` | `shared/components/date-range-picker/` | Two-date picker with presets (CVA) |
| `ActivityTimelineComponent` | `shared/components/activity-timeline/` | Chronological activity feed (compact + full) |
| `ListPanelComponent` | `shared/components/list-panel/` | Scrollable list with built-in empty state |
| `KanbanColumnHeaderComponent` | `shared/components/kanban-column-header/` | Column header with WIP limits + collapse |
| `QuickActionPanelComponent` | `shared/components/quick-action-panel/` | Touch-first shop floor actions (88x88px) |
| `MiniCalendarWidgetComponent` | `shared/components/mini-calendar-widget/` | Dashboard calendar with highlight dates |
| `ValidationButtonComponent` | `shared/components/validation-button/` | **Default**: wraps disabled submit button, adds click-to-reveal warn icon + count + CDK overlay |
| `ValidationPopoverDirective` | `shared/directives/` | Legacy hover popover (do not use on new code) |
| `CapDirective` / `CapNotDirective` | `shared/directives/cap.directive.ts`, `cap-not.directive.ts` | `*appCap="'CAP-X'"` / `*appCapNot="'CAP-X'"` structural directives — mount template only when capability is enabled / disabled. Reactive to `CapabilityService` snapshot changes. |
| `FormValidationService` | `shared/services/` | Derives violation messages from FormGroup |
| `DetailDialogService` | `shared/services/` | Centralized detail dialog opener with `?detail=type:id` URL sync |
| `UserPreferencesService` | `shared/services/` | Per-user preference storage (localStorage, API-ready) |
| `SnackbarService` | `shared/services/` | Bottom-center snackbar convenience methods |
| `ToastService` | `shared/services/` | Upper-right toast management |
| `AuthService` | `shared/services/` | Login, logout, token management |
| `ThemeService` | `shared/services/` | Light/dark theme switching |
| `LoadingOverlayComponent` | `shared/components/loading-overlay/` | Full-screen blocking overlay (consumes LoadingService) |
| `LoadingService` | `shared/services/` | Global loading overlay with cause queue |
| `RouteLoadingService` | `shared/services/` | Auto-shows global overlay during route transitions |
| `NotificationService` | `shared/services/` | Notification state, filtering, panel, API sync |
| `TerminologyService` | `shared/services/` | Admin-configurable label resolution |
| `TerminologyPipe` | `shared/pipes/` | `{{ 'key' \| terminology }}` label transform |
| `LoadingBlockDirective` | `shared/directives/` | `[appLoadingBlock]="isLoading"` local spinner overlay |
| `httpErrorInterceptor` | `shared/interceptors/` | Global HTTP error → snackbar/toast routing |
| `SignalrService` | `shared/services/` | Singleton connection manager for all hubs |
| `BoardHubService` | `shared/services/` | Board hub: join/leave groups, event callbacks |
| `NotificationHubService` | `shared/services/` | Notification hub: pushes to NotificationService |
| `TimerHubService` | `shared/services/` | Timer hub: start/stop event callbacks |
| `ConnectionBannerComponent` | `shared/components/connection-banner/` | Reconnecting/disconnected warning banner |
| `ScannerService` | `shared/services/` | Global barcode/NFC keyboard-wedge scan detection |
| `BarcodeScanInputComponent` | `shared/components/barcode-scan-input/` | Focused scan input field (kiosk use) |
| `QrCodeComponent` | `shared/components/qr-code/` | QR code display (angularx-qrcode wrapper) |
| `LabelPrintService` | `shared/services/` | Barcode/QR generation + label printing (bwip-js) |
| `LightboxGalleryComponent` | `shared/components/lightbox-gallery/` | Fullscreen image viewer with thumbnails, keyboard/touch nav |
| `CameraCaptureComponent` | `shared/components/camera-capture/` | Device camera capture for receipts/documents |
| `OfflineBannerComponent` | `shared/components/offline-banner/` | Bottom-center offline/syncing/synced status banner |
| `SyncConflictDialogComponent` | `shared/components/sync-conflict-dialog/` | 409 conflict resolution (Keep Mine/Keep Server/Cancel) |
| `StatusTimelineComponent` | `shared/components/status-timeline/` | Active status + holds + history timeline |
| `SetStatusDialogComponent` | `shared/components/set-status-dialog/` | Dialog for setting workflow status with notes |
| `AddHoldDialogComponent` | `shared/components/add-hold-dialog/` | Dialog for adding holds with type + notes |
| `StatusTrackingService` | `shared/services/` | Status lifecycle CRUD (workflow + holds) |
| `DynamicQbFormComponent` | `shared/components/dynamic-form/` | Root `<dynamic-qb-form>` — iterates model array, renders controls |
| `DynamicQbFormControlComponent` | `shared/components/dynamic-form/` | Container that dynamically instantiates control component via `ViewContainerRef` |
| `qbFormControlMapFn` | `shared/components/dynamic-form/qb-form-control-map.ts` | Routes `DynamicFormControlModel` → QB wrapper component (input, select, date, textarea, toggle, checkbox, radio, group, heading, paragraph, signature) |
| `complianceDefinitionToModels` | `shared/components/dynamic-form/compliance-form-adapter.ts` | Converts `ComplianceFormDefinition` JSON → `DynamicFormModel` array (supports `pages` or flat `sections`) |
| `sectionsToModels` | `shared/components/dynamic-form/compliance-form-adapter.ts` | Converts a subset of `FormSection[]` to models (used per-page/tab) |
| `normalizeFormPages` | `shared/models/compliance-form-definition.model.ts` | Normalizes `ComplianceFormDefinition` — always returns `FormPage[]` (wraps flat `sections` in single page) |
| `DynamicQbInputComponent` | `shared/components/dynamic-form/controls/` | Wraps `<app-input>` for `DynamicInputModel` (masks, types) |
| `DynamicQbSelectComponent` | `shared/components/dynamic-form/controls/` | Wraps `<app-select>` for `DynamicSelectModel` |
| `DynamicQbDatepickerComponent` | `shared/components/dynamic-form/controls/` | Wraps `<app-datepicker>` for `DynamicDatePickerModel` |
| `DynamicQbTextareaComponent` | `shared/components/dynamic-form/controls/` | Wraps `<app-textarea>` for `DynamicTextAreaModel` |
| `DynamicQbToggleComponent` | `shared/components/dynamic-form/controls/` | Wraps `<app-toggle>` for `DynamicSwitchModel` |
| `DynamicQbCheckboxComponent` | `shared/components/dynamic-form/controls/` | Checkbox for `DynamicCheckboxModel` |
| `DynamicQbRadioGroupComponent` | `shared/components/dynamic-form/controls/` | Radio group for `DynamicRadioGroupModel` |
| `DynamicQbFormGroupComponent` | `shared/components/dynamic-form/controls/` | Nested fieldset for `DynamicFormGroupModel` |
| `DynamicQbSignatureComponent` | `shared/components/dynamic-form/controls/` | Typed signature with cursive preview |
| `DynamicQbHeadingComponent` | `shared/components/dynamic-form/controls/` | Display-only `<h4>` heading in dynamic forms |
| `DynamicQbParagraphComponent` | `shared/components/dynamic-form/controls/` | Display-only `<p>` paragraph in dynamic forms |
| `AddressFormComponent` | `shared/components/address-form/` | Reusable address form (CVA) with configurable required fields, state dropdown, address verification |
| `AddressService` | `shared/services/` | Address validation via `/api/v1/addresses/validate` |
| `toIsoDate()` | `shared/utils/date.utils.ts` | Date → `YYYY-MM-DDT00:00:00Z` |
| `toAddress()` / `fromAddressToProfile()` / `fromAddressToVendor()` | `shared/utils/address.utils.ts` | Map flat address fields ↔ Address object |
| `phoneValidator` | `shared/validators/phone.validator.ts` | `Validators.pattern` for `(XXX) XXX-XXXX` format |
| `CREDIT_TERMS_OPTIONS` / `PAYMENT_TERMS_OPTIONS` | `shared/models/credit-terms.const.ts` | Centralized credit/payment terms for selects |
| `PRIORITIES` / `PRIORITY_OPTIONS` / `PRIORITY_FILTER_OPTIONS` | `shared/models/priority.const.ts` | Centralized priority values, select options, and filter options |
| `DirtyFormIndicatorComponent` | `shared/components/dirty-form-indicator/` | Orange dot + "Unsaved changes" chip for dirty forms |
| `DraftRecoveryBannerComponent` | `shared/components/draft-recovery-banner/` | Per-form "Recovered from [timestamp]. [Discard]" banner |
| `DraftRecoveryPromptComponent` | `shared/components/draft-recovery-prompt/` | Post-login / TTL expiry dialog listing all drafts |
| `LogoutDraftsDialogComponent` | `shared/components/logout-drafts-dialog/` | Logout confirmation with draft list |
| `DraftService` | `shared/services/` | Draft orchestrator: register/unregister, auto-save, TTL, cross-tab sync |
| `DraftStorageService` | `shared/services/` | IndexedDB CRUD for drafts (`qb-engineer-drafts` DB) |
| `DraftBroadcastService` | `shared/services/` | Cross-tab BroadcastChannel for draft sync |
| `DraftRecoveryService` | `shared/services/` | Post-login recovery, TTL cleanup, logout warning |
| `unsavedChangesGuard` | `shared/guards/` | `CanDeactivateFn` — warns on navigation away from dirty forms |

### AppDataTableComponent — Usage Guide

Reusable data table replacing all hand-rolled `<table>` markup. Features: client-side sorting (click header, Shift+click for multi-sort), per-column filtering (text/number/date/enum), pagination (25/50/100), column visibility/reorder/resize via gear icon, preference persistence via `tableId`, right-click context menu on column headers (sort asc/desc, clear sort, filter, clear filter, clear all filters, hide column, reset width).

**Converted features:** Admin, Assets, Leads, Expenses, Time Tracking, Parts, Backlog, Inventory (8/8).

**Backend:** `UserPreferencesController` (GET/PATCH/DELETE), `UserPreference` entity, MediatR handlers built. Frontend uses `UserPreferencesService` with localStorage cache + debounced API PATCH.

```html
<!-- Basic usage -->
<app-data-table
  tableId="parts-list"
  [columns]="partColumns"
  [data]="parts()"
  [selectable]="true"
  emptyIcon="inventory_2"
  emptyMessage="No parts found"
  [rowClass]="partRowClass"
  [rowStyle]="partRowStyle"
  (rowClick)="selectPart($event)"
  (selectionChange)="onSelectionChange($event)">

  <!-- Custom cell templates (plain text columns render automatically) -->
  <ng-template appColumnCell="status" let-row>
    <span class="chip" [class]="getStatusClass(row.status)">{{ row.status }}</span>
  </ng-template>
  <ng-template appColumnCell="assignee" let-row>
    <app-avatar [initials]="row.initials" [color]="row.color" size="sm" />
  </ng-template>
</app-data-table>
```

```typescript
// Column definition
protected readonly partColumns: ColumnDef[] = [
  { field: 'partNumber', header: 'Part #', sortable: true, width: '120px' },
  { field: 'description', header: 'Description', sortable: true },
  { field: 'status', header: 'Status', sortable: true, filterable: true, type: 'enum',
    filterOptions: [
      { value: 'Active', label: 'Active' },
      { value: 'Draft', label: 'Draft' },
    ]},
  { field: 'dueDate', header: 'Due Date', sortable: true, type: 'date', width: '100px' },
];

// Dynamic row class (selected, overdue, active timer, etc.)
protected readonly partRowClass = (row: unknown) => {
  const part = row as PartListItem;
  return part.id === this.selectedPart()?.id ? 'row--selected' : '';
};

// Dynamic row inline styles (e.g., --row-tint for color-mix tinted backgrounds)
protected readonly partRowStyle = (row: unknown): Record<string, string> => {
  const part = row as PartListItem;
  return part.color ? { '--row-tint': part.color } : {};
};
```

**ColumnDef interface:** `field`, `header`, `sortable?`, `filterable?`, `type?` ('text'|'number'|'date'|'enum'), `filterOptions?` (SelectOption[]), `width?`, `visible?`, `align?` ('left'|'center'|'right')

**Additional inputs:** `loading` (boolean, shows `LoadingBlockDirective` overlay on scroll area), `stickyFirstColumn` (boolean, keeps first data column visible during horizontal scroll), `expandable` (boolean, adds expand/collapse chevron column), `clickableRows` (boolean, adds pointer cursor + hover highlight on rows that have a `(rowClick)` handler)

```html
<!-- Expandable rows (e.g., Inventory bin details) -->
<app-data-table
  tableId="inventory"
  [columns]="columns"
  [data]="locations()"
  [expandable]="true"
  [loading]="isLoading()"
  [stickyFirstColumn]="true">

  <ng-template appRowExpand let-location>
    <div class="bin-details">
      @for (bin of location.bins; track bin.id) {
        <div class="bin-row">{{ bin.name }}: {{ bin.quantity }}</div>
      }
    </div>
  </ng-template>
</app-data-table>
```

**Key models:** `ColumnDef` in `shared/models/column-def.model.ts`, `TablePreferences`/`SortState` in `shared/models/table-preferences.model.ts`

**Expandable rows:** Set `[expandable]="true"` and provide `<ng-template appRowExpand let-row>` for expand content. Import `RowExpandDirective` from `shared/directives/row-expand.directive.ts`. Rows toggle expand on chevron click. Example (Inventory stock → bin detail):

```html
<app-data-table tableId="inventory-stock" [columns]="stockColumns" [data]="parts()" [expandable]="true" trackByField="partId">
  <ng-template appRowExpand let-row>
    <table class="bin-detail-table">
      @for (bin of $any(row).binLocations; track bin.locationId) {
        <tr><td>{{ bin.locationPath }}</td><td>{{ bin.quantity }}</td></tr>
      }
    </table>
  </ng-template>
</app-data-table>
```

**All 8 features now converted** to DataTable (Admin, Assets, Leads, Expenses, Time Tracking, Parts, Backlog, Inventory).

### ConfirmDialogComponent — Usage Guide

Opens via `MatDialog`. Returns `true` (confirmed) or `false` (cancelled). Severity colors the confirm button.

```typescript
import { ConfirmDialogComponent, ConfirmDialogData } from 'shared/components/confirm-dialog/confirm-dialog.component';

// In component:
private readonly dialog = inject(MatDialog);

archiveJob(job: Job): void {
  this.dialog.open(ConfirmDialogComponent, {
    width: '400px',
    data: {
      title: 'Archive Job?',
      message: 'This will remove the job from the board. You can restore it later.',
      confirmLabel: 'Archive',
      severity: 'warn',
    } satisfies ConfirmDialogData,
  }).afterClosed().subscribe(confirmed => {
    if (confirmed) this.jobService.archive(job.id);
  });
}
```

**Data inputs:** `title` (string), `message` (string), `confirmLabel?` (default "Confirm"), `cancelLabel?` (default "Cancel"), `severity?` ('info'|'warn'|'danger', default 'info')

### DetailSidePanelComponent — Usage Guide

Slide-out right panel (400px, full-width on mobile). Backdrop click + Escape closes. Content projection for body + `[panel-actions]` slot for sticky footer buttons.

```html
<app-detail-side-panel [open]="!!selectedPart()" [title]="selectedPart()?.partNumber ?? ''" (closed)="closePart()">
  <!-- Body content (scrollable) -->
  <div class="info-grid">
    <div class="info-item">
      <span class="info-label">Status</span>
      <span class="info-value">{{ selectedPart()?.status }}</span>
    </div>
  </div>

  <!-- Sticky footer actions -->
  <div panel-actions>
    <button class="action-btn" (click)="editPart()">Edit</button>
    <button class="action-btn action-btn--primary" (click)="savePart()">Save</button>
  </div>
</app-detail-side-panel>
```

### DetailDialogService — Usage Guide

Centralized dialog opener that syncs `?detail=entityType:entityId` to the URL. Replaces the old `openDetailDialog()` utility function. All 16 entity detail dialog sites use this service.

```typescript
// Open a detail dialog — URL updates automatically
private readonly detailDialog = inject(DetailDialogService);

openPartDetail(partId: number): void {
  this.detailDialog.open<PartDetailDialogComponent, PartDetailDialogData, PartDetailDialogResult | undefined>(
    'part', partId, PartDetailDialogComponent, { partId },
  ).afterClosed().subscribe(result => {
    if (result?.action === 'edit') { this.editPart(result.part); }
    this.loadParts();
  });
}

// Auto-open from URL on page load (in ngOnInit, after data loads)
const detail = this.detailDialog.getDetailFromUrl();
if (detail?.entityType === 'part') {
  this.openPartDetail(detail.entityId);
}
```

**Entity type strings** (used in URLs): `job`, `part`, `asset`, `lead`, `invoice`, `quote`, `vendor`, `sales-order`, `purchase-order`, `shipment`, `payment`, `customer-return`, `lot`, `training`

**URL format:** `?detail=job:1055` — set on open, cleared on close (`replaceUrl: true`). Shareable, bookmarkable, survives refresh.

### PageLayoutComponent — Usage Guide

Standard page shell enforcing layout rules (Standard #36). Replaces ad-hoc `<app-page-header>` + manual content structure.

```html
<app-page-layout pageTitle="Parts Catalog">
  <ng-container toolbar>
    <app-input label="Search" [formControl]="searchControl" />
    <app-select label="Status" [formControl]="statusControl" [options]="statusOptions" />
    <span appSpacer></span>
    <button class="action-btn action-btn--primary" (click)="createPart()">
      <span class="material-icons-outlined">add</span> New Part
    </button>
  </ng-container>

  <ng-container content>
    <app-data-table tableId="parts" [columns]="columns" [data]="parts()" />
  </ng-container>

  <ng-container actions>
    <button class="action-btn" (click)="cancel()">Cancel</button>
    <button class="action-btn action-btn--primary" (click)="save()">Save</button>
  </ng-container>
</app-page-layout>
```

Slots: `toolbar` (header bar, optional), `content` (scrollable body), `actions` (sticky footer, optional — hidden when empty)

### EntityLinkComponent — Usage Guide

Inline clickable link for cross-entity references. Navigates to the target entity's detail dialog via `?detail=type:id` URL. Customers navigate to full-page detail at `/customers/:id/overview`.

```html
<app-entity-link type="vendor" [entityId]="po.vendorId">{{ po.vendorName }}</app-entity-link>
<app-entity-link type="purchase-order" [entityId]="rfq.generatedPurchaseOrderId">PO #{{ rfq.generatedPurchaseOrderId }}</app-entity-link>
<app-entity-link type="customer" [entityId]="inv.customerId">{{ inv.customerName }}</app-entity-link>
```

**Inputs:** `type` (LinkableEntityType, required), `entityId` (number, required). Content projected as the display text.

**Supported types:** `job`, `part`, `vendor`, `purchase-order`, `sales-order`, `invoice`, `payment`, `shipment`, `quote`, `lead`, `asset`, `lot`, `rfq`, `customer-return`, `training`, `customer`

**Applied to:** RFQ detail (part, PO), Invoice detail (customer, SO, shipment), Shipment detail (SO, invoice), Sales Order detail (customer, quote), Quote detail (customer, SO), PO detail (vendor, job), Job detail (customer, part, parent job, sub-jobs, linked jobs, parts), Asset detail (source job/part), Payment detail (customer)

### EntityPickerComponent — Usage Guide

Typeahead search against API endpoints. CVA for reactive forms. Debounced 300ms search, min 2 chars.

```html
<app-entity-picker
  label="Customer"
  entityType="customers"
  displayField="name"
  [filters]="{ active: 'true' }"
  formControlName="customerId" />
```

Searches `GET /api/v1/{entityType}?search={term}&pageSize=10` + extra filters. Returns entity `id` as the form value. Expects API response shape: `{ data: [...] }`.

### FileUploadZoneComponent — Usage Guide

Drag-and-drop + click-to-browse. Per-file progress bars, type/size validation, error display.

```html
<app-file-upload-zone
  entityType="jobs"
  [entityId]="jobId"
  accept=".pdf,.step,.stl"
  [maxSizeMb]="50"
  (uploaded)="onFileUploaded($event)" />
```

Uploads to `POST /api/v1/{entityType}/{entityId}/files` as multipart. Emits `UploadedFile` on success: `{ id, fileName, contentType, size, url }`.

### AutocompleteComponent — Usage Guide

Form field wrapper for `mat-autocomplete` with local option filtering. CVA. For API-backed search, use `EntityPickerComponent` instead.

```html
<app-autocomplete
  label="Material"
  [options]="materialOptions"
  displayField="label"
  valueField="value"
  [minChars]="1"
  formControlName="material" />
```

Options: array of objects. `displayField` shown in dropdown, `valueField` used as form value. Clears value when user types (forces re-selection).

### ToolbarComponent + SpacerDirective — Usage Guide

Horizontal flex container for filter bars and action buttons. Use `appSpacer` directive to push items to the right.

```html
<app-toolbar>
  <app-input label="Search" [formControl]="searchControl" />
  <app-select label="Status" [formControl]="statusControl" [options]="statuses" />
  <span appSpacer></span>
  <button class="action-btn action-btn--primary" (click)="create()">New Job</button>
</app-toolbar>
```

Auto-removes margins from form field wrappers. Responsive wrap on mobile.

### DateRangePickerComponent — Usage Guide

Two-date picker (From/To) with optional preset buttons. CVA. Value: `{ start: Date | null, end: Date | null }`.

```html
<app-date-range-picker
  label="Date Range"
  [presets]="['Today', 'This Week', 'This Month', 'Last 30 Days']"
  formControlName="dateRange" />
```

Built-in presets: 'Today', 'This Week', 'This Month', 'Last 30 Days'. Start/end dates constrain each other (start <= end).

### ActivityTimelineComponent — Usage Guide

Chronological activity feed with avatars. Two modes: full (default) and compact (sidebar).

```html
<!-- Full mode -->
<app-activity-timeline [activities]="activityLog()" />

<!-- Compact mode (sidebar) -->
<app-activity-timeline [activities]="activityLog()" [compact]="true" />
```

**ActivityItem model** (`shared/models/activity.model.ts`): `id`, `description`, `createdAt` (ISO string), `userInitials?`, `userColor?`, `action?`

### ListPanelComponent — Usage Guide

Scrollable list container with built-in empty state. Content projects list items.

```html
<app-list-panel [empty]="subtasks().length === 0" emptyIcon="checklist" emptyMessage="No subtasks">
  @for (task of subtasks(); track task.id) {
    <div class="subtask-item">{{ task.text }}</div>
  }
</app-list-panel>
```

### KanbanColumnHeaderComponent — Usage Guide

Board column header with WIP limit enforcement, collapse toggle, and irreversible lock indicator.

```html
<app-kanban-column-header
  [name]="stage.name"
  [count]="cards.length"
  [wipLimit]="stage.wipLimit"
  [color]="stage.color"
  [isIrreversible]="stage.isIrreversible"
  [collapsed]="isCollapsed"
  (collapseToggled)="toggleCollapse()" />
```

Background turns red (`--error-light`) when count exceeds WIP limit.

### QuickActionPanelComponent — Usage Guide

Touch-first grid of large action buttons (88x88px minimum) for shop floor displays.

```html
<app-quick-action-panel
  [actions]="shopFloorActions"
  [columns]="3"
  (actionClick)="onAction($event)" />
```

```typescript
protected readonly shopFloorActions: QuickAction[] = [
  { id: 'clock-in', label: 'Clock In', icon: 'login', color: 'var(--success)' },
  { id: 'clock-out', label: 'Clock Out', icon: 'logout', color: 'var(--error)' },
  { id: 'start-task', label: 'Start Task', icon: 'play_arrow', color: 'var(--primary)' },
];
```

**QuickAction interface:** `id`, `label`, `icon`, `color?`, `disabled?`

### MiniCalendarWidgetComponent — Usage Guide

Dashboard calendar widget using `mat-calendar`. Highlights dates with events.

```html
<app-mini-calendar-widget
  [highlightDates]="dueDates()"
  (dateSelected)="onDateSelected($event)" />
```

### ScannerService — Usage Guide

Global singleton that detects USB barcode scanner / NFC reader input (keyboard wedge mode). Listens for rapid keystroke patterns on `document` and emits `ScanEvent` signals. Context-aware: each feature page sets its context so scans route to the right handler.

**Architecture:**
- Starts globally in `AppComponent.ngOnInit()` (after auth)
- Stops on logout
- Skips focused `<input>`/`<textarea>` unless keystroke timing matches scanner speed (< 50ms between keys)
- Skips elements inside `app-barcode-scan-input` (which handles its own scanning)
- Auto-completes scan after 80ms pause (fallback if scanner doesn't send Enter)

```typescript
// Feature component — set context + react to scans
private readonly scanner = inject(ScannerService);

constructor() {
  this.scanner.setContext('parts'); // Set scan context for this page

  effect(() => {
    const scan = this.scanner.lastScan();
    if (!scan || scan.context !== 'parts') return;
    this.scanner.clearLastScan();
    // Handle the scan — e.g., search for the scanned part number
    this.searchControl.setValue(scan.value);
    this.loadParts();
  });
}
```

**Signals:** `lastScan` (ScanEvent | null), `enabled` (boolean), `listening` (boolean), `context` (ScanContext), `hasRecentScan` (boolean — within 5s)
**Methods:** `start()`, `stop()`, `setContext(ctx)`, `enable()`, `disable()`, `clearLastScan()`
**ScanContext:** `'global' | 'parts' | 'inventory' | 'shop-floor' | 'kanban' | 'receiving' | 'shipping' | 'quality'`
**ScanEvent:** `{ value: string, timestamp: Date, context: ScanContext }`

**Integrated features:**
- **Parts** — scanned value → search filter, triggers part lookup
- **Inventory** — scanned value → search filter, switches to stock tab
- **Kanban** — scanned job number → selects job on board, opens detail panel
- **Quality** — scanned value → fills active tab's search (inspections or lots)
- **Shop Floor Clock** — uses `BarcodeScanInputComponent` directly (focused input, not global scanner)

### LoadingService — Usage Guide

Global loading overlay that blocks all interaction. Signal-based cause queue supports multiple concurrent loading sources. Integrates with `LoadingBlockDirective` for component-level loading.

```typescript
private readonly loading = inject(LoadingService);

// Track an Observable — auto starts/clears loading state
loadJobs(): void {
  this.loading.track('Loading jobs...', this.jobService.getJobs())
    .subscribe(jobs => this.jobs.set(jobs));
}

// Track a Promise
async exportReport(): Promise<void> {
  const pdf = await this.loading.trackPromise('Generating report...', this.reportService.generate());
}

// Manual control
this.loading.start('save-job', 'Saving job...');
// ... later
this.loading.stop('save-job');
```

**Signals:** `isLoading` (boolean), `message` (latest cause message), `causes` (full queue)
**Methods:** `track(message, observable)`, `trackPromise(message, promise)`, `start(key, message)`, `stop(key)`, `clear()`

### LoadingBlockDirective — Usage Guide

Component-level loading overlay. Adds a spinner overlay to the host element when the bound boolean is `true`. Uses `position: relative` on host + absolute overlay with fade transition.

```html
<!-- On a section -->
<div class="card" [appLoadingBlock]="isLoadingDetails()">
  <h3>Job Details</h3>
  <p>{{ job().description }}</p>
</div>

<!-- On a table wrapper -->
<div [appLoadingBlock]="isLoadingTable()">
  <app-data-table [columns]="columns" [data]="data()" />
</div>
```

### HttpErrorInterceptor — Usage Guide

Functional interceptor registered in app config. Handles all HTTP error responses globally — no `try/catch` needed in components.

```typescript
// app.config.ts
provideHttpClient(
  withInterceptors([authInterceptor, httpErrorInterceptor])
)
```

**Error routing:**
- `401` → Defers to auth interceptor (silent refresh)
- `403` → Snackbar: "Access denied"
- `409` → Toast warning with server message (conflict)
- `0` (network) → Toast: "Connection lost"
- `500+` → Toast error with title + details (copy button)

Parses Problem Details (RFC 7807) `title` and `detail` fields. No per-call error handling needed unless feature-specific behavior is required.

### TerminologyService + TerminologyPipe — Usage Guide

Admin-configurable label resolution. Loads terminology map from API on app init. Pipe resolves keys to labels in templates.

```typescript
// Service — load on app init (after auth)
private readonly terminology = inject(TerminologyService);
this.terminology.load();

// Service — resolve programmatically
const label = this.terminology.resolve('entity_job'); // → "Job" (or admin-configured label)

// Service — admin live preview
this.terminology.set('entity_job', 'Work Order');
```

```html
<!-- Pipe usage in templates -->
<span>{{ 'entity_job' | terminology }}</span>        <!-- "Job" -->
<span>{{ 'status_in_production' | terminology }}</span> <!-- "In Production" -->
```

**Fallback:** When key has no configured label, strips known prefixes (`entity_`, `status_`, `action_`, `field_`, `label_`) and title-cases the remainder.

**API:** `GET /api/v1/terminology` → `{ data: Record<string, string> }`

### NotificationService — Usage Guide

Unified notification state management. Signal-based with optimistic UI updates. Integrates with SignalR for real-time push.

```typescript
private readonly notifications = inject(NotificationService);

// Load on app init (after auth)
this.notifications.load();

// Push from SignalR
this.hubConnection.on('notification', (n: AppNotification) => {
  this.notifications.push(n);
});

// Read state
readonly unreadCount = this.notifications.unreadCount;
readonly filtered = this.notifications.filteredNotifications;
readonly isOpen = this.notifications.panelOpen;

// Actions
this.notifications.togglePanel();
this.notifications.setTab('alerts');
this.notifications.markAsRead(notificationId);
this.notifications.markAllRead();
this.notifications.dismiss(notificationId);
this.notifications.dismissAll();
this.notifications.togglePin(notificationId);
this.notifications.setFilter({ severity: 'critical', unreadOnly: true });
```

**Filtering:** Tab filter (`all` | `messages` | `alerts`), plus optional `source`, `severity`, `type`, `unreadOnly`. Pinned notifications always sort first, then by `createdAt` descending.

**Model:** `AppNotification` in `shared/models/notification.model.ts` — `id`, `type`, `severity`, `source`, `title`, `message`, `isRead`, `isPinned`, `isDismissed`, `entityType?`, `entityId?`, `senderInitials?`, `senderColor?`, `createdAt`

### SignalR Services — Usage Guide

**SignalrService** is the singleton connection manager. Hub-specific services (`BoardHubService`, `NotificationHubService`, `TimerHubService`) wrap it for domain-specific logic.

```typescript
// SignalrService — never used directly in features, only by hub services
// Manages HubConnection lifecycle, exposes aggregate connectionState signal
readonly connectionState: Signal<ConnectionState>; // 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
getOrCreateConnection(hubPath: string): HubConnection;
startConnection(hubPath: string): Promise<void>;
stopConnection(hubPath: string): Promise<void>;
stopAll(): void;
```

**BoardHubService** — used in kanban and any board-related feature:

```typescript
private readonly boardHub = inject(BoardHubService);

// Connect + join a board group
await this.boardHub.connect();
await this.boardHub.joinBoard(trackTypeId);

// Register event callbacks
this.boardHub.onJobCreatedEvent((event) => this.reloadBoard());
this.boardHub.onJobMovedEvent((event) => this.reloadBoard());
this.boardHub.onJobUpdatedEvent((event) => this.reloadBoard());
this.boardHub.onJobPositionChangedEvent((event) => this.reloadBoard());
this.boardHub.onSubtaskChangedEvent((event) => this.reloadSubtasks());

// Switch boards / cleanup
await this.boardHub.leaveBoard();
await this.boardHub.joinBoard(newTrackTypeId);
await this.boardHub.disconnect(); // in ngOnDestroy
```

**NotificationHubService** — connected once in `AppComponent.ngOnInit()`:

```typescript
// Automatically pushes received notifications to NotificationService
await this.notificationHub.connect();
// No manual event registration needed — handled internally
```

**TimerHubService** — used in time tracking:

```typescript
private readonly timerHub = inject(TimerHubService);

await this.timerHub.connect();
this.timerHub.onTimerStartedEvent(() => this.loadEntries());
this.timerHub.onTimerStoppedEvent(() => this.loadEntries());
// ngOnDestroy: this.timerHub.disconnect();
```

**ConnectionBannerComponent** — added to `app.component.html`, no configuration needed:

```html
<app-connection-banner />
```

Shows yellow bar for `reconnecting`, red bar for `disconnected`. Auto-hides when `connected`.

**Backend hub endpoints:** `/hubs/board`, `/hubs/notifications`, `/hubs/timer`. All `[Authorize]`. JWT passed via `?access_token=` query string (WebSocket can't use headers).

**Backend broadcasting pattern** — inject `IHubContext<T>` into MediatR handlers:

```csharp
// In handler primary constructor:
IHubContext<BoardHub> boardHub

// After SaveChangesAsync:
await boardHub.Clients.Group($"board:{trackTypeId}")
    .SendAsync("jobCreated", new BoardJobCreatedEvent(...), cancellationToken);
```

### Form Draft / Unsaved Changes System

Auto-saves dirty form state to IndexedDB. Recovers drafts on login. Warns before navigation/logout. Cross-tab sync via BroadcastChannel.

**Core services:**
- `DraftStorageService` — IndexedDB wrapper (`qb-engineer-drafts` DB, separate from cache)
- `DraftService` — orchestrator: `register(form)` / `unregister()`, debounced auto-save (2.5s), TTL management
- `DraftBroadcastService` — cross-tab sync via `qb-engineer-draft-sync` BroadcastChannel
- `DraftRecoveryService` — post-login draft check, TTL cleanup with 5-min grace period, logout warning

**UI components:**
- `DirtyFormIndicatorComponent` — orange dot + "Unsaved changes" chip
- `DraftRecoveryBannerComponent` — "Recovered unsaved changes from [timestamp]. [Discard]"
- `DraftRecoveryPromptComponent` — MatDialog listing all drafts (recovery + TTL expiry modes)
- `LogoutDraftsDialogComponent` — MatDialog listing drafts on manual logout

**Guard:** `unsavedChangesGuard` — `CanDeactivateFn` for route navigation. `beforeunload` managed by `DraftService.register()`.

**Dialog dirty guard:** `DialogComponent` has `[dirty]` input — when dirty, backdrop/close asks for confirmation via `ConfirmDialogComponent`.

**How forms opt in:**
```typescript
// 1. Implement DraftableForm interface
export class MyFormComponent implements DraftableForm, OnInit, OnDestroy {
  private readonly draftService = inject(DraftService);
  
  get entityType(): string { return 'my-entity'; }
  get entityId(): string { return this.entity()?.id?.toString() ?? 'new'; }
  get displayLabel(): string { return 'My Entity - Edit'; }
  get route(): string { return '/my-entity'; }
  get form(): FormGroup { return this.myForm; }
  isDirty(): boolean { return this.myForm.dirty; }
  getFormSnapshot(): Record<string, unknown> { return this.myForm.getRawValue(); }
  restoreDraft(data: Record<string, unknown>): void {
    this.myForm.patchValue(data);
    this.myForm.markAsDirty();
  }

  // 2. In ngOnInit: load draft, register
  ngOnInit(): void {
    this.draftService.loadDraft(this.entityType, this.entityId).then(draft => {
      if (draft) {
        this.restoreDraft(draft.formData);
        this.restoredDraftTimestamp.set(draft.lastModified);
      }
    });
    this.draftService.register(this);
  }

  // 3. In ngOnDestroy: unregister
  ngOnDestroy(): void {
    this.draftService.unregister(this.entityType, this.entityId);
  }

  // 4. On save: clear draft
  onSave(): void {
    this.draftService.clearDraftAndBroadcastSave(this.entityType, this.entityId);
  }
}
```

```html
<!-- 5. Template: add dirty indicator, recovery banner, pass [dirty] to dialog -->
<app-dialog [title]="'Edit'" [dirty]="myForm.dirty" (closed)="cancel()">
  <app-dirty-form-indicator [dirty]="myForm.dirty" />
  <app-draft-recovery-banner
    [visible]="restoredDraftTimestamp() !== null"
    [timestamp]="restoredDraftTimestamp() ?? 0"
    (discarded)="restoredDraftTimestamp.set(null); draftService.clearDraft(entityType, entityId)" />
  ...
</app-dialog>
```

**Draft lifecycle:**
- Drafts persist through logout (manual or forced), browser crash, token expiry
- Cleared ONLY by: explicit discard, successful save, or TTL expiration (with prompt)
- TTL is user-configurable in Account > Customization (1 day / 3 days / 1 week / 2 weeks)
- Post-login: recovery prompt shown immediately; TTL cleanup runs after 5-min grace period
- Restoring one draft resets TTL on all user drafts

**Key:** `{userId}:{entityType}:{entityId|'new'}`

**Cross-tab behavior:**
- Draft updates propagate to other tabs editing the same record
- Save in Tab A clears draft in Tab B + shows snackbar
- Last-write-wins for IndexedDB (no tab locking)

### Pending Enhancements

_(No pending enhancements — all planned DataTable and UserPreferences work is complete)_

---

## Features (Implemented)

| Feature | UI Component | API Controller | Key Entities |
|---------|-------------|---------------|--------------|
| Kanban Board | `kanban/` | `JobsController` | Job, JobStage, TrackType |
| Dashboard | `dashboard/` | `DashboardController` | (aggregates) |
| Calendar | `calendar/` | — | — |
| Backlog | `backlog/` | `JobsController` | Job |
| Parts | `parts/` | `PartsController` | Part, BOMEntry |
| Inventory | `inventory/` | `InventoryController` | StorageLocation, BinContent, BinMovement |
| Customers | `customers/` | `CustomersController` | Customer, Contact | List page + dedicated `/customers/:id/:tab` detail (9 tabs: Overview, Contacts, Addresses, Estimates, Quotes, Orders, Jobs, Invoices, Activity). Stats bar with live aggregates. |
| Estimates | — (via customer detail Estimates tab) | `EstimatesController` | Quote (Type=Estimate) | Non-binding ballpark figures. Single amount (not line-itemized). Stored in `quotes` table with `type='Estimate'`. Convert to Quote via POST /{id}/convert (creates new Quote-type row with `source_estimate_id` FK). |
| Leads | `leads/` | `LeadsController` | Lead |
| Expenses | `expenses/` | `ExpensesController` | Expense |
| Assets | `assets/` | `AssetsController` | Asset |
| Time Tracking | `time-tracking/` | `TimeTrackingController` | TimeEntry, ClockEvent |
| Admin | `admin/` | `AdminController` | ApplicationUser, ReferenceData |
| Company Profile | `admin/settings` | `AdminController` | SystemSetting (company.*) |
| Company Locations | `admin/settings` | `CompanyLocationsController` | CompanyLocation |
| Auth | `auth/` (login, setup) | `AuthController` | ApplicationUser, CompanyLocation |
| File Storage | `FileUploadZoneComponent` | `FilesController` | FileAttachment |
| Planning Cycles | `planning/` | `PlanningCyclesController` | PlanningCycle, PlanningCycleEntry |
| Vendors | `vendors/` | `VendorsController` | Vendor |
| Purchase Orders | `purchase-orders/` | `PurchaseOrdersController` | PurchaseOrder, PurchaseOrderLine, ReceivingRecord |
| Sales Orders | `sales-orders/` | `SalesOrdersController` | SalesOrder, SalesOrderLine |
| Quotes | `quotes/` | `QuotesController` | Quote (Type=Quote), QuoteLine | Binding fixed-price commitments. Line-itemized (part + qty + unit price). Convert to Sales Order. Can originate from Estimate conversion (`source_estimate_id` FK) or created directly. Shares `quotes` table with Estimates via `QuoteType` discriminator. |
| Shipments | `shipments/` | `ShipmentsController` | Shipment, ShipmentLine |
| Customer Addresses | — (customer detail) | `CustomerAddressesController` | CustomerAddress |
| Invoicing ⚡ | `invoices/` | `InvoicesController` | Invoice, InvoiceLine |
| Payments ⚡ | `payments/` | `PaymentsController` | Payment, PaymentApplication |
| Price Lists | — (backend only) | `PriceListsController` | PriceList, PriceListEntry |
| Recurring Orders | — (backend only) | `RecurringOrdersController` | RecurringOrder, RecurringOrderLine |
| Status Lifecycle | — (integrated into detail panels) | `StatusTrackingController` | StatusEntry |
| Reports (Dynamic Builder) | `reports/` | `ReportBuilderController` | SavedReport | 28 entity sources, 350+ fields, 27 pre-seeded templates, ng2-charts |
| Quality / QC | `quality/` | `QualityController` | QcTemplate, QcInspection | QC templates, inspections, production run integration |
| Chat | `chat/` | `ChatController` | ChatMessage, ChatRoom, ChatRoomMember | 1:1 DMs + group rooms, SignalR real-time, file/entity sharing |
| AI Assistant | `ai/` | `AiController` | DocumentEmbedding | Ollama RAG, smart search, document Q&A, Hangfire indexing |
| AI Assistants (Configurable) | `admin/ai-assistants` | `AiAssistantsController` | AiAssistant | HR/Procurement/Sales domain assistants, admin panel |
| Payroll | `account/pay-stubs`, `account/tax-documents` | `PayrollController` | PayStub, PayStubDeduction, TaxDocument | Employee self-service + admin upload, QB Payroll sync (stub) |
| Employee Compliance Forms | `account/tax-forms/*` | `ComplianceFormsController` | ComplianceFormTemplate, ComplianceFormSubmission, FormDefinitionVersion, IdentityDocument | W-4, I-9, state withholding, PDF extraction pipeline, DocuSeal |
| Sales Tax | — (backend only) | `SalesTaxController` | SalesTaxRate | Per-state/jurisdiction rates, invoice calculation |
| Customer Returns | — (backend only) | `CustomerReturnsController` | CustomerReturn | Full CRUD + resolve/close lifecycle |
| Production Lots | — (backend only) | `LotsController` | LotRecord | Lot creation, traceability query |
| Scheduled Tasks | — (admin) | `ScheduledTasksController` | ScheduledTask | Admin-defined recurring tasks, Hangfire execution |
| Notifications | `notifications/` | `NotificationsController` | AppNotification | Real-time SignalR push, bell badge, preferences, SMTP emails |
| Search | — (header) | `SearchController` | — | Full-text tsvector + RAG hybrid across 6 entity types |
| Employee Training LMS | `training/` | `TrainingController` | TrainingModule, TrainingPath, TrainingProgress, TrainingEnrollment | 46 seeded modules (Article/Video/Walkthrough/QuickRef/Quiz), 8 paths, randomized quiz pools (`questionsPerQuiz`), learning style filter, progress tracking, admin CRUD panel (Admin + Manager), per-user detail drill-down (`UserTrainingDetailPanelComponent`), My Learning default tab |
| Events | `admin/events` | `EventsController` | Event, EventAttendee | Meeting/Training/Safety/Other types, attendee RSVP, admin CRUD panel, shop floor upcoming section, employee detail tab, 15-min reminder job |
| Time Corrections | `admin/time-corrections` | `TimeTrackingController` | TimeCorrectionLog | Admin/manager time entry correction with audit trail, original value snapshot, required reason |
| Contact Interactions | — (customer detail) | `CustomersController` | ContactInteraction | Call/Email/Meeting/Note types, customer detail Interactions tab, per-contact filter |
| EDI | `admin/edi` | `EdiController` | EdiTradingPartner, EdiTransaction, EdiMapping | X12/EDIFACT trading partners, transaction lifecycle, field mappings, inbound polling, retry support |
| MFA | `account/security`, `admin/mfa` | `AuthController`, `AdminController` | UserMfaDevice, MfaRecoveryCode | TOTP setup (QR + manual key), challenge/validate login flow, recovery codes, admin role-based policy enforcement |

### Planned / Partially Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| AR Aging ⚡ | Done (as report) | Implemented as a report in the Reports module, not a standalone page |
| Carrier APIs (UPS/FedEx/USPS/DHL) | Partial | Mock complete; direct carrier integrations not yet built |
| Xero / FreshBooks / Sage accounting | Not Started | Interface + factory ready; only QB implemented |
| QB Payroll API | Not Started | Controller + entities done; QB Payroll sync stubs return empty |

---

## .NET Entity Structure

### Core Entities (in `qb-engineer.core/Entities/`)
```
BaseEntity (Id, CreatedAt, UpdatedAt, DeletedAt, DeletedBy)
├── Job (+ Disposition, DispositionNotes, DisposedAt, ParentJobId, PartId), TrackType, JobStage, JobSubtask, JobActivityLog, JobLink
├── Customer, Contact
├── Part (+ ToolingAssetId FK), BOMEntry (+ LeadTimeDays), Operation, OperationMaterial
├── StorageLocation, BinContent, BinMovement
├── Lead, Expense, Asset (+ tooling fields: CavityCount, ToolLifeExpectancy, CurrentShotCount, IsCustomerOwned, SourceJobId, SourcePartId)
├── TimeEntry, ClockEvent
├── FileAttachment
├── PlanningCycle, PlanningCycleEntry (BaseEntity)
├── Vendor, PurchaseOrder, PurchaseOrderLine (BaseEntity), ReceivingRecord
├── SalesOrder, SalesOrderLine, Quote (Type: Estimate|Quote, SourceEstimateId self-FK), QuoteLine
├── Shipment, ShipmentLine
├── CustomerAddress
├── CompanyLocation (Name, Address, State, IsDefault, IsActive)
├── Invoice, InvoiceLine               ← ⚡ standalone mode
├── Payment, PaymentApplication        ← ⚡ standalone mode
├── PriceList, PriceListEntry
├── RecurringOrder, RecurringOrderLine
├── StatusEntry (polymorphic: EntityType/EntityId, workflow + hold categories)
├── ReferenceData, SystemSetting, SyncQueueEntry
├── PayStub (+ PayStubDeduction), TaxDocument, EmployeeProfile
├── ComplianceFormTemplate, ComplianceFormSubmission, FormDefinitionVersion, IdentityDocument
├── DocumentEmbedding (pgvector vector(384) — RAG index)
├── AiAssistant, ChatMessage, ChatRoom, ChatRoomMember
├── AppNotification, UserNotificationPreference
├── QcTemplate, QcInspection, LotRecord, ProductionRun
├── CustomerReturn, SalesTaxRate, ScheduledTask
├── AuditLogEntry, ActivityLog (polymorphic EntityType/EntityId)
├── UserScanIdentifier, UserPreference
├── Event, EventAttendee
├── TimeCorrectionLog
├── ContactInteraction
├── EdiTradingPartner, EdiTransaction, EdiMapping
├── UserMfaDevice, MfaRecoveryCode
```

### Enums (in `qb-engineer.core/Enums/`)
`JobPriority`, `JobLinkType`, `JobDisposition`, `ActivityAction`, `PartType` (legacy — being decomposed into `ProcurementSource` × `InventoryClass` × `ItemKindId`), `ProcurementSource` (Make, Buy, Subcontract, Phantom), `InventoryClass` (Raw, Component, Subassembly, FinishedGood, Consumable, Tool), `TraceabilityType` (None, Lot, Serial — replaces legacy `IsSerialTracked` boolean), `AbcClass` (A, B, C), `PartStatus` (Draft, Prototype, Active, Obsolete), `BOMSourceType` (Make, Buy, Stock), `LocationType`, `BinContentStatus`, `BinMovementReason`, `LeadStatus`, `ExpenseStatus`, `AssetType`, `AssetStatus`, `ClockEventType`, `SyncStatus`, `AccountingDocumentType`, `PlanningCycleStatus`, `PurchaseOrderStatus`, `SalesOrderStatus`, `QuoteType` (Estimate, Quote), `QuoteStatus` (Draft, Sent, Accepted, Declined, Expired, ConvertedToQuote, ConvertedToOrder), `ShipmentStatus`, `InvoiceStatus`, `PaymentMethod`, `CreditTerms`, `AddressType`, `EventType` (Meeting, Training, Safety, Other), `AttendeeStatus` (Invited, Accepted, Declined, Attended), `InteractionType` (Call, Email, Meeting, Note), `EdiFormat`, `EdiTransportMethod`, `EdiDirection`, `EdiTransactionStatus`, `MfaDeviceType`

---

## SignalR Conventions
- One hub per domain: `BoardHub`, `NotificationHub`, `TimerHub`, `ChatHub`
- Method naming: PascalCase server-side, camelCase client-side
- Groups: subscribe by entity — `job:{id}`, `sprint:{id}`, `user:{id}`
- Angular service handles auto-reconnect with exponential backoff
- Optimistic UI: card moves update locally immediately, server confirms/rolls back via SignalR
- Connection state exposed as signal — UI shows "reconnecting..." banner when disconnected

---

## Accessibility — Full WCAG 2.2 AA Compliance (Non-Negotiable)

**Every component, template, and page MUST be fully WCAG 2.2 AA compliant.** This is not aspirational — it is a hard requirement enforced by automated tooling.

### Mandatory Rules (enforced by `@angular-eslint/template/accessibility-*` lint rules)
- **`aria-label`** on ALL icon-only buttons, links, and interactive elements (e.g., `<button class="icon-btn" aria-label="Delete job">`)
- **`role` attribute** on custom interactive widgets that don't use native HTML semantics (custom dropdowns, tabs, dialogs, grids)
- **`<table>` elements** must have `<th>` with `scope="col"` or `scope="row"`, and tables must have a caption or `aria-label`
- **`<img>` elements** must have `alt` attributes (empty `alt=""` for decorative images)
- **Form inputs** must have associated `<label>` elements or `aria-label`/`aria-labelledby`
- **`tabindex`** only `0` (natural order) or `-1` (programmatic focus) — never positive values
- **Focus management** — dialogs trap focus, closing returns focus to trigger element
- **Keyboard navigation** — all interactive elements reachable via Tab, actionable via Enter/Space, dismissible via Escape

### Visual & Interaction Rules
- APCA-based contrast scoring, validated at theme level
- No info conveyed by color alone — always pair with icon/text
- Focus indicators visible in both themes — enhance, don't suppress
- Touch targets: minimum 44x44px on mobile (88x88px on shop floor kiosk)
- `prefers-reduced-motion` respected — disable animations when set
- Admin theme color pickers validate contrast before saving
- Skip-to-content link as first focusable element

### Automated Enforcement
- **ESLint** — `@angular-eslint/template/accessibility-*` rules (error level) catch missing aria-labels, roles, alt text at build time
- **Cypress axe-core** — `npm run test:a11y` runs axe-core audit on 10 pages, fails on `critical` + `serious` violations
- **CI gate** — both ESLint a11y and Cypress a11y must pass before merge

### When Writing New Components
1. Run through the a11y checklist: labels, roles, keyboard nav, focus management, contrast
2. Add the page to the Cypress accessibility spec if it's a new route
3. Test with keyboard-only navigation (no mouse)
4. Verify screen reader announcements for dynamic content (`aria-live` regions)

---

## Security
- CSP headers: `default-src 'self'`, `script-src 'self'` (no eval), `frame-ancestors 'none'`
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, HSTS in production
- Rate limiting via built-in .NET middleware (fixed window, sliding window, token bucket)
- QB OAuth tokens encrypted via ASP.NET Data Protection API (keys in Postgres)
- No sensitive data in localStorage beyond auth tokens (short-lived access + rotated refresh)
- Auth interceptor: 401 → silent refresh, queues concurrent requests during refresh

---

## Multi-Tab Handling
- Auth sync across tabs via `BroadcastChannel` / `storage` event — logout propagates to all tabs
- Theme sync via `storage` event on `themeMode` key
- Each tab opens its own SignalR connection (acceptable for < 50 concurrent users)
- IndexedDB shared per origin — no extra cache sync needed

---

## Offline Resilience
- Service worker caches app shell (HTML, JS, CSS, assets) for instant load
- IndexedDB cache serves as offline data layer — stale-while-revalidate
- Offline banner: "Connection lost. Changes will sync when reconnected."
- Action queue in IndexedDB — card moves, time entries, chat messages, form submissions queued and drained on reconnect
- Conflicts resolved last-write-wins (same as SignalR multi-user)
- No silent data loss — queued operations never silently discarded

---

## Testing Conventions

### Angular (Vitest)
- Unit tests for services and pipes (`.spec.ts` co-located)
- Component tests for smart components with meaningful logic
- No tests for trivial dumb components
- Mock HTTP via `provideHttpClientTesting`

### .NET (xUnit)
- Unit tests for MediatR handlers (business logic)
- Integration tests for API endpoints via `WebApplicationFactory`
- Bogus for test data generation
- Mock external services (QB, MinIO, SMTP) — never hit real services
- Test project mirrors source: `QbEngineer.Tests/Handlers/Jobs/CreateJobHandlerTests.cs`

### E2E (Cypress)
- Critical user journeys: login, kanban CRUD, job detail, planning, dashboard, notifications, expense, lead, parts, time tracking, search, admin
- Runs against full Docker Compose stack with `MOCK_INTEGRATIONS=true`
- API seeding for test data (not UI clicks)
- Custom commands: `cy.login(role)`, `cy.createJob()`, `cy.seedData()`
- No `cy.wait(ms)` — use built-in retry/assertions
- Specs in `cypress/e2e/` organized by feature

### E2E (Playwright — SignalR Diagnostics & Simulation)
- Playwright for multi-browser context tests (required for SignalR real-time sync verification)
- Also powers the week simulation framework (see §E2E Simulation Framework above)
- Tests in `qb-engineer-ui/e2e/tests/`, helpers in `e2e/helpers/`
- Run headless: `npm run e2e` | headed: `npm run e2e:headed`
- Config: `e2e/playwright.config.ts` — Chromium only, no webServer (assumes Docker stack running)
- Auth via API helper (`e2e/helpers/auth.helper.ts`) — sets localStorage directly, no UI login
- Seeded test users: `admin@qbengineer.local`, `akim@qbengineer.local` — password set via `SEED_USER_PASSWORD` env var
- `ui-actions.helper.ts`: reusable helpers (navigateTo, fillInput, fillMatSelect, fillDatepicker, clickButton)
- **SignalR diagnostic:** `signalr-board-sync.spec.ts` — verifies real-time board sync between two browser contexts
- **Troubleshooting SignalR:** Run `npm run e2e` from `qb-engineer-ui/` as a quick diagnostic. Creates two browser contexts, logs in both, moves a job via API, asserts the second browser updates within 5s via SignalR.

### Static Analysis
- ESLint + `@angular-eslint` + `@typescript-eslint`: unused vars, no `any`, import ordering, no `console.log`
- Prettier for formatting
- .NET Analyzers at `Medium` level + StyleCop.Analyzers
- `<Nullable>enable</Nullable>`, no warning suppression without comment

---

## Git Conventions
- Branch naming: `feature/job-card-crud`, `fix/notification-dismiss`, `chore/update-dependencies`
- Commit messages: imperative mood, < 72 chars — "Add job card CRUD endpoints"
- One logical change per commit
- PR required for main (even solo)
- No force pushes to main

---

## CI/CD Pipeline (GitHub Actions)
1. **Build** — restore, compile, lint (Angular + .NET in parallel)
2. **Unit Tests** — Vitest + xUnit in parallel
3. **Integration Tests** — .NET against test Postgres
4. **E2E Tests** — Cypress against Docker Compose
5. **Docker Build** — build and tag images
6. **Release** — push tagged images on version tags

PRs require passing CI. Test results reported as PR comments. Failed E2E includes screenshots.

---

## Versioning
- Semantic versioning from git tags: `v1.2.3`
- CI auto-increments patch on merge to main
- Version injected into Angular `environment.ts` and .NET `AssemblyVersion` at build time
- Docker images tagged with version + `latest`
- Version displayed in UI footer and API health endpoint

---

## Docker

```bash
docker compose up -d                          # Full stack
docker compose up -d --build qb-engineer-api  # Rebuild API
docker compose logs -f qb-engineer-api        # API logs
docker compose exec qb-engineer-db psql -U postgres -d qb_engineer  # DB access
```

5 core services: `qb-engineer-ui`, `qb-engineer-api`, `qb-engineer-db`, `qb-engineer-storage`, `qb-engineer-backup`. Optional profiles: `ai` (Ollama + model init), `tts` (Coqui TTS), `signing` (DocuSeal).

### Setup & Refresh Scripts

**First-time setup:**
```bash
.\setup.ps1            # Windows / PowerShell (any platform with pwsh)
./setup.sh             # Linux / macOS (bash — auto-detects ARM, low-RAM, headless)
```

**Ongoing updates:**
```bash
.\refresh.ps1          # Windows / PowerShell
./refresh.sh           # Linux / macOS (bash)
```

- Setup: prerequisite checks, .env creation, JWT key generation, seed password prompt, Docker build + start
- Refresh: git pull, rebuild with `--no-cache --force-recreate`, restart
- Both bash scripts auto-detect platform (ARM/x86_64), memory (applies container limits on < 8 GB), and headless (offers SSL)
- `--ssl` / `--no-ssl` flags override auto-detection on `setup.sh`
- `docker-compose.override.yml` auto-generated for SSL and/or memory tuning (no separate ARM scripts needed)

### Port Conflicts — Never Blind-Kill `docker-proxy`

When `docker compose up` fails with "port is already allocated" or "bind: address already in use", the culprit is often a stray `docker-proxy` process from a previous stack. **Do not `kill -9` any `docker-proxy` PID without first identifying its owner** — you can silently take down another user's running container on the same host (co-hosted sites, CI runners, dev stacks on the same box).

**Correct diagnostic flow:**
1. Find the PID holding the port: `sudo ss -tlnp 'sport = :<port>'` or `sudo lsof -iTCP:<port> -sTCP:LISTEN`
2. If the process is `docker-proxy`, read its argv: `cat /proc/<pid>/cmdline | tr '\0' ' '; echo` — look for `-host-port <port>` and `-container-id <hash>`
3. Match the container-id to a running container: `docker ps --format '{{.ID}}\t{{.Names}}\t{{.Ports}}'`
4. **If the container belongs to this project** (`qb-engineer-*`) → `docker compose down` or `docker rm -f <container>`, then retry `up`
5. **If the container belongs to another project** → the port is legitimately in use; pick a different port or stop the other stack intentionally

Scripts (`setup.sh`, `refresh.sh`) must follow this ownership check before taking any remediation action. Never blanket-kill all `docker-proxy` processes.

---

## IClock Abstraction

Injectable clock for testable time-dependent code. Production uses `SystemClock` (wraps `DateTime.UtcNow`), E2E simulation uses `SimulationClock` (controllable time).

```csharp
// Inject in handlers/services:
private readonly IClock _clock;

// Use instead of DateTime.UtcNow:
var now = _clock.UtcNow;
```

Registered in `Program.cs`. Used by `AppDbContext.SetTimestamps()` and time-dependent handlers.

---

## E2E Simulation Framework

Playwright-based week simulation spanning 431 weeks (2018–2026) for realistic data generation:

- `qb-engineer-ui/e2e/tests/` — simulation specs
- `e2e/helpers/ui-actions.helper.ts` — reusable Playwright helpers (navigateTo, fillInput, fillMatSelect, fillDatepicker, clickButton)
- `e2e/helpers/auth.helper.ts` — `seedAuth()` for pre-authenticated browser contexts
- Resume support: queries API for latest data to skip already-processed weeks
- Rate limiter bypass for loopback IPs in `Program.cs` for E2E throughput

### data-testid Conventions
All form fields and interactive elements in dialog/form templates must have `data-testid` attributes:
- Format: `{entity}-{field}` (e.g., `data-testid="job-title"`, `data-testid="job-save-btn"`)
- Used by Playwright simulation runner and E2E tests

---

## Pluggable Integrations

### Mock Integration Flag
- `MockIntegrations` in appsettings.json (default `false`, `true` in Development)
- `MockIntegrations=${MOCK_INTEGRATIONS:-false}` in docker-compose.yml
- Program.cs conditionally registers mock vs real services based on this flag
- All mock services log operations via `ILogger` for dev visibility

### Accounting (`IAccountingService`)
- Interface: `qb-engineer.core/Interfaces/IAccountingService.cs`
- Models: `qb-engineer.core/Models/AccountingModels.cs` (AccountingCustomer, AccountingDocument, AccountingLineItem, AccountingPayment, AccountingTimeActivity, AccountingSyncStatus)
- Mock: `qb-engineer.integrations/MockAccountingService.cs` — returns canned data matching seeded customers
- QuickBooks Online is default + primary provider — **implemented** (`qb-engineer.integrations/QuickBooksAccountingService.cs`): OAuth 2.0, sync queue, customer/item/invoice/payment/time-activity sync, token encryption via Data Protection API
- Additional providers (Xero, FreshBooks, Sage) implement same interface — **not yet implemented** (interface + factory ready)
- App works fully in standalone mode (no provider) — financial features degrade gracefully
- Sync queue, caching, orphan detection are provider-agnostic

### Shipping (`IShippingService`)
- Interface: `qb-engineer.core/Interfaces/IShippingService.cs`
- Models: `qb-engineer.core/Models/ShippingModels.cs` (ShipmentRequest, ShippingAddress, ShippingPackage, ShippingRate, ShippingLabel, ShipmentTracking, TrackingEvent)
- Mock: `qb-engineer.integrations/MockShippingService.cs` — returns 3 mock carrier rates
- Direct carrier integrations: UPS, FedEx, USPS, DHL (not yet implemented — each implements `IShippingService` directly, no middleman)
- Manual mode always available (no API, user enters tracking number)
- **Address validation is NOT part of IShippingService** — see `IAddressValidationService` below

### Address Validation (`IAddressValidationService`)
- Interface: `qb-engineer.core/Interfaces/IAddressValidationService.cs`
- Decoupled from shipping — address validation uses USPS Web Tools directly (free)
- Mock: `qb-engineer.integrations/MockAddressValidationService.cs` — format-only validation (state codes, ZIP regex, required fields)
- Real: `qb-engineer.integrations/UspsAddressValidationService.cs` — USPS Address Information API v3 (XML REST, free with USPS Web Tools User ID)
- Config: `UspsOptions` (`Usps:UserId` in appsettings.json) — register at https://www.usps.com/business/web-tools-apis/
- Program.cs: USPS when User ID configured, mock otherwise (same pattern as other integrations)
- Frontend: `AddressFormComponent` → `AddressService.validate()` → `POST /api/v1/addresses/validate` → `IAddressValidationService.ValidateAsync()`
- USPS returns DPV (Delivery Point Validation) confirmation + standardized address

### AI (`IAiService` — Optional)
- Interface: `qb-engineer.core/Interfaces/IAiService.cs`
- Models: `qb-engineer.core/Models/AiModels.cs` (AiSearchResult)
- Mock: `qb-engineer.integrations/MockAiService.cs` — returns canned text responses
- Self-hosted Ollama + pgvector RAG — **implemented** (`OllamaAiService.cs`): gemma3:4b, `DocumentEmbedding` entity (pgvector vector(384)), RAG pipeline (IndexDocument / RagSearch / BulkIndexDocuments handlers), `DocumentIndexJob` (Hangfire 30 min), `AiController` (generate/summarize/status/search/index)
- Use cases: smart search, job description drafting, QC anomaly detection, document Q&A, header AI search column with RAG results
- Graceful degradation when AI container is down

### Storage (`IStorageService`)
- Interface: `qb-engineer.core/Interfaces/IStorageService.cs`
- Real: `qb-engineer.integrations/MinioStorageService.cs` (MinIO S3-compatible)
- Mock: `qb-engineer.integrations/MockStorageService.cs` — in-memory ConcurrentDictionary
- Config: `MinioOptions` in `qb-engineer.core/Models/MinioOptions.cs`

### PDF Form Extraction (pdf.js + PuppeteerSharp)
- **Architecture:** pdf.js (via PuppeteerSharp headless Chromium) extracts text + form fields from PDFs. Smart parser infers ComplianceFormDefinition layout. AI verifies and refines.
- **Full docs:** `docs/pdf-extraction-pipeline.md`
- **3 interfaces:**
  - `IPdfJsExtractorService` — raw pdf.js extraction (text items + annotations)
  - `IFormDefinitionParser` — converts raw data → ComplianceFormDefinition JSON
  - `IFormDefinitionVerifier` — structural checks + AI refinement loop (max 3 iterations)
- **Real:** `PdfJsExtractorService.cs` (PuppeteerSharp singleton browser), `FormDefinitionParser.cs`, `FormDefinitionVerifier.cs`
- **Mock:** `MockPdfJsExtractorService.cs` — returns canned extraction data
- **JS extraction page:** `qb-engineer.api/wwwroot/pdf-extract.html` — bundled pdf.js, called via PuppeteerSharp `EvaluateFunctionAsync`
- **Docker:** API container uses Debian base (not Alpine) with Chromium installed. `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`
- **Pattern detection:** Step sections, amount lines, filing status, signature blocks, form headers — all inferred from structural cues, no per-form hardcoding

---

## Roles (Additive)

| Role | Access |
|------|--------|
| Engineer | Kanban, assigned work, files, expenses, time tracking |
| PM | Backlog, planning, leads, reporting, priority (read-only board) |
| Production Worker | Simple task list, start/stop timer, move cards, notes/photos |
| Manager | Everything PM + assign work, approve expenses, set priorities |
| Office Manager | Customer/vendor, invoice queue, employee docs |
| Admin | Everything + user management, roles, system settings, track types |

---

## Key Functional Decisions

### Kanban Board
- Track types: Production, R&D/Tooling, Maintenance, Other + custom
- Cards move backward unless QB document at that stage is irreversible (Invoice, Payment)
- Multi-select: `Ctrl+Click`, bulk actions (Move, Assign, Priority, Archive)
- SignalR real-time sync, last-write-wins, optimistic UI
- Cards archived (never deleted)
- Column body: white background (`--surface`) with 2px inset border matching stage color via `--col-tint` CSS custom property
- **IsShopFloor filter**: boolean on `TrackType` + `JobStage` — controls which stages appear on the shop floor display (physical-work stages only)

### Shop Floor Display
- Full-screen kiosk at `/display/shop-floor` with RFID/barcode scan → PIN auth flow
- **Worker card grid**: 5-column, square cards with horizontal layout, left status stripe matching stage color
- **Job actions**: timer start/stop, Mark Complete overlay
- **Auto-dismiss timeouts**: PIN phase (20s), job-select phase (15s)
- **Theme/font persistence**: saved to localStorage for kiosk continuity
- **IsShopFloor filter**: only shows jobs in stages where `IsShopFloor = true`

### Production Track Stages (QB-aligned)
Quote Requested → Quoted (Estimate) → Order Confirmed (Sales Order) → Materials Ordered (PO) → Materials Received → In Production → QC/Review → Shipped (Invoice) → Invoiced/Sent → Payment Received (Payment)

### Planning Cycles
- Default 2 weeks (configurable). Day 1 = Planning Day with guided flow
- Split-panel: backlog (left) → planning cycle (right), drag to commit
- Daily prompts: Top 3 for tomorrow each evening
- End of cycle: incomplete items roll over or return to backlog

### Activity Log
- Per-entity chronological timeline (job, part, asset, lead, customer, expense)
- Batch field changes collapse into expandable entries
- Inline comments with @mentions → notification
- Filterable by action type and user. Immutable entries.

#### Activity logging rules (Non-Negotiable)

Every MediatR command handler that mutates a tracked entity MUST emit at least one `ActivityLog` row before its `SaveChangesAsync`. The Activity tab is the audit trail; missing rows = silent state changes.

1. **Definitional vs transactional split** — this gates everything else below.
   - **Definitional / master-data entities** describe what something *is* and are read by downstream transactions: `Part`, `Vendor`, `Customer`, `Contact`, `Asset`, `BOMEntry`, `VendorPart` (and its price tiers), `PriceList`, `RecurringOrder`, `QcTemplate`, `ComplianceFormTemplate`, `WorkflowDefinition`, `ReferenceData`, `SystemSetting`. Mutations here get the indexing-points treatment (rule 2).
   - **Transactional / event-stream entities** *happen* — they're discrete records of operations: `Job`, `SalesOrder`, `Quote/Estimate`, `Invoice`, `Shipment`, `Payment`, `PurchaseOrder`, `BinMovement`, `TimeEntry`, `ClockEvent`, `ContactInteraction`, `Notification`, `ChatMessage`, plus the line-items of all of those. Mutations here log ONLY on the entity itself (and its parent header where applicable — e.g. a SalesOrderLine mutation logs on the SO, not on the upstream Part). Pushing transactional events onto the master-data Activity tab turns it into a transaction log and drowns the definitional changes that actually matter for audit.
   - When in doubt, ask: "If I'm looking at this Part / Vendor / Customer next year, is this row about *what changed in the definition* (yes → log it here) or *something operational that happened to use this definition* (no → log on the transactional entity, not here)?"
   - **Self-auditing-data exception.** Some definitional collections *are* their own audit trail — the current state, viewed in its native UI, fully describes what the entity is. `BOMEntry` is the canonical example: the BOM tab IS the history of "what this part is composed of"; an activity-feed row saying "added component X" duplicates information already trivially visible. For these, skip the activity log entirely on the collection mutations themselves — only log the *parent* entity's own definitional changes (rename, status change, etc.). Apply this exception conservatively: it's earned only when the collection is small, fully visible in one place, and a simple "added/removed/changed" verb adds nothing the screen doesn't already show. Fields with semantics (price, lead time, vendor preference) do NOT qualify — those go through the indexing-points rule.

2. **Indexing-points rule (definitional entities only).** When the mutated entity sits at an indexing point between multiple definitional entities (e.g. `VendorPart` bridges Part ↔ Vendor; `BOMEntry` bridges parent-Part ↔ component-Part; `Contact` bridges to Customer), emit a row for **every** involved entity — not just the one the user is currently viewing. Use `db.LogActivityAt(action, description, ("Part", partId), ("Vendor", vendorId))` from `QBEngineer.Data.Extensions.ActivityLogExtensions`. Order doesn't matter; the helper writes one row per pair.

3. **Rollup rule.** A multi-field update produces ONE activity row whose `Description` summarizes all changed fields (e.g. `"Updated 4 fields: leadTimeDays, minOrderQty, packSize, notes"`). Do NOT emit one row per field — per-field history is the History tab's stream (a different table / different concept). For UpdateXxxHandlers, build a `List<string> changedFields` while applying patches, then write one row referencing them all.

4. **Action verb conventions.** Use kebab-case domain verbs: `created`, `updated`, `deleted`, `archived`, plus specific verbs like `vendor-source-added`, `vendor-source-removed`, `price-tier-added`, `price-tier-updated`, `price-tier-removed`, `preferred-vendor-changed`. Verbs are queryable — don't free-form them.

5. **Description format.** First clause = what changed (in human terms), second clause (optional) = the defining identifiers ("qty ≥ 100 @ $1.50 USD effective 2026-05-04"). The History tab parses on FieldName/OldValue/NewValue; the Activity tab renders Description verbatim. Keep it under ~120 chars.

6. **No cancellation token on the helper.** `LogActivityAt` doesn't take a CT — it just adds to the change-tracker; the surrounding `SaveChangesAsync(ct)` is what flushes.

7. **Helper handles current user.** `LogActivityAt` reads `AppDbContext.CurrentUserId` (set by middleware) — handlers do NOT need to inject `IHttpContextAccessor` or pass user IDs. If `CurrentUserId` is null (system-initiated operation, e.g. Hangfire job), the row is logged with `UserId = null` and renders as "System" in the UI.

### Reference Data
- Single `reference_data` table for all lookups (expense categories, lead sources, priorities, statuses, etc.)
- Recursive grouping via `group_id`. `code` immutable, `label` admin-editable. `metadata` JSONB.
- One admin screen manages everything — no scattered lookup tables

### Company Profile & Locations
- Company profile stored as `company.*` system settings (name, phone, email, EIN, website)
- `CompanyLocation` entity — multiple locations per install, exactly one default (filtered unique index)
- Per-employee `WorkLocationId` FK on `ApplicationUser` — determines state withholding; null = default location
- Setup wizard: 2-step (admin account → company details + primary location)
- Admin settings tab: Company Profile form, Locations DataTable (CRUD + set-default), CompanyLocationDialogComponent

### User Preferences
- Centralized `user_preferences` table, key-value: `table:{id}`, `theme:mode`, `sidebar:collapsed`, `dashboard:layout`
- `UserPreferencesService` loads on init, caches in memory, debounced PATCH on change
- Restored on login from any device

---

## Printing & PDF
- `@media print` stylesheet: hides nav, toolbar, sidebar, interactive controls
- Printable views: work order, packing slip, QC report, part spec, expense report
- QR/barcode labels: bwip-js + angularx-qrcode, configurable label sizes
- Server-side PDF: QuestPDF — `GET /api/v1/jobs/{id}/pdf?type=work-order`

---

## What NOT to Do

- Never use `FormsModule` / `ngModel` in features — always `ReactiveFormsModule`
- Never use raw `<input>`, `<select>`, `<textarea>` — always shared wrappers
- Never build custom dialog shells — always `<app-dialog>`
- Never hardcode colors, spacing, font sizes, border radius in component SCSS
- Never use `*ngIf` / `*ngFor` — use `@if` / `@for`
- Never use `!important` unless overriding third-party (with comment)
- Never nest SCSS more than 3 levels
- Never use "DTO" suffix — use `*ResponseModel` / `*RequestModel`
- Never send date-only strings to the API — always include time + UTC zone
- Never put multiple classes/enums/components in one file
- Never use barrel files (`index.ts`) for re-exports
- Never use inline templates or inline styles
- Never use function calls in template bindings — use computed signals
- Never use constructor injection — use `inject()`
- Never use `console.log` in production code
- Never hardcode z-index values — use `$z-*` variables
- Never use `try/catch` in controllers — middleware handles exceptions
- Never use data annotations on entities — use Fluent API configuration
- Never hard-delete records — always soft delete via `DeletedAt`
- Never use `mat-error` / inline validation — wrap the disabled submit button with `<app-validation-button>` (stereotype). Do not use `ValidationPopoverDirective` on new code.
- Never deep-override Material internals with CSS — build a custom component instead
- Never put HTTP calls in components — always in services
- Never use `*` or `ng-deep` to override child component styles
- Never suppress lint/analysis warnings without a comment explaining why
- Never write data-fetching code without evaluating loading state — use `LoadingService` (global) or `LoadingBlockDirective` (section-level)
- Never duplicate `@keyframes spin` — it's defined globally in `_shared.scss`
- Never build financial features (invoices, payments, AR, P&L, vendor CRUD) without checking the accounting boundary — see below
- Never store significant UI state (tabs, selected entity, filters, pagination) in signals/services alone — the URL must be the source of truth (see "URL as Source of Truth" pattern)
- Never hardcode lists into selects, autocompletes, or multi-selects — options must come from the database via API (roles, statuses, categories, teams, etc.). The only exceptions are truly static UI choices (sort direction, pagination sizes).

---

## Efficiency & Memory Leak Prevention (Non-Negotiable)

**Every code change must be evaluated for memory leaks and efficiency.** These rules prevent the most common resource leaks found in this codebase.

### Angular — Subscription & Resource Lifecycle

1. **Every `.subscribe()` in a service constructor or component constructor MUST have `takeUntilDestroyed(this.destroyRef)` in its pipe chain.** Router events, FormControl.valueChanges, and interval observables are the most common offenders. The only exception is fire-and-forget HTTP calls that complete naturally (single POST/PATCH/DELETE with `catchError`).

2. **SignalR hub services MUST call `.off()` on all registered event names before re-registering or on disconnect.** Otherwise, each `connect()` call accumulates duplicate handlers. Pattern:
   ```typescript
   private registerHandlers(): void {
     this.unregisterHandlers(); // Always clean up first
     this.connection.on('event', (e) => this.callback?.(e));
   }
   private unregisterHandlers(): void {
     this.connection?.off('event');
   }
   ```

3. **Never use `.subscribe()` without error handling on user-facing HTTP calls.** At minimum, add a `catchError` in the pipe or an `error` callback. Silent failures cause state inconsistency.

4. **Global event listeners (`document.addEventListener`, `window.addEventListener`) MUST have corresponding `removeEventListener` in `ngOnDestroy` or via `destroyRef.onDestroy()`.** Track handler references as class fields.

5. **Computed signals must not perform O(n*m) filtering.** Pre-group data with `Map` or `Set` before filtering. Example: instead of `users.map(u => jobs.filter(j => j.assigneeId === u.id))`, pre-build a `Map<userId, Job[]>` and look up by key.

### .NET — Query & Resource Efficiency

1. **Never use `db.Entity.Where()` inside a LINQ `.Select()` projection.** This creates N+1 queries. Pre-load related data with `.Include()`, a JOIN, or a dictionary lookup before the projection.

2. **Never load entire tables into memory** (`await db.Parts.ToListAsync()`). Use pagination (`Skip/Take`), filtering, or chunked processing for large datasets. Hangfire jobs are especially prone to this — process in batches of 500.

3. **Never filter a list inside a loop** (`list.Where(x => x.Id == item.Id)` per iteration). Pre-group with `.GroupBy().ToDictionary()` or `.ToLookup()` before the loop to avoid O(n²).

4. **Hangfire job methods MUST accept `CancellationToken` as a parameter** and pass it to all async calls. Hangfire passes a CT automatically when jobs are cancelled/shut down.

5. **Methods returning `Stream` must document ownership** — prefer returning `byte[]` unless streaming is required for large files. Callers of stream-returning methods must use `using` statements.

6. **Use `AsNoTracking()` on all read-only EF Core queries** (those that don't call `SaveChangesAsync` afterward). Tracking adds memory overhead for change detection.

7. **Add database indexes for columns used in WHERE/JOIN/ORDER BY** — especially foreign keys, `UserId`, and any column used in global query filters.

---

## ⚡ Accounting Boundary (Critical)

Some features duplicate functionality that an accounting system (QuickBooks, Xero, etc.) handles natively. These features must be **cordoned off** so they only activate in standalone mode (no accounting provider connected). See `docs/qb-integration.md` for the authoritative boundary definition.

### Rules for Accounting-Bounded Code

1. **Every accounting-bounded feature must check `IAccountingService.IsConfigured` (.NET) or `AccountingService.isStandalone` (Angular).** When a provider is connected, the feature becomes read-only or hidden.

2. **Mark all accounting-bounded specs with `⚡ ACCOUNTING BOUNDARY`** in functional-decisions.md and other docs so they are easily searchable.

3. **Accounting-bounded features** (standalone mode only):
   - Invoices (local CRUD, PDF generation)
   - Payments (local recording, application to invoices)
   - AR Aging (computed from local invoices/payments)
   - Customer Statements (generated from local data)
   - Sales Tax tracking (simple per-customer rate)
   - Financial Reports (P&L, revenue, payment history)
   - Vendor management (full local CRUD — read-only when integrated)
   - Credit terms management

4. **Never-in-app features** (regardless of mode):
   - General ledger / bookkeeping
   - Payroll tax calculations
   - Bank reconciliation
   - Check writing
   - Depreciation schedules
   - Full accrual-basis accounting

5. **Always-in-app features** (regardless of mode):
   - Sales Orders, Quotes, Shipments
   - Price Lists, Quantity Breaks, Recurring Orders
   - Customer Addresses (multi-address model)
   - Margin calculations (estimated from app-owned data)

6. **Codified via Phase 4 capability gating.** The accounting boundary is now enforced through the capability system as the mutex pair `CAP-ACCT-EXTERNAL ⊥ CAP-ACCT-BUILTIN` (the only declared mutex in the catalog). `CAP-ACCT-FULLGL` is registered as an aspirational placeholder — never enabled, gating returns 403 with a "not yet available" tone. See the **Capability Gating** section below for the mechanism.

### Implementation Pattern
```csharp
// .NET — Controller or handler checks mode
if (_accountingService.IsConfigured)
    return StatusCode(409, "Feature disabled — managed by accounting provider");

// Angular — Component hides/shows based on mode
readonly isStandalone = this.accountingService.isStandalone;
// Template: @if (isStandalone()) { <invoice-crud /> }
```

---

## Capability Gating (Phase 4)

The system runs on a **per-install capability gate**: 129 named capabilities (e.g., `CAP-MD-CUSTOMERS`, `CAP-INV-LOTS`, `CAP-EXT-AI-ASSISTANT`) are registered in a static catalog. Each install's capability state is stored in the `capabilities` table; controllers and Hangfire-fired commands carry `[RequiresCapability("CAP-...")]` attributes; the `CapabilityGateMiddleware` (controller side) and `CapabilityGateBehavior` (MediatR side) short-circuit with 403 + envelope when a capability is disabled. Bootstrap-exempt endpoints (auth, descriptor, capability admin) carry `[CapabilityBootstrap]` instead so admins are never locked out.

**Where things live:**
- **Catalog (source of truth)**: `qb-engineer-server/qb-engineer.api/Capabilities/CapabilityCatalog.cs` — 129 capabilities with code, name, area, default-state, dependencies/mutexes
- **Relations**: `CapabilityCatalogRelations.cs` — dependency edges + mutex pairs (only one declared mutex today: `CAP-ACCT-EXTERNAL ⊥ CAP-ACCT-BUILTIN`)
- **Snapshot + middleware**: `CapabilitySnapshot.cs`, `ICapabilitySnapshotProvider`, `CapabilityGateMiddleware.cs`, `CapabilityGateBehavior.cs`
- **Mutation API**: `CapabilitiesController` exposes `PUT /api/v1/capabilities/{code}/enabled`, bulk-toggle, validate, audit-log; preset & discovery endpoints layered on top
- **Frontend service**: `CapabilityService` (loaded on login, refreshes on SignalR `capabilityChanged` push) + `*appCap` directive + `capabilityGuard` route guard

**Toggling capabilities:**
- Admin UI at `/admin/capabilities` (browse grid grouped by area), `/admin/capabilities/:code` (detail), `/admin/capabilities/audit-log` (history)
- Discovery wizard at `/admin/discovery` (22-question flow, server-side recommendation engine, applies a preset)
- Preset browser at `/admin/presets` (8 presets — 7 named + Custom — with diff modal before apply)
- Direct API: `PUT /api/v1/capabilities/{code}/enabled` (admin-only, bootstrap-exempt)

**Adding a new feature**: see `docs/coding-standards.md` §0 — every new endpoint either reuses an existing capability or registers a new one in the catalog before it ships.

**Design artifacts (deep-dive, decision history)**:
- `phase-4-output/4A-capability-catalog/` — all 129 capabilities with rationale
- `phase-4-output/4B-preset-design/` — 8 presets with target profile + capability set
- `phase-4-output/4C-discovery-flow/` — 22-question wizard + recommendation algorithm
- `phase-4-output/4D-gating-mechanism/` — middleware + descriptor + audit pipeline
- `phase-4-output/4E-admin-ui/` — browse / discovery / preset / detail screens
- `phase-4-output/4F-implementation-plan/` — phasing strategy + per-phase decisions
- `phase-4-output/PHASE-4-CLOSEOUT.md` — rollup summary

---

## Part Type Decomposition (Pillar 1)

The legacy `PartType` enum (Part / Assembly / RawMaterial / Consumable / Tooling / Fastener / Electronic / Packaging) overloaded three concepts into one field. It's been decomposed into three orthogonal axes per `phase-4-output/part-type-field-relevance.md`:

1. **`Part.ProcurementSource`** (`ProcurementSource` enum: Make / Buy / Subcontract / Phantom) — how the part is sourced. Subcontract = entire part outsourced (vendor builds it, we never touch it); Make + an `Operation.IsSubcontract = true` op = we make most of it but send out for one step.
2. **`Part.InventoryClass`** (`InventoryClass` enum: Raw / Component / Subassembly / FinishedGood / Consumable / Tool) — which inventory bucket the part lives in.
3. **`Part.ItemKindId`** (FK to `reference_data` group `part.item_kind`, admin-configurable) — descriptive taxonomy: Fastener, Electronic, Packaging, Hardware, Material, etc.

Legacy `PartType` column kept on the row for two release cycles for rollback safety. New code reads the three axes; the workflow adapter (`PartWorkflowAdapter`) accepts EITHER the legacy `partType` OR the new axes in `initialEntityData` and falls back to a derived mapping. Same fallback exists client-side in `parts.component.ts` (`inferAxesFromLegacyPartType`).

**Tier 0 additions on Part**: `TraceabilityType` enum (None / Lot / Serial — replaces `IsSerialTracked` boolean), `AbcClass` (was an unused enum, now a column), `ManufacturerName`, `ManufacturerPartNumber` (engineering OEM identity, distinct from `VendorPart.VendorMpn` for the distributor case).

**11 viable (procurement × inventory_class) combinations** are documented in the audit; per-combination workflow definitions are a Pillar 6 deliverable. Today the existing 2 workflow definitions (assembly-guided + raw-material-express) still drive but with axes populated. Tier 2 fields (Material → MaterialSpecId FK, mass/dimensions/volume measurement profile) are deferred.

## Vendor-Part Intersection (Pillar 3)

`VendorPart` entity captures the (Vendor, Part) relationship with vendor-scoped sourcing metadata: vendor's part number, vendor's manufacturer-part-number when distributing someone else's part, per-vendor lead time / MOQ / pack size, country of origin, HTS code, AVL approval flag, preferred flag, certifications, last-quoted date.

`VendorPartPriceTier` 1:N child captures tiered pricing (`MinQuantity` ≤ requested qty wins; effective-from/to dates).

**API**: `/api/v1/vendor-parts` for CRUD, `/api/v1/parts/{partId}/vendor-parts` for the part-detail Sources tab data, `/api/v1/vendors/{vendorId}/vendor-parts` for the vendor-detail Catalog tab data, plus `/{id}/price-tiers` POST/DELETE for tier upserts.

**Capability**: `CAP-MD-VENDORS`. Roles: `Admin, Manager, Engineer, OfficeManager`.

**Preferred-uniqueness invariant**: at most one VendorPart per Part may have `IsPreferred=true`. Setting it true unsets it on every other VendorPart for the same Part within one SaveChanges (handled in CreateVendorPart + UpdateVendorPart).

`Part.PreferredVendorId` stays — points at the canonical preferred vendor. `Part.MinOrderQty` / `Part.PackSize` / `Part.LeadTimeDays` are kept on Part as a snapshot of the preferred VendorPart's values (backward-compat with existing readers); Phase 2/4 work will migrate readers to the VendorPart row.

---

## Order Management Entities

### New Core Entities (in `qb-engineer.core/Entities/`)
```
SalesOrder, SalesOrderLine
Quote, QuoteLine
Shipment, ShipmentLine
CustomerAddress
Invoice, InvoiceLine          ← ⚡ standalone mode
Payment, PaymentApplication   ← ⚡ standalone mode
PriceList, PriceListEntry
RecurringOrder, RecurringOrderLine
```

### New Enums
`SalesOrderStatus`, `QuoteType`, `QuoteStatus`, `ShipmentStatus`, `InvoiceStatus`, `PaymentMethod`, `CreditTerms`, `AddressType`

---

## Implementation Tracking

**Check `docs/implementation-status.md` at the start of every session.** When completing a feature, update its status in that file before ending the session. This is the master progress tracker for the entire project.
