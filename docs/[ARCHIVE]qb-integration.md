# Accounting Integration

## Architecture
The accounting integration is **pluggable**. All accounting operations go through `IAccountingService` — a common interface that defines operations for customers, invoices, estimates, POs, payments, time activities, employees, vendors, and items.

**QuickBooks Online is the default and primary provider.** Additional providers (Xero, FreshBooks, Sage, etc.) can be added by implementing the same interface. The app also works in **standalone mode** with no accounting provider configured.

`AccountingServiceFactory` resolves the active provider from `system_settings.accountingProvider`. Each provider owns its auth flow, API client, and DTO mapping — the rest of the app only sees `IAccountingService`.

## QuickBooks Online Provider (Default)
- QB Online REST API via OAuth 2.0
- Single shared company-level connection (one admin authorizes, all users benefit)
- App avoids data duplication — reads/writes QB for financial entities
- Mock layer: MOCK_INTEGRATIONS=true swaps HTTP client to return local JSON fixtures

## Adding a New Accounting Provider
1. Create a new folder under `Integrations/Accounting/Providers/{ProviderName}/`
2. Implement `IAccountingService` with provider-specific API calls
3. Implement the provider's auth flow (OAuth, API key, etc.)
4. Map provider-specific DTOs to/from the common accounting models
5. Register the provider in the DI container with a provider key
6. Add provider-specific setup steps to the admin wizard UI

## ⚡ Accounting Boundary — What Lives Where

The `⚡ ACCOUNTING BOUNDARY` marker is used throughout all spec documents to identify features that behave differently depending on whether an accounting provider is connected. This is the authoritative boundary definition.

### Always in Our App (regardless of mode)
- Kanban board state (stage, position, track type)
- Job card operational fields (assignee, priority, due date, machine)
- **Sales Orders** (app-owned, synced to accounting as Sales Orders/Estimates)
- **Quotes/Estimates** (app-owned, synced to accounting as Estimates)
- **Shipments** (app-owned, triggers Invoice creation in accounting system)
- **Price Lists & Quantity Breaks** (app-owned, no accounting equivalent)
- **Recurring Order Templates** (app-owned, generates SOs)
- **Customer Addresses** (app-owned, multi-address model)
- File attachments and revision history
- Activity log / status change history
- R&D iterations and test notes
- Leads (pre-customer, not in accounting until conversion)
- Assets/equipment registry
- Maintenance cards
- Planning cycle/backlog management
- Dashboard preferences and daily priorities
- User accounts and roles
- Production traceability (lot tracking, QC records)
- Custom track types and custom fields
- **Margin calculations** (estimated from app-owned cost/revenue data)

### In Accounting System When Connected — In Our App When Standalone
These features are **⚡ accounting-bounded**. They exist locally in standalone mode and defer to the accounting system when connected:

| Feature | Standalone Mode | Integrated Mode |
|---------|----------------|-----------------|
| **Invoices** | Local CRUD, PDF generation, email | Created in accounting system from shipments; read-only cache locally |
| **Payments** | Local recording, application to invoices | Recorded in accounting system; read-only cache locally |
| **AR Aging** | Computed from local invoices/payments | Read from accounting system reports |
| **Customer Statements** | Generated from local data | Generated from accounting system data |
| **Sales Tax** | Simple per-customer rate, local tracking | Accounting system handles tax calculation |
| **Financial Reports** (P&L, revenue, payment history) | Computed from local invoices/expenses | Disabled — use accounting system reports |
| **Vendors** | Full local CRUD | Read-only from accounting system sync |
| **Credit Terms** | Stored locally on customer | Synced from accounting system |

### Always in Accounting System (read/write via API when connected)
- General ledger / chart of accounts
- Bank reconciliation
- Payroll and payroll taxes
- Full income statements / balance sheets
- Accounts payable (beyond PO tracking)
- Multi-jurisdiction tax automation
- Employee payroll records
- Time Activities (drives payroll — app writes, accounting system owns)
- Check writing
- 1099 / tax form generation

### Never in Our App (regardless of mode)
- General ledger / bookkeeping
- Payroll tax calculations (FWT, SWT, SS, Medicare)
- Bank account reconciliation
- Depreciation schedules
- Full accrual-basis accounting
- Check printing
- Multi-entity consolidation

## Accounting Identifier Storage
Every entity with an accounting system counterpart stores:
- `external_id` (string) — the provider's unique identifier (QB ListID/TxnID, Xero ContactID, etc.)
- `external_ref` (string) — human-readable reference (QB FullName/RefNumber, Xero contact name, etc.)
- `provider` (string) — which accounting provider this ID belongs to

## Sync Queue
- All accounting write operations go through a persistent queue
- Queue processes immediately when the accounting system is available
- If the accounting system is down, operations queue up, app continues working
- Retries with backoff, flags failures in system health panel after X attempts
- Queue record: entity type, entity ID, operation, payload, status, attempt count, error, timestamp

## Accounting Read Cache
- Accounting data cached locally in Postgres with last_synced timestamp
- App reads from cache first, background sync refreshes periodically
- If the accounting system is down, cached data is stale but usable
- Cache staleness shown in system health panel

## Orphan Detection
- Background job runs periodically (configurable: hourly/daily)
- Compares QB lists against stored IDs
- Orphaned references flagged in system health panel
- Resolution: re-link, archive, or dismiss

## OAuth Token Management
- Access token expires hourly — auto-refresh
- Refresh token expires after 100 days — system health warning before expiry
- Admin re-authenticates when refresh token expires
- Tokens stored encrypted in database

## Stage-to-Accounting Document Mapping (QuickBooks Online)
| Stage | QB Document |
|---|---|
| Quoted | Estimate |
| Order Confirmed | Sales Order |
| Materials Ordered | Purchase Order(s) |
| Shipped | Invoice |
| Payment Received | Payment |

## Card Movement + Accounting Rules
- Forward moves into accounting-linked stages trigger API calls via `IAccountingService`
- Backward moves check for irreversible accounting documents downstream
- Irreversible: Invoice, Payment — drag blocked
- Reversible: Estimate, Sales Order, unfulfilled PO — double confirmation to void
- Voiding confirmation shows: document type, ref number, customer, dollar amount
- In standalone mode (no accounting provider): all card movements are free, no document creation

## Billing Visibility
- Job card shows collapsed "Billing Status" section
- **Integrated mode:** Deposits received, progress billed, remaining balance, payment status — all read from accounting system cache, no edit capability
- **Standalone mode:** Invoice status, amount invoiced, amount paid, balance due — read from local invoice/payment tables, editable via invoice/payment screens

## Standalone Mode Activation
- Default: standalone (no accounting provider configured out of the box)
- Admin connects an accounting provider in Settings → Integrations → Accounting
- On first connect: migration wizard offers to sync existing local invoices/payments/vendors to the accounting system
- On disconnect: local tables retain last-synced data as the working baseline
- `system_settings.accountingProvider` = `null` means standalone mode
- Feature flags in Angular check `AccountingService.isStandalone` signal to show/hide financial UI sections
- .NET controllers check `IAccountingService.IsConfigured` to enable/disable financial endpoints
