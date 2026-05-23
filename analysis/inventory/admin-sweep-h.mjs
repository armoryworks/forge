/**
 * Admin Inventory Sweep Phase H — final targeted items
 * Fixes: button.tab for training tabs, proper exchange-rate capture, module seeding
 */
import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import { writeFileSync } from 'fs';

const BASE = 'http://localhost:4200';
const CREDS = { email: 'admin@forge.local', password: 'ForgeRun!2026' };
const OUT = 'E:/dev/forge/analysis/inventory/admin-h-results.json';
const results = {};

function persist(key, data) {
  results[key] = data;
  writeFileSync(OUT, JSON.stringify(results, null, 2));
  const lbl = typeof data === 'object' ? String(data.url || data.note || '').slice(0, 60) : '';
  console.log('[' + key + '] ' + lbl);
}
async function login(page) {
  await page.goto(BASE + '/login');
  await page.waitForSelector('input[type=email]', { timeout: 10000 });
  await page.locator('input[type=email]').fill(CREDS.email);
  await page.locator('input[type=password]').fill(CREDS.password);
  await page.locator('button[type=submit]').click();
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 15000 });
  console.log('Login OK');
}
async function snap(page, key) {
  const url = page.url();
  const text = await page.evaluate(() => document.body.innerText.slice(0, 4000)).catch(() => '');
  persist(key, { url, text });
}
async function dismiss(page) {
  await page.keyboard.press('Escape');
  await page.waitForSelector('mat-dialog-container', { state: 'hidden', timeout: 5000 }).catch(() => {});
  await page.waitForSelector('.cdk-overlay-backdrop', { state: 'hidden', timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(500);
}
async function getDlgText(page) {
  const d = await page.$('mat-dialog-container');
  return d ? d.innerText().catch(() => null) : null;
}

const browser = await chromium.launch({ headless: true });
try {

// ── ADM-Q-009b Exchange Rate dialog (direct button click, no dialog open first) ──
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage();
  await login(page);
  console.log('=== ADM-Q-009b ===');
  await page.goto(BASE + '/admin/currencies'); await page.waitForLoadState('networkidle');
  // List all buttons
  const allBtns = []; for (const b of await page.locator('button').all()) allBtns.push((await b.innerText().catch(() => '')).trim());
  console.log('Currency page buttons:', allBtns.filter(Boolean).join(' | '));
  // Look specifically for SET RATE / EXCHANGE RATE button by innerText
  let rateOpened = false;
  for (const btn of await page.locator('button').all()) {
    const t = (await btn.innerText().catch(() => '')).trim().toUpperCase();
    const inside = await btn.evaluate(el => !!el.closest('mat-dialog-container'));
    if (!inside && (t.includes('SET RATE') || t.includes('EXCHANGE RATE') || t.includes('SET EXCHANGE'))) {
      console.log('Clicking SET RATE button, text:', JSON.stringify(t));
      await btn.click();
      await page.waitForTimeout(800);
      rateOpened = true;
      break;
    }
  }
  if (rateOpened) {
    await page.waitForSelector('mat-dialog-container', { timeout: 5000 }).catch(() => {});
    const dlg = await getDlgText(page);
    persist('exchange-rate-dialog-ADM-Q-009b', { url: page.url(), dialogContent: dlg, note: dlg ? null : 'no dialog opened' });
    if (dlg) await dismiss(page);
  } else {
    persist('exchange-rate-dialog-ADM-Q-009b', { note: 'SET RATE button not found', buttons: allBtns.filter(Boolean) });
  }
  await ctx.close();
}

// ── ADM-Q-010 Training path NEW PATH (using button.tab selector) ──
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage();
  await login(page);
  console.log('=== ADM-Q-010 ===');
  await page.goto(BASE + '/admin/training'); await page.waitForLoadState('networkidle');
  // Training tabs are button.tab elements
  const tabBtns = await page.locator('button.tab').all();
  const tabLabels = []; for (const t of tabBtns) tabLabels.push((await t.innerText().catch(() => '')).trim());
  console.log('button.tab labels:', tabLabels.join(' | '));
  for (const t of tabBtns) {
    if ((await t.innerText().catch(() => '')).toUpperCase().includes('PATH')) {
      await t.click(); await page.waitForTimeout(1000); break;
    }
  }
  await snap(page, 'training-paths-tab-v4');
  // Get all page buttons
  const pathBtns = []; for (const b of await page.locator('button').all()) pathBtns.push((await b.innerText().catch(() => '')).trim());
  console.log('Paths tab buttons:', pathBtns.filter(Boolean).join(' | '));
  // Find NEW PATH button
  let pathDialogOpened = false;
  for (const btn of await page.locator('button').all()) {
    const t = (await btn.innerText().catch(() => '')).trim().toUpperCase();
    const inside = await btn.evaluate(el => !!el.closest('mat-dialog-container'));
    if (!inside && (t.includes('NEW PATH') || t.includes('ADD PATH'))) {
      await btn.click(); await page.waitForTimeout(800); pathDialogOpened = true; break;
    }
  }
  if (pathDialogOpened) {
    await page.waitForSelector('mat-dialog-container', { timeout: 5000 }).catch(() => {});
    const dlg = await getDlgText(page);
    persist('training-path-new-dialog-ADM-Q-010', { url: page.url(), dialogContent: dlg });
    console.log('[ADM-Q-010] dialog:', dlg?.slice(0, 150));
    // Fill and seed
    if (dlg) {
      const ni = await page.$('mat-dialog-container input[formcontrolname="name"]') || await page.$('mat-dialog-container input');
      if (ni) await ni.fill('Sweep Test Path').catch(() => {});
      // Find enabled create/save button
      for (const b of await page.locator('mat-dialog-container button:not([disabled])').all()) {
        const t = (await b.innerText().catch(() => '')).trim().toUpperCase();
        if (t.includes('CREATE') || t.includes('SAVE')) { await b.click(); break; }
      }
      await page.waitForTimeout(2000);
      await page.waitForSelector('mat-dialog-container', { state: 'hidden', timeout: 5000 }).catch(() => {});
    }
  } else {
    persist('training-path-new-dialog-ADM-Q-010', { note: 'NEW PATH button not found after tab click; buttons: ' + pathBtns.filter(Boolean).join(', ') });
  }
  await ctx.close();
}

// ── ADM-Q-018/019 Training module seed + viewer ──
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage();
  await login(page);
  console.log('=== ADM-Q-018/019 ===');
  await page.goto(BASE + '/admin/training'); await page.waitForLoadState('networkidle');

  // Open NEW MODULE dialog
  let modDlg = null;
  for (const btn of await page.locator('button').all()) {
    const t = (await btn.innerText().catch(() => '')).trim().toUpperCase();
    const inside = await btn.evaluate(el => !!el.closest('mat-dialog-container'));
    if (!inside && (t.includes('NEW MODULE') || t.includes('ADD MODULE'))) {
      await btn.click(); await page.waitForTimeout(800); break;
    }
  }
  await page.waitForSelector('mat-dialog-container', { timeout: 5000 }).catch(() => {});
  modDlg = await getDlgText(page);
  if (modDlg) {
    persist('training-module-new-dialog-v4', { dialogContent: modDlg });
    console.log('[ADM-Q-018] module dialog:', modDlg?.slice(0, 150));
    // Fill required fields
    const slug = 'sweep-' + Date.now();
    const titleInput = await page.$('mat-dialog-container input[formcontrolname="title"]');
    if (titleInput) await titleInput.fill('Sweep Test Module').catch(() => {});
    const slugInput = await page.$('mat-dialog-container input[formcontrolname="slug"]');
    if (slugInput) await slugInput.fill(slug).catch(() => {});
    const summaryInput = await page.$('mat-dialog-container textarea[formcontrolname="summary"]');
    if (summaryInput) await summaryInput.fill('Test module for sweep').catch(() => {});
    await page.waitForTimeout(500);
    // Find enabled create button (not disabled)
    const enabledBtns = await page.locator('mat-dialog-container button:not([disabled])').all();
    console.log('  Enabled buttons in dialog:', (await Promise.all(enabledBtns.map(b => b.innerText().catch(() => '')))).map(t => t.trim()).join(' | '));
    for (const b of enabledBtns) {
      const t = (await b.innerText().catch(() => '')).trim().toUpperCase();
      if (t.includes('CREATE') || t.includes('SAVE')) { await b.click(); break; }
    }
    await page.waitForTimeout(2500);
    await page.waitForSelector('mat-dialog-container', { state: 'hidden', timeout: 5000 }).catch(() => {});
    await snap(page, 'training-after-module-seed');
    // Navigate to training module viewer
    await page.goto(BASE + '/training/modules'); await page.waitForLoadState('networkidle');
    // Click ALL MODULES tab
    for (const t of await page.locator('button.tab, [role=tab], .mat-tab-label').all()) {
      if ((await t.innerText().catch(() => '')).toUpperCase().includes('ALL MODULE')) { await t.click(); await page.waitForTimeout(800); break; }
    }
    await snap(page, 'training-all-modules-v4');
    // Click first module link
    const mls = await page.locator('a[href*="/training/module/"]').all();
    console.log('  module links:', mls.length);
    if (mls.length) {
      const href = await mls[0].getAttribute('href');
      await page.goto(BASE + href); await page.waitForLoadState('networkidle');
      await snap(page, 'training-module-viewer-ADM-Q-018');
    } else {
      await page.goto(BASE + '/training/module/' + slug); await page.waitForLoadState('networkidle');
      await snap(page, 'training-module-viewer-ADM-Q-018');
    }
  } else {
    persist('training-module-viewer-ADM-Q-018', { note: 'NEW MODULE dialog not opened' });
  }

  // ADM-Q-019: training path viewer
  await page.goto(BASE + '/admin/training'); await page.waitForLoadState('networkidle');
  // Click PATHS tab via button.tab
  for (const t of await page.locator('button.tab').all()) {
    if ((await t.innerText().catch(() => '')).toUpperCase().includes('PATH')) { await t.click(); await page.waitForTimeout(800); break; }
  }
  // Open NEW PATH
  for (const btn of await page.locator('button').all()) {
    const t = (await btn.innerText().catch(() => '')).trim().toUpperCase();
    const inside = await btn.evaluate(el => !!el.closest('mat-dialog-container'));
    if (!inside && (t.includes('NEW PATH') || t.includes('ADD PATH'))) { await btn.click(); await page.waitForTimeout(800); break; }
  }
  await page.waitForSelector('mat-dialog-container', { timeout: 4000 }).catch(() => {});
  const pathDlgContent = await getDlgText(page);
  if (pathDlgContent && !results['training-path-new-dialog-ADM-Q-010']) {
    persist('training-path-new-dialog-ADM-Q-010', { url: page.url(), dialogContent: pathDlgContent });
  }
  if (pathDlgContent) {
    const ni = await page.$('mat-dialog-container input[formcontrolname="name"]') || await page.$('mat-dialog-container input');
    if (ni) await ni.fill('Sweep Test Path').catch(() => {});
    for (const b of await page.locator('mat-dialog-container button:not([disabled])').all()) {
      const t = (await b.innerText().catch(() => '')).trim().toUpperCase();
      if (t.includes('CREATE') || t.includes('SAVE')) { await b.click(); break; }
    }
    await page.waitForTimeout(2500);
    await page.waitForSelector('mat-dialog-container', { state: 'hidden', timeout: 5000 }).catch(() => {});
  } else await dismiss(page);

  // Navigate to paths viewer
  await page.goto(BASE + '/training/modules'); await page.waitForLoadState('networkidle');
  for (const t of await page.locator('button.tab, [role=tab], .mat-tab-label').all()) {
    if ((await t.innerText().catch(() => '')).toUpperCase().includes('PATH')) { await t.click(); await page.waitForTimeout(800); break; }
  }
  await snap(page, 'training-paths-viewer-v4');
  const pls = await page.locator('a[href*="/training/path/"]').all();
  console.log('  path links:', pls.length);
  if (pls.length) {
    const href = await pls[0].getAttribute('href');
    await page.goto(BASE + href); await page.waitForLoadState('networkidle');
    await snap(page, 'training-path-viewer-ADM-Q-019');
  } else persist('training-path-viewer-ADM-Q-019', { note: 'no path links in viewer after seeding' });
  await ctx.close();
}

