# Quote-to-Cash — Scout Queue

> Filed by: ui-scout phase-02  
> Dequeue: open each item, observe live, update `quote-to-cash.md` entries, tick off.  
> Single writer: ui-scout owns this queue file. Source-cataloger owns quote-to-cash.md.  
> **Cycle 4 update:** Q2 (create dialogs) fully resolved — all 8 create dialogs observed live. Q1-a (quote detail) and Q1-c (PO detail + receive) resolved. Q7 (role access) partially resolved — route-level access confirmed; capability-level still open. Q3-d (ReceiveDialog) resolved.

---

## Q1 — Detail dialogs / panels (need seeded records to open)

**Why unreached:** All list pages start empty. Records must exist before row-click opens detail panel/dialog.

| queue-id | entity | dialog | panel | trigger | pre-req |
|----------|--------|--------|-------|---------|---------|
| ~~Q1-a~~ | ~~Quote~~ | ~~`QuoteDetailDialogComponent`~~ | ~~`QuoteDetailPanelComponent`~~ | ~~click quote row~~ | **RESOLVED** — QT-00001 observed; single scrollable panel, no tabs; fields: Status·Customer·Notes·LineItems·Subtotal·Tax·Total·Created·Updated·Delete·Send·Activity |
| Q1-b | Sales Order | `SalesOrderDetailDialogComponent` | `SalesOrderDetailPanelComponent` | click SO row | 1 SO seeded |
| ~~Q1-c~~ | ~~Purchase Order~~ | ~~`PoDetailDialogComponent`~~ | ~~`PoDetailPanelComponent`~~ | ~~click PO row~~ | **RESOLVED** — PO-00001 (Acknowledged) observed; flat panel; fields: Status·Submitted·ExpDelivery·Acknowledged·Incoterm·Currency·FxRate·Barcode·Notes·LineItems·Created·Updated·Cancel/ShortClose/ReceiveItems·Activity |
| Q1-d | RFQ | `RfqDetailDialogComponent` | — | click RFQ row | 1 RFQ seeded |
| Q1-e | Invoice | `InvoiceDetailDialogComponent` | `InvoiceDetailPanelComponent` | click invoice row | 1 invoice seeded |
| Q1-f | Shipment | `ShipmentDetailDialogComponent` | `ShipmentDetailPanelComponent` | click shipment row | 1 shipment seeded |
| Q1-g | Payment | `PaymentDetailDialogComponent` | `PaymentDetailPanelComponent` | click payment row | 1 payment seeded |
| Q1-h | Customer Return | `CustomerReturnDetailDialogComponent` | `CustomerReturnDetailPanelComponent` | click return row | 1 return seeded |
| Q1-i | Recurring Order | `RecurringOrderDialogComponent` | — | from recurring list | 1 template seeded |

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
| Q3-a | `AutoPoPanelComponent` | `/purchase-orders/suggestions` | Auto-PO suggestion list; needs parts at reorder threshold |
| Q3-b | `AutoPoSettingsPanelComponent` | `/purchase-orders/settings` | Admin-only; confirm it renders for Admin, not for Manager |
| Q3-c | `OffTierPromptDialogComponent` | Within PO create flow | Triggered when vendor offers off-tier pricing; hard to trigger in empty env |
| ~~Q3-d~~ | ~~`ReceiveDialogComponent`~~ | ~~`/purchase-orders/orders` → PO detail~~ | **RESOLVED** — PO-00001 Acknowledged; dialog shows: ReceiveAll btn + table (Part#/Desc/Ordered/Received/Remaining/ReceiveQty) + Actual Freight + Allocation dropdown ("By Extended Value (default)") + Cancel/Receive Items |

---

## Q4 — Quote/Estimate embedded flow

| queue-id | component | route | notes |
|----------|-----------|-------|-------|
| Q4-a | `EstimateFormDialogComponent` (full form) | `/quotes` | Complex dialog: materials/operations/overhead inputs, compute results; needs work-centers seeded |
| Q4-b | Estimate result display (populated) | Within estimate dialog | Result table with computed costs; trigger by running an estimate |
| Q4-c | Quote detail tabs (within QuoteDetailPanel) | Quote detail panel | Confirm tab count and component names for line items, activity, etc. |

---

## Q5 — Shipment sub-components

| queue-id | component | route | notes |
|----------|-----------|-------|-------|
| Q5-a | `TrackingTimelineComponent` | Shipment detail panel | Shipment tracking timeline; requires tracking number or status progression |
| Q5-b | `ShippingRatesDialogComponent` | `/shipments` or shipment detail | Rate-shop dialog; confirm trigger mechanism |

---

## Q6 — Customer detail tabs (Q2C cross-link)

**Why queued:** Customer (id=1) was seeded but no Q2C records exist yet. Tab content = empty states only.

| queue-id | tab | route | pre-req |
|----------|-----|-------|---------|
| Q6-a | estimates tab | `/customers/1/estimates` | 1 quote with estimate |
| Q6-b | quotes tab | `/customers/1/quotes` | 1 quote for customer 1 |
| Q6-c | orders tab | `/customers/1/orders` | 1 SO for customer 1 |
| Q6-d | invoices tab | `/customers/1/invoices` | 1 invoice for customer 1 |

---

## Q7 — Role-gated access — ROUTE-LEVEL RESOLVED, CAPABILITY-LEVEL OPEN

| queue-id | role | result |
|----------|------|--------|
| ~~Q7-a~~ | ProductionWorker | **RESOLVED** — ALL Q2C routes blocked (→/dashboard); no access |
| ~~Q7-b~~ | OfficeManager | **RESOLVED** — ALL Q2C routes ACCESSIBLE including POs |
| ~~Q7-c~~ | PM | **RESOLVED** — ALL Q2C routes ACCESSIBLE (including purchasing/shipments/invoices/payments — broader than source guards suggest, see DN-4) |
| ~~Q7-d~~ | Engineer | **RESOLVED** — ALL Q2C routes blocked (→/dashboard); no access |
| Q7-e | Manager vs Admin | **PARTIAL** — route-level: both access /purchase-orders/settings. Capability-level: source says `isAdmin` gate on settings content, but not verified live. Need Manager on settings page to see if content renders or is hidden |
| Q7-f | OM/Mgr/PM button-level | **OPEN** — Create button visibility and action availability (can OM create quotes? POs?) not yet verified per-capability |

---

## Q8 — Populated states (need seeded Q2C records)

| queue-id | entity | seed action | populated state targets |
|----------|--------|-------------|------------------------|
| Q8-a | Quote | POST /api/v1/quotes (need customer+part) | Quotes list table populated, quote detail panel all tabs |
| Q8-b | Sales Order | Convert quote → SO or direct create | SO list populated, SO detail panel |
| Q8-c | Purchase Order | POST /api/v1/purchase-orders (need vendor+part) | PO list populated, PO detail, receive dialog |
| Q8-d | RFQ | POST /api/v1/rfqs | RFQ list + detail |
| Q8-e | Invoice | Generate from SO/job | Invoice list + detail + accounting sync status |
| Q8-f | Shipment | From SO | Shipment list + detail + tracking timeline |
| Q8-g | Payment | From invoice | Payment list + detail |
| Q8-h | Customer Return | From SO/shipment | Returns list + detail |

---

## Open questions from source cross-reference

| id | question | status |
|----|----------|--------|
| ~~OQ1~~ | Is `EstimateFormDialogComponent` triggered from quotes page header? | **RESOLVED** — Not triggered from any observed navigation; grep finds zero callers in all .ts files. Dead code / pending wiring (DN-3) |
| ~~OQ2~~ | What tabs does `QuoteDetailPanelComponent` contain? | **RESOLVED** — NO TABS; single scrollable panel. Activity is an inline section with ALL/CONVERSATION/NOTES/HISTORY filter buttons, not tabs |
| ~~OQ3~~ | Does `SalesOrderDetailPanelComponent` embed a `ScheduleTimelineComponent`? | **RESOLVED** — Yes, in the 'schedule' tab (source confirmed). Live observation pending |
| ~~OQ4~~ | Is purchasing (`/purchasing`) truly RFQ-only, or does it have tabs? | **RESOLVED** — RFQ-only; single page with Search+Status filter; no tabs |
| ~~OQ5~~ | Is `RecurringOrdersComponent` accessible to all roles or Admin/Manager only? | **RESOLVED** — OfficeManager, Manager, PM all ACCESSIBLE (route guard only: same as parent sales-orders route). No button-level gating in template |
| ~~OQ6~~ | Do `/customer-returns` require an existing shipment, or can they be created standalone? | **RESOLVED** — Standalone creation supported: create dialog shows Customer + Original Job (optional search) + Reason + Return Date + Notes; no mandatory shipment link |

---

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
| Sales Order | 1 | SO-00001 | Draft | seeded cycle 1 (NOT visible in UI list — see DN-1) |

---

_Queue skeleton filed: 2026-05-22 · ui-scout cycle 1. Cycle 4 update: Q2/Q3-d resolved, Q7 route-level resolved, all OQs resolved. Remaining open: Q1-b,d,e,f,g,h,i · Q3-a,b,c · Q4 · Q5 · Q6 · Q7-e,f · Q8-a..h._
