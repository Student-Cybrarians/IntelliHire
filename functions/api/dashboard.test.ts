import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn().mockResolvedValue('fake-jwt'),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'candidate-jwt') return { id: 'cand-1', role: 'candidate', full_name: 'Cand' };
    if (token === 'recruiter-jwt') return { id: 'rec-1', role: 'recruiter', full_name: 'Rec' };
    if (token === 'admin-jwt') return { id: 'admin-1', role: 'org_admin', full_name: 'Admin' };
    throw new Error('Invalid');
  }),
}));

const createMockEnv = (dbOverrides: any = {}) => ({
  DB: {
    prepare: vi.fn().mockImplementation(() => {
      return {
        bind: vi.fn().mockImplementation(() => {
          return {
            first: vi.fn().mockResolvedValue(dbOverrides.first || null),
            run: vi.fn().mockResolvedValue(true),
            all: vi.fn().mockResolvedValue(dbOverrides.all || { results: [] }),
          };
        })
      };
    }),
  },
  SESSION_KV: {
    get: vi.fn().mockImplementation(async (key) => {
      if (key === 'session:cand-session') return 'candidate-jwt';
      if (key === 'session:rec-session') return 'recruiter-jwt';
      if (key === 'session:admin-session') return 'admin-jwt';
      return null;
    }),
  },
  JWT_SECRET: 'test-secret',
});

describe('Dashboard APIs (RBAC & Tenant Scoping)', () => {

  it('Candidate Dashboard - accessible to candidate', async () => {
    const env = createMockEnv({ first: { target_role: 'Engineer' } });
    const req = new Request('http://localhost/api/dashboard/candidate', {
      headers: { Cookie: 'intellihire_session=cand-session' }
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.profile.target_role).toBe('Engineer');
  });

  it('Candidate Dashboard - blocked for recruiter', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/dashboard/candidate', {
      headers: { Cookie: 'intellihire_session=rec-session' }
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(401);
  });

  it('Recruiter Dashboard - accessible to recruiter', async () => {
    const env = createMockEnv({ first: { organization_id: 'org-1', total_candidates: 42 } });
    const req = new Request('http://localhost/api/dashboard/recruiter', {
      headers: { Cookie: 'intellihire_session=rec-session' }
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.pipeline_stats.total_candidates).toBe(42);
  });

  it('Recruiter Dashboard - blocked for candidate', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/dashboard/recruiter', {
      headers: { Cookie: 'intellihire_session=cand-session' }
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(401);
  });
  
  it('Resume Status - correctly returns 200 after extraction', async () => {
    const env = createMockEnv({
      first: { id: 'res-1', filename: 'resume.pdf', version: 1, extraction_status: 'parsed' }
    });
    const req = new Request('http://localhost/api/resume/status', {
      headers: { Cookie: 'intellihire_session=cand-session' }
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.status).toBe('processed');
    expect(data.data_state).toBe('current');
  });

  it('Resume Status - returns empty data_state when no resume exists', async () => {
    const env = createMockEnv({ first: null });
    const req = new Request('http://localhost/api/resume/status', {
      headers: { Cookie: 'intellihire_session=cand-session' }
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.status).toBe('empty');
    expect(data.data_state).toBe('empty');
  });
});
