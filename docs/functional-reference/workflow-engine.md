# Workflow Engine

## Overview

The Workflow Engine is the shared substrate behind every multi-step entity creation or refinement flow in QB Engineer. It hosts the data model, lifecycle handlers, predicate-driven readiness validation, and an entity-agnostic Angular shell that lets any entity type wire a guided wizard or a single-page express form against the same primitives.

In production today the engine drives Part creation (14 combo-specific definitions across the Make / Buy / Subcontract / Phantom procurement axis). The substrate is built to extend to Customer, Quote, Vendor, ECO, supplier-qualification and other entity types by registering three small per-type adapters and a set of seed rows.

This document is a developer reference for extending the engine. For the design history that produced these decisions, see:

- `docs/workflow-pattern.md` -- original D1-D6 design decisions, costing-tier story
- `docs/workflow-pattern-expansion.md` -- multi-entity expansion design

---

## Concept

There are four primary nouns:

| Noun | Storage | What it is |
|------|---------|-----------|
| Workflow definition | `workflow_definitions` table (data, seeded) | Stable id (e.g. `part-make-subassembly-v1`), entity type, default mode, ordered step list as JSON |
| Workflow run | `workflow_runs` table | One row per in-flight or completed user attempt at running a definition against a single primary entity |
| Workflow step | JSON inside `WorkflowDefinition.StepsJson` | An ordered position in a definition: id, label key, component name, required flag, list of completion gate ids |
| Entity readiness validator | `entity_readiness_validators` table (data, seeded) | A named predicate (`hasBom`, `hasCost`, etc.) the engine evaluates against an entity instance to decide whether a step's completion gates pass |

The shape boils down to: **a definition is a list of steps; each step references one or more validator ids; a run is a pointer through that step list against one entity row; the entity exists in the normal database from step 1 (status = `Draft`) and gets promoted to `Active` when the run completes.**

Step completion is **not** stored on the run row. It is derived per-page-load by evaluating each step's `completionGates` against the live entity. This is decision D6 from `docs/workflow-pattern.md` and it is what makes admin re-authoring of validators safe -- the next time anyone loads the run, the answer is recomputed from current entity state.

### Polymorphism

`WorkflowRun.EntityType` and `WorkflowRun.EntityId` are a polymorphic FK pair (no real foreign key). `WorkflowRunEntity` is a junction for cross-entity flows (e.g. an onboarding workflow that binds an `Employee` plus a set of `ComplianceFormSubmission` rows). The single-entity case uses just the `EntityType` / `EntityId` columns; multi-entity flows add junction rows with a `Role` label (`primary`, `tax-form`, etc.).

A unique index on `(EntityType, EntityId)` filtered to `EntityId IS NOT NULL` enforces "at most one in-flight run per entity row" (decision Q1).

---

## Lifecycle

### State diagram

```
            [POST /workflows]
                    |
                    v
         +---------------------+
   +---->|   active (no       |
   |     |   entity yet)      |
   |     |   EntityId = null  |
   |     |   DraftPayload set |
   |     +----------+---------+
   |                |
   |     [PATCH /workflows/{id}/step on first step]
   |                |
   |                v
   |     +---------------------+
   |     | active (entity      |
   +-----| materialized,       |--+
         | status='Draft')     |  |
         +-----+----+----------+  |
               |    |             |
   [jump]  [patchStep]  [setMode] |
               |    |             |
               v    v             |
              (loop back to active)
                    |
       +------------+------------+
       |            |            |
[POST .../complete] [POST .../abandon]
       |            |
       v            v
   +-------+    +----------+
   |       |    |          |
   |  done |    | abandoned|
   |       |    |          |
   +-------+    +----------+
   CompletedAt   AbandonedAt
   set; entity   set; entity
   promoted to   soft-deleted
   Active        if status was
                 still Draft
```

### Phases in detail

**1. Create the run (deferred materialization).** `POST /api/v1/workflows` writes a row to `workflow_runs` with `EntityId = null`. Any `initialEntityData` payload the client supplied is stashed verbatim as raw JSON in `DraftPayload`. The entity row is **not** created here. This avoids leaving "(Draft)" placeholder rows in the entity table when the user abandons before filling in basics.

Source: `Features/Workflows/Runs/StartWorkflowRun.cs`.

**2. First step patch -- materialize.** When `PATCH /api/v1/workflows/{id}/step` arrives and `EntityId` is still null, the handler asserts the patch targets the workflow's first step (anything else returns 409). It merges the stashed `DraftPayload` with the incoming `Fields` (incoming wins on collision), invokes the registered `IWorkflowEntityCreator` for the entity type, stamps the new entity id back onto the run, and inserts the `WorkflowRunEntity` junction row (`Role = "primary"`).

Source: `Features/Workflows/Runs/PatchWorkflowStep.cs` (the materialize-on-first-patch branch). Per-entity-type creator registered in `Program.cs` -- for Part, that's `PartWorkflowAdapter.CreateDraftAsync`.

**3. Subsequent step patches.** Every patch (including the first) runs the same field-applier flow after materialization: the registered `IWorkflowFieldApplier` writes the JSON payload into the entity row, then the handler re-evaluates the patched step's `completionGates`. If all gates pass and the patch targets the **current** step, the pointer advances. Re-patching an earlier already-completed step persists the field changes but leaves `current_step_id` where it is (decision D2 -- back-navigation never resets the cursor).

**4. Jump.** `PATCH /api/v1/workflows/{id}/jump` moves the cursor without applying field changes. Backward jumps are always allowed. Forward jumps require every step between current and target to have its completion gates satisfied; if any gate fails, the handler throws `WorkflowMissingValidatorsException` with the failing list scoped to the gates being skipped over (a 409 with the missing-validators envelope).

Source: `Features/Workflows/Runs/JumpWorkflow.cs`.

**5. Mode toggle.** `PATCH /api/v1/workflows/{id}/mode` flips between `express` and `guided`. Available at any point in an active run (decision D4). No data is lost -- the entity row stays as-is.

Source: `Features/Workflows/Runs/SetWorkflowMode.cs`.

