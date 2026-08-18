---
title: FULLGL Deactivation Governance & Ledger-View Decoupling
type: delivery
status: in-progress
id: fullgl-deactivation
updated: 2026-08-18
depends_on: accounting-suite-plan
---

# FULLGL Deactivation Governance & Ledger-View Decoupling

> **Scope.** The [accounting-suite plan](README.md) (`accounting-suite-plan`) fully designs the
> **turn-on** direction: opening balances (§7A), the capability flip `EXTERNAL off → BUILTIN on →
> FULLGL on`, the hard gate "cannot enable a Book until its opening balances are loaded." It does
> **not** govern the **turn-off** direction, and it couples *viewing* the ledger to the posting
> capability. This addendum fills both gaps. It introduces no new posting semantics — it reuses the
> plan's `Book`, `FiscalPeriod {Open|SoftClosed|HardClosed}`, the reconciliation sweeper, and the
> capability-transition machinery, in reverse.

## 1. Motivation (from the UI-only lead-to-cash run, 2026-08-18)

A full lead→cash chain (2 customers, 3 sales orders, **3 paid invoices, $45,750 collected**) was
driven entirely through the UI on a fresh tenant and produced **0 journal entries / 0 GL accounts**
(see `forge/docs/AUDIT-TRACKER.md`, F-9). Two problems surfaced:

1. **You cannot even *view* accounting when FULLGL is off.** Every `/accounting/*` route is behind
   `capabilityGuard('CAP-ACCT-FULLGL')`, so with the capability off the whole suite **redirects to
   `/dashboard`** — including the read-only ledger, trial balance, and statements. A general ledger
   is a permanent book of record; historical entries must remain readable for audit and tax
   regardless of whether *new* posting is currently active.
2. **There is no governed way to stop posting.** Today FULLGL is a plain capability boolean. Flipping
   it off mid-operation would silently create a **half-posted period** — operations keep recording
   AR/cash while the GL stops receiving entries — so the subledgers no longer tie to the GL and the
   period's statements become wrong. That is the one failure mode the design must make impossible.

## 2. The one invariant

**Never a half-posted period.** Every deactivation guarantee below exists to prevent a window in
which operational documents post to a subledger but not to the GL. Deactivation is therefore a
**dated cutover with preconditions**, not an instantaneous toggle.

## 3. Design

### 3.1 Split the gate: *view* vs *post* (per Book)

Introduce an explicit per-`Book` ledger lifecycle state (stored on `Book`, or derived — see
Implementation):

| `Book.LedgerState` | Meaning | View surfaces | Post surfaces |
|---|---|---|---|
| `NeverEnabled` | FULLGL never turned on for this book | hidden | hidden |
| `Active` | posting live | read/write | enabled |
| `Deactivated` | posting stopped as of a cutover date; history frozen | **read-only** | disabled |

- **View gate** (`/accounting/ledger`, `/ledger/:accountId`, `trial-balance`, `profit-loss`,
  `balance-sheet`, `cash-flow`, `ar-aging`, `ap-aging`, `grni`, `exports`, the journal-entry
  register): reachable whenever `LedgerState != NeverEnabled`. These are already "read-only report
  views" per the plan — they just must stop being gated on the *posting* capability.
- **Post gate** (`journal-entries/new`, the Reverse *action*, period open/close actions, and the
  operational `IPostingEngine.PostAsync` path): enabled only when `LedgerState == Active`.

