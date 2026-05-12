# Manuscript: Kanban Board Video Overview

**Module ID:** 19
**Slug:** `video-kanban-board-overview`
**App Route:** `/board`
**Estimated Duration:** 10–12 minutes
**Generation Command:** `POST /api/v1/training/modules/19/generate-video`

---

## Purpose

This video is the primary spatial and conceptual orientation to Forge's kanban board — the central hub where all active work lives. Viewers should finish understanding where things are, how work flows, and why the board is structured the way it is.

### Learning Objectives
- Understand the left-to-right flow of stages from quote to payment
- Read a job card and understand each data element
- Move a job between stages (drag-and-drop and dropdown)
- Recognize irreversible stages and why they exist
- Apply filters to focus the board
- Use swimlane view for workload management
- Use multi-select for bulk operations
- Create a new job

### Audience
Engineers, Production Workers, PMs, Managers. No prior experience required.

### Learning Style Coverage
- **Visual:** Spatial orientation first in every chapter — describe position on screen before behavior
- **Auditory:** Explain the *why* behind each design decision
- **Reading/Writing:** Full transcript provided; each chapter self-contained
- **Kinesthetic:** Each chapter ends with a specific action to try

---

## Chapter Breakdown

Chapters are designed as self-contained clips. Someone searching "how do I move a job" can jump directly to Chapter 5 and have everything they need without watching the rest.

---

### Chapter 1 — Spatial Orientation: The Big Picture
**Estimated timestamp:** 0s
**UI Element:** *(none — page level)*
**Chapter label:** "Board Overview"

**Narration Script:**
Welcome to the Forge kanban board. Before we do anything, let's take ten seconds to orient ourselves spatially. You're looking at a grid of vertical columns. Each column is a production stage. Reading from left to right, these stages trace the life of a job — from the first customer conversation, through fabrication, to the moment payment arrives. This left-to-right flow is intentional. It mirrors how time moves. Jobs are born on the left and mature on the right. Every active job in your shop lives on this board. Nothing falls through the cracks. Try resisting the urge to click anything yet — just take in the layout.

**Alternative paths:** Users may land on a filtered board or a different track type. Mention that the view selector in the top-left controls which track type (Production, R&D, Maintenance, etc.) is displayed.

**Kinesthetic prompt:** Count the number of columns visible on your screen before continuing.

---

### Chapter 2 — Board Structure: Stages and Colors
**Estimated timestamp:** 45s
**UI Element:** `app-board-column:first-child`
**Chapter label:** "Stages and Flow"

**Narration Script:**
Look at the column headers. Each column has a name and a color. The colors serve a purpose: every job card inherits the color of its current stage, so you can glance at the board and immediately see where work is concentrated. The default production track stages, reading left to right, are: Quote Requested, Quoted, Order Confirmed, Materials Ordered, Materials Received, In Production, QC Review, Shipped, Invoiced, and Payment Received. Your shop may have renamed some of these — that's configurable by an admin. What you cannot change is the direction: work always flows left to right. If you need to move a job backward, that's almost always a sign something went wrong and needs a conversation.

**Alternative paths:** Custom track types (R&D/Tooling, Maintenance) have different stage names. The stage colors are admin-configured. WIP limits — a maximum number of cards per column — are optional and shown in the column header count badge.

**Kinesthetic prompt:** Hover over any column header to see the stage name tooltip.

---

### Chapter 3 — Reading a Job Card
**Estimated timestamp:** 105s
**UI Element:** `app-job-card`
**Chapter label:** "Reading Job Cards"

**Narration Script:**
Each rectangle on the board is a job card. Let's read one. The header stripe at the top matches the column color — this is the stage color. Inside the card you'll see the job number in the top left: a unique identifier your shop assigned or that Forge auto-generated. Below that is the customer name. On the right edge is the priority indicator — a colored band or label: Urgent in red, High in orange, Normal in blue, Low in grey. Near the bottom is the due date. If the date has passed, it turns red to warn you. A pulsing timer icon means someone currently has a timer running against this job. A paperclip icon means files are attached.

