---
title: Gated Sequence Engine (GSE) — Design + Implementation Record
type: delivery
status: in-progress
id: gated-sequence-engine
updated: 2026-08-18
owner: Daniel Hokanson
---

# Gated Sequence Engine (GSE)

> Working title kept. Internally the module is called **Sequences** (`Forge.Core.Sequences`,
> `Features/Sequences`, `api/v1/sequences`, capability `CAP-CROSS-SEQUENCES`).

## 0. Placement decision (why this is open core, not Tuyere)

The construction-vertical business model fixes the boundary: *Apache-2.0 open core + private SaaS
repos; private holds **operations**, never workflow; test = "would a single-tenant self-hoster notice
this missing? yes → core."* A process/gating primitive is workflow that both design partners
(routing gates, inspection sign-offs, lot expiry) and the construction vertical (permit/inspection
chains) would notice missing. **→ It lives in `forge-api` under Apache-2.0.** Nothing here touches
billing, tenancy, or fleet operations.

## 1. What it is, precisely

The concept doc's model — steps with predecessors, gates that must read "go" before a step may
start, and clocks that expire — is a **Petri net with guarded transitions and timers**. We adopt
that framing because it answers the questions the concept doc leaves open (join semantics,
re-evaluation, cancellation) with 60 years of settled theory, while keeping the doc's vocabulary:

| Concept doc | Petri-net term | Here |
|---|---|---|
| Step | transition (+ its input places) | `SequenceStepDefinition` / `SequenceStepInstance` |
| Sequence (dependency graph) | arcs | `SequenceEdgeDefinition` (from-step → to-step) |
| Gate | guard on a transition | `SequenceGateDefinition` / `SequenceGateInstance` |
| Gate source | guard predicate | `IGateSource` (pluggable evaluator, keyed by `GateSourceType`) |
| Clock (resource / step) | timed token / transition timeout | `SequenceResourceClock` (travels with the resource) + `MaxDwell` on a step |
| Parallel / serial | multiple vs single input arcs | not distinguished — a step is Ready when **all** (or **any**, per `JoinPolicy`) predecessors are Complete **and** all its gates are Go |

### Definition vs. instance (the gap the concept doc had)

* A **definition** is a versioned, immutable-once-published template: `SequenceDefinition`
  (`Code` + `Version` natural key, `Status` Draft → Published → Retired) owning steps, edges, gates.
* An **instance** is a run of one published definition against a **subject** (polymorphic
  `EntityType`/`EntityId`, e.g. `Job`/123, or none for a free-standing checklist). It **pins the
  definition version at start**; publishing v2 never touches v1's in-flight runs (Q2 of the existing
  Workflow pattern — same policy, deliberately). Migration of in-flight runs is *not* automatic —
  cancel + restart, or let them finish.

### Evaluation model — push, idempotent

Gate re-evaluation is **event-driven**, never polled by steps: anything that can change a verdict
(`step completed`, `gate cleared`, `override`, `clock expired`, `approval decided`, explicit
`reevaluate`) dispatches `ReevaluateSequenceCommand(instanceId)`. The evaluator is a **pure
function** of (definition net, instance marking, gate verdicts, now) → (new marking, events). It is
deterministic, so re-running it is harmless; every state change is appended to `SequenceEvent`
(the audit log falls out for free), and clocks record `FiredAt` once, so escalations cannot double-fire.
A Hangfire `SequenceClockJob` (every minute) is the only timer: it fires due resource/step clocks and
re-evaluates instances whose time-window gates have crossed a boundary since the last pass.

### Failure, rework, override — first-class

* **Blocked** is a derived state (a step whose predecessors are done but ≥1 gate is NoGo), never a
  stored flag.
