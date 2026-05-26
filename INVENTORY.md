# Forge UI — Master Component Inventory (INVENTORY.md)

**Consolidated:** 2026-05-25 · analysis-planner (phase 08)
**Source HEAD:** forge-ui `e9b7802` (master-data / quote-to-cash / operations / platform / admin region docs) · access region committed at `c1098de`; shared-library committed at `43aeb4c`.
**Live sweep env:** `http://localhost:4200`, seeded demo data, `admin@forge.local / ForgeRun!2026` (2026-05-22) — folded in as §H.

This file **consolidates** (it does not replace) the per-region inventories under `analysis/inventory/`. Each region section §A–§G below is the folded-in source doc **verbatim** — every component's `name · type · file:line · contract · USAGE MAP` is preserved as written by its sole-writer cataloger. The per-region working queues (`*-queue.md`) are the **resolution audit trail**, NOT the source of live-needed items; the live-needed / open items are surfaced ahead in §0.5. Trust the committed region docs over any chat STATUS summary.

---

## §0 — Table of Contents

**Front matter (read before deriving the analysis journey):**
- [§0.1 Taxonomy (4-tag)](#01--taxonomy-4-tag--propagated-onto-every-entry)
- [§0.2 Provenance / folded-in files](#02--provenance--folded-in-files)
- [§0.3 Live-confirmation posture (per region)](#03--live-confirmation-posture--read-before-planning-live-phases)
- [§0.4 Carried defects (findings, not gaps)](#04--carried-defects-findings-to-analyze-not-inventory-gaps)
- [§0.5 Deferred-to-analysis (inline open-items)](#05--deferred-to-analysis-inline-open-items-surfaced-from-region-docs)
- [§0.6 Documented intentional terminals (covered-with-reason)](#06--documented-intentional-terminals-covered-with-reason--do-not-re-flag-as-gaps)

**Region inventories (folded-in verbatim):**
- [§A — Master-Data Region](#a--master-data-region) — leads, customers, vendors, parts, inventory
- [§B — Quote-to-Cash Region](#b--quote-to-cash-region) — quotes, sales-orders, purchasing/POs, shipments, invoices, payments, returns
- [§C — Operations Region](#c--operations-region) — kanban, backlog, planning, scheduling, shop-floor/kiosk, time-tracking, OEE, quality, MRP, assets, maintenance
- [§D — Platform Region](#d--platform-region) — dashboard, reports, search, notifications, chat, approvals, calendar, events
- [§E — Admin & Account Region](#e--admin--account-region) — admin tabs, account, employees, payroll, compliance forms, training/LMS
- [§F — Access & Edge Region](#f--access--edge-region) — auth, MFA enrolment, onboarding, setup-integrations, portal, mobile, AI runtime, headless form render, dev-tools
- [§G — Shared-Component Library](#g--shared-component-library) — 77 component dirs + directives/pipes/guards/interceptors/services
- [§H — Live UI Sweep Results](#h--live-ui-sweep-results-operations-area-seeded-env-2026-05-22) — operations-area, seeded env

---

## §0.1 — Taxonomy (4-tag — propagated onto every entry)

Every component entry across all regions carries one of these four terminal states. The downstream analysis phases use this to pre-classify what can be verified live vs. source-only in the current env.

| code | meaning |
|------|---------|
| `live-confirmed` | Observed and verified in the running app |
| `source-confirmed` | Present in source; not yet live-verified |
| `D3-terminal` | Capability gate OFF — component exists but cap not enabled; gate noted (covered-with-reason) |
| `D4-terminal` | Populated-blocked: non-seeded — route/component reached but no data to populate (covered-with-reason) |

`D3-terminal` and `D4-terminal` are **covered-with-reason closures, NOT gaps.** Only a route/component that appears in the forge-ui route table / features tree / shared tree and is *absent* from this inventory is a gap (that reconciliation is the completeness-auditor's job in the journey, not re-flagging these).

---

## §0.2 — Provenance / folded-in files

| § | Region | Source file | Commit/SHA | Lines |
|---|--------|-------------|------------|-------|
| §A | Master-Data | `analysis/inventory/master-data.md` | `e9b7802` (C2b) | 1441 |
| §B | Quote-to-Cash | `analysis/inventory/quote-to-cash.md` | `e9b7802` (Cycle 8) | 1015 |
| §C | Operations | `analysis/inventory/operations.md` | live sweep 2026-05-22 | 521 |
| §D | Platform | `analysis/inventory/platform.md` | live sweep 2026-05-22 | 372 |
| §E | Admin & Account | `analysis/inventory/admin.md` | `c1098de` (cycle 10) | 899 |
| §F | Access & Edge | `analysis/inventory/access.md` | `c1098de` (cycle 7d) | 317 |
| §G | Shared Library | `analysis/inventory/shared-library.md` | `43aeb4c` | 2623 |
| §H | Live UI Sweep | `analysis/inventory/sweep-final-results.md` | 2026-05-22 | 755 |

**Queue files — audit trail only, NOT folded in:** `admin-queue.md` (44/44 items resolved — queue empty), `access-queue.md` (Q-001..Q-007 closed), `master-data-queue.md`, `quote-to-cash-queue.md`, `operations-queue.md`, `platform-queue.md`. The live-needed items are surfaced in §0.5, not in these queues.

**Excluded tooling:** non-`.md` sweep artifacts in `analysis/inventory/` (`*.mjs`, `*.json`, `*.ps1`) are Playwright/sweep scripts, not inventory.

---

## §0.3 — Live-confirmation posture — READ BEFORE PLANNING LIVE PHASES

The regions were inventoried with **uneven live coverage**. The current shared stack is **non-seeded** for most populated states, so much of the spine is `source-confirmed` only. Plan the LIVE UI/UX + flow phases around this.

| Region | Posture | Notes for live phases |
|--------|---------|-----------------------|
| §A Master-Data | source-confirmed dominant; partial live | Customer-detail lifecycle/cap-gated tabs (orders/jobs/invoices/pricing/interactions) source-confirmed — modules/caps not enabled on stack. |
| §B Quote-to-Cash | live sweep done (Cycle 8) but key states blocked | `CAP-O2C-RMA`, `CAP-P2P-RFQ`, `CAP-O2C-RECURRING` disabled (DN-8): pages/dialogs render but all mutations return `capability-disabled`. SO list shows 0 rows by design (DN-1). |
| §C Operations | **live-confirmed dominant** (seeded sweep 2026-05-22, see §H) | MRP source-only (`CAP-PLAN-MRP` OFF, page hangs); Maintenance resolve dialog source-only (POST 404, no predictions to seed). |
| §D Platform | live sweep done | Reports guard discrepancy unresolved (PLT-Q-004, see §0.5). |
| §E Admin & Account | live sweep done (cycles 4–10); many D3/D4 | Heavy D3 (caps OFF: MFA, training, EDI, auto-PO, announcements, BI, email-sync, compliance-forms) + D4 (non-seeded). To exercise these live, the gating phase must FLIP CAPS and a seeding step is required. |
| §F Access & Edge | **substantially live-confirmed** (onboarding Steps 1–7 LC, cycles 5–7c) | Remaining = D3/D4 terminals: MFA/TOTP (no enrolled users), SSO (no provider), portal-authenticated pages (no portal users), AI-populated (no admin AI config). |
| §G Shared Library | source-confirmed via disk ground-truth (77 dirs / 12 top-level subdirs, Bash-verified) | Some spine components only source-confirmed because env is non-seeded/D4 (e.g. `StlViewerComponent`, `AddressFormComponent`, `DynamicQbFormControlComponent`). |

**Seed/cap dependency:** the capability-gating-UX phases must actually flip caps (admin inventory only *noted* gates without flipping). Flow/UX phases over populated-blocked (D4) surfaces require a **seeded env** — budget a seeding step or scope those phases explicitly.

---

## §0.4 — Carried defects (findings to analyze, NOT inventory gaps)

These are real defects observed during inventory. They are carried into the analysis journey as findings, not coverage gaps.

- **BE-1 — set-default → HTTP 500 (non-atomic default swap).** `POST /api/v1/working-calendars/:id/set-default` returns HTTP 500 — unique `is_default` constraint violation; the default swap is non-atomic. Source: admin.md:893 (ADM-WC-01). *(Prior handshake referred to this as the "reference-data set-default" 500; the committed doc locates it at working-calendars — carry the working-calendars location as authoritative; reference-data set-default is the analogous pattern to check.)* Full-stack analysis deferred.
- **AUTHZ-1 — admin-tab role guard not firing.** Both **Manager AND OfficeManager** reach `/admin/users` without the expected redirect to `compliance`. `ADMIN_ONLY_TABS` redirect logic at `admin.component.ts:97-99` is not enforcing. Live-confirmed (ADM-Q-012, cycles 4 + 6).
- **ROUTE-1 — routing-shadow bug.** `/setup/integrations` is shadowed by the `setup/:token` param route (Angular matches "integrations" as a token value); `SetupIntegrationsComponent` is only reachable programmatically. Fix: reorder the static route before the param route in `app.routes.ts`. Source: access.md Q-001.
- **DISCREPANCY — PM/Engineer role-vs-guard mismatches.** DN-4 (PM reaching Q2C routes the source guard excludes — suspect multi-role JWT seed) and PLT-Q-004 (Engineer reaching `/reports` despite guard) — both need a JWT/role-provisioning check to resolve. See §0.5.

---

## §0.5 — Deferred-to-analysis (inline open-items, surfaced from region docs)

These are the **live-needed / open / investigate** items carried inline in the region docs (the `*-queue.md` files are drained and are NOT the source of these). Each downstream analysis phase should resolve the items in its area.

**§B Quote-to-Cash:**
- **DN-3** — `EstimateFormDialogComponent` exists but grep finds zero callers: dead code or pending wiring — confirm.
- **DN-4 / DN-7** — PM live access to `/purchasing /shipments /invoices /payments` contradicts source role guards; resolve by inspecting the JWT for `pm@forge.local` (multi-server-role seed suspected). DN-7 closed the `/purchase-orders` case; the rest remain.
- **DN-6** — SO detail-panel field inventory incomplete (Playwright couldn't resolve selectors); requires a source read of `sales-order-detail-panel.component.html`.
- **DN-8** — `CAP-O2C-RMA`, `CAP-P2P-RFQ`, `CAP-O2C-RECURRING` disabled: list/populated/mutation states are D4/cap-blocked; need cap-ON + seed to exercise live.

**§C Operations:**
- **MRP** (`/mrp`) — `CAP-PLAN-MRP` OFF; page hangs on API calls; MRP-01..04 documented source-only. Needs cap-ON to verify live.
- **Maintenance resolve** (`/maintenance/predictions`) — predictions POST returns 404; no way to seed; resolve dialog (MAINT-02) source-only.

**§D Platform:**
- **PLT-Q-004** — Engineer observed reaching `/reports` with no redirect though source blocks non-Admin/Manager/PM; re-verify (guard cache vs role provisioning).

**§E Admin & Account:** all 44 queue items resolved to terminal states; remaining live work is the D3 cap-flips + D4 seeds enumerated in §0.6 (training, MFA, EDI, auto-PO, announcements, BI, email-sync, compliance forms, currencies/exchange-rate, discovery wizard, onboarding steps).

**§F Access & Edge:** D3/D4 terminals remain — MFA/TOTP enrolment (no enrolled users), SSO callback (no provider configured), portal-authenticated surfaces (no portal users provisioned), AI runtime populated/chat states (no admin AI config). `MobileHomeComponent` confirmed dead (LC-orphan: `/m/home` → catch-all → `/dashboard`).

**§G Shared Library:** initial pass was source-only awaiting live sweep; D4 source-only spine includes `StlViewerComponent` (no seeded STL parts), `AddressFormComponent` (only used in D4 `SetupComponent`), `DynamicQbFormControlComponent` (populated state needs window-injection render path).

**§A Master-Data:** customer-detail tabs orders/jobs/invoices/pricing/interactions are lifecycle/cap-gated and source-confirmed only (modules/caps not enabled on stack).

---

## §0.6 — Documented intentional terminals (covered-with-reason — DO NOT re-flag as gaps)

These were closed during inventory **with a stated reason** (cap OFF and/or non-seeded). They are complete-with-reason, not coverage gaps. The completeness-auditor should treat them as covered.

| Item | Surface | Reason (terminal) |
|------|---------|-------------------|
| ADM-Q-013 / ADM-Q-038 | `MfaSetupDialogComponent` complete-step + `MfaRecoveryCodesDialogComponent` (ACC-SEC-02/03) | `CAP-IDEN-AUTH-MFA` OFF; TOTP enrolment not completed (D3). Scan-QR step-1 is live-confirmed. |
| ADM-Q-017 | `CompleteI9DialogComponent` (ADM-CMP-04) | D4 — no employee with I-9 Section 1 signed + Section 2 pending in non-seeded env. Fields fully source-confirmed. |
| ADM-Q-022 / ADM-Q-027 | `TrainingDetailPanelComponent` + `TrainingDetailDialogComponent` (ADM-TRN-08/09) | D4 (no enrolled users) + D3 (`CAP-HR-TRAINING` OFF). Read-only panel + thin dialog wrapper source-confirmed. |
| ADM-Q-028 | `WalkthroughPreviewDialogComponent` (ADM-TRN-06) | D4 (no walkthrough-type module) + D3 (`CAP-HR-TRAINING` OFF). Trigger source-confirmed. |

Plus the broader D3 cap-OFF set (`CAP-EXT-AI-ASSISTANT`, `CAP-CROSS-INTEG-EDI`, `CAP-P2P-AUTOPO`, `CAP-EXT-ANNOUNCEMENTS`, `CAP-CROSS-BI-EXPORT`, `CAP-EXT-EMAIL-SYNC`, `CAP-QC-COMPLIANCE-FORMS`) and the D4 non-seeded set across admin — all covered-with-reason per each region doc's states column.

---
---

## §A — Master-Data Region

_Folded-in verbatim from `analysis/inventory/master-data.md`. Sole-writer cataloger content preserved as-is._

# Master-Data Region — Component Inventory

> **Phase:** master-data · **Method:** observe-and-record (no code changes)
> **Single writer:** source-cataloger owns this file. Scout writes queue only.
> **Source on disk:** HEAD e9b7802 (drift resolved — running app matches source; file:line mappings are authoritative)
> **Last commit:** _C2b-source-prelocation_

---

## Cross-links

- **PO-Receiving (purchase-orders side):** The `ReceiveDialogComponent` launched from a PO detail panel is inventoried in [`quote-to-cash.md`](quote-to-cash.md) (Segment 4). This doc's `/inventory/receiving` entry covers the inventory-tab view only.

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
- [x] `components/receiving-inspection-queue/receiving-inspection-queue.component.ts` — source-confirmed; **C6ag: NOT used in any template** — grep finds no imports or usages outside its own files; ReceivingInspectionQueueComponent is dead code (not embedded in inventory.component or any other template); the `/inventory/receiving` tab shows `app-data-table` directly via `receivingHistory()` signal
- [x] `components/uom-management/uom-management.component.ts`

#### lots/
- [x] `lots.component.ts`
- [x] `components/lot-detail-dialog/lot-detail-dialog.component.ts` — source-confirmed `lot-detail-dialog.component.ts:12`; thin wrapper around `LotDetailPanelComponent`; `LotDetailDialogData { lotId, lotNumber }`; trigger: row-click on lots list; panel content confirmed C8 (LOT-20260522-001); dialog wrapper live observation not attempted separately (panel side-panel opened directly)
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
| states | `empty` — "no leads" empty-state observed C1 (non-seeded run); `populated` — Beta Industries row visible with STATUS=NEW, SOURCE=Direct, FOLLOW-UP=—, CREATED=05/21/2026 confirmed C4b; `loading` inferred; `error` — n/a (by design: error state requires simulated API failure; not triggered on dev stack) |
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
| states | `empty` — "get started" empty state + table headers (HEADER/REQUIRED?/ALSO ACCEPTED) visible; PARSE PASTED ROWS button visible (non-seeded, 2026-05-22); `populated` — n/a (by design: populated state is transient — shows parsed rows only during active paste session; no persistent intake records displayed) |
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
| states | `empty` — shell rendered, PULL NEXT 5 button visible, no items in queue (non-seeded, 2026-05-22); `populated` — not observed (PULL NEXT returned HTTP 500 on stack during C9 sweep; queue items are served one-at-a-time after a successful PULL; blocked by server error on this stack) |
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
| states | `empty` — shell rendered, NEW CAMPAIGN button visible (non-seeded, 2026-05-22); `populated` — not observed (no campaigns seeded on stack; populated state shows campaign rows with name/strategy/status/date range/lead count) |
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
| states | `empty` — shell rendered, no primary action button detected (non-seeded, 2026-05-22); `populated` — not observed (no suppression entries seeded on stack) |
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
| states | `empty` — shell rendered, no primary action button detected (non-seeded, 2026-05-22); `populated` — not observed (no sample requests seeded on stack) |
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
| states | `empty` — shell rendered, NEW ACCOUNT button visible (non-seeded, 2026-05-22); `populated` — not observed (no accounts seeded on stack; accounts created via AccountDialog from this page) |
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
| states | `populated` — Beta Industries lead opened C4b: STATUS=NEW, SOURCE=Direct, CLASSIFICATION=precision_manufacturing; status chip rail (NEW/CONTACTED/QUOTING/LOST/CONVERT), CAP FIT NOT ASSESSED, NDA NONE, ITAR N/A, CONVERT TO CUSTOMER action, RECENT COMMUNICATIONS 0, ACTIVITY feed empty; `empty` — n/a (by design: panel only renders in context of a selected lead row; no persistent empty-panel state exists) |
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
| states | `populated` — confirmed C6f: row-click on leads list → `mat-dialog-container` with `APP-LEAD-DETAIL-DIALOG` tag = `LeadDetailDialogComponent` directly observed; `c6f-lead-detail-full.png`; trigger: `leads.component.ts:284` `openLeadDetail()` → `DetailDialogService.open(LeadDetailDialogComponent)` (row-click); content: Beta Industries lead (STATUS=NEW etc.) via wrapped `LeadDetailPanelComponent` |
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
| states | `create` — **confirmed C6ae**: `/leads/queue` keyboard 'C' disposition → "SCHEDULE CALLBACK" dialog; fields: Callback date (app-datepicker), Callback time (app-select, default 9:00 AM); CANCEL + SCHEDULE (schedule icon + app-validation-button); appComps: `app-dialog` + `app-datepicker` + `app-select` + `app-validation-button`; note: queue PULL API returns 500 in demo stack; `c6ae-callback-dialog.png` |
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
| states | `empty` — "no customers" empty-state observed C1; `populated` — 2 rows (Acme Corp × 2, email/phone/ACTIVE/0 contacts/0 jobs/created date columns) confirmed C4b; `loading` inferred; `error` — n/a (by design: error state requires simulated API failure; not triggered on dev stack) |
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
| states | `empty` — shell rendered (non-seeded, 2026-05-22); `populated` — not observed (no customer contacts seeded; populated state shows contacts table across all customers) |
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
| states | `empty` — shell rendered, PROVISION ACCESS button visible (non-seeded, 2026-05-22); `populated` — not observed (no portal access provisioned; populated state shows provisioned access records with email/status columns) |
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
| states | `empty` — shell rendered (non-seeded, 2026-05-22); `populated` — not observed (no segments created on stack) |
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
| states | `empty` — shell rendered (non-seeded, 2026-05-22); `populated` — n/a (by design: populated state is transient — shows parsed rows only during active CSV import session) |
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
| `orders` | `CustomerOrdersTabComponent` | `pages/customer-detail/tabs/customer-orders-tab.component.ts:23` | none | Active lifecycle only | **C6ah confirmed**: `app-customer-orders-tab` + `app-data-table` + `app-empty-state`; "No orders" empty state; tab visible after customer has openDocs>0 (estimate created); `c6ah-customer-orders.png` |
| `jobs` | `CustomerJobsTabComponent` | `pages/customer-detail/tabs/customer-jobs-tab.component.ts:24` | none | Active lifecycle only | **C6ah confirmed**: `app-customer-jobs-tab` + `app-data-table` + `app-empty-state`; "No jobs" empty state; `c6ah-customer-jobs.png` |
| `invoices` | `CustomerInvoicesTabComponent` | `pages/customer-detail/tabs/customer-invoices-tab.component.ts:24` | none | Active lifecycle only | **C6ah confirmed**: `app-customer-invoices-tab` + `app-data-table` + `app-empty-state`; "No invoices" empty state; `c6ah-customer-invoices.png` |
| `pricing` | `CustomerPricingTabComponent` | `pages/customer-detail/tabs/customer-pricing-tab.component.ts:40` | none | Active lifecycle only | **C6ah confirmed**: `app-customer-pricing-tab` + `app-empty-state` (no data-table); "No pricing" empty state; URL `/customers/2/pricing` previously redirected to overview during Prospect lifecycle; works with Active; `c6ah-customer-pricing.png` |
| `interactions` | `CustomerInteractionsClusterComponent` _(cluster, no tab cmp)_ | `components/customer-clusters/customer-interactions-cluster.component.ts:37` | `CAP-MD-CUSTOMER-INTERACTIONS` | all (when cap enabled) | **C6ai confirmed**: enabled cap via `PUT /api/v1/capabilities/CAP-MD-CUSTOMER-INTERACTIONS/enabled`; `app-customer-interactions-cluster` + `app-select` + `app-data-table` + `app-empty-state`; "No interactions"; tab appears in Active layout (11 tabs); `c6ai-customer-interactions.png` |
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
| states | `empty` — confirmed C4b: "ADD CONTACT … No contacts yet ADD FIRST CONTACT"; `populated` — not observed (no contacts added to Acme Corp during sweep) |
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
| states | `empty` — confirmed C5 (ui-scout 2026-05-22): "No addresses on file" with location-off icon; `c2-customer-detail-addresses.png`; `populated` — not observed (no addresses added to Acme Corp during sweep) |
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
| states | `empty` — confirmed C4b: "ACTIVITY ALL CONVERSATION NOTES HISTORY No activity yet." — EntityActivitySectionComponent wrapped; `populated` — not observed (no edit actions recorded on customer during sweep; activity populates on first field save) |
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
| states | `populated` — confirmed C9 via `?detail=customer:2` URL: "ACME CORP ×" dialog title; OVERVIEW section: Name*=Acme Corp, Company Name (blank), Email=contact@acme.com, Phone=(555) 100-2000, Active toggle checked; ACCOUNT DETAILS: Customer Name/Email/Phone/Status ACTIVE/Customer Since 05/21/2026; REGULATED INDUSTRIES section (FDA-regulated, AS9100/aerospace, IATF 16949/automotive, ITAR-controlled/defense toggles all off); footer: CLOSE + OPEN CUSTOMER PAGE buttons; 640px dialog; trigger: `?detail=customer:{id}` URL param or cross-entity EntityLink clicks; not triggered by row-click (navigates full page) |
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
| states | `create` — confirmed C8: 3 fork cards: (1) flash_on "Quick add Most common — Drop in a name + a couple of contact bits and keep moving."; (2) person_add "Convert from lead — Pick an existing lead and run it through the convert stepper"; (3) tune "Guided setup — Step through identity, engagement, addresses, and billing for complex customer relationships."; CANCEL button; triggered by + NEW CUSTOMER button |
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
| states | `create` — confirmed C8 by clicking fork-card[2] "Guided setup": "GUIDED CUSTOMER SETUP" title; 5-step progress header: 1 Identi… → 2 Engag… → 3 Addr… → 4 Credi… → 5 Review; Step 1 "Who is this customer? Capture the basics first." fields: Display name* (required), Company name, Primary contact name, Email, Phone; CANCEL + NEXT buttons; 720px dialog; trigger: `customers.component.ts:325` `openGuidedCreateCustomer()` when fork returns 'guided' |
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
| states | `empty` — "no vendors" empty-state observed C1; `populated` — 3 rows (Global Supply Co, Steel Supply Co × 2; columns COMPANY NAME/CONTACT/EMAIL/PHONE/ACTIVE/POS/CREATED) confirmed C4b; `loading` inferred; `error` — n/a (by design: error state requires simulated API failure; not triggered on dev stack) |
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
| states | `populated` — confirmed C6f: row-click on vendors list → `mat-dialog-container` with both `app-vendor-detail-dialog` (`hasVDD=true`) and `app-vendor-detail-panel` (`hasVDP=true`) present; trigger: `vendors.component.ts:148` `openVendorDetail()` → `DetailDialogService.open(VendorDetailDialogComponent)` (row-click); `vendors.component.ts:134` `autoOpenFromUrl()` for `?detail=vendor:{id}`; content: VendorDetailPanelComponent fully rendered inside dialog |
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
| states | `create` — confirmed C7 via vendor fork "Guided" tile: "NEW VENDOR — GUIDED SETUP" title; 6-step progress: 1 Identi… → 2 Relati… → 3 Addr… → 4 Terms → 5 Suppl… → 6 Review; Step 1 "Who is this vendor and how do you reach them?" fields: Company Name* (required), Contact, Email, Phone; CANCEL + NEXT buttons; trigger: `vendors.component.ts:189` fork returns 'guided' (fork has 2 cards: Quick add / Guided setup) |
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
| states | `populated` — confirmed C4b in VendorDetailPanel SCORECARD tab: grade letter A, score 100/100, date range 2025-05-22–2026-05-22; breakdown: ON-TIME DELIVERY 100%, QUALITY ACCEPTANCE 100%, QTY ACCURACY 100%, $0.00 TOTAL SPEND; detailed table (DELIVERY 40%: POs 0, Lines Received 0, On-Time 100%, Late 0; QUALITY 30%: Inspected 0, Rejected 0, NCRs 0, Acceptance 100%; PRICE 20%: $0.00, 0% variance; QUANTITY 10%: 100%); `empty` — n/a (by design: scorecard initializes with computed defaults for any vendor; a no-score scenario cannot occur for an existing vendor — score is always present even with 0 POs) |
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
| states | `empty` — "No parts found" empty-state observed C1+C4b (0 parts in stack); `populated` — confirmed C8/C9 (2026-05-22): PRT-00001 Widget A (Make/Component/Active) visible in parts table with filter=Active; 8 ghost rows for in-flight Draft workflow runs (unnamed, step=basics) also visible; table columns: PART#/NAME/REV/PROCUREMENT/CLASS/STATUS/PRICE/BOM; card-grid toggle confirmed; `loading` inferred; `error` — n/a (by design: error state requires simulated API failure) |
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
| `PartBomStepComponent` | `workflow/part-bom-step/part-bom-step.component.ts:51` | `bom` / BILL OF MATERIALS | `create` — **confirmed C6l**: "List every component this assembly uses"; ADD COMPONENT button; empty-state "No components yet"; BACK + SKIP + CONTINUE; OPTIONAL label (step is skippable); ADD COMPONENT uses custom `app-dialog` (0 mat-dialog-containers) — fields: Part (EntityPicker search), Qty* (required, default=1), Lead Time, Ref Des, Notes; CANCEL + SAVE (⚠️1); `c6l-bom-add-component.png` |
| `PartRoutingStepComponent` | `workflow/part-routing-step/part-routing-step.component.ts:17` | `routing` / ROUTING | `create` — **confirmed C6p**: "Define the operation steps to manufacture this part"; empty-state "No operations defined"; REFRESH STATUS + ADD OPERATION buttons; BACK + CONTINUE; **BLOCKING** — CONTINUE rejects with "Routing operations not yet defined" until ≥1 operation added; ADD OPERATION uses `mat-dialog-container` (mat-count=1) — required: Step # + Title; optional: Est. Minutes, Instructions, Work Center (entity picker), References Operation (select), QC Checkpoint toggle, Subcontract Operation toggle; CANCEL + ADD buttons; `c6p-step4-op-dialog-open.png` |
| `PartCostingStepComponent` | `workflow/part-costing-step/part-costing-step.component.ts:36` | `costing` / COST | `create` — **confirmed C6q**: "Set how this part's cost is calculated and (for Tier 1) the manual price"; COSTING MODE radio: Tier 1 Manual override (default-selected) / Tier 2 Departmental rates / Tier 3 Activity-based; Manual cost override $ field (data-testid="costing-manual-override"); "CURRENTLY DISPLAYED COST: Not set"; BACK + CONTINUE; **BLOCKING** — CONTINUE rejects with "Cost not yet set" until Tier 1 cost entered; CONTINUE triggers save via WorkflowService `registerStepForm` callback; `c6q-step5-cost-before.png` |
| `PartAlternatesStepComponent` | `workflow/part-alternates-step/part-alternates-step.component.ts:11` | `alternates` / ALTERNATES | `create` — **confirmed C6r**: "Optional — list substitute or equivalent parts for procurement flexibility"; empty-state "No alternate parts defined"; ADD ALTERNATE button; BACK + SKIP + MARK COMPLETE; OPTIONAL label; ADD ALTERNATE uses custom `app-dialog` (0 mat-dialog-containers) — fields: Alternate Part (EntityPicker search), Type (Substitute/etc), Priority, Conversion Factor, Notes, Approved toggle, Bidirectional toggle; CANCEL + SAVE; MARK COMPLETE finalizes workflow → navigates to `/parts` list; part status transitions Draft→Active; `c6r-step6-alternates.png`, `c6r-step6-add-alternate-dialog.png` |
| `PartSourcingStepComponent` | `workflow/part-sourcing-step/part-sourcing-step.component.ts:24` | `sourcing` / PREFERRED VENDOR | `create` — "Pick the default vendor for this part. Lead time, MOQ, pack size, OEM identity, and pricing are entered per-vendor on the next step"; Preferred Vendor entity-picker search; BACK + CONTINUE |
| `PartVendorStepComponent` | `workflow/part-vendor-step/part-vendor-step.component.ts:24` | `vendor` / SUBCONTRACT VENDOR | `create` — Subcontract path: "Pick the subcontract vendor for this part"; Preferred Vendor entity-picker search; BACK + CONTINUE |
| `PartVendorPartsStepComponent` | `workflow/part-vendor-parts-step/part-vendor-parts-step.component.ts` | `vendorParts` / VENDOR SOURCES | `create` — thin wrapper around `VendorSourcesPanelComponent`; bridges workflow shell `entity` input to panel inputs; captures mfr name, mfr PN, vendor SKU, per-vendor pricing; BACK + SKIP + CONTINUE; OPTIONAL (required:false in all combos) — **source-confirmed C6z** from WorkflowSeedData.cs: step id="vendorParts", present in B1-B6 + S1-S2 combos (post-Sourcing), absent from M1-M4 |
| `PartQualityStepComponent` | `workflow/part-quality-step/part-quality-step.component.ts:26` | `quality` / QUALITY | `create` — "Receiving inspection, traceability, ABC class, hazmat, and shelf life"; fields: Traceability (Bulk/no tracking), Requires Receiving Inspection toggle, ABC Class, Hazmat Class, Shelf Life (days); BACK + MARK COMPLETE |
| `PartShippingStepComponent` | `workflow/part-shipping-step/part-shipping-step.component.ts:25` | `shipping` / SHIPPING | `create` — "Shipping & Physical — Mass, dimensions, and volume. Drives shipping rate quotes and inventory cube"; fields: Weight (each), Weight Unit (g), Length, Width, Height, Dimension Unit (mm), Volume, Volume Unit (mL); BACK + CONTINUE |
| `PartSalesHooksStepComponent` | `workflow/part-sales-hooks-step/part-sales-hooks-step.component.ts:24` | `salesHooks` / SALES SETUP | `create` — "Sales-side parameters for resold finished goods"; fields: Sales UoM; "INFERRED SALES PRICE $0.00 Default — no pricing configured"; BACK + SKIP + MARK COMPLETE; OPTIONAL label |
| `PartFlagsStepComponent` | `workflow/part-flags-step/part-flags-step.component.ts:22` | `flags` / FLAGS | `create` — "Phantom-specific flags: kit, configurator, and backflush policy"; fields: Is Kit toggle, Is Configurable toggle, Backflush Policy; BACK + SKIP + MARK COMPLETE; OPTIONAL label |
| `PartSourcePartStepComponent` | `workflow/part-source-part-step/part-source-part-step.component.ts:20` | `sourcePart` / SOURCE PART | `create` — "The pre-finishing in-house part that's sent to the subcontractor"; Source Part entity-picker search; BACK + CONTINUE |
| `PartToolAssetStepComponent` | `workflow/part-tool-asset-step/part-tool-asset-step.component.ts:23` | `toolAsset` / TOOLING ASSET | `create` — "Link this part to its tooling Asset record (for cavity, life, calibration tracking)"; Tooling Asset entity-picker search; BACK + CONTINUE |

> All workflow steps render-for: Admin, Manager, Engineer, PM. All confirmed in `create` state via workflow runs C4f/C4g (2026-05-22). `edit` mode — not reachable via direct `/parts/:id` navigation (shows "Loading workflow…" for Active parts without an attached pending run; re-editing requires launching a new revision run from the part detail panel, which was not attempted in any sweep).

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
| `BomTreeComponent` / `app-bom-tree` | `features/parts/components/bom-tree/bom-tree.component.ts:9` | Visual BOM hierarchy tree — **confirmed C6ak** (ASM-00001 BOM tab, tree view): shows root node + PRT-00001 "Widget A" child (MAKE, qty=1, delete button); input: `[entries]="part.bomEntries"`; `c6ak-bom-tree-view.png` |
| `BomRevisionHistoryComponent` | `features/parts/components/bom-revision-history/bom-revision-history.component.ts:17` | BOM revision change history — **confirmed C6x** (ASM-00001 BOM tab, both views): "Revision history Each component change creates an immutable snapshot. v1 CURRENT 5/22/2026 1 lines Component added"; `c6x-bom-table-view.png`, `c6x-bom-tree-view-2.png` |

---

#### Part cluster components — source-confirmed (live observation requires seeded Active part)

All mounted in `PartDetailPanelComponent` and/or `PartWorkflowPageComponent`; renders-for Admin/Manager/Engineer/PM.

| component / selector | file:line (@Component) | purpose |
|----------------------|------------------------|---------|
| `PartIdentityClusterComponent` / `app-part-identity-cluster` | `part-clusters/part-identity-cluster.component.ts:24` | Part number, description, procurement source |
| `PartCostClusterComponent` / `app-part-cost-cluster` | `part-clusters/part-cost-cluster.component.ts:19` | Standard cost, cost roll-up |
| `PartInventoryClusterComponent` / `app-part-inventory-cluster` | `part-clusters/part-inventory-cluster.component.ts:20` | On-hand, reserved, available quantities |
| `PartFilesClusterComponent` / `app-part-files-cluster` | `part-clusters/part-files-cluster.component.ts:14` | Drawings / attachments via FileUploadZoneComponent — **confirmed C6x** (ASM-00001 FILES tab): "FILES cloud_upload Drag files here or click to browse Max 50MB per file No [attachments]"; `app-file-upload-zone` + `app-empty-state`; `c6x-files-tab.png` |
| `PartActivityClusterComponent` / `app-part-activity-cluster` | `part-clusters/part-activity-cluster.component.ts:10` | Wraps EntityActivitySectionComponent for part changes — **confirmed C6x** (ASM-00001 ACTIVITY tab): "ACTIVITY ALL CONVERSATION NOTES HISTORY No activity yet."; `app-entity-activity-section` nested inside; `c6x-activity-tab.png` |
| `PartAlternatesClusterComponent` / `app-part-alternates-cluster` | `part-clusters/part-alternates-cluster/part-alternates-cluster.component.ts:13` | Alternate part substitution list |
| `PartLandedCostComponent` / `app-part-landed-cost` | `part-clusters/part-landed-cost.component.ts:25` | Landed cost breakdown; uses EntityLinkComponent for PO links |
| `PartMaterialClusterComponent` / `app-part-material-cluster` | `part-clusters/part-material-cluster/part-material-cluster.component.ts:23` | Raw material spec — **confirmed C6v** (PRT-00001 MATERIAL tab): "MATERIAL & PHYSICAL" section; fields: Material Spec, Weight (Unit: g), Length, Width, Height (Unit: mm), Volume (Unit: mL); all empty on seeded part; `c6v-material-tab.png` |
| `PartMrpClusterComponent` / `app-part-mrp-cluster` | `part-clusters/part-mrp-cluster/part-mrp-cluster.component.ts:21` | MRP planning parameters — **confirmed C6v** (PRT-00001 MRP tab): "MRP PLANNING" section; MRP-Planned toggle, Lot Sizing Rule (select), Min Order Qty (input), Planning Fence (days), Demand Fence (days); footer note "Lead time resolves from preferred VendorPart when configured."; all empty on seeded part; `c6v-mrp-tab.png` |
| `PartPricingClusterComponent` / `app-part-pricing-cluster` | `part-clusters/part-pricing-cluster/part-pricing-cluster.component.ts:46` | Sales pricing tiers — **confirmed C6x** (ASM-00001 PRICING tab): "CURRENT EFFECTIVE PRICE No price configured" + "PRICE HISTORY No price history yet."; `app-empty-state`; `c6x-pricing-tab.png` |
| `PartQualityClusterComponent` / `app-part-quality-cluster` | `part-clusters/part-quality-cluster/part-quality-cluster.component.ts:27` | Quality control settings — **confirmed C6x** (ASM-00001 QUALITY tab): "QUALITY & COMPLIANCE" section; Requires Receiving Inspection toggle, Inspection Frequency (select, default "Every Receipt"), Skip After N Receipts (input); `app-toggle` + `app-select` + `app-input`; `c6x-quality-tab.png` |
| `PartRoutingClusterComponent` / `app-part-routing-cluster` | `part-clusters/part-routing-cluster/part-routing-cluster.component.ts:14` | Manufacturing routing steps list |
| `PartUomClusterComponent` / `app-part-uom-cluster` | `part-clusters/part-uom-cluster/part-uom-cluster.component.ts:19` | Unit-of-measure conversions — **source note**: imported in `part-detail-panel.component.ts:97` but `app-part-uom-cluster` does not appear in any HTML template; component exists but is not currently rendered in any live view |

> All paths above are relative to `features/parts/components/`.

---

#### Other parts components

| component | file | type | purpose |
|-----------|------|------|---------|
| `PartDetailPanelComponent` | `features/parts/components/part-detail-panel/part-detail-panel.component.ts:82` | panel | Slide-in detail for list view — **confirmed C9 (PRT-00001 Make/Component)**: 12 tabs: IDENTITY (Part Number, Procurement Source=Make, Inventory Class=Component, Name*, Revision, Description, Status, BARCODE section with PRINT+REGENERATE), MATERIAL, PURCHASE HISTORY, INVENTORY, MRP, ROUTING, COST, PRICING, QUALITY, ALTERNATES, ACTIVITY, FILES. **Also confirmed C6s/C6t (PRT-00003 BUY/Component)**: 10 tabs: IDENTITY, SOURCES, PURCHASE HISTORY, INVENTORY, QUALITY, COST, PRICING, ALTERNATES, ACTIVITY, FILES — BUY layout drops MATERIAL/MRP/ROUTING, adds SOURCES (VendorSourcesPanelComponent); tab CSS class: `detail-tab` / `detail-tab--active`; `c6s-prt-00003-detail-dialog.png` |
| `PartDetailDialogComponent` | `features/parts/components/part-detail-dialog/part-detail-dialog.component.ts:10` | dialog | Full part detail in a dialog — **confirmed C9+C6s**: opens from clicking ACTIVE part row; `mat-dialog-container` wrapper around `PartDetailPanelComponent`; tab layout varies by procurement source (MAKE: 12 tabs; BUY: 10 tabs) |
| `PartQuickCreateDialogComponent` | `features/parts/components/part-quick-create-dialog/part-quick-create-dialog.component.ts:48` | dialog | Quick-create part inline |
| `PartsCardGridComponent` | `features/parts/components/parts-card-grid/parts-card-grid.component.ts:10` | table | Card-grid layout for parts list — **confirmed C8**: toggle via icons in page header (table_rows / grid_view); card shows archive icon placeholder thumbnail, PRT-00001, "Widget A", ACTIVE badge |
| `RoutingComponent` | `features/parts/components/routing/routing.component.ts:19` | cluster | Routing operations table — **confirmed C6v** (PRT-00001 ROUTING tab, after ADD OPERATION): list view shows operation cards (Step# / Title / edit / delete); header has view-toggle (list / flow) + ADD OPERATION; empty state: "No operations defined"; populated state: "10 Assembly" card; `c6v-routing-list-view-2.png` |
| `RoutingFlowViewComponent` | `features/parts/components/routing-flow-view/routing-flow-view.component.ts:8` | cluster | Visual flow of routing steps — **confirmed C6v**: renders inside `RoutingComponent` when flow-view toggle active (account_tree icon); `[operations]` input; shows "OP 10 Assembly" node; `c6v-routing-flow-view.png` |
| `OperationDialogComponent` | `features/parts/components/operation-dialog/operation-dialog.component.ts:39` | dialog | Create / edit routing operation — **confirmed C6f/C6p**: ROUTING step → ADD OPERATION → "ADD OPERATION" dialog (mat-dialog-container); 4 tabs: Details (always visible), Materials/Files/Activity (edit mode only); Details tab: Step #* (required), Est. Minutes, Title* (required), Instructions, Work Center search, References Operation dropdown, QC Checkpoint toggle, Subcontract Operation toggle; Create mode: ADD button; Edit mode: SAVE CHANGES button; `c6f-operation-dialog.png`, `c6p-step4-op-dialog-filled.png` |
| `PartAlternatesTabComponent` | `features/parts/components/part-alternates-tab/part-alternates-tab.component.ts:30` | tab | Alternates tab within part detail |
| `SerialNumbersTabComponent` | `features/parts/components/serial-numbers-tab/serial-numbers-tab.component.ts:21` | tab | Serial numbers tab within part detail — **confirmed C6aa**: PRT-00001 (traceabilityType=Serial set via API PATCH) → 13th tab "qr_code_2 Serials" appears; empty state: "No serial numbers registered for this part" + NEW SERIAL button; Status filter select; appComps: `app-serial-numbers-tab` + `app-select` + `app-empty-state`; tab only visible when `part.traceabilityType === 'Serial'`; `c6aa-serials-tab.png` |
| `VendorSourcesPanelComponent` | `features/parts/components/vendor-sources-panel/vendor-sources-panel.component.ts:128` | panel | Vendor sources side panel — **confirmed C6t** (empty): "No vendor sources yet. Click Edit to add a vendor source for this part."; `c6t-tab-sources.png`; **confirmed C6z2** (populated): PRT-00003 SOURCES tab after adding to Global Supply Co catalog → shows vendor entry "Global Supply Co" with USD currency, "NO TIERS — NEEDS PRICING" badge + "PRICE TIERS" / "SHOW HISTORY" action links, Vendor Part # / External SKU / Manufacturer / Manufacturer Part # / Lead Time fields inline; appComps: `app-vendor-sources-panel` + `app-input` + `app-select` + `app-datepicker` + `app-textarea`; `c6z2-prt003-sources-tab.png` |
| `VendorPartFormDialogComponent` | `features/parts/components/vendor-parts-cluster/vendor-part-form-dialog.component.ts:43` | dialog | Add/edit vendor-part record — **confirmed C6h**: vendor CATALOG tab → ADD PART → "ADD VENDOR SOURCE" dialog; fields: Part (search), Vendor is Manufacturer toggle, Vendor Part #/External SKU, Manufacturer, Manufacturer Part #, Lead Time (days), Min Order Qty, Pack Size, Country of Origin, HTS Code, Approved (AVL) toggle, Preferred Source toggle, Last Quoted date, Notes; SAVE button; `c6h-vendor-add-part-form-dialog.png` |
| `VendorPartPriceTiersDialogComponent` | `features/parts/components/vendor-parts-cluster/vendor-part-price-tiers-dialog.component.ts:33` | dialog | Edit vendor price tiers — **confirmed C6z**: Vendor Catalog row → "Price Tiers" action (aria-label) → "PRT-00001 — GLOBAL SUPPLY CO / PRICE TIERS" dialog; empty state: "No price tiers — add one to enable per-quantity pricing." + ADD TIER button; form fields: Min Qty, Unit Price ($), Currency (USD), Effective From, Effective To, Notes; CLOSE button; appComps: `app-dialog` + `app-empty-state` + `app-input` + `app-currency-input` + `app-select` + `app-datepicker` + `app-validation-button`; `c6z-price-tiers-dialog.png` |
| `VendorPartPriceTierHistoryDialogComponent` | `features/parts/components/vendor-parts-cluster/vendor-part-price-tier-history-dialog.component.ts:32` | dialog | View vendor price-tier history — **confirmed C6z**: Vendor Catalog row → "Price tier history" action → "PRT-00001 — GLOBAL SUPPLY CO / PRICE TIER HISTORY" dialog; empty state: "No tier history yet." + CLOSE button; appComps: `app-dialog` + `app-empty-state`; `c6z-price-tier-history-dialog.png` |
| `VendorPartListPanelComponent` | `features/parts/components/vendor-parts-cluster/vendor-part-list-panel.component.ts:26` | panel | Vendor catalog part list — **confirmed C6y** (populated): Vendor detail Catalog tab after adding PRT-00001 → table row "PRT-00001 / Widget A / --- / --- / --- / --- / --- / ---" + check_circle Approved + star_border Preferred + history + edit + delete actions; row action buttons: Price Tiers (aria-label="Price Tiers"), Preferred Source (star_border), Price tier history, Edit, Remove from catalog; empty state "This vendor has no parts in the catalog yet."; appComps: `app-vendor-part-list-panel` + `app-data-table`; `c6y-vendor-catalog-after-add.png` |
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
| states | `empty` — confirmed C4b: "This vendor has no parts in the catalog yet." ADD PART + IMPORT CSV buttons visible; `populated` — confirmed C6y (2026-05-22): Vendor Catalog tab after adding PRT-00001 → row "PRT-00001 / Widget A" with approve (check_circle) / preferred (star_border) / price-tiers / price-tier-history / edit / delete row actions; appComps: `app-vendor-part-list-panel` + `app-data-table`; `c6y-vendor-catalog-after-add.png` |
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
| states | `create` — confirmed C6g: vendor CATALOG tab → IMPORT CSV button → "IMPORT CATALOG — GLOBAL SUPPLY CO" title; drag-and-drop file zone (CSV up to 5 MB); BROWSE button + DOWNLOAD TEMPLATE CSV link; `c6g-vendor-import-csv-dialog.png` |
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
| states | All 9 tabs confirmed live (C1+C4, 2026-05-22): `stock`→ **populated C6af** — "1 PARTS WITH STOCK"; PRT-00001 row: onHand=60, reserved=0, available=60; `app-data-table` with cols PART#/DESCRIPTION/MATERIAL/ON HAND/RESERVED/AVAILABLE; `c6af-inventory-stock-tab.png`; also observed empty state text "No inventory data. Stock appears here when parts are received into bin locations."; `locations`→ shell/tree rendered; `movements`→ empty "0 RECENT MOVEMENTS"; `receiving`→ shell/empty; `stockOps`→ TRANSFER + ADJUST action buttons visible; `cycleCounts`→ empty "0 CYCLE COUNTS", NEW COUNT button; `reservations`→ empty "0 reservations", RESERVE STOCK button; `replenishment`→ empty "No pending replenishment suggestions"; `uom`→ UomManagementComponent renders (UNITS OF MEASURE heading); receiving tab — populated confirmed C6ag (2026-05-22): "2 RECORDS" — PO-00002/PO-00003 rows for PRT-00003, qty=10, BIN-A1-01, RECEIVE GOODS button; `c6ag-inventory-receiving-tab.png` |
| purpose | Tabbed inventory management shell; each tab is an in-component view (no sub-routing) |

Tabs within InventoryComponent (in-component, NOT separate route components):

| tab | key columns / signals | in-component dialogs | embedded component |
|-----|-----------------------|---------------------|--------------------|
| `stock` | partNumber, description, material, onHand, reserved, available (`:82`) | — | — |
| `locations` | Tree view: Area→Rack→Shelf→Bin; `locationTree` signal `:100`; `selectedLocation` `:100`; `binContents` `:101` | Add-location dialog: `showLocationDialog` `:152`; form `:153` — name, locationType, parentId, barcode, description | — |
| `movements` | entityName, quantity, fromLocation, toLocation, reason, movedBy, movedAt (`:107`) | — | — |
| `receiving` | PO #, Part #, qty, receivedBy, location, lotNumber, date (`:120`); `showReceiveDialog` `:170`; form `:172` — poLineId, qty, locationId, lotNumber, notes; **C6ag populated**: "2 RECORDS" — PO-00002/PO-00003 rows for PRT-00003, qty=10, BIN-A1-01; RECEIVE GOODS button; `c6ag-inventory-receiving-tab.png`; note: `ReceivingInspectionQueueComponent` (`app-receiving-inspection-queue`) NOT embedded here — dead code | Receive dialog: `showReceiveDialog` `:170` | ~~`ReceivingInspectionQueueComponent`~~ (dead code — not used in any template) |
| `stockOps` | No dedicated table; hub for transfer + adjust actions — **confirmed C6i**: TRANSFER STOCK + ADJUST STOCK action cards; TRANSFER header button + ADJUST header button | Transfer: **confirmed C6i** — custom `DialogComponent` (not mat-dialog-container): "TRANSFER STOCK" overlay; Source Bin Content ID, Destination Location (select), Quantity, Notes; CANCEL + TRANSFER (⚠️3); `c6i-inv-stockops-transfer.png`. Adjust: **confirmed C6i** — "ADJUST STOCK" overlay; Bin Content ID, New Quantity, Reason, Notes; CANCEL + ADJUST (⚠️3); `c6i-inv-stockops-adjust.png` | — |
| `cycleCounts` | locationName, countedBy, date, status (Pending/Approved/Rejected), lineCount, variance (`:133`); `showCycleCountDialog` `:249`; `showCreateCycleCountDialog` `:253` | Create cycle count: form `:254` — locationId, notes; Detail dialog: `showCycleCountDialog` | — |
| `reservations` | partNumber, description, locationPath, qty, jobNumber, jobTitle, notes, createdAt (`:220`); `showReservationDialog` `:233` | Reserve: **confirmed C6i** — custom `DialogComponent` (not mat-dialog-container): "RESERVE STOCK" overlay; Part ID, Bin Content ID, Job ID (optional), Quantity, Notes; CANCEL + RESERVE (⚠️3); RESERVE STOCK header button; `c6i-inv-reservations-after-click.png` | — |
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
| route | `/inventory/receiving` (NOT embedded — dead code) |
| file | `features/inventory/components/receiving-inspection-queue/receiving-inspection-queue.component.ts:12` |
| renders-for | ⚠️ DEAD CODE — not imported or used in any template; `app-receiving-inspection-queue` selector not found in any .html file |
| states | **C6ag**: component exists in source (columns: partNumber, partDescription, poNumber, vendorName, receivedQuantity, receivedAt, daysWaiting; overdue row highlights); but NOT rendered anywhere — no live observation possible. The receiving tab (`/inventory/receiving`) shows receiving history via `receivingHistory()` signal in a plain `app-data-table`, not via this component. |
| purpose | Queue of inbound items pending inspection — defined but never wired into a page |

---

#### UomManagementComponent
| field | value |
|-------|-------|
| component | `UomManagementComponent` |
| type | panel |
| route | `/inventory/uom` (embedded in uom tab) |
| file | `features/inventory/components/uom-management/uom-management.component.ts:21` |
| renders-for | Admin, Manager |
| states | `populated` — confirmed C5: UomManagementComponent renders with pre-seeded UOM table (SQFT/Square Foot, SQIN/Square Inch, EA/Each, PR/Pair, DZ/Dozen, PK/Pack); sub-tabs: UNITS OF MEASURE + CONVERSIONS; + NEW UOM button; `c2-inventory-uom.png`. CONVERSIONS sub-tab **confirmed C6i**: populated with pre-seeded conversion rows — CM→MM ×10, DZ→EA ×12, FT→IN ×12, FT→M ×0.3048, GAL→QT ×4, HR→MIN ×60; columns: FROM, TO, FACTOR, REVERSIBLE (checkmark); + NEW CONVERSION button; `c6i-uom-conversions.png` |
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
| states | `empty` — table rendered with 0 rows (SEARCH button visible, 2026-05-22); `populated` — confirmed C8 (2026-05-22): LOT-20260522-001 visible with columns LOT NUMBER/PART NUMBER/DESCRIPTION/QUANTITY/JOB/SUPPLIER LOT/EXPIRES/CREATED; row: LOT-20260522-001 / PRT-00001 / Test widget / 50 / — / SUP-LOT-001 / blank / 05/22/2026 |
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
| states | `populated` — confirmed C8 (LOT-20260522-001, PRT-00001, qty 50 on stack): panel title "LOT-20260522-001 ×"; PART NUMBER: PRT-00001; QUANTITY (blank — lot created without job-linkage); TRACEABILITY HISTORY section (empty — no job/PO events); HISTORY section: "No activity yet."; read-only; trigger: row-click on lots list |
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
| states | `populated` — confirmed C8: row-click on lots list → panel title "LOT-20260522-001 ×" (PART NUMBER=PRT-00001, QUANTITY blank, TRACEABILITY HISTORY empty, "No activity yet"); thin wrapper around `LotDetailPanelComponent`; `LotDetailDialogData { lotId, lotNumber }`; `c6g-lot-panel-details.png`; dialog component tag (`app-lot-detail-dialog`) not separately verified vs panel tag |
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

_Cycle 1: seed. Cycle 2: shared-cmp reconciliation complete (18 items resolved). Cycle 2b: pre-source-location complete — all areas with file:line + sub-surface tables; 2 new vendor-parts-cluster discoveries added. Cycle 3: states from scout sweep C1 folded into per-component entries; remaining open states recorded in Open Items block below. Cycle 4 (source-cataloger, 2026-05-22): 72 new checklist ticks (32 routes + 40 feature-dir); all 6 previously-blocked inventory tabs confirmed; 8 dialogs observed (create state); lead/vendor/customer detail panels/pages observed with populated states; all missing line numbers filled. Count at C4 close: 90/163. C4c (2026-05-22): LeadConvertDialogComponent 3-step wizard confirmed; customer estimates/quotes/addresses tabs empty states confirmed. C4f/C4g (2026-05-22): parts workflow fully unlocked — 18 new checklist ticks (part-workflow-page + /parts/:id route + 16 step/form components); all 13+ workflow step components confirmed in `create` mode via 8 workflow runs; express + guided modes both observed. Count: 109/163 reconciled. C6 (source-cataloger, 2026-05-22): checklist driven to 163/163 COMPLETE via source-confirmation. C7-C9 (2026-05-22): live observations — GuidedCustomerDialog, GuidedVendorDialog, CustomerDetailDialog, PartDetailDialog (12 tabs), PartsCardGrid, LotDetailPanel. C6f-C10 (2026-05-22): additional live confirmations — LeadDetailDialog (row-click mat-dialog), VendorDetailDialog (row-click mat-dialog), VendorPartBulkImportDialog (IMPORT CATALOG), VendorPartFormDialog (ADD VENDOR SOURCE), OperationDialog (ADD OPERATION), PartDetailDialog COST+ALTERNATES tabs, PartInventoryStep MANUFACTURING. C6l-C6r (2026-05-22): parts workflow steps 3-6 confirmed live — BomStep, RoutingStep (blocking), CostingStep (blocking), AlternatesStep (MARK COMPLETE → PRT-00003 Active). C6aa-C6z2 (ui-scout, 2026-05-22): remaining cluster/tab components confirmed live — SerialNumbersTab, BomTree, BomRevisionHistory, RoutingComponent, RoutingFlowView, VendorSourcesPanel, VendorPartPriceTiers/TierHistory, InventoryComponent receiving tab (C6ag), CallbackSchedulerDialog (C6ae), customer tab gates confirmed (C6ah/C6ai), ReceivingInspectionQueueComponent confirmed dead code (not embedded in any template). Source-cataloger C10 (2026-05-22): all open-state tokens eliminated from states fields — error states classified n/a by design; transient form states classified n/a by design; sub-page populated states documented as not-observed with reasons._

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
- ✅ **Resolved C6aa**: `SerialNumbersTabComponent` (traceabilityType=Serial PATCH → PRT-00001 now shows SERIALS tab; empty state "No serial numbers registered" + NEW SERIAL)
- **Source note**: `PartUomClusterComponent` — imported in `part-detail-panel.component.ts:97` but `app-part-uom-cluster` not used in any HTML template; not live-observable in any current view
- ✅ **Resolved C6v-C6x**: `BomTreeComponent` (C6x — tree view populated with PRT-00001 entry), `BomRevisionHistoryComponent` (C6x — v1 snapshot), `PartQualityClusterComponent` (C6x), `PartPricingClusterComponent` (C6x), `PartActivityClusterComponent` (C6x), `PartFilesClusterComponent` (C6x), `FileUploadZoneComponent` (C6x), `RoutingComponent` (C6v), `RoutingFlowViewComponent` (C6v), `OperationDialogComponent` (C6f/C6p/C6v), `VendorSourcesPanelComponent` (C6t), `PartAlternatesTabComponent` (C6t/C6h)
- ✅ **Resolved C6y-C6z2**: `VendorPartListPanelComponent` (C6y — populated catalog with PRT-00001 row + action buttons), `VendorPartPriceTiersDialogComponent` (C6z — empty state PRICE TIERS dialog), `VendorPartPriceTierHistoryDialogComponent` (C6z — empty state TIER HISTORY dialog), `VendorSourcesPanelComponent` populated state (C6z2 — PRT-00003 SOURCES tab showing Global Supply Co vendor-part)
- **Needs receiving event / PO**: `ReceivingInspectionQueueComponent`
- ✅ **Resolved C6ae**: `CallbackSchedulerDialogComponent` — confirmed via mocked queue lead + 'C' keyboard shortcut; "SCHEDULE CALLBACK" dialog with Callback date + Callback time (9:00 AM default) + CANCEL + SCHEDULE
- **Trigger not available from list**: `VendorQuickCreateDialogComponent` (EntityPicker inline-create), `VendorPartBulkImportDialogComponent` (Catalog IMPORT CSV button seen but not clicked)
- **Error states**: Not triggered on any component (no API error simulation performed)
- **Confirmed C6f-C10 (previously blocked)**:
  - `GuidedCustomerDialogComponent` — confirmed C8: 5-step wizard (Identity→Engagement→Addresses→Credit & tax→Review); fork-card[2] tile
  - `GuidedVendorDialogComponent` — confirmed C7: 6-step wizard (Identity→Relationships→Addresses→Terms→Supply→Review); vendor fork guided tile
  - `CustomerDetailDialogComponent` — confirmed C9 via `?detail=customer:2`: "ACME CORP ×" overlay; OVERVIEW (Name/Company Name/Email/Phone/Active), ACCOUNT DETAILS, REGULATED INDUSTRIES, CLOSE + OPEN CUSTOMER PAGE buttons
  - `PartDetailPanelComponent` / `PartDetailDialogComponent` — confirmed C9: 12-tab dialog (Identity/Material/Purchase History/Inventory/MRP/Routing/Cost/Pricing/Quality/Alternates/Activity/Files); COST tab C6h (Manual Cost Override, COST CALCULATION ID, LANDED COST empty state); ALTERNATES tab C6h ("No alternate parts defined" + ADD ALTERNATE)
  - `PartsCardGridComponent` — confirmed C8/C9: card view tile visible on /parts (card/list view toggle)
  - `LotDetailPanelComponent` / `LotDetailDialogComponent` — confirmed C8: LOT-20260522-001 panel (PART NUMBER=PRT-00001, QUANTITY blank, TRACEABILITY HISTORY empty)
  - `LeadDetailDialogComponent` — confirmed C6f: row-click → `mat-dialog-container` with `APP-LEAD-DETAIL-DIALOG` tag directly observed
  - `VendorDetailDialogComponent` — confirmed C6f: row-click → `mat-dialog-container` with hasVDD=true, hasVDP=true
  - `VendorPartBulkImportDialogComponent` — confirmed C6g: CATALOG IMPORT CSV → "IMPORT CATALOG — GLOBAL SUPPLY CO" dialog (drag-and-drop CSV, BROWSE, DOWNLOAD TEMPLATE CSV)
  - `VendorPartFormDialogComponent` — confirmed C6h: CATALOG ADD PART → "ADD VENDOR SOURCE" dialog (Part search, Vendor is Manufacturer toggle, Vendor Part #, MPN, Lead Time, MOQ, Pack Size, CoO, HTS Code, Approved toggle, Preferred toggle, Last Quoted, Notes, SAVE)
  - `OperationDialogComponent` — confirmed C6f: ROUTING tab ADD OPERATION → "ADD OPERATION" dialog (Step #*, Title*, Work Center search, QC Checkpoint, Subcontract Operation toggle)
  - `PartInventoryStepComponent` (MANUFACTURING step) — confirmed C6g: STEP 2 OF 6 shows Min Stock Threshold, Reorder Point, Reorder Quantity, Safety Stock Days, Stock UoM (mat-select, pre-seeded UoM list), Default Bin search; validation error "Stock unit of measure not yet set" blocks CONTINUE
  - `PartBomStepComponent` (BOM step) — confirmed C6l: STEP 3 OF 6; "No components yet" empty-state; ADD COMPONENT uses custom `app-dialog` (0 mat-dialog-containers); fields: Part search, Qty*(required), Lead Time, Ref Des, Notes; CANCEL + SAVE (⚠️1); step skippable via SKIP; `c6l-bom-add-component.png`
  - `PartRoutingStepComponent` (Routing step) — confirmed C6p: STEP 4 OF 6; "No operations defined" empty-state; ADD OPERATION opens `mat-dialog-container`; required: Step#, Title; ADD button; CONTINUE blocked until ≥1 op added ("Routing operations not yet defined"); `c6p-step4-op-dialog-open.png`, `c6p-step4-op-dialog-filled.png`
  - `PartCostingStepComponent` (Cost step) — confirmed C6q: STEP 5 OF 6; COSTING MODE radio (Tier 1 Manual override default); Manual cost override input; "CURRENTLY DISPLAYED COST: Not set"; CONTINUE blocked ("Cost not yet set"); CONTINUE saves via WorkflowService callback; `c6q-step5-cost-before.png`, `c6q-step5-cost-filled.png`
  - `PartAlternatesStepComponent` (Alternates step) — confirmed C6r: STEP 6 OF 6; "No alternate parts defined" empty-state; ADD ALTERNATE opens custom `app-dialog` (0 mat-dialog-containers); fields: Alternate Part search, Type, Priority, Conversion Factor, Notes, Approved toggle, Bidirectional toggle; CANCEL + SAVE; MARK COMPLETE completes workflow → `/parts` list; PRT-00003 status transitions Draft→**Active**; `c6r-step6-alternates.png`, `c6r-step6-add-alternate-dialog.png`, `c6r-workflow-final.png`
  - `VendorSourcesPanelComponent` — confirmed C6t (empty): "No vendor sources yet."; confirmed C6z2 (populated): PRT-00003 SOURCES tab shows Global Supply Co entry with "NO TIERS — NEEDS PRICING" badge + inline field form; `c6t-tab-sources.png`, `c6z2-prt003-sources-tab.png`
  - `VendorPartListPanelComponent` — confirmed C6y: Vendor Catalog tab populated with PRT-00001 row; action buttons: Price Tiers / Preferred Source / Price tier history / Edit / Remove from catalog; `c6y-vendor-catalog-after-add.png`
  - `VendorPartPriceTiersDialogComponent` — confirmed C6z: Catalog row "Price Tiers" action → dialog with ADD TIER form (Min Qty / Unit Price / Currency / Effective From/To / Notes); empty state "No price tiers — add one"; `c6z-price-tiers-dialog.png`
  - `VendorPartPriceTierHistoryDialogComponent` — confirmed C6z: Catalog row "Price tier history" action → read-only dialog; empty state "No tier history yet."; `c6z-price-tier-history-dialog.png`
  - `PartCostClusterComponent` + `PartLandedCostComponent` — confirmed C6t: COST tab shows Manual Cost Override=$10; COST CALCULATION ID=---; LANDED COST empty state "No receipts with captured freight yet — landed cost will populate once you receive a PO and record actual freight."; `c6t-tab-cost.png`
  - `PartAlternatesTabComponent` (in part detail panel) — confirmed C6t: "No alternate parts defined" + "+ ADD ALTERNATE" button; BUY/Component layout; `c6t-tab-alternates.png`
  - `PartInventoryClusterComponent` — confirmed C6t: Min Stock / Reorder Point / Reorder Quantity / Safety Stock (days) all empty; Traceability=None; ABC Class empty; `c6t-tab-inventory.png`
  - `PartDetailPanelComponent` / `PartDetailDialogComponent` (BUY/Component layout) — confirmed C6s/C6t: 10 tabs (Identity, Sources, Purchase History, Inventory, Quality, Cost, Pricing, Alternates, Activity, Files); no MATERIAL/MRP/ROUTING tabs (those are MAKE-only); tab CSS class `detail-tab` / `detail-tab--active`; `c6s-prt-00003-detail-dialog.png`
  - `RoutingComponent` (app-routing) — confirmed C6v: ADD OPERATION via ADD button in ROUTING tab of PRT-00001 part detail; operation saved; list view shows "10 Assembly" operation card with edit/delete; `c6v-routing-list-view-2.png`
  - `RoutingFlowViewComponent` (app-routing-flow-view) — confirmed C6v: toggled by account_tree icon in RoutingComponent header; shows "OP 10 Assembly" flow node; `c6v-routing-flow-view.png`
  - `PartMaterialClusterComponent` (app-part-material-cluster) — confirmed C6v: MATERIAL tab of PRT-00001 (Make/Component); "MATERIAL & PHYSICAL" section; Material Spec, Weight/Length/Width/Height/Volume fields (all empty on seeded part); `c6v-material-tab.png`
  - `PartMrpClusterComponent` (app-part-mrp-cluster) — confirmed C6v: MRP tab of PRT-00001; "MRP PLANNING" section; MRP-Planned toggle, Lot Sizing Rule, Min Order Qty, Planning Fence (days), Demand Fence (days); `c6v-mrp-tab.png`
  - `BomTreeComponent` (app-bom-tree) — confirmed C6ak: BOM tab of ASM-00001 (Make/Subassembly), tree view; shows root → PRT-00001 "Widget A" (MAKE, qty=1, delete button); `c6ak-bom-tree-view.png`
  - `BomRevisionHistoryComponent` (app-bom-revision-history) — confirmed C6x: visible in both BOM table and tree views; "v1 CURRENT 1 lines Component added"; always renders below BOM view toggle; `c6x-bom-table-view.png`
  - `PartQualityClusterComponent` (app-part-quality-cluster) — confirmed C6x: ASM-00001 QUALITY tab; "QUALITY & COMPLIANCE"; Requires Receiving Inspection toggle, Inspection Frequency (Every Receipt), Skip After N Receipts; `c6x-quality-tab.png`
  - `PartPricingClusterComponent` (app-part-pricing-cluster) — confirmed C6x: ASM-00001 PRICING tab; "CURRENT EFFECTIVE PRICE No price configured" + "PRICE HISTORY No price history yet."; `c6x-pricing-tab.png`
  - `PartActivityClusterComponent` (app-part-activity-cluster) + `EntityActivitySectionComponent` — confirmed C6x: ASM-00001 ACTIVITY tab; "ACTIVITY ALL CONVERSATION NOTES HISTORY No activity yet."; `c6x-activity-tab.png`
  - `PartFilesClusterComponent` (app-part-files-cluster) + `FileUploadZoneComponent` (app-file-upload-zone) — confirmed C6x: ASM-00001 FILES tab; "FILES cloud_upload Drag files here or click to browse Max 50MB per file"; `c6x-files-tab.png`
  - Make+Subassembly part layout (M2) — confirmed C6w/C6x: 13 tabs (Identity, Material, Purchase History, BOM 1, Routing, Inventory, MRP, Cost, Pricing, Quality, Alternates, Activity, Files); part number prefix "ASM-"; workflow steps: Basics → BOM → Routing → Cost → Quality → Alternates; tab CSS class `detail-tab` / `detail-tab--active` (BUTTON elements only, not SPAN icons)
  - `VendorPartListPanelComponent` — confirmed C6y: Vendor Catalog tab populated (PRT-00001 row); row action buttons discovered via aria-label: "Price Tiers", "Preferred Source", "Price tier history", "Edit", "Remove from catalog"; empty state: "This vendor has no parts in the catalog yet."; appComps: `app-vendor-part-list-panel` + `app-data-table`; `c6y-vendor-catalog-after-add.png`
  - `VendorPartPriceTiersDialogComponent` — confirmed C6z: Vendor Catalog row "Price Tiers" action (aria-label) → "PRT-00001 — GLOBAL SUPPLY CO / PRICE TIERS" dialog; empty state + ADD TIER form (Min Qty, Unit Price $, Currency USD, Effective From, Effective To, Notes); appComps: `app-dialog` + `app-empty-state` + `app-input` + `app-currency-input` + `app-select` + `app-datepicker` + `app-validation-button`; `c6z-price-tiers-dialog.png`
  - `VendorPartPriceTierHistoryDialogComponent` — confirmed C6z: Vendor Catalog row "Price tier history" action → "PRICE TIER HISTORY" dialog; empty state "No tier history yet."; appComps: `app-dialog` + `app-empty-state`; `c6z-price-tier-history-dialog.png`
  - `VendorSourcesPanelComponent` (populated) — confirmed C6z2: PRT-00003 SOURCES tab after adding to Global Supply Co catalog → "Global Supply Co / USD / NO TIERS — NEEDS PRICING" entry + "PRICE TIERS" + "SHOW HISTORY" link + inline editable fields (Vendor Part # / External SKU / Manufacturer / Manufacturer Part # / Lead Time); appComps: `app-vendor-sources-panel` + `app-input` + `app-select` + `app-datepicker` + `app-textarea`; `c6z2-prt003-sources-tab.png`
  - Workflow step order — source-confirmed C6z from `WorkflowSeedData.cs`: M1 (Make+Comp): basics→manufacturing→bom(opt)→routing→costing→alternates(opt); M2 (Make+Sub): basics→bom→routing→costing→quality(opt)→alternates(opt); M3 (Make+FG): basics→bom→routing→costing→shipping→quality(opt)→alternates(opt); M4 (Make+Tool): basics→toolAsset→bom→routing; B1 (Buy+Raw): basics→sourcing→vendorParts(opt)→inventory→quality(opt)→costing; B2 (Buy+Comp): basics→sourcing→vendorParts(opt)→inventory→costing; B3 (Buy+Sub): basics→sourcing→vendorParts(opt)→inventory→costing→quality; B4 (Buy+FG): basics→sourcing→vendorParts(opt)→inventory→shipping→costing; B5 (Buy+Consumable): basics→sourcing→vendorParts(opt)→inventory→costing; B6 (Buy+Tool): basics→toolAsset→sourcing→vendorParts(opt)→inventory→costing; S1 (Sub+Comp): basics→sourcePart→vendor→vendorParts(opt)→costing→quality; S2 (Sub+Sub): basics→sourcePart→bom→vendor→vendorParts(opt)→costing→quality; P1 (Phantom+Sub): basics→bom→flags(opt); P3 (Phantom+FG): basics→bom→salesHooks(opt)
  - `PartVendorPartsStepComponent` — source-confirmed C6z: thin wrapper around `VendorSourcesPanelComponent`; step id="vendorParts"; present in B1-B6 + S1-S2 combos (post-Sourcing/Vendor), always optional (required:false); `PartUomClusterComponent` (app-part-uom-cluster) — imported in `part-detail-panel.component.ts:97` but NOT used in any HTML template; not live-observable
  - `SerialNumbersTabComponent` (app-serial-numbers-tab) — confirmed C6aa: PATCH PRT-00001 traceabilityType=Serial → 13th tab "qr_code_2 SERIALS" appears in part detail; empty state "No serial numbers registered for this part" + NEW SERIAL button + Status filter select; tab condition: `part.traceabilityType === 'Serial'`; appComps: `app-serial-numbers-tab` + `app-select` + `app-empty-state`; `c6aa-serials-tab.png`
  - `CallbackSchedulerDialogComponent` (app-callback-scheduler-dialog) — confirmed C6ae: `/leads/queue` → keyboard 'C' disposition (ctx.route() mock intercept to simulate queued lead); "SCHEDULE CALLBACK" dialog; Callback date (app-datepicker) + Callback time (app-select, 9:00 AM default) + CANCEL + SCHEDULE (app-validation-button); appComps: `app-dialog` + `app-datepicker` + `app-select` + `app-validation-button`; queue PULL API returns 500 in demo stack (FOR UPDATE SKIP LOCKED backend bug); `c6ae-callback-dialog.png`


---

## §B — Quote-to-Cash Region

_Folded-in verbatim from `analysis/inventory/quote-to-cash.md`. Sole-writer cataloger content preserved as-is._

# Quote-to-Cash Region — Component Inventory

> **Phase:** quote-to-cash · **Method:** observe-and-record (no code changes)
> **Single writer:** source-cataloger owns this file; scout owns quote-to-cash-queue.md only
> **Source on disk:** HEAD e9b7802 (file:line mappings from source)
> **Last updated:** Cycle 8 — Q5-a corrected live/populated; Q3-c trigger source added; DN-9 added; Q6-a–d confirmed in Segment 9

---

## Architectural Data Notes (from live sweep)

**DN-1 — SO list uses job-projected endpoint:** `GET /api/v1/sales-orders` (Phase 3 F1/WU-18 read path) only surfaces SOs confirmed and transitioned to production-stage jobs. Draft SOs at `/api/v1/orders` are invisible to the list. SO-00001 (Draft) correctly returns 0 rows in UI.

**DN-2 — Detail dialogs are panel wrappers:** `PoDetailDialogComponent`, `ShipmentDetailDialogComponent`, `InvoiceDetailDialogComponent`, `PaymentDetailDialogComponent`, `CustomerReturnDetailDialogComponent` are thin `mat-dialog` wrappers around their panel counterparts. Panel is canonical; dialog just provides overlay context.

**DN-3 — EstimateFormDialogComponent not wired:** Component exists but grep of all `.ts` files finds zero callers. Not reachable from current navigation. Dead code or pending wiring.

**DN-4 — PM live access contradicts source route guards (investigate):** Live sweep observed PM reaching `/purchasing`, `/shipments`, `/invoices`, `/payments` with page-header rendered. Source `app.routes.ts:157,163,181,187,193` gates all five routes as `roleGuard('Admin','Manager','OfficeManager')` — PM is not listed. `roleGuard` calls `auth.hasAnyRole()` which is a pure `user.roles.includes()` check with no capability bypass (`auth.service.ts:96-99`). **Most likely cause: `pm@forge.local` was seeded with multiple server-side roles (PM + OfficeManager or similar).** `renders-for` fields in catalog entries use source-authoritative role lists; the role matrix records live observation. The discrepancy should be resolved by inspecting the JWT for `pm@forge.local`.

**DN-5 — `/sales-orders/recurring` does not render app-page-header:** All four accessible roles (Admin, OfficeManager, Manager, PM) reach the route but `app-page-header` is absent (uses `PageLayoutComponent` + `ToolbarComponent` instead).

**DN-6 — SO detail panel field selectors not found by Playwright:** Tab content DOM uses plain `<td>` or custom layout elements rather than `.field-label`/`dt`/`.prop-label` selectors; screenshots captured at `q2c-cycle5/so-detail-tab*.png`. Full field inventory requires source read of `sales-order-detail-panel.component.html`.

**DN-7 — PM on `/purchase-orders` blocked by roleGuard (source-confirmed):** `app.routes.ts:163` gates `/purchase-orders` as `roleGuard('Admin','Manager','OfficeManager')` — PM is not listed. PM is redirected to `/dashboard`. The Cycle 4/5 live observation of "PM accessible + job-board content" was an artifact of `pm@forge.local` carrying multiple server roles (see DN-4). PO list entry `renders-for` correctly excludes PM. Gap closed.

**DN-9 — Customer detail has 11 tabs; only 4 are Q2C-owned:** Full tab set: Overview · Contacts · Addresses · Estimates · Quotes · Orders · Jobs · Invoices · Pricing · Interactions · Activity. Q6 targeted only Q2C-relevant tabs (Estimates/Quotes/Orders/Invoices). Remaining tabs observed: Contacts (0 rows), Addresses (0 rows), Jobs (1 row — J-1), Pricing (0 rows), Interactions (0 rows), Activity (0 rows). The Jobs tab surfaces production jobs and is not Q2C-owned; Contacts/Addresses/Interactions are capability-gated (`CAP-MD-CUSTOMER-CONTACTS/ADDRESSES/INTERACTIONS`).

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
- [x] `components/off-tier-prompt-dialog/off-tier-prompt-dialog.component.ts` ← **terminal: requires vendor pricing-tier config, untriggerable in this env**

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
- [x] `components/tracking-timeline/tracking-timeline.component.ts`
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
| states | **dead code** — zero callers in all `.ts` files (DN-3); no live trigger exists on `/quotes` page or elsewhere; real live estimate-create surface is `CustomerEstimatesTabComponent` at `/customers/:id/estimates` (Segment 9) |
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
| states | empty (observed live — 0 rows, NEW RECURRING TEMPLATE button visible); populated list state: **terminal** — CAP-O2C-RECURRING disabled server-side; recurring order templates cannot be created via API (see DN-8) |
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
| states | **terminal** — UI renders; requires vendor pricing-tier config not present in this env; off-tier PO line condition untriggerable; no live populated state observed |
| purpose | Warn buyer when one or more PO lines are priced off the vendor's tier; per-line choice: accept as one-off exception OR update vendor tier price |

**Trigger source:** `po-dialog.component.ts:309-317` — `checkTierVariance()` subscribes; if `result.lines.filter(l => l.isOffTier).length > 0`, sets `offTierLines` + `showOffTierPrompt = true` instead of calling `submitPo()`.

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
| states | populated (SH-00001 FedEx TRACK-TEST-001 — flat panel, no tabs; fields: Description \| Quantity; action buttons: Get Rates \| Mark Shipped \| Track; TrackingTimeline lazy-loaded via "Track" button — requires Shipped status + carrier tracking data) |
| purpose | Full shipment detail: header info, line items, package list, tracking, label generation, shipping-rates action |

**Sub-components:**

| field | value |
|-------|-------|
| component | `app-tracking-timeline` / TrackingTimelineComponent |
| type | cluster |
| route | `/shipments` (within shipment detail panel) |
| file | `features/shipments/components/tracking-timeline/tracking-timeline.component.ts:7` |
| renders-for | Admin, Manager, OfficeManager |
| states | populated (trigger: "Track" button in shipment detail action bar → lazy `GET /api/v1/shipments/{id}/tracking`; component enters DOM only after click if API returns non-null; observed: Status "In Transit" · TRACK-TEST-001 · Est. Delivery 05/25/2026 · 2 events: "Package picked up / Origin Facility" + "In transit to destination / Distribution Center"; layout: carrier icon + status badge + tracking # + est. delivery + vertical event timeline) |
| purpose | Visual timeline of carrier tracking events for a shipment; lazy-loaded on demand via "Track" button |

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

## Segment 9: Customer Detail — Q2C Cross-Region Surface

> **Ownership note:** `CustomerDetailComponent` and its tab components live in `features/customers/` — owned by the Customers/Master-Data region. This segment catalogs only the 4 Q2C-facing tabs that surface Q2C entities (Estimates, Quotes, Orders, Invoices). The remaining 7 tabs (Overview, Contacts, Addresses, Jobs, Interactions, Pricing, Activity) belong to the master-data inventory.

### `/customers/:id/:tab` — CustomerDetailComponent

| field | value |
|-------|-------|
| component | `app-customer-detail` / CustomerDetailComponent |
| type | page |
| route | `/customers/:id/:tab` |
| file | `features/customers/pages/customer-detail/customer-detail.component.ts:56` |
| renders-for | Admin, Manager, PM, OfficeManager (`app.routes.ts:99`) |
| states | populated (customer 1 observed; 11 tabs: overview \| contacts \| addresses \| estimates \| quotes \| orders \| jobs \| invoices \| interactions \| pricing \| activity; contacts/addresses/interactions tab-capability-gated by CAP-MD-CUSTOMER-CONTACTS/ADDRESSES/INTERACTIONS) |
| purpose | Customer detail shell; resolver-driven tab layout keyed on customer lifecycle bucket (Active/Prospect/Archived); Identity first, Activity last |

---

| field | value |
|-------|-------|
| component | `app-customer-estimates-tab` / CustomerEstimatesTabComponent |
| type | tab |
| route | `/customers/:id/estimates` |
| file | `features/customers/pages/customer-detail/tabs/customer-estimates-tab.component.ts:34` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | populated (1 estimate observed live — Title \| Estimated Amount \| Status \| Valid Until \| Created) |
| purpose | Simple dollar-amount estimates for this customer (NOT the compute-calculator `EstimateFormDialog`); inline create/edit dialog (Title, Description, Estimated Amount, Valid Until, Notes, Status); Delete action; **Convert-to-Quote** action (ConfirmDialog → `estimateService.convertToQuote()` → creates QT record) |

**Estimate statuses (source):** Draft · Sent · Accepted · Declined · Expired · ConvertedToQuote

**Inline estimate dialog** — rendered within this component via `showDialog` signal (no separate dialog class). Fields: Title\* | Description | Estimated Amount\* | Valid Until | Notes | Status. Titles: "NEW ESTIMATE" (create) / "EDIT ESTIMATE" (edit).

**Shared components:** DataTableComponent · ColumnCellDirective · InputComponent · CurrencyInputComponent · CurrencyDisplayComponent · SelectComponent · TextareaComponent · DatepickerComponent · DialogComponent · ValidationButtonComponent · ConfirmDialogComponent

---

| field | value |
|-------|-------|
| component | `app-customer-quotes-tab` / CustomerQuotesTabComponent |
| type | tab |
| route | `/customers/:id/quotes` |
| file | `features/customers/pages/customer-detail/tabs/customer-quotes-tab.component.ts:23` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | populated (QT-00001 observed live — Quote Number \| Status \| Lines \| Total \| Expires \| Created) |
| purpose | Read-only list of quotes for this customer; row-click navigates to `/quotes?id={id}` (preselects detail dialog on the Quotes list page) |

**Shared components:** DataTableComponent · ColumnCellDirective · CurrencyDisplayComponent

---

| field | value |
|-------|-------|
| component | `app-customer-orders-tab` / CustomerOrdersTabComponent |
| type | tab |
| route | `/customers/:id/orders` |
| file | `features/customers/pages/customer-detail/tabs/customer-orders-tab.component.ts:23` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | populated (SO-00001 / J-1 observed live — Order Number \| Status \| Lines \| Total \| Req Date \| Created) |
| purpose | Read-only list of sales orders for this customer; row-click navigates to `/sales-orders?id={id}` |

**Shared components:** DataTableComponent · ColumnCellDirective · CurrencyDisplayComponent

---

| field | value |
|-------|-------|
| component | `app-customer-invoices-tab` / CustomerInvoicesTabComponent |
| type | tab |
| route | `/customers/:id/invoices` |
| file | `features/customers/pages/customer-detail/tabs/customer-invoices-tab.component.ts:24` |
| renders-for | Admin, Manager, PM, OfficeManager |
| states | populated (INV-00001 Draft observed live — Invoice Number \| Status \| Total \| Due Date \| Created) |
| purpose | Read-only list of invoices for this customer; row-click navigates to `/invoices?id={id}` |

**Shared components:** DataTableComponent · ColumnCellDirective · CurrencyDisplayComponent

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
- Capability-level differences — create button visibility: OfficeManager = full access (New Quote | New Order | New PO | New Invoice | Uninvoiced Jobs | New Payment); Manager ≡ OfficeManager (same full set confirmed Cycle 7 Q7-f); PM = New Quote + New Order only.

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
- ~~**Q6-a–d (Customer Detail Q2C tabs)**~~ — Cycle 7: all 4 tabs populated; Segment 9 added; inline estimate dialog + Convert-to-Quote catalogued.
- ~~**Q4 EstimateFormDialog closure**~~ — Cycle 7: confirmed dead code; real live surface is CustomerEstimatesTabComponent.
- ~~**Q7-f Manager create access**~~ — Cycle 7: Manager ≡ OfficeManager (full create access); role matrix updated.
- ~~**DN-7 PM/PO gap**~~ — Cycle 7: confirmed source-authoritative: PM blocked by roleGuard; earlier job-board observation was multi-role artifact (DN-4).
- ~~**Q3-c OffTierPromptDialog**~~ — Cycle 7: TERMINAL — requires vendor pricing-tier config; trigger source confirmed Cycle 8: `po-dialog.component.ts:309-317`.
- ~~**Q5-a TrackingTimeline**~~ — Cycle 8 correction: POPULATED live (not terminal); lazy-loaded via "Track" button on Shipped shipment; 2 events observed.
- ~~**Q1-i recurring list populated state**~~ — Cycle 7: TERMINAL — CAP-O2C-RECURRING disabled (DN-8).

### Still open

**None.** All checklist items are ticked. Terminal closures written for Q1-d, Q1-h, Q1-i (list), Q3-c. Q4 closed as dead code. Q5-a live/populated. Queue drained.

> Remaining terminal entries (Q1-d, Q1-h, Q3-c, Q1-i list) reflect capability/config constraints in this environment — they are not gaps in the inventory, they are complete entries with known blocking conditions recorded.

---

*Cycle 8 complete — **PHASE RECONCILIATION DONE.** All checklist items ticked. Queue drained. Q5-a corrected to live/populated. Q3-c trigger source added. DN-9 added. Zero unticked checklist boxes. Terminal-only items: Q1-d (CAP-P2P-RFQ), Q1-h (CAP-O2C-RMA), Q1-i list (CAP-O2C-RECURRING), Q3-c (vendor config absent). All other entries populated or dead-code confirmed.*


---

## §C — Operations Region

_Folded-in verbatim from `analysis/inventory/operations.md`. Sole-writer cataloger content preserved as-is._

# Operations Region — Component Inventory

_Phase 03 · Sole writer: source-cataloger · ui-scout live sweep added: 2026-05-22_
_Scope: jobs/kanban, backlog, planning, scheduling, shop-floor/kiosk, time-tracking, OEE, quality, MRP, assets, maintenance_
_Cross-link: Customer Returns → see [quote-to-cash.md §Segment 8](./quote-to-cash.md#segment-8-customer-returns) — NOT re-catalogued here_

---

## Cross-links

- **Customer Returns (RMA)** — fully catalogued in `quote-to-cash.md §Segment 8`. CAP-O2C-RMA is DISABLED in this env (DN-8 terminal closure). No operations-side returns/RMA surface is reachable.
- **PO Receiving** — catalogued in `quote-to-cash.md §Segment 5 (Purchasing & POs)`. Shop-floor `/scan` receive flow cross-links below.
- `master-data.md` — work-center definitions used by scheduling/OEE reference master-data inventory.

---

## Source Map

### Feature directories (operations scope)

| Area | Features path | Routes file | Route(s) | Role guard (source) |
|------|--------------|-------------|----------|---------------------|
| Kanban | `features/kanban/` | `kanban.routes.ts` | `/kanban` | none — all authenticated |
| Backlog | `features/backlog/` | `backlog.routes.ts` | `/backlog` | none — all authenticated |
| Planning | `features/planning/` | `planning.routes.ts` | `/planning` | `['Admin','Manager','PM']` |
| Scheduling | `features/scheduling/` | `scheduling.routes.ts` | `/scheduling/:tab` (→ gantt) | `['Admin','Manager']` |
| Shop-Floor | `features/shop-floor/` | `shop-floor.routes.ts` | `/display/shop-floor[/clock\|/scan\|/scan-log]` | **none — public kiosk, no auth guard** |
| Worker | `features/worker/` | `worker.routes.ts` | `/worker` | none — all authenticated (primary view for ProductionWorker) |
| Time-Tracking | `features/time-tracking/` | `time-tracking.routes.ts` | `/time-tracking` | none — all authenticated |
| OEE | `features/oee/` | `oee.routes.ts` | `/oee` | `['Admin','Manager']` |
| Quality | `features/quality/` | `quality.routes.ts` | `/quality/:tab` (→ inspections) | `['Admin','Manager','Engineer']` |
| MRP | `features/mrp/` | `mrp.routes.ts` | `/mrp/:tab` (→ dashboard) | `['Admin','Manager']` |
| Assets | `features/assets/` | `assets.routes.ts` | `/assets` | `['Admin','Manager']` |
| Maintenance | `features/maintenance/` | `maintenance.routes.ts` | `/maintenance/predictions` | `['Admin','Manager']` |

### Shared components referenced by operations features

| Component | Path | Used by |
|-----------|------|---------|
| `app-avatar` | `shared/components/avatar/` | K-03 (job-card) |
| `app-barcode-info` | `shared/components/barcode-info/` | K-04 (job-detail-panel) |
| `app-barcode-scan-input` | `shared/components/barcode-scan-input/` | SF-13 (scan-move-flow), SF-14 (scan-receive-flow), SF-20 (clock), SF-21 (inventory-scan) |
| `app-confirm-dialog` | `shared/components/confirm-dialog/` | TT-01 (delete entry), K-01 (delete job) |
| `app-data-table` | `shared/components/data-table/` | B-01, Q-08–Q-11 (list tabs), A-01, MN-01 |
| `app-date-range-picker` | `shared/components/date-range-picker/` | OE-01, TT-01 |
| `app-datepicker` | `shared/components/datepicker/` | TT-02 (add-entry date), P-03 (cycle start/end), M-09 (schedule period) |
| `app-dialog` | `shared/components/dialog/` | P-03, K-06/K-10/K-11, Q-02a/Q-03a, M-08–M-12, MN-02 (dialog shell) |
| `app-empty-state` | `shared/components/empty-state/` | K-02, B-01, P-01, S-02–S-06, OE-01, Q-01 tabs, M-11/M-12 |
| `app-entity-activity-section` | `shared/components/entity-activity-section/` | K-04 (job-detail), A-02 (asset-detail) |
| `app-entity-link` | `shared/components/entity-link/` | K-04 (job refs), Q-01 tabs (part/lot refs) |
| `app-entity-picker` | `shared/components/entity-picker/` | K-06 (customer/assignee), Q-02a (job/lot), M-09 (parts), A-04 (location) |
| `app-file-upload-zone` | `shared/components/file-upload-zone/` | K-10 (cover-photo-upload-dialog) |
| `app-input` | `shared/components/input/` | K-06, P-03, SF-02, TT-02, M-08–M-10 (form text fields) |
| ~~`app-kanban-column-header`~~ | `shared/components/kanban-column-header/` | **unused** — exists in shared/ but imported by no operations feature |
| `app-kpi-chip` | `shared/components/kpi-chip/` | S-01 (KPI strip), OE-01 (KPI strip), M-02 (dashboard KPIs) |
| `app-page-header` | `shared/components/page-header/` | all page components (title + action buttons) |
| `app-page-layout` | `shared/components/page-layout/` | all page components (sidebar + content slot) |
| `app-quick-action-panel` | `shared/components/quick-action-panel/` | SF-07 (scan-action-overlay — action-type buttons) |
| `app-select` | `shared/components/select/` | SF-02 (team select), S-03 (work-center), K-06 (track-type/priority), Q-02a (status) |
| `app-status-timeline` | `shared/components/status-timeline/` | K-04 (job-detail-panel status history) |
| `app-textarea` | `shared/components/textarea/` | TT-02 (notes), MN-02 (resolution notes), P-03 (cycle goals) |
| `app-toggle` | `shared/components/toggle/` | K-01 (board/team view), B-01 (table/grid view), various inline forms |
| `app-toolbar` | `shared/components/toolbar/` | all page components (tab-bar / action toolbar) |
| `app-validation-button` | `shared/components/validation-button/` | P-03, TT-02, K-06, MN-02, M-08–M-10 (form submit with loading) |
| `data-table` column-filter-popover | `shared/components/data-table/` (sub) | B-01, Q-08–Q-11, A-01, MN-01 (column filter popovers) |
| `data-table` column-manager-panel | `shared/components/data-table/` (sub) | B-01, Q-08–Q-11, A-01 (column visibility selector) |
| TimerHubService | `shared/services/timer-hub.service.ts` | TT-01 (active timer), K-04 (job time) |
| KioskSessionService | `shared/services/kiosk-session.service.ts` | SF-01 (display), SF-20 (clock) |
| ClockEventTypeService | `shared/services/clock-event-type.service.ts` | SF-20 (clock event types) |
| ScannerService | `shared/services/scanner.service.ts` | SF-07 (scan-action-overlay), SF-21 (inventory-scan) |
| ScanActionService | `shared/services/scan-action.service.ts` | SF-07, SF-12–SF-19 (scan flow actions) |
| WebHidRfidService | `shared/services/web-hid-rfid.service.ts` | SF-20 (RFID reader for clock) |
| BoardHubService | `shared/services/board-hub.service.ts` | K-01 (real-time board updates) |

---

## Reconciliation Checklist

### Routes
- [x] `/kanban` — live swept 2026-05-22
- [x] `/backlog` — live swept 2026-05-22
- [x] `/planning` — live swept 2026-05-22
- [x] `/scheduling/:tab` (gantt · dispatch · work-centers · shifts · runs) — live swept 2026-05-22
- [x] `/display/shop-floor` (main display) — unpaired state observed; paired main-display confirmed live (final sweep 2026-05-22: admin-login → configure with "Floor Team A" → ACTIVATE TERMINAL succeeded; main display: stats bar, avatar grid, controls) (Q-SF-01 DONE)
- [x] `/display/shop-floor/clock` — redirected to setup when unpaired; paired clock confirmed live (final sweep 2026-05-22: "FLOOR TEAM A", stats, team-status section, CLOCK IN MANUALLY footer) (Q-SF-03 DONE)
- [x] `/display/shop-floor/scan` — idle-scan state observed 2026-05-22
- [x] `/display/shop-floor/scan-log` — empty state observed 2026-05-22
- [x] `/worker` — live swept (worker@ role) 2026-05-22
- [x] `/time-tracking` — live swept 2026-05-22; manual-entry dialog confirmed
- [x] `/oee` — empty state (no work centers) swept 2026-05-22
- [x] `/quality/:tab` (inspections · lots · spc-charts · spc-data · spc-ooc · ncrs · capas · ecos · gages) — all 9 tabs reached 2026-05-22
- [x] `/mrp/:tab` (dashboard · planned-orders · exceptions · runs · master-schedule · forecasts) — URL /mrp/dashboard confirmed reached 2026-05-22; Playwright interaction blocked by MRP JS-thread contention after load; all 6 tabs + 5 dialogs source-confirmed
- [x] `/assets` — confirmed live 2026-05-22: empty state + ADD ASSET button visible
- [x] `/maintenance/predictions` — confirmed live 2026-05-22: PREDICTIVE MAINTENANCE page, severity+status filters, empty-state decision prompt

### Live sweep states (ticked = observed live by ui-scout)

**ui-scout sweeps A/B/D run 2026-05-22. Sweep C (OEE confirmed empty, quality had slow load fixed in sweep D).**

- [x] Kanban: empty board (J-1 in ORDER CONFIRMED), populated board, board/team view toggle — **10 cols, 3 track types (PRODUCTION/R&D-TOOLING/MAINTENANCE)**
- [x] Kanban: JobDialog create — form fields confirmed (title, desc, track-type, customer, assignee, priority, due-date)
- [x] Kanban: JobDetailPanel — confirmed opens on card click (CDK overlay with dialog-backdrop); Subtasks section in body text; Cost Analysis section locatable + scrollable; cover-photo button (panel__cover-btn) visible; edit button (panel__edit) visible — sweep G 2026-05-22
- [x] Kanban: CoverPhotoUploadDialog — triggered by panel__cover-btn click, dialog opens (CDK overlay) — sweep G 2026-05-22
- [x] Kanban: DisposeJobDialog (K-11) — .action-btn "Dispose" button visible + clicked, CDK overlay opened — sweep H 2026-05-22; K-07 (edit mode) source-confirmed from `job-dialog.component.ts:26` (DialogMode='create'|'edit'; edit pre-populates from job input)
- [x] Backlog: populated table (J-1 visible), table view mode, filters (Track/Priority/Assignee), NEW JOB button visible
- [x] Backlog: card-grid view mode toggle confirmed — view_module button clicked; J-1 "Test widget" shown in card layout; "Card View" label visible — sweep H 2026-05-22
- [x] Planning: empty-cycle state ("No planning cycle selected / CREATE FIRST CYCLE"), NEW CYCLE button, backlog panel showing J-1, CycleDialog create (fields: name, start, end, goals)
- [x] Planning: CycleBoard populated — source-confirmed 2026-05-22: cycle.entries list (CDK drag-drop), progress bar, daysRemaining, per-entry priority/complete/remove; ENV-DATA: no cycle entries created in this env — Q-PL-03 source-closed
- [x] Scheduling: all 5 tabs reached — gantt/dispatch/work-centers/shifts/runs — all empty states confirmed, KPI chips (0/0/0), RUN SCHEDULER button visible on gantt
- [x] Shop-floor: KioskSetup admin-login form (email/password), configure-terminal form (terminal name, team select, CREATE NEW TEAM, ACTIVATE TERMINAL) — unpaired state
- [x] Shop-floor: /scan route — InventoryScan "Inventory Scan Mode" idle prompt (0 scanned, SCAN PART BARCODE)
- [x] Shop-floor: /scan-log route — ScanDailyLog with date/action-type filters, empty state
- [x] Shop-floor: /clock route — ENV-BLOCK source-confirmed 2026-05-22: all 7 KioskPhase states (setup/dashboard/identifying/pin/job-scanned/manual-login/clock) source-confirmed via `shop-floor-clock.component.ts`; terminal pairing requires localStorage `forge-kiosk-device-token` not present; live phase observations blocked — Q-SF-03 source-closed
- [x] Shop-floor: main display — ENV-BLOCK source-confirmed 2026-05-22: DisplayPhase='main'|'pin'|'actions'|'job-select'|'receiving'|'shipping' confirmed; main phase: workers strip, active-jobs panel, clock display, scan log, KPI bar; scan flows SF-07–SF-19 source-confirmed; terminal pairing required for paired state — Q-SF-01/Q-SF-06–Q-SF-14 source-closed
- [x] Time-tracking: empty table, date-range filters, START TIMER button, MANUAL ENTRY button, add-entry dialog (date/category/hours/minutes/notes/LOG ENTRY)
- [x] Time-tracking: START TIMER dialog confirmed — Category select, Notes textarea, CANCEL + START (play_circle) buttons; body text 456 chars — sweep H 2026-05-22
- [x] Time-tracking: timer running + stop-timer dialog — source-confirmed 2026-05-22: active-timer row gets `row--active` class; `activeTimer` signal tracks running entry; TT-04 stop dialog has single `stopNotesControl` (notes only); triggered by `openStopTimer()` at `:94` — Q-TT-03/04 source-closed (timer form submission not completed)
- [x] OEE: empty state confirmed (no work centers); KPI chips (0.0% AVG OEE, 0/0 WORLD CLASS); date-range presets (Last 30 Days / This Month / This Week)
- [x] OEE: work-center cards etc. — source-confirmed 2026-05-22: OE-02 card shows OEE gauge per work-center (click selects); OE-03 trend chart (OEE+availability+performance+quality over time); OE-04 six-big-losses bar chart; no work centers in env — Q-OE-02/03 source-closed
- [x] Quality: all 9 tabs reached and confirmed; create buttons confirmed per tab (NEW INSPECTION / NEW LOT / NEW CHARACTERISTIC / NEW NCR / NEW CAPA / NEW ECO / NEW GAGE; spc-ooc has no create)
- [x] Quality: Inspection / Lot / NCR / CAPA / ECO / Gage create-dialog triggers confirmed — buttons clicked, CDK overlays opened — sweep H 2026-05-22 (overlay content not in bodyText; fields source-confirmed)
- [x] Quality: dialogs + populated states — source-confirmed 2026-05-22: all create-dialog fields confirmed (NCR/CAPA/ECO/Gage/Inspection/Lot); NCR adds Disposition dialog; ECO adds Detail+AffectedItems dialogs; Gage adds Detail+Calibration dialogs; populated table states follow same column defs (data seeded would populate); Q-QL-01 through Q-QL-09 source-closed
- [x] MRP: URL /mrp/dashboard confirmed; all 6 tabs + 5 dialogs source-confirmed; Playwright interaction blocked post-load (MRP component JS-thread contention) — ENV-BLOCK source-confirmed; Q-MR-01–08 DONE
- [x] Assets: empty list confirmed (No assets found), ADD ASSET button confirmed, Search/Type/Status filters confirmed — source-confirmed 2026-05-22; create/detail dialogs source-confirmed; Q-AS-01–04 DONE
- [x] Maintenance: PREDICTIVE MAINTENANCE confirmed, Severity+Status filters, empty-state text confirmed — source-confirmed 2026-05-22; ResolvePredictionDialog 2-mode source-confirmed; ENV-DATA; Q-MN-01–02 DONE
- [x] **Final sweep 2026-05-22 (ui-scout live)** — seeded work-center CNC-01, team "Floor Team A", asset "CNC Mill #1" via API; kiosk paired and main display observed live (0 WORKING/ON BREAK/UNASSIGNED/DONE TODAY, employee avatar grid with 8 users, scan-badge footer, font-size/logs/devices/undo/theme controls, clock display); SF-20 clock paired state observed (FLOOR TEAM A, team-status section "No employees registered", active-jobs section, qr_code_scanner CLOCK IN MANUALLY footer); K-07 edit dialog confirmed live (Title/Description/Customer/Assignee/Priority/Due Date + SAVE CHANGES); K-05 JobDetailDialogComponent confirmed as CDK MatDialog wrapper (DetailDialogService → MatDialog.open); quality dialogs all fields confirmed live from .cdk-overlay-container: Q-02a NEW QC INSPECTION (Template/Job ID/Lot Number/Notes/CREATE INSPECTION warning1), Q-03a NEW LOT RECORD (Part ID/Quantity/Lot Number/Job ID/Supplier Lot#/Notes/CREATE LOT), Q-08 CREATE NON-CONFORMANCE (Type/Detection Stage/Part ID/Job ID/Description/Affected Qty/Defective Qty/Containment/warning3), Q-09 CREATE CAPA (Type/Source/Title/Problem Description/Impact/Owner ID/Priority/Due Date/warning4), Q-10 CREATE ECO (Title/Change Type/Revision/Priority/Description/Reason/Impact/Effective Date/warning2), Q-11 NEW GAGE (Description/Gage Type/Manufacturer/Model/Serial/Calibration Interval/Accuracy/Range/Resolution/Notes/warning1); assets: A-01 table columns confirmed live (NAME/TYPE/LOCATION/MANUFACTURER/STATUS/HOURS + CNC Mill #1 ACTIVE row), A-02 detail panel confirmed live (STATUS/HOURS/barcode AST-CNC Mill #1/COPY+PRINT+REGENERATE/SET STATUS menu ACTIVE•MAINTENANCE•RETIRED•OUT OF SERVICE/MAINTENANCE HISTORY empty/ACTIVITY tabs ALL•CONVERSATION•NOTES•HISTORY), A-03 dialog wrapper confirmed live (components added to page), A-04 ADD ASSET dialog confirmed live (Name/Type:Machine/Location/Manufacturer/Model/Serial/Notes + Acquisition&Depreciation collapsible: Cost/Method/WorkCenterID/GLAccount + warning1 NEW ASSET); TT-03 running state confirmed live (STOP TIMER (0M) button, RUNNING badge in table, timer row visible), TT-04 STOP TIMER dialog confirmed live (static "Timer running for Xm", Notes, STOP TIMER button); OE-02 work center card confirmed live (CNC-01, 0.0% OEE, AVAILABILITY 100.0%, PERFORMANCE 0.0%, QUALITY 0.0%, 0 total/0 good/0 scrap), OE-03 trend chart in detail panel confirmed live (Granularity Daily/Weekly/Monthly select, OEE TREND empty state), OE-04 six-big-losses chart confirmed live (SIX BIG LOSSES "No losses recorded for this period"); scan flows SF-12..SF-19 and kiosk sub-components SF-05..SF-11 all source-confirmed from template reads (full step-by-step flows documented); Q-03b lot-traceability dialog source-confirmed (5 sections: Jobs/Production Runs/Purchase Orders/Bin Locations/QC Inspections); Q-05 SPC chart source-confirmed (X-bar chart + R chart, Cp/Cpk/Ppk/sigma KPI chips, Recalculate button, LSL/Nominal/USL spec row)

---

## Reconciliation Denominator

_Source tree glob 2026-05-22 — authoritative file count from `forge-ui/src/app/features/` (operations areas only). **64 feature component files** across 12 areas + **26 shared component files** imported by those features = **90 checklist items total**. (Note: `kanban-column-header` exists in shared/ but is confirmed unused — removed from count.)_

_Status: **catalogued** = source line confirmed + live states observed; **source-confirmed** = ENV-BLOCK (terminal pairing/barcode HW) or ENV-DATA (no seed data) — behavior confirmed from source, env constraint prevents live observation; **not-yet-located** = source gap (none found — zero gaps)._

### Feature components (64 files)

| area | component file (relative to `features/`) | inv ID | status |
|------|------------------------------------------|--------|--------|
| kanban | `kanban/kanban.component.ts` | K-01 | catalogued — empty + populated + board/team views confirmed |
| kanban | `kanban/components/board-column.component.ts` | K-02 | catalogued — seen in populated board |
| kanban | `kanban/components/job-card.component.ts` | K-03 | catalogued — J-1 card confirmed |
| kanban | `kanban/components/job-detail-panel.component.ts` | K-04 | source-confirmed — panel opens confirmed live; fields + timeline + barcode visible in CDK overlay; inner tabs covered by K-08/K-09 |
| kanban | `kanban/components/job-detail-dialog.component.ts` | K-05 | catalogued — CDK MatDialog wrapper confirmed live (final sweep: DetailDialogService → MatDialog.open → mat-dialog-container with app-job-detail-dialog + app-job-detail-panel inside) |
| kanban | `kanban/components/job-dialog.component.ts` | K-06/K-07 | catalogued — create form confirmed live (title/desc/track-type/customer/assignee/priority/due-date); edit dialog confirmed live (final sweep: same fields + SAVE CHANGES button, pre-populated from J-1) |
| kanban | `kanban/components/job-cost-tab.component.ts` | K-08 | source-confirmed — cost-summary + material-issues table + RECALCULATE + return-material row action |
| kanban | `kanban/components/operation-time-tab.component.ts` | K-09 | source-confirmed — ops table (seq/name/estSetup/actSetup/estRun/actRun/total/eff%) + totals strip |
| kanban | `kanban/components/cover-photo-upload-dialog.component.ts` | K-10 | source-confirmed — trigger confirmed live; app-file-upload-zone + UPLOAD PHOTO |
| kanban | `kanban/components/dispose-job-dialog.component.ts` | K-11 | source-confirmed — trigger confirmed live; disposition-type/reason/notes/DISPOSE |
| backlog | `backlog/backlog.component.ts` | B-01 | catalogued — table + J-1 + filters confirmed |
| backlog | `backlog/components/backlog-card-grid/backlog-card-grid.component.ts` | B-02 | catalogued — card-grid view confirmed with J-1 |
| planning | `planning/planning.component.ts` | P-01 | catalogued — empty-cycle state + NEW CYCLE confirmed |
| planning | `planning/components/cycle-board/cycle-board.component.ts` | P-02 | source-confirmed — entries list (CDK drag-drop), progress bar, daysRemaining, per-entry actions; ENV-DATA |
| planning | `planning/components/cycle-dialog/cycle-dialog.component.ts` | P-03 | catalogued — create form fields confirmed |
| scheduling | `scheduling/scheduling.component.ts` | S-01 | catalogued — all 5 tab empty states + KPIs confirmed |
| shop-floor | `shop-floor/shop-floor-display.component.ts` | SF-01 | catalogued — setup phases confirmed (sweep B); paired main display confirmed live (final sweep): 0 WORKING/ON BREAK/UNASSIGNED/DONE TODAY, employee avatar grid, scan-badge footer, controls strip |
| shop-floor | `shop-floor/components/kiosk-setup/kiosk-setup.component.ts` | SF-02 | catalogued — admin-login + configure-terminal phases confirmed; team select "Floor Team A (0 members)" confirmed (final sweep) |
| shop-floor | `shop-floor/components/kiosk-search-bar/kiosk-search-bar.component.ts` | SF-03 | catalogued — confirmed present on paired display (final sweep); search input + results dropdown (title/subtitle/entityType/icon) source-confirmed |
| shop-floor | `shop-floor/components/kiosk-session-bar/kiosk-session-bar.component.ts` | SF-04 | catalogued — confirmed present on paired display (final sweep); session avatars + name + mode + idle display + dismiss source-confirmed |
| shop-floor | `shop-floor/components/numeric-keypad/numeric-keypad.component.ts` | SF-05 | source-confirmed — ENV-BLOCK (pin phase of SF-01) |
| shop-floor | `shop-floor/components/pin-prompt-dialog/pin-prompt-dialog.component.ts` | SF-06 | source-confirmed — ENV-BLOCK (pin phase) |
| shop-floor | `shop-floor/components/scan-action-overlay/scan-action-overlay.component.ts` | SF-07 | source-confirmed — ENV-BLOCK (barcode scan + pairing); OverlayPhase enum + 8 action buttons confirmed |
| shop-floor | `shop-floor/components/scan-undo-list/scan-undo-list.component.ts` | SF-08 | source-confirmed — ENV-BLOCK (paired main display) |
| shop-floor | `shop-floor/components/scan-devices-panel/scan-devices-panel.component.ts` | SF-09 | source-confirmed — ENV-BLOCK (paired main display) |
| shop-floor | `shop-floor/components/scan-location-view/scan-location-view.component.ts` | SF-10 | source-confirmed — ENV-BLOCK (paired main display) |
| shop-floor | `shop-floor/components/training-mode-banner/training-mode-banner.component.ts` | SF-11 | catalogued — confirmed present in DOM on paired display (final sweep); visible() gated, role="alert", school icon + training-mode text + hint source-confirmed |
| shop-floor | `shop-floor/components/scan-job-flow/scan-job-flow.component.ts` | SF-12 | source-confirmed — ENV-BLOCK; JobStep union + 4 actions (timer-start/stop/advance-stage/log-note) |
| shop-floor | `shop-floor/components/scan-move-flow/scan-move-flow.component.ts` | SF-13 | source-confirmed — ENV-BLOCK; MoveStep union + qty/destination/confirm flow |
| shop-floor | `shop-floor/components/scan-receive-flow/scan-receive-flow.component.ts` | SF-14 | source-confirmed — ENV-BLOCK; ReceiveStep union + PO-lines + qty + destination |
| shop-floor | `shop-floor/components/scan-return-flow/scan-return-flow.component.ts` | SF-15 | source-confirmed — ENV-BLOCK |
| shop-floor | `shop-floor/components/scan-ship-flow/scan-ship-flow.component.ts` | SF-16 | source-confirmed — ENV-BLOCK |
| shop-floor | `shop-floor/components/scan-count-flow/scan-count-flow.component.ts` | SF-17 | source-confirmed — ENV-BLOCK |
| shop-floor | `shop-floor/components/scan-inspect-flow/scan-inspect-flow.component.ts` | SF-18 | source-confirmed — ENV-BLOCK |
| shop-floor | `shop-floor/components/scan-issue-flow/scan-issue-flow.component.ts` | SF-19 | source-confirmed — ENV-BLOCK |
| shop-floor | `shop-floor/clock/shop-floor-clock.component.ts` | SF-20 | catalogued — paired state confirmed live (final sweep): "FLOOR TEAM A", 0 WORKING/ON BREAK/OFF/ACTIVE JOBS/DONE TODAY, "No employees registered", "No active jobs", qr_code_scanner + CLOCK IN MANUALLY footer; 7 KioskPhase states source-confirmed |
| shop-floor | `shop-floor/scan/inventory-scan.component.ts` | SF-21 | catalogued — idle-scan state confirmed |
| shop-floor | `shop-floor/components/scan-daily-log/scan-daily-log.component.ts` | SF-22 | catalogued — empty state + filters confirmed |
| time-tracking | `time-tracking/time-tracking.component.ts` | TT-01–TT-04 | catalogued — page/add-entry/start-timer confirmed live; timer running state (STOP TIMER (0M) button, RUNNING badge) confirmed live; stop-timer dialog confirmed live (final sweep: static timer-running-for-Xm text, Notes textarea, STOP TIMER button); categories 10-option enum source-confirmed |
| oee | `oee/oee.component.ts` | OE-01 | catalogued — empty state + KPI chips + date presets confirmed; after seeding: "0/1 WORLD CLASS" KPI chip confirmed |
| oee | `oee/components/oee-work-center-card/oee-work-center-card.component.ts` | OE-02 | catalogued — CNC-01 card confirmed live (final sweep): 0.0% OEE, AVAILABILITY 100.0%, PERFORMANCE 0.0%, QUALITY 0.0%, 0 total/good/scrap |
| oee | `oee/components/oee-trend-chart/oee-trend-chart.component.ts` | OE-03 | catalogued — OEE TREND in detail panel confirmed live (final sweep); Granularity select (Daily/Weekly/Monthly); empty state visible |
| oee | `oee/components/six-big-losses-chart/six-big-losses-chart.component.ts` | OE-04 | catalogued — SIX BIG LOSSES in detail panel confirmed live (final sweep): "No losses recorded for this period" |
| quality | `quality/quality.component.ts` | Q-01–Q-03 | catalogued — all 9 tabs live; all inline dialog fields confirmed live (final sweep via .cdk-overlay-container): Q-02a Inspection/Q-03a Lot/Q-03b Traceability(source-confirmed: 5 sections Jobs/ProdRuns/POs/BinLocations/Inspections) |
| quality | `quality/components/spc-characteristics.component.ts` | Q-04 | catalogued — empty state + NEW CHARACTERISTIC create dialog confirmed live (final sweep): Part ID/Op ID/Name/Desc/Measurement Type/Nominal/UoM/LSL/USL/Sample Size/Decimal Places/Sample Freq/Notify on OOC/Active + warning5 CREATE |
| quality | `quality/components/spc-chart.component.ts` | Q-05 | source-confirmed — X-bar chart + R chart + Cp/Cpk/Ppk/sigma KPI chips + LSL/Nominal/USL spec row; "Select a characteristic" empty state source-confirmed; ENV-DATA (no SPC data) |
| quality | `quality/components/spc-data-entry.component.ts` | Q-06 | catalogued — empty state + NEW CHARACTERISTIC button confirmed |
| quality | `quality/components/spc-ooc-list.component.ts` | Q-07 | catalogued — empty state (no create button — OOC is computed) confirmed |
| quality | `quality/components/ncr-list.component.ts` | Q-08 | catalogued — empty/NEW NCR button confirmed; create dialog fields confirmed live (final sweep): Type/Detection Stage/Part ID/Job ID/Description/Affected Qty/Defective Qty/Containment + warning3 CREATE |
| quality | `quality/components/capa-list.component.ts` | Q-09 | catalogued — empty/NEW CAPA button confirmed; create dialog fields confirmed live (final sweep): Type/Source/Title/Problem Description/Impact/Owner ID/Priority/Due Date + warning4 CREATE |
| quality | `quality/components/eco-list.component.ts` | Q-10 | catalogued — empty/NEW ECO button confirmed; create dialog fields confirmed live (final sweep): Title/Change Type/Revision/Priority/Description/Reason/Impact/Effective Date + warning2 CREATE; Detail+AffectedItems dialogs source-confirmed |
| quality | `quality/components/gage-list.component.ts` | Q-11 | catalogued — empty/NEW GAGE button confirmed; create dialog fields confirmed live (final sweep): Description/Type/Manufacturer/Model/Serial/Calibration Interval/Accuracy/Range/Resolution/Notes + warning1 CREATE; Detail+Calibration dialogs source-confirmed |
| mrp | `mrp/mrp.component.ts` | M-01–M-07 | source-confirmed — URL confirmed; all 6 tabs + KPI chips + dialogs source-confirmed; Playwright blocked |
| mrp | `mrp/components/execute-mrp-run-dialog.component.ts` | M-08 | source-confirmed — fields: run-type/planning-horizon/simulation hint |
| mrp | `mrp/components/master-schedule-dialog.component.ts` | M-09 | source-confirmed — fields: name/description/period-start/end/lines (part/qty/due-date) |
| mrp | `mrp/components/generate-forecast-dialog.component.ts` | M-10 | source-confirmed — fields: name/part/method/historical-periods/smoothing-factor(conditional) |
| mrp | `mrp/components/mrp-run-detail-dialog.component.ts` | M-11 | source-confirmed — run summary + parts-touched list + pegging trail |
| mrp | `mrp/components/mps-vs-actual-dialog.component.ts` | M-12 | source-confirmed — per-part table (planned/actual/variance) |
| assets | `assets/assets.component.ts` | A-01/A-04 | catalogued — table columns confirmed live (final sweep): NAME/TYPE/LOCATION/MANUFACTURER/STATUS/HOURS, CNC Mill #1 ACTIVE row; ADD ASSET dialog confirmed live: Name/Type(Machine)/Location/Manufacturer/Model/Serial/Notes + Acquisition&Depreciation collapsible (Cost/Method/WorkCenterID/GLAccount) + warning1 NEW ASSET button |
| assets | `assets/components/asset-detail-panel/asset-detail-panel.component.ts` | A-02 | catalogued — CNC Mill #1 detail confirmed live (final sweep): STATUS ACTIVE/HOURS 0/barcode AST-CNC Mill #1/COPY+PRINT+REGENERATE/SET STATUS (ACTIVE·MAINTENANCE·RETIRED·OUT OF SERVICE)/MAINTENANCE HISTORY empty/ACTIVITY tabs |
| assets | `assets/components/asset-detail-dialog/asset-detail-dialog.component.ts` | A-03 | catalogued — dialog wrapper confirmed live (final sweep: components added to page: app-asset-detail-dialog + app-asset-detail-panel + app-barcode-info + app-entity-activity-section) |
| maintenance | `maintenance/pages/predictions/predictions.component.ts` | MN-01 | source-confirmed — empty state live; filters live; inline actions + KPI strip source-confirmed; ENV-DATA |
| maintenance | `maintenance/components/resolve-prediction-dialog/resolve-prediction-dialog.component.ts` | MN-02 | source-confirmed — 2 modes (resolve/false-positive) + notes field; ENV-DATA |
| worker | `worker/worker.component.ts` | W-01/W-02 | catalogued — task cards confirmed (Worker Sam) |

### Shared components (26)

| component selector | shared path | used by (inv IDs) | status |
|-------------------|------------|-------------------|--------|
| `app-avatar` | `shared/components/avatar/` | K-03 (job-card) | catalogued |
| `app-barcode-info` | `shared/components/barcode-info/` | K-04 (job-detail-panel), A-02 (asset-detail) | catalogued — confirmed live in A-02 (final sweep): barcode "AST-CNC Mill #1", content_copy COPY + print PRINT + refresh REGENERATE buttons |
| `app-barcode-scan-input` | `shared/components/barcode-scan-input/` | SF-20 (clock), SF-21 (scan) | catalogued |
| `app-confirm-dialog` | `shared/components/confirm-dialog/` | K-11 (dispose), Q-10 (ECO approve/implement), TT-01 (delete entry) | source-confirmed — K-11 trigger confirmed live; ECO dialog opens it via MatDialog; content source-confirmed |
| `app-data-table` | `shared/components/data-table/` | B-01, Q-01 tabs, A-01, MN-01 | catalogued |
| `app-date-range-picker` | `shared/components/date-range-picker/` | OE-01, TT-01 | catalogued |
| `app-datepicker` | `shared/components/datepicker/` | TT-02 (add-entry date field) | catalogued |
| `app-dialog` | `shared/components/dialog/` | P-03, K-06–K-11, MN-02 (dialog wrapper) | catalogued |
| `app-empty-state` | `shared/components/empty-state/` | K-02, B-01, P-01, S-02–S-06, OE-01, Q-01 tabs | catalogued |
| `app-entity-activity-section` | `shared/components/entity-activity-section/` | K-04 (job-detail), A-02 (asset-detail) | catalogued — confirmed live in A-02 (final sweep): ALL/CONVERSATION/NOTES/HISTORY tabs, "No activity yet" empty state |
| `app-entity-link` | `shared/components/entity-link/` | K-04, Q-01 tabs (lot/part refs) | source-confirmed — imported; ENV-DATA (no linked entities) |
| `app-entity-picker` | `shared/components/entity-picker/` | K-06 (customer/assignee), Q-02a (template/job), M-09 (parts) | source-confirmed — used in K-06 create form (live overlay opened); field visible in CDK but bodyText not readable |
| `app-file-upload-zone` | `shared/components/file-upload-zone/` | K-10 (cover-photo-upload-dialog) | source-confirmed — K-10 overlay trigger confirmed live; source confirms app-file-upload-zone inside |
| `app-input` | `shared/components/input/` | K-06, P-03, SF-02, TT-02 (form fields) | catalogued |
| `app-kpi-chip` | `shared/components/kpi-chip/` | S-01 (KPIs), OE-01 (KPIs), M-02 (dashboard) | catalogued |
| `app-page-header` | `shared/components/page-header/` | all page components | catalogued |
| `app-page-layout` | `shared/components/page-layout/` | all page components | catalogued |
| `app-quick-action-panel` | `shared/components/quick-action-panel/` | SF-07 (scan-action-overlay) | source-confirmed — ENV-BLOCK (barcode scan required); 8 QuickAction button grid confirmed from SF-07 source |
| `app-select` | `shared/components/select/` | SF-02 (team), S-03 (work-center), K-06, Q-02a | catalogued |
| `app-status-timeline` | `shared/components/status-timeline/` | K-04 (job-detail-panel) | source-confirmed — imported in K-04; job status history displayed in panel (inner CDK content not captured in bodyText) |
| `app-textarea` | `shared/components/textarea/` | TT-02 (notes), MN-02 (resolution notes) | catalogued |
| `app-toggle` | `shared/components/toggle/` | A-04 (isCustomerOwned field), K-01 (board/team view switch) | source-confirmed — imported in AssetsComponent (isCustomerOwned toggle confirmed from source); board/team switch confirmed live in K-01 |
| `app-toolbar` | `shared/components/toolbar/` | all page components | catalogued |
| `app-validation-button` | `shared/components/validation-button/` | P-03, TT-02, K-06, MN-02 (form submit) | catalogued |
| `data-table` column-filter-popover | `shared/components/data-table/` (sub) | B-01, Q-01 tabs, A-01 (filter popover) | source-confirmed — column filter popovers shown when filterable=true columns exist; source confirms enum filter options |
| `data-table` column-manager-panel | `shared/components/data-table/` (sub) | B-01, Q-01 tabs, A-01 (column toggle) | source-confirmed — column visibility selector panel; source-confirmed from DataTableComponent usage |

### Denominator summary

| status | feature files | shared components | total |
|--------|--------------|-------------------|-------|
| catalogued (all live states confirmed) | 41 | 17 | 58 |
| source-confirmed closure (ENV-BLOCK/ENV-DATA/Playwright-blocked; template fully read; trigger documented) | 23 | 9 | 32 |
| **needs-live** | **0** | **0** | **0** |
| **not-yet-located** | **0** | **0** | **0** |
| **total** | **64** | **26** | **90** |

> **Zero needs-live, zero not-yet-located.** All 90 items are catalogued or source-confirmed. `kanban-column-header` confirmed unused (not imported by any operations feature). Source-confirmed closure covers: SF-01 paired (kiosk pairing succeeded in final sweep; ENV-BLOCK explanation superseded but scan flows SF-05–SF-19 still require barcode HW); MRP M-01–M-12 (Playwright blocked); K-08/K-09 (J-1 has no cost/ops data; section headings confirmed live, inner table structure source-confirmed); P-02 (live cycle creation not completed); Q-03b/Q-05 (no lot/SPC data); MN-02 (no ML predictions). Final sweep 2026-05-22 upgraded ~25 source-confirmed items to catalogued (kiosk paired state, clock, quality dialogs, assets, timer, OEE). _Denominator updated 2026-05-22 after ui-scout final sweep._

---

## Component Inventory

Schema: component · type · route · file `path:line` · renders-for · states · purpose

---

### Area 1 — Kanban (`/kanban`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| K-01 | `app-kanban` / KanbanComponent | page | `/kanban` | `features/kanban/kanban.component.ts:40` | all authenticated | empty(J-1 in ORDER CONFIRMED) · populated(3 track-types, 10 cols) · board-view · team-view | Job board — board/team view toggle, drag-drop columns, job list |
| K-02 | `app-board-column` / BoardColumnComponent | cluster | `/kanban` | `features/kanban/components/board-column.component.ts:9` | all authenticated | empty(per col) · populated(J-1) | Single stage column; renders job cards; WIP-limit indicator |
| K-03 | `app-job-card` / JobCardComponent | cluster | `/kanban` | `features/kanban/components/job-card.component.ts:11` | all authenticated | populated(J-1 "Test widget") | Compact job card with priority dot, avatar, hold badge |
| K-04 | `app-job-detail-panel` / JobDetailPanelComponent | panel | `/kanban` (slide-out) | `features/kanban/components/job-detail-panel.component.ts:43` | all authenticated | panel opens on card click (CDK overlay, dialog-backdrop confirmed); Subtasks section in bodyText; Cost Analysis + Operation Time sections locatable + scrollable; cover-photo (panel__cover-btn) + edit (panel__edit) + Dispose (.action-btn) buttons visible — sweep G/H 2026-05-22; inner CDK content not in bodyText; K-08/K-09 tab content source-confirmed from component files | Full job detail: fields, subtasks, links, BOM, files, activity; hosts Cost + OpTime tabs |
| K-05 | `app-job-detail-dialog` / JobDetailDialogComponent | dialog | `/kanban` (from B-01 row click) | `features/kanban/components/job-detail-dialog.component.ts:19` | all authenticated | source-confirmed: MatDialog wrapper injecting K-04 panel content; opened from BacklogComponent row click; same CDK layout as panel but modal | Dialog wrapper around JobDetailPanelComponent (same content, modal variant) |
| K-06 | `app-job-dialog` / JobDialogComponent (create) | form | `/kanban` | `features/kanban/components/job-dialog.component.ts:26` | all authenticated · CAP-MFG-WO-RELEASE gates button | form-populated(title/desc/track-type/customer/assignee/priority/due-date) | Create new job |
| K-07 | `app-job-dialog` / JobDialogComponent (edit) | form | `/kanban` | `features/kanban/components/job-dialog.component.ts:26` | all authenticated | source-confirmed: same 7 fields as K-06 (title/desc/trackTypeId/customerId/assigneeId/priority/dueDate) pre-populated from `job` input; `mode='edit'`; track-type locked (editJob does not pass trackTypeId); trigger: panel__edit button in K-04 | Edit existing job metadata |
| K-08 | `app-job-cost-tab` / JobCostTabComponent | tab | `/kanban` (inside K-04) | `features/kanban/components/job-cost-tab.component.ts:14` | all authenticated | source-confirmed: cost-summary header (totalEstimated/totalActual/quotedPrice/variance) + material-issues table (part#/desc/qty/unitCost/totalCost/issueType/issuedAt) + RECALCULATE COSTS toolbar action + return-material row action + empty state; trigger: Cost tab in K-04 | Job cost summary + material-issues table within detail panel |
| K-09 | `app-operation-time-tab` / OperationTimeTabComponent | tab | `/kanban` (inside K-04) | `features/kanban/components/operation-time-tab.component.ts:12` | all authenticated | source-confirmed: operations table (seq#/name/estSetup/actSetup/estRun/actRun/totalMin/eff%/progress-bar) + totals strip (totalEstimated/totalActual/overallEfficiency) + empty state; trigger: Operation Time tab in K-04 | Est vs actual setup/run minutes per operation sequence |
| K-10 | `app-cover-photo-upload-dialog` / CoverPhotoUploadDialogComponent | dialog | `/kanban` (from K-04) | `features/kanban/components/cover-photo-upload-dialog.component.ts:17` | all authenticated | trigger confirmed — panel__cover-btn click opens CDK overlay (sweep G 2026-05-22); fields source-confirmed: `app-file-upload-zone` + UPLOAD PHOTO button | Upload/view cover photo for a job |
| K-11 | `app-dispose-job-dialog` / DisposeJobDialogComponent | dialog | `/kanban` (from K-04) | `features/kanban/components/dispose-job-dialog.component.ts:23` | all authenticated | trigger confirmed — .action-btn "Dispose" button visible + clicked, CDK overlay opened (sweep H 2026-05-22); fields source-confirmed: disposition type select, reason/notes, CANCEL/DISPOSE | Mark job as disposed (scrapped / cancelled / other) with reason |
| K-12 | KanbanService | service | `/kanban` | `features/kanban/services/kanban.service.ts:1` | n/a | n/a | Primary kanban data service (board, jobs, CRUD, BOM, files, parts) |
| K-13 | JobCostService | service | `/kanban` | `features/kanban/services/job-cost.service.ts:1` | n/a | n/a | Job cost summary + operation-time data |

---

### Area 2 — Backlog (`/backlog`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| B-01 | `app-backlog` / BacklogComponent | page | `/backlog` | `features/backlog/backlog.component.ts:41` | all authenticated | populated(J-1 in table) · filters(track/priority/assignee) · table-view · NEW JOB button | Unscheduled job queue — table + card-grid view modes, search/filter, open job detail |
| B-02 | `app-backlog-card-grid` / BacklogCardGridComponent | cluster | `/backlog` | `features/backlog/components/backlog-card-grid/backlog-card-grid.component.ts:6` | all authenticated | card-grid confirmed 2026-05-22: view_module toggle clicked; J-1 "Test widget" / ORDER CONFIRMED / Normal / Acme Corp / No date displayed in card layout — sweep H | Card-grid layout for backlog jobs (alternative to table view) |
| B-03 | BacklogService | service | `/backlog` | `features/backlog/services/backlog.service.ts:1` | n/a | n/a | Backlog job list data |

> BacklogComponent re-uses `JobDetailDialogComponent` (K-05) and `JobDialogComponent` (K-06/07) from kanban.

---

### Area 3 — Planning (`/planning`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| P-01 | `app-planning` / PlanningComponent | page | `/planning` | `features/planning/planning.component.ts:33` | Admin · Manager · PM | empty-cycle-state ("No planning cycle selected — CREATE FIRST CYCLE") · backlog-panel-with-J-1 · NEW CYCLE button | Planning-cycle management: cycle selector, backlog drag-onto-cycle board |
| P-02 | `app-cycle-board` / CycleBoardComponent | panel | `/planning` (embedded) | `features/planning/components/cycle-board/cycle-board.component.ts:12` | Admin · Manager · PM | source-confirmed: inputs `cycle(PlanningCycleDetail)` + `loading`; computed progressPercent/daysRemaining/isActive/sortedEntries; CDK drag-drop reorder (`entryReordered` output); per-entry: priority chip + complete-checkmark button + remove button; empty state via `app-empty-state`; no work center data in env so entries not seeded | Cycle entry board: progress bar, days-remaining, drag-to-reorder entries |
| P-03 | `app-cycle-dialog` / CycleDialogComponent | form | `/planning` | `features/planning/components/cycle-dialog/cycle-dialog.component.ts:18` | Admin · Manager · PM | form-populated(cycle name/start date/end date/goals/CANCEL/CREATE) | Create / edit planning cycle |
| P-04 | CAP-PLAN-MRP disabled state | state | `/planning` | `features/planning/planning.component.ts:62` + `planning.service.ts:11` | Admin · Manager · PM | DN-8: capability gate | Board renders empty with capability-disabled banner when CAP-PLAN-MRP is off |
| P-05 | PlanningService | service | `/planning` | `features/planning/services/planning.service.ts:13` | n/a | n/a | Cycle CRUD + entry management; pre-checks CAP-PLAN-MRP (`planning.service.ts:56`) |

> **CAP-PLAN-MRP**: Defined as `PLANNING_CAPABILITY = 'CAP-PLAN-MRP'` at `planning.service.ts:11`. `isDisabled()` check at `planning.service.ts:56`. Capability-disabled banner on `planning.component.ts:62`. Status in this env: **CONFIRMED NOT DISABLED** — planning loaded normally with no capability-blocked banner (Q-PL-01 DONE 2026-05-22); NEW CYCLE + CycleDialog fully functional.

---

### Area 4 — Scheduling (`/scheduling/:tab`)

Tabs (from `scheduling.component.ts:29`): `gantt` · `dispatch` · `work-centers` · `shifts` · `runs`

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| S-01 | `app-scheduling` / SchedulingComponent | page | `/scheduling/:tab` | `features/scheduling/scheduling.component.ts:35` | Admin · Manager | live: all 5 tabs reached · KPI chips (0 scheduled ops, 0 in progress, 0 work centers) | Tab host for all scheduling views |
| S-02 | Gantt tab | tab | `/scheduling/gantt` | `features/scheduling/scheduling.component.ts:29` | Admin · Manager | empty("No operations") · RUN SCHEDULER button | Gantt schedule of operations |
| S-03 | Dispatch tab | tab | `/scheduling/dispatch` | `features/scheduling/scheduling.component.ts:29` | Admin · Manager | empty("No dispatch items") · work-center select + LOAD button | Dispatch list — work released to floor |
| S-04 | Work-centers tab | tab | `/scheduling/work-centers` | `features/scheduling/scheduling.component.ts:29` | Admin · Manager | empty("No work centers defined") | Work-center definitions for scheduling |
| S-05 | Shifts tab | tab | `/scheduling/shifts` | `features/scheduling/scheduling.component.ts:29` | Admin · Manager | empty("No shifts defined") | Shift definitions |
| S-06 | Runs tab | tab | `/scheduling/runs` | `features/scheduling/scheduling.component.ts:29` | Admin · Manager | empty("No scheduling runs yet") | Schedule run history |
| S-07 | SchedulingService | service | `/scheduling` | `features/scheduling/services/scheduling.service.ts:1` | n/a | n/a | Schedule data (gantt, dispatch, work-centers, shifts, runs) |

> All tabs are rendered within the single SchedulingComponent; tab model types at `scheduling.model.ts` include: `ScheduleRun`, `ScheduledOperation`, `WorkCenter`, `DispatchListItem`, `WorkCenterLoad`, `Shift`. **Source-confirmed: SchedulingComponent does NOT inject MatDialog — there are zero dialogs in the scheduling area.** All actions are inline (execute-schedule is a direct service call; dispatch loads on work-center selection).

---

### Area 5 — Shop-Floor / Kiosk (`/display/shop-floor`)

Route is under `/display/` path with **no auth guard** — public kiosk terminal.

#### 5A — Main Display (`/display/shop-floor`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| SF-01 | `app-shop-floor-display` / ShopFloorDisplayComponent | page | `/display/shop-floor` | `features/shop-floor/shop-floor-display.component.ts:52` | all (public) | unpaired-setup-form(live) · paired-main-display(ENV-BLOCK: source-confirmed: DisplayPhase='main'\|'pin'\|'actions'\|'job-select'\|'receiving'\|'shipping'; main phase: workers strip/active-jobs/clock/KPI bar; light/dark theme toggle; font-size scaling; `isUnpaired = signal(!localStorage.getItem('forge-kiosk-device-token'))`) | Main kiosk display: phases = main/pin/actions/job-select/receiving/shipping |
| SF-02 | `app-kiosk-setup` / KioskSetupComponent | panel | `/display/shop-floor` (phase=setup) | `features/shop-floor/components/kiosk-setup/kiosk-setup.component.ts:15` | all (public) | admin-login-form(live: email/password/SIGN-IN-AS-ADMIN) · configure-terminal(live: terminal-name/team-select/CREATE-NEW-TEAM/ACTIVATE-TERMINAL) | Admin-login + team/terminal config before kiosk goes live |
| SF-03 | `app-kiosk-search-bar` / KioskSearchBarComponent | cluster | `/display/shop-floor` | `features/shop-floor/components/kiosk-search-bar/kiosk-search-bar.component.ts:12` | all (public) | ENV-BLOCK: paired state only; source-confirmed: renders on main phase of SF-01 for worker name/badge lookup | Worker search/lookup bar on kiosk main screen |
| SF-04 | `app-kiosk-session-bar` / KioskSessionBarComponent | cluster | `/display/shop-floor` | `features/shop-floor/components/kiosk-session-bar/kiosk-session-bar.component.ts:9` | all (public) | ENV-BLOCK: paired + worker logged in; source-confirmed: shows current kiosk session worker info | Logged-in worker session info bar |
| SF-05 | `app-numeric-keypad` / NumericKeypadComponent | cluster | `/display/shop-floor` | `features/shop-floor/components/numeric-keypad/numeric-keypad.component.ts:20` | all (public) | ENV-BLOCK: rendered on 'pin' phase of SF-01; source-confirmed at `:20` | Touch-friendly numeric entry (PIN, quantities) |
| SF-06 | `app-pin-prompt-dialog` / PinPromptDialogComponent | dialog | `/display/shop-floor` (phase=pin) | `features/shop-floor/components/pin-prompt-dialog/pin-prompt-dialog.component.ts:9` | all (public) | ENV-BLOCK: phase=pin of SF-01; source-confirmed at `:9` | PIN entry dialog for worker auth on kiosk |
| SF-07 | `app-scan-action-overlay` / ScanActionOverlayComponent | panel | `/display/shop-floor` + `/display/shop-floor/scan` | `features/shop-floor/components/scan-action-overlay/scan-action-overlay.component.ts:52` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed: OverlayPhase='idle'\|'loading'\|'actions'\|'move'\|'count'\|'receive'\|'issue'\|'ship'\|'inspect'\|'job'\|'return'; 8 QuickAction buttons (Move/Count/Receive/Issue/Ship/Inspect/Return/Job) with icons and colors; hosts all 8 scan-flow components | Action selection overlay after barcode scan; hosts all 8 scan-flow sub-components |
| SF-08 | `app-scan-undo-list` / ScanUndoListComponent | panel | `/display/shop-floor` | `features/shop-floor/components/scan-undo-list/scan-undo-list.component.ts:12` | all (public) | ENV-BLOCK: paired main display only; source-confirmed at `:12` | Recent scan history with undo capability |
| SF-09 | `app-scan-devices-panel` / ScanDevicesPanelComponent | panel | `/display/shop-floor` | `features/shop-floor/components/scan-devices-panel/scan-devices-panel.component.ts:13` | all (public) | ENV-BLOCK: paired main display only; source-confirmed at `:13` | Connected scan device management panel |
| SF-10 | `app-scan-location-view` / ScanLocationViewComponent | panel | `/display/shop-floor` | `features/shop-floor/components/scan-location-view/scan-location-view.component.ts:7` | all (public) | ENV-BLOCK: paired main display only; source-confirmed at `:7` | Current inventory location view on kiosk |
| SF-11 | `app-training-mode-banner` / TrainingModeBannerComponent | state | `/display/shop-floor` | `features/shop-floor/components/training-mode-banner/training-mode-banner.component.ts:4` | all (public) | ENV-BLOCK: paired + trainingMode=true; source-confirmed: `trainingMode = signal(false)` at `shop-floor-display.component.ts:95`; banner visible when true; all actions simulated in that mode | Banner shown when kiosk training mode active |

#### 5B — Scan Flows (rendered within SF-01 or SF-07)

| # | component | type | file | renders-for | states | purpose |
|---|-----------|------|------|-------------|--------|---------|
| SF-12 | `app-scan-job-flow` / ScanJobFlowComponent | panel | `features/shop-floor/components/scan-job-flow/scan-job-flow.component.ts:14` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed: JobStep='actions'\|'confirm-advance'\|'log-note'\|'processing'\|'done'; actions: start-timer/stop-timer/advance-stage/log-note; `noteControl` for log-note step | Report time/progress on a job |
| SF-13 | `app-scan-move-flow` / ScanMoveFlowComponent | panel | `features/shop-floor/components/scan-move-flow/scan-move-flow.component.ts:16` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed: MoveStep='quantity'\|'destination'\|'confirm'; move-all or partial qty; destination by select or barcode scan; calls `scanAction.move()` | Move inventory to a different location |
| SF-14 | `app-scan-receive-flow` / ScanReceiveFlowComponent | panel | `features/shop-floor/components/scan-receive-flow/scan-receive-flow.component.ts:16` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed: ReceiveStep='select-po'\|'quantity'\|'destination'\|'confirm'; PO lines from scan context; to-location select; cross-ref Q2C PO-receiving | Receive PO items (cross-ref: Q2C PO-receiving) |
| SF-15 | `app-scan-return-flow` / ScanReturnFlowComponent | panel | `features/shop-floor/components/scan-return-flow/scan-return-flow.component.ts:26` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed at `:26` | Return material to stock |
| SF-16 | `app-scan-ship-flow` / ScanShipFlowComponent | panel | `features/shop-floor/components/scan-ship-flow/scan-ship-flow.component.ts:19` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed at `:19` | Ship outbound order items |
| SF-17 | `app-scan-count-flow` / ScanCountFlowComponent | panel | `features/shop-floor/components/scan-count-flow/scan-count-flow.component.ts:13` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed at `:13` | Physical inventory count |
| SF-18 | `app-scan-inspect-flow` / ScanInspectFlowComponent | panel | `features/shop-floor/components/scan-inspect-flow/scan-inspect-flow.component.ts:12` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed at `:12` | QC inspection on kiosk |
| SF-19 | `app-scan-issue-flow` / ScanIssueFlowComponent | panel | `features/shop-floor/components/scan-issue-flow/scan-issue-flow.component.ts:13` | all (public) | ENV-BLOCK: barcode scan required; source-confirmed at `:13` | Issue material to a job |

> All scan-flow components render for `all (public)` — inside the no-auth kiosk route. Trigger: scan barcode on `/display/shop-floor` → `ScanActionOverlayComponent` (SF-07) selects flow by action type.

#### 5C — Sub-routes

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| SF-20 | `app-shop-floor-clock` / ShopFloorClockComponent | page | `/display/shop-floor/clock` | `features/shop-floor/clock/shop-floor-clock.component.ts:28` | all (public) | redirects-to-setup-when-unpaired(live) · ENV-BLOCK for paired phases; source-confirmed: KioskPhase='setup'\|'dashboard'\|'identifying'\|'pin'\|'job-scanned'\|'manual-login'\|'clock'; dashboard: workersIn/workersOnBreak/workersOut lists + activeJobs + completedToday + overdueJobs; PIN: `pinControl` (min 4 digits) + `kioskAuthError`; manual-login: email+password controls; clock: per-worker clock-in/out buttons; RFID relay via `WebHidRfidService`; 30s auto-logout | Dedicated clock-in/out kiosk; phases: setup/dashboard/identifying/pin/job-scanned/manual-login/clock |
| SF-21 | `app-inventory-scan` / InventoryScanComponent | page | `/display/shop-floor/scan` | `features/shop-floor/scan/inventory-scan.component.ts:12` | all (public) | empty(idle scan prompt — "0 SCANNED · Scan a part barcode to begin") | Standalone barcode-scan terminal for inventory transactions |
| SF-22 | `app-scan-daily-log` / ScanDailyLogComponent | page | `/display/shop-floor/scan-log` (also embedded in SF-01) | `features/shop-floor/components/scan-daily-log/scan-daily-log.component.ts:27` | all (public) | empty("No scan activity for this date") · date/action-type filters | Daily scan activity log — shown inline on main display and at /scan-log route |

#### 5D — Services

| component | file | purpose |
|-----------|------|---------|
| ShopFloorService | `features/shop-floor/services/shop-floor.service.ts:1` | Worker lookup, terminal config, job/floor data |
| ScanDeviceService | `features/shop-floor/services/scan-device.service.ts:1` | Barcode/RFID device management |
| ScanValidationService | `features/shop-floor/services/scan-validation.service.ts:1` | Validate scan inputs before action |

---

### Area 6 — Time-Tracking (`/time-tracking`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| TT-01 | `app-time-tracking` / TimeTrackingComponent | page | `/time-tracking` | `features/time-tracking/time-tracking.component.ts:27` | all authenticated | empty("No time entries found") · date-from/date-to filters · START TIMER + MANUAL ENTRY buttons visible · "Total: 0.0h across 0 entries" summary | Time entry list with date-range filter; active-timer row highlighted; delete uses ConfirmDialog |
| TT-02 | Add Time Entry inline dialog | form | `/time-tracking` (inline `showDialog` signal) | `features/time-tracking/time-tracking.component.ts:72` | all authenticated | form-populated(date/category/hours/minutes/notes/CANCEL/LOG ENTRY) | Manual entry: date, hours, minutes, category, notes; draft-aware |
| TT-03 | Start Timer inline dialog | form | `/time-tracking` (inline `showTimerDialog` signal) | `features/time-tracking/time-tracking.component.ts:87` | all authenticated | dialog confirmed 2026-05-22 (sweep H): Category select (None/Production/Setup/Inspection/Maintenance/Training/Meeting/Admin/Cleanup/Other) + Notes textarea + CANCEL + START (play_circle); timer running: `activeTimer` signal non-null → active row gets `row--active` CSS class; stop-dialog source-confirmed | Start timer: category + notes; timer state tracked via `activeTimer` signal |
| TT-04 | Stop Timer inline dialog | form | `/time-tracking` (inline `showStopDialog` signal) | `features/time-tracking/time-tracking.component.ts:94` | all authenticated | source-confirmed: single `stopNotesControl` (notes only; no category field); triggered by `openStopTimer()` when `activeTimer` non-null; `showStopDialog` signal at `:94` | Stop active timer with optional notes |
| TT-05 | TimeTrackingService | service | `/time-tracking` | `features/time-tracking/services/time-tracking.service.ts:1` | n/a | n/a | Time entries, clock events, timer control, pay periods |
| TT-06 | TimerHubService (shared) | service | shared | `shared/services/timer-hub.service.ts:1` | n/a | n/a | SignalR hub for real-time timer events (used by TT + job detail panel) |

---

### Area 7 — OEE (`/oee`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| OE-01 | `app-oee` / OeeComponent | page | `/oee` | `features/oee/oee.component.ts:25` | Admin · Manager | empty("No work centers") · KPI chips(0.0% AVG OEE / 0/0 WORLD CLASS) · date-range presets(Last 30 Days/This Month/This Week) | OEE dashboard: work-center card grid, date-range filter, trend + losses charts |
| OE-02 | `app-oee-work-center-card` / OeeWorkCenterCardComponent | cluster | `/oee` | `features/oee/components/oee-work-center-card/oee-work-center-card.component.ts:7` | Admin · Manager | ENV-DATA: no work centers in env; source-confirmed: gauge card per work-center; `selected` output → `selectedWorkCenterId` signal on OeeComponent | Per-work-center OEE gauge card; click selects for detail charts |
| OE-03 | `app-oee-trend-chart` / OeeTrendChartComponent | cluster | `/oee` (detail panel) | `features/oee/components/oee-trend-chart/oee-trend-chart.component.ts:8` | Admin · Manager | ENV-DATA: no work centers; source-confirmed: line chart (OEE + availability + performance + quality over time) when work center selected | Line chart: OEE + availability + performance + quality over time |
| OE-04 | `app-six-big-losses-chart` / SixBigLossesChartComponent | cluster | `/oee` (detail panel) | `features/oee/components/six-big-losses-chart/six-big-losses-chart.component.ts:9` | Admin · Manager | ENV-DATA: no work centers; source-confirmed: bar chart (Six Big Losses: equipment-failure/setup/idling/speed/defects/yield) when work center selected | Bar chart: Six Big Losses (equipment failure, setup, idling, speed, defects, yield) |
| OE-05 | OeeService | service | `/oee` | `features/oee/services/oee.service.ts:1` | n/a | n/a | OEE calculations, trend data, six-big-losses by work-center |

---

### Area 8 — Quality (`/quality/:tab`)

Tabs (from `quality.component.ts:38`): `inspections` · `lots` · `spc-charts` · `spc-data` · `spc-ooc` · `ncrs` · `capas` · `ecos` · `gages`

> **Source-confirmed**: `QualityComponent` has no intra-component role branches or capability checks. Route guard `['Admin','Manager','Engineer']` is the sole gate; all three roles see identical content.

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| Q-01 | `app-quality` / QualityComponent | page | `/quality/:tab` | `features/quality/quality.component.ts:42` | Admin · Manager · Engineer | page-loaded · all 9 tabs rendered · correct create-buttons per tab | Tab host for all quality views |
| Q-02 | Inspections tab (inline in Q-01) | tab | `/quality/inspections` | `features/quality/quality.component.ts:42` | Admin · Manager · Engineer | empty(live) · NEW INSPECTION button(live) · status-filter source-confirmed (InProgress/Passed/Failed) · columns: date/job/template/inspector/lotNumber/status/resultsSummary; ENV-DATA: no inspections in env | QC inspection list: status filter (InProgress/Passed/Failed) |
| Q-02a | Create Inspection inline dialog | form | `/quality/inspections` | `features/quality/quality.component.ts:92` | Admin · Manager · Engineer | trigger confirmed live (CDK overlay opened — sweep H); source-confirmed fields: templateId(select), jobId, lotNumber, notes; CANCEL + SAVE | New inspection: template, job, lot number, notes |
| Q-03 | Lots tab (inline in Q-01) | tab | `/quality/lots` | `features/quality/quality.component.ts:42` | Admin · Manager · Engineer | empty(live) · NEW LOT button(live) · columns: lotNumber/partNumber/partDescription/quantity/jobNumber/supplierLotNumber/expirationDate/createdAt; ENV-DATA: no lots in env | Lot records table |
| Q-03a | Create Lot inline dialog | form | `/quality/lots` | `features/quality/quality.component.ts:141` | Admin · Manager · Engineer | trigger confirmed live (CDK overlay opened — sweep H); source-confirmed fields: partId(req), quantity(req, min 1), lotNumber, jobId, supplierLotNumber, notes | New lot: part, quantity, lot number, supplier lot, expiration |
| Q-03b | Lot Traceability inline dialog | panel | `/quality/lots` | `features/quality/quality.component.ts:142` | Admin · Manager · Engineer | source-confirmed: triggered by row action → `showTraceDialog` signal; displays `LotTraceability` data; ENV-DATA: no lots to trace | Trace lot lineage; triggered by traceability row action |
| Q-04 | `app-spc-characteristics` / SpcCharacteristicsComponent | tab | `/quality/spc-charts` | `features/quality/components/spc-characteristics.component.ts:20` | Admin · Manager · Engineer | empty(live) · NEW CHARACTERISTIC button(live) | SPC characteristics list; select characteristic to view chart |
| Q-05 | `app-spc-chart` / SpcChartComponent | tab | `/quality/spc-charts` (detail) | `features/quality/components/spc-chart.component.ts:12` | Admin · Manager · Engineer | source-confirmed: control chart rendered when characteristic selected; ENV-DATA: no SPC characteristics defined in env | Control chart for selected SPC characteristic |
| Q-06 | `app-spc-data-entry` / SpcDataEntryComponent | tab | `/quality/spc-data` | `features/quality/components/spc-data-entry.component.ts:10` | Admin · Manager · Engineer | empty · NEW CHARACTERISTIC button | Enter new SPC measurement data points |
| Q-07 | `app-spc-ooc-list` / SpcOocListComponent | tab | `/quality/spc-ooc` | `features/quality/components/spc-ooc-list.component.ts:16` | Admin · Manager · Engineer | empty(no OOC events) · no create button | Out-of-control alerts list |
| Q-08 | `app-ncr-list` / NcrListComponent | tab | `/quality/ncrs` | `features/quality/components/ncr-list.component.ts:22` | Admin · Manager · Engineer | empty(live) · NEW NCR button(live) · **Create dialog** source-confirmed: type(Internal/Supplier/Customer), partId(req), jobId, detectedAtStage(Receiving/InProcess/FinalInspection/Shipping/Customer/Audit), description(req), affectedQuantity(req), defectiveQuantity, containmentActions; filters: type+status · **Disposition dialog** source-confirmed: code(UseAsIs/Rework/Scrap/ReturnToVendor/SortAndScreen/Reject), notes, reworkInstructions · inline row actions: Disposition + Create CAPA | Non-conformance records list + create + disposition dialogs |
| Q-09 | `app-capa-list` / CapaListComponent | tab | `/quality/capas` | `features/quality/components/capa-list.component.ts:22` | Admin · Manager · Engineer | empty(live) · NEW CAPA button(live) · **Create dialog** source-confirmed: type(Corrective/Preventive), sourceType(Ncr/CustomerComplaint/InternalAudit/ExternalAudit/SpcOoc/ManagementReview/Other), title(req), problemDescription(req), impactDescription, ownerId(req), priority(1-Critical…5-Informational), dueDate(req) · inline row action: Advance Phase | Corrective and preventive actions list + inline create dialog |
| Q-10 | `app-eco-list` / EcoListComponent | tab | `/quality/ecos` | `features/quality/components/eco-list.component.ts:24` | Admin · Manager · Engineer | empty(live) · NEW ECO button(live) · **Create dialog** source-confirmed: title(req), description(req), changeType(New/Revision/Obsolescence/CostReduction/QualityImprovement), priority(Low/Normal/High/Critical), reasonForChange, impactAnalysis, effectiveDate · **Detail dialog** source-confirmed: affected-items table (entityType/entityId/changeDescription/isImplemented) + Add Affected Item + approve/implement actions (via `app-confirm-dialog`) · **Add-Affected-Item dialog**: entityType(Part/BOM/Operation/Drawing/Specification), entityId, changeDescription, oldValue, newValue | Engineering change orders list + create + detail + affected-items dialogs |
| Q-11 | `app-gage-list` / GageListComponent | tab | `/quality/gages` | `features/quality/components/gage-list.component.ts:23` | Admin · Manager · Engineer | empty(live) · NEW GAGE button(live) · **Create dialog** source-confirmed: description(req), gageType, manufacturer, model, serialNumber, calibrationIntervalDays(req, default 365), accuracySpec, rangeSpec, resolution, notes; status filter · **Detail dialog** source-confirmed: gage fields + calibration records table (date/result/lab/standards/asFound/asLeft/nextDue) + ADD CALIBRATION button · **Calibration dialog**: calibratedAt(req), result(Pass/Fail/Adjusted/OutOfTolerance), labName, standardsUsed, asFoundCondition, asLeftCondition, notes | Gage R&R list + create + detail + calibration dialogs |
| Q-12 | QualityService | service | `/quality` | `features/quality/services/quality.service.ts:1` | n/a | n/a | Inspections, QC templates, lot records, lot traceability, gages, calibration |
| Q-13 | NcrCapaService | service | `/quality` | `features/quality/services/ncr-capa.service.ts:1` | n/a | n/a | NCR and CAPA CRUD |
| Q-14 | EcoService | service | `/quality` | `features/quality/services/eco.service.ts:1` | n/a | n/a | ECO CRUD + affected-items |
| Q-15 | SpcService | service | `/quality` | `features/quality/services/spc.service.ts:1` | n/a | n/a | SPC characteristics, measurements, OOC events |

---

### Area 9 — MRP (`/mrp/:tab`)

Tabs (from `mrp.component.ts:55`): `dashboard` · `planned-orders` · `exceptions` · `runs` · `master-schedule` · `forecasts`

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| M-01 | `app-mrp` / MrpComponent | page | `/mrp/:tab` | `features/mrp/mrp.component.ts:59` | Admin · Manager | URL /mrp/dashboard reached live 2026-05-22; Playwright ops blocked post-load (MRP component makes 3 simultaneous API calls on dashboard tab causing JS-thread contention); all tab states source-confirmed | Tab host for all MRP views |
| M-02 | Dashboard tab (inline in M-01) | tab | `/mrp/dashboard` | `features/mrp/mrp.component.ts:59` | Admin · Manager | source-confirmed: KPI chips (Latest Run/Planned Orders/Firmed Orders/Unresolved Exceptions) · RUN MRP button (`executeRun()`) + SIMULATE button (`executeRun(true)`) | MRP summary KPIs |
| M-03 | Planned-orders tab (inline in M-01) | tab | `/mrp/planned-orders` | `features/mrp/mrp.component.ts:59` | Admin · Manager | source-confirmed: empty state · Status filter (Planned/Firmed/Released/Cancelled) · firm + release inline row actions | MRP-generated planned purchase/work orders |
| M-04 | Exceptions tab (inline in M-01) | tab | `/mrp/exceptions` | `features/mrp/mrp.component.ts:59` | Admin · Manager | source-confirmed: empty state · unresolved-only filter default · resolve inline row action | MRP exceptions / alerts |
| M-05 | Runs tab (inline in M-01) | tab | `/mrp/runs` | `features/mrp/mrp.component.ts:59` | Admin · Manager | source-confirmed: empty state · run-type/status columns · RUN MRP button | MRP run history |
| M-06 | Master-schedule tab (inline in M-01) | tab | `/mrp/master-schedule` | `features/mrp/mrp.component.ts:59` | Admin · Manager | source-confirmed: empty state · NEW SCHEDULE button (openCreateSchedule) · MPS VS ACTUAL row action | Master production schedule |
| M-07 | Forecasts tab (inline in M-01) | tab | `/mrp/forecasts` | `features/mrp/mrp.component.ts:59` | Admin · Manager | source-confirmed: empty state · GENERATE FORECAST button (openGenerateForecast) · approve inline row action | Demand forecasts |
| M-08 | `app-execute-mrp-run-dialog` / ExecuteMrpRunDialogComponent | dialog | `/mrp` | `features/mrp/components/execute-mrp-run-dialog.component.ts:30` | Admin · Manager | source-confirmed: run-type select, planning-horizon-days input, simulation hint text, CANCEL/RUN MRP button; triggered by `executeRun()` (live) / `executeRun(true)` (simulate) from M-02 dashboard; Playwright blocked post-load | Run-params dialog; triggered by RUN MRP / SIMULATE buttons |
| M-09 | `app-master-schedule-dialog` / MasterScheduleDialogComponent | dialog | `/mrp` | `features/mrp/components/master-schedule-dialog.component.ts:43` | Admin · Manager | source-confirmed: name/description/period-start(`app-datepicker`)/period-end/schedule-lines (add-line action; each line: part `app-entity-picker`, qty, due-date); create vs edit mode: `data.schedule` absent = create; triggered by `openCreateSchedule()`/`openEditSchedule()` on M-06 | Create/edit master schedule + schedule lines |
| M-10 | `app-generate-forecast-dialog` / GenerateForecastDialogComponent | dialog | `/mrp` | `features/mrp/components/generate-forecast-dialog.component.ts:20` | Admin · Manager | source-confirmed: name/part(`app-entity-picker`)/method(select)/historical-periods/smoothing-factor (conditional: shown only for ExponentialSmoothing); triggered by `openGenerateForecast()` on M-07; `approveForecast()` is inline row action with no dialog | Forecast generation params |
| M-11 | `app-mrp-run-detail-dialog` / MrpRunDetailDialogComponent | dialog | `/mrp` | `features/mrp/components/mrp-run-detail-dialog.component.ts:31` | Admin · Manager | source-confirmed: run summary header + parts-touched list; click part → time-bucket planned-orders + pegging trail; triggered by `openRunDetail(run)` (row click) on M-05 | Run detail + planned-order breakdown |
| M-12 | `app-mps-vs-actual-dialog` / MpsVsActualDialogComponent | dialog | `/mrp` | `features/mrp/components/mps-vs-actual-dialog.component.ts:23` | Admin · Manager | source-confirmed: per-part table (planned qty / actual completed qty / variance / variance-pct; negative = under, positive = over); triggered by `openMpsVsActual(schedule)` row action on M-06 | MPS vs actuals per-part comparison |
| M-13 | MrpService | service | `/mrp` | `features/mrp/services/mrp.service.ts:1` | n/a | n/a | MRP run execution, planned orders, exceptions, forecasts, master schedule |

---

### Area 10 — Assets (`/assets`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| A-01 | `app-assets` / AssetsComponent | page | `/assets` | `features/assets/assets.component.ts:27` | Admin · Manager | empty(live: "No assets found") · Search/Type/Status filters(live) · ADD ASSET button(live) | Asset list with search/type/status filters; opens A-02/A-03 on row click; ADD ASSET → A-04 form |
| A-02 | `app-asset-detail-panel` / AssetDetailPanelComponent | panel | `/assets` (slide-out via MatDialog → A-03) | `features/assets/components/asset-detail-panel/asset-detail-panel.component.ts:26` | Admin · Manager | source-confirmed: asset fields (name/assetType/status/location/manufacturer/model/serialNumber/currentHours) + status-change select + maintenance-log list (`getMaintenanceLogs()`) + `app-barcode-info` + `app-entity-activity-section` + `app-entity-link`; edit → `editRequested` output; ENV-DATA: no assets in env | Asset detail: fields, maintenance-log, barcode, activity; edit + status-change actions |
| A-03 | `app-asset-detail-dialog` / AssetDetailDialogComponent | dialog | `/assets` (MatDialog from row click) | `features/assets/components/asset-detail-dialog/asset-detail-dialog.component.ts:17` | Admin · Manager | source-confirmed: MatDialog wrapper opened by `DetailDialogService.open(...AssetDetailDialogComponent, {assetId})` in AssetsComponent:167; afterClosed result `{action:'edit', asset}` → opens A-04 edit form; ENV-DATA: no assets in env | Dialog shell for AssetDetailPanelComponent |
| A-04 | Create/Edit Asset form (inline in A-01) | form | `/assets` | `features/assets/assets.component.ts:62` | Admin · Manager | source-confirmed: fields: name(req), assetType(Machine/Tooling/Facility/Vehicle/Other, req), location, manufacturer, model, serialNumber, notes, isCustomerOwned(toggle), cavityCount, toolLifeExpectancy; full-record fields: acquisitionCost, depreciationMethod(StraightLine/DecliningBalance/UnitsOfProduction), workCenterId, glAccount; draft-aware; edit mode pre-populates from existing asset | Create / edit asset; same form for both modes |
| A-05 | AssetsService | service | `/assets` | `features/assets/services/assets.service.ts:1` | n/a | n/a | Asset CRUD, downtime log, maintenance log, subcontract orders |

---

### Area 11 — Maintenance (`/maintenance/predictions`)

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| MN-01 | `app-predictions` / PredictionsComponent | page | `/maintenance/predictions` | `features/maintenance/pages/predictions/predictions.component.ts:42` | Admin · Manager | empty(live: decision-prompt text confirmed) · Severity filter(live: All/Low/Medium/High/Critical) · Status filter(live: Open/Acknowledged/MaintenanceScheduled/Resolved/FalsePositive/Expired) · KPI strip + populated row states (Predicted/Acknowledged) source-confirmed; inline row actions: acknowledge + schedule-PM (no dialog) + resolve → MN-02 + false-positive → MN-02; ENV-DATA: no predictions in env | Predictive maintenance dashboard; inline ack/schedule-PM actions + resolve/false-positive via dialog |
| MN-02 | `app-resolve-prediction-dialog` / ResolvePredictionDialogComponent | dialog | `/maintenance/predictions` | `features/maintenance/components/resolve-prediction-dialog/resolve-prediction-dialog.component.ts:16` | Admin · Manager | source-confirmed: exactly 2 modes (`resolve`\|`false-positive`); both modes show notes field (`app-textarea`) + CANCEL + confirm button; triggered by resolve or false-positive row action; ENV-DATA: no predictions to trigger it | Notes dialog for resolve-or-false-positive action on a prediction |
| MN-03 | PredictiveMaintenanceService | service | `/maintenance` | `features/maintenance/services/predictive-maintenance.service.ts:1` | n/a | n/a | Predictive maintenance data + resolve actions |

---

### Area 12 — Worker Task View (`/worker`)

> **Role note**: `/worker` has no explicit role guard in `app.routes.ts`; all authenticated users can access it. ProductionWorker role uses this as their primary landing page for assigned jobs.

| # | component | type | route | file | renders-for | states | purpose |
|---|-----------|------|-------|------|-------------|--------|---------|
| W-01 | `app-worker` / WorkerComponent | page | `/worker` | `features/worker/worker.component.ts:13` | all authenticated | populated(task cards for Worker Sam) · empty-state("No tasks assigned") · loading | Worker task list; sorted by overdue → due-date → priority |
| W-02 | Task card | cluster | `/worker` | `features/worker/worker.component.ts:13` (inline template) | all authenticated | normal · overdue(red) · with-subtask-progress-bar | Per-job task card: job number, priority chip, title, stage chip, customer, due date, subtask progress bar; click navigates to `/kanban?job=<id>` |
| W-03 | WorkerService | service | `/worker` | `features/worker/services/worker.service.ts:1` | n/a | n/a | Fetch tasks assigned to current user |

> Sidebar for ProductionWorker role is minimal (no sub-nav groups): Home, dashboard, groups, insights, engineering icons only — no sales/production/admin groups.

---

### Customer Returns (cross-link)

> **NOT catalogued here.** Fully inventoried in `quote-to-cash.md §Segment 8`. CAP-O2C-RMA is DISABLED in this env (DN-8 terminal closure confirmed at `po-dialog.component.ts:309-317` pattern). No operations-side RMA screen is reachable.

---

## Open Items / Queue Summary

_Updated 2026-05-22 source-cataloger cycle 2: all queue items closed from source._

### All closures — source-cataloger cycle 2

**ENV-BLOCK closures** (terminal pairing + barcode HW not feasible in headless env):
- SF-01 paired state, SF-03–SF-11 (paired display components), SF-12–SF-19 (scan flows), SF-20 (clock all 7 phases): all source-confirmed via component source reads.

**ENV-DATA closures** (no seed data in env; behavior confirmed from source):
- OE-02/03/04 (no work centers), P-02 (no cycle entries), Q-05 (no SPC characteristics), Q-03b (no lots), A-02/03 (no assets), MN-01 populated + MN-02 (no predictions).

**Source-field closures** (dialog triggers confirmed live; fields source-confirmed):
- K-05/K-07/K-08/K-09/K-10/K-11: all Kanban detail/tab/dialog fields confirmed.
- TT-04: stop-timer dialog (single notes field) source-confirmed.
- Q-08 Disposition dialog (code/notes/reworkInstructions), Q-09 CAPA (7 fields), Q-10 ECO (create+detail+add-item dialogs), Q-11 Gage (create+detail+calibration dialogs): all source-confirmed.
- A-04 create/edit form (15 fields including full-record fields): source-confirmed.
- M-08–M-12: all 5 MRP dialogs: fields source-confirmed (Playwright blocked for live trigger).

**Previously closed:**
- Q-SC-06: SchedulingComponent has zero dialogs.
- Q-QL-10: QualityComponent has no role branches.
- Q-SF-15: Kiosk route has no auth guard; PIN flow is internal kiosk session.

### Remaining open items: NONE

**Queue is fully drained. All 90 items (64 feature + 26 shared) have source-confirmed or better status. Zero needs-live. Zero not-yet-located. Reconciliation checklist: all 15 routes [x] + all live-sweep states [x].**

---

_Commit cycle 3 2026-05-22: K-04 promoted partial→source-confirmed; denominator 0 partial / 0 needs-live / 90 total; phase complete_


---

## §D — Platform Region

_Folded-in verbatim from `analysis/inventory/platform.md`. Sole-writer cataloger content preserved as-is._

# Platform Region — Component Inventory

_Phase 04 · Sole writer: source-cataloger + ui-scout live sweep · 2026-05-22_
_Scope: dashboard (+ widgets), reports (dynamic builder), search, notifications (panel + bell), chat, approvals, events, calendar_
_Cross-link: dashboard widgets that render O2C/operations data → cross-linked to owning region's inventory file; only the platform-side container/widget shell is catalogued here._

---

## Cross-links

- **Search** — not a standalone feature module; search bar + results dropdown are implemented inside `AppHeaderComponent` (`core/layout/app-header.component.ts`). Catalogued here as shell-level cluster (SR-*).
- **Notification Bell** — the bell icon and its dropdown `NotificationPanelComponent` live in `AppHeaderComponent`; the full `/notifications` routed page is a separate feature (N-*).
- **Events** — `features/events/` contains models + services only (no UI components). Admin-side events management (`/admin/events`) is owned by the admin region; cross-linked there. No platform-side UI components to catalogue for this area.
- **Dashboard widget data** — Todays Tasks links to `/kanban` (operations); Deadlines links to `/calendar` (platform-owned); Open Orders links to `/sales-orders` (Q2C); Cycle Progress links to `/planning` (operations); Margin Summary links to job margins (operations). Widget containers catalogued here; underlying entity inventory in respective regions.
- `operations.md` / `quote-to-cash.md` — source for operations + Q2C data that feeds dashboard widgets.

---

## Source Map

### Feature directories (platform scope)

| Area | Features path | Routes file | Route(s) | Role guard (source) |
|------|--------------|-------------|----------|---------------------|
| Dashboard | `features/dashboard/` | `dashboard.routes.ts` | `/dashboard` | none — all authenticated |
| Reports | `features/reports/` | `reports.routes.ts` | `/reports`, `/reports/builder`, `/reports/sankey` | `roleGuard('Admin','Manager','PM')` (`app.routes.ts:139`) — ⚠️ live discrepancy: ui-scout observed Engineer accessing `/reports` with no redirect (PLT-Q-004); source blocks all non-Admin/Manager/PM; `engineer@forge.local` has single role `"Engineer"` (ENV-READY.md); re-verify — guard cache or wrong role provisioning suspected |
| Notifications | `features/notifications/` | `notifications.routes.ts` | `/notifications` | none — all authenticated |
| Chat | `features/chat/` | `chat.routes.ts` | `/chat` | none — all authenticated; `CAP-EXT-CHAT` gates bell in header |
| Chat (popout) | `features/chat/` | `app.routes.ts:42` | `/chat/popout` | none — all authenticated; top-level standalone `loadComponent`, not nested in chat.routes.ts |
| Approvals | `features/approvals/` | `approvals.routes.ts` | `/approvals/:tab` (→ inbox) | `roleGuard('Admin','Manager','PM','OfficeManager')` |
| Calendar | `features/calendar/` | `calendar.routes.ts` | `/calendar` | none — all authenticated |
| Events | `features/events/` | — | — | service-only; no UI routes |
| Search | `core/layout/app-header.component.ts` | — | shell (all authenticated routes) | none — always visible |

### Shared components referenced by platform features

_Template file:line = first occurrence in each consuming template; abbreviated paths relative to `forge-ui/src/app/`._

| ID | Selector | Path | Consuming templates (file:line) |
|----|----------|------|---------------------------------|
| SH-01 | `app-notification-panel` | `shared/components/notification-panel/` | `core/layout/app-header.component.html:208` |
| SH-02 | `app-dashboard-widget` | `shared/components/dashboard-widget/` | `features/dashboard/dashboard.component.html:118` |
| SH-03 | `app-kpi-chip` | `shared/components/kpi-chip/` | `features/dashboard/dashboard.component.html:79` (×3: lines 79,84,90) |
| SH-04 | `app-page-header` | `shared/components/page-header/` | `dashboard.component.html:7` · `reports.component.html:1` · `sankey-reports.component.html:1` · `notifications.component.html` (toolbar area) · `approvals.component.html:1` · `calendar.component.html:1` |
| SH-05 | `app-data-table` | `shared/components/data-table/` | `reports.component.html:57` (×28 instances) · `report-builder.component.html:127` · `notifications.component.html:27` · `approval-inbox.component.html:2` · `approval-workflow-editor.component.html:9` |
| SH-06 | `app-select` | `shared/components/select/` | `notifications.component.html:16` · `calendar.component.html:3` · `report-builder.component.html:3` (×7 instances) · `approval-workflow-editor.component.html:41` |
| SH-07 | `app-input` | `shared/components/input/` | `notifications.component.html:15` · `report-builder.component.html:45` · `save-report-dialog.component.html:3` · `approval-workflow-editor.component.html:21` (×5 instances) |
| SH-08 | `app-toolbar` | `shared/components/toolbar/` | `notifications.component.html:14` |
| SH-09 | `app-empty-state` | `shared/components/empty-state/` | `todays-tasks-widget.component.html:2` · `action-items-widget.component.html:2` · `cycle-progress-widget.component.html:3` · `approval-inbox.component.html` (empty pending list) · `report-builder.component.html:142` |
| SH-10 | `app-dialog` | `shared/components/dialog/` | `approval-inbox.component.html:40` · `approval-workflow-editor.component.html:37` · `save-report-dialog.component.html:1` · (chat dialogs C-03/C-04/C-05 each use it in their own templates) |
| SH-11 | `app-textarea` | `shared/components/textarea/` | `eod-prompt-widget.component.html:9` · `approval-inbox.component.html:44` · `approval-workflow-editor.component.html:44` · `save-report-dialog.component.html:4` |
| SH-12 | `app-drillable-chart` | `shared/components/drillable-chart/` | `reports.component.html:51` (×4 instances: lines 51,82,96,215) |
| SH-13 | `app-datepicker` | `shared/components/datepicker/` | `reports.component.html:35` (×2) · `sankey-reports.component.html:27` (×2) |
| SH-14 | `app-sankey-chart` | `shared/components/sankey-chart/` | `sankey-reports.component.html:40` |
| SH-15 | `app-page-layout` | `shared/components/page-layout/` | `report-builder.component.html:1` |
| SH-16 | `app-validation-button` | `shared/components/validation-button/` | `save-report-dialog.component.html:10` · `approval-workflow-editor.component.html:84` |
| SH-17 | `app-avatar` | `shared/components/avatar/` | `chat.component.html:11` (×6: lines 11,79,184,211,256,271) · `todays-tasks-widget.component.html:18` · `team-load-widget.component.html:3` · `notification-panel.component.html` (SH-01 template) |
| SH-18 | `app-entity-link` | `shared/components/entity-link/` | `action-items-widget.component.html:17` |
| SH-19 | `app-ai-help-panel` | `shared/components/ai-help-panel/` | `core/layout/app-header.component.html:212` |
| SH-20 | `app-training-context-panel` | `shared/components/training-context-panel/` | `core/layout/app-header.component.html:213` |
| SH-21 | `app-chat-preview-popup` | `shared/components/chat-preview-popup/` | `app.component.html:28` |
| SH-22 | `app-status-badge` | `shared/components/status-badge/` | `todays-tasks-widget.component.html:19` — **added**: discovered during template grep; not in initial list |
| SH-23 | `app-toggle` | `shared/components/toggle/` | `reports/components/save-report-dialog/save-report-dialog.component.html:5` — **added**: found in selector diff; missed in initial sweep |

---

## Reconciliation Checklist

_These three trees are the completeness denominator. All items must be ticked or explicitly queued before the phase closes._

### Tree 1 — Routes (11 routes in scope)
- [x] `/dashboard` — live swept as admin + worker + engineer; 10 widgets, getting-started banner, focus/ambient/edit modes
- [x] `/reports` — live swept; 30 nav items confirmed, empty states, ProductionWorker redirect confirmed
- [x] `/reports/builder` — live swept; entity select + empty state; cascade source-confirmed (PLT-Q-028 closed)
- [x] `/reports/sankey` — live swept; 10 diagram types confirmed, date filter, empty state
- [x] `/notifications` — N-01 source-confirmed; single component file; no sub-components; 2-tab layout + preferences toggles all inline (signals :99); PLT-Q-025 dequeued
- [x] `/chat` — live swept; renders ChatComponent in page mode; DM+Channels empty states; CAP-EXT-CHAT disables API
- [x] `/chat/popout` — live swept; two-panel popout; empty states; CAP-EXT-CHAT disables API
- [x] `/approvals/inbox` — live swept; empty table; CAP-P2P-APPROVALS blocks seeding
- [x] `/approvals/workflows` — live swept; empty table + New Workflow button; Admin only confirmed (Engineer redirect observed)
- [x] `/calendar` — live swept; month/week/day all observed; PO toggle; day-click confirmed
- [x] Shell search bar (AppHeader) — live swept; query "widget" → 3 results; single-column (no AI)

### Tree 2 — Feature component files (features/ tree, 32 active entries)

| area | component file (relative to `features/`) | inv ID | status |
|------|------------------------------------------|--------|--------|
| dashboard | `dashboard/dashboard.component.ts` | D-01 | source-confirmed |
| dashboard | `dashboard/components/todays-tasks-widget.component.ts` | D-02 | source-confirmed |
| dashboard | `dashboard/components/jobs-by-stage-widget.component.ts` | D-03 | source-confirmed |
| dashboard | `dashboard/components/team-load-widget.component.ts` | D-04 | source-confirmed |
| dashboard | `dashboard/components/deadlines-widget.component.ts` | D-05 | source-confirmed |
| dashboard | `dashboard/components/activity-widget.component.ts` | D-06 | source-confirmed |
| dashboard | `dashboard/widgets/margin-summary-widget/margin-summary-widget.component.ts` | D-07 | source-confirmed |
| dashboard | `dashboard/components/cycle-progress-widget.component.ts` | D-08 | source-confirmed |
| dashboard | `dashboard/components/open-orders-widget.component.ts` | D-09 | source-confirmed |
| dashboard | `dashboard/components/eod-prompt-widget.component.ts` | D-10 | source-confirmed |
| dashboard | `dashboard/components/action-items-widget.component.ts` | D-11 | source-confirmed |
| dashboard | `dashboard/components/ambient-mode.component.ts` | D-12 | source-confirmed |
| dashboard | `dashboard/components/focus-mode.component.ts` | D-13 | source-confirmed |
| dashboard | `dashboard/components/getting-started-banner.component.ts` | D-14 | source-confirmed |
| reports | `reports/reports.component.ts` | R-01 | source-confirmed |
| reports | `reports/components/report-builder/report-builder.component.ts` | R-02 | source-confirmed |
| reports | `reports/components/sankey-reports/sankey-reports.component.ts` | R-03 | source-confirmed |
| reports | `reports/components/save-report-dialog/save-report-dialog.component.ts` | R-04 | source-confirmed |
| notifications | `notifications/notifications.component.ts` | N-01 | source-confirmed |
| chat | `chat/chat.component.ts` | C-01 | source-confirmed |
| chat | `chat/components/chat-popout/chat-popout.component.ts` | C-02 | source-confirmed (standalone route `/chat/popout`; imports C-09/C-10/C-11/C-13) |
| chat | `chat/components/channel-browser-dialog/channel-browser-dialog.component.ts` | C-03 | source-confirmed (imported C-01 line 22, C-02 line 15) |
| chat | `chat/components/channel-settings-dialog/channel-settings-dialog.component.ts` | C-04 | source-confirmed (imported C-01 line 23, C-02 line 16) |
| chat | `chat/components/create-channel-dialog/create-channel-dialog.component.ts` | C-05 | source-confirmed (imported C-01 line 21, C-02 line 14) |
| ~~chat~~ | ~~`chat/components/create-announcement-dialog/create-announcement-dialog.component.ts`~~ | ~~C-06~~ | **CROSS-LINK ADMIN** — owned by `features/admin/components/announcements-panel/`; not in platform denominator |
| ~~chat~~ | ~~`chat/components/share-entity-dialog/share-entity-dialog.component.ts`~~ | ~~C-07~~ | **confirmed unused** — no import found in any .ts or .html; removed from denominator |
| ~~chat~~ | ~~`chat/components/entity-mention-popover/entity-mention-popover.component.ts`~~ | ~~C-08~~ | **confirmed unused** — no import found in any .ts or .html; removed from denominator |
| chat | `chat/components/chat-channel-header/chat-channel-header.component.ts` | C-09 | source-confirmed (imported C-02 line 19; also mobile-chat.component.ts) |
| chat | `chat/components/chat-channel-list/chat-channel-list.component.ts` | C-10 | source-confirmed (imported C-02 line 17; also mobile-chat.component.ts) |
| chat | `chat/components/chat-message-area/chat-message-area.component.ts` | C-11 | source-confirmed (imported C-02 line 18; also mobile-chat.component.ts) |
| ~~chat~~ | ~~`chat/components/chat-message-attachment/chat-message-attachment.component.ts`~~ | ~~C-12~~ | **confirmed unused** — no import found in any .ts or .html; removed from denominator |
| chat | `chat/components/chat-thread-panel/chat-thread-panel.component.ts` | C-13 | source-confirmed (imported C-02 line 20; also mobile-chat.component.ts) |
| ~~chat~~ | ~~`chat/components/thread-panel/thread-panel.component.ts`~~ | ~~C-14~~ | **confirmed unused** — duplicate thread-panel impl; not imported anywhere; removed from denominator |
| approvals | `approvals/approvals.component.ts` | AP-01 | source-confirmed |
| approvals | `approvals/components/approval-inbox/approval-inbox.component.ts` | AP-02 | source-confirmed |
| approvals | `approvals/components/approval-workflow-editor/approval-workflow-editor.component.ts` | AP-03 | source-confirmed |
| calendar | `calendar/calendar.component.ts` | CA-01 | source-confirmed |
| search | _(no `features/search/` dir)_ | SR-01·SR-02 | **SHELL-ONLY** — search UI is inline template logic inside `core/layout/app-header.component.ts`; no standalone `.component.ts` file exists; catalogued as SR-01 (search bar `:113`) and SR-02 (results dropdown `:114`) under the SEARCH inventory section; not counted in feature denominator |
| events | _(no UI files in `features/events/`)_ | — | **SERVICE-ONLY** — `features/events/` contains only `event.model.ts` + `events.service.ts`; zero `.component.ts` files; admin-side event management route (`/admin/events`) is owned by admin region (D2 cross-link); no platform UI to catalogue |

### Tree 3 — Shared components used by platform (shared/ tree, 23 entries)

| shared component | inv ID | status |
|-----------------|--------|--------|
| `shared/components/notification-panel/notification-panel.component.ts` | SH-01 | source-confirmed |
| `shared/components/dashboard-widget/dashboard-widget.component.ts` | SH-02 | source-confirmed |
| `shared/components/kpi-chip/kpi-chip.component.ts` | SH-03 | source-confirmed |
| `shared/components/page-header/page-header.component.ts` | SH-04 | source-confirmed (also used by other regions — DO NOT re-catalogue there) |
| `shared/components/data-table/data-table.component.ts` | SH-05 | source-confirmed |
| `shared/components/select/select.component.ts` | SH-06 | source-confirmed |
| `shared/components/input/input.component.ts` | SH-07 | source-confirmed |
| `shared/components/toolbar/toolbar.component.ts` | SH-08 | source-confirmed |
| `shared/components/empty-state/empty-state.component.ts` | SH-09 | source-confirmed |
| `shared/components/dialog/dialog.component.ts` | SH-10 | source-confirmed |
| `shared/components/textarea/textarea.component.ts` | SH-11 | source-confirmed |
| `shared/components/drillable-chart/drillable-chart.component.ts` | SH-12 | source-confirmed |
| `shared/components/datepicker/datepicker.component.ts` | SH-13 | source-confirmed |
| `shared/components/sankey-chart/sankey-chart.component.ts` | SH-14 | source-confirmed |
| `shared/components/page-layout/page-layout.component.ts` | SH-15 | source-confirmed |
| `shared/components/validation-button/validation-button.component.ts` | SH-16 | source-confirmed |
| `shared/components/avatar/avatar.component.ts` | SH-17 | source-confirmed |
| `shared/components/entity-link/entity-link.component.ts` | SH-18 | source-confirmed |
| `shared/components/ai-help-panel/ai-help-panel.component.ts` | SH-19 | source-confirmed (AppHeader) |
| `shared/components/training-context-panel/training-context-panel.component.ts` | SH-20 | source-confirmed (AppHeader) |
| `shared/components/chat-preview-popup/chat-preview-popup.component.ts` | SH-21 | source-confirmed (app.component) |
| `shared/components/status-badge/status-badge.component.ts` | SH-22 | source-confirmed (todays-tasks-widget.component.html:19) — discovered in template grep |
| `shared/components/toggle/toggle.component.ts` | SH-23 | source-confirmed (save-report-dialog.component.html:5) — discovered in selector diff |

---

## Reconciliation Denominator

_Source tree + imports analysis 2026-05-22._

- **Feature components**: 32 (dashboard 14 · reports 4 · notifications 1 · chat 9 · approvals 3 · calendar 1 · events 0)
  - _Reports note: 4 component files contain 28 report-type configs (ReportDef[]) + 10 Sankey flow configs (SankeyReportDef[]); configs are not components and do not count toward denominator. Architecture: config-driven single-component pattern, source-confirmed._
- **Shared components**: 23 (SH-01–SH-21 initial + SH-22 StatusBadge discovered via template grep + SH-23 ToggleComponent discovered via selector diff; SH-24 `app-barcode-info` removed — all consumers are non-platform regions: admin/kanban/inventory/parts/purchase-orders/sales-orders; out of platform scope)
- **Shell search cluster (AppHeader)**: SR-01 search bar + SR-02 search results dropdown — inline template logic in `AppHeaderComponent`; no standalone component files; not counted in feature denominator
- **Total denominator**: 55 items (32 feature + 23 shared; SR-01/SR-02 are sub-entries of AppHeader, not independent files)

_Chat denominator note (resolved 2026-05-22): C-06 CreateAnnouncementDialog is admin-owned (used by `features/admin/components/announcements-panel/`). C-07 ShareEntityDialog, C-08 EntityMentionPopover, C-12 ChatMessageAttachment, C-14 ThreadPanel are confirmed unused — no imports in any .ts or .html. Removed 5, leaving chat=9 active files (C-01–C-05, C-09–C-11, C-13). C-09/C-10/C-11/C-13 confirmed in ChatPopoutComponent (C-02) and features/mobile/pages/mobile-chat.component.ts (cross-region usage, component still owned here)._

_Three-tree checklist pass (2026-05-22): routes 10/11 ticked ([ ] `/notifications` → PLT-Q-025 not yet swept); features 32/32 source-confirmed; shared 22/22 source-confirmed. All feature + shared file:line entries confirmed from source (`@Component` decorator grep); zero `:1` placeholders remain in active (non-struck-through) rows. Search and Events scope areas explicitly accounted in feature tree: search has no `features/search/` dir — UI is inline template logic in AppHeaderComponent (catalogued SR-01/SR-02, not in feature denominator); events has no UI in `features/events/` — only `event.model.ts` + `events.service.ts` exist (verified by directory listing); admin route cross-linked to admin region (D2). Both areas now have explicit "SHELL-ONLY" / "SERVICE-ONLY" rows in Tree 2 — no scope area is blank._

**RECONCILE = 0 (2026-05-23, CLOSED):** ui-scout independent `<app-*>` selector diff confirms SH-23 `app-toggle` is the sole missing platform-scoped shared component — added. SH-24 `app-barcode-info` removed (all consumers non-platform; out of scope). 8 remaining uncatalogued selectors (announcement-overlay, connection-banner, demo-marker, keyboard-shortcuts-help, loading-overlay, offline-banner, onboarding-banner, toast-container) + app-header/app-sidebar are `app.component.html` app-root shell concerns — out of platform scope, deferred to core/shared phase. Route `/chat/popout` routes-file corrected to `app.routes.ts:42` (top-level standalone registration). Routes 11/11 ticked · Feature tree 32/32 source-confirmed · Shared tree 23/23 located with consuming template file:line · Zero rows carrying `unreached`/`TODO`/`needs-live` status · D3 capability gates confirmed: `CAP-EXT-CHAT`, `CAP-P2P-APPROVALS`, `CAP-EXT-AI-ASSISTANT` · PLT queue depth = 0 · **Denominator 55 final and closed** (32 feature + 23 shared).

---

## Inventory

> Status column: **catalogued** = file:line confirmed + live states observed; **source-confirmed** = file:line confirmed, live sweep pending; **needs-live** = source uncertain, requires live sweep.

---

### DASHBOARD

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| DashboardComponent | page | `/dashboard` | `features/dashboard/dashboard.component.ts:53` | all authenticated | loading·populated·error·ambient-mode·focus-mode | GridStack-based widget grid with drag/resize editing mode, CSV export, idle→ambient-mode trigger |
| DashboardWidgetComponent | shared-cmp | `/dashboard` | `shared/components/dashboard-widget/dashboard-widget.component.ts:4` | all authenticated | populated | Shell wrapper (header, title, icon, view-all link) for all dashboard widgets |
| TodaysTasksWidgetComponent | widget | `/dashboard` | `features/dashboard/components/todays-tasks-widget.component.ts:16` | all authenticated | empty·populated | Lists current user's assigned open tasks; links to /kanban |
| JobsByStageWidgetComponent | widget | `/dashboard` | `features/dashboard/components/jobs-by-stage-widget.component.ts:5` | all authenticated | empty·populated | Bar chart of job counts per kanban stage; links to /kanban |
| TeamLoadWidgetComponent | widget | `/dashboard` | `features/dashboard/components/team-load-widget.component.ts:6` | all authenticated | empty·populated | Per-user task counts for team workload visibility; links to /time-tracking |
| DeadlinesWidgetComponent | widget | `/dashboard` | `features/dashboard/components/deadlines-widget.component.ts:8` | all authenticated | empty·populated | Upcoming job due dates sorted by proximity; overdue flag; links to /calendar |
| ActivityWidgetComponent | widget | `/dashboard` | `features/dashboard/components/activity-widget.component.ts:8` | all authenticated | empty·populated | Recent platform activity feed (cross-region events) |
| MarginSummaryWidgetComponent | widget | `/dashboard` | `features/dashboard/widgets/margin-summary-widget/margin-summary-widget.component.ts:16` | all authenticated | empty·populated | Job margin KPI summary — cross-links to job margin data (operations region) |
| CycleProgressWidgetComponent | widget | `/dashboard` | `features/dashboard/components/cycle-progress-widget.component.ts:11` | all authenticated | empty·populated | Active planning cycle progress; links to /planning |
| OpenOrdersWidgetComponent | widget | `/dashboard` | `features/dashboard/components/open-orders-widget.component.ts:17` | all authenticated | empty·populated | Open sales order count/value summary; links to /sales-orders |
| EodPromptWidgetComponent | widget | `/dashboard` | `features/dashboard/components/eod-prompt-widget.component.ts:9` | all authenticated | empty·populated | End-of-day check-in prompt for current user |
| ActionItemsWidgetComponent | widget | `/dashboard` | `features/dashboard/components/action-items-widget.component.ts:29` | all authenticated | empty·populated | System-generated follow-up tasks (QuoteExpiring, LeadStale, InvoicePastDue, etc.) with entity links |
| AmbientModeComponent | panel | `/dashboard` | `features/dashboard/components/ambient-mode.component.ts:7` | all authenticated | active | Full-screen ambient display triggered after configured idle timeout (AMBIENT_IDLE_PREF_KEY) |
| FocusModeComponent | panel | `/dashboard` | `features/dashboard/components/focus-mode.component.ts:10` | all authenticated | active | Distraction-free focused widget view; toggled via ?focus=true queryParam |
| GettingStartedBannerComponent | state | `/dashboard` | `features/dashboard/components/getting-started-banner.component.ts:20` | all authenticated | active (empty/first-login state) | Onboarding banner shown when dashboard has no data or on first visit |

---

### REPORTS

_**Architecture: CONFIG-DRIVEN (source-confirmed).** `features/reports/` has exactly 4 `.component.ts` files (confirmed via glob). `ReportsComponent` defines a `ReportDef[]` array of 28 entries (`reports.component.ts:59–88`) and an `activeReport` signal that drives a `@switch` in the template — one component renders all 28 types; no per-type component file exists. `SankeyReportsComponent` defines a `SankeyReportDef[]` array of 10 entries (`sankey-reports.component.ts:35–46`) with the same pattern. The 28 report types and 10 Sankey flows are **config instances, not components**; they are enumerated below as data but do not contribute to the denominator._

_**Route guard (source):** `roleGuard('Admin','Manager','PM')` registered at `app.routes.ts:139`; `hasAnyRole` = plain `Array.includes()` against JWT roles. `renders-for` is set to `Admin·Manager·PM` throughout. ⚠️ **Live discrepancy (PLT-Q-004):** ui-scout observed Engineer (`engineer@forge.local`, single role `"Engineer"` per ENV-READY.md) accessing `/reports` with no redirect — contradicts the guard. Suspected cause: engineer@ provisioned with extra role in JWT, or Angular guard response was cached from a prior admin session. Needs re-verification; if confirmed broken, raises a security finding._

_**D2 cross-links — report data by region:** operations data — jobs-by-stage · overdue-jobs · job-completion-trend · on-time-delivery · average-lead-time · team-workload · my-work-history · time-in-stage · cycle-review · job-margin · my-cycle-summary · employee-productivity · maintenance · quality-scrap · rd; Q2C data — expense-summary · my-expense-history · lead-pipeline · quote-to-close · lead-sales · ar-aging · revenue · simple-pnl · customer-activity · shipping-summary; mixed/platform data — time-by-user · inventory-levels. Sankey flows draw from all regions. Platform claims only the 4 shell component files._

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| ReportsComponent | page | `/reports` | `features/reports/reports.component.ts:46` | Admin·Manager·PM | loading·populated·empty (per-report) | Left-nav selector + chart+table view for 28 built-in report types; type chosen via `activeReport` signal switch; optional date-range filter |
| ReportBuilderComponent | page | `/reports/builder` | `features/reports/components/report-builder/report-builder.component.ts:46` | Admin·Manager·PM | loading·populated·empty | Dynamic query builder — entity/field/filter/group-by/sort/chart-type; saved reports; CSV export. **PLT-Q-028 dequeued:** cascade (column-select, filter rows, Run, Save) confirmed inline — `selectedColumns` signal + `FilterRow[]` signal array + `runReport()`/`openSaveDialog()` methods, all within this class; only child dialog is R-04 (already catalogued). Headless Playwright signal-batching blocked live drive; source-confirmation satisfies bar. |
| SankeyReportsComponent | page | `/reports/sankey` | `features/reports/components/sankey-reports/sankey-reports.component.ts:22` | Admin·Manager·PM | loading·populated·empty | Left-nav selector + Sankey chart for 10 flow types; type chosen via `activeReport` signal |
| SaveReportDialogComponent | dialog | `/reports/builder` | `features/reports/components/save-report-dialog/save-report-dialog.component.ts:25` | Admin·Manager·PM | active | Dialog to name + describe + share-flag a custom saved report |

**28 built-in report type configs (ReportDef[], not components):** jobs-by-stage · overdue-jobs · time-by-user · expense-summary · lead-pipeline · job-completion-trend · on-time-delivery · average-lead-time · team-workload · customer-activity · my-work-history · my-time-log · ar-aging · revenue · simple-pnl · my-expense-history · quote-to-close · shipping-summary · time-in-stage · employee-productivity · inventory-levels · maintenance · quality-scrap · cycle-review · job-margin · my-cycle-summary · lead-sales · rd

**10 Sankey flow type configs (SankeyReportDef[], not components):** quote-to-cash · job-stage-flow · material-to-product · worker-orders · expense-flow · vendor-supply-chain · quality-rejection · inventory-location · customer-revenue · training-completion

---

### SEARCH (shell — AppHeaderComponent)

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| Global Search Bar | cluster | all authenticated routes (AppHeader) | `core/layout/app-header.component.ts:113` | all authenticated | idle·focused·searching·results-shown | Full-text search input (Ctrl+K shortcut); debounce 300ms; pipes to SearchService + AiService |
| Search Results Dropdown | panel | all authenticated routes (AppHeader) | `core/layout/app-header.component.ts:114` | all authenticated; AI/RAG columns gated by `CAP-EXT-AI-ASSISTANT` (`ai.service.ts:78` — `AiService.available()` signal; hides RAG answer + AI suggestions when disabled) | empty·populated·ai-loading | Dropdown showing entity matches (SearchResult[]); AI suggestions (AiSearchSuggestion[]) + RAG answer (RagSearchResult[]) shown only when `CAP-EXT-AI-ASSISTANT` enabled; navigates to entity detail on click |

---

### NOTIFICATIONS

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| NotificationsComponent | page | `/notifications` | `features/notifications/notifications.component.ts:18` | all authenticated | loading·populated·empty | Full-page notification log — DataTable with search/severity/source filters; 2 tabs: All Notifications + Preferences (mark-all-read, dismiss-all, preference toggles) |
| NotificationPanelComponent | panel | all authenticated routes (AppHeader bell) | `shared/components/notification-panel/notification-panel.component.ts:14` | all authenticated | empty·populated | Header dropdown panel showing filterable notification list; unread count badge; routes to /notifications for full view |
| Notification Bell / Badge | action | all authenticated routes (AppHeader) | `core/layout/app-header.component.ts:88` | all authenticated | unread-count-badge | Header bell icon toggling NotificationPanelComponent; shows unread count badge |
| Notifications Preferences Cluster | cluster | `/notifications` | `features/notifications/notifications.component.ts:99` | all authenticated | active | Preference toggles (email on critical, email on assignment, email on mention, sound) — rendered in 'preferences' tab |

---

### CHAT

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| ChatComponent | page | `/chat` | `features/chat/chat.component.ts:35` | all authenticated (`CAP-EXT-CHAT` gates header button only) | loading·populated·empty·dm-view·channel-view·user-picker-view | Full chat client — DM + channel list, message area, thread panel, file upload; also used as header panel when `isRoutedPage=false` |
| ChatComponent (header panel) | panel | all authenticated routes | `features/chat/chat.component.ts:56` | all authenticated if `CAP-EXT-CHAT` enabled | empty·populated | Same ChatComponent rendered in AppHeader with panelOpen toggle (isRoutedPage=false); routes to /chat if popped out |
| ChatPopoutComponent | page | `/chat/popout` | `features/chat/components/chat-popout/chat-popout.component.ts:22` | all authenticated | loading·populated | Detached browser-window chat view (window.open popout); composed of C-09/C-10/C-11/C-13; coordinated via ChatBroadcastService |
| ChannelBrowserDialogComponent | dialog | `/chat`, `/chat/popout` | `features/chat/components/channel-browser-dialog/channel-browser-dialog.component.ts:13` | all authenticated | loading·populated·empty | Browse + join existing channels dialog |
| ChannelSettingsDialogComponent | dialog | `/chat`, `/chat/popout` | `features/chat/components/channel-settings-dialog/channel-settings-dialog.component.ts:23` | all authenticated (channel member) | active | Channel settings (rename, topic, mute, leave) for selected channel |
| CreateChannelDialogComponent | dialog | `/chat`, `/chat/popout` | `features/chat/components/create-channel-dialog/create-channel-dialog.component.ts:27` | all authenticated | active | Create new chat channel (name, type, description) |
| ~~CreateAnnouncementDialogComponent~~ | ~~dialog~~ | — | `features/chat/components/create-announcement-dialog/create-announcement-dialog.component.ts:1` | — | **CROSS-LINK ADMIN** — opened only by `features/admin/components/announcements-panel/`; not platform-owned |
| ~~ShareEntityDialogComponent~~ | ~~dialog~~ | — | `features/chat/components/share-entity-dialog/share-entity-dialog.component.ts:1` | — | **confirmed unused** — no imports anywhere |
| ~~EntityMentionPopoverComponent~~ | ~~panel~~ | — | `features/chat/components/entity-mention-popover/entity-mention-popover.component.ts:1` | — | **confirmed unused** — no imports anywhere |
| ChatChannelHeaderComponent | cluster | `/chat/popout` | `features/chat/components/chat-channel-header/chat-channel-header.component.ts:11` | all authenticated | source-confirmed (C-02 popout + mobile-chat) | Channel/DM header bar (name, avatar, back button, settings, mute toggle, popout show) |
| ChatChannelListComponent | panel | `/chat/popout` | `features/chat/components/chat-channel-list/chat-channel-list.component.ts:21` | all authenticated | source-confirmed (C-02 popout + mobile-chat) | Left-sidebar DM + channel list with search input, section collapse, unread badges |
| ChatMessageAreaComponent | panel | `/chat/popout` | `features/chat/components/chat-message-area/chat-message-area.component.ts:12` | all authenticated | source-confirmed (C-02 popout + mobile-chat) | Scrollable message history + compose input + file attach; input/output-driven (presentation) |
| ~~ChatMessageAttachmentComponent~~ | ~~cluster~~ | — | `features/chat/components/chat-message-attachment/chat-message-attachment.component.ts:1` | — | **confirmed unused** — not imported anywhere; removed from denominator |
| ChatThreadPanelComponent | panel | `/chat/popout` | `features/chat/components/chat-thread-panel/chat-thread-panel.component.ts:9` | all authenticated | source-confirmed (C-02 popout + mobile-chat) | Thread reply side-panel; input/output-driven (presentation); closes on output |
| ~~ThreadPanelComponent~~ | ~~panel~~ | — | `features/chat/components/thread-panel/thread-panel.component.ts:13` | — | **confirmed unused** — duplicate thread impl (stateful via ChatService injection); not imported anywhere; removed from denominator |
| ChatPreviewPopupComponent | panel | all authenticated routes | `shared/components/chat-preview-popup/chat-preview-popup.component.ts:16` | all authenticated | empty·populated | Shell-level popup for inline chat previews (always mounted in app.component) |
| MentionRenderPipe | shared-cmp | `/chat` | `features/chat/pipes/mention-render.pipe.ts:1` | all authenticated | — | Renders @-mentions in message text (pipe, not a component; included for completeness) |

---

### APPROVALS

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| ApprovalsComponent | page | `/approvals/:tab` (→inbox) | `features/approvals/approvals.component.ts:15` | Admin·Manager·PM·OfficeManager; approve/reject/workflow-create actions gated by `CAP-P2P-APPROVALS` (backend gate — UI routes render regardless; API returns 403 when cap disabled) | active | Tab shell with two tabs: Inbox (all approvers) + Workflows (Admin/Manager only via `canManageWorkflows` computed) |
| ApprovalInboxComponent | tab | `/approvals/inbox` | `features/approvals/components/approval-inbox/approval-inbox.component.ts:19` | Admin·Manager·PM·OfficeManager (`CAP-P2P-APPROVALS` gates approve/reject API calls) | loading·empty·populated | Pending approval requests table (entity type, summary, workflow, step, amount, requester, date); approve/reject actions; reject requires comment via dialog |
| Reject Approval Dialog | dialog | `/approvals/inbox` | `features/approvals/components/approval-inbox/approval-inbox.component.ts:40` | Admin·Manager·PM·OfficeManager (`CAP-P2P-APPROVALS` gates submit) | active | Inline dialog (showRejectDialog signal) — requires rejection comments textarea; SUBMIT REJECT action |
| ApprovalWorkflowEditorComponent | tab | `/approvals/workflows` | `features/approvals/components/approval-workflow-editor/approval-workflow-editor.component.ts:22` | Admin·Manager (canManageWorkflows); `CAP-P2P-APPROVALS` gates workflow CRUD API | loading·empty·populated | Workflow definitions table + create/edit dialog; configures entity type, threshold, multi-step approver chain (SpecificUser, Role, Manager) |
| Workflow Create/Edit Dialog | dialog | `/approvals/workflows` | `features/approvals/components/approval-workflow-editor/approval-workflow-editor.component.ts:44` | Admin·Manager (`CAP-P2P-APPROVALS` gates save) | active | Dialog (showDialog signal) — workflow name, entity type, description, amount threshold, dynamic steps array (add/remove steps) |

---

### CALENDAR

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| CalendarComponent | page | `/calendar` | `features/calendar/calendar.component.ts:19` | all authenticated | loading·empty·populated | 3-view calendar (month/week/day) of job due dates; track-type filter; toggle PO delivery events overlay; click day → day view; click job → /kanban?jobId=X |
| Calendar Month View | tab | `/calendar` | `features/calendar/calendar.component.ts:76` | all authenticated | empty·populated | 42-cell month grid (calendarDays computed); up to 3 visible jobs per cell + overflow count; PO delivery events overlay (poEventsByDate map) |
| Calendar Week View | tab | `/calendar` | `features/calendar/calendar.component.ts:80` | all authenticated | empty·populated | 7-column week grid (weekDays computed); jobs by date |
| Calendar Day View | tab | `/calendar` | `features/calendar/calendar.component.ts:84` | all authenticated | empty·populated | Single-day hourly grid (24 HOURS array); jobs with due-date match; PO delivery events for day |
| PO Deliveries Toggle | action | `/calendar` | `features/calendar/calendar.component.ts:140` | all authenticated | on·off | Toggle overlaying PO expected-delivery events on calendar; saved to userPreferences ('calendar:showPo') |

---

### EVENTS

_No UI components. `features/events/` contains models (`event.model.ts`) and `EventsService` only. Admin-side event management is at `/admin/events` — owned by admin region (cross-linked). No platform UI surfaces to catalogue._

---

### SHARED COMPONENTS (platform-scope usages)

| component | type | route | file | renders-for | states | purpose |
|-----------|------|-------|------|-------------|--------|---------|
| NotificationPanelComponent | panel | AppHeader (all authenticated) | `shared/components/notification-panel/notification-panel.component.ts:14` | all authenticated | empty·populated | see Notifications section above |
| DashboardWidgetComponent | shared-cmp | `/dashboard` | `shared/components/dashboard-widget/dashboard-widget.component.ts:4` | all authenticated | populated | see Dashboard section |
| KpiChipComponent | shared-cmp | `/dashboard` | `shared/components/kpi-chip/kpi-chip.component.ts:3` | all authenticated | — | KPI chip displayed in dashboard header strip |
| PageHeaderComponent | shared-cmp | all platform pages | `shared/components/page-header/page-header.component.ts:8` | all authenticated | — | Page title bar with optional action buttons |
| DataTableComponent | shared-cmp | `/notifications`, `/approvals/*`, `/reports*` | `shared/components/data-table/data-table.component.ts:40` | all authenticated | loading·empty·populated | Sortable/filterable data table with column manager, pagination |
| SelectComponent | shared-cmp | `/notifications`, `/calendar`, `/reports*` | `shared/components/select/select.component.ts:17` | all authenticated | — | Dropdown select field |
| InputComponent | shared-cmp | `/notifications`, `/approvals/*`, `/reports/builder` | `shared/components/input/input.component.ts:13` | all authenticated | — | Text input field |
| ToolbarComponent | shared-cmp | `/notifications` | `shared/components/toolbar/toolbar.component.ts:3` | all authenticated | — | Page action toolbar |
| EmptyStateComponent | shared-cmp | `/approvals/*`, `/reports/builder` | `shared/components/empty-state/empty-state.component.ts:3` | all authenticated | active | Empty-state message + optional action |
| DialogComponent | shared-cmp | `/approvals/*`, `/reports/builder`, `/chat` | `shared/components/dialog/dialog.component.ts:16` | all authenticated | active | Dialog shell (title, content, footer) |
| TextareaComponent | shared-cmp | `/approvals/*` | `shared/components/textarea/textarea.component.ts:12` | all authenticated | — | Multi-line text input |
| DrillableChartComponent | shared-cmp | `/reports` | `shared/components/drillable-chart/drillable-chart.component.ts:20` | Admin·Manager·PM | active | Chart with drill-down capability; expense breakdown |
| DatepickerComponent | shared-cmp | `/reports`, `/reports/sankey` | `shared/components/datepicker/datepicker.component.ts:27` | Admin·Manager·PM | — | Date input with picker UI |
| SankeyChartComponent | shared-cmp | `/reports/sankey` | `shared/components/sankey-chart/sankey-chart.component.ts:27` | Admin·Manager·PM | empty·populated | D3-based Sankey flow diagram |
| PageLayoutComponent | shared-cmp | `/reports/builder` | `shared/components/page-layout/page-layout.component.ts:8` | Admin·Manager·PM | — | Two-panel page layout (sidebar slot + content slot) |
| ValidationButtonComponent | shared-cmp | `/approvals/*`, `/reports/builder` | `shared/components/validation-button/validation-button.component.ts:22` | all authenticated | idle·loading·disabled | Submit button with built-in loading state + validation |
| AvatarComponent | shared-cmp | `/chat`, `/dashboard` (widgets), notification-panel | `shared/components/avatar/avatar.component.ts:3` | all authenticated | — | User initials/color avatar; chat.component.html:11 + todays-tasks-widget.component.html:18 + team-load-widget.component.html:3 |
| EntityLinkComponent | shared-cmp | `/dashboard` (action-items widget) | `shared/components/entity-link/entity-link.component.ts:43` | all authenticated | — | Clickable entity link; action-items-widget.component.html:17 |
| AiHelpPanelComponent | shared-cmp | AppHeader (all authenticated) | `shared/components/ai-help-panel/ai-help-panel.component.ts:17` | all authenticated | empty·populated | AI help side-panel; app-header.component.html:212 |
| TrainingContextPanelComponent | shared-cmp | AppHeader (all authenticated) | `shared/components/training-context-panel/training-context-panel.component.ts:17` | all authenticated | active | Training context/hints panel; app-header.component.html:213 |
| ChatPreviewPopupComponent | panel | all authenticated routes | `shared/components/chat-preview-popup/chat-preview-popup.component.ts:16` | all authenticated | empty·populated | Shell-level chat preview popup; app.component.html:28 |
| StatusBadgeComponent | shared-cmp | `/dashboard` (todays-tasks widget) | `shared/components/status-badge/status-badge.component.ts:3` | all authenticated | — | Job/task status badge pill; todays-tasks-widget.component.html:19 — SH-22 |
| ToggleComponent | shared-cmp | `/reports/builder` (save-report-dialog R-04) | `shared/components/toggle/toggle.component.ts:12` | Admin·Manager·PM (within R-04) | source-confirmed (live render shares PLT-Q-028 headless env constraint) | Toggle control (share-flag field) in SaveReportDialogComponent; save-report-dialog.component.html:5 — SH-23 |

---

## Live Sweep Results (ui-scout · 2026-05-22)

Screenshots: `E:/dev/forge/analysis/screenshots/platform/`
Roles swept: admin, worker, engineer

### Capability gate discoveries
- **CAP-EXT-CHAT DISABLED**: chat bell absent from header; `/chat` and `/chat/popout` routes still render (empty states). All chat API calls 403. Chat components catalogued from source; no live channel/DM data reachable.
- **CAP-P2P-APPROVALS DISABLED**: approval workflow POST 403; UI routes `/approvals/*` fully render. Inbox empty, Workflows empty. Approve/reject/dialog flows unreachable without pending items.
- **AI feature DISABLED**: no AI button in header; search single-column only; `app-ai-help-panel` button not rendered.

### Per-queue-item results (see platform-queue.md for status)

| ID | Item | Live Result |
|----|------|-------------|
| PLT-Q-001 | Dashboard 10 widgets | Observed: Today's Tasks (1 task "Test widget"/J-1), Jobs by Stage (bar chart with 1 Order Confirmed), Activity (2 entries), Margin Summary (100% avg margin, $125 revenue, 1 job), Open Orders (1 SO: Partially Shipped), EOD Prompt (textarea+SAVE form), Cycle Progress (empty "No active cycle"+START PLANNING), Deadlines (empty), Team Load (empty). Action Items widget in grid (10 total confirmed by DOM). Getting Started Banner visible: 2/4 steps done. |
| PLT-Q-002 | Ambient + Focus mode | Ambient: full-screen overlay with clock + KPIs (Esc to exit). Focus: full-page MY TASKS + OPEN ORDERS + EOD sections, close X. Both observed live. |
| PLT-Q-003 | Edit mode | Edit bar: "Drag widgets to rearrange. Resize from edges." hint + "+ ADD WIDGET" (disabled — all 10 widgets shown) + "RESET" button. Header: "DONE" replaces "CUSTOMIZE". Widget remove buttons (.widget-remove-btn) exist in source; DOM count=0 (all present, none removed). |
| PLT-Q-004 | 28 report types | All 30 nav items confirmed live: 28 report types + Sankey Diagrams + Report Builder. First 3 clicked (Jobs by Stage, Overdue Jobs, Time by User) — all render empty states. ProductionWorker role-redirected to /dashboard (confirmed live). Engineer can access /reports (no redirect observed). |
| PLT-Q-005 | Report Builder | Observed: Saved Reports dropdown, + New Report button, Entity select ("--Select Entity--"). Empty state "Configure your report and click Run" with analytics icon. Columns/filters/group/visualization sections appear after entity select (source-confirmed; not triggered live). Save dialog (RP-44) unreached. |
| PLT-Q-006 | Sankey Reports | Observed: 10 nav items (Quote-to-Cash Pipeline, Job Stage Flow, Material to Product, Worker to Orders, Expense Flow, Vendor Supply Chain, Quality/Rejection Flow, Inventory Location Flow, Customer Revenue Breakdown, Training Completion). Date filter (From/To + Apply). Empty state "No flow data available". Back to Reports button. ✅ CLOSED |
| PLT-Q-016 | ChatPopoutComponent | Observed: two-panel layout — left: "Chat" title + "Search conversations" input + empty ("No conversations yet"); right: empty placeholder "Select a conversation to start chatting". ✅ CLOSED |
| PLT-Q-017 | Notifications panel | Observed: 3 tabs (All · Messages · Alerts), 1 notification item ("Sales Order Confirmed" for SO-SO-00001), mark-all-read button (done_all), dismiss-all button. All 3 tabs visited. ✅ CLOSED |
| PLT-Q-018 | Approvals inbox | Observed: empty table ("No pending approvals"). Approve/reject buttons not rendered (no rows). CAP-P2P-APPROVALS blocks workflow seeding. |
| PLT-Q-019 | Workflow editor | Observed: empty data-table "No workflows defined" + "+ NEW WORKFLOW" button. Workflows tab accessible to Admin; not accessible to Engineer (redirected). Dialog not opened live. |
| PLT-Q-020 | Calendar | Observed: month view (42 cells, 0 jobs, 0 PO events), week view (7 columns, all empty), day view (empty). PO deliveries toggle clicked — button active state confirmed. Day cell click → switches to day view (no dialog). Track type select visible. ✅ CLOSED |
| PLT-Q-021 | Search | Observed: query "widget" → 3 results (J-1 Job, PRT-00001 Part, PRT-00002 Part). Single-column layout (no AI). Ctrl+K hint visible. ✅ CLOSED |
| PLT-Q-022 | Notification bell | Observed: badge=1 (unread notification), panel open/close confirmed, 3-tab panel renders. ✅ CLOSED |
| PLT-Q-023 | Chat header panel | CAP-EXT-CHAT disabled: chat bell not rendered in header. Slide-in panel not reachable. /chat route renders ChatComponent in isRoutedPage=true mode instead. |
| PLT-Q-024 | Chat full page | Observed: /chat shows DM section ("No conversations yet") + Channels section ("No channels" + Browse Channels). ✅ CLOSED (empty states) |
| NEW | `/notifications` full page | NOT VISITED — N-01 NotificationsComponent route not swept. Add to queue: PLT-Q-025. |
| NEW | User menu | Observed: user avatar, name (Admin, Forge), email (admin@forge.local), role (ADMIN), Account Settings, About, Language switcher (English/Español), Sign Out. About dialog: title "About Armory Works Forge", version, SHA, license, stack. ✅ CLOSED |
| NEW | Training panel | Observed: button renders; panel toggles open (app-training-context-panel). ✅ CLOSED |

## Open Items (remaining after live sweep)

1. ✅ **PLT-Q-025** — Notifications `/notifications` dequeued: N-01 source-confirmed; `NotificationsComponent` imports only SH-* (PageHeader, DataTable, Select, Input, Toolbar); 2-tab layout + preferences toggles are inline signals (lines :99–103); no sub-component files. Route ticked.
2. **PLT-Q-026** — Chat: all channel/DM/thread/compose sub-components (PLT-Q-023/024 partially closed but populated states unreachable — CAP-EXT-CHAT disabled). Need cap-enabled env.
3. **PLT-Q-027** — Approvals: approve + reject flows (PLT-Q-018); workflow create/edit dialog + step rows (PLT-Q-019). Need CAP-P2P-APPROVALS enabled or direct API seeding bypass.
4. ✅ **PLT-Q-028** — Report Builder cascade dequeued: column-select/filter-rows/Run/Save confirmed inline within `ReportBuilderComponent:46` (`selectedColumns` signal, `FilterRow[]` signal array, `runReport()`/`openSaveDialog()` methods). Only child dialog is `SaveReportDialogComponent` (R-04, already catalogued). No new component files. Headless Playwright signal-batching blocked live drive; source-confirmation satisfies bar.
5. ✅ **PLT-Q-029** — Widget-add-menu dequeued: inline `DashboardComponent` template driven by `WIDGET_REGISTRY` + `activeWidgetIds` signal — no dialog/sub-component file. CSV export is inline `exportCsv()` method. No new files; ui-scout observed 3 addable widgets (TodaysTasks/JobsByStage/TeamLoad) when 7 already active — confirms config-driven add/remove logic.
6. ✅ **PLT-Q-030** — Calendar job-chip dequeued: chip rendering is inline template; click dispatches router navigation to `/kanban?jobId=X` (D2 cross-link, operations-region). PO event chip also inline. No new platform component files.
7. **PLT-Q-031** — Reports: populated data states for 28 report types (all empty in non-seeded env for most; only SO-00001 data available).
8. **PLT-Q-032** — Search: AI column + RAG answer panel (AI feature disabled in this env).
9. **PLT-Q-033** — (pending ui-scout cycle-2 verdict — HOLD final reconcile until this lands).


---

## §E — Admin & Account Region

_Folded-in verbatim from `analysis/inventory/admin.md`. Sole-writer cataloger content preserved as-is._

﻿# Admin & Account Region — Component Inventory

_Phase 05 · Sole writers: source-cataloger (source) + ui-scout (live sweep) · 2026-05-22_
_Scope: admin (settings, users, reference-data, terminology, capabilities, discovery, presets, EDI, MFA, AI-assistants, events, time-corrections + all other admin tabs), setup-integrations, employees, payroll (pay-stubs, tax-documents), compliance forms (W-4/I-9/state, dynamic forms), training/LMS, account (security, customization)_

**Inventory decisions (D1–D6):**
- **D1** — renders-for is source-authoritative (file:line + role/cap gate determines the column; live state confirms `states` only)
- **D2** — shared components located in `platform.md` (SH-01..SH-23) are cross-linked, not re-catalogued in this denominator
- **D3** — cap-gated-OFF + no live trigger = terminal closure; mark D3 terminal in states column
- **D4** — seed-first: live sweep uses seeded demo env; state observations are seed-dependent
- **D5** — role/capability sweep: each role's visible surface must be confirmed by ui-scout
- **D6** — dead-code exclusion: component files confirmed unreachable (not routed, no instantiating template) are excluded from the live denominator but receive one explicit `dead-code` row for audit completeness; denominator adjusted accordingly

---

## Cross-links

- **Shared components (23)** — already located in `platform.md` (SH-01 … SH-23); admin reuses `app-page-header` (SH-04), `app-data-table` (SH-05), `app-select` (SH-06), `app-input` (SH-07), `app-empty-state` (SH-09), `app-dialog` (SH-10), `app-datepicker` (SH-13), `app-validation-button` (SH-16), `app-avatar` (SH-17), `app-toolbar` (SH-08), `app-textarea` (SH-11). Cross-linked, not re-catalogued.
- **`app-barcode-info`** — lives in `shared/components/barcode-info/` but is NOT a platform-phase SH component (platform.md CLOSED; all consumers are non-platform regions). Catalogued here as `shared-cmp` at ADM-USR-07; also used in kanban/inventory/parts/purchase-orders/sales-orders (those regions own their own catalogue entries).
- **Events (admin side)** — `features/events/` is service+model only (no UI). The admin events _management_ tab (`/admin/events`) is catalogued here as ADM-EVT-01; the `/events` platform page (no UI components) is noted in platform.md.
- **AI-assistant chat surface** — the runtime AI help panel (`app-ai-help-panel`, SH-19) lives in platform.md. The admin config surface for AI assistants (`/admin/ai-assistants`) is catalogued here as ADM-AI-01/02; same `CAP-EXT-AI-ASSISTANT` gate per platform.md D3 terminal closure note.

---

## Source Map

### Feature directories in scope

| Area | Features path | Routes file | Route(s) | Role guard (source) |
|------|--------------|-------------|----------|---------------------|
| Admin | `features/admin/` | `admin.routes.ts` | `/admin/:tab` + named sub-routes | `roleGuard('Admin','Manager','OfficeManager')` (`app.routes.ts:276`) |
| Account | `features/account/` | `account.routes.ts` | `/account/*` (profile,contact,emergency,tax-forms,documents,pay-stubs,tax-documents,security,customization,integrations,communications) | `authGuard` shell only — all authenticated users (`app.routes.ts:232`) |
| Employees | `features/employees/` | `employees.routes.ts` | `/employees`, `/employees/:id/:tab` | `roleGuard('Admin','Manager')` (`app.routes.ts:133`) |
| Training (LMS) | `features/training/` | `training.routes.ts` | `/training/:tab`, `/training/module/:id`, `/training/path/:id` | `authGuard` shell only — all authenticated users (`app.routes.ts:242`) |
| Setup Integrations | `features/setup-integrations/` | _(none)_ | `/setup/integrations` | `authGuard` only (`app.routes.ts:36`); admin-only enforced in component |

### Admin tab access (source: `admin.component.ts:97-99`)

| Tab slug | Access | Redirect target for unauthorized |
|----------|--------|----------------------------------|
| users, track-types, reference-data, terminology, settings, integrations, ai-assistants, teams, role-templates, sales-tax, audit-log, edi, mfa, automations, auto-po, integration-outbox, expenses, bi-api-keys | Admin only | `compliance` |
| training, time-corrections, events, announcements | Admin + Manager | `compliance` |
| compliance | Admin + Manager + OfficeManager | — |

### Capability gate defaults relevant to this region (source: `forge-api/forge.api/Capabilities/CapabilityCatalog.cs`)

_All tab/route-level gates above are role-only. Capabilities gate API responses, not UI routes. Defaults apply to a fresh installation before admin changes any toggle._

| Capability code | Default | Admin surface gated |
|-----------------|---------|---------------------|
| CAP-EXT-AI-ASSISTANT | **OFF** (line ~175) | ADM-AI-01/02/03 — panel renders, API blocked when OFF |
| CAP-IDEN-AUTH-MFA | **OFF** | ADM-MFA-01/02 (policy panel) · ACC-SEC-02/03 (user setup) |
| CAP-HR-TRAINING | **OFF** | ADM-TRN-* (admin training tab) · TRN-* (LMS routes) |
| CAP-CROSS-INTEG-EDI | **OFF** | ADM-EDI-01/02 (EDI panel) |
| CAP-P2P-AUTOPO | **OFF** | ADM-APO-01/02 (auto-PO settings) |
| CAP-EXT-ANNOUNCEMENTS | **OFF** | ADM-ANN-01/02 (announcements panel) |
| CAP-CROSS-BI-EXPORT | **OFF** | ADM-BI-01/02 (BI API keys) |
| CAP-EXT-EMAIL-SYNC | **OFF** | ACC-COMM-01/02/03 (communications sync) |
| CAP-QC-COMPLIANCE-FORMS | **OFF** | ADM-CMP-02/03/04 (compliance templates) · ACC-TAX-01/02/03 |
| CAP-IDEN-CAPABILITY-ADMIN | **ON** | ADM-CAP-01/02/03 (capabilities pages) · ADM-DISC-01 · ADM-PRE-* |
| CAP-MD-CURRENCIES | **ON** | ADM-CUR-01/02/03 (currencies) |

_Note: Tab shells (ADM-AI-01 etc.) always render for the correct role regardless of cap state — the tab access logic is role-only. API calls within the panel return empty/error when the cap is OFF. Live sweep needed to observe actual panel behavior per cap state._

---

## Denominator

| Area | Feature component files | Source paths |
|------|------------------------|-------------|
| Admin | 53 | `features/admin/**/*.component.ts` (55 files; 2 excluded per D6: `admin-settings.component.ts` + `setting-field.component.ts` — live sweep + zero-usage grep confirmed cycle 6) |
| Account | 21 | `features/account/**/*.component.ts` (22 files; 1 excluded per D6: `account.component.ts` dead code) |
| Employees | 12 | `features/employees/**/*.component.ts` |
| Training | 4 | `features/training/**/*.component.ts` |
| Setup Integrations | 1 | `features/setup-integrations/*.component.ts` |
| **TOTAL** | **91** | |

Shared components (SH-01–SH-23) from `platform.md` are excluded from this denominator per D2. `app-barcode-info` is a cross-region shared utility (not in SH list); row ADM-USR-07 accounts for it in admin scope. Dead-code files excluded per D6; each has an explicit `dead-code` row for audit trail.

---

## Reconciliation Checklist

_Every in-scope route and feature-tree node must be ticked or queued before phase closes._

### Tree 1 — Routes (15 distinct routes/route-groups)
- [x] `/admin/users` (tab)
- [x] `/admin/track-types` (tab)
- [x] `/admin/reference-data` (tab)
- [x] `/admin/terminology` (tab)
- [x] `/admin/settings` (tab)
- [x] `/admin/integrations` (tab)
- [x] `/admin/training` (tab)
- [x] `/admin/ai-assistants` (tab)
- [x] `/admin/teams` (tab)
- [x] `/admin/role-templates` (tab)
- [x] `/admin/compliance` (tab)
- [x] `/admin/sales-tax` (tab)
- [x] `/admin/audit-log` (tab)
- [x] `/admin/time-corrections` (tab)
- [x] `/admin/events` (tab)
- [x] `/admin/announcements` (tab)
- [x] `/admin/edi` (tab)
- [x] `/admin/mfa` (tab)
- [x] `/admin/automations` (tab)
- [x] `/admin/auto-po` (tab)
- [x] `/admin/integration-outbox` (tab)
- [x] `/admin/expenses` (tab)
- [x] `/admin/bi-api-keys` (tab)
- [x] `/admin/capabilities`
- [x] `/admin/capabilities/:id` — confirmed live (ADM-Q-007 resolved cycle 5): CapabilityDetailComponent renders; see ADM-CAP-02 states
- [x] `/admin/capabilities-debug`
- [x] `/admin/discovery` (Q-S1 live-confirmed; Q-S2..Q-S16 queued ADM-Q-011)
- [x] `/admin/presets`
- [x] `/admin/presets/compare`
- [x] `/admin/presets/custom`
- [x] `/admin/presets/:id`
- [x] `/admin/entity-completeness`
- [x] `/admin/working-calendars`
- [x] `/admin/tariffs`
- [x] `/admin/lead-sources`
- [x] `/admin/icp-rubrics`
- [x] `/admin/assignment-rules`
- [x] `/admin/currencies`
- [x] `/account/profile`
- [x] `/account/contact`
- [x] `/account/emergency`
- [x] `/account/tax-forms`
- [x] `/account/tax-forms/:formType` → D4-terminal: w4/i9 confirmed redirect to /onboarding (step 1 live-4); steps 2–7 source-confirmed (ADM-Q-016); state/w9 formTypes stay at route with loading-only state (live-7) — populated state requires compliance templates (non-seeded env)
- [x] `/account/documents`
- [x] `/account/pay-stubs`
- [x] `/account/tax-documents`
- [x] `/account/security`
- [x] `/account/customization`
- [x] `/account/integrations`
- [x] `/account/communications`
- [x] `/account/communications/oauth-callback` — confirmed live (ADM-Q-015 resolved cycle 8): OauthCallbackComponent renders for all-auth regardless of CAP-EXT-EMAIL-SYNC state; no OAuth state without valid exchange
- [x] `/employees`
- [x] `/employees/:id/overview`
- [x] `/employees/:id/activity`
- [x] `/employees/:id/compliance`
- [x] `/employees/:id/documents`
- [x] `/employees/:id/events`
- [x] `/employees/:id/expenses`
- [x] `/employees/:id/jobs`
- [x] `/employees/:id/pay`
- [x] `/employees/:id/time`
- [x] `/employees/:id/training`
- [x] `/training/:tab` (my-learning / all-modules / paths — confirmed; teams tab present)
- [x] `/training/module/:id` → live-10: UI shell renders not-found error state for invalid IDs; cap gate is API-level only (no 403/redirect/banner cap-OFF); populated D4-terminal (no modules seeded in non-seeded env)
- [x] `/training/path/:id` → live-10: UI shell renders not-found error state for invalid IDs; cap gate is API-level only (same as /training/module/:id); populated D4-terminal (no paths seeded in non-seeded env)
- [x] `/setup/integrations` (confirmed redirects Admin → /dashboard; may only render on true first-run; queued ADM-Q-020)

### Tree 2 — Feature component files (94 total)
_(See component table below — all 94 need live confirmation of states)_

### Tree 3 — Shared component usages in admin/account/employees/training templates

_Paths abbreviated relative to `forge-ui/src/app/features/`. First-occurrence line shown per template._

| SH | selector | consuming templates (file:line) |
|----|----------|---------------------------------|
| SH-04 | `app-page-header` | `admin/admin.component.html:1` · `employees/pages/employee-list/employee-list.component.html:1` |
| SH-05 | `app-data-table` | `admin/admin.component.html:16` · `admin/components/edi-panel/edi-panel.component.html:22` · `admin/components/user-compliance-panel/user-compliance-panel.component.html:128` · `admin/components/bi-api-keys-panel/bi-api-keys-panel.component.html:16` · `admin/components/announcements-panel/announcements-panel.component.html:27` · `admin/components/ai-assistants-panel/ai-assistants-panel.component.html:10` · `admin/lead-sources/lead-sources.component.html:15` · `admin/tariffs/tariffs.component.html:15` · `admin/assignment-rules/assignment-rules.component.html:15` · `admin/icp-rubrics/icp-rubrics.component.html:15` · `admin/entity-completeness/entity-completeness-admin.component.html:27` · `account/pages/tax-documents/account-tax-documents.component.html:5` · `account/pages/pay-stubs/account-pay-stubs.component.html:5` · employee tabs (compliance:2 · expenses:2 · jobs:2 · time:8 · training:2 · pay:2 · events:2) |
| SH-06 | `app-select` | `admin/admin.component.html:629` · `admin/components/edi-panel/edi-panel.component.html:61` · `admin/components/user-compliance-panel/user-compliance-panel.component.html:270` · `admin/assignment-rules/assignment-rules.component.html:64` · `admin/entity-completeness/entity-capability-requirement-dialog/entity-capability-requirement-dialog.component.html:4` · `admin/components/compliance-template-dialog/compliance-template-dialog.component.html:106` · `admin/entity-completeness/entity-completeness-admin.component.html:7` · `admin/working-calendars/working-calendars.component.html:66` · `admin/capabilities/capabilities.component.html:8` · `account/pages/profile/account-profile.component.html:29` · `account/pages/emergency/account-emergency.component.html:12` · `employees/pages/employee-list/employee-list.component.html:15` · `training/training.component.html:29` |
| SH-07 | `app-input` | `admin/admin.component.html:241` (×12 instances) · `admin/components/edi-panel/edi-panel.component.html:97` · `admin/lead-sources/lead-sources.component.html:63` · `admin/tariffs/tariffs.component.html:59` · `admin/assignment-rules/assignment-rules.component.html:61` · `admin/icp-rubrics/icp-rubrics.component.html:63` · `admin/entity-capability-requirement-dialog/entity-capability-requirement-dialog.component.html:10` · `admin/entity-completeness/entity-completeness-admin.component.html:11` · `admin/components/compliance-template-dialog/compliance-template-dialog.component.html:105` · `admin/components/bi-api-keys-panel/bi-api-keys-panel.component.html:63` · `admin/working-calendars/working-calendars.component.html:65` · `admin/capabilities/capabilities.component.html:3` · `account/pages/contact/account-contact.component.html:11` · `account/pages/profile/account-profile.component.html:22` · `account/pages/security/account-security.component.html:13` · `account/pages/emergency/account-emergency.component.html:10` · `account/components/mfa-setup-dialog/mfa-setup-dialog.component.html:39` · `account/pages/communications/connect-imap-dialog.component.html:31` · `account/pages/communications/connect-communication-dialog.component.html:22` · `employees/pages/employee-list/employee-list.component.html:12` · `training/training.component.html:28` |
| SH-08 | `app-toolbar` | `admin/lead-sources/lead-sources.component.html:3` · `admin/tariffs/tariffs.component.html:3` · `admin/icp-rubrics/icp-rubrics.component.html:3` · `admin/assignment-rules/assignment-rules.component.html:3` · `admin/entity-completeness/entity-completeness-admin.component.html:6` |
| SH-09 | `app-empty-state` | `admin/admin.component.html:193` · `admin/components/user-compliance-panel/user-compliance-panel.component.html:79` · `admin/working-calendars/working-calendars.component.html:19` · `account/pages/integrations/account-integrations.component.html:84` · `account/pages/communications/account-communications.component.html:142` · `training/training.component.html:34` · `training/training-path/training-path.component.html:36` |
| SH-10 | `app-dialog` | `admin/admin.component.html:616` · `admin/components/edi-panel/edi-panel.component.html:95` · `admin/components/bi-api-keys-panel/bi-api-keys-panel.component.html:58` · `admin/entity-capability-requirement-dialog/entity-capability-requirement-dialog.component.html:1` · `admin/components/compliance-template-dialog/compliance-template-dialog.component.html:2` · `admin/lead-sources/lead-sources.component.html:58` · `admin/tariffs/tariffs.component.html:54` · `admin/assignment-rules/assignment-rules.component.html:56` · `admin/icp-rubrics/icp-rubrics.component.html:58` · `admin/components/announcements-panel/announcements-panel.component.html:76` · `account/components/mfa-recovery-codes-dialog/mfa-recovery-codes-dialog.component.html:1` · `account/components/mfa-setup-dialog/mfa-setup-dialog.component.html:1` · `account/pages/communications/connect-imap-dialog.component.html:1` · `account/pages/communications/connect-communication-dialog.component.html:1` · `account/pages/integrations/connect-integration-dialog.component.html:1` · `account/pages/tax-form-detail/account-tax-form-detail.component.html:337` |
| SH-11 | `app-textarea` | `admin/components/edi-panel/edi-panel.component.html:110` · `admin/lead-sources/lead-sources.component.html:71` · `admin/assignment-rules/assignment-rules.component.html:102` · `admin/icp-rubrics/icp-rubrics.component.html:66` · `admin/entity-capability-requirement-dialog/entity-capability-requirement-dialog.component.html:25` · `admin/components/compliance-template-dialog/compliance-template-dialog.component.html:109` · `admin/discovery/discovery.component.html:232` · `account/pages/integrations/connect-integration-dialog.component.html:16` |
| SH-12 | `app-drillable-chart` | _not used in this region_ |
| SH-13 | `app-datepicker` | `admin/admin.component.html:305` · `admin/components/user-compliance-panel/user-compliance-panel.component.html:187` · `admin/tariffs/tariffs.component.html:72` · `admin/components/bi-api-keys-panel/bi-api-keys-panel.component.html:69` · `admin/working-calendars/working-calendars.component.html:105` · `account/pages/profile/account-profile.component.html:27` |
| SH-14 | `app-sankey-chart` | _not used in this region_ |
| SH-15 | `app-page-layout` | `admin/entity-completeness/entity-completeness-admin.component.html:1` · `admin/lead-sources/lead-sources.component.html:1` · `admin/tariffs/tariffs.component.html:1` · `admin/assignment-rules/assignment-rules.component.html:1` · `admin/icp-rubrics/icp-rubrics.component.html:1` · `admin/working-calendars/working-calendars.component.html:1` · `admin/capability-detail/capability-detail.component.html:1` · `admin/presets/preset-detail/preset-detail.component.html:1` · `admin/discovery/discovery.component.html:1` · `admin/capabilities/capabilities.component.html:1` · `account/account.component.html:1` · `training/training.component.html:1` |
| SH-16 | `app-validation-button` | `admin/admin.component.html:791` · `admin/components/edi-panel/edi-panel.component.html:114` · `admin/components/compliance-template-dialog/compliance-template-dialog.component.html:142` · `admin/entity-capability-requirement-dialog/entity-capability-requirement-dialog.component.html:58` · `admin/lead-sources/lead-sources.component.html:83` · `admin/tariffs/tariffs.component.html:85` · `admin/assignment-rules/assignment-rules.component.html:117` · `admin/icp-rubrics/icp-rubrics.component.html:117` · `admin/components/bi-api-keys-panel/bi-api-keys-panel.component.html:80` · `admin/working-calendars/working-calendars.component.html:84` · `account/pages/contact/account-contact.component.html:23` · `account/pages/profile/account-profile.component.html:55` · `account/pages/security/account-security.component.html:25` · `account/pages/emergency/account-emergency.component.html:17` · `account/components/compliance-form-renderer/compliance-form-renderer.component.html:644` · `account/pages/communications/connect-imap-dialog.component.html:78` · `account/pages/communications/connect-communication-dialog.component.html:35` |
| SH-17 | `app-avatar` | `admin/admin.component.html:18` · `account/account.component.html:13` · `account/pages/profile/account-profile.component.html:10` · `employees/pages/employee-list/employee-list.component.html:33` · `employees/pages/employee-detail/employee-detail.component.html:20` |
| SH-18..22 | `app-entity-link` · `app-ai-help-panel` · `app-training-context-panel` · `app-chat-preview-popup` · `app-status-badge` | _not used in admin/account/employees/training feature templates_ |
| `app-barcode-info` (no SH#) | `admin/admin.component.html:741` (ADM-USR-07) — 6 further usages in assets/kanban/inventory/parts/purchase-orders/sales-orders (non-platform regions; each region will catalogue their own row) |

_Note: `app-barcode-info` (`shared/components/barcode-info/barcode-info.component.ts`) is a cross-region shared utility. platform.md CLOSED explicitly rejected SH-24 — all consumers are non-platform. No SH number assigned; catalogued as `shared-cmp` type in each consuming region's inventory._

---

## Component Table

_Abbreviations: A=Admin, M=Manager, OM=OfficeManager, E=Engineer, PM=PM; all-auth=any authenticated user_

### ADMIN AREA — AdminComponent tab shell

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-SH-01 | `app-admin` / `AdminComponent` | page | `/admin/:tab` | `features/admin/admin.component.ts:80` | A,M,OM (roleGuard) | populated(live-4): Admin sees 23 tabs; Manager sees 5 (training/time-corrections/events/announcements/compliance); Manager toast "Access denied" on training tab; BUG: Manager lands on /admin/users without redirect (ADM-Q-012 confirmed live) | Tab-shell page; routes each tab slug to the appropriate panel; non-admin tabs redirect to `compliance` |
| ADM-SH-01-HDR | `app-page-header` (SH-04 cross-link) | shared-cmp | `/admin/:tab` | `admin.component.html:1` | A,M,OM | populated(live-4): title="Administration" (Admin) · title="Employee Portal" (non-admin) | Page title/subtitle — title differs: "Administration" (Admin) vs "Employee Portal" (non-admin) |

### ADMIN AREA — Users tab (`/admin/users`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-USR-01 | users tab panel | tab | `/admin/users` | `admin.component.html:6` | A only (ADMIN_ONLY_TABS) | populated(live-7): 8 USERS header; ADD USER button; toolbar: download · grid_on · settings | User list with avatar, name, email, role, compliance progress, status columns |
| ADM-USR-02 | user list `app-data-table` (SH-05) | shared-cmp | `/admin/users` | `admin.component.html:16` | A | empty(source: emptyIcon="people", msg=admin.noUsersFound) · populated(live-7): 8 rows — AT Two Admin(ADMIN) · AE Engineer Alex(ENGINEER) · CO OfficeManager Casey(OFFICEMANAGER) · FA Admin Forge(ADMIN/Main Office/8/8 complete) · LI Lead Intake Service(LEADINTAKE/PENDING SETUP) · MM Manager Morgan(MANAGER) · PP PM Pat(PM) · SW Worker Sam(PRODUCTIONWORKER/8/8 complete); cols: Name · Email · Role · Location · Compliance(0/8 or 8/8) · Status(Active/PENDING SETUP) · Actions(edit/person_off=deactivate); vpn_key action on PENDING SETUP users | Sortable/filterable table: avatar · name · email · role-chip · compliance-chip · status-dot · actions |
| ADM-USR-03 | user create/edit dialog `app-dialog` (SH-10) | dialog | `/admin/users` | `admin.component.html:616` | A | populated-create(live-4): First Name · Last Name · Email · Initials · Role [default=Engineer] · Role Template · Avatar Color · CANCEL · CREATE USER; populated-edit(live-4): adds Work Location · Active · SCAN IDENTIFIERS · RFID CLIENT SETUP · BARCODE section · CANCEL · SAVE CHANGES | Create/edit user; fields: first/last name, email (create only), initials, role select, role template, work location, avatar color picker, active toggle |
| ADM-USR-04 | scan identifiers cluster | cluster | `/admin/users` dialog | `admin.component.html:668` | A | populated(live-4): "No scan identifiers assigned"; Type=RFID Card Â· Scan Value Â· ADD button; "Tap and hold card on reader" hint | RFID/NFC/barcode/biometric scan IDs per user; add/remove; WebHID RFID reader connect |
| ADM-USR-05 | RFID reader cluster | cluster | `/admin/users` dialog | `admin.component.html:691` | A | populated(live-4): DOWNLOAD SETUP SCRIPT button; "Run as Administrator" instruction | WebHID RFID reader pair/unpair + relay setup script download |
| ADM-USR-06 | setup code banner | cluster | `/admin/users` dialog | `admin.component.html:751` | A | shown-pending(live-4): lead-intake-system@forge.local shows vpn_key + PENDING SETUP status; setup token available | Setup token display with copy action; shown for newly-created or password-pending users |
| ADM-USR-07 | `app-barcode-info` | shared-cmp | `/admin/users` dialog | `admin.component.html:741` | A | populated(live-4): BARCODE section: EMP-000008; copy Â· PRINT Â· REGENERATE | Barcode/QR info for user entity (compact mode); cross-region shared utility (`shared/components/barcode-info/`), no SH# |
| ADM-USR-08 | `app-validation-button` (SH-16) | shared-cmp | `/admin/users` dialog | `admin.component.html:791` | A | populated(live-4): "warning 3" on blank create form; SAVE CHANGES on edit form | Save-with-violations button for user form |

### ADMIN AREA — Track Types tab (`/admin/track-types`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TT-01 | track types tab panel | tab | `/admin/track-types` | `admin.component.html:94` | A only | populated(live-4): 3 track types listed | Accordion list of track types; each expands to show stage table |
| ADM-TT-02 | track type accordion | cluster | `/admin/track-types` | `admin.component.html:106` | A | populated(live-4): Production DEFAULT 10 STAGES Â· R&D/Tooling RND 6 STAGES Â· Maintenance 4 STAGES; DEFAULT badge on Production | Collapsible track type row: name, code, stage count, default badge; expand reveals stage detail table |
| ADM-TT-03 | stage detail table | table | `/admin/track-types` accordion | `admin.component.html:134` | A | partial(live-4): accordion rows visible but not expanded during sweep | Stage rows: order, name/color-chip, code, color swatch, WIP limit, document type, irreversible lock icon |
| ADM-TT-04 | TrackTypeDialogComponent | dialog | `/admin/track-types` | `features/admin/components/track-type-dialog.component.ts:1` | A | populated(live-4: Name · Code · Description · STAGES section + ADD STAGE inline; validation badge shows unfilled required count; CREATE action) | Create/edit track type; name, code, description, stages CRUD |

### ADMIN AREA — Terminology tab (`/admin/terminology`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TERM-01 | terminology tab panel | tab | `/admin/terminology` | `admin.component.html:182` | A only | empty(live-7 confirmed): "0 ENTRIES · No terminology entries configured yet" + refresh icon; SAVE CHANGES button visible | Inline-editable table of terminology overrides (key → custom label) |

### ADMIN AREA — Settings tab (`/admin/settings`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-SET-01 | settings tab panel | tab | `/admin/settings` | `admin.component.html:222` | A only | populated(confirmed: COMPANY PROFILE + LOCATIONS + PAY PERIOD + SYSTEM SETTINGS sections all render) | Container for company profile, locations, pay-period locking, system settings, logo, brand lockups |
| ADM-SET-02 | company profile section | cluster | `/admin/settings` | `admin.component.html:226` | A | populated(live-7): Company Name="Forge Manufacturing" · Phone="(555) 555-0100" · Email="info@forge.local" · EIN/Tax ID (empty) · Website (empty); SAVE PROFILE button | Company name, phone, email, EIN, website form; Save Profile action |
| ADM-SET-03 | company locations section | cluster | `/admin/settings` | `admin.component.html:254` | A | empty(source: emptyIcon="location_on", msg=admin.noLocations) · populated(live: "Main Office" row visible; columns: Location Name, Phone, Address, State, Default chip) | Locations table (name, address, state, phone, default chip); new/edit/delete/set-default actions |
| ADM-SET-04 | CompanyLocationDialogComponent | dialog | `/admin/settings` | `features/admin/components/company-location-dialog/company-location-dialog.component.ts:1` | A | populated(live-7): Title="NEW LOCATION"; fields: Location Name · Phone · Street Address · Street Address 2 · City · State · ZIP/Postal Code · Country; CANCEL · CREATE LOCATION (warning×1) | Create/edit company location |
| ADM-SET-05 | pay-period locking section | cluster | `/admin/settings` | `admin.component.html:297` | A | populated(live: date picker + LOCK PERIOD button confirmed) | Date picker + "Lock Period" action to lock time entries through a date |
| ADM-SET-06 | system settings grid | cluster | `/admin/settings` | `admin.component.html:386` | A | populated(live-7): 10 settings confirmed — Application Name · Company Name · Planning Cycle (Days) · Daily Nudge Hour (24h) · Max Upload Size (MB) · Default Job Priority · Auto-Archive After (Days) · Email Notifications (Enabled/Disabled select) · Primary Brand Color · Accent Brand Color; SAVE CHANGES button | Key/value settings grid: app name, company name, planning cycle, nudge hour, upload limit, job priority, auto-archive days, email notifications, primary/accent brand colors |
| ADM-SET-07 | logo upload section | cluster | `/admin/settings` | `admin.component.html:332` | A | no-logo(live: no logo uploaded in non-seeded env) · has-logo(D4-terminal: non-seeded env — logo upload area confirmed; no logo file present) | Logo preview, upload (image/*), remove actions |
| ADM-SET-08 | brand lockups section | cluster | `/admin/settings` | `admin.component.html:357` | A | populated(live: BRAND LOCKUPS section renders with upload/reset for marquee/wordmark/favicon) | Marquee, wordmark, favicon upload/reset; dark-preview thumbnails |
| ADM-SET-09 | AdminSettingsComponent | dead-code | — | `features/admin/settings/admin-settings.component.ts:1` | none/unreachable | dead-code(D6: selector `app-admin-settings` never instantiated — live sweep ADM-SET-09-CHECK: "NO-app-admin-settings-component"; zero `<app-admin-settings>` usages in any template) | Orphaned AdminSettingsComponent — not routed and not embedded; excluded from denominator per D6 |
| ADM-SET-10 | SettingFieldComponent | dead-code | — | `features/admin/settings/setting-field/setting-field.component.ts:1` | none/unreachable | dead-code(D6: selector `app-setting-field` has zero usages across entire app — grep confirmed cycle 6; only consumer was dead-code ADM-SET-09) | Orphaned SettingFieldComponent — not used by any live component; excluded from denominator per D6 |

### ADMIN AREA — Integrations tab (`/admin/integrations`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-INT-01 | integrations tab panel | tab | `/admin/integrations` | `admin.component.html:417` | A only | populated(live: CONFIGURE + TEST buttons visible; multiple providers shown) | Hosts IntegrationsPanelComponent |
| ADM-INT-02 | IntegrationsPanelComponent | panel | `/admin/integrations` | `features/admin/components/integrations-panel/integrations-panel.component.ts:1` | A | populated(live: 20 providers across 4 categories, each with CONFIGURE + TEST buttons) | Integration catalog list; 20 providers: 3 communications, 6 service, 4 shipping, 7 accounting |
| ADM-INT-03 | IntegrationConfigDialogComponent | dialog | `/admin/integrations` | `features/admin/components/integration-config-dialog/integration-config-dialog.component.ts:1` | A | populated(live: UPS dialog confirmed — UPS Mode, UPS Client ID, UPS Client Secret, UPS Account Number + sandbox guide + TEST button; full field structure source-pre-extracted per §Source-Extracted Detail) · empty(if fields.length=0: close only) · test-result-success · test-result-error · connecting-spinner(OAuth) | Configure individual integration; descriptor-driven fields (20 providers); see §Source-Extracted Detail for per-provider field lists |
| ADM-INT-04 | integration outbox tab panel | tab | `/admin/integration-outbox` | `admin.component.html:515` | A only | empty(live: 0 entries; Status + Provider filters; REFRESH button) | Hosts IntegrationOutboxPanelComponent |
| ADM-INT-05 | IntegrationOutboxPanelComponent | panel | `/admin/integration-outbox` | `features/admin/components/integration-outbox-panel/integration-outbox-panel.component.ts:1` | A | empty(live: 0 entries; "No outbox entries") · populated(D4-terminal: non-seeded env — no outbound integration messages) | Outbound integration message queue / outbox viewer |

### ADMIN AREA — Training tab (`/admin/training`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TRN-01 | training tab panel | tab | `/admin/training` | `admin.component.html:424` | A,M | populated(live: 3 sub-tabs: CONTENT `library_books`, PATHS `route`, USER PROGRESS `insights`; empty modules state) | Hosts TrainingPanelComponent (admin-side LMS management) |
| ADM-TRN-02 | TrainingPanelComponent | panel | `/admin/training` | `features/admin/components/training-panel/training-panel.component.ts:1` | A,M | empty-modules(live: 0 modules; NEW MODULE button) · empty-paths(live: 0 paths; NEW PATH button) · user-progress(see ADM-Q-025) | Admin LMS: CONTENT tab (module list + NEW MODULE), PATHS tab, USER PROGRESS tab |
| ADM-TRN-03 | TrainingModuleDialogComponent | dialog | `/admin/training` | `features/admin/components/training-panel/training-module-dialog.component.ts:1` | A,M | populated(live-4): Title · Slug · Summary · Content Type [default=Article] · Estimated Minutes · App Routes · Tags · Published · Article Content JSON (when type=Article) · CANCEL · CREATE MODULE | Create/edit training module (content, type, quiz) |
| ADM-TRN-04 | TrainingPathDialogComponent | dialog | `/admin/training` | `features/admin/components/training-panel/training-path-dialog.component.ts:1` | A,M | new-dialog(live-5: Title · Slug · Description · Icon · Auto-assign to new users · Active; CANCEL · CREATE PATH — 1 warning; see §Source-Extracted Detail ADM-TRN-04) · edit-dialog(source-confirmed: pre-fills all fields) | Create/edit training path (ordered modules) |
| ADM-TRN-05 | UserTrainingDetailPanelComponent | panel | `/admin/training` | `features/admin/components/training-panel/user-training-detail-panel.component.ts:1` | A,M | D4-terminal: no enrolled users in non-seeded env; trigger: row expand/click in training-panel USER PROGRESS sub-tab; D3 also applies (CAP-HR-TRAINING OFF) | Per-user training progress detail |
| ADM-TRN-06 | WalkthroughPreviewDialogComponent | dialog | `/admin/training` | `features/admin/components/training-panel/walkthrough-preview-dialog.component.ts:1` | A,M | D4-terminal: no walkthrough module in non-seeded env; D3 also applies (CAP-HR-TRAINING OFF); trigger: PATHS sub-tab row PREVIEW action | Preview walkthrough content within training module |
| ADM-TRN-07 | TrainingDashboardComponent | panel | `/admin/training` (sub) | `features/admin/components/training-dashboard/training-dashboard.component.ts:1` | A,M | empty(live-3: "0 users · No user progress data available"; insights icon; USER PROGRESS is 3rd sub-tab of TrainingPanelComponent; D4 non-seeded) · populated(source-confirmed: progressColumns — displayName(User) · role(120px) · totalEnrolled(90px) · totalCompleted(100px) · overallCompletionPct(Progress/100px) · lastActivityAt(date/130px) · detail(60px); D4-terminal: no enrolled users in non-seeded env) | Training analytics dashboard (completion rates, user rows) |
| ADM-TRN-08 | TrainingDetailPanelComponent | panel | `/admin/training` (sub) | `features/admin/components/training-detail-panel/training-detail-panel.component.ts:12` | A,M | source-confirmed(read-only; embedded in TrainingDetailDialogComponent; trigger: URL entityType=training param → training-panel.component.ts:150; or USER PROGRESS row-click → ts:210 openUserDetailDialog(); D4 non-seeded — no enrolled users to trigger) | Per-user training record detail panel; displayed inside TrainingDetailDialogComponent |
| ADM-TRN-09 | TrainingDetailDialogComponent | dialog | `/admin/training` (sub) | `features/admin/components/training-detail-dialog/training-detail-dialog.component.ts:12` | A,M | source-confirmed(trigger: training-panel.ts:208 openUserDetailDialog(); thin wrapper for TrainingDetailPanelComponent) · D4-terminal: no enrolled users to trigger row-click in non-seeded env; read-only display | Training detail dialog; wraps TrainingDetailPanelComponent; userId passed via MAT_DIALOG_DATA |

### ADMIN AREA — AI Assistants tab (`/admin/ai-assistants`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-AI-01 | ai-assistants tab panel | tab | `/admin/ai-assistants` | `admin.component.html:431` | A only (role gate; tab shell always renders for Admin) | renders(source) | Hosts AiAssistantsPanelComponent; CAP-EXT-AI-ASSISTANT [default=OFF (source)] gates API — panel shows empty/error when cap OFF |
| ADM-AI-02 | AiAssistantsPanelComponent | panel | `/admin/ai-assistants` | `features/admin/components/ai-assistants-panel/ai-assistants-panel.component.ts:27` | A; CAP-EXT-AI-ASSISTANT [default=OFF (source)] blocks API when cap OFF | empty(live: 0 assistants; "No AI assistants configured") · error(live: "Failed to load AI assistants" + Dismiss visible simultaneously — cap OFF causes API error) · populated(D4-terminal: CAP-EXT-AI-ASSISTANT OFF + non-seeded env — no assistants configured) | Table of AI assistants (name, category, entity filters, status); create/edit/delete |
| ADM-AI-03 | AiAssistantDialogComponent | dialog | `/admin/ai-assistants` | `features/admin/components/ai-assistant-dialog/ai-assistant-dialog.component.ts:1` | A; CAP-EXT-AI-ASSISTANT [default=OFF (source)] | populated(live-4): Name · Category [default=Custom] · Description · Icon · System Prompt · Entity Type Filters · STARTER QUESTIONS · Active · Sort Order · Advanced Settings · CANCEL · CREATE ASSISTANT — dialog opens even when cap is OFF (cap gates API responses only, not dialog) | Create/edit AI assistant (name, category, prompt, entity type filters) |

### ADMIN AREA — Teams tab (`/admin/teams`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TEAM-01 | teams tab panel | tab | `/admin/teams` | `admin.component.html:438` | A only | populated(live: 1 team row visible; DISPLAY button + KIOSK button launch shop-floor URLs — NOT sub-tabs; ACTIVE TERMINALS table below) | Hosts TeamsPanelComponent |
| ADM-TEAM-02 | TeamsPanelComponent | panel | `/admin/teams` | `features/admin/components/teams-panel/teams-panel.component.ts:1` | A | populated(live+source-3: NEW TEAM button; team table — TEAM NAME/DESCRIPTION/MEMBERS/ACTIONS; DISPLAY btn → window.open('/display/shop-floor'); KIOSK btn → window.open('/display/shop-floor/clock')) · kiosk-terminals-populated(live-10: ACTIVE TERMINALS / KIOSK sub-tab confirmed — 1 terminal "Kiosk-1"; columns: Terminal Name · Team · Device Token · actions(remove); removeTerminal(terminal) → ConfirmDialog → adminService.deleteKioskTerminal(id)) · empty-terminals(source: no registered kiosk terminals) | Teams list + shop-floor launcher buttons; kiosk terminal registry (ACTIVE TERMINALS / KIOSK sub-tab) |

### ADMIN AREA — Role Templates tab (`/admin/role-templates`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-RTPL-01 | role-templates tab panel | tab | `/admin/role-templates` | `admin.component.html:445` | A only | populated(live: 3 role templates; NEW TEMPLATE button) | Hosts RoleTemplatesPanelComponent |
| ADM-RTPL-02 | RoleTemplatesPanelComponent | panel | `/admin/role-templates` | `features/admin/components/role-templates-panel/role-templates-panel.component.ts:1` | A | populated(live: 3 templates visible) · dialog-fields(NEW TEMPLATE: Template Name, Description, Included Roles (multiselect + description); CREATE TEMPLATE) | Rollup template CRUD; templates bundle multiple base roles for multi-role users |

### ADMIN AREA — Sales Tax tab (`/admin/sales-tax`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TAX-01 | sales-tax tab panel | tab | `/admin/sales-tax` | `admin.component.html:452` | A only | empty(live: 0 Tax Rates; ADD RATE button) | Hosts SalesTaxPanelComponent |
| ADM-TAX-02 | SalesTaxPanelComponent | panel | `/admin/sales-tax` | `features/admin/components/sales-tax-panel/sales-tax-panel.component.ts:1` | A | empty(live: "No sales tax rates configured") · populated(D4-terminal: non-seeded env — no tax rates configured) | Sales tax rates list (jurisdiction + rate) |
| ADM-TAX-03 | SalesTaxDialogComponent | dialog | `/admin/sales-tax` | `features/admin/components/sales-tax-dialog/sales-tax-dialog.component.ts:1` | A | populated(live: 8 fields: Name, Code, State, Rate (%), Effective From, Description (optional), Set as default rate (toggle), Exempt rate (toggle), GL Posting Account (optional); ADD RATE / SAVE button; warning-3 indicator) | Create/edit sales tax rate |
| ADM-TAX-04 | StateWithholdingDialogComponent | dialog | `/admin/compliance` (via ComplianceTemplatesPanelComponent) | `features/admin/components/state-withholding-dialog/state-withholding-dialog.component.ts:1` | A,M,OM | source-confirmed(ADM-Q-021 resolved): trigger at compliance-templates-panel.html:65 + ts:87; 50-state picker in 4 categories; live confirmation D4-terminal (trigger requires compliance template configured; auto-open fires on init when state data present) | Company state selector for payroll withholding — triggered from compliance-templates-panel.component.html:65 + ts:87,102; shows all 50 states in 4 categories (ready/needs-upload/uses-W4/no-tax); clicking a state sets company_state system setting |

### ADMIN AREA — Time Corrections tab (`/admin/time-corrections`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TC-01 | time-corrections tab panel | tab | `/admin/time-corrections` | `admin.component.html:459` | A,M | populated(live: filter fields Employee/From Date/To Date; sortable TIME ENTRIES table with EMPLOYEE/DATE/JOB#/START/END/DURATION/CATEGORY/NOTES columns; edit action per row) | Hosts TimeCorrectionsPanelComponent |
| ADM-TC-02 | TimeCorrectionsPanelComponent | panel | `/admin/time-corrections` | `features/admin/components/time-corrections-panel/time-corrections-panel.component.ts:1` | A,M | populated(live-4): correction list renders; edit dialog fields: Employee/Original Date/Start/End/Duration [read-only] · Date · Start Time · End Time · Category · Notes · Reason for Correction · CANCEL · SAVE CORRECTION | Review and approve/reject employee time entry corrections |

### ADMIN AREA — Events tab (`/admin/events`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-EVT-01 | events tab panel | tab | `/admin/events` | `admin.component.html:466` | A,M | empty(live: 0 events; Type filter; NEW EVENT button) | Hosts EventsPanelComponent |
| ADM-EVT-02 | EventsPanelComponent | panel | `/admin/events` | `features/admin/components/events-panel/events-panel.component.ts:1` | A,M | populated(live-4): NEW EVENT dialog fields: Title · Type [default=Meeting] · Location · Start Date · Start Time · End Date · End Time · Description · Attendees · Required attendance · CANCEL · CREATE EVENT | Org-wide event management / event log admin view |

### ADMIN AREA — Announcements tab (`/admin/announcements`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-ANN-01 | announcements tab panel | tab | `/admin/announcements` | `admin.component.html:473` | A,M | populated(live: ANNOUNCEMENTS + TEMPLATES sub-tabs; empty state) | Hosts AnnouncementsPanelComponent |
| ADM-ANN-02 | AnnouncementsPanelComponent | panel | `/admin/announcements` | `features/admin/components/announcements-panel/announcements-panel.component.ts:1` | A,M | empty(live: "No announcements sent yet") · dialog-fields(SEND ANNOUNCEMENT: Template, Title, Content, Severity (Info default), Scope (Company-Wide default), Expires At, Require Acknowledgment; SEND button) · templates-sub-tab(ADM-Q-005 pending) | Create/manage org-wide announcements; ANNOUNCEMENTS + TEMPLATES sub-tabs |

### ADMIN AREA — Audit Log tab (`/admin/audit-log`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-AUDIT-01 | audit-log tab panel | tab | `/admin/audit-log` | `admin.component.html:480` | A only | empty(live: "No audit log entries found"; filters: Entity Type, System Event, Action, From Date, To Date; paginated 25/page) | Hosts AuditLogPanelComponent |
| ADM-AUDIT-02 | AuditLogPanelComponent | panel | `/admin/audit-log` | `features/admin/components/audit-log-panel/audit-log-panel.component.ts:1` | A | empty(live: 0 of 0; all audit entries cleared in non-seeded env) · populated(D4-terminal: non-seeded env — no audit entries) | Tenant-wide audit trail log (user actions, timestamps) |

### ADMIN AREA — BI API Keys tab (`/admin/bi-api-keys`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-BI-01 | bi-api-keys tab panel | tab | `/admin/bi-api-keys` | `admin.component.html:487` | A only | empty(live-4): 0 keys; ISSUE KEY button | Hosts BiApiKeysPanelComponent |
| ADM-BI-02 | BiApiKeysPanelComponent | panel | `/admin/bi-api-keys` | `features/admin/components/bi-api-keys-panel/bi-api-keys-panel.component.ts:1` | A | populated(live-4): list panel renders; ISSUE KEY dialog fields: Name · Expires At [optional] · CANCEL · ISSUE KEY | Business intelligence API key management (Phase 3/WU-04) |

### ADMIN AREA — EDI tab (`/admin/edi`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-EDI-01 | edi tab panel | tab | `/admin/edi` | `admin.component.html:494` | A only | populated(live: TRADING PARTNERS + TRANSACTIONS sub-tabs; 0 partners; NEW PARTNER button) | Hosts EdiPanelComponent |
| ADM-EDI-02 | EdiPanelComponent | panel | `/admin/edi` | `features/admin/components/edi-panel/edi-panel.component.ts:1` | A | empty(live: "No trading partners configured") · dialog-fields(NEW TRADING PARTNER: Name/Qualifier ID/Qualifier Value/Format[X12(ANSI)]/Transport[Manual]/Auto-process/Require Ack/Notes; CREATE; warning-2) · transactions-tab(live-5: Direction[All Directions]+Status[All Statuses] filters; empty "No EDI transactions"; swap_horiz icon) · transactions-populated(D4-terminal: non-seeded env — no EDI transactions) | EDI trading partner config; TRADING PARTNERS + TRANSACTIONS sub-tabs confirmed |

### ADMIN AREA — MFA Policy tab (`/admin/mfa`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-MFA-01 | mfa tab panel | tab | `/admin/mfa` | `admin.component.html:501` | A only | populated(live: MFA Policy heading + Required for Roles multiselect + SAVE + USER COMPLIANCE table) | Hosts MfaPolicyPanelComponent |
| ADM-MFA-02 | MfaPolicyPanelComponent | panel | `/admin/mfa` | `features/admin/components/mfa-policy-panel/mfa-policy-panel.component.ts:1` | A | populated(live: MFA Policy section with Required for Roles multiselect (role-picker), SAVE button; USER COMPLIANCE section with "No users found" empty state) · compliance-table-populated(D4-terminal: no MFA-required roles configured in non-seeded env; ADM-Q-043 terminal) | Org-wide MFA policy: role-level enforcement; USER COMPLIANCE compliance table |

### ADMIN AREA — Automations tab (`/admin/automations`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-AUTO-01 | automations tab panel | tab | `/admin/automations` | `admin.component.html:508` | A only | empty(live: 0 failures; Status filter; REFRESH button) | Hosts DomainEventFailuresPanelComponent |
| ADM-AUTO-02 | DomainEventFailuresPanelComponent | panel | `/admin/automations` | `features/admin/components/domain-event-failures-panel/domain-event-failures-panel.component.ts:1` | A | empty(live: "No domain event failures") · populated(D4-terminal: non-seeded env — no domain event failures) | Domain event failures / dead-letter queue viewer + retry |

### ADMIN AREA — Auto-PO Settings tab (`/admin/auto-po`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-APO-01 | auto-po tab panel | tab | `/admin/auto-po` | `admin.component.html:522` | A only | populated(live: Auto-PO Settings form; SAVE button) | Hosts AutoPoSettingsComponent |
| ADM-APO-02 | AutoPoSettingsComponent | panel | `/admin/auto-po` | `features/admin/components/auto-po-settings/auto-po-settings.component.ts:1` | A | populated(live: 4 fields: Enable Auto-PO (toggle), Auto-PO Mode (Suggest default), Buffer Days, Send Chat Notifications (toggle); SAVE button) | Auto-PO generation policy and threshold settings |

### ADMIN AREA — Expense Settings tab (`/admin/expenses`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-EXP-01 | expenses tab panel | tab | `/admin/expenses` | `admin.component.html:529` | A only | populated(live: Expense Policy form + SAVE button) | Hosts ExpenseSettingsPanelComponent |
| ADM-EXP-02 | ExpenseSettingsPanelComponent | panel | `/admin/expenses` | `features/admin/components/expense-settings-panel/expense-settings-panel.component.ts:1` | A | populated(live: 5 fields: Allow self-approval (toggle), Auto-approve threshold ($ input; "No auto-approval" placeholder), Maximum expense amount ($ input; "No limit" placeholder), Require receipt attachment (toggle), Minimum description length; SAVE button) | Expense policy settings (limits, approval rules) |

### ADMIN AREA — Compliance tab (`/admin/compliance`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-CMP-01 | compliance tab panel | tab | `/admin/compliance` | `admin.component.html:536` | A,M,OM | populated(live: 0 templates; SYNC ALL + NEW TEMPLATE buttons; PER-USER COMPLIANCE section with user picker "Select User") | Template list + per-user compliance picker + detail panel |
| ADM-CMP-02 | ComplianceTemplatesPanelComponent | panel | `/admin/compliance` | `features/admin/components/compliance-templates-panel/compliance-templates-panel.component.ts:1` | A,M,OM | empty(live: "No compliance templates configured") · populated(D4-terminal: non-seeded env — no compliance templates; CAP-QC-COMPLIANCE-FORMS OFF also gates API) · SYNC ALL action visible | Compliance template catalog (W-4, I-9, state forms, dynamic forms) |
| ADM-CMP-03 | ComplianceTemplateDialogComponent | dialog | `/admin/compliance` | `features/admin/components/compliance-template-dialog/compliance-template-dialog.component.ts:1` | A,M,OM | populated(live-4): Name · Form Type [default=W-4 Federal Tax] · Description · Icon · Profile Key · Source URL · Sort Order · Auto-Sync · Active · Requires Identity Docs · Blocks Job Assignment · CANCEL · CREATE | Create/edit compliance template |
| ADM-CMP-04 | CompleteI9DialogComponent | dialog | `/admin/compliance` (via UserCompliancePanelComponent) | `features/admin/components/complete-i9-dialog/complete-i9-dialog.component.ts:36` | A,M,OM | source-confirmed(trigger: user-compliance-panel.html:67 + ts:161; fields: documentListType/startDate/listA/listB/listC/reverificationDueAt; see ADM-Q-017) · D4-terminal: no employee with pending I-9 in non-seeded env | Admin-side I-9 Section 2 completion: shown when employee has signed Section 1 but employer hasn't signed Section 2 |
| ADM-CMP-05 | user compliance picker | cluster | `/admin/compliance` | `admin.component.html:542` | A,M,OM | populated(live: "Select User" placeholder; user search input) | `app-select` to choose a user; feeds UserCompliancePanelComponent |
| ADM-CMP-06 | UserCompliancePanelComponent | panel | `/admin/compliance` | `features/admin/components/user-compliance-panel/user-compliance-panel.component.ts:1` | A,M,OM | no-user(source: app-empty-state icon="person_search") · no-submissions(source: icon="description") · no-identity-docs(source: icon="badge") · no-tax-docs(source: icon="receipt_long") · populated(D4-terminal: non-seeded env — no compliance submissions for any user) | Per-user compliance status detail (forms completed, missing items) |

### ADMIN AREA — Reference Data tab (`/admin/reference-data`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-REF-01 | reference-data tab panel | tab | `/admin/reference-data` | `admin.component.html:549` | A only | populated(live: 17 reference-data groups visible) | Accordion list of reference-data groups; each expands to values table |
| ADM-REF-02 | reference group accordion | cluster | `/admin/reference-data` | `admin.component.html:556` | A | populated(live-7): uses custom `.accordion-item`/`.accordion-header` CSS classes (not mat-expansion-panel); icon: chevron_right→expand_more on expand; expanded columns: Order · Code · Label · Effective From · Effective To · Status; sample Asset Hold Type (3 entries): asset_hold_maintenance(Maintenance Due) · asset_hold_calibration(Calibration Expired) · asset_hold_repair(Under Repair); sample Clock Event Type (6 entries): ClockIn · ClockOut · BreakStart · BreakEnd · LunchStart · LunchEnd; sample Contact Role (8 entries): primary · billing · technical · shipping · owner · manager · engineer · procurement | Collapsible group row: groupCode → values table (sort order, code, label, effective dates, status) |

### ADMIN AREA — Standalone routes (separate lazy-loaded components)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-CAP-01 | CapabilitiesComponent | page | `/admin/capabilities` | `features/admin/capabilities/capabilities.component.ts:1` | A (route-level guard same as admin shell) | populated(live: 62/151 enabled; areas grouped: ACCT 2/8, CROSS 9/12, EXT 3/17…; Search + Area + Enabled-only filters; CONSULTANT MODE toggle; RUN DISCOVERY + BROWSE PRESETS + CLOSE welcome banner; REFRESH; each area expandable with cap rows + chevron-right detail links) | Capability list with search/area/enabled-only filters, capability toggles, consultant-mode toggle, click-through to detail |
| ADM-CAP-02 | CapabilityDetailComponent | page | `/admin/capabilities/:id` | `features/admin/capability-detail/capability-detail.component.ts:1` | A | populated(live: PERMISSION MATRIX ENFORCEMENT example — BACK, REFRESH, cap name, code, area, default status, description, ENABLED toggle, RELATIONSHIPS section with DEPENDS ON (1) + REQUIRED BY (0), CONFIGURATION section, RECENT ACTIVITY section) | Per-capability detail: name/code/area, dependencies, ENABLED state, configuration row, audit entries |
| ADM-CAP-03 | CapabilitiesDebugComponent | page | `/admin/capabilities-debug` | `features/admin/capabilities-debug/capabilities-debug.component.ts:1` | A | populated(live: 151 total, 62 enabled; flat table: CODE/AREA/NAME/DEFAULT/STATE/ROLES columns; REFRESH button) | Diagnostic flat table of loaded capability descriptor (Phase 4A) |
| ADM-DISC-01 | DiscoveryComponent | page | `/admin/discovery` | `features/admin/discovery/discovery.component.ts:1` | A | populated(live: 1 OF 16 steps; SELF-SERVE mode button; SKIP DISCOVERY; Q-S1 confirmed — "We sell physical products / We sell time+services / Both"; BACK + NEXT navigation; full question catalog source-extracted in §Source-Extracted Detail) | Discovery wizard — 16-step guided capability/preset selection; branch map fully sourced (ADM-Q-011 closed from source) |
| ADM-PRE-01 | PresetBrowserComponent | page | `/admin/presets` | `features/admin/presets/preset-browser/preset-browser.component.ts:1` | A | populated(live: 10 presets visible; COMPARE button; CAPABILITIES back nav) | Preset browser — curated capability bundles; 10 presets including "Two-Person Shop" (PRESET-01) visible |
| ADM-PRE-02 | PresetCompareComponent | page | `/admin/presets` (via COMPARE button + ids query param) | `features/admin/presets/preset-compare/preset-compare.component.ts:1` | A | redirect(live-3: /admin/presets/compare without ids → redirects to /admin/presets list) · populated(live-5: /admin/presets/compare?ids=PRESET-01,PRESET-02 → 12/151 caps differ; table: Capability · PRESET-01(55) · PRESET-02(65); PICK THIS ONE per column; SHOW ALL ROWS/SHOW DIFF ONLY toggle; compare mode invoked by checkbox+COMPARE button on list — no standalone route) | Side-by-side preset comparison; rendered within /admin/presets when ids query param present |
| ADM-PRE-03 | PresetCustomComponent | page | `/admin/presets/custom` | `features/admin/presets/preset-custom/preset-custom.component.ts:1` | A | populated(live: CUSTOM CONFIGURATION heading; PRESETS back nav; RESET TO DEFAULTS button; capability toggle list) | Custom preset builder — start from catalog defaults, toggle individual capabilities |
| ADM-PRE-04 | PresetDetailComponent | page | `/admin/presets/:id` | `features/admin/presets/preset-detail/preset-detail.component.ts:1` | A | populated(live-4): PRESET-01 -- APPLY THIS PRESET; 55 CAPS/2 DIFFER/7 WILL CHANGE | Preset detail: capability set grouped by area; apply action refreshes descriptor |
| ADM-EC-01 | EntityCompletenessAdminComponent | page | `/admin/entity-completeness` | `features/admin/entity-completeness/entity-completeness-admin.component.ts:1` | A | empty(live: "Entity Completeness Requirements"; Entity Type + Capability Code filters; NEW REQUIREMENT button) | CRUD over entity completeness requirement rows (drives completeness chip/badge) |
| ADM-EC-02 | EntityCapabilityRequirementDialogComponent | dialog | `/admin/entity-completeness` | `features/admin/entity-completeness/entity-capability-requirement-dialog/entity-capability-requirement-dialog.component.ts:1` | A | populated(live: 7 fields: Entity Type (Vendor default), Capability Code, Requirement Id, Predicate (JSON), Display Name Key, Missing Message Key, Sort Order; SAVE) | Create/edit entity capability requirement row |
| ADM-WC-01 | WorkingCalendarsComponent | page | `/admin/working-calendars` | `features/admin/working-calendars/working-calendars.component.ts:1` | A | empty(live: "No calendars yet") · inline-form(live: new-calendar form always visible even in empty state — Name, Time Zone (UTC default), WORKING DAYS checkboxes Sun-Mon-Tue-Wed-Thu-Fri-Sat, Active; SAVE; warning-1) · populated(live-10: right-panel confirmed — Edit Calendar: Name + TimeZone + Working Days M–S toggles + Active toggle + SAVE; Holidays table: Date/Name/Observed/Recurring/Actions + ADD HOLIDAY; Shifts → ADM-WC-03; 1 calendar seeded in scout env) | Working calendar + holidays admin; inline form (not dialog); right-panel shows edit form + holidays + shifts when calendar selected |
| ADM-WC-03 | WorkingCalendarsComponent shifts section | cluster | `/admin/working-calendars` | `features/admin/working-calendars/working-calendars.component.ts:98-105` | A | populated(live-10: Shifts table columns: Name/Days/Start/End/Capacity/Premium/Actions; inline shift form: name(req/max100) · startTime(req/HH:mm) · endTime(req/HH:mm) · premiumMultiplier(0–10/default 1.0) · capacityHours(0–24/default 0) · isActive(toggle/true); ADD SHIFT button; editShift()/saveShift()/deleteShift()) · empty(D4-terminal: no saved calendars in non-seeded env) | Shifts sub-table within working calendar right-panel; capacity + premium multiplier per named shift |
| ADM-TAR-01 | TariffsComponent | page | `/admin/tariffs` | `features/admin/tariffs/tariffs.component.ts:1` | A | empty(live: "No tariff rates yet") · dialog-fields(NEW TARIFF: HTS Code, Country of Origin ISO-2, Rate %, Effective From, Effective To, Source; SAVE) | HTS-code tariff rate admin (bought-parts PR4; feeds landed-cost duty) |
| ADM-LS-01 | LeadSourcesComponent | page | `/admin/lead-sources` | `features/admin/lead-sources/lead-sources.component.ts:1` | A | empty(live: "No lead sources yet") · dialog-fields(NEW SOURCE: Name, Code, Description; SAVE — 3 fields only, no Type/Active/Quality Score in dialog) | Lead source catalog admin (Phase 1r/Batch 9) |
| ADM-ICR-01 | IcpRubricsComponent | page | `/admin/icp-rubrics` | `features/admin/icp-rubrics/icp-rubrics.component.ts:1` | A | empty(live: "No ICP rubrics yet") · dialog-fields(NEW RUBRIC: Name, Description, Active toggle, Default rubric toggle, DIMENSIONS section with ADD DIMENSION; SAVE) | ICP scoring rubric admin (Phase 1r/Batch 10) |
| ADM-ASR-01 | AssignmentRulesComponent | page | `/admin/assignment-rules` | `features/admin/assignment-rules/assignment-rules.component.ts:1` | A | empty(live: "No assignment rules yet") · dialog-fields(NEW RULE: Name, Kind (Round Robin default), Priority, Rep User IDs (rotation comma-separated), ADVANCED - RAW JSON section; SAVE) | Lead assignment rules (Phase 1r/Batch 11): round-robin/territory/industry |
| ADM-CUR-01 | CurrenciesComponent | page | `/admin/currencies` | `features/admin/currencies/currencies.component.ts:1` | A | empty(live: both CURRENCIES + EXCHANGE RATES sections empty; "No currencies configured yet"; NEW CURRENCY + SET RATE buttons) | Multi-currency catalog + FX rates |
| ADM-CUR-02 | CurrencyDialogComponent | dialog | `/admin/currencies` | `features/admin/currencies/currency-dialog.component.ts:1` | A | populated(live: 6 fields: ISO code, Symbol, Name, Decimal places, Sort order, Base currency (toggle); SAVE; warning-3) | Create/edit currency |
| ADM-CUR-03 | ExchangeRateDialogComponent | dialog | `/admin/currencies` | `features/admin/currencies/exchange-rate-dialog.component.ts:1` | A | source-confirmed(ADM-Q-041 resolved): fromCurrencyId(req/select) · toCurrencyId(req/select) · rate(req/4dp) · effectiveDate(req/today); same-pair custom validator; dialog requires ≥2 currencies — populated D4-terminal (non-seeded env, no currencies configured) | Create/edit exchange rate for a date |

### SETUP INTEGRATIONS

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| SI-01 | SetupIntegrationsComponent | page | `/setup/integrations` | `features/setup-integrations/setup-integrations.component.ts:1` | all-auth (authGuard); Admin is the intended user; server enforces auth | error(live: Admin reaches /setup/integrations → "Invalid or expired setup code. Please contact your administrator." — non-seeded env already has integrations configured, so no valid setup code exists) · first-run(D3-terminal: only observable in truly fresh installation before any integration configured; current env is non-first-run; unobservable in seeded/non-seeded env per D3) | Post-first-admin integration setup wizard; requires valid setup code; shows error in non-first-run envs |

---

### ACCOUNT AREA

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ACC-00 | AccountLayoutComponent | page | `/account` (shell) | `features/account/account-layout.component.ts:1` | all-auth | populated(live: shell renders; sidebar + main area confirmed) | Account section shell with sidebar nav |
| ACC-SB-01 | AccountSidebarComponent | cluster | `/account/*` | `features/account/components/account-sidebar/account-sidebar.component.ts:1` | all-auth | populated(live: 11 nav items confirmed: Profile → /account/profile · Contact & Address → /account/contact · Emergency Contact → /account/emergency · Employee Onboarding → /onboarding (check_circle badge) · Tax & Compliance → expandable section (not direct route) · Documents → /account/documents · Pay Stubs → /account/pay-stubs · Tax Documents → /account/tax-documents · Security → /account/security · Customization → /account/customization · Integrations → /account/integrations · Communications → /account/communications) | Left sidebar nav; Tax & Compliance is expandable accordion, not a direct route |
| ACC-PROF-01 | AccountProfileComponent | page | `/account/profile` | `features/account/pages/profile/account-profile.component.ts:1` | all-auth | populated(live: avatar FA · email badge · role chip ADMIN; fields: First Name, Last Name, Initials, Date of Birth, Gender, Avatar Color; SAVE) | User profile: name, avatar, initials, DOB, gender, avatar color |
| ACC-CONT-01 | AccountContactComponent | page | `/account/contact` | `features/account/pages/contact/account-contact.component.ts:1` | all-auth | populated(live: 8 fields: Phone Number, Personal Email, Street Address, Street Address 2, City, State, ZIP/Postal Code, Country; SAVE) | Contact info: address, phone, personal email |
| ACC-EMER-01 | AccountEmergencyComponent | page | `/account/emergency` | `features/account/pages/emergency/account-emergency.component.ts:1` | all-auth | populated(live: 3 fields: Contact Name, Contact Phone, Relationship; SAVE) | Emergency contacts |
| ACC-TAX-01 | AccountTaxFormsComponent | page | `/account/tax-forms` | `features/account/pages/tax-forms/account-tax-forms.component.ts:1` | all-auth | empty(live: no forms listed for admin user — compliance templates not configured, so no forms appear) · populated(D4-terminal: no compliance templates configured + CAP-QC-COMPLIANCE-FORMS OFF) | Tax form list (W-4, I-9, state withholding) — compliance forms index |
| ACC-TAX-02 | AccountTaxFormDetailComponent | page | `/account/tax-forms/:formType` | `features/account/pages/tax-form-detail/account-tax-form-detail.component.ts:1` | all-auth | source-confirmed(dispatch model in §Source-Extracted Detail) · w4-i9-redirect(live-6: /account/tax-forms/w4 + /account/tax-forms/i9 both redirect to /onboarding) · state-w9-loading(live-7: /account/tax-forms/state + /account/tax-forms/w9 stay at route but render "Loading..." indefinitely — no API data) · populated(D4-terminal: no compliance templates configured) | Per-form detail: hosts ComplianceFormRendererComponent; dispatch model source-extracted in §Source-Extracted Detail |
| ACC-TAX-03 | ComplianceFormRendererComponent | panel | `/account/tax-forms/:formType` | `features/account/components/compliance-form-renderer/compliance-form-renderer.component.ts:1` | all-auth | source-confirmed(dispatch model + field types in §Source-Extracted Detail) · populated(D4-terminal: no compliance form definitions configured) | Dynamic compliance form renderer (W-4/I-9/state/dynamic forms) |
| ACC-DOC-01 | AccountDocumentsComponent | page | `/account/documents` | `features/account/pages/documents/account-documents.component.ts:1` | all-auth | populated(live: renders; no empty-state visible — likely renders doc list even if empty in seeded env) | Employee document storage (company-issued docs) |
| ACC-PAY-01 | AccountPayStubsComponent | page | `/account/pay-stubs` | `features/account/pages/pay-stubs/account-pay-stubs.component.ts:1` | all-auth | empty(live: no pay stubs for admin user in non-seeded env) · populated(D4-terminal: non-seeded env — no pay stubs exist for any user) | Pay stub history list |
| ACC-PAY-02 | AccountTaxDocumentsComponent | page | `/account/tax-documents` | `features/account/pages/tax-documents/account-tax-documents.component.ts:1` | all-auth | empty(live: no tax documents for admin user in non-seeded env) · populated(D4-terminal: non-seeded env — no tax documents exist for any user) | W-2 and other annual tax documents |
| ACC-SEC-01 | AccountSecurityComponent | page | `/account/security` | `features/account/pages/security/account-security.component.ts:1` | all-auth | populated(live: CHANGE PASSWORD section (Current Password, New Password, Confirm New Password; CHANGE PASSWORD button) · KIOSK PIN section (PIN, Confirm PIN; SET PIN button) · MFA section (ENABLE TWO-FACTOR AUTHENTICATION button; MFA disabled state for admin@forge.local)) | Security settings: password change, kiosk PIN, MFA setup |
| ACC-SEC-02 | MfaSetupDialogComponent | dialog | `/account/security` | `features/account/components/mfa-setup-dialog/mfa-setup-dialog.component.ts:1` | all-auth | partial(live-4): step 1 (scan-qr) confirmed live — QR code display · "Can't scan?" manual key toggle · 6-digit verification code input · CANCEL · VERIFY & ENABLE; full step sequence source-extracted in §Source-Extracted Detail; step complete + recovery queued ADM-Q-013 | MFA enrollment: QR code / TOTP setup flow |
| ACC-SEC-03 | MfaRecoveryCodesDialogComponent | dialog | `/account/security` | `features/account/components/mfa-recovery-codes-dialog/mfa-recovery-codes-dialog.component.ts:1` | all-auth | D3-terminal: MFA not enabled on admin@forge.local; recovery codes accessible only after TOTP enrollment completes (MfaSetupDialog complete → Done → then recoveries accessible); source-confirmed: list of codes + REGENERATE action (ADM-Q-013/038 terminal) | View/regenerate MFA recovery codes |
| ACC-CUST-01 | AccountCustomizationComponent | page | `/account/customization` | `features/account/pages/customization/account-customization.component.ts:1` | all-auth | populated(live: COLOR THEME (LIGHT/DARK buttons) · TEXT SIZE (DEFAULT 12px / COMFORTABLE 14px / LARGE 16px / EXTRA LARGE 18px) · Notification sound (volume_up toggle; DEFAULT/CHIME/BELL/POP choices) · Vibration (mobile toggle) · Desktop preview popups (toggle; frequency: 1 DAY/3 DAYS/1 WEEK/2 WEEKS/OFF) · Snooze duration (1 MIN/5 MIN/15 MIN/30 MIN/1 HR)) | UI customization: theme, text size, notification sound, desktop previews, snooze duration |
| ACC-ITGR-01 | AccountIntegrationsComponent | page | `/account/integrations` | `features/account/pages/integrations/account-integrations.component.ts:1` | all-auth | populated(live: 14 provider cards: Google Calendar · Microsoft Outlook/365 · Apple iCloud Calendar · CalDAV (Generic) · Slack · Microsoft Teams · Discord · Google Chat · Email Personal SMTP · Google Drive · Microsoft OneDrive · Dropbox · Apple iCloud Drive · GitHub; each with icon + name + description + CONNECT button) | Personal integration connections (calendar, chat, storage, issue tracking) |
| ACC-ITGR-02 | ConnectIntegrationDialogComponent | dialog | `/account/integrations` | `features/account/pages/integrations/connect-integration-dialog.component.ts:1` | all-auth | populated(live-5: ADM-Q-032 resolved — CONNECT GOOGLE CALENDAR dialog: Display Name(optional) · Access Token(password, info-tooltip); CANCEL · CONNECT; 1 warning) | OAuth/API key connect flow for personal integration |
| ACC-COMM-01 | AccountCommunicationsComponent | page | `/account/communications` | `features/account/pages/communications/account-communications.component.ts:1` | all-auth | rendered(live: cap-gate-visible=false; renders without cap-gate wall; CONNECT action gated by CAP-EXT-EMAIL-SYNC=OFF — button present but no OAuth flow) · empty(source: app-empty-state icon="inbox") · populated(D4-terminal: CAP-EXT-EMAIL-SYNC OFF + non-seeded env — no synced emails) | Email/IMAP sync; renders even when CAP-EXT-EMAIL-SYNC=OFF; CONNECT gated at API level |
| ACC-COMM-02 | ConnectCommunicationDialogComponent | dialog | `/account/communications` | `features/account/pages/communications/connect-communication-dialog.component.ts:1` | all-auth | D3-terminal: CAP-EXT-EMAIL-SYNC OFF gates all CONNECT actions; source-confirmed (ADM-Q-033): picker for Google/Microsoft OAuth vs IMAP; dialog not openable in cap-OFF env (account-communications.component.ts:130-139) | Picker: Google/Microsoft OAuth vs IMAP |
| ACC-COMM-03 | ConnectImapDialogComponent | dialog | `/account/communications` | `features/account/pages/communications/connect-imap-dialog.component.ts:1` | all-auth | D3-terminal: CAP-EXT-EMAIL-SYNC OFF; source-confirmed (ADM-Q-033): IMAP server credentials form (host · port · SSL toggle · username · password; app-input fields per connect-imap-dialog.component.html:31) | IMAP server credentials form |
| ACC-COMM-04 | OauthCallbackComponent | page | `/account/communications/oauth-callback` | `features/account/pages/communications/oauth-callback.component.ts:1` | all-auth | rendered(live: navigates to /account/communications/oauth-callback without redirect; renders with sidebar; no error/success message visible without valid OAuth code; CAP-EXT-EMAIL-SYNC=OFF does not prevent component from rendering) | OAuth redirect-back handler; renders for all-auth regardless of cap state |
| ACC-DEAD-01 | AccountComponent | dead-code | — | `features/account/account.component.ts:22` | none/unreachable | — | Orphaned AccountComponent (selector `app-account`) — not referenced in `account.routes.ts`, zero `<app-account>` instantiations in any template; examined and excluded from live denominator per D6 |

---

### EMPLOYEES AREA

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| EMP-LIST-01 | EmployeeListComponent | page | `/employees` | `features/employees/pages/employee-list/employee-list.component.ts:1` | A,M | populated(live: 22 employees; INVITE EMPLOYEE button; Search/Role/Status filters; columns: NAME/ROLE/TEAM/TITLE/EMAIL/PHONE/STATUS/START DATE; per-row actions) | Employee roster list (filterable/sortable) |
| EMP-DET-01 | EmployeeDetailComponent | page | `/employees/:id/:tab` | `features/employees/pages/employee-detail/employee-detail.component.ts:1` | A,M | populated(live: 10 tabs confirmed: Overview · Time & Attendance · Pay · Training · Compliance · Jobs · Events · Expenses · Documents · Activity; employee header: avatar + name + role + status + email + KPI chips) | Employee detail shell; 10 sub-tabs |
| EMP-DET-02 | EmployeeOverviewTabComponent | tab | `/employees/:id/overview` | `features/employees/pages/employee-detail/tabs/employee-overview-tab.component.ts:1` | A,M | populated(live: EMPLOYMENT DETAILS + CONTACT INFORMATION + SYSTEM ACCESS sections; role, work location, status, email, PIN CONFIGURED) | Employee summary: employment details, contact info, system access |
| EMP-DET-03 | EmployeeActivityTabComponent | tab | `/employees/:id/activity` | `features/employees/pages/employee-detail/tabs/employee-activity-tab.component.ts:1` | A,M | populated(live: renders; activity data present for admin user) | Activity log for employee |
| EMP-DET-04 | EmployeeComplianceTabComponent | tab | `/employees/:id/compliance` | `features/employees/pages/employee-detail/tabs/employee-compliance-tab.component.ts:1` | A,M | populated(live: tab renders) | Compliance form status per employee (mirrors UserCompliancePanelComponent data) |
| EMP-DET-05 | EmployeeDocumentsTabComponent | tab | `/employees/:id/documents` | `features/employees/pages/employee-detail/tabs/employee-documents-tab.component.ts:1` | A,M | populated(live: renders; cloud_upload drop-zone visible; "Drag files here or click to browse, Max 25MB per file") | Documents on file for this employee; file upload drop-zone |
| EMP-DET-06 | EmployeeEventsTabComponent | tab | `/employees/:id/events` | `features/employees/pages/employee-detail/tabs/employee-events-tab.component.ts:1` | A,M | populated(live: tab renders) | Event history for employee |
| EMP-DET-07 | EmployeeExpensesTabComponent | tab | `/employees/:id/expenses` | `features/employees/pages/employee-detail/tabs/employee-expenses-tab.component.ts:1` | A,M | populated(live: tab renders) | Expense submissions by employee |
| EMP-DET-08 | EmployeeJobsTabComponent | tab | `/employees/:id/jobs` | `features/employees/pages/employee-detail/tabs/employee-jobs-tab.component.ts:1` | A,M | populated(live: tab renders) | Jobs assigned to employee |
| EMP-DET-09 | EmployeePayTabComponent | tab | `/employees/:id/pay` | `features/employees/pages/employee-detail/tabs/employee-pay-tab.component.ts:1` | A,M | populated(live: tab renders) | Pay rate / payroll info for employee |
| EMP-DET-10 | EmployeeTimeTabComponent | tab | `/employees/:id/time` | `features/employees/pages/employee-detail/tabs/employee-time-tab.component.ts:1` | A,M | populated(live: tab label "Time & Attendance" confirmed; time entries table renders with action buttons) | Time & Attendance entries for employee |
| EMP-DET-11 | EmployeeTrainingTabComponent | tab | `/employees/:id/training` | `features/employees/pages/employee-detail/tabs/employee-training-tab.component.ts:1` | A,M | populated(live: tab renders) | Training progress/assignments for employee |

---

### TRAINING / LMS AREA

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| TRN-01 | TrainingComponent | page | `/training/:tab` | `features/training/training.component.ts:1` | all-auth | empty(live: 3 tabs confirmed: MY LEARNING (school icon, slug=my-learning) · LEARNING PATHS (route icon, slug=learning-paths) · ALL MODULES (menu_book icon, slug=all-modules); my-learning: "No training paths assigned yet"; all-modules: search/Type/Learning Style filters + "No training modules"; learning-paths: "No learning paths available") · loading-only(live: /training/teams tab renders "LOADING..." only) · populated(D4-terminal: no training content seeded; CAP-HR-TRAINING OFF prevents seeding new content; cap gate is API-level — UI shell accessible cap-OFF) | LMS shell; 3 confirmed tabs (my-learning / learning-paths / all-modules); teams tab stalls at loading |
| TRN-MOD-01 | TrainingModuleComponent | page | `/training/module/:id` | `features/training/training-module/training-module.component.ts:1` | all-auth | not-found-error(live-10: UI shell renders not-found error state for invalid IDs; cap gate is API-level only; no 403/redirect/banner even with CAP-HR-TRAINING OFF) · populated(D4-terminal: no modules seeded in non-seeded env; source-confirmed content types in ADM-Q-018: article/walkthrough/quickref/quiz) | Training module viewer (article/video/quiz/quickref/walkthrough content) |
| TRN-MOD-02 | TrainingModuleQuizComponent | panel | `/training/module/:id` | `features/training/training-module/training-module-quiz.component.ts:1` | all-auth | D4-terminal: no modules to render quiz component; source-confirmed quiz structure (ADM-Q-018/037); UI shell accessible cap-OFF (cap gate is API-level only) | Quiz interaction within a training module |
| TRN-PATH-01 | TrainingPathComponent | page | `/training/path/:id` | `features/training/training-path/training-path.component.ts:1` | all-auth | empty-modules(source: icon="school" msg="No modules in this path yet") · not-found(live-10: UI shell renders not-found for invalid IDs; cap gate API-level only; no 403/redirect/banner cap-OFF) · populated(D4-terminal: no paths seeded in non-seeded env) | Training path viewer: ordered module list with progress |

---

## Queue

_Items needing live confirmation or role-specific sweep — filed here by source-cataloger; dequeued when ui-scout confirms states._

**Source-filled so far (cycle 2):** 13 states moved from TODO → source-confirmed (ADM-USR-02 empty, ADM-TERM-01 empty, ADM-SET-03 empty, ADM-CMP-06 four empty variants, ADM-WC-01 empty, ACC-ITGR-01 empty, ACC-COMM-01 empty, TRN-01 empty, TRN-PATH-01 empty+not-found, ADM-AI-01 renders). Capability defaults filled for 11 relevant caps. Shared component usages fully mapped (Tree 3).

Remaining TODO states: 0 — all converted to live-confirmed, source-confirmed, D3-terminal, or D4-terminal in cycles 4–9.

Priority items for ui-scout first pass:
1. `/admin/settings` — verify whether `AdminSettingsComponent` (ADM-SET-09) is embedded within the settings tab or an independent surface; states for all 5 sub-sections (company profile, locations, pay-period, system settings, logo/lockups)
2. `/admin/compliance` — sweep as OfficeManager to confirm OfficeManager-only view (only compliance tab visible)
3. `/admin/ai-assistants` — confirm panel behavior when CAP-EXT-AI-ASSISTANT is OFF (default) vs ON; D3 trigger state
4. `/admin/integrations` — list all integration cards visible (QBO + others); integration config dialog states; IntegrationConfigDialogComponent structure
5. `/admin/mfa` — MFA policy options (require/optional/disabled per role); confirm panel form fields
6. `ADM-TAX-04` StateWithholdingDialogComponent — which tab/context triggers this dialog (not found in any obvious parent template); may be inside UserCompliancePanelComponent
7. `/account/security` — MFA setup dialog states (step: QR code, step: verify code, step: recovery codes shown); confirm CAP-IDEN-AUTH-MFA=OFF behavior
8. `/account/tax-forms/:formType` — confirm W-4/I-9/state/dynamic all render via ComplianceFormRendererComponent; confirm formType slug values
9. `/employees` — confirm Manager sees same tab set as Admin; check for any tab visibility differences
10. Training LMS tab slugs: `training.routes.ts` has `:tab` catch-all → confirm actual slugs rendered at `/training/my-learning`, `/training/all-modules`, `/training/paths`, `/training/teams`
~~11. `AccountComponent` vs `AccountLayoutComponent` ambiguity~~ — **RESOLVED (source):** `AccountComponent` (`account.component.ts`, selector `app-account`) is dead code — not referenced in `account.routes.ts` (which loads `AccountLayoutComponent` as the sole shell at line 3,8), and zero `<app-account>` usages in any HTML template. Profile + password forms that were in `AccountComponent` are now split across `AccountProfileComponent` (`/account/profile`) and `AccountSecurityComponent` (`/account/security`). No inventory row needed; terminal.
~~12. `app-barcode-info` — classification~~ — **RESOLVED (source):** `app-barcode-info` (`shared/components/barcode-info/barcode-info.component.ts`) is a cross-region shared utility. platform.md CLOSED explicitly rejected SH# assignment (all consumers are non-platform). Catalogued in admin.md as `shared-cmp` type at ADM-USR-07 (file:line confirmed: `admin.component.html:741`). No SH number. Cross-links section updated; denominator unchanged at 94 (row ADM-USR-07 accounts for it within admin scope). Live confirmation of render in users dialog remains TODO per ADM-USR-07.

---

_Cycle 2 commit: D2 shared cross-links complete (Tree 3 fully mapped, 18 SH usages located); capability defaults source-filled for 11 gates; 13 states moved TODO→source-confirmed; denominator stable=94; remaining TODO=~81 at cycle 2 (all resolved by cycle 9); queue=12 items_

_Cycle 3 (source-only): Queue items #11 + #12 resolved from source. AccountComponent confirmed dead code (not routed, zero instantiations in any template). app-barcode-info = cross-region shared utility; no SH#; catalogued as shared-cmp at ADM-USR-07; platform.md CLOSED rejected SH-24. Duplicate ADM-USR-09 (copy of ADM-TT-04) removed. Queue depth → 10 (items 1–10 remain, all live-dependent). Denominator anomaly flagged: Account file-count includes dead AccountComponent (22 files, 21 live) → proposed 94→93._

_Cycle 4 (source verification): Fresh source-tree walk confirms denominator=93 is correct — 55 admin + 21 account (22 files −1 D6 dead code) + 12 employees + 4 training + 1 setup-integrations. All 93 live .component.ts files verified against component table; every file maps to a catalogued row. Key confirmations: (a) SH-24 app-barcode-info resolved — admin.component.html:741 confirmed as one of 7 cross-region consumers; catalogued at ADM-USR-07, no SH# assigned; (b) Gate structures from source confirmed: app.routes.ts:276 (admin roleGuard Admin/Manager/OfficeManager), :133 (employees Admin/Manager), :232 (account authGuard), :242 (training authGuard), :36 (setup/integrations authGuard+server-enforced Admin); (c) ADMIN_ONLY_TABS / MANAGER_AND_ADMIN_TABS constants at admin.component.ts:97-99 confirmed as gate source for all tab-level renders-for entries. Reconciliation Tree 3 (shared usages) remains fully mapped from Cycle 2. All 63 routes in Tree 1 still await live-sweep tick; 21 queue items in admin-queue.md remain open. No new components discovered — denominator stable. Next: ui-scout live sweep to drain TODO states and queue items._

_Cycle 5 (source pre-extraction): Field lists, step sequences, and branch structures sourced for 5 priority dialogs/forms — see §Source-Extracted Detail below. States all remain TODO / source-only until ui-scout live confirmation. ADM-TAX-04 trigger location resolved from source: fired from ComplianceTemplatesPanelComponent (compliance-templates-panel.component.html:65 + ts:87,102). Queue items ADM-Q-001 (IntegrationConfigDialog), ADM-Q-021 (StateWithholdingDialog trigger), ADM-Q-011 (discovery branches) substantially pre-answered from source._

_Cycle 6 (live sweep folded): ui-scout cycle-1 JSON (97 records) folded. ~65 rows moved from TODO → live-confirmed states. 2 additional D6 dead-code rows confirmed (ADM-SET-09 + ADM-SET-10 — zero usages across entire app); denominator 93→91. Key discoveries: (1) ADM-SET-09 dead (selector never renders); (2) EMP-DET-10 tab label = "Time & Attendance"; (3) TRN-01 confirmed 3 tabs (my-learning/learning-paths/all-modules) + teams=loading-only; (4) ACC-ITGR-01 populated with 14 providers; (5) ACC-SB-01 sidebar full nav confirmed (11 items; Tax & Compliance = expandable section, not route); (6) ACC-COMM-01 renders without cap-gate wall; (7) ADM-SET-01..08 all confirmed; (8) ADM-CMP-03 11 fields confirmed; (9) ADM-DISC-01 16 steps confirmed; (10) ADM-CAP-01 62/151 enabled confirmed; (11) ADM-WC-01 inline form confirmed (not dialog); (12) ADM-MFA-02 Required-for-Roles + USER COMPLIANCE confirmed. Bug ADM-Q-012 confirmed live: both Manager AND OfficeManager reach /admin/users without redirect. ADM-Q-022 trigger resolved from source. ADM-Q-017 trigger resolved from source. Queue: 8 items closed, 4 new items added (ADM-Q-023..026), 1 split (ADM-Q-009→024)._

---

## Source-Extracted Detail

_All entries below are SOURCE-ONLY. States remain TODO until ui-scout confirms live behavior. These are draft sub-entries to speed up the live-sweep pass — each will be ticked or corrected when ui-scout reports._

---

### ADM-INT-03 — IntegrationConfigDialogComponent field structure

**Source:** `integration-config-dialog.component.ts:87-98` · `integration-config-dialog.component.html:29-58` · `forge.core/Settings/IntegrationDescriptorCatalog.cs`

Dialog is **descriptor-driven**: fields are `IntegrationSettingField[]` from the API, not hardcoded in the template.

**Field input types** (source: `integration-status.model.ts:12`):

| inputType | rendered as | notes |
|---|---|---|
| `toggle` | `app-toggle` | boolean; value stored as `"true"/"false"` string |
| `enum` | `app-select` with choices | choices array from `IntegrationSettingChoice[]` |
| `password` | `app-input type=password` | isSensitive=true → placeholder "Enter a new value..." |
| `text` / `url` / `email` | `app-input` with matching type | — |
| `number` | `app-input type=number` | — |

**Common field: mode** — present on every provider as an enum (`Mock / Real`; some add `Sandbox`). Controls IStorageService registration at process start — change requires API restart (source: `integration-config-dialog.component.ts:139-153`).

**20 configured providers** (source: `IntegrationDescriptorCatalog.cs`):

| provider | name | category | key fields (from FieldKeys) | OAuth-connectable |
|---|---|---|---|---|
| `gmail-oauth` | Gmail / Google Workspace | communications | redirect-uri, google-client-id\*, google-client-secret | — |
| `microsoft-oauth` | Outlook / Microsoft 365 | communications | redirect-uri, microsoft-client-id\*, microsoft-client-secret | — |
| `twilio` | Twilio Voice | communications | mode(enum), account-sid, auth-token\*, require-signature(toggle) | — |
| `smtp` | SMTP Email | service | mode(enum), host\*, port, use-ssl(toggle), username, password, from-address, from-name | — |
| `minio` | MinIO Storage | service | mode(enum), endpoint\*, public-endpoint, access-key, secret-key, bucket, use-ssl(toggle) | — |
| `gdrive` | Google Drive | service | mode(enum), client-id\*, client-secret, scopes | — |
| `usps` | USPS Address Validation | service | mode(enum), consumer-key\*, consumer-secret | — |
| `docuseal` | DocuSeal Document Signing | service | mode(enum), api-url, public-base-url, api-key\*, webhook-secret, timeout-seconds | — |
| `ai` | AI Assistant (Ollama) | service | mode(enum), base-url\*, chat-model, embedding-model, vision-model, timeout-seconds, vision-timeout-seconds, docs-path | — |
| `ups` | UPS | shipping | mode(enum), client-id\*, client-secret, account-number | — |
| `fedex` | FedEx | shipping | mode(enum), client-id\*, client-secret, account-number | — |
| `dhl` | DHL Express | shipping | mode(enum), api-key\*, account-number | — |
| `stamps` | Stamps.com | shipping | mode(enum), username, password, integration-id\* | — |
| `quickbooks` | QuickBooks Online | accounting | mode(enum), client-id\*, client-secret | ✓ |
| `xero` | Xero | accounting | mode(enum), client-id\*, client-secret, tenant-id | ✓ |
| `freshbooks` | FreshBooks | accounting | mode(enum), client-id\*, client-secret, account-id | ✓ |
| `sage` | Sage Business Cloud | accounting | mode(enum), client-id\*, client-secret, country-code | ✓ |
| `netsuite` | NetSuite | accounting | mode(enum), account-id\*, consumer-key, consumer-secret, token-id, token-secret | — |
| `wave` | Wave | accounting | mode(enum), access-token\*, business-id | — |
| `zoho` | Zoho Books | accounting | mode(enum), client-id\*, client-secret, organization-id, data-center | ✓ |

_\* = `IsConfiguredCheckKey` — the field whose presence marks this provider as "configured"_

**Dialog chrome** (source: `integration-config-dialog.component.html:1-95`):
- Title: "Configure {integration.name}"
- Optional collapsible **Sandbox Guide** panel (only when `showSandboxGuides=true` AND provider has `sandboxSteps`): step list + link to developer portal
- Dynamic field list (template-driven by descriptor)
- Test result banner (success/error) below fields
- Footer: **Test** button (all providers) · **Connect** button (OAuth providers only, visible when `canConnectOAuth=true`) · Cancel · Save

**OAuth connect flow**: CONNECT button hits `/api/v1/{provider}/authorize` → full-page redirect to provider consent screen → provider callback lands at `/api/v1/{provider}/callback` → bounces to `/admin?tab=integrations&provider=connected` (source: `integration-config-dialog.component.ts:172-192`).

_States: populated(live-5: UPS dialog confirmed — Mode/Client ID/Client Secret/Account Number; TEST · CANCEL · SAVE; other providers pattern-matched from descriptor) · empty(source: no-fields edge, Close only) · test-result-success(source: success banner) · test-result-error(live-5: error banner confirmed) · connecting-spinner(source: OAuth redirect flow)_

---

### ADM-TAX-04 — StateWithholdingDialogComponent

**Source:** `state-withholding-dialog.component.ts:1-127` · `state-withholding-dialog.component.html:1-110` · trigger: `compliance-templates-panel.component.ts:87,102-104` + `compliance-templates-panel.component.html:65`

**Trigger location RESOLVED** (ADM-Q-021 closed from source): Opened from **ComplianceTemplatesPanelComponent** (`/admin/compliance` tab), not from sales-tax. Two trigger paths:
1. Button click: `compliance-templates-panel.component.html:65` — icon button beside the state withholding section header
2. Auto-open: `compliance-templates-panel.component.ts:87` — opens on init when state data is present

**Purpose:** Admin selects the company's home state for payroll withholding; sets `company_state` system setting. Read-only state catalog view (admin picks, doesn't edit).

**Content structure** (source: `state-withholding-dialog.component.html`):

| Section | filter condition | state-card shows |
|---|---|---|
| Summary header | — | 4 stat chips: ready / needs-upload / uses-W4 / no-tax counts |
| "Ready for e-Sign" | `category=state_form` AND `docuSealTemplateId ≠ null` | code · name · formName · `verified` chip |
| "Needs PDF Upload" | `category=state_form` AND `docuSealTemplateId = null` | code · name · formName · `upload_file` chip |
| "Accepts Federal W-4" | `category=federal` | code · name · `description` chip |
| "No Income Tax" | `category=no_tax` | code · name · `block` chip |

Each state card is a `<button>` that fires `selectState(state.code)` → `adminService.setCompanyState()` → closes dialog on success. Active state card styled with `.state-card--active` class.

_States: loading(source: appLoadingBlock directive) · populated(source-confirmed structure; D4-terminal: trigger requires compliance template configured + auto-open fires on init) · saving(source: button [disabled]="saving()")_

---

### ACC-SEC-02 — MfaSetupDialogComponent step sequence

**Source:** `mfa-setup-dialog.component.ts:25-89` · `mfa-setup-dialog.component.html:1-91`

**Step signal:** `step = signal<'loading' | 'scan' | 'verify' | 'complete'>('loading')`

_Note: `verify` is a declared union type but `this.step.set('verify')` is never called in the component — it's effectively unused. The actual flow is `loading → scan → [API call] → complete` (or stays on `scan` with error message on bad code)._

| step | what renders | actions |
|---|---|---|
| `loading` | spinner + "Preparing authenticator setup…" | none (auto-advances on API response) |
| `scan` | QR code (`app-qr-code`, 200px, M error correction) · manual key toggle (show/hide + copy button) · 6-digit code input field (`app-input`, maxlength=6, pattern `/^\d{6}$/`) · error message div (if verifyError signal set) | Cancel · **Verify & Enable** (disabled when code invalid or verifying) |
| `complete` | `verified_user` icon · "Two-Factor Authentication Enabled" heading · "You'll need your authenticator app each time you sign in." · recovery-codes hint with `info` icon | **Done** (closes dialog, returns `true` to caller) |

**Error path on `scan` step:** invalid code → `verifyError.set('Invalid code. Please try again.')` + `codeControl.reset()` — stays on `scan` step.

**Dialog close behavior:** `dialogRef.close(this.step() === 'complete')` — returns `true` only if enrollment completed; `false` on cancel/error. Caller (`AccountSecurityComponent`) uses the result to refresh MFA status.

_States: loading(source-confirmed spinner) · scan-qr(live-4: QR code + manual key toggle + 6-digit code input confirmed) · scan-verify-error(source-confirmed error path) · complete(source-confirmed; D3-terminal: full flow requires TOTP app + enrollment completion)_

---

### ACC-TAX-03 — ComplianceFormRendererComponent dispatch model

**Source:** `compliance-form-renderer.component.ts:1-301` · `compliance-form-definition.model.ts:1-128`

**Dispatch architecture:** `AccountTaxFormDetailComponent` loads a `ComplianceFormDefinition` from the API (keyed by `formType` slug) and passes it to `<app-compliance-form-renderer [definition]="def">`. The renderer is form-type-agnostic — all layout and fields come from the definition JSON.

**ComplianceFormDefinition structure:**
- `formType` — slug used to fetch (e.g., `'w4'`, `'i9'`, `'state'`, `'dynamic'`)
- `formLayout` — `'default'` (Material wrappers) | `'government'` (IRS-style native rendering, pixel-matched to PDF)
- `pages[]` — multi-page forms (each page → one tab/nav step)
- `sections[]` — flat legacy (wrapped into single page)
- `maxWidth` — optional centering (W-4 uses `"850px"`)
- `formStyles` — CSS custom-property overrides from PDF extraction metrics

**Field types** (source: `FormFieldDefinition.type`):
`text | textarea | number | currency | ssn | date | select | radio | checkbox | signature | heading | paragraph | html`

**Government-layout field roles** (`fieldLayout`):
`amount-line | amount-line-inner | amount-line-total | grid-cell | checkbox-dots | signature-field | signature-date | filing-status | worksheet-line`

**Section layout types** (government forms):
`default | section | form-header | step | step-amounts | tip | exempt | sign | employers-only | form-footer | worksheet | instructions`

**Conditional fields:** `dependsOn: { field, value, operator: 'eq'|'neq'|'truthy' }` — `shouldShowField()` evaluated on every render.

**Special behaviors:**
- SSN fields: auto-formatted `XXX-XX-XXXX` via `formatSsn()` handler
- `signature-date` fields: auto-set to today's date if `initialData` doesn't provide one
- Multi-page: single FormGroup spans all pages (source: `compliance-form-renderer.component.ts:158`) — validation runs across all pages simultaneously
- Submit only available on last page (`isLastPage` computed)

**Known form types confirmed from backend/templates** (source: compliance-templates-panel + account-tax-form-detail route):
- `w4` — Federal W-4 (IRS 2024 revision), `government` layout, multi-step (5 steps + worksheet)
- `i9` — I-9 Employment Eligibility, `government` layout, multi-page (Section 1 employee / Section 2 employer)
- State forms — per-state; some `government` layout (CA DE 4, NY IT-2104); formType slug = state code or form number
- Dynamic forms — admin-created via ComplianceTemplatesPanelComponent; typically `default` layout

_States: populated-default-layout(source-confirmed Material rendering) · populated-government-layout(source-confirmed IRS-style rendering) · readonly-mode(source: `readonly` input) · multi-page-nav(source: `pages.length > 1`) · single-page(source: sections-only fallback) · all-live(D4-terminal: no compliance form definitions configured)_

---

### ADM-DISC-01 — Discovery wizard question catalog & branch map

**Source:** `DiscoveryQuestionCatalog.cs:1-586` · `discovery.service.ts:50-131` · `discovery-question.model.ts`

**Total catalog:** 28 self-serve + 12 consultant-deepdive = 40 questions

**Per-user flow (self-serve, products path):** Q-S1 + 6 opening + 4 branch (one of A/B/C) + 2 override + 6 diagnostic + 1 exit = ~20 questions answered. User sees only their branch's 4 questions.

**Q-S1 — Top-of-funnel (SingleChoice):** "What does your business primarily sell?"
- `products` → full 22-question manufacturing flow
- `services` → short-circuit to PRESET-08 (Pro Services)
- `both` → short-circuit to PRESET-09 (Hybrid)

**Opening questions Q-O1..Q-O6:**

| ID | type | question (abbreviated) | choices / notes |
|---|---|---|---|
| Q-O1 | Bucketed | "Roughly how many people work in your business?" | 1-2 · 3-10 · 11-25 · 26-50 · 51-200 · 200+ |
| Q-O2 | FreeText | "Walk me through quote-to-cash…" | optional textarea |
| Q-O3 | MultiChoice | "What does your business actually do?" | services · make · resell |
| Q-O4 | MultiChoice | "Are you in a regulated industry?" | no · medical · aerospace · automotive · food · pharma · other |
| Q-O5 | SingleChoice | "How many physical locations?" | 1 · 2 · 3+ |
| Q-O6 | FreeText | "If an auditor walked in tomorrow…" | optional textarea |

**Branch routing** (source: `discovery.service.ts:50-88`):

| headcount answer | sites answer | → branch |
|---|---|---|
| 1-2, 3-10, 11-25 | any | A (small) |
| 26-50, 51-200 | 1 | B (mid) |
| 26-50, 51-200 | 2 or 3+ | C (large/multi-site) |
| 200+ | any | C (large) |

**Branch A questions (Q-A1..Q-A4):**

| ID | type | question (abbreviated) | choices |
|---|---|---|---|
| Q-A1 | SingleChoice | "Do you currently use accounting software?" | none · quickbooks · xero · other |
| Q-A2 | SingleChoice | "Is anyone full-time on production scheduling?" | same-person · split-roles · dedicated |
| Q-A3 | SingleChoice | "Single machine or multi-step?" | single-step · two-three · multi-step |
| Q-A4 | SingleChoice | "Shipped from warehouse or drop-ship?" — _SKIPPED if mode='production'_ | warehouse · some-dropship · mostly-dropship |

**Branch B questions (Q-B1..Q-B4):**

| ID | type | question (abbreviated) | choices |
|---|---|---|---|
| Q-B1 | SingleChoice | "Do you compare actual vs quoted job cost?" | no · informal · formal |
| Q-B2 | SingleChoice | "Formal inspection / NCR?" | visual · informal · formal-ncr · capa-loop |
| Q-B3 | YesNo | "PO approval step for large amounts?" | yes · no |
| Q-B4 | YesNo | "Send out to subcontract (heat treat, plating)?" | yes · no |

**Branch C questions (Q-C1..Q-C4):**

| ID | type | question (abbreviated) | choices |
|---|---|---|---|
| Q-C1 | SingleChoice | "How often do you move inventory between locations?" | daily · weekly · monthly · rarely |
| Q-C2 | SingleChoice | "Fixed or configurable products?" | fixed · some-config · cto-eto |
| Q-C3 | YesNo | "Customers require EDI (850/855/856/810)?" | yes · no |
| Q-C4 | YesNo | "Multi-currency operations?" | yes · no |

**Override questions Q-V1, Q-V2 (always shown):**

| ID | type | question (abbreviated) |
|---|---|---|
| Q-V1 | FreeText | "Worst thing a regulator/customer could ask you to prove?" |
| Q-V2 | FreeText | "Anything unusual about how your business runs?" |

**Diagnostic questions Q-D1..Q-D6 (always shown):**

| ID | type | question (abbreviated) | choices |
|---|---|---|---|
| Q-D1 | MultiChoice | "How do you track parts for traceability?" | lots · serials |
| Q-D2 | YesNo | "Handle hazardous materials?" | yes · no |
| Q-D3 | SingleChoice | "Preventive maintenance schedule?" | breakfix · informal-pm · formal · iot |
| Q-D4 | MultiChoice | "Shop-floor access patterns?" | kiosk · shifts |
| Q-D5 | MultiChoice | "IT/integration capability?" | none · bi · chat · api |
| Q-D6 | SingleChoice | "Repeat vs custom production?" | repeat · mix · custom |

**Exit Q-X1 (always available):**
- YesNo: "None of these match — skip discovery and configure manually." Also triggered by "Skip discovery" link and `exitToCustom()` button throughout wizard.

**Recommendation step** (step index = `visibleQuestions().length`):
- Displays: preset name, description, confidence label (high/medium/low), rationale, driving factors (expandable), capability deltas list (enable/disable), alternatives picker
- Actions: Back · Apply (opens PresetApplyDialogComponent for review+confirm)
- Live recommendation sidebar updates after Q-O1+Q-O3 answered (`canPreview` signal)

**Consultant mode** (toggled by button in progress bar):
- Adds 12 deepdive questions (4 per branch: Q-A5..Q-A8, Q-B5..Q-B8, Q-C5..Q-C8)
- All YesNo or SingleChoice; each targets a specific capability gap signal

_States: loading(source: appLoadingBlock) · question-bucketed/single-choice/yesno/multichoice/freetext (Q-S1 live-5; Q-S2..Q-S16 source-confirmed per type) · recommendation(source-confirmed structure; D4-terminal: requires completing all wizard questions) · empty-recommendation(source: "Answer the opening questions" sidebar)_

---

---

### ADM-RTPL-02 — RoleTemplatesPanelComponent NEW/EDIT TEMPLATE dialog

**Source:** `role-templates-panel.component.ts:63-66`

| field | type | validators | default | notes |
|---|---|---|---|---|
| `name` | text | required, max100 | '' | — |
| `description` | textarea | max500 | '' | Optional |
| `includedRoleNames` | multi-select | required | [] | Base roles to bundle; options from `roleOptions` signal |

Title/button: "New Role Template"/"Create Template" vs "Edit Role Template"/"Save Changes".

_States: new-dialog(live-5: Name/Description/Included Roles confirmed) · edit-dialog(source-confirmed: pre-fills all fields)_

---

### ADM-ANN-02 — AnnouncementsPanelComponent — NEW ANNOUNCEMENT + NEW TEMPLATE dialogs

**Source (NEW ANNOUNCEMENT):** `features/chat/components/create-announcement-dialog/create-announcement-dialog.component.ts:51-60` — chat-owned, invoked by `announcements-panel.component.ts:155`.

| field | type | validators | default | notes |
|---|---|---|---|---|
| `templateId` | select (opt) | — | null | Pre-fills content/severity/scope/ack from template |
| `title` | text | required, max200 | '' | — |
| `content` | textarea | required, max5000 | '' | — |
| `severity` | select | required | `Info` | Info · Warning · Critical |
| `scope` | select | required | `CompanyWide` | CompanyWide · SelectedTeams · IndividualTeam · TeamLeadsOnly |
| `requiresAcknowledgment` | toggle | — | false | — |
| `expiresAt` | datepicker | — | null | Optional expiry |
| `targetTeamIds` | multi-select | — | [] | Visible only when scope = SelectedTeams or IndividualTeam |

**Source (NEW TEMPLATE):** `announcements-panel.component.ts:95-100`

| field | type | validators | default | notes |
|---|---|---|---|---|
| `name` | text | required, max200 | '' | — |
| `content` | textarea | required, max5000 | '' | — |
| `defaultSeverity` | select | required | `Info` | Info · Warning · Critical |
| `defaultScope` | select | required | `CompanyWide` | CompanyWide · SelectedTeams · IndividualTeam · TeamLeadsOnly |
| `defaultRequiresAcknowledgment` | toggle | — | false | — |

_States: new-announcement-dialog(live-5: Template/Title/Content/Severity/Scope/ExpiresAt/Ack confirmed) · new-template-dialog(live-5: Name/Content/DefaultSeverity/DefaultScope/DefaultAck confirmed)_

---

### ADM-LS-01 — LeadSourcesComponent NEW/EDIT dialog

**Source:** `lead-sources.component.ts:74-78`

| field | type | validators | default | notes |
|---|---|---|---|---|
| `name` | text | required, max100 | '' | — |
| `code` | text | required, max50, `^[a-z0-9_-]+$` | '' | **Disabled on edit** — immutable after create |
| `description` | textarea | max500 | '' | — |
| `isActive` | toggle | — | true | **Edit-only** — hidden on create |

_States: new-dialog(live-5: Name/Code/Description confirmed) · edit-dialog(source-confirmed: code disabled, isActive visible)_

---

### ADM-EDI-02 — EdiPanelComponent NEW/EDIT PARTNER dialog

**Source:** `edi-panel.component.ts:115-124` · `edi-panel.component.html:94-121`

| field | type | validators | default | notes |
|---|---|---|---|---|
| `name` | text | required, max200 | '' | — |
| `qualifierId` | text | required, max10 | `'ZZ'` | EDI ISA qualifier ID |
| `qualifierValue` | text | required, max100 | '' | ISA qualifier value |
| `defaultFormat` | select | — | `X12` | X12 · Edifact |
| `transportMethod` | select | — | `Manual` | As2 · Sftp · Van · Email · Api · Manual |
| `autoProcess` | toggle | — | true | Auto-process inbound |
| `requireAcknowledgment` | toggle | — | true | Require 997/CONTRL ACK |
| `notes` | textarea | — | '' | — |

_States: new-dialog(live-5: Name/QualifierId/QualifierValue/Format/Transport/AutoProcess/RequireAck/Notes confirmed) · edit-dialog(source-confirmed: pre-filled)_

---

### ADM-ICR-01 — IcpRubricsComponent NEW/EDIT RUBRIC dialog

**Source:** `icp-rubrics.component.ts:74-80,129-137`

**Top-level:** name(req/max100), description(max500), isActive(toggle/true), isDefault(toggle/false).

**Dimensions FormArray** (inline add/remove via `addDimension()` / `removeDimension(index)`):

| field | type | validators | notes |
|---|---|---|---|
| `fieldKey` | text | required, max80 | Internal key |
| `label` | text | max120 | Display label |
| `matchSpec` | textarea | max500 | Matching criteria |
| `weight` | number | required | Score weight |

_States: new-dialog(live-5: Name/Description/Active/Default confirmed; dimensions FormArray source-confirmed) · edit-dialog(source-confirmed: pre-filled + existing dimensions)_

---

### ADM-CUR-02 / ADM-CUR-03 — CurrencyDialogComponent + ExchangeRateDialogComponent

**Source (Currency):** `currency-dialog.component.ts:33-41` — code(req/`^[A-Z]{3}$`), name(req/max80), symbol(req/max8), decimalPlaces(req/0-8/default 2), isBaseCurrency(toggle), isActive(toggle/**edit-only**), sortOrder(req/default 100).

**Source (ExchangeRate):** `exchange-rate-dialog.component.ts:36-41` — fromCurrencyId(req/select), toCurrencyId(req/select), rate(req/min 0.0000001/4dp), effectiveDate(req/today). Custom validator (ts:55): rejects same-pair.

_States (Currency): new-dialog(live-5: ISO code/Symbol/Name/Decimal places/Sort order/Base currency confirmed) · edit-dialog(source-confirmed: isActive shown)_
_States (ExchangeRate): source-confirmed (fromCurrencyId/toCurrencyId/rate/effectiveDate; same-pair error) · D4-terminal: requires ≥2 currencies in env_

---

### ADM-TRN-04 — TrainingPathDialogComponent

**Source:** `training-path-dialog.component.ts:43-52,65-69` — title(req/max200), slug(auto-gen from title), description(max500), icon(max50/`'school'`), isAutoAssigned(toggle/false), isActive(toggle/true). Draft auto-save: `entityType='training-path'`.

_States: new-dialog(live-5: Title/Slug/Description/Icon/Auto-assign/Active confirmed; CANCEL · CREATE PATH) · edit-dialog(source-confirmed: pre-filled)_

---

### ADM-TRN-08 / ADM-TRN-09 — TrainingDetailPanelComponent + TrainingDetailDialogComponent

**Source:** `training-detail-panel.component.ts:25-36,47-69` · `training-detail-dialog.component.ts:16-19`

Both **READ-ONLY** — no form controls. `TrainingDetailDialogComponent` is a thin wrapper passing `userId` to `<app-training-detail-panel>`. Panel fetches `UserTrainingDetail` via `TrainingService`, renders completion status icons/classes, emits `closed`. Trigger: row expand/click in `/admin/training` CONTENT tab. ADM-Q-022 RESOLVED from source.

_States: loading(inferred) · populated(source: status icons) · empty(D4-terminal: non-seeded env — no enrolled users; read-only display)_

---

_Cycle 7 (source extraction): 9 queue items resolved — ADM-Q-002/003/004/005/006/008/009/010/022. Fields pre-extracted for: RoleTemplatesDialog, LeadSourcesDialog, CreateAnnouncementDialog (chat-owned, invoked by announcements-panel), AnnouncementTemplateDialog, EdiPartnerDialog, IcpRubricsDialog (dimensions FormArray), CurrencyDialog, ExchangeRateDialog (same-pair validator), TrainingPathDialog. TrainingDetailPanel+Dialog confirmed read-only. 9 items dequeued in admin-queue.md. Live-dependent remaining: ADM-Q-007/013/014/015/016/017/018/019/020 (9 items)._


_Cycle 6 (ui-scout live sweep): 61/66 routes live-confirmed across 4 sweep batches (admin-a/b/c/d-results.json). 5 routes remain open — see `admin-queue.md` ADM-Q-007/Q-011/Q-014/Q-015/Q-016/Q-018/Q-019/Q-020. Bug confirmed live: Manager lands on /admin/users without redirect (ADM-Q-012; source at admin.component.ts:97-99). New discovery: /account/tax-forms/:formType routes all redirect to /onboarding (7-step wizard); onboarding step 1 confirmed (First Name · Middle Name · Last Name · Other Last Names · DOB · SSN · Email · Phone). Cap gates confirmed live: CAP-EXT-EMAIL-SYNC OFF · CAP-EXT-VOIP-SYNC OFF · CAP-EXT-AI-ASSISTANT OFF (API error mode; dialog still opens). Key states updated in this cycle: ADM-SH-01 (tab shell + Manager view) · ADM-USR-03 (create/edit dialog fields) · ADM-TRN-03 (module dialog) · ADM-AI-03 (assistant dialog) · ADM-BI-02 (ISSUE KEY dialog) · ADM-TC-02 (correction edit dialog) · ADM-EVT-02 (new event dialog) · ADM-CMP-03 (compliance template dialog) · ADM-DISC-01 (Q-S1 live) · ADM-PRE-02 (zero-selected state) · ACC-SEC-02 (MFA setup step 1) · SI-01 (confirmed redirect). ~69 TODO states remain in component table (account/employees/training/other admin panels) — queued for next live-sweep cycle._

_Cycle 8 (source-cataloger): Tree 1 ticks — /admin/capabilities/:id (ADM-Q-007 confirmed cycle 5) + /account/communications/oauth-callback (ADM-Q-015 confirmed live by ui-scout). SI-01 first-run state closed D3-terminal. ADM-Q-015 dequeued (D3-terminal classification withdrawn — component renders regardless of CAP-EXT-EMAIL-SYNC). Source-flip: ADM-TRN-04 (TrainingPathDialog fields sourced), ADM-TAX-04 (StateWithholdingDialog 4-category structure sourced), ADM-BI-01 (tab shell renders confirmed). 3 Tree 1 items remain open: /account/tax-forms/:formType · /training/module/:id · /training/path/:id._

## Backend Gaps (observed, one-line)

- **set-default 500:** `POST /api/v1/working-calendars/:id/set-default` returns HTTP 500 — unique `is_default` constraint violation; non-atomic default swap; full-stack analysis deferred.

---

_Cycle 9 (source-cataloger): Tree 1 fully ticked — all 66 routes [x]. Final 3 routes closed: /account/tax-forms/:formType (D4-terminal: w4/i9 redirect confirmed; steps 2-7 source-confirmed; state/w9 loading-only), /training/module/:id + /training/path/:id (initially marked D3-terminal — corrected cycle 10). All remaining TODO/LIVE TODO states converted: 32 component rows updated to D3/D4-terminal or live-confirmed. §Source-Extracted Detail LIVE TODO lines all resolved. Stale cycle-2 TODO count corrected. Queue: 18 items closed this cycle; ADM-Q-040 (KIOSK sub-tab) remains open pending scout relay. ACC-ITGR-02 + ADM-CUR-03 propagated from resolved queue items._

_Cycle 10 (source-cataloger + scout final fold-in): (1) Training route reclassification: /training/module/:id and /training/path/:id corrected from D3-terminal to not-found-error(live-10) + populated(D4-terminal) — cap gate is API-level only; UI shell accessible cap-OFF; no 403/redirect/banner on navigation. TRN-01/MOD-01/MOD-02/PATH-01 states corrected accordingly. (2) ADM-WC-01 updated with full right-panel structure (Edit form/Holidays table/Shifts); ADM-WC-03 NEW ROW added (shifts cluster: name/startTime/endTime/premiumMultiplier/capacityHours/isActive — source ts:98-105; live-10 confirmed). (3) ADM-TEAM-02 updated: KIOSK sub-tab live-10 confirmed — 1 terminal "Kiosk-1"; columns Terminal Name/Team/Device Token/actions. (4) ADM-TRN-07 updated with source-confirmed progressColumns (displayName/role/totalEnrolled/totalCompleted/overallCompletionPct/lastActivityAt/detail). (5) BE gap noted: POST /api/v1/working-calendars/:id/set-default → HTTP 500 (non-atomic default swap). (6) Queue: ADM-Q-040 struck (KIOSK live-10 confirmed); Q-018/019/037 dequeue notes corrected. Queue now EMPTY. Reconciliation: Tree 1 ✓ all 66 ticked · Tree 2 ✓ all states resolved · Tree 3 ✓ · Queue ✓ DRAINED · PHASE COMPLETE._


---

## §F — Access & Edge Region

_Folded-in verbatim from `analysis/inventory/access.md`. Sole-writer cataloger content preserved as-is._

# Phase 06 — Access & Edge Region Inventory

**Git SHA:** `c1098debe9560ae05d84ffa4a16674a6db1b8c26`
**Commit:** `inventory(admin): cycle 10 — final fold-in, phase complete`
**Phase start:** 2026-05-23
**Sole writer:** source-cataloger agent

---

## Terminal-state taxonomy (verbatim from phase 05)

| code | meaning |
|------|---------|
| `live-confirmed` | Observed and verified in the running app |
| `source-confirmed` | Present in source; not yet live-verified |
| `D3-terminal` | Capability gate OFF — component exists but cap not enabled; gate noted |
| `D4-terminal` | Populated-blocked: non-seeded — route/component reached but no data to populate |

---

## Scope boundary

**IN scope:** auth (login, setup, MFA-challenge, invite-token setup), user-side MFA enrollment (`/account/security`), onboarding wizard, setup-integrations wizard, customer portal (`/portal/*`), mobile (`/m/*`), AI assistant runtime (`/ai/*`), headless form render (`/__render-form`), dev-tools (`/dev-tools/*`).

**OUT of scope (cross-ref admin.md):** Admin-side MFA policy config, AI-assistant admin config panel, capability toggles, EDI, presets — those are inventoried in `admin.md`.

**Checked and excluded:** `features/worker/worker.component.ts` (`/worker` route, authGuard) — background task-queue viewer (WorkerService/WorkerTask); operational/infra surface, not part of the access & edge region definition. `features/welcome/welcome.component.ts` (`/welcome`, demoOnlyGuard) — demo-only landing; not reachable in non-demo stack.

**Note — password reset:** No standalone password-reset route exists in the app. In-app password change is on `/account/security`; passwordless flows use invite tokens (`/setup/:token`). Scope item "password reset" closes against these two surfaces.

---

## Source-map checklist (reconcile to zero)

### features/auth
- [x] `auth/login.component.ts` — LoginComponent
- [x] `auth/mfa-challenge.component.ts` — MfaChallengeComponent (embedded child of login)
- [x] `auth/setup.component.ts` — SetupComponent (first-run org setup)
- [x] `auth/token-setup.component.ts` — TokenSetupComponent (invite/password-set via token)
- [x] `auth/sso-callback.component.ts` — SsoCallbackComponent

### features/account (security sub-page + shell — remainder out of scope)
- [x] `account/account-layout.component.ts` — AccountLayoutComponent (parent shell for all /account/* pages; renders sidebar + router-outlet)
- [x] `account/components/account-sidebar/account-sidebar.component.ts` — AccountSidebarComponent (left-nav with profile/contact/emergency/security/communications/etc. links; imported by AccountLayoutComponent)
- [x] `account/pages/security/account-security.component.ts` — AccountSecurityComponent
- [x] `account/components/mfa-setup-dialog/mfa-setup-dialog.component.ts` — MfaSetupDialogComponent
- [x] `account/components/mfa-recovery-codes-dialog/mfa-recovery-codes-dialog.component.ts` — MfaRecoveryCodesDialogComponent
- [x] `account/components/compliance-form-renderer/compliance-form-renderer.component.ts` — ComplianceFormRendererComponent (dynamic compliance-form renderer; used by HeadlessFormRenderComponent + onboarding review phase)

### features/setup-integrations
- [x] `setup-integrations/setup-integrations.component.ts` — SetupIntegrationsComponent

### features/onboarding
- [x] `onboarding/onboarding-wizard.component.ts` — OnboardingWizardComponent (steps 0–6 + review)
- [x] `onboarding/onboarding.service.ts` — service (no component)
- [x] `onboarding/onboarding.routes.ts` — routes (no component)

### features/portal
- [x] `portal/portal-layout.component.ts` — PortalLayoutComponent
- [x] `portal/pages/portal-login.component.ts` — PortalLoginComponent
- [x] `portal/pages/portal-auth-callback.component.ts` — PortalAuthCallbackComponent
- [x] `portal/pages/portal-dashboard.component.ts` — PortalDashboardComponent
- [x] `portal/pages/portal-orders.component.ts` — PortalOrdersComponent
- [x] `portal/pages/portal-quotes.component.ts` — PortalQuotesComponent
- [x] `portal/pages/portal-invoices.component.ts` — PortalInvoicesComponent
- [x] `portal/pages/portal-shipments.component.ts` — PortalShipmentsComponent
- [x] `portal/services/portal.guard.ts` — portalAuthGuard (no component)
- [x] `portal/services/portal.service.ts` — service (no component)
- [x] `portal/portal.routes.ts` — routes (no component)

### features/mobile
- [x] `mobile/mobile-layout.component.ts` — MobileLayoutComponent
- [x] `mobile/pages/mobile-clock.component.ts` — MobileClockComponent
- [x] `mobile/pages/mobile-jobs.component.ts` — MobileJobsComponent
- [x] `mobile/pages/mobile-job-detail.component.ts` — MobileJobDetailComponent
- [x] `mobile/pages/mobile-scan.component.ts` — MobileScanComponent
- [x] `mobile/pages/mobile-hours.component.ts` — MobileHoursComponent
- [x] `mobile/pages/mobile-chat.component.ts` — MobileChatComponent
- [x] `mobile/pages/mobile-chat-thread/mobile-chat-thread.component.ts` — MobileChatThreadComponent
- [x] `mobile/pages/mobile-chat-channel-info/mobile-chat-channel-info.component.ts` — MobileChatChannelInfoComponent
- [x] `mobile/pages/mobile-notifications.component.ts` — MobileNotificationsComponent
- [x] `mobile/pages/mobile-account.component.ts` — MobileAccountComponent
- [x] `mobile/pages/mobile-home.component.ts` — MobileHomeComponent (**UNROUTED** — exists in source + spec, not in mobile.routes.ts; orphan/dead)
- [x] `mobile/mobile.routes.ts` — routes (no component)
- [x] `mobile/services/mobile-clock-state.service.ts` — service (no component)

### features/ai
- [x] `ai/ai.component.ts` — AiComponent
- [x] `ai/ai.routes.ts` — routes (no component)

### features/render — headless PDF
- [x] `render/headless-form-render.component.ts` — HeadlessFormRenderComponent
- [x] `render/render.routes.ts` — routes (no component)

### shared — render (3D)
- [x] `shared/components/stl-viewer/stl-viewer.component.ts` — StlViewerComponent (three.js WebGL STL viewer; this phase's "render (3D)" scope item; hosted in parts surfaces — cross-ref parts region)

### features/dev-tools
- [x] `dev-tools/loading-demo.component.ts` — LoadingDemoComponent
- [x] `dev-tools/dev-tools.routes.ts` — routes (no component)

### shared — guards in scope
- [x] `shared/guards/auth.guard.ts` — authGuard
- [x] `shared/guards/setup.guard.ts` — setupRequiredGuard + setupCompleteGuard
- [x] `shared/guards/mobile-redirect.guard.ts` — mobileRedirectGuard
- [x] `shared/guards/demo-only.guard.ts` — demoOnlyGuard (not a page — blocks non-demo)
- [x] `shared/guards/root-redirect.guard.ts` — rootRedirectGuard (not a page)

### shared — components used by access-region surfaces (to confirm usage, not re-inventory)
- [x] `shared/components/input/input.component.ts` — used by login, mfa-challenge, setup, token-setup, account-security, portal-login, mfa-setup-dialog
- [x] `shared/components/validation-button/validation-button.component.ts` — used by login, mfa-challenge, setup, token-setup, account-security
- [x] `shared/components/empty-state/empty-state.component.ts` — used by portal-orders, portal-quotes, portal-invoices, portal-shipments, mobile-jobs, mobile-notifications
- [x] `shared/components/qr-code/qr-code.component.ts` — used by mfa-setup-dialog (TOTP QR display)
- [x] `shared/components/dialog/dialog.component.ts` — used by mfa-setup-dialog, mfa-recovery-codes-dialog
- [x] `shared/components/address-form/address-form.component.ts` — used by setup.component (org address field)
- [x] `shared/components/avatar/avatar.component.ts` — used by mobile-account, mobile-chat-thread, mobile-chat-channel-info, mobile-notifications
- [x] `shared/directives/loading-block.directive.ts` — used by portal-dashboard, portal-orders, portal-quotes, portal-invoices, portal-shipments, mobile-clock, mobile-jobs, mobile-hours
- [x] `shared/components/confirm-dialog/confirm-dialog.component.ts` — used by account-security (remove MFA device), mobile-chat-channel-info (leave channel)
- [x] `shared/components/page-header/page-header.component.ts` — used by dev-tools/loading-demo
- [x] `shared/components/select/select.component.ts` — used by onboarding-wizard (filing-status, state, account-type dropdowns)
- [x] `shared/components/datepicker/datepicker.component.ts` — used by onboarding-wizard (DOB, start-date, expiry fields)
- [x] `shared/components/toggle/toggle.component.ts` — used by onboarding-wizard (boolean flags)
- [x] `shared/components/currency-input/currency-input.component.ts` — used by onboarding-wizard (Step 6 deposit amounts)
- [x] `shared/components/dynamic-form/dynamic-qb-form-control.component.ts` — used by compliance-form-renderer (dynamic field rendering in headless render + onboarding review)

---

## Route table (all in-scope routes)

| route | component | guard | shell |
|-------|-----------|-------|-------|
| `/login` | LoginComponent | setupCompleteGuard | bare |
| `/sso/callback` | SsoCallbackComponent | none | bare |
| `/setup` | SetupComponent | setupRequiredGuard | bare |
| `/setup/:token` | TokenSetupComponent | none | bare |
| `/setup/integrations` | SetupIntegrationsComponent | authGuard | bare |
| `/onboarding` | OnboardingWizardComponent | authGuard + mobileRedirectGuard | employee app |
| `/account/*` | AccountLayoutComponent + AccountSidebarComponent | authGuard + mobileRedirectGuard | account layout (shell) |
| `/account/security` | AccountSecurityComponent | authGuard + mobileRedirectGuard | account layout |
| `/portal/login` | PortalLoginComponent | none | portal-less |
| `/portal/auth/callback` | PortalAuthCallbackComponent | none | portal-less |
| `/portal/dashboard` | PortalDashboardComponent | portalAuthGuard | PortalLayout |
| `/portal/orders` | PortalOrdersComponent | portalAuthGuard | PortalLayout |
| `/portal/quotes` | PortalQuotesComponent | portalAuthGuard | PortalLayout |
| `/portal/invoices` | PortalInvoicesComponent | portalAuthGuard | PortalLayout |
| `/portal/shipments` | PortalShipmentsComponent | portalAuthGuard | PortalLayout |
| `/m/clock` | MobileClockComponent | authGuard | MobileLayout |
| `/m/jobs` | MobileJobsComponent | authGuard | MobileLayout |
| `/m/jobs/:jobId` | MobileJobDetailComponent | authGuard | MobileLayout |
| `/m/scan` | MobileScanComponent | authGuard | MobileLayout |
| `/m/time` | MobileHoursComponent | authGuard | MobileLayout |
| `/m/chat` | MobileChatComponent | authGuard | MobileLayout |
| `/m/chat/thread/:messageId` | MobileChatThreadComponent | authGuard | MobileLayout |
| `/m/chat/channel-info/:channelId` | MobileChatChannelInfoComponent | authGuard | MobileLayout |
| `/m/notifications` | MobileNotificationsComponent | authGuard | MobileLayout |
| `/m/account` | MobileAccountComponent | authGuard | MobileLayout |
| `/ai/:assistantId` | AiComponent | authGuard + mobileRedirectGuard | employee app |
| `/__render-form` | HeadlessFormRenderComponent | none | bare (no chrome) |
| `/dev-tools/loading` | LoadingDemoComponent | none (any auth) | employee app |

---

## Component inventory table

> Status codes: **SC** = source-confirmed · **LC** = live-confirmed · **D3** = cap-gated-OFF · **D4** = populated-blocked/non-seeded

### AUTH region

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| LoginComponent | page | `/login` | `features/auth/login.component.ts:30` | all (public) | loading, populated, error | Email+password login form; Forge MES/MRP/ERP marquee logo; email field, password field (show/hide toggle), validation-button (violation badge), "SIGN IN" button; "HAVE A SETUP CODE?" link below; already-authenticated panel (account_circle + Go-to-Dashboard / Sign-Out buttons). **Inline SSO section** (no separate component): `ssoProviders` signal loaded from `AuthService.getSsoProviders()` at line 81; renders SSO provider buttons only when `ssoProviders().length > 0` — **D3-terminal on this stack** (Q-006-CLOSED: no SSO providers configured; gate: admin SSO provider setup). | **LC** (screenshot: access-login-unauthenticated.png, access-login-already-authenticated.png) |
| MfaChallengeComponent | panel | `/login` (embedded) | `features/auth/mfa-challenge.component.ts:19` | MFA-enabled users | loading, populated, error | Inline TOTP/recovery-code challenge after credential verify; 6-digit code input, remember-device checkbox, Verify button; "Use a recovery code instead" toggle; Back to login cancel; embedded in LoginComponent, not a separate route. Source-confirmed states: loading (fetching challenge from server), populated (TOTP input visible), recovery-code toggle (showRecovery signal), error (bad code snackbar). | **D3-terminal** — Q-007-CLOSED: TOTP wall; shared stack has no TOTP issuer configured → no user can enroll MFA → challenge not triggerable. Gate: admin TOTP issuer config. |
| SetupComponent | page | `/setup` | `features/auth/setup.component.ts:30` | public (first-run only) | populated | First-run org setup: company name, address, admin account; guarded by setupRequiredGuard (redirects to /login once complete) | **D4-terminal** (setupRequired=false; guard confirmed redirecting to /login — screenshot: access-setup-first-admin-redirected.png) |
| TokenSetupComponent | page | `/setup/:token` | `features/auth/token-setup.component.ts:27` | invited users (token required) | loading, populated, error | Invite-token account setup (set password, first-time login); also activated by `/setup/integrations` URL due to routing shadow (Q-001) | **LC** (error state live-confirmed with invalid token — screenshot: access-token-setup-error.png; "Invalid or expired setup code. Please contact your administrator." + error_outline icon) |
| SsoCallbackComponent | page | `/sso/callback` | `features/auth/sso-callback.component.ts:18` | SSO users | loading, error | Receives SSO redirect with `?sso_token=`; exchanges for session token via AuthService; on success navigates to app; on error/missing token shows TranslatePipe error message. Source-confirmed states: loading (processing token), error (invalid/missing sso_token param). | **SC (template) / LC (redirect behavior)** — cycle 5b: component redirects in all ngOnInit paths before template renders visibly; `sso-callback` CSS class never observed in headless DOM. Code-confirmed redirect paths (sso-callback.component.ts:31–42): no-params → /login (<300ms); `?error=sso_failed` → snackbar:36 (`auth.ssoFailed`) + /login (~1300ms); `?error=no_account` → snackbar:40 (`auth.noAccountFound`) + /login; `?sso_token=...` → handleSsoToken() + navigate-to-app. Template states (spinner + "Completing sign-in..." message) are **SC only** — ngOnInit fires immediate redirect in all code paths; never visible in headless. Error messages are snackbar-based (SC, not persistent template rendering). Screenshots: access-sso-callback-initial.png, access-sso-c5b-error-sso-failed-1300ms.png. **D3-terminal** for token-exchange success path: no SSO providers configured. Q-006-CLOSED. |

### ACCOUNT SECURITY (user-side MFA + password)

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| AccountLayoutComponent | page-shell | `/account/*` | `features/account/account-layout.component.ts:48` | all (authGuard) | populated | Account section shell: RouterOutlet for child pages + AccountSidebarComponent; wraps all /account/* routes. Renders for every visit to /account/security. | **LC** (renders on /account/security visit — sidebar + content area confirmed in access-account-security.png screenshot) |
| AccountSidebarComponent | panel | `/account/*` (sidebar) | `features/account/components/account-sidebar/account-sidebar.component.ts:37` | all (authGuard) | populated | Left-nav sidebar: profile-completion progress, nav links (profile/contact/emergency/security/communications/integrations/pay-stubs/tax-forms/documents/customization); active-link highlighting; uses EmployeeProfileService for completeness badge. | **LC** (visible in account-security screenshot; security nav link active) |
| AccountSecurityComponent | page | `/account/security` | `features/account/pages/security/account-security.component.ts:28` | all (authGuard) | loading, populated | 3-card grid: (1) Change Password — currentPassword + newPassword + confirmPassword + "CHANGE PASSWORD" button; (2) Kiosk PIN — PIN + confirmPin + "SET PIN" button; (3) Two-Factor Authentication — enabled/disabled state card, device list (deviceType icon + name + lastUsedAt + Default chip + remove btn), Add Device / New Recovery Codes / Disable MFA actions, policy-enforcement variant. No forgot-password link. | **LC** — screenshot: access-account-security.png; MFA card in "not enabled" state ("ENABLE TWO-FACTOR AUTHENTICATION" button visible); **password reset closed**: no standalone reset route and no forgot-password link on login page — change-password (requires currentPassword) + invite-token `/setup/:token` are the only password flows |
| MfaSetupDialogComponent | dialog | `/account/security` (dialog) | `features/account/components/mfa-setup-dialog/mfa-setup-dialog.component.ts:20` | all (authGuard) | loading, populated | TOTP MFA enroll: shows QR code (QrCodeComponent, TOTP URI displayed), TOTP code verify input, submit; opened via MatDialog from AccountSecurityComponent. | **D3-terminal** — Q-007-CLOSED: same TOTP wall; no TOTP issuer configured on shared stack → enrollment blocked. Gate: admin TOTP issuer config. |
| MfaRecoveryCodesDialogComponent | dialog | `/account/security` (dialog) | `features/account/components/mfa-recovery-codes-dialog/mfa-recovery-codes-dialog.component.ts:17` | MFA-enrolled users | loading, populated | View/regenerate TOTP recovery codes; opened via MatDialog from AccountSecurityComponent; only reachable after MFA is enrolled. | **D3-terminal** — Q-007-CLOSED: requires prior MFA enrollment → same TOTP wall. Gate: admin TOTP issuer config. |

### SETUP INTEGRATIONS

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| SetupIntegrationsComponent | page | `/setup/integrations` ⚠️ | `features/setup-integrations/setup-integrations.component.ts:56` | authGuard (Admin enforced internally) | loading, populated | Post-first-setup integrations wizard: card-per-integration (IntegrationStatus model:13) with Set up / Skip choices; grouped by category (Communications, Service, Shipping, Accounting); stats row (configured/remaining/skipped signals); "Set up now" deep-links to /admin/integrations; Finish emits `setup.integrations-wizard-completed` event. Source-confirmed: integrations signal:61, skipped signal:63. **Backend gap (one-liner):** `app.routes.ts` static route `setup/integrations` must be listed before `setup/:token` — current order lets the param route shadow it; fix: reorder in app.routes.ts. | **SC** — Q-001-CLOSED: component exists and is functional; reachable only via programmatic `router.navigate(['/setup/integrations'])` from post-admin setup flow, not via direct URL (routing shadow bug). |

### ONBOARDING

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| OnboardingWizardComponent | page | `/onboarding` | `features/onboarding/onboarding-wizard.component.ts:194` | all (authGuard; new hires) | loading, populated | 7-step employee onboarding driven by horizontal linear `[linear]="true"` mat-stepper; URL-param source-of-truth (?step=0..6, ?review=preview\|signing&formIdx=N); auto-saves draft to server. **Step breakdown (all source-confirmed in onboarding-wizard.component.ts):** Step 1 (idx 0) — personalForm:352 (name, DOB, SSN, phone, start-date, etc.); Step 2 (idx 1) — addressForm:373 (street, city, state, zip); Step 3 (idx 2) — w4Form:405 (filing status, multiple-jobs, deductions, extra withholding); Step 4 (idx 3) — stateForm:444 (state-specific fields); Step 5 (idx 4) — i9Form:461 (eligibility, document type, expiry, file upload); Step 6 (idx 5) — depositForm:537 (routing#, account#, account type); Step 7 (idx 6) — ackForm:555 (policy acknowledgment). **Review flow:** reviewPhase:294 signal ('idle'\|'preview'\|'signing'); PDF preview via compliance-form-renderer; DocuSeal signing embed via currentSigningUrl:298 + postMessage listener:782. | **LC (Steps 1–7)** — cycle 7 (sweep-c7-i9.mjs): filled Steps 1–4 then used Playwright `setInputFiles()` with minimal 1×1 PNG to satisfy I-9 `listAFileId` validator (uploaded to MinIO; upload-chip confirmed visible). Continue advanced through all 7 steps. Step 6 Direct Deposit rendered (**LC**: bankName/routingNumber/accountNumber/accountType fields filled; screenshots: access-c7-step6-init.png, access-c7-step6-filled.png). Step 7 Acknowledgments rendered (**LC**: workers-comp toggle clicked, submit btn visible; screenshots: access-c7-step7-init.png, access-c7-step7-filled.png, access-c7-step7-ack-toggled.png). All 7 stepper steps LC. Earlier cycle screenshots: access-onboarding-step2-address.png, access-onboarding-step3-w4.png, access-onboarding-step4-state-tax.png, access-c7-step5-i9-filled.png, access-c7-final.png. **DocuSeal review/signing phase: D4-terminal** — submit triggers review flow but DocuSeal integration not configured on non-seeded stack; signingUrl never returned (access-c7-final-stuck.png shows post-submit state). Q-003-CLOSED. |

### PORTAL

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| PortalLoginComponent | page | `/portal/login` | `features/portal/pages/portal-login.component.ts:23` | public (no auth) | populated, sent-state | Magic-link request: "Sign in to your portal" title, 15-min expiry hint, email input, "Send" button; post-submit "Check your inbox" state (mark_email_read icon); dev-link block only when API returns devLink (non-seeded: devLink not returned for unknown email) | **LC** (email-form state + sent state confirmed — screenshots: access-portal-login.png, access-portal-login-sent.png) |
| PortalAuthCallbackComponent | page | `/portal/auth/callback` | `features/portal/pages/portal-auth-callback.component.ts:21` | public (token in URL) | loading, error | Exchanges `?token=` for portal session via PortalService; on success navigates to /portal/dashboard; on failure shows error + RouterLink back to /portal/login. Source-confirmed: loading (token exchange), error (expired/used/unknown token + "contact your administrator" message). | **D4-terminal** — Q-004-CLOSED: no portal users provisioned; magic-link token unobtainable on non-seeded stack. |
| PortalLayoutComponent | page-shell | `/portal/*` (authed) | `features/portal/portal-layout.component.ts:21` | portalAuthGuard (customer) | populated | Portal shell: "QB·ENG" brand + "Customer Portal" title; horizontal tab-nav (Dashboard / Orders / Quotes / Invoices / Shipments); user avatar initials + contact name + customer name; logout button. Guard `portal.guard.ts` (portalAuthGuard) redirects to /portal/login when no portal session. | **D4-terminal** — Q-004-CLOSED: portalAuthGuard always redirects; shell never renders on non-seeded stack. |
| PortalDashboardComponent | page | `/portal/dashboard` | `features/portal/pages/portal-dashboard.component.ts:17` | portalAuthGuard (customer) | loading, populated, empty | Summary stats (PortalSummary model): open orders, quote count, unpaid invoices, in-transit shipments; LoadingBlockDirective; RouterLinks to /portal/orders etc. | **D4-terminal** — Q-004-CLOSED: non-seeded; no portal session obtainable. |
| PortalOrdersComponent | page | `/portal/orders` | `features/portal/pages/portal-orders.component.ts:18` | portalAuthGuard (customer) | loading, populated, empty | List of PortalSalesOrder records; EmptyStateComponent; LoadingBlockDirective; DatePipe + DecimalPipe. | **D4-terminal** — Q-004-CLOSED: non-seeded. |
| PortalQuotesComponent | page | `/portal/quotes` | `features/portal/pages/portal-quotes.component.ts:19` | portalAuthGuard (customer) | loading, populated, empty | List of PortalQuote records; accept action (snackbar); EmptyStateComponent; LoadingBlockDirective. | **D4-terminal** — Q-004-CLOSED: non-seeded. |
| PortalInvoicesComponent | page | `/portal/invoices` | `features/portal/pages/portal-invoices.component.ts:18` | portalAuthGuard (customer) | loading, populated, empty | List of PortalInvoice records with amount + status; DatePipe + DecimalPipe; EmptyStateComponent. | **D4-terminal** — Q-004-CLOSED: non-seeded. |
| PortalShipmentsComponent | page | `/portal/shipments` | `features/portal/pages/portal-shipments.component.ts:18` | portalAuthGuard (customer) | loading, populated, empty | List of PortalShipment records; DatePipe; EmptyStateComponent. | **D4-terminal** — Q-004-CLOSED: non-seeded. |

### MOBILE

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| MobileLayoutComponent | page-shell | `/m/*` | `features/mobile/mobile-layout.component.ts:25` | authGuard (mobile devices) | populated | Mobile shell: "Forge" header + notifications bell button; clock-gate banner (when !isClockedIn()); router-outlet; bottom tab bar (CHAT / MY JOBS / SCAN center-ring / CLOCK / ACCOUNT) | **LC** (screenshot: access-mobile-clock.png; shell, clock-gate banner, bottom nav all visible) |
| MobileClockComponent | page | `/m/clock` | `features/mobile/pages/mobile-clock.component.ts:27` | authGuard | loading, populated | Circular dial showing "Clocked Out" / "Clocked In" state; "Clock In" CTA card; LOADING… spinner during clock-state check; default landing for /m/ | **LC** (screenshot: access-mobile-clock.png; "Clocked Out" state with Clock In card + LOADING spinner) |
| MobileJobsComponent | page | `/m/jobs` | `features/mobile/pages/mobile-jobs.component.ts:28` | authGuard | loading, populated, empty | List of assigned/active jobs; job card shows priority, stage, overdue flag, active-timer indicator | **LC** (route navigated; screenshot: access-mobile-jobs.png) |
| MobileJobDetailComponent | page | `/m/jobs/:jobId` | `features/mobile/pages/mobile-job-detail.component.ts:37` | authGuard | loading, populated, error | Job detail: description, stage, operations, time-log actions | **D4-terminal** (non-seeded: no jobs to navigate into) |
| MobileScanComponent | page | `/m/scan` | `features/mobile/pages/mobile-scan.component.ts:32` | authGuard | populated, camera-active, scan-result | Camera QR/barcode scanner using html5-qrcode library; Html5Qrcode + Html5QrcodeScannerState injected; on decode routes result to job/part/asset via ScannerService. Source-confirmed states (mobile-scan.component.ts:32): camera-permission-prompt (getUserMedia gate), camera-preview-active (live viewfinder), scan-result-overlay (ScanResult: value, type, label — job/part/asset/unknown), error-state (camera denied). | **LC** (route LC — screenshot: access-mobile-scan.png) + **SC (camera/scan-result states)** — Q-002-CLOSED: getUserMedia not available in headless Playwright; camera-preview and scan-result states source-confirmed only; hardware/real-device sweep needed to LC those sub-states. |
| MobileHoursComponent | page | `/m/time` | `features/mobile/pages/mobile-hours.component.ts:41` | authGuard | loading, populated, empty | Weekly time log: daily hours breakdown, entry list per day | **LC** (route navigated — screenshot: access-mobile-hours.png) |
| MobileChatComponent | page | `/m/chat` | `features/mobile/pages/mobile-chat.component.ts:37` | authGuard | loading, populated, empty | Channel list with search; opens to mobile-chat-thread | **LC** (route navigated — screenshot: access-mobile-chat.png) |
| MobileChatThreadComponent | page | `/m/chat/thread/:messageId` | `features/mobile/pages/mobile-chat-thread/mobile-chat-thread.component.ts:20` | authGuard | loading, populated | Thread message list + reply input; mention-formatted messages | **D4-terminal** (non-seeded: no chat messages) |
| MobileChatChannelInfoComponent | page | `/m/chat/channel-info/:channelId` | `features/mobile/pages/mobile-chat-channel-info/mobile-chat-channel-info.component.ts:23` | authGuard | loading, populated | Channel metadata: member list, leave-channel action | **D4-terminal** (non-seeded: no chat channels) |
| MobileNotificationsComponent | page | `/m/notifications` | `features/mobile/pages/mobile-notifications.component.ts:15` | authGuard | loading, populated, empty | In-app notification list; empty-state via EmptyStateComponent | **LC** (route navigated — screenshot: access-mobile-notifications.png) |
| MobileAccountComponent | page | `/m/account` | `features/mobile/pages/mobile-account.component.ts:16` | authGuard | populated | User avatar, name, role; theme toggle; logout; link to desktop site | **LC** (route navigated — screenshot: access-mobile-account.png) |
| MobileHomeComponent | page | **UNROUTED** | `features/mobile/pages/mobile-home.component.ts:35` | — | — | Exists in source + spec only; NOT in mobile.routes.ts; orphan/dead component | **LC-ORPHAN** — navigation test: GET `/m/home` → redirected to `/dashboard` via `**` catch-all route; `mobile-home` CSS class never appears in rendered DOM; component not imported anywhere outside its own files; closed dead |

### AI ASSISTANT

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| AiComponent | page | `/ai/:assistantId` | `features/ai/ai.component.ts:39` | authGuard | loading, populated, empty | AI assistant chat: assistant list sidebar (by category, icon, name, description, active-indicator) + right chat panel (messages log, typing-dots, starter questions, textarea input + send); uses AiService (`features/ai/ai.component.ts:39` — AiService, AiHelpMessage, AiAssistantListItem, ChatMessage interfaces). Populated/chat states source-confirmed: AiAssistantCard (sidebar row), AiStarterQuestions (pre-chat welcome), ChatMessage bubbles (user/assistant roles), typing indicator. | **LC** (empty state) + **D4-terminal for populated states** — Q-005-CLOSED: route IS reachable, no capability gate; empty state LC-confirmed. Populated states blocked because no assistants are configured in non-seeded env (not a cap flag — gate is admin AI assistant config). |

### RENDER — headless PDF

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| HeadlessFormRenderComponent | page | `/__render-form` | `features/render/headless-form-render.component.ts:29` | no auth (headless/tooling) | loading, populated | Headless compliance-form renderer for PDF capture; wraps ComplianceFormRendererComponent in readonly mode; "Waiting for form definition…" until definition() signal populated via window.__FORM_DEFINITION__ injection; no employee session required | **LC** (waiting-state confirmed — screenshot: access-render-form-waiting.png; "Waiting for form definition..." text visible; no chrome/shell) |
| ComplianceFormRendererComponent | shared-cmp | `/__render-form` (inner) + `/onboarding` review phase | `features/account/components/compliance-form-renderer/compliance-form-renderer.component.ts:40` | no auth (render route) · all (onboarding review) | loading, populated | Dynamic compliance-form renderer; takes ComplianceFormDefinition input; converts sections to DynamicFormControlModel via sectionsToModels adapter; renders DynamicQbFormControlComponent per field; multi-page (normalizeFormPages); ValidationButton for submit. Used by HeadlessFormRenderComponent (headless PDF capture) and OnboardingWizardComponent review phase (PDF preview before DocuSeal signing). | **SC** (populated state requires window injection in render path; D4-terminal in onboarding — DocuSeal not configured) |

### RENDER (3D)

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| StlViewerComponent | shared-cmp | shared (parts surfaces) | `shared/components/stl-viewer/stl-viewer.component.ts:20` | all (authGuard — via parts host pages) | loading, populated, error | three.js WebGL STL model viewer; inputs: `url` (required STL file URL), `height` (default `'400px'`); WebGLRenderer + STLLoader + OrbitControls (orbit/zoom/damping) + PerspectiveCamera + ambient/directional/back lighting + grid helper + requestAnimationFrame loop + ResizeObserver. States: loading (signal:24, initial true), populated (mesh added after STLLoader success, `loading.set(false)`:142), error (`signal`:25 — "Failed to load 3D model" on loader error:147; "Failed to initialize 3D viewer" on init-catch:171). Hosted in `features/parts/components/part-detail-panel` + `features/parts/workflow/part-express-form` (parts-region cross-ref — those host pages are NOT in this phase). | **D4-terminal** (populated 3D render blocked: no seeded parts with STL model attachments on non-seeded stack; gate: part record with a 3D model file URL) |

### DEV-TOOLS

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| LoadingDemoComponent | page | `/dev-tools/loading` | `features/dev-tools/loading-demo.component.ts:15` | no auth (any user) | populated | Dev-tools demo for LoadingService + LoadingBlockDirective; 3 sections: Global Overlay (5 trigger buttons), Component-Level Loading (Block A/B toggles + demo blocks), Route Navigation Loading description | **LC** (all 3 sections + active overlay confirmed — screenshots: access-dev-tools-loading.png, access-dev-tools-loading-active.png) |

---

## Shared components — usage audit (in-scope surfaces only)

| component | file | used by (access-region) | status |
|-----------|------|------------------------|--------|
| InputComponent | `shared/components/input/input.component.ts` | login (LC), mfa-challenge (D3), setup (D4), token-setup (LC), account-security (LC), portal-login (LC), mfa-setup-dialog (D3) | **LC** (rendered in LoginComponent + TokenSetupComponent + AccountSecurityComponent + PortalLoginComponent — all LC-confirmed) |
| ValidationButtonComponent | `shared/components/validation-button/validation-button.component.ts` | login (LC), mfa-challenge (D3), setup (D4), token-setup (LC), account-security (LC) | **LC** (rendered in LoginComponent + AccountSecurityComponent — both LC) |
| EmptyStateComponent | `shared/components/empty-state/empty-state.component.ts` | portal-orders (D4), portal-quotes (D4), portal-invoices (D4), portal-shipments (D4), mobile-jobs (LC), mobile-notifications (LC) | **LC** (rendered in MobileJobsComponent + MobileNotificationsComponent — both LC) |
| QrCodeComponent | `shared/components/qr-code/qr-code.component.ts` | mfa-setup-dialog (D3) | **D3** (only used in TOTP-wall surface; never rendered on shared stack) |
| DialogComponent | `shared/components/dialog/dialog.component.ts` | mfa-setup-dialog (D3), mfa-recovery-codes-dialog (D3) | **D3** (only used in TOTP-wall dialogs; never rendered on shared stack) |
| AddressFormComponent | `shared/components/address-form/address-form.component.ts` | setup.component (D4 — setupRequired=false on shared stack) | **SC** (only used in SetupComponent which is D4; not live-confirmed) |
| AvatarComponent | `shared/components/avatar/avatar.component.ts` | mobile-account (LC), mobile-chat-thread (D4), mobile-chat-channel-info (D4), mobile-notifications (LC) | **LC** (rendered in MobileAccountComponent + MobileNotificationsComponent — both LC) |
| LoadingBlockDirective | `shared/directives/loading-block.directive.ts` | portal pages (D4), mobile-clock (LC), mobile-jobs (LC), mobile-hours (LC) | **LC** (rendered in MobileClockComponent + MobileJobsComponent + MobileHoursComponent — all LC) |
| ConfirmDialogComponent | `shared/components/confirm-dialog/confirm-dialog.component.ts` | account-security (LC — remove MFA device action), mobile-chat-channel-info (D4) | **SC** (AccountSecurityComponent is LC but ConfirmDialog only opens on user action — "remove MFA device" button; not triggered in sweep; source-confirmed usage) |
| PageHeaderComponent | `shared/components/page-header/page-header.component.ts` | dev-tools/loading-demo (LC) | **LC** (rendered in LoadingDemoComponent — LC confirmed with screenshot) |
| SelectComponent | `shared/components/select/select.component.ts` | onboarding-wizard (filing-status, state, account-type selects — steps 3/4/6) | **LC** (Steps 3/4/6 all live-confirmed cycle 7c; filing-status + state selects rendered in W-4/State-Tax/Direct-Deposit steps) |
| DatepickerComponent | `shared/components/datepicker/datepicker.component.ts` | onboarding-wizard (DOB, start-date — step 1; I-9 doc expiry — step 5) | **LC** (Step 1 DOB + start-date fields LC cycle 4; Step 5 expiry field LC cycle 7c) |
| ToggleComponent | `shared/components/toggle/toggle.component.ts` | onboarding-wizard (workers-comp ack toggle — step 7) | **LC** (Step 7 ack toggle clicked and confirmed cycle 7c; access-c7-step7-ack-toggled.png) |
| CurrencyInputComponent | `shared/components/currency-input/currency-input.component.ts` | onboarding-wizard (Step 6 direct-deposit amounts) | **LC** (Step 6 deposit form live-confirmed cycle 7c; bankName/routingNumber/accountNumber/accountType all rendered) |
| DynamicQbFormControlComponent | `shared/components/dynamic-form/dynamic-qb-form-control.component.ts` | compliance-form-renderer → headless-form-render (render route) + onboarding review | **SC** (renders individual form fields within ComplianceFormRendererComponent; populated state requires window-injection in render path) |

---

## Open items / queue feed

> Items resolved in cycle 2 by ui-scout live sweep are crossed out. Remaining items for access-queue.md.

- ~~**Q-pending-1:** Live confirm LoginComponent~~ → **RESOLVED**: LC — email+password form, validation badge, "HAVE A SETUP CODE?" link; already-authenticated panel (account_circle + Go-to-Dashboard / Sign-Out). Error state on bad creds not separately triggered but form renders correctly.
- ~~**Q-pending-2:** MfaChallengeComponent~~ → **D3-terminal confirmed**: TOTP wall, shared stack, no enrolled MFA users — gate noted.
- ~~**Q-pending-3:** SetupIntegrationsComponent route~~ → **ROUTING SHADOW BUG (Q-001)**: URL `/setup/integrations` is shadowed by `setup/:token` route (Angular matches "integrations" as a token value). Component only reachable programmatically. See access-queue.md Q-001.
- ~~**Q-pending-4:** OnboardingWizardComponent~~ → **PARTIAL LC**: Step 1 live-confirmed (stepper, worker name pre-filled, all Step 1 fields). Steps 2–7 + review/signing phases source-confirmed (require form progression to trigger).
- ~~**Q-pending-5:** AiComponent cap-gate~~ → **RESOLVED**: Not a cap-gate — AI runtime IS reachable; empty-state "No assistants available" live-confirmed. No assistants configured in non-seeded env. Populated/chat states D3-terminal pending admin AI config.
- ~~**Q-pending-6:** HeadlessFormRenderComponent~~ → **RESOLVED**: LC — route loads without auth; "Waiting for form definition…" state confirmed. Window injection is the population path.
- ~~**Q-pending-7:** LoadingDemoComponent~~ → **RESOLVED**: LC — no auth guard needed; all 3 sections + active overlay state confirmed.
- ~~**Q-pending-8:** MobileScanComponent camera prompt~~ → **Q-002-CLOSED (cycle 3)**: source-confirmed camera/scan-result states written to component table; hardware/headless limit documented; row now SC for sub-states.
- ~~**Q-pending-9:** Portal flow~~ → **RESOLVED**: /portal/login (email form + sent state) LC; /portal/auth/callback and all portal authenticated pages D4-terminal (no portal users provisioned in non-seeded env).
- ~~**Q-pending-10:** MobileHomeComponent~~ → **RESOLVED LC-ORPHAN**: nav to /m/home → catch-all → /dashboard; mobile-home CSS class never in DOM; dead confirmed.

**Cycle 3 — access-queue.md Q-001 through Q-007 all closed in component table:**
- ~~**Q-001 (ROUTING SHADOW BUG)**~~ → **CLOSED**: SetupIntegrationsComponent SC; one-line backend-gap note added (reorder static route before param route in app.routes.ts); row updated.
- ~~**Q-002 (MOBILE SCAN STATE)**~~ → **CLOSED**: camera/scan-result states SC in component table; getUserMedia headless limit documented; manual/real-device sweep noted.
- ~~**Q-003 (ONBOARDING STEPS 2–7)**~~ → **CLOSED**: Steps 2–7 SC with form-group file:line references (addressForm:373, w4Form:405, stateForm:444, i9Form:461, depositForm:537, ackForm:555); DocuSeal review/signing phase D4-terminal (no integration configured).
- ~~**Q-004 (PORTAL AUTH SURFACES)**~~ → **CLOSED**: PortalAuthCallbackComponent SC→D4-terminal; all portal authenticated surfaces (Layout, Dashboard, Orders, Quotes, Invoices, Shipments) confirmed D4-terminal; gate: no portal users provisioned.
- ~~**Q-005 (AI POPULATED STATES)**~~ → **CLOSED**: AiComponent route IS reachable (no cap gate); populated/chat states D4-terminal (not D3 — correct classification: gate is missing admin AI config, not a capability flag); sub-state interfaces SC at component:39 (AiAssistantListItem, ChatMessage).
- ~~**Q-006 (SSO SURFACES)**~~ → **CLOSED**: SsoCallbackComponent D3-terminal (no SSO provider configured; gate: admin SSO setup); inline SSO section in LoginComponent noted (ssoProviders signal:54, no separate component); D3-terminal on this stack.
- ~~**Q-007 (MFA CHALLENGE/TOTP)**~~ → **CLOSED**: MfaChallengeComponent D3-terminal (TOTP wall; source-confirmed states: loading, populated, recovery-code toggle, error); MfaSetupDialogComponent D3-terminal; MfaRecoveryCodesDialogComponent D3-terminal; all three rows updated with Q-007-CLOSED tag.

---

## Cycle log

| cycle | date | rows added | tree items ticked | notes |
|-------|------|------------|-------------------|-------|
| 1 | 2026-05-23 | 33 (all source) | 54/54 feature files, 10/10 shared cmps | Initial source-only pass; awaiting live sweep from ui-scout |
| 2 | 2026-05-23 | 0 new rows (status updates only) | — | ui-scout live sweep: 61 observations, 21 LC upgrades, 5 D3/D4 confirmed, 1 routing-shadow bug found; Q-items resolved below |
| 3 | 2026-05-23 | 0 new rows | — | Orchestrator-directed explicit checks: AccountSecurityComponent LC (3-card Security page confirmed); MobileHomeComponent LC-ORPHAN (nav to /m/home → /dashboard catch-all, never renders); password-reset closed (no standalone route, no forgot-password link on login); Q-pending-8 remains open (headless camera limit) |
| 4 | 2026-05-23 | 0 new rows (status/detail updates) | 10/10 shared cmps ticked | Source-cataloger: ticked all shared-component checklist items; closed Q-001 through Q-007 in component table (file:line + terminal states); corrected AI D3→D4; added inline SSO section note; expanded onboarding steps 2–7 with form-group references; portal auth callback SC→D4; scan camera states SC with headless limit. Queue drained. |
| 5 | 2026-05-23 | 0 new rows (LC upgrades only) | — | ui-scout cycle 5: drove onboarding Steps 2–5 rendering LC (filled Step 1 fields → advanced through Address/W-4/State-Tax/I-9; I-9 form rendered but Continue-btn disabled due to file-upload requirement → Steps 6–7 remain SC). Cycle 5b: SsoCallbackComponent status corrected from pre-written LC to SC(template)/LC(redirect) — ngOnInit always redirects before template is visible; redirect paths confirmed via headless (no-params, ?error=sso_failed, ?error=no_account all → /login; ?sso_token → handleSsoToken+navigate). 10 screenshots added. |
| 6 | 2026-05-23 | 2 new rows | 2 items added to features/account checklist | Source-cataloger: found + added AccountLayoutComponent (account-layout.component.ts:48) and AccountSidebarComponent (account-sidebar.component.ts:37) — both render for all /account/security visits, were missing from inventory; added to checklist, component table, and route table. Added WorkerComponent + welcome to "checked and excluded" boundary note. Upgraded 7/10 shared-cmp statuses SC→LC (by presence in confirmed LC pages); QrCodeComponent + DialogComponent marked D3 (TOTP-wall only); AddressFormComponent remains SC (SetupComponent is D4). |
| 7 | 2026-05-23 | 2 new rows (ComplianceFormRenderer + 5 shared-cmp rows) | 6 items added to shared checklist; 1 to features/account | Source-cataloger: full feature-tree walk confirmed all 30 in-scope .component.ts files; found ComplianceFormRendererComponent (account/components/compliance-form-renderer:40) missing — added to checklist + component table under RENDER (used by HeadlessFormRenderComponent + onboarding review phase). Found 5 additional shared components via import scan not previously listed: SelectComponent (:32), DatepickerComponent (:49), ToggleComponent (:26), CurrencyInputComponent (:46), DynamicQbFormControlComponent (:24) — added to shared checklist + audit table (all SC; used in onboarding steps/compliance-form-renderer). Checklist now 63 items, all [x]. |
| 7b | 2026-05-23 | 1 new row | 1 item added (shared — render 3D) | Source-cataloger: added StlViewerComponent (shared/components/stl-viewer:20) — the "render (3D)" scope item; three.js WebGL STL viewer with loading/populated/error states; D4-terminal (no seeded parts with STL attachments); parts-region cross-ref noted; RENDER section split into "headless PDF" + "3D" subsections. Checklist now 64 items, all [x]. Queue drained. Reconciliation clean. |
| 7c | 2026-05-23 | 0 new rows (LC upgrade) | — | ui-scout cycle 7c: OnboardingWizardComponent Steps 6–7 upgraded SC→LC. I-9 file-upload wall bypassed via Playwright setInputFiles() (minimal 1×1 PNG uploaded to MinIO via API; upload chip confirmed). Continue advanced through Step 5 → Step 6 Direct Deposit (bankName/routingNumber/accountNumber/accountType rendered + filled; access-c7-step6-init.png, access-c7-step6-filled.png) → Step 7 Acknowledgments (workers-comp toggle rendered + clicked; submit btn visible; access-c7-step7-init.png, access-c7-step7-filled.png). Post-submit: review phase triggered but DocuSeal signingUrl not returned (D4-terminal confirmed; access-c7-final-stuck.png). All 7 steps now LC. |
| 7d | 2026-05-23 | 0 new rows (LC upgrades — shared cmps) | — | Source-cataloger: upgraded 4 shared-component rows SC→LC consequent on Steps 3–7 onboarding LC (cycle 7c). SelectComponent LC (filing-status/state selects in Steps 3/4/6 rendered). DatepickerComponent LC (Step 5 expiry field now confirmed, Step 1 DOB already LC). ToggleComponent LC (Step 7 ack toggle clicked + confirmed). CurrencyInputComponent LC (Step 6 deposit amounts rendered). All 67 checklist items [x]. 37 component rows. Queue drained. Phase 06 inventory complete. |


---

## §G — Shared-Component Library

_Folded-in verbatim from `analysis/inventory/shared-library.md`. Sole-writer cataloger content preserved as-is._

# Forge Shared Library Inventory
**Phase:** 07-shared-library  
**Method:** source-confirmed + live-confirmed (5 selectors upgraded from ui-scout final harvest)  
**Status:** COMPLETE — all 77 top-level component dirs + 8 directives + 3 pipes + 7 guards + 9 interceptor files + 40+ services + 57 models + 5 utils + 2 validators + 1 error class + 9 tours + 1 capability registry cataloged  
**Last updated:** 2026-05-23 (ui-scout harvest integrated)  

> Sole writer: source-cataloger agent.  
> Taxonomy: `source-confirmed` | `live-confirmed` | `D3-terminal` (cap-gated-OFF) | `D4-terminal` (populated-blocked).  
> FLAGS resolved this cycle: FLAG 1 — errors/ ToC gap fixed (§10 added); FLAG 2 — 77-vs-65 delta resolved (Explore agent undercounted; actual = 77 top-level dirs, all cataloged); CLAUDE.md drift: WorkflowActiveListComponent → actual class `WorkflowActiveListDialogComponent`, selector `app-workflow-active-list-dialog`.

---

## Table of Contents
1. [Components](#1-components)
2. [Directives](#2-directives)
3. [Pipes](#3-pipes)
4. [Guards](#4-guards)
5. [Interceptors](#5-interceptors)
6. [Services](#6-services)
7. [Models / Constants](#7-models--constants)
8. [Utils](#8-utils)
9. [Validators](#9-validators)
10. [Errors](#10-errors)
11. [Tours](#11-tours)
12. [Capability Registry](#12-capability-registry)
13. [Feature Cross-References (NOT shared exports)](#13-feature-cross-references-not-shared-exports)
14. [Reconciliation Checklist](#14-reconciliation-checklist)

---

## 1. Components

> Root: `forge-ui/src/app/shared/components/`  
> **77 top-level component directories** (all cataloged below) + 3 nested dirs: `data-table/column-filter-popover`, `data-table/column-manager-panel`, `dynamic-form/controls` (11 control files, cataloged as group entry).  
> Count was reported as "65" by the initial Explore agent — that was an undercount. Actual `ls -1d` = 77. All 77 have catalog entries in this section.

---

### ActivityTimelineComponent
- **Status:** source-confirmed
- **Selector:** `app-activity-timeline`
- **File:** `shared/components/activity-timeline/activity-timeline.component.ts:18`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Chronological activity feed with optional filtering by action/user; batches rapid field changes.
- **Contract:**
  - `@Input() activities: ActivityItem[]` — list of items
  - `@Input() compact: boolean = false` — compact display mode
  - `@Input() filterable: boolean = false` — enable filter UI
  - Content projection: none
- **Usage map:** `features/parts/components/operation-dialog/`, `features/employees/pages/employee-detail/tabs/`, `features/customers/pages/customer-detail/tabs/`

---

### AddHoldDialogComponent
- **Status:** source-confirmed
- **Selector:** `app-add-hold-dialog`
- **File:** `shared/components/add-hold-dialog/add-hold-dialog.component.ts:21`
- **Type:** component (MatDialog)
- **Renders-for:** all
- **Purpose:** Dialog to add status holds with type selection and optional notes.
- **Contract:**
  - MAT_DIALOG_DATA: `{ entityType: string, entityId: number, holdOptions: SelectOption[] }`
  - Returns: `StatusTrackingEntry` on success, void on cancel
  - Content projection: none
- **Usage map:** Opened programmatically via StatusTimelineComponent / StatusTrackingService

---

### AddressFormComponent
- **Status:** source-confirmed
- **Selector:** `app-address-form`
- **File:** `shared/components/address-form/address-form.component.ts:34`
- **Type:** component (CVA)
- **Renders-for:** all
- **Purpose:** Reusable address form with country/state selection, verification, and validation.
- **Contract:**
  - `@Input() requireLine1/requireCity/requireState/requirePostalCode: boolean` — field required flags
  - `@Input() showLine2: boolean = true`, `showVerify: boolean = true`
  - `@Input() fixedCountry: string | null = null` — lock country
  - `@Input() stateDropdown: boolean = true`, `compact: boolean = false`
  - ControlValueAccessor
  - Content projection: none
- **Usage map:** `features/vendors/`, `features/auth/setup`, `features/leads/lead-convert-dialog/`, `features/customers/`, `features/admin/company-location-dialog/`, `features/account/pages/contact/`

---

### AiHelpPanelComponent
- **Status:** source-confirmed
- **Selector:** `app-ai-help-panel`
- **File:** `shared/components/ai-help-panel/ai-help-panel.component.ts:18`
- **Type:** component
- **Renders-for:** all (capability-gated: CAP-EXT-AI-ASSISTANT via AiService.capabilityDisabled)
- **Purpose:** Conversational AI help assistant with streaming responses and training suggestions.
- **Contract:**
  - `@Input() appRoute: string` — current route for context
  - Methods: `toggle()`, `send()`, `clearChat()`
  - Content projection: none
- **Usage map:** no usages found in features HTML (mounted in app shell)

---

### AnnouncementOverlayComponent
- **Status:** source-confirmed
- **Selector:** `app-announcement-overlay`
- **File:** `shared/components/announcement-overlay/announcement-overlay.component.ts:13`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Displays overlaid announcement toasts grouped by severity, max 3 visible.
- **Contract:**
  - No @Input/@Output (reactive from AnnouncementService)
  - Content projection: none
- **Usage map:** no usages found (mounted in app shell)

---

### AutocompleteComponent
- **Status:** source-confirmed
- **Selector:** `app-autocomplete`
- **File:** `shared/components/autocomplete/autocomplete.component.ts:20`
- **Type:** component (CVA)
- **Renders-for:** all
- **Purpose:** Material autocomplete with configurable display/value fields and minimum character threshold.
- **Contract:**
  - `@Input() label: string` (required), `options: AutocompleteOption[]` (required)
  - `@Input() displayField: string = 'label'`, `valueField: string = 'value'`
  - `@Input() placeholder: string = ''`, `minChars: number = 1`
  - ControlValueAccessor
  - Content projection: none
- **Usage map:** `features/quotes/`, `features/shipments/`, `features/sales-orders/`, `features/purchase-orders/`

---

### AvatarComponent
- **Status:** source-confirmed
- **Selector:** `app-avatar`
- **File:** `shared/components/avatar/avatar.component.ts:3`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Circular avatar with initials and customizable color/size.
- **Contract:**
  - `@Input() initials: string` (required)
  - `@Input() color: string = '#0d9488'`
  - `@Input() size: 'sm' | 'md' | 'lg' = 'sm'`
  - Content projection: none
- **Usage map:** 32+ files: `features/employees/`, `features/kanban/`, `features/admin/`, `features/shop-floor/`, `features/chat/`, `features/dashboard/`, `features/backlog/`, `features/planning/`, etc.

---

### BarcodeInfoComponent
- **Status:** source-confirmed
- **Selector:** `app-barcode-info`
- **File:** `shared/components/barcode-info/barcode-info.component.ts:11`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Displays entity barcode with copy, print, and regenerate actions.
- **Contract:**
  - `@Input() entityType: string`, `entityId: number`, `entityLabel: string = ''`
  - `@Input() naturalIdentifier: string = ''`, `compact: boolean = false`
  - Content projection: none
- **Usage map:** `features/admin/`, `features/sales-orders/so-detail-panel/`, `features/purchase-orders/po-detail-panel/`, `features/parts/part-detail-panel/`, `features/kanban/job-detail-panel/`, `features/inventory/`, `features/assets/asset-detail-panel/`

---

### BarcodeScanInputComponent
- **Status:** source-confirmed
- **Selector:** `app-barcode-scan-input`
- **File:** `shared/components/barcode-scan-input/barcode-scan-input.component.ts:4`
- **Type:** component
- **Renders-for:** all
- **Purpose:** High-speed scan input with scanner/keyboard detection and auto-focus for kiosk mode.
- **Contract:**
  - `@Input() label: string = 'Scan Barcode'`, `placeholder: string`, `autoFocus: boolean = false`
  - `@Output() scanned: EventEmitter<string>`
  - Public: `focus()`, `clear()`
  - Content projection: none
- **Usage map:** `features/shop-floor/scan/inventory-scan/`, `features/shop-floor/components/scan-move-flow/`, `features/shop-floor/clock/`

---

### CameraCaptureComponent
- **Status:** source-confirmed
- **Selector:** `app-camera-capture`
- **File:** `shared/components/camera-capture/camera-capture.component.ts:22`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Camera capture with file-picker fallback; canvas-based JPEG encoding.
- **Contract:**
  - `@Input() open: boolean = false`
  - `@Output() captured: EventEmitter<CameraCaptureResult>` — `{ blob, dataUrl, width, height }`
  - `@Output() closed: EventEmitter<void>`
  - Content projection: none
- **Usage map:** no usages found (likely opened programmatically or in file-upload-zone)

---

### ChatPreviewPopupComponent
- **Status:** source-confirmed
- **Selector:** `app-chat-preview-popup`
- **File:** `shared/components/chat-preview-popup/chat-preview-popup.component.ts:16`
- **Type:** component
- **Renders-for:** desktop only
- **Purpose:** Auto-dismissing popups for incoming chat messages (max 3 visible, 5s auto-dismiss).
- **Contract:**
  - No @Input/@Output (reactive from ChatNotificationService)
  - Content projection: none
- **Usage map:** no usages found (mounted in app shell)

---

### ColumnFilterPopoverComponent
- **Status:** source-confirmed
- **Selector:** `app-column-filter-popover`
- **File:** `shared/components/data-table/column-filter-popover/column-filter-popover.component.ts:25`
- **Type:** component (data-table internal)
- **Renders-for:** all
- **Purpose:** Per-column filter overlay supporting text/number/date/enum filter modes.
- **Contract:**
  - `@Input() column: ColumnDef`, `currentValue: unknown`
  - `@Output() filterApplied: EventEmitter<ColumnFilterState>`, `filterCleared: EventEmitter<string>`, `closed: EventEmitter<void>`
  - Content projection: none
- **Usage map:** internal — used only by DataTableComponent

---

### ColumnManagerPanelComponent
- **Status:** source-confirmed
- **Selector:** `app-column-manager-panel`
- **File:** `shared/components/data-table/column-manager-panel/column-manager-panel.component.ts:20`
- **Type:** component (data-table internal)
- **Renders-for:** all
- **Purpose:** Panel for column visibility, ordering (drag-drop), and reset to defaults.
- **Contract:**
  - `@Input() columns: ColumnDef[]`, `visibility: Record<string, boolean>`, `order: string[]`
  - `@Output() stateChanged: EventEmitter<ColumnManagerState>`, `resetRequested: EventEmitter<void>`, `closed: EventEmitter<void>`
  - Content projection: none
- **Usage map:** internal — used only by DataTableComponent

---

### ConcurrencyConflictDialogComponent
- **Status:** source-confirmed
- **Selector:** `app-concurrency-conflict-dialog`
- **File:** `shared/components/concurrency-conflict-dialog/concurrency-conflict-dialog.component.ts:21`
- **Type:** component (MatDialog)
- **Renders-for:** all
- **Purpose:** Modal for 412 Precondition Failed — offers reload (re-fetch) or cancel (keep edits).
- **Contract:**
  - MAT_DIALOG_DATA: `{ resource: string | null }`
  - Returns: `'reload' | 'cancel'`
  - Content projection: none
- **Usage map:** Opened by ConcurrencyConflictService (triggered by etagInterceptor on 412)

---

### ConfirmDialogComponent
- **Status:** source-confirmed
- **Selector:** `app-confirm-dialog`
- **File:** `shared/components/confirm-dialog/confirm-dialog.component.ts:14`
- **Type:** component (MatDialog)
- **Renders-for:** all
- **Purpose:** Configurable confirmation dialog with severity levels and custom button labels.
- **Contract:**
  - MAT_DIALOG_DATA: `{ title, message, confirmLabel?, cancelLabel?, severity?: 'info'|'warn'|'danger' }`
  - Returns: `true` (confirm) or `false` (cancel)
  - Content projection: none
- **Usage map:** Opened programmatically across many features (status changes, deletes)

---

### ConnectionBannerComponent
- **Status:** source-confirmed
- **Selector:** `app-connection-banner`
- **File:** `shared/components/connection-banner/connection-banner.component.ts:15`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Transient banner for SignalR reconnecting/disconnected states; hidden during startup blips.
- **Contract:**
  - No @Input/@Output (reactive from SignalrService)
  - Content projection: none
- **Usage map:** no usages found (mounted in app shell)

---

### CurrencyDisplayComponent
- **Status:** source-confirmed
- **Selector:** `app-currency-display`
- **File:** `shared/components/currency-display/currency-display.component.ts:22`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Formatted currency with ISO code suffix when currency differs from base.
- **Contract:**
  - `@Input() value: number` (required)
  - `@Input() currency: string | null = null`, `showCodeWhenBase: boolean = false`
  - Content projection: none
- **Usage map:** 33+ files: `features/quotes/`, `features/invoices/`, `features/sales-orders/`, `features/purchase-orders/`, `features/payments/`, `features/parts/`, `features/customers/`, etc.

---

### CurrencyInputComponent
- **Status:** source-confirmed
- **Selector:** `app-currency-input`
- **File:** `shared/components/currency-input/currency-input.component.ts:31`
- **Type:** component (CVA)
- **Renders-for:** all
- **Purpose:** Currency input with $ prefix, Material form field, numeric keypad on mobile.
- **Contract:**
  - `@Input() label: string` (required), `placeholder: string = '0.00'`, `currencySymbol: string = '$'`
  - `@Input() min: number | null = 0`, `max: number | null = null`, `step = '0.01'`
  - `@Input() required: boolean = false`, `isReadonly: boolean = false`
  - ControlValueAccessor
  - Content projection: none
- **Usage map:** 18+ files: `features/purchase-orders/receive-dialog/`, `features/parts/workflow/`, `features/expenses/`, `features/onboarding/`, `features/leads/`, `features/customers/`, etc.

---

### DashboardWidgetComponent
- **Status:** source-confirmed
- **Selector:** `app-dashboard-widget`
- **File:** `shared/components/dashboard-widget/dashboard-widget.component.ts:4`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Dashboard card with title, icon, count badge, optional view-all link.
- **Contract:**
  - `@Input() title: string` (required), `icon: string`, `count: number | null`, `widgetKey: string`
  - `@Input() accent: boolean = false`, `viewAllLink: string | null`, `viewAllLabel: string = 'View all'`
  - Content projection: default slot for card body
- **Usage map:** `features/dashboard/dashboard.component.html`

---

### DataTableComponent
- **Status:** source-confirmed
- **Selector:** `app-data-table`
- **File:** `shared/components/data-table/data-table.component.ts:40`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Feature-rich data table: sorting, per-column filtering, column manager, pagination, preference persistence, row expand, context menu.
- **Contract:**
  - `@Input() tableId: string` (required), `columns: ColumnDef[]` (required), `data: unknown[]` (required)
  - `@Input() selectable: boolean`, `trackByField: string = 'id'`
  - `@Input() emptyIcon: string`, `emptyMessage: string`, `emptyHelpText: string`
  - `@Input() expandable: boolean`, `loading: boolean`, `stickyFirstColumn: boolean`, `clickableRows: boolean`
  - `@Input() rowClass: (row) => string`, `rowStyle: (row) => Record<string,string>`, `pinPredicate: (row) => boolean`
  - `@Output() rowClick: EventEmitter<unknown>`, `selectionChange: EventEmitter<unknown[]>`
  - Content projection: `[appColumnCell]` templates for custom cells; `[appRowExpand]` template for row expansion
- **Usage map:** 103+ feature files — all major list pages (admin, assets, leads, expenses, time-tracking, parts, backlog, inventory, kanban, etc.)

---

### DateRangePickerComponent
- **Status:** source-confirmed
- **Selector:** `app-date-range-picker`
- **File:** `shared/components/date-range-picker/date-range-picker.component.ts:24`
- **Type:** component (CVA)
- **Renders-for:** all
- **Purpose:** Two-date picker with preset buttons (Today/This Week/etc.).
- **Contract:**
  - `@Input() label: string = 'Date Range'`, `presets: string[]`, `min: Date`, `max: Date`
  - ControlValueAccessor: reads/writes `{ start: Date | null; end: Date | null }`
  - Content projection: none
- **Usage map:** `features/oee/oee.component.html`

---

### DatepickerComponent
- **Status:** live-confirmed (ui-scout: observed in NEW-LOT dialog as Expiration Date [optional])
- **Selector:** `app-datepicker`
- **File:** `shared/components/datepicker/datepicker.component.ts:27`
- **Type:** component (CVA)
- **Renders-for:** all
- **Purpose:** Material single-date picker.
- **Contract:**
  - `@Input() label: string` (required), `min: Date`, `max: Date`, `required: boolean = false`, `isReadonly: boolean = false`
  - ControlValueAccessor: reads/writes `Date | null`
  - Content projection: none
- **Usage map:** 47+ feature files (dialogs, forms, detail panels)

---

### DemoMarkerComponent
- **Status:** source-confirmed
- **Selector:** `app-demo-marker`
- **File:** `shared/components/demo-marker/demo-marker.component.ts:18`
- **Type:** component
- **Renders-for:** demo environment only (pointer-events: none; non-intrusive)
- **Purpose:** Demo mode indicator chip and watermark.
- **Contract:**
  - No @Input/@Output (reads `environment.demoMode`)
  - Content projection: none
- **Usage map:** no usages found (mounted in app shell conditionally)

---

### DetailSidePanelComponent
- **Status:** source-confirmed
- **Selector:** `app-detail-side-panel`
- **File:** `shared/components/detail-side-panel/detail-side-panel.component.ts:10`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Animated right slide-out panel with Escape/backdrop close.
- **Contract:**
  - `@Input() open: boolean` (required), `title: string`
  - `@Output() closed: EventEmitter<void>`
  - Content projection: ng-content for panel body
- **Usage map:** no usages found in HTML (typically opened via DetailDialogService)

---

### DialogComponent
- **Status:** live-confirmed (ui-scout: observed wrapping NEW-LOT dialog and NEW-PART-FORK dialog; screenshots 55-58)
- **Selector:** `app-dialog`
- **File:** `shared/components/dialog/dialog.component.ts:16`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Full-page dialog shell with optional draft auto-save/recovery and dirty-form warning.
- **Contract:**
  - `@Input() title: string` (required), `width: string`, `splitLayout: boolean`, `dirty: boolean`
  - `@Input() draftConfig: DraftConfig`, `draftFormGroup: FormGroup`
  - `@Output() closed: EventEmitter<void>`
  - Content projection: ng-content for dialog body
- **Usage map:** 118+ feature files — all dialog components

---

### DirtyFormIndicatorComponent
- **Status:** live-confirmed (ui-scout screenshots 55-58; renders as invalid-field count badge on submit button)
- **Selector:** `app-dirty-form-indicator`
- **File:** `shared/components/dirty-form-indicator/dirty-form-indicator.component.ts:3`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Orange dot + "Unsaved changes" chip for dirty forms; renders invalid-field count as badge on submit button.
- **Contract:**
  - `@Input() dirty: boolean` (required)
  - Content projection: none
- **Usage map:** 0 direct feature HTML usages; renders via `shared/components/dialog/dialog.component.html:10` → `<app-dirty-form-indicator [dirty]="isDirty()" />`; every dirty form using DialogComponent shows it

---

### DraftRecoveryBannerComponent
- **Status:** source-confirmed
- **Selector:** `app-draft-recovery-banner`
- **File:** `shared/components/draft-recovery-banner/draft-recovery-banner.component.ts:4`
- **Type:** component
- **Renders-for:** all
- **Purpose:** "Recovered from [timestamp]. [Discard]" banner for draft recovery.
- **Contract:**
  - `@Input() timestamp: number` (unix ms), `visible: boolean`
  - `@Output() discarded: EventEmitter<void>`
  - Content projection: none
- **Usage map:** no usages found (used internally by DialogComponent)

---

### DraftRecoveryPromptComponent
- **Status:** source-confirmed
- **Selector:** `app-draft-recovery-prompt`
- **File:** `shared/components/draft-recovery-prompt/draft-recovery-prompt.component.ts:17`
- **Type:** component (MatDialog)
- **Renders-for:** all
- **Purpose:** Post-login dialog listing unsaved drafts for recovery or discard.
- **Contract:**
  - MAT_DIALOG_DATA: `{ drafts: Draft[]; mode: 'recovery' | 'expiry' }`
  - Returns: `{ action: 'navigate'|'keep'|'discard'|'dismiss'; draft?: Draft }`
  - Content projection: none
- **Usage map:** Opened by DraftRecoveryService on login

---

### DrillableChartComponent
- **Status:** source-confirmed
- **Selector:** `app-drillable-chart`
- **File:** `shared/components/drillable-chart/drillable-chart.component.ts:20`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Chart.js wrapper with drill-down and breadcrumb navigation.
- **Contract:**
  - `@Input() initialChartType: ChartType` (required), `initialData: ChartData` (required), `initialOptions: ChartOptions`, `initialLabel: string`
  - `@Input() drillDataFn: (event: DrillEvent) => DrillLevel | null`
  - `@Output() drilled: EventEmitter<DrillEvent>`
  - Content projection: none
- **Usage map:** `features/reports/reports.component.html`

---

### DynamicQbFormComponent
- **Status:** source-confirmed
- **Selector:** `dynamic-qb-form`
- **File:** `shared/components/dynamic-form/dynamic-form.component.ts:1`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Root dynamic form — iterates DynamicFormModel array and renders controls.
- **Contract:**
  - `@Input() model: DynamicFormModel[]` (required), `group: UntypedFormGroup` (required)
  - Content projection: none
- **Usage map:** `features/parts/` (compliance), `features/quality/`, workflow step surfaces

---

### DynamicQbFormControlComponent
- **Status:** source-confirmed
- **Selector:** `dynamic-qb-form-control`
- **File:** `shared/components/dynamic-form/dynamic-qb-form-control.component.ts:18`
- **Type:** component (dynamic-form internal)
- **Renders-for:** all
- **Purpose:** Dynamically instantiates the correct QB control component via ViewContainerRef.
- **Contract:**
  - `@Input() group: UntypedFormGroup` (required), `model: DynamicFormControlModel` (required)
  - Content projection: none
- **Usage map:** internal — used only by DynamicQbFormComponent

---

### ComplianceFormAdapter (utility, not a component)
- **Status:** source-confirmed
- **File:** `shared/components/dynamic-form/compliance-form-adapter.ts:1`
- **Type:** utility (exported functions)
- **Purpose:** Converts `ComplianceFormDefinition` JSON → `DynamicFormModel` array for ng-dynamic-forms.
- **Contract:**
  - `complianceDefinitionToModels(def: ComplianceFormDefinition): DynamicFormModel[]`
  - `sectionsToModels(sections: FormSection[]): DynamicFormModel[]`
  - `isValueControl(model: DynamicFormControlModel): boolean`
- **Usage map:** compliance form renderer surfaces, workflow compliance step

---

### Dynamic Form Controls (11 controls — all in `shared/components/dynamic-form/controls/`)
- **Status:** source-confirmed
- **Renders-for:** dynamic form rendering (internal to DynamicQbFormControlComponent)
- **Pattern:** each accepts `@Input() group: UntypedFormGroup` + `@Input() model: <SpecificModel>`

| Selector | File | Model type | Purpose |
|---|---|---|---|
| `dynamic-qb-input` | `dynamic-qb-input.component.ts` | `DynamicInputModel` | Text/number/email/password with masks |
| `dynamic-qb-select` | `dynamic-qb-select.component.ts` | `DynamicSelectModel<string>` | Dropdown |
| `dynamic-qb-datepicker` | `dynamic-qb-datepicker.component.ts` | `DynamicDatePickerModel` | Date picker |
| `dynamic-qb-textarea` | `dynamic-qb-textarea.component.ts` | `DynamicTextAreaModel` | Textarea |
| `dynamic-qb-toggle` | `dynamic-qb-toggle.component.ts` | `DynamicSwitchModel` | Toggle |
| `dynamic-qb-checkbox` | `dynamic-qb-checkbox.component.ts` | `DynamicCheckboxModel` | Checkbox |
| `dynamic-qb-radio-group` | `dynamic-qb-radio-group.component.ts` | `DynamicRadioGroupModel<string>` | Radio group |
| `dynamic-qb-form-group` | `dynamic-qb-form-group.component.ts` | `DynamicFormGroupModel` | Nested fieldset |
| `dynamic-qb-signature` | `dynamic-qb-signature.component.ts` | `DynamicInputModel` | Typed signature |
| `dynamic-qb-heading` | `dynamic-qb-heading.component.ts` | `DynamicFormControlModel` | Display `<h4>` |
| `dynamic-qb-paragraph` | `dynamic-qb-paragraph.component.ts` | `DynamicFormControlModel` | Display `<p>` |

**Usage map:** All used internally by DynamicQbFormControlComponent; rendered in compliance form surfaces.

---

### EmptyStateComponent
- **Status:** source-confirmed
- **Selector:** `app-empty-state`
- **File:** `shared/components/empty-state/empty-state.component.ts:3`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Centered empty-state with icon, message, help text, and optional action button.
- **Contract:**
  - `@Input() icon: string = 'search_off'`, `message: string`, `helpText: string`, `actionLabel: string`
  - `@Output() action: EventEmitter<void>`
  - Content projection: none
- **Usage map:** 59+ feature files (all list pages with empty states)

---

### EntityActivitySectionComponent
- **Status:** source-confirmed
- **Selector:** `app-entity-activity-section`
- **File:** `shared/components/entity-activity-section/entity-activity-section.component.ts:21`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Tabbed comments/notes/history section for entity detail panels with rich-text editor.
- **Contract:**
  - `@Input() entityType: string` (required), `entityId: number` (required)
  - `@Input() tabs: ActivityFilterTab[] = ['all','comments','notes','history']`
  - Content projection: none
- **Usage map:** 13+ feature detail panels

---

### EntityCompletenessBadgeComponent
- **Status:** source-confirmed
- **Selector:** `app-entity-completeness-badge`
- **File:** `shared/components/entity-completeness-badge/entity-completeness-badge.component.ts:26`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Inline mini badge showing incomplete-requirement count; renders nothing when all ready.
- **Contract:**
  - `@Input() entityType: string` (required), `entityId: number` (required)
  - Content projection: none
- **Usage map:** 6 feature files (customers, vendors, parts detail/list)

---

### EntityCompletenessChipComponent
- **Status:** source-confirmed
- **Selector:** `app-entity-completeness-chip`
- **File:** `shared/components/entity-completeness-chip/entity-completeness-chip.component.ts:29`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Interactive chip with completeness count + clickable popover breakdown.
- **Contract:**
  - `@Input() entityType: string` (required), `entityId: number` (required)
  - Content projection: none
- **Usage map:** 6 feature files (customers, vendors, parts)

---

### EntityLinkComponent
- **Status:** source-confirmed
- **Selector:** `app-entity-link`
- **File:** `shared/components/entity-link/entity-link.component.ts:43`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Inline clickable cross-entity reference link that opens detail dialog via `?detail=type:id`.
- **Contract:**
  - `@Input() type: LinkableEntityType` (required) — job|part|vendor|purchase-order|sales-order|invoice|payment|shipment|quote|lead|asset|lot|rfq|customer-return|training|customer
  - `@Input() entityId: number` (required)
  - Content projection: ng-content for link text
- **Usage map:** 39+ feature files (detail panels, dialogs, tabs)

---

### EntityPickerComponent
- **Status:** live-confirmed (ui-scout: observed in NEW-LOT dialog as Part [required] and Linked Job [optional] pickers)
- **Selector:** `app-entity-picker`
- **File:** `shared/components/entity-picker/entity-picker.component.ts:21`
- **Type:** component (CVA)
- **Renders-for:** all
- **Purpose:** Typeahead autocomplete for searching and selecting entities; supports inline-create affordance.
- **Contract:**
  - `@Input() label: string` (required), `entityType: string` (required)
  - `@Input() displayField: string = 'name'`, `secondaryDisplayField: string`, `filters: Record<string,string> = {}`
  - `@Input() placeholder: string`, `isReadonly: boolean`, `createNewLabel: string` (omit to disable)
  - `@Output() createNew: EventEmitter<string>`, `selected: EventEmitter<Record<string,unknown> | null>`
  - ControlValueAccessor: reads/writes entity ID
  - Content projection: none
- **Usage map:** 39+ feature files (forms, detail dialogs)

---

### FileUploadZoneComponent
- **Status:** source-confirmed
- **Selector:** `app-file-upload-zone`
- **File:** `shared/components/file-upload-zone/file-upload-zone.component.ts:37`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Drag-drop upload with chunked upload support, progress tracking, size/type validation.
- **Contract:**
  - `@Input() entityType: string` (required), `entityId: string | number` (required)
  - `@Input() accept: string`, `maxSizeMb: number = 50`, `multiple: boolean = true`, `chunkSizeMb: number = 5`
  - `@Output() uploaded: EventEmitter<UploadedFile>` — `{ id, fileName, contentType, size, url }`
  - Content projection: none
- **Usage map:** 39+ feature files (forms, detail panels, dialogs)

---

### InputComponent
- **Status:** source-confirmed
- **Selector:** `app-input`
- **File:** `shared/components/input/input.component.ts:13`
- **Type:** component (CVA)
- **Renders-for:** all
- **Purpose:** Material text input wrapper with masking, prefix/suffix, and multiple input types.
- **Contract:**
  - `@Input() label: string` (required), `type: 'text'|'number'|'email'|'password'|'time'|'datetime-local' = 'text'`
  - `@Input() info: string`, `placeholder: string`, `prefix: string`, `suffix: string`
  - `@Input() isReadonly: boolean`, `maxlength: number | null`, `autocomplete: string`
  - `@Input() mask: 'phone'|'zip'|'ssn'|'ein'|'date'|'currency'|null`
  - `@Input() required: boolean`, `step`, `min`, `max`
  - ControlValueAccessor
  - Content projection: none
- **Usage map:** 157+ feature HTML files — most widely used form component

---

### KanbanColumnHeaderComponent
- **Status:** source-confirmed
- **Selector:** `app-kanban-column-header`
- **File:** `shared/components/kanban-column-header/kanban-column-header.component.ts:5`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Kanban column header with WIP limit display and collapse toggle.
- **Contract:**
  - `@Input() name: string` (required), `count: number = 0`, `wipLimit: number | null`, `color: string`
  - `@Input() isIrreversible: boolean`, `collapsed: boolean`
  - `@Output() collapseToggled: EventEmitter<void>`
  - Content projection: none
- **Usage map:** `features/kanban/` board components

---

### KeyboardShortcutsHelpComponent
- **Status:** source-confirmed
- **Selector:** `app-keyboard-shortcuts-help`
- **File:** `shared/components/keyboard-shortcuts-help/keyboard-shortcuts-help.component.ts:14`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Displays registered keyboard shortcuts grouped by context.
- **Contract:**
  - No @Input/@Output (injects KeyboardShortcutsService)
  - Content projection: none
- **Usage map:** no usages found (opened by KeyboardShortcutsService)

---

### KpiChipComponent
- **Status:** source-confirmed
- **Selector:** `app-kpi-chip`
- **File:** `shared/components/kpi-chip/kpi-chip.component.ts:4`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Compact metric display with value, label, and trend indicator.
- **Contract:**
  - `@Input() value: string` (required), `label: string` (required)
  - `@Input() change: string | null`, `changeDirection: 'up'|'down'|'neutral'`
  - `@Input() valueColor: 'default'|'warn'|'success'|'primary'`
  - Content projection: none
- **Usage map:** no usages found (likely in dashboard/reports not yet wired)

---

### LightboxGalleryComponent
- **Status:** source-confirmed
- **Selector:** `app-lightbox-gallery`
- **File:** `shared/components/lightbox-gallery/lightbox-gallery.component.ts:19`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Fullscreen image viewer with thumbnails, keyboard/touch nav.
- **Contract:**
  - `@Input() items: GalleryItem[]` (required), `startIndex: number = 0`
  - `@Output() closed: EventEmitter<void>`
  - Content projection: none
- **Usage map:** no usages found (opened programmatically via MatDialog or service)

---

### ListPanelComponent
- **Status:** source-confirmed
- **Selector:** `app-list-panel`
- **File:** `shared/components/list-panel/list-panel.component.ts:6`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Scrollable panel wrapper with built-in empty state.
- **Contract:**
  - `@Input() empty: boolean`, `emptyIcon: string = 'inbox'`, `emptyMessage: string = 'No items'`
  - Content projection: default slot for list content
- **Usage map:** no usages found (utility wrapper)

---

### LoadingOverlayComponent
- **Status:** source-confirmed
- **Selector:** `app-loading-overlay`
- **File:** `shared/components/loading-overlay/loading-overlay.component.ts:11`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Full-screen blocking overlay with entrance/exit animations; consumes LoadingService.
- **Contract:**
  - No @Input/@Output (injects LoadingService)
  - Content projection: none
- **Usage map:** no usages found (mounted in app shell)

---

### LogoutDraftsDialogComponent
- **Status:** source-confirmed
- **Selector:** `app-logout-drafts-dialog`
- **File:** `shared/components/logout-drafts-dialog/logout-drafts-dialog.component.ts:17`
- **Type:** component (MatDialog)
- **Renders-for:** all
- **Purpose:** Logout confirmation dialog listing unsaved drafts.
- **Contract:**
  - MAT_DIALOG_DATA: `LogoutDraftsDialogData`
  - Returns: `LogoutDraftsDialogResult` — `{ action: 'logout'|'navigate'|'cancel'; draft? }`
  - Content projection: none
- **Usage map:** Opened by DraftRecoveryService before logout

---

### MarkdownViewComponent
- **Status:** source-confirmed
- **Selector:** `app-markdown-view`
- **File:** `shared/components/markdown-view/markdown-view.component.ts:5`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Renders markdown using ngx-markdown.
- **Contract:**
  - `@Input() content: string` (required)
  - Content projection: none
- **Usage map:** no usages found (likely used in help/training surfaces)

---

### MiniCalendarWidgetComponent
- **Status:** source-confirmed
- **Selector:** `app-mini-calendar-widget`
- **File:** `shared/components/mini-calendar-widget/mini-calendar-widget.component.ts:7`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Compact calendar with date selection and highlight support.
- **Contract:**
  - `@Input() highlightDates: Date[]`
  - `@Output() dateSelected: EventEmitter<Date>`
  - Content projection: none
- **Usage map:** no usages found (likely dashboard widget)

---

### NotificationPanelComponent
- **Status:** source-confirmed
- **Selector:** `app-notification-panel`
- **File:** `shared/components/notification-panel/notification-panel.component.ts:15`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Notification inbox with tabs, filtering, pin/dismiss, and entity navigation.
- **Contract:**
  - No @Input (injects NotificationService)
  - Content projection: none
- **Usage map:** 68 feature HTML files (app shell header)

---

### OfflineBannerComponent
- **Status:** source-confirmed
- **Selector:** `app-offline-banner`
- **File:** `shared/components/offline-banner/offline-banner.component.ts:10`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Offline status, syncing progress, and sync-complete messages; auto-dismisses success after 3s.
- **Contract:**
  - No @Input (injects OfflineQueueService; listens to online/offline events)
  - Content projection: none
- **Usage map:** no usages found (mounted in app shell)

---

### OnboardingBannerComponent
- **Status:** source-confirmed
- **Selector:** `app-onboarding-banner`
- **File:** `shared/components/onboarding-banner/onboarding-banner.component.ts:12`
- **Type:** component
- **Renders-for:** authenticated users with incomplete profile
- **Purpose:** Nudge banner for profile completion with bypass option.
- **Contract:**
  - No @Input (injects AuthService, EmployeeProfileService, OnboardingService)
  - Content projection: none
- **Usage map:** no usages found (mounted in app shell)

---

### PageHeaderComponent
- **Status:** source-confirmed
- **Selector:** `app-page-header`
- **File:** `shared/components/page-header/page-header.component.ts:9`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Page title and subtitle bar with optional help tour trigger.
- **Contract:**
  - `@Input() title: string` (required), `subtitle: string`, `helpTourId: string`
  - Content projection: none
- **Usage map:** 68+ feature HTML files

---

### PageLayoutComponent
- **Status:** source-confirmed
- **Selector:** `app-page-layout`
- **File:** `shared/components/page-layout/page-layout.component.ts:9`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Standard full-page shell with header and content area.
- **Contract:**
  - `@Input() pageTitle: string` (required), `pageSubtitle: string`, `helpTourId: string`
  - Content projection: main slot
- **Usage map:** 134+ feature HTML files — page shell for all major feature routes

---

### PdfViewerComponent
- **Status:** source-confirmed
- **Selector:** `app-pdf-viewer`
- **File:** `shared/components/pdf-viewer/pdf-viewer.component.ts:5`
- **Type:** component
- **Renders-for:** all
- **Purpose:** PDF viewer using ngx-extended-pdf-viewer.
- **Contract:**
  - `@Input() src: string | Uint8Array` (required), `height: string = '600px'`
  - `@Input() showToolbar: boolean = true`, `showSidebarButton: boolean = false`
  - `@Output() closed: EventEmitter<void>`
  - Content projection: none
- **Usage map:** no usages found (opened programmatically for document preview)

---

### PresetApplyDialogComponent
- **Status:** source-confirmed
- **Selector:** `app-preset-apply-dialog`
- **File:** `shared/components/preset-apply-dialog/preset-apply-dialog.component.ts:37`
- **Type:** component (MatDialog)
- **Renders-for:** all
- **Purpose:** Confirmation dialog for preset application showing delta and violations.
- **Contract:**
  - MAT_DIALOG_DATA: `PresetApplyDialogData`
  - Returns: `PresetApplyDialogResult` — `{ confirmed: boolean; reason?: string }`
  - Content projection: none
- **Usage map:** Opened by PresetService in `features/admin/` capability surfaces

---

### ProductionLabelComponent
- **Status:** source-confirmed
- **Selector:** `app-production-label`
- **File:** `shared/components/production-label/production-label.component.ts:13`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Barcode/QR label display and print.
- **Contract:**
  - `@Input() label: LabelData` (required) — `{ title, subtitle, barcodeValue, barcodeType, fields }`
  - `@Input() size: 'small'|'medium'|'large'`
  - Public: `print()`
  - Content projection: none
- **Usage map:** no usages found (kiosk/shop-floor label printing)

---

### QrCodeComponent
- **Status:** source-confirmed
- **Selector:** `app-qr-code`
- **File:** `shared/components/qr-code/qr-code.component.ts:6`
- **Type:** component
- **Renders-for:** all
- **Purpose:** QR code generator (angularx-qrcode wrapper).
- **Contract:**
  - `@Input() value: string` (required), `size: number = 128`, `errorCorrectionLevel: 'L'|'M'|'Q'|'H' = 'M'`
  - Content projection: none
- **Usage map:** no usages found (used in barcode-info, label printing)

---

### QuickActionPanelComponent
- **Status:** source-confirmed
- **Selector:** `app-quick-action-panel`
- **File:** `shared/components/quick-action-panel/quick-action-panel.component.ts:12`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Touch-first grid of 88×88px action buttons for shop floor.
- **Contract:**
  - `@Input() actions: QuickAction[]` (required), `columns: number = 3`
  - `@Output() actionClick: EventEmitter<string>`
  - Content projection: none
- **Usage map:** no usages found (shop-floor kiosk surfaces)

---

### RecentCommunicationsComponent
- **Status:** source-confirmed
- **Selector:** `app-recent-communications`
- **File:** `shared/components/recent-communications/recent-communications.component.ts:32`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Widget showing recent emails/calls/messages for a CRM entity.
- **Contract:**
  - `@Input() entityType: string` (required), `entityId: number` (required), `maxItems: number = 5`
  - Content projection: none
- **Usage map:** no usages found (likely in lead/customer detail)

---

### RichTextDisplayComponent
- **Status:** source-confirmed
- **Selector:** `app-rich-text-display`
- **File:** `shared/components/rich-text-display/rich-text-display.component.ts:15`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Renders markdown with job-reference and mention links.
- **Contract:**
  - `@Input() content: string`
  - `@Output() jobRefClicked: EventEmitter<string>`
  - Content projection: none
- **Usage map:** 146+ feature HTML files (activity feeds, comments, notes)

---

### RichTextEditorComponent
- **Status:** source-confirmed
- **Selector:** `app-rich-text-editor`
- **File:** `shared/components/rich-text-editor/rich-text-editor.component.ts:19`
- **Type:** component (CVA)
- **Renders-for:** all
- **Purpose:** Textarea with @mention autocomplete and formatted mention output.
- **Contract:**
  - `@Input() placeholder: string`, `users: MentionUser[]`, `rows: number = 4`
  - `@Input() mentionedUserIds: Signal<number[]>` — extracted IDs
  - ControlValueAccessor
  - Content projection: none
- **Usage map:** 146+ feature HTML files (comment/note forms, activity section)

---

### SankeyChartComponent
- **Status:** source-confirmed
- **Selector:** `app-sankey-chart`
- **File:** `shared/components/sankey-chart/sankey-chart.component.ts:28`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Sankey flow diagram via ng2-charts.
- **Contract:**
  - `@Input() data: SankeyFlowItem[]` (required), `height: number = 400`
  - Content projection: none
- **Usage map:** `features/reports/` sankey reports component

---

### SelectComponent
- **Status:** source-confirmed
- **Selector:** `app-select`
- **File:** `shared/components/select/select.component.ts:18`
- **Type:** component (CVA)
- **Renders-for:** all
- **Purpose:** Material select dropdown with optional multi-select.
- **Contract:**
  - `@Input() label: string` (required), `options: SelectOption[]` (required)
  - `@Input() multiple: boolean`, `placeholder: string`, `required: boolean`, `isReadonly: boolean`
  - ControlValueAccessor
  - Content projection: none
- **Usage map:** 146+ feature HTML files — second most widely used form component

---

### SetStatusDialogComponent
- **Status:** source-confirmed
- **Selector:** `app-set-status-dialog`
- **File:** `shared/components/set-status-dialog/set-status-dialog.component.ts:23`
- **Type:** component (MatDialog)
- **Renders-for:** all
- **Purpose:** Dialog for setting entity workflow status with optional notes.
- **Contract:**
  - MAT_DIALOG_DATA: `SetStatusDialogData`
  - Form: `statusCode` (required), `notes` (max 2000)
  - Returns: `StatusEntry`
  - Content projection: none
- **Usage map:** Opened by StatusTimelineComponent

---

### SlideoutComponent
- **Status:** source-confirmed
- **Selector:** `app-slideout`
- **File:** `shared/components/slideout/slideout.component.ts:30`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Generic transient panel sliding from any edge; opt-in backdrop and outside-click close.
- **Contract:**
  - `@Input() open: boolean` (required), `position: 'left'|'right'|'top'|'bottom' = 'right'`
  - `@Input() size: string = '320px'`, `title: string`, `icon: string`, `backdrop: boolean`, `closeOnOutsideClick: boolean`
  - `@Output() closed: EventEmitter<void>`
  - Content projection: header/content/footer slots
- **Usage map:** 146+ feature HTML files (filter drawers, help panels, secondary panels)

---

### StatusBadgeComponent
- **Status:** source-confirmed
- **Selector:** `app-status-badge`
- **File:** `shared/components/status-badge/status-badge.component.ts:4`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Colored status badge with semantic color coding.
- **Contract:**
  - `@Input() status: string` (required), `statusColor: 'active'|'upcoming'|'overdue'|'completed' = 'upcoming'`
  - Content projection: none
- **Usage map:** no usages found (likely superseded by inline status chips in feature tables)

---

### StatusTimelineComponent
- **Status:** source-confirmed
- **Selector:** `app-status-timeline`
- **File:** `shared/components/status-timeline/status-timeline.component.ts:21`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Active status + holds + history timeline with add/release hold actions.
- **Contract:**
  - `@Input() entityType: string` (required), `entityId: number` (required)
  - Content projection: none
- **Usage map:** 146+ feature HTML files (entity detail panels)

---

### StepRationaleComponent
- **Status:** source-confirmed
- **Selector:** `app-step-rationale`
- **File:** `shared/components/step-rationale/step-rationale.component.ts:20`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Collapsible pane explaining a workflow step's rationale.
- **Contract:**
  - `@Input() i18nKey: string` (required), `initiallyExpanded: boolean = false`
  - Content projection: none
- **Usage map:** no usages found (workflow guided-mode step panels)

---

### StlViewerComponent
- **Status:** source-confirmed
- **Selector:** `app-stl-viewer`
- **File:** `shared/components/stl-viewer/stl-viewer.component.ts:13`
- **Type:** component
- **Renders-for:** all
- **Purpose:** 3D STL file viewer via Three.js + OrbitControls.
- **Contract:**
  - `@Input() url: string` (required), `height: string = '400px'`
  - Content projection: none
- **Usage map:** no usages found (parts/documents 3D model preview)

---

### StubPageComponent
- **Status:** source-confirmed
- **Selector:** `app-stub-page`
- **File:** `shared/components/stub-page/stub-page.component.ts:22`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Placeholder page for unimplemented routes.
- **Contract:**
  - `@Input() title: string` (required), `subtitle: string`, `icon: string` (required)
  - `@Input() emptyMessage: string` (required), `emptyHelp: string`
  - Content projection: none
- **Usage map:** no usages found (routed stubs in app.routes.ts)

---

### SyncConflictDialogComponent
- **Status:** source-confirmed
- **Selector:** `app-sync-conflict-dialog`
- **File:** `shared/components/sync-conflict-dialog/sync-conflict-dialog.component.ts:13`
- **Type:** component (MatDialog)
- **Renders-for:** all
- **Purpose:** Offline sync conflict resolution (Keep Mine / Keep Server / Cancel).
- **Contract:**
  - MAT_DIALOG_DATA: `SyncConflictDialogData`
  - Returns: `'keep-mine' | 'keep-server' | 'cancel'`
  - Content projection: none
- **Usage map:** Opened by OfflineQueueService on conflict

---

### TextareaComponent
- **Status:** live-confirmed (ui-scout: observed in NEW-LOT dialog as Notes [optional])
- **Selector:** `app-textarea`
- **File:** `shared/components/textarea/textarea.component.ts:13`
- **Type:** component (CVA)
- **Renders-for:** all
- **Purpose:** Material textarea with optional maxlength and read-only mode.
- **Contract:**
  - `@Input() label: string`, `rows: number = 3`, `maxlength: number | null`, `hint: string`, `placeholder: string`, `isReadonly: boolean`
  - ControlValueAccessor
  - Content projection: none
- **Usage map:** 146+ feature HTML files

---

### ToastComponent
- **Status:** source-confirmed
- **Selector:** `app-toast-container`
- **File:** `shared/components/toast/toast.component.ts:5`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Stackable upper-right toast notifications (info/success/warn/error).
- **Contract:**
  - No @Input (injects ToastService)
  - Content projection: none
- **Usage map:** no usages found (mounted in app shell)

---

### ToggleComponent
- **Status:** source-confirmed
- **Selector:** `app-toggle`
- **File:** `shared/components/toggle/toggle.component.ts:12`
- **Type:** component (CVA)
- **Renders-for:** all
- **Purpose:** Material slide-toggle wrapper.
- **Contract:**
  - `@Input() label: string` (required), `isReadonly: boolean`
  - ControlValueAccessor
  - Content projection: none
- **Usage map:** 146+ feature HTML files

---

### ToolbarComponent
- **Status:** source-confirmed
- **Selector:** `app-toolbar`
- **File:** `shared/components/toolbar/toolbar.component.ts:4`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Horizontal flex filter/action bar container.
- **Contract:**
  - No @Input/@Output
  - Content projection: toolbar items (use `[appSpacer]` to push right)
- **Usage map:** no usages found (likely used indirectly through features)

---

### TrainingContextPanelComponent
- **Status:** source-confirmed
- **Selector:** `app-training-context-panel`
- **File:** `shared/components/training-context-panel/training-context-panel.component.ts:18`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Contextual training modules/walkthroughs for the current route.
- **Contract:**
  - `@Input() currentRoute: string` (required), `open: boolean` (required)
  - `@Output() closed: EventEmitter<void>`
  - Content projection: none
- **Usage map:** no usages found (mounted in app shell help panel)

---

### ValidationButtonComponent
- **Status:** source-confirmed
- **Selector:** `app-validation-button`
- **File:** `shared/components/validation-button/validation-button.component.ts:23`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Submit button wrapper — shows warning icon + count with CDK overlay popover on click when invalid.
- **Contract:**
  - `@Input() violations: Signal<string[]>` (required)
  - `@Input() violationItems: Signal<ViolationItem[]> | null`, `loading: boolean`
  - `@Output() violationClicked: EventEmitter<string>` — emits control name on click
  - Content projection: none
- **Usage map:** no usages found (typically inside DialogComponent footer)

---

### VirtualScrollListComponent
- **Status:** source-confirmed
- **Selector:** `app-virtual-scroll-list`
- **File:** `shared/components/virtual-scroll-list/virtual-scroll-list.component.ts:12`
- **Type:** component
- **Renders-for:** all
- **Purpose:** CDK virtual-scroll container for high-performance long lists.
- **Contract:**
  - `@Input() items: T[]` (required), `itemSize: number = 48`, `trackByField: string = 'id'`
  - `@ContentChild('itemTemplate')` — required item template
  - Content projection: itemTemplate
- **Usage map:** no usages found (large list optimization)

---

### WorkflowComponent
- **Status:** source-confirmed
- **Selector:** `app-workflow`
- **File:** `shared/components/workflow/workflow.component.ts:49`
- **Type:** component
- **Renders-for:** all
- **Purpose:** Generic workflow execution shell with express/guided mode toggle.
- **Contract:**
  - `@Input() run: WorkflowRun | null`, `definition: WorkflowDefinition | null`, `entity: unknown`
  - `@Input() validators: EntityValidator[]`, `entityTitle: string`, `missingValidators: MissingValidator[]`, `readonly: boolean`
  - `@Output() closed`, `stepJumped`, `modeChanged`, `stepAdvanced`, `stepBacked`, `stepSkipped`, `completeRequested`
  - Content projection: none
- **Usage map:** `features/parts/workflow/`, `features/compliance-form-renderer/`, workflow shell demo

---

### WorkflowActiveListDialogComponent
- **Status:** source-confirmed
- **Selector:** `app-workflow-active-list-dialog`
- **File:** `shared/components/workflow-active-list/workflow-active-list-dialog.component.ts:30`
- **Type:** component (MatDialog) — in own directory `workflow-active-list/`
- **Renders-for:** all
- **Purpose:** Dialog listing in-flight workflow runs with navigation to resume.
- **Contract:**
  - No @Input (injects WorkflowService; loaded via MatDialog)
  - Content projection: none
- **Usage map:** Opened by WorkflowResumeService on login
- **CLAUDE.md drift:** CLAUDE.md lists this as `WorkflowActiveListComponent` — actual class name is `WorkflowActiveListDialogComponent`, selector `app-workflow-active-list-dialog`, in own top-level directory `workflow-active-list/` (not a file inside `workflow/`)

---

## 2. Directives

> Root: `forge-ui/src/app/shared/directives/`

---

### CapDirective
- **Status:** source-confirmed
- **Selector:** `[appCap]` (structural: `*appCap`)
- **File:** `shared/directives/cap.directive.ts:22`
- **Type:** directive (structural)
- **Purpose:** Mounts template only when named capability is enabled; reactive to CapabilityService snapshot changes.
- **Contract:** `appCap: string` (capability code) — calls `CapabilityService.isEnabled(code)`
- **Usage map:** grep `*appCap` across features HTML (capability-gated UI blocks)

---

### CapNotDirective
- **Status:** source-confirmed
- **Selector:** `[appCapNot]` (structural: `*appCapNot`)
- **File:** `shared/directives/cap-not.directive.ts:12`
- **Type:** directive (structural)
- **Purpose:** Inverse of CapDirective — mounts template when capability is DISABLED (fallback UI).
- **Contract:** `appCapNot: string` (capability code) — `!CapabilityService.isEnabled(code)`
- **Usage map:** grep `*appCapNot` across features HTML

---

### ColumnCellDirective
- **Status:** source-confirmed
- **Selector:** `[appColumnCell]`
- **File:** `shared/directives/column-cell.directive.ts:3`
- **Type:** directive (attribute)
- **Purpose:** Tags `ng-template` with a field name for custom cell rendering in DataTableComponent.
- **Contract:** `appColumnCell: string` (field name alias) — injects `TemplateRef<unknown>`
- **Usage map:** `ng-template appColumnCell="fieldName"` in all feature data-table usages (103+ files)

---

### LoadingBlockDirective
- **Status:** source-confirmed
- **Selector:** `[appLoadingBlock]`
- **File:** `shared/directives/loading-block.directive.ts:10`
- **Type:** directive (attribute)
- **Purpose:** Overlays host element with spinner + translucent backdrop when loading; 300ms fade transitions.
- **Contract:** `appLoadingBlock: boolean` — reactive effect shows/hides overlay
- **Usage map:** grep `appLoadingBlock` in features HTML (table scroll areas, form sections)

---

### RowExpandDirective
- **Status:** source-confirmed
- **Selector:** `[appRowExpand]`
- **File:** `shared/directives/row-expand.directive.ts:3`
- **Type:** directive (attribute)
- **Purpose:** Tags `ng-template` for expandable row content in DataTableComponent.
- **Contract:** Injects `TemplateRef<unknown>` for expansion area
- **Usage map:** `ng-template appRowExpand` in expandable DataTable usages (inventory, etc.)

---

### SpacerDirective
- **Status:** source-confirmed
- **Selector:** `[appSpacer]`
- **File:** `shared/directives/spacer.directive.ts:3`
- **Type:** directive (attribute)
- **Purpose:** Sets `flex: 1` on host to push adjacent items to far edges in flex containers.
- **Contract:** Pure styling; no inputs/outputs
- **Usage map:** grep `appSpacer` in features HTML (toolbar layouts)

---

### TruncationTooltipDirective
- **Status:** source-confirmed
- **Selector:** `[appTruncationTooltip]`
- **File:** `shared/directives/truncation-tooltip.directive.ts:5`
- **Type:** directive (attribute)
- **Purpose:** Shows Material tooltip only when text is truncated by CSS overflow; auto-hides if it fits.
- **Contract:** `appTruncationTooltip: string` — tooltip text; reads `scrollWidth > clientWidth` on mouseenter
- **Usage map:** grep `appTruncationTooltip` in features HTML (table cells, list items)

---

### ValidationPopoverDirective
- **Status:** source-confirmed
- **Selector:** `[appValidationPopover]`
- **File:** `shared/directives/validation-popover.directive.ts:66`
- **Type:** directive (attribute)
- **Purpose:** CDK Overlay floating validation error popover on hover/focus; auto-hides after 4s. (CLAUDE.md: "Legacy hover popover — do not use on new code.")
- **Contract:** `appValidationPopover: Signal<string[]>` — error messages signal; reactive effect + mouseenter/focusin/mouseleave/focusout listeners
- **Usage map:** grep `appValidationPopover` in features HTML (legacy form fields)

---

## 3. Pipes

> Root: `forge-ui/src/app/shared/pipes/`

---

### MentionHighlightPipe
- **Status:** source-confirmed
- **Name:** `mentionHighlight`
- **File:** `shared/pipes/mention-highlight.pipe.ts:4`
- **Type:** pipe
- **Purpose:** Escapes HTML and highlights `@[Name](user:ID)` and legacy `@username` mentions.
- **Contract:** `transform(text: string): SafeHtml` — returns sanitized HTML with `<span class="mention">` wrappers
- **Usage map:** grep `| mentionHighlight` in features HTML (chat, comment displays)

---

### RichTextPipe
- **Status:** source-confirmed
- **Name:** `richText`
- **File:** `shared/pipes/rich-text.pipe.ts:6`
- **Type:** pipe
- **Purpose:** Converts Markdown to HTML; preserves `@[Name](user:ID)` mentions and `[J-NNN](job:NNN)` job refs as semantic spans.
- **Contract:** `transform(value: string | null | undefined): SafeHtml` — `marked.parse()` + DomSanitizer
- **Usage map:** grep `| richText` in features HTML (activity feeds, notes)

---

### TerminologyPipe
- **Status:** source-confirmed
- **Name:** `terminology`
- **File:** `shared/pipes/terminology.pipe.ts:5`
- **Type:** pipe (impure)
- **Purpose:** Resolves terminology keys to admin-configurable display strings via TerminologyService.
- **Contract:** `transform(key: string): string` — delegates to `TerminologyService.resolve(key)`
- **Usage map:** grep `| terminology` in features HTML (labels subject to admin rename)

---

## 4. Guards

> Root: `forge-ui/src/app/shared/guards/`

---

### authGuard
- **Status:** source-confirmed
- **File:** `shared/guards/auth.guard.ts:5`
- **Type:** guard (CanActivateFn)
- **Purpose:** Protects authenticated routes; redirects to `/login?returnUrl=...` if not authenticated.
- **Contract:** Returns `true` if `AuthService.isAuthenticated()`, else `UrlTree` to `/login`
- **Usage map:** Applied on all main feature routes in `app.routes.ts`

---

### demoOnlyGuard
- **Status:** source-confirmed
- **File:** `shared/guards/demo-only.guard.ts:12`
- **Type:** guard (CanActivateFn)
- **Purpose:** Blocks routes only valid in demo builds; redirects production users to /dashboard.
- **Contract:** Returns `true` if `environment.demoMode`, else `UrlTree` to `/dashboard`
- **Usage map:** `/welcome` marketing route

---

### mobileRedirectGuard
- **Status:** source-confirmed
- **File:** `shared/guards/mobile-redirect.guard.ts:14`
- **Type:** guard (CanActivateFn)
- **Purpose:** Redirects mobile devices to `/m/` unless on exempt paths or `preferDesktop=true` sessionStorage override.
- **Contract:** Returns `true` for desktop / exempt prefix / `preferDesktop` override, else `UrlTree` to `/m`
- **Usage map:** Applied on desktop-only routes

---

### roleGuard
- **Status:** source-confirmed
- **File:** `shared/guards/role.guard.ts:5`
- **Type:** guard factory (CanActivateFn)
- **Purpose:** Role-based route access; returns true if user has any of the specified roles.
- **Contract:** `roleGuard(...allowedRoles: string[]): CanActivateFn` — checks `AuthService.hasAnyRole(roles)`, else `UrlTree` to `/dashboard`
- **Usage map:** Applied on admin/manager routes in `app.routes.ts`

---

### rootRedirectGuard
- **Status:** source-confirmed
- **File:** `shared/guards/root-redirect.guard.ts:11`
- **Type:** guard (CanActivateFn)
- **Purpose:** Branches root path `/` to demo welcome or production dashboard.
- **Contract:** Returns `UrlTree` to `/welcome` (demo) or `/dashboard` (production)
- **Usage map:** Root `''` route in `app.routes.ts`

---

### setupRequiredGuard / setupCompleteGuard
- **Status:** source-confirmed
- **File:** `shared/guards/setup.guard.ts:7`
- **Type:** guards (CanActivateFn × 2)
- **Purpose:** `setupRequiredGuard` blocks `/setup` after setup completes; `setupCompleteGuard` blocks feature routes until setup is done.
- **Contract:**
  - `setupRequiredGuard` → `/login` if setup already complete
  - `setupCompleteGuard` → `/setup` if setup not yet complete
- **Usage map:** `/setup` route and protected feature routes

---

### unsavedChangesGuard
- **Status:** source-confirmed
- **File:** `shared/guards/unsaved-changes.guard.ts:15`
- **Type:** guard (CanDeactivateFn)
- **Purpose:** Prevents navigation away from dirty forms; opens ConfirmDialog for user confirmation.
- **Contract:** Generic `CanDeactivateFn<HasDirtyForm>` — component must implement `isDirty(): boolean`; returns `Observable<boolean>`
- **Usage map:** Applied on form-heavy routes (edit pages, wizard steps)

---

## 5. Interceptors

> Root: `forge-ui/src/app/shared/interceptors/`

---

### authInterceptor
- **Status:** source-confirmed
- **File:** `shared/interceptors/auth.interceptor.ts:15`
- **Type:** interceptor (HttpInterceptorFn)
- **Purpose:** Attaches Bearer token to own-API requests; 401 → refresh token + retry; redirect to login on auth failure. Skips `/portal/*`.
- **Contract:** Injects `Authorization: Bearer ${token}`; guards concurrent refresh with `isRefreshing` flag; calls `AuthService.refreshAccessToken()`
- **Usage map:** Registered in `app.config.ts withInterceptors([...])`

---

### capabilityGateInterceptor
- **Status:** source-confirmed
- **File:** `shared/interceptors/capability-gate.interceptor.ts:52`
- **Type:** interceptor (HttpInterceptorFn)
- **Purpose:** Layer-3 capability gate — short-circuits requests to disabled endpoints before they leave the browser.
- **Contract:** Resolves URL → capability code via `CapabilityEndpointRegistry.resolveCapabilityForUrl()`; throws `CapabilityDisabledError` if known+disabled
- **Usage map:** Registered BEFORE `httpErrorInterceptor` in `app.config.ts`

---

### dateTransformInterceptor
- **Status:** source-confirmed
- **File:** `shared/interceptors/date-transform.interceptor.ts:21`
- **Type:** interceptor (HttpInterceptorFn)
- **Purpose:** Recursively transforms ISO 8601 date strings in response bodies to Date objects.
- **Contract:** Maps response body via `transformDates()`; matches ISO_DATE_REGEX; handles nested arrays/objects
- **Usage map:** Registered in `app.config.ts` for automatic deserialization

---

### demoAggregatesSynth (demo-aggregate-synth.ts)
- **Status:** source-confirmed
- **File:** `shared/interceptors/demo-aggregate-synth.ts:1`
- **Type:** utility (not an interceptor class — functions used by demoApiInterceptor)
- **Purpose:** Synthesizes computed aggregate API responses (dashboard KPIs, reports, OEE) from demo data files.
- **Contract:** `synthesizeAggregate(url: string, store: DemoDataStore): Promise<unknown>` — maps URL patterns to computed results
- **Usage map:** Called internally by demoApiInterceptor

---

### demoApiInterceptor
- **Status:** source-confirmed
- **File:** `shared/interceptors/demo-api.interceptor.ts:28`
- **Type:** interceptor (HttpInterceptorFn)
- **Purpose:** In demo mode, synthesizes all API responses from `/demo-data/*.json` files; registered FIRST to prevent auth interceptor from attaching tokens.
- **Contract:** Passes through static assets/external URLs; handles auth endpoints specially; delegates to `handleApi()` + `synthesizeAggregate()`
- **Usage map:** Conditionally registered `if (environment.demoMode)` at position 0 in `app.config.ts`

---

### demoUrlMap (demo-url-map.ts)
- **Status:** source-confirmed
- **File:** `shared/interceptors/demo-url-map.ts:1`
- **Type:** utility (not an interceptor — URL mapping table used by demoApiInterceptor)
- **Purpose:** Maps API endpoint patterns to demo data file names and entity shapes.
- **Contract:** `DEMO_URL_MAP: Record<string, DemoUrlEntry>` — pattern → `{ file, idField, ... }`
- **Usage map:** Referenced by demoApiInterceptor

---

### etagInterceptor
- **Status:** source-confirmed
- **File:** `shared/interceptors/etag.interceptor.ts:36`
- **Type:** interceptor (HttpInterceptorFn)
- **Purpose:** Optimistic locking — caches ETags from responses; injects `If-Match` on PATCH/PUT/DELETE; notifies ConcurrencyConflictService on 412.
- **Contract:** Caches ETag from response headers + body `rowVersion`; injects cached ETag on mutating requests
- **Usage map:** Registered in `app.config.ts` (before httpErrorInterceptor)

---

### httpErrorInterceptor
- **Status:** source-confirmed
- **File:** `shared/interceptors/http-error.interceptor.ts:12`
- **Type:** interceptor (HttpInterceptorFn)
- **Purpose:** Global error handler — translates HTTP errors to user-facing toasts/snackbars; handles 400/403/409/422/0/5xx with appropriate UI.
- **Contract:** Catches HttpErrorResponse; parses capability-disabled 403s + server validation envelopes; suppresses external-URL errors; rethrows
- **Usage map:** Registered after capabilityGateInterceptor in `app.config.ts`

---

### kioskTokenInterceptor
- **Status:** source-confirmed
- **File:** `shared/interceptors/kiosk-token.interceptor.ts:10`
- **Type:** interceptor (HttpInterceptorFn)
- **Purpose:** Attaches kiosk device token from localStorage to shop-floor and allowlisted endpoints.
- **Contract:** Injects `X-Kiosk-Device-Token` header on `/display/shop-floor` routes + KIOSK_ALLOWLIST_PATTERNS; reads from `forge-kiosk-device-token` localStorage key
- **Usage map:** Registered in `app.config.ts` for kiosk terminal auth

---

## 6. Services

> Root: `forge-ui/src/app/shared/services/`

---

### AccountingService
- **Status:** source-confirmed | **File:** `shared/services/accounting.service.ts:17` | **Injectable:** root
- **Purpose:** Accounting provider configuration, employee/item lists, OAuth connect/disconnect, sync status.
- **Contract:** `load()`, `loadProviders()`, `setActiveProvider(id)`, `loadEmployees()`, `loadItems()`, `loadSyncStatus()`, `testConnection()`, `connectOAuth(id)`, `disconnect()` | Signals: `providers`, `employees`, `items`, `syncStatus`, `loading` | Computed: `isStandalone()`, `isConfigured()`, `providerName()`, `providerId()`
- **Key deps:** HttpClient
- **Usage map:** `features/admin/` accounting settings surface

---

### AddressService
- **Status:** source-confirmed | **File:** `shared/services/address.service.ts:9` | **Injectable:** root
- **Purpose:** Validate addresses via `/api/v1/addresses/validate`.
- **Contract:** `validate(address: Address): Observable<AddressValidationResult>`
- **Key deps:** HttpClient
- **Usage map:** `shared/components/address-form/` (AddressFormComponent)

---

### AiService
- **Status:** source-confirmed | **File:** `shared/services/ai.service.ts:53` | **Injectable:** root
- **Purpose:** AI generation, summarization, RAG search, streaming chat; capability-gated (CAP-EXT-AI-ASSISTANT).
- **Contract:** `checkAvailability()`, `generate(prompt)`, `summarize(text)`, `searchSuggest(query)`, `helpChat(q, history?)`, `streamHelpChat(q, history?)`, `ragSearch(q, filter?, includeAnswer?)`, `ragHelpChat(msg, history?)`, `indexDocument(type, id)`, `getAssistants()`, `assistantChat(id, q, history?)` | Signals: `available`, `checking`, `capabilityDisabled`
- **Key deps:** HttpClient, CapabilityService
- **Usage map:** `features/ai-help-panel/`, RAG search surfaces

---

### AnnouncementService
- **Status:** source-confirmed | **File:** `shared/services/announcement.service.ts:17` | **Injectable:** root
- **Purpose:** Load, create, and manage system announcements with SignalR push; capability-gated.
- **Contract:** `loadActive()`, `getAll()`, `create(req)`, `acknowledge(id)`, `getAcknowledgments(id)`, `getTemplates()`, `createTemplate(req)`, `deleteTemplate(id)`, `pushAnnouncement(ann)`, `markAcknowledged(id)`, `onAnnouncementCreated(listener)` | Signals: `activeAnnouncements`, `pendingAnnouncements`, `unacknowledgedCount`, `capabilityDisabled`
- **Key deps:** HttpClient, CapabilityService
- **Usage map:** `features/admin/announcements/`, AnnouncementOverlayComponent

---

### AppUpdateService
- **Status:** source-confirmed | **File:** `shared/services/app-update.service.ts:18` | **Injectable:** root
- **Purpose:** Service Worker update detection; prompts user to reload.
- **Contract:** `init(): void`
- **Key deps:** SwUpdate, MatSnackBar
- **Usage map:** `app.component.ts` (init on auth)

---

### AuthService
- **Status:** source-confirmed | **File:** `shared/services/auth.service.ts:69` | **Injectable:** root
- **Purpose:** Authentication, token management, session expiry, SSO, PIN, MFA, logout.
- **Contract:** `login(creds)`, `completeMfaLogin(token)`, `kioskLogin(barcode, pin)`, `setup(data)`, `completeSetup(data)`, `checkSetupStatus()`, `validateSetupToken(token)`, `setPin(pin)`, `getSsoProviders()`, `ssoLogin(provider)`, `handleSsoToken(token)`, `getLinkedSsoProviders()`, `unlinkSso(provider)`, `refreshAccessToken()`, `logout()`, `clearAuth()`, `refreshUser(partial)`, `hasRole(role)`, `hasAnyRole(roles)`, `registerBroadcastCallback(fn)`, `registerBeforeLogoutCallback(fn)` | Signals: `token`, `user` | Computed: `isAuthenticated`
- **Key deps:** HttpClient, Router, MatDialog
- **Usage map:** all guards, interceptors, and authenticated feature components

---

### BarcodeService
- **Status:** source-confirmed | **File:** `shared/services/barcode.service.ts:16` | **Injectable:** root
- **Purpose:** Fetch and regenerate entity barcodes.
- **Contract:** `getEntityBarcodes(type, id)`, `regenerateBarcode(type, id, naturalId)`
- **Key deps:** HttpClient
- **Usage map:** BarcodeInfoComponent

---

### BoardHubService
- **Status:** source-confirmed | **File:** `shared/services/board-hub.service.ts:7` | **Injectable:** root
- **Purpose:** SignalR hub for real-time board/job events (job created/moved/updated/position/subtask).
- **Contract:** `connect()`, `disconnect()`, `joinBoard(trackTypeId)`, `leaveBoard()`, `joinJob(jobId)`, `leaveJob()`, `onJobCreatedEvent(cb)`, `onJobMovedEvent(cb)`, `onJobUpdatedEvent(cb)`, `onJobPositionChangedEvent(cb)`, `onSubtaskChangedEvent(cb)`
- **Key deps:** SignalrService
- **Usage map:** `features/kanban/` board page

---

### BrandingService
- **Status:** source-confirmed | **File:** `shared/services/branding.service.ts:22` | **Injectable:** root
- **Purpose:** Resolve branding lockup URLs (wordmark, marquee, favicon) with cache-busting.
- **Contract:** `refresh()` | Computed: `wordmarkUrl`, `marqueeUrl`, `faviconUrl`
- **Key deps:** ThemeService
- **Usage map:** app shell header, auth pages

---

### BroadcastService
- **Status:** source-confirmed | **File:** `shared/services/broadcast.service.ts:18` | **Injectable:** root
- **Purpose:** Cross-tab communication via BroadcastChannel for logout/theme sync.
- **Contract:** `initialize()`, `send(channel, data)`, `sendChatEvent(event)`, `ngOnDestroy()`
- **Key deps:** Router, AuthService, ThemeService, SignalrService
- **Usage map:** `app.component.ts`

---

### CacheService
- **Status:** source-confirmed | **File:** `shared/services/cache.service.ts:14` | **Injectable:** root
- **Purpose:** IndexedDB key/value cache with lastSynced timestamp.
- **Contract:** `get<T>(key)`, `set(key, data)`, `clear(key?)`, `clearAll()`
- **Key deps:** none
- **Usage map:** ReferenceDataService, other data services needing offline cache

---

### CapabilityInstallStateService
- **Status:** source-confirmed | **File:** `shared/services/capability-install-state.service.ts:23` | **Injectable:** root
- **Purpose:** Track per-install capability onboarding banner dismissal (localStorage).
- **Contract:** `dismiss()`, `reset()` | Signal: `dismissed`
- **Usage map:** capability onboarding banner component (admin)

---

### CapabilityService
- **Status:** source-confirmed | **File:** `shared/services/capability.service.ts:31` | **Injectable:** root
- **Purpose:** Load and manage capability descriptor; synchronous `isEnabled`/`isKnown` snapshots; optimistic mutation with ETags.
- **Contract:** `load()`, `isEnabled(code)`, `isKnown(code)`, `getETag(code)`, `getConfigETag(code)`, `getEntry(code)`, `setEnabled(code, enabled, reason?)`, `setConfig(code, json, reason?)`, `bulkToggle(items, reason?)`, `getRelations(code)`, `getAuditLog(code, opts?)`, `validate(items)`, `clear()` | Signals: `descriptor`, `loading` | Computed: `capabilities`
- **Key deps:** HttpClient
- **Usage map:** CapDirective, CapNotDirective, capabilityGateInterceptor, AiService, AnnouncementService, `features/admin/capability/`

---

### ChatHubService
- **Status:** source-confirmed | **File:** `shared/services/chat-hub.service.ts:12` | **Injectable:** root
- **Purpose:** SignalR hub for real-time chat messages and announcement push.
- **Contract:** `connect()`, `disconnect()`, `joinChannel(id)`, `leaveChannel(id)`, `onMessageReceived(cb)`, `onRoomMessageReceived(cb)`, `clearMessageCallbacks()`
- **Key deps:** SignalrService, AnnouncementService, ChatNotificationService, AuthService
- **Usage map:** `features/chat/` page

---

### ChatNotificationService
- **Status:** source-confirmed | **File:** `shared/services/chat-notification.service.ts:18` | **Injectable:** root
- **Purpose:** Chat notification sound/vibration/preview popup management with UserPreference persistence.
- **Contract:** `notifyIncomingMessage(event)`, `clearLatest()`, `setSoundEnabled(bool)`, `setVibrateEnabled(bool)`, `setPreviewPopupEnabled(bool)`, `setSoundType(type)` | Signal: `latestIncomingMessage` | Getters: `soundEnabled`, `vibrateEnabled`, `previewPopupEnabled`, `soundType`
- **Key deps:** UserPreferencesService, LayoutService
- **Usage map:** ChatPreviewPopupComponent, ChatHubService

---

### ClockEventTypeService
- **Status:** source-confirmed | **File:** `shared/services/clock-event-type.service.ts:33` | **Injectable:** root
- **Purpose:** Clock event type definitions with status display helpers.
- **Contract:** `load()`, `getStatusInfo(status)`, `getStatusCssClass(status)`, `getShortLabel(status)`, `getLabel(status)`, `isActive(status)`, `isWorking(status)`, `isOnBreakOrLunch(status)`, `isClockedOut(status)`, `getAvailableActions(currentStatus)` | Signal: `definitions`
- **Key deps:** HttpClient
- **Usage map:** `features/shop-floor/clock/`, time-tracking features

---

### ConcurrencyConflictService
- **Status:** source-confirmed | **File:** `shared/services/concurrency-conflict.service.ts:32` | **Injectable:** root
- **Purpose:** Surface 412 conflicts via ConcurrencyConflictDialog; coalesces simultaneous conflicts.
- **Contract:** `notify(evt: ConcurrencyConflictEvent)` — shows dialog, clears ETag on reload
- **Key deps:** MatDialog, ETagCacheService
- **Usage map:** etagInterceptor (on 412 response)

---

### ConsultantModeService
- **Status:** source-confirmed | **File:** `shared/services/consultant-mode.service.ts:18` | **Injectable:** root
- **Purpose:** UI flag showing capability codes and consultant-tier discovery questions.
- **Contract:** `toggle()`, `set(value)` | Signal: `enabled`
- **Usage map:** `features/admin/capability/`, discovery wizard

---

### CurrencyService
- **Status:** source-confirmed | **File:** `shared/services/currency.service.ts:19` | **Injectable:** root
- **Purpose:** Load installation base currency for pricing display.
- **Contract:** `load(): Observable<string>` | Signal: `baseCurrency`
- **Key deps:** HttpClient
- **Usage map:** CurrencyDisplayComponent, pricing forms

---

### DemoDataStore
- **Status:** source-confirmed | **File:** `shared/services/demo-data-store.service.ts:18` | **Injectable:** root
- **Purpose:** Demo-mode in-memory mutable store; lazy-loads `/demo-data/*.json`.
- **Contract:** `load(file)`, `peek(file)`, `append(file, row)`, `update(file, id, patch)`, `remove(file, id)`, `allocateId()`
- **Key deps:** HttpClient
- **Usage map:** demoApiInterceptor, demoAggregatesSynth

---

### DetailDialogService
- **Status:** source-confirmed | **File:** `shared/services/detail-dialog.service.ts:15` | **Injectable:** root
- **Purpose:** Centralized detail dialog opener with `?detail=type:id` URL sync.
- **Contract:** `open<T,D,R>(entityType, entityId, component, data, config?)`, `getDetailFromUrl()`
- **Key deps:** MatDialog, Router
- **Usage map:** EntityLinkComponent, feature detail-panel openers

---

### DiscoveryService
- **Status:** source-confirmed | **File:** `shared/services/discovery.service.ts:30` | **Injectable:** root
- **Purpose:** Discovery wizard state + API (Phase 4 Phase-F) — questions, answers, recommendations, preset apply.
- **Contract:** `loadQuestions(consultant?)`, `setConsultantMode(bool)`, `setAnswer(id, val)`, `clearAnswer(id)`, `reset()`, `preview()`, `apply(presetId)` | Signals: `questions`, `answers`, `recommendation`, `consultantMode`, `loading`, `previewing`, `applying` | Computed: `headcountBucket`, `mode`, `sitesBucket`, `branch`, `visibleQuestions`, `canPreview`
- **Key deps:** HttpClient
- **Usage map:** `features/admin/discovery/`

---

### DraftBroadcastService
- **Status:** source-confirmed | **File:** `shared/services/draft-broadcast.service.ts:13` | **Injectable:** root
- **Purpose:** Cross-tab draft sync via BroadcastChannel.
- **Contract:** `initialize()`, `broadcastDraftUpdated(key, draft)`, `broadcastDraftCleared(key)`, `broadcastEntitySaved(type, id)`, `ngOnDestroy()` | Signal: `lastEvent`
- **Usage map:** DraftService

---

### DraftRecoveryService
- **Status:** source-confirmed | **File:** `shared/services/draft-recovery.service.ts:21` | **Injectable:** root
- **Purpose:** Post-login recovery prompts; before-logout checks; TTL expiry.
- **Contract:** `onLogin()`, `checkBeforeLogout()`, `cancelTtlCheck()`
- **Key deps:** DraftService, MatDialog, Router
- **Usage map:** `app.component.ts` (post-login), AuthService before-logout callback

---

### DraftStorageService
- **Status:** source-confirmed | **File:** `shared/services/draft-storage.service.ts:10` | **Injectable:** root
- **Purpose:** IndexedDB CRUD for draft forms (`forge-drafts` DB).
- **Contract:** `get(key)`, `getByUser(userId)`, `put(draft)`, `delete(key)`, `resetTtlForUser(userId)`
- **Usage map:** DraftService

---

### DraftService
- **Status:** source-confirmed | **File:** `shared/services/draft.service.ts:24` | **Injectable:** root
- **Purpose:** Draft registration, debounced auto-save, recovery, and cross-tab sync orchestrator.
- **Contract:** `register(form)`, `unregister(type, id)`, `saveDraft(form)`, `loadDraft(type, id)`, `clearDraft(type, id)`, `clearDraftAndBroadcastSave(type, id)`, `getUserDrafts()`, `resetAllTtl()`, `getExpiredDrafts()`, `purgeExpired()`, `refreshHasDrafts()`, `getTtl()` | Signals: `hasDrafts`, `activeDraftKey`
- **Key deps:** AuthService, DraftStorageService, DraftBroadcastService, UserPreferencesService, SnackbarService
- **Usage map:** DialogComponent (auto-save), DraftRecoveryService

---

### EntityActivityService
- **Status:** source-confirmed | **File:** `shared/services/entity-activity.service.ts:40` | **Injectable:** root
- **Purpose:** Entity activity, history, notes, and comments CRUD.
- **Contract:** `getActivity(type, id)`, `getHistory(type, id)`, `getNotes(type, id)`, `createNote(type, id, text, mentionIds?)`, `deleteNote(type, id, noteId)`, `postComment(type, id, comment, mentionIds?)`, `getMentionUsers()`
- **Key deps:** HttpClient
- **Usage map:** EntityActivitySectionComponent, RecentCommunicationsComponent

---

### EntityCompletenessService
- **Status:** source-confirmed | **File:** `shared/services/entity-completeness.service.ts:20` | **Injectable:** root
- **Purpose:** Per-entity capability-completeness fetch with in-memory ref-counted cache.
- **Contract:** `getCompleteness(type, id)`, `invalidate(type, id)`, `invalidateAll()`, `seed(type, id, value)`
- **Key deps:** HttpClient
- **Usage map:** EntityCompletenessBadgeComponent, EntityCompletenessChipComponent

---

### ETagCacheService
- **Status:** source-confirmed | **File:** `shared/services/etag-cache.service.ts:13` | **Injectable:** root
- **Purpose:** In-memory ETag cache for optimistic concurrency.
- **Contract:** `get(key)`, `set(key, value)`, `clear(key?)`, `size()`
- **Usage map:** etagInterceptor, ConcurrencyConflictService

---

### FollowUpTaskService
- **Status:** source-confirmed | **File:** `shared/services/follow-up-task.service.ts:10` | **Injectable:** root
- **Purpose:** Fetch, complete, and dismiss follow-up tasks.
- **Contract:** `getTasks(status?)`, `completeTask(id)`, `dismissTask(id)`
- **Key deps:** HttpClient
- **Usage map:** dashboard follow-up task widget

---

### FormValidationService
- **Status:** source-confirmed | **File:** `shared/services/form-validation.service.ts:48` | **Injectable:** N/A (static-only)
- **Purpose:** Derives form violation messages; applies/clears server validation errors.
- **Contract (static):** `getViolations(form, labels): Signal<string[]>`, `collectViolations(form, labels): string[]`, `collectViolationItems(form, labels): ViolationItem[]`, `getViolationItems(form, labels): Signal<ViolationItem[]>`, `applyServerError(form, error)`, `clearServerErrors(form)`
- **Usage map:** all CRUD dialog components (ValidationButtonComponent integration)

---

### HelpTourService
- **Status:** source-confirmed | **File:** `shared/services/help-tour.service.ts:29` | **Injectable:** root
- **Purpose:** Register and launch driver.js guided tours; resume from `?tutorial=<id>`.
- **Contract:** `register(tour)`, `start(tourId)`, `startSteps(steps, tourId)`, `isRegistered(tourId)` | Getter: `isRunning`
- **Key deps:** Router
- **Usage map:** TourService, feature components on init

---

### IdleService
- **Status:** source-confirmed | **File:** `shared/services/idle.service.ts:13` | **Injectable:** root
- **Purpose:** Track user activity; compute idle state by configured timeout.
- **Contract:** `configure(ms)`, `reset()` | Computed: `isIdle`
- **Usage map:** kiosk session management, ambient idle handling

---

### KeyboardShortcutsService
- **Status:** source-confirmed | **File:** `shared/services/keyboard-shortcuts.service.ts:15` | **Injectable:** root
- **Purpose:** Global keyboard shortcut registry with chord support and help dialog.
- **Contract:** `initialize()`, `destroy()`, `register(shortcut)`, `unregister(key, modifiers?, chord?)`, `getAll()`, `toggleHelp()`, `closeHelp()` | Signals: `helpOpen`, `chordActive`
- **Key deps:** Router
- **Usage map:** `app.component.ts` init; KeyboardShortcutsHelpComponent

---

### KioskSessionService
- **Status:** source-confirmed | **File:** `shared/services/kiosk-session.service.ts:23` | **Injectable:** root
- **Purpose:** Multi-session kiosk mode with IndexedDB persistence and timeout management.
- **Contract:** `activateSession(userId, name, initials, color, badgeId)`, `backgroundCurrentSession()`, `setMode(mode)`, `setWorkflowState(state)`, `clearMode()`, `removeSession(userId)`, `getSession(userId)`, `enableTrainingMode()`, `disableTrainingMode()` | Signals: `sessions`, `isTrainingMode` | Computed: `foregroundSession`, `sessionCount`
- **Usage map:** `features/shop-floor/` kiosk components

---

### LabelPrintService
- **Status:** source-confirmed | **File:** `shared/services/label-print.service.ts:13` | **Injectable:** root
- **Purpose:** Generate barcode/QR images and open print dialog (lazy-loads bwip-js).
- **Contract:** `generateBarcodeDataUrl(value, bcid?, scale?)`, `generateQrDataUrl(value, scale?)`, `printLabels(labels[])`
- **Usage map:** ProductionLabelComponent, BarcodeInfoComponent

---

### LanguageService
- **Status:** source-confirmed | **File:** `shared/services/language.service.ts:8` | **Injectable:** root
- **Purpose:** Application language/locale management with localStorage persistence.
- **Contract:** `initialize()`, `setLanguage(lang)` | Signal: `currentLanguage` | Array: `availableLanguages`
- **Key deps:** TranslateService
- **Usage map:** account settings, app init

---

### LayoutService
- **Status:** source-confirmed | **File:** `shared/services/layout.service.ts:9` | **Injectable:** root
- **Purpose:** Viewport breakpoints, sidebar/menu state, mobile detection, route categorization.
- **Contract:** `toggleSidebar()`, `expandSidebar()`, `closeMobileMenu()`, `getDefaultRoute()` | Signals: `sidebarCollapsed`, `mobileMenuOpen`, `isMobile`, `isDisplayRoute`, `isAccountRoute`, `isAuthRoute`, `isOnboardingRoute` | Computed: `isMobileDevice`, `sidebarVisible`, `sidebarExpanded`
- **Key deps:** Router, NgZone
- **Usage map:** app shell (sidebar, header), ChatNotificationService

---

### LoadingService
- **Status:** source-confirmed | **File:** `shared/services/loading.service.ts:10` | **Injectable:** root
- **Purpose:** Multi-cause global loading state tracker.
- **Contract:** `track<T>(msg, obs)`, `trackPromise<T>(msg, promise)`, `start(key, msg)`, `stop(key)`, `clear()` | Signals: `causes` | Computed: `isLoading`, `message`
- **Usage map:** LoadingOverlayComponent, RouteLoadingService

---

### NavTreeService
- **Status:** source-confirmed | **File:** `shared/services/nav-tree.service.ts:10` | **Injectable:** root
- **Purpose:** Navigation tree with role-based filtering, breadcrumb/drill trail resolution.
- **Contract:** Signals: `pinnedTopTree`, `mainTree`, `bottomTree` | Computed: `breadcrumbTrail`, `drillTrail`
- **Key deps:** AuthService, Router
- **Usage map:** app shell sidebar, breadcrumb component

---

### NotificationHubService
- **Status:** source-confirmed | **File:** `shared/services/notification-hub.service.ts:1` | **Injectable:** root
- **Purpose:** SignalR hub for server-pushed notifications and capability-change broadcasts.
- **Contract:** `connect()`, `disconnect()`
- **Key deps:** SignalrService, NotificationService, CapabilityService
- **Usage map:** `app.component.ts` post-auth init

---

### NotificationService
- **Status:** source-confirmed | **File:** `shared/services/notification.service.ts:1` | **Injectable:** root
- **Purpose:** In-memory notification list with filtering, pinning, and CRUD.
- **Contract:** `load()`, `push(notification)`, `togglePanel()`, `closePanel()`, `setTab(tab)`, `setFilter(partial)`, `markAsRead(id)`, `markAllRead()`, `dismiss(id)`, `dismissAll()`, `togglePin(id)` | Signals: `notifications`, `panelOpen`, `filter`, `unreadCount`, `filteredNotifications`
- **Key deps:** HttpClient
- **Usage map:** NotificationPanelComponent, NotificationHubService

---

### OfflineQueueService
- **Status:** source-confirmed | **File:** `shared/services/offline-queue.service.ts:1` | **Injectable:** root
- **Purpose:** IndexedDB-backed offline request queue with conflict resolution.
- **Contract:** `enqueue(method, url, body?, desc?)`, `drain()`, `resolveConflictKeepMine(entryId)`, `resolveConflictKeepServer(entryId)`, `resolveConflictCancel()`, `getQueueSize()`, `clearQueue()` | Signals: `pendingCount`, `syncing`, `lastSyncResult`, `conflict`
- **Key deps:** HttpClient
- **Usage map:** OfflineBannerComponent, SyncConflictDialogComponent

---

### OutboundCallService
- **Status:** source-confirmed | **File:** `shared/services/outbound-call.service.ts:1` | **Injectable:** root
- **Purpose:** Vendor-neutral outbound call abstraction (TelLink default; Asterisk self-hosted option).
- **Contract:** `providerId: string`, `providerName: string`, `isAvailable: boolean`, `capabilities: { programmaticDial, recording, voicemailDrop }`, `placeCall(phone, context?)`
- **Key deps:** HttpClient (Asterisk impl)
- **Usage map:** Queue, lead detail, customer detail dial buttons

---

### PresetService
- **Status:** source-confirmed | **File:** `shared/services/preset.service.ts:1` | **Injectable:** root
- **Purpose:** Phase 4 Phase-G preset browser — 8-preset catalog, compare matrix, apply preview/execute.
- **Contract:** `loadPresets()`, `getPreset(id)`, `compare(presetIds)`, `previewApply(id)`, `apply(id, reason?)`, `previewCustom(overrides)`, `applyCustom(overrides, reason?)` | Signals: `presets`, `selected`, `loading`, `detailLoading`, `previewing`, `applying`, `comparing`
- **Key deps:** HttpClient
- **Usage map:** `features/admin/presets/`

---

### ReferenceDataService
- **Status:** source-confirmed | **File:** `shared/services/reference-data.service.ts:1` | **Injectable:** root
- **Purpose:** Cached lookup tables for hierarchical reference data and role enumeration.
- **Contract:** `getByGroup(code)`, `getAsOptions(code, opts?)`, `getRoles()`, `getRolesAsOptions(allLabel?)`, `clearCache()`, `clearGroupCache(code)`
- **Key deps:** HttpClient
- **Usage map:** admin master-data management, form select options across 28+ feature forms

---

### RouteLoadingService
- **Status:** source-confirmed | **File:** `shared/services/route-loading.service.ts:1` | **Injectable:** root
- **Purpose:** Auto-shows global loading overlay during route transitions (NavigationStart → NavigationEnd/Cancel/Error) with minimum display time.
- **Contract:** `initialize()`
- **Key deps:** Router, LoadingService
- **Usage map:** `app.component.ts`

---

### ScanActionService
- **Status:** source-confirmed | **File:** `shared/services/scan-action.service.ts:1` | **Injectable:** root
- **Purpose:** HTTP API client for scanner actions (move/count/receive/issue) and device management.
- **Contract:** `getContext(partId)`, `move(req)`, `count(req)`, `receive(req)`, `issue(req)`, `reverseScanAction(logId, pin)`, `getScanLog(userId?, date?, actionType?)`, `getDevices()`, `pairDevice(deviceId, name?)`, `unpairDevice(id)`
- **Key deps:** HttpClient
- **Usage map:** `features/shop-floor/scan/` components

---

### ScannerService
- **Status:** source-confirmed | **File:** `shared/services/scanner.service.ts:1` | **Injectable:** root
- **Purpose:** Unified barcode/RFID keyboard-wedge and WebHID scan handler with context scoping.
- **Contract:** `start()`, `stop()`, `restart()`, `setContext(ctx)`, `enable()`, `disable()`, `clearLastScan()` | Signals: `context`, `lastScan`, `enabled`, `listening`, `hasRecentScan`
- **Key deps:** NgZone, WebHidRfidService
- **Usage map:** `features/shop-floor/` scan surfaces, BarcodeScanInputComponent

---

### SearchService
- **Status:** source-confirmed | **File:** `shared/services/search.service.ts:1` | **Injectable:** root
- **Purpose:** Global entity search API.
- **Contract:** `search(term, limit?)`: `Observable<SearchResult[]>`
- **Key deps:** HttpClient
- **Usage map:** global search bar (192+ feature files)

---

### SignalrService
- **Status:** source-confirmed | **File:** `shared/services/signalr.service.ts:1` | **Injectable:** root
- **Purpose:** HubConnection factory + lifecycle manager; multi-hub; auto-reconnect; demo-mode stubbing.
- **Contract:** `getOrCreateConnection(hubPath)`, `startConnection(hubPath)`, `stopConnection(hubPath)`, `stopAll()` | Signals: `connectionState`, `hasEverConnected`
- **Key deps:** AuthService, @microsoft/signalr
- **Usage map:** NotificationHubService, BoardHubService, ChatHubService, TimerHubService; ConnectionBannerComponent

---

### SnackbarService
- **Status:** source-confirmed | **File:** `shared/services/snackbar.service.ts:1` | **Injectable:** root
- **Purpose:** Material snackbar with severity levels and optional navigation action.
- **Contract:** `success(msg)`, `info(msg)`, `warn(msg)`, `error(msg)`, `successWithNav(msg, route, label)`
- **Key deps:** MatSnackBar, Router
- **Usage map:** CRUD save confirmations, error fallbacks

---

### StatusTrackingService
- **Status:** source-confirmed | **File:** `shared/services/status-tracking.service.ts:1` | **Injectable:** root
- **Purpose:** Entity status history and workflow hold/release API.
- **Contract:** `getHistory(type, id)`, `getActiveStatus(type, id)`, `setWorkflowStatus(type, id, req)`, `addHold(type, id, req)`, `releaseHold(holdId, req?)`
- **Key deps:** HttpClient
- **Usage map:** StatusTimelineComponent, AddHoldDialogComponent, SetStatusDialogComponent

---

### TerminologyService
- **Status:** source-confirmed | **File:** `shared/services/terminology.service.ts:1` | **Injectable:** root
- **Purpose:** Three-tier terminology resolver: per-install overrides → ngx-translate → humanize-key fallback.
- **Contract:** `load()`, `resolve(key)`, `set(key, label)` | Signal: `labels`
- **Key deps:** HttpClient, TranslateService
- **Usage map:** TerminologyPipe, admin terminology editor, all entity/status labels

---

### ThemeService
- **Status:** source-confirmed | **File:** `shared/services/theme.service.ts:1` | **Injectable:** root
- **Purpose:** Dark/light theme, font scaling, brand colors — localStorage persisted.
- **Contract:** `toggle()`, `applyThemeFromBroadcast(theme)`, `registerBroadcastCallback(fn)`, `setBrandColors(primary?, accent?)`, `setFontScale(scale)`, `loadBrandSettings()` | Signals: `theme`, `fontScale`, `appName`, `logoUrl`
- **Key deps:** HttpClient
- **Usage map:** app shell header, account customization, BroadcastService

---

### TimerHubService
- **Status:** source-confirmed | **File:** `shared/services/timer-hub.service.ts:1` | **Injectable:** root
- **Purpose:** SignalR group-based timer event broadcaster for cross-tab time-tracking sync.
- **Contract:** `connect()`, `disconnect()`, `joinUserGroup(userId)`, `leaveUserGroup()`, `onTimerStartedEvent(cb)`, `onTimerStoppedEvent(cb)`, `clearCallbacks()`
- **Key deps:** SignalrService
- **Usage map:** `features/time-tracking/`, shop-floor clock

---

### ToastService
- **Status:** source-confirmed | **File:** `shared/services/toast.service.ts:1` | **Injectable:** root
- **Purpose:** Toast queue (max 5 visible) with deduplication, auto-dismiss, and capability-noise filtering.
- **Contract:** `show(options: { severity, title, message, details?, autoDismissMs? })`, `dismiss(id)` | Signal: `toasts`
- **Usage map:** ToastComponent, httpErrorInterceptor, form submissions

---

### TourService
- **Status:** source-confirmed | **File:** `shared/services/tour.service.ts:1` | **Injectable:** root
- **Purpose:** Driver.js tour orchestrator with localStorage completion tracking, URL query param reflection, and SVG connector overlay.
- **Contract:** `startTour(tour, force?)`, `startFromUrl(tourId, tour)`, `resetTour(tourId)`, `resetAllTours()`
- **Key deps:** UserPreferencesService, Router, driver.js
- **Usage map:** feature component ngOnInit; onboarding surfaces; HelpTourService

---

### UserPreferencesService
- **Status:** source-confirmed | **File:** `shared/services/user-preferences.service.ts:1` | **Injectable:** root
- **Purpose:** Dual-storage user preferences (localStorage cache + 500ms-debounced API flush).
- **Contract:** `load()`, `get<T>(key)`, `set(key, value)`, `remove(key)`, `getAll()`, `reset(key)`
- **Key deps:** HttpClient, DestroyRef
- **Usage map:** TourService, ChatNotificationService, DataTableComponent (column preferences), DraftService

---

### VersionService
- **Status:** source-confirmed | **File:** `shared/services/version.service.ts:1` | **Injectable:** root
- **Purpose:** Local + remote app version tracking for update detection.
- **Contract:** `load()`, `checkLatest()` | Signals: `local`, `latestSha`, `checking`, `upToDate`
- **Key deps:** HttpClient
- **Usage map:** about/settings, version update banner

---

### WebHidRfidService
- **Status:** source-confirmed | **File:** `shared/services/web-hid-rfid.service.ts:1` | **Injectable:** root
- **Purpose:** Dual-transport RFID reader: WebSocket relay (cross-browser) + WebHID (Chromium).
- **Contract:** `connect()`, `requestDevice()`, `disconnect()`, `reconnect()`, `probeRelay()`, `clearLastScan()`, `clearError()` | Signals: `connected`, `deviceName`, `lastScan`, `error`, `activeMode`, `webHidSupported`, `supported`
- **Key deps:** NgZone
- **Usage map:** ScannerService (RFID bridge)

---

### WorkflowResumeService
- **Status:** source-confirmed | **File:** `shared/services/workflow-resume.service.ts:1` | **Injectable:** root
- **Purpose:** Post-login soft-prompt for resuming in-flight workflow drafts (24h window).
- **Contract:** `reset()`, `checkAfterLogin()`, `openActiveList()`
- **Key deps:** WorkflowService, MatDialog, SnackbarService
- **Usage map:** `app.component.ts` post-login

---

### WorkflowStepRegistryService
- **Status:** source-confirmed | **File:** `shared/services/workflow-step-registry.service.ts:1` | **Injectable:** root
- **Purpose:** Runtime registry mapping DB step-component name strings to Angular component classes.
- **Contract:** `register(name, ctor)`, `registerExpress(name, ctor)`, `get(name)`, `getExpress(name)`, `clear()`
- **Usage map:** WorkflowComponent (step resolution), feature modules (step registration)

---

### WorkflowService
- **Status:** source-confirmed | **File:** `shared/services/workflow.service.ts:1` | **Injectable:** root
- **Purpose:** Workflow run lifecycle, local predicate evaluation for step gates, form registration, and caching.
- **Contract:** `loadDefinitionsForEntity(type)`, `loadValidatorsForEntity(type)`, `getDefinitionById(id)`, `startRun(body)`, `getRun(runId)`, `patchStep(runId, stepId, fields)`, `jumpToStep(runId, stepId)`, `completeRun(runId)`, `abandonRun(runId, reason?)`, `setMode(runId, mode)`, `listActive()`, `promoteEntityStatus(type, id, status)`, `setContext(opts)`, `clearContext()`, `registerStepForm(form, labels, save?)`, `unregisterStepForm()`, `saveCurrentStep()`, `clearCaches()` | Signals: `currentRun`, `currentDefinition`, `currentEntity`, `currentValidators`, `currentStepDirty`, `currentStepValid`, `currentStepViolations`, `mode`, `currentStepId`, `stepCompletionMap`, `canCompleteRun`
- **Key deps:** HttpClient, PredicateEvaluator
- **Usage map:** WorkflowComponent, all entity-rooted workflow surfaces (parts, customers, sales-orders, etc.)

---

### PredicateEvaluator
- **Status:** source-confirmed | **File:** `shared/services/predicate-evaluator.ts:1` | **Type:** utility class (not @Injectable)
- **Purpose:** Workflow entity-readiness DSL evaluator — mirrors C# server-side semantics for fieldPresent, fieldEquals, fieldCompare, relationExists, relationCountCompare, all/any/not, and custom predicates.
- **Contract:** `new PredicateEvaluator(registry?)`, `register(ref, fn)`, `evaluate(predicate, entity)`, `evaluateJson(json, entity)`
- **Usage map:** WorkflowService (step completion gate evaluation)

---

## 7. Models / Constants

> Root: `forge-ui/src/app/shared/models/`

---

> Models are plain TypeScript interfaces/types/constants — no runtime behavior. Listed by file; key ones detailed, rest enumerated.

### Key Model Files (detailed)

**`column-def.model.ts`** — `TextMatchMode`, `TextFilterValue`, `ColumnDef` (field, header, sortable?, filterable?, type?, filterOptions?, width?, visible?, align?, sortField?, sortValue?)

**`compliance-form-definition.model.ts`** — `ComplianceFormDefinition`, `FormPage`, `FormSection`, `FormFieldDefinition`, `FormFieldOption`, `FormFieldDependency` + `normalizeFormPages()` utility

**`draft.model.ts`** — `Draft` (key, userId, entityType, entityId, displayLabel, route, formData, lastModified)

**`capability-descriptor.model.ts`** — `CapabilityDescriptorEntry`, `CapabilityDescriptor`

**`paged-response.model.ts`** — `PagedResponse<T>`, `PagedQuery`

**`priority.const.ts`** — `PRIORITIES`, `PRIORITY_OPTIONS`, `PRIORITY_FILTER_OPTIONS`

**`credit-terms.const.ts`** — `CREDIT_TERMS_OPTIONS`, `PAYMENT_TERMS_OPTIONS`

**`nav-item.model.ts`** — `NavItem` (icon, label, i18nKey?, route?, routePrefix?, badge?, shortcut?, allowedRoles?, children?)

**`workflow-definition.model.ts`** — `WorkflowDefinition`, `WorkflowStepDefinition`

**`scan-event.model.ts`** — `ScanContext` type, `ScanEvent` interface

### All Model Files (source-confirmed, enumerated)

| File | Key exports |
|------|-------------|
| `active-status.model.ts` | `ActiveStatus` |
| `activity.model.ts` | `ActivityItem`, `ActivityFilterTab` |
| `add-hold-request.model.ts` | `AddHoldRequest` |
| `address.model.ts` | `Address` |
| `ambient-idle.model.ts` | `AmbientIdleConfig` |
| `announcement.model.ts` | `Announcement`, `AnnouncementTemplate`, `AnnouncementAcknowledgment` |
| `app-notification.model.ts` | `AppNotification` |
| `camera-capture-result.model.ts` | `CameraCaptureResult` |
| `capability-audit-entry.model.ts` | `CapabilityAuditEntry` |
| `capability-descriptor.model.ts` | `CapabilityDescriptorEntry`, `CapabilityDescriptor` |
| `capability-relations.model.ts` | `CapabilityRelations` |
| `capability-validation.model.ts` | `CapabilityValidationItem`, `CapabilityValidationResult` |
| `column-def.model.ts` | `ColumnDef`, `TextMatchMode`, `TextFilterValue` |
| `compliance-form-definition.model.ts` | `ComplianceFormDefinition`, `FormPage`, `FormSection`, `FormFieldDefinition`, `normalizeFormPages()` |
| `credit-terms.const.ts` | `CREDIT_TERMS_OPTIONS`, `PAYMENT_TERMS_OPTIONS` |
| `currency.const.ts` | currency code constants |
| `discovery-question.model.ts` | `DiscoveryQuestion`, `DiscoveryAnswer` |
| `discovery-recommendation.model.ts` | `DiscoveryRecommendation` |
| `draft-config.model.ts` | `DraftConfig` |
| `draft-ttl.model.ts` | `DraftTtl` |
| `draft.model.ts` | `Draft` |
| `draftable-form.model.ts` | `DraftableForm` interface |
| `entity-completeness.model.ts` | `EntityCompleteness` |
| `entity-note.model.ts` | `EntityNote` |
| `entity-validator.model.ts` | `EntityValidator`, `MissingValidator` |
| `file.model.ts` | `UploadedFile` |
| `follow-up-task.model.ts` | `FollowUpTask` |
| `gallery-item.model.ts` | `GalleryItem` |
| `linked-sso-provider.model.ts` | `LinkedSsoProvider` |
| `mention-user.model.ts` | `MentionUser` |
| `nav-item.model.ts` | `NavItem` |
| `notification-filter.model.ts` | `NotificationFilter` |
| `notification-tab.type.ts` | `NotificationTab` |
| `offline-queue-entry.model.ts` | `OfflineQueueEntry` |
| `paged-response.model.ts` | `PagedResponse<T>`, `PagedQuery` |
| `preset.model.ts` | `PresetSummary`, `PresetDetail`, `PresetApplyPreview`, `PresetApplyResult`, `PresetCompareResponse` |
| `priority.const.ts` | `PRIORITIES`, `PRIORITY_OPTIONS`, `PRIORITY_FILTER_OPTIONS` |
| `rag-search-response.model.ts` | `RagSearchResponse` |
| `rag-search-result.model.ts` | `RagSearchResult` |
| `release-hold-request.model.ts` | `ReleaseHoldRequest` |
| `scan-action.model.ts` | `ScanMoveRequest`, `ScanCountRequest`, `ScanReceiveRequest`, `ScanIssueRequest`, `ScanContext`, `ScanDevice` |
| `scan-event.model.ts` | `ScanEvent`, `ScanContext` type |
| `scan-log.model.ts` | `ScanLogEntry` |
| `search.model.ts` | `SearchResult` |
| `set-status-request.model.ts` | `SetStatusRequest` |
| `signalr.model.ts` | `ConnectionState` |
| `sort-state.model.ts` | `SortState` |
| `sso-provider.model.ts` | `SsoProvider` |
| `stage.model.ts` | `Stage` |
| `status-entry.model.ts` | `StatusEntry` |
| `sync-conflict.model.ts` | `SyncConflict`, `SyncConflictDialogData` |
| `sync-result.model.ts` | `SyncResult`, `DrainResult` |
| `table-preferences.model.ts` | `TablePreferences`, `SortState` |
| `timer-event.model.ts` | `TimerEvent` |
| `track-type.model.ts` | `TrackType` |
| `workflow-definition.model.ts` | `WorkflowDefinition`, `WorkflowStepDefinition` |
| `workflow-missing-validator.model.ts` | `WorkflowMissingValidator` |
| `workflow-predicate.model.ts` | `WorkflowPredicate` DSL types |
| `workflow-run.model.ts` | `WorkflowRun` |
| `workflow-step-definition.model.ts` | `WorkflowStepDefinition` |

---

## 8. Utils

> Root: `forge-ui/src/app/shared/utils/`

---

### address.utils.ts
- **Status:** source-confirmed | **File:** `shared/utils/address.utils.ts:1`
- **Purpose:** Maps between flat address fields (different naming conventions) and Address model.
- **Contract:**
  - `toAddress(fields): Address | null`
  - `fromAddressToProfile(addr): { street1, street2, city, state, zipCode, country }`
  - `fromAddressToVendor(addr): { address, address2, city, state, zipCode, country }`
- **Usage map:** employee, vendor, customer address forms

---

### date.utils.ts
- **Status:** source-confirmed | **File:** `shared/utils/date.utils.ts:1`
- **Purpose:** Date serialization, display formatting, and picker bounds.
- **Contract:**
  - `toIsoDate(date): string | null` — full ISO 8601 `T00:00:00Z`
  - `toDateOnly(date): string | null` — YYYY-MM-DD (for .NET DateOnly)
  - `formatDate(date): string` — MM/dd/yyyy
  - `formatDateTime(date): string` — MM/dd/yyyy hh:mm AM/PM
  - `formatFullName(firstName, lastName, middleInitial?): string` — Last, First MI
  - `todayStart(): Date`, `todayEnd(): Date`
  - `dateOfBirthMin(): Date`, `dateOfBirthMax(): Date` — 120y ago / 13y ago
  - Constants: `DATE_FORMAT`, `DATETIME_FORMAT`
- **Usage map:** 47+ feature files (date serialization, display)

---

### demo-mode.utils.ts
- **Status:** source-confirmed | **File:** `shared/utils/demo-mode.utils.ts:13`
- **Purpose:** Initializes demo-mode UI tells: `[DEMO]` title prefix, zero-width-joiner badge, `data-demo` attribute, console banner, favicon amber-D badge.
- **Contract:**
  - `initDemoMode(): void` — call once in AppComponent ngOnInit; guards on `environment.demoMode`
- **Usage map:** `app.component.ts`

---

### server-validation.utils.ts
- **Status:** source-confirmed | **File:** `shared/utils/server-validation.utils.ts:1`
- **Purpose:** Parses server validation error envelopes and applies per-field errors to FormGroup.
- **Contract:**
  - `parseServerValidationEnvelope(error): ServerValidationError[] | null`
  - `resolveFormControl(form, field): AbstractControl | null` — dotted path, array index, case-insensitive
  - `applyServerErrorsToForm(form, errors): ServerValidationError[]` — sets `control.errors['serverError']`
  - `clearServerErrorsOnForm(form): void`
  - Types: `ServerValidationError { field, message, rejectedValue? }`, `ServerValidationEnvelope { errors[] }`
- **Usage map:** FormValidationService.applyServerError; CRUD dialog components

---

### tour-connector.utils.ts
- **Status:** source-confirmed | **File:** `shared/utils/tour-connector.utils.ts:1`
- **Purpose:** SVG connector overlay and popover interaction layer for driver.js tours — orthogonal arrows, element highlighting, drag support, scroll-pinning.
- **Contract:**
  - `createTourSvg(): SVGSVGElement`
  - `clearTourConnector(svg): void`
  - `attachScrollRefresh(svg): () => void` — returns cleanup listener
  - `updateTourConnector(svg, opts?): void`
  - `setupPopoverDraggable(): void`
- **Usage map:** TourService (driver.js callback hooks)

---

## 9. Validators

> Root: `forge-ui/src/app/shared/validators/`

---

### passwordStrengthValidator
- **Status:** source-confirmed | **File:** `shared/validators/password-strength.validator.ts:14`
- **Purpose:** Enforces ASP.NET Identity password policy client-side: min 8 chars, 1 uppercase, 1 lowercase, 1 digit.
- **Contract:** `(control: AbstractControl): ValidationErrors | null` — returns `{ passwordStrength: { message: '...' } }` on fail
- **Usage map:** `features/auth/`, `features/account/` password fields

---

### phoneValidator
- **Status:** source-confirmed | **File:** `shared/validators/phone.validator.ts:1`
- **Purpose:** Validates `(XXX) XXX-XXXX` phone format.
- **Contract:** `Validators.pattern(/^\(\d{3}\) \d{3}-\d{4}$/)` — returns pattern validation error on mismatch
- **Usage map:** phone input fields across vendor, customer, employee forms

---

## 10. Errors

> Root: `forge-ui/src/app/shared/errors/`

---

### CapabilityDisabledError
- **Status:** source-confirmed | **File:** `shared/errors/capability-disabled.error.ts:25`
- **Type:** error class + type guard
- **Purpose:** Typed error raised by capabilityGateInterceptor on disabled endpoints; allows feature surfaces to gracefully degrade (not a security violation — capability is off, not unauthorized).
- **Contract:**
  - Class: `new CapabilityDisabledError(capabilityCode: string, message: string)` — extends Error, `name = 'CapabilityDisabledError'`
  - Type guard: `isCapabilityDisabledError(value: unknown): value is CapabilityDisabledError`
  - Public: `capabilityCode: string`
- **Usage map:** catch blocks on capability-gated endpoints (AI, announcements, etc.); httpErrorInterceptor parses 403 with capability envelope

---

## 11. Tours

> Root: `forge-ui/src/app/shared/tours/`

---

> All tours are driver.js `TourDefinition` objects registered with TourService/HelpTourService.

| Export | File | Steps | Covers |
|--------|------|-------|--------|
| `ADMIN_TOUR` | `shared/tours/admin-tour.ts` | 3 | Admin settings: users, track types, reference data, terminology, system |
| `DASHBOARD_TOUR` | `shared/tours/dashboard-tour.ts` | 3 | Dashboard widget drag/resize, calendar |
| `EXPENSES_TOUR` | `shared/tours/expenses-tour.ts` | 3 | Expense logging: list, filters, create dialog |
| `INVENTORY_TOUR` | `shared/tours/inventory-tour.ts` | 3 | Stock levels, receiving, operations, cycle counts |
| `KANBAN_TOUR` | `shared/tours/kanban-tour.ts` | 4 | Track selector, columns, card drag-drop, bulk actions |
| `PARTS_TOUR` | `shared/tours/parts-tour.ts` | 3 | Parts catalog: table nav, detail panel, specs/BOM/where-used |
| `PLANNING_TOUR` | `shared/tours/planning-tour.ts` | 5 | Planning cycles: backlog intake, cycle board, job commitment, lifecycle |
| `REPORTS_TOUR` | `shared/tours/reports-tour.ts` | 3 | Reports & analytics: selector, filters, export |
| `TIME_TRACKING_TOUR` | `shared/tours/time-tracking-tour.ts` | 3 | Live timers, manual entries, job linkage, cross-tab sync |

**Usage map:** All tours consumed by `shared/services/help-tour.service.ts` + feature components' ngOnInit tour registration.

---

## 12. Capability Registry

> Root: `forge-ui/src/app/shared/capability/`

---

### CapabilityEndpointRegistry
- **Status:** source-confirmed | **File:** `shared/capability/capability-endpoint-registry.ts:1`
- **Type:** registry constant + resolver function
- **Purpose:** URL pattern → capability-code mapping for capabilityGateInterceptor's layer-3 short-circuit; mirrors controller-level `[RequiresCapability]` attributes.
- **Contract:**
  - `CapabilityEndpointEntry` interface: `{ prefix: string, capability: string }`
  - `CAPABILITY_ENDPOINT_REGISTRY: readonly CapabilityEndpointEntry[]` — 90+ ordered entries covering: admin/*, inventory/*, jobs/*, parts/*, customers/*, sales-orders/*, quotes/*, invoices/*, payments/*, shipments/*, purchase-orders/*, quality/*, ai-assistants/*, chat/*, compliance-forms/*, expenses/*, leave/*, time-tracking/*, employees/*, training/*, reviews/*, shifts/*, reports/*, dashboard/*, bi/*, cpq/*, estimates/*, edi/*, approvals/*, kanban-cards/*, pick-waves/*, replenishment/*, mrp/*, planning-cycles/*, scheduling/*, assets/*, lots/*, maintenance/*, shop-floor/*, scanner/*, fmeas/*, ppap-submissions/*, pricing/*, price-lists/*, consignment-agreements/*, projects/*, announcements/*, events/*, notifications/*, status-tracking/*, downloads/*, documents/*, and more
  - `resolveCapabilityForUrl(url: string): string | null` — prefix-match + entity-rooted special-cases (/files, /activity)
- **Usage map:** capabilityGateInterceptor (request interception); CapabilityService (audit/validation)

---

## 13. Feature Cross-References (NOT shared exports)

> Components observed by ui-scout that live in `features/` — recorded here as usage-site context, NOT cataloged as shared exports.

---

### app-new-part-fork-dialog
- **Location:** `features/parts/` (feature-level dialog)
- **Wraps:** `app-dialog` (shared DialogComponent shell)
- **Live-observed states (ui-scout screenshots 55-58):**
  - **Step 1:** 4 procurement cards — Made In-House / Bought (purchased) / Subcontracted / Phantom; CONTINUE gated on card selection
  - **Step 2:** Inventory bucket selector — Component / Subassembly / (other buckets); CONTINUE gated on source + bucket both selected
  - **Step 3+:** D4-terminal (populated-blocked, non-seeded env)
- **Cross-ref:** Uses `app-dialog` wrapper, `app-validation-button` for gated CONTINUE

---

### app-lots
- **Location:** `features/lots/` (feature-level page/component)
- **NOT shared** — feature-specific lots management
- **Live-observed NEW-LOT dialog state (ui-scout screenshots 55-58):**
  - State: empty / non-seeded (D4-terminal for populated state)
  - Form fields using shared components:
    - **Part** — `app-entity-picker` (required)
    - **Quantity** — likely `app-input[type=number]` (required)
    - **Supplier Lot#** — `app-input[type=text]` (required)
    - **Linked Job** — `app-entity-picker` (optional)
    - **Expiration Date** — `app-datepicker` (optional)
    - **Notes** — `app-textarea` (optional)
    - Actions: CANCEL + SAVE (`app-validation-button`)
  - Dialog shell: `app-dialog`

---

## 14. Reconciliation Checklist

> Every file in shared/ mapped to an inventory entry. Ticked = cataloged.

**Checklist method:** every subdirectory/file under `shared/` mapped to a catalog entry. Ticked = cataloged.

### Components (77 top-level directories) — all source-confirmed; 5 upgraded to live-confirmed
> FLAG 2 resolved: Explore agent initially reported "65" directories — actual filesystem count is 77 top-level dirs. All 77 were cataloged in the text above; the checklist count was wrong, not the coverage. Additionally: data-table has 2 subdirs (column-filter-popover, column-manager-panel) and dynamic-form has a flat controls/ dir — these are not counted in the 77 top-level figure but are fully cataloged.
> CLAUDE.md drift: `workflow-active-list` is a separate top-level directory (not a file inside `workflow/`); actual component class is `WorkflowActiveListDialogComponent`.
- [x] activity-timeline → ActivityTimelineComponent
- [x] add-hold-dialog → AddHoldDialogComponent
- [x] address-form → AddressFormComponent
- [x] ai-help-panel → AiHelpPanelComponent
- [x] announcement-overlay → AnnouncementOverlayComponent
- [x] autocomplete → AutocompleteComponent
- [x] avatar → AvatarComponent
- [x] barcode-info → BarcodeInfoComponent
- [x] barcode-scan-input → BarcodeScanInputComponent
- [x] camera-capture → CameraCaptureComponent
- [x] chat-preview-popup → ChatPreviewPopupComponent
- [x] concurrency-conflict-dialog → ConcurrencyConflictDialogComponent
- [x] confirm-dialog → ConfirmDialogComponent
- [x] connection-banner → ConnectionBannerComponent
- [x] currency-display → CurrencyDisplayComponent
- [x] currency-input → CurrencyInputComponent
- [x] dashboard-widget → DashboardWidgetComponent
- [x] data-table → DataTableComponent
- [x] data-table/column-filter-popover → ColumnFilterPopoverComponent
- [x] data-table/column-manager-panel → ColumnManagerPanelComponent
- [x] date-range-picker → DateRangePickerComponent
- [x] datepicker → DatepickerComponent
- [x] demo-marker → DemoMarkerComponent
- [x] detail-side-panel → DetailSidePanelComponent
- [x] dialog → DialogComponent
- [x] dirty-form-indicator → DirtyFormIndicatorComponent
- [x] draft-recovery-banner → DraftRecoveryBannerComponent
- [x] draft-recovery-prompt → DraftRecoveryPromptComponent
- [x] drillable-chart → DrillableChartComponent
- [x] dynamic-form → DynamicQbFormComponent + DynamicQbFormControlComponent + ComplianceFormAdapter + qbFormControlMapFn
- [x] dynamic-form/controls (11) → all 11 DynamicQb control components
- [x] empty-state → EmptyStateComponent
- [x] entity-activity-section → EntityActivitySectionComponent
- [x] entity-completeness-badge → EntityCompletenessBadgeComponent
- [x] entity-completeness-chip → EntityCompletenessChipComponent
- [x] entity-link → EntityLinkComponent
- [x] entity-picker → EntityPickerComponent
- [x] file-upload-zone → FileUploadZoneComponent
- [x] input → InputComponent
- [x] kanban-column-header → KanbanColumnHeaderComponent
- [x] keyboard-shortcuts-help → KeyboardShortcutsHelpComponent
- [x] kpi-chip → KpiChipComponent
- [x] lightbox-gallery → LightboxGalleryComponent
- [x] list-panel → ListPanelComponent
- [x] loading-overlay → LoadingOverlayComponent
- [x] logout-drafts-dialog → LogoutDraftsDialogComponent
- [x] markdown-view → MarkdownViewComponent
- [x] mini-calendar-widget → MiniCalendarWidgetComponent
- [x] notification-panel → NotificationPanelComponent
- [x] offline-banner → OfflineBannerComponent
- [x] onboarding-banner → OnboardingBannerComponent
- [x] page-header → PageHeaderComponent
- [x] page-layout → PageLayoutComponent
- [x] pdf-viewer → PdfViewerComponent
- [x] preset-apply-dialog → PresetApplyDialogComponent
- [x] production-label → ProductionLabelComponent
- [x] qr-code → QrCodeComponent
- [x] quick-action-panel → QuickActionPanelComponent
- [x] recent-communications → RecentCommunicationsComponent
- [x] rich-text-display → RichTextDisplayComponent
- [x] rich-text-editor → RichTextEditorComponent
- [x] sankey-chart → SankeyChartComponent
- [x] select → SelectComponent
- [x] set-status-dialog → SetStatusDialogComponent
- [x] slideout → SlideoutComponent
- [x] status-badge → StatusBadgeComponent
- [x] status-timeline → StatusTimelineComponent
- [x] step-rationale → StepRationaleComponent
- [x] stl-viewer → StlViewerComponent
- [x] stub-page → StubPageComponent
- [x] sync-conflict-dialog → SyncConflictDialogComponent
- [x] textarea → TextareaComponent
- [x] toast → ToastComponent
- [x] toggle → ToggleComponent
- [x] toolbar → ToolbarComponent
- [x] training-context-panel → TrainingContextPanelComponent
- [x] validation-button → ValidationButtonComponent
- [x] virtual-scroll-list → VirtualScrollListComponent
- [x] workflow → WorkflowComponent
- [x] workflow-active-list → WorkflowActiveListDialogComponent (`app-workflow-active-list-dialog`; own top-level directory)

### Directives (8) — all source-confirmed
- [x] cap.directive.ts → CapDirective
- [x] cap-not.directive.ts → CapNotDirective
- [x] column-cell.directive.ts → ColumnCellDirective
- [x] loading-block.directive.ts → LoadingBlockDirective
- [x] row-expand.directive.ts → RowExpandDirective
- [x] spacer.directive.ts → SpacerDirective
- [x] truncation-tooltip.directive.ts → TruncationTooltipDirective
- [x] validation-popover.directive.ts → ValidationPopoverDirective

### Pipes (3) — all source-confirmed
- [x] mention-highlight.pipe.ts → MentionHighlightPipe
- [x] rich-text.pipe.ts → RichTextPipe
- [x] terminology.pipe.ts → TerminologyPipe

### Guards (7) — all source-confirmed
- [x] auth.guard.ts → authGuard
- [x] demo-only.guard.ts → demoOnlyGuard
- [x] mobile-redirect.guard.ts → mobileRedirectGuard
- [x] role.guard.ts → roleGuard
- [x] root-redirect.guard.ts → rootRedirectGuard
- [x] setup.guard.ts → setupRequiredGuard + setupCompleteGuard
- [x] unsaved-changes.guard.ts → unsavedChangesGuard

### Interceptors (9 files, 7 interceptors + 2 utilities) — all source-confirmed
- [x] auth.interceptor.ts → authInterceptor
- [x] capability-gate.interceptor.ts → capabilityGateInterceptor
- [x] date-transform.interceptor.ts → dateTransformInterceptor
- [x] demo-aggregate-synth.ts → demoAggregatesSynth (utility used by demoApiInterceptor)
- [x] demo-api.interceptor.ts → demoApiInterceptor
- [x] demo-url-map.ts → DEMO_URL_MAP (utility used by demoApiInterceptor)
- [x] etag.interceptor.ts → etagInterceptor
- [x] http-error.interceptor.ts → httpErrorInterceptor
- [x] kiosk-token.interceptor.ts → kioskTokenInterceptor

### Services (40+ files) — all source-confirmed
- [x] accounting.service.ts | address.service.ts | ai.service.ts | announcement.service.ts | app-update.service.ts
- [x] auth.service.ts | barcode.service.ts | board-hub.service.ts | branding.service.ts | broadcast.service.ts
- [x] cache.service.ts | capability-install-state.service.ts | capability.service.ts | chat-hub.service.ts | chat-notification.service.ts
- [x] clock-event-type.service.ts | concurrency-conflict.service.ts | consultant-mode.service.ts | currency.service.ts | demo-data-store.service.ts
- [x] detail-dialog.service.ts | discovery.service.ts | draft-broadcast.service.ts | draft-recovery.service.ts | draft-storage.service.ts | draft.service.ts
- [x] entity-activity.service.ts | entity-completeness.service.ts | etag-cache.service.ts | follow-up-task.service.ts | form-validation.service.ts
- [x] help-tour.service.ts | idle.service.ts | keyboard-shortcuts.service.ts | kiosk-session.service.ts | label-print.service.ts | language.service.ts
- [x] layout.service.ts | loading.service.ts | nav-tree.service.ts | notification-hub.service.ts | notification.service.ts
- [x] offline-queue.service.ts | outbound-call.service.ts | preset.service.ts | reference-data.service.ts | route-loading.service.ts
- [x] scan-action.service.ts | scanner.service.ts | search.service.ts | signalr.service.ts | snackbar.service.ts
- [x] status-tracking.service.ts | terminology.service.ts | theme.service.ts | timer-hub.service.ts | toast.service.ts | tour.service.ts
- [x] user-preferences.service.ts | version.service.ts | web-hid-rfid.service.ts | workflow-resume.service.ts | workflow-step-registry.service.ts | workflow.service.ts
- [x] predicate-evaluator.ts (utility class)

### Models (57 files) — all source-confirmed (enumerated in §7)
- [x] All 57 model/const files cataloged in model table above

### Utils (5 files) — all source-confirmed
- [x] address.utils.ts | date.utils.ts | demo-mode.utils.ts | server-validation.utils.ts | tour-connector.utils.ts

### Validators (2 files) — all source-confirmed
- [x] password-strength.validator.ts | phone.validator.ts

### Errors (1 file — §10) — source-confirmed
- [x] capability-disabled.error.ts → CapabilityDisabledError + isCapabilityDisabledError
> FLAG 1 resolved: errors/ directory now has its own ToC section (§10) and checklist entry.

### Tours (9 files) — all source-confirmed
- [x] admin-tour.ts | dashboard-tour.ts | expenses-tour.ts | inventory-tour.ts | kanban-tour.ts | parts-tour.ts | planning-tour.ts | reports-tour.ts | time-tracking-tour.ts

### Capability Registry (1 file) — source-confirmed
- [x] capability-endpoint-registry.ts → CapabilityEndpointRegistry + resolveCapabilityForUrl

---

## Phase Completion Assessment

**Checklist fully ticked:** YES — every file in `shared/` has a catalog entry.  
**Queue:** empty.  
**Unreached / TODO rows:** none.  
**Live-confirmed entries:** 5 (upgraded from ui-scout final harvest): `app-dialog`, `app-datepicker`, `app-textarea`, `app-entity-picker`, `app-dirty-form-indicator`.  
**FLAGS resolved:**
- FLAG 1 (errors/ ToC gap): errors/ added as §10 with CapabilityDisabledError entry.
- FLAG 2 (77-vs-65 delta): corrected to 77 top-level component dirs; all cataloged, checklist was undercounting (Explore agent error). `workflow-active-list` split to its own entry.
- CLAUDE.md drift: `WorkflowActiveListComponent` → actual `WorkflowActiveListDialogComponent` / `app-workflow-active-list-dialog`.
**Feature cross-refs (NOT shared):** `app-lots` and `app-new-part-fork-dialog` recorded in §13 with live-observed UI states; NOT cataloged as shared exports.

**PHASE COMPLETE** — shared-library.md is the authoritative inventory of all shared/ exports.



---

## §H — Live UI Sweep Results (operations-area, seeded env 2026-05-22)

_Folded-in verbatim from `analysis/inventory/sweep-final-results.md`. Sole-writer cataloger content preserved as-is._

# Forge UI Component Inventory — Live Sweep Results
**Date**: 2026-05-22  
**Environment**: http://localhost:4200 (dev server, seeded demo data)  
**Auth**: admin@forge.local / ForgeRun!2026 (id=2, role=Admin)  
**Method**: Playwright headless Chromium + localStorage token injection  
**Coverage note**: MRP capability is disabled (`CAP-PLAN-MRP`) — that section documented from source HTML only. Maintenance resolve dialog documented from source HTML only (no prediction records to seed via API).

---

## SF-01 / SF-02: Kiosk Setup — Admin Login Phase

**Route**: `/shop-floor` (before pairing)  
**Component**: `app-root` + kiosk setup shell

### Phase 1 — Admin Login
**Text observed**: "Terminal Setup — An administrator must configure this kiosk before use"

| Field | Type | Notes |
|-------|------|-------|
| Admin Email | text (email) | `input[formControlName="email"]` |
| Password | password | `input[type="password"]`, visibility toggle button |

**Button**: `login SIGN IN AS ADMIN`

---

## SF-03 / SF-04: Kiosk Setup — Configure Phase

**Component**: kiosk configure phase (reached after SIGN IN AS ADMIN)  
**Text observed**: "dns Configure Terminal — Name this terminal and assign it to a team"

| Field | Type | Notes |
|-------|------|-------|
| Terminal Name | text | free text |
| Team | select | options: "Floor Team A (0 members)"; also shows "add CREATE NEW TEAM" link |

**Buttons**: `check ACTIVATE TERMINAL`

---

## SF-05 through SF-19: Shop Floor Main Display (post-pairing)

**Route**: `/shop-floor` (after activation)  
**Text observed**: "Shop Floor — 0 WORKING 0 ON BREAK 0 UNASSIGNED 0 DONE TODAY"

**Components live on page**:
- `app-shop-floor-display`
- `app-training-mode-banner`
- `app-kiosk-session-bar`
- `app-kiosk-search-bar`
- `app-avatar` (one per employee listed)
- `app-scan-action-overlay`
- `app-offline-banner`
- `app-loading-overlay`
- `app-toast-container`
- `app-keyboard-shortcuts-help`
- `app-chat-preview-popup`
- `app-demo-marker`

**Header stats row**: `0 WORKING | 0 ON BREAK | 0 UNASSIGNED | 0 DONE TODAY`  
**Controls**: `text_decrease 12px text_increase` (font size), `receipt_long` (logs), `devices` (devices), `undo` (undo), `dark_mode` (theme toggle)  
**Clock**: live time display `05:49:44 PM`

**Employee avatar grid** (each `app-avatar`): initials badge + name + IN/OUT status  
Employees shown: Admin Two (AT), Alex Engineer (AE), Casey OfficeManager (CO), Forge Admin (FA), Lead Intake Service (LI), Morgan Manager (MM), Pat PM (PP), Sam Worker (SW)

**Bottom bar**: `contactless Scan your badge or RFID to clock in`

---

## SF-20: Shop Floor Clock View

**Route**: `/shop-floor/clock` (accessed via `devices` icon on main display)  
**Component**: `app-shop-floor-clock`

**Components live on page**:
- `app-root`
- `app-shop-floor-clock`
- `app-kiosk-search-bar`
- `app-barcode-scan-input`
- `app-offline-banner`
- `app-loading-overlay`
- `app-toast-container`
- `app-keyboard-shortcuts-help`
- `app-chat-preview-popup`
- `app-demo-marker`

**Text observed**: "FLOOR TEAM A — 05:49:44 PM — Friday, May 22, 2026"  
**Stats**: `0 WORKING | 0 ON BREAK | 0 OFF | 0 ACTIVE JOBS | 0 DONE TODAY`  
**Sections**: `group TEAM STATUS — No employees registered` | `assignment ACTIVE JOBS — No active jobs`  
**Footer**: `qr_code_scanner person CLOCK IN MANUALLY`

---

## K-01 through K-06: Kanban Board

**Route**: `/kanban` (or `/board`)  
**Components live on page**:
- `app-kanban`
- `app-page-header`
- `app-select` (view filter)
- `app-board-column` (one per stage)
- `app-job-card` (one per job in column)
- `app-empty-state` (empty columns)

**Page header controls**: `view_column` (column toggle), `people Team Members (All assigned users)`, `person MY WORK`, `add NEW JOB`  
**Tooltip**: "Drag cards between columns to move jobs. Ctrl+Click to multi-select for bulk actions."

**Board columns (stages)**: QUOTE REQUESTED, QUOTED, ORDER CONFIRMED, IN PROGRESS, ON HOLD, READY FOR QC, IN QC, COMPLETE, SHIPPED  
Sub-boards (filter tabs): PRODUCTION, R&D/TOOLING, MAINTENANCE

**Live data**: J-1 "Test widget" in ORDER CONFIRMED column

**Job card** (`app-job-card`) text: job number + title + stage badge

---

## K-07: Job Detail — Edit Dialog

**Trigger**: `edit` icon-button inside job detail panel  
**Dialog title**: "EDIT JOB"  
**Dialog component**: opens as CDK overlay (`mat-dialog-container`)

| Field | Type | Placeholder/Notes |
|-------|------|-------------------|
| Title | text | "Job title" |
| Description | textarea | — |
| Customer | select | (Acme Corp pre-filled for J-1) |
| Assignee | select | — |
| Priority | select | (Normal pre-filled) |
| Due Date | text/date | — |

**Buttons**: `CANCEL` | `save SAVE CHANGES`

---

## K-08: Job Detail — Cost Analysis Tab

**Section**: scrollable `jd-section` within job detail panel (not a Material tab)  
**Component in panel**: `app-job-cost-tab`  
**Coverage**: Section heading confirmed present. Inner field content not individually captured (requires scroll within panel). Source template at `job-detail-panel.component.html`.

**Section label**: "COST ANALYSIS"  
**Child component**: `app-job-cost-tab`

---

## K-09: Job Detail — Operation Time Tab

**Section**: scrollable `jd-section` within job detail panel  
**Component in panel**: `app-operation-time-tab`  
**Coverage**: Section heading confirmed present.

**Section label**: "OPERATION TIME"  
**Child component**: `app-operation-time-tab`  
**Data table**: `app-data-table` (confirmed present in panel component list)

---

## K-03 through K-06: Job Detail Panel — All Sections

**Trigger**: Click job card on Kanban board  
**Rendering pattern**: `DetailDialogService` → `MatDialog.open()` → CDK overlay  
**Components inside dialog**:
- `app-job-detail-dialog`
- `app-job-detail-panel`
- `app-input`
- `app-select`
- `app-job-cost-tab`
- `app-operation-time-tab`
- `app-data-table`
- `app-entity-activity-section`
- `app-status-timeline`
- `app-barcode-info`
- `app-entity-link`
- `app-file-upload-zone`

**Header**: job number (J-1), status chip `ORDER CONFIRMED expand_more`, action buttons: `play_circle` (start timer), `add_photo_alternate` (photos), `edit` (edit dialog), `close`

**Description**: "Test widget — Auto-created from Sales Order SO-00001, Line 1. Qty: 5.0000."

**Panel sections** (in scroll order):
1. **SUBTASKS** — text input "Add a subtask..." + `add` button + `account_tree EXPLODE BOM`
2. **LINKED CARDS** — search "Search jobs..." + Type select + `add` button
3. **PARTS** — search "Search parts..." + `add` button
4. **COST ANALYSIS** — `app-job-cost-tab`
5. **OPERATION TIME** — `app-operation-time-tab` + `app-data-table`
6. **ACTIVITY** — `app-entity-activity-section` with tabs: ALL, CONVERSATION, NOTES, HISTORY
7. **DETAILS** — `app-status-timeline`, `app-barcode-info`, `app-entity-link`
8. **FILES** — `app-file-upload-zone` (`download grid_on settings` controls)
9. **TIME** — time entries sub-section

---

## Q-02a: Quality — New QC Inspection Dialog

**Route**: `/quality` → Inspections tab  
**Trigger**: `add NEW INSPECTION` button  
**Rendering pattern**: `app-dialog` inline (`.dialog-backdrop`)  
**Dialog title**: "NEW QC INSPECTION"

| Field | Type | Notes |
|-------|------|-------|
| Template | select | — |
| Job ID | number | — |
| Lot Number | text | — |
| Notes | textarea | — |

**Buttons**: `CANCEL` | `CREATE INSPECTION`  
**Validation indicator**: `warning 1` (1 required field)

---

## Q-03a: Quality — New Lot Record Dialog

**Route**: `/quality` → Lots tab  
**Trigger**: `add NEW LOT` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "NEW LOT RECORD"

| Field | Type | Notes |
|-------|------|-------|
| Part ID | number | required |
| Quantity | number | required |
| Lot Number | text | placeholder "Auto-generated if blank" |
| Job ID | number | optional |
| Supplier Lot # | text | optional |
| Notes | textarea | optional |

**Buttons**: `CANCEL` | `warning 1 CREATE LOT`  
**Validation indicator**: `warning 1`

---

## Q-08: Quality — Create Non-Conformance (NCR) Dialog

**Route**: `/quality` → NCRs tab  
**Trigger**: `add NEW NCR` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "CREATE NON-CONFORMANCE"

| Field | Type | Default/Notes |
|-------|------|---------------|
| Type | select | "Internal" (default) |
| Detection Stage | select | "Receiving" (default) |
| Part ID | number | optional |
| Job ID | number | optional |
| Description | textarea | required |
| Affected Quantity | number | required |
| Defective Quantity | number | optional |
| Containment Actions | textarea | optional |

**Buttons**: `CANCEL` | `warning 3 CREATE`  
**Validation indicator**: `warning 3` (3 required fields)

---

## Q-09: Quality — Create CAPA Dialog

**Route**: `/quality` → CAPAs tab  
**Trigger**: `add NEW CAPA` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "CREATE CAPA"

| Field | Type | Default/Notes |
|-------|------|---------------|
| Type | select | "Corrective" (default) |
| Source | select | "Other" (default) |
| Title | text | required |
| Problem Description | textarea | required |
| Impact Description | textarea | optional |
| Owner ID | number | required |
| Priority | select | "3 — Medium" (default) |
| Due Date | date | optional |

**Buttons**: `CANCEL` | `warning 4 CREATE`  
**Validation indicator**: `warning 4`

---

## Q-10: Quality — Create Engineering Change Order (ECO) Dialog

**Route**: `/quality` → ECOs tab  
**Trigger**: `add NEW ECO` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "CREATE ENGINEERING CHANGE ORDER"

| Field | Type | Default/Notes |
|-------|------|---------------|
| Title | text | required |
| Change Type | select | required |
| Revision | text | optional |
| Priority | select | "Normal" (default) |
| Description | textarea | required |
| Reason for Change | textarea | optional |
| Impact Analysis | textarea | optional |
| Effective Date | date | optional |

**Buttons**: `CANCEL` | `warning 2 CREATE`  
**Validation indicator**: `warning 2`

---

## Q-11: Quality — New Gage Dialog

**Route**: `/quality` → Gages tab  
**Trigger**: `add NEW GAGE` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "NEW GAGE"

| Field | Type | Notes |
|-------|------|-------|
| Description | text | required |
| Gage Type | text | optional |
| Manufacturer | text | optional |
| Model | text | optional |
| Serial Number | text | optional |
| Calibration Interval (Days) | number | required |
| Accuracy Spec | text | optional |
| Range Spec | text | optional |
| Resolution | text | optional |
| Notes | textarea | optional |

**Buttons**: `CANCEL` | `warning 1 save CREATE`  
**Validation indicator**: `warning 1`

---

## Q-12: Quality — New SPC Characteristic Dialog

**Route**: `/quality` → SPC tab  
**Trigger**: `add NEW CHARACTERISTIC` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "NEW CHARACTERISTIC"

| Field | Type | Notes |
|-------|------|-------|
| Part ID | number | required |
| Operation ID | number | optional |
| Name | text | required |
| Description | textarea | optional |
| Measurement Type | select | "Variable" (default) |
| Nominal Value | number | required |
| Unit of Measure | text | optional |
| Lower Spec Limit | number | required |
| Upper Spec Limit | number | required |
| Sample Size (n) | number | required |
| Decimal Places | number | required |
| Sample Frequency | text | optional |
| Notify on OOC | toggle | optional |
| Active | toggle | default on |

**Buttons**: `CANCEL` | `warning 5 CREATE`  
**Validation indicator**: `warning 5`

---

## MRP-01: MRP Dashboard (source-only — capability disabled)

**Route**: `/mrp`  
**Note**: `CAP-PLAN-MRP` feature flag is disabled. Page hangs on API calls. All data below from source HTML (`mrp.component.html`).

**Tabs** (implemented as `button.tab`, not `[role="tab"]`):
1. Dashboard
2. Planned Orders
3. Exceptions
4. Run History
5. Master Schedule
6. Forecasts

**Dashboard + Run History tabs**: `RUN MRP` button + `SIMULATE` button

---

## MRP-02: Execute MRP Run Dialog (source-only)

**Source**: `execute-mrp-run-dialog.component.html`  
**Dialog title**: "EXECUTE MRP RUN"

| Field | Type | Notes |
|-------|------|-------|
| Run Type | select | options: Full, Net Change |
| Planning Horizon Days | number | range 1–730, suffix "days" |

**Buttons**: `CANCEL` | `RUN MRP`

---

## MRP-03: Master Schedule Dialog (source-only)

**Source**: `master-schedule-dialog.component.html`

| Field | Type | Notes |
|-------|------|-------|
| Name | text | required |
| Description | textarea | optional |
| Period Start | date | required |
| Period End | date | required |
| Lines (repeating) | — | `add ADD LINE` button |
| — Part | entity-picker | required |
| — Quantity | number | required |
| — Due Date | date | required |
| — Notes | text | optional |

---

## MRP-04: Generate Forecast Dialog (source-only)

**Source**: `generate-forecast-dialog.component.html`

| Field | Type | Notes |
|-------|------|-------|
| Name | text | required |
| Part | entity-picker | required |
| Method | select | required |
| Historical Periods | number | range 2–60, required |
| Forecast Periods | number | range 1–36, required |
| Smoothing Factor | number | optional (shown when method = Exponential Smoothing) |

---

## ASSET-01: Assets List Page

**Route**: `/assets`  
**Components live on page**:
- `app-assets`
- `app-page-header`
- `app-input` (Search)
- `app-select` (Type filter, Status filter)
- `app-data-table`

**Page header buttons**: `add ADD ASSET`  
**Table columns**: (checkbox), NAME, TYPE, LOCATION, MANUFACTURER, STATUS, HOURS, (actions: download, grid_on, settings)

**Live data row**: `precision_manufacturing CNC Mill #1 | Machine | — | — | ACTIVE | —`

---

## ASSET-02: Add Asset Dialog

**Route**: `/assets` → `ADD ASSET` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "ADD ASSET"

| Field | Type | Default/Notes |
|-------|------|---------------|
| Name | text | required |
| Type | select | "Machine" (default) |
| Location | text | optional |
| Manufacturer | text | optional |
| Model | text | optional |
| Serial Number | text | optional |
| Notes | textarea | optional |
| **Acquisition & Depreciation section** | | collapsible |
| Acquisition Cost | number | optional |
| Depreciation Method | select | optional |
| Work Center ID | number | optional |
| GL Account (optional) | text | optional |

**Buttons**: `CANCEL` | `warning 1 save NEW ASSET`

---

## ASSET-03: Asset Detail Panel

**Trigger**: Click any row in assets table  
**Components added to page**: `app-asset-detail-dialog`, `app-asset-detail-panel`, `app-barcode-info`, `app-entity-activity-section`

**Detail panel content** (CNC Mill #1):
```
precision_manufacturing  CNC Mill #1  Machine  [edit] [close]
STATUS    ACTIVE
HOURS     0
qr_code_2 BARCODE   AST-CNC Mill #1   [content_copy] [print PRINT] [refresh REGENERATE]
SET STATUS ▶ [ACTIVE] [MAINTENANCE] [RETIRED] [OUT OF SERVICE]
MAINTENANCE HISTORY
  build_circle  No maintenance logs
ACTIVITY
  [ALL] [CONVERSATION] [NOTES] [HISTORY]
  No activity yet.
```

**Barcode ID format**: `AST-{asset name}`  
**Status options in SET STATUS menu**: ACTIVE, MAINTENANCE, RETIRED, OUT OF SERVICE  
**Source fields** (from `asset-detail-panel.component.html`): Status, Location, Manufacturer, Model, Serial Number, Hours; optional Tooling Details section; Notes section; Maintenance History section; Activity section

---

## TIME-01: Time Tracking Page

**Route**: `/time-tracking`  
**Components live on page**:
- `app-time-tracking`
- `app-page-header`
- `app-datepicker` (From / To date range)
- `app-data-table`
- `app-empty-state`

**Page header buttons**: `play_circle START TIMER` | `edit_note MANUAL ENTRY`  
**Summary row**: "Total: 0.0h across 0 entries"

**Table columns** (visible when timer running): DATE, USER, JOB, CATEGORY, DURATION, NOTES, TYPE, (actions: delete)

---

## TIME-02: Start Timer Dialog

**Trigger**: `play_circle START TIMER` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "START TIMER"

| Field | Type | Default/Notes |
|-------|------|---------------|
| Category | select | "None" (default) |
| Notes | textarea | optional |

**Buttons**: `CANCEL` | `play_circle START`

---

## TIME-03: Running Timer State

**Observed after starting timer**: Button changes to `stop_circle STOP TIMER (0M)`  
**Table row**: `timer | 05/22/2026 06:00 PM | Forge Admin | — | — | RUNNING | — | TIMER | [delete]`  
**Active row indicator**: `RUNNING` badge in DURATION column

---

## TIME-04: Stop Timer Dialog

**Trigger**: `stop_circle STOP TIMER` button (visible when timer running)  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "STOP TIMER"

| Field | Type | Notes |
|-------|------|-------|
| (info) | static text | "Timer running for Xm" |
| Notes (optional) | textarea | optional |

**Buttons**: `CANCEL` | `stop_circle STOP TIMER`

---

## TIME-05: Manual Log Time Entry Dialog

**Trigger**: `edit_note MANUAL ENTRY` button  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: "LOG TIME ENTRY"

| Field | Type | Default/Notes |
|-------|------|---------------|
| Date | date | — |
| Category | select | "None" (default) |
| Hours | number | — |
| Minutes | number | — |
| Notes | textarea | optional |

**Buttons**: `CANCEL` | `save LOG ENTRY`

---

## OEE-01: OEE Dashboard Page

**Route**: `/oee`  
**Components live on page**:
- `app-oee`
- `app-page-layout`
- `app-date-range-picker` (From / To)
- `app-kpi-chip` (AVG OEE summary)
- `app-oee-work-center-card` (one per work center)
- `app-select` (Granularity, inside detail panel)
- `app-oee-trend-chart`
- `app-six-big-losses-chart`

**Page date presets**: `LAST 30 DAYS` | `THIS MONTH` | `THIS WEEK`  
**KPI chip**: `0.0% AVG OEE | 0/1 WORLD CLASS`

---

## OEE-02: OEE Work Center Card

**Component**: `app-oee-work-center-card`  
**Live data** (CNC-01):
```
CNC-01
[world-class badge — not shown at 0%]
0.0% OEE
AVAILABILITY  100.0%
PERFORMANCE   0.0%
QUALITY       0.0%
0 total   0 good   0 scrap
```

**Card fields** (from `oee-work-center-card.component.html`):
- Work center name
- World-class badge (shown when OEE >= threshold)
- OEE % gauge
- AVAILABILITY %, PERFORMANCE %, QUALITY % factor rows
- total / good / scrap counts

---

## OEE-03: OEE Detail Panel

**Trigger**: Click a work center card  
**Panel renders inline** (right side of same page — no new route or CDK overlay)

**Detail panel content** (CNC-01):
```
CNC-01 — Detail
Granularity: [Daily ▾]   (app-select)
OEE TREND               (app-oee-trend-chart — empty state)
SIX BIG LOSSES          (app-six-big-losses-chart)
  check_circle  No losses recorded for this period
```

**Granularity options** (from source): Daily, Weekly, Monthly

---

## PLAN-01: Planning Page

**Route**: `/planning`  
**Components live on page**:
- `app-planning`
- `app-page-header`
- `app-select` (Cycle selector)
- `app-input` (Backlog search)
- `app-empty-state` ("No planning cycle selected")
- `app-cycle-dialog` (when NEW CYCLE clicked)
- `app-dialog`
- `app-dirty-form-indicator`
- `app-datepicker`
- `app-textarea`
- `app-validation-button`

**Page header buttons**: `add NEW CYCLE`  
**Empty state buttons**: `CREATE FIRST CYCLE`

**Backlog panel** (left side, always visible):  
```
Backlog  1 JOBS
[Search] [Priority ▾]
J-1  Test widget  ORDER CONFIRMED  Normal
```

---

## PLAN-02: New Planning Cycle Dialog

**Trigger**: `add NEW CYCLE` button  
**Rendering pattern**: `app-dialog` inline via `app-cycle-dialog`  
**Dialog title**: "NEW PLANNING CYCLE"

| Field | Type | Placeholder/Notes |
|-------|------|-------------------|
| Cycle Name | text | "e.g. Sprint 12" |
| Start Date | date | required |
| End Date | date | required |
| Goals | textarea | optional |

**Buttons**: `CANCEL` | `warning 1 save CREATE`  
**Validation indicator**: `warning 1` (Cycle Name required)

---

## PLAN-03: Cycle Board (source-only — cycle not created in sweep)

**Source**: `cycle-board.component.html`  
**Component**: `app-cycle-board`  
**Note**: Cycle board renders only after a cycle exists. Board was not populated during sweep (cycle creation with valid dates not completed in Playwright run).

**Board structure** (from source):
- Board header: cycle name, start/end dates, job count, completion stats
- Progress bar (% complete)
- Goals text
- CDK drag-drop list: `cdkDropList`
- Each entry row: job number, title, stage chip, priority chip, assignee avatar, rolled-over badge (if carried from previous cycle)

---

## MAINT-01: Predictive Maintenance Page

**Route**: `/maintenance/predictions`  
**Components live on page**:
- `app-predictions`
- `app-page-layout`
- `app-toolbar`
- `app-select` (Severity filter, Status filter)
- `app-data-table`
- `app-empty-state`

**Filter defaults**: Severity: "All severities", Status: "Open (not yet resolved)"  
**Page description**: "Open predictions need a decision: acknowledge, schedule preventive work, resolve, or mark false-positive. Resolved + false-positive close the loop and feed the model accuracy stats."

**Empty state** (no seeded predictions): "No predictions match the current filter. Lower-severity alerts may be hidden — try Status: All."

**No ADD button** (predictions come from ML model, not manually created).  
**Maintenance predictions POST endpoint returns 404** — no way to seed via API.

---

## MAINT-02: Resolve Prediction Dialog (source-only — no predictions to trigger)

**Source**: `resolve-prediction-dialog.component.html`  
**Trigger**: resolve or mark-false-positive action button on a prediction row  
**Rendering pattern**: `app-dialog` inline  
**Dialog title**: dynamic — "Resolve Prediction" OR "Mark as False Positive" (based on mode)

| Field | Type | Notes |
|-------|------|-------|
| Notes | textarea | required, 4 rows, maxlength 2000 |

**Hint text**: dynamic based on mode (resolve vs false-positive)  
**Buttons**: `CANCEL` | primary action button (label changes by mode)

---

## App-Wide Shared Components

Components present on nearly every admin page:
- `app-root` — shell
- `app-header` — top bar with search (`Ctrl+K`), training (`school`), notifications, theme toggle, user menu
- `app-sidebar` — left nav with route icons
- `app-chat` — AI chat panel trigger
- `app-ai-help-panel` — AI help drawer
- `app-training-context-panel` — training context overlay
- `app-connection-banner` — WebSocket status
- `app-announcement-overlay` — system announcements
- `app-onboarding-banner` — first-run onboarding prompt
- `app-offline-banner` — offline indicator
- `app-loading-overlay` — full-page loading spinner
- `app-toast-container` — toast/snackbar notifications
- `app-keyboard-shortcuts-help` — `Ctrl+K` shortcuts modal
- `app-chat-preview-popup` — AI chat floating preview
- `app-demo-marker` — demo mode indicator badge

### Dialog Rendering Patterns

| Pattern | Components | Used By |
|---------|-----------|---------|
| Inline app-dialog | `app-dialog`, `.dialog-backdrop > .dialog` with `.dialog__header/.dialog__body/.dialog__footer` | Quality dialogs, Asset dialogs, Timer dialogs, Planning cycle, OEE (not applicable), Maintenance resolve |
| CDK MatDialog | `.cdk-overlay-container > mat-dialog-container` | Kanban job detail dialog |

### Validation Button Pattern

`app-validation-button` shows `warning N` count of required-but-empty fields; turns to `save` icon when form is valid.

### Activity Section Pattern

`app-entity-activity-section` appears in asset detail panel and job detail panel. Tabs: ALL, CONVERSATION, NOTES, HISTORY.

### Barcode Info Pattern

`app-barcode-info` renders barcode + copy + print + regenerate controls. Format varies: `AST-{name}` for assets, `J-{id}` for jobs.


---
