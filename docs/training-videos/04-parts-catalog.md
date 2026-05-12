# Manuscript: Parts Catalog and BOM Video Overview

**Module ID:** 22
**Slug:** `video-parts-catalog-and-bom`
**App Route:** `/parts`
**Estimated Duration:** 10–12 minutes
**Generation Command:** `POST /api/v1/training/modules/22/generate-video`

---

## Purpose

The parts catalog is the engineering backbone of Forge. Engineers live here. This video covers the full lifecycle of a part from creation through BOM assembly, process planning, and connection to jobs, inventory, and purchasing. It is intentionally comprehensive — this is reference material that engineers will return to.

### Learning Objectives
- Understand the parts catalog layout and status system
- Create a new part with all required metadata
- Understand Make vs Buy vs Stock part types
- Build a Bill of Materials
- Set lead times for BOM line items
- Add process steps to a part
- Link parts to jobs
- Search and filter the catalog efficiently
- Understand how parts connect to inventory and purchase orders

### Audience
Engineers, PMs. Production Workers (read-only reference).

### Learning Style Coverage
- **Visual:** Spatial orientation of the catalog, part types by color coding
- **Auditory:** Explain the Why behind Make/Buy/Stock and BOM structure
- **Reading/Writing:** Field-by-field creation walkthrough
- **Kinesthetic:** Create a real test part with a two-level BOM

---

## Chapter Breakdown

---

### Chapter 1 — Spatial Orientation: The Parts Catalog
**Estimated timestamp:** 0s
**UI Element:** `app-parts`
**Chapter label:** "Catalog Overview"

**Narration Script:**
You are on the Parts Catalog page. Take a moment to orient spatially. The main area is a data table — each row is one part. Columns include part number, description, type, status, and unit of measure. Above the table is a toolbar with a search field, status filter, type filter, and a New Part button. The table is sortable by any column — click a column header to sort. The catalog contains everything your shop makes, buys, or keeps in stock — every component, every material, every finished good. This is the authoritative list. If something is not here, it does not officially exist in your shop's vocabulary.

**Kinesthetic prompt:** Sort the catalog by Status. Notice how Draft, Prototype, Active, and Obsolete parts group together.

---

### Chapter 2 — Part Status and Lifecycle
**Estimated timestamp:** 55s
**UI Element:** `app-parts app-data-table`
**Chapter label:** "Part Status"

**Narration Script:**
Every part has a status that controls where it can be used. Draft means the part is being defined — it cannot be added to a BOM or a quote yet. Prototype means the design is active but the part has not been formally released — it can be quoted but may be subject to change. Active is the normal working status — the part can be quoted, ordered, and produced. Obsolete means the part is no longer used — it remains in the catalog for historical reference but cannot be added to new jobs or BOMs. Changing status is a deliberate action. Moving from Draft to Active typically represents an engineering release — a decision that the design is stable enough to manufacture.

**Alternative paths:** Some shops use a formal Engineering Change Request process before status changes. If your company has this configured, a status change may trigger a review workflow rather than changing immediately.

**Kinesthetic prompt:** Find one part of each status in the catalog. Notice how the status column uses color to differentiate them.

---

### Chapter 3 — Creating a New Part
**Estimated timestamp:** 125s
**UI Element:** `app-parts .action-btn--primary`
**Chapter label:** "Creating a Part"

**Narration Script:**
Click New Part to open the part creation dialog. Required fields: Part Number — your shop's naming convention here, often includes a prefix for the product family and a revision letter like A, B, C. Description — what the part is in plain English. Type — this is critical and we will cover it next. Unit of Measure — each, inches, feet, pounds, kilograms — how you count or measure this part. Optional but recommended: set the Status to Active if this is a released design, and add any relevant tags. After saving, the part appears in the catalog and you can add a BOM, process steps, and attachments from its detail view.

**Kinesthetic prompt:** Create a test part with your own part number convention. Notice the form highlights required fields with an asterisk.

---

### Chapter 4 — Make vs Buy vs Stock: The Critical Decision
**Estimated timestamp:** 200s
**UI Element:** `app-parts .action-btn--primary`
**Chapter label:** "Make, Buy, Stock"

**Narration Script:**
The Type field on every part is one of three values, and choosing correctly matters. Make means your shop fabricates this part in-house. It will appear on production jobs and trigger process steps. Buy means you purchase this part from a vendor. When a job requires it, Forge can generate a purchase order. Stock means it comes from your own inventory — already on the shelf. When a job calls for a stock item, Forge checks your current inventory and alerts you if you are running low. The distinction drives purchasing suggestions, production scheduling, and inventory alerts. Getting this wrong causes missed deliveries and excess inventory.

