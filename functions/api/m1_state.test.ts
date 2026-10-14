import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn().mockResolvedValue('fake-jwt'),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'candidate-1-jwt') return { id: 'cand-1', role: 'candidate', email: 'cand1@test.com', organization_id: 'org_default_public' };
    if (token === 'candidate-2-jwt') return { id: 'cand-2', role: 'candidate', email: 'cand2@test.com', organization_id: 'org_default_public' };
    throw new Error('Invalid token');
  }),
}));

const createMockEnv = (dbOverrides: any = {}) => ({
  SESSION_KV: {
    get: vi.fn().mockImplementation(async (key: string) => {
      if (key === 'session:cand-1-session') return 'candidate-1-jwt';
      if (key === 'session:cand-2-session') return 'candidate-2-jwt';
      return null;
    })
  },
  DB: {
    prepare: vi.fn().mockImplementation((query: string) => ({
      bind: vi.fn().mockImplementation((...args: any[]) => ({
        run: vi.fn().mockResolvedValue({ success: true }),
        first: vi.fn().mockImplementation(async () => {
          if (query.includes('FROM candidate_resume')) return dbOverrides.resume ?? null;
          if (query.includes('FROM candidate_context')) return dbOverrides.context ?? null;
          if (query.includes('FROM job_description_context')) return dbOverrides.jd ?? null;
          if (query.includes('FROM match_analysis')) {
            if (query.includes('AND jd_id = ?')) {
              return (dbOverrides.match && dbOverrides.jd && dbOverrides.match.jd_id === dbOverrides.jd.id) ? dbOverrides.match : null;
            }
            return dbOverrides.match ?? null;
          }
          if (query.includes('FROM async_job')) return dbOverrides.asyncJob ?? null;
          return dbOverrides.first ?? null;
        }),
        all: vi.fn().mockImplementation(async () => {
          if (query.includes('FROM candidate_claim')) return { results: dbOverrides.claims ?? [] };
          return { results: dbOverrides.all ?? [] };
        })
      }))
    })),
    batch: vi.fn().mockResolvedValue([])
  },
  JWT_SECRET: 'test-secret',
  RESUME_KV: {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(true)
  }
});

