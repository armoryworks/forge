# Quote-to-Cash Region — Component Inventory

> **Phase:** quote-to-cash · **Method:** observe-and-record (no code changes)
> **Single writer:** source-cataloger owns this file. Scout writes queue only.
> **Source on disk:** HEAD e9b7802 (file:line mappings from source; states `unconfirmed` until scout observes live)
> **Last updated:** Cycle 3 (tree-reconciliation pass — features/ tree fully covered, shared/ usages noted)

---

## Cross-links

- **PO-Receiving** (this doc, Segment 4) covers the `ReceiveDialogComponent` and the receive flow launched from a PO detail panel.
- **Inventory-tab Receiving** (`/inventory/receiving`) was catalogued separately in [`master-data.md`](master-data.md) — do NOT re-catalog it here.
- **Reciprocal pointer needed in master-data.md:** Add a note in the `/inventory/receiving` section pointing to this doc for the PO-side receive flow.

---

## Schema

| field | content |
|-------|---------|
| component | name / selector |
| type | page · panel · dialog · form · table · cluster · tab · action · state · shared-cmp |
| route | URL it lives on (or "shared") |
| file | `path:line` relative to `forge-ui/src/app/` — points to `@Component` decorator line |
| renders-for | role(s) + capability(ies) that gate it (or "all") |
| states | empty / loading / populated / error — `unconfirmed` until scout observes live |
| purpose | one line |

---

## Reconciliation Checklist

> Tick every item as it gets a completed entry below.
> Phase is NOT done until every item is ticked AND the queue is empty.

### Routes

- [ ] `/quotes` — QuotesComponent (list)
- [ ] `/sales-orders` — SalesOrdersComponent (list)
- [ ] `/sales-orders/recurring` — RecurringOrdersComponent (recurring templates list)
- [ ] `/purchase-orders` → redirects to `/purchase-orders/orders`
- [ ] `/purchase-orders/orders` — PurchaseOrdersComponent (orders tab)
- [ ] `/purchase-orders/suggestions` — PurchaseOrdersComponent (suggestions tab / AutoPoPanelComponent)
- [ ] `/purchase-orders/settings` — PurchaseOrdersComponent (settings tab / AutoPoSettingsPanelComponent; Admin only)
- [ ] `/purchasing` — PurchasingComponent (RFQ list)
- [ ] `/shipments` — ShipmentsComponent (list)
- [ ] `/invoices` — InvoicesComponent (list)
- [ ] `/payments` — PaymentsComponent (list)
- [ ] `/customer-returns` — CustomerReturnsComponent (list)

### Feature directories (all .ts component files accounted for)

#### quotes/
- [ ] `quotes.component.ts` (QuotesComponent)
- [ ] `components/quote-dialog/quote-dialog.component.ts`
- [ ] `components/quote-detail-dialog/quote-detail-dialog.component.ts`
- [ ] `components/quote-detail-panel/quote-detail-panel.component.ts`
- [ ] `components/estimate-form-dialog/estimate-form-dialog.component.ts`

#### sales-orders/
- [ ] `sales-orders.component.ts` (SalesOrdersComponent)
- [ ] `components/so-dialog/so-dialog.component.ts`
- [ ] `components/sales-order-detail-dialog/sales-order-detail-dialog.component.ts`
- [ ] `components/sales-order-detail-panel/sales-order-detail-panel.component.ts`
- [ ] `components/schedule-timeline/schedule-timeline.component.ts`
- [ ] `components/recurring-order-dialog/recurring-order-dialog.component.ts`
- [ ] `pages/recurring/recurring-orders.component.ts`

#### purchase-orders/
- [ ] `purchase-orders.component.ts` (PurchaseOrdersComponent)
- [ ] `components/po-dialog/po-dialog.component.ts`
- [ ] `components/po-detail-dialog/po-detail-dialog.component.ts`
- [ ] `components/po-detail-panel/po-detail-panel.component.ts`
- [ ] `components/receive-dialog/receive-dialog.component.ts` ← **PO-receiving entry point**
- [ ] `components/auto-po-panel/auto-po-panel.component.ts`
- [ ] `components/auto-po-settings-panel/auto-po-settings-panel.component.ts`
- [x] `components/auto-po-suggestions/auto-po-suggestions.component.ts` ← **dead code**: declared but never imported by any component; no entry needed
- [ ] `components/off-tier-prompt-dialog/off-tier-prompt-dialog.component.ts`

