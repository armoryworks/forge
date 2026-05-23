import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS = path.join(__dirname, 'screenshots');

console.log('Launching browser...');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('Navigating to login...');
await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle', timeout: 20000 });

const title = await page.title();
const url = page.url();
const html = await page.content();

console.log(`title: ${title}`);
console.log(`url: ${url}`);
console.log(`has email input: ${html.includes('type="email"') || html.includes("type='email'")}`);
console.log(`has password input: ${html.includes('type="password"') || html.includes("type='password'")}`);

await page.screenshot({ path: path.join(SCREENSHOTS, 'smoke-login.png') });
console.log('screenshot saved: smoke-login.png');

await browser.close();
console.log('DONE');
