import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'recruiter-token') {
      return { id: 'recruiter-user-1', role: 'recruiter', full_name: 'Lead Evaluator', organization_id: 'org-m4' };
    }
    if (token === 'candidate-token') {
      return { id: 'candidate-user-1', role: 'candidate', full_name: 'Alex Mercer', organization_id: 'org-m4' };
    }
    if (token === 'attacker-token') {
      return { id: 'attacker-user-2', role: 'recruiter', full_name: 'Attacker', organization_id: 'org-foreign' };
    }
    return null;
  })
}));

const createMockEnv = (customData: any = {}) => {
  let sessionRecord: any = null;
  let synthRecord: any = null;

  return {
    DB: {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          first: vi.fn().mockImplementation(async () => {
            if (query.includes('user_account')) {
              return { organization_id: 'org-m4' };
            }
            if (query.includes('candidate_profile')) {
              return {
                id: 'prof-1',
                user_id: 'candidate-user-1',
                target_role: 'Senior Cloud & Systems Architect',
                primary_domain: 'software',
                experience_level: 'senior',
                readiness_score: 0.76
              };
            }
            if (query.includes('interview_session') && query.includes('SELECT')) {
              if (args[1] === 'attacker-user-2') return null;
              return sessionRecord || {
                id: customData.session_id || 'session-m4-1',
                organization_id: 'org-m4',
                protocol_id: 'proto-tech-arch-distributed',
                candidate_user_id: 'candidate-user-1',
                interviewer_user_id: 'recruiter-user-1',
                status: 'in_progress',
                active_panel_role: 'Principal Systems Architect',
                current_turn: 1
              };
            }
            if (query.includes('interview_synthesis') && query.includes('SELECT')) {
              return synthRecord || {
                id: 'synth-1',
                session_id: 'session-m4-1',
                overall_rating: 0.86,
                competency_coverage_json: '{"Principal Systems Architect":{"turns":1,"avg_score":0.85}}',
                strengths_json: '["Trade-off reasoning under network partition"]',
                gaps_json: '["Latency calculation"]',
                m05_evidence_package_json: '{"protocol_title":"Distributed Architecture","overall_interview_rating":86,"evidence_confidence":0.89}'
              };
            }
            return null;
          }),
          run: vi.fn().mockImplementation(async () => {
            if (query.includes('INSERT INTO interview_session')) {
              sessionRecord = {
                id: args[0],
                organization_id: args[1],
                protocol_id: args[2],
                candidate_user_id: args[3],
                interviewer_user_id: args[4],
                status: 'in_progress',
                active_panel_role: args[6],
                current_turn: 1
              };
            }
            return { success: true };
          }),
          all: vi.fn().mockImplementation(async () => {
            if (query.includes('candidate_claim')) {
              return { results: [{ claim_type: 'skill', claim_value: 'Distributed Consensus' }] };
            }
            if (query.includes('candidate_skill_proficiency_v2')) {
              return {
                results: [
                  { skill_id: 's-dist', skill_name: 'Distributed Systems & Concurrency', competency_name: 'Resilience', proficiency_estimate: 0.45, uncertainty_estimate: 0.55 }
                ]
              };
            }
            if (query.includes('assessment_evaluation')) {
              return {
                results: [
                  {
                    evaluation_json: JSON.stringify({
                      teaching_payload: { misconception_remediation: 'Confusing 2PC with async saga' }
                    }),
                    skill_name: 'Distributed Systems'
                  }
                ]
              };
            }
            if (query.includes('simulation_evaluation')) {
              return {
                results: [
                  {
                    title: 'Distributed Token Bucket Rate Limiter',
                    domain: 'software',
                    simulation_type: 'coding',
                    overall_score: 0.88,
                    observable_evidence_json: JSON.stringify({ key_actions: ['Executed tests', 'Handled partition'] })
                  }
                ]
              };
            }
            if (query.includes('interview_observation')) {
              return {
                results: [
                  {
                    turn_number: 1,
                    interviewer_role: 'Principal Systems Architect',
                    question_text: 'Describe failover consensus under partition.',
                    candidate_response: 'We use Raft with local quorum and idempotency keys.',
                    observable_evidence_json: '["Cited Raft consensus"]',
                    rubric_evaluation_json: '{"score": 0.85}',
                    ai_interpretation_json: '{"strengths": "Solid trade-off grasp"}',
                    human_rating: 4.5,
                    human_notes: 'Strong practical architecture answer'
                  }
                ]
              };
            }
            return { results: [] };
          })
        })
      })
    },
    SESSION_KV: {
      get: vi.fn().mockImplementation(async (id) => {
        if (id === 'session:recruiter-token') return 'recruiter-token';
        if (id === 'session:candidate-token') return 'candidate-token';
        if (id === 'session:attacker-token') return 'attacker-token';
        return null;
      })
    }
  };
};

