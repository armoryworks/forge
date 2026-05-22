# Master-Data Region — Component Inventory

> **Phase:** master-data · **Method:** observe-and-record (no code changes)
> **Single writer:** source-cataloger owns this file. Scout writes queue only.
> **Source on disk:** HEAD e9b7802 (running binary main-c7e76cf — flag any live/source mismatch)
> **Last commit:** _shared-cmp-reconciliation_

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

- [ ] `/leads` — LeadsComponent (list)
- [ ] `/leads/intake` — LeadsIntakeComponent
- [ ] `/leads/queue` — LeadsQueueComponent
- [ ] `/leads/campaigns` — LeadsCampaignsComponent
- [ ] `/leads/suppression` — LeadsSuppressionComponent
- [ ] `/leads/samples` — LeadsSamplesComponent
- [ ] `/leads/accounts` — LeadsAccountsComponent
- [ ] `/customers` — CustomersComponent (list)
- [ ] `/customers/contacts` — CustomerContactsPageComponent
- [ ] `/customers/portal-access` — CustomerPortalAccessPageComponent
- [ ] `/customers/segments` — CustomerSegmentsPageComponent
- [ ] `/customers/import` — CustomerImportPageComponent
- [ ] `/customers/:id/overview` — CustomerDetailComponent (overview tab)
- [ ] `/customers/:id/contacts` — CustomerDetailComponent (contacts tab)
- [ ] `/customers/:id/addresses` — CustomerDetailComponent (addresses tab)
- [ ] `/customers/:id/estimates` — CustomerDetailComponent (estimates tab)
- [ ] `/customers/:id/quotes` — CustomerDetailComponent (quotes tab)
- [ ] `/customers/:id/orders` — CustomerDetailComponent (orders tab)
- [ ] `/customers/:id/jobs` — CustomerDetailComponent (jobs tab)
- [ ] `/customers/:id/invoices` — CustomerDetailComponent (invoices tab)
- [ ] `/customers/:id/pricing` — CustomerDetailComponent (pricing tab)
- [ ] `/customers/:id/interactions` — CustomerDetailComponent (interactions tab)
- [ ] `/customers/:id/activity` — CustomerDetailComponent (activity tab)
- [ ] `/vendors` — VendorsComponent (list; only route)
- [ ] `/parts` — PartsComponent (list)
- [ ] `/parts/new` — PartWorkflowPageComponent (create)
- [ ] `/parts/:id` — PartWorkflowPageComponent (detail / all workflow steps)
- [ ] `/inventory` → redirects to `/inventory/stock`
- [ ] `/inventory/stock` — InventoryComponent (stock tab)
- [ ] `/inventory/locations` — InventoryComponent (locations tab)
- [ ] `/inventory/movements` — InventoryComponent (movements tab)
- [ ] `/inventory/receiving` — InventoryComponent (receiving tab)
- [ ] `/inventory/stockOps` — InventoryComponent (stock-ops tab)
- [ ] `/inventory/cycleCounts` — InventoryComponent (cycle-counts tab)
- [ ] `/inventory/reservations` — InventoryComponent (reservations tab)
- [ ] `/inventory/replenishment` — InventoryComponent (replenishment tab)
- [ ] `/inventory/uom` — InventoryComponent (UOM tab)
- [ ] `/lots` — LotsComponent (list)

### Feature directories (all .ts files accounted for)

#### leads/
- [ ] `leads.component.ts` (LeadsComponent)
- [ ] `leads.routes.ts`
- [ ] `components/account-dialog/account-dialog.component.ts`
- [ ] `components/callback-scheduler-dialog/callback-scheduler-dialog.component.ts`
- [ ] `components/campaign-dialog/campaign-dialog.component.ts`
- [ ] `components/lead-convert-dialog/lead-convert-dialog.component.ts`
- [ ] `components/lead-detail-dialog/lead-detail-dialog.component.ts`
- [ ] `components/lead-detail-panel/lead-detail-panel.component.ts`
- [ ] `components/new-lead-fork-dialog/new-lead-fork-dialog.component.ts`
- [ ] `pages/accounts/leads-accounts.component.ts`
- [ ] `pages/campaigns/leads-campaigns.component.ts`
- [ ] `pages/intake/leads-intake.component.ts`
- [ ] `pages/queue/leads-queue.component.ts`
- [ ] `pages/samples/leads-samples.component.ts`
- [ ] `pages/suppression/leads-suppression.component.ts`

