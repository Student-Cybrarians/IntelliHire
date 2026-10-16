import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const pptxPath = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\eee55e11-50f2-4863-bc00-99a735136c1e\\.user_uploaded\\media_1791931403416_0e40aa90.pptx';
const extractDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\scratch\\IntelliHire\\pptx_extracted';

if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir, { recursive: true });

try {
  execSync(`tar -xf "${pptxPath}" -C "${extractDir}"`);
  console.log('Extracted successfully!');
  const mediaDir = path.join(extractDir, 'ppt', 'media');
  if (fs.existsSync(mediaDir)) {
    const files = fs.readdirSync(mediaDir);
    console.log('Media files:', files);
    for (const f of files) {
      const s = fs.statSync(path.join(mediaDir, f));
      console.log(f, s.size);
    }
  } else {
    console.log('No ppt/media directory found');
  }
} catch (err) {
  console.error('Error:', err);
}
