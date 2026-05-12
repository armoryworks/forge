# Legacy Application Comparison — Armory Plastics Access DB

> Contrasting analysis of the legacy Microsoft Access application (`ArmoryBusines.accdb`) against Forge. This document maps legacy functionality, identifies inefficiencies, and flags areas where naive migration could introduce usability problems.

Updated: 2026-03-12

---

## Legacy Overview

**Platform:** Microsoft Access (.accdb), single-file desktop database
**Business:** Armory Plastics LLC — thermoforming and injection molding of custom holsters, sheaths, and plastic parts
**Users:** ~5 (Office staff + owner)
**Data volume:** ~9,000 ledger entries, ~300 products, ~300 orders, ~160 supplies, ~45 suppliers, ~41 customers, ~44 projects
**Time span:** Data from 2016–2025

The legacy app is a monolithic Access database handling orders, products, suppliers, supplies/raw materials, project management, financials (daily ledger), customer management, invoicing, and purchase orders. It uses Access forms for data entry and reports for output.

---

## Table-by-Table Analysis

### 1. Customers — `CustomerBillToT` / `CustomerShipToT`

**Legacy:** Two separate tables for bill-to (41 rows) and ship-to (41 rows) addresses. Identical column structure (company, contact, address, city, state, zip, phone, web, email, notes, tax exemption cert). Linked by company name (text), not by ID. A single customer has entries in both tables with matching `Company` text.

**Forge:** Single `Customer` entity with one address set. Contacts are a separate `Contact` entity linked by FK.

**Key Differences:**
| Aspect | Legacy | Forge |
|--------|--------|-------------|
| Bill-to / Ship-to split | Two separate tables | Single entity (needs ship-to address support) |
| Primary key | Company name (text) | Integer auto-increment |
| Contact model | Embedded in customer row | Separate Contact entity (many-per-customer) |
| Tax exemption | Attachment field (cert file) | Not yet implemented |
| Linking | Text match on company name | Foreign key integer |

**Migration Caution:**
- The bill-to/ship-to split is unnecessary complexity. Forge correctly uses a single customer entity. If multi-address support is needed, add an `addresses` collection — do NOT replicate two parallel tables.
- Company name as primary key caused data integrity issues in the legacy app (typos like "Fee to Custmer" vs "Fee to Customer" appear in product data). Forge's integer FK approach is correct.
- Tax exemption certificate storage can be handled via `FileAttachment` (already built).

---

### 2. Products — `ProductT`

**Legacy (300 rows):** Products with name, SKU, category (Injection/Thermoform/Re-sale/Sample), customer assignment (ship-to + bill-to by name), stock tracking (in-stock qty, goal stock, kept-in-stock flag), picture (attachment), location, directions, notes, products-per-box.

**Forge:** `Part` entity with part number, description, revision, status, type, material, BOM entries.

**Key Differences:**
| Aspect | Legacy | Forge |
|--------|--------|-------------|
| Naming | "Product" | "Part" |
| Customer binding | Product locked to one customer | Parts are customer-agnostic |
| Stock tracking | In ProductT (qty, goal, kept-in-stock) | Separate Inventory module (StorageLocation, BinContent) |
| Pricing | Separate annual price table | Not yet implemented |
| BOM | Junction table (ProductSuppliesJunctionT) | BOMEntry entity |
| Pictures | Access attachment field | FileAttachment (MinIO) |
| Categories | 6 text values | PartType enum + reference data |

**Migration Caution:**
- Legacy products are customer-specific (each product "belongs to" one customer). Forge parts are customer-agnostic and linked to jobs. This is intentional — a part can be used across multiple customers/jobs. Do NOT add customer FK to Part.
- Legacy embeds stock tracking into the product table. Forge correctly separates this into the Inventory module. Do NOT collapse inventory fields into Part.
- The `ProductDirections` field (manufacturing instructions) maps well to Part's description or a future work instructions field.
- `ProductsPerBox` is packaging metadata — consider adding to Part if needed, but not high priority.

---

### 3. Product-Supplies BOM — `ProductSuppliesJunctionT`

**Legacy (601 rows):** Links products to supplies (raw materials) with quantity used, wrap cut size, length cut size, and bead weight. This is effectively a Bill of Materials.

**Forge:** `BOMEntry` entity linking parent Part to child Part with quantity.

**Key Differences:**
- Legacy BOM links Products to Supplies (different entity types). Forge BOM links Parts to Parts (unified model).
- Legacy has manufacturing-specific fields (WrapCut, LengthCut, BeadWeightOZ) that are domain-specific to thermoforming. These are better modeled as custom fields or part metadata rather than fixed BOM columns.
- Legacy uses text names as keys ("Supplies" = supply name, "ProductName" = product name). Extremely fragile.

**Migration Caution:**
- Do NOT add domain-specific BOM fields (cut sizes, bead weight) to the core BOMEntry model. Use Part custom fields (JSONB `CustomFieldValues`) for these.
- The legacy approach of separate Products and Supplies tables with a junction table creates unnecessary complexity. Forge's unified Part model where supplies are simply parts of type "Raw Material" is cleaner.

