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
          first: vi.fn().mockImplementation(async () => {
            if (query.includes('FROM user_account')) return { organization_id: 'org-1' };
            if (query.includes('FROM candidate_application')) return { status: 'APPLIED', organization_id: 'org-1' };
            return null;
          }),
          run: vi.fn().mockResolvedValue({ success: true })
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

describe('Pipeline State Machine (Slice 11)', () => {
  it('Recruiter can update application status to INTERVIEW', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/applications/app-1/status', {
      method: 'PATCH',
      headers: { 'Cookie': 'intellihire_session=recruiter-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'INTERVIEW' })
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.status).toBe('INTERVIEW');
  });

  it('Rejects invalid status transitions', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/applications/app-1/status', {
      method: 'PATCH',
      headers: { 'Cookie': 'intellihire_session=recruiter-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SUPER_ADMIN_MODE' })
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(400);
  });
});