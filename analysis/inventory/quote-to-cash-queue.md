# Quote-to-Cash — Scout Queue

> Filed by: ui-scout phase-02  
> Dequeue: open each item, observe live, update `quote-to-cash.md` entries, tick off.  
> Single writer: ui-scout owns this queue file. Source-cataloger owns quote-to-cash.md.  
> **Cycle 4 update:** Q2 (create dialogs) fully resolved — all 8 create dialogs observed live. Q1-a (quote detail) and Q1-c (PO detail + receive) resolved. Q7 (role access) partially resolved — route-level access confirmed; capability-level still open. Q3-d (ReceiveDialog) resolved.  
> **Cycle 5 update:** Q1-b (SO detail), Q1-e (invoice detail), Q1-f (shipment detail), Q1-g (payment detail) all resolved. Q1-i (RecurringOrderDialog) partially resolved — create dialog observed, populated list state blocked by CAP-O2C-RECURRING disabled. Q3-a/b resolved. Q5-b (ShippingRatesDialog) resolved. Q7-e/f resolved. New capability-gate findings: CAP-O2C-RMA, CAP-P2P-RFQ, CAP-O2C-RECURRING all disabled server-side — blocks Q1-d, Q1-h, and populated states for those entities.  
> **Cycle 6 update:** Q6-a/b/c/d (customer Q2C tabs) resolved — all four tabs populated and source-confirmed. Q4 resolved — EstimateFormDialogComponent dead code confirmed; actual live estimate surface identified (CustomerEstimatesTabComponent). Q7-f Manager buttons confirmed (full access). DN-7 resolved — PM redirects to /dashboard confirmed live. DN-9 added (customer tabs broader than Q6 scope).  
> **Cycle 6b update:** Q5-a (TrackingTimeline) RESOLVED — observed live via "Track" button; 2 events captured. Q1-d/Q1-h page-level states documented. Q1-i RecurringOrderDialog confirmed. Q3-c trigger conditions documented from source (terminal). DN-7 PO columns confirmed.  
> **Final reconciliation (this note):** Queue terminal-only. Catalog discrepancy filed: TrackingTimelineComponent marked "terminal" in catalog but resolved in queue (cycle-6b live observation). Shared components StatusBadgeComponent / ActivityTimelineComponent / DetailSidePanelComponent found in source but not in catalog shared checklist — flagged for cataloger.

---

## Q1 — Detail dialogs / panels (need seeded records to open)

**Why unreached:** All list pages start empty. Records must exist before row-click opens detail panel/dialog.

