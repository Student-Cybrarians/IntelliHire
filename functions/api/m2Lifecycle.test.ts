import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'candidate-token') {
      return { id: 'candidate-1', role: 'candidate', organization_id: 'org_default_public' };
    }
    return null;
  })
}));

const createMockEnv = (overrides: Record<string, any> = {}) => {
  return {
    DB: {
      prepare: vi.fn().mockImplementation((query: string) => ({
        bind: vi.fn().mockImplementation((...args: any[]) => ({
          first: vi.fn().mockImplementation(async () => {
            if (overrides.first) return overrides.first(query, args);
            if (query.includes('user_account')) {
              return { id: 'candidate-1', organization_id: 'org_default_public' };
            }
            if (query.includes('FROM assessment_attempt') && query.includes("status = 'in_progress'")) {
              return overrides.activeAttempt || null;
            }
            if (query.includes('FROM assessment_blueprint')) {
              return { id: 'bp_general_tech', target_role: 'General Software Engineer', configuration_json: '{"title":"General Tech"}' };
            }
            if (query.includes('FROM assessment_item_v2')) {
              return {
                id: 'item-ts-1',
                skill_id: 'skill-ts',
                item_type: 'multiple_choice',
                content_json: JSON.stringify({
                  question: 'What is a discriminated union?',
                  options: ['A', 'B'],
                  correct_answer: 'A'
                }),
                difficulty_level: 2
              };
            }
            return null;
          }),
          run: vi.fn().mockResolvedValue({ success: true }),
          all: vi.fn().mockImplementation(async () => {
            if (overrides.all) return overrides.all(query, args);
            if (query.includes('FROM assessment_blueprint')) {
              return {
                results: [
                  {
                    id: 'bp_general_tech',
                    organization_id: 'org_default_public',
                    target_role: 'General Software Engineer',
                    configuration_json: '{"title":"General Technical Aptitude & Systems Engineering"}',
                    version: 1,
                    is_active: 1
                  }
                ]
              };
            }
            if (query.includes('candidate_skill_proficiency_v2')) {
              return {
                results: [
                  {
                    id: 'prof-1',
                    user_id: 'candidate-1',
                    skill_id: 'skill-ts',
                    skill_name: 'TypeScript & Architecture',
                    proficiency_estimate: 0.85,
                    uncertainty_estimate: 0.15,
                    evidence_status: 'assessed'
                  }
                ]
              };
            }
            if (query.includes('candidate_gap')) {
              return { results: [] };
            }
            return { results: [] };
          })
        }))
      }))
    },
    SESSION_KV: {
      get: vi.fn().mockImplementation(async (id) => {
        if (id === 'session:candidate-token') return 'candidate-token';
        return null;
      })
    },
    AI: {
      run: vi.fn().mockResolvedValue({ response: '{}' })
    }
  };
};

describe('M02 Assessment Initialization, Idempotency & Lifecycle Reliability', () => {
  it('GET /api/m2/blueprints returns success: true and parsed blueprint titles', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m2/blueprints', {
      headers: { 'Cookie': 'intellihire_session=candidate-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(Array.isArray(data.blueprints)).toBe(true);
    expect(data.blueprints.length).toBeGreaterThan(0);
    expect(data.blueprints[0].title).toBe('General Technical Aptitude & Systems Engineering');
  });

  it('POST /api/m2/attempts auto-resolves blueprint when blueprint_id is null and returns success contract', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m2/attempts', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=candidate-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ blueprint_id: null })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.attempt_id).toBeDefined();
    expect(data.id).toBeDefined();
    expect(data.status).toBe('in_progress');
  });

  it('POST /api/m2/attempts resumes existing in-progress attempt idempotently', async () => {
    const activeAttempt = {
      id: 'existing-active-attempt-uuid',
      blueprint_id: 'bp_general_tech',
      status: 'in_progress',
      adaptive_state_json: '{"usedItems":[],"itemCount":0}'
    };
    const env = createMockEnv({ activeAttempt });

    const req = new Request('http://localhost/api/m2/attempts', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=candidate-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ blueprint_id: null })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.attempt_id).toBe('existing-active-attempt-uuid');
    expect(data.resumed).toBe(true);
  });

  it('GET /api/m2/attempts/active returns in-progress attempt for session resumption', async () => {
    const activeAttempt = {
      id: 'active-attempt-456',
      status: 'in_progress',
      blueprint_id: 'bp_general_tech'
    };
    const env = createMockEnv({ activeAttempt });

    const req = new Request('http://localhost/api/m2/attempts/active', {
      headers: { 'Cookie': 'intellihire_session=candidate-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.attempt?.id).toBe('active-attempt-456');
  });

  it('GET /api/m2/attempts/:id/next returns success: true and formatted item', async () => {
    const env = createMockEnv({
      first: (query: string) => {
        if (query.includes('FROM assessment_attempt')) {
          return {
            id: 'attempt-123',
            user_id: 'candidate-1',
            status: 'in_progress',
            adaptive_state_json: '{"usedItems":[],"itemCount":0}'
          };
        }
        if (query.includes('FROM assessment_item_v2')) {
          return {
            id: 'item-1',
            skill_id: 'skill-ts',
            item_type: 'multiple_choice',
            content_json: '{"question":"What is TS?","options":["A","B"],"correct_answer":"A"}',
            difficulty_level: 2
          };
        }
        return null;
      }
    });

    const req = new Request('http://localhost/api/m2/attempts/attempt-123/next', {
      headers: { 'Cookie': 'intellihire_session=candidate-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.completed).toBe(false);
    expect(data.item).toBeDefined();
    expect(data.item.id).toBe('item-1');
  });

  it('GET /api/m2/proficiency and GET /api/m2/gaps return success contracts with evidence', async () => {
    const env = createMockEnv();

    const profReq = new Request('http://localhost/api/m2/proficiency', {
      headers: { 'Cookie': 'intellihire_session=candidate-token' }
    });
    const profRes = await app.request(profReq, {}, env as any);
    expect(profRes.status).toBe(200);
    const profData = await profRes.json() as any;
    expect(profData.success).toBe(true);
    expect(Array.isArray(profData.proficiency)).toBe(true);

    const gapReq = new Request('http://localhost/api/m2/gaps', {
      headers: { 'Cookie': 'intellihire_session=candidate-token' }
    });
    const gapRes = await app.request(gapReq, {}, env as any);
    expect(gapRes.status).toBe(200);
    const gapData = await gapRes.json() as any;
    expect(gapData.success).toBe(true);
    expect(Array.isArray(gapData.gaps)).toBe(true);
  });
});
