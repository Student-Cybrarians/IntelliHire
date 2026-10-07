import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\eee55e11-50f2-4863-bc00-99a735136c1e';

async function main() {
  console.log('=== Verifying M02 Results View & Proficiency Synthesis ===');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 }
  });

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

  // Complete the attempt in the session
  console.log('Completing attempt ec496ebf-f293-4f47-88df-62ed3ae1db1d...');
  await page.goto('https://intellihire-v3.pages.dev/assess', { waitUntil: 'networkidle' });

  // Complete attempt via API
  await page.evaluate(async () => {
    await fetch('/api/m2/attempts/ec496ebf-f293-4f47-88df-62ed3ae1db1d/complete', { method: 'POST' });
  });

  // Re-navigate to /assess to see fresh landing or state
  await page.goto('https://intellihire-v3.pages.dev/assess', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const screenshotLanding = path.join(ARTIFACT_DIR, 'm2_live_step5_new_session_ready.png');
  await page.screenshot({ path: screenshotLanding, fullPage: true });
  console.log('Saved Screenshot Step 5 (Clean Landing Ready for Next Assessment):', screenshotLanding);

  // Now verify proficiency and gaps API responses directly in browser context
  const testData = await page.evaluate(async () => {
    const profRes = await fetch('/api/m2/proficiency');
    const gapRes = await fetch('/api/m2/gaps');
    const prof = await profRes.json();
    const gaps = await gapRes.json();
    return { prof, gaps };
  });

  console.log('Proficiency Results:', JSON.stringify(testData.prof, null, 2));
  console.log('Gap Analysis Results:', JSON.stringify(testData.gaps, null, 2));

  if (!testData.prof.success || !testData.gaps.success) {
    throw new Error('FAILED: Proficiency or Gaps API did not return success!');
  }

  console.log('=== M02 Assessment Completion & Synthesis Verified Cleanly ===');
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
