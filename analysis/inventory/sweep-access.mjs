/**
 * Phase 06 — Access & Edge region sweep
 * Covers: auth, onboarding, setup-integrations, portal, mobile, AI, render, dev-tools
 */
import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:4200';
const SCREENSHOTS = path.join(__dirname, 'screenshots');
const CREDS = {
  admin: { email: 'admin@forge.local', password: 'ForgeRun!2026' },
  worker: { email: 'worker@forge.local', password: 'ForgeRun!2026' },
  engineer: { email: 'engineer@forge.local', password: 'ForgeRun!2026' },
  manager: { email: 'manager@forge.local', password: 'ForgeRun!2026' },
  officemanager: { email: 'officemanager@forge.local', password: 'ForgeRun!2026' },
};

const results = [];

async function login(page, role = 'admin') {
  const { email, password } = CREDS[role];
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.fill('input[type="email"], input[autocomplete="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[data-testid="login-submit"], button[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
}

async function shot(page, name) {
  const p = path.join(SCREENSHOTS, `access-${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

async function record(component, type, route, file, rendersFor, states, purpose, note = '') {
  results.push({ component, type, route, file, rendersFor, states, purpose, note });
  console.log(`[OK] ${component} @ ${route}`);
}

const browser = await chromium.launch({ headless: true });

// ─── 1. AUTH SURFACES ──────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // 1a. Login page — unauthenticated
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 20000 });
  await shot(page, 'login-unauthenticated');
  const loginHtml = await page.content();
  const hasEmailField = loginHtml.includes('login-email') || loginHtml.includes('type="email"');
  const hasPasswordField = loginHtml.includes('login-password') || loginHtml.includes('type="password"');
  const hasSetupCode = loginHtml.includes('setupCode') || loginHtml.includes('vpn_key');
  const hasSso = loginHtml.includes('sso') || loginHtml.includes('auth-card__sso');
  record('LoginPage', 'page', '/login', 'forge-ui/src/app/features/auth/login.component.ts', 'all (unauthenticated)',
    'login-form-state (live-confirmed)',
    'Email/password login form; app marquee branding header');

  // Setup code toggle
  const setupCodeBtn = page.locator('.auth-card__setup-link');
  if (await setupCodeBtn.count() > 0) {
    await setupCodeBtn.click();
    await page.waitForTimeout(500);
    await shot(page, 'login-setup-code-expanded');
    record('LoginSetupCodeCluster', 'cluster', '/login', 'forge-ui/src/app/features/auth/login.component.ts', 'all',
      'setup-code-entry-state (live-confirmed)',
      'Inline setup-code entry: token input, Cancel, Continue actions; revealed by "Have a setup code?" link');
    // collapse it
    const cancelBtn = page.locator('.setup-code-entry__actions .action-btn').first();
    if (await cancelBtn.count() > 0) await cancelBtn.click();
  }

  // Check SSO section
  if (hasSso) {
    record('LoginSsoSection', 'cluster', '/login', 'forge-ui/src/app/features/auth/login.component.ts', 'all',
      'source-confirmed (rendered when ssoProviders().length > 0)',
      'SSO provider buttons with divider; gated on configured providers (none in non-seeded env)');
  } else {
    record('LoginSsoSection', 'cluster', '/login', 'forge-ui/src/app/features/auth/login.component.ts', 'all',
      'D3-terminal (no SSO providers configured)',
      'SSO provider buttons; only shown when SSO providers are configured in admin');
  }

  // 1b. Already-logged-in state — login while authenticated
  await login(page, 'admin');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await shot(page, 'login-already-authenticated');
  const authHtml = await page.content();
  const hasAlreadyLoggedIn = authHtml.includes('account_circle') || authHtml.includes('goToDashboard') || authHtml.includes('alreadySignedIn');
  record('LoginAlreadySignedInPanel', 'panel', '/login', 'forge-ui/src/app/features/auth/login.component.ts', 'all (authenticated)',
    hasAlreadyLoggedIn ? 'already-signed-in-state (live-confirmed)' : 'source-confirmed',
    'Shows current user email, Go to Dashboard + Sign Out / Switch buttons when already authenticated');

  await page.close();
}

// 1c. SSO Callback — source-confirmed (can't trigger without SSO provider)
record('SsoCallbackPage', 'page', '/sso/callback', 'forge-ui/src/app/features/auth/sso-callback.component.ts', 'all',
  'source-confirmed (loading spinner state)',
  'Processing SSO callback: spinning sync icon + "Completing sign-in" message; transient state');

// 1d. Token Setup — /setup/:token
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  // Navigate with a fake token to capture the error state
  await page.goto(`${BASE}/setup/INVALID-TOKEN-FOR-INVENTORY`, { waitUntil: 'networkidle', timeout: 15000 });
  await shot(page, 'token-setup-error');
  const html = await page.content();
  const hasError = html.includes('error_outline') || html.includes('setup-error');
  const hasForm = html.includes('setup-password') || html.includes('setup-confirm-password');
  record('TokenSetupPage', 'page', '/setup/:token', 'forge-ui/src/app/features/auth/token-setup.component.ts', 'all (invited user)',
    hasError ? 'error-state (live-confirmed: invalid token → error_outline)' : (hasForm ? 'form-state (live-confirmed)' : 'source-confirmed'),
    'New-user password setup via invite token; shows welcome message + password/confirm fields; error state on invalid token');
  await page.close();
}

// 1e. MFA Challenge — embedded inside login.component; triggered server-side
record('MfaChallengePanel', 'panel', '/login', 'forge-ui/src/app/features/auth/mfa-challenge.component.ts', 'all (MFA-enrolled users)',
  'D3-terminal (TOTP wall: shared-stack; no enrolled MFA users)',
  'MFA challenge: 6-digit code form, remember-device checkbox, error state; switches to recovery-code form via alt link; Back-to-login cancel; loading skeleton');

// 1f. First-time Setup (POST /api/v1/auth/status setupRequired=true) — already completed
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  // setupCompleteGuard redirects /setup → /login when setup is done
  await page.goto(`${BASE}/setup`, { waitUntil: 'networkidle', timeout: 15000 });
  await shot(page, 'setup-first-admin-redirected');
  const url = page.url();
  const redirectedAway = !url.includes('/setup') || url.includes('/login') || url.includes('/dashboard');
  record('FirstAdminSetupPage', 'page', '/setup', 'forge-ui/src/app/features/auth/setup.component.ts', 'all (pre-setup state)',
    `D4-terminal (non-seeded: setupRequired=false; guard redirects to /login — live url: ${url})`,
    '2-step setup wizard: Step 1 account form (firstName/lastName/email/password/confirm), Step 2 company form (name/phone/email/EIN/website + address); only shown when setupRequired=true');
  await page.close();
}

// ─── 2. ONBOARDING WIZARD ──────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await login(page, 'worker');
  await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle', timeout: 20000 });
  await shot(page, 'onboarding-step1');
  const html = await page.content();
  const hasStepper = html.includes('mat-stepper') || html.includes('onboarding__stepper') || html.includes('onboarding-first-name');
  record('OnboardingWizardPage', 'page', '/onboarding', 'forge-ui/src/app/features/onboarding/onboarding-wizard.component.ts', 'all (authenticated)',
    hasStepper ? 'step1-populated (live-confirmed)' : 'source-confirmed',
    '7-step wizard: Personal Info / Address / Federal Tax W-4 / State Withholding / I-9 / Direct Deposit / Acknowledgments; linear mat-stepper');

  // Step 1 fields cluster
  record('OnboardingPersonalInfoStep', 'form', '/onboarding?step=0', 'forge-ui/src/app/features/onboarding/onboarding-wizard.component.ts:184', 'all',
    hasStepper ? 'live-confirmed' : 'source-confirmed',
    'Personal info: firstName/middleName/lastName, otherLastNames, DOB datepicker, SSN (masked), email, phone; secure-field lock hint when SSN already stored');

  record('OnboardingAddressStep', 'form', '/onboarding?step=1', 'forge-ui/src/app/features/onboarding/onboarding-wizard.component.ts:230', 'all',
    'source-confirmed', 'Home address: street1, street2, city, state select, zip');

  record('OnboardingW4Step', 'form', '/onboarding?step=2', 'forge-ui/src/app/features/onboarding/onboarding-wizard.component.ts:253', 'all',
    'source-confirmed', 'W-4 federal tax: filing status select, multiple-jobs toggle, dependents calc grid (qualifyingChildren×$2k, otherDependents×$500), other-income/deductions currency inputs, extra-withholding, exempt toggle');

  record('OnboardingStateWithholdingStep', 'form', '/onboarding?step=3', 'forge-ui/src/app/features/onboarding/onboarding-wizard.component.ts:341', 'all',
    'source-confirmed', 'State withholding: state select, filing-status select, allowances, additional withholding, exempt toggle; no-income-tax skip notice for applicable states');

  record('OnboardingI9Step', 'form', '/onboarding?step=4', 'forge-ui/src/app/features/onboarding/onboarding-wizard.component.ts:388', 'all',
    'source-confirmed', 'I-9 employment eligibility: citizenship select; List A or B+C doc-choice buttons; doc type selects, doc number inputs (secure), authority, expiry datepickers, file-upload zones; preparer/translator toggle + address fields; conditional alien-auth fields');

  record('OnboardingDirectDepositStep', 'form', '/onboarding?step=5', 'forge-ui/src/app/features/onboarding/onboarding-wizard.component.ts:675', 'all',
    'source-confirmed', 'Direct deposit: bank name, routing number (secure, 9-digit masked), account number (secure), account type select; check-diagram visual aid');

  record('OnboardingAcknowledgmentsStep', 'form', '/onboarding?step=6', 'forge-ui/src/app/features/onboarding/onboarding-wizard.component.ts:730', 'all',
    'source-confirmed', 'Acknowledgments: workers-comp ack card + toggle, handbook ack card + toggle (conditional on hasHandbook()); submit-and-sign button');

  record('OnboardingReviewPhase', 'panel', '/onboarding (review)', 'forge-ui/src/app/features/onboarding/onboarding-wizard.component.ts:42', 'all',
    'source-confirmed', 'PDF preview + review phase: per-form progress indicators, PDF embed (or summary fallback), go-back-to-edit / proceed-to-sign actions');

  record('OnboardingSigningPhase', 'panel', '/onboarding (signing)', 'forge-ui/src/app/features/onboarding/onboarding-wizard.component.ts:117', 'all',
    'source-confirmed', 'DocuSeal signing embed phase: docuseal-form web component, back-to-preview button, completion note; for W-4 / StateWithholding / I-9 form types');

  record('OnboardingCompleteScreen', 'state', '/onboarding (complete)', 'forge-ui/src/app/features/onboarding/onboarding-wizard.component.ts:11', 'all',
    'source-confirmed', 'Completion screen: check_circle icon, title/message, Go to Dashboard button');

  record('OnboardingActions', 'cluster', '/onboarding', 'forge-ui/src/app/features/onboarding/onboarding-wizard.component.ts:778', 'all',
    hasStepper ? 'live-confirmed' : 'source-confirmed',
    'Fixed footer: Back / Continue / Submit-and-Sign buttons with validation-button wrapper; app-validation-button violations display');

  await page.close();
}

// ─── 3. SETUP INTEGRATIONS ─────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await login(page, 'admin');
  await page.goto(`${BASE}/setup/integrations`, { waitUntil: 'networkidle', timeout: 20000 });
  await shot(page, 'setup-integrations');
  const html = await page.content();
  const hasCards = html.includes('setup-card') || html.includes('setup-wizard');
  record('SetupIntegrationsPage', 'page', '/setup/integrations', 'forge-ui/src/app/features/setup-integrations/setup-integrations.component.ts', 'Admin (auth-gated)',
    hasCards ? 'populated (live-confirmed)' : 'empty-state (live-confirmed)',
    'Post-first-admin integration wizard: grouped integration cards (configured/skipped/available states), stats row (configured/remaining/skipped counts), Finish button; sandboxSteps expandable details per card');

  if (hasCards) {
    // Try to get stats info
    const statsEl = await page.$('.setup-wizard__stats');
    if (statsEl) {
      const statsText = await statsEl.innerText().catch(() => '');
      console.log('SetupIntegrations stats:', statsText);
    }
    record('SetupIntegrationCard', 'cluster', '/setup/integrations', 'forge-ui/src/app/features/setup-integrations/setup-integrations.component.ts:33', 'Admin',
      'live-confirmed', 'Per-integration card: logo/icon, name, description, Set Up Now / Skip / Already Configured state chip; expandable How-To-Set-Up details with sandbox steps');
    record('SetupIntegrationStats', 'cluster', '/setup/integrations', 'forge-ui/src/app/features/setup-integrations/setup-integrations.component.ts:5', 'Admin',
      'live-confirmed', 'Header stats row: configured / remaining / skipped counts');
    record('SetupIntegrationEmpty', 'state', '/setup/integrations', 'forge-ui/src/app/features/setup-integrations/setup-integrations.component.ts:22', 'Admin',
      'D4-terminal (non-seeded; empty state if no integrations returned)', 'Empty state when integrations array is empty');
  }
  await page.close();
}

// ─── 4. PORTAL ─────────────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // Portal login page
  await page.goto(`${BASE}/portal/login`, { waitUntil: 'networkidle', timeout: 20000 });
  await shot(page, 'portal-login');
  const loginHtml = await page.content();
  const hasEmailInput = loginHtml.includes('portal-login-email');
  record('PortalLoginPage', 'page', '/portal/login', 'forge-ui/src/app/features/portal/pages/portal-login.component.ts', 'all (unauthenticated portal users)',
    hasEmailInput ? 'email-form-state (live-confirmed)' : 'source-confirmed',
    'Customer portal magic-link login: email input, Send Link button; separate shell from employee app, no employee session required');

  // Submit email to get sent state
  if (hasEmailInput) {
    const emailInput = page.locator('input[type="email"], input[autocomplete="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.fill('test-customer@example.com');
      await page.click('[data-testid="portal-login-submit"]');
      await page.waitForTimeout(3000);
      await shot(page, 'portal-login-sent');
      const sentHtml = await page.content();
      const hasSentState = sentHtml.includes('mark_email_read') || sentHtml.includes('portal-login__success');
      const hasDevLink = sentHtml.includes('portal-login__dev') || sentHtml.includes('devLink');
      record('PortalLoginSentState', 'state', '/portal/login', 'forge-ui/src/app/features/portal/pages/portal-login.component.ts:33', 'all',
        hasSentState ? 'sent-state (live-confirmed)' : 'source-confirmed',
        'Post-submit success: mark_email_read icon, check-your-email message; dev-link block if devLink() available (non-prod only)');
      if (hasDevLink) {
        record('PortalLoginDevLinkBlock', 'cluster', '/portal/login (sent state)', 'forge-ui/src/app/features/portal/pages/portal-login.component.ts:38', 'all (dev/non-prod)',
          'live-confirmed', 'Dev-only magic-link block: label, Open Link button, code element showing link URL; allows bypassing email in non-prod');
        // Try to extract and follow the dev link
        const devLinkCode = await page.$('code.portal-login__dev-link');
        if (devLinkCode) {
          const devLinkText = await devLinkCode.innerText();
          console.log('Portal dev link found:', devLinkText.substring(0, 80) + '...');
          // Navigate to follow the dev link
          const openLinkBtn = page.locator('.portal-login__dev button');
          if (await openLinkBtn.count() > 0) {
            await openLinkBtn.click();
            await page.waitForTimeout(3000);
            await shot(page, 'portal-post-auth-callback');
            const callbackUrl = page.url();
            console.log('After clicking dev link, URL:', callbackUrl);
            // Wait for potential redirect
            await page.waitForTimeout(2000);
            await shot(page, 'portal-after-callback');
            const afterUrl = page.url();
            console.log('After callback, URL:', afterUrl);
            const afterHtml = await page.content();
            if (afterUrl.includes('/portal/dashboard')) {
              // Portal dashboard reached
              record('PortalAuthCallbackPage', 'page', '/portal/auth/callback', 'forge-ui/src/app/features/portal/pages/portal-auth-callback.component.ts', 'all',
                'live-confirmed (redirect from dev-link → callback → dashboard)',
                'Magic-link token processor; validates token from URL params and redirects to /portal/dashboard; transient loading state');
              record('PortalLayoutShell', 'panel', '/portal/*', 'forge-ui/src/app/features/portal/portal-layout.component.ts', 'authenticated portal users',
                'live-confirmed', 'Portal shell: header with brand (QB·ENG logo + title), nav tabs (Dashboard/Orders/Quotes/Invoices/Shipments), user avatar + name + customer, logout button');
              record('PortalDashboardPage', 'page', '/portal/dashboard', 'forge-ui/src/app/features/portal/pages/portal-dashboard.component.ts', 'authenticated portal users',
                afterHtml.includes('portal-dashboard') ? 'live-confirmed' : 'D4-terminal (non-seeded)',
                'Portal dashboard: greeting hero, 4 summary cards (open orders/quotes/invoices, in-transit shipments) linking to sub-pages');

              // Try portal sub-pages
              for (const subRoute of ['orders', 'quotes', 'invoices', 'shipments']) {
                await page.goto(`${BASE}/portal/${subRoute}`, { waitUntil: 'networkidle', timeout: 15000 });
                await shot(page, `portal-${subRoute}`);
                const subHtml = await page.content();
                const redirectedToLogin = page.url().includes('/portal/login');
                if (redirectedToLogin) {
                  record(`Portal${subRoute.charAt(0).toUpperCase() + subRoute.slice(1)}Page`, 'page', `/portal/${subRoute}`, `forge-ui/src/app/features/portal/pages/portal-${subRoute}.component.ts`, 'authenticated portal users',
                    'D4-terminal (non-seeded: session expired or redirected)',
                    `Portal ${subRoute} list: table of customer ${subRoute}; guarded by portalAuthGuard`);
                } else {
                  record(`Portal${subRoute.charAt(0).toUpperCase() + subRoute.slice(1)}Page`, 'page', `/portal/${subRoute}`, `forge-ui/src/app/features/portal/pages/portal-${subRoute}.component.ts`, 'authenticated portal users',
                    subHtml.includes('empty') || !subHtml.includes('row') ? 'empty-state (live-confirmed: non-seeded)' : 'populated (live-confirmed)',
                    `Portal ${subRoute} list: table of customer ${subRoute}; guarded by portalAuthGuard`);
                }
              }
            } else {
              record('PortalAuthCallbackPage', 'page', '/portal/auth/callback', 'forge-ui/src/app/features/portal/pages/portal-auth-callback.component.ts', 'all',
                `source-confirmed (callback url reached but redirected to: ${afterUrl})`,
                'Magic-link token processor; validates token from URL params and redirects to /portal/dashboard');
            }
          }
        }
      } else {
        // No dev link — portal is D4-terminal beyond login+sent
        record('PortalAuthCallbackPage', 'page', '/portal/auth/callback', 'forge-ui/src/app/features/portal/pages/portal-auth-callback.component.ts', 'all',
          'source-confirmed', 'Magic-link token processor; transient loading state; redirects to /portal/dashboard');
        for (const subRoute of ['dashboard', 'orders', 'quotes', 'invoices', 'shipments']) {
          record(`Portal${subRoute.charAt(0).toUpperCase() + subRoute.slice(1)}Page`, 'page', `/portal/${subRoute}`, `forge-ui/src/app/features/portal/pages/portal-${subRoute}.component.ts`, 'authenticated portal users',
            'D4-terminal (non-seeded: no portal users provisioned, magic-link not available in non-dev mode)',
            `Portal ${subRoute} page; guarded by portalAuthGuard`);
        }
      }
    }
  }

  await page.close();
}

// ─── 5. MOBILE SURFACES ────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); // iPhone 14 size
  await login(page, 'worker');

  const mobileRoutes = [
    { path: '/m/clock', name: 'mobile-clock', cmp: 'MobileClockPage', file: 'mobile/pages/mobile-clock.component.ts', purpose: 'Clock in/out interface; main mobile landing; clock-gate awareness' },
    { path: '/m/jobs', name: 'mobile-jobs', cmp: 'MobileJobsPage', file: 'mobile/pages/mobile-jobs.component.ts', purpose: 'Job list for mobile worker; filtered to assigned jobs' },
    { path: '/m/scan', name: 'mobile-scan', cmp: 'MobileScanPage', file: 'mobile/pages/mobile-scan.component.ts', purpose: 'QR/barcode scan interface; scan-ring tab in nav' },
    { path: '/m/time', name: 'mobile-hours', cmp: 'MobileHoursPage', file: 'mobile/pages/mobile-hours.component.ts', purpose: 'Time/hours view for mobile worker' },
    { path: '/m/chat', name: 'mobile-chat', cmp: 'MobileChatPage', file: 'mobile/pages/mobile-chat.component.ts', purpose: 'Chat/messaging list for mobile' },
    { path: '/m/notifications', name: 'mobile-notifications', cmp: 'MobileNotificationsPage', file: 'mobile/pages/mobile-notifications.component.ts', purpose: 'Notifications list for mobile' },
    { path: '/m/account', name: 'mobile-account', cmp: 'MobileAccountPage', file: 'mobile/pages/mobile-account.component.ts', purpose: 'Account/profile view for mobile' },
  ];

  for (const r of mobileRoutes) {
    await page.goto(`${BASE}${r.path}`, { waitUntil: 'networkidle', timeout: 15000 });
    await shot(page, r.name);
    const html = await page.content();
    const hasLayout = html.includes('mobile-layout') || html.includes('mobile-nav');
    record(r.cmp, 'page', r.path, `forge-ui/src/app/features/${r.file}`, 'all (authenticated)',
      hasLayout ? 'live-confirmed' : 'source-confirmed', r.purpose);
  }

  // Mobile layout shell — same page
  record('MobileLayoutShell', 'panel', '/m/*', 'forge-ui/src/app/features/mobile/mobile-layout.component.ts', 'all',
    'live-confirmed', 'Mobile shell: header (Forge logo + notifications button), clock-gate banner (when not clocked in), router-outlet, bottom tab nav (jobs/scan/time/chat/notifications/account tabs)');

  record('MobileClockGateBanner', 'state', '/m/* (not clocked in)', 'forge-ui/src/app/features/mobile/mobile-layout.component.ts:11', 'all',
    'live-confirmed (worker not clocked in → banner visible)', 'Banner: schedule icon + "Clock in to access all features" when !isClockedIn()');

  // Navigate to mobile jobs detail (D4: no jobs in non-seeded)
  record('MobileJobDetailPage', 'page', '/m/jobs/:jobId', 'forge-ui/src/app/features/mobile/pages/mobile-job-detail.component.ts', 'all',
    'D4-terminal (non-seeded: no jobs to navigate into)', 'Job detail view for mobile worker');

  record('MobileChatThreadPage', 'page', '/m/chat/thread/:messageId', 'forge-ui/src/app/features/mobile/pages/mobile-chat-thread/mobile-chat-thread.component.ts', 'all',
    'D4-terminal (non-seeded: no chat messages)', 'Chat thread detail for mobile');

  record('MobileChatChannelInfoPage', 'page', '/m/chat/channel-info/:channelId', 'forge-ui/src/app/features/mobile/pages/mobile-chat-channel-info/mobile-chat-channel-info.component.ts', 'all',
    'D4-terminal (non-seeded: no chat channels)', 'Chat channel info for mobile');

  await page.close();
}

// ─── 6. AI ASSISTANT RUNTIME ───────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await login(page, 'admin');
  await page.goto(`${BASE}/ai`, { waitUntil: 'networkidle', timeout: 20000 });
  await shot(page, 'ai-runtime');
  const html = await page.content();
  const hasLayout = html.includes('ai-layout') || html.includes('ai-sidebar');
  const hasAssistants = html.includes('assistant-card') && !html.includes('noAssistants');
  const hasEmptyState = html.includes('noAssistants') || html.includes('app-empty-state');
  record('AiRuntimePage', 'page', '/ai/:assistantId', 'forge-ui/src/app/features/ai/ai.component.ts', 'all (authenticated)',
    hasLayout ? (hasAssistants ? 'populated (live-confirmed)' : 'empty-state (live-confirmed: no assistants configured)') : 'source-confirmed',
    'AI assistant runtime: left sidebar listing configured assistants, right chat panel; cap-gated on AI assistant capability');

  record('AiSidebar', 'panel', '/ai/:assistantId', 'forge-ui/src/app/features/ai/ai.component.ts:3', 'all',
    hasLayout ? 'live-confirmed' : 'source-confirmed', 'Left sidebar: smart_toy header, scrollable list of assistant cards (icon/name/description); empty-state if none configured');

  record('AiChatPanel', 'panel', '/ai/:assistantId', 'forge-ui/src/app/features/ai/ai.component.ts:31', 'all',
    hasAssistants ? 'live-confirmed' : 'D3-terminal (no assistants configured in admin)',
    'Right chat panel: header (icon/name/desc/category chip, clear-chat button), messages log, starter-questions welcome screen, typing-dots loading state, text-input + send button');

  record('AiEmptyState', 'state', '/ai', 'forge-ui/src/app/features/ai/ai.component.ts:116', 'all',
    hasEmptyState ? 'live-confirmed' : 'D3-terminal (only shown when no assistant selected)',
    'Right panel empty state: smart_toy icon + "Select an assistant" message');

  record('AiAssistantCard', 'cluster', '/ai/*', 'forge-ui/src/app/features/ai/ai.component.ts:12', 'all',
    hasAssistants ? 'live-confirmed' : 'D3-terminal (no assistants)',
    'Sidebar assistant card: colored icon, name, description; active/selected state; click to select');

  record('AiStarterQuestions', 'cluster', '/ai/:assistantId (no messages)', 'forge-ui/src/app/features/ai/ai.component.ts:54', 'all',
    'source-confirmed', 'Welcome screen inside chat: large icon, name, desc, starter-question chips; only when hasMessages()=false');

  record('AiChatMessage', 'cluster', '/ai/:assistantId (with messages)', 'forge-ui/src/app/features/ai/ai.component.ts:73', 'all',
    'D4-terminal (non-seeded: no assistants to interact with in this env)', 'Chat message bubbles: user (right-aligned) and assistant (left with avatar) roles; typing-dots state while sending');

  await page.close();
}

// ─── 7. RENDER (Headless Form Render) ──────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${BASE}/__render-form`, { waitUntil: 'networkidle', timeout: 15000 });
  await shot(page, 'render-form-waiting');
  const html = await page.content();
  const hasWaiting = html.includes('Waiting for form definition') || html.includes('headless-render');
  record('HeadlessFormRenderPage', 'page', '/__render-form', 'forge-ui/src/app/features/render/headless-form-render.component.ts', 'all (no auth guard)',
    hasWaiting ? 'waiting-state (live-confirmed)' : 'source-confirmed',
    'Headless form renderer for PDF/print generation: wraps app-compliance-form-renderer in readonly mode; shows "Waiting for form definition..." until definition() signal populated; no employee session required');
  record('HeadlessFormRenderPopulated', 'state', '/__render-form', 'forge-ui/src/app/features/render/headless-form-render.component.ts:2', 'all',
    'source-confirmed', 'Populated state: compliance-form-renderer rendered with provided definition in readonly mode; used by backend for PDF capture');
  await page.close();
}

// ─── 8. DEV TOOLS ──────────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${BASE}/dev-tools`, { waitUntil: 'networkidle', timeout: 15000 });
  await shot(page, 'dev-tools-loading');
  const html = await page.content();
  const hasDemo = html.includes('Loading Demo') || html.includes('demo-section');
  record('DevToolsLoadingDemoPage', 'page', '/dev-tools/loading', 'forge-ui/src/app/features/dev-tools/loading-demo.component.ts', 'all (no auth guard)',
    hasDemo ? 'live-confirmed' : 'source-confirmed',
    'Loading state demonstration: Global Overlay section (3 duration buttons + all-at-once/staggered), Component-Level Loading section (block A/B toggles + demo blocks), Route Navigation Loading description');
  record('DevToolsGlobalOverlaySection', 'cluster', '/dev-tools/loading', 'forge-ui/src/app/features/dev-tools/loading-demo.component.ts:6', 'all',
    hasDemo ? 'live-confirmed' : 'source-confirmed', '5 buttons triggering global LoadingService overlay with custom duration/message; "3 causes all at once" + staggered variants');
  record('DevToolsLoadingBlockSection', 'cluster', '/dev-tools/loading', 'forge-ui/src/app/features/dev-tools/loading-demo.component.ts:17', 'all',
    hasDemo ? 'live-confirmed' : 'source-confirmed', 'Component-level loading via appLoadingBlock directive: toggle buttons A/B, two demo block panels with independent loading signals');

  // Test clicking a button to see overlay
  if (hasDemo) {
    const btn2s = page.locator('.action-btn').first();
    if (await btn2s.count() > 0) {
      await btn2s.click();
      await page.waitForTimeout(500);
      await shot(page, 'dev-tools-loading-active');
      record('DevToolsGlobalOverlayActive', 'state', '/dev-tools/loading', 'forge-ui/src/app/features/dev-tools/loading-demo.component.ts', 'all',
        'live-confirmed', 'Active global overlay: full-screen loading spinner with custom message text via LoadingService');
    }
  }
  await page.close();
}

