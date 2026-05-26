# Addendum — The "If Regulated" Delta (CONDITIONAL — dormant until evidence warrants)

**Author:** Domain / Industry Specialist
**Status:** Pre-staged. **Do not activate** unless the BA's schema/code evidence confirms the shop runs **regulated contract manufacturing**. This layers on top of the v1 spine; it does not replace it.
**Companion to:** `definition-of-correct.md`

> The base "Definition of Correct" assumes a general job shop. The app carries **AS9100 / PPAP / FMEA-class depth**, so regulated operation is plausible. This addendum specifies *exactly* which previously nice-to-have items become **table-stakes** and which spine invariants gain **gating preconditions** if that proves true.

---

## Activation criteria (what BA evidence turns this on — and how much)

Activate **granularly, by vertical**, not all-or-nothing:

| Trigger evidence in schema/code | Activates |
|---|---|
| AS9100 / aerospace customers; **AS9102 FAIR**, ballooned-characteristic, NADCAP/AVL, DFARS melt-source fields | §R-AERO (FAI, special-process source control, melt/COO) |
| **PPAP/PSW**, control-plan, MSA, IATF references | §R-AUTO (PPAP gating, control plan) |
| ISO 13485 / medical / UDI, **21 CFR Part 11** e-sig & audit fields | §R-MED (e-sig, retention, UDI/DHR) |
| Lot/serial **genealogy**, mill-cert/CofC capture, NCR/MRB/CAPA, **revision effectivity**, calibration/gauge, operator qualification | §R-CORE (applies to *all* regulated verticals) |

**Critical real-world nuance — activate per-part, not shop-wide.** An AS9100-certified shop typically runs **both regulated and commercial jobs**. The controls below should be driven by a **part/customer/contract "quality-controlled" flag**, not applied blanket to every order. If the schema has such a flag (e.g., part-level quality class, contract flowdown), the gates fire only on flagged work. If there is *no* such flag and the app forces full control on everything, that itself is a finding (over-rigid for commercial work, a competitiveness problem).

---

## §R-CORE — flips that apply to ALL regulated verticals

### What moves from nice-to-have → **table-stakes**
- **Full forward + backward genealogy** (not just "lot recorded on shipment"): shipped serial/lot ⇄ every raw heat, operation, operator, inspection, and outside-process cert. Recall scope must be exact and fast.
- **Material certs / mill test reports** captured at receipt, tied to heat/lot, **forwarded in the CofC shipment package**. DFARS specialty-metal / country-of-origin / melt-source where defense-aero (→ also §R-AERO).
- **NCR + MRB disposition + CAPA** as mandatory, controlled flows (not optional logs).
- **Revision / configuration control with effectivity** (which serial/lot range a rev applies to), ECO/ECN approval workflow.
- **Calibration / gauge control**: acceptance measurements use in-cal equipment.
- **Operator qualification** for special processes recorded against the op.
- **Records retention + immutable, attributable audit trail** on quality/traceability records (append-only; controlled deletion).

### Spine invariants that gain **gating preconditions** (the base invariant still holds; these *block progression*)

| Spine stage (base ref) | Added gating precondition when flagged regulated |
|---|---|
| **A5 Receiving/issue** | Material **cannot be issued** to a flagged job without its required **cert on file** and **incoming inspection** passed. |
| **A5 Inventory** | **Nonconforming stock must be physically segregated (quarantine)** and **cannot be issued/shipped without an MRB disposition**. A part dispositioned *scrap* can never re-enter good inventory. |
| **A6 Shipment** | **Cannot ship** without: complete unbroken **genealogy**, required **certs/CofC package**, and acceptance recorded on **in-cal gauges**. No orphan units ("unknown lot") may ship. |
| **A2/A3 Revision** | A **rev or process change re-triggers FAI/PPAP** (per vertical) and **quarantines superseded-rev inventory**; mixing revs within a lot is blocked. |
| **A4 Shop floor** | A **special-process op** can only be signed off by a **qualified operator**; the operator identity is captured into genealogy. |

