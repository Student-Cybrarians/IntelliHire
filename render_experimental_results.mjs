import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\eee55e11-50f2-4863-bc00-99a735136c1e';
const A1_HTML_PATH = 'file:///' + path.resolve('poster_a1.html').replace(/\\/g, '/');
const POSTER_2X3FT_HTML_PATH = 'file:///' + path.resolve('poster_2x3ft.html').replace(/\\/g, '/');

async function captureResults() {
  console.log('Launching browser to capture Experimental Results card...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // ISO A1 Context
  const context = await browser.newContext({
    viewport: { width: 3311, height: 2339 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
  console.log('Loading ISO A1 poster:', A1_HTML_PATH);
  await page.goto(A1_HTML_PATH, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Element screenshot of ONLY the Experimental Results card (ISO A1)
  const cardElement = page.locator('#experimental-results-card');
  const resultsCardPath = path.join(ARTIFACT_DIR, 'poster_experimental_results.png');
  await cardElement.screenshot({
    path: resultsCardPath
  });
  console.log('Saved isolated Experimental Results screenshot to:', resultsCardPath);

  // 2. Full A1 poster preview update
  const a1PreviewPath = path.join(ARTIFACT_DIR, 'poster_A1_preview.png');
  await page.screenshot({
    path: a1PreviewPath,
    fullPage: true
  });
  console.log('Saved updated ISO A1 poster preview to:', a1PreviewPath);

  // 3. Print-ready PDF update
  const a1PdfPath = path.join(ARTIFACT_DIR, 'poster_A1_print.pdf');
  await page.pdf({
    path: a1PdfPath,
    width: '841mm',
    height: '594mm',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  console.log('Saved updated ISO A1 print PDF to:', a1PdfPath);

  // 4. Element screenshot of 2x3ft card for comparison
  console.log('Loading 2x3ft poster:', POSTER_2X3FT_HTML_PATH);
  await page.goto(POSTER_2X3FT_HTML_PATH, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const card2x3Element = page.locator('#experimental-results-card');
  const resultsCard2x3Path = path.join(ARTIFACT_DIR, 'poster_2x3ft_experimental_results.png');
  await card2x3Element.screenshot({
    path: resultsCard2x3Path
  });
  console.log('Saved isolated 2x3ft Experimental Results screenshot to:', resultsCard2x3Path);

  await browser.close();
  console.log('Experimental Results capture complete!');
}

captureResults().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
