# Bought Parts: Landed Cost, Freight, Pricing Discipline & Working Calendar

> Design memo. Not yet implemented. Captures decisions from the 2026‑05‑06 design conversation so the
> resulting PR series can reference one source of truth.

## Goals

1. Compute and display a **true landed cost** per part — base unit price + freight + tariff/duty +
   currency conversion + handling + (eventually) quality cost. The cost tab on a part becomes the
   place an advanced user can answer "why is this part priced this way?"
2. Capture **freight at both PO time (estimate) and receiving time (actual)**, with a per-receiving
   allocation across mixed‑line shipments.
3. Replace the US‑only FOB shorthand with the full **Incoterms 2020** set, defaulted to FOB‑Origin
   for the common US‑domestic case.
4. Surface a **price‑tier discrepancy prompt** at both PO entry AND invoice receiving, with sensible
   thresholds so normal rounding noise doesn't pester the buyer.
5. Introduce a **WorkingCalendar** abstraction (with per‑location override) so every `*Days` field
   has a consistent, configurable definition of business‑days vs calendar‑days. Layer a `Shift`
   model on top to feed scheduling, hours of operation, and payroll premium calculations.

## Non-goals (deliberate scope cuts)

- **Full general ledger.** Landed cost is a unit‑cost discipline, not double‑entry bookkeeping.
  Per the existing accounting boundary (`CAP-ACCT-EXTERNAL ⊥ CAP-ACCT-BUILTIN`), GL posting is out
  of scope here.
- **Carrier API integration.** The mock + manual flow stays. The schema accommodates a future
  carrier integration but no UPS/FedEx/USPS code in this effort.
- **Multi‑currency P&L re‑translation.** We snapshot a single FX rate per PO; we do NOT re‑value
  the full ledger at month‑end. That's an accounting‑provider responsibility.
- **Multi‑level approval workflows on price exceptions.** A flag + audit‑log entry; not a routing
  workflow with sign‑offs.

---

## Landed cost composition

Landed unit cost = sum of these components, all expressed in the tenant's functional currency
(default: USD):

