---
title: Context brief for the domain-document refresh
type: delivery
status: in-progress
id: domain-doc-refresh-context-brief
updated: 2026-09-14
---

# Context brief — where this product does not match a standard ERP/MRP/MES stack

> Written for a reviewer who knows the industry but not this product. It exists so that a
> refresh of the May 2026 domain documents does not silently assume vocabulary and structure
> this platform deliberately does not use. It describes concepts, not implementation. Nothing
> here is derived from reading application source, and a reviewer using it must not read
> application source either — the whole point of the refresh is an opinion the code did not shape.

## What the platform is

A shop-management platform for small and mid-size discrete manufacturers — job shops and
similar. It covers the commercial and operational spine (lead, estimate, quote, order,
production, shipment, invoice, cash) plus master data, quality, inventory, purchasing and
people. It is **one application**, not an ERP with a bolted-on MES.

## The deviations that matter to a correctness document

**1. There is no fixed work-order status lifecycle.** Production work is tracked as cards on
configurable boards. Each shop defines its own track types and its own ordered stages, and
names them. Stages can be marked irreversible (no moving backwards once a document has been
issued) or mandatory (cannot be skipped). So a statement like "a work order moves from
Released to In Process to Complete" has no universal meaning here. Correctness statements must
be about **what must be true before work may advance**, not about named states.

**2. Estimate and quote are two forms of one document.** An estimate is an early,
non-binding figure that need not be itemised. A quote is binding, line-itemised and priced.
Conversion runs one way and is traceable. Many ERPs have only a quote; do not collapse them.

**3. Every feature is switchable per install.** The platform carries a large catalogue of named
capabilities, each on or off for a given shop, with dependencies between them. A shop may
genuinely not have leads, or acceptance evidence, or returns. **Any rule in the domain document
should say which capability it presumes and what the default is**, otherwise it is untestable:
a check can pass vacuously because the feature under test is switched off.

**4. Accounting runs in one of two mutually exclusive modes.** Either an external accounting
system is the book of record and this platform is operations-only, or the platform runs its own
double-entry ledger. The native ledger is off by default and turning it on is gated on loading
opening balances. Rules about receivables, revenue and cost of sale must state which mode they
apply to. A rule that is silent on this is ambiguous.

**5. Entity labels are re-mappable per install.** What one shop calls a Job another calls a Work
Order or a Project, and the platform supports that as configuration. Write about the concept and
its obligations; do not assume the reader's label.

**6. Orders carry evidence of authorisation, not just a flag.** Before work is released, the
order can be required to hold proof the customer actually ordered it — a signed purchase order,
an email, a portal acceptance, an e-signature, or a recorded verbal confirmation. The channel is
preserved and the evidence is retained and hashed. Acceptance can be revoked without erasing the
original record. This is not a standard ERP concept and the May documents predate it.

**7. Part identity is three orthogonal axes, not one type field.** How a part is sourced
(made, bought, subcontracted, or a phantom grouping), which inventory class it belongs to (raw,
component, subassembly, finished good, consumable, tooling), and a descriptive taxonomy the shop
configures. A single "part type" enumeration does not map onto this.

**8. Shop-floor execution is a kiosk surface, not an MES.** Operators clock on and off work,
report quantities, and record quality outcomes through a touch and scan interface inside the same
application. There is no machine-data collection layer, no equipment integration, and no separate
MES database. MES-standard expectations about real-time equipment telemetry do not apply; the
expectations about traceability, operator attribution and quality gates do.

**9. Gated processes are a general mechanism.** Inspection sign-offs, permits, approvals and
expiry clocks are expressed through one configurable gated-sequence primitive rather than being
hard-coded per process. A correctness statement about "an inspection must pass before X" is
therefore a statement about the gate, not about a bespoke inspection feature.

**10. Retail and marketplace orders split the counterparty.** On a marketplace the party that
owes the money and the party that receives the goods are different. The platform keeps the paying
customer as the account and records the consumer separately. Tax may be collected and remitted by
the marketplace rather than the seller, which changes what the seller actually owes.

**11. Human-readable document numbers are editable and historical.** Numbers can be changed
within a document's lifecycle window, and superseded numbers still resolve. Do not assume an
immutable sequential identifier.

## What has changed since the May 2026 documents were written

Stated in domain terms, without reference to how any of it was built:

- The native double-entry ledger moved from an aspiration to something substantially built:
  sub-ledgers, period close, standard costing with variance analysis, statements.
- Standard costing arrived — costs roll from bills of material and routings, and variances are
  measured against them.
- Order acceptance evidence (item 6 above) was introduced and did not exist in May.
- A mobile surface for scanning, clocking and lookups was added.
- An in-application training library was added.
- A construction vertical is in design, which will stress any assumption that the domain is
  exclusively machine-shop shaped.

## The May documents' own open questions

The May definition-of-correct listed these as unresolved and they appear to remain so. The refresh
should either resolve them or restate them as explicit assumptions:

- Whether pricing uses a margin or a markup convention.
- Which external-accounting subscription tier is assumed, since it gates inventory and purchasing.
- Whether customer-supplied or consigned material occurs.
- Whether sales tax is computed by this platform or by the external accounting system, and the
  double-taxation risk if both do.

## What the reviewer may and may not read

**May read:** everything under `docs/`, the repository root documents, and outside knowledge of
the industry and of relevant accounting and manufacturing standards.

**Must not read:** application source. It is not present in this workspace, deliberately. If a
question can only be answered by inspecting the implementation, that is a finding to record, not
a gap to fill.
