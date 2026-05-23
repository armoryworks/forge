/**
 * Phase 06 Cycle 7 — I-9 bypass via Angular form API + steps 5-7 sweep
 * Goal: inject citizenshipStatus + documentChoice + listAFileId via ng debug API
 * to unlock Continue on step 5 (I-9) and reach steps 6-7.
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
    if (!el) { return false; }
    const cur = await el.inputValue();
    if (cur) { return true; }
    await el.fill(value);
    return true;
  } catch { return false; }
}

async function selectFirstOption(page, testId) {
  try {
    const trigger = await page.$(`[data-testid="${testId}"] mat-select`);
    if (trigger) { await trigger.click(); }
    else {
      const wrap = await page.$(`[data-testid="${testId}"]`);
      if (!wrap) return false;
      await wrap.click();
    }
    await page.waitForSelector('mat-option', { timeout: 3000 });
    const opts = await page.$$eval('mat-option', os => os.map(o => o.textContent?.trim()));
    console.log(`  opts[${testId}]: ${JSON.stringify(opts.slice(0, 4))}`);
    await page.click('mat-option:first-child');
    await page.waitForTimeout(300);
    return true;
  } catch (e) { console.log(`  select err ${testId}: ${e.message.split('\n')[0]}`); return false; }
}

async function clickContinue(page) {
  try {
    const btn = await page.$('[data-testid="onboarding-continue-btn"]');
    if (!btn) return false;
    const disabled = await btn.isDisabled();
    if (disabled) return false;
    await btn.click();
    await page.waitForTimeout(1200);
    return true;
  } catch { return false; }
}

const browser = await chromium.launch({ headless: true });

try {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await login(page, 'worker@forge.local', 'ForgeRun!2026');
  await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle', timeout: 20000 });

  // Steps 1-4: advance quickly (pre-filled data from previous cycle run)
  console.log('Steps 1-4: advance...');
  await clickContinue(page); // step1
  await clickContinue(page); // step2
  // step3 W-4
  await selectFirstOption(page, 'onboarding-w4-filing-status');
  await tryFillTestId(page, 'onboarding-w4-qualifying-children', '0');
  await tryFillTestId(page, 'onboarding-w4-other-dependents', '0');
  await clickContinue(page); // step3
  // step4 state
  const noTax = await page.$('.step-content__skip-notice');
  if (!noTax) await selectFirstOption(page, 'onboarding-state-filing-status');
  await clickContinue(page); // step4

  const stepNow = new URL(page.url()).searchParams.get('step');
  console.log(`  at step param: ${stepNow} (expect 4=I-9)`);

  // ── STEP 5: I-9 ──────────────────────────────────────────────────────────
  console.log('\n=== Step 5: I-9 ===');
  await shot(page, 'onboarding-c7-step5-init');

  // Select citizenship (US Citizen = value '1' per CITIZENSHIP_OPTIONS)
  await selectFirstOption(page, 'onboarding-i9-citizenship');

  // Click List A document choice
  try {
    await page.click('[data-testid="onboarding-i9-list-a-btn"]');
    await page.waitForTimeout(500);
    console.log('  clicked List A');
  } catch (e) { console.log(`  List A btn err: ${e.message.split('\n')[0]}`); }

  // Fill List A fields
  await selectFirstOption(page, 'onboarding-i9-list-a-type');
  await tryFillTestId(page, 'onboarding-i9-list-a-doc-number', 'TEST123456789');
  await tryFillTestId(page, 'onboarding-i9-list-a-authority', 'US State Dept');

  // Expiry datepicker
  const expiryEl = await page.$('[data-testid="onboarding-i9-list-a-expiry"] input');
  if (expiryEl) { await expiryEl.fill('12/31/2030'); console.log('  filled expiry'); }

  await shot(page, 'onboarding-c7-step5-fields');

  // Check continue state before ng inject
  {
    const btn = await page.$('[data-testid="onboarding-continue-btn"]');
    console.log(`  continue pre-inject: disabled=${await btn?.isDisabled()}`);
  }

  // Try Angular debug API to force listAFileId
  const ngResult = await page.evaluate(() => {
    try {
      const el = document.querySelector('app-onboarding-wizard');
      if (!el) return 'no-element';
      if (typeof ng === 'undefined') return 'no-ng';
      const comp = ng.getComponent(el);
      if (!comp) return 'no-comp';
      const form = comp.i9Form;
      if (!form) return 'no-form';
      form.controls.listAFileId.setValue(999);
      form.controls.listAFileId.markAsDirty();
      form.controls.listAFileId.updateValueAndValidity();
      form.updateValueAndValidity();
      ng.applyChanges(comp);
      return `ok status=${form.status} fileId=${form.controls.listAFileId.value}`;
    } catch (e) { return `err: ${e.message}`; }
  });
  console.log(`  ng inject: ${ngResult}`);
  await page.waitForTimeout(300);

  // Check continue after inject
  {
    const btn = await page.$('[data-testid="onboarding-continue-btn"]');
    const dis = await btn?.isDisabled();
    console.log(`  continue post-inject: disabled=${dis}`);
  }

  await shot(page, 'onboarding-c7-step5-post-inject');
  const advanced5 = await clickContinue(page);
  console.log(`  step5 advanced: ${advanced5}`);

  // ── STEP 6: Direct Deposit ────────────────────────────────────────────────
  console.log('\n=== Step 6: Direct Deposit ===');
  const step6param = new URL(page.url()).searchParams.get('step');
  console.log(`  step param: ${step6param}`);
  await shot(page, 'onboarding-c7-step6-init');

  const s6html = await page.content();
  const hasBank = /bank.*name|bankName/i.test(s6html);
  const hasRouting = /routing/i.test(s6html);
  console.log(`  step6 content: bank=${hasBank} routing=${hasRouting}`);

  if (advanced5 || step6param === '5') {
    // Step 6 is now active
    await tryFillTestId(page, 'onboarding-bank-name', 'First National Bank');
    await tryFillTestId(page, 'onboarding-routing-number', '021000021');
    await tryFillTestId(page, 'onboarding-account-number', '987654321');
    await selectFirstOption(page, 'onboarding-account-type');
    await shot(page, 'onboarding-c7-step6-filled');

    const btn6 = await page.$('[data-testid="onboarding-continue-btn"]');
    console.log(`  step6 continue: disabled=${await btn6?.isDisabled()}`);
    const advanced6 = await clickContinue(page);
    console.log(`  step6 advanced: ${advanced6}`);

    // ── STEP 7: Acknowledgments ─────────────────────────────────────────────
    console.log('\n=== Step 7: Acknowledgments ===');
    const step7param = new URL(page.url()).searchParams.get('step');
    console.log(`  step param: ${step7param}`);
    await shot(page, 'onboarding-c7-step7-init');

    const ackHtml = await page.content();
    console.log(`  workers-comp: ${/workers.*comp/i.test(ackHtml)}, handbook: ${/handbook/i.test(ackHtml)}`);

    // Toggle acknowledgments
    const toggles = await page.$$('.mat-mdc-slide-toggle:not([aria-checked="true"])');
    console.log(`  unchecked toggles: ${toggles.length}`);
    for (const t of toggles) {
      try { await t.click(); await page.waitForTimeout(200); } catch {}
    }
    await shot(page, 'onboarding-c7-step7-filled');

    const submitBtn = await page.$('[data-testid="onboarding-submit-btn"]');
    if (submitBtn) {
      const dis = await submitBtn.isDisabled();
      console.log(`  submit disabled: ${dis}`);
      if (!dis) {
        console.log('  STEP 7 LC — submit enabled (not clicking)');
        await shot(page, 'onboarding-c7-step7-submit-ready');
      }
    } else {
      console.log('  no submit btn found');
    }
  } else {
    console.log('  step5 NOT advanced — I-9 blocked, reporting form status');
    const status = await page.evaluate(() => {
      try {
        const comp = ng.getComponent(document.querySelector('app-onboarding-wizard'));
        const f = comp?.i9Form;
        if (!f) return 'no-form';
        const invalid = Object.entries(f.controls)
          .filter(([, c]) => c.invalid && c.errors)
          .map(([k, c]) => `${k}:${JSON.stringify(c.errors)}`);
        return `status=${f.status} invalid=[${invalid.join(', ')}]`;
      } catch (e) { return `err: ${e.message}`; }
    });
    console.log(`  i9Form: ${status}`);
  }

} finally {
  await browser.close();
  console.log('\nDone.');
}
