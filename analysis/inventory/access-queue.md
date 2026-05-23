# Phase 06 — Access & Edge Region: Scout Queue

> Sole writer: ui-scout agent.
> Created: 2026-05-23 (cycle 2 live sweep).
> Items are open until explicitly struck with ~~strikethrough~~.

---

## Q-001 — ROUTING SHADOW BUG: `/setup/integrations` unreachable via URL

| field | value |
|-------|-------|
| surface | SetupIntegrationsComponent |
| route | `/setup/integrations` (intended) |
| file | `features/setup-integrations/setup-integrations.component.ts` |
| what's blocking | Angular route `{ path: 'setup/:token' }` precedes `{ path: 'setup/integrations' }` in `app.routes.ts`. Angular matches "integrations" as the `:token` param, rendering TokenSetupComponent with an invalid token → error page. |
| suspected terminal | **BUG** (not a D3/D4 terminal — this is a routing defect): Component IS implemented and reachable via programmatic `router.navigate(['/setup/integrations'])` from the post-setup admin redirect flow, but not via URL navigation. |
| evidence | Screenshot: `access-setup-integrations.png` shows TokenSetupComponent error "Invalid or expired setup code." Source: `app.routes.ts` line order verified. |
| recommended fix | Reorder routes: place `{ path: 'setup/integrations', ... }` BEFORE `{ path: 'setup/:token', ... }` in `app.routes.ts`. Angular matches static paths before parameterized ones only when the static route is listed first. |
| priority | Medium — functional path (post-admin redirect) still works; URL-direct access is broken. |

---

## Q-002 — MobileScanComponent camera + scan-result states (headless limitation)

| field | value |
|-------|-------|
| surface | MobileScanComponent |
| route | `/m/scan` |
| file | `features/mobile/pages/mobile-scan.component.ts` |
| what's blocking | Headless Playwright cannot invoke `getUserMedia` (camera API); camera permission prompt and live scan overlay states cannot be triggered in CI/headless context. |
| suspected terminal | NOT a terminal — states exist and are reachable on real devices. Blocked only for headless sweep. |
| states still source-confirmed | camera-permission-prompt, camera-preview-active, scan-result-overlay (QR decode success/fail), routing-on-scan-result (job/part/asset redirect) |
| recommended approach | Manual sweep on a mobile device or an emulator with virtual camera input. Or: Playwright with `--use-fake-ui-for-media-stream` flag for camera permission bypass. |

---

## Q-003 — Onboarding steps 2–7 and review/signing phases (progression barrier)

| field | value |
|-------|-------|
| surface | OnboardingWizardComponent |
| route | `/onboarding` steps 2–7 + review + signing phases |
| file | `features/onboarding/onboarding-wizard.component.ts` |
| what's blocking | Wizard is linear (`[linear]="true"`); steps 2–7 are only accessible after all required fields in prior steps are filled and validated. The review and signing phases only activate after step 7 (Acknowledge) is submitted. DocuSeal signing embed requires a real DocuSeal integration with a signing URL. |
| suspected terminal | **D4-terminal for review/signing only**: DocuSeal integration not configured in non-seeded env. Steps 1–7 ALL LC (c7 sweep). |
| **LC (c5 sweep)** | Step 1 (personal info pre-filled), Step 2 (address: street1/city/state-select/zip), Step 3 (W-4: filing options [Single/MFJ/HoH] + dependents calc), Step 4 (state withholding: filing select [Single/Married/MFJ/HoH]), Step 5 (I-9: citizenship select [USC/noncitizen national/LPR/alien]; List A btn; type select [US Passport/Passport Card/I-551/I-766]; doc number + issuing authority + expiry; listAFileId pre-populated from server draft), Step 6 (direct deposit: bank name/routing/account number/type [Checking/Savings]), Step 7 (workers-comp ack toggle LC; submit btn enabled after acks). Screenshots: access-c5-step2-address.png, access-c5-step3-w4.png, access-c5-step4-state.png, access-c5-step5-i9.png, access-c5-step6-deposit.png, access-c5-step7-ack.png |
| states still source-confirmed | Review/PDF-preview phase, DocuSeal signing embed, Completion screen (activate only after actual submit — not triggered to avoid data mutation) |
| screenshots (LC) | access-c5-step1-initial.png, access-c5-step2-address.png, access-c5-step2-filled.png, access-c5-step3-w4.png, access-c5-step3-filled.png, access-c5-step4-state.png, access-c5-step5-i9.png, access-c5-step5-i9-filled.png, access-c5-step6-deposit.png, access-c5-step6-filled.png, access-c5-step7-ack.png, access-c5-step7-filled.png |
| recommended approach | DocuSeal embed D4-terminal (no integration). Review/completion SC. |

