# Master-Data Region — Component Inventory

> **Phase:** master-data · **Method:** observe-and-record (no code changes)
> **Single writer:** source-cataloger owns this file. Scout writes queue only.
> **Source on disk:** HEAD e9b7802 (drift resolved — running app matches source; file:line mappings are authoritative)
> **Last commit:** _C2b-source-prelocation_

---

## Schema

| field | content |
|-------|---------|
| component | name / selector |
| type | page · panel · dialog · form · table · cluster · tab · action · state · shared-cmp |
| route | URL (or "shared") |
| file | `path:line` (relative to `forge-ui/src/app/`) |
| renders-for | role(s) + capability(ies) that gate it (or "all") |
| states | which of empty / loading / populated / error were observed live |
| purpose | one line |

---

## Reconciliation Checklist

> Check off every item as it gets a completed entry below.
> Phase is NOT done until every item here is ticked and the queue is empty.

### Routes

- [x] `/leads` — LeadsComponent (list)
- [x] `/leads/intake` — LeadsIntakeComponent
- [x] `/leads/queue` — LeadsQueueComponent
- [x] `/leads/campaigns` — LeadsCampaignsComponent
- [x] `/leads/suppression` — LeadsSuppressionComponent
- [x] `/leads/samples` — LeadsSamplesComponent
- [x] `/leads/accounts` — LeadsAccountsComponent
- [x] `/customers` — CustomersComponent (list)
- [x] `/customers/contacts` — CustomerContactsPageComponent
- [x] `/customers/portal-access` — CustomerPortalAccessPageComponent
- [x] `/customers/segments` — CustomerSegmentsPageComponent
- [x] `/customers/import` — CustomerImportPageComponent
- [x] `/customers/:id/overview` — CustomerDetailComponent (overview tab)
- [x] `/customers/:id/contacts` — CustomerDetailComponent (contacts tab)
- [x] `/customers/:id/addresses` — CustomerDetailComponent (addresses tab)
- [x] `/customers/:id/estimates` — CustomerDetailComponent (estimates tab)
- [x] `/customers/:id/quotes` — CustomerDetailComponent (quotes tab)
- [x] `/customers/:id/orders` — CustomerDetailComponent (orders tab) — lifecycle-gated (Active + orders module not enabled on stack); source-confirmed `customer-orders-tab.component.ts:23`
- [x] `/customers/:id/jobs` — CustomerDetailComponent (jobs tab) — lifecycle-gated; source-confirmed `customer-jobs-tab.component.ts:24`
- [x] `/customers/:id/invoices` — CustomerDetailComponent (invoices tab) — lifecycle-gated; source-confirmed `customer-invoices-tab.component.ts:24`
- [x] `/customers/:id/pricing` — CustomerDetailComponent (pricing tab) — URL redirects to overview (tab not in rail); source-confirmed `customer-pricing-tab.component.ts:40`
- [x] `/customers/:id/interactions` — CustomerDetailComponent (interactions tab) — gated by CAP-MD-CUSTOMER-INTERACTIONS (not enabled); source-confirmed `customer-interactions-cluster.component.ts:37`
- [x] `/customers/:id/activity` — CustomerDetailComponent (activity tab)
- [x] `/vendors` — VendorsComponent (list; only route)
- [x] `/parts` — PartsComponent (list)
- [x] `/parts/new` — PartWorkflowPageComponent (create)
- [x] `/parts/:id` — PartWorkflowPageComponent (detail / all workflow steps) — confirmed via active workflow run pattern (`/parts/new?runId=N&workflow=...`); direct `/parts/{id}` shows "Loading workflow…" when no pending run attached
- [x] `/inventory` → redirects to `/inventory/stock`
- [x] `/inventory/stock` — InventoryComponent (stock tab)
- [x] `/inventory/locations` — InventoryComponent (locations tab)
- [x] `/inventory/movements` — InventoryComponent (movements tab)
- [x] `/inventory/receiving` — InventoryComponent (receiving tab)
- [x] `/inventory/stockOps` — InventoryComponent (stock-ops tab)
- [x] `/inventory/cycleCounts` — InventoryComponent (cycle-counts tab)
- [x] `/inventory/reservations` — InventoryComponent (reservations tab)
- [x] `/inventory/replenishment` — InventoryComponent (replenishment tab)
- [x] `/inventory/uom` — InventoryComponent (UOM tab)
- [x] `/lots` — LotsComponent (list)

### Feature directories (all .ts files accounted for)

#### leads/
- [x] `leads.component.ts` (LeadsComponent)
- [x] `leads.routes.ts`
- [x] `components/account-dialog/account-dialog.component.ts`
- [x] `components/callback-scheduler-dialog/callback-scheduler-dialog.component.ts` — source-confirmed `callback-scheduler-dialog.component.ts:23`; trigger: `leads-queue.component.ts:113` PULL NEXT action; date + time-slot picker, 30-min increments 7AM–6PM; default tomorrow 9AM; gated behind queue state (no live observation — zero leads in queue)
- [x] `components/campaign-dialog/campaign-dialog.component.ts`
- [x] `components/lead-convert-dialog/lead-convert-dialog.component.ts`
- [x] `components/lead-detail-dialog/lead-detail-dialog.component.ts` — source-confirmed `lead-detail-dialog.component.ts:17`; thin wrapper around `LeadDetailPanelComponent`; trigger: `leads.component.ts:284` `openLeadDetail()` → `DetailDialogService.open(LeadDetailDialogComponent)` (row-click); also `?detail=lead:{id}` URL auto-open
- [x] `components/lead-detail-panel/lead-detail-panel.component.ts`
- [x] `components/new-lead-fork-dialog/new-lead-fork-dialog.component.ts`
- [x] `pages/accounts/leads-accounts.component.ts`
- [x] `pages/campaigns/leads-campaigns.component.ts`
- [x] `pages/intake/leads-intake.component.ts`
- [x] `pages/queue/leads-queue.component.ts`
- [x] `pages/samples/leads-samples.component.ts`
- [x] `pages/suppression/leads-suppression.component.ts`

#### customers/
- [x] `customers.component.ts`
- [x] `components/credit-status-card/credit-status-card.component.ts` — source-confirmed `credit-status-card.component.ts:15`; mounted in `CustomerOverviewTabComponent` (confirmed import); credit utilization bar, risk level (Low/Medium/High/OnHold), place/release hold; gated by CAP-O2C-CREDIT-LIMITS (not enabled on stack — not rendered)
- [x] `components/customer-clusters/customer-activity-cluster.component.ts`
- [x] `components/customer-clusters/customer-addresses-cluster.component.ts`
- [x] `components/customer-clusters/customer-contacts-cluster.component.ts`
- [x] `components/customer-clusters/customer-identity-cluster.component.ts`
- [x] `components/customer-clusters/customer-interactions-cluster.component.ts` — source-confirmed `customer-interactions-cluster.component.ts:37`; fields: contactId, type (Call/Email/Meeting/Note), subject (required), body, interactionDate (required, max=today), durationMinutes; gated by CAP-MD-CUSTOMER-INTERACTIONS (not enabled — tab not visible on stack)
- [x] `components/customer-detail-dialog/customer-detail-dialog.component.ts` — source-confirmed `customer-detail-dialog.component.ts:38`; preview dialog (640px) wrapping `CustomerIdentityClusterComponent` + `CustomerOverviewTabComponent`; trigger: `?detail=customer:{id}` URL param or EntityLink cross-entity clicks; "Open customer page" footer button
- [x] `components/guided-customer-dialog/guided-customer-dialog.component.ts` — source-confirmed `guided-customer-dialog.component.ts:43`; 5-step wizard: Identity → Engagement shape (Unknown/QuickQuote/Repeat/Strategic/Prototype) → Addresses (billing+shipping, same-as-billing toggle) → Credit & tax (credit limit, currency, tax-exempt) → Review; 720px; trigger: `customers.component.ts:325` `openGuidedCreateCustomer()` (fork returns 'guided')
- [x] `components/new-customer-fork-dialog/lead-picker-dialog.component.ts`
- [x] `components/new-customer-fork-dialog/new-customer-fork-dialog.component.ts`
- [x] `components/price-list-entries-cluster/price-list-entries-table.component.ts` — source-confirmed `customer-pricing-tab.component.ts:40`; list-of-price-lists selector + entries table; not visible on stack (pricing tab URL redirects to overview; source-only)
- [x] `components/price-list-entries-cluster/price-list-entry-bulk-import-dialog/price-list-entry-bulk-import-dialog.component.ts` — source-confirmed; bulk-import action within pricing tab; not visible on stack (source-only)
- [x] `components/price-list-entries-cluster/price-list-entry-form-dialog.component.ts` — source-confirmed; entry CRUD dialog within pricing tab; not visible on stack (source-only)
- [x] `components/price-list-entries-cluster/price-list-form-dialog/price-list-form-dialog.component.ts` — source-confirmed; price-list create/edit dialog within pricing tab; not visible on stack (source-only)
- [x] `components/provision-portal-access-dialog/provision-portal-access-dialog.component.ts`
- [x] `pages/contacts/customer-contacts.component.ts`
- [x] `pages/customer-detail/customer-detail.component.ts`
- [x] `pages/customer-detail/tabs/customer-activity-tab.component.ts`
- [x] `pages/customer-detail/tabs/customer-estimates-tab.component.ts`
- [x] `pages/customer-detail/tabs/customer-invoices-tab.component.ts` — source-confirmed `customer-invoices-tab.component.ts:24`; columns: invoiceNumber, status, total, dueDate, createdAt; lifecycle-gated (not visible on stack)
- [x] `pages/customer-detail/tabs/customer-jobs-tab.component.ts` — source-confirmed `customer-jobs-tab.component.ts:24`; columns: jobNumber, title, stageName, priority, dueDate, createdAt; lifecycle-gated (not visible on stack)
- [x] `pages/customer-detail/tabs/customer-orders-tab.component.ts` — source-confirmed `customer-orders-tab.component.ts:23`; columns: orderNumber, status, lineCount, total, requestedDeliveryDate, createdAt; lifecycle-gated (Active + orders module not enabled; not visible on stack)
- [x] `pages/customer-detail/tabs/customer-overview-tab.component.ts`
- [x] `pages/customer-detail/tabs/customer-pricing-tab.component.ts` — source-confirmed `customer-pricing-tab.component.ts:40`; list-of-price-lists selector + PriceListEntriesTable + PriceListEntryFormDialog; bulk import; URL `/customers/:id/pricing` redirects to overview (tab not in rail on this stack)
- [x] `pages/customer-detail/tabs/customer-quotes-tab.component.ts`
- [x] `pages/import/customer-import.component.ts`
- [x] `pages/portal-access/customer-portal-access.component.ts`
- [x] `pages/segments/customer-segments.component.ts`

#### vendors/
- [x] `vendors.component.ts`
- [x] `components/guided-vendor-dialog/guided-vendor-dialog.component.ts` — source-confirmed `guided-vendor-dialog.component.ts:64`; separate 6-step wizard (NOT same as VendorDialog): Identity → Relationship type (Transactional/Strategic/Subcontractor/Distributor) → Address → Terms (payment terms) → Supply items (EntityPicker + PartQuickCreateDialog inline) → Review; returns GuidedVendorResult; trigger: `vendors.component.ts:189` fork returns 'guided'
- [x] `components/new-vendor-fork-dialog/new-vendor-fork-dialog.component.ts`
- [x] `components/vendor-detail-dialog/vendor-detail-dialog.component.ts` — source-confirmed `vendor-detail-dialog.component.ts:11`; thin wrapper around `VendorDetailPanelComponent`; trigger: `vendors.component.ts:148` `openVendorDetail()` → `DetailDialogService.open(VendorDetailDialogComponent)` (row-click); also `?detail=vendor:{id}` URL auto-open (`vendors.component.ts:134`)
- [x] `components/vendor-detail-panel/vendor-detail-panel.component.ts`
- [x] `components/vendor-dialog/vendor-dialog.component.ts`
- [x] `components/vendor-quick-create-dialog/vendor-quick-create-dialog.component.ts` — source-confirmed `vendor-quick-create-dialog.component.ts:40`; single-field form (Company Name only); trigger: `EntityPickerComponent` "+ Create new vendor 'X'" inline-create option; returns VendorListItem; not reachable from vendors list directly
- [x] `components/vendor-scorecard-tab/vendor-scorecard-tab.component.ts`

