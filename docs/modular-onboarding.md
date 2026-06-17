# Modular onboarding and the module picker

This describes how a customer turns Forge on one module at a time, and the setup
flow that lets them do it. It is grounded in the capability system that already
exists (the catalog of 157 capabilities, the dependency graph, the presets, and
the discovery wizard). Nothing here is a rebuild. The new pieces are a lighter
front door for setup and a defined bundle of capabilities behind each module.

## Two doors into setup

Today everyone goes through the discovery wizard. We put a lighter door in front
of it and let people choose.

- Quick start. A flat list of modules with a "Do you want to use X?" toggle on
  each, and a "Start using Forge" button that is always available. Check what you
  want, leave the rest off, start. This is the escape hatch.
- Guided setup. The existing discovery questions, unchanged, behind a "Help me
  decide" choice. Same engine and recommendation it has today.

Both doors write to the same capability state. Taking the quick path never locks
anyone out of the rest. There is already precedent for this split: the part and
vendor creation flows have an Express versus Guided mode. This applies the same
idea to install setup.

Both are reversible later from the existing capability admin screen, so growth
uses the same module picker rather than a separate path.

## Always on, never a choice

These are switched on for every install because there is no useful system
without them:

- Sign-in (CAP-IDEN-AUTH-PASSWORD), user accounts (CAP-IDEN-USERS), roles
  (CAP-IDEN-ROLES), company configuration (CAP-IDEN-TENANT-CONFIG), capability
  administration (CAP-IDEN-CAPABILITY-ADMIN), system audit log
  (CAP-IDEN-AUDIT-SYSTEM-LOG).
- Baseline screen behavior: list search/filter/sort (CAP-CROSS-LIST-UX),
  notifications (CAP-CROSS-NOTIFICATIONS), per-record activity log
  (CAP-CROSS-ACTIVITY-LOG).

The records a module needs (Parts and Locations for Inventory, for example) come
on with that module, not with the base.

Login accounts (Users) are part of the base and are separate from employee
records. A person can sign in without being a managed employee. Employee
management, payroll, and employee tax documents are their own module (HR and
People, below) and are off by default. For an operational-only install like
inventory, that area stays off, which also removes the "complete your employee
profile" prompt and the pay-stub, tax-document, and onboarding sections from
account settings.

## How prerequisites are handled

When you toggle a module on, it quietly includes the things it cannot run
without, and shows them with a one-line reason. Nothing turns on silently. The
inclusion list is read from the dependency graph that already exists, so we do
not hand-maintain it. The customer-facing reason lines:

- Inventory: "Includes Parts and Locations. You need items to track and somewhere
  to keep them."
- Purchasing: "Includes Vendors and Inventory. You need someone to buy from, and
  what you receive goes into stock."
- Production: "Includes Inventory, Parts, Work Centers, and Bills of Material. A
  job needs to know what it makes, what it is made of, and where the work
  happens. Materials come out of stock and finished goods go back in."
- Sales: "Includes Customers and Parts. You need someone to sell to and something
  to sell."
- Invoicing and Payments: "Includes Sales and Customers. You bill a customer for
  what they ordered."
- Shipping: "Includes Inventory. Shipping sends goods out and lowers your stock.
  If you ship against customer orders, turn on Sales as well."
- Accounting: "Builds on the modules that create financial activity: Sales and
  Invoicing, Purchasing, and Inventory. It records the money side of what those
  modules do."
- Quality: "Works with Inventory and Production. Inspections attach to the parts
  you receive and the jobs you run."
- Scheduling: "Works with Production. It plans the jobs you run."
- Training: "Includes the Employee list, since training is tracked per person."

## The modules

Each module turns on a core set of capabilities. Some bring optional extras that
stay off until the customer asks for them. Codes are the real capability codes
from the catalog.

### Inventory

The one module that stands fully on its own. Stock comes in and goes out without
a purchase order, a job, an invoice, or accounting, through an audited manual
path that never touches a ledger (CAP-INV-ADJUST).

- Core: CAP-INV-CORE, CAP-INV-ADJUST, CAP-PLAN-SAFETYSTOCK (reorder points),
  CAP-RPT-INVVAL (a simple quantity-times-cost value view).
- Pulls in: CAP-MD-PARTS (and its unit-of-measure prerequisite CAP-MD-UOM),
  CAP-MD-LOCATIONS.
