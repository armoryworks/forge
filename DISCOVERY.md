# Forge — Discovery Log & System Model

> **Living knowledge base for the market-readiness engagement.** This is where the team writes down **what we have learned to be true** about the application — so discovery findings don't evaporate. It is the counterpart to `AUDIT.md` (what's *broken*) and `docs/gap-inventory.md` (what's *missing*). This doc is **what we now *know***.
>
> Stood up 2026-05-20 by `[QA]`. Everyone writes here.

---

## How to use this doc

- **Record verified facts, not guesses.** If you confirmed it by reading code, hitting the API, or watching the UI, write it here with a one-word source: `(ui)` `(api)` `(code:path)` `(db)` `(docs)` `(domain)`.
- **Docs lag code in this repo** (the prior audit is from 2026-05-05; a full architecture restructure was attempted and reversed on 2026-05-20). Treat anything from `docs/` or `CLAUDE.md` as a *lead to verify*, then promote the verified version here.
- **Disagreements / open questions** go in §7 with a `?` until resolved — don't overwrite someone's fact, append your contradiction with evidence.
- **Defects don't live here.** A broken behavior → file in `AUDIT.md` (§4). A *missing* feature → `docs/gap-inventory.md`. Here we capture how the system *is meant to and does* work.
- **Cross-link:** reference findings as `AUDIT F-###` and gaps as `gap-inventory §N`.

---

## 1. Environment & access (verified facts)

| Fact | Value | Source | Verified |
|------|-------|--------|----------|
| UI | `http://localhost:4200` — Angular | (ui) responds 200 | 2026-05-20 `[QA]` |
| API | `/api/v1/*` behind the UI origin — .NET | (api) `/api/v1/health` 200 | 2026-05-20 `[QA]` |
| Admin user | `admin@forge.local` / `ForgeDemo!2026` | (api) live login + JWT confirmed | 2026-05-21 `[DISC]` |
| Shop-floor user | `bkelly@forge.local` / `ForgeDemo!2026` | (api) role=ProductionWorker | 2026-05-21 `[DISC]` |
| Seed password | `SEED_USER_PASSWORD=ForgeDemo!2026` in `.env`; applied to all 24 users via `SeedData.cs` | (db+code) | 2026-05-21 `[DISC]` |
| Containers | `forge-ui`, `forge-api`, `forge` (db), `forge-backup`, `forge-storage` | (api) `docker ps`, all healthy | 2026-05-20 `[QA]` |
| Demo-seeded instance | live as of 2026-05-21; `SEED_DEMO_DATA=true`, `SEED_USER_PASSWORD=ForgeDemo!2026` in container env | (db) | 2026-05-21 `[DISC]` |

**Test accounts** (keep here so we don't burn each other's — prior tester had `qa-engineer@qbtest.local`, `qa-prodworker@qbtest.local`; setup codes were captured locally and may be stale post-reseed):

| Account | Role | Notes |
|---------|------|-------|
| `admin@forge.local` | Admin | superuser; reaches capability-disabled routes server-side (see AUDIT F-002 cluster) |
| _(to be populated from DevOps seed)_ | | |

**Capability gating — confirmed disabled `CAP-*` flags in this install** `(api)` 2026-05-21 `[DISC]`:

| Capability | Effect |
|-----------|--------|
| `CAP-O2C-LEAD` | `GET /leads` → 403; leads module entirely disabled |
| `CAP-O2C-CREDIT-LIMITS` | `GET /customers/{id}/credit-status|credit-hold|credit-release` → 403 |
| `CAP-MD-CUSTOMER-INTERACTIONS` | `GET /customers/{id}/interactions` → 403 |
| `CAP-PLAN-ATP` | `GET /inventory/atp/{partId}` → 403; `GET /inventory/reservations` → 403 |
| `CAP-ACCT-EXTERNAL` | **All accounting sync endpoints → 403**: `/accounting/status`, `/accounting/sync-status`, `/accounting/providers`, `/admin/accounting-mode`, `POST /admin/integrations/{provider}/test`. The ⚡ ACCOUNTING BOUNDARY toggle is permanently non-functional in this install — invoices remain editable. The entire C10 QBO charter cannot run without enabling this capability. See AUDIT F-046. |

Routes remain registered but guarded server-side via `[RequiresCapability]`. Admin role does NOT bypass capability gates (all 403s observed with admin JWT). To enable capabilities, use `/admin` → Capabilities panel or direct `system_settings` edit.

---

## 2. Existing test & automation assets (for the regression phase)

Substantial Playwright scaffolding already exists in `forge-ui/e2e/` — **mine these as a map of intended flows** and as scaffolding for phase-2 automation:

- **Libs** (`e2e/lib/`): `crud`, `data-table`, `detail-panel`, `dialog`, `form`, `nav`, `entity-link`, `snackbar`, `random`, `fixtures`, `types` — reusable page-object-ish helpers.
- **Helpers** (`e2e/helpers/`): `auth.helper` (`seedAuth()` for pre-authenticated contexts), `ui.helper`, `interactive.helper`.
- **Scenario specs** (`e2e/scenarios/`) — map closely onto the spine: `01-foundation`, `02a-onboarding`, `02b-orders`, `02c-production`, `02d-full-populate`, `02e-qb-sandbox`, `03a-kiosk`, `03b-fulfillment`, `03c-quality`, `03d-expenses`, `00-qb-cleanup`.
- **Simulation** (`e2e/simulation/`): a `week-runner` that drives multi-day scenarios with a clock helper — useful for time-dependent spine behavior.
- **Existing strategy doc:** `docs/testing-strategy.md` (solo-dev pyramid: Vitest units, xUnit integration via WebApplicationFactory, API-smoke auto-gen, contract-drift, 5 critical Playwright flows). Still valid as the *automation* reference; our exploratory-first charter sits in front of it.
- **.NET tests:** `forge-api/forge.tests/`.

---

## 2A. Definition-of-Correct invariants — the coverage backbone

> Delivered by `[DOM]` (Definition of Correct v2). These are **assertable invariants** — the difference between "happy path renders" and "the books are right." Every PRIMARY-spine charter (C0–C10) probes its invariants; these are also the phase-2 automation targets.
>
> **Assertion layer:** `UI` = drive + observe through the app · `API` = read/assert via the existing `entity-query.helper` layer (`:5000/api/v1`) · `DB` = SQL aggregation against Postgres (`:5432`, `forge`, `postgres/postgres`) because there is **no single UI/API readout** · `QBO` = requires a real QuickBooks sandbox (the current `MOCK_INTEGRATIONS=true` mock can prove seam *behavior* but not cent-*parity*).

| ID | Invariant (assertion) | Layer | How to probe | Model anchor |
|----|------------------------|-------|--------------|--------------|
| **INV-Q1** | Deterministic recompute: same inputs → same total | UI + API | recompute a quote twice, diff total | Quote/QuoteLine |
| **INV-Q2** | Qty-break monotonicity: ↑qty ⇒ ≤ unit price | UI + API | enter ascending qty breaks, read unit price | QuoteLine pricing |
| **INV-Q3** | NRE/setup counted once (not per unit) | API | read quote cost breakdown lines | QuoteLine |
| **INV-Q4** | Setup-vs-run cost separation | API | read structured cost fields | QuoteLine |
| **INV-SO1** | `SO.price == accepted_quote.price` | API/DB | compare SO total vs source quote total | SalesOrder ↔ Quote |
| **INV-SO2** | Qty changes only via audited change order | UI probe + DB | attempt direct SO-line qty edit; verify blocked + audit row written | SalesOrderLine + audit log |
| **INV-J1** | `job.part_rev == SO.part_rev` | API/DB | compare `Job.BomRevisionIdAtRelease` vs SO line rev | Job.BomRevisionIdAtRelease |
| **INV-J2** | `start_qty ≥ order_qty` | API/DB | read job start qty vs SO qty | Job ↔ SalesOrderLine |
| **INV-SF1** | `qty_in = good_out + scrapped + at_op` | DB (+UI to enter) | aggregate production-reporting records per job | Job/JobStage reporting |
| **INV-SF2** | Can't complete more good than `started − scrap` | UI probe + DB | attempt over-complete; verify rejected | Job stage reporting |
| **INV-SF3** | Labor$ posts to originating job only | DB/API | read time entries' job linkage; no cross-post | TimeTracking ↔ Job |
| **INV-INV1** | `on_hand = Σreceipts − Σissues − Σshipments ± adj` | **DB** | aggregate `BinMovement` per part vs `BinContent.Quantity` | BinMovement / BinContent |
| **INV-INV2** | On-hand **never silently negative** | UI probe + DB | over-issue/over-ship; verify error surfaced + qty ≥ 0 | BinContent.Quantity |
| **INV-INV3** | `available = on_hand − allocated`; no over-allocation; no same lot to two jobs | DB + UI probe | attempt double-allocate a lot; verify uniqueness | BinContent.ReservedQuantity / LotRecord |
| **INV-INV4** | UOM exact (no silent conversion drift) | API/DB + UI | run a UOM-converting issue; check stored qty/UOM | (UOM system) |
| **INV-SH1** | `shipped ≤ ordered − already_shipped + tolerance` | UI + API | over-ship probe; `orders/{id}.lines[].quantity` vs `quantityShipped` (already in helper) | SalesOrderLine.quantityShipped |
| **INV-SH2** | Inventory relieved **exactly once** (idempotent) | DB + UI probe | re-trigger/duplicate ship; count BinMovements per line | BinMovement |
| **INV-SH3** | Lot/serial of shipped product recorded | API/DB | read ShipmentLine → lot/serial linkage | ShipmentLine / SerialNumber / LotRecord |
| **INV-IN1** | `invoiced ≤ shipped` | API/DB | compare invoice lines vs shipment lines | InvoiceLine ↔ ShipmentLine |
| **INV-IN2** | Each shipment invoiced **≤ once** | API/DB + UI probe | attempt double-invoice; verify uniqueness | Shipment ↔ Invoice |
| **INV-IN3** | Tax computed once | API/DB | read invoice tax line(s) | Invoice/InvoiceLine |
| **INV-IN4** | Total rounding matches QBO | **QBO** | parity vs sandbox doc (mock can't prove) | Invoice.ExternalId |
| **INV-AR1** | `A/R = Σinvoices − Σpayments − Σcredits` | **DB** | aggregate Invoice/Payment/PaymentApplication/credits; compare to customer balance UI | Payment/PaymentApplication |
| **INV-QBO1** | Each posted invoice/payment ↔ exactly **one** QBO doc; idempotent on retry | API/DB (seam) + QBO (real) | assert `ExternalId` set once, `LastSyncedAt`; re-post → no dup | Invoice.ExternalId/LastSyncedAt |
| **INV-QBO2** | Failed sync **surfaced & retryable, never swallowed** | UI + API/DB | force a sync failure; verify it lands in DomainEventFailures + retry path | DomainEventFailuresController |
| **INV-QBO3** | Amount **parity to the cent** | **QBO** | compare posted amount vs sandbox doc (mock can't prove) | Invoice ↔ QBO |

**Rollup — what each layer covers:**
- **Pure UI** (drive + observe): the *illegal-action probes* (INV-SO2, INV-SF2, INV-INV2, INV-SH1, INV-IN2, INV-QBO2) and the quote-pricing invariants (INV-Q1, INV-Q2).
- **API** (existing helper layer): quote/SO/invoice/shipment totals & line quantities, statuses, `ExternalId`/`LastSyncedAt` — INV-Q3/Q4, SO1, J1, J2, SH1, SH3, IN1, IN2, QBO1(seam).
- **DB-only** (SQL, no single readout): the ledger-math invariants — **INV-INV1, INV-AR1, INV-SF1, INV-SF3, INV-SH2, INV-INV3**. These become a small reusable set of **invariant SQL probes** (also the highest-value automation, since they catch silent corruption the UI will never show).
- **QBO sandbox required** (mock insufficient): **INV-IN4, INV-QBO3**, and the real-doc half of **INV-QBO1**. Blocked under `MOCK_INTEGRATIONS=true`.

---

## 3. System model — the PRIMARY spine (quote-to-cash)

> Fill each stage as charters C0–C10 run. Capture: entities & key fields, the API endpoints, the state machine / status transitions, business rules, and the UI route. This becomes the team's shared mental model of how an order flows from lead to paid.

> `[DISC]` 2026-05-20 — spine filled below from **code/API/DB** (single AppDbContext, MediatR slices in `forge.api/Features/*`). **Runtime/UI behavior still unobserved — no creds yet**, so UI-state claims are code-derived `(code)`, not `(ui)`. Verified flow end-to-end: Lead→Customer→Quote→SO→(auto)Jobs→shop-floor→Shipment→Invoice→Payment **is completable** (one rough edge at Shipment→Invoice, §3.8).

### 3.0 Auth & session
- **Routes** `(code:app.routes.ts)`: `/login`, `/setup` (first-run admin), `/setup/:token` (employee self-setup), `/sso/callback`. Auth routes live directly in `app.routes.ts`, not a feature `routes.ts`.
- **Token model**: ASP.NET Identity + JWT bearer, refresh-token rotation. `(api)` `POST /auth/login`,`/refresh`,`/logout`; `GET /auth/me`,`/status`.
- **4-tier auth** `(api)`: password; kiosk (`/auth/kiosk-login`); NFC (`/auth/nfc-login`); barcode (`/auth/scan-login`) + `/auth/set-pin`.
- **MFA** `(api)`: TOTP/WebAuthn/SMS/Email — `/auth/mfa/{setup,verify-setup,challenge,validate,recovery,recovery-codes,status,disable,devices}`.
- **SSO** `(api)`: `/auth/sso/{providers,login,callback,token-exchange,link,linked,unlink}`.
- **Setup model** `(code)`: admin creates user → system issues setup token → employee self-sets password+PIN. Admin never sets/sees passwords.
- **Role catalogue** `(db)`: 12 roles; in use = Admin, Manager, PM, OfficeManager, Engineer, ProductionWorker, LeadIntake. Client `roleGuard` + server `[RequiresCapability]` (capability gating, §1).

### 3.1 Customer / Lead → conversion
- **Entities** `(code:forge.core)`: Lead, LeadSource, OutreachCampaign, Account, Contact, ContactInteraction, Customer, CustomerAddress, CustomerPortalAccess.
- **Lead lifecycle** `(api)`: bulk intake (`POST /leads/bulk-intake/preview`→`/commit`) → queue (`/leads/queue/pull`, disposition) → campaigns / suppression / samples / accounts.
- **Conversion rule** `(code:Features/Leads/ConvertLead.cs:60)`: `POST /leads/{id}/convert` creates a **Customer** (+contacts, address & outreach carryover, optional Job) — **not** a Quote. Quote comes later via Customer→Quote.
- **UI** `(code)`: `/leads` (+ intake/queue/campaigns/suppression/samples/accounts); `/customers` + `/customers/:id` tabs (overview/contacts/addresses/interactions/quotes/orders/jobs/invoices/estimates/pricing/activity); credit `/customers/{id}/credit-status|credit-hold|credit-release`.
- **Data** `(db)`: 8 leads, 8 customers, 8 contacts.

### 3.2 Quote / Estimate
- **Entities**: Quote, QuoteLine `(code)`.
- **Endpoints** `(api)`: `GET,POST /quotes`; `GET,PUT,DELETE /quotes/{id}`; `POST /quotes/{id}/send|accept|reject|convert`.
- **States** `(code:ConvertQuoteToOrder.cs)`: Draft → Sent → Accepted/Rejected. **Convert requires status=Accepted.** Pricing invariants INV-Q1..Q4.
- ⚠ **Estimates duality** `(api)`: a parallel `/estimates` resource with its own `POST /estimates/{id}/convert` (QBO term). Relationship to `/quotes` unconfirmed → §7.
- **UI** `(code)`: `/quotes` list + detail dialog. **Data** `(db)`: 7 quotes, 5 quote_lines.
- **UI render census** `(ui)` 2026-05-20 `[ENG]`: `/quotes` **REAL, not a stub** — list + detail dialog both render against the seed, no page/console errors of its own. ⚠ list (`GET /quotes`) returns **only 4 rows, all `Accepted`**, though DB has 7 → likely a server-side status filter / converted-exclusion (UI faithfully renders the API; not a client defect) → §7. Tax-rate float-render bug on detail = AUDIT **F-022** (fixed).

### 3.3 Sales Order
- **Entities**: SalesOrder, SalesOrderLine (key field **ShippedQuantity**) `(code)`.
- **Conversion** `(code:ConvertQuoteToOrder.cs:11)`: copies accepted-quote lines into a new SalesOrder (price-lock anchor INV-SO1).
- **Endpoints** `(api)`: list `GET /sales-orders`; CRUD/actions under **`/orders`**: `POST /orders`, `GET,PUT,DELETE /orders/{id}`, `POST /orders/{id}/confirm|cancel`, `/orders/recurring`. ⚠ **dual prefix** → §7.
- **States** `(code:GetSalesOrdersList.cs)`: Draft → Confirmed → In Production → Shipped → Invoiced/Sent → Payment Received → Completed. **Event-driven** via job-stage (`OnJobStageChanged_UpdateSoStatus`) + shipment (`OnShipmentCreated_UpdateSalesOrder`).
- **Confirm = production trigger** `(code:OnSalesOrderConfirmed_AutoCreateJobs.cs:15)`: `POST /orders/{id}/confirm` publishes `SalesOrderConfirmedEvent` → auto-creates **one Job per SO line** (default TrackType + first stage) + barcodes + kanban broadcast.
- **Data** `(db)`: 16 sales_orders, 21 lines.
- **UI render census** `(ui)` 2026-05-20 `[ENG]`: `/sales-orders` **REAL** — list renders (default page size **25**, paginated) + rich 8-tab detail dialog (Overview/Line Items/Schedule/Shipments/Returns/Documents/Invoices/Activity) with fulfillment counters + barcode-gen. SO detail renders tax as `{{ taxRate }}%` (no ×100) vs quote/invoice — latent unit inconsistency, AUDIT **F-023**.

### 3.4 Job / Production order
- **Entities** `(code)`: Job, JobStage, JobSubtask, JobPart, JobNote, JobLink, JobActivityLog, ProductionRun, Operation, OperationMaterial, MaterialIssue.
- **Creation**: auto from SO confirm (§3.3); also manual via Job dialog. `GET,POST /jobs`, `GET,PUT /jobs/{id}`.
- **Production sub-flow** `(api)`: `POST /jobs/{id}/handoff-to-production`, `/explode-bom`; `GET /jobs/{id}/bom-at-release`; `GET,POST /jobs/{id}/production-runs`; subcontract `POST /jobs/{jobId}/operations/{opId}/send-out`; cost `/cost-summary`, `/recalculate-costs`.
- **BOM-at-release**: `Job.BomRevisionIdAtRelease` pins the rev (INV-J1 anchor).
- **States**: kanban stages per TrackType `(db: 3 track_types, 20 job_stages)`; `PATCH /jobs/{id}/stage`; bulk `PATCH /jobs/bulk/{stage,assign,priority,archive}`. Stages may be irreversible and/or carry `AccountingDocumentType` (drives QBO doc creation — §3.8/§3.10).
- ⚠ **UI: no standalone `/jobs/:id` route** `(code)` — jobs surfaced via `/kanban` + `/backlog`; detail is a **dialog** (JobDetailDialogComponent).
- **Data** `(db)`: 57 jobs.

### 3.5 Shop-floor execution
- **Kiosk** `/display/shop-floor` `(api/code)`: `identify-scan` (RFID/barcode+PIN) → `assign-job` → `complete-job`; `clock`/`clock-status`. Clock kiosk `/display/shop-floor/clock`; scan flows `/shop-floor/scan`, `/scan-log`.
- **Time** `(api)`: `POST /time-tracking/timer/start|stop`; labor posts to originating job (INV-SF3 anchor).
- **Stage events** `(code)`: `OnJobStageChanged_CheckShipReady` raises a ship-ready follow-up when all jobs for an SO line reach a completion stage; `OnJobStageChanged_UpdateSoStatus` advances SO status. Reporting invariants INV-SF1/SF2.
- **Data** `(db)`: 60 time_entries.

### 3.6 Inventory  ⚠ API-thin UI; stock data present; material-issue path unexercised
- **on_hand is NOT a ledger** `(code:AtpService.cs:20, InventoryRepository.cs:226)`: computed as `Σ BinContents.Quantity where Status=Stored`. The `−Σshipments` term is **structurally absent** → bears on INV-INV1.
- **Material consumption = MaterialIssue to a job** `(api/code:CreateMaterialIssue.cs:55)`: `GET,POST /jobs/{id}/material-issues`, `POST …/{issueId}/return`. Per-bin guard ≥0 (INV-INV2). This — **not shipment** — is the only outbound stock consumption.
- **available = on_hand − allocated** enforced only at bin level `(code:CreateReservation.cs:37-40, BinContent.ReservedQuantity)`; SO-line allocation is **soft** (backorders allowed). Two allocation notions (bin Reserved vs SO-line) **unreconciled** → INV-INV3 risk.
- **ATP** read-only projection `(api)`: `GET /inventory/atp/{partId}` (+ `/timeline`) — **disabled by `CAP-PLAN-ATP`** in this install → 403.
- **Data — corrected** `(db)` 2026-05-21 `[DISC]`: `bin_contents`=**12 rows** with real on-hand quantities (e.g. M-001: 200 on-hand in BIN-001, M-002: 200 in BIN-002, P-1001: 30 in BIN-003). `bin_movements`=32 rows. `material_issues`=1 row. **Earlier `bin_contents=0` claim was stale** (data was loading during investigation). Inventory stock IS seeded; module is structurally exercisable.
- **UI** `(code)`: `/inventory/{stock,locations,movements,receiving,stockOps,cycleCounts,reservations,replenishment,uom}` — REAL components with real data; `GET /inventory/reservations` → 403 (`CAP-PLAN-ATP`). Remaining highest risk: material-issue path (API endpoint exists, 0 material-issues against active jobs — has never been exercised in this demo run).
- **`kanban_cards` table disambiguation** `(db)` 2026-05-21 `[DISC]`: `kanban_cards=0 rows` is **NOT a production kanban concern**. The `kanban_cards` table is a **lean-manufacturing replenishment** concept (fields: `bin_quantity`, `number_of_bins`, `lead_time_days`, `supply_source`) — entirely separate from the job board. The **production kanban board is driven by `jobs.current_stage_id + jobs.board_position`** directly. With 57 jobs in DB and `GET /display/shop-floor` returning active jobs by stage, the production kanban is functional. The lean replenishment subsystem is unimplemented (0 cards, 0 trigger logs).

### 3.7 Shipment
- **Entities**: Shipment, ShipmentLine, ShipmentPackage `(code)`.
- **Create** `(code:CreateShipment.cs:41)`: `POST /shipments` validates remaining qty (**partial shipments supported** — checks `ShippedQuantity` vs ordered at `CreateShipment.cs:102`), publishes `ShipmentCreatedEvent`. **Ship** `POST /shipments/{id}/ship` (status flip), `/deliver`.
- ⚠ **Shipment does NOT relieve inventory** `(code:ShipShipment.cs, Features/Shipping/*)`: ship/pick-confirm/pick-complete never decrement bins → contradicts INV-SH2 / INV-INV1 (§7).
- ⚠ **Defect candidate (→ AUDIT):** `SalesOrderLine.ShippedQuantity` incremented **twice** per shipment — inline `CreateShipment.cs:78` *and* again in `OnShipmentCreated_UpdateSalesOrder.cs:38` on the same scoped DbContext → 2× shipped qty, premature "Shipped" status, distorted ATP. Confirmed in code; QA to file/confirm.
- Carrier rates/label/tracking synchronous, **mocked** `(api/code)`. Lot/serial on shipped product: INV-SH3 (ShipmentLine→lot/serial).
- **Data** `(db)`: 15 shipments, 20 shipment_lines.
- **UI render census** `(ui)` 2026-05-20 `[ENG]`: `/shipments` **REAL** — list (15 rows) + detail dialog (status, tracking #, carrier, linked SO/invoice, TRACK button). Detail's "Linked Invoice" shows the **raw PK `#4`** not `INV-2401` (DTO lacks `invoiceNumber`) — AUDIT **F-024**.

### 3.8 Invoice — **invoicing is decoupled from shipment** (key model nuance)
- **Two creation paths** `(api/code)`: (1) **job-stage driven** — when a Job enters a stage whose `JobStage.AccountingDocumentType = Invoice`, the accounting sync creates the doc (`MoveJobStage.TryEnqueueAccountingDocumentAsync`); (2) manual / from-job — `POST /invoices`, `POST /invoices/from-job/{jobId}`, `GET /invoices/uninvoiced-jobs`.
- ⚠ **No shipment→invoice trigger**: `ShipmentCreatedEvent` only updates SO status. No "invoice this shipment" UI action; manual dialog exposes raw numeric `salesOrderId`/`shipmentId` (no picker) `(code)`.
- ⚠ **`invoiced ≤ shipped` NOT enforced** `(code:CreateInvoice.cs)`: arbitrary line qty, no shipment/SO reconciliation → contradicts INV-IN1; **partial-shipment-invoicing question open** (§7).
- **Standalone vs integrated** `(code/docs ⚡ ACCOUNTING BOUNDARY)`: editable in standalone; **read-only when an accounting provider is connected** (reads `GET /accounting/status`).
- **Endpoints** `(api)`: `GET,POST /invoices`; `GET,DELETE /invoices/{id}`; `POST /invoices/{id}/send|email|void`; `GET /invoices/{id}/pdf`. Invariants INV-IN2/IN3/IN4.
- **Data** `(db)`: 15 invoices, 20 invoice_lines.
- **UI render census** `(ui)` 2026-05-20 `[ENG]`: `/invoices` **REAL** — list (15 rows) + detail dialog (status, SO/shipment links, due date, balances: subtotal/tax/total/amount-paid/balance-due, activity). Tax-rate float-render bug = AUDIT **F-022** (fixed; several seeded invoices have non-zero tax — `INV-2321A` 5.6%, `INV-2331` 7.25%). Minor: invoice line PART# can render `—` when the line has no part FK.

### 3.9 Payment
- **Entities**: Payment, PaymentApplication `(code)`.
- **Create** `(code:CreatePayment.cs:40)`: `POST /payments` with `Applications[]` (invoiceId+amount) → recomputes balance, flips invoice Paid/PartiallyPaid. `GET,DELETE /payments/{id}`.
- A/R invariant INV-AR1 (Σinvoices − Σpayments − credits) — DB-only probe.
- **Data** `(db)`: 14 payments, 14 payment_applications.
- **UI render census** `(ui)` 2026-05-20 `[ENG]`: `/payments` **REAL** — list (14 rows) + detail dialog (method, reference #, amount/applied/unapplied, applications table linking invoice + amount). Renders cleanly against the seed.

### 3.10 QBO sync (all MOCK today)
- **Provider selection** `(code)`: `AccountingProviderFactory` resolves from `system_settings.accounting_provider`; per-integration `{provider}.mode`, global `MOCK_INTEGRATIONS=true` fallback; `IntegrationModeBootstrap` at startup. **No real external call path has executed in this env** `(env/db)`.
- **Triggers → queued via `sync_queue_entries` table** (correct name; earlier notes said `sync_queue` — **wrong**) `(db)` 2026-05-21 `[DISC]`. Drained by `SyncQueueProcessorJob`. Triggers: Customer create→CreateCustomer; Part create/update→CreateItem/UpdateItem; **Job→accounting-doc stage→CreateEstimate/CreateInvoice/CreatePurchaseOrder**; Timer stop→CreateTimeActivity; Expense approved→CreateExpense. Part↔QBO item: `POST,DELETE /parts/{id}/link-accounting-item`.
- **Connection guard in stage handler** `(code:MoveJobStage.cs:124-132)`: `TryEnqueueAccountingDocumentAsync` calls `accountingService.TestConnectionAsync()` first — if not connected, it silently skips. Under `CAP-ACCT-EXTERNAL` disabled, this guard always skips. So `sync_queue_entries=0` in this install is expected `(db)` — confirmed 2026-05-21 `[DISC]`.
- ⚠ **TWO dispatch mechanisms**: accounting rides **`sync_queue_entries`** (wired); email rides **`integration_outbox_entries`** via `IntegrationOutboxDispatcherJob` (wired **for email only**). In that dispatcher the **DocuSeal/QuickBooks/Shipping/Webhook/SMS branches throw `NotImplemented`** — dead code vs intended consolidation? → §7.
- ⚠ **Double accounting document risk** `(code:MoveJobStage.cs:152-172)`: `job_stages` id=8 ('Shipped') and id=9 ('Invoiced/Sent') **both carry `accounting_document_type=3` (Invoice)**. Idempotency key is `"CreateInvoice:Job:{id}"` but no unique constraint exists on the outbox table (per BE-2a proposal in §8). If a job progresses through both stages while QB is connected, two CreateInvoice documents with the same key would be dispatched → duplicate QB invoices. Latent under current disabled-accounting config. See AUDIT F-048.
- **Status / error surface** `(api/code)`: `GET /accounting/status`, `/accounting/sync-status`; admin **Integration Outbox panel** (`GET /admin/integration-outbox`, `…/{id}/retry|discard`); failures → `DomainEventFailures` (INV-QBO2 anchor). Setup: `/admin` integrations panel, `/setup-integrations` wizard.
- Invariants needing **real QBO sandbox** (mock insufficient): INV-IN4, INV-QBO1 (real-doc half), INV-QBO3.

---

## 4. System model — SECONDARY areas (blocker-sweep depth)
_(Procurement/PO, admin/users/roles — capture only what we trip over while sweeping for blockers. Scope locked by `[ORCH]` 2026-05-20.)_

> Note: lot/serial **that touches shipped product** is PRIMARY, not secondary — captured under §3.6/§3.7.

---

## 5. Record-only areas — log what we trip over, don't pursue
_(LOCKED by `[ORCH]` 2026-05-20: backend-built but UI-thin / zero data — one line each if encountered, with a pointer; no investigation.)_
_Quality suite (NCR/CAPA/SPC/FMEA/PPAP) · MRP · scheduling · deep inventory (ABC/replenishment/inter-plant/consignment/cycle-count) · payroll/HR · maintenance · EDI/IoT · AI assistants · voice · non-QBO adapters._

---

## 6. Cross-cutting facts
`[DISC]` 2026-05-20 (terminology/labels, soft-delete, multi-currency still TBD):
- ⚠ **Empty `Forge.*` shell-project trap** `(code/db)`: `Forge.{Identity,Sales,Production,Procurement,Inventory,Quality,People,Maintenance,MasterData,Operations,Insights}` each contain **0 `.cs` files** (post-reversal cruft — a vertical-slice refactor was attempted and reversed, TODO.md 2026-05-20). **Real code:** `forge.api/Features/*` (104 vertical slices, 1,468 `.cs`), entities in `forge.core` (1,322 `.cs`), single `AppDbContext` in `forge.data`, adapters in `forge.integrations`. **Do not navigate by module folder** — the recon "11 modules" framing points at empty dirs.
- **Surface size (ground truth)**: `(api)` 904 paths / 1,168 ops / 1,159 DTOs / 133 controllers · `(db)` 251 EF entities / 96 migrations / 259 tables · `(code)` 48 UI feature areas / ~176 routes.
- **Seed/data shape** `(db, 2026-05-21 verified)`: `SEED_DEMO_DATA=true`, `MOCK_INTEGRATIONS=true`, `ASPNETCORE_ENVIRONMENT=Development`. Spine data: 24 users · 8 leads (CAP-disabled) · 7 quotes (4 visible, others converted/filtered) · 16 SOs · 15 shipments · 15 invoices · 14 payments · 57 jobs · 8 customers · 5 vendors · 12 parts · 3 POs. Inventory: `bin_contents`=12 rows (real stock positions), `bin_movements`=32, `material_issues`=1. Tier-2 ~empty (no quality/MRP/scheduling rows). `document_embeddings`=173K is the pgvector RAG index, **not** business data. `sync_queue_entries`=0, `integration_outbox_entries`=0 (all integrations mocked/bypassed).
- **Two-tier maturity** `(code/db)`: spine = REAL + data-backed; tier-2 (quality/MRP/scheduling/deep inventory) = backend-built, UI-thin, ~0 data. (Scope locked to spine by `[ORCH]`.)
- **Real-time / jobs** `(code)`: SignalR hubs `/hubs/*` (Board, Notification, Timer, Chat); background work via Hangfire + the two integration dispatchers (§3.10).

---

## 7. Open questions & contradictions
_(append with `?`; resolve by editing the relevant §3–§6 fact and striking the question.)_

- `?` `[QA]` Is the currently-running instance the same build DevOps will publish as the demo-seeded instance, or will that be a fresh reseed? (Determines whether a preliminary Golden-Thread run now is reproducible.)
- ✓ `[QA]` Active capability preset & which `CAP-*` flags are off — **resolved 2026-05-21 `[DISC]`**. See §1 capability table. Disabled: `CAP-O2C-LEAD`, `CAP-O2C-CREDIT-LIMITS`, `CAP-MD-CUSTOMER-INTERACTIONS`, `CAP-PLAN-ATP`, `CAP-ACCT-EXTERNAL`.
- `?` `[DISC]` **Partial-shipment invoicing** (spine-critical; `[DOM]` to rule). Invoicing is **decoupled from shipment** — no shipment→invoice trigger, and `invoiced ≤ shipped` is unenforced `(code:CreateInvoice.cs)`. Invoices originate from **job-stage** (`AccountingDocumentType`) or manual/from-job; nothing ties invoice qty to shipped qty. So a partial shipment is neither specifically invoiceable nor blocked — the model simply isn't shipment-driven. Need a ruling on whether job-stage invoicing is correct for a job shop, + QA runtime confirm when creds land. Contradicts INV-IN1 / INV-IN2.
- `?` `[DISC]` **Shipment doesn't relieve inventory** `(code:ShipShipment.cs)` and on_hand omits `−Σshipments` `(code:AtpService.cs)` — only job MaterialIssue decrements stock. Is finished-goods shipment meant to decrement on_hand, or is stock tracked only to material-issue? `[DOM]` ruling needed. Contradicts INV-SH2 / INV-INV1. (Related defect — `ShippedQuantity` double-count, §3.7 — for AUDIT.)
- `?` `[DISC]` **Quotes vs Estimates** — two resources (`/quotes` + `/estimates`, both with `/convert`). One concept or two surfaces?
- `?` `[DISC]` **`/orders` vs `/sales-orders`** dual route prefix for one resource — intentional or drift?
- `?` `[DISC]` **IntegrationOutbox** QB/DocuSeal/Shipping/Webhook/SMS branches throw `NotImplemented` while accounting uses `sync_queue_entries` (§3.10) — dead code or intended consolidation? (Table name corrected from `sync_queue` → `sync_queue_entries`.)
- `?` `[ENG]` **`/quotes` list returns only 4 of 7** seeded quotes, all `Accepted` (verified `(ui)`+`(api)` 2026-05-20). Is `GET /quotes` applying a default server-side status filter (e.g. excluding `Draft`/`ConvertedToOrder`), or has GT/test activity converted the others? UI renders the API faithfully — question is the intended list semantics. (Bears on §3.2.)
- `?` `[ENG]` **`taxRate` unit contract** — quote/invoice DTOs return a **fraction** (`0.029`); does the sales-order DTO return a fraction or an already-scaled percent? Determines whether SO's `{{ taxRate }}%` render is correct or a latent bug (AUDIT F-023). No seeded non-zero-tax SO to settle it from the UI.
- `?` `[ENG]` **`GET /admin/integrations/{provider}` → 405** `(api)` 2026-05-21 `[DISC]`. Called as `GET /admin/integrations/quickbooks`, returns 405. The correct path may be `GET /admin/integrations` (list all) or `GET /admin/integrations/{numericId}`. The Angular `quickbooks.service` calls `GET /admin/integrations/{provider}` by name — either the frontend assumption is wrong or the route changed. Worth an ENG verify before enabling accounting.
- `✓` `[DISC]` **`/orders/recurring` → 404** `(api)` 2026-05-21. This endpoint does not exist in the current build. `/sales-orders/recurring` also returns 404. The recurring orders UI route exists in the frontend but the backing endpoint is absent.
- `✓` `[DISC]` **`GET /customers/{id}/contacts` → 405 Allow: POST** `(api)` 2026-05-21. By design — contacts are embedded in `GET /customers/{id}` response. `POST /customers/{id}/contacts` is the write endpoint. Not a bug; design confirmed.
- `✓` `[DISC]` **`GET /shipments/{id}/rates` → 405** `(api)` 2026-05-21. POST-only endpoint (to request rates for a shipment package/address). Not a bug.
- `✓` `[DISC]` **Job detail response has no `salesOrderId` field** `(api)` 2026-05-21. The job-detail DTO does not expose the originating SO ID. Jobs can be linked to customers and SO lines (though F-043 confirms those links are absent in seed data). A navigation link from job → source SO is absent from the job detail response regardless of seeding. Minor UX gap noted.
