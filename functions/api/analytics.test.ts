import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'recruiter-token') {
      return { id: 'recruiter-1', role: 'recruiter', organization_id: 'org-1' };
    }
    return null;
  })
}));

const createMockEnv = () => {
  return {
    DB: {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          first: vi.fn().mockResolvedValue({ cnt: 5, app_cnt: 10, avg_score: 85.5 }),
          all: vi.fn().mockResolvedValue({ results: [{ status: 'APPLIED', cnt: 10 }] })
        })
      })
    },
    SESSION_KV: {
      get: vi.fn().mockImplementation(async (id) => {
        if (id === 'session:recruiter-token') return 'recruiter-token';
        return null;
      })
    }
  };
};

describe('Enterprise Analytics (Slice 13)', () => {
  it('Returns pipeline metrics for recruiter', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/analytics/pipeline', {
      headers: { 'Cookie': 'intellihire_session=recruiter-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.metrics.open_requisitions).toBe(5);
    expect(data.metrics.avg_match_score).toBe(86);
  });
});