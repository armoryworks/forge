---
title: Forge Accounting Suite — Implementation Plan
type: delivery
status: in-progress
id: accounting-suite-plan
updated: 2026-07-07
---

> **Version-controlled snapshot.** The live working copy is `~/dev/armory-works/forge/ACCOUNTING_SUITE_PLAN.md`
> (the umbrella planning dir, which is not a git repo). This copy exists so the plan has history/backup;
> re-sync it when the working copy changes materially.

# Forge Accounting Suite — Implementation Plan (v2)

> **Status:** Design locked **and design-reviewed**. v2 folds in a multi-agent critical
> design pass (see `ACCOUNTING_SUITE_PLAN_REVIEW.md`); the pre-review version is preserved
> at `ACCOUNTING_SUITE_PLAN.v1-prereview.md`. The dotnet/EF toolchain that earlier versions
> lacked **is now available** (.NET 10.0.300 + `dotnet-ef` 10.0.8; see §9), so migrations are
> scaffolded, never hand-authored.
>
> **Goal:** A native, in-ecosystem double-entry accounting suite so Forge customers keep their
> books inside Forge instead of QuickBooks. Not as feature-rich as QB, but a real book of record.

---

## 1. How to use this document

Build in **vertical slices behind `CAP-ACCT-FULLGL`**. Each phase is independently shippable
and the ledger always balances. **Never ship a half-posted ledger.** Phase 0 is the GL engine
in isolation — an **internal engineering milestone, not a customer increment** — and proves out
a trial balance before any source posting is wired. The **Conversion workstream (§7A)** must
complete before the first real customer goes live on Phase 1. `CAP-ACCT-FULLGL` is hard-gated:
it cannot be enabled for a book until that book's opening balances are loaded.

---

## 2. Decisions locked

| Decision | Choice |
|---|---|
| Where it lives | **Embedded module** in `forge-api`, in-process, **same DB** (transactional posting). |
| Future optionality | Architect for **lift-and-shift**: reach the GL only through **`IPostingEngine`** + new CoA/period/query interfaces (NOT `IAccountingService` — see §3); own assembly/folder; own `acct_*` schema. Extraction later = swap the in-process service for an HTTP client behind the same interfaces. |
| **Posting consistency** | **Inline, synchronous, same-transaction.** The operational command handler calls `IPostingEngine.PostAsync` on the shared request-scoped `AppDbContext`; operational change + journal entry commit (or roll back) **together**. A posting failure fails the operation immediately and visibly. **No posting happens in a MediatR handler.** |
| **Live multi-viewer refresh** | **Separate, best-effort "notify lane."** *After* commit, emit a `LedgerChanged` domain event → SignalR fan-out to other screens viewing that account/period/sub-ledger. This lane is **non-load-bearing**: ledger integrity never depends on it; if it lags/drops, a screen just refreshes a beat later. |
| **Divergence safety net** | A scheduled **reconciliation sweeper** (reuse the `OrphanDetectionJob` pattern) left-joins should-be-posted source docs against `JournalEntry` on `(SourceType, SourceId)` and alerts on orphans. Also the mechanism for **catch-up posting** of any pre-FULLGL document backlog. |
| Storage / immutability | **Postgres only — no distributed ledger.** Posted entries are **append-only**, enforced by a `SaveChanges` interceptor **and** a Postgres `BEFORE UPDATE/DELETE` trigger. Corrections are **reversing entries only**. Optional `prev_hash` hash-chain (centralized, QLDB-style tamper-evidence) available later if a customer's threat model needs cryptographic proof — **not** Phase 0. |
| Global-convention opt-out | GL entities **opt out of the global soft-delete query filter** (`DeletedAt == null`) — a soft-deleted journal line silently dropping from a summed trial balance would "balance" yet be wrong. Ledger entities derive from a non-auditable base; the trial balance query is provably filter-immune (`IgnoreQueryFilters`). |
| UI | **Logical split, not a separate deployable.** A lazy-loaded `/accounting/**` feature area in `forge-ui`, own shell/nav (finance persona), its data services hitting only accounting endpoints through **one API-base config**. Capability-gated. |
| Standalone product? | **No.** Embedded module is correct. |
| Ledger depth | **Full GL + sub-ledgers + statements** — AR/AP sub-ledgers, bank rec, FX revaluation, fixed-asset depreciation, period & year-end close. |
| Payroll | **Native payroll**, sequenced last (biggest compliance risk); cut over **separately** from the GL cutover. Consumes `Shift.PremiumMultiplier` + `OvertimeRule`. |
| Journal line dimensions | **GL Account + Job + Cost Center** on every line. |
| Entity model | **Single entity now, multi-entity-ready** — `BookId` on accounts/journals/periods from day one, **plus** engine-enforced book-consistency (every line's account/cost-center/period must share the entry's `BookId`). Determination lookups are `(BookId, Key)` with **no** silent cross-book fallback. |
| Accounting basis | **Accrual**, US-GAAP flavored. |
| Revenue recognition | **Configurable** `RevenueRecognitionMethod` per book. **Default = PointInTime** (control transfer — ship/deliver/complete; manufacturing + one-shot service). **PercentOfCompletion / Milestone** (long service/projects) land later; the field exists from Phase 0 so adding them is config, not a migration. Deferred Revenue + customer-deposit/unapplied-cash paths exist. (§8.4) |
| System of record | **Native GL is authoritative.** QuickBooks demotes to optional **export** + read-only historical archive. |
| **Conversion / cutover** | Default = **opening balances + open-item sub-ledger load** (not full history); QB stays a read-only archive; go-live gate = **native opening TB == QB closing TB** as of the cutover date. Full transaction-level history import is a **non-default, supported** PS path via `Source=Conversion` (§7A). |
| **Authorization / SoD** | **Controller + Office Manager post**; **Controller approves/reverses/closes**; **Owner = full GL rollup** (all capabilities — small-shop reality + end-to-end testing); **Admin and operational Managers are OFF the books** (toxic-combination avoidance). Maker-checker for reverse / hard-close / large manual JEs. Enforced at the engine boundary. (§5.7) |
| **Product configurability** | Forge accounting is a **product across business models** — most "decisions" are **configuration with manufacturing defaults** (Book-level settings + per-entity overrides + pluggable providers), set at company setup, **never hard-coded**. Manufacturing is the default tenant; service/consulting, multi-currency, and multi-state are configurable. |
| Costing method (inventory) | **Configurable** `Book.DefaultCostingMethod` + per-part override (`Part.ValuationClassId`). **Default = Standard** (manufacturing). Methods: Standard / WeightedAverage / FIFO (LIFO + Specific-ID out for v1). Method drives a **valuation store** (Phase 2). (§8.1) |

---

## 3. Current-state findings (verified against the code)

Every claim below was independently verified against `forge-api` during the design review.

### The architecture was built for this — the seam exists
- **Capability flags registered** in `forge.api/Capabilities/CapabilityCatalog.cs`: `CAP-ACCT-FULLGL`
  (*"…Registered for future delivery; currently not implemented."* ← **this is what we implement**),
  plus `CAP-ACCT-BUILTIN` (lightweight invoice/payment/expense CRUD, default ON), `CAP-ACCT-EXTERNAL`
  (QB sync, OFF), `CAP-ACCT-PERIOD`, `CAP-ACCT-DEPRECIATION`, `CAP-ACCT-FXREVAL`, `CAP-ACCT-EXPENSES`,
  `CAP-ACCT-MIGRATION`. **Confirmed present.** (`CAP-RPT-FINANCIALS`, used in §6/§10 to gate the financial statements,
  is a **new** reporting capability this plan introduces — default OFF, enabled once COGS posting is live.)
- **Provider abstraction** (`forge.core/Interfaces/IAccountingService.cs` + `forge.integrations/AccountingProviderFactory.cs`,
  active provider in `SystemSetting` key `accounting_provider`, `local` no-op stub) — **confirmed.**
