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
- [x] `shared/components/input/input.component.ts` — used by login, mfa-challenge, setup, token-setup, account-security, portal-login, mfa-setup-dialog
- [x] `shared/components/validation-button/validation-button.component.ts` — used by login, mfa-challenge, setup, token-setup, account-security
- [x] `shared/components/empty-state/empty-state.component.ts` — used by portal-orders, portal-quotes, portal-invoices, portal-shipments, mobile-jobs, mobile-notifications
- [x] `shared/components/qr-code/qr-code.component.ts` — used by mfa-setup-dialog (TOTP QR display)
- [x] `shared/components/dialog/dialog.component.ts` — used by mfa-setup-dialog, mfa-recovery-codes-dialog
- [x] `shared/components/address-form/address-form.component.ts` — used by setup.component (org address field)
- [x] `shared/components/avatar/avatar.component.ts` — used by mobile-account, mobile-chat-thread, mobile-chat-channel-info, mobile-notifications
- [x] `shared/directives/loading-block.directive.ts` — used by portal-dashboard, portal-orders, portal-quotes, portal-invoices, portal-shipments, mobile-clock, mobile-jobs, mobile-hours
- [x] `shared/components/confirm-dialog/confirm-dialog.component.ts` — used by account-security (remove MFA device), mobile-chat-channel-info (leave channel)
- [x] `shared/components/page-header/page-header.component.ts` — used by dev-tools/loading-demo

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
| LoginComponent | page | `/login` | `features/auth/login.component.ts:30` | all (public) | loading, populated, error | Email+password login form; Forge MES/MRP/ERP marquee logo; email field, password field (show/hide toggle), validation-button (violation badge), "SIGN IN" button; "HAVE A SETUP CODE?" link below; already-authenticated panel (account_circle + Go-to-Dashboard / Sign-Out buttons). **Inline SSO section** (no separate component): `ssoProviders` signal loaded from `AuthService.getSsoProviders()` at line 81; renders SSO provider buttons only when `ssoProviders().length > 0` — **D3-terminal on this stack** (Q-006-CLOSED: no SSO providers configured; gate: admin SSO provider setup). | **LC** (screenshot: access-login-unauthenticated.png, access-login-already-authenticated.png) |
| MfaChallengeComponent | panel | `/login` (embedded) | `features/auth/mfa-challenge.component.ts:19` | MFA-enabled users | loading, populated, error | Inline TOTP/recovery-code challenge after credential verify; 6-digit code input, remember-device checkbox, Verify button; "Use a recovery code instead" toggle; Back to login cancel; embedded in LoginComponent, not a separate route. Source-confirmed states: loading (fetching challenge from server), populated (TOTP input visible), recovery-code toggle (showRecovery signal), error (bad code snackbar). | **D3-terminal** — Q-007-CLOSED: TOTP wall; shared stack has no TOTP issuer configured → no user can enroll MFA → challenge not triggerable. Gate: admin TOTP issuer config. |
| SetupComponent | page | `/setup` | `features/auth/setup.component.ts:30` | public (first-run only) | populated | First-run org setup: company name, address, admin account; guarded by setupRequiredGuard (redirects to /login once complete) | **D4-terminal** (setupRequired=false; guard confirmed redirecting to /login — screenshot: access-setup-first-admin-redirected.png) |
| TokenSetupComponent | page | `/setup/:token` | `features/auth/token-setup.component.ts:27` | invited users (token required) | loading, populated, error | Invite-token account setup (set password, first-time login); also activated by `/setup/integrations` URL due to routing shadow (Q-001) | **LC** (error state live-confirmed with invalid token — screenshot: access-token-setup-error.png; "Invalid or expired setup code. Please contact your administrator." + error_outline icon) |
| SsoCallbackComponent | page | `/sso/callback` | `features/auth/sso-callback.component.ts:18` | SSO users | loading, error | Receives SSO redirect with `?sso_token=`; exchanges for session token via AuthService; on success navigates to app; on error/missing token shows TranslatePipe error message. Source-confirmed states: loading (processing token), error (invalid/missing sso_token param). | **LC (error state)** — cycle 5: fake `?sso_token=FAKE_TOKEN` → error state rendered + redirected to /login (screenshot: access-c5-sso-callback-fake-token.png). Loading→error→redirect flow live-confirmed. **D3-terminal** for success path: no SSO providers configured; real sso_token exchange requires admin SSO setup. Q-006-CLOSED. |

