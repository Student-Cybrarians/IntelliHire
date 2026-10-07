import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\eee55e11-50f2-4863-bc00-99a735136c1e';

async function main() {
  console.log('=== Starting Real Playwright Browser Verification for M02 Assessment Reliability ===');

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

  // Listen to console and page errors
  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[Browser PageError]: ${err.message}`));

  try {
    // ----------------------------------------------------
    // STEP 1: Direct Load of /assess
    // ----------------------------------------------------
    console.log('\n[Step 1] Navigating to https://intellihire-v3.pages.dev/assess ...');
    await page.goto('https://intellihire-v3.pages.dev/assess', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Verify there is NO "Assessment Error" or "Network error"
    const errorText = await page.locator('text="Assessment Error"').isVisible().catch(() => false);
    const networkErrorText = await page.locator('text="Network error starting assessment"').isVisible().catch(() => false);
    console.log('Is Assessment Error banner visible?', errorText);
    console.log('Is Network error message visible?', networkErrorText);

    if (errorText || networkErrorText) {
      throw new Error('FAILED: Initial load displayed an error banner!');
    }

    const step1Screenshot = path.join(ARTIFACT_DIR, 'm2_live_step1_landing_clean.png');
    await page.screenshot({ path: step1Screenshot, fullPage: true });
    console.log('Saved Screenshot Step 1:', step1Screenshot);

    // Check if landing page or in-progress assessment is visible
    const isBeginButtonVisible = await page.locator('button:has-text("Begin Assessment")').isVisible().catch(() => false);
    const isQuestionVisible = await page.locator('#question-text').isVisible().catch(() => false);
    console.log('Is "Begin Assessment" button visible?', isBeginButtonVisible);
    console.log('Is question text visible (resumed active attempt)?', isQuestionVisible);

    if (isBeginButtonVisible) {
      // ----------------------------------------------------
      // STEP 2: Click "Begin Assessment"
      // ----------------------------------------------------
      console.log('\n[Step 2] Clicking "Begin Assessment" ...');
      await page.click('button:has-text("Begin Assessment")');
      await page.waitForTimeout(3000);
    }

    // ----------------------------------------------------
    // STEP 3: Question Display & Verification
    // ----------------------------------------------------
    console.log('\n[Step 3] Waiting for question and options to be visible ...');
    await page.locator('#question-text').waitFor({ state: 'visible', timeout: 15000 });

    const questionText = await page.locator('#question-text').textContent();
    console.log('Question Loaded:', questionText?.trim());

    const step2Screenshot = path.join(ARTIFACT_DIR, 'm2_live_step2_question_loaded.png');
    await page.screenshot({ path: step2Screenshot, fullPage: true });
    console.log('Saved Screenshot Step 2:', step2Screenshot);

    // Check options
    const radioButtons = page.locator('button[role="radio"]');
    const optionCount = await radioButtons.count();
    console.log(`Found ${optionCount} MCQ option buttons.`);

    // ----------------------------------------------------
    // STEP 4: Select Option & Submit Answer
    // ----------------------------------------------------
    if (optionCount > 0) {
      console.log('\n[Step 4] Selecting option A and submitting response ...');
      await radioButtons.first().click();
      await page.waitForTimeout(500);

      const submitButton = page.locator('button:has-text("Submit Answer")');
      await submitButton.waitFor({ state: 'visible', timeout: 5000 });
      const isSubmitEnabled = await submitButton.isEnabled();
      console.log('Submit Answer button enabled:', isSubmitEnabled);

      if (isSubmitEnabled) {
        await submitButton.click();
        console.log('Submitted response, waiting for evaluation ...');

        // Wait for evaluation banner to appear (either Score, Analysis, or Next Question button)
        await page.locator('button:has-text("Next Question")').waitFor({ state: 'visible', timeout: 20000 });
        console.log('Evaluation received! Next Question button is visible.');

        const step3Screenshot = path.join(ARTIFACT_DIR, 'm2_live_step3_answer_evaluated.png');
        await page.screenshot({ path: step3Screenshot, fullPage: true });
        console.log('Saved Screenshot Step 3:', step3Screenshot);

        // Click Next Question to test progression
        console.log('\n[Step 4b] Clicking "Next Question" to test adaptive progression ...');
        await page.click('button:has-text("Next Question")');
        await page.waitForTimeout(3000);
        await page.locator('#question-text').waitFor({ state: 'visible', timeout: 10000 });

        const nextQText = await page.locator('#question-text').textContent();
        console.log('Next Question Loaded:', nextQText?.trim());
      }
    }

    // ----------------------------------------------------
    // STEP 5: Page Reload & State Resumption
    // ----------------------------------------------------
    console.log('\n[Step 5] Testing page reload and active attempt auto-resumption ...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const errorOnReload = await page.locator('text="Assessment Error"').isVisible().catch(() => false);
    console.log('Is error visible on reload?', errorOnReload);
    if (errorOnReload) {
      throw new Error('FAILED: Error displayed upon page reload!');
    }

    await page.locator('#question-text').waitFor({ state: 'visible', timeout: 10000 });
    const resumedQuestion = await page.locator('#question-text').textContent();
    console.log('Resumed question after reload:', resumedQuestion?.trim());

    const step4Screenshot = path.join(ARTIFACT_DIR, 'm2_live_step4_resumed_after_reload.png');
    await page.screenshot({ path: step4Screenshot, fullPage: true });
    console.log('Saved Screenshot Step 4:', step4Screenshot);

    console.log('\n=== ALL M02 REAL BROWSER VERIFICATION CHECKS PASSED SUCCESSFULLY ===');
  } catch (err) {
    console.error('\nVerification encountered error:', err);
    const errorScreenshot = path.join(ARTIFACT_DIR, 'm2_live_verification_error.png');
    await page.screenshot({ path: errorScreenshot, fullPage: true }).catch(() => {});
    throw err;
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
