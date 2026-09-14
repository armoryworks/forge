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

1. **Eleven collisions beyond Job.** In rough order of damage: *kanban*, *capability*, *estimate* (at the accounting seam), *planning cycle*, *inventory class*, *WIP limit*, *project* (as a work-order label), *disposition* (on a work order), *clock in* (attendance vs labor), *payroll*, *training*. Each is a word a manufacturer, controller or auditor already owns and will read with their meaning. A further five collide inside the product's own document set (*cost center*, *sourcing*, *attestation*, *asset*, *compliance*). Two earlier collision rulings were overstated and are now softened: *backlog* (Rename — owners also use it for queued work) and *account* (Keep — the CRM meaning is standard; qualify *GL account*).
2. **The brief's starting list is wrong in three places.** *Track type / stage* is not a routing (routings exist separately); the standard analogue is a work-order type and status profile. *Attestation / proof of intent* is not an order acknowledgment (that flows seller to buyer); it is **order authorization evidence**. *Retail buyer* is not simply the ship-to party; partner roles split by channel.
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
| Project (as a re-mapped label for the work order) | Project = contract-level cost collector with a WBS, containing many work orders | PMI PMBOK; ASC 606 over-time contracts; construction job-cost practice (AIA) | **Collision** | Per-install label remapping (standard as a feature) lets a shop call the work order a *Project*. In project accounting and construction a project is the engagement costed and billed over time — the level *above* the work order, which is exactly the meaning *job* has in job-order costing. The construction vertical will make this live. Offer *Project* only as the label for the contract level, never for the work order. |
| Dispose / disposition (of a job) | Close / cancel / archive a work order | APICS, ISO 9001 §8.7 (disposition = decision on nonconforming product) | **Collision** | *Disposition* is the MRB decision on nonconforming material (use-as-is, rework, scrap, return to vendor). Using it for ending a work order will be read as a quality decision. |
| Estimate (early, non-binding, not itemised) | Budgetary quote / ROM (rough order of magnitude) estimate | Trade practice; QuickBooks "Estimate" = a customer-facing quotation | **Collision** (at the accounting seam) | The two-document split is standard and stays. But the external book of record calls its *quotation* document an Estimate, so this product's *Quote* maps to that system's *Estimate* and this product's *Estimate* has no counterpart. Keep the split; rename the early form *budgetary estimate* and document the mapping. |
| Quote | Quotation / quote | APICS; SAP SD "quotation" | **Keep** | Standard. |
| Sales order | Sales order | APICS; SAP SD | **Keep** | Standard. |
| Attestation / proof of intent | **Order authorization evidence** (artefacts: customer purchase order, written acceptance of quote, e-signature, recorded verbal order) | ASC 606-10-25-1(a) "the parties have approved the contract"; UCC §2-201 / §2-207 | **Collision** | *Attestation* is a declarant's formal statement (the product itself uses it correctly on employment eligibility forms, USCIS Form I-9). Evidence that a customer ordered is not an attestation. Order *acknowledgment* is the seller's reply and is the wrong fix. *Order acceptance evidence* was considered and rejected: *acceptance* already means customer acceptance of delivered goods (ASC 606-10-55-85 to -88, acceptance clauses) and shop-floor **acceptance inspection**. *Authorization* names what the evidence proves — that the customer authorised the work. |
| Retail buyer / consumer | Partner roles: sold-to, bill-to, ship-to, payer | SAP SD partner functions; US marketplace-facilitator statutes | **Rename** | The brief's "ship-to party" is half right, and the roles depend on channel. Third-party marketplace: the shop is normally seller of record, the **consumer is sold-to, bill-to and ship-to**, the marketplace is **payer** (remits proceeds net of fees). Wholesale/drop-ship to a retailer: the retailer is sold-to and payer, the consumer ship-to only. Name the partner roles, not a new party type. |
| Customer abstraction (commercial / retail) | Business partner with partner roles | SAP Business Partner; Oracle "trading community party" | **Rename** | Engineering vocabulary. |
| Account (meaning the customer) | Account (CRM) — customer organisation; *GL account* in the ledger | Salesforce / Dynamics CRM "Account"; chart of accounts | **Keep** — qualify in ledger contexts | *Account = customer organisation* is the dominant CRM meaning, so the product's usage is standard, not a collision. Two standards meet here once the native ledger is on; the fix is qualification, not renaming: say **GL account** and **customer account statement** wherever the ledger is in view. |
| Lead → convert to Customer | Lead → qualified prospect → customer + opportunity | Salesforce/Dynamics CRM convention | **Keep** (practice note) | *Lead* is standard. The one-click lead-to-customer conversion skips the *opportunity*; here the estimate/quote plays that role. Acceptable for job shops, but pipeline value must then be read from open quotes. |
| Deposit / progress billing / milestone billing | Customer deposit (contract liability); progress billing; milestone billing | ASC 606-10-45 (contract liability); AIA G702 for progress billing in construction | **Keep** | Standard. Note *direct deposit* in payroll is unrelated and unambiguous in context. |
| Short-closed | Short-closed | SAP "delivery complete" indicator; Epicor/Oracle "short close" | **Keep** | Standard. |
| Retainage (construction vertical, not yet present) | Retainage / retention | AIA A201; ASC 606 contract asset | **Keep** when introduced | Flagged because the construction vertical will need it. |

