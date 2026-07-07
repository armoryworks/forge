---
title: GL Training System — design artifacts (Track A / Track B)
type: delivery
status: in-progress
id: accounting-training-design
updated: 2026-07-07
---

# GL Training System — design artifacts for review

Drafts of the three artifacts that gate the §5A.4 two-track training build (see the plan snapshot in
this folder, §5A.4). Everything here is **proposed-for-review** — the build starts once the OPEN
DECISIONS at the bottom are settled. Content is data/config, not code, per the plan.

---

## 1. Sandbox demo `Book` — seed specification

A second, **isolated + resettable** Book (`Code=TRAINING`, `Name=Training Sandbox`) seeded by a
dedicated seeder (`TrainingSandboxSeeder`), never touched by operational auto-posting. Reset =
delete + reseed (the immutability interceptor exempts nothing, so reset works by deleting the whole
book's rows in FK order — sandbox-only operation, gated to the training feature).

**Chart of accounts:** a 12-account teaching subset of the default small-manufacturer CoA
(Cash-Operating, AR control, Inventory-Raw, Inventory-FG, Prepaid, AP control, Sales Tax Payable,
Owner's Equity, Sales Revenue, COGS, Rent Expense, Utilities Expense). Small enough to hold in your
head; both control accounts present so control-account lessons are teachable.

**History: one quarter (13 weeks), ~40 entries**, mixed sources (all `Source=Manual` in the sandbox —
the operational sources are simulated by memo/description, since the sandbox has no operational data):
- Week 1: opening journal (`Conversion`-style memo) establishing all balances.
- Recurring monthly: rent (Dr Rent / Cr Cash), utilities, a two-line payroll simplification.
- Weekly-ish: cash sales, invoice-style AR entries + AR receipts, inventory purchases via AP + AP payments.
- One quarter-end: a COGS true-up and a sales-tax remittance.

**Planted errors (the §5A.4 list, made concrete):**
| # | Entry | The plant | The lesson |
|---|-------|-----------|------------|
| P1 | "Office power bill — March" posted **Dr Rent Expense** instead of Utilities | miscoded expense | reverse + repost (Track A) / don't-edit (Track B) |
| P2 | The same $842.17 utilities bill posted **twice**, 3 days apart | duplicate | find via find-in-context (same amount), reverse ONE |
| P3 | A $1,900 receipt posted **Dr Cash / Cr Cash-in-Transit** that later bounced (NSF) | returned payment | post the NSF reversal + fee entry |
| P4 | A manual $150 posting **directly to AR control** | control-account hand-post | the anomaly scan flags it; correct via a proper sub-ledger-style pair |
| P5 | An entry with memo "adjust to match bank" with **no description on any line** | undocumented adjustment | narration discipline; use AI-explain to see how little it can say |

---

## 2. Fix-it scenario schema (data-driven)

Scenarios are JSON documents (seeded rows in a `training_scenarios` table or shipped as assets —
decision D3 below). The runner (`LedgerScenarioRunner`) validates the **ledger end-state**, never the
click path.

```jsonc
{
  "id": "fix-miscoded-utilities",            // stable slug
  "track": "A" | "B" | "both",
  "order": 30,
  "title.key": "training.scenarios.fixMiscodedUtilities.title",
  "brief.key": "training.scenarios.fixMiscodedUtilities.brief",   // "The March power bill was coded to Rent — correct it."
  "bait.key": null,                           // Track B only: the QB-reflex prompt shown BEFORE the task
                                              // e.g. "In QuickBooks you'd open the transaction and edit it. Try that here."
  "setup": { "requiresPlants": ["P1"] },      // which planted errors must exist (reset if consumed)
  "validators": [                              // ALL must pass against the sandbox ledger
    { "type": "entryReversed",   "match": { "memoContains": "power bill", "account": "60200" } },
    { "type": "entryPosted",     "match": { "drAccount": "60300", "crAccount": "10100", "amount": 842.17 } },
    { "type": "entryLinked",     "match": { "reversalPair": true } },          // ReversedByEntryId set
    { "type": "memoRequired",    "match": { "onNewestManualEntry": true } },
    { "type": "trialBalanced" }                                                // always-on invariant
  ],
  "hints": ["training.scenarios.fixMiscodedUtilities.hint1", "…hint2"],        // progressive
  "success.key": "training.scenarios.fixMiscodedUtilities.done"
}
```

**Validator vocabulary (v1, 6 types):** `entryPosted`, `entryReversed`, `entryLinked`,
`memoRequired`, `accountBalance` (expected balance on an account), `trialBalanced`. Each is a small
server-side predicate over the sandbox book — extensible without schema changes.

**Track-B "bait-then-correct" flow:** the scenario shows the bait prompt, lets the learner try the
reflex (edit/delete — which the UI/engine correctly refuses), then surfaces the crosswalk card for
that reflex and re-issues the task. The *failed attempt is the lesson*.

---

## 3. QuickBooks crosswalk glossary (Track B spine) — outline

One card per reflex; each card = QB habit → what Forge does instead → why (one sentence each).

| # | QB reflex | Forge way | Why |
|---|-----------|-----------|-----|
| 1 | Edit the transaction | Post a reversing entry, then the correct one | Posted rows are evidence; auditors need both |
| 2 | Delete it | Reverse it | History is append-only; deletion hides mistakes |
| 3 | The register is the truth you overwrite | The register is a **view** of the immutable journal | Journal ≡ ledger: one dataset, two orderings |
| 4 | Make a journal entry straight to A/R or A/P | Control accounts move only via their sub-ledgers | Keeps sub-ledger ⇄ control reconciliation exact |
| 5 | Reconcile = tick boxes until the difference is zero | Reconcile = every difference gets a posted entry | The bank feed is a *source of discoveries*, not truth |
| 6 | Void a check | Reverse the payment entry | Same immutability rule; "void" is a reversal with a reason |
| 7 | Backdate freely | Period status governs posting; closed periods take a dated catch-up | Close means closed; late postings land in the open period |
| 8 | "Opening Balance Equity" dumping ground | One balanced opening journal at conversion | §7A: opening TB must equal the legacy closing TB |

---

## 4. Intake router (2 questions)

1. **"Have you kept books before?"** No → Track A. Yes → Q2.
2. **"In what?"** QuickBooks/Xero/etc. → Track B. Paper/spreadsheets/other double-entry → Track A
   (fast path: concept modules skippable via a 3-question check).
Learner can always override the routing; choice stored in user preferences.

---

## 5. DECISIONS — SETTLED 2026-07-07 (Daniel, all recommendations accepted)

- **D1 = A:** second `Book` (`TRAINING`) in the same install. *(Follow-up chore: audit that no report aggregates across books.)*
- **D2 = A:** immutability-trigger carve-out scoped to the TRAINING book's `book_id`.
- **D3 = A:** scenarios ship as versioned JSON assets.
- **D4 = A:** soft readiness gate (recommendation banner on the FULLGL toggle).
- **D5 = A:** crosswalk cards name QuickBooks explicitly.

**Also settled (§7A cutover):** opening-balance import = **CSV template + in-app tie-out**; cutover is
**PS-run for the anchor customers** (minimal UI polish); the dev book gets a proper Conversion opening
journal via the new import seam. Hardware research targets the effort's three tiers
(Pi 5 8GB → 32GB mini-PC CPU-only → 64GB + consumer GPU).

**→ The training build is UNBLOCKED.** Original decision framing preserved below for context.

## 5-orig. OPEN DECISIONS (as drafted)

- **D1 — Sandbox isolation mechanism:** second `Book` in the same install (proposed; cheap, reuses
  everything) vs. a separate demo database. Second-book risk: training entries appearing in cross-book
  reports — mitigated by the engine's book-consistency + report `bookId` scoping, but confirm no
  report aggregates across books.
- **D2 — Reset semantics:** hard delete + reseed of the TRAINING book (proposed) requires a
  sandbox-only carve-out from the immutability trigger (e.g. trigger exempts `book_id` of the training
  book, or reset runs as a migration-grade operation). Confirm the carve-out is acceptable.
- **D3 — Scenario storage:** DB table (admin-editable, per-install customization) vs. shipped JSON
  assets (versioned with the app). Proposal: **shipped assets** for v1; DB later if customers author scenarios.
- **D4 — Readiness gate:** soft (recommended banner) vs. hard (block the FULLGL flip) prerequisite.
  Proposal: **soft** for v1.
- **D5 — Crosswalk tone:** the cards name QuickBooks explicitly (proposed — meeting migrators where
  they are) vs. generic "other accounting software."
