# Forge — Gap Inventory: Path to FULL Parity

> Comprehensive inventory of everything needed to reach FULL parity with top-tier manufacturing ERP/MES platforms, organized by priority tier. Each item includes: what to build, new entities/fields, new endpoints, new UI components, and estimated complexity.
>
> Generated 2026-04-11 from `docs/industry-comparison.md` analysis.

---

## Priority Tiers

| Tier | Label | Criteria |
|------|-------|----------|
| **P0** | **Showstopper** | Without this, Forge cannot be called a manufacturing ERP. Blocks adoption at any serious manufacturer. |
| **P1** | **Critical** | Required for ISO/regulated environments or any manufacturer above 25 employees. Most prospects will ask about these. |
| **P2** | **Important** | Expected by mid-market manufacturers. Missing these limits competitiveness but doesn't block adoption. |
| **P3** | **Standard** | Common in top-tier ERPs. Adds depth and polish. Missing these is noticeable but acceptable for smaller shops. |
| **P4** | **Nice-to-Have** | Present in enterprise ERPs (SAP/Oracle tier). Adds capability but rarely a deciding factor for Forge's target market. |

---

## P0 — SHOWSTOPPER

### 1. MRP / MPS Engine (Material Requirements Planning)

**Why P0:** MRP is THE defining function of a manufacturing ERP. Without it, Forge is a job tracker with inventory, not a planning system. Every serious prospect will ask "does it do MRP?"

**What to build:**

#### 1a. Net Requirements Calculation
The core MRP algorithm: for each planned/released demand, explode the BOM recursively, net against on-hand inventory and scheduled receipts (open POs + open production), and generate planned orders for the shortfall.

**New Entities:**
```
MrpDemand
  Id, PartId, SourceType (SalesOrder/Forecast/SafetyStock/Dependent),
  SourceEntityId, Quantity, RequiredDate, Priority

MrpSupply
  Id, PartId, SourceType (OnHand/PurchaseOrder/PlannedPO/ProductionOrder/PlannedProd),
  SourceEntityId, Quantity, AvailableDate

MrpPlannedOrder
  Id, PartId, OrderType (Purchase/Production), Quantity, StartDate, DueDate,
  ParentPlannedOrderId, Status (Planned/Firmed/Released), VendorId?,
  Notes, GeneratedByRunId

MrpRun
  Id, RunDate, RunType (Regenerative/NetChange), Status (Running/Completed/Failed),
  Parameters (JSON: planning horizon, fence dates, lot sizing rule),
  DemandCount, SupplyCount, PlannedOrderCount, ExceptionCount,
  StartedAt, CompletedAt, RunByUserId

MrpException
  Id, RunId, PartId, ExceptionType (Expedite/Defer/Cancel/PastDue/ShortSupply/OverSupply),
  Message, SourceEntityType, SourceEntityId, SuggestedAction, IsResolved
```

**New fields on existing entities:**
- `Part`: `LotSizingRule` (enum: LotForLot/FixedQty/MinMax/EconomicOrderQty), `FixedOrderQuantity`, `MinimumOrderQuantity`, `OrderMultiple`, `PlanningFenceDays`, `DemandFenceDays`, `IsMrpPlanned` (bool)
- `PurchaseOrderLine`: `MrpPlannedOrderId` (FK — tracks which planned order generated this)
- `Job`: `MrpPlannedOrderId` (FK)

**New API endpoints:**
```
POST   /api/v1/mrp/run                    — Execute MRP run (Hangfire background)
GET    /api/v1/mrp/runs                   — List MRP runs
GET    /api/v1/mrp/runs/{id}              — Run results (summary + stats)
GET    /api/v1/mrp/planned-orders         — List planned orders (part, type, date range filters)
PATCH  /api/v1/mrp/planned-orders/{id}    — Edit planned order (quantity, date, firm)
POST   /api/v1/mrp/planned-orders/{id}/release  — Convert to real PO or Job
POST   /api/v1/mrp/planned-orders/bulk-release  — Bulk release
DELETE /api/v1/mrp/planned-orders/{id}    — Delete planned order
GET    /api/v1/mrp/exceptions             — List exceptions (type, part, priority filters)
PATCH  /api/v1/mrp/exceptions/{id}/resolve — Mark exception resolved
GET    /api/v1/mrp/pegging/{partId}       — Demand-to-supply pegging (trace where demand comes from)
GET    /api/v1/mrp/part-plan/{partId}     — Time-phased supply/demand for a single part
POST   /api/v1/mrp/simulate               — What-if run (doesn't commit planned orders)
```

**New UI components:**
- `features/mrp/` module with:
  - `mrp-dashboard.component` — overview: last run stats, exception count by type, coverage chart
  - `mrp-run-dialog.component` — configure and launch MRP run (horizon, lot sizing, filters)
  - `mrp-planned-orders.component` — DataTable of planned orders with bulk release, firm, edit
  - `mrp-exceptions.component` — DataTable of exceptions with suggested actions, resolve
  - `mrp-part-plan.component` — time-phased supply/demand chart for a single part (bucketed by week)
  - `mrp-pegging.component` — tree view showing demand → supply chain for a part

**Full C# Entity Definitions:**

```csharp
// forge.core/Entities/MrpDemand.cs
public class MrpDemand : BaseEntity
{
    public int PartId { get; set; }
    public MrpDemandSource SourceType { get; set; } // SalesOrder, Forecast, SafetyStock, Dependent
    public int? SourceEntityId { get; set; }
    public string? SourceEntityType { get; set; }   // "SalesOrderLine", "MasterScheduleLine", etc.
    public decimal Quantity { get; set; }
    public DateTimeOffset RequiredDate { get; set; }
    public int Priority { get; set; }
    public int RunId { get; set; }
    public int? ParentDemandId { get; set; }         // For dependent demand (exploded from parent)
    public int BomLevel { get; set; }                // 0 = independent, 1+ = dependent
    public Part Part { get; set; } = null!;
    public MrpRun Run { get; set; } = null!;
    public MrpDemand? ParentDemand { get; set; }
}

// forge.core/Entities/MrpSupply.cs
public class MrpSupply : BaseEntity
{
    public int PartId { get; set; }
    public MrpSupplySource SourceType { get; set; }  // OnHand, PurchaseOrder, PlannedPO, ProductionOrder, PlannedProduction
    public int? SourceEntityId { get; set; }
    public string? SourceEntityType { get; set; }
    public decimal Quantity { get; set; }
    public decimal AllocatedQuantity { get; set; }   // Quantity already pegged to demand
    public DateTimeOffset AvailableDate { get; set; }
    public int RunId { get; set; }
    public Part Part { get; set; } = null!;
    public MrpRun Run { get; set; } = null!;
}

// forge.core/Entities/MrpPlannedOrder.cs
public class MrpPlannedOrder : BaseAuditableEntity
{
    public int PartId { get; set; }
    public MrpOrderType OrderType { get; set; }       // Purchase, Production
    public decimal Quantity { get; set; }
    public DateTimeOffset StartDate { get; set; }      // Due date - lead time
    public DateTimeOffset DueDate { get; set; }
    public int? ParentPlannedOrderId { get; set; }     // Parent assembly's planned order
    public MrpPlannedOrderStatus Status { get; set; }  // Planned, Firmed, Released, Cancelled
    public int? VendorId { get; set; }                 // For purchase orders — preferred vendor or override
    public int? ReleasedEntityId { get; set; }         // PO or Job ID after release
    public string? ReleasedEntityType { get; set; }    // "PurchaseOrder" or "Job"
    public string? Notes { get; set; }
    public int RunId { get; set; }
    public int BomLevel { get; set; }
    public Part Part { get; set; } = null!;
    public Vendor? Vendor { get; set; }
    public MrpPlannedOrder? ParentPlannedOrder { get; set; }
    public MrpRun Run { get; set; } = null!;
    public ICollection<MrpPlannedOrder> ChildPlannedOrders { get; set; } = new List<MrpPlannedOrder>();
}

// forge.core/Entities/MrpRun.cs
public class MrpRun : BaseAuditableEntity
{
    public DateTimeOffset RunDate { get; set; }
    public MrpRunType RunType { get; set; }            // Regenerative, NetChange
    public MrpRunStatus Status { get; set; }           // Queued, Running, Completed, Failed
    public string ParametersJson { get; set; } = "{}"; // Planning horizon weeks, fence dates, part filter, lot sizing override
    public int DemandCount { get; set; }
    public int SupplyCount { get; set; }
    public int PlannedOrderCount { get; set; }
    public int ExceptionCount { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public int RunByUserId { get; set; }
    public string? ErrorMessage { get; set; }
    public ICollection<MrpDemand> Demands { get; set; } = new List<MrpDemand>();
    public ICollection<MrpSupply> Supplies { get; set; } = new List<MrpSupply>();
    public ICollection<MrpPlannedOrder> PlannedOrders { get; set; } = new List<MrpPlannedOrder>();
    public ICollection<MrpException> Exceptions { get; set; } = new List<MrpException>();
}

// forge.core/Entities/MrpException.cs
public class MrpException : BaseEntity
{
    public int RunId { get; set; }
    public int PartId { get; set; }
    public MrpExceptionType ExceptionType { get; set; } // Expedite, Defer, Cancel, PastDue, ShortSupply, OverSupply, LeadTimeViolation
    public string Message { get; set; } = "";
    public string? SourceEntityType { get; set; }
    public int? SourceEntityId { get; set; }
    public string? SuggestedAction { get; set; }
    public bool IsResolved { get; set; }
    public int? ResolvedByUserId { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public string? ResolutionNotes { get; set; }
    public Part Part { get; set; } = null!;
    public MrpRun Run { get; set; } = null!;
}
```

**New Enums:**
```csharp
// forge.core/Enums/MrpEnums.cs
public enum MrpDemandSource { SalesOrder, Forecast, SafetyStock, Dependent, Manual }
public enum MrpSupplySource { OnHand, PurchaseOrder, PlannedPurchase, ProductionOrder, PlannedProduction }
public enum MrpOrderType { Purchase, Production }
public enum MrpPlannedOrderStatus { Planned, Firmed, Released, Cancelled }
public enum MrpRunType { Regenerative, NetChange }
public enum MrpRunStatus { Queued, Running, Completed, Failed }
public enum MrpExceptionType { Expedite, Defer, Cancel, PastDue, ShortSupply, OverSupply, LeadTimeViolation }
public enum LotSizingRule { LotForLot, FixedQuantity, MinMax, EconomicOrderQuantity, MultiplesOf }
```

**New fields on Part entity:**
```csharp
// Add to forge.core/Entities/Part.cs
public LotSizingRule LotSizingRule { get; set; } = LotSizingRule.LotForLot;
public decimal? FixedOrderQuantity { get; set; }      // For FixedQuantity rule
public decimal? MinimumOrderQuantity { get; set; }     // Minimum per order
public decimal? OrderMultiple { get; set; }            // Round up to multiples of
public int PlanningFenceDays { get; set; }             // Inside fence: don't auto-reschedule
public int DemandFenceDays { get; set; }               // Inside fence: only use actual demand, not forecast
public bool IsMrpPlanned { get; set; } = true;        // False = manually managed, excluded from MRP
```

**New Core Interface:**
```csharp
// forge.core/Interfaces/IMrpService.cs
public interface IMrpService
{
    Task<MrpRun> ExecuteRunAsync(MrpRunParameters parameters, CancellationToken ct);
    Task<MrpRun> SimulateRunAsync(MrpRunParameters parameters, CancellationToken ct);
    Task<MrpPlannedOrder> ReleasePlannedOrderAsync(int plannedOrderId, CancellationToken ct);
    Task BulkReleasePlannedOrdersAsync(IEnumerable<int> plannedOrderIds, CancellationToken ct);
    Task<IReadOnlyList<MrpPeggingNode>> GetPeggingAsync(int partId, int runId, CancellationToken ct);
    Task<MrpPartPlan> GetPartPlanAsync(int partId, int runId, CancellationToken ct);
}

public record MrpRunParameters(
    int PlanningHorizonWeeks,
    DateOnly? PlanningFenceDate,
    DateOnly? DemandFenceDate,
    LotSizingRule? LotSizingOverride,
    int[]? PartIdFilter,
    MrpRunType RunType
);

public record MrpPeggingNode(
    int PartId, string PartNumber, string PartDescription,
    decimal Quantity, DateTimeOffset RequiredDate,
    string SourceType, int? SourceEntityId,
    IReadOnlyList<MrpPeggingNode> Children
);

public record MrpPartPlan(
    int PartId, string PartNumber,
    IReadOnlyList<MrpPartPlanBucket> Buckets
);

public record MrpPartPlanBucket(
    DateOnly WeekStart, DateOnly WeekEnd,
    decimal GrossRequirements, decimal ScheduledReceipts,
    decimal PlannedReceipts, decimal ProjectedOnHand,
    decimal NetRequirements, decimal PlannedOrderRelease
);
```

**MediatR Handlers (13):**
```
Features/Mrp/
  ExecuteMrpRun.cs            — Command: queue MRP run (Hangfire background job)
  SimulateMrpRun.cs           — Command: run without persisting planned orders
  GetMrpRuns.cs               — Query: list runs with stats
  GetMrpRunDetail.cs          — Query: single run with counts
  GetPlannedOrders.cs         — Query: paginated, filterable planned orders
  UpdatePlannedOrder.cs       — Command: edit quantity/date, firm status
  ReleasePlannedOrder.cs      — Command: create real PO or Job from planned order
  BulkReleasePlannedOrders.cs — Command: batch release
  DeletePlannedOrder.cs       — Command: remove planned order
  GetMrpExceptions.cs         — Query: paginated, filterable exceptions
  ResolveMrpException.cs      — Command: mark resolved with notes
  GetMrpPegging.cs            — Query: demand-to-supply tree for a part
  GetMrpPartPlan.cs           — Query: time-bucketed supply/demand for a part
```

**Angular Models:**
```typescript
// features/mrp/models/mrp.model.ts
export interface MrpRun {
  id: number;
  runDate: string;
  runType: 'Regenerative' | 'NetChange';
  status: 'Queued' | 'Running' | 'Completed' | 'Failed';
  demandCount: number;
  supplyCount: number;
  plannedOrderCount: number;
  exceptionCount: number;
  startedAt: string | null;
  completedAt: string | null;
  runByUserName: string;
  errorMessage: string | null;
}

export interface MrpPlannedOrder {
  id: number;
  partId: number;
  partNumber: string;
  partDescription: string;
  orderType: 'Purchase' | 'Production';
  quantity: number;
  startDate: string;
  dueDate: string;
  status: 'Planned' | 'Firmed' | 'Released' | 'Cancelled';
  vendorId: number | null;
  vendorName: string | null;
  bomLevel: number;
  parentPlannedOrderId: number | null;
  releasedEntityType: string | null;
  releasedEntityId: number | null;
  notes: string | null;
}

export interface MrpException {
  id: number;
  partId: number;
  partNumber: string;
  exceptionType: 'Expedite' | 'Defer' | 'Cancel' | 'PastDue' | 'ShortSupply' | 'OverSupply' | 'LeadTimeViolation';
  message: string;
  sourceEntityType: string | null;
  sourceEntityId: number | null;
  suggestedAction: string | null;
  isResolved: boolean;
}

export interface MrpPartPlan {
  partId: number;
  partNumber: string;
  buckets: MrpPartPlanBucket[];
}

export interface MrpPartPlanBucket {
  weekStart: string;
  weekEnd: string;
  grossRequirements: number;
  scheduledReceipts: number;
  plannedReceipts: number;
  projectedOnHand: number;
  netRequirements: number;
  plannedOrderRelease: number;
}

export interface MrpPeggingNode {
  partId: number;
  partNumber: string;
  partDescription: string;
  quantity: number;
  requiredDate: string;
  sourceType: string;
  sourceEntityId: number | null;
  children: MrpPeggingNode[];
}

export interface MrpRunRequest {
  planningHorizonWeeks: number;
  planningFenceDate?: string;
  demandFenceDate?: string;
  lotSizingOverride?: string;
  partIdFilter?: number[];
  runType: 'Regenerative' | 'NetChange';
}
```

**Angular Service:**
```typescript
// features/mrp/services/mrp.service.ts
@Injectable({ providedIn: 'root' })
export class MrpService {
  private readonly http = inject(HttpClient);
  private readonly API = '/api/v1/mrp';

  // Runs
  executeRun(request: MrpRunRequest): Observable<MrpRun> { ... }
  simulateRun(request: MrpRunRequest): Observable<MrpRun> { ... }
  getRuns(page?: number, pageSize?: number): Observable<PaginatedResponse<MrpRun>> { ... }
  getRunDetail(id: number): Observable<MrpRun> { ... }

  // Planned Orders
  getPlannedOrders(filters?: { runId?: number; partId?: number; orderType?: string; status?: string; page?: number; pageSize?: number }): Observable<PaginatedResponse<MrpPlannedOrder>> { ... }
  updatePlannedOrder(id: number, request: { quantity?: number; dueDate?: string; status?: string }): Observable<void> { ... }
  releasePlannedOrder(id: number): Observable<{ entityType: string; entityId: number }> { ... }
  bulkReleasePlannedOrders(ids: number[]): Observable<{ released: number; failed: number }> { ... }
  deletePlannedOrder(id: number): Observable<void> { ... }

  // Exceptions
  getExceptions(filters?: { runId?: number; partId?: number; type?: string; resolved?: boolean }): Observable<MrpException[]> { ... }
  resolveException(id: number, notes: string): Observable<void> { ... }

  // Analysis
  getPegging(partId: number, runId: number): Observable<MrpPeggingNode[]> { ... }
  getPartPlan(partId: number, runId: number): Observable<MrpPartPlan> { ... }
}
```

**Angular Components (6):**
```
features/mrp/
  mrp.component.ts/html/scss              — Main page with tabs: Dashboard, Planned Orders, Exceptions
  mrp.routes.ts                           — { path: 'mrp', children: [{ path: ':tab', ... }] }
  components/
    mrp-run-dialog.component.ts/html/scss — Dialog: horizon, run type, lot sizing, part filter, execute button
    mrp-planned-orders.component.ts/html/scss — DataTable: partNumber, orderType, qty, startDate, dueDate, status, vendor. Bulk actions: Release, Firm, Delete
    mrp-exceptions.component.ts/html/scss — DataTable: partNumber, type, message, suggestedAction, isResolved. Inline resolve button
    mrp-part-plan.component.ts/html/scss  — Time-phased grid (week columns): gross req, scheduled receipts, planned receipts, projected OH, net req, planned release. ng2-charts line chart overlay
    mrp-pegging.component.ts/html/scss    — Tree view (mat-tree): demand at root, supply nodes as children, recursive for dependent demand
```

**Complexity:** Very High — this is 2-3 weeks of focused backend work for the algorithm + 1-2 weeks UI. The algorithm itself (multi-level BOM explosion with netting, lead-time offsetting, and lot sizing) is the most complex piece of logic in any ERP.

#### 1b. Master Production Schedule (MPS)
Top-level production plan that drives MRP. Defines what finished goods to produce and when.

**New Entities:**
```
MasterSchedule
  Id, Name, PlanningHorizonWeeks, Status (Draft/Active/Archived),
  EffectiveFrom, EffectiveTo, CreatedByUserId

MasterScheduleLine
  Id, MasterScheduleId, PartId, Week (DateOnly), PlannedQuantity,
  ForecastQuantity, ActualQuantity, Notes
```

**Full C# Entity Definitions:**
```csharp
// forge.core/Entities/MasterSchedule.cs
public class MasterSchedule : BaseAuditableEntity
{
    public string Name { get; set; } = "";
    public int PlanningHorizonWeeks { get; set; } = 26;  // Default 6 months
    public MasterScheduleStatus Status { get; set; }      // Draft, Active, Archived
    public DateTimeOffset EffectiveFrom { get; set; }
    public DateTimeOffset EffectiveTo { get; set; }
    public int CreatedByUserId { get; set; }
    public string? Notes { get; set; }
    public ICollection<MasterScheduleLine> Lines { get; set; } = new List<MasterScheduleLine>();
}

// forge.core/Entities/MasterScheduleLine.cs
public class MasterScheduleLine : BaseEntity
{
    public int MasterScheduleId { get; set; }
    public int PartId { get; set; }
    public DateOnly Week { get; set; }                    // Monday of the week
    public decimal PlannedQuantity { get; set; }          // What we plan to produce
    public decimal ForecastQuantity { get; set; }         // What forecast says
    public decimal ActualQuantity { get; set; }           // What was actually produced (from ProductionRun)
    public string? Notes { get; set; }
    public MasterSchedule MasterSchedule { get; set; } = null!;
    public Part Part { get; set; } = null!;
}
```

**New Enums:**
```csharp
public enum MasterScheduleStatus { Draft, Active, Archived }
```

**MediatR Handlers (6):**
```
Features/Mrp/
  GetMasterSchedules.cs        — Query: list schedules
  GetMasterScheduleDetail.cs   — Query: schedule with lines (part × week grid data)
  CreateMasterSchedule.cs      — Command: create with initial lines
  UpdateMasterSchedule.cs      — Command: update lines (bulk upsert)
  ActivateMasterSchedule.cs    — Command: set active (deactivates previous)
  GetMpsVsActual.cs            — Query: planned vs. actual comparison by part/week
```

**API Endpoints:**
```
GET    /api/v1/mrp/master-schedules            — List schedules
POST   /api/v1/mrp/master-schedules            — Create schedule
GET    /api/v1/mrp/master-schedules/{id}       — Detail with lines
PUT    /api/v1/mrp/master-schedules/{id}       — Update lines (bulk upsert)
POST   /api/v1/mrp/master-schedules/{id}/activate — Set as active
GET    /api/v1/mrp/master-schedules/{id}/vs-actual — Planned vs. actual comparison
```

**Angular Models:**
```typescript
export interface MasterSchedule {
  id: number;
  name: string;
  planningHorizonWeeks: number;
  status: 'Draft' | 'Active' | 'Archived';
  effectiveFrom: string;
  effectiveTo: string;
  createdByUserName: string;
}

export interface MasterScheduleDetail extends MasterSchedule {
  lines: MasterScheduleLine[];
  parts: MpsPartRow[];  // Pivoted: one row per part, columns are weeks
}

export interface MasterScheduleLine {
  id: number;
  partId: number;
  partNumber: string;
  week: string;
  plannedQuantity: number;
  forecastQuantity: number;
  actualQuantity: number;
}

export interface MpsPartRow {
  partId: number;
  partNumber: string;
  partDescription: string;
  weeks: Record<string, { planned: number; forecast: number; actual: number }>;
}
```

**Angular Component:**
```
features/mrp/components/
  mps-grid.component.ts/html/scss — Editable grid: rows = parts, columns = weeks. Each cell has planned/forecast/actual. Cell background: green (actual ≥ planned), yellow (actual < planned), red (actual = 0). Inline editing of planned quantities. Saves via debounced bulk PUT.
```

**Complexity:** Medium — relatively simple data model, but the UI grid is non-trivial.

#### 1c. Demand Forecasting (Basic)
Statistical forecasting from historical sales order data. Even a simple moving average or exponential smoothing adds significant value.

**Full C# Entity Definitions:**
```csharp
// forge.core/Entities/DemandForecast.cs
public class DemandForecast : BaseAuditableEntity
{
    public int PartId { get; set; }
    public ForecastMethod Method { get; set; }           // MovingAverage, ExponentialSmoothing, Manual
    public ForecastPeriodType PeriodType { get; set; }   // Weekly, Monthly
    public string PeriodsJson { get; set; } = "[]";     // Array of { period: "2026-W15", quantity: 120 }
    public DateTimeOffset GeneratedAt { get; set; }
    public int BasedOnMonths { get; set; } = 12;        // Historical lookback window
    public double? SmoothingAlpha { get; set; }          // For exponential smoothing (0.0-1.0)
    public bool IsActive { get; set; }
    public decimal MapePercent { get; set; }             // Mean Absolute Percentage Error — accuracy metric
    public Part Part { get; set; } = null!;
    public ICollection<ForecastOverride> Overrides { get; set; } = new List<ForecastOverride>();
}

// forge.core/Entities/ForecastOverride.cs
public class ForecastOverride : BaseEntity
{
    public int ForecastId { get; set; }
    public string Period { get; set; } = "";             // "2026-W15" or "2026-04"
    public decimal OriginalQuantity { get; set; }
    public decimal OverrideQuantity { get; set; }
    public string? Reason { get; set; }
    public int OverriddenByUserId { get; set; }
    public DemandForecast Forecast { get; set; } = null!;
}
```

**New Enums:**
```csharp
public enum ForecastMethod { MovingAverage, ExponentialSmoothing, WeightedMovingAverage, Manual }
public enum ForecastPeriodType { Weekly, Monthly }
```

**Core Interface:**
```csharp
// forge.core/Interfaces/IForecastService.cs
public interface IForecastService
{
    Task<DemandForecast> GenerateForecastAsync(int partId, ForecastMethod method, int lookbackMonths, CancellationToken ct);
    Task<DemandForecast> GenerateForecastForAllPartsAsync(ForecastMethod method, int lookbackMonths, CancellationToken ct);
    decimal CalculateMovingAverage(IReadOnlyList<decimal> historicalDemand, int periods);
    decimal CalculateExponentialSmoothing(IReadOnlyList<decimal> historicalDemand, double alpha);
    decimal CalculateMape(IReadOnlyList<decimal> actual, IReadOnlyList<decimal> forecast);
}
```

**MediatR Handlers (5):**
```
Features/Mrp/
  GenerateForecast.cs          — Command: generate forecast for a part (or all parts)
  GetForecasts.cs              — Query: list forecasts with accuracy metrics
  GetForecastDetail.cs         — Query: forecast with period data + overrides
  CreateForecastOverride.cs    — Command: manual override for a period
  DeleteForecast.cs            — Command: remove forecast
```

**API Endpoints:**
```
POST   /api/v1/mrp/forecasts/generate          — Generate forecast (partId?, method, lookbackMonths)
GET    /api/v1/mrp/forecasts                   — List forecasts
GET    /api/v1/mrp/forecasts/{id}              — Forecast detail with periods + overrides
POST   /api/v1/mrp/forecasts/{id}/overrides    — Add manual override
DELETE /api/v1/mrp/forecasts/{id}              — Delete forecast
```

**Angular Models:**
```typescript
export interface DemandForecast {
  id: number;
  partId: number;
  partNumber: string;
  method: 'MovingAverage' | 'ExponentialSmoothing' | 'WeightedMovingAverage' | 'Manual';
  periodType: 'Weekly' | 'Monthly';
  periods: ForecastPeriod[];
  basedOnMonths: number;
  mapePercent: number;
  isActive: boolean;
  generatedAt: string;
}

export interface ForecastPeriod {
  period: string;        // "2026-W15" or "2026-04"
  quantity: number;
  overrideQuantity: number | null;
  actualQuantity: number | null;  // Historical actual for accuracy comparison
}

export interface GenerateForecastRequest {
  partId?: number;       // null = all MRP-planned parts
  method: string;
  lookbackMonths: number;
  smoothingAlpha?: number;
}
```

**Angular Component:**
```
features/mrp/components/
  forecast-chart.component.ts/html/scss — Line chart: historical demand (solid), forecast (dashed), overrides (dots). MAPE display. Method selector dropdown.
  forecast-override-dialog.component.ts/html/scss — Period picker + override quantity + reason
```

**Complexity:** Medium — the statistical models are well-documented; the challenge is exposing them usefully.

---

### 2. Finite Capacity Scheduling

**Why P0:** Without scheduling, you can't answer "when will this job be done?" — the most basic question a shop floor manager asks. Planning cycles are agile-style commitments, not resource-constrained schedules.

**What to build:**

#### 2a. Work Center / Resource Definition
Work centers with capacity (hours/day, shifts), efficiency ratings, and calendar exceptions.

**New Entities:**
```
WorkCenter
  Id, Name, Code, Description, LocationId?, AssetId?,
  DailyCapacityHours, EfficiencyPercent, NumberOfMachines,
  CostPerHour (labor), BurdenRatePerHour (overhead),
  IsActive, SortOrder

WorkCenterCalendar
  Id, WorkCenterId, Date, AvailableHours (override for that day),
  Reason (Holiday/Maintenance/Overtime)

Shift
  Id, Name, StartTime (TimeOnly), EndTime (TimeOnly),
  BreakMinutes, IsActive

WorkCenterShift
  Id, WorkCenterId, ShiftId, DaysOfWeek (flags enum)
```

**New fields on existing entities:**
- `Operation`: `SetupMinutes` (separate from run), `RunMinutesEach`, `RunMinutesLot`, `OverlapPercent`, `WorkCenterId` (already exists but needs richer work center), `ScrapFactor`
- `Asset`: relationship to WorkCenter (one asset can BE a work center, or a work center can have multiple assets)

#### 2b. Scheduling Engine
Forward or backward schedule jobs through their routing operations against work center capacity.

**New Entities:**
```
ScheduledOperation
  Id, JobId, OperationId, WorkCenterId, ScheduledStart, ScheduledEnd,
  SetupStart, SetupEnd, RunStart, RunEnd,
  Status (Scheduled/InProgress/Complete), SequenceNumber,
  IsLocked (manually pinned)

ScheduleRun
  Id, RunDate, Direction (Forward/Backward), Status, CompletedAt
```

**New endpoints:**
```
POST   /api/v1/scheduling/run              — Run scheduler
GET    /api/v1/scheduling/gantt            — Gantt chart data (jobs × time)
GET    /api/v1/scheduling/work-center-load — Capacity utilization by work center
PATCH  /api/v1/scheduling/operations/{id}  — Manual reschedule (drag on Gantt)
POST   /api/v1/scheduling/simulate         — What-if scheduling
```

**New UI:**
- `features/scheduling/` module:
  - `gantt-chart.component` — interactive Gantt (likely using a library like DHTMLX Gantt or Bryntum)
  - `work-center-load.component` — capacity utilization bar chart per work center per week
  - `schedule-dialog.component` — configure scheduling run
  - `dispatch-list.component` — priority-ordered work list per work center

**Full C# Entity Definitions:**
```csharp
// forge.core/Entities/WorkCenter.cs
public class WorkCenter : BaseAuditableEntity
{
    public string Name { get; set; } = "";
    public string Code { get; set; } = "";
    public string? Description { get; set; }
    public int? CompanyLocationId { get; set; }        // Which plant/facility
    public int? AssetId { get; set; }                  // Primary machine (if 1:1)
    public decimal DailyCapacityHours { get; set; } = 8m;
    public decimal EfficiencyPercent { get; set; } = 100m;  // 85% = machine runs at 85% of ideal
    public int NumberOfMachines { get; set; } = 1;     // Parallel capacity
    public decimal LaborCostPerHour { get; set; }
    public decimal BurdenRatePerHour { get; set; }     // Overhead rate
    public decimal? IdealCycleTimeSeconds { get; set; } // For OEE calculation
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public CompanyLocation? Location { get; set; }
    public Asset? Asset { get; set; }
    public ICollection<WorkCenterShift> Shifts { get; set; } = new List<WorkCenterShift>();
    public ICollection<WorkCenterCalendar> CalendarOverrides { get; set; } = new List<WorkCenterCalendar>();
    public ICollection<Operation> Operations { get; set; } = new List<Operation>();
}

// forge.core/Entities/WorkCenterCalendar.cs
public class WorkCenterCalendar : BaseEntity
{
    public int WorkCenterId { get; set; }
    public DateOnly Date { get; set; }
    public decimal AvailableHours { get; set; }        // 0 = closed, >8 = overtime
    public string? Reason { get; set; }                 // "Holiday", "Planned Maintenance", "Overtime"
    public WorkCenter WorkCenter { get; set; } = null!;
}

// forge.core/Entities/Shift.cs
public class Shift : BaseAuditableEntity
{
    public string Name { get; set; } = "";              // "Day Shift", "Swing", "Graveyard"
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int BreakMinutes { get; set; }
    public decimal NetHours { get; set; }               // Computed: (end - start) - breaks
    public bool IsActive { get; set; } = true;
    public ICollection<WorkCenterShift> WorkCenterShifts { get; set; } = new List<WorkCenterShift>();
}

// forge.core/Entities/WorkCenterShift.cs
public class WorkCenterShift : BaseEntity
{
    public int WorkCenterId { get; set; }
    public int ShiftId { get; set; }
    public DaysOfWeek DaysOfWeek { get; set; }         // Flags enum: Mon|Tue|Wed|Thu|Fri
    public WorkCenter WorkCenter { get; set; } = null!;
    public Shift Shift { get; set; } = null!;
}

// forge.core/Entities/ScheduledOperation.cs
public class ScheduledOperation : BaseAuditableEntity
{
    public int JobId { get; set; }
    public int OperationId { get; set; }
    public int WorkCenterId { get; set; }
    public DateTimeOffset ScheduledStart { get; set; }
    public DateTimeOffset ScheduledEnd { get; set; }
    public DateTimeOffset? SetupStart { get; set; }
    public DateTimeOffset? SetupEnd { get; set; }
    public DateTimeOffset? RunStart { get; set; }
    public DateTimeOffset? RunEnd { get; set; }
    public decimal SetupHours { get; set; }
    public decimal RunHours { get; set; }
    public decimal TotalHours { get; set; }
    public ScheduledOperationStatus Status { get; set; } // Scheduled, InProgress, Complete, Cancelled
    public int SequenceNumber { get; set; }
    public bool IsLocked { get; set; }                   // Manually pinned — scheduler won't move
    public int? ScheduleRunId { get; set; }
    public Job Job { get; set; } = null!;
    public Operation Operation { get; set; } = null!;
    public WorkCenter WorkCenter { get; set; } = null!;
    public ScheduleRun? ScheduleRun { get; set; }
}

// forge.core/Entities/ScheduleRun.cs
public class ScheduleRun : BaseAuditableEntity
{
    public DateTimeOffset RunDate { get; set; }
    public ScheduleDirection Direction { get; set; }    // Forward, Backward
    public ScheduleRunStatus Status { get; set; }       // Queued, Running, Completed, Failed
    public string ParametersJson { get; set; } = "{}"; // Priority rules, date range, job filter
    public int OperationsScheduled { get; set; }
    public int ConflictsDetected { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public int RunByUserId { get; set; }
    public string? ErrorMessage { get; set; }
    public ICollection<ScheduledOperation> Operations { get; set; } = new List<ScheduledOperation>();
}
```

**New Enums:**
```csharp
public enum ScheduledOperationStatus { Scheduled, InProgress, Complete, Cancelled }
public enum ScheduleDirection { Forward, Backward }
public enum ScheduleRunStatus { Queued, Running, Completed, Failed }
[Flags] public enum DaysOfWeek { None = 0, Monday = 1, Tuesday = 2, Wednesday = 4, Thursday = 8, Friday = 16, Saturday = 32, Sunday = 64 }
```

**New fields on Operation entity:**
```csharp
// Add to forge.core/Entities/Operation.cs
public decimal SetupMinutes { get; set; }              // Separate from run time
public decimal RunMinutesEach { get; set; }            // Time per piece
public decimal RunMinutesLot { get; set; }             // Fixed time per lot regardless of qty
public decimal OverlapPercent { get; set; }            // 0-100: how much next op can overlap
public decimal ScrapFactor { get; set; }               // Expected yield loss (e.g., 0.02 = 2%)
public bool IsSubcontract { get; set; }
public int? SubcontractVendorId { get; set; }
public decimal? SubcontractCost { get; set; }
```

**Core Interface:**
```csharp
// forge.core/Interfaces/ISchedulingService.cs
public interface ISchedulingService
{
    Task<ScheduleRun> ScheduleAsync(ScheduleParameters parameters, CancellationToken ct);
    Task<ScheduleRun> SimulateAsync(ScheduleParameters parameters, CancellationToken ct);
    Task RescheduleOperationAsync(int scheduledOperationId, DateTimeOffset newStart, CancellationToken ct);
    Task<WorkCenterLoadReport> GetWorkCenterLoadAsync(int workCenterId, DateOnly from, DateOnly to, CancellationToken ct);
    Task<IReadOnlyList<DispatchListItem>> GetDispatchListAsync(int workCenterId, CancellationToken ct);
    decimal CalculateAvailableCapacity(int workCenterId, DateOnly date); // Hours available
}

public record ScheduleParameters(
    ScheduleDirection Direction,
    DateOnly ScheduleFrom,
    DateOnly ScheduleTo,
    int[]? JobIdFilter,
    string PriorityRule          // "DueDate", "Priority", "CustomerPriority", "FIFO"
);

public record WorkCenterLoadReport(
    int WorkCenterId, string WorkCenterName,
    IReadOnlyList<WorkCenterLoadBucket> Buckets
);

public record WorkCenterLoadBucket(
    DateOnly WeekStart, decimal CapacityHours,
    decimal ScheduledHours, decimal UtilizationPercent
);

public record DispatchListItem(
    int ScheduledOperationId, int JobId, string JobNumber,
    int OperationId, string OperationTitle, int SequenceNumber,
    DateTimeOffset ScheduledStart, decimal SetupHours, decimal RunHours,
    string Priority, DateTimeOffset JobDueDate
);
```

**MediatR Handlers (9):**
```
Features/Scheduling/
  RunScheduler.cs                — Command: execute scheduling run (Hangfire)
  SimulateSchedule.cs            — Command: what-if without persisting
  GetScheduleRuns.cs             — Query: list runs
  GetGanttData.cs                — Query: all scheduled ops in date range (for Gantt)
  GetWorkCenterLoad.cs           — Query: capacity utilization by work center
  GetDispatchList.cs             — Query: priority-ordered work list per work center
  RescheduleOperation.cs         — Command: manual move (drag on Gantt)
  LockScheduledOperation.cs     — Command: pin/unpin operation
  GetWorkCenters.cs              — Query: list work centers with capacity
```

**Additional MediatR Handlers for Work Center CRUD (6):**
```
Features/Scheduling/
  CreateWorkCenter.cs, UpdateWorkCenter.cs, DeleteWorkCenter.cs
  CreateShift.cs, UpdateShift.cs, DeleteShift.cs
```

**API Endpoints:**
```
# Scheduling
POST   /api/v1/scheduling/run                        — Execute scheduling run
POST   /api/v1/scheduling/simulate                   — What-if scheduling
GET    /api/v1/scheduling/runs                       — List runs
GET    /api/v1/scheduling/gantt?from={date}&to={date} — Gantt chart data
PATCH  /api/v1/scheduling/operations/{id}            — Reschedule (new start date/time)
POST   /api/v1/scheduling/operations/{id}/lock       — Lock/unlock
GET    /api/v1/scheduling/dispatch/{workCenterId}    — Dispatch list
GET    /api/v1/scheduling/work-center-load/{workCenterId}?from={date}&to={date}

# Work Centers
GET    /api/v1/work-centers                          — List
POST   /api/v1/work-centers                          — Create
PUT    /api/v1/work-centers/{id}                     — Update
DELETE /api/v1/work-centers/{id}                     — Delete
GET    /api/v1/work-centers/{id}/calendar            — Calendar overrides
POST   /api/v1/work-centers/{id}/calendar            — Add calendar override

# Shifts
GET    /api/v1/shifts                                — List shifts
POST   /api/v1/shifts                                — Create shift
PUT    /api/v1/shifts/{id}                           — Update shift
DELETE /api/v1/shifts/{id}                           — Delete shift
```

**Angular Models:**
```typescript
export interface WorkCenter {
  id: number;
  name: string;
  code: string;
  description: string | null;
  dailyCapacityHours: number;
  efficiencyPercent: number;
  numberOfMachines: number;
  laborCostPerHour: number;
  burdenRatePerHour: number;
  isActive: boolean;
  assetId: number | null;
  assetName: string | null;
}

export interface ScheduledOperation {
  id: number;
  jobId: number;
  jobNumber: string;
  jobTitle: string;
  operationId: number;
  operationTitle: string;
  workCenterId: number;
  workCenterName: string;
  scheduledStart: string;
  scheduledEnd: string;
  setupHours: number;
  runHours: number;
  totalHours: number;
  status: 'Scheduled' | 'InProgress' | 'Complete' | 'Cancelled';
  isLocked: boolean;
  jobPriority: string;
  jobDueDate: string;
  color: string;         // Derived from job priority or customer
}

export interface GanttRow {
  workCenterId: number;
  workCenterName: string;
  operations: ScheduledOperation[];
}

export interface WorkCenterLoadBucket {
  weekStart: string;
  capacityHours: number;
  scheduledHours: number;
  utilizationPercent: number;
}
```

**Angular Components (6):**
```
features/scheduling/
  scheduling.component.ts/html/scss — Main page with tabs: Gantt, Work Center Load, Dispatch, Work Centers
  scheduling.routes.ts
  components/
    gantt-chart.component.ts/html/scss       — Interactive Gantt using DHTMLX Gantt or custom canvas. Rows = work centers, bars = operations. Drag to reschedule. Color by priority. Tooltips with job/operation detail.
    work-center-load.component.ts/html/scss  — Stacked bar chart (ng2-charts): capacity vs. scheduled per week per work center. Red when >100% utilization.
    dispatch-list.component.ts/html/scss     — DataTable per work center: operations sorted by priority dispatch rule. Print button for shop floor dispatch sheet.
    work-center-dialog.component.ts/html/scss — Dialog: name, code, capacity, efficiency, rates, shift assignments, calendar overrides
    schedule-run-dialog.component.ts/html/scss — Dialog: direction, date range, priority rule, job filter, execute button
```

**Library recommendation:** `dhtmlx-gantt` (MIT license, 50KB gzipped) or `frappe-gantt` (simpler, SVG-based). Avoid building Gantt from scratch — the interaction complexity (drag, resize, dependency arrows, zoom levels) is enormous.

**Complexity:** Very High — Gantt UI alone is a significant undertaking. The scheduling algorithm (priority dispatch, constraint resolution) is well-understood but complex. Consider using a JS Gantt library rather than building from scratch.

---

## P1 — CRITICAL

### 3. Job Costing (Actual vs. Estimated)

**Why P1:** Every job shop needs to know "did we make money on that job?" Without cost tracking, profitability is a guess.

#### C# Entity Definitions

**New fields on `Job` entity (`forge.core/Entities/Job.cs`):**
```csharp
// Estimated costs (set during quoting/estimation)
public decimal EstimatedMaterialCost { get; set; }
public decimal EstimatedLaborCost { get; set; }
public decimal EstimatedBurdenCost { get; set; }
public decimal EstimatedSubcontractCost { get; set; }
public decimal EstimatedTotalCost => EstimatedMaterialCost + EstimatedLaborCost + EstimatedBurdenCost + EstimatedSubcontractCost;
public decimal QuotedPrice { get; set; }
public decimal EstimatedMarginPercent => QuotedPrice > 0 ? (QuotedPrice - EstimatedTotalCost) / QuotedPrice * 100 : 0;
```

**New fields on `Operation` entity (`forge.core/Entities/Operation.cs`):**
```csharp
public decimal SetupMinutes { get; set; }
public decimal RunMinutesEach { get; set; }
public decimal RunMinutesLot { get; set; }
public decimal LaborRate { get; set; }               // $/hr override (0 = use employee rate)
public decimal BurdenRate { get; set; }               // $/hr overhead rate
public decimal EstimatedLaborCost { get; set; }       // Computed: (setup + run) * laborRate
public decimal EstimatedBurdenCost { get; set; }      // Computed: (setup + run) * burdenRate
public decimal ScrapFactor { get; set; }              // e.g. 0.05 = 5% expected scrap
public bool IsSubcontract { get; set; }
public int? SubcontractVendorId { get; set; }
public decimal? SubcontractCost { get; set; }
public Vendor? SubcontractVendor { get; set; }
```

**New fields on `TimeEntry` entity (`forge.core/Entities/TimeEntry.cs`):**
```csharp
public int? OperationId { get; set; }               // FK → Operation (nullable for job-level tracking)
public decimal LaborCost { get; set; }               // Computed: duration × employee rate
public decimal BurdenCost { get; set; }               // Computed: duration × burden rate
public Operation? Operation { get; set; }
```

**New entity: `LaborRate` (`forge.core/Entities/LaborRate.cs`):**
```csharp
public class LaborRate : BaseEntity
{
    public int UserId { get; set; }
    public decimal StandardRatePerHour { get; set; }
    public decimal OvertimeRatePerHour { get; set; }
    public decimal? DoubletimeRatePerHour { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }          // null = current rate
    public string? Notes { get; set; }

    // Navigation
    public ApplicationUser User { get; set; } = null!;
}
```

**New entity: `MaterialIssue` (`forge.core/Entities/MaterialIssue.cs`):**
```csharp
public class MaterialIssue : BaseAuditableEntity
{
    public int JobId { get; set; }
    public int PartId { get; set; }
    public int? OperationId { get; set; }              // Which operation consumed it
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }               // Cost at time of issue
    public decimal TotalCost => Quantity * UnitCost;
    public int IssuedById { get; set; }
    public DateTimeOffset IssuedAt { get; set; }
    public int? BinContentId { get; set; }              // Source bin
    public int? StorageLocationId { get; set; }         // Source location
    public string? LotNumber { get; set; }
    public MaterialIssueType IssueType { get; set; } = MaterialIssueType.Issue;
    public int? ReturnReasonId { get; set; }            // If IssueType == Return
    public string? Notes { get; set; }

    // Navigation
    public Job Job { get; set; } = null!;
    public Part Part { get; set; } = null!;
    public Operation? Operation { get; set; }
    public ApplicationUser IssuedBy { get; set; } = null!;
    public BinContent? BinContent { get; set; }
    public StorageLocation? StorageLocation { get; set; }
}
```

#### Enums

**`MaterialIssueType` (`forge.core/Enums/MaterialIssueType.cs`):**
```csharp
public enum MaterialIssueType
{
    Issue,      // Issue material to job
    Return,     // Return unused material to stock
    Scrap       // Material scrapped during production
}
```

#### Models

**`JobCostSummaryModel` (`forge.core/Models/JobCostModels.cs`):**
```csharp
public record JobCostSummaryModel
{
    public int JobId { get; init; }
    public string JobNumber { get; init; } = string.Empty;
    public decimal QuotedPrice { get; init; }

    // Material
    public decimal MaterialEstimated { get; init; }
    public decimal MaterialActual { get; init; }
    public decimal MaterialVariance => MaterialActual - MaterialEstimated;
    public decimal MaterialVariancePercent => MaterialEstimated != 0 ? MaterialVariance / MaterialEstimated * 100 : 0;

    // Labor
    public decimal LaborEstimated { get; init; }
    public decimal LaborActual { get; init; }
    public decimal LaborVariance => LaborActual - LaborEstimated;
    public decimal LaborVariancePercent => LaborEstimated != 0 ? LaborVariance / LaborEstimated * 100 : 0;

    // Burden
    public decimal BurdenEstimated { get; init; }
    public decimal BurdenActual { get; init; }
    public decimal BurdenVariance => BurdenActual - BurdenEstimated;

    // Subcontract
    public decimal SubcontractEstimated { get; init; }
    public decimal SubcontractActual { get; init; }
    public decimal SubcontractVariance => SubcontractActual - SubcontractEstimated;

    // Totals
    public decimal TotalEstimated => MaterialEstimated + LaborEstimated + BurdenEstimated + SubcontractEstimated;
    public decimal TotalActual => MaterialActual + LaborActual + BurdenActual + SubcontractActual;
    public decimal TotalVariance => TotalActual - TotalEstimated;
    public decimal TotalVariancePercent => TotalEstimated != 0 ? TotalVariance / TotalEstimated * 100 : 0;
    public decimal ActualMargin => QuotedPrice - TotalActual;
    public decimal ActualMarginPercent => QuotedPrice != 0 ? ActualMargin / QuotedPrice * 100 : 0;
}

public record MaterialIssueRequestModel
{
    public int PartId { get; init; }
    public int? OperationId { get; init; }
    public decimal Quantity { get; init; }
    public int? BinContentId { get; init; }
    public int? StorageLocationId { get; init; }
    public string? LotNumber { get; init; }
    public MaterialIssueType IssueType { get; init; } = MaterialIssueType.Issue;
    public string? Notes { get; init; }
}

public record MaterialIssueResponseModel
{
    public int Id { get; init; }
    public int JobId { get; init; }
    public int PartId { get; init; }
    public string PartNumber { get; init; } = string.Empty;
    public string PartDescription { get; init; } = string.Empty;
    public int? OperationId { get; init; }
    public string? OperationName { get; init; }
    public decimal Quantity { get; init; }
    public decimal UnitCost { get; init; }
    public decimal TotalCost { get; init; }
    public string IssuedByName { get; init; } = string.Empty;
    public DateTimeOffset IssuedAt { get; init; }
    public string? LotNumber { get; init; }
    public MaterialIssueType IssueType { get; init; }
    public string? Notes { get; init; }
}

public record JobProfitabilityReportRow
{
    public int JobId { get; init; }
    public string JobNumber { get; init; } = string.Empty;
    public string JobTitle { get; init; } = string.Empty;
    public string? CustomerName { get; init; }
    public decimal QuotedPrice { get; init; }
    public decimal ActualCost { get; init; }
    public decimal Margin { get; init; }
    public decimal MarginPercent { get; init; }
    public decimal MaterialCost { get; init; }
    public decimal LaborCost { get; init; }
    public decimal BurdenCost { get; init; }
    public decimal SubcontractCost { get; init; }
    public DateTimeOffset? CompletedAt { get; init; }
}
```

#### Core Interface

**`IJobCostService` (`forge.core/Interfaces/IJobCostService.cs`):**
```csharp
public interface IJobCostService
{
    Task<JobCostSummaryModel> GetCostSummaryAsync(int jobId, CancellationToken ct);
    Task<decimal> GetActualMaterialCostAsync(int jobId, CancellationToken ct);
    Task<decimal> GetActualLaborCostAsync(int jobId, CancellationToken ct);
    Task<decimal> GetActualBurdenCostAsync(int jobId, CancellationToken ct);
    Task<decimal> GetActualSubcontractCostAsync(int jobId, CancellationToken ct);
    Task<decimal> GetCurrentLaborRateAsync(int userId, DateTimeOffset asOf, CancellationToken ct);
    Task RecalculateTimeEntryCostsAsync(int jobId, CancellationToken ct);
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetJobCostSummary` | Query | `Features/Jobs/GetJobCostSummary.cs` | Aggregates material issues + time entries + subcontract POs → cost summary |
| `GetJobMaterialIssues` | Query | `Features/Jobs/GetJobMaterialIssues.cs` | Paginated list of materials issued to job |
| `CreateMaterialIssue` | Command | `Features/Jobs/CreateMaterialIssue.cs` | Issues material from inventory bin → decrements BinContent, creates MaterialIssue |
| `ReturnMaterialIssue` | Command | `Features/Jobs/ReturnMaterialIssue.cs` | Returns material to stock (reverse issue) |
| `GetJobProfitabilityReport` | Query | `Features/Reports/GetJobProfitabilityReport.cs` | Multi-job profitability with filters (date range, customer, min margin%) |
| `GetLaborRates` | Query | `Features/Admin/GetLaborRates.cs` | Labor rate history for user |
| `CreateLaborRate` | Command | `Features/Admin/CreateLaborRate.cs` | Set new labor rate (closes previous effective period) |
| `RecalculateJobCosts` | Command | `Features/Jobs/RecalculateJobCosts.cs` | Batch recalculate all cost fields on a job's time entries (admin tool) |

#### API Endpoints

```
GET    /api/v1/jobs/{id}/cost-summary                — JobCostSummaryModel
GET    /api/v1/jobs/{id}/material-issues              — Paginated MaterialIssueResponseModel[]
POST   /api/v1/jobs/{id}/material-issues              — Issue material (decrements inventory)
POST   /api/v1/jobs/{id}/material-issues/{issueId}/return — Return material to stock
GET    /api/v1/reports/job-profitability              — JobProfitabilityReportRow[] (date range, customer filters)
GET    /api/v1/admin/labor-rates/{userId}             — LaborRate[] for user
POST   /api/v1/admin/labor-rates                      — Create new labor rate
POST   /api/v1/jobs/{id}/recalculate-costs            — Trigger cost recalculation
```

#### Angular TypeScript Models

```typescript
// job-cost.model.ts
export interface JobCostSummary {
  jobId: number;
  jobNumber: string;
  quotedPrice: number;
  materialEstimated: number; materialActual: number; materialVariance: number; materialVariancePercent: number;
  laborEstimated: number; laborActual: number; laborVariance: number; laborVariancePercent: number;
  burdenEstimated: number; burdenActual: number; burdenVariance: number;
  subcontractEstimated: number; subcontractActual: number; subcontractVariance: number;
  totalEstimated: number; totalActual: number; totalVariance: number; totalVariancePercent: number;
  actualMargin: number; actualMarginPercent: number;
}

export interface MaterialIssue {
  id: number; jobId: number; partId: number; partNumber: string; partDescription: string;
  operationId: number | null; operationName: string | null;
  quantity: number; unitCost: number; totalCost: number;
  issuedByName: string; issuedAt: string;
  lotNumber: string | null; issueType: 'Issue' | 'Return' | 'Scrap'; notes: string | null;
}

export interface MaterialIssueRequest {
  partId: number; operationId?: number; quantity: number;
  binContentId?: number; storageLocationId?: number;
  lotNumber?: string; issueType?: 'Issue' | 'Return' | 'Scrap'; notes?: string;
}

export interface LaborRate {
  id: number; userId: number; standardRatePerHour: number;
  overtimeRatePerHour: number; doubletimeRatePerHour: number | null;
  effectiveFrom: string; effectiveTo: string | null; notes: string | null;
}

export interface JobProfitabilityRow {
  jobId: number; jobNumber: string; jobTitle: string; customerName: string | null;
  quotedPrice: number; actualCost: number; margin: number; marginPercent: number;
  materialCost: number; laborCost: number; burdenCost: number; subcontractCost: number;
  completedAt: string | null;
}
```

#### Angular Service

```typescript
// job-cost.service.ts
@Injectable({ providedIn: 'root' })
export class JobCostService {
  private readonly http = inject(HttpClient);

  getCostSummary(jobId: number): Observable<JobCostSummary> { ... }
  getMaterialIssues(jobId: number, page?: number, pageSize?: number): Observable<PaginatedResponse<MaterialIssue>> { ... }
  issueMaterial(jobId: number, request: MaterialIssueRequest): Observable<MaterialIssue> { ... }
  returnMaterial(jobId: number, issueId: number): Observable<void> { ... }
  recalculateCosts(jobId: number): Observable<void> { ... }
  getProfitabilityReport(filters?: { dateFrom?: string; dateTo?: string; customerId?: number; minMargin?: number }): Observable<JobProfitabilityRow[]> { ... }
  getLaborRates(userId: number): Observable<LaborRate[]> { ... }
  createLaborRate(rate: Omit<LaborRate, 'id'>): Observable<LaborRate> { ... }
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `JobCostTabComponent` | `features/kanban/components/job-cost-tab.component.ts` | Cost tab in job detail dialog — estimated vs. actual side-by-side with colored variance bars |
| `MaterialIssueDialogComponent` | `features/kanban/components/material-issue-dialog.component.ts` | Issue parts from inventory to job — part picker, bin selector, quantity input |
| `MaterialIssueListComponent` | `features/kanban/components/material-issue-list.component.ts` | DataTable of materials issued to job with return action |
| `LaborRateDialogComponent` | `features/admin/components/labor-rate-dialog.component.ts` | Set employee labor rates (effective-dated) |
| `JobProfitabilityReportComponent` | `features/reports/components/job-profitability-report.component.ts` | Enhanced report with cost breakdown columns and margin highlighting |

**Complexity:** Medium — mostly adding fields and computed views. Material issue needs inventory integration (BinContent decrement + movement record).

---

### 4. Operation-Level Time Tracking

**Why P1:** Tracking time at the job level only tells you "how long did the whole job take." Tracking at the operation level tells you "where did the time go?" — essential for quoting accuracy and bottleneck identification.

#### C# Entity Changes

**New fields on `TimeEntry` (`forge.core/Entities/TimeEntry.cs`):**
```csharp
public int? OperationId { get; set; }               // FK → Operation (nullable for job-level tracking)
public TimeEntryCategory Category { get; set; } = TimeEntryCategory.Run;
public Operation? Operation { get; set; }
```

**New fields on `ClockEvent` (`forge.core/Entities/ClockEvent.cs`):**
```csharp
public int? OperationId { get; set; }               // FK → Operation (nullable)
public Operation? Operation { get; set; }
```

#### Enums

**`TimeEntryCategory` (`forge.core/Enums/TimeEntryCategory.cs`):**
```csharp
public enum TimeEntryCategory
{
    Setup,          // Machine setup / changeover time
    Run,            // Actual production run time
    Teardown,       // Machine teardown / cleanup
    Inspection,     // In-process QC inspection
    Rework,         // Rework of non-conforming parts
    Wait,           // Waiting for material/tooling/instructions
    Other           // Miscellaneous
}
```

#### Models

**`OperationTimeAnalysisModel` (`forge.core/Models/OperationTimeModels.cs`):**
```csharp
public record OperationTimeAnalysisModel
{
    public int OperationId { get; init; }
    public string OperationName { get; init; } = string.Empty;
    public int OperationSequence { get; init; }
    public decimal EstimatedSetupMinutes { get; init; }
    public decimal EstimatedRunMinutes { get; init; }
    public decimal ActualSetupMinutes { get; init; }
    public decimal ActualRunMinutes { get; init; }
    public decimal ActualTotalMinutes { get; init; }
    public decimal SetupVarianceMinutes { get; init; }
    public decimal RunVarianceMinutes { get; init; }
    public decimal EfficiencyPercent { get; init; }       // Estimated / Actual × 100
    public int EntryCount { get; init; }
}

public record TimeByOperationReportRow
{
    public int PartId { get; init; }
    public string PartNumber { get; init; } = string.Empty;
    public int OperationId { get; init; }
    public string OperationName { get; init; } = string.Empty;
    public int JobCount { get; init; }                    // How many jobs had this operation
    public decimal AvgSetupMinutes { get; init; }
    public decimal AvgRunMinutesPerPiece { get; init; }
    public decimal TotalHours { get; init; }
    public decimal EstimatedHours { get; init; }
    public decimal VariancePercent { get; init; }
}

public record StartTimerWithOperationRequestModel
{
    public int JobId { get; init; }
    public int? OperationId { get; init; }
    public TimeEntryCategory Category { get; init; } = TimeEntryCategory.Run;
    public string? Notes { get; init; }
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetOperationTimeEntries` | Query | `Features/TimeTracking/GetOperationTimeEntries.cs` | Time entries for a specific job operation |
| `GetJobOperationTimeSummary` | Query | `Features/Jobs/GetJobOperationTimeSummary.cs` | Time analysis per operation for a job (estimated vs. actual) |
| `GetTimeByOperationReport` | Query | `Features/Reports/GetTimeByOperationReport.cs` | Cross-job operation time analysis for quoting accuracy |
| `StartTimerWithOperation` | Command | `Features/TimeTracking/StartTimerWithOperation.cs` | Extends StartTimer with operation + category selection |

#### API Endpoints

```
GET  /api/v1/jobs/{id}/operations/{opId}/time-entries    — TimeEntry[] for specific operation
GET  /api/v1/jobs/{id}/operation-time-summary             — OperationTimeAnalysisModel[] (all ops)
GET  /api/v1/reports/time-by-operation                    — TimeByOperationReportRow[] (part, date filters)
POST /api/v1/time-tracking/start                          — Extended: accepts operationId + category
```

#### Angular TypeScript Models

```typescript
// operation-time.model.ts
export interface OperationTimeAnalysis {
  operationId: number; operationName: string; operationSequence: number;
  estimatedSetupMinutes: number; estimatedRunMinutes: number;
  actualSetupMinutes: number; actualRunMinutes: number; actualTotalMinutes: number;
  setupVarianceMinutes: number; runVarianceMinutes: number;
  efficiencyPercent: number; entryCount: number;
}

export interface TimeByOperationRow {
  partId: number; partNumber: string;
  operationId: number; operationName: string;
  jobCount: number; avgSetupMinutes: number; avgRunMinutesPerPiece: number;
  totalHours: number; estimatedHours: number; variancePercent: number;
}

export type TimeEntryCategory = 'Setup' | 'Run' | 'Teardown' | 'Inspection' | 'Rework' | 'Wait' | 'Other';
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `OperationTimeSummaryComponent` | `features/kanban/components/operation-time-summary.component.ts` | Grouped time view per operation in job detail time tab — shows estimated vs. actual bars |
| `TimerStartDialogComponent` (modified) | `features/time-tracking/components/timer-start-dialog.component.ts` | Add operation picker dropdown (populated from job's operations) + category selector |
| `ShopFloorOperationPickerComponent` | `features/display/components/shop-floor-operation-picker.component.ts` | After job selection on kiosk, show operation list to clock onto |
| `TimeByOperationReportComponent` | `features/reports/components/time-by-operation-report.component.ts` | Cross-job operation analysis DataTable with efficiency highlighting |

**Complexity:** Low-Medium — the data model change is small (nullable FK + enum). UI changes are moderate (add operation picker to timer start flows).

---

### 5. SPC (Statistical Process Control)

**Why P1:** Required for any manufacturer doing quality-critical work (automotive, aerospace, medical). ISO 9001 doesn't require SPC but customers often do (IATF 16949 for automotive mandates it).

#### C# Entity Definitions

**`SpcCharacteristic` (`forge.core/Entities/SpcCharacteristic.cs`):**
```csharp
public class SpcCharacteristic : BaseAuditableEntity
{
    public int PartId { get; set; }
    public int? OperationId { get; set; }              // Which operation measures this
    public string Name { get; set; } = string.Empty;    // e.g. "OD", "Length", "Surface Finish"
    public string? Description { get; set; }
    public SpcMeasurementType MeasurementType { get; set; } = SpcMeasurementType.Variable;
    public decimal NominalValue { get; set; }
    public decimal UpperSpecLimit { get; set; }         // USL
    public decimal LowerSpecLimit { get; set; }         // LSL
    public string? UnitOfMeasure { get; set; }          // "in", "mm", "µin", etc.
    public int DecimalPlaces { get; set; } = 4;
    public int SampleSize { get; set; } = 5;            // Subgroup size (typically 3-5)
    public string? SampleFrequency { get; set; }        // "Every 10 parts", "Hourly", etc.
    public int? GageId { get; set; }                    // Linked gage/instrument (future P3 #22)
    public bool IsActive { get; set; } = true;
    public bool NotifyOnOoc { get; set; } = true;       // Send notification on out-of-control

    // Navigation
    public Part Part { get; set; } = null!;
    public Operation? Operation { get; set; }
    public ICollection<SpcMeasurement> Measurements { get; set; } = [];
    public ICollection<SpcControlLimit> ControlLimits { get; set; } = [];
}
```

**`SpcMeasurement` (`forge.core/Entities/SpcMeasurement.cs`):**
```csharp
public class SpcMeasurement : BaseEntity
{
    public int CharacteristicId { get; set; }
    public int? JobId { get; set; }
    public int? ProductionRunId { get; set; }
    public string? LotNumber { get; set; }
    public int MeasuredById { get; set; }
    public DateTimeOffset MeasuredAt { get; set; }
    public int SubgroupNumber { get; set; }             // Sequential subgroup #

    // Individual readings (JSON array for flexibility — supports variable sample sizes)
    public string ValuesJson { get; set; } = "[]";      // e.g. [1.0025, 1.0028, 1.0022, 1.0030, 1.0026]

    // Computed from Values
    public decimal Mean { get; set; }
    public decimal Range { get; set; }                  // Max - Min within subgroup
    public decimal StdDev { get; set; }
    public decimal Median { get; set; }

    // Spec limit checks
    public bool IsOutOfSpec { get; set; }               // Any value outside USL/LSL
    public bool IsOutOfControl { get; set; }            // Violates control limits (Western Electric rules)
    public string? OocRuleViolated { get; set; }        // Which rule triggered (WE1-WE4, Nelson1-8)
    public string? Notes { get; set; }

    // Navigation
    public SpcCharacteristic Characteristic { get; set; } = null!;
    public Job? Job { get; set; }
    public ApplicationUser MeasuredBy { get; set; } = null!;
}
```

**`SpcControlLimit` (`forge.core/Entities/SpcControlLimit.cs`):**
```csharp
public class SpcControlLimit : BaseEntity
{
    public int CharacteristicId { get; set; }
    public DateTimeOffset CalculatedAt { get; set; }
    public int SampleCount { get; set; }                // # subgroups used in calculation
    public int FromSubgroup { get; set; }               // Starting subgroup # in dataset
    public int ToSubgroup { get; set; }                 // Ending subgroup #

    // X-bar chart limits
    public decimal XBarUcl { get; set; }                // Upper control limit
    public decimal XBarLcl { get; set; }                // Lower control limit
    public decimal XBarCenterLine { get; set; }         // Grand mean (X-double-bar)

    // R chart limits (range chart)
    public decimal RangeUcl { get; set; }
    public decimal RangeLcl { get; set; }
    public decimal RangeCenterLine { get; set; }        // R-bar

    // S chart limits (std dev chart — alternative to R for n > 10)
    public decimal? SUcl { get; set; }
    public decimal? SLcl { get; set; }
    public decimal? SCenterLine { get; set; }

    // Process capability indices
    public decimal Cp { get; set; }                     // (USL - LSL) / 6σ — process capability
    public decimal Cpk { get; set; }                    // min(USL - X̄, X̄ - LSL) / 3σ — centering-adjusted
    public decimal Pp { get; set; }                     // Process performance (overall σ)
    public decimal Ppk { get; set; }                    // Performance index (overall σ, centering-adjusted)
    public decimal ProcessSigma { get; set; }           // Estimated σ from R-bar/d2

    public bool IsActive { get; set; } = true;          // Only one active per characteristic

    // Navigation
    public SpcCharacteristic Characteristic { get; set; } = null!;
}
```

**`SpcOocEvent` (`forge.core/Entities/SpcOocEvent.cs`):**
```csharp
public class SpcOocEvent : BaseEntity
{
    public int CharacteristicId { get; set; }
    public int MeasurementId { get; set; }
    public DateTimeOffset DetectedAt { get; set; }
    public string RuleName { get; set; } = string.Empty; // "WE1_BeyondLimit", "WE2_TwoOfThree", etc.
    public string Description { get; set; } = string.Empty;
    public SpcOocSeverity Severity { get; set; }
    public SpcOocStatus Status { get; set; } = SpcOocStatus.Open;
    public int? AcknowledgedById { get; set; }
    public DateTimeOffset? AcknowledgedAt { get; set; }
    public string? AcknowledgmentNotes { get; set; }
    public int? CapaId { get; set; }                    // Link to CAPA if created

    // Navigation
    public SpcCharacteristic Characteristic { get; set; } = null!;
    public SpcMeasurement Measurement { get; set; } = null!;
}
```

#### Enums

```csharp
// SpcMeasurementType.cs
public enum SpcMeasurementType
{
    Variable,       // Continuous measurement (length, weight, diameter)
    Attribute       // Pass/fail count (defects per unit, defective rate)
}

// SpcOocSeverity.cs
public enum SpcOocSeverity
{
    Warning,        // Trending toward out-of-control (zone warnings)
    OutOfControl,   // Control limit violation
    OutOfSpec       // Specification limit violation (more serious)
}

// SpcOocStatus.cs
public enum SpcOocStatus
{
    Open,
    Acknowledged,
    CapaCreated,
    Resolved
}
```

#### Core Interface

**`ISpcService` (`forge.core/Interfaces/ISpcService.cs`):**
```csharp
public interface ISpcService
{
    // Control limit calculation (A2, D3, D4 constants for sample sizes 2-25)
    Task<SpcControlLimit> CalculateControlLimitsAsync(int characteristicId, int? fromSubgroup, int? toSubgroup, CancellationToken ct);

    // Process capability
    decimal CalculateCp(decimal usl, decimal lsl, decimal sigma);
    decimal CalculateCpk(decimal usl, decimal lsl, decimal mean, decimal sigma);
    decimal CalculatePp(decimal usl, decimal lsl, decimal overallSigma);
    decimal CalculatePpk(decimal usl, decimal lsl, decimal mean, decimal overallSigma);

    // Western Electric rules (detect out-of-control)
    IReadOnlyList<SpcOocEvent> EvaluateControlRules(SpcCharacteristic characteristic, SpcControlLimit limits, IReadOnlyList<SpcMeasurement> recentSubgroups);

    // Chart data
    Task<SpcChartData> GetXBarRChartDataAsync(int characteristicId, int? lastNSubgroups, CancellationToken ct);
    Task<SpcChartData> GetXBarSChartDataAsync(int characteristicId, int? lastNSubgroups, CancellationToken ct);

    // SPC constants (A2, D3, D4, d2, A3, B3, B4, c4 for sample sizes 2-25)
    SpcConstants GetConstants(int sampleSize);
}

public record SpcConstants(decimal A2, decimal D3, decimal D4, decimal d2, decimal A3, decimal B3, decimal B4, decimal c4);

public record SpcChartData
{
    public int CharacteristicId { get; init; }
    public string CharacteristicName { get; init; } = string.Empty;
    public decimal Usl { get; init; }
    public decimal Lsl { get; init; }
    public decimal Nominal { get; init; }
    public SpcControlLimit? ActiveLimits { get; init; }
    public IReadOnlyList<SpcChartPoint> Points { get; init; } = [];
}

public record SpcChartPoint
{
    public int SubgroupNumber { get; init; }
    public DateTimeOffset MeasuredAt { get; init; }
    public decimal Mean { get; init; }          // X-bar value
    public decimal Range { get; init; }         // R value
    public decimal? StdDev { get; init; }       // S value (for X-bar/S chart)
    public bool IsOoc { get; init; }
    public string? OocRule { get; init; }
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetSpcCharacteristics` | Query | `Features/Quality/GetSpcCharacteristics.cs` | List characteristics (part, operation, active filters) |
| `CreateSpcCharacteristic` | Command | `Features/Quality/CreateSpcCharacteristic.cs` | Create with spec limits validation (USL > Nominal > LSL) |
| `UpdateSpcCharacteristic` | Command | `Features/Quality/UpdateSpcCharacteristic.cs` | Update — triggers control limit recalc if spec limits changed |
| `GetSpcChartData` | Query | `Features/Quality/GetSpcChartData.cs` | X-bar/R or X-bar/S chart data with control limit lines |
| `RecordSpcMeasurements` | Command | `Features/Quality/RecordSpcMeasurements.cs` | Record one or more subgroups, compute stats, evaluate OOC rules |
| `GetSpcMeasurements` | Query | `Features/Quality/GetSpcMeasurements.cs` | Paginated measurement list (characteristic, date range) |
| `RecalculateControlLimits` | Command | `Features/Quality/RecalculateControlLimits.cs` | Recalculate from specified subgroup range, set as active |
| `GetProcessCapability` | Query | `Features/Quality/GetProcessCapability.cs` | Cpk/Ppk report with histogram data |
| `GetOocEvents` | Query | `Features/Quality/GetOocEvents.cs` | List out-of-control events (status, severity filters) |
| `AcknowledgeOocEvent` | Command | `Features/Quality/AcknowledgeOocEvent.cs` | Acknowledge OOC event with notes |
| `CreateCapaFromOoc` | Command | `Features/Quality/CreateCapaFromOoc.cs` | Generate CAPA from OOC event (links to CAPA system #6) |

#### API Endpoints

```
GET    /api/v1/spc/characteristics                         — Paginated list (partId, operationId, isActive filters)
POST   /api/v1/spc/characteristics                         — Create characteristic
GET    /api/v1/spc/characteristics/{id}                    — Detail
PUT    /api/v1/spc/characteristics/{id}                    — Update
GET    /api/v1/spc/characteristics/{id}/chart              — SpcChartData (type=xbar-r|xbar-s, lastN query param)
POST   /api/v1/spc/measurements                           — Record measurement(s) — batch of subgroups
GET    /api/v1/spc/measurements                            — List (characteristicId, dateFrom, dateTo, jobId filters)
POST   /api/v1/spc/characteristics/{id}/recalculate-limits — Recalculate control limits
GET    /api/v1/spc/capability/{characteristicId}           — Process capability report (Cpk/Ppk + histogram data)
GET    /api/v1/spc/out-of-control                          — List OOC events (status, severity, characteristicId)
POST   /api/v1/spc/out-of-control/{id}/acknowledge         — Acknowledge OOC event
POST   /api/v1/spc/out-of-control/{id}/create-capa         — Generate CAPA from OOC
```

#### Angular TypeScript Models

```typescript
// spc.model.ts
export type SpcMeasurementType = 'Variable' | 'Attribute';
export type SpcOocSeverity = 'Warning' | 'OutOfControl' | 'OutOfSpec';
export type SpcOocStatus = 'Open' | 'Acknowledged' | 'CapaCreated' | 'Resolved';

export interface SpcCharacteristic {
  id: number; partId: number; partNumber: string;
  operationId: number | null; operationName: string | null;
  name: string; description: string | null;
  measurementType: SpcMeasurementType;
  nominalValue: number; upperSpecLimit: number; lowerSpecLimit: number;
  unitOfMeasure: string | null; decimalPlaces: number;
  sampleSize: number; sampleFrequency: string | null;
  isActive: boolean; notifyOnOoc: boolean;
}

export interface SpcMeasurement {
  id: number; characteristicId: number;
  jobId: number | null; productionRunId: number | null; lotNumber: string | null;
  measuredByName: string; measuredAt: string;
  subgroupNumber: number; values: number[];
  mean: number; range: number; stdDev: number; median: number;
  isOutOfSpec: boolean; isOutOfControl: boolean;
  oocRuleViolated: string | null; notes: string | null;
}

export interface SpcControlLimits {
  xBarUcl: number; xBarLcl: number; xBarCenterLine: number;
  rangeUcl: number; rangeLcl: number; rangeCenterLine: number;
  cp: number; cpk: number; pp: number; ppk: number;
  processSigma: number; sampleCount: number; isActive: boolean;
}

export interface SpcChartData {
  characteristicId: number; characteristicName: string;
  usl: number; lsl: number; nominal: number;
  activeLimits: SpcControlLimits | null;
  points: SpcChartPoint[];
}

export interface SpcChartPoint {
  subgroupNumber: number; measuredAt: string;
  mean: number; range: number; stdDev: number | null;
  isOoc: boolean; oocRule: string | null;
}

export interface SpcOocEvent {
  id: number; characteristicId: number; characteristicName: string;
  partNumber: string; measurementId: number;
  detectedAt: string; ruleName: string; description: string;
  severity: SpcOocSeverity; status: SpcOocStatus;
  acknowledgedByName: string | null; acknowledgedAt: string | null;
  acknowledgmentNotes: string | null; capaId: number | null;
}

export interface SpcCapabilityReport {
  characteristicId: number; characteristicName: string;
  usl: number; lsl: number; nominal: number;
  cp: number; cpk: number; pp: number; ppk: number;
  mean: number; sigma: number; sampleCount: number;
  histogramBuckets: { from: number; to: number; count: number }[];
  normalCurve: { x: number; y: number }[];
}

export interface RecordMeasurementRequest {
  characteristicId: number;
  jobId?: number; productionRunId?: number; lotNumber?: string;
  subgroups: { values: number[]; notes?: string }[];
}
```

#### Angular Service

```typescript
// spc.service.ts
@Injectable({ providedIn: 'root' })
export class SpcService {
  private readonly http = inject(HttpClient);

  getCharacteristics(filters?: { partId?: number; operationId?: number; isActive?: boolean }): Observable<PaginatedResponse<SpcCharacteristic>> { ... }
  getCharacteristic(id: number): Observable<SpcCharacteristic> { ... }
  createCharacteristic(request: Partial<SpcCharacteristic>): Observable<SpcCharacteristic> { ... }
  updateCharacteristic(id: number, request: Partial<SpcCharacteristic>): Observable<void> { ... }

  getChartData(characteristicId: number, chartType: 'xbar-r' | 'xbar-s', lastN?: number): Observable<SpcChartData> { ... }
  recordMeasurements(request: RecordMeasurementRequest): Observable<SpcMeasurement[]> { ... }
  getMeasurements(filters?: { characteristicId?: number; dateFrom?: string; dateTo?: string; jobId?: number }): Observable<PaginatedResponse<SpcMeasurement>> { ... }

  recalculateLimits(characteristicId: number, fromSubgroup?: number, toSubgroup?: number): Observable<SpcControlLimits> { ... }
  getCapabilityReport(characteristicId: number): Observable<SpcCapabilityReport> { ... }

  getOocEvents(filters?: { status?: SpcOocStatus; severity?: SpcOocSeverity; characteristicId?: number }): Observable<SpcOocEvent[]> { ... }
  acknowledgeOoc(id: number, notes: string): Observable<void> { ... }
  createCapaFromOoc(id: number): Observable<{ capaId: number }> { ... }
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `SpcCharacteristicDialogComponent` | `features/quality/components/spc-characteristic-dialog.component.ts` | Create/edit characteristic with spec limits, sample size, frequency |
| `SpcChartComponent` | `features/quality/components/spc-chart.component.ts` | X-bar/R chart using ng2-charts — dual line charts with control limit lines, spec limit bands, OOC points highlighted red |
| `SpcDataEntryComponent` | `features/quality/components/spc-data-entry.component.ts` | Quick measurement entry grid — rows = readings within subgroup, columns = subgroups. Auto-computes mean/range. Tab through cells for speed. |
| `SpcCapabilityComponent` | `features/quality/components/spc-capability.component.ts` | Cpk/Ppk display with histogram + normal distribution overlay (ng2-charts bar + line combo chart). Green/yellow/red Cpk indicators. |
| `SpcDashboardComponent` | `features/quality/components/spc-dashboard.component.ts` | OOC alert list, characteristics needing attention, at-a-glance capability summary |
| `SpcOocListComponent` | `features/quality/components/spc-ooc-list.component.ts` | DataTable of OOC events with acknowledge/create-CAPA actions |

**Complexity:** Medium-High — statistical calculations (control limits, Cpk/Ppk, Western Electric rules) are well-defined formulas. The chart rendering (dual X-bar/R charts with zones, OOC highlighting) is the main UI effort.

---

### 6. CAPA / NCR Workflow

**Why P1:** ISO 9001 Section 10.2 requires documented corrective action. ISO 13485 (medical) and IATF 16949 (automotive) require formal CAPA processes. Without this, regulated manufacturers cannot use Forge.

#### C# Entity Definitions

**`NonConformance` (`forge.core/Entities/NonConformance.cs`):**
```csharp
public class NonConformance : BaseAuditableEntity
{
    public string NcrNumber { get; set; } = string.Empty; // Auto-generated: NCR-YYYYMMDD-NNN
    public NcrType Type { get; set; }
    public int PartId { get; set; }
    public int? JobId { get; set; }
    public int? ProductionRunId { get; set; }
    public string? LotNumber { get; set; }
    public int? SalesOrderLineId { get; set; }           // If customer complaint
    public int? PurchaseOrderLineId { get; set; }        // If supplier issue
    public int? QcInspectionId { get; set; }              // If found during inspection

    // Detection
    public int DetectedById { get; set; }
    public DateTimeOffset DetectedAt { get; set; }
    public NcrDetectionStage DetectedAtStage { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal AffectedQuantity { get; set; }
    public decimal? DefectiveQuantity { get; set; }      // How many actually bad

    // Containment (immediate action)
    public string? ContainmentActions { get; set; }
    public int? ContainmentById { get; set; }
    public DateTimeOffset? ContainmentAt { get; set; }

    // Disposition
    public NcrDispositionCode? DispositionCode { get; set; }
    public int? DispositionById { get; set; }
    public DateTimeOffset? DispositionAt { get; set; }
    public string? DispositionNotes { get; set; }
    public string? ReworkInstructions { get; set; }      // If disposition = Rework

    // Cost
    public decimal? MaterialCost { get; set; }           // Cost of scrapped/reworked material
    public decimal? LaborCost { get; set; }              // Cost of rework labor
    public decimal? TotalCostImpact { get; set; }

    // Status & links
    public NcrStatus Status { get; set; } = NcrStatus.Open;
    public int? CapaId { get; set; }                     // Link to corrective action
    public int? CustomerId { get; set; }                 // If customer-reported
    public int? VendorId { get; set; }                   // If supplier-sourced

    // Navigation
    public Part Part { get; set; } = null!;
    public Job? Job { get; set; }
    public ApplicationUser DetectedBy { get; set; } = null!;
    public ApplicationUser? DispositionBy { get; set; }
    public CorrectiveAction? Capa { get; set; }
    public Customer? Customer { get; set; }
    public Vendor? Vendor { get; set; }
    public ICollection<FileAttachment> Attachments { get; set; } = [];
}
```

**`CorrectiveAction` (`forge.core/Entities/CorrectiveAction.cs`):**
```csharp
public class CorrectiveAction : BaseAuditableEntity
{
    public string CapaNumber { get; set; } = string.Empty; // Auto-generated: CAPA-YYYYMMDD-NNN
    public CapaType Type { get; set; }
    public CapaSourceType SourceType { get; set; }
    public int? SourceEntityId { get; set; }             // NCR ID, audit ID, etc.
    public string? SourceEntityType { get; set; }        // "NonConformance", "SpcOocEvent", etc.

    // Problem definition
    public string Title { get; set; } = string.Empty;
    public string ProblemDescription { get; set; } = string.Empty;
    public string? ImpactDescription { get; set; }       // Business/safety/quality impact

    // Root cause analysis
    public string? RootCauseAnalysis { get; set; }
    public RootCauseMethod? RootCauseMethod { get; set; }
    public string? RootCauseMethodData { get; set; }     // JSON: 5-Why chain, Fishbone categories, etc.
    public int? RootCauseAnalyzedById { get; set; }
    public DateTimeOffset? RootCauseCompletedAt { get; set; }

    // Actions
    public string? ContainmentAction { get; set; }       // Immediate containment
    public string? CorrectiveActionDescription { get; set; } // Fix the problem
    public string? PreventiveAction { get; set; }        // Prevent recurrence

    // Verification (did the fix work?)
    public string? VerificationMethod { get; set; }
    public string? VerificationResult { get; set; }
    public int? VerifiedById { get; set; }
    public DateTimeOffset? VerificationDate { get; set; }

    // Effectiveness check (30/60/90 day follow-up)
    public DateTimeOffset? EffectivenessCheckDueDate { get; set; }
    public DateTimeOffset? EffectivenessCheckDate { get; set; }
    public string? EffectivenessResult { get; set; }
    public bool? IsEffective { get; set; }
    public int? EffectivenessCheckedById { get; set; }

    // Ownership & status
    public int OwnerId { get; set; }                     // Primary responsible person
    public CapaStatus Status { get; set; } = CapaStatus.Open;
    public int Priority { get; set; } = 3;               // 1-5 (1 = highest)
    public DateTimeOffset DueDate { get; set; }
    public DateTimeOffset? ClosedAt { get; set; }
    public int? ClosedById { get; set; }

    // Navigation
    public ApplicationUser Owner { get; set; } = null!;
    public ApplicationUser? ClosedBy { get; set; }
    public ICollection<CapaTask> Tasks { get; set; } = [];
    public ICollection<NonConformance> RelatedNcrs { get; set; } = [];
    public ICollection<FileAttachment> Attachments { get; set; } = [];
}
```

**`CapaTask` (`forge.core/Entities/CapaTask.cs`):**
```csharp
public class CapaTask : BaseEntity
{
    public int CapaId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int AssigneeId { get; set; }
    public DateTimeOffset DueDate { get; set; }
    public CapaTaskStatus Status { get; set; } = CapaTaskStatus.Open;
    public DateTimeOffset? CompletedAt { get; set; }
    public int? CompletedById { get; set; }
    public string? CompletionNotes { get; set; }
    public int SortOrder { get; set; }

    // Navigation
    public CorrectiveAction Capa { get; set; } = null!;
    public ApplicationUser Assignee { get; set; } = null!;
}
```

#### Enums

```csharp
// NcrType.cs
public enum NcrType { Internal, Supplier, Customer }

// NcrDetectionStage.cs
public enum NcrDetectionStage { Receiving, InProcess, FinalInspection, Shipping, Customer, Audit }

// NcrDispositionCode.cs
public enum NcrDispositionCode { UseAsIs, Rework, Scrap, ReturnToVendor, SortAndScreen, Reject }

// NcrStatus.cs
public enum NcrStatus { Open, UnderReview, Contained, Dispositioned, Closed }

// CapaType.cs
public enum CapaType { Corrective, Preventive }

// CapaSourceType.cs
public enum CapaSourceType { Ncr, CustomerComplaint, InternalAudit, ExternalAudit, SpcOoc, ManagementReview, Other }

// RootCauseMethod.cs
public enum RootCauseMethod { FiveWhy, Fishbone, FaultTree, EightD, Pareto, Is_IsNot }

// CapaStatus.cs
public enum CapaStatus { Open, RootCauseAnalysis, ActionPlanning, Implementation, Verification, EffectivenessCheck, Closed }

// CapaTaskStatus.cs
public enum CapaTaskStatus { Open, InProgress, Completed, Cancelled }
```

#### Core Interface

**`INcrCapaService` (`forge.core/Interfaces/INcrCapaService.cs`):**
```csharp
public interface INcrCapaService
{
    Task<string> GenerateNcrNumberAsync(CancellationToken ct);
    Task<string> GenerateCapaNumberAsync(CancellationToken ct);
    Task<CorrectiveAction> CreateCapaFromNcrAsync(int ncrId, int ownerId, CancellationToken ct);
    Task<CorrectiveAction> AdvanceCapaPhaseAsync(int capaId, CancellationToken ct);
    Task<bool> CanAdvanceCapaAsync(int capaId, CancellationToken ct);
    Task ScheduleEffectivenessCheckAsync(int capaId, DateTimeOffset checkDate, CancellationToken ct);
    Task<NcrCostSummary> CalculateNcrCostsAsync(int ncrId, CancellationToken ct);
}

public record NcrCostSummary
{
    public decimal MaterialCost { get; init; }
    public decimal LaborCost { get; init; }
    public decimal TotalCost { get; init; }
    public int AffectedQuantity { get; init; }
    public decimal CostPerUnit { get; init; }
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetNcrs` | Query | `Features/Quality/GetNcrs.cs` | Paginated list with type/status/part/date/vendor/customer filters |
| `GetNcrById` | Query | `Features/Quality/GetNcrById.cs` | Full NCR detail with attachments + linked CAPA |
| `CreateNcr` | Command | `Features/Quality/CreateNcr.cs` | Create NCR, auto-generate number, send notification |
| `UpdateNcr` | Command | `Features/Quality/UpdateNcr.cs` | Update NCR fields |
| `DispositionNcr` | Command | `Features/Quality/DispositionNcr.cs` | Record disposition decision, update status |
| `CreateCapaFromNcr` | Command | `Features/Quality/CreateCapaFromNcr.cs` | Generate CAPA linked to NCR, copy problem description |
| `GetCapas` | Query | `Features/Quality/GetCapas.cs` | Paginated list with phase/priority/owner/due date filters |
| `GetCapaById` | Query | `Features/Quality/GetCapaById.cs` | Full CAPA detail with tasks + linked NCRs |
| `CreateCapa` | Command | `Features/Quality/CreateCapa.cs` | Create standalone CAPA |
| `UpdateCapa` | Command | `Features/Quality/UpdateCapa.cs` | Update CAPA fields |
| `AdvanceCapaPhase` | Command | `Features/Quality/AdvanceCapaPhase.cs` | Advance to next phase (validates required fields per phase) |
| `GetCapaTasks` | Query | `Features/Quality/GetCapaTasks.cs` | Tasks for a CAPA |
| `CreateCapaTask` | Command | `Features/Quality/CreateCapaTask.cs` | Add task to CAPA |
| `UpdateCapaTask` | Command | `Features/Quality/UpdateCapaTask.cs` | Update task status/completion |
| `GetNcrSummaryReport` | Query | `Features/Reports/GetNcrSummaryReport.cs` | NCR trends, Pareto by defect type, cost summary |
| `CheckCapaEffectiveness` | Job | `Jobs/CheckCapaEffectivenessJob.cs` | Hangfire daily job: notify when effectiveness checks are due |

#### API Endpoints

```
# NCR
GET    /api/v1/quality/ncrs                         — Paginated (type, status, partId, jobId, vendorId, customerId, dateFrom/To)
POST   /api/v1/quality/ncrs                         — Create NCR
GET    /api/v1/quality/ncrs/{id}                    — NCR detail
PATCH  /api/v1/quality/ncrs/{id}                    — Update NCR
POST   /api/v1/quality/ncrs/{id}/disposition         — Record disposition (code, notes, reworkInstructions)
POST   /api/v1/quality/ncrs/{id}/create-capa         — Generate CAPA from NCR
GET    /api/v1/quality/ncrs/{id}/files               — NCR attachments
POST   /api/v1/quality/ncrs/{id}/files               — Upload attachment

# CAPA
GET    /api/v1/quality/capas                         — Paginated (status, type, ownerId, priority, dueDate range)
POST   /api/v1/quality/capas                         — Create CAPA
GET    /api/v1/quality/capas/{id}                    — CAPA detail
PATCH  /api/v1/quality/capas/{id}                    — Update CAPA
POST   /api/v1/quality/capas/{id}/advance            — Advance to next phase
GET    /api/v1/quality/capas/{id}/tasks              — CAPA tasks
POST   /api/v1/quality/capas/{id}/tasks              — Add task
PATCH  /api/v1/quality/capas/{id}/tasks/{taskId}     — Update task
GET    /api/v1/quality/capas/{id}/files               — CAPA attachments
POST   /api/v1/quality/capas/{id}/files               — Upload attachment

# Reports
GET    /api/v1/reports/ncr-summary                   — NCR trends + Pareto + cost (date range, part, type)
GET    /api/v1/reports/capa-aging                     — Overdue CAPAs by phase + owner
```

#### Angular TypeScript Models

```typescript
// ncr.model.ts
export type NcrType = 'Internal' | 'Supplier' | 'Customer';
export type NcrDetectionStage = 'Receiving' | 'InProcess' | 'FinalInspection' | 'Shipping' | 'Customer' | 'Audit';
export type NcrDispositionCode = 'UseAsIs' | 'Rework' | 'Scrap' | 'ReturnToVendor' | 'SortAndScreen' | 'Reject';
export type NcrStatus = 'Open' | 'UnderReview' | 'Contained' | 'Dispositioned' | 'Closed';

export interface NonConformance {
  id: number; ncrNumber: string; type: NcrType;
  partId: number; partNumber: string; partDescription: string;
  jobId: number | null; jobNumber: string | null;
  productionRunId: number | null; lotNumber: string | null;
  detectedByName: string; detectedAt: string; detectedAtStage: NcrDetectionStage;
  description: string; affectedQuantity: number; defectiveQuantity: number | null;
  containmentActions: string | null;
  dispositionCode: NcrDispositionCode | null; dispositionByName: string | null;
  dispositionAt: string | null; dispositionNotes: string | null;
  reworkInstructions: string | null;
  materialCost: number | null; laborCost: number | null; totalCostImpact: number | null;
  status: NcrStatus; capaId: number | null; capaNumber: string | null;
  customerId: number | null; customerName: string | null;
  vendorId: number | null; vendorName: string | null;
}

// capa.model.ts
export type CapaType = 'Corrective' | 'Preventive';
export type CapaSourceType = 'Ncr' | 'CustomerComplaint' | 'InternalAudit' | 'ExternalAudit' | 'SpcOoc' | 'ManagementReview' | 'Other';
export type RootCauseMethod = 'FiveWhy' | 'Fishbone' | 'FaultTree' | 'EightD' | 'Pareto' | 'Is_IsNot';
export type CapaStatus = 'Open' | 'RootCauseAnalysis' | 'ActionPlanning' | 'Implementation' | 'Verification' | 'EffectivenessCheck' | 'Closed';
export type CapaTaskStatus = 'Open' | 'InProgress' | 'Completed' | 'Cancelled';

export interface CorrectiveAction {
  id: number; capaNumber: string; type: CapaType;
  sourceType: CapaSourceType; sourceEntityId: number | null;
  title: string; problemDescription: string; impactDescription: string | null;
  rootCauseAnalysis: string | null; rootCauseMethod: RootCauseMethod | null;
  rootCauseCompletedAt: string | null;
  containmentAction: string | null;
  correctiveActionDescription: string | null;
  preventiveAction: string | null;
  verificationMethod: string | null; verificationResult: string | null; verificationDate: string | null;
  effectivenessCheckDueDate: string | null; effectivenessCheckDate: string | null;
  effectivenessResult: string | null; isEffective: boolean | null;
  ownerName: string; ownerId: number;
  status: CapaStatus; priority: number; dueDate: string;
  closedAt: string | null; closedByName: string | null;
  taskCount: number; completedTaskCount: number;
  relatedNcrCount: number;
}

export interface CapaTask {
  id: number; capaId: number; title: string; description: string | null;
  assigneeName: string; assigneeId: number;
  dueDate: string; status: CapaTaskStatus;
  completedAt: string | null; completedByName: string | null;
  completionNotes: string | null; sortOrder: number;
}
```

#### Angular Service

```typescript
// ncr-capa.service.ts
@Injectable({ providedIn: 'root' })
export class NcrCapaService {
  private readonly http = inject(HttpClient);

  // NCR
  getNcrs(filters?: { type?: NcrType; status?: NcrStatus; partId?: number; vendorId?: number; dateFrom?: string; dateTo?: string }): Observable<PaginatedResponse<NonConformance>> { ... }
  getNcr(id: number): Observable<NonConformance> { ... }
  createNcr(request: Partial<NonConformance>): Observable<NonConformance> { ... }
  updateNcr(id: number, request: Partial<NonConformance>): Observable<void> { ... }
  dispositionNcr(id: number, disposition: { code: NcrDispositionCode; notes: string; reworkInstructions?: string }): Observable<void> { ... }
  createCapaFromNcr(ncrId: number, ownerId: number): Observable<CorrectiveAction> { ... }

  // CAPA
  getCapas(filters?: { status?: CapaStatus; type?: CapaType; ownerId?: number; priority?: number }): Observable<PaginatedResponse<CorrectiveAction>> { ... }
  getCapa(id: number): Observable<CorrectiveAction> { ... }
  createCapa(request: Partial<CorrectiveAction>): Observable<CorrectiveAction> { ... }
  updateCapa(id: number, request: Partial<CorrectiveAction>): Observable<void> { ... }
  advanceCapa(id: number): Observable<void> { ... }

  // Tasks
  getCapaTasks(capaId: number): Observable<CapaTask[]> { ... }
  createCapaTask(capaId: number, task: Partial<CapaTask>): Observable<CapaTask> { ... }
  updateCapaTask(capaId: number, taskId: number, update: Partial<CapaTask>): Observable<void> { ... }
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `NcrListComponent` | `features/quality/components/ncr-list.component.ts` | DataTable of NCRs with type/status chips, severity coloring, cost column |
| `NcrDialogComponent` | `features/quality/components/ncr-dialog.component.ts` | Create/edit NCR — part picker, detection stage, quantity, description, photos |
| `NcrDetailDialogComponent` | `features/quality/components/ncr-detail-dialog.component.ts` | Full NCR detail with containment, disposition panel, cost summary, linked CAPA |
| `NcrDispositionPanelComponent` | `features/quality/components/ncr-disposition-panel.component.ts` | Disposition decision UI — code picker, notes, rework instructions (inline within detail) |
| `CapaListComponent` | `features/quality/components/capa-list.component.ts` | DataTable with phase indicator chips, priority badges, overdue highlighting |
| `CapaDetailDialogComponent` | `features/quality/components/capa-detail-dialog.component.ts` | Multi-phase CAPA view with tab navigation: Problem → Root Cause → Actions → Verification → Effectiveness. Phase-aware form validation. |
| `CapaTaskListComponent` | `features/quality/components/capa-task-list.component.ts` | Checklist within CAPA detail — add/complete/reorder tasks |
| `RootCauseEditorComponent` | `features/quality/components/root-cause-editor.component.ts` | Method-specific editor: 5-Why chain (sequential text fields), Fishbone (categorized inputs), 8D structured form |
| `NcrSummaryReportComponent` | `features/reports/components/ncr-summary-report.component.ts` | Pareto chart by defect type, trend line, cost summary, top offenders |

**Complexity:** Medium — well-defined workflow, mostly CRUD + status machine. The root cause editor adds moderate UI complexity.

---

### 7. EDI Support (Electronic Data Interchange)

**Why P1:** Large customers (automotive OEMs, aerospace primes, retail chains) require EDI for PO/ASN/Invoice exchange. Without EDI, Forge cannot serve Tier 1/2 suppliers.

#### C# Entity Definitions

**`EdiTradingPartner` (`forge.core/Entities/EdiTradingPartner.cs`):**
```csharp
public class EdiTradingPartner : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public int? CustomerId { get; set; }                 // Inbound EDI source (they send us POs)
    public int? VendorId { get; set; }                   // Outbound EDI target

    // EDI identifiers
    public string QualifierId { get; set; } = string.Empty; // "01" (DUNS), "08" (UCC), "ZZ" (mutually defined)
    public string QualifierValue { get; set; } = string.Empty; // The actual DUNS # or ID
    public string? InterchangeSenderId { get; set; }     // ISA06 value
    public string? InterchangeReceiverId { get; set; }   // ISA08 value
    public string? ApplicationSenderId { get; set; }     // GS02
    public string? ApplicationReceiverId { get; set; }   // GS03

    // Format & transport
    public EdiFormat DefaultFormat { get; set; } = EdiFormat.X12;
    public EdiTransportMethod TransportMethod { get; set; }
    public string? TransportConfigJson { get; set; }     // AS2/SFTP/VAN connection details (encrypted)
    // TransportConfig shape: { host, port, username, password/certificate, remotePath, ... }

    // Processing rules
    public bool AutoProcess { get; set; } = true;        // Auto-create SO from 850, etc.
    public bool RequireAcknowledgment { get; set; } = true; // Auto-send 997
    public string? DefaultMappingProfileId { get; set; } // Default field mapping
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    public int? TestModePartnerId { get; set; }          // Separate partner for testing

    // Navigation
    public Customer? Customer { get; set; }
    public Vendor? Vendor { get; set; }
    public ICollection<EdiTransaction> Transactions { get; set; } = [];
    public ICollection<EdiMapping> Mappings { get; set; } = [];
}
```

**`EdiTransaction` (`forge.core/Entities/EdiTransaction.cs`):**
```csharp
public class EdiTransaction : BaseEntity
{
    public int TradingPartnerId { get; set; }
    public EdiDirection Direction { get; set; }
    public string TransactionSet { get; set; } = string.Empty; // "850", "855", "856", "810", "820", "997"
    public string? ControlNumber { get; set; }           // ISA13 interchange control #
    public string? GroupControlNumber { get; set; }      // GS06 group control #
    public string? TransactionControlNumber { get; set; } // ST02

    // Content
    public string RawPayload { get; set; } = string.Empty; // Original EDI text
    public string? ParsedDataJson { get; set; }          // Structured JSON representation
    public int? PayloadSizeBytes { get; set; }

    // Processing
    public EdiTransactionStatus Status { get; set; } = EdiTransactionStatus.Received;
    public string? RelatedEntityType { get; set; }       // "SalesOrder", "Shipment", "Invoice", "Payment"
    public int? RelatedEntityId { get; set; }
    public DateTimeOffset? ReceivedAt { get; set; }
    public DateTimeOffset? ProcessedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorDetailJson { get; set; }         // Segment-level errors
    public int RetryCount { get; set; }
    public DateTimeOffset? LastRetryAt { get; set; }

    // Acknowledgment tracking
    public int? AcknowledgmentTransactionId { get; set; } // ID of the 997 we sent/received
    public bool IsAcknowledged { get; set; }

    // Navigation
    public EdiTradingPartner TradingPartner { get; set; } = null!;
    public EdiTransaction? AcknowledgmentTransaction { get; set; }
}
```

**`EdiMapping` (`forge.core/Entities/EdiMapping.cs`):**
```csharp
public class EdiMapping : BaseAuditableEntity
{
    public int TradingPartnerId { get; set; }
    public string TransactionSet { get; set; } = string.Empty; // "850", "810", etc.
    public string Name { get; set; } = string.Empty;     // "Acme Corp 850 Mapping"

    // Field-level mappings (JSON)
    // Shape: [{ ediSegment: "PO1", ediElement: "02", qbField: "SalesOrderLine.Quantity", transform: "decimal" }, ...]
    public string FieldMappingsJson { get; set; } = "[]";

    // Value translations (JSON)
    // Shape: [{ ediValue: "EA", qbValue: "Each" }, { ediValue: "BX", qbValue: "Box" }]
    public string ValueTranslationsJson { get; set; } = "[]";

    public bool IsDefault { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public EdiTradingPartner TradingPartner { get; set; } = null!;
}
```

#### Enums

```csharp
// EdiFormat.cs
public enum EdiFormat { X12, Edifact }

// EdiTransportMethod.cs
public enum EdiTransportMethod { As2, Sftp, Van, Email, Api, Manual }

// EdiDirection.cs
public enum EdiDirection { Inbound, Outbound }

// EdiTransactionStatus.cs
public enum EdiTransactionStatus { Received, Parsing, Parsed, Validating, Validated, Processing, Applied, Error, Acknowledged, Rejected }
```

#### Core Transaction Sets

| Set | Direction | Description | Maps To | Key Segments |
|-----|-----------|-------------|---------|--------------|
| 850 | Inbound | Purchase Order | → SalesOrder + SalesOrderLines | BEG, PO1, CTT, N1, N3, N4, DTM |
| 855 | Outbound | PO Acknowledgment | ← SalesOrder | BAK, PO1 (with status) |
| 856 | Outbound | ASN (Advance Ship Notice) | ← Shipment + ShipmentLines | BSN, HL, LIN, SN1, TD1, TD5, N1 |
| 810 | Outbound | Invoice | ← Invoice + InvoiceLines | BIG, IT1, TDS, CAD, N1 |
| 820 | Inbound | Payment/Remittance | → Payment + PaymentApplications | BPR, TRN, RMR |
| 997 | Both | Functional Acknowledgment | System (auto-generated) | AK1-AK9 |

#### Core Interface

**`IEdiService` (`forge.core/Interfaces/IEdiService.cs`):**
```csharp
public interface IEdiService
{
    // Inbound processing
    Task<EdiTransaction> ReceiveDocumentAsync(string rawPayload, int tradingPartnerId, CancellationToken ct);
    Task<EdiTransaction> ParseTransactionAsync(int transactionId, CancellationToken ct);
    Task<EdiTransaction> ProcessTransactionAsync(int transactionId, CancellationToken ct);
    Task RetryTransactionAsync(int transactionId, CancellationToken ct);

    // Outbound generation
    Task<EdiTransaction> GenerateAsnAsync(int shipmentId, int tradingPartnerId, CancellationToken ct);
    Task<EdiTransaction> GenerateInvoiceEdiAsync(int invoiceId, int tradingPartnerId, CancellationToken ct);
    Task<EdiTransaction> GeneratePoAckAsync(int salesOrderId, int tradingPartnerId, CancellationToken ct);
    Task<EdiTransaction> Generate997Async(int inboundTransactionId, CancellationToken ct);

    // Transport
    Task SendTransactionAsync(int transactionId, CancellationToken ct);
    Task<IReadOnlyList<EdiTransaction>> PollInboundAsync(int tradingPartnerId, CancellationToken ct);

    // Mapping
    Task<T> ApplyMappingAsync<T>(string parsedJson, int mappingId, CancellationToken ct) where T : class;
}
```

**`IEdiTransportService` (`forge.core/Interfaces/IEdiTransportService.cs`):**
```csharp
public interface IEdiTransportService
{
    EdiTransportMethod Method { get; }
    Task SendAsync(string payload, string connectionConfig, CancellationToken ct);
    Task<IReadOnlyList<string>> PollAsync(string connectionConfig, CancellationToken ct);
    Task<bool> TestConnectionAsync(string connectionConfig, CancellationToken ct);
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetEdiTradingPartners` | Query | `Features/Edi/GetEdiTradingPartners.cs` | List partners (active filter) |
| `CreateEdiTradingPartner` | Command | `Features/Edi/CreateEdiTradingPartner.cs` | Create with transport config validation |
| `UpdateEdiTradingPartner` | Command | `Features/Edi/UpdateEdiTradingPartner.cs` | Update partner details |
| `GetEdiTransactions` | Query | `Features/Edi/GetEdiTransactions.cs` | Paginated transaction log (direction, set, status, date range) |
| `GetEdiTransactionById` | Query | `Features/Edi/GetEdiTransactionById.cs` | Full detail with raw/parsed views |
| `ReceiveEdiDocument` | Command | `Features/Edi/ReceiveEdiDocument.cs` | Receive + parse + auto-process 850→SO |
| `SendOutboundEdi` | Command | `Features/Edi/SendOutboundEdi.cs` | Generate + send EDI for entity (856/810/855) |
| `RetryEdiTransaction` | Command | `Features/Edi/RetryEdiTransaction.cs` | Retry failed transaction |
| `TestEdiConnection` | Command | `Features/Edi/TestEdiConnection.cs` | Test transport connection |
| `GetEdiMappings` | Query | `Features/Edi/GetEdiMappings.cs` | Mappings for a partner |
| `CreateEdiMapping` | Command | `Features/Edi/CreateEdiMapping.cs` | Create field mapping profile |
| `UpdateEdiMapping` | Command | `Features/Edi/UpdateEdiMapping.cs` | Update mapping fields |
| `PollEdiInbound` | Job | `Jobs/PollEdiInboundJob.cs` | Hangfire job: poll SFTP/AS2 for inbound documents |

#### API Endpoints

```
# Trading Partners
GET    /api/v1/edi/trading-partners                     — List partners
POST   /api/v1/edi/trading-partners                     — Create partner
GET    /api/v1/edi/trading-partners/{id}                — Partner detail
PUT    /api/v1/edi/trading-partners/{id}                — Update partner
POST   /api/v1/edi/trading-partners/{id}/test           — Test transport connection
DELETE /api/v1/edi/trading-partners/{id}                — Soft delete

# Transactions
GET    /api/v1/edi/transactions                          — Paginated log (direction, set, status, dateFrom/To, partnerId)
GET    /api/v1/edi/transactions/{id}                     — Detail with raw payload + parsed JSON
POST   /api/v1/edi/receive                               — Receive inbound EDI document (raw text body)
POST   /api/v1/edi/send/{entityType}/{entityId}          — Generate + send outbound (entityType: shipment/invoice/sales-order)
POST   /api/v1/edi/transactions/{id}/retry               — Retry failed transaction

# Mappings
GET    /api/v1/edi/trading-partners/{id}/mappings        — Mappings for partner
POST   /api/v1/edi/trading-partners/{id}/mappings        — Create mapping
PUT    /api/v1/edi/mappings/{id}                          — Update mapping
DELETE /api/v1/edi/mappings/{id}                          — Delete mapping
```

#### Angular TypeScript Models

```typescript
// edi.model.ts
export type EdiFormat = 'X12' | 'Edifact';
export type EdiTransportMethod = 'As2' | 'Sftp' | 'Van' | 'Email' | 'Api' | 'Manual';
export type EdiDirection = 'Inbound' | 'Outbound';
export type EdiTransactionStatus = 'Received' | 'Parsing' | 'Parsed' | 'Validating' | 'Validated' | 'Processing' | 'Applied' | 'Error' | 'Acknowledged' | 'Rejected';

export interface EdiTradingPartner {
  id: number; name: string;
  customerId: number | null; customerName: string | null;
  vendorId: number | null; vendorName: string | null;
  qualifierId: string; qualifierValue: string;
  defaultFormat: EdiFormat; transportMethod: EdiTransportMethod;
  autoProcess: boolean; requireAcknowledgment: boolean;
  isActive: boolean; notes: string | null;
  transactionCount: number; lastTransactionAt: string | null;
  errorCount: number;
}

export interface EdiTransaction {
  id: number; tradingPartnerId: number; tradingPartnerName: string;
  direction: EdiDirection; transactionSet: string;
  controlNumber: string | null;
  status: EdiTransactionStatus;
  relatedEntityType: string | null; relatedEntityId: number | null;
  receivedAt: string | null; processedAt: string | null;
  errorMessage: string | null;
  retryCount: number; isAcknowledged: boolean;
  payloadSizeBytes: number | null;
}

export interface EdiTransactionDetail extends EdiTransaction {
  rawPayload: string;
  parsedDataJson: string | null;
  errorDetailJson: string | null;
}

export interface EdiMapping {
  id: number; tradingPartnerId: number;
  transactionSet: string; name: string;
  fieldMappings: EdiFieldMapping[];
  valueTranslations: EdiValueTranslation[];
  isDefault: boolean; notes: string | null;
}

export interface EdiFieldMapping {
  ediSegment: string; ediElement: string;
  qbField: string; transform: string | null;
}

export interface EdiValueTranslation {
  ediValue: string; qbValue: string;
}
```

#### Angular Service

```typescript
// edi.service.ts
@Injectable({ providedIn: 'root' })
export class EdiService {
  private readonly http = inject(HttpClient);

  // Partners
  getTradingPartners(isActive?: boolean): Observable<EdiTradingPartner[]> { ... }
  getTradingPartner(id: number): Observable<EdiTradingPartner> { ... }
  createTradingPartner(request: Partial<EdiTradingPartner>): Observable<EdiTradingPartner> { ... }
  updateTradingPartner(id: number, request: Partial<EdiTradingPartner>): Observable<void> { ... }
  testConnection(id: number): Observable<{ success: boolean; message: string }> { ... }

  // Transactions
  getTransactions(filters?: { direction?: EdiDirection; transactionSet?: string; status?: EdiTransactionStatus; partnerId?: number; dateFrom?: string; dateTo?: string }): Observable<PaginatedResponse<EdiTransaction>> { ... }
  getTransaction(id: number): Observable<EdiTransactionDetail> { ... }
  receiveDocument(rawPayload: string, tradingPartnerId: number): Observable<EdiTransaction> { ... }
  sendOutbound(entityType: string, entityId: number): Observable<EdiTransaction> { ... }
  retryTransaction(id: number): Observable<void> { ... }

  // Mappings
  getMappings(tradingPartnerId: number): Observable<EdiMapping[]> { ... }
  createMapping(tradingPartnerId: number, mapping: Partial<EdiMapping>): Observable<EdiMapping> { ... }
  updateMapping(id: number, mapping: Partial<EdiMapping>): Observable<void> { ... }
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `EdiPanelComponent` | `features/admin/components/edi-panel.component.ts` | Main EDI admin view — trading partner list + transaction log tabs |
| `EdiPartnerDialogComponent` | `features/admin/components/edi-partner-dialog.component.ts` | Create/edit trading partner — customer/vendor picker, transport config form, test connection button |
| `EdiTransactionListComponent` | `features/admin/components/edi-transaction-list.component.ts` | DataTable of transactions with direction/status chips, retry action |
| `EdiTransactionDetailComponent` | `features/admin/components/edi-transaction-detail.component.ts` | Raw EDI viewer (monospace, segment-highlighted) + parsed JSON tree view + error details |
| `EdiMappingDialogComponent` | `features/admin/components/edi-mapping-dialog.component.ts` | Field mapping editor — EDI segment/element → QB field with drag-and-drop or table UI |
| `EdiDashboardWidgetComponent` | `features/dashboard/components/edi-dashboard-widget.component.ts` | KPI widget: pending/errors/processed counts for today |

**Libraries:** NuGet `EdiFabric` or `EdiWeave` for X12 parsing/generation. `SSH.NET` for SFTP transport.

**Complexity:** High — EDI is notoriously finicky. Each trading partner has quirks. Start with X12 850/856/810 for the most common flow.

---

### 8. Multi-Factor Authentication (MFA)

**Why P1:** Required by NIST 800-171 (DoD contractors), ITAR, and increasingly by cyber insurance policies. Without MFA, regulated manufacturers cannot deploy Forge.

#### C# Entity Definitions

**`UserMfaDevice` (`forge.core/Entities/UserMfaDevice.cs`):**
```csharp
public class UserMfaDevice : BaseEntity
{
    public int UserId { get; set; }
    public MfaDeviceType DeviceType { get; set; }
    public string EncryptedSecret { get; set; } = string.Empty; // TOTP secret key (Data Protection encrypted)
    public string? DeviceName { get; set; }              // User label: "My Authenticator App"
    public bool IsVerified { get; set; }                 // Completed setup verification
    public bool IsDefault { get; set; }                  // Primary MFA method
    public DateTimeOffset? LastUsedAt { get; set; }
    public int FailedAttempts { get; set; }              // Reset on success
    public DateTimeOffset? LockedUntil { get; set; }     // Lock after 5 failed attempts (5 min)

    // WebAuthn-specific fields
    public string? CredentialId { get; set; }            // Base64 credential ID
    public string? PublicKey { get; set; }               // Base64 public key
    public uint? SignCount { get; set; }                 // Replay counter

    // SMS/Email-specific
    public string? PhoneNumber { get; set; }             // For SMS delivery
    public string? EmailAddress { get; set; }            // For email delivery (can differ from login email)

    // Navigation
    public ApplicationUser User { get; set; } = null!;
}
```

**`MfaRecoveryCode` (`forge.core/Entities/MfaRecoveryCode.cs`):**
```csharp
public class MfaRecoveryCode : BaseEntity
{
    public int UserId { get; set; }
    public string CodeHash { get; set; } = string.Empty; // PBKDF2 hashed recovery code
    public bool IsUsed { get; set; }
    public DateTimeOffset? UsedAt { get; set; }
    public string? UsedFromIp { get; set; }

    // Navigation
    public ApplicationUser User { get; set; } = null!;
}
```

**New fields on `ApplicationUser`:**
```csharp
public bool MfaEnabled { get; set; }
public bool MfaEnforcedByPolicy { get; set; }           // Set by admin role policy
public DateTimeOffset? MfaEnabledAt { get; set; }
public int MfaRecoveryCodesRemaining { get; set; }       // Warn when low (< 3)
```

#### Enums

```csharp
// MfaDeviceType.cs
public enum MfaDeviceType
{
    Totp,           // Time-based OTP (Google Authenticator, Authy, etc.)
    Sms,            // SMS code delivery
    Email,          // Email code delivery
    WebAuthn        // FIDO2/WebAuthn hardware key (YubiKey, etc.)
}
```

#### Models

**MFA Models (`forge.core/Models/MfaModels.cs`):**
```csharp
public record MfaSetupResponseModel
{
    public string Secret { get; init; } = string.Empty;
    public string QrCodeUri { get; init; } = string.Empty;  // otpauth:// URI for QR display
    public string ManualEntryKey { get; init; } = string.Empty; // Base32 secret for manual entry
    public int DeviceId { get; init; }
}

public record MfaVerifySetupRequestModel
{
    public int DeviceId { get; init; }
    public string Code { get; init; } = string.Empty;       // 6-digit TOTP code
}

public record MfaChallengeResponseModel
{
    public string ChallengeToken { get; init; } = string.Empty; // Short-lived token (5 min)
    public MfaDeviceType DeviceType { get; init; }
    public string? MaskedTarget { get; init; }               // "***-***-1234" for SMS, "d***@g***.com" for email
}

public record MfaValidateRequestModel
{
    public string ChallengeToken { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public bool RememberDevice { get; init; }               // Trust this device for 30 days
}

public record MfaValidateResponseModel
{
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; init; }
}

public record MfaRecoveryCodesResponseModel
{
    public IReadOnlyList<string> Codes { get; init; } = []; // 10 single-use codes
    public string Warning { get; init; } = "Save these codes in a safe place. Each can only be used once.";
}

public record MfaRecoveryLoginRequestModel
{
    public string ChallengeToken { get; init; } = string.Empty;
    public string RecoveryCode { get; init; } = string.Empty;
}

public record MfaStatusResponseModel
{
    public bool IsEnabled { get; init; }
    public bool IsEnforcedByPolicy { get; init; }
    public IReadOnlyList<MfaDeviceSummary> Devices { get; init; } = [];
    public int RecoveryCodesRemaining { get; init; }
}

public record MfaDeviceSummary
{
    public int Id { get; init; }
    public MfaDeviceType DeviceType { get; init; }
    public string? DeviceName { get; init; }
    public bool IsDefault { get; init; }
    public bool IsVerified { get; init; }
    public DateTimeOffset? LastUsedAt { get; init; }
}
```

#### Core Interface

**`IMfaService` (`forge.core/Interfaces/IMfaService.cs`):**
```csharp
public interface IMfaService
{
    // Setup
    Task<MfaSetupResponseModel> BeginTotpSetupAsync(int userId, string? deviceName, CancellationToken ct);
    Task<bool> VerifyTotpSetupAsync(int userId, int deviceId, string code, CancellationToken ct);
    Task DisableMfaAsync(int userId, string currentPassword, CancellationToken ct);
    Task RemoveDeviceAsync(int userId, int deviceId, CancellationToken ct);

    // Challenge/Validate (login flow)
    Task<MfaChallengeResponseModel> CreateChallengeAsync(int userId, CancellationToken ct);
    Task<MfaValidateResponseModel?> ValidateChallengeAsync(string challengeToken, string code, bool rememberDevice, CancellationToken ct);

    // Recovery
    Task<MfaRecoveryCodesResponseModel> GenerateRecoveryCodesAsync(int userId, CancellationToken ct);
    Task<MfaValidateResponseModel?> ValidateRecoveryCodeAsync(string challengeToken, string recoveryCode, CancellationToken ct);

    // TOTP
    bool ValidateTotpCode(string secret, string code, int toleranceSteps = 1);
    string GenerateTotpSecret();
    string GenerateQrCodeUri(string secret, string email, string issuer);

    // Status
    Task<MfaStatusResponseModel> GetMfaStatusAsync(int userId, CancellationToken ct);
    Task<bool> IsMfaRequiredAsync(int userId, CancellationToken ct);

    // Device trust
    Task<bool> IsDeviceTrustedAsync(int userId, string deviceFingerprint, CancellationToken ct);
    Task TrustDeviceAsync(int userId, string deviceFingerprint, int durationDays, CancellationToken ct);
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `BeginMfaSetup` | Command | `Features/Auth/BeginMfaSetup.cs` | Generate TOTP secret, create unverified device, return QR URI |
| `VerifyMfaSetup` | Command | `Features/Auth/VerifyMfaSetup.cs` | Validate code against secret, mark device verified, enable MFA |
| `DisableMfa` | Command | `Features/Auth/DisableMfa.cs` | Requires current password, removes all devices + recovery codes |
| `RemoveMfaDevice` | Command | `Features/Auth/RemoveMfaDevice.cs` | Remove single device (must keep at least 1 if MFA enforced) |
| `CreateMfaChallenge` | Command | `Features/Auth/CreateMfaChallenge.cs` | After password auth, create short-lived challenge token |
| `ValidateMfaChallenge` | Command | `Features/Auth/ValidateMfaChallenge.cs` | Validate TOTP code, issue JWT if valid, track failed attempts |
| `GenerateRecoveryCodes` | Command | `Features/Auth/GenerateRecoveryCodes.cs` | Generate 10 codes, hash + store, return plaintext once |
| `ValidateMfaRecovery` | Command | `Features/Auth/ValidateMfaRecovery.cs` | Validate recovery code, mark used, issue JWT |
| `GetMfaStatus` | Query | `Features/Auth/GetMfaStatus.cs` | Current MFA status, devices, recovery code count |
| `SetMfaPolicy` | Command | `Features/Admin/SetMfaPolicy.cs` | Admin: set which roles require MFA |
| `GetMfaPolicyStatus` | Query | `Features/Admin/GetMfaPolicyStatus.cs` | Admin: MFA compliance across all users |

#### API Endpoints

```
# MFA Setup (authenticated user)
POST   /api/v1/auth/mfa/setup                          — Begin TOTP setup (returns QR URI + secret)
POST   /api/v1/auth/mfa/verify-setup                   — Verify TOTP code to activate device
DELETE /api/v1/auth/mfa/disable                         — Disable MFA (requires password confirmation)
DELETE /api/v1/auth/mfa/devices/{deviceId}              — Remove specific device
GET    /api/v1/auth/mfa/status                          — MFA status + devices + recovery count

# MFA Login Flow (partially authenticated — has password but not MFA)
POST   /api/v1/auth/mfa/challenge                       — Create MFA challenge (returns token + device type)
POST   /api/v1/auth/mfa/validate                        — Validate MFA code → full JWT
POST   /api/v1/auth/mfa/recovery                        — Login with recovery code → full JWT

# Recovery Codes
POST   /api/v1/auth/mfa/recovery-codes                  — Generate new recovery codes (invalidates old)

# Admin MFA Policy
GET    /api/v1/admin/mfa/policy                          — Current MFA policy (required roles)
PUT    /api/v1/admin/mfa/policy                          — Update MFA policy
GET    /api/v1/admin/mfa/compliance                      — User compliance report (who has/hasn't enabled MFA)
```

#### Angular TypeScript Models

```typescript
// mfa.model.ts
export type MfaDeviceType = 'Totp' | 'Sms' | 'Email' | 'WebAuthn';

export interface MfaSetupResponse {
  secret: string;
  qrCodeUri: string;          // otpauth://totp/Forge:user@email?secret=...&issuer=Forge
  manualEntryKey: string;     // Base32 key for manual entry
  deviceId: number;
}

export interface MfaChallengeResponse {
  challengeToken: string;
  deviceType: MfaDeviceType;
  maskedTarget: string | null; // "***-***-1234" for SMS
}

export interface MfaValidateRequest {
  challengeToken: string;
  code: string;
  rememberDevice: boolean;
}

export interface MfaStatus {
  isEnabled: boolean;
  isEnforcedByPolicy: boolean;
  devices: MfaDeviceSummary[];
  recoveryCodesRemaining: number;
}

export interface MfaDeviceSummary {
  id: number; deviceType: MfaDeviceType;
  deviceName: string | null; isDefault: boolean;
  isVerified: boolean; lastUsedAt: string | null;
}

export interface MfaRecoveryCodesResponse {
  codes: string[];
  warning: string;
}

export interface MfaComplianceUser {
  userId: number; fullName: string; email: string;
  role: string; mfaEnabled: boolean; mfaDeviceType: MfaDeviceType | null;
  isEnforcedByPolicy: boolean;
}
```

#### Angular Service

```typescript
// mfa.service.ts
@Injectable({ providedIn: 'root' })
export class MfaService {
  private readonly http = inject(HttpClient);

  // Setup
  beginSetup(deviceName?: string): Observable<MfaSetupResponse> { ... }
  verifySetup(deviceId: number, code: string): Observable<void> { ... }
  disable(currentPassword: string): Observable<void> { ... }
  removeDevice(deviceId: number): Observable<void> { ... }
  getStatus(): Observable<MfaStatus> { ... }

  // Login flow
  createChallenge(): Observable<MfaChallengeResponse> { ... }
  validateChallenge(request: MfaValidateRequest): Observable<{ accessToken: string; refreshToken: string; expiresAt: string }> { ... }
  validateRecoveryCode(challengeToken: string, recoveryCode: string): Observable<{ accessToken: string; refreshToken: string; expiresAt: string }> { ... }

  // Recovery
  generateRecoveryCodes(): Observable<MfaRecoveryCodesResponse> { ... }

  // Admin
  getMfaPolicy(): Observable<{ requiredRoles: string[] }> { ... }
  updateMfaPolicy(requiredRoles: string[]): Observable<void> { ... }
  getComplianceReport(): Observable<MfaComplianceUser[]> { ... }
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `MfaSetupComponent` | `features/account/components/mfa-setup.component.ts` | Step-by-step TOTP setup: (1) show QR code + manual key, (2) verify code, (3) show recovery codes. Uses `angularx-qrcode` for QR display. |
| `MfaChallengeComponent` | `features/auth/components/mfa-challenge.component.ts` | MFA code entry after password login — 6-digit input with auto-submit, "Use recovery code" link |
| `MfaRecoveryCodesComponent` | `features/account/components/mfa-recovery-codes.component.ts` | Display recovery codes with copy/download buttons, "I've saved these" confirmation |
| `MfaDeviceListComponent` | `features/account/components/mfa-device-list.component.ts` | List of MFA devices with set-default/remove actions |
| `MfaStatusBadgeComponent` | `features/account/components/mfa-status-badge.component.ts` | Small inline badge showing MFA enabled/disabled with shield icon |
| `MfaPolicyPanelComponent` | `features/admin/components/mfa-policy-panel.component.ts` | Admin panel: toggle MFA requirement per role, compliance table showing user status |

**Login flow modification:** The existing `LoginComponent` needs a conditional step — after successful password auth, if MFA enabled, show `MfaChallengeComponent` instead of navigating to app. The auth interceptor must handle the intermediate "MFA required" state.

**Libraries:** `OtpNet` for TOTP generation/validation on backend. `angularx-qrcode` (already in project) for QR display.

**Complexity:** Medium — well-understood pattern. QR code generation + TOTP validation is straightforward. The login flow change requires careful JWT state management (partial auth → full auth).

---

## P2 — IMPORTANT

### 9. OEE (Overall Equipment Effectiveness)

**Why P2:** Standard manufacturing KPI (Availability × Performance × Quality). Every production manager expects this.

#### C# Entity Definitions

**`DowntimeEvent` (`forge.core/Entities/DowntimeEvent.cs`):**
```csharp
public class DowntimeEvent : BaseAuditableEntity
{
    public int WorkCenterId { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? EndedAt { get; set; }
    public decimal? DurationMinutes => EndedAt.HasValue ? (decimal)(EndedAt.Value - StartedAt).TotalMinutes : null;
    public DowntimeCategory Category { get; set; }
    public int? DowntimeReasonId { get; set; }           // FK → ReferenceData (downtime_reason group)
    public string? Description { get; set; }
    public bool IsPlanned { get; set; }                  // Planned maintenance vs. unplanned breakdown
    public int? JobId { get; set; }                      // What job was running when downtime occurred
    public int? ReportedById { get; set; }

    // Navigation
    public WorkCenter WorkCenter { get; set; } = null!;
    public Job? Job { get; set; }
    public ApplicationUser? ReportedBy { get; set; }
}
```

**New fields on `ProductionRun` (`forge.core/Entities/ProductionRun.cs`):**
```csharp
public int? WorkCenterId { get; set; }
public decimal PlannedQuantity { get; set; }
public decimal CompletedQuantity { get; set; }
public decimal ScrapQuantity { get; set; }
public decimal ReworkQuantity { get; set; }
public decimal? IdealCycleTimeSeconds { get; set; }      // Override from work center
public decimal? ActualCycleTimeSeconds { get; set; }     // Computed from run time / completed qty
public WorkCenter? WorkCenter { get; set; }
```

#### Enums

```csharp
// DowntimeCategory.cs — maps to "Six Big Losses" framework
public enum DowntimeCategory
{
    EquipmentFailure,       // Unplanned breakdown
    SetupAdjustment,        // Changeover / setup time
    Idling,                 // Minor stops, jams
    ReducedSpeed,           // Running below ideal speed
    ProcessDefects,         // Scrap during normal production
    ReducedYield            // Startup rejects / reduced yield
}
```

#### Models

```csharp
// OeeModels.cs
public record OeeCalculation
{
    public int WorkCenterId { get; init; }
    public string WorkCenterName { get; init; } = string.Empty;
    public DateOnly PeriodStart { get; init; }
    public DateOnly PeriodEnd { get; init; }

    // Time breakdown (minutes)
    public decimal ScheduledMinutes { get; init; }       // From WorkCenterCalendar
    public decimal PlannedDowntimeMinutes { get; init; }
    public decimal UnplannedDowntimeMinutes { get; init; }
    public decimal RunTimeMinutes { get; init; }

    // Quantities
    public decimal TotalQuantity { get; init; }
    public decimal GoodQuantity { get; init; }
    public decimal ScrapQuantity { get; init; }
    public decimal ReworkQuantity { get; init; }

    // The three OEE factors (0.0 - 1.0)
    public decimal Availability { get; init; }           // RunTime / (Scheduled - PlannedDowntime)
    public decimal Performance { get; init; }            // (IdealCycleTime × TotalQty) / RunTime
    public decimal Quality { get; init; }                // GoodQty / TotalQty

    // OEE = A × P × Q (0.0 - 1.0, typically displayed as percentage)
    public decimal Oee => Availability * Performance * Quality;
    public decimal OeePercent => Oee * 100;

    // World-class benchmarks
    public bool IsWorldClass => Availability >= 0.90m && Performance >= 0.95m && Quality >= 0.995m;
}

public record OeeTrendPoint
{
    public DateOnly Date { get; init; }
    public decimal Availability { get; init; }
    public decimal Performance { get; init; }
    public decimal Quality { get; init; }
    public decimal Oee { get; init; }
}

public record SixBigLossesBreakdown
{
    public int WorkCenterId { get; init; }
    public decimal EquipmentFailureMinutes { get; init; }
    public decimal SetupAdjustmentMinutes { get; init; }
    public decimal IdlingMinutes { get; init; }
    public decimal ReducedSpeedMinutes { get; init; }
    public decimal ProcessDefectMinutes { get; init; }
    public decimal ReducedYieldMinutes { get; init; }
    public decimal TotalLossMinutes { get; init; }
}
```

#### Core Interface

```csharp
// IOeeService.cs
public interface IOeeService
{
    Task<OeeCalculation> CalculateOeeAsync(int workCenterId, DateOnly from, DateOnly to, CancellationToken ct);
    Task<IReadOnlyList<OeeCalculation>> CalculateOeeForAllWorkCentersAsync(DateOnly from, DateOnly to, CancellationToken ct);
    Task<IReadOnlyList<OeeTrendPoint>> GetOeeTrendAsync(int workCenterId, DateOnly from, DateOnly to, OeeTrendGranularity granularity, CancellationToken ct);
    Task<SixBigLossesBreakdown> GetSixBigLossesAsync(int workCenterId, DateOnly from, DateOnly to, CancellationToken ct);
}

public enum OeeTrendGranularity { Daily, Weekly, Monthly }
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetOeeReport` | Query | `Features/Reports/GetOeeReport.cs` | OEE by work center (date range filter) |
| `GetOeeTrend` | Query | `Features/Reports/GetOeeTrend.cs` | OEE trend line data (daily/weekly/monthly) |
| `GetSixBigLosses` | Query | `Features/Reports/GetSixBigLosses.cs` | Loss breakdown for waterfall chart |
| `GetDowntimeEvents` | Query | `Features/ShopFloor/GetDowntimeEvents.cs` | Paginated downtime log |
| `CreateDowntimeEvent` | Command | `Features/ShopFloor/CreateDowntimeEvent.cs` | Log downtime event |
| `EndDowntimeEvent` | Command | `Features/ShopFloor/EndDowntimeEvent.cs` | Close open downtime event |

#### API Endpoints

```
GET  /api/v1/reports/oee                               — OeeCalculation[] for all work centers (dateFrom, dateTo)
GET  /api/v1/reports/oee/{workCenterId}                — Single work center OEE
GET  /api/v1/reports/oee/{workCenterId}/trend           — OeeTrendPoint[] (granularity query param)
GET  /api/v1/reports/oee/{workCenterId}/losses          — SixBigLossesBreakdown
GET  /api/v1/shop-floor/downtime                        — Paginated downtime log (workCenterId, dateFrom/To, isPlanned)
POST /api/v1/shop-floor/downtime                        — Log downtime event
PATCH /api/v1/shop-floor/downtime/{id}/end              — End downtime event
```

#### Angular TypeScript Models

```typescript
// oee.model.ts
export interface OeeCalculation {
  workCenterId: number; workCenterName: string;
  periodStart: string; periodEnd: string;
  scheduledMinutes: number; plannedDowntimeMinutes: number;
  unplannedDowntimeMinutes: number; runTimeMinutes: number;
  totalQuantity: number; goodQuantity: number; scrapQuantity: number;
  availability: number; performance: number; quality: number;
  oee: number; oeePercent: number; isWorldClass: boolean;
}

export interface OeeTrendPoint {
  date: string; availability: number; performance: number; quality: number; oee: number;
}

export interface SixBigLossesBreakdown {
  workCenterId: number;
  equipmentFailureMinutes: number; setupAdjustmentMinutes: number;
  idlingMinutes: number; reducedSpeedMinutes: number;
  processDefectMinutes: number; reducedYieldMinutes: number;
  totalLossMinutes: number;
}

export type DowntimeCategory = 'EquipmentFailure' | 'SetupAdjustment' | 'Idling' | 'ReducedSpeed' | 'ProcessDefects' | 'ReducedYield';

export interface DowntimeEvent {
  id: number; workCenterId: number; workCenterName: string;
  startedAt: string; endedAt: string | null; durationMinutes: number | null;
  category: DowntimeCategory; reasonName: string | null;
  description: string | null; isPlanned: boolean;
  jobId: number | null; jobNumber: string | null;
  reportedByName: string | null;
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `OeeDashboardWidgetComponent` | `features/dashboard/components/oee-dashboard-widget.component.ts` | Gauge chart per work center (green >85%, yellow 60-85%, red <60%) |
| `OeeReportComponent` | `features/reports/components/oee-report.component.ts` | Full OEE report — work center comparison table + trend line chart + six big losses waterfall |
| `OeeTrendChartComponent` | `features/reports/components/oee-trend-chart.component.ts` | ng2-charts line chart with A/P/Q breakdown and OEE line |
| `SixBigLossesChartComponent` | `features/reports/components/six-big-losses-chart.component.ts` | Waterfall/Pareto bar chart of losses by category |
| `DowntimeLogComponent` | `features/shop-floor/components/downtime-log.component.ts` | DataTable of downtime events with start/stop actions |
| `DowntimeDialogComponent` | `features/shop-floor/components/downtime-dialog.component.ts` | Log downtime — category, reason (from reference data), planned/unplanned toggle |

**Complexity:** Low-Medium — mostly computation from existing data + chart rendering. `DowntimeEvent` is the only truly new entity.

---

### 10. Subcontract / Outside Processing

**Why P2:** Many job shops send work out (heat treating, plating, painting, grinding). This needs to be a first-class operation type that generates a PO.

#### C# Entity Changes

**New fields on `Operation` (already specified in #3 Job Costing — repeated for clarity):**
```csharp
public bool IsSubcontract { get; set; }
public int? SubcontractVendorId { get; set; }
public decimal? SubcontractCost { get; set; }            // Per-unit cost
public int? SubcontractLeadTimeDays { get; set; }
public string? SubcontractInstructions { get; set; }     // Special instructions for vendor
public Vendor? SubcontractVendor { get; set; }
```

**`SubcontractOrder` (`forge.core/Entities/SubcontractOrder.cs`):**
```csharp
public class SubcontractOrder : BaseAuditableEntity
{
    public int JobId { get; set; }
    public int OperationId { get; set; }
    public int VendorId { get; set; }
    public int? PurchaseOrderId { get; set; }            // Generated PO
    public decimal Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TotalCost => Quantity * UnitCost;
    public DateTimeOffset SentAt { get; set; }
    public DateTimeOffset? ExpectedReturnDate { get; set; }
    public DateTimeOffset? ReceivedAt { get; set; }
    public int? ReceivedById { get; set; }
    public decimal? ReceivedQuantity { get; set; }
    public SubcontractStatus Status { get; set; } = SubcontractStatus.Pending;
    public string? ShippingTrackingNumber { get; set; }
    public string? ReturnTrackingNumber { get; set; }
    public string? Notes { get; set; }
    public int? NcrId { get; set; }                      // If quality issue on return

    // Navigation
    public Job Job { get; set; } = null!;
    public Operation Operation { get; set; } = null!;
    public Vendor Vendor { get; set; } = null!;
    public PurchaseOrder? PurchaseOrder { get; set; }
}
```

#### Enums

```csharp
// SubcontractStatus.cs
public enum SubcontractStatus { Pending, Sent, InProcess, Shipped, Received, QcPending, Complete, Rejected }
```

#### Models

```csharp
public record SendOutRequestModel
{
    public decimal Quantity { get; init; }
    public decimal UnitCost { get; init; }
    public DateTimeOffset? ExpectedReturnDate { get; init; }
    public string? ShippingTrackingNumber { get; init; }
    public string? Notes { get; init; }
    public bool CreatePurchaseOrder { get; init; } = true;
}

public record ReceiveBackRequestModel
{
    public decimal ReceivedQuantity { get; init; }
    public string? ReturnTrackingNumber { get; init; }
    public bool PassedInspection { get; init; } = true;
    public string? Notes { get; init; }
}

public record SubcontractSpendingRow
{
    public int VendorId { get; init; }
    public string VendorName { get; init; } = string.Empty;
    public string OperationType { get; init; } = string.Empty;
    public int OrderCount { get; init; }
    public decimal TotalSpend { get; init; }
    public decimal AvgLeadTimeDays { get; init; }
    public decimal OnTimePercent { get; init; }
    public decimal QualityAcceptPercent { get; init; }
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `SendOutSubcontract` | Command | `Features/Jobs/SendOutSubcontract.cs` | Create SubcontractOrder, optionally auto-generate PO line |
| `ReceiveBackSubcontract` | Command | `Features/Jobs/ReceiveBackSubcontract.cs` | Record receipt, complete operation, update PO receiving |
| `GetSubcontractOrders` | Query | `Features/Jobs/GetSubcontractOrders.cs` | Subcontract orders for a job |
| `GetSubcontractSpending` | Query | `Features/Reports/GetSubcontractSpending.cs` | Spending report by vendor/operation type |
| `GetPendingSubcontracts` | Query | `Features/ShopFloor/GetPendingSubcontracts.cs` | All outstanding subcontract orders (overdue highlighting) |

#### API Endpoints

```
POST /api/v1/jobs/{id}/operations/{opId}/send-out        — Generate subcontract order (+ optional PO)
POST /api/v1/jobs/{id}/operations/{opId}/receive-back     — Mark subcontract received
GET  /api/v1/jobs/{id}/subcontract-orders                 — SubcontractOrder[] for job
GET  /api/v1/shop-floor/pending-subcontracts              — All outstanding subcontracts
GET  /api/v1/reports/subcontract-spending                 — Spending by vendor/operation type
```

#### Angular Models

```typescript
export type SubcontractStatus = 'Pending' | 'Sent' | 'InProcess' | 'Shipped' | 'Received' | 'QcPending' | 'Complete' | 'Rejected';

export interface SubcontractOrder {
  id: number; jobId: number; jobNumber: string; operationId: number; operationName: string;
  vendorId: number; vendorName: string; purchaseOrderId: number | null; poNumber: string | null;
  quantity: number; unitCost: number; totalCost: number;
  sentAt: string; expectedReturnDate: string | null; receivedAt: string | null;
  receivedQuantity: number | null; status: SubcontractStatus;
  shippingTrackingNumber: string | null; returnTrackingNumber: string | null; notes: string | null;
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `SendOutDialogComponent` | `features/kanban/components/send-out-dialog.component.ts` | Send operation to vendor — qty, cost, expected return date, tracking # |
| `ReceiveBackDialogComponent` | `features/kanban/components/receive-back-dialog.component.ts` | Receive subcontract — qty, inspection pass/fail |
| `SubcontractListComponent` | `features/kanban/components/subcontract-list.component.ts` | Subcontract orders tab in job detail |
| `PendingSubcontractsWidgetComponent` | `features/dashboard/components/pending-subcontracts-widget.component.ts` | Dashboard widget with overdue count |

**Complexity:** Medium — integration between operations and PO system. The auto-PO generation is the main logic.

---

### 11. Receiving Inspection

**Why P2:** Many quality systems require inspecting incoming materials before acceptance into stock. Currently receiving goes straight to stock.

#### C# Entity Changes

**New fields on `ReceivingRecord` (`forge.core/Entities/ReceivingRecord.cs`):**
```csharp
public ReceivingInspectionStatus InspectionStatus { get; set; } = ReceivingInspectionStatus.NotRequired;
public int? InspectedById { get; set; }
public DateTimeOffset? InspectedAt { get; set; }
public string? InspectionNotes { get; set; }
public decimal? InspectedQuantityAccepted { get; set; }
public decimal? InspectedQuantityRejected { get; set; }
public int? QcInspectionId { get; set; }                 // Link to formal QC inspection record
public int? NcrId { get; set; }                          // Auto-created NCR if rejected
public ApplicationUser? InspectedBy { get; set; }
```

**New fields on `Part` (inspection requirements):**
```csharp
public bool RequiresReceivingInspection { get; set; }    // Auto-hold on receipt
public int? ReceivingInspectionTemplateId { get; set; }  // Default QC template for incoming inspection
public ReceivingInspectionFrequency InspectionFrequency { get; set; } = ReceivingInspectionFrequency.Every;
public int? InspectionSkipAfterN { get; set; }           // Skip after N consecutive passes (skip-lot)
```

#### Enums

```csharp
// ReceivingInspectionStatus.cs
public enum ReceivingInspectionStatus { NotRequired, Pending, InProgress, Passed, Failed, Waived, PartialAccept }

// ReceivingInspectionFrequency.cs
public enum ReceivingInspectionFrequency { Every, FirstArticle, SkipLot, Random }
```

#### Models

```csharp
public record InspectionResultRequestModel
{
    public ReceivingInspectionStatus Result { get; init; }
    public decimal? AcceptedQuantity { get; init; }
    public decimal? RejectedQuantity { get; init; }
    public string? Notes { get; init; }
    public bool CreateNcrOnReject { get; init; } = true;
    public int? QcInspectionId { get; init; }            // Link existing QC inspection
}

public record PendingInspectionItem
{
    public int ReceivingRecordId { get; init; }
    public string PartNumber { get; init; } = string.Empty;
    public string PartDescription { get; init; } = string.Empty;
    public string PoNumber { get; init; } = string.Empty;
    public string VendorName { get; init; } = string.Empty;
    public decimal ReceivedQuantity { get; init; }
    public DateTimeOffset ReceivedAt { get; init; }
    public string? QcTemplateName { get; init; }
    public int DaysWaiting { get; init; }
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetPendingInspections` | Query | `Features/Inventory/GetPendingInspections.cs` | Items awaiting inspection (sortable by age) |
| `RecordInspectionResult` | Command | `Features/Inventory/RecordInspectionResult.cs` | Pass/fail/partial — move to stock or create NCR |
| `WaiveInspection` | Command | `Features/Inventory/WaiveInspection.cs` | Waive inspection for a receiving record |

#### API Endpoints

```
GET  /api/v1/inventory/pending-inspection                — PendingInspectionItem[] (sorted by days waiting)
POST /api/v1/inventory/inspect/{receivingRecordId}        — Record inspection result
POST /api/v1/inventory/inspect/{receivingRecordId}/waive  — Waive inspection (requires Manager+ role)
```

#### Angular Models

```typescript
export type ReceivingInspectionStatus = 'NotRequired' | 'Pending' | 'InProgress' | 'Passed' | 'Failed' | 'Waived' | 'PartialAccept';

export interface PendingInspectionItem {
  receivingRecordId: number; partNumber: string; partDescription: string;
  poNumber: string; vendorName: string; receivedQuantity: number;
  receivedAt: string; qcTemplateName: string | null; daysWaiting: number;
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `ReceivingInspectionQueueComponent` | `features/inventory/components/receiving-inspection-queue.component.ts` | DataTable of pending items with age highlighting (yellow >3 days, red >7 days) |
| `InspectionResultDialogComponent` | `features/inventory/components/inspection-result-dialog.component.ts` | Pass/fail with qty split, auto-link to QC inspection, auto-create NCR option |

**Complexity:** Low — mostly adding status to existing receiving flow. The skip-lot logic adds minor complexity.

---

### 12. Unit of Measure (UOM) System

**Why P2:** Parts measured in feet, sheets, gallons, kg, etc. need conversion (buy in sheets, consume in square inches). Currently all quantities are unitless decimals.

#### C# Entity Definitions

**`UnitOfMeasure` (`forge.core/Entities/UnitOfMeasure.cs`):**
```csharp
public class UnitOfMeasure : BaseEntity
{
    public string Code { get; set; } = string.Empty;     // "ea", "ft", "in", "lb", "kg", "gal", "sheet", "sqft"
    public string Name { get; set; } = string.Empty;     // "Each", "Feet", "Inches", etc.
    public string? Symbol { get; set; }                   // "ft", "in", "lb", "kg", "gal"
    public UomCategory Category { get; set; }
    public int DecimalPlaces { get; set; } = 2;          // Display precision
    public bool IsBaseUnit { get; set; }                  // Base unit per category (in for length, lb for weight)
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    public ICollection<UomConversion> ConversionsFrom { get; set; } = [];
    public ICollection<UomConversion> ConversionsTo { get; set; } = [];
}
```

**`UomConversion` (`forge.core/Entities/UomConversion.cs`):**
```csharp
public class UomConversion : BaseEntity
{
    public int FromUomId { get; set; }
    public int ToUomId { get; set; }
    public decimal ConversionFactor { get; set; }        // FromQty × Factor = ToQty
    public int? PartId { get; set; }                     // Part-specific override (e.g., "1 sheet = 48 sqin" for a specific sheet size)
    public bool IsReversible { get; set; } = true;       // Can compute reverse (1/factor)

    public UnitOfMeasure FromUom { get; set; } = null!;
    public UnitOfMeasure ToUom { get; set; } = null!;
    public Part? Part { get; set; }
}
```

#### Enums

```csharp
// UomCategory.cs
public enum UomCategory { Count, Length, Weight, Volume, Area, Time }
```

#### Entity Changes

```csharp
// Part — add UOM fields
public int? StockUomId { get; set; }                     // How stored in inventory
public int? PurchaseUomId { get; set; }                  // How ordered from vendor
public int? SalesUomId { get; set; }                     // How sold to customer
public UnitOfMeasure? StockUom { get; set; }
public UnitOfMeasure? PurchaseUom { get; set; }
public UnitOfMeasure? SalesUom { get; set; }

// BOMEntry — add UOM
public int? UomId { get; set; }
public UnitOfMeasure? Uom { get; set; }

// PurchaseOrderLine — add UOM
public int? UomId { get; set; }
public UnitOfMeasure? Uom { get; set; }

// SalesOrderLine — add UOM
public int? UomId { get; set; }
public UnitOfMeasure? Uom { get; set; }

// BinContent — add UOM
public int? UomId { get; set; }
public UnitOfMeasure? Uom { get; set; }
```

#### Core Interface

```csharp
// IUomService.cs
public interface IUomService
{
    Task<decimal> ConvertAsync(decimal quantity, int fromUomId, int toUomId, int? partId, CancellationToken ct);
    Task<decimal?> TryConvertAsync(decimal quantity, int fromUomId, int toUomId, int? partId, CancellationToken ct);
    Task<IReadOnlyList<UomConversion>> GetConversionsAsync(int uomId, CancellationToken ct);
    Task<IReadOnlyList<UnitOfMeasure>> GetByCategory(UomCategory category, CancellationToken ct);
    decimal ConvertDirect(decimal quantity, decimal conversionFactor);
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetUnitsOfMeasure` | Query | `Features/Admin/GetUnitsOfMeasure.cs` | List all UOMs (category filter) |
| `CreateUnitOfMeasure` | Command | `Features/Admin/CreateUnitOfMeasure.cs` | Create UOM |
| `UpdateUnitOfMeasure` | Command | `Features/Admin/UpdateUnitOfMeasure.cs` | Update UOM |
| `GetUomConversions` | Query | `Features/Admin/GetUomConversions.cs` | Conversions for a UOM |
| `CreateUomConversion` | Command | `Features/Admin/CreateUomConversion.cs` | Create conversion factor |
| `ConvertQuantity` | Query | `Features/Inventory/ConvertQuantity.cs` | Convert qty between UOMs (used inline in forms) |

#### API Endpoints

```
GET    /api/v1/admin/uom                                — UnitOfMeasure[] (category filter)
POST   /api/v1/admin/uom                                — Create UOM
PUT    /api/v1/admin/uom/{id}                           — Update UOM
GET    /api/v1/admin/uom/{id}/conversions               — Conversions for UOM
POST   /api/v1/admin/uom/conversions                    — Create conversion
PUT    /api/v1/admin/uom/conversions/{id}               — Update conversion
GET    /api/v1/inventory/convert?qty=100&from=1&to=2&partId=42 — Quick convert
```

#### Seed Data (Standard UOMs)

| Code | Name | Category | Symbol |
|------|------|----------|--------|
| ea | Each | Count | ea |
| dz | Dozen | Count | dz |
| ft | Feet | Length | ft |
| in | Inches | Length | in |
| m | Meters | Length | m |
| mm | Millimeters | Length | mm |
| lb | Pounds | Weight | lb |
| oz | Ounces | Weight | oz |
| kg | Kilograms | Weight | kg |
| g | Grams | Weight | g |
| gal | Gallons | Volume | gal |
| qt | Quarts | Volume | qt |
| L | Liters | Volume | L |
| sqft | Square Feet | Area | ft² |
| sqin | Square Inches | Area | in² |
| sheet | Sheets | Count | sht |
| roll | Rolls | Count | roll |

#### Angular Models

```typescript
export type UomCategory = 'Count' | 'Length' | 'Weight' | 'Volume' | 'Area' | 'Time';

export interface UnitOfMeasure {
  id: number; code: string; name: string; symbol: string | null;
  category: UomCategory; decimalPlaces: number; isBaseUnit: boolean; isActive: boolean;
}

export interface UomConversion {
  id: number; fromUomId: number; fromUomCode: string;
  toUomId: number; toUomCode: string;
  conversionFactor: number; partId: number | null; isReversible: boolean;
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `UomAdminPanelComponent` | `features/admin/components/uom-admin-panel.component.ts` | UOM + conversion management (admin settings tab) |
| `UomSelectComponent` | `shared/components/uom-select/uom-select.component.ts` | CVA select dropdown filtered by category, used in part/PO/SO forms |
| `UomConversionDialogComponent` | `features/admin/components/uom-conversion-dialog.component.ts` | Create/edit conversion with inline calculator |

**Complexity:** Medium — pervasive change touching many entities and all quantity calculations. The conversion logic itself is simple; the breadth of changes is the challenge.

---

### 13. Approval Workflows (Configurable)

**Why P2:** PO approval, time approval, expense approval, quote approval — each currently either has no approval or hardcoded logic. A configurable workflow engine adds governance.

#### C# Entity Definitions

**`ApprovalWorkflow` (`forge.core/Entities/ApprovalWorkflow.cs`):**
```csharp
public class ApprovalWorkflow : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty; // "PurchaseOrder", "Expense", "Quote", "TimeEntry", "SalesOrder"
    public bool IsActive { get; set; } = true;
    public string? Description { get; set; }

    // Threshold conditions (JSON) — when this workflow activates
    // Shape: { "amountGreaterThan": 500, "roles": ["Engineer"], "conditions": [{ "field": "Amount", "op": ">", "value": 1000 }] }
    public string? ActivationConditionsJson { get; set; }

    public ICollection<ApprovalStep> Steps { get; set; } = [];
}
```

**`ApprovalStep` (`forge.core/Entities/ApprovalStep.cs`):**
```csharp
public class ApprovalStep : BaseEntity
{
    public int WorkflowId { get; set; }
    public int StepNumber { get; set; }                  // Sequential order
    public string Name { get; set; } = string.Empty;     // "Manager Approval", "Director Approval"
    public ApproverType ApproverType { get; set; }
    public int? ApproverUserId { get; set; }             // If SpecificUser
    public string? ApproverRole { get; set; }            // If Role — any user with this role can approve
    public bool UseDirectManager { get; set; }           // If Manager — use submitter's direct manager
    public decimal? AutoApproveBelow { get; set; }       // Auto-approve if amount < threshold
    public int? EscalationHours { get; set; }            // Auto-escalate to next step after N hours
    public bool RequireComments { get; set; }            // Must provide reason when rejecting
    public bool AllowDelegation { get; set; } = true;

    public ApprovalWorkflow Workflow { get; set; } = null!;
    public ApplicationUser? ApproverUser { get; set; }
}
```

**`ApprovalRequest` (`forge.core/Entities/ApprovalRequest.cs`):**
```csharp
public class ApprovalRequest : BaseEntity
{
    public int WorkflowId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public int CurrentStepNumber { get; set; }
    public ApprovalRequestStatus Status { get; set; } = ApprovalRequestStatus.Pending;
    public int RequestedById { get; set; }
    public DateTimeOffset RequestedAt { get; set; }
    public decimal? Amount { get; set; }                 // Cached for threshold checks
    public string? EntitySummary { get; set; }           // "PO-2026-0042 — $12,500 — Acme Metals"
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset? EscalatedAt { get; set; }

    public ApprovalWorkflow Workflow { get; set; } = null!;
    public ApplicationUser RequestedBy { get; set; } = null!;
    public ICollection<ApprovalDecision> Decisions { get; set; } = [];
}
```

**`ApprovalDecision` (`forge.core/Entities/ApprovalDecision.cs`):**
```csharp
public class ApprovalDecision : BaseEntity
{
    public int RequestId { get; set; }
    public int StepNumber { get; set; }
    public int DecidedById { get; set; }
    public ApprovalDecisionType Decision { get; set; }
    public string? Comments { get; set; }
    public DateTimeOffset DecidedAt { get; set; }
    public int? DelegatedToUserId { get; set; }          // If delegated

    public ApprovalRequest Request { get; set; } = null!;
    public ApplicationUser DecidedBy { get; set; } = null!;
    public ApplicationUser? DelegatedToUser { get; set; }
}
```

#### Enums

```csharp
// ApproverType.cs
public enum ApproverType { SpecificUser, Role, Manager }

// ApprovalRequestStatus.cs
public enum ApprovalRequestStatus { Pending, Approved, Rejected, Escalated, Cancelled, AutoApproved }

// ApprovalDecisionType.cs
public enum ApprovalDecisionType { Approve, Reject, Delegate, Escalate }
```

#### Core Interface

```csharp
// IApprovalService.cs
public interface IApprovalService
{
    Task<ApprovalRequest?> SubmitForApprovalAsync(string entityType, int entityId, int requestedById, decimal? amount, CancellationToken ct);
    Task<ApprovalRequest?> ApproveAsync(int requestId, int decidedById, string? comments, CancellationToken ct);
    Task<ApprovalRequest?> RejectAsync(int requestId, int decidedById, string comments, CancellationToken ct);
    Task<ApprovalRequest?> DelegateAsync(int requestId, int decidedById, int delegateToUserId, CancellationToken ct);
    Task<bool> IsApprovalRequiredAsync(string entityType, int entityId, decimal? amount, CancellationToken ct);
    Task<IReadOnlyList<ApprovalRequest>> GetPendingApprovalsAsync(int userId, CancellationToken ct);
    Task CheckEscalationsAsync(CancellationToken ct);     // Hangfire job
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetApprovalWorkflows` | Query | `Features/Admin/GetApprovalWorkflows.cs` | List workflows (admin) |
| `CreateApprovalWorkflow` | Command | `Features/Admin/CreateApprovalWorkflow.cs` | Create workflow with steps |
| `UpdateApprovalWorkflow` | Command | `Features/Admin/UpdateApprovalWorkflow.cs` | Update workflow/steps |
| `SubmitForApproval` | Command | `Features/Approvals/SubmitForApproval.cs` | Submit entity for approval |
| `ApproveRequest` | Command | `Features/Approvals/ApproveRequest.cs` | Approve at current step, advance or complete |
| `RejectRequest` | Command | `Features/Approvals/RejectRequest.cs` | Reject with reason, notify requester |
| `DelegateRequest` | Command | `Features/Approvals/DelegateRequest.cs` | Delegate to another user |
| `GetPendingApprovals` | Query | `Features/Approvals/GetPendingApprovals.cs` | My pending approvals |
| `GetApprovalHistory` | Query | `Features/Approvals/GetApprovalHistory.cs` | Approval history for an entity |
| `CheckApprovalEscalations` | Job | `Jobs/CheckApprovalEscalationsJob.cs` | Hangfire hourly: escalate overdue approvals |

#### API Endpoints

```
# Approval actions (user)
GET    /api/v1/approvals/pending                         — My pending approvals
GET    /api/v1/approvals/history/{entityType}/{entityId} — Approval history for entity
POST   /api/v1/approvals/submit                          — Submit entity for approval
POST   /api/v1/approvals/{requestId}/approve             — Approve
POST   /api/v1/approvals/{requestId}/reject              — Reject (requires comments)
POST   /api/v1/approvals/{requestId}/delegate            — Delegate to user

# Admin
GET    /api/v1/admin/approval-workflows                  — List workflows
POST   /api/v1/admin/approval-workflows                  — Create workflow
PUT    /api/v1/admin/approval-workflows/{id}             — Update workflow + steps
DELETE /api/v1/admin/approval-workflows/{id}             — Deactivate workflow
```

#### Angular Models

```typescript
export type ApproverType = 'SpecificUser' | 'Role' | 'Manager';
export type ApprovalRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Escalated' | 'Cancelled' | 'AutoApproved';
export type ApprovalDecisionType = 'Approve' | 'Reject' | 'Delegate' | 'Escalate';

export interface ApprovalRequest {
  id: number; workflowName: string; entityType: string; entityId: number;
  entitySummary: string | null; amount: number | null;
  currentStepNumber: number; currentStepName: string;
  status: ApprovalRequestStatus;
  requestedByName: string; requestedAt: string;
  decisions: ApprovalDecision[];
}

export interface ApprovalDecision {
  stepNumber: number; stepName: string;
  decidedByName: string; decision: ApprovalDecisionType;
  comments: string | null; decidedAt: string;
}

export interface ApprovalWorkflow {
  id: number; name: string; entityType: string;
  isActive: boolean; description: string | null;
  steps: ApprovalStep[];
}

export interface ApprovalStep {
  stepNumber: number; name: string; approverType: ApproverType;
  approverUserName: string | null; approverRole: string | null;
  autoApproveBelow: number | null; escalationHours: number | null;
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `ApprovalInboxComponent` | `features/approvals/components/approval-inbox.component.ts` | Pending approvals list with approve/reject/delegate inline actions |
| `ApprovalDetailDialogComponent` | `features/approvals/components/approval-detail-dialog.component.ts` | Entity summary + decision history + action buttons |
| `ApprovalBadgeComponent` | `shared/components/approval-badge/approval-badge.component.ts` | Status badge shown on PO/expense/quote cards |
| `ApprovalHistoryComponent` | `shared/components/approval-history/approval-history.component.ts` | Timeline of approval decisions (embedded in entity detail panels) |
| `ApprovalWorkflowEditorComponent` | `features/admin/components/approval-workflow-editor.component.ts` | Admin: create/edit workflows with step builder (drag to reorder, step config) |

**Complexity:** Medium-High — the workflow engine needs to be generic enough to handle different entity types. Escalation and delegation add moderate complexity.

---

### 14. Credit Management

**Why P2:** Without credit limits, you can ship unlimited product to a customer who doesn't pay. Standard in order management.

#### C# Entity Changes

**New fields on `Customer` (`forge.core/Entities/Customer.cs`):**
```csharp
public decimal? CreditLimit { get; set; }                // Max outstanding AR balance
public bool IsOnCreditHold { get; set; }
public string? CreditHoldReason { get; set; }
public DateTimeOffset? CreditHoldAt { get; set; }
public int? CreditHoldById { get; set; }
public DateTimeOffset? LastCreditReviewDate { get; set; }
public int? CreditReviewFrequencyDays { get; set; }      // Auto-remind for review
public ApplicationUser? CreditHoldBy { get; set; }
```

#### Models

```csharp
public record CreditStatusModel
{
    public int CustomerId { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public decimal? CreditLimit { get; init; }
    public decimal OpenArBalance { get; init; }           // Sum of unpaid invoices
    public decimal PendingOrdersTotal { get; init; }      // Sum of open SO amounts
    public decimal TotalExposure => OpenArBalance + PendingOrdersTotal;
    public decimal AvailableCredit => (CreditLimit ?? 0) - TotalExposure;
    public decimal UtilizationPercent => CreditLimit > 0 ? TotalExposure / CreditLimit.Value * 100 : 0;
    public bool IsOnHold { get; init; }
    public string? HoldReason { get; init; }
    public bool IsOverLimit => CreditLimit.HasValue && TotalExposure > CreditLimit.Value;
    public CreditRisk RiskLevel { get; init; }
}

public enum CreditRisk { Low, Medium, High, OnHold }
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetCreditStatus` | Query | `Features/Customers/GetCreditStatus.cs` | Open AR + pending SOs vs. credit limit |
| `PlaceCreditHold` | Command | `Features/Customers/PlaceCreditHold.cs` | Place customer on hold with reason |
| `ReleaseCreditHold` | Command | `Features/Customers/ReleaseCreditHold.cs` | Release hold |
| `CheckCreditOnOrder` | Query | `Features/SalesOrders/CheckCreditOnOrder.cs` | Validate credit before SO confirmation (called by CreateSalesOrder) |
| `CheckCreditReviewsDue` | Job | `Jobs/CheckCreditReviewsDueJob.cs` | Hangfire daily: notify when customer credit reviews are due |

#### API Endpoints

```
GET  /api/v1/customers/{id}/credit-status               — CreditStatusModel
POST /api/v1/customers/{id}/credit-hold                  — Place on hold (reason required)
POST /api/v1/customers/{id}/credit-release               — Release hold
GET  /api/v1/reports/credit-risk                         — All customers sorted by utilization %
```

#### Angular Models

```typescript
export type CreditRisk = 'Low' | 'Medium' | 'High' | 'OnHold';

export interface CreditStatus {
  customerId: number; customerName: string;
  creditLimit: number | null; openArBalance: number; pendingOrdersTotal: number;
  totalExposure: number; availableCredit: number; utilizationPercent: number;
  isOnHold: boolean; holdReason: string | null; isOverLimit: boolean; riskLevel: CreditRisk;
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `CreditStatusCardComponent` | `features/customers/components/credit-status-card.component.ts` | Credit gauge in customer detail — utilization bar, hold status, limit info |
| `CreditHoldDialogComponent` | `features/customers/components/credit-hold-dialog.component.ts` | Place/release hold with reason textarea |
| `CreditRiskReportComponent` | `features/reports/components/credit-risk-report.component.ts` | DataTable of customers by credit utilization with risk coloring |

**Complexity:** Low — few fields + validation check on SO creation. The main logic is in the `CheckCreditOnOrder` handler that blocks/warns during SO confirmation.

---

### 15. Vendor Scorecards / Supplier Quality

**Why P2:** Track vendor performance (on-time delivery, quality, price) for sourcing decisions.

#### C# Entity Definitions

**`VendorScorecard` (`forge.core/Entities/VendorScorecard.cs`):**
```csharp
public class VendorScorecard : BaseEntity
{
    public int VendorId { get; set; }
    public DateOnly PeriodStart { get; set; }
    public DateOnly PeriodEnd { get; set; }

    // Delivery metrics
    public int TotalPurchaseOrders { get; set; }
    public int TotalLinesReceived { get; set; }
    public int OnTimeDeliveries { get; set; }
    public int LateDeliveries { get; set; }
    public int EarlyDeliveries { get; set; }
    public decimal AvgLeadTimeDays { get; set; }
    public decimal OnTimeDeliveryPercent { get; set; }    // OnTime / Total × 100

    // Quality metrics (requires #11 Receiving Inspection or #6 NCR)
    public int TotalInspected { get; set; }
    public int TotalAccepted { get; set; }
    public int TotalRejected { get; set; }
    public int TotalNcrs { get; set; }
    public decimal QualityAcceptancePercent { get; set; } // Accepted / Inspected × 100

    // Price metrics
    public decimal TotalSpend { get; set; }
    public decimal AvgPriceVariancePercent { get; set; }  // Actual vs. quoted price
    public int CostIncreaseCount { get; set; }            // Times vendor increased price

    // Quantity metrics
    public int QuantityShortages { get; set; }            // Received < ordered
    public int QuantityOverages { get; set; }
    public decimal QuantityAccuracyPercent { get; set; }

    // Overall
    public decimal OverallScore { get; set; }             // Weighted composite (0-100)
    public VendorGrade Grade { get; set; }                // A/B/C/D/F

    // Calculation metadata
    public DateTimeOffset CalculatedAt { get; set; }
    public string? CalculationNotes { get; set; }

    // Navigation
    public Vendor Vendor { get; set; } = null!;
}
```

#### Enums

```csharp
// VendorGrade.cs
public enum VendorGrade { A, B, C, D, F }
```

#### Models

```csharp
public record VendorScorecardWeights
{
    public decimal DeliveryWeight { get; init; } = 0.40m;
    public decimal QualityWeight { get; init; } = 0.30m;
    public decimal PriceWeight { get; init; } = 0.20m;
    public decimal QuantityWeight { get; init; } = 0.10m;
}

public record VendorComparisonRow
{
    public int VendorId { get; init; }
    public string VendorName { get; init; } = string.Empty;
    public decimal OnTimePercent { get; init; }
    public decimal QualityPercent { get; init; }
    public decimal TotalSpend { get; init; }
    public decimal OverallScore { get; init; }
    public VendorGrade Grade { get; init; }
    public string Trend { get; init; } = string.Empty;   // "Improving", "Declining", "Stable"
}
```

#### Core Interface

```csharp
// IVendorScorecardService.cs
public interface IVendorScorecardService
{
    Task<VendorScorecard> CalculateScorecardAsync(int vendorId, DateOnly from, DateOnly to, CancellationToken ct);
    Task RecalculateAllScorecardsAsync(DateOnly from, DateOnly to, CancellationToken ct);
    decimal CalculateOverallScore(VendorScorecard scorecard, VendorScorecardWeights weights);
    VendorGrade DetermineGrade(decimal overallScore);
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetVendorScorecard` | Query | `Features/Vendors/GetVendorScorecard.cs` | Scorecard for vendor (date range) |
| `GetVendorPerformanceReport` | Query | `Features/Reports/GetVendorPerformanceReport.cs` | Multi-vendor comparison |
| `RecalculateVendorScorecards` | Job | `Jobs/RecalculateVendorScorecardsJob.cs` | Hangfire monthly: recalculate all scorecards |

#### API Endpoints

```
GET  /api/v1/vendors/{id}/scorecard                      — VendorScorecard (dateFrom, dateTo query params)
GET  /api/v1/vendors/{id}/scorecard/trend                 — Historical scorecard trend
GET  /api/v1/reports/vendor-performance                   — VendorComparisonRow[] (date range, min score)
POST /api/v1/admin/vendor-scorecards/recalculate          — Trigger recalculation (admin)
```

#### Angular Models

```typescript
export type VendorGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface VendorScorecard {
  vendorId: number; vendorName: string;
  periodStart: string; periodEnd: string;
  totalPurchaseOrders: number; totalLinesReceived: number;
  onTimeDeliveryPercent: number; qualityAcceptancePercent: number;
  totalSpend: number; avgPriceVariancePercent: number;
  quantityAccuracyPercent: number;
  overallScore: number; grade: VendorGrade;
  totalNcrs: number; lateDeliveries: number;
}

export interface VendorComparisonRow {
  vendorId: number; vendorName: string;
  onTimePercent: number; qualityPercent: number;
  totalSpend: number; overallScore: number; grade: VendorGrade; trend: string;
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `VendorScorecardTabComponent` | `features/vendors/components/vendor-scorecard-tab.component.ts` | Scorecard tab in vendor detail — radar chart (delivery/quality/price/qty), KPI chips, grade badge |
| `VendorPerformanceReportComponent` | `features/reports/components/vendor-performance-report.component.ts` | Multi-vendor comparison DataTable with grade chips + trend arrows |
| `VendorGradeBadgeComponent` | `shared/components/vendor-grade-badge/vendor-grade-badge.component.ts` | Inline A/B/C/D/F badge with color coding |

**Complexity:** Low — aggregation queries over existing PO/receiving/NCR data. The weighted scoring formula is straightforward.

---

### 16. RFQ (Request for Quote) Process

**Why P2:** Formalizes vendor quoting before PO creation. Common in manufacturing procurement.

#### C# Entity Definitions

**`RequestForQuote` (`forge.core/Entities/RequestForQuote.cs`):**
```csharp
public class RequestForQuote : BaseAuditableEntity
{
    public string RfqNumber { get; set; } = string.Empty; // Auto-generated: RFQ-YYYYMMDD-NNN
    public int PartId { get; set; }
    public decimal Quantity { get; set; }
    public DateTimeOffset RequiredDate { get; set; }
    public RfqStatus Status { get; set; } = RfqStatus.Draft;
    public string? Description { get; set; }             // Additional specs/requirements
    public string? SpecialInstructions { get; set; }
    public DateTimeOffset? ResponseDeadline { get; set; } // When vendors must respond by
    public DateTimeOffset? SentAt { get; set; }
    public DateTimeOffset? AwardedAt { get; set; }
    public int? AwardedVendorResponseId { get; set; }
    public int? GeneratedPurchaseOrderId { get; set; }    // PO created from awarded RFQ
    public string? Notes { get; set; }

    // Navigation
    public Part Part { get; set; } = null!;
    public ICollection<RfqVendorResponse> VendorResponses { get; set; } = [];
    public ICollection<FileAttachment> Attachments { get; set; } = [];
    public PurchaseOrder? GeneratedPurchaseOrder { get; set; }
}
```

**`RfqVendorResponse` (`forge.core/Entities/RfqVendorResponse.cs`):**
```csharp
public class RfqVendorResponse : BaseEntity
{
    public int RfqId { get; set; }
    public int VendorId { get; set; }
    public RfqResponseStatus ResponseStatus { get; set; } = RfqResponseStatus.Pending;
    public decimal? UnitPrice { get; set; }
    public decimal? TotalPrice => UnitPrice.HasValue ? UnitPrice.Value * Rfq?.Quantity ?? 0 : null;
    public int? LeadTimeDays { get; set; }
    public decimal? MinimumOrderQuantity { get; set; }
    public decimal? ToolingCost { get; set; }            // One-time tooling/setup cost
    public DateTimeOffset? QuoteValidUntil { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset? InvitedAt { get; set; }       // When vendor was invited
    public DateTimeOffset? RespondedAt { get; set; }
    public bool IsAwarded { get; set; }
    public string? DeclineReason { get; set; }

    // Navigation
    public RequestForQuote Rfq { get; set; } = null!;
    public Vendor Vendor { get; set; } = null!;
}
```

#### Enums

```csharp
// RfqStatus.cs
public enum RfqStatus { Draft, Sent, Receiving, EvaluatingResponses, Awarded, Cancelled, Expired }

// RfqResponseStatus.cs
public enum RfqResponseStatus { Pending, Received, Declined, Awarded, NotAwarded }
```

#### Core Interface

```csharp
// IRfqService.cs
public interface IRfqService
{
    Task<string> GenerateRfqNumberAsync(CancellationToken ct);
    Task SendRfqToVendorsAsync(int rfqId, IEnumerable<int> vendorIds, CancellationToken ct);
    Task<PurchaseOrder> AwardAndCreatePoAsync(int rfqId, int vendorResponseId, CancellationToken ct);
    Task<IReadOnlyList<RfqVendorResponse>> CompareResponsesAsync(int rfqId, CancellationToken ct);
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetRfqs` | Query | `Features/Purchasing/GetRfqs.cs` | Paginated list (status, partId, date range) |
| `GetRfqById` | Query | `Features/Purchasing/GetRfqById.cs` | Full RFQ with vendor responses |
| `CreateRfq` | Command | `Features/Purchasing/CreateRfq.cs` | Create RFQ |
| `UpdateRfq` | Command | `Features/Purchasing/UpdateRfq.cs` | Update RFQ (draft only) |
| `SendRfqToVendors` | Command | `Features/Purchasing/SendRfqToVendors.cs` | Invite vendors (email notification) |
| `RecordVendorResponse` | Command | `Features/Purchasing/RecordVendorResponse.cs` | Record vendor's quote response |
| `AwardRfq` | Command | `Features/Purchasing/AwardRfq.cs` | Award to vendor, auto-generate PO |
| `CompareRfqResponses` | Query | `Features/Purchasing/CompareRfqResponses.cs` | Side-by-side comparison of vendor quotes |

#### API Endpoints

```
GET    /api/v1/purchasing/rfqs                           — Paginated list (status, partId, dateFrom/To)
POST   /api/v1/purchasing/rfqs                           — Create RFQ
GET    /api/v1/purchasing/rfqs/{id}                      — RFQ detail with vendor responses
PUT    /api/v1/purchasing/rfqs/{id}                      — Update RFQ
POST   /api/v1/purchasing/rfqs/{id}/send                 — Send to selected vendors
POST   /api/v1/purchasing/rfqs/{id}/responses             — Record vendor response
GET    /api/v1/purchasing/rfqs/{id}/compare               — Comparison matrix
POST   /api/v1/purchasing/rfqs/{id}/award/{responseId}    — Award to vendor → create PO
DELETE /api/v1/purchasing/rfqs/{id}                       — Cancel RFQ
```

#### Angular Models

```typescript
export type RfqStatus = 'Draft' | 'Sent' | 'Receiving' | 'EvaluatingResponses' | 'Awarded' | 'Cancelled' | 'Expired';
export type RfqResponseStatus = 'Pending' | 'Received' | 'Declined' | 'Awarded' | 'NotAwarded';

export interface RequestForQuote {
  id: number; rfqNumber: string; partId: number; partNumber: string; partDescription: string;
  quantity: number; requiredDate: string; status: RfqStatus;
  description: string | null; responseDeadline: string | null;
  sentAt: string | null; awardedAt: string | null;
  vendorResponseCount: number; receivedResponseCount: number;
  generatedPoId: number | null; generatedPoNumber: string | null;
}

export interface RfqVendorResponse {
  id: number; rfqId: number; vendorId: number; vendorName: string;
  responseStatus: RfqResponseStatus;
  unitPrice: number | null; totalPrice: number | null;
  leadTimeDays: number | null; minimumOrderQuantity: number | null;
  toolingCost: number | null; quoteValidUntil: string | null;
  notes: string | null; respondedAt: string | null; isAwarded: boolean;
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `RfqListComponent` | `features/purchasing/components/rfq-list.component.ts` | DataTable of RFQs with status chips |
| `RfqDialogComponent` | `features/purchasing/components/rfq-dialog.component.ts` | Create/edit RFQ — part picker, quantity, required date, vendor selection |
| `RfqDetailDialogComponent` | `features/purchasing/components/rfq-detail-dialog.component.ts` | Full RFQ detail with vendor responses table |
| `RfqVendorResponseDialogComponent` | `features/purchasing/components/rfq-vendor-response-dialog.component.ts` | Record vendor response — price, lead time, MOQ, notes |
| `RfqComparisonComponent` | `features/purchasing/components/rfq-comparison.component.ts` | Side-by-side vendor comparison matrix — columns = vendors, rows = metrics (price, lead time, MOQ, tooling). Winning values highlighted green. |

**Complexity:** Low-Medium — straightforward CRUD with vendor comparison UI. The auto-PO generation from award links to existing PO system.

---

## P3 — STANDARD

### 17. Alternate / Substitute Parts

#### C# Entity Definition

**`PartAlternate` (`forge.core/Entities/PartAlternate.cs`):**
```csharp
public class PartAlternate : BaseAuditableEntity
{
    public int PartId { get; set; }                      // Primary part
    public int AlternatePartId { get; set; }             // Substitute part
    public int Priority { get; set; } = 1;               // Lower = preferred
    public AlternateType Type { get; set; } = AlternateType.Substitute;
    public decimal? ConversionFactor { get; set; }       // e.g., need 1.2x of alternate
    public bool IsApproved { get; set; }
    public int? ApprovedById { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
    public string? Notes { get; set; }
    public bool IsBidirectional { get; set; }            // A↔B or A→B only

    public Part Part { get; set; } = null!;
    public Part AlternatePart { get; set; } = null!;
}
```

**Enum:** `AlternateType { Substitute, Equivalent, Superseded }`

**MRP integration:** When primary part unavailable, MRP checks `PartAlternate` sorted by Priority. If `IsApproved && AlternatePart.HasSufficientStock`, use alternate (logged as exception).

**Endpoints:** `GET/POST/PUT/DELETE /api/v1/parts/{id}/alternates`
**UI:** Alternates tab in part detail, approval workflow integration.

---

### 18. Engineering Change Orders (ECO)

#### C# Entity Definitions

**`EngineeringChangeOrder` (`forge.core/Entities/EngineeringChangeOrder.cs`):**
```csharp
public class EngineeringChangeOrder : BaseAuditableEntity
{
    public string EcoNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public EcoChangeType ChangeType { get; set; }
    public EcoStatus Status { get; set; } = EcoStatus.Draft;
    public EcoPriority Priority { get; set; } = EcoPriority.Normal;
    public string? ReasonForChange { get; set; }
    public string? ImpactAnalysis { get; set; }
    public DateOnly? EffectiveDate { get; set; }
    public int RequestedById { get; set; }
    public int? ApprovedById { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
    public DateTimeOffset? ImplementedAt { get; set; }
    public int? ImplementedById { get; set; }
    public int? ApprovalRequestId { get; set; }          // Link to approval workflow (#13)

    public ApplicationUser RequestedBy { get; set; } = null!;
    public ICollection<EcoAffectedItem> AffectedItems { get; set; } = [];
    public ICollection<FileAttachment> Attachments { get; set; } = [];
}
```

**`EcoAffectedItem` (`forge.core/Entities/EcoAffectedItem.cs`):**
```csharp
public class EcoAffectedItem : BaseEntity
{
    public int EcoId { get; set; }
    public string EntityType { get; set; } = string.Empty; // "Part", "BOMEntry", "Operation"
    public int EntityId { get; set; }
    public string ChangeDescription { get; set; } = string.Empty;
    public string? OldValue { get; set; }                // JSON snapshot before
    public string? NewValue { get; set; }                // JSON snapshot after
    public bool IsImplemented { get; set; }

    public EngineeringChangeOrder Eco { get; set; } = null!;
}
```

**Enums:** `EcoChangeType { New, Revision, Obsolescence, CostReduction, QualityImprovement }`, `EcoStatus { Draft, Review, Approved, InImplementation, Implemented, Cancelled }`, `EcoPriority { Low, Normal, High, Critical }`

**Endpoints:**
```
GET/POST /api/v1/quality/ecos, GET/PATCH /api/v1/quality/ecos/{id}
POST /api/v1/quality/ecos/{id}/approve, POST /api/v1/quality/ecos/{id}/implement
GET/POST/DELETE /api/v1/quality/ecos/{id}/affected-items
```
**UI:** ECO list (quality feature), ECO detail dialog with affected items table, implementation checklist.

---

### 19. Blanket / Standing Purchase Orders

#### C# Entity Changes

**New fields on `PurchaseOrder`:**
```csharp
public bool IsBlanket { get; set; }
public decimal? BlanketTotalQuantity { get; set; }       // Total committed quantity
public decimal? BlanketReleasedQuantity { get; set; }    // Sum of all releases
public decimal? BlanketRemainingQuantity => BlanketTotalQuantity - BlanketReleasedQuantity;
public DateTimeOffset? BlanketExpirationDate { get; set; }
public decimal? AgreedUnitPrice { get; set; }            // Locked-in price for all releases
```

**`PurchaseOrderRelease` (`forge.core/Entities/PurchaseOrderRelease.cs`):**
```csharp
public class PurchaseOrderRelease : BaseAuditableEntity
{
    public int PurchaseOrderId { get; set; }
    public int ReleaseNumber { get; set; }               // Sequential per PO
    public int PurchaseOrderLineId { get; set; }
    public decimal Quantity { get; set; }
    public DateTimeOffset RequestedDeliveryDate { get; set; }
    public DateTimeOffset? ActualDeliveryDate { get; set; }
    public PurchaseOrderReleaseStatus Status { get; set; } = PurchaseOrderReleaseStatus.Open;
    public int? ReceivingRecordId { get; set; }
    public string? Notes { get; set; }

    public PurchaseOrder PurchaseOrder { get; set; } = null!;
    public PurchaseOrderLine PurchaseOrderLine { get; set; } = null!;
}
```

**Enum:** `PurchaseOrderReleaseStatus { Open, Sent, PartialReceived, Received, Cancelled }`

**Endpoints:** `GET/POST /api/v1/purchase-orders/{id}/releases`, `PATCH /api/v1/purchase-orders/{id}/releases/{releaseNum}`
**UI:** Releases tab on blanket PO detail, release creation dialog with remaining qty display.

---

### 20. ATP (Available-to-Promise)

#### Core Interface

```csharp
// IAtpService.cs
public interface IAtpService
{
    Task<AtpResult> CalculateAtpAsync(int partId, decimal quantity, CancellationToken ct);
    Task<DateOnly?> GetEarliestAvailableDateAsync(int partId, decimal quantity, CancellationToken ct);
    Task<IReadOnlyList<AtpBucket>> GetAtpTimelineAsync(int partId, DateOnly from, DateOnly to, CancellationToken ct);
}

public record AtpResult
{
    public int PartId { get; init; }
    public decimal RequestedQuantity { get; init; }
    public decimal OnHand { get; init; }
    public decimal AllocatedToOrders { get; init; }      // Committed to open SOs
    public decimal ScheduledReceipts { get; init; }      // Open POs + planned production
    public decimal AvailableToPromise { get; init; }     // OnHand + Receipts - Allocated
    public DateOnly? EarliestAvailableDate { get; init; }
    public bool CanFulfill { get; init; }
}

public record AtpBucket
{
    public DateOnly Date { get; init; }
    public decimal CumulativeSupply { get; init; }
    public decimal CumulativeDemand { get; init; }
    public decimal NetAvailable { get; init; }
}
```

**Endpoints:** `GET /api/v1/inventory/atp/{partId}?quantity=100`, `GET /api/v1/inventory/atp/{partId}/timeline`
**UI:** ATP indicator on sales order line entry (green check / yellow warning / red X), ATP timeline chart for part.

---

### 21. Serial Number Tracking

#### C# Entity Definition

**`SerialNumber` (`forge.core/Entities/SerialNumber.cs`):**
```csharp
public class SerialNumber : BaseAuditableEntity
{
    public int PartId { get; set; }
    public string SerialValue { get; set; } = string.Empty;
    public SerialNumberStatus Status { get; set; } = SerialNumberStatus.Available;
    public int? JobId { get; set; }                      // Job that created/assembled this serial
    public int? LotRecordId { get; set; }
    public int? CurrentLocationId { get; set; }          // StorageLocation
    public int? ShipmentLineId { get; set; }             // When shipped
    public int? CustomerId { get; set; }                 // Current owner
    public int? ParentSerialId { get; set; }             // Assembly serial this belongs to
    public DateTimeOffset? ManufacturedAt { get; set; }
    public DateTimeOffset? ShippedAt { get; set; }
    public DateTimeOffset? ScrapedAt { get; set; }
    public string? Notes { get; set; }

    public Part Part { get; set; } = null!;
    public Job? Job { get; set; }
    public SerialNumber? ParentSerial { get; set; }
    public ICollection<SerialNumber> ComponentSerials { get; set; } = [];
    public ICollection<SerialHistory> History { get; set; } = [];
}
```

**`SerialHistory` (`forge.core/Entities/SerialHistory.cs`):**
```csharp
public class SerialHistory : BaseEntity
{
    public int SerialNumberId { get; set; }
    public string Action { get; set; } = string.Empty;   // "Created", "Shipped", "Transferred", "Scrapped"
    public string? FromLocationName { get; set; }
    public string? ToLocationName { get; set; }
    public int? ActorId { get; set; }
    public string? Details { get; set; }

    public SerialNumber SerialNumber { get; set; } = null!;
}
```

**Enum:** `SerialNumberStatus { Available, InUse, Shipped, Returned, Scrapped, Quarantined }`
**New field on `Part`:** `public bool IsSerialTracked { get; set; }`

**Endpoints:** `GET/POST /api/v1/parts/{id}/serials`, `GET /api/v1/serials/{serialValue}/genealogy`, `POST /api/v1/serials/{id}/transfer`
**UI:** Serial number tab in part detail, serial entry during receiving/shipping, genealogy tree view.

---

### 22. Gage / Calibration Management

#### C# Entity Definitions

**`Gage` (`forge.core/Entities/Gage.cs`):**
```csharp
public class Gage : BaseAuditableEntity
{
    public string GageNumber { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? GageType { get; set; }                // "Micrometer", "Caliper", "CMM", "Height Gage"
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public int CalibrationIntervalDays { get; set; } = 365;
    public DateTimeOffset? LastCalibratedAt { get; set; }
    public DateOnly? NextCalibrationDue { get; set; }
    public GageStatus Status { get; set; } = GageStatus.InService;
    public int? LocationId { get; set; }                 // StorageLocation
    public int? AssetId { get; set; }                    // Link to Asset entity
    public string? AccuracySpec { get; set; }            // "±0.0001 in"
    public string? RangeSpec { get; set; }               // "0-6 in"
    public string? Resolution { get; set; }              // "0.00005 in"
    public string? Notes { get; set; }

    public StorageLocation? Location { get; set; }
    public Asset? Asset { get; set; }
    public ICollection<CalibrationRecord> CalibrationRecords { get; set; } = [];
}
```

**`CalibrationRecord` (`forge.core/Entities/CalibrationRecord.cs`):**
```csharp
public class CalibrationRecord : BaseEntity
{
    public int GageId { get; set; }
    public int CalibratedById { get; set; }
    public DateTimeOffset CalibratedAt { get; set; }
    public CalibrationResult Result { get; set; }
    public string? LabName { get; set; }                 // External cal lab if outsourced
    public int? CertificateFileId { get; set; }          // FileAttachment
    public string? StandardsUsed { get; set; }           // NIST traceable standard IDs
    public string? AsFoundCondition { get; set; }        // Measurements before adjustment
    public string? AsLeftCondition { get; set; }         // Measurements after adjustment
    public DateOnly? NextCalibrationDue { get; set; }    // Computed from interval
    public string? Notes { get; set; }

    public Gage Gage { get; set; } = null!;
    public ApplicationUser CalibratedBy { get; set; } = null!;
    public FileAttachment? CertificateFile { get; set; }
}
```

**Enums:** `GageStatus { InService, DueForCalibration, OutForCalibration, OutOfService, Retired }`, `CalibrationResult { Pass, Fail, Adjusted, OutOfTolerance }`

**Endpoints:**
```
GET/POST /api/v1/quality/gages, GET/PUT /api/v1/quality/gages/{id}
GET/POST /api/v1/quality/gages/{id}/calibrations
GET /api/v1/quality/gages/due — Gages due for calibration
```
**UI:** Gage list in quality feature, calibration history tab, due-for-calibration dashboard widget.
**Hangfire job:** `CheckGageCalibrationsJob` — daily check, notify when gages are due within 14 days.

---

### 23. Customer Portal

#### Architecture

Separate Angular app (or route group) with customer-scoped auth:

**`CustomerPortalUser` (`forge.core/Entities/CustomerPortalUser.cs`):**
```csharp
public class CustomerPortalUser : BaseEntity
{
    public int ContactId { get; set; }                   // FK → Contact (customer contact)
    public int CustomerId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? LastLoginAt { get; set; }
    public CustomerPortalPermissions Permissions { get; set; }

    public Contact Contact { get; set; } = null!;
    public Customer Customer { get; set; } = null!;
}
```

**Enum flags:** `CustomerPortalPermissions { ViewOrders = 1, ViewShipments = 2, ViewInvoices = 4, ViewQuotes = 8, SubmitRfqs = 16, ViewDocuments = 32 }`

**Features (read-only views, scoped to their customer):**
- Open/closed sales orders + status
- Shipment tracking (carrier links)
- Invoices (view/download PDF)
- Quotes (view/accept/decline)
- RFQ submission (creates RFQ in main system)
- Document download (shared files)

**Controller:** `CustomerPortalController` with separate JWT auth (customer-scoped claims).
**Endpoints:** All under `/api/v1/portal/` prefix, `[Authorize(Policy = "CustomerPortal")]`.

---

### 24. Shift Management

#### C# Entity Definitions

**`ShiftAssignment` (`forge.core/Entities/ShiftAssignment.cs`):**
```csharp
public class ShiftAssignment : BaseEntity
{
    public int UserId { get; set; }
    public int ShiftId { get; set; }                     // FK → Shift (from P0 scheduling)
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }           // null = current assignment
    public decimal? ShiftDifferentialRate { get; set; }  // Extra $/hr for this shift
    public string? Notes { get; set; }

    public ApplicationUser User { get; set; } = null!;
    public Shift Shift { get; set; } = null!;
}
```

**Endpoints:** `GET/POST /api/v1/admin/shift-assignments`, `GET /api/v1/users/{id}/shift`
**Logic:** Clock events validated against assigned shift. Labor cost calculation applies shift differential.

---

### 25. Overtime Calculation

#### C# Entity Definition

**`OvertimeRule` (`forge.core/Entities/OvertimeRule.cs`):**
```csharp
public class OvertimeRule : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;     // "Standard OT", "California OT"
    public decimal DailyThresholdHours { get; set; } = 8;
    public decimal WeeklyThresholdHours { get; set; } = 40;
    public decimal OvertimeMultiplier { get; set; } = 1.5m;
    public decimal? DoubletimeThresholdDailyHours { get; set; } = 12;
    public decimal? DoubletimeThresholdWeeklyHours { get; set; }
    public decimal DoubletimeMultiplier { get; set; } = 2.0m;
    public bool IsDefault { get; set; }
    public bool ApplyDailyBeforeWeekly { get; set; } = true; // CA rule: daily OT first
}
```

**Core Interface:**
```csharp
public interface IOvertimeService
{
    Task<OvertimeBreakdown> CalculateOvertimeAsync(int userId, DateOnly weekStart, DateOnly weekEnd, CancellationToken ct);
}

public record OvertimeBreakdown
{
    public decimal RegularHours { get; init; }
    public decimal OvertimeHours { get; init; }
    public decimal DoubletimeHours { get; init; }
    public decimal RegularCost { get; init; }
    public decimal OvertimeCost { get; init; }
    public decimal DoubletimeCost { get; init; }
    public decimal TotalCost { get; init; }
    public IReadOnlyList<DailyOvertimeDetail> DailyBreakdown { get; init; } = [];
}
```

**Endpoints:** `GET /api/v1/time-tracking/overtime/{userId}?weekOf=2026-04-06`
**UI:** Overtime column in time tracking page, OT breakdown in payroll/cost reports.

---

### 26. PTO / Leave Management

#### C# Entity Definitions

**`LeavePolicy` (`forge.core/Entities/LeavePolicy.cs`):**
```csharp
public class LeavePolicy : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;     // "Standard PTO", "Sick Leave", "Vacation"
    public decimal AccrualRatePerPayPeriod { get; set; } // Hours accrued per pay period
    public decimal? MaxBalance { get; set; }             // Cap on accrued hours
    public decimal? CarryOverLimit { get; set; }         // Max carry to next year
    public bool AccrueFromHireDate { get; set; } = true;
    public int? WaitingPeriodDays { get; set; }          // Days before accrual starts
    public bool IsPaidLeave { get; set; } = true;
    public bool IsActive { get; set; } = true;
}
```

**`LeaveBalance` (`forge.core/Entities/LeaveBalance.cs`):**
```csharp
public class LeaveBalance : BaseEntity
{
    public int UserId { get; set; }
    public int PolicyId { get; set; }
    public decimal Balance { get; set; }                 // Current available hours
    public decimal UsedThisYear { get; set; }
    public decimal AccruedThisYear { get; set; }
    public DateTimeOffset LastAccrualDate { get; set; }

    public ApplicationUser User { get; set; } = null!;
    public LeavePolicy Policy { get; set; } = null!;
}
```

**`LeaveRequest` (`forge.core/Entities/LeaveRequest.cs`):**
```csharp
public class LeaveRequest : BaseAuditableEntity
{
    public int UserId { get; set; }
    public int PolicyId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public decimal Hours { get; set; }
    public LeaveRequestStatus Status { get; set; } = LeaveRequestStatus.Pending;
    public int? ApprovedById { get; set; }
    public DateTimeOffset? DecidedAt { get; set; }
    public string? Reason { get; set; }
    public string? DenialReason { get; set; }

    public ApplicationUser User { get; set; } = null!;
    public LeavePolicy Policy { get; set; } = null!;
}
```

**Enum:** `LeaveRequestStatus { Pending, Approved, Denied, Cancelled }`
**Hangfire job:** `AccrueLeaveBalancesJob` — runs per pay period, adds `AccrualRatePerPayPeriod` to each employee's balance.

**Endpoints:** `GET/POST /api/v1/leave/requests`, `GET /api/v1/leave/balances/{userId}`, admin CRUD for policies.
**UI:** Leave request form (account), balance display, manager approval queue.

---

### 27. Performance Reviews

#### C# Entity Definitions

**`ReviewCycle` (`forge.core/Entities/ReviewCycle.cs`):**
```csharp
public class ReviewCycle : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public ReviewCycleStatus Status { get; set; } = ReviewCycleStatus.Draft;
    public string? Description { get; set; }

    public ICollection<PerformanceReview> Reviews { get; set; } = [];
}
```

**`PerformanceReview` (`forge.core/Entities/PerformanceReview.cs`):**
```csharp
public class PerformanceReview : BaseAuditableEntity
{
    public int CycleId { get; set; }
    public int EmployeeId { get; set; }
    public int ReviewerId { get; set; }
    public ReviewStatus Status { get; set; } = ReviewStatus.NotStarted;
    public decimal? OverallRating { get; set; }          // 1.0 - 5.0
    public string? GoalsJson { get; set; }               // [{ goal, rating, comments }]
    public string? CompetenciesJson { get; set; }        // [{ competency, rating, comments }]
    public string? StrengthsComments { get; set; }
    public string? ImprovementComments { get; set; }
    public string? EmployeeSelfAssessment { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset? AcknowledgedAt { get; set; }  // Employee acknowledged

    public ReviewCycle Cycle { get; set; } = null!;
    public ApplicationUser Employee { get; set; } = null!;
    public ApplicationUser Reviewer { get; set; } = null!;
}
```

**Enums:** `ReviewCycleStatus { Draft, Active, Completed }`, `ReviewStatus { NotStarted, SelfAssessment, ManagerReview, Discussion, Completed }`

**Endpoints:** Admin cycle CRUD, `GET/PATCH /api/v1/reviews/{id}`, `GET /api/v1/reviews/my`
**UI:** Review cycle admin, review form (goals + competencies grid with ratings), self-assessment tab.

---

### 28. Document Approval Workflow

#### C# Entity Definitions

**`ControlledDocument` (`forge.core/Entities/ControlledDocument.cs`):**
```csharp
public class ControlledDocument : BaseAuditableEntity
{
    public string DocumentNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;  // "SOP", "WI", "Form", "Spec"
    public int CurrentRevision { get; set; } = 1;
    public ControlledDocumentStatus Status { get; set; } = ControlledDocumentStatus.Draft;
    public int OwnerId { get; set; }
    public int? CheckedOutById { get; set; }
    public DateTimeOffset? CheckedOutAt { get; set; }
    public DateTimeOffset? ReleasedAt { get; set; }
    public DateTimeOffset? ReviewDueDate { get; set; }
    public int ReviewIntervalDays { get; set; } = 365;

    public ApplicationUser Owner { get; set; } = null!;
    public ICollection<DocumentRevision> Revisions { get; set; } = [];
}
```

**`DocumentRevision` (`forge.core/Entities/DocumentRevision.cs`):**
```csharp
public class DocumentRevision : BaseEntity
{
    public int DocumentId { get; set; }
    public int RevisionNumber { get; set; }
    public int FileAttachmentId { get; set; }
    public string ChangeDescription { get; set; } = string.Empty;
    public int AuthoredById { get; set; }
    public int? ReviewedById { get; set; }
    public int? ApprovedById { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
    public DocumentRevisionStatus Status { get; set; }

    public ControlledDocument Document { get; set; } = null!;
    public FileAttachment FileAttachment { get; set; } = null!;
}
```

**Enums:** `ControlledDocumentStatus { Draft, InReview, Released, Obsolete }`, `DocumentRevisionStatus { Draft, InReview, Approved, Rejected, Superseded }`

**Endpoints:** Full CRUD under `/api/v1/documents/controlled/`, check-in/check-out, approval routing.
**UI:** Controlled document list, revision history, check-out status indicator, approval queue.

---

### 29. Outbound Webhooks

#### C# Entity Definitions

**`WebhookSubscription` (`forge.core/Entities/WebhookSubscription.cs`):**
```csharp
public class WebhookSubscription : BaseAuditableEntity
{
    public string Url { get; set; } = string.Empty;
    public string EventTypesJson { get; set; } = "[]";   // ["job.created", "job.stage_changed", "shipment.shipped"]
    public string EncryptedSecret { get; set; } = string.Empty; // For HMAC-SHA256 signing
    public bool IsActive { get; set; } = true;
    public int FailureCount { get; set; }
    public int MaxRetries { get; set; } = 5;
    public DateTimeOffset? LastDeliveredAt { get; set; }
    public DateTimeOffset? LastFailedAt { get; set; }
    public bool AutoDisableOnFailure { get; set; } = true; // Disable after MaxRetries consecutive failures
    public string? Description { get; set; }
    public string? HeadersJson { get; set; }             // Custom headers [{ name, value }]

    public ICollection<WebhookDelivery> Deliveries { get; set; } = [];
}
```

**`WebhookDelivery` (`forge.core/Entities/WebhookDelivery.cs`):**
```csharp
public class WebhookDelivery : BaseEntity
{
    public int SubscriptionId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string PayloadJson { get; set; } = string.Empty;
    public int? StatusCode { get; set; }
    public string? ResponseBody { get; set; }
    public decimal DurationMs { get; set; }
    public DateTimeOffset AttemptedAt { get; set; }
    public int AttemptNumber { get; set; } = 1;
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }

    public WebhookSubscription Subscription { get; set; } = null!;
}
```

**Core Interface:**
```csharp
public interface IWebhookService
{
    Task FireEventAsync(string eventType, object payload, CancellationToken ct);
    Task RetryDeliveryAsync(int deliveryId, CancellationToken ct);
    string SignPayload(string payload, string secret);
}
```

**Delivery:** Hangfire background job with exponential backoff (1min, 5min, 15min, 1hr, 4hr). HMAC-SHA256 in `X-Webhook-Signature` header.

**Endpoints:** Admin CRUD `/api/v1/admin/webhooks`, `GET /api/v1/admin/webhooks/{id}/deliveries`, `POST /retry`
**Event types:** `job.created`, `job.stage_changed`, `job.completed`, `shipment.shipped`, `invoice.created`, `payment.received`, `ncr.created`, `capa.closed`

---

### 30. Scheduled Report Delivery

#### C# Entity Definition

**`ReportSchedule` (`forge.core/Entities/ReportSchedule.cs`):**
```csharp
public class ReportSchedule : BaseAuditableEntity
{
    public int SavedReportId { get; set; }
    public string CronExpression { get; set; } = string.Empty; // "0 8 * * 1" = Mon 8am
    public string RecipientEmailsJson { get; set; } = "[]";
    public ReportExportFormat Format { get; set; } = ReportExportFormat.Pdf;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? LastSentAt { get; set; }
    public DateTimeOffset? NextRunAt { get; set; }
    public string? SubjectTemplate { get; set; }         // "Weekly {{reportName}} - {{date}}"

    public SavedReport SavedReport { get; set; } = null!;
}
```

**Enum:** `ReportExportFormat { Pdf, Csv, Xlsx }`

**Hangfire job:** `SendScheduledReportsJob` — evaluates cron, renders report, emails as attachment via `IEmailService`.

**Endpoints:** `GET/POST/PUT/DELETE /api/v1/report-builder/schedules`
**UI:** Schedule button on saved reports, cron builder (preset: daily/weekly/monthly + custom).

---

### 31. Excel/CSV Export from Report Builder

#### Implementation

**Backend (`forge.api/Features/Reports/ExportReport.cs`):**
```csharp
public class ExportReportHandler : IRequestHandler<ExportReportQuery, byte[]>
{
    // Uses ClosedXML for .xlsx generation
    // CSV via StreamWriter
    // Reuses existing report query logic, formats output
}
```

**Endpoint:** `GET /api/v1/report-builder/{id}/export?format=csv|xlsx`
**Response:** `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (xlsx) or `text/csv`

**Libraries:** `ClosedXML` (MIT licensed) for Excel generation — supports styling, auto-width, headers.

**UI changes:**
- Export dropdown button on report results toolbar: PDF | Excel | CSV
- Download triggers browser file save dialog

**Complexity:** Low — report data already available, just need formatting layer.

---

## P4 — NICE-TO-HAVE

### 32. CPQ (Configure, Price, Quote) Engine

**Why P4:** Product configurator with option trees, validation rules, and auto-BOM/routing generation. Typically a separate product (Tacton, Oracle CPQ). Only relevant for manufacturers with highly configurable products.

#### C# Entity Definitions

**`ProductConfigurator` (`forge.core/Entities/ProductConfigurator.cs`):**
```csharp
public class ProductConfigurator : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int BasePartId { get; set; }                  // Base product being configured
    public bool IsActive { get; set; } = true;
    public string? ValidationRulesJson { get; set; }     // Cross-option rules: [{ "if": "material=steel", "then": "finish!=anodize" }]
    public decimal? BasePrice { get; set; }              // Starting price before options
    public string? PricingFormulaJson { get; set; }      // Complex pricing rules

    public Part BasePart { get; set; } = null!;
    public ICollection<ConfiguratorOption> Options { get; set; } = [];
    public ICollection<ProductConfiguration> Configurations { get; set; } = [];
}
```

**`ConfiguratorOption` (`forge.core/Entities/ConfiguratorOption.cs`):**
```csharp
public class ConfiguratorOption : BaseEntity
{
    public int ConfiguratorId { get; set; }
    public string Name { get; set; } = string.Empty;     // "Material", "Finish", "Size"
    public ConfiguratorOptionType OptionType { get; set; }
    public string ValuesJson { get; set; } = "[]";       // [{ "value": "steel", "label": "Steel", "priceAdder": 0 }, ...]
    public string? PricingRuleJson { get; set; }         // { "type": "adder|multiplier|formula", ... }
    public string? BomImpactJson { get; set; }           // [{ "selection": "steel", "addBomEntries": [...], "removeBomEntries": [...] }]
    public string? RoutingImpactJson { get; set; }       // [{ "selection": "anodize", "addOperations": [...] }]
    public string? DependsOnOptionId { get; set; }       // Cascading option dependency
    public int SortOrder { get; set; }
    public bool IsRequired { get; set; }
    public string? HelpText { get; set; }
    public string? DefaultValue { get; set; }

    public ProductConfigurator Configurator { get; set; } = null!;
}
```

**`ProductConfiguration` (`forge.core/Entities/ProductConfiguration.cs`):**
```csharp
public class ProductConfiguration : BaseAuditableEntity
{
    public int ConfiguratorId { get; set; }
    public string ConfigurationCode { get; set; } = string.Empty; // Generated: "CFG-20260411-001"
    public string SelectionsJson { get; set; } = "{}";   // { "material": "steel", "finish": "powder_coat", "size": "12in" }
    public decimal ComputedPrice { get; set; }
    public string? GeneratedBomJson { get; set; }        // Resulting BOM entries
    public string? GeneratedRoutingJson { get; set; }    // Resulting operations
    public int? QuoteId { get; set; }                    // Link to generated quote
    public int? PartId { get; set; }                     // Generated configured part
    public ConfigurationStatus Status { get; set; } = ConfigurationStatus.Draft;

    public ProductConfigurator Configurator { get; set; } = null!;
    public Quote? Quote { get; set; }
    public Part? Part { get; set; }
}
```

#### Enums

```csharp
public enum ConfiguratorOptionType { Select, MultiSelect, Checkbox, Quantity, Text, Numeric }
public enum ConfigurationStatus { Draft, Quoted, Ordered, Cancelled }
```

#### Core Interface

```csharp
public interface ICpqService
{
    Task<CpqResult> ConfigureAsync(int configuratorId, Dictionary<string, string> selections, CancellationToken ct);
    Task<bool> ValidateSelectionsAsync(int configuratorId, Dictionary<string, string> selections, CancellationToken ct);
    Task<Quote> GenerateQuoteFromConfigurationAsync(int configurationId, int customerId, CancellationToken ct);
    Task<Part> GeneratePartFromConfigurationAsync(int configurationId, CancellationToken ct);
    decimal CalculatePrice(ProductConfigurator configurator, Dictionary<string, string> selections);
    IReadOnlyList<BOMEntry> GenerateBom(ProductConfigurator configurator, Dictionary<string, string> selections);
    IReadOnlyList<Operation> GenerateRouting(ProductConfigurator configurator, Dictionary<string, string> selections);
}

public record CpqResult
{
    public decimal ComputedPrice { get; init; }
    public IReadOnlyList<CpqPriceBreakdown> PriceBreakdown { get; init; } = [];
    public IReadOnlyList<CpqBomPreview> BomPreview { get; init; } = [];
    public IReadOnlyList<CpqRoutingPreview> RoutingPreview { get; init; } = [];
    public IReadOnlyList<string> ValidationErrors { get; init; } = [];
    public bool IsValid { get; init; }
}

public record CpqPriceBreakdown { public string OptionName { get; init; } = ""; public string Selection { get; init; } = ""; public decimal PriceImpact { get; init; } }
public record CpqBomPreview { public string PartNumber { get; init; } = ""; public decimal Quantity { get; init; } public string Source { get; init; } = ""; }
public record CpqRoutingPreview { public string OperationName { get; init; } = ""; public decimal EstimatedMinutes { get; init; } }
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetConfigurators` | Query | `Features/Cpq/GetConfigurators.cs` | List configurators (active, partId filter) |
| `GetConfiguratorById` | Query | `Features/Cpq/GetConfiguratorById.cs` | Full configurator with options |
| `CreateConfigurator` | Command | `Features/Cpq/CreateConfigurator.cs` | Create with options |
| `UpdateConfigurator` | Command | `Features/Cpq/UpdateConfigurator.cs` | Update configurator + options |
| `ConfigureProduct` | Command | `Features/Cpq/ConfigureProduct.cs` | Apply selections → compute price + BOM + routing preview |
| `ValidateSelections` | Query | `Features/Cpq/ValidateSelections.cs` | Check selections against rules without saving |
| `SaveConfiguration` | Command | `Features/Cpq/SaveConfiguration.cs` | Persist configuration |
| `GenerateQuoteFromConfig` | Command | `Features/Cpq/GenerateQuoteFromConfig.cs` | Create Quote + QuoteLines from configuration |
| `GeneratePartFromConfig` | Command | `Features/Cpq/GeneratePartFromConfig.cs` | Create configured Part + BOM + routing |

#### API Endpoints

```
GET    /api/v1/cpq/configurators                        — List configurators
POST   /api/v1/cpq/configurators                        — Create configurator
GET    /api/v1/cpq/configurators/{id}                   — Configurator detail with options
PUT    /api/v1/cpq/configurators/{id}                   — Update configurator
POST   /api/v1/cpq/configure                            — Apply selections → CpqResult (price + BOM + routing preview)
POST   /api/v1/cpq/validate                             — Validate selections only
POST   /api/v1/cpq/configurations                       — Save configuration
GET    /api/v1/cpq/configurations/{id}                  — Saved configuration detail
POST   /api/v1/cpq/configurations/{id}/generate-quote   — Generate Quote from configuration
POST   /api/v1/cpq/configurations/{id}/generate-part    — Generate Part + BOM from configuration
```

#### Angular TypeScript Models

```typescript
export type ConfiguratorOptionType = 'Select' | 'MultiSelect' | 'Checkbox' | 'Quantity' | 'Text' | 'Numeric';
export type ConfigurationStatus = 'Draft' | 'Quoted' | 'Ordered' | 'Cancelled';

export interface ProductConfigurator {
  id: number; name: string; description: string | null;
  basePartId: number; basePartNumber: string; isActive: boolean;
  basePrice: number | null; optionCount: number;
}

export interface ConfiguratorOption {
  id: number; name: string; optionType: ConfiguratorOptionType;
  values: { value: string; label: string; priceAdder: number }[];
  isRequired: boolean; sortOrder: number; helpText: string | null; defaultValue: string | null;
  dependsOnOptionId: string | null;
}

export interface ConfiguratorDetail extends ProductConfigurator {
  options: ConfiguratorOption[];
  validationRules: unknown[];
}

export interface CpqResult {
  computedPrice: number; isValid: boolean;
  priceBreakdown: { optionName: string; selection: string; priceImpact: number }[];
  bomPreview: { partNumber: string; quantity: number; source: string }[];
  routingPreview: { operationName: string; estimatedMinutes: number }[];
  validationErrors: string[];
}

export interface ProductConfiguration {
  id: number; configuratorId: number; configurationCode: string;
  selections: Record<string, string>; computedPrice: number;
  status: ConfigurationStatus; quoteId: number | null; partId: number | null;
}
```

#### Angular Service

```typescript
@Injectable({ providedIn: 'root' })
export class CpqService {
  private readonly http = inject(HttpClient);

  getConfigurators(isActive?: boolean): Observable<ProductConfigurator[]> { ... }
  getConfigurator(id: number): Observable<ConfiguratorDetail> { ... }
  createConfigurator(request: Partial<ConfiguratorDetail>): Observable<ProductConfigurator> { ... }
  updateConfigurator(id: number, request: Partial<ConfiguratorDetail>): Observable<void> { ... }
  configure(configuratorId: number, selections: Record<string, string>): Observable<CpqResult> { ... }
  validateSelections(configuratorId: number, selections: Record<string, string>): Observable<{ isValid: boolean; errors: string[] }> { ... }
  saveConfiguration(configuratorId: number, selections: Record<string, string>): Observable<ProductConfiguration> { ... }
  generateQuote(configurationId: number, customerId: number): Observable<{ quoteId: number }> { ... }
  generatePart(configurationId: number): Observable<{ partId: number }> { ... }
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `CpqConfiguratorComponent` | `features/cpq/components/cpq-configurator.component.ts` | Interactive product configurator: option form (cascading selects, conditional visibility), live price calculation, BOM/routing preview panel |
| `CpqConfiguratorEditorComponent` | `features/admin/components/cpq-configurator-editor.component.ts` | Admin: create/edit configurator with option builder, pricing rules, BOM impact mapping, validation rule builder |
| `CpqPriceBreakdownComponent` | `features/cpq/components/cpq-price-breakdown.component.ts` | Stacked bar showing base price + option adders = total |
| `CpqBomPreviewComponent` | `features/cpq/components/cpq-bom-preview.component.ts` | Preview of generated BOM entries (before saving) |
| `CpqConfigurationListComponent` | `features/cpq/components/cpq-configuration-list.component.ts` | DataTable of saved configurations with status, link to quote |

**Complexity:** Very High — rule engine, BOM generation, price calculation. Typically a separate product.

---

### 33. Multi-Plant / Multi-Site

**Why P4:** Required only for multi-facility manufacturers. Extremely pervasive change — nearly every query gains a plant filter.

#### C# Entity Definitions

**`Plant` (`forge.core/Entities/Plant.cs`):**
```csharp
public class Plant : BaseAuditableEntity
{
    public string Code { get; set; } = string.Empty;     // "PLT01", "PLT02"
    public string Name { get; set; } = string.Empty;
    public int CompanyLocationId { get; set; }           // FK → CompanyLocation
    public string? TimeZone { get; set; }
    public string? CurrencyCode { get; set; }            // If multi-currency (#34) enabled
    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; }

    public CompanyLocation Location { get; set; } = null!;
    public ICollection<InterPlantTransfer> OutboundTransfers { get; set; } = [];
    public ICollection<InterPlantTransfer> InboundTransfers { get; set; } = [];
}
```

**`InterPlantTransfer` (`forge.core/Entities/InterPlantTransfer.cs`):**
```csharp
public class InterPlantTransfer : BaseAuditableEntity
{
    public string TransferNumber { get; set; } = string.Empty; // Auto: "IPT-20260411-001"
    public int FromPlantId { get; set; }
    public int ToPlantId { get; set; }
    public InterPlantTransferStatus Status { get; set; } = InterPlantTransferStatus.Draft;
    public DateTimeOffset? ShippedAt { get; set; }
    public DateTimeOffset? ReceivedAt { get; set; }
    public int? ShippedById { get; set; }
    public int? ReceivedById { get; set; }
    public string? TrackingNumber { get; set; }
    public string? Notes { get; set; }

    public Plant FromPlant { get; set; } = null!;
    public Plant ToPlant { get; set; } = null!;
    public ICollection<InterPlantTransferLine> Lines { get; set; } = [];
}
```

**`InterPlantTransferLine` (`forge.core/Entities/InterPlantTransferLine.cs`):**
```csharp
public class InterPlantTransferLine : BaseEntity
{
    public int TransferId { get; set; }
    public int PartId { get; set; }
    public decimal Quantity { get; set; }
    public decimal? ReceivedQuantity { get; set; }
    public int? FromLocationId { get; set; }             // Source bin/location
    public int? ToLocationId { get; set; }               // Destination bin/location
    public string? LotNumber { get; set; }

    public InterPlantTransfer Transfer { get; set; } = null!;
    public Part Part { get; set; } = null!;
}
```

#### Enums

```csharp
public enum InterPlantTransferStatus { Draft, Approved, Shipped, InTransit, Received, Cancelled }
```

#### Pervasive Entity Changes

Add `int? PlantId { get; set; }` + `Plant? Plant { get; set; }` FK to:
- `Job`, `StorageLocation`, `WorkCenter`, `BinContent`, `ProductionRun`
- `PurchaseOrder`, `SalesOrder`, `TimeEntry`, `ClockEvent`
- `Shipment`, `Invoice`, `QcInspection`, `LotRecord`
- `ApplicationUser` (home plant assignment)

All repository queries gain `IPlantContextService.CurrentPlantId` filter. Global query filter on `AppDbContext`.

#### Core Interface

```csharp
public interface IPlantContextService
{
    int? CurrentPlantId { get; }
    void SetPlant(int plantId);
    Task<IReadOnlyList<Plant>> GetUserPlantsAsync(int userId, CancellationToken ct);
}

public interface IInterPlantTransferService
{
    Task<InterPlantTransfer> CreateTransferAsync(InterPlantTransferRequest request, CancellationToken ct);
    Task ShipTransferAsync(int transferId, string? trackingNumber, CancellationToken ct);
    Task ReceiveTransferAsync(int transferId, IReadOnlyList<ReceiveTransferLineRequest> lines, CancellationToken ct);
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetPlants` | Query | `Features/Admin/GetPlants.cs` | List all plants |
| `CreatePlant` | Command | `Features/Admin/CreatePlant.cs` | Create plant linked to location |
| `UpdatePlant` | Command | `Features/Admin/UpdatePlant.cs` | Update plant |
| `GetInterPlantTransfers` | Query | `Features/Inventory/GetInterPlantTransfers.cs` | Paginated transfers (status, plant filters) |
| `CreateInterPlantTransfer` | Command | `Features/Inventory/CreateInterPlantTransfer.cs` | Create with lines |
| `ShipInterPlantTransfer` | Command | `Features/Inventory/ShipInterPlantTransfer.cs` | Ship (decrement source inventory) |
| `ReceiveInterPlantTransfer` | Command | `Features/Inventory/ReceiveInterPlantTransfer.cs` | Receive (increment destination inventory) |
| `SwitchPlant` | Command | `Features/Auth/SwitchPlant.cs` | Switch user's active plant context |

#### API Endpoints

```
GET    /api/v1/admin/plants                              — Plant[]
POST   /api/v1/admin/plants                              — Create plant
PUT    /api/v1/admin/plants/{id}                         — Update plant
POST   /api/v1/auth/switch-plant                         — Switch active plant context
GET    /api/v1/inventory/transfers                        — Paginated inter-plant transfers
POST   /api/v1/inventory/transfers                        — Create transfer
POST   /api/v1/inventory/transfers/{id}/ship              — Ship transfer
POST   /api/v1/inventory/transfers/{id}/receive           — Receive transfer
```

#### Angular TypeScript Models

```typescript
export type InterPlantTransferStatus = 'Draft' | 'Approved' | 'Shipped' | 'InTransit' | 'Received' | 'Cancelled';

export interface Plant {
  id: number; code: string; name: string;
  locationName: string; timeZone: string | null;
  isActive: boolean; isDefault: boolean;
}

export interface InterPlantTransfer {
  id: number; transferNumber: string;
  fromPlantId: number; fromPlantName: string;
  toPlantId: number; toPlantName: string;
  status: InterPlantTransferStatus;
  shippedAt: string | null; receivedAt: string | null;
  trackingNumber: string | null; lineCount: number;
}

export interface InterPlantTransferLine {
  partId: number; partNumber: string; partDescription: string;
  quantity: number; receivedQuantity: number | null; lotNumber: string | null;
}
```

#### Angular Service

```typescript
@Injectable({ providedIn: 'root' })
export class PlantService {
  private readonly http = inject(HttpClient);
  readonly currentPlant = signal<Plant | null>(null);

  getPlants(): Observable<Plant[]> { ... }
  switchPlant(plantId: number): Observable<void> { ... }
  getTransfers(filters?: { status?: InterPlantTransferStatus; plantId?: number }): Observable<PaginatedResponse<InterPlantTransfer>> { ... }
  createTransfer(request: { fromPlantId: number; toPlantId: number; lines: { partId: number; quantity: number }[] }): Observable<InterPlantTransfer> { ... }
  shipTransfer(id: number, trackingNumber?: string): Observable<void> { ... }
  receiveTransfer(id: number, lines: { partId: number; receivedQuantity: number }[]): Observable<void> { ... }
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `PlantSwitcherComponent` | `core/components/plant-switcher.component.ts` | Dropdown in header to switch active plant context |
| `PlantAdminPanelComponent` | `features/admin/components/plant-admin-panel.component.ts` | Plant CRUD in admin settings |
| `InterPlantTransferListComponent` | `features/inventory/components/inter-plant-transfer-list.component.ts` | DataTable of transfers with ship/receive actions |
| `InterPlantTransferDialogComponent` | `features/inventory/components/inter-plant-transfer-dialog.component.ts` | Create transfer: from/to plant pickers, part + qty lines |

**Complexity:** Very High — extremely pervasive. Touches nearly every query, requires plant context middleware, affects all reports and dashboards.

---

### 34. Multi-Currency

**Why P4:** Required for international trade. Moderate complexity but touches all financial entities broadly.

#### C# Entity Definitions

**`Currency` (`forge.core/Entities/Currency.cs`):**
```csharp
public class Currency : BaseEntity
{
    public string Code { get; set; } = string.Empty;     // ISO 4217: "USD", "EUR", "GBP", "CAD", "JPY"
    public string Name { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;   // "$", "€", "£", "¥"
    public int DecimalPlaces { get; set; } = 2;          // JPY = 0
    public bool IsBaseCurrency { get; set; }             // Company's functional/reporting currency
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
```

**`ExchangeRate` (`forge.core/Entities/ExchangeRate.cs`):**
```csharp
public class ExchangeRate : BaseEntity
{
    public int FromCurrencyId { get; set; }
    public int ToCurrencyId { get; set; }
    public decimal Rate { get; set; }                    // 1 FromCurrency = Rate × ToCurrency
    public DateOnly EffectiveDate { get; set; }
    public ExchangeRateSource Source { get; set; }
    public DateTimeOffset? FetchedAt { get; set; }       // If from API

    public Currency FromCurrency { get; set; } = null!;
    public Currency ToCurrency { get; set; } = null!;
}
```

#### Enums

```csharp
public enum ExchangeRateSource { Manual, Api, Bank }
```

#### Pervasive Entity Changes

Add to `SalesOrder`, `PurchaseOrder`, `Invoice`, `Payment`, `Quote`:
```csharp
public int? CurrencyId { get; set; }                     // Transaction currency
public decimal? ExchangeRateToBase { get; set; }         // At time of transaction
public decimal? BaseCurrencyTotal { get; set; }          // Amount in base currency
public Currency? Currency { get; set; }
```

Add to `Payment`:
```csharp
public decimal? ExchangeGainLoss { get; set; }           // Gain/loss vs. invoice rate
```

#### Core Interface

```csharp
public interface ICurrencyService
{
    Task<decimal> GetExchangeRateAsync(int fromCurrencyId, int toCurrencyId, DateOnly date, CancellationToken ct);
    Task<decimal> ConvertAsync(decimal amount, int fromCurrencyId, int toCurrencyId, DateOnly date, CancellationToken ct);
    Task<int> GetBaseCurrencyIdAsync(CancellationToken ct);
    Task<decimal> CalculateExchangeGainLossAsync(decimal invoiceAmount, decimal invoiceRate, decimal paymentRate, CancellationToken ct);
    Task FetchExchangeRatesAsync(DateOnly date, CancellationToken ct); // From API
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetCurrencies` | Query | `Features/Admin/GetCurrencies.cs` | List currencies |
| `CreateCurrency` | Command | `Features/Admin/CreateCurrency.cs` | Create currency |
| `UpdateCurrency` | Command | `Features/Admin/UpdateCurrency.cs` | Update currency |
| `GetExchangeRates` | Query | `Features/Admin/GetExchangeRates.cs` | Rates for date range |
| `SetExchangeRate` | Command | `Features/Admin/SetExchangeRate.cs` | Manual rate entry |
| `FetchExchangeRates` | Job | `Jobs/FetchExchangeRatesJob.cs` | Hangfire daily: fetch from API (exchangeratesapi.io) |
| `CalculateExchangeGainLoss` | Query | `Features/Payments/CalculateExchangeGainLoss.cs` | Gain/loss on payment application |

#### API Endpoints

```
GET    /api/v1/admin/currencies                          — Currency[]
POST   /api/v1/admin/currencies                          — Create currency
PUT    /api/v1/admin/currencies/{id}                     — Update currency
GET    /api/v1/admin/exchange-rates                       — Rates (fromId, toId, dateFrom/To)
POST   /api/v1/admin/exchange-rates                       — Manual rate entry
GET    /api/v1/admin/exchange-rates/convert               — Convert amount (from, to, amount, date)
POST   /api/v1/admin/exchange-rates/fetch                 — Trigger API fetch
```

#### Angular TypeScript Models

```typescript
export interface Currency {
  id: number; code: string; name: string; symbol: string;
  decimalPlaces: number; isBaseCurrency: boolean; isActive: boolean;
}

export interface ExchangeRate {
  id: number; fromCurrencyCode: string; toCurrencyCode: string;
  rate: number; effectiveDate: string; source: 'Manual' | 'Api' | 'Bank';
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `CurrencyAdminPanelComponent` | `features/admin/components/currency-admin-panel.component.ts` | Currency + exchange rate management |
| `CurrencySelectComponent` | `shared/components/currency-select/currency-select.component.ts` | CVA dropdown for currency selection on SO/PO/Invoice forms |
| `ExchangeRateDialogComponent` | `features/admin/components/exchange-rate-dialog.component.ts` | Manual rate entry |
| `CurrencyAmountComponent` | `shared/components/currency-amount/currency-amount.component.ts` | Display amount with symbol + base currency equivalent |

**Complexity:** Medium-High — touches all financial entities. Exchange rate API integration adds moderate effort.

---

### 35. Multi-Language Backend

**Why P4:** Enables non-English-speaking users. Frontend i18n already exists (en/es) — backend needs to match.

#### C# Entity Definition

**`TranslatedLabel` (`forge.core/Entities/TranslatedLabel.cs`):**
```csharp
public class TranslatedLabel : BaseEntity
{
    public string Key { get; set; } = string.Empty;      // "entity_job", "status_in_production", "ref:expense_category:travel"
    public string LanguageCode { get; set; } = string.Empty; // ISO 639-1: "en", "es", "fr", "de", "zh", "ja"
    public string Value { get; set; } = string.Empty;    // Translated text
    public string? Context { get; set; }                 // "menu", "form_label", "status", "reference_data"
    public bool IsApproved { get; set; } = true;         // Translation verified
    public int? TranslatedById { get; set; }
    public DateTimeOffset? TranslatedAt { get; set; }
}
```

**`SupportedLanguage` (`forge.core/Entities/SupportedLanguage.cs`):**
```csharp
public class SupportedLanguage : BaseEntity
{
    public string Code { get; set; } = string.Empty;     // "en", "es", "fr"
    public string Name { get; set; } = string.Empty;     // "English", "Español", "Français"
    public string NativeName { get; set; } = string.Empty; // "English", "Español", "Français"
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
    public decimal CompletionPercent { get; set; }       // How complete the translation is
}
```

#### Core Interface

```csharp
public interface ILocalizationService
{
    Task<string> GetLabelAsync(string key, string languageCode, CancellationToken ct);
    Task<Dictionary<string, string>> GetAllLabelsAsync(string languageCode, CancellationToken ct);
    Task SetLabelAsync(string key, string languageCode, string value, CancellationToken ct);
    Task<IReadOnlyList<SupportedLanguage>> GetSupportedLanguagesAsync(CancellationToken ct);
    Task ImportTranslationsAsync(string languageCode, Dictionary<string, string> translations, CancellationToken ct);
    Task<Dictionary<string, string>> ExportTranslationsAsync(string languageCode, CancellationToken ct);
}
```

**Approach:** Middleware reads `Accept-Language` header → sets `ILocalizationContext.CurrentLanguage`. `TerminologyService` extended to check `TranslatedLabel` first, fallback to `ReferenceData.Label` (English default). All API responses serve labels in requested language.

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetSupportedLanguages` | Query | `Features/Admin/GetSupportedLanguages.cs` | List languages with completion % |
| `GetTranslations` | Query | `Features/Admin/GetTranslations.cs` | All labels for a language (for translation editor) |
| `UpdateTranslation` | Command | `Features/Admin/UpdateTranslation.cs` | Set/update single label |
| `ImportTranslations` | Command | `Features/Admin/ImportTranslations.cs` | Bulk import from JSON/CSV |
| `ExportTranslations` | Query | `Features/Admin/ExportTranslations.cs` | Export all labels for a language |

#### API Endpoints

```
GET    /api/v1/admin/languages                           — SupportedLanguage[]
GET    /api/v1/admin/translations/{languageCode}         — Dictionary<string, string>
PUT    /api/v1/admin/translations/{languageCode}/{key}   — Set label
POST   /api/v1/admin/translations/{languageCode}/import  — Bulk import
GET    /api/v1/admin/translations/{languageCode}/export  — Export JSON
GET    /api/v1/terminology?lang={code}                   — Extend existing: language param
```

#### Angular TypeScript Models

```typescript
export interface SupportedLanguage {
  code: string; name: string; nativeName: string;
  isDefault: boolean; isActive: boolean; completionPercent: number;
}

export interface TranslationEntry {
  key: string; value: string; context: string | null; isApproved: boolean;
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `LanguageAdminPanelComponent` | `features/admin/components/language-admin-panel.component.ts` | Language management + completion dashboard |
| `TranslationEditorComponent` | `features/admin/components/translation-editor.component.ts` | Two-column editor: English source | Target language. Search, filter untranslated. |
| `LanguageSelectorComponent` | `core/components/language-selector.component.ts` | Dropdown in header/account for language selection |

**Complexity:** Medium — the entity model is simple. The pervasive middleware integration and ensuring all user-facing strings flow through `ILocalizationService` is the main effort.

---

### 36. IoT / Machine Integration (OPC-UA)

**Why P4:** Real-time machine data collection for cycle counts, temperatures, vibration. Extremely hardware-dependent — best as a separate microservice.

#### C# Entity Definitions

**`MachineConnection` (`forge.core/Entities/MachineConnection.cs`):**
```csharp
public class MachineConnection : BaseAuditableEntity
{
    public int WorkCenterId { get; set; }
    public string Name { get; set; } = string.Empty;     // "CNC Mill #3"
    public string OpcUaEndpoint { get; set; } = string.Empty; // "opc.tcp://192.168.1.100:4840"
    public string? SecurityPolicy { get; set; }          // "Basic256Sha256", "None"
    public string? AuthType { get; set; }                // "Anonymous", "UserPassword", "Certificate"
    public string? EncryptedCredentials { get; set; }    // Data Protection encrypted
    public MachineConnectionStatus Status { get; set; } = MachineConnectionStatus.Disconnected;
    public DateTimeOffset? LastConnectedAt { get; set; }
    public string? LastError { get; set; }
    public int PollIntervalMs { get; set; } = 1000;
    public bool IsActive { get; set; } = true;

    public WorkCenter WorkCenter { get; set; } = null!;
    public ICollection<MachineTag> Tags { get; set; } = [];
}
```

**`MachineTag` (`forge.core/Entities/MachineTag.cs`):**
```csharp
public class MachineTag : BaseEntity
{
    public int ConnectionId { get; set; }
    public string TagName { get; set; } = string.Empty;  // Friendly name: "SpindleSpeed", "CoolantTemp"
    public string OpcNodeId { get; set; } = string.Empty; // OPC-UA node: "ns=2;s=SpindleSpeed"
    public string DataType { get; set; } = string.Empty;  // "int", "float", "bool", "string"
    public string? Unit { get; set; }                     // "RPM", "°C", "PSI"
    public decimal? WarningThresholdLow { get; set; }
    public decimal? WarningThresholdHigh { get; set; }
    public decimal? AlarmThresholdLow { get; set; }
    public decimal? AlarmThresholdHigh { get; set; }
    public bool IsActive { get; set; } = true;

    public MachineConnection Connection { get; set; } = null!;
}
```

**`MachineDataPoint` (`forge.core/Entities/MachineDataPoint.cs`):**
```csharp
public class MachineDataPoint : BaseEntity
{
    public int TagId { get; set; }
    public int WorkCenterId { get; set; }
    public string Value { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; }
    public MachineDataQuality Quality { get; set; }

    public MachineTag Tag { get; set; } = null!;
}
```

#### Enums

```csharp
public enum MachineConnectionStatus { Disconnected, Connecting, Connected, Error }
public enum MachineDataQuality { Good, Bad, Uncertain }
```

#### Core Interface

```csharp
public interface IMachineDataService
{
    Task ConnectAsync(int connectionId, CancellationToken ct);
    Task DisconnectAsync(int connectionId, CancellationToken ct);
    Task<MachineDataPoint?> GetLatestValueAsync(int tagId, CancellationToken ct);
    Task<IReadOnlyList<MachineDataPoint>> GetHistoryAsync(int tagId, DateTimeOffset from, DateTimeOffset to, CancellationToken ct);
    Task<bool> TestConnectionAsync(int connectionId, CancellationToken ct);
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetMachineConnections` | Query | `Features/Admin/GetMachineConnections.cs` | List connections with status |
| `CreateMachineConnection` | Command | `Features/Admin/CreateMachineConnection.cs` | Create connection + tags |
| `UpdateMachineConnection` | Command | `Features/Admin/UpdateMachineConnection.cs` | Update connection config |
| `TestMachineConnection` | Command | `Features/Admin/TestMachineConnection.cs` | Test OPC-UA connectivity |
| `GetMachineTagHistory` | Query | `Features/ShopFloor/GetMachineTagHistory.cs` | Time-series data for charting |
| `GetMachineTagLatest` | Query | `Features/ShopFloor/GetMachineTagLatest.cs` | Latest values for all tags on work center |

#### API Endpoints

```
GET    /api/v1/admin/machine-connections                 — MachineConnection[] with status
POST   /api/v1/admin/machine-connections                 — Create connection
PUT    /api/v1/admin/machine-connections/{id}            — Update connection
POST   /api/v1/admin/machine-connections/{id}/test       — Test connectivity
GET    /api/v1/shop-floor/machine/{workCenterId}/live     — Latest values for all tags (SSE/SignalR)
GET    /api/v1/shop-floor/machine/{workCenterId}/history  — Time-series (tagId, from, to, interval)
```

#### Angular TypeScript Models

```typescript
export type MachineConnectionStatus = 'Disconnected' | 'Connecting' | 'Connected' | 'Error';

export interface MachineConnection {
  id: number; workCenterId: number; workCenterName: string;
  name: string; opcUaEndpoint: string;
  status: MachineConnectionStatus; lastConnectedAt: string | null;
  lastError: string | null; isActive: boolean; tagCount: number;
}

export interface MachineTag {
  id: number; tagName: string; opcNodeId: string;
  dataType: string; unit: string | null;
  warningThresholdLow: number | null; warningThresholdHigh: number | null;
  alarmThresholdLow: number | null; alarmThresholdHigh: number | null;
}

export interface MachineDataPoint {
  tagId: number; tagName: string; value: string;
  timestamp: string; unit: string | null; quality: 'Good' | 'Bad' | 'Uncertain';
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `MachineConnectionAdminComponent` | `features/admin/components/machine-connection-admin.component.ts` | Connection management with tag configuration |
| `MachineLiveDashboardComponent` | `features/shop-floor/components/machine-live-dashboard.component.ts` | Real-time gauges/charts per work center (SignalR-fed) |
| `MachineHistoryChartComponent` | `features/shop-floor/components/machine-history-chart.component.ts` | Time-series line chart with threshold bands |
| `MachineAlertBannerComponent` | `features/shop-floor/components/machine-alert-banner.component.ts` | Warning/alarm banner when tags exceed thresholds |

**Library:** `OPCFoundation.NetStandard.Opc.Ua` NuGet package.
**Deployment:** Separate Docker container (`forge-iot`), pushes data via internal API or SignalR.
**Data storage:** TimescaleDB extension or time-partitioned table for high-frequency data (avoid bloating main DB).
**Complexity:** Very High — hardware-dependent, requires on-site PLC connectivity, real-time streaming architecture.

---

### 37. E-Commerce Connectors

**Why P4:** Auto-import orders from online stores. Relevant for manufacturers with direct-to-consumer or B2B web sales.

#### C# Entity Definitions

**`ECommerceIntegration` (`forge.core/Entities/ECommerceIntegration.cs`):**
```csharp
public class ECommerceIntegration : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;     // "Shopify - Main Store"
    public ECommercePlatform Platform { get; set; }
    public string EncryptedCredentials { get; set; } = string.Empty; // API key/secret (Data Protection)
    public string? StoreUrl { get; set; }                // "mystore.myshopify.com"
    public bool IsActive { get; set; } = true;
    public bool AutoImportOrders { get; set; } = true;
    public bool SyncInventory { get; set; } = true;
    public DateTimeOffset? LastSyncAt { get; set; }
    public string? LastError { get; set; }
    public string? PartMappingsJson { get; set; }        // [{ "externalSku": "ABC-123", "partId": 42 }]
    public int? DefaultCustomerId { get; set; }          // For B2C orders without customer match
}
```

**`ECommerceOrderSync` (`forge.core/Entities/ECommerceOrderSync.cs`):**
```csharp
public class ECommerceOrderSync : BaseEntity
{
    public int IntegrationId { get; set; }
    public string ExternalOrderId { get; set; } = string.Empty;
    public string ExternalOrderNumber { get; set; } = string.Empty;
    public int? SalesOrderId { get; set; }               // Created SO
    public ECommerceOrderSyncStatus Status { get; set; }
    public string? ErrorMessage { get; set; }
    public string OrderDataJson { get; set; } = string.Empty; // Raw order data
    public DateTimeOffset ImportedAt { get; set; }
}
```

#### Enums

```csharp
public enum ECommercePlatform { Shopify, WooCommerce, Amazon, BigCommerce, Magento }
public enum ECommerceOrderSyncStatus { Pending, Imported, Failed, Skipped, Cancelled }
```

#### Core Interface

```csharp
public interface IECommerceService
{
    ECommercePlatform Platform { get; }
    Task<IReadOnlyList<ECommerceOrder>> PollOrdersAsync(string credentials, string storeUrl, DateTimeOffset since, CancellationToken ct);
    Task<SalesOrder> ImportOrderAsync(ECommerceOrder order, int integrationId, CancellationToken ct);
    Task SyncInventoryAsync(string credentials, string storeUrl, int partId, decimal quantity, CancellationToken ct);
    Task UpdateOrderStatusAsync(string credentials, string storeUrl, string externalOrderId, string status, CancellationToken ct);
    Task<bool> TestConnectionAsync(string credentials, string storeUrl, CancellationToken ct);
}

public record ECommerceOrder
{
    public string ExternalId { get; init; } = string.Empty;
    public string OrderNumber { get; init; } = string.Empty;
    public string CustomerEmail { get; init; } = string.Empty;
    public string CustomerName { get; init; } = string.Empty;
    public IReadOnlyList<ECommerceOrderLine> Lines { get; init; } = [];
    public ECommerceAddress ShippingAddress { get; init; } = new();
    public decimal TotalAmount { get; init; }
    public string CurrencyCode { get; init; } = "USD";
    public DateTimeOffset OrderDate { get; init; }
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetECommerceIntegrations` | Query | `Features/Admin/GetECommerceIntegrations.cs` | List integrations |
| `CreateECommerceIntegration` | Command | `Features/Admin/CreateECommerceIntegration.cs` | Create with credential encryption |
| `UpdateECommerceIntegration` | Command | `Features/Admin/UpdateECommerceIntegration.cs` | Update |
| `TestECommerceConnection` | Command | `Features/Admin/TestECommerceConnection.cs` | Test API connectivity |
| `ImportECommerceOrders` | Command | `Features/SalesOrders/ImportECommerceOrders.cs` | Poll + import new orders |
| `GetECommerceOrderSyncs` | Query | `Features/Admin/GetECommerceOrderSyncs.cs` | Import history log |
| `RetryECommerceImport` | Command | `Features/Admin/RetryECommerceImport.cs` | Retry failed import |
| `SyncECommerceInventory` | Command | `Features/Inventory/SyncECommerceInventory.cs` | Push inventory levels to store |
| `PollECommerceOrders` | Job | `Jobs/PollECommerceOrdersJob.cs` | Hangfire periodic: poll all active integrations |

#### API Endpoints

```
GET    /api/v1/admin/ecommerce                           — ECommerceIntegration[]
POST   /api/v1/admin/ecommerce                           — Create integration
PUT    /api/v1/admin/ecommerce/{id}                      — Update integration
POST   /api/v1/admin/ecommerce/{id}/test                 — Test connection
POST   /api/v1/admin/ecommerce/{id}/import               — Trigger manual import
GET    /api/v1/admin/ecommerce/{id}/syncs                 — Order sync history
POST   /api/v1/admin/ecommerce/syncs/{syncId}/retry       — Retry failed import
POST   /api/v1/admin/ecommerce/{id}/sync-inventory        — Push inventory to store
```

#### Angular TypeScript Models

```typescript
export type ECommercePlatform = 'Shopify' | 'WooCommerce' | 'Amazon' | 'BigCommerce' | 'Magento';
export type ECommerceOrderSyncStatus = 'Pending' | 'Imported' | 'Failed' | 'Skipped' | 'Cancelled';

export interface ECommerceIntegration {
  id: number; name: string; platform: ECommercePlatform;
  storeUrl: string | null; isActive: boolean;
  autoImportOrders: boolean; syncInventory: boolean;
  lastSyncAt: string | null; lastError: string | null;
}

export interface ECommerceOrderSync {
  id: number; externalOrderId: string; externalOrderNumber: string;
  salesOrderId: number | null; status: ECommerceOrderSyncStatus;
  errorMessage: string | null; importedAt: string;
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `ECommerceAdminPanelComponent` | `features/admin/components/ecommerce-admin-panel.component.ts` | Integration list with status, sync controls |
| `ECommerceIntegrationDialogComponent` | `features/admin/components/ecommerce-integration-dialog.component.ts` | Create/edit: platform picker, credentials, SKU mapping table |
| `ECommerceSyncLogComponent` | `features/admin/components/ecommerce-sync-log.component.ts` | DataTable of order imports with retry action |
| `ECommerceSkuMappingComponent` | `features/admin/components/ecommerce-sku-mapping.component.ts` | Map external SKUs to internal part numbers |

**Complexity:** Medium-High — each platform has its own API (Shopify GraphQL, WooCommerce REST, Amazon SP-API). Provider pattern like existing integrations.

---

### 38. Andon Board / Visual Management

**Why P4:** Large-format shop floor displays showing real-time production status. Touch-to-request-help functionality.

#### C# Entity Definitions

**`AndonAlert` (`forge.core/Entities/AndonAlert.cs`):**
```csharp
public class AndonAlert : BaseEntity
{
    public int WorkCenterId { get; set; }
    public AndonAlertType Type { get; set; }
    public AndonAlertStatus Status { get; set; } = AndonAlertStatus.Active;
    public int RequestedById { get; set; }
    public DateTimeOffset RequestedAt { get; set; }
    public DateTimeOffset? AcknowledgedAt { get; set; }
    public int? AcknowledgedById { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public int? ResolvedById { get; set; }
    public decimal? ResponseTimeMinutes => AcknowledgedAt.HasValue ? (decimal)(AcknowledgedAt.Value - RequestedAt).TotalMinutes : null;
    public decimal? ResolutionTimeMinutes => ResolvedAt.HasValue ? (decimal)(ResolvedAt.Value - RequestedAt).TotalMinutes : null;
    public string? Notes { get; set; }
    public int? JobId { get; set; }

    public WorkCenter WorkCenter { get; set; } = null!;
    public ApplicationUser RequestedBy { get; set; } = null!;
    public ApplicationUser? AcknowledgedBy { get; set; }
    public ApplicationUser? ResolvedBy { get; set; }
    public Job? Job { get; set; }
}
```

#### Enums

```csharp
public enum AndonAlertType { Help, Quality, Material, Maintenance, Safety }
public enum AndonAlertStatus { Active, Acknowledged, Resolved }
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetAndonAlerts` | Query | `Features/ShopFloor/GetAndonAlerts.cs` | Active alerts by work center |
| `CreateAndonAlert` | Command | `Features/ShopFloor/CreateAndonAlert.cs` | Request help (sends SignalR push) |
| `AcknowledgeAndonAlert` | Command | `Features/ShopFloor/AcknowledgeAndonAlert.cs` | Acknowledge alert |
| `ResolveAndonAlert` | Command | `Features/ShopFloor/ResolveAndonAlert.cs` | Resolve alert |
| `GetAndonBoardData` | Query | `Features/ShopFloor/GetAndonBoardData.cs` | Full board state (all work centers + status + OEE + alerts) |
| `GetAndonResponseTimeReport` | Query | `Features/Reports/GetAndonResponseTimeReport.cs` | Response/resolution time metrics |

#### API Endpoints

```
GET    /api/v1/shop-floor/andon                          — Board data (all work centers)
GET    /api/v1/shop-floor/andon/alerts                   — Active alerts
POST   /api/v1/shop-floor/andon/alerts                   — Create alert (request help)
POST   /api/v1/shop-floor/andon/alerts/{id}/acknowledge   — Acknowledge
POST   /api/v1/shop-floor/andon/alerts/{id}/resolve       — Resolve
GET    /api/v1/reports/andon-response-times               — Response time metrics
```

#### Angular TypeScript Models

```typescript
export type AndonAlertType = 'Help' | 'Quality' | 'Material' | 'Maintenance' | 'Safety';
export type AndonAlertStatus = 'Active' | 'Acknowledged' | 'Resolved';

export interface AndonAlert {
  id: number; workCenterId: number; workCenterName: string;
  type: AndonAlertType; status: AndonAlertStatus;
  requestedByName: string; requestedAt: string;
  acknowledgedByName: string | null; acknowledgedAt: string | null;
  resolvedAt: string | null; responseTimeMinutes: number | null;
  notes: string | null; jobNumber: string | null;
}

export interface AndonBoardWorkCenter {
  workCenterId: number; workCenterName: string;
  status: 'Green' | 'Yellow' | 'Red';                   // Green=running, Yellow=alert, Red=down
  currentJobNumber: string | null; currentOperationName: string | null;
  oeePercent: number | null; activeAlerts: AndonAlert[];
  dailyTarget: number | null; dailyActual: number | null;
}
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `AndonBoardComponent` | `features/display/components/andon-board.component.ts` | Full-screen grid of work center status cards — green/yellow/red status lights, OEE gauge, active alerts, daily target vs actual bar. SignalR real-time updates. Route: `/display/andon` |
| `AndonWorkCenterCardComponent` | `features/display/components/andon-work-center-card.component.ts` | Individual work center tile with status light, job info, OEE mini-gauge |
| `AndonRequestHelpComponent` | `features/display/components/andon-request-help.component.ts` | Touch-friendly help request: large alert-type buttons (Help/Quality/Material/Maintenance/Safety) |
| `AndonAlertBannerComponent` | `features/display/components/andon-alert-banner.component.ts` | Scrolling alert banner at top of andon board with flash animation for new alerts |
| `AndonResponseReportComponent` | `features/reports/components/andon-response-report.component.ts` | Avg response/resolution times by work center, type |

**Display design:** Full-screen kiosk at `/display/andon`. No header/sidebar. Grid of work center cards (4-6 per row). Each card: status light (large circle), work center name, current job, OEE gauge, target vs actual, active alert badge. Scrolling alert ticker at bottom.

**Complexity:** Medium — mostly display-focused. SignalR integration for real-time status updates. Touch interaction for help requests.

---

### 39. Advanced Reporting (BI Integration)

**Why P4:** Enable Power BI / Tableau connectivity for advanced analytics. Pre-built dashboard templates.

#### Implementation

**`BiApiKey` (`forge.core/Entities/BiApiKey.cs`):**
```csharp
public class BiApiKey : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;     // "Power BI - Production Dashboard"
    public string KeyHash { get; set; } = string.Empty;  // PBKDF2 hashed API key
    public string KeyPrefix { get; set; } = string.Empty; // First 8 chars for display: "qbe_prod..."
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? LastUsedAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public string? AllowedEntitySetsJson { get; set; }   // ["Jobs", "Parts", "SalesOrders"] — null = all
    public string? AllowedIpsJson { get; set; }          // IP whitelist
}
```

#### Core Interface

```csharp
public interface IBiService
{
    Task<string> GenerateApiKeyAsync(string name, DateTimeOffset? expiresAt, IReadOnlyList<string>? allowedEntitySets, CancellationToken ct);
    Task<bool> ValidateApiKeyAsync(string apiKey, CancellationToken ct);
    Task RevokeApiKeyAsync(int keyId, CancellationToken ct);
}
```

#### OData Configuration

**Library:** `Microsoft.AspNetCore.OData` (v9+)

```csharp
// Program.cs OData setup
builder.Services.AddControllers().AddOData(options =>
    options.Select().Filter().OrderBy().Expand().Count().SetMaxTop(1000)
        .AddRouteComponents("odata/v1", GetEdmModel()));

static IEdmModel GetEdmModel()
{
    var builder = new ODataConventionModelBuilder();
    builder.EntitySet<Job>("Jobs");
    builder.EntitySet<Part>("Parts");
    builder.EntitySet<SalesOrder>("SalesOrders");
    builder.EntitySet<PurchaseOrder>("PurchaseOrders");
    builder.EntitySet<Invoice>("Invoices");
    builder.EntitySet<TimeEntry>("TimeEntries");
    builder.EntitySet<Customer>("Customers");
    builder.EntitySet<Vendor>("Vendors");
    builder.EntitySet<BinContent>("Inventory");
    builder.EntitySet<Shipment>("Shipments");
    builder.EntitySet<ClockEvent>("ClockEvents");
    builder.EntitySet<ProductionRun>("ProductionRuns");
    return builder.GetEdmModel();
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetBiApiKeys` | Query | `Features/Admin/GetBiApiKeys.cs` | List API keys (masked) |
| `CreateBiApiKey` | Command | `Features/Admin/CreateBiApiKey.cs` | Generate key, return plaintext once |
| `RevokeBiApiKey` | Command | `Features/Admin/RevokeBiApiKey.cs` | Revoke key |

#### API Endpoints

```
# OData endpoints (read-only, API key auth)
GET    /odata/v1/Jobs                                    — OData queryable
GET    /odata/v1/Parts
GET    /odata/v1/SalesOrders
GET    /odata/v1/PurchaseOrders
GET    /odata/v1/Invoices
GET    /odata/v1/TimeEntries
GET    /odata/v1/Customers
GET    /odata/v1/Vendors
GET    /odata/v1/Inventory
GET    /odata/v1/Shipments
GET    /odata/v1/ClockEvents
GET    /odata/v1/ProductionRuns

# Admin
GET    /api/v1/admin/bi-api-keys                         — List keys (masked)
POST   /api/v1/admin/bi-api-keys                         — Generate key
DELETE /api/v1/admin/bi-api-keys/{id}                    — Revoke key
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `BiApiKeyPanelComponent` | `features/admin/components/bi-api-key-panel.component.ts` | API key management: generate, copy, revoke. Masked display with reveal button. |
| `BiConnectionGuideComponent` | `features/admin/components/bi-connection-guide.component.ts` | Step-by-step Power BI / Tableau connection instructions with endpoint URL display |

**Complexity:** Low-Medium — OData setup is straightforward with `Microsoft.AspNetCore.OData`. API key auth middleware is simple.

---

### 40. Consignment Inventory

**Why P4:** Supports vendor-managed inventory (VMI) and customer-consigned stock models common in automotive/aerospace supply chains.

#### C# Entities

**`ConsignmentAgreement` (`forge.core/Entities/ConsignmentAgreement.cs`):**
```csharp
public class ConsignmentAgreement : BaseAuditableEntity
{
    public ConsignmentDirection Direction { get; set; }   // Inbound (vendor→us) or Outbound (us→customer)
    public int? VendorId { get; set; }                   // Populated for Inbound
    public int? CustomerId { get; set; }                 // Populated for Outbound
    public int PartId { get; set; }
    public decimal AgreedUnitPrice { get; set; }
    public decimal? MinStockQuantity { get; set; }       // Vendor replenishes when below this
    public decimal? MaxStockQuantity { get; set; }       // Cap on consigned stock
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public bool InvoiceOnConsumption { get; set; } = true; // Auto-generate PO/invoice on use
    public ConsignmentAgreementStatus Status { get; set; } = ConsignmentAgreementStatus.Active;
    public string? Terms { get; set; }                   // Free-text agreement terms
    public int ReconciliationFrequencyDays { get; set; } = 30; // How often to reconcile counts

    // Navigation
    public Vendor? Vendor { get; set; }
    public Customer? Customer { get; set; }
    public Part Part { get; set; } = null!;
    public ICollection<ConsignmentTransaction> Transactions { get; set; } = [];
}
```

**`ConsignmentTransaction` (`forge.core/Entities/ConsignmentTransaction.cs`):**
```csharp
public class ConsignmentTransaction : BaseEntity
{
    public int AgreementId { get; set; }
    public ConsignmentTransactionType Type { get; set; } // Receipt, Consumption, Return, Adjustment
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }               // Price at time of transaction
    public decimal ExtendedAmount { get; set; }          // Quantity × UnitPrice
    public int? PurchaseOrderId { get; set; }            // Auto-created PO for consumption
    public int? InvoiceId { get; set; }                  // Auto-created invoice for outbound
    public int? BinContentId { get; set; }               // Inventory affected
    public string? Notes { get; set; }

    // Navigation
    public ConsignmentAgreement Agreement { get; set; } = null!;
    public PurchaseOrder? PurchaseOrder { get; set; }
    public Invoice? Invoice { get; set; }
}
```

**New fields on `BinContent`:**
```csharp
public InventoryOwnership Ownership { get; set; } = InventoryOwnership.Owned;
public int? ConsignmentAgreementId { get; set; }
public ConsignmentAgreement? ConsignmentAgreement { get; set; }
```

#### Enums

```csharp
public enum InventoryOwnership { Owned, ConsignmentInbound, ConsignmentOutbound }
public enum ConsignmentDirection { Inbound, Outbound }
public enum ConsignmentAgreementStatus { Draft, Active, Suspended, Expired, Terminated }
public enum ConsignmentTransactionType { Receipt, Consumption, Return, Adjustment, Reconciliation }
```

#### Core Interface

**`IConsignmentService` (`forge.core/Interfaces/IConsignmentService.cs`):**
```csharp
public interface IConsignmentService
{
    Task<ConsignmentAgreement> CreateAgreementAsync(CreateConsignmentAgreementRequestModel request, CancellationToken ct);
    Task<ConsignmentAgreement> UpdateAgreementAsync(int agreementId, UpdateConsignmentAgreementRequestModel request, CancellationToken ct);
    Task RecordConsumptionAsync(int agreementId, decimal quantity, string? notes, CancellationToken ct);
    Task RecordReceiptAsync(int agreementId, decimal quantity, string? notes, CancellationToken ct);
    Task<ConsignmentReconciliationResponseModel> ReconcileAsync(int agreementId, decimal physicalCount, CancellationToken ct);
    Task<IReadOnlyList<ConsignmentAgreement>> GetAgreementsByVendorAsync(int vendorId, CancellationToken ct);
    Task<IReadOnlyList<ConsignmentAgreement>> GetAgreementsByCustomerAsync(int customerId, CancellationToken ct);
    Task<ConsignmentStockSummaryResponseModel> GetStockSummaryAsync(int? vendorId, int? customerId, CancellationToken ct);
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetConsignmentAgreements` | Query | `Features/Inventory/GetConsignmentAgreements.cs` | List agreements with filter by vendor/customer/status |
| `GetConsignmentAgreement` | Query | `Features/Inventory/GetConsignmentAgreement.cs` | Single agreement with transaction history |
| `CreateConsignmentAgreement` | Command | `Features/Inventory/CreateConsignmentAgreement.cs` | Create agreement, validate vendor/customer exists |
| `UpdateConsignmentAgreement` | Command | `Features/Inventory/UpdateConsignmentAgreement.cs` | Update terms, price, min/max |
| `RecordConsignmentConsumption` | Command | `Features/Inventory/RecordConsignmentConsumption.cs` | Consume stock, auto-create PO if `InvoiceOnConsumption` |
| `RecordConsignmentReceipt` | Command | `Features/Inventory/RecordConsignmentReceipt.cs` | Receive consigned stock, update BinContent |
| `ReconcileConsignment` | Command | `Features/Inventory/ReconcileConsignment.cs` | Compare physical count vs book, create adjustment transactions |
| `GetConsignmentStockSummary` | Query | `Features/Inventory/GetConsignmentStockSummary.cs` | Aggregate consigned stock by owner |

#### API Endpoints

```
GET    /api/v1/consignment-agreements                    — List (filter: vendorId, customerId, status, partId)
GET    /api/v1/consignment-agreements/{id}               — Detail with transactions
POST   /api/v1/consignment-agreements                    — Create agreement
PUT    /api/v1/consignment-agreements/{id}               — Update agreement
POST   /api/v1/consignment-agreements/{id}/consume       — Record consumption
POST   /api/v1/consignment-agreements/{id}/receive       — Record receipt
POST   /api/v1/consignment-agreements/{id}/reconcile     — Reconcile physical count
GET    /api/v1/consignment-agreements/stock-summary      — Consigned stock overview
DELETE /api/v1/consignment-agreements/{id}               — Soft-delete (terminate)
```

#### Angular TypeScript Models

```typescript
export interface ConsignmentAgreement {
  id: number;
  direction: 'Inbound' | 'Outbound';
  vendorId: number | null;
  vendorName: string | null;
  customerId: number | null;
  customerName: string | null;
  partId: number;
  partNumber: string;
  partDescription: string;
  agreedUnitPrice: number;
  minStockQuantity: number | null;
  maxStockQuantity: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  invoiceOnConsumption: boolean;
  status: ConsignmentAgreementStatus;
  reconciliationFrequencyDays: number;
  terms: string | null;
  currentStockQuantity: number;
  transactionCount: number;
  createdAt: string;
}

export interface ConsignmentTransaction {
  id: number;
  agreementId: number;
  type: ConsignmentTransactionType;
  quantity: number;
  unitPrice: number;
  extendedAmount: number;
  purchaseOrderId: number | null;
  invoiceId: number | null;
  notes: string | null;
  createdAt: string;
}

export type ConsignmentAgreementStatus = 'Draft' | 'Active' | 'Suspended' | 'Expired' | 'Terminated';
export type ConsignmentTransactionType = 'Receipt' | 'Consumption' | 'Return' | 'Adjustment' | 'Reconciliation';
export type ConsignmentDirection = 'Inbound' | 'Outbound';
```

#### Angular Service

**`ConsignmentService` (`features/inventory/services/consignment.service.ts`):**
```typescript
getAgreements(params?: { vendorId?: number; customerId?: number; status?: string }): Observable<PaginatedResponse<ConsignmentAgreement>>;
getAgreement(id: number): Observable<ConsignmentAgreement>;
createAgreement(request: CreateConsignmentAgreementRequest): Observable<ConsignmentAgreement>;
updateAgreement(id: number, request: UpdateConsignmentAgreementRequest): Observable<ConsignmentAgreement>;
recordConsumption(id: number, quantity: number, notes?: string): Observable<ConsignmentTransaction>;
recordReceipt(id: number, quantity: number, notes?: string): Observable<ConsignmentTransaction>;
reconcile(id: number, physicalCount: number): Observable<ConsignmentReconciliation>;
getStockSummary(vendorId?: number, customerId?: number): Observable<ConsignmentStockSummary>;
deleteAgreement(id: number): Observable<void>;
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `ConsignmentListComponent` | `features/inventory/pages/consignment-list.component.ts` | DataTable of agreements with status chips, direction filter (Inbound/Outbound), vendor/customer filter |
| `ConsignmentAgreementDialogComponent` | `features/inventory/components/consignment-agreement-dialog.component.ts` | Create/edit agreement form. Direction toggle switches vendor↔customer picker. Part entity picker. |
| `ConsignmentDetailDialogComponent` | `features/inventory/components/consignment-detail-dialog.component.ts` | Agreement detail with transaction history DataTable, stock level indicator (vs min/max), reconcile button |
| `ConsignmentConsumptionDialogComponent` | `features/inventory/components/consignment-consumption-dialog.component.ts` | Record consumption: quantity + notes. Shows auto-PO preview if `invoiceOnConsumption` enabled. |
| `ConsignmentReconcileDialogComponent` | `features/inventory/components/consignment-reconcile-dialog.component.ts` | Enter physical count, shows variance, creates adjustment transaction |
| `ConsignmentStockWidgetComponent` | `features/inventory/components/consignment-stock-widget.component.ts` | Dashboard widget showing consigned stock totals by vendor/customer |

**Hangfire job:** `ConsignmentReconciliationReminderJob` — sends notification when agreement is past reconciliation frequency date.

**Complexity:** Medium — entity model and CRUD are straightforward. Auto-PO generation on consumption reuses existing PO creation handlers.

---

### 41. ABC Inventory Classification

**Why P4:** Standard inventory management technique that drives cycle count frequency, reorder priority, and carrying cost optimization.

#### C# Entities

**`AbcClassification` (`forge.core/Entities/AbcClassification.cs`):**
```csharp
public class AbcClassification : BaseEntity
{
    public int PartId { get; set; }
    public AbcClass Classification { get; set; }
    public decimal AnnualUsageValue { get; set; }        // Unit cost × annual demand quantity
    public decimal AnnualDemandQuantity { get; set; }
    public decimal UnitCost { get; set; }                // Cost at time of calculation
    public decimal CumulativePercent { get; set; }       // Cumulative % of total usage value
    public int Rank { get; set; }                        // 1 = highest usage value
    public DateTimeOffset CalculatedAt { get; set; }
    public int RunId { get; set; }                       // Links to AbcClassificationRun

    // Navigation
    public Part Part { get; set; } = null!;
    public AbcClassificationRun Run { get; set; } = null!;
}
```

**`AbcClassificationRun` (`forge.core/Entities/AbcClassificationRun.cs`):**
```csharp
public class AbcClassificationRun : BaseEntity
{
    public DateTimeOffset RunDate { get; set; }
    public int TotalParts { get; set; }
    public int ClassACount { get; set; }
    public int ClassBCount { get; set; }
    public int ClassCCount { get; set; }
    public decimal ClassAThresholdPercent { get; set; }  // e.g. 80
    public decimal ClassBThresholdPercent { get; set; }  // e.g. 95 (cumulative)
    public decimal TotalAnnualUsageValue { get; set; }
    public int LookbackMonths { get; set; } = 12;

    public ICollection<AbcClassification> Classifications { get; set; } = [];
}
```

**New fields on `Part`:**
```csharp
public AbcClass? AbcClassification { get; set; }         // Current classification (denormalized for quick access)
public int CycleCountFrequencyDays { get; set; }         // Auto-set based on ABC class
```

#### Enums

```csharp
public enum AbcClass { A, B, C }
```

#### Core Interface

**`IAbcClassificationService` (`forge.core/Interfaces/IAbcClassificationService.cs`):**
```csharp
public interface IAbcClassificationService
{
    Task<AbcClassificationRun> RunClassificationAsync(AbcClassificationParametersModel parameters, CancellationToken ct);
    Task<AbcClassificationRun?> GetLatestRunAsync(CancellationToken ct);
    Task<IReadOnlyList<AbcClassification>> GetClassificationsByRunAsync(int runId, CancellationToken ct);
    Task<AbcClassificationSummaryResponseModel> GetSummaryAsync(CancellationToken ct);
    Task ApplyToPartsAsync(int runId, CancellationToken ct); // Updates Part.AbcClassification + CycleCountFrequencyDays
}
```

#### Response Models

```csharp
public record AbcClassificationParametersModel
{
    public decimal ClassAThresholdPercent { get; init; } = 80m;
    public decimal ClassBThresholdPercent { get; init; } = 95m;
    public int LookbackMonths { get; init; } = 12;
    public int ClassACycleCountDays { get; init; } = 30;
    public int ClassBCycleCountDays { get; init; } = 90;
    public int ClassCCycleCountDays { get; init; } = 365;
}

public record AbcClassificationSummaryResponseModel
{
    public DateTimeOffset? LastRunDate { get; init; }
    public int ClassACount { get; init; }
    public int ClassBCount { get; init; }
    public int ClassCCount { get; init; }
    public decimal ClassAValuePercent { get; init; }
    public decimal ClassBValuePercent { get; init; }
    public decimal ClassCValuePercent { get; init; }
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `RunAbcClassification` | Command | `Features/Inventory/RunAbcClassification.cs` | Calculate ABC for all active parts using usage data |
| `GetAbcClassificationRuns` | Query | `Features/Inventory/GetAbcClassificationRuns.cs` | List past classification runs with summary counts |
| `GetAbcClassificationResults` | Query | `Features/Inventory/GetAbcClassificationResults.cs` | Get full results for a specific run |
| `GetAbcSummary` | Query | `Features/Inventory/GetAbcSummary.cs` | Current classification distribution summary |
| `ApplyAbcClassification` | Command | `Features/Inventory/ApplyAbcClassification.cs` | Apply run results to Part entities (update class + cycle count) |

#### API Endpoints

```
POST   /api/v1/inventory/abc/run                         — Trigger classification run
GET    /api/v1/inventory/abc/runs                         — List past runs
GET    /api/v1/inventory/abc/runs/{runId}/results         — Results for a specific run
GET    /api/v1/inventory/abc/summary                      — Current distribution summary
POST   /api/v1/inventory/abc/runs/{runId}/apply           — Apply results to parts
```

#### Angular TypeScript Models

```typescript
export interface AbcClassificationRun {
  id: number;
  runDate: string;
  totalParts: number;
  classACount: number;
  classBCount: number;
  classCCount: number;
  classAThresholdPercent: number;
  classBThresholdPercent: number;
  totalAnnualUsageValue: number;
  lookbackMonths: number;
}

export interface AbcClassificationResult {
  partId: number;
  partNumber: string;
  partDescription: string;
  classification: 'A' | 'B' | 'C';
  annualUsageValue: number;
  annualDemandQuantity: number;
  unitCost: number;
  cumulativePercent: number;
  rank: number;
}

export interface AbcClassificationParameters {
  classAThresholdPercent: number;
  classBThresholdPercent: number;
  lookbackMonths: number;
  classACycleCountDays: number;
  classBCycleCountDays: number;
  classCCycleCountDays: number;
}
```

#### Angular Service

**`AbcClassificationService` (`features/inventory/services/abc-classification.service.ts`):**
```typescript
runClassification(params: AbcClassificationParameters): Observable<AbcClassificationRun>;
getRuns(): Observable<AbcClassificationRun[]>;
getRunResults(runId: number): Observable<AbcClassificationResult[]>;
getSummary(): Observable<AbcClassificationSummary>;
applyRun(runId: number): Observable<void>;
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `AbcClassificationPanelComponent` | `features/inventory/components/abc-classification-panel.component.ts` | Tab panel within Inventory. Shows current summary (donut chart by value %), run history DataTable, "Run Now" button. |
| `AbcRunParametersDialogComponent` | `features/inventory/components/abc-run-parameters-dialog.component.ts` | Configure thresholds (A/B/C %), lookback period, cycle count frequencies. Run button triggers calculation. |
| `AbcRunResultsDialogComponent` | `features/inventory/components/abc-run-results-dialog.component.ts` | DataTable of all parts with classification, usage value, rank. Color-coded rows (green A, yellow B, gray C). "Apply to Parts" button. |

**Hangfire job:** `RecalculateAbcClassificationsJob` — monthly auto-run with default parameters, applies results automatically.

**Complexity:** Low-Medium — mostly aggregation queries on existing demand data (SO lines, BOM explosions, TimeEntry material issues). Algorithm is straightforward sort-and-classify.

---

### 42. Wave Planning / Pick Lists

**Why P4:** Optimizes warehouse picking by grouping multiple shipment lines into efficient pick waves, reducing travel time.

#### C# Entities

**`PickWave` (`forge.core/Entities/PickWave.cs`):**
```csharp
public class PickWave : BaseAuditableEntity
{
    public string WaveNumber { get; set; } = string.Empty;  // Auto-generated: WAVE-0001
    public PickWaveStatus Status { get; set; } = PickWaveStatus.Draft;
    public DateTimeOffset? ReleasedAt { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public int? AssignedToId { get; set; }                  // Picker
    public PickWaveStrategy Strategy { get; set; } = PickWaveStrategy.Zone;
    public int TotalLines { get; set; }
    public int PickedLines { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public ApplicationUser? AssignedTo { get; set; }
    public ICollection<PickLine> Lines { get; set; } = [];
}
```

**`PickLine` (`forge.core/Entities/PickLine.cs`):**
```csharp
public class PickLine : BaseEntity
{
    public int WaveId { get; set; }
    public int ShipmentLineId { get; set; }
    public int PartId { get; set; }
    public int FromLocationId { get; set; }
    public int? FromBinId { get; set; }
    public string? BinPath { get; set; }                   // Denormalized: "WH-A / Aisle-3 / Shelf-B2"
    public decimal RequestedQuantity { get; set; }
    public decimal PickedQuantity { get; set; }
    public PickLineStatus Status { get; set; } = PickLineStatus.Pending;
    public int SortOrder { get; set; }                     // Optimized pick path order
    public int? PickedByUserId { get; set; }
    public DateTimeOffset? PickedAt { get; set; }
    public string? ShortNotes { get; set; }                // Reason for short pick

    // Navigation
    public PickWave Wave { get; set; } = null!;
    public ShipmentLine ShipmentLine { get; set; } = null!;
    public Part Part { get; set; } = null!;
    public StorageLocation FromLocation { get; set; } = null!;
}
```

#### Enums

```csharp
public enum PickWaveStatus { Draft, Released, InProgress, Completed, Cancelled }
public enum PickLineStatus { Pending, Picked, Short, Skipped }
public enum PickWaveStrategy { Zone, Batch, Discrete, WaveByCarrier }
```

#### Core Interface

**`IPickWaveService` (`forge.core/Interfaces/IPickWaveService.cs`):**
```csharp
public interface IPickWaveService
{
    Task<PickWave> CreateWaveAsync(CreatePickWaveRequestModel request, CancellationToken ct);
    Task<PickWave> AutoGenerateWaveAsync(AutoWaveParametersModel parameters, CancellationToken ct);
    Task ReleaseWaveAsync(int waveId, CancellationToken ct);
    Task ConfirmPickLineAsync(int lineId, decimal pickedQuantity, string? shortNotes, CancellationToken ct);
    Task CompleteWaveAsync(int waveId, CancellationToken ct);
    Task<IReadOnlyList<PickLine>> OptimizePickPathAsync(int waveId, CancellationToken ct);
    Task PrintPickListAsync(int waveId, CancellationToken ct); // Generates PDF pick list
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetPickWaves` | Query | `Features/Shipping/GetPickWaves.cs` | List waves with status filter, pagination |
| `GetPickWave` | Query | `Features/Shipping/GetPickWave.cs` | Single wave with all lines |
| `CreatePickWave` | Command | `Features/Shipping/CreatePickWave.cs` | Create wave from selected shipment lines |
| `AutoGeneratePickWave` | Command | `Features/Shipping/AutoGeneratePickWave.cs` | Auto-group pending shipment lines by strategy |
| `ReleasePickWave` | Command | `Features/Shipping/ReleasePickWave.cs` | Release wave for picking, lock inventory |
| `ConfirmPickLine` | Command | `Features/Shipping/ConfirmPickLine.cs` | Confirm picked quantity, handle shorts |
| `CompletePickWave` | Command | `Features/Shipping/CompletePickWave.cs` | Close wave, create bin movements |
| `PrintPickList` | Query | `Features/Shipping/PrintPickList.cs` | Generate PDF pick list (QuestPDF) |

#### API Endpoints

```
GET    /api/v1/pick-waves                                — List waves (filter: status, assignedTo)
GET    /api/v1/pick-waves/{id}                           — Wave detail with lines
POST   /api/v1/pick-waves                                — Create wave from shipment lines
POST   /api/v1/pick-waves/auto-generate                  — Auto-generate wave by strategy
POST   /api/v1/pick-waves/{id}/release                   — Release for picking
POST   /api/v1/pick-waves/{id}/lines/{lineId}/confirm    — Confirm pick line
POST   /api/v1/pick-waves/{id}/complete                  — Complete wave
GET    /api/v1/pick-waves/{id}/print                     — PDF pick list
```

#### Angular TypeScript Models

```typescript
export interface PickWave {
  id: number;
  waveNumber: string;
  status: PickWaveStatus;
  strategy: PickWaveStrategy;
  assignedToId: number | null;
  assignedToName: string | null;
  totalLines: number;
  pickedLines: number;
  releasedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  lines: PickLine[];
  createdAt: string;
}

export interface PickLine {
  id: number;
  shipmentLineId: number;
  shipmentNumber: string;
  partId: number;
  partNumber: string;
  partDescription: string;
  fromLocationName: string;
  binPath: string | null;
  requestedQuantity: number;
  pickedQuantity: number;
  status: PickLineStatus;
  sortOrder: number;
  pickedAt: string | null;
  shortNotes: string | null;
}

export type PickWaveStatus = 'Draft' | 'Released' | 'InProgress' | 'Completed' | 'Cancelled';
export type PickLineStatus = 'Pending' | 'Picked' | 'Short' | 'Skipped';
export type PickWaveStrategy = 'Zone' | 'Batch' | 'Discrete' | 'WaveByCarrier';
```

#### Angular Service

**`PickWaveService` (`features/shipping/services/pick-wave.service.ts`):**
```typescript
getWaves(params?: { status?: string; assignedToId?: number }): Observable<PaginatedResponse<PickWave>>;
getWave(id: number): Observable<PickWave>;
createWave(request: CreatePickWaveRequest): Observable<PickWave>;
autoGenerateWave(params: AutoWaveParameters): Observable<PickWave>;
releaseWave(id: number): Observable<void>;
confirmPickLine(waveId: number, lineId: number, pickedQuantity: number, shortNotes?: string): Observable<void>;
completeWave(id: number): Observable<void>;
printPickList(id: number): Observable<Blob>;
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `PickWaveListComponent` | `features/shipping/pages/pick-wave-list.component.ts` | DataTable of waves with status chips, progress bar (picked/total), assigned picker avatar. Filter by status. |
| `PickWaveDetailDialogComponent` | `features/shipping/components/pick-wave-detail-dialog.component.ts` | Wave detail: DataTable of pick lines sorted by optimized path. Confirm button per line with quantity input. Short-pick notes. Print pick list button. |
| `CreatePickWaveDialogComponent` | `features/shipping/components/create-pick-wave-dialog.component.ts` | Select pending shipment lines (multi-select DataTable), choose strategy, assign picker. |
| `AutoGenerateWaveDialogComponent` | `features/shipping/components/auto-generate-wave-dialog.component.ts` | Auto-group parameters: strategy, date range, max lines per wave. Preview before creation. |
| `MobilePickListComponent` | `features/mobile/pages/mobile-pick-list.component.ts` | Mobile-optimized pick confirmation: scan part barcode → confirm quantity → next line. Large touch targets. |

**Complexity:** Medium — pick path optimization is the most complex part (zone-based sorting by location hierarchy). The rest is CRUD + status machine.

---

### 43. Drop Shipping

**Why P4:** Allows fulfilling customer orders directly from vendor without receiving into own inventory first.

#### C# Entity Changes

**New fields on `SalesOrderLine`:**
```csharp
public bool IsDropShip { get; set; }
public int? DropShipVendorId { get; set; }
public int? DropShipPurchaseOrderId { get; set; }        // Auto-generated PO to vendor
public int? DropShipPurchaseOrderLineId { get; set; }

// Navigation
public Vendor? DropShipVendor { get; set; }
public PurchaseOrder? DropShipPurchaseOrder { get; set; }
```

**New fields on `PurchaseOrderLine`:**
```csharp
public bool IsDropShip { get; set; }
public int? DropShipSalesOrderLineId { get; set; }       // Back-link to originating SO line
public int? ShipToCustomerAddressId { get; set; }        // Customer's address for direct ship

// Navigation
public SalesOrderLine? DropShipSalesOrderLine { get; set; }
public CustomerAddress? ShipToCustomerAddress { get; set; }
```

#### Core Interface

**`IDropShipService` (`forge.core/Interfaces/IDropShipService.cs`):**
```csharp
public interface IDropShipService
{
    Task<PurchaseOrder> CreateDropShipPurchaseOrderAsync(int salesOrderLineId, int vendorId, CancellationToken ct);
    Task ConfirmDropShipDeliveryAsync(int purchaseOrderLineId, decimal deliveredQuantity, string? trackingNumber, CancellationToken ct);
    Task<IReadOnlyList<DropShipStatusResponseModel>> GetPendingDropShipsAsync(CancellationToken ct);
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `CreateDropShipOrder` | Command | `Features/SalesOrders/CreateDropShipOrder.cs` | Creates PO with customer's ship-to address, links SO line ↔ PO line |
| `ConfirmDropShipDelivery` | Command | `Features/SalesOrders/ConfirmDropShipDelivery.cs` | Vendor confirms delivery → updates SO line fulfillment status |
| `GetPendingDropShips` | Query | `Features/SalesOrders/GetPendingDropShips.cs` | List all open drop-ship lines with vendor + customer info |

#### API Endpoints

```
POST   /api/v1/sales-orders/{soId}/lines/{lineId}/drop-ship  — Create drop-ship PO for SO line
POST   /api/v1/purchase-orders/{poId}/lines/{lineId}/drop-ship-confirm  — Confirm delivery
GET    /api/v1/drop-ships/pending                             — List pending drop-ships
```

#### Angular TypeScript Models

```typescript
export interface DropShipStatus {
  salesOrderId: number;
  salesOrderNumber: string;
  salesOrderLineId: number;
  customerName: string;
  partNumber: string;
  partDescription: string;
  quantity: number;
  vendorName: string;
  purchaseOrderId: number | null;
  purchaseOrderNumber: string | null;
  status: 'PendingPO' | 'POCreated' | 'Shipped' | 'Delivered';
  trackingNumber: string | null;
}
```

#### Angular Service

**`DropShipService` (`features/sales-orders/services/drop-ship.service.ts`):**
```typescript
createDropShipOrder(salesOrderId: number, lineId: number, vendorId: number): Observable<PurchaseOrder>;
confirmDelivery(poId: number, lineId: number, quantity: number, trackingNumber?: string): Observable<void>;
getPendingDropShips(): Observable<DropShipStatus[]>;
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `DropShipToggleComponent` | `features/sales-orders/components/drop-ship-toggle.component.ts` | Inline toggle on SO line edit — marks as drop-ship, shows vendor picker |
| `DropShipPendingListComponent` | `features/sales-orders/components/drop-ship-pending-list.component.ts` | DataTable of pending drop-ships with status tracking, confirm delivery action |

**Logic:** When SO line marked as drop-ship → `CreateDropShipOrder` auto-creates PO to vendor with customer's shipping address as the ship-to. Vendor ships directly to customer. On PO receipt confirmation → marks SO line as fulfilled without touching inventory.

**Complexity:** Low — extends existing SO/PO entities with a few FK fields. Logic is mostly linking and status updates.

---

### 44. Back-to-Back Orders

**Why P4:** Automates purchase-on-demand for make-to-order environments where stock isn't held.

#### C# Entity Changes

**New fields on `SalesOrderLine`:**
```csharp
public bool IsBackToBack { get; set; }
public int? BackToBackPurchaseOrderLineId { get; set; }  // Auto-linked PO line

// Navigation
public PurchaseOrderLine? BackToBackPurchaseOrderLine { get; set; }
```

**New fields on `PurchaseOrderLine`:**
```csharp
public int? BackToBackSalesOrderLineId { get; set; }     // Back-link to originating SO line

// Navigation
public SalesOrderLine? BackToBackSalesOrderLine { get; set; }
```

#### Core Interface

**`IBackToBackService` (`forge.core/Interfaces/IBackToBackService.cs`):**
```csharp
public interface IBackToBackService
{
    Task<PurchaseOrderLine> CreateBackToBackOrderAsync(int salesOrderLineId, int vendorId, CancellationToken ct);
    Task LinkReceiptToSalesOrderAsync(int purchaseOrderLineId, int receivingRecordId, CancellationToken ct);
    Task<IReadOnlyList<BackToBackStatusResponseModel>> GetPendingBackToBacksAsync(CancellationToken ct);
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `CreateBackToBackOrder` | Command | `Features/SalesOrders/CreateBackToBackOrder.cs` | SO line confirmation → auto-create PO line to preferred vendor |
| `LinkBackToBackReceipt` | Command | `Features/SalesOrders/LinkBackToBackReceipt.cs` | PO receipt → mark SO line materials available |
| `GetPendingBackToBacks` | Query | `Features/SalesOrders/GetPendingBackToBacks.cs` | List open back-to-back lines with receipt status |

#### API Endpoints

```
POST   /api/v1/sales-orders/{soId}/lines/{lineId}/back-to-back  — Create B2B PO for SO line
POST   /api/v1/purchase-orders/{poId}/lines/{lineId}/link-receipt  — Link receipt to SO
GET    /api/v1/back-to-back/pending                              — List pending B2B orders
```

#### Angular TypeScript Models

```typescript
export interface BackToBackStatus {
  salesOrderId: number;
  salesOrderNumber: string;
  salesOrderLineId: number;
  customerName: string;
  partNumber: string;
  quantity: number;
  vendorName: string;
  purchaseOrderId: number | null;
  purchaseOrderNumber: string | null;
  status: 'PendingPO' | 'POCreated' | 'Received' | 'Available';
  receivedQuantity: number;
}
```

#### Angular Service

**`BackToBackService` (`features/sales-orders/services/back-to-back.service.ts`):**
```typescript
createBackToBackOrder(salesOrderId: number, lineId: number, vendorId: number): Observable<PurchaseOrderLine>;
linkReceipt(poId: number, lineId: number, receivingRecordId: number): Observable<void>;
getPendingBackToBacks(): Observable<BackToBackStatus[]>;
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `BackToBackToggleComponent` | `features/sales-orders/components/back-to-back-toggle.component.ts` | Inline toggle on SO line — marks as B2B, shows vendor picker + auto-PO preview |
| `BackToBackPendingListComponent` | `features/sales-orders/components/back-to-back-pending-list.component.ts` | DataTable of pending B2B orders with receipt status, link receipt action |

**Logic:** When SO line for a purchased part is confirmed → auto-create PO line to vendor. PO receipt triggers SO line availability update. Similar to drop-ship but stock flows through our facility.

**Complexity:** Low — very similar to drop-ship pattern. Extends existing SO/PO linking.

---

### 45. Kanban (Lean) Replenishment

**Why P4:** Implements pull-based inventory replenishment (2-bin, multi-bin systems) for lean manufacturing environments.

#### C# Entities

**`KanbanCard` (`forge.core/Entities/KanbanCard.cs`):**
```csharp
public class KanbanCard : BaseAuditableEntity
{
    public string CardNumber { get; set; } = string.Empty; // Auto-generated: KB-0001
    public int PartId { get; set; }
    public int WorkCenterId { get; set; }
    public int? StorageLocationId { get; set; }          // Point-of-use location
    public decimal BinQuantity { get; set; }             // Standard quantity per bin/container
    public int NumberOfBins { get; set; } = 2;           // Typically 2-bin or 3-bin system
    public KanbanCardStatus Status { get; set; } = KanbanCardStatus.Full;
    public KanbanSupplySource SupplySource { get; set; } // Production or Purchase
    public int? SupplyVendorId { get; set; }             // For purchased parts
    public int? SupplyWorkCenterId { get; set; }         // For manufactured parts (upstream WC)
    public decimal? LeadTimeDays { get; set; }           // Expected replenishment lead time
    public DateTimeOffset? LastTriggeredAt { get; set; }
    public DateTimeOffset? LastReplenishedAt { get; set; }
    public int? ActiveOrderId { get; set; }              // PO or Job triggered by this card
    public string? ActiveOrderType { get; set; }         // "PurchaseOrder" or "Job"
    public int TriggerCount { get; set; }                // Historical trigger count
    public bool IsActive { get; set; } = true;

    // Navigation
    public Part Part { get; set; } = null!;
    public WorkCenter WorkCenter { get; set; } = null!;
    public StorageLocation? StorageLocation { get; set; }
    public Vendor? SupplyVendor { get; set; }
    public ICollection<KanbanTriggerLog> TriggerLogs { get; set; } = [];
}
```

**`KanbanTriggerLog` (`forge.core/Entities/KanbanTriggerLog.cs`):**
```csharp
public class KanbanTriggerLog : BaseEntity
{
    public int KanbanCardId { get; set; }
    public KanbanTriggerType TriggerType { get; set; }   // Manual, Scan, AutoLevel
    public DateTimeOffset TriggeredAt { get; set; }
    public DateTimeOffset? FulfilledAt { get; set; }
    public decimal RequestedQuantity { get; set; }
    public decimal? FulfilledQuantity { get; set; }
    public int? OrderId { get; set; }                    // Created PO or Job
    public string? OrderType { get; set; }
    public int? TriggeredByUserId { get; set; }

    // Navigation
    public KanbanCard KanbanCard { get; set; } = null!;
    public ApplicationUser? TriggeredByUser { get; set; }
}
```

#### Enums

```csharp
public enum KanbanCardStatus { Full, Triggered, InReplenishment, Empty }
public enum KanbanSupplySource { Production, Purchase }
public enum KanbanTriggerType { Manual, Scan, AutoLevel }
```

#### Core Interface

**`IKanbanReplenishmentService` (`forge.core/Interfaces/IKanbanReplenishmentService.cs`):**
```csharp
public interface IKanbanReplenishmentService
{
    Task<KanbanCard> CreateCardAsync(CreateKanbanCardRequestModel request, CancellationToken ct);
    Task<KanbanCard> UpdateCardAsync(int cardId, UpdateKanbanCardRequestModel request, CancellationToken ct);
    Task TriggerReplenishmentAsync(int cardId, KanbanTriggerType triggerType, int? triggeredByUserId, CancellationToken ct);
    Task ConfirmReplenishmentAsync(int cardId, decimal fulfilledQuantity, CancellationToken ct);
    Task<IReadOnlyList<KanbanCard>> GetCardsByWorkCenterAsync(int workCenterId, CancellationToken ct);
    Task<IReadOnlyList<KanbanCard>> GetTriggeredCardsAsync(CancellationToken ct);
    Task CalculateOptimalBinQuantityAsync(int cardId, CancellationToken ct); // Based on usage history
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetKanbanCards` | Query | `Features/Inventory/GetKanbanCards.cs` | List cards with filter by work center, part, status |
| `GetKanbanCard` | Query | `Features/Inventory/GetKanbanCard.cs` | Single card with trigger history |
| `CreateKanbanCard` | Command | `Features/Inventory/CreateKanbanCard.cs` | Create card with part, WC, bin qty, supply source |
| `UpdateKanbanCard` | Command | `Features/Inventory/UpdateKanbanCard.cs` | Update parameters (bin qty, bins, vendor) |
| `TriggerKanbanReplenishment` | Command | `Features/Inventory/TriggerKanbanReplenishment.cs` | Trigger → create PO or Job, log event |
| `ConfirmKanbanReplenishment` | Command | `Features/Inventory/ConfirmKanbanReplenishment.cs` | Mark card as Full, close trigger log |
| `GetTriggeredKanbanCards` | Query | `Features/Inventory/GetTriggeredKanbanCards.cs` | Dashboard: all cards awaiting replenishment |
| `GetKanbanBoardByWorkCenter` | Query | `Features/Inventory/GetKanbanBoardByWorkCenter.cs` | Visual board data grouped by work center |

#### API Endpoints

```
GET    /api/v1/kanban-cards                              — List cards (filter: workCenterId, partId, status)
GET    /api/v1/kanban-cards/{id}                         — Card detail with trigger history
POST   /api/v1/kanban-cards                              — Create card
PUT    /api/v1/kanban-cards/{id}                         — Update card
POST   /api/v1/kanban-cards/{id}/trigger                 — Trigger replenishment
POST   /api/v1/kanban-cards/{id}/confirm                 — Confirm replenishment received
GET    /api/v1/kanban-cards/triggered                    — Cards awaiting replenishment
GET    /api/v1/kanban-cards/board                        — Visual board data by work center
DELETE /api/v1/kanban-cards/{id}                         — Deactivate card
```

#### Angular TypeScript Models

```typescript
export interface KanbanCard {
  id: number;
  cardNumber: string;
  partId: number;
  partNumber: string;
  partDescription: string;
  workCenterId: number;
  workCenterName: string;
  storageLocationId: number | null;
  storageLocationName: string | null;
  binQuantity: number;
  numberOfBins: number;
  status: KanbanCardStatus;
  supplySource: 'Production' | 'Purchase';
  supplyVendorName: string | null;
  leadTimeDays: number | null;
  lastTriggeredAt: string | null;
  lastReplenishedAt: string | null;
  activeOrderId: number | null;
  activeOrderType: string | null;
  triggerCount: number;
  isActive: boolean;
}

export interface KanbanTriggerLog {
  id: number;
  triggerType: 'Manual' | 'Scan' | 'AutoLevel';
  triggeredAt: string;
  fulfilledAt: string | null;
  requestedQuantity: number;
  fulfilledQuantity: number | null;
  orderId: number | null;
  orderType: string | null;
  triggeredByName: string | null;
}

export type KanbanCardStatus = 'Full' | 'Triggered' | 'InReplenishment' | 'Empty';

export interface KanbanBoardWorkCenter {
  workCenterId: number;
  workCenterName: string;
  cards: KanbanCard[];
}
```

#### Angular Service

**`KanbanReplenishmentService` (`features/inventory/services/kanban-replenishment.service.ts`):**
```typescript
getCards(params?: { workCenterId?: number; partId?: number; status?: string }): Observable<PaginatedResponse<KanbanCard>>;
getCard(id: number): Observable<KanbanCard>;
createCard(request: CreateKanbanCardRequest): Observable<KanbanCard>;
updateCard(id: number, request: UpdateKanbanCardRequest): Observable<KanbanCard>;
triggerReplenishment(id: number, triggerType: string): Observable<void>;
confirmReplenishment(id: number, fulfilledQuantity: number): Observable<void>;
getTriggeredCards(): Observable<KanbanCard[]>;
getBoard(): Observable<KanbanBoardWorkCenter[]>;
deleteCard(id: number): Observable<void>;
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `KanbanReplenishmentBoardComponent` | `features/inventory/pages/kanban-replenishment-board.component.ts` | Visual board: grid of cards grouped by work center. Cards colored by status (green=Full, yellow=Triggered, blue=InReplenishment, red=Empty). Click card to trigger/confirm. |
| `KanbanCardDialogComponent` | `features/inventory/components/kanban-card-dialog.component.ts` | Create/edit card: part picker, work center select, bin qty, number of bins, supply source (Purchase→vendor picker, Production→upstream WC picker). |
| `KanbanCardDetailDialogComponent` | `features/inventory/components/kanban-card-detail-dialog.component.ts` | Card detail with trigger history timeline, status actions (Trigger/Confirm), linked order navigation. |
| `KanbanTriggeredListComponent` | `features/inventory/components/kanban-triggered-list.component.ts` | Dashboard widget: cards awaiting replenishment with elapsed time since trigger, urgency indicator. |
| `KanbanCardPrintComponent` | `features/inventory/components/kanban-card-print.component.ts` | Printable kanban card label (part number, bin qty, supply source, barcode) for physical bins. |

**Scanner integration:** Scanning a kanban card barcode triggers replenishment via `ScannerService` context routing.

**Complexity:** Medium — card management is CRUD, but auto-order creation (PO for purchased, Job for manufactured) requires integration with existing order creation handlers. Visual board is a new UI pattern.

---

### 46. Project Accounting / WBS

**Why P4:** Enables project-based manufacturers (ETO — Engineer-to-Order) to track costs hierarchically against a Work Breakdown Structure.

#### C# Entities

**`Project` (`forge.core/Entities/Project.cs`):**
```csharp
public class Project : BaseAuditableEntity
{
    public string ProjectNumber { get; set; } = string.Empty; // Auto-generated: PRJ-0001
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? CustomerId { get; set; }
    public int? SalesOrderId { get; set; }               // Originating sales order
    public decimal BudgetTotal { get; set; }
    public decimal ActualTotal { get; set; }             // Sum of all WBS element actuals
    public decimal CommittedTotal { get; set; }          // Open POs + unreleased jobs
    public decimal EstimateAtCompletionTotal { get; set; } // Actual + remaining committed
    public ProjectStatus Status { get; set; } = ProjectStatus.Planning;
    public DateOnly? PlannedStartDate { get; set; }
    public DateOnly? PlannedEndDate { get; set; }
    public DateOnly? ActualStartDate { get; set; }
    public DateOnly? ActualEndDate { get; set; }
    public decimal? RevenueRecognized { get; set; }      // Percentage-of-completion
    public decimal? PercentComplete { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public Customer? Customer { get; set; }
    public SalesOrder? SalesOrder { get; set; }
    public ICollection<WbsElement> WbsElements { get; set; } = [];
}
```

**`WbsElement` (`forge.core/Entities/WbsElement.cs`):**
```csharp
public class WbsElement : BaseEntity
{
    public int ProjectId { get; set; }
    public int? ParentElementId { get; set; }            // Hierarchical (recursive)
    public string Code { get; set; } = string.Empty;     // "1.1.2" — hierarchical numbering
    public string Name { get; set; } = string.Empty;
    public WbsElementType Type { get; set; } = WbsElementType.WorkPackage;
    public decimal BudgetLabor { get; set; }
    public decimal BudgetMaterial { get; set; }
    public decimal BudgetOther { get; set; }
    public decimal BudgetTotal { get; set; }             // Sum of above
    public decimal ActualLabor { get; set; }             // From linked TimeEntries
    public decimal ActualMaterial { get; set; }          // From linked material issues / PO receipts
    public decimal ActualOther { get; set; }             // Manual cost entries
    public decimal ActualTotal { get; set; }             // Sum of above
    public int SortOrder { get; set; }
    public DateOnly? PlannedStart { get; set; }
    public DateOnly? PlannedEnd { get; set; }
    public decimal? PercentComplete { get; set; }

    // Navigation
    public Project Project { get; set; } = null!;
    public WbsElement? ParentElement { get; set; }
    public ICollection<WbsElement> ChildElements { get; set; } = [];
    public ICollection<Job> LinkedJobs { get; set; } = [];
    public ICollection<WbsCostEntry> CostEntries { get; set; } = [];
}
```

**`WbsCostEntry` (`forge.core/Entities/WbsCostEntry.cs`):**
```csharp
public class WbsCostEntry : BaseEntity
{
    public int WbsElementId { get; set; }
    public WbsCostCategory Category { get; set; }        // Labor, Material, Subcontract, Other
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public string? SourceEntityType { get; set; }        // "TimeEntry", "PurchaseOrderLine", "Expense"
    public int? SourceEntityId { get; set; }
    public DateTimeOffset EntryDate { get; set; }

    // Navigation
    public WbsElement WbsElement { get; set; } = null!;
}
```

**New fields on `Job`:**
```csharp
public int? ProjectId { get; set; }
public int? WbsElementId { get; set; }

// Navigation
public Project? Project { get; set; }
public WbsElement? WbsElement { get; set; }
```

#### Enums

```csharp
public enum ProjectStatus { Planning, Active, OnHold, Complete, Cancelled }
public enum WbsElementType { Phase, Deliverable, WorkPackage, Milestone }
public enum WbsCostCategory { Labor, Material, Subcontract, Other }
```

#### Core Interface

**`IProjectAccountingService` (`forge.core/Interfaces/IProjectAccountingService.cs`):**
```csharp
public interface IProjectAccountingService
{
    Task<Project> CreateProjectAsync(CreateProjectRequestModel request, CancellationToken ct);
    Task<Project> UpdateProjectAsync(int projectId, UpdateProjectRequestModel request, CancellationToken ct);
    Task<WbsElement> AddWbsElementAsync(int projectId, CreateWbsElementRequestModel request, CancellationToken ct);
    Task<WbsElement> UpdateWbsElementAsync(int elementId, UpdateWbsElementRequestModel request, CancellationToken ct);
    Task DeleteWbsElementAsync(int elementId, CancellationToken ct);
    Task AddCostEntryAsync(int elementId, WbsCostEntry entry, CancellationToken ct);
    Task RecalculateProjectTotalsAsync(int projectId, CancellationToken ct);
    Task<ProjectSummaryResponseModel> GetProjectSummaryAsync(int projectId, CancellationToken ct);
    Task<EarnedValueMetricsResponseModel> GetEarnedValueMetricsAsync(int projectId, CancellationToken ct);
}
```

#### Response Models

```csharp
public record ProjectSummaryResponseModel
{
    public int ProjectId { get; init; }
    public decimal BudgetTotal { get; init; }
    public decimal ActualTotal { get; init; }
    public decimal CommittedTotal { get; init; }
    public decimal EstimateAtCompletion { get; init; }
    public decimal VarianceAtCompletion { get; init; }   // Budget - EAC
    public decimal PercentComplete { get; init; }
    public IReadOnlyList<WbsElementSummary> WbsTree { get; init; } = [];
}

public record EarnedValueMetricsResponseModel
{
    public decimal BudgetedCostOfWorkScheduled { get; init; } // BCWS / Planned Value
    public decimal BudgetedCostOfWorkPerformed { get; init; } // BCWP / Earned Value
    public decimal ActualCostOfWorkPerformed { get; init; }   // ACWP / Actual Cost
    public decimal ScheduleVariance { get; init; }       // BCWP - BCWS
    public decimal CostVariance { get; init; }           // BCWP - ACWP
    public decimal SchedulePerformanceIndex { get; init; } // BCWP / BCWS
    public decimal CostPerformanceIndex { get; init; }   // BCWP / ACWP
    public decimal EstimateAtCompletion { get; init; }   // BAC / CPI
    public decimal EstimateToComplete { get; init; }     // EAC - ACWP
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetProjects` | Query | `Features/Projects/GetProjects.cs` | List projects with pagination, filter by status/customer |
| `GetProject` | Query | `Features/Projects/GetProject.cs` | Project with full WBS tree + cost summary |
| `CreateProject` | Command | `Features/Projects/CreateProject.cs` | Create project, optionally from sales order |
| `UpdateProject` | Command | `Features/Projects/UpdateProject.cs` | Update project details |
| `AddWbsElement` | Command | `Features/Projects/AddWbsElement.cs` | Add element to WBS tree |
| `UpdateWbsElement` | Command | `Features/Projects/UpdateWbsElement.cs` | Update element budget/dates |
| `DeleteWbsElement` | Command | `Features/Projects/DeleteWbsElement.cs` | Remove element (cascade check on children/jobs) |
| `AddWbsCostEntry` | Command | `Features/Projects/AddWbsCostEntry.cs` | Manual cost entry against WBS element |
| `GetProjectSummary` | Query | `Features/Projects/GetProjectSummary.cs` | Budget vs actual vs EAC by element |
| `GetEarnedValueMetrics` | Query | `Features/Projects/GetEarnedValueMetrics.cs` | Full EVM calculation (CPI, SPI, EAC, ETC) |
| `RecalculateProjectTotals` | Command | `Features/Projects/RecalculateProjectTotals.cs` | Recompute all rollup totals from cost entries |
| `LinkJobToWbs` | Command | `Features/Projects/LinkJobToWbs.cs` | Assign job to a WBS element |

#### API Endpoints

```
GET    /api/v1/projects                                  — List projects (filter: status, customerId)
GET    /api/v1/projects/{id}                             — Project detail with WBS tree
POST   /api/v1/projects                                  — Create project
PUT    /api/v1/projects/{id}                             — Update project
DELETE /api/v1/projects/{id}                             — Soft-delete project
POST   /api/v1/projects/{id}/wbs                         — Add WBS element
PUT    /api/v1/projects/{id}/wbs/{elementId}             — Update WBS element
DELETE /api/v1/projects/{id}/wbs/{elementId}             — Delete WBS element
POST   /api/v1/projects/{id}/wbs/{elementId}/costs       — Add manual cost entry
GET    /api/v1/projects/{id}/summary                     — Budget vs actual summary
GET    /api/v1/projects/{id}/earned-value                — Earned value metrics
POST   /api/v1/projects/{id}/recalculate                 — Recalculate totals
POST   /api/v1/projects/{id}/wbs/{elementId}/link-job    — Link job to WBS
```

#### Angular TypeScript Models

```typescript
export interface Project {
  id: number;
  projectNumber: string;
  name: string;
  description: string | null;
  customerId: number | null;
  customerName: string | null;
  salesOrderId: number | null;
  budgetTotal: number;
  actualTotal: number;
  committedTotal: number;
  estimateAtCompletionTotal: number;
  status: ProjectStatus;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  percentComplete: number | null;
  wbsElements: WbsElement[];
  createdAt: string;
}

export interface WbsElement {
  id: number;
  parentElementId: number | null;
  code: string;
  name: string;
  type: WbsElementType;
  budgetLabor: number;
  budgetMaterial: number;
  budgetOther: number;
  budgetTotal: number;
  actualLabor: number;
  actualMaterial: number;
  actualOther: number;
  actualTotal: number;
  percentComplete: number | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  childElements: WbsElement[];
  linkedJobCount: number;
}

export interface EarnedValueMetrics {
  budgetedCostOfWorkScheduled: number;
  budgetedCostOfWorkPerformed: number;
  actualCostOfWorkPerformed: number;
  scheduleVariance: number;
  costVariance: number;
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
  estimateAtCompletion: number;
  estimateToComplete: number;
}

export type ProjectStatus = 'Planning' | 'Active' | 'OnHold' | 'Complete' | 'Cancelled';
export type WbsElementType = 'Phase' | 'Deliverable' | 'WorkPackage' | 'Milestone';
```

#### Angular Service

**`ProjectAccountingService` (`features/projects/services/project-accounting.service.ts`):**
```typescript
getProjects(params?: { status?: string; customerId?: number }): Observable<PaginatedResponse<Project>>;
getProject(id: number): Observable<Project>;
createProject(request: CreateProjectRequest): Observable<Project>;
updateProject(id: number, request: UpdateProjectRequest): Observable<Project>;
deleteProject(id: number): Observable<void>;
addWbsElement(projectId: number, request: CreateWbsElementRequest): Observable<WbsElement>;
updateWbsElement(projectId: number, elementId: number, request: UpdateWbsElementRequest): Observable<WbsElement>;
deleteWbsElement(projectId: number, elementId: number): Observable<void>;
addCostEntry(projectId: number, elementId: number, entry: CreateCostEntryRequest): Observable<void>;
getSummary(id: number): Observable<ProjectSummary>;
getEarnedValueMetrics(id: number): Observable<EarnedValueMetrics>;
recalculateTotals(id: number): Observable<void>;
linkJobToWbs(projectId: number, elementId: number, jobId: number): Observable<void>;
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `ProjectListComponent` | `features/projects/pages/project-list.component.ts` | DataTable of projects with status chips, budget vs actual progress bars, customer name, date range. |
| `ProjectDetailComponent` | `features/projects/pages/project-detail.component.ts` | Full project view with 3 tabs: WBS Tree, Costs, Earned Value Analysis. |
| `WbsTreeComponent` | `features/projects/components/wbs-tree.component.ts` | Hierarchical tree view of WBS elements. Expandable nodes. Budget/actual/variance per row. Add/edit/delete actions. Drag-and-drop reorder. |
| `WbsElementDialogComponent` | `features/projects/components/wbs-element-dialog.component.ts` | Create/edit WBS element: code, name, type, budget (labor/material/other), planned dates. Parent element selector. |
| `ProjectCostSummaryComponent` | `features/projects/components/project-cost-summary.component.ts` | Budget vs actual vs committed waterfall chart. Cost entries DataTable filterable by WBS element and category. |
| `EarnedValueChartComponent` | `features/projects/components/earned-value-chart.component.ts` | S-curve chart: PV vs EV vs AC over time. KPI cards for CPI, SPI, EAC, ETC. Traffic light indicators. |
| `ProjectDialogComponent` | `features/projects/components/project-dialog.component.ts` | Create/edit project form. Customer picker, sales order picker, budget, dates, status. |
| `LinkJobToWbsDialogComponent` | `features/projects/components/link-job-to-wbs-dialog.component.ts` | Select WBS work package to assign a job to. Shows element hierarchy with budget remaining. |

**Complexity:** High — WBS hierarchy management (recursive tree), earned value calculations (BCWS/BCWP/ACWP), cost rollup from multiple sources (TimeEntry, PO receipts, expenses). Tree UI component is non-trivial.

---

### 47. Quality Cost Tracking (COPQ)

**Why P4:** Cost of Poor Quality analysis per ISO 9004 — quantifies quality costs for management review and continuous improvement.

#### C# Models

**`CopqReport` (`forge.core/Models/CopqModels.cs`):**
```csharp
public record CopqReport
{
    public DateOnly PeriodStart { get; init; }
    public DateOnly PeriodEnd { get; init; }
    public decimal InternalFailureCost { get; init; }    // Scrap + rework from production runs
    public decimal ExternalFailureCost { get; init; }    // Customer returns + warranty + concessions
    public decimal AppraisalCost { get; init; }          // Inspection labor + testing + calibration
    public decimal PreventionCost { get; init; }         // Training + SPC + CAPA implementation
    public decimal TotalCopq { get; init; }
    public decimal Revenue { get; init; }                // Same period revenue for ratio
    public decimal CopqAsPercentOfRevenue { get; init; }
    public IReadOnlyList<CopqCategoryDetail> Details { get; init; } = [];
    public IReadOnlyList<CopqTrendPoint> TrendData { get; init; } = [];
    public IReadOnlyList<CopqParetoItem> ParetoByDefect { get; init; } = [];
}

public record CopqCategoryDetail
{
    public string Category { get; init; } = string.Empty;     // "Internal Failure", etc.
    public string SubCategory { get; init; } = string.Empty;  // "Scrap", "Rework", etc.
    public decimal Amount { get; init; }
    public int EventCount { get; init; }
    public decimal PercentOfTotal { get; init; }
}

public record CopqTrendPoint
{
    public DateOnly Period { get; init; }
    public decimal InternalFailure { get; init; }
    public decimal ExternalFailure { get; init; }
    public decimal Appraisal { get; init; }
    public decimal Prevention { get; init; }
    public decimal Total { get; init; }
}

public record CopqParetoItem
{
    public string DefectType { get; init; } = string.Empty;
    public decimal Cost { get; init; }
    public int Occurrences { get; init; }
    public decimal CumulativePercent { get; init; }
}
```

#### Core Interface

**`ICopqService` (`forge.core/Interfaces/ICopqService.cs`):**
```csharp
public interface ICopqService
{
    Task<CopqReport> GenerateReportAsync(DateOnly periodStart, DateOnly periodEnd, CancellationToken ct);
    Task<IReadOnlyList<CopqTrendPoint>> GetTrendAsync(int months, CancellationToken ct);
    Task<IReadOnlyList<CopqParetoItem>> GetParetoByDefectAsync(DateOnly periodStart, DateOnly periodEnd, CancellationToken ct);
}
```

**Data sources:**
- **Internal failure:** NCR (#6) cost fields (`ScrapCost`, `ReworkLaborCost`, `ReworkMaterialCost`), `ProductionRun.ScrapQuantity × Part.StandardCost`
- **External failure:** `CustomerReturn.CostOfReturn`, warranty claim costs
- **Appraisal:** `QcInspection` linked `TimeEntry` labor × rate, calibration expenses tagged to quality
- **Prevention:** Training module costs, CAPA implementation expenses, SPC tooling costs

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetCopqReport` | Query | `Features/Quality/GetCopqReport.cs` | Full COPQ report with all four cost categories |
| `GetCopqTrend` | Query | `Features/Quality/GetCopqTrend.cs` | Monthly trend data for chart |
| `GetCopqPareto` | Query | `Features/Quality/GetCopqPareto.cs` | Pareto analysis by defect type |

#### API Endpoints

```
GET    /api/v1/reports/copq                              — COPQ report (query: startDate, endDate)
GET    /api/v1/reports/copq/trend                        — Monthly trend (query: months)
GET    /api/v1/reports/copq/pareto                       — Pareto by defect type (query: startDate, endDate)
```

#### Angular TypeScript Models

```typescript
export interface CopqReport {
  periodStart: string;
  periodEnd: string;
  internalFailureCost: number;
  externalFailureCost: number;
  appraisalCost: number;
  preventionCost: number;
  totalCopq: number;
  revenue: number;
  copqAsPercentOfRevenue: number;
  details: CopqCategoryDetail[];
  trendData: CopqTrendPoint[];
  paretoByDefect: CopqParetoItem[];
}

export interface CopqCategoryDetail {
  category: string;
  subCategory: string;
  amount: number;
  eventCount: number;
  percentOfTotal: number;
}

export interface CopqTrendPoint {
  period: string;
  internalFailure: number;
  externalFailure: number;
  appraisal: number;
  prevention: number;
  total: number;
}

export interface CopqParetoItem {
  defectType: string;
  cost: number;
  occurrences: number;
  cumulativePercent: number;
}
```

#### Angular Service

**`CopqService` (`features/quality/services/copq.service.ts`):**
```typescript
getReport(startDate: string, endDate: string): Observable<CopqReport>;
getTrend(months: number): Observable<CopqTrendPoint[]>;
getPareto(startDate: string, endDate: string): Observable<CopqParetoItem[]>;
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `CopqDashboardComponent` | `features/quality/pages/copq-dashboard.component.ts` | Full COPQ analysis page. Date range picker at top. 4 KPI chips (Internal/External/Appraisal/Prevention). Donut chart of category mix. Monthly trend line chart. Pareto bar chart by defect. Detail DataTable drill-down. |
| `CopqTrendChartComponent` | `features/quality/components/copq-trend-chart.component.ts` | Stacked area chart (ng2-charts): 4 cost categories over time. Overlay line for COPQ-as-%-of-revenue. |
| `CopqParetoChartComponent` | `features/quality/components/copq-pareto-chart.component.ts` | Combined bar + line chart: bars = cost per defect type (descending), line = cumulative percent. 80% threshold line. |

**Complexity:** Medium — mostly aggregation queries across multiple existing entities. No new data entry — purely analytical/reporting. Charts require ng2-charts integration.

---

### 48. PPAP (Production Part Approval Process)

**Why P4:** Required by automotive OEMs (AIAG standard). Tracks 18-element submission process for new/revised parts.

#### C# Entities

**`PpapSubmission` (`forge.core/Entities/PpapSubmission.cs`):**
```csharp
public class PpapSubmission : BaseAuditableEntity
{
    public string SubmissionNumber { get; set; } = string.Empty; // Auto-generated: PPAP-0001
    public int PartId { get; set; }
    public int CustomerId { get; set; }
    public int PpapLevel { get; set; } = 3;              // 1-5 (determines required elements)
    public PpapStatus Status { get; set; } = PpapStatus.Draft;
    public PpapSubmissionReason Reason { get; set; }     // NewPart, EngineeringChange, Tooling, etc.
    public string? PartRevision { get; set; }
    public DateTimeOffset? SubmittedAt { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
    public DateTimeOffset? DueDate { get; set; }
    public string? CustomerContactName { get; set; }
    public string? CustomerResponseNotes { get; set; }
    public string? InternalNotes { get; set; }
    public int? PswSignedByUserId { get; set; }          // Part Submission Warrant signer
    public DateTimeOffset? PswSignedAt { get; set; }

    // Navigation
    public Part Part { get; set; } = null!;
    public Customer Customer { get; set; } = null!;
    public ApplicationUser? PswSignedByUser { get; set; }
    public ICollection<PpapElement> Elements { get; set; } = [];
}
```

**`PpapElement` (`forge.core/Entities/PpapElement.cs`):**
```csharp
public class PpapElement : BaseEntity
{
    public int SubmissionId { get; set; }
    public int ElementNumber { get; set; }               // 1-18 per AIAG standard
    public string ElementName { get; set; } = string.Empty;
    public PpapElementStatus Status { get; set; } = PpapElementStatus.NotStarted;
    public bool IsRequired { get; set; }                 // Based on PPAP level
    public string? Notes { get; set; }
    public int? AssignedToUserId { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }

    // Navigation
    public PpapSubmission Submission { get; set; } = null!;
    public ApplicationUser? AssignedToUser { get; set; }
    public ICollection<FileAttachment> Attachments { get; set; } = [];
}
```

#### Enums

```csharp
public enum PpapStatus { Draft, InProgress, Submitted, Approved, Rejected, Interim }
public enum PpapElementStatus { NotStarted, InProgress, Complete, NotApplicable }
public enum PpapSubmissionReason { NewPart, EngineeringChange, Tooling, Correction, SupplierChange, InactiveRestart, Other }
```

#### PPAP Level Requirements (Static Reference)

```csharp
// 18 AIAG PPAP Elements — required by level:
// Element                                    L1  L2  L3  L4  L5
// 1. Design Records                          R   S   S   *   R
// 2. Engineering Change Documents            R   S   S   *   R
// 3. Customer Engineering Approval           R   R   S   *   R
// 4. Design FMEA                             R   R   S   *   R
// 5. Process Flow Diagrams                   R   R   S   *   R
// 6. Process FMEA                            R   R   S   *   R
// 7. Control Plan                            R   R   S   *   R
// 8. Measurement System Analysis             R   R   S   *   R
// 9. Dimensional Results                     R   S   S   *   R
// 10. Material / Performance Test Results    R   S   S   *   R
// 11. Initial Process Studies (SPC)          R   R   S   *   R
// 12. Qualified Laboratory Documentation    R   S   S   *   R
// 13. Appearance Approval Report            S   S   S   *   R
// 14. Sample Production Parts               R   S   S   *   R
// 15. Master Sample                         R   R   S   *   R
// 16. Checking Aids                         R   R   S   *   R
// 17. Customer-Specific Requirements        R   R   S   *   R
// 18. Part Submission Warrant (PSW)         R   R   R   R   R
// R=Retain, S=Submit, *=Submit+Retain
```

#### Core Interface

**`IPpapService` (`forge.core/Interfaces/IPpapService.cs`):**
```csharp
public interface IPpapService
{
    Task<PpapSubmission> CreateSubmissionAsync(CreatePpapSubmissionRequestModel request, CancellationToken ct);
    Task<PpapSubmission> UpdateSubmissionAsync(int submissionId, UpdatePpapSubmissionRequestModel request, CancellationToken ct);
    Task UpdateElementStatusAsync(int submissionId, int elementNumber, PpapElementStatus status, string? notes, CancellationToken ct);
    Task SubmitToCustomerAsync(int submissionId, CancellationToken ct);
    Task RecordCustomerResponseAsync(int submissionId, PpapStatus customerDecision, string? notes, CancellationToken ct);
    Task<PpapPswResponseModel> GeneratePswAsync(int submissionId, CancellationToken ct);
    Task<IReadOnlyList<PpapLevelRequirement>> GetLevelRequirementsAsync(int level, CancellationToken ct);
    Task SignPswAsync(int submissionId, int userId, CancellationToken ct);
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetPpapSubmissions` | Query | `Features/Quality/GetPpapSubmissions.cs` | List submissions with filter by part/customer/status |
| `GetPpapSubmission` | Query | `Features/Quality/GetPpapSubmission.cs` | Single submission with all 18 elements + files |
| `CreatePpapSubmission` | Command | `Features/Quality/CreatePpapSubmission.cs` | Create submission, auto-populate elements based on level |
| `UpdatePpapSubmission` | Command | `Features/Quality/UpdatePpapSubmission.cs` | Update submission metadata |
| `UpdatePpapElement` | Command | `Features/Quality/UpdatePpapElement.cs` | Update element status, assign user, add notes |
| `SubmitPpap` | Command | `Features/Quality/SubmitPpap.cs` | Validate all required elements complete, set status to Submitted |
| `RecordPpapResponse` | Command | `Features/Quality/RecordPpapResponse.cs` | Record customer approval/rejection/interim |
| `GeneratePpapPsw` | Query | `Features/Quality/GeneratePpapPsw.cs` | Generate Part Submission Warrant PDF (QuestPDF) |
| `SignPpapPsw` | Command | `Features/Quality/SignPpapPsw.cs` | Sign PSW (digital signature) |

#### API Endpoints

```
GET    /api/v1/ppap-submissions                          — List submissions (filter: partId, customerId, status)
GET    /api/v1/ppap-submissions/{id}                     — Detail with all elements
POST   /api/v1/ppap-submissions                          — Create submission
PUT    /api/v1/ppap-submissions/{id}                     — Update submission
PUT    /api/v1/ppap-submissions/{id}/elements/{number}   — Update element status
POST   /api/v1/ppap-submissions/{id}/submit              — Submit to customer
POST   /api/v1/ppap-submissions/{id}/response            — Record customer response
GET    /api/v1/ppap-submissions/{id}/psw                 — Generate PSW PDF
POST   /api/v1/ppap-submissions/{id}/psw/sign            — Sign PSW
GET    /api/v1/ppap/level-requirements/{level}           — Level requirement matrix
```

#### Angular TypeScript Models

```typescript
export interface PpapSubmission {
  id: number;
  submissionNumber: string;
  partId: number;
  partNumber: string;
  partDescription: string;
  customerId: number;
  customerName: string;
  ppapLevel: number;
  status: PpapStatus;
  reason: PpapSubmissionReason;
  partRevision: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  dueDate: string | null;
  customerContactName: string | null;
  customerResponseNotes: string | null;
  pswSignedByName: string | null;
  pswSignedAt: string | null;
  elements: PpapElement[];
  completedElements: number;
  requiredElements: number;
  createdAt: string;
}

export interface PpapElement {
  elementNumber: number;
  elementName: string;
  status: PpapElementStatus;
  isRequired: boolean;
  notes: string | null;
  assignedToName: string | null;
  completedAt: string | null;
  attachmentCount: number;
}

export type PpapStatus = 'Draft' | 'InProgress' | 'Submitted' | 'Approved' | 'Rejected' | 'Interim';
export type PpapElementStatus = 'NotStarted' | 'InProgress' | 'Complete' | 'NotApplicable';
export type PpapSubmissionReason = 'NewPart' | 'EngineeringChange' | 'Tooling' | 'Correction' | 'SupplierChange' | 'InactiveRestart' | 'Other';
```

#### Angular Service

**`PpapService` (`features/quality/services/ppap.service.ts`):**
```typescript
getSubmissions(params?: { partId?: number; customerId?: number; status?: string }): Observable<PaginatedResponse<PpapSubmission>>;
getSubmission(id: number): Observable<PpapSubmission>;
createSubmission(request: CreatePpapSubmissionRequest): Observable<PpapSubmission>;
updateSubmission(id: number, request: UpdatePpapSubmissionRequest): Observable<PpapSubmission>;
updateElement(submissionId: number, elementNumber: number, status: string, notes?: string): Observable<void>;
submitToCustomer(id: number): Observable<void>;
recordResponse(id: number, decision: string, notes?: string): Observable<void>;
generatePsw(id: number): Observable<Blob>;
signPsw(id: number): Observable<void>;
getLevelRequirements(level: number): Observable<PpapLevelRequirement[]>;
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `PpapListComponent` | `features/quality/pages/ppap-list.component.ts` | DataTable of submissions: part, customer, level, status chip, progress bar (completed/required elements), due date. Filter by status/customer. |
| `PpapDetailDialogComponent` | `features/quality/components/ppap-detail-dialog.component.ts` | Full submission view. Header: part info, customer, level, status. Body: 18-element checklist (expandable rows with file upload zone per element, status dropdown, assignee picker, notes). Footer: Submit/Sign PSW buttons. |
| `PpapCreateDialogComponent` | `features/quality/components/ppap-create-dialog.component.ts` | Create form: part picker, customer picker, level (1-5 with visual requirement matrix preview), reason, revision, due date. |
| `PpapPswPreviewComponent` | `features/quality/components/ppap-psw-preview.component.ts` | PSW form preview matching AIAG standard layout. Digital signature field. Print/download PDF. |
| `PpapElementChecklist` | `features/quality/components/ppap-element-checklist.component.ts` | Reusable 18-row checklist: element name, required indicator, status dropdown, assignee avatar, file count badge, expand for notes + files. Progress bar at top. |

**Complexity:** Medium — mostly status tracking and file management across 18 structured elements. PSW PDF generation requires careful AIAG form layout. Level requirements are static configuration.

---

### 49. FMEA Integration

**Why P4:** Failure Mode and Effects Analysis is a core quality tool in automotive/aerospace. Links risk assessment to control plans and CAPAs.

#### C# Entities

**`Fmea` (`forge.core/Entities/Fmea.cs`):**
```csharp
public class Fmea : BaseAuditableEntity
{
    public string FmeaNumber { get; set; } = string.Empty;  // Auto-generated: FMEA-D-0001 or FMEA-P-0001
    public string Name { get; set; } = string.Empty;
    public FmeaType Type { get; set; }                   // Design or Process
    public int? PartId { get; set; }
    public int? OperationId { get; set; }                // Process FMEA links to routing operation
    public FmeaStatus Status { get; set; } = FmeaStatus.Draft;
    public string? PreparedBy { get; set; }
    public string? Responsibility { get; set; }          // Team / department
    public DateOnly? OriginalDate { get; set; }
    public DateOnly? RevisionDate { get; set; }
    public int RevisionNumber { get; set; } = 1;
    public string? Notes { get; set; }
    public int? PpapSubmissionId { get; set; }           // Link to PPAP element 4 (DFMEA) or 6 (PFMEA)

    // Navigation
    public Part? Part { get; set; }
    public Operation? Operation { get; set; }
    public PpapSubmission? PpapSubmission { get; set; }
    public ICollection<FmeaItem> Items { get; set; } = [];
}
```

**`FmeaItem` (`forge.core/Entities/FmeaItem.cs`):**
```csharp
public class FmeaItem : BaseEntity
{
    public int FmeaId { get; set; }
    public int ItemNumber { get; set; }                  // Row order
    public string? ProcessStep { get; set; }             // Process FMEA: operation step
    public string? Function { get; set; }                // Design FMEA: part function
    public string FailureMode { get; set; } = string.Empty;
    public string PotentialEffect { get; set; } = string.Empty;
    public int Severity { get; set; }                    // 1-10
    public string? Classification { get; set; }          // Critical / Significant / blank
    public string? PotentialCause { get; set; }
    public int Occurrence { get; set; }                  // 1-10
    public string? CurrentPreventionControls { get; set; }
    public string? CurrentDetectionControls { get; set; }
    public int Detection { get; set; }                   // 1-10
    // RPN = Severity × Occurrence × Detection (computed, not stored)
    public string? RecommendedAction { get; set; }
    public int? ResponsibleUserId { get; set; }
    public DateOnly? TargetCompletionDate { get; set; }
    public string? ActionTaken { get; set; }
    public DateTimeOffset? ActionCompletedAt { get; set; }
    public int? RevisedSeverity { get; set; }
    public int? RevisedOccurrence { get; set; }
    public int? RevisedDetection { get; set; }
    // Revised RPN computed
    public int? CapaId { get; set; }                     // Link action items to CAPA (#6)

    // Navigation
    public Fmea Fmea { get; set; } = null!;
    public ApplicationUser? ResponsibleUser { get; set; }
}
```

#### Enums

```csharp
public enum FmeaType { Design, Process }
public enum FmeaStatus { Draft, Active, Closed, Superseded }
```

#### Core Interface

**`IFmeaService` (`forge.core/Interfaces/IFmeaService.cs`):**
```csharp
public interface IFmeaService
{
    Task<Fmea> CreateFmeaAsync(CreateFmeaRequestModel request, CancellationToken ct);
    Task<Fmea> UpdateFmeaAsync(int fmeaId, UpdateFmeaRequestModel request, CancellationToken ct);
    Task<FmeaItem> AddItemAsync(int fmeaId, CreateFmeaItemRequestModel request, CancellationToken ct);
    Task<FmeaItem> UpdateItemAsync(int itemId, UpdateFmeaItemRequestModel request, CancellationToken ct);
    Task DeleteItemAsync(int itemId, CancellationToken ct);
    Task<FmeaItem> RecordActionTakenAsync(int itemId, string actionTaken, int? revisedSeverity, int? revisedOccurrence, int? revisedDetection, CancellationToken ct);
    Task<IReadOnlyList<FmeaItem>> GetHighRpnItemsAsync(int rpnThreshold, CancellationToken ct);
    Task<FmeaRiskSummaryResponseModel> GetRiskSummaryAsync(int fmeaId, CancellationToken ct);
    Task LinkToCapaAsync(int itemId, int capaId, CancellationToken ct);
}
```

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetFmeas` | Query | `Features/Quality/GetFmeas.cs` | List FMEAs with filter by type/part/status |
| `GetFmea` | Query | `Features/Quality/GetFmea.cs` | Single FMEA with all items |
| `CreateFmea` | Command | `Features/Quality/CreateFmea.cs` | Create FMEA, link to part/operation |
| `UpdateFmea` | Command | `Features/Quality/UpdateFmea.cs` | Update FMEA metadata |
| `AddFmeaItem` | Command | `Features/Quality/AddFmeaItem.cs` | Add failure mode row |
| `UpdateFmeaItem` | Command | `Features/Quality/UpdateFmeaItem.cs` | Update S/O/D scores, controls, action |
| `DeleteFmeaItem` | Command | `Features/Quality/DeleteFmeaItem.cs` | Remove item |
| `RecordFmeaAction` | Command | `Features/Quality/RecordFmeaAction.cs` | Record action taken + revised S/O/D scores |
| `GetHighRpnItems` | Query | `Features/Quality/GetHighRpnItems.cs` | Cross-FMEA high-RPN dashboard |
| `GetFmeaRiskSummary` | Query | `Features/Quality/GetFmeaRiskSummary.cs` | RPN distribution, heatmap data |
| `LinkFmeaToCapa` | Command | `Features/Quality/LinkFmeaToCapa.cs` | Link FMEA item to CAPA record |

#### API Endpoints

```
GET    /api/v1/fmeas                                     — List FMEAs (filter: type, partId, status)
GET    /api/v1/fmeas/{id}                                — Detail with all items
POST   /api/v1/fmeas                                     — Create FMEA
PUT    /api/v1/fmeas/{id}                                — Update FMEA metadata
POST   /api/v1/fmeas/{id}/items                          — Add item
PUT    /api/v1/fmeas/{id}/items/{itemId}                 — Update item
DELETE /api/v1/fmeas/{id}/items/{itemId}                 — Delete item
POST   /api/v1/fmeas/{id}/items/{itemId}/action          — Record action taken + revised scores
POST   /api/v1/fmeas/{id}/items/{itemId}/link-capa       — Link to CAPA
GET    /api/v1/fmeas/high-rpn                            — High-RPN items across all FMEAs
GET    /api/v1/fmeas/{id}/risk-summary                   — RPN distribution + heatmap
```

#### Angular TypeScript Models

```typescript
export interface Fmea {
  id: number;
  fmeaNumber: string;
  name: string;
  type: 'Design' | 'Process';
  partId: number | null;
  partNumber: string | null;
  operationId: number | null;
  operationName: string | null;
  status: FmeaStatus;
  preparedBy: string | null;
  responsibility: string | null;
  originalDate: string | null;
  revisionDate: string | null;
  revisionNumber: number;
  ppapSubmissionId: number | null;
  items: FmeaItem[];
  highRpnCount: number;
  maxRpn: number;
  createdAt: string;
}

export interface FmeaItem {
  id: number;
  itemNumber: number;
  processStep: string | null;
  function: string | null;
  failureMode: string;
  potentialEffect: string;
  severity: number;
  classification: string | null;
  potentialCause: string | null;
  occurrence: number;
  currentPreventionControls: string | null;
  currentDetectionControls: string | null;
  detection: number;
  rpn: number;                          // Computed: S × O × D
  recommendedAction: string | null;
  responsibleUserName: string | null;
  targetCompletionDate: string | null;
  actionTaken: string | null;
  actionCompletedAt: string | null;
  revisedSeverity: number | null;
  revisedOccurrence: number | null;
  revisedDetection: number | null;
  revisedRpn: number | null;           // Computed: revised S × O × D
  capaId: number | null;
  capaCorrNum: string | null;
}

export type FmeaStatus = 'Draft' | 'Active' | 'Closed' | 'Superseded';

export interface FmeaRiskSummary {
  totalItems: number;
  highRpnItems: number;                // RPN > threshold
  averageRpn: number;
  maxRpn: number;
  rpnDistribution: { range: string; count: number }[];
  heatmapData: { severity: number; occurrence: number; detection: number; count: number }[];
}
```

#### Angular Service

**`FmeaService` (`features/quality/services/fmea.service.ts`):**
```typescript
getFmeas(params?: { type?: string; partId?: number; status?: string }): Observable<PaginatedResponse<Fmea>>;
getFmea(id: number): Observable<Fmea>;
createFmea(request: CreateFmeaRequest): Observable<Fmea>;
updateFmea(id: number, request: UpdateFmeaRequest): Observable<Fmea>;
addItem(fmeaId: number, request: CreateFmeaItemRequest): Observable<FmeaItem>;
updateItem(fmeaId: number, itemId: number, request: UpdateFmeaItemRequest): Observable<FmeaItem>;
deleteItem(fmeaId: number, itemId: number): Observable<void>;
recordAction(fmeaId: number, itemId: number, request: RecordFmeaActionRequest): Observable<FmeaItem>;
linkToCapa(fmeaId: number, itemId: number, capaId: number): Observable<void>;
getHighRpnItems(threshold?: number): Observable<FmeaItem[]>;
getRiskSummary(fmeaId: number): Observable<FmeaRiskSummary>;
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `FmeaListComponent` | `features/quality/pages/fmea-list.component.ts` | DataTable: FMEA number, name, type chip, part, status, max RPN (color-coded), item count. Filter by type/status. |
| `FmeaDetailComponent` | `features/quality/pages/fmea-detail.component.ts` | Full FMEA worksheet view matching AIAG form layout. Two tabs: Worksheet (grid of items) + Risk Analysis (heatmap + distribution). |
| `FmeaWorksheetComponent` | `features/quality/components/fmea-worksheet.component.ts` | Spreadsheet-like DataTable: columns for step/function, failure mode, effect, S, classification, cause, O, prevention controls, detection controls, D, RPN (auto-calc, color-coded), recommended action, responsible, target date. Inline editing. Add row button. RPN cells: green (<100), yellow (100-200), red (>200). |
| `FmeaItemDialogComponent` | `features/quality/components/fmea-item-dialog.component.ts` | Add/edit single item with full form: all fields laid out matching AIAG worksheet structure. S/O/D dropdowns (1-10 with AIAG criteria descriptions). Live RPN preview. |
| `FmeaActionDialogComponent` | `features/quality/components/fmea-action-dialog.component.ts` | Record action taken: action text, revised S/O/D, completion date. Shows original vs revised RPN comparison. Optional CAPA link. |
| `FmeaRiskHeatmapComponent` | `features/quality/components/fmea-risk-heatmap.component.ts` | 10×10 severity vs occurrence heatmap (ng2-charts or custom SVG). Cell color intensity by count. Click cell to filter items. |
| `HighRpnDashboardComponent` | `features/quality/components/high-rpn-dashboard.component.ts` | Cross-FMEA dashboard: all items above RPN threshold. Sorted by RPN descending. Shows FMEA name, part, action status. Urgency indicators. |
| `FmeaCreateDialogComponent` | `features/quality/components/fmea-create-dialog.component.ts` | Create form: name, type (Design/Process), part picker, operation picker (Process only), responsible team. |

**Complexity:** Medium-High — the worksheet UI requires inline editing with auto-calculated RPN, which is a specialized grid component. Risk heatmap is a custom visualization. Integration with CAPA system adds cross-entity linking.

---

### 50. Predictive Maintenance (ML)

**Why P4:** Uses machine learning on IoT sensor data to predict equipment failures before they occur. Requires #36 (IoT/OPC-UA) and #9 (OEE) as prerequisites.

#### C# Entities

**`MaintenancePrediction` (`forge.core/Entities/MaintenancePrediction.cs`):**
```csharp
public class MaintenancePrediction : BaseEntity
{
    public int WorkCenterId { get; set; }
    public string PredictionType { get; set; } = string.Empty; // "BearingFailure", "ToolWear", "MotorOverheat"
    public decimal ConfidencePercent { get; set; }
    public DateTimeOffset PredictedFailureDate { get; set; }
    public decimal? RemainingUsefulLifeHours { get; set; }
    public string ModelId { get; set; } = string.Empty;  // ML model identifier
    public string ModelVersion { get; set; } = string.Empty;
    public string InputFeaturesJson { get; set; } = "{}"; // Features used: { "vibration_rms": 2.3, "temperature_avg": 85.2 }
    public MaintenancePredictionStatus Status { get; set; } = MaintenancePredictionStatus.Predicted;
    public MaintenancePredictionSeverity Severity { get; set; }
    public DateTimeOffset PredictedAt { get; set; }
    public DateTimeOffset? AcknowledgedAt { get; set; }
    public int? AcknowledgedByUserId { get; set; }
    public int? PreventiveMaintenanceJobId { get; set; } // Auto-created maintenance job
    public string? ResolutionNotes { get; set; }
    public bool WasAccurate { get; set; }                // Post-event validation

    // Navigation
    public WorkCenter WorkCenter { get; set; } = null!;
    public ApplicationUser? AcknowledgedByUser { get; set; }
    public Job? PreventiveMaintenanceJob { get; set; }
}
```

**`MlModel` (`forge.core/Entities/MlModel.cs`):**
```csharp
public class MlModel : BaseEntity
{
    public string ModelId { get; set; } = string.Empty;  // "bearing_failure_rf_v3"
    public string Name { get; set; } = string.Empty;     // "Bearing Failure Predictor"
    public string ModelType { get; set; } = string.Empty; // "RandomForest", "LSTM", "IsolationForest"
    public string Version { get; set; } = string.Empty;
    public MlModelStatus Status { get; set; }
    public DateTimeOffset TrainedAt { get; set; }
    public int TrainingSampleCount { get; set; }
    public decimal? Accuracy { get; set; }               // Test set accuracy
    public decimal? Precision { get; set; }
    public decimal? Recall { get; set; }
    public decimal? F1Score { get; set; }
    public string? HyperparametersJson { get; set; }     // Training hyperparameters
    public string? FeatureListJson { get; set; }         // Ordered feature names
    public string? ModelArtifactPath { get; set; }       // Path to serialized model file
    public int? WorkCenterId { get; set; }               // null = generic, set = machine-specific
    public string PredictionType { get; set; } = string.Empty;

    // Navigation
    public WorkCenter? WorkCenter { get; set; }
}
```

**`PredictionFeedback` (`forge.core/Entities/PredictionFeedback.cs`):**
```csharp
public class PredictionFeedback : BaseEntity
{
    public int PredictionId { get; set; }
    public bool ActualFailureOccurred { get; set; }
    public DateTimeOffset? ActualFailureDate { get; set; }
    public decimal? PredictionErrorHours { get; set; }   // |Predicted - Actual| in hours
    public string? Notes { get; set; }
    public int? RecordedByUserId { get; set; }

    // Navigation
    public MaintenancePrediction Prediction { get; set; } = null!;
    public ApplicationUser? RecordedByUser { get; set; }
}
```

#### Enums

```csharp
public enum MaintenancePredictionStatus { Predicted, Acknowledged, MaintenanceScheduled, Resolved, FalsePositive, Expired }
public enum MaintenancePredictionSeverity { Low, Medium, High, Critical }
public enum MlModelStatus { Training, Active, Inactive, Failed }
```

#### Core Interface

**`IPredictiveMaintenanceService` (`forge.core/Interfaces/IPredictiveMaintenanceService.cs`):**
```csharp
public interface IPredictiveMaintenanceService
{
    Task<IReadOnlyList<MaintenancePrediction>> GetActivePredictionsAsync(int? workCenterId, CancellationToken ct);
    Task<MaintenancePrediction> GetPredictionAsync(int predictionId, CancellationToken ct);
    Task AcknowledgePredictionAsync(int predictionId, int userId, CancellationToken ct);
    Task ScheduleMaintenanceAsync(int predictionId, CancellationToken ct); // Creates maintenance Job
    Task ResolvePredictionAsync(int predictionId, string notes, CancellationToken ct);
    Task MarkFalsePositiveAsync(int predictionId, string notes, CancellationToken ct);
    Task RecordFeedbackAsync(int predictionId, PredictionFeedback feedback, CancellationToken ct);
    Task<IReadOnlyList<MlModel>> GetModelsAsync(CancellationToken ct);
    Task<MlModelPerformanceResponseModel> GetModelPerformanceAsync(string modelId, CancellationToken ct);
    Task TriggerPredictionRunAsync(int workCenterId, CancellationToken ct);
    Task<PredictiveMaintenanceDashboardResponseModel> GetDashboardAsync(CancellationToken ct);
}
```

#### Response Models

```csharp
public record MlModelPerformanceResponseModel
{
    public string ModelId { get; init; } = string.Empty;
    public decimal Accuracy { get; init; }
    public decimal Precision { get; init; }
    public decimal Recall { get; init; }
    public decimal F1Score { get; init; }
    public int TotalPredictions { get; init; }
    public int TruePredictions { get; init; }
    public int FalsePredictions { get; init; }
    public decimal AverageLeadTimeHours { get; init; }   // How far in advance predictions are made
    public IReadOnlyList<PredictionAccuracyTrendPoint> AccuracyTrend { get; init; } = [];
}

public record PredictiveMaintenanceDashboardResponseModel
{
    public int ActivePredictions { get; init; }
    public int CriticalPredictions { get; init; }
    public int PendingAcknowledgment { get; init; }
    public int MaintenanceScheduled { get; init; }
    public decimal OverallModelAccuracy { get; init; }
    public decimal EstimatedDowntimePreventedHours { get; init; }
    public IReadOnlyList<WorkCenterRiskScore> WorkCenterRisks { get; init; } = [];
    public IReadOnlyList<UpcomingPrediction> UpcomingPredictions { get; init; } = [];
}
```

#### ML Pipeline Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  IoT Data Points │ ──► │  Feature Engine   │ ──► │   ML Models      │
│  (#36 OPC-UA)    │     │  (Python/C#)      │     │  (scikit-learn)  │
│                  │     │                   │     │                  │
│  - Vibration     │     │  - Rolling avg    │     │  - Random Forest │
│  - Temperature   │     │  - Trend slope    │     │  - Isolation     │
│  - Pressure      │     │  - Anomaly score  │     │    Forest        │
│  - Current draw  │     │  - Cycle count    │     │  - LSTM (time    │
│  - Run hours     │     │  - Delta-from-    │     │    series)       │
└──────────────────┘     │    baseline       │     └────────┬─────────┘
                         └──────────────────┘              │
                                                           ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Feedback Loop   │ ◄── │  Forge API  │ ◄── │  Prediction      │
│                  │     │                   │     │  Results         │
│  - Actual vs     │     │  - Store in DB    │     │                  │
│    predicted     │     │  - Create alerts  │     │  - Failure type  │
│  - Retrain       │     │  - Auto-schedule  │     │  - Confidence    │
│    trigger       │     │    maintenance    │     │  - Predicted     │
└──────────────────┘     └──────────────────┘     │    failure date  │
                                                  └──────────────────┘
```

**Deployment:** Python microservice (FastAPI) with REST API, Hangfire calls every 15 minutes. Or ML.NET for in-process inference with ONNX models. Communication via internal HTTP API.

#### MediatR Handlers

| Handler | Type | File | Description |
|---------|------|------|-------------|
| `GetPredictions` | Query | `Features/Maintenance/GetPredictions.cs` | List active predictions with filter by WC, severity, status |
| `GetPrediction` | Query | `Features/Maintenance/GetPrediction.cs` | Single prediction with feature data + model info |
| `AcknowledgePrediction` | Command | `Features/Maintenance/AcknowledgePrediction.cs` | Mark prediction acknowledged |
| `SchedulePreventiveMaintenance` | Command | `Features/Maintenance/SchedulePreventiveMaintenance.cs` | Create maintenance Job from prediction |
| `ResolvePrediction` | Command | `Features/Maintenance/ResolvePrediction.cs` | Mark resolved with notes |
| `MarkFalsePositive` | Command | `Features/Maintenance/MarkFalsePositive.cs` | Mark as false positive (feeds back to model) |
| `RecordPredictionFeedback` | Command | `Features/Maintenance/RecordPredictionFeedback.cs` | Record actual outcome for model improvement |
| `GetMlModels` | Query | `Features/Maintenance/GetMlModels.cs` | List deployed models with performance metrics |
| `GetModelPerformance` | Query | `Features/Maintenance/GetModelPerformance.cs` | Detailed accuracy/precision/recall for a model |
| `GetPredictiveMaintenanceDashboard` | Query | `Features/Maintenance/GetPredictiveMaintenanceDashboard.cs` | Dashboard aggregates |
| `TriggerPredictionRun` | Command | `Features/Maintenance/TriggerPredictionRun.cs` | Manual trigger for specific work center |

#### API Endpoints

```
GET    /api/v1/predictions                               — List predictions (filter: workCenterId, severity, status)
GET    /api/v1/predictions/{id}                          — Prediction detail
POST   /api/v1/predictions/{id}/acknowledge              — Acknowledge prediction
POST   /api/v1/predictions/{id}/schedule-maintenance     — Create maintenance job
POST   /api/v1/predictions/{id}/resolve                  — Resolve prediction
POST   /api/v1/predictions/{id}/false-positive           — Mark false positive
POST   /api/v1/predictions/{id}/feedback                 — Record actual outcome
GET    /api/v1/predictions/dashboard                     — Dashboard aggregates
POST   /api/v1/predictions/run/{workCenterId}            — Trigger prediction run
GET    /api/v1/ml-models                                 — List models
GET    /api/v1/ml-models/{modelId}/performance           — Model performance metrics
```

#### Angular TypeScript Models

```typescript
export interface MaintenancePrediction {
  id: number;
  workCenterId: number;
  workCenterName: string;
  predictionType: string;
  confidencePercent: number;
  predictedFailureDate: string;
  remainingUsefulLifeHours: number | null;
  modelId: string;
  modelVersion: string;
  severity: PredictionSeverity;
  status: PredictionStatus;
  predictedAt: string;
  acknowledgedAt: string | null;
  acknowledgedByName: string | null;
  preventiveMaintenanceJobId: number | null;
  resolutionNotes: string | null;
  wasAccurate: boolean;
  inputFeatures: Record<string, number>;
}

export interface MlModel {
  modelId: string;
  name: string;
  modelType: string;
  version: string;
  status: 'Training' | 'Active' | 'Inactive' | 'Failed';
  trainedAt: string;
  trainingSampleCount: number;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1Score: number | null;
  predictionType: string;
  workCenterName: string | null;
}

export interface PredictiveMaintenanceDashboard {
  activePredictions: number;
  criticalPredictions: number;
  pendingAcknowledgment: number;
  maintenanceScheduled: number;
  overallModelAccuracy: number;
  estimatedDowntimePreventedHours: number;
  workCenterRisks: WorkCenterRiskScore[];
  upcomingPredictions: UpcomingPrediction[];
}

export interface WorkCenterRiskScore {
  workCenterId: number;
  workCenterName: string;
  riskScore: number;          // 0-100 composite
  highestSeverityPrediction: string;
  nextPredictedFailure: string | null;
}

export type PredictionStatus = 'Predicted' | 'Acknowledged' | 'MaintenanceScheduled' | 'Resolved' | 'FalsePositive' | 'Expired';
export type PredictionSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
```

#### Angular Service

**`PredictiveMaintenanceService` (`features/maintenance/services/predictive-maintenance.service.ts`):**
```typescript
getPredictions(params?: { workCenterId?: number; severity?: string; status?: string }): Observable<PaginatedResponse<MaintenancePrediction>>;
getPrediction(id: number): Observable<MaintenancePrediction>;
acknowledgePrediction(id: number): Observable<void>;
scheduleMaintenance(id: number): Observable<Job>;
resolvePrediction(id: number, notes: string): Observable<void>;
markFalsePositive(id: number, notes: string): Observable<void>;
recordFeedback(id: number, feedback: PredictionFeedbackRequest): Observable<void>;
getDashboard(): Observable<PredictiveMaintenanceDashboard>;
triggerPredictionRun(workCenterId: number): Observable<void>;
getModels(): Observable<MlModel[]>;
getModelPerformance(modelId: string): Observable<MlModelPerformance>;
```

#### Angular Components

| Component | File | Description |
|-----------|------|-------------|
| `PredictiveMaintenanceDashboardComponent` | `features/maintenance/pages/predictive-maintenance-dashboard.component.ts` | Main dashboard: KPI chips (active/critical/scheduled/accuracy), work center risk heatmap (grid colored by risk score), upcoming predictions timeline, action queue. |
| `PredictionListComponent` | `features/maintenance/components/prediction-list.component.ts` | DataTable of predictions: work center, type, confidence %, predicted failure date, countdown timer, severity chip, status. Sort by urgency. |
| `PredictionDetailDialogComponent` | `features/maintenance/components/prediction-detail-dialog.component.ts` | Full prediction detail: feature values that triggered the prediction (key-value display), model info, confidence gauge chart. Action buttons: Acknowledge, Schedule Maintenance, Mark False Positive. Linked maintenance job navigation. |
| `WorkCenterRiskMapComponent` | `features/maintenance/components/work-center-risk-map.component.ts` | Visual grid of work centers colored by risk score (green→yellow→red). Click to see predictions for that machine. Real-time update via SignalR. |
| `MlModelListComponent` | `features/maintenance/components/ml-model-list.component.ts` | DataTable of deployed models: name, type, version, accuracy/precision/recall/F1, training samples, status. |
| `ModelPerformanceChartComponent` | `features/maintenance/components/model-performance-chart.component.ts` | Line chart of prediction accuracy over time. Confusion matrix visual. Precision/recall trade-off curve. |
| `PredictionFeedbackDialogComponent` | `features/maintenance/components/prediction-feedback-dialog.component.ts` | Record actual outcome: did failure occur? When? How close was prediction? Notes for model improvement. |
| `PredictiveMaintenanceWidgetComponent` | `features/maintenance/components/predictive-maintenance-widget.component.ts` | Dashboard widget: top 3 predictions by urgency, overall accuracy metric, link to full dashboard. |

**Hangfire jobs:**
- `RunPredictionsJob` — every 15 minutes, calls ML microservice for each active work center with IoT data
- `ExpireStalePredictionsJob` — daily, marks old unacknowledged predictions as Expired
- `ModelRetrainingTriggerJob` — weekly, checks if enough new feedback data exists to trigger retraining

**Complexity:** Very High — requires IoT infrastructure (#36), ML training pipeline (Python microservice or ML.NET), model deployment/versioning, continuous feedback loop. Best implemented as a separate microservice with Python/scikit-learn or ML.NET ONNX runtime. The Forge side is mostly consumption (display predictions, manage responses) which is medium complexity.

---

## Implementation Roadmap Suggestion

| Phase | Items | Weeks (est.) | Result |
|-------|-------|-------------|--------|
| **A** | MRP engine (#1a-1c) | 3-4 | Can call itself "MRP system" |
| **B** | Scheduling (#2a-2b) + Work Centers | 3-4 | Can answer "when will this ship?" |
| **C** | Job Costing (#3) + Op-Level Time (#4) | 1-2 | Can answer "did we make money?" |
| **D** | SPC (#5) + CAPA/NCR (#6) | 2-3 | ISO/regulated environment ready |
| **E** | MFA (#8) + Approval Workflows (#13) | 1-2 | Enterprise security ready |
| **F** | EDI (#7) | 2-3 | Large customer ready |
| **G** | OEE (#9) + UOM (#12) + Subcontract (#10) + Receiving Inspection (#11) | 2-3 | Manufacturing depth |
| **H** | Credit (#14) + Vendor Scorecards (#15) + RFQ (#16) | 1-2 | Procurement maturity |
| **I** | P3 items (17-31) | 4-6 | Polish and depth |
| **J** | P4 items (32-50) | Ongoing | Enterprise features |

**Total to reach FULL across all P0-P2 items: ~15-20 weeks of focused development.**

---

## Summary Counts

| Priority | Items | New Entities | New Endpoints | MediatR Handlers | Angular Components | Est. Weeks |
|----------|-------|-------------|---------------|-----------------|-------------------|------------|
| P0 | 2 (MRP + Scheduling) | 12 | 40 | 39 | 15 | 6-8 |
| P1 | 6 (Costing, Op-Time, SPC, CAPA/NCR, EDI, MFA) | 18 | 55 | 55 | 35 | 8-12 |
| P2 | 8 (OEE, Subcontract, Recv Insp, UOM, Approvals, Credit, Vendor Score, RFQ) | 16 | 45 | 40 | 28 | 5-8 |
| P3 | 15 | 24 | 50 | 35 | 25 | 4-6 |
| P4 | 19 | 38 | 115 | 95 | 72 | 12-18 |
| **Total** | **50 items** | **~108 entities** | **~305 endpoints** | **~264 handlers** | **~175 components** | **~35-50 weeks** |
