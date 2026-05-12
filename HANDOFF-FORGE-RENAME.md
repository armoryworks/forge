# Handoff: forge → Forge rename + GitHub org migration + vertical restructure

> Persistent execution brief for the agent assigned to the Forge rename pass. Load this file alongside `CLAUDE.md` at the start of every session. `CLAUDE.md` is the source of truth for naming conventions, tech stack, and coding patterns. This file is the source of truth for *what specific work to do* in this multi-day refactor.

## TL;DR

Three coordinated operations executed as one pass:

1. **Product rename**: forge → **Forge**. New canonical URL: `forge.armoryworks.com` (subdomain of the firm site, not a separate .com).
2. **GitHub org migration**: all repos move from `github.com/danielhokanson/forge-*` to `github.com/armoryworks/forge-*`. Old repos are archived (not deleted) with redirect READMEs.
3. **Architectural restructure**: horizontal-layer .NET solution and horizontal-feature Angular project become **modular monolith with vertical bounded contexts** (11 verticals + 3 cross-cutting). Database mapping switches from EF Code-First to **DbUp + SQL files as source of truth**.

Estimated effort: **8–10 focused workdays**. Do not split this into staggered releases — the rename, the org migration, and the restructure are cheaper to do as one operation than as three.

## Authoritative reference docs

Sources of design intent. The agent should read these (Drive access via `@armoryworks/drive-mcp`) before executing:

- **LLC Decision Log** in `00 — Company / Resolutions & Minutes/`. Decisions D-005 through D-010 plus D-013 cover rename, restructure, DB switch, GitHub org, and subdomain pattern. Each entry has rationale and reopen triggers.
- **Architecture Doc** in `40 — Product / Roadmap & Planning/`. The full target architecture for Forge — vertical boundaries, dependency rules, when to split a vertical into a separate service.
- **Rename + Restructure Plan** in `40 — Product / Roadmap & Planning/`. The phased execution plan with day-by-day target output.
- **Baseline Stereotypes** in `40 — Product / Roadmap & Planning/`. Reusable patterns the agent should preserve through the restructure.
- **`CLAUDE.md`** (this repo). Naming, formatting, lint rules, tech stack. Treat as immutable through the rename — change conventions in a separate later pass, not this one.

If any of those documents conflicts with this HANDOFF doc, the Architecture Doc and Rename Plan win. This file is a working summary.

## The 11 verticals + 3 cross-cutting schemas

The target Postgres schema layout (per D-008). The same names apply to the .NET project structure and the Angular feature directories. Use them consistently across all three layers.

| # | Schema | What lives there |
|---|---|---|
| V1 | `identity` | Users, roles, authentication, MFA, sessions |
| V2 | `master_data` | Customers, Vendors, Contacts, Parts, BOMs, VendorParts, PriceLists, Assets, ReferenceData |
| V3 | `sales` | Quotes, Estimates, Sales Orders, Invoices, Payments, RecurringOrders |
| V4 | `procurement` | Purchase Orders, RFQs, ReceivingRecords, vendor evaluations |
| V5 | `production` | Jobs, Operations, ProductionRuns, TrackTypes, JobStages, JobSubtasks |
| V6 | `inventory` | StorageLocations, BinContents, BinMovements, Lots, Shipments |
| V7 | `quality` | QcTemplates, QcInspections, holds, dispositions |
| V8 | `maintenance` | Asset maintenance schedules, work orders, downtime tracking |
| V9 | `people` | Employees, PayStubs, TaxDocuments, ComplianceForms, Training, Events, TimeEntries, ClockEvents |
| V10 | `insights` | Reports, SavedReports, Dashboards, AI (DocumentEmbedding, AiAssistant) |
| V11 | `operations` | Notifications, ScheduledTasks, SyncQueueEntries, EDI, ChatRoom/ChatMessage |
| C1 | `platform` | SystemSettings, FileAttachments, ActivityLog, AuditLogEntry — anything cross-cutting that's not domain-specific |
| C2 | `audit` | (Reserved) future immutable audit-log schema |
| C3 | `reference` | (Reserved) future shared lookup tables that don't fit master_data |
| — | `extensions` | Postgres extensions (pgvector, pgcrypto) live here |
| — | `public` | MUST stay empty. CI check enforces. Sentinel for "table fell through the cracks." |

