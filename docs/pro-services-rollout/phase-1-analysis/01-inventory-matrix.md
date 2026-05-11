# Artifact 1 — Inventory Matrix

Every UI feature folder, backend entity, and notable surface tagged with how it relates to the Pro Services + Hybrid rollout. Five tags, applied consistently:

| Tag | Meaning |
|---|---|
| ✅ | **Industry-neutral.** Works as-is for both manufacturing and Pro Services. No vocabulary change needed; no gating; no decoupling. |
| 🏷️ | **Renamable.** Same underlying entity, just needs a terminology overlay so the noun/verb fits the service-shop mental model. Lives or dies on Layer 1 adoption. |
| 🧰 | **Capability-gateable.** Already exists; can be hidden cleanly for Pro Services via the capability system. No code change, just preset-toggle the cap off. |
| 🔧 | **Needs decoupling.** A manufacturing assumption is baked into the surface. Requires real code work to either lift the assumption or split the surface. Items in this column flow into Artifact 3 (gap punch list). |
| 🟥 | **Manufacturing-only.** Pro Services should not see this at all. Whether it stays in the codebase depends on Hybrid mode — most 🟥 items remain because Hybrid uses them. |

---

## How to read this

- Three big tables follow: features (UI folders), entities (backend), and concept surfaces (cross-cutting things that span both: track types, kanban stages, reports, etc.).
- "Pro" column = what PRESET-08 (pure Pro Services) sees: enabled / hidden / renamed.
- "Hybrid" column = what PRESET-09 sees: typically the union of PRESET-04 and PRESET-08.
- "Mfg" column = baseline = what PRESET-04 (Production Manufacturer) sees today.
- "Notes" column = the active design decision or follow-up.

---

## Table 1 — UI Feature folders

Source: `qb-engineer-ui/src/app/features/`.

