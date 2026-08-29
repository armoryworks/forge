# Artifact 6 — Accounting Mode Migration Spec

Detailed specification for the wizard, data model, safety surface, and execution engine that supports moving an install between `CAP-ACCT-BUILTIN` and `CAP-ACCT-EXTERNAL` modes without losing financial data.

**Primary direction**: BUILTIN → EXTERNAL (graduating from in-house books to QuickBooks/Xero/etc.). The reverse direction is architected for but not shipped in Phase 3d.

## 1. Why this exists

The capability mutex `CAP-ACCT-BUILTIN ⊥ CAP-ACCT-EXTERNAL` means an install is in exactly one accounting mode at any time. Without a migration tool, the mode flip is a one-way door that abandons historical financial data on the old side. The migration tooling makes the flip a real operation:

- ArmoryWorks dog-foods PRESET-08 entirely on built-in, proving the preset shape works.
- When ready, ArmoryWorks executes the migration wizard to onboard QuickBooks, carrying their historical books across cleanly.
- Every install that follows the BUILTIN-first testing approach (Amendment 4) gets the same path.

## 2. Three migration modes

The customer's accountant has the final say on what shape the handoff takes. The wizard supports all three:

### 2.1 Forward-only

Existing invoices, payments, vendors, etc. remain in forge as historical, read-only records flagged `is_pre_migration_historical = true`. From the cutover moment, new financial documents route exclusively through the external provider.

- **Implementation cost**: low.
- **Customer experience**: the accountant now sees two sources of truth. forge for everything before the cutover; QuickBooks/Xero for everything after.
- **Use case**: clean break for shops that don't need historical data in the external system.

### 2.2 Cutoff date (default)

Customer picks a date. Records before that date stay in forge with the historical flag. Records on/after that date get backfilled into the external provider and become the source of truth there going forward.

- **Implementation cost**: medium.
- **Customer experience**: most ergonomic for most customers. Accountant gets a defined "this is in QB starting Date X" boundary.
- **Use case**: standard graduation from built-in to external books.

### 2.3 Full backfill

Every invoice, payment, vendor, customer balance gets pushed into the external provider. After migration, forge's local accounting tables are marked `synced` with the external system's IDs and become read-only.

- **Implementation cost**: high.
- **Customer experience**: cleanest single-source-of-truth handoff. Accountant works exclusively in QuickBooks/Xero post-migration.
- **Use case**: customers who want their full financial history visible in the external system.

## 3. The wizard flow

Six steps; no irreversible action until Step 6.

### Step 1 — Pick mode

Three cards (Forward-only / Cutoff date / Full backfill) with effort and accountant-impact summaries. Customer selects one; cutoff mode reveals a date picker; full backfill reveals an extra typed-confirmation gate.

### Step 2 — Pre-flight scan

The wizard runs a read-only analysis pass:

- Counts of touched entities: X invoices, Y payments, Z vendors, $W open AR.
- **Conflict detection** with per-row resolution UI:
  - Customer-name mismatches between forge and the external provider.
  - Missing chart-of-accounts mappings.
  - Tax-code mismatches.
  - Currency-code mismatches between systems.
  - Closed-period boundaries on the external side that block backfill into prior periods.
  - Near-match duplicate detection (same amount + same date + same customer) for invoices/payments the customer may have manually entered in the external provider while running forge on built-in.
- **Environmental check**: external provider API health, OAuth token expiry, exchange rates loaded for multi-currency installs, chart-of-accounts mapping covers every referenced account.

Output: a green/yellow/red status with per-issue counts. Cannot proceed to Step 3 until every blocker (red) is resolved or explicitly skipped with confirmation.

### Step 3 — Dry run

The execution engine runs in simulation mode:

- Where the provider supports a sandbox (QuickBooks Online, Xero), the wizard requires successful sandbox execution first.
- Where the provider supports a `do-nothing` flag on writes (rare), the engine uses it.
- Otherwise, the engine builds a manifest of every operation it would perform and the customer reviews the manifest.

The dry-run manifest is cryptographically hashed; the post-execution audit records that same hash. Detects silent in-flight tampering or pipeline corruption.

The manifest is downloadable as PDF and (where the customer has configured an accountant email) automatically sent to the accountant for 24-48h review. Customer or accountant signs off before Step 4 unlocks.

### Step 4 — Authorize execution

Three gates before Step 5:

1. **Re-authentication**: admin types their password again. Catches "left my browser open" risk.
2. **MFA challenge** where the install has MFA configured. Where MFA exists but isn't enabled by the user, surface a warning recommending enablement.
3. **Cooling-off period**: 60-second timer with a Cancel button. Migrations don't fire instantly off a button click.

For full-backfill mode specifically: customer types the exact company name (as configured in forge) to confirm. The literal string match is required.

### Step 5 — Execution

The engine runs:

- Pre-execution: full `pg_dump` snapshot of forge's database, retained 90 days minimum (configurable up to 1 year for regulated installs).
- Pre-execution (full-backfill mode only): snapshot of the external provider's state where supported (QuickBooks backup file via Intuit API; Xero full export).
- Frozen window engaged: accounting-writing handlers reject new invoices, payments, recurring-order generation. SignalR pushes a `migration-active` banner to all connected sessions; in-flight forms go read-only.
- Auto-push hooks (Drive / OneDrive / Dropbox) silenced via the integration outbox dispatcher gating on the active migration session.
- Batched execution: 50-100 rows per batch, configurable per provider based on rate limits (QuickBooks 500 req/min per realm; Xero 60 req/min).
- Per-row idempotency keys: `{migration-session-id}:{entity-type}:{entity-id}:{operation}`.
- Circuit breaker: 5 consecutive failures or 10% batch failure rate triggers automatic halt + human-acknowledgment gate.
- Resumable: progress saved every N rows within a batch; container restart resumes at the row level, not the batch level.
- Network resilience: exponential backoff retry (1s, 2s, 4s, 8s, 16s) on dropped connections, partial responses, timeouts.
- Per-row failure isolation: a failed invoice doesn't poison the rest of the batch. Failed rows accumulate in a "needs attention" queue.
- Real-time progress streaming via SignalR.
- Live reconciliation deltas surfaced as batches complete.
- External-provider audit notes: every row pushed includes `forge migration session #N, row #M, [timestamp]` in the provider's metadata.
- Abort button available throughout: stops new batches, lets in-flight ones complete cleanly, marks the session aborted, unfreezes the workspace. Does not roll back what's already migrated — that's the hold-period rollback flow (§6).

### Step 6 — Reconciliation and mode flip

Post-execution:

1. **Reconciliation report**: pre-migration ledger vs. post-migration ledger totals. Multi-currency rounding deltas tolerated up to a configurable threshold (default 1¢ per row, $1 aggregate); anything outside flags for review.
2. **Diff report**: row-level differences even where totals match. Customer-name variants, tax-calculation deltas, vendor-creation skips.
3. **Accountant sign-off**: report goes to the configured accountant for explicit acknowledgment. Until acknowledged, the migration sits in `pending-acceptance` and rollback is trivially easy.
4. **Migration certificate**: PDF generated with full audit, checksums, totals, accountant ack record. Filed in the customer's activity log and auto-pushed to their Drive/OneDrive/Dropbox folder (where the storage integration is configured).
5. **Mode flip**: `CAP-ACCT-BUILTIN` off, `CAP-ACCT-EXTERNAL` on. Migrated entities go read-only locally. Activity log captures the transition with a link back to the migration session.

## 4. Data model

### 4.1 New tables

**`accounting_migration_sessions`**

| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `mode` | enum | `ForwardOnly` / `CutoffDate` / `FullBackfill` |
| `cutoff_date` | date? | Set only when `mode = CutoffDate` |
| `direction` | enum | `BuiltinToExternal` (Phase 3d) / `ExternalToBuiltin` (architected, not shipped) |
| `target_provider_id` | string | `quickbooks-online` / `xero` / etc. |
| `started_at` | timestamptz | |
| `completed_at` | timestamptz? | |
| `aborted_at` | timestamptz? | |
| `status` | enum | `Planning` / `DryRun` / `Authorized` / `Executing` / `Reconciling` / `PendingAcceptance` / `Completed` / `Aborted` / `RolledBack` |
| `manifest_hash` | string | SHA-256 of the dry-run manifest |
| `manifest_json` | jsonb | Full manifest content |
| `pre_snapshot_path` | string | Path to the pre-migration `pg_dump` |
| `pre_external_snapshot_ref` | string? | Reference to the external provider's pre-migration backup (full-backfill mode only) |
| `accountant_acked_at` | timestamptz? | |
| `accountant_ack_user_id` | int? | |
| `rollback_window_ends_at` | timestamptz | Default `completed_at + 30 days` |
| `created_by_user_id` | int | |
| `notes` | text? | |