**Alternative paths:** A part can change type over time — for example, you might outsource (Buy) a part that you previously made in-house (Make). This is a normal engineering decision. Change the type on the part record and the downstream behavior updates automatically.

**Kinesthetic prompt:** Find one Make part, one Buy part, and one Stock part in the catalog. Read their descriptions to understand the pattern.

---

### Chapter 5 — Building a Bill of Materials
**Estimated timestamp:** 275s
**UI Element:** `app-parts app-page-header`
**Chapter label:** "BOM Assembly"

**Narration Script:**
Open any Make part and switch to the BOM tab. The Bill of Materials is the recipe for this part — it lists every component needed to build one unit. To add a component, click Add BOM Item. Search for the child part by number or description. If it does not exist yet, create it inline — the system lets you create a stub part directly from the BOM editor without losing your place. Set the quantity per parent unit. Set the type for this line item — Make, Buy, or Stock. Set a lead time in days if this component has a predictable procurement or fabrication time. The lead times roll up to give you a total lead time estimate for the parent part.

**Alternative paths:** BOMs can have multiple levels — a BOM item can itself have a BOM, creating a tree structure. Forge handles multi-level BOMs and can roll up total material cost and lead time across all levels.

**Kinesthetic prompt:** Open a part that has a BOM and expand one of its sub-components to see if that component also has a BOM of its own.

---

### Chapter 6 — BOM Line Items: Quantity and Lead Time
**Estimated timestamp:** 360s
**UI Element:** `app-parts app-data-table`
**Chapter label:** "Quantities and Lead Times"

**Narration Script:**
Let's look more closely at each BOM line item. Quantity per unit: how many of this component are needed to make one of the parent part. If the parent is a 10-piece kit, you might need 10 of a stock fastener — set quantity to 10. Lead time in days: for Buy components, this is the typical vendor lead time. For Make components, it is the typical fabrication time. For Stock components, it might be zero if you keep it on hand. These numbers feed into the planning tool — when a manager is scheduling a production run, Forge uses the BOM lead times to suggest the latest possible order dates for purchased components. Keeping lead times current keeps your schedule accurate.

**Kinesthetic prompt:** Find a BOM with at least three line items. Add up the longest-path lead times manually and compare to the system's total lead time estimate.

---

### Chapter 7 — Adding Process Steps
**Estimated timestamp:** 435s
**UI Element:** `app-parts app-page-header`
**Chapter label:** "Process Steps"

**Narration Script:**
Switch to the Process Plan tab on a Make part. This is where you document the manufacturing operations needed to produce the part. Each step has: an operation name — such as Saw, Mill, Drill, Inspect, or Pack. A description of the specific work. The work center or machine involved. The setup time in minutes — time needed to set up the machine before starting. The cycle time per unit in minutes — how long each piece takes. Process steps are displayed on the shop floor kiosk so workers know exactly what operations to perform and in what order. Accurate cycle times also feed into job scheduling and capacity planning.

**Alternative paths:** If you have standard operations that repeat across many parts — like Deburr or Final Inspection — you can create operation templates and insert them rather than re-entering from scratch each time.

**Kinesthetic prompt:** Open a Make part with process steps. Look at the cycle time column and mentally estimate how many units one operator could complete in an 8-hour shift.

---

### Chapter 8 — Linking Parts to Jobs
**Estimated timestamp:** 510s
**UI Element:** `app-parts app-toolbar app-input`
**Chapter label:** "Parts and Jobs"

**Narration Script:**
Parts and jobs are tightly connected in Forge. When you create a new job, one of the fields is the associated part number — linking the job to a specific part tells the system what you are making, which process steps to display, and which BOM items to suggest for purchasing. You can also link a part to an existing job: from the kanban board, open the job detail panel and look for the Part field. Start typing and the typeahead shows matching parts. Once linked, the job cost-to-date is compared against the part's standard cost, and any BOM shortages are flagged for the purchasing team. The connection between parts and jobs is what transforms Forge from a task manager into a true manufacturing operations system.

**Alternative paths:** A single job can reference multiple parts — for example, an assembly job that produces a multi-part kit. In this case, add each part as a separate line item on the sales order and link each line to the job.

**Kinesthetic prompt:** Search for a part in the catalog and check whether it has any active linked jobs by looking at the job count indicator on the part detail.

---