| queue-id | entity | dialog | panel | trigger | pre-req |
|----------|--------|--------|-------|---------|---------|
| ~~Q1-a~~ | ~~Quote~~ | ~~`QuoteDetailDialogComponent`~~ | ~~`QuoteDetailPanelComponent`~~ | ~~click quote row~~ | **RESOLVED** — QT-00001 observed; single scrollable panel, no tabs; fields: Status·Customer·Notes·LineItems·Subtotal·Tax·Total·Created·Updated·Delete·Send·Activity |
| ~~Q1-b~~ | ~~Sales Order~~ | ~~`SalesOrderDetailDialogComponent`~~ | ~~`SalesOrderDetailPanelComponent`~~ | ~~click SO row~~ | **RESOLVED (Cycle 5)** — J-1 (SO-00001 at Order Confirmed) visible in list after job stage advance; panel opened; 8 tabs: Overview \| Line Items \| Schedule \| Shipments \| Returns \| Documents \| Invoices \| Activity; status badges: Confirmed + Partially Shipped; action buttons: copy \| Print \| Regenerate; tab content selectors returned sparse (field labels embedded deeper than `.field-label` — screenshots captured at `q2c-cycle5/so-detail-tab*.png`). See DN-6. |
| ~~Q1-c~~ | ~~Purchase Order~~ | ~~`PoDetailDialogComponent`~~ | ~~`PoDetailPanelComponent`~~ | ~~click PO row~~ | **RESOLVED** — PO-00001 (Acknowledged) observed; flat panel; fields: Status·Submitted·ExpDelivery·Acknowledged·Incoterm·Currency·FxRate·Barcode·Notes·LineItems·Created·Updated·Cancel/ShortClose/ReceiveItems·Activity |
| ~~Q1-d~~ | ~~RFQ~~ | ~~`RfqDetailDialogComponent`~~ | ~~—~~ | ~~click RFQ row~~ | **CAPABILITY-BLOCKED / UI-OBSERVED (Cycle 6b)** — CAP-P2P-RFQ disabled server-side; UI at `/purchasing` page-level state: title "RFQs / Request for Quotes" · empty state icon + "No RFQs" · "New RFQ" button present · no capability-disabled message shown in UI (backend silently blocks). Table has no column headers (no data rows). RFQ create dialog (`RfqDialogComponent`) confirmed opening in Cycle 4 (empty form). Detail panel (`RfqDetailDialogComponent`) unreachable — no RFQs can be seeded. |
| ~~Q1-e~~ | ~~Invoice~~ | ~~`InvoiceDetailDialogComponent`~~ | ~~`InvoiceDetailPanelComponent`~~ | ~~click invoice row~~ | **RESOLVED (Cycle 5)** — INV-00001 (Draft, $135.625) observed; flat panel, NO TABS; line items table: Part# \| Description \| Qty \| Unit Price \| Total; action buttons: Delete \| Void \| Send; activity filters: All \| Conversation \| Notes \| History |
| ~~Q1-f~~ | ~~Shipment~~ | ~~`ShipmentDetailDialogComponent`~~ | ~~`ShipmentDetailPanelComponent`~~ | ~~click shipment row~~ | **RESOLVED (Cycle 5)** — SH-00001 (Pending, FedEx, TRACK-TEST-001) observed; flat panel, NO TABS; fields: Description \| Quantity; action buttons: Get Rates \| Mark Shipped \| Track; activity filters; TrackingTimelineComponent NOT rendered (requires shipped status — see Q5-a) |
| ~~Q1-g~~ | ~~Payment~~ | ~~`PaymentDetailDialogComponent`~~ | ~~`PaymentDetailPanelComponent`~~ | ~~click payment row~~ | **RESOLVED (Cycle 5)** — PMT-00001 (Check, $135.625) observed; flat panel, NO TABS; applications table: Invoice # \| Amount; no action buttons (read-only panel); close button only |
| ~~Q1-h~~ | ~~Customer Return~~ | ~~`CustomerReturnDetailDialogComponent`~~ | ~~`CustomerReturnDetailPanelComponent`~~ | ~~click return row~~ | **CAPABILITY-BLOCKED / UI-OBSERVED (Cycle 6b)** — CAP-O2C-RMA disabled server-side; UI at `/customer-returns` page-level state: title "Customer Returns / Track and manage customer returns" · empty state (assignment_return icon) + "No customer returns found" · "New Return" button present · Search + Status filters present · no capability-disabled message shown in UI. Table has no column headers (no data rows). Return create dialog (`CustomerReturnDialogComponent`) confirmed opening in Cycle 4 (empty form: Customer / Original Job / Reason / Return Date / Notes). Detail panel unreachable — no returns can be seeded. |
| ~~Q1-i~~ | ~~Recurring Order~~ | ~~`RecurringOrderDialogComponent`~~ | ~~—~~ | ~~from recurring list~~ | **RESOLVED (Cycle 6b)** — CAP-O2C-RECURRING disabled server-side; but create dialog (`RecurringOrderDialogComponent`) opens fine (UI not capability-gated). Page title: "Recurring Order Templates" · subtitle: "Templates the nightly Hangfire job spins into fresh sales orders. Each template carries a customer, an interval, and the lines to replicate." · empty state: "No recurring order templates yet. Create one to schedule auto-generated sales orders for a customer." · no capability-disabled message. Dialog fields: Template name \| Customer (search autocomplete) \| Next generation date \| Interval in days \| Notes \| Order lines (Part search \| Description \| Qty \| Unit price + Add line btn); buttons: Cancel \| validation badge \| Save. List state unreachable (backend blocks seeding). |