#### purchasing/
- [ ] `purchasing.component.ts` (PurchasingComponent)
- [ ] `components/rfq-dialog/rfq-dialog.component.ts`
- [ ] `components/rfq-detail-dialog/rfq-detail-dialog.component.ts`
- [ ] `components/rfq-list/rfq-list.component.ts`

#### shipments/
- [ ] `shipments.component.ts` (ShipmentsComponent)
- [ ] `components/shipment-dialog/shipment-dialog.component.ts`
- [ ] `components/shipment-detail-dialog/shipment-detail-dialog.component.ts`
- [ ] `components/shipment-detail-panel/shipment-detail-panel.component.ts`
- [ ] `components/tracking-timeline/tracking-timeline.component.ts`
- [ ] `components/shipping-rates-dialog/shipping-rates-dialog.component.ts`

#### invoices/
- [ ] `invoices.component.ts` (InvoicesComponent)
- [ ] `components/invoice-dialog/invoice-dialog.component.ts`
- [ ] `components/invoice-detail-dialog/invoice-detail-dialog.component.ts`
- [ ] `components/invoice-detail-panel/invoice-detail-panel.component.ts`
- [ ] `components/uninvoiced-jobs-panel/uninvoiced-jobs-panel.component.ts`

#### payments/
- [ ] `payments.component.ts` (PaymentsComponent)
- [ ] `components/payment-dialog/payment-dialog.component.ts`
- [ ] `components/payment-detail-dialog/payment-detail-dialog.component.ts`
- [ ] `components/payment-detail-panel/payment-detail-panel.component.ts`

#### customer-returns/
- [ ] `customer-returns.component.ts` (CustomerReturnsComponent)
- [ ] `components/customer-return-dialog/customer-return-dialog.component.ts`
- [ ] `components/customer-return-detail-dialog/customer-return-detail-dialog.component.ts`
- [ ] `components/customer-return-detail-panel/customer-return-detail-panel.component.ts`

### Shared components (usages noted in feature entries; ticked when usage documented)

> Sub-components of `DataTableComponent` (`column-filter-popover`, `column-manager-panel`) are internal DataTable infrastructure — not directly imported by q2c features; covered by DataTableComponent reference.

- [x] `AutocompleteComponent` — quote-dialog, so-dialog, po-dialog, shipment-dialog
- [x] `BarcodeInfoComponent` — so-detail-panel, po-detail-panel
- [x] `ConfirmDialogComponent` — quote-detail-panel, so-detail-panel, po-detail-panel, auto-po-panel, recurring-orders, invoice-detail-panel, payment-detail-panel, customer-return-detail-panel
- [x] `CurrencyDisplayComponent` — quotes (list), so (list), invoice (list), payment (list), quote-dialog, quote-detail-panel, so-detail-panel, po-detail-panel, rfq-detail-dialog, off-tier-prompt-dialog, invoice-dialog, invoice-detail-panel, payment-dialog, payment-detail-panel
- [x] `CurrencyInputComponent` — receive-dialog, po-dialog, po-detail-panel
- [x] `DataTableComponent` — all list pages; rfq-list, recurring-orders, auto-po-panel, rfq-detail-dialog (vendor response rows)
- [x] `DatepickerComponent` — quote-dialog, so-dialog, po-dialog, rfq-dialog, rfq-detail-dialog, invoice-dialog, payment-dialog, customer-return-dialog, recurring-order-dialog
- [x] `DialogComponent` — quote-dialog, so-dialog, po-dialog, po-detail-panel, rfq-dialog, rfq-detail-dialog, estimate-form-dialog, receive-dialog, invoice-dialog, uninvoiced-jobs-panel, shipping-rates-dialog, payment-dialog, customer-return-dialog, customer-return-detail-panel
- [x] `EmptyStateComponent` — receive-dialog (zero-lines state)
- [x] `EntityActivitySectionComponent` — quote-detail-panel, so-detail-panel, po-detail-panel, rfq-detail-dialog, invoice-detail-panel, payment-detail-panel, customer-return-detail-panel
- [x] `EntityLinkComponent` — quote-detail-panel, so-detail-panel, po-detail-panel, auto-po-panel, rfq-detail-dialog, invoice-detail-panel, payment-detail-panel
- [x] `EntityPickerComponent` — customer-return-dialog, recurring-order-dialog
- [x] `FileUploadZoneComponent` — so-detail-panel (documents tab)
- [x] `InputComponent` — all list pages (search), all create dialogs
- [x] `PageHeaderComponent` — quotes, sales-orders, purchase-orders, purchasing, shipments, invoices, payments, customer-returns (all list pages)
- [x] `PageLayoutComponent` — recurring-orders
- [x] `SelectComponent` — all list pages (filters); receive-dialog (freight method); auto-po-panel; auto-po-settings-panel; po-detail-panel; rfq-detail-dialog; multiple create dialogs
- [x] `TextareaComponent` — quote-dialog, so-dialog, po-dialog, rfq-dialog, rfq-detail-dialog, invoice-dialog, customer-return-dialog, recurring-order-dialog
- [x] `ToggleComponent` — auto-po-settings-panel
- [x] `ToolbarComponent` — recurring-orders
- [x] `ValidationButtonComponent` — all create dialogs; po-detail-panel (inline header edit); rfq-detail-dialog; auto-po-settings-panel
- [x] `ColumnCellDirective` — all list pages with DataTable; rfq-list; recurring-orders; auto-po-panel; rfq-detail-dialog
- [x] `LoadingBlockDirective` — all list pages; auto-po-panel; auto-po-settings-panel; rfq-detail-dialog; invoice-detail-panel; payment-detail-panel; customer-return-detail-panel; shipping-rates-dialog
- [x] `SpacerDirective` — recurring-orders (toolbar layout)

