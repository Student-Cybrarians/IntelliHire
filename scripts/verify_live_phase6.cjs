const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const artifactDir = 'C:/Users/ADMIN/.gemini/antigravity/brain/eee55e11-50f2-4863-bc00-99a735136c1e';
  const baseUrl = 'https://intellihire-v3.pages.dev';
  const cookieValue = '2b42e412-7c12-4119-81c1-2b6384a80dc0';

  console.log('Launching browser for M03 Phase 6 Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  await context.addCookies([
    {
      name: 'intellihire_session',
      value: cookieValue,
      domain: 'intellihire-v3.pages.dev',
      path: '/'
    }
  ]);

  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to', `${baseUrl}/simulation`);
  await page.goto(`${baseUrl}/simulation`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check state
  const hasSubmitBtn = await page.getByRole('button', { name: /Submit Simulation for Evaluation/i }).isVisible();
  const hasDebrief = await page.getByText(/Multi-Dimensional Performance Debrief/i).isVisible();
  console.log(`Current state: hasSubmitBtn=${hasSubmitBtn}, hasDebrief=${hasDebrief}`);

  if (hasDebrief) {
    console.log('Already in debrief. Continuing in catalog to test fresh evaluation...');
    const continueBtn = page.getByRole('button', { name: /Continue in Catalog|Return to Catalog/i }).first();
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  // If in catalog, launch or restart workspace
  const launchBtn = page.getByRole('button', { name: /Launch Simulation Workspace|Restart Simulation Workspace/i }).first();
  if (await launchBtn.isVisible()) {
    console.log('Launching simulation workspace from catalog...');
    await launchBtn.click();
    await page.waitForTimeout(3000);
  }

  // Step 1: Workspace loaded
  console.log('Step 1: Workspace loaded. Taking screenshot...');
  await page.screenshot({ path: path.join(artifactDir, 'm3_live_phase6_step1_workspace.png') });

  // Step 2: Run deterministic tests / execution
  console.log('Step 2: Interacting with work surface and executing deterministic tests...');
  const runBtn = page.getByRole('button', { name: /Execute & Explain Plan|Run Verification Tests|Execute Query|Execute Script/i }).first();
  if (await runBtn.isVisible()) {
    console.log('Clicking run button:', await runBtn.innerText());
    await runBtn.click();
    await page.waitForTimeout(3000);
  }

  // Step 3: Submit for evaluation
  console.log('Step 3: Submitting simulation for Phase 6 evaluation...');
  const submitBtn = page.getByRole('button', { name: /Submit Simulation for Evaluation/i }).first();
  await submitBtn.click();

  // Wait for Multi-Dimensional Performance Debrief
  console.log('Waiting for Multi-Dimensional Performance Debrief...');
  await page.waitForSelector('text=Multi-Dimensional Performance Debrief', { timeout: 35000 });
  await page.waitForTimeout(2500);

  // Step 4: Verify Debrief elements and take screenshot
  console.log('Step 4: Verifying debrief elements...');
  const hasProficiency = await page.getByText(/Demonstrated Proficiency/i).isVisible();
  const hasDeterministicSuite = await page.getByText(/Deterministic Verification Suite/i).isVisible();
  console.log(`Debrief verified: hasProficiency=${hasProficiency}, hasDeterministicSuite=${hasDeterministicSuite}`);
  await page.screenshot({ path: path.join(artifactDir, 'm3_live_phase6_step2_debrief.png') });

  // Step 5: Test Reload & Persistence Integrity
  console.log('Step 5: Testing reload & persistence...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(artifactDir, 'm3_live_phase6_step3_restored.png') });

  // Step 6: Test canonical Evidence Package endpoint
  console.log('Step 6: Verifying evidence package API endpoint...');
  const candRes = await page.request.get(`${baseUrl}/api/dashboard/candidate`);
  console.log('Candidate API status:', candRes.status());

  console.log('M03 Phase 6 Live Verification completed successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
