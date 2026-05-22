/**
 * Breadth sweep of master-data region for ui-scout inventory.
 * Uses Playwright 1.58.2 Chromium already installed in forge-ui/node_modules.
 * Logs in as admin@forge.local, clears profile redirect, then visits every
 * master-data route/sub-route and captures: screenshot, page title, DOM text.
 */
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:4200';
const EMAIL = 'admin@forge.local';
const PASSWORD = 'ForgeRun!2026';
const SS_DIR = path.resolve('E:/dev/forge/analysis/inventory/screenshots');
const LOG_FILE = path.resolve('E:/dev/forge/analysis/inventory/sweep-log.json');

const ROUTES = [
  // Leads
  { id: 'leads-list',        url: '/leads',              label: 'Leads list' },
  { id: 'leads-intake',      url: '/leads/intake',       label: 'Leads intake' },
  { id: 'leads-queue',       url: '/leads/queue',        label: 'Leads queue' },
  { id: 'leads-campaigns',   url: '/leads/campaigns',    label: 'Leads campaigns' },
  { id: 'leads-suppression', url: '/leads/suppression',  label: 'Leads suppression' },
  { id: 'leads-samples',     url: '/leads/samples',      label: 'Leads samples' },
  { id: 'leads-accounts',    url: '/leads/accounts',     label: 'Leads accounts' },
  // Customers
  { id: 'customers-list',         url: '/customers',              label: 'Customers list' },
  { id: 'customers-contacts',     url: '/customers/contacts',     label: 'Customers contacts' },
  { id: 'customers-portal-access',url: '/customers/portal-access',label: 'Customers portal-access' },
  { id: 'customers-segments',     url: '/customers/segments',     label: 'Customers segments' },
  { id: 'customers-import',       url: '/customers/import',       label: 'Customers import' },
  // Vendors
  { id: 'vendors-list', url: '/vendors', label: 'Vendors list' },
  // Parts
  { id: 'parts-list', url: '/parts',     label: 'Parts list' },
  { id: 'parts-new',  url: '/parts/new', label: 'Parts new/create workflow' },
  // Inventory tabs
  { id: 'inventory-stock',     url: '/inventory/stock',      label: 'Inventory stock tab' },
  { id: 'inventory-receiving', url: '/inventory/receiving',  label: 'Inventory receiving tab' },
  { id: 'inventory-transfers', url: '/inventory/transfers',  label: 'Inventory transfers tab' },
  { id: 'inventory-adjustments',url: '/inventory/adjustments',label: 'Inventory adjustments tab' },
  { id: 'inventory-locations', url: '/inventory/locations',  label: 'Inventory locations tab' },
  // Lots
  { id: 'lots-list', url: '/lots', label: 'Lots list' },
];

// Extra: check inventory tabs by reading the component source
// (we'll probe /inventory/:tab for all known tabs discovered from DOM)

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="email" i]', { timeout: 15000 });
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passInput = page.locator('input[type="password"]').first();
  await emailInput.fill(EMAIL);
  await passInput.fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  // Wait for navigation away from login
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 });
  console.log(`Logged in — landed at: ${page.url()}`);
}

async function clearProfileRedirect(page) {
  const url = page.url();
  if (url.includes('/account/profile')) {
    console.log('Profile redirect detected — attempting to fill required fields and submit or skip');
    // Try to click a "Skip" or "Later" button if present
    try {
      const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Later"), button:has-text("Continue")').first();
      await skipBtn.waitFor({ timeout: 4000 });
      await skipBtn.click();
      await page.waitForTimeout(1500);
    } catch {
      // No skip button — try filling required fields
      const firstNameInput = page.locator('input[placeholder*="first" i], input[name*="first" i]').first();
      try {
        await firstNameInput.waitFor({ timeout: 3000 });
        await firstNameInput.fill('Forge');
        const lastNameInput = page.locator('input[placeholder*="last" i], input[name*="last" i]').first();
        await lastNameInput.fill('Admin');
        const saveBtn = page.locator('button[type="submit"], button:has-text("Save")').first();
        await saveBtn.click();
        await page.waitForTimeout(2000);
      } catch {
        console.log('Could not clear profile redirect automatically — navigating to dashboard directly');
        await page.goto(`${BASE}/dashboard`);
        await page.waitForTimeout(2000);
      }
    }
  }
}

async function visitRoute(page, route) {
  const result = {
    id: route.id,
    label: route.label,
    url: route.url,
    finalUrl: null,
    title: null,
    h1: null,
    domText: null,
    screenshot: null,
    error: null,
    navItems: [],
    tableHeaders: [],
    buttons: [],
    tabs: [],
    emptyState: null,
  };

  try {
    await page.goto(`${BASE}${route.url}`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500); // let Angular settle

    result.finalUrl = page.url();
    result.title = await page.title();

    // Grab h1/h2
    try { result.h1 = await page.locator('h1, h2').first().innerText(); } catch {}

    // Detect empty state messages
    const emptyTexts = ['no records', 'no data', 'no items', 'empty', 'get started', '0 results', 'no leads', 'no customers', 'no vendors', 'no parts', 'no lots', 'no inventory'];
    const pageText = (await page.locator('body').innerText()).toLowerCase();
    for (const et of emptyTexts) {
      if (pageText.includes(et)) {
        result.emptyState = et;
        break;
      }
    }

    // Collect nav/tab items (mat-tab-label, [role=tab], .tab)
    try {
      result.tabs = await page.locator('[role="tab"], mat-tab-label, .tab-link, .nav-tab').allInnerTexts();
    } catch {}

    // Collect table headers
    try {
      result.tableHeaders = await page.locator('th, .mat-header-cell').allInnerTexts();
    } catch {}

    // Collect primary action buttons
    try {
      const btns = await page.locator('button:visible').allInnerTexts();
      result.buttons = btns.filter(b => b.trim().length > 0).slice(0, 20);
    } catch {}

    // Collect sidebar/subnav items
    try {
      result.navItems = await page.locator('nav a, .sidebar a, .sidenav a, [role="navigation"] a').allInnerTexts();
    } catch {}

    // Short DOM text sample (first 800 chars of visible text)
    try {
      result.domText = pageText.slice(0, 800);
    } catch {}

    // Screenshot
    const ssPath = path.join(SS_DIR, `${route.id}.png`);
    await page.screenshot({ path: ssPath, fullPage: false });
    result.screenshot = ssPath;
    console.log(`  ✓ ${route.id} => ${result.finalUrl}`);
  } catch (err) {
    result.error = err.message;
    console.error(`  ✗ ${route.id}: ${err.message}`);
    try {
      const ssPath = path.join(SS_DIR, `${route.id}-error.png`);
      await page.screenshot({ path: ssPath, fullPage: false });
      result.screenshot = ssPath;
    } catch {}
  }

  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await login(page);
  await clearProfileRedirect(page);
  console.log(`After profile clear: ${page.url()}`);

  const results = [];
  for (const route of ROUTES) {
    console.log(`\nVisiting ${route.label} (${route.url})...`);
    const r = await visitRoute(page, route);
    results.push(r);
  }

  // Also probe: does /inventory redirect? Let's check a few more inventory tabs
  // by reading any tab labels from the /inventory/stock page
  const stockResult = results.find(r => r.id === 'inventory-stock');
  if (stockResult && stockResult.tabs.length > 0) {
    console.log('\nInventory tabs found:', stockResult.tabs);
  }

  fs.writeFileSync(LOG_FILE, JSON.stringify(results, null, 2));
  console.log(`\nLog written to ${LOG_FILE}`);
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
