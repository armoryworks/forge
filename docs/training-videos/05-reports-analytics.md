# Manuscript: Reports and Analytics Video Guide

**Module ID:** 23
**Slug:** `video-reports-and-analytics`
**App Route:** `/reports`
**Estimated Duration:** 10–12 minutes
**Generation Command:** `POST /api/v1/training/modules/23/generate-video`

---

## Purpose

The report builder is one of the most powerful and underused features in Forge. This video transforms it from intimidating to approachable by starting with pre-built templates and progressively introducing customization. The target audience includes managers who need business intelligence, engineers who want production insights, and office staff who need financial summaries.

### Learning Objectives
- Navigate the reports page and understand the two-panel layout
- Run a pre-built report template
- Build a custom report from scratch
- Choose a data source
- Select and reorder columns
- Apply filters (text, number, date, enum)
- Group and aggregate data
- Sort results
- Visualize with charts
- Save a report for reuse
- Export to CSV and PDF

### Audience
Managers, PMs, Office Managers, Admins. Engineers who want production metrics.

### Learning Style Coverage
- **Visual:** Demonstrate the two-panel layout; show a result table before explaining how to build one
- **Auditory:** Explain why each filter type matters and what business question each template answers
- **Reading/Writing:** Walk through field selection and filter configuration in detail
- **Kinesthetic:** Build a real report on live data

---

## Chapter Breakdown

---

### Chapter 1 — Spatial Orientation: The Reports Page
**Estimated timestamp:** 0s
**UI Element:** `app-reports`
**Chapter label:** "Reports Overview"

**Narration Script:**
You are on the Reports page. Let's orient spatially before touching anything. The page has two panels. On the left is the saved reports sidebar — a list of every report that has been saved and named. Click any entry and the report runs immediately. On the right is the main report area — this is where results appear in a table when you run a report, and where the report builder interface appears when you create a new one. At the top of the saved reports sidebar are filters to search the list by name or category. The New Report button in the upper right of the main area opens the report builder. This two-panel layout means you can quickly switch between saved reports without losing your place in the builder.

**Kinesthetic prompt:** Scan the saved reports list. Note the category labels — Jobs, Finance, Time, Inventory, and others. Count how many exist in the category most relevant to your role.

---

### Chapter 2 — Running a Pre-built Report
**Estimated timestamp:** 55s
**UI Element:** `app-reports`
**Chapter label:** "Running a Template"

**Narration Script:**
The fastest way to get value from the report builder is to use the 27 pre-built templates. These were designed by people who have managed manufacturing shops and know what questions matter. Click any template in the left sidebar and it runs immediately — results appear in the main panel within seconds. Let's try one: click Open Jobs by Priority. The result is a table of every active job sorted by urgency, showing job number, customer, stage, assigned engineer, due date, and priority level. This one report replaces a daily standup question that used to require someone to manually scan the board. Read the column headers. Notice the filters at the top of the result table — you can refine without rebuilding.

**Alternative paths:** Templates that include date range filters default to the current week or month. Click the date range chip at the top of the result to change it. The report reruns with the new range without you having to rebuild anything.

**Kinesthetic prompt:** Run the Monthly Time by Employee template. Read the first row and verify the hours total makes sense for that person's role.

---

### Chapter 3 — The Report Builder: Choosing a Data Source
**Estimated timestamp:** 130s
**UI Element:** `app-reports .action-btn--primary`
**Chapter label:** "Data Sources"

**Narration Script:**
Click New Report to open the report builder. The first step is choosing a data source — the entity type your report will be based on. The available sources are: Jobs, Time Entries, Expenses, Parts, Purchase Orders, Sales Orders, Inventory, Shipments, Invoices, Payments, Customers, Vendors, Quotes, Assets, Leads, and more — over 28 sources in total. Choosing a source determines which fields you can add as columns and which filters you can apply. The source cannot be changed after you start adding columns, so choose carefully. A good rule: start with the entity you want one row per. If you want one row per job, choose Jobs. If you want one row per time entry, choose Time Entries.

**Alternative paths:** If you need to combine data from two sources — for example, jobs with their associated time entries — choose the primary source (Jobs) and look for related fields in the field selector. Many sources include joined fields from related entities.

**Kinesthetic prompt:** Click New Report and look at the full data source dropdown. Note a source you would not have expected to find there.

---

### Chapter 4 — Choosing Columns
**Estimated timestamp:** 205s
**UI Element:** `app-reports`
**Chapter label:** "Selecting Columns"