---

## Segment 1: Quotes / Estimates

### `/quotes` — QuotesComponent

| field | value |
|-------|-------|
| component | `app-quotes` / QuotesComponent |
| type | page |
| route | `/quotes` |
| file | `features/quotes/quotes.component.ts:22` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | unconfirmed |
| purpose | List all quotes; search + status filter; open create dialog or detail panel |

**Statuses observed in source:** Draft · Sent · Accepted · Declined · Expired · ConvertedToOrder

**Shared components used on this page:**
- `PageHeaderComponent` (`shared/components/page-header/`) — page title + action button
- `InputComponent` (`shared/components/input/`) — search field
- `SelectComponent` (`shared/components/select/`) — status filter
- `DataTableComponent` (`shared/components/data-table/`) — quotes table
- `CurrencyDisplayComponent` (`shared/components/currency-display/`) — monetary columns in table

---

| field | value |
|-------|-------|
| component | `app-quote-dialog` / QuoteDialogComponent |
| type | dialog |
| route | `/quotes` |
| file | `features/quotes/components/quote-dialog/quote-dialog.component.ts:37` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | unconfirmed |
| purpose | Create a new quote; multi-line form with customer autocomplete + part autocomplete; draft-aware |

**Shared components:** DialogComponent · InputComponent · SelectComponent · DatepickerComponent · TextareaComponent · AutocompleteComponent · CurrencyDisplayComponent · ValidationButtonComponent

---

| field | value |
|-------|-------|
| component | `app-quote-detail-dialog` / QuoteDetailDialogComponent |
| type | dialog |
| route | `/quotes` |
| file | `features/quotes/components/quote-detail-dialog/quote-detail-dialog.component.ts:11` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | unconfirmed |
| purpose | Thin Mat dialog shell that hosts QuoteDetailPanelComponent; opened via row-click or `?detail=quote:{id}` URL param |

---

| field | value |
|-------|-------|
| component | `app-quote-detail-panel` / QuoteDetailPanelComponent |
| type | panel |
| route | `/quotes` (inside detail dialog) |
| file | `features/quotes/components/quote-detail-panel/quote-detail-panel.component.ts:17` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | unconfirmed |
| purpose | Full quote detail view: header info, line items, status actions (Send, Accept, Decline, Convert to Order); loads on `quoteId` input signal |

**Shared components:** EntityActivitySectionComponent · EntityLinkComponent · CurrencyDisplayComponent · ConfirmDialogComponent

---

| field | value |
|-------|-------|
| component | `app-estimate-form-dialog` / EstimateFormDialogComponent |
| type | dialog |
| route | `/quotes` |
| file | `features/quotes/components/estimate-form-dialog/estimate-form-dialog.component.ts:86` |
| renders-for | Admin, Manager, PM, OfficeManager (source: same route guard as quotes) |
| states | unconfirmed |
| purpose | Cost-estimating calculator: materials (part + qty + drop-factor), operations (work-center + setup/run minutes + burden), NRE charges; computes unit cost + quote price; pre-fill support from part detail or quote line context |

**Shared components:** DialogComponent · InputComponent · SelectComponent · CurrencyDisplayComponent · ValidationButtonComponent

---

## Segment 2: Sales Orders

### `/sales-orders` — SalesOrdersComponent

| field | value |
|-------|-------|
| component | `app-sales-orders` / SalesOrdersComponent |
| type | page |
| route | `/sales-orders` |
| file | `features/sales-orders/sales-orders.component.ts:24` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | unconfirmed |
| purpose | List all sales orders; search + customer filter + status filter; open create dialog or detail panel; server-side paged total counter |

