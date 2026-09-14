---
title: Lead-to-ledger role-based test plan
type: delivery
status: in-progress
id: lead-to-ledger-role-test-plan
updated: 2026-09-09
---

# Lead-to-ledger role-based test plan

> One order, walked end to end by the people who would actually touch it: lead intake → PM → office → shop floor → office → controller. Each hand-off is a test stage with the role, the screen, the API, the preconditions, the expected state, the expected journal, and the things that must be refused. Fills the gap the golden-path specs leave open: nothing today asserts GL entries under `CAP-ACCT-FULLGL` (AUDIT-TRACKER F-9: three paid invoices, zero journal entries).

## 1. Scope and oracle

**In scope:** Lead → Customer → Estimate → Quote → Sales Order (with acceptance proof) → Jobs → material issue → production receipt → production-cost close → Shipment → Invoice → Payment → trial balance / P&L / period close. One procure-to-pay side leg supplies the raw material so the inventory accounts reconcile.

**Out of scope:** QBO external accounting (`CAP-ACCT-EXTERNAL`), payroll, FX, fixed assets, customer portal beyond one acceptance path, RMA (no posting exists — see §8).

**Oracles, in priority order:**
1. Illegal transition or wrong role ⇒ `403`/`409`, never `500` and never a silent success.
2. Every posting journal exists exactly once, keyed by its idempotency key, balanced, in the active book, in an open period.
3. The trial balance nets to zero and matches the worked example in §6.
4. Operational state advances exactly as the status writers define it (SO status has five writers and no others).

Two full passes are required: **Pass L (lit)** with FULLGL on, asserting journals; **Pass D (dark)** with FULLGL off, asserting the same operational outcomes and **zero** rows in `acct_journal_entries`.

## 2. Environment

Local stack per `forge-local-stack` (api :5000, pg :5433). Seed with `SEED_DEMO_DATA=true`.

### 2.1 Users

Seeded (`forge.api/Data/SeedData.cs:116-177`): `admin@forge.local` (Admin), `lwilson@forge.local` (Manager), `pmorris@forge.local` (PM), `cthompson@forge.local` (OfficeManager), `akim@forge.local` (Engineer), `bkelly@forge.local` (ProductionWorker), `lead-intake-system@forge.local` (LeadIntake, API-key only).

**Create by hand before starting** (no seed exists): `controller@forge.local` with the single role **Controller**, and `buyer@forge.local` with the single role **Procurement**. Give each exactly one role so the role-landing tests in §7 are meaningful. Role names with spaces (`IT Admin`, `Production Manager`, `Production Planner`) are not used in this plan.

### 2.2 Capabilities (Admin, `/admin/capabilities`)

Default-off caps this thread needs, in the order they can be enabled:

| Step | Capability | Note |
|---|---|---|
| 1 | `CAP-O2C-LEAD` | leads are off by default |
| 2 | `CAP-ACCT-GL-VIEW` | unlocks `/accounting` and read endpoints |
| 3 | `CAP-ACCT-MIGRATION` | only cap with `RequiresRoles: Admin`; unlocks conversion endpoints |
| 4 | *(Controller)* `POST /api/v1/accounting/conversion/opening-journal` | one balanced `Source=Conversion` entry per active book, can be all-zero lines against RETAINED_EARNINGS; then `GET .../tie-out` |
| 5 | `CAP-ACCT-FULLGL` | must **409 `capability-gl-opening-balances`** before step 4 and succeed after — that 409 is test L-0.1 |
| 6 | `CAP-ACCT-PERIOD`, `CAP-RPT-FINANCIALS` | period close + P&L/BS/CF |
| 7 | `CAP-O2C-SO-ACCEPTANCE` | **the acceptance gate is invisible when off**; enable it or stage 6's negative cases pass vacuously |
| opt | `CAP-O2C-CREDIT-LIMITS`, `CAP-O2C-RMA` | for the gap probes in §8 only |

Pass D = same set minus `CAP-ACCT-FULLGL` and `CAP-ACCT-PERIOD`. Note startup: `GlDeterminationStartupValidator` throws at boot when FULLGL is on and any determination key is unmapped. If the API crash-loops after step 5, that is the finding, not the environment.

### 2.3 Master data