**Narration Script:**
After choosing a data source, you land in the field selector. On the left is the full list of available fields for your chosen source. On the right are the columns you have added to your report. Click any field on the left to add it as a column on the right. Drag columns in the right panel to reorder them — the order here is the order in the final output. Some fields are calculated — they do not come directly from the database but are derived. For example, a Jobs source includes Margin Percentage, which is calculated from estimated revenue minus actual cost. Calculated fields are marked with a formula icon. Add only the columns you need — more columns do not make a better report, they make a harder-to-read report.

**Kinesthetic prompt:** Start a new report on the Jobs source. Add five columns: Job Number, Customer, Stage, Assigned To, and Due Date. Reorder them so Due Date is the second column.

---

### Chapter 5 — Applying Filters
**Estimated timestamp:** 280s
**UI Element:** `app-reports`
**Chapter label:** "Filters"

**Narration Script:**
Filters narrow your result set. Switch to the Filters tab in the report builder. For each column you added, you can optionally add a filter. String filters support: Contains, Does Not Contain, Equals, and Is Empty. Number filters support: Greater Than, Less Than, Between, and Equals. Date filters support: Before, After, Between, and presets like Today, This Week, This Month, This Quarter, Last 30 Days, Last 90 Days. Enum filters — fields with a fixed set of values like status or priority — show checkboxes for each possible value. Add multiple filters and they are combined with AND logic — the row must match all filters to appear. Use OR logic by creating filter groups, which is an advanced option in the filter panel.

**Alternative paths:** Filters can reference the current user dynamically — for example, a filter for Assigned To Equals Current User creates a personal version of any report that automatically shows only the viewer's data. This is how the My Open Jobs template works.

**Kinesthetic prompt:** On your test report, add a filter: Stage Does Not Contain Payment. Run the report and verify no payment-stage jobs appear in the results.

---

### Chapter 6 — Grouping and Aggregating
**Estimated timestamp:** 360s
**UI Element:** `app-reports`
**Chapter label:** "Grouping Data"

**Narration Script:**
Grouping transforms a flat list into a summary. Switch to the Grouping tab. Choose a field to group by — for example, group a Time Entries report by Employee to see total hours per person. When you group, the report collapses individual rows into group headers and shows aggregated values. For number columns, you can choose the aggregation type: Sum, Count, Average, Min, or Max. For a time report grouped by employee, set the duration column to Sum to see total hours. Set the count column to Count to see number of entries. Grouped reports are the foundation of dashboards — when you have a question like how many jobs are in each stage, grouping by Stage with a Count aggregation answers it in seconds.

**Kinesthetic prompt:** Create a time entries report grouped by Employee with duration summed. Compare the totals to what you see on the Time Tracking page for one employee.

---

### Chapter 7 — Sorting Results
**Estimated timestamp:** 435s
**UI Element:** `app-reports`
**Chapter label:** "Sorting"

**Narration Script:**
Click any column header in the results table to sort by that column. Click once for ascending, again for descending, a third time to remove the sort. Hold Shift and click a second column header to add a secondary sort. Multi-column sorting is useful for reports like jobs sorted first by priority then by due date — you see all Urgent jobs together, and within Urgent, the ones due soonest appear at the top. You can also configure sorting in the report builder's Sort tab before running the report — this saves the sort as part of the saved report definition so it is always applied when teammates run it. Ad-hoc table sorts are not saved.

**Kinesthetic prompt:** In your test report results, Shift-click two column headers to create a multi-column sort. Notice how the sort indicators show both sort priorities.

---

### Chapter 8 — Chart Visualization
**Estimated timestamp:** 505s
**UI Element:** `app-reports`
**Chapter label:** "Charts"

**Narration Script:**
The report builder includes a chart view alongside the table view. Switch to the Chart tab after running a report. Choose a chart type from the panel: Bar, Line, Pie, Doughnut, and Radar are available. Bar charts work well for categorical comparisons — jobs per stage, expenses per category. Line charts work for trends over time — hours logged per week over the last quarter. Pie and doughnut charts show proportions — what percentage of expenses fall into each category. After selecting a chart type, map your X and Y axes to the columns in your report. For most reports, the X axis is a categorical field like stage or employee, and the Y axis is a numeric field like count or total hours.

**Alternative paths:** Charts update in real time when you change filters or date ranges — the chart and the table always reflect the same underlying data. Charts can be added to the dashboard as widgets by pinning from the report view.

**Kinesthetic prompt:** Create a bar chart from your jobs report with Stage on the X axis and Count on the Y axis. Does the distribution match your mental model of where work is concentrated?

---