// ── ADM-Q-022 Training detail (click module row in admin) ──
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage();
  await login(page);
  console.log('=== ADM-Q-022 ===');
  await page.goto(BASE + '/admin/training'); await page.waitForLoadState('networkidle');
  await snap(page, 'training-admin-v4');
  const rows = await page.locator('mat-row, .cdk-row').all(); console.log('rows:', rows.length);
  if (rows.length) {
    await rows[0].click(); await page.waitForTimeout(1200);
    const dc = await getDlgText(page);
    if (dc) { persist('training-detail-dialog-ADM-Q-022', { url: page.url(), dialogContent: dc }); await dismiss(page); }
    else await snap(page, 'training-detail-panel-ADM-Q-022');
  } else persist('training-detail-dialog-ADM-Q-022', { note: 'no rows; table empty (D4 applies — no modules seeded yet)' });
  await ctx.close();
}

// ── ADM-Q-014 Presets compare ──
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage();
  await login(page);
  console.log('=== ADM-Q-014 Presets ===');
  await page.goto(BASE + '/admin/presets'); await page.waitForLoadState('networkidle');
  await snap(page, 'presets-v4');
  const cbs = await page.locator('mat-checkbox').all(); console.log('checkboxes:', cbs.length);
  let n = 0;
  for (const cb of cbs.slice(0, 4)) {
    const on = await cb.evaluate(el => el.classList.contains('mat-checkbox-checked') || el.querySelector('input')?.checked);
    if (!on) { await cb.click(); await page.waitForTimeout(400); n++; if (n >= 3) break; }
  }
  console.log('checked:', n);
  await page.waitForTimeout(500);
  const allBtns = []; for (const b of await page.locator('button').all()) allBtns.push((await b.innerText().catch(() => '')).trim());
  persist('presets-selection-state', { checked: n, buttons: allBtns.filter(Boolean) });
  console.log('buttons after select:', allBtns.filter(Boolean).join(' | '));
  // Click COMPARE button
  for (const btn of await page.locator('button').all()) {
    const t = (await btn.innerText().catch(() => '')).trim().toUpperCase();
    const inside = await btn.evaluate(el => !!el.closest('mat-dialog-container'));
    if (!inside && t.includes('COMPARE')) { await btn.click(); await page.waitForTimeout(1500); break; }
  }
  await page.waitForLoadState('networkidle').catch(() => {});
  await snap(page, 'presets-compare-ADM-Q-014');
  console.log('compare url:', page.url());
  await ctx.close();
}