This is the highest-value, lowest-risk slice and ships first (task #48). It makes "view-only when
off" true and turns the redirect-to-dashboard into a read-only ledger.

### 3.2 Deactivation is a governed command, not a capability off-flip

New engine command `DeactivateBookLedger(bookId, effectiveDate, successor, confirmation)` under a new
SoD action **`DEACTIVATE_GL`** (role: `Controller`; maker-checker like `CLOSE_PERIOD_HARD`). It is
permitted **only** when all hold:

1. **No unposted backlog.** The reconciliation sweeper (§4 of the plan) reports **zero** should-be-
   posted source documents through `effectiveDate` missing a `JournalEntry` — checked at **line
   level**, not just `(SourceType, SourceId)` presence, so a partially-posted source cannot slip
   through.
2. **The books tie out at the cutover.** Every period through `effectiveDate` is at least
   `SoftClosed`, and the **trial balance balances** and the **AR/AP subledgers reconcile to their
   control accounts** as of `effectiveDate`. This mirrors the §7A go-live gate ("native opening TB ==
   QB closing TB") in reverse: the *closing* TB must be clean before you stop keeping the books.
3. **A successor is designated** (the "ensure they've set up a new system" requirement):
   - **External provider** — if an `EXTERNAL` provider (QuickBooks/Xero) `isConfigured()`, the
     cutover runs the plan's capability flip **in reverse**: `FULLGL off → BUILTIN off → EXTERNAL
     on`, demoting the native GL to the **read-only archive** (the exact mirror of §7A's
     `EXTERNAL→BUILTIN` cutover). The external system becomes the go-forward book of record.
   - **None (off the books)** — allowed only with an explicit, typed acknowledgement that there will
     be **no system of record** for transactions after `effectiveDate`.

On success the command records `deactivatedAsOf = effectiveDate`, sets `LedgerState = Deactivated`,
and writes an audit event. `PostAsync` no-ops from that date forward (as it already does when the
capability is off) — but the ledger and reports stay reachable read-only (§3.1).

### 3.3 The warning surface

The deactivation dialog states the consequence in plain terms and requires typed confirmation:

> **Turning off the general ledger.** As of **&lt;effectiveDate&gt;**, invoices, payments, and
> inventory movements will **no longer post to the general ledger**. Your historical entries stay
> **viewable and reportable, but read-only**.
> Successor system: **&lt;QuickBooks (connected) | None — you will have no book of record&gt;**.

Deactivate is disabled (with the reason shown) until preconditions §3.2.1–3.2.3 pass — the same
`app-validation-button` pattern used elsewhere in the suite.

### 3.4 Re-activation is a **new conversion**, never a resume

Turning FULLGL back on after a `Deactivated` period is **not** "continue where you left off." The
deactivated gap is not in the GL, so re-activation runs the full §7A path again: a fresh balanced
opening journal (`Source=Conversion`) as of the re-activation date, hard-gated on opening balances.
This keeps auditors from ever seeing a period that is half in the ledger, and prevents a silent gap
from being treated as continuous.

### 3.5 Remove the raw toggle once entries exist

The admin capability panel must **not** offer `CAP-ACCT-FULLGL` as a free on/off switch for a Book
that has any `Posted` entries. Enabling routes through §7A; disabling routes through §3.2. Guard:
a direct capability-off for FULLGL on a Book with Posted entries is **rejected** and surfaced with a
pointer to the deactivation flow. (Before any entries exist, `NeverEnabled → Active` is just the §7A
enablement; there is nothing to protect yet.)

## 4. Why this is sound practice

This matches how mature ERPs behave: they never expose "disable the ledger." They expose a **go-live
conversion**, **period lock/close** (books stay fully viewable), and — when a business changes
systems — a **dated cutover** to the successor with the old ledger retained as a read-only archive.
Modeling deactivation as `close-and-tie-out → dated cutover → read-only archive → (optional) external
successor` gives the operator the "turn it off" affordance they asked for **without** the one
outcome that breaks accounting integrity: a period that is half in the ledger.

## 5. Delivery order

1. **View/Post decouple** (task #48) — split the guards + endpoint registry so the read-only ledger
   and statements are reachable whenever entries exist; posting stays gated on `Active`. *Shippable
   on its own; directly fixes F-9's "can't even view."*
2. **Block the raw FULLGL toggle** once a Book has Posted entries (§3.5) — cheap guard, prevents the
   dangerous case immediately.
3. **`DeactivateBookLedger` command** (§3.2/§3.3) — preconditions + warning + capability-flip-in-
   reverse + successor check.
4. **Re-activation = new conversion** (§3.4) — wire the §7A enablement gate to reject a "resume."

## 5a. Implementation status & code hooks

Grounded in the current code (verified 2026-08-18):

- **State flag lives in the `capabilities` table**, read at runtime via `ICapabilitySnapshotProvider.IsEnabled` (`CapabilitySnapshotProvider.cs`); FULLGL is *not* a `Book` column and *not* a SystemSetting. The `LedgerState` in §3.1 is realized as the capability **pair** `CAP-ACCT-GL-VIEW` (view) + `CAP-ACCT-FULLGL` (post): `NeverEnabled` = both off, `Active` = both on, `Deactivated` = GL-VIEW on / FULLGL off.
- **"Live ledger" predicate already exists:** `IGlCapabilityGate.AreOpeningBalancesLoadedAsync(bookId)` (`forge.api/Features/Accounting/GlCapabilityGate.cs`) — a posted `Source=Conversion` entry. The enable-gate uses it at `ToggleCapability.cs:141`; the disable-guard reuses the same predicate.

**LANDED (slice 2 — §3.5, block the raw off-toggle):** `ToggleCapability.cs` now rejects disabling `CAP-ACCT-FULLGL` (409 `capability-gl-live-ledger`) when any active book has opening balances loaded — mirror of the enable-gate, no schema or new-capability change. Tests: `ToggleCapabilityFullGlGateTests.Disabling_FULLGL_is_refused_once_the_ledger_is_live` (+ the `..._allowed_when_no_ledger_history_exists` companion). This closes the half-posted-period footgun immediately; because FULLGL is off on every tenant today, it affects no live tenant. **Interim consequence:** until the deactivation cutover (slice 3) ships, a live book's FULLGL is *un-disableable* by design — the safe side.

**Remaining hooks for the next slices:**
- **Slice 1 (view/post decouple)** — the parent gate is a single `capabilityGuard('CAP-ACCT-FULLGL')` on the `accounting` route (`forge-ui/src/app/app.routes.ts:170`); every child inherits it, and the client short-circuit is one prefix row `{ prefix: 'accounting', capability: 'CAP-ACCT-FULLGL' }` in `capability-endpoint-registry.ts`. Server-side, read controllers/queries carry `[RequiresCapability("CAP-ACCT-FULLGL")]`. To decouple: register `CAP-ACCT-GL-VIEW` (dark), re-gate the **read** routes/endpoints (`ledger`, `trial-balance`, statements, aging, `exports`, the register queries) to it, keep **write** (`journal-entries` POST, `SetFiscalPeriodStatus`, reverse) on FULLGL, split the endpoint-registry prefixes, and enable GL-VIEW as a cascade when FULLGL is enabled (and leave it on through deactivation). `ControllerCapabilityGateTests` requires every controller to keep a gate; update the CLAUDE.md capability count.
- **Slice 3 (deactivation cutover)** — new `DeactivateBookLedger` command reusing the reconciliation sweeper (§4 of the plan) for backlog, `FiscalPeriodStatus` close for tie-out, and the reverse capability flip `FULLGL off → BUILTIN off → EXTERNAL on` (or explicit off-the-books). SoD action `DEACTIVATE_GL` = Controller, maker-checker like `CLOSE_PERIOD_HARD`.
- **Fresh-tenant trap (prerequisite for enablement to work at all):** COA/`Book`/determination-rule seeding lives inside the `SEED_DEMO_DATA` demo-only branch (`SeedData.cs:75-79` early-return, `SeedData.Accounting.cs` called at `:722`), so a real tenant has **no Book and 0 GL accounts** — the enable-gate then passes trivially (empty book loop) and the first real post throws `NO_POSTING_BOOK`. The enablement flow must provision Book + COA + determination rules (or require the conversion journal) before FULLGL can go `Active`.

## 6. Open questions (for the blocking-questions inventory)

- Should `Deactivated` books still run the **reconciliation sweeper** (to alert if something posts
  after the cutover date via a bug)? Proposed: yes, but downgrade alerts to informational.
- Multi-book tenants: is deactivation ever partial (one book off, another on)? The per-`Book`
  `LedgerState` supports it; confirm no cross-book determination-rule leakage.
- Retention: how long must a `Deactivated` book's read-only surface remain before it can be archived
  out of the hot path? (Likely a statutory/tax retention window; needs a business answer.)