**Statuses in source (inferred from service):** Draft · Confirmed · InProduction · ReadyToShip · Shipped · Invoiced · Closed · Cancelled

**Shared components used:** PageHeaderComponent · InputComponent · SelectComponent · DataTableComponent · CurrencyDisplayComponent

---

| field | value |
|-------|-------|
| component | `app-so-dialog` / SoDialogComponent |
| type | dialog |
| route | `/sales-orders` |
| file | `features/sales-orders/components/so-dialog/so-dialog.component.ts:37` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | unconfirmed |
| purpose | Create a new sales order; multi-line form; requires customer + parts; draft-aware; credit-terms options |

**Shared components:** DialogComponent · InputComponent · SelectComponent · TextareaComponent · DatepickerComponent · AutocompleteComponent · CurrencyDisplayComponent · ValidationButtonComponent

---

| field | value |
|-------|-------|
| component | `app-sales-order-detail-dialog` / SalesOrderDetailDialogComponent |
| type | dialog |
| route | `/sales-orders` |
| file | `features/sales-orders/components/sales-order-detail-dialog/sales-order-detail-dialog.component.ts:17` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | unconfirmed |
| purpose | Thin Mat dialog shell that hosts SalesOrderDetailPanelComponent; returns `{ action: 'edit', salesOrder }` on edit |

---

| field | value |
|-------|-------|
| component | `app-sales-order-detail-panel` / SalesOrderDetailPanelComponent |
| type | panel |
| route | `/sales-orders` (inside detail dialog) |
| file | `features/sales-orders/components/sales-order-detail-panel/sales-order-detail-panel.component.ts:27` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | unconfirmed |
| purpose | Full SO detail: 8 tabs — overview · lines · schedule · shipments · returns · documents · invoices · activity |

**Tabs (source-confirmed):** `'overview' | 'lines' | 'schedule' | 'shipments' | 'returns' | 'documents' | 'invoices' | 'activity'`

**Shared components:** EntityActivitySectionComponent · EntityLinkComponent · CurrencyDisplayComponent · BarcodeInfoComponent · FileUploadZoneComponent · EmptyStateComponent · ConfirmDialogComponent

**Sub-component in panel:**

| field | value |
|-------|-------|
| component | `app-schedule-timeline` / ScheduleTimelineComponent |
| type | cluster |
| route | `/sales-orders` (within SO detail panel, schedule tab) |
| file | `features/sales-orders/components/schedule-timeline/schedule-timeline.component.ts:16` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | unconfirmed |
| purpose | Visual timeline of schedule milestones for an SO |

---

### `/sales-orders/recurring` — RecurringOrdersComponent

| field | value |
|-------|-------|
| component | `app-recurring-orders` / RecurringOrdersComponent |
| type | page |
| route | `/sales-orders/recurring` |
| file | `features/sales-orders/pages/recurring/recurring-orders.component.ts:30` |
| renders-for | Admin, Manager, PM, OfficeManager (confirmed: `sales-orders.routes.ts` has no additional guard on `recurring` sub-route; template has no button-level role gate) |
| states | unconfirmed |
| purpose | Manage recurring SO templates that the nightly job spins into fresh SalesOrders; Create + Delete only (no Edit by design — delete + recreate pattern) |

**Shared components:** PageLayoutComponent · ToolbarComponent · DataTableComponent · ConfirmDialogComponent

---

| field | value |
|-------|-------|
| component | `app-recurring-order-dialog` / RecurringOrderDialogComponent |
| type | dialog |
| route | `/sales-orders/recurring` |
| file | `features/sales-orders/components/recurring-order-dialog/recurring-order-dialog.component.ts:16` |
| renders-for | Admin, Manager |
| states | unconfirmed |
| purpose | Create a recurring SO template; fields include schedule config, customer, product lines via EntityPicker |

**Shared components:** DialogComponent · InputComponent · TextareaComponent · DatepickerComponent · EntityPickerComponent · ValidationButtonComponent

---

## Segment 3: Purchasing (RFQ)

### `/purchasing` — PurchasingComponent

| field | value |
|-------|-------|
| component | `app-purchasing` / PurchasingComponent |
| type | page |
| route | `/purchasing` |
| file | `features/purchasing/purchasing.component.ts:18` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | List all RFQs; search + status filter; open create or detail dialog |

**Statuses in source:** Draft · Sent · Receiving · EvaluatingResponses · Awarded · Cancelled · Expired

