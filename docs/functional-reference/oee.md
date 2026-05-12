# OEE (Overall Equipment Effectiveness)

> Functional reference for the OEE feature of Forge.

## Overview

OEE (Overall Equipment Effectiveness) is a planned feature that will measure manufacturing productivity by combining three metrics:

- **Availability** -- percentage of scheduled time the equipment is actually running
- **Performance** -- actual throughput vs. theoretical maximum speed
- **Quality** -- percentage of good parts out of total parts produced

OEE = Availability x Performance x Quality

## Current Status

**Not yet implemented.** There is no OEE controller, no dedicated UI page, and no OEE-specific entities in the database.

### Related Existing Features

The following existing features provide data that will feed OEE calculations once implemented:

| Data Source | Feature | How It Relates |
|-------------|---------|---------------|
| Machine downtime | [Assets](assets.md) | `AssetDowntime` entity tracks Six Big Losses categories (Breakdowns, Setup/Adjustments, Small Stops, Reduced Speed, Startup Rejects, Production Rejects) |
| Production time | [Time Tracking](time-tracking.md) | `TimeEntry` records job-level labor time with operation linking |
| Quality defects | [Quality](quality.md) | `QcInspection` pass/fail results, `NcrReport` non-conformance tracking |
| Production runs | [Quality](quality.md) | `ProductionRun` entity with `PlannedQuantity`, `ActualQuantity`, `DefectQuantity` |
| Lot traceability | [Production Lots](lots.md) | `LotRecord` with quantity tracking |

### Downtime Categories (Already Implemented in Assets)

The Six Big Losses downtime categorization is already tracked via `AssetDowntime.Category`:

| Category | Type | Description |
|----------|------|-------------|
| Breakdown | Availability | Unplanned equipment failure |
| SetupAdjustment | Availability | Changeover and setup time |
| SmallStop | Performance | Brief interruptions (< 5 min) |
| ReducedSpeed | Performance | Running below optimal speed |
| StartupReject | Quality | Defects during startup/warmup |
| ProductionReject | Quality | Defects during steady-state production |

## Planned Implementation

When implemented, OEE will likely include:

- Dashboard widget showing OEE percentage per asset/work center
- Trend charts (daily/weekly/monthly OEE over time)
- Drill-down into Availability, Performance, and Quality components
- Pareto analysis of loss categories
- Comparison across assets or production lines
- Integration with the Reports module for custom OEE reports

## Known Limitations

- No backend controller or API endpoints exist
- No UI page or route
- No OEE-specific entity or calculation engine
- Downtime data collection exists (via Assets) but is not aggregated into OEE metrics
- Production run data exists (via Quality) but lacks cycle time benchmarks for Performance calculation
