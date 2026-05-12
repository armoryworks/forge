# Coding Standards

## 0. Adding a New Feature — Step 0: Register the Capability

**Before adding new endpoints or feature surface, decide which capability gates them.** Every controller / endpoint / nav entry / Hangfire job in the system flows through the Phase 4 capability-gating layer. New features must be registered the same way existing features were:

1. **Pick or add a capability code in `forge-api/forge.api/Capabilities/CapabilityCatalog.cs`.** Either reuse an existing capability that semantically covers the new endpoint (e.g., adding a new lot-traceability query reuses `CAP-INV-LOTS`), or add a new `CapabilityDefinition` row with:
   - A stable `CAP-{AREA}-{NAME}` code (e.g., `CAP-PLAN-MPS`, `CAP-QC-GAGE`). Codes are immutable forever once shipped.
   - A `DefaultState` (on/off) — default-on for capabilities every install needs; default-off for opt-in features.
   - Optional `Dependencies` and `Mutexes` declared in `CapabilityCatalogRelations.cs`.

2. **Apply `[RequiresCapability("CAP-...")]` to the controller (or specific actions).** Class-level when every action shares one capability; action-level when a controller spans multiple capabilities. The existing `CapabilityGateMiddleware` reads the most-specific attribute and short-circuits with 403 + `X-Capability-Disabled` envelope when the capability is disabled.

3. **For Hangfire-fired or other non-controller execution paths**, apply `[RequiresCapability("CAP-...")]` to the MediatR command type. The `CapabilityGateBehavior` pipeline behavior throws `CapabilityDisabledException` when the capability is disabled, which the global exception middleware translates to a 403.

4. **Bootstrap-exempt endpoints** (auth, descriptor reads, capability admin, kiosk auth) carry `[CapabilityBootstrap]` instead of `[RequiresCapability]`. Bootstrap exemption is intentionally rare — only endpoints that must remain reachable when every capability is disabled qualify.

5. **UI gating**: feature components and nav items consume `CapabilityService.isEnabled('CAP-...')` (signal-based) and either omit themselves with `@if` or use the `*appCap` structural directive. Server gate is the security boundary; UI gate is ergonomics.

6. **Smoke test for the gate** lives in `forge-api/forge.tests/Capabilities/`. Pattern: pick one representative endpoint, disable its capability, assert 403 + envelope, restore. The Phase D `CapabilityPhaseDSmokeTests.cs` is the reference.

The full design lives in `phase-4-output/4D-gating-mechanism/` (mechanism), `phase-4-output/4A-capability-catalog/` (the 129 capability codes), and `phase-4-output/PHASE-4-CLOSEOUT.md` (rollup). The catalog is the source of truth for codes; the markdown is the human mirror.

**Rule of thumb:** if you find yourself writing a new controller or feature without thinking about which capability gates it, stop. Either pick the right existing capability or add a new one. Ungated endpoints are a compliance gap on every install.

---

## 1. One Object Per File

**Angular:**
- One component, service, pipe, directive, guard, interceptor, or model per file
- No barrel files (`index.ts`) that re-export — import directly from the source file

**.NET:**
- One class, interface, enum, or record per file
- Exception: small related DTOs (request/response pair) may share a file if < 20 lines total

---

## 2. SCSS

- All components use SCSS (not CSS)
- BEM naming: `block__element--modifier` (`job-card__header--active`)
- Max 3 levels of nesting — flatten with BEM instead of deep nesting
- No `!important` unless overriding third-party styles (with a comment explaining why)

**Reuse is paramount.** Every value that appears more than once must come from a variable or mixin:

- **Global styles in `src/styles/`:**
  - `_variables.scss` — color tokens, spacing scale, typography scale, breakpoints, border radii, shadows, z-index layers, transition durations
  - `_mixins.scss` — reusable mixins (responsive breakpoints, elevation, truncation, flex/grid patterns, scrollbar styling)
  - `_reset.scss` — base resets
  - `styles.scss` — imports all partials + Angular Material theme
- **No hardcoded values:** no hex colors, no pixel spacing, no font sizes, no breakpoints, no shadows outside of variables. If a value is used in more than one place, it must be a variable.
- **Mixins over duplication:** if a pattern appears in 2+ components (e.g., card padding, responsive hide, text truncation), extract it to `_mixins.scss`
- **Component SCSS should be thin:** most styling comes from global variables, mixins, and Angular Material. Component-specific SCSS handles only layout and BEM-specific overrides.
- Before writing new styles, check if `_variables.scss` or `_mixins.scss` already provides what you need

---

## 3. File Type Suffix in All Angular Filenames

Every Angular file includes its type in the filename:

| Type | Pattern |
|---|---|
| Component | `job-card.component.ts`, `.html`, `.scss`, `.spec.ts` |
| Service | `job.service.ts` |
| Pipe | `currency-format.pipe.ts` |
| Directive | `click-outside.directive.ts` |
| Guard | `auth.guard.ts` |
| Interceptor | `http-error.interceptor.ts` |
| Model/Interface | `job.model.ts` |
| Resolver | `job-detail.resolver.ts` |
| Validator | `part-number.validator.ts` |

---

## 4. Folder Structure — shared/ vs features/

```
src/app/
  shared/               ← reusable across features
    components/         ← generic UI (confirm-dialog, error-banner, file-upload, etc.)
    services/           ← app-wide services (auth, terminology, search, notification)
    models/             ← shared interfaces, enums, types
    pipes/              ← shared pipes (terminology, date-format, etc.)
    directives/         ← shared directives
    interceptors/       ← HTTP interceptors
    guards/             ← route guards
    validators/         ← shared form validators
    utils/              ← pure helper functions
  features/             ← domain modules, lazy-loaded
    kanban/
    dashboard/
    job-detail/
    sprint-planning/
    backlog/
    leads/
    parts/
    expenses/
    time-tracking/
    assets/
    reporting/
    admin/
    notifications/
    shop-floor-display/
    production-worker/
    search/
    chat/
  core/                 ← singleton services bootstrapped once (layout, app init)
    layout/             ← shell, nav, toolbar, sidebar
  styles/               ← global SCSS partials
```

**Promotion rule:** If a component is used by 2+ features, move it to `shared/components/`. If used by only one feature, keep it in that feature's `components/` folder.

Each feature folder contains:
```
features/kanban/
  components/           ← feature-specific components
  services/             ← feature-specific services
  models/               ← feature-specific models
  kanban.component.ts
  kanban.component.html
  kanban.component.scss
  kanban.routes.ts
```

---

## 5. Naming Conventions

### Angular (TypeScript)

