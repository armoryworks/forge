/**
 * Cycle 7 sweep — targeted capture of items Phase 1 missed due to session expiry
 * Targets:
 *   - Customer tabs: interactions, pricing, orders, jobs, invoices
 *   - Customer overview: CreditStatusCard, overview structure
 *   - GuidedCustomerDialog hunt
 *   - VendorDetailDialog trigger hunt
 *   - GuidedVendorDialog, VendorBulkImportDialog
 *   - LeadDetailDialog, CallbackSchedulerDialog
 *   - Part detail panel + card grid
 *   - Part-cluster component pages
 */

import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:4200';
const SS_DIR = 'E:/dev/forge/analysis/inventory/screenshots';
const RESULTS_FILE = 'E:/dev/forge/analysis/inventory/c7-results.json';
const ADMIN = { email: 'admin@forge.local', password: 'ForgeRun!2026' };

const log = (msg) => console.log(`[c7] ${msg}`);
const results = {};

function ss(page, name) {
  return page.screenshot({ path: path.join(SS_DIR, `c7-${name}.png`), fullPage: false }).catch(e => log(`ss error: ${e.message}`));
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.locator('input[type="email"]').fill(ADMIN.email);
  await page.locator('input[type="password"]').fill(ADMIN.password);
  await page.waitForTimeout(300);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 15000 });
  log(`Logged in as ${ADMIN.email} → ${page.url()}`);
}

async function waitNav(page, url, timeout = 10000) {
  try {
    await page.goto(`${BASE_URL}${url}`);
    await page.waitForLoadState('networkidle', { timeout });
  } catch { /* capture whatever rendered */ }
}

async function bodyText(page) {
  return page.evaluate(() => document.body.innerText).catch(() => '');
}

const browser = await chromium.launch({ headless: true });

// =============================================================
// PHASE A: Customer tabs — fresh login, go directly to tabs
// =============================================================
log('=== Phase A: Customer tabs ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);

  // First confirm customer/2 exists — go to overview
  await waitNav(page, '/customers/2/overview');
  await page.waitForTimeout(2000);
  await ss(page, 'cust2-overview');
  const overviewText = await bodyText(page);
  results.customerOverview = overviewText.substring(0, 2000);
  log('Customer overview: ' + overviewText.substring(0, 200));

  // CreditStatusCard check
  const creditCard = await page.$('app-credit-status-card, [class*="credit-status"], [class*="credit-card"]').catch(() => null);
  results.creditStatusCard = !!creditCard;
  log(`CreditStatusCard found: ${results.creditStatusCard}`);

  // Check the full overview DOM for interesting sections
  const overviewSections = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('mat-card, [class*="card"], [class*="section"], [class*="panel"]'))
      .filter(el => el.offsetParent !== null)
      .slice(0, 15)
      .map(el => el.className.slice(0, 60) + ' | ' + el.textContent.trim().slice(0, 80));
    return sections;
  });
  results.overviewSections = overviewSections;
  log('Overview sections: ' + JSON.stringify(overviewSections.slice(0, 5)));

  // Customer tabs
  for (const tab of ['interactions', 'pricing', 'orders', 'jobs', 'invoices']) {
    log(`Customer /${tab} tab`);
    await waitNav(page, `/customers/2/${tab}`);
    await page.waitForTimeout(2500);
    const text = await bodyText(page);
    results[`customer_${tab}`] = text.substring(0, 2000);
    await ss(page, `cust2-${tab}`);

    // Check if we got redirected to login or overview
    const currentUrl = page.url();
    log(`  URL: ${currentUrl} | text: ${text.substring(0, 150)}`);
  }

  // Check customer tabs nav structure
  await waitNav(page, '/customers/2');
  await page.waitForTimeout(2000);
  const tabNav = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll(
      'mat-tab-group mat-tab-header .mat-tab-label, nav a, [role="tab"], [class*="tab-link"], [class*="nav-tab"]'
    )).filter(el => el.offsetParent !== null);
    return tabs.map(el => ({ text: el.textContent.trim().slice(0, 40), class: el.className.slice(0, 60), href: el.getAttribute('href') }));
  });
  results.customerTabNav = tabNav;
  log('Customer tab nav: ' + JSON.stringify(tabNav));
  await ss(page, 'cust2-tab-nav');

  await ctx.close();
}