### Chapter 9 — Saving a Report
**Estimated timestamp:** 580s
**UI Element:** `app-reports`
**Chapter label:** "Saving Reports"

**Narration Script:**
When you are satisfied with a report, save it so you and your team can run it again with one click. Click the Save Report button. A dialog asks for a name, a category, and an optional description. The name should clearly describe what the report shows — for example, Overdue Jobs by Engineer or Weekly Expenses by Category. The category organizes it in the sidebar — choose from existing categories or type a new one. Once saved, the report appears in the saved reports list immediately and is available to all users with access to the Reports page. Saved reports can be updated — run them, modify the columns or filters, and save again. The original definition updates.

**Alternative paths:** Reports can be set to run on a schedule and email the results to a list of recipients. This is configured from the report settings after saving. For example, you might schedule a weekly Open Jobs summary to email every manager at 7 AM Monday morning.

**Kinesthetic prompt:** Save your test report with a descriptive name. Close the report builder and verify it appears in the sidebar under the category you chose.

---

### Chapter 10 — Exporting Reports
**Estimated timestamp:** 655s
**UI Element:** `app-reports`
**Chapter label:** "Exporting"

**Narration Script:**
Export the current report results using the Export button in the report toolbar. Choose between CSV for spreadsheet analysis and PDF for formatted presentation. The CSV export includes all columns in your report — including calculated fields — with column headers matching the field names you chose. The PDF export renders a formatted report with your company name and logo in the header, the report title, the date and time it was generated, and the full result table paginated across multiple pages if needed. For large result sets, the CSV is usually more practical. For sharing with clients or executives who do not have Forge access, the formatted PDF is the professional choice.

**Alternative paths:** The CSV format uses UTF-8 encoding and standard comma separators — compatible with Excel, Google Sheets, and every major data analysis tool. If your report includes date fields, they export in ISO 8601 format — you may need to reformat them in Excel depending on your regional settings.

**Kinesthetic prompt:** Export your saved report as both CSV and PDF. Open both and compare — note what information is in the PDF header that is not in the CSV.

---

## Full Transcript

The Reports page has two panels: a saved reports sidebar on the left, and the main report area on the right. Click any template in the sidebar and it runs immediately — 27 pre-built templates are included, covering jobs, time, expenses, inventory, finance, and more. Run Open Jobs by Priority and you will see every active job sorted by urgency in seconds.

To build your own report, click New Report. First choose a data source — the entity you want one row per. Jobs, Time Entries, Expenses, Parts, Purchase Orders, Inventory, Shipments, and more. Choose the source carefully; it cannot be changed after you start adding columns.

In the field selector, add the columns you need. Click a field to add it, drag to reorder. Remove what you do not need — fewer columns make better reports.

Add filters to narrow results. Text fields support contains and equals. Number fields support greater than, less than, between. Date fields support presets like this week, this month, last 30 days. Enum fields like status or priority show checkboxes.

Group your results to create summaries. Group time entries by employee with duration summed and you instantly see total hours per person. Group jobs by stage with a count and you see your WIP distribution.

Sort results by clicking column headers. Multi-column sort by holding Shift. Switch to the Chart tab to visualize grouped results as bar, line, or pie charts.

Save your report with a descriptive name and category. It appears in the sidebar immediately, available to all users. Schedule saved reports to email results automatically.

Export results as CSV for spreadsheet analysis or PDF for professional sharing. CSV is UTF-8 comma-separated and works in every major tool.

---

## Playwright Generation Spec