## B. Production control, planning and shop floor

| Product term | Industry-standard term | Source of the standard | Ruling | Reasoning |
|---|---|---|---|---|
| Kanban / kanban board | Production board / visual work-order board; dispatch board | TPS; APICS "kanban" = a pull replenishment signal | **Collision** | In manufacturing *kanban* is a pull signal that authorises replenishment or production of a fixed container quantity. A manufacturer reading "Kanban module" expects kanban loops, card quantities and supermarkets, and will conclude the product does pull replenishment. It does not use the word that way. |
| Backlog | Open work-order queue (work-center queue) | APICS "backlog" — both *customer orders booked but not shipped* and *work waiting at a work center* | **Rename** | Job-shop owners use *backlog* both for unshipped order value and for queued shop hours; the product's usage matches the second meaning, so this is not a collision. But the financial meaning (ASC 606-10-50-13 remaining performance obligations) is what an owner or lender expects on a dashboard. Say *open work orders* for the list and reserve *backlog* for booked-but-unshipped orders in dollars or hours, labelled. |
| Track type | Work order type (order type) | SAP "order type"; Epicor job type; CMMS "maintenance work order" | **Rename** | Production, R&D/tooling and maintenance are order types. The brief's "routing" is **wrong**: routings exist as their own concept; a track type is a class of work order with its own status set. |
| Stage | User-defined order status (status profile); *not* an operation | SAP "user status" within a status profile, alongside system status | **Rename** | Stages are configurable statuses, not routing steps. The standard analogue is a status profile with allowed transitions, some of which lock posting. The brief's "operation" is **wrong** and would re-create a second routing vocabulary. |
| Irreversible stage / mandatory stage | Status with no reverse transition (posting lock); required status | SAP status profile "lowest/highest status number", business-transaction control | **Rename** | Say what the rule is: *no backward move once a billing or shipping document exists*; *status may not be skipped*. |
| Swimlane | Grouping (by crew, operator, work center) | UI vocabulary | **Keep** | No domain collision; a display term. |
| WIP limit | Status capacity limit (maximum work orders in a status) | Lean / CONWIP literature uses *WIP cap*; ASC 330 / chart of accounts *WIP* = work-in-process inventory | **Collision** | Lean usage is legitimate on its own, but with a native ledger *WIP* is a balance-sheet account valued in dollars. A "WIP limit" counting cards will be read by a controller as a cap on WIP inventory value. Rename the product's control to *status limit*; keep *WIP* for inventory. |
| Planning cycle (two-week, commit, burn-down) | Production period plan / weekly schedule; frozen zone | APICS "planning horizon", "time fence", "planning cycle" = the periodic MRP/MPS replanning cadence | **Collision** | In planning, *planning cycle* is how often MRP/MPS is re-run. Here it is a software sprint. With MRP and MPS in the same product, the collision is live. |
| Commit (to a cycle) | **Schedule** (into the period plan) — distinct from **firm** and **release** | APICS "firm planned order", "release", "load" | **Rename** | Three different events: *scheduling* a work order into a period is a capacity intention; *firming* a planned order stops MRP from changing it; *release* authorises labor and material. The product's *commit* is the first only. Mapping it to firm or release would claim authority it does not carry. |
| Burn-down | Schedule attainment / plan adherence | APICS "schedule attainment" | **Rename** | |
| Planning Day, focus mode, daily priorities, end-of-day prompt | Dispatch list review; daily production meeting (tier meeting) | APICS "dispatch list"; lean tiered daily management | **Rename** where it concerns shop work; **Keep** for personal task features | These are personal-productivity words. For operators and supervisors, the dispatch list is the standard artefact and already exists in the scheduling module. |
| Routing, operation, work center | Same | APICS | **Keep** | Standard. |
| Production run | Production lot / batch (the quantity made in one setup-to-teardown run within a work order) | APICS "lot", "batch"; repetitive trade usage | **Rename** | The documents use *production run* both for a batch within a work order and for the act of reporting production, and *run* also means *run time* in every routing. Three meanings is disqualifying. Say *production lot* for the batch. |
| Production run logging | Production reporting / operation confirmation | SAP "confirmation"; APICS "labor reporting" | **Rename** | Follows from the row above. |
| Kiosk / terminal | Shop-floor data collection (SFDC) terminal; kiosk | APICS "data collection"; ProShop/JobBOSS usage | **Keep** | *Kiosk* is widely understood and accurately excludes machine-data collection. |
| Clock in (to a job) / timer / time entry | Attendance clock-in (shift) vs **labor clock-on** to an operation; labor ticket / labor transaction | APICS "labor ticket"; Epicor "clock in" (attendance) vs "start activity" (labor) | **Collision** | Trade practice separates attendance time (payroll) from labor time (costing). Using *clock in* for both, and recording labor at work-order rather than operation level, collapses the two ledgers a job shop reconciles daily (attendance hours vs. applied labor hours — the indirect-labor gap). |
| Team (terminal team, manager scope) | Crew or cell (shop floor); department (organisation) | APICS "work cell", "crew size"; HRIS "department" | **Rename** | |
| Dispatch list, Gantt, finite capacity, forward/backward scheduling | Same | APICS | **Keep** | Standard. |
| MRP, MPS, planned order, demand forecast | Same | APICS | **Keep** | Standard. |
| Working calendar | Shop calendar / work-center calendar | APICS "shop calendar" | **Rename** | Minor. |
| Capability (switchable feature) | **Feature** (switchable product feature) | Vendor licensing practice | **Collision** | In a product with SPC, *capability* already means **process capability** (Cp, Cpk, Pp, Ppk — AIAG SPC manual; ISO 22514). "Capability off" beside a Cpk chart is actively misleading. The refreshed definition of correct uses *feature* throughout; *module* is too coarse (features are finer than modules and have dependencies). |

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
| Traceability profile | Lot / serial control settings (per item) | APICS "lot control", "serial control"; SAP batch management indicator, serial number profile | **Rename** | Earlier kept because SAP says *serial number profile*. That was habit: SAP's profile governs serials only, and lot control is a separate indicator. A single *traceability profile* obscures which of lot, serial or both is required. Say *lot/serial control*. |
| Vendor / supplier | Vendor (accounting, purchasing); supplier (quality) | US trade practice; ISO 9001 "external provider" | **Keep** | Both are standard. Use *vendor* for commercial records and *supplier* in supplier-quality contexts (SCAR, scorecard). |
| Vendor tier pricing | Quantity price breaks | APICS "price break" | **Rename** | *Tier* also means subscription tier and customer tier. |
| RFQ, award, purchase order, blanket PO, release, receiving, three-way match, GRNI, landed cost | Same | APICS; AICPA practice | **Keep** | Standard. |
| Cycle count, ABC classification, reorder point, min/max, UOM conversion | Same | APICS | **Keep** | Standard. |
| Asset (registry incl. customer-owned tooling) | Equipment / maintainable asset; *fixed asset* is the accounting term; customer-owned tooling | CMMS practice; ASC 360; AIAG PPAP customer-owned tooling | **Collision** (inside the product) | With a native ledger that depreciates assets, a registry that holds customer-owned tooling under the same word invites depreciating property the shop does not own. Distinguish *equipment*, *fixed asset* and *customer-owned tooling*. |
| Document number (editable, superseded numbers resolve) | Document number from a number range; immutable once issued | EU VAT Directive 2006/112/EC art. 226(2) (unique sequential invoice number); PCAOB AS 1105 completeness testing; SAP number ranges | **Rename practice** — see §F | A practice departure, not a naming one. |