// =============================================================
// PHASE B: New Customer fork — hunt for GuidedCustomerDialog
// =============================================================
log('=== Phase B: GuidedCustomer hunt ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);

  await waitNav(page, '/customers');
  await page.waitForTimeout(2000);
  await ss(page, 'customers-list');

  // Find new-customer button
  const newBtn = await page.$('[data-testid="new-customer"], button:has-text("NEW CUSTOMER"), button:has-text("New Customer"), [aria-label*="new customer"]').catch(() => null);
  if (newBtn) {
    await newBtn.click();
    await page.waitForTimeout(2000);
    await ss(page, 'new-customer-fork-full');
    const forkText = await bodyText(page);
    results.newCustomerFork = forkText.substring(0, 1000);
    log('Fork text: ' + forkText.substring(0, 300));

    // Enumerate all fork options
    const forkOptions = await page.evaluate(() => {
      const opts = Array.from(document.querySelectorAll(
        'mat-dialog-container button, [class*="fork"] button, [class*="fork"] [class*="card"], mat-card, [class*="option"]'
      )).filter(el => el.offsetParent !== null && el.textContent.trim().length > 0);
      return opts.map(el => ({ tag: el.tagName, class: el.className.slice(0, 60), text: el.textContent.trim().slice(0, 60) }));
    });
    results.forkOptions = forkOptions;
    log('Fork options: ' + JSON.stringify(forkOptions));

    // Look for guided/full/wizard options
    const guidedBtn = await page.$('button:has-text("Guided"), button:has-text("Full setup"), button:has-text("Wizard"), [data-testid*="guided"], [class*="fork"]:has-text("Guided")').catch(() => null);
    if (guidedBtn) {
      await guidedBtn.click();
      await page.waitForTimeout(2000);
      await ss(page, 'guided-customer-dialog');
      results.guidedCustomerFound = true;
      results.guidedCustomerText = (await bodyText(page)).substring(0, 1000);
      log('Guided customer dialog found!');
    } else {
      results.guidedCustomerFound = false;
      log('No guided customer option found in fork');
    }
    await page.keyboard.press('Escape');
  } else {
    log('No new-customer button found');
    // Check all visible buttons on the page
    const allBtns = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null).map(b => b.textContent.trim().slice(0, 40))
    );
    log('All buttons: ' + JSON.stringify(allBtns));
    results.newCustomerFork = 'button-not-found';
  }

  await ctx.close();
}

// =============================================================
// PHASE C: Vendor dialogs — GuidedVendorDialog, BulkImport
// =============================================================
log('=== Phase C: Vendor dialogs ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);

  await waitNav(page, '/vendors');
  await page.waitForTimeout(2000);
  await ss(page, 'vendors-list');

  // New vendor button hunt
  const newVendorBtn = await page.$('[data-testid="new-vendor"], button:has-text("NEW VENDOR"), button:has-text("New Vendor"), [aria-label*="new vendor"]').catch(() => null);
  if (newVendorBtn) {
    await newVendorBtn.click();
    await page.waitForTimeout(2000);
    await ss(page, 'new-vendor-fork');
    const forkText = await bodyText(page);
    results.newVendorFork = forkText.substring(0, 1000);
    log('New vendor fork: ' + forkText.substring(0, 300));

    const forkOptions = await page.evaluate(() => {
      const opts = Array.from(document.querySelectorAll(
        'mat-dialog-container button, [class*="fork"] button, mat-card, [class*="option"]'
      )).filter(el => el.offsetParent !== null && el.textContent.trim().length > 0);
      return opts.map(el => ({ tag: el.tagName, text: el.textContent.trim().slice(0, 60), class: el.className.slice(0, 50) }));
    });
    results.vendorForkOptions = forkOptions;
    log('Vendor fork options: ' + JSON.stringify(forkOptions));

    // Look for guided/full/bulk options
    for (const label of ['Guided', 'Full setup', 'Bulk Import', 'Import']) {
      const btn = await page.$(`button:has-text("${label}"), [class*="fork"]:has-text("${label}"), mat-card:has-text("${label}")`).catch(() => null);
      if (btn) {
        await btn.click();
        await page.waitForTimeout(2000);
        await ss(page, `vendor-fork-${label.toLowerCase().replace(/\s+/g, '-')}`);
        results[`vendorFork_${label}`] = (await bodyText(page)).substring(0, 800);
        log(`Vendor fork "${label}" opened`);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }
    await page.keyboard.press('Escape');
  } else {
    log('No new-vendor button found');
    const allBtns = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null).map(b => b.textContent.trim().slice(0, 40))
    );
    log('Vendor page buttons: ' + JSON.stringify(allBtns));
    results.newVendorFork = 'button-not-found';
  }

  // Vendor detail dialog — try double-click on row
  await waitNav(page, '/vendors');
  await page.waitForTimeout(2000);
  const vendorRow = await page.$('tbody tr, mat-row, [data-row]').catch(() => null);
  if (vendorRow) {
    // Single click first
    await vendorRow.click();
    await page.waitForTimeout(2000);
    await ss(page, 'vendor-single-click');
    const singleClickText = await bodyText(page);
    results.vendorSingleClick = singleClickText.substring(0, 800);
    log('Vendor single click: ' + singleClickText.substring(0, 200));

    // Double click
    await vendorRow.dblclick().catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, 'vendor-dbl-click');
    const dblClickText = await bodyText(page);
    results.vendorDblClick = dblClickText.substring(0, 800);
    log('Vendor dbl click: ' + dblClickText.substring(0, 200));

    // Look for detail/expand button in the panel
    const detailBtn = await page.$('[aria-label*="detail"], [aria-label*="expand"], button:has-text("VIEW"), a[href*="/vendors/"], .open-detail').catch(() => null);
    if (detailBtn) {
      await detailBtn.click();
      await page.waitForTimeout(2000);
      await ss(page, 'vendor-detail-dialog');
      results.vendorDetailDialog = (await bodyText(page)).substring(0, 800);
      log('Vendor detail dialog: found');
    } else {
      results.vendorDetailDialog = 'no-trigger-found';
    }
    await page.keyboard.press('Escape');
  }

  await ctx.close();
}