---

### 4. Pricing — `ProductPriceAnnualT`

**Legacy (333 rows):** Tracks product price and manufacturing cost per year. Fields: manufacturer's cost, product price, discontinued flag, product name, year value.

**Forge:** No pricing module yet.

**Analysis:** Year-over-year cost tracking is valuable for margin analysis. This maps to a future pricing/quoting feature. The approach of storing annual snapshots is reasonable but should be implemented as a `PriceHistory` entity rather than duplicating the legacy pattern of a separate lookup table keyed by product name + year text.

---

### 5. Orders — `OrderT` / `OrderDetailT` / `OrderDeliveryT`

**Legacy:**
- `OrderT` (301 rows): Purchase order header — date, PO number (text, customer-assigned), ship-to and bill-to customer (by company name).
- `OrderDetailT` (847 rows): Line items — product name, quantity ordered, target delivery date, resolved flag, PO number, notes.
- `OrderDeliveryT` (919 rows): Partial delivery tracking — quantity delivered, delivery date, invoice number, invoice sent flag.

**Forge:** Jobs on a kanban board represent orders flowing through production stages. No explicit order/line-item model — jobs ARE the work orders.

**Key Differences:**
| Aspect | Legacy | Forge |
|--------|--------|-------------|
| Order model | PO header + line items + deliveries | Job = single work item on board |
| Partial delivery | OrderDeliveryT tracks partial shipments | Not yet implemented |
| Customer PO reference | Stored as primary order identifier | Job.ExternalRef field |
| Multi-line orders | One order, many products | One job per product/task (or subtasks) |
| Invoice tracking | Embedded in delivery records | Planned via accounting integration |

**Migration Caution:**
- The legacy model's strength is partial delivery tracking — a customer orders 500 units, receives 200 now and 300 later, each delivery generates a separate invoice. Forge needs this for manufacturing but should implement it as a shipping/fulfillment feature, not by replicating the three-table Access pattern.
- Legacy PO numbers are customer-provided text strings (e.g., "0093536 Blue Ridge", "263-Survive"). These are external references, NOT system-generated identifiers. Forge correctly auto-generates `JobNumber` and stores customer references in `ExternalRef`.
- The `Resolved` flag on OrderDetailT is a simple boolean — Forge's multi-stage kanban is far superior for tracking completion status.

---

### 6. Projects — `ProjectManagementT` / `ProjectManagementStepsT` / `ProjectManagementDetailsT`

**Legacy:**
- `ProjectManagementT` (44 rows): Project header — name, type (Injection/Thermoform), lead person, start date, completed/canceled flags, customer refs, picture, notes.
- `ProjectManagementStepsT` (43 rows): Step templates per project type — defines the standard steps for Injection, Thermoform, or both.
- `ProjectManagementDetailsT` (470 rows): Actual step completion records — step name, order, completion date, lead, notes, linked to project by name.

**Forge:** This is the closest match to the kanban board + track types + stages system.

**Mapping:**
| Legacy Concept | Forge Equivalent |
|---------------|----------------------|
| ProjectType (Injection, Thermoform) | TrackType |
| ProjectManagementSteps (templates) | JobStage (stages within a track type) |
| ProjectManagementDetailsT (actual steps) | Job moving through stages |
| ProjectManagementLead | Job.AssigneeId |
| ProjectCompleted / ProjectCanceled | Job.CompletedDate / Job.IsArchived |

**Legacy Project Steps (43 defined):**
The steps represent a product development lifecycle, NOT a production workflow:
1. First Contact → Customer abstract description → Pre-Development Form → Estimate Sent
2. Purchase Order Received → Onboarding Contract → Product Design → Sample Received
3. Forming Mold → Hardware Accepted → Prototype/s made and sent → Sample product approved
4. Tooling paid for → Invoice for ½ Tooling → Adjustment cycles (up to 3 major)
5. Project approval → Project Workflow scheduling → Project in production → First Order Delivered
6. Re-evaluate estimate after order is complete

This is a **new product development** pipeline, distinct from a **production order** pipeline. Forge's track types handle this well — "R&D/Tooling" track type with these stages.

**Migration Caution:**
- Legacy project steps are about bringing a NEW product to market. Production orders (OrderT) are a separate workflow. Forge should maintain this separation via different track types (Production vs R&D/Tooling).
- The legacy step model allows steps to be completed out of order (just checked off). Forge's linear stage progression is more structured — consider allowing backward moves for this track type.
- Legacy notes field on ProjectManagementT contains chronological entries with dates embedded in free text (e.g., "7/24\nWaiting the customer...\n01/06/2025:\nMulticam .093..."). Forge's `JobActivityLog` is far superior for this.

---

### 7. Suppliers — `SuppliersT`

