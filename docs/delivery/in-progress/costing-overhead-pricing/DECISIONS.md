---
type: delivery
status: in-progress
id: costing-decisions
---

# Decision record — costing

Decisions taken during the build that would otherwise be re-argued. Each records what was decided,
what it rules out, and what would make it wrong.

---

## D1 — Tier-3 measures variances; it never decides where they post (2026-08-27)

**Context.** Forge already has `ProductionVariancePostingService` and `OverheadPoolService`. Both
write double-entry journals into Forge's own ledger, both are hard-gated on `CAP-ACCT-FULLGL`, and
both need an active `Book` — with FULLGL off they return "not posted" and do nothing. Spec §4
describes variance computation for a shop whose book of record is QuickBooks. The question was
whether Tier-3 variances feed the existing services, or run a parallel path.

**Decision. Neither — split measurement from posting.**

- **Measurement** (WIP transactions at standard, variance computation, generated explanations) lives
  in Tier-3, in its own tables, gated only by `CAP-COSTING-TIER3-ABC`. It knows nothing about books,
  journals, or which GL the shop runs.
- **Posting** is an output adapter chosen by whichever accounting capability is on:
  `CAP-ACCT-FULLGL` → hand the computed variances to the existing posting engine; QBO
  (`CAP-ACCT-EXTERNAL`) → the §7 summary-journal push; neither → measure and display only.

**Why.**

1. **The design partners keep QuickBooks.** FULLGL is off for them. Measurement living inside the
   FULLGL services means the two shops this feature was commissioned for get nothing from it. This
   reason alone is decisive.
2. **The existing overhead service structurally cannot hold Tier-3.** It models one company-wide
   pool through a single `OVERHEAD_CONTROL` / `OVERHEAD_APPLIED` account pair. Tier-3 has many
   pools, per cost center, each with its own driver. The old shape cannot represent the new one.
3. **The scopes do not line up.** `ProductionVariancePostingService.CloseJobProductionCostAsync`
   closes *one job* and sweeps its WIP. Spec §4 closes *a period* across pools.

**What this rules out.** Tier-3 must not write journal entries itself. Where it posts, it goes
through `IPostingEngine` — the SaveChanges immutability interceptor, idempotency keys and the
Postgres triggers all sit behind it, and a second posting path would diverge from the first
silently. Reuse the posting; do not reuse the variance logic.

**The failure mode this is guarding.** On a FULLGL shop both paths would have an opinion about the
same dollars: the existing job close already emits named variances (material usage, labor rate,
labor efficiency, overhead efficiency) when `IStandardCostResolver` is wired. The invariant is
**exactly one path posts a given dollar**:

- FULLGL on → the existing job close remains the thing that posts. Tier-3 measures and explains
  alongside it and posts nothing for a job that close has already swept.
- FULLGL off → Tier-3 measures, explains, and (from build-order step 5) pushes the summary to QBO.

Double-posting does not raise an error. It makes the ledger wrong by exactly the variance amount,
and nobody finds out until someone reconciles.

**What would make this wrong.** If Forge ever became the book of record for every install — FULLGL
default-on, QBO retired — the indirection stops paying for itself and measurement could fold into
the posting services. That is not the current direction ([[forge-platform]]: `CAP-ACCT-EXTERNAL` ⊥
`CAP-ACCT-BUILTIN`, shops choose).

**Still open, and not an architecture question.** Which variances a given shop's accountant wants
named — labor rate split from labor efficiency, or one lumped conversion variance. That is a
conversation with the design partners. This decision does not foreclose either.

---

## D2 — Where the spec and standard cost accounting disagree, the standard wins (2026-08-27)

**Context.** The owner is not an accountant and asked that these calls follow industry standard practice
rather than being escalated. This records the standing rule and the calls made under it.

**Decision.** Where SPEC.md and standard cost accounting conflict, implement the standard and record the
divergence here. Accounting-policy questions are not escalated; genuine business questions (pricing
strategy, which shops to serve, what to charge) still are.

**Calls made under this rule.**

1. **Overhead spending is measured against the flexible budget, not `rate × actual_qty`.** §4.2's formula
   block writes `spending = actual − (rate × actual_qty)`, but its own worked example — "under-absorbed
   $11,240 … Spending was on budget ($2 over)" — only reconciles when a fixed pool is measured against its
   **static** budget. Fixed cost does not fall when hours do. Implemented per the example.
2. **Spending and volume must articulate.** They now sum exactly to the pool's total under- or
   over-absorption, for fixed, variable and semi-variable behavior alike. Under the spec's formulas they
   did not, so an owner adding the two numbers landed on a figure that did not exist. There are tests on
   this property specifically.
3. **A purely variable pool has no volume variance.** Its budget flexes with activity, so running fewer
   hours cannot strand cost — it should simply have cost less. The close records no row rather than a
   zero, because a zero implies the variance exists and came out even.
4. **Price and quantity are named separately for every input.** Purchase price, material usage, labor rate
   and labor efficiency are distinct variances rather than one lumped conversion figure. Each holds one
   factor at standard so the pair is exhaustive and each lands on the person who can act on it. This was
   previously flagged as "a conversation with the design partners"; it is not — it is the standard, and a
   shop that wants them summed can sum them.
5. **Purchase price is recognized at receipt, not at issue** (this one the spec already had right), so it
   lands on the period that made the buying commitment.

**What would make this wrong.** A design partner's own accountant asking for a different treatment for
their books. That is a real reason to revisit — but it is a request to deviate from the standard, and
should be recorded as such rather than absorbed silently.
