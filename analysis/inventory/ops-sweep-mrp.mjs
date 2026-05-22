/**
 * Operations inventory sweep — MRP-only (robust nav)
 * Uses waitUntil:'commit' + Promise.race hard cap to avoid infinite hangs
 */

import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:4200';
const SS_DIR = 'E:/dev/forge/analysis/inventory/screenshots';
const RESULTS_FILE = 'E:/dev/forge/analysis/inventory/ops-mrp-results.json';
const ADMIN = { email: 'admin@forge.local', password: 'ForgeRun!2026' };

const log = (msg) => console.log(`[ops-mrp] ${msg}`);
const results = {};

function ss(page, name) {
  return page.screenshot({ path: path.join(SS_DIR, `ops-mrp-${name}.png`), fullPage: false }).catch(() => {});
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.locator('input[type="email"]').fill(ADMIN.email);
  await page.locator('input[type="password"]').fill(ADMIN.password);
  await page.waitForTimeout(500);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 20000 });
  log(`Logged in → ${page.url()}`);
}

// Hard-capped navigation: navigate then wait fixed time — no blocking waitUntil
async function navTo(page, url, waitMs = 6000) {
  log(`nav → ${url}`);
  const navPromise = page.goto(`${BASE_URL}${url}`, { waitUntil: 'commit', timeout: 8000 }).catch(e => {
    log(`nav error ${url}: ${e.message}`);
  });
  const timeoutPromise = new Promise(resolve => setTimeout(resolve, 8000));
  await Promise.race([navPromise, timeoutPromise]);
  await page.waitForTimeout(waitMs);
  log(`nav done → ${page.url()}`);
}

async function bodyText(page) {
  return page.evaluate(() => document.body.innerText).catch(() => '');
}

async function dismissOverlay(page) {
  try {
    if (await page.locator('button:has-text("SKIP ONBOARDING")').isVisible({ timeout: 500 }).catch(() => false)) {
      await page.locator('button:has-text("SKIP ONBOARDING")').click();
      await page.waitForTimeout(400);
    }
  } catch {}
}

const browser = await chromium.launch({ headless: true });