**6. Complete.** `POST /api/v1/workflows/{id}/complete` is the authoritative gate. It re-loads the definition, computes the union of `CompletionGates` across all `Required` steps, runs `IEntityReadinessService.GetMissingValidatorsAsync` for the entity, and:

- If any required gate fails, throws `WorkflowMissingValidatorsException` -> 409 with the missing list.
- Otherwise, calls the registered `IWorkflowEntityPromoter.PromoteAsync(entityId, "Active")`, sets `CompletedAt`, and writes a `WorkflowCompleted` audit row.

Idempotent: a second complete on a finished run returns the existing run row. Cannot complete an abandoned run.

Source: `Features/Workflows/Runs/CompleteWorkflowRun.cs`.

**7. Abandon.** `POST /api/v1/workflows/{id}/abandon` sets `AbandonedAt` and `AbandonedReason`. If the entity row exists and is still in `status = Draft`, it is soft-deleted (`DeletedAt` set) via the field applier's `SoftDeleteIfDraftAsync`. Already-promoted entities are left alone -- abandoning a workflow against an existing live entity just walks away from the cursor. If the run never materialized an entity, there is nothing to clean up; the run row alone records the abandonment.

Source: `Features/Workflows/Runs/AbandonWorkflow.cs`.

### Pointer never resets

`current_step_id` is monotonic forward. Jumping back to step 2 does not rewind it; subsequent advances pick up from wherever the cursor currently sits. The shell's "highest reached index" is a session-only concept (`maxReachedIndex` signal in `WorkflowComponent`) used for pointer-based completion fallback (see `Validators / completeness` below) and is not persisted server-side.

---

## Defining a Workflow

Every workflow definition is a row in `workflow_definitions` with these columns (entity at `qb-engineer-server/qb-engineer.core/Entities/WorkflowDefinition.cs`):

| Column | Notes |
|--------|-------|
| `DefinitionId` | Stable kebab-case id with `-vN` suffix. Validator: `^[a-z][a-z0-9-]*$`, max 64 chars. In-flight runs stay pinned on the version they started with (decision Q2) -- bump the version suffix to ship a redesign. |
| `EntityType` | Free-string, e.g. `"Part"`. Must match the registered creator/applier/promoter for that type. |
| `DefaultMode` | `"express"` or `"guided"`. New runs use this when the client doesn't override `mode`. |
| `StepsJson` | Ordered JSON array of step objects, stored as `jsonb`. See shape below. Max 64 KB. |
| `ExpressTemplateComponent` | Optional Angular component name (e.g. `"PartExpressFormComponent"`) the shell mounts in express mode. |
| `IsSeedData` | Set to `true` when the row was inserted by `WorkflowSubstrateSeeder`. The admin update endpoint allows changes to seeded rows but the seeder also keeps reasserting its values on every restart. |

### Step shape

Each element in `StepsJson` is a `WorkflowStepDefinition` (`qb-engineer-server/qb-engineer.core/Models/WorkflowStepDefinition.cs`):

```json
{
  "id": "basics",
  "labelKey": "workflow.parts.steps.basics",
  "componentName": "PartBasicsStepComponent",
  "required": true,
  "completionGates": ["hasBasics"]
}
```

| Field | Notes |
|-------|-------|
| `id` | Step id, unique within the definition. Used in URL `?step=` param and as the patch target. |
| `labelKey` | i18n key for the rail label (e.g. shown in the steps carousel). Render via the `translate` pipe. |
| `componentName` | String key the Angular shell looks up in `WorkflowStepRegistryService`. Maps to a concrete Angular component class registered by the feature module. |
| `required` | When false, the shell shows a Skip button and `CompleteWorkflowRun` ignores this step's gates. |
| `completionGates` | Array of `validatorId` strings. ALL must pass for the step to count as complete. Empty list means "no automatic completion check" -- the shell falls back to a pointer-based completion (visited == complete). |

### Authoring flow

The seeded built-in definitions are inlined as C# constants in `qb-engineer-server/qb-engineer.api/Workflows/WorkflowSeedData.cs`. New seeded definitions are added there as another `DefinitionSeed` record:

```csharp
public static IReadOnlyList<DefinitionSeed> PartWorkflowDefinitions { get; } =
[
    new(
        DefinitionId: "part-make-subassembly-v1",
        EntityType: "Part",
        DefaultMode: "guided",
        StepsJson: BuildMakeSubassemblyStepsJson(),
        ExpressTemplateComponent: "PartExpressFormComponent"),
    // ...
];

private static string BuildMakeSubassemblyStepsJson() => """
[
  {"id":"basics","labelKey":"workflow.parts.steps.basics","componentName":"PartBasicsStepComponent","required":true,"completionGates":["hasBasics"]},
  {"id":"bom","labelKey":"workflow.parts.steps.bom","componentName":"PartBomStepComponent","required":true,"completionGates":["hasBom"]},
  {"id":"routing","labelKey":"workflow.parts.steps.routing","componentName":"PartRoutingStepComponent","required":true,"completionGates":["hasRouting"]},
  {"id":"costing","labelKey":"workflow.parts.steps.costing","componentName":"PartCostingStepComponent","required":true,"completionGates":["hasCost"]},
  {"id":"quality","labelKey":"workflow.parts.steps.quality","componentName":"PartQualityStepComponent","required":false,"completionGates":[]},
  {"id":"alternates","labelKey":"workflow.parts.steps.alternates","componentName":"PartAlternatesStepComponent","required":false,"completionGates":[]}
]
""".Replace("\r", "").Replace("\n", "").Replace("  ", "");
```

The whitespace strip keeps the seeded JSON identical to the canonical form so the seeder's "did this row change?" check is deterministic.

Admin-authored (non-seeded) definitions are created via `POST /api/v1/workflow-definitions` with `IsSeedData = false`. The route is admin-only.

### Built-in definitions today

Fourteen Part definitions cover the 11 viable (procurement x inventory_class) combos plus three express variants. They are inlined in `WorkflowSeedData.PartWorkflowDefinitions`:

| Definition | Combo |
|-----------|-------|
| `part-buy-raw-v1` | Buy + Raw |
| `part-buy-component-v1` | Buy + Component |
| `part-buy-subassembly-v1` | Buy + Subassembly |
| `part-buy-finishedgood-v1` | Buy + FinishedGood (resold) |
| `part-buy-consumable-v1` | Buy + Consumable |
| `part-buy-tool-v1` | Buy + Tool |
| `part-make-component-v1` | Make + Component |
| `part-make-subassembly-v1` | Make + Subassembly |
| `part-make-finishedgood-v1` | Make + FinishedGood |
| `part-make-tool-v1` | Make + Tool |
| `part-subcontract-component-v1` | Subcontract + Component |
| `part-subcontract-subassembly-v1` | Subcontract + Subassembly |
| `part-phantom-subassembly-v1` | Phantom + Subassembly |
| `part-phantom-finishedgood-v1` | Phantom + FinishedGood (configure-to-order) |

The two transitional aliases (`part-assembly-guided-v1`, `part-raw-material-express-v1`) were retired pre-beta; `WorkflowSubstrateSeeder.CleanupRetiredAliasesAsync` soft-deletes them on every startup.

---

## Step Types

The engine itself does not distinguish step "types" -- every step is the same shape. The variety comes from which Angular component the step's `componentName` binds to. By convention there are four practical buckets:

1. **Materialize step (always step 0).** Owns the fields the entity creator needs to materialize the row. For Part this is `PartBasicsStepComponent` writing name, description, three axes. The first patch against this step is what triggers `IWorkflowEntityCreator.CreateDraftAsync`.
2. **Field-edit steps.** Plain reactive forms that PATCH a small bag of scalar fields onto the entity. Most steps. Examples: `PartInventoryStepComponent`, `PartCostingStepComponent`.
3. **Sub-entity steps.** Edit a child collection (BOM lines, operations) via that collection's existing endpoints rather than the workflow patch endpoint. Example: `PartBomStepComponent` writes through `/api/v1/parts/{id}/bom-entries`. The workflow patch endpoint is bypassed entirely; the shell still owns the rail and footer.
4. **Acknowledge / display-only steps.** No persistent state. The save callback registered with `WorkflowService.registerStepForm` is omitted; `saveCurrentStep()` resolves immediately. Useful for review screens or "you are about to..." gates.

### Step component contract

Every step component receives a fixed input bag from the shell (`WorkflowComponent.stepInputs`):

| Input | Meaning |
|-------|---------|
| `stepId` | The step's id from the definition. Pass back to `patchStep` as the target. |
| `componentName` | The same string used to look up this component. |
| `runId` | Current run id, or `null` if no run. |
| `entityId` | Materialized entity id, or `null` if the run hasn't materialized yet. |
| `entity` | The currently loaded entity object, or `null`. Whatever shape the entity adapter returns -- typed at the feature layer. |
| `readonly` | True when the shell is mounted in read-only mode (history view, audit). Components must honor by disabling form controls. |

In return the step is expected to call `WorkflowService.registerStepForm(form, labels, save?)` from its constructor and `unregisterStepForm()` from its `destroyRef.onDestroy`. The shell uses the form's `valid` / `dirty` / violations to gate Continue and to feed the shared `<app-validation-button>` popover.

### Component registry

Step components are mapped to their string keys at feature-module load:

```typescript
// qb-engineer-ui/src/app/features/parts/workflow/register-part-workflow-steps.ts
export function providePartWorkflowSteps(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const registry = inject(WorkflowStepRegistryService);
    registry.register('PartBasicsStepComponent', PartBasicsStepComponent);
    registry.register('PartBomStepComponent', PartBomStepComponent);
    // ...
    registry.registerExpress('PartExpressFormComponent', PartExpressFormComponent);
  });
}
```

Wired into the parts route via `providers: [providePartWorkflowSteps()]` so it runs exactly once when the user lands on `/parts`.

If the shell looks up a `componentName` that is not registered, it falls back to `WorkflowStepStubComponent` -- intentional during phased rollout so a definition can ship before all its components do.

Source: `qb-engineer-ui/src/app/shared/services/workflow-step-registry.service.ts`.

---

## Validators / Completeness

### EntityReadinessValidator

Validators are reusable named predicates stored in `entity_readiness_validators` (entity at `qb-engineer.core/Entities/EntityReadinessValidator.cs`). One row per `(EntityType, ValidatorId)`, predicate stored as `jsonb`:

| Column | Notes |
|--------|-------|
| `EntityType` | Same string used on definitions, e.g. `"Part"`. |
| `ValidatorId` | Stable id within the entity type, camelCase, e.g. `"hasBom"`. Referenced by `completionGates` in step JSON. |
| `Predicate` | The DSL predicate (JSON). Evaluated against the entity. |
| `ApplicabilityPredicate` | Optional second predicate. When non-null and false against the entity, the validator is skipped entirely (neither evaluated nor reported). Enables per-record rules like "HTS code only required when `internationalShipping = true`". |
| `DisplayNameKey` | i18n key for the validator's noun ("BOM", "Cost"). Used in admin lists. |
| `MissingMessageKey` | i18n key for the failure phrasing ("Add at least one BOM line"). Surfaced in the 409 envelope and the shell's per-step error alert. |
| `IsSeedData` | True when seeded; the seeder reasserts these on every restart. |

### Built-in Part validators

Seeded by `WorkflowSeedData.PartReadinessValidators`:

| ValidatorId | What it checks |
|-------------|----------------|
| `hasBasics` | `name`, `procurementSource`, `inventoryClass` all present |
| `hasBom` | `bomEntries` collection has >= 1 row |
| `hasRouting` | `operations` collection has >= 1 row |
| `hasCost` | Either `manualCostOverride` or `currentCostCalculationId` is present |
| `hasSourcing` | `preferredVendorId` is present |
| `hasInventory` | `stockUomId` is present |

Two intentionally-not-defined gates the seed data calls out: `hasVendorParts` (Part lacks a navigation collection to `VendorPart` so `relationExists` would always be false) and `hasQuality` (`TraceabilityType` is a non-nullable enum defaulting to `None`, so `fieldPresent` cannot tell intentional-`None` from untouched-default). Steps that cite these as gates fall back to pointer-based completion in the shell.