**Shared components:** PageHeaderComponent · InputComponent · SelectComponent

---

| field | value |
|-------|-------|
| component | `app-rfq-list` / RfqListComponent |
| type | table |
| route | `/purchasing` |
| file | `features/purchasing/components/rfq-list/rfq-list.component.ts:12` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | DataTable of RFQ rows; child component of PurchasingComponent; emits row-select event |

**Shared components:** DataTableComponent · ColumnCellDirective · LoadingBlockDirective

---

| field | value |
|-------|-------|
| component | `app-rfq-dialog` / RfqDialogComponent |
| type | dialog |
| route | `/purchasing` |
| file | `features/purchasing/components/rfq-dialog/rfq-dialog.component.ts:22` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Create a new RFQ; vendor selection, parts, due date, notes |

**Shared components:** DialogComponent · InputComponent · SelectComponent · TextareaComponent · DatepickerComponent · ValidationButtonComponent

---

| field | value |
|-------|-------|
| component | `app-rfq-detail-dialog` / RfqDetailDialogComponent |
| type | dialog |
| route | `/purchasing` |
| file | `features/purchasing/components/rfq-detail-dialog/rfq-detail-dialog.component.ts:34` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Full RFQ detail: vendor responses table, award action, status management; opens via RFQ row-click |

**Shared components:** DialogComponent · InputComponent · SelectComponent · TextareaComponent · DatepickerComponent · DataTableComponent · ValidationButtonComponent · ConfirmDialogComponent · EntityLinkComponent · CurrencyDisplayComponent

---

## Segment 4: Purchase Orders (+ PO-Receiving)

> **PO-Receiving cross-link:** The `ReceiveDialogComponent` (entry Q3-d in queue) is inventoried below as the PO-side receive flow.
> The inventory-tab Receiving at `/inventory/receiving` is catalogued in [`master-data.md`](master-data.md) — see that doc's `/inventory/receiving` entry.

### `/purchase-orders/:tab` — PurchaseOrdersComponent

| field | value |
|-------|-------|
| component | `app-purchase-orders` / PurchaseOrdersComponent |
| type | page |
| route | `/purchase-orders/orders` (default redirect from `/purchase-orders`) |
| file | `features/purchase-orders/purchase-orders.component.ts:30` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Tab-based PO hub: "orders" tab (PO list), "suggestions" tab (Auto-PO), "settings" tab (Admin only) |

**Valid tab values (source):** `'orders' | 'suggestions' | 'settings'`

**Shared components:** PageHeaderComponent · InputComponent · SelectComponent · DataTableComponent · LoadingBlockDirective

---

| field | value |
|-------|-------|
| component | `app-po-dialog` / PoDialogComponent |
| type | dialog |
| route | `/purchase-orders/orders` |
| file | `features/purchase-orders/components/po-dialog/po-dialog.component.ts:42` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Create a new PO; vendor + parts autocomplete; incoterm selection; tier-variance check triggers OffTierPromptDialog; draft-aware |

**Shared components:** DialogComponent · InputComponent · SelectComponent · TextareaComponent · AutocompleteComponent · CurrencyDisplayComponent · CurrencyInputComponent · ValidationButtonComponent

---

| field | value |
|-------|-------|
| component | `app-po-detail-dialog` / PoDetailDialogComponent |
| type | dialog |
| route | `/purchase-orders/orders` |
| file | `features/purchase-orders/components/po-detail-dialog/po-detail-dialog.component.ts:11` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Thin Mat dialog shell hosting PoDetailPanelComponent; returns `true` if changed |

---

| field | value |
|-------|-------|
| component | `app-po-detail-panel` / PoDetailPanelComponent |
| type | panel |
| route | `/purchase-orders/orders` (inside detail dialog) |
| file | `features/purchase-orders/components/po-detail-panel/po-detail-panel.component.ts:37` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Full PO detail: header fields (vendor, dates, incoterm), line items table, release history, receive action; inline editing of header fields |

**Shared components:** EntityActivitySectionComponent · EntityLinkComponent · CurrencyDisplayComponent · CurrencyInputComponent · BarcodeInfoComponent · DataTableComponent · ConfirmDialogComponent · ValidationButtonComponent · ReceiveDialogComponent (child)

---

| field | value |
|-------|-------|
| component | `app-receive-dialog` / ReceiveDialogComponent |
| type | dialog |
| route | `/purchase-orders/orders` (launched from PoDetailPanelComponent) |
| file | `features/purchase-orders/components/receive-dialog/receive-dialog.component.ts:19` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | **PO-Receiving:** Enter received quantities per line; freight-allocation method selection; drafts receive request; updates inventory on-hand on save |