#### customers/
- [ ] `customers.component.ts`
- [ ] `components/credit-status-card/credit-status-card.component.ts`
- [ ] `components/customer-clusters/customer-activity-cluster.component.ts`
- [ ] `components/customer-clusters/customer-addresses-cluster.component.ts`
- [ ] `components/customer-clusters/customer-contacts-cluster.component.ts`
- [ ] `components/customer-clusters/customer-identity-cluster.component.ts`
- [ ] `components/customer-clusters/customer-interactions-cluster.component.ts`
- [ ] `components/customer-detail-dialog/customer-detail-dialog.component.ts`
- [ ] `components/guided-customer-dialog/guided-customer-dialog.component.ts`
- [ ] `components/new-customer-fork-dialog/lead-picker-dialog.component.ts`
- [ ] `components/new-customer-fork-dialog/new-customer-fork-dialog.component.ts`
- [ ] `components/price-list-entries-cluster/price-list-entries-table.component.ts`
- [ ] `components/price-list-entries-cluster/price-list-entry-bulk-import-dialog/price-list-entry-bulk-import-dialog.component.ts`
- [ ] `components/price-list-entries-cluster/price-list-entry-form-dialog.component.ts`
- [ ] `components/price-list-entries-cluster/price-list-form-dialog/price-list-form-dialog.component.ts`
- [ ] `components/provision-portal-access-dialog/provision-portal-access-dialog.component.ts`
- [ ] `pages/contacts/customer-contacts.component.ts`
- [ ] `pages/customer-detail/customer-detail.component.ts`
- [ ] `pages/customer-detail/tabs/customer-activity-tab.component.ts`
- [ ] `pages/customer-detail/tabs/customer-estimates-tab.component.ts`
- [ ] `pages/customer-detail/tabs/customer-invoices-tab.component.ts`
- [ ] `pages/customer-detail/tabs/customer-jobs-tab.component.ts`
- [ ] `pages/customer-detail/tabs/customer-orders-tab.component.ts`
- [ ] `pages/customer-detail/tabs/customer-overview-tab.component.ts`
- [ ] `pages/customer-detail/tabs/customer-pricing-tab.component.ts`
- [ ] `pages/customer-detail/tabs/customer-quotes-tab.component.ts`
- [ ] `pages/import/customer-import.component.ts`
- [ ] `pages/portal-access/customer-portal-access.component.ts`
- [ ] `pages/segments/customer-segments.component.ts`

#### vendors/
- [ ] `vendors.component.ts`
- [ ] `components/guided-vendor-dialog/guided-vendor-dialog.component.ts`
- [ ] `components/new-vendor-fork-dialog/new-vendor-fork-dialog.component.ts`
- [ ] `components/vendor-detail-dialog/vendor-detail-dialog.component.ts`
- [ ] `components/vendor-detail-panel/vendor-detail-panel.component.ts`
- [ ] `components/vendor-dialog/vendor-dialog.component.ts`
- [ ] `components/vendor-quick-create-dialog/vendor-quick-create-dialog.component.ts`
- [ ] `components/vendor-scorecard-tab/vendor-scorecard-tab.component.ts`

#### parts/ (pages + workflow steps + embedded BOM/routing)
- [ ] `parts.component.ts` (list page — _this file not yet confirmed; explorer found it at parts.component.ts_)
- [ ] `workflow/part-workflow-page/part-workflow-page.component.ts`
- [ ] `workflow/new-part-fork-dialog/new-part-fork-dialog.component.ts`
- [ ] `workflow/part-basics-step/part-basics-step.component.ts`
- [ ] `workflow/part-flags-step/part-flags-step.component.ts`
- [ ] `workflow/part-costing-step/part-costing-step.component.ts`
- [ ] `workflow/part-bom-step/part-bom-step.component.ts`
- [ ] `workflow/part-routing-step/part-routing-step.component.ts`
- [ ] `workflow/part-sourcing-step/part-sourcing-step.component.ts`
- [ ] `workflow/part-quality-step/part-quality-step.component.ts`
- [ ] `workflow/part-alternates-step/part-alternates-step.component.ts`
- [ ] `workflow/part-sales-hooks-step/part-sales-hooks-step.component.ts`
- [ ] `workflow/part-shipping-step/part-shipping-step.component.ts`
- [ ] `workflow/part-source-part-step/part-source-part-step.component.ts`
- [ ] `workflow/part-tool-asset-step/part-tool-asset-step.component.ts`
- [ ] `workflow/part-vendor-step/part-vendor-step.component.ts` ⚠️ _discovered via grep — not in original feature-dir list_
- [ ] `workflow/part-inventory-step/part-inventory-step.component.ts` ⚠️ _discovered via grep — not in original feature-dir list_
- [ ] `workflow/part-express-form/part-express-form.component.ts`
- [ ] `components/bom-revision-history/bom-revision-history.component.ts`
- [ ] `components/bom-tree/bom-tree.component.ts`
- [ ] `components/operation-dialog/operation-dialog.component.ts`
- [ ] `components/part-alternates-tab/part-alternates-tab.component.ts`
- [ ] `components/part-clusters/part-activity-cluster.component.ts`
- [ ] `components/part-clusters/part-alternates-cluster/part-alternates-cluster.component.ts`
- [ ] `components/part-clusters/part-cost-cluster.component.ts`
- [ ] `components/part-clusters/part-files-cluster.component.ts`
- [ ] `components/part-clusters/part-identity-cluster.component.ts`
- [ ] `components/part-clusters/part-inventory-cluster.component.ts`
- [ ] `components/part-clusters/part-landed-cost.component.ts`
- [ ] `components/part-clusters/part-material-cluster/part-material-cluster.component.ts`
- [ ] `components/part-clusters/part-mrp-cluster/part-mrp-cluster.component.ts`
- [ ] `components/part-clusters/part-pricing-cluster/part-pricing-cluster.component.ts`
- [ ] `components/part-clusters/part-quality-cluster/part-quality-cluster.component.ts`
- [ ] `components/part-clusters/part-routing-cluster/part-routing-cluster.component.ts`
- [ ] `components/part-clusters/part-uom-cluster/part-uom-cluster.component.ts`
- [ ] `components/part-detail-dialog/part-detail-dialog.component.ts`
- [ ] `components/part-detail-panel/part-detail-panel.component.ts`
- [ ] `components/part-quick-create-dialog/part-quick-create-dialog.component.ts`
- [ ] `components/parts-card-grid/parts-card-grid.component.ts`
- [ ] `components/routing/routing.component.ts`
- [ ] `components/routing-flow-view/routing-flow-view.component.ts`
- [ ] `components/serial-numbers-tab/serial-numbers-tab.component.ts`
- [ ] `components/vendor-parts-cluster/vendor-part-form-dialog.component.ts`
- [ ] `components/vendor-parts-cluster/vendor-part-price-tier-history-dialog.component.ts`
- [ ] `components/vendor-parts-cluster/vendor-part-price-tiers-dialog.component.ts`
- [ ] `components/vendor-sources-panel/vendor-sources-panel.component.ts`

