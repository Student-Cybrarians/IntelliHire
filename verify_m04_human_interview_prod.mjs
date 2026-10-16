import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\eee55e11-50f2-4863-bc00-99a735136c1e';
const BASE_URL = 'https://intellihire-v3.pages.dev';

// Known live candidate and recruiter user IDs in intellihire-db
// Recruiter: mokshithyoga@gmail.com (id: b5d79f0f-2a9e-4bcb-ac40-d38b8f0fcc8b)
// Candidate: instatimetogrow@gmail.com (id: 9c6711d1-4e12-49be-a5a0-a0cc9bb168f1)
const RECRUITER_SESSION = 'b5d79f0f-2a9e-4bcb-ac40-d38b8f0fcc8b';
const CANDIDATE_SESSION = '9c6711d1-4e12-49be-a5a0-a0cc9bb168f1';

async function run() {
  console.log('Starting M04 Phase 2 Live Human Interview production verification...');

  // Launch browser with fake media streams enabled for WebRTC testing
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
  // CONTEXT 1: RECRUITER (Mokshith Y Nanda)
  // =========================================================================
  console.log('Setting up Context 1: Recruiter session...');
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
  recruiterPage.on('console', msg => console.log('RECRUITER CONSOLE:', msg.text()));
  recruiterPage.on('dialog', async dialog => {
    console.log('RECRUITER DIALOG:', dialog.type(), dialog.message());
    await dialog.accept();
  });
  recruiterPage.on('response', async res => {
    if (res.url().includes('/api/m4/human-interviews')) {
      if (res.status() >= 400 || res.url().includes('/complete')) {
        try {
          const text = await res.text();
          console.log(`API RESPONSE [${res.status()}] ${res.url()}:`, text);
        } catch (_) {}
      }
    }
  });
  console.log(`Navigating Recruiter to ${BASE_URL}/interviews...`);
  await recruiterPage.goto(`${BASE_URL}/interviews`, { waitUntil: 'networkidle' });

  // 1. Click "Live Human HR Interview" Tab
  console.log('Navigating to Live Human HR Interview tab...');
  const humanTab = await recruiterPage.waitForSelector('button:has-text("Live Human HR Interview")', { timeout: 15000 });
  await humanTab.click();
  await recruiterPage.waitForSelector('text=Real Human HR Interview Scheduling & Live Video Rooms', { timeout: 15000 });
  await recruiterPage.waitForTimeout(1000);

  const schedViewPath = path.join(ARTIFACT_DIR, 'm04_prod_recruiter_scheduling_view.png');
  await recruiterPage.screenshot({ path: schedViewPath, fullPage: true });
  console.log('Saved:', schedViewPath);

  // 2. Schedule New Interview via Modal
  console.log('Opening Schedule Human Interview modal...');
  const schedBtn = await recruiterPage.waitForSelector('button:has-text("Schedule Human Interview")');
  await schedBtn.click();
  await recruiterPage.waitForSelector('text=Schedule Human HR Interview', { timeout: 10000 });

  // Select candidate if dropdown available
  const candSelect = await recruiterPage.waitForSelector('select');
  await candSelect.selectOption('9c6711d1-4e12-49be-a5a0-a0cc9bb168f1');

  // Set Target Role
  const roleInput = await recruiterPage.waitForSelector('input[value*="Architect"], input[type="text"]');
  await roleInput.fill('Principal Cloud Resilience Architect');

  await recruiterPage.waitForTimeout(500);
  const submitBtn = await recruiterPage.waitForSelector('button:has-text("Create & Invite Candidate")');
  await submitBtn.click();

  console.log('Submitting interview invitation...');
  await recruiterPage.waitForSelector('text=Principal Cloud Resilience Architect', { timeout: 15000 });
  await recruiterPage.waitForTimeout(1000);

  const invListPath = path.join(ARTIFACT_DIR, 'm04_prod_invitation_created_list.png');
  await recruiterPage.screenshot({ path: invListPath, fullPage: true });
  console.log('Saved:', invListPath);

  // =========================================================================
  // CONTEXT 2: CANDIDATE (Mokshith Y)
  // =========================================================================
  console.log('Setting up Context 2: Candidate session...');
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

  // Click Live Human HR Interview Tab
  const candHumanTab = await candidatePage.waitForSelector('button:has-text("Live Human HR Interview")', { timeout: 15000 });
  await candHumanTab.click();
  await candidatePage.waitForSelector('text=Principal Cloud Resilience Architect', { timeout: 15000 });
  await candidatePage.waitForTimeout(1000);

  // If candidate has an Accept button, click it
  const acceptBtn = await candidatePage.$('button:has-text("Accept")');
  if (acceptBtn) {
    console.log('Candidate accepting interview invitation...');
    await acceptBtn.click();
    await candidatePage.waitForTimeout(1500);
  }

  const candAcceptedPath = path.join(ARTIFACT_DIR, 'm04_prod_candidate_accepted_view.png');
  await candidatePage.screenshot({ path: candAcceptedPath, fullPage: true });
  console.log('Saved:', candAcceptedPath);

  // =========================================================================
  // DUAL-PARTY ROOM JOIN & WEBRTC MEDIA CONNECTION
  // =========================================================================
  console.log('Recruiter entering live interview room...');
  const recruiterJoinBtn = await recruiterPage.waitForSelector('button:has-text("Enter Live Room")');
  await recruiterJoinBtn.click();
  await recruiterPage.waitForSelector('text=Interviewer Evaluation Workspace', { timeout: 20000 });
  await recruiterPage.waitForTimeout(2000);

  console.log('Candidate entering live interview room...');
  const candJoinBtn = await candidatePage.waitForSelector('button:has-text("Enter Live Room")');
  await candJoinBtn.click();
  await candidatePage.waitForSelector('text=Interview Session Briefing', { timeout: 20000 });
  await candidatePage.waitForTimeout(2500);

  // Save Candidate Room View Screenshot
  const candRoomPath = path.join(ARTIFACT_DIR, 'm04_prod_candidate_live_room.png');
  await candidatePage.screenshot({ path: candRoomPath, fullPage: true });
  console.log('Saved:', candRoomPath);

  // Recruiter Workspace Interactions
  console.log('Interacting with Recruiter Workspace...');
  // Ask a structured question
  const askBtn = await recruiterPage.$('button:has-text("Ask This")');
  if (askBtn) await askBtn.click();

  // Type private notes
  const notesTextarea = await recruiterPage.waitForSelector('textarea[placeholder*="Record confidential notes"]');
  await notesTextarea.fill('Candidate articulated clear trade-offs regarding split-brain quorum and asynchronous replication lag. Strong grasp of distributed systems resiliency.');

  // Save draft
  const saveDraftBtn = await recruiterPage.$('button:has-text("Save Draft")');
  if (saveDraftBtn) await saveDraftBtn.click();

  await recruiterPage.waitForTimeout(1500);
  const recruiterLivePath = path.join(ARTIFACT_DIR, 'm04_prod_recruiter_live_workspace.png');
  await recruiterPage.screenshot({ path: recruiterLivePath, fullPage: true });
  console.log('Saved:', recruiterLivePath);

  // Conclude & Submit Evaluation
  console.log('Concluding interview and submitting human evaluation...');
  const concludeBtn = await recruiterPage.waitForSelector('button:has-text("Conclude & Evaluate")');
  await concludeBtn.click();
  await recruiterPage.waitForSelector('text=Conclude Live Interview & Record Evaluation', { timeout: 10000 });

  // Select Strong Hire
  const strongHireBtn = await recruiterPage.waitForSelector('button:has-text("Strong Hire")');
  await strongHireBtn.click();

  // Fill final notes
  const finalNotesArea = await recruiterPage.waitForSelector('textarea[placeholder*="Synthesize overall candidate performance"]');
  await finalNotesArea.fill('Consensus recommendation: Strong Hire. Demonstrated verified engineering depth across cloud infrastructure, blameless post-mortems, and team mentorship.');

  const submitEvalBtn = await recruiterPage.waitForSelector('button:has-text("Submit Evaluation & Close Room")');
  await submitEvalBtn.click();

  await recruiterPage.waitForSelector('text=Live Human Interview Concluded & Synthesized', { timeout: 20000 });
  await recruiterPage.waitForTimeout(1500);

  const evalSynthPath = path.join(ARTIFACT_DIR, 'm04_prod_post_interview_evaluation_synthesis.png');
  await recruiterPage.screenshot({ path: evalSynthPath, fullPage: true });
  console.log('Saved:', evalSynthPath);

  await browser.close();
  console.log('All M04 Phase 2 dual-party production verification steps completed successfully!');
}

run().catch(err => {
  console.error('M04 Phase 2 Production verification failed:', err);
  process.exit(1);
});