| Item | Value | Why |
|---|---|---|
| Book | one active book, functional currency USD, `DefaultCostingMethod=Standard` | every posting service takes the first active book |
| Fiscal calendar | current year, current period **Open** | posts into a HardClosed period are rejected |
| Raw part `RM-100` | `InventoryClass=Raw`, standard **$15.00** (via `ManualCostOverride` or receipt) | material leg |
| Work center `WC-MILL` | `LaborCostPerHour=40`, `BurdenRatePerHour=20` | labor + overhead legs |
| FG part `FG-200` | `InventoryClass=FinishedGood`, `ProcurementSource=Make`; BOM = 2 × RM-100; routing = 1 op on WC-MILL, `EstimatedMs` = 30 min | standard = 30 material + 20 labor + 10 OH = **$60.00** |
| Cost roll | `POST /api/v1/parts/{FG-200}/recalculate-standard-cost` as Engineer; assert `CurrentCostCalculation.ResultAmount == 60` | without it COGS and FG receipt legs are skipped, silently |
| Carriers | `Will Call` (manual, no scan); `Scan-Probe` (manual, `RequiresScanToShip=true`) | stage 9 negatives |
| Track type | default active track with a stage `Code == "order_confirmed"`, a stage whose name contains "Production", and a final stage whose name contains "Ship" | these strings are load-bearing (`OnSalesOrderConfirmed_AutoCreateJobs`, `OnJobStageChanged_UpdateSoStatus`, `CreateShipmentFromSalesOrder`) |
| Vendor `V-ACME` | any | P2P side leg |
| Customer tax | the converted customer is **tax-exempt** with a `TaxExemptionId` | keeps SALES_TAX_PAYABLE out of the worked example; run one taxed variant in §8 |

## 3. Personas and hand-offs

| # | Persona | Seed user | Lands on | Owns in this thread | Must be refused |
|---|---|---|---|---|---|
| P0 | Lead intake service | `lead-intake-system@` (API key) | n/a | bulk-intake preview/commit | any other lead mutation (per-method `Admin,Manager,PM` composes AND → 403) |
| P1 | Project Manager | `pmorris@` | `/backlog` | lead triage + convert, estimate, quote, SO create | SO stage complete/ship (`SalesOrderStagesController` omits PM), shipments, invoices, payments, GL |
| P2 | Office Manager | `cthompson@` | `/customers` | customer setup, send/accept quote, confirm SO, shipment, invoice, payment | leads (guard Admin/Manager/PM), any `AccountingGlController` call |
| P3 | Engineer | `akim@` | `/parts` | parts, BOM, routing, cost roll | quotes, SO, shipping, invoicing |
| P4 | Production Worker | `bkelly@` | `/kanban` | kanban stage moves, material issues, production runs, receive-to-stock | job reassign/split/dispose (`Admin,Manager`), cost summary (`:393` list omits ProductionWorker) |
| P5 | Procurement | `buyer@` | `/purchasing` → **bounced to `/dashboard`** (guard omits Procurement) | PO **short-close only** — the single Procurement grant in the repo (`PurchaseOrdersController.cs:117`) | PO create, receive, everything else (class-level is Admin/Manager/OfficeManager) |
| P6 | Controller | `controller@` | `/accounting` → **bounced to `/dashboard`** (guard omits Controller) | opening journal, close production cost, journal approve/reverse, statements, period close | none of the O2C mutations (Controller is not on any O2C controller) |
| P7 | Manager | `lwilson@` | `/dashboard` | approvals, cancel SO, job reassign | GL posting (`Admin`/`Manager` are denied by `CurrentUserCapabilities` — every `GlCapability` maps to Controller only) |
| P8 | Admin | `admin@` | `/dashboard` | capability toggles, users, settings | **GL posting** (explicitly denied), reaching `/accounting` screens then 403 from every API call |

The two "bounced" rows and the two "reach the screen, 403 from the API" rows are real mismatches found while writing this plan (`role-landing.model.ts:13-23` vs `app.routes.ts:198`; `AccountingGlController.cs:32`). They are expected results here and filed as findings in §9.

## 4. The thread (Pass L)

Every stage lists: role → UI route → API → preconditions → steps → expected state → expected journal → negatives. Record every id as you go (`LEAD`, `CUST`, `EST`, `QUO`, `SO`, `JOB`, `MI`, `RUN`, `SHP`, `INV`, `PAY`, `PO`); the evidence queries in §6 use them.

### Stage 0 · Go-live gate (Controller + Admin)

- **L-0.1** Admin toggles `CAP-ACCT-FULLGL` before any opening journal → `409 capability-gl-opening-balances`.
- **L-0.2** Controller posts the opening journal (`POST /api/v1/accounting/conversion/opening-journal`) → 201; `GET .../tie-out` balances; row in `acct_journal_entries` with `source='Conversion'`, `status='Posted'`, idempotency key `Conversion:OpeningBalance:{bookId}` (or `Conversion:Book:{bookId}:OPENING` — record which).
- **L-0.3** Same POST again → idempotent, still one row.
- **L-0.4** Admin toggles FULLGL → 200. API stays up (determination validator satisfied).
- **L-0.5** Admin toggles FULLGL **off** then on again → both succeed; disable is ungated.

### Stage 1 · Lead intake (P0 service, then P1)

