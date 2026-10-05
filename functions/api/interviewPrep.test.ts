import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'candidate-token') {
      return { id: 'candidate-1', role: 'candidate', full_name: 'Jordan Rivera', organization_id: 'org-1' };
    }
    return null;
  })
}));

const createMockEnv = (customData: any = {}) => {
  return {
    DB: {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          first: vi.fn().mockImplementation(async () => {
            if (query.includes('candidate_profile')) {
              return {
                id: 'profile-1',
                user_id: 'candidate-1',
                target_role: customData.target_role || 'Operations Director',
                primary_domain: customData.primary_domain || 'Healthcare Operations',
                experience_level: 'senior',
                readiness_score: 0.72
              };
            }
            if (query.includes('user_account')) {
              return { organization_id: 'org-1' };
            }
            if (query.includes('interview_prep_session') && query.includes('SELECT')) {
              return {
                id: 'session-1',
                user_id: 'candidate-1',
                organization_id: 'org-1',
                mode: customData.mode || 'mock',
                status: 'active',
                target_role: customData.target_role || 'Operations Director'
              };
            }
            return null;
          }),
          run: vi.fn().mockResolvedValue({ success: true }),
          all: vi.fn().mockImplementation(async () => {
            if (query.includes('candidate_skill_proficiency_v2')) {
              return {
                results: [
                  { skill_id: 's-1', skill_name: 'Staff Scheduling Under Uncertainty', competency_name: 'Resource Optimization', proficiency_estimate: 0.35, uncertainty_estimate: 0.65, evidence_status: 'assessed' },
                  { skill_id: 's-2', skill_name: 'Regulatory Compliance Audit', competency_name: 'Governance', proficiency_estimate: 0.85, uncertainty_estimate: 0.20, evidence_status: 'assessed' }
                ]
              };
            }
            if (query.includes('candidate_claim')) {
              return { results: [{ claim_type: 'skill', claim_value: 'Healthcare Compliance' }] };
            }
            if (query.includes('assessment_evaluation')) {
              return {
                results: [
                  {
                    created_at: '2026-10-05T12:00:00Z',
                    skill_name: 'Staff Scheduling',
                    evaluation_json: JSON.stringify({
                      misconception_remediation: 'Confusing fixed-shift models with dynamic triage capacity'
                    })
                  }
                ]
              };
            }
            if (query.includes('interview_prep_response')) {
              return {
                results: [
                  {
                    id: 'r-1',
                    question_json: JSON.stringify({ question: 'How do you handle ICU surge capacity?', competency: 'Resource Optimization' }),
                    response_text: 'I activate our contingency float pool and stagger shifts.',
                    evaluation_json: JSON.stringify({
                      score_raw: 0.8,
                      teaching_payload: {
                        explanation_of_correct_answer: 'Contingency staffing preserves nurse-to-patient ratio.',
                        analysis_of_candidate_answer: 'Good practical plan.',
                        misconception_remediation: 'N/A'
                      }
                    })
                  }
                ]
              };
            }
            if (query.includes('interview_prep_session')) {
              return { results: [{ id: 'session-1', status: 'completed' }] };
            }
            return { results: [] };
          })
        })
      })
    },
    SESSION_KV: {
      get: vi.fn().mockImplementation(async (id) => {
        if (id === 'session:candidate-token') return 'candidate-token';
        return null;
      })
    }
  };
};

describe('Priority 14: M02 Interview Preparation Engine', () => {
  it('GET /api/m2/prep/profile aggregates candidate evidence, gaps, and diagnosed misconceptions', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m2/prep/profile', {
      method: 'GET',
      headers: { 'Cookie': 'intellihire_session=candidate-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.profile.target_role).toBe('Operations Director');
    expect(data.profile.gaps.length).toBeGreaterThan(0);
    expect(data.profile.gaps[0].name).toBe('Staff Scheduling Under Uncertainty');
    expect(data.profile.strengths.length).toBeGreaterThan(0);
    expect(data.profile.misconceptions.length).toBeGreaterThan(0);
  });

  it('POST /api/m2/prep/plan generates an evidence-driven prioritized preparation plan', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m2/prep/plan', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=candidate-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_role: 'Operations Director' })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.plan_items.length).toBeGreaterThan(0);
    const topItem = data.plan_items[0];
    expect(topItem.priority).toBe('high');
    expect(topItem.target_capability).toBeDefined();
    expect(topItem.recommended_learning).toBeDefined();
    expect(topItem.recommended_practice).toBeDefined();
    expect(topItem.recommended_simulation).toBeDefined();
  });

  it('POST /api/m2/prep/sessions initializes an adaptive simulation in mock mode', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m2/prep/sessions', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=candidate-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'mock', target_role: 'Operations Director' })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.session_id).toBeDefined();
    expect(data.mode).toBe('mock');
  });

  it('POST /api/m2/prep/sessions/:id/question produces role-aware question with dynamic questioning technique', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m2/prep/sessions/session-1/question', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=candidate-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.question).toBeDefined();
    expect(data.question.technique).toBeDefined();
    expect(data.question.dimension).toBeDefined();
    expect(data.question.question).toContain('Operations Director');
  });

  it('POST /api/m2/prep/sessions/:id/respond executes the adaptive evaluation loop via evaluateAndTeach', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              score: 85,
              is_correct: true,
              explanation_of_correct_answer: 'Dynamic triage adjusts allocations in real time.',
              how_to_arrive: 'Assess bed census and staffing ratio simultaneously.',
              analysis_of_candidate_answer: 'Demonstrated solid grasp of resource triage.',
              analysis_of_alternatives: 'Fixed ratios cause bottlenecking under surges.',
              misconception_remediation: 'N/A',
              follow_up_question: 'What metric alerts you that triage is failing?',
              adaptation_recommendation: 'increase_difficulty'
            })
          }
        }]
      })
    }) as any;

    const env = createMockEnv();
    const req = new Request('http://localhost/api/m2/prep/sessions/session-1/respond', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=candidate-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: { question: 'How do you handle surge capacity?', skill: 'Resource Optimization', evaluation_criteria: 'Trade-offs' },
        response_text: 'I continuously balance patient acuity with nurse competencies rather than rigid headcounts.'
      })
    });

    const res = await app.request(req, {}, env as any);
    global.fetch = originalFetch;

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.evaluation).toBeDefined();
    expect(data.evaluation.interviewer_follow_up).toBe('What metric alerts you that triage is failing?');
  });

  it('POST /api/m2/prep/sessions/:id/complete generates debrief and identifies recurring misconceptions', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m2/prep/sessions/session-1/complete', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=candidate-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.overall_readiness_score).toBeDefined();
    expect(data.debrief.length).toBeGreaterThan(0);
    expect(data.debrief[0].strengths).toBeDefined();
  });

  it('GET /api/m2/prep/readiness provides decision support without autonomous hiring decision', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m2/prep/readiness', {
      method: 'GET',
      headers: { 'Cookie': 'intellihire_session=candidate-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.readiness.disclaimer).toContain('human decision support');
    expect(data.readiness.disclaimer).toContain('NOT constitute an automated hiring decision');
    expect(data.readiness.competency_coverage).toBeDefined();
  });
});
