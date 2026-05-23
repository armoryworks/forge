/**
 * Admin Inventory Sweep Phase G — remaining queue items with dialog fix
 * Fix: clickOutsideDialog skips buttons inside mat-dialog-container before clicking.
 */
import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import { writeFileSync } from 'fs';

const BASE = 'http://localhost:4200';
const CREDS = { email: 'admin@forge.local', password: 'ForgeRun!2026' };
const OUT = 'E:/dev/forge/analysis/inventory/admin-g-results.json';
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
  await page.waitForTimeout(400);
}
async function getDlgText(page) {
  const d = await page.$('mat-dialog-container');
  return d ? d.innerText().catch(() => null) : null;
}
async function clickOutsideDialog(page, ...texts) {
  for (const txt of texts) {
    const upper = txt.toUpperCase();
    for (const btn of await page.locator('button').all()) {
      const t = (await btn.innerText().catch(() => '')).trim().toUpperCase();
      if (t === upper || t.includes(upper)) {
        const inside = await btn.evaluate(el => !!el.closest('mat-dialog-container'));
        if (!inside) { await btn.click().catch(() => {}); await page.waitForTimeout(600); return true; }
      }
    }
  }
  return false;
}
async function openDlg(page, ...btns) {
  if (await page.$('mat-dialog-container')) await dismiss(page);
  if (!await clickOutsideDialog(page, ...btns)) return null;
  await page.waitForSelector('mat-dialog-container', { timeout: 5000 }).catch(() => {});
  return getDlgText(page);
}

const browser = await chromium.launch({ headless: true });
try {

// ── ADM-Q-009b Exchange Rate dialog ──
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage(); await login(page);
  console.log('=== ADM-Q-009b ===');
  await page.goto(BASE + '/admin/currencies'); await page.waitForLoadState('networkidle');
  await snap(page, 'currencies-v3');
  const allb = []; for (const b of await page.locator('button').all()) allb.push((await b.innerText().catch(() => '')).trim());
  console.log('buttons:', allb.filter(Boolean).join(' | '));
  let rateDc = await openDlg(page, 'SET RATE', 'EXCHANGE RATE');
  if (!rateDc) {
    const curDc = await openDlg(page, 'NEW CURRENCY', 'ADD CURRENCY');
    if (curDc) {
      persist('currency-new-dialog-v3', { dialogContent: curDc });
      await page.locator('mat-dialog-container input').first().fill('EUR').catch(() => {});
      for (const b of await page.locator('mat-dialog-container button').all()) {
        const t = (await b.innerText().catch(() => '')).trim().toUpperCase();
        if (t === 'SAVE' || t === 'CREATE') { await b.click(); break; }
      }
      await page.waitForTimeout(2000);
      await page.waitForSelector('mat-dialog-container', { state: 'hidden', timeout: 6000 }).catch(() => {});
      await page.waitForTimeout(400);
      rateDc = await openDlg(page, 'SET RATE', 'EXCHANGE RATE');
    }
  }
  if (rateDc) { persist('exchange-rate-dialog-ADM-Q-009b', { url: page.url(), dialogContent: rateDc }); await dismiss(page); }
  else persist('exchange-rate-dialog-ADM-Q-009b', { note: 'SET RATE not found; buttons: ' + allb.filter(Boolean).join(', ') });
  await ctx.close();
}

// ── ADM-Q-010 Training path dialog ──
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage(); await login(page);
  console.log('=== ADM-Q-010 ===');
  await page.goto(BASE + '/admin/training'); await page.waitForLoadState('networkidle');
  const tabs = await page.locator('[role=tab]').all(); const tabNames = [];
  for (const t of tabs) tabNames.push((await t.innerText().catch(() => '')).trim());
  console.log('tabs:', tabNames.join(' | '));
  for (const t of tabs) { if ((await t.innerText().catch(() => '')).toUpperCase().includes('PATH')) { await t.click(); await page.waitForTimeout(1000); break; } }
  await snap(page, 'training-paths-tab-v3');
  const pathBtns = []; for (const b of await page.locator('button').all()) pathBtns.push((await b.innerText().catch(() => '')).trim());
  console.log('paths-tab btns:', pathBtns.filter(Boolean).join(' | '));
  const pathDc = await openDlg(page, 'NEW PATH', 'ADD PATH', 'CREATE PATH');
  if (pathDc) {
    persist('training-path-new-dialog-ADM-Q-010', { url: page.url(), dialogContent: pathDc });
    const ni = await page.$('mat-dialog-container input[formcontrolname=name]') || await page.$('mat-dialog-container input');
    if (ni) await ni.fill('Sweep Test Path').catch(() => {});
    for (const b of await page.locator('mat-dialog-container button').all()) {
      const t = (await b.innerText().catch(() => '')).trim().toUpperCase();
      if (t.includes('CREATE') || t.includes('SAVE')) { await b.click(); break; }
    }
    await page.waitForTimeout(2000);
    await page.waitForSelector('mat-dialog-container', { state: 'hidden', timeout: 5000 }).catch(() => {});
    await snap(page, 'training-paths-after-seed');
  } else persist('training-path-new-dialog-ADM-Q-010', { url: page.url(), note: 'not found; tabs: ' + tabNames.join(', ') + '; btns: ' + pathBtns.filter(Boolean).join(', ') });
  await ctx.close();
}

