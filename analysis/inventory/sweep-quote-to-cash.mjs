/**
 * Live sweep of quote-to-cash region for ui-scout inventory phase 02.
 * Routes: quotes, sales-orders, purchase-orders, purchasing, invoices,
 * shipments, payments, customer-returns.
 * Also drives create-dialogs and detail-dialogs where possible.
 */
import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:4200';
const SS_DIR = path.resolve('E:/dev/forge/analysis/inventory/screenshots');
const LOG_FILE = path.resolve('E:/dev/forge/analysis/inventory/sweep-qtc-log.json');

const CREDS = {
  admin: { email: 'admin@forge.local', password: 'ForgeRun!2026' },
  manager: { email: 'manager@forge.local', password: 'ForgeRun!2026' },
  officemanager: { email: 'officemanager@forge.local', password: 'ForgeRun!2026' },
  engineer: { email: 'engineer@forge.local', password: 'ForgeRun!2026' },
  pm: { email: 'pm@forge.local', password: 'ForgeRun!2026' },
  worker: { email: 'worker@forge.local', password: 'ForgeRun!2026' },
};

// Routes to sweep (admin role baseline)
const ROUTES = [
  // Quotes / Estimates (estimates embedded in quotes feature)
  { id: 'quotes-list',          url: '/quotes',                   label: 'Quotes list' },
  // Sales Orders
  { id: 'sales-orders-list',    url: '/sales-orders',             label: 'Sales Orders list' },
  { id: 'sales-orders-recurring',url: '/sales-orders/recurring',  label: 'Recurring Orders page' },
  // Purchase Orders (3 tabs)
  { id: 'po-orders',            url: '/purchase-orders/orders',   label: 'PO list (orders tab)' },
  { id: 'po-suggestions',       url: '/purchase-orders/suggestions', label: 'PO auto suggestions tab' },
  { id: 'po-settings',          url: '/purchase-orders/settings', label: 'PO auto-PO settings tab (Admin)' },
  // Purchasing = RFQ
  { id: 'purchasing-rfq',       url: '/purchasing',               label: 'Purchasing / RFQ list' },
  // Invoices
  { id: 'invoices-list',        url: '/invoices',                 label: 'Invoices list' },
  // Shipments
  { id: 'shipments-list',       url: '/shipments',                label: 'Shipments list' },
  // Payments
  { id: 'payments-list',        url: '/payments',                 label: 'Payments list' },
  // Customer Returns
  { id: 'customer-returns-list',url: '/customer-returns',         label: 'Customer Returns list' },
  // Customer detail tabs that belong to Q2C
  { id: 'customer-detail-estimates', url: '/customers/1/estimates', label: 'Customer detail: estimates tab' },
  { id: 'customer-detail-quotes',    url: '/customers/1/quotes',    label: 'Customer detail: quotes tab' },
  { id: 'customer-detail-orders',    url: '/customers/1/orders',    label: 'Customer detail: orders tab' },
  { id: 'customer-detail-invoices',  url: '/customers/1/invoices',  label: 'Customer detail: invoices tab' },
];

async function login(page, cred) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 });
  await page.locator('input[type="email"], input[name="email"]').first().fill(cred.email);
  await page.locator('input[type="password"]').first().fill(cred.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 });
  // Handle profile redirect
  if (page.url().includes('/account/profile')) {
    try {
      await page.goto(`${BASE}/quotes`);
      await page.waitForTimeout(1500);
    } catch {}
  }
  console.log(`Logged in as ${cred.email} — at: ${page.url()}`);
}

async function screenshot(page, id) {
  const ssPath = path.join(SS_DIR, `qtc-${id}.png`);
  try { await page.screenshot({ path: ssPath, fullPage: false }); } catch {}
  return ssPath;
}