**Legacy (45 rows):** Supplier company name (PK), contact name, position, address, phone, web, email, **username, password** (plaintext credentials stored!), notes.

**Forge:** `Vendor` entity (built).

**Migration Caution:**
- Legacy stores **plaintext supplier portal credentials** (username/password columns). This is a serious security issue. Forge must NEVER store third-party credentials in entity tables. If portal access is needed, use encrypted storage via ASP.NET Data Protection API.

---

### 8. Supplies (Raw Materials) — `SuppliesT` / `SuppliesCategoryT`

**Legacy (160 rows):** Raw materials/consumables with name, supplier, SKU, description, category (Hardware/KYDEX/Machine parts/Office/Plastic/Shipping/Tools), quantity, reorder level, current cost, DNI (do not inventory) flag, location, notes.

**Forge:** Maps to Parts with `PartType = RawMaterial` + Inventory module for stock tracking.

**Key Differences:**
- Legacy has a separate Supplies entity from Products. Forge unifies them under Part with different PartType values.
- Legacy `SuppliesReorderLevel` maps to inventory reorder alerts (not yet implemented).
- Legacy `SuppliesDNI` (do not inventory) flag — some items are tracked without counting. Could map to a Part flag or PartStatus.

---

### 9. Financials — `DailyLedgerT` / `AccountTypeT` / `CategoryT` / `Checks`

**Legacy:**
- `DailyLedgerT` (8,971 rows): The heart of the financial system — every income and expense transaction. Fields: date, category (FK to CategoryT by ID), description (FK to DescriptionT by ID), income amount, gross/FWT/SWT/SS/Medicare (payroll tax breakdown), amount, credit/debit flag, account type, balanced flag, year, invoice number, transaction ID, notes.
- `DailyLedgerT3` (5,752 rows): Appears to be a backup/archive copy (fewer columns).
- `AccountTypeT` (4 rows): Bank accounts — Main Checking, Savings, PayPal, Cash.
- `CategoryT` (33 rows): Income/expense categories — Advertising, Automotive, Equipment, Payroll Taxes, Raw Materials, Wages, Income, Refund, etc.
- `DescriptionT` (496 rows): Vendor/payee lookup — names of everyone/everything paid, with discontinued flag.
- `Checks` (1 row): Physical check writing.

**Forge:** Expenses module (basic), planned QuickBooks integration for full accounting.

**Migration Caution — CRITICAL:**
- The daily ledger is the most dangerous legacy feature to replicate. It is essentially a **manual general ledger** with 9,000+ hand-entered transactions spanning 8+ years. This is the entire bookkeeping system.
- Forge should NOT replicate this. QuickBooks handles general ledger, P&L, balance sheet. The QB integration is the correct approach.
- The Expenses module in Forge handles expense capture/approval. Income tracking flows through invoicing → QB sync.
- Payroll tax breakdown fields (FWT, SWT, Social Security, Medicare) belong in a payroll system (Gusto, ADP), NOT in the application.
- The `DescriptionT` table (496 vendor names) is a manual autocomplete list. Forge's `ReferenceData` table handles this more elegantly.
- The `Balanced` flag and `DateBalanced` fields suggest manual bank reconciliation — again, this belongs in QuickBooks.

---

### 10. Invoicing — `InvoiceSentT` / `OrderDeliveryT.InvoiceNumber`

**Legacy:** Invoice tracking is spread across two tables. `InvoiceSentT` tracks which invoices have been sent (currently 0 rows — unused). Invoice numbers are embedded in `OrderDeliveryT` delivery records.

**Forge:** Invoice workflow planned via QB Online integration (Estimate → Sales Order → Invoice → Payment stage flow).

**Analysis:** Legacy invoicing is minimal — just an invoice number stamped on delivery records. No invoice line items, totals, or payment tracking beyond the daily ledger. Forge's planned QB integration is far more capable.

---

### 11. Purchase Orders (Internal) — `PurchaseOrderT` / `PurchaseOrderDetailT`

**Legacy (56 POs, 99 line items):** Internal purchase orders to suppliers — date, supplier, ordered by, shipping instructions, comments, payment terms. Detail lines: supply name, SKU, description, quantity, unit cost, unit type.

**Forge:** `PurchaseOrder` + `PurchaseOrderLine` entities (built).

**Good alignment.** The legacy PO model maps directly. Forge's implementation is already more complete with FK relationships, status tracking, and receiving records.

---

### 12. Users — `UserT`

**Legacy (5 rows):** Basic user table — name, user type (Office/null), username, plaintext password stored as bytes.

**Forge:** ASP.NET Identity with 6 roles, bcrypt-hashed passwords, JWT auth, refresh tokens.

**No comparison needed** — Forge's auth system is categorically superior.

---

## Systemic Inefficiencies in Legacy App

