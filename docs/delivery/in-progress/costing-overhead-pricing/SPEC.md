---
type: delivery
status: in-progress
---

# Forge Costing, Overhead Absorption, and Pricing Guidance

Implementation specification. Apache 2.0 core. Written for a shop that owns presses, mills, and a building, and wants the ERP to tell it the truth about what things cost and when to raise a price.

---

## 0. Scope and principles

**In scope**

1. Standard cost model with explicit cost elements, cost centers, overhead pools, drivers, and frozen rates.
2. Cost roll (BOM + routing) producing this-level and rolled-up standards.
3. WIP absorption at standard during production, variance capture at period close.
4. Bank feed ingestion → classification → overhead pool population → summary journal entries to QuickBooks Online (QBO).
5. Analytics: rate drift, absorption forecast, material price trend, margin erosion.
6. Pricing guidance: cost-to-make vs cost-to-sell, target margin, reprice triggers and prompts.

**Out of scope**

- Full general ledger inside Forge. QBO (or whatever GL the shop runs) remains the book of record for financial statements. Forge is the book of record for manufacturing cost, inventory valuation detail, and variances. Forge posts summary journals outward.
- Payroll. Forge consumes labor hours and a loaded labor rate; it does not compute paychecks.

**Principles**

- Overhead lives on work centers and cost centers. Never on a BOM line.
- Every number the shop owner sees must be traceable to a rate, a driver quantity, and a transaction. No black boxes.
- Standards are frozen for a costing period. Actuals accumulate. Variance is the difference. Re-freezing mid-period destroys the comparison, so it requires an explicit, logged action.
- Product cost (inventoriable) and period cost (SG&A, financing) are never mixed. Two numbers: cost-to-make and cost-to-sell.
- Bank transactions are evidence, not truth. Classification is suggested by rules and models, confirmed by a person until the rule earns auto-post status.
- Everything described here is data, not a spreadsheet the owner maintains on the side.

---

## 1. Domain model

### 1.1 Cost elements

Fixed enumeration. Every cost that enters inventory is one of these.

| Code | Element | Source |
|---|---|---|
| MAT | Direct material | BOM component standard × qty per × (1 + scrap) |
| MOH | Material overhead (burden) | % of MAT or $/unit at item level |
| LAB | Direct labor | Routing op labor time × work center labor rate |
| LOH | Labor overhead | Applied on LAB hours or LAB dollars |
| MCH | Machine | Routing op machine time × work center machine rate |
| MOHV | Machine overhead, variable | Per machine hour, from cost center variable pool |
| MOHF | Machine overhead, fixed | Per machine hour, from cost center fixed pool |
| SUB | Subcontract / outside processing | PO standard per routing op |

Setup is not a separate element. Setup time on an op is amortized across the item's standard lot size and flows into LAB / MCH / MOHV / MOHF on a per-unit basis.

### 1.2 Core entities

```
cost_center
  id, code, name, parent_id (nullable), type {production, support, sga, warehouse}
  sqft, headcount, is_inventoriable (bool)

overhead_pool
  id, cost_center_id, code, name
  behavior {fixed, variable, semi}        -- semi splits via fixed_portion
  fixed_portion (decimal, nullable)
  driver {machine_hour, labor_hour, labor_dollar, material_dollar, unit, receipt_count}

overhead_budget
  id, overhead_pool_id, costing_period_id
  budget_amount, budget_driver_qty
  derived_rate = budget_amount / budget_driver_qty

work_center
  id, cost_center_id, code, name
  capacity_hours_per_period, machines (int)

work_center_rate                           -- frozen per period
  id, work_center_id, costing_period_id
  labor_rate, labor_oh_rate, machine_rate, machine_oh_var_rate, machine_oh_fixed_rate
  source_pool_ids (jsonb)                  -- which pools produced each rate, for traceability
  frozen_at, frozen_by

costing_period
  id, start_date, end_date, status {open, frozen, closed}
  frozen_at, closed_at

item_cost                                  -- frozen standard
  id, item_id, costing_period_id
  this_level jsonb {MAT, MOH, LAB, LOH, MCH, MOHV, MOHF, SUB}
  rolled_up jsonb {same keys}
  total_standard
  standard_lot_size
  cost_to_sell                             -- see §6
  rolled_at, roll_version

item_burden                                -- flat burden at item level, for routing-less shops
  item_id, costing_period_id, element {MOH, MOHF}, basis {pct_of_mat, per_unit}, value

bom_line
  ... existing ...
  component_type {stocked, phantom, expensed}
  scrap_pct

routing_op
  ... existing ...
  work_center_id, setup_hours, run_hours_per_unit (or units_per_hour)
  labor_crew (decimal, e.g. 0.5 operator per machine), subcontract_std_cost

allocation_rule                            -- stage 1: shared cost → cost centers
  id, source_account_pattern, basis {sqft, headcount, metered, direct, fixed_split}
  split jsonb (cost_center_id → share)
```