- Route `/leads/intake`, `/leads/queue`. API `POST /api/v1/leads`, `POST /leads/bulk-intake/preview|commit`, `POST /leads/queue/pull`, `PATCH /leads/{id}`.
- **L-1.1** P0 commits a bulk intake of one lead via API key → lead exists, `Status=New`.
- **L-1.2** P0 `PATCH /leads/{id}` → 403 (method-level roles compose AND with the class-level LeadIntake grant).
- **L-1.3** P1 pulls the queue, sets `Contacted` then `Quoting` → free-form transitions accepted.
- **L-1.4** P2 (OfficeManager) opens `/leads` → redirected to `/dashboard`; `GET /api/v1/leads` → 403.
- **L-1.5** With `CAP-O2C-LEAD` off, `GET /api/v1/leads` → 403 from the capability gate, for Admin too.

### Stage 2 · Convert lead → customer (P1)

- Route `/leads` detail panel, `lead-convert-btn` (one click, no wizard since 2026-05-31). API `POST /leads/{id}/convert`.
- Precondition: `IsTaxExempt=true` requires `TaxExemptionId`; address block all-or-nothing.
- **L-2.1** Convert with `createJob:false` → 201; `Customer` created, `Lead.Status=Converted`, `Lead.ConvertedCustomerId` set, activity `lead-converted` logged.
- **L-2.2** Convert again → 409 (already converted). Mark lead `Lost` on another lead, convert → 409.
- **L-2.3** `PATCH` a Converted lead back to `Contacted` → rejected (terminal).
- **L-2.4** Convert with `IsTaxExempt=true` and no `TaxExemptionId` → 400 validation, no partial customer (single transaction).
- No journal. Assert `acct_journal_entries` count unchanged.

### Stage 3 · Customer setup (P2)

- Route `/customers/{id}/…`. API `PUT /customers/{id}`, `POST /customers/{id}/contacts`, `/credit-hold`, `/credit-release`, `GET /credit-status`.
- **L-3.1** P2 adds shipping address, a contact with email (needed for public acceptance), credit limit 10,000.
- **L-3.2** P2 places a credit hold, then proceeds to Stage 4 anyway. **Expected: nothing downstream is blocked.** Credit hold is advisory only (no O2C handler reads `IsOnCreditHold`). File as gap G-1 if that surprises the product owner; the test asserts current behavior. Release the hold before Stage 9 so the run is clean.
- **L-3.3** P4 (ProductionWorker) `PUT /customers/{id}` → 403.

### Stage 4 · Estimate → Quote (P1)

- Route `/quotes` (all dialogs). API `POST /estimates`, `POST /estimates/{id}/lines`, `POST /estimates/{id}/convert`, `PUT /quotes/{id}`.
- **L-4.1** Create estimate for `CUST`, one line 2 × FG-200 @ $100 → `Type=Estimate`, `Status=Draft`.
- **L-4.2** Convert estimate → quote `QUO` with `SourceEstimateId=EST`; estimate `Status=ConvertedToQuote`.
- **L-4.3** Convert the same estimate again → 409.
- **L-4.4** Convert while eliminating every line → 409 ("can't eliminate every line").
- **L-4.5** Create a quote with zero lines → 400 (`Lines` NotEmpty); `TaxRate=1.0` → 400.
- **L-4.6** P4 `POST /quotes` → 403.

### Stage 5 · Send and accept the quote (P2, then the customer)

- API `POST /quotes/{id}/send-email` (**not** `/send` — only the email path snapshots terms), `POST /quotes/{id}/accept`, `/reject`.
- **L-5.1** P2 sends by email → `Status=Sent`, `QuoteTermsSnapshot` row exists.
- **L-5.2** Control: a second quote sent via plain `POST /send` → `Sent` but **no** terms snapshot. Record as gap G-2 (asymmetry).
- **L-5.3** Accept from Draft (a third quote) → 409. Send it, reject → `Declined`; accept a Declined quote → 409.
- **L-5.4** Customer accepts `QUO` online (portal or the emailed link) → `Status=Accepted`, `AcceptedByContactId` set. If the portal path isn't available in the environment, accept as P2 and note that L-6.2 will then need a manual attestation.

### Stage 6 · Convert to sales order, prove intent, confirm (P2)

- Route `/sales-orders` detail panel, tabs `acceptance`, `lines`. API `POST /quotes/{id}/convert`, `GET /orders/{id}/acceptance`, `POST /orders/{id}/acceptance` (manual proof), `POST /orders/{id}/confirm`, `GET /orders/{id}/authorization`.
- **L-6.1** Convert `QUO` → `SO` `Status=Draft`, `QuoteId=QUO`, `Quote.Status=ConvertedToOrder`, tax rate / CustomerPO / shipping address carried forward. Convert again → 409.
- **L-6.2** If accepted online in L-5.4: an `Accepted`/`QuotePortal` attestation already exists; `GET /authorization` returns the "Authorized by" line. Otherwise: confirm → **409** (acceptance gate), then P2 records a manual `Verbal` acceptance (the only method that needs no document), confirm → 200.
- **L-6.3** Record a manual `Email` acceptance with no document → 400 validation.
- **L-6.4** Revoke the attestation (`DELETE .../acceptance/{aid}`) on a **second** draft SO, confirm → 409. Re-attest, confirm → 200.
- **L-6.5** Confirm `SO` → `Status=Confirmed`; `SalesOrderConfirmedEvent` fans out: jobs auto-created at stage `order_confirmed` (one per line), follow-ups + milestones created, payment schedule advanced. `POST /confirm` again → 409 (only from Draft).
- **L-6.6** P1 (PM) confirms a Draft SO → 200 (PM is on `SalesOrdersController`). P1 `POST /sales-order-stages/{id}/complete` → 403.
- **L-6.7** Cancel: a Confirmed SO can be cancelled; a Shipped one cannot (test after Stage 9 on `SO`: → 409).
- No journal yet. Assert count unchanged.

