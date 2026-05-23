// Cycle 5b: SSO callback error-param states — targeted capture
import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;

const BASE = 'http://localhost:4200';
const SS = './screenshots';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 900 });

async function ss(page, name) {
  const path = `${SS}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  [ss] ${name}.png — URL: ${page.url()}`);
}

// Pre-load login page so Angular is warm
await page.goto(`${BASE}/login`);
await page.waitForSelector('input[type="email"]', { timeout: 10000 });
await ss(page, 'access-sso-c5b-baseline-login');

// Test 1: ?error=sso_failed — snackbar + redirect
console.log('\n--- ?error=sso_failed ---');
await page.evaluate(() => {
  window.location.href = '/sso/callback?error=sso_failed';
});
await page.waitForTimeout(300);
await ss(page, 'access-sso-c5b-error-sso-failed-300ms');
const ssoFailedHtml = await page.content();
const hasSnackbar = ssoFailedHtml.includes('mat-snack-bar') || ssoFailedHtml.includes('snack-bar') || ssoFailedHtml.includes('snackbar');
const hasSsoCallback = ssoFailedHtml.includes('sso-callback');
console.log('  snackbar in DOM:', hasSnackbar);
console.log('  sso-callback component in DOM:', hasSsoCallback);
console.log('  URL:', page.url());

await page.waitForTimeout(1000);
await ss(page, 'access-sso-c5b-error-sso-failed-1300ms');

// Test 2: ?error=no_account
console.log('\n--- ?error=no_account ---');
await page.goto(`${BASE}/login`);
await page.waitForTimeout(500);
await page.evaluate(() => {
  window.location.href = '/sso/callback?error=no_account';
});
await page.waitForTimeout(300);
await ss(page, 'access-sso-c5b-error-no-account-300ms');
const noAccHtml = await page.content();
const hasSnackbar2 = noAccHtml.includes('mat-snack-bar') || noAccHtml.includes('snack-bar');
const hasSsoCallback2 = noAccHtml.includes('sso-callback');
console.log('  snackbar in DOM:', hasSnackbar2);
console.log('  sso-callback component in DOM:', hasSsoCallback2);
console.log('  URL:', page.url());

// Test 3: ?sso_token=FAKE_TOKEN (handleSsoToken called, navigate to app)
console.log('\n--- ?sso_token=FAKE_TOKEN ---');
await page.goto(`${BASE}/login`);
await page.waitForTimeout(500);
await page.evaluate(() => {
  window.location.href = '/sso/callback?sso_token=FAKE_TOKEN_XYZ';
});
await page.waitForTimeout(500);
await ss(page, 'access-sso-c5b-fake-token-500ms');
console.log('  URL:', page.url());

await browser.close();
console.log('\nSSO c5b complete.');