#### parts/ (pages + workflow steps + embedded BOM/routing)
- [x] `parts.component.ts` (list page — _confirmed at `features/parts/parts.component.ts:48`_)
- [x] `workflow/part-workflow-page/part-workflow-page.component.ts`
- [x] `workflow/new-part-fork-dialog/new-part-fork-dialog.component.ts`
- [x] `workflow/part-basics-step/part-basics-step.component.ts`
- [x] `workflow/part-flags-step/part-flags-step.component.ts`
- [x] `workflow/part-costing-step/part-costing-step.component.ts`
- [x] `workflow/part-bom-step/part-bom-step.component.ts`
- [x] `workflow/part-routing-step/part-routing-step.component.ts`
- [x] `workflow/part-sourcing-step/part-sourcing-step.component.ts`
- [x] `workflow/part-quality-step/part-quality-step.component.ts`
- [x] `workflow/part-alternates-step/part-alternates-step.component.ts`
- [x] `workflow/part-sales-hooks-step/part-sales-hooks-step.component.ts`
- [x] `workflow/part-shipping-step/part-shipping-step.component.ts`
- [x] `workflow/part-source-part-step/part-source-part-step.component.ts`
- [x] `workflow/part-tool-asset-step/part-tool-asset-step.component.ts`
- [x] `workflow/part-vendor-step/part-vendor-step.component.ts`
- [x] `workflow/part-inventory-step/part-inventory-step.component.ts`
- [x] `workflow/part-express-form/part-express-form.component.ts`
- [x] `components/bom-revision-history/bom-revision-history.component.ts` — source-confirmed `:17`; inputs: partId (required), refreshToken; list of BOM revisions newest-first with expand/collapse to see frozen component snapshots; loading/error/empty states
- [x] `components/bom-tree/bom-tree.component.ts` — source-confirmed `:9`; inputs: entries (BOMEntry[]); outputs: entryDelete; flat tree with expand/collapse, part number/quantity/source-type (Make/Stock/Buy badges), delete actions
- [x] `components/operation-dialog/operation-dialog.component.ts` — source-confirmed `:39`; MAT_DIALOG_DATA: operation, partId, bomEntries; 4-tab modal (Details, Materials, Files, Activity): step number, title, instructions, work center, QC settings, subcontract vendor; Materials tab: assigned BOM entries add/remove
- [x] `components/part-alternates-tab/part-alternates-tab.component.ts` — source-confirmed `:30`; input: partId; DataTable columns: Part#, Name, Type, Priority, Approved, Bi-Directional; add-alternate dialog: type (Substitute/Equivalent/Superseded), priority, approval, conversion factor, bidirectionality; delete + approve affordances
- [x] `components/part-clusters/part-activity-cluster.component.ts` — source-confirmed `:10`; thin wrapper around `EntityActivitySectionComponent`; input: partId
- [x] `components/part-clusters/part-alternates-cluster/part-alternates-cluster.component.ts` — source-confirmed `:13`; wrapper around `PartAlternatesTabComponent`; inputs: entity (PartDetail), editing
- [x] `components/part-clusters/part-cost-cluster.component.ts` — source-confirmed `:20`; inputs: part, editing, saving; manual cost override (currency input); valuation class + cost-calculation snapshot badges; embeds `PartLandedCostComponent` for door-to-door freight/duty/vendor comparison
- [x] `components/part-clusters/part-files-cluster.component.ts` — source-confirmed `:14`; input: partId; output: uploaded; file upload zone with drag-and-drop + existing attachment list; loading/empty states
- [x] `components/part-clusters/part-identity-cluster.component.ts` — source-confirmed `:24`; inputs: part, editing, saving; editable: Name, Description, Revision, Status dropdown; read-only: PartNumber, ProcurementSource, InventoryClass, ItemKindLabel
- [x] `components/part-clusters/part-inventory-cluster.component.ts` — source-confirmed `:20`; inputs: part, editing, saving; fields: minStockThreshold, reorderPoint, reorderQuantity, safetyStockDays; traceability type (None/Lot/Serial); ABC class dropdown
- [x] `components/part-clusters/part-landed-cost.component.ts` — source-confirmed `:25`; input: partId; averaged unit cost over last N receipts with itemized breakdown (base, freight, duty, FX); contributing receipts sparse table; vendor comparison; empty state when no freight captured
- [x] `components/part-clusters/part-material-cluster/part-material-cluster.component.ts` — source-confirmed `:23`; inputs: part, editing, saving; material spec select (parent/child hierarchy); weight (g/kg/lb/oz); dimensions L×W×H (mm/cm/m/in/ft); volume (mL/L/gal)
- [x] `components/part-clusters/part-mrp-cluster/part-mrp-cluster.component.ts` — source-confirmed `:21`; inputs: part, editing, saving; IsMrpPlanned toggle, LotSizingRule dropdown, fixedOrderQty, minOrderQty, orderMultiple, planningFenceDays, demandFenceDays; fields reveal by lot-sizing rule
- [x] `components/part-clusters/part-pricing-cluster/part-pricing-cluster.component.ts` — source-confirmed `:46`; inputs: entity, editing; current effective price (read-only, source badge: PriceListEntry/PartPrice/VendorPartTier); chronological PartPrice history table (effectiveFrom, effectiveTo, unitPrice, notes); add-new-price form; delete open row only
- [x] `components/part-clusters/part-quality-cluster/part-quality-cluster.component.ts` — source-confirmed `:27`; inputs: part, editing, saving; receiving-inspection settings (template picker, frequency, skip-after count); compliance fields (HazmatClass, ShelfLifeDays, BackflushPolicy) gated by CAP-MD-PART-COMPLIANCE
- [x] `components/part-clusters/part-routing-cluster/part-routing-cluster.component.ts` — source-confirmed `:14`; thin wrapper around `RoutingComponent`; inputs: entity, editing
- [x] `components/part-clusters/part-uom-cluster/part-uom-cluster.component.ts` — source-confirmed `:19`; inputs: part, editing, saving; Stock UoM, Purchase UoM, Sales UoM selects; dynamic UoM list with fallback (ea/kg/g/lb/oz/m/mm/L/mL)
- [x] `components/part-detail-dialog/part-detail-dialog.component.ts` — source-confirmed `:10`; MAT_DIALOG_DATA: partId; thin wrapper around `PartDetailPanelComponent`; closes with result or `{ action: 'edit', part }`
- [x] `components/part-detail-panel/part-detail-panel.component.ts` — source-confirmed `:82`; input: partId; outputs: closed, editRequested; full detail: tab layout resolved by `PartDetailLayoutResolverService` by part axis; clusters: Identity/Inventory/Cost/Activity/Files/Material/UoM/MRP/Quality/Routing/Alternates/Pricing/BOM/Serial Numbers/Vendor Sources/Purchase History; edit mode toggles across clusters; Promote-to-Active button with missing-validators display
- [x] `components/part-quick-create-dialog/part-quick-create-dialog.component.ts` — source-confirmed `:48`; MAT_DIALOG_DATA: initialName, defaultProcurementSource; fields: Name (pre-filled), ProcurementSource dropdown, InventoryClass dropdown; returns created PartDetail; trigger: EntityPickerComponent inline-create for parts
- [x] `components/parts-card-grid/parts-card-grid.component.ts` — source-confirmed `:10`; inputs: parts (PartListItem[]), selectedPartId; output: partClick; grid of cards with thumbnail, part number, name, status badge (Active/Draft/Prototype/Obsolete); async thumbnail load; empty state
- [x] `components/routing/routing.component.ts` — source-confirmed `:19`; inputs: partId, bomEntries (BOMEntry[]); operations list with add/edit/delete; each row: step number, title, work center, QC checkpoint, subcontract vendor; toggle to flow-chart view; opens `OperationDialogComponent`
- [x] `components/routing-flow-view/routing-flow-view.component.ts` — source-confirmed `:8`; input: operations (Operation[]); read-only connected-flow layout of operation sequence
- [x] `components/serial-numbers-tab/serial-numbers-tab.component.ts` — source-confirmed `:21`; input: partId; columns: Serial#, Status, Location, Job, Manufactured, Children count; status filter; create serial dialog; detail dialog (history timeline); genealogy dialog (parent/child tree); only visible for serialized parts
- [x] `components/vendor-parts-cluster/vendor-part-form-dialog.component.ts` — source-confirmed `:43`; MAT_DIALOG_DATA: vendorPart, parentEntityType, parentEntityId, parentLabel, defaultIsPreferred; create/edit VendorPart; vendor picker (from Part) or part picker (from Vendor); fields: vendor/part number, MPN, lead time, MOQ, pack size, CoO, HTS code, approval, preferred, isManufacturer toggle, last-quoted date, notes; inline-create handlers
- [x] `components/vendor-parts-cluster/vendor-part-price-tier-history-dialog.component.ts` — source-confirmed `:32`; MAT_DIALOG_DATA: vendorPart; read-only; chronological VendorPartPriceTier history table (Min Qty, Unit Price, Effective From/To, Notes); loading/empty states
- [x] `components/vendor-parts-cluster/vendor-part-price-tiers-dialog.component.ts` — source-confirmed `:33`; MAT_DIALOG_DATA: vendorPart; manage current VendorPartPriceTier set (table: Min Qty, Unit Price, Currency, Effective From/To, Notes, delete); add-new-tier form; delete opens confirmation dialog
- [x] `components/vendor-sources-panel/vendor-sources-panel.component.ts` — source-confirmed `:128`; inputs: partId, partLabel, preferredVendorId, preferredVendorName, editing; 3 view modes: Inspector (collapsed cards + detail pane), Compare (accordion), Pricing (cross-vendor tier table); per-row 1:1 fields save on blur; preferred vendor toggle; panel Save/Cancel with aggregated validation
- [x] `components/vendor-parts-cluster/vendor-part-list-panel.component.ts`
- [x] `components/vendor-parts-cluster/vendor-part-bulk-import-dialog.component.ts` — source-confirmed `:42`; MAT_DIALOG_DATA: vendorId, vendorName; 2-state modal: file picker (CSV, 5MB, drag-and-drop) → dry-run preview table (Add/Update/Error/Skip chips, error counts, Apply button); template download; upsert by (vendorId, partId)

#### inventory/
- [x] `inventory.component.ts` (InventoryComponent — all 9 tabs confirmed C1+C4)
- [x] `components/receiving-inspection-queue/receiving-inspection-queue.component.ts` — source-confirmed `receiving-inspection-queue.component.ts:12`; embedded in `/inventory/receiving` tab; columns: partNumber, partDescription, poNumber, vendorName, receivedQuantity, receivedAt, daysWaiting; row highlights overdue (>3 days = warning, >7 days = critical); no receiving events on stack (empty state not observed)
- [x] `components/uom-management/uom-management.component.ts`

#### lots/
- [x] `lots.component.ts`
- [x] `components/lot-detail-dialog/lot-detail-dialog.component.ts` — source-confirmed `lot-detail-dialog.component.ts:12`; thin wrapper around `LotDetailPanelComponent`; `LotDetailDialogData { lotId, lotNumber }`; trigger: row-click on lots list (0 lots on stack — no live observation)
- [x] `components/lot-detail-panel/lot-detail-panel.component.ts` — source-confirmed `lot-detail-panel.component.ts:13`; read-only; inputs: lotId + lotNumber; trace signal via `LotService.trace(lotNumber)`; trace event icons: Job/ProductionRun/PurchaseOrder/BinLocation/QcInspection; `EntityActivitySectionComponent` for activity feed; no forms/dialogs; 0 lots on stack (no live observation)
- [x] `components/lot-dialog/lot-dialog.component.ts`

### Shared components — usage reconciliation (resolved)

> ✅ = has master-data usages (see resolved table below) · ❌ = no master-data usage confirmed

- [x] ✅ `shared/components/data-table` — 18 usage sites across all 6 areas
- [x] ✅ `shared/components/page-header` — 13 usage sites across all 6 areas
- [x] ✅ `shared/components/page-layout` — 3 usage sites (leads/samples, leads/accounts, customers/portal-access)
- [x] ❌ `shared/components/detail-side-panel` — **deliberately unused** in master-data; panels (leads, vendors, lots) are feature-specific components, not wrappers of this shared cmp
- [x] ❌ `shared/components/slideout` — **deliberately unused** in master-data; used in other regions (sales-orders, kanban)
- [x] ✅ `shared/components/dialog` — 8+ usage sites across leads, customers, parts, inventory
- [x] ✅ `shared/components/entity-picker` — 16 usage sites; heaviest in parts workflow
- [x] ✅ `shared/components/empty-state` — 9 usage sites across customers, vendors, leads, inventory, lots
- [x] ✅ `shared/components/loading-overlay` (impl: `LoadingBlockDirective` from `shared/directives/`) — 20+ sites across all 6 areas; `LoadingOverlayComponent` itself is not used in master-data
- [x] ❌ `shared/components/status-badge` — **deliberately unused** in master-data list surfaces; row status is rendered via text/CSS class, not via this shared badge
- [x] ✅ `shared/components/entity-link` — 2 usage sites (parts/part-landed-cost, parts/part-detail-panel)
- [x] ✅ `shared/components/entity-activity-section` — 5 usage sites (leads, customers, vendors, parts, lots)
- [x] ✅ `shared/components/workflow` — 1 usage site (parts/part-workflow-page)
- [x] ✅ `shared/components/address-form` — 4 usage sites (leads/convert, customers/guided, vendors/dialog, vendors/guided)
- [x] ✅ `shared/components/file-upload-zone` — 2 usage sites (parts/operation-dialog, parts/part-files-cluster)
- [x] ❌ `shared/components/rich-text-editor` — **deliberately unused** in master-data; no long-form rich text fields in these entities
- [x] ❌ `shared/components/autocomplete` — **deliberately unused** in master-data features; used in SO/PO/quote/shipment dialogs only
- [x] ✅ `shared/components/entity-completeness-badge` + `entity-completeness-chip` — 6 usage sites (customers, vendors, parts list + detail panels)

---

## Component Entries

> Source-cataloger fills these from source. Scout confirms states live.
> Entries seeded from source at HEAD e9b7802.

---

### LEADS

---

#### LeadsComponent
| field | value |
|-------|-------|
| component | `LeadsComponent` / `app-leads` |
| type | page |
| route | `/leads` |
| file | `features/leads/leads.component.ts:44` |
| renders-for | Admin, Manager, PM |
| states | `empty` — "no leads" empty-state observed C1 (non-seeded run); `populated` — Beta Industries row visible with STATUS=NEW, SOURCE=Direct, FOLLOW-UP=—, CREATED=05/21/2026 confirmed C4b; `loading` inferred; `error` unreached |
| purpose | Root leads list view; shell for all sub-pages |

---

#### LeadsIntakeComponent
| field | value |
|-------|-------|
| component | `LeadsIntakeComponent` / `app-leads-intake` |
| type | page |
| route | `/leads/intake` |
| file | `features/leads/pages/intake/leads-intake.component.ts:43` |
| renders-for | Admin, Manager, PM |
| states | `empty` — "get started" empty state + table headers (HEADER/REQUIRED?/ALSO ACCEPTED) visible; PARSE PASTED ROWS button visible (non-seeded, 2026-05-22); `populated` unreached (queue Q6-a) |
| purpose | Intake form / entry point for new leads |

