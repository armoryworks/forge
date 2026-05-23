# Admin & Account Region — Surface Queue

_Sole writer: ui-scout · Cycle 4 · 2026-05-22_
_Items requiring further live sweep, source resolution, or role-specific confirmation. Dequeue by updating admin.md states and striking the row._

---

| ID | priority | type | component / route | blocker | notes |
|----|----------|------|-------------------|---------|-------|
| ADM-Q-001 | HIGH | dialog-fields | `IntegrationConfigDialogComponent` · ADM-INT-03 | dialog not captured — CONFIGURE button on integrations tab led to truncated content before dialog body | fields unknown; likely per-integration (API key, OAuth, endpoint URL fields); check `integration-config-dialog.component.html` |
| ADM-Q-002 | MED | dialog-fields | `RoleTemplatesPanelComponent` NEW TEMPLATE dialog · ADM-RTPL-02 | dialog not captured — text truncated at role templates list | check source `role-templates-panel.component.html` for NEW TEMPLATE dialog fields |
| ADM-Q-003 | MED | dialog-fields | `LeadSourcesComponent` NEW SOURCE dialog · ADM-LS-01 | dialog not captured — only list body rendered | fields: Name, Description, Type, Active, Quality Score config; check `lead-sources.component.html` |
| ADM-Q-004 | LOW | dialog-fields | `AnnouncementsPanelComponent` NEW ANNOUNCEMENT dialog · ADM-ANN-02 | button text matched but no dialog body captured | check `announcements-panel.component.html` for NEW ANNOUNCEMENT dialog fields (title, content, target audience?) |
| ADM-Q-005 | LOW | dialog-fields | `AnnouncementsPanelComponent` TEMPLATES sub-tab NEW TEMPLATE dialog · ADM-ANN-02 | TEMPLATES tab confirmed (0 templates) but dialog not opened | check announcements-panel for template creation fields |
| ADM-Q-006 | LOW | dialog-fields | `EdiPanelComponent` NEW PARTNER dialog · ADM-EDI-02 | TRADING PARTNERS tab confirmed (0 partners) but dialog not opened | fields likely include: Partner ID, Qualifier, ISA IDs, Direction, Format (X12/EDIFACT), transaction set codes; check `edi-panel.component.html` |
| ADM-Q-007 | HIGH | page | `CapabilityDetailComponent` · ADM-CAP-02 · `/admin/capabilities/:id` | session expired in prior sweep batch; endpoint redirected to /login | navigate to /admin/capabilities, click any capability (e.g. CAP-ACCT-BUILTIN), capture full page (title, settings, dependencies, apply/revert UI) |
| ADM-Q-008 | MED | dialog-fields | `IcpRubricsComponent` NEW RUBRIC dialog · ADM-ICR-01 | only empty-state body captured; dialog not opened | fields likely include: Name, Description, Dimensions (scored fields), Weight per dimension, Active; check `icp-rubrics.component.html` |
| ADM-Q-009 | MED | dialog-fields | `CurrencyDialogComponent` + `ExchangeRateDialogComponent` · ADM-CUR-02/03 | only empty-state body captured; neither dialog opened | NEW CURRENCY dialog: Code, Name, Symbol, Decimal Places, Active; SET RATE dialog: Currency Pair, Date, Rate; check `currency-dialog.component.ts` + `exchange-rate-dialog.component.ts` |
| ADM-Q-010 | MED | dialog-fields | `TrainingPathDialogComponent` NEW PATH dialog · ADM-TRN-04 | PATHS tab confirmed (0 paths) but dialog not opened | fields: Path Name, Description, Modules (ordered list), Published; check `training-path-dialog.component.ts` |
| ADM-Q-011 | LOW | wizard-steps | `DiscoveryComponent` Q-S2 through Q-S16 · ADM-DISC-01 | only Q-S1 confirmed live: "physical products / time+services / both" | Q-S1 is the branching question. Steps 2–16 conditional on Q-S1 answer. Need to step through all branches to capture remaining question text and answer options. |
| ADM-Q-012 | HIGH | bug | Manager redirect for `/admin/users` · ADM-SH-01 | **BUG CONFIRMED LIVE** — `admin-mgr-redirect-users.finalUrl = /admin/users` | Source says non-Admin on `ADMIN_ONLY_TABS` should redirect to `compliance`. Live sweep confirms Manager lands on `/admin/users` without redirect. Tab label shows "USERS & ACCESS". File: `admin.component.ts:97-99`. Needs bug report. |
| ADM-Q-013 | MED | dialog | `MfaRecoveryCodesDialogComponent` · ACC-SEC-03 · `/account/security` | MFA not enabled on admin@forge.local; recovery codes dialog not triggerable without first enabling MFA | Enable MFA via MfaSetupDialog (confirmed step 1), complete TOTP enrollment, then trigger "VIEW RECOVERY CODES" action to capture dialog fields (list of codes, regenerate action) |
| ADM-Q-014 | LOW | state | `PresetCompareComponent` with 2–4 presets selected · ADM-PRE-02 | reached compare mode (0 selected / pick 2-4 shown) but no presets were checked | navigate to /admin/presets, select 2+ presets via checkboxes, click COMPARE to see side-by-side diff table |
| ADM-Q-015 | LOW | page | `OauthCallbackComponent` · ACC-COMM-04 · `/account/communications/oauth-callback` | CAP-EXT-EMAIL-SYNC OFF; OAuth flow not triggerable without cap enabled | render requires cap ON and active OAuth redirect; capture error/loading states at minimum |
| ADM-Q-016 | MED | wizard-steps | `/onboarding` steps 2–7 | only step 1 confirmed: Personal Info (First/Middle/Last Name, Other Names, DOB, SSN, Email, Phone) | step 2: Address; step 3: Federal Tax (W-4 pre-fill); step 4: State Tax; step 5: I-9; step 6: Direct Deposit; step 7: Acknowledge — navigate through full wizard to capture all field sets |
| ADM-Q-017 | LOW | dialog | `CompleteI9DialogComponent` · ADM-CMP-04 · `/admin/compliance` | I-9 completion is admin-side verification of employee I-9 docs; needs employee with pending I-9 to be triggered | fields: likely employee identity document verification (document type, number, expiry, employer certification); check `complete-i9-dialog.component.html` |
| ADM-Q-018 | MED | page | `TrainingModuleComponent` · TRN-MOD-01 · `/training/module/:id` | no training modules exist (0 modules in non-seeded env; D4 applies) | seed a training module via admin training tab NEW MODULE, then navigate to /training/module/:id as any-auth user to confirm viewer renders (article/video/quiz/quickref/walkthrough content types) |
| ADM-Q-019 | MED | page | `TrainingPathComponent` · TRN-PATH-01 · `/training/path/:id` | no training paths exist (D4 applies) | seed via admin training NEW PATH, then navigate to /training/path/:id to confirm path viewer (ordered modules, progress tracking) |
| ADM-Q-020 | LOW | state | `SetupIntegrationsComponent` · SI-01 · `/setup/integrations` | sweep confirms Admin is redirected to /dashboard (same as non-admin) — may be env-specific (integrations already set up in non-seeded env?) | confirm whether SI-01 ever renders for admin: check component source for precise redirect condition (line ~110-114); may only show on truly first-run installation before any integration configured |
| ADM-Q-021 | MED | dialog | `StateWithholdingDialogComponent` · ADM-TAX-04 | component file exists at `features/admin/components/state-withholding-dialog/` but not found in any admin tab template visually | locate trigger: grep for `StateWithholdingDialogComponent` in all admin panel templates to find parent + trigger button; may be inside `UserCompliancePanelComponent` or `SalesTaxPanelComponent` |
| ADM-Q-022 | LOW | components | `TrainingDetailPanelComponent` (ADM-TRN-08) + `TrainingDetailDialogComponent` (ADM-TRN-09) | live: /admin/training CONTENT tab shows module list (0 modules); neither detail panel nor dialog was triggered | verify: these may render on module row expand/click within the CONTENT tab; also check if `training-detail-dialog/` and `training-detail-panel/` directories exist separately from `training-panel/` |

---

## Dequeue log

_Items resolved since queue opened:_

| ID | resolved | how |
|----|----------|-----|
| ADM-Q-012 | 2026-05-22 | BUG CONFIRMED LIVE: Manager can access `/admin/users` without redirect. Live sweep `finalUrl=/admin/users` with Manager session. Source logic at `admin.component.ts:97-99` says ADMIN_ONLY_TABS → redirect to `compliance`, but bug is live. |

---

_Queue opened: cycle 4 · 2026-05-22 · 22 items · 1 resolved (bug confirmed)_