#### inventory/
- [ ] `inventory.component.ts` (InventoryComponent — all 9 tabs)
- [ ] `components/receiving-inspection-queue/receiving-inspection-queue.component.ts`
- [ ] `components/uom-management/uom-management.component.ts`

#### lots/
- [ ] `lots.component.ts`
- [ ] `components/lot-detail-dialog/lot-detail-dialog.component.ts`
- [ ] `components/lot-detail-panel/lot-detail-panel.component.ts`
- [ ] `components/lot-dialog/lot-dialog.component.ts`

### Shared components — usage reconciliation (resolved)

> ✅ = has master-data usages (see resolved table below) · ❌ = no master-data usage confirmed

- [x] ✅ `shared/components/data-table` — 18 usage sites across all 6 areas
- [x] ✅ `shared/components/page-header` — 13 usage sites across all 6 areas
- [x] ✅ `shared/components/page-layout` — 3 usage sites (leads/samples, leads/accounts, customers/portal-access)
- [x] ❌ `shared/components/detail-side-panel` — no master-data usage; panels are feature-specific components
- [x] ❌ `shared/components/slideout` — no master-data usage confirmed
- [x] ✅ `shared/components/dialog` — 8+ usage sites across leads, customers, parts, inventory
- [x] ✅ `shared/components/entity-picker` — 16 usage sites; heaviest in parts workflow
- [x] ✅ `shared/components/empty-state` — 9 usage sites across customers, vendors, leads, inventory, lots
- [x] ✅ `shared/components/loading-overlay` (impl: `LoadingBlockDirective`) — 20+ sites across all 6 areas
- [x] ❌ `shared/components/status-badge` — no master-data usage (only dashboard/kanban)
- [x] ✅ `shared/components/entity-link` — 2 usage sites (parts/part-landed-cost, parts/part-detail-panel)
- [x] ✅ `shared/components/entity-activity-section` — 5 usage sites (leads, customers, vendors, parts, lots)
- [x] ✅ `shared/components/workflow` — 1 usage site (parts/part-workflow-page)
- [x] ✅ `shared/components/address-form` — 4 usage sites (leads/convert, customers/guided, vendors/dialog, vendors/guided)
- [x] ✅ `shared/components/file-upload-zone` — 2 usage sites (parts/operation-dialog, parts/part-files-cluster)
- [x] ❌ `shared/components/rich-text-editor` — no master-data usage confirmed
- [x] ❌ `shared/components/autocomplete` — no master-data usage (used in quotes/POs/shipments/SOs only)
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
| states | _queue: scout to confirm empty/loading/populated/error_ |
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
| states | _queue_ |
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
| states | _queue_ |
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
| states | _queue_ |
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
| states | _queue_ |
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
| states | _queue_ |
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
| states | _queue_ |
| purpose | Account-level leads grouping view |

---

#### LeadDetailPanelComponent
| field | value |
|-------|-------|
| component | `LeadDetailPanelComponent` / `app-lead-detail-panel` |
| type | panel |
| route | `/leads` (slide-in) |
| file | `features/leads/components/lead-detail-panel/lead-detail-panel.component.ts` |
| renders-for | Admin, Manager, PM |
| states | _queue_ |
| purpose | Right-side detail panel for a selected lead without navigating away |

---

#### LeadDetailDialogComponent
| field | value |
|-------|-------|
| component | `LeadDetailDialogComponent` / `app-lead-detail-dialog` |
| type | dialog |
| route | `/leads` (modal) |
| file | `features/leads/components/lead-detail-dialog/lead-detail-dialog.component.ts` |
| renders-for | Admin, Manager, PM |
| states | _queue_ |
| purpose | Full-detail dialog for a lead (alternative to panel) |

---

#### NewLeadForkDialogComponent
| field | value |
|-------|-------|
| component | `NewLeadForkDialogComponent` / `app-new-lead-fork-dialog` |
| type | dialog |
| route | `/leads` (modal) |
| file | `features/leads/components/new-lead-fork-dialog/new-lead-fork-dialog.component.ts` |
| renders-for | Admin, Manager, PM |
| states | _queue_ |
| purpose | Fork chooser: manual entry vs. import vs. campaign for new lead creation |

---

#### LeadConvertDialogComponent
| field | value |
|-------|-------|
| component | `LeadConvertDialogComponent` / `app-lead-convert-dialog` |
| type | dialog |
| route | `/leads` (modal) |
| file | `features/leads/components/lead-convert-dialog/lead-convert-dialog.component.ts` |
| renders-for | Admin, Manager, PM |
| states | _queue_ |
| purpose | Convert a lead to a customer |