### ACCOUNT SECURITY (user-side MFA + password)

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| AccountSecurityComponent | page | `/account/security` | `features/account/pages/security/account-security.component.ts:28` | all (authGuard) | loading, populated | 3-card grid: (1) Change Password — currentPassword + newPassword + confirmPassword + "CHANGE PASSWORD" button; (2) Kiosk PIN — PIN + confirmPin + "SET PIN" button; (3) Two-Factor Authentication — enabled/disabled state card, device list (deviceType icon + name + lastUsedAt + Default chip + remove btn), Add Device / New Recovery Codes / Disable MFA actions, policy-enforcement variant. No forgot-password link. | **LC** — screenshot: access-account-security.png; MFA card in "not enabled" state ("ENABLE TWO-FACTOR AUTHENTICATION" button visible); **password reset closed**: no standalone reset route and no forgot-password link on login page — change-password (requires currentPassword) + invite-token `/setup/:token` are the only password flows |
| MfaSetupDialogComponent | dialog | `/account/security` (dialog) | `features/account/components/mfa-setup-dialog/mfa-setup-dialog.component.ts:20` | all (authGuard) | loading, populated | TOTP MFA enroll: shows QR code (QrCodeComponent, TOTP URI displayed), TOTP code verify input, submit; opened via MatDialog from AccountSecurityComponent. | **D3-terminal** — Q-007-CLOSED: same TOTP wall; no TOTP issuer configured on shared stack → enrollment blocked. Gate: admin TOTP issuer config. |
| MfaRecoveryCodesDialogComponent | dialog | `/account/security` (dialog) | `features/account/components/mfa-recovery-codes-dialog/mfa-recovery-codes-dialog.component.ts:17` | MFA-enrolled users | loading, populated | View/regenerate TOTP recovery codes; opened via MatDialog from AccountSecurityComponent; only reachable after MFA is enrolled. | **D3-terminal** — Q-007-CLOSED: requires prior MFA enrollment → same TOTP wall. Gate: admin TOTP issuer config. |

### SETUP INTEGRATIONS

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| SetupIntegrationsComponent | page | `/setup/integrations` ⚠️ | `features/setup-integrations/setup-integrations.component.ts:56` | authGuard (Admin enforced internally) | loading, populated | Post-first-setup integrations wizard: card-per-integration (IntegrationStatus model:13) with Set up / Skip choices; grouped by category (Communications, Service, Shipping, Accounting); stats row (configured/remaining/skipped signals); "Set up now" deep-links to /admin/integrations; Finish emits `setup.integrations-wizard-completed` event. Source-confirmed: integrations signal:61, skipped signal:63. **Backend gap (one-liner):** `app.routes.ts` static route `setup/integrations` must be listed before `setup/:token` — current order lets the param route shadow it; fix: reorder in app.routes.ts. | **SC** — Q-001-CLOSED: component exists and is functional; reachable only via programmatic `router.navigate(['/setup/integrations'])` from post-admin setup flow, not via direct URL (routing shadow bug). |