| Folder | Tag | Pro | Hybrid | Mfg | Notes |
|---|---|---|---|---|---|
| `account/` | ✅ | ✅ | ✅ | ✅ | Per-user account settings. Identity-layer, neutral. |
| `admin/` | ✅ | ✅ | ✅ | ✅ | Admin shell. Sub-pages tagged separately. |
| `ai/` | 🧰 | ✅ if `CAP-EXT-AI-ASSISTANT` on | ✅ | ✅ | Existing capability. No change. |
| `approvals/` | ✅ | ✅ | ✅ | ✅ | Approval workflow runner — neutral. |
| `assets/` | 🏷️ | "Equipment" → "Tools" / "Hardware" / "Software License" | "Assets" | "Assets" | Asset is generic enough. Renames serve the laptop-as-asset case. |
| `auth/` | ✅ | ✅ | ✅ | ✅ | Login / setup. Neutral. |
| `backlog/` | 🏷️ | "Engagements backlog" | "Backlog" (mixed) | "Production backlog" | Same surface, terminology overlay. |
| `calendar/` | ✅ | ✅ | ✅ | ✅ | Date/time grid. Neutral. |
| `chat/` | ✅ | ✅ | ✅ | ✅ | Internal messaging. Neutral. |
| `customer-returns/` | 🧰 | off (`CAP-O2C-RMA` off) | ✅ for goods side | ✅ | Service shops rarely RMA. Cap gate. |
| `customers/` | 🏷️ | "Clients" | "Customers / Clients" | "Customers" | Optional rename. Underlying entity unchanged. |
| `dashboard/` | 🔧 | needs Pro Services widgets | needs Hybrid widget set | ✅ | Default widget set is mfg-flavored (utilization, scrap rate). Pro Services needs different widgets (utilization-by-resource, billable %, project margin). See gap punch list. |
| `dev-tools/` | ✅ | ✅ | ✅ | ✅ | Dev-only. |
| `employees/` | ✅ | ✅ | ✅ | ✅ | HR-side. Neutral. |
| `events/` | ✅ | ✅ | ✅ | ✅ | Meetings/training. Neutral. |
| `expenses/` | ✅ | ✅ | ✅ | ✅ | Generic expense tracking. Neutral. |
| `inventory/` | 🧰 | off (`CAP-INV-*` family off) | ✅ | ✅ | Cleanly cap-gated; Pro Services hides whole folder. |
| `invoices/` | 🏷️ | "Invoices" but lines mean services not parts | "Invoices" | "Invoices" | Schema neutral. Renamable headers via terminology. |
| `kanban/` | 🏷️ | "Engagement board" | "Project / Production board" | "Production board" | Multi-track-type today; just add Pro Services track + stages. |
| `leads/` | 🏷️ | "Prospects" | "Leads / Prospects" | "Leads" | Already neutral-ish. Optional rename. |
| `lots/` | 🟥 | off (`CAP-INV-LOTS` off) | ✅ if goods side has lots | ✅ | Lot tracking is manufacturing-specific. Cap-gate. |
| `maintenance/` | 🧰 | off (`CAP-MFG-MAINTENANCE` off) | ✅ for shared equipment | ✅ | Pro Services occasionally needs (laptop maintenance schedule); leave off in seed. |
| `mobile/` | ✅ | ✅ | ✅ | ✅ | Generic mobile shell. |
| `mrp/` | 🟥 | off (`CAP-PLAN-MRP` off) | ✅ for goods side | ✅ | Material requirements planning. Pure mfg concept. |
| `notifications/` | ✅ | ✅ | ✅ | ✅ | Cross-cutting. Neutral. |
| `oee/` | 🟥 | off (`CAP-MFG-OEE` off) | ✅ for goods side | ✅ | OEE is machine-utilization. Mfg-only. |
| `onboarding/` | ✅ | ✅ | ✅ | ✅ | Setup wizard. Generic. |
| `parts/` | 🟥 | off (`CAP-MD-PARTS` off) for pure services | ✅ for goods side | ✅ | Service-only shop has no parts catalog. Pro shop with merchandise → use Hybrid. |
| `payments/` | ✅ | ✅ | ✅ | ✅ | Customer payments. Neutral. |
| `planning/` | 🏷️ | "Sprint planning" | "Planning cycles" | "Planning cycles" | Cycles map neatly to sprints/iterations. Terminology overlay. |
| `portal/` | 🧰 | ✅ if `CAP-EXT-CUSTOMER-PORTAL` on | ✅ | ✅ if on | Customer portal exists today as a capability. Pro Services often wants this enabled. |
| `purchase-orders/` | 🧰 | off (`CAP-P2P-PO` off) typical pure-services | ✅ | ✅ | Services that subcontract still need POs — keep available, default-off for pure Pro Services. |
| `purchasing/` | 🧰 | follows `CAP-P2P-PO` | ✅ | ✅ | Same gate as `purchase-orders/`. |
| `quality/` | 🟥 | off (`CAP-QC-*` off mostly; keep `CAP-QC-COMPLIANCE-FORMS` for NDAs per D7) | ✅ | ✅ | Quality is mfg-flavored except compliance forms (NDAs/MSAs apply to services per D7). |
| `quotes/` | 🏷️ | "Proposals" / "Statement of Work" | "Quotes / SOWs" | "Quotes" | Same entity, terminology overlay. Hybrid carries both vocabularies. |
| `render/` | 🟥 | off (`CAP-MFG-RENDER` off) | ✅ if 3D parts | ✅ | 3D part rendering. Mfg-only. |
| `reports/` | 🔧 | Pro reports + neutral reports | both sets | mfg reports + neutral reports | Report library needs per-preset visibility filter. ~30 reports today. See concept-surfaces table. |
| `sales-orders/` | 🏷️ | "Engagement orders" / hidden if SOW serves the same purpose | "Sales orders" | "Sales orders" | Cap-gateable; in Pro Services often suppressed in favor of SOW + invoice. |
| `scheduling/` | 🏷️ | "Resource scheduling" | "Resource & production scheduling" | "Production scheduling" | Same engine; renamable. |
| `setup-integrations/` | ✅ | ✅ | ✅ | ✅ | Admin setup. Neutral. |
| `shipments/` | 🧰 | off (`CAP-O2C-SHIP` off typical Pro) | ✅ | ✅ | Service shops rarely ship physical things. Cap-gate. |
| `shop-floor/` | 🟥 | off (`CAP-MFG-SHOPFLOOR` off) | ✅ for goods side | ✅ | Floor display is physical-work-centric. |
| `time-tracking/` | ✅ | ✅ | ✅ | ✅ | Neutral, but Pro Services wants the billable/non-billable split (see gap punch list). |
| `training/` | ✅ | ✅ | ✅ | ✅ | LMS. Neutral. |
| `vendors/` | ✅ | ✅ | ✅ | ✅ | Neutral. |
| `welcome/` | ✅ | ✅ | ✅ | ✅ | First-run screen. |
| `worker/` | 🟥 | off | ✅ | ✅ | Worker / kiosk view. Mfg-centric. |
| `workflow-demo/` | ✅ | ✅ | ✅ | ✅ | Demo only. |

