# Capability Gating

## Overview

Capability gating is a per-install feature-flag substrate that lets one codebase ship the same binaries to a 2-person trade shop, a 25-person job shop, an ISO-13485 medical-device manufacturer, and a 500-person enterprise. Each install has a different set of features turned on; the code itself is identical.

The system has **129 named capabilities** (e.g. `CAP-MD-CUSTOMERS`, `CAP-INV-LOTS`, `CAP-EXT-AI-ASSISTANT`) registered in a static catalog. Each capability's enabled state is stored in the `capabilities` table; controllers, MediatR commands, HTTP routes, and UI surfaces read that state to decide whether to surface a feature.

The canonical example of WHY this exists is the **accounting boundary**: an install can run with built-in lightweight invoicing/payments (`CAP-ACCT-BUILTIN`) OR with QuickBooks/Xero/Sage as the source of truth (`CAP-ACCT-EXTERNAL`), but never both. Capabilities make that mutual exclusion declarative and enforced at the gate layer instead of being scattered through `if (accountingService.isStandalone)` branches.

Profiles ship as **8 presets** (7 named + Custom) and a **22-question discovery wizard** that recommends one of them. The recommendation engine is stateless; applying a preset boils down to a single bulk-toggle of the capability set.

This doc is the developer reference. Design history (the "why we picked these 129", "why this preset shape", "why this question wording") lives in `phase-4-output/` — cited where relevant, not duplicated.

---

## Catalog

The authoritative list of capabilities lives at:

```
forge-api/forge.api/Capabilities/CapabilityCatalog.cs
```

It is a single static `IReadOnlyList<CapabilityDefinition>` with 129 rows. Every row carries:

| Field | Type | Purpose |
|-------|------|---------|
| `Code` | `string` | Stable ID, e.g. `CAP-MD-CUSTOMERS`. Format: `CAP-{AREA}-{NAME}`. Immutable once seeded. |
| `Area` | `string` | Functional area code (see table below). Drives admin grouping. |
| `Name` | `string` | Human display name. Stored in DB so the admin UI works without the catalog file. |
| `Description` | `string` | Catalog description (stored in DB; admin UI renders it). |
| `IsDefaultOn` | `bool` | True = enabled on a fresh install with no preset applied. **41 of 129 are default-on.** |
| `RequiresRoles` | `string?` | Optional CSV role gate for management. Currently only `CAP-IDEN-CAPABILITY-ADMIN` uses it (`"Admin"`). |

`CapabilityDefinition` is defined in `Capabilities/CapabilityDefinition.cs`.

### Functional areas

| Code | Area | Example capabilities |
|------|------|----------------------|
| `IDEN` | Identity / auth / users | `CAP-IDEN-AUTH-PASSWORD`, `CAP-IDEN-AUTH-MFA`, `CAP-IDEN-CAPABILITY-ADMIN` |
| `MD` | Master data | `CAP-MD-CUSTOMERS`, `CAP-MD-PARTS`, `CAP-MD-BOM`, `CAP-MD-VENDORS` |
| `P2P` | Procure-to-pay | `CAP-P2P-PO`, `CAP-P2P-RFQ`, `CAP-P2P-RECEIVE`, `CAP-P2P-SUBCONTRACT` |
| `O2C` | Order-to-cash | `CAP-O2C-QUOTE`, `CAP-O2C-SO`, `CAP-O2C-INVOICE`, `CAP-O2C-CASH` |
| `MFG` | Manufacturing | `CAP-MFG-WO-RELEASE`, `CAP-MFG-LABOR`, `CAP-MFG-COMPLETE`, `CAP-MFG-SHOPFLOOR` |
| `PLAN` | Planning | `CAP-PLAN-MRP`, `CAP-PLAN-MPS`, `CAP-PLAN-FORECAST`, `CAP-PLAN-CAPACITY` |
| `INV` | Inventory | `CAP-INV-CORE`, `CAP-INV-LOTS`, `CAP-INV-SERIALS`, `CAP-INV-CYCLECOUNT` |
| `QC` | Quality | `CAP-QC-INSPECTION`, `CAP-QC-NCR`, `CAP-QC-SPC`, `CAP-QC-RECALL` |
| `MAINT` | Maintenance | `CAP-MAINT-PM`, `CAP-MAINT-BREAKDOWN`, `CAP-MAINT-PREDICTIVE` |
| `ACCT` | Accounting | `CAP-ACCT-EXTERNAL`, `CAP-ACCT-BUILTIN`, `CAP-ACCT-FULLGL` |
| `HR` | Human resources | `CAP-HR-HIRE`, `CAP-HR-LEAVE`, `CAP-HR-PAYROLL`, `CAP-HR-TRAINING` |
| `RPT` | Reports | `CAP-RPT-OPERATIONAL`, `CAP-RPT-FINANCIALS`, `CAP-RPT-OEE`, `CAP-RPT-DASHBOARDS` |
| `CROSS` | Cross-cutting | `CAP-CROSS-NOTIFICATIONS`, `CAP-CROSS-DOCS`, `CAP-CROSS-INTEG-EDI` |
| `EXT` | Extensions | `CAP-EXT-KANBAN`, `CAP-EXT-CHAT`, `CAP-EXT-AI-ASSISTANT`, `CAP-EXT-MOBILE` |

Per the comment block at the top of `CapabilityCatalog.cs`, the 4A design markdown header claims 121 rows but the implementation enumerates 129 because three INV/QC/MD entries are listed in two areas in the markdown; the seeder treats every distinct code as one row.

### Storage entity

`Capability` (`forge.core/Entities/Capability.cs`) is the DB row:

```csharp
public class Capability : BaseAuditableEntity, IConcurrencyVersioned
{
    public string Code { get; set; }            // "CAP-MD-CUSTOMERS" — natural key
    public string Area { get; set; }            // "MD"
    public string Name { get; set; }            // "Customer master"
    public string Description { get; set; }     // catalog description
    public bool Enabled { get; set; }           // operator state — what gating reads
    public bool IsDefaultOn { get; set; }       // catalog default — preserved for "reset to defaults"
    public string? RequiresRoles { get; set; }  // CSV role gate
    public uint RowVersion { get; set; }        // Postgres xmin for EF concurrency
    public uint Version { get; set; } = 1;      // monotonic counter — surfaced as ETag
    public ICollection<CapabilityConfig> Configs { get; set; }
}
```

`CapabilityConfig` (`forge.core/Entities/CapabilityConfig.cs`) is a 1:0..1 sidecar holding an opaque JSON payload (`ConfigJson`) for capabilities that have tunables. It carries its own independent `Version` so toggle edits and config edits each have their own ETag space.

### Seeding

`CapabilityCatalogSeeder` (`Capabilities/CapabilityCatalogSeeder.cs`) runs at startup after EF migrations, before the snapshot is hydrated. It is idempotent:

- New codes → `INSERT` with `Enabled = IsDefaultOn`.
- Existing rows → refresh metadata only (`Area`, `Name`, `Description`, `IsDefaultOn`, `RequiresRoles`). **`Enabled` is NEVER overwritten** — operator state is owned by the operator.
- Audit writes are suppressed during seed via `db.SuppressAudit = true`.

Wired in `Program.cs`:

```csharp
var capabilitySeeder = scope.ServiceProvider.GetRequiredService<ICapabilityCatalogSeeder>();
await capabilitySeeder.SeedAsync();
var capabilitySnapshots = app.Services.GetRequiredService<ICapabilitySnapshotProvider>();
await capabilitySnapshots.RefreshAsync();
```

### Snapshot

`CapabilitySnapshot` (`Capabilities/CapabilitySnapshot.cs`) is the immutable in-memory view consumed by gating. `ICapabilitySnapshotProvider` is a singleton holding the current snapshot; the implementation (`CapabilitySnapshotProvider.cs`) atomically swaps via `Volatile.Write` on `RefreshAsync()`. Every capability mutation handler calls `RefreshAsync` after `SaveChangesAsync` so the very next request sees the new state.

```csharp
public bool IsEnabled(string code)
    => EnabledByCode.TryGetValue(code, out var enabled) && enabled;
```

Unknown codes always return false — important for the bootstrap-exempt flow and for handling catalog drift (see Gotchas below).

---

## Dependencies and mutexes

Capabilities form a graph. Edges are encoded as static tuples in:

```
forge-api/forge.api/Capabilities/CapabilityCatalogRelations.cs
```

There are two edge kinds:

### Dependencies

`Dependencies` is `IReadOnlyList<CapabilityEdge>` where `From` requires `To` to be enabled. Examples:

```csharp
new("CAP-MFG-WO-RELEASE", "CAP-MD-BOM"),     // WO release requires BOM master
new("CAP-MFG-WO-RELEASE", "CAP-MD-ROUTING"), // ...and routings
new("CAP-PLAN-MRP", "CAP-INV-CORE"),         // MRP requires inventory
```

The resolver in `CapabilityDependencyResolver.cs` enforces:

- **Enable** of capability `X` is blocked when any of `X`'s dependencies are disabled (`FindMissingDependencies`).
- **Disable** of capability `X` is blocked when any currently-enabled capability depends on `X` (`FindEnabledDependents`).

Block-with-informative-error is the policy: the admin gets a 409 with the offending peers listed and acts explicitly. There is no auto-cascade.

`Dependencies` uses **AND semantics only**. The 4A design markdown documents some "OR" dependencies (e.g. `CAP-O2C-INVOICE` depends on `CAP-ACCT-BUILTIN OR CAP-ACCT-EXTERNAL`); Phase C models the operationally-dominant edge and lets preset apply paper over the OR by always toggling the right peer in lockstep.

### Mutexes

`Mutexes` is the soft-mutex pair list. Symmetric: enabling either side is rejected when the peer is already enabled.

The catalog declares **exactly one mutex pair**:

```csharp
public static IReadOnlyList<CapabilityEdge> Mutexes { get; } = new List<CapabilityEdge>
{
    new("CAP-ACCT-EXTERNAL", "CAP-ACCT-BUILTIN"),
};
```

This is the codified accounting boundary. `CAP-ACCT-FULLGL` is registered as an aspirational placeholder (see the catalog row comment: "NOT YET IMPLEMENTED") — it depends on `CAP-ACCT-BUILTIN` but is itself never enabled today, so enabling it returns 403 / "not yet available" through the normal gate.

### Resolver

`CapabilityDependencyResolver` is a stateless static helper used by both single-row toggle and bulk toggle:

```csharp
FindEnabledDependents(string capability, IReadOnlyDictionary<string, bool> enabled)  // disable check
FindMissingDependencies(string capability, IReadOnlyDictionary<string, bool> enabled) // enable check
FindEnabledMutexConflicts(string capability, IReadOnlyDictionary<string, bool> enabled) // enable check
ValidateGraph(IReadOnlyDictionary<string, CapabilityDefinition> catalog, ILogger logger) // startup hook
```

`ValidateGraph` runs once during seed; any edge whose endpoint is missing from `CapabilityCatalog` is logged as a warning and silently skipped at evaluation time. The install stays bootable when the relations file drifts ahead of the catalog file.

---

## Bootstrap-exempt endpoints

Some endpoints MUST NOT themselves be capability-gated, because gating them could brick recovery. The escape hatch is the `[CapabilityBootstrap]` attribute (`Capabilities/RequiresCapabilityAttribute.cs`):

```csharp
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
public sealed class CapabilityBootstrapAttribute : Attribute { }
```

The middleware checks this attribute first. If present, the request always passes. If absent and `[RequiresCapability]` is also absent, the request also passes (no implicit gate).

Endpoints that carry `[CapabilityBootstrap]`:

