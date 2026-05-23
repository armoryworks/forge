# Admin & Account Region — Component Inventory

_Phase 05 · Sole writer: source-cataloger · 2026-05-22_
_Scope: admin (settings, users, reference-data, terminology, capabilities, discovery, presets, EDI, MFA, AI-assistants, events, time-corrections + all other admin tabs), setup-integrations, employees, payroll (pay-stubs, tax-documents), compliance forms (W-4/I-9/state, dynamic forms), training/LMS, account (security, customization)_

---

## Cross-links

- **Shared components (22)** — already located in `platform.md` (SH-01 … SH-22); admin reuses `app-page-header` (SH-04), `app-data-table` (SH-05), `app-select` (SH-06), `app-input` (SH-07), `app-empty-state` (SH-09), `app-dialog` (SH-10), `app-datepicker` (SH-13), `app-validation-button` (SH-16), `app-avatar` (SH-17), `app-toolbar` (SH-08), `app-textarea` (SH-11). Cross-linked, not re-catalogued.
- **Events (admin side)** — `features/events/` is service+model only (no UI). The admin events _management_ tab (`/admin/events`) is catalogued here as ADM-EVT-01; the `/events` platform page (no UI components) is noted in platform.md.
- **AI-assistant chat surface** — the runtime AI help panel (`app-ai-help-panel`, SH-19) lives in platform.md. The admin config surface for AI assistants (`/admin/ai-assistants`) is catalogued here as ADM-AI-01/02; same `CAP-EXT-AI-ASSISTANT` gate per platform.md D3 terminal closure note.

---

## Source Map

### Feature directories in scope

| Area | Features path | Routes file | Route(s) | Role guard (source) |
|------|--------------|-------------|----------|---------------------|
| Admin | `features/admin/` | `admin.routes.ts` | `/admin/:tab` + named sub-routes | `roleGuard('Admin','Manager','OfficeManager')` (`app.routes.ts:276`) |
| Account | `features/account/` | `account.routes.ts` | `/account/*` (profile,contact,emergency,tax-forms,documents,pay-stubs,tax-documents,security,customization,integrations,communications) | `authGuard` shell only — all authenticated users (`app.routes.ts:232`) |
| Employees | `features/employees/` | `employees.routes.ts` | `/employees`, `/employees/:id/:tab` | `roleGuard('Admin','Manager')` (`app.routes.ts:133`) |
| Training (LMS) | `features/training/` | `training.routes.ts` | `/training/:tab`, `/training/module/:id`, `/training/path/:id` | `authGuard` shell only — all authenticated users (`app.routes.ts:242`) |
| Setup Integrations | `features/setup-integrations/` | _(none)_ | `/setup/integrations` | `authGuard` only (`app.routes.ts:36`); admin-only enforced in component |

### Admin tab access (source: `admin.component.ts:97-99`)

| Tab slug | Access | Redirect target for unauthorized |
|----------|--------|----------------------------------|
| users, track-types, reference-data, terminology, settings, integrations, ai-assistants, teams, role-templates, sales-tax, audit-log, edi, mfa, automations, auto-po, integration-outbox, expenses, bi-api-keys | Admin only | `compliance` |
| training, time-corrections, events, announcements | Admin + Manager | `compliance` |
| compliance | Admin + Manager + OfficeManager | — |

---

## Denominator

| Area | Feature component files | Source paths |
|------|------------------------|-------------|
| Admin | 55 | `features/admin/**/*.component.ts` |
| Account | 22 | `features/account/**/*.component.ts` |
| Employees | 12 | `features/employees/**/*.component.ts` |
| Training | 4 | `features/training/**/*.component.ts` |
| Setup Integrations | 1 | `features/setup-integrations/*.component.ts` |
| **TOTAL** | **94** | |

Shared components (SH-01–SH-22) from `platform.md` are excluded from this denominator per D2.

---

## Reconciliation Checklist

_Every in-scope route and feature-tree node must be ticked or queued before phase closes._