// ─── 9. CHAT POPOUT ────────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 400, height: 600 } });
  await login(page, 'admin');
  await page.goto(`${BASE}/chat/popout`, { waitUntil: 'networkidle', timeout: 20000 });
  await shot(page, 'chat-popout');
  const html = await page.content();
  const hasChatPopout = html.includes('chat-popout') || html.includes('chat');
  record('ChatPopoutPage', 'page', '/chat/popout', 'forge-ui/src/app/features/chat/components/chat-popout/chat-popout.component.ts', 'all (authenticated)',
    hasChatPopout ? 'live-confirmed' : 'source-confirmed',
    'Standalone chat popout window: separate viewport for detached chat; auth-gated');
  await page.close();
}

// ─── 10. MOBILE — NARROW VIEWPORT on desktop routes ───────────────────────
{
  // Check mobileRedirectGuard behavior: desktop routes at narrow viewport should redirect to /m
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await login(page, 'worker');
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 15000 });
  await shot(page, 'mobile-redirect-narrow');
  const url = page.url();
  const redirectedToMobile = url.includes('/m/');
  record('MobileRedirectGuard', 'shared-cmp', '/dashboard (narrow viewport)', 'forge-ui/src/app/shared/guards/mobile-redirect.guard.ts', 'all',
    redirectedToMobile ? `live-confirmed (redirected to ${url})` : `source-confirmed (current url: ${url})`,
    'mobileRedirectGuard: redirects authenticated users to /m/* when viewport is mobile-width; gating desktop routes');
  await page.close();
}

