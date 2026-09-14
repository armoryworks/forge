---
title: Vocabulary audit — product terms against industry standard
type: delivery
status: in-progress
id: domain-doc-refresh-vocabulary-audit
updated: 2026-09-14
---

# Vocabulary audit — product terms against industry standard

> Scope: every term found in `docs/` where discrete / job-shop manufacturing, inventory accounting,
> revenue recognition or HR has a settled word. Evidence is the product's own documentation only.
> Rulings follow the context brief: **Rename** (standard word exists, product's word is merely
> non-standard), **Keep** (no settled word, or the standard word would mislead — justified),
> **Collision** (the product uses a standard word to mean something else).
>
> Source abbreviations: **APICS** = ASCM/APICS Dictionary (17th ed.); **SAP** = SAP S/4HANA
> (PP, MM, SD, CO, QM) usage; **Oracle/Epicor/JobBOSS/ProShop** = those vendors' published
> usage; **ASC 606 / ASC 330** = FASB codification; **AIAG** = AIAG core tools (PPAP, MSA, SPC);
> **ISO 9001 / AS9100 / ISO 13485** = the quality-system standards; **TPS** = Toyota Production
> System literature (Ohno, Monden); **USCIS** = US Citizenship and Immigration Services.

## Headline

1. **Nine collisions beyond Job.** In rough order of damage: *kanban*, *backlog*, *capability*,
   *account*, *estimate* (at the accounting seam), *inventory class*, *disposition* (on a work
   order), *payroll*, *training*. Each is a word a manufacturer, controller or auditor already owns
   and will read with their meaning, not ours. A further five are collisions inside the product's
   own document set (*cost center*, *sourcing*, *attestation*, *asset*, *compliance*).
2. **The brief's starting list is wrong in three places.** *Track type / stage* is not a routing
   (routings exist separately); the standard analogue is a user-defined order type and status
   profile. *Attestation / proof of intent* is not an order acknowledgment (that flows the other
   way, seller to buyer); it is evidence of customer order authorisation. *Retail buyer* is not
   simply the ship-to party; on a marketplace the partner roles split four ways.
3. **Agile / software-team vocabulary escaped into production control** — board, card, backlog,
   planning cycle, sprint, commit, burn-down, swimlane, focus mode. The production-control
   discipline already has words for every one of these. This is the largest single cluster.
4. **Implementation vocabulary escaped into the domain** — gated sequence, bin content, reference
   data, status entry, hold type, customer abstraction, workflow definition.

## A. Order-to-cash and counterparties

