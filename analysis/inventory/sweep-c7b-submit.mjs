/**
 * Phase 06 — Click Submit on step 7 to observe DocuSeal/review terminal state.
 * Advances through all steps quickly (data pre-filled from prior runs).
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
  console.log(`  shot: ${name}`);
}

async function selectFirst(page, testId) {
  try {
    const trigger = await page.$(`[data-testid="${testId}"] mat-select`);
    if (trigger) await trigger.click();
    else { const h = await page.$(`[data-testid="${testId}"]`); if (!h) return; await h.click(); }
    await page.waitForSelector('mat-option', { timeout: 3000 });
    await page.click('mat-option:first-child');
    await page.waitForTimeout(300);
  } catch {}
}

async function tryFill(page, testId, value) {
  try {
    const el = await page.$(`[data-testid="${testId}"] input`);
    if (!el) return;
    const cur = await el.inputValue();
    if (!cur) await el.fill(value);
  } catch {}
}

async function clickContinue(page) {
  const btn = await page.$('[data-testid="onboarding-continue-btn"]');
  if (!btn || await btn.isDisabled()) return false;
  await btn.click();
  await page.waitForTimeout(1000);
  return true;
}

const browser = await chromium.launch({ headless: true });

try {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await login(page, 'worker@forge.local', 'ForgeRun!2026');
  await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle', timeout: 20000 });
  console.log(`at: ${new URL(page.url()).pathname}`);

  // Advance steps 1-4 (pre-filled data — Continue immediately enabled)
  await clickContinue(page);                                      // step 1
  await clickContinue(page);                                      // step 2
  await selectFirst(page, 'onboarding-w4-filing-status');
  await tryFill(page, 'onboarding-w4-qualifying-children', '0');
  await tryFill(page, 'onboarding-w4-other-dependents', '0');
  await clickContinue(page);                                      // step 3
  const noTax = await page.$('.step-content__skip-notice');
  if (!noTax) await selectFirst(page, 'onboarding-state-filing-status');
  await clickContinue(page);                                      // step 4
  console.log(`at step param: ${new URL(page.url()).searchParams.get('step')} (expect 4)`);

  // Step 5: I-9
  await selectFirst(page, 'onboarding-i9-citizenship');
  try { await page.click('[data-testid="onboarding-i9-list-a-btn"]'); await page.waitForTimeout(400); } catch {}
  await selectFirst(page, 'onboarding-i9-list-a-type');
  await tryFill(page, 'onboarding-i9-list-a-doc-number', 'TEST123456789');
  await tryFill(page, 'onboarding-i9-list-a-authority', 'US State Dept');
  const exp = await page.$('[data-testid="onboarding-i9-list-a-expiry"] input');
  if (exp) await exp.fill('12/31/2030');
  await clickContinue(page);                                      // step 5
  console.log(`at step param: ${new URL(page.url()).searchParams.get('step')} (expect 5)`);

  // Step 6: Direct Deposit
  await tryFill(page, 'onboarding-bank-name', 'First National Bank');
  await tryFill(page, 'onboarding-routing-number', '021000021');
  await tryFill(page, 'onboarding-account-number', '987654321');
  await selectFirst(page, 'onboarding-account-type');
  await clickContinue(page);                                      // step 6
  console.log(`at step param: ${new URL(page.url()).searchParams.get('step')} (expect 6)`);

  // Step 7: Acknowledgments — toggle unchecked toggles
  await shot(page, 'onboarding-c7b-step7-init');
  const toggles = await page.$$('.mat-mdc-slide-toggle:not([aria-checked="true"])');
  console.log(`  unchecked toggles: ${toggles.length}`);
  for (const t of toggles) {
    try { await t.click(); await page.waitForTimeout(200); } catch {}
  }

  const submitBtn = await page.$('[data-testid="onboarding-submit-btn"]');
  const submitDis = submitBtn ? await submitBtn.isDisabled() : true;
  console.log(`  submit disabled: ${submitDis}`);
  await shot(page, 'onboarding-c7b-step7-filled');

  if (!submitDis && submitBtn) {
    console.log('  CLICKING SUBMIT...');
    await submitBtn.click();

    // Wait and observe
    await page.waitForTimeout(2000);
    await shot(page, 'onboarding-c7b-post-submit-2s');
    const h2 = await page.content();
    console.log(`  review-phase rendered: ${h2.includes('onboarding__signing')}`);
    console.log(`  pdf-loading spinner: ${h2.includes('pdf-loading')}`);
    console.log(`  pdf-embed visible: ${h2.includes('onboarding__pdf-embed')}`);
    console.log(`  docuseal-form: ${h2.includes('docuseal-form')}`);
    console.log(`  completion-screen: ${h2.includes('onboarding__complete')}`);
    console.log(`  error-text: ${/error|failed|Error/i.test(h2)}`);
    console.log(`  url: ${page.url()}`);

    await page.waitForTimeout(3000);
    await shot(page, 'onboarding-c7b-post-submit-5s');
    const h5 = await page.content();
    console.log(`  5s: review=${h5.includes('onboarding__signing')} docuseal=${h5.includes('docuseal-form')} complete=${h5.includes('onboarding__complete')}`);

    // Check review phase structure
    console.log(`  progress-steps: ${h5.includes('onboarding__signing-step')}`);
    console.log(`  preview-phase: ${h5.includes('reviewPhase') || h5.includes("'preview'")}`);
    console.log(`  signing-phase: ${h5.includes("'signing'")}`);
    console.log(`  sign-form-button: ${h5.includes('signForm') || h5.includes('Sign Form') || h5.includes('proceedToSign')}`);

    // One more screenshot if we landed in review phase
    if (h5.includes('onboarding__signing') || h5.includes('onboarding__complete')) {
      await shot(page, 'onboarding-c7b-review-or-complete');
    }
  }

  await ctx.close();

} finally {
  await browser.close();
  console.log('\nDone.');
}
