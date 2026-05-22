# Quote-to-Cash Region — Component Inventory

> **Phase:** quote-to-cash · **Method:** observe-and-record (no code changes)
> **Single writer:** source-cataloger owns this file; scout owns quote-to-cash-queue.md only
> **Source on disk:** HEAD e9b7802 (file:line mappings from source)
> **Last updated:** Cycle 6 — dequeue Q1-b/e/f/g/i, Q3-a/b, Q5-b, terminal Q1-d/h; DN-6/7/8 added; 14 checklist items ticked

---

## Architectural Data Notes (from live sweep)

**DN-1 — SO list uses job-projected endpoint:** `GET /api/v1/sales-orders` (Phase 3 F1/WU-18 read path) only surfaces SOs confirmed and transitioned to production-stage jobs. Draft SOs at `/api/v1/orders` are invisible to the list. SO-00001 (Draft) correctly returns 0 rows in UI.

**DN-2 — Detail dialogs are panel wrappers:** `PoDetailDialogComponent`, `ShipmentDetailDialogComponent`, `InvoiceDetailDialogComponent`, `PaymentDetailDialogComponent`, `CustomerReturnDetailDialogComponent` are thin `mat-dialog` wrappers around their panel counterparts. Panel is canonical; dialog just provides overlay context.

**DN-3 — EstimateFormDialogComponent not wired:** Component exists but grep of all `.ts` files finds zero callers. Not reachable from current navigation. Dead code or pending wiring.

**DN-4 — PM live access contradicts source route guards (investigate):** Live sweep observed PM reaching `/purchasing`, `/shipments`, `/invoices`, `/payments` with page-header rendered. Source `app.routes.ts:157,163,181,187,193` gates all five routes as `roleGuard('Admin','Manager','OfficeManager')` — PM is not listed. `roleGuard` calls `auth.hasAnyRole()` which is a pure `user.roles.includes()` check with no capability bypass (`auth.service.ts:96-99`). **Most likely cause: `pm@forge.local` was seeded with multiple server-side roles (PM + OfficeManager or similar).** `renders-for` fields in catalog entries use source-authoritative role lists; the role matrix records live observation. The discrepancy should be resolved by inspecting the JWT for `pm@forge.local`.

**DN-5 — `/sales-orders/recurring` does not render app-page-header:** All four accessible roles (Admin, OfficeManager, Manager, PM) reach the route but `app-page-header` is absent (uses `PageLayoutComponent` + `ToolbarComponent` instead).

**DN-6 — SO detail panel field selectors not found by Playwright:** Tab content DOM uses plain `<td>` or custom layout elements rather than `.field-label`/`dt`/`.prop-label` selectors; screenshots captured at `q2c-cycle5/so-detail-tab*.png`. Full field inventory requires source read of `sales-order-detail-panel.component.html`.

**DN-7 — PM on `/purchase-orders/orders` renders job board:** PM navigates to `/purchase-orders/orders` but sees JOB BOARD content (production board with "Create your first job", focus mode, board view controls) rather than the PO list. Route guard allows access (PM passes live — see DN-4), but component or route behavior serves job-board context to PM. Source read needed to confirm mechanism.

**DN-8 — Three capabilities disabled server-side:** `CAP-O2C-RMA` (customer returns), `CAP-P2P-RFQ` (purchasing/RFQs), and `CAP-O2C-RECURRING` (recurring orders) are all disabled in this installation. The UI renders pages and dialogs normally (no "capability disabled" message shown in UI), but all API mutations return `{"code":"capability-disabled","capability":"<CAP>"}`. `RecurringOrderDialogComponent` create dialog IS accessible and was observed — only API seeding and list population are blocked.

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

