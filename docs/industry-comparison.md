# Forge vs. Industry Manufacturing ERP/MES — Detailed Comparison

> Generated 2026-04-11. Compares Forge's implemented features against the combined feature sets of: **Epicor Kinetic**, **SAP S/4HANA (Manufacturing)**, **Oracle Cloud Manufacturing**, **Infor SyteLine (CloudSuite Industrial)**, **Plex (Rockwell)**, **IQMS/DELMIAworks**, **JobBOSS²**, **ProShop ERP**, **Fishbowl Manufacturing**, and **MIE Trak Pro**.
>
> Scope: field-level, component-level, and data-structure-level comparison. Not just feature presence/absence, but depth of implementation.

---

## Table of Contents

1. [Scoring Legend](#scoring-legend)
2. [Executive Summary](#executive-summary)
3. [Job / Work Order Management](#1-job--work-order-management)
4. [Bill of Materials (BOM) & Part Management](#2-bill-of-materials-bom--part-management)
5. [Production Routing & Operations](#3-production-routing--operations)
6. [Production Execution (MES)](#4-production-execution-mes)
7. [Quality Management (QMS)](#5-quality-management-qms)
8. [Inventory & Warehouse Management (WMS)](#6-inventory--warehouse-management-wms)
9. [Material Requirements Planning (MRP/MPS)](#7-material-requirements-planning-mrpmps)
10. [Purchasing & Procurement](#8-purchasing--procurement)
11. [Sales & CRM](#9-sales--crm)
12. [Order Management (Quote-to-Cash)](#10-order-management-quote-to-cash)
13. [Shipping & Logistics](#11-shipping--logistics)
14. [Financial / Accounting](#12-financial--accounting)
15. [Time & Labor](#13-time--labor)
16. [Asset Management / CMMS](#14-asset-management--cmms)
17. [Human Resources / Workforce](#15-human-resources--workforce)
18. [Planning & Scheduling](#16-planning--scheduling)
19. [Reporting & Analytics](#17-reporting--analytics)
20. [Document Management](#18-document-management)
21. [Integration & Interoperability](#19-integration--interoperability)
22. [Real-Time & Communication](#20-real-time--communication)
23. [AI / Machine Learning](#21-ai--machine-learning)
24. [Mobile & Offline](#22-mobile--offline)
25. [Shop Floor / Kiosk](#23-shop-floor--kiosk)
26. [Security & Compliance](#24-security--compliance)
27. [Configuration & Admin](#25-configuration--admin)
28. [Novel / Differentiating Features](#26-novel--differentiating-features)
29. [Critical Gaps Summary](#27-critical-gaps-summary)
30. [Data Model Comparison Table](#28-data-model-comparison-table)

---

## Scoring Legend

| Symbol | Meaning |
|--------|---------|
| **FULL** | Feature parity or exceeds industry standard |
| **STRONG** | Solid implementation, minor gaps vs. top-tier |
| **PARTIAL** | Core concept present but missing depth or sub-features |
| **BASIC** | Minimal / stub implementation |
| **NONE** | Not implemented |
| **NOVEL** | Feature not commonly found in competitors |

---

## Executive Summary

Forge covers an unusually broad surface area for a single-codebase manufacturing platform: 104 entities, 62 controllers, 391 MediatR handlers, 35 Angular feature modules. It spans job-shop manufacturing, CRM, order management, inventory, quality, time tracking, training, chat, AI assistance, and shop-floor kiosks — territory that typically requires 3-5 separate products.

**Strengths vs. industry:**
- Quote-to-cash lifecycle with full Estimate → Quote → Sales Order → Job → Shipment → Invoice → Payment chain
- Self-hosted AI with RAG document search (unique among shop-floor ERPs)
- Real-time SignalR collaboration (kanban, chat, notifications, timers)
- Employee training LMS with quiz engine and learning paths
- Configurable compliance forms with PDF extraction pipeline
- Dynamic report builder with 28 entity sources and 350+ fields
- Offline-first PWA architecture with conflict resolution
- RFID/NFC/barcode tiered authentication for shop floor

**Critical gaps vs. top-tier ERPs:**
- No MRP/MPS engine (net requirements, capacity planning, demand forecasting)
- No SPC (Statistical Process Control) charting
- No finite capacity scheduling / Gantt
- No CAPA/NCR formal workflow
- No EDI (Electronic Data Interchange)
- No OEE (Overall Equipment Effectiveness) calculation
- No CPQ (Configure, Price, Quote) engine
- No multi-plant / multi-currency / multi-language backend
- No general ledger / full double-entry accounting

---

## 1. Job / Work Order Management

### Industry Standard (Epicor, JobBOSS, ProShop)
A work order / job typically includes: job number, part, quantity, revision, routing (sequence of operations), BOM, due date, priority, status, customer PO reference, material costs, labor costs, burden costs, subcontract costs, quoted price, actual vs. estimated variance, operation-level scheduling, split/merge capabilities, rework tracking, ECO (engineering change order) linkage.

### Forge Implementation — **STRONG**

**Job Entity (42 fields):**
- `JobNumber`, `Title`, `Description`, `TrackTypeId`, `CurrentStageId`, `AssigneeId`, `Priority` (enum: Low/Medium/High/Critical), `CustomerId`, `DueDate`, `StartDate`, `CompletedDate`, `IsArchived`, `BoardPosition`, `PartId`, `ParentJobId`, `SalesOrderLineId`, `ExternalId/ExternalRef/Provider` (accounting sync), `IterationCount`, `IterationNotes`, `IsInternal`, `InternalProjectTypeId`, `Disposition` (enum: ShipToCustomer/AddToInventory/CapitalizeAsAsset/Scrap/HoldForReview), `DispositionNotes`, `DispositionAt`, `CustomFieldValues` (JSONB), `CoverPhotoFileId`

**Sub-entities:**
- `JobSubtask` — checklist items with assignee, completion tracking
- `JobActivityLog` — full audit trail per job (field changes, stage moves, comments, @mentions)
- `JobLink` — inter-job relationships (related, blocks/blocked by, parent/child)
- `JobPart` — parts consumed by job (many-to-many with quantity)
- `JobNote` — freeform notes
- `ProductionRun` — per-job production run tracking (target/completed/scrap quantities, setup/run times)
- `StatusEntry` — polymorphic status lifecycle (workflow + holds)

**API Endpoints (40+):** Full CRUD, stage movement, position reordering, bulk operations (move/assign/priority/archive), custom fields, production runs, BOM explosion, child jobs, disposition, handoff-to-production, file attachments, activity log, comments with @mentions.

**What's comparable:**
- Job lifecycle management with configurable stages per track type
- Parent/child job hierarchy (similar to Epicor's job splitting)
- BOM explosion creates child jobs from parent BOM
- Job-to-Sales-Order linkage for fulfillment tracking
- Disposition workflow (ship, inventory, capitalize, scrap, hold)
- Custom fields per track type (like Epicor's UD fields)
- Multi-track-type boards (Production, R&D, Maintenance, custom)

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| Cost tracking per job | Epicor: material/labor/burden/subcontract actual vs. estimated | QB has time entries + expenses linked to jobs but no formal cost rollup or burden rate calculation |
| Operation-level scheduling | ProShop: start/end dates per operation | QB stages are workflow, not scheduled operations |
| Quoted vs. actual variance | JobBOSS: job costing reports | Must be derived from reports — no inline variance |
| Split/merge jobs | Epicor: split quantities across jobs | Parent/child exists but no quantity-based splitting |
| Subcontract operations | Epicor: outside processing with PO linkage | Not implemented |
| Engineering Change Orders (ECO) | SAP: formal ECO workflow | Part revisions exist but no formal ECO process |
| Job templates / recurring jobs | Plex: job templates | `ScheduledTask` can auto-create jobs but no job templates |

---

## 2. Bill of Materials (BOM) & Part Management

### Industry Standard (Epicor, SAP, SyteLine)
Multi-level BOM with revision control, effectivity dates, ECO management, phantom assemblies, BOM costing, where-used analysis, alternate parts, engineering vs. manufacturing BOMs, unit-of-measure conversion.

### Forge Implementation — **STRONG**

**Part Entity (30+ fields):**
- `PartNumber`, `Description`, `Revision`, `Status` (Draft/Prototype/Active/Obsolete), `PartType` (Manufactured/Purchased/Raw/Assembly/Phantom/Tool/Consumable), `Material`, `MoldToolRef`, `ExternalPartNumber`, `ExternalId/ExternalRef/Provider`, `PreferredVendorId`, `MinStockThreshold`, `ReorderPoint`, `ReorderQuantity`, `LeadTimeDays`, `SafetyStockDays`, `CustomFieldValues` (JSONB), `ToolingAssetId`

**BOMEntry Entity (9 fields):**
- `ParentPartId`, `ChildPartId`, `Quantity`, `ReferenceDesignator`, `SortOrder`, `SourceType` (Make/Buy/Stock), `LeadTimeDays`, `Notes`

**Part Revision Entity:**
- `PartId`, `Revision`, `ChangeDescription`, `ChangeReason`, `EffectiveDate`, `IsCurrent`
- Files linked to revisions

**Part Price Entity:**
- `PartId`, `UnitPrice`, `EffectiveFrom`, `EffectiveTo`, `Notes`

**What's comparable:**
- Multi-level BOM with parent/child relationships
- Part revisions with change tracking
- Where-used analysis (UsedInBOM collection)
- Source type classification (Make/Buy/Stock)
- Preferred vendor linkage
- BOM explosion to create child jobs from parent
- Reference designators for component placement
- Reorder point / safety stock / lead time
- Part status lifecycle (Draft → Prototype → Active → Obsolete)
- Tooling asset linkage (mold/die tracking)

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| Effectivity dates on BOM lines | SAP/Epicor: date-effective substitutions | Part revisions exist but BOM lines aren't date-ranged |
| Alternate/substitute parts | SAP: approved alternates per BOM line | Not implemented |
| Phantom assemblies | Epicor: phantom flag on BOM for MRP pass-through | `PartType.Phantom` exists in enum but no MRP logic |
| BOM costing rollup | ProShop: rolled-up material + labor cost | No automated cost rollup |
| Engineering vs. Manufacturing BOM | SAP: E-BOM → M-BOM conversion | Single BOM per part |
| Unit of measure conversion | Epicor: UOM classes with conversions | No UOM entity — quantities are unitless decimals |
| Configurable BOM | CPQ systems: option-driven BOM generation | Not implemented |
| ECO workflow | Epicor: formal Engineering Change Order | PartRevision captures changes but no approval workflow |

---

## 3. Production Routing & Operations

### Industry Standard (Epicor, ProShop, Plex)
Operation sequence with work centers, setup/run times, tooling requirements, labor/machine rates, overlap/concurrent operations, subcontracting, operation-level scheduling, SPC integration, scrap factors.

### Forge Implementation — **PARTIAL**

**Operation Entity (12 fields):**
- `PartId`, `StepNumber`, `Title`, `Instructions`, `WorkCenterId` (FK to Asset), `EstimatedMinutes`, `IsQcCheckpoint`, `QcCriteria`, `ReferencedOperationId`

**OperationMaterial Entity:**
- `OperationId`, `BomEntryId`, `Quantity`, `Notes` — links BOM materials to specific operations

**What's comparable:**
- Sequential operations per part (routing)
- Work center assignment (via Asset entity)
- Setup/run time estimates
- QC checkpoint designation per operation
- Material consumption per operation step
- Operation referencing (reusable operations)

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| Separate setup vs. run time | Epicor: distinct setup_time + run_time_each + run_time_lot | Single `EstimatedMinutes` field |
| Machine/labor rates | ProShop: $/hr per work center | No rate fields — cost calculated from time entries |
| Overlap/concurrent operations | SAP: operation overlap percentage | Sequential only |
| Subcontract operations | Epicor: outside processing linked to PO | Not implemented |
| Scrap factor per operation | Plex: expected yield loss per step | Not on Operation entity |
| Operation scheduling | Epicor: finite scheduling per operation | No scheduling engine |
| Tooling requirements | ProShop: tools required per operation | Work center covers equipment but not specific tooling |

---

## 4. Production Execution (MES)

### Industry Standard (Plex, IQMS/DELMIAworks, Epicor Advanced MES)
Real-time shop floor data collection, machine integration (OPC-UA), automatic cycle counting, real-time dashboards, operator instructions at workstation, downtime tracking, OEE calculation, pack-out stations, serialization, label printing.

### Forge Implementation — **PARTIAL**

**ProductionRun Entity (14 fields):**
- `JobId`, `PartId`, `OperatorId`, `RunNumber`, `TargetQuantity`, `CompletedQuantity`, `ScrapQuantity`, `Status` (enum), `StartedAt`, `CompletedAt`, `Notes`, `SetupTimeMinutes`, `RunTimeMinutes`

**DowntimeLog Entity (10 fields):**
- `AssetId`, `ReportedById`, `StartedAt`, `EndedAt`, `Reason`, `Resolution`, `IsPlanned`, `Notes`, `DurationHours` (computed)

**Shop Floor Display:**
- Full-screen kiosk at `/display/shop-floor`
- RFID/NFC/barcode authentication
- Per-worker job grid with timer start/stop
- Mark Complete overlay
- Auto-dismiss timeouts
- Theme/font persistence for kiosk continuity

**Label Printing:**
- `LabelPrintService` with bwip-js barcode generation
- `QrCodeComponent` for QR code display
- Configurable label sizes

**What's comparable:**
- Production run tracking (target/completed/scrap)
- Shop floor kiosk with touch-friendly UI
- Worker identification via RFID/NFC/barcode
- Timer-based labor collection
- Downtime logging
- Barcode/QR label printing

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| OEE calculation | Plex: Availability × Performance × Quality | Downtime + production run data exists but no OEE computation |
| Machine integration (OPC-UA) | IQMS: direct PLC/machine data collection | Manual entry only |
| Automatic cycle counting | Plex: machine cycle counter integration | Manual quantity entry |
| Real-time production dashboards | Epicor: Kinetic MES dashboards | Shop floor shows worker status, not production metrics |
| Operator instructions at station | ProShop: step-by-step with drawings | Operations have `Instructions` field but no kiosk display |
| Serialization | Plex: serial number tracking per unit | Lot tracking exists, no serialization |
| Pack-out / packaging stations | IQMS: pack-out with label printing | Not implemented |
| Genealogy / traceability tree | Plex: full component-to-finished-good tree | Lot traceability exists but limited to lot→part, not component genealogy |
| SPC data collection | Plex: measurement data at operation | QC inspection results exist but no SPC charting |

---

## 5. Quality Management (QMS)

### Industry Standard (Plex, IQMS, ProShop)
Inspection plans, SPC (X-bar/R charts, Cpk/Ppk), CAPA (Corrective and Preventive Action), NCR (Non-Conformance Reports), receiving inspection, in-process inspection, final inspection, gage management, supplier quality, document control, 8D reports, PPAP, FMEA integration.

### Forge Implementation — **PARTIAL**

**QcChecklistTemplate Entity:**
- `Name`, `Description`, `PartId`, `IsActive`
- `QcChecklistItem`: `Description`, `Specification`, `SortOrder`, `IsRequired`

**QcInspection Entity (11 fields):**
- `JobId`, `ProductionRunId`, `TemplateId`, `InspectorId`, `LotNumber`, `Status`, `Notes`, `CompletedAt`
- `QcInspectionResult`: `Description`, `Passed` (bool), `MeasuredValue`, `Notes`

**LotRecord Entity (11 fields):**
- `LotNumber`, `PartId`, `JobId`, `ProductionRunId`, `PurchaseOrderLineId`, `Quantity`, `ExpirationDate`, `SupplierLotNumber`, `Notes`

**CustomerReturn Entity (13 fields):**
- `ReturnNumber`, `CustomerId`, `OriginalJobId`, `ReworkJobId`, `Reason`, `Status`, `ReturnDate`, `InspectedById`, `InspectedAt`, `InspectionNotes`

**What's comparable:**
- Configurable QC checklist templates per part
- Inspection execution with pass/fail results per checklist item
- Measured value recording
- Lot tracking and traceability
- Customer returns with inspection workflow
- Auto-creation of rework jobs from returns

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| SPC charting | Plex: X-bar, R, Cpk, Ppk | `MeasuredValue` is string, no numeric analysis or control charts |
| CAPA workflow | ISO 13485: formal corrective/preventive action process | Not implemented |
| NCR (Non-Conformance Report) | ProShop: formal NCR with disposition workflow | Customer returns cover external; no internal NCR |
| Receiving inspection | Epicor: inspect incoming materials | Receiving records exist but no formal inspection step |
| Gage management | Plex: gage calibration tracking | Not implemented |
| Supplier quality scoring | SyteLine: vendor quality metrics | Not implemented |
| PPAP / FMEA | Automotive: formal submission packages | Not implemented |
| 8D reports | Automotive: structured problem-solving | Not implemented |
| Specification limits (USL/LSL) | SPC systems: upper/lower spec limits per dimension | `Specification` is freetext, not structured |
| Inspection sampling plans | ANSI Z1.4/AQL: sample size tables | Not implemented |

---

## 6. Inventory & Warehouse Management (WMS)

### Industry Standard (Epicor, SAP, Fishbowl)
Multi-warehouse, zone/aisle/rack/bin hierarchy, lot/serial tracking, FIFO/LIFO/FEFO, cycle counting, physical inventory, ABC classification, consignment inventory, inter-warehouse transfers, reservation/allocation, pick/pack/ship, wave planning, put-away rules.

### Forge Implementation — **STRONG**

**StorageLocation Entity (10 fields):**
- `Name`, `LocationType` (Warehouse/Zone/Aisle/Rack/Shelf/Bin), `ParentId` (self-referencing hierarchy), `Barcode`, `Description`, `SortOrder`, `IsActive`

**BinContent Entity (13 fields):**
- `LocationId`, `EntityType`, `EntityId`, `Quantity`, `LotNumber`, `JobId`, `Status` (Available/Reserved/Quarantine/InTransit), `PlacedBy`, `PlacedAt`, `RemovedAt`, `RemovedBy`, `Notes`, `ReservedQuantity`

**BinMovement Entity (9 fields):**
- `EntityType`, `EntityId`, `Quantity`, `LotNumber`, `FromLocationId`, `ToLocationId`, `MovedBy`, `MovedAt`, `Reason` (enum)

**Reservation Entity:**
- `PartId`, `BinContentId`, `JobId`, `SalesOrderLineId`, `Quantity`, `Notes`

**CycleCount + CycleCountLine:**
- `LocationId`, `CountedById`, `CountedAt`, `Status`, `Notes`
- Per-line: `BinContentId`, `EntityType`, `EntityId`, `ExpectedQuantity`, `ActualQuantity`, `Variance` (computed)

**ReorderSuggestion Entity (18 fields):**
- `PartId`, `VendorId`, `CurrentStock`, `AvailableStock`, `BurnRateDailyAvg`, `BurnRateWindowDays`, `DaysOfStockRemaining`, `ProjectedStockoutDate`, `IncomingPoQuantity`, `EarliestPoArrival`, `SuggestedQuantity`, `Status` (enum), `ApprovedByUserId`, `ApprovedAt`, `ResultingPurchaseOrderId`, `DismissedByUserId`, `DismissedAt`, `DismissReason`, `Notes`

**API Endpoints (20+):** Location tree CRUD, bin contents, part inventory, movements, low-stock alerts, receiving, transfer, adjust, cycle counts, reservations.

**What's comparable:**
- Hierarchical location structure (warehouse → zone → aisle → rack → shelf → bin)
- Lot tracking with supplier lot number
- Bin content status (Available/Reserved/Quarantine/InTransit)
- Stock reservations against jobs and sales order lines
- Cycle counting with variance analysis
- Inter-bin transfers with reason tracking
- Low-stock alerts with reorder suggestions
- Burn rate analysis and projected stockout dates
- Barcode-enabled locations
- Receiving from purchase orders into specific bins

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| Serial number tracking | Epicor: per-unit serial tracking | Lot tracking only |
| FIFO/LIFO/FEFO enforcement | SAP: consumption strategy per material | Not implemented — no forced pick order |
| Multi-warehouse/multi-site | SAP: plant/storage location hierarchy | Single-site only |
| ABC classification | Fishbowl: automatic ABC ranking | Not implemented |
| Consignment inventory | SAP: vendor-owned stock at customer site | Not implemented |
| Wave planning | WMS systems: grouped pick waves | Not implemented |
| Put-away rules | SAP: automatic bin suggestion | Not implemented |
| Physical inventory (wall-to-wall) | Epicor: full physical count workflow | Cycle counting per-location only |
| Negative inventory prevention | Epicor: hard block on over-issue | Not enforced at data layer |

---

## 7. Material Requirements Planning (MRP/MPS)

### Industry Standard (Epicor, SAP, SyteLine, Plex)
Net requirements calculation (gross requirements - on-hand - on-order), time-phased demand, planned order generation, MPS (Master Production Schedule), demand forecasting, what-if simulation, pegging (demand-to-supply traceability), exception messages (expedite/defer/cancel).

### Forge Implementation — **BASIC**

**What exists:**
- `ReorderSuggestion` entity with burn rate analysis and projected stockout
- `ReplenishmentService` (backend) for generating reorder suggestions
- Reorder point / safety stock / lead time fields on `Part`
- Low-stock alert dashboard

**What this covers:**
- Simple reorder-point-based replenishment
- Burn rate trending from historical consumption
- PO quantity suggestions based on current stock vs. reorder point

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| Net requirements calculation | MRP core: gross demand - on-hand - scheduled receipts = net | Not implemented |
| Time-phased demand | MRP: bucketed demand over planning horizon | Not implemented |
| Planned order generation | MRP: auto-generate planned POs/jobs | ReorderSuggestion is the closest — single-level, not time-phased |
| MPS (Master Production Schedule) | SAP: top-level production plan driving MRP | Not implemented |
| Demand forecasting | SyteLine: statistical forecasting models | Not implemented |
| Pegging | Epicor: trace demand to supply chain | Not implemented |
| What-if simulation | Epicor: MRP simulation without committing | Not implemented |
| Exception messages | MRP: expedite/defer/cancel alerts | Not implemented |
| Capacity requirements planning | SAP: CRP from MRP output | Not implemented |
| Multi-level BOM explosion for MRP | Epicor: recursive netting through BOM levels | BOM explosion creates child jobs but doesn't net requirements |

> **This is the single largest gap vs. industry standard.** MRP is the cornerstone of manufacturing ERP. Without it, Forge operates as a job-shop tracker with reorder-point inventory, not a planning system. Adding even a basic net-requirements MRP would be transformative.

---

## 8. Purchasing & Procurement

### Industry Standard (Epicor, SAP)
RFQ (Request for Quote), vendor comparison, blanket POs, PO approval workflow, receiving with inspection, three-way match (PO vs. receipt vs. invoice), vendor scorecards, contract management.

### Forge Implementation — **STRONG**

**PurchaseOrder Entity (16 fields):**
- `PONumber`, `VendorId`, `JobId`, `Status` (Draft/Submitted/Acknowledged/PartiallyReceived/Received/Cancelled/Closed), `SubmittedDate`, `AcknowledgedDate`, `ExpectedDeliveryDate`, `ReceivedDate`, `Notes`, `ExternalId/ExternalRef/Provider`

**PurchaseOrderLine (9 fields):**
- `PartId`, `Description`, `OrderedQuantity`, `ReceivedQuantity`, `UnitPrice`, `Notes`, `RemainingQuantity` (computed)

**ReceivingRecord (7 fields):**
- `PurchaseOrderLineId`, `QuantityReceived`, `ReceivedBy`, `StorageLocationId`, `Notes`

**API Endpoints (11):** CRUD, submit, acknowledge, receive, cancel, close, calendar view.

**What's comparable:**
- Full PO lifecycle (Draft → Submitted → Acknowledged → Received → Closed)
- Partial receiving with quantity tracking per line
- Job-linked purchasing
- Vendor management
- PO calendar view
- Receiving into specific storage locations

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| RFQ process | Epicor: Request for Quote to multiple vendors | Not implemented |
| Blanket/standing POs | SAP: framework agreements with releases | Not implemented |
| PO approval workflow | Epicor: multi-level approval routing | No approval — direct creation |
| Three-way match | SAP: PO vs. receipt vs. vendor invoice | Not implemented |
| Vendor scorecards | SyteLine: quality/delivery/cost metrics | Not implemented |
| Contract management | SAP: long-term purchase agreements | Not implemented |
| Receiving inspection integration | Epicor: inspect incoming before acceptance | Direct to stock — no inspection step |

---

## 9. Sales & CRM

### Industry Standard (Epicor, SAP CRM, Salesforce integration)
Opportunity management, contact management, quote management, win/loss analysis, territory management, marketing campaigns, customer portal, credit management, customer communication history.

### Forge Implementation — **STRONG**

**Lead Entity (14 fields):**
- `CompanyName`, `ContactName`, `Email`, `Phone`, `Source`, `Status` (New/Contacted/Quoting/Converted/Lost), `Notes`, `FollowUpDate`, `LostReason`, `ConvertedCustomerId`, `CustomFieldValues`, `CreatedBy`

**Customer Entity (12 fields):**
- `Name`, `CompanyName`, `Email`, `Phone`, `IsActive`, `ExternalId/ExternalRef/Provider`
- Collections: Contacts, Jobs, Addresses, SalesOrders, Quotes, Invoices, Payments, PriceLists, RecurringOrders

**Contact Entity (9 fields):**
- `FirstName`, `LastName`, `Email`, `Phone`, `Role`, `IsPrimary`

**ContactInteraction Entity (8 fields):**
- `ContactId`, `UserId`, `Type` (Call/Email/Meeting/Note), `Subject`, `Body`, `InteractionDate`, `DurationMinutes`

**Customer Detail Page — 9 tabs:**
Overview, Contacts, Addresses, Estimates, Quotes, Orders, Jobs, Invoices, Activity

**What's comparable:**
- Lead pipeline (New → Contacted → Quoting → Converted → Lost)
- Lead-to-Customer conversion (auto-creates customer + optional job)
- Contact management with multiple contacts per customer
- Contact interaction tracking (calls, emails, meetings, notes)
- Customer 360 view with all related entities
- Lost reason capture for analysis
- Activity timeline per customer
- Customer statements (PDF generation)

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| Opportunity management | Salesforce: weighted pipeline with probabilities | Leads have no dollar value or probability |
| Territory management | SAP: geographic/industry territory assignment | Not implemented |
| Marketing campaigns | CRM: campaign tracking and ROI | Not implemented |
| Customer portal | Epicor: self-service order status, invoices | Not implemented |
| Credit management | SAP: credit limits, credit checks on orders | Not implemented |
| Win/loss analysis | CRM: conversion rate analytics | Reports show lead pipeline but no win/loss drill-down |

---

## 10. Order Management (Quote-to-Cash)

### Industry Standard (Epicor, SAP)
CPQ (Configure, Price, Quote), multi-currency pricing, quantity breaks, trade agreements, blanket orders, drop-shipping, back-to-back orders, ATP (Available-to-Promise), credit holds.

### Forge Implementation — **FULL**

**Full quote-to-cash chain implemented:**

1. **Estimate** → 2. **Quote** → 3. **Sales Order** → 4. **Job(s)** → 5. **Shipment(s)** → 6. **Invoice(s)** → 7. **Payment(s)**

**Quote Entity (22+ fields):** Dual-purpose (Estimate vs. Quote via `QuoteType` discriminator). Full line items, tax rate, totals, shipping address, sent/accepted dates, source estimate linkage.

**SalesOrder Entity (20+ fields):** Order number, customer, customer PO, status lifecycle (Draft → Confirmed → InProduction → PartiallyShipped → Shipped → Closed), credit terms, tax, shipping/billing addresses, auto-generated jobs per line.

**PriceList + PriceListEntry:** Customer-specific pricing with quantity breaks (`MinQuantity`), effective date ranges, default price list.

**RecurringOrder + RecurringOrderLine:** Template orders with interval-based auto-generation (Hangfire job).

**What's comparable:**
- Estimate → Quote → Sales Order → Job → Shipment → Invoice → Payment lifecycle
- Multi-line orders with per-line fulfillment tracking
- Partial shipments per line
- Per-shipment invoicing or batched
- Customer-specific price lists with quantity breaks
- Recurring order templates with auto-generation
- Credit terms (configurable options)
- Tax rate per order/customer
- Customer PO reference tracking

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| CPQ engine | Epicor: configure product options → auto-BOM/routing | Not implemented |
| Multi-currency | SAP: transaction currency, exchange rates | Single currency only |
| ATP (Available-to-Promise) | Epicor: delivery date based on inventory + production | Not implemented |
| Drop-shipping | SAP: ship directly from vendor to customer | Not implemented |
| Back-to-back orders | SAP: auto-PO from SO line | Not implemented |
| Credit holds | SAP: automatic order hold on credit limit | Not implemented |
| Blanket sales orders | Epicor: long-term agreements with releases | Not implemented |
| Trade agreements | SAP: negotiated pricing per customer/material group | Price lists cover per-part pricing but no material group agreements |

---

## 11. Shipping & Logistics

### Industry Standard (SAP, Epicor, ShipStation)
Multi-carrier rate shopping, label generation, tracking, packing slip, bill of lading, freight class, customs/export documentation, drop-ship, consolidation, route optimization.

### Forge Implementation — **STRONG**

**Shipment Entity (15 fields):**
- `ShipmentNumber`, `SalesOrderId`, `ShippingAddressId`, `Status` (Pending/Shipped/Delivered), `Carrier`, `TrackingNumber`, `ShippedDate`, `DeliveredDate`, `ShippingCost`, `Weight`, `Notes`

**ShipmentLine (7 fields), ShipmentPackage (9 fields):**
- Per-line: `SalesOrderLineId`, `PartId`, `Quantity`, `Notes`
- Per-package: `TrackingNumber`, `Carrier`, `Weight`, `Length/Width/Height`, `Status`

**IShippingService Interface:**
- `GetRatesAsync()` — multi-carrier rate comparison
- `CreateLabelAsync()` — shipping label generation
- `TrackShipmentAsync()` — tracking info retrieval
- `ValidateAddressAsync()` — address validation

**IAddressValidationService:**
- USPS Web Tools integration for address standardization
- DPV (Delivery Point Validation) confirmation

**API Endpoints (15):** CRUD, ship, deliver, packing slip PDF, rates, label, tracking, address validation, packages CRUD.

**What's comparable:**
- Multi-carrier rate shopping (via IShippingService)
- Shipping label generation
- Package-level tracking
- Packing slip PDF generation
- Address validation (USPS)
- Multi-package shipments with per-package dimensions/weight

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| Bill of Lading | SAP: BOL document generation | Not implemented |
| Freight class / NMFC | LTL shipping: freight classification | Not on shipment entity |
| Customs / export docs | SAP: commercial invoice, SED | Not implemented |
| Drop-ship | Epicor: vendor-direct-to-customer | Not implemented |
| Route optimization | WMS: delivery route planning | Not implemented |
| Carrier API integration (live) | ShipStation: 30+ carrier APIs | Interface ready, mock implemented, live carrier APIs not built |

---

## 12. Financial / Accounting

### Industry Standard (SAP, Epicor, QuickBooks)
General ledger, accounts receivable/payable, bank reconciliation, fixed asset depreciation, budgeting, financial statements (P&L, balance sheet, cash flow), multi-currency, tax filing, audit trail.

### Forge Implementation — **PARTIAL** (by design)

**Accounting Boundary Architecture:**
Forge explicitly avoids duplicating a full accounting system. It operates in two modes:

**Standalone Mode** (no accounting provider):
- `Invoice` (20+ fields), `InvoiceLine`, `Payment`, `PaymentApplication` — full local CRUD
- AR aging reports, revenue reports, simple P&L
- Sales tax rates per state/jurisdiction
- Customer statements (PDF)
- Credit terms management

**Integrated Mode** (QuickBooks, Xero, FreshBooks, Sage, Zoho):
- Financial entities become read-only views of accounting system data
- Sync queue (`SyncQueueEntry`) for reliable data exchange
- Token encryption via Data Protection API
- Multiple provider support via `IAccountingService` interface

**What's comparable:**
- Invoicing with line items, tax, totals
- Payment recording and application to invoices
- AR aging
- Basic P&L reporting
- Sales tax management
- Multi-provider accounting integration

**What's intentionally excluded (by design):**
| Feature | Reason |
|---------|--------|
| General ledger | Accounting system responsibility |
| Bank reconciliation | Accounting system responsibility |
| AP (Accounts Payable) | Accounting system responsibility |
| Fixed asset depreciation | Accounting system responsibility |
| Budgeting | Accounting system responsibility |
| Balance sheet / cash flow | Accounting system responsibility |
| Multi-currency | Accounting system responsibility |
| Tax filing | Accounting system responsibility |

> This is a deliberate architectural decision, not a gap. The accounting boundary is well-documented and correctly scoped.

---

## 13. Time & Labor

### Industry Standard (Epicor, ProShop)
Clock in/out, job-level time tracking, operation-level time tracking, overtime calculation, shift management, attendance policies, labor cost allocation, approval workflows.

### Forge Implementation — **STRONG**

**TimeEntry Entity (14 fields):**
- `JobId`, `UserId`, `Date`, `DurationMinutes`, `Category`, `Notes`, `TimerStart`, `TimerStop`, `IsManual`, `IsLocked`, `AccountingTimeActivityId`

**ClockEvent Entity (7 fields):**
- `UserId`, `EventType` (ClockIn/ClockOut/BreakStart/BreakEnd/LunchStart/LunchEnd), `EventTypeCode`, `Reason`, `ScanMethod`, `Timestamp`, `Source`

**TimeCorrectionLog Entity (12 fields):**
- Full original value snapshot (jobId, date, duration, start/end, category, notes) + corrected-by + reason

**API Endpoints (13):** Entries CRUD, timer start/stop, clock events, pay period management, corrections.

**SignalR real-time:** `TimerHub` for live timer start/stop notifications.

**What's comparable:**
- Clock in/out with multiple event types (break, lunch)
- Job-level time tracking with timer and manual entry
- Time correction with audit trail (original vs. corrected values)
- Pay period management with lock
- RFID/NFC/barcode clock-in at kiosk
- Real-time timer synchronization via SignalR
- Accounting sync (time activities to QuickBooks)

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| Operation-level time tracking | Epicor: clock onto specific operation within a job | Time is at job level only |
| Overtime calculation | ADP: weekly/daily OT rules, double-time | Not implemented |
| Shift management | Epicor: shift definitions, shift differentials | Not implemented |
| Attendance policies | Kronos: point systems, absence tracking | Not implemented |
| Labor cost allocation | ProShop: direct/indirect/overhead rates | No rate application to time entries |
| Approval workflow | ProShop: supervisor time approval | No approval — corrections only |
| Geofencing | Mobile: clock-in only at work location | Not implemented |

---

## 14. Asset Management / CMMS

### Industry Standard (SAP PM, Fiix, UpKeep)
Preventive/predictive maintenance, work order generation, spare parts inventory, asset lifecycle (acquisition → depreciation → disposal), failure analysis (FMEA), condition monitoring, calibration management.

### Forge Implementation — **STRONG**

**Asset Entity (18 fields):**
- `Name`, `AssetType` (Machine/Tool/Vehicle/Computer/Fixture/Mold/Die/Gage/Other), `Location`, `Manufacturer`, `Model`, `SerialNumber`, `Status` (Active/InMaintenance/Decommissioned), `PhotoFileId`, `CurrentHours`, `Notes`, `IsCustomerOwned`, `CavityCount`, `ToolLifeExpectancy`, `CurrentShotCount`, `SourceJobId`, `SourcePartId`

**MaintenanceSchedule Entity (12 fields):**
- `AssetId`, `Title`, `Description`, `IntervalDays`, `IntervalHours`, `LastPerformedAt`, `NextDueAt`, `IsActive`, `MaintenanceJobId`

**MaintenanceLog Entity (7 fields):**
- `MaintenanceScheduleId`, `PerformedById`, `PerformedAt`, `HoursAtService`, `Notes`, `Cost`

**DowntimeLog Entity (10 fields):**
- `AssetId`, `ReportedById`, `StartedAt`, `EndedAt`, `Reason`, `Resolution`, `IsPlanned`, `Notes`

**What's comparable:**
- Asset registry with rich metadata
- Preventive maintenance scheduling (time-based and hour-based intervals)
- Maintenance log history
- Downtime tracking (planned vs. unplanned)
- Auto-creation of maintenance jobs from schedules
- Tooling-specific fields (cavity count, shot count, tool life expectancy)
- Asset-to-part and asset-to-job linkage
- Customer-owned tooling tracking

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| Predictive maintenance | IoT: vibration/temperature trending | Not implemented — scheduled only |
| Failure analysis / FMEA | SAP PM: failure codes, root cause | Downtime has `Reason` text but no structured failure codes |
| Calibration management | Gage R&R: calibration schedules, certificates | Not implemented |
| Spare parts inventory link | CMMS: maintenance BOM with spare parts | Not implemented |
| Condition-based maintenance | IoT: trigger maintenance on sensor threshold | Not implemented |
| Depreciation tracking | SAP: asset accounting with depreciation | Intentionally excluded (accounting boundary) |
| Warranty tracking | CMMS: warranty expiration alerts | Not on entity |
| Asset hierarchy | SAP: functional location → equipment tree | Flat list, no parent/child |

---

## 15. Human Resources / Workforce

### Industry Standard (ADP, BambooHR, SAP HCM)
Employee records, onboarding, benefits enrollment, performance reviews, training management, compliance documents, organizational chart, skills matrix, certification tracking.

### Forge Implementation — **STRONG**

**EmployeeProfile Entity (30+ fields):**
- Full personal info, address, emergency contact, employment info (start date, department, job title, employee number), pay info (hourly rate, salary amount, pay type), compliance tracking dates (W-4, state withholding, I-9, direct deposit, workers comp, handbook)

**Compliance System:**
- `ComplianceFormTemplate` (20+ fields) — W-4, I-9, state withholding forms
- `ComplianceFormSubmission` — tracking with signature dates, PDF filling
- `FormDefinitionVersion` — versioned form definitions with PDF extraction
- `IdentityDocument` — I-9 identity document uploads with verification
- PDF extraction pipeline (pdf.js + PuppeteerSharp) for automated form field discovery

**Training LMS:**
- `TrainingModule` (15 fields) — Article/Video/Walkthrough/QuickRef/Quiz content types
- `TrainingPath` — structured learning paths with required modules
- `TrainingPathEnrollment` — user enrollment tracking
- `TrainingProgress` — per-module progress with quiz scores, time tracking, walkthrough step tracking
- 46 seeded training modules, 8 learning paths
- Randomized quiz pools, learning style filter
- Admin CRUD panel with per-user detail drill-down
- AI-powered walkthrough generation (Ollama)

**Payroll (Self-Service):**
- `PayStub` + `PayStubDeduction` — pay period, gross/net, deductions by category
- `TaxDocument` — W-2, 1099, state tax forms per year
- Admin upload, employee self-service viewing

**Events:**
- `Event` + `EventAttendee` — Meeting/Training/Safety/Other types
- RSVP tracking (Invited/Accepted/Declined/Attended)
- 15-minute reminder job

**What's comparable:**
- Employee records with full personal/employment details
- Structured onboarding (setup wizard, profile completeness tracking)
- Compliance form management (W-4, I-9 with section 1/2 workflow)
- Training LMS with content types, paths, and progress tracking
- Pay stub self-service
- Event management with RSVP
- Contact interaction tracking

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| Performance reviews | BambooHR: review cycles, goals, competencies | Not implemented |
| Benefits enrollment | ADP: benefit plan selection, open enrollment | Not implemented |
| Skills matrix / certifications | ProShop: skill requirements per operation | Training progress exists but no skills-to-operations mapping |
| Organizational chart | HCM: reporting hierarchy visualization | Team entity exists but no org chart UI |
| PTO / leave management | ADP: accrual rules, request/approval | Not implemented |
| Payroll processing | ADP: actual payroll calculation | Pay stubs are upload-only — no processing |

---

## 16. Planning & Scheduling

### Industry Standard (Epicor APS, Preactor, PlanetTogether)
Finite capacity scheduling, Gantt charts, what-if scenarios, constraint-based scheduling, resource leveling, priority dispatching, backwards/forward scheduling.

### Forge Implementation — **PARTIAL**

**PlanningCycle Entity (8 fields):**
- `Name`, `StartDate`, `EndDate`, `Goals`, `Status` (Active/Completed), `DurationDays`

**PlanningCycleEntry (7 fields):**
- `PlanningCycleId`, `JobId`, `CommittedAt`, `CompletedAt`, `IsRolledOver`, `SortOrder`

**ScheduledTask Entity (11 fields):**
- `Name`, `Description`, `TrackTypeId`, `InternalProjectTypeId`, `AssigneeId`, `CronExpression`, `IsActive`, `LastRunAt`, `NextRunAt`

**What's comparable:**
- Sprint-style planning cycles (configurable duration)
- Planning Day guided workflow
- Backlog-to-cycle drag-and-drop commitment
- End-of-cycle rollover for incomplete items
- Scheduled task auto-creation (Hangfire + cron)

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| Finite capacity scheduling | APS: schedule against resource capacity | Not implemented |
| Gantt chart | Preactor: visual timeline of operations | Not implemented |
| Backward/forward scheduling | MRP: calculate start date from due date | Not implemented |
| Resource leveling | APS: avoid over-allocation | Not implemented |
| Constraint-based scheduling | APS: tooling, material, labor constraints | Not implemented |
| What-if scenarios | APS: simulation without committing | Not implemented |
| Operation-level scheduling | ProShop: per-operation start/end times | Planning is at job level only |

---

## 17. Reporting & Analytics

### Industry Standard (Epicor BAQ, SAP BW, Power BI integration)
Ad-hoc query builder, KPI dashboards, drill-down, scheduled reports, export (Excel/PDF/CSV), role-based report access, data warehouse, embedded analytics.

### Forge Implementation — **FULL**

**Pre-built Reports (28):** Jobs by stage, overdue jobs, time by user, expense summary, lead pipeline, job completion trend, on-time delivery, average lead time, team workload, customer activity, my work history, my time log, AR aging, revenue, simple P&L, my expense history, quote-to-close, shipping summary, time in stage, employee productivity, inventory levels, maintenance, quality/scrap, cycle review, job margin, my cycle summary, lead-to-sales, R&D report.

**Dynamic Report Builder:**
- `SavedReport` entity with 15 fields
- 28 entity sources, 350+ available fields
- User-selectable columns, filters, grouping, sorting
- Chart types (bar, line, pie, doughnut, polar, radar)
- Save/share reports
- ng2-charts integration for visualization

**Dashboard:**
- 11 widget components (activity, cycle progress, deadlines, EOD prompt, focus mode, getting-started, jobs-by-stage, open orders, team load, today's tasks, mini calendar)
- Configurable layout

**What's comparable:**
- Extensive pre-built reports covering all functional areas
- Dynamic report builder with user-configurable fields/filters/grouping
- Chart visualization with 6 chart types
- Dashboard with configurable widgets
- Report sharing capability
- PDF export for invoices, packing slips, statements, work orders, pay stubs

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| Scheduled report delivery | SAP: email reports on schedule | Not implemented |
| Excel/CSV export from report builder | Power BI: export to any format | PDF only for some; report builder data is screen-only |
| Drill-down from charts | BI tools: click chart element → detail | Not implemented |
| Data warehouse / OLAP | SAP BW: dimensional modeling | Direct queries against operational DB |
| External BI integration | Power BI/Tableau connectors | API exists but no dedicated BI connector |
| Role-based report access | Epicor: reports visible by role | Reports are shared or personal — no role restrictions |

---

## 18. Document Management

### Industry Standard (SAP DMS, SharePoint integration)
Version control, check-in/check-out, approval workflows, document distribution, revision-controlled drawings, ECN (Engineering Change Notice) linkage, watermarking.

### Forge Implementation — **STRONG**

**FileAttachment Entity (14 fields):**
- `FileName`, `ContentType`, `Size`, `BucketName`, `ObjectKey`, `EntityType`, `EntityId`, `UploadedById`, `DocumentType`, `ExpirationDate`, `PartRevisionId`, `RequiredRole`, `Sensitivity`

**Storage:**
- MinIO (S3-compatible) with 3 buckets (job-files, receipts, employee-docs)
- Upload/download/presigned URL support
- Polymorphic attachment (any entity type)

**Part Revisions with Files:**
- Files linked to specific part revisions
- Revision history with change description/reason

**Compliance Documents:**
- PDF extraction pipeline (pdf.js + PuppeteerSharp)
- DocuSeal integration for document signing
- Form definition versioning
- Identity document management with verification

**What's comparable:**
- File storage with rich metadata (type, sensitivity, role-based access, expiration)
- Part revision-linked files (drawings, specs)
- Compliance document management with signing
- Entity-scoped attachments (job, part, asset, expense, etc.)

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| Check-in/check-out | SAP DMS: exclusive document editing lock | Not implemented |
| Approval workflows for documents | DMS: review → approve → release cycle | Not implemented |
| Document distribution / transmittals | Engineering: formal transmittal packages | Not implemented |
| Watermarking | DMS: "CONTROLLED COPY" watermarks | Not implemented |
| ECN linkage | Engineering: change notice → affected documents | Part revisions exist but no formal ECN |
| Full-text document search | SharePoint: search within document content | RAG indexing handles this partially |

---

## 19. Integration & Interoperability

### Industry Standard (SAP, Epicor)
EDI (Electronic Data Interchange), API (REST/SOAP), webhook support, ETL, accounting integration, shipping carrier APIs, e-commerce connectors, IoT/SCADA.

### Forge Implementation — **STRONG**

**Accounting Integration (5 providers):**
- `IAccountingService` — vendor-agnostic interface
- QuickBooks Online (implemented), Xero, FreshBooks, Sage, Zoho (stubs)
- OAuth 2.0 authentication
- Sync queue with retry logic
- Token encryption

**Shipping Integration:**
- `IShippingService` — carrier-agnostic interface
- Mock implementation with rate/label/tracking
- Direct carrier APIs planned (UPS, FedEx, USPS, DHL)

**Address Validation:**
- `IAddressValidationService` — USPS Web Tools integration

**Document Signing:**
- DocuSeal integration for compliance forms

**User Integrations (per-user):**
- `UserIntegration` entity for calendar, messaging, storage, other
- OAuth/API key credential encryption
- Category-based provider resolution

**AI Integration:**
- Ollama self-hosted LLM
- pgvector RAG pipeline

**SSO Integration:**
- Google, Microsoft, generic OIDC via OAuth 2.0

**What's comparable:**
- RESTful API (300+ endpoints) for external integration
- Multi-provider accounting integration with sync queue
- OAuth 2.0 flows for third-party services
- Self-hosted AI without external API dependencies
- WebSocket real-time (SignalR) for external subscriptions
- iCal feed export for calendar integration

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| EDI (X12/EDIFACT) | SAP: 850/855/856/810 document exchange | Not implemented — this is critical for larger manufacturers |
| Webhook support (outbound) | Modern APIs: webhook registration for events | SignalR for internal; no outbound webhooks |
| E-commerce connectors | Epicor: Shopify, WooCommerce, Amazon | Not implemented |
| IoT / SCADA / OPC-UA | Plex: machine data collection | Not implemented |
| ETL / data pipeline | SAP: batch data exchange with external systems | Not implemented |
| ERP-to-ERP migration tools | Industry: data import/export for system transitions | Not implemented |

---

## 20. Real-Time & Communication

### Industry Standard
Most manufacturing ERPs have minimal real-time capabilities. Some (Plex, IQMS) have shop floor dashboards. Email notifications are standard. Real-time chat is rare in manufacturing ERP.

### Forge Implementation — **FULL** / **NOVEL**

**SignalR Hubs (4):**
- `BoardHub` — real-time kanban board sync (job created/moved/updated/positioned)
- `NotificationHub` — push notifications to connected clients
- `TimerHub` — timer start/stop synchronization
- `ChatHub` — real-time messaging

**Chat System:**
- 1:1 direct messages
- Group chat rooms with member management
- File/entity sharing in messages
- Read receipts
- ChatHubService for real-time delivery

**Notification System:**
- In-app notifications with severity (critical/warning/info)
- Real-time push via SignalR
- Email notifications via SMTP
- Notification preferences per user
- Pin/dismiss/filter functionality

**Connection Management:**
- Auto-reconnect with exponential backoff
- Connection state banner (reconnecting/disconnected)
- Multi-tab connection handling

> **This significantly exceeds industry standard.** Most manufacturing ERPs have zero real-time collaboration features. Forge's real-time kanban, chat, and notification system is a genuine differentiator.

---

## 21. AI / Machine Learning

### Industry Standard
Virtually no manufacturing ERP includes built-in AI. Some offer "AI-powered" forecasting as a cloud add-on (SAP AI Core, Oracle AI). None include self-hosted LLM or RAG.

### Forge Implementation — **FULL** / **NOVEL**

**Self-Hosted AI (Ollama):**
- llama3.2:3b model running locally
- No external API calls or data sharing
- Text generation and summarization

**RAG Pipeline:**
- `DocumentEmbedding` entity with pgvector (384-dimensional vectors)
- Document indexing job (Hangfire, 30-minute interval)
- Hybrid search: full-text tsvector + vector similarity
- Context-aware RAG responses grounded in production data

**Configurable AI Assistants:**
- `AiAssistant` entity — HR, Procurement, Sales domain assistants
- Custom system prompts, entity type restrictions, temperature settings
- Starter questions, admin CRUD panel

**AI-Powered Features:**
- Smart search with RAG-enhanced results
- Help chat panel with streaming SSE responses
- AI-generated walkthrough generation for training modules
- Job description drafting assistance

> **This is entirely novel in the manufacturing ERP space.** No competitor offers self-hosted AI with RAG over production data. This is a significant differentiator, especially for companies with data sovereignty requirements.

---

## 22. Mobile & Offline

### Industry Standard (Epicor Kinetic, Plex)
Mobile-responsive web interface or native apps. Some offer offline data capture. Few have dedicated mobile worker views.

### Forge Implementation — **STRONG**

**PWA Architecture:**
- Service worker for app shell caching
- IndexedDB for offline data layer
- Offline action queue with sync-on-reconnect
- Conflict resolution (last-write-wins with dialog for 409s)
- `OfflineBannerComponent` for connection status

**Mobile Feature Module (9 pages):**
- Home, Jobs, Job Detail, Clock, Scan, Hours, Chat, Notifications, Account
- Bottom tab navigation (5 tabs max)
- Touch-optimized UI (44px minimum touch targets)
- Camera capture for receipts/documents
- Barcode scanning (camera-based)

**What's comparable:**
- Progressive Web App installable on mobile
- Offline-capable with background sync
- Dedicated mobile worker views
- Mobile chat
- Mobile time tracking
- Camera integration

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| Native app (App Store) | Epicor: native iOS/Android apps | PWA only — Capacitor wrapper planned but not built |
| Offline form submission queue | Epicor: queue work orders offline | Offline queue exists but not fully wired to all mobile forms |
| Mobile receiving | Epicor: scan-to-receive on mobile | Not yet in mobile module |
| Mobile inventory counts | Plex: mobile cycle counting | Not yet in mobile module |

---

## 23. Shop Floor / Kiosk

### Industry Standard (ProShop, Plex)
Touchscreen workstation, scan-to-start, operation-level time tracking, work instructions display, real-time production data, operator login/logout.

### Forge Implementation — **STRONG**

**Kiosk Features:**
- Full-screen display at `/display/shop-floor`
- RFID/NFC/barcode → PIN tiered authentication
- Per-worker job grid (square cards, status stripes)
- Timer start/stop per job
- Mark Complete overlay
- Auto-dismiss timeouts (PIN: 20s, job-select: 15s)
- Theme/font persistence for kiosk continuity
- `IsShopFloor` filter on TrackType and JobStage

**Time Clock Kiosk:**
- `/display/shop-floor/clock`
- Touch-friendly clock in/out buttons (88px+ targets)
- Break/lunch events
- RFID/NFC badge tap for identification

**Scanner Integration:**
- `ScannerService` for keyboard-wedge barcode/NFC detection
- `BarcodeScanInputComponent` for focused scan input
- Context-aware routing (job QR → job detail, part barcode → part info)

**What's comparable:**
- Dedicated kiosk UI with touch-first design
- Multi-authentication (RFID, NFC, barcode, PIN)
- Worker job grid with status indicators
- Timer management from shop floor
- Scanner integration for job/part identification

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| Work instructions at station | ProShop: step-by-step display with drawings | Operations have instructions but no kiosk display |
| Operation-level tracking | ProShop: clock onto specific operation | Job-level only on shop floor |
| Real-time production metrics | IQMS: OEE, parts/hour, downtime display | Not implemented |
| Andon board / alerts | Lean: visual management displays | Not implemented |
| Multi-station routing | Plex: automatic next-station display | Not implemented |

---

## 24. Security & Compliance

### Industry Standard (SAP, FDA-regulated)
Role-based access control, field-level security, audit trail, electronic signatures (21 CFR Part 11), data encryption, SSO, MFA, SOX compliance, GDPR.

### Forge Implementation — **STRONG**

**Authentication:**
- Tiered: RFID/NFC → barcode → credentials → SSO
- JWT with refresh token rotation
- SSO: Google, Microsoft, generic OIDC
- PIN separate from password (PBKDF2 hashed)
- Admin never sees/sets passwords

**Authorization:**
- 6 roles: Engineer, PM, ProductionWorker, Manager, OfficeManager, Admin
- Additive role model
- `[Authorize]` on all endpoints by default

**Audit:**
- `AuditLogEntry` — user, action, entity, details, IP, user agent
- `ActivityLog` — polymorphic per-entity change history
- `JobActivityLog` — detailed field-level change tracking
- `TimeCorrectionLog` — full original-value snapshot

**Security Headers:**
- CSP (Content Security Policy)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy, Permissions-Policy

**Data Protection:**
- Token encryption (ASP.NET Data Protection API)
- OAuth credential encryption per user
- File sensitivity levels and role-based access
- Rate limiting (100/min per user)

**What's comparable:**
- Comprehensive role-based access control
- Full audit trail with field-level change tracking
- SSO support
- Security headers and rate limiting
- Credential encryption

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| MFA (Multi-Factor Authentication) | NIST: TOTP/SMS second factor | Not implemented (PIN is not MFA) |
| Field-level security | SAP: hide/readonly fields by role | Role-based endpoint access; no field-level granularity |
| Electronic signatures (21 CFR Part 11) | FDA: meaning, intent, reason for signing | DocuSeal signing exists but not Part 11 compliant |
| SOX compliance controls | Epicor: separation of duties, approval matrices | Not formally addressed |
| GDPR data subject access/deletion | EU: right to access, erasure | Soft delete exists but no formal GDPR workflows |
| Data masking / anonymization | Compliance: PII masking in non-production | Not implemented |

---

## 25. Configuration & Admin

### Industry Standard (Epicor, SAP)
System parameters, company setup, multi-company, fiscal calendar, number sequences, workflow configuration, print management, email templates.

### Forge Implementation — **STRONG**

**Reference Data System:**
- Single `reference_data` table for all lookups
- Recursive grouping via `group_id`
- Immutable codes, admin-editable labels
- JSONB metadata per entry
- Admin UI for management

**System Settings:**
- `system_settings` DB table for runtime configuration
- Company profile (name, phone, email, EIN, website)
- Company locations with default

**Terminology System:**
- `TerminologyEntry` — admin-configurable labels for UI elements
- `TerminologyPipe` for template usage
- Rename any entity/status/action label

**User Preferences:**
- `UserPreference` — per-user key-value storage
- Table column preferences (visibility, order, width)
- Theme, sidebar state, dashboard layout

**Brand Customization:**
- Admin-configurable primary/accent colors
- Company logo upload
- Runtime CSS variable override
- Public brand endpoint for kiosk/display

**What's comparable:**
- Comprehensive reference data management
- Admin-configurable terminology
- Brand customization (colors, logo)
- User preference persistence
- Company profile and multi-location
- Track type and stage configuration

**What's missing vs. top-tier:**
| Gap | Industry Standard | Notes |
|-----|-------------------|-------|
| Multi-company / multi-tenant | SAP: company code separation | Single-company only |
| Fiscal calendar | Epicor: configurable fiscal periods | Not implemented |
| Number sequence configuration | SAP: customizable document numbering | Auto-increment with prefix — not configurable |
| Workflow engine | Epicor: configurable approval workflows | Hardcoded workflows only |
| Print management | SAP: printer assignment, print queues | Browser print only |
| Email templates | Epicor: configurable notification templates | Hardcoded email content |
| Feature flags | Modern: progressive rollout of features | Not implemented |

---

## 26. Novel / Differentiating Features

These features are uncommon or absent in competing manufacturing ERP products:

| Feature | Description | Industry Comparison |
|---------|-------------|---------------------|
| **Self-hosted AI with RAG** | Ollama LLM + pgvector RAG pipeline for AI-powered search, help chat, document Q&A — all running locally | No competitor offers self-hosted AI. SAP/Oracle have cloud AI add-ons but require external data sharing |
| **Configurable AI Assistants** | Domain-specific AI assistants (HR, Procurement, Sales) with custom system prompts and entity-scoped context | Not found in any manufacturing ERP |
| **Real-time Kanban with SignalR** | Live board synchronization across users — card moves appear instantly for all viewers | Most ERPs have kanban views but none with real-time WebSocket sync |
| **Built-in Team Chat** | 1:1 and group messaging with file/entity sharing, integrated into the manufacturing platform | Typically requires separate tool (Slack, Teams) |
| **Training LMS with Quiz Engine** | 46+ training modules, 8 learning paths, randomized quiz pools, walkthrough generator, progress tracking | Typically a separate LMS product (TalentLMS, Docebo) |
| **PDF Extraction Pipeline** | Automated compliance form field discovery from uploaded PDFs using pdf.js + PuppeteerSharp + AI verification | No competitor automates government form extraction |
| **Compliance Form System** | Dynamic form rendering from extracted PDF definitions, W-4/I-9 with section workflow, DocuSeal signing | Usually separate HR software territory |
| **Tiered Kiosk Authentication** | RFID → NFC → barcode → PIN cascading auth with hardware scanner support | Most offer badge scan only; tiered fallback is unique |
| **Offline-First PWA with Conflict Resolution** | IndexedDB cache, action queue, BroadcastChannel sync, SyncConflictDialogComponent for 409 resolution | Rare in manufacturing ERP — most are online-only |
| **Dynamic Report Builder** | User-configurable reports with 28 entity sources, 350+ fields, 6 chart types, saved/shared reports | Most ERPs have fixed reports or require external BI tools |
| **Terminology Customization** | Admin can rename any entity, status, or action label in the UI (e.g., "Job" → "Work Order") | Not found in competitors — labels are hardcoded |
| **Planning Day Guided Workflow** | Sprint-style planning with backlog curation, rollover handling, daily Top 3 prompts | Manufacturing ERPs don't incorporate agile planning concepts |
| **Job Disposition Workflow** | Structured disposition (ship, inventory, capitalize-as-asset, scrap, hold) with full audit | Informal in most systems — Forge makes it explicit |
| **Form Draft Recovery System** | Auto-save dirty forms to IndexedDB, cross-tab sync, post-login recovery, TTL management | Not found in any ERP — web apps typically lose form data on navigation |
| **Accounting Provider Abstraction** | Same app works standalone OR integrated with any of 5 accounting providers, with clean mode switching | Most ERPs either have built-in accounting or hard-integrate with one provider |

---

## 27. Critical Gaps Summary

Ranked by impact for a manufacturing operation:

| Priority | Gap | Impact | Difficulty |
|----------|-----|--------|------------|
| **1** | **MRP / MPS engine** | Cannot do material planning — the core function of manufacturing ERP | Very High |
| **2** | **Finite capacity scheduling / Gantt** | Cannot schedule against resource constraints | High |
| **3** | **SPC (Statistical Process Control)** | Cannot do measurement-based quality control charting | Medium |
| **4** | **EDI support** | Cannot exchange documents electronically with large customers | Medium |
| **5** | **Operation-level time/cost tracking** | Cannot track labor cost at granularity needed for job costing | Medium |
| **6** | **CAPA/NCR formal workflow** | Missing ISO-required corrective action process | Medium |
| **7** | **OEE calculation** | Cannot measure manufacturing efficiency | Low-Medium |
| **8** | **Multi-plant / multi-currency** | Limits to single-site, single-currency operations | High |
| **9** | **MFA** | Security gap for regulated environments | Low |
| **10** | **Job costing (actual vs. estimated)** | Cannot compare quoted vs. actual costs per job | Medium |

---

## 28. Data Model Comparison Table

### Entity Count by Domain

| Domain | Forge Entities | Typical Industry ERP Entities | Coverage |
|--------|---------------------|-------------------------------|----------|
| Job/Work Order | 8 (Job, JobStage, JobSubtask, JobActivityLog, JobLink, JobNote, JobPart, ProductionRun) | 10-15 (+ operation scheduling, labor detail, material issue, subcontract) | 75% |
| BOM/Parts | 7 (Part, BOMEntry, Operation, OperationMaterial, PartPrice, PartRevision, Barcode) | 12-18 (+ ECO, alternate BOM, UOM, part class) | 55% |
| Quality | 5 (QcChecklistTemplate, QcChecklistItem, QcInspection, QcInspectionResult, LotRecord) | 15-25 (+ SPC, CAPA, NCR, gage, receiving inspection, supplier quality) | 30% |
| Inventory | 6 (StorageLocation, BinContent, BinMovement, CycleCount, CycleCountLine, Reservation) | 10-15 (+ serial tracking, lot genealogy, ABC, consignment) | 55% |
| Purchasing | 4 (PurchaseOrder, PurchaseOrderLine, ReceivingRecord, Vendor) | 8-12 (+ RFQ, blanket PO, vendor scorecard, AP) | 45% |
| Sales/CRM | 8 (Lead, Customer, Contact, ContactInteraction, CustomerAddress, CustomerReturn, Quote, QuoteLine) | 10-15 (+ opportunity, campaign, territory, customer portal) | 65% |
| Order Management | 8 (SalesOrder, SalesOrderLine, Shipment, ShipmentLine, ShipmentPackage, Invoice, InvoiceLine, Payment) | 10-15 (+ ATP, credit hold, EDI, drop-ship) | 65% |
| Time/Labor | 4 (TimeEntry, ClockEvent, TimeCorrectionLog, PayStub) | 8-12 (+ shift, overtime, attendance, labor rate) | 45% |
| Asset/CMMS | 4 (Asset, MaintenanceSchedule, MaintenanceLog, DowntimeLog) | 8-15 (+ failure code, calibration, spare parts, warranty) | 40% |
| HR/Workforce | 9 (EmployeeProfile, ComplianceFormTemplate, ComplianceFormSubmission, FormDefinitionVersion, IdentityDocument, TrainingModule, TrainingPath, TrainingProgress, TrainingPathEnrollment) | 15-25 (+ performance review, benefits, skills matrix, PTO) | 50% |
| Planning | 3 (PlanningCycle, PlanningCycleEntry, ScheduledTask) | 10-20 (+ MRP tables, capacity, scheduling, forecast) | 20% |
| Financial | 6 (Invoice, InvoiceLine, Payment, PaymentApplication, PriceList, PriceListEntry) | 30-50 (full GL, AP, AR, FA, budgeting) | 15% (by design) |
| Communication | 3 (ChatMessage, ChatRoom, ChatRoomMember) | 0-1 (email only) | **Exceeds** |
| AI | 2 (DocumentEmbedding, AiAssistant) | 0 | **Exceeds** |
| Config/Admin | 9 (ReferenceData, SystemSetting, TerminologyEntry, UserPreference, UserScanIdentifier, Team, KioskTerminal, CompanyLocation, SalesTaxRate) | 15-25 (+ workflow engine, number sequences, fiscal calendar) | 50% |
| **TOTAL** | **104** | **200-350** | **~45%** |

> Note: Entity count alone is misleading. Forge covers surface area that typically requires 3-5 separate products (ERP + MES + LMS + Chat + AI). The gaps are primarily in depth within manufacturing-specific domains (MRP, SPC, scheduling) rather than breadth.

### API Endpoint Density

| Metric | Forge | Typical ERP |
|--------|-------------|-------------|
| Controllers | 62 | 80-150 |
| Total endpoints | 300+ | 500-1000+ |
| MediatR handlers | 391 | N/A (monolithic) |
| SignalR hubs | 4 | 0-1 |
| Real-time events | 20+ | 0-5 |

---

## Conclusion

Forge is a remarkably comprehensive manufacturing platform for a single codebase. It covers the full quote-to-cash lifecycle, shop floor execution, inventory management, CRM, HR/training, compliance, and real-time collaboration — an integration surface that typically requires purchasing and connecting 3-5 separate products.

**For a job shop / make-to-order manufacturer with <100 employees**, Forge provides competitive or superior functionality to products like JobBOSS, ProShop, and Fishbowl — with the added advantages of self-hosted AI, real-time collaboration, and a modern PWA architecture.

**For a larger manufacturer or one in regulated industries (automotive, aerospace, medical device)**, the gaps in MRP, SPC, CAPA/NCR, EDI, and finite scheduling would need to be addressed before Forge could serve as a primary system.

The novel features (self-hosted AI/RAG, real-time SignalR collaboration, training LMS, compliance form extraction, terminology customization, form draft recovery) represent genuine innovation that no competitor offers in a manufacturing context.
