---
title: Forge — Functional Surface Area (Master)
type: product
status: stable
id: functional-surface-area
updated: 2026-06-07
---

# Forge — Functional Surface Area

The single, aggregated, fairly-detailed outline of **what Forge does** — the full
product feature suite by domain, with the capability gates that govern each. It is
synthesized from the current, authoritative markdown + the capability catalog (see
[Sources](#sources)); it is a map, not a re-spec. For the *correct behavior* of any
feature, follow the linked source doc.

Forge is an end-to-end ERP/MES for small-to-mid manufacturing shops, spanning the
**quote-to-cash spine** (Lead → Quote → Sales Order → Job/Production → Shop Floor →
Inventory → Shipment → Invoice → Payment) plus the surrounding master-data,
procurement, quality, people, accounting, and platform capabilities.

> **Two cross-cutting gates shape everything — read first:**
>
> - **Capability gating** — **152 named capabilities** (static catalog) across **15
>   areas** decide what's *on* per install. Controllers + MediatR handlers carry
>   `[RequiresCapability("CAP-…")]` and 403 when disabled; the frontend mirrors with
>   the `*appCap` directive + a route guard. Areas: **IDEN** identity/auth · **MD**
>   master data · **P2P** procure-to-pay · **O2C** order-to-cash · **MFG** manufacturing
>   execution · **PLAN** planning/MRP · **INV** inventory · **QC** quality · **MAINT**
>   maintenance · **ACCT** accounting · **HR** people · **PS** professional services ·
>   **RPT** reporting · **CROSS** cross-cutting · **EXT** experience/UX surfaces. Full list in the
>   [Capability Appendix](#capability-appendix). A feature appearing here does **not**
>   mean it's enabled on a given install.
> - **⚡ Accounting boundary** — features an external provider (QuickBooks/Xero/etc.)
>   owns natively are **cordoned**: standalone-mode only, read-only/hidden when a
>   provider is connected (mutex `CAP-ACCT-EXTERNAL ⊥ CAP-ACCT-BUILTIN`). Full GL is
>   **never-in-app** (`CAP-ACCT-FULLGL` = aspirational placeholder). Marked **⚡** below.
>
> **Maturity tags:** *(none)* implemented & in use · **[BE]** backend-only / UI-thin ·
> **[deferred]** registered but not pursued (often `RECORD-ONLY` scope) · **[design]**
> decision/spec stage.

---

## 1. Core Production & Job Management

The shop-floor execution spine. *(MFG, PLAN, EXT-kanban/shopfloor/andon, MD-workcenters/calendars)*

- **Kanban board** (`CAP-EXT-KANBAN`) — track-typed job board (Production, R&D/Tooling,
  Maintenance, Other + custom); drag-to-move with WIP limits; multi-select bulk
  (move/assign/priority/archive); SignalR real-time sync (optimistic, last-write-wins);
  irreversible-stage locks; archive-not-delete; column tinting; `IsShopFloor` filter.
- **Replenishment kanban** (`CAP-EXT-KANBAN-REPLENISHMENT`) [deferred] · **Andon** visual
  signaling (`CAP-EXT-ANDON`) [deferred].
- **Production track stages** — QB-aligned: Quote Requested → Quoted → Order Confirmed →
  Materials Ordered → Materials Received → In Production → QC/Review → Shipped → Invoiced
  → Payment Received.
- **Jobs** — create/edit, priority, **disposition** (Scrap / Rework / Capitalize-as-Asset,
  audited reason), parent/sub-jobs, job links (related/blocks/duplicates), parts, subtasks,
  activity log, status lifecycle, cost & operation-time analysis, explode-BOM, work-order PDF.
- **Shop-floor execution** (`CAP-MFG-SHOPFLOOR`, `CAP-EXT-SHOPFLOOR-KIOSK`) — full-screen
  kiosk (`/display/shop-floor`), RFID/barcode→PIN auth, touch-first worker grid, timer
  start/stop, mark-complete, auto-dismiss, theme/font persistence.
- **Work-order lifecycle** [BE] — release (`CAP-MFG-WO-RELEASE`), material issue/return
  (`CAP-MFG-MATL-ISSUE`), backflush (`CAP-MFG-BACKFLUSH`), labor reporting
  (`CAP-MFG-LABOR`), multi-op routing execution (`CAP-MFG-MULTIOP`), completion + scrap +
  rework (`CAP-MFG-COMPLETE`), WO variance review (`CAP-MFG-WOVARIANCE`).
- **Costing tiers** [deferred] — departmental rates (`CAP-COSTING-TIER2-DEPTRATES`),
  activity-based (`CAP-COSTING-TIER3-ABC`).
- **Stoppage/downtime** (`CAP-MFG-STOPPAGE`) [deferred] · **Machine data ingest / IoT**
  (`CAP-MFG-MACHINE-CONNECT`) [deferred].
- **Planning** — Planning Cycles (configurable, guided Planning Day, split-panel drag-to-commit,
  daily Top-3, rollover); MRP (`CAP-PLAN-MRP`) [BE], MPS, forecast, finite capacity, ATP,
  safety-stock/reorder-point, ABC classification — mostly [deferred]/[BE].
- **Backlog**, **Calendar**, **Status lifecycle** (polymorphic workflow status + holds,
  status timeline, set-status/add-hold dialogs).
- **Work centers** (`CAP-MD-WORKCENTERS`), **Calendars/shifts** (`CAP-MD-CALENDARS`).

## 2. Parts, Engineering & Bill of Materials

*(MD-parts/bom/routing/uom/eco/part-compliance)*

- **Parts master** (`CAP-MD-PARTS`) — full CRUD; **3-axis decomposition** replacing legacy
  `PartType`: `ProcurementSource` (Make/Buy/Subcontract/Phantom) × `InventoryClass`
  (Raw/Component/Subassembly/FinishedGood/Consumable/Tool) × `ItemKindId` (admin taxonomy);
  traceability type (None/Lot/Serial), ABC class, manufacturer identity (name + MPN),
  status (Draft/Prototype/Active/Obsolete).
- **Part detail** — axis-driven resolver tab layout (identity, sourcing, purchase-history,
  inventory, MRP, BOM, routing, cost, pricing, quality, alternates, material) + persistent
  Activity footer (conversation/notes/history) + Files.
- **Guided part creation** — shared `WorkflowComponent` framework (Express/Guided, per-step
  persistence, URL-as-source-of-truth, deferred materialization).
- **BOM** (`CAP-MD-BOM`) — multi-level, source type, lead time, reference designators,
  revision history, cycle guard (no A→B→A).
- **Routing / Operations** (`CAP-MD-ROUTING`) — operation sequences, operation materials,
  subcontract steps, QC checkpoints, operation-time analysis.
- **Units of measure** (`CAP-MD-UOM`) + **purchase options** — per-part purchasable pack
  sizes with content quantity → per-base-unit cost normalization (feeds pricing/comparison).
- **Engineering change orders** (`CAP-MD-ECO`) [deferred] · **Part compliance fields**
  (`CAP-MD-PART-COMPLIANCE`) [BE].

## 3. Inventory & Warehouse

*(INV)*

- **Core tracking** (`CAP-INV-CORE`) — on-hand per part at location/bin granularity,
  transactional `BinMovement`s (with audited notes), soft-delete history, reserved-vs-available.
- **Storage locations** (`CAP-MD-LOCATIONS`) — hierarchical bins/locations, types, barcodes; CRUD+edit.
- **Receiving** (`CAP-P2P-RECEIVE`) — PO receipt → stock with location; 3-way-match groundwork.
- **Manual inventory override** (`CAP-INV-ADJUST`, Admin/Manager) — directly set/adjust
  on-hand for an existing part (opening stock, count corrections, found inventory),
  bypassing purchasing; create-or-adjust bin content; reserved-floor guard; audited reason +
  optional PO/vendor provenance. **Operational only — never posts to a ledger**
  ([design](../delivery/in-progress/inventory-override/design.md)).
- **Lots & expiry/FEFO** (`CAP-INV-LOTS`), **serial tracking** (`CAP-INV-SERIALS`),
  **cycle counting** (`CAP-INV-CYCLECOUNT`), **annual physical** (`CAP-INV-PHYSICAL`) [BE],
  **reservations** (`CAP-INV-RESERVE`), **pick wave** (`CAP-INV-PICKWAVE`) [deferred],
  **multi-location/transfers** (`CAP-INV-MULTILOC`) [BE], **hazmat/SDS** (`CAP-INV-HAZMAT`) [deferred].
- **Valuation** (`CAP-RPT-INVVAL`) — Average/Standard costing report.

## 4. Sales & Order-to-Cash (CRM → Cash)

*(O2C, MD-customers/contacts/addresses/interactions/pricelist)*

- **Leads** (`CAP-O2C-LEAD`) — pipeline (table + drag board), statuses, sources,
  lost-reason capture, follow-ups, inline **Account** creation (edit + bulk-assign),
  atomic convert-to-customer.
- **Customers** (`CAP-MD-CUSTOMERS`) — list + full detail (`/customers/:id/:tab`, 9 tabs),
  live stats bar; **multiple contacts** (`CAP-MD-CUSTOMER-CONTACTS`), **multiple addresses**
  (`CAP-MD-CUSTOMER-ADDRESSES`), **interaction log/CRM** (`CAP-MD-CUSTOMER-INTERACTIONS`:
  call/email/meeting/note).
- **Accounts** — account ↔ contacts/leads roll-up.
- **Estimates** — non-binding single-amount ballparks → convert to Quote (`source_estimate_id`).
- **Quotes** (`CAP-O2C-QUOTE`) — binding, line-itemized; customer price-list resolution;
  convert to SO; shares `quotes` table with Estimates via `QuoteType`. **CPQ**
  (`CAP-O2C-CPQ`) [deferred].
- **Sales Orders** (`CAP-O2C-SO`) — editable draft header + lines, credit terms, billing
  address, requested delivery, customer PO.
- **Credit limits / hold / terms** (`CAP-O2C-CREDIT-LIMITS`) [BE].
- **Pick/pack** (`CAP-O2C-PICKPACK`) [BE] → **Shipments** (`CAP-O2C-SHIP`) — shipment +
  lines, carrier rates/labels/tracking or manual; relieves inventory + releases reservations.
- **Recurring / subscription orders** (`CAP-O2C-RECURRING`) [BE], **deliverable/artifact
  tracking** (`CAP-O2C-DELIVERABLE`) [deferred].
- **Customer Portal v1** (`CAP-EXT-CUSTOMER-PORTAL`, default off) — magic-link auth;
  dashboard / orders / quotes / invoices / shipments + quote accept/decline; `/portal/*`.
- **Price lists** (`CAP-MD-PRICELIST`), quantity breaks.

## 5. Procurement & Procure-to-Pay

*(P2P, MD-vendors)*

- **Vendors** (`CAP-MD-VENDORS`) — full local CRUD (read-only when accounting-integrated).
- **Vendor-Parts** — (Vendor × Part) intersection: vendor part #, MPN, lead time, MOQ, pack
  size, country of origin, HTS, AVL/approved + preferred flags, certifications;
  ≤1 preferred per part.
- **Vendor price tiers** — min-qty breaks + effective dates linked to a **purchase option**;
  per-base-unit normalization for true cross-vendor comparison.
- **Purchase Orders** (`CAP-P2P-PO`) — PO + lines + releases; auto-fill unit price from
  vendor tiers/part pricing (option-aware); **manual override** with permission gating +
  reason capture; off-tier variance prompt; receiving records.
- **AI-assisted price-override review** (`CAP-EXT-AI-ASSISTANT`) — deterministic variance vs
  tiers + AI risk narrative + suggested justification; degrades gracefully offline.
- **RFQ** (`CAP-P2P-RFQ`) — multi-vendor sourcing, vendor responses, generate PO.
- **Receiving + 3-way match** (`CAP-P2P-RECEIVE`).
- **Approvals** (`CAP-P2P-APPROVALS`), **auto-PO/replenishment** (`CAP-P2P-AUTOPO`),
  **drop-ship** (`CAP-P2P-DROPSHIP`), **back-to-back** (`CAP-P2P-BACKTOBACK`),
  **subcontract send/receive** (`CAP-P2P-SUBCONTRACT`) — mix of [BE]/[deferred].

## 6. Quality & Compliance

*(QC)*

- **Inspection plans + receiving inspection** (`CAP-QC-INSPECTION`) — QC templates,
  inspections tied to production runs, pass/fail, pending-inspection queue, waive (Admin/Manager).
- **Production lots & traceability** — lot records + trace query; **recall/lot trace**
  (`CAP-QC-RECALL`), **certificate of analysis** (`CAP-QC-COA`) [BE].
- **Customer returns / RMA** (`CAP-O2C-RMA`) — create → resolve → close [BE].
- **Compliance form pipeline** (`CAP-QC-COMPLIANCE-FORMS`) — W-4 / I-9 / state withholding
  via dynamic form engine + PDF extraction (pdf.js/PuppeteerSharp → ComplianceFormDefinition
  → AI verify) + DocuSeal signing.
- **NCR** (`CAP-QC-NCR`), **CAPA** (`CAP-QC-CAPA`), **FMEA** (`CAP-QC-FMEA`), **PPAP**
  (`CAP-QC-PPAP`), **SPC** (`CAP-QC-SPC`), **gage calibration** (`CAP-QC-GAGE`) —
  backend-registered / aspirational [deferred] (`RECORD-ONLY` scope per the audit).

## 7. HR & People

*(HR, MD-employees)*

- **Time tracking** (`CAP-HR-TIMETRACK`) — time entries + clock events; admin/manager
  time corrections with audit trail (original-value snapshot, required reason).
- **Shifts** (`CAP-HR-SHIFTS`) — shift management + assignment [BE].
- **Employee master** (`CAP-MD-EMPLOYEES`) — profiles, work location → state withholding.
- **Payroll feed** (`CAP-HR-PAYROLL`) — pay stubs + tax documents (employee self-service +
  admin upload); QB Payroll sync stubbed [BE].
- **Training + certification** (`CAP-HR-TRAINING`) — 46 seeded modules
  (Article/Video/Walkthrough/QuickRef/Quiz), 8 paths, randomized quiz pools, learning-style
  filter, progress tracking, admin CRUD, per-user drill-down.
- **Events** — Meeting/Training/Safety/Other, attendee RSVP, shop-floor upcoming, 15-min reminders.
- **Hire/onboarding** (`CAP-HR-HIRE`), **termination/offboarding** (`CAP-HR-TERMINATION`),
  **PTO/leave** (`CAP-HR-LEAVE`), **performance reviews** (`CAP-HR-REVIEW`) — [deferred].

## 8. Financials & Accounting ⚡

*(ACCT, O2C-invoice/cash/collections/creditmemo, MD-taxcodes/currencies)*. All **⚡**
features are **standalone-mode only** (cordoned by the accounting boundary).

- **Mode (mutex):** **External integration** (`CAP-ACCT-EXTERNAL`) ⊥ **Built-in
  lightweight accounting** (`CAP-ACCT-BUILTIN`). Exactly one owns the books.
- **Invoices ⚡** (`CAP-O2C-INVOICE`) — local CRUD + PDF; invoiced-≤-shipped intended.
- **Payments / cash receipt ⚡** (`CAP-O2C-CASH`) — recording + application to invoices.
- **Credit memos ⚡** (`CAP-O2C-CREDITMEMO`), **AR collections / dunning ⚡**
  (`CAP-O2C-COLLECTIONS`) [BE].
- **Expenses** (`CAP-ACCT-EXPENSES`) — capture, categories, receipts (camera/upload),
  approval flow.
- **Sales tax** (`CAP-MD-TAXCODES`) ⚡ — per-state/jurisdiction rates, invoice calculation;
  **currencies/FX** (`CAP-MD-CURRENCIES`), **FX revaluation** (`CAP-ACCT-FXREVAL`) [deferred].
- **Period close + lock** (`CAP-ACCT-PERIOD`) [BE] · **asset depreciation**
  (`CAP-ACCT-DEPRECIATION`) [deferred].
- **Accounting mode migration wizard** (`CAP-ACCT-MIGRATION`) — switch standalone ↔ provider.
- **Built-in full GL** (`CAP-ACCT-FULLGL`) — `accounting-gl-phase0` model exists
  (JournalEntry/JournalLine/GlAccount/FiscalPeriod/AccountDeterminationRule) but is **gated
  off / NOT YET IMPLEMENTED**; full GL / bookkeeping / bank-rec / payroll-tax are never-in-app.
- **Providers** — QuickBooks Online (real: OAuth2, sync queue, customer/item/invoice/payment/
  time-activity sync, token encryption); Xero/FreshBooks/Sage/NetSuite/Wave/Zoho via
  `AccountingProviderFactory`. App works fully standalone with graceful degradation.

## 9. Reporting & Analytics

*(RPT)*

- **Dashboards** (`CAP-RPT-DASHBOARDS`) — multi-widget aggregate (KPIs, mini-calendar,
  ng2-charts).
- **Dynamic Report Builder** — 28 entity sources, 350+ fields, 27 pre-seeded templates,
  saved reports, charting.
- **Operational reports** (`CAP-RPT-OPERATIONAL`) — sales / vendor / labor / scrap / cycle /
  stockout · **Financial statements ⚡** (`CAP-RPT-FINANCIALS`) — P&L, AR aging, etc. ·
  **Inventory valuation** (`CAP-RPT-INVVAL`) · **MRP exception** (`CAP-RPT-MRPEX`) [BE] ·
  **OEE** (`CAP-RPT-OEE`) [deferred].
- **Activity & audit** — per-entity activity feed (conversation/notes/history with @mentions),
  system-wide `audit_log_entries`, immutable history.

## 10. Platform, Integrations & Real-time

*(IDEN-auth, CROSS, EXT-chat/ai/portal/email-sync/announcements)*

- **Authentication** — password (`CAP-IDEN-AUTH-PASSWORD`), **TOTP MFA**
  (`CAP-IDEN-AUTH-MFA`: QR + recovery codes), **SSO** Google/Microsoft/OIDC
  (`CAP-IDEN-AUTH-SSO`: token-exchange, AllowedTenants/Domains), **API keys**
  (`CAP-IDEN-AUTH-API-KEYS`), **kiosk/RFID/NFC/barcode** (`CAP-IDEN-AUTH-KIOSK`); JWT
  (short access + rotated refresh), account lockout, silent-refresh interceptor.
- **Notifications** (`CAP-CROSS-NOTIFICATIONS`) — real-time SignalR push, bell badge,
  filtering, preferences, SMTP email.
- **Chat** (`CAP-EXT-CHAT`) — 1:1 DMs + group rooms, real-time, file/entity sharing;
  outbound Slack/Teams/Discord/Google-Chat (`CAP-EXT-CHAT-INTEGRATION`) [deferred].
- **AI Assistant** (`CAP-EXT-AI-ASSISTANT`) — self-hosted Ollama + pgvector RAG (smart
  search, doc Q&A, drafting, Hangfire indexing); configurable domain assistants (HR/Procurement/Sales).
- **Search** — full-text tsvector + RAG hybrid across 6 entity types.
- **Announcements** (`CAP-EXT-ANNOUNCEMENTS`) broadcast + acknowledgment · **Projects/sprint
  backlog** (`CAP-EXT-PROJECTS`) [deferred] · **Mobile-first parallel UI** (`CAP-EXT-MOBILE`) [BE].
- **Documents** (`CAP-CROSS-DOCS`) — server-side PDF (QuestPDF + Puppeteer) for PO / invoice /
  packing slip / BOL / statement / RMA / credit memo; printable/emailable.
- **Attachments** (`CAP-CROSS-ATTACHMENTS`) — MinIO (S3) storage, drag-drop upload zone,
  lightbox gallery, camera capture.
- **Bulk operations** (`CAP-CROSS-BULK-OPS`), **list UX** (`CAP-CROSS-LIST-UX`: search/filter/
  sort/paginate, column manager), **optimistic locking + conflict resolution** (`CAP-CROSS-CONCURRENCY`).
- **Integrations** — **EDI** X12/EDIFACT 850/855/856/810 (`CAP-CROSS-INTEG-EDI`),
  **file import/export** (`CAP-CROSS-INTEG-FILE`), **outbound webhooks** (`CAP-CROSS-WEBHOOKS`),
  **BI export** (`CAP-CROSS-BI-EXPORT`), **email sync** inbound/outbound (`CAP-EXT-EMAIL-SYNC`).
- **Communications sync** — **email sync** inbound/outbound (`CAP-EXT-EMAIL-SYNC`) and
  **VoIP/call sync** (`CAP-EXT-VOIP-SYNC`) to log communications against records.
- **Cloud storage integration** (`CAP-EXT-CLOUD-STORAGE` umbrella) — Google Drive
  (`CAP-EXT-CLOUD-GDRIVE`), OneDrive (`CAP-EXT-CLOUD-ONEDRIVE`), Dropbox
  (`CAP-EXT-CLOUD-DROPBOX`) providers [BE/partial].
- **Pluggable integration services** (`MOCK_INTEGRATIONS` bypass): Accounting (QB real +
  factory); Shipping UPS/FedEx/USPS/DHL (real, multi-carrier aggregator) + Stamps.com
  (descriptor-only) + manual mode; Address validation (USPS Web Tools); AI (Ollama);
  Storage (MinIO); Signing (DocuSeal); TTS (Coqui, profile).
- **Real-time fabric** — SignalR hubs (board, notifications, timer, chat) with reconnect +
  connection banner + offline banner + IndexedDB action queue (sync-on-reconnect).
- **Scheduled tasks** — admin-defined recurring jobs via Hangfire.
- **Barcodes/QR/labels** — keyboard-wedge scanner service, bwip-js + angularx-qrcode, label printing.

## 11. Administration & Configuration

*(IDEN-users/roles/tenant-config/audit + the admin surfaces)*. The `/admin/*` area
(`[Authorize(Roles="Admin")]`), plus tenant setup.

- **User management** (`CAP-IDEN-USERS`) — create/edit users, activate/deactivate, initials/
  avatar, **email correction** (sync UserName, uniqueness, audited), setup-token issuance,
  scan-identifier (RFID/barcode) pairing, work-location assignment, compliance status.
- **Roles / RBAC** (`CAP-IDEN-ROLES`, `CAP-CROSS-PERMS-MATRIX`) — additive roles + admin-defined
  **role templates** (rollup roles for multi-hat staff; system defaults FrontOffice/FloorLead/
  OwnerOperator).
- **Capability administration** — browse grid by area (`/admin/capabilities`), per-capability
  detail + dependency/mutex view, enable/disable + bulk toggle, **audit log** of changes
  (`/admin/capabilities/audit-log`); SignalR `capabilityChanged` push.
- **Discovery wizard** (`/admin/discovery`) — 22-question flow → server recommendation engine
  → applies a preset.
- **Preset browser** (`/admin/presets`) — 8 presets (7 named + Custom) with a diff modal before apply.
- **Reference data** — single `reference_data` admin screen for all lookups (recursive groups,
  immutable codes, admin-editable labels, JSONB metadata).
- **Terminology** — admin-configurable label resolution (`TerminologyService`/pipe, live preview).
- **Company / tenant configuration** (`CAP-IDEN-TENANT-CONFIG`) — company profile (`company.*`
  settings: name/phone/email/EIN/website), **Company Locations** (multiple; one default;
  per-employee work location → state withholding), 2-step setup wizard.
- **Integrations admin** — SMTP/email, accounting provider connect (OAuth), shipping carrier
  keys, USPS, DocuSeal, AI — with `IOptions` hot-reload on save.
- **MFA policy** (`/admin/mfa`) — role-based MFA enforcement.
- **AI Assistants admin** (`/admin/ai-assistants`) — HR/Procurement/Sales domain assistants.
- **EDI admin** (`/admin/edi`) — trading partners, transaction lifecycle, field mappings,
  inbound polling, retry.
- **Events admin** (`/admin/events`), **Time corrections** (`/admin/time-corrections`),
  **Scheduled tasks** (`/admin/scheduled-tasks`), **Track types / stages** management.
- **System audit log** (`CAP-IDEN-AUDIT-SYSTEM-LOG`) — system-wide `audit_log_entries`
  (login, role assignment, MFA, period lock, config edits, email change, …).

## 12. Maintenance & Assets

*(MAINT, MD-assets)*

- **Assets / fixed-asset master** (`CAP-MD-ASSETS`) — asset CRUD, types/status, tooling fields
  (cavity count, tool-life expectancy, shot count, customer-owned, source job/part); Job
  disposition can capitalize a job as an asset.
- **Preventive maintenance** (`CAP-MAINT-PM`), **breakdown/corrective WO** (`CAP-MAINT-BREAKDOWN`),
  **predictive/ML** (`CAP-MAINT-PREDICTIVE`), **asset lifecycle** transfer/retirement/custodian
  (`CAP-MAINT-ASSETLIFECYCLE`) — [deferred].

## 13. Professional Services & Engagements

*(PS)* — for shops/teams that bill project/engagement work (T&M, fixed-bid, retainer),
layered on the job/time spine. Mostly [BE]/[design].

- **Engagement tracking** (`CAP-PS-ENGAGEMENT`) — engagement axis fields + an Engagement
  track surface.
- **Billable/non-billable time** (`CAP-PS-TIME-BILLABLE`) — split on time entries.
- **Rate cards** (`CAP-PS-RATE-CARDS`) — per-resource / per-role bill rates.
- **Engagement costing** (`CAP-PS-PROJECT-COST`) — T&M and fixed-bid.
- **Retainer billing** (`CAP-PS-RETAINER`) — prepaid-hours.
- **Utilization** (`CAP-PS-UTILIZATION`) — dashboard widgets.

> **Deployment / onboarding ops** (operator-facing, *not* end-user product): customer
> provisioning, preset selection, `forge-deploy` (GHCR immutable-tag, healthcheck-gated
> re-pin behind Cloudflare Tunnel), demo seeding — see `docs/pro-services-rollout/` and
> `forge-deploy/docs/DEPLOY.md`.

---

## Roles (additive)

| Role | Access |
|------|--------|
| Engineer | Kanban, assigned work, files, expenses, time tracking |
| PM | Backlog, planning, leads, reporting, priority (read-only board) |
| Production Worker | Task list, start/stop timer, move cards, notes/photos |
| Manager | PM + assign work, approve expenses, set priorities |
| Office Manager | Customer/vendor, invoice queue, employee docs |
| Admin | Everything + users, roles, system settings, track types |

Plus admin-defined **role templates** (rollup roles for small shops where one person wears
many hats).

---

## Capability Appendix

The definitive feature-gate enumeration — **152 capabilities across 15 areas**
(`forge-api/forge.api/Capabilities/CapabilityCatalog.cs`). Presence here ≠ enabled on a
given install.

**IDEN — Identity & Access (10):** Password auth · MFA (TOTP) · SSO (Google/MS/OIDC) ·
BI/integration API keys · Kiosk/RFID/NFC/barcode · User management · RBAC · Tenant config ·
System audit log · Capability administration.

**MD — Master Data (20):** Customers · Customer contacts · Customer addresses · Customer
interactions (CRM) · Vendors · Parts · BOM · Routings · Work centers · Locations/plants ·
Calendars (shifts/holidays/downtime) · Employees · Fixed assets · Customer price lists · UoM ·
Currencies/FX · Sales-tax/VAT codes · Consignment contracts · ECO · Part compliance fields.

**P2P — Procure-to-Pay (8):** Purchase orders · RFQ · Receiving+3-way-match · Auto-PO
(replenishment) · Drop-ship · Back-to-back · Subcontract send/receive · PO/requisition approvals.

**O2C — Order-to-Cash (14):** Leads · Credit limits/terms · Quote/estimate · CPQ · Sales
orders · Recurring/subscription · Pick/pack · Shipment+carrier · Customer invoice · Cash
receipt/application · AR collections/dunning · Credit memo · RMA/returns · Deliverable tracking.

**MFG — Manufacturing Execution (12):** WO release · Material issue · Backflush · Labor
reporting · Multi-op routing · Completion+scrap+rework · WO variance · Dept cost rates (T2) ·
Activity-based costing (T3) · Shop-floor execution · Stoppage/downtime · Machine/IoT ingest.

**PLAN — Planning (7):** MRP · MPS · Demand forecast · Finite capacity scheduling ·
Safety-stock/reorder-point · Available-to-promise · ABC classification.

**INV — Inventory (10):** Core tracking · Multi-location · Cycle counting · Manual override ·
Annual physical · Lots+FEFO · Serials · Reservations · Pick wave · Hazmat/SDS.

**QC — Quality (10):** Inspection plans · NCR+disposition · CAPA · FMEA · PPAP · SPC · Gage
calibration · Recall/lot trace · Certificate of analysis · Compliance-form pipeline.

**MAINT — Maintenance (4):** PM scheduling · Breakdown/corrective WO · Predictive (ML) ·
Asset transfer/retirement/custodian.

**ACCT — Accounting (8):** External integration ⊥ Built-in lightweight (CRUD) · Full GL
(not yet) · Expenses · Period close+lock · Depreciation · Multi-currency revaluation ·
Mode-migration wizard.

**HR — People (8):** Hire/onboarding · Termination/offboarding · PTO/leave · Time tracking ·
Shifts · Payroll feed · Training/certification · Performance reviews.

**PS — Professional Services (6):** Engagement tracking · Billable/non-billable time ·
Rate cards · Engagement costing (T&M/fixed-bid) · Retainer/prepaid-hours billing · Utilization.

**RPT — Reporting (6):** Operational reports · Financial statements (P&L/BS/CF/TB) · Inventory
valuation · MRP exception · OEE · Dashboards.

**CROSS — Cross-cutting (12):** Permission matrix · Activity log · List UX · Bulk ops ·
Document generation · Attachments · Notifications · EDI (850/855/856/810) · File import/export ·
Webhooks · BI export · Optimistic locking.

**EXT — Experience/UX surfaces (17):** Kanban board · Replenishment kanban · Mobile UI ·
Shop-floor kiosk · Chat · Chat integrations (Slack/Teams/Discord/Google Chat) · AI assistant+RAG ·
Andon · Projects/sprints · Announcements · Customer portal · Email sync · VoIP/call sync ·
Cloud storage (umbrella) · Google Drive · OneDrive · Dropbox.

---

## Sources

Aggregated from the current/authoritative markdown + catalog:

- **`CLAUDE.md`** — Features (Implemented) table, Functional Decisions, integrations, roles,
  capability gating, part decomposition, vendor-part, order management, shared components.
- **`forge-api/.../Capabilities/CapabilityCatalog.cs`** — the 152-capability definitive gate list.
- **`docs/functional-decisions.md`** — authoritative per-area behavior decisions.
- **`docs/definition-of-correct.md`** (+ regulated addendum) — quote-to-cash invariants.
- **`docs/functional-reference/`** — ~57 per-feature reference docs.
- **`docs/domain/`** — domain/business-rule docs · **`docs/implementation-status.md`** — status tracker.
- **`docs/README.md`** — docs taxonomy + frontmatter spec.

> **Not aggregated** (working ledgers / process / archived): `AUDIT.md`, `DISCOVERY.md`,
> `docs/ba/gap-inventory.md`, `docs/delivery/**`, `phase-4-output/**`, session-context files,
> and any `[ARCHIVE]`-prefixed docs. Reference them for *why*, not *what ships*.
