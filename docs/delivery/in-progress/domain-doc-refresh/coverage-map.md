---
title: Coverage map — definition of correct v3 to runnable manual checks
type: delivery
status: in-progress
id: domain-doc-refresh-coverage-map
updated: 2026-09-14
---

# Coverage map — from domain rule to a test someone can run

**Author:** QA lead · **Source of rules:** `docs/domain/definition-of-correct.md` (v3) and `docs/domain/definition-of-correct-regulated-addendum.md`, industry-specialist branch, commit 228bec7. Section references (§A3, Ruling #3, Part C) point into those documents; this map does not restate their reasoning.

This is the QA-facing companion to the specialist's Part E. Part E names the oracle for each rule family. This map breaks each family into checks a tester can run without seeing code: what the rule asserts, what proves it, what falsifies it, what it presumes, what would make it pass vacuously, how well the existing manual library covers it, and whether I expect the software to pass.

**Start with [§8 — rules expected to fail](#8-rules-expected-to-fail-ranked).** That list is the most useful part of this map.

---

## 1. How to read an entry

| Column | Meaning |
|---|---|
| **Asserts** | The rule, in standard vocabulary. Not softened toward what the software is thought to do. |
| **Presumes** | Feature (the product's *capability*) that must be on, plus accounting mode: **X** = external book of record, **N** = native ledger, **X/N** = both. If a presumed feature is off, the result is **not exercised**, never **pass**. |
| **Proves** | The observation that passes the check. Every refusal check includes a **lit control**: the same action succeeds once the precondition is met. Without it, a refusal might mean the action is refused for everyone. |
| **Falsifies** | The concrete scenario that fails the check if the software gets the rule wrong. |
| **Vacuous if** | Conditions under which the check passes without testing anything. A tester who sees one of these records **not exercised**. |
| **Cov.** | Coverage against the existing manual library: **C** covered · **P** partly covered · **U** uncovered. See §2 for how far this can be trusted. |
| **Exp.** | What I expect: **FAIL**, **?** (no basis for a prediction), or **pass**. An expected failure comes from the rule itself, and sometimes from a gap probe in the visible plan (§2). It never comes from reading the implementation. |

### Recording protocol (applies to every entry)

Each result records:

1. The install's state for every presumed feature.
2. The accounting mode.
3. The status configuration: work-order type, status names and order, and which statuses are mandatory or irreversible.
4. The surface used: desktop, production board, kiosk, mobile, bulk action, import, API or automation.
5. The outcome, which is exactly one of **pass**, **fail** or **not exercised**.

Unless the check is about the convention itself, fixtures use **target margin on price** (Q1).

---

## 2. Coverage basis: what I can and cannot verify

**I cannot see the manual test library.** It is not in this workspace. The context brief says only two things about it: it already uses *work order*, and grounded checks found that routings, operations and work centres exist. That is not enough to rate any rule as covered.

The only manual test artefact I can see is `docs/delivery/in-progress/lead-to-ledger-role-test-plan/README.md` (the "L-plan"). The ratings in this map rest on it, and it is a weak proxy:

- **It is not the library.** It walks one order end to end and was written this month (commit 1497857). It covers **Mode N only**: external accounting, returns postings and payroll are out of scope. So every Mode X rule is **U** on visible evidence.
- **Its expectations come from the implementation.** It cites handler and source-file names and asserts current behaviour. Where it confirms a behaviour, I count that only as evidence that a check exists. I do not count it as evidence that the behaviour is correct.
- **Its vocabulary does not conform.** It uses the product's shipped labels for work order, status, production board and acceptance evidence, not the standard terms. That contradicts the brief's statement that the library says *work order*. Either the L-plan was written apart from the library or the brief is wrong about the library. That needs confirming.
- **Its reference IDs** (L-7.2, G-9 and so on) are cited below only as coverage pointers.

**Rating rule.** **C** means a visible check asserts the whole rule, including its falsifier, in the named mode. **P** means a visible check touches part of the rule, or only one surface or one mode. **U** means nothing visible, and the library may still cover it. **Every U and P needs confirming by whoever holds the library.** That owner should return one of three answers for each entry ID: *case exists (ID)*, *partial*, or *none*.

---

## 3. Vacuity patterns: checks worse than no check

These patterns produce green results that test nothing. Every entry's *Vacuous if* column refers back to them.

| # | Pattern | Guard |
|---|---|---|
| V1 | **Feature off.** For example, "no release without acceptance evidence" passes on an install where the evidence feature, or its required-before-release setting, is off. | Record the feature state first. If it is off, record *not exercised*. |
| V2 | **Wrong accounting mode.** A Mode X rule run on a Mode N install, or the reverse. This includes the L-plan's dark pass (native ledger off) being counted toward financial rules. | Record the mode and run the rule only in the modes its *Presumes* names. |
| V3 | **Everything is refused.** A refusal check passes because the action is refused whatever the precondition. | Lit control: meet the precondition and show the action then succeeds. |
| V4 | **Default status names.** Preconditions tested only on the shipped default work-order type, whose status names happen to match what the implementation expects (L-plan G-9). | Repeat every §A3 check on a custom work-order type with renamed and re-ordered statuses. |
| V5 | **One surface.** A precondition tested only by dragging a card on the production board. | Repeat the check from kiosk, mobile, bulk action, import and automation. |
| V6 | **Trivial fixture.** One lot, one revision, one operation, no scrap, payer equals ship-to, a single tax jurisdiction. | Each entry names the shape its fixture must have. |
| V7 | **Same-period events.** Shipment, invoice and payment all in one open period hide period-timing errors. | Put the relevant events on either side of a period end. |
| V8 | **Idempotency with no real duplicate.** "Posted once" asserted without ever retrying or double-submitting. | Submit twice, concurrently and after a timeout, then count the results. |
| V9 | **Recorded but not enforced.** A hold point, certificate or disposition is stored, but work still advances. | Assert that the advance is refused. Seeing the record exist is not a pass. |

---

## 4. Before release: quote and order acceptance (§A1, §A2)

| ID | Asserts | Presumes | Proves | Falsifies | Vacuous if | Cov. | Exp. |
|---|---|---|---|---|---|---|---|
| Q-01 | Quote recompute is deterministic to the cent | quoting · X/N | Recompute a multi-line quote with quantity breaks and unit-of-measure conversion 5×, and after reload; totals identical | Total changes when lines are re-ordered or on reload | One line, no rate lookups or quantity breaks (V6) | P (L-4 builds an estimate and quote; determinism not asserted) | ? |
| Q-02 | A sent quote keeps the rate and cost basis it was priced on; a later rate change marks it stale for re-pricing and does not silently change it | quoting · X/N | Send, change the work-centre rate, reopen: total unchanged, quote flagged stale | Total silently re-priced, or no stale flag | Rate changed on a work centre not on the quote's routing; quote never sent | U | FAIL (stale flag) |
| Q-03 | Unit price does not rise as quantity rises, absent a real cost step | quoting · X/N | Breaks at 1/10/100 with setup > 0: unit price non-increasing | Unit price at 100 > at 10 with no cost step | Setup = 0 or no breaks (V6) | U | ? |
| Q-04 | Non-recurring engineering and tooling are counted once; `total = Σ lines`; `line = unit × qty + adders` | quoting · X/N | NRE line plus 3 quantity breaks: NRE appears once in each break's total | NRE amortised into the unit price *and* charged as a line | No NRE on fixture | U | ? |
| Q-05 | Every pricing percentage carries its convention (margin or markup); an unlabelled percentage is refused; the other convention is displayed alongside | quoting · X/N | Enter 40 % markup: stored as markup, shown as 28.6 % margin | Bare "40 %" accepted, or markup applied as margin | Cost = 0 | U | **FAIL** |
| Q-06 | Estimate converts one way to a quote and the link is traceable; a quote never converts back | estimating + quoting · X/N | Convert, follow the link both ways; reverse conversion refused | Quote can be turned back into an estimate, or link lost | Estimating off: only quotes exist (V1) | P (L-4) | ? |
| Q-07 | An expired quote cannot convert to an order without re-pricing; a second conversion is **refused**, not treated as idempotent | quoting, sales orders · X/N | Expire, convert: refused; re-price, convert: allowed; convert again: refused, one order | Expired quote converts; a second order is created | Quote has no expiry date | U | ? |
| Q-08 | Customer-supplied material is excluded from material cost and price; handling may be priced | quoting + customer-supplied material · X/N | Bill-of-material line flagged customer-supplied: zero material cost, no margin on it | Material cost or margin applied to free-issue stock | No customer-supplied line (V6) | U | **FAIL** |
| O-01 | Sales-order line price equals the accepted quote's price for that quantity; never recalculated at current rates | sales orders · X/N | Accept, change rates, convert: order price = quote price | Order priced at current rates | No rate change between accept and convert (V6) | P (L-6) | ? |
| O-02 | Quantity, price and date change only through a change order with audit trail and re-acknowledgment; a change that increases the customer's obligation invalidates acceptance evidence for the changed lines | sales orders + order acceptance evidence · X/N | Raise the quantity on a confirmed order: audit row, evidence for that line invalid, release of new quantity refused until re-accepted | Direct edit succeeds, or old evidence still covers the higher quantity | Change *reduces* obligation; evidence not required (V1) | U | **FAIL** |
| O-03 | `hash(stored artefact) == hash recorded at capture`; tampering is detectable | order acceptance evidence · X/N | Capture an email with attachment; replace the stored artefact out of band: mismatch surfaced | Replacement goes undetected | Verbal channel (no artefact) | U | **FAIL** (detection surface) |
| O-04 | Revocation is appended; the original evidence, who revoked, when and why remain retrievable | order acceptance evidence · X/N | Revoke: original still viewable with revocation record | Original gone after revoke | Never revoked | P (L-6.4 revokes, then re-gates; revocation is a delete) | **FAIL** |
| O-05 | Evidence binds to the order version it accepted; accepting version 1 does not accept version 2 | order acceptance evidence · X/N | Accept, add a line: new line uncovered | New line treated as accepted | No post-acceptance edit | U | **FAIL** |
| O-06 | Order acknowledgment (seller to buyer) and acceptance evidence (buyer to seller) are distinct artefacts | sales orders · X/N | Both exist separately; either can exist without the other | One record stands for both | — | U | **FAIL** |
| O-07 | Customer purchase-order terms that differ from the quote are surfaced (battle of the forms), not silently resolved | order acceptance evidence · X/N | Evidence carrying different payment terms: conflict flagged | Silently takes either set of terms | Terms identical | U | **FAIL** |
| O-08 | The same customer purchase-order number on two orders is surfaced | sales orders · X/N | Second order with same number: warning | Silent duplicate | — | U | ? |
| O-09 | Marketplace orders: receivable owed by the payer; consumer recorded as ship-to; revenue gross unless agency is an explicit setting; no seller-authored tax when the marketplace is the facilitator | retail / marketplace orders · X/N (gross revenue posts in N) | Payer ≠ ship-to fixture: receivables aging shows payer; invoice has no seller tax | Consumer becomes debtor; seller tax computed; fees netted from revenue | Payer = ship-to; non-facilitator marketplace (V6) | U | **FAIL** (facilitator tax) |
| O-10 | Turning acceptance evidence off mid-order retains existing evidence | order acceptance evidence · X/N | Capture, disable, re-enable: evidence intact | Evidence gone or orphaned | — | U | ? |

---

## 5. Release (§A3 row "Release")

"Release" is the first point at which labour or material may be charged. Because statuses are shop-configured, **the tester must first ask where the install marks release.** If no status, flag or event can be identified as release, REL-03 and OP-01 **fail by construction**: a rule that has no point to attach to is not a pass.

| ID | Asserts | Presumes | Proves | Falsifies | Vacuous if | Cov. | Exp. |
|---|---|---|---|---|---|---|---|
| REL-01 | Release requires a valid, current part revision (or explicitly authorised use of a superseded one) plus a routing and bill of material for that revision | work orders; routings & work centres · X/N | Superseded revision refused; with authorisation, allowed and logged; no routing: refused | Release on a superseded revision with no authorisation | Single revision per part; routings off (V1, V6) | P (L-7.1 pins the bill-of-material revision at release) | ? |
| REL-02 | If evidence is required, release (and every labour or material charge) needs unrevoked evidence covering the line's current version | work orders + order acceptance evidence + *required before release* on · X/N | Lit: evidence present, release OK. Revoke after order confirmation: release, material issue and clock-on all refused | Gate sits only at order confirmation, so a work order released after revocation still accepts charges | Setting off (V1); work order refused for an unrelated reason (V3) | P (L-6.2/6.4 gate *order confirmation*, not work-order release) | **FAIL** |
| REL-03 | `labour or material charged ⇒ work order released at the time of the charge` | work orders · X/N | Unreleased work order: material issue and clock-on refused on every surface | Kiosk or mobile clock-on to an unreleased work order accepted | No release point identifiable (fails, not vacuous); board-only test (V5) | U | **FAIL** |
| REL-04 | A customer-supplied bill-of-material line is received, or its expected arrival is recorded, before release | work orders + customer-supplied material · X/N | Not received, no date: release refused | Released with neither | No customer-supplied line (V6) | U | **FAIL** |
| REL-05 | A blocking hold refuses release | work orders + hold points / approvals · X/N | Hold placed: refused; cleared: allowed | Released under hold | No hold configured (V1) | U | ? |
| REL-06 | Required material = bill of material × quantity + scrap allowance; `start_qty ≥ order_qty` when an allowance applies | work orders · X/N | Scrap allowance 5 % on 100: start quantity ≥ 100, material covers 105 | Start quantity = order quantity despite allowance | Allowance 0 (V6) | U | ? |
| REL-07 | `work_order.part_rev == order_line.part_rev`; estimated cost traceable to the quote basis; in Mode N with standard costing, the standard at release is pinned as the variance baseline | work orders; standard costing for the baseline · X/N (baseline N) | Change the standard after release: work order still carries the old baseline | Baseline follows the new standard | Standard costing off; no roll after release (V1, V7) | P (L-7.1) | ? |
| REL-08 | An engineering change after release does not silently change an open work order's revision | work orders; revisions · X/N | Release, issue a new revision: work order keeps its revision until explicitly changed, with audit | Open work order silently switched | Single revision (V6) | U | ? |

---

## 6. Start an operation and report work (§A3 row "Starting an operation", §A4)

| ID | Asserts | Presumes | Proves | Falsifies | Vacuous if | Cov. | Exp. |
|---|---|---|---|---|---|---|---|
| OP-01 | Starting an operation requires a released work order | work orders; shop-floor data collection · X/N | As REL-03, from kiosk and mobile | Operation started on an unreleased work order | As REL-03 | U | **FAIL** |
| OP-02 | Prior operations required by the routing have reported enough good quantity before this one starts | routings & work centres; shop-floor data collection · X/N | Operation 10 good = 0: clock-on to operation 20 refused; after reporting 10 good, allowed | Operation 20 starts with nothing good from operation 10 | Single-operation routing (V6) | U | **FAIL** |
| OP-03 | Every report is attributed to an identified operator (badge or scan plus PIN, or equivalent) | shop-floor data collection · X/N | Anonymous report refused; attributed report shows the operator | Report saved with no operator, or under a shared kiosk identity | Test runs logged in as a named desktop user only (V5) | U | ? |
| OP-04 | A hold point preceding the operation (inspection, approval, permit) is satisfied **and unexpired** | hold points / approvals · X/N | Expired approval: start refused; renewed: allowed | Start allowed on an expired approval | Hold with no expiry; no hold configured (V1, V9) | U | **FAIL** (expiry) |
| OP-05 | Per operation: `qty_in = qty_good_out + qty_scrapped + qty_at_op` | shop-floor data collection · X/N | Report partials across two operations; balance holds at each | Quantities appear or vanish between operations | No scrap, no partials (V6) | P (L-7.5 completed quantity only) | ? |
| OP-06 | Cumulative good at the final operation ≤ `start_qty − Σ scrap` | shop-floor data collection · X/N | Start 10, scrap 2, report 9 good: refused | 9 good accepted | No scrap (V6) | U | **FAIL** |
| OP-07 | Scrap carries a reason code | shop-floor data collection · X/N | Scrap without reason: refused | Accepted | No scrap (V6) | U | ? |
| OP-08 | Labour cost accrues only to that work order and operation: `actual_labour = Σ(reported time × rate)` | time tracking · X/N (cost posting N) | Two work orders, interleaved reports: each total matches its own reports | Time leaks to the wrong work order | One work order in fixture (V6) | P (L-7.4, L-8.1) | ? |
| OP-09 | Per operator per day: `Σ labour time ≤ attendance time`; overlapping operations split by a declared rule | time tracking with attendance and labour time · X/N | Clocked in 8 h; labour on two concurrent operations 6 h each: split, total ≤ 8 h, indirect time reported | 12 h labour against 8 h attendance accepted | Attendance not recorded (V1); no concurrency (V6) | U | **FAIL** |
| OP-10 | Offline kiosk or mobile records carry event time, not sync time | shop-floor data collection (mobile/kiosk, offline) · X/N | Report at 10:00 offline, sync at 14:00: record time 10:00 | Record time 14:00 | Device never offline (V6) | U | **FAIL** |
| OP-11 | Kiosk, mobile, desktop, bulk action and automation produce identical records and identical refusals | shop-floor data collection · X/N | Run OP-01…OP-06 from each surface: same outcomes | Any surface bypasses a refusal | Only one surface available on install (record, V5) | U | **FAIL** |
| OP-12 | An offline report that syncs after its work order closed is flagged, not silently absorbed or lost | shop-floor data collection · X/N | Close, then sync: flagged for review | Silently added to a closed work order, or dropped | No offline path (V6) | U | **FAIL** |

---

## 7. Mandatory and irreversible statuses (§A3 rows 3–4, Ruling #1, Ruling #4 "Work order")

**Run every entry in this section twice (V4):** once on the shipped default work-order type, and once on a custom work-order type whose statuses are renamed and re-ordered.

| ID | Asserts | Presumes | Proves | Falsifies | Vacuous if | Cov. | Exp. |
|---|---|---|---|---|---|---|---|
| ST-01 | A status marked mandatory cannot be skipped from any path: board, kiosk, mobile, **bulk move, import, automation** | work orders (configurable statuses) · X/N | Each path refuses the skip; lit: stepping through the status is allowed | Bulk move or import lands past the mandatory status | No mandatory status configured (V1); board-only (V5) | P (L-7.2 single board move) | **FAIL** (non-board paths) |
| ST-02 | A backward move past a status marked irreversible is refused from every path | work orders · X/N | As ST-01 | Bulk move, import or automation moves the work order back | No irreversible status (V1); board-only (V5) | P (L-7.2) | **FAIL** (non-board paths) |
| ST-03 | Shipments, invoices and payments are reversed through their own flows, never by moving the work order back; moving back never voids them | work orders; shipments; invoicing · X/N | Move a work order back through a non-irreversible status after shipment: shipment and invoice stand | Back-move voids or alters a document | No document raised (V6) | U | ? |
| ST-04 | Every precondition and downstream effect holds **whatever the statuses are named**: order status advances, shipment availability, invoice triggers | work orders · X/N | Custom work-order type with no conventional names: order advances, shipment can be created, gates fire | Order status never advances or shipment finds no lines on a custom type | Default type only (V4) | U (L-plan G-9 probes it and records the failure) | **FAIL** |
| ST-05 | Renaming or re-ordering statuses, or adding a mandatory status, while work orders are open neither silently removes nor adds preconditions those work orders already satisfied | work orders · X/N | Open work order past point P; add a mandatory status before P: work order not blocked or back-flagged; new work orders are gated | Open work orders retroactively blocked, or silently exempted without record | No open work orders during the change (V7-like) | U | **FAIL** |
| ST-06 | Relabelling the work-order entity mid-life (for example to "project") changes no records or rules | work orders · X/N | Relabel: history, numbers and gates unchanged | Records split or rules stop firing | — | U | ? |
| ST-07 | Status-driven invoicing, guardrail 1: goods quantity invoiced = `shipped − already_invoiced`, never the work-order or order quantity | invoicing with an invoice-raising status configured · X/N | Order 10, ship 6, enter status: invoice for 6 | Invoice for 10 | No invoice-raising status (V1); ship-complete order (V6) | U | **FAIL** |
| ST-08 | Guardrail 2: goods invoice requires `shipped_qty > 0` | as ST-07 | Enter status with nothing shipped: no goods invoice (move allowed, Ruling #4) | Invoice raised before shipment | As ST-07 | U | **FAIL** |
| ST-09 | Guardrail 3: re-entering the status raises no second invoice. Mode X: one external invoice via stable external id. Mode N: one receivables/revenue entry | as ST-07 · X and N separately | Back and forward: one invoice, one external document (X) or one entry (N) | Second invoice | No back-move allowed by config (V3) | U | ? |
| ST-10 | Guardrail 4: partial shipment leaves the remainder billable | as ST-07 | Ship 6 then 4: two invoices totalling 10 | Remainder never billable | Ship-complete (V6) | U | **FAIL** |
| ST-11 | Shipped-but-unbilled quantity aging beyond terms is flagged | invoicing · X/N | Ship, never advance: appears on the aging flag after terms | Silent | Invoiced same day (V7) | U | **FAIL** |

---

## 8. Rules expected to fail (ranked)

Ranked by severity times confidence. Each entry is a finding if it fails. **None of these assertions has been softened.**

| Rank | ID | Why I expect failure |
|---|---|---|
| 1 | ST-04 | Correctness must not depend on status names. The L-plan's own probe G-9 records downstream effects that match on status names. |
| 2 | SH-07 | Cost of sale must land in the period control transfers. The visible plan posts cost of sale on invoice or delivery, not on shipment, so FOB-origin shipments invoiced after period end mis-state the period. |
| 3 | IV-06, IV-07 | Ruling #2 was prompted by a flat per-customer tax rate. Ruling #5 was prompted by a non-taxable default for operation lines. Both are spine defects. |
| 4 | REL-02, REL-03, OP-01 | The only visible acceptance gate is at order confirmation. Revocation after confirmation, and charges before release, have no visible gate, and a configurable board has no inherent release point. |
| 5 | O-04, O-05, O-02 | Revocation is modelled as a delete. Nothing visible binds evidence to an order version or invalidates it when obligation increases. |
| 6 | ST-07, ST-08, ST-10 | Ruling #1 exists because status-driven invoicing lacked these guardrails. |
| 7 | LED-03, INV-09, RET-01 | Quantity changes with no value entry: receipt to stock with no standard cost (G-3) and returns with no posting (G-6). |
| 8 | CL-04 | The visible close posts a single production variance. The rule requires variances named by cause. |
| 9 | ST-01, ST-02, OP-11 | Mandatory and irreversible checks are visible only for a single board move. Bulk, import, automation, kiosk and mobile paths are unchecked. |
| 10 | EXT-01…EXT-08 | Mode X has no visible coverage at all: tier declaration, out-of-band edits, receivables parity. |
| 11 | INV-05…INV-07, Q-08, SH-08, REL-04 | Q3 was only just resolved ("it occurs"). Ownership-aware valuation is unlikely to predate that resolution. |
| 12 | OP-09, OP-10, OP-12 | Labour within attendance, event time, and post-close sync are all classic kiosk and mobile gaps. |
| 13 | LED-08 | A mode cut-over needs a guard that no events are double-booked and none are lost. Nothing visible guards it. |
| 14 | CL-02 | The L-plan asserts that labour logged after close is "not re-swept", which is silent. The rule requires a flag. |
| 15 | DOC-01 | The product's lifecycle window for editing numbers must end at issue. The brief describes the window without that bound. |
| 16 | CAN-02 | The purchase-order cancel guard should be `matched_bill_qty > 0`. `received_qty` is the common wrong guard. |
| 17 | R-11 (and R-01…R-07) | Regulated gates must block, not merely record. The visible NCR gate hangs off the final status, not the issue and ship paths. |
| 18 | Q-05, Q-02 | An unlabelled margin or markup percentage is refused, and a stale quote is flagged on a rate change. |

**Also out of definition but visible:** G-1 (credit hold ignored across quote, confirm, ship and invoice) and G-4 (a voided payment leaves the order completed). Neither is a v3 rule. I recommend the specialist rule on both.

---

## 9. Ship or receive finished quantity to stock (§A3 row 5, §A5, §A6)

| ID | Asserts | Presumes | Proves | Falsifies | Vacuous if | Cov. | Exp. |
|---|---|---|---|---|---|---|---|
| SH-01 | Shipping or receiving to stock needs final-operation good quantity covering the quantity | work orders; shipments · X/N | Final operation good 8: shipping 10 refused; after 10 good, allowed | Shipment bound only to *order* remaining quantity, ignoring work-order good quantity | Ship from pre-existing stock, not a work order (V6) | U (L-9.2 checks order remaining only) | **FAIL** |
| SH-02 | Required final inspection or hold points are satisfied before shipment, whichever path creates the shipment | shipments + hold points · X/N | Open nonconformance: creating a shipment directly from the order is refused | Gate enforced only on the final status; one-click ship from the order bypasses it | No hold configured (V1, V9) | P (L-7.7 blocks the final status) | **FAIL** |
| SH-03 | A lot or serial is assigned before shipment or receipt to stock for a controlled part | lot/serial traceability · X/N | No lot: refused | Ships "unknown lot" | Part not lot-controlled (V6) | U | ? |
| SH-04 | `shipped ≤ ordered − already_shipped + over-ship tolerance` | shipments · X/N | Tolerance 2 %: 102 of 100 allowed, 103 refused | Over-ship beyond tolerance accepted, or tolerance ignored | Tolerance 0 (V6) | P (L-9.2, no tolerance) | ? |
| SH-05 | Each shipment relieves inventory exactly once under retry and duplicate submission | shipments; inventory · X/N | Double-submit ship concurrently: one relief | Two reliefs | No real duplicate (V8) | P (L-9.4 single) | ? |
| SH-06 | Every shipped lot or serial traces back to consumed material lots, and forward from each consumed lot to its shipments | lot/serial traceability · X/N | Two raw lots, split finished lot, ship across two finished lots: trace complete both ways | Chain breaks at a split, merge or multi-lot shipment | Single lot throughout (V6) | U | **FAIL** (split/merge) |
| SH-07 | Cost of sale is recognised in the period control transfers (N posts `Dr cost of sale / Cr finished goods`; X supplies the facts once) | shipments · N posts, X supplies | FOB origin, ship on last day of period P, invoice in P+1: cost of sale in P | Cost of sale lands with invoice or delivery in P+1 | All events in one period (V7) | U (L-9.4/L-10B assert the opposite) | **FAIL** |
| SH-08 | Customer-supplied content contributes zero to cost of sale | shipments + customer-supplied material · X/N (posting N) | Part with free-issue content: cost of sale excludes it | Free-issue content valued | No free-issue content (V6) | U | **FAIL** |
| SH-09 | Revenue before shipment (bill-and-hold) only when all ASC 606-10-55-83 criteria are recorded | invoicing; shipments · N (X: operational record) | Criteria unmet: revenue deferred | Revenue recognised on hold without criteria | No bill-and-hold scenario | U | **FAIL** |
| SH-10 | Void shipment: refused if invoiced (absolute) or delivered; if shipped and not invoiced, allowed with atomic compensation (restore lot and quantity, reverse cost of sale, decrement shipped quantity, reason code, elevated permission) | shipments · X/N (reversal entry N) | Inject failure in cost reversal: inventory restore does not stand | Half-compensated void; void allowed after invoice | Cannot inject failure: record partial (V3) | U | ? |
| INV-01 | `on_hand = Σ receipts − Σ issues − Σ shipments ± adjustments` per item, lot and location; never silently negative | inventory · X/N | Issue beyond on hand: refused or explicit negative with alert | Silent negative | Ample stock (V6) | P (L-12.4 valuation reconciliation) | ? |
| INV-02 | `available = on_hand − allocated`; no over-allocation; a lot quantity never allocated to two work orders | inventory (+ lot) · X/N | Allocate the same lot to two work orders: second refused | Double allocation | One work order (V6) | U | ? |
| INV-03 | Unit-of-measure conversion buy → stock → issue, with consistent rounding | inventory · X/N | Buy in bars, stock in feet, issue 3.0001 ft: balances reconcile | Rounding drift | Single unit of measure (V6) | U | ? |
| INV-04 | Every issue records the lot consumed | inventory + lot/serial traceability · X/N | Issue without lot on a controlled item: refused | Accepted | Not lot-controlled (V6) | P (L-7.3 issues) | ? |
| INV-05 | `owned + supplier-consigned + customer-supplied on hand = physical on hand`; only owned stock is valued | inventory + consignment · value N; X: platform sends no value for non-owned | Three ownership types in one location: valuation includes only owned | Consigned or free-issue stock valued | Fixture has only owned stock (V6) | U | **FAIL** |
| INV-06 | Supplier consignment: the payable (and in N, the inventory or cost entry) arises on consumption, not receipt | consignment; purchasing · N (X: quantity only) | Receive consigned: no payable; consume: payable | Payable at receipt | No consignment (V1) | U | **FAIL** |
| INV-07 | Customer consignment: revenue and cost of sale when the customer consumes | consignment · N | Ship to consignment location: no revenue; consumption report: revenue | Revenue at transfer | No consignment (V1) | U | **FAIL** |
| INV-08 | Mode X: issue cost reconciles to external valuation with an **explained** difference | inventory; accounting integration · X | Reconciliation report shows delta with cause | Delta silently absorbed or not reported | Standard = average by coincidence (V6) | U | **FAIL** |
| INV-09 | No quantity-changing event without its matching value entry | inventory · N | Receive to stock a part with no standard cost: refused, or valued by a declared fallback with an entry | Quantity moves with no entry (G-3) | All parts have standards (V6) | U (G-3 probes and records the failure) | **FAIL** |
| INV-10 | Receiving against an unapproved purchase order is always refused; a fully received order refuses over-receipt without exception and supervisor approval; cancelled or closed orders refuse receipt | purchasing · X/N | Each case refused; lit: approved open order receives | Receipt on unapproved order | Only approved orders in fixture (V3) | P (L-6b) | ? |
| INV-11 | A cycle count or bin transfer on an allocated lot keeps allocation consistent | inventory + lot · X/N | Count down an allocated lot: allocation re-evaluated, shortage flagged | Allocation exceeds on hand silently | Unallocated lot (V6) | U | ? |

---

## 10. Invoice, payment and returns (§A7, §A8, Part D Returns, Rulings #2 and #5)

| ID | Asserts | Presumes | Proves | Falsifies | Vacuous if | Cov. | Exp. |
|---|---|---|---|---|---|---|---|
| IV-01 | `invoiced_qty ≤ shipped_qty` per goods line; non-goods billing excluded **by line type**, not by exception | invoicing · X/N | Goods beyond shipped refused; typed freight or deposit line allowed; untyped part-less line beyond shipped refused | An untyped line bypasses the quantity check (G-5) | No part-less lines (V6) | P (L-10.2) | **FAIL** (by-type discipline) |
| IV-02 | `invoice_line.price == order_line.price` | invoicing · X/N | Rate change after order: invoice at order price | Re-priced | No rate change (V6) | P | ? |
| IV-03 | `invoice_total = Σ lines + freight + tax` with a fixed rounding rule consistent with the book of record | invoicing · X/N | Lines with 3-decimal unit prices: total matches book of record to the cent | Cent drift | Round-number prices (V6) | P | ? |
| IV-04 | Each shipped quantity is invoiced at most once; consolidated (many shipments to one invoice) and partial invoicing are permitted | invoicing · X/N | Two shipments on one invoice allowed; the same quantity on a second invoice refused | Consolidation refused, or duplicate allowed | One shipment, one invoice (V6) | P (L-10.2, one invoice per shipment) | ? |
| IV-05 | Mode X: tax computed once by the external engine from platform-supplied inputs; stored tax = returned tax to the cent | invoicing + sales tax + accounting integration · X | Platform stores the engine's figure; platform-authored figure absent | Platform computes its own tax and pushes it, or both differ | Exempt customer only (V6) | U | **FAIL** |
| IV-06 | Tax follows ship-to jurisdiction, per-line taxability and exemption certificate (number, expiry) valid at invoice date; a flat per-customer rate is a defect | sales tax · X (engine) / N (platform or engine) | Same customer, two ship-to states: different tax; certificate expired between order and invoice: taxed | One rate per customer regardless of ship-to | Single jurisdiction; no certificates (V6) | U (G-7 seed only) | **FAIL** |
| IV-07 | Default taxability: production operations, outside processing and NRE/tooling are taxable; non-production services non-taxable | sales tax with per-line taxability · X/N | New operation line defaults taxable | Defaults non-taxable | Fixture in a state that doesn't tax fabrication (V6: rate 0 hides the category, so check the category not the amount) | U | **FAIL** |
| IV-08 | A deposit invoiced before performance is a contract liability, not revenue | invoicing · N | Deposit invoice posts to contract liability; final invoice nets it | Deposit posted as revenue | No deposit scenario | U | ? |
| IV-09 | Mode N: an invoice posts one balanced `Dr receivables / Cr revenue / Cr tax payable` entry; Mode X: one external invoice per issued invoice (stable id) | invoicing · N and X separately | Re-send and retry: one entry (N) or one external document (X) | Duplicate entry or document | No retry (V8) | P (N: L-10.3/10.4; X: U) | ? |
| IV-10 | Void invoice guard: `issued AND payments_applied_total == 0`; draft refused (delete instead); already voided refused as error; zeroed by credit memo refused | invoicing · X/N | Each case; lit: issued, unpaid void allowed, reversal entry in open period (N) | Void with payment applied | No applied payment in fixture (V3) | P (L-10.4 draft and unpaid cases) | ? |
| IV-11 | An invoice dated in a closed period is refused or posted to the open period with disclosure; never a silent reopen | invoicing · N | Hard-closed period: refused with reason | Posted into the closed period | Period open (V7) | P (L-12.6 payments only) | ? |
| PAY-01 | `receivables = Σ invoices − Σ payments − Σ credits` per payer | payments · X/N | Aging per payer matches the formula | Drift | Single invoice (V6) | P (L-11.6, N) | ? |
| PAY-02 | Applied ≤ open balance; excess goes to explicit unapplied credit, never a negative invoice balance; applications plus unapplied credit = payment amount | payments · X/N | Pay 100 against 80: 80 applied, 20 unapplied credit | Negative balance or over-application | Exact payments only (V6) | P (N: L-11.1, L-11.4; X: U) | ? |
| PAY-03 | Mode X: a single declared direction of truth for cash receipts; each payment recorded in exactly one system of origin | payments; accounting integration · X | Record in the declared system: mirrored once; record in the other: refused or flagged | Recorded in both | Mode N install (V2) | U | **FAIL** |
| PAY-04 | Apply refused on paid, voided or cancelled invoices; retry at the same amount is a no-op; refund > payment or re-refund refused | payments · X/N | Each case | Double application on retry | No retry (V8) | P (L-11.1) | ? |
| PAY-05 | Marketplace payout net of fees: receivable settled gross, fee as selling expense | payments + retail / marketplace orders · N | Payout 90 on 100 invoice with fee 10: receivable 0, expense 10 | Receivable left 10 or revenue netted | Non-marketplace (V1) | U | ? |
| RET-01 | Returns: authorisation → receive → inspect → disposition → credit, replacement or rework work order. Mode N: credit memo reverses revenue and receivables; returned goods re-enter inventory at disposition value | returns · N (X: credit memo syncs once) | Full return cycle: entries exist and balance | Return closed with no entry (G-6) | Returns off (V1) | U (G-6 probes and records the failure) | **FAIL** |

---

## 11. Close: work order, standard costing, period and ledger (§A3 row "Close", §A10, §A11, Part C)

| ID | Asserts | Presumes | Proves | Falsifies | Vacuous if | Cov. | Exp. |
|---|---|---|---|---|---|---|---|
| CL-01 | Closing a work order with unresolved negative work in process is refused | work orders · X/N | Over-relieve work in process: close refused with reason | Closes | Clean work order only (V3) | U | **FAIL** |
| CL-02 | Closing with issued material or labour not yet accounted: allowed with warning and flagged; later charges to a closed work order are flagged, not silently unswept | work orders · X/N (variance posting N) | Log labour after close: flag raised | Silently ignored ("not re-swept") | No late charge (V6) | P (L-8.2 asserts silence) | **FAIL** |
| CL-03 | Per work order at close: `actual = standard of good output + Σ variances` to the cent, with a declared rounding account; work in process nets to zero | standard costing · N | Close a work order with scrap and rework: identity holds | Unexplained residue | No departures from standard (V6) | P (L-8.1) | ? |
| CL-04 | Variances are named by cause (purchase price, material usage, labour rate, labour efficiency, overhead, outside processing, scrap); price and quantity effects never mixed | standard costing · N posts / X measures | Fixture with price and quantity departures: separate entries per cause | A single "production variance" | Only one kind of departure (V6) | P (L-8.1 single variance) | **FAIL** |
| CL-05 | Variances are computed on **good** output, not started | standard costing · N / X | Start 10, scrap 2, good 8: efficiency on 8 | Computed on 10 | No scrap (V6) | U | ? |
| CL-06 | Per period: `Σ variances posted == Σ variances measured` | standard costing · N | Period report ties | Missing or double-posted variance | One work order (V6) | U | ? |
| CL-07 | Standards frozen for the period; a new roll is prospective and revalues on-hand stock; open work orders keep the standard at release; rework off the standard routing is efficiency variance, not a new standard | standard costing · N (X measures) | Roll with open work in process: revaluation entry; open work order variance vs old standard | No revaluation; open work order re-baselined | No open work in process during the roll (V7) | U | **FAIL** |
| CL-08 | Standard cost == roll-up of current bill of material and routing at frozen rates, deterministic | standard costing · X/N | Recompute: identical | Drift or manual override silently wins | Manual override only (V6) | P (L-plan fixture uses a manual cost override) | ? |
| CL-09 | Mode X: variances measured and reported; external valuation governs; the reconciling difference is explained | standard costing; accounting integration · X | Report shows both numbers and the reason | Platform standard presented as book value | Mode N (V2) | U | **FAIL** |
| CL-10 | Cancelling a work order with material issued: lot-tracked return or cancellation variance; customer-supplied material returned to customer stock; atomic | work orders · X/N (variance N) | Cancel: return transactions or variance, no silent write-off | Silent write-off; half-compensated | No issue before cancel (V6) | U | **FAIL** |
| CL-11 | Reopening a closed work order reverses its close entries in the open period and flags it for review | work orders · N | Reopen: reversal entry, flag | Close entries edited or left | — | U | ? |
| LED-01 | The native ledger cannot be enabled until opening balances are loaded and balance, with sub-ledger openings agreeing to control accounts | native ledger · N | Enable with no or unbalanced openings: refused; lit: balanced, enabled | Enabled without openings | Already enabled on the test install (V3) | P (L-0.2) | ? |
| LED-02 | Loading opening balances twice produces one set | native ledger · N | Second load: no-op | Two sets | — | C (L-0.3) | pass |
| LED-03 | Every event with financial effect posts one balanced entry, once, in the period it occurred | native ledger · N | Each event type in §A10: one entry; duplicates counted after retry | Missing entry (G-3, G-6) or duplicate | Only happy-path events (V6, V8) | P (L-plan oracle 2) | **FAIL** |
| LED-04 | Sub-ledger == control account for receivables, payables, inventory, work in process and goods received not invoiced | native ledger · N | Each reconciliation = 0 | Non-zero | Empty sub-ledgers (V6) | P (L-12.4 goods received not invoiced and inventory) | ? |
| LED-05 | Posted entries cannot be edited or deleted; corrections are reversing entries | native ledger · N | Attempt edit: refused | Edit succeeds | — | C (L-10.5) | pass |
| LED-06 | Closed period locks posting; reopen is authorised and logged; re-close re-runs checks | native ledger · N | Post into hard-closed: refused; reopen by unauthorised role: refused | Silent reopen | Only soft close tested | P (L-12.6) | ? |
| LED-07 | A manual journal needs a preparer and a separate approver; every entry traces to one originating document or an authorised manual adjustment | native ledger · N | Same user approves own entry: refused | Self-approval | Threshold above test amount (V3) | P (L-12.3, L-12.5) | ? |
| LED-08 | Mode cut-over at a period boundary: no event posted in both books, none between them; switching mode mid-period is refused | native ledger; accounting integration · X→N | Switch at boundary; events near the boundary appear in exactly one book; mid-period switch refused | Event in both or neither | Cut-over never performed on test install | U | **FAIL** |
| LED-09 | With the native ledger off, no journal entries arise and no financial statements are presented as authoritative | native ledger **off** · X | Dark-pass counts = 0 | Entries appear | — | C (L-plan Pass D) | pass |
| EXT-01 | Each issued invoice, payment, purchase order and vendor bill ↔ exactly one external document, stable external id; retry never double-posts | accounting integration · X | Kill connection mid-sync, retry: one external document | Duplicate | No retry (V8) | U | ? |
| EXT-02 | Customer mapping deduplicated; marketplace payer is the mapped customer | accounting integration · X | Same customer created twice: one external customer | Duplicate external customer | — | U | ? |
| EXT-03 | Sync failures are surfaced and retryable, never swallowed; dependency order held (customer before invoice, item before line) | accounting integration · X | Revoke token: failure visible, retry succeeds in order | Silent failure | Connection healthy (V6) | U | **FAIL** |
| EXT-04 | Out-of-band void, delete or edit in the external system is detected, not blindly re-pushed | accounting integration · X | Void externally, touch the invoice in the platform: conflict surfaced | Re-pushed | No external edit | U | **FAIL** |
| EXT-05 | `Σ platform receivables == external receivables`, or reconciles with an explained delta | accounting integration · X | Reconciliation report ties | Unexplained drift | Fresh install (V6) | U | **FAIL** |
| EXT-06 | The connected tier's lack of inventory or purchase-order support is detected and declared at connection | accounting integration · X | Connect a lower tier: declared limitation, inventory posts by journal | Silent sync failure | Upper tier only (V6) | U | **FAIL** |
| EXT-07 | Every external invoice line maps to a known platform item; item treatment (non-inventory versus inventory) held consistent | accounting integration · X | Audit: no orphan lines | Orphans | — | U | ? |
| EXT-08 | A budgetary estimate never syncs as a binding document; the number sent is the issued number | accounting integration · X | Estimate: not synced; renumber draft then issue: external number = issued | Estimate synced as a quote; old number sent | Estimating off (V1) | U | ? |

---

## 12. Cross-cutting: numbers, records, cancellation and features (§A12, Part C Records, Ruling #3, Ruling #4, Part D Identity)

| ID | Asserts | Presumes | Proves | Falsifies | Vacuous if | Cov. | Exp. |
|---|---|---|---|---|---|---|---|
| DOC-01 | Human-readable numbers are editable until issue (sent, posted, shipped, received) and frozen after | editable document numbers · X/N | Renumber draft: allowed; after issue: refused | Post-issue renumber allowed | Setting off: numbers never editable, so nothing is tested (V1) | U | **FAIL** |
| DOC-02 | A superseded number resolves to the same document and is never reused within the document type | editable document numbers · X/N | Renumber A→B; a new document requesting A: refused; search A finds the document | A reused | No renumber (V6) | U | ? |
| REC-01 | Acceptance evidence, posted entries, issued numbers and quality records are append-only | per record type · X/N | Attempt edit or delete on each: refused, correction is a new fact | Any overwrite | Only one record type tested | P (L-10.5 entries only) | **FAIL** (evidence, see O-04) |
| CAN-01 | Cancelling a sales order with some quantity shipped short-closes the remainder only, atomically cascading hold or cancel to unstarted work-order operations; invoiced portion refused; already cancelled is a no-op | sales orders; work orders · X/N | Ship 6 of 10, cancel: order short-closed, 4 cancelled, unstarted operations held | Whole order cancelled; work orders keep running; partial cascade | Nothing shipped (V6) | U | **FAIL** (cascade) |
| CAN-02 | Purchase-order cancel guard is `matched_bill_qty > 0`, not `received_qty > 0`; partial receipt with no matched bill short-closes with goods received not invoiced untouched | purchasing · X/N (goods received not invoiced N) | Receive 5 of 10, no bill: cancel allowed, short-closed; bill matched: refused | Refused on receipt alone, or allowed with a matched bill | Nothing received (V6) | U | **FAIL** |
| CAN-03 | Every allow-with-compensation action (partial-shipment order cancel, pre-invoice shipment void, work-order cancel with issued material) is all-or-nothing | as above · X/N | Inject failure mid-compensation: no partial state | Half-compensated document | Cannot inject failure: record *not exercised* | U | ? |
| FEAT-01 | For every rule, turning its feature off yields *not exercised*; turning it off mid-life retains existing records | all · X/N | Toggle each presumed feature on a populated install: records intact, rule reported not exercised | Records lost, or rule reports pass | — (this *is* the vacuity guard) | U | ? |
| IDN-01 | Segregation of duties: releasing work without evidence, overriding price, adjusting inventory, reopening a period and posting a manual journal each need a named permission | identity · X/N | Each action by an unpermitted role: refused | Allowed | Tester runs as administrator only (V3) | P (L-plan §7 role matrix, accounting-heavy) | ? |

---

## 13. Regulated addendum (dormant until activated)

**Presumes (all rows):** quality, lot/serial traceability, and hold points / approvals all on, plus operator competence records for R-06 · X/N. Do not run these rows until the business analyst confirms activation evidence. Until then record every row as *not exercised*.

| ID | Asserts | Proves | Falsifies | Vacuous if | Cov. | Exp. |
|---|---|---|---|---|---|---|
| R-01 | Controls scope to a part, customer or contract quality flag, not shop-wide | Flagged and unflagged work orders side by side: gates fire only on flagged | Gates fire everywhere, or nowhere | No flag exists (a finding, not vacuous) | U | **FAIL** |
| R-02 | Cert-before-use: issuing to a flagged work order needs the certificate on file and incoming inspection passed | Issue without certificate: refused | Issue allowed | Unflagged work order (V6) | U | **FAIL** |
| R-03 | Disposition gate: nonconforming stock is not issuable or shippable until a disposition is recorded; scrap never re-enters good inventory | Open nonconformance: issue and ship refused on every path; scrapped quantity absent from available stock | Gate only on a work-order status; scrap returned to stock | Board-path only (V5, V9) | P (L-7.7 status gate; L-7.8 disposition recorded once) | **FAIL** (issue and ship paths) |
| R-04 | Cal-gate: acceptance inspection references a gauge in calibration at measurement time; out-of-calibration triggers review of accepted product | Out-of-calibration gauge: acceptance refused; retroactive expiry lists affected lots | Accepted | No gauge records (V1) | U | **FAIL** |
| R-05 | No-orphan genealogy: shipment with an incomplete chain cannot post | Break a link: shipment refused | Ships | Complete chain only (V3) | U | **FAIL** |
| R-06 | A special-process operation is signed off only by an operator with an unexpired competence record; identity captured into genealogy | Expired competence: sign-off refused | Accepted | No special process in routing (V6) | U | **FAIL** |
| R-07 | A revision or process change re-triggers first-article inspection or production part approval, quarantines superseded-revision stock and blocks mixed revisions in a lot | New revision: prior stock quarantined; ship refused until approval | Old-revision stock ships | Single revision (V6) | U | **FAIL** |
| R-08 | Aerospace: no production shipment without an approved first-article report for the current revision; special-process purchase orders only to approved sources with returned certificate | Each refused when absent | Allowed | Non-aerospace flag (V1) | U | **FAIL** |
| R-09 | Automotive: production part approval at the required submission level before production shipment | Refused without approval | Ships | Non-automotive flag (V1) | U | ? |
| R-10 | Medical: lot release needs a complete device history record and all e-signatures | Refused when incomplete | Released | Non-medical flag (V1) | U | ? |
| R-11 | **Every gate above blocks. A gate that is recorded but not enforced fails.** | Each R-row's refusal observed | Record exists, work advances | V9 | U | **FAIL** |

---

## 14. What I need to firm up the ratings

1. **From the manual library owner:** for each entry ID, one of *case exists (ID)*, *partial* or *none*. Also confirm whether the L-plan belongs to the library, given their vocabularies differ.
2. **From the business analyst:** where the install marks *release* (needed before REL-03 and OP-01 can run at all), and which statuses the default work-order type marks mandatory or irreversible.
3. **From whoever controls test installs:** one Mode X install connected to a lower external-accounting tier (EXT-06), one install with consignment and customer-supplied material turned on, and one custom work-order type with renamed statuses (the V4 guard).
