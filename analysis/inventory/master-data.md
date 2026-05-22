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
- [ ] `/customers/:id/orders` — CustomerDetailComponent (orders tab) ⚠️ _tab not visible on this stack — likely module/capability gate; queue Q2-f_
- [ ] `/customers/:id/jobs` — CustomerDetailComponent (jobs tab) ⚠️ _tab not visible on this stack; queue Q2-g_
- [ ] `/customers/:id/invoices` — CustomerDetailComponent (invoices tab) ⚠️ _tab not visible on this stack; queue Q2-h_
- [ ] `/customers/:id/pricing` — CustomerDetailComponent (pricing tab) ⚠️ _tab not visible on this stack — navigating redirected to overview; queue Q2-i_
- [ ] `/customers/:id/interactions` — CustomerDetailComponent (interactions tab) ⚠️ _tab not visible on this stack; queue Q2-j_
- [x] `/customers/:id/activity` — CustomerDetailComponent (activity tab)
- [x] `/vendors` — VendorsComponent (list; only route)
- [x] `/parts` — PartsComponent (list)
- [x] `/parts/new` — PartWorkflowPageComponent (create)
- [ ] `/parts/:id` — PartWorkflowPageComponent (detail / all workflow steps) ⚠️ _needs seeded part_
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
- [ ] `components/callback-scheduler-dialog/callback-scheduler-dialog.component.ts` ⚠️ _needs lead in queue_
- [x] `components/campaign-dialog/campaign-dialog.component.ts`
- [x] `components/lead-convert-dialog/lead-convert-dialog.component.ts`
- [ ] `components/lead-detail-dialog/lead-detail-dialog.component.ts` ⚠️ _needs different trigger path_
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
- [ ] `components/credit-status-card/credit-status-card.component.ts` ⚠️ _confirm rendering in overview tab — not yet identified in observed content_
- [x] `components/customer-clusters/customer-activity-cluster.component.ts`
- [x] `components/customer-clusters/customer-addresses-cluster.component.ts`
- [x] `components/customer-clusters/customer-contacts-cluster.component.ts`
- [x] `components/customer-clusters/customer-identity-cluster.component.ts`
- [ ] `components/customer-clusters/customer-interactions-cluster.component.ts` ⚠️ _interactions tab not visible on this stack config_
- [ ] `components/customer-detail-dialog/customer-detail-dialog.component.ts` ⚠️ _row-click goes to page not dialog; alternate trigger needed_
- [ ] `components/guided-customer-dialog/guided-customer-dialog.component.ts` ⚠️ _fork has no guided path — need to find alternate trigger_
- [x] `components/new-customer-fork-dialog/lead-picker-dialog.component.ts`
- [x] `components/new-customer-fork-dialog/new-customer-fork-dialog.component.ts`
- [ ] `components/price-list-entries-cluster/price-list-entries-table.component.ts` ⚠️ _pricing tab not visible on this stack_
- [ ] `components/price-list-entries-cluster/price-list-entry-bulk-import-dialog/price-list-entry-bulk-import-dialog.component.ts` ⚠️ _pricing tab not visible_
- [ ] `components/price-list-entries-cluster/price-list-entry-form-dialog.component.ts` ⚠️ _pricing tab not visible_
- [ ] `components/price-list-entries-cluster/price-list-form-dialog/price-list-form-dialog.component.ts` ⚠️ _pricing tab not visible_
- [x] `components/provision-portal-access-dialog/provision-portal-access-dialog.component.ts`
- [x] `pages/contacts/customer-contacts.component.ts`
- [x] `pages/customer-detail/customer-detail.component.ts`
- [x] `pages/customer-detail/tabs/customer-activity-tab.component.ts`
- [x] `pages/customer-detail/tabs/customer-estimates-tab.component.ts`
- [ ] `pages/customer-detail/tabs/customer-invoices-tab.component.ts` ⚠️ _tab not visible on this stack_
- [ ] `pages/customer-detail/tabs/customer-jobs-tab.component.ts` ⚠️ _tab not visible on this stack_
- [ ] `pages/customer-detail/tabs/customer-orders-tab.component.ts` ⚠️ _tab not visible on this stack_
- [x] `pages/customer-detail/tabs/customer-overview-tab.component.ts`
- [ ] `pages/customer-detail/tabs/customer-pricing-tab.component.ts` ⚠️ _tab not visible on this stack_
- [x] `pages/customer-detail/tabs/customer-quotes-tab.component.ts`
- [x] `pages/import/customer-import.component.ts`
- [x] `pages/portal-access/customer-portal-access.component.ts`
- [x] `pages/segments/customer-segments.component.ts`