### Stage 6b · Procure the material (P5, P2, P6) — side leg

- API `POST /purchase-orders`, `POST /purchase-orders/{id}/receive` (`ReceiveItems`), vendor bill approve, vendor payment.
- **L-6b.1** P5 (Procurement) `POST /purchase-orders` → **403**. P2 creates the PO for 4 × RM-100 @ $15 from V-ACME. P5 `POST /purchase-orders/{id}/short-close` on a throwaway PO → 200 (its only grant). Record as finding §9.4: a buyer role that cannot buy.
- **L-6b.2** Receive 4 → journal `Inventory:Receipt:{PO}:{receiptNumber}:RECEIPT`: **Dr INVENTORY_RAW 60.00 / Cr GRNI 60.00**, no PPV (PO price = standard). Receive via the inventory-tab path on a second PO and assert the same shape (asymmetry closed 2026-08-24).
- **L-6b.3** Controller approves the vendor bill (3-way) → `AP:VendorBill:{id}:BILL`: **Dr GRNI 60 / Cr AP_CONTROL 60** (party = vendor). Over-bill (qty 5) → `GRNI_INSUFFICIENT`.
- **L-6b.4** Vendor payment $60 by check → `AP:VendorPayment:{id}:PAYMENT`: **Dr AP_CONTROL 60 / Cr CASH 60**. (Electronic method would credit CASH_IN_TRANSIT instead — one variant in §8.)

### Stage 7 · Shop floor (P3, P4)

- Route `/kanban` drag-drop = `PATCH /jobs/{id}/stage`; `/jobs/{id}` material issues + production runs. API `POST /jobs/{id}/explode-bom`, `POST /jobs/{id}/material-issues`, `POST /jobs/{id}/production-runs`, `PUT …/{runId}`, `POST …/{runId}/receive-to-stock`.
- **L-7.1** `JOB` exists with `SalesOrderLineId`, `BomRevisionIdAtRelease` pinned to FG-200's current BOM revision. `GET /jobs/{id}/bom-at-release` shows 2 × RM-100 per unit.
- **L-7.2** P4 moves `JOB` to the "Production" stage → `SO.Status=InProduction` (`OnJobStageChanged_UpdateSoStatus`). Skip a mandatory stage → 409. Move backwards out of an `IsIrreversible` stage → 409.
- **L-7.3** P4 issues 4 × RM-100 to `JOB` → journal `Inventory:MaterialIssue:{MI}`: **Dr INVENTORY_WIP 60 / Cr INVENTORY_RAW 60**, `job_id` dimension set on the WIP line. Return 1, then re-issue 1 → return journal is the exact reverse; net WIP still 60.
- **L-7.4** P4 logs 1.0 h labor on the WC-MILL op (2 × 30 min) — needed so absorption in Stage 8 equals standard.
- **L-7.5** P4 creates a production run, completes it with `CompletedQuantity=2`, receives to stock → `Inventory:ProductionRun:{RUN}:FGRECEIPT`: **Dr INVENTORY_FG 120 / Cr INVENTORY_WIP 120**. Receive again → idempotent (`ReceivedToStockAt`). Receive a run with `CompletedQuantity=0` → 409.
- **L-7.6** Control for the soft-fail: a second job on a part with **no** standard cost receives to stock → operational stock increases, **no** journal, log line "no resolvable standard cost". File as G-3 (silent GL gap) if not already tracked.
- **L-7.7** Open an NCR on `JOB`, move to the final stage → 409 (quality gate). Close the NCR, move → 200, `CompletedDate` set. `SO.Status` stays `InProduction` (the kanban must never mark the SO Shipped).
- **L-7.8** P4 `POST /jobs/{id}/dispose` → 403; P7 disposes `ShipToCustomer`; second dispose → 409 (write-once).

### Stage 8 · Close production cost (P6)

