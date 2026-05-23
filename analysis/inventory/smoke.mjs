import pkg from '../../forge-ui/node_modules/playwright-core/index.js';
const { chromium } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle', timeout: 20000 });
const title = await page.title();
const h1 = await page.$eval('h1, .login__title, [class*="title"]', el => el.textContent.trim()).catch(() => 'no-h1');
await page.screenshot({ path: path.join(__dirname, 'screenshots', 'smoke-login.png') });
console.log('SMOKE OK title=' + title + ' h1=' + h1);
await browser.close();
