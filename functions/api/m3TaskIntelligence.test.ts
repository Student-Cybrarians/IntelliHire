import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';
import {
  scaleTaskToCandidateSeniority,
  normalizeSeniorityLevel,
  calculateTaskRepetitionFingerprint,
  validateUniversalTaskDefinition,
  sanitizeContextForTaskTargeting,
  seedSimulationToTaskDefinition,
  TaskDefinition
} from '../../src/shared/m3WorkRoundContracts';
import { SEED_SIMULATIONS } from './simulationEngine';

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'candidate-token') {
      return { id: 'cand-task-usr-1', email: 'mokshith@example.com', role: 'candidate', full_name: 'Mokshith Y', organization_id: 'org-enterprise-alpha' };
    }
    return null;
  })
}));

describe('M03 Phase 3: Universal Technical & Non-Technical Task Intelligence', () => {

  // Helper mock D1 database generator
  function createMockD1(customOverrides: Record<string, any> = {}) {
    return {
      prepare: vi.fn().mockImplementation((query: string) => ({
        bind: vi.fn().mockImplementation((...params: any[]) => ({
          first: vi.fn().mockImplementation(async () => {
            if (query.includes('FROM user_account')) {
              return customOverrides.userAccount !== undefined
                ? customOverrides.userAccount
                : { id: params[0] || 'cand-task-usr-1', organization_id: 'org-enterprise-alpha', role: 'candidate' };
            }
            if (query.includes('FROM candidate_profile')) {
              return customOverrides.profile !== undefined
                ? customOverrides.profile
                : {
                    user_id: params[0],
                    target_role: 'Cloud Infrastructure Engineer',
                    experience_level: customOverrides.seniority || 'senior',
                    readiness_score: 0.78,
                    skills_json: '["Cloudflare Workers & Edge Execution","Distributed Systems"]',
                    target_domain_id: 'software',
                    target_occupation_id: '15-1252.00'
                  };
            }
            if (query.includes('FROM candidate_context')) {
              return customOverrides.context !== undefined
                ? customOverrides.context
                : { id: 'ctx-res-1', resume_id: 'res-file-alpha' };
            }
            if (query.includes('FROM job_requisition')) {
              return customOverrides.requisition !== undefined
                ? customOverrides.requisition
                : {
                    id: 'req-alpha-edge',
                    title: 'Cloud Infrastructure Engineer',
                    seniority_level: customOverrides.seniority || 'senior',
                    role_category: 'software',
                    raw_jd_text: 'Lead serverless edge deployments with low-latency failover.',
                    parsed_requirements_json: JSON.stringify({
                      requirements: ['Cloudflare Workers failover', 'Edge cache optimization'],
                      skills: ['Cloudflare Workers & Edge Execution', 'Distributed Systems']
                    })
                  };
            }
            if (query.includes('FROM job_description_context')) {
              return null;
            }
            if (query.includes('FROM simulation_session') && query.includes('LIMIT 1')) {
              return customOverrides.activeSession || null;
            }
            return null;
          }),
          all: vi.fn().mockImplementation(async () => {
            if (query.includes('FROM candidate_gap')) {
              return {
                results: customOverrides.gaps !== undefined
                  ? customOverrides.gaps
                  : [
                      {
                        skill_name: 'Cloudflare Workers & Edge Execution',
                        gap_type: 'missing_evidence',
                        severity: 'critical',
                        evidence_json: JSON.stringify({ gap_score: 0.42, target_role_criticality: 0.95 })
                      }
                    ]
              };
            }
            if (query.includes('FROM simulation_session')) {
              return {
                results: customOverrides.pastSessions !== undefined
                  ? customOverrides.pastSessions
                  : []
              };
            }
            if (query.includes('FROM candidate_skill_proficiency_v2')) {
              return { results: [] };
            }
            if (query.includes('FROM m2_audit_event')) {
              return { results: [] };
            }
            return { results: [] };
          }),
          run: vi.fn().mockResolvedValue({ success: true })
        }))
      }))
    };
  }

  function createMockEnv(mockDb: any) {
    return {
      DB: mockDb,
      SESSION_KV: {
        get: vi.fn().mockImplementation(async (key: string) => {
          if (key.includes('test-valid-session-123') || key.includes('candidate-token')) {
            return 'candidate-token';
          }
          return null;
        })
      },
      JWT_SECRET: 'test-secret'
    };
  }

  // 1. Scenario: Authentication Requirement
  it('1. returns 401 Unauthorized for unauthenticated requests to /m3/tasks/next', async () => {
    const unauthReq = new Request('http://localhost/api/m3/tasks/next', {
      method: 'GET'
    });

    const res = await app.request(unauthReq, {}, { DB: createMockD1() } as any);
    expect(res.status).toBe(401);
  });

  // 2. Scenario: Single Task Delivery Invariant
  it('2. returns strictly ONE tailored Universal Task adhering to Core Model and candidate gap', async () => {
    const mockDb = createMockD1();
    const req = new Request('http://localhost/api/m3/tasks/next', {
      method: 'GET',
      headers: {
        'Cookie': 'intellihire_session=test-valid-session-123'
      }
    });

    const mockEnv = createMockEnv(mockDb);

    const res = await app.request(req, {}, mockEnv as any);
    expect(res.status).toBe(200);

    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.task).toBeDefined();

    // Verify Single Task Delivery Invariant (not an array of questions)
    expect(Array.isArray(body.task)).toBe(false);
    expect(body.task.id).toBeDefined();

    // Verify Core Model is fully attached
    const coreModel = body.task.coreModel;
    expect(coreModel).toBeDefined();
    expect(coreModel.input).toBeDefined();
    expect(Array.isArray(coreModel.constraints)).toBe(true);
    expect(coreModel.constraints.length).toBeGreaterThan(0);
    expect(coreModel.cognitiveOperation).toBeDefined();
    expect(coreModel.expectedOutput).toBeDefined();
    expect(Array.isArray(coreModel.observableEvidence)).toBe(true);
    expect(Array.isArray(coreModel.evaluationCriteria)).toBe(true);
  });

  // 3. Scenario: Seniority Depth & Rubric Scaling
  it('3. scales constraints, autonomy, and rubric weights between entry and lead tiers', async () => {
    const baseSeed = SEED_SIMULATIONS[0];
    const baseTask = seedSimulationToTaskDefinition(baseSeed, 1);

    // Entry level scaling
    const entryTask = scaleTaskToCandidateSeniority(baseTask, 'entry');
    expect(entryTask.seniorityScope.level).toBe('entry');
    expect(entryTask.seniorityScope.ambiguityLevel).toBe('low');
    expect(entryTask.seniorityScope.complexityFactor).toBe(1.0);
    expect(entryTask.scenario.operationalConstraints).toContain(
      'Implementation must pass all unit tests without modifying function signatures.'
    );

    // Lead level scaling
    const leadTask = scaleTaskToCandidateSeniority(baseTask, 'lead');
    expect(leadTask.seniorityScope.level).toBe('lead');
    expect(leadTask.seniorityScope.ambiguityLevel).toBe('high');
    expect(leadTask.seniorityScope.complexityFactor).toBe(2.1);
    expect(leadTask.scenario.operationalConstraints).toContain(
      'Must guarantee atomic state transitions under concurrent multi-region contention.'
    );

    // Verify rubric weights re-normalization (must sum strictly to 1.00)
    const entryWeightSum = entryTask.rubric.dimensions.reduce((acc, d) => acc + d.weight, 0);
    const leadWeightSum = leadTask.rubric.dimensions.reduce((acc, d) => acc + d.weight, 0);

    expect(Math.abs(entryWeightSum - 1.0)).toBeLessThan(0.01);
    expect(Math.abs(leadWeightSum - 1.0)).toBeLessThan(0.01);
  });

  // 4. Scenario: Seniority Normalization Robustness
  it('4. normalizes diverse seniority designations across all 7 professional tiers', () => {
    expect(normalizeSeniorityLevel('Associate Engineer')).toBe('entry');
    expect(normalizeSeniorityLevel('Junior Web Developer')).toBe('junior');
    expect(normalizeSeniorityLevel('Mid-Level Python Dev')).toBe('mid');
    expect(normalizeSeniorityLevel('Sr. Software Architect')).toBe('senior');
    expect(normalizeSeniorityLevel('Staff Infrastructure Lead')).toBe('lead');
    expect(normalizeSeniorityLevel('Engineering Manager')).toBe('manager');
    expect(normalizeSeniorityLevel('VP of Engineering / Executive')).toBe('executive');
    expect(normalizeSeniorityLevel(undefined)).toBe('mid');
  });

  // 5. Scenario: Duplicate Detection & Repetition Avoidance
  it('5. avoids previously completed tasks and selects the next unattempted target', async () => {
    // Simulate candidate having already completed the rate limiter and edge failover seeds
    const pastSessions = [
      { definition_id: 'sim-tech-rate-limiter' },
      { definition_id: 'sim-tech-cloudflare-workers-failover' }
    ];

    const mockDb = createMockD1({ pastSessions });
    const req = new Request('http://localhost/api/m3/tasks/next', {
      method: 'GET',
      headers: {
        'Cookie': 'intellihire_session=test-valid-session-123'
      }
    });

    const mockEnv = createMockEnv(mockDb);

    const res = await app.request(req, {}, mockEnv as any);
    expect(res.status).toBe(200);

    const body = await res.json() as any;
    // Must NOT be one of the already completed seeds
    expect(body.task.id).not.toBe('sim-tech-rate-limiter');
    expect(body.task.id).not.toBe('sim-tech-cloudflare-workers-failover');
  });

  // 6. Scenario: Deterministic Repetition Fingerprint
  it('6. generates deterministic repetition fingerprints across identical and varying tasks', () => {
    const fp1 = calculateTaskRepetitionFingerprint(
      'Distributed Token Bucket Rate Limiter',
      'Implement concurrency controls',
      'Distributed Systems'
    );
    const fp2 = calculateTaskRepetitionFingerprint(
      'distributed token bucket rate limiter',
      'IMPLEMENT CONCURRENCY CONTROLS',
      'distributed systems'
    );
    const fpDiff = calculateTaskRepetitionFingerprint(
      'SaaS DCF Financial Valuation Model',
      'Perform DCF modeling',
      'Financial Valuation'
    );

    expect(fp1).toBe(fp2);
    expect(fp1).not.toBe(fpDiff);
    expect(fp1.startsWith('fp-')).toBe(true);
  });

  // 7. Scenario: Non-Technical Task Modality & Archetypes
  it('7. synthesizes non-technical tasks for finance and operations roles', () => {
    const finSeed = SEED_SIMULATIONS.find(s => s.simulation_type === 'financial_analysis')!;
    expect(finSeed).toBeDefined();

    const finTask = seedSimulationToTaskDefinition(finSeed, 1);
    expect(finTask.taskForm).toBe('quantitative_calculation');
    expect(finTask.taskFamily).toBe('financial_modeling');
    expect(finTask.modality).toBe('financial_analysis');

    const opsSeed = SEED_SIMULATIONS.find(s => s.simulation_type === 'operational_triage')!;
    expect(opsSeed).toBeDefined();

    const opsTask = seedSimulationToTaskDefinition(opsSeed, 1);
    expect(opsTask.taskForm).toBe('scenario');
    expect(opsTask.taskFamily).toBe('operations_management');
    expect(opsTask.modality).toBe('operational_triage');
  });

  // 8. Scenario: Universal Task Validator Validates Correct Schema
  it('8. validates universal task schema and quality through POST /m3/tasks/validate', async () => {
    const baseSeed = SEED_SIMULATIONS[0];
    const task = seedSimulationToTaskDefinition(baseSeed, 1);

    const req = new Request('http://localhost/api/m3/tasks/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'intellihire_session=test-valid-session-123'
      },
      body: JSON.stringify({ task })
    });

    const mockEnv = createMockEnv(createMockD1());

    const res = await app.request(req, {}, mockEnv as any);
    expect(res.status).toBe(200);

    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.is_valid).toBe(true);
    expect(body.safety_passed).toBe(true);
    expect(body.quality_score).toBeGreaterThanOrEqual(0.90);
  });

  // 9. Scenario: Protected Demographic Attributes Rejection
  it('9. catches and rejects tasks with sensitive demographic traits via validator', async () => {
    const baseSeed = SEED_SIMULATIONS[0];
    const toxicTask = seedSimulationToTaskDefinition(baseSeed, 1);

    // Inject protected demographic traits into scenario background
    (toxicTask.scenario as any).candidate_gender = 'female';
    (toxicTask.scenario as any).candidate_religion = 'jewish';

    const req = new Request('http://localhost/api/m3/tasks/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'intellihire_session=test-valid-session-123'
      },
      body: JSON.stringify({ task: toxicTask })
    });

    const mockEnv = createMockEnv(createMockD1());

    const res = await app.request(req, {}, mockEnv as any);
    expect(res.status).toBe(200);

    const body = await res.json() as any;
    expect(body.safety_passed).toBe(false);
    expect(body.sensitive_violations.length).toBeGreaterThan(0);
  });

  // 10. Scenario: Adaptive Next Session Launch
  it('10. launches session using definition_id: "adaptive_next" with scaled task', async () => {
    const req = new Request('http://localhost/api/m3/simulations/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'intellihire_session=test-valid-session-123'
      },
      body: JSON.stringify({
        definition_id: 'adaptive_next',
        force_new: true
      })
    });

    const mockEnv = createMockEnv(createMockD1({ seniority: 'lead' }));

    const res = await app.request(req, {}, mockEnv as any);
    expect(res.status).toBe(200);

    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.session_id).toBeDefined();
    expect(body.task).toBeDefined();
    expect(body.task.seniorityScope.level).toBe('lead');
  });

  // 11. Scenario: Validation Predicate Catches Malformed Tasks
  it('11. validateUniversalTaskDefinition returns false for incomplete tasks', () => {
    expect(validateUniversalTaskDefinition(null as any)).toBe(false);
    expect(validateUniversalTaskDefinition({} as any)).toBe(false);
    expect(validateUniversalTaskDefinition({ id: 'task-1' } as any)).toBe(false);

    // Missing scenario objective
    expect(validateUniversalTaskDefinition({
      id: 'task-1',
      modality: 'coding',
      competencyTarget: { name: 'Test' },
      scenario: { initialRequirements: ['A'] },
      rubric: { dimensions: [{ name: 'Test', weight: 1.0 }] }
    } as any)).toBe(false);

    // Missing rubric dimensions
    expect(validateUniversalTaskDefinition({
      id: 'task-1',
      modality: 'coding',
      competencyTarget: { name: 'Test' },
      scenario: { objective: 'Test objective', initialRequirements: ['A'] },
      rubric: { dimensions: [] }
    } as any)).toBe(false);
  });

  // 12. Scenario: Pure Data Governance Stripping
  it('12. recursively scrubs demographic attributes from arbitrary task objects', () => {
    const rawData = {
      task: {
        id: 'task-clean',
        candidate_age: 29,
        nested: {
          birth_year: 1995,
          valid_attribute: 'high_priority'
        }
      }
    };

    const { sanitized, sensitiveTraitsFound } = sanitizeContextForTaskTargeting(rawData);
    expect((sanitized.task as any).candidate_age).toBeUndefined();
    expect((sanitized.task.nested as any).birth_year).toBeUndefined();
    expect(sanitized.task.nested.valid_attribute).toBe('high_priority');
    expect(sensitiveTraitsFound.length).toBe(2);
  });
});
