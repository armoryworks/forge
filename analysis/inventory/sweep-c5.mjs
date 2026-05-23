/**
 * Cycle 5 — onboarding steps 2-7 live drive (fixed)
 * Key issues from run 1:
 *  - mat-stepper renders ALL steps in DOM; use isVisible() not count() to detect active step
 *  - DOB must be typed with slashes: "01/15/1990" not "01151990"
 *  - After each Continue, wait for the NEXT step's primary element to be VISIBLE
 */
import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:4200';
const SS = path.join(__dirname, 'screenshots');

async function shot(page, name) {
  await page.screenshot({ path: path.join(SS, `access-${name}.png`), fullPage: false });
  console.log(`SHOT ${name}`);
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(u => !u.pathname.includes('/login'), { timeout: 15000 });
}

async function visible(page, selector) {
  return page.locator(selector).first().isVisible().catch(() => false);
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

async function fillVisible(page, testId, value) {
  const loc = page.locator(`[data-testid="${testId}"] input`).first();
  await loc.waitFor({ state: 'visible', timeout: 5000 });
  await loc.clear();
  await loc.pressSequentially(value, { delay: 30 });
  await page.waitForTimeout(150);
}

async function fillDateVisible(page, testId, value) {
  // Material datepicker NativeDateAdapter, format MM/dd/yyyy
  const loc = page.locator(`[data-testid="${testId}"] input`).first();
  await loc.waitFor({ state: 'visible', timeout: 5000 });
  await loc.click();
  // Select all and type to replace
  await loc.press('Control+a');
  await loc.pressSequentially(value, { delay: 40 });
  await loc.press('Tab');
  await page.waitForTimeout(400);
}

async function continueStep(page, waitSelector) {
  const btn = page.locator('[data-testid="onboarding-continue-btn"]');
  const dis = await btn.isDisabled().catch(() => true);
  console.log('  Continue disabled:', dis);
  if (!dis) {
    await btn.click();
    if (waitSelector) {
      await page.locator(waitSelector).first().waitFor({ state: 'visible', timeout: 12000 });
    } else {
      await page.waitForTimeout(2000);
    }
    return true;
  }
  return false;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

// ── Login ──────────────────────────────────────────────────────────────────
console.log('LOGIN worker@forge.local');
await login(page, 'worker@forge.local', 'ForgeRun!2026');
console.log('URL:', page.url());

// ── Navigate to /onboarding ────────────────────────────────────────────────
await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle', timeout: 20000 });
console.log('Onboarding URL:', page.url());
await shot(page, 'c5-step1-initial');

// ── STEP 1: Personal Info ──────────────────────────────────────────────────
console.log('=== STEP 1 ===');
try {
  // Check if firstName is pre-filled
  const firstName = await page.locator('[data-testid="onboarding-first-name"] input').first().inputValue().catch(() => '');
  const lastName = await page.locator('[data-testid="onboarding-last-name"] input').first().inputValue().catch(() => '');
  console.log('Pre-filled name:', firstName, lastName);

  // Fill name if empty
  if (!firstName) await fillVisible(page, 'onboarding-first-name', 'Sam');
  if (!lastName) await fillVisible(page, 'onboarding-last-name', 'Worker');

  // Fill DOB — use slashes for MM/dd/yyyy format
  await fillDateVisible(page, 'onboarding-dob', '01/15/1990');

  // Fill SSN (check if stored first)
  const ssnStoredEl = page.locator('[data-testid="onboarding-ssn"]').locator('text=Securely stored');
  const ssnStored = await ssnStoredEl.isVisible().catch(() => false);
  if (!ssnStored) {
    const ssnInput = page.locator('[data-testid="onboarding-ssn"] input').first();
    if (await ssnInput.isVisible().catch(() => false)) {
      await ssnInput.click();
      await ssnInput.press('Control+a');
      await ssnInput.pressSequentially('123456789', { delay: 30 });
      await page.waitForTimeout(200);
    }
  }

  // Fill phone
  await fillVisible(page, 'onboarding-phone', '5555550100');

  await shot(page, 'c5-step1-filled');

  const advanced = await continueStep(page, '[data-testid="onboarding-street1"]');
  console.log('Step1 advanced:', advanced);
  if (!advanced) {
    // Log all invalid fields
    const invalidFields = await page.locator('.mat-mdc-form-field.ng-invalid mat-label').allTextContents().catch(() => []);
    console.log('Invalid fields:', invalidFields);
    await shot(page, 'c5-step1-blocked');
  }
} catch (e) {
  console.log('STEP1 ERR:', e.message.substring(0, 200));
  await shot(page, 'c5-step1-err');
}

// ── STEP 2: Home Address ───────────────────────────────────────────────────
console.log('=== STEP 2 ===');
const step2Visible = await visible(page, '[data-testid="onboarding-street1"] input');
console.log('Step2 visible:', step2Visible);
if (step2Visible) {
  await shot(page, 'c5-step2-address');
  try {
    await fillVisible(page, 'onboarding-street1', '456 Worker Lane');
    await fillVisible(page, 'onboarding-city', 'Springfield');
    await selectByText(page, 'onboarding-state', 'Illinois');
    await fillVisible(page, 'onboarding-zip', '62701');
    await shot(page, 'c5-step2-filled');

    const advanced = await continueStep(page, '[data-testid="onboarding-w4-filing-status"] mat-select');
    console.log('Step2 advanced:', advanced);
  } catch (e) {
    console.log('STEP2 ERR:', e.message.substring(0, 200));
    await shot(page, 'c5-step2-err');
  }
}

// ── STEP 3: W-4 Federal Tax ────────────────────────────────────────────────
console.log('=== STEP 3 ===');
const step3Visible = await visible(page, '[data-testid="onboarding-w4-filing-status"] mat-select');
console.log('Step3 visible:', step3Visible);
if (step3Visible) {
  await shot(page, 'c5-step3-w4');
  try {
    await selectFirst(page, 'onboarding-w4-filing-status');
    // qualifying children and other dependents are required (type=number)
    await fillVisible(page, 'onboarding-w4-qualifying-children', '0');
    await fillVisible(page, 'onboarding-w4-other-dependents', '0');
    await shot(page, 'c5-step3-filled');

    const advanced = await continueStep(page, null);
    console.log('Step3 advanced:', advanced);
    if (advanced) await shot(page, 'c5-step4-state-initial');
  } catch (e) {
    console.log('STEP3 ERR:', e.message.substring(0, 200));
    await shot(page, 'c5-step3-err');
  }
}

// ── STEP 4: State Withholding ──────────────────────────────────────────────
console.log('=== STEP 4 ===');
await shot(page, 'c5-step4-state');
const step4StateFiling = await visible(page, '[data-testid="onboarding-state-filing-status"] mat-select');
const step4NoTax = await visible(page, '.step-content__skip-notice');
console.log('Step4: stateFiling visible:', step4StateFiling, 'noTax visible:', step4NoTax);
try {
  if (step4StateFiling) {
    await selectFirst(page, 'onboarding-state-filing-status');
  }
  const advanced = await continueStep(page, '[data-testid="onboarding-i9-citizenship"] mat-select');
  console.log('Step4 advanced:', advanced);
} catch (e) {
  console.log('STEP4 ERR:', e.message.substring(0, 200));
  await shot(page, 'c5-step4-err');
}

// ── STEP 5: I-9 ───────────────────────────────────────────────────────────
console.log('=== STEP 5 ===');
const step5Visible = await visible(page, '[data-testid="onboarding-i9-citizenship"] mat-select');
console.log('Step5 visible:', step5Visible);
if (step5Visible) {
  await shot(page, 'c5-step5-i9');
  try {
    // Select US Citizen (first option)
    await selectFirst(page, 'onboarding-i9-citizenship');
    await page.waitForTimeout(400);

    // Click List A document choice button
    const listABtn = page.locator('[data-testid="onboarding-i9-list-a-btn"]');
    if (await listABtn.isVisible().catch(() => false)) {
      await listABtn.click();
      await page.waitForTimeout(500);
    }

    // Select List A doc type (should appear after clicking List A)
    const listATypeVisible = await visible(page, '[data-testid="onboarding-i9-list-a-type"] mat-select');
    if (listATypeVisible) {
      await selectFirst(page, 'onboarding-i9-list-a-type');
      await fillVisible(page, 'onboarding-i9-list-a-doc-number', 'A12345678');
      await fillVisible(page, 'onboarding-i9-list-a-authority', 'US State Dept');
      await fillDateVisible(page, 'onboarding-i9-list-a-expiry', '01/15/2030');
    }

    await shot(page, 'c5-step5-i9-filled');
    const advanced = await continueStep(page, '[data-testid="onboarding-bank-name"] input');
    console.log('Step5 advanced:', advanced);
  } catch (e) {
    console.log('STEP5 ERR:', e.message.substring(0, 200));
    await shot(page, 'c5-step5-err');
  }
}

// ── STEP 6: Direct Deposit ─────────────────────────────────────────────────
console.log('=== STEP 6 ===');
const step6Visible = await visible(page, '[data-testid="onboarding-bank-name"] input');
console.log('Step6 visible:', step6Visible);
if (step6Visible) {
  await shot(page, 'c5-step6-deposit');
  try {
    await fillVisible(page, 'onboarding-bank-name', 'Test National Bank');
    await fillVisible(page, 'onboarding-routing-number', '021000021');
    await fillVisible(page, 'onboarding-account-number', '987654321');
    await selectFirst(page, 'onboarding-account-type');
    await shot(page, 'c5-step6-filled');

    const advanced = await continueStep(page, '[data-testid="onboarding-ack-workers-comp"] mat-slide-toggle');
    console.log('Step6 advanced:', advanced);
  } catch (e) {
    console.log('STEP6 ERR:', e.message.substring(0, 200));
    await shot(page, 'c5-step6-err');
  }
}

// ── STEP 7: Acknowledgments ────────────────────────────────────────────────
console.log('=== STEP 7 ===');
const step7Visible = await visible(page, '[data-testid="onboarding-ack-workers-comp"] mat-slide-toggle');
console.log('Step7 visible:', step7Visible);
if (step7Visible) {
  await shot(page, 'c5-step7-ack');
  try {
    await page.locator('[data-testid="onboarding-ack-workers-comp"] mat-slide-toggle').click();
    await page.waitForTimeout(300);
    await shot(page, 'c5-step7-filled');
    const submitBtn = page.locator('[data-testid="onboarding-submit-btn"]');
    const submitExists = await submitBtn.count() > 0;
    const submitDisabled = await submitBtn.isDisabled().catch(() => 'n/a');
    console.log('Submit btn exists:', submitExists, 'disabled:', submitDisabled);
    // Do NOT click Submit — DocuSeal signing is D4-terminal on this stack
  } catch (e) {
    console.log('STEP7 ERR:', e.message.substring(0, 200));
    await shot(page, 'c5-step7-err');
  }
}

console.log('=== C5 COMPLETE ===');
await browser.close();
