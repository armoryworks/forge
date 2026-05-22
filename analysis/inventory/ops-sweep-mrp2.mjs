/**
 * Operations inventory sweep — MRP v2
 * Aborts API calls to prevent page-context hang; captures initial render state
 * Uses hard Promise.race timeouts on ALL Playwright operations
 */

import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:4200';
const SS_DIR = 'E:/dev/forge/analysis/inventory/screenshots';
const RESULTS_FILE = 'E:/dev/forge/analysis/inventory/ops-mrp2-results.json';
const ADMIN = { email: 'admin@forge.local', password: 'ForgeRun!2026' };

const log = (msg) => console.log(`[ops-mrp2] ${msg}`);
const results = {};

// Hard timeout wrapper — never lets a Playwright op block forever
function withTimeout(promise, ms, fallback = null) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => {
      log(`[TIMEOUT ${ms}ms]`);
      resolve(fallback);
    }, ms))
  ]);
}

function ss(page, name) {
  return withTimeout(
    page.screenshot({ path: path.join(SS_DIR, `ops-mrp2-${name}.png`), fullPage: false }),
    8000,
    null
  ).catch(() => null);
}

async function bodyText(page) {
  return withTimeout(
    page.evaluate(() => document.body.innerText),
    5000,
    '[TIMEOUT]'
  ).catch(() => '[ERROR]');
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

async function navTo(page, url) {
  log(`nav → ${url}`);
  const navP = page.goto(`${BASE_URL}${url}`, { waitUntil: 'commit', timeout: 10000 }).catch(e => log(`goto err: ${e.message}`));
  await withTimeout(navP, 10000);
  // Give Angular router 3 seconds to render
  await withTimeout(page.waitForTimeout(3000), 4000);
  log(`nav done, url=${page.url()}`);
}

const browser = await chromium.launch({ headless: true });

// ============================================================
// MRP — tabs with API calls aborted
// ============================================================
log('=== MRP (API aborted) ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  // Intercept: abort API calls to localhost:5000; allow UI assets
  await page.route('**/api/**', route => route.abort());
  await page.route('**:5000/**', route => route.abort());
  // Also abort fonts/woff to speed up
  await page.route('**/*.{woff,woff2,ttf,otf}', route => route.abort());

  // Login without API abort (need auth cookie)
  await ctx.clearCookies();
  await ctx.unrouteAll();

  // Fresh context for login
  await login(page);

  // NOW add API abort AFTER login
  await page.route('**:5000/**', route => route.abort());
  await page.route('**/api/**', route => route.abort());

  const tabs = ['dashboard', 'planned-orders', 'exceptions', 'runs', 'master-schedule', 'forecasts'];
  for (const tab of tabs) {
    await navTo(page, `/mrp/${tab}`);
    await ss(page, `mrp-${tab}`);
    const text = await bodyText(page);
    results[`mrp-${tab}`] = { url: page.url(), text: text.substring(0, 3000) };
    log(`MRP/${tab}: ${text.substring(0, 300)}`);
  }

  // RUN MRP button
  await navTo(page, '/mrp/dashboard');
  const runBtn = page.locator('button:has-text("RUN MRP")');
  const runBtnVisible = await withTimeout(runBtn.isVisible({ timeout: 2000 }), 3000, false);
  log(`RUN MRP btn: ${runBtnVisible}`);
  if (runBtnVisible) {
    await withTimeout(runBtn.click(), 3000);
    await withTimeout(page.waitForTimeout(2000), 3000);
    await ss(page, 'mrp-run-dialog');
    results['mrp-run-dialog'] = (await bodyText(page)).substring(0, 3000);
    log(`MRP run dialog: ${results['mrp-run-dialog'].substring(0, 200)}`);
    await withTimeout(page.keyboard.press('Escape'), 2000);
  }

  await ctx.close();
}

// ============================================================
// MRP — NO API abort (see if page loads with real data)
// ============================================================
log('=== MRP (API allowed, ultra-fast capture) ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  await page.route('**/*.{woff,woff2,ttf,otf}', route => route.abort());

  await login(page);

  // Navigate to dashboard first (warm up Angular)
  await navTo(page, '/dashboard');

  // Then navigate to MRP — capture state 1s after commit (before API calls complete)
  log('Navigating to /mrp/dashboard with 1s capture...');
  const navP = page.goto(`${BASE_URL}/mrp/dashboard`, { waitUntil: 'commit', timeout: 10000 }).catch(e => log(`err: ${e.message}`));
  await withTimeout(navP, 10000);
  await withTimeout(page.waitForTimeout(1000), 2000);
  await ss(page, 'mrp-dashboard-1s');
  const text1s = await bodyText(page);
  results['mrp-dashboard-1s'] = text1s.substring(0, 3000);
  log(`MRP dashboard at 1s: ${text1s.substring(0, 300)}`);

  // Wait another 3s and capture again
  await withTimeout(page.waitForTimeout(3000), 4000);
  await ss(page, 'mrp-dashboard-4s');
  const text4s = await bodyText(page);
  results['mrp-dashboard-4s'] = text4s.substring(0, 3000);
  log(`MRP dashboard at 4s: ${text4s.substring(0, 300)}`);

  await ctx.close();
}

// ============================================================
// Assets
// ============================================================
log('=== Assets ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await page.route('**/*.{woff,woff2,ttf,otf}', route => route.abort());
  await login(page);
  await navTo(page, '/assets');
  await ss(page, 'assets');
  const text = await bodyText(page);
  results['assets'] = { url: page.url(), text: text.substring(0, 3000) };
  log(`Assets: ${text.substring(0, 400)}`);

  const newBtn = page.locator('button:has-text("NEW ASSET"), button:has-text("ADD ASSET")').first();
  if (await withTimeout(newBtn.isVisible({ timeout: 3000 }), 4000, false)) {
    await withTimeout(newBtn.click(), 3000);
    await withTimeout(page.waitForTimeout(2000), 3000);
    await ss(page, 'assets-create-dialog');
    results['assets-dialog'] = (await bodyText(page)).substring(0, 3000);
    log(`Assets dialog: ${results['assets-dialog'].substring(0, 300)}`);
    await withTimeout(page.keyboard.press('Escape'), 2000);
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
  await page.route('**/*.{woff,woff2,ttf,otf}', route => route.abort());
  await login(page);
  await navTo(page, '/maintenance/predictions');
  await ss(page, 'maintenance');
  const text = await bodyText(page);
  results['maintenance'] = { url: page.url(), text: text.substring(0, 3000) };
  log(`Maintenance: ${text.substring(0, 400)}`);
  await ctx.close();
}

// ============================================================
// Write results
// ============================================================
fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
log(`Results → ${RESULTS_FILE}`);
await browser.close();
log('=== MRP2 sweep complete ===');