---

## Table 2 — Backend entities

Source: `qb-engineer.core/Entities/`. Tagged by whether the entity itself is meaningful in a services world, not by its UI surface.

### Master Data

| Entity | Tag | Notes |
|---|---|---|
| `Customer` | 🏷️ | "Client" rename via terminology. |
| `CustomerAddress` | ✅ | Pro Services still has client addresses. |
| `Contact` | ✅ | Neutral. |
| `ContactInteraction` | ✅ | Neutral. |
| `Vendor` | ✅ | Subcontractors are vendors. |
| `Part` | 🟥 | Hidden in pure Pro Services. Hybrid uses it. |
| `PartAlternate` | 🟥 | Mfg-only. |
| `PartPrice` | 🟥 | Mfg-only. |
| `PartRevision` | 🟥 | Mfg-only. |
| `BOMEntry` | 🟥 | Mfg-only (`CAP-MD-BOM`). |
| `BomRevision`, `BomRevisionEntry` | 🟥 | Mfg-only. |
| `Operation` | 🟥 | Routings, mfg-only. |
| `OperationMaterial` | 🟥 | Routings, mfg-only. |
| `WorkCenter` | 🏷️ | Pro Services rename to "Resource Pool" or "Practice Area." Underlying entity is a capacity bucket. |
| `WorkCenterCalendar` | ✅ | Calendar is neutral. |
| `WorkCenterQualification` | 🏷️ | "Skill" in Pro Services context. Same shape. |
| `WorkCenterShift` | ✅ | Neutral. |
| `Employee*` / `EmployeeProfile` | ✅ | Neutral. |
| `Asset` | 🏷️ | Generic enough; renames serve narrow cases. |
| `Project` | ✅ | Exists. Likely the home of Pro Services engagements (vs creating new entity). Confirm in Phase 2. |
| `Team` | ✅ | Neutral. |
| `Plant`, `CompanyLocation` | ✅ | Neutral. |
| `WorkingCalendar`, `Holiday`, `Shift` | ✅ | Neutral. |
| `LaborRate` | ✅ | Useful for services billable rates. |
| `OvertimeRule` | ✅ | Neutral. |
| `UnitOfMeasure`, `UomConversion` | 🏷️ | Pro Services adds Hour/Day/Sprint/Engagement UOMs. |
| `Currency`, `ExchangeRate` | ✅ | Neutral. |
| `SalesTaxRate` | ✅ | Services taxable in some states. Neutral. |
| `ReferenceData` | ✅ | Substrate is neutral; values differ by preset. |
| `TerminologyEntry`, `TranslatedLabel`, `SupportedLanguage` | ✅ | Localization substrate. Neutral. |

### Order-to-Cash