// ── ADM-Q-018/019 Training module+path viewers ──
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage(); await login(page);
  console.log('=== ADM-Q-018/019 ===');
  await page.goto(BASE + '/admin/training'); await page.waitForLoadState('networkidle');
  const modDc = await openDlg(page, 'NEW MODULE', 'ADD MODULE'); let slug = null;
  if (modDc) {
    persist('training-module-new-dialog-v3', { dialogContent: modDc });
    slug = 'sweep-' + Date.now();
    const ti = await page.$('mat-dialog-container input[formcontrolname=title]') || await page.$('mat-dialog-container input');
    if (ti) await ti.fill('Sweep Module').catch(() => {});
    const si = await page.$('mat-dialog-container input[formcontrolname=slug]');
    if (si) await si.fill(slug).catch(() => {});
    const su = await page.$('mat-dialog-container textarea[formcontrolname=summary]');
    if (su) await su.fill('Seeded by sweep').catch(() => {});
    for (const b of await page.locator('mat-dialog-container button').all()) {
      const t = (await b.innerText().catch(() => '')).trim().toUpperCase();
      if (t.includes('CREATE') || t.includes('SAVE')) { await b.click(); break; }
    }
    await page.waitForTimeout(2500);
    await page.waitForSelector('mat-dialog-container', { state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  await page.goto(BASE + '/training/modules'); await page.waitForLoadState('networkidle');
  for (const t of await page.locator('[role=tab]').all()) { if ((await t.innerText().catch(() => '')).toUpperCase().includes('ALL MODULE')) { await t.click(); await page.waitForTimeout(800); break; } }
  await snap(page, 'training-all-modules-v3');
  const mls = await page.locator("a[href*='/training/module/']").all();
  console.log('module links:', mls.length);
  if (mls.length) { await page.goto(BASE + await mls[0].getAttribute('href')); await page.waitForLoadState('networkidle'); await snap(page, 'training-module-viewer-ADM-Q-018'); }
  else if (slug) { await page.goto(BASE + '/training/module/' + slug); await page.waitForLoadState('networkidle'); await snap(page, 'training-module-viewer-ADM-Q-018'); }
  else persist('training-module-viewer-ADM-Q-018', { note: 'no links; seeding failed' });
  await page.goto(BASE + '/training/modules'); await page.waitForLoadState('networkidle');
  for (const t of await page.locator('[role=tab]').all()) { if ((await t.innerText().catch(() => '')).toUpperCase().includes('PATH')) { await t.click(); await page.waitForTimeout(800); break; } }
  await snap(page, 'training-paths-viewer-v3');
  const pls = await page.locator("a[href*='/training/path/']").all();
  console.log('path links:', pls.length);
  if (pls.length) { await page.goto(BASE + await pls[0].getAttribute('href')); await page.waitForLoadState('networkidle'); await snap(page, 'training-path-viewer-ADM-Q-019'); }
  else persist('training-path-viewer-ADM-Q-019', { note: 'no path links' });
  await ctx.close();
}

// ── ADM-Q-022 Training detail ──
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage(); await login(page);
  console.log('=== ADM-Q-022 ===');
  await page.goto(BASE + '/admin/training'); await page.waitForLoadState('networkidle'); await snap(page, 'training-admin-v3');
  const rows = await page.locator('mat-row, .cdk-row').all(); console.log('rows:', rows.length);
  if (rows.length) {
    await rows[0].click(); await page.waitForTimeout(1200);
    const dc = await getDlgText(page);
    if (dc) { persist('training-detail-dialog-ADM-Q-022', { url: page.url(), dialogContent: dc }); await dismiss(page); }
    else await snap(page, 'training-detail-panel-ADM-Q-022');
  } else persist('training-detail-dialog-ADM-Q-022', { note: 'no rows in admin/training' });
  await ctx.close();
}

// ── ADM-Q-014 Presets compare ──
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage(); await login(page);
  console.log('=== ADM-Q-014 ===');
  await page.goto(BASE + '/admin/presets'); await page.waitForLoadState('networkidle'); await snap(page, 'presets-v3');
  const cbs = await page.locator('mat-checkbox').all(); console.log('checkboxes:', cbs.length);
  let n = 0;
  for (const cb of cbs.slice(0, 4)) {
    const on = await cb.evaluate(el => el.classList.contains('mat-checkbox-checked'));
    if (!on) { await cb.click(); await page.waitForTimeout(300); n++; if (n >= 3) break; }
  }
  const presBtns = []; for (const b of await page.locator('button').all()) presBtns.push((await b.innerText().catch(() => '')).trim());
  persist('presets-selection-state', { checked: n, buttons: presBtns.filter(Boolean) });
  console.log('checked:', n, 'buttons:', presBtns.filter(Boolean).join(' | '));
  const cmpClicked = await clickOutsideDialog(page, 'COMPARE', 'COMPARE SELECTED');
  await page.waitForTimeout(1500); await page.waitForLoadState('networkidle').catch(() => {});
  await snap(page, 'presets-compare-ADM-Q-014');
  console.log('compare:', cmpClicked, '->', page.url());
  await ctx.close();
}

