# Forge — Project Rules

> Loaded into every Claude Code session. These rules override defaults. Follow exactly.
> Full specs in `docs/`. When in doubt, check `docs/coding-standards.md` first.

## Client & Meeting Transcripts (Confidential — Non-Negotiable)

Meeting and client-conversation transcripts (e.g. Google Docs, Gemini/recorder notes) are **proprietary and confidential**. Discussing their contents freely in conversation is fine — the hard rule is about what lands on disk in the repo:

1. **Never write transcript content into the repo or anything that could be committed/pushed to GitHub.** No raw transcripts, verbatim quotes, client names, or excerpts in tracked files. Keep transcript text out of anything git can see (use the session scratchpad for scratch work, not the working tree).
2. **The goal of processing a transcript is to drive application change or produce a TODO list of new functionality** — deliver distilled requirements/decisions/TODOs, and only those may enter `docs/`.
3. **Filter out banter and already-existing/documented functionality.** Cross-check against `docs/` and flag what is genuinely new vs. duplicative of existing design/implementation.
4. If a derived work item requires paraphrasing sensitive specifics into a committed doc, ask first.

## SELF-MAINTENANCE RULE

**After every session that introduces a new pattern, convention, architectural decision, or workflow change — update this file.** This is the single source of truth for project rules across sessions. If a decision is made during implementation (new shared component, naming convention, SCSS pattern, API convention, etc.), add it here before the session ends. Outdated or missing rules cause rework. Keep this file current.

Also update `docs/coding-standards.md` or the relevant doc file if the change is significant enough to be spec-level.

**Implementation tracking:** Check `docs/implementation-status.md` at the start of every session. When completing a feature or sub-feature, update its status (Not Started → Partial → Done) in that file before ending the session. This is the master progress tracker.

## Autonomous Execution (Non-Negotiable)

When doing build/implementation work, **run continuously — never pause to ask a question or wait for confirmation.** If something needs the owner's input, append it to the blocking-questions inventory (`docs/delivery/in-progress/blocking-questions.md`), make the most reasonable assumption (or skip that individual task), and move on to the next unblocked task — in the same deliverable or a different one (sub-deliverables or whole deliverables). Surface the accumulated inventory only at the end of the run. Merge/push and "which first" choices are **log-and-continue**, not stop-and-ask. Keep docs in lockstep as each item completes (don't let them drift).

**"Milestones" are NOT a concept on this project.** Do not checkpoint, batch, pause, or report around milestones. Work task-by-task / stage-by-stage and keep going.

## Documentation Placement (Non-Negotiable)

All docs follow the taxonomy in **`docs/README.md`**. Two axes:
- **Reference** (stable knowledge) → by type: `docs/{domain,product,technical,business,training}/`.
- **Delivery** (work we code/modify *against*) → by status: `docs/delivery/{pending,in-progress,complete,abandoned}/`. An effort is a folder, moved with `git mv` as its status changes.

Hard rules (a `PreToolUse` hook + a CI check enforce these):
1. **Never create a new `.md` at `docs/` root** (or repo root — except `README`/`CLAUDE`/`CONTRIBUTING`/`CODE_OF_CONDUCT`). It goes in a category folder or `delivery/<stage>/`.
2. **Every doc starts with frontmatter** — at least `type:` and `status:` (full spec in `docs/README.md` §4).
3. **When unsure which category, use `docs/delivery/in-progress/`** — never the root.
4. New efforts: scaffold with `/new-effort <slug>`.

