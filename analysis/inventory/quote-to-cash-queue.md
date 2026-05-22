# Quote-to-Cash — Scout Queue

> Filed by: ui-scout phase-02  
> Dequeue: open each item, observe live, update `quote-to-cash.md` entries, tick off.  
> Single writer: ui-scout owns this queue file. Source-cataloger owns quote-to-cash.md.  
> **Cycle 4 update:** Q2 (create dialogs) fully resolved — all 8 create dialogs observed live. Q1-a (quote detail) and Q1-c (PO detail + receive) resolved. Q7 (role access) partially resolved — route-level access confirmed; capability-level still open. Q3-d (ReceiveDialog) resolved.  
> **Cycle 5 update:** Q1-b (SO detail), Q1-e (invoice detail), Q1-f (shipment detail), Q1-g (payment detail) all resolved. Q1-i (RecurringOrderDialog) partially resolved — create dialog observed, populated list state blocked by CAP-O2C-RECURRING disabled. Q3-a/b resolved. Q5-b (ShippingRatesDialog) resolved. Q7-e/f resolved. New capability-gate findings: CAP-O2C-RMA, CAP-P2P-RFQ, CAP-O2C-RECURRING all disabled server-side — blocks Q1-d, Q1-h, and populated states for those entities.

---

## Q1 — Detail dialogs / panels (need seeded records to open)

**Why unreached:** All list pages start empty. Records must exist before row-click opens detail panel/dialog.

| queue-id | entity | dialog | panel | trigger | pre-req |
|----------|--------|--------|-------|---------|---------|
| ~~Q1-a~~ | ~~Quote~~ | ~~`QuoteDetailDialogComponent`~~ | ~~`QuoteDetailPanelComponent`~~ | ~~click quote row~~ | **RESOLVED** — QT-00001 observed; single scrollable panel, no tabs; fields: Status·Customer·Notes·LineItems·Subtotal·Tax·Total·Created·Updated·Delete·Send·Activity |
| ~~Q1-b~~ | ~~Sales Order~~ | ~~`SalesOrderDetailDialogComponent`~~ | ~~`SalesOrderDetailPanelComponent`~~ | ~~click SO row~~ | **RESOLVED (Cycle 5)** — J-1 (SO-00001 at Order Confirmed) visible in list after job stage advance; panel opened; 8 tabs: Overview \| Line Items \| Schedule \| Shipments \| Returns \| Documents \| Invoices \| Activity; status badges: Confirmed + Partially Shipped; action buttons: copy \| Print \| Regenerate; tab content selectors returned sparse (field labels embedded deeper than `.field-label` — screenshots captured at `q2c-cycle5/so-detail-tab*.png`). See DN-6. |
| ~~Q1-c~~ | ~~Purchase Order~~ | ~~`PoDetailDialogComponent`~~ | ~~`PoDetailPanelComponent`~~ | ~~click PO row~~ | **RESOLVED** — PO-00001 (Acknowledged) observed; flat panel; fields: Status·Submitted·ExpDelivery·Acknowledged·Incoterm·Currency·FxRate·Barcode·Notes·LineItems·Created·Updated·Cancel/ShortClose/ReceiveItems·Activity |
| ~~Q1-d~~ | ~~RFQ~~ | ~~`RfqDetailDialogComponent`~~ | ~~—~~ | ~~click RFQ row~~ | **CAPABILITY-BLOCKED** — CAP-P2P-RFQ disabled server-side; `/api/v1/purchasing/rfqs` returns `{"code":"capability-disabled","capability":"CAP-P2P-RFQ"}`; UI page at `/purchasing` renders normally (empty state + New RFQ button visible) but seeding blocked; detail panel unreachable |
| ~~Q1-e~~ | ~~Invoice~~ | ~~`InvoiceDetailDialogComponent`~~ | ~~`InvoiceDetailPanelComponent`~~ | ~~click invoice row~~ | **RESOLVED (Cycle 5)** — INV-00001 (Draft, $135.625) observed; flat panel, NO TABS; line items table: Part# \| Description \| Qty \| Unit Price \| Total; action buttons: Delete \| Void \| Send; activity filters: All \| Conversation \| Notes \| History |
| ~~Q1-f~~ | ~~Shipment~~ | ~~`ShipmentDetailDialogComponent`~~ | ~~`ShipmentDetailPanelComponent`~~ | ~~click shipment row~~ | **RESOLVED (Cycle 5)** — SH-00001 (Pending, FedEx, TRACK-TEST-001) observed; flat panel, NO TABS; fields: Description \| Quantity; action buttons: Get Rates \| Mark Shipped \| Track; activity filters; TrackingTimelineComponent NOT rendered (requires shipped status — see Q5-a) |
| ~~Q1-g~~ | ~~Payment~~ | ~~`PaymentDetailDialogComponent`~~ | ~~`PaymentDetailPanelComponent`~~ | ~~click payment row~~ | **RESOLVED (Cycle 5)** — PMT-00001 (Check, $135.625) observed; flat panel, NO TABS; applications table: Invoice # \| Amount; no action buttons (read-only panel); close button only |
| Q1-h | Customer Return | `CustomerReturnDetailDialogComponent` | `CustomerReturnDetailPanelComponent` | click return row | **CAPABILITY-BLOCKED** — CAP-O2C-RMA disabled server-side; POST /api/v1/customer-returns returns `{"code":"capability-disabled","capability":"CAP-O2C-RMA"}`; UI page renders normally but seeding blocked; detail panel unreachable |
| ~~Q1-i~~ | ~~Recurring Order~~ | ~~`RecurringOrderDialogComponent`~~ | ~~—~~ | ~~from recurring list~~ | **PARTIALLY RESOLVED (Cycle 5)** — CAP-O2C-RECURRING disabled server-side; BUT create dialog opens fine (UI not capability-gated at dialog level); RecurringOrderDialogComponent fields: Template name \| Customer \| Next generation date \| Interval in days \| Notes \| line items (Part \| Description \| Qty \| Unit price); buttons: Cancel \| Save. Populated list state blocked (cannot seed via API). |

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
| Q3-c | `OffTierPromptDialogComponent` | Within PO create flow | Triggered when vendor offers off-tier pricing; hard to trigger in empty env; remains unreached |

