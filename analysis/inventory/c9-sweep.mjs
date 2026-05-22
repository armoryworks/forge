/**
 * Cycle 9 sweep — final targeted items
 * - Part detail panel (click ACTIVE row with Status=Active filter)
 * - Callback scheduler (pull lead into queue, press C)
 * - Customer detail dialog via URL
 * - Inventory receiving tab details
 */

import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:4200';
const SS_DIR = 'E:/dev/forge/analysis/inventory/screenshots';
const RESULTS_FILE = 'E:/dev/forge/analysis/inventory/c9-results.json';
const ADMIN = { email: 'admin@forge.local', password: 'ForgeRun!2026' };

const log = (msg) => console.log(`[c9] ${msg}`);
const results = {};

function ss(page, name) {
  return page.screenshot({ path: path.join(SS_DIR, `c9-${name}.png`), fullPage: false }).catch(() => {});
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.locator('input[type="email"]').fill(ADMIN.email);
  await page.locator('input[type="password"]').fill(ADMIN.password);
  await page.waitForTimeout(300);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 15000 });
  log(`Logged in → ${page.url()}`);
}

async function waitNav(page, url, timeout = 10000) {
  try {
    await page.goto(`${BASE_URL}${url}`);
    await page.waitForLoadState('networkidle', { timeout });
  } catch {}
}

async function bodyText(page) {
  return page.evaluate(() => document.body.innerText).catch(() => '');
}

// Dismiss the onboarding overlay fully (click YES to confirm)
async function dismissOverlay(page) {
  // First try SKIP ONBOARDING
  try {
    const skipBtn = page.locator('button:has-text("SKIP ONBOARDING")');
    if (await skipBtn.isVisible({ timeout: 1000 })) {
      await skipBtn.click();
      await page.waitForTimeout(800);
    }
  } catch {}
  // Then confirm YES MARK AS ONBOARDED
  try {
    const yesBtn = page.locator('button:has-text("YES, MARK AS ONBOARDED")');
    if (await yesBtn.isVisible({ timeout: 1000 })) {
      await yesBtn.click();
      await page.waitForTimeout(500);
      log('Confirmed onboarding dismissal');
    }
  } catch {}
}

const browser = await chromium.launch({ headless: true });