| Surface | Why exempt |
|---------|------------|
| `GET /api/v1/capabilities/descriptor` | The UI needs to read state to decide what to show — must work even when no preset is applied. |
| `PUT /api/v1/capabilities/{id}/enabled` | Admin must always be able to toggle. Otherwise disabling `CAP-IDEN-CAPABILITY-ADMIN` would brick recovery. Also `[Authorize(Roles = "Admin")]`. |
| `PUT /api/v1/capabilities/{id}/config` | Same reason — config updates must remain reachable. |
| `POST /api/v1/capabilities/bulk-toggle` | Substrate for preset apply; same brick-prevention rationale. |
| `GET /api/v1/capabilities/{id}/audit-log`, `GET /relations`, `POST /validate` | Read-side admin surfaces; need to work in all states. |
| `/api/v1/presets/*` (whole controller) | Preset apply could disable the admin capability itself; must stay reachable. |
| `/api/v1/discovery/*` (whole controller) | Same — discovery applies a preset under the hood. |
| Auth surfaces (`/api/v1/auth/*`) | Login, refresh, MFA — pre-capability-loaded path. |

The deliberate design is "single grep target": searching for `[CapabilityBootstrap]` returns every endpoint that bypasses capability gating.

---

## Server-side gating

There are **two gate sites** on the server. Both read from the same `ICapabilitySnapshotProvider`.

### Controller / HTTP middleware

`CapabilityGateMiddleware` (`Capabilities/CapabilityGateMiddleware.cs`) runs in the request pipeline AFTER `UseAuthentication`/`UseAuthorization` (so audit can attribute the user) and BEFORE the controller body (so a write never reaches the DB on a disabled capability). Wired in `Program.cs`:

```csharp
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<CapabilityGateMiddleware>();
```

Algorithm:

1. No endpoint metadata? Pass through.
2. `[CapabilityBootstrap]` present? Pass through.
3. No `[RequiresCapability]`? Pass through.
4. Snapshot says enabled? Pass through.
5. Otherwise: short-circuit with 403, the `X-Capability-Disabled` response header, and the WU-02 envelope:

```json
{
  "errors": [
    {
      "code": "capability-disabled",
      "capability": "CAP-EXT-AI-ASSISTANT",
      "message": "This capability is disabled for this installation."
    }
  ]
}
```

Apply with `[RequiresCapability(...)]` on a controller class or action method:

```csharp
[ApiController]
[Route("api/v1/parts")]
[Authorize(Roles = "Admin,Manager,Engineer,ProductionWorker,PM,OfficeManager")]
[RequiresCapability("CAP-MD-PARTS")]
public class PartsController(IMediator mediator) : ControllerBase
{
    // ...

    [HttpGet("{id:int}/purchase-history")]
    [RequiresCapability("CAP-P2P-PO")]  // method-level override
    public async Task<ActionResult<...>> GetPurchaseHistory(int id) { ... }
}
```

The attribute composes — class-level acts as the default; method-level overrides for that endpoint.

### MediatR pipeline behavior

`CapabilityGateBehavior<TRequest, TResponse>` (`forge.api/Behaviors/CapabilityGateBehavior.cs`) is the parallel gate for MediatR commands dispatched **outside an HTTP context**: Hangfire jobs, SignalR hub callbacks, or anything that calls `IMediator.Send` directly without going through a controller.

Registered in `Program.cs`:

```csharp
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(CapabilityGateBehavior<,>));
```

The behavior reflects on the request type for `[RequiresCapability]` (cached in a `static readonly` field per closed generic) and throws `CapabilityDisabledException` (`Capabilities/CapabilityDisabledException.cs`) if disabled. The exception's `ToEnvelope()` renders the same shape as the middleware's 403, so the global exception middleware translates it identically on the HTTP path; on the Hangfire path the throw bubbles to the job runner.

```csharp
// Hangfire-fired command — gated even though no HTTP context exists
[RequiresCapability("CAP-EXT-AI-ASSISTANT")]
public record BulkIndexDocumentsCommand(...) : IRequest<...>;
```

Both sites typically apply the attribute on controller-dispatched commands too — the HTTP middleware will short-circuit first, but the attribute on the command is the durable, executable record of which capability gates that command.

### Mutation exception

`CapabilityMutationException` (`Capabilities/CapabilityMutationException.cs`) is the typed exception for dependency / mutex / version-mismatch failures inside mutation handlers. It carries `StatusCode`, `ErrorCode`, and a structured `Extra` dictionary. The `CapabilitiesController` and `PresetsController` catch it and render the WU-02 envelope.

Status codes used:

| Status | `ErrorCode` | When |
|--------|-------------|------|
| 412 | `version-mismatch` | `If-Match` ETag doesn't match the row's `Version`. |
| 409 | `capability-missing-dependencies` | Enable rejected — dependencies disabled. `Extra: { capability, missing[] }`. |
| 409 | `capability-mutex-violation` | Enable rejected — peer enabled. `Extra: { capability, conflicts[] }`. |
| 409 | `capability-has-dependents` | Disable rejected — others depend on this. `Extra: { capability, dependents[] }`. |
| 409 | `bulk-validation-failed` | Bulk toggle has one or more violations across the candidate set. `Extra: { violations[] }`. |
| 404 | `capability-not-found` | Bulk toggle includes unknown codes. `Extra: { missing[] }`. |

---

## Client-side gating

The client mirrors server gating in three layers (descriptor service, structural directives, request interceptor). There is no separate `capabilityGuard` route guard despite an outdated mention in `CLAUDE.md`; route-level gating is achieved by composing the existing `roleGuard` plus capability checks via the descriptor service. **TODO: confirm** whether a dedicated `capabilityGuard` is planned — current usage just reads `capabilityService.isEnabled(code)` from components.

### Descriptor service

`CapabilityService` (`forge-ui/src/app/shared/services/capability.service.ts`) is the singleton that loads and exposes the descriptor.

