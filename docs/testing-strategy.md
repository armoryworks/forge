# Testing Strategy

> Practical testing plan for Forge. Solo developer, limited resources — maximize coverage per hour invested.

---

## 1. Testing Pyramid

```
         /  E2E  \          5 critical flows (Playwright)
        /  Smoke  \         API smoke + contract drift (Playwright)
       / Integration\       MediatR handlers against real DB (xUnit)
      /  Component   \      Smart components with logic (Vitest)
     /    Unit Tests   \    Services, pipes, computed logic (Vitest)
    /  Seed Startup Test \  Free — app won't start if entities are broken
```

| Layer | Tool | Count Target | Run Time |
|-------|------|-------------|----------|
| Unit | Vitest | 651+ | < 30s |
| Component | Vitest | ~50 | < 15s |
| Integration | xUnit + WebApplicationFactory | ~100 | < 60s |
| API Smoke | Playwright | Auto-generated | < 30s |
| Contract Drift | Node script | Auto-generated | < 5s |
| Critical Flows | Playwright | 5 | < 2 min |

---

## 2. What We Test (High ROI)

### API Smoke Tests

Auto-generated from controller files. Hits every parameterless GET endpoint as an authenticated admin user. Catches broken routes, missing DI registrations, serialization failures, and startup crashes.

- **Source**: Scans `forge.api/Controllers/` for `[HttpGet]` attributes without required route parameters
- **Auth**: Logs in as `admin@forge.local`, uses JWT for all requests
- **Pass criteria**: Response is not 500. 401/403/404 are acceptable (means the route exists and the handler ran)
- **Run**: `npm run test:api-smoke` from `forge-ui/`

This single test catches the majority of backend regressions: missing service registrations, broken entity configurations, null reference exceptions in handlers, and serialization cycles.

### Contract Drift Detection

Cross-references Angular service HTTP URLs with backend controller routes. Catches renamed or removed endpoints before users hit 404s.

- **Source**: Parses `*.service.ts` files for `this.http.get/post/put/patch/delete()` URL patterns, parses `*Controller.cs` files for `[Route]` + `[Http*]` attributes
- **Output**: List of frontend URLs with no matching backend route
- **Run**: `npm run test:contract-drift` from `forge-ui/`

No test framework needed — this is a Node script that reads files and compares strings. Fast, zero flakiness.

### Critical User Flows (5 E2E Tests)

These are the paths that break a user's day if they fail:

1. **Login to dashboard** — Auth flow, token storage, initial data load, dashboard widgets render
2. **Kanban board** — Load board, view job detail, verify cards render in columns
3. **Create job** — Open dialog, fill form, submit, verify job appears on board
4. **Parts catalog** — Load parts list, search/filter, open part detail
5. **Time tracking** — Clock in, start timer on job, stop timer, verify time entry created