### 1. Text-Based Foreign Keys (Critical)
The legacy app uses text strings (company names, product names, supply names) as join keys instead of integer IDs. This causes:
- **Data integrity failures**: Typos create orphaned records (e.g., "Fee to Custmer" vs "Fee to Customer")
- **Rename cascading impossible**: Changing a company name breaks all linked records
- **Query performance**: String comparison vs integer comparison
- **Case sensitivity issues**: Access is case-insensitive, but exports may not be

### 2. No Referential Integrity
No foreign key constraints exist. The database relies entirely on Access forms to enforce data consistency. Direct table edits can create orphans.

### 3. Denormalization
- Customer data duplicated between BillTo and ShipTo tables
- Product names repeated across OrderDetailT, ProductSuppliesJunctionT, ProductPriceAnnualT
- Category and Description stored as IDs in DailyLedgerT but as text everywhere else

### 4. No Audit Trail
No created/updated timestamps. No record of who changed what or when. The ProjectManagementT.ProjectManagementNotes field contains manually typed dates to simulate an activity log.

### 5. No Soft Deletes
Legacy uses `Discontinued` flags on some tables, boolean `Active` on others, and nothing on most. No consistent deletion strategy. Historical records can be hard-deleted.

### 6. Plaintext Credentials
Supplier portal credentials and user passwords stored in plaintext/weakly encoded bytes.

### 7. Single-User Bottleneck
Access file locking means only one user can write at a time. No concurrent access strategy. No real-time updates.

### 8. Financial System in Application
General ledger, bank reconciliation, and payroll tax tracking embedded in the app rather than delegated to accounting software. This is the single largest maintenance burden and error source.

### 9. No Separation of Concerns
Products, orders, finances, project management, inventory, suppliers — all in one monolithic file with no modularity, no API layer, no separation between data storage and business logic.

---

## Feature Parity Summary

| Legacy Feature | Legacy Complexity | Forge Status | Notes |
|---------------|------------------|-------------------|-------|
| Customer management | 6 forms, 2 tables | **Done** | Superior: FK-based, contacts, activity log |
| Bill-to / Ship-to split | Parallel tables | **Gap** | Consider adding ship-to address to Job or Customer |
| Product catalog | 6 forms, 1 table | **Done** (Parts) | Superior: revisions, BOM, status workflow |
| Product-customer binding | Text FK in ProductT | **Not needed** | QBE is correctly customer-agnostic |
| Product pictures | Attachment field | **Done** | FileAttachment via MinIO |
| Product pricing (annual) | 1 subform, 1 table | **Not Started** | Future: price history / quoting module |
| BOM (product-supplies) | 1 form, 1 junction table | **Done** | BOMEntry + JobPart linking |
| Stock tracking | 1 form, embedded in ProductT | **Done** | Inventory module (StorageLocation, BinContent) |
| Reorder alerts | Field on SuppliesT | **Not Started** | Planned |
| Customer orders | 3 forms, 3 tables | **Done** | Jobs on kanban board (superior) |
| Partial delivery tracking | OrderDeliveryT | **Not Started** | Needed for manufacturing |
| Invoice tracking | 2 forms, 0 data | **Partial** | Planned via QB integration |
| Project management (R&D) | 3 forms, 3 tables | **Done** | Track types + stages (superior) |
| Project step templates | Step definition table | **Done** | Stage templates per track type |
| Supplier/vendor management | 3 forms, 1 table | **Done** | Vendor entity |
| Raw material tracking | 2 forms, 2 tables | **Done** | Parts + Inventory |
| Purchase orders | 2 forms, 2 tables | **Done** | PurchaseOrder + PurchaseOrderLine |
| Daily ledger / bookkeeping | 5 forms, 18 reports, 25 queries | **Not needed** | Delegated to QuickBooks (correct) |
| Expense categories | CategoryT (33 rows) | **Done** | ReferenceData + Expense entity |
| Check writing | 1 form, 1 report | **Not needed** | N/A — handled by bank/QB |
| User management | 2 forms | **Done** | Superior: ASP.NET Identity, 6 roles, JWT |
| Work order printing | 1 report | **Planned** | QuestPDF generation |
| Packing slip printing | 1 report | **Planned** | Shipping integration |
| PO printing | 1 report | **Planned** | QuestPDF generation |
| Inventory reports | 2 reports | **Planned** | Reports module |

---

## Recommended Actions

### High Priority — Features Worth Porting
1. **Partial delivery / shipment tracking** — Legacy's OrderDeliveryT concept of tracking multiple partial shipments against a single order line item is valuable. Implement as a Shipment entity linked to Job.
2. **Product pricing history** — Annual cost/price snapshots are useful for margin analysis. Add a `PriceHistory` entity on Part.
3. **Ship-to address** — Consider a `shippingAddress` on Job or a multi-address model on Customer for manufacturing orders that ship to different sites.

### Medium Priority — Refine Existing
4. **Reorder level alerts** — Legacy SuppliesT has `ReorderLevel`. Add to BinContent or Part and surface in dashboard.
5. **Products-per-box / packaging metadata** — Useful for shipping calculations. Add as Part field or custom field.
6. **Tax exemption certificate** — Add as FileAttachment category on Customer.