## D. Quality

| Product term | Industry-standard term | Source of the standard | Ruling | Reasoning |
|---|---|---|---|---|
| Gated sequence | **Approval workflow** (generic mechanism); *hold point* only for a planned inspection stop; *permit* for permits with expiry | ISO 9001 §8.6 (release of product); ASME NQA-1 / ISO 9001 hold-point practice; ISO 45001 permit-to-work | **Rename** | Implementation vocabulary. Earlier this row stretched *hold point* to commercial approvals and permits; that collides with the generic *hold* (a stop on a document or lot). The generic mechanism is an approval workflow; an inspection stop configured in it is a hold point. *Stage-gate* was considered and rejected: it is Cooper's product-development process and collides with the product's own *stage*. |
| QC checklist (template per part) | Inspection plan (inspection characteristics) | SAP QM "inspection plan"; AS9102 characteristic accountability | **Rename** | The documents use both terms for one thing. |
| QC inspection | Inspection (receiving, in-process, final) | ISO 9001 §8.6 | **Keep** | Standard; name the inspection type. |
| NCR, CAPA, ECO, FMEA, PPAP, SPC, FAI, gage | Same (gage = US/AIAG spelling) | AIAG; AS9100; ISO 9001 §10.2 | **Keep** | Standard. |
| Hold / hold type | Hold / hold reason code | APICS "hold"; SAP "reason code" | **Rename** (hold type → hold reason) | |
| Status lifecycle / workflow status / status entry | Status and holds | — | **Rename** | Engineering vocabulary. |
| RMA / customer return, receive-inspect-rework-resolve | RMA; return disposition | APICS; ISO 9001 §8.7 | **Keep** | Standard. |
| Customer Owned (on tooling) | Customer-owned tooling | AIAG PPAP | **Keep** | Standard. |
| Compliance calendar / permits / expiry | Permit and licence register; regulatory calendar | Trade practice | **Rename** | Earlier kept while *Compliance* (§E) was ruled a collision — inconsistent. The calendar tracks permits and licence expiries; name it for that. |

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
| Labor recorded at work-order level, not operation | Labor reported per operation where operation-level control is wanted | APICS labor reporting; Epicor/ProShop | **Legitimate option, with a cost.** Many small shops report at work-order level. It gives up per-operation quantity balance and labor efficiency by operation; the definition of correct makes those rules conditional on operation-level reporting. |
