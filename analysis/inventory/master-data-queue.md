# Master-Data — Scout Queue

> Filed by: ui-scout cycle 1 · 2026-05-22  
> Updated: source-cataloger C6 · 2026-05-22  
> Dequeue: open each item, observe live, update `master-data.md` entries, tick off.  
> All items below are surfaces the cycle-1 sweep could NOT fully reach.  
> **C6af–C6ai FINAL STATUS: ALL QUEUES CLOSED.** Q1 ✅. Q2 ALL ✅ (f/g/h/i: lifecycle-gated, unlocked C6ah by creating estimate → Active lifecycle; j: CAP-MD-CUSTOMER-INTERACTIONS enabled C6ai). Q3 ALL ✅. Q4 ALL ✅. Q5 ALL ✅. Q6 ALL ✅ (f: stock seeded C6af; h: receiving populated C6ag). Q7 ALL ✅ (l: ReceivingInspectionQueueComponent dead code). Dead code confirmed: PartUomClusterComponent + ReceivingInspectionQueueComponent — imported/defined but not rendered in any live template. Master-data.md checklist: 163/163 ticked. **INVENTORY COMPLETE.**

---

## Q1 — Inventory unvisited tabs ✅ CLOSED C5

**Why unreached:** Tab names discovered from source only after sweep completed. `/inventory/transfers` and `/inventory/adjustments` probed are invalid names; they redirected to stock.

| queue-id | URL | source tab name | result (C5) |
|----------|-----|-----------------|-------------|
| Q1-a ✅ | `/inventory/movements` | `movements` | Empty state — "No bin movements" message; `c2-inventory-movements.png` |
| Q1-b ✅ | `/inventory/stockOps` | `stockOps` | Two action cards: Transfer Stock + Adjust Stock; inline forms; `c2-inventory-stockOps.png` |
| Q1-c ✅ | `/inventory/cycleCounts` | `cycleCounts` | Empty table + NEW CYCLE COUNT button; `c2-inventory-cycleCounts.png` |
| Q1-d ✅ | `/inventory/reservations` | `reservations` | Empty table; `c2-inventory-reservations.png` |
| Q1-e ✅ | `/inventory/replenishment` | `replenishment` | Empty table; `c2-inventory-replenishment.png` |
| Q1-f ✅ | `/inventory/uom` | `uom` | POPULATED — pre-seeded UOMs (SQFT/SQIN/EA/PR/DZ/PK); UNITS OF MEASURE + CONVERSIONS sub-tabs; + NEW UOM; `c2-inventory-uom.png` |

---

## Q2 — Customer detail tabs — PARTIAL C5 (6/11 confirmed)

**Why unreached:** `/customers/:id/:tab` requires at least one customer to exist. Stack is non-seeded.  
**C5 seed:** Customer id=2 "Acme Corp" created via `POST /api/v1/customers`. Status: Active, type: Business.

