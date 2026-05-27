---
title: Audit Remediation — Master Findings Catalog
type: delivery
status: in-progress
id: audit-remediation-catalog
updated: 2026-05-27
---

# Master Findings Catalog — by feature

The complete remediation TODO from the 44-phase audit, **organized feature by
feature** (the spine), under a **net-benefit inclusion rule**: every defect *or*
improvement that makes the app better is in — any severity, including small ones —
*except* items that would add cruft, gold-plating, muddiness, or contradict an
existing convention. Those are recorded in the [Excluded](#excluded--deliberately-not-doing)
appendix so the decision is explicit, not lost.

**How to use it:** burn down **one feature at a time** — write the RED tests for
all of a feature's rows, fix them, ship the feature, move on. Severity is a
per-row *attribute* (and a ship-gate, below), not the order of work.

**Severity** = BLOCKER · HIGH · MED · LOW. **Test** = `xU` xUnit · `EF` EF
`TestDbContextFactory` · `Int` `WebApplicationFactory` · `Vi` Vitest · `Cy` Cypress
· `axe` Cypress+axe (`test:a11y`) · `man` manual/code audit. IDs trace to
`forge-analysis/findings/`. "(also X)" = corroborated by another phase (higher
confidence).

> **Ship gate (must be GREEN before GA, regardless of feature order):** Expenses
> `F-EXP-01`, Kanban `K-F3/F13/F15`, Shop-Floor `SF-04/05/10`, Planning `P-F6`,
> Time-Tracking `TT-04`, MRP `G-38-MRP-1`, MFA `G-MFA-3` + `F-15-FS-01`, Payroll
> `F-14-BE-02`, Maintenance `MAINT-01`, and the WCAG criticals (shell + shared
> components). These are crashes, authz bypasses, broken-crypto, data-exposure, or
> accessibility traps.

---

## Region 1 — Master Data

### Leads
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| L3 | **BLOCKER** | `PullQueueHandler` raw SQL: `leads.status` stored int but compared to string + scalar select missing `AS "Value"` → 500 on every queue pull → add `HasConversion<string>()` (or cast) + alias | EF |
| C1-back | MED | `UpdateLead` allows status regression (Converted→New); no state-machine → enforce New→Qualified→Pitched→Converted\|Lost in validator | EF |
| L4 | LOW | Campaigns can't be archived (no DELETE endpoint / `IsActive` setter / UI) → add `DELETE /leads/campaigns/{id}` + UI | Int |
| L7 | LOW | Delete button shown to PM but `AccountsController` DELETE requires Admin/Manager → align UI gate to server | man |

### Customers
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| C7 | HIGH | 5 module-gated tabs (orders/jobs/invoices/estimates/pricing) absent from `tabCapabilityMap` → render + silent-403 → add the 5 caps to the map | Cy |
| C8 (+back) | MED | `UpdateCustomer` deactivates with open orders/jobs/invoices, no guard (counts already loaded) → throw 422 if any open | EF |
| C2 | MED | Customer bulk-import page is placeholder chrome (no service/endpoint) → ship `bulk-intake/preview\|commit` mirror of leads, or remove the stub | Int |
| C3 | MED | Customer segments page hardcodes 4 examples, no API → ship segments CRUD + filter-builder, or remove the stub | Int |
| C5 | MED | Standalone `/customers/contacts` not cap-guarded (detail tab is) → guard route / explained-unavailable (shared fix) | Cy |

### Contacts
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| L5 | LOW | Contact outreach-preferences API has no UI consumer → wire on the contacts tab, or confirm it's an accounting-region consumer before deleting | Int |

### Vendors
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| V9 | HIGH | `OffTierVariancePct` dropped server-side (UI sends, DB column exists) → add to request/response models + handler mapping | EF |
| V8 | MED | `getPerformanceReport` + endpoint exist, no UI caller → wire a vendor-performance view, or deprecate the orphan | Int |
| V7 | LOW | Wizard step-2 "Relationship type" is UI-only (`RelationshipType` not in request model) → add `vendorType` to model + create command | Int |

### Parts / BOM
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| D5 | HIGH | BOM allows multi-node cycles (A→B→A); only direct self-ref guarded → ancestor-walk validator, reject 422 (also flow D5) | EF |
| D2b | MED | `inventory-summary` returns total only, no reserved/available split → add the two fields | EF |
| P7 | MED | `part-quality-step` lacks `receivingInspectionTemplateId` control (backend maps it) → add control + include in patch | Vi |
| P6 | MED | `/parts/{id}` for an Active part shows "Loading workflow…" forever; no edit affordance → "Reopen for edit" / resolve the dead-end | Int |
| D3 | MED | `PartUomClusterComponent` built+imported but never rendered → register a `uom` tab, or remove the dead component | Int |
| D8 | MED | Lots queryable per part but no `lots` tab on part detail → add the tab | Int |
| D4 | LOW | `BomTreeComponent` renders a fake flat tree (all level 0) → document flat-per-level, or ship recursive explosion | Int |

### Inventory
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| S-RI1 | HIGH | `TransferStock`/`AdjustStock`/`UpdateCycleCount`/`RemoveBinContent` ignore `ReservedQuantity`, inflating available → guard: throw if `newQty < reserved`; transfer carries reserved | EF |
| S1 | MED | Stock tab omits zero-stock parts (joins only parts with bins) → union all parts incl. zero | EF |
| S2a | MED | No `PUT /inventory/locations/{id}` → can't rename/re-type/re-parent → add update command + endpoint + UI | Int |
| S2c+SO1+SO2 | MED | `placeBinContent` has no UI caller; transfer/adjust require hand-typed `binContentId` → add bin-placement form + bin picker dialog | Cy |
| cap-UX-INV | MED | All 9 tabs render with no cap pre-check → 403 on load → explained-unavailable per tab (shared fix) | Cy |
| S2b | LOW | `DELETE /inventory/locations/{id}` exists, no UI → add soft-delete button (contents-blocking confirm) | Cy |
| CC1b | LOW | No `DELETE /cycle-counts/{id}` → Pending/Rejected can't be cancelled → add endpoint + UI | Int |
| INV-1-def | LOW | Two "on hand" definitions (stock tab = all non-removed bins vs low-stock alert = Stored only) → unify to one query path | man |

### Lots
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| L2 | MED | Lots are create-only (no PUT/DELETE despite `DeletedAt`) → add edit (expiry/notes/supplier-lot) + soft-delete + UI | Int |

---

## Region 2 — Quote-to-Cash + Expenses

### Quotes
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| BE-1 (Q-3) | HIGH | Quote lines immutable post-create (no line PUT/PATCH/DELETE) → implement line edit/delete (or document header-only + surface edit action) | xU |
| AUDIT-19-S1 | HIGH | Customer price lists are a dead input to quote-line pricing → line price resolves from the customer's price list when present | xU |
| Q-5 | MED | Cost-breakdown columns orphaned (estimate→quote yields zero lines) → populate via BE-3, else hide until populated | EF |

### Estimates
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| E-1 | **BLOCKER** | `EstimateFormDialog` is dead + non-persisting; compute endpoint mocked/missing → implement `POST /estimates/{id}/compute` + wire, or delete the dead surface | Int |
| BE-3 | MED | `ConvertEstimateToQuote` yields a zero-line quote; `EstimatedAmount` not transferred → map amount→line(s) + carry tax/notes | xU |

### Sales Orders
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| AUDIT-S4 | HIGH | `ConvertQuoteToOrder` converts a zero-line quote into a confirmable $0 order → require ≥1 line before convert/lifecycle (RED test written) | xU |
| BE-1 (SO-8) | HIGH | SO header+lines immutable post-create; no edit path → editable Draft header (CreditTerms/Billing/ReqDate/CustomerPO) + lines | xU+Cy |
| SO-4 | HIGH | Draft SO unreachable: list (Job-projected) excludes Draft, customer tab deep-links `?id=` but list honors `?detail=` → align query-param strategy + add Draft to list/Confirm path | Int+Cy |
| BE-2 / AUDIT-S3 | MED | `ConvertQuoteToOrder` drops `Notes` (only quote-sourced field of the 5) → carry `Notes` (RED test written); SO-only fields via SO-8 edit | xU |
| SO-11 | LOW | Addresses not collectible at SO/Quote create (contract fields exist, no pickers) → add address pickers | Int |
| SO-6 | LOW | "Draft" offered in status filter but endpoint never returns it → remove from filter options | Cy |
| BE-6 | LOW | `SalesOrder.Status` stored as int (latent raw-SQL hazard, cf. L3) → `HasConversion<string>()` defensive hardening | EF |

### Recurring Orders
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| BE-5 | MED | `RecurringOrderJob` uses non-sequential `SO-AUTO-*` numbers + no cap check → use `GenerateNextOrderNumberAsync()` + add `CAP-O2C-RECURRING` check | xU |
| BE-4 | MED | No `PUT /recurring-orders/{id}` (UI is delete+recreate) → add update endpoint if edit is wanted, else document immutability | xU |

### Purchase Orders
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| P06-4 | MED | PO lines immutable post-create → implement line mutation endpoints, or document header+receive only | xU |
| P06-7 | MED | Auto-PO math is single-level BOM, no ReorderPoint read → multi-level traversal + min/max, or document as SO-demand-only | xU |
| P06-8 | LOW | Orphan `AutoPoService` targets a wrong route → delete the orphan (or fix route if it's to be wired) | man |

### Purchasing / RFQ
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| G-37-RFQ-1 | MED | Cap-OFF: "New RFQ" enabled, submit fails silently → explained-unavailable (shared fix) | Cy |
| P06-10 | LOW | RFQ has dead enum states (Cancelled/Expired/EvaluatingResponses) with no writers → add transitions, or remove the dead enums | xU |

### Receiving
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| PRI-1/2/3 / P06-2 | HIGH | PO-side receive marks Received + signals "Materials Ready" but writes **no** `BinContent`; inv-tab receive stocks but never advances PO status → one path both stocks and advances; require location when stocking (also flow F-29-F2-S4) | EF+Cy |

### Shipments
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| P06-3 / INV-1 / S-MV1 | HIGH | `ShipShipment` is a status-flip only — never relieves `on_hand` **and** never releases the SO-line reservation (`InventoryReliefService` orphaned, `Program.cs:387`) → decrement `BinContent` + release `SalesOrderLineId` reservation | EF |
| EX-31-20 | LOW | Shipment detail uses raw `{{ cost \| currency }}` vs `app-currency-display` elsewhere → use the component | Cy |

### Invoices
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| AUDIT-21-S1 / P06-9 | **BLOCKER** | Invoice/payment create never enqueues the QBO `SyncQueue`; processor never scheduled (`/sync-queue/status`→404) → enqueue on create + register/drain the processor job | Int |
| P06-1 | HIGH | No `invoiced ≤ shipped` guard; from-job invoices copy lines at $0 → validator rejects over-shipped quantity | xU |
| P06-6 | MED | Invoice lines immutable; from-job created at $0 with no edit path → `PUT /invoices/{id}` with line edit | Int |

### Payments
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| P06-5 | MED | No void/refund and no amend (delete-only, no audit trail) → `PUT /payments/{id}` (amend) + `POST /{id}/void` (reversal w/ reason) | Int |

### Customer Returns (RMA)
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| P06-11b | MED | RMA never re-credits inventory (`CreateCustomerReturn` doesn't restore `BinContent`) → restitution call on restock approval | EF |
| G-37-RMA-1/2 | MED | Cap-OFF: "New Return" enabled + list 403 silently → explained-unavailable (shared fix) | Cy |
| P06-11d | LOW | `OnCustomerReturnReceived_UpdateSO` is misnamed + binds `OriginalJobId` as `SalesOrderId`; doesn't update SO → rename + fix binding (or remove if not intended) | xU |
| P06-11c | LOW | No `DELETE /customer-returns/{id}` → add with authz (creator\|Manager) | xU |

### Expenses
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-EXP-01 | **BLOCKER** | Approval ungated at every layer (no role gate, no owner check, approve buttons always shown) → role/ownership gate + route through `ApprovalService`; block self-approval | Int+Cy |
| F-EXP-02 | HIGH | List not owner-scoped (UI passes `undefined` userId) → server scopes non-managers to own rows; admin sees all | Int |
| F-EXP-03 | HIGH | Reimbursement lifecycle missing (no `UnderReview`/`Reimbursed`) → add states + transitions + UI + AP/QBO sync point | Int |
| F-EXP-06 | HIGH | Delete has status guard but no ownership check → add `expense.UserId==caller \|\| isManager` | xU |
| F-26B-01 | HIGH | Expense has no vendor/payee link full-stack → add `VendorId`/`PayeeId` FK + vendor picker | Int |
| F-26B-02 | HIGH | Expense→QBO posts as a vendorless cash purchase (no `VendorRef`) → set `VendorExternalId` from the FK | Int |
| F-EXP-04 / F-13-BE-07 | MED | `allowSelfApproval`/`autoApproveThreshold` persisted but never enforced → enforce in Create + UpdateStatus handlers | xU |
| F-EXP-05 / F-26B-05 | MED | Dual approval source of truth (status field vs `ApprovalService` diverge) → unify on `ApprovalService` | Int |

---

## Region 3 — Operations

### Kanban
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| K-F3 | **BLOCKER** | Bulk stage-move bypasses `IsIrreversible` **and** skips `JobStageChangedEvent` (SO/ship/notify lost) → add guard + emit event before commit | EF+Int |
| K-F13 | **BLOCKER** | `explode-bom` authGuard-only — creates child jobs/links/reservations with no role/ownership check → require Admin/Manager + assignee check | Int |
| K-F15 | **BLOCKER** | `PUT /jobs/{id}` authGuard-only — anyone reassigns any job → Admin/Manager + ownership gate | Int |
| K-F2 | HIGH | Panel status chip bypasses the board's irreversible guard into accounting stages → client `isIrreversible` check + server validation (single+bulk) | Int+EF |
| K-F14 | HIGH | `dispose` authGuard-only — creates Asset with no role/ownership check → Admin/Manager + assignee check | Int |
| F-JQ1 | HIGH | Job advances through completion with open NCRs / failed inspections / unresolved CAPAs → `MoveJobStage` rejects on open quality state | EF |
| K-F6 | MED | `handoffToProduction` dead UI (endpoint, no caller) → build entry point or remove the method | Int |
| K-F7 | MED | Custom field values dead UI (GET/PUT unwired) → add panel section or defer | Int |
| K-F1/F2/F5 | LOW | Stage-move / position-update errors swallowed (bare `.subscribe()`) → error callbacks + snackbar | Cy |
| K-F4 | LOW | Swimlane reorder updates array only, never persists → call `updateJobPosition` | Int |
| K-F8/F9 | LOW | `updateJobPart` + material *issue* half-built (cost tab has return only) → wire inline edit + issue button | Cy |
| K-F12 | LOW | `JobCostService` hardcodes `baseUrl='/api/v1'` vs `environment.apiUrl` → align | Int |

### Planning Cycles
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| P-F6 / G-38-MRP-3 | **BLOCKER** | All cycle mutations reachable by ProductionWorker (no role gate); live POST→201 → `[Authorize(Roles="Admin,Manager")]` on every mutation + route guard | Int |
| P-F1 | HIGH | Complete-cycle Cancel still rolls over (guard is `=== undefined`, dialog returns `false`) → `if (!confirmed) return;` | Cy |
| P-F2 | MED | State-machine gaps: Complete skips Active; commit/remove on Completed → add transition guards in handlers | EF |
| P-F3 | MED | Cycle mutations have no error callback → handlers set `saving=false` + snackbar | Cy |

### Scheduling
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| S-F8 | HIGH | `direction=Backward` silently produces forward scheduling (handler ignores it) → honor Backward; add backward tests | EF |
| S-F2/F3 | MED | `rescheduleOperation` + `simulateSchedule` dead UI → build pickers/confirm or remove methods | Int |
| S-F5/F6 | MED | Work-center + shift CRUD dead UI → document master-data home, or build mgmt UI | Int |
| S-F4 | LOW | `priorityOptions` defined but unbound; `executeSchedule` hardcodes Forward/DueDate → wire the select | Cy |
| S-F7 | LOW | `getWorkCenterLoad` never populated/rendered → populate + render summary | Cy |
| S-F1 | LOW | "Gantt" tab is a sortable table, not a Gantt → rename "Schedule" (timeline is a phase-2 enhancement) | man |
| S-F9 | LOW | `SchedulingService` hardcodes baseUrl → align to `environment.apiUrl` | Int |

### Shop Floor
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| SF-10 | **BLOCKER** | `clock` accepts `userId` with device-token-only auth (no PIN/ownership) → require supervisor PIN or tether to scanned-worker JWT | Int |
| SF-04 | **BLOCKER** | `complete-job` jumps to final stage, no role gate, irreversible → Admin/Manager + one-step progression / supervisor approval | Int |
| SF-05 | **BLOCKER** | `assign-job` no role/ownership gate (any user steals any job) → Admin/Manager + ownership | Int |
| SF-01 | HIGH | `/display/shop-floor/scan` auth gap (device-token insufficient, no PIN) → add PIN step / `[KioskTerminalAuth]+[AllowAnonymous]` | Int |
| SF-07 | HIGH | `ScannerController` mutations (move/count/receive/issue/reverse) ungated → per-endpoint Admin/Manager (or supervisor scope) | Int |
| SF-02 | HIGH | Scan-Return emits data with no API call (return discarded) → build/wire `POST /scanner/return` | Int |
| SF-03 | HIGH | Scan-Ship passes *line* ID to `shipShipment` (expects shipment ID) → resolve shipment ID first | Int |
| SF-08 | MED | Scan-Inspect omits `partId` → pass it in `createInspection` | Int |
| SF-09 | MED | `GET /scanner/log` 401s in the public kiosk `/scan-log` → `[AllowAnonymous]+[KioskTerminalAuth]` | Int |
| SF-06 | MED | `validate-pin`/`reverse-action`/`job-validations`/`scan-validations` are dead (404) → remove methods or implement | Int |

### Time Tracking
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| TT-04 | **BLOCKER** | `GET /time-tracking/entries` returns *all users'* entries to any caller → scope non-managers to own; admin via `?userId=` | Int |
| TT-01 | HIGH | `DELETE/PATCH entries/{id}` have no ownership check (IDOR) → `entry.UserId==caller` for non-managers | Int |
| TT-02 | MED | Admin pay-period/corrections/overtime not surfaced (endpoints exist) → build admin tab, or document external | Cy |
| TT-03 | MED | `timer/start|stop` ungated (userId from JWT, so low-risk) → add explicit role attr or document intent | Int |

### Worker
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| W-01 | HIGH | `getMyTasks(assigneeId)` trusts caller-supplied id (IDOR) → enforce `assigneeId==caller` for non-managers | Int |

### OEE
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| OEE-01 | HIGH | OEE reads ProductionRuns/DowntimeLogs but `complete-job` writes JobStages and `CreateProductionRun` never sets `WorkCenterId` → Perf/Quality structurally 0 → bridge completion→ProductionRun + set WorkCenterId | Int |
| OEE-02 | HIGH | No downtime-create UI anywhere (DowntimeLogs unfeedable) → build a downtime-create surface | Cy |
| OEE-03 | LOW | `/oee` route ungated though controller needs `CAP-RPT-OPERATIONAL` → add route guard / explained-unavailable | Int |
| OEE-04/05 | LOW | `getOeeByWorkCenter` + `MockOeeService` are dead → remove (or use for a single-WC view) | man |

### Quality
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| Q-01 | HIGH | Inspection is create-only; results/status never recordable (`updateInspection` orphaned) → build results-entry surface + wire update | Cy |
| Q-03 | HIGH | Quality mutations authGuard-only; `CreateCapaTask` needs Admin/Manager but `UpdateCapaTask` doesn't (inconsistent) → consistent role gate across all quality mutations | Int |
| EX-32-08 | HIGH | `/quality` route exists but **0 refs in `nav-tree.service.ts`** — whole module unreachable from the sidebar → add nav entry (role-scoped) | Cy |
| Q-02 | MED | QC templates have no create UI (consume-only) → build template mgmt, or document admin-seeded | Cy |
| Q-04 | LOW | `/quality` has no per-tab cap guard → cap-OFF tab 403s silently → per-tab explained-unavailable (shared fix) | Cy |
| Q-05 | LOW | `createInspection` never sends `productionRunId`; `DowntimeLogResponseModel` omits WC/Category; hardcoded baseUrls → wire run picker + add fields + align URLs | Int |

### MRP
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| G-38-MRP-1 | **BLOCKER** | MRP page **freezes** (infinite effect loop) when `CAP-PLAN-MRP` OFF → route guard / `untracked()` signal guard | Cy |
| MRP-03 | MED | `ApplyForecastToMps` has no approval-state guard (Draft can be applied) → require `Approved` | EF |
| MRP-04 | LOW | `UpdatePlannedOrder` has no status precondition (Released/Cancelled still firmable) → state-machine guard | EF |
| MRP-02 / G-38-MRP-2 | LOW | `/mrp` route ungated; "Run MRP" fails silently cap-OFF → route guard + error snackbar | Int |

### Assets
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| AS-03 | MED | Status PATCH has no state-machine guard (any→any, incl. from Retired) → valid-transition check | EF |
| AS-01 | MED | No `GET /assets/{id}` (detail fetches list+find) → add single-asset endpoint + service method | Int |
| AS-02 | MED | PM maintenance-schedule mgmt is backend-only → build schedule UI, or document backend-only | Cy |

### Maintenance (Predictive)
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| MAINT-01 | **BLOCKER** | Predictive-maintenance is a no-op mock bound in **all** envs; no ingest endpoint → store unpopulatable in prod → implement real service+ingest, or remove the feature+page (decide + document) | Int |
| MAINT-02 | MED | Resolve/false-positive/acknowledge have no status precondition or role gate (terminate at mock) → add preconditions + Admin/Manager once real | Int |
| MAINT-03 | LOW | Dashboard KPI strip returns hardcoded 5/1/0.89 contradicting the empty table → compute real KPIs once real; document as stub until then | Int |

---

## Region 4 — Platform

### Dashboard
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-10-DASH-01 | HIGH | Margin-summary widget visible to all roles; API 403s silently → role-hide the widget | Cy |
| F-10-DASH-02 | LOW | `GET /dashboard/layout` never called → wire it on layout load, or remove | man |
| F-10-BE-05 | LOW | EOD prompt responses are localStorage-only (no backend / manager visibility) → add endpoint + manager view | Int |

### Reports
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-10-RPT-03 | HIGH | Report schedule delivery dead end-to-end (write-only entity, no executor, no UI) → add Hangfire delivery job + schedule CRUD UI | Int+Cy |
| F-10-RPT-01 | MED | OfficeManager blocked by UI route guard though server permits → add OfficeManager to the guard | Cy |
| F-10-RPT-02 | MED | XLSX/PDF export unreachable (only client CSV) → wire server export endpoints; warn on PDF 15-col cap | Int |
| F-10-RPT-04 | MED | 100-row silent truncation; UI never sends page/pageSize → add pagination controls + param | Cy |
| F-10-RPT-05 | MED | 3 report endpoints (win-loss-by-class, time-by-operation, job-profitability) have no UI → add entries + service methods | Cy |
| F-10-BE-02 | LOW | `GroupByField`/`SortField` have no server whitelist → validate against the column catalog | xU |
| F-10-BE-03 | LOW | No execution timeout on dynamic report queries → add `CommandTimeout` + CT | xU |

### Search
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-10-SRCH-02 | LOW | SQL search has no per-role entity-ownership filter → add role scoping (parallel to the AI path) | xU |
| F-10-SRCH-01 | LOW | `expense` missing from `getDetailType()` → no detail dialog on click → add the case | Cy |

### Notifications
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-11-NOTIF-02 | MED | Routed notifications page double-stacks the tab filter; bell state bleeds → consume the raw signal in the routed page | Cy |
| F-11-NOTIF-03 | LOW | Email notification prefs stored but never acted on → wire delivery consumer to check prefs | Int |

### Chat
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-11-CHAT-01 | LOW | Dual hub connections when panel + popout both active → coordinate a singleton connection | Cy |
| F-11-CHAT-02 | LOW | Channel messages use legacy `/rooms` endpoints → standardize on `/chat/channels/{id}/messages` | man |

### Approvals
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-11-BE-01 | HIGH | `ApproverType.Manager` stub returns false → Manager-step requests silently black-holed → implement resolver (depends on Users `ManagerId`) | xU |
| F-11-BE-02 | HIGH | No notification on any approval transition; inbox is 100% pull → `CreateNotificationCommand` + SignalR push on submit/approve/reject/delegate/escalate | Int |
| F-12-AUDIT-01 | HIGH | Approval transitions never written to the audit log → base on `BaseAuditableEntity` or explicit audit writes | xU |
| F-11-APPR-01 | MED | Delegation UI absent → add Delegate button + dialog | Cy |
| F-11-APPR-02 | LOW | No delete-workflow capability (stale workflows accumulate) → add DELETE + UI | xU |

### Calendar
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-11-CAL-02 | MED | PO delivery events display-only → wire click→PO detail | Cy |
| F-11-CAL-01 | LOW | Calendar silently truncates at 200 jobs → paginate / lift the cap | Cy |

---

## Region 5 — Admin + Account

### Admin Core / Settings
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-12-BE-01 / BE-1 | **BLOCKER** | `working-calendars/:id/set-default` → 500 (non-atomic swap, unique `is_default`) → clear+set in one transaction (cf. `ExecuteUpdateAsync`) | xU |
| F-12-BE-02 | HIGH | `CompanyLocation` set-default shares the same latent non-atomic swap → same fix | xU |
| F-12-BE-07 | HIGH | Exchange-rate `convert` is a silent 1:1 stub in financial paths → real FX from persisted rates, or gate 2nd-currency creation | xU |
| F-12-BE-08 | LOW | Kiosk device token has no entropy floor / rotation / expiry → server-generate (CSPRNG) + rotation + last-seen | Int |
| F-12-AUTHZ-01 | LOW | Manager/OfficeManager reach `/admin/users` URL without redirect (content is gated) → redirect to a permitted tab | Cy |

### Users
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-12-USR-01 | HIGH | No user manager / reporting-line settable or persisted → add `ManagerId` to `ApplicationUser` + selector (prereq for Approvals `F-11-BE-01`) | xU+Cy |

### Reference Data
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-12-TAR-01 | LOW | Tariff create has no overlap/duplicate guard → temporal-overlap validator per (HtsCode, CountryOfOrigin) | xU |

### Capabilities / Presets / Discovery
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-13-CAP-01 | MED | Capability config view+edit is UI-dead → add view component + edit dialog (`setConfig`, show `configETag`) | Cy |
| F-13-CAP-02 | LOW | Preset apply not atomic across caps+bundles → wrap in one transaction + compensating rollback | Int |
| F-13-CAP-03 | LOW | Preset apply 500s on unknown id (vs 404) → catch `KeyNotFoundException` → 404 | xU |
| F-13-CAP-04 | LOW | `/capabilities/{id}/relations` readable by any authed user → `[Authorize(Roles="Admin")]` | xU |
| F-13-CAP-05 | LOW | Discovery alt-preset preview shows recommended, not the alt's deltas → fix preview logic | Cy |

### EDI
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-13-BE-01 | MED | Mapping mgmt API+service complete, no UI → add a mapping CRUD sub-tab to `EdiPanel` | Cy |
| G-39-EDI-1 | MED | Cap-OFF: EDI panel renders with no banner → explained-unavailable (shared fix) | Cy |

### MFA
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| G-MFA-3 | **BLOCKER** | TOTP HMAC keyed on UTF-8 bytes vs the base32 QR secret → authenticator codes never match; enrolment broken → base32-decode before HMAC (golden-vector test) | xU |
| F-13-MFA-01 | MED | No persistent MFA-policy entity (RequiredRoles not stored) → add `MfaPolicy` entity + GET + persist | xU |
| F-13-MFA-02 | MED | Enforcement flag stale-by-design (role change / new user not enforced until admin re-saves) → recompute on role change + user create | Int |
| F-13-MFA-03 | LOW | `SetMfaPolicy` is N+1 (loads all users + per-user roles) → single-query role join | xU |

### Announcements
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-13-ANN-01 | MED | Announcements are create-only (no edit/retract) → add UPDATE + RETRACT/DELETE + UI | xU |
| F-13-ANN-02 | MED | Announcement templates have no edit → add UPDATE + edit dialog | xU |
| G-39-ANN-1 | MED | Cap-OFF: panel renders with no banner; Managers (intended authors) have no toggle path → explained-unavailable (shared fix) | Cy |
| F-13-ANN-03 | LOW | Dead `severityFilter` FormControl → remove | man |

### Events
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-13-EVT-01 | LOW | "Cancel Event" notification promise unfulfilled → dispatch notification in `DeleteEventHandler` | Int |

### BI API Keys
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-13-BI-01 | MED | Key scoping is backend-only — every product-issued key is unscoped → add `AllowedEntitySets`/`AllowedIps` to the create dialog | Cy |
| G-39-BI-1/2 | MED | Cap-OFF: BI panel renders with no banner / no dep-chain context (403 names the dep, API-KEYS) → banner + dep guidance (shared fix) | Cy |

### AI Assistants (admin)
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| G-39-AI-1/2 | MED | Cap-OFF: admin AI panel + `/ai/:id` route render empty with no guard/banner → route guard + explained-unavailable (shared fix) | Cy |

### Account self-service
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-14-FS-05 | MED | MFA challenge contract drift (`mfaService` sends `userId` not the pending token; reads non-existent `mfaUserId`) → use `mfaPendingToken` (see Auth `F-15-FS-01`) | Cy |

### Payroll
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-14-BE-02 | **BLOCKER** | `OvertimeRule.IsDefault`: EF-tracker clear + filtered unique constraint races → use `ExecuteUpdateAsync` atomic swap | EF |
| F-14-FS-04 | HIGH | Payroll sync is a silent no-op in prod (QBO stubs return empty + `LogWarning`, 200/count:0) → implement, or fail loudly (501) | Int |

### Training / LMS
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-14-BE-01 | HIGH | Training-path write API absent (admin dialog POST/PUT/DELETE `/training/paths` → 404; API is GET/seed-only) → add create/update/delete/path-modules handlers | xU |
| F-14-BE-03 | MED | `TrainingProgress` excluded from the audit log (all activity invisible) → remove from `AuditExcludedTypes` or add explicit activity writes | EF |
| G-39-TRN-1 | MED | Cap-OFF: training nav persists; detail shows "Module not found" (= bad-id) → route guard + explained-unavailable (shared fix) | Cy |

### Compliance Forms
_(source-complete; DocuSeal is a D4 environment terminal, not a defect — no rows)_

---

## Region 6 — Access + Edge

### Auth / Login
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-15-FS-01 | **BLOCKER** | MFA login double contract mismatch — backend returns `mfaPendingToken`, UI reads `mfaUserId`; UI sends `userId`, backend expects `mfaPendingToken` → fix both directions (login + mfa.service + challenge) | Cy |
| F-15-FS-03 | MED | SSO `domain_not_permitted` error silently swallowed → explicit branch + snackbar | Cy |

### Onboarding / Setup
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-15-FS-02 | HIGH | `/setup/integrations` shadowed by the `setup/:token` catch-all (route order) → reorder routes (static before param) | man |
| F-15-FS-04 | HIGH | DocuSeal `isMock` not surfaced — mock signing "passes" silently → render a warning when mode is Mock | Cy |
| F-15-FS-07 | LOW | `SetupIntegrationsComponent` uses raw `fetch()` (bypasses interceptors); completion not persisted → `HttpClient` + `wizard-complete` endpoint | Int |

### Customer Portal
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-15-FS-06 | MED | Portal cap-gate not enforced UI-side (`PortalLogin` renders regardless of `CAP-EXT-CUSTOMER-PORTAL`) → pre-check cap + friendly unavailable message | man |

### Mobile
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-15-FS-05 | LOW | `MobileHomeComponent` is unrouted dead code → delete | man |

### AI Assistant
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-15-FS-08 | LOW | `AiService.ragHelpChat()` has a stale contract (text vs JSON `{answer}`), method unused → delete or reconcile | man |

---

## Region 7 — Cross-cutting (treat each as a feature)

### Navigation shell + capability coherence — **the phase-40 "NO" verdict**
Fix these three and the per-feature "cap-OFF silent dead-end" rows above all resolve together.

| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| N-E3 | HIGH | `NavTreeService.filterTree()` filters by role only — sidebar advertises cap-OFF features → filter against `CapabilityService.isEnabled(cap)` | Cy |
| P-F4 | HIGH | `*appCap` clears the DOM silently — cap-OFF pages show chrome + empty table + generic "no data" → ship a shared explained-unavailable state (`*appCapNot` / feature-disabled component) on every cap-gated route | Cy |
| G-E2 | HIGH | Mutating dialogs fail silently on a cap-OFF 403 → intercept `CapabilityDisabledError` → disable entry w/ tooltip or explained-unavailable | Cy |
| EX-32-47 | MED | `/notifications` + `/chat` exist but have 0 sidebar refs (header-only) → add sidebar entries (the capability story should be complete) | Cy |
| G-39-EMAIL-1/3 | LOW | `GET /communications/connections` returns 200 cap-OFF (read-leak); banner interpolates the raw cap code → gate the GET + plain-language i18n | Int |

### Shared components (design-system spine)
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-16-HEADLINE / EX-32-01 | HIGH | Two competing dialog patterns — inline `app-dialog` (~121, has draft/dirty/validation) vs CDK `MatDialog` (~78, doesn't) → render `DialogComponent` body inside the MatDialog host so the affordances are uniform; document + lint the partition | man+Cy |
| EX-32-05 | MED | `unsavedChangesGuard` has 0 consumers; edit forms lose data on backdrop/ESC → wire `canDeactivate` on form routes + `[dirty]`/`[draftConfig]` on edit dialogs | Cy |
| F-16-orphans | MED | Orphan/duplicate shared components (`KanbanColumnHeader`, `MarkdownView` vs `RichTextDisplay`, `VirtualScrollList`, `DetailSidePanel`/`Slideout` overlap, `ListPanel`, `MiniCalendarWidget`, `StepRationale`, `ProductionLabel`) → delete, or wire the strategic one (e.g. virtual-scroll into data-table) | man |
| EX-31-14 | LOW | PO dialog has 3 hardcoded error hex → use `--error*` tokens | man |
| EX-31-L02 | LOW | `/leads/accounts` uses `page-layout`+`toolbar` vs siblings' `page-header` → migrate to `page-header` | man |

### Shared services / guards / directives
| ID | Sev | What → fix | Test |
|----|-----|-----------|------|
| F-17-01 | MED | `authInterceptor` refresh race (module-level `isRefreshing`) — concurrent 401s force premature logout → buffer requests in a queue during refresh | xU |
| F-17-02 | MED | `ScanContext` name collision (entity-context interface vs UI-scope union) → rename one (`ScanEntityContext` / `ScanScope`) | man |
| F-17-05 | LOW | `SnackbarService` vs `ToastService` — `httpErrorInterceptor` routes errors inconsistently → consolidate the error-display path | Int |
| F-17-03 | LOW | `roleGuard` role lists hardcoded/duplicated 26+× in routes → centralize as a config map | man |
| F-17-06/07 | LOW | Two cross-tab `BroadcastChannel` services; deprecated `ValidationPopoverDirective` still present → consolidate / remove | man |

### WCAG 2.2 AA (shared-component a11y) — contract violations (`test:a11y` gate)
| ID | Sev | SC | What → fix | Test |
|----|-----|----|-----------|------|
| SYS-01 | **BLOCKER** | 2.1.2 | `app-dialog` doesn't trap focus (0/12) → `cdkTrapFocus` + `cdkFocusInitial` + focus restore on ESC | axe |
| B1-N01 | **BLOCKER** | 1.3.6 | sidebar has no `role="navigation"`/`aria-label` → add nav landmark | axe |
| B1-N04 | **BLOCKER** | 2.4.1 | skip link not first in tab order → move before `app-sidebar` | axe |
| B1-S01 | **BLOCKER** | 4.1.2 | global search input has no accessible name → `aria-label="Search"` | axe |
| B2-K01 | **BLOCKER** | 2.1.1 | kanban has no keyboard alternative to drag → Space/Arrow move or "Move to…" select | Cy |
| B3-C01/C02 | **BLOCKER** | 1.1.1 / 2.1.1 | drillable chart canvas: no `role=img`/label/describedby, not focusable, pointer-only drill → add img role + label + `tabindex=0` + Enter/Space drill | axe+Cy |
| SYS-02 | HIGH | 4.1.3 | validation-button count change not announced → `role="status" aria-live="polite"` | axe |
| B1-N02/N03 | HIGH | 4.1.2 | active nav item has no `aria-current`; group buttons no `aria-expanded` → add + toggle | axe |
| B1-S02/S03 | HIGH | 4.1.2 / 2.1.1 | search missing combobox pattern + arrow-key nav → full combobox ARIA + keydown handler | axe+Cy |
| B1-T01 | HIGH | 1.3.1 | `app-data-table` has no `aria-label`/`<caption>` → add both | axe |
| B2-K02 | HIGH | 4.1.2 | board columns/drop-lists have no role/label → `role=group`/`list` + stage labels | axe |
| B2-SF01 | HIGH | 2.4.7 | kiosk inputs have no focus ring (4 routes) → restore `:focus` outline | Cy |

---

## Excluded — deliberately not doing

Recorded so the net-benefit decision is explicit. These are net-neutral or net-negative (cruft / by-design / false-positive / out-of-scope).

| Item | Why excluded |
|------|--------------|
| Read-path split (SO-2), Job-projected SO list | By design (perf); document, don't "fix" |
| Margin read-only (Q-4) | By design; doc-only correction |
| Currencies no hard-delete / append-only FX (F-12-CUR-01) | Intentional immutable FX history (distinct from the `convert` stub, which *is* fixed) |
| Time-corrections no staged approval (F-13-BE-06) | Admin-direct edit is the intended model |
| Track-type stages full-PUT only (F-12-TT-01), terminology bulk-replace (F-12-TERM-01) | Functionally complete; UI matches |
| `F-11-NOTIF-01` "missing data wrapper" | False positive — controller already wraps in `{ data }` |
| Escalation job dormant (F-11-APPR-03), Events service convenience methods | Confirmed live / present-by-design |
| ICP rubrics "API-only" (C1) | False premise — full admin UI exists |
| §G usage-map / model-export drift (F-16-§2, F-17-08) | Doc-consistency task, not a code fix |
| `WorkflowShellDemo` (F-15-FS-09), `demo-*` util placement (F-17-04) | Dev-demo / low-value hygiene; out of scope |

> Customer **statement** + contact **outreach-preferences** endpoints with no
> master-data UI consumer are *pending cross-region verification* (likely
> accounting/Q2C consumers) — confirm before either wiring or deleting.