### Predicate DSL

Both the C# evaluator (`qb-engineer.api/Workflows/PredicateEvaluator.cs`) and the Angular twin (`qb-engineer-ui/src/app/shared/services/predicate-evaluator.ts`) implement the same v1 operator surface. There is a drift test (`predicate-drift-fixtures.spec.ts` on the client) that runs the same fixtures through both to keep them in sync.

| Operator | Schema | Meaning |
|----------|--------|---------|
| `fieldPresent` | `{ "type":"fieldPresent", "field":"<name>" }` | Field is non-null and (for strings) non-whitespace. |
| `fieldEquals` | `{ "type":"fieldEquals", "field":"<name>", "value":<json> }` | Strict equality. |
| `fieldCompare` | `{ "type":"fieldCompare", "field":"<name>", "op":"gt\|lt\|gte\|lte\|eq\|ne", "value":<json> }` | Numeric comparison. |
| `relationExists` | `{ "type":"relationExists", "relation":"<name>", "minCount":1 }` | Collection length >= minCount (default 1). |
| `relationCountCompare` | `{ "type":"relationCountCompare", "relation":"<name>", "op":"...", "value":<int> }` | Compare collection length. |
| `all` | `{ "type":"all", "of":[ ...predicates ] }` | All children true. |
| `any` | `{ "type":"any", "of":[ ...predicates ] }` | Any child true. |
| `not` | `{ "type":"not", "of": <predicate> }` | Negate. |
| `custom` | `{ "type":"custom", "ref":"<key>", ... }` | Registry lookup; v1 returns false-with-warning when not registered. |

Field names use camelCase; the C# evaluator title-cases the first character before reflecting against the entity (`"name"` -> `"Name"`). Unknown fields and unknown operators short-circuit to `false` with a single logged warning -- the evaluator never throws.

The custom-function registry (`IPredicateCustomFunctionRegistry` server-side, the `PredicateEvaluator` constructor-arg client-side) is the escape hatch for predicates that are awkward to express in the DSL. The shipped registry is empty.

### Loaders

`IEntityReadinessService.GetMissingValidatorsAsync(entityType, entityId, ct)` orchestrates loading + evaluation. It depends on `IEntityReadinessLoader` -- one implementation per entity type that knows how to `Include()` whatever relations the predicates need. For Part:

```csharp
// qb-engineer.api/Workflows/PartReadinessLoader.cs
public Task<object?> LoadAsync(int entityId, CancellationToken ct) =>
    db.Parts.AsNoTracking()
        .Include(p => p.BOMEntries)
        .Include(p => p.Operations)
        .FirstOrDefaultAsync(p => p.Id == entityId, ct);
```

When no loader is registered for the requested entity type, the service treats every validator as failing and logs a warning -- the call surfaces a clean error rather than silently passing.

### Where completeness is computed

| Tier | Code | Purpose |
|------|------|---------|
| Server | `EntityReadinessService.GetMissingValidatorsAsync` | Authoritative answer. Used by `CompleteWorkflowRun`, `JumpWorkflow` (forward jumps), `PromotePartStatus`. |
| Server | `PatchWorkflowStep.GatesPassAsync` | Re-evaluates the just-patched step's gates to decide whether to advance the cursor. |
| Client | `WorkflowService.stepCompletionMap` (computed signal) | Drives the rail's "complete" indicators. Mirrors server semantics including applicability. |
| Client | `WorkflowService.canCompleteRun` (computed signal) | Drives the Mark Complete button's enabled state. |
| Client | `WorkflowComponent.completionMap` | The shell's local copy with a pointer-based fallback layered on for steps with no `completionGates` (visited steps count as complete in-session). |

The "client checks before round-trip" pattern lets the user see a green check immediately when they fill in the last required field; the server still has the final word when `complete` posts.

---

## Resume + Drafts

### Resume sources

The user can resume an in-flight run from three places:

1. **Per-row indicator on the parts list.** `PartListResponseModel` includes a `pendingWorkflow: PendingWorkflowSummary | null` field populated by a LEFT JOIN in `PartRepository`. When non-null, the row renders a "Resume" button that routes to `/parts/{id}?workflow={definitionId}&step={currentStepId}&mode={mode}&runId={runId}`.
2. **"Drafts in progress" section above the parts list.** Loaded via `WorkflowService.listActive()` and filtered to `entityType === 'Part' && entityId == null`. These are runs that have been started but never completed step 1 -- they have no entity row to attach a per-row indicator to. Without this surface they would be unfindable.
3. **Post-login soft prompt.** `WorkflowResumeService.checkAfterLogin()` -- called from `AppComponent.ngOnInit()` after auth -- fetches active runs, filters to those with `lastActivityAt` within the last 24 hours, and opens `WorkflowActiveListDialogComponent` if any qualify. Idempotent per session (`hasShownThisSession` flag).

The shared dialog (`shared/components/workflow-active-list/workflow-active-list-dialog.component.ts`) lists every active run for the current user. Clicking one routes to its detail page (or `/{type}/new` for entity-less runs).

### URL as source of truth

Per the project-wide URL rule (`CLAUDE.md` -> "URL as Source of Truth"), workflow state lives in query params:

| Param | Meaning |
|-------|---------|
| `?workflow={definitionId}` | Toggles the workflow shell on the entity detail route. |
| `?step={stepId}` | Cursor position in guided mode. Updated on jump / advance / back. |
| `?mode=express\|guided` | Current presentation mode. Updated on toggle. |
| `?runId={n}` | Run id, used during the entity-less phase before deferred materialization stamps an entity id. |

The page parent (`PartWorkflowPageComponent`) reads these via `toSignal(route.queryParamMap.pipe(...))` and writes back via `router.navigate([], { queryParams: ..., queryParamsHandling: 'merge' })`.

When deferred materialization stamps an entity id mid-flow, an effect upgrades `/parts/new?runId=N` to `/parts/{id}?runId=N` via `replaceUrl: true` so refresh and back-nav land correctly.

### Save model

