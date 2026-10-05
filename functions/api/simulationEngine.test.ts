import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'candidate-token') {
      return { id: 'candidate-user-1', role: 'candidate', full_name: 'Alex Rivera', organization_id: 'org-m3' };
    }
    if (token === 'attacker-token') {
      return { id: 'attacker-user-2', role: 'candidate', full_name: 'Attacker', organization_id: 'org-foreign' };
    }
    return null;
  })
}));

const createMockEnv = (customData: any = {}) => {
  let sessionRecord: any = null;
  let evalRecord: any = null;

  return {
    DB: {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          first: vi.fn().mockImplementation(async () => {
            if (query.includes('user_account')) {
              if (args[0] === 'candidate-user-1') return { organization_id: 'org-m3' };
              if (args[0] === 'attacker-user-2') return { organization_id: 'org-foreign' };
              return { organization_id: 'org-m3' };
            }
            if (query.includes('candidate_profile')) {
              return { readiness_score: 0.68, target_role: 'Senior Software Engineer' };
            }
            if (query.includes('candidate_skill_proficiency_v2')) {
              return { id: 'prof-rec-1', proficiency_estimate: 0.50, uncertainty_estimate: 0.60 };
            }
            if (query.includes('simulation_session') && query.includes('SELECT')) {
              if (args[1] === 'attacker-user-2') return null;
              return sessionRecord || {
                id: customData.session_id || 'sim-sess-1',
                user_id: 'candidate-user-1',
                organization_id: 'org-m3',
                definition_id: customData.definition_id || 'sim-tech-rate-limiter',
                status: 'in_progress',
                current_step: 1,
                dynamic_state_json: '{}',
                candidate_work_json: '{"code":"console.log(1)"}',
                telemetry_events_json: '[]'
              };
            }
            if (query.includes('simulation_evaluation')) {
              return evalRecord || {
                id: 'eval-1',
                session_id: 'sim-sess-1',
                user_id: 'candidate-user-1',
                overall_score: 0.85,
                dimension_scores_json: '{"correctness":0.9,"adaptability":0.8}',
                observable_evidence_json: '{"key_actions_identified":["Executed tests"]}',
                model_interpretation_json: '{"strengths":"Disciplined"}',
                remediation_recommendation_json: '[{"m02_skill_target":"Concurrency"}]',
                confidence_score: 0.88,
                created_at: '2026-10-06T02:00:00Z'
              };
            }
            return null;
          }),
          run: vi.fn().mockImplementation(async () => {
            if (query.includes('INSERT INTO simulation_session')) {
              sessionRecord = {
                id: args[0],
                user_id: args[1],
                organization_id: args[2],
                definition_id: args[3],
                status: 'in_progress',
                current_step: 1,
                dynamic_state_json: '{}',
                candidate_work_json: args[4],
                telemetry_events_json: '[]'
              };
            }
            if (query.includes('UPDATE simulation_session')) {
              if (sessionRecord) {
                sessionRecord.updated_at = new Date().toISOString();
              }
            }
            return { success: true };
          }),
          all: vi.fn().mockImplementation(async () => {
            if (query.includes('candidate_skill_proficiency_v2')) {
              return {
                results: [
                  { skill_id: 's-concurrency', skill_name: 'Distributed Systems & Concurrency', proficiency_estimate: 0.42, uncertainty_estimate: 0.58 },
                  { skill_id: 's-finance', skill_name: 'Capital Budgeting & Valuation', proficiency_estimate: 0.38, uncertainty_estimate: 0.65 }
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
        if (id === 'session:candidate-token') return 'candidate-token';
        if (id === 'session:attacker-token') return 'attacker-token';
        return null;
      })
    }
  };
};

describe('Priority 15: M03 Technical / Domain / Professional Simulation Intelligence Framework', () => {

  it('1. GET /api/m3/simulations/definitions lists both technical and non-technical simulations with M02 gap targeting', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m3/simulations/definitions', {
      headers: { 'Cookie': 'intellihire_session=candidate-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.simulations.length).toBeGreaterThanOrEqual(5);

    // Verify technical domains exist
    const codingSim = data.simulations.find((s: any) => s.simulation_type === 'coding');
    expect(codingSim).toBeDefined();
    expect(codingSim.domain).toBe('software');

    // Verify non-technical / professional domains exist
    const financeSim = data.simulations.find((s: any) => s.simulation_type === 'financial_analysis');
    expect(financeSim).toBeDefined();
    expect(financeSim.domain).toBe('finance');

    const opsSim = data.simulations.find((s: any) => s.simulation_type === 'operational_triage');
    expect(opsSim).toBeDefined();
    expect(opsSim.domain).toBe('operations');

    const legalSim = data.simulations.find((s: any) => s.simulation_type === 'written_response');
    expect(legalSim).toBeDefined();

    // Verify M02 gap recommendation
    const recommendedSim = data.simulations.find((s: any) => s.is_recommended_for_gap);
    expect(recommendedSim).toBeDefined();
    expect(recommendedSim.recommendation_reason).toContain('targets diagnosed uncertainty');
  });

  it('2. POST /api/m3/simulations/sessions starts a coding simulation session', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m3/simulations/sessions', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=candidate-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ definition_id: 'sim-tech-rate-limiter' })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.session_id).toBeDefined();
    expect(data.definition.simulation_type).toBe('coding');
    expect(data.definition.scenario.starting_data.template_code).toContain('TokenBucketRateLimiter');
  });

  it('3. POST /api/m3/simulations/sessions starts a non-technical operational triage simulation', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m3/simulations/sessions', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=candidate-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ definition_id: 'sim-ops-hospital-triage' })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.definition.domain).toBe('operations');
    expect(data.definition.scenario.starting_data.patient_queue.length).toBeGreaterThan(0);
    expect(data.definition.scenario.starting_data.available_staff.length).toBeGreaterThan(0);
  });

  it('4. POST /api/m3/simulations/sessions/:id/action records telemetry events and candidate work', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m3/simulations/sessions/sim-sess-1/action', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=candidate-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action_type: 'run_tests',
        payload: { test_case: 'burst_traffic_100_req', passed: true },
        candidate_work: { code: 'class TokenBucketRateLimiter { /* refined implementation */ }' }
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.action_recorded).toBe('run_tests');
  });

  it('5. POST /api/m3/simulations/sessions/:id/inject triggers mid-scenario dynamic constraint change', async () => {
    const env = createMockEnv({ definition_id: 'sim-tech-rate-limiter' });
    const req = new Request('http://localhost/api/m3/simulations/sessions/sim-sess-1/inject', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=candidate-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.step).toBe(2);
    expect(data.injection.alert_title).toContain('Redis Cluster Partition');
    expect(data.injection.new_requirement).toContain('degraded local fallback mode');
  });

  it('6. POST /api/m3/simulations/sessions/:id/submit performs multi-dimensional evaluation and connects M02 feedback loop', async () => {
    const env = createMockEnv({ definition_id: 'sim-tech-rate-limiter' });
    const req = new Request('http://localhost/api/m3/simulations/sessions/sim-sess-1/submit', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=candidate-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        final_output: {
          code: `class TokenBucketRateLimiter {
            private capacity: number;
            private tokens: number;
            private lastRefill: number;
            public checkRequest(clientId: string, nowMs = Date.now()) {
              // Sliding window calculation with local replica fallback
              return { allowed: true, remaining: 99, reset_seconds: 60 };
            }
          }`
        },
        notes: 'Handled partition by falling back to thread-safe local sliding window.'
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.evaluation_id).toBeDefined();
    expect(data.overall_score).toBeGreaterThan(0);
    expect(data.dimension_scores.correctness).toBeDefined();
    expect(data.dimension_scores.adaptability).toBeDefined();
    expect(data.observable_evidence.key_actions_identified.length).toBeGreaterThan(0);
    expect(data.remediation_recommendations.length).toBeGreaterThan(0);
    expect(data.m02_feedback_loop.readiness_updated).toBe(true);
  });

  it('7. Security / RBAC / Tenant Isolation: foreign tenant cannot access other candidate sessions', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m3/simulations/sessions/sim-sess-1', {
      headers: { 'Cookie': 'intellihire_session=attacker-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(404);
    const data = await res.json() as any;
    expect(data.error).toBe('Session not found');
  });

  it('8. Input Validation: invalid definition_id rejects gracefully with 400', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m3/simulations/sessions', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=candidate-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ definition_id: 'non-existent-simulation-id' })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(400);
    const data = await res.json() as any;
    expect(data.error).toContain('Valid definition_id required');
  });
});
