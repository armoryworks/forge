---
title: Audit Remediation — Master Findings Catalog
type: delivery
status: in-progress
id: audit-remediation-catalog
updated: 2026-05-27
---

# Master Findings Catalog

The complete, deduplicated, severity-ranked TODO from the 44-phase audit, grouped
by **root cause** (not by phase) so a single fix retires its whole symptom cluster.
Each row maps a finding to the test that proves it fixed.

**Status legend:** `☐` todo · `🔴` RED test written (skipped, awaiting fix) · `✅` green (fixed + test passing)
**Test layers:** xUnit (handler) · EF (`TestDbContextFactory`) · Integration (`WebApplicationFactory`) · Vitest · Cypress · axe (`test:a11y`) · manual (CSS/code audit)

Finding IDs trace to `forge-analysis/findings/`. Rows already tracked in the
api-test suite are flagged **[api-BACKLOG]** — `forge-api/forge.tests/Remediation/BACKLOG.md`
is the live execution log for those; this catalog is the cross-layer master.

---

## Theme A — Financial & data-integrity correctness (api)

The defects that let the system record financially or physically impossible state.
Highest-confidence cluster: several were found by a unit-level phase *and*
re-confirmed live by a flow-level phase (cross-refs noted).

| ID (corroborating) | Sev | Defect (where) | Expected | Test | Status |
|----|-----|----------------|----------|------|--------|
| **AUDIT-21-S1** (FLOW-27-F4-S1) | BLOCKER | AR invoices/payments never enqueue the QBO `SyncQueue`; queue processor never scheduled; only `MoveJobStage.cs:172` enqueues. `/sync-queue/status`→404 | Invoice/Payment create enqueues a QBO sync row; processor job registered + drains | Integration | ☐ [api-BACKLOG] |
| **AUDIT-S4 / BE20-C** (FLOW-27-F1-S4) | HIGH | `ConvertQuoteToOrder.cs:27-48` converts a zero-line quote into a confirmable $0 order | Empty quote cannot convert / advance lifecycle (≥1 line required) | xUnit | 🔴 [api-BACKLOG] |
| **AUDIT-S6 / BE18-1** | HIGH | `ConvertLead.cs` split `SaveChanges`, no transaction → orphan customer on partial failure | Lead→customer convert is atomic (one tx, rolls back) | EF | ☐ [api-BACKLOG] |
| **AUDIT-P06-1 / Q2C-BE-8** (FLOW-27-F4-S2) | HIGH | `CreateInvoice.cs:49-99` does not enforce `invoiced ≤ shipped` ($99,900 invoice vs zero shipments, live) | Cannot invoice more than shipped (validation rejects) | EF / xUnit | ☐ [api-BACKLOG] |
| **AUDIT-P06-3 / INV-1** | HIGH | Shipping does not relieve on-hand; `InventoryReliefService` orphaned (`Program.cs:387`) | Shipping a line decrements bin on-hand | EF / xUnit | ☐ [api-BACKLOG] |
| **S-MV1** (ph23) | HIGH | `ShipShipment` leaks on **two** axes: never relieves `on_hand` AND never releases the SO-line `Reservation` | Ship decrements `BinContent` **and** releases the `SalesOrderLineId` reservation | EF | ☐ |
| **S-RI1** (ph23) | HIGH | `TransferStock` / `AdjustStock` / `UpdateCycleCount` / `RemoveBinContent` ignore `ReservedQuantity`, inflating `available` | Reducing/removing a bin throws if `newQty < ReservedQuantity`; transfer carries reserved to dest | EF | ☐ |
| **PRI-1 / PRI-2 / PRI-3** (ph24, FLOW-29-F2-S4) | HIGH | PO-side ReceiveDialog marks PO Received + fires "Materials Ready" but writes **no** `BinContent`; inv-tab Receive stocks correctly but never advances PO status — notify-XOR-stock | One receive path both writes `BinContent` and advances PO status; location required when stocking | EF + Cypress | ☐ |
| **F-JQ1** (ph26) | HIGH | Job advances through completion with **open NCRs / failed inspections / unresolved CAPAs** | `MoveJobStage` rejects advance when `NCR.Status==Open` or `QcInspection.Status==Failed` | EF / xUnit | ☐ |
| **AUDIT-19-S1** | HIGH | Customer price lists are a dead input to quote-line pricing | Quote line price resolves from the customer's price list when present | xUnit | ☐ [api-BACKLOG] |
| **AUDIT-V9** | HIGH | Vendor price-tier variance silently dropped | Vendor-part price-tier writes persist / surface; no silent drop | xUnit | ☐ [api-BACKLOG] |
| **AUDIT-D5** | HIGH | No BOM cycle guard (A→B→A possible) | Adding a BOM edge that forms a cycle is rejected | EF | ☐ [api-BACKLOG] |
| **F-26B-01** (ph26b) | HIGH | Expense has **no vendor/payee link** full-stack (no UI field, API, or FK) | Add `VendorId`/`PayeeId` FK to `Expense` + vendor picker on create | Integration | ☐ |
| **F-26B-02** (ph26b) | HIGH | Expense→QBO posts as a vendorless cash purchase (no `VendorRef`), invisible in vendor aging | Set `VendorExternalId` on the accounting expense from the vendor FK | Integration | ☐ |
| **AUDIT-BE-1 (Q-3 / SO-8)** | HIGH | Quote lines & SO header/lines immutable after creation; no edit path | Draft quotes/orders editable (header + lines) | xUnit + Vitest/Cypress | ☐ [api-BACKLOG] |
| **BE-1** (carried) | HIGH | `working-calendars/:id/set-default` → HTTP 500 (non-atomic default swap; unique `is_default` violation) | Set-default atomically clears the prior default | EF | ☐ [api-BACKLOG] |
| **AUDIT-S3** (FLOW-27-F1-S3) | MED | `ConvertQuoteToOrder.cs:27-34` drops `quote.Notes` (the only quote-sourced header field of the 5 the flow flagged) | Convert preserves `Notes` onto the order | xUnit | 🔴 [api-BACKLOG] |
| **AUDIT-S3b / SO-8** (FLOW-27-F1-S3) | MED | SO-only header fields (CreditTerms/BillingAddress/RequestedDelivery/CustomerPO) unsettable post-convert (no SO edit) | Draft SO header editable for these fields | Cypress | ☐ [api-BACKLOG] |