// =============================================================
// PHASE D: Lead dialogs — detail dialog + callback scheduler
// =============================================================
log('=== Phase D: Lead dialogs ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);

  await waitNav(page, '/leads');
  await page.waitForTimeout(2000);
  await ss(page, 'leads-list');
  const leadsText = await bodyText(page);
  results.leadsText = leadsText.substring(0, 500);
  log('Leads: ' + leadsText.substring(0, 200));

  // Lead row click
  const leadRow = await page.$('tbody tr, mat-row, [data-row]').catch(() => null);
  if (leadRow) {
    await leadRow.click();
    await page.waitForTimeout(2000);
    await ss(page, 'lead-single-click');
    results.leadSingleClick = (await bodyText(page)).substring(0, 1000);
    log('Lead click: ' + results.leadSingleClick.substring(0, 200));

    // Look for detail/expand triggers
    const detailBtn = await page.$('[aria-label*="detail"], button:has-text("VIEW"), button:has-text("Open"), a[href*="/leads/"]').catch(() => null);
    if (detailBtn) {
      await detailBtn.click();
      await page.waitForTimeout(2000);
      await ss(page, 'lead-detail-dialog');
      results.leadDetailDialog = (await bodyText(page)).substring(0, 1000);
      log('Lead detail dialog opened');
    }

    // Double click for detail dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await waitNav(page, '/leads');
    await page.waitForTimeout(1500);
    const leadRow2 = await page.$('tbody tr, mat-row, [data-row]').catch(() => null);
    if (leadRow2) {
      await leadRow2.dblclick().catch(() => {});
      await page.waitForTimeout(2000);
      await ss(page, 'lead-dbl-click');
      results.leadDblClick = (await bodyText(page)).substring(0, 1000);
      log('Lead dbl click: ' + results.leadDblClick.substring(0, 200));
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Callback scheduler — look in the panel/context menu
    await waitNav(page, '/leads');
    await page.waitForTimeout(1500);
    const leadRow3 = await page.$('tbody tr, mat-row, [data-row]').catch(() => null);
    if (leadRow3) {
      await leadRow3.click();
      await page.waitForTimeout(1500);
      // Look for callback/schedule button
      const callbackBtn = await page.$('button:has-text("Callback"), button:has-text("Schedule"), [aria-label*="callback"], [aria-label*="schedule"]').catch(() => null);
      if (callbackBtn) {
        await callbackBtn.click();
        await page.waitForTimeout(2000);
        await ss(page, 'callback-scheduler-dialog');
        results.callbackScheduler = (await bodyText(page)).substring(0, 1000);
        log('Callback scheduler found');
      } else {
        log('No callback button found in lead panel');
        // Check what buttons are visible
        const panelBtns = await page.evaluate(() =>
          Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null).map(b => b.textContent.trim().slice(0, 40)).filter(t => t)
        );
        results.leadPanelButtons = panelBtns;
        log('Lead panel buttons: ' + JSON.stringify(panelBtns));
        await ss(page, 'lead-panel-buttons');
      }
      await page.keyboard.press('Escape');
    }
  } else {
    log('No lead rows found');
    results.leadSingleClick = 'no-rows';
  }

  // Check lead queue tab
  await waitNav(page, '/leads/queue');
  await page.waitForTimeout(2000);
  await ss(page, 'leads-queue');
  results.leadsQueue = (await bodyText(page)).substring(0, 500);
  log('Leads queue: ' + results.leadsQueue.substring(0, 200));

  await ctx.close();
}