- API `POST /api/v1/accounting/jobs/{JOB}/close-production-cost`.
- **L-8.1** Controller closes → two journals: `Inventory:Job:{JOB}:WIPABSORB` **Dr INVENTORY_WIP 60 / Cr LABOR_APPLIED 40 / Cr OVERHEAD_APPLIED 20**, and `Inventory:Job:{JOB}:PRODVARIANCE` which, with WIP now netting to zero (60 issue + 60 absorb − 120 receipt), has **no lines or is not created** — record which. If labor logged ≠ 1.0 h the residual sweeps to `LABOR_EFFICIENCY_VARIANCE`; assert the sign matches the hours delta.
- **L-8.2** Close again → idempotent. Log more labor after close, close again → not re-swept.
- **L-8.3** P8 (Admin) calls the same endpoint → 403 (Controller-only controller). P7 → 403.
- **L-8.4** `GET /api/v1/accounting/inventory-valuation` shows FG-200 qty 2 @ 60 = 120, RM-100 qty 0, WIP for `JOB` = 0.

### Stage 9 · Ship (P2)

- Route `/shipping` (needs `CAP-O2C-SHIP`), `/shipments` detail panel. API `POST /orders/{SO}/create-shipment`, `POST /shipments/{id}/ship` (body `ScanCode`), `POST /shipments/{id}/deliver`.
- **L-9.1** One-click create-shipment from `SO` → `SHP` `Status=Pending`, 2 × FG-200, `ScanCode` issued; `SO.Status=Shipped`? **No** — the SO only advances on `ShipmentCreatedEvent` to `PartiallyShipped`/`Shipped` per remaining qty; record the actual value.
- **L-9.2** Create a second shipment for 1 more FG-200 → 409 over-ship (`RemainingQuantity`). A part not on the order → 409.
- **L-9.3** Carrier `Scan-Probe`: ship with no `ScanCode` → 409; wrong code → 409; correct → `Shipped`. Carrier `Will Call`: ships without a scan.
- **L-9.4** Ship → inventory relieved (FG-200 on hand 0, `InventoryRelievedAt` set per line); **no journal on ship** — COGS is owned by the invoice/delivery leg (`docs/domain/cogs-ownership-spec.md`). Assert count unchanged.
- **L-9.5** Deliver → `Status=Delivered`, `ShipmentDeliveredEvent` published. With no invoice yet, `OnShipmentDelivered_ReclassDeferredRevenue` is a no-op: assert count unchanged. Deliver a Pending shipment → 409.
- **L-9.6** P1 `POST /shipments` → 403. P4 opens `/shipments` → bounced.

### Stage 10 · Invoice (P2) — Variant A: invoice after delivery

- Route `/invoices`, `uninvoiced-jobs-panel`. API `POST /invoices` with `ShipmentId=SHP`, `POST /invoices/{id}/send`, `/void`.
- **L-10.1** Create from `SHP` → `INV` `Status=Draft`, 2 × FG-200 @ 100, `DueDate ≥ InvoiceDate`. **No journal on create.**
- **L-10.2** Second invoice on `SHP` → 409 (one per shipment). Invoice 3 × FG-200 against the SO → 409 (cumulative invoiced ≤ shipped). Invoice a freight line with no `PartId` beyond shipped → **accepted** — gap INV-INV2, assert and record.
- **L-10.3** Send → `Status=Sent` and journals in the same transaction: `AR:Invoice:{INV}:REVENUE` **Dr AR_CONTROL 200 (party = customer) / Cr SALES_REVENUE 200** (control transferred, so no deferral; tax-exempt, so no tax line); `Inventory:Invoice:{INV}:COGS` **Dr COGS 120 / Cr INVENTORY_FG 120**. `acct_ar_open_items` has one open item for 200.
- **L-10.4** Send again → 409, no duplicate journal. Void a Draft → 409. Void `INV` (Sent, unpaid) on a throwaway copy → allowed, reversal journal `AR:JournalEntry:{id}:REVERSAL`, original `status='Reversed'`.
- **L-10.5** Direct SQL `UPDATE acct_journal_lines SET debit = 0 WHERE journal_entry_id = …` → rejected by the trigger; via EF the `LedgerImmutabilityInterceptor` throws. Both are defense-in-depth checks the Controller should run once.
- **L-10.6** P1 `POST /invoices` → 403.

### Stage 10 · Variant B (second order): invoice before delivery

Repeat Stages 4–9 on a second order but **ship without delivering**, then invoice and send:
- **L-10B.1** Send → `AR:Invoice:{INV2}:REVENUE` is **Dr AR 200 / Cr DEFERRED_REVENUE 200**, and **no COGS** yet.
- **L-10B.2** Deliver `SHP2` → `AR:Invoice:{INV2}:REVENUE_RECLASS` **Dr DEFERRED_REVENUE 200 / Cr SALES_REVENUE 200** at the booking rate, plus `Inventory:Invoice:{INV2}:COGS` **Dr COGS 120 / Cr INVENTORY_FG 120**. Deliver again → no second reclass.
- **L-10B.3** Void `INV2` *before* delivering, then deliver → reclass is a no-op (original not Posted).

### Stage 11 · Cash (P2)