### Chapter 9 — Inventory Connection
**Estimated timestamp:** 585s
**UI Element:** `app-parts app-data-table`
**Chapter label:** "Inventory Connection"

**Narration Script:**
Stock-type parts are directly connected to the Inventory module. When you view a Stock part, an Inventory tab shows the current quantity on hand, the bin location where it lives in your shop, and a movement history showing every time stock was received, consumed, or adjusted. If inventory falls below a configured reorder point, the part shows a low stock indicator in the catalog — a yellow warning icon. This alert is also visible on the dashboard. Buy-type parts that you order from vendors connect through the Purchase Orders module — when a job calls for a Buy part, the system can suggest or auto-create a purchase order for the needed quantity. The parts catalog is the hub that connects your engineering data to your operational data.

**Kinesthetic prompt:** Find a Stock part in the catalog. Switch to its Inventory tab and look at the current quantity on hand and the bin location.

---

### Chapter 10 — Search, Filter, and Export
**Estimated timestamp:** 655s
**UI Element:** `app-parts app-toolbar app-input`
**Chapter label:** "Search and Filter"

**Narration Script:**
The parts catalog can grow to thousands of entries. The search and filter tools are essential. The search bar at the top of the toolbar is a full-text search across part numbers and descriptions — fast and responsive. Use the Status filter to show only Active parts when you are quoting. Use the Type filter to show only Buy parts when you are reviewing purchasing needs. Column header filters let you narrow by specific criteria within each column — for example, show only parts with a lead time greater than 30 days. Save common filter combinations as bookmarks using the column manager. Export the filtered results to CSV using the export button in the toolbar — useful for sharing a parts list with a vendor or for importing into a cost analysis spreadsheet.

**Kinesthetic prompt:** Filter the parts catalog to show only Active Make parts. Export the result to CSV and open it. Verify the exported data matches what you see on screen.

---

## Full Transcript

The Parts Catalog is every component, material, and finished good your shop interacts with — all in one place. If something is not here, it does not officially exist.

Every part has a status: Draft, Prototype, Active, or Obsolete. Status controls where the part can be used. Draft parts cannot be added to BOMs or quotes. Active parts are fully available. Obsolete parts exist for historical reference only.

The Type field on every part is one of three values: Make — you fabricate it, Buy — you purchase it from a vendor, Stock — it comes from your own inventory. This distinction drives purchasing suggestions, production scheduling, and inventory alerts. Getting it right is not optional.

To create a part, click New Part. Fill in part number, description, type, and unit of measure. Optional: add tags, set status, add an image. After saving, open the part to add a BOM and process steps.

The Bill of Materials tab is the recipe for a Make part. Add each component, set the quantity per unit, choose the type, and set a lead time in days. Multi-level BOMs are supported — a BOM line item can have its own BOM.

The Process Plan tab documents manufacturing operations — saw, mill, drill, inspect — with setup time and cycle time per unit. These feed directly into the shop floor display and into capacity planning.

Parts link to jobs through the job detail panel on the kanban board. Once linked, the job's actual cost compares to the part's standard cost and BOM shortages surface to the purchasing team.

Stock parts connect to the Inventory module — on-hand quantities, bin locations, reorder alerts. Buy parts connect to Purchase Orders — the system suggests orders when jobs call for them.

Use search, status filter, and type filter to navigate large catalogs. Export to CSV for vendor quotes or cost analysis.

---

## Playwright Generation Spec

