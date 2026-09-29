import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'recruiter-token') {
      return { id: 'recruiter-1', role: 'recruiter', organization_id: 'org-1' };
    }
    if (token === 'candidate-token') {
      return { id: 'candidate-1', role: 'candidate', organization_id: 'org-1' };
    }
    throw new Error('Invalid token');
  })
}));

const createMockEnv = () => {
  const dbStore: any[] = [];
  return {
    DB: {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          run: vi.fn().mockResolvedValue({ success: true }),
          all: vi.fn().mockResolvedValue({ results: dbStore }), first: vi.fn().mockResolvedValue({ organization_id: 'org-1' })
        })
      })
    },
    SESSION_KV: {
      get: vi.fn().mockImplementation(async (id) => {
        if (id === 'session:recruiter-token') return 'recruiter-token';
        if (id === 'session:candidate-token') return 'candidate-token';
        return null;
      })
    }
  };
};

describe('Competency APIs (Slice 8)', () => {
  it('Recruiter can create a competency', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/competencies', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=recruiter-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Backend Engineering', description: 'Server logic' })
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.id).toBeDefined();
  });

  it('Candidate cannot create a competency', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/competencies', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=candidate-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Backend', description: 'Fail' })
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(401);
  });
});