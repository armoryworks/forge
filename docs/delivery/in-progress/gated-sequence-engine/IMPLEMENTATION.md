---
title: Gated Sequence Engine — Implementation Record
type: delivery
status: in-progress
id: gated-sequence-engine-impl
updated: 2026-08-18
---

# GSE — what landed (2026-08-18, autonomous session)

Design: `README.md` in this folder. Everything below is built, `-warnaserror` clean, and covered by tests.

## forge-api (open core, `Forge.*`)

| Layer | Files |
|---|---|
| Enums (`forge.core/Enums/`) | `SequenceDefinitionStatus`, `SequenceInstanceStatus`, `SequenceStepStatus`, `SequenceGateVerdict`, `SequenceJoinPolicy`, `SequenceGateSourceType`, `SequenceExpiryAction`, `SequenceEventType` |
| Entities (`forge.core/Entities/`) | `SequenceDefinition`, `SequenceStepDefinition`, `SequenceEdgeDefinition`, `SequenceGateDefinition`, `SequenceInstance` (IConcurrencyVersioned), `SequenceStepInstance`, `SequenceGateInstance`, `SequenceEvent` (append-only), `SequenceResourceClock` |
| Pure engine (`forge.core/Sequences/`) | `SequenceNet` (graph view), `SequenceNetValidator`, `SequenceEvaluator` (deterministic marking evaluator), `IGateSource`, `SequenceGateContext`, `SequenceGateVerdictResult`, `SequenceEvaluation` |
| Interfaces / models (`forge.core/`) | `ISequenceEvaluationService`; 14 request/response models `Sequence*Model`, `StartSequenceRequestModel` |
| Data (`forge.data/`) | 9 `DbSet`s on `AppDbContext`; 9 `IEntityTypeConfiguration`s; regenerated `Schema/forge-schema.sql` |
| API (`forge.api/`) | `Features/Sequences/*` — 21 commands/queries + `SequenceMapping`, `SequenceQueries`, `SequenceDefinitionGraph`, `SequenceStepCommands`; `Features/Sequences/GateSources/*` — `ManualClearance`, `TimeWindow`, `ResourceClock`, `Approval` + `SequenceGateConfig`; `Services/SequenceEvaluationService`; `Controllers/SequencesController` (`api/v1/sequences`, `[RequiresCapability("CAP-CROSS-SEQUENCES")]`); `Jobs/SequenceClockJob` (Hangfire, minutely); domain events `SequenceStepReadyEvent`, `SequenceInstanceCompletedEvent`, `SequenceClockExpiredEvent`; reaction `OnApprovalCompleted_ReevaluateSequences`; DI + `RecurringJob` in `Program.cs`; catalog row `CAP-CROSS-SEQUENCES` (CROSS, off by default) → 165 capabilities (`CLAUDE.md` count bumped) |
| Tests (`forge.tests/Sequences/`) | 27 tests: validator (6), evaluator (8), definition lifecycle (2), instance flow — start/clear/complete/override/skip/rework/cancel/by-code (6), gate sources + clock job + approval reaction + custom fail-closed (5). Architecture ratchets green (IClock everywhere, no controller try/catch, <5 types/file). |

## forge-db

`schema/tables/sequence_*.sql` (9) + `schema/indexes/ix_sequence_*.sql` (14). Assembles cleanly (`forge-db assemble`), FKs emitted last as usual; forge-db unit tests green (32).

## Verification

* `dotnet build forge.slnx -c Release -warnaserror` — 0 warnings, 0 errors.
* `dotnet test forge.tests` — 2,210 passed; the 62 failures are the Postgres/Testcontainers collection (`DockerUnavailableException`, no Docker daemon on this box — pre-existing environment limit, unrelated).
* forge-db tests — 32 passed.

## Deliberately NOT done in this pass

* **No forge-ui.** API-only. A definitions editor (graph), an instance board (marking + blocked reasons), and a
  "gates on this record" panel for entity detail pages are the natural next slices.
* **No consumers wired.** The two intended first users (job routing gates via `Custom:materials-ready` + FAI
  clearance + lot clocks; construction permits/inspections) are design notes in `README.md §5`. The engine ships
  with the generic sources so a consumer is a small `IGateSource` + a seeded definition, not engine work.
* **No in-flight migration across definition versions** (by design; cancel + restart).
* **Not pushed.** Committed locally per the recorded unattended-session stance — and note the working trees were
  already on in-flight branches, so the commits sit there: `forge-api` **`construction/phase0-blockers`** (`18bf5c12`,
  on top of the unpushed barcodes commit `03ca2b1a`), `forge-db` **`construction/phase0-po-partid-nullable`**
  (`9c390d9`, on top of `a120598`), `forge` `main` (`ed83b2b`). GSE is independent of the Phase-0 work; cherry-pick
  `18bf5c12` + `9c390d9` onto `main` if you'd rather ship it separately
  (see the 2026-07-05 note in `docs/delivery/in-progress/blocking-questions.md`): the owner pushes after a look. Nothing here touches a
  live install — `SchemaBootstrapper` applies the embedded schema to fresh DBs only and forge-db deploy is owner-gated.

## Open questions (also in `delivery/in-progress/blocking-questions.md`)

1. Role gating: the controller is one capability, `[Authorize]` only. Should override/skip/rework/publish require
   a role (e.g. `Controller`/`Admin`) the way ManualClearance can name `requiredRole` in config? Recommend yes for
   override + publish; left ungated pending the owner's call.
2. Dwell expiry with action `Block`: today a dwell expiry records the event/escalation but does not change the
   marking (an InProgress step cannot be un-started). Should Block additionally hold the step's *successors*
   (i.e. treat the step as NoGo for downstream) until acknowledged?
3. Should `SequenceStepReadyEvent` / `SequenceClockExpiredEvent` get a default reaction that creates a
   Notification for `EscalateRole`? Left to consumers to avoid coupling the primitive to the notifications module.
