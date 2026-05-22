/**
 * Operations inventory sweep — Cycle G
 * Targets: job detail panel (K-04..K-11), backlog card-grid, timer, quality dialogs
 * Uses precise selectors from source audit
 */

import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:4200';
const SS_DIR = 'E:/dev/forge/analysis/inventory/screenshots';
const RESULTS_FILE = 'E:/dev/forge/analysis/inventory/ops-g-results.json';
const ADMIN = { email: 'admin@forge.local', password: 'ForgeRun!2026' };

const log = (msg) => console.log(`[ops-g] ${msg}`);
const results = {};

function ss(page, name) {
  return page.screenshot({ path: path.join(SS_DIR, `ops-g-${name}.png`), fullPage: false }).catch(() => {});
}

async function login(page, creds = ADMIN) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.locator('input[type="email"]').fill(creds.email);
  await page.locator('input[type="password"]').fill(creds.password);
  await page.waitForTimeout(500);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 20000 });
  log(`Logged in → ${page.url()}`);
}

async function gotoAndWait(page, url, extra = 3000) {
  log(`nav → ${url}`);
  const navP = page.goto(`${BASE_URL}${url}`, { waitUntil: 'commit', timeout: 8000 }).catch(e => log(`nav err: ${e.message}`));
  await Promise.race([navP, new Promise(r => setTimeout(r, 8000))]);
  await page.waitForTimeout(extra);
}

async function bodyText(page) {
  return page.evaluate(() => document.body.innerText).catch(() => '');
}

async function dismissOverlay(page) {
  try {
    const skipBtn = page.locator('button:has-text("SKIP ONBOARDING")');
    if (await skipBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(400);
    }
  } catch {}
}

