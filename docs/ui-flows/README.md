# Forge — UI Flow Documentation

**Generated:** 2026-05-17
**Purpose:** Training documentation for the AI help system and human onboarding.
Each file describes a feature's complete UI structure, user flows, and UX analysis.

## Files

| # | File | Feature |
|:--|:-----|:--------|
| 00 | [00-app-shell.md](00-app-shell.md) | App Shell & Navigation |
| 01 | [01-dashboard.md](01-dashboard.md) | Dashboard |
| 02 | [02-kanban.md](02-kanban.md) | Kanban Board |
| 03 | [03-backlog.md](03-backlog.md) | Backlog |
| 04 | [04-planning.md](04-planning.md) | Planning Cycles |
| 05 | [05-parts.md](05-parts.md) | Parts Catalog |
| 06 | [06-inventory.md](06-inventory.md) | Inventory |
| 07 | [07-assets.md](07-assets.md) | Assets |
| 08 | [08-quality.md](08-quality.md) | Quality Control |
| 09 | [09-leads.md](09-leads.md) | Leads (CRM Pipeline) |
| 10 | [10-customers.md](10-customers.md) | Customers |
| 11 | [11-quotes.md](11-quotes.md) | Quotes |
| 12 | [12-sales-orders.md](12-sales-orders.md) | Sales Orders |
| 13 | [13-purchase-orders.md](13-purchase-orders.md) | Purchase Orders |
| 14 | [14-shipments.md](14-shipments.md) | Shipments |
| 15 | [15-invoices.md](15-invoices.md) | Invoices |
| 16 | [16-payments.md](16-payments.md) | Payments |
| 17 | [17-expenses.md](17-expenses.md) | Expenses |
| 18 | [18-time-tracking.md](18-time-tracking.md) | Time Tracking |
| 19 | [19-vendors.md](19-vendors.md) | Vendors |
| 20 | [20-reports.md](20-reports.md) | Reports (Dynamic Builder) |
| 21 | [21-calendar.md](21-calendar.md) | Calendar |
| 22 | [22-chat.md](22-chat.md) | Chat |
| 23 | [23-ai-assistant.md](23-ai-assistant.md) | AI Assistant |
| 24 | [24-shop-floor.md](24-shop-floor.md) | Shop Floor / Worker View |
| 25 | [25-admin.md](25-admin.md) | Admin Panel |
| 26 | [26-account-employee.md](26-account-employee.md) | Account & Employee Self-Service |
| 27 | [27-notifications.md](27-notifications.md) | Notifications |
| 28 | [28-authentication.md](28-authentication.md) | Authentication Flows |

## Common Functional Gaps (Cross-Cutting)

These gaps appear across multiple features and represent architectural-level
missing capabilities:

### Critical Missing Features

1. **No customer-facing portal** — Customers can't log in to view orders, invoices, or approve quotes
2. **No PDF/export from all list views** — Only some modules support CSV; no XLSX, no list-to-PDF
3. **No bulk import (CSV)** — Parts, customers, inventory, vendors all require manual entry or QB sync
4. **No audit log viewer** — AuditLogEntry entity exists but no admin UI to query it
5. **No advanced search** — Global search is header-level; no cross-module advanced query builder
6. **No scheduled report delivery** — No email digest or scheduled export
7. **No mobile app** — PWA exists but is not optimized for mobile-first workflows
8. **No dark mode in kiosk** — Shop floor display is always in light mode

### UX Patterns That Work Well

1. **Hover validation popovers** — Far cleaner than inline mat-error messages
2. **Shared DataTable** — Consistent sort/filter/column management across all list views
3. **URL as source of truth** — All state (tabs, filters, selected entity) reflected in URL
4. **DetailSidePanel** — Slide-out panels avoid full navigation for detail views
5. **Loading overlay system** — Two-tier loading (global vs. component-level) handles all scenarios
6. **SignalR real-time** — Board sync, timer sync, notifications all work without polling

### Accessibility Status

All components built to WCAG 2.2 AA:
- aria-labels on all icon-only buttons
- Keyboard navigation throughout
- Focus management in dialogs
- Color + icon (never color alone) for status indicators
- Touch targets ≥ 44px (88px on shop floor kiosk)
