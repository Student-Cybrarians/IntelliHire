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
    }))
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

});