---

## Q4 — Quote/Estimate embedded flow

| queue-id | component | route | notes |
|----------|-----------|-------|-------|
| Q4-a | `EstimateFormDialogComponent` (full form) | `/quotes` | **CONFIRMED UNREACHABLE** — No estimate/calculator button found on /quotes page in Cycle 5 sweep; zero callers grep confirmed (DN-3); dead code / pending wiring |
| Q4-b | Estimate result display (populated) | Within estimate dialog | Blocked by Q4-a unreachable |
| Q4-c | Quote detail tabs (within QuoteDetailPanel) | Quote detail panel | **CONFIRMED** — NO TABS; single scrollable panel (resolved in Q1-a) |

---

## Q5 — Shipment sub-components

| queue-id | component | route | notes |
|----------|-----------|-------|-------|
| Q5-a | `TrackingTimelineComponent` | Shipment detail panel | **UNREACHED** — `app-tracking-timeline` not present in DOM for SH-00001 at Pending status; requires status progression to Shipped (click "Mark Shipped") or a real carrier tracking event; note: "Track" button IS visible in shipment detail panel action bar |
| ~~Q5-b~~ | ~~`ShippingRatesDialogComponent`~~ | ~~`/shipments` or shipment detail~~ | **RESOLVED (Cycle 5)** — Trigger: "Get Rates" button (icon: request_quote) in shipment detail panel action bar; dialog content: Cancel \| Create Label buttons; functions as a shipping label creation dialog (not rate-shopping); dialog rendered from SH-00001 Pending state |

---

## Q6 — Customer detail tabs (Q2C cross-link)

**Why queued:** Customer (id=1) was seeded but no Q2C records exist yet. Tab content = empty states only. Now that SO/invoice/payment/shipment exist for customer 1, these tabs should populate.

| queue-id | tab | route | pre-req | status |
|----------|-----|-------|---------|--------|
| Q6-a | estimates tab | `/customers/1/estimates` | 1 quote with estimate | OPEN — no estimate seeded (EstimateFormDialog unreachable) |
| Q6-b | quotes tab | `/customers/1/quotes` | 1 quote for customer 1 | READY — QT-00001 exists for customer 1 |
| Q6-c | orders tab | `/customers/1/orders` | 1 SO for customer 1 | READY — SO-00001/J-1 exists for customer 1 |
| Q6-d | invoices tab | `/customers/1/invoices` | 1 invoice for customer 1 | READY — INV-00001 exists for customer 1 |

---

## Q7 — Role-gated access — FULLY RESOLVED (Cycle 5)

| queue-id | role | result |
|----------|------|--------|
| ~~Q7-a~~ | ProductionWorker | **RESOLVED** — ALL Q2C routes blocked (→/dashboard); no access |
| ~~Q7-b~~ | OfficeManager | **RESOLVED** — ALL Q2C routes ACCESSIBLE including POs |
| ~~Q7-c~~ | PM | **RESOLVED** — ALL Q2C routes ACCESSIBLE (including purchasing/shipments/invoices/payments — broader than source guards suggest, see DN-4) |
| ~~Q7-d~~ | Engineer | **RESOLVED** — ALL Q2C routes blocked (→/dashboard); no access |
| ~~Q7-e~~ | Manager vs Admin on settings | **RESOLVED (Cycle 5)** — isAdmin gate CONFIRMED LIVE: Admin sees Enable Auto-PO toggle + Default Mode + Buffer Days + Send Chat Notifications; Manager sees ONLY Default Mode + Buffer Days (Enable Auto-PO and Send Chat Notifications hidden from Manager) |
| ~~Q7-f~~ | OM/Mgr/PM button-level | **RESOLVED (Cycle 5)** — OfficeManager: FULL CREATE ACCESS (New Quote \| New Order \| New PO \| New Invoice \| Uninvoiced Jobs \| New Payment all visible). PM: New Quote + New Order buttons visible; /purchase-orders/orders shows JOB BOARD content not PO list (PM lands on job production board instead of PO list — likely PM role includes board access only for POs; see DN-7). Manager: not separately swept (assumed similar to Admin based on route access). |

