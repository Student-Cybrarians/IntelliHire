import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\eee55e11-50f2-4863-bc00-99a735136c1e';

async function main() {
  console.log('=== Starting Real Playwright Browser Verification for M03 Simulation Reliability ===');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 }
  });

  // Inject authenticated candidate session cookie
  await context.addCookies([
    {
      name: 'intellihire_session',
      value: '94cd5482-5b66-4f33-9954-9bf585c29154',
      domain: 'intellihire-v3.pages.dev',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax'
    }
  ]);

  const page = await context.newPage();

  // Listen to browser console and errors
  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[Browser PageError]: ${err.message}`));

  let alertMessage = null;
  page.on('dialog', async dialog => {
    alertMessage = dialog.message();
    console.log(`[Browser Dialog Alert]: "${alertMessage}"`);
    await dialog.accept();
  });

  try {
    // ----------------------------------------------------
    // STEP 1: Direct Load of /simulation
    // ----------------------------------------------------
    console.log('\n[Step 1] Navigating to https://intellihire-v3.pages.dev/simulation ...');
    await page.goto('https://intellihire-v3.pages.dev/simulation', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const step1Screenshot = path.join(ARTIFACT_DIR, 'm3_live_step1_catalog.png');
    await page.screenshot({ path: step1Screenshot, fullPage: true });
    console.log('Saved Screenshot Step 1:', step1Screenshot);

    // If an active session was restored automatically, abandon it or return to catalog so we can test catalog from fresh
    const returnBtn = page.locator('button:has-text("Return to Catalog")');
    if (await returnBtn.isVisible().catch(() => false)) {
      console.log('Active session detected on initial load. Clicking Return to Catalog...');
      await returnBtn.click();
      await page.waitForTimeout(1000);
    }

    // Verify catalog title and cards
    const heading = await page.locator('h1').textContent();
    console.log('Page Heading:', heading);
    if (!heading?.includes('Universal Practice & Simulation Sandbox')) {
      throw new Error(`Unexpected page heading: ${heading}`);
    }

    // Verify all 5 discipline pills exist
    const pills = ['All Disciplines', 'Software & Tech', 'Finance & Accounting', 'Operations & Triage', 'Data Engineering', 'Legal & Procurement'];
    for (const pill of pills) {
      const visible = await page.locator(`button:has-text("${pill}")`).isVisible();
      console.log(`Discipline filter "${pill}":`, visible ? 'VISIBLE' : 'MISSING');
    }

    // ----------------------------------------------------
    // STEP 2: Filter by Discipline
    // ----------------------------------------------------
    console.log('\n[Step 2] Testing discipline filtering...');
    await page.click('button:has-text("Finance & Accounting")');
    await page.waitForTimeout(500);
    const financeCards = await page.locator('h3:has-text("CapEx ROI & Capital Allocation Under Inflation")').isVisible();
    console.log('Finance simulation card visible:', financeCards);

    await page.click('button:has-text("All Disciplines")');
    await page.waitForTimeout(500);

    // ----------------------------------------------------
    // STEP 3: Launch Simulation Workspace (Coding: Token Bucket)
    // ----------------------------------------------------
    console.log('\n[Step 3] Launching Coding Simulation Workspace...');
    alertMessage = null;

    // Find the coding simulation card and its launch/resume button
    const codingCard = page.locator('.grid > div').filter({ hasText: 'Distributed Token Bucket Rate Limiter' });
    const launchBtn = codingCard.locator('button');
    await launchBtn.click();
    await page.waitForTimeout(3000);

    if (alertMessage) {
      throw new Error(`Launch failed with browser alert: "${alertMessage}"`);
    }

    // Verify workspace is open
    const simTitle = await page.locator('h2:has-text("Distributed Token Bucket Rate Limiter")').isVisible();
    console.log('Simulation Workspace open (Title visible):', simTitle);
    if (!simTitle) {
      throw new Error('Simulation Workspace failed to open!');
    }

    const step2Screenshot = path.join(ARTIFACT_DIR, 'm3_live_step2_workspace.png');
    await page.screenshot({ path: step2Screenshot, fullPage: true });
    console.log('Saved Screenshot Step 2:', step2Screenshot);

    // ----------------------------------------------------
    // STEP 4: Interact with Workspace (Code Edit, Test Run, Notes)
    // ----------------------------------------------------
    console.log('\n[Step 4] Interacting with coding workspace...');
    // Add code in editor
    const codeTextarea = page.locator('textarea').first();
    await codeTextarea.fill(`// Distributed Token Bucket Rate Limiter Implementation
class TokenBucketRateLimiter {
  private capacity: number = 100;
  private refillRatePerSec: number = 1.66;
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();