**Shared components:** DialogComponent · EmptyStateComponent · CurrencyInputComponent · SelectComponent

> **Note:** This is the PO-side receiving entry point. Cross-reference: `/inventory/receiving` tab in master-data.md covers the inventory-side receiving view.

---

| field | value |
|-------|-------|
| component | `app-off-tier-prompt-dialog` / OffTierPromptDialogComponent |
| type | dialog |
| route | `/purchase-orders/orders` (triggered within PoDialogComponent save flow) |
| file | `features/purchase-orders/components/off-tier-prompt-dialog/off-tier-prompt-dialog.component.ts:30` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Warn buyer when one or more PO lines are priced off the vendor's tier; per-line choice: accept as one-off exception OR update vendor tier price |

**Shared components:** DialogComponent · CurrencyDisplayComponent

---

| field | value |
|-------|-------|
| component | `app-auto-po-panel` / AutoPoPanelComponent |
| type | panel |
| route | `/purchase-orders/suggestions` |
| file | `features/purchase-orders/components/auto-po-panel/auto-po-panel.component.ts:18` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Table of Auto-PO suggestions (parts at/below reorder threshold); approve or dismiss individual suggestions; triggers PO creation |

**Shared components:** DataTableComponent · SelectComponent · EntityLinkComponent · LoadingBlockDirective · ConfirmDialogComponent

---

| field | value |
|-------|-------|
~~`app-auto-po-suggestions` / AutoPoSuggestionsComponent~~ — **dead code**: file exists at `features/purchase-orders/components/auto-po-suggestions/auto-po-suggestions.component.ts:19` but is never imported by `AutoPoPanelComponent`, `PurchaseOrdersComponent`, or any other component. The suggestions tab is rendered entirely within `AutoPoPanelComponent`'s own DataTable. No inventory entry required.

---

| field | value |
|-------|-------|
| component | `app-auto-po-settings-panel` / AutoPoSettingsPanelComponent |
| type | panel |
| route | `/purchase-orders/settings` |
| file | `features/purchase-orders/components/auto-po-settings-panel/auto-po-settings-panel.component.ts:16` |
| renders-for | Admin only (source: PurchaseOrdersComponent line 55 `isAdmin = this.auth.hasRole('Admin')`) |
| states | unconfirmed |
| purpose | Configure Auto-PO global settings: reorder threshold mode, lead-time buffer, default vendor strategy, toggle on/off |

**Shared components:** InputComponent · SelectComponent · ToggleComponent · ValidationButtonComponent · LoadingBlockDirective

---

## Segment 5: Shipments

### `/shipments` — ShipmentsComponent

| field | value |
|-------|-------|
| component | `app-shipments` / ShipmentsComponent |
| type | page |
| route | `/shipments` |
| file | `features/shipments/shipments.component.ts:23` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | List all shipments; search + status filter; open create or detail dialog |

**Statuses in source:** Pending · Packed · Shipped · InTransit · Delivered · Cancelled

**Shared components:** PageHeaderComponent · InputComponent · SelectComponent · DataTableComponent · LoadingBlockDirective

---

| field | value |
|-------|-------|
| component | `app-shipment-dialog` / ShipmentDialogComponent |
| type | dialog |
| route | `/shipments` |
| file | `features/shipments/components/shipment-dialog/shipment-dialog.component.ts:30` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Create a new shipment; links to SO; parts autocomplete for lines; draft-aware |

**Shared components:** DialogComponent · InputComponent · TextareaComponent · AutocompleteComponent · ValidationButtonComponent

---

| field | value |
|-------|-------|
| component | `app-shipment-detail-dialog` / ShipmentDetailDialogComponent |
| type | dialog |
| route | `/shipments` |
| file | `features/shipments/components/shipment-detail-dialog/shipment-detail-dialog.component.ts:17` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Thin Mat dialog shell hosting ShipmentDetailPanelComponent; returns `{ action: 'edit', shipment }` |

---

| field | value |
|-------|-------|
| component | `app-shipment-detail-panel` / ShipmentDetailPanelComponent |
| type | panel |
| route | `/shipments` (inside detail dialog) |
| file | `features/shipments/components/shipment-detail-panel/shipment-detail-panel.component.ts:20` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Full shipment detail: header info, line items, package list, tracking, label generation, shipping-rates action |

**Sub-components:**

| field | value |
|-------|-------|
| component | `app-tracking-timeline` / TrackingTimelineComponent |
| type | cluster |
| route | `/shipments` (within shipment detail panel) |
| file | `features/shipments/components/tracking-timeline/tracking-timeline.component.ts:7` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Visual timeline of carrier tracking events for a shipment |