### Do Not Port
- **Daily ledger / general ledger** — Use QuickBooks
- **Payroll tax fields** — Use payroll service
- **Plaintext credentials** — Never
- **Text-based foreign keys** — Already using integer PKs
- **Separate Bill-to/Ship-to tables** — Use address collection instead
- **Check writing** — Use banking/QB
- **Manual bank reconciliation** — Use QuickBooks

---

## Forms Analysis (43 Forms)

The Access application contains 43 forms comprising the entire user interface. Forms are stored as compiled binary objects — the analysis below is derived from form names, their relationship to underlying tables/queries, and the data patterns observed.

### Form Architecture

The legacy UI follows a typical Access pattern: a main menu form (`MainMenuF`) with navigation buttons launching modal data-entry forms. There is no sidebar, no tabbed navigation, no URL routing — every screen is a popup window opened by VBA code behind button click events.

**Navigation:**
| Form | Purpose | Forge Equivalent |
|------|---------|----------------------|
| `MainMenuF` | Central launch pad — buttons to every area | Sidebar + Dashboard |
| `OrdersMenuF` | Sub-menu for order management | Kanban board |
| `ManageOrdersF` | Order entry and line item management | Job detail panel |
| `ManageProjectsF` | Project list and step tracking | Kanban board (R&D track) |

**Customer Management (6 forms):**
| Form | Purpose | Notes |
|------|---------|-------|
| `CustomerF` | View/edit existing customer | Main customer detail |
| `CustomerNewF` | Create new customer | Separate creation form (unnecessary split) |
| `CustomerLookupF` | Search/select customer | Dropdown/typeahead replacement |
| `CustomerBillTosubF` | Bill-to address subform | Embedded in customer form |
| `CustomerShipTosubF` | Ship-to address subform | Embedded in customer form |
| `CustomerBillTosubLookupF` / `CustomerShipTosubLookupF` / `CustomerNewLookupF` / `CustomerShipTosubLookupF` | Various lookup popups | Redundant — Forge EntityPicker handles all |

**Inefficiency:** 6+ forms for one entity. Forge handles this with a single page + dialog + EntityPicker. The legacy pattern of separate "New" and "Edit" forms is an Access-era anti-pattern — modern UIs use one form for both.

**Product Management (6 forms):**
| Form | Purpose | Notes |
|------|---------|-------|
| `ProductF` | Product detail entry | Part detail in Forge |
| `ProductLookupsubF` | Product search subform | Part search in toolbar |
| `ProductNewsubF` | New product creation | Same form as edit in Forge |
| `ProductPriceAnnualsubF` | Annual price entry subform | Not yet in Forge |
| `ProductPriceAnnualLookupsubF` | Price history lookup | Not yet in Forge |
| `ProductSuppliesJunctionF` | BOM editing (product-to-supply links) | BOM tab on Part detail |

**Order Management (3 forms):**
| Form | Purpose | Notes |
|------|---------|-------|
| `ManageOrdersF` | Main order screen (header + line items) | Job on kanban board |
| `OrderDetailF` | Line item entry subform | Job subtasks |
| `OrderDeliveryF` | Partial delivery tracking | Not yet built (recommended) |

**Project Management (2 forms):**
| Form | Purpose | Notes |
|------|---------|-------|
| `ManageProjectsF` | Project list with step completion | Kanban board (R&D track) |
| `AddProjectManagementStepsF` / `AddProjectManagementStepsandTypeF` | Step template editor | Admin track type / stage config |
| `ProjectManagementDetailsF` | Step completion entry | Job stage transitions |

**Financial Forms (5 forms) — DO NOT REPLICATE:**
| Form | Purpose | Notes |
|------|---------|-------|
| `ArmoryFinancialF` | Main financials dashboard | QuickBooks |
| `DailyLedgerF` | Transaction entry — income & expenses | QuickBooks |
| `DailyLedgerNotBalancedF` | Unbalanced transaction viewer | QuickBooks reconciliation |
| `DailyExpenceAnnualChartF` | Annual expense chart | Forge Reports module |
| `FinancialsLoginF` | Separate login for financial access | Role-based access in Forge |
| `ChecksF` | Physical check printing | Not needed |