Each step component owns a reactive form. On mount it registers the form with `WorkflowService.registerStepForm(form, labels, save?)` -- the `save` callback returns an `Observable<unknown>` that the shell parent invokes via `saveCurrentStep()` before any navigation event (Continue / Back / Jump / Mark Complete).

This explicit save-on-Continue model replaced an earlier debounced-on-valueChanges auto-save that was flapping on server-normalized values (trailing whitespace deleted, casing folded, etc.) and producing duplicate audit rows. Auto-save is **not** in use; the only persistence trigger is an explicit shell navigation.

The Skip button is the one exception -- it intentionally bypasses save because the user is choosing to discard whatever they typed in an optional step.

### Relationship to the global Draft system

The `DraftService` / IndexedDB form-draft system (CLAUDE.md -> "Form Draft / Unsaved Changes System") is a separate concern. Workflow runs are server-side persistence; form drafts are client-side recovery from browser crash / forced logout / token expiry. They coexist: a workflow run can have an unsaved client-side draft of the current step's form sitting in IndexedDB, and the resume flows are independent.

---

## API Surface

### Workflow run endpoints

Base: `/api/v1/workflows`. All endpoints require any authenticated caller; admin role is only required for definition / validator authoring.

Source: `qb-engineer.api/Controllers/WorkflowsController.cs`.

| Method | Path | Description | Request | Response |
|--------|------|-------------|---------|----------|
| `POST` | `/` | Start a new run | `StartWorkflowRunRequestModel` | 201 + `WorkflowRunResponseModel` |
| `GET` | `/{runId:int}` | Fetch one run | -- | 200 + `WorkflowRunResponseModel` |
| `GET` | `/active` | Current user's in-flight runs (resume targets) | -- | 200 + `WorkflowRunResponseModel[]` |
| `PATCH` | `/{runId:int}/step` | Apply step fields and (if gates pass) advance | `PatchWorkflowStepRequestModel` | 200 + run |
| `PATCH` | `/{runId:int}/jump` | Jump to a different step | `JumpWorkflowRequestModel` | 200 + run |
| `POST` | `/{runId:int}/complete` | Mark complete -- run readiness gate, promote entity status | -- | 200 + run, OR 409 with missing-validators envelope |
| `POST` | `/{runId:int}/abandon` | Abandon -- soft-delete the entity if still Draft | `AbandonWorkflowRequestModel` | 200 + run |
| `PATCH` | `/{runId:int}/mode` | Toggle express <-> guided | `SetWorkflowModeRequestModel` | 200 + run |

#### StartWorkflowRunRequestModel

```typescript
{
  entityType: string;       // e.g. "Part"
  definitionId: string;     // e.g. "part-make-subassembly-v1"
  mode?: "express" | "guided"; // overrides definition default
  initialEntityData?: object;  // arbitrary jsonb stashed in DraftPayload
}
```

#### PatchWorkflowStepRequestModel

```typescript
{
  stepId: string;   // must match a step.id in the pinned definition
  fields: object;   // entity-type-interpreted JSON payload
}
```

#### WorkflowRunResponseModel

```typescript
{
  id: number;
  entityType: string;
  entityId: number | null;        // null until first patch materializes
  definitionId: string;
  currentStepId: string | null;
  mode: "express" | "guided";
  startedAt: string;              // ISO datetime
  startedByUserId: number;
  completedAt: string | null;
  abandonedAt: string | null;
  abandonedReason: string | null;
  lastActivityAt: string;
  version: number;                // optimistic concurrency token
}
```

#### Missing-validators 409 envelope

When `complete` or `jump` (forward) fails because gates aren't satisfied, the response body is:

```json
{
  "status": 409,
  "title": "Readiness validators not satisfied",
  "detail": "...",
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.10",
  "code": "workflow-readiness-missing",
  "missing": [
    { "validatorId": "hasBom", "displayNameKey": "validators.parts.hasBom", "missingMessageKey": "validators.parts.hasBomMissing" }
  ]
}
```

The envelope is built by `ExceptionHandlingMiddleware.cs` from `WorkflowMissingValidatorsException`. The client renders missing entries by translating `missingMessageKey` for the human "needs name + material + ..." prose and `displayNameKey` for the gate name.

### Workflow definition endpoints

Base: `/api/v1/workflow-definitions`. Reads open to authenticated; writes admin-only.

Source: `qb-engineer.api/Controllers/WorkflowDefinitionsController.cs`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/?entityType={type}` | any | List, optional entityType filter |
| `GET` | `/{definitionId}` | any | Fetch one |
| `POST` | `/` | Admin | Create (rejects if `definitionId` exists) |
| `PUT` | `/{definitionId}` | Admin | Update -- `DefinitionId` and `EntityType` are immutable |
| `DELETE` | `/{definitionId}` | Admin | Soft-delete |

`POST` and `PUT` validate `StepsJson` is well-formed JSON array, max 64 KB, and `definitionId` matches `^[a-z][a-z0-9-]*$` (recommend `-vN` suffix).

### Entity validator endpoints

Base: `/api/v1/entity-validators`. Reads open to authenticated; writes admin-only.

Source: `qb-engineer.api/Controllers/EntityValidatorsController.cs`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/?entityType={type}` | any | List, optional entityType filter |
| `GET` | `/{id:int}` | any | Fetch one by surrogate id |
| `POST` | `/` | Admin | Create -- (entityType, validatorId) unique |
| `PUT` | `/{id:int}` | Admin | Update -- `EntityType` and `ValidatorId` immutable |
| `DELETE` | `/{id:int}` | Admin | Soft-delete -- refuses if any non-deleted definition for the same entity type references the validator id (string match against `StepsJson`); also refuses seeded rows by default (admin must override `IsSeedData` first) |

**These endpoints are NOT capability-gated.** The substrate is foundational and gating it would create a chicken-and-egg with the workflow capability itself.

### Per-entity promote endpoint

The workflow's Mark Complete and the entity detail page's "Promote to Active" button delegate to the same per-entity handler so there is no duplicate completion logic:

```
POST /api/v1/parts/{id}/promote-status
Body: { "targetStatus": "Active" | "Obsolete" | "Prototype" }
```