| Entity | Tag | Notes |
|---|---|---|
| `Lead` | 🏷️ | "Prospect" optional rename. |
| `LeadSource` | ✅ | Neutral. |
| `LeadOutreachPreferences` | ✅ | Neutral. |
| `Quote` | 🏷️ | "Proposal" / "SOW" rename. Schema-neutral. |
| `QuoteLine` | 🏷️ | Same. Lines reference services not parts. |
| `RequestForQuote` | 🧰 | Cap-gateable. Mfg-centric in current copy. |
| `RfqVendorResponse` | 🧰 | Same. |
| `ProductConfiguration` | 🟥 | CPQ for configurable products. Mfg-only. |
| `ProductConfigurator` | 🟥 | Same. |
| `ConfiguratorOption` | 🟥 | Same. |
| `SalesOrder`, `SalesOrderLine` | 🏷️ | Pro Services often hides; Hybrid uses. |
| `RecurringOrder`, `RecurringOrderLine` | ✅ | Retainer model maps to recurring order. Useful for Pro Services. |
| `Shipment`, `ShipmentLine`, `ShipmentPackage` | 🧰 | Cap-gate off for pure services. |
| `Invoice`, `InvoiceLine` | 🏷️ | Schema-neutral; line meaning differs. |
| `Payment`, `PaymentApplication` | ✅ | Neutral. |
| `CustomerReturn` | 🧰 | Cap-gate. |
| `PriceList`, `PriceListEntry` | 🏷️ | Pro Services uses rate cards; same shape. |
| `CreditHold` | ✅ | Neutral. |
| `ConsignmentAgreement`, `ConsignmentTransaction` | 🟥 | Mfg-only (`CAP-MD-CONTRACTS-CONSIGNMENT`). |
| `CustomerPortalAccess` | ✅ | Neutral. |
| `OutreachCampaign` | ✅ | Neutral. |
| `IcpRubric` | ✅ | Ideal Customer Profile rubric. Neutral. |

### Procure-to-Pay

| Entity | Tag | Notes |
|---|---|---|
| `PurchaseOrder`, `PurchaseOrderLine`, `PurchaseOrderRelease` | 🧰 | Pro Services with subcontractors needs PO. Cap-gate. |
| `ReceivingRecord`, `ReceivingInspection` | 🟥 | Mfg-flavored receiving. |
| `SubcontractOrder` | 🟥 | Mfg-only routing subcontract. |
| `RecurringExpense` | ✅ | Neutral. |
| `AutoPoSuggestion` | 🟥 | Reorder logic, mfg-only. |
| `VendorPart` | 🟥 | Vendor-part bridge, mfg-only. |
| `VendorPartPriceTier` | 🟥 | Same. |
| `VendorScorecard` | ✅ | Neutral. |
| `Expense`, `RecurringExpense` | ✅ | Neutral. |

### Manufacturing core

| Entity | Tag | Notes |
|---|---|---|
| `Job` | 🏷️ | The most important rename. "Project" / "Engagement" in Pro Services. |
| `JobActivityLog` | 🏷️ | Same surface, renamed. |
| `JobLink` | ✅ | Generic relationship. |
| `JobNote`, `JobSubtask`, `JobPart` | 🏷️ | Same renames as Job. |
| `JobStage` | 🏷️ | Stage names differ; substrate neutral. |
| `KanbanCard`, `KanbanTriggerLog` | 🏷️ | Renamable. |
| `ProductionRun` | 🟥 | Mfg-only by definition. |
| `MaterialIssue` | 🟥 | Mfg-only. |
| `Reservation` | 🧰 | Inventory reservation. Cap-gate. |
| `SerialNumber`, `SerialHistory` | 🟥 | Mfg-only. |
| `LotRecord` | 🟥 | Mfg-only. |
| `Barcode`, `ScanActionLog` | 🟥 | Mfg-flavored. |
| `TrackType` | 🏷️ | Substrate-neutral; per-preset defaults differ. |
| `KioskTerminal` | 🟥 | Shop-floor kiosk. Mfg-only. |
| `UserScanDevice`, `UserScanIdentifier` | 🟥 | Same. |

### Inventory

