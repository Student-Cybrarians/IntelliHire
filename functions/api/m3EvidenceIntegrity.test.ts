import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn().mockResolvedValue('fake-jwt'),
  verify: vi.fn().mockResolvedValue({ id: 'user-candidate-1' }),
}));

describe('M03 Phase 5: Evidence Integrity, Provenance & Downstream Contracts', () => {
  it('submits simulation, produces 5 evidence layers, and syncs to readiness ledger', async () => {
    const jwt = 'fake-jwt';
    const executedQueries: string[] = [];
    const sessionMock = {
      id: 'session-live-101',
      user_id: 'user-candidate-1',
      organization_id: 'org-test-enterprise',
      definition_id: 'sim-tech-rate-limiter',
      status: 'in_progress',
      current_step: 1,
      candidate_work_json: '{}',
      telemetry_events_json: JSON.stringify([
        { action_type: 'code_edit', payload: { length: 80 } },
        { action_type: 'run_code', payload: { passed: 3 } }
      ]),
      dynamic_state_json: JSON.stringify({ injected: true }),
      created_at: new Date(Date.now() - 120000).toISOString()
    };

    const env = {
      DB: {
        prepare: vi.fn().mockImplementation((query: string) => {
          executedQueries.push(query);
          if (query.includes('FROM simulation_session WHERE id = ?')) {
            return {
              bind: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(sessionMock)
              })
            };
          }
          if (query.includes('FROM candidate_skill_proficiency_v2')) {
            return {
              bind: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(null)
              })
            };
          }
          if (query.includes('FROM candidate_profile')) {
            return {
              bind: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue({ readiness_score: 0.65 })
              })
            };
          }
          return {
            bind: vi.fn().mockReturnValue({
              run: vi.fn().mockResolvedValue({ success: true })
            })
          };
        }),
      },
      SESSION_KV: {
        get: vi.fn().mockResolvedValue(jwt),
      },
      JWT_SECRET: 'test-secret',
    };

    const req = new Request('http://localhost/api/m3/simulations/sessions/session-live-101/submit', {
      method: 'POST',
      headers: {
        Cookie: 'intellihire_session=valid-session',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        final_output: { code: 'class TokenBucketRateLimiter { allow() { return true; } }' },
        notes: 'Enforced sliding window boundary.'
      })
    });

    const res = await app.request(req, {}, env);
    expect(res.status).toBe(200);
    const data = await res.json() as any;

    expect(data.success).toBe(true);
    expect(data.evaluation_id).toBeDefined();

    // 1. Evidence Layer 2: Empirical Observed Facts
    expect(Array.isArray(data.observed_facts)).toBe(true);
    expect(data.observed_facts.length).toBeGreaterThanOrEqual(3);
    expect(data.observed_facts.some((f: any) => f.category === 'action')).toBe(true);
    expect(data.observed_facts.some((f: any) => f.category === 'execution_result')).toBe(true);
    // Empirical fact must not contain speculative words
    expect(data.observed_facts.every((f: any) => !f.fact.toLowerCase().includes('feels'))).toBe(true);

    // 2. Evidence Layer 3: Model Interpretation (Segregated & Marked Speculative)
    expect(data.model_interpretation).toBeDefined();
    expect(data.model_interpretation.speculative).toBe(true);
    expect(data.model_interpretation.strengths).toBeDefined();

    // 3. Evidence Layer 4: Calibrated Confidence & Uncertainty
    expect(data.confidence_score).toBeGreaterThan(0.5);
    expect(data.uncertainty_score).toBeLessThan(0.5);
    expect(Math.round((data.confidence_score + data.uncertainty_score) * 100) / 100).toBe(1.0);

    // 4. Evidence Layer 5: Cryptographic Provenance
    expect(data.provenance).toBeDefined();
    expect(data.provenance.submission_hash).toBeDefined();
    expect(data.provenance.submission_hash.length).toBe(64); // SHA-256
    expect(data.provenance.privacy_guarantee).toBe('pii_stripped_no_protected_traits');

    // 5. Governance Guarantee: Autonomous decision prohibited
    expect(data.autonomous_decision_prohibited).toBe(true);

    // 6. DB Sync verification: readiness_evidence_ledger and evidence_package executed
    expect(executedQueries.some(q => q.includes('INSERT INTO readiness_evidence_ledger'))).toBe(true);
    expect(executedQueries.some(q => q.includes('INSERT OR REPLACE INTO evidence_package'))).toBe(true);
  });

  it('guarantees idempotency on duplicate submission without creating duplicate evaluations', async () => {
    const jwt = 'fake-jwt';
    const existingEvaluationMock = {
      id: 'eval-existing-999',
      session_id: 'session-completed-202',
      user_id: 'user-candidate-1',
      definition_id: 'sim-tech-rate-limiter',
      overall_score: 0.88,
      dimension_scores_json: JSON.stringify({ correctness: 0.9, process: 0.85 }),
      observable_evidence_json: JSON.stringify({ key_actions: ['Ran test suites'] }),
      observed_facts_json: JSON.stringify([{ id: 'f-1', fact: 'Executed tests', category: 'action' }]),
      model_interpretation_json: JSON.stringify({ strengths: 'Strong concurrency', speculative: true }),
      remediation_recommendation_json: JSON.stringify([]),
      confidence_score: 0.88,
      uncertainty_score: 0.12,
      provenance_json: JSON.stringify({ submission_hash: 'a'.repeat(64) })
    };

    const sessionMock = {
      id: 'session-completed-202',
      user_id: 'user-candidate-1',
      status: 'completed',
      definition_id: 'sim-tech-rate-limiter'
    };

    const env = {
      DB: {
        prepare: vi.fn().mockImplementation((query: string) => {
          if (query.includes('FROM simulation_session WHERE id = ?')) {
            return {
              bind: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(sessionMock)
              })
            };
          }
          if (query.includes('FROM simulation_evaluation WHERE session_id = ?')) {
            return {
              bind: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(existingEvaluationMock)
              })
            };
          }
          return {
            bind: vi.fn().mockReturnValue({
              run: vi.fn().mockResolvedValue({ success: true })
            })
          };
        }),
      },
      SESSION_KV: {
        get: vi.fn().mockResolvedValue(jwt),
      },
      JWT_SECRET: 'test-secret',
    };

    const req = new Request('http://localhost/api/m3/simulations/sessions/session-completed-202/submit', {
      method: 'POST',
      headers: {
        Cookie: 'intellihire_session=valid-session',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        final_output: { code: 'retry code' }
      })
    });

    const res = await app.request(req, {}, env);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.idempotent).toBe(true); // Idempotent flag verified!
    expect(data.evaluation_id).toBe('eval-existing-999');
    expect(data.overall_score).toBe(88);
  });

  it('serves complete structured evidence package via GET /api/m3/simulations/sessions/:id/evidence-package', async () => {
    const jwt = 'fake-jwt';
    const evalMock = {
      id: 'eval-pkg-test',
      session_id: 'session-pkg-1',
      user_id: 'user-candidate-1',
      definition_id: 'sim-tech-rate-limiter',
      overall_score: 0.85,
      dimension_scores_json: JSON.stringify({ correctness: 0.90 }),
      observable_evidence_json: JSON.stringify({}),
      observed_facts_json: JSON.stringify([{ id: 'f-1', fact: 'Executed tests', category: 'action' }]),
      model_interpretation_json: JSON.stringify({ strengths: 'High quality', speculative: true }),
      remediation_recommendation_json: JSON.stringify([{ recommended_study: 'Concurrency' }]),
      confidence_score: 0.86,
      uncertainty_score: 0.14,
      provenance_json: JSON.stringify({ submission_hash: 'b'.repeat(64), privacy_guarantee: 'pii_stripped_no_protected_traits' }),
      human_review_status: 'unreviewed'
    };

    const sessionMock = {
      id: 'session-pkg-1',
      user_id: 'user-candidate-1',
      organization_id: 'org-enterprise',
      definition_id: 'sim-tech-rate-limiter',
      status: 'completed',
      candidate_work_json: JSON.stringify({ code: 'class Solution {}' }),
      telemetry_events_json: JSON.stringify([{ action_type: 'code_edit' }])
    };

    const env = {
      DB: {
        prepare: vi.fn().mockImplementation((query: string) => {
          if (query.includes('FROM simulation_session WHERE id = ?')) {
            return {
              bind: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(sessionMock)
              })
            };
          }
          if (query.includes('FROM simulation_evaluation WHERE session_id = ?')) {
            return {
              bind: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(evalMock)
              })
            };
          }
          return {
            bind: vi.fn().mockReturnValue({
              run: vi.fn().mockResolvedValue({ success: true })
            })
          };
        }),
      },
      SESSION_KV: {
        get: vi.fn().mockResolvedValue(jwt),
      },
      JWT_SECRET: 'test-secret',
    };

    const req = new Request('http://localhost/api/m3/simulations/sessions/session-pkg-1/evidence-package', {
      method: 'GET',
      headers: {
        Cookie: 'intellihire_session=valid-session'
      }
    });

    const res = await app.request(req, {}, env);
    expect(res.status).toBe(200);
    const data = await res.json() as any;

    expect(data.success).toBe(true);
    const pkg = data.evidence_package;
    expect(pkg.packageId).toBe('pkg-m3-eval-pkg-test');
    expect(pkg.candidateId).toBe('user-candidate-1');
    expect(pkg.competencyName).toBe('System Architecture & Concurrency');
    expect(pkg.observedFacts.length).toBe(1);
    expect(pkg.modelInterpretation.speculative).toBe(true);
    expect(pkg.autonomousDecisionProhibited).toBe(true);
    expect(pkg.m05LedgerSynced).toBe(true);
  });

  it('enforces tenant and user isolation: rejects cross-user access to evidence package', async () => {
    const jwt = 'fake-jwt';
    const env = {
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null) // Other candidate's session not accessible
          })
        })
      },
      SESSION_KV: {
        get: vi.fn().mockResolvedValue(jwt),
      },
      JWT_SECRET: 'test-secret',
    };

    const req = new Request('http://localhost/api/m3/simulations/sessions/foreign-candidate-session/evidence-package', {
      method: 'GET',
      headers: {
        Cookie: 'intellihire_session=valid-session'
      }
    });

    const res = await app.request(req, {}, env);
    expect(res.status).toBe(404);
    const data = await res.json() as any;
    expect(data.error).toBe('Session not found');
  });
});