**Source files:**
- `features/quotes/components/quote-detail-dialog/`, `quote-detail-panel/`
- `features/sales-orders/components/sales-order-detail-dialog/`, `sales-order-detail-panel/`
- `features/purchase-orders/components/po-detail-dialog/`, `po-detail-panel/`
- `features/purchasing/components/rfq-detail-dialog/`
- `features/invoices/components/invoice-detail-dialog/`, `invoice-detail-panel/`
- `features/shipments/components/shipment-detail-dialog/`, `shipment-detail-panel/`
- `features/payments/components/payment-detail-dialog/`, `payment-detail-panel/`
- `features/customer-returns/components/customer-return-detail-dialog/`, `customer-return-detail-panel/`

---

## ~~Q2~~ — Create dialogs — **FULLY RESOLVED (Cycle 4)**

~~Why queued: Create dialogs depend on having customer/part/vendor data loaded in autocompletes to trigger full populated form state.~~

**Resolved:** All 8 create dialogs observed live (empty form state). Layout details in `quote-to-cash.md` Live-Observed Layout Details section. Populated form state (with data in autocompletes) is a follow-up if needed but create dialog structure is complete.

| queue-id | dialog | route | trigger | notes |
|----------|--------|-------|---------|-------|
| Q2-a | `QuoteDialogComponent` | `/quotes` | NEW QUOTE button | Multi-line form with customer + part autocompletes |
| Q2-b | `EstimateFormDialogComponent` | `/quotes` | Estimate/Calculator button (header?) | Compute-only dialog, no customer needed |
| Q2-c | `SoDialogComponent` (SO create) | `/sales-orders` | NEW SALES ORDER | Requires customer |
| Q2-d | `PoDialogComponent` | `/purchase-orders/orders` | NEW PURCHASE ORDER | Requires vendor + parts |
| Q2-e | `RfqDialogComponent` | `/purchasing` | NEW RFQ | Requires vendor |
| Q2-f | `InvoiceDialogComponent` | `/invoices` | NEW INVOICE | Requires job/SO |
| Q2-g | `UninvoicedJobsPanelComponent` | `/invoices` | "Uninvoiced Jobs" action | Panel listing jobs not yet invoiced |
| Q2-h | `ShipmentDialogComponent` | `/shipments` | NEW SHIPMENT | Requires SO |
| Q2-i | `ShippingRatesDialogComponent` | `/shipments` | Shipping rates action | Rate lookup panel |
| Q2-j | `PaymentDialogComponent` | `/payments` | NEW PAYMENT | Requires invoice |
| Q2-k | `CustomerReturnDialogComponent` | `/customer-returns` | NEW RETURN | Requires SO/shipment |

---

## Q3 — PO-specific panels (admin + suggestion flow)

| queue-id | component | route | notes |
|----------|-----------|-------|-------|
| ~~Q3-a~~ | ~~`AutoPoPanelComponent`~~ | ~~`/purchase-orders/suggestions`~~ | **RESOLVED (Cycle 5)** — Page accessible and renders; shows "Run Analysis" button + "No auto-PO suggestions" empty state; no suggestions because no parts are at reorder threshold; component renders correctly |
| ~~Q3-b~~ | ~~`AutoPoSettingsPanelComponent`~~ | ~~`/purchase-orders/settings`~~ | **RESOLVED (Cycle 5)** — Full settings rendered for Admin: Enable Auto-PO (toggle) \| Default Mode (select, default "Suggest") \| Buffer Days (input) \| Send Chat Notifications (toggle) \| Save button. Manager sees ONLY Default Mode + Buffer Days — isAdmin gate CONFIRMED LIVE (see Q7-e). |
| ~~Q3-c~~ | ~~`OffTierPromptDialogComponent`~~ | ~~Within PO create flow~~ | **TERMINAL (Cycle 6b — source-confirmed)** — Trigger: saving a PO when `checkTierVariance()` returns lines with `isOffTier: true` (source: `po-dialog.component.ts` lines 309-317). Exact condition: `offTier.length > 0` after `result.lines.filter(l => l.isOffTier)`. This fires only when: (1) a vendor has pricing tiers configured for the ordered part, AND (2) the user enters a unit price that deviates from the tier price by more than the threshold % (default 5%). This env has no vendor pricing tier data; condition untriggerable. Dialog layout (source-confirmed): table columns Part# \| Qty \| Tier Price \| Entered Price \| Variance % \| Action (checkbox "Update Tier" per row) + Cancel \| Continue buttons. |

---