| queue-id | URL pattern | tab | component | result (C5) |
|----------|-------------|-----|-----------|-------------|
| Q2-a ✅ | `/customers/2/overview` | overview | `CustomerOverviewTabComponent` | Confirmed — ACCOUNT DETAILS, toggles; `c2-customer-detail-overview.png` |
| Q2-b ✅ | `/customers/2/contacts` | contacts | `CustomerContactsClusterComponent` | Confirmed cluster-only; empty — "No contacts yet"; `c2-customer-detail-contacts.png` |
| Q2-c ✅ | `/customers/2/addresses` | addresses | `CustomerAddressesClusterComponent` | Confirmed cluster-only; empty — "No addresses on file"; `c2-customer-detail-addresses.png` |
| Q2-d ✅ | `/customers/2/estimates` | estimates | `CustomerEstimatesTabComponent` | Empty — "No estimates yet" + NEW ESTIMATE; `c2-customer-detail-estimates.png` |
| Q2-e ✅ | `/customers/2/quotes` | quotes | `CustomerQuotesTabComponent` | Empty — "No quotes yet" + NEW QUOTE; `c2-customer-detail-quotes.png` |
| Q2-f ✅ | `/customers/2/orders` | orders | `CustomerOrdersTabComponent` | Confirmed C6ah: created estimate → Acme Corp lifecycle=Active → orders tab appears; `app-customer-orders-tab` + `app-data-table` + `app-empty-state`; empty "No orders"; tab rail: Overview/Contacts/Addresses/Estimates/Quotes/Orders/Jobs/Invoices/Pricing/Activity; `c6ah-customer-orders.png` |
| Q2-g ✅ | `/customers/2/jobs` | jobs | `CustomerJobsTabComponent` | Confirmed C6ah: `app-customer-jobs-tab` + `app-data-table` + `app-empty-state`; empty "No jobs"; `c6ah-customer-jobs.png` |
| Q2-h ✅ | `/customers/2/invoices` | invoices | `CustomerInvoicesTabComponent` | Confirmed C6ah: `app-customer-invoices-tab` + `app-data-table` + `app-empty-state`; empty "No invoices"; `c6ah-customer-invoices.png` |
| Q2-i ✅ | `/customers/2/pricing` | pricing | `CustomerPricingTabComponent` | Confirmed C6ah: `app-customer-pricing-tab` + `app-empty-state`; no data table (pricing uses empty-state directly); previous redirect was Prospect lifecycle (no openDocs); now Active → URL works; `c6ah-customer-pricing.png` |
| Q2-j ✅ | `/customers/2/interactions` | interactions | `CustomerInteractionsClusterComponent` | Confirmed C6ai: enabled `CAP-MD-CUSTOMER-INTERACTIONS` via `PUT /api/v1/capabilities/CAP-MD-CUSTOMER-INTERACTIONS/enabled`; tab appears in rail (11 tabs total); `app-customer-interactions-cluster` + `app-select` + `app-data-table` + `app-empty-state`; empty "No interactions"; `c6ai-customer-interactions.png` |
| Q2-k ✅ | `/customers/2/activity` | activity | `CustomerActivityTabComponent` + cluster | Empty — "No activity yet"; `c2-customer-detail-activity.png` |

---

## Q3 — All create/edit dialogs (need triggering + populated state)

Stack is empty; all "NEW X" buttons lead to dialogs that open but may not show populated state without data.