| Item | Convention | Example |
|---|---|---|
| Files | `kebab-case` + type suffix | `job-card.component.ts` |
| Classes | `PascalCase` + type suffix | `JobCardComponent` |
| Variables/properties | `camelCase` | `jobList`, `isLoading` |
| Observables | `camelCase` + `$` suffix | `jobs$`, `notifications$` |
| Signals | `camelCase`, no suffix | `jobs`, `isLoading` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE` |
| Enums | `PascalCase` name + members | `JobStatus.InProduction` |
| Interfaces | `PascalCase`, no `I` prefix | `Job`, `Notification` |
| CSS classes | BEM | `job-card__header--active` |

### .NET (C#)

| Item | Convention | Example |
|---|---|---|
| Files | `PascalCase` | `JobService.cs` |
| Classes/methods/properties | `PascalCase` | `JobService.GetActiveJobs()` |
| Private fields | `_camelCase` | `_jobRepository` |
| Parameters/locals | `camelCase` | `jobId`, `isActive` |
| Interfaces | `I` prefix | `IJobService` |
| Constants | `PascalCase` | `MaxRetryCount` |
| Namespaces | `Forge.{Project}.{Folder}` | `Forge.Api.Controllers` |

---

## 6. Component Structure & Template Rules

- **No inline templates** — always a separate `.component.html` file
- **No inline styles** — always a separate `.component.scss` file
- **No inline `style="..."` in templates** — all styling via CSS classes
- **Component decorator order:** `selector`, `standalone`, `imports`, `templateUrl`, `styleUrl`, `changeDetection`
- **OnPush change detection everywhere** — required for zoneless Angular with signals
- **Smart vs. dumb components:**
  - Smart (container): lives in feature folder, injects services, manages state via signals, passes data down
  - Dumb (presentational): lives in `shared/components/` or feature `components/`, `@Input`/`@Output` only, no service injection, pure rendering
- **Max template complexity:** if an `@if` block exceeds ~20 lines, extract to a child component
- **No logic in templates:** no function calls in bindings. Use signals or computed signals. `{{ getTotal() }}` is banned — use `{{ total() }}` where `total` is a computed signal.
- **Inherit where commonality dictates:** if multiple components share the same structural pattern (list page, detail page, form page), create a base component or shared layout component. Features extend or compose from these shared patterns rather than duplicating structure.

---

## 7. Service Conventions

- One service per domain concern — `JobService`, `NotificationService`, `DashboardService`
- Services are `providedIn: 'root'` (tree-shakeable singletons) unless feature-scoped
- All HTTP calls in services, never in components
- Return signals (or observables converted via `toSignal()`) — components never call `.subscribe()` directly
- Error handling at the service level — services expose an `error` signal alongside data signals
- No god services — if a service exceeds ~200 lines, split by sub-concern

---

## 8. API Conventions (.NET)

- RESTful resource naming: `/api/v1/jobs`, `/api/v1/jobs/{id}`, `/api/v1/jobs/{id}/subtasks`
- Plural nouns for collections, never verbs in URLs (except truly RPC-like: `/api/v1/jobs/{id}/archive`)
- API versioning from day one: `/api/v1/...`
- Validation via FluentValidation, not data annotations
- MediatR for CQRS: `CreateJobCommand`, `GetActiveJobsQuery`
- One controller per aggregate root — `JobsController`, `PartsController`, `NotificationsController`
- Controller methods are thin — delegate to MediatR handlers
- Consistent error responses using Problem Details (RFC 7807)
- **All endpoints require authentication by default.** `[Authorize]` attribute on the base controller or globally via policy. Only exceptions:
  - `POST /api/v1/auth/login` — login
  - `POST /api/v1/auth/register` — registration (if open registration enabled)
  - `POST /api/v1/auth/refresh` — token refresh
  - `GET /api/v1/health` — health check
  - `GET /api/v1/display/*` — shop floor display (read-only, trusted LAN)
- Role-based authorization via `[Authorize(Roles = "Admin")]` or policy-based `[Authorize(Policy = "CanApproveExpenses")]` on specific endpoints

---

## 9. Error Handling

### Angular

- HTTP errors caught in services via `catchError` — services expose an `error` signal
- Components read the error signal and display via shared `error-banner`, snackbar, or toast component
- No `try/catch` wrapping individual HTTP calls in components
- Global `HttpErrorInterceptor`:
  - 401 → redirect to login
  - 403 → access denied snackbar (bottom-center)
  - 500 → error toast (upper-right) with copy button for error details
- Form validation errors shown inline per field via Angular Material `mat-error`

### .NET

- Global exception middleware returns Problem Details (RFC 7807)
- FluentValidation errors return 400 with field-level error array
- Business logic exceptions (e.g., `JobCannotMoveBackwardException`) return 409 Conflict with human-readable message
- No `try/catch` in controllers — middleware handles everything
- Logging via Serilog: structured, contextual (request ID, user ID, entity ID)

---

## 10. Testing Conventions

### Angular — Unit

- Unit tests for services and pipes (`.spec.ts` co-located with source file)
- Component tests for smart components with meaningful logic
- No tests for trivial dumb components (just rendering inputs)
- Mock all HTTP via `provideHttpClientTesting`

### .NET — Unit & Integration

- xUnit for all tests
- Unit tests for MediatR handlers (business logic)
- Integration tests for API endpoints using `WebApplicationFactory`
- Bogus for test data generation
- Mock external services (QB, MinIO, SMTP) — never hit real services in tests
- Test project mirrors source structure: `Forge.Tests/Handlers/Jobs/CreateJobHandlerTests.cs`

### E2E — Cypress

- Cypress for end-to-end testing covering the 95% common use cases
- Test the critical user journeys, not every edge case:
  - Login / logout / role-based redirect
  - Kanban board: create card, move card, open detail, edit fields
  - Job card: add file, add subtask, link cards, view activity log
  - Planning Day: pull from backlog, commit to planning cycle, rollover
  - Dashboard: load default layout, customize widgets
  - Notifications: receive, dismiss, filter, reply
  - Expense: create, attach receipt, self-approve flow
  - Lead: create, convert to customer + job
  - Part catalog: create part, add BOM, attach file, view where-used
  - Time tracking: start/stop timer, manual entry
  - Search: global search returns results across entity types
  - Admin: create user, assign roles, system settings
  - QB integration: mock OAuth flow, sync queue behavior
- Cypress runs against the full Docker Compose stack with `MOCK_INTEGRATIONS=true`
- Tests use API seeding (not UI clicks) for test data setup — fast and reliable
- CI pipeline: unit tests → integration tests → Cypress E2E
- Cypress specs live in `forge-ui/cypress/e2e/` organized by feature:
  ```
  cypress/e2e/
    auth/
    kanban/
    job-detail/
    sprint-planning/
    dashboard/
    notifications/
    expenses/
    leads/
    parts/
    time-tracking/
    search/
    admin/
  ```
- Custom Cypress commands for common actions: `cy.login(role)`, `cy.createJob()`, `cy.seedData()`
- No `cy.wait(ms)` — use Cypress's built-in retry/assertion waiting
- Screenshot on failure for CI debugging

### E2E — Playwright (SignalR Diagnostics & Simulation)

- Playwright for multi-browser context tests (required for SignalR real-time sync verification)
- Tests in `forge-ui/e2e/tests/`, helpers in `e2e/helpers/`
- Run headless: `npm run e2e` | headed: `npm run e2e:headed`
- Config: `e2e/playwright.config.ts` — Chromium only, no webServer (assumes Docker stack running)
- Auth via API helper (`e2e/helpers/auth.helper.ts`) — sets localStorage directly, no UI login
- Seeded test users: `admin@forge.local`, `akim@forge.local` — password set via `SEED_USER_PASSWORD` env var
- `ui-actions.helper.ts`: reusable Playwright helpers (navigateTo, fillInput, fillMatSelect, fillDatepicker, clickButton)

### data-testid Conventions

- All form fields, buttons, and interactive elements in dialog/form templates must have `data-testid` attributes
- Format: `{entity}-{field}` (e.g., `data-testid="job-title"`, `data-testid="job-save-btn"`)
- Used by both Playwright simulation runner and future E2E test expansion
- Applied across: leads, expenses, kanban, quotes, POs, time tracking, chat, login

---

## 11. Git Conventions

- **Branch naming:** `feature/job-card-crud`, `fix/notification-dismiss`, `chore/update-dependencies`
- **Commit messages:** imperative mood, < 72 chars — `Add job card CRUD endpoints`, `Fix notification dismiss for non-dismissable types`
- One logical change per commit
- PR required for main (even solo — builds the habit)
- No force pushes to main

---

## 12. Import Ordering

### Angular (TypeScript)

```
1. Angular core (@angular/core, @angular/common, etc.)
2. Angular Material (@angular/material/*)
3. Third-party libraries (rxjs, three, driver.js, ngx-translate)
4. App shared imports (shared/models, shared/services, shared/components)
5. Feature-relative imports (./*, ../)
```

Blank line between each group. Enforced by ESLint import-order rule.

### .NET (C#)

```
1. System namespaces
2. Microsoft namespaces
3. Third-party namespaces (FluentValidation, MediatR, Serilog, etc.)
4. Forge namespaces
```

Enforced by `.editorconfig`.

---

## 13. Environment & Configuration

- No hardcoded URLs, secrets, or magic numbers anywhere
- Angular: `environment.ts` / `environment.prod.ts` — API base URL, mock flag, feature flags only
- .NET: `appsettings.json` / environment variables for infrastructure; `system_settings` DB table for runtime operational config
- .NET uses `IOptions<T>` pattern — strongly typed config classes, never raw `IConfiguration` reads in services
- `.env.example` committed with placeholder values; `.env` in `.gitignore`

---

## 14. Lazy Loading & Bundle Hygiene

- Every feature module is lazy-loaded via Angular route config (`loadComponent`)
- Heavy libraries loaded on demand:
  - Three.js — loaded when STL viewer is rendered (dynamic `import()`)
  - driver.js — loaded on first tour trigger
  - ng2-charts — loaded when reporting views accessed
- No feature-specific code in the main bundle — `shared/` and `core/` only
- Bundle budget in `angular.json`: warning at 500KB, error at 1MB (initial bundle)

---

## 15. Database Conventions (.NET / EF Core)

- **Table names:** `snake_case` plural — `jobs`, `track_types`, `file_metadata`
- **Column names:** `snake_case` — `created_at`, `qb_list_id`, `is_archived`
- **Primary keys:** `id` (int, auto-increment)
- **Foreign keys:** `{referenced_table_singular}_id` — `job_id`, `user_id`, `asset_id`
- **Indexes:** explicit on all foreign keys + columns used in WHERE/ORDER BY
- **Soft delete:** `deleted_at` (nullable timestamp) + `deleted_by` (FK, nullable) on all tables. No hard deletes.
  - EF Core global query filter: `entity.HasQueryFilter(e => e.DeletedAt == null)`
  - Soft-deleted records excluded from all queries by default
  - Admin can view via `.IgnoreQueryFilters()` where needed
  - Audit log captures deletion event with user and timestamp
- **Timestamps:** `created_at` and `updated_at` on all mutable tables, set via EF Core `SaveChanges` override
- **EF Core configuration:** Fluent API in separate `EntityTypeConfiguration` classes, one per entity. No data annotations on models.
- **Centralized reference data:** all lookup/dropdown values (expense categories, return reasons, lead sources, contact roles, priorities, statuses, asset types, QC dispositions) live in a single `reference_data` table with a self-referencing `group_id` for recursive grouping. Top-level rows define the group, child rows are the values. No separate lookup tables for each domain. Admin manages all reference data from one screen. Code logic references the immutable `code` field; user-facing `label` is admin-editable.

---

## 16. Angular Material Theming

- Single custom theme defined in `src/styles/` — no component-level theme overrides
- **Light and dark themes** — user-selectable via toggle in the toolbar. Preference saved per-user. System default configurable by admin.
- Light theme is the default for new users
- Theme switching via Angular Material's built-in theming system using CSS custom properties — one `@include` swap, no per-component overrides
- `_variables.scss`: all color tokens, spacing scale, typography scale, breakpoints
- Components use theme variables only — no hardcoded hex colors
- Angular Material `mat-` components used as-is — no deep CSS overrides of Material internals (fragile across upgrades). If the default doesn't fit, build a custom component.

**Admin-controlled theming (runtime, no rebuild):**
- Admin settings screen exposes 3 color pickers: **Primary**, **Accent**, **Warn**
- Colors stored in `system_settings` table — applied at runtime via CSS custom properties
- **Contrast validation**: when admin selects a color, the UI runs APCA contrast checks against background colors and warns if the combination violates WCAG 3 thresholds. Prevents saving inaccessible color choices.
- Logo and app name also configured in admin settings — uploaded logo stored in MinIO
- Font family selectable from a curated list of web-safe + Google Fonts options in admin
- Angular loads theme colors from API on app init, applies as CSS custom properties on `<html>`
- Light/dark mode inherits the admin-set palette — both themes auto-generated from the 3 base colors

**Developer-level theming (code, requires rebuild):**
- `_variables.scss` defines the full design token set (spacing scale, typography scale, breakpoints, elevation, border radius)
- Deployers who want deeper customization edit `_variables.scss` and rebuild the UI container
- README includes a "Customizing your theme" section: (1) set colors/logo in admin, (2) optionally edit `_variables.scss` for spacing/typography, (3) rebuild if code-level changes were made

---

## 17. Accessibility (WCAG 3 Compliance)

- Target: WCAG 3 (W3C Accessibility Guidelines) compliance
- All interactive elements keyboard-navigable (Angular Material handles most)
- `aria-label` on icon-only buttons
- Color contrast meets WCAG 3 thresholds (APCA-based contrast scoring for text and non-text elements)
- Form fields have associated `<mat-label>`
- No information conveyed by color alone — always pair with icon or text
- Skip-to-content link on main layout
- No custom focus styles that remove the outline — enhance, don't suppress
- Focus indicators visible in both light and dark themes
- Screen reader testing as part of E2E — key flows verified with axe-core
- Reduced motion: respect `prefers-reduced-motion` media query — disable animations when set
- Touch targets: minimum 44x44px for all interactive elements on mobile

---

## 18. SignalR Conventions

- **One hub per domain:** `BoardHub` (card moves, stage changes), `NotificationHub` (bell updates), `TimerHub` (active timers), `ChatHub` (messages, typing indicators, read receipts)
- **Method naming:** `PascalCase` server-side, `camelCase` client-side
- **Groups:** subscribe by entity — `job:{id}`, `sprint:{id}`, `user:{id}`
- **Reconnection:** Angular service handles auto-reconnect with exponential backoff
- **Optimistic UI:** card moves update locally immediately, server confirms or rolls back via SignalR
- **Connection state:** exposed as a signal — UI shows "reconnecting..." banner when disconnected

---

## 19. RESTful Routing

### Angular (UI)
All major UI states are URL-addressable and render correctly on direct navigation (deep linking). Browser back/forward navigates correctly. Route params drive data loading.

- Routes follow the pattern: `/area`, `/area/:id`, `/area/:id/sub-area`
- Sharing a URL opens the exact state — no session-dependent rendering
- Query params for filters and non-hierarchical state: `/kanban?track=production`
- Route guards protect role-restricted areas — unauthorized access redirects cleanly
- Lazy-loaded feature routes registered in each feature's `.routes.ts` file

### API (.NET)
- RESTful resource naming: `/api/v1/jobs`, `/api/v1/jobs/{id}`, `/api/v1/jobs/{id}/subtasks`
- Plural nouns for collections, no verbs in URLs except RPC-like actions (`/api/v1/jobs/{id}/archive`)
- API versioning from day one: `/api/v1/...`
- Consistent HTTP methods: GET (read), POST (create), PUT (full update), PATCH (partial), DELETE (soft delete)
- 201 Created with Location header for POST operations
- 204 No Content for successful DELETE/PUT with no body

---

## 20. HTML Template Structure

**Only use what is absolutely necessary.** Every element in a template must earn its place.

- **Minimal markup:** no wrapper `div` unless it serves a layout or styling purpose. If an element can be removed without breaking layout or semantics, remove it.
- **Semantic HTML:** use `main`, `section`, `nav`, `article`, `header`, `footer` instead of generic `div` where the content has semantic meaning
- **Angular Material provides structure:** prefer `mat-card`, `mat-toolbar`, `mat-sidenav`, `mat-list` over custom `div` equivalents
- **No inline `style="..."` in templates** — all styling via CSS classes
- **Content projection (`ng-content`)** for shared layout patterns — card shells, page layouts, form sections, dialog frames
- **`ng-template` + `ngTemplateOutlet`** for reusable template fragments within a component
- **Shared layout components** for common page structures (list page, detail page, filter bar + results, form page). Features compose from these — do not duplicate layout HTML across features.
- Template inheritance chain: shared layout component → feature layout (if needed) → feature component
- If a structural pattern appears in 3+ templates, extract it to `shared/components/`

---

## 21. C# Class Structure & Inheritance

- Use interfaces (`IJobService`, `IStorageService`) to define contracts — all services injected via interface
- Use abstract base classes for shared behavior across related implementations:
  - `BaseEntity` — shared `Id`, `CreatedAt`, `UpdatedAt`, `DeletedAt`, `DeletedBy` properties
  - `BaseAuditableEntity` — extends `BaseEntity` with `CreatedBy` tracking
  - `BaseHandler<TRequest, TResponse>` — shared MediatR handler boilerplate (logging, validation, error mapping)
  - `BaseCrudController<TEntity>` — common REST endpoints (GET list, GET by ID, POST, PUT, DELETE) with virtual methods for customization
- Use records for DTOs and value objects — immutable by default
- Favor composition over deep inheritance hierarchies — max 2 levels of class inheritance in domain models
- Generic constraints on base classes where applicable: `where T : BaseEntity`
- Integration service pattern: interface + real implementation + mock implementation (e.g., `IAiService` / `OllamaAiService` / `MockAiService`)
- Entity configuration: one `IEntityTypeConfiguration<T>` per entity, inherit from a base configuration class for common column mappings (timestamps, soft delete)
- Enum-like behavior via sealed classes or smart enums where string/int enums are insufficient

---

## 22. Static Code Analysis

Medium-level scrutiny — catch real issues without drowning in noise.

### Angular (TypeScript)
- **ESLint** with `@angular-eslint` and `@typescript-eslint` rulesets
- Rules enabled: unused variables, explicit return types on public methods, no `any` (warning), import ordering, no console.log (warning), template accessibility rules
- Rules disabled: overly pedantic formatting rules handled by Prettier
- **Prettier** for consistent formatting — runs on save and in CI
- ESLint runs in CI — warnings allowed, errors block merge

### .NET (C#)
- **.NET Analyzers** enabled at `Medium` level (`<AnalysisLevel>latest-Recommended</AnalysisLevel>`)
- **StyleCop.Analyzers** for naming and formatting consistency
- Key rules enforced: unused variables, null reference warnings (`<Nullable>enable</Nullable>`), async method naming, disposal patterns, accessibility modifiers
- `TreatWarningsAsErrors` set to `false` in development, `true` in CI release builds
- `.editorconfig` enforces formatting rules project-wide
- Code analysis runs in CI — blocks merge on errors

### Shared
- No suppression of warnings without a comment explaining why
- `// pragma warning disable` and `// eslint-disable` require adjacent explanation comments

---

## 23. CI/CD Pipeline

GitHub Actions workflow in `.github/workflows/`.

### Pipeline Stages
1. **Build** — restore, compile, lint (Angular + .NET in parallel)
2. **Unit Tests** — Vitest (Angular) + xUnit (.NET) in parallel
3. **Integration Tests** — .NET integration tests against test Postgres
4. **E2E Tests** — Cypress against Docker Compose stack with `MOCK_INTEGRATIONS=true`
5. **Docker Build** — build and tag container images
6. **Release** — push tagged images to container registry (on tagged commits)

### Workflow Files
- `ci.yml` — runs on every push and PR to main
- `release.yml` — runs on version tags, builds and pushes Docker images

### Rules
- PRs require passing CI before merge
- No `--no-verify` or skipping steps
- Test results and coverage reported as PR comments
- Failed E2E tests include Cypress screenshots as artifacts

---

## 24. Versioning & Build Scripts

Automatic semantic versioning — no manual version bumps.

- Version derived from git tags: `v1.2.3` → `1.2.3`
- CI pipeline auto-increments patch version on merge to main
- Major/minor bumps via commit message convention or manual tag
- Version injected into both Angular (`environment.ts`) and .NET (`AssemblyVersion`) at build time
- `scripts/build.sh` (Linux/macOS/CI) and `scripts/build.bat` (Windows) for local builds:
  - Reads version from git tags
  - Builds Angular production bundle
  - Builds .NET API
  - Tags Docker images with version
- `scripts/version.sh` / `scripts/version.bat` — prints current version from git
- Docker images tagged with both version number and `latest`
- Version displayed in the UI footer and API health endpoint

---

## 25. Angular Client-Side Storage & Auth

### Storage Strategy

- **IndexedDB** (via a lightweight wrapper service) for lookup data caches: customers, vendors, items, track types, stages, parts, assets, terminology, tour definitions. These are reference data that changes infrequently but is read constantly. Cache with `last_synced` timestamp, refresh on app init and periodically.
- **localStorage** for simple key-value data: JWT access token, refresh token, user preferences (theme mode, locale, last-viewed dashboard), sidebar collapsed state. Keep it minimal — no large objects.
- **Session state (in-memory signals)** for transient UI state: current filters, scroll positions, form drafts. Lost on tab close, which is fine.
- **No sensitive data in localStorage** beyond auth tokens. Tokens are short-lived (access) or rotated (refresh).

### Auth Token Handling

- `AuthService` manages login, logout, token storage, and refresh
- JWT access token stored in `localStorage`, attached to every API request via `AuthInterceptor`
- `AuthInterceptor` (HTTP interceptor):
  - Appends `Authorization: Bearer <token>` header to all API requests
  - On 401 response: attempts silent token refresh via refresh token
  - If refresh fails: clears tokens, redirects to login
  - Queues concurrent requests during refresh to avoid duplicate refresh calls
- Refresh token rotation: each refresh returns a new refresh token, old one is invalidated
- On logout: clear all tokens from localStorage, clear IndexedDB caches, redirect to login
- `AuthGuard` checks token presence and expiry before activating protected routes

### Lookup Data Caching

- `CacheService` wraps IndexedDB with typed get/set/clear methods
- Each domain service checks cache first, falls back to API, updates cache on response
- Cache invalidation: on app init (background refresh), on SignalR push for relevant entity changes, on manual "refresh" action
- Stale cache is usable — never show a blank screen because cache is expired. Show cached data immediately, refresh in background.

---

## 26. Print Support

Manufacturing shops print constantly — labels, work orders, packing slips, inspection reports. The app must support clean printing across all major views.

### Browser Print (`@media print`)
- Global `_print.scss` partial with `@media print` rules: hide nav, toolbar, sidebar, chat popover, notification panel, and all interactive controls (buttons, filters, dropdowns)
- Show only the content area at full width, black text on white background
- Page break hints via `break-before`, `break-after`, `break-inside: avoid` on card boundaries, table rows, and section headers
- Every list view and detail view must be print-testable — Cypress E2E includes a print-layout snapshot test for critical screens

### Printable Views
- **Job card detail** — full card with specs, subtasks, activity log, custom fields
- **Work order sheet** — simplified one-page job summary for shop floor (part, qty, material, machine, operator, due date)
- **Packing slip** — customer, job, line items, quantities, ship-to address
- **QC inspection report** — production run details, checklist results, disposition, inspector
- **QR/barcode labels** — lot tracking labels (bwip-js), asset tags (angularx-qrcode), generated at configurable label sizes
- **Part spec sheet** — part details, BOM, revision, material, key dimensions
- **Expense report** — filtered expense list with totals, receipt thumbnails

### PDF Generation (Server-Side)
- QuestPDF on the .NET backend for downloadable/emailable PDF versions of the above
- API endpoint: `GET /api/v1/jobs/{id}/pdf?type=work-order` (or `packing-slip`, `qc-report`, etc.)
- PDFs match the print layout styling — same information, formatted for PDF
- QR codes embedded in PDFs via QuestPDF's image support

### Shared Print Component
- `PrintLayoutComponent` in `shared/components/` — wraps content in a print-optimized container
- "Print" button on applicable screens triggers `window.print()` with the print layout active
- "Download PDF" button calls the API endpoint and downloads the file

---

## 27. Pagination Strategy

### API (Server-Side)
- **Offset-based pagination** for standard list endpoints: `?page=1&pageSize=25&sort=createdAt&order=desc`
- Default page size: 25. Maximum: 100. Configurable per endpoint if needed.
- Response envelope:

```json
{
  "data": [...],
  "page": 1,
  "pageSize": 25,
  "totalCount": 342,
  "totalPages": 14
}
```

- **Cursor-based pagination** for real-time feeds (chat messages, activity logs, notifications): `?cursor=eyJ...&limit=50`
- Cursor is an opaque token (base64-encoded ID + timestamp). No page numbers — only "load more" / infinite scroll.
- All list endpoints support `sort` and `order` params. Default sort is `created_at desc` unless the domain dictates otherwise (e.g., backlog uses `backlog_position`).
- Filter params are query string: `?status=active&assignedTo=5&dueBefore=2026-04-01`

### Angular (Client-Side)
- Small datasets (< 100 items, e.g., reference data, team members): load all, filter/sort client-side
- Medium datasets (100-1000, e.g., parts, assets): server-side pagination with Angular Material `mat-paginator`
- Large / unbounded datasets (chat, activity, notifications): cursor-based infinite scroll via CDK `ScrollingModule` virtual scroll
- `PaginatedDataSource<T>` shared class wraps the API pagination contract — handles page tracking, sort, filter, loading state. Reused across all paginated views.

---

## 28. Loading & Progress Indication

### Global Loading Overlay
- `LoadingService` (singleton) manages a queue of active loading causes
- Each loading cause is registered with: a unique key, a display message, and a trigger (Observable, Promise, Signal, or manual boolean)
- The overlay appears when 1+ causes are active, blocks all user interaction (modal overlay with semi-transparent backdrop). The main app content container is marked with the HTML `inert` attribute while the overlay is active — this disables all interaction, tab focus, and screen reader access on the underlying UI. Toast notifications remain outside the `inert` container so errors are still visible and copyable during loading.
- **Animated spinner** — a subtle pulsing/spinning indicator centered on screen to communicate progress
- **Message stack** — each active cause displays its message in a vertical list below the spinner
- **Independent dismissal** — when a cause resolves (Observable completes, Promise settles, Signal becomes false, or manual dismiss), its message slides off independently with a 300ms fade-out. Other messages remain.
- **Soft transitions** — overlay fades in over 300ms on first cause, fades out over 300ms when last cause resolves. No jarring pop-in/pop-out.
- **Minimum display time** — overlay stays visible for at least 400ms to avoid flicker on fast operations
- Usage: `this.loading.track('Loading jobs...', this.jobService.getJobs())` — automatically starts on subscribe, clears on complete/error

### Component-Level Loading
- `LoadingBlockDirective` (`*appLoading="isLoading"`) — blocks a specific component or section with a local spinner overlay
- Same soft fade in/out (300ms) as the global overlay
- Local spinner is smaller, positioned within the component bounds
- Use for: individual cards loading, form sections refreshing, file upload progress on a single item
- Prefer the global overlay for page-level loads (navigation, initial data fetch). Use local blocking for partial refreshes within an already-loaded page.

### Empty States
- Every list view has a designed empty state — not just blank space
- Empty state includes: an icon or illustration, a short message ("No jobs match your filters"), and a call-to-action button where applicable ("Create your first job")
- Empty states are shared components: `EmptyStateComponent` with configurable icon, message, and action

### Skeleton Screens
- Not required for initial implementation — the global and local loading indicators handle perceived performance
- Consider adding skeleton screens in a later phase for high-traffic views (dashboard, Kanban board) if loading times exceed 1 second

---

## 29. Snackbar & Toast Notifications

Two distinct notification systems for user feedback. Both dismissable. Both use Angular CDK overlay positioning.

### Snackbar (Bottom Center)
- Uses Angular Material `MatSnackBar` with custom `SnackbarComponent`
- Position: bottom-center, above any FABs or bottom nav
- **Use for:** brief confirmations (save, delete, status change), simple warnings
- Single snackbar at a time — new one replaces previous
- Auto-dismiss: 4s for info/success, no auto-dismiss for errors
- **Creation navigation:** when an action creates a new entity, include an action button ("View Job", "Open Part") that navigates to the new item. Use `router.navigate()` for same-tab navigation. Use `window.open()` for new-tab when user should stay on current page (e.g., during bulk operations).
- `SnackbarService` wraps `MatSnackBar` with convenience methods: `.success(msg)`, `.error(msg)`, `.info(msg)`, `.successWithNav(msg, route)`

### Toast (Upper Right)
- Custom `ToastComponent` managed by `ToastService` (singleton)
- Position: upper-right corner, 16px from top and right edges
- **Use for:** detailed errors with stack traces, API error details, sync conflicts, multi-line status messages
- **Copy button** on every toast — copies full content (message + details) to clipboard via `navigator.clipboard.writeText()`
- Stackable: multiple toasts stack vertically, 8px gap, newest on top, max 5 visible (oldest auto-dismissed when exceeded)
- Severity levels with distinct styling:
  - `info` — blue left border, info icon
  - `success` — green left border, check icon
  - `warning` — amber left border, warning icon, auto-dismiss 12s
  - `error` — red left border, error icon, **no auto-dismiss**
- Default auto-dismiss: info/success 8s, warning 12s, error never
- `ToastService` API: `.show({ severity, title, message, details?, autoDismissMs? })`

### Z-Index Scale
All z-index values defined in `_variables.scss` — never hardcode z-index values in component styles:

```scss
$z-index-base: 0;
$z-index-sticky: 100;      // table headers, toolbars
$z-index-sidebar: 200;     // navigation drawer
$z-index-dropdown: 300;    // mat-select, context menus
$z-index-dialog: 400;      // Angular Material dialogs
$z-index-snackbar: 500;    // bottom-center snackbar
$z-index-loading: 900;     // global loading overlay
$z-index-toast: 1000;      // upper-right toast stack (highest)
```

Toast is always the topmost layer — errors remain visible and copyable even during loading overlay.

### When to Use Which
- **Snackbar:** "Job saved." / "Part created. [View Part]" / "File uploaded."
- **Toast (info):** "3 pending changes synced successfully."
- **Toast (warning):** "Accounting sync delayed — retrying in 30 seconds."
- **Toast (error):** "Failed to create invoice. Error: QB API returned 429 Rate Limit Exceeded. [Copy] [X]"

---

## 30. Offline Resilience

- **Service worker** via `@angular/service-worker` — caches the app shell (HTML, JS, CSS, assets) for instant load even when offline
- **IndexedDB cache** (Standard #25) serves as the offline data layer — last-known state is always available
- **Offline banner** — when the browser loses connectivity, a persistent banner appears: "You are offline. Changes will sync when reconnected."
- **Action queue** — actions taken while offline (card moves, time entries, chat messages, form submissions) are queued in IndexedDB. When connectivity returns, the queue drains automatically in order. Conflicts resolved by last-write-wins (same as SignalR).
- **Shop floor display resilience** — the shop floor display must remain visible and useful when the network drops. The last-known state is displayed with a "Last updated: X minutes ago" timestamp.
- **Graceful degradation priority:** read-only views degrade smoothly (cached data). Write operations queue and retry. Features requiring real-time data (chat, live board sync) show a reconnecting state.
- **No full offline-first architecture** — the app is designed for primarily-connected use. Offline resilience handles brief network interruptions, not extended offline periods.

### Disconnection UX
- **Immediate notification** — when the SignalR connection drops or HTTP requests fail due to network, a persistent banner appears: "Connection lost. Changes will be saved and sent when reconnected."
- **Continued operation** — users can continue working. Write operations (card moves, time entries, form submissions, chat messages) are queued in IndexedDB with timestamps and operation type.
- **Queue visibility** — a small badge/counter on the offline banner shows how many pending operations are queued. Users can tap to see the list.
- **Reconnection prompt** — when the server becomes reachable again, the banner updates: "Connection restored. Sending X pending changes..." with a progress indicator as the queue drains.
- **Conflict notification** — if any queued operation fails on sync (e.g., entity was deleted or modified by someone else), a non-dismissable notification explains what happened and offers resolution options (retry, discard, review).
- **No silent data loss** — queued operations are never silently discarded. If the queue can't drain (persistent errors), the user is prompted to review and decide per-item.

---

## 31. Security Headers

### Content Security Policy (CSP)
- CSP headers set by the .NET API middleware and/or Nginx in the UI container
- `default-src 'self'` — only allow resources from the same origin by default
- `script-src 'self'` — no inline scripts, no `eval()`. Angular AOT compilation means no runtime script generation.
- `style-src 'self' 'unsafe-inline'` — Angular Material requires some inline styles (investigate `nonce`-based approach to tighten)
- `img-src 'self' data: blob:` — allow inline images (base64 thumbnails) and blob URLs (file previews)
- `connect-src 'self' wss:` — allow API calls and WebSocket (SignalR) connections to same origin
- `font-src 'self'` — fonts served from the app (or configured Google Fonts origin if admin selects one)
- `frame-ancestors 'none'` — prevent embedding in iframes (clickjacking protection)

### Other Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(self), microphone=()` — camera allowed for receipt photo capture
- `Strict-Transport-Security` (HSTS) enabled in production when serving over HTTPS

### HTTPS
- Production deployments should terminate TLS at the reverse proxy (Nginx) or load balancer
- `docker-compose.yml` includes an optional Nginx TLS configuration with Let's Encrypt / self-signed cert support
- API enforces HTTPS redirect in production (`app.UseHttpsRedirection()`)

---

## 32. Multi-Tab Handling

- **Auth sync across tabs** — `localStorage` storage events propagate auth state changes. Logout in one tab triggers logout in all tabs via a `BroadcastChannel` or `storage` event listener in `AuthService`.
- **SignalR connection management** — each tab opens its own SignalR connection. This is acceptable for small team sizes (< 50 concurrent users). If connection count becomes a concern, implement a `SharedWorker` to multiplex one connection across tabs.
- **Theme sync** — theme mode changes in one tab propagate to others via `storage` event on the `themeMode` localStorage key
- **Optimistic UI conflicts** — if two tabs modify the same entity, SignalR broadcasts resolve the conflict (last-write-wins, same as multi-user). No special per-user tab conflict handling needed.
- **Cache writes** — IndexedDB writes from one tab are visible to other tabs (IndexedDB is shared per origin). No extra sync needed for cached data.

---

## 33. UX & Visual Design

Designed for machinists, shop floor workers, and non-technical users. Every interface must be usable by someone with dirty gloves and no software training.

### Navigation
- **Large, clear, unambiguous navigation** — every nav item has an icon AND a text label. No icon-only nav items in the sidebar.
- **Touch-friendly** — all nav targets at least 44x44px (aligns with WCAG 3 touch target requirement in Standard #17)
- **No ambiguous UI patterns** — avoid hamburger menus on desktop. Sidebar is always visible (collapsible but not hidden). Mobile collapses to bottom nav or slide-out with large tap targets.
- **Clear visual hierarchy** — active page highlighted in sidebar, breadcrumbs on detail views
- **No deep nesting** — maximum 2 levels of navigation depth. If a feature needs sub-pages, use tabs within the page, not sub-menu trees.

### Visual Style
- **Less rounded** — default `border-radius: 4px` across the app. No pill-shaped buttons, inputs, or containers. Angular Material chips are the exception (retain their rounded shape as they are a distinct element type).
- Cards, dialogs, inputs, buttons, toolbars: `4px` border radius (set as `$border-radius-default` in `_variables.scss`)
- FABs (floating action buttons): retain their circular shape (Material standard)
- **Polished, professional, industrial aesthetic** — clean lines, deliberate whitespace, no decorative elements

### Layout
- **Centered content on large screens** — content area has a `max-width` (e.g., `1400px`) and is centered horizontally. No full-bleed layouts that stretch text across ultra-wide monitors.
- Exception: Kanban board and shop floor display use full width (horizontal scrolling boards benefit from it)
- **Minimal global margin and padding** — lean spacing that maximizes usable screen area without feeling cramped. Use the spacing scale in `_variables.scss` (`$spacing-xs` through `$spacing-xl`) — default to the smaller end.
- **Dense but readable** — tables, lists, and forms use compact row heights. Generous padding reserved for primary action areas (card headers, form submit sections, modal footers).
- **Responsive breakpoints** — mobile-first, but the primary target is desktop/tablet in a shop environment. Mobile is secondary but functional.

### Spacing Philosophy
- Padding inside components: tight (`$spacing-sm` / `8px` default)
- Margin between components: minimal (`$spacing-md` / `12-16px` default)
- Section gaps: moderate (`$spacing-lg` / `24px` default)
- Page-level padding: slim (`$spacing-md` on mobile, `$spacing-lg` on desktop)
- No double-padding situations — if a card is inside a container, only one gets padding, not both

---

## 34. Shared Component Library

All shared components live in `src/app/shared/components/`. These are the building blocks that every feature composes from — minimizing per-feature HTML, enforcing consistent behavior, and centralizing user preferences.

### Data Table (`AppDataTableComponent`)

A fully configurable, reusable table that replaces all one-off `mat-table` instances. Every table in the app uses this component.

**Features:**
- **Column configuration** — consumer defines available columns via a `ColumnDef[]` input (field key, header label, cell template, sortable flag, filterable flag, data type, default width, default visibility)
- **User-configurable columns** — gear icon (upper-right corner of table) opens a column management panel: checkboxes to show/hide columns, drag-to-reorder, "Reset to Default" button restores the original column set and order
- **Sorting** — click column header to sort (asc → desc → none). Sort indicator icon in header. Multi-column sort via Shift+Click.
- **Per-column filtering** — filter icon in each column header opens an inline filter popover. Filter type adapts to data type: text search for strings, range for numbers/dates, multi-select checkboxes for enums/reference data. Active filters show a badge on the column header.
- **Draggable columns** — drag column headers to reorder via CDK drag-drop
- **Resizable columns** — drag column border to resize. Double-click border to auto-fit content width.
- **Row selection** — optional checkbox column for multi-select. Exposes `selectionChange` output with selected row data. Select-all checkbox in header.
- **Pagination** — integrates `mat-paginator`. Page size options configurable. Connects to `PaginatedDataSource<T>` (Standard #27).
- **Empty state** — displays `EmptyStateComponent` when no data matches filters
- **Loading state** — integrates `LoadingBlockDirective` during data fetch
- **Preference persistence** — each table instance has a unique `tableId` input (string). Column visibility, order, widths, sort state, page size, and active filters are saved to the user preferences API under this key. On load, preferences are restored. "Reset to Default" clears the stored preference.

**Usage pattern:**
```html
<app-data-table
  tableId="parts-list"
  [columns]="partColumns"
  [dataSource]="partsDataSource"
  [selectable]="true"
  (selectionChange)="onPartsSelected($event)"
  (rowClick)="openPartDetail($event)">
</app-data-table>
```

**Column definition:**
```typescript
const partColumns: ColumnDef[] = [
  { field: 'partNumber', header: 'Part #', sortable: true, filterable: true, type: 'text' },
  { field: 'description', header: 'Description', sortable: true, filterable: true, type: 'text' },
  { field: 'status', header: 'Status', sortable: true, filterable: true, type: 'enum', filterOptions: partStatuses },
  { field: 'updatedAt', header: 'Last Modified', sortable: true, filterable: true, type: 'date', visible: false },
];
```

### Form Field Wrappers

Shared wrapper components that encapsulate Angular Material form field boilerplate (floating label, `mat-form-field`, hint, error wiring). Consumers pass minimal inputs — the wrapper handles structure.

**`AppInputComponent`** — wraps `mat-form-field` + `mat-input`:
```html
<app-input label="Part Number" formControlName="partNumber" hint="e.g., PN-001"></app-input>
```
Inputs: `label`, `type` (text/number/email/password), `hint`, `placeholder`, `prefix`, `suffix`, `formControlName` or `[formControl]`, `readonly`, `maxlength`

**`AppSelectComponent`** — wraps `mat-form-field` + `mat-select`:
```html
<app-select label="Status" formControlName="status" [options]="statusOptions"></app-select>
```
Inputs: `label`, `options` (array of `{ value, label }`), `multiple` (bool), `formControlName` or `[formControl]`, `placeholder`

**`AppAutocompleteComponent`** — wraps `mat-form-field` + `mat-autocomplete`:
```html
<app-autocomplete label="Customer" formControlName="customerId" [options]="customers$" displayField="name"></app-autocomplete>
```
Inputs: `label`, `options` (array or Observable), `displayField` (string — property to display), `valueField` (string — property to use as value), `formControlName` or `[formControl]`, `placeholder`, `minChars` (minimum characters before filtering, default 1)

**`AppTextareaComponent`** — wraps `mat-form-field` + `textarea`:
```html
<app-textarea label="Notes" formControlName="notes" [rows]="4"></app-textarea>
```
Inputs: `label`, `rows`, `maxlength`, `hint`, `formControlName` or `[formControl]`

**`AppDatepickerComponent`** — wraps `mat-form-field` + `mat-datepicker`:
```html
<app-datepicker label="Due Date" formControlName="dueDate"></app-datepicker>
```
Inputs: `label`, `min`, `max`, `formControlName` or `[formControl]`

**`AppToggleComponent`** — wraps `mat-slide-toggle` with label:
```html
<app-toggle label="Auto-reorder enabled" formControlName="autoReorderEnabled"></app-toggle>
```

All form field wrappers:
- Use floating label structure (Angular Material default)
- Implement `ControlValueAccessor` for seamless reactive form integration
- Accept `formControlName` or `[formControl]` — no two-way binding with `ngModel`
- Propagate disabled state from the parent form group
- Do NOT display inline validation errors (see Standard #35)

### Confirmation Dialog (`ConfirmDialogComponent`)

Shared dialog for all destructive or significant actions. Replaces ad-hoc `confirm()` calls.

```typescript
this.dialog.open(ConfirmDialogComponent, {
  data: { title: 'Archive Job?', message: 'This will remove the job from the board.', confirmLabel: 'Archive', severity: 'warn' }
});
```

Inputs via `MAT_DIALOG_DATA`: `title`, `message`, `confirmLabel` (default "Confirm"), `cancelLabel` (default "Cancel"), `severity` ('info' | 'warn' | 'danger' — colors the confirm button).

### Entity Picker (`EntityPickerComponent`)

Reusable typeahead search + select for any entity (customer, user, part, job, vendor, asset).

```html
<app-entity-picker label="Assign To" entityType="user" formControlName="assignedTo" [filters]="{ role: 'Engineer' }"></app-entity-picker>
```

Inputs: `label`, `entityType` (string — maps to an API search endpoint), `formControlName` or `[formControl]`, `displayField`, `filters` (object — additional query params), `multiple` (bool), `placeholder`

Internally uses `mat-autocomplete` with debounced API search. Shows entity avatar/icon in dropdown.

### File Upload Zone (`FileUploadZoneComponent`)

Drag-and-drop file upload area with preview thumbnails.

```html
<app-file-upload-zone entityType="job" [entityId]="jobId" [accept]="'.pdf,.step,.stl'" [maxSizeMb]="50" (uploaded)="onFileUploaded($event)"></app-file-upload-zone>
```

Inputs: `entityType`, `entityId`, `accept` (MIME/extension filter), `maxSizeMb`, `multiple` (bool, default true)
Outputs: `uploaded` (emits file metadata after successful upload)

Features: drag-and-drop zone, click-to-browse fallback, file type validation, size validation, upload progress bar per file, thumbnail preview for images, file icon for non-images.

### Status Badge (`StatusBadgeComponent`)

Consistent status indicator used across all entity types.

```html
<app-status-badge [status]="job.status" entityType="job"></app-status-badge>
```

Maps status values to colors and labels via reference data. Renders as a compact chip with colored dot + text.

### Page Layout Shell (`PageLayoutComponent`)

Standard page layout that enforces the layout rules (Standard #36). Every feature page wraps in this.

```html
<app-page-layout pageTitle="Parts Catalog">
  <ng-container toolbar>
    <button mat-button (click)="createPart()">New Part</button>
  </ng-container>

  <ng-container content>
    <!-- scrollable content area -->
    <app-data-table ...></app-data-table>
  </ng-container>

  <ng-container actions>
    <button mat-button (click)="cancel()">Cancel</button>
    <button mat-flat-button color="primary" (click)="save()">Save</button>
  </ng-container>
</app-page-layout>
```

Sections: `toolbar` (optional — page-level actions, filters), `content` (scrollable body), `actions` (optional — sticky footer with action buttons, right-aligned, primary action furthest right).

### Detail Side Panel (`DetailSidePanelComponent`)

Slide-out panel from the right edge for viewing/editing entity details without full navigation.

```html
<app-detail-side-panel [open]="panelOpen" (closed)="panelOpen = false" title="Job #1042">
  <ng-container content>...</ng-container>
  <ng-container actions>...</ng-container>
</app-detail-side-panel>
```

Features: slides in from right, 400px default width (responsive), close button + Escape key dismissal, backdrop click closes, header with title always visible, scrollable content, sticky action footer.

### Avatar (`AvatarComponent`)

User avatar with initials fallback.

```html
<app-avatar [user]="assignedUser" [size]="'sm'"></app-avatar>
```

Inputs: `user` (object with `displayName` and optional `avatarUrl`), `size` ('xs' | 'sm' | 'md' | 'lg')
Renders: circular avatar image if available, otherwise colored circle with initials derived from display name. Color deterministic from user ID.

### Toolbar (`ToolbarComponent`)

Standardized toolbar for filter bars, search bars, and action groups within a page section.

```html
<app-toolbar>
  <app-input label="Search..." formControlName="search" prefix="search_icon"></app-input>
  <app-select label="Status" formControlName="statusFilter" [options]="statuses"></app-select>
  <span spacer></span>
  <button mat-flat-button color="primary" (click)="create()">New Job</button>
</app-toolbar>
```

Features: horizontal flex layout, items left-aligned by default, `spacer` directive pushes subsequent items to the right, responsive wrap on narrow screens.

### Date Range Picker (`DateRangePickerComponent`)

Two-date picker for filtering date ranges.

```html
<app-date-range-picker label="Date Range" formControlName="dateRange" [presets]="['Today', 'This Week', 'This Month', 'Last 30 Days']"></app-date-range-picker>
```

Inputs: `label`, `formControlName` or `[formControl]`, `presets` (array of preset label strings with mapped date logic), `min`, `max`
Value: `{ start: Date, end: Date }`

---

## 35. Validation Pattern

**No inline validation errors.** Form fields do NOT display `mat-error` beneath them. Instead, validation is communicated through the submit/action button.

### How It Works

1. **Submit button disables** when the form is invalid (`[disabled]="form.invalid"`)
2. **Hover popover on disabled button** — when the user hovers over the disabled submit button, a popover (Angular Material `matTooltip` or CDK overlay) displays a bulleted list of all current validation violations (e.g., "Part Number is required", "Quantity must be greater than 0")
3. **Live revalidation** — every time any form field value changes, validation re-runs and the violation list updates. If all violations are resolved, the button enables immediately.
4. **Final validation gate** — on button click (when enabled), the service performs one final validation pass before executing the action. If validation fails (e.g., async validator, server-side check), errors display via toast.
5. **Field highlighting** — invalid fields get a subtle visual indicator (e.g., red-tinted border via CSS class) so the user can locate the problem field, but no error text is rendered inline beneath the field.

### Implementation

- `FormValidationService` — takes a `FormGroup`, returns a `Signal<string[]>` of human-readable violation messages. Derives messages from Angular validators + custom validator metadata.
- `ValidationPopoverDirective` — applied to the submit button. Reads the violation messages signal and renders the popover on hover/focus.
- Custom validators set a `validationMessage` key in their error object: `Validators.min(1)` → override via wrapper to produce `{ min: { message: 'Quantity must be at least 1' } }`
- Each form field wrapper (Standard #34) contributes its `label` to the message generation so violations read naturally: "{Label} is required", "{Label} must be at least {min}".

### Async / Server-Side Validation
- Async validators (e.g., unique part number check) integrate into the same violation list. While async validation is pending, the button shows a spinner icon and remains disabled.
- Server-side validation errors (400 response with field errors) are mapped to toast notifications since the form was already client-valid.

---

## 36. Layout Rules

Consistent layout structure across all pages. Enforced via `PageLayoutComponent` (Standard #34) and global SCSS.

### Page Structure
- **Header** — remains static (sticky top). Contains page title, breadcrumbs, and optional toolbar/filter bar.
- **Footer / Action Bar** — remains static (sticky bottom). Contains action buttons (Save, Cancel, Submit, etc.).
- **Content Area** — between header and footer. **Scrollable.** All content scrolls within this bounded area. The browser scrollbar applies to this zone, not the full page.
- Page chrome (app header, sidebar, page header, action bar) **never scrolls** — only the content area scrolls.

### Button Placement
- Action buttons always in the **lower-right corner** of the page or dialog.
- When multiple buttons exist, the **primary/most-used action** (Save, Submit, Upload) is **furthest to the right**.
- Secondary actions (Cancel, Reset) are to the left of the primary.
- Destructive actions (Delete, Archive) are separated with extra spacing or placed on the far left of the button group.
- Button order (left to right): `[Destructive]` — gap — `[Secondary]` `[Primary]`

### Card & Panel Headers
- Card headers must be **compact** — single line with title and optional action icon(s). No multi-line card headers.
- Card headers are **always visible** — they do not scroll away with card content. Card body scrolls independently if content overflows.
- Panel/section headers use the same compact pattern.

### Scroll Minimization
- **Horizontal scrolling is prohibited** on all views except the Kanban board (which scrolls horizontally by design for stage columns) and data tables with many columns (which provide horizontal scroll with sticky first column).
- **Vertical scrolling** is acceptable in the content area but should be minimized through:
  - Dense, compact layouts (tight spacing from Standard #33)
  - Collapsible sections for secondary information
  - Tabs for grouping related content instead of stacking vertically
  - Side panels for detail views instead of navigating to a new page
  - Summary/expand patterns for lists with detail

### Dialog Layout
- Dialogs follow the same pattern: static title bar, scrollable content, sticky action footer with buttons right-aligned.
- Dialog width: small (400px), medium (600px), large (800px) — set via the dialog config, not ad-hoc.
- No full-screen dialogs — use a page or side panel instead.

### Responsive Behavior
- On narrow screens (< 768px): action bar moves to bottom of screen (fixed), content area adjusts. Side panels become full-width overlays.
- On medium screens (768px–1200px): content area respects `max-width`, sidebar collapsible.
- On wide screens (> 1200px): content centered with `max-width: 1400px` (Standard #33 exception: Kanban and shop floor use full width).

---

## 37. User Preferences Schema

Centralized storage for all per-user UI settings. Preferences are synced to the server and restored on login from any device.

### API Endpoints
- `GET /api/v1/user-preferences` — returns all preferences for the authenticated user
- `PATCH /api/v1/user-preferences` — merges partial updates into stored preferences
- `DELETE /api/v1/user-preferences/{key}` — resets a specific preference to default

### Preference Categories

| Category | Key Pattern | Example | Storage |
|---|---|---|---|
| Table config | `table:{tableId}` | `table:parts-list` | Column visibility, order, widths, sort, page size, filters |
| Theme | `theme:mode` | `theme:mode` | `"light"` or `"dark"` |
| Sidebar | `sidebar:collapsed` | `sidebar:collapsed` | `true` / `false` |
| Dashboard | `dashboard:layout` | `dashboard:layout` | Widget positions, sizes, settings (JSON) |
| Locale | `locale:language` | `locale:language` | `"en"`, `"es"`, etc. |
| Notifications | `notify:{type}` | `notify:assignment` | `"in-app"` / `"in-app+email"` / `"off"` |
| Default views | `default:{area}` | `default:kanban-track` | Last-selected track type on board |

### Client-Side
- `UserPreferencesService` (singleton) loads all preferences on app init, caches in memory as a signal-based map
- Components read preferences reactively: `this.prefs.get<TableConfig>('table:parts-list')`
- Components write preferences with debounced save: `this.prefs.set('table:parts-list', config)` — debounces 1 second before PATCH to API
- Preferences are merged (PATCH), not replaced — updating one table config doesn't affect others
- Default values are defined in code — preferences only store overrides