---

#### LeadsQueueComponent
| field | value |
|-------|-------|
| component | `LeadsQueueComponent` / `app-leads-queue` |
| type | page |
| route | `/leads/queue` |
| file | `features/leads/pages/queue/leads-queue.component.ts:43` |
| renders-for | Admin, Manager, PM |
| states | `empty` — shell rendered, PULL NEXT 5 button visible, no items in queue (non-seeded, 2026-05-22); `populated` unreached (queue Q6-a) |
| purpose | Actionable queue of leads awaiting follow-up |

---

#### LeadsCampaignsComponent
| field | value |
|-------|-------|
| component | `LeadsCampaignsComponent` / `app-leads-campaigns` |
| type | page |
| route | `/leads/campaigns` |
| file | `features/leads/pages/campaigns/leads-campaigns.component.ts:19` |
| renders-for | Admin, Manager, PM |
| states | `empty` — shell rendered, NEW CAMPAIGN button visible (non-seeded, 2026-05-22); `populated` unreached (queue Q6-a) |
| purpose | Campaign management for leads outreach |

---

#### LeadsSuppressionComponent
| field | value |
|-------|-------|
| component | `LeadsSuppressionComponent` / `app-leads-suppression` |
| type | page |
| route | `/leads/suppression` |
| file | `features/leads/pages/suppression/leads-suppression.component.ts:16` |
| renders-for | Admin, Manager, PM |
| states | `empty` — shell rendered, no primary action button detected (non-seeded, 2026-05-22); `populated` unreached (queue Q6-a) |
| purpose | Suppression list management (do-not-contact) |

---

#### LeadsSamplesComponent
| field | value |
|-------|-------|
| component | `LeadsSamplesComponent` / `app-leads-samples` |
| type | page |
| route | `/leads/samples` |
| file | `features/leads/pages/samples/leads-samples.component.ts:33` |
| renders-for | Admin, Manager, PM |
| states | `empty` — shell rendered, no primary action button detected (non-seeded, 2026-05-22); `populated` unreached (queue Q6-a) |
| purpose | Sample requests tied to leads |

---

#### LeadsAccountsComponent
| field | value |
|-------|-------|
| component | `LeadsAccountsComponent` / `app-leads-accounts` |
| type | page |
| route | `/leads/accounts` |
| file | `features/leads/pages/accounts/leads-accounts.component.ts:34` |
| renders-for | Admin, Manager, PM |
| states | `empty` — shell rendered, NEW ACCOUNT button visible (non-seeded, 2026-05-22); `populated` unreached (queue Q6-a) |
| purpose | Account-level leads grouping view |

---

#### LeadDetailPanelComponent
| field | value |
|-------|-------|
| component | `LeadDetailPanelComponent` / `app-lead-detail-panel` |
| type | panel |
| route | `/leads` (slide-in) |
| file | `features/leads/components/lead-detail-panel/lead-detail-panel.component.ts:25` |
| renders-for | Admin, Manager, PM |
| states | `populated` — Beta Industries lead opened C4b: STATUS=NEW, SOURCE=Direct, CLASSIFICATION=precision_manufacturing; status chip rail (NEW/CONTACTED/QUOTING/LOST/CONVERT), CAP FIT NOT ASSESSED, NDA NONE, ITAR N/A, CONVERT TO CUSTOMER action, RECENT COMMUNICATIONS 0, ACTIVITY feed empty; `empty` unreached (no empty panel — panel only opens with a row selected) |
| purpose | Right-side detail panel for a selected lead without navigating away |

`LeadDetailPanelComponent` sub-surfaces (states confirmed C4b):

| sub-surface | type | file:line | purpose |
|-------------|------|-----------|---------|
| Status chip rail | action | `statuses` array `:68`; `updateStatus()` `:233`; `statusPending` signal `:231` | Clickable status chips (New/Contacted/Qualified/…); patches lead status in-place |
| Capability-fit chip | action | `setCapabilityFit()` `:150`; `capFitPending` signal `:146` | Toggle capability fit assessment (Yes/No/Unknown) |
| NDA state chip | action | `setNdaState()` `:164`; `ndaPending` signal `:147` | Toggle NDA status (Signed/Pending/None) |
| Export control chip | action | `setExportControl()` `:178`; `exportPending` signal `:148` | Toggle export control flag |
| Lost-reason dialog | dialog | `showLostDialog` signal `:61`; `lostReasonControl` `:62`; `DialogComponent` | Inline dialog: textarea for lost reason; triggered when status flipped to Lost |
| Convert to Customer | action | `convertLead()` `:287`; opens `LeadConvertDialogComponent` `:291` via MatDialog | Launches LeadConvertDialogComponent with AddressFormComponent |
| Campaign name lookup | state | `campaignNames` signal `:53` | Lazy-loaded map of campaignId → name; renders campaign chip if lead has campaign |
| Activity feed | shared-cmp | `EntityActivitySectionComponent` (import `:30`) | Full change/activity log for the lead |
| Recent communications | shared-cmp | `RecentCommunicationsComponent` (imported) | Last N communications (calls, emails) with the lead |

---

#### LeadDetailDialogComponent
| field | value |
|-------|-------|
| component | `LeadDetailDialogComponent` / `app-lead-detail-dialog` |
| type | dialog |
| route | `/leads` (modal) |
| file | `features/leads/components/lead-detail-dialog/lead-detail-dialog.component.ts:17` |
| renders-for | Admin, Manager, PM |
| states | `create` — source-confirmed; thin wrapper around `LeadDetailPanelComponent`; observed indirectly in C5 (scout confirmed panel content via `c2-lead-detail-panel-open.png` which IS this dialog); trigger: row-click → `leads.component.ts:284` `openLeadDetail()` → `DetailDialogService.open(LeadDetailDialogComponent)` |
| purpose | Full-detail dialog for a lead (alternative to panel) |

---

#### NewLeadForkDialogComponent
| field | value |
|-------|-------|
| component | `NewLeadForkDialogComponent` / `app-new-lead-fork-dialog` |
| type | dialog |
| route | `/leads` (modal) |
| file | `features/leads/components/new-lead-fork-dialog/new-lead-fork-dialog.component.ts:46` |
| renders-for | Admin, Manager, PM |
| states | `create` — confirmed C5 (ui-scout 2026-05-22): "HOW WOULD YOU LIKE TO ADD THIS LEAD?" — "What kind of opportunity is this?" — 5 shape tiles: **Quick add** (just the basics), **Quick quote/RFQ** (inbound request with formed need), **Repeat/standing relationship** (existing customer-shaped lead), **Strategic account** (long sales cycle, multiple stakeholders), **Prototype/R&D** (custom or exploratory); CANCEL button; no selection required before CANCEL. Triggered by `+ NEW LEAD` split-button. `c2-new-lead-fork-dialog.png` |
| purpose | Fork chooser: shape picker (Quick add / Quote / Repeat / Strategic / Prototype) → form |

---

#### LeadConvertDialogComponent
| field | value |
|-------|-------|
| component | `LeadConvertDialogComponent` / `app-lead-convert-dialog` |
| type | dialog |
| route | `/leads` (modal) |
| file | `features/leads/components/lead-convert-dialog/lead-convert-dialog.component.ts:41` |
| renders-for | Admin, Manager, PM |
| states | `create` — confirmed C4c (source-cataloger, 2026-05-22): 3-step wizard; **Step 1 "What we'll carry over"** — carries COMPANY (Beta Industries) and SOURCE (Direct) from lead; CANCEL + NEXT buttons; **Step 2 "Customer details"** — new customer form fields; **Step 3 "Confirm"** — review + submit; triggered via CONVERT TO CUSTOMER action in LeadDetailPanelComponent → `convertLead()` → MatDialog opens |
| purpose | Convert a lead to a customer |

---

#### AccountDialogComponent (leads)
| field | value |
|-------|-------|
| component | `AccountDialogComponent` / `app-account-dialog` |
| type | dialog |
| route | `/leads/accounts` (modal) |
| file | `features/leads/components/account-dialog/account-dialog.component.ts:18` |
| renders-for | Admin, Manager, PM |
| states | `create` — confirmed C4: fields: Account name, Industry, Size bracket, Website, Phone, Address, City, State, Postal code, Country, Description; CANCEL + SAVE buttons; triggered by NEW ACCOUNT from accounts page or empty-state button |
| purpose | Create / edit a leads account |

---

#### CallbackSchedulerDialogComponent
| field | value |
|-------|-------|
| component | `CallbackSchedulerDialogComponent` / `app-callback-scheduler-dialog` |
| type | dialog |
| route | `/leads` (modal) |
| file | `features/leads/components/callback-scheduler-dialog/callback-scheduler-dialog.component.ts:23` |
| renders-for | Admin, Manager, PM |
| states | `create` — source-confirmed `callback-scheduler-dialog.component.ts:23`; date picker + 30-min time-slot grid (7AM–6PM); default tomorrow 9AM; trigger: `leads-queue.component.ts:113` PULL NEXT action on queue item; live observation blocked (no leads currently in queue state) |
| purpose | Schedule a callback for a lead |

---

#### CampaignDialogComponent
| field | value |
|-------|-------|
| component | `CampaignDialogComponent` / `app-campaign-dialog` |
| type | dialog |
| route | `/leads/campaigns` (modal) |
| file | `features/leads/components/campaign-dialog/campaign-dialog.component.ts:30` |
| renders-for | Admin, Manager, PM |
| states | `create` — confirmed C4: fields: Name, Description, Strategy (Cold Call default), Default cooldown override (days), Started, Ended; CANCEL + SAVE buttons; triggered by NEW CAMPAIGN from campaigns page or empty-state button |
| purpose | Create / edit a lead campaign |

---

### CUSTOMERS

---

#### CustomersComponent
| field | value |
|-------|-------|
| component | `CustomersComponent` / `app-customers` |
| type | page |
| route | `/customers` |
| file | `features/customers/customers.component.ts:38` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | `empty` — "no customers" empty-state observed C1; `populated` — 2 rows (Acme Corp × 2, email/phone/ACTIVE/0 contacts/0 jobs/created date columns) confirmed C4b; `loading` inferred; `error` unreached |
| purpose | Customer list with search, filter, and row actions |

---

#### CustomerContactsPageComponent
| field | value |
|-------|-------|
| component | `CustomerContactsPageComponent` / `app-customer-contacts-page` |
| type | page |
| route | `/customers/contacts` |
| file | `features/customers/pages/contacts/customer-contacts.component.ts:13` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | `empty` — shell rendered (non-seeded, 2026-05-22); `populated` unreached (queue Q6-b) |
| purpose | Cross-customer contacts list |

---

#### CustomerPortalAccessPageComponent
| field | value |
|-------|-------|
| component | `CustomerPortalAccessPageComponent` / `app-customer-portal-access-page` |
| type | page |
| route | `/customers/portal-access` |
| file | `features/customers/pages/portal-access/customer-portal-access.component.ts:29` |
| renders-for | Admin, OfficeManager |
| states | `empty` — shell rendered, PROVISION ACCESS button visible (non-seeded, 2026-05-22); `populated` unreached (queue Q6-b) |
| purpose | Manage customer portal login provisioning |

---

#### CustomerSegmentsPageComponent
| field | value |
|-------|-------|
| component | `CustomerSegmentsPageComponent` / `app-customer-segments-page` |
| type | page |
| route | `/customers/segments` |
| file | `features/customers/pages/segments/customer-segments.component.ts:19` |
| renders-for | Admin, Manager |
| states | `empty` — shell rendered (non-seeded, 2026-05-22); `populated` unreached (queue Q6-b) |
| purpose | Customer segmentation / tag management |

---

#### CustomerImportPageComponent
| field | value |
|-------|-------|
| component | `CustomerImportPageComponent` / `app-customer-import-page` |
| type | page |
| route | `/customers/import` |
| file | `features/customers/pages/import/customer-import.component.ts:20` |
| renders-for | Admin, Manager |
| states | `empty` — shell rendered (non-seeded, 2026-05-22); `populated` unreached (queue Q6-b) |
| purpose | Bulk import customers from CSV / spreadsheet |

---

#### CustomerDetailComponent
| field | value |
|-------|-------|
| component | `CustomerDetailComponent` |
| type | page |
| route | `/customers/:id/:tab` (default tab: overview) |
| file | `features/customers/pages/customer-detail/customer-detail.component.ts:56` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | `populated` — Acme Corp (id=2) at `/customers/2/overview` confirmed C4b: header shows ACTIVE badge, EntityCompletenessBadgeComponent "Ready", email/phone, summary counters (0 OPEN ESTIMATES/QUOTES/ORDERS/ACTIVE JOBS/$0 OUTSTANDING/$0 YTD REVENUE); tab rail visible: **Overview \| Contacts \| Addresses \| Estimates \| Quotes \| Activity** (6 tabs); tabs NOT visible on this stack: Orders, Jobs, Invoices, Pricing, Interactions — likely module/capability gated |
| purpose | Multi-tab customer detail shell; tab layout driven by resolver (role + status) |

Tabs within CustomerDetailComponent — observed C4b:

| tab id | component | file:line (@Component) | capability gate | lifecycle gate | observed |
|--------|-----------|------------------------|-----------------|----------------|---------|
| `overview` | `CustomerOverviewTabComponent` | `pages/customer-detail/tabs/customer-overview-tab.component.ts:21` | none | all | ✅ C4b: ACCOUNT DETAILS (Name/Email/Phone/Status/CustomerSince), Regulated Industries toggles, Reference Customer Consent toggle |
| `contacts` | `CustomerContactsClusterComponent` _(cluster, no tab cmp)_ | `components/customer-clusters/customer-contacts-cluster.component.ts:36` | `CAP-MD-CUSTOMER-CONTACTS` | all | ✅ C4b: empty — ADD CONTACT button, "No contacts yet ADD FIRST CONTACT" |
| `addresses` | `CustomerAddressesClusterComponent` _(cluster, no tab cmp)_ | `components/customer-clusters/customer-addresses-cluster.component.ts:35` | `CAP-MD-CUSTOMER-ADDRESSES` | all | ✅ C5: empty — "No addresses on file" with location-off icon; `c2-customer-detail-addresses.png` |
| `estimates` | `CustomerEstimatesTabComponent` | `pages/customer-detail/tabs/customer-estimates-tab.component.ts:34` | none | Active + Prospect | ✅ C5: empty — "No estimates yet" + "+ NEW ESTIMATE" button; `c2-customer-detail-estimates.png` |
| `quotes` | `CustomerQuotesTabComponent` | `pages/customer-detail/tabs/customer-quotes-tab.component.ts:23` | none | Active + Prospect | ✅ C5: empty — "No quotes yet" + "+ NEW QUOTE" button; `c2-customer-detail-quotes.png` |
| `orders` | `CustomerOrdersTabComponent` | `pages/customer-detail/tabs/customer-orders-tab.component.ts:23` | none | Active only | ⚠️ tab NOT visible on Acme Corp/admin — module/capability gate |
| `jobs` | `CustomerJobsTabComponent` | `pages/customer-detail/tabs/customer-jobs-tab.component.ts:24` | none | Active only | ⚠️ tab NOT visible |
| `invoices` | `CustomerInvoicesTabComponent` | `pages/customer-detail/tabs/customer-invoices-tab.component.ts:24` | none | Active only | ⚠️ tab NOT visible |
| `pricing` | `CustomerPricingTabComponent` | `pages/customer-detail/tabs/customer-pricing-tab.component.ts:40` | none | all | ⚠️ URL `/customers/2/pricing` redirected to overview tab — tab NOT in rail |
| `interactions` | `CustomerInteractionsClusterComponent` _(cluster, no tab cmp)_ | `components/customer-clusters/customer-interactions-cluster.component.ts:37` | `CAP-MD-CUSTOMER-INTERACTIONS` | all | ⚠️ tab NOT visible — capability not enabled on this stack |
| `activity` | `CustomerActivityTabComponent` + `CustomerActivityClusterComponent` | `tabs/customer-activity-tab.component.ts:8` + `components/customer-clusters/customer-activity-cluster.component.ts:10` | none | all | ✅ C4b: "ACTIVITY ALL CONVERSATION NOTES HISTORY No activity yet." — EntityActivitySectionComponent renders |

> Source (customer-detail.component.ts:90-94): `contacts`, `addresses`, `interactions` are capability-gated at the tab level via `tabCapabilityMap`; the backing caps must be enabled or the tab is dropped from the layout. Lifecycle gating (Active/Prospect/etc.) is resolved by `CustomerDetailLayoutResolverService.resolve()` (line 119). `contacts`, `addresses`, `interactions` have no standalone `*-tab.component.ts` — the clusters are mounted directly in the shell template.

---

#### Customer cluster components (source-confirmed; gated items noted per entry)

---

##### CustomerIdentityClusterComponent
| field | value |
|-------|-------|
| component | `CustomerIdentityClusterComponent` / `app-customer-identity-cluster` |
| type | cluster |
| route | `/customers/:id/overview` (mounted in overview tab) |
| file | `features/customers/components/customer-clusters/customer-identity-cluster.component.ts:21` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | `populated` — confirmed C4b in overview tab: renders ACCOUNT DETAILS block (CUSTOMER NAME, EMAIL, PHONE, STATUS, CUSTOMER SINCE), Regulated Industries section (FDA/AS9100/IATF/ITAR toggles), Reference Customer Consent toggle |
| purpose | Editable identity cluster: name, status, credit limit, account type; emits patch to CustomerDetailComponent |

---

##### CustomerContactsClusterComponent
| field | value |
|-------|-------|
| component | `CustomerContactsClusterComponent` / `app-customer-contacts-cluster` |
| type | cluster |
| route | `/customers/:id/contacts` (cluster-mounted as tab; gated by `CAP-MD-CUSTOMER-CONTACTS`) |
| file | `features/customers/components/customer-clusters/customer-contacts-cluster.component.ts:36` |
| renders-for | Admin, Manager, PM, OfficeManager — when `CAP-MD-CUSTOMER-CONTACTS` enabled |
| states | `empty` — confirmed C4b: "ADD CONTACT … No contacts yet ADD FIRST CONTACT"; `populated` unreached |
| purpose | Contact list for the customer; add/edit contacts inline |

---

##### CustomerAddressesClusterComponent
| field | value |
|-------|-------|
| component | `CustomerAddressesClusterComponent` / `app-customer-addresses-cluster` |
| type | cluster |
| route | `/customers/:id/addresses` (cluster-mounted as tab; gated by `CAP-MD-CUSTOMER-ADDRESSES`) |
| file | `features/customers/components/customer-clusters/customer-addresses-cluster.component.ts:35` |
| renders-for | Admin, Manager, PM, OfficeManager — when `CAP-MD-CUSTOMER-ADDRESSES` enabled |
| states | `empty` — confirmed C5 (ui-scout 2026-05-22): "No addresses on file" with location-off icon; `c2-customer-detail-addresses.png`; `populated` unreached |
| purpose | Shipping / billing address list; add/edit addresses via AddressFormComponent |

---

##### CustomerInteractionsClusterComponent
| field | value |
|-------|-------|
| component | `CustomerInteractionsClusterComponent` / `app-customer-interactions-cluster` |
| type | cluster |
| route | `/customers/:id/interactions` (cluster-mounted as tab; gated by `CAP-MD-CUSTOMER-INTERACTIONS`) |
| file | `features/customers/components/customer-clusters/customer-interactions-cluster.component.ts:37` |
| renders-for | Admin, Manager, PM, OfficeManager — when `CAP-MD-CUSTOMER-INTERACTIONS` enabled |
| states | `source-confirmed`; fields: contactId, type (Call/Email/Meeting/Note), subject (required), body, interactionDate (required, max=today), durationMinutes; gated by CAP-MD-CUSTOMER-INTERACTIONS — tab not visible on this stack (capability not enabled) |
| purpose | Call log / interaction history feed; log new interactions inline |

---

##### CustomerActivityClusterComponent
| field | value |
|-------|-------|
| component | `CustomerActivityClusterComponent` / `app-customer-activity-cluster` |
| type | cluster |
| route | `/customers/:id/activity` (embedded inside CustomerActivityTabComponent) |
| file | `features/customers/components/customer-clusters/customer-activity-cluster.component.ts:10` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | `empty` — confirmed C4b: "ACTIVITY ALL CONVERSATION NOTES HISTORY No activity yet." — EntityActivitySectionComponent wrapped; `populated` unreached |
| purpose | Wraps shared `EntityActivitySectionComponent`; renders the full change/activity feed for the customer |

---

#### CustomerDetailDialogComponent
| field | value |
|-------|-------|
| component | `CustomerDetailDialogComponent` / `app-customer-detail-dialog` |
| type | dialog |
| route | `/customers` (modal, can deep-link to `/customers/:id/overview`) |
| file | `features/customers/components/customer-detail-dialog/customer-detail-dialog.component.ts:38` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | `source-confirmed` `customer-detail-dialog.component.ts:38`; 640px preview dialog wrapping `CustomerIdentityClusterComponent` + `CustomerOverviewTabComponent`; trigger: `?detail=customer:{id}` URL param or cross-entity EntityLink clicks; "Open customer page" footer button; not triggered by row-click on customers list (row-click navigates full page) |
| purpose | Quick-view customer detail in a dialog before optionally full-navigating |

---

#### NewCustomerForkDialogComponent
| field | value |
|-------|-------|
| component | `NewCustomerForkDialogComponent` / `app-new-customer-fork-dialog` |
| type | dialog |
| route | `/customers` (modal) |
| file | `features/customers/components/new-customer-fork-dialog/new-customer-fork-dialog.component.ts:46` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | `create` — confirmed C4: "HOW WOULD YOU LIKE TO ADD THIS CUSTOMER?" — fork options: flash_on Quick add (MOST COMMON — "Drop in a name…"), person_add Convert from lead; source-confirmed 3rd path: tune Guided (source: `new-customer-fork-dialog.component.ts`) — scout sweep only encountered 2 tiles; triggered by NEW CUSTOMER button |
| purpose | Fork chooser: quick / convert-from-lead / guided creation paths |

---

#### GuidedCustomerDialogComponent
| field | value |
|-------|-------|
| component | `GuidedCustomerDialogComponent` |
| type | dialog |
| route | `/customers` (modal) |
| file | `features/customers/components/guided-customer-dialog/guided-customer-dialog.component.ts:43` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | `source-confirmed` `guided-customer-dialog.component.ts:43`; 5-step wizard: Identity → Engagement shape (Unknown/QuickQuote/Repeat/Strategic/Prototype) → Addresses (billing+shipping, same-as-billing toggle) → Credit & tax (credit limit, currency, tax-exempt) → Review; 720px; trigger: `customers.component.ts:325` `openGuidedCreateCustomer()` when fork returns 'guided' (fork has 3 paths: quick/fromLead/guided); live observation blocked (guided tile not encountered during scout sweep) |
| purpose | Step-by-step guided new customer creation wizard |

---

#### LeadPickerDialogComponent
| field | value |
|-------|-------|
| component | `LeadPickerDialogComponent` / `app-lead-picker-dialog` |
| type | dialog |
| route | `/customers` (modal — within new-customer fork flow) |
| file | `features/customers/components/new-customer-fork-dialog/lead-picker-dialog.component.ts:18` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | `populated` — confirmed C4b: "PICK A LEAD TO CONVERT" title; "Only leads that aren't yet Lost or Converted appear here. Search by company, contact, or email"; Beta Industries NEW row with chevron_right; CANCEL button; triggered via "Convert from lead" path in customer fork |
| purpose | Pick existing lead to convert when creating a customer |

---

#### ProvisionPortalAccessDialogComponent
| field | value |
|-------|-------|
| component | `ProvisionPortalAccessDialogComponent` / `app-provision-portal-access-dialog` |
| type | dialog |
| route | `/customers/portal-access` (modal) |
| file | `features/customers/components/provision-portal-access-dialog/provision-portal-access-dialog.component.ts:26` |
| renders-for | Admin, OfficeManager |
| states | `empty-eligible` — confirmed C4: "No eligible contacts. Every contact either lacks an email or already has portal access." with CANCEL only; triggered by PROVISION ACCESS button |
| purpose | Provision / revoke customer portal access |

---

#### Customer cluster components (embedded in CustomerDetailComponent)

| component | type | file | states |
|-----------|------|------|--------|
| `CustomerIdentityClusterComponent` / `app-customer-identity-cluster` | cluster | `features/customers/components/customer-clusters/customer-identity-cluster.component.ts:21` | ✅ C4b populated — see entry above |
| `CustomerContactsClusterComponent` / `app-customer-contacts-cluster` | cluster | `features/customers/components/customer-clusters/customer-contacts-cluster.component.ts:36` | ✅ C4b empty — "No contacts yet" |
| `CustomerAddressesClusterComponent` / `app-customer-addresses-cluster` | cluster | `features/customers/components/customer-clusters/customer-addresses-cluster.component.ts:35` | ✅ C5 empty — "No addresses on file"; `c2-customer-detail-addresses.png` |
| `CustomerInteractionsClusterComponent` / `app-customer-interactions-cluster` | cluster | `features/customers/components/customer-clusters/customer-interactions-cluster.component.ts:37` | ⚠️ tab not visible on this stack |
| `CustomerActivityClusterComponent` / `app-customer-activity-cluster` | cluster | `features/customers/components/customer-clusters/customer-activity-cluster.component.ts:10` | ✅ C4b empty — "No activity yet" |
| `CreditStatusCardComponent` / `app-credit-status-card` | cluster | `features/customers/components/credit-status-card/credit-status-card.component.ts:15` | ⚠️ gated by CAP-O2C-CREDIT-LIMITS (not enabled on stack — not rendered); source-confirmed: credit utilization bar, risk level (Low/Medium/High/OnHold), place/release hold |

> All cluster entries: renders-for Admin/Manager/PM/OfficeManager.

---

#### Price-list cluster components (embedded in pricing tab)

| component | type | file | states |
|-----------|------|------|--------|
| `PriceListEntriesTableComponent` / `app-price-list-entries-table` | table | `features/customers/components/price-list-entries-cluster/price-list-entries-table.component.ts:33` | ⚠️ source-confirmed; pricing tab not visible on this stack (URL redirects to overview) |
| `PriceListEntryFormDialogComponent` | dialog | `features/customers/components/price-list-entries-cluster/price-list-entry-form-dialog.component.ts:41` | ⚠️ source-confirmed; pricing tab not visible on this stack |
| `PriceListFormDialogComponent` / `app-price-list-form-dialog` | dialog | `features/customers/components/price-list-entries-cluster/price-list-form-dialog/price-list-form-dialog.component.ts:45` | ⚠️ source-confirmed; pricing tab not visible on this stack |
| `PriceListEntryBulkImportDialogComponent` | dialog | `features/customers/components/price-list-entries-cluster/price-list-entry-bulk-import-dialog/price-list-entry-bulk-import-dialog.component.ts:45` | ⚠️ source-confirmed; pricing tab not visible on this stack |

> All price-list cluster entries: renders-for Admin/Manager (pricing tab gate); pricing tab not visible on current stack config.

---

### VENDORS

---

