# Forge — App Shell & Navigation

**Generated:** 2026-03-22

## Purpose

The application shell provides the persistent chrome (header + sidebar) that wraps
every feature. Understanding the navigation structure is essential for knowing which
features are accessible and how the user moves between modules.

## Layout

| Zone | Description |
|:-----|:------------|
| Header (44px) | Logo, global search, notifications bell, user avatar, theme toggle |
| Sidebar (52px collapsed / 200px expanded) | Primary navigation — icon + label links to all features |
| Content area | Feature content — scrollable, full remaining height |

## Sidebar Navigation Items

- Dashboard
- dashboard
- view_kanban
- inbox
- event_note
- calendar_month
- people
- people_outline
- request_quote
- shopping_cart
- outbox
- receipt
- payments
- assignment_return
- precision_manufacturing
- inventory_2
- batch_prediction
- local_shipping
- description
- build
- schedule
- receipt_long
- bar_chart
- smart_toy
- storefront
- settings


## Header Actions

- chat_bubble_outline
- smart_toy
- notifications_none
- dark_mode
- User, Adminmenu


## Finding Controls

## Finding Controls — Universal Layout

Every page in Forge follows the same spatial layout. Use this guide first
before looking at page-specific landmarks below.

```
┌────────────────────────────────────────────────────────────┐
│  HEADER  (44px)  Logo | Search | Notifications | User      │  ← Top of screen
├──────────────────────────────────────────────────────────  │
│ ◀ │  TOOLBAR  (filters left, action buttons RIGHT)         │  ← Below header
│   ├──────────────────────────────────────────────────────  │
│ S │  CONTENT AREA  (scrollable)                            │  ← Main area
│ I │  • Tables, Kanban board, Forms                         │
│ D │  • Tab bar (if present) just below toolbar             │
│ E │                                                        │
│ B │                                                        │
│ A ├──────────────────────────────────────────────────────  │
│ R │  ACTION BAR  (Save / Cancel — bottom-right)            │  ← Bottom of screen
└───┴────────────────────────────────────────────────────────┘
```

### Key Patterns (true everywhere)

| What you want | Where to look |
|:--------------|:--------------|
| Create something new ("New Job", "New Part", etc.) | **Top-right corner** of the page toolbar — blue primary button with a `add` plus icon |
| Search / filter the list | **Top-left of toolbar** — the search box or filter dropdowns |
| Change which columns are visible | **Gear icon** (`settings`) at the far right of the table header row |
| Sort a column | **Click the column header** — arrow appears; Shift+click to multi-sort |
| Filter a specific column | **Right-click the column header** → Filter, or click the funnel icon in the column header |
| Open a record's details | **Click anywhere on the row** — slides open a detail panel on the right |
| Navigate to a different feature | **Left sidebar** — hover to expand labels; click the icon or label |
| Go back to dashboard | **"QB" logo** in the top-left of the header, or click Dashboard in the sidebar |
| Open notifications | **Bell icon** (`notifications`) in the top-right header — badge shows unread count |
| Switch theme (light/dark) | **Moon/sun icon** in the top-right header area |
| Access your profile/account | **Your avatar** (initials circle) in the top-right header |
| Close a dialog | **X button** in the top-right corner of the dialog, or press **Escape** |
| Save a form | **Primary (blue) button** in the **bottom-right** of the dialog |
| Cancel without saving | **"Cancel" button** to the left of the Save button (bottom-right area) |
| Column header sort menu | **Right-click** on any column header for sort, filter, hide, reset options |


<!-- /finding-controls -->

## UX Analysis

### Flow Quality: ★★★★☆

The sidebar navigation is well-organized with icons for quick recognition.
The collapsed state (52px) maximizes content area while still showing icons.

### Usability Observations

- Sidebar collapses to icon-only mode — good for wide content like Kanban
- Active route is highlighted — clear visual location indicator
- Header height (44px) is compact — minimal chrome overhead
- Keyboard shortcut support via KeyboardShortcutsService

### Functional Gaps / Missing Features

- No breadcrumb trail visible in most pages — deep navigation loses context
- No recently visited items or quick-jump history
- Mobile sidebar uses overlay — no permanent mini mode for tablets
- No customizable sidebar ordering (pinned vs. unpinned items)

### Navigation Notes

- Every significant UI state (tabs, selected entity, filters) is reflected in the URL
- Browser back/forward works correctly across all features
- Direct-linking and bookmark sharing supported