| Product term | Industry-standard term | Source of the standard | Ruling | Reasoning |
|---|---|---|---|---|
| Job | Work order (production order) | APICS; SAP PP "production order"; Epicor/JobBOSS "job" is legacy | **Collision** — decided | In job-order costing the *job* is the customer engagement costed against. Not reopened. |
| Job card | Work order (on a board); *traveler* for the printed document | APICS "shop traveler"; UK/MRO "job card" = the paper operation ticket | **Collision** | A "job card" in trade usage is a physical document accompanying the work; here it is a screen tile. Say *work order*. |
| Child job / sub-job / parent job | Child (dependent) work order; work order split | Epicor "job splitting"; SAP "collective order" | **Rename** | Follows from the Job decision. |
| Rework job | Rework work order | APICS "rework order" | **Rename** | Follows from the Job decision. |
| Dispose / disposition (of a job) | Close / cancel / archive a work order | APICS, ISO 9001 §8.7 (disposition = decision on nonconforming product) | **Collision** | *Disposition* is the MRB decision on nonconforming material (use-as-is, rework, scrap, return to vendor). Using it for ending a work order will be read as a quality decision. |
| Estimate (early, non-binding, not itemised) | Budgetary quote / ROM (rough order of magnitude) estimate | Trade practice; QuickBooks "Estimate" = a customer-facing quotation | **Collision** (at the accounting seam) | The two-document split is standard and stays. But the external book of record calls its *quotation* document an Estimate, so this product's *Quote* maps to that system's *Estimate* and this product's *Estimate* has no counterpart. Keep the split; rename the early form *budgetary estimate* and document the mapping. |
| Quote | Quotation / quote | APICS; SAP SD "quotation" | **Keep** | Standard. |
| Sales order | Sales order | APICS; SAP SD | **Keep** | Standard. |
| Attestation / proof of intent | Evidence of customer order authorisation (customer purchase order, order acceptance) | ASC 606-10-25-1(a) "the parties have approved the contract"; UCC §2-201 / §2-207 | **Collision** | *Attestation* is a declarant's formal statement (the product itself uses it correctly on employment eligibility forms, USCIS Form I-9). Evidence that a customer ordered — a PO, an email, a portal click — is not an attestation. Order *acknowledgment* is the seller's reply and is the wrong fix. Call it **order acceptance evidence**; the artefacts are *customer PO*, *written acceptance*, *e-signature*, *recorded verbal order*. |
| Retail buyer / consumer | End customer (ship-to party); marketplace = payer and bill-to | SAP SD partner functions (sold-to, ship-to, bill-to, payer); US marketplace-facilitator statutes | **Rename** | The brief's "ship-to party" is half right. On a marketplace the facilitator is the payer (and usually sold-to); the consumer is ship-to and end customer. Name the partner roles, not a new party type. |
| Customer abstraction (commercial / retail) | Business partner with partner roles | SAP Business Partner; Oracle "trading community party" | **Rename** | Engineering vocabulary. |
| Account (meaning the customer) | Customer | Trade practice; with a native ledger, *account* = GL account | **Collision** | Once the platform runs its own double-entry ledger, "the customer's account" and "the receivables account" are two different things a controller will conflate. Reserve *account* for the chart of accounts and for a customer's receivable balance (*customer account statement*). |
| Lead → convert to Customer | Lead → qualified prospect → customer + opportunity | Salesforce/Dynamics CRM convention | **Keep** (practice note) | *Lead* is standard. The one-click lead-to-customer conversion skips the *opportunity*; here the estimate/quote plays that role. Acceptable for job shops, but pipeline value must then be read from open quotes. |
| Deposit / progress billing / milestone billing | Customer deposit (contract liability); progress billing; milestone billing | ASC 606-10-45 (contract liability); AIA G702 for progress billing in construction | **Keep** | Standard. Note *direct deposit* in payroll is unrelated and unambiguous in context. |
| Short-closed | Short-closed | SAP "delivery complete" indicator; Epicor/Oracle "short close" | **Keep** | Standard. |
| Retainage (construction vertical, not yet present) | Retainage / retention | AIA A201; ASC 606 contract asset | **Keep** when introduced | Flagged because the construction vertical will need it. |

## B. Production control, planning and shop floor