**Alternative paths:** Cards may show a custom badge if a QC inspection is pending or if the job is on hold (a pause indicator appears). If swimlane mode is active, cards are grouped by row rather than appearing freely in columns.

**Kinesthetic prompt:** Find a card with a red due date and one with a paperclip. Notice how your eye finds them quickly because of the visual cues.

---

### Chapter 4 — Opening the Job Detail Panel
**Estimated timestamp:** 180s
**UI Element:** `app-job-card`
**Chapter label:** "Job Detail Panel"

**Narration Script:**
Click any job card to open its detail panel. The panel slides in from the right side of the screen — notice that the board stays visible behind it. You haven't navigated away. This is by design: you can keep your place on the board while reviewing job details. Inside the panel you'll find: the customer contact with a link to their full profile, the linked part number or product description, associated documents like quotes or sales orders, a subtask checklist you can check off one by one, an attachments section for photos and files, and a complete activity log at the bottom showing every change ever made — who moved it, who changed the priority, who added a note and when. Close the panel with the X in the upper right or press Escape.

**Alternative paths:** Managers see additional fields: estimated vs. actual hours, cost-to-date, and margin. Engineers see only the fields relevant to doing the work. Admin-configurable custom fields may appear as extra rows.

**Kinesthetic prompt:** Open a job card, scroll to the bottom of the detail panel, and read the activity log. Notice the timestamp and initials on each entry.

---

### Chapter 5 — Moving a Job Between Stages
**Estimated timestamp:** 270s
**UI Element:** `app-board-column:nth-child(3)`
**Chapter label:** "Moving Jobs"

**Narration Script:**
There are two ways to move a job. Method one: drag and drop. Click and hold a card, drag it horizontally to the target column, and release. The card slots into the new column and the stage color updates instantly. Everyone viewing the board sees the move happen in real time — no refresh needed. Method two: use the status dropdown in the detail panel. Open the card, click the stage name near the top of the panel, and select a new stage from the dropdown list. This is useful when the target column is off-screen to the right, or when you're in swimlane mode where dragging is less precise. Both methods do the same thing. Both trigger real-time sync for everyone on your team.

**Alternative paths:** If WIP limits are configured, moving a card into a full column will show a warning — the column header turns red and you'll see a count badge exceeding the limit. You can still complete the move, but it flags the overload. If moving to an irreversible stage, a confirmation dialog appears warning that the move cannot be undone.

**Kinesthetic prompt:** Try moving a job one stage to the right using drag and drop. Then move it back using the status dropdown in the detail panel.

---

### Chapter 6 — Irreversible Stages and Lock Indicators
**Estimated timestamp:** 360s
**UI Element:** `app-board-column:last-child app-kanban-column-header`
**Chapter label:** "Lock Indicators"

**Narration Script:**
Look at the final two columns: Invoiced and Payment Received. You'll notice a small lock icon on those column headers. These are irreversible stages. Once a job enters an irreversible stage, it cannot be dragged backward to an earlier column. Why? Because these stages correspond to financial documents that already exist in your accounting system — an invoice has been sent to the customer, or a payment has been recorded. Moving the job backward would create a mismatch between your board and your financial records. If you need to cancel or correct something at this stage, the right path is to archive the job, handle the financial correction in QuickBooks, and create a replacement job if work needs to continue.

**Alternative paths:** If QuickBooks is not connected (standalone mode), irreversible stages are still enforced but the underlying documents are local invoices and payments, not QB documents. The lock behavior is identical.

**Kinesthetic prompt:** Try dragging a job from an irreversible stage to an earlier column and observe what happens.

---

### Chapter 7 — Filtering the Board
**Estimated timestamp:** 440s
**UI Element:** `app-kanban app-toolbar`
**Chapter label:** "Filters"