Full taxonomy, frontmatter spec, and the legacy-migration map live in `docs/README.md`. (Migration of existing files is deferred until the analysis journey finishes — don't move files it may be reading.)


## Repo-specific standards (canonical homes — imported)

Frontend (Angular) and backend (.NET) standards are maintained in each sub-repo's **own**
`CLAUDE.md` so standalone clones load them. They're imported here for the nested umbrella
checkout. **When you change a UI or API standard, edit the sub-repo file — it is the
canonical home; do not re-add a copy to this umbrella file.**

@forge-ui/CLAUDE.md
@forge-api/CLAUDE.md

## Project Structure

```
forge-wrapper/
├── forge-ui/          # Angular 21 + Material 21
│   └── src/
│       ├── styles/           # _variables, _mixins, _shared, _reset
│       ├── styles.scss       # Material theme + overrides
│       └── app/
│           ├── shared/       # Reusable components, services, directives, pipes, utils
│           ├── features/     # Feature modules (kanban, backlog, admin, etc.)
│           └── core/         # Singleton services (layout, nav, toolbar, sidebar)
├── forge-api/       # .NET 9 solution
│   ├── forge.api/      # Controllers, Features/ (MediatR handlers), Middleware
│   ├── forge.core/     # Entities, Interfaces, Models, Enums
│   ├── forge.data/     # DbContext, Repositories, Migrations, Configuration
│   └── forge.integrations/
├── docs/                     # Specs: coding-standards, architecture, functional-decisions, ui-components, roles-auth, libraries
└── docker-compose.yml        # 5 core + 3 optional profiles (ai, tts, signing)
```

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
| Carrier APIs (UPS/FedEx/USPS/DHL) | Done | All four carriers implemented end-to-end (real OAuth + REST). MultiCarrierShippingService aggregator + IntegrationDescriptorCatalog wiring + IOptions hot-reload on admin save. Stamps.com is descriptor-only — SwsimV111 SOAP service not yet built |
| Xero / FreshBooks / Sage / NetSuite / Wave / Zoho accounting | Done | All implemented; AccountingProviderFactory resolves the active provider from system settings |
| QB Payroll API | Not Started | Controller + entities done; QB Payroll sync stubs return empty |
| Customer Portal | Done (v1) | Magic-link auth + dashboard / orders / quotes / invoices / shipments + quote accept-decline. Capability CAP-EXT-CUSTOMER-PORTAL (default OFF). UI lives at /portal/* outside the employee shell |

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


## Security
- CSP headers: `default-src 'self'`, `script-src 'self'` (no eval), `frame-ancestors 'none'`
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, HSTS in production
- Rate limiting via built-in .NET middleware (fixed window, sliding window, token bucket)
- QB OAuth tokens encrypted via ASP.NET Data Protection API (keys in Postgres)
- No sensitive data in localStorage beyond auth tokens (short-lived access + rotated refresh)
- Auth interceptor: 401 → silent refresh, queues concurrent requests during refresh

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
docker compose up -d --build forge-api  # Rebuild API
docker compose logs -f forge-api        # API logs
docker compose exec forge psql -U postgres -d forge  # DB access
```

5 core services: `forge-ui`, `forge-api`, `forge`, `forge-storage`, `forge-backup`. Optional profiles: `ai` (Ollama + model init), `tts` (Coqui TTS), `signing` (DocuSeal).

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
4. **If the container belongs to this project** (`forge-*`) → `docker compose down` or `docker rm -f <container>`, then retry `up`
5. **If the container belongs to another project** → the port is legitimately in use; pick a different port or stop the other stack intentionally

Scripts (`setup.sh`, `refresh.sh`) must follow this ownership check before taking any remediation action. Never blanket-kill all `docker-proxy` processes.

### snap Docker + cgroup v2 — "could not kill container: permission denied"

On hosts where Docker is the **snap** build (`docker info` → `Root=/var/snap/docker/...`) running on **cgroup v2 + systemd driver**, `docker stop`/`rm`/`compose up --build` on a *running* container fails with `could not kill container: permission denied` (create/exec/build/ps all work; Testcontainers integration tests fail only at teardown). Cause: the `snap.docker.dockerd` AppArmor profile has no write rule for the container's cgroup-v2 `cgroup.kill` under `system.slice`. Quick dev fix: `sudo apparmor_parser -R /var/lib/snapd/apparmor/profiles/snap.docker.dockerd` (reversible with `-r`; not persistent across reboot/snap-refresh). Permanent fix: use Docker CE from apt (unconfined daemon). **Full Symptom→Cause→Fix write-up: `forge-deploy/docs/TROUBLESHOOTING.md` → Host setup.**

---


## E2E Simulation Framework

Playwright-based week simulation spanning 431 weeks (2018–2026) for realistic data generation:

- `forge-ui/e2e/tests/` — simulation specs
- `e2e/helpers/ui-actions.helper.ts` — reusable Playwright helpers (navigateTo, fillInput, fillMatSelect, fillDatepicker, clickButton)
- `e2e/helpers/auth.helper.ts` — `seedAuth()` for pre-authenticated browser contexts
- Resume support: queries API for latest data to skip already-processed weeks
- Rate limiter bypass for loopback IPs in `Program.cs` for E2E throughput

### data-testid Conventions
All form fields and interactive elements in dialog/form templates must have `data-testid` attributes:
- Format: `{entity}-{field}` (e.g., `data-testid="job-title"`, `data-testid="job-save-btn"`)
- Used by Playwright simulation runner and E2E tests

---


## Printing & PDF
- `@media print` stylesheet: hides nav, toolbar, sidebar, interactive controls
- Printable views: work order, packing slip, QC report, part spec, expense report
- QR/barcode labels: bwip-js + angularx-qrcode, configurable label sizes
- Server-side PDF: QuestPDF — `GET /api/v1/jobs/{id}/pdf?type=work-order`

---


## Implementation Tracking

**Check `docs/implementation-status.md` at the start of every session.** When completing a feature, update its status in that file before ending the session. This is the master progress tracker for the entire project.