---

## Theme B — Security / authorization (api)

| ID | Sev | Defect (where) | Expected | Test | Status |
|----|-----|----------------|----------|------|--------|
| **G-38-MRP-3 / F-07B-03** | **BLOCKER** | `PlanningCyclesController` mutations reachable by ProductionWorker — no role gate (live POST→201) | `[Authorize(Roles="Admin,Manager")]` on all planning-cycle mutations | Integration | ☐ |
| **F-EXP-01** | **BLOCKER** | `PATCH /expenses/{id}/status` has no role/self gate — any user approves any expense (live, ph06b) | Approval gated by role/ownership; routed through `ApprovalService` | Integration | ☐ |
| **F-26B-05** (ph26b) | HIGH | Configured multi-step approval policy fully bypassed — a single status-flip ignores routing/approvers/escalation | Expense approval goes through `ApprovalService`, not a direct status PATCH | Integration | ☐ |
| **G-39-EMAIL-1** | LOW | `GET /communications/connections` returns 200 when `CAP-EXT-EMAIL-SYNC` is OFF (read-leak; cap-check is mutations-only) | Add `[RequiresCapability]` to the GET (or register the `communications` prefix) | Integration | ☐ |

---

## Theme C — Capability-gating UX coherence (ui) — the phase-40 "NO" verdict

**Root causes** (fix these three and the symptom rows below collapse):

| ID | Sev | Root-cause defect | Expected | Test | Status |
|----|-----|-------------------|----------|------|--------|
| **N-E3** (ph30/40) | HIGH | `NavTreeService.filterTree()` filters by role only — sidebar advertises cap-OFF features | Nav filters entries against `CapabilityService.isEnabled(cap)` | Cypress | ☐ |
| **P-F4** (ph30/40) | HIGH | `*appCap` clears DOM silently; cap-OFF pages show chrome + empty table + generic "no data", no "feature disabled" banner | Ship a shared explained-unavailable state (`*appCapNot` / feature-disabled component) on every cap-gated route | Cypress | ☐ |
| **G-E2** (ph30/40) | HIGH | Mutating dialogs fail silently on cap-OFF 403 | Intercept `CapabilityDisabledError` → disable entry w/ tooltip or render explained-unavailable | Cypress | ☐ |
| **G-38-MRP-1** | **BLOCKER** | MRP page **freezes** (infinite effect re-trigger) when `CAP-PLAN-MRP` OFF | Route guard / `untracked()` signal guard prevents the load loop | Cypress | ☐ |

**Symptoms** (per-feature; each is a silent dead-end — enabled button / empty list / persistent nav with no explanation when its cap is OFF). Verified once the root-cause fixes land; track collectively.

