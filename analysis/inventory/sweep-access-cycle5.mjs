/**
 * Phase 06 cycle 5 — close remaining Q items
 * Q-003: drive onboarding step progression (fill step 1 → advance to step 2+)
 * Q-004: confirm portal guard redirect (D4 live)
 * Q-006: SSO callback with fake token (error state live)
 */
import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:4200';
const SS = path.join(__dirname, 'screenshots');
const log = [];

async function shot(page, name) {
  const p = path.join(SS, `access-c5-${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

async function login(page, email = 'admin@forge.local', pw = 'ForgeRun!2026') {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pw);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
}

const browser = await chromium.launch({ headless: true });

// ─── Q-003: Onboarding step progression ────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  // Use worker (Sam Worker) — name is pre-filled
  await login(page, 'worker@forge.local');
  await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle', timeout: 20000 });
  await shot(page, 'onboarding-step1-fresh');
  const step1Html = await page.content();
  const hasStep1 = step1Html.includes('onboarding-first-name') || step1Html.includes('Personal');
  log.push({ q: 'Q-003', step: 'step1', state: hasStep1 ? 'live' : 'not-rendered' });

  if (hasStep1) {
    // Fill required step-1 fields
    // firstName/lastName pre-filled from user account (Sam Worker)
    // Need: DOB, SSN (if not stored), phone
    try {
      // Date of birth — try datepicker input
      const dobInput = page.locator('input[data-testid="onboarding-dob"], app-datepicker input').first();
      if (await dobInput.count() > 0) {
        await dobInput.fill('01/15/1990');
        await dobInput.press('Tab');
      }
      // SSN
      const ssnInput = page.locator('input[data-testid="onboarding-ssn"], app-input[data-testid="onboarding-ssn"] input').first();
      if (await ssnInput.count() > 0 && await ssnInput.isEditable()) {
        await ssnInput.fill('123456789');
        await ssnInput.press('Tab');
      }
      // Phone
      const phoneInput = page.locator('input[data-testid="onboarding-phone"], app-input[data-testid="onboarding-phone"] input').first();
      if (await phoneInput.count() > 0) {
        await phoneInput.fill('5551234567');
        await phoneInput.press('Tab');
      }
      await page.waitForTimeout(500);
      await shot(page, 'onboarding-step1-filled');

      // Click Continue
      const continueBtn = page.locator('[data-testid="onboarding-continue-btn"], button:has-text("Continue")').first();
      if (await continueBtn.count() > 0 && !(await continueBtn.isDisabled())) {
        await continueBtn.click();
        await page.waitForTimeout(1500);
        await shot(page, 'onboarding-step2-address');
        const step2Html = await page.content();
        const hasStep2 = step2Html.includes('onboarding-street1') || step2Html.includes('Address') || step2Html.includes('street');
        log.push({ q: 'Q-003', step: 'step2', state: hasStep2 ? 'LC-address' : `still-step1 (url: ${page.url()})` });

        if (hasStep2) {
          // Fill address step
          const street1 = page.locator('input[data-testid="onboarding-street1"], app-input[data-testid="onboarding-street1"] input').first();
          if (await street1.count() > 0) await street1.fill('123 Test Street');
          const city = page.locator('input[data-testid="onboarding-city"], app-input[data-testid="onboarding-city"] input').first();
          if (await city.count() > 0) await city.fill('Springfield');
          const zip = page.locator('input[data-testid="onboarding-zip"], app-input[data-testid="onboarding-zip"] input').first();
          if (await zip.count() > 0) await zip.fill('62701');
          // State select — try clicking the dropdown
          const stateSelect = page.locator('app-select[data-testid="onboarding-state"]').first();
          if (await stateSelect.count() > 0) {
            await stateSelect.click();
            await page.waitForTimeout(300);
            const ilOption = page.locator('mat-option:has-text("Illinois"), .mat-option:has-text("IL")').first();
            if (await ilOption.count() > 0) await ilOption.click();
          }
          await page.waitForTimeout(500);
          await shot(page, 'onboarding-step2-filled');

          // Continue to step 3
          const cont3 = page.locator('[data-testid="onboarding-continue-btn"]').first();
          if (await cont3.count() > 0 && !(await cont3.isDisabled())) {
            await cont3.click();
            await page.waitForTimeout(1500);
            await shot(page, 'onboarding-step3-w4');
            const step3Html = await page.content();
            const hasStep3 = step3Html.includes('w4') || step3Html.includes('Federal') || step3Html.includes('filingStatus');
            log.push({ q: 'Q-003', step: 'step3', state: hasStep3 ? 'LC-w4' : 'not-advanced' });

            if (hasStep3) {
              // W-4: fill filing status, required numerics
              const filingStatus = page.locator('app-select[data-testid="onboarding-w4-filing-status"]').first();
              if (await filingStatus.count() > 0) {
                await filingStatus.click();
                await page.waitForTimeout(300);
                const singleOption = page.locator('mat-option').first();
                if (await singleOption.count() > 0) await singleOption.click();
              }
              // Fill numeric fields with 0
              for (const tid of ['onboarding-w4-qualifying-children', 'onboarding-w4-other-dependents']) {
                const inp = page.locator(`app-input[data-testid="${tid}"] input`).first();
                if (await inp.count() > 0) { await inp.clear(); await inp.fill('0'); }
              }
              await page.waitForTimeout(500);

              const cont4 = page.locator('[data-testid="onboarding-continue-btn"]').first();
              if (await cont4.count() > 0 && !(await cont4.isDisabled())) {
                await cont4.click();
                await page.waitForTimeout(1500);
                await shot(page, 'onboarding-step4-state-tax');
                const step4Html = await page.content();
                const hasStep4 = step4Html.includes('stateTax') || step4Html.includes('State Tax') || step4Html.includes('stateFilingStatus');
                log.push({ q: 'Q-003', step: 'step4', state: hasStep4 ? 'LC-stateTax' : 'not-advanced' });

                if (hasStep4) {
                  // State tax — can be optional depending on state; try to advance
                  await page.waitForTimeout(500);
                  const cont5 = page.locator('[data-testid="onboarding-continue-btn"]').first();
                  if (await cont5.count() > 0 && !(await cont5.isDisabled())) {
                    await cont5.click();
                    await page.waitForTimeout(1500);
                    await shot(page, 'onboarding-step5-i9');
                    const step5Html = await page.content();
                    const hasStep5 = step5Html.includes('I-9') || step5Html.includes('i9') || step5Html.includes('citizenship');
                    log.push({ q: 'Q-003', step: 'step5', state: hasStep5 ? 'LC-i9' : 'not-advanced' });
                  }
                }
              }
            }
          }
        }
      } else {
        log.push({ q: 'Q-003', step: 'step1-continue', state: 'button-disabled (fields not valid)' });
        // Screenshot anyway to see state
        await shot(page, 'onboarding-step1-continue-disabled');
      }
    } catch (e) {
      log.push({ q: 'Q-003', error: e.message.substring(0, 100) });
    }
  }
  await page.close();
}

// ─── Q-004: Portal guard redirect (live-confirm D4) ────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  // Navigate to portal authenticated routes WITHOUT a portal session
  for (const route of ['dashboard', 'orders', 'quotes', 'invoices', 'shipments']) {
    await page.goto(`${BASE}/portal/${route}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(500);
    const finalUrl = page.url();
    log.push({ q: 'Q-004', route: `/portal/${route}`, redirectedTo: finalUrl, guarded: finalUrl.includes('/portal/login') });
  }
  await shot(page, 'portal-guard-redirect');
  await page.close();
}

