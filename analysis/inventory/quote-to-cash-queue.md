# Quote-to-Cash — Scout Queue

> Filed by: ui-scout phase-02  
> Dequeue: open each item, observe live, update `quote-to-cash.md` entries, tick off.  
> Single writer: ui-scout (scout owns this file; cataloger owns quote-to-cash.md).

---

## Q1 — Detail dialogs / panels (need seeded records to open)

**Why unreached:** All list pages start empty. Records must exist before row-click opens detail panel/dialog.

| queue-id | entity | dialog | panel | trigger | pre-req |
|----------|--------|--------|-------|---------|---------|
| Q1-a | Quote | `QuoteDetailDialogComponent` | `QuoteDetailPanelComponent` | click quote row | 1 quote seeded |
| Q1-b | Sales Order | `SalesOrderDetailDialogComponent` | `SalesOrderDetailPanelComponent` | click SO row | 1 SO seeded |
| Q1-c | Purchase Order | `PoDetailDialogComponent` | `PoDetailPanelComponent` | click PO row | 1 PO + vendor seeded |
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

## Q2 — Create dialogs (role-gated or form-complex)

**Why queued:** Create dialogs depend on having customer/part/vendor data loaded in autocompletes to trigger full populated form state.

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
| Q3-d | `ReceiveDialogComponent` | `/purchase-orders/orders` → PO detail | Receive goods against a PO; needs PO in "Sent/Confirmed" status |

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

## Q7 — Role-gated access (quote-to-cash specific)

| queue-id | role | surfaces to verify |
|----------|------|--------------------|
| Q7-a | ProductionWorker | Confirm no access to quotes/invoices/payments; check if SO is read-only |
| Q7-b | OfficeManager | Confirm scope: quotes, SOs, invoices, shipments, payments — but not POs? |
| Q7-c | PM | Confirm scope: quotes, SOs, purchasing (RFQ)? |
| Q7-d | Engineer | Confirm: PO visibility (can create?), no invoice/payment access |
| Q7-e | Manager vs Admin | Confirm Manager cannot see `/purchase-orders/settings` (Admin-only) |

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

| id | question | source location |
|----|----------|----------------|
| OQ1 | Is `EstimateFormDialogComponent` triggered from quotes page header or from within QuoteDialogComponent? Determine trigger path. | `features/quotes/quotes.component.ts` + html |
| OQ2 | What tabs does `QuoteDetailPanelComponent` contain? Source only reveals `EntityActivitySectionComponent` + `EntityLinkComponent`. | `features/quotes/components/quote-detail-panel/quote-detail-panel.component.html` |
| OQ3 | Does `SalesOrderDetailPanelComponent` embed a `ScheduleTimelineComponent`? | `features/sales-orders/components/schedule-timeline/` |
| OQ4 | Is purchasing (`/purchasing`) truly RFQ-only, or does it have tabs? | `features/purchasing/purchasing.component.html` |
| OQ5 | Is `RecurringOrdersComponent` accessible to all roles or Admin/Manager only? | `app.routes.ts` guards for `sales-orders/recurring` |
| OQ6 | Do `/customer-returns` require an existing shipment, or can they be created standalone? | `features/customer-returns/components/customer-return-dialog/` |

---

_Queue skeleton filed: 2026-05-22 · ui-scout cycle 1 (source pre-read). Live sweep in progress._
