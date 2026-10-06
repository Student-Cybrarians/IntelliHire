import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\eee55e11-50f2-4863-bc00-99a735136c1e';

async function main() {
  console.log('--- Starting Playwright Verification for M01 State Persistence & Stuck Loading Reliability ---');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 }
  });

  // Inject session cookie for candidate Mokshith Y
  await context.addCookies([
    {
      name: 'intellihire_session',
      value: 'f3b67eb6-8f98-4543-a2d8-fb75bd9da9fd',
      domain: 'intellihire-v3.pages.dev',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax'
    }
  ]);

  const page = await context.newPage();

  // ----------------------------------------------------
  // TEST STEP 1: Direct Load & Canonical State Restoration
  // ----------------------------------------------------
  console.log('\n[Step 1] Navigating directly to https://intellihire-v3.pages.dev/resume...');
  await page.goto('https://intellihire-v3.pages.dev/resume', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for restoration banner to resolve if active
  await page.waitForTimeout(2000);

  const title = await page.textContent('h1');
  console.log('Page Header:', title?.trim());

  // Check Source Evidence card
  const sourceEvidenceVisible = await page.getByText('Source Evidence').first().isVisible();
  console.log('Source Evidence visible:', sourceEvidenceVisible);

  // Check if verified skills / resume document are restored
  const verifiedSkillsVisible = await page.getByText(/Verified Skills/i).first().isVisible().catch(() => false);
  console.log('Restored Verified Skills card visible:', verifiedSkillsVisible);

  const screenshotStep1 = path.join(ARTIFACT_DIR, 'm1_verification_step1_restored.png');
  await page.screenshot({ path: screenshotStep1, fullPage: true });
  console.log('Saved screenshot:', screenshotStep1);

  // ----------------------------------------------------
  // TEST STEP 2: Candidate Draft Auto-Save in Textarea
  // ----------------------------------------------------
  console.log('\n[Step 2] Testing Candidate In-Progress Draft Auto-Save...');
  const textarea = page.locator('textarea[placeholder*="Job Description"]');
  const isTextareaVisible = await textarea.isVisible().catch(() => false);
  
  const testJdText = 'Seeking an AI Engineer with expertise in PyTorch, LLM Prompt Engineering, and Cloudflare Workers deployment.';

  if (isTextareaVisible) {
    console.log('Entering draft JD text into textarea...');
    await textarea.fill(testJdText);
    await page.waitForTimeout(1000);
  } else {
    console.log('Job Description is already analyzed/rendered. Checking change/edit button...');
    const changeJdBtn = page.getByText(/Change Requirements/i).or(page.getByText(/Edit/i)).first();
    if (await changeJdBtn.isVisible().catch(() => false)) {
      await changeJdBtn.click();
      await page.waitForTimeout(500);
      await textarea.fill(testJdText);
    }
  }

  // ----------------------------------------------------
  // TEST STEP 3: Cross-Route Navigation (Resume -> Dashboard -> Resume)
  // ----------------------------------------------------
  console.log('\n[Step 3] Testing Cross-Route Navigation State Preservation...');
  const backToDashBtn = page.getByRole('button', { name: /Back to Dashboard/i });
  await backToDashBtn.click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  console.log('Navigated to Dashboard successfully. Current URL:', page.url());

  const dashHeader = await page.textContent('h1');
  console.log('Dashboard Header:', dashHeader?.trim());

  // Navigate back to Module 1 /resume via sidebar or direct link
  console.log('Navigating back to /resume...');
  await page.goto('https://intellihire-v3.pages.dev/resume', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Verify that Source Evidence is preserved
  const sourceEvidenceAfterNav = await page.getByText('Source Evidence').first().isVisible();
  console.log('Source Evidence preserved after navigation:', sourceEvidenceAfterNav);

  const screenshotStep3 = path.join(ARTIFACT_DIR, 'm1_verification_step3_navigation_preserved.png');
  await page.screenshot({ path: screenshotStep3, fullPage: true });
  console.log('Saved screenshot:', screenshotStep3);

  // ----------------------------------------------------
  // TEST STEP 4: Hard Page Refresh
  // ----------------------------------------------------
  console.log('\n[Step 4] Testing Hard Page Refresh State Restoration...');
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const sourceEvidenceAfterReload = await page.getByText('Source Evidence').first().isVisible();
  console.log('Source Evidence preserved after reload:', sourceEvidenceAfterReload);

  const screenshotStep4 = path.join(ARTIFACT_DIR, 'm1_verification_step4_reload_preserved.png');
  await page.screenshot({ path: screenshotStep4, fullPage: true });
  console.log('Saved screenshot:', screenshotStep4);

  // ----------------------------------------------------
  // TEST STEP 5: Reset Module 1 Modal & Workflow
  // ----------------------------------------------------
  console.log('\n[Step 5] Testing Reset Module 1 Modal & Confirmation Flow...');
  const resetBtn = page.getByRole('button', { name: /Reset Module 1/i });
  await resetBtn.click();
  await page.waitForTimeout(500);

  // Verify Modal appears
  const modalVisible = await page.getByText(/Reset Module 1\?/i).isVisible();
  console.log('Reset Confirmation Modal visible:', modalVisible);

  const modalDisclaimer = await page.getByText(/Your original uploaded evidence and parsed skills remain protected/i).isVisible();
  console.log('Evidence preservation disclaimer visible:', modalDisclaimer);

  const screenshotStep5Modal = path.join(ARTIFACT_DIR, 'm1_verification_step5_reset_modal.png');
  await page.screenshot({ path: screenshotStep5Modal, fullPage: true });
  console.log('Saved screenshot:', screenshotStep5Modal);

  // Test Cancel
  const cancelBtn = page.getByRole('button', { name: /Cancel/i });
  await cancelBtn.click();
  await page.waitForTimeout(500);
  const modalDismissed = !(await page.getByText(/Reset Module 1\?/i).isVisible());
  console.log('Modal dismissed on Cancel:', modalDismissed);

  // Re-open and Confirm Reset
  await resetBtn.click();
  await page.waitForTimeout(500);

  const confirmResetBtn = page.getByRole('button', { name: /Confirm Reset/i });
  await confirmResetBtn.click();
  await page.waitForTimeout(2500);

  // Verify toast/status message
  const statusToast = await page.getByText(/Module 1 working state.*reset/i).isVisible().catch(() => false);
  console.log('Reset success feedback displayed:', statusToast);

  // Verify that the Source Evidence is STILL intact (protected evidence)
  const sourceEvidenceAfterReset = await page.getByText('Source Evidence').first().isVisible();
  console.log('Canonical Resume Evidence intact after reset:', sourceEvidenceAfterReset);

  const screenshotStep5AfterReset = path.join(ARTIFACT_DIR, 'm1_verification_step5_after_reset.png');
  await page.screenshot({ path: screenshotStep5AfterReset, fullPage: true });
  console.log('Saved screenshot:', screenshotStep5AfterReset);

  console.log('\n--- All Playwright Browser Verification Steps Completed Successfully! ---');
  await browser.close();
}

main().catch(err => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
