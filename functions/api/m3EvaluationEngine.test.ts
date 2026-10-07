import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from './[[route]]';
import {
  executeDeterministicEvaluation,
  classifyAlternativeValidity,
  scoreDomainRubric,
  SEED_SIMULATIONS
} from './simulationEngine';

vi.mock('hono/jwt', () => ({
  sign: vi.fn().mockResolvedValue('fake-jwt'),
  verify: vi.fn().mockResolvedValue({ id: 'usr-p6-123' }),
}));

describe('M03 Phase 6: Evidence-Grounded AI & Deterministic Evaluation Engine', () => {

  describe('1. Deterministic-First Verification', () => {
    it('verifies coding deliverables with state management and sandbox runs', () => {
      const def = SEED_SIMULATIONS.find(s => s.id === 'sim-tech-rate-limiter')!;
      const validCode = `
        class TokenBucketRateLimiter {
          constructor(capacity, refillRate) {
            this.capacity = capacity;
            this.tokens = capacity;
            this.lastRefill = Date.now();
          }
          allowRequest() {
            return this.tokens > 0;
          }
        }
      `;
      const telemetry = [{ action_type: 'run_tests', timestamp: new Date().toISOString() }];
      const result = executeDeterministicEvaluation(def, { code: validCode }, telemetry);

      expect(result.passed).toBe(true);
      expect(result.syntaxValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0.7);
      expect(result.testResults.some(t => t.name === 'Algorithmic State Management' && t.passed)).toBe(true);
    });

    it('verifies SQL index optimization and concurrent execution plan predicates', () => {
      const def = SEED_SIMULATIONS.find(s => s.id === 'sim-tech-api-relational-indexing')!;
      const sqlValid = `
        CREATE INDEX CONCURRENTLY idx_audit_tenant_created 
        ON candidate_audit_event (tenant_id, created_at DESC) 
        INCLUDE (user_id, event_type);
      `;
      const result = executeDeterministicEvaluation(def, { sql: sqlValid }, []);

      expect(result.passed).toBe(true);
      expect(result.score).toBe(1.0);
      expect(result.testResults.every(t => t.passed)).toBe(true);
    });

    it('verifies CapEx capital envelope constraints in financial modeling', () => {
      const def = SEED_SIMULATIONS.find(s => s.id === 'sim-finance-capex-allocation')!;
      const calcsPass = {
        total_capex: 14.0,
        npv: 7.35,
        wacc: 0.085,
        memo: 'Allocation of Alpha ($8M) and Beta ($6M) totaling $14M under $15M envelope.'
      };
      const resPass = executeDeterministicEvaluation(def, calcsPass, []);
      expect(resPass.passed).toBe(true);
      expect(resPass.score).toBe(1.0);

      const calcsFail = {
        total_capex: 22.0,
        memo: 'Exceeding envelope to $22M.'
      };
      const resFail = executeDeterministicEvaluation(def, calcsFail, []);
      expect(resFail.passed).toBe(false);
    });

    it('verifies critical clinical safety invariants in operations triage', () => {
      const def = SEED_SIMULATIONS.find(s => s.id === 'sim-ops-hospital-triage')!;
      // Dangerous assignment
      const dangerous = {
        assignments: 'Assigned Med-Surg nurse to intubated ICU bed P-101'
      };
      const resDanger = executeDeterministicEvaluation(def, dangerous, []);
      expect(resDanger.passed).toBe(false);
      expect(resDanger.errors.some(e => e.includes('Clinical safety violation') || e.includes('safety'))).toBe(true);

      // Compliant assignment
      const compliant = {
        assignments: 'Assigned RN Sarah Chen (ICU) to P-101 intubated patient. ESI-1 prioritized with hazmat quarantine.'
      };
      const resCompliant = executeDeterministicEvaluation(def, compliant, []);
      expect(resCompliant.passed).toBe(true);
    });

    it('identifies empty or placeholder deliverables as invalid', () => {
      const def = SEED_SIMULATIONS[0];
      const result = executeDeterministicEvaluation(def, { code: '// TODO: implement later' }, []);
      expect(result.passed).toBe(false);
      expect(result.score).toBe(0.0);
      expect(result.errors).toContain('Empty or placeholder deliverable');
    });
  });

  describe('2. Alternative Validity Classification', () => {
    it('classifies fully correct implementation as correct', () => {
      const det = {
        passed: true,
        score: 0.90,
        testResults: [{ name: 'Test 1', passed: true }],
        checksPerformed: ['all'],
        syntaxValid: true,
        schemaValid: true
      };
      const classification = classifyAlternativeValidity(det, 'Standard token bucket', true, 6, 'class TokenBucket { ... }');
      expect(classification.validity).toBe('correct');
    });

    it('classifies innovative approach with reasoned trade-offs as alternative_valid', () => {
      const det = {
        passed: true,
        score: 0.85,
        testResults: [{ name: 'Sliding Counter', passed: true }],
        checksPerformed: ['all'],
        syntaxValid: true,
        schemaValid: true
      };
      const notes = 'Alternative rationale: Chose sliding window log over token bucket to prevent edge burst vulnerabilities with reasoned trade-offs.';
      const output = 'class SlidingLogRateLimiter { allowRequest() { ... } }';
      const classification = classifyAlternativeValidity(det, notes, true, 8, output);
      expect(classification.validity).toBe('alternative_valid');
    });

    it('classifies contingency protocol under crisis as context_dependent', () => {
      const det = {
        passed: false,
        score: 0.65,
        testResults: [{ name: 'Contingency', passed: true }],
        checksPerformed: ['all'],
        syntaxValid: true,
        schemaValid: true
      };
      const notes = 'Under hazmat crisis and decontamination lockdown regime, ambulatory patients held in ambulatory pod.';
      const output = 'Emergency contingency holding protocol activated.';
      const classification = classifyAlternativeValidity(det, notes, true, 5, output);
      expect(classification.validity).toBe('context_dependent');
    });

    it('classifies truncated work as incomplete', () => {
      const det = {
        passed: false,
        score: 0.50,
        testResults: [{ name: 'Basic Limit', passed: true }, { name: 'Concurrency', passed: false }],
        checksPerformed: ['all'],
        syntaxValid: true,
        schemaValid: true
      };
      const classification = classifyAlternativeValidity(det, '', false, 2, 'function simpleCounter() { ... }');
      expect(classification.validity).toBe('incomplete');
    });

    it('classifies substantial work with partial failures as partially_correct', () => {
      const det = {
        passed: false,
        score: 0.50,
        testResults: [{ name: 'Basic Limit', passed: true }, { name: 'Concurrency', passed: false }],
        checksPerformed: ['all'],
        syntaxValid: true,
        schemaValid: true
      };
      const substantialOutput = `
        class ExtensiveRateLimiter {
          constructor(limit, window) {
            this.limit = limit;
            this.window = window;
            this.history = [];
          }
          allowRequest() {
            // Implemented basic window counting but lacks atomic synchronization for distributed cluster nodes
            const now = Date.now();
            return this.history.length < this.limit;
          }
        }
      `;
      const classification = classifyAlternativeValidity(det, '', false, 4, substantialOutput);
      expect(classification.validity).toBe('partially_correct');
    });

    it('classifies safety or fundamental invariant failure as incorrect', () => {
      const det = {
        passed: false,
        score: 0.20,
        testResults: [{ name: 'Safety', passed: false }],
        checksPerformed: ['safety'],
        syntaxValid: true,
        schemaValid: true,
        errors: ['Critical clinical safety violation: Med-Surg nurse on intubated ICU bed']
      };
      const classification = classifyAlternativeValidity(det, '', false, 1, 'Assigned Med-Surg nurse to intubated bed');
      expect(classification.validity).toBe('incorrect');
    });

    it('classifies placeholder submission as insufficient_information', () => {
      const det = {
        passed: false,
        score: 0.0,
        testResults: [],
        checksPerformed: [],
        syntaxValid: false,
        schemaValid: false
      };
      const classification = classifyAlternativeValidity(det, '', false, 0, '// TODO');
      expect(classification.validity).toBe('insufficient_information');
    });
  });

  describe('3. Multi-Dimensional Domain Rubric Scoring', () => {
    it('scores submissions according to actual task rubric dimensions and weights', () => {
      const triageDef = SEED_SIMULATIONS.find(s => s.id === 'sim-ops-hospital-triage')!;
      const det = {
        passed: true,
        score: 0.85,
        testResults: [{ name: 'All Checks', passed: true }],
        checksPerformed: ['all'],
        syntaxValid: true,
        schemaValid: true
      };

      const result = scoreDomainRubric(triageDef.rubric, det, 'correct', 6, true);
      expect(result.dimensionScores).toHaveProperty('patient_safety');
      expect(result.dimensionScores).toHaveProperty('prioritization');
      expect(result.dimensionScores).toHaveProperty('adaptability');
      expect(result.dimensionScores).toHaveProperty('efficiency');
      expect(result.overallScore).toBeGreaterThanOrEqual(0.80);
    });

    it('applies alternative_valid multiplier without penalizing innovative solutions', () => {
      const def = SEED_SIMULATIONS[0];
      const det = {
        passed: true,
        score: 0.90,
        testResults: [{ name: 'All', passed: true }],
        checksPerformed: ['all'],
        syntaxValid: true,
        schemaValid: true
      };

      const resCorrect = scoreDomainRubric(def.rubric, det, 'correct', 5, true);
      const resAlt = scoreDomainRubric(def.rubric, det, 'alternative_valid', 5, true);

      // Alternative valid should maintain high score (>80%)
      expect(resAlt.overallScore).toBeGreaterThanOrEqual(0.80);
      expect(resAlt.overallScore).toBeCloseTo(resCorrect.overallScore, 1);
    });
  });

  describe('4. API Submission with Deterministic Verification & Alternative Validity', () => {
    let mockDb: any;
    let env: any;

    beforeEach(() => {
      const mockSession = {
        id: 'sess-phase6-test',
        user_id: 'usr-p6-123',
        organization_id: 'org-p6-456',
        definition_id: 'sim-tech-rate-limiter',
        status: 'active',
        current_step: 1,
        dynamic_state_json: JSON.stringify({ injected: true }),
        telemetry_events_json: JSON.stringify([
          { action_type: 'run_tests', timestamp: new Date().toISOString() },
          { action_type: 'edit_code', timestamp: new Date().toISOString() }
        ]),
        created_at: new Date().toISOString()
      };

      mockDb = {
        prepare: vi.fn().mockImplementation((query: string) => ({
          bind: vi.fn().mockImplementation((...params: any[]) => ({
            first: vi.fn().mockImplementation(() => {
              if (query.includes('FROM simulation_session')) return Promise.resolve(mockSession);
              if (query.includes('FROM simulation_evaluation')) return Promise.resolve(null);
              if (query.includes('FROM candidate_skill_proficiency_v2')) return Promise.resolve(null);
              if (query.includes('FROM candidate_profile')) return Promise.resolve({ readiness_score: 0.75 });
              if (query.includes('FROM user_account')) return Promise.resolve({ id: 'usr-p6-123', organization_id: 'org-p6-456', role: 'candidate' });
              return Promise.resolve(null);
            }),
            all: vi.fn().mockResolvedValue({ results: [] }),
            run: vi.fn().mockResolvedValue({ success: true })
          }))
        }))
      };

      env = {
        DB: mockDb,
        SESSION_KV: {
          get: vi.fn().mockResolvedValue(JSON.stringify({ id: 'usr-p6-123', email: 'alex@candidate.com', role: 'candidate' }))
        }
      };
    });

    it('successfully processes submission returning alternative_validity and deterministic_verification', async () => {
      const req = new Request('http://localhost/api/m3/simulations/sessions/sess-phase6-test/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'intellihire_session=test-p6-token'
        },
        body: JSON.stringify({
          final_output: {
            code: `class TokenBucket { constructor(cap) { this.cap = cap; this.tokens = cap; this.last = Date.now(); } allowRequest() { return true; } }`
          },
          notes: 'Standard token bucket with timestamp delta.'
        })
      });

      const res = await app.fetch(req, env);
      expect(res.status).toBe(200);

      const json = await res.json() as any;
      expect(json.success).toBe(true);
      expect(json.alternative_validity).toBeDefined();
      expect(['correct', 'partially_correct', 'alternative_valid']).toContain(json.alternative_validity);
      expect(json.deterministic_verification).toBeDefined();
      expect(json.deterministic_verification.testResults.length).toBeGreaterThan(0);
      expect(json.confidence_score).toBeGreaterThanOrEqual(0.70);
      expect(json.uncertainty_score).toBeLessThanOrEqual(0.30);
      expect(json.provenance.evaluator.type).toMatch(/deterministic|hybrid/);
    });
  });
});
