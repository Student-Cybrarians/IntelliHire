import { createRequire } from 'module';
const require = createRequire('file:///C:/Users/ADMIN/.gemini/antigravity/scratch/IntelliHire/package.json');
const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  await context.addCookies([{
    name: 'intellihire_session',
    value: '9c6711d1-4e12-49be-a5a0-a0cc9bb168f1',
    domain: 'intellihire-v3.pages.dev',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax'
  }]);
  const page = await context.newPage();
  await page.goto('https://intellihire-v3.pages.dev/learning', { waitUntil: 'networkidle' });
  await page.click('button:has-text("Generate Personalized Pathway")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/ADMIN/.gemini/antigravity/brain/eee55e11-50f2-4863-bc00-99a735136c1e/m02_phase3_prod_multidomain_tracks_modal.png' });
  console.log('Modal captured successfully');
  await browser.close();
}

run().catch(console.error);