When the user has an in-flight workflow run against the part, the handler scopes the readiness check to that run's required-step gates only -- preventing global validators outside the run's scope (e.g. `hasSourcing` on a Make+Subassembly part) from blocking promotion. On success, both the entity status flip and the workflow's `CompletedAt` are written in the same SaveChanges.

Source: `qb-engineer.api/Features/Parts/PromoteStatus/PromotePartStatus.cs`.

---

## UI Integration

### The shell

`<app-workflow>` (`qb-engineer-ui/src/app/shared/components/workflow/workflow.component.ts`) is the entity-agnostic shell. It accepts inputs (`run`, `definition`, `entity`, `validators`, `entityTitle`, `missingValidators`, `readonly`) and emits typed events (`stepJumped`, `modeChanged`, `stepAdvanced`, `stepBacked`, `stepSkipped`, `completeRequested`, `closed`).

Per-feature parents own the HTTP wiring: read URL params, call `WorkflowService` methods, write back to URL on success, push results into the shell's signals. The shell never imports a feature service.

Layout (per the comment block at the top of `workflow.component.html`):

```
+----------------------------------------------------------+
| RAW-00046                  [mode toggle] [?] | x         |  <- header
+----------------------------------------------------------+
| (1) Basics > (2) Sourcing > (3) Vendor > (4) Inventory > |  <- steps carousel
+----------------------------------------------------------+
| step component (full-width form column)                  |
|                                                          |
| +-- footer (Back . Skip . Continue) ------------------+  |
+----------------------------------------------------------+
```

The horizontal steps carousel replaced an earlier 240px left rail (refactored 2026-05-05 to free dialog width). Step indicators: completed -> check icon, current -> primary-tinted pill with index, future -> lock icon, error -> red exclamation.

The "?" icon opens an `<app-slideout>` rationale sidecar overlaying the right edge of the step content. Rationale text is resolved from `{entityTypePlural}.workflow.{stepId}.rationale` i18n key; the icon is hidden when no translation exists. Auto-dismisses on any step jump or mode toggle (transient by design).

In express mode the carousel is hidden and the entire body is one consolidated form (the registered `expressTemplateComponent`). The express component owns its own Save button.

### Shell + service responsibilities

| Concern | Owner |
|---------|-------|
| HTTP calls (start, patch, jump, complete, abandon, mode) | `WorkflowService` |
| Step component instantiation by string key | `WorkflowStepRegistryService` + `*ngComponentOutlet` |
| Per-step form lifecycle, save callback, Continue gating | `WorkflowService.registerStepForm` / `saveCurrentStep` |
| Step completion derivation (predicate + pointer fallback) | `WorkflowComponent.completionMap` |
| URL <-> state sync, save-then-navigate orchestration | Per-feature parent (e.g. `PartWorkflowPageComponent`) |
| Resume soft-prompt after login | `WorkflowResumeService` |
| Active-runs dialog | `WorkflowActiveListDialogComponent` |

### Pending-workflow indicator on list rows

Pages that display entities subject to workflows include a `pendingWorkflow: PendingWorkflowSummary | null` field on their list response model:

```typescript
interface PendingWorkflowSummary {
  runId: number;
  definitionId: string;
  currentStepId: string | null;
  mode: "express" | "guided";
  lastActivityAt: string;
}
```

For Part this is computed via a single LEFT JOIN in `PartRepository` (no extra round-trip per row). The list cell renders a "Resume" affordance when the field is non-null.

---

## Adding a New Workflow -- Concrete Walkthrough

Hypothetical: a "Supplier Qualification" workflow on the `Vendor` entity.

### 1. Confirm the entity supports the substrate

Required:

- A `status` field on the entity that includes `Draft` and `Active` values.
- A repository / service that can create the row in `Draft` and flip it to `Active`.
- A way to soft-delete (BaseEntity.DeletedAt).

If the entity doesn't yet have a `Draft` status, that is a separate refactor -- not workflow-engine work.

### 2. Implement the three adapter interfaces

For Vendor, write a single class implementing all three (mirrors `PartWorkflowAdapter`):

```csharp
// qb-engineer.api/Workflows/VendorWorkflowAdapter.cs
public class VendorWorkflowAdapter(AppDbContext db, IVendorRepository repo)
    : IWorkflowEntityCreator, IWorkflowFieldApplier, IWorkflowEntityPromoter
{
    public string EntityType => "Vendor";

    public async Task<int> CreateDraftAsync(JsonElement? initialData, CancellationToken ct) {
        // Read fields from initialData, build Vendor with status=Draft, db.Vendors.Add(v),
        // SaveChanges, return v.Id.
    }

    public async Task ApplyAsync(int entityId, JsonElement fields, CancellationToken ct) {
        // Load vendor, patch known fields, SaveChanges.
    }

    public async Task<bool> SoftDeleteIfDraftAsync(int entityId, CancellationToken ct) {
        // Soft-delete only if status is still Draft.
    }

    public async Task<bool> PromoteAsync(int entityId, string targetStatus, CancellationToken ct) {
        // Flip Vendor.Status from Draft to the requested target.
    }
}
```

Register in `Program.cs` (mirrors the Part block):

```csharp
builder.Services.AddScoped<VendorWorkflowAdapter>();
builder.Services.AddScoped<IWorkflowEntityCreator>(sp => sp.GetRequiredService<VendorWorkflowAdapter>());
builder.Services.AddScoped<IWorkflowFieldApplier>(sp => sp.GetRequiredService<VendorWorkflowAdapter>());
builder.Services.AddScoped<IWorkflowEntityPromoter>(sp => sp.GetRequiredService<VendorWorkflowAdapter>());
```

### 3. Implement the readiness loader

Per-entity-type loader that pulls the entity with whatever relations the predicates need:

```csharp
// qb-engineer.api/Workflows/VendorReadinessLoader.cs
public class VendorReadinessLoader(AppDbContext db) : IEntityReadinessLoader
{
    public string EntityType => "Vendor";
    public async Task<object?> LoadAsync(int entityId, CancellationToken ct) =>
        await db.Vendors.AsNoTracking()
            .Include(v => v.Contacts)
            .Include(v => v.Certifications)
            .FirstOrDefaultAsync(v => v.Id == entityId, ct);
}
```