### 1.3 Transaction and variance entities

```
wip_transaction
  id, work_order_id, op_id, element, qty_driver, rate, amount_std, amount_actual, posted_at

variance
  id, costing_period_id, cost_center_id (nullable), work_order_id (nullable)
  type {ppv, material_usage, labor_rate, labor_efficiency, oh_spending, oh_volume, oh_efficiency, sub_price}
  amount, driver_budget_qty, driver_actual_qty, rate_std, rate_actual
  explanation (text, generated)

overhead_actual
  id, overhead_pool_id, costing_period_id, amount, source {bank, ap_invoice, payroll, depreciation_schedule, manual}
  source_ref_id
```

---

## 2. Standard setup procedure (what the shop does once per period)

### 2.1 Define cost centers

Minimum viable for a molding shop:

- MOLD (production, inventoriable)
- TOOLROOM (support, inventoriable — allocated into MOLD)
- WHSE (warehouse, inventoriable — becomes material burden)
- OFFICE (sga, not inventoriable)

Machining shop: MILL, LATHE, DEBURR/FINISH, INSPECT (production); MAINT (support); WHSE; OFFICE.

Rule: a cost center should exist when its hourly cost differs meaningfully from its neighbors or its driver is different. A 500-ton press and a 50-ton press belong in different work centers; they can share a cost center (MOLD) if the pool is split by machine class. If the building's electricity is sub-metered by press class, split the cost center.

### 2.2 Classify every GL account

Walk the chart of accounts. For each expense account, record:

1. **Inventoriable?** Yes → product cost. No → period cost (SG&A, financing).
2. **Cost center(s)** and **allocation basis** (stage 1).
3. **Pool** and **behavior** (fixed / variable / semi).

Reference classification (the shop edits, this is the default seed):

| Account | Inventoriable | Allocation | Pool behavior | Driver |
|---|---|---|---|---|
| Electricity – production metered | Yes | metered → cost center | variable | machine_hour |
| Electricity – general | Yes (floor share), No (office share) | sqft | fixed | machine_hour |
| Natural gas / heating | split by sqft | sqft | fixed | machine_hour |
| Water / sewer | split by sqft | sqft | fixed | machine_hour |
| Tower / chiller water | Yes | direct → MOLD | semi | machine_hour |
| Building depreciation | split by sqft | sqft | fixed | machine_hour |
| Property tax | split by sqft | sqft | fixed | machine_hour |
| Property insurance | split by sqft | sqft | fixed | machine_hour |
| Rent (if renting) | split by sqft | sqft | fixed | machine_hour |
| Mortgage interest | **No** — financing, period cost | — | — | — |
| Mortgage principal | **Not an expense** — balance sheet | — | — | — |
| Machine depreciation | Yes | direct → work center | fixed | machine_hour |
| Machine maintenance / repair | Yes | direct → work center | variable | machine_hour |
| Tooling / mold maintenance | Yes | direct → TOOLROOM | variable | machine_hour of consuming WC |
| Shop supplies / consumables | Yes | direct → cost center | variable | machine_hour or labor_hour |
| Indirect labor (supervisor, material handler) | Yes | headcount or direct | fixed | labor_hour |
| Payroll taxes / benefits on direct labor | Yes | into LAB loaded rate | — | — |
| Warehouse labor, receiving, inspection | Yes | direct → WHSE | fixed | material_dollar |
| Freight-in | Yes | direct → WHSE | variable | material_dollar |
| Owner salary | Split by time study; default No | — | — | — |
| Office salaries, sales, commissions | No | — | — | — |
| Engineering (non-job) | No | — | — | — |
| Software, phone, internet | split by headcount | headcount | fixed | labor_hour |
| Interest, bank fees | No | — | — | — |

