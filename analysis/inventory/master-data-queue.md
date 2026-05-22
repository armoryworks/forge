# Master-Data — Scout Queue

> Filed by: ui-scout cycle 1 · 2026-05-22  
> Dequeue: open each item, observe live, update `master-data.md` entries, tick off.  
> All items below are surfaces the cycle-1 sweep could NOT fully reach.

---

## Q1 — Inventory unvisited tabs (6 tabs)

**Why unreached:** Tab names discovered from source only after sweep completed. `/inventory/transfers` and `/inventory/adjustments` probed are invalid names; they redirected to stock.

| queue-id | URL | source tab name | notes |
|----------|-----|-----------------|-------|
| Q1-a | `/inventory/movements` | `movements` | Bin-movement history |
| Q1-b | `/inventory/stockOps` | `stockOps` | Stock adjustments + transfers (inline forms) |
| Q1-c | `/inventory/cycleCounts` | `cycleCounts` | Cycle-count list and create |
| Q1-d | `/inventory/reservations` | `reservations` | Active inventory reservations |
| Q1-e | `/inventory/replenishment` | `replenishment` | Reorder suggestions |
| Q1-f | `/inventory/uom` | `uom` | UOM management (embeds UomManagementComponent) |

**What to capture:** navigate → screenshot → table headers, buttons, empty/loading states, forms if inline.

---

## Q2 — Customer detail tabs (needs a seeded customer record)

**Why unreached:** `/customers/:id/:tab` requires at least one customer to exist. Stack is non-seeded.

| queue-id | URL pattern | tab | component | notes |
|----------|-------------|-----|-----------|-------|
| Q2-a | `/customers/:id/overview` | overview | `CustomerOverviewTabComponent` | Summary panel |
| Q2-b | `/customers/:id/contacts` | contacts | `CustomerContactsClusterComponent` | Confirm cluster-only (no separate tab cmp) |
| Q2-c | `/customers/:id/addresses` | addresses | `CustomerAddressesClusterComponent` | Confirm cluster-only |
| Q2-d | `/customers/:id/estimates` | estimates | `CustomerEstimatesTabComponent` | Cross-link to quotes/estimates |
| Q2-e | `/customers/:id/quotes` | quotes | `CustomerQuotesTabComponent` | |
| Q2-f | `/customers/:id/orders` | orders | `CustomerOrdersTabComponent` | |
| Q2-g | `/customers/:id/jobs` | jobs | `CustomerJobsTabComponent` | |
| Q2-h | `/customers/:id/invoices` | invoices | `CustomerInvoicesTabComponent` | |
| Q2-i | `/customers/:id/pricing` | pricing | `CustomerPricingTabComponent` + `PriceListEntriesTableComponent` | Price-list cluster |
| Q2-j | `/customers/:id/interactions` | interactions | `CustomerInteractionsClusterComponent` | Confirm cluster-only |
| Q2-k | `/customers/:id/activity` | activity | `CustomerActivityTabComponent` + `CustomerActivityClusterComponent` | |

**Pre-requisite:** `POST /api/v1/customers` or UI create flow. Suggest creating via "NEW CUSTOMER" button to also capture `NewCustomerForkDialogComponent` / `GuidedCustomerDialogComponent`.

---

## Q3 — All create/edit dialogs (need triggering + populated state)

Stack is empty; all "NEW X" buttons lead to dialogs that open but may not show populated state without data. Each needs:  
(a) open dialog → screenshot empty/create state  
(b) if edit dialog: seed a record first, open from row