Register in `Program.cs`:

```csharp
builder.Services.AddScoped<IEntityReadinessLoader, VendorReadinessLoader>();
```

### 4. Author validators (seed)

Add validator seeds to `WorkflowSeedData` (or break out a `WorkflowSeedDataVendor.cs` if the file is getting big):

```csharp
public static IReadOnlyList<ValidatorSeed> VendorReadinessValidators { get; } =
[
    new(
        ValidatorId: "hasBasics",
        Predicate: """{"type":"all","of":[{"type":"fieldPresent","field":"name"},{"type":"fieldPresent","field":"taxId"}]}""",
        DisplayNameKey: "validators.vendors.hasBasics",
        MissingMessageKey: "validators.vendors.hasBasicsMissing"),
    new(
        ValidatorId: "hasContact",
        Predicate: """{"type":"relationExists","relation":"contacts","minCount":1}""",
        DisplayNameKey: "validators.vendors.hasContact",
        MissingMessageKey: "validators.vendors.hasContactMissing"),
    new(
        ValidatorId: "hasW9",
        Predicate: """{"type":"fieldEquals","field":"w9OnFile","value":true}""",
        DisplayNameKey: "validators.vendors.hasW9",
        MissingMessageKey: "validators.vendors.hasW9Missing"),
];
```

Update `WorkflowSubstrateSeeder.SeedValidatorsAsync` to also iterate `VendorReadinessValidators` (or add a parallel seed method).

### 5. Author the definition (seed)

```csharp
new DefinitionSeed(
    DefinitionId: "vendor-qualification-v1",
    EntityType: "Vendor",
    DefaultMode: "guided",
    StepsJson: """
    [
      {"id":"basics","labelKey":"workflow.vendors.steps.basics","componentName":"VendorBasicsStepComponent","required":true,"completionGates":["hasBasics"]},
      {"id":"contacts","labelKey":"workflow.vendors.steps.contacts","componentName":"VendorContactsStepComponent","required":true,"completionGates":["hasContact"]},
      {"id":"w9","labelKey":"workflow.vendors.steps.w9","componentName":"VendorW9StepComponent","required":true,"completionGates":["hasW9"]}
    ]
    """.Replace("\r","").Replace("\n","").Replace("  ",""),
    ExpressTemplateComponent: "VendorExpressFormComponent")
```

### 6. Build the Angular step components

Each component implements the step contract: declare the input bag, build the reactive form, register with `WorkflowService.registerStepForm`, persist via `workflowService.patchStep` in the save callback, refetch the entity into `currentEntity`. Use `PartBasicsStepComponent` as a copy-paste template.

### 7. Register the step components

```typescript
// qb-engineer-ui/src/app/features/vendors/workflow/register-vendor-workflow-steps.ts
export function provideVendorWorkflowSteps(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const registry = inject(WorkflowStepRegistryService);
    registry.register('VendorBasicsStepComponent', VendorBasicsStepComponent);
    registry.register('VendorContactsStepComponent', VendorContactsStepComponent);
    registry.register('VendorW9StepComponent', VendorW9StepComponent);
    registry.registerExpress('VendorExpressFormComponent', VendorExpressFormComponent);
  });
}
```

Wire into the vendors route's `providers: [provideVendorWorkflowSteps()]`.

### 8. Build the parent page

Mirror `PartWorkflowPageComponent`: read `?workflow=`, `?step=`, `?mode=`, `?runId=` from the URL; load run + definition + validators + entity in a `forkJoin`; mount `<app-workflow>` with the loaded inputs; wire the shell's events to the WorkflowService methods; on success, redirect or refresh.

### 9. Add i18n keys

To `public/assets/i18n/en.json` (and parallel files):

- `workflow.vendors.steps.basics`, `.contacts`, `.w9` -- step labels
- `validators.vendors.hasBasics`, `.hasBasicsMissing`, etc. -- gate labels and messages
- Optional: `vendors.workflow.basics.rationale`, `.contacts.rationale`, `.w9.rationale` -- "?" sidecar text

Server-supplied keys (workflow step `labelKey`s and validator `DisplayNameKey` / `MissingMessageKey`) are auto-scanned by the `lint:i18n` script from `qb-engineer-server/qb-engineer.api/Workflows/*.cs` -- the script will fail if you ship the server-side strings without matching client keys.

### 10. Surface the resume affordance

Add a `pendingWorkflow: PendingWorkflowSummary | null` field to the vendor list response model and populate it in the vendor repository (LEFT JOIN on `workflow_runs` filtered to active runs of `EntityType = "Vendor"`). Render the Resume button on the list row.

### 11. Optional: seed an initial-data path

If users start the workflow from somewhere other than a generic "+ New Vendor" button (e.g. a "Qualify this lead's vendor" link), pass `initialEntityData` on `POST /api/v1/workflows` so the materialize step has fewer fields to ask about.

---

## Gotchas

These are behaviors that surprised the original implementers, captured from comments in the source. Read before extending.

**1. The entity row does not exist until the user submits step 1.** This is "deferred materialization" -- a hard-won decision after the original "create entity row at workflow start" approach left orphaned `(Draft) name` rows that polluted listings and inventory counts. Patch handlers other than the first-step materialize path will return 409 against a null entity. The materialize step **must** be step 0; the engine assumes this.

**2. The patch handler advances the cursor only when the patch targets the current step.** Re-patching an earlier completed step persists field changes but leaves `current_step_id` where it is. This was decision D2 -- back-navigation does not unwind progress. The shell relies on this to keep gateless steps marked complete after the user clicks back.

**3. `current_step_id` is monotonic forward server-side.** The `maxReachedIndex` "highest-step-visited" tracking that powers the pointer-based completion fallback for steps with no `completionGates` is **session-only client state** -- it resets on page refresh. Steps with no gates evaluate as not-complete on first mount of an old run until the user navigates past them again. The proper fix is option-A (declare predicate gates on every step), not server-side cursor history.

