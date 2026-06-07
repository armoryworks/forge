---
title: Forge — Functional Surface Area (Master)
type: product
status: stable
id: functional-surface-area
updated: 2026-06-07
---

# Forge — Functional Surface Area

The single, aggregated outline of **what Forge does** — the full product feature
suite, organized by domain. It is synthesized from the current, authoritative
markdown sources (see [Sources](#sources)); it is a map, not a re-spec. For the
*correct behavior* of any feature, follow the linked source doc.

Forge is an end-to-end ERP/MES for small-to-mid manufacturing shops, spanning the
**quote-to-cash spine** (Lead → Quote → Sales Order → Job/Production → Shop Floor →
Inventory → Shipment → Invoice → Payment) plus the surrounding master-data,
procurement, quality, people, and platform capabilities.

> **Two cross-cutting gates shape everything below — read these first:**
>
> - **Capability gating** — 129 named capabilities (static catalog) decide what's
>   *on* per install. Each install enables a subset; controllers + MediatR handlers
>   carry `[RequiresCapability("CAP-…")]` and return 403 when disabled. Areas:
>   **MD** master data (~23) · **EXT** experience/UX surfaces (~19) · **CROSS**
>   cross-cutting (~12) · **INV** inventory (~10) · **QC** quality (~10) · **P2P**
>   procure-to-pay (~8) · **ACCT** accounting (~8) · **HR** people (~8) · plus O2C,
>   PLAN/MRP, MFG, PLAT. A feature appearing here does not mean it's enabled on a
>   given install. (`forge-api/.../Capabilities/CapabilityCatalog.cs`)
> - **⚡ Accounting boundary** — features that an external accounting provider
>   (QuickBooks/Xero/etc.) owns natively are **cordoned**: they run only in
>   *standalone* mode and go read-only/hidden when a provider is connected
>   (mutex `CAP-ACCT-EXTERNAL ⊥ CAP-ACCT-BUILTIN`). The general ledger is
>   **never-in-app** (`CAP-ACCT-FULLGL` is an aspirational placeholder). Such
>   features are marked **⚡** below.
>
> **Maturity tags:** *(no tag)* = implemented & in use · **[BE]** backend-only /
> UI-thin · **[deferred]** designed/registered but not pursued · **[design]**
> decision/spec stage.

---

## 1. Core Production & Job Management

The shop-floor execution spine.

- **Kanban Board** — track-typed job board (Production, R&D/Tooling, Maintenance,
  Other + custom); drag-to-move with WIP limits, multi-select bulk actions
  (move/assign/priority/archive), SignalR real-time sync (optimistic, last-write-wins),
  irreversible-stage locks, archive-not-delete.
- **Production track stages** — QB-aligned: Quote Requested → Quoted → Order
  Confirmed → Materials Ordered → Materials Received → In Production → QC/Review →
  Shipped → Invoiced → Payment Received.
- **Jobs** — create/edit, priority, disposition (Scrap / Rework / Capitalize-as-Asset
  with audited reason), parent/sub-jobs, job links (related/blocks/duplicates), parts,
  subtasks, activity log, status lifecycle, cost & operation-time analysis, work-order PDF.
- **Shop Floor Display** — full-screen kiosk (`/display/shop-floor`) with RFID/barcode→PIN
  auth, touch-first worker card grid, timer start/stop, mark-complete, auto-dismiss timeouts,
  `IsShopFloor` stage filter, theme/font persistence.
- **Planning Cycles** — configurable (default 2-week) cycles with a guided Planning Day,
  split-panel backlog→cycle drag-to-commit, daily Top-3 prompts, end-of-cycle rollover.
- **Backlog** — prioritized, filterable job queue feeding the board/planning.
- **Calendar** — scheduling/timeline view.
- **Status lifecycle** — polymorphic workflow status + holds (set-status / add-hold
  dialogs, status timeline) reusable across entities.
- **[BE]/[deferred] MES depth** — work-order release, material issue/return, labor capture,
  production runs, MRP/scheduling are partially backend-built and UI-thin.

## 2. Parts, Engineering & Bill of Materials

- **Parts catalog** — full CRUD with the **3-axis decomposition** replacing legacy
  `PartType`: `ProcurementSource` (Make/Buy/Subcontract/Phantom) × `InventoryClass`
  (Raw/Component/Subassembly/FinishedGood/Consumable/Tool) × `ItemKindId` (admin
  taxonomy). Plus traceability type (None/Lot/Serial), ABC class, manufacturer
  identity, status (Draft/Prototype/Active/Obsolete).
- **Part detail** — axis-driven tab layout (resolver-chosen clusters: identity, sourcing,
  purchase history, inventory, MRP, BOM, routing, cost, pricing, quality, alternates,
  material) + a persistent Activity footer (conversation/notes/history) + Files.
- **Guided part creation** — `WorkflowComponent` framework (Express/Guided modes,
  per-step persistence, URL-as-source-of-truth, deferred materialization).
- **BOM** — multi-level bill of materials with source type, lead time, reference
  designators, revision history, and a cycle guard (no A→B→A).
- **Routing / Operations** — operation sequences, materials, subcontract steps, QC
  checkpoints, operation-time analysis.
- **Purchase options (UoM)** — per-part purchasable pack sizes with content quantity →
  per-base-unit cost normalization (feeds pricing/comparison).

## 3. Inventory & Warehouse

- **Core tracking** — on-hand per part at location/bin granularity, transactional
  movements (`BinMovement`), soft-delete history, reservations vs available.
- **Storage locations** — hierarchical bins/locations with types, barcodes; CRUD + edit.
- **Receiving** — PO receipt → stock with location, 3-way-match groundwork.
- **Manual inventory override** — directly set/adjust on-hand for an existing part
  (opening stock, count corrections, found inventory) bypassing purchasing; audited
  reason + optional PO/vendor provenance; `CAP-INV-ADJUST` (Admin/Manager).
  **Operational only — never posts to a ledger** (see [design](../delivery/in-progress/inventory-override/design.md)).
- **Lots & serials** — lot traceability + FEFO/expiry, per-unit serial tracking
  (capability-gated; forward/backward trace).
- **Cycle counting** — periodic spot counts with variance reconciliation; annual physical [BE].
- **Valuation** — Average/Standard costing reports.
- **[BE]/[deferred]** — multi-location transfers, reservations, pick waves, ABC/replenishment,
  inter-plant/consignment are backend-leaning.

## 4. Sales & Order-to-Cash (CRM → Cash)

- **Leads** — pipeline (table + drag board), statuses, sources, lost-reason capture,
  follow-ups, inline **Account** creation (edit + bulk-assign), convert-to-customer (atomic).
- **Customers** — list + full detail (`/customers/:id/:tab`, 9 tabs: overview, contacts,
  addresses, estimates, quotes, orders, jobs, invoices, activity), live stats bar,
  multi-address model, contact interactions (call/email/meeting/note).
- **Accounts** — account ↔ contacts/leads roll-up.
- **Estimates** — non-binding single-amount ballparks; convert to Quote (`source_estimate_id`).
- **Quotes** — binding, line-itemized (part/qty/unit price); customer price-list resolution;
  convert to Sales Order; shares the `quotes` table with Estimates via `QuoteType`.
- **Sales Orders** — confirmed orders, editable draft header + lines, credit terms,
  billing address, requested delivery, customer PO.
- **Shipments** — shipment + lines; carrier integration (rates/labels/tracking) or manual
  tracking; relieves inventory + releases reservations.
- **Price Lists / Quantity breaks / Recurring orders** — customer-specific pricing,
  tiered breaks, scheduled recurring orders ([BE] for some).
- **Customer Portal (v1)** — magic-link auth; dashboard / orders / quotes / invoices /
  shipments + quote accept/decline; `CAP-EXT-CUSTOMER-PORTAL` (default off), lives at `/portal/*`.

## 5. Procurement & Procure-to-Pay

- **Vendors** — full local CRUD (read-only when an accounting provider is integrated).
- **Vendor-Parts** — the (Vendor × Part) intersection: vendor part number, MPN, lead time,
  MOQ, pack size, country of origin, HTS, AVL/approved + preferred flags, certifications.
  At most one preferred VendorPart per Part.
- **Vendor price tiers** — tiered pricing (min-qty breaks, effective dates) linked to a
  **purchase option**; per-base-unit normalization for true cross-vendor comparison.
- **Purchase Orders** — PO + lines + releases; auto-fill unit price from vendor tiers/part
  pricing (option-aware); manual price override with permission gating + reason capture;
  off-tier variance prompt; receiving records.
- **AI-assisted price-override review** — scores a manual unit-price override (deterministic
  variance vs tiers + optional AI risk narrative + suggested justification);
  `CAP-EXT-AI-ASSISTANT`, degrades gracefully offline.
- **RFQ** — request-for-quote to vendors, vendor responses, generate PO.
- **[BE]/[deferred]** — auto-PO suggestions, drop-ship, blanket releases.

## 6. Quality & Compliance

- **QC templates & inspections** — configurable inspection plans, inspections tied to
  production runs, pass/fail.
- **Production lots & traceability** — lot records + traceability query [BE].
- **Customer returns** — RMA lifecycle (create → resolve → close) [BE].
- **[BE]/[deferred]** — NCR, CAPA, FMEA, PPAP, SPC, gage calibration, ECO are
  backend-registered / aspirational (`RECORD-ONLY` scope in the audit).

## 7. HR & People

- **Time tracking** — time entries + clock events; admin/manager time corrections with
  audit trail (original-value snapshot, required reason).
- **Expenses** — expense capture, categories, receipts (camera/upload), approval flow.
- **Payroll (self-service)** — pay stubs + tax documents (employee view + admin upload);
  QB Payroll sync stubbed [BE].
- **Employee compliance forms** — W-4, I-9, state withholding via a dynamic form engine
  + PDF extraction pipeline (pdf.js/PuppeteerSharp → ComplianceFormDefinition → AI verify)
  + DocuSeal signing.
- **Training LMS** — 46 seeded modules (Article/Video/Walkthrough/QuickRef/Quiz), 8 paths,
  randomized quiz pools, learning-style filter, progress tracking, admin CRUD, per-user drill-down.
- **Events** — Meeting/Training/Safety/Other with attendee RSVP, shop-floor upcoming,
  15-min reminders.
- **Company profile & locations** — `company.*` settings; multiple `CompanyLocation`s
  (one default); per-employee work location → state withholding.
- **[BE]/[deferred]** — hire/onboarding, termination/offboarding, leave management.

## 8. Financials & Accounting ⚡

All **⚡** features are **standalone-mode only** (cordoned by the accounting boundary).

- **Invoices ⚡** — local CRUD + PDF; invoiced-≤-shipped intended.
- **Payments ⚡** — local recording + application to invoices.
- **AR Aging ⚡** — implemented as a Reports template.
- **Sales tax ⚡** — per-state/jurisdiction rates, invoice calculation.
- **Customer statements / financial reports ⚡** — P&L, revenue, payment history.
- **Credit terms ⚡** — terms management.
- **Built-in lightweight GL** — `accounting-gl-phase0` data model exists but is **gated
  off** (`CAP-ACCT-FULLGL` never enabled). Full GL / bookkeeping / bank-rec / payroll-tax /
  depreciation are **never-in-app**.
- **Always-in-app (any mode):** margin estimates, sales orders/quotes/shipments, price
  lists, recurring orders, multi-address.

## 9. Reporting & Analytics

- **Dashboard** — multi-widget aggregate (KPIs, mini-calendar, charts via ng2-charts).
- **Dynamic Report Builder** — 28 entity sources, 350+ fields, 27 pre-seeded templates
  (incl. AR Aging), saved reports, charting.
- **Activity & audit** — per-entity activity feed (conversation/notes/history with @mentions),
  system-wide `audit_log_entries`, immutable history.

## 10. Platform & Infrastructure

- **Auth** — ASP.NET Identity + JWT (short access + rotated refresh), tiered kiosk auth
  (RFID/NFC/barcode + PIN), optional SSO (Google/Microsoft/OIDC, token-exchange,
  AllowedTenants/Domains), TOTP **MFA** (QR + recovery codes, admin role policy),
  account lockout.
- **Capability system** — 129-capability catalog, per-install state, middleware + MediatR
  gating, admin browse/detail/audit-log, 22-question discovery wizard, 8 presets,
  `*appCap` directive + route guard.
- **Reference data** — single `reference_data` table for all lookups (recursive groups,
  immutable codes, admin-editable labels) — one admin screen.
- **Terminology** — admin-configurable label resolution (`TerminologyService`/pipe).
- **Notifications** — real-time SignalR push, bell badge, filtering, preferences, SMTP email.
- **Chat** — 1:1 DMs + group rooms, SignalR real-time, file/entity sharing.
- **AI Assistant** — self-hosted Ollama + pgvector RAG (smart search, doc Q&A, drafting,
  Hangfire indexing); configurable domain assistants (HR/Procurement/Sales).
- **Search** — full-text tsvector + RAG hybrid across 6 entity types.
- **Files** — MinIO (S3) storage, drag-drop upload zone, lightbox gallery, camera capture.
- **Barcodes / QR / Labels** — scanner service (keyboard-wedge), bwip-js + angularx-qrcode,
  label printing.
- **Real-time** — SignalR hubs (board, notifications, timer, chat) with reconnect + offline
  banner + action queue (sync-on-reconnect).
- **EDI** — X12/EDIFACT trading partners, transaction lifecycle, field mappings, inbound polling.
- **Scheduled tasks** — admin-defined recurring tasks via Hangfire.
- **Integrations (pluggable; `MOCK_INTEGRATIONS` bypass):**
  - *Accounting* — QuickBooks Online (real); Xero/FreshBooks/Sage/NetSuite/Wave/Zoho (provider factory).
  - *Shipping* — UPS/FedEx/USPS/DHL (real) via multi-carrier aggregator; Stamps.com descriptor-only; manual mode always.
  - *Address validation* — USPS Web Tools (decoupled from shipping).
  - *AI* — Ollama; *Storage* — MinIO; *Signing* — DocuSeal; *TTS* — Coqui (profile).
- **Admin** — users/roles, role templates (rollup roles), settings, integrations,
  capabilities, discovery, presets, MFA policy, EDI, events, time corrections.

## 11. Pro Services & Engagements

Deployment/onboarding tooling (operator-facing, not end-user product): customer
provisioning, preset selection, `forge-deploy` (GHCR immutable-tag, healthcheck-gated),
demo seeding. See `docs/pro-services-rollout/` and `forge-deploy/docs/DEPLOY.md`.

---

## Roles (additive)

Engineer · PM · Production Worker · Manager · Office Manager · Admin — plus
admin-defined **role templates** (rollup roles for small shops where one person wears
many hats). See `CLAUDE.md` → Roles and `docs/domain` / roles-auth.

## Sources

This master aggregates the current/authoritative markdown:

- **`CLAUDE.md`** (repo root) — Features (Implemented) table, Functional Decisions,
  integrations, roles, capability gating, part decomposition, vendor-part, order management.
- **`docs/functional-decisions.md`** — authoritative per-area behavior decisions.
- **`docs/definition-of-correct.md`** (+ regulated addendum) — quote-to-cash invariants.
- **`docs/functional-reference/`** — ~57 per-feature reference docs.
- **`docs/domain/`** — domain/business-rule docs.
- **`docs/implementation-status.md`** — feature-vs-spec status tracker.
- **`docs/README.md`** — docs taxonomy + frontmatter spec.
- **`forge-api/.../Capabilities/CapabilityCatalog.cs`** — the 129-capability definitive gate list.

> **Not aggregated** (working ledgers / process / archived): `AUDIT.md`, `DISCOVERY.md`,
> `docs/ba/gap-inventory.md`, `docs/delivery/**`, `phase-4-output/**`, session-context
> files, and any `[ARCHIVE]`-prefixed docs. Reference them for *why*, not *what ships*.
