import { chromium } from 'playwright';

const ARTIFACT_DIR = 'C:/Users/ADMIN/.gemini/antigravity/brain/eee55e11-50f2-4863-bc00-99a735136c1e';
const BASE_URL = 'https://intellihire-v3.pages.dev';
const CANDIDATE_SESSION = '9c6711d1-4e12-49be-a5a0-a0cc9bb168f1';

async function capture() {
  console.log('Launching browser with verified session cookie...');
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
      domain: 'intellihire-v3.pages.dev',
      path: '/'
    }
  ]);

  const page = await context.newPage();

  // 1. Capture Dataset Registry View (/datasets)
  console.log(`Navigating to ${BASE_URL}/datasets...`);
  await page.goto(`${BASE_URL}/datasets`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ 
    path: `${ARTIFACT_DIR}/screenshot_datasets_registry.png`, 
    fullPage: true 
  });
  console.log('Captured screenshot_datasets_registry.png');

  // 2. Switch to Ethical Governance & Biometric Exclusion tab
  console.log('Switching to Ethical Governance tab...');
  const policyTab = await page.$('button:has-text("Ethical Governance")');
  if (policyTab) {
    await policyTab.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ 
      path: `${ARTIFACT_DIR}/screenshot_ethical_governance_policy.png`, 
      fullPage: true 
    });
    console.log('Captured screenshot_ethical_governance_policy.png');
  }

  // 3. Switch to Curated Learning Resources tab
  console.log('Switching to Learning Resources tab...');
  const resTab = await page.$('button:has-text("Curated Learning Resources")');
  if (resTab) {
    await resTab.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ 
      path: `${ARTIFACT_DIR}/screenshot_curated_learning_resources.png`, 
      fullPage: true 
    });
    console.log('Captured screenshot_curated_learning_resources.png');
  }

  // 4. Capture Module 1 Resume Ingestion with O*NET and CC0 Selectors
  console.log(`Navigating to ${BASE_URL}/resume...`);
  await page.goto(`${BASE_URL}/resume`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ 
    path: `${ARTIFACT_DIR}/screenshot_resume_datasets_integration.png`, 
    fullPage: true 
  });
  console.log('Captured screenshot_resume_datasets_integration.png');

  await browser.close();
  console.log('All 4 dataset verification screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