### Tree 1 — Routes (15 distinct routes/route-groups)
- [ ] `/admin/users` (tab)
- [ ] `/admin/track-types` (tab)
- [ ] `/admin/reference-data` (tab)
- [ ] `/admin/terminology` (tab)
- [ ] `/admin/settings` (tab)
- [ ] `/admin/integrations` (tab)
- [ ] `/admin/training` (tab)
- [ ] `/admin/ai-assistants` (tab)
- [ ] `/admin/teams` (tab)
- [ ] `/admin/role-templates` (tab)
- [ ] `/admin/compliance` (tab)
- [ ] `/admin/sales-tax` (tab)
- [ ] `/admin/audit-log` (tab)
- [ ] `/admin/time-corrections` (tab)
- [ ] `/admin/events` (tab)
- [ ] `/admin/announcements` (tab)
- [ ] `/admin/edi` (tab)
- [ ] `/admin/mfa` (tab)
- [ ] `/admin/automations` (tab)
- [ ] `/admin/auto-po` (tab)
- [ ] `/admin/integration-outbox` (tab)
- [ ] `/admin/expenses` (tab)
- [ ] `/admin/bi-api-keys` (tab)
- [ ] `/admin/capabilities`
- [ ] `/admin/capabilities/:id`
- [ ] `/admin/capabilities-debug`
- [ ] `/admin/discovery`
- [ ] `/admin/presets`
- [ ] `/admin/presets/compare`
- [ ] `/admin/presets/custom`
- [ ] `/admin/presets/:id`
- [ ] `/admin/entity-completeness`
- [ ] `/admin/working-calendars`
- [ ] `/admin/tariffs`
- [ ] `/admin/lead-sources`
- [ ] `/admin/icp-rubrics`
- [ ] `/admin/assignment-rules`
- [ ] `/admin/currencies`
- [ ] `/account/profile`
- [ ] `/account/contact`
- [ ] `/account/emergency`
- [ ] `/account/tax-forms`
- [ ] `/account/tax-forms/:formType`
- [ ] `/account/documents`
- [ ] `/account/pay-stubs`
- [ ] `/account/tax-documents`
- [ ] `/account/security`
- [ ] `/account/customization`
- [ ] `/account/integrations`
- [ ] `/account/communications`
- [ ] `/account/communications/oauth-callback`
- [ ] `/employees`
- [ ] `/employees/:id/overview`
- [ ] `/employees/:id/activity`
- [ ] `/employees/:id/compliance`
- [ ] `/employees/:id/documents`
- [ ] `/employees/:id/events`
- [ ] `/employees/:id/expenses`
- [ ] `/employees/:id/jobs`
- [ ] `/employees/:id/pay`
- [ ] `/employees/:id/time`
- [ ] `/employees/:id/training`
- [ ] `/training/:tab` (my-learning / all-modules / paths / teams)
- [ ] `/training/module/:id`
- [ ] `/training/path/:id`
- [ ] `/setup/integrations`

### Tree 2 — Feature component files (94 total)
_(See component table below — all 94 need live confirmation of states)_

### Tree 3 — Shared component usages in admin templates
_(All admin-region templates that consume SH-01..SH-22 — cross-link entries filled in component table)_

---

## Component Table

_Abbreviations: A=Admin, M=Manager, OM=OfficeManager, E=Engineer, PM=PM; all-auth=any authenticated user_

### ADMIN AREA — AdminComponent tab shell

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-SH-01 | `app-admin` / `AdminComponent` | page | `/admin/:tab` | `features/admin/admin.component.ts:80` | A,M,OM (roleGuard) | TODO | Tab-shell page; routes each tab slug to the appropriate panel; non-admin tabs redirect to `compliance` |
| ADM-SH-01-HDR | `app-page-header` (SH-04 cross-link) | shared-cmp | `/admin/:tab` | `admin.component.html:1` | A,M,OM | TODO | Page title/subtitle — title differs: "Administration" (Admin) vs "Employee Portal" (non-admin) |

### ADMIN AREA — Users tab (`/admin/users`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-USR-01 | users tab panel | tab | `/admin/users` | `admin.component.html:6` | A only (ADMIN_ONLY_TABS) | TODO | User list with avatar, name, email, role, compliance progress, status columns |
| ADM-USR-02 | user list `app-data-table` (SH-05) | shared-cmp | `/admin/users` | `admin.component.html:16` | A | empty/populated/TODO | Sortable/filterable table: avatar · name · email · role-chip · compliance-chip · status-dot · actions |
| ADM-USR-03 | user create/edit dialog `app-dialog` (SH-10) | dialog | `/admin/users` | `admin.component.html:616` | A | TODO | Create/edit user; fields: first/last name, email (create only), initials, role select, role template, work location, avatar color picker, active toggle |
| ADM-USR-04 | scan identifiers cluster | cluster | `/admin/users` dialog | `admin.component.html:668` | A | TODO | RFID/NFC/barcode/biometric scan IDs per user; add/remove; WebHID RFID reader connect |
| ADM-USR-05 | RFID reader cluster | cluster | `/admin/users` dialog | `admin.component.html:691` | A | TODO | WebHID RFID reader pair/unpair + relay setup script download |
| ADM-USR-06 | setup code banner | cluster | `/admin/users` dialog | `admin.component.html:751` | A | shown-after-create/pending/TODO | Setup token display with copy action; shown for newly-created or password-pending users |
| ADM-USR-07 | `app-barcode-info` | shared-cmp | `/admin/users` dialog | `admin.component.html:741` | A | TODO | Barcode/QR info for user entity (compact mode) |
| ADM-USR-08 | `app-validation-button` (SH-16) | shared-cmp | `/admin/users` dialog | `admin.component.html:791` | A | TODO | Save-with-violations button for user form |
| ADM-USR-09 | TrackTypeDialogComponent | dialog | `/admin/track-types` | `features/admin/components/track-type-dialog.component.ts:1` | A | TODO | Create/edit track type with stage list |