**Narration Script:**
The filter toolbar runs across the top of the board. Use it when the board is full and you need to focus. You can filter by assignee — showing only jobs assigned to you or a specific person. Filter by priority to surface all Urgent and High jobs. Filter by customer to see every open job for a given account. Filter by date range to see what's due this week. All filters are additive. Combining assignee plus priority shows only that person's high-priority jobs. When filters are active, a badge appears in the toolbar showing how many are applied. Remove individual filters by clicking the X on their chip, or click Reset All to clear everything and see the full board again.

**Alternative paths:** Track type selection (in the top-left view selector) is not a filter — it switches the entire board view. Filters work within the currently selected track type. If you switch track types, filters reset.

**Kinesthetic prompt:** Apply an assignee filter for yourself. Notice how many cards remain. Then add a priority filter and see the list narrow further.

---

### Chapter 8 — Swimlane View
**Estimated timestamp:** 510s
**UI Element:** `app-kanban app-toolbar`
**Chapter label:** "Swimlane View"

**Narration Script:**
The board has two layout modes: card mode, which is the default, and swimlane mode. Switch using the view toggle in the toolbar — look for the grid icon. In swimlane mode, the board gains horizontal rows. You can group rows by team or by individual assignee. Each row shows one person's or team's cards across all stages. This is the manager view. If one engineer's row is packed while another's is sparse, you can see the imbalance immediately and reassign work. Swimlane rows collapse individually — click the row header to hide that person's cards when you want to focus on a subset. The same filters from the previous chapter work in swimlane mode too.

**Alternative paths:** Swimlane grouping options depend on your track type. Production tracks support both team and assignee swimlanes. Custom track types may only support one grouping option. If nobody is assigned to a job, those cards appear in an Unassigned row at the bottom.

**Kinesthetic prompt:** Switch to swimlane view grouped by assignee. Find the engineer with the most cards in the In Production column.

---

### Chapter 9 — Multi-Select and Bulk Actions
**Estimated timestamp:** 580s
**UI Element:** `app-job-card`
**Chapter label:** "Bulk Actions"

**Narration Script:**
When you need to take the same action on many jobs at once, use multi-select. Hold Ctrl on Windows or Command on Mac, then click each card you want. Selected cards show a checkmark in their corner and a highlighted border. As you select cards, a bulk action bar appears at the top of the board showing a count. From this bar you can: move all selected cards to a new stage at once, reassign them all to a different engineer, change their priority level, or archive the entire group. Multi-select works across columns — you can select cards from different stages in the same action. To deselect everything, click any empty space on the board or press Escape.

**Alternative paths:** Bulk move to an irreversible stage still shows the lock warning and requires a confirmation. Bulk archive shows a single confirmation dialog covering all selected cards. Bulk reassign only changes the assigned engineer, not any subtask assignments.

**Kinesthetic prompt:** Select three jobs in different columns. Use the bulk action bar to change their priority all at once.

---

### Chapter 10 — Creating a New Job
**Estimated timestamp:** 650s
**UI Element:** `app-kanban .action-btn--primary`
**Chapter label:** "Creating a Job"

**Narration Script:**
To create a new job, click the New Job button in the upper right corner of the toolbar. A dialog opens. Required fields are: customer name and a job title or description. Optional but recommended: assign a part number, assign an engineer, set a due date, and choose a priority. You can also set the initial stage — most shops start at Quote Requested, but you can start anywhere. When you click Save, the card appears immediately on the board. If you're in a hurry, fill in just the required fields and add detail later. Many shops create placeholder jobs the moment a customer calls and fill in part numbers and details as the conversation matures. The job is never lost — it lives on the board from the moment you create it.

**Alternative paths:** Jobs can also be created from the Backlog page, from a Sales Order (which auto-creates a linked job), or from the Planning Cycles page. In all cases the job appears on the kanban board immediately. If you create a job from a quote, it pre-populates the customer, part number, and estimated hours.