**`accounting_migration_rows`**

| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `session_id` | int FK → `accounting_migration_sessions` | |
| `entity_type` | string | `Invoice` / `Payment` / `Vendor` / `Customer` / etc. |
| `entity_id` | int | The local forge entity ID |
| `status` | enum | `Pending` / `DryRunOk` / `DryRunFailed` / `Executed` / `Failed` / `Skipped` |
| `external_id_after_success` | string? | The ID returned by the external provider |
| `idempotency_key` | string | `{session-id}:{entity-type}:{entity-id}` |
| `attempt_count` | int | Increments on retry |
| `error_message` | text? | Last error encountered |
| `executed_at` | timestamptz? | |

**`accounting_migration_audit`** (append-only, immutable)

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `session_id` | int FK | |
| `event_type` | string | `migration-started`, `dry-run-completed`, `row-pushed`, `row-failed`, `circuit-breaker-tripped`, `aborted`, `accountant-acked`, `mode-flipped`, etc. |
| `event_payload` | jsonb | Per-event payload |
| `signature` | string | HMAC-SHA-256 with per-install secret; detects tampering |
| `created_at` | timestamptz | |
| `created_by_user_id` | int? | Null for system events |
| `client_ip` | string? | |

### 4.2 Column additions on existing entities

Every entity that participates in accounting (Invoice, Payment, Vendor, Customer, RecurringOrder) needs:

- `external_provider_id` — string, nullable. Set after successful migration. Mostly already exists from existing QB/Xero connector work; Phase 2 foundations audits which still need adding.
- `is_pre_migration_historical` — boolean, default `false`. Set true on rows that stay in forge post-migration but didn't get pushed to the external provider. Renders the row as read-only with a "Historical — not in [Provider]" badge.

## 5. Capability addition

**`CAP-ACCT-MIGRATION`** — umbrella capability for the migration tooling. Default off. Auto-enables when an install attempts to flip between `CAP-ACCT-BUILTIN` and `CAP-ACCT-EXTERNAL`. Hidden from admins unless a migration is in progress or completed.

## 6. Hold-period rollback

For 30 days post-migration (configurable per install), the migration is reversible:

- `accounting_migration_sessions.status` is `PendingAcceptance` (before accountant sign-off) or `Completed` (after).
- `accounting_migration_sessions.rollback_window_ends_at` is set to `completed_at + 30 days`.
- BUILTIN data is preserved with `is_pre_migration_historical = true`; it's not deleted.
- Rollback wizard reverses the mode flip: `CAP-ACCT-EXTERNAL` off, `CAP-ACCT-BUILTIN` on. Migrated rows in the external provider get marked-as-soft-deleted (where the provider supports it) or annotated with a rollback note. Locally migrated entities lose the `is_pre_migration_historical` flag (return to live).
- After the rollback window closes (`rollback_window_ends_at` passes), the migration is locked. The pre-migration snapshot is retained for the configured retention period (default 90 days) but the in-app rollback path is removed.

## 7. Safety surface (full taxonomy from Amendment 6)

Grouped by failure mode. Items marked **Essential** ship in Phase 3d; **Strongly recommended** ship in Phase 3d or have a documented opt-out; **Defensive depth** are nice-to-have.

### 7.1 Pre-execution safety

**Essential**
- Mandatory pre-migration `pg_dump` snapshot.
- Sandbox-vs-production confirmation prominent in UI.
- Target-account-state acknowledgment (existing-data merge confirmation).
- One-active-migration-per-install lock.
- 60-second cooling-off timer before Step 5 fires.

**Strongly recommended**
- Accountant email notification with manifest (24-48h before execution).
- Frozen-window enforcement on accounting writes.
- Pre-flight environmental check (API health, token expiry, exchange rates, COA coverage).
- Sandbox dry-run required before production execution.
- Quiet-hours scheduling by default (outside business hours).

**Defensive depth**
- Read-only baseline PDF/CSV export with checksum.
- Manifest cryptographically signed.
- Full-backfill-mode irreversibility acknowledgment (typed confirmation).

### 7.2 During-execution safety

**Essential**
- Per-row idempotency keys.
- Circuit breaker (5 consecutive failures / 10% batch failure rate halts execution).
- Auto-push hooks silenced during migration.
- Per-row failure isolation.
- Rate-limit awareness per provider.

**Strongly recommended**
- Exponential backoff retry on network failures.
- Real-time SignalR progress streaming.
- Abort-migration button always available.
- Per-row persistent intermediate state.