- **`⚡ ACCOUNTING BOUNDARY` markers** on `Invoice`/`Payment`/`InvoiceLine` — **confirmed.**
- **Domain-event infra** (MediatR `INotification` + handlers, `Features/DomainEvents/Handlers/`, a
  resilient publisher + dead-letter table) — **confirmed.** All 7 "already published" events in §7 exist
  and fire; all 11 "to add" events correctly do **not** exist yet.

> **Correction (review finding `gap-4`):** `IAccountingService` is an **external-sync/CRM** contract
> (`CreateEstimate`, `TestConnection`, `GetSyncStatus`) with **zero ledger primitives**. It is **not**
> the GL seam. The real seam is **`IPostingEngine`** (write) + new **`ILedgerQuery` / `IChartOfAccounts`
> / `IFiscalCalendar`** read/config interfaces. `ForgeGlAccountingService : IAccountingService` is at most a
> thin provider shim so the provider factory lists "forge-native" — not the boundary the GL is reached through.

> **Correction (review finding on §4 atomicity):** the publisher is **fire-and-forget** — it dispatches
> **after** `SaveChanges`, swallows handler exceptions into a dead-letter table, and there is **no automatic
> redelivery** (`MarkRetrying` only flips a counter). This is why posting is **inline**, not event-driven (§2, §4).

### There is NO general ledger today (verified across ~252 entities)
- **No** chart of accounts (`Account.cs` is a **CRM pre-sales** entity), **no** `JournalEntry`/`JournalLine`/
  debits-credits, **no** fiscal period/close, **no** trial balance.
- Invoice/InvoiceLine/Payment/PaymentApplication/Expense/RecurringExpense/Quote/SalesOrder/PurchaseOrder/PayStub
  exist but **post nowhere** — they become **sub-ledgers** feeding the GL; we do **not** fork them.
- Inventory has valuation *classes* (`Part.ValuationClassId` → FIFO/LIFO/Avg/Standard) but **no** inventory-asset/COGS
  posting and **no entity stores per-unit on-hand cost** (`LotRecord`/`BinContent` are qty-only; `CreateMaterialIssue`
  values issues at "last PO price or zero"). `CostCalculation`/`CostingProfile` compute but don't post and fit
  **standard cost only**.
- GL-mapping fields exist for *outbound sync only*: `SalesTaxRate.GlPostingAccount`, `Asset.GlAccount`,
  `TimeEntry.AccountingTimeActivityId`.
- **No** vendor-bill/AP-invoice entity and **no** vendor/AP payment (payments are customer-only). Built in Phase 2.

**Implication:** building the GL is **purely additive — zero migration risk** *for the empty tables*. It is **not**
zero-effort for the *business*: every adopting customer has live balances → see the **Conversion workstream (§7A)**.

---

## 4. Target architecture

### Backend module: `forge.accounting` (new)
- Own folder/assembly, own `acct_*` namespace, reached **only** through `IPostingEngine` + the read/config
  interfaces above, all capability-gated.
- **Posting engine is the heart.** It accepts balanced Dr/Cr lines + source ref + date, validates, and writes an
  **immutable** `JournalEntry` **in the caller's DB transaction**. The operational command handler invokes it
  **inline** (one `SaveChanges`, one transaction); when `CAP-ACCT-FULLGL` is off for the book, `PostAsync` is a no-op.
- **Notify lane (best-effort).** After the transaction commits, the handler emits `LedgerChanged` → SignalR
  fan-out to connected finance screens. Never in the posting path.
- **Reconciliation sweeper.** Scheduled job finds should-be-posted source docs with no matching `JournalEntry`
  and alerts; also performs catch-up posting for pre-FULLGL backlog.
- **Account determination map.** Business events never hardcode accounts; a `(BookId, Key)` config table resolves
  them (revenue, AR control, inventory asset, COGS, GRNI, AP control, PPV, WIP, FG, FX gain/loss, deferred revenue, …).
- **Immutability** enforced two ways: a `SaveChanges` interceptor that throws on `Modified`/`Deleted` `Posted` ledger
  rows, **and** a Postgres `BEFORE UPDATE/DELETE` trigger. Do **not** make `JournalEntry` `IConcurrencyVersioned`.

### Frontend: `/accounting/**` feature area in `forge-ui`
- Lazy-loaded Angular feature, own finance shell/nav, capability-gated, single API-base config, slice-by-slice.
- **Today the components are read-only report views** (trial-balance, P&L, balance-sheet, cash-flow, AR/AP aging, GRNI,
  period-close, bank-rec, bank-statements, exports) that consume `GeneralLedgerService`. There is **no ledger browser and
  no manual-entry surface** — nothing lets a person read the journal in context or post/correct an entry by hand.
- **The first customer-facing GL surface is the GL Workspace + its training system — see §5A.** It is the UI counterpart
  to the Phase-0 manual-journal API and Trial Balance: it turns the append-only journal into something a person can read
  in context and correct by hand, and makes the deliberately-unfamiliar model learnable.

---

## 5. PHASE 0 — GL foundation (build this first)

Delivers the engine in isolation: chart of accounts, **inline** posting engine, periods, manual journal API,
and a **Trial Balance** that proves total Dr == total Cr. No auto-posting from sources yet.

### 5.1 Entities (`acct_*` schema, snake_case)