- Route `/payments`, `payment-dialog`. API `POST /payments` with `Applications[{InvoiceId, Amount}]`, `POST /payments/{id}/void`.
- **L-11.1** Pay `INV` while still Draft (on a fresh invoice) → 409 (only Sent/PartiallyPaid/Overdue). Apply 250 against a 200 balance → 400/409 (≤ `BalanceDue`). `Σ Applications ≠ Amount` → 400. Invoice of another customer → 409.
- **L-11.2** Pay 120 → `INV.Status=PartiallyPaid`; journal `AR:Payment:{PAY1}:PAYMENT` **Dr CASH 120 / Cr AR_CONTROL 120**.
- **L-11.3** Pay 80 → `INV.Status=Paid`; `AR:Payment:{PAY2}:PAYMENT` **Dr CASH 80 / Cr AR 80**; open item closed; **`SO.Status=Completed`** (the only writer of Completed is `CreatePayment`).
- **L-11.4** Pay 100 with only 80 applied → **Dr CASH 100 / Cr AR 80 / Cr CUSTOMER_DEPOSITS 20**.
- **L-11.5** Void `PAY2` with a reason → reversal journal, `INV` back to `PartiallyPaid`, `SO` **stays** `Completed` (record; no writer moves it back — file G-4 if the product owner disagrees). Void without reason → 400.
- **L-11.6** `GET /api/v1/accounting/ar-aging` as Controller shows the customer at 0 after L-11.3.

### Stage 12 · Controller closes the books (P6, with P8 negatives)

- Route `/accounting/*` (Controller is bounced by the UI guard — see §7; drive by API, and also log in as Manager to prove the screens render then 403). API under `/api/v1/accounting`.
- **L-12.1** `GET trial-balance` matches §6 exactly and nets to zero.
- **L-12.2** `GET pnl` for the period: revenue 200, COGS 120, applied labor/overhead as credits under cost of sales (net 60); `cogsPosted=true`, `marginCaveat` empty. Before Stage 10 the same call showed the "Gross margin is INCOMPLETE" caveat — capture both.
- **L-12.3** `GET ledger?accountId=AR_CONTROL` lists REVENUE, PAYMENT ×2 (+ reversal) with party = customer; `journal-entries/{id}/explain` on the invoice entry names the invoice.
- **L-12.4** `GET grni-reconciliation` = 0 after L-6b.3; `GET inventory-valuation/reconciliation` = 0 variance between store and GL.
- **L-12.5** Manual journal: Controller `POST journal-entries` (balanced) → posted or pending per `MakerCheckerThreshold`; approve/reject as Controller works; **Admin approve → 403** (`GlSegregationOfDuties`). Unbalanced entry → 400.
- **L-12.6** Soft-close the period → new posting still allowed? Record actual (`SoftClosed` semantics). Hard-close → `POST /payments` dated in that period → `PERIOD_HARD_CLOSED` surfaced as 409, payment **not** created (atomicity). Reopen → `409` (HardClosed is terminal). Run the close checklist first and capture its output.
- **L-12.7** `GET exports/trial-balance.csv` downloads; row count = accounts with activity.
- **L-12.8** Manager/OfficeManager: every `/api/v1/accounting/*` call → 403 while the `/accounting` tiles render. Admin: same.

## 5. Pass D (dark) — FULLGL off

Repeat Stages 1–11 with `CAP-ACCT-FULLGL` disabled (leave GL-VIEW on). Every operational assertion in §4 must hold identically. Additional assertions:

- **D-1** `SELECT count(*) FROM acct_journal_entries WHERE source <> 'Conversion'` = 0 at the end.
- **D-2** `GET pnl` → 403 (`CAP-RPT-FINANCIALS` depends on FULLGL) or empty with the caveat; record which.
- **D-3** Stage 8 close-production-cost → 403 (FULLGL-gated endpoint), job stays closable operationally.
- **D-4** Stage 12 period endpoints → 403 (`CAP-ACCT-PERIOD` requires FULLGL and cannot be enabled).
- **D-5** Boot with a deliberately unmapped determination key → API starts with a **warning** (dark) vs **fails fast** (lit).

This is the regression that F-9 describes: paid invoices and no ledger. In Pass D that is correct behavior; the test exists so nobody mistakes it for a bug in Pass L.

## 6. Worked example and evidence

Expected journals for Variant A after L-11.3 (all in the active book, functional USD):

| Key | Dr | Cr |
|---|---|---|
| `Inventory:Receipt:{PO}:{rcpt}:RECEIPT` | INVENTORY_RAW 60 | GRNI 60 |
| `AP:VendorBill:{bill}:BILL` | GRNI 60 | AP_CONTROL 60 |
| `AP:VendorPayment:{vp}:PAYMENT` | AP_CONTROL 60 | CASH 60 |
| `Inventory:MaterialIssue:{MI}` | INVENTORY_WIP 60 | INVENTORY_RAW 60 |
| `Inventory:ProductionRun:{RUN}:FGRECEIPT` | INVENTORY_FG 120 | INVENTORY_WIP 120 |
| `Inventory:Job:{JOB}:WIPABSORB` | INVENTORY_WIP 60 | LABOR_APPLIED 40, OVERHEAD_APPLIED 20 |
| `AR:Invoice:{INV}:REVENUE` | AR_CONTROL 200 | SALES_REVENUE 200 |
| `Inventory:Invoice:{INV}:COGS` | COGS 120 | INVENTORY_FG 120 |
| `AR:Payment:{PAY1}:PAYMENT` | CASH 120 | AR_CONTROL 120 |
| `AR:Payment:{PAY2}:PAYMENT` | CASH 80 | AR_CONTROL 80 |