---

## Q-004 — Portal authenticated surfaces (D4-terminal: no portal users)

| field | value |
|-------|-------|
| surface | Portal layout, dashboard, orders, quotes, invoices, shipments |
| route | `/portal/*` (post-auth-callback) |
| file | `features/portal/portal-layout.component.ts` + pages |
| what's blocking | Non-seeded env: no customers provisioned → no portal contact records → no magic-link tokens can be generated → portalAuthGuard always redirects to /portal/login. |
| suspected terminal | **D4-terminal** (all portal authenticated surfaces): would require seeded customer with portal access provisioned via admin /customers → Portal Access screen. |
| states still source-confirmed | PortalLayoutShell (header + nav tabs), PortalDashboardComponent (summary cards), PortalOrdersComponent (order list), PortalQuotesComponent (quote list), PortalInvoicesComponent (invoice list), PortalShipmentsComponent (shipment list) |
| recommended approach | Seed a customer with a portal contact, use the "Provision Portal Access" dialog in Customers → Portal Access tab to generate a magic-link, then navigate /portal with the token. See Q-item from admin phase about provision-portal-access-dialog. |

---

## Q-005 — AI assistant populated/chat states (no assistants configured)

| field | value |
|-------|-------|
| surface | AiComponent — assistant cards, chat panel, starter questions, message bubbles |
| route | `/ai/:assistantId` |
| file | `features/ai/ai.component.ts` |
| what's blocking | Non-seeded env: no AI assistants configured in admin panel. AiComponent renders with empty sidebar "No assistants available" and empty right panel "Select an assistant to start chatting". |
| suspected terminal | **D3-terminal** (pending admin AI-assistant config): not a capability flag, just no assistants defined. |
| states still source-confirmed | AiAssistantCard (sidebar card with icon/name/desc/active state), AiChatPanel (header with category chip + clear-chat, messages log), AiStarterQuestions (welcome screen with starter buttons), AiChatMessage (user/assistant message bubbles, typing-dots), AiClearChatButton |
| recommended approach | Configure an AI assistant in Admin → AI Assistants panel (requires API key and AI capability configured). Then navigate /ai to see populated states. Admin.md has the AI-assistant-config surfaces. |

---

## Q-006 — SSO callback flow (no SSO provider)

| field | value |
|-------|-------|
| surface | SsoCallbackComponent + LoginSsoSection |
| route | `/sso/callback` + `/login` SSO buttons |
| file | `features/auth/sso-callback.component.ts` |
| what's blocking | No SSO providers configured in non-seeded env; SSO section on login page not rendered (ssoProviders().length = 0); /sso/callback is reachable but only processes `?sso_token=` params which require a real SSO exchange. |
| suspected terminal | **D3-terminal for LoginSsoSection** (gate: no SSO providers configured). **SsoCallbackComponent error state: LC** (c5 sweep — fake token injected). |
| **LC (c5 sweep)** | SsoCallbackComponent: navigated `/sso/callback?sso_token=fake-invalid` → spinner rendered → error state displayed → redirected to /login (screenshot: access-c5-sso-callback-fake-token.png) |
| states still source-confirmed | LoginSsoSection (divider + provider buttons) — only renders when `ssoProviders().length > 0`; no providers configured in this env |
| recommended approach | LoginSsoSection: configure an SSO provider in Admin → Integrations. SsoCallbackComponent error state is already live-confirmed via fake token injection. |

---

## Q-007 — MFA challenge inline panel (TOTP wall)