// =============================================================
// PHASE E: Parts — detail panel/dialog, card grid, part pages
// =============================================================
log('=== Phase E: Parts detail + card grid ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);

  await waitNav(page, '/parts');
  await page.waitForTimeout(2500);
  await ss(page, 'parts-list-e');
  const partsText = await bodyText(page);
  results.partsListText = partsText.substring(0, 500);
  log('Parts list: ' + partsText.substring(0, 200));

  // Card grid toggle hunt
  const toggleBtns = await page.$$('mat-button-toggle, [role="radio"], [data-testid*="grid"], [data-testid*="card"], [aria-label*="grid"], [aria-label*="card"]');
  log(`Found ${toggleBtns.length} toggle-like elements`);
  if (toggleBtns.length >= 2) {
    await toggleBtns[1].click().catch(() => {});
    await page.waitForTimeout(1500);
    await ss(page, 'parts-card-grid-view');
    results.cardGridText = (await bodyText(page)).substring(0, 500);
    log('Card grid: ' + results.cardGridText.substring(0, 200));
    await toggleBtns[0].click().catch(() => {});
  } else {
    log('Card grid toggle not found, checking header area');
    const headerBtns = await page.evaluate(() =>
      Array.from(document.querySelectorAll('mat-toolbar button, .page-header button, [class*="header"] button'))
        .filter(b => b.offsetParent !== null)
        .map(b => ({ text: b.textContent.trim().slice(0, 40), title: b.getAttribute('title'), label: b.getAttribute('aria-label') }))
    );
    log('Header buttons: ' + JSON.stringify(headerBtns));
    results.partsHeaderBtns = headerBtns;
  }

  // Part row click — detail panel
  await waitNav(page, '/parts');
  await page.waitForTimeout(2000);
  const partRow = await page.$('tbody tr:not(.mat-header-row), mat-row').catch(() => null);
  if (partRow) {
    await partRow.click();
    await page.waitForTimeout(2500);
    await ss(page, 'part-detail-panel');
    const panelText = await bodyText(page);
    results.partDetailPanel = panelText.substring(0, 1500);
    log('Part panel: ' + panelText.substring(0, 300));

    // Check panel structure
    const panelStructure = await page.evaluate(() => {
      const panel = document.querySelector('app-part-detail-panel, [class*="detail-panel"], mat-sidenav, .detail-panel');
      if (!panel) return { found: false, openPanels: Array.from(document.querySelectorAll('[class*="panel"]')).filter(el => el.offsetParent !== null).map(el => el.className.slice(0, 60)) };
      return {
        found: true,
        tag: panel.tagName,
        class: panel.className.slice(0, 80),
        tabs: Array.from(panel.querySelectorAll('[role="tab"], mat-tab-header button')).map(t => t.textContent.trim().slice(0, 30))
      };
    });
    results.partPanelStructure = panelStructure;
    log('Part panel structure: ' + JSON.stringify(panelStructure));

    // Look for dialog trigger in panel
    const dialogTrigger = await page.$('[aria-label*="detail"], button:has-text("OPEN"), button:has-text("Expand"), a[href*="/parts/"]').catch(() => null);
    if (dialogTrigger) {
      await dialogTrigger.click();
      await page.waitForTimeout(2000);
      await ss(page, 'part-detail-dialog');
      results.partDetailDialog = (await bodyText(page)).substring(0, 1500);
      log('Part detail dialog opened');
      await page.keyboard.press('Escape');
    } else {
      log('No part detail dialog trigger found in panel');
      results.partDetailDialog = 'no-trigger-found';
    }

    // Double-click for detail dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Part dbl-click
  await waitNav(page, '/parts');
  await page.waitForTimeout(2000);
  const partRow2 = await page.$('tbody tr:not(.mat-header-row), mat-row').catch(() => null);
  if (partRow2) {
    await partRow2.dblclick().catch(() => {});
    await page.waitForTimeout(2500);
    await ss(page, 'part-dbl-click');
    results.partDblClick = (await bodyText(page)).substring(0, 1500);
    log('Part dbl click: ' + results.partDblClick.substring(0, 200));
    await page.keyboard.press('Escape');
  }

  // Navigate to part page via direct URL
  await waitNav(page, '/parts/2');
  await page.waitForTimeout(3000);
  await ss(page, 'part2-edit-page');
  const part2Text = await bodyText(page);
  results.part2Page = part2Text.substring(0, 1000);
  log('Part 2 page: ' + part2Text.substring(0, 300));

  // Check tab structure on part detail page
  const part2Tabs = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('[role="tab"], mat-tab-header .mat-tab-label, nav a, [class*="tab-link"]'))
      .filter(el => el.offsetParent !== null);
    return tabs.map(t => ({ text: t.textContent.trim().slice(0, 30), href: t.getAttribute('href') }));
  });
  results.part2Tabs = part2Tabs;
  log('Part 2 tabs: ' + JSON.stringify(part2Tabs));

  await ctx.close();
}

