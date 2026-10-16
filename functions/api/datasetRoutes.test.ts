/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';

describe('Audited Dataset & Resources Registry API', () => {
  const createMockEnv = () => ({
    DB: {
      prepare: vi.fn().mockImplementation((query: string) => ({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockImplementation(async () => {
          if (query.includes('FROM dataset_source')) {
            return {
              results: [
                {
                  source_id: 'ONET_CONTENT_MODEL',
                  source_name: 'USDOL O*NET Database',
                  module_alignment: 'M01',
                  official_url: 'https://www.onetcenter.org/database.html',
                  license: 'CC-BY 4.0',
                  redistribution_terms: 'Attribution required; commercial redistribution permitted',
                  provenance_type: 'OPEN_STANDARD_TAXONOMY',
                  compliance_status: 'ACTIVE_INGESTED',
                  verified_record_count: 4,
                  historical_claimed_count: '5,000+ job descriptions',
                  notes: 'Official U.S. Department of Labor standard'
                },
                {
                  source_id: 'FER2013_RESEARCH_BENCHMARK',
                  source_name: 'FER2013 Facial Expression Recognition Dataset',
                  module_alignment: 'BENCHMARK_EVALUATION_ONLY',
                  official_url: 'https://www.kaggle.com/c/challenges-in-representation-learning-facial-expression-recognition-challenge',
                  license: 'Open Access Research Benchmark',
                  redistribution_terms: 'Non-commercial research only',
                  provenance_type: 'RESEARCH_BENCHMARK',
                  compliance_status: 'EXCLUDED_ETHICAL_POLICY',
                  verified_record_count: 0,
                  historical_claimed_count: '35,887 grayscale 48x48 faces',
                  notes: 'Strictly prohibited from production candidate evaluation'
                }
              ]
            };
          }
          if (query.includes('FROM learning_resource')) {
            return {
              results: [
                {
                  id: 'RES-ONET-01',
                  source_id: 'ONET_CONTENT_MODEL',
                  module: 'M01',
                  resource_type: 'job_description',
                  domain: 'Software Engineering',
                  title: 'Senior Software Engineer (Backend Systems)',
                  description: 'Standard O*NET-aligned job specification for backend engineering.',
                  content_json: JSON.stringify({ soc_code: '15-1252.00', experience_level: 'Senior' }),
                  bloom_level: null,
                  license: 'CC-BY 4.0',
                  verified_by: 'Curator'
                }
              ]
            };
          }
          return { results: [] };
        }),
        first: vi.fn().mockImplementation(async () => {
          if (query.includes('FROM learning_resource WHERE id = ?')) {
            return {
              id: 'RES-RESUME-01',
              source_id: 'CURATED_SYNTHETIC_BENCHMARK',
              module: 'M01',
              resource_type: 'benchmark_resume',
              content_json: JSON.stringify({
                candidate_name: 'Alex Rivera',
                target_role: 'Senior Full Stack Cloud Engineer',
                filename: 'Alex_Rivera_Cloud_Engineer.txt',
                skills: ['TypeScript', 'React', 'Node.js', 'Cloudflare Workers', 'PostgreSQL', 'Docker'],
                raw_text: 'Alex Rivera - Senior Full Stack Cloud Engineer'
              })
            };
          }
          if (query.includes('SELECT id FROM candidate_resume WHERE organization_id = ? AND user_id = ?')) {
            return { id: 'existing-resume-uuid' };
          }
          return null;
        }),
        run: vi.fn().mockResolvedValue({ success: true })
      }))
    },
    RESUME_KV: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(true)
    },
    SESSION_KV: {
      get: vi.fn().mockImplementation(async (key: string) => {
        if (key === 'sess_dataset_test' || key === 'session:sess_dataset_test') {
          return JSON.stringify({
            id: 'usr_dataset_123',
            email: 'candidate@intellihire.test',
            full_name: 'Candidate Test',
            role: 'candidate',
            organization_id: 'org_test_123'
          });
        }
        return null;
      }),
      put: vi.fn().mockResolvedValue(true)
    }
  });

  it('GET /api/datasets/registry returns canonical audited sources and ethical exclusions', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/datasets/registry', {
      method: 'GET'
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(Array.isArray(body.sources)).toBe(true);
    expect(body.sources.length).toBeGreaterThanOrEqual(6);

    // Verify FER2013 and AffectNet are excluded per ethical policy
    const ferSource = body.sources.find((s: any) => s.code === 'FER2013_AFFECTNET_RESEARCH' || s.id === 'src-research-fer2013-affectnet');
    expect(ferSource).toBeDefined();
    expect(ferSource.complianceStatus).toBe('EXCLUDED_ETHICAL_POLICY');
    expect(ferSource.verifiedRecordCount).toBe(0);

    // Verify O*NET has active ingested status
    const onetSource = body.sources.find((s: any) => s.code === 'ONET_JOB_CORPUS' || s.id === 'src-m01-onet-jobs');
    expect(onetSource).toBeDefined();
    expect(onetSource.complianceStatus).toBe('APPROVED_ACTIVE');
    expect(onetSource.verifiedRecordCount).toBeGreaterThan(0);
  });

  it('GET /api/datasets/sample-jds returns standard job descriptions', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/datasets/sample-jds', {
      method: 'GET'
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].soc_code).toBeDefined();
    expect(body.data[0].role_title).toBeDefined();
  });

  it('GET /api/datasets/sample-resumes returns CC0 benchmark candidate profiles with zero PII', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/datasets/sample-resumes', {
      method: 'GET'
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].skills.length).toBeGreaterThan(0);
    expect(body.data[0].candidate_name).toBeDefined();
  });

  it('POST /api/datasets/load-benchmark-resume loads benchmark resume into candidate context', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/datasets/load-benchmark-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'intellihire_session=sess_dataset_test'
      },
      body: JSON.stringify({ benchmark_id: 'res-m01-resume-backend-senior' })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.resume_id).toBeDefined();
    expect(body.context_data.skills).toContain('Go');
    expect(body.context_data.skills).toContain('PostgreSQL & Query Optimization');
  });
});