### ADMIN AREA — Track Types tab (`/admin/track-types`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TT-01 | track types tab panel | tab | `/admin/track-types` | `admin.component.html:94` | A only | TODO | Accordion list of track types; each expands to show stage table |
| ADM-TT-02 | track type accordion | cluster | `/admin/track-types` | `admin.component.html:106` | A | empty/populated/TODO | Collapsible track type row: name, code, stage count, default badge; expand reveals stage detail table |
| ADM-TT-03 | stage detail table | table | `/admin/track-types` accordion | `admin.component.html:134` | A | TODO | Stage rows: order, name/color-chip, code, color swatch, WIP limit, document type, irreversible lock icon |
| ADM-TT-04 | TrackTypeDialogComponent | dialog | `/admin/track-types` | `features/admin/components/track-type-dialog.component.ts:1` | A | TODO | Create/edit track type; name, code, description, stages CRUD |

### ADMIN AREA — Terminology tab (`/admin/terminology`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TERM-01 | terminology tab panel | tab | `/admin/terminology` | `admin.component.html:182` | A only | empty/populated/TODO | Inline-editable table of terminology overrides (key → custom label) |

### ADMIN AREA — Settings tab (`/admin/settings`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-SET-01 | settings tab panel | tab | `/admin/settings` | `admin.component.html:222` | A only | TODO | Container for company profile, locations, pay-period locking, system settings, logo, brand lockups |
| ADM-SET-02 | company profile section | cluster | `/admin/settings` | `admin.component.html:226` | A | TODO | Company name, phone, email, EIN, website form; Save Profile action |
| ADM-SET-03 | company locations section | cluster | `/admin/settings` | `admin.component.html:254` | A | empty/populated/TODO | Locations table (name, address, state, phone, default chip); new/edit/delete/set-default actions |
| ADM-SET-04 | CompanyLocationDialogComponent | dialog | `/admin/settings` | `features/admin/components/company-location-dialog/company-location-dialog.component.ts:1` | A | TODO | Create/edit company location |
| ADM-SET-05 | pay-period locking section | cluster | `/admin/settings` | `admin.component.html:297` | A | TODO | Date picker + "Lock Period" action to lock time entries through a date |
| ADM-SET-06 | system settings grid | cluster | `/admin/settings` | `admin.component.html:386` | A | TODO | Key/value settings grid: app name, company name, planning cycle, nudge hour, upload limit, job priority, auto-archive days, email notifications, primary/accent brand colors |
| ADM-SET-07 | logo upload section | cluster | `/admin/settings` | `admin.component.html:332` | A | no-logo/has-logo/TODO | Logo preview, upload (image/*), remove actions |
| ADM-SET-08 | brand lockups section | cluster | `/admin/settings` | `admin.component.html:357` | A | TODO | Marquee, wordmark, favicon upload/reset; dark-preview thumbnails |
| ADM-SET-09 | AdminSettingsComponent | panel | `/admin/settings` (sub) | `features/admin/settings/admin-settings.component.ts:1` | A | TODO | NOTE: separate component file exists alongside inline settings; verify if used independently or embedded — needs live check |
| ADM-SET-10 | SettingFieldComponent | cluster | `/admin/settings` (sub) | `features/admin/settings/setting-field/setting-field.component.ts:1` | A | TODO | Reusable setting field renderer (label + description + control); used within AdminSettingsComponent |

### ADMIN AREA — Integrations tab (`/admin/integrations`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-INT-01 | integrations tab panel | tab | `/admin/integrations` | `admin.component.html:417` | A only | TODO | Hosts IntegrationsPanelComponent |
| ADM-INT-02 | IntegrationsPanelComponent | panel | `/admin/integrations` | `features/admin/components/integrations-panel/integrations-panel.component.ts:1` | A | TODO | Integration catalog list; QBO and other integrations |
| ADM-INT-03 | IntegrationConfigDialogComponent | dialog | `/admin/integrations` | `features/admin/components/integration-config-dialog/integration-config-dialog.component.ts:1` | A | TODO | Configure individual integration (keys, settings) |
| ADM-INT-04 | integration outbox tab panel | tab | `/admin/integration-outbox` | `admin.component.html:515` | A only | TODO | Hosts IntegrationOutboxPanelComponent |
| ADM-INT-05 | IntegrationOutboxPanelComponent | panel | `/admin/integration-outbox` | `features/admin/components/integration-outbox-panel/integration-outbox-panel.component.ts:1` | A | TODO | Outbound integration message queue / outbox viewer |

### ADMIN AREA — Training tab (`/admin/training`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TRN-01 | training tab panel | tab | `/admin/training` | `admin.component.html:424` | A,M | TODO | Hosts TrainingPanelComponent (admin-side LMS management) |
| ADM-TRN-02 | TrainingPanelComponent | panel | `/admin/training` | `features/admin/components/training-panel/training-panel.component.ts:1` | A,M | TODO | Admin LMS: module/path CRUD, user assignment |
| ADM-TRN-03 | TrainingModuleDialogComponent | dialog | `/admin/training` | `features/admin/components/training-panel/training-module-dialog.component.ts:1` | A,M | TODO | Create/edit training module (content, type, quiz) |
| ADM-TRN-04 | TrainingPathDialogComponent | dialog | `/admin/training` | `features/admin/components/training-panel/training-path-dialog.component.ts:1` | A,M | TODO | Create/edit training path (ordered modules) |
| ADM-TRN-05 | UserTrainingDetailPanelComponent | panel | `/admin/training` | `features/admin/components/training-panel/user-training-detail-panel.component.ts:1` | A,M | TODO | Per-user training progress detail |
| ADM-TRN-06 | WalkthroughPreviewDialogComponent | dialog | `/admin/training` | `features/admin/components/training-panel/walkthrough-preview-dialog.component.ts:1` | A,M | TODO | Preview walkthrough content within training module |
| ADM-TRN-07 | TrainingDashboardComponent | panel | `/admin/training` (sub) | `features/admin/components/training-dashboard/training-dashboard.component.ts:1` | A,M | TODO | Training analytics dashboard (completion rates, user rows) |
| ADM-TRN-08 | TrainingDetailPanelComponent | panel | `/admin/training` (sub) | `features/admin/components/training-detail-panel/training-detail-panel.component.ts:1` | A,M | TODO | Detailed training record panel |
| ADM-TRN-09 | TrainingDetailDialogComponent | dialog | `/admin/training` (sub) | `features/admin/components/training-detail-dialog/training-detail-dialog.component.ts:1` | A,M | TODO | Training detail dialog |

### ADMIN AREA — AI Assistants tab (`/admin/ai-assistants`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-AI-01 | ai-assistants tab panel | tab | `/admin/ai-assistants` | `admin.component.html:431` | A only + CAP-EXT-AI-ASSISTANT (D3: terminal closure — gate state documented in platform.md; tab renders regardless, API blocked when cap OFF) | TODO | Hosts AiAssistantsPanelComponent |
| ADM-AI-02 | AiAssistantsPanelComponent | panel | `/admin/ai-assistants` | `features/admin/components/ai-assistants-panel/ai-assistants-panel.component.ts:27` | A + CAP-EXT-AI-ASSISTANT | empty/populated/TODO | Table of AI assistants (name, category, entity filters, status); create/edit/delete |
| ADM-AI-03 | AiAssistantDialogComponent | dialog | `/admin/ai-assistants` | `features/admin/components/ai-assistant-dialog/ai-assistant-dialog.component.ts:1` | A + CAP-EXT-AI-ASSISTANT | TODO | Create/edit AI assistant (name, category, prompt, entity type filters) |

### ADMIN AREA — Teams tab (`/admin/teams`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TEAM-01 | teams tab panel | tab | `/admin/teams` | `admin.component.html:438` | A only | TODO | Hosts TeamsPanelComponent |
| ADM-TEAM-02 | TeamsPanelComponent | panel | `/admin/teams` | `features/admin/components/teams-panel/teams-panel.component.ts:1` | A | TODO | Teams & Kiosks management panel |

### ADMIN AREA — Role Templates tab (`/admin/role-templates`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-RTPL-01 | role-templates tab panel | tab | `/admin/role-templates` | `admin.component.html:445` | A only | TODO | Hosts RoleTemplatesPanelComponent |
| ADM-RTPL-02 | RoleTemplatesPanelComponent | panel | `/admin/role-templates` | `features/admin/components/role-templates-panel/role-templates-panel.component.ts:1` | A | TODO | Rollup template CRUD (Phase 3/WU-06/C1); templates bundle multiple roles for multi-role users |

### ADMIN AREA — Sales Tax tab (`/admin/sales-tax`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TAX-01 | sales-tax tab panel | tab | `/admin/sales-tax` | `admin.component.html:452` | A only | TODO | Hosts SalesTaxPanelComponent |
| ADM-TAX-02 | SalesTaxPanelComponent | panel | `/admin/sales-tax` | `features/admin/components/sales-tax-panel/sales-tax-panel.component.ts:1` | A | TODO | Sales tax rates list (jurisdiction + rate) |
| ADM-TAX-03 | SalesTaxDialogComponent | dialog | `/admin/sales-tax` | `features/admin/components/sales-tax-dialog/sales-tax-dialog.component.ts:1` | A | TODO | Create/edit sales tax rate |
| ADM-TAX-04 | StateWithholdingDialogComponent | dialog | `/admin/sales-tax` or `/admin/settings` | `features/admin/components/state-withholding-dialog/state-withholding-dialog.component.ts:1` | A | TODO | State payroll withholding config — needs live check to confirm which tab triggers it |

### ADMIN AREA — Time Corrections tab (`/admin/time-corrections`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TC-01 | time-corrections tab panel | tab | `/admin/time-corrections` | `admin.component.html:459` | A,M | TODO | Hosts TimeCorrectionsPanelComponent |
| ADM-TC-02 | TimeCorrectionsPanelComponent | panel | `/admin/time-corrections` | `features/admin/components/time-corrections-panel/time-corrections-panel.component.ts:1` | A,M | TODO | Review and approve/reject employee time entry corrections |

### ADMIN AREA — Events tab (`/admin/events`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-EVT-01 | events tab panel | tab | `/admin/events` | `admin.component.html:466` | A,M | TODO | Hosts EventsPanelComponent |
| ADM-EVT-02 | EventsPanelComponent | panel | `/admin/events` | `features/admin/components/events-panel/events-panel.component.ts:1` | A,M | TODO | Org-wide event management / event log admin view |

### ADMIN AREA — Announcements tab (`/admin/announcements`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-ANN-01 | announcements tab panel | tab | `/admin/announcements` | `admin.component.html:473` | A,M | TODO | Hosts AnnouncementsPanelComponent |
| ADM-ANN-02 | AnnouncementsPanelComponent | panel | `/admin/announcements` | `features/admin/components/announcements-panel/announcements-panel.component.ts:1` | A,M | TODO | Create/manage org-wide announcements |

### ADMIN AREA — Audit Log tab (`/admin/audit-log`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-AUDIT-01 | audit-log tab panel | tab | `/admin/audit-log` | `admin.component.html:480` | A only | TODO | Hosts AuditLogPanelComponent |
| ADM-AUDIT-02 | AuditLogPanelComponent | panel | `/admin/audit-log` | `features/admin/components/audit-log-panel/audit-log-panel.component.ts:1` | A | TODO | Tenant-wide audit trail log (user actions, timestamps) |

### ADMIN AREA — BI API Keys tab (`/admin/bi-api-keys`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-BI-01 | bi-api-keys tab panel | tab | `/admin/bi-api-keys` | `admin.component.html:487` | A only | TODO | Hosts BiApiKeysPanelComponent |
| ADM-BI-02 | BiApiKeysPanelComponent | panel | `/admin/bi-api-keys` | `features/admin/components/bi-api-keys-panel/bi-api-keys-panel.component.ts:1` | A | TODO | Business intelligence API key management (Phase 3/WU-04) |

### ADMIN AREA — EDI tab (`/admin/edi`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-EDI-01 | edi tab panel | tab | `/admin/edi` | `admin.component.html:494` | A only | TODO | Hosts EdiPanelComponent |
| ADM-EDI-02 | EdiPanelComponent | panel | `/admin/edi` | `features/admin/components/edi-panel/edi-panel.component.ts:1` | A | TODO | EDI trading partner config, transaction log (directions, formats, mappings) |

### ADMIN AREA — MFA Policy tab (`/admin/mfa`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-MFA-01 | mfa tab panel | tab | `/admin/mfa` | `admin.component.html:501` | A only | TODO | Hosts MfaPolicyPanelComponent |
| ADM-MFA-02 | MfaPolicyPanelComponent | panel | `/admin/mfa` | `features/admin/components/mfa-policy-panel/mfa-policy-panel.component.ts:1` | A | TODO | Org-wide MFA policy (require/optional/disabled per role) |

### ADMIN AREA — Automations tab (`/admin/automations`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-AUTO-01 | automations tab panel | tab | `/admin/automations` | `admin.component.html:508` | A only | TODO | Hosts DomainEventFailuresPanelComponent |
| ADM-AUTO-02 | DomainEventFailuresPanelComponent | panel | `/admin/automations` | `features/admin/components/domain-event-failures-panel/domain-event-failures-panel.component.ts:1` | A | TODO | Domain event failures / dead-letter queue viewer + retry |

### ADMIN AREA — Auto-PO Settings tab (`/admin/auto-po`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-APO-01 | auto-po tab panel | tab | `/admin/auto-po` | `admin.component.html:522` | A only | TODO | Hosts AutoPoSettingsComponent |
| ADM-APO-02 | AutoPoSettingsComponent | panel | `/admin/auto-po` | `features/admin/components/auto-po-settings/auto-po-settings.component.ts:1` | A | TODO | Auto-PO generation policy and threshold settings |

### ADMIN AREA — Expense Settings tab (`/admin/expenses`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-EXP-01 | expenses tab panel | tab | `/admin/expenses` | `admin.component.html:529` | A only | TODO | Hosts ExpenseSettingsPanelComponent |
| ADM-EXP-02 | ExpenseSettingsPanelComponent | panel | `/admin/expenses` | `features/admin/components/expense-settings-panel/expense-settings-panel.component.ts:1` | A | TODO | Expense policy settings (limits, categories, approval rules) |

### ADMIN AREA — Compliance tab (`/admin/compliance`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-CMP-01 | compliance tab panel | tab | `/admin/compliance` | `admin.component.html:536` | A,M,OM | TODO | Template list + per-user compliance picker + detail panel |
| ADM-CMP-02 | ComplianceTemplatesPanelComponent | panel | `/admin/compliance` | `features/admin/components/compliance-templates-panel/compliance-templates-panel.component.ts:1` | A,M,OM | TODO | Compliance template catalog (W-4, I-9, state forms, dynamic forms) |
| ADM-CMP-03 | ComplianceTemplateDialogComponent | dialog | `/admin/compliance` | `features/admin/components/compliance-template-dialog/compliance-template-dialog.component.ts:1` | A,M,OM | TODO | Create/edit compliance template |
| ADM-CMP-04 | CompleteI9DialogComponent | dialog | `/admin/compliance` | `features/admin/components/complete-i9-dialog/complete-i9-dialog.component.ts:1` | A,M,OM | TODO | Admin-side I-9 completion/verification dialog |
| ADM-CMP-05 | user compliance picker | cluster | `/admin/compliance` | `admin.component.html:542` | A,M,OM | TODO | `app-select` to choose a user; feeds UserCompliancePanelComponent |
| ADM-CMP-06 | UserCompliancePanelComponent | panel | `/admin/compliance` | `features/admin/components/user-compliance-panel/user-compliance-panel.component.ts:1` | A,M,OM | null-state/populated/TODO | Per-user compliance status detail (forms completed, missing items) |

### ADMIN AREA — Reference Data tab (`/admin/reference-data`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-REF-01 | reference-data tab panel | tab | `/admin/reference-data` | `admin.component.html:549` | A only | empty/populated/TODO | Accordion list of reference-data groups; each expands to values table |
| ADM-REF-02 | reference group accordion | cluster | `/admin/reference-data` | `admin.component.html:556` | A | TODO | Collapsible group row: groupCode → values table (sort order, code, label, effective dates, status) |

### ADMIN AREA — Standalone routes (separate lazy-loaded components)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-CAP-01 | CapabilitiesComponent | page | `/admin/capabilities` | `features/admin/capabilities/capabilities.component.ts:1` | A (route-level guard same as admin shell) | TODO | Capability list with search/area/enabled-only filters, enabled toggle, consultant-mode, click-through to detail |
| ADM-CAP-02 | CapabilityDetailComponent | page | `/admin/capabilities/:id` | `features/admin/capability-detail/capability-detail.component.ts:1` | A | TODO | Per-capability detail: settings, dependencies, apply/revert |
| ADM-CAP-03 | CapabilitiesDebugComponent | page | `/admin/capabilities-debug` | `features/admin/capabilities-debug/capabilities-debug.component.ts:1` | A | TODO | Diagnostic flat table of loaded capability descriptor (Phase 4A) |
| ADM-DISC-01 | DiscoveryComponent | page | `/admin/discovery` | `features/admin/discovery/discovery.component.ts:1` | A | TODO | Discovery wizard — guided capability/preset selection |
| ADM-PRE-01 | PresetBrowserComponent | page | `/admin/presets` | `features/admin/presets/preset-browser/preset-browser.component.ts:1` | A | TODO | Preset browser — list available presets with descriptions |
| ADM-PRE-02 | PresetCompareComponent | page | `/admin/presets/compare` | `features/admin/presets/preset-compare/preset-compare.component.ts:1` | A | TODO | Side-by-side preset comparison |
| ADM-PRE-03 | PresetCustomComponent | page | `/admin/presets/custom` | `features/admin/presets/preset-custom/preset-custom.component.ts:1` | A | TODO | Custom preset builder |
| ADM-PRE-04 | PresetDetailComponent | page | `/admin/presets/:id` | `features/admin/presets/preset-detail/preset-detail.component.ts:1` | A | TODO | Preset detail: capability set grouped by area; apply action refreshes descriptor |
| ADM-EC-01 | EntityCompletenessAdminComponent | page | `/admin/entity-completeness` | `features/admin/entity-completeness/entity-completeness-admin.component.ts:1` | A | TODO | CRUD over entity completeness requirement rows (drives completeness chip/badge) |
| ADM-EC-02 | EntityCapabilityRequirementDialogComponent | dialog | `/admin/entity-completeness` | `features/admin/entity-completeness/entity-capability-requirement-dialog/entity-capability-requirement-dialog.component.ts:1` | A | TODO | Create/edit entity capability requirement row |
| ADM-WC-01 | WorkingCalendarsComponent | page | `/admin/working-calendars` | `features/admin/working-calendars/working-calendars.component.ts:1` | A | TODO | Working calendar + holidays admin (bought-parts PR1; drives business-day calculations) |
| ADM-TAR-01 | TariffsComponent | page | `/admin/tariffs` | `features/admin/tariffs/tariffs.component.ts:1` | A | TODO | HTS-code tariff rate admin (bought-parts PR4; feeds landed-cost duty) |
| ADM-LS-01 | LeadSourcesComponent | page | `/admin/lead-sources` | `features/admin/lead-sources/lead-sources.component.ts:1` | A | TODO | Lead source catalog admin (Phase 1r/Batch 9) |
| ADM-ICR-01 | IcpRubricsComponent | page | `/admin/icp-rubrics` | `features/admin/icp-rubrics/icp-rubrics.component.ts:1` | A | TODO | ICP scoring rubric admin (Phase 1r/Batch 10) |
| ADM-ASR-01 | AssignmentRulesComponent | page | `/admin/assignment-rules` | `features/admin/assignment-rules/assignment-rules.component.ts:1` | A | TODO | Lead assignment rules (Phase 1r/Batch 11): round-robin/territory/industry/account-based |
| ADM-CUR-01 | CurrenciesComponent | page | `/admin/currencies` | `features/admin/currencies/currencies.component.ts:1` | A | TODO | Multi-currency catalog + FX rates |
| ADM-CUR-02 | CurrencyDialogComponent | dialog | `/admin/currencies` | `features/admin/currencies/currency-dialog.component.ts:1` | A | TODO | Create/edit currency |
| ADM-CUR-03 | ExchangeRateDialogComponent | dialog | `/admin/currencies` | `features/admin/currencies/exchange-rate-dialog.component.ts:1` | A | TODO | Create/edit exchange rate for a date |

### SETUP INTEGRATIONS

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| SI-01 | SetupIntegrationsComponent | page | `/setup/integrations` | `features/setup-integrations/setup-integrations.component.ts:1` | all-auth (authGuard; admin-only enforced in component) | TODO | Post-first-admin integration setup wizard (Phase 1m.7); walks initial QBO/integration config |

---

### ACCOUNT AREA

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ACC-00 | AccountLayoutComponent | page | `/account` (shell) | `features/account/account-layout.component.ts:1` | all-auth | TODO | Account section shell with sidebar nav |
| ACC-SB-01 | AccountSidebarComponent | cluster | `/account/*` | `features/account/components/account-sidebar/account-sidebar.component.ts:1` | all-auth | TODO | Left sidebar navigation for account pages |
| ACC-PROF-01 | AccountProfileComponent | page | `/account/profile` | `features/account/pages/profile/account-profile.component.ts:1` | all-auth | TODO | User profile: name, avatar, initials, role display |
| ACC-CONT-01 | AccountContactComponent | page | `/account/contact` | `features/account/pages/contact/account-contact.component.ts:1` | all-auth | TODO | Contact info: address, phone, personal email |
| ACC-EMER-01 | AccountEmergencyComponent | page | `/account/emergency` | `features/account/pages/emergency/account-emergency.component.ts:1` | all-auth | TODO | Emergency contacts |
| ACC-TAX-01 | AccountTaxFormsComponent | page | `/account/tax-forms` | `features/account/pages/tax-forms/account-tax-forms.component.ts:1` | all-auth | TODO | Tax form list (W-4, I-9, state withholding) — compliance forms index |
| ACC-TAX-02 | AccountTaxFormDetailComponent | page | `/account/tax-forms/:formType` | `features/account/pages/tax-form-detail/account-tax-form-detail.component.ts:1` | all-auth | TODO | Per-form detail: hosts ComplianceFormRendererComponent |
| ACC-TAX-03 | ComplianceFormRendererComponent | panel | `/account/tax-forms/:formType` | `features/account/components/compliance-form-renderer/compliance-form-renderer.component.ts:1` | all-auth | TODO | Dynamic compliance form renderer (W-4/I-9/state/dynamic forms) |
| ACC-DOC-01 | AccountDocumentsComponent | page | `/account/documents` | `features/account/pages/documents/account-documents.component.ts:1` | all-auth | TODO | Employee document storage (company-issued docs) |
| ACC-PAY-01 | AccountPayStubsComponent | page | `/account/pay-stubs` | `features/account/pages/pay-stubs/account-pay-stubs.component.ts:1` | all-auth | TODO | Pay stub history list |
| ACC-PAY-02 | AccountTaxDocumentsComponent | page | `/account/tax-documents` | `features/account/pages/tax-documents/account-tax-documents.component.ts:1` | all-auth | TODO | W-2 and other annual tax documents |
| ACC-SEC-01 | AccountSecurityComponent | page | `/account/security` | `features/account/pages/security/account-security.component.ts:1` | all-auth | TODO | Security settings: password change, MFA setup/disable |
| ACC-SEC-02 | MfaSetupDialogComponent | dialog | `/account/security` | `features/account/components/mfa-setup-dialog/mfa-setup-dialog.component.ts:1` | all-auth | TODO | MFA enrollment: QR code / TOTP setup flow |
| ACC-SEC-03 | MfaRecoveryCodesDialogComponent | dialog | `/account/security` | `features/account/components/mfa-recovery-codes-dialog/mfa-recovery-codes-dialog.component.ts:1` | all-auth | TODO | View/regenerate MFA recovery codes |
| ACC-CUST-01 | AccountCustomizationComponent | page | `/account/customization` | `features/account/pages/customization/account-customization.component.ts:1` | all-auth | TODO | UI customization: theme, layout, notifications preferences |
| ACC-ITGR-01 | AccountIntegrationsComponent | page | `/account/integrations` | `features/account/pages/integrations/account-integrations.component.ts:1` | all-auth | TODO | Personal integration connections (calendar, CRM, etc.) |
| ACC-ITGR-02 | ConnectIntegrationDialogComponent | dialog | `/account/integrations` | `features/account/pages/integrations/connect-integration-dialog.component.ts:1` | all-auth | TODO | OAuth/API key connect flow for personal integration |
| ACC-COMM-01 | AccountCommunicationsComponent | page | `/account/communications` | `features/account/pages/communications/account-communications.component.ts:1` | all-auth | TODO | Email/IMAP sync account connections |
| ACC-COMM-02 | ConnectCommunicationDialogComponent | dialog | `/account/communications` | `features/account/pages/communications/connect-communication-dialog.component.ts:1` | all-auth | TODO | Picker: Google/Microsoft OAuth vs IMAP |
| ACC-COMM-03 | ConnectImapDialogComponent | dialog | `/account/communications` | `features/account/pages/communications/connect-imap-dialog.component.ts:1` | all-auth | TODO | IMAP server credentials form |
| ACC-COMM-04 | OauthCallbackComponent | page | `/account/communications/oauth-callback` | `features/account/pages/communications/oauth-callback.component.ts:1` | all-auth | TODO | OAuth redirect-back handler (Google/Microsoft email) |

---

### EMPLOYEES AREA

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| EMP-LIST-01 | EmployeeListComponent | page | `/employees` | `features/employees/pages/employee-list/employee-list.component.ts:1` | A,M | TODO | Employee roster list (filterable/sortable) |
| EMP-DET-01 | EmployeeDetailComponent | page | `/employees/:id/:tab` | `features/employees/pages/employee-detail/employee-detail.component.ts:1` | A,M | TODO | Employee detail shell; tab nav for all sub-tabs |
| EMP-DET-02 | EmployeeOverviewTabComponent | tab | `/employees/:id/overview` | `features/employees/pages/employee-detail/tabs/employee-overview-tab.component.ts:1` | A,M | TODO | Employee summary: personal info, status, role |
| EMP-DET-03 | EmployeeActivityTabComponent | tab | `/employees/:id/activity` | `features/employees/pages/employee-detail/tabs/employee-activity-tab.component.ts:1` | A,M | TODO | Activity log for employee |
| EMP-DET-04 | EmployeeComplianceTabComponent | tab | `/employees/:id/compliance` | `features/employees/pages/employee-detail/tabs/employee-compliance-tab.component.ts:1` | A,M | TODO | Compliance form status per employee (mirrors UserCompliancePanelComponent data) |
| EMP-DET-05 | EmployeeDocumentsTabComponent | tab | `/employees/:id/documents` | `features/employees/pages/employee-detail/tabs/employee-documents-tab.component.ts:1` | A,M | TODO | Documents on file for this employee |
| EMP-DET-06 | EmployeeEventsTabComponent | tab | `/employees/:id/events` | `features/employees/pages/employee-detail/tabs/employee-events-tab.component.ts:1` | A,M | TODO | Event history for employee |
| EMP-DET-07 | EmployeeExpensesTabComponent | tab | `/employees/:id/expenses` | `features/employees/pages/employee-detail/tabs/employee-expenses-tab.component.ts:1` | A,M | TODO | Expense submissions by employee |
| EMP-DET-08 | EmployeeJobsTabComponent | tab | `/employees/:id/jobs` | `features/employees/pages/employee-detail/tabs/employee-jobs-tab.component.ts:1` | A,M | TODO | Jobs assigned to employee |
| EMP-DET-09 | EmployeePayTabComponent | tab | `/employees/:id/pay` | `features/employees/pages/employee-detail/tabs/employee-pay-tab.component.ts:1` | A,M | TODO | Pay rate / payroll info for employee |
| EMP-DET-10 | EmployeeTimeTabComponent | tab | `/employees/:id/time` | `features/employees/pages/employee-detail/tabs/employee-time-tab.component.ts:1` | A,M | TODO | Time entries for employee |
| EMP-DET-11 | EmployeeTrainingTabComponent | tab | `/employees/:id/training` | `features/employees/pages/employee-detail/tabs/employee-training-tab.component.ts:1` | A,M | TODO | Training progress/assignments for employee |

---

### TRAINING / LMS AREA

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| TRN-01 | TrainingComponent | page | `/training/:tab` | `features/training/training.component.ts:1` | all-auth | TODO | LMS shell tabs: my-learning, all-modules, paths, teams |
| TRN-MOD-01 | TrainingModuleComponent | page | `/training/module/:id` | `features/training/training-module/training-module.component.ts:1` | all-auth | TODO | Training module viewer (article/video/quiz/quickref/walkthrough content) |
| TRN-MOD-02 | TrainingModuleQuizComponent | panel | `/training/module/:id` | `features/training/training-module/training-module-quiz.component.ts:1` | all-auth | TODO | Quiz interaction within a training module |
| TRN-PATH-01 | TrainingPathComponent | page | `/training/path/:id` | `features/training/training-path/training-path.component.ts:1` | all-auth | TODO | Training path viewer: ordered module list with progress |

---

## Queue

_Items needing live confirmation or role-specific sweep — filed here by source-cataloger; dequeued when ui-scout confirms states._

All 94 components above carry `TODO` states — live confirmation needed for every entry.

Priority items for ui-scout first pass:
1. `/admin/settings` — verify whether `AdminSettingsComponent` (ADM-SET-09) is embedded within the settings tab or an independent surface; states for all 5 sub-sections
2. `/admin/compliance` — sweep as OfficeManager to confirm OfficeManager-only view
3. `/admin/ai-assistants` — confirm renders with CAP-EXT-AI-ASSISTANT both ON and OFF (D3 trigger state)
4. `/admin/integrations` — list all integration cards visible; integration config dialog states
5. `/admin/mfa` — MFA policy panel options/states
6. `ADM-TAX-04` StateWithholdingDialogComponent — which tab/context triggers this dialog
7. `/account/security` — MFA setup dialog states (QR, verify, recovery codes)
8. `/account/tax-forms/:formType` — confirm W-4/I-9/state/dynamic all render via ComplianceFormRendererComponent
9. `/employees` — confirm tab set visible for Manager (vs Admin)
10. Training LMS tabs: confirm actual tab slug names at `/training/:tab`

---

_Committed: initial source-map pass; denominator=94; rows filled from source=94; TODO states=94 (all need live sweep); queue depth=10 priority items + full states sweep_
