# F-027 / F-026 — Payment & Invoice-Balance: Domain-Correct Definition of Done

**Author:** Domain / Industry Specialist
**Status:** Canonical acceptance contract. Backend builds to this; QA tests against it. Not new scope.
**Anchors:** `definition-of-correct.md` §A7 (Invoice), §A8 (Payment), PART C conservation laws, Ruling #4 (payment-apply disposition), Ruling #6 (credit-memo / overpayment landing), Ruling #7 (hard-zero PAID promotion, no epsilon).
**Invariant:** INV-AR1 — `A/R = Σinvoices − Σpayments − Σcredits`.

---

## The single governing rule for both fixes

> **An invoice balance is bounded: `0 ≤ balance ≤ total`. It is never negative.** Overpayment is a legitimate domain concept, but it lives as an **unapplied customer credit**, not as a negative invoice balance. Every payment/credit operation preserves this bound, and there is exactly one canonical balance formula that all consumers use.

This is why the 8 negative-A/R invoices were defects, not states: the excess belonged on the customer account as credit, never on the invoice as a negative balance.

---

## F-027 — Invoice balance semantics

### Canonical formula (one, used by all consumers)

```
invoice.balance = invoice.total
                − Σ(payment_applications to this invoice)
                − Σ(credit_applications to this invoice)
```

