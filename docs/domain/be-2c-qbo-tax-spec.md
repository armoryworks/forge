# BE-2c — QBO Tax Path: Canonical Build Spec & Acceptance Contract

**Author:** Domain / Industry Specialist
**Status:** Canonical. This file is the BE-2c acceptance contract. Supersedes any inline tax-rate wiring recommendation for the **integrated** path.
**DoD invariants:** INV-IN4 (tax computed once), INV-QBO3 (cent parity). Anchors: `definition-of-correct.md` §A9 + Ruling #2 + Ruling #9.
**Mode note:** target behavior is mode-independent; real-sandbox cent-parity verification is deferred to the scheduled QB-sandbox milestone. Under `MOCK_INTEGRATIONS` the read-back figure is the mock's return.

---

## The model (one sentence)

**Taxability is asserted by the app at the line level; tax is computed by QuickBooks Online Automated Sales Tax (AST) at the transaction level from app-supplied inputs; the result is read back and stored for display/reconciliation only. The app authors zero tax amounts.**

This follows Ruling #2 (QBO AST is authoritative; the app stops authoring a tax figure) and is its payload-level implementation.

---

## Outbox payload — what BE sends

| Field | Level | Value | Source |
|---|---|---|---|
| `CustomerRef` | header | mapped QBO customer (`ExternalId`) | MasterData customer mapping |
| ship-to address | header | the jurisdiction input AST needs | SO / shipment ship-to |
| `Customer.Taxable` + exemption reason/cert | header (customer) | exempt → AST applies no tax regardless of line codes | exemption-cert lifecycle |
| `TaxCodeRef` (TAX / NON) | **per line** | line taxability assertion | F-032 per-line `tax_code` |
| `Amount`, `ItemRef` | per line | line subtotal + mapped item | invoice line |
| `TxnTaxDetail.TotalTax` | header | **OMIT — do not populate** | — |

## Two hard rules

1. **Do NOT send a TaxLine or populate `TotalTax`.** The flat `Subtotal × TaxRate` is retired entirely from the payload. Any app-computed tax amount sent to QBO is the defect — AST overrides or conflicts with it, which is the source of the cent mismatch.
2. **Do send the three inputs AST needs:** per-line `TaxCodeRef`, customer taxable/exempt status, ship-to address. A missing ship-to is an **error condition** (jurisdiction undeterminable) — block or flag; do not send a partial payload.

## Tax-code mapping (app `tax_code` → QBO `TaxCodeRef`)

- **Material lines:** TAX / NON from the part-master taxable flag.
- **Labor / operation lines:** TAX for production operations + outside processing; NON for non-production service lines (engineering consultation, programming billed as a service). Per Ruling #5.
- **Freight line:** carries its own `TaxCodeRef`; assert **TAX** and let AST decide. Freight taxability varies by state; same conservative asymmetry as Ruling #5 — TAX→0%-where-exempt is harmless, NON→silent under-tax is the audit-year time bomb.

## Read-back

After QBO creates the invoice, the response carries `TxnTaxDetail` with the computed `TotalTax`. The app stores it for display + reconciliation. Cent-parity (`stored_tax == QBO_returned_tax`) is structurally satisfied because the app reads rather than computes — there are not two numbers to drift.

## Estimate nuance (do not over-read the model)

Showing an **estimated** tax on a quote/order is acceptable if labeled non-authoritative ("plus applicable tax"). It must **never** populate the booked tax figure or the outbox payload. The app's local `sales_tax_rates` table may back that non-authoritative estimate display only — it is **not** the authoritative source for the integrated path.

---

## Build-direction note (resolves a doc conflict)

The BA gap analysis lists two related gaps; build to the correct one:

- **GAP-QBO-04 (transmit codes/exempt to QBO) — this is the correct BE-2c target.**
- **GAP-INVOICE-04** recommends wiring up `GetTaxRateForCustomer` / `sales_tax_rates` for **in-app** jurisdiction computation. For the **integrated** path this is the *opposite* of Ruling #9 and must not be built as the authoritative tax source. In-app rate logic is permitted only for non-authoritative estimate display.

Likewise, REQ-INVOICE-02's DoD phrase "tax auto-derived from customer jurisdiction + exemption" must be read as *"AST derives it from app-supplied ship-to + per-line codes + exemption,"* not *"the app computes the rate."*

---

## Acceptance contract (DoD)

**INV-IN4 / INV-QBO3:** *Tax is computed exactly once, by QBO AST, from app-supplied inputs (ship-to jurisdiction, per-line taxability, customer exemption). The app never authors tax; the stored tax equals QBO's returned tax to the cent.*

Assertable checks:
1. Outbox payload contains per-line `TaxCodeRef`, customer taxable/exempt flag, and ship-to address.
2. Outbox payload contains **no** app-authored `TotalTax` / TaxLine amount.
3. Missing ship-to → payload blocked/flagged, not sent.
4. Exempt customer → AST returns zero tax regardless of line codes; stored tax = 0.
5. Stored tax == QBO-returned `TxnTaxDetail.TotalTax` to the cent (verified live at the QB-sandbox milestone; structurally guaranteed under mock).
6. Local flat `Subtotal × TaxRate` is no longer written as a source of truth anywhere on the invoice path.