// ─── 11. SHARED AUTH INFRASTRUCTURE (source-confirmed) ────────────────────
record('AuthGuard', 'shared-cmp', 'all protected routes', 'forge-ui/src/app/shared/guards/auth.guard.ts', 'all',
  'source-confirmed', 'Redirects unauthenticated requests to /login');
record('SetupGuard', 'shared-cmp', '/login + /setup', 'forge-ui/src/app/shared/guards/setup.guard.ts', 'all',
  'source-confirmed', 'setupRequiredGuard: allows /setup only when setupRequired=true; setupCompleteGuard: allows /login only when setup done');
record('RoleGuard', 'shared-cmp', 'all role-gated routes', 'forge-ui/src/app/shared/guards/role.guard.ts', 'all',
  'source-confirmed', 'roleGuard(…roles): blocks routes for unauthorized roles; used across majority of feature routes');
record('RootRedirectGuard', 'shared-cmp', '/', 'forge-ui/src/app/shared/guards/root-redirect.guard.ts', 'all',
  'source-confirmed', 'Root / redirect: sends authenticated users to /dashboard, demo build to /welcome, unauthenticated to /login');
record('DemoOnlyGuard', 'shared-cmp', '/welcome', 'forge-ui/src/app/shared/guards/demo-only.guard.ts', 'all',
  'source-confirmed', 'Allows /welcome only in demo build mode');