* **Override**: any NoGo gate can be forced to Go by an authorised user **with a required reason**;
  recorded as `GateOverridden` with actor + reason (mirrors Admin2's reason-for-change).
* **Rework**: `ReworkSequenceCommand(instanceId, targetStepKey, reason)` resets the target step
  and everything downstream of it to Pending (a controlled back-edge); the reason is required and
  logged. Definitions may also declare explicit `IsRework` edges (allowed cycles) — the validator
  permits cycles only through rework edges.
* **Cancel**: terminal; reason required.
* **Skip**: a step may be skipped by an authorised user with a reason (records `StepSkipped`,
  counts as Complete for successors — the concept doc's "manual intervention").

### Human sign-off is a fact, not a task system

"External clearance" is modelled as **the gate reads a recorded fact**. Two built-in sources give
that shape without building task management: `ManualClearance` (someone with the right role posts
`clear` on the gate instance — the record *is* the clearance) and `Approval` (Go when the subject
entity's governing `ApprovalRequest` is approved — reuses the existing Approvals feature via
`ApprovalCompletedEvent`). Assignment/reminders stay with the modules that own people.

## 2. Model

```
sequence_definitions        (code, version, name, description, subject_entity_type?, status, published_at)
  ├─ sequence_step_definitions   (definition_id, key, name, sort_order, join_policy, max_dwell_minutes?, dwell_expiry_action, escalate_role?)
  ├─ sequence_edge_definitions   (definition_id, from_step_key, to_step_key, is_rework)
  └─ sequence_gate_definitions   (definition_id, step_key, key, name, source_type, config_json, expiry_action, escalate_role?)
sequence_instances          (definition_id, subject_entity_type?, subject_entity_id?, status, started_at/by, completed_at, cancelled_at/by/reason, version)
  ├─ sequence_step_instances     (instance_id, step_key, status, ready_at, started_at, completed_at, completed_by, dwell_expires_at, dwell_fired_at)
  ├─ sequence_gate_instances     (instance_id, step_key, gate_key, verdict, last_evaluated_at, reason, cleared_at/by, overridden_at/by/reason)
  └─ sequence_events (append-only) (instance_id, step_key?, gate_key?, type, payload_json, occurred_at, actor_user_id)
sequence_resource_clocks    (resource_type, resource_id, expires_at, expiry_action, escalate_role?, fired_at, note)  ← keyed by RESOURCE, travels with it
```

Enums: `SequenceDefinitionStatus` {Draft, Published, Retired}; `SequenceInstanceStatus`
{Running, Completed, Cancelled}; `SequenceStepStatus` {Pending, Ready, InProgress, Complete, Skipped};
`SequenceGateVerdict` {Unknown, Go, NoGo}; `SequenceJoinPolicy` {All, Any};
`SequenceGateSourceType` {ManualClearance, TimeWindow, ResourceClock, Approval, Custom};
`SequenceExpiryAction` {Block, Flag, Escalate}; `SequenceEventType` (see code).

Gate config (`config_json`) per source type:
* `ManualClearance`: `{ "requiredRole": "Inspector"? }`
* `TimeWindow`: `{ "notBefore": iso?, "notAfter": iso? }` — Go inside the window
* `ResourceClock`: `{ "resourceType": "Lot", "resourceId": 42 }` or `{ "fromSubject": true }` — Go while the resource's clock is unexpired
* `Approval`: `{ "entityType": "...", "entityId": n }` or `{ "fromSubject": true }` — Go when a terminal *approved* `ApprovalRequest` exists
* `Custom`: `{ "key": "materials-ready", ... }` — resolved via a registered `IGateSource` with `CustomKey == key`; **unknown key = NoGo with reason** (fail closed)

## 3. Engine (pure, `forge.core/Sequences/`)

* `SequenceNet` — immutable graph from a definition; `SequenceNetValidator` rejects: duplicate keys,
  dangling edges, non-rework cycles, unreachable steps, no start step, gates on unknown steps.
* `SequenceEvaluator.Evaluate(net, marking, verdicts, now)` → `SequenceEvaluation`
  (step transitions, gate verdict changes, events, `IsComplete`). Rules:
  1. gate verdicts are applied to gate instances (Overridden gates stay Go);
  2. a Pending step becomes Ready when its join predicate over predecessors' Complete/Skipped is
     satisfied **and** every gate is Go; a Ready step whose gate turns NoGo returns to Pending
     (Blocked = derived: predecessors satisfied ∧ ¬all-gates-Go);
  3. instance is Complete when every step is Complete/Skipped;
  4. dwell clocks: `dwell_expires_at` = `started_at + max_dwell`; expiry is fired by the job, not the evaluator.
* `IGateSource` (core interface): `SequenceGateSourceType SourceType`, `string? CustomKey`,
  `Task<SequenceGateVerdictResult> EvaluateAsync(SequenceGateContext, CancellationToken)`.
  Built-in implementations live in `forge.api/Features/Sequences/GateSources/` (they read the db);
  the core stays reference-free.

## 4. API (`SequencesController`, `[RequiresCapability("CAP-CROSS-SEQUENCES")]`)

Definitions: `GET /definitions`, `GET /definitions/{id}`, `POST /definitions` (draft, whole graph),
`PUT /definitions/{id}` (draft only, whole graph), `POST /definitions/{id}/publish`,
`POST /definitions/{id}/new-version` (copy → draft v+1), `DELETE /definitions/{id}` (retire/soft).
Instances: `POST /instances` (start), `GET /instances?entityType&entityId&status`, `GET /instances/{id}`
(marking incl. blocked reasons), `GET /instances/{id}/events`, `POST /instances/{id}/reevaluate`,
`POST /instances/{id}/cancel`, `POST /instances/{id}/rework`,
`POST /instances/{id}/steps/{stepKey}/start|complete|skip`,
`POST /instances/{id}/gates/{stepKey}/{gateKey}/clear|override`.
Clocks: `GET/POST /resource-clocks`, `DELETE /resource-clocks/{id}`.

Every mutating handler writes an `ActivityLog` row against the subject entity (indexing-points rule)
and appends `SequenceEvent`s. Domain events published: `SequenceStepReadyEvent`,
`SequenceInstanceCompletedEvent`, `SequenceClockExpiredEvent` (carries action + escalate role) —
notification/andon reactions are the consumers' business.

## 5. Consumers (first two, on purpose)

Not built in this pass — the engine ships with generic sources; these are the intended first users
and the reason `Custom` exists:
1. **Forge routing gates** — a job's operations as steps; `Custom:materials-ready` (BOM issued /
   on hand) + `ManualClearance` (first-article inspection) + `ResourceClock` on perishable lots.
2. **Construction permits/inspections** — permit → rough-in → inspection → close; `Approval` for
   sign-offs, `TimeWindow` for permit validity.

## 6. What it isn't

Not scheduling/capacity, not a rules engine, not a UI (API-only in this pass; forge-ui screens are
a follow-up), not task management. It does not migrate in-flight instances across definition versions.

## 7. Implementation record

See `IMPLEMENTATION.md` in this folder (files touched, tests, open questions).
