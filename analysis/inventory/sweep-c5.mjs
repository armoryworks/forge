/**
 * Cycle 5 — onboarding steps 2-7 live drive (run 3)
 * Fix: upload a minimal PNG via setInputFiles to satisfy listAFileId Validators.required
 */
import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:4200';
const SS = path.join(__dirname, 'screenshots');

// Minimal 1×1 transparent PNG (valid PNG bytes)
const MIN_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

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

async function isVisible(page, selector) {
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
  const loc = page.locator(`[data-testid="${testId}"] input`).first();
  await loc.waitFor({ state: 'visible', timeout: 5000 });
  await loc.click();
  await loc.press('Control+a');
  await loc.pressSequentially(value, { delay: 40 });
  await loc.press('Tab');
  await page.waitForTimeout(400);
}

async function continueStep(page, waitSelector, timeout = 12000) {
  const btn = page.locator('[data-testid="onboarding-continue-btn"]');
  const dis = await btn.isDisabled().catch(() => true);
  console.log('  Continue disabled:', dis);
  if (!dis) {
    await btn.click();
    if (waitSelector) {
      await page.locator(waitSelector).first().waitFor({ state: 'visible', timeout });
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

await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle', timeout: 20000 });
console.log('Onboarding URL:', page.url());
await shot(page, 'c5-step1-initial');

// ── STEP 1 ─────────────────────────────────────────────────────────────────
console.log('=== STEP 1 ===');
try {
  const fn = await page.locator('[data-testid="onboarding-first-name"] input').first().inputValue().catch(() => '');
  const ln = await page.locator('[data-testid="onboarding-last-name"] input').first().inputValue().catch(() => '');
  console.log('Pre-filled name:', fn, ln);
  if (!fn) await fillVisible(page, 'onboarding-first-name', 'Sam');
  if (!ln) await fillVisible(page, 'onboarding-last-name', 'Worker');

  await fillDateVisible(page, 'onboarding-dob', '01/15/1990');

  const ssnInput = page.locator('[data-testid="onboarding-ssn"] input').first();
  if (await ssnInput.isVisible().catch(() => false)) {
    await ssnInput.click();
    await ssnInput.press('Control+a');
    await ssnInput.pressSequentially('123456789', { delay: 30 });
    await page.waitForTimeout(200);
  }

  await fillVisible(page, 'onboarding-phone', '5555550100');
  await shot(page, 'c5-step1-filled');

  const adv = await continueStep(page, '[data-testid="onboarding-street1"] input');
  console.log('Step1 advanced:', adv);
  if (!adv) {
    const invalid = await page.locator('.mat-mdc-form-field.ng-invalid mat-label').allTextContents().catch(() => []);
    console.log('Invalid fields:', invalid);
    await shot(page, 'c5-step1-blocked');
  }
} catch (e) {
  console.log('STEP1 ERR:', e.message.substring(0, 300));
  await shot(page, 'c5-step1-err');
}

// ── STEP 2 ─────────────────────────────────────────────────────────────────
console.log('=== STEP 2 ===');
if (await isVisible(page, '[data-testid="onboarding-street1"] input')) {
  await shot(page, 'c5-step2-address');
  try {
    await fillVisible(page, 'onboarding-street1', '456 Worker Lane');
    await fillVisible(page, 'onboarding-city', 'Springfield');
    await selectByText(page, 'onboarding-state', 'Illinois');
    await fillVisible(page, 'onboarding-zip', '62701');
    await shot(page, 'c5-step2-filled');
    const adv = await continueStep(page, '[data-testid="onboarding-w4-filing-status"] mat-select');
    console.log('Step2 advanced:', adv);
  } catch (e) {
    console.log('STEP2 ERR:', e.message.substring(0, 300));
    await shot(page, 'c5-step2-err');
  }
} else { console.log('Step2 not visible — skipping'); }

// ── STEP 3 ─────────────────────────────────────────────────────────────────
console.log('=== STEP 3 ===');
if (await isVisible(page, '[data-testid="onboarding-w4-filing-status"] mat-select')) {
  await shot(page, 'c5-step3-w4');
  try {
    await selectFirst(page, 'onboarding-w4-filing-status');
    await fillVisible(page, 'onboarding-w4-qualifying-children', '0');
    await fillVisible(page, 'onboarding-w4-other-dependents', '0');
    await shot(page, 'c5-step3-filled');
    const adv = await continueStep(page, null);
    console.log('Step3 advanced:', adv);
    if (adv) await shot(page, 'c5-step4-initial');
  } catch (e) {
    console.log('STEP3 ERR:', e.message.substring(0, 300));
    await shot(page, 'c5-step3-err');
  }
} else { console.log('Step3 not visible — skipping'); }

// ── STEP 4 ─────────────────────────────────────────────────────────────────
console.log('=== STEP 4 ===');
await shot(page, 'c5-step4-state');
const step4StateFiling = await isVisible(page, '[data-testid="onboarding-state-filing-status"] mat-select');
console.log('Step4: stateFiling visible:', step4StateFiling);
try {
  if (step4StateFiling) await selectFirst(page, 'onboarding-state-filing-status');
  const adv = await continueStep(page, '[data-testid="onboarding-i9-citizenship"] mat-select');
  console.log('Step4 advanced:', adv);
} catch (e) {
  console.log('STEP4 ERR:', e.message.substring(0, 300));
  await shot(page, 'c5-step4-err');
}

// ── STEP 5: I-9 ───────────────────────────────────────────────────────────
console.log('=== STEP 5 ===');
if (await isVisible(page, '[data-testid="onboarding-i9-citizenship"] mat-select')) {
  await shot(page, 'c5-step5-i9');
  try {
    // Select US Citizen (first option)
    await selectFirst(page, 'onboarding-i9-citizenship');
    await page.waitForTimeout(400);

    // Click List A document choice
    const listABtn = page.locator('[data-testid="onboarding-i9-list-a-btn"]');
    if (await listABtn.isVisible().catch(() => false)) {
      await listABtn.click();
      await page.waitForTimeout(500);
    }

    // Select doc type
    if (await isVisible(page, '[data-testid="onboarding-i9-list-a-type"] mat-select')) {
      await selectFirst(page, 'onboarding-i9-list-a-type');
    }

    // Fill doc fields
    if (await isVisible(page, '[data-testid="onboarding-i9-list-a-doc-number"] input')) {
      await fillVisible(page, 'onboarding-i9-list-a-doc-number', 'A12345678');
    }
    if (await isVisible(page, '[data-testid="onboarding-i9-list-a-authority"] input')) {
      await fillVisible(page, 'onboarding-i9-list-a-authority', 'US State Dept');
    }
    if (await isVisible(page, '[data-testid="onboarding-i9-list-a-expiry"] input')) {
      await fillDateVisible(page, 'onboarding-i9-list-a-expiry', '01/15/2030');
    }

    // Upload a minimal PNG to satisfy listAFileId required validator
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      console.log('Uploading test PNG for listA doc...');
      await fileInput.setInputFiles({
        name: 'test-i9-doc.png',
        mimeType: 'image/png',
        buffer: MIN_PNG,
      });
      // Wait for upload to complete (chip should appear, or uploadingListA spinner gone)
      await page.waitForTimeout(3000);
      // Check if chip appeared (file was accepted and fileId set)
      const chipVisible = await isVisible(page, '.doc-upload__chip');
      console.log('Upload chip visible:', chipVisible);
    }

    await shot(page, 'c5-step5-i9-filled');

    const btn = page.locator('[data-testid="onboarding-continue-btn"]');
    const dis5 = await btn.isDisabled().catch(() => true);
    console.log('Step5 Continue disabled:', dis5);
    if (!dis5) {
      await btn.click();
      await page.locator('[data-testid="onboarding-bank-name"] input').first().waitFor({ state: 'visible', timeout: 12000 });
      console.log('=> Step 6 reached');
    } else {
      // Diagnose remaining invalid fields
      const i9Violations = await page.locator('app-validation-button .validation-button__violations li').allTextContents().catch(() => []);
      console.log('I-9 violations:', i9Violations);
    }
  } catch (e) {
    console.log('STEP5 ERR:', e.message.substring(0, 300));
    await shot(page, 'c5-step5-err');
  }
} else { console.log('Step5 not visible — skipping'); }

// ── STEP 6 ─────────────────────────────────────────────────────────────────
console.log('=== STEP 6 ===');
if (await isVisible(page, '[data-testid="onboarding-bank-name"] input')) {
  await shot(page, 'c5-step6-deposit');
  try {
    await fillVisible(page, 'onboarding-bank-name', 'Test National Bank');
    await fillVisible(page, 'onboarding-routing-number', '021000021');
    await fillVisible(page, 'onboarding-account-number', '987654321');
    await selectFirst(page, 'onboarding-account-type');
    await shot(page, 'c5-step6-filled');
    const adv = await continueStep(page, '[data-testid="onboarding-ack-workers-comp"] mat-slide-toggle');
    console.log('Step6 advanced:', adv);
  } catch (e) {
    console.log('STEP6 ERR:', e.message.substring(0, 300));
    await shot(page, 'c5-step6-err');
  }
} else { console.log('Step6 not visible — skipping'); }

// ── STEP 7 ─────────────────────────────────────────────────────────────────
console.log('=== STEP 7 ===');
if (await isVisible(page, '[data-testid="onboarding-ack-workers-comp"] mat-slide-toggle')) {
  await shot(page, 'c5-step7-ack');
  try {
    await page.locator('[data-testid="onboarding-ack-workers-comp"] mat-slide-toggle').click();
    await page.waitForTimeout(300);
    await shot(page, 'c5-step7-filled');
    const submit = page.locator('[data-testid="onboarding-submit-btn"]');
    console.log('Submit exists:', await submit.count() > 0, 'disabled:', await submit.isDisabled().catch(() => 'n/a'));
    // Do NOT click Submit — DocuSeal signing is D4-terminal on non-seeded stack
  } catch (e) {
    console.log('STEP7 ERR:', e.message.substring(0, 300));
    await shot(page, 'c5-step7-err');
  }
} else { console.log('Step7 not visible — skipping'); }

console.log('=== C5 COMPLETE ===');
await browser.close();
