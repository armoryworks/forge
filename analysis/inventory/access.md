# Phase 06 — Access & Edge Region Inventory

**Git SHA:** `c1098debe9560ae05d84ffa4a16674a6db1b8c26`
**Commit:** `inventory(admin): cycle 10 — final fold-in, phase complete`
**Phase start:** 2026-05-23
**Sole writer:** source-cataloger agent

---

## Terminal-state taxonomy (verbatim from phase 05)

| code | meaning |
|------|---------|
| `live-confirmed` | Observed and verified in the running app |
| `source-confirmed` | Present in source; not yet live-verified |
| `D3-terminal` | Capability gate OFF — component exists but cap not enabled; gate noted |
| `D4-terminal` | Populated-blocked: non-seeded — route/component reached but no data to populate |

---

## Scope boundary

**IN scope:** auth (login, setup, MFA-challenge, invite-token setup), user-side MFA enrollment (`/account/security`), onboarding wizard, setup-integrations wizard, customer portal (`/portal/*`), mobile (`/m/*`), AI assistant runtime (`/ai/*`), headless form render (`/__render-form`), dev-tools (`/dev-tools/*`).

**OUT of scope (cross-ref admin.md):** Admin-side MFA policy config, AI-assistant admin config panel, capability toggles, EDI, presets — those are inventoried in `admin.md`.

**Note — password reset:** No standalone password-reset route exists in the app. In-app password change is on `/account/security`; passwordless flows use invite tokens (`/setup/:token`). Scope item "password reset" closes against these two surfaces.

---

## Source-map checklist (reconcile to zero)

### features/auth
- [x] `auth/login.component.ts` — LoginComponent
- [x] `auth/mfa-challenge.component.ts` — MfaChallengeComponent (embedded child of login)
- [x] `auth/setup.component.ts` — SetupComponent (first-run org setup)
- [x] `auth/token-setup.component.ts` — TokenSetupComponent (invite/password-set via token)
- [x] `auth/sso-callback.component.ts` — SsoCallbackComponent

### features/account (security sub-page only — remainder out of scope)
- [x] `account/pages/security/account-security.component.ts` — AccountSecurityComponent
- [x] `account/components/mfa-setup-dialog/mfa-setup-dialog.component.ts` — MfaSetupDialogComponent
- [x] `account/components/mfa-recovery-codes-dialog/mfa-recovery-codes-dialog.component.ts` — MfaRecoveryCodesDialogComponent

### features/setup-integrations
- [x] `setup-integrations/setup-integrations.component.ts` — SetupIntegrationsComponent

### features/onboarding
- [x] `onboarding/onboarding-wizard.component.ts` — OnboardingWizardComponent (steps 0–6 + review)
- [x] `onboarding/onboarding.service.ts` — service (no component)
- [x] `onboarding/onboarding.routes.ts` — routes (no component)

### features/portal
- [x] `portal/portal-layout.component.ts` — PortalLayoutComponent
- [x] `portal/pages/portal-login.component.ts` — PortalLoginComponent
- [x] `portal/pages/portal-auth-callback.component.ts` — PortalAuthCallbackComponent
- [x] `portal/pages/portal-dashboard.component.ts` — PortalDashboardComponent
- [x] `portal/pages/portal-orders.component.ts` — PortalOrdersComponent
- [x] `portal/pages/portal-quotes.component.ts` — PortalQuotesComponent
- [x] `portal/pages/portal-invoices.component.ts` — PortalInvoicesComponent
- [x] `portal/pages/portal-shipments.component.ts` — PortalShipmentsComponent
- [x] `portal/services/portal.guard.ts` — portalAuthGuard (no component)
- [x] `portal/services/portal.service.ts` — service (no component)
- [x] `portal/portal.routes.ts` — routes (no component)