// ============================================================
// MRP — all 6 tabs
// ============================================================
log('=== MRP Tabs ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  // Abort hanging requests (images/fonts only; keep XHR/fetch for API data)
  await page.route('**/*.{woff,woff2,ttf,otf,eot}', route => route.abort());

  await login(page);

  const tabs = ['dashboard', 'planned-orders', 'exceptions', 'runs', 'master-schedule', 'forecasts'];
  for (const tab of tabs) {
    await navTo(page, `/mrp/${tab}`, 5000);
    await dismissOverlay(page);
    await ss(page, `mrp-${tab}`);
    const text = await bodyText(page);
    results[`mrp-${tab}`] = { url: page.url(), text: text.substring(0, 3000) };
    log(`MRP/${tab} (${text.length} chars): ${text.substring(0, 300)}`);
  }

  // RUN MRP button on runs tab (per source: executeRun on runs tab)
  await navTo(page, '/mrp/runs', 5000);
  await dismissOverlay(page);
  // Try various button selectors for Run MRP
  const runBtnCandidates = [
    page.locator('[data-testid="mrp-run-btn"]'),
    page.locator('button:has-text("RUN MRP")'),
    page.locator('button:has-text("EXECUTE MRP")'),
    page.locator('button:has-text("Run MRP")'),
  ];
  let runBtnClicked = false;
  for (const btn of runBtnCandidates) {
    if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
      log('RUN MRP button found');
      await btn.click();
      await page.waitForTimeout(2000);
      await ss(page, 'mrp-execute-dialog');
      results['mrp-execute-dialog'] = (await bodyText(page)).substring(0, 3000);
      log(`MRP execute dialog: ${results['mrp-execute-dialog'].substring(0, 300)}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      runBtnClicked = true;
      break;
    }
  }
  if (!runBtnClicked) {
    // Also try dashboard
    await navTo(page, '/mrp/dashboard', 5000);
    await dismissOverlay(page);
    for (const btn of [page.locator('button:has-text("RUN MRP")'), page.locator('[data-testid="mrp-run-btn"]')]) {
      if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
        log('RUN MRP button found on dashboard');
        await btn.click();
        await page.waitForTimeout(2000);
        await ss(page, 'mrp-execute-dialog');
        results['mrp-execute-dialog'] = (await bodyText(page)).substring(0, 3000);
        log(`MRP execute dialog: ${results['mrp-execute-dialog'].substring(0, 300)}`);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        break;
      }
    }
  }

  // Master schedule NEW SCHEDULE button → MasterScheduleDialog
  await navTo(page, '/mrp/master-schedule', 5000);
  await dismissOverlay(page);
  const msBtn = page.locator('button:has-text("NEW SCHEDULE"), button:has-text("CREATE SCHEDULE"), button:has-text("NEW MASTER SCHEDULE")').first();
  if (await msBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await msBtn.click();
    await page.waitForTimeout(2000);
    await ss(page, 'mrp-master-schedule-dialog');
    results['mrp-master-schedule-dialog'] = (await bodyText(page)).substring(0, 3000);
    log(`Master schedule dialog: ${results['mrp-master-schedule-dialog'].substring(0, 200)}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } else {
    log('No NEW SCHEDULE button found on master-schedule tab');
  }

  // Forecasts GENERATE button → GenerateForecastDialog
  await navTo(page, '/mrp/forecasts', 5000);
  await dismissOverlay(page);
  const genBtn = page.locator('button:has-text("GENERATE FORECAST"), button:has-text("GENERATE")').first();
  if (await genBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await genBtn.click();
    await page.waitForTimeout(2000);
    await ss(page, 'mrp-generate-forecast-dialog');
    results['mrp-generate-forecast-dialog'] = (await bodyText(page)).substring(0, 3000);
    log(`Generate forecast dialog: ${results['mrp-generate-forecast-dialog'].substring(0, 200)}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } else {
    log('No GENERATE button found on forecasts tab');
  }

  await ctx.close();
}

// ============================================================
// Assets
// ============================================================
log('=== Assets ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await page.route('**/*.{woff,woff2,ttf,otf,eot}', route => route.abort());
  await login(page);

  await navTo(page, '/assets', 5000);
  await dismissOverlay(page);
  await ss(page, 'assets-main');
  const text = await bodyText(page);
  results['assets'] = { url: page.url(), text: text.substring(0, 3000) };
  log(`Assets (${text.length} chars): ${text.substring(0, 400)}`);

  // NEW ASSET button
  const newBtn = page.locator('button:has-text("NEW ASSET"), button:has-text("ADD ASSET"), [data-testid="new-asset-btn"]').first();
  if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newBtn.click();
    await page.waitForTimeout(2000);
    await ss(page, 'assets-create-dialog');
    results['assets-create-dialog'] = (await bodyText(page)).substring(0, 3000);
    log(`Asset create dialog: ${results['assets-create-dialog'].substring(0, 300)}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } else {
    log('No NEW ASSET button found');
  }
  await ctx.close();
}

// ============================================================
// Maintenance
// ============================================================
log('=== Maintenance ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await page.route('**/*.{woff,woff2,ttf,otf,eot}', route => route.abort());
  await login(page);

  await navTo(page, '/maintenance/predictions', 5000);
  await dismissOverlay(page);
  await ss(page, 'maintenance-predictions');
  const text = await bodyText(page);
  results['maintenance'] = { url: page.url(), text: text.substring(0, 3000) };
  log(`Maintenance (${text.length} chars): ${text.substring(0, 400)}`);
  await ctx.close();
}

// ============================================================
// Write results
// ============================================================
fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
log(`Results written to ${RESULTS_FILE}`);
await browser.close();
log('=== MRP sweep complete ===');