---

#### AccountDialogComponent (leads)
| field | value |
|-------|-------|
| component | `AccountDialogComponent` / `app-account-dialog` |
| type | dialog |
| route | `/leads/accounts` (modal) |
| file | `features/leads/components/account-dialog/account-dialog.component.ts` |
| renders-for | Admin, Manager, PM |
| states | _queue_ |
| purpose | Create / edit a leads account |

---

#### CallbackSchedulerDialogComponent
| field | value |
|-------|-------|
| component | `CallbackSchedulerDialogComponent` / `app-callback-scheduler-dialog` |
| type | dialog |
| route | `/leads` (modal) |
| file | `features/leads/components/callback-scheduler-dialog/callback-scheduler-dialog.component.ts` |
| renders-for | Admin, Manager, PM |
| states | _queue_ |
| purpose | Schedule a callback for a lead |

---

#### CampaignDialogComponent
| field | value |
|-------|-------|
| component | `CampaignDialogComponent` / `app-campaign-dialog` |
| type | dialog |
| route | `/leads/campaigns` (modal) |
| file | `features/leads/components/campaign-dialog/campaign-dialog.component.ts` |
| renders-for | Admin, Manager, PM |
| states | _queue_ |
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
| states | _queue_ |
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
| states | _queue_ |
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
| states | _queue_ |
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
| states | _queue_ |
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
| states | _queue_ |
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
| states | _queue_ |
| purpose | Multi-tab customer detail shell; tab layout driven by resolver (role + status) |

Tabs within CustomerDetailComponent (each is a separate component):

| tab id | component | file |
|--------|-----------|------|
| overview | `CustomerOverviewTabComponent` | `pages/customer-detail/tabs/customer-overview-tab.component.ts` |
| contacts | _(cluster-based — CustomerContactsClusterComponent)_ | `components/customer-clusters/customer-contacts-cluster.component.ts` |
| addresses | _(cluster-based — CustomerAddressesClusterComponent)_ | `components/customer-clusters/customer-addresses-cluster.component.ts` |
| estimates | `CustomerEstimatesTabComponent` | `pages/customer-detail/tabs/customer-estimates-tab.component.ts` |
| quotes | `CustomerQuotesTabComponent` | `pages/customer-detail/tabs/customer-quotes-tab.component.ts` |
| orders | `CustomerOrdersTabComponent` | `pages/customer-detail/tabs/customer-orders-tab.component.ts` |
| jobs | `CustomerJobsTabComponent` | `pages/customer-detail/tabs/customer-jobs-tab.component.ts` |
| invoices | `CustomerInvoicesTabComponent` | `pages/customer-detail/tabs/customer-invoices-tab.component.ts` |
| pricing | `CustomerPricingTabComponent` | `pages/customer-detail/tabs/customer-pricing-tab.component.ts` |
| interactions | _(cluster-based — CustomerInteractionsClusterComponent)_ | `components/customer-clusters/customer-interactions-cluster.component.ts` |
| activity | `CustomerActivityTabComponent` + `CustomerActivityClusterComponent` | `tabs/customer-activity-tab.component.ts` + `components/customer-clusters/customer-activity-cluster.component.ts` |

> NOTE: contacts/addresses/interactions are rendered as cluster components, not standalone tab components. The resolver gates tabs by customer status (Active gets all; Prospect omits orders/jobs/invoices).

---

#### CustomerDetailDialogComponent
| field | value |
|-------|-------|
| component | `CustomerDetailDialogComponent` / `app-customer-detail-dialog` |
| type | dialog |
| route | `/customers` (modal, can deep-link to `/customers/:id/overview`) |
| file | `features/customers/components/customer-detail-dialog/customer-detail-dialog.component.ts` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | _queue_ |
| purpose | Quick-view customer detail in a dialog before optionally full-navigating |

---

#### NewCustomerForkDialogComponent
| field | value |
|-------|-------|
| component | `NewCustomerForkDialogComponent` / `app-new-customer-fork-dialog` |
| type | dialog |
| route | `/customers` (modal) |
| file | `features/customers/components/new-customer-fork-dialog/new-customer-fork-dialog.component.ts` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | _queue_ |
| purpose | Fork chooser: convert lead vs. new customer creation path |

---

#### GuidedCustomerDialogComponent
| field | value |
|-------|-------|
| component | `GuidedCustomerDialogComponent` |
| type | dialog |
| route | `/customers` (modal) |
| file | `features/customers/components/guided-customer-dialog/guided-customer-dialog.component.ts` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | _queue_ |
| purpose | Step-by-step guided new customer creation wizard |

---

#### LeadPickerDialogComponent
| field | value |
|-------|-------|
| component | `LeadPickerDialogComponent` / `app-lead-picker-dialog` |
| type | dialog |
| route | `/customers` (modal — within new-customer fork flow) |
| file | `features/customers/components/new-customer-fork-dialog/lead-picker-dialog.component.ts` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | _queue_ |
| purpose | Pick existing lead to convert when creating a customer |

---

#### ProvisionPortalAccessDialogComponent
| field | value |
|-------|-------|
| component | `ProvisionPortalAccessDialogComponent` / `app-provision-portal-access-dialog` |
| type | dialog |
| route | `/customers/portal-access` (modal) |
| file | `features/customers/components/provision-portal-access-dialog/provision-portal-access-dialog.component.ts` |
| renders-for | Admin, OfficeManager |
| states | _queue_ |
| purpose | Provision / revoke customer portal access |

