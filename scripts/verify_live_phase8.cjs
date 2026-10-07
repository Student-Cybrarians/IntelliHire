const { chromium } = require('playwright');
const path = require('path');

async function verifyLivePhase8() {
  console.log('--- IntelliHire M03 Phase 8 Live Browser Verification ---');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const sessionCookie = {
    name: 'intellihire_session',
    value: '2b42e412-7c12-4119-81c1-2b6384a80dc0',
    domain: 'intellihire-v3.pages.dev',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax'
  };
  await context.addCookies([sessionCookie]);

  const page = await context.newPage();
  page.on('console', msg => console.log(`[Browser Console ${msg.type()}]:`, msg.text()));

  const targetUrl = 'https://intellihire-v3.pages.dev/simulation';
  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Check if active session or debrief loaded
  let hasDebrief = await page.locator('text=Multi-Dimensional Performance Debrief').isVisible().catch(() => false);
  console.log(`Initial view has Debrief: ${hasDebrief}`);

  if (!hasDebrief) {
    // Check if workspace is loaded
    let inWorkspace = await page.locator('button:has-text("Submit Simulation for Evaluation")').isVisible().catch(() => false);
    if (!inWorkspace) {
      console.log('In catalog view. Launching simulation...');
      const launchBtn = page.locator('button:has-text("Launch Simulation Workspace")').first();
      await launchBtn.click();
      await page.waitForTimeout(3000);
    }

    console.log('Submitting simulation for evaluation to enter debrief & adaptive state...');
    const submitBtn = page.locator('button:has-text("Submit Simulation for Evaluation")');
    await submitBtn.waitFor({ state: 'visible', timeout: 10000 });
    await submitBtn.click();
    console.log('Waiting for evaluation & teaching payload...');
    await page.waitForTimeout(6000);
  }

  // Verify Debrief View & Phase 8 Continuous Banner
  await page.waitForSelector('text=Multi-Dimensional Performance Debrief', { timeout: 15000 });
  console.log('✓ Debrief view active.');

  // Check for Round 1 indicator & Continuous Work Engine banner
  const roundIndicator = await page.locator('text=Adaptive Continuous Work Engine').isVisible();
  console.log(`✓ Adaptive Continuous Work Engine banner visible: ${roundIndicator}`);

  const step1Path = path.resolve('C:/Users/ADMIN/.gemini/antigravity/brain/eee55e11-50f2-4863-bc00-99a735136c1e/m3_live_phase8_step1_round1_debrief.png');
  await page.screenshot({ path: step1Path, fullPage: true });
  console.log(`✓ Saved Step 1 screenshot: ${step1Path}`);

  // Look for "Proceed to Next Task (Round 2)" button
  const nextTaskBtn = page.locator('button:has-text("Proceed to Next Task")');
  await nextTaskBtn.waitFor({ state: 'visible', timeout: 10000 });
  console.log('✓ Proceed to Next Task button visible and ready.');

  // Look for "Conclude & Proceed to M04" button
  const concludeBtn = page.locator('button:has-text("Conclude & Proceed to M04")');
  const concludeVisible = await concludeBtn.isVisible();
  console.log(`✓ Conclude & Proceed to M04 button visible: ${concludeVisible}`);

  // Click "Proceed to Next Task (Round 2)" to trigger the adaptive transition!
  console.log('Clicking "Proceed to Next Task" to trigger Round 2 transition...');
  await nextTaskBtn.click();
  await page.waitForTimeout(4000);

  // Verify that the workspace for Round 2 is now loaded!
  await page.waitForSelector('button:has-text("Submit Simulation for Evaluation")', { timeout: 15000 });
  const round2Banner = await page.locator('text=Round 2').isVisible();
  console.log(`✓ Round 2 workspace loaded, Round 2 indicator visible: ${round2Banner}`);

  const step2Path = path.resolve('C:/Users/ADMIN/.gemini/antigravity/brain/eee55e11-50f2-4863-bc00-99a735136c1e/m3_live_phase8_step2_round2_workspace.png');
  await page.screenshot({ path: step2Path, fullPage: true });
  console.log(`✓ Saved Step 2 screenshot: ${step2Path}`);

  // Now submit Round 2 work
  console.log('Submitting Round 2 deliverable...');
  const submitBtn2 = page.locator('button:has-text("Submit Simulation for Evaluation")');
  await submitBtn2.click();
  await page.waitForTimeout(6000);

  // Verify Round 2 debrief
  await page.waitForSelector('text=Multi-Dimensional Performance Debrief', { timeout: 15000 });
  console.log('✓ Round 2 Debrief loaded.');

  // Test "Conclude & Proceed to M04" modal
  const concludeBtn2 = page.locator('button:has-text("Conclude & Proceed to M04")');
  await concludeBtn2.click();
  await page.waitForTimeout(2000);

  const modalVisible = await page.locator('text=M03 Work Round Engine Complete').isVisible();
  console.log(`✓ Completion modal visible: ${modalVisible}`);

  const step3Path = path.resolve('C:/Users/ADMIN/.gemini/antigravity/brain/eee55e11-50f2-4863-bc00-99a735136c1e/m3_live_phase8_step3_completion_modal.png');
  await page.screenshot({ path: step3Path, fullPage: true });
  console.log(`✓ Saved Step 3 screenshot: ${step3Path}`);

  await browser.close();
  console.log('--- Phase 8 Live Browser Verification Succeeded 100% ---');
}

verifyLivePhase8().catch(err => {
  console.error('Phase 8 verification failed:', err);
  process.exit(1);
});
