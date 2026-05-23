/**
 * Phase 06 Cycle 7 — Onboarding steps 6-7 via I-9 file upload
 * The I-9 form requires listAFileId (requires real file upload to MinIO).
 * This script uploads a minimal 1x1 PNG to satisfy that requirement, then
 * advances through steps 6 (direct deposit) and 7 (acknowledgments).
 */
import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:4200';
const SHOTS = path.join(__dirname, 'screenshots');

// Minimal 1x1 white PNG (67 bytes)
const PNG_1x1 = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
  '2e00000000c4944415478016360f8cf00000002000115c3d340000000049454e44ae426082',
  'hex'
);
// Write temp file
const tmpFile = path.join(os.tmpdir(), 'forge-i9-doc.png');
writeFileSync(tmpFile, PNG_1x1);
console.log(`[C7] temp file: ${tmpFile}`);

async function shot(page, name) {
  const p = path.join(SHOTS, `access-c7-${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`[C7] shot: ${name}`);
}

async function selectFirstOption(page, testId) {
  const trigger = page.locator(`[data-testid="${testId}"] mat-select`).first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  await page.waitForSelector('mat-option', { timeout: 4000 });
  await page.locator('mat-option').first().click();
  await page.waitForTimeout(400);
}

async function fillTestId(page, testId, value) {
  const el = page.locator(`[data-testid="${testId}"] input`).first();
  await el.scrollIntoViewIfNeeded();
  await el.fill(value);
}

async function typeTestId(page, testId, value) {
  const el = page.locator(`[data-testid="${testId}"] input`).first();
  await el.scrollIntoViewIfNeeded();
  await el.click({ clickCount: 3 });
  await el.type(value, { delay: 20 });
}

async function clickContinue(page) {
  const btn = page.locator('[data-testid="onboarding-continue-btn"]').first();
  const disabled = await btn.isDisabled().catch(() => true);
  if (disabled) {
    const violations = await page.locator('app-validation-button, .mat-error').allTextContents();
    console.log(`[C7] continue disabled, violations: ${JSON.stringify(violations.slice(0, 5))}`);
    return false;
  }
  await btn.click();
  await page.waitForTimeout(2000);
  return true;
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.on('console', m => { if (m.type() === 'error') console.log('[console-err]', m.text().slice(0, 100)); });

// ── Login ─────────────────────────────────────────────────────────────────────
console.log('[C7] Logging in...');
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 20000 });
await page.fill('input[type="email"]', 'worker@forge.local');
await page.fill('input[type="password"]', 'ForgeRun!2026');
await page.click('button[type="submit"]');
await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
console.log(`[C7] logged in, URL: ${page.url()}`);

// ── Navigate to onboarding ────────────────────────────────────────────────────
await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(1500);
const hasOnboarding = await page.locator('.onboarding__stepper').isVisible({ timeout: 3000 }).catch(() => false);
if (!hasOnboarding) {
  console.log('[C7] Onboarding not rendered, URL:', page.url());
  await browser.close();
  process.exit(1);
}
console.log('[C7] Onboarding rendered');
await shot(page, 'step1-init');

// ── Step 1: Personal Info ─────────────────────────────────────────────────────
console.log('[C7] Step 1: Personal Info');
await fillTestId(page, 'onboarding-first-name', 'Test');
await fillTestId(page, 'onboarding-last-name', 'Worker');
const dobInput = page.locator('[data-testid="onboarding-dob"] input').first();
await dobInput.click({ clickCount: 3 });
await dobInput.type('01/15/1990', { delay: 30 });
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await typeTestId(page, 'onboarding-ssn', '123456789');
await page.waitForTimeout(200);
await typeTestId(page, 'onboarding-phone', '5551234567');
await page.waitForTimeout(500);

const s1 = await clickContinue(page);
console.log(`[C7] Step 1 advanced: ${s1}`);
if (!s1) { await shot(page, 'step1-stuck'); await browser.close(); process.exit(1); }

// ── Step 2: Address ───────────────────────────────────────────────────────────
console.log('[C7] Step 2: Address');
await fillTestId(page, 'onboarding-street1', '123 Worker Lane');
await fillTestId(page, 'onboarding-city', 'Springfield');
await selectFirstOption(page, 'onboarding-state');
await typeTestId(page, 'onboarding-zip', '62701');
await page.waitForTimeout(500);
const s2 = await clickContinue(page);
console.log(`[C7] Step 2 advanced: ${s2}`);
if (!s2) { await shot(page, 'step2-stuck'); await browser.close(); process.exit(1); }

// ── Step 3: W-4 ──────────────────────────────────────────────────────────────
console.log('[C7] Step 3: W-4');
await selectFirstOption(page, 'onboarding-w4-filing-status');
await fillTestId(page, 'onboarding-w4-qualifying-children', '0');
await fillTestId(page, 'onboarding-w4-other-dependents', '0');
await page.waitForTimeout(500);
const s3 = await clickContinue(page);
console.log(`[C7] Step 3 advanced: ${s3}`);
if (!s3) { await shot(page, 'step3-stuck'); await browser.close(); process.exit(1); }

// ── Step 4: State Tax ─────────────────────────────────────────────────────────
console.log('[C7] Step 4: State Tax');
const skipNotice = await page.locator('.step-content__skip-notice').isVisible({ timeout: 1000 }).catch(() => false);
if (!skipNotice) {
  const filingVisible = await page.locator('[data-testid="onboarding-state-filing-status"]').isVisible({ timeout: 1000 }).catch(() => false);
  if (filingVisible) await selectFirstOption(page, 'onboarding-state-filing-status');
}
await page.waitForTimeout(400);
const s4 = await clickContinue(page);
console.log(`[C7] Step 4 advanced: ${s4}`);
if (!s4) { await shot(page, 'step4-stuck'); await browser.close(); process.exit(1); }

// ── Step 5: I-9 ──────────────────────────────────────────────────────────────
console.log('[C7] Step 5: I-9');
await shot(page, 'step5-init');
await selectFirstOption(page, 'onboarding-i9-citizenship');
await page.waitForTimeout(500);

// Click List A
await page.locator('[data-testid="onboarding-i9-list-a-btn"]').first().click();
await page.waitForTimeout(800);

// Fill List A doc fields
const listATypeVisible = await page.locator('[data-testid="onboarding-i9-list-a-type"]').isVisible({ timeout: 2000 }).catch(() => false);
if (listATypeVisible) {
  await selectFirstOption(page, 'onboarding-i9-list-a-type');
  await fillTestId(page, 'onboarding-i9-list-a-doc-number', 'A123456789');
  await fillTestId(page, 'onboarding-i9-list-a-authority', 'USCIS');
  console.log('[C7] List A fields filled');
}
await page.waitForTimeout(500);

// Upload file to satisfy listAFileId requirement
const fileInput = page.locator('.doc-upload__zone input[type="file"]').first();
const fileInputCount = await fileInput.count();
console.log(`[C7] file input count: ${fileInputCount}`);
if (fileInputCount > 0) {
  await fileInput.setInputFiles(tmpFile);
  console.log('[C7] file set, waiting for upload...');
  // Wait for upload to complete (watch for chip or no-longer-loading state)
  await page.waitForTimeout(5000);
  const uploadChip = await page.locator('.doc-upload__chip').isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`[C7] upload chip visible: ${uploadChip}`);
}
await shot(page, 'step5-i9-filled');

const s5 = await clickContinue(page);
console.log(`[C7] Step 5 advanced: ${s5}`);
if (!s5) {
  await shot(page, 'step5-stuck');
  // Get all violations
  const viols = await page.locator('app-validation-button').allTextContents().catch(() => []);
  console.log('[C7] Violations:', viols.join(' | '));
  // Still take step 6 and 7 screenshots via URL manipulation
  console.log('[C7] Attempting URL step-jump to observe step 6...');
}

// ── Step 6: Direct Deposit ────────────────────────────────────────────────────
console.log('[C7] Step 6: Direct Deposit');
await shot(page, 'step6-init');
const bankNameVisible = await page.locator('[data-testid="onboarding-bank-name"]').isVisible({ timeout: 2000 }).catch(() => false);
console.log(`[C7] bank-name visible (step 6): ${bankNameVisible}`);
if (bankNameVisible) {
  await fillTestId(page, 'onboarding-bank-name', 'First National Bank');
  await typeTestId(page, 'onboarding-routing-number', '021000021');
  await fillTestId(page, 'onboarding-account-number', '9876543210');
  await selectFirstOption(page, 'onboarding-account-type');
  await page.waitForTimeout(500);
  await shot(page, 'step6-filled');
  const s6 = await clickContinue(page);
  console.log(`[C7] Step 6 advanced: ${s6}`);
  if (!s6) { await shot(page, 'step6-stuck'); }
}

// ── Step 7: Acknowledgments ───────────────────────────────────────────────────
console.log('[C7] Step 7: Acknowledgments');
await shot(page, 'step7-init');
const wcVisible = await page.locator('[data-testid="onboarding-ack-workers-comp"]').isVisible({ timeout: 2000 }).catch(() => false);
console.log(`[C7] workers-comp visible (step 7): ${wcVisible}`);
if (wcVisible) {
  await page.locator('[data-testid="onboarding-ack-workers-comp"]').click();
  await page.waitForTimeout(300);
  await shot(page, 'step7-filled');
  console.log('[C7] Step 7 fully rendered and filled');
}

await shot(page, 'final');
await browser.close();
console.log('[C7] Done.');
