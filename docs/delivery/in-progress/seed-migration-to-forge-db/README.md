---
title: Seed-data migration into forge-db
type: delivery
status: in-progress
id: seed-migration-to-forge-db
owner:
updated: 2026-07-03
---

# Seed-data migration into forge-db

> **Status: Phase 1 (engine) BUILT + MERGED. Phase 2 (extraction) started — role-model handoff
> absorbed. Phase 3 (flip) gated on the forge-db deploy cutover.**

## Goal / why

Move forge-api's **declarative reference seed data** out of EF boot-seeding and into forge-db's
declarative `seed/` + `data/` mechanism, so forge-db owns schema **and** its adjacent reference data
(DESIGN §5/§6.1) and EF becomes a lean query-mapping layer. Procedural/demo seeders stay in forge-api.

Two separable parts: **(A) build the forge-db seed/data application engine** (was unimplemented) and
**(B) extract each declarable reference seeder** from forge-api into `seed/*.sql`.

## Settled decisions

- **Scope:** engine + full extraction. The deploy-time-apply / read-only-boot **cutover is a separate
  forge-db effort**; this one is sequenced to land ahead of it.
- **Sequencing = dual-run then flip.** forge-api keeps seeding everything (roles included) at boot
  while forge-db `seed/` is populated and proven; forge-api seeders are removed only after forge-db
  owns the deploy path. Both sides are idempotent, so running both is safe. **Nothing is deleted from
  forge-api yet.**
- **Catalog-derived seeders stay in forge-api:** `CapabilityCatalogSeeder`, `WorkflowSubstrateSeeder`,
  `SeedAiAssistants` — their source of truth is a static C# catalog with stable-ID upsert logic.
- **Ledger lives in a harness-owned `forge_db` schema, excluded from the pg-schema-diff reconcile**
  (same mechanism as `hangfire`) — so it is neither desired-state you edit nor an EF-drift false
  positive. Table: `forge_db.data_migration_log`.

## Done — Phase 1 engine (forge-db, MERGED to `main`, PR armoryworks/forge-db#4)

`DataSeedRunner` + wiring:
- Ordered discovery (`data/` before `seed/`, zero-padded filename prefix = ordering), applied-once via
  the ledger, each script in its own transaction, checksum-drift warning on edited applied scripts.
- Wired into `forge-db apply` **after** the schema reconcile, and it **still runs when the schema is
  already in sync** (so new seed scripts land). Non-dev targets inherit `--yes --backup-taken`.
- Key files: `src/Forge.Db/DataSeedRunner.cs`, `Commands/ApplyCommand.cs`, `SchemaLayout.cs`,
  `PgSchemaDiffRunner.cs` (`forge_db` added to `ExcludedSchemas`). Convention documented in
  `data/README.md`; DESIGN §6.1 marked "Status: BUILT".
- Tests: 6 DB-free logic tests + 1 self-skipping Postgres integration test (set `FORGE_DB_TEST_DSN`).
  **14/14 green.**

## In progress — Phase 2 extraction (forge-db `seed/`)

**Role-model coop handoff absorbed** (compliance/roles effort; forge-api b9d34bdd, forge-db 32b59e8):
- ✅ **13 Identity roles → `seed/0010-identity-roles.sql`** (MERGED). Keyed on `normalized_name`,
  idempotent; validated E2E on a scratch DB.
- ⏸ **ComplianceOfficer visibility (`calendar_super_group_role_visibilities`) — DEFERRED, stays in
  forge-api boot.** Depends on the super-group taxonomy (`SeedComplianceBucketsAsync`), which is NOT
  yet ported. Under applied-once it would ledger-empty and never self-heal, so it must land in the same
  seed set as the super-groups, ordered after them (super-groups `seed/0030-…`, visibility
  `seed/0040-…`). SQL preserved in **Appendix A**.
- ❌ **Role-template → direct-role backfill (`MigrateUserRoleTemplatesToDirectRolesAsync`) — NOT
  seed/data.** One-time backfill reading a column being dropped; stays as transitional forge-api boot
  code until every install has run it.

**Still pending their own handoffs** (each ports to a numbered `seed/*.sql` once stable): compliance
super-group taxonomy + buckets, compliance profiles, regulatory sources, calendar taxonomy,
`reference_data` groups (job priorities, contact roles, UoM, carriers, currencies, part item-kinds /
material-specs / valuation-classes), `system_settings` defaults, `approval_workflows`, GL
chart-of-accounts reference, `sales_tax_rates` (promote from demo → essential). See the source
inventory in forge-api `Data/SeedData.*.cs`.

## Pending — Phase 3 flip (gated)

After forge-db owns the deploy path: prove parity on a scratch DB + an Armory Plastics clone, then
remove the migrated essential blocks from forge-api `SeedData.*`. Coordinate the forge-api deletions
with the owning efforts. Roles-loop deletion in forge-api SeedData.cs waits until here.

## Cross-effort coordination

- **compliance/roles agent:** role-model items handed off (above). Remaining compliance reference
  seeders (super-groups/buckets/profiles/sources/calendar) still forge-api-owned; hand off when stable
  and I port them, keeping stable natural keys (`reference_data (group_code, code)`,
  `calendar_super_groups.key`, role names).
- **AI/training agent:** catalog/training seeders stay in forge-api. Flag any NEW `reference_data`
  groups or new tables (mirror new schema into forge-db `schema/` for the drift check). No overlap so
  far.

## Resume checklist (pick up on another machine)

1. `cd ~/dev/forge/forge-db && git pull` — Phase 1 + roles seed are on `main`.
2. Optional e2e: `export FORGE_DB_TEST_DSN=postgres://postgres:postgres@127.0.0.1:5432/postgres?sslmode=disable && dotnet test tests/Forge.Db.Tests`.
3. Next unit of work = port the next stable reference seeder into `seed/NNNN-*.sql` (numbering leaves
   gaps; `data/` before `seed/`). Follow `forge-db/data/README.md` authoring convention: idempotent
   upsert on the natural key, one concern per file.
4. When the super-group taxonomy is ported, add Appendix A as `seed/0040-compliance-officer-visibility.sql`.
5. Nothing to delete from forge-api until Phase 3 (deploy cutover).

## Appendix A — deferred ComplianceOfficer visibility SQL

Apply only after both the roles seed and the super-group taxonomy seed:

```sql
INSERT INTO calendar_super_group_role_visibilities (super_group_id, role, created_at, updated_at)
SELECT g.id, 'ComplianceOfficer', now(), now()
FROM calendar_super_groups g
WHERE g.key IN ('safety-osha','environmental-epa','hazmat-dot','tax-corporate',
                'hr-employment','fire-facilities','atf-firearms','fda')
  AND EXISTS (SELECT 1 FROM asp_net_roles WHERE normalized_name = 'COMPLIANCEOFFICER')
  AND NOT EXISTS (
    SELECT 1 FROM calendar_super_group_role_visibilities v
    WHERE v.super_group_id = g.id AND v.role = 'ComplianceOfficer');
```