```typescript
@Injectable({ providedIn: 'root' })
export class CapabilityService {
  readonly descriptor: Signal<CapabilityDescriptor | null>;
  readonly capabilities: Signal<CapabilityDescriptorEntry[]>;

  isEnabled(code: string): boolean;     // synchronous lookup; false on unknown
  isKnown(code: string): boolean;       // does the descriptor know this code?
  getETag(code: string): string | null; // for If-Match round-trip
  getEntry(code: string): CapabilityDescriptorEntry | undefined;

  load(): Observable<void>;
  setEnabled(code: string, enabled: boolean, reason?: string): Observable<...>;
  setConfig(code: string, configJson: string, reason?: string): Observable<...>;
  bulkToggle(items: { id, enabled, ifMatch? }[], reason?: string): Observable<...>;
  validate(items: ...): Observable<...>;
  getRelations(code: string): Observable<...>;
  getAuditLog(code: string, options): Observable<...>;
  clear(): void;
}
```

Loaded once after auth in `AppComponent.ngOnInit()`. The capability descriptor MUST resolve before any capability-gated service makes HTTP calls — the load is chained so race-condition gated calls don't 403 before layer-3 short-circuits them:

```typescript
// app.component.ts
this.capabilityService.load().subscribe({
  next: () => {
    this.notificationService.load();
    this.accountingService.load();
    // ... other services that may make capability-gated HTTP calls
  },
});
```

Cleared on logout via `clear()`.

### Structural directives

`*appCap` and `*appCapNot` (`forge-ui/src/app/shared/directives/cap.directive.ts`, `cap-not.directive.ts`) are the standard template gates:

```html
<div *appCap="'CAP-MD-PART-COMPLIANCE'">
  <!-- compliance fields shown only when capability enabled -->
</div>

<div *appCapNot="'CAP-EXT-CHAT'">
  Chat is not enabled on this install.
</div>
```

Both are signal-reactive — when the admin toggles a capability and the SignalR `capabilityChanged` push triggers a descriptor reload, the directives mount/unmount their template automatically without a page reload.

Two distinct selectors (rather than a compound expression like `*appCap="!CAP-X"`) keep Angular's micro-syntax simple — no parsing surprises.

### Layer-3 request interceptor

`capabilityGateInterceptor` (`forge-ui/src/app/shared/interceptors/capability-gate.interceptor.ts`) pre-flights every outbound HTTP request against a static URL → capability registry. If the request hits a gated endpoint AND the capability is known to be disabled, the request is short-circuited with `CapabilityDisabledError` — the network request never fires.

The registry (`forge-ui/src/app/shared/capability/capability-endpoint-registry.ts`) mirrors controller-level `[RequiresCapability]` attributes from the .NET API:

```typescript
export const CAPABILITY_ENDPOINT_REGISTRY: readonly CapabilityEndpointEntry[] = [
  // Specific paths first (must precede their parent prefix)
  { prefix: 'admin/bi-api-keys', capability: 'CAP-IDEN-AUTH-API-KEYS' },
  { prefix: 'inventory/abc', capability: 'CAP-PLAN-ABC' },
  // Top-level prefixes
  { prefix: 'ai-assistants', capability: 'CAP-EXT-AI-ASSISTANT' },
  { prefix: 'ai', capability: 'CAP-EXT-AI-ASSISTANT' },
  // ... ~70 entries
];
```

The registry is **order-sensitive** — first matching prefix wins; specific paths must precede their parent.

