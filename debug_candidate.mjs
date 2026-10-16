import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\eee55e11-50f2-4863-bc00-99a735136c1e';
const BASE_URL = 'https://intellihire-v3.pages.dev';
const CANDIDATE_SESSION = '9c6711d1-4e12-49be-a5a0-a0cc9bb168f1';

async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--no-sandbox']
  });

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([{
    name: 'intellihire_session',
    value: CANDIDATE_SESSION,
    domain: 'intellihire-v3.pages.dev',
    path: '/'
  }]);

  const page = await ctx.newPage();
  await page.goto(`${BASE_URL}/interviews`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const debugPath = path.join(ARTIFACT_DIR, 'debug_candidate_page.png');
  await page.screenshot({ path: debugPath, fullPage: true });
  console.log('Saved debug screenshot:', debugPath);

  // Print all buttons and visible text headers
  const buttons = await page.$$eval('button', btns => btns.map(b => b.innerText.trim()).filter(Boolean));
  console.log('VISIBLE BUTTONS:', buttons);

  await browser.close();
}

run().catch(console.error);