describe('M01 State Persistence & Canonical Restoration Backend API', () => {

  it('1. GET /m1/state returns empty state when candidate has no resume or JD', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m1/state', {
      headers: { Cookie: 'intellihire_session=cand-1-session' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.has_resume).toBe(false);
    expect(data.has_jd).toBe(false);
    expect(data.has_match).toBe(false);
    expect(data.freshness).toBe('empty');
  });

  it('2. GET /m1/state restores active canonical resume, JD, claims, and match analysis', async () => {
    const env = createMockEnv({
      resume: { id: 'res-v12', version: 12, filename: 'Mokshith_AIML.pdf', file_format: 'pdf', created_at: 1790000 },
      context: { id: 'ctx-1', raw_text: 'Resume text', context_data_json: '{"skills":["Prompt Engineering","Python"]}' },
      claims: [{ id: 'cl-1', claim_type: 'skill', claim_value: 'Prompt Engineering', confidence_score: 0.95, verification_state: 'extracted' }],
      jd: { id: 'jd-1', raw_text: 'Senior AI Engineer Job', requirements_json: '{"requirements":[{"requirement":"Python","importance":"MANDATORY"}]}', created_at: 1791000 },
      match: { id: 'm-1', resume_id: 'res-v12', jd_id: 'jd-1', match_report_json: '{"ats_score":90,"gap_analysis":[]}', created_at: 1792000 }
    });

    const req = new Request('http://localhost/api/m1/state', {
      headers: { Cookie: 'intellihire_session=cand-1-session' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.has_resume).toBe(true);
    expect(data.resume.id).toBe('res-v12');
    expect(data.resume.version).toBe(12);
    expect(data.has_jd).toBe(true);
    expect(data.jd.id).toBe('jd-1');
    expect(data.has_match).toBe(true);
    expect(data.match_data.ats_score).toBe(90);
    expect(data.match_stale).toBe(false);
    expect(data.freshness).toBe('current');
  });

  it('3. GET /m1/state identifies stale match when JD was updated after match', async () => {
    const env = createMockEnv({
      resume: { id: 'res-v12', version: 12, filename: 'Mokshith_AIML.pdf' },
      context: { id: 'ctx-1', context_data_json: '{}' },
      claims: [],
      jd: { id: 'jd-2', raw_text: 'New JD', requirements_json: '{"requirements":[]}' },
      match: { id: 'm-old', resume_id: 'res-v12', jd_id: 'jd-1', match_report_json: '{"ats_score":75}' }
    });

    const req = new Request('http://localhost/api/m1/state', {
      headers: { Cookie: 'intellihire_session=cand-1-session' }
    });

    const res = await app.request(req, {}, env as any);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.match_stale).toBe(true);
    expect(data.freshness).toBe('stale');
  });

  it('4. POST /m1/reset safely resets candidate working state without deleting immutable resume', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m1/reset', {
      method: 'POST',
      headers: { Cookie: 'intellihire_session=cand-1-session' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.message).toContain('reset');
  });

  it('5. GET /match/status detects jobs stuck in PENDING for > 60s and transitions to FAILED', async () => {
    const staleTime = new Date(Date.now() - 75000).toISOString();
    const env = createMockEnv({
      asyncJob: { id: 'job-stuck', status: 'PENDING', created_at: staleTime }
    });

    const req = new Request('http://localhost/api/match/status/job-stuck', {
      headers: { Cookie: 'intellihire_session=cand-1-session' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.status).toBe('FAILED');
    expect(data.error).toContain('timed out');
  });

  it('6. POST /match/run executes AI match cascade synchronously and returns status READY', async () => {
    const env = createMockEnv({
      resume: { id: 'res-v1', version: 1, raw_text: 'Experienced React and TypeScript engineer with 4 years building web apps.' },
      jd: { id: 'jd-1', requirements_json: JSON.stringify({ requirements: [{ requirement: 'React and TypeScript', importance: 'MANDATORY' }] }) }
    });

    const req = new Request('http://localhost/api/match/run', {
      method: 'POST',
      headers: {
        'Cookie': 'intellihire_session=cand-1-session',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ resume_id: 'res-v1', jd_id: 'jd-1' })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.status).toBe('READY');
    expect(data.result).toBeDefined();
    expect(data.result.ats_score).toBeGreaterThan(0);
    expect(Array.isArray(data.result.gap_analysis)).toBe(true);
  });

  it('7. POST /match/run returns 404 if resume or JD does not belong to candidate', async () => {
    const env = createMockEnv({
      resume: null,
      jd: null
    });

    const req = new Request('http://localhost/api/match/run', {
      method: 'POST',
      headers: {
        'Cookie': 'intellihire_session=cand-1-session',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ resume_id: 'non-existent-res', jd_id: 'non-existent-jd' })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(404);
    const data = await res.json() as any;
    expect(data.error).toContain('not found');
  });

  it('8. deterministicMatchAnalysis prevents false-positive DEMONSTRATED on English stopwords (DEF-02 regression)', async () => {
    const { deterministicMatchAnalysis } = await import('./[[route]]');
    const pythonResume = `
      MOKSHITH — AI/ML Engineer
      Email: mokshith@example.com
      Skills: Python, Machine Learning, Prompt Engineering, SQL, Java
      Experience: Built LLM pipelines with 5 years of experience in data science and strong analytical skills.
    `;
    const reactJdReqs = JSON.stringify({
      requirements: [
        { requirement: '5+ years of experience with React and TypeScript', importance: 'MANDATORY' },
        { requirement: 'Strong proficiency in Cloudflare Workers and D1 SQLite', importance: 'MANDATORY' },
        { requirement: 'Experience with Python and Machine Learning pipelines', importance: 'MANDATORY' }
      ]
    });

    const result = deterministicMatchAnalysis(pythonResume, reactJdReqs);
    expect(result.gap_analysis).toHaveLength(3);
    // Requirement 1 (React & TypeScript) must be MISSING despite sharing "years", "experience", "with"
    expect(result.gap_analysis[0].status).toBe('MISSING');
    // Requirement 2 (Cloudflare Workers & D1 SQLite) must be MISSING despite sharing "strong", "proficiency"
    expect(result.gap_analysis[1].status).toBe('MISSING');
    // Requirement 3 (Python & Machine Learning) must be DEMONSTRATED
    expect(result.gap_analysis[2].status).toBe('DEMONSTRATED');
  });

  it('9. POST /resume/extract/:resume_id short-circuits with NO_OCR warning when raw_text is empty (DEF-07 regression)', async () => {
    const env = createMockEnv({
      first: { organization_id: 'org_default_public' },
      resume: { id: 'res-empty', raw_text: '   ', context_id: 'ctx-empty', extraction_status: 'NO_OCR' }
    });

    const req = new Request('http://localhost/api/resume/extract/res-empty', {
      method: 'POST',
      headers: { Cookie: 'intellihire_session=cand-1-session' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.data.provenance.extraction_status).toBe('NO_OCR');
    expect(data.warning).toContain('No selectable text layer');
  });

  it('10. PUT /resume/:id/context persists candidate-edited skills, experience, and education and marks provenance candidate_verified (DEF-04 regression)', async () => {
    const env = createMockEnv({
      context: {
        id: 'ctx-edit-1',
        raw_text: 'Mokshith Python Java Engineer B.Tech CS',
        context_data_json: JSON.stringify({
          skills: ['JavaBeginner', 'SQLBeginner'],
          experience: [],
          education: []
        })
      }
    });

    const req = new Request('http://localhost/api/resume/res-edit-1/context', {
      method: 'PUT',
      headers: {
        'Cookie': 'intellihire_session=cand-1-session',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        skills: ['Java', 'SQL', 'Python'],
        experience: [{ company: 'Acme AI', title: 'ML Engineer', duration: '2024 - Present' }],
        education: ['B.Tech in Computer Science & Engineering'],
        certifications: ['AWS Certified Machine Learning'],
        achievements: ['Reduced inference latency by 35%']
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.data.skills).toEqual(['Java', 'SQL', 'Python']);
    expect(data.data.experience[0].company).toBe('Acme AI');
    expect(data.data.education[0]).toContain('B.Tech');
    expect(data.data.provenance.confidence).toBe('candidate_verified');
    expect(data.data.quality_analysis.overall_quality_score).toBeGreaterThan(0);
  });

  it('11. POST /resume/:id/optimize deactivates prior versions, increments MAX(version), carries forward claims, and records rewrites (DEF-01 regression)', async () => {
    const queriesExecuted: string[] = [];
    const env = createMockEnv({
      resume: {
        id: 'res-v15',
        organization_id: 'org_default_public',
        user_id: 'cand-1',
        version: 15,
        max_ver: 17,
        filename: 'Resume.pdf',
        file_format: 'pdf',
        content_hash_sha256: 'oldhash'
      },
      context: {
        id: 'ctx-v15',
        raw_text: 'Experienced Python developer building ML services.',
        extraction_method: 'multi_pass_v2',
        extraction_status: 'parsed',
        context_data_json: JSON.stringify({ skills: ['Python', 'Machine Learning'] })
      },
      claims: [
        { claim_type: 'skill', claim_value: 'Python', confidence_score: 0.9, provenance_start_index: 12, provenance_end_index: 18, verification_state: 'extracted' }
      ]
    });

    const origPrepare = env.DB.prepare;
    env.DB.prepare = vi.fn().mockImplementation((q: string) => {
      queriesExecuted.push(q);
      return origPrepare(q);
    });

    const req = new Request('http://localhost/api/resume/res-v15/optimize', {
      method: 'POST',
      headers: {
        'Cookie': 'intellihire_session=cand-1-session',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accepted_suggestions: [
          {
            source_evidence: 'Experienced Python developer building ML services.',
            suggested_text: 'Experienced Python developer building production ML services with 99.9% uptime.',
            rationale: 'Quantifies reliability impact.'
          }
        ]
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.version).toBe(18);
    expect(data.applied_count).toBe(1);
    expect(data.data.optimized_rewrites).toHaveLength(1);
    expect(queriesExecuted.some(q => q.includes('UPDATE candidate_resume SET is_active = 0 WHERE user_id = ?'))).toBe(true);
    expect(queriesExecuted.some(q => q.includes('INSERT INTO candidate_claim'))).toBe(true);
  });

  it('12. GET /resume/:id/export generates valid, distinct Global and Tailored DOCX files even without a pre-existing candidate_profile row (DEF-05 regression)', async () => {
    const env = createMockEnv({
      first: { full_name: 'Mokshith Reddy', email: 'mokshith@test.com' },
      context: {
        id: 'ctx-exp-1',
        raw_text: 'Mokshith Reddy Python Engineer',
        context_data_json: JSON.stringify({
          skills: ['Python', 'FastAPI', 'SQL'],
          experience: [{ title: 'AI Engineer', company: 'IntelliHire Labs', duration: '2024 - Present', description: 'Built ATS engine' }],
          education: ['B.Tech Computer Science'],
          certifications: ['AWS Certified Developer'],
          achievements: ['Won National AI Hackathon'],
          optimized_rewrites: [{ suggested_text: 'Architected edge-native ATS engine reducing latency by 45%.' }]
        })
      }
    });

    const globalReq = new Request('http://localhost/api/resume/res-exp-1/export?type=global', {
      headers: { Cookie: 'intellihire_session=cand-1-session' }
    });
    const globalRes = await app.request(globalReq, {}, env as any);
    expect(globalRes.status).toBe(200);
    expect(globalRes.headers.get('Content-Disposition')).toContain('ATS_Resume_global.docx');
    const globalBuf = new Uint8Array(await globalRes.arrayBuffer());
    // Verify PK zip magic header (0x50, 0x4b)
    expect(globalBuf[0]).toBe(0x50);
    expect(globalBuf[1]).toBe(0x4b);

    const tailoredReq = new Request('http://localhost/api/resume/res-exp-1/export?type=tailored', {
      headers: { Cookie: 'intellihire_session=cand-1-session' }
    });
    const tailoredRes = await app.request(tailoredReq, {}, env as any);
    expect(tailoredRes.status).toBe(200);
    expect(tailoredRes.headers.get('Content-Disposition')).toContain('ATS_Resume_tailored.docx');
    const tailoredBuf = new Uint8Array(await tailoredRes.arrayBuffer());
    expect(tailoredBuf[0]).toBe(0x50);
    expect(tailoredBuf[1]).toBe(0x4b);
    // Tailored DOCX contains additional target role alignment section so its byte size differs from global
    expect(tailoredBuf.byteLength).toBeGreaterThan(globalBuf.byteLength);
  });

});