**Kinesthetic prompt:** Create a test job for any customer, set a due date, and verify it appears on the board at the stage you selected.

---

## Full Transcript

Welcome to the Forge kanban board. Take a moment to orient yourself spatially — you're looking at a grid of vertical columns stretching from left to right. Each column is a production stage, and every active job in your shop lives here, moving from left to right as work progresses.

Reading the column headers from left to right, you'll see the full lifecycle of a job: Quote Requested, Quoted, Order Confirmed, Materials Ordered, Materials Received, In Production, QC Review, Shipped, Invoiced, and Payment Received. The colors aren't decorative — each job card inherits the color of its current stage, making it easy to spot where work is concentrated at a glance.

Each card shows the job number, customer name, priority indicator, and due date. Overdue dates turn red. A pulsing timer means someone is actively clocking time. A paperclip means files are attached. Click any card to open its detail panel — the panel slides in from the right without leaving the board.

Inside the detail panel you'll find the customer contact, linked part, associated documents, a subtask checklist, file attachments, and a complete activity log. Nothing is hidden. Every change anyone makes is recorded with a timestamp and initials.

Moving jobs is simple: drag a card to a new column, or use the status dropdown in the detail panel. Both methods update everyone's board in real time through SignalR. Watch out for lock indicators on the final columns — Invoiced and Payment Received can't be reversed because financial documents already exist.

The filter toolbar narrows the board when it gets crowded. Filter by assignee, priority, customer, or date range. Combine filters to focus precisely. Switch to swimlane mode to see workload grouped by team or individual — essential for managers spotting imbalance.

Multi-select lets you Ctrl-click multiple cards and apply one action to all of them at once — great for end-of-sprint bulk moves or reassigning work when someone is out.

Finally, creating a job takes seconds: click New Job, fill in customer and title, and the card appears immediately. Start minimal, add detail as the job evolves. The board is your single source of truth for all active work.

---

## Playwright Generation Spec