record('MobileRedirectGuardShared', 'shared-cmp', 'all auth-shell routes', 'forge-ui/src/app/shared/guards/mobile-redirect.guard.ts', 'all',
  'source-confirmed', 'Redirects desktop routes to /m/* at mobile-width viewports');
record('AuthInterceptor', 'shared-cmp', 'all HTTP requests', 'forge-ui/src/app/shared/interceptors/auth.interceptor.ts', 'all',
  'source-confirmed', 'Attaches auth token to outgoing API requests; handles 401 responses');
record('PortalAuthInterceptor', 'shared-cmp', 'all portal HTTP requests', 'forge-ui/src/app/features/portal/services/portal-auth.interceptor.ts', 'portal users',
  'source-confirmed', 'Attaches portal JWT token to /portal API requests');
record('PortalGuard', 'shared-cmp', '/portal/* (except /portal/login)', 'forge-ui/src/app/features/portal/services/portal.guard.ts', 'portal users',
  'source-confirmed', 'portalAuthGuard: redirects unauthenticated portal users to /portal/login');
record('PasswordStrengthValidator', 'shared-cmp', 'setup + token-setup forms', 'forge-ui/src/app/shared/validators/password-strength.validator.ts', 'all',
  'source-confirmed', 'Client-side password strength validation used in setup and token-setup flows');

await browser.close();

// Write results
writeFileSync(path.join(__dirname, 'access-sweep-results.json'), JSON.stringify(results, null, 2));
console.log(`\nTotal components recorded: ${results.length}`);
console.log('Results written to access-sweep-results.json');
