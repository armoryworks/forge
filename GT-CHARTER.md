# Golden-Thread Charter — Quote-to-Cash Spine (authoritative pass)

> **Owner:** `[QA]`. **Status:** FINALIZED, armed — fires the instant `[DEVOPS]` publishes the clean demo-seeded build + role creds.
> **Why hold:** Discovery confirmed the DB was mutating mid-investigation; a GT run on a moving target yields non-reproducible findings. This charter runs once, against a known-state seeded build.
> **Companions:** invariant catalog + assertion layers in `DISCOVERY.md §2A`; defects land in `AUDIT.md §4` (next ID **F-020**); coverage tracker in `AUDIT.md §1`.

---

## 0. Trigger & preconditions (check before firing)

- [ ] DevOps published build URL + **role creds** (admin + at least Engineer/ProductionWorker for shop-floor steps).
- [ ] **Whatever `[DEVOPS]` publishes is the authoritative, reproducible build.** If it isn't spine-seeded, run `e2e/scenarios/02d-full-populate` first to populate the spine, then snapshot.
- [ ] Build is **frozen** (no other agent mutating; confirm with `[ORCH]`/`[DEVOPS]`).
- [ ] **DB snapshot taken at T0** so every probe can diff against a known baseline and the run is repeatable: `pg_dump` or note the backup tag. (DB: `:5432`, `forge`, `postgres/postgres`.)
- [ ] API reachable at `:5000/api/v1` (token via `auth.helper`), UI at the published origin.
- [ ] **`MOCK_INTEGRATIONS` is `true` for this pass (LOCKED by `[ORCH]`).** Cover INV-QBO1(**seam mechanics**)/QBO2 against the mock. **OUT of scope this run** (deferred to the real-QB-sandbox milestone — `AUDIT.md §6`): INV-IN4, INV-QBO3, and INV-QBO1(**retry-idempotency**) — the mock can't prove them. See F-021.

---

## 1. Operating rules

1. **Two passes, one thread.**
   - **Pass A — Connectivity:** drive ONE realistic order end-to-end C0→C10 through the **UI**, happy path, full quantity, single shipment. Goal: *does a real order make it from lead to paid+synced?* Record exactly where (if anywhere) the thread snaps.
   - **Pass B — Invariants:** re-walk the same thread asserting each stage's invariants (UI observation + API reads + the SQL probes in §4), then run the **edge probes** (§3.B) that deliberately attack the invariants (over-ship, double-invoice, over-issue, etc.).