#### vendors/
- [x] `vendors.component.ts`
- [ ] `components/guided-vendor-dialog/guided-vendor-dialog.component.ts` ⚠️ _fork "Guided setup" opened same form as VendorDialog — need source confirmation_
- [x] `components/new-vendor-fork-dialog/new-vendor-fork-dialog.component.ts`
- [ ] `components/vendor-detail-dialog/vendor-detail-dialog.component.ts` ⚠️ _panel opens for row-click; dialog trigger different_
- [x] `components/vendor-detail-panel/vendor-detail-panel.component.ts`
- [x] `components/vendor-dialog/vendor-dialog.component.ts`
- [ ] `components/vendor-quick-create-dialog/vendor-quick-create-dialog.component.ts` ⚠️ _spawned from PO/parts context — not reachable from vendors route_
- [x] `components/vendor-scorecard-tab/vendor-scorecard-tab.component.ts`

#### parts/ (pages + workflow steps + embedded BOM/routing)
- [x] `parts.component.ts` (list page — _confirmed at `features/parts/parts.component.ts:48`_)
- [ ] `workflow/part-workflow-page/part-workflow-page.component.ts` ⚠️ _workflow shell loads but "Loading workflow…" — needs part selection to proceed_
- [x] `workflow/new-part-fork-dialog/new-part-fork-dialog.component.ts`
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
- [x] `components/vendor-parts-cluster/vendor-part-list-panel.component.ts`
- [ ] `components/vendor-parts-cluster/vendor-part-bulk-import-dialog.component.ts` ⚠️ _discovered C2b — via VendorDetailPanelComponent import_

#### inventory/
- [x] `inventory.component.ts` (InventoryComponent — all 9 tabs confirmed C1+C4)
- [ ] `components/receiving-inspection-queue/receiving-inspection-queue.component.ts` ⚠️ _needs a receiving event to trigger inspection queue_
- [x] `components/uom-management/uom-management.component.ts`

#### lots/
- [x] `lots.component.ts`
- [ ] `components/lot-detail-dialog/lot-detail-dialog.component.ts` ⚠️ _needs seeded lot (0 lots in current stack)_
- [ ] `components/lot-detail-panel/lot-detail-panel.component.ts` ⚠️ _needs seeded lot_
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
| states | unreached — see queue |
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
| states | unreached — see queue |
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

#### Pre-located customer cluster entries (states: unreached — see queue)

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
| states | unreached — see queue |
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
| states | unreached — row-click navigates to full page, not this dialog; alternate trigger not yet found |
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
| states | `create` — confirmed C4: "HOW WOULD YOU LIKE TO ADD THIS CUSTOMER?" — fork options: flash_on Quick add (MOST COMMON — "Drop in a name…"), person_add Convert from lead; triggered by NEW CUSTOMER button |
| purpose | Fork chooser: convert lead vs. new customer creation path |

---

#### GuidedCustomerDialogComponent
| field | value |
|-------|-------|
| component | `GuidedCustomerDialogComponent` |
| type | dialog |
| route | `/customers` (modal) |
| file | `features/customers/components/guided-customer-dialog/guided-customer-dialog.component.ts:43` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | unreached — fork dialog only shows "Quick add" + "Convert from lead"; guided path trigger not yet identified |
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
| `CreditStatusCardComponent` / `app-credit-status-card` | cluster | `features/customers/components/credit-status-card/credit-status-card.component.ts:15` | unreached — not yet identified in observed output |

> All cluster entries: renders-for Admin/Manager/PM/OfficeManager.

---

#### Price-list cluster components (embedded in pricing tab)

| component | type | file | states |
|-----------|------|------|--------|
| `PriceListEntriesTableComponent` / `app-price-list-entries-table` | table | `features/customers/components/price-list-entries-cluster/price-list-entries-table.component.ts:33` | ⚠️ unreached — pricing tab not visible on this stack |
| `PriceListEntryFormDialogComponent` | dialog | `features/customers/components/price-list-entries-cluster/price-list-entry-form-dialog.component.ts:41` | ⚠️ unreached |
| `PriceListFormDialogComponent` / `app-price-list-form-dialog` | dialog | `features/customers/components/price-list-entries-cluster/price-list-form-dialog/price-list-form-dialog.component.ts:45` | ⚠️ unreached |
| `PriceListEntryBulkImportDialogComponent` | dialog | `features/customers/components/price-list-entries-cluster/price-list-entry-bulk-import-dialog/price-list-entry-bulk-import-dialog.component.ts:45` | ⚠️ unreached |

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
| states | unreached — see queue |
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
| states | unreached — see queue |
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
| states | unreached — see queue |
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