| queue-id | dialog | trigger | notes |
|----------|--------|---------|-------|
| Q3-a | `NewLeadForkDialogComponent` | Leads list → any "New Lead" action | 2-step: shape picker → form |
| Q3-b | `LeadDetailDialogComponent` / `LeadDetailPanelComponent` | Click a lead row | Needs seeded lead |
| Q3-c | `LeadConvertDialogComponent` | Lead detail → Convert | Needs seeded lead |
| Q3-d | `AccountDialogComponent` | Leads/accounts → NEW ACCOUNT | Open without seed |
| Q3-e | `CampaignDialogComponent` | Leads/campaigns → NEW CAMPAIGN | Open without seed |
| Q3-f | `CallbackSchedulerDialogComponent` | Leads/queue → callback action | Needs lead in queue |
| Q3-g | `NewCustomerForkDialogComponent` | Customers → NEW CUSTOMER | Open without seed |
| Q3-h | `GuidedCustomerDialogComponent` | Within fork dialog | Step 2 of fork |
| Q3-i | `LeadPickerDialogComponent` | Within customer fork → convert-from-lead path | Needs seeded lead |
| Q3-j | `ProvisionPortalAccessDialogComponent` | Customers/portal-access → PROVISION ACCESS | Open; may need seeded customer |
| Q3-k | `NewVendorForkDialogComponent` | Vendors → NEW VENDOR | Open without seed |
| Q3-l | `VendorDialogComponent` | Within vendor fork | Quick path |
| Q3-m | `GuidedVendorDialogComponent` | Within vendor fork | Guided path |
| Q3-n | `VendorDetailDialogComponent` / `VendorDetailPanelComponent` | Click vendor row | Needs seeded vendor; confirm VendorScorecardTabComponent is within |
| Q3-o | `NewPartForkDialogComponent` | Parts → any create trigger | Open without seed |
| Q3-p | Part workflow steps (all 13) | `/parts/new` → advance through steps | Needs navigating each step live |
| Q3-q | `LotDialogComponent` | Lots → create action | Open without seed |
| Q3-r | `LotDetailDialogComponent` / `LotDetailPanelComponent` | Click lot row | Needs seeded lot |

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

## Q5 — Role-gated sweeps

**Why unreached:** Only admin@forge.local used this cycle. Role differences may gate components.

| queue-id | role | surfaces to verify |
|----------|------|--------------------|
| Q5-a | engineer@forge.local | Parts workflow, inventory, lots — confirm same surfaces visible |
| Q5-b | pm@forge.local | Leads, customers, quotes — confirm PM sees same as Manager |
| Q5-c | worker@forge.local | Expect restricted — confirm no access to master-data or read-only |
| Q5-d | manager@forge.local | Full sweep to confirm manager matches admin for master-data |
| Q5-e | officemanager@forge.local | Customers (all tabs?), vendors, portal-access — confirm OfficeManager scope |

**Note:** Source-cataloger seeded `renders-for` values from `app.routes.ts` guards. Sub-surface capability gates may differ — scout to flag mismatches.

---

## Q6 — Populated states (need seeded records)

| queue-id | entity | what to seed | populated state targets |
|----------|--------|--------------|------------------------|
| Q6-a | Lead | 1 lead (any shape) | Leads list table, detail panel, detail dialog |
| Q6-b | Customer | 1 customer | Customers list, customer detail all tabs |
| Q6-c | Vendor | 1 vendor | Vendors list, vendor detail panel/dialog, scorecard tab |
| Q6-d | Part | 1 part (Make type) | Parts list, part workflow all steps, BOM step, part clusters |
| Q6-e | Part + BOM | Part with 1+ BOM child | BOM tree, BOM revision history |
| Q6-f | Inventory | 1 part with stock | Inventory stock tab populated |
| Q6-g | Lot | 1 lot | Lots list populated, lot detail |
| Q6-h | Receiving | 1 PO + receive | Inventory receiving tab populated, inspection queue |

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

| id | question | source location |
|----|----------|----------------|
| OQ1 | Do `contacts` and `addresses` tabs in customer detail use cluster components directly (no separate tab .ts)? | `pages/customer-detail/` — no `*-contacts-tab.ts` found |
| OQ2 | What is the exact step order in the parts workflow? `providePartWorkflowSteps()` drives it. | `features/parts/workflow/register-part-workflow-steps.ts` |
| OQ3 | Does `VendorScorecardTabComponent` mount inside VendorDetailPanel or VendorDetailDialog or both? | `features/vendors/components/vendor-detail-*/` templates |
| OQ4 | Is `PartVendorPartsStepComponent` (`workflow/part-vendor-parts-step/`) the same as the `vendor-parts-cluster` components, or separate? | Compare workflow step vs cluster |
| OQ5 | What does the lots empty state look like? DataTable rendered with zero rows but no keyword matched in body text. | Observe live with populated + empty |

---

_Queue filed: 2026-05-22 · ui-scout cycle 1. Assign Q1 (inventory tabs) and Q3 (dialogs) as highest priority — reachable without new seeds. Q2/Q4/Q6 require seeding first._
