/**
 * Role sweep — cycle 2
 * Checks each role against all master-data routes, captures access vs. blocked.
 */
const { chromium } = require('E:/dev/forge/forge-ui/node_modules/playwright-core');
const fs = require('fs');

const BASE_URL = 'http://localhost:4200';
const SHOT_DIR = 'E:/dev/forge/analysis/inventory/screenshots';
const LOG = [];

async function login(ctx, page, email, pw = 'ForgeRun!2026') {
  // Clear all storage and cookies to force fresh login
  await ctx.clearCookies();
  try { await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch(e) {} }); } catch(e) {}
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  // Wait for email input to be visible
  await page.locator('input[type="email"]').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(pw);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(2500);
  if (page.url().includes('/account/profile') || page.url().includes('/profile')) {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
  }
}

const ROUTES = [
  '/leads', '/leads/intake', '/leads/queue', '/leads/campaigns', '/leads/accounts',
  '/customers', '/customers/contacts', '/customers/portal-access', '/customers/segments',
  '/customers/2/overview', '/customers/2/contacts', '/customers/2/activity',
  '/vendors',
  '/parts', '/parts/3',
  '/inventory/stock', '/inventory/uom',
  '/lots',
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const roles = [
    ['manager@forge.local', 'manager'],
    ['officemanager@forge.local', 'officemanager'],
    ['pm@forge.local', 'pm'],
    ['engineer@forge.local', 'engineer'],
    ['worker@forge.local', 'worker'],
  ];

  for (const [email, label] of roles) {
    console.log(`\n=== ${label} ===`);
    await login(ctx, page, email);
    const loginUrl = page.url();
    console.log(`  Landed: ${loginUrl}`);

    for (const route of ROUTES) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const finalUrl = page.url();
      const body = (await page.evaluate(() => document.body.innerText)).slice(0, 200);
      const blocked = finalUrl.includes('/403') || finalUrl.includes('/login') ||
                      (finalUrl === `${BASE_URL}/` && route !== '/') ||
                      body.toLowerCase().includes('not authorized') ||
                      body.toLowerCase().includes('access denied') ||
                      body.toLowerCase().includes('forbidden');
      // Detect redirect away from requested route
      const routeInUrl = finalUrl.includes(route.split('/')[1]);
      const redirected = !routeInUrl && !blocked;
      const entry = { role: label, route, finalUrl, blocked, redirected, body: body.slice(0, 80) };
      LOG.push(entry);
      if (blocked) {
        console.log(`  BLOCKED: ${route} → ${finalUrl}`);
      } else {
        // Capture screenshot for key routes
        if (['/leads', '/customers', '/vendors', '/parts', '/inventory/stock', '/lots'].includes(route)) {
          const file = `${SHOT_DIR}/role-${label}${route.replace(/\//g, '-')}.png`;
          await page.screenshot({ path: file });
          console.log(`  OK: ${route} (screenshot)`);
        } else {
          console.log(`  OK: ${route}`);
        }
      }
    }
  }

  await browser.close();
  fs.writeFileSync('E:/dev/forge/analysis/inventory/role-sweep-log.json', JSON.stringify(LOG, null, 2));
  console.log(`\nDone. ${LOG.length} entries → role-sweep-log.json`);
}

main().catch(e => { console.error(e); process.exit(1); });