---

| field | value |
|-------|-------|
| component | `app-shipping-rates-dialog` / ShippingRatesDialogComponent |
| type | dialog |
| route | `/shipments` (launched from shipment detail panel) |
| file | `features/shipments/components/shipping-rates-dialog/shipping-rates-dialog.component.ts:13` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Rate-shop: fetches live carrier rates for shipment dimensions/weight; user selects rate to book label |

**Shared components:** DialogComponent · LoadingBlockDirective

---

## Segment 6: Invoices

### `/invoices` — InvoicesComponent

| field | value |
|-------|-------|
| component | `app-invoices` / InvoicesComponent |
| type | page |
| route | `/invoices` |
| file | `features/invoices/invoices.component.ts:29` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | List all invoices; search + status filter; server-side total; accounting provider name/mode display; uninvoiced-jobs panel action |

**Accounting boundary:** `isStandalone` + `providerName` flags from AccountingService control display behavior.

**Shared components:** PageHeaderComponent · InputComponent · SelectComponent · DataTableComponent · CurrencyDisplayComponent · LoadingBlockDirective

---

| field | value |
|-------|-------|
| component | `app-uninvoiced-jobs-panel` / UninvoicedJobsPanelComponent |
| type | panel |
| route | `/invoices` (slide-out panel) |
| file | `features/invoices/components/uninvoiced-jobs-panel/uninvoiced-jobs-panel.component.ts:8` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Lists production jobs that have shipped but not yet been invoiced; each row has a "Create Invoice" action |

**Shared components:** DialogComponent

---

| field | value |
|-------|-------|
| component | `app-invoice-dialog` / InvoiceDialogComponent |
| type | dialog |
| route | `/invoices` |
| file | `features/invoices/components/invoice-dialog/invoice-dialog.component.ts:36` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Create a new invoice; customer autocomplete; line items with part + qty + price; due date + credit terms; accounting boundary comment in source |

**Shared components:** DialogComponent · InputComponent · SelectComponent · DatepickerComponent · TextareaComponent · CurrencyDisplayComponent · ValidationButtonComponent

---

| field | value |
|-------|-------|
| component | `app-invoice-detail-dialog` / InvoiceDetailDialogComponent |
| type | dialog |
| route | `/invoices` |
| file | `features/invoices/components/invoice-detail-dialog/invoice-detail-dialog.component.ts:17` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Thin Mat dialog shell hosting InvoiceDetailPanelComponent; returns `{ action: 'edit', invoice }` |

---

| field | value |
|-------|-------|
| component | `app-invoice-detail-panel` / InvoiceDetailPanelComponent |
| type | panel |
| route | `/invoices` (inside detail dialog) |
| file | `features/invoices/components/invoice-detail-panel/invoice-detail-panel.component.ts:17` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Full invoice detail: header, line items, payment applications, status actions (Send, Void, Mark Paid); entity links to SO/customer |

**Shared components:** EntityActivitySectionComponent · EntityLinkComponent · CurrencyDisplayComponent · ConfirmDialogComponent · LoadingBlockDirective

---

## Segment 7: Payments

### `/payments` — PaymentsComponent

| field | value |
|-------|-------|
| component | `app-payments` / PaymentsComponent |
| type | page |
| route | `/payments` |
| file | `features/payments/payments.component.ts:23` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | List all payments; method filter; server-side total; accounting boundary context (isStandalone / providerName) |

**Payment methods (source-confirmed, `payments.component.ts:56-63`):** Cash · Check · CreditCard · BankTransfer · Wire · Other

**Shared components:** PageHeaderComponent · InputComponent · SelectComponent · DataTableComponent · CurrencyDisplayComponent · LoadingBlockDirective

---

| field | value |
|-------|-------|
| component | `app-payment-dialog` / PaymentDialogComponent |
| type | dialog |
| route | `/payments` |
| file | `features/payments/components/payment-dialog/payment-dialog.component.ts:30` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Record a new customer payment; customer autocomplete; invoice application entries; payment method + date + reference; accounting boundary |

**Shared components:** DialogComponent · InputComponent · SelectComponent · TextareaComponent · DatepickerComponent · CurrencyDisplayComponent · ValidationButtonComponent

---

| field | value |
|-------|-------|
| component | `app-payment-detail-dialog` / PaymentDetailDialogComponent |
| type | dialog |
| route | `/payments` |
| file | `features/payments/components/payment-detail-dialog/payment-detail-dialog.component.ts:11` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Thin Mat dialog shell hosting PaymentDetailPanelComponent; returns `true` if payment changed |