**4. The C# and TypeScript predicate evaluators must agree.** They are twin implementations; a drift test (`predicate-drift-fixtures.spec.ts`) runs the same fixtures through both. New operators or new corner-case behavior must land in both with matching semantics. Field name lookup walks PascalCase on the server (reflection) and camelCase on the client (direct property access) -- author predicates in camelCase to keep them portable.

**5. `applicabilityPredicate` skips a validator entirely when false.** It is **not** a "treat as failed" filter -- a non-applicable validator is excluded from the missing-validators reply. This is the mechanism for per-record rules like "HTS code only required when `internationalShipping = true`". Both tiers honor it; the client mirrors the server's behavior in `WorkflowComponent.completionMap`.

**6. Completion is scoped to the run's required gates -- not the entity-type's full validator set.** `CompleteWorkflowRun` and `PromotePartStatus` (when a workflow run is in flight) compute the union of `completionGates` from `Required` steps and check only those. A validator that is not gated by any required step in the active definition will not block promotion. This is intentional -- different definitions for the same entity type gate on different subsets (raw-material express only needs `hasBasics + hasCost`; assembly guided needs `hasBasics + hasBom + hasRouting + hasCost`).

**7. There are two intentionally-undefined gates today.** `hasVendorParts` (Part has no navigation to `VendorPart` so `relationExists` always returns false) and `hasQuality` (`TraceabilityType` is non-nullable enum defaulting to `None`, indistinguishable from "user picked None intentionally"). Steps that conceptually need these gates ship with empty `completionGates` and rely on the shell's pointer-based fallback. Adding either gate requires either a model refactor (add a Part navigation collection to VendorPart) or a different evaluator approach (`fieldEquals` for non-default).

**8. The seeder reasserts seeded rows on every restart.** If you tweak a seed value in C# the next restart will rewrite that field. The seeder also soft-deletes orphaned aliases (`RetiredAliasDefinitionIds`). Admin edits to seeded rows persist (the seeder respects `IsSeedData` and only fixes drift on the columns it knows about) but if the seed value changes, the seeder's value wins -- mark a row `IsSeedData = false` first if you need to free it from seeding.

**9. The `IsSeedData` flag does not block admin updates.** It only blocks the delete handler by default (`DeleteEntityValidatorHandler` refuses, requiring an admin to flip the flag first). Updates always go through; the seeder will reassert on next restart. This is friction-by-design -- the admin can experiment without breaking installs but the canonical state lives in the seed.

**10. Forward jumps over the gates of intermediate steps return 409.** The user cannot skip past a required incomplete step even if they know which step they want to jump to. The shell hides the rail buttons for those (`isClickable` returns false), but a hand-rolled API call would also be rejected. Backward jumps and same-step jumps are always allowed.

**11. The express component owns its own Save -- the shell does not show a footer in express mode.** Adding a shell-level Mark Complete in express mode would 409 with "entity not created yet" because the shell can't know what fields to materialize with. The express form component is responsible for posting `patchStep` (which materializes) and then `complete`.

**12. There is no admin UI for workflow definitions or validators today.** The endpoints exist (admin-only) but there is no page in the admin feature. Edits are made via direct API calls or by editing the seed data and restarting. (TODO: confirm if a UI is planned -- searched `features/admin` for "workflow" with no hits.)

**13. The validator-delete handler does a substring search of `StepsJson`.** It builds `"$"{validatorId}$""` and refuses delete if any non-deleted definition for the same entity type contains that string. This is "best effort" -- a validator id that is a substring of another id (`hasBom` vs `hasBomLines`) could cause a false-positive refuse. Validator ids are short and admin-controlled so it has not been a problem in practice, but a definition that references a no-longer-needed validator will block its delete until the definition is updated.

**14. `ValidationException` can fire from inside a creator.** `PartWorkflowAdapter.CreateDraftAsync` throws `FluentValidation.ValidationException` if `name` is missing. This bubbles out through `PatchWorkflowStepHandler` -> middleware -> 400 (not 409). The validators tier is for entity-state predicates; the creator's own input validation is a separate gate that runs first.

**15. The `completionGates` field references validator ids by string.** There is no FK from definitions to validators. A typo in a step's `completionGates` array silently means "this gate never passes" because the validator isn't found. There is no startup-time check.

---

## Related

- `docs/workflow-pattern.md` -- design history (D1 entity-from-step-1, D2 hybrid step ordering, D3 costing layers, D4 mode toggle, D5 abandonment, D6 entity-derived completion)
- `docs/workflow-pattern-expansion.md` -- multi-entity expansion design and per-type adoption notes
- `docs/coding-standards.md` -- Workflow Save-on-Continue section and the rationale for explicit save vs. debounced auto-save
- `docs/functional-reference/parts.md` -- the consumer of choice today; describes how the parts page surfaces in-flight runs
- `docs/functional-reference/database-schema.md` -- column-level reference for `workflow_definitions`, `workflow_runs`, `workflow_run_entities`, `entity_readiness_validators`
- `phase-4-output/part-type-field-relevance.md` -- the audit that produced the 14 combo-specific Part definitions and the readiness-gate scoping rules
- Source roots:
  - Server entities: `qb-engineer-server/qb-engineer.core/Entities/WorkflowDefinition.cs`, `WorkflowRun.cs`, `WorkflowRunEntity.cs`, `EntityReadinessValidator.cs`
  - Server runtime: `qb-engineer-server/qb-engineer.api/Workflows/` (services, adapters, predicate evaluator, seeder, audit events)
  - Server handlers: `qb-engineer-server/qb-engineer.api/Features/Workflows/Definitions/`, `.../Runs/`, `.../Validators/`
  - Server controllers: `WorkflowsController.cs`, `WorkflowDefinitionsController.cs`, `EntityValidatorsController.cs`
  - Client services: `qb-engineer-ui/src/app/shared/services/workflow.service.ts`, `workflow-resume.service.ts`, `workflow-step-registry.service.ts`, `predicate-evaluator.ts`
  - Client components: `qb-engineer-ui/src/app/shared/components/workflow/`, `qb-engineer-ui/src/app/shared/components/workflow-active-list/`
  - Part workflow wiring: `qb-engineer-ui/src/app/features/parts/workflow/` and `register-part-workflow-steps.ts`
