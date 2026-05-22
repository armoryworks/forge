/**
 * Operations inventory sweep — Cycle H
 * Focused: backlog card-grid, timer start/stop, quality dialogs, job dispose, planning cycle
 * Uses force clicks and try/catch on every action to prevent cascade failures
 */

import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:4200';
const SS_DIR = 'E:/dev/forge/analysis/inventory/screenshots';
const RESULTS_FILE = 'E:/dev/forge/analysis/inventory/ops-h-results.json';
const ADMIN = { email: 'admin@forge.local', password: 'ForgeRun!2026' };

const log = (msg) => console.log(`[ops-h] ${msg}`);
const results = {};

function ss(page, name) {
  return page.screenshot({ path: path.join(SS_DIR, `ops-h-${name}.png`), fullPage: false }).catch(e => log(`ss err ${name}: ${e.message}`));
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

async function navTo(page, url, wait = 3000) {
  log(`nav → ${url}`);
  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'commit', timeout: 8000 });
  } catch (e) { log(`nav err: ${e.message}`); }
  await page.waitForTimeout(wait);
  log(`at ${page.url()}`);
}

async function bodyText(page) {
  return page.evaluate(() => document.body.innerText).catch(() => '[no-text]');
}

async function dismissAll(page) {
  // Close any open dialogs/panels via Escape key
  try { await page.keyboard.press('Escape'); await page.waitForTimeout(400); } catch {}
  try { await page.keyboard.press('Escape'); await page.waitForTimeout(300); } catch {}
  // Also click any visible backdrop
  try {
    const backdrop = page.locator('.cdk-overlay-backdrop, .dialog-backdrop').first();
    if (await backdrop.isVisible({ timeout: 500 }).catch(() => false)) {
      await backdrop.click({ force: true });
      await page.waitForTimeout(400);
    }
  } catch {}
}

const browser = await chromium.launch({ headless: true });

// ============================================================
// H1: Backlog card-grid toggle (must find view toggle button)
// ============================================================
log('=== H1: Backlog Card-Grid ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);
  await navTo(page, '/backlog', 3000);

  await ss(page, 'backlog-table');
  const tableText = await bodyText(page);
  results['backlog-table'] = tableText.substring(0, 3000);
  log(`Backlog table: ${tableText.substring(0, 400)}`);

  // Find ALL buttons and log them to identify the card-grid toggle
  const allButtons = await page.locator('button').all();
  const buttonTexts = [];
  for (const btn of allButtons.slice(0, 20)) {
    const txt = await btn.textContent().catch(() => '');
    const aria = await btn.getAttribute('aria-label').catch(() => '');
    buttonTexts.push(`"${txt.trim()}" aria="${aria}"`);
  }
  log(`All buttons: ${buttonTexts.join(' | ')}`);

  // Try mat-button-toggle-group (toggle buttons for view mode)
  const toggleGroup = page.locator('mat-button-toggle-group, .mat-button-toggle-group');
  if (await toggleGroup.isVisible({ timeout: 1500 }).catch(() => false)) {
    const toggleBtns = toggleGroup.locator('button');
    const count = await toggleBtns.count().catch(() => 0);
    log(`Toggle group buttons: ${count}`);
    if (count >= 2) {
      await toggleBtns.last().click({ force: true });
      await page.waitForTimeout(1500);
      await ss(page, 'backlog-card-grid');
      results['backlog-card-grid'] = (await bodyText(page)).substring(0, 3000);
      log(`Backlog card-grid: ${results['backlog-card-grid'].substring(0, 300)}`);
    }
  } else {
    // Try specific button texts/icons
    const gridBtnTexts = ['view_module', 'apps', 'grid_view', 'view_comfy', 'view_list'];
    let found = false;
    for (const iconText of gridBtnTexts) {
      const btn = page.locator(`button:has-text("${iconText}")`).first();
      if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
        log(`Found grid toggle with icon: ${iconText}`);
        await btn.click({ force: true });
        await page.waitForTimeout(1500);
        await ss(page, 'backlog-card-grid');
        results['backlog-card-grid'] = (await bodyText(page)).substring(0, 3000);
        log(`Backlog card-grid: ${results['backlog-card-grid'].substring(0, 300)}`);
        found = true;
        break;
      }
    }
    if (!found) {
      log('No card-grid toggle found — logging all button texts and arias for analysis');
      results['backlog-card-grid'] = { error: 'toggle-not-found', buttons: buttonTexts };
    }
  }
  await ctx.close();
}

