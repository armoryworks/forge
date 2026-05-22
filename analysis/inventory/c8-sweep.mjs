/**
 * Cycle 8 sweep — targeted capture of remaining items
 * Focuses on: lead dialogs, customer guided dialog, parts detail/cluster, inventory
 * Key fix: dismiss onboarding overlay before each interaction phase
 */

import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:4200';
const SS_DIR = 'E:/dev/forge/analysis/inventory/screenshots';
const RESULTS_FILE = 'E:/dev/forge/analysis/inventory/c8-results.json';
const ADMIN = { email: 'admin@forge.local', password: 'ForgeRun!2026' };

const log = (msg) => console.log(`[c8] ${msg}`);
const results = {};

function ss(page, name) {
  return page.screenshot({ path: path.join(SS_DIR, `c8-${name}.png`), fullPage: false }).catch(() => {});
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

// Dismiss the "Complete your profile" onboarding overlay if present
async function dismissOverlay(page) {
  try {
    const skipBtn = page.locator('button:has-text("SKIP ONBOARDING")');
    if (await skipBtn.isVisible({ timeout: 1500 })) {
      await skipBtn.click();
      await page.waitForTimeout(500);
      log('Dismissed onboarding overlay');
    }
  } catch {}
  // Also press Escape to close any open dialogs
  try {
    const backdrop = page.locator('.cdk-overlay-backdrop');
    if (await backdrop.isVisible({ timeout: 500 })) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  } catch {}
}

const browser = await chromium.launch({ headless: true });

// =============================================================
// PHASE A: Lead dialogs — panel, convert, callback scheduler
// =============================================================
log('=== Phase A: Lead dialogs ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);
  await waitNav(page, '/leads');
  await page.waitForTimeout(2000);
  await dismissOverlay(page);

  await ss(page, 'leads-list');
  const leadsText = await bodyText(page);
  results.leadsText = leadsText.substring(0, 500);
  log('Leads: ' + leadsText.substring(0, 200));

  // Lead row click (force:true to bypass any backdrop)
  const leadRow = page.locator('tbody tr').first();
  if (await leadRow.isVisible({ timeout: 3000 }).catch(() => false)) {
    await leadRow.click({ force: true });
    await page.waitForTimeout(2500);
    await dismissOverlay(page);
    await ss(page, 'lead-panel-open');
    const panelText = await bodyText(page);
    results.leadPanel = panelText.substring(0, 1500);
    log('Lead panel: ' + panelText.substring(0, 300));

    // Capture all visible buttons in panel
    const panelBtns = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null).map(b => b.textContent.trim().slice(0, 60)).filter(t => t)
    );
    results.leadPanelButtons = panelBtns;
    log('Lead panel buttons: ' + JSON.stringify(panelBtns));

    // Look for edit / expand button (pencil icon in panel header)
    const editBtn = page.locator('button[aria-label*="edit"], button[mattooltip*="edit"], button[mattooltip*="Edit"], [class*="panel"] button.icon-btn').first();
    if (await editBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await editBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await ss(page, 'lead-edit-dialog');
      results.leadEditDialog = (await bodyText(page)).substring(0, 1000);
      log('Lead edit dialog: ' + results.leadEditDialog.substring(0, 200));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Look for callback scheduler button
    const callbackBtn = page.locator('button:has-text("Callback"), button:has-text("Schedule"), button:has-text("CALLBACK"), button[aria-label*="callback"], button[aria-label*="schedule"]').first();
    if (await callbackBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await callbackBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await ss(page, 'callback-scheduler-dialog');
      results.callbackScheduler = (await bodyText(page)).substring(0, 1000);
      log('Callback scheduler opened');
      await page.keyboard.press('Escape');
    } else {
      log('No callback button visible in lead panel');
      results.callbackScheduler = 'button-not-found';
    }

    // Look for CONVERT TO CUSTOMER button
    const convertBtn = page.locator('button:has-text("CONVERT TO CUSTOMER"), button:has-text("Convert to Customer")').first();
    if (await convertBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await convertBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await ss(page, 'lead-convert-dialog');
      results.leadConvertDialog = (await bodyText(page)).substring(0, 1000);
      log('Lead convert dialog: ' + results.leadConvertDialog.substring(0, 200));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Close panel and try double-click for lead detail dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Double-click lead row
  await waitNav(page, '/leads');
  await page.waitForTimeout(2000);
  await dismissOverlay(page);
  const leadRow2 = page.locator('tbody tr').first();
  if (await leadRow2.isVisible({ timeout: 3000 }).catch(() => false)) {
    await leadRow2.dblclick({ force: true });
    await page.waitForTimeout(2000);
    await ss(page, 'lead-dbl-click');
    results.leadDblClick = (await bodyText(page)).substring(0, 1000);
    log('Lead dbl-click: ' + results.leadDblClick.substring(0, 200));
    await page.keyboard.press('Escape');
  }

  // Lead queue tab
  await waitNav(page, '/leads/queue');
  await page.waitForTimeout(2000);
  await dismissOverlay(page);
  await ss(page, 'leads-queue');
  results.leadsQueue = (await bodyText(page)).substring(0, 800);
  log('Leads queue: ' + results.leadsQueue.substring(0, 200));

  await ctx.close();
}

// =============================================================
// PHASE B: GuidedCustomerDialog — click by exact position
// =============================================================
log('=== Phase B: GuidedCustomerDialog ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);
  await waitNav(page, '/customers');
  await page.waitForTimeout(2000);
  await dismissOverlay(page);

  const newBtn = page.locator('button:has-text("NEW CUSTOMER"), button:has-text("+ NEW CUSTOMER")').first();
  if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newBtn.click({ force: true });
    await page.waitForTimeout(2000);
    await ss(page, 'customer-fork');
    const forkText = await bodyText(page);
    log('Fork text: ' + forkText.substring(0, 300));

    // Log all fork-card buttons
    const forkCards = page.locator('.fork-card');
    const forkCount = await forkCards.count();
    log(`Fork cards count: ${forkCount}`);
    for (let i = 0; i < forkCount; i++) {
      const txt = await forkCards.nth(i).textContent().catch(() => '');
      log(`  fork-card[${i}]: ${txt.trim().slice(0, 60)}`);
    }

    // Click the THIRD fork-card (index 2 = "Guided setup")
    if (forkCount >= 3) {
      await forkCards.nth(2).click({ force: true });
      await page.waitForTimeout(2500);
      await ss(page, 'guided-customer-dialog-v2');
      const dialogText = await bodyText(page);
      results.guidedCustomerDialog = dialogText.substring(0, 2000);
      log('Guided customer dialog: ' + dialogText.substring(0, 300));

      // Capture step structure
      const stepStructure = await page.evaluate(() => {
        const stepEls = Array.from(document.querySelectorAll(
          'mat-step-header, [class*="step-indicator"], [class*="stepper-step"], .mat-step-label'
        )).filter(el => el.offsetParent !== null);
        return stepEls.map(el => el.textContent.trim().slice(0, 40));
      });
      results.guidedCustomerSteps = stepStructure;
      log('Guided customer steps: ' + JSON.stringify(stepStructure));
      await page.keyboard.press('Escape');
    }
  }

  // Also try CustomerDetailDialog via URL pattern ?detail=customer:2
  await waitNav(page, '/customers?detail=customer:2');
  await page.waitForTimeout(3000);
  await dismissOverlay(page);
  await ss(page, 'customer-detail-dialog-url');
  const detailText = await bodyText(page);
  results.customerDetailDialogUrl = detailText.substring(0, 1500);
  log('Customer detail dialog via URL: ' + detailText.substring(0, 300));

  await ctx.close();
}

// =============================================================
// PHASE C: Parts — detail panel, card grid, quick-create
// =============================================================
log('=== Phase C: Parts ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);
  await waitNav(page, '/parts');
  await page.waitForTimeout(2500);
  await dismissOverlay(page);
  await ss(page, 'parts-list');

  // Card grid toggle — look for icon buttons in toolbar
  const headerArea = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, mat-button-toggle')).filter(b => b.offsetParent !== null);
    return btns.map(b => ({ text: b.textContent.trim().slice(0, 40), class: b.className.slice(0, 60), ariaLabel: b.getAttribute('aria-label'), testId: b.getAttribute('data-testid') }));
  });
  log('All buttons: ' + JSON.stringify(headerArea.slice(0, 20)));

  // Try to find the card-grid toggle icons (they're usually view toggle icons: list/grid)
  const toggleBtns = page.locator('mat-button-toggle, [role="radio"][aria-label], .view-toggle button');
  const toggleCount = await toggleBtns.count();
  log(`Toggle buttons: ${toggleCount}`);
  if (toggleCount >= 2) {
    await toggleBtns.nth(1).click({ force: true });
    await page.waitForTimeout(1500);
    await ss(page, 'parts-card-view');
    results.partsCardView = (await bodyText(page)).substring(0, 500);
    log('Card view: ' + results.partsCardView.substring(0, 200));
    await toggleBtns.nth(0).click({ force: true });
    await page.waitForTimeout(500);
  }

  // Part row click — detail panel
  const partRow = page.locator('tbody tr').first();
  if (await partRow.isVisible({ timeout: 3000 }).catch(() => false)) {
    await partRow.click({ force: true });
    await page.waitForTimeout(2500);
    await dismissOverlay(page);
    await ss(page, 'part-detail-panel');
    const panelText = await bodyText(page);
    results.partDetailPanel = panelText.substring(0, 2000);
    log('Part panel: ' + panelText.substring(0, 300));

    // Panel structure
    const panelInfo = await page.evaluate(() => {
      const panel = document.querySelector('app-part-detail-panel, [class*="detail-panel"], mat-drawer, mat-sidenav');
      if (!panel) return { found: false };
      const tabs = Array.from(panel.querySelectorAll('[role="tab"], [class*="tab-label"]')).map(t => t.textContent.trim().slice(0, 30));
      return { found: true, tag: panel.tagName, class: panel.className.slice(0, 80), tabs };
    });
    results.partPanelInfo = panelInfo;
    log('Part panel info: ' + JSON.stringify(panelInfo));

    // All buttons in panel
    const panelBtns = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null).map(b => ({ text: b.textContent.trim().slice(0, 40), ariaLabel: b.getAttribute('aria-label') })).filter(b => b.text || b.ariaLabel)
    );
    results.partPanelButtons = panelBtns;
    log('Part panel buttons: ' + JSON.stringify(panelBtns.slice(0, 10)));

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Double-click for detail dialog
  await waitNav(page, '/parts');
  await page.waitForTimeout(2000);
  await dismissOverlay(page);
  const partRow2 = page.locator('tbody tr').first();
  if (await partRow2.isVisible({ timeout: 3000 }).catch(() => false)) {
    await partRow2.dblclick({ force: true });
    await page.waitForTimeout(2500);
    await ss(page, 'part-dbl-click');
    results.partDblClick = (await bodyText(page)).substring(0, 1000);
    log('Part dbl-click: ' + results.partDblClick.substring(0, 200));
    await page.keyboard.press('Escape');
  }

  // Part quick-create — find the new part button with dropdown arrow
  await waitNav(page, '/parts');
  await page.waitForTimeout(2000);
  await dismissOverlay(page);
  // The "+ NEW PART" button may have a caret/dropdown
  const newPartBtn = page.locator('button:has-text("NEW PART"), button:has-text("+ NEW PART"), [data-testid="new-part"]').first();
  if (await newPartBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await newPartBtn.click({ force: true });
    await page.waitForTimeout(2000);
    await dismissOverlay(page);
    await ss(page, 'new-part-fork');
    const forkText = await bodyText(page);
    results.newPartFork = forkText.substring(0, 1000);
    log('New part fork: ' + forkText.substring(0, 300));

    // Fork card options
    const forkCards = page.locator('.fork-card, [class*="fork-option"]');
    const forkCount = await forkCards.count();
    log(`Part fork cards: ${forkCount}`);
    for (let i = 0; i < forkCount; i++) {
      const txt = await forkCards.nth(i).textContent().catch(() => '');
      log(`  fork-card[${i}]: ${txt.trim().slice(0, 60)}`);
    }
    await page.keyboard.press('Escape');
  } else {
    // Look for any "new" button
    const allBtns = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null).map(b => b.textContent.trim().slice(0, 40)).filter(t => t)
    );
    log('No NEW PART button — all buttons: ' + JSON.stringify(allBtns.slice(0, 15)));
    results.newPartFork = 'button-not-found';
  }

  await ctx.close();
}

