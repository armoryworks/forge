/**
 * Admin Inventory Sweep — Phase E (cycle 6 rewrite)
 * Targets all 18 open queue items: ADM-Q-002..Q-022
 */

import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import { writeFileSync } from 'fs';
import * as path from 'path';

const BASE = 'http://localhost:4200';
const CREDS = { email: 'admin@forge.local', password: 'ForgeRun!2026' };
const SS = 'E:/dev/forge/analysis/inventory/screenshots';
const OUT = 'E:/dev/forge/analysis/inventory/admin-e-results.json';

const results = {};
const log = m => console.log(`[sweep-e] ${m}`);

function flush() { writeFileSync(OUT, JSON.stringify(results, null, 2)); }

async function newSession(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.locator('input[type="email"]').fill(CREDS.email);
  await page.locator('input[type="password"]').fill(CREDS.password);
  await page.waitForTimeout(300);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 15000 });
  log(`session ready at ${page.url()}`);
  return { ctx, page };
}

async function nav(page, url, wait = 2500) {
  try {
    await page.goto(`${BASE}${url}`);
    await page.waitForLoadState('networkidle', { timeout: 12000 });
    await page.waitForTimeout(wait);
  } catch(e) { log(`nav error ${url}: ${e.message?.slice(0,60)}`); }
}

async function capture(page, key, extra = {}) {
  const url = page.url();
  const text = await page.evaluate(() => document.body.innerText.slice(0, 4000)).catch(() => '');
  const btns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean)
  ).catch(() => []);
  results[key] = { url, text, btns, ...extra };
  flush();
  log(`[${key}] ${url} btns=${JSON.stringify(btns.slice(0,8))}`);
}

async function openDialog(page, ...labels) {
  for (const label of labels) {
    const btns = await page.locator('button').all();
    for (const btn of btns) {
      const t = await btn.innerText().catch(() => '');
      if (t.trim().toUpperCase().includes(label.toUpperCase())) {
        try {
          await btn.click();
          await page.waitForSelector('mat-dialog-container', { timeout: 4000 });
          return label;
        } catch {}
      }
    }
  }
  return null;
}

async function dialogContent(page) {
  try {
    const d = await page.$('mat-dialog-container');
    if (d) return d.innerText();
  } catch {}
  return null;
}

async function closeDialog(page) {
  // Try Escape first, then Cancel button
  try { await page.keyboard.press('Escape'); await page.waitForTimeout(400); } catch {}
  const dc = await page.$('mat-dialog-container');
  if (dc) {
    for (const label of ['CANCEL', 'Cancel', 'Close', 'CLOSE']) {
      try {
        const btn = page.locator(`button:has-text("${label}")`).first();
        if (await btn.isVisible({ timeout: 500 })) { await btn.click(); break; }
      } catch {}
    }
  }
  await page.waitForTimeout(400);
}

async function clickTab(page, ...labels) {
  for (const label of labels) {
    const tabs = await page.locator('[role="tab"], .mat-tab-label, mat-tab-header button').all();
    for (const tab of tabs) {
      const t = await tab.innerText().catch(() => '');
      if (t.toUpperCase().includes(label.toUpperCase())) {
        await tab.click();
        await page.waitForTimeout(1200);
        return label;
      }
    }
  }
  return null;
}

async function ss(page, name) {
  return page.screenshot({ path: `${SS}/adm-e-${name}.png`, fullPage: false }).catch(() => {});
}

const browser = await chromium.launch({ headless: true });