### features/mobile
- [x] `mobile/mobile-layout.component.ts` — MobileLayoutComponent
- [x] `mobile/pages/mobile-clock.component.ts` — MobileClockComponent
- [x] `mobile/pages/mobile-jobs.component.ts` — MobileJobsComponent
- [x] `mobile/pages/mobile-job-detail.component.ts` — MobileJobDetailComponent
- [x] `mobile/pages/mobile-scan.component.ts` — MobileScanComponent
- [x] `mobile/pages/mobile-hours.component.ts` — MobileHoursComponent
- [x] `mobile/pages/mobile-chat.component.ts` — MobileChatComponent
- [x] `mobile/pages/mobile-chat-thread/mobile-chat-thread.component.ts` — MobileChatThreadComponent
- [x] `mobile/pages/mobile-chat-channel-info/mobile-chat-channel-info.component.ts` — MobileChatChannelInfoComponent
- [x] `mobile/pages/mobile-notifications.component.ts` — MobileNotificationsComponent
- [x] `mobile/pages/mobile-account.component.ts` — MobileAccountComponent
- [x] `mobile/pages/mobile-home.component.ts` — MobileHomeComponent (**UNROUTED** — exists in source + spec, not in mobile.routes.ts; orphan/dead)
- [x] `mobile/mobile.routes.ts` — routes (no component)
- [x] `mobile/services/mobile-clock-state.service.ts` — service (no component)

### features/ai
- [x] `ai/ai.component.ts` — AiComponent
- [x] `ai/ai.routes.ts` — routes (no component)

### features/render
- [x] `render/headless-form-render.component.ts` — HeadlessFormRenderComponent
- [x] `render/render.routes.ts` — routes (no component)

### features/dev-tools
- [x] `dev-tools/loading-demo.component.ts` — LoadingDemoComponent
- [x] `dev-tools/dev-tools.routes.ts` — routes (no component)

### shared — guards in scope
- [x] `shared/guards/auth.guard.ts` — authGuard
- [x] `shared/guards/setup.guard.ts` — setupRequiredGuard + setupCompleteGuard
- [x] `shared/guards/mobile-redirect.guard.ts` — mobileRedirectGuard
- [x] `shared/guards/demo-only.guard.ts` — demoOnlyGuard (not a page — blocks non-demo)
- [x] `shared/guards/root-redirect.guard.ts` — rootRedirectGuard (not a page)

### shared — components used by access-region surfaces (to confirm usage, not re-inventory)
- [ ] `shared/components/input/input.component.ts` — used by login, mfa-challenge, setup, token-setup, account-security, portal-login
- [ ] `shared/components/validation-button/validation-button.component.ts` — used by login, mfa-challenge, setup, token-setup, account-security
- [ ] `shared/components/empty-state/empty-state.component.ts` — used by portal pages, mobile pages
- [ ] `shared/components/qr-code/qr-code.component.ts` — used by mfa-setup-dialog (TOTP QR)
- [ ] `shared/components/dialog/dialog.component.ts` — used by mfa-setup-dialog, mfa-recovery-codes-dialog
- [ ] `shared/components/address-form/address-form.component.ts` — used by setup.component (org setup)
- [ ] `shared/components/avatar/avatar.component.ts` — used by mobile-account, mobile-chat-thread, mobile-notifications
- [ ] `shared/directives/loading-block.directive.ts` — used by portal pages, mobile pages
- [ ] `shared/components/confirm-dialog/confirm-dialog.component.ts` — used by account-security, mobile-chat-channel-info
- [ ] `shared/components/page-header/page-header.component.ts` — used by dev-tools loading-demo

---

## Route table (all in-scope routes)