| field | value |
|-------|-------|
| surface | MfaChallengeComponent + MfaSetupDialogComponent + MfaRecoveryCodesDialogComponent |
| route | `/login` (inline), `/account/security` (dialogs) |
| file | `features/auth/mfa-challenge.component.ts`, `features/account/components/mfa-setup-dialog/` |
| what's blocking | Shared stack: no TOTP issuer configured; cannot enroll MFA → MFA challenge not triggerable on login; recovery codes not accessible. Intentional wall from phase 05 carry-forward. |
| suspected terminal | **D3-terminal** (TOTP wall: shared stack; gate: TOTP issuer config in admin) |
| states still source-confirmed | MfaChallengeComponent loading state, populated (6-digit code form + remember-device checkbox), recovery-code toggle, error display; MfaSetupDialogComponent QR code + TOTP verify; MfaRecoveryCodesDialogComponent |
| recommended approach | Configure TOTP issuer in admin, enroll MFA on a test user, then trigger login to see challenge. |

---

## Drain status (cycle 5 — final)

> All items closed. Cycle 5 live sweep upgraded onboarding steps 2-7 from SC to LC; all reachable states confirmed; no new open items.

| Q-ID | status | terminal class |
|------|--------|----------------|
| Q-001 | **CLOSED** — routing shadow bug documented in component table; eng-lead handoff note in access.md; no sweep action possible | SC (bug, not a live-sweep gap) |
| Q-002 | **CLOSED** — cycle 5 fake-camera attempt: mobileRedirectGuard redirected /m/scan → /m/clock (worker not clocked in); getUserMedia headless limit unchanged; camera/scan-result states SC | SC (headless limitation) |
| Q-003 | **CLOSED** — cycle 5 LC upgrade: All onboarding steps 1–7 **live-confirmed** via headless stepper progression. Steps 1-4 auto-advanced (pre-filled). Step 5 I-9: citizenship select options confirmed, List A button clicked, type select options confirmed, doc fields filled — Continue enabled (listAFileId pre-populated from server draft). Steps 6 (direct deposit) and 7 (workers-comp ack toggle) confirmed rendered and functional. Submit btn present and enabled after acks. DocuSeal review/signing phase D4-terminal (no integration). Screenshots: access-c5-step5-i9.png, access-c5-step6-deposit.png, access-c5-step7-ack.png, access-c5-step7-filled.png. | D4-terminal (signing); **LC (all steps 1–7)** |
| Q-004 | **CLOSED** — cycle 5 confirmed: all 5 /portal/* routes redirect to /portal/login (portalAuthGuard live). Authenticated surfaces D4-terminal; gate: no portal users provisioned. | D4-terminal |
| Q-005 | **CLOSED** — AI populated/chat states D4-terminal (not D3; gate: no assistants configured in admin); route IS reachable | D4-terminal |
| Q-006 | **CLOSED** — cycle 5 LC upgrade: SsoCallbackComponent error state live-confirmed (fake ?sso_token → error → redirect to /login). Success path D3-terminal: no SSO provider configured. | D3-terminal (success); LC (error state) |
| Q-007 | **CLOSED** — MfaChallengeComponent, MfaSetupDialogComponent, MfaRecoveryCodesDialogComponent all D3-terminal; gate: TOTP issuer not configured (shared-stack intentional wall) | D3-terminal |
| Q-008 | **CLOSED** — LoginComponent surface re-confirmed live 2026-05-23 (screenshot: access-login-snapshot.png). All 6 elements observed. SSO section absent (D3-terminal confirmed). MFA panel absent (D3-terminal confirmed). No forgot-password link (confirmed absent). | **LC** |

---

## Q-008 — LoginComponent surface live confirmation (2026-05-23)

| field | value |
|-------|-------|
| surface | LoginComponent |
| route | `/login` |
| file | `features/auth/login.component.ts` |
| status | **CLOSED — live-confirmed** |
| screenshot | `access-login-snapshot.png` |
| elements observed (LC) | **Email input** (type=email, label="Email"); **Password input** (type=password, label="Password"); **Password visibility toggle** (button/icon: `visibility` — show/hide); **ValidationButton badge** (warning icon rendered when form invalid — `app-validation-button`); **"Sign In" submit button** (type=submit); **"Have a setup code?" button** (vpn_key icon + text — routes to `/setup/:token` flow) |
| elements confirmed absent | SSO provider buttons (D3-terminal: `ssoProviders().length = 0` on this stack); "Forgot password" link (no such route exists in the app); MFA challenge panel (D3-terminal: TOTP wall) |
| notes | DOM captured via Playwright headless; 9 interactive elements in DOM total (6 functional, 1 skip-link, 2 labels). Already-authenticated panel (account_circle + Go-to-Dashboard / Sign-Out) not visible — user was unauthenticated. |