| Entity | Tag | Notes |
|---|---|---|
| `StorageLocation` | 🟥 | Mfg-only. Hybrid uses. |
| `BinContent`, `BinMovement` | 🟥 | Same. |
| `InterPlantTransfer`, `InterPlantTransferLine` | 🟥 | Same. |
| `CycleCount`, `CycleCountLine` | 🟥 | Same. |
| `AbcClassification`, `AbcClassificationRun` | 🟥 | Same. |
| `PickWave`, `PickLine` | 🟥 | Same. |
| `ReorderSuggestion` | 🟥 | Same. |

### Planning

| Entity | Tag | Notes |
|---|---|---|
| `PlanningCycle`, `PlanningCycleEntry` | 🏷️ | "Sprint" rename for Pro Services. Same substrate. |
| `MrpRun`, `MrpDemand`, `MrpSupply`, `MrpPlannedOrder`, `MrpException` | 🟥 | Mfg-only. |
| `MasterSchedule`, `MasterScheduleLine` | 🟥 | Same. |
| `DemandForecast`, `ForecastOverride` | 🟥 | Same. |
| `ScheduleRun`, `ScheduledOperation`, `ScheduleMilestone` | 🏷️ | Resource scheduling — usable in Pro Services with renames. |

### Quality

| Entity | Tag | Notes |
|---|---|---|
| `QcChecklistTemplate`, `QcChecklistItem`, `QcInspection`, `QcInspectionResult` | 🟥 | Mfg-only. |
| `NonConformance`, `CorrectiveAction`, `CapaTask` | 🟥 | Same. |
| `FmeaAnalysis`, `FmeaItem` | 🟥 | Same. |
| `SpcCharacteristic`, `SpcMeasurement`, `SpcControlLimit`, `SpcOocEvent` | 🟥 | Same. |
| `Gage`, `CalibrationRecord` | 🟥 | Same. |
| `PpapSubmission`, `PpapElement` | 🟥 | Same. |
| `SampleShipment` | 🟥 | Same. |
| `ControlledDocument`, `DocumentRevision` | ✅ | Pro Services uses (NDAs, MSAs, deliverable docs). Neutral. |
| `ComplianceFormTemplate`, `ComplianceFormSubmission` | ✅ | Per D7 — broadened to cover NDAs/MSAs. Neutral with capability. |
| `IdentityDocument` | ✅ | Neutral. |
| `FormDefinitionVersion` | ✅ | Neutral. |

### Machine / OEE

| Entity | Tag | Notes |
|---|---|---|
| `MachineConnection`, `MachineDataPoint`, `MachineTag` | 🟥 | OEE-only. |
| `DowntimeLog` | 🟥 | Same. |
| `MaintenanceLog`, `MaintenanceSchedule`, `MaintenancePrediction`, `PredictionFeedback` | 🧰 | Hybrid uses for shop equipment; Pro Services may use for laptops. Cap-gate. |
| `AndonAlert` | 🟥 | Shop-floor signal. |

### HR / Personnel

| Entity | Tag | Notes |
|---|---|---|
| `PayStub`, `PayStubDeduction` | ✅ | Neutral. |
| `TaxDocument` | ✅ | Neutral. |
| `PerformanceReview`, `ReviewCycle` | ✅ | Neutral. |
| `LeavePolicy`, `LeaveRequest`, `LeaveBalance` | ✅ | Neutral. |
| `Announcement`, `AnnouncementAcknowledgment`, `AnnouncementTeam`, `AnnouncementTemplate` | ✅ | Neutral. |
| `Event`, `EventAttendee` | ✅ | Neutral. |
| `TimeEntry`, `ClockEvent`, `TimeCorrectionLog` | 🔧 | TimeEntry needs billable/non-billable split for Pro Services. See gap punch list. |
| `TrainingModule`, `TrainingPath`, `TrainingPathEnrollment`, `TrainingPathModule`, `TrainingProgress`, `TrainingScanLog` | ✅ | LMS. Neutral. |
| `ShiftAssignment` | ✅ | Neutral. |
| `FollowUpTask` | ✅ | Neutral. |

### Identity / Access