Each test runs against the full Docker Compose stack. Auth via API helper (no UI login except test #1).

- **Run**: `npm run test:critical-flows` from `forge-ui/`
- **Config**: `e2e/playwright.config.ts`

### Pre-Commit Hook

Runs Vitest + .NET build before every commit. Catches compile errors and unit test regressions at the cheapest possible point — before the code leaves your machine.

```bash
# Activate (one-time):
git config core.hooksPath .githooks

# What it runs:
# 1. npx vitest run --reporter=dot (Angular unit tests)
# 2. dotnet build forge-api/forge.sln --no-restore (compile check)
# Blocks commit on failure.
```

Config: `.githooks/pre-commit`

### Seed-as-Integration-Test

The application seeds demo data on startup (`SeedData.cs`). This exercises:

- Every entity's EF Core configuration (column mappings, FK constraints, indexes)
- Every enum value's database representation
- Every required relationship (FK integrity)
- `AppDbContext` conventions (snake_case, timestamps, soft-delete filters)

If seeding crashes, the app won't start. This is a free integration test that runs every time you `docker compose up`. No maintenance cost.

---

## 3. What NOT to Test (Low ROI)

### Trivial Dumb Components

Components that just project `input()` values to a template with no computed logic, no conditional rendering, no service calls. The shared wrapper components (`<app-input>`, `<app-select>`, etc.) are already tested — don't re-test them through every consumer.

### Material Component Behavior

Don't test that `mat-select` opens a dropdown, that `mat-datepicker` shows a calendar, or that `mat-slide-toggle` toggles. Angular Material has its own test suite.

### Simple CRUD Handlers

If a MediatR handler is just:
```csharp
db.Parts.Add(entity);
await db.SaveChangesAsync(ct);
return entity.Id;
```

The API smoke test already proves this works. Write an integration test only when the handler has business logic (validation rules, state transitions, side effects, multi-entity operations).

### CSS and Layout

Visual regression tools (Percy, Chromatic) are expensive to maintain and produce noisy diffs. Use the existing `screenshot-verify.spec.ts` during development for manual visual checks. Don't add screenshot comparison to CI.

### Mock-Heavy Unit Tests

If a test requires 5+ mocks to set up, it's testing wiring, not logic. That wiring is already tested by the API smoke test and integration tests. Refactor the logic into a pure function and test that instead, or write an integration test against `WebApplicationFactory`.

### Every Form Validation Permutation

The `FormValidationService` + `ValidationPopoverDirective` infrastructure is tested once. Don't test that every field on every form shows the right error message. Test custom validators (phone format, date range logic) in isolation.

### Comprehensive SignalR Tests

Real-time sync tests are inherently flaky due to timing. The existing `signalr-board-sync.spec.ts` diagnostic covers the critical path (two browser contexts, one moves a job, the other sees the update). Don't try to build comprehensive multi-user real-time test suites.

---

## 4. Running Tests

| Command | What It Does | When to Run |
|---------|-------------|-------------|
| `npx vitest run` | All unit + component tests (651+) | Pre-commit (automatic via hook) |
| `dotnet test` | xUnit integration tests | After handler/entity changes |
| `npm run test:api-smoke` | Hit every GET endpoint | After API changes, before deploy |
| `npm run test:contract-drift` | Check frontend/backend URL alignment | After renaming/removing endpoints |
| `npm run test:critical-flows` | 5 key user journeys (Playwright) | Before deploy, after major changes |
| `npm run e2e` | Full E2E suite (Playwright) | CI pipeline |
| `npx playwright test screenshot-verify` | Screenshot current page | During UI development (manual) |

### Prerequisites

- Docker Compose stack running (`docker compose up -d`)
- Seed data loaded (automatic on first start)
- `.env` has `SEED_USER_PASSWORD` set (for E2E auth)

---

## 5. Adding Tests — Decision Matrix

When you add a new feature, ask these questions in order. Stop at the first "yes."

| Question | If Yes | Test Type |
|----------|--------|-----------|
| Does it have computed logic (signal, service method, pure function)? | Unit test the computation | `.spec.ts` co-located |
| Does it have a new API endpoint? | Auto-covered by API smoke test | None needed |
| Does it have a new form with custom validation? | Unit test the custom validator | `.spec.ts` co-located |
| Is it a critical path (auth, core CRUD, payment flow)? | Add to critical flows E2E | `e2e/tests/critical/` |
| Does it have a new Angular service URL? | Auto-covered by contract drift detection | None needed |
| Is it a new entity with seed data? | Auto-covered by seed startup | None needed |
| Does it have complex state management (multi-step wizard, optimistic UI)? | Component test the state transitions | `.spec.ts` co-located |
| Is it a MediatR handler with business logic (not just CRUD)? | Integration test against real DB | `Forge.Tests/` |

If none of the above apply, the feature is likely simple enough that existing infrastructure tests cover it.

---

## 6. Test File Conventions

```
forge-ui/
├── src/app/
│   ├── shared/services/auth.service.spec.ts        # Co-located unit test
│   ├── shared/pipes/terminology.pipe.spec.ts       # Co-located unit test
│   └── features/kanban/kanban.component.spec.ts    # Co-located component test
├── e2e/
│   ├── tests/
│   │   ├── smoke/
│   │   │   ├── api-smoke.spec.ts                   # Auto-generated GET endpoint tests
│   │   │   └── contract-drift.spec.ts              # Frontend/backend URL alignment
│   │   ├── critical/
│   │   │   ├── login-dashboard.spec.ts             # Critical flow #1
│   │   │   ├── kanban-board.spec.ts                # Critical flow #2
│   │   │   ├── create-job.spec.ts                  # Critical flow #3
│   │   │   ├── parts-catalog.spec.ts               # Critical flow #4
│   │   │   └── time-tracking.spec.ts               # Critical flow #5
│   │   ├── signalr-board-sync.spec.ts              # SignalR diagnostic
│   │   └── screenshot-verify.spec.ts               # Manual visual check
│   ├── helpers/
│   │   ├── auth.helper.ts                          # seedAuth() for pre-authenticated contexts
│   │   └── ui-actions.helper.ts                    # navigateTo, fillInput, fillMatSelect, etc.
│   └── playwright.config.ts

forge-api/
└── forge.tests/
    ├── Handlers/
    │   ├── Jobs/CreateJobHandlerTests.cs            # Integration test
    │   └── Jobs/MoveJobStageHandlerTests.cs         # Integration test (business logic)
    └── TestFixtures/
        └── DatabaseFixture.cs                       # Shared test DB setup
```

### Naming Rules

- Unit/component test files: `{source-file-name}.spec.ts` — same directory as source
- E2E test files: `{feature-name}.spec.ts` — in the appropriate `e2e/tests/` subdirectory
- xUnit test files: `{HandlerName}Tests.cs` — mirrors source project folder structure
- Test methods: `Should_ExpectedBehavior_When_Condition` (.NET) or `it('should do X when Y')` (TypeScript)

---

## 7. CI Pipeline Integration

```
PR opened / push to branch
  ├── [parallel] Angular lint + build
  ├── [parallel] .NET build + analyzers
  ├── [parallel] Vitest (unit + component)
  ├── [sequential] xUnit integration tests (needs test DB)
  ├── [sequential] API smoke tests (needs full stack)
  └── [sequential] Critical flow E2E (needs full stack)
```

CI fails the PR if any step fails. E2E failures include screenshots in the PR comment.

The API smoke and critical flow tests share a single Docker Compose stack spun up once per CI run.

---

## 8. When to Write More Tests

Expand test coverage when:

- **A bug escapes to production** — write a regression test for the specific scenario
- **A refactor touches shared infrastructure** — verify the shared component/service still works
- **A feature has complex business rules** — state machines, multi-step workflows, conditional logic
- **An integration has retry/fallback behavior** — QB sync, shipping API, address validation

Don't expand test coverage proactively "just in case." Test what has broken or what has logic worth protecting.