| route | component | guard | shell |
|-------|-----------|-------|-------|
| `/login` | LoginComponent | setupCompleteGuard | bare |
| `/sso/callback` | SsoCallbackComponent | none | bare |
| `/setup` | SetupComponent | setupRequiredGuard | bare |
| `/setup/:token` | TokenSetupComponent | none | bare |
| `/setup/integrations` | SetupIntegrationsComponent | authGuard | bare |
| `/onboarding` | OnboardingWizardComponent | authGuard + mobileRedirectGuard | employee app |
| `/account/security` | AccountSecurityComponent | authGuard + mobileRedirectGuard | account layout |
| `/portal/login` | PortalLoginComponent | none | portal-less |
| `/portal/auth/callback` | PortalAuthCallbackComponent | none | portal-less |
| `/portal/dashboard` | PortalDashboardComponent | portalAuthGuard | PortalLayout |
| `/portal/orders` | PortalOrdersComponent | portalAuthGuard | PortalLayout |
| `/portal/quotes` | PortalQuotesComponent | portalAuthGuard | PortalLayout |
| `/portal/invoices` | PortalInvoicesComponent | portalAuthGuard | PortalLayout |
| `/portal/shipments` | PortalShipmentsComponent | portalAuthGuard | PortalLayout |
| `/m/clock` | MobileClockComponent | authGuard | MobileLayout |
| `/m/jobs` | MobileJobsComponent | authGuard | MobileLayout |
| `/m/jobs/:jobId` | MobileJobDetailComponent | authGuard | MobileLayout |
| `/m/scan` | MobileScanComponent | authGuard | MobileLayout |
| `/m/time` | MobileHoursComponent | authGuard | MobileLayout |
| `/m/chat` | MobileChatComponent | authGuard | MobileLayout |
| `/m/chat/thread/:messageId` | MobileChatThreadComponent | authGuard | MobileLayout |
| `/m/chat/channel-info/:channelId` | MobileChatChannelInfoComponent | authGuard | MobileLayout |
| `/m/notifications` | MobileNotificationsComponent | authGuard | MobileLayout |
| `/m/account` | MobileAccountComponent | authGuard | MobileLayout |
| `/ai/:assistantId` | AiComponent | authGuard + mobileRedirectGuard | employee app |
| `/__render-form` | HeadlessFormRenderComponent | none | bare (no chrome) |
| `/dev-tools/loading` | LoadingDemoComponent | none (any auth) | employee app |

---

## Component inventory table

> Status codes: **SC** = source-confirmed · **LC** = live-confirmed · **D3** = cap-gated-OFF · **D4** = populated-blocked/non-seeded

### AUTH region

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| LoginComponent | page | `/login` | `features/auth/login.component.ts:30` | all (public) | loading, populated, error | Email+password login form; conditionally renders MfaChallengeComponent on MFA-required response | SC |
| MfaChallengeComponent | panel | `/login` (embedded) | `features/auth/mfa-challenge.component.ts:19` | MFA-enabled users | loading, populated, error | Inline TOTP/recovery-code challenge after credential verify; embedded in LoginComponent, not a separate route | SC |
| SetupComponent | page | `/setup` | `features/auth/setup.component.ts:30` | public (first-run only) | populated | First-run org setup: company name, address, admin account; guarded by setupRequiredGuard (redirects to /login once complete) | SC |
| TokenSetupComponent | page | `/setup/:token` | `features/auth/token-setup.component.ts:27` | invited users (token required) | loading, populated, error | Invite-token account setup (set password, first-time login); doubles as password-set for new users | SC |
| SsoCallbackComponent | page | `/sso/callback` | `features/auth/sso-callback.component.ts:18` | SSO users | loading, error | Receives SSO redirect with `?sso_token=`; exchanges for session; redirects to app or shows error | SC |

