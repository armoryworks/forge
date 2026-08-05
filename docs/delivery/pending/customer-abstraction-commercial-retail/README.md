---
title: Customer Abstraction — Commercial vs. Retail
type: delivery
status: pending
id: customer-abstraction-commercial-retail
owner:
updated: 2026-08-05
---

# Customer Abstraction — Commercial vs. Retail

Distilled requirements from an owner/client working session (2026-08-04).
Transcript content is confidential; this doc carries only the derived
requirements. Nothing here is started.

## Problem

`Customer` today is a single concrete entity (see `functional-reference/customers.md`).
Two real-world shapes don't fit:

1. **Commercial customers with multiple purchasing authorities.** One company can
   have several people, each over a different department, independently issuing
   POs for different materials/services. Orders need attribution to the specific
   purchasing authority while still rolling up to the one customer.
2. **Retail channel customers.** A marketplace (e.g. eBay, Amazon, Etsy) acts as
   the customer umbrella, but each end purchaser must be tracked as a distinct
   sub-identity: separated from every other purchaser under that channel,
   groupable and reportable under the channel, and searchable at the channel
   (customer) level with drill-down to individuals.

## Requirements

### Model
- Make `Customer` an **abstract concept** with two concrete kinds:
  **Commercial** and **Retail channel**. Most workflows (estimates, quotes,
  orders, jobs, invoices) keep accepting "a customer"; kind-specific behavior is
  driven by the concrete type from UI/execution context.
- **Purchasing authority** becomes a first-class notion:
  - Commercial: N purchasing authorities per customer (person + department/scope);
    orders/quotes attribute to one.
  - Retail: each end purchaser is a purchasing-authority-like identity under the
    channel customer.
- **Cross-channel person identity:** one person purchasing through multiple
  retail channels should be a single referencable identity with per-channel
  purchase attribution ("bought as <channel A>", "bought as <channel B>") — no
  duplicate person records per channel.

### Authorization / privacy
- With third-party (portal) access in play, a hard visibility wall is required:
  a retail purchaser must never see other purchasers or their orders under the
  same channel; commercial and retail visibility rules must be cleanly divided.

### Reporting
- Channel-level rollups with per-purchaser breakdown for retail; per-authority
  breakdown for commercial. The two kinds likely need distinct report shapes —
  disambiguate rather than force one layout.

## Phasing sketch (to be validated at design time)

1. **Schema + API:** introduce customer kind + purchasing-authority entity
   (attribution on quote/SO), migrations, backfill existing customers as
   Commercial with a default authority.
2. **UI:** kind-aware customer create/detail; authority selector on quote/SO
   entry; channel drill-down views.
3. **Authorization:** portal scoping per purchaser identity; visibility wall
   tests.
4. **Reporting:** kind-specific report augmentation.

## Open questions (for blocking-questions when work starts)

- Does attribution apply retroactively to historical orders, or forward-only?
- Is the cross-channel person identity merged automatically (email match?) or
  manually linked?
- Do commercial purchasing authorities need per-authority credit limits/pricing,
  or attribution only?