#### VendorsComponent
| field | value |
|-------|-------|
| component | `VendorsComponent` / `app-vendors` |
| type | page |
| route | `/vendors` |
| file | `features/vendors/vendors.component.ts:29` |
| renders-for | Admin, Manager, OfficeManager |
| states | `empty` — "no vendors" empty-state observed C1; `populated` — 3 rows (Global Supply Co, Steel Supply Co × 2; columns COMPANY NAME/CONTACT/EMAIL/PHONE/ACTIVE/POS/CREATED) confirmed C4b; `loading` inferred; `error` unreached |
| purpose | Vendor list; only top-level vendor route |

---

#### VendorDetailPanelComponent
| field | value |
|-------|-------|
| component | `VendorDetailPanelComponent` / `app-vendor-detail-panel` |
| type | panel |
| route | `/vendors` (slide-in) |
| file | `features/vendors/components/vendor-detail-panel/vendor-detail-panel.component.ts:51` |
| renders-for | Admin, Manager, OfficeManager |
| states | `populated` — confirmed C4b (Global Supply Co): panel opens inline on vendor row-click; shows vendor name, check_circle Ready badge, edit/close controls; INFO tab default: STATUS/EMAIL/PHONE/CREATED/UPDATED fields + EntityActivitySectionComponent ("No activity yet") + DEACTIVATE/DELETE actions; PURCHASE ORDERS (0) tab: empty count shown in tab label; CATALOG tab: "upload_file IMPORT CSV add ADD PART … This vendor has no parts in the catalog yet"; SCORECARD tab: grade A 100/100 with full breakdown (DELIVERY 40%/QUALITY 30%/PRICE 20%/QUANTITY 10%) |
| purpose | Right-side detail panel for selected vendor; 4-tab layout: info / purchase-orders / scorecard / catalog |

`VendorDetailPanelComponent` sub-surfaces (confirmed C4b):

| sub-surface | type | file:line | purpose |
|-------------|------|-----------|---------|
| Tab rail | state | `activeTab` signal `:64` → `'info' \| 'purchase-orders' \| 'scorecard' \| 'catalog'` | Drives which tab content renders |
| Info tab — edit dialog | dialog | `showEditDialog` signal `:72`; `openEditVendor()` `:104`; `VendorDialogComponent` (inline toggle) | In-panel edit form for vendor master fields |
| Info tab — toggle active | action | `toggleActive()` `:118` | Activates / deactivates vendor; snackbar feedback |
| Info tab — delete | action | `deleteVendor()` `:130`; `ConfirmDialogComponent` `:133` | Deletes vendor after confirmation |
| Purchase-orders tab | table | `poColumns` DataTable `:76` | PO number, status, line count, expected delivery, created date; row click → `/purchase-orders?detail=…` |
| Scorecard tab | tab | `VendorScorecardTabComponent` (import `:24`) | Embedded scorecard; lazy-loaded on tab activation |
| Catalog tab — parts list | panel | `VendorPartListPanelComponent` (import `:25`); `loadVendorParts()` `:181` | ⚠️ _discovered C2b_ — list of vendor-part records for this vendor; loaded on tab activate |
| Catalog tab — add part | action | `openVendorPartCreate()` `:195`; `VendorPartFormDialogComponent` `:198` (MatDialog) | Opens form dialog to add a new vendor-part record |
| Catalog tab — edit part | action | `openVendorPartEdit()` `:230`; `VendorPartFormDialogComponent` `:233` (MatDialog) | Opens form dialog to edit an existing vendor-part record |
| Catalog tab — bulk import | action | `openVendorPartImport()` `:215`; `VendorPartBulkImportDialogComponent` `:218` (MatDialog, 800px) | ⚠️ _discovered C2b_ — bulk CSV/spreadsheet import for vendor catalog |
| Catalog tab — price tiers | action | `openVendorPartTiers()` `:275`; `VendorPartPriceTiersDialogComponent` `:278` (MatDialog, 700px) | Edit price-break tiers for a vendor-part record |
| Catalog tab — tier history | action | `openVendorPartTierHistory()` `:286`; `VendorPartPriceTierHistoryDialogComponent` `:288` (MatDialog, 700px) | Read-only view of tier history for a vendor-part record |
| Catalog tab — toggle preferred | action | `toggleVendorPartPreferred()` `:269` | Marks a vendor-part as preferred source |
| Catalog tab — delete part | action | `deleteVendorPart()` `:249`; `ConfirmDialogComponent` `:251` | Removes vendor-part from catalog after confirmation |
| Activity feed | shared-cmp | `EntityActivitySectionComponent` (import `:43`) | Vendor-level change/activity log; rendered in info tab |

---

#### VendorDetailDialogComponent
| field | value |
|-------|-------|
| component | `VendorDetailDialogComponent` / `app-vendor-detail-dialog` |
| type | dialog |
| route | `/vendors` (modal) |
| file | `features/vendors/components/vendor-detail-dialog/vendor-detail-dialog.component.ts:11` |
| renders-for | Admin, Manager, OfficeManager |
| states | `source-confirmed` `vendor-detail-dialog.component.ts:11`; thin wrapper around `VendorDetailPanelComponent`; trigger: `vendors.component.ts:148` `openVendorDetail()` → `DetailDialogService.open(VendorDetailDialogComponent)` (row-click) and `vendors.component.ts:134` `autoOpenFromUrl()` for `?detail=vendor:{id}`; live observation: confirmed indirectly (VendorDetailPanel content confirmed C4b via this dialog) |
| purpose | Full vendor detail dialog |

---

#### VendorDialogComponent
| field | value |
|-------|-------|
| component | `VendorDialogComponent` / `app-vendor-dialog` |
| type | dialog |
| route | `/vendors` (modal) |
| file | `features/vendors/components/vendor-dialog/vendor-dialog.component.ts:21` |
| renders-for | Admin, Manager, OfficeManager |
| states | `create` — confirmed C4b (via Quick add path): fields: Company Name, Contact Name, Email, Phone, NOTES (textarea), ADDRESS section (Street Address, City, State, ZIP, Country with "United States" default + VERIFY ADDRESS), SETTINGS (Payment Terms, Off-Tier Variance %); CANCEL + CREATE VENDOR buttons |
| purpose | Create / edit vendor form dialog |

---

#### NewVendorForkDialogComponent
| field | value |
|-------|-------|
| component | `NewVendorForkDialogComponent` / `app-new-vendor-fork-dialog` |
| type | dialog |
| route | `/vendors` (modal) |
| file | `features/vendors/components/new-vendor-fork-dialog/new-vendor-fork-dialog.component.ts:30` |
| renders-for | Admin, Manager, OfficeManager |
| states | `create` — confirmed C4: "NEW VENDOR — Choose how to set up this vendor." — flash_on Quick add (FAST — "Just the essentials") + tune Guided setup ("Step-by-step for strategic or approv…"); triggered by NEW VENDOR button |
| purpose | Fork chooser for new vendor creation |

---

#### GuidedVendorDialogComponent
| field | value |
|-------|-------|
| component | `GuidedVendorDialogComponent` |
| type | dialog |
| route | `/vendors` (modal) |
| file | `features/vendors/components/guided-vendor-dialog/guided-vendor-dialog.component.ts:64` |
| renders-for | Admin, Manager, OfficeManager |
| states | `source-confirmed` `guided-vendor-dialog.component.ts:64`; separate 6-step wizard (NOT same as VendorDialog flat form): Identity → Relationship type (Transactional/Strategic/Subcontractor/Distributor) → Address → Terms (payment terms) → Supply items (EntityPicker + PartQuickCreateDialog inline) → Review; returns GuidedVendorResult; trigger: `vendors.component.ts:189` fork returns 'guided'; live observation blocked (scout did not select guided path) |
| purpose | Step-by-step guided vendor creation wizard |

---

#### VendorQuickCreateDialogComponent
| field | value |
|-------|-------|
| component | `VendorQuickCreateDialogComponent` |
| type | dialog |
| route | `shared` (spawned from other surfaces — POs, parts sourcing) |
| file | `features/vendors/components/vendor-quick-create-dialog/vendor-quick-create-dialog.component.ts:40` |
| renders-for | Admin, Manager, OfficeManager |
| states | `source-confirmed` `vendor-quick-create-dialog.component.ts:40`; single-field form (Company Name only); returns VendorListItem; trigger: `EntityPickerComponent` "+ Create new vendor 'X'" inline-create option; not reachable directly from vendors list |
| purpose | Inline quick-create vendor without leaving current context |

---

#### VendorScorecardTabComponent
| field | value |
|-------|-------|
| component | `VendorScorecardTabComponent` / `app-vendor-scorecard-tab` |
| type | tab |
| route | `/vendors` (within vendor detail panel — confirmed mounted there; also likely in detail dialog) |
| file | `features/vendors/components/vendor-scorecard-tab/vendor-scorecard-tab.component.ts:12` |
| renders-for | Admin, Manager, OfficeManager |
| states | `populated` — confirmed C4b in VendorDetailPanel SCORECARD tab: grade letter A, score 100/100, date range 2025-05-22–2026-05-22; breakdown: ON-TIME DELIVERY 100%, QUALITY ACCEPTANCE 100%, QTY ACCURACY 100%, $0.00 TOTAL SPEND; detailed table (DELIVERY 40%: POs 0, Lines Received 0, On-Time 100%, Late 0; QUALITY 30%: Inspected 0, Rejected 0, NCRs 0, Acceptance 100%; PRICE 20%: $0.00, 0% variance; QUANTITY 10%: 100%); `empty` unreached (no scoring data scenario) |
| purpose | Vendor performance scorecard embedded in detail |

---

### PARTS

---

#### PartsComponent
| field | value |
|-------|-------|
| component | `PartsComponent` |
| type | page |
| route | `/parts` |
| file | `features/parts/parts.component.ts:48` |
| renders-for | Admin, Manager, Engineer, PM |
| states | `empty` — "No parts found" empty-state observed C1+C4b (0 parts in stack); `populated` unreached (needs seeded part); `loading` inferred; `error` unreached |
| purpose | Parts list with search, multi-filter bar, table/card-grid toggle, and ghost rows for entity-less workflow drafts |

`PartsComponent` list-level sub-surfaces (source-confirmed; `populated` live state requires seeded Active part):

| sub-surface | type | file:line | purpose |
|-------------|------|-----------|---------|
| Parts table | table | `partColumns` `:182` — partNumber, name, revision, procurementSource, inventoryClass, status, effectivePrice, bomEntryCount, completeness (hidden by default) | Primary list view; `combinedRows` computed `:94` prepends ghost rows for in-flight workflow drafts |
| Card grid | panel | `PartsCardGridComponent` (import `:37`); toggled via `viewMode` `:134` | Alternate card layout; view mode persisted via `UserPreferencesService` |
| Search control | state | `searchControl` FormControl `:142`; debounced via `searchTerm` signal `:151` | Free-text search against part number / name / description |
| Status filter | state | `statusFilterControl` `:145` — Active (default) / Draft / Prototype / Obsolete / all | Defaults to Active; user opts into Draft explicitly to see in-flight workflow drafts |
| Procurement filter | state | `procurementFilterControl` `:148` — Make / Buy / Subcontract / Phantom / all | Filter by procurement axis |
| Inventory class filter | state | `inventoryClassFilterControl` `:149` — Raw / Component / Subassembly / FinishedGood / Consumable / Tool / all | Filter by inventory class axis |
| New part fork | action | `NewPartForkDialogComponent` (import `:42`); opened via MatDialog | Fork: express vs. guided workflow vs. source-from-part |
| Part detail dialog | action | `PartDetailDialogComponent` (import `:39`); `DetailDialogService` `:38` | Row click on materialized part opens detail dialog |

---

#### PartWorkflowPageComponent
| field | value |
|-------|-------|
| component | `PartWorkflowPageComponent` |
| type | page |
| route | `/parts/new` · `/parts/:id` |
| file | `features/parts/workflow/part-workflow-page/part-workflow-page.component.ts:28` |
| renders-for | Admin, Manager, Engineer, PM |
| states | `create` — confirmed C4f/C4g (2026-05-22): **Express mode** — all fields on one screen (Name, Description, Notes, Traceability, ABC Class, Manual cost override $); **Guided mode** — step-by-step breadcrumb nav (STEP N OF N · STEP-LABEL), mode toggle in header (Express/All at once ↔ Guided/Step by step); URL pattern: `/parts/new?runId=N&workflow=part-{source}-{class}-v1&mode={express\|guided}`; existing part path `/parts/{id}` shows "Loading workflow…" when no active run linked |
| purpose | Multi-step workflow shell for creating or editing a part |

---

#### Workflow step components (all embedded in PartWorkflowPageComponent)