### 2.3 Budget the pools

For each pool in the coming period, enter `budget_amount` and `budget_driver_qty`. Forge pre-fills both from the prior period's actuals with the forecast adjustment from §5. The owner confirms or overrides.

`budget_driver_qty` for machine_hour pools = sum of work center planned hours (capacity × expected utilization). Forge proposes from the open order book + historical utilization. Overstating this number is the most common way a shop under-recovers overhead, so the UI shows last four periods' actual hours beside the proposal.

### 2.4 Freeze

`POST /costing-periods/{id}/freeze`

1. Run stage-1 allocation: each shared account's budget → cost centers by basis.
2. Sum into pools. Derive `rate = budget_amount / budget_driver_qty` per pool.
3. Compose work_center_rate rows from the pools that feed each work center.
4. Run cost roll (§3) for every manufactured item.
5. Write item_cost rows. Set period status = frozen. Log who and when.

Freeze is idempotent within a period only by explicit "re-freeze" with a reason string; the previous roll is retained as a version.

---

## 3. Cost roll

### 3.1 Algorithm

Low-level-code ordering (leaf items first). For each manufactured item:

```
this_level.MAT  = 0
this_level.SUB  = 0
for line in bom (component_type != phantom):
    comp_std = item_cost[line.item].total_standard      -- purchased: last std; manufactured: rolled
    qty = line.qty_per * (1 + line.scrap_pct)
    if line.component_type == expensed:
        this_level.MOH += comp_std * qty               -- rolls in, no inventory movement
    else:
        lower_level += item_cost[line.item].rolled_up   -- element by element
        this_level.MAT += comp_std * qty  (purchased only; manufactured carries its own elements)
for line in bom (component_type == phantom):
    recurse into phantom's bom as if its lines were here

for op in routing:
    wc = work_center_rate[op.work_center]
    setup_per_unit = op.setup_hours / item.standard_lot_size
    mch_hrs = op.run_hours_per_unit + setup_per_unit
    lab_hrs = mch_hrs * op.labor_crew
    this_level.LAB  += lab_hrs * wc.labor_rate
    this_level.LOH  += lab_hrs * wc.labor_oh_rate
    this_level.MCH  += mch_hrs * wc.machine_rate
    this_level.MOHV += mch_hrs * wc.machine_oh_var_rate
    this_level.MOHF += mch_hrs * wc.machine_oh_fixed_rate
    this_level.SUB  += op.subcontract_std_cost

apply item_burden rows (MOH as pct_of_mat or per_unit; MOHF per_unit for routing-less shops)

rolled_up = this_level + lower_level (element-wise)
total_standard = sum(rolled_up)
```

### 3.2 Purchased item standards

Standard = weighted average of last N receipts (N configurable, default 3) unless overridden. Forge flags any item where the proposed standard moves more than a threshold (default 5%) from the prior period and shows the receipt history.

### 3.3 Outputs

- Indented cost roll report per item: each element, this level vs lower level, each op's contribution.
- "Where does the cost come from" view: a stacked bar per item by element. Owners understand this faster than the table.

---

## 4. Production posting and absorption

### 4.1 During the period

On work order operation completion (or labor/machine time ticket):