- `invoice.total` = Σ line amounts + freight + tax. Tax is QBO-authored (BE-2c / Ruling #9); total is rounded **once** by the single rounding policy (REQ-INVOICE-03, 2-decimal to match QBO).
- A reversed/unapplied payment is removed from `Σ(payment_applications)` — i.e. it adds back to balance. There is no separate "reversal" term; reversal means the application no longer counts.
- `Σ(credit_applications)` covers both credit memos and **write-offs** — a write-off is a credit memo to a bad-debt account (Ruling #7), applied like any other credit. The term is **structural and present now**; until BE-4 (credit-memo model) ships, it evaluates to 0, but the formula and the field must accommodate it without re-derivation.

**De-divergence requirement (the actual F-027 bug):** there must be exactly **one** balance computation — `Invoice.BalanceDue` — and `CreatePayment`, status promotion, and the QBO payload must all read it. The current second formula (`LineTotal == Qty×UnitPrice` recomputed in the payment path) is retired. They are equal today only because no line-level discount/adjustment exists yet; they diverge the instant one does. Collapse onto the canonical formula now (BA §7 / GAP-PAY-02).

### Rounding rule

All terms are 2-decimal (the QBO-matching rounding policy, applied once at total level). Balance is therefore exact at cent precision. **No epsilon / tolerance band** on the zero comparison (Ruling #7) — a residual cent is resolved by the explicit write-off path, never silently swallowed.

### Status semantics

| Condition | Status | Notes |
|---|---|---|
| `balance == total` (nothing applied) | OPEN / POSTED | Unpaid |
| `0 < balance < total` | PARTIALLY_PAID | |
| `balance == 0` (exact, to the cent) | PAID | Hard-zero promotion (Ruling #7). Or balance reached 0 via a write-off credit memo in the audit trail. |
| `balance < 0` | **INVALID STATE — not a status** | Overpayment must have landed the excess as a customer credit, leaving invoice balance == 0 (PAID). A negative balance is an INV-AR1 violation. **There is no "OVERPAID" invoice status.** |

### F-027 acceptance checks

1. `Invoice.BalanceDue` is the only balance formula; payment path, status promotion, and QBO payload all consume it (no second recomputation).
2. `balance = total − Σapplied_payments − Σapplied_credits`, recomputable from movements; matches stored value to the cent.
3. Promotion to PAID requires `balance == 0` exactly (no epsilon); a PAID invoice has either `balance == 0` from payments or a write-off credit memo in its audit trail accounting for the residual.
4. `balance` is never `< 0` and never `> total` for any invoice.
5. Rounding: total rounded once (2-decimal); balance comparison is exact at cent precision; sub-cent drift cannot occur.
6. The `Σcredits` term is present in the formula even with BE-4 unshipped (evaluates to 0), so no re-derivation is needed when credit memos land.

### F-027 numeric acceptance values (test fixtures — backend & QA assert these exact figures)

All amounts 2-decimal. `balance = total − Σapplied_payments − Σapplied_credits`. Comparison exact-to-cent, **no epsilon**.

| # | Scenario | Inputs | balance | Status |
|---|---|---|---|---|
| E1 | Open / unpaid | total $1,000.00; no payments/credits | **$1,000.00** | OPEN |
| E2 | Partially paid | total $1,000.00; payment $400.00 | **$600.00** | PARTIALLY_PAID |
| E3 | Paid in full (exact) | total $1,000.00; payments $400.00 + $600.00 | **$0.00** | PAID |
| E4 | Payment + credit memo | total $1,000.00; payment $700.00; credit $300.00 (short-ship credit) | **$0.00** | PAID |
| E5 | Write-off closes residual | total $1,000.00; payment $997.00; write-off credit $3.00 (bad-debt acct, ≤ Ruling #7 ceiling) | **$0.00** | PAID — *write-off credit memo must be in audit trail* |
| E6 | Payment reversal adds back | total $1,000.00; payment $1,000.00 then reversed/unapplied | **$1,000.00** | OPEN — *reversal removes the application; no separate term* |
| E7 | **Overpayment never goes negative** | total $1,000.00; customer tenders $1,050.00 | **$0.00** (apply $1,000.00 → PAID; **$50.00 → unapplied customer credit**) | PAID — *balance is $0.00, NOT −$50.00. The −$50 invoice is the INV-2321A-class defect.* |
| E8 | No-epsilon boundary | total $1,000.00; payment $999.99 | **$0.01** | PARTIALLY_PAID — *the $0.01 is NOT auto-forgiven; collect or explicitly write off (E5-style)* |
| E9 | De-divergence (the actual bug) | line $1,000.00 with −$50.00 line adjustment → total $950.00; payment $950.00 | **$0.00** via canonical formula | PAID — *the retired `Qty×UnitPrice` formula would wrongly show $50.00 due* |

**E7 interim note (BE-4 not yet shipped):** the over-application is **hard-blocked** — only $1,000.00 can be applied, the $50.00 cannot be recorded until the credit model lands. `balance == $0.00`; excess simply not applied. When BE-4 ships, the $50.00 lands as an unapplied customer credit. Neither state ever produces a negative invoice balance.

### F-027 — four implementation-delta rulings (backend closure)

Backend's read-only assessment surfaced four formula deltas. Rulings:

**Delta 1 — Rounding: MANDATE per-line, then sum.** The DoD requires a rounding policy, and it must match QBO or INV-QBO3 (cent-parity) cannot hold. QBO stores each line `Amount` at 2-dp and sums the rounded line amounts. Therefore:
- `line.Amount = round(Qty × UnitPrice, 2)` per line.
- `subtotal = Σ(rounded line amounts)`.
- `total = subtotal + freight + tax`, all 2-dp.
- The current raw-`decimal`/no-`Math.Round` path is a defect (shared with GAP-INVOICE-05 / GAP-QBO-02) — sub-cent residue breaks the exact-zero PAID comparison.
- **F-027 scope minimum:** `BalanceDue` must consume a **2-dp quantized total**, so the `balance == 0` comparison is exact. Full per-line rounding implementation may be tracked under GAP-INVOICE-05, but F-027 cannot ship consuming a raw unrounded total. Note: invoice-level flat tax on the aggregate is going away anyway under Delta 4, which removes the "sidesteps per-line accumulation" shortcut.

**Delta 2 — Credits term: YES, define `BalanceDue = Total − payments − credits` now.** Include the credits term structurally even though F-035 (no credit/overpayment model) means it evaluates to 0 today. Stub it as a term that sums applied credits over a currently-empty collection, with a TODO tied to BE-4. The point is to **not re-derive the canonical formula when credits land** — the 3-term formula is the canonical one; the 2-term version is the thing being retired. No-credits is *not* "correct for MVP"; zero-valued-credits-term is.

**Delta 3 — Negative-balance clamp: DO NOT clamp.** `max(0, …)` is a band-aid that would *re-mask* the F-035 defect — it hides over-application instead of preventing it. The bound `0 ≤ balance ≤ total` is enforced at the **application layer** (F-026: no application may exceed remaining balance), so `balance` is non-negative *by construction of its inputs*, not by clamping its output. If the raw formula ever computes negative, that is a **detectable INV-AR1 violation to surface**, not to clamp away. This directly feeds F-026: the over-apply guard is the mechanism that keeps balance ≥ 0. (Transitional: the existing F-035 seed rows will compute negative until DevOps remediates them per Ruling #7 — they *should* surface as anomalies, not be clamped into looking healthy.)

**Delta 4 — Tax provenance (F-031 reconciliation): canonical `TaxAmount` = QBO read-back, and F-027's formula SURVIVES F-031 unchanged.** The reconciliation is clean because the two concerns are orthogonal:
- F-027 owns the **balance arithmetic**: `balance = total − payments − credits`.
- F-031 / BE-2c owns the **tax provenance**: who populates `Invoice.TaxAmount`.
- `total = subtotal + freight + tax`, where `tax` is a **stored field on the invoice**. F-027 **consumes** that stored field — it must **not** recompute `Subtotal × TaxRate` in the balance path.
- Pre-F-031: the stored `TaxAmount` is the local (defective) `Subtotal × TaxRate`. F-027 may consume it transitionally.
- Post-F-031/BE-2c: the stored `TaxAmount` is the **QBO-returned `TxnTaxDetail.TotalTax`** read-back (per `be-2c-qbo-tax-spec.md` — app authors zero tax). Same formula; only the provenance of the `tax` field changes.
- **So F-027's canonical formula survives F-031.** The defect to avoid is F-027 itself authoring/recomputing tax — it reads the stored field whose authority transfers to QBO at F-031. Per-line rounding (Delta 1) then applies to subtotal only; tax is QBO-rounded on read-back.

**Net for backend closure:** ship `BalanceDue = quantize(Total) − payments − credits` (credits = 0-valued term, stubbed for BE-4); per-line round amounts → subtotal; consume `Invoice.TaxAmount` as a stored field (do not recompute tax); do not clamp negatives. Assert E1–E9.

### F-027 implementation contract (migration-decisive — read this before coding)

These five answers are exact. **Items 4 and 5 keep F-027 a code-only pass — no DB migration.**

**1 — Quantize mode & places.** `quantize(x) = Math.Round(x, 2, MidpointRounding.AwayFromZero)`. **2 decimal places, AwayFromZero.**
- ⚠ **Do NOT use the .NET `Math.Round(x, 2)` default** — that is `MidpointRounding.ToEven` (banker's rounding) and will diverge from QBO on half-cent midpoints, breaking INV-QBO3 cent-parity. QBO rounds half **away from zero** (commercial rounding). Must match it explicitly.

**2 — Per-line rounding granularity.** `line.Amount = Math.Round(Qty × UnitPrice, 2, AwayFromZero)`, then `subtotal = Σ(rounded line amounts)`. **Per-line decimal places = 2.**
- **Per-line tax does NOT round in-app, because the app does not author per-line tax.** Under BE-2c the app sends per-line `TaxCodeRef` and QBO computes/rounds the tax; the app reads back `TxnTaxDetail`. So there is no app-side per-line tax figure to round. The app rounds **line amounts (ex-tax)** only. (Pre-F-031 transitional flat aggregate tax is going away under F-031; do not build new per-line tax rounding.)

**3 — Credits term shape.** **A named constant `0m` placeholder — NOT a sum over a credit entity/collection.** F-027 must **not** introduce a `CreditMemo` entity or any credit collection. Write the formula literally as `Total − payments − 0m` (or a `const decimal credits = 0m;` term) so the canonical 3-term shape is locked in. The real credit sum is wired in by **BE-4**, which owns the credit-memo entity and **its own migration**. → **F-027 introduces no schema for credits = no migration.**

**4 — Persistence model.** **`BalanceDue` is computed-on-read (a derived value), NOT a persisted/quantized column.** F-027 must **not** add a stored balance column.
- Rationale: a persisted balance can drift from the underlying movements (the class of bug we're fixing); compute-on-read from `quantize(Total) − Σpayments − 0m` is always correct by construction. The existing `Invoice.BalanceDue` already derives (REQ-PAY-01) — keep it derived; just make it the single canonical derivation all consumers call.
- → **No persisted balance column = no migration.**
- Concurrency caveat: compute-on-read means the read-then-apply window is exactly where F-026's race lives. That is F-026's job to close (atomic application write / optimistic version), **not** a reason to persist the balance. Do not "fix" the race by snapshotting balance into a column.

**Net migration verdict: F-027 is CODE-ONLY.** No `CreditMemo` entity (BE-4 owns it), no persisted balance column (compute-on-read). If implementation finds it cannot avoid a migration, stop and flag — that would mean a deviation from this contract.

---

## F-026 — Over-application & concurrency

### Domain rule

A **single payment application may not exceed the invoice's remaining balance** (Ruling #4: apply > balance → hard-block at the application level). When tendered amount exceeds balance, the correct resolution is:

- apply exactly `remaining_balance` to the invoice → drives it to 0 → PAID, **and**
- route the excess to an **unapplied customer credit** (Ruling #6 overpayment landing) — never a negative invoice balance.

Overpayment is intended, but as a customer credit, not a negative balance. So "balance never driven negative" is **absolute**.

### The concurrency requirement (the actual F-026 bug)

The single-application logic guard already exists; the defect is a **race** — two concurrent applications can each read the same `remaining_balance`, both pass the guard, both commit → double-apply → negative balance. The balance read and the application write must be **atomic**: row-level lock on the invoice, optimistic concurrency (version / If-Match), or a DB-level constraint — so concurrent applications serialize and the second sees the updated balance.

### Correct end state under concurrent applications

- **No double-apply:** `Σ(applied to invoice) ≤ invoice.total`, always, even under concurrency.
- **Balance never negative:** the bound `0 ≤ balance ≤ total` holds after any interleaving.
- **Conservation holds:** after concurrent ops, `balance == total − Σapplied − Σcredits` recomputes correctly with no drift and no lost/duplicated application.

### F-026 acceptance checks

1. Single application with amount > remaining balance → rejected (or capped to balance with the excess explicitly creating an unapplied customer credit). Never produces a negative balance.
2. Two concurrent applications that each individually fit but together exceed balance → exactly one succeeds up to remaining balance; the other is rejected or reduced. Final `Σapplied ≤ total`; balance ≥ 0.
3. Under N concurrent applications, no application is double-counted and none is silently lost; `Σapplied` equals the sum of distinct successful applications.
4. After any concurrent interleaving, recomputed `balance == total − Σapplied − Σcredits` and `0 ≤ balance ≤ total`.
5. Intended-overpayment path: tender > balance → invoice to 0 (PAID) + excess as unapplied customer credit (Ruling #6), asserted as a credit on the customer account, not a negative invoice balance.
6. A payment cannot be applied to a Voided/Cancelled invoice (Ruling #4 payment-apply illegal source states).

---

## Cross-cut both fixes

- **One balance formula** (F-027) is the precondition for the concurrency guard (F-026) to be meaningful — you can't atomically protect a balance that's computed two different ways. Sequence F-027 before/with F-026.
- Both uphold INV-AR1; QA can assert the conservation law globally after either fix.
- Overpayment-as-credit depends on BE-4 (credit-memo / unapplied-balance model). Until BE-4 ships, the interim correct behavior is **hard-block** the over-application (Ruling #4) — reject rather than create a negative balance. The overpayment-as-credit landing activates when BE-4 lands. Both states are correct; neither permits a negative invoice balance.