// ═══════════════════════════════════════════════════════
// BATCH A — ADM-Q-007: CapabilityDetail
// ═══════════════════════════════════════════════════════
log('=== BATCH A: Q-007 CapabilityDetail ===');
{
  const { ctx, page } = await newSession(browser);
  await nav(page, '/admin/capabilities', 2500);
  await ss(page, 'cap-list');
  await capture(page, 'Q007_cap_list');

  let detailReached = false;
  // Try clicking a link that contains capabilities/:id
  const capLinks = await page.locator('a[href*="capabilities/"]').all();
  log(`cap links found: ${capLinks.length}`);
  if (capLinks.length > 0) {
    await capLinks[0].click();
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await ss(page, 'cap-detail');
    await capture(page, 'Q007_cap_detail');
    detailReached = true;
  }
  if (!detailReached) {
    // Try mat-list-item rows
    const rows = await page.locator('mat-list-item, mat-row, tr[mat-row]').all();
    log(`cap rows: ${rows.length}`);
    if (rows.length > 0) {
      await rows[0].click();
      await page.waitForTimeout(2000);
      await ss(page, 'cap-detail-row');
      await capture(page, 'Q007_cap_detail_row');
      detailReached = true;
    }
  }
  if (!detailReached) {
    for (const capId of ['CAP-ACCT-BUILTIN', '1']) {
      await nav(page, `/admin/capabilities/${capId}`, 2000);
      if (!page.url().endsWith('/admin/capabilities')) {
        await ss(page, `cap-detail-direct`);
        await capture(page, `Q007_cap_detail_direct_${capId}`);
        break;
      }
    }
  }
  await ctx.close();
}

// ═══════════════════════════════════════════════════════
// BATCH B — ADM-Q-002: RoleTemplates NEW TEMPLATE
// ═══════════════════════════════════════════════════════
log('=== BATCH B: Q-002 RoleTemplates ===');
{
  const { ctx, page } = await newSession(browser);
  await nav(page, '/admin/role-templates', 2500);
  await ss(page, 'role-templates');
  await capture(page, 'Q002_role_templates_list');
  const clicked = await openDialog(page, 'NEW TEMPLATE', 'Add Template', 'NEW', 'Add');
  if (clicked) {
    await ss(page, 'role-templates-dialog');
    const dc = await dialogContent(page);
    results['Q002_new_template_dialog'] = { url: page.url(), dialogContent: dc };
    flush();
    log(`Q002 dialog: ${dc?.slice(0, 150)}`);
    await closeDialog(page);
  } else {
    results['Q002_no_dialog'] = 'no NEW TEMPLATE button triggered a dialog';
  }
  await ctx.close();
}

// ═══════════════════════════════════════════════════════
// BATCH C — ADM-Q-003: LeadSources NEW SOURCE
// ═══════════════════════════════════════════════════════
log('=== BATCH C: Q-003 LeadSources ===');
{
  const { ctx, page } = await newSession(browser);
  await nav(page, '/admin/lead-sources', 2500);
  await ss(page, 'lead-sources');
  await capture(page, 'Q003_lead_sources_list');
  const clicked = await openDialog(page, 'NEW SOURCE', 'ADD SOURCE', 'NEW', 'Add');
  if (clicked) {
    await ss(page, 'lead-sources-dialog');
    const dc = await dialogContent(page);
    results['Q003_new_source_dialog'] = { url: page.url(), dialogContent: dc };
    flush();
    log(`Q003 dialog: ${dc?.slice(0, 150)}`);
    await closeDialog(page);
  } else {
    results['Q003_no_dialog'] = 'no NEW SOURCE button triggered a dialog';
  }
  await ctx.close();
}

