/**
 * Cycle 5 — onboarding steps 2-7 live drive
 * Goal: LC each onboarding step by filling required fields and advancing the linear stepper.
 */
import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:4200';
const SS = path.join(__dirname, 'screenshots');

async function shot(page, name) {
  const p = path.join(SS, `access-${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`SHOT ${name}`);
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(u => !u.pathname.includes('/login'), { timeout: 15000 });
}

async function selectFirst(page, testId) {
  await page.locator(`[data-testid="${testId}"] mat-select`).click();
  await page.waitForSelector('mat-option', { timeout: 5000 });
  await page.locator('mat-option').first().click();
  await page.waitForTimeout(300);
}

async function selectByText(page, testId, text) {
  await page.locator(`[data-testid="${testId}"] mat-select`).click();
  await page.waitForSelector('mat-option', { timeout: 5000 });
  await page.locator('mat-option', { hasText: text }).first().click();
  await page.waitForTimeout(300);
}

async function fillInput(page, testId, value) {
  const loc = page.locator(`[data-testid="${testId}"] input`).first();
  await loc.clear();
  await loc.pressSequentially(value, { delay: 30 });
  await page.waitForTimeout(200);
}

async function fillDate(page, testId, value) {
  const loc = page.locator(`[data-testid="${testId}"] input`).first();
  await loc.click();
  await loc.fill('');
  await loc.pressSequentially(value, { delay: 30 });
  await loc.press('Tab');
  await page.waitForTimeout(400);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

// ── Login ──────────────────────────────────────────────────────────────────
console.log('LOGIN worker@forge.local');
await login(page, 'worker@forge.local', 'ForgeRun!2026');
console.log('URL after login:', page.url());

// ── Navigate to /onboarding ────────────────────────────────────────────────
await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle', timeout: 20000 });
console.log('Onboarding URL:', page.url());
await shot(page, 'c5-onboarding-step1');

// ── STEP 1: Fill required fields ───────────────────────────────────────────
console.log('STEP 1: filling DOB, SSN, phone');
try {
  await fillDate(page, 'onboarding-dob', '01151990');
  const ssnInput = page.locator('[data-testid="onboarding-ssn"] input').first();
  const ssnVisible = await ssnInput.isVisible().catch(() => false);
  if (ssnVisible) {
    await ssnInput.click();
    await ssnInput.fill('');
    await ssnInput.pressSequentially('123456789', { delay: 30 });
    await page.waitForTimeout(200);
  }
  await fillInput(page, 'onboarding-phone', '5555550100');
  await shot(page, 'c5-onboarding-step1-filled');

  const btn = page.locator('[data-testid="onboarding-continue-btn"]');
  const dis1 = await btn.isDisabled().catch(() => true);
  console.log('Step1 continue disabled:', dis1);
  if (!dis1) {
    await btn.click();
    await page.waitForSelector('[data-testid="onboarding-street1"]', { timeout: 10000 });
    console.log('=> Step 2 reached');
  } else {
    const errText = await page.locator('.mat-mdc-form-field-error, .mat-error').first().textContent().catch(() => '');
    console.log('Validation blocker:', errText);
    await shot(page, 'c5-onboarding-step1-blocked');
  }
} catch (e) {
  console.log('STEP1 ERR:', e.message);
  await shot(page, 'c5-onboarding-step1-err');
}

// ── STEP 2: Home Address ───────────────────────────────────────────────────
const atStep2 = (await page.locator('[data-testid="onboarding-street1"]').count()) > 0;
console.log('At step 2:', atStep2);
if (atStep2) {
  await shot(page, 'c5-onboarding-step2');
  try {
    await fillInput(page, 'onboarding-street1', '456 Worker Lane');
    await fillInput(page, 'onboarding-city', 'Springfield');
    await selectByText(page, 'onboarding-state', 'Illinois');
    await fillInput(page, 'onboarding-zip', '62701');
    await shot(page, 'c5-onboarding-step2-filled');

    const btn = page.locator('[data-testid="onboarding-continue-btn"]');
    const dis2 = await btn.isDisabled().catch(() => true);
    console.log('Step2 continue disabled:', dis2);
    if (!dis2) {
      await btn.click();
      await page.waitForSelector('[data-testid="onboarding-w4-filing-status"]', { timeout: 10000 });
      console.log('=> Step 3 reached');
    }
  } catch (e) {
    console.log('STEP2 ERR:', e.message);
    await shot(page, 'c5-onboarding-step2-err');
  }
}

// ── STEP 3: W-4 Federal Tax ────────────────────────────────────────────────
const atStep3 = (await page.locator('[data-testid="onboarding-w4-filing-status"]').count()) > 0;
console.log('At step 3:', atStep3);
if (atStep3) {
  await shot(page, 'c5-onboarding-step3-w4');
  try {
    await selectFirst(page, 'onboarding-w4-filing-status');
    await fillInput(page, 'onboarding-w4-qualifying-children', '0');
    await fillInput(page, 'onboarding-w4-other-dependents', '0');
    await shot(page, 'c5-onboarding-step3-filled');

    const btn = page.locator('[data-testid="onboarding-continue-btn"]');
    const dis3 = await btn.isDisabled().catch(() => true);
    console.log('Step3 continue disabled:', dis3);
    if (!dis3) {
      await btn.click();
      await page.waitForTimeout(2000);
      console.log('=> Step 4 reached');
    }
  } catch (e) {
    console.log('STEP3 ERR:', e.message);
    await shot(page, 'c5-onboarding-step3-err');
  }
}

// ── STEP 4: State Withholding ──────────────────────────────────────────────
await shot(page, 'c5-onboarding-step4-state');
const hasStateFiling = (await page.locator('[data-testid="onboarding-state-filing-status"]').count()) > 0;
const hasNoTax = (await page.locator('.step-content__skip-notice').count()) > 0;
console.log('Step4: hasStateFiling', hasStateFiling, 'hasNoTax', hasNoTax);
try {
  if (hasStateFiling) {
    await selectFirst(page, 'onboarding-state-filing-status');
  }
  const btn = page.locator('[data-testid="onboarding-continue-btn"]');
  const dis4 = await btn.isDisabled().catch(() => true);
  console.log('Step4 continue disabled:', dis4);
  if (!dis4) {
    await btn.click();
    await page.waitForSelector('[data-testid="onboarding-i9-citizenship"]', { timeout: 10000 });
    console.log('=> Step 5 reached');
  }
} catch (e) {
  console.log('STEP4 ERR:', e.message);
  await shot(page, 'c5-onboarding-step4-err');
}

// ── STEP 5: I-9 ───────────────────────────────────────────────────────────
const atStep5 = (await page.locator('[data-testid="onboarding-i9-citizenship"]').count()) > 0;
console.log('At step 5:', atStep5);
if (atStep5) {
  await shot(page, 'c5-onboarding-step5-i9');
  try {
    await selectFirst(page, 'onboarding-i9-citizenship');
    await page.waitForTimeout(400);
    await page.click('[data-testid="onboarding-i9-list-a-btn"]');
    await page.waitForTimeout(400);
    await selectFirst(page, 'onboarding-i9-list-a-type');
    await fillInput(page, 'onboarding-i9-list-a-doc-number', 'A12345678');
    await fillInput(page, 'onboarding-i9-list-a-authority', 'US State Dept');
    await fillDate(page, 'onboarding-i9-list-a-expiry', '01152030');
    await shot(page, 'c5-onboarding-step5-i9-filled');

    const btn = page.locator('[data-testid="onboarding-continue-btn"]');
    const dis5 = await btn.isDisabled().catch(() => true);
    console.log('Step5 continue disabled:', dis5);
    if (!dis5) {
      await btn.click();
      await page.waitForSelector('[data-testid="onboarding-bank-name"]', { timeout: 10000 });
      console.log('=> Step 6 reached');
    }
  } catch (e) {
    console.log('STEP5 ERR:', e.message);
    await shot(page, 'c5-onboarding-step5-err');
  }
}

// ── STEP 6: Direct Deposit ─────────────────────────────────────────────────
const atStep6 = (await page.locator('[data-testid="onboarding-bank-name"]').count()) > 0;
console.log('At step 6:', atStep6);
if (atStep6) {
  await shot(page, 'c5-onboarding-step6-deposit');
  try {
    await fillInput(page, 'onboarding-bank-name', 'Test National Bank');
    await fillInput(page, 'onboarding-routing-number', '021000021');
    await fillInput(page, 'onboarding-account-number', '987654321');
    await selectFirst(page, 'onboarding-account-type');
    await shot(page, 'c5-onboarding-step6-filled');

    const btn = page.locator('[data-testid="onboarding-continue-btn"]');
    const dis6 = await btn.isDisabled().catch(() => true);
    console.log('Step6 continue disabled:', dis6);
    if (!dis6) {
      await btn.click();
      await page.waitForSelector('[data-testid="onboarding-ack-workers-comp"]', { timeout: 10000 });
      console.log('=> Step 7 reached');
    }
  } catch (e) {
    console.log('STEP6 ERR:', e.message);
    await shot(page, 'c5-onboarding-step6-err');
  }
}

// ── STEP 7: Acknowledgments ────────────────────────────────────────────────
const atStep7 = (await page.locator('[data-testid="onboarding-ack-workers-comp"]').count()) > 0;
console.log('At step 7:', atStep7);
if (atStep7) {
  await shot(page, 'c5-onboarding-step7-ack');
  try {
    await page.locator('[data-testid="onboarding-ack-workers-comp"] mat-slide-toggle').click();
    await page.waitForTimeout(300);
    await shot(page, 'c5-onboarding-step7-filled');
    const submitBtn = page.locator('[data-testid="onboarding-submit-btn"]');
    console.log('Submit exists:', (await submitBtn.count()) > 0);
    console.log('Submit disabled:', await submitBtn.isDisabled().catch(() => 'err'));
  } catch (e) {
    console.log('STEP7 ERR:', e.message);
    await shot(page, 'c5-onboarding-step7-err');
  }
}

console.log('=== C5 COMPLETE ===');
await browser.close();
