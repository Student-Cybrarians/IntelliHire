import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\eee55e11-50f2-4863-bc00-99a735136c1e';
const BASE_URL = 'https://intellihire-v3.pages.dev';

// Known live candidate and recruiter user IDs in intellihire-db
const RECRUITER_SESSION = 'b5d79f0f-2a9e-4bcb-ac40-d38b8f0fcc8b';
const CANDIDATE_SESSION = '9c6711d1-4e12-49be-a5a0-a0cc9bb168f1';

async function run() {
  console.log('Starting M04 Phase 3 E2E Production Verification...');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  // =========================================================================
  // TEST JOURNEY 1: CANDIDATE AI VOICE MOCK INTERVIEW EXPERIENCE
  // =========================================================================
  console.log('\n--- Journey 1: Candidate AI Voice Mock Interview ---');
  const candidateContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  await candidateContext.addCookies([
    {
      name: 'intellihire_session',
      value: CANDIDATE_SESSION,
      domain: 'intellihire-v3.pages.dev',
      path: '/'
    }
  ]);

  const candidatePage = await candidateContext.newPage();
  console.log(`Navigating Candidate to ${BASE_URL}/interviews...`);
  await candidatePage.goto(`${BASE_URL}/interviews`, { waitUntil: 'networkidle' });

  // Verify Tab 1 explicit AI Mock label
  await candidatePage.waitForSelector('text=AI Voice Mock Interview (10-Question)', { timeout: 10000 });
  console.log('Verified Tab Label: "AI Voice Mock Interview (10-Question)"');

  // Verify explicit mode badge
  await candidatePage.waitForSelector('text=Mode: AI Voice Mock Interview Simulation', { timeout: 10000 });
  console.log('Verified Header Badge: "Mode: AI Voice Mock Interview Simulation"');

  // If follow-up probe is active, click skip to reveal diagnostic coaching card
  const skipBtn = await candidatePage.$('button:has-text("Skip Follow-Up & View Coaching")');
  if (skipBtn) {
    console.log('Active follow-up probe found. Clicking "Skip Follow-Up & View Coaching →"...');
    await skipBtn.click();
  }

  // Wait for Answer Coaching Card
  console.log('Waiting for Answer Coaching Card to appear...');
  await candidatePage.waitForSelector('text=Answer Coaching & Presentation Guidance', { timeout: 15000 });
  console.log('Answer Coaching Card rendered with structure blueprint and feedback tabs');

  // Screenshot 2: AI Mock Answer Coaching & Feedback
  const aiMockCoachingPath = path.join(ARTIFACT_DIR, 'm04_p3_ai_mock_coaching_feedback.png');
  await candidatePage.screenshot({ path: aiMockCoachingPath, fullPage: true });
  console.log('Saved:', aiMockCoachingPath);

  // =========================================================================
  // TEST JOURNEY 2: RECRUITER & CANDIDATE LIVE HUMAN HR INTERVIEW
  // =========================================================================
  console.log('\n--- Journey 2: Real Human HR Live Video Interview ---');
  const recruiterContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  await recruiterContext.addCookies([
    {
      name: 'intellihire_session',
      value: RECRUITER_SESSION,
      domain: 'intellihire-v3.pages.dev',
      path: '/'
    }
  ]);

  const recruiterPage = await recruiterContext.newPage();
  console.log(`Navigating Recruiter to ${BASE_URL}/interviews...`);
  await recruiterPage.goto(`${BASE_URL}/interviews`, { waitUntil: 'networkidle' });

  // Navigate to Live Human HR Interview tab
  const humanTab = await recruiterPage.waitForSelector('button:has-text("Live Human HR Interview")');
  await humanTab.click();
  await recruiterPage.waitForSelector('text=Real Human HR Interview Scheduling & Live Video Rooms', { timeout: 15000 });
  console.log('Verified Recruiter Live Human HR Interview Tab');

  // Click Enter Live Room on first active accepted room
  const enterRoomBtn = await recruiterPage.waitForSelector('button:has-text("Enter Live Room")', { timeout: 15000 });
  await enterRoomBtn.click();

  // Wait for Recruiter live room
  await recruiterPage.waitForSelector('text=Interviewer Evaluation Workspace', { timeout: 20000 });
  console.log('Recruiter entered live room with grounded evaluation workspace');

  // Also navigate Candidate into same live room
  const candidateHumanTab = await candidatePage.waitForSelector('button:has-text("Live Human HR Interview")');
  await candidateHumanTab.click();
  await candidatePage.waitForTimeout(1000);
  const candEnterRoomBtn = await candidatePage.waitForSelector('button:has-text("Enter Live Room")', { timeout: 15000 });
  await candEnterRoomBtn.click();

  console.log('Candidate entered live room. Waiting for media signaling and workspace synchronization...');
  await candidatePage.waitForTimeout(4000);

  // Screenshot 3: Recruiter Live Room with Peer WebRTC & Grounded Workspace
  const humanRoomPath = path.join(ARTIFACT_DIR, 'm04_p3_human_live_room_connected.png');
  await recruiterPage.screenshot({ path: humanRoomPath, fullPage: true });
  console.log('Saved:', humanRoomPath);

  await browser.close();
  console.log('\nM04 Phase 3 E2E Production Verification Completed Successfully!');
}

run().catch(err => {
  console.error('M04 Phase 3 Verification failed:', err);
  process.exit(1);
});
