import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    verify: vi.fn().mockResolvedValue({ id: 'user-1', role: 'candidate' })
  };
});

function createMockEnv() {
  return {
    DB: {
      prepare: vi.fn().mockImplementation(() => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ raw_text: 'test jd', requirements_json: '[]', context_data_json: '{}' }),
        run: vi.fn().mockResolvedValue(true)
      }))
    },
    SESSION_KV: { get: vi.fn().mockResolvedValue('fake-jwt') },
    NVIDIA_API_KEY: 'test-nv-key',
    JWT_SECRET: 'test'
  };
}

describe('M1: JD and Matching API', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('JD Extraction: successful parsing sets requirements_json', async () => {
    const env = createMockEnv();
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '{"requirements": [{"requirement": "React", "category": "skill", "mandatory": true}]}' } }]
      })
    });

    const req = new Request('http://localhost/api/jd/analyze', {
      method: 'POST',
      headers: { Cookie: 'intellihire_session=session-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ jd_text: 'Requires React. This is a very long text to satisfy the minimum length requirement of 50 characters.' })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.jd_id).toBeDefined();
    expect(data.data.requirements[0].requirement).toBe('React');
  });

  it('Match Analysis: generates gap analysis', async () => {
    const env = createMockEnv();
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '{"ats_score": 85, "gap_analysis": [], "improvement_suggestions": []}' } }]
      })
    });

    const req = new Request('http://localhost/api/match/run', {
      method: 'POST',
      headers: { Cookie: 'intellihire_session=session-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_id: 'res-1', jd_id: 'jd-1' })
    });

    const res = await app.request(req, {}, env as any);
    const data = await res.json() as any;
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.ats_score).toBe(85);
  });
  
  it('Match Analysis: fails gracefully if API key is missing', async () => {
    const env = createMockEnv();
    env.NVIDIA_API_KEY = ''; // Missing
    
    const req = new Request('http://localhost/api/match/run', {
      method: 'POST',
      headers: { Cookie: 'intellihire_session=session-1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_id: 'res-1', jd_id: 'jd-1' })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(503);
  });
});