// =============================================================
// PHASE F: Part cluster sub-pages
// =============================================================
log('=== Phase F: Part cluster sub-pages ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);

  const clusterRoutes = [
    { path: '/parts/2/serial-numbers', name: 'part2-serial-numbers' },
    { path: '/parts/2/vendor-sources', name: 'part2-vendor-sources' },
    { path: '/parts/2/alternates', name: 'part2-alternates' },
    { path: '/parts/2/routing', name: 'part2-routing' },
    { path: '/parts/2/bom', name: 'part2-bom' },
    { path: '/parts/2/costing', name: 'part2-costing' },
    { path: '/parts/2/quality', name: 'part2-quality' },
  ];

  for (const route of clusterRoutes) {
    await waitNav(page, route.path);
    await page.waitForTimeout(2500);
    const text = await bodyText(page);
    results[route.name] = text.substring(0, 800);
    await ss(page, route.name);
    const url = page.url();
    log(`${route.path} → ${url} | ${text.substring(0, 150)}`);
  }

  // Also check routing + BOM views on /parts route
  await waitNav(page, '/routing');
  await page.waitForTimeout(2000);
  await ss(page, 'routing-main');
  results.routingMain = (await bodyText(page)).substring(0, 800);

  await waitNav(page, '/routing/flow');
  await page.waitForTimeout(2000);
  await ss(page, 'routing-flow');
  results.routingFlow = (await bodyText(page)).substring(0, 800);
  log('Routing pages captured');

  await ctx.close();
}