// Close CDK overlay by pressing Escape or clicking backdrop
async function closePanel(page) {
  try {
    const closeBtn = page.locator('button.panel__close, button[aria-label*="close"], button[aria-label*="Close"]').first();
    if (await closeBtn.isVisible({ timeout: 800 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(500);
      return;
    }
  } catch {}
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
}

const browser = await chromium.launch({ headless: true });

// ============================================================
// G1: Job Detail Panel — K-04, K-05, K-06(edit), K-08..K-11
// ============================================================
log('=== G1: Job Detail Panel ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);
  await gotoAndWait(page, '/kanban', 4000);
  await dismissOverlay(page);

  // Click job card (cardClicked fires on the host element)
  const jobCard = page.locator('app-job-card').first();
  const cardVisible = await jobCard.isVisible({ timeout: 4000 }).catch(() => false);
  log(`Job card visible: ${cardVisible}`);

  if (cardVisible) {
    await jobCard.click();
    await page.waitForTimeout(3500); // wait for panel animation
    await ss(page, 'job-detail-panel-open');
    const text = await bodyText(page);
    results['job-detail-panel'] = { text: text.substring(0, 6000) };
    log(`Job detail panel body (${text.length} chars): ${text.substring(0, 600)}`);

    // Confirm panel sections
    const hasCostAnalysis = text.includes('Cost Analysis');
    const hasOpTime = text.includes('Operation Time');
    const hasSubtasks = text.includes('Subtask') || text.includes('subtask');
    log(`Panel sections — Cost Analysis: ${hasCostAnalysis}, Operation Time: ${hasOpTime}, Subtasks: ${hasSubtasks}`);

    // Scroll panel to find cost/optime sections
    const costSection = page.locator('h3:has-text("Cost Analysis")').first();
    if (await costSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await costSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await ss(page, 'job-cost-section');
      log('Cost Analysis section scrolled into view');
    }

    // Cover photo button (class: panel__cover-btn, icon: add_photo_alternate)
    const coverBtn = page.locator('button.panel__cover-btn').first();
    const coverBtnVisible = await coverBtn.isVisible({ timeout: 2000 }).catch(() => false);
    log(`Cover photo button visible: ${coverBtnVisible}`);
    if (coverBtnVisible) {
      await coverBtn.click();
      await page.waitForTimeout(2000);
      await ss(page, 'cover-photo-dialog');
      const dlgText = await bodyText(page);
      results['cover-photo-dialog'] = dlgText.substring(0, 3000);
      log(`Cover photo dialog: ${dlgText.substring(0, 300)}`);
      await closePanel(page);
    }

    // Edit button (class: panel__edit) — opens K-07 JobDialog in edit mode
    const editBtn = page.locator('button.panel__edit').first();
    const editBtnVisible = await editBtn.isVisible({ timeout: 2000 }).catch(() => false);
    log(`Edit job button visible: ${editBtnVisible}`);
    if (editBtnVisible) {
      await editBtn.click();
      await page.waitForTimeout(2000);
      await ss(page, 'job-edit-dialog');
      const dlgText = await bodyText(page);
      results['job-edit-dialog'] = dlgText.substring(0, 3000);
      log(`Job edit dialog: ${dlgText.substring(0, 300)}`);
      await closePanel(page);
    }

    // Re-open panel for dispose button
    await gotoAndWait(page, '/kanban', 3000);
    const jobCard2 = page.locator('app-job-card').first();
    if (await jobCard2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await jobCard2.click();
      await page.waitForTimeout(3000);

      // Dispose button in sidebar (class: action-btn, text: "Dispose")
      const disposeBtn = page.locator('.action-btn:has-text("Dispose"), button.action-btn').first();
      const disposeBtnVisible = await disposeBtn.isVisible({ timeout: 2000 }).catch(() => false);
      log(`Dispose button visible: ${disposeBtnVisible}`);
      if (disposeBtnVisible) {
        await disposeBtn.click();
        await page.waitForTimeout(2000);
        await ss(page, 'dispose-job-dialog');
        const dlgText = await bodyText(page);
        results['dispose-job-dialog'] = dlgText.substring(0, 3000);
        log(`Dispose job dialog: ${dlgText.substring(0, 300)}`);
        await closePanel(page);
      }
    }
  } else {
    log('No job cards visible on kanban board');
    results['job-detail-panel'] = { error: 'no-cards' };
  }
  await ctx.close();
}

// ============================================================
// G2: Backlog card-grid toggle
// ============================================================
log('=== G2: Backlog Card-Grid ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);
  await gotoAndWait(page, '/backlog', 3000);
  await dismissOverlay(page);
  await ss(page, 'backlog-table');

  // The card-grid toggle is a mat-icon button with icon "view_module" or "apps"
  // Look in the page toolbar area (app-toolbar buttons)
  const allBtns = await page.locator('button').all();
  log(`Total buttons on backlog: ${allBtns.length}`);

  // Try icon-only buttons in toolbar region
  const gridToggle = page.locator('button:has(mat-icon), button:has(.mat-icon)').filter({ hasText: /view_module|apps|grid_view|view_comfy/ }).first();
  const gridToggleVisible = await gridToggle.isVisible({ timeout: 1000 }).catch(() => false);
  log(`Grid toggle (mat-icon filter): ${gridToggleVisible}`);

  // Try by evaluating buttons with specific material icons
  const gridBtnIdx = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.findIndex(b => {
      const text = b.textContent?.trim() || '';
      return text.includes('view_module') || text.includes('apps') || text.includes('grid_view') || text.includes('view_comfy');
    });
  }).catch(() => -1);
  log(`Grid button index from evaluate: ${gridBtnIdx}`);

  if (gridBtnIdx >= 0) {
    const btns = page.locator('button');
    await btns.nth(gridBtnIdx).click();
    await page.waitForTimeout(1500);
    await ss(page, 'backlog-card-grid');
    results['backlog-card-grid'] = (await bodyText(page)).substring(0, 3000);
    log(`Backlog card-grid: ${results['backlog-card-grid'].substring(0, 300)}`);
  } else {
    // Fallback: try clicking a second button in the toolbar
    const toolbarBtns = page.locator('app-page-header button, app-toolbar button');
    const tbCount = await toolbarBtns.count().catch(() => 0);
    log(`Toolbar buttons: ${tbCount}`);
    // Log all button texts
    for (let i = 0; i < Math.min(tbCount, 10); i++) {
      const txt = await toolbarBtns.nth(i).textContent().catch(() => '');
      log(`  toolbar btn[${i}]: "${txt.trim()}"`);
    }
    results['backlog-card-grid'] = { error: 'toggle-btn-not-found', toolbarBtnCount: tbCount };
  }
  await ctx.close();
}