| ID | Sev | Cap | Surface |
|----|-----|-----|---------|
| G-37-MD-2 | MED | CAP-O2C-QUOTE | Estimates/Quotes tabs missing from `tabCapabilityMap` |
| G-37-MD-1 / G-37-MD-3 | MED | CAP-MD-CUSTOMER-CONTACTS | standalone `/customers/contacts` silent dead-end (detail-tab hides gracefully — inconsistent) |
| G-37-RFQ-1 | MED | CAP-P2P-RFQ | "New RFQ" enabled, submit fails silently |
| G-37-RMA-1 / RMA-2 | MED/LOW | CAP-O2C-RMA | "New Return" enabled + list 403 silent |
| G-37-RCR-1 | MED | CAP-O2C-RECURRING | "New Recurring" enabled, submit fails silently |
| G-38-MRP-2 | MED | CAP-PLAN-MRP | "Run MRP" → silent fail (no snackbar) |
| G-38-AUTOPO-1 / AUTOPO-2 | MED/LOW | CAP-P2P-AUTOPO | Suggestions tab renders empty; unhandled `CapabilityDisabledError` |
| G-38-CF-1 / CF-2 / CF-3 | MED/LOW | CAP-QC-COMPLIANCE-FORMS | `/account/tax-forms` + admin compliance panel silent-empty |
| G-39-TRN-1 | MED | CAP-HR-TRAINING | training nav persists; detail shows "Module not found" |
| G-39-EDI-1 | MED | CAP-CROSS-INTEG-EDI | admin EDI panel renders, no banner |
| G-39-ANN-1 | MED | CAP-EXT-ANNOUNCEMENTS | announcements panel renders, no banner |
| G-39-AI-1 / AI-2 | MED | CAP-EXT-AI-ASSISTANT | admin AI panel + `/ai/:id` route, no guard/banner |
| G-39-BI-1 / BI-2 | MED/LOW | CAP-CROSS-BI-EXPORT | BI API-keys panel, no banner / no dep-chain context |
| G-39-EMAIL-3 | LOW | CAP-EXT-EMAIL-SYNC | banner interpolates raw cap code instead of plain language |
| EX-32-09 | MED | (cross-cut) | "nav lies" — same root cause as N-E3 + P-F4 |

---

## Theme D — WCAG 2.2 AA (a11y) — shared components

WCAG AA is non-negotiable (`CLAUDE.md`) and gated by `npm run test:a11y`. Fix the
**shared** component and the fix propagates everywhere it's used.

| ID | Sev | SC | Defect | Expected | Status |
|----|-----|----|--------|----------|--------|
| **SYS-01** | CRIT | 2.1.2 | `app-dialog` doesn't trap focus (0/12) | `cdkTrapFocus` on host + `cdkFocusInitial` on first field + focus restore on ESC | ☐ |
| **B1-N01** | CRIT | 1.3.6 | sidebar has no `role="navigation"` / `aria-label` | add nav landmark + label to `app-sidebar` | ☐ |
| **B1-N04** | CRIT | 2.4.1 | skip link not first in tab order | move `.skip-link` before `app-sidebar` in DOM | ☐ |
| **B1-S01** | CRIT | 4.1.2 | global search input has no accessible name | `aria-label="Search"` on the input | ☐ |
| **B2-K01** | CRIT | 2.1.1 | kanban has no keyboard alternative to drag | Space/Arrow column-move, or "Move to…" select in detail dialog | ☐ |
| **B3-C01** | CRIT | 1.1.1 | drillable chart canvas: no `role="img"`/`aria-label`/`aria-describedby` | add img role + label + describedby to paired table | ☐ |
| **B3-C02** | CRIT | 2.1.1 | chart canvas not focusable; drill is pointer-only | `tabindex="0"` + Enter/Space drill; breadcrumb as links | ☐ |
| **SYS-02** | HIGH | 4.1.3 | validation-button warning-count change never announced | `role="status" aria-live="polite"` region | ☐ |
| **B1-N02** | HIGH | 4.1.2 | active nav item has no `aria-current` | `aria-current="page"`, toggled on nav | ☐ |
| **B1-N03** | HIGH | 4.1.2 | nav group buttons have no `aria-expanded` | `aria-expanded`, toggled on expand/collapse | ☐ |
| **B1-S02** | HIGH | 4.1.2 | search missing combobox pattern (`role=listbox`/`option`) | full combobox ARIA pattern | ☐ |
| **B1-S03** | HIGH | 2.1.1 | search arrow-down doesn't navigate results | keydown handler + `aria-activedescendant` | ☐ |
| **B1-T01** | HIGH | 1.3.1 | `app-data-table` has no `aria-label` / `<caption>` | add label + caption | ☐ |
| **B2-K02** | HIGH | 4.1.2 | board columns/drop-lists have no role/label | `role="group"`/`role="list"` + stage-name labels | ☐ |
| **B2-SF01** | HIGH | 2.4.7 | kiosk inputs have no focus ring (4 routes) | restore `:focus` outline in kiosk stylesheet | ☐ |