| Product term | Industry-standard term | Source of the standard | Ruling | Reasoning |
|---|---|---|---|---|
| Kanban / kanban board | Production board / visual work-order board; dispatch board | TPS; APICS "kanban" = a pull replenishment signal | **Collision** | In manufacturing *kanban* is a pull signal that authorises replenishment or production of a fixed container quantity. A manufacturer reading "Kanban module" expects kanban loops, card quantities and supermarkets, and will conclude the product does pull replenishment. It does not use the word that way. |
| Backlog | Open work orders / work-order queue; *order backlog* is something else | APICS "backlog" = all customer orders booked but not yet shipped; ASC 606-10-50-13 remaining performance obligations | **Collision** | A controller or owner reads *backlog* as unshipped booked revenue. Here it is a list of active shop work. |
| Track type | Work order type (order type) | SAP "order type"; Epicor job type; CMMS "maintenance work order" | **Rename** | Production, R&D/tooling and maintenance are order types. The brief's "routing" is **wrong**: routings exist as their own concept; a track type is a class of work order with its own status set. |
| Stage | User-defined order status (status profile); *not* an operation | SAP "user status" within a status profile, alongside system status | **Rename** | Stages are configurable statuses, not routing steps. The standard analogue is a status profile with allowed transitions, some of which lock posting. The brief's "operation" is **wrong** and would re-create a second routing vocabulary. |
| Irreversible stage / mandatory stage | Status with no reverse transition (posting lock); required status | SAP status profile "lowest/highest status number", business-transaction control | **Rename** | Say what the rule is: *no backward move once a billing or shipping document exists*; *status may not be skipped*. |
| Swimlane | Grouping (by crew, operator, work center) | UI vocabulary | **Keep** | No domain collision; a display term. |
| WIP limit | WIP cap (CONWIP limit) | Lean / CONWIP literature (Hopp & Spearman) | **Keep** | Legitimate lean usage — a cap on work orders in a status. Note it is a *count*, not WIP inventory value. |
| Planning cycle (two-week, commit, burn-down) | Production period plan / weekly schedule; frozen zone | APICS "planning horizon", "time fence", "planning cycle" = the periodic MRP/MPS replanning cadence | **Collision** | In planning, *planning cycle* is how often MRP/MPS is re-run. Here it is a software sprint. With MRP and MPS in the same product, the collision is live. |
| Commit (to a cycle) | Release to the schedule / firm the work order | APICS "firm planned order", "release" | **Rename** | *Commit* is software vocabulary; *firm* and *release* have precise planning meanings. |
| Burn-down | Schedule attainment / plan adherence | APICS "schedule attainment" | **Rename** | |
| Planning Day, focus mode, daily priorities, end-of-day prompt | Dispatch list review; daily production meeting (tier meeting) | APICS "dispatch list"; lean tiered daily management | **Rename** where it concerns shop work; **Keep** for personal task features | These are personal-productivity words. For operators and supervisors, the dispatch list is the standard artefact and already exists in the scheduling module. |
| Routing, operation, work center | Same | APICS | **Keep** | Standard. |
| Production run | Production run (a single setup-to-teardown run within a work order) | Repetitive / batch trade usage | **Keep** — define it | Standard enough, but the documents use it both for a batch within a work order and for the act of reporting production. Fix the definition; do not let *run* be confused with *run time*. |
| Production run logging | Production reporting / operation confirmation | SAP "confirmation"; APICS "labor reporting" | **Rename** | |
| Kiosk / terminal | Shop-floor data collection (SFDC) terminal; kiosk | APICS "data collection"; ProShop/JobBOSS usage | **Keep** | *Kiosk* is widely understood and accurately excludes machine-data collection. |
| Clock in (to a job) / timer / time entry | Attendance clock-in (shift) vs **labor clock-on** to an operation; labor ticket / labor transaction | APICS "labor ticket"; Epicor "clock in" (attendance) vs "start activity" (labor) | **Collision** | Trade practice separates attendance time (payroll) from labor time (costing). Using *clock in* for both, and recording labor at work-order rather than operation level, collapses the two ledgers a job shop reconciles daily (attendance hours vs. applied labor hours — the indirect-labor gap). |
| Team (terminal team, manager scope) | Crew or cell (shop floor); department (organisation) | APICS "work cell", "crew size"; HRIS "department" | **Rename** | |
| Dispatch list, Gantt, finite capacity, forward/backward scheduling | Same | APICS | **Keep** | Standard. |
| MRP, MPS, planned order, demand forecast | Same | APICS | **Keep** | Standard. |
| Working calendar | Shop calendar / work-center calendar | APICS "shop calendar" | **Rename** | Minor. |
| Capability (switchable feature) | Licensed feature / module / feature flag | Vendor licensing practice | **Collision** | In a product with SPC, *capability* already means **process capability** (Cp, Cpk, Pp, Ppk — AIAG SPC manual; ISO 22514). "Capability off" beside a Cpk chart is actively misleading. The brief asked whether this is worth changing: yes. |

## C. Master data, inventory and purchasing

