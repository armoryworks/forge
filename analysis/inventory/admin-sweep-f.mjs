// admin-sweep-f.mjs — Cycle 6 part 2: remaining queue items
// Targets: ADM-Q-005 (ann template dialog), ADM-Q-009b (exchange rate), ADM-Q-010 (training path),
//          ADM-Q-014 (presets 2+ compare), ADM-Q-016 (onboarding steps 2-7),
//          ADM-Q-018 (training module /id), ADM-Q-019 (training path /id), ADM-Q-022 (detail panel)

import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import { writeFileSync } from 'fs';
import * as path from 'path';

const BASE = 'http://localhost:4200';
const CREDS = { email: 'admin@forge.local', password: 'ForgeRun!2026' };
const OUT = path.resolve('admin-f-results.json');

const results = {};

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"], input[formcontrolname="email"]', CREDS.email);
  await page.fill('input[type="password"], input[formcontrolname="password"]', CREDS.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 10000 });
  console.log('Login OK, at:', page.url());
}

function save(key, data) {
  results[key] = data;
  writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.log(`[${key}] saved`);
}

async function snapPage(page, key) {
  const url = page.url();
  const text = await page.evaluate(() => document.body.innerText.slice(0, 4000));
  save(key, { url, text });
}

async function getDialogText(page) {
  const d = await page.$('mat-dialog-container, [role="dialog"]');
  if (!d) return null;
  return d.innerText().catch(() => null);
}

async function closeDialog(page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  // Verify closed
  const d = await page.$('mat-dialog-container, [role="dialog"]');
  if (d) {
    // Try clicking outside or backdrop
    await page.mouse.click(10, 10).catch(() => {});
    await page.waitForTimeout(500);
  }
}

async function clickButton(page, ...texts) {
  for (const txt of texts) {
    const upper = txt.toUpperCase();
    const btns = await page.$$('button');
    for (const btn of btns) {
      const t = await btn.innerText().catch(() => '');
      if (t.trim().toUpperCase().includes(upper)) {
        await btn.click();
        return true;
      }
    }
  }
  return false;
}