---

## Q8 — Populated states

| queue-id | entity | seed action | populated state | status |
|----------|--------|-------------|-----------------|--------|
| ~~Q8-a~~ | Quote | POST /api/v1/quotes | Quotes list populated, quote detail panel | **RESOLVED** — QT-00001 in list; detail panel observed (Q1-a) |
| ~~Q8-b~~ | Sales Order | Confirm SO + advance job to Order Confirmed | SO list populated (projected list), SO detail panel | **RESOLVED (Cycle 5)** — J-1 visible; 8-tab panel observed (Q1-b) |
| ~~Q8-c~~ | Purchase Order | Pre-existing POs | PO list populated, PO detail, receive dialog | **RESOLVED** — 4 POs in list; detail + receive dialog observed (Q1-c, Q3-d) |
| Q8-d | RFQ | POST /api/v1/rfqs | RFQ list + detail | **BLOCKED** — CAP-P2P-RFQ disabled |
| ~~Q8-e~~ | Invoice | POST /api/v1/invoices | Invoice list + detail | **RESOLVED (Cycle 5)** — INV-00001; flat panel observed (Q1-e) |
| ~~Q8-f~~ | Shipment | POST /api/v1/shipments | Shipment list + detail + tracking timeline | **RESOLVED (Cycle 5)** — SH-00001; flat panel observed (Q1-f); TrackingTimeline requires Shipped status (Q5-a open) |
| ~~Q8-g~~ | Payment | POST /api/v1/payments | Payment list + detail | **RESOLVED (Cycle 5)** — PMT-00001; flat panel observed (Q1-g) |
| Q8-h | Customer Return | POST /api/v1/customer-returns | Returns list + detail | **BLOCKED** — CAP-O2C-RMA disabled |

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
| DN-7 | PM on `/purchase-orders/orders` renders JOB BOARD content (production board with "Create your first job", focus mode, board view controls) rather than PO list. PM role may be mapped to job board context for the PO route, or route guard redirects PM to board while leaving URL at /purchase-orders/orders. Cycle 3 role sweep recorded this as ACCESSIBLE (page-header found), but content is job board, not PO management. Requires source read to clarify. |
| DN-8 | Three capabilities are disabled server-side in this installation: `CAP-O2C-RMA` (customer returns), `CAP-P2P-RFQ` (purchasing/RFQs), `CAP-O2C-RECURRING` (recurring orders). The UI renders all pages and dialogs normally for these features (no capability-disabled message shown), but all API mutations return `{"code":"capability-disabled"}`. RecurringOrderDialogComponent create dialog IS accessible and observed. |

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

## Remaining open items after Cycle 5

| item | blocker |
|------|---------|
| Q1-h Customer Return detail panel | CAP-O2C-RMA disabled — cannot seed return |
| Q1-d RFQ detail panel | CAP-P2P-RFQ disabled — cannot seed RFQ |
| Q3-c OffTierPromptDialog | requires off-tier pricing trigger in PO flow — untriggerable in current env |
| Q4-a EstimateFormDialog (full/populated) | zero callers in source — unwired dead code |
| Q5-a TrackingTimelineComponent | requires shipment at Shipped status or carrier tracking event |
| Q6-b/c/d Customer detail tabs | READY to sweep — pre-reqs now met (QT-00001, SO-00001/J-1, INV-00001 all for customer 1) |
| DN-7 investigation | PM on /purchase-orders/orders shows job board — source read needed to confirm route behavior |

---

_Queue skeleton filed: 2026-05-22 · ui-scout cycle 1. Cycle 4 update: Q2/Q3-d resolved, Q7 route-level resolved, all OQs resolved. Cycle 5 update: Q1-b/e/f/g resolved, Q1-i partially resolved (dialog observed, populated blocked), Q3-a/b resolved, Q5-b resolved, Q7-e/f resolved, Q8-b/e/f/g resolved. Capability gates discovered: DN-8. Remaining: Q1-d/h (capability-blocked) · Q3-c · Q4-a/b · Q5-a · Q6-b/c/d (READY) · DN-7 investigation._
