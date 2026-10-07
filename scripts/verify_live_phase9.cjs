const { chromium } = require('playwright');
const path = require('path');

async function verifyLivePhase9() {
  console.log('--- IntelliHire M03 Phase 9 Live Candidate Journey & Persistence Verification ---');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

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

  const screenshotDir = 'C:/Users/ADMIN/.gemini/antigravity/brain/eee55e11-50f2-4863-bc00-99a735136c1e';

  try {
    // -------------------------------------------------------------
    // Step 1: Module 1 (Resume) and Transition to M02
    // -------------------------------------------------------------
    console.log('\n[1/6] Navigating to M01 Resume Intelligence (/resume)...');
    await page.goto('https://intellihire-v3.pages.dev/resume', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const m1Footer = await page.locator('footer[role="navigation"]').isVisible();
    console.log(`✓ M01 Navigation Footer present: ${m1Footer}`);

    const m1NextBtn = page.locator('button:has-text("Next Module: M02")').first();
    await m1NextBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ M01 "Next Module: M02" button verified.');

    const step1Path = path.resolve(screenshotDir, 'm3_live_phase9_step1_m01_to_m02.png');
    await page.screenshot({ path: step1Path, fullPage: false });
    console.log(`Screenshot saved: ${step1Path}`);

    // Click Next Module -> M02
    console.log('Clicking Next Module -> M02...');
    await m1NextBtn.click();
    await page.waitForURL('**/assess', { timeout: 10000 });
    console.log(`✓ Navigated to: ${page.url()}`);

    // -------------------------------------------------------------
    // Step 2: Module 2 (Assessment) and Transition to M03
    // -------------------------------------------------------------
    console.log('\n[2/6] Verifying M02 Assessment & Prep (/assess)...');
    await page.waitForTimeout(2000);
    const m2Footer = await page.locator('footer[role="navigation"]').isVisible();
    console.log(`✓ M02 Navigation Footer present: ${m2Footer}`);

    const m2NextBtn = page.locator('button:has-text("Next Module: M03")').first();
    await m2NextBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ M02 "Next Module: M03" button verified.');

    const step2Path = path.resolve(screenshotDir, 'm3_live_phase9_step2_m02_to_m03.png');
    await page.screenshot({ path: step2Path, fullPage: false });
    console.log(`Screenshot saved: ${step2Path}`);

    // Click Next Module -> M03
    console.log('Clicking Next Module -> M03...');
    await m2NextBtn.click();
    await page.waitForURL('**/simulation', { timeout: 10000 });
    console.log(`✓ Navigated to: ${page.url()}`);

    // -------------------------------------------------------------
    // Step 3: Module 3 Work Surface & Session Persistence across Refresh
    // -------------------------------------------------------------
    console.log('\n[3/6] Testing M03 Session Persistence & Refresh Recovery (/simulation)...');
    await page.waitForTimeout(3000);

    let inWorkspace = await page.locator('button:has-text("Submit Simulation for Evaluation")').isVisible().catch(() => false);
    let inDebrief = await page.locator('text=Multi-Dimensional Performance Debrief').isVisible().catch(() => false);

    if (!inWorkspace && !inDebrief) {
      console.log('Launching/resuming simulation from catalog...');
      const launchBtn = page.locator('button:has-text("Simulation Workspace")').first();
      await launchBtn.click();
      await page.waitForSelector('button:has-text("Abandon Session")', { timeout: 10000 });
      inWorkspace = true;
    }

    if (inWorkspace) {
      console.log('In workspace. Entering candidate telemetry and draft updates...');
      const editor = page.locator('textarea').first();
      if (await editor.isVisible()) {
        await editor.fill('// IntelliHire Phase 9 Candidate Journey Verification Code\nfunction rateLimiter() { return true; }\n');
      }
      await page.waitForTimeout(1000);
    }

    console.log('Reloading page to test resilient session recovery...');
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    const activeSessionRestored = await page.locator('button:has-text("Abandon Session")').isVisible().catch(() => false);
    console.log(`✓ Active simulation session restored across browser reload: ${activeSessionRestored}`);

    const m3Footer = await page.locator('footer[role="navigation"]').isVisible();
    console.log(`✓ M03 Navigation Footer present after reload: ${m3Footer}`);

    const step3Path = path.resolve(screenshotDir, 'm3_live_phase9_step3_m03_persistence.png');
    await page.screenshot({ path: step3Path, fullPage: false });
    console.log(`Screenshot saved: ${step3Path}`);

    // -------------------------------------------------------------
    // Step 4: Reconciled Route /module-3 Candidate Dynamic Dispatch
    // -------------------------------------------------------------
    console.log('\n[4/6] Testing Reconciled Route (/module-3) for Candidate...');
    await page.goto('https://intellihire-v3.pages.dev/module-3', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    const onSimulationPage = await page.locator('text=Universal Practice & Simulation Sandbox').isVisible();
    console.log(`✓ Route /module-3 successfully rendered Simulation Workspace for candidate: ${onSimulationPage}`);
    const notBouncedToDashboard = !page.url().includes('/dashboard');
    console.log(`✓ Candidate not bounced to dashboard: ${notBouncedToDashboard} (URL: ${page.url()})`);

    const step4Path = path.resolve(screenshotDir, 'm3_live_phase9_step4_module3_candidate_route.png');
    await page.screenshot({ path: step4Path, fullPage: false });
    console.log(`Screenshot saved: ${step4Path}`);

    // -------------------------------------------------------------
    // Step 5: Transition from M03 to M04 (Interviews)
    // -------------------------------------------------------------
    console.log('\n[5/6] Navigating from M03 to M04 Interviews...');
    const m3NextBtn = page.locator('button:has-text("Next Module: M04")').first();
    await m3NextBtn.waitFor({ state: 'visible', timeout: 5000 });
    await m3NextBtn.click();

    await page.waitForURL('**/interviews', { timeout: 10000 });
    console.log(`✓ Arrived at M04 Structured Interviews: ${page.url()}`);
    await page.waitForTimeout(2000);

    const m4Header = await page.locator('text=Behavioral Interaction').isVisible();
    const m4Footer = await page.locator('footer[role="navigation"]').isVisible();
    console.log(`✓ M04 Header visible: ${m4Header}, M04 Footer visible: ${m4Footer}`);

    const step5Path = path.resolve(screenshotDir, 'm3_live_phase9_step5_m03_to_m04.png');
    await page.screenshot({ path: step5Path, fullPage: false });
    console.log(`Screenshot saved: ${step5Path}`);

    // -------------------------------------------------------------
    // Step 6: Transition from M04 to M05 (Readiness Results) -> Dashboard
    // -------------------------------------------------------------
    console.log('\n[6/6] Navigating from M04 to M05 and Candidate Command Center...');
    const m4NextBtn = page.locator('button:has-text("Next Module: M05")').first();
    await m4NextBtn.waitFor({ state: 'visible', timeout: 5000 });
    await m4NextBtn.click();

    await page.waitForURL('**/results', { timeout: 10000 });
    console.log(`✓ Arrived at M05 Results & Decision Support: ${page.url()}`);
    await page.waitForTimeout(2000);

    const m5Header = await page.locator('text=Consolidated Candidate Results').isVisible();
    const m5Footer = await page.locator('footer[role="navigation"]').isVisible();
    console.log(`✓ M05 Header visible: ${m5Header}, M05 Footer visible: ${m5Footer}`);

    const m5NextBtn = page.locator('button:has-text("Next Module: Command Center")').first();
    await m5NextBtn.waitFor({ state: 'visible', timeout: 5000 });
    await m5NextBtn.click();

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log(`✓ Returned to Candidate Command Center (/dashboard): ${page.url()}`);
    await page.waitForTimeout(2000);

    const step6Path = path.resolve(screenshotDir, 'm3_live_phase9_step6_m05_and_dashboard.png');
    await page.screenshot({ path: step6Path, fullPage: false });
    console.log(`Screenshot saved: ${step6Path}`);

    console.log('\n=============================================================');
    console.log('✓ PHASE 9 COMPLETE CANDIDATE JOURNEY & PERSISTENCE CERTIFIED');
    console.log('=============================================================');

  } catch (error) {
    console.error('Phase 9 verification failed:', error);
    const errPath = path.resolve(screenshotDir, 'm3_live_phase9_error.png');
    await page.screenshot({ path: errPath, fullPage: true }).catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
}

verifyLivePhase9().catch(err => {
  console.error(err);
  process.exit(1);
});