- [x] `/quotes` — QuotesComponent (list)
- [x] `/sales-orders` — SalesOrdersComponent (list)
- [x] `/sales-orders/recurring` — RecurringOrdersComponent (recurring templates list)
- [x] `/purchase-orders` → redirects to `/purchase-orders/orders` (no page component; redirect confirmed in `purchase-orders.routes.ts`)
- [x] `/purchase-orders/orders` — PurchaseOrdersComponent (orders tab)
- [x] `/purchase-orders/suggestions` — PurchaseOrdersComponent (suggestions tab / AutoPoPanelComponent)
- [x] `/purchase-orders/settings` — PurchaseOrdersComponent (settings tab / AutoPoSettingsPanelComponent; Admin only)
- [x] `/purchasing` — PurchasingComponent (RFQ list)
- [x] `/shipments` — ShipmentsComponent (list)
- [x] `/invoices` — InvoicesComponent (list)
- [x] `/payments` — PaymentsComponent (list)
- [x] `/customer-returns` — CustomerReturnsComponent (list)

### Feature directories (all .ts component files accounted for)

#### quotes/
- [x] `quotes.component.ts` (QuotesComponent)
- [x] `components/quote-dialog/quote-dialog.component.ts`
- [x] `components/quote-detail-dialog/quote-detail-dialog.component.ts`
- [x] `components/quote-detail-panel/quote-detail-panel.component.ts`
- [x] `components/estimate-form-dialog/estimate-form-dialog.component.ts`

#### sales-orders/
- [x] `sales-orders.component.ts` (SalesOrdersComponent)
- [x] `components/so-dialog/so-dialog.component.ts`
- [x] `components/sales-order-detail-dialog/sales-order-detail-dialog.component.ts`
- [x] `components/sales-order-detail-panel/sales-order-detail-panel.component.ts`
- [x] `components/schedule-timeline/schedule-timeline.component.ts`
- [x] `components/recurring-order-dialog/recurring-order-dialog.component.ts`
- [x] `pages/recurring/recurring-orders.component.ts`

#### purchase-orders/
- [x] `purchase-orders.component.ts` (PurchaseOrdersComponent)
- [x] `components/po-dialog/po-dialog.component.ts`
- [x] `components/po-detail-dialog/po-detail-dialog.component.ts`
- [x] `components/po-detail-panel/po-detail-panel.component.ts`
- [x] `components/receive-dialog/receive-dialog.component.ts` ← **PO-receiving entry point**
- [x] `components/auto-po-panel/auto-po-panel.component.ts`
- [x] `components/auto-po-settings-panel/auto-po-settings-panel.component.ts`
- [x] `components/auto-po-suggestions/auto-po-suggestions.component.ts` ← **dead code**: declared but never imported by any component; no entry needed
- [ ] `components/off-tier-prompt-dialog/off-tier-prompt-dialog.component.ts`

#### purchasing/
- [x] `purchasing.component.ts` (PurchasingComponent)
- [x] `components/rfq-dialog/rfq-dialog.component.ts`
- [x] `components/rfq-detail-dialog/rfq-detail-dialog.component.ts` ← **terminal: CAP-P2P-RFQ disabled (DN-8)**
- [x] `components/rfq-list/rfq-list.component.ts`

#### shipments/
- [x] `shipments.component.ts` (ShipmentsComponent)
- [x] `components/shipment-dialog/shipment-dialog.component.ts`
- [x] `components/shipment-detail-dialog/shipment-detail-dialog.component.ts`
- [x] `components/shipment-detail-panel/shipment-detail-panel.component.ts`
- [ ] `components/tracking-timeline/tracking-timeline.component.ts`
- [x] `components/shipping-rates-dialog/shipping-rates-dialog.component.ts`

#### invoices/
- [x] `invoices.component.ts` (InvoicesComponent)
- [x] `components/invoice-dialog/invoice-dialog.component.ts`
- [x] `components/invoice-detail-dialog/invoice-detail-dialog.component.ts`
- [x] `components/invoice-detail-panel/invoice-detail-panel.component.ts`
- [x] `components/uninvoiced-jobs-panel/uninvoiced-jobs-panel.component.ts`