```
qty_driver = actual machine hours (from time ticket, or std hours × qty if backflushed)
for each element in {LAB, LOH, MCH, MOHV, MOHF}:
    wip_transaction(amount_std = std_hrs_for_qty * rate, amount_actual = actual_hrs * rate)
```

Material issue:

```
wip_transaction(MAT, amount_std = std qty × std cost, amount_actual = actual qty × std cost)
```

PPV is captured at receipt, not at issue: `(po_price − std_cost) × qty_received`.

Overhead *applied* = driver qty × rate. Posts to WIP (debit) and to a per-pool "overhead applied" contra account (credit). Actual overhead accumulates in the pool's expense accounts via §7. The two meet at close.

### 4.2 Period close

`POST /costing-periods/{id}/close`

For each pool:

```
applied     = Σ wip_transaction.amount_std for that pool's element
actual      = Σ overhead_actual for the pool
budget_rate = pool.derived_rate
actual_qty  = Σ driver qty actually consumed
budget_qty  = pool.budget_driver_qty

spending_variance = actual − (budget_rate × actual_qty)          -- rate was wrong
volume_variance   = budget_rate × (budget_qty − actual_qty)       -- (fixed pools) ran fewer/more hours than planned
efficiency_var    = budget_rate × (actual_qty − std_qty_for_output) -- took longer than standard
```

For labor: rate variance `(actual_rate − std_rate) × actual_hrs`, efficiency `(actual_hrs − std_hrs) × std_rate`.

For material: usage `(actual_qty − std_qty) × std_cost`. PPV already captured.

Each variance row gets a generated `explanation`:

> MOLD fixed pool under-absorbed $11,240: budgeted 800 press-hours, ran 620. Spending was on budget ($2 over). This is a volume problem, not a cost problem.

Close posts summary journals to QBO (§7.4) and sets the period to `closed`. Next period auto-opens with budgets pre-filled.

---

## 5. Bank feed ingestion and overhead actuals

### 5.1 Sources, in priority order