// =============================================================
// PHASE A: Part detail panel/dialog — click ACTIVE part row
// =============================================================
log('=== Phase A: Part detail panel ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);
  await waitNav(page, '/parts');
  await page.waitForTimeout(2500);
  await dismissOverlay(page);
  await ss(page, 'parts-list-before-click');

  // Filter to Active to see only PRT-00001
  // The page has a Status filter dropdown — it's already "Active" by default based on c8 screenshot
  // So just click the last row (Widget A / PRT-00001)
  // Use :has-text to find the row with PRT-00001
  const activeRow = page.locator('tr:has-text("Widget A"), tr:has-text("PRT-00001")').first();
  const hasActive = await activeRow.isVisible({ timeout: 3000 }).catch(() => false);
  log(`Active part row visible: ${hasActive}`);

  if (hasActive) {
    await activeRow.click({ force: true });
    await page.waitForTimeout(3000);
    await dismissOverlay(page);
    await ss(page, 'part-detail-panel-active');
    const panelText = await bodyText(page);
    results.partDetailPanel = panelText.substring(0, 2000);
    log('Part detail panel: ' + panelText.substring(0, 400));

    // Panel structure
    const panelInfo = await page.evaluate(() => {
      // Look for the detail panel component
      const panel = document.querySelector(
        'app-part-detail-panel, app-part-detail-dialog, [class*="detail-panel"], mat-dialog-container'
      );
      if (!panel) {
        // Maybe it opened a dialog - look for overlay
        const overlay = document.querySelector('mat-dialog-container, cdk-dialog-container');
        if (overlay) {
          const tabs = Array.from(overlay.querySelectorAll('[role="tab"], mat-tab-label, [class*="tab-label"]'))
            .map(t => t.textContent.trim().slice(0, 30));
          return { found: 'dialog', tabs, text: overlay.textContent.trim().slice(0, 300) };
        }
        return { found: false, panelEls: Array.from(document.querySelectorAll('[class*="panel"]')).filter(el => el.offsetParent !== null).map(el => el.className.slice(0, 60)).slice(0, 5) };
      }
      const tabs = Array.from(panel.querySelectorAll('[role="tab"], [class*="tab-label"]'))
        .map(t => t.textContent.trim().slice(0, 30));
      return { found: panel.tagName + '.' + panel.className.slice(0, 50), tabs, text: panel.textContent.trim().slice(0, 300) };
    });
    results.partDetailPanelInfo = panelInfo;
    log('Part panel info: ' + JSON.stringify(panelInfo));

    // If tabs found, click through them
    if (panelInfo.tabs && panelInfo.tabs.length > 0) {
      const tabs = page.locator('mat-dialog-container [role="tab"], [class*="detail"] [role="tab"]');
      const tabCount = await tabs.count();
      log(`Found ${tabCount} tabs in part detail`);
      for (let i = 0; i < Math.min(tabCount, 5); i++) {
        try {
          const tabText = await tabs.nth(i).textContent().catch(() => `tab-${i}`);
          await tabs.nth(i).click({ force: true });
          await page.waitForTimeout(1000);
          await ss(page, `part-detail-tab-${tabText.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 20)}`);
          log(`Part detail tab ${i}: ${tabText.trim()}`);
        } catch (e) {
          log(`Tab ${i} error: ${e.message.slice(0, 80)}`);
        }
      }
    }
    await page.keyboard.press('Escape');
  } else {
    log('No active part row found — trying last row');
    // Try clicking the last row
    const allRows = page.locator('tbody tr');
    const rowCount = await allRows.count();
    if (rowCount > 0) {
      await allRows.last().click({ force: true });
      await page.waitForTimeout(2500);
      await dismissOverlay(page);
      await ss(page, 'part-last-row-click');
      results.partDetailPanel = (await bodyText(page)).substring(0, 1000);
      log('Last row click: ' + results.partDetailPanel.substring(0, 200));
      await page.keyboard.press('Escape');
    }
  }

  await ctx.close();
}

// =============================================================
// PHASE B: Callback scheduler — pull leads into queue
// =============================================================
log('=== Phase B: Callback scheduler ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);
  await waitNav(page, '/leads/queue');
  await page.waitForTimeout(2000);
  await dismissOverlay(page);
  await ss(page, 'leads-queue-empty');

  // Click PULL NEXT 5 to pull leads into queue
  const pullBtn = page.locator('button:has-text("PULL NEXT"), button:has-text("Pull Next")').first();
  if (await pullBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await pullBtn.click({ force: true });
    await page.waitForTimeout(3000);
    await dismissOverlay(page);
    await ss(page, 'leads-queue-after-pull');
    const queueText = await bodyText(page);
    results.leadsQueueAfterPull = queueText.substring(0, 1500);
    log('Queue after pull: ' + queueText.substring(0, 400));

    // Look for disposition action buttons
    const actionBtns = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button, [role="button"]')).filter(b => b.offsetParent !== null).map(b => ({
        text: b.textContent.trim().slice(0, 50),
        key: b.getAttribute('data-key') || b.getAttribute('aria-label') || ''
      })).filter(b => b.text || b.key)
    );
    results.queueActionButtons = actionBtns;
    log('Queue action buttons: ' + JSON.stringify(actionBtns.slice(0, 20)));

    // Try pressing 'C' for callback
    await page.keyboard.press('c');
    await page.waitForTimeout(2000);
    await ss(page, 'callback-scheduler-dialog');
    const callbackText = await bodyText(page);
    results.callbackScheduler = callbackText.substring(0, 1500);
    log('Callback scheduler: ' + callbackText.substring(0, 400));
    await page.keyboard.press('Escape');

    // Also try clicking any visible "Callback" or "Schedule" button
    const callbackBtn = page.locator('button:has-text("Callback"), button:has-text("CALLBACK"), button:has-text("Schedule"), button[data-key="c"]').first();
    if (await callbackBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await callbackBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await ss(page, 'callback-scheduler-dialog-btn');
      results.callbackSchedulerBtn = (await bodyText(page)).substring(0, 1000);
      log('Callback via button: ' + results.callbackSchedulerBtn.substring(0, 200));
      await page.keyboard.press('Escape');
    }
  } else {
    log('No PULL NEXT button found');
    const allBtns = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null).map(b => b.textContent.trim().slice(0, 50)).filter(t => t)
    );
    log('Buttons: ' + JSON.stringify(allBtns));
    results.callbackScheduler = 'no-pull-button-found';
  }

  await ctx.close();
}

