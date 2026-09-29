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
          first: vi.fn().mockResolvedValue({ skill_name: 'SQL', comp_name: 'DB', skill_desc: 'Data' }),
          run: vi.fn().mockResolvedValue({ success: true }),
          all: vi.fn().mockResolvedValue({ results: [] })
        })
      })
    },
    SESSION_KV: {
      get: vi.fn().mockImplementation(async (id) => {
        if (id === 'session:recruiter-token') return 'recruiter-token';
        return null;
      })
    },
    AI: {
      run: vi.fn().mockResolvedValue({
        response: '{"question_text":"What is SELECT?","options":["A","B","C","D"],"correct_answer":"A","difficulty_level":2,"traceability_reason":"Basic SQL"}'
      })
    }
  };
};

describe('Assessment APIs (Slice 9)', () => {
  it('Recruiter can generate an AI assessment item', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/assessment/generate', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=recruiter-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill_id: 'skill-1' })
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.item.question_text).toBe('What is SELECT?');
    expect(env.AI.run).toHaveBeenCalled();
  });
});