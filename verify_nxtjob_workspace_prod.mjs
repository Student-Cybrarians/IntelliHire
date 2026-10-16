import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\eee55e11-50f2-4863-bc00-99a735136c1e';
const BASE_URL = 'https://intellihire-v3.pages.dev';
const CANDIDATE_SESSION = '9c6711d1-4e12-49be-a5a0-a0cc9bb168f1';

async function run() {
  console.log('Verifying Live Production NxtJob-Style Workspace on intellihire-v3.pages.dev...');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
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

  // 1. Module 4 Interview Workspace
  console.log(`\nNavigating to ${BASE_URL}/interviews...`);
  await page.goto(`${BASE_URL}/interviews`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // If in active turn, click "Back to Practice Workspace & History" to show workspace
  const backBtn = await page.$('button:has-text("Back to Practice Workspace")');
  if (backBtn) {
    console.log('Active session detected. Clicking "Back to Practice Workspace & History"...');
    await backBtn.click();
    await page.waitForTimeout(1000);
  }

  // Verify Training Room elements
  const greeting = await page.$('text=IntelliCoach · Behavioral Practice Room');
  console.log('IntelliCoach Practice Room Heading visible:', !!greeting);

  const heatmap = await page.$('text=Practice Rhythm');
  console.log('Practice Rhythm Heatmap visible:', !!heatmap);

  const repsTable = await page.$('text=Practice Reps & History');
  console.log('Practice Reps & History visible:', !!repsTable);

  const allFilter = await page.$('button:has-text("All")');
  console.log('All Track Filter button visible:', !!allFilter);

  const hrFilter = await page.$('button:has-text("HR Mock")');
  console.log('HR Mock Filter button visible:', !!hrFilter);

  const techFilter = await page.$('button:has-text("Technical")');
  console.log('Technical Sim Filter button visible:', !!techFilter);

  const interviewsScreenshot = path.join(ARTIFACT_DIR, 'prod_after_interviews.png');
  await page.screenshot({ path: interviewsScreenshot, fullPage: true });
  console.log(`Saved screenshot: ${interviewsScreenshot}`);

  // 2. Module 3 Simulation Workspace
  console.log(`\nNavigating to ${BASE_URL}/simulation...`);
  await page.goto(`${BASE_URL}/simulation`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const simulationScreenshot = path.join(ARTIFACT_DIR, 'prod_after_simulation.png');
  await page.screenshot({ path: simulationScreenshot, fullPage: true });
  console.log(`Saved screenshot: ${simulationScreenshot}`);

  // 3. Candidate Dashboard
  console.log(`\nNavigating to ${BASE_URL}/dashboard...`);
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const dashboardScreenshot = path.join(ARTIFACT_DIR, 'prod_after_dashboard.png');
  await page.screenshot({ path: dashboardScreenshot, fullPage: true });
  console.log(`Saved screenshot: ${dashboardScreenshot}`);

  await browser.close();
  console.log('\nProduction Verification Complete!');
}

run().catch(err => {
  console.error('Production Verification Failed:', err);
  process.exit(1);
});