**Defensive depth**
- Live reconciliation deltas streaming during execution.
- External-provider audit notes embedded in every pushed row.

### 7.3 Post-execution safety

**Essential**
- Reconciliation report mandatory before mode flip.
- Row-level diff report.
- 30-day hold-period rollback window.
- Accountant sign-off gate.

**Strongly recommended**
- Migration certificate PDF auto-filed to activity log + cloud storage.
- Pre/post state dashboard persistent during hold period.

**Defensive depth**
- External-provider backup taken before full-backfill execution.

### 7.4 Authorization & access

**Essential**
- Migration requires Admin role explicitly (not Manager).
- Re-authentication at Step 4 (password retype).

**Strongly recommended**
- MFA enforcement where configured.
- Per-action audit trail (clicks logged with user + IP + timestamp).

### 7.5 UX footgun prevention

**Essential**
- Visual distinction between dry-run (yellow) and real-execution (red) modes.
- "Type the customer name to confirm" gate for full-backfill mode.

**Strongly recommended**
- Conflict-resolution gate (default 0 unresolved blockers required to proceed).

### 7.6 Compliance / legal

**Strongly recommended**
- Document retention compliance (7-year minimum on migrated invoices).
- Data residency check at connect-time.

**Defensive depth**
- HMAC-signed audit log entries (per-install secret).

### 7.7 Disaster recovery

**Essential**
- Documented "panic abort" runbook.
- Migration log immutability (append-only audit table).

**Strongly recommended**
- Snapshot retention configurable up to 1 year (default 90 days).

## 8. Edge cases the spec accounts for

- **Open invoices being paid during the migration window** — frozen window blocks new payments; existing draft payments preserved.
- **Recurring invoice generation** — `RecurringOrderJob` auto-pauses while a session is active; resumes on completion.
- **Manually-entered duplicates** — near-match detection in Step 2 surfaces same-amount + same-date + same-customer matches; per-row skip/merge choice.
- **Multi-currency rounding** — reconciliation tolerates configurable deltas; defaults to 1¢ per row, $1 aggregate.
- **Historical FX rates** — wizard uses per-invoice-date rates from the Currencies & FX catalog rather than today's rate.
- **Tax-engine differences** — reconciliation flags any invoice where tax delta exceeds 1%; accountant resolves.
- **Closed periods on external side** — pre-flight detects; surfaces in conflict resolution.

## 9. Internal E2E test fixture

Before exposing the wizard to ArmoryWorks (or any customer), build a synthetic install with:

- 200 customers
- 1,000 invoices across multiple currencies
- 500 payments
- A few duplicate-suspect rows in QB sandbox
- Closed period on QB side (Jan-Mar prior year)

Run the full BUILTIN→QuickBooks-sandbox migration as an automated Playwright E2E spec. Verify every safety gate fires. Lands in `forge-ui/e2e/tests/accounting-migration.spec.ts`. Runs in CI on every migration-tool change.

Without this fixture, the first real migration is the test. With it, ArmoryWorks's migration is "the second time we've run this end-to-end."

## 10. Reverse direction (EXTERNAL → BUILTIN)

Architected but not shipped in Phase 3d:

- Same `accounting_migration_sessions.direction` enum supports `ExternalToBuiltin`.
- Same modes (forward-only / cutoff / full backfill) apply.
- Same safety surface applies.
- Implementation lives behind a feature flag; reads the external provider, writes to local BUILTIN tables.

Ships when a customer asks. Real-world drivers: customer leaves QuickBooks (subscription cost / accountant retirement / business-model shift). Architecture supports it cheaply at that point.

## 11. Phasing of migration work

| Phase | Migration-specific work |
|---|---|
| **1** (Analysis) | This document. |
| **2** (Foundations) | `accounting_migration_sessions` + `accounting_migration_rows` + `accounting_migration_audit` tables. `external_provider_id` column audit + additions. `is_pre_migration_historical` flag column. `CAP-ACCT-MIGRATION` capability registration. Frozen-window hooks across all accounting-writing handlers. |
| **3d** (Build sub-phase) | Wizard UI (six steps). Execution engine with all safety gates from §7. Reconciliation engine. Hold-period rollback wizard. E2E test fixture (§9). |
| **4** (Dog-food) | ArmoryWorks runs the wizard against a QuickBooks sandbox (dry run + reconciliation), then optionally executes against real QB. Validates the wizard end-to-end before public availability. |