## Q4 — Quote/Estimate embedded flow — RESOLVED (Cycle 6)

| queue-id | component | route | result |
|----------|-----------|-------|--------|
| ~~Q4-a~~ | ~~`EstimateFormDialogComponent`~~ | ~~`/quotes`~~ | **RESOLVED (Cycle 6)** — Dead code CONFIRMED. No button/trigger found on /quotes page or in QuoteDetailPanel in Cycle 5+6 sweeps. Source confirmed zero callers. The ACTUAL live estimate-create surface is `CustomerEstimatesTabComponent` at `/customers/{id}` Estimates tab (separate system: simple dollar-amount estimates, not the compute-based cost model). The `EstimateFormDialogComponent` is a pending cost-estimate calculator feature not yet wired in (see DN-3). |
| ~~Q4-b~~ | Estimate result display | — | **RESOLVED** — Blocked by Q4-a (EstimateFormDialogComponent unwired). The compute service is a mock stub returning fictional data. |
| ~~Q4-c~~ | Quote detail tabs | Quote detail panel | **RESOLVED** — NO TABS; single scrollable panel (confirmed in Q1-a). Quote detail panel buttons: Delete \| Send \| activity filters. No estimate link within quote detail. |

---

## Q5 — Shipment sub-components

| queue-id | component | route | notes |
|----------|-----------|-------|-------|
| ~~Q5-a~~ | ~~`TrackingTimelineComponent`~~ | ~~Shipment detail panel~~ | **RESOLVED (Cycle 6b)** — Trigger: "Track" button (location_searching icon) in shipment detail action bar; calls `GET /api/v1/shipments/{id}/tracking` lazily; `app-tracking-timeline` enters DOM only after click and only if API returns non-null. Observed live: Status "In Transit" · Tracking # TRACK-TEST-001 · Est. Delivery 05/25/2026 · 2 events: "Package picked up / 05-21 / Origin Facility" + "In transit to destination / 05-22 / Distribution Center". Component layout: carrier icon + status badge + tracking # + est. delivery date + vertical timeline (event description + timestamp MM/dd hh:mm a + place icon + location name). |
| ~~Q5-b~~ | ~~`ShippingRatesDialogComponent`~~ | ~~`/shipments` or shipment detail~~ | **RESOLVED (Cycle 5)** — Trigger: "Get Rates" button (icon: request_quote) in shipment detail panel action bar; dialog content: Cancel \| Create Label buttons; functions as a shipping label creation dialog (not rate-shopping); dialog rendered from SH-00001 Pending state |

---

## Q6 — Customer detail tabs (Q2C cross-link) — FULLY RESOLVED (Cycle 6)

**Customer 1 detail page tabs confirmed live:** Overview \| Contacts \| Addresses \| Estimates \| Quotes \| Orders \| Jobs \| Invoices \| Pricing \| Interactions \| Activity (11 tabs total — broader than Q6 scope; see DN-9).

