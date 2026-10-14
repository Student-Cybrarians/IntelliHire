import { describe, it, expect, vi, beforeEach } from 'vitest';
import zlib from 'zlib';
import { app } from './[[route]]';
import {
  categorizeAndDeduplicateSkills,
  polishProfessionalText,
  sanitizeRawResumeText,
  extractSourceFactInventory,
  validateStructuredResume,
  generateValidatedStructuredResume,
  renderStructuredResumeToDocx,
} from '../../src/shared/resumeGeneration';

vi.mock('hono/jwt', () => ({
  sign: vi.fn().mockResolvedValue('fake-jwt'),
  verify: vi.fn().mockImplementation(async (token: string) => {
    if (token === 'candidate-1-jwt') {
      return { id: 'user-1', role: 'candidate', email: 'priya@example.com', organization_id: 'org_default_public' };
    }
    throw new Error('Invalid token');
  }),
}));

/**
 * Extracts raw XML and paragraph text strings directly from a generated .docx Uint8Array
 * by parsing the ZIP Central Directory and inflating word/document.xml.
 */
function extractDocxTextFromZip(docxBytes: Uint8Array): { xml: string; paragraphs: string[]; fullText: string } {
  const buf = Buffer.from(docxBytes);
  // Locate End of Central Directory (EOCD) signature 0x06054b50
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Invalid ZIP/DOCX buffer: EOCD not found');
  }

  const cdEntries = buf.readUInt16LE(eocdOffset + 10);
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);

  let ptr = cdOffset;
  for (let i = 0; i < cdEntries; i++) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) break;
    const compressionMethod = buf.readUInt16LE(ptr + 10);
    const compressedSize = buf.readUInt32LE(ptr + 20);
    const fileNameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localHeaderOffset = buf.readUInt32LE(ptr + 42);
    const fileName = buf.subarray(ptr + 46, ptr + 46 + fileNameLen).toString('utf8');

    if (fileName === 'word/document.xml') {
      const localFileNameLen = buf.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localFileNameLen + localExtraLen;
      const compressedSlice = buf.subarray(dataStart, dataStart + compressedSize);

      const xmlBuf =
        compressionMethod === 0
          ? compressedSlice
          : zlib.inflateRawSync(compressedSlice);
      const xml = xmlBuf.toString('utf8');

      // Extract text per <w:p> paragraph
      const paragraphs: string[] = [];
      const pMatches = xml.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g) || [];
      for (const pXml of pMatches) {
        const tMatches = pXml.match(/<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/g) || [];
        const pText = tMatches
          .map(t =>
            t
              .replace(/<[^>]+>/g, '')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")
          )
          .join('')
          .trim();
        if (pText) paragraphs.push(pText);
      }

      return {
        xml,
        paragraphs,
        fullText: paragraphs.join('\n'),
      };
    }

    ptr += 46 + fileNameLen + extraLen + commentLen;
  }

  throw new Error('word/document.xml not found in DOCX archive');
}

