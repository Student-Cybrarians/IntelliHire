import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\eee55e11-50f2-4863-bc00-99a735136c1e';
const CANDIDATE_COOKIE = '9c6711d1-4e12-49be-a5a0-a0cc9bb168f1';
const PROD_URL = 'https://intellihire-v3.pages.dev/interviews';

async function run() {
  console.log('Launching browser to verify M04 Voice AI interview on production...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    permissions: ['microphone'],
    viewport: { width: 1440, height: 960 }
  });

  // Inject candidate session cookie
  await context.addCookies([
    {
      name: 'intellihire_session',
      value: CANDIDATE_COOKIE,
      domain: 'intellihire-v3.pages.dev',
      path: '/'
    }
  ]);

  const page = await context.newPage();

  console.log('Navigating to', PROD_URL);
  await page.goto(PROD_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Capture Pre-Session Evidence Grounding Card
  console.log('Verifying Pre-Interview Evidence Grounding Card...');
  await page.waitForSelector('text=Personalized 10-Question Voice AI Mock Interview');
  const preScreenPath = path.join(ARTIFACT_DIR, 'm04_prod_pre_interview_evidence_card.png');
  await page.screenshot({ path: preScreenPath, fullPage: true });
  console.log('Saved:', preScreenPath);

  // 2. Launch Personalized Interview Session
  console.log('Launching 10-Question Personalized Interview...');
  const launchBtn = await page.waitForSelector('button:has-text("Launch 10-Question Personalized Interview")');
  await launchBtn.click();

  // Wait for session and active question turn to load
  await page.waitForSelector('text=Question 1 of 10', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Verify Voice AI Status Bar & Microphone Controls
  console.log('Verifying Voice AI Status Bar & Audio Controls...');
  await page.waitForSelector('text=Your Turn to Respond');
  await page.waitForSelector('button:has-text("Start Speaking (Microphone)")');
  await page.waitForSelector('button:has-text("Replay Question Aloud")');
  
  const activeTurnPath = path.join(ARTIFACT_DIR, 'm04_prod_active_turn_voice_controls.png');
  await page.screenshot({ path: activeTurnPath, fullPage: true });
  console.log('Saved:', activeTurnPath);

  // 3. Enter oral response into transcript editor and submit turn
  console.log('Entering candidate response and submitting Turn 1...');
  const textarea = await page.waitForSelector('textarea');
  await textarea.fill('I am a cybersecurity and systems professional with a strong foundation in threat detection, SOC operations, and AI-driven monitoring. Throughout my academic projects and intern experience at TechCiti Technologies, I managed SIEM log analysis, triaged high-severity security incidents, and developed automated detection rules. This directly aligns with your requirement for an engineer who combines rigorous operational hygiene with scalable systems defense.');

  await page.waitForTimeout(1000);
  const submitTurnBtn = await page.waitForSelector('button:has-text("Submit Response & Receive Coaching")');
  await submitTurnBtn.click();

  // 4. Wait for Coaching Card or Adaptive Follow-Up Probe
  console.log('Waiting for evaluation and feedback/probe...');
  const probeOrCoaching = await Promise.race([
    page.waitForSelector('text=Adaptive Follow-Up Probe', { timeout: 20000 }).then(() => 'probe'),
    page.waitForSelector('text=Answer Coaching & Presentation Guidance', { timeout: 20000 }).then(() => 'coaching')
  ]);

  if (probeOrCoaching === 'probe') {
    console.log('Adaptive follow-up probe detected! Capturing screenshot...');
    await page.waitForTimeout(1000);
    const probePath = path.join(ARTIFACT_DIR, 'm04_prod_adaptive_follow_up_probe.png');
    await page.screenshot({ path: probePath, fullPage: true });
    console.log('Saved:', probePath);

    // Skip probe to view coaching card
    console.log('Proceeding past follow-up probe to view coaching...');
    const skipBtn = await page.waitForSelector('button:has-text("Skip Follow-Up & View Coaching")');
    await skipBtn.click();
    await page.waitForSelector('text=Answer Coaching & Presentation Guidance', { timeout: 15000 });
  }

  await page.waitForTimeout(1500);
  const coachingPath = path.join(ARTIFACT_DIR, 'm04_prod_answer_coaching_card.png');
  await page.screenshot({ path: coachingPath, fullPage: true });
  console.log('Saved:', coachingPath);

  // 5. Click Retry to refine answer
  console.log('Testing Retry This Question flow...');
  const retryBtn = await page.waitForSelector('button:has-text("Retry This Question")');
  await retryBtn.click();
  await page.waitForTimeout(1000);

  // Fill revised answer with STAR framework metrics
  const retryTextarea = await page.waitForSelector('textarea');
  await retryTextarea.fill('Situation: During my internship at TechCiti, we experienced anomalous outbound egress spikes. Task: I was tasked with identifying root-cause telemetry without causing service disruption. Action: I cross-correlated firewall NetFlow with SIEM alert queues, isolated compromised endpoints via subnet ACLs, and engineered automated Python log parsers. Result: Mean Time to Detect (MTTD) decreased by 42% and eradicated false-positive alerts across 12 monitoring dashboards.');

  await page.waitForTimeout(1000);
  const submitRetryBtn = await page.waitForSelector('button:has-text("Submit Revised Answer")');
  await submitRetryBtn.click();

  // Wait for Retry Comparison Delta banner
  await page.waitForSelector('text=Revised Attempt Delta', { timeout: 15000 });
  await page.waitForTimeout(1500);

  const retryDeltaPath = path.join(ARTIFACT_DIR, 'm04_prod_retry_comparison_delta.png');
  await page.screenshot({ path: retryDeltaPath, fullPage: true });
  console.log('Saved:', retryDeltaPath);

  // 6. Advance to Turn 2
  console.log('Advancing to Question 2...');
  const advanceBtn = await page.waitForSelector('button:has-text("Continue to Next Question")');
  await advanceBtn.click();

  await page.waitForSelector('text=Question 2 of 10', { timeout: 15000 });
  await page.waitForTimeout(2000);

  const q2Path = path.join(ARTIFACT_DIR, 'm04_prod_question_2_grounded.png');
  await page.screenshot({ path: q2Path, fullPage: true });
  console.log('Saved:', q2Path);

  await browser.close();
  console.log('Production verification complete! All screenshots saved to artifact directory.');
}

run().catch(err => {
  console.error('Production verification failed:', err);
  process.exit(1);
});