`PartsComponent` list-level sub-surfaces (all states: TODO(scout-C2)):

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
| states | `create` — workflow shell rendered at `/parts/new` (2026-05-22); `edit` (loaded part) unreached (queue Q4-a); `error` unreached |
| purpose | Multi-step workflow shell for creating or editing a part |

---

#### Workflow step components (all embedded in PartWorkflowPageComponent)

| component | file:line | purpose |
|-----------|-----------|---------|
| `NewPartForkDialogComponent` | `workflow/new-part-fork-dialog/new-part-fork-dialog.component.ts:66` | Fork: Made/Bought/Subcontracted/Phantom — confirmed C4 |
| `PartExpressFormComponent` | `workflow/part-express-form/part-express-form.component.ts:33` | Quick single-form part creation |
| `PartBasicsStepComponent` | `workflow/part-basics-step/part-basics-step.component.ts:30` | Step 1: part number, description, type |
| `PartFlagsStepComponent` | `workflow/part-flags-step/part-flags-step.component.ts:22` | Step 2: purchased/manufactured/phantom flags |
| `PartCostingStepComponent` | `workflow/part-costing-step/part-costing-step.component.ts:36` | Step 3: standard cost, landed cost |
| `PartBomStepComponent` | `workflow/part-bom-step/part-bom-step.component.ts:51` | BOM composition: table of child parts + in-component add/delete dialogs (see expanded entry below) |
| `PartRoutingStepComponent` | `workflow/part-routing-step/part-routing-step.component.ts:17` | Manufacturing routing |
| `PartSourcingStepComponent` | `workflow/part-sourcing-step/part-sourcing-step.component.ts:24` | Vendor sourcing |
| `PartQualityStepComponent` | `workflow/part-quality-step/part-quality-step.component.ts:26` | Quality settings |
| `PartAlternatesStepComponent` | `workflow/part-alternates-step/part-alternates-step.component.ts:11` | Alternate parts |
| `PartSalesHooksStepComponent` | `workflow/part-sales-hooks-step/part-sales-hooks-step.component.ts:24` | Sales/pricing hooks |
| `PartShippingStepComponent` | `workflow/part-shipping-step/part-shipping-step.component.ts:25` | Shipping / UOM settings |
| `PartSourcePartStepComponent` | `workflow/part-source-part-step/part-source-part-step.component.ts:20` | Fork path: clone from existing part |
| `PartToolAssetStepComponent` | `workflow/part-tool-asset-step/part-tool-asset-step.component.ts:23` | Tool/asset-type part setup |
| `PartVendorStepComponent` ⚠️ | `workflow/part-vendor-step/part-vendor-step.component.ts:24` | _Discovered via grep C1.5 — vendor-specific sourcing step_ |
| `PartInventoryStepComponent` ⚠️ | `workflow/part-inventory-step/part-inventory-step.component.ts:23` | _Discovered via grep C1.5 — inventory settings step_ |

> All workflow steps: renders-for Admin/Manager/Engineer/PM; states unreached (need seeded part to navigate edit-mode workflow).

---

#### BOM step — expanded pre-located entry (states: unreached — see queue)

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

#### Part cluster components — pre-located (states: unreached — see queue)

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
| states | unreached — IMPORT CSV button confirmed visible in Catalog tab (C4b); dialog not yet opened |
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
| states | unreached — receiving tab shell confirmed C1; component likely renders only when there are items pending inspection |
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
| states | unreached — see queue |
| purpose | Right-side detail panel for selected lot; displays trace provenance + activity feed |

`LotDetailPanelComponent` sub-surfaces (all states: TODO(scout-C2)):

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
| states | unreached — needs seeded lot (0 lots in current stack) |
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

_Cycle 1: seed. Cycle 2: shared-cmp reconciliation complete (18 items resolved). Cycle 2b: pre-source-location complete — all areas with file:line + sub-surface tables; 2 new vendor-parts-cluster discoveries added. Cycle 3: states from scout sweep C1 folded into per-component entries; remaining open states recorded in Open Items block below. Cycle 4 (source-cataloger, 2026-05-22): 72 new checklist ticks (32 routes + 40 feature-dir); all 6 unreached inventory tabs confirmed; 8 dialogs observed (create state); lead/vendor/customer detail panels/pages observed with populated states; all missing line numbers filled. Count: 90/163 reconciled. Remaining: 73 items need seeded parts (44+), missing customer tabs (5), lot details (2), lead dialogs (3), vendor dialogs (3), receiving inspection queue (1)._

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

## Open Items — Unreached Surfaces (C3 reconciliation)