// =============================================================
// PHASE D: Part cluster sub-routes (using part id=2)
// =============================================================
log('=== Phase D: Part cluster sub-routes ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);

  // First confirm part 2 exists and get to it
  await waitNav(page, '/parts/2');
  await page.waitForTimeout(3000);
  await dismissOverlay(page);
  await ss(page, 'part2-main');
  const part2Text = await bodyText(page);
  results.part2Main = part2Text.substring(0, 800);
  log('Part 2 main: ' + part2Text.substring(0, 200));

  // Identify what sub-routes are available
  const part2Links = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, [routerlink], [ng-reflect-router-link]'))
      .filter(el => el.offsetParent !== null)
      .map(el => ({ href: el.getAttribute('href') || el.getAttribute('routerlink'), text: el.textContent.trim().slice(0, 30) }))
      .filter(l => l.href);
    return links;
  });
  results.part2Links = part2Links;
  log('Part 2 links: ' + JSON.stringify(part2Links));

  // Try sub-routes
  const subRoutes = [
    { path: '/parts/2/overview', name: 'part2-overview' },
    { path: '/parts/2/serial-numbers', name: 'part2-serial-numbers' },
    { path: '/parts/2/vendor-sources', name: 'part2-vendor-sources' },
    { path: '/parts/2/alternates', name: 'part2-alternates' },
    { path: '/parts/2/routing', name: 'part2-routing' },
    { path: '/parts/2/bom', name: 'part2-bom' },
    { path: '/parts/2/costing', name: 'part2-costing' },
    { path: '/parts/2/quality', name: 'part2-quality' },
  ];

  for (const route of subRoutes) {
    await waitNav(page, route.path);
    await page.waitForTimeout(2500);
    await dismissOverlay(page);
    const text = await bodyText(page);
    const url = page.url();
    results[route.name] = { url, text: text.substring(0, 600) };
    await ss(page, route.name);
    log(`${route.path} → ${url.replace(BASE_URL, '')} | ${text.substring(0, 100)}`);
  }

  await ctx.close();
}