---

#### Customer cluster components (embedded in CustomerDetailComponent)

| component | type | file |
|-----------|------|------|
| `CustomerIdentityClusterComponent` / `app-customer-identity-cluster` | cluster | `features/customers/components/customer-clusters/customer-identity-cluster.component.ts` |
| `CustomerContactsClusterComponent` / `app-customer-contacts-cluster` | cluster | `features/customers/components/customer-clusters/customer-contacts-cluster.component.ts` |
| `CustomerAddressesClusterComponent` / `app-customer-addresses-cluster` | cluster | `features/customers/components/customer-clusters/customer-addresses-cluster.component.ts` |
| `CustomerInteractionsClusterComponent` / `app-customer-interactions-cluster` | cluster | `features/customers/components/customer-clusters/customer-interactions-cluster.component.ts` |
| `CustomerActivityClusterComponent` / `app-customer-activity-cluster` | cluster | `features/customers/components/customer-clusters/customer-activity-cluster.component.ts` |
| `CreditStatusCardComponent` / `app-credit-status-card` | cluster | `features/customers/components/credit-status-card/credit-status-card.component.ts` |

> All cluster entries: renders-for Admin/Manager/PM/OfficeManager; states _queue_.

---

#### Price-list cluster components (embedded in pricing tab)

| component | type | file |
|-----------|------|------|
| `PriceListEntriesTableComponent` / `app-price-list-entries-table` | table | `features/customers/components/price-list-entries-cluster/price-list-entries-table.component.ts` |
| `PriceListEntryFormDialogComponent` | dialog | `features/customers/components/price-list-entries-cluster/price-list-entry-form-dialog.component.ts` |
| `PriceListFormDialogComponent` / `app-price-list-form-dialog` | dialog | `features/customers/components/price-list-entries-cluster/price-list-form-dialog/price-list-form-dialog.component.ts` |
| `PriceListEntryBulkImportDialogComponent` | dialog | `features/customers/components/price-list-entries-cluster/price-list-entry-bulk-import-dialog/price-list-entry-bulk-import-dialog.component.ts` |

> All price-list cluster entries: renders-for Admin/Manager (pricing tab gate); states _queue_.

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
| states | _queue_ |
| purpose | Vendor list; only top-level vendor route |

---

#### VendorDetailPanelComponent
| field | value |
|-------|-------|
| component | `VendorDetailPanelComponent` / `app-vendor-detail-panel` |
| type | panel |
| route | `/vendors` (slide-in) |
| file | `features/vendors/components/vendor-detail-panel/vendor-detail-panel.component.ts` |
| renders-for | Admin, Manager, OfficeManager |
| states | _queue_ |
| purpose | Right-side detail panel for selected vendor |

---

#### VendorDetailDialogComponent
| field | value |
|-------|-------|
| component | `VendorDetailDialogComponent` / `app-vendor-detail-dialog` |
| type | dialog |
| route | `/vendors` (modal) |
| file | `features/vendors/components/vendor-detail-dialog/vendor-detail-dialog.component.ts` |
| renders-for | Admin, Manager, OfficeManager |
| states | _queue_ |
| purpose | Full vendor detail dialog |

---

#### VendorDialogComponent
| field | value |
|-------|-------|
| component | `VendorDialogComponent` / `app-vendor-dialog` |
| type | dialog |
| route | `/vendors` (modal) |
| file | `features/vendors/components/vendor-dialog/vendor-dialog.component.ts` |
| renders-for | Admin, Manager, OfficeManager |
| states | _queue_ |
| purpose | Create / edit vendor form dialog |

---

#### NewVendorForkDialogComponent
| field | value |
|-------|-------|
| component | `NewVendorForkDialogComponent` / `app-new-vendor-fork-dialog` |
| type | dialog |
| route | `/vendors` (modal) |
| file | `features/vendors/components/new-vendor-fork-dialog/new-vendor-fork-dialog.component.ts` |
| renders-for | Admin, Manager, OfficeManager |
| states | _queue_ |
| purpose | Fork chooser for new vendor creation |

---

#### GuidedVendorDialogComponent
| field | value |
|-------|-------|
| component | `GuidedVendorDialogComponent` |
| type | dialog |
| route | `/vendors` (modal) |
| file | `features/vendors/components/guided-vendor-dialog/guided-vendor-dialog.component.ts` |
| renders-for | Admin, Manager, OfficeManager |
| states | _queue_ |
| purpose | Step-by-step guided vendor creation wizard |

---

#### VendorQuickCreateDialogComponent
| field | value |
|-------|-------|
| component | `VendorQuickCreateDialogComponent` |
| type | dialog |
| route | `shared` (spawned from other surfaces — POs, parts sourcing) |
| file | `features/vendors/components/vendor-quick-create-dialog/vendor-quick-create-dialog.component.ts` |
| renders-for | Admin, Manager, OfficeManager |
| states | _queue_ |
| purpose | Inline quick-create vendor without leaving current context |

---