// ─── Q-006: SSO callback error state ───────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  // Try /sso/callback with a fake token — should show error state
  await page.goto(`${BASE}/sso/callback?sso_token=FAKE_TOKEN_FOR_INVENTORY`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await shot(page, 'sso-callback-fake-token');
  const html = await page.content();
  const finalUrl = page.url();
  const hasSpinner = html.includes('sync') || html.includes('sso-callback');
  const hasError = html.includes('error') || html.includes('Error') || html.includes('failed');
  const redirectedToLogin = finalUrl.includes('/login');
  log.push({ q: 'Q-006', finalUrl, hasSpinner, hasError, redirectedToLogin });
  await page.close();
}

// ─── Q-002: Try fake media stream for camera ───────────────────────────────
{
  const browser2 = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });
  const page = await browser2.newPage({ viewport: { width: 390, height: 844 } });
  await login(page, 'worker@forge.local');
  await page.goto(`${BASE}/m/scan`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  await shot(page, 'mobile-scan-fake-camera');
  const html = await page.content();
  const hasCameraEl = html.includes('video') || html.includes('html5-qrcode') || html.includes('scan');
  const hasError = html.includes('permission') || html.includes('camera') || html.includes('not found');
  log.push({ q: 'Q-002', hasCameraEl, hasError, url: page.url() });
  await page.close();
  await browser2.close();
}

await browser.close();

writeFileSync(path.join(__dirname, 'access-c5-results.json'), JSON.stringify(log, null, 2));
console.log(JSON.stringify(log, null, 2));
