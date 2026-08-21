---
type: delivery
status: in-progress
---

# Context — why standalone costing, not shadow parts on the BOM

Source: design conversation with a molding-shop design partner, 2026-08-21.
Companion to [SPEC.md](./SPEC.md). This file is the *why*; the spec is the *what*.

## The problem being rejected

The partner's mental model was to represent overhead (electricity, water, machine
maintenance, mortgage, wages, time) as **"shadow parts" stacked on a BOM** under a job.
That was talked through and rejected because:

- **It doesn't scale.** Maintenance + administrative overhead of shadow-part BOMs scales
  with (# products × # customers) combined, and the right allocation between products
  shifts constantly as one product's volume rises and another's falls. Per-unit overhead
  is *smaller* for high-volume products and *larger* for low-volume ones (economies of
  scale), so a fixed shadow-part value over- or under-charges depending on run size.
- **It breaks accounting traceability.** Pouring time/energy into a BOM "bin" is like
  pouring bolts into one bin — you lose the ability to tell where it went unless every
  sub-quantity carries its own lot number. That's a lot of manual tracking to reinvent
  what standard costing already solves.

## The stance adopted

Move all fixed (and some variable) overhead into a **standalone, industry-standard
standard-costing feature**: a separate, standardized place for machine maintenance,
mortgage, electricity, water, wages, etc. Then:

- **Dynamic, margin-based pricing.** The owner sets a target margin (e.g. 12%); the
  system uses historical aggregate overhead + production volumes as a predictive analytic
  to tell them what to charge per product at a given run size — automatically scaling so
  they don't maintain the math. Manual override lets them discount a customer deliberately
  ("hook them, then bring margins back up"), but the default is standardized across
  customers so pricing stays consistent (customers hate volatility → averages, not
  per-run pricing).
- **Low-maintenance via the bank feed.** Hook into the accounting/bank feed (NACHA / QBO)
  so overhead *actuals* pull in automatically (e.g. the electric utility's last month = $X,
  read from the checking account) once classified — the owner won't have to maintain
  that. Prompt them only when a price should change and *why*.
- **Keep the levers available.** Larger shops / accountants may want to seize manual
  control and disable the automatic behavior; the design must allow that (the same levers
  that enable customization also enable embezzlement via slow over-allocation, so
  variance visibility + logged rate changes are the guard).

## Design decisions that fell out of the conversation

- **Overhead on work centers / cost centers, never on BOM lines.** Item-level burden is
  the escape hatch for routing-less shops.
- **Two costs, kept apart:** cost-to-make (inventoriable/GAAP) vs cost-to-sell
  (adds SG&A + financing load). Mortgage *interest* is financing → period cost, never in
  inventory; mortgage *principal* is balance-sheet, not an expense.
- **Per-machine metering is a future extension, not the MVP.** A kilowatt meter per
  injection molder can retroactively attribute energy and even flag degradation (rising
  draw for the same work = lubricant/electronics wearing → a maintenance signal), but it
  can't be maintained *proactively* in a standard, so the MVP treats electricity as a
  pool with a machine-hour driver and leaves sub-metering as an opt-in refinement.
- **Forge is not the general ledger.** QBO (or the shop's GL) stays the book of record;
  Forge posts summary journals and owns the manufacturing-cost subledger.
- **Existing Forge surfaces to build on:** the asset maintenance schedule + emergency/
  shutdown events already exist; costing ties into those rather than duplicating them.

## Deliverable framing

Daniel committed to the partner: get the costing/overhead feature + training modules in,
wired into projections so pricing has good visibility and low maintenance, reviewable on
a quarterly cadence ("these products at these volumes need this margin → raise price to
$X, here's why"). Averages-based so the bulk of the bell curve is served well.