// ============================================================
// H2: Time-Tracking — start timer (just capture dialog)
// ============================================================
log('=== H2: Time-Tracking Timer Start Dialog ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);
  await navTo(page, '/time-tracking', 3000);

  const startBtn = page.locator('button:has-text("START TIMER")').first();
  if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(2000);
    await ss(page, 'timer-start-dialog');
    const dlgText = await bodyText(page);
    results['timer-start-dialog'] = dlgText.substring(0, 4000);
    log(`Timer start dialog (${dlgText.length}): ${dlgText.substring(0, 400)}`);

    // Try to submit with just category selected
    try {
      // Select first category option
      const catSelect = page.locator('app-select mat-select').first();
      if (await catSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
        await catSelect.click({ force: true });
        await page.waitForTimeout(800);
        const opt = page.locator('mat-option').first();
        if (await opt.isVisible({ timeout: 1000 }).catch(() => false)) {
          await opt.click({ force: true });
          await page.waitForTimeout(400);
        }
      }

      // Click START / submit button
      const submitBtn = page.locator('app-validation-button button').first();
      if (await submitBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await submitBtn.click({ force: true });
        await page.waitForTimeout(2500);
        await ss(page, 'timer-running');
        const runText = await bodyText(page);
        results['timer-running'] = runText.substring(0, 4000);
        log(`Timer running (${runText.length}): ${runText.substring(0, 300)}`);

        // Look for STOP
        const stopBtn = page.locator('button:has-text("STOP"), button:has-text("STOP TIMER")').first();
        if (await stopBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await stopBtn.click({ force: true });
          await page.waitForTimeout(2000);
          await ss(page, 'timer-stop-dialog');
          const stopText = await bodyText(page);
          results['timer-stop-dialog'] = stopText.substring(0, 4000);
          log(`Timer stop dialog (${stopText.length}): ${stopText.substring(0, 300)}`);
          await dismissAll(page);
        } else {
          log('No STOP button found');
        }
      }
    } catch (e) {
      log(`Timer submit error: ${e.message}`);
      await dismissAll(page);
    }
  } else {
    log('START TIMER button not found');
  }
  await ctx.close();
}

// ============================================================
// H3: Quality create dialogs (each in isolation)
// ============================================================
log('=== H3: Quality Create Dialogs ===');
{
  const qualityTargets = [
    { tab: 'inspections', btn: 'NEW INSPECTION', key: 'quality-insp-dialog' },
    { tab: 'lots', btn: 'NEW LOT', key: 'quality-lot-dialog' },
    { tab: 'ncrs', btn: 'NEW NCR', key: 'quality-ncr-dialog' },
    { tab: 'capas', btn: 'NEW CAPA', key: 'quality-capa-dialog' },
    { tab: 'ecos', btn: 'NEW ECO', key: 'quality-eco-dialog' },
    { tab: 'gages', btn: 'NEW GAGE', key: 'quality-gage-dialog' },
  ];

  for (const { tab, btn, key } of qualityTargets) {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await ctx.newPage();
    try {
      await login(page);
      await navTo(page, `/quality/${tab}`, 3000);
      const createBtn = page.locator(`button:has-text("${btn}")`).first();
      if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await createBtn.click({ force: true });
        await page.waitForTimeout(2000);
        await ss(page, key);
        const txt = await bodyText(page);
        results[key] = txt.substring(0, 4000);
        log(`${key} (${txt.length}): ${txt.substring(0, 400)}`);
        await dismissAll(page);
      } else {
        log(`${btn} not visible on /quality/${tab}`);
      }
    } catch (e) {
      log(`Error on ${tab}: ${e.message}`);
    }
    await ctx.close();
  }
}