// ═══════════════════════════════════════════════════════
// BATCH D — ADM-Q-004/005: Announcements
// ═══════════════════════════════════════════════════════
log('=== BATCH D: Q-004/005 Announcements ===');
{
  const { ctx, page } = await newSession(browser);
  await nav(page, '/admin/announcements', 2500);
  await ss(page, 'announcements-main');
  await capture(page, 'Q004_announcements_main');

  const clicked4 = await openDialog(page, 'NEW ANNOUNCEMENT', 'ADD ANNOUNCEMENT', 'NEW', 'Add');
  if (clicked4) {
    await ss(page, 'announcements-new-dialog');
    const dc = await dialogContent(page);
    results['Q004_new_announcement_dialog'] = { dialogContent: dc };
    flush();
    log(`Q004 dialog: ${dc?.slice(0, 180)}`);
    await closeDialog(page);
    await page.waitForTimeout(600);
  }

  const tabClicked = await clickTab(page, 'TEMPLATES', 'Templates');
  if (tabClicked) {
    await ss(page, 'announcements-templates-tab');
    await capture(page, 'Q005_announcements_templates_tab');
    const clicked5 = await openDialog(page, 'NEW TEMPLATE', 'ADD TEMPLATE', 'NEW', 'Add');
    if (clicked5) {
      await ss(page, 'announcements-template-dialog');
      const dc = await dialogContent(page);
      results['Q005_new_template_dialog'] = { dialogContent: dc };
      flush();
      log(`Q005 dialog: ${dc?.slice(0, 150)}`);
      await closeDialog(page);
    }
  }
  await ctx.close();
}

// ═══════════════════════════════════════════════════════
// BATCH E — ADM-Q-006: EDI NEW PARTNER
// ═══════════════════════════════════════════════════════
log('=== BATCH E: Q-006 EDI ===');
{
  const { ctx, page } = await newSession(browser);
  await nav(page, '/admin/edi', 2500);
  await ss(page, 'edi-main');
  await capture(page, 'Q006_edi_main');
  await clickTab(page, 'TRADING PARTNERS', 'Partners', 'PARTNER');
  await ss(page, 'edi-partners-tab');
  await capture(page, 'Q006_edi_partners_tab');
  const clicked = await openDialog(page, 'NEW PARTNER', 'ADD PARTNER', 'NEW', 'Add');
  if (clicked) {
    await ss(page, 'edi-partner-dialog');
    const dc = await dialogContent(page);
    results['Q006_new_partner_dialog'] = { dialogContent: dc };
    flush();
    log(`Q006 dialog: ${dc?.slice(0, 180)}`);
    await closeDialog(page);
  }
  await ctx.close();
}

// ═══════════════════════════════════════════════════════
// BATCH F — ADM-Q-008: IcpRubrics NEW RUBRIC
// ═══════════════════════════════════════════════════════
log('=== BATCH F: Q-008 IcpRubrics ===');
{
  const { ctx, page } = await newSession(browser);
  await nav(page, '/admin/icp-rubrics', 2500);
  await ss(page, 'icp-rubrics');
  await capture(page, 'Q008_icp_rubrics_list');
  const clicked = await openDialog(page, 'NEW RUBRIC', 'ADD RUBRIC', 'NEW', 'Add');
  if (clicked) {
    await ss(page, 'icp-rubrics-dialog');
    const dc = await dialogContent(page);
    results['Q008_new_rubric_dialog'] = { dialogContent: dc };
    flush();
    log(`Q008 dialog: ${dc?.slice(0, 180)}`);
    await closeDialog(page);
  }
  await ctx.close();
}

// ═══════════════════════════════════════════════════════
// BATCH G — ADM-Q-009: Currency dialogs
// ═══════════════════════════════════════════════════════
log('=== BATCH G: Q-009 Currency dialogs ===');
{
  const { ctx, page } = await newSession(browser);
  await nav(page, '/admin/currencies', 2500);
  await ss(page, 'currencies');
  await capture(page, 'Q009_currencies_list');
  const clicked1 = await openDialog(page, 'NEW CURRENCY', 'ADD CURRENCY', 'NEW', 'Add');
  if (clicked1) {
    await ss(page, 'currencies-new-dialog');
    const dc = await dialogContent(page);
    results['Q009_new_currency_dialog'] = { dialogContent: dc };
    flush();
    log(`Q009a dialog: ${dc?.slice(0, 180)}`);
    await closeDialog(page);
    await page.waitForTimeout(600);
  }
  const clicked2 = await openDialog(page, 'SET RATE', 'EXCHANGE RATE', 'ADD RATE');
  if (clicked2) {
    await ss(page, 'currencies-rate-dialog');
    const dc = await dialogContent(page);
    results['Q009_exchange_rate_dialog'] = { dialogContent: dc };
    flush();
    log(`Q009b dialog: ${dc?.slice(0, 150)}`);
    await closeDialog(page);
  }
  await ctx.close();
}