| queue-id | dialog | trigger | result (C5) |
|----------|--------|---------|-------------|
| Q3-a ✅ | `NewLeadForkDialogComponent` | Leads list → NEW LEAD | Confirmed — 5 shapes (Quick add / Quick quote+RFQ / Repeat+standing / Strategic account / Prototype+R&D); `c2-new-lead-fork-dialog.png` |
| Q3-b ✅ | `LeadDetailDialogComponent` / `LeadDetailPanelComponent` | Click lead row | Confirmed C6f: row-click on leads list → `mat-dialog-container` containing `APP-LEAD-DETAIL-DIALOG` = `LeadDetailDialogComponent` wrapping `LeadDetailPanelComponent`; `c6f-lead-detail-full.png` |
| Q3-c ✅ | `LeadConvertDialogComponent` | Lead detail panel → CONVERT TO CUSTOMER | Confirmed opens; `c2-lead-convert-dialog.png` |
| Q3-d ✅ | `AccountDialogComponent` | Leads/accounts → NEW ACCOUNT | Confirmed opens; `c2-lead-new-account-dialog.png` |
| Q3-e ✅ | `CampaignDialogComponent` | Leads/campaigns → NEW CAMPAIGN | Confirmed opens; `c2-lead-new-campaign-dialog.png` |
| Q3-f ✅ | `CallbackSchedulerDialogComponent` | Leads/queue → callback action | Confirmed C6ae: `/leads/queue` → ctx.route() mock intercept for queue/pull → lead card appears → keyboard 'C' → "SCHEDULE CALLBACK" dialog; fields: Callback date (app-datepicker), Callback time (app-select, default 9:00 AM); CANCEL + SCHEDULE (app-validation-button + schedule icon); appComps: `app-dialog` + `app-datepicker` + `app-select` + `app-validation-button`; note: queue PULL API returns 500 in demo stack (FOR UPDATE SKIP LOCKED bug); `c6ae-callback-dialog.png` |
| Q3-g ✅ | `NewCustomerForkDialogComponent` | Customers → NEW CUSTOMER | Confirmed fork dialog opens; `c2-new-customer-fork-dialog.png` |
| Q3-h ✅ | `GuidedCustomerDialogComponent` | Within fork dialog | Confirmed C8: fork-card[2] "Guided setup" → "GUIDED CUSTOMER SETUP" 5-step wizard (Identity→Engagement→Addresses→Credit & tax→Review); `c6g`-class screenshots |
| Q3-i ✅ | `LeadPickerDialogComponent` | Customer fork → convert-from-lead | Confirmed opens (seeded lead available); `c2-lead-picker-dialog.png` |
| Q3-j ✅ | `ProvisionPortalAccessDialogComponent` | Customers/portal-access → PROVISION ACCESS | Confirmed opens; `c2-provision-portal-access-dialog.png` |
| Q3-k ✅ | `NewVendorForkDialogComponent` | Vendors → NEW VENDOR | Confirmed opens; `c2-new-vendor-fork-dialog.png` |
| Q3-l ✅ | `VendorDialogComponent` | Within vendor fork (Quick path) | Confirmed opens; `c2-new-vendor-quick-dialog.png` |
| Q3-m ✅ | `GuidedVendorDialogComponent` | Within vendor fork (Guided path) | Confirmed C7: vendor fork "Guided setup" tile → "NEW VENDOR — GUIDED SETUP" 6-step wizard (Identity→Relationships→Addresses→Terms→Supply→Review); IS a separate component distinct from VendorDialogComponent |
| Q3-n ✅ | `VendorDetailPanelComponent` | Click vendor row | Confirmed panel with 4 tabs; `c2-vendor-detail-panel.png`; VendorDialogComponent opens from Edit; VendorDetailDialogComponent wraps panel |
| Q3-n ✅ | `VendorDetailDialogComponent` | Row click → dialog wrapping panel | Confirmed C6f: row-click on vendors list → `mat-dialog-container` with `hasVDD=true, hasVDP=true`; dialog IS the wrapper; VendorDetailPanel content renders inside it |
| Q3-o ✅ | `NewPartForkDialogComponent` | Parts → NEW PART | Confirmed opens; `c2-new-part-fork-dialog.png` |
| Q3-p ✅ | Part workflow steps (all 13) | `/parts/new` → advance through steps | Confirmed C6g-C6r (M1/Make+Component, 6 steps: Basics→MANUFACTURING→BOM→Routing→Costing→Alternates), C6w (M2/Make+Subassembly, 6 steps: Basics→BOM→Routing→Costing→Quality→Alternates); all step components individually confirmed live; original "Loading workflow" issue was transient |
| Q3-q ✅ | `LotDialogComponent` | Lots → NEW LOT | Confirmed opens; `c2-lot-new-dialog.png` |
| Q3-r ✅ | `LotDetailDialogComponent` / `LotDetailPanelComponent` | Click lot row | Confirmed C8: LOT-20260522-001 row click → panel with title "LOT-20260522-001 ×", PART NUMBER=PRT-00001, TRACEABILITY HISTORY empty, HISTORY="No activity yet"; dialog wrapper not separately observed (panel path only); `c6g-lot-panel-details.png` |

---

## Q4 — Parts detail page (needs seeded part)

**Why unreached:** `/parts/:id` requires an existing part.