The boundary rules (from Architecture Doc):
- A vertical may **depend on** identity, master_data, platform, audit, reference, extensions. It must NOT depend on another vertical at the data layer.
- Cross-vertical workflows happen through **events** (SignalR / Hangfire messages), not direct table reads.
- A vertical's .NET project namespace is `Forge.{Vertical}` → after rename `Forge.{Vertical}` (PascalCase).
- A vertical's Angular feature folder is `src/app/features/{vertical}/` (kebab-case).

## Repository target state

### Source repos (current, to be archived)
- `github.com/danielhokanson/forge-ui` (Angular 21)
- `github.com/danielhokanson/forge-api` (.NET 9)
- `github.com/danielhokanson/forge-wrapper` (docker-compose + docs; this is the active workspace)

### Target repos (new home)
- `github.com/armoryworks/forge-ui`
- `github.com/armoryworks/forge-server`
- `github.com/armoryworks/forge` (drop "-wrapper" suffix; "forge" is the umbrella)

Archive policy: original repos are **archived in place**, README replaced with a single-line redirect: "This repo has moved to [github.com/armoryworks/forge-...](https://github.com/armoryworks/forge-...). Original history preserved here for reference." Do NOT delete.

## Naming changes — the global rules

Everywhere except git history and intentional CHANGELOG references:

| Old | New |
|---|---|
| `forge` | `forge` |
| `forge-*` (repo/package/service names) | `forge-*` or just `forge` |
| `Forge` (C# namespace) | `Forge` |
| `qbEngineer` (TS) | `forge` |
| `forge` (DB) | (schemas replace this — no single DB name) |
| `forge.com` | `forge.armoryworks.com` |
| `forge-api`, `forge-ui`, `forge`, etc. (Docker service names) | `forge-api`, `forge-ui`, `forge-db`, etc. |
| `QB_ENGINEER_*` env vars | `FORGE_*` |
| `armoryworks-drive-mcp` etc. (npm packages) | unchanged (those are firm-level, not product-level) |

Preserve in CHANGELOG / decision log entries: existing mentions of "forge" stay verbatim. New entries use "Forge."

The agent **must** grep the codebase before each phase to catch references it didn't think of. Common gotchas:
- Docker volume names
- nginx proxy paths
- SystemSetting keys named `forge.*`
- Localization keys (`en.json`, `es.json`) containing the old name in strings
- Error message templates
- Email templates
- API base path (`/api/v1/` is OK; any `/api/forge/...` is not)
- README screenshots and the marketing scaffolding docs (those reference forge — update them too)

## Execution sequence

Each phase has a clear "DONE when..." gate. Do not cross a phase boundary until the gate passes. Verify with `dotnet build`, `npm run lint`, `npm test`, and `docker compose up --build`.

### Phase A — Org bootstrap (~half day)

1. Create the three target repos under `github.com/armoryworks` (forge-ui, forge-server, forge — all private during the rename, can flip public later).
2. For each source repo, push a `git push --mirror` to the target. This carries history, branches, tags.
3. Set the target repos' default branch to `main`.
4. Set up the target repos' branch protection per CLAUDE.md (currently OFF per the pre-beta direct-push rule; preserve that).
5. Verify the npm `@armoryworks` scope is set up. It is (drive-mcp lives there). No new scope work needed.

**DONE when**: all three new repos exist with full history; `git log` on each target matches `git log` on each source.

### Phase B — Rename pass (~1 day)

Bulk rename across the target repos. Order: server, then UI, then wrapper.

Approach: write a single rename script per repo (`scripts/rename-to-forge.sh`) that does case-aware find-and-replace across well-defined file globs. Run it, commit the result as one big commit titled `feat: rename forge → forge`. Manual cleanup for the edge cases the script misses.

Targets per repo:

**forge-server**:
- All `.cs`, `.csproj`, `.sln`, `.json`, `.yml`, `.yaml`, `.md`, `.dockerfile` files
- Project directory names (`forge.api/` → `forge.api/`)
- Namespace declarations
- `Program.cs` service registrations
- `appsettings*.json` keys
- Docker service references

**forge-ui**:
- `package.json` name + dependencies
- Angular project name in `angular.json`
- All `.ts`, `.html`, `.scss`, `.json`, `.md` files
- Public assets (`favicon.ico` etc. — replace with Forge branding if assets exist; else preserve)
- `i18n/en.json`, `i18n/es.json` keys + values where they reference the product name
- README + screenshots

**forge** (wrapper):
- `docker-compose.yml` service names + volume names + network names
- `.env.example`
- README
- `CLAUDE.md` references (the wrapper-level one)
- `docs/*.md`
- `HANDOFF-FORGE-RENAME.md` itself — update the title from "Handoff: forge → Forge ..." to "Handoff: Forge — restructure execution brief"

After the rename, every test should still pass (it's a textual rename, not a logical change). If anything breaks, the rename script missed a reference.

**DONE when**: `npm run lint && npm test` in forge-ui passes, `dotnet build --configuration Release -warnaserror && dotnet test` in forge-server passes, `docker compose up --build` brings the full stack up cleanly, and no string `forge` or `Forge` survives anywhere outside CHANGELOG.md / docs/llc-decision-log references.

### Phase C — Server vertical restructure (~3 days)

This is the heavy lift. The .NET solution today is one project (`forge.api`) + supporting (`forge.core`, `forge.data`, `forge.integrations`) with horizontal layering inside.

Target solution structure:

```
forge-server/
├── Forge.sln
├── src/
│   ├── Forge.Identity/           (V1)
│   ├── Forge.MasterData/         (V2)
│   ├── Forge.Sales/              (V3)
│   ├── Forge.Procurement/        (V4)
│   ├── Forge.Production/         (V5)
│   ├── Forge.Inventory/          (V6)
│   ├── Forge.Quality/            (V7)
│   ├── Forge.Maintenance/        (V8)
│   ├── Forge.People/             (V9)
│   ├── Forge.Insights/           (V10)
│   ├── Forge.Operations/         (V11)
│   ├── Forge.Platform/           (C1 — shared infra; everyone depends on this)
│   ├── Forge.Database/           (DbUp host project — see Phase E)
│   └── Forge.Host/               (composition root; references all verticals; this is what gets containerized)
└── tests/
    └── Forge.{Vertical}.Tests/   (one test project per vertical)
```

Each vertical project follows the SAME internal structure:

```
Forge.{Vertical}/
├── Forge.{Vertical}.csproj
├── Entities/                     (the EF Core entities owned by this vertical)
├── Configurations/               (IEntityTypeConfiguration<T> classes)
├── Controllers/                  (HTTP controllers; one per aggregate)
├── Features/                     (MediatR handlers + validators, one folder per command/query)
├── Services/                     (cross-cutting domain services, if any)
├── Models/                       (request/response models; never "DTO")
└── DependencyInjection.cs        (extension method: services.AddForge{Vertical}())
```

Migration approach:

1. **Create the vertical project skeletons** with empty Entities/, Features/, etc.
2. **Move entities first**, one vertical at a time. Reference the schema table in section above for which entity goes where.
3. **Move the corresponding Configurations** (Fluent API entity configurations) alongside their entities.
4. **Move controllers** to the vertical they primarily operate against (e.g., `JobsController` → `Forge.Production`).
5. **Move features** (MediatR handlers) — these are usually 1:1 with controllers so they follow naturally.
6. **Reconcile cross-vertical dependencies.** Inevitably you'll find a handler that touches entities across two verticals. Two options: (a) keep the read in the cross-vertical handler and accept the dependency, or (b) introduce an event-driven path. Prefer (a) during the restructure pass — splitting into events is a separate later effort.
7. **Update `Forge.Host/Program.cs`** to call each vertical's `AddForge{Vertical}()` extension. The host is the composition root.
8. **Run tests after each vertical migration.** If something breaks at vertical N, the issue is contained.

Cross-cutting in `Forge.Platform`:
- `AppDbContext` lives here. It references entities by interface where possible; concrete entities live in their owning vertical.
- `IClock`, `ICurrentUser`, `IFileStorageService`, `ILogger` wrappers, MediatR pipeline behaviors (validation, logging, transactions) — all here.
- `BaseEntity` and `BaseAuditableEntity` lives here.

**Boundary enforcement** (CI gate to add):
- A vertical's csproj must reference ONLY `Forge.Platform` + (optionally) `Forge.Identity`, `Forge.MasterData`. Any other inter-vertical reference is a CI failure.
- The `forge.api` project (legacy name; now `Forge.Host`) is the only project that references all verticals.

**DONE when**: solution builds clean, all tests pass, every existing API endpoint still responds correctly, docker stack still boots, AND the CI dependency check (script that greps csproj files for forbidden cross-vertical refs) passes.

### Phase D — UI vertical restructure (~1.5 days)

The Angular project is already feature-modular. The restructure is mostly **renaming features to match the verticals** plus enforcing a stricter shared-only-via-platform pattern.

Current `features/` layout in forge-ui (per CLAUDE.md):
```
features/
├── kanban/            → production
├── dashboard/         → insights
├── calendar/          → (cross-vertical view; lives in core/ as a shell route)
├── backlog/           → production
├── parts/             → master-data
├── inventory/         → inventory
├── customers/         → master-data
├── leads/             → sales
├── expenses/          → people
├── assets/            → master-data (or maintenance — pick one; assets are primarily owned by master-data for identity, maintenance schedules attach)
├── time-tracking/     → people
├── admin/             → operations (most admin), plus settings per vertical
├── auth/              → identity
├── vendors/           → master-data
├── purchase-orders/   → procurement
├── sales-orders/      → sales
├── quotes/            → sales
├── shipments/         → inventory
├── invoices/          → sales
├── payments/          → sales
├── planning/          → production
├── reports/           → insights
├── quality/           → quality
├── chat/              → operations
├── ai/                → insights
├── training/          → people
├── notifications/     → operations
```

Target `features/` layout:

```
src/app/features/
├── identity/                      (auth, user profile, MFA setup)
├── master-data/                   (customers, vendors, parts, assets)
│   ├── customers/
│   ├── vendors/
│   ├── parts/
│   └── assets/
├── sales/
│   ├── leads/
│   ├── quotes/                    (Estimates + Quotes — both QuoteType variants)
│   ├── sales-orders/
│   ├── invoices/
│   └── payments/
├── procurement/
│   └── purchase-orders/
├── production/
│   ├── kanban/
│   ├── backlog/
│   └── planning/
├── inventory/
│   ├── stock/
│   ├── receiving/
│   └── shipments/
├── quality/
├── maintenance/
├── people/
│   ├── employees/
│   ├── time-tracking/
│   ├── expenses/
│   ├── training/
│   └── account/                   (current /account/* routes)
├── insights/
│   ├── dashboard/
│   ├── reports/
│   └── ai/
└── operations/
    ├── admin/
    ├── chat/
    └── notifications/
```

Each vertical's top-level folder gets:
- A `vertical.routes.ts` (Angular lazy route registration for everything under it)
- Optional `vertical.module.ts` if a vertical has shared components (otherwise rely on standalone components per CLAUDE.md)

`shared/` and `core/` are unchanged — they remain horizontal.

**Boundary enforcement** (CI gate):
- An ESLint rule (`no-restricted-imports`) that prevents `features/{a}/**` from importing `features/{b}/**` where a ≠ b. Cross-vertical needs go through `shared/`.

**DONE when**: `npm run build` passes, `npm run lint && npm run lint:i18n && npm test` pass, navigating the running app touches every page successfully, AND the ESLint cross-feature import rule is configured and clean.

### Phase E — Database conversion (~2 days)

Switch from EF Core Code-First migrations to a deployable database project using **DbUp**.

New project: `src/Forge.Database/` (in forge-server). Structure:

```
Forge.Database/
├── Forge.Database.csproj
├── Program.cs                            (CLI entrypoint: applies SQL files in order)
├── DbUpRunner.cs                         (DbUp wiring)
├── Scripts/
│   ├── 0000_extensions.sql              (CREATE EXTENSION pgvector, pgcrypto, etc.)
│   ├── 0001_schemas.sql                 (CREATE SCHEMA for all 14)
│   ├── identity/                        (V1 tables, indexes, views, functions)
│   │   ├── 0010_create_users.sql
│   │   ├── 0011_create_roles.sql
│   │   └── ...
│   ├── master_data/
│   │   └── ...
│   ├── sales/
│   ├── procurement/
│   ├── production/
│   ├── inventory/
│   ├── quality/
│   ├── maintenance/
│   ├── people/
│   ├── insights/
│   ├── operations/
│   ├── platform/
│   ├── audit/
│   ├── reference/
│   └── v0.x_baseline.sql                (final consolidation of all current EF migrations; this is what fresh installs start from)
└── README.md
```

Conversion approach:

1. **Capture current schema as v0.x baseline**: run `dotnet ef migrations script --idempotent` on the current EF setup, produce one big SQL file. This becomes `Scripts/v0.x_baseline.sql`. Sanity-check it manually.
2. **Re-organize the baseline by schema/vertical**: take the v0.x baseline and split the CREATE TABLE / CREATE INDEX statements into per-vertical folders. Each file is named `{order}_create_{table}.sql`. The DbUp runner applies them in alphabetical order (DbUp's `WithScriptsFromFileSystem` + alphabetical sorting).
3. **Install DbUp**: `dotnet add package DbUp`. Wire a CLI entrypoint that takes a connection string and applies scripts.
4. **Update EF entities to sync to the schema**: switch `ModelBuilder.HasDefaultSchema(...)` to per-entity `[Table(name, Schema = ...)]` annotations (or Fluent equivalent). Each vertical's entities target their vertical's schema.
5. **Remove the existing `Migrations/` folder** from `Forge.Data`. EF Core no longer drives schema; entities follow it.
6. **Update `Program.cs` startup**: remove the `db.Database.Migrate()` call. The host no longer auto-migrates. Migration is a separate manual step pre-deploy (matches the `armory-works` deployment pattern in CLAUDE.md §"No self-migrating on boot").
7. **Document the deploy workflow**: edit the README to explain `dotnet run --project src/Forge.Database -- --connection-string "..."` is the pre-deploy step.

CI gate to add: a script that asserts no table lands in the `public` schema. Run as part of every test that uses the DB.

Migration safety: this is the riskiest phase. Do it on a fresh dev DB first, verify the resulting schema matches the current production schema byte-for-byte (use `pg_dump --schema-only` diff). Only then point at staging. Production conversion is a separate deploy with the existing `armoryworks` deployment.md §4 pattern (out of band).

**DONE when**: a fresh Postgres + `dotnet run --project src/Forge.Database` produces a schema identical to a fresh `db.Database.Migrate()` run on the current main, AND `dotnet test` passes against that schema, AND `docker compose up` works end-to-end.

### Phase F — Verification + visual regression (~half day)

Run the full test pyramid plus visual checks:
1. `npm run lint && npm run lint:i18n` in forge-ui.
2. `npm test -- --watch=false` in forge-ui (vitest).
3. `dotnet build --configuration Release -warnaserror` in forge-server.
4. `dotnet test` in forge-server (xUnit).
5. `docker compose up --build` brings the full stack up.
6. Playwright e2e suite: `cd forge-ui && npm run e2e`.
7. Visual screenshot verification per CLAUDE.md (`screenshot-verify.spec.ts` against dashboard, kanban, parts, customers).
8. Manual smoke: log in, create a job, move it across the board, create a part, run a report.

**DONE when**: every gate above passes.

### Phase G — Archive old repos (~1 hour)

For each of the three source repos:

1. Replace the README with: "This repo has moved to [github.com/armoryworks/forge-...](https://github.com/armoryworks/forge-...). Original history preserved for reference. New work happens at the new location."
2. Push that as a single commit titled `chore: redirect to armoryworks/forge-...`.
3. Settings → Archive this repository.

Do NOT delete. The redirect README needs to remain reachable.

### Phase H — DNS + deploy (~1 hour)

1. In Cloudflare DNS for `armoryworks.com`, add: `forge` (CNAME) pointing at the production server (or the existing tunnel hostname).
2. In Cloudflare Tunnel config, add a public hostname `forge.armoryworks.com` routing to the local nginx upstream that fronts `forge-ui:80`.
3. Update the production deployment scripts (`setup.sh`, `refresh.sh`) to use the new repo URLs.
4. Update the marketing site (armory-works repo) to point its product CTAs at `https://forge.armoryworks.com` (this is partially done already — verify).
5. Update `forge.com` Cloudflare config to 301 redirect to `https://forge.armoryworks.com` (per D-011).

**DONE when**: `https://forge.armoryworks.com` resolves to the running Forge UI, `https://forge.com` 301-redirects to forge.armoryworks.com, and the marketing site links flow correctly.

## Success criteria summary

The rename pass is complete when all of these are simultaneously true:

- [ ] All three target repos exist under `github.com/armoryworks/` with full history.
- [ ] All three source repos are archived with redirect READMEs.
- [ ] No code/config/doc string `forge`, `Forge`, `forge` survives anywhere outside CHANGELOG/decision-log historical references.
- [ ] forge-server builds clean with `-warnaserror`, all unit + integration tests pass.
- [ ] forge-ui builds clean, lints clean (`npm run lint && npm run lint:i18n`), all vitest specs pass.
- [ ] 11 verticals + 3 cross-cutting + 1 extensions = 15 schemas in Postgres (counting extensions); `public` is empty.
- [ ] DbUp applies `Scripts/` in order against a fresh DB and produces a schema matching the prior EF-managed schema.
- [ ] `docker compose up --build` brings the full stack up; the kanban board renders; a job can be created and moved.
- [ ] Playwright e2e visual checks pass.
- [ ] CI dependency-check script asserts no forbidden cross-vertical references (server + UI).
- [ ] `https://forge.armoryworks.com` resolves and serves the app.
- [ ] `https://forge.com` 301-redirects to forge.armoryworks.com.

## What NOT to do

- **Do not deprecate features during the rename.** Every feature that works on main today must still work after the rename. The restructure is structural, not functional.
- **Do not break CLAUDE.md conventions.** The vertical restructure changes WHERE code lives, not HOW it's written. Keep all naming, formatting, and architectural patterns intact.
- **Do not introduce events / message bus / decoupling between verticals in this pass.** Direct cross-vertical reads are acceptable transitional state; converting them to events is a separate later effort tracked in the Architecture Doc.
- **Do not delete the EF Migrations folder until DbUp produces a byte-identical schema.** Verify with `pg_dump` diff first.
- **Do not change the public API surface.** Endpoint paths, request/response shapes, JSON casing — all stable.
- **Do not lose git history.** Use `git push --mirror`. Verify with `git log --oneline | wc -l` parity before and after.
- **Do not change the npm scope or package names of the open-source artifacts** (`@armoryworks/drive-mcp`). Those are firm-level, not product-level.
- **Do not flip branch protection on.** Per CLAUDE.md, the project is in pre-beta direct-push mode. Preserve that.
- **Do not deviate from the Phase A → H order.** Each phase has a clear gate; respect it.

## Tools and access the agent will need

- Read+write access to `github.com/armoryworks` (admin).
- Read access to source repos under `github.com/danielhokanson` (the user is the owner).
- npm publishing token for `@armoryworks` (if any package changes; v0.2.x of drive-mcp does not — separate work).
- Cloudflare API token or dashboard access for DNS changes (Phase H).
- `@armoryworks/drive-mcp` MCP server connected for reading Architecture Doc + Rename Plan from Drive.
- Local development environment matching CLAUDE.md (Docker, Node 20+, .NET 9 SDK, postgres client).

## On reporting and rollback

The agent should report progress at every phase boundary (A done, B done, etc.) with a brief summary of what landed and what was punted to a follow-up.

If a phase fails:
- Phase A/B/G/H: revert is git-revert + force-push (acceptable on the new repos since nothing depends on them yet); restore the source repos to active state.
- Phase C/D: roll back to the start-of-phase tag; investigate the failure; resume.
- Phase E: rollback is "restore from the EF-managed schema baseline + remove DbUp." Pre-deploy DB snapshot before any prod-direction work.

There is no automatic rollback. Every step is reversible by hand, but every step should be verified before moving on.

## After the rename: what comes next

This HANDOFF doc covers ONLY the rename + restructure pass. Future work tracked separately:

- **Pro Services preset (PRESET-08)**: per D-014. Implementation post-rename.
- **Drive integration**: per D-013. Implementation post-rename + post-Pro-Services.
- **Forms API**: future MCP work, separate release.
- **Slides API**: future MCP work, separate release.

## Post-rename operational cleanup (for the user, after Phase G)

These are concrete on-disk and infrastructure cleanups that the user (not the agent in-editor) should perform after the rename is committed and pushed. The VS Code agent cannot do these because they require closing the editor on the workspace first (Windows file locks) or touching infrastructure outside the repo.

### 1. Outer workspace directory rename on disk

When you are ready to close VS Code on this workspace and reopen at `E:/dev/forge/`:

```powershell
cd E:/dev
mv qb-engineer forge
cd forge
mv qb-engineer-server forge-api
mv qb-engineer-ui forge-ui
mv qb-engineer-test forge-test
mv qb-engineer-deploy forge-deploy
mv qb-engineer-voice forge-voice
```

Then update `docker-compose.yml` in the now-`forge` directory: drop the temporary `./qb-engineer-*` `build.context:` paths back to `./forge-*` (one commit on the wrapper repo). This is the last lingering reference to the old name in the active workspace.

### 2. Old Docker volume cleanup

After verifying the new stack boots cleanly with the renamed compose configuration and data has been backed up or migrated, reclaim disk:

```powershell
docker volume rm qb-engineer_pgdata qb-engineer_miniodata
```

The new stack's volumes are differently named (e.g., `forge_pgdata`, `forge_miniodata`) so this is pure garbage collection. Verify the new volumes exist and contain expected data BEFORE removing the old ones.

### 3. armoryworks user → org conversion

A GitHub support ticket is open to convert the `armoryworks` user account into an organization. While that ticket is pending, repositories work fine under the user-flavored namespace — clone, push, fork, and PRs all behave the same. After conversion completes, team-level features become available (multi-seat management, team-scoped permissions, organization audit log API). No repo URLs change. The GitHub Team Plan subscription (D-021) charges already, but its org-only benefits (team management, role permissions) only fully activate once the namespace is converted.

End of handoff.
                                                                                                                                                                                            