| Entity | Tag | Notes |
|---|---|---|
| `Capability`, `CapabilityConfig` | ✅ | Substrate. |
| `RoleTemplate` | 🏷️ | Per-preset role seed. Renamable roles. |
| `EntityCapabilityRequirement`, `EntityReadinessValidator` | ✅ | Substrate. |
| `UserMfaDevice`, `MfaRecoveryCode` | ✅ | Neutral. |
| `UserIntegration`, `OAuthStateToken` | ✅ | Neutral. |
| `UserPreference` | ✅ | Neutral. |
| `AuditLogEntry`, `ActivityLog` | ✅ | Neutral. |
| `EntityNote` | ✅ | Neutral. |

### Reports / Notifications / Files

| Entity | Tag | Notes |
|---|---|---|
| `SavedReport`, `ReportSchedule` | 🔧 | Report visibility filter per preset. See gap punch list. |
| `Notification` | ✅ | Neutral. |
| `FileAttachment` | ✅ | Neutral. |

### Communication / Sync

| Entity | Tag | Notes |
|---|---|---|
| `ChatMessage`, `ChatMessageMention`, `ChatRoom`, `ChatRoomMember` | ✅ | Neutral. |
| `CommunicationSyncConfig` | ✅ | Neutral. |
| `WebhookSubscription`, `WebhookDelivery` | ✅ | Neutral. |

### Integration / System

| Entity | Tag | Notes |
|---|---|---|
| `IntegrationOutboxEntry` | ✅ | Substrate. |
| `DomainEventFailure` | ✅ | Substrate. |
| `SyncQueueEntry` | ✅ | Substrate. |
| `EdiTradingPartner`, `EdiTransaction`, `EdiMapping` | 🧰 | Cap-gate (`CAP-EXT-EDI`). |
| `ECommerceIntegration`, `ECommerceOrderSync` | 🧰 | Cap-gate (`CAP-EXT-ECOMMERCE`). |
| `BiApiKey` | 🧰 | Cap-gate (`CAP-IDEN-AUTH-API-KEYS`). |
| `SystemSetting` | ✅ | Substrate. |
| `ScheduledTask` | ✅ | Substrate. |
| `TariffRate` | 🟥 | Imports only. |
| `Holiday` | ✅ | Neutral. |
| `WorkflowDefinition`, `WorkflowRun`, `WorkflowRunEntity` | ✅ | Substrate. |
| `EngineeringChangeOrder`, `EcoAffectedItem` | 🟥 | ECO is mfg-only. |
| `CostCalculation`, `CostCalculationInputs`, `CostingProfile` | 🔧 | Costing today is part-cost-flavored. Pro Services has job-cost / time-and-materials cost. See gap punch list. |
| `WbsCostEntry`, `WbsElement` | ✅ | Work-breakdown structure — useful for both worlds. |
| `Account` (accounting) | ✅ | Built-in accounting account. Neutral. |
| `MlModel`, `DocumentEmbedding`, `AiAssistant` | 🧰 | Cap-gate. |
| `AssignmentRule` | ✅ | Generic routing. |
| `ApprovalWorkflow`, `ApprovalRequest`, `ApprovalStep`, `ApprovalDecision` | ✅ | Neutral. |
| `DiscoveryRun` | ✅ | Wizard substrate. |

---

## Table 3 — Concept surfaces (cross-cutting)

These aren't single entities — they're things spread across many entities or settings.