#### VendorScorecardTabComponent
| field | value |
|-------|-------|
| component | `VendorScorecardTabComponent` / `app-vendor-scorecard-tab` |
| type | tab |
| route | `/vendors` (within vendor detail panel or dialog) |
| file | `features/vendors/components/vendor-scorecard-tab/vendor-scorecard-tab.component.ts` |
| renders-for | Admin, Manager, OfficeManager |
| states | _queue_ |
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
| states | _queue_ |
| purpose | Parts list with search, grid/table toggle, and card grid |

---

#### PartWorkflowPageComponent
| field | value |
|-------|-------|
| component | `PartWorkflowPageComponent` |
| type | page |
| route | `/parts/new` · `/parts/:id` |
| file | `features/parts/workflow/part-workflow-page/part-workflow-page.component.ts:28` |
| renders-for | Admin, Manager, Engineer, PM |
| states | _queue_ |
| purpose | Multi-step workflow shell for creating or editing a part |

---

#### Workflow step components (all embedded in PartWorkflowPageComponent)

| component | file | purpose |
|-----------|------|---------|
| `NewPartForkDialogComponent` | `workflow/new-part-fork-dialog/new-part-fork-dialog.component.ts` | Fork: express vs. full vs. source-from-part |
| `PartExpressFormComponent` | `workflow/part-express-form/part-express-form.component.ts` | Quick single-form part creation |
| `PartBasicsStepComponent` | `workflow/part-basics-step/part-basics-step.component.ts` | Step 1: part number, description, type |
| `PartFlagsStepComponent` | `workflow/part-flags-step/part-flags-step.component.ts` | Step 2: purchased/manufactured/phantom flags |
| `PartCostingStepComponent` | `workflow/part-costing-step/part-costing-step.component.ts` | Step 3: standard cost, landed cost |
| `PartBomStepComponent` | `workflow/part-bom-step/part-bom-step.component.ts` | Step 4: BOM assembly (embeds BomTreeComponent) |
| `PartRoutingStepComponent` | `workflow/part-routing-step/part-routing-step.component.ts` | Step 5: manufacturing routing |
| `PartSourcingStepComponent` | `workflow/part-sourcing-step/part-sourcing-step.component.ts` | Step 6: vendor sourcing |
| `PartQualityStepComponent` | `workflow/part-quality-step/part-quality-step.component.ts` | Step 7: quality settings |
| `PartAlternatesStepComponent` | `workflow/part-alternates-step/part-alternates-step.component.ts` | Step 8: alternate parts |
| `PartSalesHooksStepComponent` | `workflow/part-sales-hooks-step/part-sales-hooks-step.component.ts` | Step 9: sales/pricing hooks |
| `PartShippingStepComponent` | `workflow/part-shipping-step/part-shipping-step.component.ts` | Step 10: shipping / UOM settings |
| `PartSourcePartStepComponent` | `workflow/part-source-part-step/part-source-part-step.component.ts` | Fork path: clone from existing part |
| `PartToolAssetStepComponent` | `workflow/part-tool-asset-step/part-tool-asset-step.component.ts` | Tool/asset-type part setup |

> All workflow steps: renders-for Admin/Manager/Engineer/PM; states _queue_.

---

#### BOM sub-components (embedded in PartBomStepComponent / parts detail)

| component | file | purpose |
|-----------|------|---------|
| `BomTreeComponent` | `features/parts/components/bom-tree/bom-tree.component.ts` | Visual BOM hierarchy tree |
| `BomRevisionHistoryComponent` | `features/parts/components/bom-revision-history/bom-revision-history.component.ts` | BOM revision change history |

---

#### Part cluster components (embedded in part detail)

| component | file | purpose |
|-----------|------|---------|
| `PartIdentityClusterComponent` | `features/parts/components/part-clusters/part-identity-cluster.component.ts` | Part number, description, type identity |
| `PartCostClusterComponent` | `features/parts/components/part-clusters/part-cost-cluster.component.ts` | Cost / pricing data |
| `PartInventoryClusterComponent` | `features/parts/components/part-clusters/part-inventory-cluster.component.ts` | Stock levels, on-hand |
| `PartFilesClusterComponent` | `features/parts/components/part-clusters/part-files-cluster.component.ts` | Attachments / drawings |
| `PartActivityClusterComponent` | `features/parts/components/part-clusters/part-activity-cluster.component.ts` | Change / activity feed |
| `PartAlternatesClusterComponent` | `features/parts/components/part-clusters/part-alternates-cluster/part-alternates-cluster.component.ts` | Alternate part substitutions |
| `PartLandedCostComponent` | `features/parts/components/part-clusters/part-landed-cost.component.ts` | Landed cost breakdown |
| `PartMaterialClusterComponent` | `features/parts/components/part-clusters/part-material-cluster/part-material-cluster.component.ts` | Raw material spec |
| `PartMrpClusterComponent` | `features/parts/components/part-clusters/part-mrp-cluster/part-mrp-cluster.component.ts` | MRP planning parameters |
| `PartPricingClusterComponent` | `features/parts/components/part-clusters/part-pricing-cluster/part-pricing-cluster.component.ts` | Sales pricing tiers |
| `PartQualityClusterComponent` | `features/parts/components/part-clusters/part-quality-cluster/part-quality-cluster.component.ts` | Quality control settings |
| `PartRoutingClusterComponent` | `features/parts/components/part-clusters/part-routing-cluster/part-routing-cluster.component.ts` | Manufacturing routing steps |
| `PartUomClusterComponent` | `features/parts/components/part-clusters/part-uom-cluster/part-uom-cluster.component.ts` | Unit-of-measure conversions |

