import { chromium } from 'playwright';

async function main() {
  console.log('Starting browser verification for Candidate Dashboard...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 }
  });

  // Inject session cookie for candidate user Mokshith Y
  await context.addCookies([
    {
      name: 'intellihire_session',
      value: '6dcb90e0-54f0-40f7-b18d-51906b0a883e',
      domain: 'intellihire-v3.pages.dev',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax'
    }
  ]);

  const page = await context.newPage();

  console.log('Navigating to https://intellihire-v3.pages.dev/dashboard...');
  await page.goto('https://intellihire-v3.pages.dev/dashboard', { waitUntil: 'networkidle', timeout: 30000 });

  // 1. Verify Header
  const welcomeText = await page.textContent('h1');
  console.log('Workspace Header:', welcomeText);

  // 2. Verify Freshness Badge
  const hasCanonicalCurrent = await page.getByText('CANONICAL CURRENT').isVisible();
  console.log('Has CANONICAL CURRENT badge:', hasCanonicalCurrent);

  // 3. Verify Target Role & Domain
  const targetRoleText = await page.locator('.p-3\\.5:has-text("Target role")').textContent();
  const domainText = await page.locator('.p-3\\.5:has-text("Domain")').textContent();
  console.log('Target Role:', targetRoleText.trim());
  console.log('Domain:', domainText.trim());

  // 4. Verify Resume Source & Active Version (v12)
  const resumeSourceText = await page.locator('.p-3\\.5:has-text("Resume Source")').textContent();
  console.log('Resume Source:', resumeSourceText.trim());

  // 5. Verify Claims Count (should be 27, NOT 226!)
  const claimsCardText = await page.locator('.p-3\\.5:has-text("Extracted Claims")').textContent();
  console.log('Extracted Claims card:', claimsCardText.trim());

  const claimsSnapshotHeading = await page.locator('text=Extracted Claim Provenance Snapshot').locator('..').textContent();
  console.log('Claims Snapshot Heading:', claimsSnapshotHeading.trim());

  // Check individual claims
  const promptEngClaim = await page.getByText('Prompt Engineering').first().isVisible();
  const generativeAiClaim = await page.getByText('Generative AI Tools').first().isVisible();
  console.log('Claims visible - Prompt Engineering:', promptEngClaim, ', Generative AI Tools:', generativeAiClaim);

  // 6. Verify Requisitions
  const reqAiRole = await page.getByText('AI Prompt Engineer & Evaluator').isVisible();
  const reqMlRole = await page.getByText('Junior Machine Learning Associate').isVisible();
  console.log('Requisitions visible - AI Prompt Engineer:', reqAiRole, ', ML Associate:', reqMlRole);

  // Take screenshot of Initial Dashboard
  await page.screenshot({ path: 'candidate_dashboard_verified.png', fullPage: true });
  console.log('Saved screenshot candidate_dashboard_verified.png');

  // 7. Test "Edit Profile" modal
  console.log('Testing Edit Profile interaction...');
  const editProfileBtn = page.getByRole('button', { name: 'Edit Profile' });
  await editProfileBtn.click();
  await page.waitForTimeout(500);

  const modalHeading = await page.getByText('Edit Candidate Profile').isVisible();
  console.log('Edit Profile modal open:', modalHeading);

  // Change bio or target role
  const roleInput = page.locator('input[placeholder*="e.g. AI / Machine Learning Engineer"]');
  await roleInput.fill('AI & Machine Learning Engineer');

  const saveBtn = page.getByRole('button', { name: 'Save Changes' });
  await saveBtn.click();
  await page.waitForTimeout(1500);

  const updatedRoleText = await page.locator('text=Target role').locator('..').textContent();
  console.log('Updated Target Role after save:', updatedRoleText.trim());

  // Take screenshot of Updated Dashboard
  await page.screenshot({ path: 'candidate_dashboard_profile_updated.png', fullPage: true });
  console.log('Saved screenshot candidate_dashboard_profile_updated.png');

  await browser.close();
  console.log('Browser verification completed successfully!');
}

main().catch(err => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