#### payments/
- [x] `payments.component.ts` (PaymentsComponent)
- [x] `components/payment-dialog/payment-dialog.component.ts`
- [x] `components/payment-detail-dialog/payment-detail-dialog.component.ts`
- [x] `components/payment-detail-panel/payment-detail-panel.component.ts`

#### customer-returns/
- [x] `customer-returns.component.ts` (CustomerReturnsComponent)
- [x] `components/customer-return-dialog/customer-return-dialog.component.ts`
- [x] `components/customer-return-detail-dialog/customer-return-detail-dialog.component.ts` ← **terminal: CAP-O2C-RMA disabled (DN-8)**
- [x] `components/customer-return-detail-panel/customer-return-detail-panel.component.ts` ← **terminal: CAP-O2C-RMA disabled (DN-8)**

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
| states | empty (initial); populated (QT-00001 observed live) |
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
| states | empty form (observed live — title "NEW QUOTE", 2-col layout) |
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
| states | populated (observed as mat-dialog overlay hosting QuoteDetailPanelComponent) |
| purpose | Thin Mat dialog shell that hosts QuoteDetailPanelComponent; opened via row-click or `?detail=quote:{id}` URL param |

---

| field | value |
|-------|-------|
| component | `app-quote-detail-panel` / QuoteDetailPanelComponent |
| type | panel |
| route | `/quotes` (inside detail dialog) |
| file | `features/quotes/components/quote-detail-panel/quote-detail-panel.component.ts:17` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | populated (QT-00001 observed live — single scrollable panel, no tabs) |
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
| states | unreached (no trigger found in live navigation — see DN-3) |
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
| states | empty (observed live — SO-00001 Draft invisible; see DN-1) |
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
| states | empty form (observed live — title "NEW SALES ORDER", 2-col layout) |
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
| states | populated (J-1 SO-00001 at Order Confirmed; dialog observed Cycle 5) |
| purpose | Thin Mat dialog shell that hosts SalesOrderDetailPanelComponent; returns `{ action: 'edit', salesOrder }` on edit |

---

| field | value |
|-------|-------|
| component | `app-sales-order-detail-panel` / SalesOrderDetailPanelComponent |
| type | panel |
| route | `/sales-orders` (inside detail dialog) |
| file | `features/sales-orders/components/sales-order-detail-panel/sales-order-detail-panel.component.ts:27` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | populated (SO-00001 J-1 Order Confirmed — 8 tabs; status badges: Confirmed + Partially Shipped; action buttons: Copy \| Print \| Regenerate; DN-6: field detail extraction incomplete) |
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
| states | populated (renders in Schedule tab of SO-00001 detail panel; Cycle 5 sweep confirmed) |
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
| states | empty (observed live — 0 rows, NEW RECURRING TEMPLATE button visible) |
| purpose | Manage recurring SO templates that the nightly job spins into fresh SalesOrders; Create + Delete only (no Edit by design — delete + recreate pattern) |

**Shared components:** PageLayoutComponent · ToolbarComponent · DataTableComponent · ConfirmDialogComponent

---

| field | value |
|-------|-------|
| component | `app-recurring-order-dialog` / RecurringOrderDialogComponent |
| type | dialog |
| route | `/sales-orders/recurring` |
| file | `features/sales-orders/components/recurring-order-dialog/recurring-order-dialog.component.ts:16` |
| renders-for | Admin, Manager, PM, OfficeManager (inherits route guard; no button-level role gate in template — confirmed cycle 2) |
| states | populated (dialog observed: Template name \| Customer \| Next generation date \| Interval in days \| Notes \| line items (Part/Desc/Qty/Unit price); Cancel \| Save; populated list state blocked by CAP-O2C-RECURRING — see DN-8) |
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
| states | empty (observed live — 0 RFQs, empty-state icon visible) |
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
| states | empty (observed live — 0 rows) |
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
| states | empty form (observed live — title "CREATE RFQ", single-col form) |
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
| states | **terminal** — CAP-P2P-RFQ disabled server-side; `/api/v1/purchasing/rfqs` returns `{"code":"capability-disabled","capability":"CAP-P2P-RFQ"}`; UI page renders normally (empty-state + New RFQ button) but seeding blocked; detail dialog unreachable (see DN-8) |
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
| states | populated (observed live — 4 PO rows; tabs: ORDERS/SUGGESTIONS/SETTINGS) |
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
| states | empty form (observed live — title "NEW PURCHASE ORDER", 2-col with Shipping & Currency) |
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
| states | populated (observed as mat-dialog hosting PoDetailPanelComponent — PO-00001) |
| purpose | Thin Mat dialog shell hosting PoDetailPanelComponent; returns `true` if changed |