```json
{
  "appRoute": "/reports",
  "embedUrl": "https://www.youtube.com/embed/YE7VzlLtp-4",
  "steps": [
    {
      "element": "app-reports",
      "popover": {
        "title": "Reports Overview",
        "description": "You are on the Reports page. Two panels: the saved reports sidebar on the left lists every named report — click any to run it instantly. The main panel on the right shows results when running or the builder interface when creating. At the top of the sidebar are search and category filters. The New Report button in the upper right opens the builder. This layout lets you switch between saved reports without losing your place in the builder."
      }
    },
    {
      "element": "app-reports",
      "popover": {
        "title": "Running a Template",
        "description": "The fastest way to get value is from the 27 pre-built templates. These were designed around real manufacturing shop questions. Click any template — results appear in seconds. Click Open Jobs by Priority to see every active job sorted by urgency: number, customer, stage, assignee, due date, and priority. This one report replaces a manual daily scan. Templates include date range chips at the top — click to change the range and the report reruns instantly without rebuilding."
      }
    },
    {
      "element": "app-reports .action-btn--primary",
      "popover": {
        "title": "Data Sources",
        "description": "Click New Report. The first step is choosing a data source — the entity your report will be based on. Available: Jobs, Time Entries, Expenses, Parts, Purchase Orders, Sales Orders, Inventory, Shipments, Invoices, Payments, Customers, Vendors, Quotes, Assets, Leads, and more — over 28 sources. The source determines which fields are available as columns and which filters apply. The source cannot be changed after adding columns. Rule: choose the source you want one row per."
      }
    },
    {
      "element": "app-reports",
      "popover": {
        "title": "Selecting Columns",
        "description": "After choosing a source you reach the field selector. Available fields appear on the left. Added columns appear on the right. Click any field to add it. Drag columns in the right panel to reorder — this order is the output order. Calculated fields — like Margin Percentage derived from revenue minus cost — are marked with a formula icon. Add only the columns you need. More columns do not make a better report; they make a harder-to-read report."
      }
    },
    {
      "element": "app-reports",
      "popover": {
        "title": "Filters",
        "description": "Filters narrow your results. In the Filters tab, each column can have an optional filter. String filters: Contains, Does Not Contain, Equals, Is Empty. Number filters: Greater Than, Less Than, Between, Equals. Date filters: Before, After, Between, and presets — Today, This Week, This Month, This Quarter, Last 30 Days. Enum filters — like stage or priority — show checkboxes. Multiple filters combine with AND logic. A filter for Assigned To Equals Current User creates a personal version of any report."
      }
    },
    {
      "element": "app-reports",
      "popover": {
        "title": "Grouping Data",
        "description": "Grouping transforms a flat list into a summary. In the Grouping tab, choose a field to group by — for example, group Time Entries by Employee. The report collapses individual rows into group headers and shows aggregated values. For number columns choose the aggregation: Sum, Count, Average, Min, or Max. Group jobs by Stage with a Count to see your WIP distribution. Group time entries by Employee with duration Summed to see total hours per person. Grouping is the foundation of management dashboards."
      }
    },
    {
      "element": "app-reports",
      "popover": {
        "title": "Sorting",
        "description": "Click any column header in the results table to sort — once for ascending, again for descending, a third time to remove. Hold Shift and click a second header to add a secondary sort. Multi-sort is useful for jobs sorted first by priority, then by due date — all Urgent jobs together, with the soonest due first within each priority tier. Configure sorting in the report builder Sort tab to save it as part of the report definition for teammates."
      }
    },
    {
      "element": "app-reports",
      "popover": {
        "title": "Charts",
        "description": "Switch to the Chart tab after running a report. Choose a chart type: Bar, Line, Pie, Doughnut, or Radar. Map your X and Y axes to columns. Bar charts compare categories — jobs per stage. Line charts show trends — hours per week over a quarter. Pie charts show proportions — expense breakdown by category. Charts update in real time when you change filters. Pin a chart to the dashboard as a widget directly from the report view."
      }
    },
    {
      "element": "app-reports",
      "popover": {
        "title": "Saving Reports",
        "description": "Click Save Report when satisfied. Provide a name, category, and optional description. The name should describe what the report shows — Overdue Jobs by Engineer or Weekly Expenses by Category. Once saved it appears in the sidebar immediately and is available to all users. Update a saved report by modifying it and saving again. Reports can be scheduled to email results automatically — configure from report settings after saving."
      }
    },
    {
      "element": "app-reports",
      "popover": {
        "title": "Exporting",
        "description": "Export current results with the Export button. Choose CSV for spreadsheet analysis or PDF for formatted presentation. CSV includes all columns including calculated fields, UTF-8 encoded, standard comma separators — compatible with Excel, Google Sheets, and every major data tool. PDF renders with your company name and logo in the header, report title, generation timestamp, and the full result table paginated across pages. Use CSV for analysis, PDF for sharing with clients or executives who do not have Forge access."
      }
    }
  ],
  "chaptersJson": [
    { "timeSeconds": 0, "label": "Reports Overview" },
    { "timeSeconds": 55, "label": "Running a Template" },
    { "timeSeconds": 130, "label": "Data Sources" },
    { "timeSeconds": 205, "label": "Selecting Columns" },
    { "timeSeconds": 280, "label": "Filters" },
    { "timeSeconds": 360, "label": "Grouping Data" },
    { "timeSeconds": 435, "label": "Sorting" },
    { "timeSeconds": 505, "label": "Charts" },
    { "timeSeconds": 580, "label": "Saving Reports" },
    { "timeSeconds": 655, "label": "Exporting" }
  ]
}
```