Expected trial balance (debit positive):

| Account | Balance |
|---|---|
| CASH 10100 | +140 |
| AR_CONTROL 11000 | 0 |
| INVENTORY_RAW 13100 | 0 |
| INVENTORY_WIP 13200 | 0 |
| INVENTORY_FG 13300 | 0 |
| GRNI 21000 | 0 |
| AP_CONTROL 20000 | 0 |
| SALES_REVENUE 40000 | −200 |
| COGS 50000 | +120 |
| LABOR_APPLIED 51210 | −40 |
| OVERHEAD_APPLIED 51220 | −20 |
| **Net** | **0** |

Evidence queries (run as the pg superuser on :5433, read-only):

```sql
-- every posting in this run, one row per key
SELECT e.idempotency_key, e.source, e.status, e.entry_date,
       sum(l.debit) AS dr, sum(l.credit) AS cr
FROM acct_journal_entries e JOIN acct_journal_lines l ON l.journal_entry_id = e.id
GROUP BY e.id ORDER BY e.id;

-- duplicate-key guard
SELECT idempotency_key, count(*) FROM acct_journal_entries
GROUP BY idempotency_key HAVING count(*) > 1;

-- trial balance from lines, to cross-check the endpoint
SELECT a.account_number, a.name, sum(l.debit) - sum(l.credit) AS balance
FROM acct_journal_lines l
JOIN acct_gl_accounts a ON a.id = l.gl_account_id
JOIN acct_journal_entries e ON e.id = l.journal_entry_id
WHERE e.status = 'Posted'
GROUP BY a.account_number, a.name HAVING sum(l.debit) - sum(l.credit) <> 0
ORDER BY a.account_number;

-- job dimension present on every WIP line
SELECT count(*) FROM acct_journal_lines l JOIN acct_gl_accounts a ON a.id = l.gl_account_id
WHERE a.account_number = '13200' AND l.job_id IS NULL;
```

Capture per stage: the API response, the row from query 1, and a screenshot of the driving screen for the persona. Attach to the run folder `docs/delivery/in-progress/lead-to-ledger-role-test-plan/runs/YYYY-MM-DD/`.

## 7. Role × action matrix (expected HTTP)

| Action | Admin | Manager | PM | OfficeMgr | Engineer | ProdWorker | Procurement | Controller |
|---|---|---|---|---|---|---|---|---|
| `POST /leads` | 200 | 200 | 200 | 403 | 403 | 403 | 403 | 403 |
| `POST /leads/{id}/convert` | 200 | 200 | 200 | 403 | 403 | 403 | 403 | 403 |
| `PUT /customers/{id}` | 200 | 200 | 200 | 200 | 200 | 403 | 403 | 403 |
| `POST /quotes` · `/estimates` | 200 | 200 | 200 | 200 | 403 | 403 | 403 | 403 |
| `PUT /quotes/settings` | 200 | 403 | 403 | 403 | 403 | 403 | 403 | 403 |
| `POST /orders/{id}/confirm` | 200 | 200 | 200 | 200 | 403 | 403 | 403 | 403 |
| `POST /sales-order-stages/{id}/ship` | 200 | 200 | **403** | 200 | 403 | 403 | 403 | 403 |
| `PATCH /jobs/{id}/stage` | 200 | 200 | 200 | 200 | 200 | 200 | 403 | 403 |
| `POST /jobs/{id}/material-issues` | 200 | 200 | 200 | 200 | 200 | 200 | 403 | 403 |
| `POST /jobs/{id}/dispose` | 200 | 200 | 403 | 403 | 403 | 403 | 403 | 403 |
| `POST /shipments` · `/{id}/ship` | 200 | 200 | 403 | 200 | 403 | 403 | 403 | 403 |
| `POST /invoices` · `/{id}/send` | 200 | 200 | 403 | 200 | 403 | 403 | 403 | 403 |
| `PUT /invoices/queue-settings` | 200 | 403 | 403 | 403 | 403 | 403 | 403 | 403 |
| `POST /payments` | 200 | 200 | 403 | 200 | 403 | 403 | 403 | 403 |
| `POST /purchase-orders` | 200 | 200 | 403 | 200 | 403 | 403 | **403** | 403 |
| `POST /purchase-orders/{id}/short-close` | 200 | 200 | 403 | 200 | 403 | 403 | 200 | 403 |
| `GET /accounting/trial-balance` | **403** | **403** | 403 | **403** | 403 | 403 | 403 | 200 |
| `POST /accounting/journal-entries` · approve · reverse | **403** | **403** | 403 | 403 | 403 | 403 | 403 | 200 |
| `POST /accounting/periods/{id}/hard-close` | 403 | 403 | 403 | 403 | 403 | 403 | 403 | 200 |
| `POST /accounting/conversion/opening-journal` | 403 | 403 | 403 | 403 | 403 | 403 | 403 | 200 |
| `PUT /capabilities/{code}/enabled` | 200 | 403 | 403 | 403 | 403 | 403 | 403 | 403 |