This is the layer-3 complement to layer-2 (the global `httpErrorInterceptor` that catches the server's 403 envelope and translates it to `CapabilityDisabledError`). The two-layer defense is intentional:

- The descriptor may not be loaded yet at app boot (race window — layer 2 catches it).
- An admin can flip a capability mid-session — layer 3 stops further calls based on the latest snapshot.
- The registry covers controller-level gates only; method-level overrides still go through and are caught by layer 2.

Behavior:

| Condition | Outcome |
|-----------|---------|
| URL matches no registry entry | Pass through. |
| URL matches AND `isKnown(code) === false` (descriptor not loaded) | Pass through; server gates and layer 2 catches the 403. |
| URL matches AND capability enabled | Pass through. |
| URL matches AND capability disabled | Short-circuit with `CapabilityDisabledError`. `console.debug` line for diagnostics; no red error in devtools. |

The interceptor MUST be registered before `httpErrorInterceptor` in the `withInterceptors([...])` chain.

`CapabilityDisabledError` (`forge-ui/src/app/shared/errors/capability-disabled.error.ts`) is intentionally NOT a snackbar / toast trigger — a disabled capability is a configuration state, not a security violation.

### SignalR push

`NotificationHubService` (`forge-ui/src/app/shared/services/notification-hub.service.ts`) registers a handler for the `capabilityChanged` event on the notification hub:

```typescript
connection.off('capabilityChanged');
connection.on('capabilityChanged', (event: CapabilityChangedEvent) => {
  // Re-fetch the full descriptor — keeps the snapshot logic in one place
  // and tolerant of dropped messages.
  this.capabilityService.load().subscribe();
});
```

Server-side, every toggle / bulk-toggle handler broadcasts via `IHubContext<NotificationHub>`:

```csharp
await notificationHub.Clients.All.SendAsync(
    "capabilityChanged",
    new { capabilityId = row.Code, enabled = toState },
    cancellationToken);
```

The payload is structurally informative but the client always re-fetches the full descriptor — keeps the cache logic in one place and tolerant of dropped messages.

---

## Mutation API

All mutation routes are under `/api/v1/capabilities/*`, gated by `[Authorize(Roles = "Admin")]`, and carry `[CapabilityBootstrap]`. Defined in `Controllers/CapabilitiesController.cs`.

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/capabilities/descriptor` | Full descriptor (all 129 rows + counts + ETags). Read-only; any authenticated user. |
| `PUT` | `/api/v1/capabilities/{id}/enabled` | Toggle a single capability. Admin-only. |
| `PUT` | `/api/v1/capabilities/{id}/config` | Update opaque config payload. Admin-only. |
| `POST` | `/api/v1/capabilities/bulk-toggle` | Atomic multi-row toggle. Admin-only. Substrate for preset apply. |
| `GET` | `/api/v1/capabilities/{id}/audit-log?before=&take=` | Per-capability audit history (cursor pagination). Admin-only. |
| `GET` | `/api/v1/capabilities/{id}/relations` | Dependency graph snapshot for one capability (Dependencies + Dependents + Mutexes, each with peer name/area/enabled). |
| `POST` | `/api/v1/capabilities/validate` | Dry-run a bulk toggle. Returns same violations envelope; no persistence. |

### Single toggle request

```json
{
  "enabled": true,
  "reason": "Optional 500-char string captured in audit log"
}
```

Headers: `If-Match: W/"<version>"` (optional but recommended). The latest `Version` is in the descriptor row's `eTag` field.

### Single toggle response (200 OK)

```json
{
  "id": "CAP-MD-CUSTOMERS",
  "code": "CAP-MD-CUSTOMERS",
  "area": "MD",
  "name": "Customer master",
  "enabled": true,
  "isDefaultOn": true,
  "version": 4,
  "eTag": "W/\"4\"",
  "configVersion": null,
  "configETag": null,
  "configId": null,
  "dependencies": ["CAP-IDEN-TENANT-CONFIG"],
  "mutexes": []
}
```

Response also sets `ETag: W/"4"` so the next round-trip can submit `If-Match`.

### Bulk toggle

```json
{
  "items": [
    { "id": "CAP-PLAN-MRP", "enabled": true, "ifMatch": "W/\"3\"" },
    { "id": "CAP-RPT-MRPEX", "enabled": true }
  ],
  "reason": "Enable MRP stack"
}
```

The handler validates **the whole candidate state set BEFORE applying any change** — enabling A and disabling A's dependent B in the same batch is OK because the post-apply world has neither A's missing dep nor B's enabled dependent. Per-row validation against the live snapshot would block this case incorrectly.

Idempotent rows (state already matches request) are skipped — no audit row, no broadcast.

### Validate (dry run)

`POST /api/v1/capabilities/validate` returns the same violations envelope a real bulk toggle would, but does not persist. Used by the preset-apply confirmation modal to list what would block before committing.

### Optimistic concurrency

`Capability.Version` is a `uint` started at 1 and bumped by `AppDbContext` on every `Modified` save. The `If-Match` header is parsed permissively (`W/"5"` and `5` both work). Mismatch → 412 with `version-mismatch`.

`CapabilityConfig.Version` is independent — toggle edits don't bump config version, and vice versa.

---

## Discovery wizard

The wizard walks an admin through 22 self-serve questions (more in consultant mode), branches by size / regulation / multi-site, recommends one of the 8 presets with confidence + alternatives + rationale, and lets the admin preview deltas before applying.

### Question catalog

Lives at `Capabilities/Discovery/DiscoveryQuestionCatalog.cs`. Static, with stable IDs (`Q-O1`, `Q-A2`, `Q-V1`, etc.) — renaming would break audit trails.

22 self-serve questions: 6 opening (`Q-O1`–`Q-O6` — headcount, walkthrough, make/resell, regulated industry, sites, audit probe), 4 per branch (`Q-A*` small, `Q-B*` mid, `Q-C*` large), 2 override (`Q-V1` worst-case, `Q-V2` unusual), 6 diagnostic (`Q-D*` lot/serial, hazmat, etc.), 1 exit ramp (`Q-X1` → forces `PRESET-CUSTOM`). Plus optional **consultant-mode deepdive** questions per branch (6-8 more) surfaced only when `?mode=consultant` on `GET /questions`.

Question types (`DiscoveryQuestionType` enum): `SingleChoice`, `MultiChoice`, `YesNo`, `Bucketed` (radio over fixed numeric buckets), `FreeText` (captured verbatim, NOT parsed), `YesNoWithDetail`.

### Recommendation engine

`DiscoveryRecommendationEngine.Recommend(answers)` (`Capabilities/Discovery/DiscoveryRecommendationEngine.cs`) is a stateless pure function. Given `DiscoveryAnswerSet`, returns `DiscoveryRecommendation`:

```csharp
public record DiscoveryRecommendation(
    string PresetId,                                       // "PRESET-04"
    double Confidence,                                     // 0.0-1.0
    string ConfidenceLabel,                                // "high" / "medium" / "low"
    string Rationale,                                      // human paragraph
    IReadOnlyList<DiscoveryRecommendationFactor> Factors,  // per-question contributions
    IReadOnlyList<DiscoveryAlternative> Alternatives);     // surfaced when confidence < 0.7
```

Algorithm (per 4C §Recommendation algorithm):

1. **Q-X1 = yes** (skip discovery) → force `PRESET-CUSTOM` with confidence 1.0.
2. **Compute base candidate** from headcount × mode × sites:
   - Distribution mode (`Q-O3 = resell`) → `PRESET-03` regardless of size.
   - `RouteBranch(headcount, sites)` returns `A` / `B` / `C`. Multi-site (sites ∈ {dual, multi}) routes to Branch C at any mid+ headcount, overriding size.
   - Per-branch candidate selector (`ChooseBranchAPreset`, `…BPreset`, `…CPreset`) reads branch-specific answers and picks one of the 7 named presets.
3. **Regulation override**: `Q-O4 ≠ no` → force `PRESET-05`. Soft override: 2+ regulation signals from `Q-V1` (substantive worst-case answer ≥ 40 chars) and `Q-D1` (lot/serial tracking) also force `PRESET-05`.
4. **Confidence**: starts high; subtract for boundary headcount (`11-25` or `26-50`), regulated-but-no-trace (`Q-D1 = neither`), substantive `Q-V2` text. Below `AlternativesThreshold = 0.7`, the recommendation includes 1-2 alternatives with distinguishing rationales.
5. **Rationale** built from preset description + override notes + verbatim free-text from `Q-O2`, `Q-O6`, `Q-V1`, `Q-V2`.

The engine does NOT parse free-text answers (per 4C decision #1). It surfaces them in the rationale verbatim and uses presence/length as a soft signal only.

### Endpoints

`/api/v1/discovery/*` (defined in `Controllers/DiscoveryController.cs`). All admin-only, all `[CapabilityBootstrap]`.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/discovery/questions?mode=` | Question catalog. `?mode=consultant` adds deepdive questions. |
| `POST` | `/api/v1/discovery/preview` | Stateless recommendation. Body: answer set. No persistence. |
| `POST` | `/api/v1/discovery/apply` | Persist a `DiscoveryRun` row + apply deltas via bulk-toggle. |

### DiscoveryRun audit row

`DiscoveryRun` (`forge.core/Entities/DiscoveryRun.cs`) is the immutable evidence row written on apply:

```csharp
public class DiscoveryRun : BaseAuditableEntity
{
    public int RunByUserId { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset CompletedAt { get; set; }
    public string AnswersJson { get; set; }                   // verbatim answer set
    public string RecommendedPresetId { get; set; }
    public string AppliedPresetId { get; set; }               // may differ from recommended
    public double RecommendedConfidence { get; set; }
    public string AppliedDeltasJson { get; set; }
    public bool RanInConsultantMode { get; set; }
}
```

Re-running discovery overwrites capability state but never replaces prior `DiscoveryRun` rows — the history accumulates as immutable evidence of every configuration decision.

### UI

`/admin/discovery` (`forge-ui/src/app/features/admin/discovery/discovery.component.ts`) is a multi-step wizard that follows the URL-as-source-of-truth pattern: current step is `?step=N`, browser back/forward moves through steps. Answers live in `DiscoveryService` (signals, lost on page refresh).

---

## Presets

8 presets ship out of the box — 7 named + 1 Custom.

### Catalog

`PresetCatalog` (`Capabilities/Discovery/PresetCatalog.cs`) holds all 8. Each `PresetDefinition` carries the FULL set of capabilities the preset wants enabled (constructed via `AssemblePreset(remove, add)` which starts from the 41 catalog defaults baseline and applies a delta).

| ID | Name | Target profile |
|----|------|----------------|
| `PRESET-01` | Two-Person Shop | 1–3 people, single product line, single location, built-in accounting |
| `PRESET-02` | Growing Job Shop | 4–25 people, 2–6 work centers, mixed jobs, QuickBooks |
| `PRESET-03` | Distribution / Wholesale | 5–50 people, 50–500+ SKUs, no production (BOM/ROUTING/MFG-* off) |
| `PRESET-04` | Production Manufacturer | 25–200 people, dedicated PM/buyer/quality roles, ISO 9001 baseline |
| `PRESET-05` | Regulated Manufacturer | 10–500 people, ISO 13485/AS9100/IATF 16949/FDA/FSMA, full QC stack incl. lots, ECO, gage, recall |
| `PRESET-06` | Multi-Site Operation | 50–500 people across 2+ plants, MRP/MPS, EDI |
| `PRESET-07` | Enterprise | 200+ people, multi-currency, EDI, CPQ, MFA/SSO, BI export |
| `PRESET-CUSTOM` | Custom | Empty — at apply-time substitutes the 41 catalog defaults + user overrides |

`PRESET-CUSTOM`'s `EnabledCapabilities` is `[]` — apply-time logic in `ApplyPresetHandler.ResolveTargetSet` substitutes catalog defaults + per-capability overrides.

### Endpoints

`/api/v1/presets/*` (defined in `Controllers/PresetsController.cs`). All admin-only, all `[CapabilityBootstrap]`.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/presets` | Summary list of all 8 |
| `GET` | `/api/v1/presets/{id}` | Detail with delta vs catalog defaults and current install |
| `POST` | `/api/v1/presets/compare` | Side-by-side matrix of 2-4 presets |
| `POST` | `/api/v1/presets/{id}/preview-apply` | Deltas + violations, no persistence |
| `POST` | `/api/v1/presets/{id}/apply` | Apply via bulk-toggle substrate + write `PresetApplied` audit row |
| `POST` | `/api/v1/presets/custom/preview` | Preview Custom = defaults + overrides |
| `POST` | `/api/v1/presets/custom/apply` | Apply Custom |

### Apply semantics

`ApplyPresetHandler` (`Features/Presets/Apply/ApplyPreset.cs`):

1. Resolve target set (preset's `EnabledCapabilities` for standard presets, or catalog defaults + overrides for Custom).
2. Compute deltas vs current snapshot — only capabilities whose state would change.
3. **No-op path**: if deltas list is empty, no bulk-toggle is sent, but a `PresetApplied` audit row is still written with `outcome: "no-op"`. The install records that the admin re-asserted the preset.
4. Otherwise: dispatch `BulkToggleCapabilitiesCommand` with the deltas. The bulk handler validates the whole candidate set against dependency / mutex rules and writes per-row `CapabilityEnabled` / `CapabilityDisabled` audit rows + per-row SignalR broadcasts.
5. Always write a single `PresetApplied` audit row with `presetId`, `presetName`, `outcome`, `deltaCount`, optional reason.

**TODO: confirm** whether per-row `CapabilityEnabled`/`Disabled` rows during preset apply are intentional (the handler comment says "Phase G's preset-apply will use a single PresetApplied row instead" but the current code writes both — see `BulkToggleCapabilitiesHandler` step 5).

### UI

| Route | Component |
|-------|-----------|
| `/admin/presets` | `PresetBrowserComponent` — card grid + multi-select compare mode |
| `/admin/presets/compare?ids=` | `PresetCompareComponent` — side-by-side matrix |
| `/admin/presets/custom` | `PresetCustomComponent` — Custom builder |
| `/admin/presets/:id` | `PresetDetailComponent` — single-preset detail with deltas + apply CTA |

`PresetService` (`forge-ui/src/app/shared/services/preset.service.ts`) is the API client. Apply UX flow is **browse → detail → preview-apply (delta + violations modal) → apply**.

---

## Audit log

Every capability mutation writes to the global `audit_log_entries` table (`AuditLogEntry`), not a separate capability-specific table. Per Phase A decision D2, `entity_type = "Capability"` and `entity_id` = the integer `Capability.Id` (the code is in the JSON `Details` payload).

Action codes (`Capabilities/CapabilityAuditEvents.cs`):

| Constant | String | When |
|----------|--------|------|
| `EntityType` | `"Capability"` | All capability rows |
| `Enabled` | `"CapabilityEnabled"` | Toggle to true |
| `Disabled` | `"CapabilityDisabled"` | Toggle to false |
| `ConfigChanged` | `"CapabilityConfigChanged"` | Config payload updated |
| `PresetApplied` | `"PresetApplied"` | Preset (or Custom) applied; one row per apply |

`Details` JSON contains `code`, `from`, `to`, `before`, `after`, `reason`, `actorUserId`, and (for bulk) `bulk: true`. Preset applies include `presetId`, `presetName`, `outcome` (`"applied"` / `"no-op"`), `deltaCount`.

Admin UI:

- `/admin/capabilities/:id` → "Recent activity" section reads from `GET /api/v1/capabilities/{id}/audit-log` (cursor pagination via `?before=&take=`).
- `/admin/capabilities/audit-log` → links out to the global audit log filtered by `entity_type=Capability`.

---

## Adding a new capability — concrete walkthrough

You're shipping a new feature called "Vendor Scorecards" and want it gated.

### 1. Register in the catalog

Add a row to `CapabilityCatalog.cs`:

```csharp
new("CAP-MD-VENDORSCORECARDS", "MD",
    @"Vendor scorecards",
    @"Per-vendor performance scoring (on-time delivery, quality, responsiveness). Used by procurement teams to drive AVL decisions and renewal cycles.",
    IsDefaultOn: false,
    RequiresRoles: null),
```

Catalog conventions: code is `CAP-{AREA}-{NAME}` ALL-CAPS with hyphens; description is a verbatim raw string with full sentences; comment paragraphs above the row carry rationale (look at the costing tier rows for a good example).

### 2. Wire dependencies / mutexes

If the new capability depends on others, add edges in `CapabilityCatalogRelations.cs`:

```csharp
new("CAP-MD-VENDORSCORECARDS", "CAP-MD-VENDORS"),
new("CAP-MD-VENDORSCORECARDS", "CAP-P2P-PO"),  // scorecards aggregate PO history
```

If it conflicts with another capability, add a `Mutexes` entry. (Rare — there's only one declared mutex today.)

The seeder will validate the graph at next startup; missing endpoints log a warning and the edge is silently skipped (the install stays bootable).

### 3. Tag the controller / handlers

```csharp
[ApiController]
[Route("api/v1/vendor-scorecards")]
[Authorize(Roles = "Admin,Manager,OfficeManager")]
[RequiresCapability("CAP-MD-VENDORSCORECARDS")]
public class VendorScorecardsController : ControllerBase { ... }
```

For Hangfire-fired or non-HTTP MediatR commands, also tag the request type so the MediatR pipeline behavior fires:

```csharp
[RequiresCapability("CAP-MD-VENDORSCORECARDS")]
public record RecomputeVendorScorecardsCommand(...) : IRequest<...>;
```

### 4. Gate the UI

Add the URL → capability mapping to the client registry so the layer-3 interceptor short-circuits requests. `forge-ui/src/app/shared/capability/capability-endpoint-registry.ts`:

```typescript
{ prefix: 'vendor-scorecards', capability: 'CAP-MD-VENDORSCORECARDS' },
```

Specific paths first; place this entry before a parent prefix if one exists.

In templates, gate the entry point:

```html
<a *appCap="'CAP-MD-VENDORSCORECARDS'" routerLink="/vendor-scorecards">
  Vendor Scorecards
</a>
```

In components that fetch/render capability-conditional content, read directly:

```typescript
private readonly capabilityService = inject(CapabilityService);
protected readonly scorecardsEnabled = computed(() => this.capabilityService.isEnabled('CAP-MD-VENDORSCORECARDS'));
```

### 5. Update presets

If the capability should be on/off in any of the 8 standard profiles, edit `PresetCatalog.cs` — add the code to the `add` list of each preset that should ship with it enabled. Custom inherits catalog defaults at apply-time, so if `IsDefaultOn = false` (typical for new gated features) Custom users get it off.

### 6. i18n + tests

Capability copy itself is not localized (see Gotchas). Add UI labels / menu entries / error messages to `public/assets/i18n/{en,es}.json` per the standard 100% language-parity rule in `CLAUDE.md`.

Add tests:
- Controller 403s when the capability is disabled — see `forge.tests/Capabilities/CapabilityToggleTests.cs` for the test factory pattern.
- Dependency edge is enforced — see `CapabilityMutationTests.cs`.

---

## Adding a new preset

Presets are static rows in `PresetCatalog.cs`. To add a 9th:

```csharp
public static PresetDefinition Preset08_FoodService { get; } = new(
    Id: "PRESET-08",
    Name: "Food Service",
    ShortDescription: "FSMA-regulated food producer with full lot tracking, FEFO, and recall.",
    TargetProfile: "10–100 people, FSMA registration, perishable inventory.",
    EnabledCapabilities: AssemblePreset(
        remove: ["CAP-ACCT-BUILTIN"],
        add: [
            "CAP-ACCT-EXTERNAL",
            "CAP-INV-LOTS", "CAP-INV-HAZMAT",
            "CAP-QC-INSPECTION", "CAP-QC-NCR", "CAP-QC-RECALL", "CAP-QC-COA",
            // ...
        ]));
```

Then add it to the `All` collection at the bottom of the file. The preset browser auto-picks it up via `GET /api/v1/presets`. The discovery recommendation engine will NOT route to it unless you also amend the branch-selection logic in `DiscoveryRecommendationEngine.cs` (or accept that the preset is reachable only through the browser).

---

## Gotchas

### 1. Snapshot vs DB lag is one round-trip wide

Mutation handlers call `await snapshots.RefreshAsync()` immediately after `SaveChangesAsync`. The snapshot is held by reference — `Volatile.Read` / `Volatile.Write` ensure visibility. The very next request sees the new state, but in-flight requests that already crossed the gate continue with their pre-toggle view.

### 2. Catalog drift logs once, then silently skips

If `CapabilityCatalogRelations` references a code that doesn't exist in `CapabilityCatalog`, the seeder logs a warning at startup (`[CAPABILITY-CATALOG] Dependency edge references unknown capability: ...`) and the resolver silently skips the bad edge at every evaluation. The install stays bootable. The cost: a graph drift can hide a missing edge — check seed logs after catalog edits.

### 3. Bootstrap exemption is the brick-prevention contract

Disabling `CAP-IDEN-CAPABILITY-ADMIN` does NOT brick the admin surface — every mutation endpoint carries `[CapabilityBootstrap]`. Disabling it merely hides the admin nav for non-Admin users (Admins can still reach it via direct URL). Don't tag any new endpoint with both `[CapabilityBootstrap]` AND `[RequiresCapability]` — pick one based on intent.

### 4. The two-layer client gate is intentional

Layer 2 = `httpErrorInterceptor` catches the server's 403. Layer 3 = `capabilityGateInterceptor` short-circuits before the request fires. **Both must be wired** — layer 2 alone leaves console errors on every gated call; layer 3 alone misses method-level overrides and the brief race window before the descriptor loads. Interceptor order in `withInterceptors([...])` matters: layer 3 must run before the error-translation layer.

### 5. SignalR broadcast → full descriptor refetch

The `capabilityChanged` payload carries the changed capability + new state, but the client always re-fetches the full descriptor — keeps cache logic in one place and is tolerant of dropped messages. `notification-hub.service.ts` had a bug where the handler omitted `.subscribe()` on the cold `load()` Observable and tab B never refreshed; the comment in the handler documents the trap.

### 6. `Version` vs `RowVersion`

`RowVersion` is Postgres `xmin` for EF concurrency. `Version` is a `uint` started at 1, manually bumped by `AppDbContext` on `Modified` saves, surfaced as the API ETag. The API contract is on `Version` (works in both Postgres and InMemory tests); `RowVersion` is internal to EF.

### 7. Bulk toggle whole-set semantics enable contradictions

Enabling A and disabling A's dependent B in the same bulk IS valid because the post-apply candidate state has neither A's missing dep nor B's enabled dependent. Per-row validation against the live snapshot would block this. The handler builds a candidate dict from the live snapshot overlaid with the request delta, then checks rules against THAT.

### 8. Preset apply writes per-row toggle audit rows AND the summary row

Per the `BulkToggleCapabilitiesHandler` comment ("Phase G's preset-apply will use a single PresetApplied row instead"), this looks unfinished — the per-row rows are still written today in addition to the `PresetApplied` row. **TODO: confirm** whether this is intended pending a future refactor, or whether `ApplyPresetHandler` should pass a flag to suppress per-row audit writes.

### 9. Aspirational and UI-only capabilities

- `CAP-ACCT-FULLGL` is registered (chart-of-accounts / JE / period close) but `IsDefaultOn = false` and never enabled. Description ends `(NOT YET IMPLEMENTED)`. Three other capabilities depend on it (`CAP-ACCT-PERIOD`, `CAP-ACCT-DEPRECIATION`, `CAP-ACCT-FXREVAL`) — enabling them today fails the dependency check with a "missing dependency" 409.
- `CAP-COSTING-TIER2-DEPTRATES` and `CAP-COSTING-TIER3-ABC` exist purely to admin-toggle the radios in the part-costing-step UI. The actual rate/driver/allocation engines aren't built; enabling them just removes the disable + reveals a "configuration coming soon" message.

### 10. Catalog copy is not localized

`Capability.Name` and `Capability.Description` are English strings from the catalog. The admin UI renders them verbatim — no i18n key per capability. Phase markers (`Phase 4 Phase-A`, `Phase B`, etc.) in source comments are historical context, not current state — `RequiresCapabilityAttribute.cs` says the attribute is "wired but not yet applied" but it's now applied to ~15 controllers. **TODO: confirm** whether multi-language capability copy is planned.

---

## Related

- **`workflow-engine.md`** — workflows have their own per-step gating story (entity readiness validators) that is orthogonal to capability gating but composes with it.
- **`integrations.md`** and **`qb-integration.md`** — the accounting boundary is the canonical use case for the `CAP-ACCT-EXTERNAL ⊥ CAP-ACCT-BUILTIN` mutex; `qb-integration.md` defines what's accounting-bounded.
- **`admin.md`** — the admin shell that hosts `/admin/capabilities`, `/admin/discovery`, `/admin/presets`.
- **`signalr.md`** — the `capabilityChanged` event lives on `NotificationHub`.
- **Phase 4 design artifacts** (deep-dive, decision history):
  - `phase-4-output/4A-capability-catalog/` — all 129 capabilities with rationale
  - `phase-4-output/4B-preset-design/` — 8 presets with target profile + capability set
  - `phase-4-output/4C-discovery-flow/` — 22-question wizard + recommendation algorithm
  - `phase-4-output/4D-gating-mechanism/` — middleware + descriptor + audit pipeline
  - `phase-4-output/4E-admin-ui/` — browse / discovery / preset / detail screens
  - `phase-4-output/4F-implementation-plan/` — phasing strategy + per-phase decisions
  - `phase-4-output/PHASE-4-CLOSEOUT.md` — rollup summary