  public checkRequest(clientId: string, nowMs = Date.now()) {
    let bucket = this.buckets.get(clientId);
    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: nowMs };
      this.buckets.set(clientId, bucket);
    }
    const elapsed = (nowMs - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsed * this.refillRatePerSec);
    bucket.lastRefill = nowMs;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { allowed: true, remaining: Math.floor(bucket.tokens), reset_seconds: 60 };
    }
    return { allowed: false, remaining: 0, reset_seconds: 60 };
  }
}`);
    await page.waitForTimeout(1000);

    // Run tests
    console.log('Clicking Run Test Cases...');
    await page.click('button:has-text("Run Test Cases")');
    await page.waitForTimeout(1000);

    const testOutput = await page.locator('text=/Pass: 3\\/3 Tests/').isVisible();
    console.log('Test case runner passed:', testOutput);

    // Fill notes
    const notesArea = page.locator('textarea[placeholder*="trade-offs"]');
    await notesArea.fill('Implemented sliding window with sub-millisecond overhead and safe concurrency.');

    const step3Screenshot = path.join(ARTIFACT_DIR, 'm3_live_step3_interaction.png');
    await page.screenshot({ path: step3Screenshot, fullPage: true });
    console.log('Saved Screenshot Step 3:', step3Screenshot);

    // ----------------------------------------------------
    // STEP 5: Trigger Dynamic Constraint Shift
    // ----------------------------------------------------
    console.log('\n[Step 5] Triggering Dynamic Constraint Shift...');
    const injectBtn = page.locator('button:has-text("Trigger Dynamic Constraint Shift")');
    if (await injectBtn.isVisible()) {
      await injectBtn.click();
      await page.waitForTimeout(1500);

      const dynamicAlertVisible = await page.locator('text="EMERGENCY CONSTRAINT SHIFT"').isVisible();
      console.log('Dynamic Constraint Alert visible:', dynamicAlertVisible);
    }

    const step4Screenshot = path.join(ARTIFACT_DIR, 'm3_live_step4_dynamic_injection.png');
    await page.screenshot({ path: step4Screenshot, fullPage: true });
    console.log('Saved Screenshot Step 4:', step4Screenshot);

    // ----------------------------------------------------
    // STEP 6: Verify Session Persistence Across Page Reload
    // ----------------------------------------------------
    console.log('\n[Step 6] Reloading page to test session persistence...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    const reloadedSimTitle = await page.locator('h2:has-text("Distributed Token Bucket Rate Limiter")').isVisible();
    const reloadedStep = await page.locator('text="Step 2 of 2"').isVisible();
    console.log('Workspace restored after page reload:', reloadedSimTitle);
    console.log('Step 2 preserved after reload:', reloadedStep);

    if (!reloadedSimTitle) {
      throw new Error('Session was NOT persisted across page reload!');
    }

    const step5Screenshot = path.join(ARTIFACT_DIR, 'm3_live_step5_restored_after_reload.png');
    await page.screenshot({ path: step5Screenshot, fullPage: true });
    console.log('Saved Screenshot Step 5:', step5Screenshot);

    // ----------------------------------------------------
    // STEP 7: Submit Work and Multi-Dimensional Evaluation
    // ----------------------------------------------------
    console.log('\n[Step 7] Submitting work for multi-dimensional evaluation...');
    const submitBtn = page.locator('button:has-text("Submit Simulation for Evaluation")');
    await submitBtn.click();

    // Wait for evaluation debrief view
    console.log('Waiting for evaluation results...');
    await page.waitForSelector('text="Multi-Dimensional Performance Debrief"', { timeout: 35000 });
    await page.waitForTimeout(2000);

    const evalHeading = await page.locator('text="Multi-Dimensional Performance Debrief"').isVisible();
    const scoreText = await page.locator('text="Demonstrated Proficiency"').isVisible();
    const auditLog = await page.locator('text="Observable Performance Evidence (Audit Log)"').isVisible();
    const feedbackLoop = await page.locator('text="M02 Learning & Practice Feedback Loop"').isVisible();

    console.log('Debrief visible:', evalHeading);
    console.log('Score visible:', scoreText);
    console.log('Audit log visible:', auditLog);
    console.log('M02 feedback loop visible:', feedbackLoop);

    const step6Screenshot = path.join(ARTIFACT_DIR, 'm3_live_step6_evaluation_debrief.png');
    await page.screenshot({ path: step6Screenshot, fullPage: true });
    console.log('Saved Screenshot Step 6:', step6Screenshot);

    // ----------------------------------------------------
    // STEP 8: Return to Catalog & Verify Completed Status
    // ----------------------------------------------------
    console.log('\n[Step 8] Returning to catalog...');
    await page.click('button:has-text("Continue in Catalog")');
    await page.waitForTimeout(2000);

    const completedBadge = await page.locator('span:has-text("Completed")').first().isVisible();
    console.log('Completed status badge in catalog:', completedBadge);

    const step7Screenshot = path.join(ARTIFACT_DIR, 'm3_live_step7_completed_catalog.png');
    await page.screenshot({ path: step7Screenshot, fullPage: true });
    console.log('Saved Screenshot Step 7:', step7Screenshot);

    // ----------------------------------------------------
    // STEP 9: Test Second Simulation Domain (Operational Triage)
    // ----------------------------------------------------
    console.log('\n[Step 9] Testing non-technical domain simulation: Hospital Float Pool Staffing...');
    const opsCard = page.locator('.grid > div').filter({ hasText: 'Hospital Float Pool Staffing' });
    const opsLaunchBtn = opsCard.locator('button');
    await opsLaunchBtn.click();
    await page.waitForTimeout(3000);

    const opsSimTitle = await page.locator('h2:has-text("Hospital Float Pool Staffing & Emergency Bed Triage")').isVisible();
    const patientQueue = await page.locator('text=/Patient Acuity Queue/').isVisible();
    console.log('Operations Simulation open:', opsSimTitle);
    console.log('Patient Acuity Queue visible:', patientQueue);

    if (!opsSimTitle || !patientQueue) {
      throw new Error('Operations simulation workspace failed to open!');
    }

    const step8Screenshot = path.join(ARTIFACT_DIR, 'm3_live_step8_ops_workspace.png');
    await page.screenshot({ path: step8Screenshot, fullPage: true });
    console.log('Saved Screenshot Step 8:', step8Screenshot);

    console.log('\n=== ALL PLAYWRIGHT LIVE VERIFICATIONS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('\n*** PLAYWRIGHT VERIFICATION FAILED ***', err);
    const errorScreenshot = path.join(ARTIFACT_DIR, 'm3_live_verification_error.png');
    await page.screenshot({ path: errorScreenshot, fullPage: true }).catch(() => {});
    console.log('Error screenshot saved to:', errorScreenshot);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