// =============================================================
// PHASE C: Customer detail dialog via ?detail= URL
// =============================================================
log('=== Phase C: Customer detail dialog ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);
  await waitNav(page, '/customers?detail=customer:2');
  await page.waitForTimeout(3000);
  await dismissOverlay(page);
  await ss(page, 'customer-detail-dialog');
  const dialogText = await bodyText(page);
  results.customerDetailDialog = dialogText.substring(0, 2000);
  log('Customer detail dialog: ' + dialogText.substring(0, 400));

  // Check for dialog/panel structure
  const dialogInfo = await page.evaluate(() => {
    const dialog = document.querySelector('mat-dialog-container, app-customer-detail-dialog, [class*="detail-dialog"]');
    if (!dialog) return { found: false, url: window.location.href };
    const tabs = Array.from(dialog.querySelectorAll('[role="tab"]')).map(t => t.textContent.trim().slice(0, 30));
    return { found: true, tag: dialog.tagName, class: dialog.className.slice(0, 80), tabs, text: dialog.textContent.trim().slice(0, 300) };
  });
  results.customerDetailDialogInfo = dialogInfo;
  log('Customer detail dialog info: ' + JSON.stringify(dialogInfo));

  await ctx.close();
}

// =============================================================
// PHASE D: Inventory receiving + PO list
// =============================================================
log('=== Phase D: Inventory receiving ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);

  await waitNav(page, '/inventory/receiving');
  await page.waitForTimeout(2500);
  await dismissOverlay(page);
  await ss(page, 'inv-receiving');
  const recText = await bodyText(page);
  results.invReceiving = recText.substring(0, 800);
  log('Inv receiving: ' + recText.substring(0, 300));

  // Check if receiving has any items
  const receivingRows = page.locator('tbody tr');
  const rowCount = await receivingRows.count();
  log(`Receiving rows: ${rowCount}`);
  if (rowCount > 0) {
    await receivingRows.first().click({ force: true });
    await page.waitForTimeout(2000);
    await dismissOverlay(page);
    await ss(page, 'inv-receiving-panel');
    results.invReceivingPanel = (await bodyText(page)).substring(0, 800);
    log('Receiving panel: ' + results.invReceivingPanel.substring(0, 200));
    await page.keyboard.press('Escape');
  }

  // Inventory tabs
  for (const tab of ['stock', 'locations', 'movements', 'receiving', 'adjustments']) {
    await waitNav(page, `/inventory/${tab}`);
    await page.waitForTimeout(1500);
    await dismissOverlay(page);
    const text = await bodyText(page);
    const url = page.url();
    results[`inv_${tab}`] = { url: url.replace(BASE_URL, ''), text: text.substring(0, 400) };
    log(`/inventory/${tab} → ${url.replace(BASE_URL, '')} | ${text.substring(0, 100)}`);
  }

  await ctx.close();
}

// =============================================================
// Write results
// =============================================================
await browser.close();
fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
log(`=== c9 sweep complete — ${RESULTS_FILE} ===`);

for (const [k, v] of Object.entries(results)) {
  const val = typeof v === 'string' ? v.substring(0, 150) : typeof v === 'object' && v.text ? v.text.substring(0, 150) : JSON.stringify(v).substring(0, 200);
  console.log(`\n--- ${k} ---\n${val}`);
}
