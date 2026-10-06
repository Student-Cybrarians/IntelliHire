import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn().mockResolvedValue('fake-jwt'),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'fake-jwt') return { id: 'rec-1', role: 'recruiter', full_name: 'Rec', email: 'test@recruiter.com' };
    throw new Error('Invalid');
  }),
}));

const createMockEnv = () => ({
  SESSION_KV: {
    get: vi.fn().mockImplementation(async (key) => {
      if (key === 'session:rec-session') return 'fake-jwt';
      return null;
    })
  },
  DB: {
    prepare: vi.fn().mockImplementation(() => ({
      bind: vi.fn().mockImplementation(() => ({
        run: vi.fn().mockResolvedValue({ success: true }),
        first: vi.fn().mockResolvedValue({ id: 'mock-id', raw_text: 'mock', requirements_json: '{}', max_v: 1, context_data_json: '{}' }),
        all: vi.fn().mockResolvedValue({ results: [] })
      }))
    }))
  },
  NVIDIA_API_KEY: 'test-key',
  JWT_SECRET: 'test-secret'
});

describe('M1: JD and Matching API', () => {

  it('JD Extraction: successful parsing sets requirements_json', async () => {
    const req = new Request('http://localhost/api/jd/analyze', {
      method: 'POST',
      body: JSON.stringify({ jd_text: 'We are looking for a highly skilled software engineer with at least 5 years of Python experience to join our fast-paced startup environment and help build scalable backend microservices.', name: 'test', description: 'test' })
    });
    req.headers.set('Cookie', 'intellihire_session=rec-session');

    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: '```json\n{"requirements": []}\n```' } }]
    }))) as any;

    const res = await app.request(req, {}, createMockEnv() as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.jd_id).toBeDefined();
  });

  it('Match Analysis: executes match analysis and returns READY result', async () => {
    const req = new Request('http://localhost/api/match/run', {
      method: 'POST',
      body: JSON.stringify({ resume_id: 'r1', jd_id: 'j1' })
    });
    req.headers.set('Cookie', 'intellihire_session=rec-session');

    const res = await app.request(req, {}, createMockEnv() as any);
    const data = await res.json() as any;
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe('READY');
  });

});
