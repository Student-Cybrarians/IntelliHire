import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { app } from './[[route]]';
import {
  extractLinksFromPdf,
  extractLinksFromDocx,
  extractLinksFromText,
  extractDocumentLinks,
  formatProjectBriefingBullets,
  extractSourceFactInventory,
  buildDeterministicStructuredResume,
  validateStructuredResume,
  generateValidatedStructuredResume,
  renderStructuredResumeToDocx,
} from '../../src/shared/resumeGeneration';

vi.mock('hono/jwt', () => ({
  sign: vi.fn().mockResolvedValue('fake-jwt'),
  verify: vi.fn().mockImplementation(async (token: string) => {
    if (token === 'mokshith-jwt') {
      return { id: 'user-mokshith', role: 'candidate', email: 'mokshithyoganada@gmail.com', organization_id: 'org_default' };
    }
    throw new Error('Invalid token');
  }),
}));

/**
 * Extracts raw XML and relationships directly from a generated .docx Uint8Array
 */
function inspectDocxArchive(docxBytes: Uint8Array): {
  documentXml: string;
  relsXml: string;
  hyperlinks: Array<{ id: string; target: string; text: string }>;
  paragraphs: string[];
} {
  const buf = Buffer.from(docxBytes);
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error('Invalid DOCX buffer: EOCD not found');

  const cdEntries = buf.readUInt16LE(eocdOffset + 10);
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);

  let ptr = cdOffset;
  let documentXml = '';
  let relsXml = '';

  for (let i = 0; i < cdEntries; i++) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) break;
    const compressionMethod = buf.readUInt16LE(ptr + 10);
    const compressedSize = buf.readUInt32LE(ptr + 20);
    const fileNameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localHeaderOffset = buf.readUInt32LE(ptr + 42);
    const fileName = new TextDecoder().decode(buf.subarray(ptr + 46, ptr + 46 + fileNameLen));

    const localFileNameLen = buf.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localFileNameLen + localExtraLen;
    const compressedSlice = buf.subarray(dataStart, dataStart + compressedSize);
    const uncompressed = compressionMethod === 0 ? compressedSlice : zlib.inflateRawSync(compressedSlice);

    if (fileName === 'word/document.xml') {
      documentXml = new TextDecoder().decode(uncompressed);
    } else if (fileName === 'word/_rels/document.xml.rels') {
      relsXml = new TextDecoder().decode(uncompressed);
    }

    ptr += 46 + fileNameLen + extraLen + commentLen;
  }

  // Map rel IDs to target URLs
  const relMap = new Map<string, string>();
  const relMatches = relsXml.matchAll(/<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g);
  for (const m of relMatches) {
    relMap.set(m[1], m[2]);
  }

  // Extract hyperlinks from documentXml
  const hyperlinks: Array<{ id: string; target: string; text: string }> = [];
  const linkMatches = documentXml.matchAll(/<w:hyperlink\b[^>]*r:id="([^"]+)"[^>]*>([\s\S]*?)<\/w:hyperlink>/g);
  for (const m of linkMatches) {
    const rId = m[1];
    const content = m[2];
    const textMatches = [...content.matchAll(/<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/g)];
    const text = textMatches.map(t => t[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean).join(' ');
    hyperlinks.push({
      id: rId,
      target: relMap.get(rId) || '',
      text,
    });
  }

  // Extract paragraphs
  const paragraphs: string[] = [];
  const pMatches = documentXml.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g);
  for (const p of pMatches) {
    const tMatches = [...p[1].matchAll(/<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/g)];
    const pText = tMatches
      .map(t => t[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim())
      .join('')
      .trim();
    if (pText) paragraphs.push(pText);
  }

  return {
    documentXml,
    relsXml,
    hyperlinks,
    paragraphs,
  };
}