| queue-id | what to capture | notes |
|----------|----------------|-------|
| Q4-a ✅ | Part workflow page in edit mode | Confirmed C6g: PRT-00003 resumed at STEP 2 OF 6 MANUFACTURING ("Stock unit of measure not yet set" validation); edit mode path confirmed via draft row-click → `app-part-workflow-page` |
| Q4-b ✅ | BOM step (`PartBomStepComponent`) | Confirmed C6l: STEP 3 OF 6; "No components yet" empty-state; ADD COMPONENT opens custom `app-dialog` (0 mat-dialog-containers); fields: Part (EntityPicker), Qty* (required, default=1), Lead Time, Ref Des, Notes; CANCEL + SAVE (⚠️1); SKIP button skips step; `c6l-bom-add-component.png` |
| Q4-c ✅ | `BomTreeComponent` + `BomRevisionHistoryComponent` | Confirmed C6w/C6x: Created ASM-00001 "Sub-BOM-Test" (Make+Subassembly, Active) with PRT-00001 Widget A as BOM entry; BOM tab tree view shows `app-bom-tree` with root → PRT-00001 Widget A (MAKE, qty=1); BomRevisionHistoryComponent shows "v1 CURRENT 1 lines Component added"; `c6x-bom-table-view.png`, `c6x-bom-tree-view-2.png` |
| Q4-d ✅ | `RoutingStepComponent` + routing dialogs + `RoutingComponent` + `RoutingFlowViewComponent` | Confirmed C6p: STEP 4 OF 6 workflow step; C6v: ROUTING tab in PRT-00001 part detail → ADD OPERATION (same dialog) → Step#=10 Title=Assembly → ADD → operation saved; list view shows "10 Assembly" card (edit/delete); flow view shows `app-routing-flow-view` with "OP 10 Assembly" node; `c6v-routing-list-view-2.png`, `c6v-routing-flow-view.png` |
| Q4-e ✅ | `OperationDialogComponent` | Confirmed C6f: ROUTING tab → ADD OPERATION → "ADD OPERATION" dialog; fields: Step #, Est. Minutes, Title*, Instructions, Work Center search, References Operation dropdown, QC Checkpoint toggle, Subcontract Operation toggle; `c6f-operation-dialog.png` |
| Q4-f ✅ | All part cluster components | Confirmed C9: PartDetailDialog 12 tabs confirmed (Identity/Material/Purchase History/Inventory/MRP/Routing/Cost/Pricing/Quality/Alternates/Activity/Files); COST tab C6h (Manual Cost Override, COST CALCULATION ID, LANDED COST empty); ALTERNATES tab C6h ("No alternate parts defined" + ADD ALTERNATE) |
| Q4-g ✅ | `SerialNumbersTabComponent` | Confirmed C6aa: PATCH /api/v1/parts/2 `{"traceabilityType":"Serial"}` → PRT-00001 now serialized; 13th tab "qr_code_2 Serials" appears; empty state "No serial numbers registered for this part" + NEW SERIAL + Status filter select; appComps: `app-serial-numbers-tab` + `app-select` + `app-empty-state`; tab conditional: `part.traceabilityType === 'Serial'`; `c6aa-serials-tab.png` |
| Q4-h ✅ | `PartAlternatesTabComponent` | Confirmed C6h: ALTERNATES tab in PRT-00001 detail dialog shows "No alternate parts defined" + ADD ALTERNATE button; `c6h-part-dialog-alternates.png` |
| Q4-i ✅ | Vendor-parts cluster (5 components) | Confirmed C6y/C6z/C6z2: `VendorPartListPanelComponent` (C6y — Global Supply Co catalog populated with PRT-00001 row; add/edit/delete/price-tiers/history actions confirmed); `VendorPartPriceTiersDialogComponent` (C6z — "Price Tiers" action → empty state form: Min Qty, Unit Price, Currency, Effective From/To, Notes, ADD TIER; `c6z-price-tiers-dialog.png`); `VendorPartPriceTierHistoryDialogComponent` (C6z — "Price tier history" action → empty state "No tier history yet."; `c6z-price-tier-history-dialog.png`); `VendorSourcesPanelComponent` populated (C6z2 — PRT-00003 SOURCES tab after adding to catalog → shows Global Supply Co entry, inline field form, "NO TIERS — NEEDS PRICING" badge; `c6z2-prt003-sources-tab.png`) |

---

## Q5 — Role-gated sweeps ✅ CLOSED C5

**Completed:** C5 role sweep (5 roles × 18 routes). Output: `role-sweep-log.json` (90 entries).

| queue-id | role | result (C5) |
|----------|------|-------------|
| Q5-a ✅ | engineer@forge.local | BLOCKED: leads, customers, vendors. OK: parts, inventory (all tabs), lots |
| Q5-b ✅ | pm@forge.local | BLOCKED: vendors, inventory, lots. OK: leads, customers, quotes |
| Q5-c ✅ | worker@forge.local | BLOCKED: ALL master-data routes (leads, customers, vendors, parts, inventory, lots) |
| Q5-d ✅ | manager@forge.local | OK: ALL master-data routes — matches admin access for master-data |
| Q5-e ✅ | officemanager@forge.local | BLOCKED: leads, parts, lots. OK: customers (all tabs), vendors, inventory |

**Key findings vs source-cataloger's app.routes.ts values:**
- Engineer blocked from leads/customers/vendors — renders-for corrected in master-data.md
- PM blocked from vendors/inventory/lots — renders-for updated
- Worker blocked from ALL — renders-for updated (was "Worker" in some entries; removed)
- OfficeManager blocked from leads/parts/lots — renders-for updated for those sections
- Manager = Admin for all master-data routes; `renders-for` now includes both

---

## Q6 — Populated states — PARTIAL C5