// ============================================================
// H4: Job dispose dialog (fresh context, careful sequence)
// ============================================================
log('=== H4: Job Dispose Dialog ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  try {
    await login(page);
    await navTo(page, '/kanban', 3000);

    // Click job card to open panel
    const jobCard = page.locator('app-job-card').first();
    if (await jobCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await jobCard.click({ force: true });
      await page.waitForTimeout(3500);
      await ss(page, 'job-panel-open');
      const panelText = await bodyText(page);
      results['job-panel-full'] = panelText.substring(0, 6000);
      log(`Job panel full (${panelText.length}): ${panelText.substring(0, 600)}`);

      // Find dispose button
      const disposeBtn = page.locator('.action-btn').filter({ hasText: /Dispose|dispose/i }).first();
      const disposeVisible = await disposeBtn.isVisible({ timeout: 2000 }).catch(() => false);
      log(`Dispose btn visible: ${disposeVisible}`);

      if (!disposeVisible) {
        // Try scrolling to find it
        await page.evaluate(() => { const el = document.querySelector('.action-btn'); if (el) el.scrollIntoView(); });
        await page.waitForTimeout(500);
        const disposeVisible2 = await disposeBtn.isVisible({ timeout: 1000 }).catch(() => false);
        log(`Dispose btn after scroll: ${disposeVisible2}`);
      }

      if (await disposeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await disposeBtn.click({ force: true });
        await page.waitForTimeout(2000);
        await ss(page, 'dispose-job-dialog');
        const dlgText = await bodyText(page);
        results['dispose-job-dialog'] = dlgText.substring(0, 4000);
        log(`Dispose dialog (${dlgText.length}): ${dlgText.substring(0, 400)}`);
        await dismissAll(page);
      } else {
        log('Dispose button not found; logging visible action-btns');
        const actionBtns = await page.locator('.action-btn').all();
        for (let i = 0; i < actionBtns.length; i++) {
          const txt = await actionBtns[i].textContent().catch(() => '');
          log(`  .action-btn[${i}]: "${txt.trim()}"`);
        }
      }
    }
  } catch (e) {
    log(`Dispose error: ${e.message}`);
  }
  await ctx.close();
}

// ============================================================
// H5: Planning — create cycle (careful date filling)
// ============================================================
log('=== H5: Planning Cycle ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  try {
    await login(page);
    await navTo(page, '/planning', 3000);
    await ss(page, 'planning-state');

    // Click create cycle button
    const cycleBtn = page.locator('button:has-text("CREATE FIRST CYCLE"), button:has-text("NEW CYCLE")').first();
    if (await cycleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cycleBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await ss(page, 'cycle-create-dialog');
      const dlgText = await bodyText(page);
      log(`Cycle dialog (${dlgText.length}): ${dlgText.substring(0, 400)}`);
      results['cycle-dialog'] = dlgText.substring(0, 4000);

      // Fill name field
      const nameInput = page.locator('input[placeholder]').first();
      if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        const ph = await nameInput.getAttribute('placeholder').catch(() => '');
        log(`Name input placeholder: "${ph}"`);
        await nameInput.fill('Sprint 1');
        await page.waitForTimeout(200);
      }

      // Fill dates — try type= "date" inputs first, then app-datepicker
      const dateInputs = page.locator('input[type="date"], app-datepicker input').all();
      const dates = await dateInputs;
      log(`Date inputs found: ${dates.length}`);
      if (dates.length >= 1) {
        try { await dates[0].fill('2026-05-22'); await dates[0].press('Tab'); await page.waitForTimeout(200); } catch {}
      }
      if (dates.length >= 2) {
        try { await dates[1].fill('2026-06-05'); await dates[1].press('Tab'); await page.waitForTimeout(200); } catch {}
      }

      // Submit
      const submitBtn = page.locator('app-validation-button button').last();
      if (await submitBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        const btnText = await submitBtn.textContent().catch(() => '');
        log(`Submit btn text: "${btnText.trim()}"`);
        await submitBtn.click({ force: true });
        await page.waitForTimeout(3000);
        await ss(page, 'planning-after-create');
        const afterText = await bodyText(page);
        results['planning-after-create'] = afterText.substring(0, 4000);
        log(`After create (${afterText.length}): ${afterText.substring(0, 400)}`);

        // Check for cycle board
        const cycleBoard = page.locator('app-cycle-board');
        if (await cycleBoard.isVisible({ timeout: 2000 }).catch(() => false)) {
          log('CycleBoard visible');
          await ss(page, 'cycle-board');
          results['cycle-board'] = (await bodyText(page)).substring(0, 4000);
        } else {
          log('CycleBoard NOT visible');
        }
      } else {
        log('Submit button not visible');
        await dismissAll(page);
      }
    } else {
      log('No cycle button found');
    }
  } catch (e) {
    log(`Planning error: ${e.message}`);
  }
  await ctx.close();
}

// ============================================================
// Write results
// ============================================================
fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
log(`Results → ${RESULTS_FILE}`);
await browser.close();
log('=== Sweep H complete ===');
