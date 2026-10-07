const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/ADMIN/.gemini/antigravity/brain/eee55e11-50f2-4863-bc00-99a735136c1e';
const BASE_URL = 'https://intellihire-v3.pages.dev';
const SESSION_COOKIE = '2b42e412-7c12-4119-81c1-2b6384a80dc0';

async function verifyLivePhase7() {
  console.log('--- Starting IntelliHire M03 Phase 7 Live Verification ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  await context.addCookies([
    {
      name: 'intellihire_session',
      value: SESSION_COOKIE,
      domain: 'intellihire-v3.pages.dev',
      path: '/'
    }
  ]);

  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to', `${BASE_URL}/simulation`);
  await page.goto(`${BASE_URL}/simulation`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check state: already in debrief, in workspace, or in catalog
  let hasDebrief = await page.getByText(/Pedagogical Debrief & Candidate Teaching Engine/i).isVisible().catch(() => false);
  let hasWorkspace = await page.getByRole('button', { name: /Submit Simulation for Evaluation/i }).isVisible().catch(() => false);

  console.log(`Initial state: hasDebrief=${hasDebrief}, hasWorkspace=${hasWorkspace}`);

  if (!hasDebrief && !hasWorkspace) {
    console.log('In catalog. Launching simulation workspace...');
    const launchBtn = page.getByRole('button', { name: /Launch Simulation Workspace/i }).first();
    await launchBtn.click();
    await page.waitForTimeout(2500);
    hasWorkspace = await page.getByRole('button', { name: /Submit Simulation for Evaluation/i }).isVisible();
  }

  if (hasWorkspace) {
    console.log('Submitting simulation for evaluation...');
    const submitBtn = page.getByRole('button', { name: /Submit Simulation for Evaluation/i });
    await submitBtn.click();
    console.log('Waiting for debrief and teaching engine...');
    await page.waitForSelector('text=Pedagogical Debrief & Candidate Teaching Engine', { timeout: 25000 });
    hasDebrief = true;
    await page.waitForTimeout(1500);
  }

  console.log('Confirmed Debrief & Teaching Engine is active:', hasDebrief);

  // Step 1: Capture Breakdown Tab
  const shot1 = path.join(ARTIFACT_DIR, 'm3_live_phase7_step1_debrief_breakdown.png');
  await page.screenshot({ path: shot1, fullPage: true });
  console.log('Saved Step 1 (Breakdown) screenshot:', shot1);

  // Step 2: Click "Why & How Chains"
  console.log('Switching to Why & How Chains tab...');
  const chainsBtn = page.getByRole('button', { name: /Why & How Chains/i });
  await chainsBtn.click();
  await page.waitForTimeout(1000);
  const shot2 = path.join(ARTIFACT_DIR, 'm3_live_phase7_step2_why_how_chains.png');
  await page.screenshot({ path: shot2, fullPage: true });
  console.log('Saved Step 2 (Chains) screenshot:', shot2);

  // Step 3: Click "Misconceptions & Drill" and interact with drill
  console.log('Switching to Misconceptions & Drill tab...');
  const miscBtn = page.getByRole('button', { name: /Misconceptions & Drill/i });
  await miscBtn.click();
  await page.waitForTimeout(1000);

  console.log('Clicking concept check option...');
  const optionBtn = page.locator('button:has-text("Scan 1")').first();
  if (await optionBtn.isVisible()) {
    await optionBtn.click();
    await page.waitForTimeout(1000);
  }

  const shot3 = path.join(ARTIFACT_DIR, 'm3_live_phase7_step3_interactive_drill.png');
  await page.screenshot({ path: shot3, fullPage: true });
  console.log('Saved Step 3 (Drill) screenshot:', shot3);

  await browser.close();
  console.log('--- Phase 7 Live Verification Complete Successfully ---');
}

verifyLivePhase7().catch(err => {
  console.error('Phase 7 Verification Error:', err);
  process.exit(1);
});
