import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn().mockResolvedValue('fake-jwt'),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'candidate-jwt') return { id: 'cand-1', role: 'candidate' };
    if (token === 'recruiter-jwt') return { id: 'rec-1', role: 'recruiter' };
    return null;
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
            all: vi.fn().mockResolvedValue({ results: dbOverrides.all || [] }),
          };
        })
      };
    }),
  },
  SESSION_KV: {
    get: vi.fn().mockImplementation(async (key) => {
      if (key === 'session:cand-session') return 'candidate-jwt';
      if (key === 'session:rec-session') return 'recruiter-jwt';
      return null;
    }),
  },
  JWT_SECRET: 'test',
  AI: { run: vi.fn().mockResolvedValue({ response: '{"score":85,"reasoning":"test"}' }) },
});


describe('Requisition APIs (Slice 5)', () => {
  it('Candidate cannot create a requisition', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/requisitions', {
      method: 'POST',
      headers: { Cookie: 'intellihire_session=cand-session', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Engineer' })
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(401);
  });

  it('Recruiter can create a requisition', async () => {
    const env = createMockEnv({ first: { organization_id: 'org-1' } });
    const req = new Request('http://localhost/api/requisitions', {
      method: 'POST',
      headers: { Cookie: 'intellihire_session=rec-session', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Engineer' })
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
  });

  it('Candidate can fetch requisitions', async () => {
    const env = createMockEnv({ first: { organization_id: 'org-1' }, all: [{ id: 'req-1', title: 'Eng' }] });
    const req = new Request('http://localhost/api/requisitions', {
      headers: { Cookie: 'intellihire_session=cand-session' }
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.requisitions.length).toBe(1);
  });

  it('Candidate can apply to a requisition', async () => {
    const env = createMockEnv({ first: { organization_id: 'org-1', id: 'req-1' } });
    const req = new Request('http://localhost/api/requisitions/req-1/apply', {
      method: 'POST',
      headers: { Cookie: 'intellihire_session=cand-session' }
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
  });
});