---

| field | value |
|-------|-------|
| component | `app-po-detail-panel` / PoDetailPanelComponent |
| type | panel |
| route | `/purchase-orders/orders` (inside detail dialog) |
| file | `features/purchase-orders/components/po-detail-panel/po-detail-panel.component.ts:37` |
| renders-for | Admin, Manager, OfficeManager |
| states | populated (PO-00001 Acknowledged observed live — flat scrollable panel, no tabs) |
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
| states | populated (PO-00001 lines visible — Receive All + per-line qty + freight/allocation) |
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
| states | unreached (requires off-tier pricing trigger in PO create flow) |
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
| states | empty (observed live — "Run Analysis" button visible + "No auto-PO suggestions" empty-state text; 0 suggestions; no parts at reorder threshold) |
| purpose | Table of Auto-PO suggestions (parts at/below reorder threshold); approve or dismiss individual suggestions; triggers PO creation |

**Shared components:** DataTableComponent · SelectComponent · EntityLinkComponent · LoadingBlockDirective · ConfirmDialogComponent

---

~~`app-auto-po-suggestions` / AutoPoSuggestionsComponent~~ — **dead code**: file exists at `features/purchase-orders/components/auto-po-suggestions/auto-po-suggestions.component.ts:19` but is never imported by `AutoPoPanelComponent`, `PurchaseOrdersComponent`, or any other component. The suggestions tab is rendered entirely within `AutoPoPanelComponent`'s own DataTable. No inventory entry required.

---

| field | value |
|-------|-------|
| component | `app-auto-po-settings-panel` / AutoPoSettingsPanelComponent |
| type | panel |
| route | `/purchase-orders/settings` |
| file | `features/purchase-orders/components/auto-po-settings-panel/auto-po-settings-panel.component.ts:16` |
| renders-for | Admin, Manager, OfficeManager (route guard); content gated by `isAdmin` (`PurchaseOrdersComponent:55`) — Admin sees 4 fields, Manager/OfficeManager see 2 |
| states | populated (Admin: Enable Auto-PO toggle \| Default Mode select \| Buffer Days input \| Send Chat Notifications toggle \| Save; Manager: Default Mode + Buffer Days only; Enable Auto-PO + Send Chat Notifications hidden from non-Admin; gate is in .ts logic — template has no `@if` conditionals) |
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
| states | empty (observed live — 0 shipments) |
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
| states | empty form (observed live — title "NEW SHIPMENT", Sales Order/Carrier/Tracking fields) |
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
| states | populated (SH-00001 Pending FedEx TRACK-TEST-001; dialog observed Cycle 5 as mat-dialog overlay hosting ShipmentDetailPanelComponent) |
| purpose | Thin Mat dialog shell hosting ShipmentDetailPanelComponent; returns `{ action: 'edit', shipment }` |

---