---

| field | value |
|-------|-------|
| component | `app-payment-detail-panel` / PaymentDetailPanelComponent |
| type | panel |
| route | `/payments` (inside detail dialog) |
| file | `features/payments/components/payment-detail-panel/payment-detail-panel.component.ts:17` |
| renders-for | Admin, Manager, OfficeManager |
| states | unconfirmed |
| purpose | Full payment detail: payment header, invoice applications list, void/refund actions, activity log |

**Shared components:** EntityActivitySectionComponent · EntityLinkComponent · CurrencyDisplayComponent · ConfirmDialogComponent · LoadingBlockDirective

---

## Segment 8: Customer Returns

### `/customer-returns` — CustomerReturnsComponent

| field | value |
|-------|-------|
| component | `app-customer-returns` / CustomerReturnsComponent |
| type | page |
| route | `/customer-returns` |
| file | `features/customer-returns/customer-returns.component.ts:19` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | unconfirmed |
| purpose | List all customer returns (RMAs); search + status filter; open create or detail dialog |

**Shared components:** PageHeaderComponent · InputComponent · SelectComponent · DataTableComponent · LoadingBlockDirective

---

| field | value |
|-------|-------|
| component | `app-customer-return-dialog` / CustomerReturnDialogComponent |
| type | dialog |
| route | `/customer-returns` |
| file | `features/customer-returns/components/customer-return-dialog/customer-return-dialog.component.ts:19` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | unconfirmed |
| purpose | Create a new customer return; links to SO/shipment via EntityPicker; reason + notes; date; draft-aware |

**Shared components:** DialogComponent · InputComponent · TextareaComponent · DatepickerComponent · EntityPickerComponent · ValidationButtonComponent

---

| field | value |
|-------|-------|
| component | `app-customer-return-detail-dialog` / CustomerReturnDetailDialogComponent |
| type | dialog |
| route | `/customer-returns` |
| file | `features/customer-returns/components/customer-return-detail-dialog/customer-return-detail-dialog.component.ts:11` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | unconfirmed |
| purpose | Thin Mat dialog shell hosting CustomerReturnDetailPanelComponent; returns `true` if updated |

---

| field | value |
|-------|-------|
| component | `app-customer-return-detail-panel` / CustomerReturnDetailPanelComponent |
| type | panel |
| route | `/customer-returns` (inside detail dialog) |
| file | `features/customer-returns/components/customer-return-detail-panel/customer-return-detail-panel.component.ts:18` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | unconfirmed |
| purpose | Full return detail: header info, status transitions, inline notes edit, activity log |

**Shared components:** EntityActivitySectionComponent · DialogComponent · TextareaComponent · ConfirmDialogComponent · LoadingBlockDirective

---

## Open Items / Caveats

### Source-resolved (Cycles 2–3)

- ~~**Approximate line numbers**~~ — PoDialogComponent `:42`, OffTierPromptDialogComponent `:30`, ScheduleTimelineComponent `:16` all confirmed exact.
- ~~**SoDialogComponent role gate**~~ — template has no `*appHasRole`/`*appHasCapability` on the create button; gate is the route guard only: Admin, Manager, PM, OfficeManager. Confirmed.
- ~~**RecurringOrders role gate**~~ — no additional guard in `sales-orders.routes.ts`; template no button-level gating. Confirmed: Admin, Manager, PM, OfficeManager.
- ~~**Payment method full list**~~ — source-confirmed in `payments.component.ts:56-63`: Cash · Check · CreditCard · BankTransfer · Wire · Other.
- ~~**AutoPoSuggestionsComponent nesting**~~ — confirmed dead code; not imported anywhere; no entry needed.
- ~~**features/ tree reconciliation**~~ — Cycle 3 walk found 0 new component files; all 43 live + 1 dead-code files accounted for.
- ~~**shared/ tree coverage**~~ — 21 shared components + 3 directives confirmed in use; all usages documented in feature entries; DataTable sub-components (column-filter-popover, column-manager-panel) are internal infrastructure, covered by DataTableComponent reference.

### Scout-gated (need live observation)

1. **All `states` fields** — marked `unconfirmed`; scout must observe empty/loading/populated/error for each component.
2. **Queue items Q1–Q8** — all detail dialogs/panels, create dialogs, PO-specific panels, estimate flow, and SO detail tabs require seeded records and live navigation.

---

*End of Cycle 1 — source prelocation complete. Awaiting scout live-state observations to tick checklist and resolve queue.*