async function waitForDialog(page, timeout = 4000) {
  await page.waitForSelector('mat-dialog-container, [role="dialog"]', { timeout }).catch(() => {});
  return page.$('mat-dialog-container, [role="dialog"]');
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

try {
  await login(page);

  // ─── ADM-Q-005: Announcements TEMPLATES tab — NEW TEMPLATE dialog ───
  await page.goto(`${BASE}/admin/announcements`);
  await page.waitForLoadState('networkidle');
  // Click TEMPLATES tab
  const tabs = await page.$$('[role="tab"]');
  let templateTabClicked = false;
  for (const tab of tabs) {
    const t = await tab.innerText().catch(() => '');
    if (t.toUpperCase().includes('TEMPLATE')) {
      await tab.click();
      await page.waitForTimeout(1000);
      templateTabClicked = true;
      break;
    }
  }
  await snapPage(page, 'ann-templates-tab-v2');
  // Now look for NEW TEMPLATE button specifically
  await clickButton(page, 'NEW TEMPLATE', 'ADD TEMPLATE');
  const annTplDlg = await waitForDialog(page, 5000);
  if (annTplDlg) {
    const dc = await getDialogText(page);
    save('ann-template-new-dialog-ADM-Q-005', { url: page.url(), dialogContent: dc });
    await closeDialog(page);
  } else {
    save('ann-template-new-dialog-ADM-Q-005', { url: page.url(), note: 'dialog not opened; template tab=' + templateTabClicked });
  }

  // ─── ADM-Q-009b: Exchange rate SET RATE dialog ───
  await page.goto(`${BASE}/admin/currencies`);
  await page.waitForLoadState('networkidle');
  await snapPage(page, 'currencies-page');
  // First add a currency so SET RATE has something to work with
  await clickButton(page, 'NEW CURRENCY', 'ADD CURRENCY');
  const curDlg = await waitForDialog(page, 3000);
  if (curDlg) {
    // Fill ISO code only to get a currency in the list
    await page.fill('input[formcontrolname="code"], input[placeholder*="ISO" i], input[placeholder*="code" i]', 'USD').catch(() => {});
    await page.fill('input[formcontrolname="symbol"], input[placeholder*="symbol" i]', '$').catch(() => {});
    await page.fill('input[formcontrolname="name"], input[placeholder*="name" i]', 'US Dollar').catch(() => {});
    await page.fill('input[formcontrolname="decimalPlaces"], input[placeholder*="decimal" i]', '2').catch(() => {});
    await clickButton(page, 'SAVE').catch(() => {});
    await page.waitForTimeout(1500);
  }
  await snapPage(page, 'currencies-after-add');
  // Now try SET RATE
  await clickButton(page, 'SET RATE', 'EXCHANGE RATE', 'ADD RATE');
  const rateDlg = await waitForDialog(page, 5000);
  if (rateDlg) {
    const dc = await getDialogText(page);
    save('exchange-rate-dialog-ADM-Q-009b', { url: page.url(), dialogContent: dc });
    await closeDialog(page);
  } else {
    save('exchange-rate-dialog-ADM-Q-009b', { url: page.url(), note: 'SET RATE dialog not found' });
  }

  // ─── ADM-Q-010: Training path NEW PATH dialog ───
  await page.goto(`${BASE}/admin/training`);
  await page.waitForLoadState('networkidle');
  await snapPage(page, 'training-admin-content');
  // Switch to PATHS tab
  const trnTabs = await page.$$('[role="tab"]');
  for (const tab of trnTabs) {
    const t = await tab.innerText().catch(() => '');
    if (t.toUpperCase().includes('PATH')) {
      await tab.click();
      await page.waitForTimeout(800);
      break;
    }
  }
  await snapPage(page, 'training-paths-tab-v2');
  await clickButton(page, 'NEW PATH', 'ADD PATH');
  const pathDlg = await waitForDialog(page, 5000);
  if (pathDlg) {
    const dc = await getDialogText(page);
    save('training-path-new-dialog-ADM-Q-010', { url: page.url(), dialogContent: dc });
    await closeDialog(page);
  } else {
    save('training-path-new-dialog-ADM-Q-010', { url: page.url(), note: 'dialog not opened' });
  }

  // ─── ADM-Q-018: Seed training module + navigate /training/module/:id ───
  await page.goto(`${BASE}/admin/training`);
  await page.waitForLoadState('networkidle');
  // Content tab should be default; look for NEW MODULE
  await clickButton(page, 'NEW MODULE', 'ADD MODULE');
  const modDlg = await waitForDialog(page, 5000);
  let seededModSlug = null;
  if (modDlg) {
    const dc = await getDialogText(page);
    save('training-module-new-dialog-ADM-Q-018-prefill', { url: page.url(), dialogContent: dc });
    // Fill required fields
    const slug = 'sweep-test-' + Date.now();
    seededModSlug = slug;
    await page.fill('input[formcontrolname="title"]', 'Sweep Test Module').catch(() => {});
    await page.fill('input[formcontrolname="slug"]', slug).catch(() => {});
    await page.fill('textarea[formcontrolname="summary"]', 'Module seeded by ui-scout sweep').catch(() => {});
    await page.waitForTimeout(300);
    // Toggle Published on (if toggle available)
    const publishToggle = await page.$('mat-slide-toggle[formcontrolname="published"], mat-slide-toggle');
    if (publishToggle) {
      const checked = await publishToggle.getAttribute('aria-checked');
      if (checked !== 'true') await publishToggle.click().catch(() => {});
    }
    // Submit
    await clickButton(page, 'CREATE MODULE', 'CREATE', 'SAVE');
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
    await snapPage(page, 'training-after-module-seed');
  }
  // Navigate to training viewer
  await page.goto(`${BASE}/training/modules`);
  await page.waitForLoadState('networkidle');
  // Go to ALL MODULES tab
  const viewTabs = await page.$$('[role="tab"]');
  for (const tab of viewTabs) {
    const t = await tab.innerText().catch(() => '');
    if (t.toUpperCase().includes('ALL MODULE')) {
      await tab.click();
      await page.waitForTimeout(1000);
      break;
    }
  }
  await snapPage(page, 'training-all-modules-tab-v2');
  // Click first module card/row
  const modCards = await page.$$('mat-card, .module-card, a[href*="/training/module/"]');
  if (modCards.length) {
    await modCards[0].click();
    await page.waitForLoadState('networkidle');
    await snapPage(page, 'training-module-detail-ADM-Q-018');
  } else if (seededModSlug) {
    await page.goto(`${BASE}/training/module/${seededModSlug}`);
    await page.waitForLoadState('networkidle');
    await snapPage(page, 'training-module-direct-ADM-Q-018');
  } else {
    save('training-module-detail-ADM-Q-018', { url: page.url(), note: 'no modules found and no slug available' });
  }

  // ─── ADM-Q-019: Training path /id ───
  await page.goto(`${BASE}/admin/training`);
  await page.waitForLoadState('networkidle');
  const pathTabs2 = await page.$$('[role="tab"]');
  for (const tab of pathTabs2) {
    const t = await tab.innerText().catch(() => '');
    if (t.toUpperCase().includes('PATH')) {
      await tab.click();
      await page.waitForTimeout(800);
      break;
    }
  }
  await clickButton(page, 'NEW PATH', 'ADD PATH');
  const pathSeedDlg = await waitForDialog(page, 5000);
  let seededPathId = null;
  if (pathSeedDlg) {
    await page.fill('input[formcontrolname="name"]', 'Sweep Test Path').catch(() => {});
    await page.fill('textarea[formcontrolname="description"]', 'Path seeded by ui-scout sweep').catch(() => {});
    await page.waitForTimeout(300);
    await clickButton(page, 'CREATE PATH', 'CREATE', 'SAVE');
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
    // Try to get slug from URL or list
    await snapPage(page, 'training-after-path-seed');
  }
  // Navigate to training/modules PATHS tab
  await page.goto(`${BASE}/training/modules`);
  await page.waitForLoadState('networkidle');
  const pathViewTabs = await page.$$('[role="tab"]');
  for (const tab of pathViewTabs) {
    const t = await tab.innerText().catch(() => '');
    if (t.toUpperCase().includes('PATH')) {
      await tab.click();
      await page.waitForTimeout(1000);
      break;
    }
  }
  await snapPage(page, 'training-paths-viewer-v2');
  const pathCards = await page.$$('mat-card, .path-card, a[href*="/training/path/"]');
  if (pathCards.length) {
    await pathCards[0].click();
    await page.waitForLoadState('networkidle');
    await snapPage(page, 'training-path-detail-ADM-Q-019');
  } else {
    save('training-path-detail-ADM-Q-019', { url: page.url(), note: 'no paths found in viewer after seeding' });
  }

  // ─── ADM-Q-022: TrainingDetailPanel/Dialog — expand module row in admin ───
  await page.goto(`${BASE}/admin/training`);
  await page.waitForLoadState('networkidle');
  // Should be on CONTENT tab with seeded module
  await snapPage(page, 'training-admin-content-v2');
  // Try clicking a row
  const modRows = await page.$$('mat-row, tr:not(:first-child), .module-row, mat-expansion-panel-header');
  if (modRows.length) {
    await modRows[0].click();
    await page.waitForTimeout(1000);
    // Check if detail panel appeared or dialog opened
    const dlgContent = await getDialogText(page);
    if (dlgContent) {
      save('training-detail-dialog-ADM-Q-022', { url: page.url(), dialogContent: dlgContent });
      await closeDialog(page);
    } else {
      await snapPage(page, 'training-detail-panel-ADM-Q-022');
    }
  }
  // Also look for edit icon buttons on rows
  const editBtns = await page.$$('button[aria-label*="edit" i], button mat-icon:has-text("edit"), [aria-label*="detail" i]');
  if (editBtns.length) {
    await editBtns[0].click();
    await page.waitForTimeout(1000);
    const dlgContent = await getDialogText(page);
    save('training-detail-from-edit-btn-ADM-Q-022', { url: page.url(), dialogContent: dlgContent });
    if (dlgContent) await closeDialog(page);
  }

  // ─── ADM-Q-014: Presets compare with 2+ selected ───
  await page.goto(`${BASE}/admin/presets`);
  await page.waitForLoadState('networkidle');
  await snapPage(page, 'presets-list-v2');
  // Check preset rows for checkboxes
  const cbInputs = await page.$$('mat-checkbox input[type="checkbox"]');
  let checked = 0;
  for (const cb of cbInputs) {
    if (checked >= 2) break;
    await cb.click().catch(async () => {
      // If direct click fails, use parent
      const parent = await cb.$('xpath=..');
      if (parent) await parent.click().catch(() => {});
    });
    await page.waitForTimeout(200);
    checked++;
  }
  await snapPage(page, 'presets-2-checked');
  // Click COMPARE button
  const compareClicked = await clickButton(page, 'COMPARE');
  await page.waitForTimeout(1000);
  await snapPage(page, 'presets-compare-ADM-Q-014');

  // ─── ADM-Q-016: Onboarding wizard steps 2–7 ───
  // Use engineer account (fresh profile = hits onboarding) or admin
  // Try as admin — if already past onboarding, navigate directly
  await page.goto(`${BASE}/onboarding`);
  await page.waitForLoadState('networkidle');
  await snapPage(page, 'onboarding-step1-v2');

  // Try to advance through steps by clicking NEXT/CONTINUE each time
  for (let step = 2; step <= 7; step++) {
    const nextClicked = await clickButton(page, 'NEXT', 'CONTINUE', 'SAVE & CONTINUE');
    await page.waitForTimeout(1500);
    await page.waitForLoadState('networkidle').catch(() => {});
    const url = page.url();
    const text = await page.evaluate(() => document.body.innerText.slice(0, 3000));
    save(`onboarding-step${step}-ADM-Q-016`, { url, text, nextClicked });
    if (!url.includes('/onboarding')) {
      console.log(`Onboarding redirected away at step ${step}: ${url}`);
      break;
    }
  }

  console.log('Sweep F complete. Results at', OUT);

} catch (err) {
  results['__error'] = { message: err.message, stack: err.stack };
  writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.error('Sweep error:', err.message);
} finally {
  await browser.close();
}