// ═══════════════════════════════════════════════════════
// BATCH H — ADM-Q-010 + Q-022: Training paths + detail
// ═══════════════════════════════════════════════════════
log('=== BATCH H: Q-010/Q-022 Training ===');
{
  const { ctx, page } = await newSession(browser);
  await nav(page, '/admin/training', 2500);
  await ss(page, 'admin-training-main');
  await capture(page, 'Q010_training_main');
  await clickTab(page, 'PATHS', 'Learning Paths', 'PATH');
  await ss(page, 'admin-training-paths-tab');
  await capture(page, 'Q010_paths_tab');
  const clicked = await openDialog(page, 'NEW PATH', 'ADD PATH', 'NEW LEARNING PATH', 'NEW', 'Add');
  if (clicked) {
    await ss(page, 'training-path-dialog');
    const dc = await dialogContent(page);
    results['Q010_new_path_dialog'] = { dialogContent: dc };
    flush();
    log(`Q010 dialog: ${dc?.slice(0, 180)}`);
    await closeDialog(page);
  }

  // Q-022: content tab module row click
  await nav(page, '/admin/training', 1500);
  await clickTab(page, 'CONTENT', 'Modules', 'MODULE');
  await page.waitForTimeout(1500);
  await ss(page, 'admin-training-content-tab');
  await capture(page, 'Q022_content_tab');
  const modRows = await page.locator('mat-list-item, mat-row, tr[mat-row], mat-expansion-panel').all();
  log(`module rows in content tab: ${modRows.length}`);
  if (modRows.length > 0) {
    await modRows[0].click();
    await page.waitForTimeout(1800);
    await ss(page, 'training-detail-trigger');
    const dc = await dialogContent(page);
    await capture(page, 'Q022_detail_trigger');
    if (dc) {
      results['Q022_detail_dialog'] = { dialogContent: dc };
      flush();
      log(`Q022 detail dialog: ${dc.slice(0, 100)}`);
      await closeDialog(page);
    }
  }
  await ctx.close();
}

// ═══════════════════════════════════════════════════════
// BATCH I — ADM-Q-014: Preset compare 2+ selected
// ═══════════════════════════════════════════════════════
log('=== BATCH I: Q-014 Preset compare ===');
{
  const { ctx, page } = await newSession(browser);
  await nav(page, '/admin/presets', 2500);
  await ss(page, 'presets-list');
  await capture(page, 'Q014_presets_list');
  // Tick 2+ mat-checkboxes
  const checkboxes = await page.locator('mat-checkbox input, input[type="checkbox"]').all();
  log(`preset checkboxes: ${checkboxes.length}`);
  let checked = 0;
  for (const cb of checkboxes) {
    if (checked >= 3) break;
    try { await cb.click(); await page.waitForTimeout(300); checked++; } catch {}
  }
  if (checked >= 2) {
    await ss(page, 'presets-2-checked');
    await capture(page, 'Q014_presets_checked');
    const clicked = await openDialog(page, 'COMPARE', 'Compare Selected');
    if (clicked) {
      await ss(page, 'presets-compare-dialog');
      const dc = await dialogContent(page);
      results['Q014_compare_dialog'] = { dialogContent: dc };
      flush();
      log(`Q014 compare dialog: ${dc?.slice(0, 100)}`);
      await closeDialog(page);
    } else {
      // Maybe COMPARE navigates rather than opens dialog
      await page.waitForTimeout(1000);
      await ss(page, 'presets-compare-page');
      await capture(page, 'Q014_compare_page');
    }
  } else {
    results['Q014_no_checkboxes'] = `only ${checkboxes.length} checkboxes found`;
    flush();
  }
  await ctx.close();
}