### New conservation-law-style invariants (QA oracles)
- **No-orphan-genealogy:** every shipped unit has a complete, unbroken chain to raw material; a shipment with an incomplete chain cannot post.
- **Cert-before-use:** `issued_to_flagged_job ⇒ required_cert_on_file ∧ incoming_inspection_passed`.
- **Disposition-gate:** `nonconforming ⇒ ¬issuable ∧ ¬shippable` until MRB disposition recorded; `disposition=scrap ⇒ permanently removed from good inventory`.
- **Cal-gate:** every acceptance inspection references a gauge **in-calibration at the time of measurement**; an out-of-cal gauge triggers review/recall of product accepted on it.
- **Quality records are append-only, timestamped, attributable**; edits are versioned, not overwritten.

---

## §R-AERO — aerospace (AS9100) additions
- **FAI / AS9102 FAIR** mandatory: ballooned drawing → characteristic accountability → measured results (Forms 1/2/3). **No production shipment of a flagged part until an approved FAI exists for the current rev/process.** FAI **re-triggers** on: new part, **rev change**, process/source change, or production lapse (typically >2 yrs).
- **Special-process source control (NADCAP + customer AVL):** an outside-process PO (heat-treat, plating, NDT, weld) can be placed **only to an approved source for that process**; returned process cert is **mandatory** before the lot proceeds (gates A6/A9 procurement).
- **DFARS / specialty-metals + melt-source / country-of-origin** capture on material for defense-aero; flows into cert package and genealogy. (May intersect **ITAR/EAR export control** — flag if export-control fields appear; that adds access-control obligations to Identity.)
- Invariant: `flagged_aero_production_ship ⇒ approved_FAI(current_rev) ∧ all_special_processes_from_approved_source_with_cert`.

## §R-AUTO — automotive (IATF 16949 / PPAP) additions
- **PPAP package + PSW** (up to 18 elements: design record, **PFMEA**, **control plan**, MSA, dimensional results, material/performance tests, capability studies…) **customer-approved at the required submission level before production shipment**. Re-triggered on rev/process change.
- **Control plan** governs in-process inspection frequency; SPC/capability tie in.
- Invariant: `flagged_auto_production_ship ⇒ PPAP_approved(current_rev, submission_level)`.

## §R-MED — medical (ISO 13485 / 21 CFR Part 11) additions
- **Controlled e-signatures + Part-11-grade audit trail** (attributable, non-repudiable, immutable).
- **Device History Record (DHR)** completeness per lot; **UDI** where applicable.
- Longer/defined **records retention** (often life-of-device).
- Invariant: `lot_release ⇒ complete_DHR ∧ all_e-signatures_present`.

---

## How the calibration line moves if activated

Base calibration said: *quality features (FMEA/PPAP/SPC/CAPA) are differentiators; the lot/serial backbone beneath them is spine.* **If regulated activates**, the line shifts:

- The **gating quality records become spine** for flagged parts: FAI/PPAP approval, cert capture, MRB disposition, genealogy completeness, cal/operator gating — these now block ship/issue, so a bug here **is** a trust/compliance-killer, not a differentiator.
- **SPC depth, FMEA authoring richness, analytics** remain differentiators (they improve quality but don't gate a compliant shipment by themselves — control-plan-driven inspection does).
- Net effect on orchestration: hardening priority shifts toward **traceability/quality-record integrity and the ship/issue gates**, and QA's oracle set expands by the §R-CORE invariants above.

---

## What I need from the BA to activate (precise asks)
1. Is there a **part/customer/contract quality-class flag** that scopes these controls, or are they shop-wide? (Determines granular vs blanket activation.)
2. Which **verticals** are evidenced — AS9102/NADCAP/DFARS (aero), PPAP/PSW (auto), Part-11/UDI (med)? (Determines which §R-* sections activate.)
3. Are the **gates actually enforced** (ship/issue blocked) or merely **recorded** (data captured, no enforcement)? — This is the single biggest correctness question if regulated: *captured-but-not-enforced traceability is a false sense of compliance*, and would be a high-severity finding.

Until the BA returns this, the addendum stays dormant and the base v1 Definition of Correct governs.
