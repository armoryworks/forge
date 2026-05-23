# Admin & Account Region — Component Inventory

_Phase 05 · Sole writers: source-cataloger (source) + ui-scout (live sweep) · 2026-05-22_
_Scope: admin (settings, users, reference-data, terminology, capabilities, discovery, presets, EDI, MFA, AI-assistants, events, time-corrections + all other admin tabs), setup-integrations, employees, payroll (pay-stubs, tax-documents), compliance forms (W-4/I-9/state, dynamic forms), training/LMS, account (security, customization)_

**Inventory decisions (D1–D6):**
- **D1** — renders-for is source-authoritative (file:line + role/cap gate determines the column; live state confirms `states` only)
- **D2** — shared components located in `platform.md` (SH-01..SH-23) are cross-linked, not re-catalogued in this denominator
- **D3** — cap-gated-OFF + no live trigger = terminal closure; mark D3 terminal in states column
- **D4** — seed-first: live sweep uses seeded demo env; state observations are seed-dependent
- **D5** — role/capability sweep: each role's visible surface must be confirmed by ui-scout
- **D6** — dead-code exclusion: component files confirmed unreachable (not routed, no instantiating template) are excluded from the live denominator but receive one explicit `dead-code` row for audit completeness; denominator adjusted accordingly

---

## Cross-links

- **Shared components (23)** — already located in `platform.md` (SH-01 … SH-23); admin reuses `app-page-header` (SH-04), `app-data-table` (SH-05), `app-select` (SH-06), `app-input` (SH-07), `app-empty-state` (SH-09), `app-dialog` (SH-10), `app-datepicker` (SH-13), `app-validation-button` (SH-16), `app-avatar` (SH-17), `app-toolbar` (SH-08), `app-textarea` (SH-11). Cross-linked, not re-catalogued.
- **`app-barcode-info`** — lives in `shared/components/barcode-info/` but is NOT a platform-phase SH component (platform.md CLOSED; all consumers are non-platform regions). Catalogued here as `shared-cmp` at ADM-USR-07; also used in kanban/inventory/parts/purchase-orders/sales-orders (those regions own their own catalogue entries).
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

### Capability gate defaults relevant to this region (source: `forge-api/forge.api/Capabilities/CapabilityCatalog.cs`)

_All tab/route-level gates above are role-only. Capabilities gate API responses, not UI routes. Defaults apply to a fresh installation before admin changes any toggle._

| Capability code | Default | Admin surface gated |
|-----------------|---------|---------------------|
| CAP-EXT-AI-ASSISTANT | **OFF** (line ~175) | ADM-AI-01/02/03 — panel renders, API blocked when OFF |
| CAP-IDEN-AUTH-MFA | **OFF** | ADM-MFA-01/02 (policy panel) · ACC-SEC-02/03 (user setup) |
| CAP-HR-TRAINING | **OFF** | ADM-TRN-* (admin training tab) · TRN-* (LMS routes) |
| CAP-CROSS-INTEG-EDI | **OFF** | ADM-EDI-01/02 (EDI panel) |
| CAP-P2P-AUTOPO | **OFF** | ADM-APO-01/02 (auto-PO settings) |
| CAP-EXT-ANNOUNCEMENTS | **OFF** | ADM-ANN-01/02 (announcements panel) |
| CAP-CROSS-BI-EXPORT | **OFF** | ADM-BI-01/02 (BI API keys) |
| CAP-EXT-EMAIL-SYNC | **OFF** | ACC-COMM-01/02/03 (communications sync) |
| CAP-QC-COMPLIANCE-FORMS | **OFF** | ADM-CMP-02/03/04 (compliance templates) · ACC-TAX-01/02/03 |
| CAP-IDEN-CAPABILITY-ADMIN | **ON** | ADM-CAP-01/02/03 (capabilities pages) · ADM-DISC-01 · ADM-PRE-* |
| CAP-MD-CURRENCIES | **ON** | ADM-CUR-01/02/03 (currencies) |

_Note: Tab shells (ADM-AI-01 etc.) always render for the correct role regardless of cap state — the tab access logic is role-only. API calls within the panel return empty/error when the cap is OFF. Live sweep needed to observe actual panel behavior per cap state._

---

## Denominator

| Area | Feature component files | Source paths |
|------|------------------------|-------------|
| Admin | 53 | `features/admin/**/*.component.ts` (55 files; 2 excluded per D6: `admin-settings.component.ts` + `setting-field.component.ts` — live sweep + zero-usage grep confirmed cycle 6) |
| Account | 21 | `features/account/**/*.component.ts` (22 files; 1 excluded per D6: `account.component.ts` dead code) |
| Employees | 12 | `features/employees/**/*.component.ts` |
| Training | 4 | `features/training/**/*.component.ts` |
| Setup Integrations | 1 | `features/setup-integrations/*.component.ts` |
| **TOTAL** | **91** | |

Shared components (SH-01–SH-23) from `platform.md` are excluded from this denominator per D2. `app-barcode-info` is a cross-region shared utility (not in SH list); row ADM-USR-07 accounts for it in admin scope. Dead-code files excluded per D6; each has an explicit `dead-code` row for audit trail.

---

## Reconciliation Checklist

_Every in-scope route and feature-tree node must be ticked or queued before phase closes._

### Tree 1 — Routes (15 distinct routes/route-groups)
- [x] `/admin/users` (tab)
- [x] `/admin/track-types` (tab)
- [x] `/admin/reference-data` (tab)
- [x] `/admin/terminology` (tab)
- [x] `/admin/settings` (tab)
- [x] `/admin/integrations` (tab)
- [x] `/admin/training` (tab)
- [x] `/admin/ai-assistants` (tab)
- [x] `/admin/teams` (tab)
- [x] `/admin/role-templates` (tab)
- [x] `/admin/compliance` (tab)
- [x] `/admin/sales-tax` (tab)
- [x] `/admin/audit-log` (tab)
- [x] `/admin/time-corrections` (tab)
- [x] `/admin/events` (tab)
- [x] `/admin/announcements` (tab)
- [x] `/admin/edi` (tab)
- [x] `/admin/mfa` (tab)
- [x] `/admin/automations` (tab)
- [x] `/admin/auto-po` (tab)
- [x] `/admin/integration-outbox` (tab)
- [x] `/admin/expenses` (tab)
- [x] `/admin/bi-api-keys` (tab)
- [x] `/admin/capabilities`
- [x] `/admin/capabilities/:id` — confirmed live (ADM-Q-007 resolved cycle 5): CapabilityDetailComponent renders; see ADM-CAP-02 states
- [x] `/admin/capabilities-debug`
- [x] `/admin/discovery` (Q-S1 live-confirmed; Q-S2..Q-S16 queued ADM-Q-011)
- [x] `/admin/presets`
- [x] `/admin/presets/compare`
- [x] `/admin/presets/custom`
- [x] `/admin/presets/:id`
- [x] `/admin/entity-completeness`
- [x] `/admin/working-calendars`
- [x] `/admin/tariffs`
- [x] `/admin/lead-sources`
- [x] `/admin/icp-rubrics`
- [x] `/admin/assignment-rules`
- [x] `/admin/currencies`
- [x] `/account/profile`
- [x] `/account/contact`
- [x] `/account/emergency`
- [x] `/account/tax-forms`
- [ ] `/account/tax-forms/:formType` → queued ADM-Q-016 (w4/i9/state/w9 all redirected to /onboarding; onboarding step 1 confirmed but steps 2–7 not captured)
- [x] `/account/documents`
- [x] `/account/pay-stubs`
- [x] `/account/tax-documents`
- [x] `/account/security`
- [x] `/account/customization`
- [x] `/account/integrations`
- [x] `/account/communications`
- [x] `/account/communications/oauth-callback` — confirmed live (ADM-Q-015 resolved cycle 8): OauthCallbackComponent renders for all-auth regardless of CAP-EXT-EMAIL-SYNC state; no OAuth state without valid exchange
- [x] `/employees`
- [x] `/employees/:id/overview`
- [x] `/employees/:id/activity`
- [x] `/employees/:id/compliance`
- [x] `/employees/:id/documents`
- [x] `/employees/:id/events`
- [x] `/employees/:id/expenses`
- [x] `/employees/:id/jobs`
- [x] `/employees/:id/pay`
- [x] `/employees/:id/time`
- [x] `/employees/:id/training`
- [x] `/training/:tab` (my-learning / all-modules / paths — confirmed; teams tab present)
- [ ] `/training/module/:id` → queued ADM-Q-018 (no modules in non-seeded env; seed via admin training NEW MODULE first)
- [ ] `/training/path/:id` → queued ADM-Q-019 (no paths in non-seeded env; seed via admin training NEW PATH first)
- [x] `/setup/integrations` (confirmed redirects Admin → /dashboard; may only render on true first-run; queued ADM-Q-020)

### Tree 2 — Feature component files (94 total)
_(See component table below — all 94 need live confirmation of states)_

### Tree 3 — Shared component usages in admin/account/employees/training templates

_Paths abbreviated relative to `forge-ui/src/app/features/`. First-occurrence line shown per template._