| Product term | Industry-standard term | Source of the standard | Ruling | Reasoning |
|---|---|---|---|---|
| Part / parts catalog | Item / part master | APICS "item master"; Epicor "part" | **Keep** | *Part* is standard in discrete manufacturing. |
| Sourcing (made / bought / subcontracted / phantom) | Procurement type; make/buy code | SAP MRP "procurement type"; APICS "make-or-buy decision" | **Collision** | *Sourcing* means supplier selection (strategic sourcing, RFQ). The product also uses *sourcing* for the vendor-sources tab. Two meanings, one word. The three-axis design itself is standard and stays. |
| Inventory class (raw, component, subassembly, finished good, consumable, tooling) | Item type / material type | SAP "material type"; Oracle "item type"; ASC 330 inventory categories | **Collision** | *Class* is taken twice: **ABC class** (the product has ABC classification) and **class** tracking in the external accounting system (a GL reporting dimension). |
| Taxonomy (shop-configured) | Item category / commodity code | SAP "material group"; UNSPSC | **Rename** | |
| Phantom | Phantom assembly | APICS | **Keep** | Standard. |
| Subcontracted (part) vs outside processing (operation) | Subcontracting vs outside processing (OSP) | APICS; SAP "subcontracting" vs "external operation" | **Keep** — keep distinct | Both standard; they are different things (whole part bought-with-supplied-material vs one operation done offsite). Documents must not use them interchangeably. |
| Bought parts | Purchased parts | APICS | **Rename** | Minor. |
| Reservation / reserve / reserved (bin status) | Allocation (hard allocation) | APICS "allocated material"; SAP uses "reservation" | **Rename** | Both words appear for one concept. Pick *allocation* (APICS, and it matches the conservation law `available = on hand − allocated`). |
| Bin content | Stock by location / bin quantity | WMS trade practice | **Rename** | Entity name leaked into the domain. |
| Bin / storage location | Location hierarchy: warehouse → zone → bin | WMS practice; SAP plant/storage location/bin | **Keep** | Standard, provided the hierarchy is named. |
| Consignment — inbound / outbound | Supplier (vendor) consignment; customer consignment | SAP MM/SD consignment | **Rename** | *Inbound/outbound* reads as shipping direction. And neither is **customer-supplied (free-issue) material** — customer-owned stock held by the shop — which is a third case the documents must name separately. |
| Traceability profile | Lot / serial control (item tracking policy) | APICS "lot control"; SAP "serial number profile", batch management | **Keep** | SAP itself says *profile*; define it as the per-item lot/serial requirement. |
| Vendor / supplier | Vendor (accounting, purchasing); supplier (quality) | US trade practice; ISO 9001 "external provider" | **Keep** | Both are standard. Use *vendor* for commercial records and *supplier* in supplier-quality contexts (SCAR, scorecard). |
| Vendor tier pricing | Quantity price breaks | APICS "price break" | **Rename** | *Tier* also means subscription tier and customer tier. |
| RFQ, award, purchase order, blanket PO, release, receiving, three-way match, GRNI, landed cost | Same | APICS; AICPA practice | **Keep** | Standard. |
| Cycle count, ABC classification, reorder point, min/max, UOM conversion | Same | APICS | **Keep** | Standard. |
| Asset (registry incl. customer-owned tooling) | Equipment / maintainable asset; *fixed asset* is the accounting term; customer-owned tooling | CMMS practice; ASC 360; AIAG PPAP customer-owned tooling | **Collision** (inside the product) | With a native ledger that depreciates assets, a registry that holds customer-owned tooling under the same word invites depreciating property the shop does not own. Distinguish *equipment*, *fixed asset* and *customer-owned tooling*. |
| Document number (editable, superseded numbers resolve) | Document number from a number range; immutable once issued | EU VAT Directive 2006/112/EC art. 226(2) (unique sequential invoice number); PCAOB AS 1105 completeness testing; SAP number ranges | **Rename practice** — see §F | A practice departure, not a naming one. |

## D. Quality

| Product term | Industry-standard term | Source of the standard | Ruling | Reasoning |
|---|---|---|---|---|
| Gated sequence | Approval workflow; hold point; inspection plan; permit-to-work | ISO 9001 §8.6 (release of product); ISO 9001 §8.5.1; OHSAS/ISO 45001 permit-to-work | **Rename** | Implementation vocabulary. In the domain, name the specific artefact: a *hold point* (quality), an *approval* (commercial), a *permit* with *expiry* (compliance). The general mechanism need not have a customer-facing name. |
| QC checklist (template per part) | Inspection plan (inspection characteristics) | SAP QM "inspection plan"; AS9102 characteristic accountability | **Rename** | The documents use both terms for one thing. |
| QC inspection | Inspection (receiving, in-process, final) | ISO 9001 §8.6 | **Keep** | Standard; name the inspection type. |
| NCR, CAPA, ECO, FMEA, PPAP, SPC, FAI, gage | Same (gage = US/AIAG spelling) | AIAG; AS9100; ISO 9001 §10.2 | **Keep** | Standard. |
| Hold / hold type | Hold / hold reason code | APICS "hold"; SAP "reason code" | **Rename** (hold type → hold reason) | |
| Status lifecycle / workflow status / status entry | Status and holds | — | **Rename** | Engineering vocabulary. |
| RMA / customer return, receive-inspect-rework-resolve | RMA; return disposition | APICS; ISO 9001 §8.7 | **Keep** | Standard. |
| Customer Owned (on tooling) | Customer-owned tooling | AIAG PPAP | **Keep** | Standard. |
| Compliance calendar / permits / expiry | Compliance calendar; permit register | Trade practice | **Keep** | Adequate, but see *Compliance* in §E. |