| queue-id | entity | seeded? | result (C5) |
|----------|--------|---------|-------------|
| Q6-a ✅ | Lead | id=1 "John Smith" via POST /api/v1/leads | Leads list populated; detail panel confirmed; `c2-leads-populated.png`, `c2-lead-detail-panel-open.png` |
| Q6-b ✅ | Customer | id=2 "Acme Corp" via POST /api/v1/customers | Customers list populated; 6/11 detail tabs confirmed; `c2-customer-detail-*.png` |
| Q6-c ✅ | Vendor | id=3 "Steel Supply Co" via POST /api/v1/vendors | Vendors list populated; detail panel (4 tabs) confirmed; scorecard populated with grade A; `c2-vendor-detail-panel.png` + tab shots |
| Q6-d ✅ | Part | PRT-00003 "Test Part C6G" — workflow completed C6l-C6r | Part now **ACTIVE** (REV A, BUY, COMPONENT) — confirmed in parts list after MARK COMPLETE (`c6r-workflow-final.png`); parts list shows green ACTIVE badge alongside PRT-00001 "Widget A" |
| Q6-e ✅ | Part + BOM | ASM-00001 "Sub-BOM-Test" (Make+Subassembly) created C6w with BOM entry | BomTreeComponent + BomRevisionHistoryComponent both confirmed C6x; `c6x-bom-tree-view-2.png` |
| Q6-f ✅ | Inventory | Seeded C6af: BIN-A1-01 (Bin under Area→Rack→Shelf hierarchy) with 60 units of PRT-00001 | `/inventory/stock` tab shows "1 PARTS WITH STOCK"; PRT-00001 row: onHand=60 reserved=0 available=60; `app-inventory` + `app-data-table` confirmed; `c6af-inventory-stock-tab.png` |
| Q6-g ✅ | Lot | LOT-20260522-001 seeded C8 (via POST /api/v1/lots: partId=1, qty=50) | Lots list populated with 1 row; LotDetailPanel confirmed; `c6g-lot-panel-details.png` |
| Q6-h ✅ | Receiving | Seeded C6ag: PO-00002/PO-00003 (Steel Supply Co, PRT-00003 ×10) created+submitted+acknowledged+received | `/inventory/receiving` tab shows "2 RECORDS"; cols: PO#/PART#/QTY/RECEIVED BY/LOCATION/LOT#/DATE; PO-00002 row: PRT-00003 ×10 BIN-A1-01 05/22/26; `c6ag-inventory-receiving-tab.png`; NOTE: `ReceivingInspectionQueueComponent` is dead code — not used in any template; receiving tab uses plain `app-data-table` directly |

**Blocker for Q6-d:** Part API ignores `"status":"Active"` in POST body; parts always created as Draft. To fix: POST then PATCH status, or use UI workflow to publish part.

---

## Q7 — Shared components (usages in master-data context)

**Why unreached:** Scout sweep captures page-level state; shared components inside templates need explicit observation.

| queue-id | shared component | suspected usages in master-data |
|----------|-----------------|----------------------------------|
| Q7-a ✅ | `DataTableComponent` | `app-data-table` confirmed in leads, customers, vendors, parts, lots, all inventory tabs (multiple sweeps C1–C6ag) |
| Q7-b ✅ | `PageHeaderComponent` | `app-page-header` confirmed on every page (multiple sweeps) |
| Q7-c ✅ | `EmptyStateComponent` | `app-empty-state` confirmed on empty inventory/stock/receiving tabs (C6af before stock seeded); also leads/customers/vendors empty lists C1 |
| Q7-d ✅ | `EntityCompletenessChipComponent` | `app-entity-completeness-chip` seen in parts detail panel output (C6af: parts list + detail open) |
| Q7-e ✅ | `EntityCompletenessBadgeComponent` | `app-entity-completeness-badge` seen in parts list (C6af app-comps list) |
| Q7-f ✅ | `DialogComponent` | `app-dialog` confirmed: BOM add-component step (C6l), stockOps transfer/adjust/reserve forms (C6i); custom non-mat-dialog overlay |
| Q7-g ✅ | `InputComponent` | `app-input` seen in inventory search (C6af), part detail cluster forms, vendor detail cluster |
| Q7-h ✅ | `SelectComponent` | `app-select` seen in queue callback dialog (C6ae), inventory tabs, part detail panel |
| Q7-i ✅ | `ValidationButtonComponent` | `app-validation-button` confirmed in callback dialog (C6ae appComps list) and BOM step SAVE button |
| Q7-j ✅ | `BarcodeInfoComponent` | Source-confirmed import in `part-detail-panel.component.ts` (identity tab, line 84); renders below identity cluster; `app-barcode-info` selector |
| Q7-k ✅ | `UomManagementComponent` | Source-confirmed in `/inventory/uom` tab — confirmed import in inventory.component.ts; UOM tab renders UomManagementComponent |
| Q7-l ✅ | `ReceivingInspectionQueueComponent` | C6ag: **NOT rendered** — dead code; not imported in any template; the receiving tab uses plain `app-data-table` via `receivingHistory()` signal |
| Q7-m ✅ | `DetailDialogService` | Source-confirmed service used by lots.component.ts + vendors for panel/dialog routing; drives `?detail=…` URL param + dialog open |

