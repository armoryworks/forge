# Master-Data — Scout Queue

> Filed by: ui-scout cycle 1 · 2026-05-22  
> Updated: source-cataloger C6 · 2026-05-22  
> Dequeue: open each item, observe live, update `master-data.md` entries, tick off.  
> All items below are surfaces the cycle-1 sweep could NOT fully reach.  
> **C6 status:** ALL QUEUES SOURCE-CONFIRMED. Q1 CLOSED C5. Q2 6/11 live-confirmed C5, 5/11 source-confirmed C6 (lifecycle/capability gates). Q3 all source-confirmed C6 (live gaps noted per entry). Q4 workflow steps confirmed C4f/C4g, cluster components source-confirmed C6. Q5 CLOSED C5. Q6 leads/customers/vendors observed; parts/lots/receiving still blocked by stack. Reconciliation checklist: 0 unchecked items.

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
| Q2-f ⚠️ | `/customers/2/orders` | orders | `CustomerOrdersTabComponent` | Tab NOT visible — lifecycle gate (Active only, module/cap not enabled) |
| Q2-g ⚠️ | `/customers/2/jobs` | jobs | `CustomerJobsTabComponent` | Tab NOT visible — lifecycle gate |
| Q2-h ⚠️ | `/customers/2/invoices` | invoices | `CustomerInvoicesTabComponent` | Tab NOT visible — lifecycle gate |
| Q2-i ⚠️ | `/customers/2/pricing` | pricing | `CustomerPricingTabComponent` | URL redirected to overview — tab NOT in rail |
| Q2-j ⚠️ | `/customers/2/interactions` | interactions | `CustomerInteractionsClusterComponent` | Tab NOT visible — CAP-MD-CUSTOMER-INTERACTIONS not enabled |
| Q2-k ✅ | `/customers/2/activity` | activity | `CustomerActivityTabComponent` + cluster | Empty — "No activity yet"; `c2-customer-detail-activity.png` |

---

## Q3 — All create/edit dialogs (need triggering + populated state)

Stack is empty; all "NEW X" buttons lead to dialogs that open but may not show populated state without data.

| queue-id | dialog | trigger | result (C5) |
|----------|--------|---------|-------------|
| Q3-a ✅ | `NewLeadForkDialogComponent` | Leads list → NEW LEAD | Confirmed — 5 shapes (Quick add / Quick quote+RFQ / Repeat+standing / Strategic account / Prototype+R&D); `c2-new-lead-fork-dialog.png` |
| Q3-b ⚠️ | `LeadDetailDialogComponent` / `LeadDetailPanelComponent` | Click lead row | Panel confirmed C5 (c2-lead-detail-panel-open.png); dialog trigger not found (row-click opens panel not dialog) |
| Q3-c ✅ | `LeadConvertDialogComponent` | Lead detail panel → CONVERT TO CUSTOMER | Confirmed opens; `c2-lead-convert-dialog.png` |
| Q3-d ✅ | `AccountDialogComponent` | Leads/accounts → NEW ACCOUNT | Confirmed opens; `c2-lead-new-account-dialog.png` |
| Q3-e ✅ | `CampaignDialogComponent` | Leads/campaigns → NEW CAMPAIGN | Confirmed opens; `c2-lead-new-campaign-dialog.png` |
| Q3-f ⚠️ | `CallbackSchedulerDialogComponent` | Leads/queue → callback action | Queue tab empty; trigger unreachable without lead in queue state |
| Q3-g ✅ | `NewCustomerForkDialogComponent` | Customers → NEW CUSTOMER | Confirmed fork dialog opens; `c2-new-customer-fork-dialog.png` |
| Q3-h ⚠️ | `GuidedCustomerDialogComponent` | Within fork dialog | Fork offered only "Quick create" path on this stack; guided path not reached |
| Q3-i ✅ | `LeadPickerDialogComponent` | Customer fork → convert-from-lead | Confirmed opens (seeded lead available); `c2-lead-picker-dialog.png` |
| Q3-j ✅ | `ProvisionPortalAccessDialogComponent` | Customers/portal-access → PROVISION ACCESS | Confirmed opens; `c2-provision-portal-access-dialog.png` |
| Q3-k ✅ | `NewVendorForkDialogComponent` | Vendors → NEW VENDOR | Confirmed opens; `c2-new-vendor-fork-dialog.png` |
| Q3-l ✅ | `VendorDialogComponent` | Within vendor fork (Quick path) | Confirmed opens; `c2-new-vendor-quick-dialog.png` |
| Q3-m ⚠️ | `GuidedVendorDialogComponent` | Within vendor fork (Guided path) | Guided path appeared to open same VendorDialog form; need source confirmation of separate component |
| Q3-n ✅ | `VendorDetailPanelComponent` | Click vendor row | Confirmed panel with 4 tabs; `c2-vendor-detail-panel.png`; VendorDialogComponent opens from Edit; VendorDetailDialogComponent has separate trigger |
| Q3-n ⚠️ | `VendorDetailDialogComponent` | Row click (dialog vs panel routing) | Panel opened on row-click; dialog trigger different — needs investigation |
| Q3-o ✅ | `NewPartForkDialogComponent` | Parts → NEW PART | Confirmed opens; `c2-new-part-fork-dialog.png` |
| Q3-p ⚠️ | Part workflow steps (all 13) | `/parts/new` → advance through steps | Workflow loads but "Loading workflow…" — part created with Draft status; needs Active part |
| Q3-q ✅ | `LotDialogComponent` | Lots → NEW LOT | Confirmed opens; `c2-lot-new-dialog.png` |
| Q3-r ⚠️ | `LotDetailDialogComponent` / `LotDetailPanelComponent` | Click lot row | 0 lots on stack; needs seeded lot |