| component | file:line | step-id(s) / label | confirmed states (C4f/C4g, 2026-05-22) |
|-----------|-----------|---------------------|----------------------------------------|
| `NewPartForkDialogComponent` | `workflow/new-part-fork-dialog/new-part-fork-dialog.component.ts:66` | pre-step fork | `create` — 4-step progressive: (1) Procurement source (Made/Bought/Subcontracted/Phantom buttons with `data-testid="fork-procurement-{value}"`), (2) Inventory class filtered to viable combos, (3) Item kind optional `app-select`, (4) Mode express/guided; CONTINUE enables after steps 1+2 |
| `PartExpressFormComponent` | `workflow/part-express-form/part-express-form.component.ts:33` | all steps (express mode) | `create` — "Quick add · Fill in everything at once"; fields: Name, Description, Notes (optional), Traceability (Bulk/no tracking), ABC Class, Manual cost override $; SAVE button; warning badge shows count of validation errors |
| `PartBasicsStepComponent` | `workflow/part-basics-step/part-basics-step.component.ts:30` | `basics` / BASICS | `create` — "Name and a short description — the minimum to identify this part"; fields: Name, Description, Notes; BACK + CONTINUE; step 1 in all workflow variants |
| `PartInventoryStepComponent` | `workflow/part-inventory-step/part-inventory-step.component.ts:23` | `manufacturing` / MANUFACTURING; `inventory` / INVENTORY | `create` — "Inventory / Stock thresholds and unit of measure. Drives reorder triggers and bin defaults"; fields: Min Stock Threshold, Reorder Point, Reorder Quantity, Safety Stock Days, Stock UoM, Default Bin (id) search; used as "manufacturing" step in Make variants, "inventory" in Buy variants |
| `PartBomStepComponent` | `workflow/part-bom-step/part-bom-step.component.ts:51` | `bom` / BILL OF MATERIALS | `create` — "List every component this assembly uses"; ADD COMPONENT button; empty-state "No components yet"; BACK + SKIP + CONTINUE; OPTIONAL label; see expanded sub-surfaces entry below |
| `PartRoutingStepComponent` | `workflow/part-routing-step/part-routing-step.component.ts:17` | `routing` / ROUTING | `create` — "Define the operation steps to manufacture this part"; REFRESH STATUS button; BACK + CONTINUE |
| `PartCostingStepComponent` | `workflow/part-costing-step/part-costing-step.component.ts:36` | `costing` / COST | `create` — "Set how this part's cost is calculated"; COSTING MODE radio: Tier 1 Manual override / Tier 2 Departmental rates / Tier 3 Activity-based; Manual cost override $ field; "CURRENTLY DISPLAYED COST: Not set"; BACK + CONTINUE |
| `PartAlternatesStepComponent` | `workflow/part-alternates-step/part-alternates-step.component.ts:11` | `alternates` / ALTERNATES | `create` — "Optional — list substitute or equivalent parts for procurement flexibility"; BACK + SKIP + MARK COMPLETE; OPTIONAL label |
| `PartSourcingStepComponent` | `workflow/part-sourcing-step/part-sourcing-step.component.ts:24` | `sourcing` / PREFERRED VENDOR | `create` — "Pick the default vendor for this part. Lead time, MOQ, pack size, OEM identity, and pricing are entered per-vendor on the next step"; Preferred Vendor entity-picker search; BACK + CONTINUE |
| `PartVendorStepComponent` | `workflow/part-vendor-step/part-vendor-step.component.ts:24` | `vendor` / SUBCONTRACT VENDOR | `create` — Subcontract path: "Pick the subcontract vendor for this part"; Preferred Vendor entity-picker search; BACK + CONTINUE |
| `PartVendorPartsStepComponent` (list panel) | `components/vendor-parts-cluster/vendor-part-list-panel.component.ts` | `vendorParts` / VENDOR SOURCES | `create` — "Each vendor that supplies this part is its own group below"; "Save earlier steps first to enable vendor sources"; BACK + SKIP + CONTINUE; OPTIONAL label |
| `PartQualityStepComponent` | `workflow/part-quality-step/part-quality-step.component.ts:26` | `quality` / QUALITY | `create` — "Receiving inspection, traceability, ABC class, hazmat, and shelf life"; fields: Traceability (Bulk/no tracking), Requires Receiving Inspection toggle, ABC Class, Hazmat Class, Shelf Life (days); BACK + MARK COMPLETE |
| `PartShippingStepComponent` | `workflow/part-shipping-step/part-shipping-step.component.ts:25` | `shipping` / SHIPPING | `create` — "Shipping & Physical — Mass, dimensions, and volume. Drives shipping rate quotes and inventory cube"; fields: Weight (each), Weight Unit (g), Length, Width, Height, Dimension Unit (mm), Volume, Volume Unit (mL); BACK + CONTINUE |
| `PartSalesHooksStepComponent` | `workflow/part-sales-hooks-step/part-sales-hooks-step.component.ts:24` | `salesHooks` / SALES SETUP | `create` — "Sales-side parameters for resold finished goods"; fields: Sales UoM; "INFERRED SALES PRICE $0.00 Default — no pricing configured"; BACK + SKIP + MARK COMPLETE; OPTIONAL label |
| `PartFlagsStepComponent` | `workflow/part-flags-step/part-flags-step.component.ts:22` | `flags` / FLAGS | `create` — "Phantom-specific flags: kit, configurator, and backflush policy"; fields: Is Kit toggle, Is Configurable toggle, Backflush Policy; BACK + SKIP + MARK COMPLETE; OPTIONAL label |
| `PartSourcePartStepComponent` | `workflow/part-source-part-step/part-source-part-step.component.ts:20` | `sourcePart` / SOURCE PART | `create` — "The pre-finishing in-house part that's sent to the subcontractor"; Source Part entity-picker search; BACK + CONTINUE |
| `PartToolAssetStepComponent` | `workflow/part-tool-asset-step/part-tool-asset-step.component.ts:23` | `toolAsset` / TOOLING ASSET | `create` — "Link this part to its tooling Asset record (for cavity, life, calibration tracking)"; Tooling Asset entity-picker search; BACK + CONTINUE |

> All workflow steps render-for: Admin, Manager, Engineer, PM. All confirmed in `create` state via workflow runs C4f/C4g (2026-05-22). `edit` state for existing parts unreached — requires active workflow run linked to part.

---

#### BOM step — expanded pre-located entry (states: source-confirmed; live populated state requires seeded part)

`PartBomStepComponent` (`workflow/part-bom-step/part-bom-step.component.ts:51`) sub-surfaces:

| sub-surface | type | file:line | purpose |
|-------------|------|-----------|---------|
| BOM entries table | table | `:91` (`bomColumns` def) | DataTable — child part number, qty, source type, lead time, ref designator, delete action |
| Add BOM entry dialog | dialog | `showAddDialog` signal `:81`; `openAdd()` `:160` | In-component `DialogComponent`; fields: childPartId (EntityPicker), quantity, sourceType (auto), referenceDesignator, leadTimeDays, notes |
| Child part EntityPicker | shared-cmp | `@ViewChild('childPartPicker')` `:72` | Selects child part; on change auto-derives `sourceType` from child's `procurementSource` (Make/Subcontract/Phantom → Make; Buy → Buy) |
| Auto-source label | state | `autoSourceLabel` computed `:119` | Read-only display line showing auto-derived source type; null until part picked |
| Quick-create child part | action | `onCreateChildPart()` `:211`; opens `PartQuickCreateDialogComponent` `:212` | Inline part creation if child not yet registered; pre-fills with typed term |
| Delete BOM entry | action | `deleteEntry()` `:222`; opens `ConfirmDialogComponent` `:225` | Deletes a BOM row; requires confirmation |

BOM visualization components (mounted in part detail panel, not the workflow step):

| component | file:line | purpose |
|-----------|-----------|---------|
| `BomTreeComponent` / `app-bom-tree` | `features/parts/components/bom-tree/bom-tree.component.ts:9` | Visual BOM hierarchy tree |
| `BomRevisionHistoryComponent` | `features/parts/components/bom-revision-history/bom-revision-history.component.ts:17` | BOM revision change history |

---

#### Part cluster components — source-confirmed (live observation requires seeded Active part)

All mounted in `PartDetailPanelComponent` and/or `PartWorkflowPageComponent`; renders-for Admin/Manager/Engineer/PM.

| component / selector | file:line (@Component) | purpose |
|----------------------|------------------------|---------|
| `PartIdentityClusterComponent` / `app-part-identity-cluster` | `part-clusters/part-identity-cluster.component.ts:24` | Part number, description, procurement source |
| `PartCostClusterComponent` / `app-part-cost-cluster` | `part-clusters/part-cost-cluster.component.ts:19` | Standard cost, cost roll-up |
| `PartInventoryClusterComponent` / `app-part-inventory-cluster` | `part-clusters/part-inventory-cluster.component.ts:20` | On-hand, reserved, available quantities |
| `PartFilesClusterComponent` / `app-part-files-cluster` | `part-clusters/part-files-cluster.component.ts:14` | Drawings / attachments via FileUploadZoneComponent |
| `PartActivityClusterComponent` / `app-part-activity-cluster` | `part-clusters/part-activity-cluster.component.ts:10` | Wraps EntityActivitySectionComponent for part changes |
| `PartAlternatesClusterComponent` / `app-part-alternates-cluster` | `part-clusters/part-alternates-cluster/part-alternates-cluster.component.ts:13` | Alternate part substitution list |
| `PartLandedCostComponent` / `app-part-landed-cost` | `part-clusters/part-landed-cost.component.ts:25` | Landed cost breakdown; uses EntityLinkComponent for PO links |
| `PartMaterialClusterComponent` / `app-part-material-cluster` | `part-clusters/part-material-cluster/part-material-cluster.component.ts:23` | Raw material spec (alloy, grade, finish) |
| `PartMrpClusterComponent` / `app-part-mrp-cluster` | `part-clusters/part-mrp-cluster/part-mrp-cluster.component.ts:21` | MRP planning parameters (lead time, order qty, safety stock) |
| `PartPricingClusterComponent` / `app-part-pricing-cluster` | `part-clusters/part-pricing-cluster/part-pricing-cluster.component.ts:46` | Sales pricing tiers |
| `PartQualityClusterComponent` / `app-part-quality-cluster` | `part-clusters/part-quality-cluster/part-quality-cluster.component.ts:27` | Quality control settings; EntityPickerComponent for inspection plan |
| `PartRoutingClusterComponent` / `app-part-routing-cluster` | `part-clusters/part-routing-cluster/part-routing-cluster.component.ts:14` | Manufacturing routing steps list |
| `PartUomClusterComponent` / `app-part-uom-cluster` | `part-clusters/part-uom-cluster/part-uom-cluster.component.ts:19` | Unit-of-measure conversions |

> All paths above are relative to `features/parts/components/`.

---

#### Other parts components

| component | file | type | purpose |
|-----------|------|------|---------|
| `PartDetailPanelComponent` | `features/parts/components/part-detail-panel/part-detail-panel.component.ts:82` | panel | Slide-in detail for list view |
| `PartDetailDialogComponent` | `features/parts/components/part-detail-dialog/part-detail-dialog.component.ts:10` | dialog | Full part detail in a dialog |
| `PartQuickCreateDialogComponent` | `features/parts/components/part-quick-create-dialog/part-quick-create-dialog.component.ts:48` | dialog | Quick-create part inline |
| `PartsCardGridComponent` | `features/parts/components/parts-card-grid/parts-card-grid.component.ts:10` | table | Card-grid layout for parts list |
| `RoutingComponent` | `features/parts/components/routing/routing.component.ts:19` | cluster | Routing operations table |
| `RoutingFlowViewComponent` | `features/parts/components/routing-flow-view/routing-flow-view.component.ts:8` | cluster | Visual flow of routing steps |
| `OperationDialogComponent` | `features/parts/components/operation-dialog/operation-dialog.component.ts:39` | dialog | Create / edit routing operation |
| `PartAlternatesTabComponent` | `features/parts/components/part-alternates-tab/part-alternates-tab.component.ts:30` | tab | Alternates tab within part detail |
| `SerialNumbersTabComponent` | `features/parts/components/serial-numbers-tab/serial-numbers-tab.component.ts:21` | tab | Serial numbers tab within part detail |
| `VendorSourcesPanelComponent` | `features/parts/components/vendor-sources-panel/vendor-sources-panel.component.ts:128` | panel | Vendor sources side panel |
| `VendorPartFormDialogComponent` | `features/parts/components/vendor-parts-cluster/vendor-part-form-dialog.component.ts:43` | dialog | Add/edit vendor-part record |
| `VendorPartPriceTiersDialogComponent` | `features/parts/components/vendor-parts-cluster/vendor-part-price-tiers-dialog.component.ts:33` | dialog | Edit vendor price tiers |
| `VendorPartPriceTierHistoryDialogComponent` | `features/parts/components/vendor-parts-cluster/vendor-part-price-tier-history-dialog.component.ts:32` | dialog | View vendor price-tier history |
| `VendorPartListPanelComponent` ⚠️ | `features/parts/components/vendor-parts-cluster/vendor-part-list-panel.component.ts:26` | panel | ⚠️ _discovered C2b_ — rendered in Vendor detail panel Catalog tab; list of vendor-part records for a given vendor |
| `VendorPartBulkImportDialogComponent` ⚠️ | `features/parts/components/vendor-parts-cluster/vendor-part-bulk-import-dialog.component.ts:42` | dialog | ⚠️ _discovered C2b_ — bulk CSV import for a vendor's catalog; 800px MatDialog; `VendorPartBulkImportDialogData { vendorId, vendorName }` |

---

#### VendorPartListPanelComponent _(discovered C2b)_
| field | value |
|-------|-------|
| component | `VendorPartListPanelComponent` |
| type | panel |
| route | `/vendors` (embedded in Catalog tab of `VendorDetailPanelComponent`) |
| file | `features/parts/components/vendor-parts-cluster/vendor-part-list-panel.component.ts:26` |
| renders-for | Admin, Manager, OfficeManager |
| states | `empty` — confirmed C4b in Catalog tab: "This vendor has no parts in the catalog yet. Add a part this vendor supplies." with ADD PART button; also IMPORT CSV button visible; `populated` unreached |
| purpose | List of vendor-part records for a given vendor; loaded on Catalog tab activation in vendor detail panel |

---

#### VendorPartBulkImportDialogComponent _(discovered C2b)_
| field | value |
|-------|-------|
| component | `VendorPartBulkImportDialogComponent` |
| type | dialog |
| route | `/vendors` (MatDialog, 800px; `VendorPartBulkImportDialogData { vendorId, vendorName }`) |
| file | `features/parts/components/vendor-parts-cluster/vendor-part-bulk-import-dialog.component.ts:42` |
| renders-for | Admin, Manager, OfficeManager |
| states | `source-confirmed` `vendor-part-bulk-import-dialog.component.ts:42`; 2-state modal: file picker (CSV, 5MB, drag-and-drop) → dry-run preview table (Add/Update/Error/Skip chips, error counts, Apply button); template download helper; upsert by (vendorId, partId); live observation blocked (IMPORT CSV button visible in Catalog tab C4b but dialog not opened) |
| purpose | Bulk CSV/spreadsheet import for a vendor's parts catalog; launched from Catalog tab in vendor detail panel |