| queue-id | tab | route | result |
|----------|-----|-------|--------|
| ~~Q6-a~~ | Estimates | `/customers/1/estimates` | **RESOLVED (Cycle 6)** — 1 row (seeded estimate #3 "Prototype run estimate"); `CustomerEstimatesTabComponent`; columns: Title \| Estimated Amount \| Status \| Valid Until \| Created \| Actions; row-click opens "Edit Estimate" dialog (source-confirmed — `openEdit()`); row-level actions: "Convert to Quote" icon (only if not yet converted) + "Delete" icon; "New Estimate" button in toolbar (add icon); dialog fields: Title \| Description \| Estimated Amount \| Valid Until \| Notes (create); + Status dropdown (edit only). This is the ACTUAL live estimate-create surface (see Q4/DN-3). |
| ~~Q6-b~~ | Quotes | `/customers/1/quotes` | **RESOLVED (Cycle 6)** — 1 row (QT-00001); `CustomerQuotesTabComponent`; columns: Quote # \| Status \| Lines \| Total \| Expiration \| Created; row-click navigates to `/quotes?id={id}` to open quote detail panel there |
| ~~Q6-c~~ | Orders | `/customers/1/orders` | **RESOLVED (Cycle 6)** — 1 row (J-1/SO-00001 at Order Confirmed); `CustomerOrdersTabComponent`; columns: Order # \| Status \| Lines \| Total \| Req. Date \| Created; row-click navigates to `/sales-orders?id={id}` |
| ~~Q6-d~~ | Invoices | `/customers/1/invoices` | **RESOLVED (Cycle 6)** — 1 row (INV-00001 Draft); `CustomerInvoicesTabComponent`; columns: Invoice # \| Status \| Total \| Due Date \| Created; row-click navigates to `/invoices?id={id}` |

---

## Q7 — Role-gated access — FULLY RESOLVED (Cycle 5)

| queue-id | role | result |
|----------|------|--------|
| ~~Q7-a~~ | ProductionWorker | **RESOLVED** — ALL Q2C routes blocked (→/dashboard); no access |
| ~~Q7-b~~ | OfficeManager | **RESOLVED** — ALL Q2C routes ACCESSIBLE including POs |
| ~~Q7-c~~ | PM | **RESOLVED** — ALL Q2C routes ACCESSIBLE (including purchasing/shipments/invoices/payments — broader than source guards suggest, see DN-4) |
| ~~Q7-d~~ | Engineer | **RESOLVED** — ALL Q2C routes blocked (→/dashboard); no access |
| ~~Q7-e~~ | Manager vs Admin on settings | **RESOLVED (Cycle 5)** — isAdmin gate CONFIRMED LIVE: Admin sees Enable Auto-PO toggle + Default Mode + Buffer Days + Send Chat Notifications; Manager sees ONLY Default Mode + Buffer Days (Enable Auto-PO and Send Chat Notifications hidden from Manager) |
| ~~Q7-f~~ | OM/Mgr/PM button-level | **RESOLVED (Cycle 6)** — OfficeManager: FULL CREATE ACCESS (New Quote \| New Order \| New PO \| New Invoice \| Uninvoiced Jobs \| New Payment all visible). Manager: FULL CREATE ACCESS — same as OfficeManager (New Quote \| New Order \| New PO \| New Invoice \| Uninvoiced Jobs \| New Payment all visible); also has PO tabs (Orders/Suggestions/Settings). PM: New Quote + New Order visible on their accessible routes; /purchase-orders/orders → redirected to /dashboard (PM blocked, see DN-7). |

---

## Q8 — Populated states

| queue-id | entity | seed action | populated state | status |
|----------|--------|-------------|-----------------|--------|
| ~~Q8-a~~ | Quote | POST /api/v1/quotes | Quotes list populated, quote detail panel | **RESOLVED** — QT-00001 in list; detail panel observed (Q1-a) |
| ~~Q8-b~~ | Sales Order | Confirm SO + advance job to Order Confirmed | SO list populated (projected list), SO detail panel | **RESOLVED (Cycle 5)** — J-1 visible; 8-tab panel observed (Q1-b) |
| ~~Q8-c~~ | Purchase Order | Pre-existing POs | PO list populated, PO detail, receive dialog | **RESOLVED** — 4 POs in list; detail + receive dialog observed (Q1-c, Q3-d) |
| ~~Q8-d~~ | ~~RFQ~~ | ~~POST /api/v1/rfqs~~ | ~~RFQ list + detail~~ | **TERMINAL** — CAP-P2P-RFQ disabled (DN-8); maps to Q1-d |
| ~~Q8-e~~ | Invoice | POST /api/v1/invoices | Invoice list + detail | **RESOLVED (Cycle 5)** — INV-00001; flat panel observed (Q1-e) |
| ~~Q8-f~~ | Shipment | POST /api/v1/shipments | Shipment list + detail + tracking timeline | **RESOLVED** — SH-00001; flat panel observed (Q1-f); TrackingTimeline resolved separately (Q5-a, cycle-6b) |
| ~~Q8-g~~ | Payment | POST /api/v1/payments | Payment list + detail | **RESOLVED (Cycle 5)** — PMT-00001; flat panel observed (Q1-g) |
| ~~Q8-h~~ | ~~Customer Return~~ | ~~POST /api/v1/customer-returns~~ | ~~Returns list + detail~~ | **TERMINAL** — CAP-O2C-RMA disabled (DN-8); maps to Q1-h |

---

## Open questions from source cross-reference

| id | question | status |
|----|----------|--------|
| ~~OQ1~~ | Is `EstimateFormDialogComponent` triggered from quotes page header? | **RESOLVED** — Not triggered from any observed navigation; grep finds zero callers in all .ts files. Dead code / pending wiring (DN-3) |
| ~~OQ2~~ | What tabs does `QuoteDetailPanelComponent` contain? | **RESOLVED** — NO TABS; single scrollable panel. Activity is an inline section with ALL/CONVERSATION/NOTES/HISTORY filter buttons, not tabs |
| ~~OQ3~~ | Does `SalesOrderDetailPanelComponent` embed a `ScheduleTimelineComponent`? | **RESOLVED (Cycle 5)** — Yes: "Schedule" is tab 2 of 8 in the SO detail panel. Live panel has Schedule tab present. ScheduleTimelineComponent renders within that tab. |
| ~~OQ4~~ | Is purchasing (`/purchasing`) truly RFQ-only, or does it have tabs? | **RESOLVED** — RFQ-only; single page with Search+Status filter; no tabs |
| ~~OQ5~~ | Is `RecurringOrdersComponent` accessible to all roles or Admin/Manager only? | **RESOLVED** — OfficeManager, Manager, PM all ACCESSIBLE (route guard only: same as parent sales-orders route). No button-level gating in template |
| ~~OQ6~~ | Do `/customer-returns` require an existing shipment, or can they be created standalone? | **RESOLVED** — Standalone creation supported: create dialog shows Customer + Original Job (optional search) + Reason + Return Date + Notes; no mandatory shipment link |

---

## Data Notes (DN)

| id | note |
|----|------|
| DN-1 | `/api/v1/sales-orders` is a job-projected read-path. Only shows jobs at `order_confirmed` (stageId=3) and downstream stages. Draft SOs are invisible. SO-00001 seeded as Draft → job J-1 created at stageId=1 → manually patched to stageId=3 via `PATCH /api/v1/jobs/1/stage {"stageId":3}`. |
| DN-2 | Detail dialogs are thin `mat-dialog` wrappers around their panel counterparts (e.g. `SalesOrderDetailDialogComponent` hosts `SalesOrderDetailPanelComponent`). |
| DN-3 | `EstimateFormDialogComponent` has zero callers in .ts files — dead code or pending wiring. Not triggerable from any observed navigation path. |
| DN-4 | PM role (`pm@forge.local`) accesses all Q2C routes despite `app.routes.ts` listing only Admin/Manager/OfficeManager in guards. Likely seeded with multiple roles. |
| DN-5 | `taxRate` API field is a decimal fraction <1 (e.g. 0.085), NOT a percentage. `"'Tax Rate' must be less than '1'."` validation error returned for values ≥1. |
| DN-6 | SO detail panel tab content selectors (`.field-label`, `dt`, `.prop-label`) returned empty in Playwright sweep — fields are likely rendered as plain `<td>` or custom layout elements. Screenshots at `q2c-cycle5/so-detail-tab*.png` capture visual content. Full field inventory requires source read of `sales-order-detail-panel.component.html`. |
| DN-7 | **RESOLVED (Cycle 6).** PM on `/purchase-orders/orders` is REDIRECTED to `/dashboard` by `roleGuard`. Source `app.routes.ts` confirms: `/purchase-orders` guard allows only `['Admin','Manager','OfficeManager']` — PM is not listed. Guard redirects to `/dashboard` (not to `/kanban`). The job board content seen in Cycle 5 sweep WAS the dashboard page. Cycle 3 "ACCESSIBLE" classification was a false positive — `app-page-header` exists on `/dashboard` too. PM's final URL on /purchase-orders/orders visit confirmed as `/dashboard` in Cycle 6. **Admin/Manager/OfficeManager DO see correct PO list**: 4 rows, columns: PO # \| Vendor \| Job \| Status \| Lines \| Ordered \| Received \| Expected \| Created. No "Buyer" or "Purchaser" role exists in the application's route guards. |
| DN-8 | Three capabilities are disabled server-side in this installation: `CAP-O2C-RMA` (customer returns), `CAP-P2P-RFQ` (purchasing/RFQs), `CAP-O2C-RECURRING` (recurring orders). The UI renders all pages and dialogs normally for these features (no capability-disabled message shown), but all API mutations return `{"code":"capability-disabled"}`. RecurringOrderDialogComponent create dialog IS accessible and observed. |
| DN-9 | Customer detail page has 11 tabs, broader than Q6's scope: Overview \| Contacts \| Addresses \| Estimates \| Quotes \| Orders \| Jobs \| Invoices \| Pricing \| Interactions \| Activity. Q6 only targeted Q2C-relevant tabs (Estimates/Quotes/Orders/Invoices). Remaining tabs: Contacts (0 rows), Addresses (0 rows), Jobs (1 row — J-1), Pricing (0 rows), Interactions (0 rows), Activity (0 rows). The Jobs tab lists production jobs for this customer and is not a Q2C-owned component. |

---

## Seeded Records Reference

| entity | id | number | status | seeded by |
|--------|-----|--------|--------|-----------|
| Customer | 1,2 | — | — | pre-existing (Acme Corp) |
| Vendor | 1–4 | — | — | pre-existing |
| Part | 1–5 | RAW-00001, PRT-00001..00003, ASM-00001 | — | pre-existing |
| Purchase Order | 1 | PO-00001 | Acknowledged | pre-existing |
| Purchase Order | 2,3 | PO-00002,003 | Received | pre-existing |
| Purchase Order | 4 | PO-00004 | Draft | seeded cycle 1 |
| Quote | 2 | QT-00001 | Draft | seeded cycle 1 (2 lines: PRT-00001 ×10 @$25, PRT-00002 ×5 @$50) |
| Sales Order | 1 | SO-00001 | Confirmed | seeded cycle 1; confirmed + job J-1 advanced to stageId=3 in cycle 5 |
| Job | 1 | J-1 | Order Confirmed (stageId=3) | auto-created from SO-00001; stage advanced cycle 5 |
| Shipment | 1 | SH-00001 | Pending | seeded cycle 5 (FedEx, TRACK-TEST-001, 3× PRT-00001) |
| Invoice | 1 | INV-00001 | Draft | seeded cycle 5 ($135.625, customer 1, SO-00001) |
| Payment | 1 | PMT-00001 | — | seeded cycle 5 (Check, $135.625, applied to INV-00001) |

---

## Terminal-only remainder — queue drained

The following rows are the only non-resolved entries remaining. All are environment-blocked with fully documented trigger conditions; no further live observation is possible in this env.

| queue-id | component | terminal reason |
|----------|-----------|-----------------|
| Q1-d | `RfqDetailDialogComponent` | CAP-P2P-RFQ disabled server-side; RFQ seeding impossible; page-level UI state documented |
| Q1-h | `CustomerReturnDetailDialogComponent` + `CustomerReturnDetailPanelComponent` | CAP-O2C-RMA disabled server-side; return seeding impossible; page-level UI state documented |
| Q3-c | `OffTierPromptDialogComponent` | Requires vendor pricing tier config absent from this env; exact trigger conditions documented from source (`po-dialog.component.ts:309-317`) |

> **Note for cataloger:** Q5-a `TrackingTimelineComponent` is **RESOLVED** in this queue (cycle-6b live observation with 2 events). The catalog still marks it "terminal" in the checklist (line 112) and component entry (line 600) — those need updating to reflect the live observation.  
> **Note for cataloger:** `StatusBadgeComponent`, `ActivityTimelineComponent`, and `DetailSidePanelComponent` appear in Q2C feature source but are absent from the shared-components checklist in the catalog. Verify coverage in inline feature entries or add to checklist.

---

_Queue skeleton filed: 2026-05-22 · ui-scout cycle 1. Cycle 4: Q2/Q3-d/Q7-route resolved. Cycle 5: Q1-b/e/f/g/i, Q3-a/b, Q5-b, Q7-e/f, Q8-b/e/f/g, DN-8. Cycle 6: Q6-a/b/c/d, Q4, Q7-f Manager, DN-7/9. Cycle 6b: Q5-a (TrackingTimeline live), Q1-d/h/i page-level state, Q3-c source-confirmed terminal. Final reconciliation: queue drained to 3 terminal rows (Q1-d, Q1-h, Q3-c). Catalog discrepancy filed re: TrackingTimeline terminal/resolved mismatch + 3 shared components not in checklist._