| SH | selector | consuming templates (file:line) |
|----|----------|---------------------------------|
| SH-04 | `app-page-header` | `admin/admin.component.html:1` · `employees/pages/employee-list/employee-list.component.html:1` |
| SH-05 | `app-data-table` | `admin/admin.component.html:16` · `admin/components/edi-panel/edi-panel.component.html:22` · `admin/components/user-compliance-panel/user-compliance-panel.component.html:128` · `admin/components/bi-api-keys-panel/bi-api-keys-panel.component.html:16` · `admin/components/announcements-panel/announcements-panel.component.html:27` · `admin/components/ai-assistants-panel/ai-assistants-panel.component.html:10` · `admin/lead-sources/lead-sources.component.html:15` · `admin/tariffs/tariffs.component.html:15` · `admin/assignment-rules/assignment-rules.component.html:15` · `admin/icp-rubrics/icp-rubrics.component.html:15` · `admin/entity-completeness/entity-completeness-admin.component.html:27` · `account/pages/tax-documents/account-tax-documents.component.html:5` · `account/pages/pay-stubs/account-pay-stubs.component.html:5` · employee tabs (compliance:2 · expenses:2 · jobs:2 · time:8 · training:2 · pay:2 · events:2) |
| SH-06 | `app-select` | `admin/admin.component.html:629` · `admin/components/edi-panel/edi-panel.component.html:61` · `admin/components/user-compliance-panel/user-compliance-panel.component.html:270` · `admin/assignment-rules/assignment-rules.component.html:64` · `admin/entity-completeness/entity-capability-requirement-dialog/entity-capability-requirement-dialog.component.html:4` · `admin/components/compliance-template-dialog/compliance-template-dialog.component.html:106` · `admin/entity-completeness/entity-completeness-admin.component.html:7` · `admin/working-calendars/working-calendars.component.html:66` · `admin/capabilities/capabilities.component.html:8` · `account/pages/profile/account-profile.component.html:29` · `account/pages/emergency/account-emergency.component.html:12` · `employees/pages/employee-list/employee-list.component.html:15` · `training/training.component.html:29` |
| SH-07 | `app-input` | `admin/admin.component.html:241` (×12 instances) · `admin/components/edi-panel/edi-panel.component.html:97` · `admin/lead-sources/lead-sources.component.html:63` · `admin/tariffs/tariffs.component.html:59` · `admin/assignment-rules/assignment-rules.component.html:61` · `admin/icp-rubrics/icp-rubrics.component.html:63` · `admin/entity-capability-requirement-dialog/entity-capability-requirement-dialog.component.html:10` · `admin/entity-completeness/entity-completeness-admin.component.html:11` · `admin/components/compliance-template-dialog/compliance-template-dialog.component.html:105` · `admin/components/bi-api-keys-panel/bi-api-keys-panel.component.html:63` · `admin/working-calendars/working-calendars.component.html:65` · `admin/capabilities/capabilities.component.html:3` · `account/pages/contact/account-contact.component.html:11` · `account/pages/profile/account-profile.component.html:22` · `account/pages/security/account-security.component.html:13` · `account/pages/emergency/account-emergency.component.html:10` · `account/components/mfa-setup-dialog/mfa-setup-dialog.component.html:39` · `account/pages/communications/connect-imap-dialog.component.html:31` · `account/pages/communications/connect-communication-dialog.component.html:22` · `employees/pages/employee-list/employee-list.component.html:12` · `training/training.component.html:28` |
| SH-08 | `app-toolbar` | `admin/lead-sources/lead-sources.component.html:3` · `admin/tariffs/tariffs.component.html:3` · `admin/icp-rubrics/icp-rubrics.component.html:3` · `admin/assignment-rules/assignment-rules.component.html:3` · `admin/entity-completeness/entity-completeness-admin.component.html:6` |
| SH-09 | `app-empty-state` | `admin/admin.component.html:193` · `admin/components/user-compliance-panel/user-compliance-panel.component.html:79` · `admin/working-calendars/working-calendars.component.html:19` · `account/pages/integrations/account-integrations.component.html:84` · `account/pages/communications/account-communications.component.html:142` · `training/training.component.html:34` · `training/training-path/training-path.component.html:36` |
| SH-10 | `app-dialog` | `admin/admin.component.html:616` · `admin/components/edi-panel/edi-panel.component.html:95` · `admin/components/bi-api-keys-panel/bi-api-keys-panel.component.html:58` · `admin/entity-capability-requirement-dialog/entity-capability-requirement-dialog.component.html:1` · `admin/components/compliance-template-dialog/compliance-template-dialog.component.html:2` · `admin/lead-sources/lead-sources.component.html:58` · `admin/tariffs/tariffs.component.html:54` · `admin/assignment-rules/assignment-rules.component.html:56` · `admin/icp-rubrics/icp-rubrics.component.html:58` · `admin/components/announcements-panel/announcements-panel.component.html:76` · `account/components/mfa-recovery-codes-dialog/mfa-recovery-codes-dialog.component.html:1` · `account/components/mfa-setup-dialog/mfa-setup-dialog.component.html:1` · `account/pages/communications/connect-imap-dialog.component.html:1` · `account/pages/communications/connect-communication-dialog.component.html:1` · `account/pages/integrations/connect-integration-dialog.component.html:1` · `account/pages/tax-form-detail/account-tax-form-detail.component.html:337` |
| SH-11 | `app-textarea` | `admin/components/edi-panel/edi-panel.component.html:110` · `admin/lead-sources/lead-sources.component.html:71` · `admin/assignment-rules/assignment-rules.component.html:102` · `admin/icp-rubrics/icp-rubrics.component.html:66` · `admin/entity-capability-requirement-dialog/entity-capability-requirement-dialog.component.html:25` · `admin/components/compliance-template-dialog/compliance-template-dialog.component.html:109` · `admin/discovery/discovery.component.html:232` · `account/pages/integrations/connect-integration-dialog.component.html:16` |
| SH-12 | `app-drillable-chart` | _not used in this region_ |
| SH-13 | `app-datepicker` | `admin/admin.component.html:305` · `admin/components/user-compliance-panel/user-compliance-panel.component.html:187` · `admin/tariffs/tariffs.component.html:72` · `admin/components/bi-api-keys-panel/bi-api-keys-panel.component.html:69` · `admin/working-calendars/working-calendars.component.html:105` · `account/pages/profile/account-profile.component.html:27` |
| SH-14 | `app-sankey-chart` | _not used in this region_ |
| SH-15 | `app-page-layout` | `admin/entity-completeness/entity-completeness-admin.component.html:1` · `admin/lead-sources/lead-sources.component.html:1` · `admin/tariffs/tariffs.component.html:1` · `admin/assignment-rules/assignment-rules.component.html:1` · `admin/icp-rubrics/icp-rubrics.component.html:1` · `admin/working-calendars/working-calendars.component.html:1` · `admin/capability-detail/capability-detail.component.html:1` · `admin/presets/preset-detail/preset-detail.component.html:1` · `admin/discovery/discovery.component.html:1` · `admin/capabilities/capabilities.component.html:1` · `account/account.component.html:1` · `training/training.component.html:1` |
| SH-16 | `app-validation-button` | `admin/admin.component.html:791` · `admin/components/edi-panel/edi-panel.component.html:114` · `admin/components/compliance-template-dialog/compliance-template-dialog.component.html:142` · `admin/entity-capability-requirement-dialog/entity-capability-requirement-dialog.component.html:58` · `admin/lead-sources/lead-sources.component.html:83` · `admin/tariffs/tariffs.component.html:85` · `admin/assignment-rules/assignment-rules.component.html:117` · `admin/icp-rubrics/icp-rubrics.component.html:117` · `admin/components/bi-api-keys-panel/bi-api-keys-panel.component.html:80` · `admin/working-calendars/working-calendars.component.html:84` · `account/pages/contact/account-contact.component.html:23` · `account/pages/profile/account-profile.component.html:55` · `account/pages/security/account-security.component.html:25` · `account/pages/emergency/account-emergency.component.html:17` · `account/components/compliance-form-renderer/compliance-form-renderer.component.html:644` · `account/pages/communications/connect-imap-dialog.component.html:78` · `account/pages/communications/connect-communication-dialog.component.html:35` |
| SH-17 | `app-avatar` | `admin/admin.component.html:18` · `account/account.component.html:13` · `account/pages/profile/account-profile.component.html:10` · `employees/pages/employee-list/employee-list.component.html:33` · `employees/pages/employee-detail/employee-detail.component.html:20` |
| SH-18..22 | `app-entity-link` · `app-ai-help-panel` · `app-training-context-panel` · `app-chat-preview-popup` · `app-status-badge` | _not used in admin/account/employees/training feature templates_ |
| `app-barcode-info` (no SH#) | `admin/admin.component.html:741` (ADM-USR-07) — 6 further usages in assets/kanban/inventory/parts/purchase-orders/sales-orders (non-platform regions; each region will catalogue their own row) |

_Note: `app-barcode-info` (`shared/components/barcode-info/barcode-info.component.ts`) is a cross-region shared utility. platform.md CLOSED explicitly rejected SH-24 — all consumers are non-platform. No SH number assigned; catalogued as `shared-cmp` type in each consuming region's inventory._

---

## Component Table

_Abbreviations: A=Admin, M=Manager, OM=OfficeManager, E=Engineer, PM=PM; all-auth=any authenticated user_

### ADMIN AREA — AdminComponent tab shell

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-SH-01 | `app-admin` / `AdminComponent` | page | `/admin/:tab` | `features/admin/admin.component.ts:80` | A,M,OM (roleGuard) | populated(live-4): Admin sees 23 tabs; Manager sees 5 (training/time-corrections/events/announcements/compliance); Manager toast "Access denied" on training tab; BUG: Manager lands on /admin/users without redirect (ADM-Q-012 confirmed live) | Tab-shell page; routes each tab slug to the appropriate panel; non-admin tabs redirect to `compliance` |
| ADM-SH-01-HDR | `app-page-header` (SH-04 cross-link) | shared-cmp | `/admin/:tab` | `admin.component.html:1` | A,M,OM | populated(live-4): title="Administration" (Admin) · title="Employee Portal" (non-admin) | Page title/subtitle — title differs: "Administration" (Admin) vs "Employee Portal" (non-admin) |

### ADMIN AREA — Users tab (`/admin/users`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-USR-01 | users tab panel | tab | `/admin/users` | `admin.component.html:6` | A only (ADMIN_ONLY_TABS) | populated(live-7): 8 USERS header; ADD USER button; toolbar: download · grid_on · settings | User list with avatar, name, email, role, compliance progress, status columns |
| ADM-USR-02 | user list `app-data-table` (SH-05) | shared-cmp | `/admin/users` | `admin.component.html:16` | A | empty(source: emptyIcon="people", msg=admin.noUsersFound) · populated(live-7): 8 rows — AT Two Admin(ADMIN) · AE Engineer Alex(ENGINEER) · CO OfficeManager Casey(OFFICEMANAGER) · FA Admin Forge(ADMIN/Main Office/8/8 complete) · LI Lead Intake Service(LEADINTAKE/PENDING SETUP) · MM Manager Morgan(MANAGER) · PP PM Pat(PM) · SW Worker Sam(PRODUCTIONWORKER/8/8 complete); cols: Name · Email · Role · Location · Compliance(0/8 or 8/8) · Status(Active/PENDING SETUP) · Actions(edit/person_off=deactivate); vpn_key action on PENDING SETUP users | Sortable/filterable table: avatar · name · email · role-chip · compliance-chip · status-dot · actions |
| ADM-USR-03 | user create/edit dialog `app-dialog` (SH-10) | dialog | `/admin/users` | `admin.component.html:616` | A | populated-create(live-4): First Name · Last Name · Email · Initials · Role [default=Engineer] · Role Template · Avatar Color · CANCEL · CREATE USER; populated-edit(live-4): adds Work Location · Active · SCAN IDENTIFIERS · RFID CLIENT SETUP · BARCODE section · CANCEL · SAVE CHANGES | Create/edit user; fields: first/last name, email (create only), initials, role select, role template, work location, avatar color picker, active toggle |
| ADM-USR-04 | scan identifiers cluster | cluster | `/admin/users` dialog | `admin.component.html:668` | A | populated(live-4): "No scan identifiers assigned"; Type=RFID Card Â· Scan Value Â· ADD button; "Tap and hold card on reader" hint | RFID/NFC/barcode/biometric scan IDs per user; add/remove; WebHID RFID reader connect |
| ADM-USR-05 | RFID reader cluster | cluster | `/admin/users` dialog | `admin.component.html:691` | A | populated(live-4): DOWNLOAD SETUP SCRIPT button; "Run as Administrator" instruction | WebHID RFID reader pair/unpair + relay setup script download |
| ADM-USR-06 | setup code banner | cluster | `/admin/users` dialog | `admin.component.html:751` | A | shown-pending(live-4): lead-intake-system@forge.local shows vpn_key + PENDING SETUP status; setup token available | Setup token display with copy action; shown for newly-created or password-pending users |
| ADM-USR-07 | `app-barcode-info` | shared-cmp | `/admin/users` dialog | `admin.component.html:741` | A | populated(live-4): BARCODE section: EMP-000008; copy Â· PRINT Â· REGENERATE | Barcode/QR info for user entity (compact mode); cross-region shared utility (`shared/components/barcode-info/`), no SH# |
| ADM-USR-08 | `app-validation-button` (SH-16) | shared-cmp | `/admin/users` dialog | `admin.component.html:791` | A | populated(live-4): "warning 3" on blank create form; SAVE CHANGES on edit form | Save-with-violations button for user form |

### ADMIN AREA — Track Types tab (`/admin/track-types`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TT-01 | track types tab panel | tab | `/admin/track-types` | `admin.component.html:94` | A only | populated(live-4): 3 track types listed | Accordion list of track types; each expands to show stage table |
| ADM-TT-02 | track type accordion | cluster | `/admin/track-types` | `admin.component.html:106` | A | populated(live-4): Production DEFAULT 10 STAGES Â· R&D/Tooling RND 6 STAGES Â· Maintenance 4 STAGES; DEFAULT badge on Production | Collapsible track type row: name, code, stage count, default badge; expand reveals stage detail table |
| ADM-TT-03 | stage detail table | table | `/admin/track-types` accordion | `admin.component.html:134` | A | partial(live-4): accordion rows visible but not expanded during sweep | Stage rows: order, name/color-chip, code, color swatch, WIP limit, document type, irreversible lock icon |
| ADM-TT-04 | TrackTypeDialogComponent | dialog | `/admin/track-types` | `features/admin/components/track-type-dialog.component.ts:1` | A | populated(live-4: Name · Code · Description · STAGES section + ADD STAGE inline; validation badge shows unfilled required count; CREATE action) | Create/edit track type; name, code, description, stages CRUD |

### ADMIN AREA — Terminology tab (`/admin/terminology`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TERM-01 | terminology tab panel | tab | `/admin/terminology` | `admin.component.html:182` | A only | empty(live-7 confirmed): "0 ENTRIES · No terminology entries configured yet" + refresh icon; SAVE CHANGES button visible | Inline-editable table of terminology overrides (key → custom label) |

### ADMIN AREA — Settings tab (`/admin/settings`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-SET-01 | settings tab panel | tab | `/admin/settings` | `admin.component.html:222` | A only | populated(confirmed: COMPANY PROFILE + LOCATIONS + PAY PERIOD + SYSTEM SETTINGS sections all render) | Container for company profile, locations, pay-period locking, system settings, logo, brand lockups |
| ADM-SET-02 | company profile section | cluster | `/admin/settings` | `admin.component.html:226` | A | populated(live-7): Company Name="Forge Manufacturing" · Phone="(555) 555-0100" · Email="info@forge.local" · EIN/Tax ID (empty) · Website (empty); SAVE PROFILE button | Company name, phone, email, EIN, website form; Save Profile action |
| ADM-SET-03 | company locations section | cluster | `/admin/settings` | `admin.component.html:254` | A | empty(source: emptyIcon="location_on", msg=admin.noLocations) · populated(live: "Main Office" row visible; columns: Location Name, Phone, Address, State, Default chip) | Locations table (name, address, state, phone, default chip); new/edit/delete/set-default actions |
| ADM-SET-04 | CompanyLocationDialogComponent | dialog | `/admin/settings` | `features/admin/components/company-location-dialog/company-location-dialog.component.ts:1` | A | populated(live-7): Title="NEW LOCATION"; fields: Location Name · Phone · Street Address · Street Address 2 · City · State · ZIP/Postal Code · Country; CANCEL · CREATE LOCATION (warning×1) | Create/edit company location |
| ADM-SET-05 | pay-period locking section | cluster | `/admin/settings` | `admin.component.html:297` | A | populated(live: date picker + LOCK PERIOD button confirmed) | Date picker + "Lock Period" action to lock time entries through a date |
| ADM-SET-06 | system settings grid | cluster | `/admin/settings` | `admin.component.html:386` | A | populated(live-7): 10 settings confirmed — Application Name · Company Name · Planning Cycle (Days) · Daily Nudge Hour (24h) · Max Upload Size (MB) · Default Job Priority · Auto-Archive After (Days) · Email Notifications (Enabled/Disabled select) · Primary Brand Color · Accent Brand Color; SAVE CHANGES button | Key/value settings grid: app name, company name, planning cycle, nudge hour, upload limit, job priority, auto-archive days, email notifications, primary/accent brand colors |
| ADM-SET-07 | logo upload section | cluster | `/admin/settings` | `admin.component.html:332` | A | no-logo · has-logo(TODO) | Logo preview, upload (image/*), remove actions |
| ADM-SET-08 | brand lockups section | cluster | `/admin/settings` | `admin.component.html:357` | A | populated(live: BRAND LOCKUPS section renders with upload/reset for marquee/wordmark/favicon) | Marquee, wordmark, favicon upload/reset; dark-preview thumbnails |
| ADM-SET-09 | AdminSettingsComponent | dead-code | — | `features/admin/settings/admin-settings.component.ts:1` | none/unreachable | dead-code(D6: selector `app-admin-settings` never instantiated — live sweep ADM-SET-09-CHECK: "NO-app-admin-settings-component"; zero `<app-admin-settings>` usages in any template) | Orphaned AdminSettingsComponent — not routed and not embedded; excluded from denominator per D6 |
| ADM-SET-10 | SettingFieldComponent | dead-code | — | `features/admin/settings/setting-field/setting-field.component.ts:1` | none/unreachable | dead-code(D6: selector `app-setting-field` has zero usages across entire app — grep confirmed cycle 6; only consumer was dead-code ADM-SET-09) | Orphaned SettingFieldComponent — not used by any live component; excluded from denominator per D6 |

### ADMIN AREA — Integrations tab (`/admin/integrations`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-INT-01 | integrations tab panel | tab | `/admin/integrations` | `admin.component.html:417` | A only | populated(live: CONFIGURE + TEST buttons visible; multiple providers shown) | Hosts IntegrationsPanelComponent |
| ADM-INT-02 | IntegrationsPanelComponent | panel | `/admin/integrations` | `features/admin/components/integrations-panel/integrations-panel.component.ts:1` | A | populated(live: 20 providers across 4 categories, each with CONFIGURE + TEST buttons) | Integration catalog list; 20 providers: 3 communications, 6 service, 4 shipping, 7 accounting |
| ADM-INT-03 | IntegrationConfigDialogComponent | dialog | `/admin/integrations` | `features/admin/components/integration-config-dialog/integration-config-dialog.component.ts:1` | A | populated(live: UPS dialog confirmed — UPS Mode, UPS Client ID, UPS Client Secret, UPS Account Number + sandbox guide + TEST button; full field structure source-pre-extracted per §Source-Extracted Detail) · empty(if fields.length=0: close only) · test-result-success · test-result-error · connecting-spinner(OAuth) | Configure individual integration; descriptor-driven fields (20 providers); see §Source-Extracted Detail for per-provider field lists |
| ADM-INT-04 | integration outbox tab panel | tab | `/admin/integration-outbox` | `admin.component.html:515` | A only | empty(live: 0 entries; Status + Provider filters; REFRESH button) | Hosts IntegrationOutboxPanelComponent |
| ADM-INT-05 | IntegrationOutboxPanelComponent | panel | `/admin/integration-outbox` | `features/admin/components/integration-outbox-panel/integration-outbox-panel.component.ts:1` | A | empty(live: 0 entries; "No outbox entries") · populated(TODO) | Outbound integration message queue / outbox viewer |

### ADMIN AREA — Training tab (`/admin/training`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TRN-01 | training tab panel | tab | `/admin/training` | `admin.component.html:424` | A,M | populated(live: 3 sub-tabs: CONTENT `library_books`, PATHS `route`, USER PROGRESS `insights`; empty modules state) | Hosts TrainingPanelComponent (admin-side LMS management) |
| ADM-TRN-02 | TrainingPanelComponent | panel | `/admin/training` | `features/admin/components/training-panel/training-panel.component.ts:1` | A,M | empty-modules(live: 0 modules; NEW MODULE button) · empty-paths(live: 0 paths; NEW PATH button) · user-progress(see ADM-Q-025) | Admin LMS: CONTENT tab (module list + NEW MODULE), PATHS tab, USER PROGRESS tab |
| ADM-TRN-03 | TrainingModuleDialogComponent | dialog | `/admin/training` | `features/admin/components/training-panel/training-module-dialog.component.ts:1` | A,M | populated(live-4): Title · Slug · Summary · Content Type [default=Article] · Estimated Minutes · App Routes · Tags · Published · Article Content JSON (when type=Article) · CANCEL · CREATE MODULE | Create/edit training module (content, type, quiz) |
| ADM-TRN-04 | TrainingPathDialogComponent | dialog | `/admin/training` | `features/admin/components/training-panel/training-path-dialog.component.ts:1` | A,M | new-dialog(source-confirmed: title(req/max200), slug(auto-gen), description(max500), icon(default school), isAutoAssigned(toggle), isActive(toggle) — see §Source-Extracted Detail ADM-TRN-04) · edit-dialog(source-confirmed: pre-fills all fields) — LIVE TODO | Create/edit training path (ordered modules) |
| ADM-TRN-05 | UserTrainingDetailPanelComponent | panel | `/admin/training` | `features/admin/components/training-panel/user-training-detail-panel.component.ts:1` | A,M | TODO | Per-user training progress detail |
| ADM-TRN-06 | WalkthroughPreviewDialogComponent | dialog | `/admin/training` | `features/admin/components/training-panel/walkthrough-preview-dialog.component.ts:1` | A,M | TODO | Preview walkthrough content within training module |
| ADM-TRN-07 | TrainingDashboardComponent | panel | `/admin/training` (sub) | `features/admin/components/training-dashboard/training-dashboard.component.ts:1` | A,M | TODO | Training analytics dashboard (completion rates, user rows) |
| ADM-TRN-08 | TrainingDetailPanelComponent | panel | `/admin/training` (sub) | `features/admin/components/training-detail-panel/training-detail-panel.component.ts:12` | A,M | TODO(trigger resolved: embedded in TrainingDetailDialogComponent template line 17) | Per-user training record detail panel; displayed inside TrainingDetailDialogComponent |
| ADM-TRN-09 | TrainingDetailDialogComponent | dialog | `/admin/training` (sub) | `features/admin/components/training-detail-dialog/training-detail-dialog.component.ts:12` | A,M | TODO(trigger resolved: opened from USER PROGRESS tab → row icon click → training-panel.component.ts:208 openUserDetailDialog(); also auto-open via URL entityType=training query param per training-panel.component.ts:146-155) | Training detail dialog; wraps TrainingDetailPanelComponent; userId passed via MAT_DIALOG_DATA |

### ADMIN AREA — AI Assistants tab (`/admin/ai-assistants`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-AI-01 | ai-assistants tab panel | tab | `/admin/ai-assistants` | `admin.component.html:431` | A only (role gate; tab shell always renders for Admin) | renders(source) | Hosts AiAssistantsPanelComponent; CAP-EXT-AI-ASSISTANT [default=OFF (source)] gates API — panel shows empty/error when cap OFF |
| ADM-AI-02 | AiAssistantsPanelComponent | panel | `/admin/ai-assistants` | `features/admin/components/ai-assistants-panel/ai-assistants-panel.component.ts:27` | A; CAP-EXT-AI-ASSISTANT [default=OFF (source)] blocks API when cap OFF | empty(live: 0 assistants; "No AI assistants configured") · error(live: "Failed to load AI assistants" + Dismiss visible simultaneously — cap OFF causes API error) · populated(TODO) | Table of AI assistants (name, category, entity filters, status); create/edit/delete |
| ADM-AI-03 | AiAssistantDialogComponent | dialog | `/admin/ai-assistants` | `features/admin/components/ai-assistant-dialog/ai-assistant-dialog.component.ts:1` | A; CAP-EXT-AI-ASSISTANT [default=OFF (source)] | populated(live-4): Name · Category [default=Custom] · Description · Icon · System Prompt · Entity Type Filters · STARTER QUESTIONS · Active · Sort Order · Advanced Settings · CANCEL · CREATE ASSISTANT — dialog opens even when cap is OFF (cap gates API responses only, not dialog) | Create/edit AI assistant (name, category, prompt, entity type filters) |

### ADMIN AREA — Teams tab (`/admin/teams`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TEAM-01 | teams tab panel | tab | `/admin/teams` | `admin.component.html:438` | A only | populated(live: DISPLAY + KIOSK sub-tabs; 1 team row visible) | Hosts TeamsPanelComponent |
| ADM-TEAM-02 | TeamsPanelComponent | panel | `/admin/teams` | `features/admin/components/teams-panel/teams-panel.component.ts:1` | A | populated(live: 2 sub-tabs: DISPLAY `tv`, KIOSK `access_time`; 1 team with TEAM NAME/DESCRIPTION/MEMBERS/ACTIONS columns; NEW TEAM button; KIOSK sub-tab not captured — ADM-Q-023) | Teams & Kiosks management panel; DISPLAY tab confirmed |

### ADMIN AREA — Role Templates tab (`/admin/role-templates`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-RTPL-01 | role-templates tab panel | tab | `/admin/role-templates` | `admin.component.html:445` | A only | populated(live: 3 role templates; NEW TEMPLATE button) | Hosts RoleTemplatesPanelComponent |
| ADM-RTPL-02 | RoleTemplatesPanelComponent | panel | `/admin/role-templates` | `features/admin/components/role-templates-panel/role-templates-panel.component.ts:1` | A | populated(live: 3 templates visible) · dialog-fields(NEW TEMPLATE: Template Name, Description, Included Roles (multiselect + description); CREATE TEMPLATE) | Rollup template CRUD; templates bundle multiple base roles for multi-role users |

### ADMIN AREA — Sales Tax tab (`/admin/sales-tax`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TAX-01 | sales-tax tab panel | tab | `/admin/sales-tax` | `admin.component.html:452` | A only | empty(live: 0 Tax Rates; ADD RATE button) | Hosts SalesTaxPanelComponent |
| ADM-TAX-02 | SalesTaxPanelComponent | panel | `/admin/sales-tax` | `features/admin/components/sales-tax-panel/sales-tax-panel.component.ts:1` | A | empty(live: "No sales tax rates configured") · populated(TODO) | Sales tax rates list (jurisdiction + rate) |
| ADM-TAX-03 | SalesTaxDialogComponent | dialog | `/admin/sales-tax` | `features/admin/components/sales-tax-dialog/sales-tax-dialog.component.ts:1` | A | populated(live: 8 fields: Name, Code, State, Rate (%), Effective From, Description (optional), Set as default rate (toggle), Exempt rate (toggle), GL Posting Account (optional); ADD RATE / SAVE button; warning-3 indicator) | Create/edit sales tax rate |
| ADM-TAX-04 | StateWithholdingDialogComponent | dialog | `/admin/compliance` (via ComplianceTemplatesPanelComponent) | `features/admin/components/state-withholding-dialog/state-withholding-dialog.component.ts:1` | A,M,OM | source-confirmed(ADM-Q-021 resolved): trigger at compliance-templates-panel.html:65 + ts:87; 50-state picker in 4 categories; LIVE TODO | Company state selector for payroll withholding — triggered from compliance-templates-panel.component.html:65 + ts:87,102; shows all 50 states in 4 categories (ready/needs-upload/uses-W4/no-tax); clicking a state sets company_state system setting |

### ADMIN AREA — Time Corrections tab (`/admin/time-corrections`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-TC-01 | time-corrections tab panel | tab | `/admin/time-corrections` | `admin.component.html:459` | A,M | populated(live: filter fields Employee/From Date/To Date; sortable TIME ENTRIES table with EMPLOYEE/DATE/JOB#/START/END/DURATION/CATEGORY/NOTES columns; edit action per row) | Hosts TimeCorrectionsPanelComponent |
| ADM-TC-02 | TimeCorrectionsPanelComponent | panel | `/admin/time-corrections` | `features/admin/components/time-corrections-panel/time-corrections-panel.component.ts:1` | A,M | populated(live-4): correction list renders; edit dialog fields: Employee/Original Date/Start/End/Duration [read-only] · Date · Start Time · End Time · Category · Notes · Reason for Correction · CANCEL · SAVE CORRECTION | Review and approve/reject employee time entry corrections |

### ADMIN AREA — Events tab (`/admin/events`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-EVT-01 | events tab panel | tab | `/admin/events` | `admin.component.html:466` | A,M | empty(live: 0 events; Type filter; NEW EVENT button) | Hosts EventsPanelComponent |
| ADM-EVT-02 | EventsPanelComponent | panel | `/admin/events` | `features/admin/components/events-panel/events-panel.component.ts:1` | A,M | populated(live-4): NEW EVENT dialog fields: Title · Type [default=Meeting] · Location · Start Date · Start Time · End Date · End Time · Description · Attendees · Required attendance · CANCEL · CREATE EVENT | Org-wide event management / event log admin view |

### ADMIN AREA — Announcements tab (`/admin/announcements`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-ANN-01 | announcements tab panel | tab | `/admin/announcements` | `admin.component.html:473` | A,M | populated(live: ANNOUNCEMENTS + TEMPLATES sub-tabs; empty state) | Hosts AnnouncementsPanelComponent |
| ADM-ANN-02 | AnnouncementsPanelComponent | panel | `/admin/announcements` | `features/admin/components/announcements-panel/announcements-panel.component.ts:1` | A,M | empty(live: "No announcements sent yet") · dialog-fields(SEND ANNOUNCEMENT: Template, Title, Content, Severity (Info default), Scope (Company-Wide default), Expires At, Require Acknowledgment; SEND button) · templates-sub-tab(ADM-Q-005 pending) | Create/manage org-wide announcements; ANNOUNCEMENTS + TEMPLATES sub-tabs |

### ADMIN AREA — Audit Log tab (`/admin/audit-log`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-AUDIT-01 | audit-log tab panel | tab | `/admin/audit-log` | `admin.component.html:480` | A only | empty(live: "No audit log entries found"; filters: Entity Type, System Event, Action, From Date, To Date; paginated 25/page) | Hosts AuditLogPanelComponent |
| ADM-AUDIT-02 | AuditLogPanelComponent | panel | `/admin/audit-log` | `features/admin/components/audit-log-panel/audit-log-panel.component.ts:1` | A | empty(live: 0 of 0; all audit entries cleared in non-seeded env) · populated(TODO) | Tenant-wide audit trail log (user actions, timestamps) |

### ADMIN AREA — BI API Keys tab (`/admin/bi-api-keys`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-BI-01 | bi-api-keys tab panel | tab | `/admin/bi-api-keys` | `admin.component.html:487` | A only | empty(live-4): 0 keys; ISSUE KEY button | Hosts BiApiKeysPanelComponent |
| ADM-BI-02 | BiApiKeysPanelComponent | panel | `/admin/bi-api-keys` | `features/admin/components/bi-api-keys-panel/bi-api-keys-panel.component.ts:1` | A | populated(live-4): list panel renders; ISSUE KEY dialog fields: Name · Expires At [optional] · CANCEL · ISSUE KEY | Business intelligence API key management (Phase 3/WU-04) |

### ADMIN AREA — EDI tab (`/admin/edi`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-EDI-01 | edi tab panel | tab | `/admin/edi` | `admin.component.html:494` | A only | populated(live: TRADING PARTNERS + TRANSACTIONS sub-tabs; 0 partners; NEW PARTNER button) | Hosts EdiPanelComponent |
| ADM-EDI-02 | EdiPanelComponent | panel | `/admin/edi` | `features/admin/components/edi-panel/edi-panel.component.ts:1` | A | empty(live: "No trading partners configured") · dialog-fields(NEW TRADING PARTNER: Name, Qualifier ID, Qualifier Value, Format (X12/ANSI default), Transport (Manual default), Auto-process (toggle), Require Ack (toggle), Notes; CREATE button; warning-2 indicator) · transactions-tab(TODO) | EDI trading partner config; TRADING PARTNERS confirmed; TRANSACTIONS tab pending |

### ADMIN AREA — MFA Policy tab (`/admin/mfa`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-MFA-01 | mfa tab panel | tab | `/admin/mfa` | `admin.component.html:501` | A only | populated(live: MFA Policy heading + Required for Roles multiselect + SAVE + USER COMPLIANCE table) | Hosts MfaPolicyPanelComponent |
| ADM-MFA-02 | MfaPolicyPanelComponent | panel | `/admin/mfa` | `features/admin/components/mfa-policy-panel/mfa-policy-panel.component.ts:1` | A | populated(live: MFA Policy section with Required for Roles multiselect (role-picker), SAVE button; USER COMPLIANCE section with "No users found" empty state; filter/drill-down ADM-Q-026 pending) | Org-wide MFA policy: role-level enforcement; USER COMPLIANCE compliance table |

### ADMIN AREA — Automations tab (`/admin/automations`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-AUTO-01 | automations tab panel | tab | `/admin/automations` | `admin.component.html:508` | A only | empty(live: 0 failures; Status filter; REFRESH button) | Hosts DomainEventFailuresPanelComponent |
| ADM-AUTO-02 | DomainEventFailuresPanelComponent | panel | `/admin/automations` | `features/admin/components/domain-event-failures-panel/domain-event-failures-panel.component.ts:1` | A | empty(live: "No domain event failures") · populated(TODO) | Domain event failures / dead-letter queue viewer + retry |

### ADMIN AREA — Auto-PO Settings tab (`/admin/auto-po`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-APO-01 | auto-po tab panel | tab | `/admin/auto-po` | `admin.component.html:522` | A only | populated(live: Auto-PO Settings form; SAVE button) | Hosts AutoPoSettingsComponent |
| ADM-APO-02 | AutoPoSettingsComponent | panel | `/admin/auto-po` | `features/admin/components/auto-po-settings/auto-po-settings.component.ts:1` | A | populated(live: 4 fields: Enable Auto-PO (toggle), Auto-PO Mode (Suggest default), Buffer Days, Send Chat Notifications (toggle); SAVE button) | Auto-PO generation policy and threshold settings |

### ADMIN AREA — Expense Settings tab (`/admin/expenses`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-EXP-01 | expenses tab panel | tab | `/admin/expenses` | `admin.component.html:529` | A only | populated(live: Expense Policy form + SAVE button) | Hosts ExpenseSettingsPanelComponent |
| ADM-EXP-02 | ExpenseSettingsPanelComponent | panel | `/admin/expenses` | `features/admin/components/expense-settings-panel/expense-settings-panel.component.ts:1` | A | populated(live: 5 fields: Allow self-approval (toggle), Auto-approve threshold ($ input; "No auto-approval" placeholder), Maximum expense amount ($ input; "No limit" placeholder), Require receipt attachment (toggle), Minimum description length; SAVE button) | Expense policy settings (limits, approval rules) |

### ADMIN AREA — Compliance tab (`/admin/compliance`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-CMP-01 | compliance tab panel | tab | `/admin/compliance` | `admin.component.html:536` | A,M,OM | populated(live: 0 templates; SYNC ALL + NEW TEMPLATE buttons; PER-USER COMPLIANCE section with user picker "Select User") | Template list + per-user compliance picker + detail panel |
| ADM-CMP-02 | ComplianceTemplatesPanelComponent | panel | `/admin/compliance` | `features/admin/components/compliance-templates-panel/compliance-templates-panel.component.ts:1` | A,M,OM | empty(live: "No compliance templates configured") · populated(TODO) · SYNC ALL action visible | Compliance template catalog (W-4, I-9, state forms, dynamic forms) |
| ADM-CMP-03 | ComplianceTemplateDialogComponent | dialog | `/admin/compliance` | `features/admin/components/compliance-template-dialog/compliance-template-dialog.component.ts:1` | A,M,OM | populated(live-4): Name · Form Type [default=W-4 Federal Tax] · Description · Icon · Profile Key · Source URL · Sort Order · Auto-Sync · Active · Requires Identity Docs · Blocks Job Assignment · CANCEL · CREATE | Create/edit compliance template |
| ADM-CMP-04 | CompleteI9DialogComponent | dialog | `/admin/compliance` (via UserCompliancePanelComponent) | `features/admin/components/complete-i9-dialog/complete-i9-dialog.component.ts:36` | A,M,OM | TODO(trigger resolved: user-compliance-panel.component.html:67 conditional btn visible when formType=I9 AND i9Section1SignedAt AND !i9Section2SignedAt → openCompleteI9Dialog() → user-compliance-panel.component.ts:160-169) | Admin-side I-9 Section 2 completion: shown when employee has signed Section 1 but employer hasn't signed Section 2 |
| ADM-CMP-05 | user compliance picker | cluster | `/admin/compliance` | `admin.component.html:542` | A,M,OM | populated(live: "Select User" placeholder; user search input) | `app-select` to choose a user; feeds UserCompliancePanelComponent |
| ADM-CMP-06 | UserCompliancePanelComponent | panel | `/admin/compliance` | `features/admin/components/user-compliance-panel/user-compliance-panel.component.ts:1` | A,M,OM | no-user(source: app-empty-state icon="person_search") · no-submissions(source: icon="description") · no-identity-docs(source: icon="badge") · no-tax-docs(source: icon="receipt_long") · populated(TODO) | Per-user compliance status detail (forms completed, missing items) |

### ADMIN AREA — Reference Data tab (`/admin/reference-data`)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-REF-01 | reference-data tab panel | tab | `/admin/reference-data` | `admin.component.html:549` | A only | populated(live: 17 reference-data groups visible) | Accordion list of reference-data groups; each expands to values table |
| ADM-REF-02 | reference group accordion | cluster | `/admin/reference-data` | `admin.component.html:556` | A | populated(live-7): uses custom `.accordion-item`/`.accordion-header` CSS classes (not mat-expansion-panel); icon: chevron_right→expand_more on expand; expanded columns: Order · Code · Label · Effective From · Effective To · Status; sample Asset Hold Type (3 entries): asset_hold_maintenance(Maintenance Due) · asset_hold_calibration(Calibration Expired) · asset_hold_repair(Under Repair); sample Clock Event Type (6 entries): ClockIn · ClockOut · BreakStart · BreakEnd · LunchStart · LunchEnd; sample Contact Role (8 entries): primary · billing · technical · shipping · owner · manager · engineer · procurement | Collapsible group row: groupCode → values table (sort order, code, label, effective dates, status) |

### ADMIN AREA — Standalone routes (separate lazy-loaded components)

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ADM-CAP-01 | CapabilitiesComponent | page | `/admin/capabilities` | `features/admin/capabilities/capabilities.component.ts:1` | A (route-level guard same as admin shell) | populated(live: 62/151 enabled; areas grouped: ACCT 2/8, CROSS 9/12, EXT 3/17…; Search + Area + Enabled-only filters; CONSULTANT MODE toggle; RUN DISCOVERY + BROWSE PRESETS + CLOSE welcome banner; REFRESH; each area expandable with cap rows + chevron-right detail links) | Capability list with search/area/enabled-only filters, capability toggles, consultant-mode toggle, click-through to detail |
| ADM-CAP-02 | CapabilityDetailComponent | page | `/admin/capabilities/:id` | `features/admin/capability-detail/capability-detail.component.ts:1` | A | populated(live: PERMISSION MATRIX ENFORCEMENT example — BACK, REFRESH, cap name, code, area, default status, description, ENABLED toggle, RELATIONSHIPS section with DEPENDS ON (1) + REQUIRED BY (0), CONFIGURATION section, RECENT ACTIVITY section) | Per-capability detail: name/code/area, dependencies, ENABLED state, configuration row, audit entries |
| ADM-CAP-03 | CapabilitiesDebugComponent | page | `/admin/capabilities-debug` | `features/admin/capabilities-debug/capabilities-debug.component.ts:1` | A | populated(live: 151 total, 62 enabled; flat table: CODE/AREA/NAME/DEFAULT/STATE/ROLES columns; REFRESH button) | Diagnostic flat table of loaded capability descriptor (Phase 4A) |
| ADM-DISC-01 | DiscoveryComponent | page | `/admin/discovery` | `features/admin/discovery/discovery.component.ts:1` | A | populated(live: 1 OF 16 steps; SELF-SERVE mode button; SKIP DISCOVERY; Q-S1 confirmed — "We sell physical products / We sell time+services / Both"; BACK + NEXT navigation; full question catalog source-extracted in §Source-Extracted Detail) | Discovery wizard — 16-step guided capability/preset selection; branch map fully sourced (ADM-Q-011 closed from source) |
| ADM-PRE-01 | PresetBrowserComponent | page | `/admin/presets` | `features/admin/presets/preset-browser/preset-browser.component.ts:1` | A | populated(live: 10 presets visible; COMPARE button; CAPABILITIES back nav) | Preset browser — curated capability bundles; 10 presets including "Two-Person Shop" (PRESET-01) visible |
| ADM-PRE-02 | PresetCompareComponent | page | `/admin/presets/compare` | `features/admin/presets/preset-compare/preset-compare.component.ts:1` | A | empty(live: compare page renders at /admin/presets/compare; no presets selected; pick-2-4 state) · populated(select 2+ preset checkboxes first — ADM-Q-014 pending) | Side-by-side preset comparison |
| ADM-PRE-03 | PresetCustomComponent | page | `/admin/presets/custom` | `features/admin/presets/preset-custom/preset-custom.component.ts:1` | A | populated(live: CUSTOM CONFIGURATION heading; PRESETS back nav; RESET TO DEFAULTS button; capability toggle list) | Custom preset builder — start from catalog defaults, toggle individual capabilities |
| ADM-PRE-04 | PresetDetailComponent | page | `/admin/presets/:id` | `features/admin/presets/preset-detail/preset-detail.component.ts:1` | A | populated(live-4): PRESET-01 -- APPLY THIS PRESET; 55 CAPS/2 DIFFER/7 WILL CHANGE | Preset detail: capability set grouped by area; apply action refreshes descriptor |
| ADM-EC-01 | EntityCompletenessAdminComponent | page | `/admin/entity-completeness` | `features/admin/entity-completeness/entity-completeness-admin.component.ts:1` | A | empty(live: "Entity Completeness Requirements"; Entity Type + Capability Code filters; NEW REQUIREMENT button) | CRUD over entity completeness requirement rows (drives completeness chip/badge) |
| ADM-EC-02 | EntityCapabilityRequirementDialogComponent | dialog | `/admin/entity-completeness` | `features/admin/entity-completeness/entity-capability-requirement-dialog/entity-capability-requirement-dialog.component.ts:1` | A | populated(live: 7 fields: Entity Type (Vendor default), Capability Code, Requirement Id, Predicate (JSON), Display Name Key, Missing Message Key, Sort Order; SAVE) | Create/edit entity capability requirement row |
| ADM-WC-01 | WorkingCalendarsComponent | page | `/admin/working-calendars` | `features/admin/working-calendars/working-calendars.component.ts:1` | A | empty(live: "No calendars yet") · inline-form(live: new-calendar form always visible even in empty state — Name, Time Zone (UTC default), WORKING DAYS checkboxes Sun-Mon-Tue-Wed-Thu-Fri-Sat, Active; SAVE; warning-1) · populated(TODO) | Working calendar + holidays admin; inline form (not dialog) |
| ADM-TAR-01 | TariffsComponent | page | `/admin/tariffs` | `features/admin/tariffs/tariffs.component.ts:1` | A | empty(live: "No tariff rates yet") · dialog-fields(NEW TARIFF: HTS Code, Country of Origin ISO-2, Rate %, Effective From, Effective To, Source; SAVE) | HTS-code tariff rate admin (bought-parts PR4; feeds landed-cost duty) |
| ADM-LS-01 | LeadSourcesComponent | page | `/admin/lead-sources` | `features/admin/lead-sources/lead-sources.component.ts:1` | A | empty(live: "No lead sources yet") · dialog-fields(NEW SOURCE: Name, Code, Description; SAVE — 3 fields only, no Type/Active/Quality Score in dialog) | Lead source catalog admin (Phase 1r/Batch 9) |
| ADM-ICR-01 | IcpRubricsComponent | page | `/admin/icp-rubrics` | `features/admin/icp-rubrics/icp-rubrics.component.ts:1` | A | empty(live: "No ICP rubrics yet") · dialog-fields(NEW RUBRIC: Name, Description, Active toggle, Default rubric toggle, DIMENSIONS section with ADD DIMENSION; SAVE) | ICP scoring rubric admin (Phase 1r/Batch 10) |
| ADM-ASR-01 | AssignmentRulesComponent | page | `/admin/assignment-rules` | `features/admin/assignment-rules/assignment-rules.component.ts:1` | A | empty(live: "No assignment rules yet") · dialog-fields(NEW RULE: Name, Kind (Round Robin default), Priority, Rep User IDs (rotation comma-separated), ADVANCED - RAW JSON section; SAVE) | Lead assignment rules (Phase 1r/Batch 11): round-robin/territory/industry |
| ADM-CUR-01 | CurrenciesComponent | page | `/admin/currencies` | `features/admin/currencies/currencies.component.ts:1` | A | empty(live: both CURRENCIES + EXCHANGE RATES sections empty; "No currencies configured yet"; NEW CURRENCY + SET RATE buttons) | Multi-currency catalog + FX rates |
| ADM-CUR-02 | CurrencyDialogComponent | dialog | `/admin/currencies` | `features/admin/currencies/currency-dialog.component.ts:1` | A | populated(live: 6 fields: ISO code, Symbol, Name, Decimal places, Sort order, Base currency (toggle); SAVE; warning-3) | Create/edit currency |
| ADM-CUR-03 | ExchangeRateDialogComponent | dialog | `/admin/currencies` | `features/admin/currencies/exchange-rate-dialog.component.ts:1` | A | TODO(ADM-Q-024: sweep captured currency dialog again; exchange-rate dialog fields not yet captured) | Create/edit exchange rate for a date |

### SETUP INTEGRATIONS

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| SI-01 | SetupIntegrationsComponent | page | `/setup/integrations` | `features/setup-integrations/setup-integrations.component.ts:1` | all-auth (authGuard); Admin is the intended user; server enforces auth | error(live: Admin reaches /setup/integrations → "Invalid or expired setup code. Please contact your administrator." — non-seeded env already has integrations configured, so no valid setup code exists) · first-run(D3-terminal: only observable in truly fresh installation before any integration configured; current env is non-first-run; unobservable in seeded/non-seeded env per D3) | Post-first-admin integration setup wizard; requires valid setup code; shows error in non-first-run envs |

---

### ACCOUNT AREA

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| ACC-00 | AccountLayoutComponent | page | `/account` (shell) | `features/account/account-layout.component.ts:1` | all-auth | populated(live: shell renders; sidebar + main area confirmed) | Account section shell with sidebar nav |
| ACC-SB-01 | AccountSidebarComponent | cluster | `/account/*` | `features/account/components/account-sidebar/account-sidebar.component.ts:1` | all-auth | populated(live: 11 nav items confirmed: Profile → /account/profile · Contact & Address → /account/contact · Emergency Contact → /account/emergency · Employee Onboarding → /onboarding (check_circle badge) · Tax & Compliance → expandable section (not direct route) · Documents → /account/documents · Pay Stubs → /account/pay-stubs · Tax Documents → /account/tax-documents · Security → /account/security · Customization → /account/customization · Integrations → /account/integrations · Communications → /account/communications) | Left sidebar nav; Tax & Compliance is expandable accordion, not a direct route |
| ACC-PROF-01 | AccountProfileComponent | page | `/account/profile` | `features/account/pages/profile/account-profile.component.ts:1` | all-auth | populated(live: avatar FA · email badge · role chip ADMIN; fields: First Name, Last Name, Initials, Date of Birth, Gender, Avatar Color; SAVE) | User profile: name, avatar, initials, DOB, gender, avatar color |
| ACC-CONT-01 | AccountContactComponent | page | `/account/contact` | `features/account/pages/contact/account-contact.component.ts:1` | all-auth | populated(live: 8 fields: Phone Number, Personal Email, Street Address, Street Address 2, City, State, ZIP/Postal Code, Country; SAVE) | Contact info: address, phone, personal email |
| ACC-EMER-01 | AccountEmergencyComponent | page | `/account/emergency` | `features/account/pages/emergency/account-emergency.component.ts:1` | all-auth | populated(live: 3 fields: Contact Name, Contact Phone, Relationship; SAVE) | Emergency contacts |
| ACC-TAX-01 | AccountTaxFormsComponent | page | `/account/tax-forms` | `features/account/pages/tax-forms/account-tax-forms.component.ts:1` | all-auth | empty(live: no forms listed for admin user — compliance templates not configured, so no forms appear) · populated(TODO: requires compliance templates configured + CAP-QC-COMPLIANCE-FORMS ON) | Tax form list (W-4, I-9, state withholding) — compliance forms index |
| ACC-TAX-02 | AccountTaxFormDetailComponent | page | `/account/tax-forms/:formType` | `features/account/pages/tax-form-detail/account-tax-form-detail.component.ts:1` | all-auth | TODO(requires forms in ACC-TAX-01) | Per-form detail: hosts ComplianceFormRendererComponent; dispatch model source-extracted in §Source-Extracted Detail |
| ACC-TAX-03 | ComplianceFormRendererComponent | panel | `/account/tax-forms/:formType` | `features/account/components/compliance-form-renderer/compliance-form-renderer.component.ts:1` | all-auth | TODO(requires forms in ACC-TAX-01; dispatch model + field types source-extracted in §Source-Extracted Detail) | Dynamic compliance form renderer (W-4/I-9/state/dynamic forms) |
| ACC-DOC-01 | AccountDocumentsComponent | page | `/account/documents` | `features/account/pages/documents/account-documents.component.ts:1` | all-auth | populated(live: renders; no empty-state visible — likely renders doc list even if empty in seeded env) | Employee document storage (company-issued docs) |
| ACC-PAY-01 | AccountPayStubsComponent | page | `/account/pay-stubs` | `features/account/pages/pay-stubs/account-pay-stubs.component.ts:1` | all-auth | empty(live: no pay stubs for admin user in non-seeded env) · populated(TODO) | Pay stub history list |
| ACC-PAY-02 | AccountTaxDocumentsComponent | page | `/account/tax-documents` | `features/account/pages/tax-documents/account-tax-documents.component.ts:1` | all-auth | empty(live: no tax documents for admin user in non-seeded env) · populated(TODO) | W-2 and other annual tax documents |
| ACC-SEC-01 | AccountSecurityComponent | page | `/account/security` | `features/account/pages/security/account-security.component.ts:1` | all-auth | populated(live: CHANGE PASSWORD section (Current Password, New Password, Confirm New Password; CHANGE PASSWORD button) · KIOSK PIN section (PIN, Confirm PIN; SET PIN button) · MFA section (ENABLE TWO-FACTOR AUTHENTICATION button; MFA disabled state for admin@forge.local)) | Security settings: password change, kiosk PIN, MFA setup |
| ACC-SEC-02 | MfaSetupDialogComponent | dialog | `/account/security` | `features/account/components/mfa-setup-dialog/mfa-setup-dialog.component.ts:1` | all-auth | partial(live-4): step 1 (scan-qr) confirmed live — QR code display · "Can't scan?" manual key toggle · 6-digit verification code input · CANCEL · VERIFY & ENABLE; full step sequence source-extracted in §Source-Extracted Detail; step complete + recovery queued ADM-Q-013 | MFA enrollment: QR code / TOTP setup flow |
| ACC-SEC-03 | MfaRecoveryCodesDialogComponent | dialog | `/account/security` | `features/account/components/mfa-recovery-codes-dialog/mfa-recovery-codes-dialog.component.ts:1` | all-auth | TODO | View/regenerate MFA recovery codes |
| ACC-CUST-01 | AccountCustomizationComponent | page | `/account/customization` | `features/account/pages/customization/account-customization.component.ts:1` | all-auth | populated(live: COLOR THEME (LIGHT/DARK buttons) · TEXT SIZE (DEFAULT 12px / COMFORTABLE 14px / LARGE 16px / EXTRA LARGE 18px) · Notification sound (volume_up toggle; DEFAULT/CHIME/BELL/POP choices) · Vibration (mobile toggle) · Desktop preview popups (toggle; frequency: 1 DAY/3 DAYS/1 WEEK/2 WEEKS/OFF) · Snooze duration (1 MIN/5 MIN/15 MIN/30 MIN/1 HR)) | UI customization: theme, text size, notification sound, desktop previews, snooze duration |
| ACC-ITGR-01 | AccountIntegrationsComponent | page | `/account/integrations` | `features/account/pages/integrations/account-integrations.component.ts:1` | all-auth | populated(live: 14 provider cards: Google Calendar · Microsoft Outlook/365 · Apple iCloud Calendar · CalDAV (Generic) · Slack · Microsoft Teams · Discord · Google Chat · Email Personal SMTP · Google Drive · Microsoft OneDrive · Dropbox · Apple iCloud Drive · GitHub; each with icon + name + description + CONNECT button) | Personal integration connections (calendar, chat, storage, issue tracking) |
| ACC-ITGR-02 | ConnectIntegrationDialogComponent | dialog | `/account/integrations` | `features/account/pages/integrations/connect-integration-dialog.component.ts:1` | all-auth | TODO | OAuth/API key connect flow for personal integration |
| ACC-COMM-01 | AccountCommunicationsComponent | page | `/account/communications` | `features/account/pages/communications/account-communications.component.ts:1` | all-auth | rendered(live: cap-gate-visible=false; renders without cap-gate wall; CONNECT action gated by CAP-EXT-EMAIL-SYNC=OFF — button present but no OAuth flow) · empty(source: app-empty-state icon="inbox") · populated(TODO) | Email/IMAP sync; renders even when CAP-EXT-EMAIL-SYNC=OFF; CONNECT gated at API level |
| ACC-COMM-02 | ConnectCommunicationDialogComponent | dialog | `/account/communications` | `features/account/pages/communications/connect-communication-dialog.component.ts:1` | all-auth | TODO | Picker: Google/Microsoft OAuth vs IMAP |
| ACC-COMM-03 | ConnectImapDialogComponent | dialog | `/account/communications` | `features/account/pages/communications/connect-imap-dialog.component.ts:1` | all-auth | TODO | IMAP server credentials form |
| ACC-COMM-04 | OauthCallbackComponent | page | `/account/communications/oauth-callback` | `features/account/pages/communications/oauth-callback.component.ts:1` | all-auth | rendered(live: navigates to /account/communications/oauth-callback without redirect; renders with sidebar; no error/success message visible without valid OAuth code; CAP-EXT-EMAIL-SYNC=OFF does not prevent component from rendering) | OAuth redirect-back handler; renders for all-auth regardless of cap state |
| ACC-DEAD-01 | AccountComponent | dead-code | — | `features/account/account.component.ts:22` | none/unreachable | — | Orphaned AccountComponent (selector `app-account`) — not referenced in `account.routes.ts`, zero `<app-account>` instantiations in any template; examined and excluded from live denominator per D6 |

---

### EMPLOYEES AREA

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| EMP-LIST-01 | EmployeeListComponent | page | `/employees` | `features/employees/pages/employee-list/employee-list.component.ts:1` | A,M | populated(live: 22 employees; INVITE EMPLOYEE button; Search/Role/Status filters; columns: NAME/ROLE/TEAM/TITLE/EMAIL/PHONE/STATUS/START DATE; per-row actions) | Employee roster list (filterable/sortable) |
| EMP-DET-01 | EmployeeDetailComponent | page | `/employees/:id/:tab` | `features/employees/pages/employee-detail/employee-detail.component.ts:1` | A,M | populated(live: 10 tabs confirmed: Overview · Time & Attendance · Pay · Training · Compliance · Jobs · Events · Expenses · Documents · Activity; employee header: avatar + name + role + status + email + KPI chips) | Employee detail shell; 10 sub-tabs |
| EMP-DET-02 | EmployeeOverviewTabComponent | tab | `/employees/:id/overview` | `features/employees/pages/employee-detail/tabs/employee-overview-tab.component.ts:1` | A,M | populated(live: EMPLOYMENT DETAILS + CONTACT INFORMATION + SYSTEM ACCESS sections; role, work location, status, email, PIN CONFIGURED) | Employee summary: employment details, contact info, system access |
| EMP-DET-03 | EmployeeActivityTabComponent | tab | `/employees/:id/activity` | `features/employees/pages/employee-detail/tabs/employee-activity-tab.component.ts:1` | A,M | populated(live: renders; activity data present for admin user) | Activity log for employee |
| EMP-DET-04 | EmployeeComplianceTabComponent | tab | `/employees/:id/compliance` | `features/employees/pages/employee-detail/tabs/employee-compliance-tab.component.ts:1` | A,M | populated(live: tab renders) | Compliance form status per employee (mirrors UserCompliancePanelComponent data) |
| EMP-DET-05 | EmployeeDocumentsTabComponent | tab | `/employees/:id/documents` | `features/employees/pages/employee-detail/tabs/employee-documents-tab.component.ts:1` | A,M | populated(live: renders; cloud_upload drop-zone visible; "Drag files here or click to browse, Max 25MB per file") | Documents on file for this employee; file upload drop-zone |
| EMP-DET-06 | EmployeeEventsTabComponent | tab | `/employees/:id/events` | `features/employees/pages/employee-detail/tabs/employee-events-tab.component.ts:1` | A,M | populated(live: tab renders) | Event history for employee |
| EMP-DET-07 | EmployeeExpensesTabComponent | tab | `/employees/:id/expenses` | `features/employees/pages/employee-detail/tabs/employee-expenses-tab.component.ts:1` | A,M | populated(live: tab renders) | Expense submissions by employee |
| EMP-DET-08 | EmployeeJobsTabComponent | tab | `/employees/:id/jobs` | `features/employees/pages/employee-detail/tabs/employee-jobs-tab.component.ts:1` | A,M | populated(live: tab renders) | Jobs assigned to employee |
| EMP-DET-09 | EmployeePayTabComponent | tab | `/employees/:id/pay` | `features/employees/pages/employee-detail/tabs/employee-pay-tab.component.ts:1` | A,M | populated(live: tab renders) | Pay rate / payroll info for employee |
| EMP-DET-10 | EmployeeTimeTabComponent | tab | `/employees/:id/time` | `features/employees/pages/employee-detail/tabs/employee-time-tab.component.ts:1` | A,M | populated(live: tab label "Time & Attendance" confirmed; time entries table renders with action buttons) | Time & Attendance entries for employee |
| EMP-DET-11 | EmployeeTrainingTabComponent | tab | `/employees/:id/training` | `features/employees/pages/employee-detail/tabs/employee-training-tab.component.ts:1` | A,M | populated(live: tab renders) | Training progress/assignments for employee |

---

### TRAINING / LMS AREA

| ID | component | type | route | file:line | renders-for | states | purpose |
|----|-----------|------|-------|-----------|-------------|--------|---------|
| TRN-01 | TrainingComponent | page | `/training/:tab` | `features/training/training.component.ts:1` | all-auth | empty(live: 3 tabs confirmed: MY LEARNING (school icon, slug=my-learning) · LEARNING PATHS (route icon, slug=learning-paths) · ALL MODULES (menu_book icon, slug=all-modules); my-learning: "No training paths assigned yet"; all-modules: search/Type/Learning Style filters + "No training modules"; learning-paths: "No learning paths available") · loading-only(live: /training/teams tab renders "LOADING..." only — ADM-Q-025 open) · populated(TODO) | LMS shell; 3 confirmed tabs (my-learning / learning-paths / all-modules); teams tab stalls at loading |
| TRN-MOD-01 | TrainingModuleComponent | page | `/training/module/:id` | `features/training/training-module/training-module.component.ts:1` | all-auth | TODO | Training module viewer (article/video/quiz/quickref/walkthrough content) |
| TRN-MOD-02 | TrainingModuleQuizComponent | panel | `/training/module/:id` | `features/training/training-module/training-module-quiz.component.ts:1` | all-auth | TODO | Quiz interaction within a training module |
| TRN-PATH-01 | TrainingPathComponent | page | `/training/path/:id` | `features/training/training-path/training-path.component.ts:1` | all-auth | empty-modules(source: icon="school" msg="No modules in this path yet") · not-found(source: icon="route" msg="Learning path not found") · populated(TODO) | Training path viewer: ordered module list with progress |

---

## Queue

_Items needing live confirmation or role-specific sweep — filed here by source-cataloger; dequeued when ui-scout confirms states._

**Source-filled so far (cycle 2):** 13 states moved from TODO → source-confirmed (ADM-USR-02 empty, ADM-TERM-01 empty, ADM-SET-03 empty, ADM-CMP-06 four empty variants, ADM-WC-01 empty, ACC-ITGR-01 empty, ACC-COMM-01 empty, TRN-01 empty, TRN-PATH-01 empty+not-found, ADM-AI-01 renders). Capability defaults filled for 11 relevant caps. Shared component usages fully mapped (Tree 3).

Remaining TODO states: ~81 items still need live sweep.

Priority items for ui-scout first pass:
1. `/admin/settings` — verify whether `AdminSettingsComponent` (ADM-SET-09) is embedded within the settings tab or an independent surface; states for all 5 sub-sections (company profile, locations, pay-period, system settings, logo/lockups)
2. `/admin/compliance` — sweep as OfficeManager to confirm OfficeManager-only view (only compliance tab visible)
3. `/admin/ai-assistants` — confirm panel behavior when CAP-EXT-AI-ASSISTANT is OFF (default) vs ON; D3 trigger state
4. `/admin/integrations` — list all integration cards visible (QBO + others); integration config dialog states; IntegrationConfigDialogComponent structure
5. `/admin/mfa` — MFA policy options (require/optional/disabled per role); confirm panel form fields
6. `ADM-TAX-04` StateWithholdingDialogComponent — which tab/context triggers this dialog (not found in any obvious parent template); may be inside UserCompliancePanelComponent
7. `/account/security` — MFA setup dialog states (step: QR code, step: verify code, step: recovery codes shown); confirm CAP-IDEN-AUTH-MFA=OFF behavior
8. `/account/tax-forms/:formType` — confirm W-4/I-9/state/dynamic all render via ComplianceFormRendererComponent; confirm formType slug values
9. `/employees` — confirm Manager sees same tab set as Admin; check for any tab visibility differences
10. Training LMS tab slugs: `training.routes.ts` has `:tab` catch-all → confirm actual slugs rendered at `/training/my-learning`, `/training/all-modules`, `/training/paths`, `/training/teams`
~~11. `AccountComponent` vs `AccountLayoutComponent` ambiguity~~ — **RESOLVED (source):** `AccountComponent` (`account.component.ts`, selector `app-account`) is dead code — not referenced in `account.routes.ts` (which loads `AccountLayoutComponent` as the sole shell at line 3,8), and zero `<app-account>` usages in any HTML template. Profile + password forms that were in `AccountComponent` are now split across `AccountProfileComponent` (`/account/profile`) and `AccountSecurityComponent` (`/account/security`). No inventory row needed; terminal.
~~12. `app-barcode-info` — classification~~ — **RESOLVED (source):** `app-barcode-info` (`shared/components/barcode-info/barcode-info.component.ts`) is a cross-region shared utility. platform.md CLOSED explicitly rejected SH# assignment (all consumers are non-platform). Catalogued in admin.md as `shared-cmp` type at ADM-USR-07 (file:line confirmed: `admin.component.html:741`). No SH number. Cross-links section updated; denominator unchanged at 94 (row ADM-USR-07 accounts for it within admin scope). Live confirmation of render in users dialog remains TODO per ADM-USR-07.

---

_Cycle 2 commit: D2 shared cross-links complete (Tree 3 fully mapped, 18 SH usages located); capability defaults source-filled for 11 gates; 13 states moved TODO→source-confirmed; denominator stable=94; remaining TODO=~81; queue=12 items_

_Cycle 3 (source-only): Queue items #11 + #12 resolved from source. AccountComponent confirmed dead code (not routed, zero instantiations in any template). app-barcode-info = cross-region shared utility; no SH#; catalogued as shared-cmp at ADM-USR-07; platform.md CLOSED rejected SH-24. Duplicate ADM-USR-09 (copy of ADM-TT-04) removed. Queue depth → 10 (items 1–10 remain, all live-dependent). Denominator anomaly flagged: Account file-count includes dead AccountComponent (22 files, 21 live) → proposed 94→93._

_Cycle 4 (source verification): Fresh source-tree walk confirms denominator=93 is correct — 55 admin + 21 account (22 files −1 D6 dead code) + 12 employees + 4 training + 1 setup-integrations. All 93 live .component.ts files verified against component table; every file maps to a catalogued row. Key confirmations: (a) SH-24 app-barcode-info resolved — admin.component.html:741 confirmed as one of 7 cross-region consumers; catalogued at ADM-USR-07, no SH# assigned; (b) Gate structures from source confirmed: app.routes.ts:276 (admin roleGuard Admin/Manager/OfficeManager), :133 (employees Admin/Manager), :232 (account authGuard), :242 (training authGuard), :36 (setup/integrations authGuard+server-enforced Admin); (c) ADMIN_ONLY_TABS / MANAGER_AND_ADMIN_TABS constants at admin.component.ts:97-99 confirmed as gate source for all tab-level renders-for entries. Reconciliation Tree 3 (shared usages) remains fully mapped from Cycle 2. All 63 routes in Tree 1 still await live-sweep tick; 21 queue items in admin-queue.md remain open. No new components discovered — denominator stable. Next: ui-scout live sweep to drain TODO states and queue items._

_Cycle 5 (source pre-extraction): Field lists, step sequences, and branch structures sourced for 5 priority dialogs/forms — see §Source-Extracted Detail below. States all remain TODO / source-only until ui-scout live confirmation. ADM-TAX-04 trigger location resolved from source: fired from ComplianceTemplatesPanelComponent (compliance-templates-panel.component.html:65 + ts:87,102). Queue items ADM-Q-001 (IntegrationConfigDialog), ADM-Q-021 (StateWithholdingDialog trigger), ADM-Q-011 (discovery branches) substantially pre-answered from source._

_Cycle 6 (live sweep folded): ui-scout cycle-1 JSON (97 records) folded. ~65 rows moved from TODO → live-confirmed states. 2 additional D6 dead-code rows confirmed (ADM-SET-09 + ADM-SET-10 — zero usages across entire app); denominator 93→91. Key discoveries: (1) ADM-SET-09 dead (selector never renders); (2) EMP-DET-10 tab label = "Time & Attendance"; (3) TRN-01 confirmed 3 tabs (my-learning/learning-paths/all-modules) + teams=loading-only; (4) ACC-ITGR-01 populated with 14 providers; (5) ACC-SB-01 sidebar full nav confirmed (11 items; Tax & Compliance = expandable section, not route); (6) ACC-COMM-01 renders without cap-gate wall; (7) ADM-SET-01..08 all confirmed; (8) ADM-CMP-03 11 fields confirmed; (9) ADM-DISC-01 16 steps confirmed; (10) ADM-CAP-01 62/151 enabled confirmed; (11) ADM-WC-01 inline form confirmed (not dialog); (12) ADM-MFA-02 Required-for-Roles + USER COMPLIANCE confirmed. Bug ADM-Q-012 confirmed live: both Manager AND OfficeManager reach /admin/users without redirect. ADM-Q-022 trigger resolved from source. ADM-Q-017 trigger resolved from source. Queue: 8 items closed, 4 new items added (ADM-Q-023..026), 1 split (ADM-Q-009→024)._

---

## Source-Extracted Detail

_All entries below are SOURCE-ONLY. States remain TODO until ui-scout confirms live behavior. These are draft sub-entries to speed up the live-sweep pass — each will be ticked or corrected when ui-scout reports._

---

### ADM-INT-03 — IntegrationConfigDialogComponent field structure

**Source:** `integration-config-dialog.component.ts:87-98` · `integration-config-dialog.component.html:29-58` · `forge.core/Settings/IntegrationDescriptorCatalog.cs`

Dialog is **descriptor-driven**: fields are `IntegrationSettingField[]` from the API, not hardcoded in the template.

**Field input types** (source: `integration-status.model.ts:12`):

| inputType | rendered as | notes |
|---|---|---|
| `toggle` | `app-toggle` | boolean; value stored as `"true"/"false"` string |
| `enum` | `app-select` with choices | choices array from `IntegrationSettingChoice[]` |
| `password` | `app-input type=password` | isSensitive=true → placeholder "Enter a new value..." |
| `text` / `url` / `email` | `app-input` with matching type | — |
| `number` | `app-input type=number` | — |

**Common field: mode** — present on every provider as an enum (`Mock / Real`; some add `Sandbox`). Controls IStorageService registration at process start — change requires API restart (source: `integration-config-dialog.component.ts:139-153`).

**20 configured providers** (source: `IntegrationDescriptorCatalog.cs`):

| provider | name | category | key fields (from FieldKeys) | OAuth-connectable |
|---|---|---|---|---|
| `gmail-oauth` | Gmail / Google Workspace | communications | redirect-uri, google-client-id\*, google-client-secret | — |
| `microsoft-oauth` | Outlook / Microsoft 365 | communications | redirect-uri, microsoft-client-id\*, microsoft-client-secret | — |
| `twilio` | Twilio Voice | communications | mode(enum), account-sid, auth-token\*, require-signature(toggle) | — |
| `smtp` | SMTP Email | service | mode(enum), host\*, port, use-ssl(toggle), username, password, from-address, from-name | — |
| `minio` | MinIO Storage | service | mode(enum), endpoint\*, public-endpoint, access-key, secret-key, bucket, use-ssl(toggle) | — |
| `gdrive` | Google Drive | service | mode(enum), client-id\*, client-secret, scopes | — |
| `usps` | USPS Address Validation | service | mode(enum), consumer-key\*, consumer-secret | — |
| `docuseal` | DocuSeal Document Signing | service | mode(enum), api-url, public-base-url, api-key\*, webhook-secret, timeout-seconds | — |
| `ai` | AI Assistant (Ollama) | service | mode(enum), base-url\*, chat-model, embedding-model, vision-model, timeout-seconds, vision-timeout-seconds, docs-path | — |
| `ups` | UPS | shipping | mode(enum), client-id\*, client-secret, account-number | — |
| `fedex` | FedEx | shipping | mode(enum), client-id\*, client-secret, account-number | — |
| `dhl` | DHL Express | shipping | mode(enum), api-key\*, account-number | — |
| `stamps` | Stamps.com | shipping | mode(enum), username, password, integration-id\* | — |
| `quickbooks` | QuickBooks Online | accounting | mode(enum), client-id\*, client-secret | ✓ |
| `xero` | Xero | accounting | mode(enum), client-id\*, client-secret, tenant-id | ✓ |
| `freshbooks` | FreshBooks | accounting | mode(enum), client-id\*, client-secret, account-id | ✓ |
| `sage` | Sage Business Cloud | accounting | mode(enum), client-id\*, client-secret, country-code | ✓ |
| `netsuite` | NetSuite | accounting | mode(enum), account-id\*, consumer-key, consumer-secret, token-id, token-secret | — |
| `wave` | Wave | accounting | mode(enum), access-token\*, business-id | — |
| `zoho` | Zoho Books | accounting | mode(enum), client-id\*, client-secret, organization-id, data-center | ✓ |

_\* = `IsConfiguredCheckKey` — the field whose presence marks this provider as "configured"_

**Dialog chrome** (source: `integration-config-dialog.component.html:1-95`):
- Title: "Configure {integration.name}"
- Optional collapsible **Sandbox Guide** panel (only when `showSandboxGuides=true` AND provider has `sandboxSteps`): step list + link to developer portal
- Dynamic field list (template-driven by descriptor)
- Test result banner (success/error) below fields
- Footer: **Test** button (all providers) · **Connect** button (OAuth providers only, visible when `canConnectOAuth=true`) · Cancel · Save

**OAuth connect flow**: CONNECT button hits `/api/v1/{provider}/authorize` → full-page redirect to provider consent screen → provider callback lands at `/api/v1/{provider}/callback` → bounces to `/admin?tab=integrations&provider=connected` (source: `integration-config-dialog.component.ts:172-192`).

_States: populated(source-confirmed field structure) · empty(no-fields edge: if fields.length===0, dialog shows only Close button) · test-result-success(source: success banner) · test-result-error(source: error banner) · connecting-spinner(source: OAuth flow) — all LIVE CONFIRMATION TODO_

---

### ADM-TAX-04 — StateWithholdingDialogComponent

**Source:** `state-withholding-dialog.component.ts:1-127` · `state-withholding-dialog.component.html:1-110` · trigger: `compliance-templates-panel.component.ts:87,102-104` + `compliance-templates-panel.component.html:65`

**Trigger location RESOLVED** (ADM-Q-021 closed from source): Opened from **ComplianceTemplatesPanelComponent** (`/admin/compliance` tab), not from sales-tax. Two trigger paths:
1. Button click: `compliance-templates-panel.component.html:65` — icon button beside the state withholding section header
2. Auto-open: `compliance-templates-panel.component.ts:87` — opens on init when state data is present

**Purpose:** Admin selects the company's home state for payroll withholding; sets `company_state` system setting. Read-only state catalog view (admin picks, doesn't edit).

**Content structure** (source: `state-withholding-dialog.component.html`):

| Section | filter condition | state-card shows |
|---|---|---|
| Summary header | — | 4 stat chips: ready / needs-upload / uses-W4 / no-tax counts |
| "Ready for e-Sign" | `category=state_form` AND `docuSealTemplateId ≠ null` | code · name · formName · `verified` chip |
| "Needs PDF Upload" | `category=state_form` AND `docuSealTemplateId = null` | code · name · formName · `upload_file` chip |
| "Accepts Federal W-4" | `category=federal` | code · name · `description` chip |
| "No Income Tax" | `category=no_tax` | code · name · `block` chip |

Each state card is a `<button>` that fires `selectState(state.code)` → `adminService.setCompanyState()` → closes dialog on success. Active state card styled with `.state-card--active` class.

_States: loading(source: appLoadingBlock directive) · populated(source-confirmed structure above) · saving(source: button [disabled]="saving()") — LIVE CONFIRMATION TODO_

---

### ACC-SEC-02 — MfaSetupDialogComponent step sequence

**Source:** `mfa-setup-dialog.component.ts:25-89` · `mfa-setup-dialog.component.html:1-91`

**Step signal:** `step = signal<'loading' | 'scan' | 'verify' | 'complete'>('loading')`

_Note: `verify` is a declared union type but `this.step.set('verify')` is never called in the component — it's effectively unused. The actual flow is `loading → scan → [API call] → complete` (or stays on `scan` with error message on bad code)._

| step | what renders | actions |
|---|---|---|
| `loading` | spinner + "Preparing authenticator setup…" | none (auto-advances on API response) |
| `scan` | QR code (`app-qr-code`, 200px, M error correction) · manual key toggle (show/hide + copy button) · 6-digit code input field (`app-input`, maxlength=6, pattern `/^\d{6}$/`) · error message div (if verifyError signal set) | Cancel · **Verify & Enable** (disabled when code invalid or verifying) |
| `complete` | `verified_user` icon · "Two-Factor Authentication Enabled" heading · "You'll need your authenticator app each time you sign in." · recovery-codes hint with `info` icon | **Done** (closes dialog, returns `true` to caller) |

**Error path on `scan` step:** invalid code → `verifyError.set('Invalid code. Please try again.')` + `codeControl.reset()` — stays on `scan` step.

**Dialog close behavior:** `dialogRef.close(this.step() === 'complete')` — returns `true` only if enrollment completed; `false` on cancel/error. Caller (`AccountSecurityComponent`) uses the result to refresh MFA status.

_States: loading(source-confirmed spinner) · scan-qr(source-confirmed structure) · scan-verify-error(source-confirmed error path) · complete(source-confirmed) — LIVE CONFIRMATION TODO_

---

### ACC-TAX-03 — ComplianceFormRendererComponent dispatch model

**Source:** `compliance-form-renderer.component.ts:1-301` · `compliance-form-definition.model.ts:1-128`

**Dispatch architecture:** `AccountTaxFormDetailComponent` loads a `ComplianceFormDefinition` from the API (keyed by `formType` slug) and passes it to `<app-compliance-form-renderer [definition]="def">`. The renderer is form-type-agnostic — all layout and fields come from the definition JSON.

**ComplianceFormDefinition structure:**
- `formType` — slug used to fetch (e.g., `'w4'`, `'i9'`, `'state'`, `'dynamic'`)
- `formLayout` — `'default'` (Material wrappers) | `'government'` (IRS-style native rendering, pixel-matched to PDF)
- `pages[]` — multi-page forms (each page → one tab/nav step)
- `sections[]` — flat legacy (wrapped into single page)
- `maxWidth` — optional centering (W-4 uses `"850px"`)
- `formStyles` — CSS custom-property overrides from PDF extraction metrics

**Field types** (source: `FormFieldDefinition.type`):
`text | textarea | number | currency | ssn | date | select | radio | checkbox | signature | heading | paragraph | html`

**Government-layout field roles** (`fieldLayout`):
`amount-line | amount-line-inner | amount-line-total | grid-cell | checkbox-dots | signature-field | signature-date | filing-status | worksheet-line`

**Section layout types** (government forms):
`default | section | form-header | step | step-amounts | tip | exempt | sign | employers-only | form-footer | worksheet | instructions`

**Conditional fields:** `dependsOn: { field, value, operator: 'eq'|'neq'|'truthy' }` — `shouldShowField()` evaluated on every render.

**Special behaviors:**
- SSN fields: auto-formatted `XXX-XX-XXXX` via `formatSsn()` handler
- `signature-date` fields: auto-set to today's date if `initialData` doesn't provide one
- Multi-page: single FormGroup spans all pages (source: `compliance-form-renderer.component.ts:158`) — validation runs across all pages simultaneously
- Submit only available on last page (`isLastPage` computed)

**Known form types confirmed from backend/templates** (source: compliance-templates-panel + account-tax-form-detail route):
- `w4` — Federal W-4 (IRS 2024 revision), `government` layout, multi-step (5 steps + worksheet)
- `i9` — I-9 Employment Eligibility, `government` layout, multi-page (Section 1 employee / Section 2 employer)
- State forms — per-state; some `government` layout (CA DE 4, NY IT-2104); formType slug = state code or form number
- Dynamic forms — admin-created via ComplianceTemplatesPanelComponent; typically `default` layout

_States: populated-default-layout(source-confirmed Material rendering) · populated-government-layout(source-confirmed IRS-style rendering) · readonly-mode(source: `readonly` input) · multi-page-nav(source: `pages.length > 1`) · single-page(source: sections-only fallback) — LIVE CONFIRMATION TODO_

---

### ADM-DISC-01 — Discovery wizard question catalog & branch map

**Source:** `DiscoveryQuestionCatalog.cs:1-586` · `discovery.service.ts:50-131` · `discovery-question.model.ts`

**Total catalog:** 28 self-serve + 12 consultant-deepdive = 40 questions

**Per-user flow (self-serve, products path):** Q-S1 + 6 opening + 4 branch (one of A/B/C) + 2 override + 6 diagnostic + 1 exit = ~20 questions answered. User sees only their branch's 4 questions.

**Q-S1 — Top-of-funnel (SingleChoice):** "What does your business primarily sell?"
- `products` → full 22-question manufacturing flow
- `services` → short-circuit to PRESET-08 (Pro Services)
- `both` → short-circuit to PRESET-09 (Hybrid)

**Opening questions Q-O1..Q-O6:**

| ID | type | question (abbreviated) | choices / notes |
|---|---|---|---|
| Q-O1 | Bucketed | "Roughly how many people work in your business?" | 1-2 · 3-10 · 11-25 · 26-50 · 51-200 · 200+ |
| Q-O2 | FreeText | "Walk me through quote-to-cash…" | optional textarea |
| Q-O3 | MultiChoice | "What does your business actually do?" | services · make · resell |
| Q-O4 | MultiChoice | "Are you in a regulated industry?" | no · medical · aerospace · automotive · food · pharma · other |
| Q-O5 | SingleChoice | "How many physical locations?" | 1 · 2 · 3+ |
| Q-O6 | FreeText | "If an auditor walked in tomorrow…" | optional textarea |

**Branch routing** (source: `discovery.service.ts:50-88`):

| headcount answer | sites answer | → branch |
|---|---|---|
| 1-2, 3-10, 11-25 | any | A (small) |
| 26-50, 51-200 | 1 | B (mid) |
| 26-50, 51-200 | 2 or 3+ | C (large/multi-site) |
| 200+ | any | C (large) |

**Branch A questions (Q-A1..Q-A4):**

| ID | type | question (abbreviated) | choices |
|---|---|---|---|
| Q-A1 | SingleChoice | "Do you currently use accounting software?" | none · quickbooks · xero · other |
| Q-A2 | SingleChoice | "Is anyone full-time on production scheduling?" | same-person · split-roles · dedicated |
| Q-A3 | SingleChoice | "Single machine or multi-step?" | single-step · two-three · multi-step |
| Q-A4 | SingleChoice | "Shipped from warehouse or drop-ship?" — _SKIPPED if mode='production'_ | warehouse · some-dropship · mostly-dropship |

**Branch B questions (Q-B1..Q-B4):**

| ID | type | question (abbreviated) | choices |
|---|---|---|---|
| Q-B1 | SingleChoice | "Do you compare actual vs quoted job cost?" | no · informal · formal |
| Q-B2 | SingleChoice | "Formal inspection / NCR?" | visual · informal · formal-ncr · capa-loop |
| Q-B3 | YesNo | "PO approval step for large amounts?" | yes · no |
| Q-B4 | YesNo | "Send out to subcontract (heat treat, plating)?" | yes · no |

**Branch C questions (Q-C1..Q-C4):**

| ID | type | question (abbreviated) | choices |
|---|---|---|---|
| Q-C1 | SingleChoice | "How often do you move inventory between locations?" | daily · weekly · monthly · rarely |
| Q-C2 | SingleChoice | "Fixed or configurable products?" | fixed · some-config · cto-eto |
| Q-C3 | YesNo | "Customers require EDI (850/855/856/810)?" | yes · no |
| Q-C4 | YesNo | "Multi-currency operations?" | yes · no |

**Override questions Q-V1, Q-V2 (always shown):**

| ID | type | question (abbreviated) |
|---|---|---|
| Q-V1 | FreeText | "Worst thing a regulator/customer could ask you to prove?" |
| Q-V2 | FreeText | "Anything unusual about how your business runs?" |

**Diagnostic questions Q-D1..Q-D6 (always shown):**

| ID | type | question (abbreviated) | choices |
|---|---|---|---|
| Q-D1 | MultiChoice | "How do you track parts for traceability?" | lots · serials |
| Q-D2 | YesNo | "Handle hazardous materials?" | yes · no |
| Q-D3 | SingleChoice | "Preventive maintenance schedule?" | breakfix · informal-pm · formal · iot |
| Q-D4 | MultiChoice | "Shop-floor access patterns?" | kiosk · shifts |
| Q-D5 | MultiChoice | "IT/integration capability?" | none · bi · chat · api |
| Q-D6 | SingleChoice | "Repeat vs custom production?" | repeat · mix · custom |

**Exit Q-X1 (always available):**
- YesNo: "None of these match — skip discovery and configure manually." Also triggered by "Skip discovery" link and `exitToCustom()` button throughout wizard.

**Recommendation step** (step index = `visibleQuestions().length`):
- Displays: preset name, description, confidence label (high/medium/low), rationale, driving factors (expandable), capability deltas list (enable/disable), alternatives picker
- Actions: Back · Apply (opens PresetApplyDialogComponent for review+confirm)
- Live recommendation sidebar updates after Q-O1+Q-O3 answered (`canPreview` signal)

**Consultant mode** (toggled by button in progress bar):
- Adds 12 deepdive questions (4 per branch: Q-A5..Q-A8, Q-B5..Q-B8, Q-C5..Q-C8)
- All YesNo or SingleChoice; each targets a specific capability gap signal

_States: loading(source: appLoadingBlock) · question-bucketed/single-choice/yesno/multichoice/freetext (source-confirmed per type) · recommendation(source-confirmed structure) · empty-recommendation(source: "Answer the opening questions" sidebar) — LIVE CONFIRMATION TODO_

---

---

### ADM-RTPL-02 — RoleTemplatesPanelComponent NEW/EDIT TEMPLATE dialog

**Source:** `role-templates-panel.component.ts:63-66`

| field | type | validators | default | notes |
|---|---|---|---|---|
| `name` | text | required, max100 | '' | — |
| `description` | textarea | max500 | '' | Optional |
| `includedRoleNames` | multi-select | required | [] | Base roles to bundle; options from `roleOptions` signal |

Title/button: "New Role Template"/"Create Template" vs "Edit Role Template"/"Save Changes".

_States: new-dialog(source-confirmed) · edit-dialog(pre-filled) — LIVE TODO_

---

### ADM-ANN-02 — AnnouncementsPanelComponent — NEW ANNOUNCEMENT + NEW TEMPLATE dialogs

**Source (NEW ANNOUNCEMENT):** `features/chat/components/create-announcement-dialog/create-announcement-dialog.component.ts:51-60` — chat-owned, invoked by `announcements-panel.component.ts:155`.

| field | type | validators | default | notes |
|---|---|---|---|---|
| `templateId` | select (opt) | — | null | Pre-fills content/severity/scope/ack from template |
| `title` | text | required, max200 | '' | — |
| `content` | textarea | required, max5000 | '' | — |
| `severity` | select | required | `Info` | Info · Warning · Critical |
| `scope` | select | required | `CompanyWide` | CompanyWide · SelectedTeams · IndividualTeam · TeamLeadsOnly |
| `requiresAcknowledgment` | toggle | — | false | — |
| `expiresAt` | datepicker | — | null | Optional expiry |
| `targetTeamIds` | multi-select | — | [] | Visible only when scope = SelectedTeams or IndividualTeam |

**Source (NEW TEMPLATE):** `announcements-panel.component.ts:95-100`

| field | type | validators | default | notes |
|---|---|---|---|---|
| `name` | text | required, max200 | '' | — |
| `content` | textarea | required, max5000 | '' | — |
| `defaultSeverity` | select | required | `Info` | Info · Warning · Critical |
| `defaultScope` | select | required | `CompanyWide` | CompanyWide · SelectedTeams · IndividualTeam · TeamLeadsOnly |
| `defaultRequiresAcknowledgment` | toggle | — | false | — |

_States: new-announcement-dialog(source-confirmed) · new-template-dialog(source-confirmed) — LIVE TODO_

---

### ADM-LS-01 — LeadSourcesComponent NEW/EDIT dialog

**Source:** `lead-sources.component.ts:74-78`

| field | type | validators | default | notes |
|---|---|---|---|---|
| `name` | text | required, max100 | '' | — |
| `code` | text | required, max50, `^[a-z0-9_-]+$` | '' | **Disabled on edit** — immutable after create |
| `description` | textarea | max500 | '' | — |
| `isActive` | toggle | — | true | **Edit-only** — hidden on create |

_States: new-dialog(source-confirmed) · edit-dialog(code disabled, isActive visible) — LIVE TODO_

---

### ADM-EDI-02 — EdiPanelComponent NEW/EDIT PARTNER dialog

**Source:** `edi-panel.component.ts:115-124` · `edi-panel.component.html:94-121`

| field | type | validators | default | notes |
|---|---|---|---|---|
| `name` | text | required, max200 | '' | — |
| `qualifierId` | text | required, max10 | `'ZZ'` | EDI ISA qualifier ID |
| `qualifierValue` | text | required, max100 | '' | ISA qualifier value |
| `defaultFormat` | select | — | `X12` | X12 · Edifact |
| `transportMethod` | select | — | `Manual` | As2 · Sftp · Van · Email · Api · Manual |
| `autoProcess` | toggle | — | true | Auto-process inbound |
| `requireAcknowledgment` | toggle | — | true | Require 997/CONTRL ACK |
| `notes` | textarea | — | '' | — |

_States: new-dialog(source-confirmed) · edit-dialog(pre-filled) — LIVE TODO_

---

### ADM-ICR-01 — IcpRubricsComponent NEW/EDIT RUBRIC dialog

**Source:** `icp-rubrics.component.ts:74-80,129-137`

**Top-level:** name(req/max100), description(max500), isActive(toggle/true), isDefault(toggle/false).

**Dimensions FormArray** (inline add/remove via `addDimension()` / `removeDimension(index)`):

| field | type | validators | notes |
|---|---|---|---|
| `fieldKey` | text | required, max80 | Internal key |
| `label` | text | max120 | Display label |
| `matchSpec` | textarea | max500 | Matching criteria |
| `weight` | number | required | Score weight |

_States: new-dialog(source-confirmed) · edit-dialog(pre-filled + existing dimensions) — LIVE TODO_

---

### ADM-CUR-02 / ADM-CUR-03 — CurrencyDialogComponent + ExchangeRateDialogComponent

**Source (Currency):** `currency-dialog.component.ts:33-41` — code(req/`^[A-Z]{3}$`), name(req/max80), symbol(req/max8), decimalPlaces(req/0-8/default 2), isBaseCurrency(toggle), isActive(toggle/**edit-only**), sortOrder(req/default 100).

**Source (ExchangeRate):** `exchange-rate-dialog.component.ts:36-41` — fromCurrencyId(req/select), toCurrencyId(req/select), rate(req/min 0.0000001/4dp), effectiveDate(req/today). Custom validator (ts:55): rejects same-pair.

_States (Currency): new-dialog · edit-dialog(isActive shown) — LIVE TODO_
_States (ExchangeRate): dialog(source-confirmed; same-pair error) — LIVE TODO_

---

### ADM-TRN-04 — TrainingPathDialogComponent

**Source:** `training-path-dialog.component.ts:43-52,65-69` — title(req/max200), slug(auto-gen from title), description(max500), icon(max50/`'school'`), isAutoAssigned(toggle/false), isActive(toggle/true). Draft auto-save: `entityType='training-path'`.

_States: new-dialog(source-confirmed) · edit-dialog(pre-filled) — LIVE TODO_

---

### ADM-TRN-08 / ADM-TRN-09 — TrainingDetailPanelComponent + TrainingDetailDialogComponent

**Source:** `training-detail-panel.component.ts:25-36,47-69` · `training-detail-dialog.component.ts:16-19`

Both **READ-ONLY** — no form controls. `TrainingDetailDialogComponent` is a thin wrapper passing `userId` to `<app-training-detail-panel>`. Panel fetches `UserTrainingDetail` via `TrainingService`, renders completion status icons/classes, emits `closed`. Trigger: row expand/click in `/admin/training` CONTENT tab. ADM-Q-022 RESOLVED from source.

_States: loading(inferred) · populated(source: status icons) · empty(live TODO)_

---

_Cycle 7 (source extraction): 9 queue items resolved — ADM-Q-002/003/004/005/006/008/009/010/022. Fields pre-extracted for: RoleTemplatesDialog, LeadSourcesDialog, CreateAnnouncementDialog (chat-owned, invoked by announcements-panel), AnnouncementTemplateDialog, EdiPartnerDialog, IcpRubricsDialog (dimensions FormArray), CurrencyDialog, ExchangeRateDialog (same-pair validator), TrainingPathDialog. TrainingDetailPanel+Dialog confirmed read-only. 9 items dequeued in admin-queue.md. Live-dependent remaining: ADM-Q-007/013/014/015/016/017/018/019/020 (9 items)._


_Cycle 6 (ui-scout live sweep): 61/66 routes live-confirmed across 4 sweep batches (admin-a/b/c/d-results.json). 5 routes remain open — see `admin-queue.md` ADM-Q-007/Q-011/Q-014/Q-015/Q-016/Q-018/Q-019/Q-020. Bug confirmed live: Manager lands on /admin/users without redirect (ADM-Q-012; source at admin.component.ts:97-99). New discovery: /account/tax-forms/:formType routes all redirect to /onboarding (7-step wizard); onboarding step 1 confirmed (First Name · Middle Name · Last Name · Other Last Names · DOB · SSN · Email · Phone). Cap gates confirmed live: CAP-EXT-EMAIL-SYNC OFF · CAP-EXT-VOIP-SYNC OFF · CAP-EXT-AI-ASSISTANT OFF (API error mode; dialog still opens). Key states updated in this cycle: ADM-SH-01 (tab shell + Manager view) · ADM-USR-03 (create/edit dialog fields) · ADM-TRN-03 (module dialog) · ADM-AI-03 (assistant dialog) · ADM-BI-02 (ISSUE KEY dialog) · ADM-TC-02 (correction edit dialog) · ADM-EVT-02 (new event dialog) · ADM-CMP-03 (compliance template dialog) · ADM-DISC-01 (Q-S1 live) · ADM-PRE-02 (zero-selected state) · ACC-SEC-02 (MFA setup step 1) · SI-01 (confirmed redirect). ~69 TODO states remain in component table (account/employees/training/other admin panels) — queued for next live-sweep cycle._

_Cycle 8 (source-cataloger): Tree 1 ticks — /admin/capabilities/:id (ADM-Q-007 confirmed cycle 5) + /account/communications/oauth-callback (ADM-Q-015 confirmed live by ui-scout). SI-01 first-run state closed D3-terminal. ADM-Q-015 dequeued (D3-terminal classification withdrawn — component renders regardless of CAP-EXT-EMAIL-SYNC). Source-flip: ADM-TRN-04 (TrainingPathDialog fields sourced), ADM-TAX-04 (StateWithholdingDialog 4-category structure sourced), ADM-BI-01 (tab shell renders confirmed). 3 Tree 1 items remain open: /account/tax-forms/:formType · /training/module/:id · /training/path/:id._
