---
title: Manual Inventory Override — Design & Accounting-Boundary Decision
type: delivery
status: in-progress
id: inventory-override
owner:
updated: 2026-06-04
---

# Manual Inventory Override — Design

Resolves the design/decision half of **armoryworks/forge#1**; implementation is
**armoryworks/forge-api#4**.

## Problem

Set or adjust the on-hand quantity of an **existing** part directly, bypassing
the purchasing pipeline (RFQ → PO → receiving). Use cases: opening stock,
physical-count corrections, found/adjusted inventory. A source PO + vendor may
be linked for provenance **when available, but must never be required**.

## Headline decision: operational-only, the GL stays cordoned off

The override is a **purely operational** feature. It changes on-hand quantity,
records the unit cost used (for inventory *valuation*, not bookkeeping), and
writes a mandatory audit entry. **It posts nothing to a general ledger.**

Rationale — this preserves the accounting boundary (see CLAUDE.md ⚡ and
`docs/qb-integration.md`):

- The GL / bookkeeping is **never-in-app**; `CAP-ACCT-FULLGL` is an aspirational
  placeholder that is never enabled. The `accounting-gl-phase0` model exists but
  is gated off — the rest of the app must not depend on it.
- Coupling a mainstream operational feature to the gated GL would prematurely
  create exactly the dependency the boundary exists to prevent.
- **Dependency direction rule:** if `CAP-ACCT-FULLGL` is ever genuinely turned
  on, GL posting must be a **subscriber** on the GL module that listens for
  inventory-adjustment domain events. The inventory feature must never import or
  call the GL. (Inventory → GL: forbidden. GL → listens-to-inventory: allowed.)

### What "accounting impact" resolves to

| Mode | Behaviour |
|------|-----------|
| **Standalone** | Adjustment updates the operational **inventory valuation** figure (Average/Standard per `CAP-INV-VALUATION`). No journal entry. |
| **External provider (QB/Xero) connected** | The provider owns the books. Forge records the operational adjustment and **flags it** so the user mirrors it in their accounting system. Forge writes no entry and does not silently drift. A future integration *push* (e.g. QB Inventory Quantity Adjustment) may be added in the integration layer, gated behind the provider — never as a call from the inventory feature. |

The issue's "offsetting GL entry" question (inventory-adjustment account vs
opening-balance-equity vs COGS) is therefore **out of scope** — Forge posts no
entry, so there is no offset account to choose. Revisit only if/when
`CAP-ACCT-FULLGL` ships, via the subscriber pattern above.

## Decisions

1. **Cost basis / valuation.** Optional manual unit cost on the adjustment. If
   omitted, use the part's current average/standard cost (per the valuation
   method). Never silently value at 0 — block or warn when no cost is resolvable.
   This feeds operational valuation only.
2. **GL posting.** None, from the inventory feature, in any mode (see above).
3. **Provider behaviour.** Operational adjustment always succeeds; when a
   provider is connected the row is flagged "not posted to external books" for a
   reconciliation view. No silent drift.
4. **Audit trail (mandatory).** Every override records actor, timestamp, qty
   delta (from → to), unit cost + cost source, a **mandatory reason code**
   (`reference_data` group `inventory.adjustment_reason`), optional free-text
   note, and optional source PO + vendor reference.
5. **Permissions.** Restricted to Admin + Inventory Manager via a new capability
   **`CAP-INV-ADJUST`** (gated through the standard capability system).

## Out of scope

- Any journal entry / GL posting from the inventory feature.
- Part creation (override applies to existing parts only).
- Required PO/vendor linkage (optional provenance only).

## Implementation (forge-api#4)

- Endpoint: an explicit override operation distinct from the receiving path,
  e.g. `POST /api/v1/inventory/adjustments` (qty set/delta, optional unit cost,
  reason code, optional note + PO/vendor refs), `[RequiresCapability("CAP-INV-ADJUST")]`.
- Writes the bin/stock change + an audit row; updates the valuation figure.
- No accounting/GL service dependency.