// ============================================================
// G3: Time-Tracking timer start + stop
// ============================================================
log('=== G3: Time-Tracking Timer ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);
  await gotoAndWait(page, '/time-tracking', 3000);
  await dismissOverlay(page);

  const startBtn = page.locator('button:has-text("START TIMER")').first();
  const startBtnVisible = await startBtn.isVisible({ timeout: 3000 }).catch(() => false);
  log(`START TIMER btn: ${startBtnVisible}`);

  if (startBtnVisible) {
    await startBtn.click();
    await page.waitForTimeout(2000);
    await ss(page, 'timer-start-dialog');
    const dlgText = await bodyText(page);
    results['timer-start-dialog'] = dlgText.substring(0, 3000);
    log(`Timer start dialog: ${dlgText.substring(0, 400)}`);

    // Find and click the submit button (START or LOG)
    const submitBtn = page.locator('app-validation-button button, button:has-text("START"):not(:has-text("START TIMER")), button[type="submit"]').last();
    const submitVisible = await submitBtn.isVisible({ timeout: 1500 }).catch(() => false);
    log(`Timer dialog submit btn visible: ${submitVisible}`);

    if (submitVisible) {
      // Select a category first if dropdown exists
      const catSelect = page.locator('app-select mat-select, mat-select').first();
      if (await catSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await catSelect.click();
        await page.waitForTimeout(800);
        const firstOption = page.locator('mat-option').first();
        if (await firstOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await firstOption.click();
          await page.waitForTimeout(500);
        }
      }

      await submitBtn.click();
      await page.waitForTimeout(2500);
      await ss(page, 'timer-running');
      const runText = await bodyText(page);
      results['timer-running'] = runText.substring(0, 3000);
      log(`Timer running state: ${runText.substring(0, 300)}`);

      // Look for STOP TIMER button
      const stopBtn = page.locator('button:has-text("STOP")').first();
      const stopBtnVisible = await stopBtn.isVisible({ timeout: 3000 }).catch(() => false);
      log(`STOP btn visible: ${stopBtnVisible}`);
      if (stopBtnVisible) {
        await stopBtn.click();
        await page.waitForTimeout(2000);
        await ss(page, 'timer-stop-dialog');
        results['timer-stop-dialog'] = (await bodyText(page)).substring(0, 3000);
        log(`Timer stop dialog: ${results['timer-stop-dialog'].substring(0, 300)}`);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    } else {
      await page.keyboard.press('Escape');
    }
  }
  await ctx.close();
}

// ============================================================
// G4: Quality create dialogs
// ============================================================
log('=== G4: Quality Create Dialogs ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);

  const targets = [
    { tab: 'inspections', btn: 'NEW INSPECTION', key: 'quality-insp-dialog' },
    { tab: 'lots', btn: 'NEW LOT', key: 'quality-lot-dialog' },
    { tab: 'ncrs', btn: 'NEW NCR', key: 'quality-ncr-dialog' },
    { tab: 'capas', btn: 'NEW CAPA', key: 'quality-capa-dialog' },
    { tab: 'ecos', btn: 'NEW ECO', key: 'quality-eco-dialog' },
    { tab: 'gages', btn: 'NEW GAGE', key: 'quality-gage-dialog' },
  ];

  for (const { tab, btn, key } of targets) {
    await gotoAndWait(page, `/quality/${tab}`, 3000);
    await dismissOverlay(page);
    const createBtn = page.locator(`button:has-text("${btn}")`).first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      await ss(page, key);
      const txt = await bodyText(page);
      results[key] = txt.substring(0, 3000);
      log(`${key}: ${txt.substring(0, 300)}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
    } else {
      log(`${btn} button NOT visible on /quality/${tab}`);
    }
  }
  await ctx.close();
}

// ============================================================
// G5: Planning — create cycle, observe cycle board
// ============================================================
log('=== G5: Planning Cycle Board ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);
  await gotoAndWait(page, '/planning', 3000);
  await dismissOverlay(page);

  // Use CREATE FIRST CYCLE if no cycles, else NEW CYCLE button
  const cycleBtn = page.locator('button:has-text("CREATE FIRST CYCLE"), button:has-text("NEW CYCLE")').first();
  const cycleBtnVisible = await cycleBtn.isVisible({ timeout: 3000 }).catch(() => false);
  log(`Cycle button visible: ${cycleBtnVisible}`);

  if (cycleBtnVisible) {
    await cycleBtn.click();
    await page.waitForTimeout(2000);
    await ss(page, 'cycle-dialog');
    log(`Cycle dialog: ${(await bodyText(page)).substring(0, 400)}`);

    // Fill name
    const nameField = page.locator('app-input input, input[placeholder*="name" i], input[formcontrolname="name"]').first();
    if (await nameField.isVisible({ timeout: 1000 }).catch(() => false)) {
      await nameField.fill('Sprint 1');
      log('Filled cycle name: Sprint 1');
    }

    // Fill start date
    const dateInputs = page.locator('app-datepicker input, input[type="date"]');
    const dateCount = await dateInputs.count().catch(() => 0);
    log(`Date inputs: ${dateCount}`);
    if (dateCount >= 1) {
      await dateInputs.nth(0).fill('2026-05-22');
      await dateInputs.nth(0).press('Tab');
    }
    if (dateCount >= 2) {
      await dateInputs.nth(1).fill('2026-06-05');
      await dateInputs.nth(1).press('Tab');
    }
    await page.waitForTimeout(300);

    // Submit
    const createBtn = page.locator('app-validation-button button').last();
    if (await createBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(3000);
      await ss(page, 'planning-after-cycle-create');
      const txt = await bodyText(page);
      results['planning-cycle-created'] = txt.substring(0, 3000);
      log(`After cycle create (${txt.length} chars): ${txt.substring(0, 400)}`);

      // Check for cycle board component
      const cycleBoard = page.locator('app-cycle-board');
      const boardVisible = await cycleBoard.isVisible({ timeout: 3000 }).catch(() => false);
      log(`CycleBoard visible: ${boardVisible}`);
      if (boardVisible) {
        await ss(page, 'cycle-board-empty');
        results['cycle-board-empty'] = (await bodyText(page)).substring(0, 3000);
        log(`Cycle board empty: ${results['cycle-board-empty'].substring(0, 300)}`);
      }
    }
  }
  await ctx.close();
}

// ============================================================
// Write results
// ============================================================
fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
log(`Results → ${RESULTS_FILE}`);
await browser.close();
log('=== Sweep G complete ===');