// ── ADM-Q-016 Onboarding steps 2-7 ──
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage();
  await login(page);
  console.log('=== ADM-Q-016 ===');
  await page.goto(BASE + '/onboarding'); await page.waitForLoadState('networkidle');
  await snap(page, 'onboarding-step1-v4');
  // Fill step 1
  await page.locator('input[formcontrolname="firstName"]').first().fill('Sweep').catch(async () => { await page.locator('input').nth(0).fill('Sweep').catch(() => {}); });
  await page.locator('input[formcontrolname="lastName"]').first().fill('Scout').catch(() => {});
  await page.locator('input[formcontrolname="dateOfBirth"]').first().fill('01/01/1990').catch(() => {});
  await page.waitForTimeout(400);
  const advance = async (label) => {
    const btn = await page.$("button:has-text('NEXT'), button:has-text('CONTINUE'), button:has-text('SAVE & CONTINUE')");
    if (btn) { await btn.click(); await page.waitForTimeout(2000); await page.waitForLoadState('networkidle').catch(() => {}); }
    await snap(page, label);
    console.log(' ', label, page.url().replace(BASE, ''));
    return page.url().includes('/onboarding');
  };
  let go = await advance('onboarding-step2-ADM-Q-016');
  if (go) go = await advance('onboarding-step3-ADM-Q-016');
  if (go) go = await advance('onboarding-step4-ADM-Q-016');
  if (go) go = await advance('onboarding-step5-ADM-Q-016');
  if (go) go = await advance('onboarding-step6-ADM-Q-016');
  if (go) await advance('onboarding-step7-ADM-Q-016');
  await ctx.close();
}