| field | value |
|-------|-------|
| component | `app-shipment-detail-panel` / ShipmentDetailPanelComponent |
| type | panel |
| route | `/shipments` (inside detail dialog) |
| file | `features/shipments/components/shipment-detail-panel/shipment-detail-panel.component.ts:20` |
| renders-for | Admin, Manager, OfficeManager |
| states | populated (SH-00001 Pending FedEx TRACK-TEST-001 — flat panel, no tabs; fields: Description \| Quantity; action buttons: Get Rates \| Mark Shipped \| Track; TrackingTimeline NOT rendered at Pending status — see Q5-a) |
| purpose | Full shipment detail: header info, line items, package list, tracking, label generation, shipping-rates action |

**Sub-components:**

| field | value |
|-------|-------|
| component | `app-tracking-timeline` / TrackingTimelineComponent |
| type | cluster |
| route | `/shipments` (within shipment detail panel) |
| file | `features/shipments/components/tracking-timeline/tracking-timeline.component.ts:7` |
| renders-for | Admin, Manager, OfficeManager |
| states | unreached (within shipment detail panel) |
| purpose | Visual timeline of carrier tracking events for a shipment |

---

| field | value |
|-------|-------|
| component | `app-shipping-rates-dialog` / ShippingRatesDialogComponent |
| type | dialog |
| route | `/shipments` (launched from shipment detail panel) |
| file | `features/shipments/components/shipping-rates-dialog/shipping-rates-dialog.component.ts:13` |
| renders-for | Admin, Manager, OfficeManager |
| states | populated (observed from SH-00001 Pending; trigger: "Get Rates" icon button in shipment detail action bar; dialog: Cancel \| Create Label) |
| purpose | Shipping label creation dialog: initiates label generation for a shipment; Cancel \| Create Label actions |

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
| states | empty (observed live — "No invoices found" with ledger icon) |
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
| states | empty (observed live — "UNINVOICED JOBS (0)" checkmark + "All completed jobs have been invoiced.") |
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
| states | empty form (observed live — title "NEW INVOICE", SO ID + Due Date + Shipment ID fields) |
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
| states | populated (INV-00001 Draft $135.625; dialog observed Cycle 5 as mat-dialog overlay hosting InvoiceDetailPanelComponent) |
| purpose | Thin Mat dialog shell hosting InvoiceDetailPanelComponent; returns `{ action: 'edit', invoice }` |

---