```json
{
  "appRoute": "/parts",
  "embedUrl": "https://www.youtube.com/embed/YE7VzlLtp-4",
  "steps": [
    {
      "element": "app-parts",
      "popover": {
        "title": "Catalog Overview",
        "description": "You are on the Parts Catalog. The main area is a data table — each row is one part with its number, description, type, status, and unit of measure. Above the table is a toolbar with search, filters, and a New Part button. The catalog contains everything your shop makes, buys, or stocks. If something is not here, it does not officially exist in your shop's vocabulary. Sort any column by clicking its header."
      }
    },
    {
      "element": "app-parts app-data-table",
      "popover": {
        "title": "Part Status",
        "description": "Every part has a status controlling where it can be used. Draft means in definition — cannot be added to a BOM or quote yet. Prototype means design is active but not formally released. Active is the normal working status — can be quoted, ordered, and produced. Obsolete means no longer used — kept for historical reference only. Moving from Draft to Active represents an engineering release — a decision the design is stable enough to manufacture."
      }
    },
    {
      "element": "app-parts .action-btn--primary",
      "popover": {
        "title": "Creating a Part",
        "description": "Click New Part to open the creation dialog. Required fields: Part Number using your shop's naming convention, often including a product family prefix and revision letter. Description in plain English. Type — critical, covered next. Unit of Measure — each, inches, feet, pounds. After saving, open the part to add a BOM, process steps, and file attachments from its detail view."
      }
    },
    {
      "element": "app-parts .action-btn--primary",
      "popover": {
        "title": "Make, Buy, Stock",
        "description": "The Type field is one of three values and choosing correctly matters. Make means your shop fabricates this part — it appears on production jobs. Buy means you purchase it from a vendor — Forge can generate a purchase order when a job needs it. Stock means it comes from your own inventory — the system checks quantity on hand and alerts when running low. The distinction drives purchasing, scheduling, and inventory alerts. Getting this wrong causes missed deliveries."
      }
    },
    {
      "element": "app-parts app-page-header",
      "popover": {
        "title": "BOM Assembly",
        "description": "Open any Make part and switch to the BOM tab. The Bill of Materials is the recipe for this part — every component needed to build one unit. Click Add BOM Item, search for the child part, set quantity per parent unit, set the type, and set a lead time in days if applicable. Lead times roll up to give a total lead time estimate for the parent part. Multi-level BOMs are supported — a BOM line item can have its own BOM creating a full component tree."
      }
    },
    {
      "element": "app-parts app-data-table",
      "popover": {
        "title": "Quantities and Lead Times",
        "description": "Each BOM line has a quantity and a lead time. Quantity per unit is how many of this component make one of the parent part. Lead time in days is the typical procurement time for Buy parts, fabrication time for Make parts, or zero for Stock items you keep on hand. These numbers feed directly into the planning tool — when scheduling a production run, Forge uses BOM lead times to suggest the latest possible purchase order dates for procured components."
      }
    },
    {
      "element": "app-parts app-page-header",
      "popover": {
        "title": "Process Steps",
        "description": "Switch to the Process Plan tab on a Make part. This documents manufacturing operations: operation name, description, work center or machine, setup time in minutes, and cycle time per unit in minutes. Process steps display on the shop floor kiosk so workers know exactly what to do and in what order. Accurate cycle times feed into job scheduling and capacity planning. Standard operations like Deburr or Final Inspection can be templated and reused across many parts."
      }
    },
    {
      "element": "app-parts app-toolbar app-input",
      "popover": {
        "title": "Parts and Jobs",
        "description": "When you create a job, link it to a part number. This tells the system what you are making, which process steps to display on the shop floor, and which BOM items to suggest for purchasing. You can also link a part to an existing job from the kanban board job detail panel. Once linked, the job's actual cost compares against the part's standard cost and BOM shortages are flagged for the purchasing team."
      }
    },
    {
      "element": "app-parts app-data-table",
      "popover": {
        "title": "Inventory Connection",
        "description": "Stock-type parts connect directly to the Inventory module. The part's Inventory tab shows quantity on hand, bin location, and a movement history. When inventory falls below the configured reorder point, a yellow warning icon appears in the catalog. Buy-type parts connect through Purchase Orders — when a job calls for a Buy part, the system can suggest or auto-generate a purchase order. The parts catalog is the hub that connects engineering data to operational data."
      }
    },
    {
      "element": "app-parts app-toolbar app-input",
      "popover": {
        "title": "Search and Filter",
        "description": "The search bar performs full-text search across part numbers and descriptions — fast and responsive. Use the Status filter to show only Active parts when quoting. Use the Type filter to show only Buy parts when reviewing purchasing needs. Column header filters allow numeric and date-range filtering within individual columns. Export the filtered results to CSV using the export button — useful for sharing parts lists with vendors or importing into cost analysis spreadsheets."
      }
    }
  ],
  "chaptersJson": [
    { "timeSeconds": 0, "label": "Catalog Overview" },
    { "timeSeconds": 55, "label": "Part Status" },
    { "timeSeconds": 125, "label": "Creating a Part" },
    { "timeSeconds": 200, "label": "Make, Buy, Stock" },
    { "timeSeconds": 275, "label": "BOM Assembly" },
    { "timeSeconds": 360, "label": "Quantities and Lead Times" },
    { "timeSeconds": 435, "label": "Process Steps" },
    { "timeSeconds": 510, "label": "Parts and Jobs" },
    { "timeSeconds": 585, "label": "Inventory Connection" },
    { "timeSeconds": 655, "label": "Search and Filter" }
  ]
}
```