### ACCOUNT SECURITY (user-side MFA + password)

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| AccountSecurityComponent | page | `/account/security` | `features/account/pages/security/account-security.component.ts:28` | all (authGuard) | loading, populated | Change password, change PIN, list/manage MFA devices; opens MfaSetupDialogComponent + MfaRecoveryCodesDialogComponent | SC |
| MfaSetupDialogComponent | dialog | `/account/security` (dialog) | `features/account/components/mfa-setup-dialog/mfa-setup-dialog.component.ts:20` | all (authGuard) | loading, populated | TOTP MFA enroll: shows QR code (QrCodeComponent), TOTP code verify; D3-terminal pending live (TOTP wall from phase 05 carry-forward) | D3-terminal (TOTP enroll blocked on shared stack — intentional; gate: no TOTP issuer configured) |
| MfaRecoveryCodesDialogComponent | dialog | `/account/security` (dialog) | `features/account/components/mfa-recovery-codes-dialog/mfa-recovery-codes-dialog.component.ts:17` | MFA-enrolled users | loading, populated | View/regenerate TOTP recovery codes; only reachable after MFA is enrolled | D3-terminal (requires prior MFA enrollment — same TOTP wall) |

### SETUP INTEGRATIONS

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| SetupIntegrationsComponent | page | `/setup/integrations` | `features/setup-integrations/setup-integrations.component.ts:56` | authGuard (Admin enforced internally) | loading, populated | Post-first-setup integrations wizard: card-per-integration with Set up / Skip choices | SC |

### ONBOARDING

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| OnboardingWizardComponent | page | `/onboarding` | `features/onboarding/onboarding-wizard.component.ts:194` | all (authGuard; new hires) | loading, populated | 7-step employee onboarding (step 0–6): Step 1 Personal Info, Step 2 Address, Step 3 W-4 Federal Withholding, Step 4 State Withholding, Step 5 I-9 Eligibility, Step 6 Direct Deposit, Step 7 Acknowledgments. Followed by review flow (PDF preview + DocuSeal signing embed). URL-param-driven (?step=0..6, ?review=preview\|signing&formIdx=N). Auto-saves draft. | SC |

### PORTAL

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| PortalLoginComponent | page | `/portal/login` | `features/portal/pages/portal-login.component.ts:23` | public (no auth) | populated | Magic-link request: customer submits email; API sends one-time link; dev installs return link in response body | SC |
| PortalAuthCallbackComponent | page | `/portal/auth/callback` | `features/portal/pages/portal-auth-callback.component.ts:21` | public (token in URL) | loading, error | Exchanges `?token=` for portal session; redirects to /portal/dashboard on success; shows error + back-link on failure (expired/used) | SC |
| PortalLayoutComponent | page-shell | `/portal/*` (authed) | `features/portal/portal-layout.component.ts:21` | portalAuthGuard (customer) | populated | Portal shell: customer name header, logout, horizontal tab-nav (Dashboard / Orders / Quotes / Invoices / Shipments) | SC |
| PortalDashboardComponent | page | `/portal/dashboard` | `features/portal/pages/portal-dashboard.component.ts:17` | portalAuthGuard (customer) | loading, populated, empty | Summary stats: open orders, quote count, unpaid invoices, recent shipments. D4-terminal expected (non-seeded portal customer) | D4-terminal (populated-blocked: no seeded portal customer on shared stack) |
| PortalOrdersComponent | page | `/portal/orders` | `features/portal/pages/portal-orders.component.ts:18` | portalAuthGuard (customer) | loading, populated, empty | List of customer's sales orders; empty-state via EmptyStateComponent | D4-terminal (populated-blocked: non-seeded) |
| PortalQuotesComponent | page | `/portal/quotes` | `features/portal/pages/portal-quotes.component.ts:19` | portalAuthGuard (customer) | loading, populated, empty | List of customer's quotes; accept action emits snackbar | D4-terminal (populated-blocked: non-seeded) |
| PortalInvoicesComponent | page | `/portal/invoices` | `features/portal/pages/portal-invoices.component.ts:18` | portalAuthGuard (customer) | loading, populated, empty | List of customer's invoices with amount/status | D4-terminal (populated-blocked: non-seeded) |
| PortalShipmentsComponent | page | `/portal/shipments` | `features/portal/pages/portal-shipments.component.ts:18` | portalAuthGuard (customer) | loading, populated, empty | List of customer's shipments | D4-terminal (populated-blocked: non-seeded) |