describe('M01 Targeted Resume Generation Quality & Validation Suite', () => {
  const sampleCandidateRawText = `Aarav Mehta — Backend & AI Engineer
aarav.mehta@example.com | +91 98765 43210 | linkedin.com/in/aaravmehta | github.com/aaravmehta

Summary
Backend developer with 3 years of experiance building scalable web applications and data pipelines in fast-paced enviornment.

Skills
python, Python, py, FastAPI, fastapi, PostgreSQL, postgresql, Docker, React.js, react, TypeScript, Redis, Machine Learning, Scikit-Learn, Git, CI/CD, REST APIs, System Design, Agile

Experience
Software Engineer — Nimbus Cloud Systems (2023 - Present)
- Worked on building microservices using python and fastapi serving 150k daily requests with 99.9% uptime
- Responsible for optimizing postgresql queries and redis caching which reduced API latency by 42%
- Helped in setting up docker containers and github actions CI/CD workflows for automated deployments

Associate Developer — Vertex Analytics (2021 - 2023)
- Tasked with developing data ingestion pipelines in python and pandas for enterprise telemetry
- Assisted with building interactive internal dashboards using react.js and typescript

Projects
DocuSense RAG Engine | Python, FastAPI, LangChain
- Built an evidence-grounded document retrieval service indexing 25,000 technical manuals

Education
B.Tech in Computer Science & Engineering — National Institute of Technology (2017 - 2021)

Certifications
- AWS Certified Developer - Associate
`;

  const sampleParsedData = {
    skills: [
      'python',
      'Python',
      'fastapi',
      'FastAPI',
      'postgresql',
      'Docker',
      'React.js',
      'TypeScript',
      'Redis',
      'Machine Learning',
      'Scikit-Learn',
      'Git',
      'CI/CD',
      'REST APIs',
      'System Design',
    ],
    experience: [
      {
        company: 'Nimbus Cloud Systems',
        title: 'Software Engineer',
        duration: '2023 - Present',
      },
      {
        company: 'Vertex Analytics',
        title: 'Associate Developer',
        duration: '2021 - 2023',
      },
    ],
    education: ['B.Tech in Computer Science & Engineering — National Institute of Technology (2017 - 2021)'],
    certifications: ['AWS Certified Developer - Associate'],
    achievements: [],
  };

  const sampleJdRequirements = JSON.stringify({
    requirements: [
      '5+ years production experience with Python, FastAPI, and PostgreSQL microservices',
      'Strong expertise in Kubernetes, multi-cluster service mesh (Istio/Linkerd), and Terraform infrastructure',
      'Experience with Docker, Redis caching, and CI/CD automation',
      'Production experience with Rust and Apache Kafka event streaming',
    ],
  });

  it('1. Categorizes and deduplicates skills cleanly without case or alias duplicates', () => {
    const groups = categorizeAndDeduplicateSkills(
      [
        'python',
        'Python',
        'py',
        'FastAPI',
        'fastapi',
        'PostgreSQL',
        'postgres',
        'React.js',
        'react',
        'Docker',
        'Machine Learning',
        'Git',
        'System Design',
      ],
      ['FastAPI', 'PostgreSQL', 'Docker']
    );

    expect(groups.length).toBeGreaterThanOrEqual(4);
    const allSkillsFlat = groups.flatMap(g => g.skills);
    // Verify deduplication
    expect(allSkillsFlat.filter(s => s.toLowerCase() === 'python')).toHaveLength(1);
    expect(allSkillsFlat.filter(s => s.toLowerCase() === 'fastapi')).toHaveLength(1);
    expect(allSkillsFlat.filter(s => s.toLowerCase() === 'postgresql')).toHaveLength(1);
    expect(allSkillsFlat.filter(s => s.toLowerCase() === 'react')).toHaveLength(1);

    // Verify category names are logical and human-readable
    const categoryNames = groups.map(g => g.category);
    expect(categoryNames).toContain('Programming Languages');
    expect(categoryNames).toContain('Frameworks, Libraries & APIs');
    expect(categoryNames).toContain('Databases & Data Storage');
    expect(categoryNames).toContain('Cloud, DevOps & Infrastructure');
  });

  it('2. Polishes weak bullet prefixes and fixes common spelling/casing issues while preserving facts and metrics', () => {
    const rawBullet =
      'Worked on building microservices using python and fastapi serving 150k daily requests with 99.9% uptime in fast-paced enviornment';
    const polished = polishProfessionalText(rawBullet, true);

    expect(polished).toMatch(/^Developed and implemented microservices/);
    expect(polished).toContain('Python');
    expect(polished).toContain('FastAPI');
    expect(polished).toContain('99.9%');
    expect(polished).toContain('environment');
    expect(polished).not.toContain('enviornment');
    expect(polished.endsWith('.')).toBe(true);
  });

  it('3. Generates a Global Resume DOCX with categorized skills, polished bullets, and preserved candidate facts', async () => {
    const result = await generateValidatedStructuredResume({
      rawText: sampleCandidateRawText,
      parsedData: sampleParsedData,
      userAccount: { full_name: 'Aarav Mehta', email: 'aarav.mehta@example.com' },
      profile: { target_role: 'Backend & AI Engineer' },
      mode: 'global',
      sourceResumeId: 'res-global-1',
      sourceVersion: 1,
    });

    expect(result.validation.valid).toBe(true);
    expect(result.document).not.toBeNull();

    const docxBytes = await renderStructuredResumeToDocx(result.document!);
    const { paragraphs, fullText } = extractDocxTextFromZip(docxBytes);

    // Verify Header & Sections
    expect(paragraphs[0]).toBe('Aarav Mehta');
    expect(fullText).toContain('Backend & AI Engineer');
    expect(fullText).toContain('aarav.mehta@example.com');
    expect(fullText).toContain('PROFESSIONAL SUMMARY');
    expect(fullText).toContain('TECHNICAL & CORE SKILLS');
    expect(fullText).toContain('PROFESSIONAL EXPERIENCE');
    expect(fullText).toContain('KEY PROJECTS');
    expect(fullText).toContain('EDUCATION');
    expect(fullText).toContain('CERTIFICATIONS & CREDENTIALS');

    // Verify skills are categorized into multiple labeled lines, not one giant flat list
    expect(fullText).toContain('Programming Languages: ');
    expect(fullText).toContain('Frameworks, Libraries & APIs: ');
    expect(fullText).toContain('Databases & Data Storage: ');
    expect(fullText).toContain('Cloud, DevOps & Infrastructure: ');

    // Verify experience employers, titles, durations, and polished bullets are preserved
    expect(fullText).toContain('Software Engineer  —  Nimbus Cloud Systems   (2023 - Present)');
    expect(fullText).toContain('Associate Developer  —  Vertex Analytics   (2021 - 2023)');
    expect(fullText).toContain('Developed and implemented microservices using Python and FastAPI serving 150k daily requests with 99.9% uptime.');
    expect(fullText).toContain('Optimized PostgreSQL queries and Redis caching which reduced API latency by 42%.');

    // Verify projects, education, and certifications
    expect(fullText).toContain('DocuSense RAG Engine');
    expect(fullText).toContain('B.Tech in Computer Science & Engineering  —  National Institute of Technology   (2017 - 2021)');
    expect(fullText).toContain('AWS Certified Developer - Associate');

    // Verify no synthetic or tailored alignment garbage
    expect(fullText).not.toContain('Target Role Alignment');
    expect(fullText).not.toContain('incorporating verifiable experience with');
  });

  it('4. Generates a Tailored Resume DOCX that prioritizes JD-relevant evidence and strictly blocks unsupported JD keywords and legacy keyword-stuffed rewrites', async () => {
    // Include polluted legacy optimized_rewrites and raw_text marker to verify sanitization
    const pollutedRawText = `${sampleCandidateRawText}\n\n--- TARGETED ATS OPTIMIZATIONS ---\n• Backend developer — incorporating verifiable experience with expertise, Kubernetes, multi-cluster, mesh aligned to JD.`;
    const pollutedParsedData = {
      ...sampleParsedData,
      optimized_rewrites: [
        {
          source_evidence: 'Nimbus Cloud Systems',
          suggested_text:
            'Software Engineer at Nimbus Cloud Systems — incorporating verifiable experience with expertise, Kubernetes, multi-cluster, mesh aligned to "Strong expertise in Kubernetes, multi-cluster service mesh".',
        },
        {
          source_evidence: 'Tailored Enhancement',
          suggested_text: 'Architected Kubernetes and Terraform infrastructure with Rust and Kafka.',
        },
        {
          source_evidence: 'Nimbus Cloud Systems',
          suggested_text:
            'Engineered resilient Python and FastAPI microservices backed by PostgreSQL and Redis caching, cutting API latency by 42%.',
        },
      ],
    };

    const result = await generateValidatedStructuredResume({
      rawText: pollutedRawText,
      parsedData: pollutedParsedData,
      userAccount: { full_name: 'Aarav Mehta', email: 'aarav.mehta@example.com' },
      profile: { target_role: 'Backend & AI Engineer' },
      mode: 'tailored',
      sourceResumeId: 'res-tailored-1',
      sourceVersion: 2,
      targetJdId: 'jd-1',
      jdRawText: sampleJdRequirements,
      jdRequirementsJson: sampleJdRequirements,
    });

    expect(result.validation.valid).toBe(true);
    expect(result.document).not.toBeNull();

    const docxBytes = await renderStructuredResumeToDocx(result.document!);
    const { fullText } = extractDocxTextFromZip(docxBytes);

    // Must NOT contain any forbidden synthetic phrases or unsupported JD technologies
    expect(fullText).not.toContain('Target Role Alignment');
    expect(fullText).not.toContain('Tailored Highlights');
    expect(fullText).not.toContain('incorporating verifiable experience with');
    expect(fullText).not.toContain('TARGETED ATS OPTIMIZATIONS');
    expect(fullText.toLowerCase()).not.toContain('kubernetes');
    expect(fullText.toLowerCase()).not.toContain('multi-cluster');
    expect(fullText.toLowerCase()).not.toContain('istio');
    expect(fullText.toLowerCase()).not.toContain('terraform');
    expect(fullText.toLowerCase()).not.toContain('rust');
    expect(fullText.toLowerCase()).not.toContain('kafka');

    // Must contain the valid, evidence-grounded rewrite and supported JD keywords
    expect(fullText).toContain(
      'Engineered resilient Python and FastAPI microservices backed by PostgreSQL and Redis caching, cutting API latency by 42%.'
    );
  });

  it('5. Rejects AI hallucinated skills/metrics during generation and falls back to validated deterministic output after bounded retries', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary:
                    'Principal Kubernetes and Rust Architect with 10 years of experience reducing cloud costs by 87% across multi-cluster meshes.',
                  experience_bullets: [
                    [
                      'Deployed Kubernetes multi-cluster service mesh with Terraform and Rust reducing latency by 87%.',
                    ],
                  ],
                }),
              },
            },
          ],
        }),
        { status: 200 }
      )
    );

    const result = await generateValidatedStructuredResume({
      rawText: sampleCandidateRawText,
      parsedData: sampleParsedData,
      userAccount: { full_name: 'Aarav Mehta', email: 'aarav.mehta@example.com' },
      profile: { target_role: 'Backend & AI Engineer' },
      mode: 'tailored',
      sourceResumeId: 'res-ai-fallback',
      jdRawText: sampleJdRequirements,
      jdRequirementsJson: sampleJdRequirements,
      env: { NVIDIA_API_KEY: 'test-key' },
      extractJsonFn: (raw: string) => JSON.parse(raw),
    });

    // Bounded retry should have tried twice and rejected both hallucinated responses
    expect(mockFetch).toHaveBeenCalledTimes(2);
    mockFetch.mockRestore();
    expect(result.validation.valid).toBe(true);
    expect(result.document?.metadata.generationMethod).toBe('deterministic_evidence_polished');
    expect(result.document?.metadata.retriesUsed).toBe(2);
    expect(result.document?.summary.toLowerCase()).not.toContain('kubernetes');
    expect(result.document?.summary.toLowerCase()).not.toContain('87%');
  });

  it('6. Handles edge cases via API: empty/NO_OCR resume returns 422, sparse resume omits empty sections, and missing JD in tailored mode succeeds', async () => {
    const dbState: Record<string, any> = {
      'res-empty-ocr': {
        resume: { id: 'res-empty-ocr', user_id: 'user-1', version: 1 },
        context: {
          raw_text: '',
          context_data_json: JSON.stringify({ skills: [], experience: [], education: [], certifications: [] }),
        },
      },
      'res-sparse-1': {
        resume: { id: 'res-sparse-1', user_id: 'user-1', version: 1 },
        context: {
          raw_text:
            'Priya Sharma\npriya@example.com\n\nEducation\nB.Sc. in Mathematics — Delhi University (2020 - 2023)\n\nSkills\nPython, SQL, Tableau',
          context_data_json: JSON.stringify({
            skills: ['Python', 'SQL', 'Tableau'],
            experience: [],
            education: ['B.Sc. in Mathematics — Delhi University (2020 - 2023)'],
            certifications: [],
          }),
        },
      },
    };

    const mockEnv = {
      SESSION_KV: {
        get: vi.fn().mockImplementation(async (key: string) => {
          if (key === 'session:valid-token') return 'candidate-1-jwt';
          return null;
        }),
      },
      RESUME_KV: { get: vi.fn(), put: vi.fn() },
      DB: {
        prepare: vi.fn((sql: string) => ({
          bind: vi.fn((...args: any[]) => ({
            first: vi.fn(async () => {
              if (sql.includes('FROM candidate_resume WHERE id = ?')) {
                return dbState[args[0]]?.resume || null;
              }
              if (sql.includes('FROM candidate_context WHERE resume_id = ?')) {
                return dbState[args[0]]?.context || null;
              }
              if (sql.includes('FROM user_account WHERE id = ?')) {
                return { full_name: 'Priya Sharma', email: 'priya@example.com' };
              }
              if (sql.includes('FROM candidate_profile WHERE user_id = ?')) {
                return { target_role: 'Data Analyst', experience_level: 'entry', bio: '' };
              }
              if (sql.includes('FROM job_description_context')) {
                return null; // No JD present
              }
              return null;
            }),
            all: vi.fn(async () => ({ results: [] })),
            run: vi.fn(async () => ({ success: true })),
          })),
        })),
      },
    };

    // Case A: Empty / NO_OCR resume must return 422 and refuse to generate an invalid DOCX
    const emptyReq = new Request('http://localhost/api/resume/res-empty-ocr/export?type=global', {
      method: 'GET',
      headers: { Cookie: 'intellihire_session=valid-token' },
    });
    const emptyRes = await app.request(emptyReq, {}, mockEnv as any);
    expect(emptyRes.status).toBe(422);
    const emptyJson = (await emptyRes.json()) as any;
    expect(emptyJson.error).toContain('no extractable text');

    // Case B: Sparse resume in tailored mode with missing JD gracefully exports only supported sections
    const sparseReq = new Request('http://localhost/api/resume/res-sparse-1/export?type=tailored', {
      method: 'GET',
      headers: { Cookie: 'intellihire_session=valid-token' },
    });
    const sparseRes = await app.request(sparseReq, {}, mockEnv as any);
    expect(sparseRes.status).toBe(200);
    const sparseBytes = new Uint8Array(await sparseRes.arrayBuffer());
    const { fullText } = extractDocxTextFromZip(sparseBytes);

    expect(fullText).toContain('Priya Sharma');
    expect(fullText).toContain('PROFESSIONAL SUMMARY');
    expect(fullText).toContain('TECHNICAL & CORE SKILLS');
    expect(fullText).toContain('EDUCATION');
    expect(fullText).toContain('B.Sc. in Mathematics  —  Delhi University   (2020 - 2023)');
    // Must omit empty sections
    expect(fullText).not.toContain('PROFESSIONAL EXPERIENCE');
    expect(fullText).not.toContain('KEY PROJECTS');
    expect(fullText).not.toContain('CERTIFICATIONS & CREDENTIALS');
  });

  it('7. Preserves all employers, job titles, dates, and bullets in a multi-role senior resume', async () => {
    const multiRoleRaw = `Vikramaditya Rao — Staff Systems Engineer
vikram@example.com | +1 415-555-0192

Summary
Staff Systems Engineer with 9 years of experience designing distributed storage engines and cloud platforms.

Experience
Staff Systems Engineer — Aurora Cloud Corp (2022 - Present)
- Led architecture of distributed key-value storage layer handling 2M operations per second
Principal Backend Engineer — Nexus Data Systems (2019 - 2022)
- Designed high-throughput PostgreSQL replication pipeline reducing failover recovery time by 65%
Senior Software Engineer — Orbit FinTech (2017 - 2019)
- Built low-latency payment settlement APIs in Go and Python with 99.99% availability
Software Engineer — Metro Tech Solutions (2015 - 2017)
- Developed internal telemetry dashboards in TypeScript and React

Education
M.S. in Computer Science — Georgia Institute of Technology (2013 - 2015)
`;
    const result = await generateValidatedStructuredResume({
      rawText: multiRoleRaw,
      parsedData: {
        skills: ['Go', 'Python', 'PostgreSQL', 'TypeScript', 'React', 'Distributed Systems'],
        experience: [
          { company: 'Aurora Cloud Corp', title: 'Staff Systems Engineer', duration: '2022 - Present' },
          { company: 'Nexus Data Systems', title: 'Principal Backend Engineer', duration: '2019 - 2022' },
          { company: 'Orbit FinTech', title: 'Senior Software Engineer', duration: '2017 - 2019' },
          { company: 'Metro Tech Solutions', title: 'Software Engineer', duration: '2015 - 2017' },
        ],
        education: ['M.S. in Computer Science — Georgia Institute of Technology (2013 - 2015)'],
      },
      mode: 'global',
      sourceResumeId: 'res-multi-role',
    });

    expect(result.validation.valid).toBe(true);
    expect(result.document?.experience).toHaveLength(4);

    const docxBytes = await renderStructuredResumeToDocx(result.document!);
    const { fullText } = extractDocxTextFromZip(docxBytes);

    expect(fullText).toContain('Aurora Cloud Corp');
    expect(fullText).toContain('Nexus Data Systems');
    expect(fullText).toContain('Orbit FinTech');
    expect(fullText).toContain('Metro Tech Solutions');
    expect(fullText).toContain('65%');
    expect(fullText).toContain('99.99%');
  });
});
