import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    verify: vi.fn().mockResolvedValue({ id: 'user-1', role: 'candidate' })
  };
});

function createMockEnv() {
  return {
    DB: {
      prepare: vi.fn().mockImplementation((sql: string) => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockImplementation(async () => {
          if (sql.includes('user_account')) return { organization_id: 'org-1' };
          if (sql.includes('MAX(version)')) return { max_v: 1 };
          return { raw_text: 'test jd', requirements_json: '[]', context_data_json: '{}' };
        }),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue(true)
      }))
    },
    SESSION_KV: { get: vi.fn().mockResolvedValue('fake-jwt') },
    RESUME_KV: { put: vi.fn().mockResolvedValue(true) },
    NVIDIA_API_KEY: 'test-nv-key',
    JWT_SECRET: 'test'
  };
}

describe('M1: Global Career Intelligence & ATS API', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('Taxonomy Categories: returns multi-domain career categories', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/taxonomy/categories');
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.domains).toBeDefined();
    expect(data.domains.length).toBeGreaterThanOrEqual(9);
    
    // Verify multi-domain coverage: Tech, Healthcare, Trades, Legal, Corp
    const domainIds = data.domains.map((d: any) => d.id);
    expect(domainIds).toContain('dom_tech');
    expect(domainIds).toContain('dom_health');
    expect(domainIds).toContain('dom_trades');
    expect(domainIds).toContain('dom_legal');
    expect(domainIds).toContain('dom_corp');
  });

  it('Manual Profile Ingestion: saves candidate profile without file upload', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/resume/manual', {
      method: 'POST',
      headers: { Cookie: 'intellihire_session=session-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Dr. Sarah Connor',
        target_role: 'Clinical Research Physician',
        target_domain: 'dom_health',
        seniority_level: 'Senior Specialist',
        summary: 'Cardiovascular researcher with 8 years in phase III clinical trials.',
        skills: ['Clinical Trials', 'GCP Compliance', 'Cardiology', 'Data Analysis'],
        experiences: [
          { company: 'Metro Health', title: 'Principal Investigator', years: '2020-2025', description: 'Led 12 clinical trials.' }
        ],
        education: ['MD - State University School of Medicine'],
        certifications: ['Board Certified in Internal Medicine', 'GCP Certified']
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.resumeId).toBeDefined();
    expect(data.data.skills).toContain('Cardiology');
    expect(data.raw_text).toContain('Dr. Sarah Connor');
  });

  it('JD Extraction: successful parsing sets requirements_json', async () => {
    const env = createMockEnv();
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '{"requirements": [{"requirement": "React", "category": "skill", "mandatory": true}]}' } }]
      })
    });

    const req = new Request('http://localhost/api/jd/analyze', {
      method: 'POST',
      headers: { Cookie: 'intellihire_session=session-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ jd_text: 'Requires React. This is a very long text to satisfy the minimum length requirement of 50 characters.' })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.jd_id).toBeDefined();
    expect(data.data.requirements[0].requirement).toBe('React');
  });

  it('Match Analysis: generates gap analysis and dual-engine composite score', async () => {
    const env = createMockEnv();
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '{"ats_score": 85, "semantic_fit_score": 88, "gap_analysis": [], "improvement_suggestions": [], "transferable_skills": []}' } }]
      })
    });

    const req = new Request('http://localhost/api/match/run', {
      method: 'POST',
      headers: { Cookie: 'intellihire_session=session-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_id: 'res-1', jd_id: 'jd-1' })
    });

    const res = await app.request(req, {}, env as any);
    const data = await res.json() as any;
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.ats_score).toBe(85);
    expect(data.data.deterministic).toBeDefined();
  });

  it('Targeted Variant Generation: generates evidence-grounded variant', async () => {
    const env = createMockEnv();
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        choices: [{
          message: {
            content: '{"targeted_resume_markdown": "# Targeted Resume\\nExperienced Engineer", "tailoring_summary": ["Aligned terminology"], "integrity_attestation": "All included content is grounded strictly in supplied source evidence."}'
          }
        }]
      })
    });

    const req = new Request('http://localhost/api/resume/variant', {
      method: 'POST',
      headers: { Cookie: 'intellihire_session=session-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_id: 'res-1', jd_id: 'jd-1' })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.variant_markdown).toContain('Targeted Resume');
    expect(data.integrity_attestation).toContain('grounded strictly in supplied source evidence');
  });

  it('Match Analysis: fails gracefully if API key is missing', async () => {
    const env = createMockEnv();
    env.NVIDIA_API_KEY = ''; // Missing
    
    const req = new Request('http://localhost/api/match/run', {
      method: 'POST',
      headers: { Cookie: 'intellihire_session=session-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_id: 'res-1', jd_id: 'jd-1' })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(503);
  });
});
