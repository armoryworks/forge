/**
 * Phase 06 Cycle 5 — SSO callback + Onboarding steps 2-7
 */
import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:4200';
const SHOTS = path.join(__dirname, 'screenshots');

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
}

async function shot(page, name) {
  const p = path.join(SHOTS, `access-${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`  shot: access-${name}.png`);
}

const browser = await chromium.launch({ headless: true });

try {

  // ── 1. SSO CALLBACK ───────────────────────────────────────────────────────
  console.log('\n=== SSO Callback ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // No token → expect redirect or error
    await page.goto(`${BASE}/sso/callback`, { waitUntil: 'networkidle', timeout: 20000 });
    const p0 = new URL(page.url()).pathname;
    const h0 = await page.content();
    console.log(`  no-token → pathname: ${p0}`);
    console.log(`  spinner: ${/sync|loading/i.test(h0)}, error: ${/error|invalid|expired/i.test(h0)}`);
    await shot(page, 'sso-callback-no-token');

    // Fake token → should hit error state
    await page.goto(`${BASE}/sso/callback?sso_token=invalid-xyz`, { waitUntil: 'networkidle', timeout: 20000 });
    const p1 = new URL(page.url()).pathname;
    const h1 = await page.content();
    console.log(`  fake-token → pathname: ${p1}`);
    console.log(`  spinner: ${/sync|loading/i.test(h1)}, error: ${/error|invalid|expired/i.test(h1)}`);
    await shot(page, 'sso-callback-fake-token');

    await ctx.close();
  }

  // ── 2. ONBOARDING STEPS 2-7 ───────────────────────────────────────────────
  console.log('\n=== Onboarding Wizard ===');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // Log in as worker
    await login(page, 'worker@forge.local', 'ForgeRun!2026');
    console.log(`  logged in, at: ${new URL(page.url()).pathname}`);

    await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle', timeout: 20000 });
    const obUrl = new URL(page.url()).pathname;
    console.log(`  onboarding pathname: ${obUrl}`);
    await shot(page, 'onboarding-c5-step1-init');

    // Enumerate visible inputs on step 1
    const s1inputs = await page.$$eval(
      'input:not([type="hidden"])',
      els => els.map(e => ({
        fc: e.getAttribute('formcontrolname'),
        type: e.type,
        ph: e.placeholder,
        val: e.value
      }))
    );
    console.log('  step1 inputs:', JSON.stringify(s1inputs));

    // Fill whatever step 1 needs — name fields may already be pre-filled
    // Try each field by formcontrolname
    const tryFill = async (names, value) => {
      for (const n of names) {
        const el = await page.$(`input[formcontrolname="${n}"]`);
        if (el) {
          const cur = await el.inputValue();
          if (!cur) await el.fill(value);
          console.log(`  filled ${n}="${value}" (was:"${cur}")`);
          return n;
        }
      }
      return null;
    };

    await tryFill(['firstName', 'first_name'], 'Worker');
    await tryFill(['lastName', 'last_name'], 'User');
    await tryFill(['phone', 'phoneNumber', 'mobilePhone'], '5555550199');
    await tryFill(['dateOfBirth', 'dob', 'birthDate'], '01/15/1990');
    await tryFill(['ssn', 'socialSecurityNumber', 'sin'], '123-45-6789');

    await shot(page, 'onboarding-c5-step1-filled');

    // Click next / continue
    const clickNext = async () => {
      for (const sel of [
        'button[matStepperNext]',
        'button:has-text("Continue")',
        'button:has-text("Next")',
        'button[type="submit"]:not([disabled])',
      ]) {
        try {
          const btn = await page.$(sel);
          if (btn && await btn.isEnabled()) {
            await btn.click();
            await page.waitForTimeout(1000);
            return sel;
          }
        } catch { /* skip */ }
      }
      // Last resort: any enabled button with text Next/Continue
      const btns = await page.$$eval(
        'button:not([disabled])',
        bs => bs.map(b => b.textContent?.trim()).filter(t => /next|continue|proceed/i.test(t || ''))
      );
      console.log(`  available next-like buttons: ${JSON.stringify(btns)}`);
      return null;
    };

    let clicked = await clickNext();
    console.log(`  step1→2 via: ${clicked}`);
    await shot(page, 'onboarding-c5-step2-init');

    // Step 2 — address
    const s2 = await page.$$eval('input:not([type="hidden"])', els => els.map(e => ({ fc: e.getAttribute('formcontrolname'), ph: e.placeholder })));
    console.log('  step2 inputs:', JSON.stringify(s2));
    await tryFill(['street', 'address1', 'streetAddress', 'addressLine1'], '123 Main St');
    await tryFill(['city'], 'Springfield');
    await tryFill(['state', 'stateCode'], 'IL');
    await tryFill(['zip', 'zipCode', 'postalCode'], '62701');
    await shot(page, 'onboarding-c5-step2-filled');

    // Steps 3-7
    const stepLabels = ['w4', 'state-withholding', 'i9-docs', 'direct-deposit', 'acknowledgments'];
    for (let i = 0; i < stepLabels.length; i++) {
      clicked = await clickNext();
      console.log(`  step${i+2}→${i+3} via: ${clicked}`);
      await shot(page, `onboarding-c5-step${i+3}-${stepLabels[i]}`);
      const sInputs = await page.$$eval('input:not([type="hidden"])', els => els.map(e => ({ fc: e.getAttribute('formcontrolname'), type: e.type, ph: e.placeholder })));
      console.log(`  step${i+3} inputs: ${JSON.stringify(sInputs)}`);
      const sHtml = await page.content();
      console.log(`  step${i+3} has-validation-error: ${/mat-error|ng-invalid.*ng-touched|security__error/i.test(sHtml)}`);
    }

    await ctx.close();
  }

} finally {
  await browser.close();
  console.log('\nDone.');
}
