# Forge — Audit & UX Findings Tracker

_Living document. Maintained during the ongoing audit of Forge. Companion tracker for NOM lives at `nom/docs/AUDIT-TRACKER.md` — keep the two separate._

Last updated: 2026-08-18.

## Audit access

- **Instance:** `forgetest2` (Forge, SplitUi tenant — forge-ui on the web box, forge-api + Postgres + storage on the api box).
- **User:** `daniel.hokanson+test@armoryworks.com` / `ForgeAudit-2026!x`, role **Admin**, **154 of 160 capabilities enabled** (only `CAP-ACCT-FULLGL` + its 5 dependents are off — they require posted opening balances).
- **Reachability:** 404 at the public edge (forge SplitUi edge-routing gap — the `*.armoryworks.com` cloudflared wildcard points at the api box, but a split tenant's UI is on the web box). Audited via SSH tunnel to the forge-ui container.

## Open findings — summary

| # | Area | Sev | Finding | Status |
|---|------|-----|---------|--------|
| F-1 | Navigation | High (UX) | Drill-down menu shows only one category at a time — expensive to cross categories | Open |
| F-2 | Navigation | Med (UX) | Category names are vague, overlapping grab-bags ("Operations") | Open |
| F-3 | Navigation | Med | Several top-level routes dead-end / redirect to `/dashboard` | Open |
| F-4 | App shell | Med | `403 GET /api/v1/admin/accounting-mode` on **every** page (Admin role forbidden) | Open |
| F-5 | App shell | Med | `404 GET /api/v1/auth/validate-token/integrations` on **every** page | Open |
| F-6 | App shell | High | Prod build opens `ws://localhost:9876` (dev socket leak) — connection refused | Open |
| F-7 | Frontend bug | Low | `TypeError: this.tasks is not a function` (computed-signal bug) on 1 page | Open |
| F-8 | Routing | — | forge SplitUi tenants 404 publicly (edge-routing gap) | Open |
| F-9 | Accounting | **High** | Ledger unreachable UI-only: **$45,750 collected across 3 paid invoices produced 0 journal entries / 0 GL accounts** — GL posting gated on CAP-ACCT-FULLGL (off, no UI to enable); `/accounting/*` redirects to `/dashboard` | In progress — design `fullgl-deactivation`; disable-guard landed (forge-api `construction/phase0-blockers`) |
| F-10 | O2C | Low (UX) | New-invoice save is silently disabled until `invoiceDate` **and** `dueDate` are set — neither is defaulted and there's no validation hint | Open |
| F-11 | O2C | Low | Confirming an SO auto-creates the production job; the job dialog's SO-line picker hides already-assigned lines, so a manual job for the same line silently duplicates | Open |
| F-12 | Quotes | Low | `GET /api/v1/quotes/{id}/payment-schedule` 404s on every quote-detail open (benign noise) | Open |
| F-13 | O2C | — (by design) | Shipping requires a **stockable-part** SO line; R&D **service** lines are correctly non-shippable, so R&D and production must be modeled as separate orders | Noted |

_Backend/functional findings from the earlier deep audit (GL rounding, job-costing actuals, FULLGL enablement, mock bank, PRESET-08, etc.) are tracked in `AUDIT.md` / the analysis set; see "Backend" below for the load-bearing ones._

---

## F-1 / F-2 / F-3 — Navigation & menu (PRIMARY UX ISSUE)

Forge's left nav is a **two-level drill-down**. The top level is 9 broad categories — Dashboard, **Operations**, Sales, Shipping, Production, Inventory, Purchasing, People, Insights — plus Shop Floor and Admin, each with a `>`. Clicking a category **replaces the whole menu** with that category's children behind a `← back` arrow (e.g. Operations → Board, Backlog, Planning, Calendar, Compliance, Watchtower, Approvals).

### Why it's difficult (harder than NOM's flat menu)

1. **You can only ever see one category at a time.** ~48 of the ~55 destinations are hidden at any moment. To go from an Operations page to a Sales page you: click `←` (back to categories) → click Sales → click the sub-page. **Three actions to switch context**, and you lose sight of where you were. That's a phone-style pattern applied to a desktop ERP where users cross categories constantly.
2. **Wrong guesses are expensive.** Because you can't see a category's contents until you drill in, hunting for a page ("where do I approve a PO?", "where's the schedule?") means drill-in → scan → back out → try another category. Each miss costs a full round trip.
3. **The categories are vague, overlapping grab-bags.** "Operations" holds Board, Backlog, Planning, Calendar, Compliance, Watchtower, Approvals — no shared theme; "Watchtower" is opaque. Boundaries blur across the set: a *quote* could be Sales or Operations; a *work order* Production or Operations; *MRP* Production, Purchasing, or Inventory; *reports* Insights or each area. Users guess.
4. **The team already worked around it.** Sub-items carry keyboard quick-jumps (Q+K, Q+B) and the header has a Ctrl+K command palette. Needing a palette to bypass your own menu is a tell that the menu isn't fast enough on its own.
5. **Dead ends compound it (F-3).** Several top-level routes just redirect to `/dashboard` (`accounting`, `communications`, `payables`, `sales-channels`, `shipping`, `watchtower`, `welcome`) — clicking them does nothing distinct, which erodes trust in the nav.

### Recommendations

- **Stop swap-and-hide.** Show the category list *and* the current category's items at once — a persistent two-pane (slim category rail + expanded section), or expand-in-place accordions so multiple sections can be open. Never blank out the other 8 categories.
- **Reorganize around the order lifecycle** — Quote → Order → Make → Ship → Invoice — which mirrors the dashboard's own Jobs-by-Stage funnel. One mental model for the whole app instead of nine ambiguous buckets.
- **Rename / redistribute the grab-bags.** Break up "Operations": Approvals → a top-level Inbox; Calendar/Planning → Scheduling; Compliance → Quality.
- **Pin the 6–8 highest-traffic pages** as always-visible one-click items (Dashboard, Quotes, Sales Orders, Jobs, Parts, Purchasing, Customers). Long tail stays grouped.
- **Remove dead nav entries** that redirect to `/dashboard` — hide until they have real landing pages.
- **Collapsed state:** replace the single per-icon tooltip with a hover *flyout* that lists the category's items with labels; keep section dividers so spatial memory survives.

North star: the Ctrl+K palette should be a bonus, not a necessity.

---

## F-4 / F-5 / F-6 / F-7 — App-shell errors (every page)

Captured across all 55 routes with the admin token seeded:

- **F-4 — `403 GET /api/v1/admin/accounting-mode`** on 55/55 pages. The shell polls accounting mode globally; the Admin role is forbidden (likely wants the Controller role or a FULLGL context). Global 403 noise; may degrade accounting UI.
- **F-5 — `404 GET /api/v1/auth/validate-token/integrations`** on 55/55 pages. Endpoint missing or renamed.
- **F-6 — `ws://localhost:9876` connection refused** (global). The **production** tenant build is trying to open a hardcoded `localhost:9876` websocket — a dev-config leak; broken for any real user. Trace the source in forge-ui (real-time/SignalR config) and derive the URL from the app origin.
- **F-7 — `TypeError: this.tasks is not a function`** on 1 of 55 pages (a computed signal invoked incorrectly).

## F-8 — Reachability (forge SplitUi edge gap)

`forgetest2.armoryworks.com` 404s because the `*.armoryworks.com` cloudflared wildcard routes to the api box, but a SplitUi tenant's forge-ui is on the web box. Forge normally runs SingleBox (e.g. `lancemachining`, whole stack on the api box), so this only bites deliberate splits. Fix options: per-tenant cloudflared routes (like the existing `dan-testing`/`jesco` entries) → web box, or a Traefik-forwards-unknown-hosts design. (NOM took the wildcard→web-box fix on its own tunnel because NOM is SplitUi-only.)

## F-9 … F-13 — Full lead-to-cash chronology, driven UI-only (2026-08-18)

Drove a complete order-to-cash chronology on `forgetest2` **entirely through the UI** (Playwright over an SSH tunnel to the forge-ui container, since the tenant 404s publicly — F-8). SQL/API used **only to read/verify**, never to write. Result: **2 customers, 3 sales orders, 4 jobs, 1 delivered shipment, 3 invoices — all 3 Paid ($45,750 collected).**

**The chain that works UI-only (faithful chronology):**
1. **Lead** (`new-lead-btn` → engagement-shape fork; picked *Prototype* for R&D) → **convert** to Customer (`lead-convert-btn`, one click).
2. **R&D Estimate** on the customer's Estimates tab (`estimatedAmount` header) → **Convert to Quote** (0-line estimate skips the lump-sum resolve dialog; the quote is created **linked** via `source_estimate_id`, with a line carrying the estimate amount).
3. **Quote** lifecycle: Send → Accept → **Convert to Order** (`quote-convert-btn`; gated — convert only enabled at status *Accepted*).
4. **Sales Order** confirm is **gated on a customer-acceptance record** (F: good control). Recording a **Verbal** acceptance (method select, no file needed) unblocks `so-confirm-btn`.
5. Confirming the SO **auto-creates a production job** linked to the SO line (F-11); job stages advance via `job-stage-chip` → `stage-option` (some jumps gated by adjacency, e.g. *In Production* needs materials).
6. **Shipment** (production/goods order only) — `shipment-so` picker is keyed to the **job** (search by customer), `shipment-line-so-line` needs a typed query; mark **Shipped → Delivered**.
7. **Invoice** (`new-invoice-btn`) → **Send** finalizes it (Draft → Sent).
8. **Payment** applied to the invoice at save (application row) → invoice goes **Paid**. Used Check / Bank Transfer / Wire (Cash reserved for in-person retail).

Acme Aerospace ran two orders — **SO-00001** (R&D *services*, $12,000, invoiced + paid by Check) and **SO-00002** (production, 250× Turbine Bracket @ $85 = $21,250, shipped + invoiced + paid by Bank Transfer). Beta Robotics ran a full R&D order (SO-3, $18,500, paid by Wire) in a single pass — the chain is **repeatable**.

### F-9 — the ledger stays empty (the load-bearing finding)

Despite the three paid invoices, the accounting subsystem recorded **nothing**: `acct_journal_entries = 0`, `acct_journal_lines = 0`, `acct_gl_accounts = 0`, `acct_account_determination_rules = 0`. Two compounding reasons, both confirmed in code:

- **GL posting is gated on `CAP-ACCT-FULLGL`, which is OFF by default and cannot be turned on through the UI.** `SendInvoice.cs` is explicit: *"While the capability is OFF (the default) the posting call is a no-op."* Same for payments (cash-disbursement posting fires only when FULLGL is on). So finalizing invoices and recording payments post **zero** journal lines.
- **The entire `/accounting/*` UI is behind `capabilityGuard('CAP-ACCT-FULLGL')`** — navigating to `/accounting/ledger` **redirects to `/dashboard`**. There is no UI to enable FULLGL (no opening-balance flow), no UI to create GL accounts, and a fresh tenant seeds **no chart of accounts and no account-determination rules**.

**Net: "entries in the ledger" is not achievable UI-only on a fresh tenant.** The full commercial chain (lead → … → cash) works and the AR/cash records are correct, but the general ledger is unreachable and unpopulated. Remediating needs a reachable FULLGL-enablement + chart-of-accounts/opening-balance flow (ties to the earlier "FULLGL complete but unreachable" backend finding).

## Backend / functional (load-bearing — see `AUDIT.md` for detail)

From the earlier deep audit, the items most likely to bite a real machine shop:

- **Job-costing actuals read ≈$0** — the scanner issue path writes no `MaterialIssue`; `StopTimer` never prices labor; estimates are never stamped.
- **FULLGL is complete but unreachable** — no opening-balance UI; once on, segregation-of-duties 403s the roles allowed to invoice.
- **GL rounding split** — AR/AP/cash use `AwayFromZero`; variance/valuation use banker's default. Cheap to unify before FULLGL posts a real dollar.
- **Per-payment ACH runs on `MockBankPaymentService` in prod.**
- **PRESET-08 "Pro Services" breaks its own two flows** (Jobs gated on a capability the preset removes; 3-way match blocks service vendor bills).
- **Stored XSS** in the chat mention pipe (→ JWT theft from localStorage); **kiosk time-clock** takes an arbitrary `UserId` with no PIN.