---

#### Other parts components

| component | file | type | purpose |
|-----------|------|------|---------|
| `PartDetailPanelComponent` | `features/parts/components/part-detail-panel/part-detail-panel.component.ts` | panel | Slide-in detail for list view |
| `PartDetailDialogComponent` | `features/parts/components/part-detail-dialog/part-detail-dialog.component.ts` | dialog | Full part detail in a dialog |
| `PartQuickCreateDialogComponent` | `features/parts/components/part-quick-create-dialog/part-quick-create-dialog.component.ts` | dialog | Quick-create part inline |
| `PartsCardGridComponent` | `features/parts/components/parts-card-grid/parts-card-grid.component.ts` | table | Card-grid layout for parts list |
| `RoutingComponent` | `features/parts/components/routing/routing.component.ts` | cluster | Routing operations table |
| `RoutingFlowViewComponent` | `features/parts/components/routing-flow-view/routing-flow-view.component.ts` | cluster | Visual flow of routing steps |
| `OperationDialogComponent` | `features/parts/components/operation-dialog/operation-dialog.component.ts` | dialog | Create / edit routing operation |
| `PartAlternatesTabComponent` | `features/parts/components/part-alternates-tab/part-alternates-tab.component.ts` | tab | Alternates tab within part detail |
| `SerialNumbersTabComponent` | `features/parts/components/serial-numbers-tab/serial-numbers-tab.component.ts` | tab | Serial numbers tab within part detail |
| `VendorSourcesPanelComponent` | `features/parts/components/vendor-sources-panel/vendor-sources-panel.component.ts` | panel | Vendor sources side panel |
| `VendorPartFormDialogComponent` | `features/parts/components/vendor-parts-cluster/vendor-part-form-dialog.component.ts` | dialog | Add/edit vendor-part record |
| `VendorPartPriceTiersDialogComponent` | `features/parts/components/vendor-parts-cluster/vendor-part-price-tiers-dialog.component.ts` | dialog | Edit vendor price tiers |
| `VendorPartPriceTierHistoryDialogComponent` | `features/parts/components/vendor-parts-cluster/vendor-part-price-tier-history-dialog.component.ts` | dialog | View vendor price-tier history |

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
| states | _queue_ |
| purpose | Tabbed inventory management shell; each tab is an in-component view (no sub-routing) |

Tabs within InventoryComponent (in-component, NOT separate route components):

| tab | purpose |
|-----|---------|
| `stock` | On-hand / available / reserved summary per part |
| `locations` | Storage location list |
| `movements` | Inventory movement history (transfers, adjustments) |
| `receiving` | Receiving history (embeds ReceivingInspectionQueueComponent) |
| `stockOps` | Stock adjustments + transfers via embedded forms |
| `cycleCounts` | Cycle count list and management |
| `reservations` | Active inventory reservations |
| `replenishment` | Replenishment / reorder triggers |
| `uom` | Unit-of-measure management (embeds UomManagementComponent) |

---

#### ReceivingInspectionQueueComponent
| field | value |
|-------|-------|
| component | `ReceivingInspectionQueueComponent` |
| type | panel |
| route | `/inventory/receiving` (embedded in receiving tab) |
| file | `features/inventory/components/receiving-inspection-queue/receiving-inspection-queue.component.ts` |
| renders-for | Admin, Manager, Engineer, OfficeManager |
| states | _queue_ |
| purpose | Queue of inbound items pending inspection before stock entry |

---

#### UomManagementComponent
| field | value |
|-------|-------|
| component | `UomManagementComponent` |
| type | panel |
| route | `/inventory/uom` (embedded in uom tab) |
| file | `features/inventory/components/uom-management/uom-management.component.ts` |
| renders-for | Admin, Manager |
| states | _queue_ |
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
| states | _queue_ |
| purpose | Lot list with search and row actions |

---

#### LotDetailPanelComponent
| field | value |
|-------|-------|
| component | `LotDetailPanelComponent` |
| type | panel |
| route | `/lots` (slide-in) |
| file | `features/lots/components/lot-detail-panel/lot-detail-panel.component.ts` |
| renders-for | Admin, Manager, Engineer |
| states | _queue_ |
| purpose | Right-side detail panel for selected lot |

---

#### LotDetailDialogComponent
| field | value |
|-------|-------|
| component | `LotDetailDialogComponent` |
| type | dialog |
| route | `/lots` (modal) |
| file | `features/lots/components/lot-detail-dialog/lot-detail-dialog.component.ts` |
| renders-for | Admin, Manager, Engineer |
| states | _queue_ |
| purpose | Full lot detail dialog |

---

#### LotDialogComponent
| field | value |
|-------|-------|
| component | `LotDialogComponent` |
| type | dialog |
| route | `/lots` (modal) |
| file | `features/lots/components/lot-dialog/lot-dialog.component.ts` |
| renders-for | Admin, Manager, Engineer |
| states | _queue_ |
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

_Cycle 1: seed. Cycle 2: shared-cmp reconciliation complete (18 items resolved). Queue drained next cycle after scout delivers `master-data-queue.md`._

---

## Scout Live Sweep — Cycle 1 (2026-05-22)

> Agent: ui-scout · Playwright headless Chromium · admin@forge.local  
> Stack: non-seeded. Every list page = empty state. Profile redirect bypassed via direct /dashboard nav.  
> Screenshots: `analysis/inventory/screenshots/<route-id>.png`  
> Raw log: `analysis/inventory/sweep-log.json`