describe('Priority 16: M04 Interaction / Interview Simulation & Enterprise Protocols', () => {

  it('1. GET /api/m4/interviews/protocols lists structured protocols with panel roles and anchored rubrics', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m4/interviews/protocols', {
      headers: { 'Cookie': 'intellihire_session=recruiter-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.protocols.length).toBeGreaterThanOrEqual(3);

    const techProto = data.protocols.find((p: any) => p.domain === 'software');
    expect(techProto).toBeDefined();
    expect(techProto.panel_roles).toContain('Principal Systems Architect');
    expect(techProto.question_sequence[0].anchored_rubric.competent).toBeDefined();

    const finProto = data.protocols.find((p: any) => p.domain === 'finance');
    expect(finProto).toBeDefined();
    expect(finProto.panel_roles).toContain('Chief Financial Officer');
  });

  it('2. GET /api/m4/interviews/candidates rollups evidence from M01, M02, and M03', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m4/interviews/candidates', {
      headers: { 'Cookie': 'intellihire_session=candidate-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.candidate.m01_verified_claims_count).toBeGreaterThan(0);
    expect(data.candidate.m02_proficiencies.length).toBeGreaterThan(0);
    expect(data.candidate.m02_diagnosed_misconceptions.length).toBeGreaterThan(0);
    expect(data.candidate.m03_simulations_demonstrated.length).toBeGreaterThan(0);
    expect(data.candidate.m03_simulations_demonstrated[0].title).toBe('Distributed Token Bucket Rate Limiter');
  });

  it('3. POST /api/m4/interviews/sessions starts structured panel interview with coordinated roles', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m4/interviews/sessions', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=recruiter-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ protocol_id: 'proto-tech-arch-distributed' })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.session_id).toBeDefined();
    expect(data.active_panel_role).toBe('Engineering Director');
    expect(data.first_question).toBeDefined();
  });

  it('4. POST /api/m4/interviews/sessions/:id/turn evaluates response and advances panel coordination', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m4/interviews/sessions/session-m4-1/turn', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=recruiter-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_response: 'We decouple transaction logs using distributed Raft with vector clocks to isolate network partitions without cascading failures.',
        current_question: {
          competency: 'Distributed Resilience Under Partition',
          question: 'Describe consensus failover under partition.',
          anchored_rubric: { competent: 'Articulates consensus trade-offs.' }
        },
        interviewer_role: 'Principal Systems Architect'
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.observation_id).toBeDefined();
    expect(data.evaluation.observable_evidence.length).toBeGreaterThan(0);
    expect(data.evaluation.ai_recommended_probe).toBeDefined();
    expect(data.next_turn.turn_number).toBe(2);
  });

  it('5. POST /api/m4/interviews/sessions/:id/rate records human interviewer rating independently without AI overwrite', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m4/interviews/sessions/session-m4-1/rate', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=recruiter-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        turn_number: 1,
        human_rating: 4.5,
        human_notes: 'Solid concrete examples from prior architectural migration.'
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.human_rating).toBe(4.5);
    expect(data.notes_saved).toBe(true);
  });

  it('6. POST /api/m4/interviews/sessions/:id/complete generates M05 evidence package and updates readiness', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m4/interviews/sessions/session-m4-1/complete', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=recruiter-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.synthesis_id).toBeDefined();
    expect(data.overall_rating).toBeGreaterThan(0);
    expect(data.m05_evidence_package).toBeDefined();
    expect(data.m05_evidence_package.governance_notice).toContain('Automated hiring decisions are strictly prohibited');
  });

  it('7. Tenant Isolation: unauthorized user from different organization is rejected', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m4/interviews/sessions/session-m4-1', {
      headers: { 'Cookie': 'intellihire_session=attacker-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(404);
  });
});
