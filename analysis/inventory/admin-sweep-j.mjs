// admin-sweep-j.mjs — Final remaining items
// ADM-Q-010: training PATHS tab (icon prefix "route\nPATHS"), NEW PATH dialog
// ADM-Q-009b: exchange rate dialog (create currency with full fields first)
// ADM-Q-018/019: get module/path IDs via API then navigate to viewer
// ADM-Q-016: fill address in step 2 to advance onboarding

import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import { writeFileSync } from 'fs';
import * as path from 'path';

const BASE = 'http://localhost:4200';
const ADMIN = { email: 'admin@forge.local', password: 'ForgeRun!2026' };
const OUT = path.resolve('admin-j-results.json');
const results = {};
const save = (k, d) => { results[k] = d; writeFileSync(OUT, JSON.stringify(results, null, 2)); console.log(`[${k}]`, String(d.dialogContent || d.text || d.note || JSON.stringify(d)).slice(0, 120).replace(/\n/g, '|')); };

async function mkCtx(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/login`);
  await p.fill('input[type="email"], input[formcontrolname="email"]', ADMIN.email);
  await p.fill('input[type="password"], input[formcontrolname="password"]', ADMIN.password);
  await p.click('button[type="submit"]');
  await p.waitForURL(u => !u.toString().includes('/login'), { timeout: 10000 });
  return { ctx, p };
}

async function getDlg(p) {
  return p.evaluate(() => document.querySelector('mat-dialog-container, [role="dialog"]')?.innerText.slice(0, 3000) ?? null).catch(() => null);
}

async function snap(p, key) {
  const url = p.url();
  const text = await p.evaluate(() => document.body.innerText.slice(0, 4000));
  save(key, { url, text });
  return text;
}

async function clearOverlay(p) {
  await p.evaluate(() => {
    document.querySelectorAll('.cdk-overlay-backdrop, .dialog-backdrop').forEach(el => el.remove());
    document.querySelectorAll('.cdk-overlay-pane').forEach(el => {
      if (!el.querySelector('mat-select-panel, .cdk-overlay-connected-position-bounding-box')) el.remove();
    });
  });
  await p.waitForTimeout(300);
}

async function clickButtonContaining(p, ...texts) {
  return p.evaluate((texts) => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const t of texts) {
      const btn = btns.find(b => b.innerText.trim().toUpperCase().includes(t.toUpperCase()));
      if (btn) { btn.click(); return btn.innerText.trim(); }
    }
    return null;
  }, texts);
}

const browser = await chromium.launch({ headless: true });

// ─── ADM-Q-010: Training PATHS tab + NEW PATH dialog ───
{
  const { ctx, p } = await mkCtx(browser);
  await p.goto(`${BASE}/admin/training`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(1000);

  // Dump all button texts to understand the custom tab structure
  const allBtns = await p.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => ({
      txt: b.innerText.trim(), testid: b.getAttribute('data-testid') || '', cls: b.className.slice(0, 50)
    })).filter(b => b.txt)
  );
  console.log('training all btns:', JSON.stringify(allBtns.slice(0, 20)));
  save('training-btns-debug-j', allBtns.slice(0, 20));

  // Click the PATHS tab button — button contains "PATHS" even with icon prefix
  const pathsTabClicked = await p.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    // Match "PATHS" anywhere in the inner text (handles "route\nPATHS")
    const btn = btns.find(b => b.innerText.trim().toUpperCase().includes('PATHS'));
    if (btn) { btn.click(); return btn.innerText.trim(); }
    return null;
  });
  console.log('PATHS tab clicked:', pathsTabClicked);
  await p.waitForTimeout(1200);
  await snap(p, 'training-paths-tab-j');

  // Now get buttons in paths tab
  const pathsBtns = await p.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => ({
      txt: b.innerText.trim(), testid: b.getAttribute('data-testid') || ''
    })).filter(b => b.txt)
  );
  console.log('paths tab btns:', JSON.stringify(pathsBtns.slice(0, 15)));

  // Click NEW PATH button (contains "PATH" in text)
  const newPathClicked = await p.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => {
      const t = b.innerText.trim().toUpperCase();
      return (t.includes('NEW PATH') || t.includes('ADD PATH') || t.includes('NEW LEARNING')) && !t.includes('PATHS');
    });
    if (btn) { btn.click(); return btn.innerText.trim(); }
    return null;
  });
  console.log('NEW PATH clicked:', newPathClicked);
  await p.waitForTimeout(1000);
  const pathDc = await getDlg(p);
  save('training-path-dialog-ADM-Q-010', { url: p.url(), dialogContent: pathDc, pathsTabClicked, newPathClicked });
  if (pathDc) {
    // Also try to seed a path for Q-019
    await p.fill('input[formcontrolname="name"], input[formcontrolname="title"]', 'SweepPathJ').catch(() => {});
    await p.fill('textarea[formcontrolname="description"]', 'Sweep J path').catch(() => {});
    const createClicked = await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('mat-dialog-container button, [role="dialog"] button'));
      const btn = btns.find(b => b.innerText.trim().toUpperCase().match(/CREATE PATH|CREATE|SAVE/));
      if (btn) { btn.click(); return btn.innerText.trim(); }
      return null;
    });
    console.log('create path btn:', createClicked);
    await p.waitForSelector('mat-dialog-container', { state: 'detached', timeout: 8000 }).catch(() => {});
    await clearOverlay(p);
    await p.waitForTimeout(1500);
  }
  await snap(p, 'training-after-path-seed-j');
  await ctx.close();
}

// ─── ADM-Q-009b: Currency create (all fields) then exchange rate dialog ───
{
  const { ctx, p } = await mkCtx(browser);
  await p.goto(`${BASE}/admin/currencies`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(500);

  // Check if currencies already exist from prior sweep
  const curPageText = await p.evaluate(() => document.body.innerText.slice(0, 1000));
  const hasExistingCurrencies = !curPageText.includes('No currencies configured');
  console.log('existing currencies?', hasExistingCurrencies);

  if (!hasExistingCurrencies) {
    // Open NEW CURRENCY dialog and fill ALL fields
    await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.trim().toUpperCase().includes('NEW CURRENCY'));
      if (btn) btn.click();
    });
    await p.waitForTimeout(800);
    const curDcBefore = await getDlg(p);
    save('currency-dialog-fields-j', { url: p.url(), dialogContent: curDcBefore });

    // Inspect actual form field names
    const fieldNames = await p.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('mat-dialog-container input, mat-dialog-container mat-select, mat-dialog-container mat-slide-toggle'));
      return inputs.map(el => ({
        tag: el.tagName,
        type: el.getAttribute('type') || '',
        formcontrolname: el.getAttribute('formcontrolname') || el.closest('[formcontrolname]')?.getAttribute('formcontrolname') || '',
        id: el.id,
        placeholder: el.getAttribute('placeholder') || el.getAttribute('aria-label') || ''
      }));
    });
    console.log('currency form fields:', JSON.stringify(fieldNames));
    save('currency-form-fields-debug', fieldNames);

    // Fill by formcontrolname
    for (const field of fieldNames) {
      if (field.formcontrolname === 'code') await p.fill(`input[formcontrolname="code"]`, 'USD').catch(() => {});
      else if (field.formcontrolname === 'symbol') await p.fill(`input[formcontrolname="symbol"]`, '$').catch(() => {});
      else if (field.formcontrolname === 'name') await p.fill(`input[formcontrolname="name"]`, 'US Dollar').catch(() => {});
      else if (field.formcontrolname === 'decimalPlaces' || field.formcontrolname === 'decimal_places') {
        await p.fill(`input[formcontrolname="${field.formcontrolname}"]`, '2').catch(() => {});
      } else if (field.formcontrolname === 'sortOrder' || field.formcontrolname === 'sort_order') {
        await p.fill(`input[formcontrolname="${field.formcontrolname}"]`, '1').catch(() => {});
      }
    }
    await p.waitForTimeout(300);

    // Check validation errors
    const errCount = await p.evaluate(() => {
      const warn = Array.from(document.querySelectorAll('mat-dialog-container button')).find(b => b.innerText.includes('warning'));
      return warn ? warn.innerText.trim() : 'no warn btn';
    });
    console.log('currency validation after fill:', errCount);

    // Save
    const saveClicked = await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('mat-dialog-container button'));
      const btn = btns.find(b => b.innerText.trim().toUpperCase().match(/^SAVE$|^CREATE$/));
      if (btn && !btn.disabled) { btn.click(); return btn.innerText.trim(); }
      return null;
    });
    console.log('currency save:', saveClicked);
    await p.waitForSelector('mat-dialog-container', { state: 'detached', timeout: 8000 }).catch(() => {});
    await clearOverlay(p);
    await p.waitForTimeout(1000);
    await p.waitForLoadState('networkidle');
  }

  await snap(p, 'currencies-state-j');

  // Click SET RATE via test ID and JS
  const rateClicked = await p.evaluate(() => {
    // Try testid first
    const byTestId = document.querySelector('[data-testid="rate-new-btn"]');
    if (byTestId) { byTestId.click(); return 'testid'; }
    // Fallback: button containing SET RATE
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.trim().toUpperCase().includes('SET RATE'));
    if (btn) { btn.click(); return btn.innerText.trim(); }
    return null;
  });
  console.log('SET RATE clicked:', rateClicked);
  await p.waitForTimeout(1000);
  const rateDc = await getDlg(p);
  console.log('exchange rate dialog:', rateDc?.slice(0, 200));
  save('exchange-rate-dialog-ADM-Q-009b', { url: p.url(), dialogContent: rateDc, rateClicked });
  if (rateDc) { await p.keyboard.press('Escape'); await clearOverlay(p); }
  await ctx.close();
}

// ─── ADM-Q-018/019: Look up module/path IDs via API, navigate to viewers ───
{
  const { ctx, p } = await mkCtx(browser);

  // Get JWT token by checking what's in localStorage
  const authToken = await p.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (k.toLowerCase().includes('token') || k.toLowerCase().includes('auth')) {
        return { key: k, val: localStorage[k]?.slice(0, 50) };
      }
    }
    return null;
  });
  console.log('auth token hint:', JSON.stringify(authToken));

  // Fetch training modules via API (use fetch with credentials)
  const modulesResp = await p.evaluate(async () => {
    const resp = await fetch('/api/v1/training/modules', { credentials: 'include' });
    if (!resp.ok) return { status: resp.status, error: await resp.text().catch(() => '') };
    return resp.json();
  });
  console.log('training modules API:', JSON.stringify(modulesResp).slice(0, 400));
  save('training-modules-api-j', modulesResp);

  // Fetch training paths via API
  const pathsResp = await p.evaluate(async () => {
    const resp = await fetch('/api/v1/training/paths', { credentials: 'include' });
    if (!resp.ok) return { status: resp.status, error: await resp.text().catch(() => '') };
    return resp.json();
  });
  console.log('training paths API:', JSON.stringify(pathsResp).slice(0, 400));
  save('training-paths-api-j', pathsResp);

  // Navigate to module viewer using first module ID
  let moduleId = modulesResp?.items?.[0]?.id || modulesResp?.[0]?.id || modulesResp?.data?.[0]?.id;
  let moduleSlug = modulesResp?.items?.[0]?.slug || modulesResp?.[0]?.slug;
  console.log('first module id:', moduleId, 'slug:', moduleSlug);

  if (moduleId) {
    await p.goto(`${BASE}/training/module/${moduleId}`);
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(1500);
    await snap(p, 'training-module-viewer-ADM-Q-018');
  } else if (moduleSlug) {
    await p.goto(`${BASE}/training/module/${moduleSlug}`);
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(1500);
    await snap(p, 'training-module-viewer-ADM-Q-018');
  } else {
    // Try training modules list page to find any links
    await p.goto(`${BASE}/training/modules`);
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(1000);
    const hrefs = await p.evaluate(() =>
      Array.from(document.querySelectorAll('a[href*="/training/module/"], a[href*="/training/path/"]')).map(a => ({ href: a.href, text: a.innerText.trim().slice(0, 40) }))
    );
    console.log('training hrefs on viewer:', JSON.stringify(hrefs.slice(0, 10)));
    save('training-module-viewer-ADM-Q-018', { url: p.url(), note: 'no module ID from API; hrefs on viewer page: ' + JSON.stringify(hrefs.slice(0, 5)) });
  }

  // Navigate to path viewer using first path ID
  let pathId = pathsResp?.items?.[0]?.id || pathsResp?.[0]?.id || pathsResp?.data?.[0]?.id;
  let pathSlug = pathsResp?.items?.[0]?.slug || pathsResp?.[0]?.slug;
  console.log('first path id:', pathId, 'slug:', pathSlug);

  if (pathId) {
    await p.goto(`${BASE}/training/path/${pathId}`);
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(1500);
    await snap(p, 'training-path-viewer-ADM-Q-019');
  } else if (pathSlug) {
    await p.goto(`${BASE}/training/path/${pathSlug}`);
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(1500);
    await snap(p, 'training-path-viewer-ADM-Q-019');
  } else {
    save('training-path-viewer-ADM-Q-019', { url: p.url(), note: 'no path ID from API; paths might not exist yet' });
  }

  await ctx.close();
}

// ─── ADM-Q-016: Onboarding steps 3-7 (fill address to advance past step 2) ───
{
  const { ctx, p } = await mkCtx(browser);
  await p.goto(`${BASE}/onboarding`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(1000);

  // Step 1: fill minimal personal info and advance
  await p.fill('input[formcontrolname="firstName"]', 'Test').catch(() => {});
  await p.fill('input[formcontrolname="lastName"]', 'Scout').catch(() => {});
  const step1Next = await clickButtonContaining(p, 'NEXT', 'CONTINUE');
  console.log('step1 next clicked:', step1Next);
  await p.waitForTimeout(1500);

  const step2Text = await p.evaluate(() => document.body.innerText.slice(0, 2000));
  save('onboarding-step2-fields-j', { url: p.url(), text: step2Text });
  console.log('step2 url:', p.url(), 'text snippet:', step2Text.slice(0, 200).replace(/\n/g, '|'));

  // Fill address (step 2)
  await p.fill('input[formcontrolname="address1"]', '123 Test St').catch(() => {});
  await p.fill('input[formcontrolname="street"], input[formcontrolname="streetAddress"]', '123 Test St').catch(() => {});
  await p.fill('input[formcontrolname="city"]', 'Springfield').catch(() => {});
  await p.fill('input[formcontrolname="postalCode"], input[formcontrolname="zip"], input[formcontrolname="zipCode"]', '62701').catch(() => {});

  // Select a state (IL)
  const stateSelect = await p.$('mat-select[formcontrolname="state"]');
  if (stateSelect) {
    await stateSelect.click();
    await p.waitForTimeout(500);
    const ilOption = await p.$('mat-option:has-text("Illinois")') || await p.$('mat-option:has-text("IL")');
    if (ilOption) await ilOption.click();
    await p.waitForTimeout(300);
  }
  await p.waitForTimeout(300);

  // Check validation
  const step2Errs = await p.evaluate(() => {
    const warn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('warning'));
    return warn ? warn.innerText.trim() : 'no warning';
  });
  console.log('step2 validation after fill:', step2Errs);

  // Advance through remaining steps
  for (let step = 3; step <= 7; step++) {
    const nextClicked = await clickButtonContaining(p, 'CONTINUE', 'NEXT', 'SAVE & CONTINUE');
    console.log(`step${step-1} next clicked:`, nextClicked);
    await p.waitForTimeout(1500);
    await p.waitForLoadState('networkidle').catch(() => {});
    const url = p.url();
    const text = await p.evaluate(() => document.body.innerText.slice(0, 3000));
    save(`onboarding-step${step}-filled-ADM-Q-016`, { url, text });
    console.log(`step${step} url:`, url, 'snippet:', text.slice(0, 150).replace(/\n/g, '|'));
    if (!url.includes('/onboarding')) {
      console.log('Left onboarding at step', step);
      break;
    }
  }

  await ctx.close();
}

// ─── ADM-Q-022: Training detail — check admin training with seeds + row edit buttons ───
{
  const { ctx, p } = await mkCtx(browser);
  await p.goto(`${BASE}/admin/training`);
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(1000);
  await snap(p, 'training-admin-j');

  const rows = await p.$$('mat-row');
  console.log('training mat-rows:', rows.length);

  if (rows.length > 0) {
    // Look for edit/detail buttons in the first row
    const rowBtnInfo = await rows[0].evaluate(row => ({
      btns: Array.from(row.querySelectorAll('button')).map(b => ({
        txt: b.innerText.trim(),
        testid: b.getAttribute('data-testid') || '',
        arialabel: b.getAttribute('aria-label') || ''
      }))
    }));
    console.log('row btn info:', JSON.stringify(rowBtnInfo));
    save('training-row-btn-debug-j', rowBtnInfo);

    // Click any edit/detail button in the row
    for (const btn of rowBtnInfo.btns) {
      if (btn.txt.toLowerCase().includes('edit') || btn.arialabel.toLowerCase().includes('edit') ||
          btn.testid.toLowerCase().includes('edit') || btn.testid.toLowerCase().includes('detail')) {
        await rows[0].click({ timeout: 5000 }).catch(() => {});
        await p.waitForTimeout(1200);
        const dc = await getDlg(p);
        if (dc) {
          save('training-detail-dialog-ADM-Q-022', { url: p.url(), dialogContent: dc });
        } else {
          await snap(p, 'training-after-row-click-j');
        }
        break;
      }
    }
    if (!results['training-detail-dialog-ADM-Q-022'] && !results['training-after-row-click-j']) {
      // Just click first row
      await rows[0].click({ timeout: 5000 }).catch(() => {});
      await p.waitForTimeout(1200);
      const dc = await getDlg(p);
      save('training-detail-ADM-Q-022', { url: p.url(), dialogContent: dc, note: dc ? 'dialog triggered' : 'no dialog after row click' });
    }
  } else {
    save('training-detail-ADM-Q-022', { url: p.url(), note: 'no mat-rows in admin/training — module creation may have failed' });
  }

  await ctx.close();
}

await browser.close();
console.log('=== SWEEP J COMPLETE ===', OUT);
