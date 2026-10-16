import fs from 'fs';

const xml = fs.readFileSync('C:/Users/ADMIN/.gemini/antigravity/scratch/IntelliHire/pptx_extracted/ppt/slides/slide1.xml', 'utf8');

const regex = /<p:(sp|pic)>([\s\S]*?)<\/p:\1>/g;
let match;
while ((match = regex.exec(xml)) !== null) {
  const content = match[2];
  const nameMatch = content.match(/name="([^"]+)"/);
  const textMatch = [...content.matchAll(/<a:t>([^<]+)<\/a:t>/g)].map(m => m[1]).join('');
  const offMatch = content.match(/<a:off x="(\d+)" y="(\d+)"\/>/);
  const extMatch = content.match(/<a:ext cx="(\d+)" cy="(\d+)"\/>/);
  const colorMatch = content.match(/<a:srgbClr val="([A-Fa-f0-9]+)"\/>/);
  
  const name = nameMatch ? nameMatch[1] : 'unknown';
  const x = offMatch ? (parseInt(offMatch[1])/914400).toFixed(2) : '?';
  const y = offMatch ? (parseInt(offMatch[2])/914400).toFixed(2) : '?';
  const w = extMatch ? (parseInt(extMatch[1])/914400).toFixed(2) : '?';
  const h = extMatch ? (parseInt(extMatch[2])/914400).toFixed(2) : '?';
  const color = colorMatch ? colorMatch[1] : '';

  if (textMatch || name.includes('Picture') || name.includes('Rectangle')) {
    console.log(`[${name}] pos:(${x},${y}) size:${w}x${h} color:#${color} text:"${textMatch}"`);
  }
}