async function visitRoute(page, route) {
  const result = {
    id: route.id, label: route.label, url: route.url,
    finalUrl: null, h1: null, tabs: [], tableHeaders: [],
    buttons: [], emptyState: null, domText: null,
    screenshot: null, error: null,
  };
  try {
    await page.goto(`${BASE}${route.url}`, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(1500);
    result.finalUrl = page.url();
    try { result.h1 = await page.locator('h1, h2, .page-title, app-page-header').first().innerText(); } catch {}
    const pageText = (await page.locator('body').innerText()).toLowerCase();
    result.domText = pageText.slice(0, 1000);
    const emptyKeywords = ['no records', 'no data', 'no items', 'empty', 'get started', '0 results', 'no quotes', 'no orders', 'no invoices', 'no shipments', 'no payments', 'no purchase orders', 'no rfq', 'no returns'];
    for (const kw of emptyKeywords) { if (pageText.includes(kw)) { result.emptyState = kw; break; } }
    try { result.tabs = await page.locator('[role="tab"]').allInnerTexts(); } catch {}
    try { result.tableHeaders = await page.locator('th, .mat-header-cell').allInnerTexts(); } catch {}
    try {
      const btns = await page.locator('button:visible').allInnerTexts();
      result.buttons = btns.filter(b => b.trim()).slice(0, 25);
    } catch {}
    result.screenshot = await screenshot(page, route.id);
    console.log(`  ✓ ${route.id} => ${result.finalUrl}`);
  } catch (err) {
    result.error = err.message;
    try { result.screenshot = await screenshot(page, `${route.id}-error`); } catch {}
    console.error(`  ✗ ${route.id}: ${err.message}`);
  }
  return result;
}

async function tryOpenCreateDialog(page, routeId, buttonText) {
  const result = { id: `${routeId}-create-dialog`, buttons: [], fields: [], screenshot: null, error: null };
  try {
    const btn = page.locator(`button:has-text("${buttonText}"), button:has-text("New"), button:has-text("CREATE")`).first();
    await btn.waitFor({ timeout: 5000 });
    await btn.click();
    await page.waitForTimeout(2000);
    try { result.buttons = await page.locator('mat-dialog-container button:visible, [role="dialog"] button:visible').allInnerTexts(); } catch {}
    try { result.fields = await page.locator('mat-dialog-container input, mat-dialog-container select, [role="dialog"] input').evaluateAll(els => els.map(e => e.placeholder || e.name || e.type)); } catch {}
    result.screenshot = await screenshot(page, `${routeId}-create-dialog`);
    console.log(`  ✓ Create dialog opened for ${routeId}`);
    // Close dialog
    try {
      const closeBtn = page.locator('mat-dialog-container button:has-text("Cancel"), [role="dialog"] button:has-text("Cancel"), [role="dialog"] button:has-text("Close"), [aria-label="Close"]').first();
      await closeBtn.click();
      await page.waitForTimeout(1000);
    } catch {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
  } catch (err) {
    result.error = err.message;
    try { result.screenshot = await screenshot(page, `${routeId}-create-dialog-error`); } catch {}
  }
  return result;
}

async function tryOpenDetailDialog(page, routeId) {
  const result = { id: `${routeId}-detail-dialog`, tabs: [], buttons: [], screenshot: null, error: null };
  try {
    // Click first data row
    const row = page.locator('tr[role="row"]:not(.mat-header-row), .data-row, tbody tr').first();
    await row.waitFor({ timeout: 5000 });
    await row.click();
    await page.waitForTimeout(2000);
    try { result.tabs = await page.locator('[role="dialog"] [role="tab"], mat-dialog-container [role="tab"]').allInnerTexts(); } catch {}
    try { result.buttons = await page.locator('[role="dialog"] button:visible, mat-dialog-container button:visible').allInnerTexts(); } catch {}
    result.screenshot = await screenshot(page, `${routeId}-detail-dialog`);
    console.log(`  ✓ Detail dialog opened for ${routeId}`);
    try {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    } catch {}
  } catch (err) {
    result.error = err.message;
    try { result.screenshot = await screenshot(page, `${routeId}-detail-dialog-error`); } catch {}
  }
  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const results = [];

  // === PHASE A: Admin sweep of all base routes ===
  console.log('\n=== PHASE A: Admin baseline sweep ===');
  await login(page, CREDS.admin);

  for (const route of ROUTES) {
    console.log(`\nVisiting ${route.label}...`);
    const r = await visitRoute(page, route);
    results.push(r);
  }

  // === PHASE B: Try create dialogs on each list page (admin) ===
  console.log('\n=== PHASE B: Create dialogs ===');
  const createTargets = [
    { routeId: 'quotes-create', url: '/quotes', label: 'New Quote' },
    { routeId: 'so-create', url: '/sales-orders', label: 'New Sales Order' },
    { routeId: 'po-create', url: '/purchase-orders/orders', label: 'New Purchase Order' },
    { routeId: 'rfq-create', url: '/purchasing', label: 'New RFQ' },
    { routeId: 'invoice-create', url: '/invoices', label: 'New Invoice' },
    { routeId: 'shipment-create', url: '/shipments', label: 'New Shipment' },
    { routeId: 'payment-create', url: '/payments', label: 'New Payment' },
    { routeId: 'return-create', url: '/customer-returns', label: 'New Return' },
  ];
  for (const t of createTargets) {
    console.log(`\nOpening create dialog for ${t.routeId}...`);
    await page.goto(`${BASE}${t.url}`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);
    const r = await tryOpenCreateDialog(page, t.routeId, t.label);
    results.push(r);
  }

  // === PHASE C: Role sweeps (OfficeManager, PM, Worker, Engineer) ===
  console.log('\n=== PHASE C: Role sweeps ===');
  const roleSweeps = [
    { role: 'officemanager', cred: CREDS.officemanager, routes: ['/quotes', '/sales-orders', '/invoices', '/shipments', '/payments'] },
    { role: 'pm', cred: CREDS.pm, routes: ['/quotes', '/sales-orders', '/purchase-orders/orders', '/purchasing'] },
    { role: 'engineer', cred: CREDS.engineer, routes: ['/quotes', '/sales-orders', '/purchase-orders/orders'] },
    { role: 'worker', cred: CREDS.worker, routes: ['/quotes', '/sales-orders', '/invoices'] },
  ];

  for (const sweep of roleSweeps) {
    const roleContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const rolePage = await roleContext.newPage();
    try {
      await login(rolePage, sweep.cred);
      for (const url of sweep.routes) {
        const id = `${sweep.role}-${url.replace(/\//g, '-').replace(/^-/, '')}`;
        console.log(`  [${sweep.role}] ${url}`);
        const r = await visitRoute(rolePage, { id, url, label: `${sweep.role}: ${url}` });
        results.push(r);
      }
    } catch (err) {
      console.error(`Role sweep failed for ${sweep.role}: ${err.message}`);
    }
    await roleContext.close();
  }

  // === PHASE D: Estimate dialog (embedded in quotes) ===
  console.log('\n=== PHASE D: Estimate dialog ===');
  await page.goto(`${BASE}/quotes`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);
  // Look for estimate/price calculator button
  try {
    const estimateBtn = page.locator('button:has-text("Estimate"), button:has-text("Calculator"), button:has-text("Price"), button[title*="estimate" i]').first();
    await estimateBtn.waitFor({ timeout: 4000 });
    await estimateBtn.click();
    await page.waitForTimeout(2000);
    const estResult = {
      id: 'estimate-form-dialog',
      screenshot: await screenshot(page, 'estimate-form-dialog'),
      buttons: [],
      fields: [],
      error: null,
    };
    try { estResult.buttons = await page.locator('[role="dialog"] button:visible, mat-dialog-container button:visible').allInnerTexts(); } catch {}
    try { estResult.fields = await page.locator('mat-dialog-container label, [role="dialog"] label').allInnerTexts(); } catch {}
    results.push(estResult);
    await page.keyboard.press('Escape');
  } catch (err) {
    results.push({ id: 'estimate-form-dialog', error: err.message, screenshot: null });
    console.log(`  Estimate dialog not reachable from quotes page: ${err.message}`);
  }

  fs.writeFileSync(LOG_FILE, JSON.stringify(results, null, 2));
  console.log(`\nLog written to ${LOG_FILE} (${results.length} entries)`);
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
