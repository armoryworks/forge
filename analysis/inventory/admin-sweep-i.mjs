// admin-sweep-i.mjs — Final targeted: bypass backdrop via JS clicks + debug tab HTML
// Captures: ADM-Q-005(ann templates), ADM-Q-009b(exchange rate), ADM-Q-010(training path),
//           ADM-Q-013(MFA), ADM-Q-014(presets compare), ADM-Q-016(onboarding),
//           ADM-Q-018(training module viewer), ADM-Q-019(training path viewer), ADM-Q-022(detail)

import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import { writeFileSync } from 'fs';
import * as path from 'path';

const BASE = 'http://localhost:4200';
const ADMIN = { email: 'admin@forge.local', password: 'ForgeRun!2026' };
const OUT = path.resolve('admin-i-results.json');

const results = {};
const save = (k, d) => {
  results[k] = d;
  writeFileSync(OUT, JSON.stringify(results, null, 2));
  const preview = d.dialogContent || d.text || d.note || JSON.stringify(d).slice(0, 100);
  console.log(`[${k}]`, String(preview).slice(0, 120).replace(/\n/g, '|'));
};

async function mkCtx(browser, creds = ADMIN) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/login`);
  await p.fill('input[type="email"], input[formcontrolname="email"]', creds.email);
  await p.fill('input[type="password"], input[formcontrolname="password"]', creds.password);
  await p.click('button[type="submit"]');
  await p.waitForURL(u => !u.toString().includes('/login'), { timeout: 10000 });
  return { ctx, p };
}

// Force-click a button by its data-testid or text, bypassing backdrop
async function jsClick(p, selector) {
  return p.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) { el.click(); return true; }
    return false;
  }, selector);
}

async function jsClickByText(p, ...texts) {
  return p.evaluate((texts) => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const t of texts) {
      const btn = btns.find(b => b.innerText.trim().toUpperCase().includes(t.toUpperCase()));
      if (btn) { btn.click(); return btn.innerText.trim(); }
    }
    return null;
  }, texts);
}

async function getDlg(p) {
  return p.evaluate(() => {
    const d = document.querySelector('mat-dialog-container, [role="dialog"]');
    return d ? d.innerText.slice(0, 3000) : null;
  }).catch(() => null);
}

async function snap(p, key) {
  const url = p.url();
  const text = await p.evaluate(() => document.body.innerText.slice(0, 4000));
  save(key, { url, text });
  return text;
}

async function clearOverlay(p) {
  // Force-remove any CDK overlay state via JS
  await p.evaluate(() => {
    document.querySelectorAll('.cdk-overlay-backdrop, .dialog-backdrop').forEach(el => el.remove());
    document.querySelectorAll('.cdk-overlay-pane').forEach(el => {
      if (!el.querySelector('mat-select-panel, .cdk-overlay-connected-position-bounding-box')) {
        el.remove();
      }
    });
  });
  await p.waitForTimeout(300);
}

const browser = await chromium.launch({ headless: true });

// ─── 1. Exchange rate dialog via JS click (testId bypass) ───
{
  const { ctx, p } = await mkCtx(browser);
  await p.goto(`${BASE}/admin/currencies`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(500);

  // Click SET RATE via testId first (before any currency dialog is open)
  const clicked1 = await jsClick(p, '[data-testid="rate-new-btn"]');
  if (!clicked1) {
    // fallback: click by text
    await jsClickByText(p, 'SET RATE', 'ADD RATE');
  }
  await p.waitForTimeout(1000);
  const dc = await getDlg(p);
  save('exchange-rate-dialog-ADM-Q-009b', { url: p.url(), dialogContent: dc, method: 'js-force-click-before-currency-create' });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(500);
  await clearOverlay(p);
  await ctx.close();
}

// ─── 2. Announcements TEMPLATES tab — debug HTML structure then click ───
{
  const { ctx, p } = await mkCtx(browser);
  await p.goto(`${BASE}/admin/announcements`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(2000);

  // Dump tab-area HTML to understand structure
  const tabAreaHtml = await p.evaluate(() => {
    // Find the mat-tab-group or nav element
    for (const sel of ['mat-tab-group', 'mat-tab-header', 'nav[mat-tab-nav-bar]', '[class*="tab-group"]', '[class*="tab-header"]']) {
      const el = document.querySelector(sel);
      if (el) return { sel, html: el.outerHTML.slice(0, 1500) };
    }
    // Fallback: find anything containing "TEMPLATES" text
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let node;
    while (node = walker.nextNode()) {
      if (node.childElementCount === 0 && node.textContent?.trim().toUpperCase() === 'TEMPLATES') {
        return { found: 'text', tag: node.tagName, cls: node.className, parent: node.parentElement?.outerHTML.slice(0, 400) };
      }
    }
    return { note: 'no tab structure found' };
  });
  console.log('tab area:', JSON.stringify(tabAreaHtml).slice(0, 500));
  save('ann-tab-html-debug', tabAreaHtml);

  // Click TEMPLATES text element via JS
  const tplClicked = await p.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let node;
    while (node = walker.nextNode()) {
      if (node.childElementCount === 0 && node.textContent?.trim().toUpperCase() === 'TEMPLATES') {
        node.click();
        // Also try clicking parent (tab button wrapper)
        node.parentElement?.click();
        return { tag: node.tagName, cls: node.className };
      }
    }
    return null;
  });
  console.log('TEMPLATES click result:', JSON.stringify(tplClicked));
  await p.waitForTimeout(1500);
  await snap(p, 'ann-after-templates-click');

  // Now list buttons
  const btnsAfter = await p.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => ({ txt: b.innerText.trim(), testid: b.getAttribute('data-testid') || '' })).filter(b => b.txt)
  );
  console.log('buttons after TEMPLATES click:', JSON.stringify(btnsAfter.slice(0, 15)));
  save('ann-templates-buttons', { buttons: btnsAfter.slice(0, 15) });

  // Click the template creation button (whatever it's called)
  const tplBtnClicked = await jsClickByText(p, 'NEW TEMPLATE', 'ADD TEMPLATE', 'CREATE TEMPLATE', 'NEW ANNOUNCEMENT TEMPLATE');
  console.log('template btn clicked:', tplBtnClicked);
  await p.waitForTimeout(1000);
  const dc = await getDlg(p);
  save('ann-template-dialog-ADM-Q-005', { url: p.url(), dialogContent: dc, tplClicked, tplBtnClicked, btnsCount: btnsAfter.length });
  await p.keyboard.press('Escape');
  await clearOverlay(p);
  await ctx.close();
}

// ─── 3. Training paths tab via JS click + NEW PATH dialog ───
{
  const { ctx, p } = await mkCtx(browser);
  await p.goto(`${BASE}/admin/training`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(1000);

  // Debug tabs
  const trnTabHtml = await p.evaluate(() => {
    for (const sel of ['mat-tab-group', 'mat-tab-header', 'nav[mat-tab-nav-bar]', '[class*="tab-group"]']) {
      const el = document.querySelector(sel);
      if (el) return { sel, html: el.outerHTML.slice(0, 1000) };
    }
    return { note: 'no tab group' };
  });
  console.log('training tab html:', JSON.stringify(trnTabHtml).slice(0, 300));

  // Click PATHS tab via JS text search
  const pathsTabClicked = await p.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let node;
    while (node = walker.nextNode()) {
      if (node.childElementCount === 0 && node.textContent?.trim().toUpperCase() === 'PATHS') {
        node.click();
        node.parentElement?.click();
        return { tag: node.tagName, cls: node.className };
      }
    }
    return null;
  });
  console.log('PATHS tab clicked:', JSON.stringify(pathsTabClicked));
  await p.waitForTimeout(1000);
  await snap(p, 'training-paths-tab-i');

  // NEW PATH button
  const pathBtns = await p.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => ({ txt: b.innerText.trim(), testid: b.getAttribute('data-testid') || '' })).filter(b => b.txt)
  );
  console.log('training path btns:', JSON.stringify(pathBtns.slice(0, 10)));

  const pathBtnClicked = await jsClickByText(p, 'NEW PATH', 'ADD PATH', 'CREATE PATH', 'NEW LEARNING PATH');
  console.log('NEW PATH clicked:', pathBtnClicked);
  await p.waitForTimeout(1000);
  const dc = await getDlg(p);
  save('training-path-dialog-ADM-Q-010', { url: p.url(), dialogContent: dc, pathsTabClicked, pathBtnClicked });
  if (dc) { await p.keyboard.press('Escape'); await clearOverlay(p); }
  await ctx.close();
}

// ─── 4. Presets compare — force-check via dispatchEvent ───
{
  const { ctx, p } = await mkCtx(browser);
  await p.goto(`${BASE}/admin/presets`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(2000);

  const domDebug = await p.evaluate(() => ({
    matCheckbox: document.querySelectorAll('mat-checkbox').length,
    inputCheckbox: document.querySelectorAll('input[type="checkbox"]').length,
    testIds: Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid')).slice(0, 20),
    btns: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t).slice(0, 20)
  }));
  console.log('presets DOM:', JSON.stringify(domDebug));
  save('presets-dom-i', domDebug);

  // Try checking 2 checkboxes via dispatchEvent
  const cbsChecked = await p.evaluate(() => {
    const cbs = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    let count = 0;
    for (const cb of cbs) {
      if (count >= 2) break;
      if (!cb.checked) {
        cb.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        count++;
      }
    }
    return { total: cbs.length, clicked: count };
  });
  console.log('checkboxes clicked:', cbsChecked);
  await p.waitForTimeout(1000);
  await snap(p, 'presets-after-2-selected');

  // Get buttons now
  const btnsAfter = await p.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t)
  );
  console.log('presets buttons after select:', btnsAfter.slice(0, 20));

  const cmpClicked = await jsClickByText(p, 'COMPARE');
  console.log('COMPARE clicked:', cmpClicked);
  await p.waitForTimeout(1500);
  await p.waitForLoadState('networkidle').catch(() => {});
  await snap(p, 'presets-compare-ADM-Q-014');
  await ctx.close();
}

// ─── 5. Onboarding steps 2-7 (admin — may redirect away) ───
{
  const { ctx, p } = await mkCtx(browser);
  await p.goto(`${BASE}/onboarding`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(1500);
  const step1Text = await snap(p, 'onboarding-step1-i');
  console.log('onboarding step1 url:', p.url(), '| redirected:', !p.url().includes('/onboarding'));

  if (p.url().includes('/onboarding')) {
    // Try advancing through steps
    for (let step = 2; step <= 7; step++) {
      const nextClicked = await jsClickByText(p, 'NEXT', 'CONTINUE', 'SAVE & CONTINUE', 'SAVE AND CONTINUE');
      await p.waitForTimeout(1500);
      await p.waitForLoadState('networkidle').catch(() => {});
      await snap(p, `onboarding-step${step}-ADM-Q-016`);
      if (!p.url().includes('/onboarding')) break;
    }
  } else {
    save('onboarding-admin-note', { note: 'Admin not on /onboarding after goto — already completed onboarding or redirected', url: p.url() });
  }
  await ctx.close();
}

// ─── 6. Training module + path seed, then viewer pages + detail panel ───
{
  const { ctx, p } = await mkCtx(browser);
  await p.goto(`${BASE}/admin/training`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(800);
  await snap(p, 'training-admin-i');

  // Try NEW MODULE via testId or text
  const modBtnClicked = await jsClick(p, '[data-testid="module-new-btn"]') ||
    await jsClickByText(p, 'NEW MODULE', 'ADD MODULE');
  console.log('NEW MODULE clicked:', modBtnClicked);
  await p.waitForTimeout(800);
  const modDc = await getDlg(p);
  if (modDc) {
    save('training-new-module-dialog-i', { url: p.url(), dialogContent: modDc });
    await p.fill('input[formcontrolname="title"]', 'SweepModI').catch(() => {});
    await p.fill('input[formcontrolname="slug"]', 'sweep-mod-i').catch(() => {});
    await p.fill('textarea[formcontrolname="summary"]', 'Sweep I module').catch(() => {});
    await p.waitForTimeout(300);
    const saved = await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('mat-dialog-container button, [role="dialog"] button'));
      const btn = btns.find(b => b.innerText.trim().toUpperCase().match(/CREATE MODULE|CREATE/));
      if (btn) { btn.click(); return btn.innerText.trim(); }
      return null;
    });
    console.log('create module btn:', saved);
    await p.waitForSelector('mat-dialog-container', { state: 'detached', timeout: 8000 }).catch(() => {});
    await clearOverlay(p);
    await p.waitForTimeout(1000);
  }
  await snap(p, 'training-after-module-seed-i');

  // ADM-Q-022: click a row to see detail
  const rowEls = await p.$$('mat-row, tr[mat-row], [class*="module-row"]');
  console.log('module rows:', rowEls.length);
  if (rowEls.length > 0) {
    await rowEls[0].click({ timeout: 5000 }).catch(e => console.log('row click err:', e.message?.slice(0, 50)));
    await p.waitForTimeout(1200);
    const dlgDc = await getDlg(p);
    if (dlgDc) {
      save('training-detail-dialog-ADM-Q-022', { url: p.url(), dialogContent: dlgDc });
    } else {
      await snap(p, 'training-detail-panel-ADM-Q-022');
    }
    if (dlgDc) { await p.keyboard.press('Escape'); await clearOverlay(p); }
  }

  // Navigate to training viewer
  await p.goto(`${BASE}/training/modules`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(1000);

  // Click ALL MODULES tab via JS
  await p.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all) {
      const t = el.childElementCount === 0 && el.textContent?.trim().toUpperCase();
      if (t === 'ALL MODULES') { el.click(); el.parentElement?.click(); return; }
    }
  });
  await p.waitForTimeout(800);
  await snap(p, 'training-viewer-all-modules-i');

  const modHrefs = await p.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/training/module/"]')).map(a => a.href)
  );
  console.log('mod hrefs:', modHrefs.slice(0, 3));

  if (modHrefs.length > 0) {
    await p.goto(modHrefs[0]);
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(1500);
    await snap(p, 'training-module-viewer-ADM-Q-018');
  } else {
    await p.goto(`${BASE}/training/module/sweep-mod-i`);
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(1500);
    await snap(p, 'training-module-direct-ADM-Q-018');
  }

  // Training PATH seed
  await p.goto(`${BASE}/admin/training`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(500);
  // Click PATHS tab
  await p.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all) {
      if (el.childElementCount === 0 && el.textContent?.trim().toUpperCase() === 'PATHS') {
        el.click(); el.parentElement?.click(); return;
      }
    }
  });
  await p.waitForTimeout(800);

  const pathBtnClicked = await jsClickByText(p, 'NEW PATH', 'ADD PATH', 'NEW LEARNING PATH');
  console.log('NEW PATH for seed:', pathBtnClicked);
  await p.waitForTimeout(800);
  const pathDc = await getDlg(p);
  if (pathDc) {
    save('training-new-path-dialog-i', { url: p.url(), dialogContent: pathDc });
    await p.fill('input[formcontrolname="name"], input[formcontrolname="title"]', 'SweepPathI').catch(() => {});
    await p.fill('textarea[formcontrolname="description"]', 'Sweep I path').catch(() => {});
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('mat-dialog-container button, [role="dialog"] button'));
      const btn = btns.find(b => b.innerText.trim().toUpperCase().match(/CREATE PATH|CREATE/));
      if (btn) { btn.click(); return btn.innerText.trim(); }
    });
    await p.waitForSelector('mat-dialog-container', { state: 'detached', timeout: 8000 }).catch(() => {});
    await clearOverlay(p);
    await p.waitForTimeout(1000);
  }

  // Navigate to paths viewer
  await p.goto(`${BASE}/training/modules`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(800);
  // Click LEARNING PATHS tab
  await p.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all) {
      const t = el.childElementCount === 0 && el.textContent?.trim().toUpperCase();
      if (t === 'LEARNING PATHS') { el.click(); el.parentElement?.click(); return; }
    }
  });
  await p.waitForTimeout(800);
  await snap(p, 'training-viewer-paths-i');

  const pathHrefs = await p.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/training/path/"]')).map(a => a.href)
  );
  console.log('path hrefs:', pathHrefs.slice(0, 3));

  if (pathHrefs.length > 0) {
    await p.goto(pathHrefs[0]);
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(1500);
    await snap(p, 'training-path-viewer-ADM-Q-019');
  } else {
    await p.goto(`${BASE}/training/path/sweep-path-i`);
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(1500);
    await snap(p, 'training-path-direct-ADM-Q-019');
  }

  await ctx.close();
}

// ─── 7. MFA + CompleteI9 + SetupIntegrations + OAuth callback ───
{
  const { ctx, p } = await mkCtx(browser);

  // MFA security page
  await p.goto(`${BASE}/account/security`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(800);
  const secText = await snap(p, 'account-security-i');
  const secBtns = await p.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => ({ txt: b.innerText.trim(), testid: b.getAttribute('data-testid') || '' })).filter(b => b.txt)
  );
  console.log('security buttons:', JSON.stringify(secBtns));

  // If MFA is enabled, look for VIEW RECOVERY CODES
  const mfaEnabled = secText.includes('DISABLE') || secText.includes('VIEW RECOVERY') || secText.includes('REGENERATE');
  if (mfaEnabled) {
    const rcClicked = await jsClickByText(p, 'VIEW RECOVERY', 'RECOVERY CODES', 'REGENERATE CODES');
    if (rcClicked) {
      await p.waitForTimeout(800);
      const dc = await getDlg(p);
      save('mfa-recovery-dialog-ADM-Q-013', { url: p.url(), dialogContent: dc });
      await p.keyboard.press('Escape'); await clearOverlay(p);
    }
  } else {
    // MFA setup step 1 (QR)
    const enableBtn = await jsClickByText(p, 'ENABLE MFA', 'ENABLE', 'SETUP MFA', 'CONFIGURE MFA');
    if (enableBtn) {
      await p.waitForTimeout(800);
      const dc = await getDlg(p);
      save('mfa-setup-dialog-ADM-Q-013', { url: p.url(), dialogContent: dc, note: 'MFA not enabled; setup step 1 only; recovery codes require TOTP enrollment' });
      await p.keyboard.press('Escape'); await clearOverlay(p);
    } else {
      save('mfa-recovery-dialog-ADM-Q-013', { note: `MFA not enabled; no ENABLE button found; secBtns: ${secBtns.map(b => b.txt).join('|')}` });
    }
  }

  // CompleteI9 (ADM-Q-017) — check compliance page for any trigger
  await p.goto(`${BASE}/admin/compliance`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(800);
  await snap(p, 'compliance-i');
  const compBtns = await p.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => ({ txt: b.innerText.trim(), testid: b.getAttribute('data-testid') || '' })).filter(b => b.txt)
  );
  console.log('compliance buttons:', JSON.stringify(compBtns.slice(0, 15)));
  save('compliance-buttons-ADM-Q-017', { buttons: compBtns.slice(0, 15) });

  // SetupIntegrations (ADM-Q-020)
  await p.goto(`${BASE}/setup/integrations`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(1500);
  await snap(p, 'setup-integrations-ADM-Q-020');

  // OAuth callback (ADM-Q-015)
  await p.goto(`${BASE}/account/communications/oauth-callback`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(2500);
  await snap(p, 'oauth-callback-bare-ADM-Q-015');

  await p.goto(`${BASE}/account/communications/oauth-callback?code=TEST&state=TEST&provider=google`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(2000);
  await snap(p, 'oauth-callback-params-ADM-Q-015');

  await ctx.close();
}

await browser.close();
console.log('=== SWEEP I COMPLETE ===', OUT);