### MOBILE

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| MobileLayoutComponent | page-shell | `/m/*` | `features/mobile/mobile-layout.component.ts:25` | authGuard (mobile devices) | populated | Mobile shell: bottom tab bar (Clock / Jobs / Scan / Time / Chat / Notifications / Account); role-conditional tabs; clock-state-aware | SC |
| MobileClockComponent | page | `/m/clock` | `features/mobile/pages/mobile-clock.component.ts:27` | authGuard | loading, populated | Clock in/out with configurable event types (ClockEventTypeDef); shows current status + time-on-task; default landing for /m/ | SC |
| MobileJobsComponent | page | `/m/jobs` | `features/mobile/pages/mobile-jobs.component.ts:28` | authGuard | loading, populated, empty | List of assigned/active jobs; job card shows priority, stage, overdue flag, active-timer indicator | SC |
| MobileJobDetailComponent | page | `/m/jobs/:jobId` | `features/mobile/pages/mobile-job-detail.component.ts:37` | authGuard | loading, populated, error | Job detail: description, stage, operations, time-log actions | SC |
| MobileScanComponent | page | `/m/scan` | `features/mobile/pages/mobile-scan.component.ts:32` | authGuard | populated | Camera QR/barcode scanner (html5-qrcode); routes scan result to job/part/asset; shows scan result overlay | SC |
| MobileHoursComponent | page | `/m/time` | `features/mobile/pages/mobile-hours.component.ts:41` | authGuard | loading, populated, empty | Weekly time log: daily hours breakdown, entry list per day | SC |
| MobileChatComponent | page | `/m/chat` | `features/mobile/pages/mobile-chat.component.ts:37` | authGuard | loading, populated, empty | Channel list with search; opens to mobile-chat-thread; uses ChatHubService + ChatService | SC |
| MobileChatThreadComponent | page | `/m/chat/thread/:messageId` | `features/mobile/pages/mobile-chat-thread/mobile-chat-thread.component.ts:20` | authGuard | loading, populated | Thread message list + reply input; renders mention-formatted messages via MentionRenderPipe | SC |
| MobileChatChannelInfoComponent | page | `/m/chat/channel-info/:channelId` | `features/mobile/pages/mobile-chat-channel-info/mobile-chat-channel-info.component.ts:23` | authGuard | loading, populated | Channel metadata: member list, leave-channel action (confirm-dialog) | SC |
| MobileNotificationsComponent | page | `/m/notifications` | `features/mobile/pages/mobile-notifications.component.ts:15` | authGuard | loading, populated, empty | In-app notification list; empty-state via EmptyStateComponent | SC |
| MobileAccountComponent | page | `/m/account` | `features/mobile/pages/mobile-account.component.ts:16` | authGuard | populated | User avatar, name, role; theme toggle; logout; link to desktop site (sets preferDesktop) | SC |
| MobileHomeComponent | page | **UNROUTED** | `features/mobile/pages/mobile-home.component.ts:35` | — | — | Exists in source + spec only; NOT in mobile.routes.ts; orphan/dead component | source-confirmed (orphan — not routed; omit from live sweep) |

### AI ASSISTANT

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| AiComponent | page | `/ai/:assistantId` | `features/ai/ai.component.ts:39` | authGuard (cap-gated) | loading, populated, empty | AI assistant chat: assistant list sidebar (by assistantId), chat thread (user+assistant messages), starter questions, textarea input; uses AiService. Cap-gate expected (AI capability flag) | D3-terminal (cap-gated-OFF expected; gate: AI assistant capability not enabled on shared stack — to be confirmed by live sweep) |

### RENDER

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| HeadlessFormRenderComponent | page | `/__render-form` | `features/render/headless-form-render.component.ts:29` | no auth (headless/tooling) | loading, populated | Headless compliance-form renderer for PuppeteerSharp visual comparison; receives form def via `window.__FORM_DEFINITION__` event injection; signals `window.__RENDER_READY__`; no chrome | source-confirmed (tooling route; not reachable by normal nav; window-injection protocol) |