// ── ADM-Q-013 MFA + ADM-Q-020 SetupIntegrations ──
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage();
  await login(page);
  console.log('=== ADM-Q-013 + ADM-Q-020 ===');
  await page.goto(BASE + '/account/security'); await page.waitForLoadState('networkidle');
  await snap(page, 'account-security-v4');
  const secText = results['account-security-v4']?.text || '';
  const mfaOn = secText.toUpperCase().includes('DISABLE MFA') || secText.toUpperCase().includes('VIEW RECOVERY');
  console.log('MFA on:', mfaOn, '| secText sample:', secText.slice(0, 100));
  if (mfaOn) {
    for (const btn of await page.locator('button').all()) {
      const t = (await btn.innerText().catch(() => '')).trim().toUpperCase();
      if (t.includes('VIEW RECOVERY') || t.includes('RECOVERY CODES')) {
        await btn.click(); await page.waitForTimeout(800);
        await page.waitForSelector('mat-dialog-container', { timeout: 5000 }).catch(() => {});
        const dc = await getDlgText(page);
        persist('mfa-recovery-codes-dialog-ADM-Q-013', { url: page.url(), dialogContent: dc });
        await dismiss(page); break;
      }
    }
  } else persist('mfa-recovery-codes-dialog-ADM-Q-013', { note: 'MFA not enabled; recovery codes unavailable', secSample: secText.slice(0, 300) });
  await page.goto(BASE + '/setup/integrations'); await page.waitForLoadState('networkidle');
  await snap(page, 'setup-integrations-ADM-Q-020');
  console.log('setup/integrations finalUrl:', page.url());
  await page.goto(BASE + '/setup'); await page.waitForLoadState('networkidle');
  await snap(page, 'setup-root-v2');
  console.log('setup root finalUrl:', page.url());
  await ctx.close();
}

} catch (err) {
  persist('__error', { message: err.message });
  console.error('SWEEP ERROR:', err.message);
}
writeFileSync(OUT, JSON.stringify(results, null, 2));
console.log('=== SWEEP H COMPLETE (' + Object.keys(results).length + ' keys) ===');
await browser.close();
