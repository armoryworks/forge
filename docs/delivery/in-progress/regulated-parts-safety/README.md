---
title: Regulated Parts, Traceability & Safety
type: delivery
status: in-progress
id: regulated-parts-safety
owner:
updated: 2026-07-03
---

# Regulated Parts, Traceability & Safety

> **Status: DESIGN LOCKED (2026-07-03) — implementation not started.** Derived from
> the 2026-07-02 planning session, cluster C of
> `delivery/pending/functional-backlog-2026-07-02`. Four forks decided (C‑1…C‑4).
> Grounded against live code, not the backlog's prose (several `AUGMENT`s were
> vaguer than reality — see [Reconciliation](#reconciliation-with-existing-code)).

## Goal

Make Forge enforce regulated-industry obligations on parts and production:
mandatory traceability + fields per industry, full component genealogy for recall,
SDS safety documentation that aggregates up assemblies, and GS1 barcode licensing —
all opt-in / industry-gated so non-regulated shops are unaffected.

---

## Reconciliation with existing code

- **Traceability:** `Part.TraceabilityType` (None/Lot/Serial) exists; `LotRecord`
  links a lot to its part + originating job/run/PO-line — but **no lot→lot
  consumption edges** (genealogy genuinely missing). `SerialNumber` entity exists.
- **Capabilities:** industry **presets** exist (`CapabilityCatalog`/`PresetCatalog`).
  `CAP-MD-PART-COMPLIANCE` gates compliance fields (HTS/hazmat/shelf-life);
  `CAP-QC-RECALL` (fwd/back trace + recall snapshot + quarantine), `CAP-INV-LOTS`
  (lot+FEFO), `CAP-INV-HAZMAT` (SDS attach) are **defined but half-built/off**.
  No `ComplianceProfile` entity (doc concept only); no required-field-at-step logic.
- **SDS:** `Part.HazmatClass` is free-text; SDS storage was deferred. `DocumentSet`/
  `DocumentSetLink`/`DocumentSetVersion` (versioned doc store) **now exist** (from the
  doc-management work) — reuse them.
- **Reorder / purchasing:** `Part.ReorderPoint`/`ReorderQuantity` (generic,
  quantity-driven); `Vendor`, PO flow exist. No expiry-driven reorder.
- **Barcoding:** printing stack has bwip-js + angularx-qrcode (standard symbologies).

---

## Locked decisions

| # | Fork | Decision |
|---|------|----------|
| **C‑1** | Mandatory-enforcement primitive | **`ComplianceProfile` entity** — per-industry, multi-select **additive union**, "general/none" excludes. Declares required traceability level + required fields@named-steps + SDS obligations. Enforced **server-side**. Capabilities gate *visibility*; the profile enforces *policy*. |
| **C‑2** | Component genealogy | **Explicit `LotConsumption` edge** `(consumedLotId, producedLotId, qty, job/run, timestamp)`, written at backflush/issue. Recall = graph traversal; complements `LotRecord` origin links. |
| **C‑3** | SDS storage + aggregation | **`DocumentSet`-backed SDS** tagged `SdsType` (Manufacturing/Consumer), supplier, revision. Part **and** assembly Safety tab; assembly set computed **on-the-fly** by walking the BOM and de-duping. No cache (materialize later only if needed). |
| **C‑4** | GS1 barcode license | **Standard/internal barcoding is the default** (free, always available). **GS1 is opt-in**; when enabled, the GS1 license is a **non-inventory "license" Part** with expiry + lead time → scheduled renewal PO to the GS1 vendor (qty 1, ~1-yr, pay before expiry). No GS1 license → standard barcoding still works. |

---

## Data model (proposed)

- **`ComplianceProfile`** — `Id, IndustryKey (firearms/food/medical/…), Name,
  RequiredTraceabilityType, SdsRequired, IsSystem` + **`ComplianceFieldRule`**
  `(profileId, fieldKey, processStep, condition)`. A shop selects one or more
  (`ShopComplianceProfile` join); effective requirements = the **union**;
  general/none contributes nothing. Enforced at part create/update and at the named
  process steps (map to `JobStage`/`ProductionRun` transitions).
- **`LotConsumption`** — `Id, ConsumedLotId (FK), ProducedLotId (FK), Quantity,
  JobId?/ProductionRunId?, Timestamp`. Powers `CAP-QC-RECALL` forward/backward trace,
  quarantine, and an immutable recall snapshot.
- **SDS** — reuse `DocumentSet` linked to a Part via `DocumentSetLink`, with SDS
  metadata (`SdsType`, supplier, revisionDate, hazardClass ↔ `Part.HazmatClass`).
  Assembly aggregation = recursive BOM walk, dedupe by material/SDS identity.
  Gated by `CAP-INV-HAZMAT`.
- **Barcode** — a **barcode mode** on the part/company: `Standard` (default) vs
  `GS1` (opt-in). GS1 license = a Part with a **non-inventory `PartKind`**
  (extends existing part type) so it stays out of stock/BOM math; registry = a
  `Vendor`; expiry-driven reorder job. Optionally surfaces renewal on the
  compliance calendar (`compliance-calendar` A).

---

## Staged plan (proposed)

1. **`ComplianceProfile` + enforcement scaffolding** — entity, shop selection,
   union computation, server-side validation of required fields@steps + required
   traceability. Seed firearms/food/medical profiles.
2. **`LotConsumption` genealogy** — capture edges at backflush/issue; wire
   `CAP-QC-RECALL` forward/backward trace, quarantine, immutable recall snapshot.
3. **SDS / Safety tab** — `DocumentSet`-backed SDS + `SdsType`; Part & assembly
   Safety tab; live BOM aggregation/dedupe; `CAP-INV-HAZMAT`.
4. **Barcoding** — standard default + GS1 opt-in; license-as-part (non-inventory
   `PartKind`) + expiry-driven reorder job + GS1 vendor.

Migrations additive (new entities/columns); expand/contract if any enum promotion.

## Open questions
- Exactly which "named process steps" enforce required fields — `JobStage`
  transitions, `ProductionRun` steps, or both?
- Is **serial** genealogy in scope alongside lot (SerialNumber exists), or lot-only v1?
- Recall-snapshot immutability storage (append-only table vs `DocumentSet`).
- Standard barcode symbology set to expose (reuse printing stack).

## Cross-links
- Backlog cluster C — `delivery/pending/functional-backlog-2026-07-02`.
- Related: `compliance-calendar` (SDS/compliance + license-renewal events),
  `functional-reference/*` (parts, inventory, quality), `industry-comparison.md`,
  `narrative-thread-mapper-design.md`. Capabilities: `CAP-QC-RECALL`,
  `CAP-INV-LOTS`, `CAP-INV-HAZMAT`, `CAP-MD-PART-COMPLIANCE`.