**`Book`** — `Id, Code, Name, FunctionalCurrencyId, ReportingTimeZone (IANA tz — anchors EntryDate→period
resolution), RoundingTolerance (money; default = functional currency's smallest unit, e.g. 0.01),
DefaultCostingMethod {Standard*|WeightedAverage|FIFO} (* manufacturing default; per-part override via
Part.ValuationClassId — §8.1), RevenueRecognitionMethod {PointInTime*|PercentOfCompletion|Milestone}
(* default; over-time methods land later — §8.4), IsActive`. Every entity below carries `BookId`. The two
method fields are seeded in Phase 0 (engine doesn't consume them until Phase 1/2) so they're config, not a later migration.

**`GlAccount`** — `Id, BookId, AccountNumber, Name, AccountType {Asset|Liability|Equity|Income|Expense},
NormalBalance {Debit|Credit}, ParentAccountId?, IsControlAccount, ControlType? {AR|AP|Inventory|…},
IsPostable, IsActive, Description`. Control accounts post **only via sub-ledgers**.

**`CostCenter`** — `Id, BookId, Code, Name, ParentId?, IsActive`. Seeded from departments/work centers.
(`Job` reuses the existing `Job` entity.)

**`FiscalYear`** — `Id, BookId, Name, StartDate, EndDate, Status {Open|Closed}`. Dates are `DateOnly`.

**`FiscalPeriod`** — `Id, FiscalYearId, PeriodNumber (1..12/13), Name, StartDate, EndDate (DateOnly),
Status {Open|SoftClosed|HardClosed}, RowVersion`. (`BookId` derives via `FiscalYearId` — don't duplicate.)
A `RowVersion`/concurrency token guards close-vs-post races.

**`JournalEntry`** (header, append-only once `Posted` — the ONLY mutation permitted on a `Posted` row is the single
`Posted→Reversed` status flip + `ReversedByEntryId` link, which the immutability interceptor explicitly allows; §5.2) —
`Id (long), BookId, EntryNumber (monotonic per book/year — gaps allowed),
EntryDate (DateOnly — resolves the period in the Book's ReportingTimeZone; immune to UTC normalization),
FiscalPeriodId, Source {Manual|AR|AP|Inventory|Payroll|FX|Depreciation|Conversion|System},
SourceType + SourceId (polymorphic source link), IdempotencyKey (non-null for **all non-Manual** sources — incl.
Conversion + recurring), CurrencyId, Memo, Status {Draft|PendingApproval|Approved|Posted|Reversed},
AutoReverseNextPeriod (bool — accruals; the period-close step reverses these into the next period),
ReversalOfEntryId?, ReversedByEntryId?, ApprovedBy?, PostedBy, PostedAt`.

**`JournalLine`** — `Id (long), JournalEntryId, BookId, LineNumber, GlAccountId,
JobId? + CostCenterId? (dimensions), Debit (>=0), Credit (>=0), CurrencyId, TxnAmount, FunctionalAmount, FxRate,
SubledgerPartyType? + SubledgerPartyId?, Description`. DB CHECK `(Debit = 0) <> (Credit = 0)` — exactly one non-zero
(rejects 0/0 and both-non-zero); engine re-validates. Use `long` Id now (cheap pre-rows; painful later). Party fields
stay polymorphic (a control line's counterparty is Customer **or** Vendor → can't FK-enforce); the engine requires them
on control lines (§5.2), and aging/sub-ledger reads use `IgnoreQueryFilters` so a soft-deleted party master never drops rows.

**`AccountDeterminationRule`** — `Id, BookId, Key, GlAccountId, + nullable scope columns
(ItemId?/CategoryId?/ValuationClassId?) added now even if only global rows seed, so Phase-2 scoping is config + a
resolver, not a migration. Precedence: most-specific scope wins.` Keys (seed superset now):
`AR_CONTROL, AP_CONTROL, SALES_REVENUE, SALES_RETURNS, SALES_TAX_PAYABLE, DEFERRED_REVENUE, CUSTOMER_DEPOSITS,
INVENTORY_RAW, INVENTORY_WIP, INVENTORY_FG, COGS, GRNI, PURCHASE_PRICE_VARIANCE, MATERIAL_USAGE_VARIANCE,
INVENTORY_WRITEDOWN, FREIGHT_CLEARING, CASH, RETAINED_EARNINGS, FX_GAIN, FX_LOSS, CTA, ROUNDING, REFUNDS_PAYABLE,
ACCRUED_EXPENSE, ACCRUED_WAGES, PREPAID_EXPENSE, UNBILLED_REVENUE`. Keys seeded ahead of their phase (e.g.
`MATERIAL_USAGE_VARIANCE`, `CTA`, the accrual keys) are intentional future-proofing; the seed/startup validator (§5.2)
only errors when a *posting references* an unmapped key.

**`acct_number_sequences`** — `(BookId, FiscalYearId, NextValue)` counter; `EntryNumber` allocated via row-locked
`UPDATE … RETURNING` (copy `JobRepository`'s safe pattern, **not** `InvoiceRepository`'s read-max+1). `UNIQUE(BookId, FiscalYearId, EntryNumber)`. Gap policy: gaps allowed (US-GAAP imposes no gapless mandate); documented.

**`LedgerBalance`** (read-model, see §5.3) — grain `(BookId, GlAccountId, FiscalPeriodId, CurrencyId)`; maintained
incrementally **inside the posting transaction** (a reversal adjusts it like any other posting — no special case). A
**rebuild/verify job** recomputes balances from raw `JournalLine`s and reconciles against the materialized values
(drift = bug → alert); it is the authoritative repair path and a close-time integrity check.

### 5.2 Posting engine (`IPostingEngine`)
- `PostAsync(PostingRequest) -> JournalEntry` — `PostingRequest = { BookId, EntryDate, Source, SourceType,
  SourceId, CurrencyId, Memo, IdempotencyKey, Lines:[{ AccountKeyOrId, JobId?, CostCenterId?, PartyType?, PartyId?,
  Debit, Credit, Description }] }`.
  - **Validations:** resolve accounts via `(BookId, Key)` (unmapped/non-postable/cross-book key → **hard, alertable
    error**); **book-consistency** (every line's account/cost-center/period shares `BookId`); **Σ Debit == Σ Credit
    exactly to 0.00** (handlers add an explicit `ROUNDING` line for computed allocations, capped at a Book tolerance;
    `MidpointRounding.AwayFromZero`); any line on an `IsControlAccount` account **must** carry `SubledgerPartyType/Id`;
    resolve `FiscalPeriod` from `EntryDate` under a **`FiscalPeriod` row lock** and **reject if HardClosed**; **block if
    SoftClosed** unless an explicit accounting/controller override is supplied (audited); accounts `IsPostable` & active.
  - **Idempotency:** key shape `source:type:id:purpose` with a **closed `purpose` enum** (e.g. `REVENUE`, `TAX`,
    `GRNI`, `FREIGHT`, `WIP`, `COGS`, `REVERSAL`, `FXREVAL:<period>`, `DEPR:<period>`); non-null for **all non-Manual**
    sources (matches §5.1); period folded into recurring keys. **Duplicate key → return the existing entry (no throw).**
    Unique index `(BookId, IdempotencyKey)`.
  - Writes header + lines atomically in the caller's transaction, `Status = Posted`, assigns `EntryNumber`,
    updates `LedgerBalance`.
  - **Phase-0 single-currency invariant:** every line's `CurrencyId` = the entry's; `FunctionalAmount = TxnAmount`,
    `FxRate = 1`. Mixed-currency is deferred to Phase 4 (the multi-currency fields exist now but are pinned in Phase 0).
  - **Determination targets validated at seed time AND on startup** (every key→account resolves, is postable, in-book) —
    misconfiguration is caught before the first posting, not on the hot path.
  - **Immutability interceptor carve-out:** the `SaveChanges` interceptor blocks all `Modified`/`Deleted` on `Posted`
    ledger rows **except** the single `Posted→Reversed` status flip + `ReversedByEntryId` link written by `ReverseAsync`.
- `ReverseAsync(entryId, date, reason)` — **preconditions:** `Status == Posted` AND `ReversedByEntryId` is null
  (no double-reverse); set original `Status = Reversed` + link in the same transaction; resolve the reversal's period
  from **its own** date and reject if HardClosed; `purpose = REVERSAL` idempotency key.

### 5.3 Reporting (Phase 0)
- **Trial Balance** per period/date range — **filter-immune** (`IgnoreQueryFilters`; sums **functional** amounts;
  includes `Posted`, excludes `Draft`, nets `Reversed`); assert total Dr == total Cr.
- Read path uses the incremental `LedgerBalance` (maintained in the posting transaction) so statements don't sum raw
  lines at scale; Phase-1 scale acceptance criterion attached. (P&L / Balance Sheet are Phase 1.)

### 5.4 Seed data
- Default `Book` (functional currency = base currency); default **small-manufacturer CoA** incl. control accounts
  (AR, AP, Inventory[Raw/WIP/FG], GRNI, Sales Tax Payable, Retained Earnings, Rounding, Deferred Revenue, FX gain/loss,
  PPV); default `AccountDeterminationRule` rows; current `FiscalYear` + 12 periods.
- **Review the seed CoA + determination keys with the customer's accountant** before cutting tables (§8.2).

### 5.5 Capability + provider wiring
- Implement `CAP-ACCT-FULLGL`; gate GL endpoints/UI on it; **hard-gate enablement on opening-balances-loaded** for the book.
- **Capability transition (verified):** `CAP-ACCT-FULLGL` **depends on** `CAP-ACCT-BUILTIN` (`CapabilityCatalogRelations.cs`),
  and the catalog enforces `BUILTIN ⊥ EXTERNAL` (mutually exclusive). A QB (`EXTERNAL`) install at cutover must flip
  **EXTERNAL off → BUILTIN on → FULLGL on**, in that order, as part of §7A — that flip is what demotes QB to export/archive.
- Register `ForgeGlAccountingService : IAccountingService` ("forge-native") in DI + `AccountingProviderFactory` — as a
  **shim**, while the GL itself is reached via `IPostingEngine`/read interfaces.

### 5.6 EF / Postgres notes (Phase 0)
- Scaffold the migration (`dotnet ef migrations add AddAccountingGlFoundation -p forge.data`); let EF regenerate the
  snapshot/Designer — **never hand-edit** (toolchain is available — §9).
- **Explicit short FK/index names** via `HasConstraintName`/`HasDatabaseName` — the snake_case auto-namer has no 63-char
  guard and long `acct_*` names truncate silently. Audit every generated name before the first migration.
- **`DeleteBehavior.Restrict`** on all `JournalLine` FKs; `JournalEntry→JournalLine` never cascade-deletes (reverse instead).
- Money columns `HasPrecision(18,4)`; `FxRate` `(18,8)` (matches existing `ExchangeRate.Rate`). Ledger entities derive
  from a **non-auditable** base (exempt from the global soft-delete filter).

### 5.7 Permissions / segregation of duties (new — Phase 0)
GL authorization is defined in terms of **capabilities**, enforced at the **engine boundary** against the caller's
**effective** (resolved) permission set — **never** against hard-coded role names. The accounting suite binds only to an
`ICurrentUserCapabilities` resolver supplied by the identity system; **how roles compose** (today's flat `RoleTemplate`
rollups, or a future hierarchical/recursive role graph) is an **orthogonal identity-system concern** and does not gate
Phase 0. The server-trusted principal is injected into `IPostingEngine` (never client-supplied).

| Capability | Default grant |
|---|---|
| `POST_JE` (manual JE / sub-ledger) | `Controller` (and any role that composes it) |
| `APPROVE_JE` | `Controller` |
| `REVERSE_JE` | `Controller` |
| `CLOSE_PERIOD_SOFT` | `Controller` (+ a bookkeeping role if configured) |
| `CLOSE_PERIOD_HARD` / `REOPEN` | `Controller` |
| `CONFIGURE_GL` (CoA / determination rules) | `Controller` |

- **Capabilities attach to `Controller`.** Posting therefore reaches the books **only** via Controller — directly, or
  through any rollup/role that includes it (the seeded **`OwnerOperator`** template `["Admin","Manager","Controller"]`
  → the owner/test superuser; the seeded back-office template `["OfficeManager","Controller","IT Admin"]` → an office
  manager who also keeps the books). **Bare `Admin`, `Manager`, `OfficeManager` get no GL capability** — which matches
  the existing `forge-test/docs/suites/permissions` suite (`PERM-CONTROLLER-PostJE-001` allow; `PERM-ITADMIN-PostJE-001`,
  `PERM-FLOOR-ApproveJE-001` deny) with **no new allow-cases needed**.
- **SoD / toxic-combination rule runs over the EFFECTIVE set** (the transitive closure if roles ever nest): warn/deny when
  a single principal effectively holds both *grant-permissions* (Admin) **and** `POST_JE`. `OwnerOperator` trips this
  **intentionally and visibly** (a solo owner legitimately wears all hats); the checker exists to catch the *unintended*
  combinations — especially important if a hierarchical role model is later adopted, where such combos hide inside the graph.
- **Maker-checker is scoped, not universal:** routine `Controller`/bookkeeper posts go **straight to `Posted`** (preserving
  the inline single-transaction model). Only **`REVERSE_JE`, `CLOSE_PERIOD_HARD`, and large manual JEs** (threshold = a
  Book-configurable amount) route `Draft/PendingApproval → Approved (+ApprovedBy) → Posted`. `Draft`/`PendingApproval`/
  `Approved` rows are mutable by their author until posted; **only `Posted` is append-only.**

### 5.8 Audit / observability (new — Phase 0)
- Wire post / reverse / soft-close / hard-close / reopen / determination-rule changes to the existing
  `ISystemAuditWriter` (`CAP-IDEN-AUDIT-SYSTEM-LOG`) with actor + before/after + reason.
- **Alert on posting failures** and on reconciliation-sweeper orphans (don't silently dead-letter).

### 5.9 Phase 0 acceptance
Define a CoA; post a manual balanced journal (inline); reject an unbalanced one; reject a post into a HardClosed period
(incl. under a concurrent close); enforce control-line party + book-consistency; reverse an entry (and reject a
double-reverse); produce a filter-immune trial balance that balances; permissions enforced per §5.7; audit entries written.

---

## 5A. GL Workspace UI + interaction-training system (first customer-facing slice)

Phase 0 delivers the engine, manual-journal API, and Trial Balance as an **internal** milestone. This slice is the
**human-facing** counterpart: a ledger a person can read *in context* and correct *by hand*, plus the training that makes
an intentionally non-QuickBooks model learnable. It rides on the Phase-0 API and is gated the same way (`CAP-ACCT-FULLGL`).

> **Design stance — novel where it's better, familiar where it's neutral.** Differentiate from QuickBooks on the **model**
> (append-only immutability, event-sourced auto-posting, correct-in-context) — never on interaction grammar for its own
> sake, which is pure training cost with no payoff. The training system (5A.4) is what buys the right to be unfamiliar; it
> is **load-bearing**, not a nicety.

### 5A.1 Ledger view (the immutable register)
- A **new specialized virtualized scroller**, *not* the shared `DataTableComponent` — the interaction is **find-and-center**,
  not **filter-to-subset**. Renders the append-only journal as a continuous, time-ordered register with a **running-balance**
  column; virtualized for large books.
- **Two lenses on one dataset** (journal ≡ ledger — §4): default **chronological (journal)** view across all accounts;
  **account-scoped (GL-detail)** view at `/accounting/ledger/:accountId` showing only the lines that hit one account with
  its running balance. Same store, different grouping — never a second copy.
- **Find-in-context (non-destructive):** search does **not** remove peer rows. A match **scrolls-and-centers** + highlights;
  ambiguous matches raise a **candidate popover** that explains each hit and click-scrolls to it. Peers — and therefore the
  running-balance context — stay visible. Subset/export is a **separate explicit action**, not the default.
- **Drill-back links:** each posted entry surfaces its `Source`/`SourceType`+`SourceId` (the operational document) and, for
  corrections, its `ReversedByEntryId` ⇄ reversed-entry link — click to center the counterpart. The audit trail made navigable.
- **Immutable affordances:** no inline edit/delete. The only row action on a `Posted` entry is **"Reverse / correct,"** which
  opens the compose pane (5A.2) — so the UI can never imply an edit the interceptor+trigger (§4/§5.2) would reject.
- Real-time: consume the best-effort `LedgerChanged`/SignalR notify lane (§4) to append new postings live; never block on it.
- Route `/accounting/ledger`; `LedgerWorkspaceComponent` (shell) + `LedgerViewComponent` (register).

### 5A.2 Manual journal-entry workspace (split-compose)
- **Split-pane on the same surface:** the entry under investigation stays pinned in the **top** pane while the correcting
  entry is composed in the **bottom** pane and **appended at the end of the ledger** — never mutating the original. This is
  the paper-ledger discipline: append today's correction, leave history intact.
- **Balanced by construction:** Dr/Cr line editor with a live **Dr = Cr** indicator; posting disabled until balanced (mirrors
  the engine's unbalanced-reject, §5.9). Accounts come from the **CoA** (postable; control accounts only via sub-ledger —
  §5.1); dimensions (`Job`/`CostCenter`) per the dimension-required policy (§12).
- **Memo required:** a manual JE will not post without a narration. When opened via "Reverse / correct," it pre-fills the
  `ReversedByEntryId` link and a default memo citing the original entry number, so every manual correction is self-documenting.
- **Date / period aware:** default `EntryDate` = today; if the target period is HardClosed, surface the **late-posting fallback**
  (post into the next open period — §12) instead of a dead-end error.
- **SoD / maker-checker reuse (no new rules):** posts route through §5.7 — routine Controller/bookkeeper posts go straight to
  `Posted`; `REVERSE_JE` and large JEs (Book-configurable threshold) route Draft→Approved→Posted with the approver surfaced.
  The pane reflects whichever path applies (immediate post vs "submit for approval").
- `JournalEntryEditorComponent` inside `LedgerWorkspaceComponent`; gated on `POST_JE` / `REVERSE_JE`.

### 5A.3 Manual-only / no-bank mode
- A double-entry ledger needs **no bank connection** — bank/NACHA feeds (Phase 3) are one convenience source, not a
  prerequisite. This mode makes the GL Workspace fully usable **standalone**: every entry hand-keyed via 5A.2 with
  `Source=Manual`, identical engine + immutability guarantees, no reconciliation/bank surfaces required.
- Positions as the **on-ramp before automation**: keep books by hand day one (an advanced paper ledger), then light up
  event-sourced auto-posting (Phases 1–2) and bank rec (Phase 3) **without changing the ledger model underneath**.
- Capability: usable whenever `CAP-ACCT-FULLGL` is on; independent of any bank/statement capability. **No new backend** —
  it's the manual-journal API + workspace with the bank slices simply absent.

### 5A.4 Interaction-training & sample system — **two tracks, opposite problems**
The differentiation from QuickBooks means **no transferable muscle memory** — the model (immutability, reverse-don't-edit,
journal≡ledger) must be *taught*. But there are two learner populations with **opposite** failure modes, so there are
**two tracks** over one shared sandbox:

- **Track A — "Accounting from scratch"** (blank slate; no prior model). *Safe but empty.* Linear, concept-first, heavy
  scaffolding: debits/credits as two views of one event, journal≡ledger, why entries must balance, immutability and the
  reversing-entry as *the* correction tool — all anchored to the **paper-ledger** metaphor. Builds the mental model in order.
- **Track B — "Unlearn QuickBooks"** (has habits that fight the model; **negative transfer** — confident, fast, and wrong).
  *The dangerous one — the learner doesn't know they're wrong.* Short on fundamentals, heavy on **de-programming**: name each
  QB reflex and replace it with the pure-accounting equivalent — *"edit the transaction" → post a reversing entry (Posted is
  immutable); "delete it" → reverse it (history is evidence); "the register is the truth you overwrite" → the register is
  append-only and the ledger is a **view** of it."* Track-B scenarios **deliberately bait the QB reflex, let it fail safely,
  then correct it** — surfacing the wrong instinct is the point.
- **Intake router:** a 2–3 question diagnostic ("have you kept books before? in what?") routes the learner to A or B (or lets
  them pick). Both converge on the same graded scenarios; they differ in **framing, scaffolding, and which misconceptions
  they preempt**, not in the underlying sandbox.

Shared machinery under both tracks:
- **Sample company (sandbox book):** a fully-seeded demo `Book` — small manufacturer, a quarter of realistic history
  (invoices, bills, payroll, inventory receipts, a bank rec) on the existing `public/demo-data/` mechanism + a demo
  determination map. **Isolated and resettable**; never touches a real book. Seeded with **planted errors** (a miscoded
  expense, a duplicate, an NSF/returned payment) so learners practice the exact correct-by-reversing-entry workflow.
- **Interactive guided tours (do, don't watch):** reuse the stack's **driver.js** to walk the *real* surfaces on the sandbox —
  browse the register, find-in-context, open split-compose, post a **balanced** reversing entry, watch it append and the
  drill-back light up. Guarded so a learner can't wedge the sandbox.
- **"Fix-it" scenarios (graded interaction):** task cards ("The March power bill was coded to Rent — correct it") validated
  **against the resulting ledger state** (a balanced, linked, dated adjusting/reversing entry exists), with immediate feedback.
  Scenario definitions are **data-driven** (seed + validator), not hardcoded.
- **Just-in-time hints:** first encounter with a surface (first split-compose, first reversal) triggers a one-time inline
  explainer via the shared **`SlideoutComponent`** help sidecar — dismissible, reopenable from a persistent "?". Progressive
  disclosure over an up-front manual. Track B's hints lead with the *contrast* ("in QuickBooks you'd… here you…").
- **QuickBooks crosswalk glossary** (the spine of Track B): an explicit, honest "if you came from QuickBooks…" map. Naming
  the difference turns the training liability into a differentiation asset and meets the large QB-migrator population where
  they are **without adopting QB's model**.
- **Readiness gate (optional, recommended):** completing the core scenarios can be a **soft prerequisite to flipping
  `CAP-ACCT-FULLGL` on for a real book** — de-risks handing a powerful append-only system to someone who hasn't internalized
  reversing-entry discipline (Track B especially). Ties into the §7A cutover / capability flip.
- Feature `/accounting/training`; `AccountingTrainingComponent` + a `LedgerScenarioRunner`; tracks, tours, scenarios, and the
  crosswalk are **data/config, not code**.

### 5A.5 Acceptance
- Browse a seeded register; find-and-center a transaction **without** hiding its peers; open its drill-back to the source doc
  and (if reversed) its counterpart.
- From a pinned bad entry, split-compose a **balanced** reversing/adjusting entry with required memo and auto-linked
  `ReversedByEntryId`; posting blocked while unbalanced; blocked/soft-rerouted for a HardClosed target; SoD path correct (§5.7).
- Run the sandbox end-to-end with **no bank connected**: hand-key a month, correct a planted error via reversal, produce a
  Trial Balance that balances.
- Route into **both** training tracks from the intake diagnostic; a graded fix-it scenario validates the ledger **end-state**
  (not the clicks); a Track-B "bait" scenario surfaces the QB reflex and confirms the corrected instinct.

### 5A.6 Build checklist (UI slice — after the Phase-0 engine)

> **Backend + advisory surface COMPLETE, two UI components landed — all pushed to `main` (2026-07-05/06).** Endpoints (`CAP-ACCT-FULLGL`-gated, tested): `GET /accounting/ledger` register, `GET /accounting/accounts` chart of accounts, `GET /accounting/journal-entries/{id}/explain` (AI advisory, advises-never-posts), `GET /accounting/anomalies` (deterministic reviewer flags), `POST /accounting/journal-entries/{id}/reverse` (exposes the engine's `ReverseAsync` + SoD). Data layer: `GeneralLedgerService` with all of the above + `createManualJournalEntry` + TS models. Components: `LedgerViewComponent` (`/accounting/ledger` — register + drill-back + AI-explain + anomaly-scan/flags) and `JournalEntryEditorComponent` (`/accounting/journal-entries/new` — balanced compose + post). **Visual verification RESTORED 2026-07-07** (Docker migrated to apt; PLAYWRIGHT_CHANNEL=chrome for Ubuntu 26.04): ledger view, editor, dashboard tiles, and the Reverse/correct prefill flow are all screenshot-verified on the live dev instance (FULLGL flipped on dev book, 5 entries seeded through the real engine incl. a reversal). Verification caught + fixed 4 real UI bugs: DateOnly TZ-shift, action-bar stretch, clipped label, and blank selects from the options-race / FormArray replace-under-tracked-DOM pitfalls. **Remaining is all UI-visual or infra/design:** the reverse *action* (needs a reason-capture dialog), the split-pane *workspace* shell, the virtualized find-in-context scroller (items 2–3), the two-track training feature. The safe/testable backend surface for §5A is done; the rest wants the Docker fix (for verification) or a design pass.

1. [x] `LedgerViewComponent` — **landed + visual-verified** (`components/ledger-view/`): register (newest-first, expandable lines + drill-back + AI-explain + anomaly flags + Reverse/Correct actions), **chronological + `:accountId` lenses over one component** (`/accounting/ledger[/:accountId]`), the lens adding a **running-balance column** (TB-seeded, walked newest→oldest in the same Dr−Cr convention the TB reports) and account drill-down links on every line. *Remaining nice-to-have:* CDK-virtualized rendering for very large books (current: data-table pagination + `LedgerBalance`-backed TB seed).
2. [x] Find-in-context — **landed + visual-verified**: header find bar with browser-find semantics (term match over entry #/date/source/status/memo/lines, `n of M` counter, prev/next cycling, Enter-to-locate); matches **highlighted, never filtered** (`row--find-match`/`--find-current`); built on a new **generic `DataTableComponent.scrollToRow()` locate primitive** (pages to + centers + flashes the row; documented in forge-ui CLAUDE.md). *The candidate-popover variant is superseded by the n-of-M cycling UI.*
3. [x] Drill-back — **landed + visual-verified**: reverses/reversed-by chips are **click-to-center** (locate the counterpart via `scrollToRow`; snackbar when it's older than the loaded page); source refs shown in the expanded entry.
4. [x] `JournalEntryEditorComponent` — **landed + visual-verified** (`/accounting/journal-entries/new`): reactive form, live Dr=Cr gate + totals strip, postable-CoA picker, required memo, dynamic lines, validation-button stereotype, posts via the engine. **Split-pane correction delivered on this page** (`?correctionOf=<id>`): the original entry stays **pinned above the compose form** (status chip + memo + its lines) while the correction is pre-seeded below — §5A.2's workflow without a separate shell. Reverse action = reason dialog on the ledger (engine `ReverseAsync` + SoD). *Remaining:* date/period-aware late-posting fallback surfacing (engine already enforces; UI just shows the error today).
5. [ ] Manual-only mode: workspace usable standalone with bank slices absent; `Source=Manual`.
6. [ ] Routes `/accounting/ledger`, `/accounting/ledger/:accountId`, `/accounting/training`; all `CAP-ACCT-FULLGL`-gated; add to `ACCOUNTING_ROUTES` + finance nav.
7. [ ] Sandbox demo `Book` (resettable, isolated) via `public/demo-data/` + planted errors; demo determination map.
8. [ ] Intake router (A vs B diagnostic); driver.js tours over real surfaces; JIT `SlideoutComponent` hints (one-time + reopenable).
9. [ ] Data-driven fix-it scenarios + `LedgerScenarioRunner` (validate ledger end-state); Track-B "bait-then-correct" scenarios; QuickBooks crosswalk glossary.
10. [ ] (Optional) readiness gate wired to the `CAP-ACCT-FULLGL` flip (§7A).
11. [ ] i18n (`accounting.ledger.*`, `accounting.journal.*`, `accounting.training.*`) in `en.json` + `es.json` at 1:1 parity; `lint:i18n` green.

---

## 6. Roadmap (Conversion + Phases 1–5)

| Phase | Delivers | New entities | Capability |
|---|---|---|---|
| **Pre-1 — Conversion** *(see §7A; before Phase 1 go-live)* | Opening-balance journal + AR/AP open-item load; opening Inventory as a GL **control balance** (per-part valuation store seeded with Phase 2); QB→read-only archive; go-live gate | (uses `Source=Conversion`) | FULLGL gate |
| **1 — AR + Expenses** | Revenue at **control transfer** (Dr COGS/Cr FG at the sale for stocked goods), Payment→Cash/AR, Expense→Expense/AP-or-Cash; Deferred Revenue + customer deposits; sales-tax accrual **and remittance**; AR sub-ledger + aging; P&L + Balance Sheet | (reuse Invoice/Payment/Expense as sub-ledgers; add settlement-target + Vendor FK on `Expense`) | FULLGL + `CAP-RPT-FINANCIALS` |
| **2 — Inventory/COGS + AP** | PO receipt→Inventory/GRNI (landed); 3-way match w/ **PPV**; material issue→WIP, job-complete→FG, COGS at sale; adjustments→write-down; **VendorBill** + **VendorPayment**; AP sub-ledger + aging; **inventory-valuation store** | `VendorBill(Line)`, `VendorPayment`, valuation store | FULLGL |
| **3 — Close + statements** | Soft/hard close + lock enforcement (concurrency-safe); year-end RE roll (idempotent, audited reopen); auto-reversing accruals/prepaids; Trial Balance, P&L, Balance Sheet, Cash Flow; bank accounts + reconciliation | `BankAccount`, `BankStatement`, `BankReconciliation` | `CAP-ACCT-PERIOD` |
| **4 — FX + depreciation** | Realized FX on settlement (Phase 1 onward) + period-end unrealized reval of open AR/AP/cash; fixed-asset depreciation | `DepreciationSchedule`/`Entry` | `CAP-ACCT-FXREVAL`, `CAP-ACCT-DEPRECIATION` |
| **5 — Native payroll** | Pay-run engine, tax withholding, pay-stub source-of-truth, payroll journals + liabilities; consumes `Shift.PremiumMultiplier` + `OvertimeRule` | `PayRun`, tax tables | (new payroll caps) |

> **Sequencing note:** Phase 1 books revenue **with** COGS for stocked finished-goods sales (control-transfer relief),
> so the interim P&L is meaningful; `CAP-RPT-FINANCIALS` (default OFF) enables once COGS posting is live. Phase 5 payroll
> is nearly a sub-product — promote the build-vs-integrate tax decision to a prerequisite spike (§8.3) and cut over payroll
> **separately** from the GL (demoting QB at Phase 1 removes the payroll mirror before native payroll exists).

---

## 7. Posting-sources matrix (events → postings)

**Postings are NOT event-driven.** Each operational command handler (e.g. `ReceiveItems`, `CreateInvoice`) builds a
`PostingRequest` and calls `IPostingEngine.PostAsync` **inline, in its own transaction**. The existing domain events
(`PurchaseOrderReceivedEvent`, `PurchaseOrderShortClosedEvent`, `JobCreatedEvent`, `JobStageChangedEvent`,
`CustomerReturnReceivedEvent`, `ShipmentDeliveredEvent`, `SalesOrderConfirmedEvent`) are **not** the posting path — they
remain available only for the post-commit `LedgerChanged` SignalR notify-lane (a dropped `LedgerChanged` must **not**
dead-letter or alert like a posting failure — §5.8). Trigger sites still need posting fixes: `PurchaseOrderReceivedEvent`
carries `ReceivingRecordId = 0` and a second path `Features/Inventory/ReceivePurchaseOrder.cs` posts nothing — both must
post (with real receiving-record + per-line detail), and the reconciliation sweeper must check **line-level** receipt
coverage, not just `(SourceType, SourceId)` presence (else a *partially*-posted source looks complete).

| Phase | Trigger | Posting (Dr / Cr) |
|---|---|---|
| 1 | **Control transfer** (shipment/delivery) — invoice may precede or follow | Dr AR / Cr Revenue / Cr Sales-Tax-Payable; **+ Dr COGS / Cr Finished-Goods** for stocked goods lines (FG-not-yet-loaded edge → §12) |
| 1 | Invoice before delivery | Dr AR / Cr **Deferred Revenue**; reclass to Revenue at delivery |
| 1 | Payment applied | Dr Cash / Cr AR (unapplied → **Customer Deposits**) |
| 1 | Sales-tax remittance | Dr Sales-Tax-Payable / Cr Cash (by jurisdiction) |
| 1 | Expense approved | Dr Expense / Cr AP (party required) **or** Cr Cash — disambiguated by a settlement-target on `Expense` |
| 1 | Customer return | Dr `SALES_RETURNS` (+ Dr Sales-Tax) / Cr AR-or-`REFUNDS_PAYABLE`; inventory/COGS leg disposition-dependent |
| 1 | Foreign settlement | realized **FX gain/loss** (`FX_GAIN`/`FX_LOSS`) |
| 2 | PO receipt (canonical landed cost) | Dr Inventory (base + allocated freight) / Cr GRNI (base) / Cr **Freight-Clearing**. (Retire the pre-existing `FreightAllocatedEvent` so freight isn't posted twice; `AllocatedFreight` from `ReceiveItems` is the landed-cost input — §8.1.) |
| 2 | VendorBill received (3-way match) | Dr GRNI / Cr AP; price/qty diff → **PURCHASE_PRICE_VARIANCE** (GRNI clears to 0) |
| 2 | VendorPayment | Dr AP / Cr Cash |
| 2 | Material issued to job | Dr **WIP** / Cr Raw-Material Inventory |
| 2 | Job completed | Dr **Finished-Goods** / Cr WIP (COGS recognized at the **sale**, not here) |
| 2 | Inventory adjusted | Dr/Cr Inventory / Cr/Dr `INVENTORY_WRITEDOWN` (shrinkage/obsolescence → expense/COGS, not "variance") |
| 3 | Time entry (if labor capitalized) | Dr WIP/Overhead / Cr Accrued Wages |
| 5 | Pay run posted | Dr Wages/Overhead / Cr Cash + payroll-tax liabilities |

> **Ordering:** GRNI-clear, WIP→COGS, payment-relieves-AR are causally dependent. Because posting is **inline** in the
> operational command, ordering follows code order within each operation; dependent postings still validate their
> precondition GL state and fail-and-surface (or post a compensating accrual) rather than silently producing negative GRNI / COGS-against-unloaded-WIP.

> Posting handlers live in `forge.api/Features/.../` at the command site (e.g. `ReceiveItems` calls `IPostingEngine`
> directly). They build a `PostingRequest` and never touch `JournalEntry` directly. Do **not** post from a `SaveChanges`
> interceptor (collides with the two-phase audit save).

## 7A. Conversion / opening balances / QB cutover (before Phase 1 go-live)

- **Default (required):** a single balanced **opening journal** (`Source=Conversion`) to as-of carrying values
  (assets/liabilities/equity) at a frozen cutover date; **open-item load** of every unpaid AR invoice and AP bill as
  individual sub-ledger items (so aging works + payments apply — **not** a control-account lump). **Opening inventory**
  loads as a GL **control balance** in the opening journal at Phase-1 go-live; the **per-part valuation store** is seeded
  when Phase 2 ships — so a customer needing perpetual inventory/COGS from day one must have Phase 2 *before* go-live
  (this resolves the 7A-before-Phase-1 vs valuation-store-in-Phase-2 ordering).
- **Capability flip (§5.5):** at cutover, `EXTERNAL` off → `BUILTIN` on → `FULLGL` on. **QuickBooks → read-only archive**;
  native GL authoritative from cutover. Define backfill/catch-up posting for BUILTIN-era documents, dated into the
  appropriate **open** period (open it if needed; never post into a HardClosed period). The existing
  `06-migration-spec.md` `EXTERNAL→BUILTIN` direction is *architected-but-not-shipped* (stub enum, no procedure), so
  **§7A is the authoritative conversion procedure** — that spec is context, not something to "wire."
- **Go-live gate:** native opening TB == QB closing TB at the cutover date. `CAP-ACCT-FULLGL` cannot enable for the book
  until this passes.
- **Optional (non-default) full history:** for a non-standard client ask, import history as `Source=Conversion` —
  **summarized monthly TBs** for trailing years (one summary JE/period) for comparatives, or transaction-level if truly
  required — by opening the historical fiscal periods, posting (idempotent, conversion-scoped keys), reconciling each
  period's TB, then hard-closing. This is a bespoke PS effort on the same engine, **not** a re-architecture and not the default.

---

## 8. Configurable settings (manufacturing defaults; owner/accountant ratifies)

> Forge accounting is a product across business models — these are **configuration with manufacturing defaults**
> (Book-level settings + per-entity overrides + pluggable providers), set at company setup, not hard-coded.

1. **Inventory costing method** (Phase 2) — **configurable** `Book.DefaultCostingMethod` + per-part override
   (`Part.ValuationClassId`). **Default = Standard** (manufacturing target); methods **Standard / WeightedAverage /
   FIFO** (rule **LIFO / Specific-ID out** for v1; disable those seed classes). Method drives a **valuation store**
   (Phase-2 entity, not in §5.1's Phase-0 catalog): **weighted-average** → one `(BookId, PartId)` row (on-hand qty +
   moving unit cost); **standard** → reuse `CostCalculation`/`CostingProfile` + variance accounts; **FIFO** → cost-layer
   rows `(BookId, PartId, receiptRef, qtyRemaining, unitCost)`. Standard requires per-part planned costs (weighted-average
   is the zero-setup fallback). Today's "last-PO-price" issue costing is replaced — decide restate-vs-freeze for historical
   `MaterialIssue` costs (Job Profitability Report). *Product default stays Standard; each tenant/accountant ratifies its own.*
2. **Chart-of-accounts content** (Phase 0): review the seed CoA + determination keys with the target accountant.
3. **Payroll tax** (Phase 5): **prefer a trustworthy open-source tax-calc engine**; if none is maintainable, integrate a
   commercial engine or build + maintain withholding tables — the multi-state tables/filings are the hard, ongoing cost,
   so treat as a prerequisite spike. Multi-state; W-2/941/e-file scope; filings out-of-scope unless a vendor provides them.
4. **Revenue-recognition method** — **configurable** `RevenueRecognitionMethod` per book (contract override later).
   **Default = PointInTime** (control transfer: ship/deliver/complete — manufacturing + one-shot service). Add
   **PercentOfCompletion** + **Milestone** for long service/projects later (field exists from Phase 0 → config, not a
   migration; this is the one item that adds a real strategy layer when over-time is built). Confirm the matching
   FG→COGS relief point; Deferred Revenue / customer-deposit handling.
5. **Sales tax (multi-state expected):** build a **pluggable tax-determination provider** — built-in rate tables for
   simple cases + a seam for an external service (Avalara/TaxJar) once economic-nexus / local jurisdictions get real.
   The upstream `SalesTaxRate` is state-only/combined; add jurisdiction granularity + remittance-by-period + exempt/use-tax.
6. **Bank-statement import** (Phase 3): support **both OFX/QFX and CSV** (configurable); matching strategy;
   reconciliation↔period-lock interaction.
7. **FX rate policy** (Phase 1/4): **multi-currency is a core product requirement**, not optional. Reuse the existing
   `ExchangeRate` table + `ICurrencyService` (currently stubbed); define rate selection (spot at txn date for booking;
   settlement-date rate for realized FX; period-end rate for unrealized reval), the `CTA` account, and FX tax currency/rounding.
8. **Approval thresholds** (admin-configurable, not constants): the GL manual-JE approval threshold, plus
   transaction-approval thresholds — defaults **Sales > $50,000**, **Purchasing > $1,000**. A JE/transaction above its
   threshold routes through maker-checker (§5.7).

---

## 9. Build & verification notes

- **Toolchain (now available):** .NET SDK at `~/.dotnet` (10.0.300) — `export DOTNET_ROOT="$HOME/.dotnet"` and put
  `~/.dotnet` + `~/.dotnet/tools` on PATH. `dotnet-ef` 10.0.8 installed. `dotnet ef migrations add` needs design-time
  config: `export Jwt__Key="<32+ chars>"` and `export ConnectionStrings__DefaultConnection="Host=…"` (it doesn't open
  the DB). Solution is `forge.slnx`. (See memory note `forge-api-dotnet-ef-setup`.)
- **Migrations:** scaffold, never hand-author; let EF regenerate snapshot/Designer. snake_case naming; assign explicit
  short FK/index names (63-char Npgsql truncation).
- **Immutability:** `SaveChanges` interceptor (throws on Modified/Deleted Posted ledger rows) **+** Postgres
  `BEFORE UPDATE/DELETE` trigger. Append-only; corrections via reversal.
- **Concurrency:** reuse `FOR UPDATE SKIP LOCKED` + an `IConcurrencyVersioned`/`RowVersion` token on `FiscalPeriod`
  (and the close path takes `FOR UPDATE` and verifies no in-flight entries).
- **DI:** register `IPostingEngine`, read/config interfaces, `ForgeGlAccountingService`, EF `IEntityTypeConfiguration<>`
  in `Program.cs`; DbSets in `AppDbContext.cs`.
- **Tests (layered, scaffolding exists in `forge.tests/Integration`):** posting-engine units (balanced/unbalanced,
  period-lock incl. concurrent close, idempotency incl. duplicate-key-returns-existing, reversal incl. double-reverse,
  control-line party, book-consistency, rounding); source-to-ledger tie-out; **ledger-always-balances** invariant;
  sub-ledger↔control reconciliation; statement tie-out; committed-but-unposted sweeper test; posting-failure alerting.

---

## 10. Branch / delivery strategy

- Branch per phase: `feat/accounting-gl-phase0` off `main` in **forge-api** (+ `feat/accounting-ui-phase0` in **forge-ui**
  when the UI slice starts). Co-author trailer + PR conventions per repo norms.
- `CAP-ACCT-FULLGL` **off by default** until Phase 1 AR posting is verified end-to-end; **hard-gate** enablement per book
  on opening-balances-loaded. Map reporting deliverables to `CAP-RPT-FINANCIALS` (default OFF), enabled once COGS is live.
- Phase 0 is an **internal milestone**, not a customer increment.

---

## 11. Start-here checklist (Phase 0)

1. [ ] Create `forge.accounting` module (entities in `forge.core/Entities/Accounting/`, services in `forge.accounting/`),
       all GL reach behind `IPostingEngine` + read/config interfaces.
2. [ ] Entities: `Book, GlAccount, CostCenter, FiscalYear, FiscalPeriod, JournalEntry, JournalLine,
       AccountDeterminationRule, acct_number_sequences, LedgerBalance` (+ EF configs, explicit names, `DateOnly`, `long` ids).
3. [ ] `dotnet ef migrations add AddAccountingGlFoundation -p forge.data --startup-project forge.api` → review → `database update`.
4. [ ] `IPostingEngine` (inline post + validations + idempotency + reversal) + immutability interceptor + Postgres trigger.
5. [ ] Manual journal-entry endpoint + filter-immune Trial Balance; incremental `LedgerBalance` maintenance.
6. [ ] Seed: Book, CoA, determination rules, current FiscalYear/periods.
7. [ ] `CAP-ACCT-FULLGL` gating (+ opening-balances hard-gate) and `ForgeGlAccountingService` provider shim.
8. [ ] Permissions/SoD (§5.7) at the engine boundary + audit wiring (§5.8) + reconciliation sweeper.
9. [ ] `forge.tests` per §9; `dotnet build` + `dotnet test` green → PR.

> **UI slice tracks separately (§5A).** The GL Workspace (ledger viewer + manual-entry) and its **two-track**
> interaction-training system are the first *customer-facing* accounting surface; they ride on items 4–5 (posting engine +
> manual-journal API) and are checklisted in **§5A.6**, not here — Phase 0 proper is an internal milestone (§10).

---

## 12. Specify at phase entry (detailed mechanics intentionally deferred)

These are sound in shape but must be fully specified when their phase starts — listed so the plan is honest, not
falsely complete. (Each traces to a review finding in `ACCOUNTING_SUITE_PLAN_REVIEW.md`.)

**Phase 1**
- [ ] **FG-not-yet-loaded edge:** a make-to-order good can be sold (COGS-at-sale) *before* Phase-2 loads its Finished-Goods
      balance, driving FG negative. Decide at Phase-1 entry: gate COGS-at-sale on FG availability, or defer COGS for
      production-sourced goods until Phase 2 is live (stocked/purchased goods relieve normally).
- [ ] **Sales-tax-by-jurisdiction** has no structural home (jurisdiction is neither a determination scope nor a line
      dimension, and `SalesTaxRate` is state-only/combined). Decide the breakdown mechanism before tax remittance posting.
- [ ] `Expense` settlement-target + Vendor FK (so `ExpenseApproved` can pick AP-vs-Cash and tie to vendor aging).

**Phase 2**
- [ ] **3-way-match math:** price/qty variance formulas → PPV; bill-before-receipt and partial-receipt/partial-bill
      behavior; **GRNI-aging report**; **ReceivingRecords-vs-GRNI line-level** reconciliation (not just presence).
- [ ] Finalize the per-method **valuation-store schema** (§8.1) and add the entity to the data model.

**Phase 3**
- [ ] **Year-end RE roll:** Income/Expense→Income Summary→Retained Earnings flow; period-13/closing-date handling;
      one-close-per-FY guard; computed current-year-earnings balance-sheet line; closing JE posts **before** the period
      locks; prior-period-adjustment-after-close policy.
- [ ] **Accruals/prepaids:** the `AutoReverseNextPeriod` reversal step at close; recurring/standard journal templates;
      handlers stamp `EntryDate` from the incurred/document date.
- [ ] **Close-checklist gate:** reconciliation clean + sweeper drained before HardClose; **late-posting fallback** (dated
      catch-up into the next open period when a posting arrives for a closed one).
- [ ] **Cash Flow** method (direct vs indirect) + a cash-flow-classification attribute on `GlAccount`.
- [ ] **Close-transition audit columns** (`ClosedBy/At`, `ReopenedBy/At`); data-retention / legal-hold policy.

**Phase 4**
- [ ] Unrealized FX reval entries **auto-reverse** next period (reuse the `AutoReverseNextPeriod` flag); `CTA` usage.

**Cross-cutting**
- [ ] **Reversal-of-reversal** explicit policy (a reversal is itself `Posted` with null `ReversedByEntryId` → state
      whether it may be reversed in turn).
- [ ] **Dimension-required policy:** WIP/COGS lines require a `Job`; departmental accounts require a `CostCenter`;
      report **covering indexes**; handle soft-deleted `Job` masters in ledger reads.
- [ ] **Maker-checker large-JE threshold** = a Book-configurable amount (§5.7).
- [ ] **Journal attachments** for manual JEs via the existing polymorphic `FileAttachment`.

**GL Workspace UI + training (§5A)**
- [ ] **Find-in-context match ranking:** how candidate hits are scored/explained in the popover (amount, account, date
      proximity, source-doc #) — specify when the ledger view is built.
- [ ] **Running-balance at scale:** reuse `LedgerBalance` for account-scoped views; define the chronological running-balance
      strategy so the virtualized scroll stays O(viewport) on large books.
- [ ] **Scenario/tour authoring format:** JSON schema for fix-it scenarios + their ledger-state validators, the intake-router
      questions, and the tour-step config — lock before the training feature is built so content stays data, not code.
- [ ] **Track-A vs Track-B content split:** which concepts are mandatory per track, which QB reflexes the "bait" scenarios
      target, and how the crosswalk glossary is sourced/maintained.
- [ ] **Readiness-gate policy:** hard vs soft prerequisite to the `CAP-ACCT-FULLGL` flip, which scenarios are mandatory,
      per-book override — decide with the §7A cutover.

---

*v3 — incorporates the critical design pass (`ACCOUNTING_SUITE_PLAN_REVIEW.md`) **and** its coverage audit. Blockers
resolved: inline same-transaction posting + best-effort `LedgerChanged`/SignalR notify lane; reconciliation sweeper;
Conversion/opening-balances workstream (§7A) incl. the EXTERNAL→BUILTIN→FULLGL capability flip; **capability-based**
segregation-of-duties (§5.7) — model-agnostic, so a future hierarchical role system (parked) needs no rework. Postgres-only,
append-only (interceptor + trigger, with the `Posted→Reversed` carve-out). Accountant/owner ratify-items in §8; deferred
per-phase mechanics in §12.*