```json
{
  "appRoute": "/board",
  "embedUrl": "https://www.youtube.com/embed/YE7VzlLtp-4",
  "steps": [
    {
      "popover": {
        "title": "Board Overview",
        "description": "Welcome to the Forge kanban board. Before clicking anything, take a moment to orient yourself spatially. You are looking at a grid of vertical columns. Each column is a production stage. Reading from left to right, these stages trace the life of a job — from the first customer conversation, through fabrication, all the way to the moment payment arrives. Work flows left to right. Every active job in your shop lives on this board."
      }
    },
    {
      "element": "app-board-column:first-child",
      "popover": {
        "title": "Stages and Flow",
        "description": "Look at the column headers. Each has a name and a color. Colors serve a purpose — every job card inherits the color of its current stage, so you can spot where work is concentrated at a glance. The default stages, left to right, are: Quote Requested, Quoted, Order Confirmed, Materials Ordered, Materials Received, In Production, QC Review, Shipped, Invoiced, and Payment Received. Your shop may have renamed some of these — that is configurable. What you cannot change is the direction: work always flows left to right."
      }
    },
    {
      "element": "app-job-card",
      "popover": {
        "title": "Reading Job Cards",
        "description": "Each rectangle is a job card. At the top is the job number — your unique identifier. Below that is the customer name. On the right edge is the priority indicator: Urgent in red, High in orange, Normal in blue, Low in grey. Near the bottom is the due date — red if overdue. A pulsing timer icon means someone has a timer running on this job right now. A paperclip means files are attached. These visual cues let you read the board's status in seconds without opening a single card."
      }
    },
    {
      "element": "app-job-card",
      "popover": {
        "title": "Job Detail Panel",
        "description": "Click any card to open its detail panel. Notice it slides in from the right — you have not navigated away. The board stays visible behind it. Inside the panel you will find: the full customer contact, the linked part number, associated documents like quotes and sales orders, a subtask checklist, a file attachments section, and a complete activity log at the bottom showing every change ever made — who moved it, who changed priority, who added a note and exactly when. Close it with the X button or press Escape."
      }
    },
    {
      "element": "app-board-column:nth-child(3)",
      "popover": {
        "title": "Moving Jobs",
        "description": "Two ways to move a job. Method one: drag and drop — click, hold, drag horizontally to the target column, release. The card snaps into place. Method two: open the detail panel and use the stage dropdown near the top — select a new stage and the job moves instantly. Both methods update everyone's board in real time. If WIP limits are configured on a column, exceeding the limit turns the column header red as a warning. You can still complete the move."
      }
    },
    {
      "element": "app-board-column:last-child app-kanban-column-header",
      "popover": {
        "title": "Lock Indicators",
        "description": "Look at the final columns — Invoiced and Payment Received. Notice the small lock icon on their headers. These are irreversible stages. Once a job enters an irreversible stage it cannot be dragged backward. Why? Because financial documents already exist — an invoice was sent, or a payment was recorded. Moving backward would create a mismatch between your board and your accounting records. If a correction is needed, archive the job, handle the correction in QuickBooks, and create a replacement job if work must continue."
      }
    },
    {
      "element": "app-kanban app-toolbar",
      "popover": {
        "title": "Filters",
        "description": "The filter toolbar across the top of the board focuses the view when it gets crowded. Filter by assignee to see only jobs assigned to a specific person. Filter by priority to surface urgent items. Filter by customer to see all open work for a given account. Filter by date range to focus on what is due this week. All filters are additive — combine assignee plus priority to see that person's urgent jobs only. A badge shows how many filters are active. Click Reset All to clear everything."
      }
    },
    {
      "element": "app-kanban app-toolbar",
      "popover": {
        "title": "Swimlane View",
        "description": "Switch between card mode and swimlane mode using the view toggle in the toolbar. In swimlane mode the board adds horizontal rows — one per team or one per assignee. Each row shows that person's cards across all stages. This is the manager view for spotting workload imbalance. If one engineer's row is packed while another is sparse, you can see it immediately and reassign. Swimlane rows collapse individually. All filters work the same way in swimlane mode."
      }
    },
    {
      "element": "app-job-card",
      "popover": {
        "title": "Bulk Actions",
        "description": "To act on many jobs at once, hold Ctrl on Windows or Command on Mac and click each card you want. Selected cards show a checkmark. A bulk action bar appears at the top showing a count of selected cards. From there you can: move all selected to a new stage, reassign them all to a different engineer, change their priority level, or archive the entire group. Multi-select works across columns. Deselect by clicking empty board space or pressing Escape."
      }
    },
    {
      "element": "app-kanban .action-btn--primary",
      "popover": {
        "title": "Creating a Job",
        "description": "Click the New Job button in the upper right of the toolbar. A dialog opens. Required fields are customer and job title. Optional but recommended: part number, assigned engineer, due date, priority, and initial stage. Most shops start at Quote Requested. When you click Save the card appears immediately on the board. Start minimal and add detail as the job evolves. Many shops create a job the moment a customer calls and fill in the part number as the conversation matures."
      }
    }
  ],
  "chaptersJson": [
    { "timeSeconds": 0, "label": "Board Overview" },
    { "timeSeconds": 45, "label": "Stages and Flow" },
    { "timeSeconds": 110, "label": "Reading Job Cards" },
    { "timeSeconds": 175, "label": "Job Detail Panel" },
    { "timeSeconds": 255, "label": "Moving Jobs" },
    { "timeSeconds": 340, "label": "Lock Indicators" },
    { "timeSeconds": 415, "label": "Filters" },
    { "timeSeconds": 490, "label": "Swimlane View" },
    { "timeSeconds": 560, "label": "Bulk Actions" },
    { "timeSeconds": 635, "label": "Creating a Job" }
  ]
}
```
