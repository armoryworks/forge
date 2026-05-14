# Vertical restructure plan — Phase C of the rename/restructure work

> Plan-of-record for breaking `forge-api` into 11 vertical bounded contexts
> + 3 cross-cutting projects + a composition root. Per HANDOFF-FORGE-RENAME.md
> Phase C.

## Goal

Replace the current horizontal-layer split (`forge.api` / `forge.core` /
`forge.data` / `forge.integrations`) with a vertical-bounded-context
split:

- **11 verticals** (`Forge.Identity`, `Forge.MasterData`, `Forge.Sales`,
  `Forge.Procurement`, `Forge.Production`, `Forge.Inventory`,
  `Forge.Quality`, `Forge.Maintenance`, `Forge.People`, `Forge.Insights`,
  `Forge.Operations`) each owning its entities + configurations +
  controllers + MediatR handlers + integration services.
- **3 cross-cutting projects**: `Forge.Platform` (BaseEntity, IClock,
  pipeline behaviors, AppDbContext eventually, workflow + capability
  infra), `Forge.Database` (placeholder for the DbUp host project that
  Phase E will fill in), `Forge.Host` (eventual composition root —
  references all verticals, hosts Program.cs).

## Transition strategy

**This is multi-session work.** Each commit must leave
`dotnet build --configuration Release -warnaserror && dotnet test`
green. The existing `forge.api / forge.core / forge.data /
forge.integrations` projects stay alive but shrink as content moves
out — they're not deleted until they're empty. This way nothing in
the running system breaks mid-migration.

Migration order (dependency-first):

1. **`Forge.Platform`** — foundational types everyone references
   (BaseEntity, IClock, MediatR behaviors, exception middleware).
   `forge.core` continues to host AppDbContext + entities for now.
2. **`Forge.Identity`** — pilot vertical. Smallest, most foundational.
   Proves the migration pattern end-to-end.
3. **`Forge.MasterData`** — Customers, Vendors, Parts, BOMs,
   PriceLists, Assets, ReferenceData. Sales / Production /
   Procurement all depend on this conceptually.
4. **`Forge.Sales`** — Quotes, Estimates, Sales Orders, Invoices,
   Payments, Leads, RecurringOrders.
5. **`Forge.Procurement`** — PurchaseOrders, RFQs, Receiving.
6. **`Forge.Production`** — Jobs, Operations, WorkCenters, MRP,
   Planning, Scheduling, Kanban.
7. **`Forge.Inventory`** — StorageLocations, Bins, Lots, Serials,
   Shipments, CycleCounts, Picks, Transfers.
8. **`Forge.Quality`** — QC, NonConformance, SPC, FMEA, Gages,
   PPAP, CustomerReturns, ECOs, Doc control.
9. **`Forge.Maintenance`** — MaintenanceSchedule, MachineData,
   Predictions, Downtime.
10. **`Forge.People`** — Employees, PayStubs, TaxDocs, Training,
    Events, TimeEntries, ClockEvents, Leave, Performance,
    Announcements.
11. **`Forge.Insights`** — Reports, Dashboards, AI, embeddings.
12. **`Forge.Operations`** — Notifications, ScheduledTasks, EDI,
    Chat, Capability/Workflow admin, Approvals.

## Dependency rules

- Every vertical → `Forge.Platform`, plus verticals **earlier in the
  dependency DAG**. No cycles. Dependencies flow transactional →
  definitional — the same order as the migration sequence below
  (Identity → MasterData → Sales → …). So `Forge.Identity` may
  reference `Forge.MasterData` (e.g. `ApplicationUser.WorkLocation`
  navigating to `CompanyLocation`), but never the reverse.
  - **Why not "Platform only":** that rule is stricter than a DAG and
    fights EF Core, which cannot map an interface-typed navigation
    property — reference navs must be concrete entity types. Keeping
    concrete cross-vertical navs (e.g. `ApplicationUser → CompanyLocation`)
    requires the owning vertical to reference the target vertical's
    project. A one-way DAG dependency is sound; it's only *cycles*
    that break the build and the architecture. The migration order is
    already dependency-first, so the DAG is implicit — this rule just
    makes it explicit and permits the concrete navs.
  - During the transition a vertical may also reference the old
    shrinking `forge.core` for types not yet migrated (e.g.
    `Forge.Identity → forge.core` for `CompanyLocation` until
    `Forge.MasterData` migrates and the reference retargets).
- No vertical → another vertical that is *later* in the DAG, and no
  cycles. Cross-vertical reads that would need an upstream→downstream
  reference go through `forge.data` (which references all verticals)
  during the transition and eventually through events.
- `forge.data` keeps `AppDbContext` for now — it depends on all
  verticals' entities. Moving `AppDbContext` to Platform is deferred
  to a later pass (would require splitting it into per-vertical
  partial classes or interface-segregated DbSets — significant
  refactor on its own).
- `forge.api` (the existing host) keeps `Program.cs` for now.
  `Forge.Host` exists as a placeholder until a future session pulls
  `Program.cs` over with cleaner per-vertical `AddForge{Vertical}()`
  composition.

## Classification rules

Use these rules to decide which vertical owns an entity. Edge cases
get a judgment call documented in the per-vertical commit.

