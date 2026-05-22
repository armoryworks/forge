/**
 * Master-data inventory sweep — cycle 2
 * Covers: leads (populated + dialogs), customers (populated + all detail tabs),
 *         inventory tabs Q1-a..Q1-f, key dialogs Q3-a,d,e,g,k,o,q, vendors, parts
 */
const { chromium } = require('E:/dev/forge/forge-ui/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4200';
const SHOT_DIR = 'E:/dev/forge/analysis/inventory/screenshots';
const LOG = [];

async function login(page, email = 'admin@forge.local', pw = 'ForgeRun!2026') {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  try {
    await page.fill('input[type="email"]', email);
  } catch {
    await page.fill('input:first-of-type', email);
  }
  await page.fill('input[type="password"]', pw);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  if (page.url().includes('/account/profile') || page.url().includes('/profile')) {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
  }
}

async function shot(page, name, note = '') {
  const file = path.join(SHOT_DIR, `c2-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  const text = await page.evaluate(() => document.body.innerText.slice(0, 600));
  LOG.push({ name, url: page.url(), note, text: text.substring(0, 300) });
  console.log(`  [shot] c2-${name}.png`);
  return text;
}

async function navAndShot(page, url, name, note = '', wait = 2000) {
  await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(wait);
  const text = await shot(page, name, note);
  return text;
}

async function tryClick(page, selector, wait = 800) {
  try {
    const el = page.locator(selector).first();
    if (await el.count() > 0) {
      await el.click();
      await page.waitForTimeout(wait);
      return true;
    }
  } catch (e) {}
  return false;
}

async function closeDialog(page) {
  // Try various close mechanisms
  for (const sel of [
    'button:has-text("Cancel")',
    'button:has-text("CANCEL")',
    'button:has-text("Close")',
    '[mat-dialog-close]',
    'button[aria-label="Close"]',
    '.mat-dialog-close',
  ]) {
    if (await tryClick(page, sel, 300)) return;
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  console.log('=== LOGIN admin ===');
  await login(page);
  await shot(page, 'admin-landing', 'post-login landing');

  // ── LEADS (populated) ────────────────────────────────────────────────────
  console.log('\n=== LEADS ===');
  let text = await navAndShot(page, '/leads', 'leads-populated', 'leads list with 1 lead');

  // Try to get row count and body content
  const leadsRowCount = await page.locator('tbody tr, mat-row, [role="row"]:not([role="columnheader"])').count();
  LOG[LOG.length-1].rowCount = leadsRowCount;
  console.log(`  Rows: ${leadsRowCount}`);

  // NEW LEAD button → fork dialog
  const newLeadClicked = await tryClick(page, 'button:has-text("NEW LEAD"), button:has-text("New Lead")');
  if (!newLeadClicked) await tryClick(page, 'app-page-header button, .page-header button');
  await page.waitForTimeout(800);
  if (page.url().includes('/leads') || await page.locator('mat-dialog-container, .cdk-overlay-container').count() > 0) {
    await shot(page, 'new-lead-fork-dialog', 'NewLeadForkDialogComponent');

    // Try advancing to manual form step
    const manualOpt = page.locator('mat-radio-button, .fork-option, button:has-text("Manual")').first();
    if (await manualOpt.count() > 0) {
      await manualOpt.click();
      await page.waitForTimeout(400);
      await shot(page, 'new-lead-fork-manual-selected', 'fork manual option selected');
    }
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("CONTINUE"), button:has-text("Next"), button:has-text("NEXT")').first();
    if (await continueBtn.count() > 0 && !(await continueBtn.isDisabled())) {
      await continueBtn.click();
      await page.waitForTimeout(800);
      await shot(page, 'lead-form-step2', 'lead fork step 2 form');
    }
    await closeDialog(page);
  }

  // Click lead row → detail panel
  await page.goto(`${BASE_URL}/leads`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const leadRows = page.locator('tbody tr, mat-row, [data-testid="data-row"]');
  const leadRowCnt = await leadRows.count();
  if (leadRowCnt > 0) {
    await leadRows.first().click();
    await page.waitForTimeout(1500);
    await shot(page, 'lead-detail-panel-open', 'LeadDetailPanelComponent populated');

    // Look for status chips
    const statusChips = await page.locator('.status-chip, [class*="chip"], mat-chip').count();
    LOG[LOG.length-1].statusChips = statusChips;

    // Look for Convert button
    const convertClicked = await tryClick(page, 'button:has-text("Convert"), button:has-text("CONVERT TO CUSTOMER")');
    if (convertClicked) {
      await page.waitForTimeout(800);
      await shot(page, 'lead-convert-dialog', 'LeadConvertDialogComponent');
      await closeDialog(page);
    }
  }

  // Leads sub-pages
  for (const [slug, lbl] of [
    ['/leads/intake', 'leads-intake-re'],
    ['/leads/queue', 'leads-queue-re'],
    ['/leads/campaigns', 'leads-campaigns-re'],
    ['/leads/accounts', 'leads-accounts-re'],
    ['/leads/suppression', 'leads-suppression-re'],
    ['/leads/samples', 'leads-samples-re'],
  ]) {
    await navAndShot(page, slug, lbl);
  }

  // Account dialog
  await page.goto(`${BASE_URL}/leads/accounts`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  if (await tryClick(page, 'button:has-text("NEW ACCOUNT"), button:has-text("New Account")')) {
    await page.waitForTimeout(800);
    await shot(page, 'account-dialog', 'AccountDialogComponent empty/create');
    await closeDialog(page);
  }

  // Campaign dialog
  await page.goto(`${BASE_URL}/leads/campaigns`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  if (await tryClick(page, 'button:has-text("NEW CAMPAIGN"), button:has-text("New Campaign")')) {
    await page.waitForTimeout(800);
    await shot(page, 'campaign-dialog', 'CampaignDialogComponent empty/create');
    await closeDialog(page);
  }

  // ── CUSTOMERS (populated + all tabs) ────────────────────────────────────
  console.log('\n=== CUSTOMERS ===');
  text = await navAndShot(page, '/customers', 'customers-populated', 'customers list with 1 customer');
  const custRowCnt = await page.locator('tbody tr, mat-row, [data-testid="data-row"]').count();
  LOG[LOG.length-1].rowCount = custRowCnt;
  console.log(`  Customer rows: ${custRowCnt}`);

  // NEW CUSTOMER → fork dialog
  if (await tryClick(page, 'button:has-text("NEW CUSTOMER"), button:has-text("New Customer")')) {
    await page.waitForTimeout(800);
    await shot(page, 'new-customer-fork-dialog', 'NewCustomerForkDialogComponent');

    // Explore fork options
    const forkOpts = page.locator('mat-radio-button, .fork-option');
    const forkOptCnt = await forkOpts.count();
    LOG[LOG.length-1].forkOptions = forkOptCnt;

    if (forkOptCnt > 0) {
      // Select first option (usually "New Customer" path)
      await forkOpts.first().click();
      await page.waitForTimeout(300);
      await shot(page, 'new-customer-fork-option1', 'fork option 1 selected');
    }

    const contBtn = page.locator('button:has-text("Continue"), button:has-text("CONTINUE"), button:has-text("Next")').first();
    if (await contBtn.count() > 0 && !(await contBtn.isDisabled())) {
      await contBtn.click();
      await page.waitForTimeout(1000);
      await shot(page, 'guided-customer-dialog', 'GuidedCustomerDialogComponent step 1');

      // Step through guided dialog
      for (let s = 1; s <= 3; s++) {
        const nxt = page.locator('button:has-text("Next"), button:has-text("NEXT")').first();
        if (await nxt.count() > 0 && !(await nxt.isDisabled())) {
          await nxt.click();
          await page.waitForTimeout(600);
          await shot(page, `guided-customer-dialog-step${s+1}`, `GuidedCustomerDialog step ${s+1}`);
        }
      }
    }
    await closeDialog(page);
  }

  // Lead picker dialog (convert-from-lead path)
  await page.goto(`${BASE_URL}/customers`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  if (await tryClick(page, 'button:has-text("NEW CUSTOMER"), button:has-text("New Customer")')) {
    await page.waitForTimeout(800);
    // Select "Convert from lead" option if present
    const convertOpt = page.locator('mat-radio-button:has-text("Lead"), mat-radio-button:has-text("lead"), .fork-option:has-text("lead")').first();
    if (await convertOpt.count() > 0) {
      await convertOpt.click();
      await page.waitForTimeout(300);
      const contBtn = page.locator('button:has-text("Continue"), button:has-text("CONTINUE")').first();
      if (await contBtn.count() > 0 && !(await contBtn.isDisabled())) {
        await contBtn.click();
        await page.waitForTimeout(800);
        await shot(page, 'lead-picker-dialog', 'LeadPickerDialogComponent');
      }
    }
    await closeDialog(page);
  }

  // Customer detail - all 11 tabs
  const custTabs = [
    'overview', 'contacts', 'addresses', 'estimates',
    'quotes', 'orders', 'jobs', 'invoices',
    'pricing', 'interactions', 'activity',
  ];
  for (const tab of custTabs) {
    text = await navAndShot(page, `/customers/2/${tab}`, `customer-detail-${tab}`, `customer detail ${tab} tab`, 2000);
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 1000));
    LOG[LOG.length-1].bodyText = bodyText.substring(0, 400);
    // Note any "tab not found" / 404 patterns
    if (bodyText.toLowerCase().includes('not found') || page.url().includes('/404')) {
      LOG[LOG.length-1].note += ' [REDIRECT/404]';
    }
  }

  // Pricing tab: try opening price list dialog
  await page.goto(`${BASE_URL}/customers/2/pricing`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  if (await tryClick(page, 'button:has-text("ADD PRICE LIST"), button:has-text("New Price List"), button:has-text("ADD")')) {
    await page.waitForTimeout(800);
    await shot(page, 'price-list-form-dialog', 'PriceListFormDialogComponent');
    await closeDialog(page);
  }

  // Customer sub-pages
  for (const [slug, lbl] of [
    ['/customers/contacts', 'customers-contacts-re'],
    ['/customers/portal-access', 'customers-portal-access-re'],
    ['/customers/segments', 'customers-segments-re'],
    ['/customers/import', 'customers-import-re'],
  ]) {
    await navAndShot(page, slug, lbl);
  }

  // Provision portal access dialog
  await page.goto(`${BASE_URL}/customers/portal-access`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  if (await tryClick(page, 'button:has-text("PROVISION"), button:has-text("Provision Access")')) {
    await page.waitForTimeout(800);
    await shot(page, 'provision-portal-access-dialog', 'ProvisionPortalAccessDialogComponent');
    await closeDialog(page);
  }

  // ── INVENTORY TABS Q1-a..Q1-f ───────────────────────────────────────────
  console.log('\n=== INVENTORY TABS ===');
  for (const [slug, lbl] of [
    ['/inventory/movements', 'inventory-movements'],
    ['/inventory/stockOps', 'inventory-stockOps'],
    ['/inventory/cycleCounts', 'inventory-cycleCounts'],
    ['/inventory/reservations', 'inventory-reservations'],
    ['/inventory/replenishment', 'inventory-replenishment'],
    ['/inventory/uom', 'inventory-uom'],
  ]) {
    text = await navAndShot(page, slug, lbl, 'Q1 tab sweep');
    LOG[LOG.length-1].bodyText = text.substring(0, 400);
  }

  // StockOps: trigger transfer and adjust dialogs/forms
  await page.goto(`${BASE_URL}/inventory/stockOps`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  for (const [sel, lbl] of [
    ['button:has-text("TRANSFER"), button:has-text("Transfer"), button:has-text("Move Stock")', 'stockOps-transfer-form'],
    ['button:has-text("ADJUST"), button:has-text("Adjust"), button:has-text("Adjust Stock")', 'stockOps-adjust-form'],
  ]) {
    if (await tryClick(page, sel)) {
      await page.waitForTimeout(600);
      await shot(page, lbl, `stockOps inline dialog`);
      await closeDialog(page);
    }
  }

  // CycleCounts: create dialog
  await page.goto(`${BASE_URL}/inventory/cycleCounts`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  if (await tryClick(page, 'button:has-text("NEW"), button:has-text("Create"), button:has-text("START COUNT"), button:has-text("CYCLE COUNT")')) {
    await page.waitForTimeout(600);
    await shot(page, 'cycleCount-create-dialog', 'cycleCounts create dialog');
    await closeDialog(page);
  }

  // Reservations: reserve dialog
  await page.goto(`${BASE_URL}/inventory/reservations`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  if (await tryClick(page, 'button:has-text("RESERVE"), button:has-text("New Reservation"), button:has-text("NEW")')) {
    await page.waitForTimeout(600);
    await shot(page, 'reservation-create-dialog', 'reservations create dialog');
    await closeDialog(page);
  }

  // Locations: add location dialog
  await page.goto(`${BASE_URL}/inventory/locations`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  if (await tryClick(page, 'button:has-text("ADD LOCATION"), button:has-text("Add Location"), button:has-text("NEW LOCATION"), button:has-text("NEW")')) {
    await page.waitForTimeout(600);
    await shot(page, 'inventory-add-location-dialog', 'inventory add-location inline dialog');
    await closeDialog(page);
  }

  // ── VENDORS (populated) ────────────────────────────────────────────────
  console.log('\n=== VENDORS ===');
  text = await navAndShot(page, '/vendors', 'vendors-populated', 'vendors list with 1 vendor');
  const vendorRowCnt = await page.locator('tbody tr, mat-row, [data-testid="data-row"]').count();
  console.log(`  Vendor rows: ${vendorRowCnt}`);

  // Click vendor row → detail panel
  const vendorRows = page.locator('tbody tr, mat-row, [data-testid="data-row"]');
  if (await vendorRows.count() > 0) {
    await vendorRows.first().click();
    await page.waitForTimeout(1500);
    await shot(page, 'vendor-detail-panel', 'VendorDetailPanelComponent info tab');
    LOG[LOG.length-1].bodyText = (await page.evaluate(() => document.body.innerText.slice(0, 800))).substring(0, 400);

    // Vendor panel tabs
    for (const tabLabel of ['Purchase Orders', 'Scorecard', 'Catalog']) {
      const tab = page.locator(`[role="tab"]:has-text("${tabLabel}"), button.tab:has-text("${tabLabel}"), .mat-tab-label:has-text("${tabLabel}")`).first();
      if (await tab.count() > 0) {
        await tab.click();
        await page.waitForTimeout(800);
        await shot(page, `vendor-panel-tab-${tabLabel.replace(' ','-').toLowerCase()}`, `VendorDetailPanel ${tabLabel} tab`);
      }
    }

    // Edit button within panel
    if (await tryClick(page, 'button:has-text("Edit"), button:has-text("EDIT")')) {
      await page.waitForTimeout(800);
      await shot(page, 'vendor-edit-dialog', 'VendorDialogComponent (edit)');
      await closeDialog(page);
    }
  }

  // NEW VENDOR fork dialog
  await page.goto(`${BASE_URL}/vendors`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  if (await tryClick(page, 'button:has-text("NEW VENDOR"), button:has-text("New Vendor")')) {
    await page.waitForTimeout(800);
    await shot(page, 'new-vendor-fork-dialog', 'NewVendorForkDialogComponent');

    // Try quick path
    const opts = page.locator('mat-radio-button, .fork-option');
    if (await opts.count() > 0) {
      await opts.first().click();
      await page.waitForTimeout(300);
      const cont = page.locator('button:has-text("Continue"), button:has-text("CONTINUE")').first();
      if (await cont.count() > 0 && !(await cont.isDisabled())) {
        await cont.click();
        await page.waitForTimeout(800);
        await shot(page, 'vendor-quick-dialog', 'VendorDialogComponent (quick path)');
        await closeDialog(page);
      }
    }
    await closeDialog(page);
  }

  // ── PARTS (populated) ────────────────────────────────────────────────────
  console.log('\n=== PARTS ===');
  text = await navAndShot(page, '/parts', 'parts-populated', 'parts list with 1 part');
  const partRowCnt = await page.locator('tbody tr, mat-row, [data-testid="data-row"]').count();
  console.log(`  Part rows: ${partRowCnt}`);

  // Click part row → detail panel/dialog
  const partRows = page.locator('tbody tr, mat-row, [data-testid="data-row"]');
  if (await partRows.count() > 0) {
    await partRows.first().click();
    await page.waitForTimeout(1500);
    await shot(page, 'part-detail-panel', 'PartDetailPanelComponent or PartDetailDialogComponent');
    LOG[LOG.length-1].bodyText = (await page.evaluate(() => document.body.innerText.slice(0, 800))).substring(0, 400);
    await closeDialog(page);
  }

  // NEW PART fork dialog
  await page.goto(`${BASE_URL}/parts`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  if (await tryClick(page, 'button:has-text("NEW PART"), button:has-text("New Part")')) {
    await page.waitForTimeout(800);
    await shot(page, 'new-part-fork-dialog', 'NewPartForkDialogComponent');

    // Try express option
    const opts = page.locator('mat-radio-button, .fork-option');
    const optCnt = await opts.count();
    if (optCnt > 0) {
      await opts.first().click();
      await page.waitForTimeout(300);
      await shot(page, 'new-part-fork-option1', 'fork option 1 selected');

      const cont = page.locator('button:has-text("Continue"), button:has-text("CONTINUE")').first();
      if (await cont.count() > 0 && !(await cont.isDisabled())) {
        await cont.click();
        await page.waitForTimeout(800);
        await shot(page, 'part-express-form', 'PartExpressFormComponent or first workflow step');
      }
    }
    await closeDialog(page);
  }

  // Part workflow (edit mode for seeded part)
  console.log('  Navigating part workflow...');
  await page.goto(`${BASE_URL}/parts/3`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const partWorkflowText = await page.evaluate(() => document.body.innerText.slice(0, 1000));
  await shot(page, 'part-workflow-edit', 'PartWorkflowPageComponent edit mode step 1');
  LOG[LOG.length-1].bodyText = partWorkflowText.substring(0, 400);

  // Navigate through workflow steps
  let stepNum = 0;
  for (let i = 0; i < 16; i++) {
    const stepTitle = await page.evaluate(() => {
      const h = document.querySelector('h1, h2, h3, .step-title, .workflow-step-title');
      return h ? h.innerText : '';
    });
    console.log(`  Part workflow step ${stepNum}: "${stepTitle}"`);
    if (stepTitle) LOG.push({ name: `part-workflow-step-${stepNum}-info`, stepTitle, url: page.url() });

    await shot(page, `part-workflow-step-${stepNum}`, `workflow step ${stepNum}: ${stepTitle}`);
    stepNum++;

    const nextBtn = page.locator('button:has-text("Next"), button:has-text("NEXT")').first();
    if (await nextBtn.count() === 0) break;
    if (await nextBtn.isDisabled()) {
      console.log(`  Step ${stepNum}: Next disabled — done with workflow`);
      break;
    }
    await nextBtn.click();
    await page.waitForTimeout(1000);
  }

  // ── LOTS ─────────────────────────────────────────────────────────────────
  console.log('\n=== LOTS ===');
  text = await navAndShot(page, '/lots', 'lots-re', 're-visit lots empty state');

  // NEW LOT dialog
  const lotBtns = ['button:has-text("NEW LOT")', 'button:has-text("New Lot")', 'button:has-text("CREATE LOT")', 'button:has-text("NEW")'];
  for (const sel of lotBtns) {
    if (await tryClick(page, sel)) {
      await page.waitForTimeout(800);
      await shot(page, 'lot-dialog-create', 'LotDialogComponent create/empty state');
      await closeDialog(page);
      break;
    }
  }

  // ── ROLE SWEEPS ──────────────────────────────────────────────────────────
  console.log('\n=== ROLE SWEEPS ===');
  const roles = [
    ['manager@forge.local', 'manager'],
    ['officemanager@forge.local', 'officemanager'],
    ['pm@forge.local', 'pm'],
    ['engineer@forge.local', 'engineer'],
    ['worker@forge.local', 'worker'],
  ];

  const masterDataRoutes = ['/leads', '/customers', '/vendors', '/parts', '/inventory/stock', '/lots'];

  for (const [email, roleLabel] of roles) {
    console.log(`  Logging in as ${roleLabel}...`);
    await login(page, email, 'ForgeRun!2026');

    for (const slug of masterDataRoutes) {
      try {
        await page.goto(`${BASE_URL}${slug}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1200);
        const finalUrl = page.url();
        const bodySnip = (await page.evaluate(() => document.body.innerText.slice(0, 200)));
        const blocked = finalUrl.includes('/403') || finalUrl.includes('/dashboard') ||
                        finalUrl.includes('/login') ||
                        bodySnip.toLowerCase().includes('access denied') ||
                        bodySnip.toLowerCase().includes('not authorized') ||
                        bodySnip.toLowerCase().includes('forbidden');
        LOG.push({ name: `role-${roleLabel}${slug.replace(/\//g,'-')}`, url: finalUrl, blocked, bodySnip: bodySnip.slice(0,100) });
        if (!blocked) {
          await shot(page, `role-${roleLabel}${slug.replace(/\//g,'-')}`, `${roleLabel} accessing ${slug}`);
        } else {
          console.log(`    BLOCKED: ${roleLabel} → ${slug} (landed on ${finalUrl})`);
        }
      } catch (e) {
        LOG.push({ name: `role-${roleLabel}${slug.replace(/\//g,'-')}-error`, note: e.message });
      }
    }
  }

  await browser.close();

  // Write log
  fs.writeFileSync('E:/dev/forge/analysis/inventory/sweep-c2-log.json', JSON.stringify(LOG, null, 2));
  console.log(`\nCompleted. ${LOG.length} log entries. Screenshots in ${SHOT_DIR}/c2-*.png`);
}

main().catch(e => { console.error(e); process.exit(1); });