### ONBOARDING

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| OnboardingWizardComponent | page | `/onboarding` | `features/onboarding/onboarding-wizard.component.ts:194` | all (authGuard; new hires) | loading, populated | 7-step employee onboarding driven by horizontal linear `[linear]="true"` mat-stepper; URL-param source-of-truth (?step=0..6, ?review=preview\|signing&formIdx=N); auto-saves draft to server. **Step breakdown (all source-confirmed in onboarding-wizard.component.ts):** Step 1 (idx 0) — personalForm:352 (name, DOB, SSN, phone, start-date, etc.); Step 2 (idx 1) — addressForm:373 (street, city, state, zip); Step 3 (idx 2) — w4Form:405 (filing status, multiple-jobs, deductions, extra withholding); Step 4 (idx 3) — stateForm:444 (state-specific fields); Step 5 (idx 4) — i9Form:461 (eligibility, document type, expiry, file upload); Step 6 (idx 5) — depositForm:537 (routing#, account#, account type); Step 7 (idx 6) — ackForm:555 (policy acknowledgment). **Review flow:** reviewPhase:294 signal ('idle'\|'preview'\|'signing'); PDF preview via compliance-form-renderer; DocuSeal signing embed via currentSigningUrl:298 + postMessage listener:782. | **LC (Steps 1–4)** — cycle 5: filled Step 1 (DOB, SSN, phone) → Continue → Step 2 Address rendered (**LC**) → filled + Continue → Step 3 W-4 rendered (**LC**) → filled + Continue → Step 4 State Withholding rendered (**LC**). Screenshots: access-c5-onboarding-step2-address.png, access-c5-onboarding-step3-w4.png, access-c5-onboarding-step4-state-tax.png. **SC (Steps 5–7)**: I-9/deposit/ackForm source-confirmed (form groups at noted lines); stepper progression from step 4 not completed (state-tax continue-btn gating). **DocuSeal review/signing phase: D4-terminal** (DocuSeal integration not configured on non-seeded stack; signingUrl never returned). Q-003-CLOSED. |

### PORTAL

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| PortalLoginComponent | page | `/portal/login` | `features/portal/pages/portal-login.component.ts:23` | public (no auth) | populated, sent-state | Magic-link request: "Sign in to your portal" title, 15-min expiry hint, email input, "Send" button; post-submit "Check your inbox" state (mark_email_read icon); dev-link block only when API returns devLink (non-seeded: devLink not returned for unknown email) | **LC** (email-form state + sent state confirmed — screenshots: access-portal-login.png, access-portal-login-sent.png) |
| PortalAuthCallbackComponent | page | `/portal/auth/callback` | `features/portal/pages/portal-auth-callback.component.ts:21` | public (token in URL) | loading, error | Exchanges `?token=` for portal session via PortalService; on success navigates to /portal/dashboard; on failure shows error + RouterLink back to /portal/login. Source-confirmed: loading (token exchange), error (expired/used/unknown token + "contact your administrator" message). | **D4-terminal** — Q-004-CLOSED: no portal users provisioned; magic-link token unobtainable on non-seeded stack. |
| PortalLayoutComponent | page-shell | `/portal/*` (authed) | `features/portal/portal-layout.component.ts:21` | portalAuthGuard (customer) | populated | Portal shell: "QB·ENG" brand + "Customer Portal" title; horizontal tab-nav (Dashboard / Orders / Quotes / Invoices / Shipments); user avatar initials + contact name + customer name; logout button. Guard `portal.guard.ts` (portalAuthGuard) redirects to /portal/login when no portal session. | **D4-terminal** — Q-004-CLOSED: portalAuthGuard always redirects; shell never renders on non-seeded stack. |
| PortalDashboardComponent | page | `/portal/dashboard` | `features/portal/pages/portal-dashboard.component.ts:17` | portalAuthGuard (customer) | loading, populated, empty | Summary stats (PortalSummary model): open orders, quote count, unpaid invoices, in-transit shipments; LoadingBlockDirective; RouterLinks to /portal/orders etc. | **D4-terminal** — Q-004-CLOSED: non-seeded; no portal session obtainable. |
| PortalOrdersComponent | page | `/portal/orders` | `features/portal/pages/portal-orders.component.ts:18` | portalAuthGuard (customer) | loading, populated, empty | List of PortalSalesOrder records; EmptyStateComponent; LoadingBlockDirective; DatePipe + DecimalPipe. | **D4-terminal** — Q-004-CLOSED: non-seeded. |
| PortalQuotesComponent | page | `/portal/quotes` | `features/portal/pages/portal-quotes.component.ts:19` | portalAuthGuard (customer) | loading, populated, empty | List of PortalQuote records; accept action (snackbar); EmptyStateComponent; LoadingBlockDirective. | **D4-terminal** — Q-004-CLOSED: non-seeded. |
| PortalInvoicesComponent | page | `/portal/invoices` | `features/portal/pages/portal-invoices.component.ts:18` | portalAuthGuard (customer) | loading, populated, empty | List of PortalInvoice records with amount + status; DatePipe + DecimalPipe; EmptyStateComponent. | **D4-terminal** — Q-004-CLOSED: non-seeded. |
| PortalShipmentsComponent | page | `/portal/shipments` | `features/portal/pages/portal-shipments.component.ts:18` | portalAuthGuard (customer) | loading, populated, empty | List of PortalShipment records; DatePipe; EmptyStateComponent. | **D4-terminal** — Q-004-CLOSED: non-seeded. |

### MOBILE

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| MobileLayoutComponent | page-shell | `/m/*` | `features/mobile/mobile-layout.component.ts:25` | authGuard (mobile devices) | populated | Mobile shell: "Forge" header + notifications bell button; clock-gate banner (when !isClockedIn()); router-outlet; bottom tab bar (CHAT / MY JOBS / SCAN center-ring / CLOCK / ACCOUNT) | **LC** (screenshot: access-mobile-clock.png; shell, clock-gate banner, bottom nav all visible) |
| MobileClockComponent | page | `/m/clock` | `features/mobile/pages/mobile-clock.component.ts:27` | authGuard | loading, populated | Circular dial showing "Clocked Out" / "Clocked In" state; "Clock In" CTA card; LOADING… spinner during clock-state check; default landing for /m/ | **LC** (screenshot: access-mobile-clock.png; "Clocked Out" state with Clock In card + LOADING spinner) |
| MobileJobsComponent | page | `/m/jobs` | `features/mobile/pages/mobile-jobs.component.ts:28` | authGuard | loading, populated, empty | List of assigned/active jobs; job card shows priority, stage, overdue flag, active-timer indicator | **LC** (route navigated; screenshot: access-mobile-jobs.png) |
| MobileJobDetailComponent | page | `/m/jobs/:jobId` | `features/mobile/pages/mobile-job-detail.component.ts:37` | authGuard | loading, populated, error | Job detail: description, stage, operations, time-log actions | **D4-terminal** (non-seeded: no jobs to navigate into) |
| MobileScanComponent | page | `/m/scan` | `features/mobile/pages/mobile-scan.component.ts:32` | authGuard | populated, camera-active, scan-result | Camera QR/barcode scanner using html5-qrcode library; Html5Qrcode + Html5QrcodeScannerState injected; on decode routes result to job/part/asset via ScannerService. Source-confirmed states (mobile-scan.component.ts:32): camera-permission-prompt (getUserMedia gate), camera-preview-active (live viewfinder), scan-result-overlay (ScanResult: value, type, label — job/part/asset/unknown), error-state (camera denied). | **LC** (route LC — screenshot: access-mobile-scan.png) + **SC (camera/scan-result states)** — Q-002-CLOSED: getUserMedia not available in headless Playwright; camera-preview and scan-result states source-confirmed only; hardware/real-device sweep needed to LC those sub-states. |
| MobileHoursComponent | page | `/m/time` | `features/mobile/pages/mobile-hours.component.ts:41` | authGuard | loading, populated, empty | Weekly time log: daily hours breakdown, entry list per day | **LC** (route navigated — screenshot: access-mobile-hours.png) |
| MobileChatComponent | page | `/m/chat` | `features/mobile/pages/mobile-chat.component.ts:37` | authGuard | loading, populated, empty | Channel list with search; opens to mobile-chat-thread | **LC** (route navigated — screenshot: access-mobile-chat.png) |
| MobileChatThreadComponent | page | `/m/chat/thread/:messageId` | `features/mobile/pages/mobile-chat-thread/mobile-chat-thread.component.ts:20` | authGuard | loading, populated | Thread message list + reply input; mention-formatted messages | **D4-terminal** (non-seeded: no chat messages) |
| MobileChatChannelInfoComponent | page | `/m/chat/channel-info/:channelId` | `features/mobile/pages/mobile-chat-channel-info/mobile-chat-channel-info.component.ts:23` | authGuard | loading, populated | Channel metadata: member list, leave-channel action | **D4-terminal** (non-seeded: no chat channels) |
| MobileNotificationsComponent | page | `/m/notifications` | `features/mobile/pages/mobile-notifications.component.ts:15` | authGuard | loading, populated, empty | In-app notification list; empty-state via EmptyStateComponent | **LC** (route navigated — screenshot: access-mobile-notifications.png) |
| MobileAccountComponent | page | `/m/account` | `features/mobile/pages/mobile-account.component.ts:16` | authGuard | populated | User avatar, name, role; theme toggle; logout; link to desktop site | **LC** (route navigated — screenshot: access-mobile-account.png) |
| MobileHomeComponent | page | **UNROUTED** | `features/mobile/pages/mobile-home.component.ts:35` | — | — | Exists in source + spec only; NOT in mobile.routes.ts; orphan/dead component | **LC-ORPHAN** — navigation test: GET `/m/home` → redirected to `/dashboard` via `**` catch-all route; `mobile-home` CSS class never appears in rendered DOM; component not imported anywhere outside its own files; closed dead |

### AI ASSISTANT

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| AiComponent | page | `/ai/:assistantId` | `features/ai/ai.component.ts:39` | authGuard | loading, populated, empty | AI assistant chat: assistant list sidebar (by category, icon, name, description, active-indicator) + right chat panel (messages log, typing-dots, starter questions, textarea input + send); uses AiService (`features/ai/ai.component.ts:39` — AiService, AiHelpMessage, AiAssistantListItem, ChatMessage interfaces). Populated/chat states source-confirmed: AiAssistantCard (sidebar row), AiStarterQuestions (pre-chat welcome), ChatMessage bubbles (user/assistant roles), typing indicator. | **LC** (empty state) + **D4-terminal for populated states** — Q-005-CLOSED: route IS reachable, no capability gate; empty state LC-confirmed. Populated states blocked because no assistants are configured in non-seeded env (not a cap flag — gate is admin AI assistant config). |

### RENDER

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| HeadlessFormRenderComponent | page | `/__render-form` | `features/render/headless-form-render.component.ts:29` | no auth (headless/tooling) | loading, populated | Headless compliance-form renderer for PDF capture; wraps app-compliance-form-renderer in readonly mode; "Waiting for form definition…" until definition() signal populated; no employee session required | **LC** (waiting-state confirmed — screenshot: access-render-form-waiting.png; "Waiting for form definition..." text visible; no chrome/shell) |

### DEV-TOOLS

| component | type | route | file:line | renders-for | states | purpose | status |
|-----------|------|-------|-----------|-------------|--------|---------|--------|
| LoadingDemoComponent | page | `/dev-tools/loading` | `features/dev-tools/loading-demo.component.ts:15` | no auth (any user) | populated | Dev-tools demo for LoadingService + LoadingBlockDirective; 3 sections: Global Overlay (5 trigger buttons), Component-Level Loading (Block A/B toggles + demo blocks), Route Navigation Loading description | **LC** (all 3 sections + active overlay confirmed — screenshots: access-dev-tools-loading.png, access-dev-tools-loading-active.png) |

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

> Items resolved in cycle 2 by ui-scout live sweep are crossed out. Remaining items for access-queue.md.

- ~~**Q-pending-1:** Live confirm LoginComponent~~ → **RESOLVED**: LC — email+password form, validation badge, "HAVE A SETUP CODE?" link; already-authenticated panel (account_circle + Go-to-Dashboard / Sign-Out). Error state on bad creds not separately triggered but form renders correctly.
- ~~**Q-pending-2:** MfaChallengeComponent~~ → **D3-terminal confirmed**: TOTP wall, shared stack, no enrolled MFA users — gate noted.
- ~~**Q-pending-3:** SetupIntegrationsComponent route~~ → **ROUTING SHADOW BUG (Q-001)**: URL `/setup/integrations` is shadowed by `setup/:token` route (Angular matches "integrations" as a token value). Component only reachable programmatically. See access-queue.md Q-001.
- ~~**Q-pending-4:** OnboardingWizardComponent~~ → **PARTIAL LC**: Step 1 live-confirmed (stepper, worker name pre-filled, all Step 1 fields). Steps 2–7 + review/signing phases source-confirmed (require form progression to trigger).
- ~~**Q-pending-5:** AiComponent cap-gate~~ → **RESOLVED**: Not a cap-gate — AI runtime IS reachable; empty-state "No assistants available" live-confirmed. No assistants configured in non-seeded env. Populated/chat states D3-terminal pending admin AI config.
- ~~**Q-pending-6:** HeadlessFormRenderComponent~~ → **RESOLVED**: LC — route loads without auth; "Waiting for form definition…" state confirmed. Window injection is the population path.
- ~~**Q-pending-7:** LoadingDemoComponent~~ → **RESOLVED**: LC — no auth guard needed; all 3 sections + active overlay state confirmed.
- ~~**Q-pending-8:** MobileScanComponent camera prompt~~ → **Q-002-CLOSED (cycle 3)**: source-confirmed camera/scan-result states written to component table; hardware/headless limit documented; row now SC for sub-states.
- ~~**Q-pending-9:** Portal flow~~ → **RESOLVED**: /portal/login (email form + sent state) LC; /portal/auth/callback and all portal authenticated pages D4-terminal (no portal users provisioned in non-seeded env).
- ~~**Q-pending-10:** MobileHomeComponent~~ → **RESOLVED LC-ORPHAN**: nav to /m/home → catch-all → /dashboard; mobile-home CSS class never in DOM; dead confirmed.

**Cycle 3 — access-queue.md Q-001 through Q-007 all closed in component table:**
- ~~**Q-001 (ROUTING SHADOW BUG)**~~ → **CLOSED**: SetupIntegrationsComponent SC; one-line backend-gap note added (reorder static route before param route in app.routes.ts); row updated.
- ~~**Q-002 (MOBILE SCAN STATE)**~~ → **CLOSED**: camera/scan-result states SC in component table; getUserMedia headless limit documented; manual/real-device sweep noted.
- ~~**Q-003 (ONBOARDING STEPS 2–7)**~~ → **CLOSED**: Steps 2–7 SC with form-group file:line references (addressForm:373, w4Form:405, stateForm:444, i9Form:461, depositForm:537, ackForm:555); DocuSeal review/signing phase D4-terminal (no integration configured).
- ~~**Q-004 (PORTAL AUTH SURFACES)**~~ → **CLOSED**: PortalAuthCallbackComponent SC→D4-terminal; all portal authenticated surfaces (Layout, Dashboard, Orders, Quotes, Invoices, Shipments) confirmed D4-terminal; gate: no portal users provisioned.
- ~~**Q-005 (AI POPULATED STATES)**~~ → **CLOSED**: AiComponent route IS reachable (no cap gate); populated/chat states D4-terminal (not D3 — correct classification: gate is missing admin AI config, not a capability flag); sub-state interfaces SC at component:39 (AiAssistantListItem, ChatMessage).
- ~~**Q-006 (SSO SURFACES)**~~ → **CLOSED**: SsoCallbackComponent D3-terminal (no SSO provider configured; gate: admin SSO setup); inline SSO section in LoginComponent noted (ssoProviders signal:54, no separate component); D3-terminal on this stack.
- ~~**Q-007 (MFA CHALLENGE/TOTP)**~~ → **CLOSED**: MfaChallengeComponent D3-terminal (TOTP wall; source-confirmed states: loading, populated, recovery-code toggle, error); MfaSetupDialogComponent D3-terminal; MfaRecoveryCodesDialogComponent D3-terminal; all three rows updated with Q-007-CLOSED tag.

---

## Cycle log

| cycle | date | rows added | tree items ticked | notes |
|-------|------|------------|-------------------|-------|
| 1 | 2026-05-23 | 33 (all source) | 54/54 feature files, 10/10 shared cmps | Initial source-only pass; awaiting live sweep from ui-scout |
| 2 | 2026-05-23 | 0 new rows (status updates only) | — | ui-scout live sweep: 61 observations, 21 LC upgrades, 5 D3/D4 confirmed, 1 routing-shadow bug found; Q-items resolved below |
| 3 | 2026-05-23 | 0 new rows | — | Orchestrator-directed explicit checks: AccountSecurityComponent LC (3-card Security page confirmed); MobileHomeComponent LC-ORPHAN (nav to /m/home → /dashboard catch-all, never renders); password-reset closed (no standalone route, no forgot-password link on login); Q-pending-8 remains open (headless camera limit) |
| 4 | 2026-05-23 | 0 new rows (status/detail updates) | 10/10 shared cmps ticked | Source-cataloger: ticked all shared-component checklist items; closed Q-001 through Q-007 in component table (file:line + terminal states); corrected AI D3→D4; added inline SSO section note; expanded onboarding steps 2–7 with form-group references; portal auth callback SC→D4; scan camera states SC with headless limit. Queue drained. |
| 5 | 2026-05-23 | 0 new rows (LC upgrades only) | — | ui-scout cycle 5: drove onboarding Steps 2–4 LC (address/W-4/state-tax rendered after valid Step 1 fill); portal guard redirect confirmed live (all 5 /portal/* routes → /portal/login); SsoCallbackComponent error state LC (fake token → error → /login redirect). Q-002 camera: mobileRedirectGuard sent /m/scan → /m/clock (clocked-out redirect); headless limit unchanged. 4 screenshots added. |