## E. People

| Product term | Industry-standard term | Source of the standard | Ruling | Reasoning |
|---|---|---|---|---|
| Payroll (pay stub and tax-document distribution) | Pay statements / employee pay documents | Payroll industry (ADP, Paychex); IRS W-2 distribution | **Collision** | *Payroll* means calculating gross-to-net pay, withholding, and paying. A buyer will think the product runs payroll. |
| Training (in-app product tutorials) | Help / tutorial library | Software practice | **Collision** | *Training* in a quality system is **competence records** — who is qualified for which operation (ISO 9001 §7.2; AS9100 §7.2; ISO 13485 §6.2). The product plans training management and skills matrices for employees too. |
| Compliance (employee eligibility and tax forms) | Employment eligibility and onboarding forms (I-9, W-4) | USCIS; IRS | **Collision** (inside the product) | *Compliance* in manufacturing means regulatory/quality compliance. Qualify it: *HR compliance forms*. |
| Leave / leave policy / accrual | Leave / PTO / accrual | HRIS practice; FLSA | **Keep** | Standard. |
| Employee / user | Employee (person) vs user (system login) | HRIS vs IAM practice | **Keep** — keep distinct | Standard; the product already separates them. |
| Labor rate | Labor rate (direct), burdened labor rate | APICS | **Keep** | Standard; state whether burdened. |
| Expenses (with job association) | Employee expense report; direct charge to work order | Trade practice | **Keep** | Standard; the association is to a work order. |
| Roles, approvals, approver | Same; segregation of duties | COSO 2013 control activities | **Keep** | Standard. |

## F. Costing and the native ledger

| Product term | Industry-standard term | Source of the standard | Ruling | Reasoning |
|---|---|---|---|---|
| Cost center (GL reporting dimension) vs cost center (costing: floor space, headcount, inventoriable) | Department / segment dimension (GL) vs cost center / cost pool (costing) | SAP CO cost center; IMA *Statements on Management Accounting* | **Collision** (inside the product) | The product's own design notes admit two concepts share one word. A controller will allocate overhead against the reporting dimension. Keep *cost center* for the costing object; call the GL tag a *dimension*. |
| Job cost / job costing | Job-order costing (method); work-order cost (object) | IMA; APICS "job costing" | **Keep** the method name | Renaming Job must not rename the costing method. The method is job-order costing; the cost object is the work order (or the order grouping several). |
| Burden / machine-burden rate / overhead pool / driver / frozen rates | Same | APICS; IMA; standard cost practice | **Keep** | Standard. |
| Standard cost, variance (price, usage, rate, efficiency) | Same | IMA; Horngren *Cost Accounting* | **Keep** | Standard. Price and quantity variances must be named separately — the costing notes already require this. |
| Book | Ledger (book) | SAP "ledger"; Oracle FA "asset book"; Sage Intacct "book" | **Keep** | Standard for multi-book accounting. |
| Accounting mode: external book of record vs native ledger | Same concept; *system of record* | Trade practice | **Keep** | Standard (brief). |
| Inventory write-down | Inventory write-down (LCNRV) | ASC 330-10-35-1B | **Keep** | Standard; not a variance. |

## G. Practice departures (not naming)

| Practice | Standard practice | Source | Verdict |
|---|---|---|---|
| Human-readable document numbers editable within a lifecycle window; superseded numbers still resolve | Numbers drawn from a controlled number range, immutable once the document is issued; gaps explainable | EU VAT Directive 2006/112/EC art. 226(2); PCAOB AS 1105 (completeness via sequence); SAP number ranges | **Departure — tolerable only before issue.** Renumbering a draft is harmless. Renumbering an issued invoice, credit memo, shipment or receipt defeats completeness testing and, for EU/UK/MX customers, breaks statutory invoice rules. Rule stated in the definition of correct. |
| Invoicing triggered by a work-order status change | Invoicing triggered by a billing event: shipment (goods), milestone or deposit (non-goods) | ASC 606-10-25-30 (point-in-time control transfer) | Addressed by Ruling #1 in the definition of correct. |
| Lead converts straight to customer | Lead → opportunity → customer | CRM practice | Tolerable (see §A). |
| Labor recorded at work-order level, not operation | Labor reported per operation | APICS labor reporting; Epicor/ProShop | **Departure** — defeats per-operation quantity balance and labor efficiency variance. |