// ═══════════════════════════════════════════════════════
// BATCH J — ADM-Q-016: Onboarding steps 2-7
// ═══════════════════════════════════════════════════════
log('=== BATCH J: Q-016 Onboarding wizard ===');
{
  const { ctx, page } = await newSession(browser);
  await nav(page, '/onboarding', 3000);
  await ss(page, 'onboarding-s1');
  await capture(page, 'Q016_step1');

  // Fill step 1 minimally and advance
  await page.locator('input[formcontrolname="firstName"], input[placeholder*="first" i]').fill('Test').catch(() => {});
  await page.locator('input[formcontrolname="lastName"], input[placeholder*="last" i]').fill('Scout').catch(() => {});
  await page.locator('input[formcontrolname="dateOfBirth"], input[placeholder*="birth" i]').fill('01/01/1990').catch(() => {});
  await page.locator('input[formcontrolname="ssn"], input[placeholder*="ssn" i]').fill('000-00-0000').catch(() => {});

  for (let step = 2; step <= 7; step++) {
    const btns = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean)
    );
    log(`step${step-1} buttons: ${JSON.stringify(btns)}`);
    let advanced = false;
    for (const label of ['NEXT', 'Next', 'CONTINUE', 'Continue', 'NEXT STEP', 'Save & Continue', 'SAVE & CONTINUE']) {
      try {
        const btn = page.locator(`button:has-text("${label}")`).first();
        if (await btn.isVisible({ timeout: 1000 })) {
          await btn.click();
          await page.waitForTimeout(1800);
          advanced = true;
          break;
        }
      } catch {}
    }
    if (!advanced) {
      // try SKIP
      for (const label of ['SKIP', 'Skip', 'SKIP FOR NOW', 'Skip for now', 'SKIP STEP']) {
        try {
          const btn = page.locator(`button:has-text("${label}")`).first();
          if (await btn.isVisible({ timeout: 800 })) {
            await btn.click();
            await page.waitForTimeout(1800);
            advanced = true;
            break;
          }
        } catch {}
      }
    }
    await ss(page, `onboarding-s${step}`);
    await capture(page, `Q016_step${step}`);
    if (!advanced) {
      log(`step${step}: stuck, no next/skip button`);
      break;
    }
    if (page.url().includes('/dashboard') || page.url().includes('/account')) {
      log(`onboarding complete at step${step}, url: ${page.url()}`);
      break;
    }
  }
  await ctx.close();
}