---

## Theme E — MFA cryptography (api)

| ID | Sev | Defect | Expected | Test | Status |
|----|-----|--------|----------|------|--------|
| **G-MFA-3** | **BLOCKER** | TOTP HMAC keyed on `UTF8.GetBytes(secret)` vs the base32 QR secret → standard authenticator apps b32-decode and never match; QR enrolment broken | Base32-decode the secret before HMAC (QR + validation agree); golden-vector test | xUnit | ☐ |

---

## Theme F — Navigation discoverability (ui)

Features that exist and work but are unreachable from the sidebar (direct-URL only).

| ID | Sev | Defect | Expected | Test | Status |
|----|-----|--------|----------|------|--------|
| **EX-32-08** | HIGH | `/quality` route defined but **zero refs** in `nav-tree.service.ts` — entire QC module unreachable from nav | add quality nav entry (role-scoped) | Cypress | ☐ |
| **EX-32-47** | MED | `/notifications` + `/chat` have zero sidebar refs (header-only) | add sidebar entries (header access can stay) | Cypress | ☐ |

---

## Theme G — Data-entry guards & discoverability (ui)

| ID | Sev | Defect | Expected | Test | Status |
|----|-----|--------|----------|------|--------|
| **F1-02** | HIGH | Leads bulk-assign Confirm enabled with no account selected → submits `accountId: null` (silent data loss) | `[disabled]="saving() \|\| !bulkAccountControl.value"`; wrap in `app-validation-button` | Cypress + Vitest | ☐ |
| **F1-01** | HIGH | "Convert to Customer" only reachable from the detail panel — no row/bulk action | add "Convert" row-action for qualifying leads | Cypress | ☐ |
| **FLOW-27-F1-S6 / F3-01/02** | HIGH | Converted Draft SO absent from `/sales-orders` list; only reachable via the quote's linked-order link → no Confirm path after closing the quote | add Draft filter/tab to SO list OR surface Confirm on the linked-order entity-link | Cypress | ☐ |

---

## Theme H — Consistency & design-token drift (ui)

| ID | Sev | Defect | Expected | Test | Status |
|----|-----|--------|----------|------|--------|
| **EX-32-05** | MED | `unsavedChangesGuard` has 0 consumers app-wide; edit forms lose data on backdrop/ESC (live: admin settings, terminology) | wire `canDeactivate` on form-bearing routes; `[draftConfig]`/`[dirty]` on edit dialogs | Cypress | ☐ |
| **EX-31-20** | MED | shipment-detail uses raw `{{ shippingCost \| currency }}` (others use `app-currency-display`) | use `app-currency-display` | Cypress | ☐ |
| **EX-31-14** | MED | PO dialog has 3 hardcoded error hex (`#c62828`/`#fdecea`/`#b71c1c`) | use `--error`/`--error-light`/`--error-text` tokens | manual | ☐ |
| **EX-31-L02** | MED | `/leads/accounts` uses `app-page-layout`+`app-toolbar` vs sibling pages' `app-page-header` | migrate to `app-page-header` | manual | ☐ |
| **EX-32-01** | MED | dialog-open fork (118 inline `app-dialog` vs ~78 CDK `MatDialog`) undocumented/unlinted | document + lint the partition (inline=create/edit, CDK=detail/wizard) | manual | ☐ |

---

## Per-theme rollup

| Theme | Findings | of which BLOCKER | of which HIGH |
|-------|---------:|-----------------:|--------------:|
| A — Financial / data-integrity (api) | 18 | 1 | 13 |
| B — Security / authz (api) | 4 | 2 | 1 |
| C — Cap-gating UX coherence (ui) | ~20 | 1 | 3 |
| D — WCAG 2.2 AA (a11y) | 15 | 7 | 8 |
| E — MFA crypto (api) | 1 | 1 | — |
| F — Nav discoverability (ui) | 2 | — | 1 |
| G — Data-entry guards (ui) | 3 | — | 3 |
| H — Consistency / token drift (ui) | 5 | — | — |

> The cap-gating symptom rows (Theme C) are counted as one cluster — they retire
> together when N-E3 / P-F4 / G-E2 land, so they are not individually waved.