### Routes visited + live states observed

| route-id | URL visited | finalURL | empty-state detected | key live signals |
|----------|-------------|----------|----------------------|-----------------|
| leads-list | `/leads` | `/leads` | "no leads" | nav icons: list/upload_file/speed/campaign/block visible |
| leads-intake | `/leads/intake` | `/leads/intake` | "get started" | table headers: HEADER/REQUIRED?/ALSO ACCEPTED; button: PARSE PASTED ROWS |
| leads-queue | `/leads/queue` | `/leads/queue` | none | button: PULL NEXT 5 visible |
| leads-campaigns | `/leads/campaigns` | `/leads/campaigns` | none | button: NEW CAMPAIGN visible |
| leads-suppression | `/leads/suppression` | `/leads/suppression` | none | shell rendered; no primary action button detected |
| leads-samples | `/leads/samples` | `/leads/samples` | none | shell rendered; no primary action button detected |
| leads-accounts | `/leads/accounts` | `/leads/accounts` | none | button: NEW ACCOUNT visible |
| customers-list | `/customers` | `/customers` | "no customers" | button: NEW CUSTOMER; nav icons: list/contacts/vpn_key/filter_alt/upload |
| customers-contacts | `/customers/contacts` | `/customers/contacts` | none | shell rendered |
| customers-portal-access | `/customers/portal-access` | `/customers/portal-access` | none | button: PROVISION ACCESS visible |
| customers-segments | `/customers/segments` | `/customers/segments` | none | shell rendered |
| customers-import | `/customers/import` | `/customers/import` | none | shell rendered |
| vendors-list | `/vendors` | `/vendors` | "no vendors" | button: NEW VENDOR; nav icons: storefront/description/request_page |
| parts-list | `/parts` | `/parts` | "no parts" | button: help_outline; nav icons: category/hub/event_available/batch_prediction/speed |
| parts-new | `/parts/new` | `/parts/new` | none | workflow shell rendered; nav icons: category/hub/event_available/batch_prediction/speed |
| inventory-stock | `/inventory/stock` | `/inventory/stock` | "no inventory" | nav icons: inventory/build/precision_manufacturing/storefront |
| inventory-receiving | `/inventory/receiving` | `/inventory/receiving` | none | shell rendered (no empty-text keyword matched) |
| inventory-transfers | `/inventory/transfers` | `/inventory/stock` | "no inventory" | INVALID TAB — redirected to /inventory/stock |
| inventory-adjustments | `/inventory/adjustments` | `/inventory/stock` | "no inventory" | INVALID TAB — redirected to /inventory/stock |
| inventory-locations | `/inventory/locations` | `/inventory/locations` | none | shell rendered |
| lots-list | `/lots` | `/lots` | none (empty state keyword unmatched) | button: SEARCH visible; table rendered but empty |

### State updates (for reconciliation checklist)

Routes confirmed live (tick these off):
- [x] `/leads` — empty state "no leads"
- [x] `/leads/intake` — loaded (get-started state; CSV table header visible)
- [x] `/leads/queue` — loaded (PULL NEXT 5 visible)
- [x] `/leads/campaigns` — loaded (NEW CAMPAIGN visible)
- [x] `/leads/suppression` — loaded (shell rendered)
- [x] `/leads/samples` — loaded (shell rendered)
- [x] `/leads/accounts` — loaded (NEW ACCOUNT visible)
- [x] `/customers` — empty state "no customers"
- [x] `/customers/contacts` — loaded (shell rendered)
- [x] `/customers/portal-access` — loaded (PROVISION ACCESS visible)
- [x] `/customers/segments` — loaded (shell rendered)
- [x] `/customers/import` — loaded (shell rendered)
- [x] `/vendors` — empty state "no vendors"
- [x] `/parts` — empty state "no parts"
- [x] `/parts/new` — loaded (workflow shell rendered)
- [x] `/inventory/stock` — empty state "no inventory"
- [x] `/inventory/receiving` — loaded (shell rendered)
- [x] `/inventory/locations` — loaded (shell rendered)
- [x] `/lots` — loaded (empty table; no keyword match — DataTable renders with empty rows)

### Confirmed live: BOM

BOM is NOT a standalone route. Confirmed in source: `app-part-bom-step` mounts inside the part workflow at `/parts/new` and `/parts/:id`. The shell rendered at `/parts/new` — BOM step accessible only after navigating into the multi-step workflow. **Queue: open parts/new workflow and advance to BOM step.**

### Inventory tab name correction

`/inventory` valid tabs per source (`inventory.component.ts:64`):  
`stock | locations | movements | receiving | stockOps | cycleCounts | reservations | replenishment | uom`

My sweep probed `transfers` and `adjustments` — both are NOT valid tab names and redirected to `stock`. The correct tab for transfers+adjustments is `stockOps`. Unvisited tabs filed in queue below.

### Onboarding banner

All pages showed an onboarding banner: "Complete your employee profile — 3 sections remaining / COMPLETE NOW / SKIP ONBOARDING". This is a shared component visible on every authenticated page for admin@forge.local.

### Profile redirect

admin@forge.local lands on `/account/profile` post-login. Bypassed by navigating directly to `/dashboard` — no profile completion required to access master-data routes.
