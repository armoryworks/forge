# Admin Panel

**Route:** `/admin/*`
**Access Roles:** Admin only
**Page Title:** Admin

## Purpose

The admin panel provides system configuration, user management, and compliance
template management. It is the control center for the entire Forge instance.

## Admin Tabs

| Tab | Route | Description |
|:----|:------|:------------|
| Users | `/admin/users` | User accounts, roles, invite/setup |
| Track Types | `/admin/track-types` | Kanban track types + stage configuration |
| Reference Data | `/admin/reference-data` | Lookup values, categories, dropdown options |
| Compliance | `/admin/compliance` | Compliance form templates (W-4, I-9, state forms) |
| Integrations | `/admin/integrations` | QB Online, USPS, MinIO, Ollama, DocuSeal status |
| Settings | `/admin/settings` | Company profile, locations, terminology |
| AI Assistants | `/admin/ai-assistants` | Configurable domain AI chatbots |
| Teams | `/admin/teams` | Team/group definitions for reporting |

## Users Tab

### Table Columns
| admin.colName | admin.colEmail | admin.colRole filter_list | admin.colLocation filter_list | admin.colCompliance | admin.colStatus | admin.colActions | downloadsettings |
|:-------|:-------|:-------|:-------|:-------|:-------|:-------|:-------|


### Toolbar Actions
- help_outline


**User Management Flow:**
1. Admin clicks "Invite User" → enters email + roles
2. System sends email with setup link (or admin copies setup token)
3. Employee clicks link → sets own password/PIN → account active
4. Admin never sets employee passwords (security design)

## Track Types Tab

Manages Kanban board configurations:
- **Track Types:** Production, R&D/Tooling, Maintenance, Custom
- **Stages:** Per track type — name, color, WIP limit, irreversibility flag, QB document type

- help_outline


## Compliance Tab

### Table Columns
| complianceTemplates.colName | complianceTemplates.colType filter_list | complianceTemplates.colAutoSync | complianceTemplates.colLastSynced | complianceTemplates.colActive | downloadsettings |
|:-------|:-------|:-------|:-------|:-------|:-------|


### Create Template Dialog Fields
| Field | Type | Required |
|:------|:-----|:---------|
| Form Name | Text | — |
| Form Type (Federal/State/Custom) | Text | — |
| State (if state form) | Text | — |
| Required toggle | Text | — |
| Upload PDF (for PDF extraction) | Text | — |
| Electronic Form toggle | Text | — |


## Integrations Tab

Shows connection status for all external services:
- help_outline


## Settings Tab

### Company Profile
- Company Name, Phone, Email, EIN, Website

### Company Locations
- Location Name, Address, State, Is Default, Is Active
- Per-employee work location assignment (for state withholding)

### Terminology
- Admin-configurable labels ("Job" → "Work Order", "Part" → "Item")
- Applied site-wide via TerminologyPipe

## Finding Controls

Use these landmarks when you need help locating a specific control.
Positions are described relative to a standard 1920×1080 desktop layout.

### 🔵 Top Header Bar (always visible, 44px strip at very top)

- **Open Chat** — look for the `chat_bubble_outline` icon (right side of toolbar)
- **Ai Assistant (smart_toy)** — look for the `smart_toy` icon (right side of toolbar)
- **Notifications bell** — look for the `notifications_none` icon (top-right corner)
- **Toggle dark/light theme** — look for the `dark_mode` icon (top-right corner)
- **User, Admin** — look for the `menu` icon (top-right corner)

### 🟦 Page Toolbar (below header — search, filters, action buttons)

- **Dismiss onboarding banner** — look for the `close` icon (top-right corner)
- **Expand sidebar** — look for the `chevron_right` icon (left sidebar)
- **Start Help Tour (help_outline)** — look for the `help_outline` icon (left side of toolbar)

### 📋 Top of Content Area (first rows, column headers)

- **admin.tabs.users** — look for the `people` icon (left side of toolbar)
- **admin.tabs.trackTypes** — look for the `route` icon (left side of toolbar)
- **admin.tabs.referenceData** — look for the `dataset` icon (center)
- **admin.tabs.terminology** — look for the `translate` icon (center)
- **admin.tabs.settings** — look for the `settings` icon (center)
- **admin.tabs.integrations** — look for the `hub` icon (center)
- **admin.tabs.training** — look for the `school` icon (center)
- **admin.tabs.aiAssistants** — look for the `smart_toy` icon (right side of toolbar)
- **admin.tabs.teams** — look for the `groups` icon (right side of toolbar)
- **admin.tabs.salesTax** — look for the `percent` icon (top-right corner)
- **admin.tabs.compliance** — look for the `fact_check` icon (top-right corner)
- **Add User** — look for the `add` icon (top-right corner)
- **Filter Column (filter_list)** — look for the `filter_list` icon (center)
- **Export Csv (download)** — look for the `download` icon (top-right corner)
- **Manage Columns (settings)** — look for the `settings` icon (top-right corner)

### 📄 Middle of Page (main content)

- **Edit** — look for the `edit` icon (top-right corner)
- **person_off** — look for the `person_off` icon (top-right corner)

<!-- /finding-controls -->

## UX Analysis

### Flow Quality: ★★★★☆

The admin panel is comprehensive and well-organized. Track type configuration
is particularly strong — stage colors and WIP limits are visible immediately.

### Usability Observations

- Setup token flow is elegant — admin doesn't handle passwords
- Reference data single table manages all lookups centrally (no scattered config tables)
- Integration status page gives a clear health dashboard for connected services

### Functional Gaps / Missing Features

- No bulk user import (CSV)
- No role-based permission matrix editor (roles are fixed, not configurable)
- No audit log viewer in admin panel (AuditLogEntry entity exists but no UI)
- No system health dashboard (disk space, DB size, memory usage)
- No backup configuration UI (backup runs but no admin visibility)
- Terminology changes require page refresh to apply globally
- No two-factor authentication (2FA) configuration