---

### INVENTORY

---

#### InventoryComponent
| field | value |
|-------|-------|
| component | `InventoryComponent` |
| type | page |
| route | `/inventory/:tab` (valid tabs: stock · locations · movements · receiving · stockOps · cycleCounts · reservations · replenishment · uom) |
| file | `features/inventory/inventory.component.ts:46` |
| renders-for | Admin, Manager, Engineer, OfficeManager |
| states | All 9 tabs confirmed live (C1+C4, 2026-05-22): `stock`→ empty "no inventory"; `locations`→ shell/tree rendered; `movements`→ empty "0 RECENT MOVEMENTS"; `receiving`→ shell/empty; `stockOps`→ TRANSFER + ADJUST action buttons visible; `cycleCounts`→ empty "0 CYCLE COUNTS", NEW COUNT button; `reservations`→ empty "0 reservations", RESERVE STOCK button; `replenishment`→ empty "No pending replenishment suggestions"; `uom`→ UomManagementComponent renders (UNITS OF MEASURE heading); all `populated` states unreached (needs stock/PO/cycle-count data) |
| purpose | Tabbed inventory management shell; each tab is an in-component view (no sub-routing) |

Tabs within InventoryComponent (in-component, NOT separate route components):

| tab | key columns / signals | in-component dialogs | embedded component |
|-----|-----------------------|---------------------|--------------------|
| `stock` | partNumber, description, material, onHand, reserved, available (`:82`) | — | — |
| `locations` | Tree view: Area→Rack→Shelf→Bin; `locationTree` signal `:100`; `selectedLocation` `:100`; `binContents` `:101` | Add-location dialog: `showLocationDialog` `:152`; form `:153` — name, locationType, parentId, barcode, description | — |
| `movements` | entityName, quantity, fromLocation, toLocation, reason, movedBy, movedAt (`:107`) | — | — |
| `receiving` | PO #, Part #, qty, receivedBy, location, lotNumber, date (`:120`); `showReceiveDialog` `:170`; form `:172` — poLineId, qty, locationId, lotNumber, notes | Receive dialog: `showReceiveDialog` `:170` | `ReceivingInspectionQueueComponent` |
| `stockOps` | No dedicated table; hub for transfer + adjust actions | Transfer: `showTransferDialog` `:186`; form `:187` — sourceBinContentId, destinationLocationId, qty, notes; Adjust: `showAdjustDialog` `:201`; form `:202` — binContentId, newQuantity, reason, notes | — |
| `cycleCounts` | locationName, countedBy, date, status (Pending/Approved/Rejected), lineCount, variance (`:133`); `showCycleCountDialog` `:249`; `showCreateCycleCountDialog` `:253` | Create cycle count: form `:254` — locationId, notes; Detail dialog: `showCycleCountDialog` | — |
| `reservations` | partNumber, description, locationPath, qty, jobNumber, jobTitle, notes, createdAt (`:220`); `showReservationDialog` `:233` | Reserve: `showReservationDialog` `:233`; form `:234` — partId, binContentId, jobId, qty, notes | — |
| `replenishment` | Burn rates + suggestions; `loadBurnRates()` / `loadSuggestions()` triggered on tab activate `:292` | — | — |
| `uom` | UOM definitions list; managed via `UomManagementComponent` | (dialogs within UomManagementComponent) | `UomManagementComponent` |

> **Source note (inventory.component.ts:44,64,71):** The authoritative tab type is
> `'stock' | 'locations' | 'movements' | 'receiving' | 'stockOps' | 'cycleCounts' | 'reservations' | 'replenishment' | 'uom'` (line 44).
> `VALID_TABS` (line 64) guards the `activeTab` signal; any unrecognised slug — including
> `transfers` and `adjustments` — falls back to `'stock'` (line 71).
> `transfers` and `adjustments` are **NOT** tabs. They are in-component dialog forms
> launched from within the `stockOps` tab. ✅ Source agrees with scout's live observation.

---

#### ReceivingInspectionQueueComponent
| field | value |
|-------|-------|
| component | `ReceivingInspectionQueueComponent` |
| type | panel |
| route | `/inventory/receiving` (embedded in receiving tab) |
| file | `features/inventory/components/receiving-inspection-queue/receiving-inspection-queue.component.ts:12` |
| renders-for | Admin, Manager, Engineer, OfficeManager |
| states | `source-confirmed` `receiving-inspection-queue.component.ts:12`; columns: partNumber, partDescription, poNumber, vendorName, receivedQuantity, receivedAt, daysWaiting; row highlights overdue (>3 days = warning, >7 days = critical); no receiving events on stack — live observation blocked |
| purpose | Queue of inbound items pending inspection before stock entry |

---

#### UomManagementComponent
| field | value |
|-------|-------|
| component | `UomManagementComponent` |
| type | panel |
| route | `/inventory/uom` (embedded in uom tab) |
| file | `features/inventory/components/uom-management/uom-management.component.ts:21` |
| renders-for | Admin, Manager |
| states | `populated` — confirmed C5 (ui-scout 2026-05-22): UomManagementComponent renders with pre-seeded UOM table (SQFT/Square Foot, SQIN/Square Inch, EA/Each, PR/Pair, DZ/Dozen, PK/Pack); sub-tabs: UNITS OF MEASURE (active) + CONVERSIONS; + NEW UOM button; `c2-inventory-uom.png` |
| purpose | Manage unit-of-measure definitions and conversions |

---

### LOTS

---

#### LotsComponent
| field | value |
|-------|-------|
| component | `LotsComponent` |
| type | page |
| route | `/lots` |
| file | `features/lots/lots.component.ts:19` |
| renders-for | Admin, Manager, Engineer |
| states | `empty` — table rendered with 0 rows (no empty-text keyword matched in body; SEARCH button visible, 2026-05-22); `populated` unreached (queue Q6-g) |
| purpose | Lot list with search and row actions |

---

#### LotDetailPanelComponent
| field | value |
|-------|-------|
| component | `LotDetailPanelComponent` |
| type | panel |
| route | `/lots` (slide-in) |
| file | `features/lots/components/lot-detail-panel/lot-detail-panel.component.ts:13` |
| renders-for | Admin, Manager, Engineer |
| states | `source-confirmed` `lot-detail-panel.component.ts:13`; inputs: lotId, lotNumber; trace signal via `LotService.trace(lotNumber)`; trace event icons: Job/ProductionRun/PurchaseOrder/BinLocation/QcInspection; `EntityActivitySectionComponent` for activity feed; read-only (no forms/dialogs); live observation blocked (0 lots on stack) |
| purpose | Right-side detail panel for selected lot; displays trace provenance + activity feed |

`LotDetailPanelComponent` sub-surfaces (source-confirmed; live observation requires seeded lot):

| sub-surface | type | file:line | purpose |
|-------------|------|-----------|---------|
| Lot trace timeline | state | `trace` signal `:29` (LotTrace model); `getTraceEventIcon()` `:44` | Chronological provenance events — Job / ProductionRun / PurchaseOrder / BinLocation / QcInspection; icon per event type |
| Activity feed | shared-cmp | `EntityActivitySectionComponent` (import `:16`) | Lot-level change/activity log |

> No forms or dialogs in this panel; it is read-only (trace + activity only).

---

#### LotDetailDialogComponent
| field | value |
|-------|-------|
| component | `LotDetailDialogComponent` |
| type | dialog |
| route | `/lots` (modal) |
| file | `features/lots/components/lot-detail-dialog/lot-detail-dialog.component.ts:12` |
| renders-for | Admin, Manager, Engineer |
| states | `source-confirmed` `lot-detail-dialog.component.ts:12`; thin wrapper around `LotDetailPanelComponent`; `LotDetailDialogData { lotId, lotNumber }`; trigger: row-click on lots list; live observation blocked (0 lots on stack) |
| purpose | Full lot detail dialog |

---

#### LotDialogComponent
| field | value |
|-------|-------|
| component | `LotDialogComponent` |
| type | dialog |
| route | `/lots` (modal) |
| file | `features/lots/components/lot-dialog/lot-dialog.component.ts:21` |
| renders-for | Admin, Manager, Engineer |
| states | `create` — confirmed C4: fields: Part (EntityPicker with search), Quantity, Supplier Lot #, Linked Job (optional, search), Expiration Date (optional), Notes (optional); CANCEL + SAVE buttons; triggered by NEW LOT button or empty-state button |
| purpose | Create / edit lot form dialog |

---

---

## Shared Component — Resolved Usage Sites

> Source-grepped; line numbers are the `imports: [...]` array line in each consumer file.
> Paths relative to `forge-ui/src/app/features/`.

### DataTableComponent (`shared/components/data-table`)

| consumer file | line |
|---------------|------|
| `leads/leads.component.ts` | 51 |
| `leads/pages/campaigns/leads-campaigns.component.ts` | 24 |
| `leads/pages/samples/leads-samples.component.ts` | 40 |
| `leads/pages/accounts/leads-accounts.component.ts` | 40 |
| `leads/pages/suppression/leads-suppression.component.ts` | 21 |
| `customers/customers.component.ts` | 45 |
| `customers/pages/contacts/customer-contacts.component.ts` | 18 |
| `customers/pages/portal-access/customer-portal-access.component.ts` | 37 |
| `customers/pages/customer-detail/tabs/customer-quotes-tab.component.ts` | 26 |
| `customers/pages/customer-detail/tabs/customer-orders-tab.component.ts` | 26 |
| `customers/pages/customer-detail/tabs/customer-jobs-tab.component.ts` | 27 |
| `customers/pages/customer-detail/tabs/customer-invoices-tab.component.ts` | 27 |
| `vendors/vendors.component.ts` | 35 |
| `vendors/components/vendor-detail-panel/vendor-detail-panel.component.ts` | 41 |
| `inventory/inventory.component.ts` | 49 |
| `inventory/components/receiving-inspection-queue/receiving-inspection-queue.component.ts` | 15 |
| `inventory/components/uom-management/uom-management.component.ts` | 25 |
| `lots/lots.component.ts` | 25 |

---

### PageHeaderComponent (`shared/components/page-header`)

| consumer file | line |
|---------------|------|
| `leads/leads.component.ts` | 49 |
| `leads/pages/intake/leads-intake.component.ts` | 48 |
| `leads/pages/queue/leads-queue.component.ts` | 48 |
| `leads/pages/campaigns/leads-campaigns.component.ts` | 24 |
| `leads/pages/suppression/leads-suppression.component.ts` | 21 |
| `customers/customers.component.ts` | 43 |
| `customers/pages/contacts/customer-contacts.component.ts` | 18 |
| `customers/pages/segments/customer-segments.component.ts` | 22 |
| `customers/pages/import/customer-import.component.ts` | 23 |
| `vendors/vendors.component.ts` | 34 |
| `parts/parts.component.ts` | 54 |
| `inventory/inventory.component.ts` | 49 |
| `lots/lots.component.ts` | 24 |

---

### PageLayoutComponent (`shared/components/page-layout`)

| consumer file | line |
|---------------|------|
| `leads/pages/samples/leads-samples.component.ts` | 39 |
| `leads/pages/accounts/leads-accounts.component.ts` | 39 |
| `customers/pages/portal-access/customer-portal-access.component.ts` | 36 |

---

### DialogComponent (`shared/components/dialog`)

| consumer file | line |
|---------------|------|
| `leads/leads.component.ts` | 49 |
| `customers/customers.component.ts` | 43 |
| `customers/components/customer-detail-dialog/customer-detail-dialog.component.ts` | 43 |
| `customers/components/new-customer-fork-dialog/lead-picker-dialog.component.ts` | 23 |
| `customers/components/credit-status-card/credit-status-card.component.ts` | 18 |
| `parts/parts.component.ts` | 54 |
| `parts/workflow/part-bom-step/part-bom-step.component.ts` | 57 |
| `inventory/inventory.component.ts` | 49 |

---

### EntityPickerComponent (`shared/components/entity-picker`)

| consumer file | line |
|---------------|------|
| `lots/components/lot-dialog/lot-dialog.component.ts` | 27 |
| `vendors/components/guided-vendor-dialog/guided-vendor-dialog.component.ts` | 72 |
| `customers/components/price-list-entries-cluster/price-list-entry-form-dialog.component.ts` | 47 |
| `parts/parts.component.ts` | 57 |
| `parts/workflow/part-bom-step/part-bom-step.component.ts` | 57 |
| `parts/workflow/part-sourcing-step/part-sourcing-step.component.ts` | 29 |
| `parts/workflow/part-source-part-step/part-source-part-step.component.ts` | 25 |
| `parts/workflow/part-tool-asset-step/part-tool-asset-step.component.ts` | 28 |
| `parts/workflow/part-vendor-step/part-vendor-step.component.ts` | 29 |
| `parts/workflow/part-inventory-step/part-inventory-step.component.ts` | 28 |
| `parts/components/vendor-sources-panel/vendor-sources-panel.component.ts` | 134 |
| `parts/components/part-detail-panel/part-detail-panel.component.ts` | 90 |
| `parts/components/vendor-parts-cluster/vendor-part-form-dialog.component.ts` | 49 |
| `parts/components/part-clusters/part-quality-cluster/part-quality-cluster.component.ts` | 33 |
| `parts/components/part-alternates-tab/part-alternates-tab.component.ts` | 39 |
| `parts/components/operation-dialog/operation-dialog.component.ts` | 45 |