// =============================================================
// PHASE G: Quick-create dialogs hunt
// =============================================================
log('=== Phase G: Quick-create dialog hunt ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);

  // Part quick-create from parts list
  await waitNav(page, '/parts');
  await page.waitForTimeout(2000);
  const newPartBtn = await page.$('[data-testid="new-part"], button:has-text("NEW PART"), button:has-text("New Part"), [aria-label*="new part"]').catch(() => null);
  if (newPartBtn) {
    await newPartBtn.click();
    await page.waitForTimeout(2000);
    await ss(page, 'new-part-fork');
    const forkText = await bodyText(page);
    results.newPartFork = forkText.substring(0, 500);
    log('New part fork: ' + forkText.substring(0, 200));

    // Look for quick-create/quick-add option
    const quickBtn = await page.$('[data-testid*="quick"], button:has-text("Quick"), mat-card:has-text("Quick")').catch(() => null);
    if (quickBtn) {
      await quickBtn.click();
      await page.waitForTimeout(2000);
      await ss(page, 'part-quick-create-dialog');
      results.partQuickCreate = (await bodyText(page)).substring(0, 1000);
      log('Part quick-create: ' + results.partQuickCreate.substring(0, 200));
      await page.keyboard.press('Escape');
    } else {
      log('No quick-create option in new-part fork');
    }
    await page.keyboard.press('Escape');
  }

  // Customer quick-create from customers list context
  await waitNav(page, '/customers');
  await page.waitForTimeout(1500);
  const custBtn = await page.$('[data-testid="new-customer"], button:has-text("NEW CUSTOMER"), button:has-text("New Customer")').catch(() => null);
  if (custBtn) {
    await custBtn.click();
    await page.waitForTimeout(2000);
    await ss(page, 'customer-fork-g');
    const forkText = await bodyText(page);
    results.customerFork = forkText.substring(0, 1000);
    log('Customer fork: ' + forkText.substring(0, 200));
    await page.keyboard.press('Escape');
  }

  // Vendor quick-create
  await waitNav(page, '/vendors');
  await page.waitForTimeout(1500);
  const vendorBtn = await page.$('[data-testid="new-vendor"], button:has-text("NEW VENDOR"), button:has-text("New Vendor")').catch(() => null);
  if (vendorBtn) {
    await vendorBtn.click();
    await page.waitForTimeout(2000);
    await ss(page, 'vendor-fork-g');
    const forkText = await bodyText(page);
    results.vendorFork = forkText.substring(0, 1000);
    log('Vendor fork: ' + forkText.substring(0, 200));
    await page.keyboard.press('Escape');
  }

  // Purchase orders list — check for vendor quick-create context
  await waitNav(page, '/purchase-orders');
  await page.waitForTimeout(2000);
  await ss(page, 'po-list');
  results.poList = (await bodyText(page)).substring(0, 800);
  log('PO list: ' + results.poList.substring(0, 200));

  // PO row click
  const poRow = await page.$('tbody tr:not(.mat-header-row), mat-row').catch(() => null);
  if (poRow) {
    await poRow.click();
    await page.waitForTimeout(2000);
    await ss(page, 'po-detail-panel');
    results.poDetailPanel = (await bodyText(page)).substring(0, 800);
    log('PO panel: ' + results.poDetailPanel.substring(0, 200));
    await page.keyboard.press('Escape');
  }

  await ctx.close();
}

// =============================================================
// PHASE H: Inventory pages — stock, receiving inspection
// =============================================================
log('=== Phase H: Inventory pages ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await login(page);

  const invRoutes = [
    { path: '/inventory', name: 'inventory-overview' },
    { path: '/inventory/stock', name: 'inventory-stock' },
    { path: '/inventory/receiving', name: 'inventory-receiving' },
    { path: '/inventory/lots', name: 'inventory-lots' },
    { path: '/inventory/adjustments', name: 'inventory-adjustments' },
    { path: '/lots', name: 'lots-main' },
  ];

  for (const route of invRoutes) {
    await waitNav(page, route.path);
    await page.waitForTimeout(2000);
    const text = await bodyText(page);
    results[route.name] = text.substring(0, 800);
    await ss(page, route.name);
    log(`${route.path}: ${text.substring(0, 150)}`);
  }

  // Lot row click for detail
  await waitNav(page, '/lots');
  await page.waitForTimeout(2000);
  const lotRow = await page.$('tbody tr:not(.mat-header-row), mat-row').catch(() => null);
  if (lotRow) {
    await lotRow.click();
    await page.waitForTimeout(2000);
    await ss(page, 'lot-detail-panel-h');
    const lotPanelText = await bodyText(page);
    results.lotDetailPanel = lotPanelText.substring(0, 1000);
    log('Lot panel: ' + lotPanelText.substring(0, 200));

    // Check panel structure
    const panelTabs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[role="tab"], [class*="tab-label"], [class*="tab-link"]'))
        .filter(el => el.offsetParent !== null)
        .map(el => el.textContent.trim().slice(0, 30))
    );
    log('Lot panel tabs: ' + JSON.stringify(panelTabs));
    results.lotPanelTabs = panelTabs;
    await page.keyboard.press('Escape');
  } else {
    log('No lot rows found');
    results.lotDetailPanel = 'no-lots-in-db';
  }

  await ctx.close();
}

// =============================================================
// Write results
// =============================================================
await browser.close();
fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
log('=== c7 sweep complete ===');
log(`Results saved to ${RESULTS_FILE}`);

for (const [k, v] of Object.entries(results)) {
  const val = typeof v === 'string' ? v.substring(0, 200) : JSON.stringify(v).substring(0, 200);
  console.log(`\n--- ${k} ---`);
  console.log(val);
}
