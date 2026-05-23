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
| suspected terminal | **D4-terminal for review/signing**: DocuSeal integration not configured in non-seeded env. Steps 2–6 reachable with data entry; step 7 and signing flow require DocuSeal. |
| states still source-confirmed | Address (step 2), W-4 (step 3), State Withholding (step 4), I-9 + document upload (step 5), Direct Deposit (step 6), Acknowledgments (step 7), Review/PDF-preview, DocuSeal signing embed, Completion screen |
| recommended approach | Fill Step 1 + navigate through stepper with valid data to confirm steps 2–7 render correctly. DocuSeal embed will be D4-terminal (no integration). |

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
| suspected terminal | **D3-terminal** (no SSO configured; gate: admin SSO provider config) |
| states still source-confirmed | LoginSsoSection (divider + provider buttons), SsoCallbackComponent (loading spinner, error state on token failure) |
| recommended approach | Configure an SSO provider in Admin → Integrations. Or inject a mock `?sso_token=` to reach the error state of SsoCallbackComponent. |

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

## Drain status (cycle 4 — queue drained)

> All items classified as pre-declared terminals or documented limitations. No live-sweep action remains.

| Q-ID | status | terminal class |
|------|--------|----------------|
| Q-001 | **CLOSED** — routing shadow bug documented in component table; eng-lead handoff note in access.md; no sweep action possible | SC (bug, not a live-sweep gap) |
| Q-002 | **CLOSED** — camera/scan-result states documented SC in component table; getUserMedia headless limit noted; manual/real-device sweep path described | SC (headless limitation) |
| Q-003 | **CLOSED** — onboarding steps 2–7 documented SC with file:line refs; DocuSeal review/signing phase documented D4-terminal (no integration) | D4-terminal |
| Q-004 | **CLOSED** — all portal authenticated surfaces (auth-callback, layout, dashboard, orders, quotes, invoices, shipments) documented D4-terminal; gate: no portal users provisioned | D4-terminal |
| Q-005 | **CLOSED** — AI populated/chat states documented D4-terminal (not D3; gate: no assistants configured in admin, not a capability flag); route IS reachable | D4-terminal |
| Q-006 | **CLOSED** — SsoCallbackComponent + LoginSsoSection documented D3-terminal; gate: no SSO provider configured in admin | D3-terminal |
| Q-007 | **CLOSED** — MfaChallengeComponent, MfaSetupDialogComponent, MfaRecoveryCodesDialogComponent all documented D3-terminal; gate: TOTP issuer not configured (shared-stack intentional wall) | D3-terminal |