describe('M01 Critical Requirements: Contact Details, Links & Project Identity Preservation', () => {
  const samplePdfPath = 'C:/Users/ADMIN/.gemini/antigravity/brain/eee55e11-50f2-4863-bc00-99a735136c1e/scratch/sample_resume.pdf';
  const hasSamplePdf = fs.existsSync(samplePdfPath);
  const samplePdfBuffer = hasSamplePdf ? fs.readFileSync(samplePdfPath) : null;

  const sampleResumeRawText = `Mokshith Y Nanda
Tumkur, Karnataka, India
+91 93535 67620 | mokshithyoganada@gmail.com | LinkedIn | github.com/Student-Cybrarians | prompt Folio
Your Next entry-level AI/ML, Prompt Engineering, and Generative AI opportunities
B.Tech Computer Science and Engineering (AI & ML) student at Global Academy of Technology, Bengaluru, with experience as a Prompt Engineer Intern at InAmigos Foundation, where I build, test, and optimize AI prompts using context engineering, evaluation, and generative AI tools. Coursework in machine learning and data analysis, along with AI-based projects, has given me practical exposure to NLP and applied AI. Seeking entry-level opportunities in AI/ML, Prompt Engineering, and Generative AI to apply this background and keep building hands-on experience.

SKILLS
AI & Prompt Engineering: Prompt Engineering, Generative AI Tools, Context Engineering, Natural Language Processing (NLP), Problem Solving
Programming: Python, Java (Basic), SQL (Basic)
Machine Learning: Supervised Learning, Unsupervised Learning, Classification, Regression, Model Evaluation, Data Preprocessing
Deep Learning: Artificial Neural Networks (ANN), Convolutional Neural Networks (CNN)
Libraries & Tools: NumPy, Pandas, Matplotlib, Scikit-learn (academic exposure), Git, GitHub, Jupyter Notebook, VS Code
Operating Systems: Linux (Ubuntu), Windows

EXPERIENCE
Prompt Engineer Intern
InAmigos Foundation (IAF) | India (Remote)
Aug 2026 - Present
- Designed and tested AI prompts for everyday and professional use cases.
- Evaluated AI-generated responses for prompt structure, context, and quality.
- Optimized prompts through iterative context engineering and problem-solving.

PROJECTS
Human-Detection — Through-Wall Human Detection using WiFi & AI (Concept/Planning Stage), Link
Explored WiFi CSI-based human detection through walls using AI sensing.
Drafted an ANN/CNN classification approach for signal patterns; implementation is still in early stages.
IntelliHire-v3 — AI-Powered Recruitment Concept (Early Prototype), Link Present
Mapped a resume-analysis and candidate-screening workflow for an AI-assisted recruitment concept; core logic is not yet implemented.
AI-IDS-ES — AI-Powered Intrusion Detection Concept (Design Stage), Link
Built the front-end for an ML-based network traffic classification system; Python detection logic remains planned.
Personal Portfolio Website, Link
Built and deployed a portfolio site using HTML, CSS, JavaScript, Git, and GitHub Pages.

EDUCATION
Bachelor of Technology (B.Tech), Computer Science & Engineering (AI & ML) | Global Academy of Technology, Bengaluru, India Aug 2024 - Present
Diploma, Computer Science & Engineering | Government Polytechnic Tumkur, Tumkur, India Nov 2021 - Jul 2024

CERTIFICATIONS
CompTIA Security+ (SY0-401)
CSX Cybersecurity Fundamentals Certificate (CSXF), ISACA
SC-100: Microsoft Cybersecurity Architect — Design Solutions (Self-Study)
J.P. Morgan Software Engineering Virtual Experience — Forage (Secure System Design, Python & Java)
Mastercard Cybersecurity Job Simulation — Forage`;

  it('1. Preserves candidate full name, location, phone, email character-for-character from resume source', () => {
    const inventory = extractSourceFactInventory({
      rawText: sampleResumeRawText,
      fileBuffer: samplePdfBuffer,
      fileFormat: 'pdf',
      parsedData: {
        skills: ['Python', 'Prompt Engineering', 'NLP'],
      },
      userAccount: {
        full_name: 'Mokshith Y', // Truncated OAuth name
        email: 'mokshithyoganada@gmail.com',
      },
    });

    // Full name must match resume header line 1, not truncated OAuth account name
    expect(inventory.candidateName).toBe('Mokshith Y Nanda');
    expect(inventory.candidateLocation).toBe('Tumkur, Karnataka, India');
    expect(inventory.candidatePhone).toBe('+91 93535 67620');
    expect(inventory.candidateEmail).toBe('mokshithyoganada@gmail.com');
  });

  it('2. Extracts all PDF link annotations and associates header & project links', () => {
    if (!samplePdfBuffer) return;

    const links = extractLinksFromPdf(samplePdfBuffer);
    expect(links.length).toBe(9);

    const docLinks = extractDocumentLinks({
      fileBuffer: samplePdfBuffer,
      fileFormat: 'pdf',
      rawText: sampleResumeRawText,
    });

    // Check header links
    const headerUrls = docLinks.headerLinks.map(l => l.url);
    expect(headerUrls).toContain('https://linkedin.com/in/cybrarians');
    expect(headerUrls).toContain('https://github.com/Student-Cybrarians');
    expect(headerUrls).toContain('https://mokshith-ai-security.is-a.dev/');

    // Check project links
    const projectUrls = docLinks.projectLinks.map(l => l.url);
    expect(projectUrls).toContain('https://github.com/Student-Cybrarians/Human-Detection');
    expect(projectUrls).toContain('https://intellihire-v3.pages.dev/');
    expect(projectUrls).toContain('https://github.com/Student-Cybrarians/ai-ids-es');
  });

  it('3. Preserves all 4 original projects and their individual identities without merging or renaming', () => {
    const inventory = extractSourceFactInventory({
      rawText: sampleResumeRawText,
      fileBuffer: samplePdfBuffer,
      fileFormat: 'pdf',
      parsedData: {},
    });

    expect(inventory.projectEntries.length).toBe(4);

    const projectNames = inventory.projectEntries.map(p => p.name);
    expect(projectNames).toContain('Human-Detection');
    expect(projectNames).toContain('IntelliHire-v3');
    expect(projectNames).toContain('AI-IDS-ES');
    expect(projectNames).toContain('Personal Portfolio Website');

    // No project should be generic "Technical & Applied Engineering Projects"
    expect(projectNames).not.toContain('Technical & Applied Engineering Projects');

    // Each project must have associated links
    if (samplePdfBuffer) {
      const hdProj = inventory.projectEntries.find(p => p.name === 'Human-Detection');
      expect(hdProj?.links?.[0]?.url).toBe('https://github.com/Student-Cybrarians/Human-Detection');

      const ihProj = inventory.projectEntries.find(p => p.name === 'IntelliHire-v3');
      expect(ihProj?.links?.[0]?.url).toBe('https://intellihire-v3.pages.dev/');

      const idsProj = inventory.projectEntries.find(p => p.name === 'AI-IDS-ES');
      expect(idsProj?.links?.[0]?.url).toBe('https://github.com/Student-Cybrarians/ai-ids-es');
    }
  });

  it('4. Formats project bullets into ATS-Friendly Briefings (Purpose, Implementation, Outcome) without fabricating facts', () => {
    const inventory = extractSourceFactInventory({
      rawText: sampleResumeRawText,
      fileBuffer: samplePdfBuffer,
      fileFormat: 'pdf',
      parsedData: {},
    });

    const doc = buildDeterministicStructuredResume(inventory, 'global', {
      sourceResumeId: 'test-resume-1',
    });

    const hdProj = doc.projects.find(p => p.name === 'Human-Detection');
    expect(hdProj).toBeDefined();
    expect(hdProj?.bullets.length).toBeGreaterThanOrEqual(2);

    // Verify Purpose & Implementation labels
    expect(hdProj?.bullets[0]).toMatch(/^Purpose:\s+/i);
    expect(hdProj?.bullets[1]).toMatch(/^Implementation:\s+/i);

    // Concept stage projects must NOT invent fake production accuracy or false deployments
    const combinedBulletText = hdProj?.bullets.join(' ') || '';
    expect(combinedBulletText).not.toMatch(/achieved 95% accuracy/i);
    expect(combinedBulletText).not.toMatch(/deployed to production/i);
  });

  it('5. Generates DOCX with genuine clickable OpenXML hyperlinks in both header and projects', async () => {
    const inventory = extractSourceFactInventory({
      rawText: sampleResumeRawText,
      fileBuffer: samplePdfBuffer,
      fileFormat: 'pdf',
      parsedData: {},
      userAccount: { full_name: 'Mokshith Y Nanda', email: 'mokshithyoganada@gmail.com' },
    });

    const doc = buildDeterministicStructuredResume(inventory, 'global', {
      sourceResumeId: 'test-resume-1',
    });

    const docxBytes = await renderStructuredResumeToDocx(doc);
    expect(docxBytes.length).toBeGreaterThan(5000);

    const inspection = inspectDocxArchive(docxBytes);

    // Must contain <w:hyperlink> nodes and relationships
    expect(inspection.documentXml).toContain('<w:hyperlink');
    expect(inspection.relsXml).toContain('Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink"');

    // Header hyperlinks
    const targets = inspection.hyperlinks.map(h => h.target);
    expect(targets).toContain('mailto:mokshithyoganada@gmail.com');
    if (samplePdfBuffer) {
      expect(targets).toContain('https://linkedin.com/in/cybrarians');
      expect(targets).toContain('https://github.com/Student-Cybrarians');
      expect(targets).toContain('https://github.com/Student-Cybrarians/Human-Detection');
      expect(targets).toContain('https://intellihire-v3.pages.dev/');
      expect(targets).toContain('https://github.com/Student-Cybrarians/ai-ids-es');
    }
  });

  it('6. Tailored resume retains ALL original projects (zero dropped) and reorders by relevance', () => {
    const inventory = extractSourceFactInventory({
      rawText: sampleResumeRawText,
      fileBuffer: samplePdfBuffer,
      fileFormat: 'pdf',
      parsedData: {},
      jdRawText: 'Seeking an AI Engineer with expertise in deep learning, neural networks, ANN, CNN, and Python.',
    });

    const tailoredDoc = buildDeterministicStructuredResume(inventory, 'tailored', {
      sourceResumeId: 'test-resume-1',
    });

    // Zero projects dropped: all 4 must be retained
    expect(tailoredDoc.projects.length).toBe(4);
    const names = tailoredDoc.projects.map(p => p.name);
    expect(names).toContain('Human-Detection');
    expect(names).toContain('IntelliHire-v3');
    expect(names).toContain('AI-IDS-ES');
    expect(names).toContain('Personal Portfolio Website');

    // Validation passes with 0 errors
    const valResult = validateStructuredResume(tailoredDoc, inventory);
    expect(valResult.valid).toBe(true);
    expect(valResult.errors).toEqual([]);
  });

  it('7. Validation fails immediately if candidate name or any project is dropped or altered', () => {
    const inventory = extractSourceFactInventory({
      rawText: sampleResumeRawText,
      fileBuffer: samplePdfBuffer,
      fileFormat: 'pdf',
      parsedData: {},
    });

    const doc = buildDeterministicStructuredResume(inventory, 'global', {
      sourceResumeId: 'test-resume-1',
    });

    // Test 7a: Altering candidate name fails validation
    const tamperedDoc1 = {
      ...doc,
      header: { ...doc.header, fullName: 'Different Name' },
    };
    const val1 = validateStructuredResume(tamperedDoc1, inventory);
    expect(val1.valid).toBe(false);
    expect(val1.errors.some(e => e.includes('Candidate name altered'))).toBe(true);

    // Test 7b: Omitting a project fails validation
    const tamperedDoc2 = {
      ...doc,
      projects: doc.projects.slice(0, 2), // dropping 2 projects
    };
    const val2 = validateStructuredResume(tamperedDoc2, inventory);
    expect(val2.valid).toBe(false);
    expect(val2.errors.some(e => e.includes('omitted in generated resume'))).toBe(true);
  });

  it('8. Full pipeline test via GET /api/resume/:id/export with RESUME_KV file buffer', async () => {
    const mockDb = {
      prepare: vi.fn((query: string) => {
        return {
          bind: vi.fn((...args: any[]) => ({
            first: vi.fn(async () => {
              if (query.includes('FROM user_account')) {
                return { full_name: 'Mokshith Y', email: 'mokshithyoganada@gmail.com' };
              }
              if (query.includes('FROM candidate_profile')) {
                return { target_role: 'AI / Machine Learning Engineer', location: 'Tumkur, Karnataka, India' };
              }
              if (query.includes('FROM candidate_context')) {
                return {
                  id: 'ctx-1',
                  raw_text: sampleResumeRawText,
                  context_data_json: JSON.stringify({ skills: ['Python', 'Prompt Engineering', 'NLP'] }),
                };
              }
              if (query.includes('FROM candidate_resume')) {
                return { storage_ref: 'resume:user-mokshith:res-1', filename: 'sample_resume.pdf', file_format: 'pdf' };
              }
              if (query.includes('FROM job_description_context')) {
                return { id: 'jd-1', raw_text: 'Python AI Machine Learning developer', requirements_json: '["Python", "AI"]' };
              }
              return null;
            }),
            all: vi.fn(async () => ({ results: [] })),
          })),
        };
      }),
    };

    const mockSessionKv = {
      get: vi.fn(async (key: string) => {
        if (key.includes('session:')) return 'mokshith-jwt';
        return null;
      }),
      put: vi.fn(async () => {}),
      delete: vi.fn(async () => {}),
    };

    const mockResumeKv = {
      get: vi.fn(async (key: string, format: string) => {
        if (samplePdfBuffer && (key.includes('res-1') || key.includes('resume:'))) {
          return samplePdfBuffer.buffer.slice(samplePdfBuffer.byteOffset, samplePdfBuffer.byteOffset + samplePdfBuffer.byteLength);
        }
        return null;
      }),
    };

    // Test GET /api/resume/res-1/export?type=global
    const reqGlobal = new Request('http://localhost/api/resume/res-1/export?type=global', {
      headers: { Cookie: 'intellihire_session=mokshith-jwt' },
    });

    const resGlobal = await app.fetch(reqGlobal, {
      DB: mockDb,
      SESSION_KV: mockSessionKv,
      RESUME_KV: mockResumeKv,
    } as any);

    expect(resGlobal.status).toBe(200);
    expect(resGlobal.headers.get('Content-Type')).toContain('officedocument.wordprocessingml.document');

    const globalBytes = new Uint8Array(await resGlobal.arrayBuffer());
    const inspectionGlobal = inspectDocxArchive(globalBytes);

    // Verify candidate name preserved in exported DOCX
    expect(inspectionGlobal.paragraphs[0]).toBe('Mokshith Y Nanda');
    expect(inspectionGlobal.paragraphs[1]).toContain('Tumkur, Karnataka, India');

    // Verify project names in exported DOCX
    const docxText = inspectionGlobal.paragraphs.join('\n');
    expect(docxText).toContain('Human-Detection');
    expect(docxText).toContain('IntelliHire-v3');
    expect(docxText).toContain('AI-IDS-ES');
    expect(docxText).toContain('Personal Portfolio Website');

    // Test GET /api/resume/res-1/export?type=tailored
    const reqTailored = new Request('http://localhost/api/resume/res-1/export?type=tailored', {
      headers: { Cookie: 'intellihire_session=mokshith-jwt' },
    });

    const resTailored = await app.fetch(reqTailored, {
      DB: mockDb,
      SESSION_KV: mockSessionKv,
      RESUME_KV: mockResumeKv,
    } as any);

    expect(resTailored.status).toBe(200);
    const tailoredBytes = new Uint8Array(await resTailored.arrayBuffer());
    const inspectionTailored = inspectDocxArchive(tailoredBytes);

    expect(inspectionTailored.paragraphs[0]).toBe('Mokshith Y Nanda');
    const tailoredText = inspectionTailored.paragraphs.join('\n');
    expect(tailoredText).toContain('Human-Detection');
    expect(tailoredText).toContain('IntelliHire-v3');
    expect(tailoredText).toContain('AI-IDS-ES');
    expect(tailoredText).toContain('Personal Portfolio Website');
  });
});