| Surface | Tag | Notes / what changes per preset |
|---|---|---|
| Default track types | 🔧 | Seeded today as Production / R&D / Maintenance / Other. PRESET-08 needs Engagement track + stages (Proposal → Active → Wrap-up). PRESET-09 keeps Production AND Engagement. See preset bundle schema in Artifact 5. |
| Default kanban stages | 🔧 | Stage names + colors per track type. Pro Services has different stages (Proposal / Discovery / In Delivery / In Review / Delivered / Invoiced / Paid). |
| Default ApplicationRoles seed | 🔧 | 11 mfg-flavored roles today. PRESET-08 needs Practitioner, Engagement Manager, Account Manager, Delivery Lead. Hybrid carries both sets. |
| Default reference-data seed | 🔧 | 15 groups today (mfg-flavored). Pro Services needs ~10 more (engagement_type, project_phase, resource_skill, time_billable_status, deliverable_type, service_uom, retainer_status, engagement_status, client_segment, time_activity_type). See Artifact 2 §3. |
| Default UoM seed | 🔧 | Mfg UOMs only today. Pro Services needs Hour, Day, Week, Sprint, Engagement, Fixed-Bid. |
| Default terminology overrides | 🔧 | Empty today. Per preset, bundle the entity-noun + status-verb renames. PRESET-08 carries ~30-50 renames; PRESET-09 carries ~10-15 (partial overlay). |
| Default report-visibility filter | 🔧 | 30 reports visible to everyone today. Per-preset list of report IDs that apply. |
| Default folder-mapping suggestions (cloud storage) | 🔧 | Doesn't exist — introduced by D9. Per-preset entity-type → folder-path-template map. |
| Default workflow definitions | 🔧 | Part-only today. PRESET-08 wants Engagement workflow definition. |
| Default dashboard widget set | 🔧 | Mfg-flavored widgets today (utilization, scrap rate, OEE). Pro Services needs different widgets (billable %, project margin, utilization-by-practitioner, AR aging). |
| Discovery wizard top question | 🔧 | Per D4, add "make / sell time / both" before the existing 22 questions. |
| Discovery wizard branches | 🔧 | Today A/B/C by headcount, all in mfg tree. New Pro Services sub-tree branches from the "sell time" top answer. |
| Engineer role permissions | 🧰 | Per D6 — gated by capability, not split into role variants. |
| `CAP-QC-COMPLIANCE-FORMS` scope | 🧰 | Per D7 — broadened to cover NDAs/MSAs (already documented). |
| Accounting mode | ✅ | Mutex `CAP-ACCT-EXTERNAL ⊥ CAP-ACCT-BUILTIN` already exists. Migration adds `CAP-ACCT-MIGRATION`. |
| Cloud storage providers | 🧰 | Per D9 — new caps `CAP-EXT-CLOUD-STORAGE` + 3 providers. See Artifact 4. |
| Project entity | ✅ | Exists (`Project.cs`). Confirm in Phase 2 whether Pro Services Engagement maps onto this or onto Job-with-axes. Recommend reusing Project + adding axis fields, since `Project` is currently lightly used. |
| Billable/non-billable on time | 🔧 | TimeEntry lacks billable flag + bill rate fields. Needed for Pro Services invoicing. See gap punch list. |
| Service-shop forms (NDA, MSA, SOW) | ✅ | ComplianceFormTemplate already covers per D7. Preset bundles seed templates for these. |
| ScanActionLog / barcode UX | 🟥 | Mfg-only. Pro Services seed skips. |

---

## Summary by tag

Approximate counts (best-effort, from the tables above):

| Tag | Count | Treatment |
|---|---|---|
| ✅ Neutral | ~95 entities + 20 features | No action |
| 🏷️ Renamable | ~25 entities + 12 features | Terminology bundle (Layer 1 adoption) |
| 🧰 Capability-gateable | ~12 entities + 10 features | Preset toggles existing capability |
| 🔧 Needs decoupling | ~5 entities + 14 concept surfaces | Drives Artifact 3 (gap punch list) |
| 🟥 Mfg-only | ~55 entities + 8 features | Pro Services hides; Hybrid uses |

**Read takeaway:** the codebase is more services-ready than the surface suggests. The largest workstream is renaming (🏷️) + seeding bundles for the missing config-layer content (🔧 concept surfaces), not refactoring entities (🔧 entities is small).

The 🔧 entity work is concentrated in three places:
1. **TimeEntry** — billable / non-billable split.
2. **CostCalculation** — services-mode costing.
3. **Reports / Dashboard / Track types / Stages / Roles / UOMs / Workflow defs** — all really one work item: extending preset bundles to seed these adjacencies (Artifact 5).

That's the headline.