// ═══════════════════════════════════════════════════════
// BATCH K — ADM-Q-018/019: Seed training module+path + viewer
// ═══════════════════════════════════════════════════════
log('=== BATCH K: Q-018/019 Training seed + viewers ===');
{
  const { ctx, page } = await newSession(browser);

  // Seed module
  await nav(page, '/admin/training', 2000);
  const contentTabK = await clickTab(page, 'CONTENT', 'Modules', 'MODULE');
  log(`content tab: ${contentTabK}`);
  const modDlg = await openDialog(page, 'NEW MODULE', 'ADD MODULE', 'NEW', 'Add');
  if (modDlg) {
    await page.waitForTimeout(1000);
    const dc = await dialogContent(page);
    results['Q018_module_dialog_fields'] = { dialogContent: dc };
    // Fill it
    await page.locator('mat-dialog-container input').nth(0).fill('Test Module Sweep').catch(() => {});
    await page.locator('mat-dialog-container input').nth(1).fill('test-module-sweep').catch(() => {});
    await page.locator('mat-dialog-container textarea').nth(0).fill('Sweep test module').catch(() => {});
    await ss(page, 'module-form-filled');
    // Submit
    const createBtn = page.locator('mat-dialog-container button').filter({ hasText: /CREATE|SAVE/i }).first();
    if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(2500);
    } else {
      await closeDialog(page);
    }
    flush();
    log(`module seed done, url: ${page.url()}`);
  }

  // Navigate to training module viewer
  await nav(page, '/training/modules', 2500);
  await clickTab(page, 'ALL MODULES', 'All Modules', 'ALL');
  await page.waitForTimeout(1000);
  await ss(page, 'training-all-modules');
  await capture(page, 'Q018_training_all_modules');

  const modCards = await page.locator('a[href*="/training/module/"], mat-card, [class*="module-card"]').all();
  log(`module cards: ${modCards.length}`);
  if (modCards.length > 0) {
    await modCards[0].click();
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await ss(page, 'training-module-viewer');
    await capture(page, 'Q018_module_viewer');
    log(`module viewer: ${page.url()}`);
  } else {
    // Try direct slug nav
    await nav(page, '/training/module/test-module-sweep', 2500);
    await ss(page, 'training-module-direct');
    await capture(page, 'Q018_module_direct');
    log(`module direct: ${page.url()}`);
  }

  // Seed path
  await nav(page, '/admin/training', 2000);
  await clickTab(page, 'PATHS', 'Learning Paths', 'PATH');
  await page.waitForTimeout(1000);
  const pathDlg = await openDialog(page, 'NEW PATH', 'ADD PATH', 'NEW', 'Add');
  if (pathDlg) {
    const dc = await dialogContent(page);
    results['Q019_path_dialog_fields'] = { dialogContent: dc };
    await page.locator('mat-dialog-container input').nth(0).fill('Test Path Sweep').catch(() => {});
    await page.locator('mat-dialog-container textarea').nth(0).fill('Sweep test path').catch(() => {});
    const createPathBtn = page.locator('mat-dialog-container button').filter({ hasText: /CREATE|SAVE/i }).first();
    if (await createPathBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createPathBtn.click();
      await page.waitForTimeout(2500);
    } else {
      await closeDialog(page);
    }
    flush();
  }

  // Navigate to paths viewer
  await nav(page, '/training/modules', 2000);
  await clickTab(page, 'LEARNING PATHS', 'Paths', 'PATH');
  await page.waitForTimeout(1000);
  await ss(page, 'training-paths-viewer');
  await capture(page, 'Q019_paths_viewer');
  const pathCards = await page.locator('a[href*="/training/path/"], mat-card, [class*="path-card"]').all();
  if (pathCards.length > 0) {
    await pathCards[0].click();
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await ss(page, 'training-path-viewer');
    await capture(page, 'Q019_path_viewer');
    log(`path viewer: ${page.url()}`);
  }

  await ctx.close();
}

// ═══════════════════════════════════════════════════════
// BATCH L — ADM-Q-013: MFA recovery codes
// ═══════════════════════════════════════════════════════
log('=== BATCH L: Q-013 MFA recovery codes ===');
{
  const { ctx, page } = await newSession(browser);
  await nav(page, '/account/security', 2500);
  await ss(page, 'account-security');
  await capture(page, 'Q013_security_page');
  const secText = results['Q013_security_page']?.text || '';
  const mfaOn = secText.includes('DISABLE') || secText.includes('VIEW RECOVERY') || secText.includes('REGENERATE');
  log(`MFA enabled: ${mfaOn}`);
  if (mfaOn) {
    const clicked = await openDialog(page, 'VIEW RECOVERY CODES', 'RECOVERY CODES', 'REGENERATE CODES');
    if (clicked) {
      await ss(page, 'mfa-recovery-dialog');
      const dc = await dialogContent(page);
      results['Q013_recovery_dialog'] = { dialogContent: dc };
      flush();
      log(`Q013 recovery: ${dc?.slice(0, 150)}`);
      await closeDialog(page);
    }
  } else {
    const clicked = await openDialog(page, 'ENABLE MFA', 'ENABLE', 'SETUP MFA', 'CONFIGURE');
    if (clicked) {
      await ss(page, 'mfa-setup-dialog');
      const dc = await dialogContent(page);
      results['Q013_setup_dialog'] = { dialogContent: dc };
      flush();
      log(`Q013 setup: ${dc?.slice(0, 150)}`);
      await closeDialog(page);
    }
    results['Q013_note'] = 'MFA not enabled on admin@forge.local; recovery codes not reachable without TOTP completion';
    flush();
  }
  await ctx.close();
}