1. **QBO as the feed of record.** If the shop already has bank feeds connected in QBO, pull categorized transactions from QBO via its API (`Purchase`, `Bill`, `JournalEntry` entities, `TxnDate` in period). This avoids a second bank connection and keeps Forge from owning banking credentials. Preferred.
2. **Direct bank aggregation** (Plaid, MX, Finicity, or a bank's own OFX/CSV export) when the shop doesn't run bank feeds in QBO or wants Forge-first classification. Plaid is a paid SaaS; keep it behind an adapter interface in the private ops repo. Ship CSV/OFX import in the Apache core so nobody is forced into a vendor.
3. **AP invoices entered in Forge** for anything with a PO (maintenance vendors, resin, freight). These are already classified by PO line.
4. **Depreciation schedules** maintained in Forge (asset, basis, method, life, cost center). Generate monthly `overhead_actual` rows automatically. Depreciation never appears in the bank feed; this is the source.
5. **Payroll summary** imported per pay period (hours and loaded dollars by employee → work center or cost center). Direct labor hours go to LAB actuals; indirect to the relevant fixed pool.

### 5.2 Transaction classification pipeline

```
bank_transaction
  id, source, external_id, date, amount, payee_raw, payee_normalized, memo, account_id
  status {unclassified, suggested, confirmed, posted, ignored}
  suggested_pool_id, suggested_confidence, confirmed_pool_id
  rule_id (nullable), model_version (nullable)

classification_rule
  id, match {payee_regex, amount_range, account_id, memo_regex, day_of_month_range}
  target_pool_id (or target: sga / financing / balance_sheet / split jsonb)
  auto_post (bool), hit_count, miss_count, created_from_txn_id
```

Steps per transaction:

1. **Normalize payee.** Strip card-processor noise ("SQ *", "POS DEBIT", trailing store numbers). Keep a payee alias table the shop builds up.
2. **Rule match.** First rule wins by specificity (more match fields = more specific). If rule.auto_post and confidence ≥ threshold → status = posted.
3. **Model fallback.** If no rule, a classifier trained on the shop's own confirmed history (payee tokens, amount bucket, day-of-month, account). Start with a simple multinomial naive Bayes or logistic regression over hashed tokens; it's small data and needs to run locally. Suggest with confidence. Never auto-post from the model alone.
4. **Recurring detection.** Transactions with the same normalized payee at roughly monthly cadence and amount within ±15% get flagged `recurring`. Utilities, mortgage, insurance, lease payments all land here. Recurring + confirmed three times → propose converting to an auto-post rule.
5. **Review queue.** Unclassified and suggested-below-threshold transactions surface in a queue. Confirm, reassign, split, or ignore. Confirming writes the rule suggestion.
6. **Post.** Confirmed → write `overhead_actual` (or mark sga / financing / balance sheet). Splits (a utility bill covering the whole building) apply the stage-1 allocation rule for that account.

Mortgage handling, explicitly: a mortgage payment hits the feed as one amount. The rule targets a split: principal → balance sheet (liability reduction), interest → financing period cost. The amortization schedule lives in Forge (or is read from QBO's loan setup) so the split is computed, not guessed. Building depreciation, tax, and insurance reach the pools through sources 4 and 1, not through the mortgage transaction.

### 5.3 Reconciliation to QBO

If QBO is the feed source, Forge's classification is a refinement of QBO's categorization, not a replacement. Forge stores `qbo_account_id` on each transaction and flags disagreements (QBO says "Utilities", Forge rule says "MOLD variable pool") for review. The owner decides which system's view is right; Forge can push a re-categorization to QBO or leave QBO alone and keep the manufacturing view internal.

---

## 6. Pricing model

### 6.1 Two costs, kept apart

```
cost_to_make  = item_cost.total_standard                    -- inventoriable, GAAP
cost_to_sell  = cost_to_make × (1 + sga_load_pct) + per_order_cost_allocation
```

`sga_load_pct` = budgeted period costs (OFFICE cost center + commissions + engineering + financing if the owner wants it in pricing) ÷ budgeted cost of goods manufactured. Recomputed at each freeze. Stored on item_cost for the period.

A per-order allocation (order entry, quoting time, shipping prep) is optional and only matters for shops with many tiny orders.

### 6.2 Target margin and price floor

```
pricing_policy
  id, scope {global, customer, product_family, item}, scope_ref_id
  target_gross_margin_pct        -- on cost_to_make (GAAP gross margin)
  min_contribution_margin_pct    -- on variable cost only, the floor
  target_net_margin_pct          -- on cost_to_sell
  priority (more specific scope wins)

price_recommendation
  item_id, costing_period_id, customer_id (nullable)
  floor_price, target_price, current_price, current_margin_pct, target_margin_pct
  delta_pct, reason_codes jsonb, generated_at
```

```
variable_cost   = MAT + MOH + LAB + LOH + MCH + MOHV + SUB        -- excludes MOHF
floor_price     = variable_cost / (1 − min_contribution_margin_pct)
target_price    = cost_to_sell / (1 − target_net_margin_pct)
```

Floor exists so the shop knows when a job still covers its variable cost and contributes something to fixed overhead in a slow month. Taking work below floor loses money on every unit. Taking work between floor and target in a low-utilization period is often correct, and the tool should say so rather than only scold.

### 6.3 Quote-time guidance

At quote entry, for each line: show floor, target, current list, margin at entered price, and a one-line reason if the entered price is below target. Quantity breaks recompute setup amortization using the quoted quantity rather than the standard lot, so short runs get priced honestly.

---

## 7. QuickBooks Online integration

### 7.1 Posture

Forge owns: items, BOMs, routings, work centers, rates, WIP detail, variances, inventory quantities and valuation detail.
QBO owns: chart of accounts, bank feeds, AP/AR, payroll, financial statements.

Forge posts **summary journal entries**, not transaction-level detail. QBO's item-level inventory is not used for manufactured goods; Forge's valuation is the subledger and QBO carries Inventory as a control account.

### 7.2 Account mapping

```
gl_account_map
  forge_purpose {raw_inventory, wip, fg_inventory, cogs, oh_applied_{pool}, ppv, usage_var, labor_var, oh_spend_var, oh_vol_var, oh_eff_var, sub_var}
  qbo_account_id, qbo_account_name
```

Shop maps once. Forge validates the map at close and refuses to close with unmapped purposes.

### 7.3 Journals posted

- **Period close:** WIP → FG (standard of completed work orders); FG → COGS (standard of shipped units); variances to their accounts; overhead applied contra vs actual (the net is the spending + volume variance already posted; this entry clears the applied account).
- **Optional monthly:** inventory valuation true-up if QBO's control account drifts from Forge's subledger.
- Depreciation journals if the shop lets Forge run the schedule (otherwise read from QBO).

Each journal carries a `PrivateNote` with the Forge period and a link back. Idempotent by (period, journal type): re-posting updates the existing JE rather than duplicating.

### 7.4 API specifics

- OAuth 2.0; store refresh tokens encrypted at rest in the ops layer, not the open core.
- Entities: `Account`, `JournalEntry`, `Purchase`, `Bill`, `Vendor`, `Item` (read only for purchased-item cost history if the shop buys through QBO).
- Rate limits are per-realm; batch reads by date range and page.
- Sandbox realm for tests. Keep the fixture company (Cascade Components) as the sandbox seed so the existing test suite can exercise the integration.
- Adapter interface so Xero / Sage / CSV-GL are possible later without touching the core.

---

## 8. Predictive analytics

All of this runs on the shop's own data. No external training. Keep models small, explainable, and re-fit each period.

### 8.1 Overhead rate drift

For each pool: rolling 6-period actual rate (`actual / actual_driver_qty`). Fit a simple trend (linear, or Holt's if there's seasonality in utility bills). Compare next-period forecast rate to the frozen rate.

Prompt when forecast exceeds frozen rate by more than threshold (default 5%) for two consecutive periods:

> MOLD variable pool actual rate has run $14.20/hr vs $13.10 standard for the last two periods. Electricity up 9%, maintenance up 14%. Standard will under-recover about $3,100 next period at planned hours. Re-freeze now or carry the variance?

### 8.2 Absorption forecast

Mid-period, project driver hours from: scheduled work orders remaining + historical completion rate + open quotes weighted by win probability (use the shop's quote→order history, else a flat default). Compare to `budget_driver_qty`. Forecast volume variance. Surface at mid-period and at 75%.

> Press hours tracking 540 of 800 budgeted. Projected under-absorption $9,800 in MOLD fixed. Two open quotes (#4412, #4418) would cover 140 hours. Both are priced above floor.

### 8.3 Material price trend

Per purchased item: receipt price series. Flag when the last-3 weighted average exceeds standard by threshold, and when the slope over the last N receipts is positive beyond noise. Resin, aluminum, steel bar are the obvious targets; the same logic runs for everything.

Propagate: a material standard change affects every parent item via the roll. Show the top 10 affected finished goods by margin impact.

### 8.4 Margin erosion by item and customer

Each period, recompute actual margin per shipped item (price − cost_to_sell at that period's standard, and separately at actual cost where available). Track the series. Prompt when:

- margin falls below target for 2 consecutive periods, or
- margin drops more than X points period-over-period, or
- a customer's blended margin falls below the customer policy.

### 8.5 Price elasticity, lightly

Don't overbuild this. Record quote outcomes (won/lost, price, quantity, competitor price if the salesperson captured it). Report win rate by margin band per product family. That's enough for an owner to see "we win 80% of quotes at 35% margin and 70% at 42%; why are we quoting at 35%?"

---

## 9. Prompts and recommendations

### 9.1 Prompt engine

```
prompt
  id, type, severity {info, advise, act}, subject_type, subject_id
  title, body, evidence jsonb, suggested_action jsonb
  created_at, snoozed_until, dismissed_at, acted_at, outcome
```

Types and triggers:

| Type | Trigger | Suggested action |
|---|---|---|
| reprice_item | margin below target 2 periods; or standard rose ≥ threshold since last price change | New target price, delta, affected open orders |
| reprice_customer | customer blended margin below policy | List of items to reprice |
| refreeze_rate | pool rate drift ≥ threshold 2 periods | Proposed new rate, impact on item standards |
| under_absorption | forecast volume variance ≥ threshold | Open quotes that would close the gap |
| material_spike | purchased item price up ≥ threshold | Affected FG list, reprice candidates |
| reclassify_txn | model/rule disagreement with QBO | One-click accept either |
| rule_promotion | recurring txn confirmed 3× | Convert to auto-post rule |
| quote_below_floor | quote line below floor | Show floor and variable cost breakdown |
| utilization_low | hours tracking < 70% of budget at mid-period | — (information; pricing floor guidance applies) |

Rate-limit prompts. One digest per week by default, `act` severity immediately. A shop that gets twenty prompts a day will ignore all of them.

### 9.2 Evidence, always

Every prompt carries the rows that produced it: the variance, the receipt series, the margin series. The body is generated from a template, not free-form, so it reads the same way every time and the owner learns to trust it.

### 9.3 Outcome tracking

When a prompt is acted on, record what changed (new price, new rate). Next period, compare the predicted effect to the realized effect. Show the hit rate. This is what makes the recommendations credible over time, and what tells you when a threshold is miscalibrated.

---

## 10. Build order

1. Cost centers, pools, budgets, work center rates, costing periods, freeze. No analytics yet. (Foundation; nothing else works without it.)
2. Cost roll with component types and setup amortization. Cost roll report.
3. WIP posting at standard, PPV at receipt, period close with variance computation and generated explanations.
4. Depreciation schedules and payroll summary import (these populate pools without a bank feed).
5. QBO adapter: account map, summary journals at close, read transactions.
6. Bank transaction classification: normalization, rules, review queue, recurring detection. Model fallback after there's history to train on.
7. Pricing policy, cost_to_sell, floor/target, quote-time guidance.
8. Analytics: rate drift, absorption forecast, material trend, margin erosion.
9. Prompt engine with digest and outcome tracking.
10. Second GL adapter (CSV at minimum) to prove the interface.

Steps 1–3 are a working standard costing system. A shop can run on that for years. Everything after is leverage.

---

## 11. Test fixtures (extend Cascade Components)

- Two work centers with different machine rates (50-ton, 500-ton) sharing one cost center.
- A phantom subassembly and an expensed component (packaging) on the same BOM.
- One routing with subcontract op.
- Period budget with 800 hours; actuals with 620 hours and electricity 9% over. Expected: spending variance small, volume variance ≈ fixed_rate × 180.
- Bank feed CSV with: a mortgage payment (split), a utility bill (sqft allocation), a maintenance vendor (direct to work center), a payroll draw (ignored — handled by payroll import), a restaurant charge (SGA), and a duplicate.
- Material price series on resin rising 12% over 4 receipts. Expected prompt: material_spike with top affected FGs.
- An item priced at 30% margin against a 40% policy for 2 periods. Expected prompt: reprice_item with target price.

Case IDs follow the existing PHASE-AREA-NNN scheme; suggested AREA codes: COST, ABSB, VARI, BANK, QBO, PRIC, ANLY, PRMT.

---

## 12. Things not to do

- Don't put overhead on BOM lines. Item-level burden exists for routing-less shops; that's the escape hatch.
- Don't let the model auto-post bank transactions. Rules earn auto-post; models only suggest.
- Don't include mortgage interest in inventory cost. It's financing. Owners who want it in their pricing put it in `sga_load_pct`.
- Don't recompute standards silently. Every rate change is a logged freeze or re-freeze with a reason.
- Don't build a general ledger. Post summaries to the one the shop already has.
- Don't send twenty prompts a day.