| Component             | Source                                                              |
|-----------------------|---------------------------------------------------------------------|
| `BaseUnitPrice`       | `VendorPart.PriceTiers` (effective tier at the receipt's qty)       |
| `AllocatedFreight`    | `ReceivingRecord.ActualFreight` (or PO's `EstimatedFreight` pre‑receipt) allocated to this line |
| `AllocatedDuty`       | HTS‑code → tariff % × line value (see "Tariff model")               |
| `CurrencyConversion`  | Implicit if vendor quotes in non‑functional currency; uses snapshot FX rate from PO |
| `HandlingFee`         | Optional vendor‑level surcharge (admin‑configurable; uncommon)      |
| `QualityCost`         | Phase 2: rejection rate × rework cost. Skipped in v1.               |

The cost tab renders this as a vertical stack with each line itemized + a total. When a component
has no data ("vendor doesn't report freight" vs "no PO history"), the row reads `—` not `$0` so the
distinction is preserved.

### Door‑to‑door price (display)

The "door to door" number the user looks at first is `landedUnitCost` averaged over the most recent
N receipts (default 3, configurable). Above it: the variance vs the most recent quoted unit price
+ vs the historical 12‑month average. Below it: an expandable breakdown of every receipt
contributing to the average.

This is also where the buyer answers "should I switch vendors?" — a small comparison tile shows the
landed cost per active `VendorPart` for the same part, sorted ascending.

---

## Freight model

### Two‑phase capture

| Field                              | Lives on          | Set when            | Used for                      |
|------------------------------------|-------------------|---------------------|-------------------------------|
| `PurchaseOrder.EstimatedFreight`   | PO header         | PO creation         | PO total, cash‑flow forecast  |
| `ReceivingRecord.ActualFreight`    | Receiving record  | Receipt entry       | Landed cost going forward     |
| `ReceivingRecord.FreightAllocationMethod` | Receiving record | Receipt entry  | How `ActualFreight` splits across lines |
| `ReceivingLine.AllocatedFreight`   | Receiving line    | Computed at receipt | Landed cost per line          |

Default UX: when receiving, `ActualFreight` defaults to the PO's `EstimatedFreight` so the
"matches estimate" case is one click. When the user overrides it and the variance exceeds the
threshold (default 10%, admin‑configurable), receiving screen shows: *"Estimated $X / Actual $Y —
variance $Z (delta %)."* Doesn't block; informs.

### Allocation methods

`FreightAllocationMethod` enum: `ByExtendedValue` (default), `ByWeight`, `ByQuantity`, `Manual`.

- **ByExtendedValue** — `lineValue / totalReceiptValue × actualFreight`. Sensible default; works
  without weight data.
- **ByWeight** — requires per‑part weight. Better when freight is volumetric/weight‑driven (steel,
  bulky components).
- **ByQuantity** — requires consistent unit sizes. Edge case; useful when you only have one part
  on the receipt anyway.
- **Manual** — user enters per‑line freight. Used for unusual shipments.

Default per vendor is configurable on `Vendor.DefaultFreightAllocationMethod`; tenant default is
`ByExtendedValue`. User can override at receipt time.

### Freight included in price

`VendorPartPriceTier.FreightIncluded: bool` (default `false`). When `true`, the cost calc skips
the freight component for that line — the base price is already door‑to‑door from this vendor.
Cost tab renders freight as `—` (not `$0`) so the distinction is visible. We put it on the tier
(not the VendorPart) so a vendor can have free shipping above qty N but not below.

### Freight invoiced separately by carrier

If the parts vendor ships freight‑collect (we pay the carrier directly), the freight invoice is a
separate AP entry tied to a different vendor. Need a way to link the carrier invoice to the
receiving record so the `ActualFreight` can be reconciled.

Proposal: receiving record has an optional `CarrierInvoiceId` FK. When the freight invoice arrives,
AP entry has a "link to receipt" affordance. If the linked carrier invoice's freight differs from
the receipt's `ActualFreight`, surface as a variance. Defer the workflow detail to phase 2.

---

## Incoterms (replacing FOB shorthand)

`Incoterm` enum (or reference‑data list under group `vendor.incoterm` so admins can extend):

```
EXW   Ex Works
FCA   Free Carrier
FAS   Free Alongside Ship
FOB   Free on Board (alias: FOB-Origin)
CFR   Cost and Freight
CIF   Cost, Insurance and Freight
CPT   Carriage Paid To
CIP   Carriage and Insurance Paid To
DAP   Delivered at Place
DPU   Delivered at Place Unloaded
DDP   Delivered Duty Paid
```

Stored on `VendorPart.Incoterm` (default for this part from this vendor). Overridable per
`PurchaseOrder.Incoterm`. The selected Incoterm drives several derived behaviors:

| Incoterm group                | Default `FreightIncluded` | Default `DutyIncluded` |
|-------------------------------|---------------------------|------------------------|
| EXW, FCA, FAS, FOB            | false (buyer pays)        | false                  |
| CFR, CIF, CPT, CIP, DAP, DPU  | true (seller pays freight)| false                  |
| DDP                           | true                      | true                   |

These are *defaults*, not invariants — the user can override per PO if a vendor has a non‑standard
arrangement. The Incoterm just pre‑fills the booleans correctly so the buyer doesn't have to think
about it for the common case.

US‑domestic defaults: new VendorParts default to `FOB-Origin` (the most common arrangement).

---

## Off‑tier price prompt

Triggered at two moments. Both use the same prompt component but the variance reference is
different.

### At PO line entry

User enters a unit price that doesn't match the current effective tier for that qty. Variance check:

```
abs(enteredPrice - tierPrice) / tierPrice > variancePctThreshold (default 5%)
```

If under threshold: silent accept (assume normal rounding/discount noise).

If over threshold: prompt with three options:
1. **One‑off exception** (default). Records the price on the PO line; doesn't change `VendorPart`
   tiers. Audit‑log entry: "off‑tier price accepted as exception."
2. **Update vendor's tiers.** Inserts a new tier with `MinQuantity` defaulting to the PO line qty
   (editable in‑prompt) and `UnitPrice` = entered price. The tier inherits the existing
   `EffectiveFrom = today`.
3. **Cancel & re‑enter.** Returns user to the price field.

User confirmation gating: the default is "exception" — users explicitly opt in to changing the
master price. Reduces accidental tier pollution.

### At invoice receipt (3‑way match)

Vendor's invoice arrives. AP enters invoice line price. Two layers of comparison:

1. **Invoice price vs PO line price** — variance > threshold ⇒ AP discrepancy prompt:
   - Accept (write off the variance to a configured account)
   - Investigate (mark for review, no posting)
   - Reject (return invoice to vendor)
   This is the AP 3‑way‑match path. Does NOT touch `VendorPart` tiers.

2. **Invoice price vs current effective tier** — only fires if (1) was reconciled OR invoice = PO.
   Same prompt as the PO‑entry case (one‑off exception / update tiers / cancel).

The two paths cascade: discrepancy first, then tier‑update second. Keeps AP's "did the vendor
overcharge us?" workflow distinct from purchasing's "should our master pricing change?" workflow.

### Bundling

If a single PO has 10 lines all off‑tier on the same vendor, the prompt fires *once* for the PO
with a summary table; the user can accept/exception all or override per line. Avoids prompt spam.

### Threshold configuration

`SystemSetting`: `purchasing.offTierVariancePct` (default 5). Override per vendor via
`Vendor.OffTierVariancePct` (nullable; falls back to system default). Lets quirky vendors get a
wider tolerance without lowering the bar across the catalog.

---

## Currency model

`VendorPart.Currency` already exists. Extending:

| Field                                | Lives on        | Notes                                            |
|--------------------------------------|-----------------|--------------------------------------------------|
| `PurchaseOrder.QuoteCurrency`        | PO header       | Defaults from preferred VendorPart's currency    |
| `PurchaseOrder.FxRate`               | PO header       | Snapshot at PO confirmation; quote → functional  |
| `PurchaseOrder.FxRateSource`         | PO header       | Free text or reference (e.g., "ECB 2026‑05‑06")   |
| `Invoice.FxRateAtPayment`            | Invoice         | Optional re‑capture if invoice differs > 1%      |

Snapshot rule: FX rate locks at **PO confirmation** (transition from Draft → Confirmed). Pre‑lock
PO total is informational only. After lock, the locked rate is what the cost tab + landed cost
calc uses, regardless of subsequent rate movement.

If the invoice's effective FX rate (from payment) differs from the locked PO rate by > 1%, AP can
record `Invoice.FxRateAtPayment`. Variance shows on the part's cost tab as a separate component
("FX gain/loss vs PO snapshot"). Doesn't change historical landed cost — landed cost was
calculated against the locked rate at receipt time.

This is intentionally **not** a full multi‑currency ledger. We're tracking enough to make landed
cost honest; we're NOT trying to do hedge accounting.

---

## Tariff / duty model

Tariffs live at the HTS code level. `VendorPart.HtsCode` already exists.

New entity `TariffRate`:
```
- HtsCode        string (PK part)
- CountryOfOrigin string (PK part) — same HTS but different country = different rate
- RatePct        decimal
- EffectiveFrom  date
- EffectiveTo    date?
- Source         string  — "USITC manual import 2026‑05‑01" / API source ref
```

SCD Type 2 — when tariffs change, supersede existing rows by setting `EffectiveTo`.

Resolution at landed‑cost calc time:
```
SELECT RatePct
FROM TariffRate
WHERE HtsCode = vp.HtsCode
  AND CountryOfOrigin = vp.CountryOfOrigin
  AND EffectiveFrom <= receiptDate
  AND (EffectiveTo IS NULL OR EffectiveTo >= receiptDate)
```

If no matching tariff rate, render `—` on the cost tab (not $0) — distinguishes "no tariff
applies" from "we don't have data for this HTS."

Admin loads tariff data manually (CSV import) for v1. Future: integration with USITC HTS lookup
API (out of scope for this design memo).

---

## WorkingCalendar

### Schema

`WorkingCalendar` entity:
```
- Id
- Name             "US Default", "Mexico Plant", etc.
- TimeZone         IANA tz (e.g., "America/Denver")
- WorkingDaysMask  bitmask: Mon=1, Tue=2, ..., Sat=32, Sun=64
- HalfDays         JSONB list of { date, hoursWorked }
```

`Holiday` (child of `WorkingCalendar`):
```
- Id
- WorkingCalendarId
- Date
- Name             "Independence Day"
- ObservedDate?    if holiday falls on weekend, observed date may differ
- IsRecurring      bool — auto‑rolls to same MM/DD each year
```

`Tenant.DefaultWorkingCalendarId` — every install has a default.

`CompanyLocation.WorkingCalendarId?` — optional override. Resolution:
```
ResolveCalendar(locationId) = location.WorkingCalendarId ?? tenant.DefaultWorkingCalendarId
```

### Helper service

`IWorkingCalendarService`:
```csharp
DateTime AddBusinessDays(DateTime start, int n, int calendarId);
DateTime AddCalendarDays(DateTime start, int n);              // trivial; included for symmetry
int BusinessDaysBetween(DateTime start, DateTime end, int calendarId);
bool IsWorkingDay(DateTime date, int calendarId);
DateTime NextWorkingDay(DateTime date, int calendarId);
```

### Field‑level type discipline

Per pushback in the design conversation: each `*Days` field is fixed at the schema level as either
**business** or **calendar**, not user‑selectable. Examples:

| Field                              | Type     |
|------------------------------------|----------|
| `VendorPart.LeadTimeDays`          | business |
| `VendorPartPriceTier.EffectiveFrom`| calendar (it's a date, not a duration) |
| `MaintenanceSchedule.IntervalDays` | calendar (per industry convention) |
| `JobPromiseDate.LeadDays`          | business |
| `Customer.PaymentTerms.NetDays`    | calendar (Net 30 = 30 calendar days) |
| `SLA.ResponseDays`                 | business |

Whoever adds a new `*Days` field decides the type at schema time and documents it. The helper
service is called accordingly. No per‑record toggle.

---

## Shifts

Layered on top of `WorkingCalendar`. Three audiences, one model.

```
Shift:
- Id
- WorkingCalendarId
- Name             "First Shift", "Second Shift", "Saturday OT"
- DaysOfWeekMask   bitmask
- StartTime        time-only
- EndTime          time-only (next-day allowed for graveyard shifts)
- PremiumMultiplier  decimal (1.0 standard, 1.5 OT, 2.0 holiday)
- CapacityHours    decimal — for capacity planning
```

### Consumers

| Consumer            | What it uses                                            |
|---------------------|---------------------------------------------------------|
| Scheduling          | shift × resource = available capacity per work center   |
| Hours of operation  | union of shift windows = "we're open" calendar          |
| Payroll/accounting  | clock event ∈ shift → premium multiplier applied        |
| MRP                 | shift capacity feeds finite‑capacity dispatch           |
| SLA timers          | "respond within 4 business hours" honors shift windows  |

### Phasing (within the Shifts slice)

Shipping all three audiences at once is a 3‑month effort. Phased so each slice is independently
landable and useful.

---

## Vendor minimum order value

Per design call: minimum order is a **dollar value on `Vendor`**, not a unit count on `VendorPart`.
Different parts have wildly different unit sizes (8mm screws vs 220mm bolts), so a count threshold
is meaningless across a multi‑part order from the same vendor.

```
Vendor.MinimumOrderValue: decimal?
Vendor.MinimumOrderValueCurrency: string  — defaults to vendor.Currency
```

Used at PO creation: if the PO total (in vendor currency) is below the threshold, surface a
non‑blocking warning: *"Vendor X requires $500 minimum order; PO total is $340. Consider adding
items or splitting differently."* Doesn't block submission — buyer may have a reason.

MRP/auto‑PO suggestion uses the threshold as a consolidation hint: prefers grouping demand from
the same vendor to clear the threshold rather than splitting across vendors.

---

## UI surfaces affected

| Surface                                  | What changes                                                  |
|------------------------------------------|---------------------------------------------------------------|
| Part detail → Cost tab                   | Full landed‑cost breakdown stack; comparison across vendors   |
| Part detail → Sources tab                | `Incoterm` field per VendorPart; `FreightIncluded` per tier   |
| Vendor detail → Settings                 | `MinimumOrderValue`, `DefaultFreightAllocationMethod`         |
| PO header                                | `Incoterm`, `EstimatedFreight`, `QuoteCurrency`, `FxRate`     |
| PO line entry                            | Off‑tier price prompt (cascade)                                |
| Receiving record                         | `ActualFreight`, allocation method picker, variance flag       |
| Receiving line                           | Read‑only `AllocatedFreight` per line                         |
| Invoice receipt (AP)                     | Off‑tier price prompt cascade (discrepancy → tier‑update)     |
| Admin → Working Calendars                | New screen: calendars, holidays, half‑days, location override |
| Admin → Shifts                           | New screen: shift definitions per calendar                    |
| Admin → Tariff Rates                     | New screen: HTS+country tariff CSV import + manual edit       |
| Admin → Settings                         | `purchasing.offTierVariancePct` system setting                |

---

## Phasing & PR plan

Six landable PRs, in suggested order. Each is independently reviewable; later PRs depend on earlier
schema but not on later UI.

### PR 1 — WorkingCalendar foundation
- New entities: `WorkingCalendar`, `Holiday`
- `Tenant.DefaultWorkingCalendarId`, `CompanyLocation.WorkingCalendarId`
- `IWorkingCalendarService` + `business-days` / `calendar-days` helpers
- Wire into existing `LeadTimeDays` consumers (vendor lead time → PO promise date, MRP)
- Admin → Working Calendars screen
- **No shift model yet.** Calendar only.

### PR 2 — Incoterms + freight v1 (estimate)
- `Incoterm` enum + `VendorPart.Incoterm`, `PurchaseOrder.Incoterm`
- `PurchaseOrder.EstimatedFreight`, `PurchaseOrder.QuoteCurrency`, `PurchaseOrder.FxRate`,
  `PurchaseOrder.FxRateSource`
- `VendorPartPriceTier.FreightIncluded`
- `Vendor.MinimumOrderValue` + non‑blocking warning on PO under threshold
- PO header UI updates
- **No actual freight / receiving allocation yet.**

### PR 3 — Receiving freight + allocation
- `ReceivingRecord.ActualFreight`, `ReceivingRecord.FreightAllocationMethod`
- `ReceivingLine.AllocatedFreight` (computed at receipt)
- Allocation strategies: `ByExtendedValue`, `ByWeight`, `ByQuantity`, `Manual`
- `Vendor.DefaultFreightAllocationMethod`
- Variance flag on receiving when actual ≠ estimate by > threshold
- Receiving UI updates

### PR 4 — Tariff model + landed cost calc
- `TariffRate` entity (SCD Type 2)
- Admin → Tariff Rates screen (CSV import + manual edit)
- Landed cost computation service: pulls base + allocated freight + tariff + FX → unit cost
- Part Cost tab renders the breakdown stack + cross‑vendor comparison

### PR 5 — Off‑tier price prompt
- Component: `<app-tier-variance-prompt>` (one‑off exception / update tier / cancel)
- Wire into PO line entry
- Wire into invoice receiving (cascade after AP discrepancy check)
- `purchasing.offTierVariancePct` system setting + per‑vendor override
- PO‑level bundling for multi‑line off‑tier

### PR 6 — Shifts
- `Shift` entity + admin screen
- Slice 1: shift × calendar capacity → consumed by scheduling/MRP ✅ landed 2026-05-07 (`IShiftService.GetWeeklyCapacityHoursAsync`).
- Slice 2: hours‑of‑operation derived from shifts ✅ landed 2026-05-07 (`IShiftService.IsWithinShiftAsync`).
- Slice 3: clock event × shift → premium multiplier (touches payroll; biggest blast radius) ⏳ **DEFERRED**. Schema is ready (`Shift.PremiumMultiplier` persists at 1.00 default) but no consumer yet. See the TODO on `forge.core/Entities/Shift.cs` `PremiumMultiplier` for the integration plan when payroll picks this up: for each `ClockEvent`, resolve worker → location → calendar → active shift via `IShiftService.IsWithinShiftAsync`, bucket minutes by `PremiumMultiplier`, apply inside `PayStub` gross-wage roll-up. Open design questions on overlapping shifts (recommend: higher multiplier wins) and clock events spanning shift boundaries (recommend: split event into per-shift slices) — answer those before implementing.
- Each slice independently shippable inside this PR or as separate PRs.

---

## Open questions (need a decision before PR 1 ships)

1. **Calendar timezone.** A `WorkingCalendar` has a `TimeZone` field — but does that mean
   "holidays are observed in this TZ" or "shift start/end times are in this TZ"? Probably both.
   But for a multi‑location tenant, what TZ does the *tenant default* calendar use? Recommend:
   default = system tz of the install; per‑location overrides resolve to the location's stated tz.

2. **Holiday auto‑roll.** US Federal holidays mostly recur on fixed dates (Independence Day = July
   4) but some are floating ("third Monday of January"). The recurrence model needs to handle both.
   Recommend: store as a small cron‑like rule string (e.g., `MM-DD` for fixed, `Nth-DOW-of-MM` for
   floating) on `Holiday`, generate the actual `Date` row per year via a Hangfire job.

3. **Tariff data source.** Manual CSV import is fine for MVP, but tariffs change weekly under
   current US trade policy. Should we plan for a HTS lookup API integration (USITC, Avalara,
   Vertex) in PR 4 or defer? Recommend defer; the SCD Type 2 model accommodates either.

4. **Off‑tier prompt on bulk PO upload.** If a buyer imports 200 PO lines via CSV, do we surface
   200 prompts? Recommend: bulk imports skip the prompt; off‑tier lines are auto‑accepted as
   one‑off exceptions and a summary report flags them for review. Different UX from interactive
   entry.

5. **Currency on cost tab.** When viewing landed cost, do we show in vendor currency, in tenant
   functional currency, or both side‑by‑side? Recommend: tenant functional currency by default,
   with a hover/tooltip showing vendor‑currency original. Cross‑vendor comparison only makes sense
   in functional currency anyway.

---

## Out of scope (followup work)

- **Carrier integration** (UPS/FedEx/USPS/DHL APIs for live freight quotes). Mock + manual stays.
- **Customs broker / freight forwarder workflows.** Treated as external; their invoices come in
  as standard AP entries.
- **Hedge accounting / FX gain‑loss recognition.** Out of scope; we snapshot rates but don't do GL.
- **Quality cost in landed cost.** Phase 2 once QC reject‑rate data is reliable.
- **Vendor‑category‑specific minimums.** Single `MinimumOrderValue` per vendor for v1; if vendors
  start needing per‑product‑line minimums we extend later.
- **Lot/batch‑level cost tracking.** Landed cost is per receipt; lot‑level cost layering (FIFO /
  weighted average per lot) would require a separate lot cost entity. Not needed for v1.

---

## Capability gating

These features need capabilities registered in `CapabilityCatalog.cs` so installs can opt in/out:

| Capability                       | Gates                                                  |
|----------------------------------|--------------------------------------------------------|
| `CAP-PUR-LANDED-COST`            | Cost tab landed‑cost breakdown                          |
| `CAP-PUR-FREIGHT-CAPTURE`        | Freight fields on PO + receiving                        |
| `CAP-PUR-INCOTERMS`              | Incoterm field on VendorPart + PO                       |
| `CAP-PUR-TARIFFS`                | Tariff model + tariff component in landed cost          |
| `CAP-PUR-MULTICURRENCY`          | FX snapshot on PO; vendor currency display              |
| `CAP-PUR-PRICE-DISCIPLINE`       | Off‑tier price prompt cascade                           |
| `CAP-CAL-WORKING-CALENDAR`       | WorkingCalendar entity + business‑day calculations      |
| `CAP-CAL-SHIFTS`                 | Shift entity + scheduling/payroll integration           |

`CAP-CAL-WORKING-CALENDAR` is a soft prerequisite for everything that uses business‑day math; if
disabled, `*Days` fields fall back to calendar‑day arithmetic with no holiday awareness.

---

## Open decision: when does this start?

Six PRs is roughly 4–6 weeks of focused work. None of the existing efforts in flight (PR #63 tier
table, PR #64 date hygiene, PR #26 server date hygiene) block this; this is its own effort branch
(`effort/landed-cost-and-calendar`). Recommend kicking off PR 1 (WorkingCalendar) once the date
hygiene PRs land, since #26's `IClock` discipline is foundational for the calendar service's
testability.
