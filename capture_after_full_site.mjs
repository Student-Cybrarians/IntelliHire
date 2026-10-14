import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\eee55e11-50f2-4863-bc00-99a735136c1e';
const BASE_URL = 'https://intellihire-v3.pages.dev';
const CANDIDATE_SESSION = '9c6711d1-4e12-49be-a5a0-a0cc9bb168f1';

async function run() {
  console.log('Capturing Post-Transformation Screenshots across all routes...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 }
  });

  await context.addCookies([
    {
      name: 'intellihire_session',
      value: CANDIDATE_SESSION,
      domain: '10172d59.intellihire-v3.pages.dev',
      path: '/'
    },
    {
      name: 'intellihire_session',
      value: CANDIDATE_SESSION,
      domain: 'intellihire-v3.pages.dev',
      path: '/'
    }
  ]);

  const page = await context.newPage();

  const routes = [
    { name: 'prod_after_landing', url: `${BASE_URL}/` },
    { name: 'prod_after_dashboard', url: `${BASE_URL}/dashboard` },
    { name: 'prod_after_resume', url: `${BASE_URL}/resume` },
    { name: 'prod_after_assess', url: `${BASE_URL}/assess` },
    { name: 'prod_after_prep', url: `${BASE_URL}/prep` },
    { name: 'prod_after_simulation', url: `${BASE_URL}/simulation` },
    { name: 'prod_after_interviews', url: `${BASE_URL}/interviews` },
    { name: 'prod_after_results', url: `${BASE_URL}/results` },
    { name: 'prod_after_candidate', url: `${BASE_URL}/candidate` }
  ];

  for (const r of routes) {
    try {
      console.log(`Navigating to ${r.url}...`);
      await page.goto(r.url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(2000);
      const outPath = path.join(ARTIFACT_DIR, `${r.name}.png`);
      await page.screenshot({ path: outPath, fullPage: true });
      console.log(`Saved ${outPath}`);
    } catch (e) {
      console.error(`Error capturing ${r.name}:`, e.message);
    }
  }

  // Also capture mobile view of dashboard and resume to verify responsive drawer
  try {
    console.log('Capturing mobile view of dashboard...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const mobileOut = path.join(ARTIFACT_DIR, 'prod_after_mobile_dashboard.png');
    await page.screenshot({ path: mobileOut, fullPage: true });
    console.log(`Saved ${mobileOut}`);
  } catch (e) {
    console.error('Error capturing mobile dashboard:', e.message);
  }

  await browser.close();
  console.log('Post-transformation verification capture complete!');
}

run();