// ── ADM-Q-016 Onboarding ──
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage(); await login(page);
  console.log('=== ADM-Q-016 ===');
  await page.goto(BASE + '/onboarding'); await page.waitForLoadState('networkidle');
  await snap(page, 'onboarding-step1-v3');
  await page.locator('input[formcontrolname=firstName]').first().fill('Sweep').catch(async () => { await page.locator('input').first().fill('Sweep').catch(() => {}); });
  await page.locator('input[formcontrolname=lastName]').first().fill('Scout').catch(() => {});
  await page.locator('input[formcontrolname=dateOfBirth]').first().fill('01/01/1990').catch(() => {});
  const tryNext = async (label) => {
    const btn = await page.$("button:has-text('NEXT'), button:has-text('CONTINUE'), button:has-text('SAVE & CONTINUE')");
    if (btn) { await btn.click(); await page.waitForTimeout(2000); await page.waitForLoadState('networkidle').catch(() => {}); }
    await snap(page, label);
    console.log(' ', label, page.url().replace(BASE, ''));
    return page.url().includes('/onboarding');
  };
  let go = await tryNext('onboarding-step2-ADM-Q-016');
  if (go) go = await tryNext('onboarding-step3-ADM-Q-016');
  if (go) go = await tryNext('onboarding-step4-ADM-Q-016');
  if (go) go = await tryNext('onboarding-step5-ADM-Q-016');
  if (go) go = await tryNext('onboarding-step6-ADM-Q-016');
  if (go) await tryNext('onboarding-step7-ADM-Q-016');
  await ctx.close();
}

// ── ADM-Q-013 MFA + ADM-Q-020 SetupIntegrations ──
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage(); await login(page);
  console.log('=== ADM-Q-013 + ADM-Q-020 ===');
  await page.goto(BASE + '/account/security'); await page.waitForLoadState('networkidle');
  await snap(page, 'account-security-v3');
  const secText = results['account-security-v3']?.text || '';
  const mfaOn = secText.toUpperCase().includes('DISABLE MFA') || secText.toUpperCase().includes('VIEW RECOVERY');
  console.log('MFA on:', mfaOn);
  if (mfaOn) {
    const rcDc = await openDlg(page, 'VIEW RECOVERY CODES', 'RECOVERY CODES');
    if (rcDc) { persist('mfa-recovery-codes-dialog-ADM-Q-013', { url: page.url(), dialogContent: rcDc }); await dismiss(page); }
  } else persist('mfa-recovery-codes-dialog-ADM-Q-013', { note: 'MFA not enabled', secSample: secText.slice(0, 300) });
  await page.goto(BASE + '/setup/integrations'); await page.waitForLoadState('networkidle');
  await snap(page, 'setup-integrations-ADM-Q-020'); console.log('setup/integrations:', page.url());
  await page.goto(BASE + '/setup'); await page.waitForLoadState('networkidle');
  await snap(page, 'setup-root-v2');
  await ctx.close();
}

} catch (err) {
  persist('__error', { message: err.message });
  console.error('SWEEP ERROR:', err.message);
}
writeFileSync(OUT, JSON.stringify(results, null, 2));
console.log('=== SWEEP G COMPLETE (' + Object.keys(results).length + ' keys) ===');
await browser.close();