// =============================================================
// PHASE E: Inventory pages
// =============================================================
log('=== Phase E: Inventory pages ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);

  const invRoutes = [
    { path: '/inventory', name: 'inv-overview' },
    { path: '/inventory/stock', name: 'inv-stock' },
    { path: '/inventory/receiving', name: 'inv-receiving' },
    { path: '/inventory/lots', name: 'inv-lots' },
    { path: '/inventory/adjustments', name: 'inv-adjustments' },
  ];

  for (const route of invRoutes) {
    await waitNav(page, route.path);
    await page.waitForTimeout(2500);
    await dismissOverlay(page);
    const text = await bodyText(page);
    const url = page.url();
    results[route.name] = { url, text: text.substring(0, 800) };
    await ss(page, route.name);
    log(`${route.path} → ${url.replace(BASE_URL, '')} | ${text.substring(0, 150)}`);
  }

  // Receiving inspection — check for any items
  await waitNav(page, '/inventory/receiving');
  await page.waitForTimeout(2000);
  await dismissOverlay(page);
  const receivingText = await bodyText(page);
  log('Receiving text: ' + receivingText.substring(0, 300));

  await ctx.close();
}

// =============================================================
// PHASE F: Lots — list and detail
// =============================================================
log('=== Phase F: Lots ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);

  await waitNav(page, '/lots');
  await page.waitForTimeout(2500);
  await dismissOverlay(page);
  await ss(page, 'lots-list');
  const lotsText = await bodyText(page);
  results.lotsText = lotsText.substring(0, 500);
  log('Lots: ' + lotsText.substring(0, 200));

  // Check if any lots exist
  const lotRow = page.locator('tbody tr').first();
  const hasRows = await lotRow.isVisible({ timeout: 2000 }).catch(() => false);
  log(`Lots has rows: ${hasRows}`);

  if (hasRows) {
    await lotRow.click({ force: true });
    await page.waitForTimeout(2500);
    await dismissOverlay(page);
    await ss(page, 'lot-panel');
    const lotPanelText = await bodyText(page);
    results.lotPanel = lotPanelText.substring(0, 1000);
    log('Lot panel: ' + lotPanelText.substring(0, 200));
    await page.keyboard.press('Escape');
  } else {
    results.lotPanel = 'no-lots-in-db';
    log('No lots in DB');
  }

  // Try creating a lot to test the form dialog
  await waitNav(page, '/lots');
  await page.waitForTimeout(1500);
  await dismissOverlay(page);
  const newLotBtn = page.locator('button:has-text("NEW LOT"), button:has-text("+ NEW LOT"), [data-testid*="new-lot"]').first();
  if (await newLotBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await newLotBtn.click({ force: true });
    await page.waitForTimeout(2000);
    await dismissOverlay(page);
    await ss(page, 'new-lot-dialog');
    results.newLotDialog = (await bodyText(page)).substring(0, 800);
    log('New lot dialog: ' + results.newLotDialog.substring(0, 200));
    await page.keyboard.press('Escape');
  } else {
    const allBtns = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null).map(b => b.textContent.trim().slice(0, 40)).filter(t => t)
    );
    log('Lots page buttons: ' + JSON.stringify(allBtns));
    results.newLotDialog = 'button-not-found';
  }

  await ctx.close();
}