- Suggested for injection molding: CAP-INV-LOTS (resin lots and expiry, FEFO),
  CAP-INV-CYCLECOUNT, CAP-INV-HAZMAT (resin SDS).
- Available to add: CAP-INV-MULTILOC, CAP-INV-PHYSICAL, CAP-INV-RESERVE,
  CAP-INV-SERIALS, CAP-INV-PICKWAVE, CAP-PLAN-ABC, CAP-PLAN-ATP.

### Purchasing

- Core: CAP-P2P-PO, CAP-P2P-RECEIVE.
- Pulls in: CAP-MD-VENDORS, and Inventory (CAP-INV-CORE) so receipts land in
  stock.
- Available to add: CAP-P2P-RFQ, CAP-P2P-APPROVALS, CAP-P2P-AUTOPO (needs
  Scheduling for the MRP signal), CAP-P2P-DROPSHIP, CAP-P2P-BACKTOBACK,
  CAP-P2P-SUBCONTRACT.

### Production

- Core: CAP-MFG-WO-RELEASE, CAP-MFG-MATL-ISSUE, CAP-MFG-COMPLETE.
- Pulls in: CAP-MD-BOM, CAP-MD-ROUTING, CAP-MD-WORKCENTERS, Inventory
  (CAP-INV-CORE), Parts, Locations.
- Available to add: CAP-MFG-LABOR (needs the Employee list), CAP-MFG-MULTIOP,
  CAP-MFG-BACKFLUSH, CAP-MFG-SHOPFLOOR, CAP-MFG-WOVARIANCE, CAP-MFG-STOPPAGE,
  CAP-RPT-OEE, the costing tiers (CAP-COSTING-TIER2-DEPTRATES,
  CAP-COSTING-TIER3-ABC).

### Sales

- Core: CAP-O2C-SO, CAP-O2C-QUOTE.
- Pulls in: CAP-MD-CUSTOMERS, Parts.
- Available to add: CAP-O2C-LEAD, CAP-O2C-CPQ (needs price lists,
  CAP-MD-PRICELIST), CAP-O2C-RECURRING, CAP-O2C-CREDIT-LIMITS, CAP-MD-PRICELIST,
  customer contacts and addresses and interaction log.

### Shipping

Standalone in intent. See the caveat below; today it leans on Sales.

- Core: CAP-O2C-SHIP, CAP-O2C-PICKPACK.
- Pulls in: Inventory (CAP-INV-CORE). As the dependency graph stands it also
  pulls in Sales (CAP-O2C-SO) and Customers, because pick/pack currently assumes
  an order. Making Shipping truly standalone needs a small piece of work (below).
- Available to add: CAP-INV-PICKWAVE, carrier integration settings.

### Invoicing and Payments

- Core: CAP-O2C-INVOICE, CAP-O2C-CASH (customer side); CAP-P2P-BILL, CAP-P2P-PAY
  (vendor side).
- Pulls in: CAP-MD-TAXCODES; Sales and Customers for the customer side;
  Purchasing for vendor bills.
- Available to add: CAP-O2C-COLLECTIONS, CAP-O2C-CREDITMEMO, CAP-O2C-RMA,
  CAP-BANK-NACHA (ACH origination, needs vendor payments).

### Accounting

- Core: CAP-ACCT-BUILTIN (or CAP-ACCT-EXTERNAL for an outside system; the two are
  mutually exclusive), CAP-ACCT-PERIOD, CAP-RPT-FINANCIALS.
- Pulls in: the modules that create financial activity (Invoicing and Payments,
  Purchasing, Inventory) and inventory valuation (CAP-RPT-INVVAL).
- Available to add: CAP-ACCT-FULLGL, CAP-ACCT-DEPRECIATION, CAP-ACCT-FXREVAL,
  CAP-ACCT-QBO-EXPORT, CAP-PAYROLL-RUN, CAP-ACCT-EXPENSES, CAP-ACCT-MIGRATION.

### Quality

- Core: CAP-QC-INSPECTION, CAP-QC-NCR.
- Pulls in: Parts, and Inventory or Production depending on where inspection
  happens.
