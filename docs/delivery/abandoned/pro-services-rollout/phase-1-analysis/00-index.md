# Phase 1 — Analysis Sprint Deliverables

Six artifacts produced during the Phase 1 analysis sprint for the Pro Services + Cloud Storage rollout. Each is a standalone document; together they drive Phase 2 (Foundations) and Phase 3 (Build everything achievable).

## Plan reference

These deliverables implement the Phase 1 step from the unified plan (v0.2 + Amendments 4, 5, 6). The plan itself lives outside this folder; the relevant decisions ratified at Phase 0 include:

- **D1** — Terminology bundles are preset attributes, not a new layer.
- **D2** — Auto-create cloud-storage folder is dual-path (sync best-effort + outbox fallback).
- **D3** — OAuth supports both per-user and service-account modes per provider.
- **D4** — Discovery wizard adds a top-of-funnel "make / sell time / both" split.
- **D5** — Hybrid is PRESET-09, a first-class stereotype.
- **D6** — Engineer role permissions are capability-gated, not split.
- **D7** — `CAP-QC-COMPLIANCE-FORMS` scope broadened to cover NDAs/MSAs.
- **D8** — Project accounting ships real in Phase 3 (no mock-in-V1 deferral).
- **D9** — Cloud storage is multi-provider from day one (Google Drive + OneDrive + Dropbox + hybrid storage via `entity_cloud_links` table).

Amendments 4-6 layer on:
- BUILTIN-first build sequence (validates everything on built-in accounting before external connectors).
- Accounting mode migration tooling (full wizard with safety surface).
- Comprehensive safety taxonomy (snapshot, frozen window, circuit breaker, hold-period rollback, accountant sign-off, etc.).

## Artifact index

| # | Artifact | Purpose |
|---|---|---|
| 01 | [Inventory matrix](01-inventory-matrix.md) | Every module/feature/entity tagged ✅ / 🏷️ / 🧰 / 🔧 / 🟥 |
| 02 | [Config layers audit](02-config-layers-audit.md) | Current state + gaps for the 6 existing config layers |
| 03 | [Gap-and-treatment punch list](03-gap-punch-list.md) | Concrete code work for items tagged 🔧 |
| 04 | [Catalog additions punch list](04-catalog-additions.md) | New capabilities, entities, and tables to register |
| 05 | [Preset format extension spec](05-preset-format-extension.md) | Stereotype = capability set + JSON seed bundle |
| 06 | [Migration spec doc](06-migration-spec.md) | BUILTIN ⟷ EXTERNAL accounting migration tooling |

## Reading order

For first-time readers, the right order is:

1. **02 (config layers audit)** — establishes what's already adjustable and what isn't.
2. **01 (inventory matrix)** — applies the audit's findings to every feature.
3. **03 (gap punch list)** — derives code work from the matrix's 🔧 tags.
4. **04 (catalog additions)** — enumerates new capabilities + tables.
5. **05 (preset format extension)** — defines the stereotype harness shape.
6. **06 (migration spec)** — independent of 1-5; can be read first if accounting is the lens of interest.

## What happens after these artifacts ship

- **Phase 2 (Foundations)** — implements the catalog additions (04), extends the preset format (05), closes terminology gaps surfaced by the audit (02), adds the migration data model (06 §data-model), and tackles any items from (03) classified as foundation-blocking.
- **Phase 3 (Build everything achievable)** — implements every remaining item in the four sub-phases 3a–3d.
- **Phase 4 (ArmoryWorks dog-food)** — exercises everything end-to-end through a full quote-to-cash cycle on built-in, then through the migration wizard to QuickBooks.