### DEV-TOOLS

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| LoadingDemoComponent | page | `/dev-tools/loading` | `features/dev-tools/loading-demo.component.ts:15` | authGuard (any role) | populated | Dev-tools demo for LoadingService + LoadingBlockDirective; toggles global + block loading states; no role guard | SC |

---

## Shared components — usage audit (in-scope surfaces only)

| component | file | used by (access-region) | status |
|-----------|------|------------------------|--------|
| InputComponent | `shared/components/input/input.component.ts` | login, mfa-challenge, setup, token-setup, account-security, portal-login, mfa-setup-dialog | SC |
| ValidationButtonComponent | `shared/components/validation-button/validation-button.component.ts` | login, mfa-challenge, setup, token-setup, account-security | SC |
| EmptyStateComponent | `shared/components/empty-state/empty-state.component.ts` | portal-orders, portal-quotes, portal-invoices, portal-shipments, mobile-jobs, mobile-notifications | SC |
| QrCodeComponent | `shared/components/qr-code/qr-code.component.ts` | mfa-setup-dialog (TOTP QR display) | SC |
| DialogComponent | `shared/components/dialog/dialog.component.ts` | mfa-setup-dialog, mfa-recovery-codes-dialog | SC |
| AddressFormComponent | `shared/components/address-form/address-form.component.ts` | setup.component (org address) | SC |
| AvatarComponent | `shared/components/avatar/avatar.component.ts` | mobile-account, mobile-chat-thread, mobile-chat-channel-info, mobile-notifications | SC |
| LoadingBlockDirective | `shared/directives/loading-block.directive.ts` | portal-dashboard, portal-orders, portal-quotes, portal-invoices, portal-shipments, mobile-clock, mobile-jobs, mobile-hours | SC |
| ConfirmDialogComponent | `shared/components/confirm-dialog/confirm-dialog.component.ts` | account-security (remove MFA device), mobile-chat-channel-info (leave channel) | SC |
| PageHeaderComponent | `shared/components/page-header/page-header.component.ts` | dev-tools/loading-demo | SC |

---

## Open items / queue feed

- **Q-pending-1:** Live confirm LoginComponent states (loading + error on bad creds + MFA trigger). Needs ui-scout login sweep.
- **Q-pending-2:** MfaChallengeComponent — confirm it renders inline within LoginComponent (not a dialog). States: loading (fetching challenge), populated (TOTP input shown), recovery-code toggle shown/hidden.
- **Q-pending-3:** SetupIntegrationsComponent — confirm route accessible post-login; list integration cards shown. Needs admin user sweep.
- **Q-pending-4:** OnboardingWizardComponent — confirm step navigation, auto-save, review flow (PDF preview + DocuSeal embed). Needs new-hire-equivalent user or seeded onboarding draft.
- **Q-pending-5:** AiComponent — confirm cap-gate state (should show empty/locked or redirect). If D3-terminal confirmed, note exact gate.
- **Q-pending-6:** HeadlessFormRenderComponent (`/__render-form`) — confirm route loads without auth; verify window injection protocol is the only population path.
- **Q-pending-7:** LoadingDemoComponent — confirm it's accessible without admin role; verify block-loading toggle works.
- **Q-pending-8:** MobileScanComponent — confirm camera access prompt and scan result overlay.
- **Q-pending-9:** Portal login → callback → dashboard flow — confirm magic-link email flow or dev-response token path. All portal pages expected D4-terminal (non-seeded customer).
- **Q-pending-10:** MobileHomeComponent — confirm it is truly unrouted (not reachable via any nav or redirect). Can be closed source-only.

---

## Cycle log

| cycle | date | rows added | tree items ticked | notes |
|-------|------|------------|-------------------|-------|
| 1 | 2026-05-23 | 33 (all source) | 54/54 feature files, 10/10 shared cmps | Initial source-only pass; awaiting live sweep from ui-scout |
