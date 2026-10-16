import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\eee55e11-50f2-4863-bc00-99a735136c1e';

// Paths for ISO A1 Landscape (841mm x 594mm)
const A1_HTML_PATH = 'file:///' + path.resolve('poster_a1.html').replace(/\\/g, '/');
const A1_PDF_OUTPUT = path.join(ARTIFACT_DIR, 'poster_A1_print.pdf');
const A1_PNG_OUTPUT = path.join(ARTIFACT_DIR, 'poster_A1_preview.png');

async function renderA1() {
  console.log('Launching browser to render ISO A1 (841mm x 594mm) Landscape poster...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 841mm x 594mm at 96 DPI: ~3179 x 2245 px, at 100 DPI: ~3311 x 2339 px
  const context = await browser.newContext({
    viewport: { width: 3311, height: 2339 },
    deviceScaleFactor: 2 // Crisp rendering (approx 200 DPI equivalent)
  });

  const page = await context.newPage();
  console.log('Loading ISO A1 poster HTML:', A1_HTML_PATH);
  await page.goto(A1_HTML_PATH, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('Generating high-res ISO A1 PNG preview...');
  await page.screenshot({
    path: A1_PNG_OUTPUT,
    fullPage: true
  });
  console.log('Saved ISO A1 preview PNG to:', A1_PNG_OUTPUT);

  console.log('Generating print-ready ISO A1 (841mm x 594mm) PDF...');
  await page.pdf({
    path: A1_PDF_OUTPUT,
    width: '841mm',
    height: '594mm',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  console.log('Saved ISO A1 print PDF to:', A1_PDF_OUTPUT);

  await browser.close();
  console.log('ISO A1 poster render complete!');
}

renderA1().catch(err => {
  console.error('Render failed:', err);
  process.exit(1);
});
