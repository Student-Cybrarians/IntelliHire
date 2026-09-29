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
          run: vi.fn().mockResolvedValue({ success: true })
        }),
        all: vi.fn().mockResolvedValue({
          results: [
            { id: 'p1', user_id: 'u1', target_role: 'Frontend', experience_level: 'mid', bio: 'React dev', embedding_json: JSON.stringify([0.9, 0.1]), full_name: 'Alice', email: 'alice@test.com' },
            { id: 'p2', user_id: 'u2', target_role: 'Backend', experience_level: 'senior', bio: 'Node dev', embedding_json: JSON.stringify([0.1, 0.9]), full_name: 'Bob', email: 'bob@test.com' }
          ]
        })
      })
    },
    AI: {
      run: vi.fn().mockImplementation(async (model, input) => {
        if (input.text[0].toLowerCase().includes('frontend')) {
          return { data: [[0.8, 0.2]] };
        }
        return { data: [[0.5, 0.5]] };
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

describe('Semantic Search (Slice 12)', () => {
  it('Returns candidates sorted by similarity', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/search/candidates?q=frontend', {
      headers: { 'Cookie': 'intellihire_session=recruiter-token' }
    });
    
    // We must pass executionCtx mock as well because of c.executionCtx.waitUntil
    const executionCtx = { waitUntil: vi.fn() };

    const res = await app.request(req, {}, env as any, executionCtx as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.results.length).toBe(2);
    // Alice should be first because her embedding [0.9, 0.1] is closer to [0.8, 0.2]
    expect(data.results[0].full_name).toBe('Alice');
    expect(data.results[1].full_name).toBe('Bob');
  });

  it('Rejects missing query', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/search/candidates', {
      headers: { 'Cookie': 'intellihire_session=recruiter-token' }
    });
    const res = await app.request(req, {}, env as any, { waitUntil: vi.fn() } as any);
    expect(res.status).toBe(400);
  });
});