// =============================================================
// PHASE G: PO + routing pages
// =============================================================
log('=== Phase G: PO + routing ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);

  // Purchase orders
  await waitNav(page, '/purchase-orders');
  await page.waitForTimeout(2000);
  await dismissOverlay(page);
  await ss(page, 'po-list');
  const poText = await bodyText(page);
  results.poList = poText.substring(0, 800);
  log('PO list: ' + poText.substring(0, 200));

  const poRow = page.locator('tbody tr').first();
  if (await poRow.isVisible({ timeout: 2000 }).catch(() => false)) {
    await poRow.click({ force: true });
    await page.waitForTimeout(2000);
    await dismissOverlay(page);
    await ss(page, 'po-detail-panel');
    results.poDetailPanel = (await bodyText(page)).substring(0, 800);
    log('PO panel: ' + results.poDetailPanel.substring(0, 200));
    await page.keyboard.press('Escape');
  }

  // Routing pages
  await waitNav(page, '/routing');
  await page.waitForTimeout(2000);
  await dismissOverlay(page);
  await ss(page, 'routing-main');
  results.routingMain = (await bodyText(page)).substring(0, 800);
  log('Routing main: ' + results.routingMain.substring(0, 200));

  await waitNav(page, '/routing/flow');
  await page.waitForTimeout(2000);
  await dismissOverlay(page);
  await ss(page, 'routing-flow');
  results.routingFlow = (await bodyText(page)).substring(0, 800);
  log('Routing flow: ' + results.routingFlow.substring(0, 200));

  await ctx.close();
}

// =============================================================
// Write results
// =============================================================
await browser.close();
fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
log(`=== c8 sweep complete — ${RESULTS_FILE} ===`);

for (const [k, v] of Object.entries(results)) {
  const val = typeof v === 'string' ? v.substring(0, 150) : typeof v === 'object' && v.text ? v.text.substring(0, 150) : JSON.stringify(v).substring(0, 150);
  console.log(`\n--- ${k} ---\n${val}`);
}