UI landing (single-role users): PM `/backlog`, OfficeManager `/customers`, Engineer `/parts`, ProductionWorker `/kanban`, **Controller `/accounting` → `/dashboard`**, **Procurement `/purchasing` → `/dashboard`**, Admin/Manager `/dashboard`. Bold cells are the expected-but-wrong results; they pass the test and fail the product (see §9).

## 8. Gap probes (assert current behavior, file as findings)

| Id | Probe | Current behavior | Cite |
|---|---|---|---|
| G-1 | Customer on credit hold: quote, confirm, ship, invoice | all succeed | no O2C handler reads `IsOnCreditHold` |
| G-2 | `POST /quotes/{id}/send` vs `/send-email` | only email snapshots terms | `SendQuoteEmail.cs:84` |
| G-3 | Receive-to-stock with no standard cost | stock moves, no GL, log only | `ProductionReceiptPostingService.cs:94` |
| G-4 | Void the completing payment | SO stays `Completed` | `CreatePayment.cs:205-226`, `VoidPayment.cs` |
| G-5 | Invoice a no-`PartId` line beyond shipped | accepted | `CreateInvoice.cs:82-113` (INV-INV2) |
| G-6 | RMA: receive + resolve + close a return (needs `CAP-O2C-RMA`) | **no journal** | `ResolveCustomerReturn.cs`, `CloseCustomerReturn.cs`; spec at `accounting-suite/README.md:457` |
| G-7 | Taxed customer variant of Stage 10 | `Cr SALES_TAX_PAYABLE` posts; no remittance path exists | seed only |
| G-8 | Electronic vendor payment | `Cr CASH_IN_TRANSIT`, settled by `PaymentTransmissionJob` → `AP:VendorPayment:{id}:SETTLEMENT` | `VendorPaymentCashPostingService.cs` |
| G-9 | Custom track type without "Production"/"Ship" stage names | SO never leaves `Confirmed`; one-click ship finds no lines | string-matched stage names |
| G-10 | Determination map | no admin UI; seed/API only | grep `forge-ui/src` for "determination" |

## 9. Findings to file before the first run

1. **UI/API role split on accounting:** `/accounting` guard = Admin/Manager/OfficeManager (`app.routes.ts:198`); `AccountingGlController` = Controller only (`:32`). The one role that can use the screens cannot reach them; the roles that reach them cannot use them.
2. **Role landing bounces:** Controller, Procurement, Production Planner land on routes whose guards omit them (`role-landing.model.ts:13-23`).
3. **No seeded Controller or Procurement user**, so no demo install can exercise the GL or the P2P grant without manual setup.
4. **Four roles have zero API grants** (ComplianceOfficer, IT Admin, Production Manager, Production Planner) and two have exactly one (Procurement: PO short-close; LeadIntake: bulk intake). A Procurement user cannot create or receive a purchase order. Decide whether these are UI-only by design.

## 10. Automation map

| Stage | Covered today | Add |
|---|---|---|
| 4–6, 9–11 operational | `e2e/tests/golden-path-accounting.spec.ts`, `golden-path-manufacturing.spec.ts` | — |
| 9 scan gate | `carrier-scan-to-ship.spec.ts` | — |
| illegal transitions | `invariant-probes.spec.ts` | G-1, G-4, G-5 rows |
| 1–2 | none end-to-end (`ConvertLeadHandlerTests` unit only) | `golden-path-lead.spec.ts`: L-1.1 → L-2.4 |
| 6b, 7, 8 journals | unit: `Phase2*PostingServiceTests`, `ProductionVariancePostingServiceTests` | — |
| 10–12 journals end-to-end | **none** | `golden-path-gl.spec.ts`: enable FULLGL via API, run Variant A and B, assert §6 through `GET trial-balance` + `GET ledger`; then the same spec with FULLGL off asserting zero entries (Pass D) |
| 7 role matrix | `forge-test/docs/suites/permissions/PERM-*` (different persona taxonomy) | §7 as a data-driven Playwright matrix using the seed users plus the two hand-made ones |

Exit criteria for this effort: Pass L and Pass D both green on a clean stack, §6 trial balance reproduced, the four §9 findings filed with owners, and `golden-path-gl.spec.ts` in the nightly.