- Available to add: CAP-QC-CAPA, CAP-QC-COA (lot certificates), CAP-QC-GAGE,
  CAP-QC-SPC, CAP-QC-FMEA, CAP-QC-PPAP, CAP-QC-RECALL (lot trace).

### Scheduling

- Core: CAP-PLAN-MRP, CAP-PLAN-CAPACITY.
- Pulls in: Production, Parts, Bills of Material.
- Available to add: CAP-PLAN-MPS, CAP-PLAN-FORECAST, CAP-PLAN-ATP,
  CAP-RPT-MRPEX.

### Training (narrowed)

- Core: CAP-HR-TRAINING only. Training records and certifications, assign a
  training to an employee with a due or renewal date, record completion and
  expiry, and a who-is-current and who-is-overdue view.
- Pulls in: CAP-MD-EMPLOYEES (training is tracked per person), and its location
  prerequisite.
- Not in the narrowed version (these come with a full setup): the compliance form
  builder (CAP-QC-COMPLIANCE-FORMS), the hire and onboarding workflow
  (CAP-HR-HIRE), and document management.
- Pulling in the Employee roster does not pull in payroll or employee tax
  documents. Those stay in HR and People and remain off.

### HR and People

Off by default. Inventory-only and other operational-only installs do not need
it. Turning it off removes the "complete your employee profile" prompt and the
personal pay-stub, tax-document, and onboarding sections from account settings.

- Employee management: CAP-MD-EMPLOYEES.
- Time tracking and clock events: CAP-HR-TIMETRACK.
- Payroll: CAP-HR-PAYROLL, plus the register and journal posting
  (CAP-PAYROLL-RUN).
- Leave and PTO (CAP-HR-LEAVE), shifts (CAP-HR-SHIFTS), reviews (CAP-HR-REVIEW).
- Hire and onboarding (CAP-HR-HIRE), termination and offboarding
  (CAP-HR-TERMINATION).
- Employee tax documents and compliance forms, meaning W-4, I-9, and state
  withholding (CAP-QC-COMPLIANCE-FORMS).
- Pulls in: Locations, since employees are scoped to a site.

## The landing screen follows the modules

The home screen is built from widgets, and each widget belongs to a module. With
a module off, its widgets and its nav group are hidden, so the landing screen
only shows what the install actually uses. An inventory-only install lands on an
inventory home: on-hand at a glance, low stock, recent movements, and a
scan-to-transact box, with no job, sales, or finance widgets and no prompt to
finish an employee profile. As modules are added, their widgets and nav appear.

This is largely existing behavior. The dashboard is already widget-based and the
nav already hides by capability. The work is curating a sensible default widget
set per module and a clean inventory-first home for the most common entry case.

## Two pieces of real work, named honestly

Most of this is configuration on top of what exists. Two items are actual build:

1. Friendly verbs for standalone Inventory. The manual stock-in and stock-out
   already exist (CAP-INV-ADJUST), but they read as "adjust." For an
   inventory-only customer they should read as Receive, Issue, Move, and Count,
   with the same audited movement underneath. This is a thin UI layer over
   endpoints that already work.

2. Standalone Shipping. As the dependency graph stands, Shipping pulls in Sales
   because pick/pack assumes an order. To let a customer ship without first
   creating a sales order, Shipping needs a manual ship path, the same way
   Inventory got a manual receive path that skips purchasing. Small and
   contained, but real, and worth doing before we sell Shipping as standalone.

## What gets built

- A quick-start screen: the module list with toggles, the included-items reason
  lines, and an always-available start button. New UI.
- Capability bundle definitions: the core and pull-in sets above, expressed as
  data so the picker and the admin screen share one source. The pull-ins read
  from the existing dependency graph.
- The guided path: unchanged. It moves behind a "Help me decide" choice.
- Re-entry: the same module picker is reachable later from capability admin, so
  expansion is the same screen, not a new one.

## Open decisions

- Inventory value while accounting is off: show quantity times cost
  (CAP-RPT-INVVAL) only, which is the current plan, or nothing until accounting
  is adopted.
- How much of Inventory's optional set is on by default for a molding shop (lots,
  cycle count, hazmat are the likely yes).
- How far to take the inventory-first home: curated dashboard widgets inside the
  standard shell (lower effort), or a purpose-built inventory landing screen (the
  cleanest first run). Either way the nav is already trimmed by capability.