- **Identity**: anything user/role/auth-scoped — ApplicationUser,
  IdentityRole, MFA devices, user sessions, OIDC, user-scoped
  preferences, scan identifiers, kiosk terminals.
- **MasterData**: definitional entities downstream transactions
  read from — Customer/Contact, Vendor, Part/BOM/Revision,
  PriceList/PriceListEntry, Asset, ReferenceData, LeadSource,
  LaborRate, Currency/ExchangeRate, UnitOfMeasure, Plant,
  CompanyLocation, ConfiguratorOption, CostingProfile, IcpRubric,
  TariffRate, SalesTaxRate.
- **Sales**: discrete sales transactions and pre-sale objects —
  Quote/QuoteLine (Estimate is a QuoteType), SalesOrder/SalesOrderLine,
  Invoice/InvoiceLine, Payment/PaymentApplication, RecurringOrder,
  Lead, OutreachCampaign, ECommerce*, CreditHold.
- **Procurement**: PO, RFQ, Receiving — PurchaseOrder/Line/Release,
  RequestForQuote, RfqVendorResponse, ReceivingRecord,
  ReceivingInspection, SubcontractOrder, AutoPoSuggestion,
  ReorderSuggestion, Consignment*.
- **Production**: shop-floor work and what it produces —
  Job/Stage/Subtask/Link/Activity/Note/Part, TrackType,
  Operation/OperationMaterial, ProductionRun, WorkCenter*,
  MasterSchedule*, ScheduleMilestone, ScheduleRun, ScheduledOperation,
  Project/WbsElement/WbsCostEntry/Deliverable (Pro Services),
  MaterialIssue, PlanningCycle/Entry, KanbanCard/TriggerLog,
  Mrp*, DemandForecast, ForecastOverride, AndonAlert,
  AssignmentRule.
- **Inventory**: where things are and how they move —
  StorageLocation, BinContent/BinMovement, LotRecord,
  SerialNumber/SerialHistory, Shipment/Line/Package,
  Reservation, CycleCount/Line, PickLine/PickWave,
  InterPlantTransfer/Line, Barcode, ScanActionLog.
- **Quality**: inspection / SPC / NCR / docs —
  QcChecklist*/QcInspection*, NonConformance, CapaTask,
  CorrectiveAction, StatusEntry (status + holds polymorphic),
  Spc* (4 entities), Fmea*, Gage, CalibrationRecord,
  Ppap*, SampleShipment, CustomerReturn,
  EcoAffectedItem, EngineeringChangeOrder, ControlledDocument,
  DocumentRevision.
- **Maintenance**: MaintenanceSchedule/Log, MaintenancePrediction,
  PredictionFeedback, MachineConnection/DataPoint/Tag, MlModel
  (predictive maintenance), DowntimeLog.
- **People**: workforce — EmployeeProfile, PayStub/Deduction,
  TaxDocument, Compliance*/FormDefinitionVersion/IdentityDocument,
  Training* (6 entities), Event/EventAttendee,
  TimeEntry/ClockEvent/TimeCorrectionLog,
  LeaveBalance/Policy/Request, OvertimeRule, PerformanceReview/
  ReviewCycle, Expense/RecurringExpense, Announcement* (4 entities),
  Team, Shift/ShiftAssignment.
- **Insights**: read-side analytics + AI — SavedReport/Schedule,
  DocumentEmbedding, AiAssistant.
- **Operations**: cross-domain operational machinery —
  Notification, ScheduledTask, SyncQueueEntry, Edi* (3 entities),
  Chat* (4 entities), DiscoveryRun, Approval* (4 entities),
  FollowUpTask, CommunicationSyncConfig, CloudStorageProvider,
  EntityCloudLink, UserCloudStorageLink, UserIntegration.
- **Platform** (C1): BaseEntity, IConcurrencyVersioned,
  SystemSetting, FileAttachment, ActivityLog, AuditLogEntry,
  DomainEventFailure, IntegrationOutboxEntry,
  WebhookDelivery/Subscription, EntityNote, BiApiKey,
  TerminologyEntry, TranslatedLabel, SupportedLanguage,
  Capability/Config, EntityCapabilityRequirement,
  WorkflowDefinition/Run/RunEntity, EntityReadinessValidator,
  RoleTemplate (role configuration, not user-instance).

## Stopping criteria for tonight's session

Each vertical is its own commit, each commit must build + test clean.
If a vertical's migration runs into a tricky cross-vertical handler
that can't be cleanly assigned, I:

1. Document the conflict in the commit message.
2. Park the handler in `forge.api` (the old structure) for the
   migration session that resolves the dependency.
3. Move on to the next vertical.

If at any point `dotnet build -warnaserror` or `dotnet test` fail and
I can't resolve safely (e.g., a migration tool generates conflicting
namespaces I can't tease apart), I:

1. Roll back to the last green commit.
2. Document the blocker in TODO.md.
3. Stop the session there.

## How to resume

The next session checks the last commit's `chore(restructure):` /
`feat(forge-api): migrate ... vertical` messages to see how far the
work got, then reads the per-vertical entity list in the
classification rules above and continues from the next vertical in
the order.
