/**
 * Phase 06 Cycle 6 — Onboarding steps 4-7 + Submit (DocuSeal wall observation)
 * Picks up where cycle 5 left off (worker stuck at step 4).
 * Uses mat-select click-then-option pattern. Actually clicks Submit to observe result.
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

async function tryFillTestId(page, testId, value) {
  try {
    const el = await page.$(`[data-testid="${testId}"] input`);
    if (!el) { console.log(`  skip (not found): ${testId}`); return false; }
    const cur = await el.inputValue();
    if (cur) { console.log(`  already filled: ${testId}="${cur}"`); return true; }
    await el.fill(value);
    console.log(`  filled: ${testId}="${value}"`);
    return true;
  } catch (e) {
    console.log(`  error filling ${testId}: ${e.message.split('\n')[0]}`);
    return false;
  }
}

async function selectFirstOption(page, testId) {
  try {
    // Click the mat-select trigger inside the app-select wrapper
    const trigger = await page.$(`[data-testid="${testId}"] mat-select, [data-testid="${testId}"] .mat-mdc-select`);
    if (!trigger) {
      // Fallback: click the wrapper itself
      const wrapper = await page.$(`[data-testid="${testId}"]`);
      if (!wrapper) { console.log(`  select not found: ${testId}`); return false; }
      await wrapper.click();
    } else {
      await trigger.click();
    }
    await page.waitForSelector('mat-option', { timeout: 3000 });
    const options = await page.$$eval('mat-option', opts => opts.map(o => o.textContent?.trim()));
    console.log(`  select ${testId} options: ${JSON.stringify(options.slice(0, 5))}`);
    await page.click('mat-option:first-child');
    await page.waitForTimeout(300);
    return true;
  } catch (e) {
    console.log(`  select error ${testId}: ${e.message.split('\n')[0]}`);
    return false;
  }
}

async function clickContinue(page, stepName) {
  try {
    const btn = await page.$('[data-testid="onboarding-continue-btn"]');
    if (!btn) { console.log(`  no continue btn on ${stepName}`); return false; }
    const disabled = await btn.isDisabled();
    const text = await btn.textContent();
    console.log(`  continue btn: disabled=${disabled}, text="${text?.trim()}"`);
    if (disabled) {
      // Check what violations exist
      const violations = await page.$$eval(
        'app-validation-button, mat-error, .security__error, [class*="error"]',
        els => els.map(e => e.textContent?.trim()).filter(Boolean)
      );
      console.log(`  violations: ${JSON.stringify(violations.slice(0, 5))}`);
      return false;
    }
    await btn.click();
    await page.waitForTimeout(1200);
    return true;
  } catch (e) {
    console.log(`  continue error: ${e.message.split('\n')[0]}`);
    return false;
  }
}

const browser = await chromium.launch({ headless: true });

try {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await login(page, 'worker@forge.local', 'ForgeRun!2026');
  console.log(`\nLogged in as worker, at: ${new URL(page.url()).pathname}`);

  await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle', timeout: 20000 });
  console.log(`Onboarding pathname: ${new URL(page.url()).pathname}`);
  await shot(page, 'onboarding-c6-step1-init');

  // ── STEP 1: Personal Info ──────────────────────────────────────────────────
  console.log('\n--- Step 1: Personal Info ---');

  // Check current step indicator
  const stepperHeader = await page.$eval('.mat-stepper-horizontal-line, .mat-step-header[aria-selected="true"]',
    el => el?.textContent?.trim() || 'unknown').catch(() => 'no stepper');
  console.log(`  stepper: ${stepperHeader}`);

  // Fill required fields
  await tryFillTestId(page, 'onboarding-first-name', 'Test');
  await tryFillTestId(page, 'onboarding-last-name', 'Worker');
  await tryFillTestId(page, 'onboarding-email', 'worker@forge.local');
  await tryFillTestId(page, 'onboarding-phone', '5555550100');

  // DOB — datepicker input, try filling typed date
  await tryFillTestId(page, 'onboarding-dob', '01/15/1990');

  // SSN — check if already stored (hasStoredSsn)
  const ssnHint = await page.$('.secure-field__hint');
  if (ssnHint) {
    console.log(`  ssn: securely stored, skip`);
  } else {
    await tryFillTestId(page, 'onboarding-ssn', '123-45-6789');
  }

  await shot(page, 'onboarding-c6-step1-filled');

  // Check if continue is enabled
  let advanced = await clickContinue(page, 'step1');
  console.log(`  step1 → advanced: ${advanced}`);
  await shot(page, 'onboarding-c6-step2-init');

  // ── STEP 2: Address ────────────────────────────────────────────────────────
  console.log('\n--- Step 2: Address ---');

  // Check if we actually advanced (stepper selected index)
  const step2Index = await page.$eval('[aria-label="Home Address"]',
    el => el.getAttribute('aria-selected')).catch(() => 'n/a');
  console.log(`  "Home Address" aria-selected: ${step2Index}`);

  await tryFillTestId(page, 'onboarding-street1', '123 Main Street');
  await tryFillTestId(page, 'onboarding-city', 'Springfield');
  // State is an app-select (mat-select) — click and pick first option
  await selectFirstOption(page, 'onboarding-state');
  await tryFillTestId(page, 'onboarding-zip', '62701');

  await shot(page, 'onboarding-c6-step2-filled');
  advanced = await clickContinue(page, 'step2');
  console.log(`  step2 → advanced: ${advanced}`);
  await shot(page, 'onboarding-c6-step3-init');

  // ── STEP 3: W-4 ──────────────────────────────────────────────────────────
  console.log('\n--- Step 3: W-4 ---');

  await selectFirstOption(page, 'onboarding-w4-filing-status');
  await tryFillTestId(page, 'onboarding-w4-qualifying-children', '0');
  await tryFillTestId(page, 'onboarding-w4-other-dependents', '0');

  await shot(page, 'onboarding-c6-step3-filled');
  advanced = await clickContinue(page, 'step3');
  console.log(`  step3 → advanced: ${advanced}`);
  await shot(page, 'onboarding-c6-step4-init');

  // ── STEP 4: State Withholding ─────────────────────────────────────────────
  console.log('\n--- Step 4: State Withholding ---');

  // May render skip notice for states with no income tax, or filing status select
  const noTaxNotice = await page.$('.step-content__skip-notice');
  if (noTaxNotice) {
    console.log(`  state has no income tax — auto-skippable`);
  } else {
    await selectFirstOption(page, 'onboarding-state-filing-status');
  }

  await shot(page, 'onboarding-c6-step4-filled');
  advanced = await clickContinue(page, 'step4');
  console.log(`  step4 → advanced: ${advanced}`);
  await shot(page, 'onboarding-c6-step5-init');

  // ── STEP 5: I-9 ──────────────────────────────────────────────────────────
  console.log('\n--- Step 5: I-9 ---');

  // I-9 has document type selection and upload — just screenshot, don't fill
  const i9Html = await page.content();
  console.log(`  has list-a: ${/list.*a|passport/i.test(i9Html)}`);
  console.log(`  has doc-upload: ${/cloud_upload|upload/i.test(i9Html)}`);
  console.log(`  has citizenship: ${/citizenship|citizen/i.test(i9Html)}`);

  // Try selecting citizenship type first
  const citizenshipSel = await page.$('[data-testid="onboarding-i9-citizenship-type"], mat-radio-group');
  if (citizenshipSel) {
    await page.click('mat-radio-button:first-child').catch(() => null);
    console.log(`  clicked first radio option`);
  }

  await shot(page, 'onboarding-c6-step5-i9');
  advanced = await clickContinue(page, 'step5');
  console.log(`  step5 → advanced: ${advanced}`);
  await shot(page, 'onboarding-c6-step6-init');

  // ── STEP 6: Direct Deposit ────────────────────────────────────────────────
  console.log('\n--- Step 6: Direct Deposit ---');

  await tryFillTestId(page, 'onboarding-bank-name', 'Test Bank');
  await tryFillTestId(page, 'onboarding-routing-number', '123456789');
  await tryFillTestId(page, 'onboarding-account-number', '987654321');
  await selectFirstOption(page, 'onboarding-account-type');

  await shot(page, 'onboarding-c6-step6-filled');
  advanced = await clickContinue(page, 'step6');
  console.log(`  step6 → advanced: ${advanced}`);
  await shot(page, 'onboarding-c6-step7-init');

  // ── STEP 7: Acknowledgments ───────────────────────────────────────────────
  console.log('\n--- Step 7: Acknowledgments ---');

  const ackHtml = await page.content();
  console.log(`  has workers comp toggle: ${/workers.*comp|workersComp/i.test(ackHtml)}`);
  console.log(`  has handbook toggle: ${/handbook/i.test(ackHtml)}`);

  // Click toggles
  const toggles = await page.$$('[data-testid^="onboarding-ack"] mat-slide-toggle, [data-testid^="onboarding-ack"] .mat-mdc-slide-toggle');
  console.log(`  ack toggles found: ${toggles.length}`);
  for (const t of toggles) {
    try { await t.click(); } catch { /* skip */ }
  }

  await shot(page, 'onboarding-c6-step7-filled');

  // Check submit button
  const submitBtn = await page.$('[data-testid="onboarding-submit-btn"]');
  if (submitBtn) {
    const submitDisabled = await submitBtn.isDisabled();
    console.log(`  submit btn disabled: ${submitDisabled}`);
    if (!submitDisabled) {
      console.log(`  submit btn ENABLED — all acks complete`);
      // Don't actually submit — just screenshot
    }
  } else {
    console.log(`  submit btn not found — still on earlier step?`);
    // Check what step we're actually on
    const currentUrl = new URL(page.url()).href;
    const stepParam = new URL(currentUrl).searchParams.get('step');
    console.log(`  current step param: ${stepParam}`);
  }

  await shot(page, 'onboarding-c6-final-state');

  await ctx.close();

} finally {
  await browser.close();
  console.log('\nDone.');
}
