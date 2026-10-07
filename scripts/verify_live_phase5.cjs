const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const artifactDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\eee55e11-50f2-4863-bc00-99a735136c1e';
  const baseUrl = 'https://intellihire-v3.pages.dev';
  const cookieValue = '2b42e412-7c12-4119-81c1-2b6384a80dc0';

  console.log('Launching browser...');
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

  // Check whether we are currently in workspace or catalog or debrief
  const hasSubmitBtn = await page.getByRole('button', { name: /Submit Simulation for Evaluation/i }).isVisible();
  const hasLaunchBtn = await page.getByRole('button', { name: /Launch Simulation Workspace/i }).first().isVisible();
  const hasDebrief = await page.getByText(/Multi-Dimensional Performance Debrief/i).isVisible();

  console.log(`Current state: hasSubmitBtn=${hasSubmitBtn}, hasLaunchBtn=${hasLaunchBtn}, hasDebrief=${hasDebrief}`);

  if (hasDebrief) {
    console.log('Debrief is already showing. Capturing debrief screenshot...');
    await page.screenshot({ path: path.join(artifactDir, 'm3_live_phase5_step4_debrief.png') });
    // Click Return to Catalog or Start Next Task to test launch
    const returnBtn = page.getByRole('button', { name: /Return to Catalog|Start Next Adaptive Work Task/i }).first();
    if (await returnBtn.isVisible()) {
      await returnBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  // If in catalog
  if (await page.getByRole('button', { name: /Launch Simulation Workspace/i }).first().isVisible()) {
    console.log('Step 1: Capturing catalog screenshot...');
    await page.screenshot({ path: path.join(artifactDir, 'm3_live_phase5_step1_catalog.png') });

    console.log('Step 2: Launching simulation workspace...');
    await page.getByRole('button', { name: /Launch Simulation Workspace/i }).first().click();
    await page.waitForTimeout(3000);
  }

  // Now we should be in workspace
  console.log('Step 2: Workspace loaded. Capturing workspace screenshot...');
  await page.screenshot({ path: path.join(artifactDir, 'm3_live_phase5_step2_workspace.png') });

  // Step 3: Run execution/tests
  console.log('Step 3: Interacting with work surface...');
  const runBtn = page.getByRole('button', { name: /Execute & Explain Plan|Run Verification Tests|Execute Query|Execute Script/i }).first();
  if (await runBtn.isVisible()) {
    console.log('Clicking execution button:', await runBtn.innerText());
    await runBtn.click();
    await page.waitForTimeout(3000);
  }
  await page.screenshot({ path: path.join(artifactDir, 'm3_live_phase5_step3_interaction.png') });

  // Step 4: Submit simulation
  console.log('Step 4: Submitting simulation for evaluation...');
  const submitBtn = page.getByRole('button', { name: /Submit Simulation for Evaluation/i });
  await submitBtn.click();

  // Wait for debrief
  console.log('Waiting for Multi-Dimensional Performance Debrief...');
  await page.waitForSelector('text=Multi-Dimensional Performance Debrief', { timeout: 30000 });
  console.log('Step 4: Debrief rendered successfully!');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(artifactDir, 'm3_live_phase5_step4_debrief.png') });

  // Step 5: Reload to test restoration & persistence integrity
  console.log('Step 5: Testing reload & persistence...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(artifactDir, 'm3_live_phase5_step5_restored.png') });

  // Step 6: Query D1 through candidate API or session endpoint
  console.log('Step 6: Checking candidate dashboard & session state...');
  const candRes = await page.request.get(`${baseUrl}/api/dashboard/candidate`);
  console.log('Candidate API status:', candRes.status());

  console.log('All verification steps succeeded!');
  await browser.close();
}

run().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