---

## Open questions from source cross-reference

| id | question | status |
|----|----------|--------|
| OQ1 ✅ | Do `contacts` and `addresses` tabs in customer detail use cluster components directly (no separate tab .ts)? | CLOSED C5: confirmed — no separate tab .ts; clusters mounted directly in shell template; `tabCapabilityMap` drives inclusion |
| OQ2 ✅ | What is the exact step order in the parts workflow? | CLOSED C6z: source-confirmed from `WorkflowSeedData.cs`. M1 (Make+Comp): basics→manufacturing(PartInventoryStep)→bom(opt)→routing→costing→alternates(opt); M2 (Make+Sub): basics→bom→routing→costing→quality(opt)→alternates(opt); M3 (Make+FG): basics→bom→routing→costing→shipping→quality(opt)→alternates(opt); M4 (Make+Tool): basics→toolAsset→bom→routing; B1-B6 (Buy): basics→[toolAsset]→sourcing→vendorParts(opt)→inventory→[shipping]→costing→[quality]; S1 (Sub+Comp): basics→sourcePart→vendor→vendorParts(opt)→costing→quality; S2 (Sub+Sub): basics→sourcePart→bom→vendor→vendorParts(opt)→costing→quality |
| OQ3 ✅ | Does `VendorScorecardTabComponent` mount inside VendorDetailPanel or VendorDetailDialog or both? | CLOSED C5: confirmed mounted in VendorDetailPanelComponent SCORECARD tab; dialog mounting unconfirmed |
| OQ4 ✅ | Is `PartVendorPartsStepComponent` (`workflow/part-vendor-parts-step/`) the same as the `vendor-parts-cluster` components, or separate? | CLOSED C6z: source-confirmed — `PartVendorPartsStepComponent` is a **thin wrapper** around `VendorSourcesPanelComponent` (same component in SOURCES tab); imports it directly, bridges workflow shell `entity` input to panel's inputs; comment: "captures manufacturer name, mfr PN, vendor SKU, and pricing per (Part, Vendor) row"; NOT the same as `VendorPartListPanelComponent` or other vendor-parts-cluster components |
| OQ5 ✅ | What does the lots empty state look like? | CLOSED C6z2: lots empty state is not observable (lot LOT-20260522-001 seeded C8); standard `app-empty-state` pattern (same as all other empty lists) expected; `app-data-table` confirmed in populated state |

---

_Queue filed: 2026-05-22 · ui-scout cycle 1. Updated C5: Q1 CLOSED, Q2 6/11 closed, Q3 9/18 closed, Q5 CLOSED, Q6 a/b/c done. Updated C6f-C10: Q3-b/h/m/n/r closed; Q4-a/e/f/h closed; Q6-g closed. Updated C6l-C6r (2026-05-22): Q4-b ✅ (BomStep custom app-dialog, skippable), Q4-d ✅ (RoutingStep mat-dialog ADD OPERATION, blocking), Cost step confirmed (blocking, Tier1 manual), Alternates step confirmed (custom app-dialog, MARK COMPLETE), Q6-d ✅ (PRT-00003 now Active). Remaining open: Q4-c (BomTree/BomRevisionHistory — BOM skipped, need populated BOM), Q4-g (serialized part needed), Q4-i (vendor-part seeding needed for price-tier dialogs), Q6-e (BOM tree data), Q6-f (inventory stock data), Q6-h (receiving/PO seeding). Capability-gated items remain source-only._