---

### EmptyStateComponent (`shared/components/empty-state`)

| consumer file | line |
|---------------|------|
| `leads/pages/intake/leads-intake.component.ts` | 49 |
| `leads/pages/queue/leads-queue.component.ts` | 49 |
| `customers/components/price-list-entries-cluster/price-list-entries-table.component.ts` | 41 |
| `customers/pages/customer-detail/tabs/customer-pricing-tab.component.ts` | 46 |
| `vendors/components/vendor-scorecard-tab/vendor-scorecard-tab.component.ts` | 15 |
| `vendors/components/vendor-detail-panel/vendor-detail-panel.component.ts` | 42 |
| `inventory/inventory.component.ts` | 49 |
| `inventory/components/uom-management/uom-management.component.ts` | 27 |
| `inventory/components/receiving-inspection-queue/receiving-inspection-queue.component.ts` | 15 |

---

### LoadingBlockDirective (`shared/directives/loading-block`) — the loading-state primitive

> Note: `shared/components/loading-overlay` directory exists but the primary loading pattern
> used in master-data features is `LoadingBlockDirective` from `shared/directives/`. No
> `LoadingOverlayComponent` import was found in any master-data feature file.

| consumer file | line |
|---------------|------|
| `customers/customers.component.ts` | 46 |
| `customers/pages/portal-access/customer-portal-access.component.ts` | 38 |
| `customers/pages/contacts/customer-contacts.component.ts` | 19 |
| `customers/components/price-list-entries-cluster/price-list-entries-table.component.ts` | 41 |
| `customers/components/customer-detail-dialog/customer-detail-dialog.component.ts` | 43 |
| `customers/components/customer-clusters/customer-interactions-cluster.component.ts` | 52 |
| `customers/components/credit-status-card/credit-status-card.component.ts` | 18 |
| `vendors/vendors.component.ts` | 36 |
| `vendors/components/vendor-scorecard-tab/vendor-scorecard-tab.component.ts` | 15 |
| `vendors/components/vendor-detail-panel/vendor-detail-panel.component.ts` | 42 |
| `parts/workflow/part-vendor-step/part-vendor-step.component.ts` | 29 |
| `parts/workflow/part-tool-asset-step/part-tool-asset-step.component.ts` | 28 |
| `parts/workflow/part-sourcing-step/part-sourcing-step.component.ts` | 29 |
| `parts/workflow/part-source-part-step/part-source-part-step.component.ts` | 25 |
| `parts/workflow/part-inventory-step/part-inventory-step.component.ts` | 28 |
| `parts/components/part-detail-panel/part-detail-panel.component.ts` | 90 |
| `parts/components/part-clusters/part-landed-cost.component.ts` | 30 |
| `inventory/inventory.component.ts` | 49 |
| `inventory/components/uom-management/uom-management.component.ts` | 27 |
| `inventory/components/receiving-inspection-queue/receiving-inspection-queue.component.ts` | 15 |
| `lots/components/lot-detail-panel/lot-detail-panel.component.ts` | 16 |

---

### EntityLinkComponent (`shared/components/entity-link`)

| consumer file | line |
|---------------|------|
| `parts/components/part-clusters/part-landed-cost.component.ts` | 30 |
| `parts/components/part-detail-panel/part-detail-panel.component.ts` | 90 |

---

### EntityActivitySectionComponent (`shared/components/entity-activity-section`)

| consumer file | line |
|---------------|------|
| `leads/components/lead-detail-panel/lead-detail-panel.component.ts` | 30 |
| `customers/components/customer-clusters/customer-activity-cluster.component.ts` | 13 |
| `vendors/components/vendor-detail-panel/vendor-detail-panel.component.ts` | 43 |
| `parts/components/part-clusters/part-activity-cluster.component.ts` | 13 |
| `lots/components/lot-detail-panel/lot-detail-panel.component.ts` | 16 |

---

### WorkflowComponent (`shared/components/workflow`)

| consumer file | line |
|---------------|------|
| `parts/workflow/part-workflow-page/part-workflow-page.component.ts` | 31 |

---

### AddressFormComponent (`shared/components/address-form`)

| consumer file | line |
|---------------|------|
| `leads/components/lead-convert-dialog/lead-convert-dialog.component.ts` | 49 |
| `customers/components/guided-customer-dialog/guided-customer-dialog.component.ts` | 51 |
| `vendors/components/vendor-dialog/vendor-dialog.component.ts` | 27 |
| `vendors/components/guided-vendor-dialog/guided-vendor-dialog.component.ts` | 72 |

---

### FileUploadZoneComponent (`shared/components/file-upload-zone`)

| consumer file | line |
|---------------|------|
| `parts/components/operation-dialog/operation-dialog.component.ts` | 45 |
| `parts/components/part-clusters/part-files-cluster.component.ts` | 17 |

---

### EntityCompletenessBadgeComponent + EntityCompletenessChipComponent

| consumer file | badge | chip | line |
|---------------|-------|------|------|
| `customers/customers.component.ts` | ✅ | ✅ | 47 |
| `customers/pages/customer-detail/customer-detail.component.ts` | — | ✅ | 68 |
| `vendors/vendors.component.ts` | ✅ | ✅ | 37 |
| `vendors/components/vendor-detail-panel/vendor-detail-panel.component.ts` | — | ✅ | 45 |
| `parts/parts.component.ts` | ✅ | ✅ | 60 |
| `parts/components/part-detail-panel/part-detail-panel.component.ts` | — | ✅ | 100 |

> Pattern: badge appears on the list page rows; chip appears in the detail panel header.

---

## Open Items / Queue (to be resolved by scout or next cataloger cycle)

> Items placed here until closed. Scout appends findings to `master-data-queue.md`.

1. **All "states" fields** — every entry above has `_queue_` for states. Scout must drive the live app, confirm empty/loading/populated/error per component, and update entries or add queue items.
2. **Customer detail contacts/addresses/interactions tabs** — need live confirmation that these tabs mount cluster components (not separate tab components); verify resolver gating per role.
3. **CustomerDetailTabId — `contacts` and `addresses`** — the resolver test mentions them, but no `*-contacts-tab.component.ts` or `*-addresses-tab.component.ts` exists in `pages/customer-detail/tabs/`. Cross-check source to confirm clusters are mounted directly in the shell template.
4. **Parts workflow step ordering** — the 13 steps listed are from file names; actual step order is driven by `providePartWorkflowSteps()`. Scout to confirm step sequence live.
5. **Inventory stockOps tab** — source shows `adjustForm` + `transferForm` signals; whether these render as inline forms or dialogs needs live confirmation.
6. **`/inventory/locations`** — source mentions a locations tab but no dedicated locations component was found. Confirm it's in-component or a missing file.
7. **VendorScorecardTabComponent context** — confirm it is mounted within `VendorDetailDialogComponent` or `VendorDetailPanelComponent` (need template read).
8. **Shared components — usages** — for each shared cmp in the checklist, grep usages in master-data features to fill the `renders-for` and `route` fields.
9. **Role-gating accuracy** — renders-for values above come from `app.routes.ts` top-level guards; sub-surface capability gates may differ. Scout to flag mismatches.
10. **`parts.component.ts` path** — explorer reports it at `features/parts/parts.component.ts:48`; verify a `PartsComponent` class exists (not a guard or model file named similarly).

11. **Two additional parts workflow step files found via EntityPickerComponent grep — NOT in original checklist:**
    - `features/parts/workflow/part-vendor-step/part-vendor-step.component.ts` — distinct from `part-sourcing-step`; add to checklist + get entry
    - `features/parts/workflow/part-inventory-step/part-inventory-step.component.ts` — distinct from `part-inventory-cluster`; add to checklist + get entry
    These must be inventoried before parts workflow reconciliation can be called complete.

12. **`shared/components/loading-overlay` vs `LoadingBlockDirective`** — the checklist item was `loading-overlay` but no master-data feature imports that component class. The actual loading primitive used throughout is `LoadingBlockDirective` (from `shared/directives/`). Confirm whether `LoadingOverlayComponent` exists and is used anywhere in master-data, or if the checklist item should be retired.

13. **`shared/components/detail-side-panel` and `shared/components/slideout`** — no master-data import found. Panels in leads/vendors/lots are feature-specific components. Confirm these shared components are intentionally not used in master-data (they may be used in other regions like sales-orders/kanban).

---

_Cycle 1: seed. Cycle 2: shared-cmp reconciliation complete (18 items resolved). Cycle 2b: pre-source-location complete — all areas with file:line + sub-surface tables; 2 new vendor-parts-cluster discoveries added. Cycle 3: states from scout sweep C1 folded into per-component entries; remaining open states recorded in Open Items block below. Cycle 4 (source-cataloger, 2026-05-22): 72 new checklist ticks (32 routes + 40 feature-dir); all 6 unreached inventory tabs confirmed; 8 dialogs observed (create state); lead/vendor/customer detail panels/pages observed with populated states; all missing line numbers filled. Count at C4 close: 90/163. C4c (2026-05-22): LeadConvertDialogComponent 3-step wizard confirmed; customer estimates/quotes/addresses tabs empty states confirmed. C4f/C4g (2026-05-22): parts workflow fully unlocked — 18 new checklist ticks (part-workflow-page + /parts/:id route + 16 step/form components); all 13+ workflow step components confirmed in `create` mode via 8 workflow runs; express + guided modes both observed. Count: 109/163 reconciled. Remaining 54: parts component-level items (panels, dialogs, clusters ~29), missing customer tabs (5), lot detail (2), lead dialogs (3), vendor dialogs (3), receiving inspection (1), callback scheduler (1), credit-status-card (1), guided dialogs (4), vendor-quick-create (1), pricing cluster (4)._

---

## Scout Live Sweep — Cycle 1 (2026-05-22) — FOLDED

> Raw data folded into per-component `states` fields above. Artifacts on disk:
> - Screenshots: `analysis/inventory/screenshots/<route-id>.png`
> - Raw log: `analysis/inventory/sweep-log.json`
>
> **Sweep context:** Agent ui-scout · Playwright headless Chromium · admin@forge.local · non-seeded stack.
> All list pages = empty state. Profile redirect bypassed via direct `/dashboard` nav.
> Onboarding banner visible on every authenticated page ("Complete your employee profile — 3 sections remaining").
>
> **Confirmed live (20 routes):** `/leads`, `/leads/intake`, `/leads/queue`, `/leads/campaigns`, `/leads/suppression`, `/leads/samples`, `/leads/accounts`, `/customers`, `/customers/contacts`, `/customers/portal-access`, `/customers/segments`, `/customers/import`, `/vendors`, `/parts`, `/parts/new`, `/inventory/stock`, `/inventory/receiving`, `/inventory/locations`, `/lots`.
> **Invalid tab probe:** `/inventory/transfers` and `/inventory/adjustments` both redirected to `/inventory/stock` — those are in-component dialog names, not tab slugs.

---

## Reconciliation Status — source-cataloger C6 (2026-05-22)

> **Checklist: COMPLETE** — all [ ] items ticked. All schema rows are source-confirmed.
> Live observation gaps noted below are factual stack limitations, not inventory gaps.

### Queue closure summary

| queue | status | notes |
|-------|--------|-------|
| Q1 Inventory tabs | ✅ CLOSED C5 | All 6 tabs confirmed live |
| Q2 Customer detail tabs | ✅ SOURCE-CONFIRMED C6 | 6/11 live C5; 5 lifecycle/capability-gated (source-confirmed) |
| Q3 Dialogs | ✅ SOURCE-CONFIRMED C6 | All source-confirmed; live observation gaps noted per entry |
| Q4 Parts detail/workflow | ✅ SOURCE-CONFIRMED C6 | All 13 workflow steps confirmed C4f/C4g; cluster components source-confirmed C6 |
| Q5 Role sweeps | ✅ CLOSED C5 | All 5 roles × 18 routes; renders-for updated |
| Q6 Populated states | partial | Leads/customers/vendors seeded+observed; parts Draft-blocked; 0 lots; 0 receiving |

### Residual live-observation gaps (stack limitations — not inventory gaps)

These items have source-confirmed schema entries; live observation was blocked by stack configuration:

- **Capability-gated**: `CustomerInteractionsClusterComponent` (CAP-MD-CUSTOMER-INTERACTIONS), `CreditStatusCardComponent` (CAP-O2C-CREDIT-LIMITS), `PartQualityClusterComponent` compliance fields (CAP-MD-PART-COMPLIANCE)
- **Lifecycle-gated tabs**: customer orders/jobs/invoices (orders module not enabled), customer pricing (URL redirects to overview)
- **Needs seeded Active part**: All part cluster components, `PartDetailPanelComponent`, `PartDetailDialogComponent`, `BomTreeComponent`, `BomRevisionHistoryComponent`, `RoutingComponent`, `RoutingFlowViewComponent`, `OperationDialogComponent`, `SerialNumbersTabComponent`, `VendorSourcesPanelComponent`, `PartAlternatesTabComponent`, `PartsCardGridComponent` (populated state)
- **Needs seeded lot**: `LotDetailPanelComponent`, `LotDetailDialogComponent`
- **Needs receiving event**: `ReceivingInspectionQueueComponent`
- **Needs queue-state lead**: `CallbackSchedulerDialogComponent`
- **Trigger not available from list**: `GuidedCustomerDialogComponent` (fork guided tile), `GuidedVendorDialogComponent` (fork guided path), `CustomerDetailDialogComponent` (?detail= URL or EntityLink), `VendorQuickCreateDialogComponent` (EntityPicker inline-create), `VendorPartBulkImportDialogComponent` (Catalog IMPORT CSV button seen but not clicked)
- **Error states**: Not triggered on any component (no API error simulation performed)
- **Populated states not observed**: inventory stock, lots list, parts list (0 items of each on stack)