// ═══════════════════════════════════════════════════════
// BATCH M — ADM-Q-017: CompleteI9Dialog
// ═══════════════════════════════════════════════════════
log('=== BATCH M: Q-017 CompleteI9 ===');
{
  const { ctx, page } = await newSession(browser);
  await nav(page, '/admin/compliance', 2500);
  await ss(page, 'compliance-for-i9');
  await capture(page, 'Q017_compliance');
  const clicked = await openDialog(page, 'COMPLETE I-9', 'Complete I-9', 'VERIFY I-9', 'I9', 'I-9');
  if (clicked) {
    await ss(page, 'complete-i9-dialog');
    const dc = await dialogContent(page);
    results['Q017_complete_i9_dialog'] = { dialogContent: dc };
    flush();
    log(`Q017 dialog: ${dc?.slice(0, 150)}`);
    await closeDialog(page);
  } else {
    results['Q017_note'] = 'no pending I-9 action on compliance page — needs employee with submitted I-9';
    flush();
  }
  // Also check employee compliance tab
  await nav(page, '/employees/2/compliance', 2500);
  await ss(page, 'emp-compliance-for-i9');
  await capture(page, 'Q017_emp_compliance');
  await ctx.close();
}

// ═══════════════════════════════════════════════════════
// BATCH N — ADM-Q-015/Q-020: OAuth callback + SetupIntegrations
// ═══════════════════════════════════════════════════════
log('=== BATCH N: Q-015/Q-020 OAuth + Setup ===');
{
  const { ctx, page } = await newSession(browser);
  await nav(page, '/account/communications/oauth-callback', 2500);
  await ss(page, 'oauth-callback-bare');
  await capture(page, 'Q015_oauth_bare');
  log(`Q015 bare: ${page.url()}`);

  await nav(page, '/account/communications/oauth-callback?code=test123&state=abc', 2500);
  await ss(page, 'oauth-callback-params');
  await capture(page, 'Q015_oauth_params');
  log(`Q015 params: ${page.url()}`);

  await nav(page, '/setup/integrations', 3000);
  await ss(page, 'setup-integrations');
  await capture(page, 'Q020_setup_integrations');
  log(`Q020: ${page.url()}`);
  await ctx.close();
}

// ═══════════════════════════════════════════════════════
// BATCH O — Extra: tariffs / working-calendars / assignment-rules dialogs
// ═══════════════════════════════════════════════════════
log('=== BATCH O: extra create dialogs ===');
{
  const { ctx, page } = await newSession(browser);
  for (const [route, key, labels] of [
    ['/admin/tariffs',           'tariffs',           ['NEW TARIFF','ADD TARIFF','NEW','Add']],
    ['/admin/working-calendars', 'working_calendars', ['NEW CALENDAR','ADD CALENDAR','NEW','Add']],
    ['/admin/assignment-rules',  'assignment_rules',  ['NEW RULE','ADD RULE','NEW','Add']],
    ['/admin/terminology',       'terminology',       ['ADD TERM','NEW TERM','NEW','Add']],
    ['/admin/automations',       'automations',       ['NEW AUTOMATION','ADD AUTOMATION','NEW','Add']],
  ]) {
    await nav(page, route, 2000);
    await ss(page, `extra-${key}`);
    await capture(page, `extra_${key}`);
    const clicked = await openDialog(page, ...labels);
    if (clicked) {
      const dc = await dialogContent(page);
      results[`extra_${key}_dialog`] = { dialogContent: dc };
      flush();
      log(`${key} dialog: ${dc?.slice(0, 100)}`);
      await closeDialog(page);
    }
  }
  await ctx.close();
}

await browser.close();
log('browser closed');
flush();
console.log(`SWEEP-E COMPLETE: ${Object.keys(results).length} result keys written to ${OUT}`);