2. **Don't let one break blind the rest.** If a stage hard-blocks in Pass A, file the BLOCKER, then **back-door past it** (seed the next entity via API/DB) so downstream stages still get coverage. Mark all post-break findings `provisional (resumed past F-0xx)`.
3. **One actor, capture every ID.** Single admin session for Pass A; record each created entity's id/number into `DISCOVERY.md §3` as you go (this *is* the system-model capture). Carry IDs forward — the thread is one continuous transaction.
4. **Realistic, deterministic data** (§2). Same inputs every run so INV-Q1 (determinism) is meaningful.
5. **Scope guard (locked by `[ORCH]`):** PRIMARY = the spine below + Auth + the **lot/serial backbone that touches shipped product** + spine inventory math. **RECORD-ONLY** (log a one-liner, do NOT pursue): quality suite (NCR/CAPA/SPC/FMEA/PPAP), MRP, scheduling, deep-inventory features (ABC/replenishment/inter-plant/consignment/cycle-count), payroll/HR, maintenance, EDI/IoT, AI, voice. SECONDARY (blocker-sweep only): Procurement/PO, admin.
6. **Findings:** file to `AUDIT.md §4` from **F-022** (F-020/F-021 already pre-filed) with `[Type][Severity][Pn][Scope][Lens]`. Provisional severity only — Priority set at the post-GT triage sync.
7. **⚠ `shipped_quantity` is unreliable BOTH ways — trust `shipment_lines.quantity` (the un-doubled source).** Two failure modes (answers `[ORCH]`'s "did the seed exercise the buggy path?" — **it did not**):
   - **Seeded rows → stale-ZERO.** The seed writes SO/shipment rows *directly*, bypassing `CreateShipmentHandler` + the domain event, so seeded `sales_order_lines.shipped_quantity = 0` even on fully-shipped orders (header status Shipped/Completed). Don't read seeded shipped-qty as truth.
   - **GT-created shipments → 2×.** When *I* ship through the API/UI in C7, the double-count (F-020: `CreateShipment.cs:78` + `OnShipmentCreated_UpdateSalesOrder.cs:38`, shared scoped DbContext) fires → 2× per shipment. Probe **P5 (INV-SH1)** will show spurious over-ship; attribute to F-020, don't file a dup — it's the **first validation P5/P6 work.**
8. **⚠ Seed has ZERO physical inventory** (on_hand=0 everywhere, no `bin_movements`/`bin_contents`/material issues). So: (a) C6/C7 inventory invariants are **only exercisable via the GT-generated thread** (issue→produce→receive→ship), not against seeded stock — generate the activity; (b) **shipment relief is absent in code** (`ShipShipment` only flips status; pick/complete don't decrement bins) → expect **INV-SH2 to find relief happening *zero* times, not just non-idempotently** — a GAP, confirm-and-file on the run.

---

## 2. The thread (test data)

| Field | Value | Note |
|-------|-------|------|
| Customer | **new** — created in C1 as a Lead → converted | self-contained; exercises C1 fully |
| Lead co. | `GT Aerospace LLC` (deterministic name + timestamp suffix to avoid collisions) | |
| Part | a **seeded manufactured part** with a released BOM revision + routing, **lot- or serial-tracked** | select at run via `parts` query; lot/serial is the spine exception — pick a tracked part on purpose |
| Order qty | **10** | round; supports qty-break (C2) and partial-ship edge (C7 Pass B: 6 + 4) |
| Unit price | accept at quoted price | INV-SO1 verifies SO locks this |
| Pass A shipment | full **10** in one shipment | keep Pass A clean; partial is a Pass-B edge |

> If no seeded part has a complete BOM+routing+lot/serial, that's itself a **GAP/BLOCKER** finding for the seeded build — file it and back-door a part so the thread proceeds.

---

## 3. Stage-by-stage runbook

> Each stage: **Goal · Actions · Expected · Capture · Invariants (layer) · Stop-rule.**

### C0 — Auth & session (gateway)
- **Goal:** establish trustworthy session; confirm capability gating doesn't silently expose/deny spine routes.
- **Actions:** UI login as admin; obtain API token; spot-check a non-admin role login (Engineer) for shop-floor steps.
- **Expected:** login → dashboard; token valid on `:5000`; role-appropriate nav.
- **Capture:** active capability preset; which `CAP-*` are off (re: legacy F-002 cluster) → `DISCOVERY §1`.
- **Invariants:** none (gateway). **Stop-rule:** can't auth = full BLOCKER, halt, escalate to DevOps.

### C1 — Customer / Lead → conversion
- **Goal:** create Lead, convert to Customer; clean financial identity for A/R.
- **Actions:** create Lead `GT Aerospace LLC`; convert to Customer; add a primary contact + bill-to address.
- **Expected:** Lead status → Converted; Customer created; no dup customer.
- **Capture:** `customerId`, customer number.
- **Invariants:** seeds INV-AR1 (customer is the A/R subject). **Stop-rule:** can't create/convert = BLOCKER; back-door a customer via API.

### C2 — Quote / estimate
- **Goal:** build a priced quote for the part at qty 10; approve.
- **Actions:** new Quote for `customerId` → add line: part, qty 10 → observe pricing (pull BOM/cost) → record total → **recompute/re-open** and confirm identical → send → accept.
- **Expected:** deterministic total; quote status Draft→Sent→Accepted.
- **Capture:** `quoteId`, quote total, unit price, cost breakdown (NRE/setup vs run).
- **Invariants:**
  - **INV-Q1** determinism — `UI+API` (recompute twice, diff total).
  - **INV-Q2** qty-break monotonicity — `UI+API` (enter qty 1/10/100, unit price non-increasing).
  - **INV-Q3** NRE/setup once — `API` (read line cost breakdown).
  - **INV-Q4** setup-vs-run separation — `API`.
- **Stop-rule:** no pricing engine output = MAJOR/BLOCKER; back-door accepted quote.

### C3 — Quote → Sales Order
- **Goal:** convert accepted quote to SO; price locks.
- **Actions:** convert `quoteId` → SO; confirm SO.
- **Expected:** SO created, lines carried, status Draft→Confirmed.
- **Capture:** `soId`, `soLineId`, SO unit price/total.
- **Invariants:**
  - **INV-SO1** `SO.price == accepted_quote.price` — `API/DB` (compare derived totals; totals are computed from lines).
  - **INV-SO2** qty changes only via audited change order — `UI probe + DB` (attempt direct line-qty edit on confirmed SO → expect blocked/forces change order + audit row).
- **Stop-rule:** conversion fails = BLOCKER; back-door SO.

### C4 — SO → Job / Production
- **Goal:** release a Job from the SO line; BOM explodes; routing attached.
- **Actions:** create/release Job from `soLineId`; verify BOM revision pinned + routing/stages present.
- **Expected:** Job created, `sales_order_line_id` set, `bom_revision_id_at_release` set, on the production track.
- **Capture:** `jobId`, `job.bom_revision_id_at_release`, start qty.
- **Invariants:**
  - **INV-J1** `job.part_rev == SO.part_rev` — `API/DB` (`jobs.bom_revision_id_at_release` vs the released rev of the SO line's part; confirm SO-side rev source at run).
  - **INV-J2** `start_qty ≥ order_qty` — `API/DB` (job start qty vs `sales_order_lines.quantity`; confirm job start-qty column at run).
- **Stop-rule:** can't release job = BLOCKER; back-door job.

### C5 — Shop-floor execution
- **Goal:** run the job through stages; record labor + good/scrap.
- **Actions:** (Engineer/Worker role) clock in; advance job stages; complete operations recording good + scrap qty; clock out.
- **Expected:** stage transitions logged; time entries posted to `jobId`; good/scrap recorded.
- **Capture:** good qty, scrap qty, labor hours/$, time-entry job linkage; production_run id if present.
- **Invariants:**
  - **INV-SF1** `qty_in = good_out + scrapped + at_op` — `DB` (aggregate production-reporting rows per job; enumerate the table at run — `production_runs`/stage-completions).
  - **INV-SF2** can't complete more good than `started − scrap` — `UI probe + DB` (attempt over-complete → expect rejected).
  - **INV-SF3** labor$ posts to originating job only — `DB/API` (time entries link to `jobId`, no cross-post).
- **Stop-rule:** stage advance broken = MAJOR; continue (job can be force-advanced).

### C6 — Inventory (incl. lot/serial backbone — SPINE)
- **Goal:** consume material against the job; receive finished goods; lot/serial assigned.
- **Actions:** issue raw material to `jobId` (drives `bin_movements`); receive FG into stock; assign/confirm lot or serial on the produced units.
- **Expected:** on-hand decremented for raw, incremented for FG; reservations consistent; lot/serial records created and tied to `jobId`.
- **Capture:** raw part on-hand before/after, FG lot/serial numbers, `lot_record_id`/`serial` ids.
- **Invariants:**
  - **INV-INV1** `on_hand = Σreceipts − Σissues − Σshipments ± adj` — `DB` (§4 probe P1).
  - **INV-INV2** never silently negative — `UI probe + DB` (over-issue → error surfaced; §4 probe P2).
  - **INV-INV3** `available = on_hand − allocated`; no same lot to two jobs — `DB + UI probe` (§4 probe P3).
  - **INV-INV4** UOM exact — `API/DB` (issue via a converting UOM; stored qty/`uom_id` exact).
  - *(lot/serial spine):* produced units carry a lot/serial tied to `jobId`, ready to record on shipment (sets up INV-SH3).
- **Stop-rule:** material issue broken = MAJOR; back-door stock so C7 proceeds.

### C7 — Shipment
- **Goal:** ship the order against the SO; relieve inventory once; record lot/serial.
- **Actions:** create shipment from `soId`, ship qty 10; confirm/post shipment.
- **Expected:** `sales_order_lines.shipped_quantity` = 10; one set of `bin_movements` relieving stock; shipment lines carry lot/serial.
- **Capture:** `shipmentId`, `shipmentLineId`, shipped lot/serial.
- **Invariants:**
  - **INV-SH1** `shipped ≤ ordered − already_shipped + tol` — `UI+API` (§4 probe P5; over-ship edge in Pass B).
  - **INV-SH2** inventory relieved exactly once (idempotent) — `DB + UI probe` (re-post/duplicate ship → no second relief; §4 probe P6).
  - **INV-SH3** lot/serial of shipped product recorded — `API/DB` (`serial_numbers.shipment_line_id`/`shipped_at` set, or `bin_movements.lot_number` at ship for lot-tracked).
- **Stop-rule:** can't ship = BLOCKER; back-door shipment.

### C8 — Invoice
- **Goal:** generate invoice from the shipment/SO.
- **Actions:** create invoice from `shipmentId`/`soId`; send.
- **Expected:** invoice lines mirror shipped qty; tax applied once; status Draft→Sent.
- **Capture:** `invoiceId`, invoice total, tax, `external_id` (post-sync).
- **Invariants:**
  - **INV-IN1** `invoiced ≤ shipped` — `API/DB` (§4 probe P7).
  - **INV-IN2** each shipment invoiced ≤ once — `API/DB + UI probe` (§4 probe P8; double-invoice edge in Pass B).
  - **INV-IN3** tax computed once — `API/DB` (tax over line sum once, not per line).
  - **INV-IN4** rounding matches QBO — `QBO` (**blocked if MOCK_INTEGRATIONS=true**).
- **Stop-rule:** can't invoice = BLOCKER; back-door invoice.

### C9 — Payment / A/R
- **Goal:** apply payment; A/R reconciles.
- **Actions:** record payment for `customerId`, apply to `invoiceId`.
- **Expected:** payment applied; invoice → Paid; customer balance drops by amount.
- **Capture:** `paymentId`, applied amount, customer A/R after.
- **Invariants:**
  - **INV-AR1** `A/R = Σinvoices − Σpayments − Σcredits` — `DB` (§4 probe P9; compare to customer-balance UI; **confirm credit-memo source** — not in introspected tables).
- **Stop-rule:** can't apply payment = BLOCKER; back-door payment.

### C10 — QBO sync (mock-seam-only; method sharpened by F-021)
- **Goal:** NOT a happy-path mock sync (proves little under the mock). Validate the **verified structural defects** and failure handling that ARE mock-visible; explicitly mark the mock-latent invariants as deferred.
- **Actions / probes (in order):**
  1. **Did the spine entities even enqueue a sync?** After C8/C9, query `invoices.external_id` and `payments.external_id` for the GT records. **F-021 predicts NULL** (no enqueue from `CreateInvoice`/`CreatePayment`). Confirm → this is the headline QBO finding, mock-visible.
  2. **The only invoice-ish sync** is `MoveJobStage`. If a stage move enqueued a doc, inspect its payload — F-021 predicts `Amount:0m` + placeholder line. Confirm $0/empty doc.
  3. **Force a sync failure** (mocked error) on a path that *does* enqueue (e.g. Part). Confirm it's captured and retryable, and — critically — that `GetFailedCountAsync`/`GetQueueDepthAsync` actually surface it somewhere (F-021: wired nowhere → likely fails INV-QBO2).
  4. **Stranding probe:** check `SyncQueueEntry` rows stuck in `Processing` with no retry/surface.
- **Capture:** `invoice.external_id`/`payment.external_id` (expect NULL), any enqueued $0 doc, failure-record + queue-depth surfacing (or its absence).
- **Invariants:**
  - **INV-QBO1 (seam mechanics)** — `API/DB` (§4 probe P10: dup external_id; posted-but-unsynced). *Retry-idempotency against real QBO = DEFERRED (F-021 / §6 hole).*
  - **INV-QBO2** failed sync surfaced & retryable, never swallowed — `UI + API/DB` (force failure → `DomainEventFailuresController`; verify retry + health surface).
  - **INV-QBO3** amount parity to the cent — **DEFERRED** (real-QB-sandbox milestone).
- **Stop-rule:** end of thread. Summarize GT result for triage.

### 3.B — Edge probes (Pass B, after the clean thread)
Run these deliberately against the same thread to attack the invariants:
- **Partial shipment:** ship 6 of 10, invoice+pay+sync, then ship 4 — re-checks INV-SH1 (already_shipped), INV-IN1/IN2 (multi-shipment invoicing), INV-AR1 (running balance).
- **Over-ship:** attempt to ship 11 → expect block (INV-SH1).
- **Over-issue:** issue more raw than on-hand → expect block, no negative (INV-INV2).
- **Double-invoice:** invoice the same shipment twice → expect block (INV-IN2).
- **Double-allocate lot:** reserve one lot to two jobs → expect block (INV-INV3).
- **Re-post sync:** trigger sync twice → expect no duplicate QBO doc (INV-QBO1).
- **Direct SO-qty edit:** edit confirmed SO line qty → expect change-order path + audit (INV-SO2).

---

## 4. Invariant SQL probes (DB-only — the high-value, no-UI-readout checks)

> Run against the frozen build. **Each probe is designed to return ZERO rows on a correct system** — any row is a finding. Column names pinned from live schema 2026-05-20; statuses/enums marked *(confirm)* validated at run.

```sql
-- P1 · INV-INV1 — on-hand (bin_contents) vs movement ledger (bin_movements) consistency, per stock entity
WITH oh AS (
  SELECT entity_type, entity_id, SUM(quantity) AS on_hand
  FROM bin_contents WHERE deleted_at IS NULL
  GROUP BY entity_type, entity_id),
mv AS (
  SELECT entity_type, entity_id,
         SUM( (to_location_id IS NOT NULL)::int * quantity
            - (from_location_id IS NOT NULL)::int * quantity ) AS net
  FROM bin_movements GROUP BY entity_type, entity_id)
SELECT * FROM oh FULL JOIN mv USING (entity_type, entity_id)
WHERE COALESCE(on_hand,0) <> COALESCE(net,0);   -- expect 0 rows

-- P2 · INV-INV2 — never negative / never over-reserved
SELECT 'neg' tag, * FROM bin_contents WHERE quantity < 0
UNION ALL
SELECT 'over-reserved', * FROM bin_contents WHERE reserved_quantity > quantity;  -- expect 0 rows

-- P3 · INV-INV3 — same lot reserved/placed to more than one job
SELECT lot_number, COUNT(DISTINCT job_id) AS jobs
FROM bin_contents
WHERE lot_number IS NOT NULL AND job_id IS NOT NULL AND deleted_at IS NULL
GROUP BY lot_number HAVING COUNT(DISTINCT job_id) > 1;   -- expect 0 rows

-- P5 · INV-SH1 — over-ship
SELECT id, sales_order_id, quantity, shipped_quantity
FROM sales_order_lines WHERE shipped_quantity > quantity;   -- expect 0 rows (+ tolerance if a tol column exists)

-- P6 · INV-SH2 — duplicate (non-reversed) relief movements for one shipment line
SELECT scan_action_log_id, entity_type, entity_id, COUNT(*)
FROM bin_movements
WHERE reason ILIKE '%ship%' AND reversed_movement_id IS NULL   -- confirm reason value at run
GROUP BY scan_action_log_id, entity_type, entity_id HAVING COUNT(*) > 1;   -- expect 0 rows

-- P8 · INV-IN2 — each shipment invoiced at most once
SELECT shipment_id, COUNT(*)
FROM invoices WHERE shipment_id IS NOT NULL AND deleted_at IS NULL
GROUP BY shipment_id HAVING COUNT(*) > 1;   -- expect 0 rows

-- P9 · INV-AR1 — A/R per customer (compare to customer-balance UI; credits source TBD)
WITH inv AS (
  SELECT i.customer_id,
         SUM(il.quantity * il.unit_price) * (1 + COALESCE(i.tax_rate,0)) AS billed
  FROM invoices i JOIN invoice_lines il ON il.invoice_id = i.id
  WHERE i.deleted_at IS NULL AND i.status <> 'Draft'   -- confirm posted statuses
  GROUP BY i.customer_id),
pay AS (
  SELECT p.customer_id, SUM(pa.amount) AS paid
  FROM payments p JOIN payment_applications pa ON pa.payment_id = p.id
  WHERE p.deleted_at IS NULL GROUP BY p.customer_id)
SELECT customer_id, billed, COALESCE(paid,0) AS paid,
       billed - COALESCE(paid,0) AS ar
FROM inv LEFT JOIN pay USING (customer_id);   -- reconcile vs UI balance

-- P10 · INV-QBO1 — duplicate external docs (idempotency) + posted-but-unsynced (swallowed?)
SELECT 'dup-invoice' tag, external_id, COUNT(*) FROM invoices WHERE external_id IS NOT NULL GROUP BY external_id HAVING COUNT(*)>1
UNION ALL
SELECT 'dup-payment', external_id, COUNT(*) FROM payments WHERE external_id IS NOT NULL GROUP BY external_id HAVING COUNT(*)>1;  -- expect 0 rows
SELECT id, status, external_id, last_synced_at FROM invoices
WHERE status='Sent' AND external_id IS NULL;   -- posted-but-unsynced → feeds INV-QBO2 review
```
*(P4 INV-INV4 UOM and P7 INV-IN1 invoiced≤shipped need a join path confirmed at run — `invoice_lines` carry `part_id` not `sales_order_line_id`, so invoiced-vs-shipped reconciles per part on the SO. Templated at run.)*

---

## 5. Outputs & exit criteria

- GT result one-pager: **where the thread reached** (C0…C10), each stage pass/break, each invariant pass/violation, provisional severities.
- Findings F-020+ filed in `AUDIT.md §4`; `§1` coverage tracker updated (`✓`/`⚠` per charter).
- `DISCOVERY.md §3` spine system-model filled from captured IDs/fields/transitions.
- **Triage sync with `[ORCH]`** immediately after: I bring Type/Severity, `[ORCH]` sets Priority + calls ship-blockers. Then per-charter rolling triage.
- Hand the invariant set (tagged UI/API/DB) to automation engineers — **DB SQL probes first** (cheap, deterministic, guard the books).