> Every surface below needs seeding and/or a targeted scout sweep before it can be ticked off the reconciliation checklist.
> Reference: `master-data-queue.md` filed by ui-scout cycle 1 (2026-05-22).

### Inventory tabs — unreached (queue Q1)

| queue-id | tab | what's needed |
|----------|-----|---------------|
| Q1-a | `/inventory/movements` | Navigate + screenshot; note table headers, empty state |
| Q1-b | `/inventory/stockOps` | Navigate + screenshot; confirm transfer + adjust dialog triggers |
| Q1-c | `/inventory/cycleCounts` | Navigate + screenshot; confirm create + detail dialog triggers |
| Q1-d | `/inventory/reservations` | Navigate + screenshot; confirm reservation dialog trigger |
| Q1-e | `/inventory/replenishment` | Navigate + screenshot; confirm suggestion list + burn-rate signals |
| Q1-f | `/inventory/uom` | Navigate + screenshot; confirm UomManagementComponent renders |

### Customer detail tabs — unreached (queue Q2)

Requires seeded customer record. All 11 tabs (Q2-a through Q2-k) plus `CustomerDetailComponent` shell are unreached.

### Dialogs — unreached (queue Q3)

All create/edit dialogs (Q3-a through Q3-r) are unreached. Highest priority without seeding: Q3-a (`NewLeadForkDialogComponent`), Q3-d (`AccountDialogComponent`), Q3-e (`CampaignDialogComponent`), Q3-g (`NewCustomerForkDialogComponent`), Q3-k (`NewVendorForkDialogComponent`), Q3-o (`NewPartForkDialogComponent`), Q3-q (`LotDialogComponent`).

### Parts detail + workflow steps — unreached (queue Q4)

All 13+ workflow step components (Q4-a through Q4-i) require seeded part. All part cluster components unreached.

### Populated states — unreached (queue Q6)

All `populated` and `error` states for every area require seeded records: lead (Q6-a), customer (Q6-b), vendor (Q6-c), part (Q6-d), part+BOM (Q6-e), inventory with stock (Q6-f), lot (Q6-g), receiving (Q6-h).

### Role-gated surfaces — unreached (queue Q5)

Role sweeps completed C5 (ui-scout 2026-05-22). Live-observed access: Manager=full; OfficeManager=blocked leads/parts/lots; PM=blocked vendors/inventory/lots; Engineer=blocked leads/customers/vendors; Worker=blocked all. `renders-for` values updated to reflect live gating, not just app.routes.ts top-level guards.

### Component checklist items not yet fully resolved

- `CustomerDetailComponent` tabs (orders/jobs/invoices/pricing/interactions) — not visible on this stack (capability/lifecycle gate); confirmed C5
- All price-list cluster components — states unreached; pricing tab not visible on this stack (Q2-i)
- `LeadDetailDialogComponent` — alternate trigger not found; panel confirmed C5 (c2-lead-detail-panel-open.png); see queue Q3-b
- `LeadConvertDialogComponent` — ✅ CLOSED C5: confirmed opens from CONVERT TO CUSTOMER (c2-lead-convert-dialog.png)
- `VendorDetailPanelComponent` sub-surfaces — ✅ CLOSED C5: all 4 tabs confirmed (c2-vendor-detail-panel.png + c2-vendor-panel-tab-*.png)
- `VendorPartListPanelComponent` — ✅ CLOSED C5: empty state confirmed in Catalog tab (c2-vendor-panel-tab-catalog.png)
- `VendorPartBulkImportDialogComponent` — states unreached; spawned from Catalog tab ADD PART flow
- `LotDetailPanelComponent` + `LotDetailDialogComponent` — needs seeded lot (0 lots on stack)
- All 13+ parts workflow steps + BOM/routing clusters — part stuck in Draft status; workflow loads but won't advance; needs re-seed with Active part
- `ReceivingInspectionQueueComponent` — needs receiving event to populate
- `UomManagementComponent` — ✅ CLOSED C5: populated with pre-seeded UOMs (c2-inventory-uom.png)
- Inventory Q1 tabs (movements/stockOps/cycleCounts/reservations/replenishment) — ✅ ALL CLOSED C5; all 6 confirmed rendered
- Role sweep Q5 — ✅ COMPLETED C5: Worker=blocked all; Engineer=blocked leads/customers/vendors; PM=blocked vendors/inventory/lots; OfficeManager=blocked leads/parts/lots; Manager=full access
- OQ1 (cluster-only tabs) — ✅ CLOSED C5: confirmed contacts/addresses/interactions are direct cluster mounts (no separate tab .ts)
- OQ4/OQ5 — still outstanding: parts step ordering; lots empty-state keyword