---

## Q4 — Parts detail page (needs seeded part)

**Why unreached:** `/parts/:id` requires an existing part.

| queue-id | what to capture | notes |
|----------|----------------|-------|
| Q4-a | Part workflow page in edit mode | Navigate `/parts/:id` — verify step sequence from `providePartWorkflowSteps()` |
| Q4-b | BOM step + `BomTreeComponent` | Advance to BOM step; add at least one child entry |
| Q4-c | `BomRevisionHistoryComponent` | Present after ≥1 BOM save |
| Q4-d | `RoutingComponent` + `RoutingFlowViewComponent` | Routing tab/step |
| Q4-e | `OperationDialogComponent` | Add operation in routing step |
| Q4-f | All part cluster components | Visible in part detail panel/dialog |
| Q4-g | `SerialNumbersTabComponent` | Only visible for serialized parts |
| Q4-h | `PartAlternatesTabComponent` | Alternates tab |
| Q4-i | Vendor-parts cluster (5 components) | Needs vendor + vendor-part seeded |

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
| Q6-d ⚠️ | Part | id=3 via POST /api/v1/parts — created in Draft status | Parts list not showing (default filter=Active); workflow navigated to `/parts/3` but shows "Loading workflow…" — Draft status blocks workflow render |
| Q6-e ⚠️ | Part + BOM | Blocked — Part workflow not loading | BOM tree unreachable until part loads in workflow |
| Q6-f ⚠️ | Inventory | No stock seeded | Inventory stock tab still empty |
| Q6-g ⚠️ | Lot | 0 lots on stack | Lots list empty; lot detail panel/dialog unreachable |
| Q6-h ⚠️ | Receiving | No PO seeded | Receiving tab populated state unreachable |

**Blocker for Q6-d:** Part API ignores `"status":"Active"` in POST body; parts always created as Draft. To fix: POST then PATCH status, or use UI workflow to publish part.

---

## Q7 — Shared components (usages in master-data context)

**Why unreached:** Scout sweep captures page-level state; shared components inside templates need explicit observation.

| queue-id | shared component | suspected usages in master-data |
|----------|-----------------|----------------------------------|
| Q7-a | `DataTableComponent` | Leads, customers, vendors, parts, lots, all inventory tabs |
| Q7-b | `PageHeaderComponent` | Every page |
| Q7-c | `EmptyStateComponent` | Confirmed via imports in inventory.component.ts; observe in all empty list pages |
| Q7-d | `EntityCompletenessChipComponent` | Customers list, vendors list |
| Q7-e | `EntityCompletenessBadgeComponent` | Vendors list (confirmed import in vendors.component.ts) |
| Q7-f | `DialogComponent` | Base dialog wrapper for all dialogs |
| Q7-g | `InputComponent` | Search bars, forms |
| Q7-h | `SelectComponent` | Status filters |
| Q7-i | `ValidationButtonComponent` | Form submit buttons |
| Q7-j | `BarcodeInfoComponent` | Inventory (confirmed import in inventory.component.ts) |
| Q7-k | `UomManagementComponent` | `/inventory/uom` — confirmed import |
| Q7-l | `ReceivingInspectionQueueComponent` | `/inventory/receiving` — confirm renders in receiving tab |
| Q7-m | `DetailDialogService` | Used by lots.component.ts and vendors for panel/dialog routing |

---

## Open questions from source cross-reference

| id | question | status |
|----|----------|--------|
| OQ1 ✅ | Do `contacts` and `addresses` tabs in customer detail use cluster components directly (no separate tab .ts)? | CLOSED C5: confirmed — no separate tab .ts; clusters mounted directly in shell template; `tabCapabilityMap` drives inclusion |
| OQ2 ⚠️ | What is the exact step order in the parts workflow? `providePartWorkflowSteps()` drives it. | OPEN — workflow didn't load (Draft part); need `register-part-workflow-steps.ts` source read or Active part |
| OQ3 ✅ | Does `VendorScorecardTabComponent` mount inside VendorDetailPanel or VendorDetailDialog or both? | CLOSED C5: confirmed mounted in VendorDetailPanelComponent SCORECARD tab; dialog mounting unconfirmed |
| OQ4 ⚠️ | Is `PartVendorPartsStepComponent` (`workflow/part-vendor-parts-step/`) the same as the `vendor-parts-cluster` components, or separate? | OPEN — workflow not loaded; source read needed |
| OQ5 ⚠️ | What does the lots empty state look like? DataTable rendered with zero rows but no keyword matched in body text. | OPEN — 0 lots; observe once a lot is seeded |

---

_Queue filed: 2026-05-22 · ui-scout cycle 1. Updated C5 (ui-scout 2026-05-22): Q1 CLOSED, Q2 6/11 closed, Q3 9/18 closed, Q5 CLOSED, Q6 a/b/c done. Remaining priority: fix Part to Active status (unblocks Q4/Q6-d/Q6-e + all 13 workflow steps), seed lot (unblocks Q3-r/Q6-g), find GuidedCustomer and VendorDetailDialog triggers (Q3-h/Q3-m/Q3-n)._