| field | value |
|-------|-------|
| component | `app-invoice-detail-panel` / InvoiceDetailPanelComponent |
| type | panel |
| route | `/invoices` (inside detail dialog) |
| file | `features/invoices/components/invoice-detail-panel/invoice-detail-panel.component.ts:17` |
| renders-for | Admin, Manager, OfficeManager |
| states | populated (INV-00001 Draft $135.625 — flat panel, no tabs; line items: Part# \| Description \| Qty \| Unit Price \| Total; action buttons: Delete \| Void \| Send; activity filters: All \| Conversation \| Notes \| History) |
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
| states | empty (observed live — 0 payments, Method filter visible) |
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
| states | empty form (observed live — Invoice Applications + Payment Method/Amount/Date/Ref) |
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
| states | populated (PMT-00001 Check $135.625; dialog observed Cycle 5 as mat-dialog overlay hosting PaymentDetailPanelComponent) |
| purpose | Thin Mat dialog shell hosting PaymentDetailPanelComponent; returns `true` if payment changed |

---

| field | value |
|-------|-------|
| component | `app-payment-detail-panel` / PaymentDetailPanelComponent |
| type | panel |
| route | `/payments` (inside detail dialog) |
| file | `features/payments/components/payment-detail-panel/payment-detail-panel.component.ts:17` |
| renders-for | Admin, Manager, OfficeManager |
| states | populated (PMT-00001 Check $135.625 — flat panel, no tabs; applications table: Invoice # \| Amount; no action buttons — read-only panel; close button only) |
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
| states | empty (observed live — "No customer returns found" with return icon) |
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
| states | empty form (observed live — Customer/OriginalJob/Reason/ReturnDate/Notes) |
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
| states | **terminal** — CAP-O2C-RMA disabled server-side; `POST /api/v1/customer-returns` returns `{"code":"capability-disabled","capability":"CAP-O2C-RMA"}`; UI page renders normally but seeding blocked; detail dialog unreachable (see DN-8) |
| purpose | Thin Mat dialog shell hosting CustomerReturnDetailPanelComponent; returns `true` if updated |

---

| field | value |
|-------|-------|
| component | `app-customer-return-detail-panel` / CustomerReturnDetailPanelComponent |
| type | panel |
| route | `/customer-returns` (inside detail dialog) |
| file | `features/customer-returns/components/customer-return-detail-panel/customer-return-detail-panel.component.ts:18` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | **terminal** — CAP-O2C-RMA disabled server-side; unreachable — blocked by same capability gate as dialog (see DN-8) |
| purpose | Full return detail: header info, status transitions, inline notes edit, activity log |

**Shared components:** EntityActivitySectionComponent · DialogComponent · TextareaComponent · ConfirmDialogComponent · LoadingBlockDirective

---

---

## Role Access Matrix (Live — Cycle 4)

> Method: Playwright navigated each role to each route and checked for URL redirect + page-header presence.
> ACCESSIBLE = page rendered with app-page-header · BLOCKED = redirected to /dashboard · NO-HEADER = page loads but no app-page-header (different layout)

| Route | Admin | OfficeManager | Manager | PM | Engineer | ProductionWorker |
|-------|-------|---------------|---------|-----|----------|-----------------|
| `/quotes` | ✓ | ✓ | ✓ | ✓ | ✗ →/dashboard | ✗ →/dashboard |
| `/sales-orders` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `/sales-orders/recurring` | ✓ | ✓ (no-hdr) | ✓ (no-hdr) | ✓ (no-hdr) | ✗ | ✗ |
| `/purchase-orders/orders` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `/purchase-orders/suggestions` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `/purchase-orders/settings` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `/purchasing` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `/shipments` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `/invoices` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `/payments` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `/customer-returns` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |

**Notes:**
- PM column shows ✓ for routes where source `roleGuard` does NOT include PM (`/purchasing`, `/purchase-orders/*`, `/shipments`, `/invoices`, `/payments`). This is live-observed behaviour, likely caused by `pm@forge.local` having multiple server roles. See DN-4. Catalog `renders-for` fields use source-authoritative lists (PM excluded from those routes).
- `/purchase-orders/settings`: route guard allows Admin/Manager/OfficeManager (not PM per source). Within-page content guarded by `isAdmin` — Admin sees 4 fields, Manager/OfficeManager see 2 (Enable Auto-PO + Send Chat Notifications hidden; confirmed Cycle 5 Q7-e).
- Capability-level differences (OM/Mgr/PM create buttons): OfficeManager has full create access; PM has New Quote + New Order only; confirmed Cycle 5 Q7-f.

---

## Live-Observed Layout Details (Cycle 4)

### Quote Detail Panel (QT-00001)
Single scrollable panel (no tabs). Sections top-to-bottom:
1. Header: `request_quote` icon · QT-00001 · Acme Corp (entity link) · ×
2. STATUS (DRAFT badge) · CUSTOMER (entity link)
3. NOTES
4. LINE ITEMS (2): PART # · DESCRIPTION · QTY · UNIT PRICE · QUOTES.MARGIN (% editable) · TOTAL
5. SUBTOTAL · TAX (8.5%) · TOTAL
6. CREATED · UPDATED
7. DELETE (danger) · SEND (primary)
8. ACTIVITY: ALL · CONVERSATION · NOTES · HISTORY · "No activity yet."

### PO Detail Panel (PO-00001, Acknowledged)
Single scrollable panel (no tabs). Sections:
1. Header: icon · PO-00001 · Steel Supply Co · × · gear settings icon
2. STATUS (ACKNOWLEDGED badge) · SUBMITTED · EXPECTED DELIVERY · ACKNOWLEDGED
3. SHIPPING & CURRENCY: INCOTERM · QUOTE CURRENCY · FX RATE · FX RATE SOURCE
4. BARCODE: PO-PO-XXXXX (copy) · PRINT · REGENERATE
5. NOTES
6. LINE ITEMS (1): PART # · DESCRIPTION · ORDERED · RECEIVED · UNIT PRICE · TOTAL
7. CREATED · UPDATED
8. CANCEL · SHORT CLOSE · RECEIVE ITEMS (primary)
9. ACTIVITY: ALL · CONVERSATION · NOTES · HISTORY · "No activity yet."

### Receive Dialog (PO-00001)
- Title: "RECEIVE ITEMS — PO-00001"
- ✓ RECEIVE ALL (full-width top button)
- Table: PART # · DESCRIPTION · ORDERED · RECEIVED · REMAINING · RECEIVE QTY (input)
- SHIPPING & CURRENCY: $ Actual Freight · Allocation dropdown ("By Extended Value (default)")
- CANCEL · RECEIVE ITEMS (submit)

### Uninvoiced Jobs Panel (empty)
- Title: "UNINVOICED JOBS (0)" · ×
- Body: green ✓ icon · "All completed jobs have been invoiced."
- CLOSE

### Create Dialog Layouts (all forms)
| Dialog | Left section | Right section key fields | Submit label |
|--------|-------------|--------------------------|-------------|
| NEW QUOTE | LINE ITEMS (Part/Qty/Price) | Customer* · ExpDate · TaxRate% · Notes · Summary | CREATE QUOTE |
| NEW SALES ORDER | LINE ITEMS (Part/Qty/Price) | Customer* · Customer PO · Credit Terms · ReqDelivery · TaxRate% · Notes · Summary | CREATE ORDER |
| NEW PURCHASE ORDER | LINE ITEMS (Part/Qty/Price + Show obsolete) | Vendor* · Job ID · Incoterm · Estimated Freight · Quote Currency · Notes · Subtotal | CREATE PO |
| CREATE RFQ | (single column) | Part* · Quantity* · Required Date · Response Deadline · Description · Special Instructions | CREATE RFQ |
| NEW SHIPMENT | SHIPMENT LINES (Part/Qty) | Sales Order · Carrier · Tracking # · Weight · Shipping Cost · Notes | CREATE SHIPMENT |
| NEW INVOICE | LINE ITEMS (PartID/Part#/Desc/Qty/Price) | Customer* · SO ID · Invoice Date · Due Date · Credit Terms · TaxRate% · Shipment ID · Notes · Summary | CREATE INVOICE |
| NEW PAYMENT | INVOICE APPLICATIONS (Invoice.../Invoice#/Amount) | Customer · Payment Method · Amount* · Payment Date · Reference # · Notes · Total Applied | CREATE PAYMENT |
| NEW RETURN | (single column) | Customer · Original Job · Reason* · Return Date · Notes | SAVE |

All create dialogs show validation badge `▲{n}` between Cancel and Submit. Submit is disabled until validation passes.

---

## Open Items / Caveats

### Source-resolved (Cycles 1–5)

- ~~**Approximate line numbers**~~ — PoDialogComponent `:42`, OffTierPromptDialogComponent `:30`, ScheduleTimelineComponent `:16` all confirmed exact.
- ~~**SoDialogComponent role gate**~~ — template has no `*appHasRole`/`*appHasCapability` on the create button; gate is the route guard only.
- ~~**RecurringOrders role gate**~~ — no additional guard in `sales-orders.routes.ts`; template no button-level gating.
- ~~**RecurringOrderDialogComponent renders-for**~~ — corrected to Admin/Manager/PM/OfficeManager (inherits route guard; no button gate).
- ~~**Payment method full list**~~ — source-confirmed: Cash · Check · CreditCard · BankTransfer · Wire · Other.
- ~~**AutoPoSuggestionsComponent nesting**~~ — confirmed dead code; not imported anywhere.
- ~~**features/ tree reconciliation**~~ — all 43 live + 1 dead-code files accounted for.
- ~~**shared/ tree coverage**~~ — 21 shared components + 3 directives documented.
- ~~**All `states` fields**~~ — Cycle 4 live sweep: all states updated from `unconfirmed` to observed or `unreached`.
- ~~**Scout metadata error**~~ — Cycle 5: corrected "Single writer" to source-cataloger; DN-4 expanded with roleGuard source analysis.
- ~~**Q1-b SO detail (dialog/panel/schedule)**~~ — Cycle 6: SO-00001 J-1 populated; 8 tabs confirmed live; ScheduleTimeline confirmed in schedule tab.
- ~~**Q1-e Invoice detail (dialog/panel)**~~ — Cycle 6: INV-00001 Draft $135.625 observed; flat panel, no tabs.
- ~~**Q1-f Shipment detail (dialog/panel)**~~ — Cycle 6: SH-00001 Pending observed; flat panel, no tabs; TrackingTimeline still unreached (Q5-a).
- ~~**Q1-g Payment detail (dialog/panel)**~~ — Cycle 6: PMT-00001 Check $135.625 observed; flat panel, read-only.
- ~~**Q1-i RecurringOrderDialog**~~ — Cycle 6: dialog observed (all fields + Cancel/Save); populated list blocked CAP-O2C-RECURRING.
- ~~**Q3-a AutoPoPanel**~~ — Cycle 6: "Run Analysis" button + empty-state confirmed live.
- ~~**Q3-b AutoPoSettings isAdmin gate**~~ — Cycle 6: Admin=4 fields, Manager=2 confirmed live; template has no @if conditionals; gate in .ts.
- ~~**Q5-b ShippingRatesDialog**~~ — Cycle 6: observed from SH-00001; label creator (Cancel/Create Label), not rate-shopper.
- ~~**Q1-d RfqDetail**~~ — Cycle 6: TERMINAL — CAP-P2P-RFQ disabled (DN-8).
- ~~**Q1-h CustomerReturnDetail (dialog/panel)**~~ — Cycle 6: TERMINAL — CAP-O2C-RMA disabled (DN-8).
- ~~**DN-6/7/8**~~ — Cycle 6: added to Architectural Data Notes.

### Still open (gating set — queue items)

| queue-id | component | blocker |
|----------|-----------|---------|
| Q5-a | TrackingTimelineComponent | SH-00001 at Pending — requires Mark Shipped or carrier tracking event |
| Q3-c | OffTierPromptDialogComponent | off-tier pricing trigger in PO create flow — untriggerable in current env |
| Q6-b | Customer quotes tab (`/customers/1/quotes`) | READY — QT-00001 exists for customer 1 |
| Q6-c | Customer orders tab (`/customers/1/orders`) | READY — SO-00001/J-1 exists for customer 1 |
| Q6-d | Customer invoices tab (`/customers/1/invoices`) | READY — INV-00001 exists for customer 1 |
| Q6-a | Customer estimates tab (`/customers/1/estimates`) | EstimateFormDialog unwired — no estimate seeded |
| Q4-a,b | EstimateFormDialogComponent (full populated form) | zero callers in source — dead code (DN-3); HOLD per orchestrator |
| Q1-d | RfqDetailDialogComponent | TERMINAL — CAP-P2P-RFQ disabled (DN-8) |
| Q1-h | CustomerReturnDetailDialog/Panel | TERMINAL — CAP-O2C-RMA disabled (DN-8) |
| DN-7 | PM on `/purchase-orders/orders` job-board behavior | source read needed to confirm route/component mechanism |

---

*Cycle 6 dequeue complete — 14 checklist items ticked (Q1-b/e/f/g/i, Q3-a/b, Q5-b, terminal Q1-d/h, including customer-return dialog/panel); 2 checklist items remain unticked (`tracking-timeline`, `off-tier-prompt-dialog`); DN-6/7/8 added. Phase NOT complete until queue drained and all items ticked.*