**Caution:** The `FinancialsLoginF` form implies a second layer of authentication specifically for financial data. Forge handles this more elegantly with role-based access (Admin/Manager roles see financial data; others don't).

**Supplier / Supply / PO Forms (6 forms):**
| Form | Purpose | Notes |
|------|---------|-------|
| `SuppliersF` | Supplier detail | Vendor page in Forge |
| `SupplierssubF` / `SupplierssubLookupF` | Supplier subform and lookup | EntityPicker |
| `SuppliessubF` / `SuppliessubLookupF` | Supply item entry and lookup | Part (RawMaterial type) |
| `PurchaseOrderF` / `PurchaseOrderDetailF` | PO entry with line items | Purchase Order page |

**Utility Forms:**
| Form | Purpose | Notes |
|------|---------|-------|
| `AddNewUserF` / `AddNewAdminLoginF` | User account creation | Admin user management |
| `DescriptionF` | Manage description lookup table | ReferenceData admin |
| `InvoiceNumberNextF` / `InvoiceNumberNextPlusOneF` | Manual invoice number sequencing | Auto-generated in Forge |
| `InvoiceSentF` | Invoice sending tracker | QuickBooks integration |
| `UpdateInventoryF` | Manual stock count update | Inventory module |

### Form UX Anti-Patterns

1. **Separate New/Edit forms** — `CustomerF` vs `CustomerNewF`, `ProductF` vs `ProductNewsubF`. Access developers often create separate forms because Access lacks dynamic form behavior. Forge correctly uses one dialog for both create and edit.

2. **Lookup subform proliferation** — 8+ lookup forms (`*LookupF`, `*LookupsubF`). Each entity needing a dropdown gets its own lookup popup. Forge's `EntityPickerComponent` and `AutocompleteComponent` eliminate all of these.

3. **Modal popup chains** — Opening a form that opens another form that opens another. No breadcrumbs, no back button, no URL state. Users lose context easily. Forge's router + sidebar + detail panels avoid this entirely.

4. **No list views** — Access forms typically show one record at a time. Browsing records requires navigation buttons (next/previous). Forge's data tables and kanban boards show many records simultaneously with filtering and sorting.

5. **Financial gatekeeping via separate login** — Instead of role-based access, the legacy app has a second login form for financial data. This creates a poor UX where users must re-authenticate to access restricted areas.

6. **Manual sequence management** — `InvoiceNumberNextF` / `InvoiceNumberNextPlusOneF` forms exist solely to manage the next invoice number. This is handled automatically by database sequences in Forge.

---

## Reports Analysis (34 Reports)

The legacy app has 34 reports — mostly financial ledger views, with some operational reports. Each report has a matching query (suffixed `Q` or `R`) that provides its data source.

### Financial Reports (18) — Delegated to QuickBooks

| Report | Purpose |
|--------|---------|
| `DailyLedgerAnualR` / `DailyLedgerMonthlyR` | Full ledger views by period |
| `DailyExpenceLedgerAnualR` / `DailyExpenceLedgerAnualSummaryR` | Expense breakdown by year |
| `DailyIncomeLedgerAnualR` / `DailyIncomeLedgerAnualSummaryR` / `DailyIncomeLedgerMonthlyR` | Income breakdown |
| `DailyLedgerNotBalancedR` / `DailyLedgerNotBalancedAnualR` / `DailyLedgerNotBalancedMonthlyR` | Unreconciled transactions |
| `IncomeStatementAnualR` / `IncomeStatementMonthlyR` / `IncomeStatementDateRangeR` | Profit & loss |
| `AnnualExpenceChartR` / `AnnualIncomeChartR` | Visual charts |
| `AccountTypeMathR` | Account balance calculations |
| `SalesTaxReportR` | Sales tax liability |
| `CheckR` | Check printing template |

**All of these are QuickBooks territory.** Forge should not replicate any financial report generation. The Reports module should focus on operational metrics (jobs, production throughput, time tracking, parts usage) — never bookkeeping.

### Operational Reports (16) — Relevant to Forge

| Report | Purpose | Forge Mapping |
|--------|---------|-------------------|
| `OrderTicketR` | Work order / shop ticket | **Planned**: `GET /api/v1/jobs/{id}/pdf?type=work-order` |
| `PackingSlipR` | Packing slip for shipment | **Planned**: shipping integration |
| `InvoiceR` | Customer invoice | **Planned**: QuickBooks sync |
| `ProductInventoryR` | Stock levels report | Reports module — inventory summary |
| `WeeklyInventoryR` | Weekly inventory snapshot | Reports module — inventory trend |
| `ProductDescriptionR` | Product spec sheet | Part detail PDF |
| `ProductCutLocationR` | Cut location reference | Part-specific (custom field report) |
| `ProductIncomeAnalysisTotalR` | Revenue per product | Reports module — part profitability |
| `NewProductsInProcessR` | R&D products in development | Kanban board filter (R&D track) |
| `ProjectManagementR` / `ProjectManagementStepsR` | Project status / step completion | Job detail view (already superior) |
| `UndeliveredR` / `UndeliverdOrdersTotalByCustomerR` | Unshipped orders | Kanban board filter (pre-shipped stages) |
| `PurchaseOrderR` | Purchase order printout | PO detail PDF |

### Report Patterns to Adopt

- **Work order / shop ticket** (`OrderTicketR`): A printable job card with all details, materials needed, and routing steps. Critical for shop floor. Forge has planned QuestPDF generation for this.
- **Packing slip** (`PackingSlipR`): Needed when shipping. Include customer address, line items, quantities.
- **Inventory reports** (`ProductInventoryR`, `WeeklyInventoryR`): Regular stock snapshots. Forge's Reports module should include these.
- **Undelivered orders** (`UndeliveredR`): A filtered view of in-progress work — already handled by kanban board filtering.

---

## Queries Analysis (53 Queries)

The 53 queries fall into clear categories revealing the business logic patterns:

### Query Categories

**Financial Queries (25)** — All related to the daily ledger. Filtering by date range, balanced/unbalanced status, income vs expense, account type. Complex aggregation for income statements and chart data. Every one of these belongs in QuickBooks, not Forge.

**Order/Delivery Queries (8):**
- `OrderQ`, `OrderDetailQ`, `OrderdeliveryQ` — Basic CRUD data sources
- `OrderTicketQ`, `PackingSlipQ` — Report data sources joining orders + products + customers
- `OrderDeliveryConfirmationQ` — Delivery verification
- `UndeliverdOrdersQ`, `UndeliverdOrdersTotalByDateQ` — Filtered views of incomplete orders
- `TotalDeliveredQ` — Aggregate delivery totals

**Product/Inventory Queries (8):**
- `ProductActiveQ`, `InventoryActiveQ`, `SuppliesActiveQ` — Filtered active-only views
- `InventoryQ` — Full inventory view
- `ProductDescriptionQ`, `ProductCutLocationQ` — Spec-sheet data sources
- `ProductIncomeAnalysisTotalQ` — Revenue analysis joining orders to products
- `ProductInventoryQ` — Stock status

**Invoice Queries (4):**
- `InvoiceQ`, `InvoiceSentQ` — Invoice data and sent status
- `InvoiceNumberNextQ`, `InvoiceNumberNextPlusOneQ` — Sequence management (anti-pattern)

**Purchase Order Queries (2):**
- `PurchaseOrderQ`, `PurchaseOrderDetailQ` — PO data sources

**Project Queries (2):**
- `ProjectManagementQ` — Project list with status
- `ProjectManagementQ_928B9B9CE299407A8BF177DD0D4B1FB8` — Likely a copy/backup (GUID suffix = Access auto-generated)

**Utility Queries (4):**
- `AccountTypeMathQ`, `ProffitLossSumQ` — Financial calculations
- `CompanyInformationQ` — Company info lookup
- `SalesTaxReportQ` — Tax report data

### Query Anti-Patterns

1. **GUID-suffixed duplicates** — `ProjectManagementQ_928B9B9CE299407A8BF177DD0D4B1FB8` suggests Access created a copy when a query name collision occurred. This is a sign of fragile tooling.

2. **Report-query coupling** — Every report has a dedicated query rather than using parameterized queries or views. In Forge, MediatR handlers return shaped data directly; no intermediate query layer needed.

3. **Separate "Active" queries** — `ProductActiveQ`, `InventoryActiveQ`, `SuppliesActiveQ` duplicate the base query with a WHERE filter. Forge handles this with global query filters (`DeletedAt == null`) and optional status filters in the UI.

4. **Invoice number sequencing** — Two queries (`InvoiceNumberNextQ`, `InvoiceNumberNextPlusOneQ`) exist solely to calculate `MAX(InvoiceNumber) + 1`. This is handled by database sequences or auto-increment in Forge.

---

## VBA / Code-Behind Analysis

The Access file contains VBA code stored in compiled binary format (31 modules, ~45KB total). While the source code cannot be directly extracted without Microsoft Access installed, the module structure and form names reveal the scope:

- **31 form code-behind modules** — One per form with event handlers (button clicks, form load, field validation, navigation). This is Access's version of component logic.
- **No standalone modules** — All VBA code lives behind forms, not in reusable modules. This means business logic is duplicated across forms.
- **No class modules** — Pure procedural code, no OOP patterns.

### Inferred VBA Patterns (from form/table analysis)

Based on the form-to-table relationships and data patterns:

1. **Navigation logic**: `MainMenuF` buttons execute `DoCmd.OpenForm "FormName"` — each button opens a different form. No parameterized navigation.

2. **Lookup cascading**: Customer lookup forms filter products, orders, and projects by company name text match. Forge uses typed ID-based relationships.

3. **Invoice number generation**: VBA behind `InvoiceNumberNextF` runs `DMax("InvoiceNumber", "OrderDeliveryT") + 1` — fragile under concurrent access. Forge uses database sequences.

4. **Financial access control**: `FinancialsLoginF` likely checks credentials against `UserT` before opening `ArmoryFinancialF`. A single-purpose auth gate vs Forge's role-based middleware.

5. **Inventory updates**: `UpdateInventoryF` likely reads current stock from `ProductT.InStock` and updates it — direct table mutation with no audit trail. Forge uses `BinMovement` records for full traceability.

6. **Form validation**: Field-level validation via VBA `BeforeUpdate` events (e.g., required fields, numeric ranges). Forge uses `FluentValidation` server-side and reactive form validators client-side.

---

## Structural & Normalization Issues

### Database Normalization Problems

**1. First Normal Form (1NF) Violations:**
- `ProjectManagementT.ProjectManagementNotes` contains multi-valued data: chronological entries with embedded dates in free text (e.g., "7/24\nWaiting on customer...\n01/06/2025:\nMulticam .093..."). This should be a separate `ProjectNote` table with date, author, and content columns.
- `SuppliesT.SuppliesNotes` and `ProductT.ProductNotes` similarly contain multi-entry text fields.

**2. Second Normal Form (2NF) Violations:**
- `OrderDetailT` contains `PurchaseOrderNumber` (from the parent `OrderT`), duplicating the parent reference unnecessarily. The PO number should only exist on the header.
- `ProductT` contains `CustomerBillToCompany` and `CustomerShipToCompany` — customer identity is a property of orders, not products. A product can be sold to multiple customers.

**3. Third Normal Form (3NF) Violations:**
- `DailyLedgerT.Year` is derivable from `DailyLedgerT.Date` — stored redundantly for reporting convenience.
- `OrderDeliveryT.InvoiceNumber` creates a transitive dependency — invoice data belongs in an Invoice entity, not on delivery records.
- `ProductT.InStock` is a computed value (sum of incoming - sum of outgoing) stored as a static field that must be manually synchronized.

**4. Missing Junction Tables:**
- Orders to products use a detail table (acceptable), but the relationship between projects and customers is through text fields, not a proper FK.
- No supplier-to-product relationship table beyond `ProductSuppliesJunctionT` (which only links supplies to products, not suppliers to products directly).

### Naming Convention Problems

The legacy database uses an inconsistent naming scheme that should NOT be carried forward:

| Legacy Pattern | Problem | Forge Standard |
|---------------|---------|---------------------|
| `CustomerBillToT` | Suffix `T` for "Table" — verbose, unnecessary | `customer` (snake_case, no suffix) |
| `ProductPriceAnnualT` | CamelCase table names | `product_price_annual` (snake_case) |
| `DailyLedgerF` | Suffix `F` for "Form", `R` for Report, `Q` for Query | N/A — Angular components use kebab-case |
| `CustomerBillToCompany` | Column names include table context | `company` (short, contextual from table) |
| `SuppliesReorderLevel` | Table name prefix on every column | `reorder_level` |
| `ProductManufacturersCost` | Possessive in column name | `manufacturer_cost` |
| `FWT`, `SWT`, `SS` | Cryptic abbreviations | Full names or standard abbreviations |
| `DNI` | Unexplained abbreviation (Do Not Inventory) | `is_tracked` (boolean, clear meaning) |

**Rule:** Forge uses snake_case for database (auto-converted by EF Core), PascalCase for C# entities, camelCase for JSON/TypeScript. All names should be self-documenting without table prefixes or type suffixes.

### Data Quality Issues Observed

From the actual data in the legacy tables:

1. **Inconsistent company names**: "Fee to Custmer" (typo), "Amazon" vs "Amazon.com" — text-based FKs amplify every typo into an orphaned record.
2. **Mixed date formats**: Some dates as `DateTime`, some as text strings in notes fields.
3. **Null vs empty string**: Inconsistent use of NULL vs "" for optional fields.
4. **Duplicate backup table**: `DailyLedgerT3` appears to be a manual backup of `DailyLedgerT` with fewer columns — sign of no backup strategy.
5. **Abandoned features**: `InvoiceSentT` has 0 rows despite 919 delivery records with invoice numbers — the feature was started but never used.
6. **Inconsistent status tracking**: Products use `Discontinued` (boolean), supplies use `DNI` flag, no consistent soft-delete pattern.

---

## Data Migration Notes

If migrating legacy data into Forge:

1. **Customer dedup**: BillTo and ShipTo are parallel tables joined by company name. Merge into single Customer entity, store ship-to as secondary address.
2. **Products → Parts**: Map ProductT to Part. `ProductCategory` → `PartType`. `ProductName` → Part description. `ProductSKU` → `PartNumber`.
3. **Supplies → Parts**: Map SuppliesT to Part with `PartType = RawMaterial`. Supplies and Products become a unified part catalog.
4. **ProductSuppliesJunctionT → BOMEntry**: Map supply-to-product relationships to BOM entries. Need to resolve text-name keys to integer IDs.
5. **Orders → Jobs**: Each OrderDetailT line item becomes a Job. The OrderT.PurchaseOrderNumber maps to Job.ExternalRef. Customer comes from OrderT.CustomerBillToCompany.
6. **Projects → Jobs (R&D track)**: ProjectManagementT maps to Jobs on the R&D/Tooling track type. ProjectManagementDetailsT maps to Job stage history + activity log.
7. **Suppliers → Vendors**: Direct 1:1 mapping. Drop username/password columns.
8. **DailyLedgerT → Do not migrate into app**. Export to CSV for historical records or import into QuickBooks.
9. **Handle text FK resolution carefully**: Build a lookup map of company names to Customer IDs before migrating linked records.
