import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';
import {
  validateSimulationDefinitionConfig,
  recordToSimulationConfig,
  seedSimulationToTaskDefinition,
  scaleTaskToCandidateSeniority,
  WorkSurfaceType,
  SeniorityLevel
} from '../../src/shared/m3WorkRoundContracts';

// Mock hono/jwt for authentication testing
vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'tenant-a-token') {
      return { id: 'user-tenant-a', role: 'candidate', full_name: 'Alice A', organization_id: 'org-tenant-a' };
    }
    if (token === 'tenant-b-token') {
      return { id: 'user-tenant-b', role: 'candidate', full_name: 'Bob B', organization_id: 'org-tenant-b' };
    }
    return null;
  })
}));

const createMockEnv = (overrides: Record<string, any> = {}) => {
  return {
    SESSION_KV: {
      get: vi.fn().mockImplementation(async (key: string) => {
        if (key === 'session:tenant-a-token') return 'tenant-a-token';
        if (key === 'session:tenant-b-token') return 'tenant-b-token';
        return null;
      })
    },
    DB: overrides.DB || {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          first: vi.fn().mockImplementation(async () => {
            if (query.includes('user_account')) {
              if (args[0] === 'user-tenant-a') return { organization_id: 'org-tenant-a' };
              if (args[0] === 'user-tenant-b') return { organization_id: 'org-tenant-b' };
              return { organization_id: 'org_default_public' };
            }
            return null;
          }),
          all: vi.fn().mockResolvedValue({ results: [] }),
          run: vi.fn().mockResolvedValue({ success: true })
        })
      })
    }
  };
};

describe('M03 Phase 2 — Universal Simulation Domain Model & Configuration Hardening', () => {

  // --------------------------------------------------------------------------
  // Area 1: Contract validation for all 10 work-surface modalities
  // --------------------------------------------------------------------------
  describe('Area 1: Universal Work-Surface Modalities (All 10 Types)', () => {
    const modalities: WorkSurfaceType[] = [
      'code_editor',
      'sql_query',
      'data_analysis',
      'financial_table',
      'engineering_calc',
      'operations_decision',
      'document_writing',
      'legal_memo',
      'research_analysis',
      'structured_response'
    ];

    modalities.forEach((modality) => {
      it(`validates configuration successfully for modality: ${modality}`, () => {
        const payload = {
          title: `Universal Task for ${modality}`,
          target_role: 'Principal Architect',
          domain: 'infrastructure_dev',
          simulation_type: 'technical_architecture',
          work_surface_type: modality,
          seniority_level: 'senior',
          difficulty_level: 4,
          scenario: {
            background: 'A critical scenario testing the specified work surface modality.',
            objective: 'Produce a verifiable deliverable via the appropriate surface.',
            initial_requirements: ['Meet all performance and security benchmarks.'],
            constraints: ['Latency under 50ms.'],
            tools_available: ['Diagnostic Suite']
          },
          rubric: {
            dimensions: [
              { name: 'correctness', weight: 0.5, description: 'Accuracy', criteria: 'Meets requirements' },
              { name: 'decision_quality', weight: 0.5, description: 'Quality', criteria: 'Clean architecture' }
            ]
          }
        };

        const res = validateSimulationDefinitionConfig(payload);
        expect(res.valid).toBe(true);
        expect(res.errors).toHaveLength(0);
        expect(res.validated?.work_surface_type).toBe(modality);
      });
    });

    it('rejects unsupported or fictitious work-surface modalities', () => {
      const payload = {
        title: 'Invalid Modality Task',
        target_role: 'Tester',
        domain: 'qa',
        simulation_type: 'testing',
        work_surface_type: 'telepathic_interface',
        difficulty_level: 3,
        scenario: { objective: 'Test', initial_requirements: ['Req'] },
        rubric: { dimensions: [{ name: 'accuracy', weight: 1.0 }] }
      };

      const res = validateSimulationDefinitionConfig(payload);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('work_surface_type'))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Area 2: Unknown occupation & domain metadata handling without hardcoded enums
  // --------------------------------------------------------------------------
  describe('Area 2: Extensible Non-Seed Occupation and Domain Handling', () => {
    it('accepts novel domains and occupation codes without hardcoded enum restrictions', () => {
      const payload = {
        title: 'Quantum Key Distribution Network Protocol Simulation',
        target_role: 'Quantum Information Scientist',
        occupation_code: '19-2012.00',
        domain: 'quantum_cryptography',
        simulation_type: 'protocol_design',
        work_surface_type: 'code_editor',
        difficulty_level: 5,
        scenario: {
          background: 'Establishing decoy-state BB84 protocol over noisy fiber optics.',
          objective: 'Design error-correction parity check matrix under 4% quantum bit error rate.',
          initial_requirements: ['Implement syndrome measurement', 'Reconcile key with Alice and Bob'],
          constraints: ['QBER threshold <= 0.05', 'Sub-millisecond latency']
        },
        rubric: {
          dimensions: [
            { name: 'information_theoretic_security', weight: 0.6, description: 'Security', criteria: 'Zero leakage' },
            { name: 'computational_efficiency', weight: 0.4, description: 'Speed', criteria: 'O(N log N)' }
          ]
        },
        metadata: {
          qpu_target: 'ionq_forte',
          coherence_time_us: 12000
        }
      };

      const res = validateSimulationDefinitionConfig(payload);
      expect(res.valid).toBe(true);
      expect(res.validated?.domain).toBe('quantum_cryptography');
      expect(res.validated?.occupation_code).toBe('19-2012.00');
      expect(res.validated?.metadata.qpu_target).toBe('ionq_forte');
    });

    it('rejects malformed domain strings with illegal characters', () => {
      const payload = {
        title: 'Malformed Domain Task',
        target_role: 'Scientist',
        domain: 'quantum cryptography!@#$',
        simulation_type: 'analysis',
        work_surface_type: 'data_analysis',
        difficulty_level: 3,
        scenario: { objective: 'Analyze', initial_requirements: ['Req 1'] },
        rubric: { dimensions: [{ name: 'quality', weight: 1.0 }] }
      };

      const res = validateSimulationDefinitionConfig(payload);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.toLowerCase().includes('domain'))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Area 3: Seniority scaling and constraint validation
  // --------------------------------------------------------------------------
  describe('Area 3: Seniority Level Scaling & Boundary Validation', () => {
    const validSeniorityLevels: SeniorityLevel[] = ['entry', 'junior', 'mid', 'senior', 'lead'];

    validSeniorityLevels.forEach((level) => {
      it(`accepts valid seniority level: ${level}`, () => {
        const payload = {
          title: `Task for ${level}`,
          target_role: 'Engineer',
          domain: 'cloud_infra',
          simulation_type: 'sysadmin',
          work_surface_type: 'code_editor',
          seniority_level: level,
          difficulty_level: 3,
          scenario: { objective: 'Diagnose issue', initial_requirements: ['Check logs'] },
          rubric: { dimensions: [{ name: 'speed', weight: 1.0, description: 'Speed', criteria: 'Quick resolution' }] }
        };

        const res = validateSimulationDefinitionConfig(payload);
        expect(res.valid).toBe(true);
        expect(res.validated?.seniority_level).toBe(level);
      });
    });

    it('rejects invalid seniority levels', () => {
      const payload = {
        title: 'Invalid Seniority Task',
        target_role: 'Engineer',
        domain: 'cloud',
        simulation_type: 'sysadmin',
        work_surface_type: 'code_editor',
        seniority_level: 'god_mode_wizard',
        difficulty_level: 3,
        scenario: { objective: 'Test', initial_requirements: ['Req'] },
        rubric: { dimensions: [{ name: 'test', weight: 1.0, description: 'Test', criteria: 'Criteria' }] }
      };

      const res = validateSimulationDefinitionConfig(payload);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('seniority_level'))).toBe(true);
    });

    it('properly adapts task constraints and expectations when scaling across seniority', () => {
      const baseTask = seedSimulationToTaskDefinition({
        id: 'sim-sample-scaling',
        title: 'Cache Invalidation Service',
        target_role: 'Backend Engineer',
        domain: 'software',
        simulation_type: 'coding',
        competency_name: 'Distributed Systems',
        skill_name: 'Caching',
        difficulty_level: 3,
        scenario: {
          background: 'Cache tier',
          objective: 'Build invalidation queue',
          initial_requirements: ['Publish event', 'Purge keys'],
          constraints: ['Memory bound < 50MB'],
          tools_available: ['Redis Client'],
          expected_output_type: 'code'
        },
        rubric: { dimensions: [{ name: 'correctness', weight: 1.0, description: 'Correctness', criteria: 'Passes tests' }] }
      });

      const entryTask = scaleTaskToCandidateSeniority(baseTask, 'entry');
      expect(entryTask.seniorityScope?.level).toBe('entry');
      expect(entryTask.scenario.operationalConstraints.some(c => c.includes('unit tests'))).toBe(true);

      const leadTask = scaleTaskToCandidateSeniority(baseTask, 'lead');
      expect(leadTask.seniorityScope?.level).toBe('lead');
      expect(leadTask.scenario.operationalConstraints.some(c => c.includes('SLO') || c.includes('atomic state transitions'))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Area 4: Valid and invalid simulation configurations (weights, bounds, string lengths)
  // --------------------------------------------------------------------------
  describe('Area 4: Configuration Bounds, String Lengths & Rubric Weight Sums', () => {
    it('rejects title shorter than 3 characters or longer than 200 characters', () => {
      const shortTitle = {
        title: 'AB',
        target_role: 'Dev',
        domain: 'dev',
        simulation_type: 'coding',
        work_surface_type: 'code_editor',
        difficulty_level: 2,
        scenario: { objective: 'Obj', initial_requirements: ['Req'] },
        rubric: { dimensions: [{ name: 'dim', weight: 1.0 }] }
      };
      expect(validateSimulationDefinitionConfig(shortTitle).valid).toBe(false);

      const longTitle = {
        ...shortTitle,
        title: 'X'.repeat(201)
      };
      expect(validateSimulationDefinitionConfig(longTitle).valid).toBe(false);
    });

    it('rejects difficulty level out of bounds (must be 1-5)', () => {
      const invalidDifficulty = {
        title: 'Valid Title',
        target_role: 'Developer',
        domain: 'software',
        simulation_type: 'coding',
        work_surface_type: 'code_editor',
        difficulty_level: 6,
        scenario: { objective: 'Obj', initial_requirements: ['Req'] },
        rubric: { dimensions: [{ name: 'dim', weight: 1.0 }] }
      };
      expect(validateSimulationDefinitionConfig(invalidDifficulty).valid).toBe(false);

      const zeroDifficulty = { ...invalidDifficulty, difficulty_level: 0 };
      expect(validateSimulationDefinitionConfig(zeroDifficulty).valid).toBe(false);
    });

    it('rejects rubric weights that do not sum to approximately 1.0 (range: 0.80 - 1.20)', () => {
      const underweighted = {
        title: 'Underweighted Rubric',
        target_role: 'Developer',
        domain: 'software',
        simulation_type: 'coding',
        work_surface_type: 'code_editor',
        difficulty_level: 3,
        scenario: { objective: 'Obj', initial_requirements: ['Req'] },
        rubric: {
          dimensions: [
            { name: 'dim1', weight: 0.2 },
            { name: 'dim2', weight: 0.3 }
          ] // sum = 0.5 < 0.8
        }
      };
      const resUnder = validateSimulationDefinitionConfig(underweighted);
      expect(resUnder.valid).toBe(false);
      expect(resUnder.errors.some(e => e.includes('should sum to approximately 1.0'))).toBe(true);

      const overweighted = {
        ...underweighted,
        rubric: {
          dimensions: [
            { name: 'dim1', weight: 0.8 },
            { name: 'dim2', weight: 0.9 }
          ] // sum = 1.7 > 1.2
        }
      };
      const resOver = validateSimulationDefinitionConfig(overweighted);
      expect(resOver.valid).toBe(false);
      expect(resOver.errors.some(e => e.includes('should sum to approximately 1.0'))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Area 5: Persistence round-trips for dynamic simulation definitions
  // --------------------------------------------------------------------------
  describe('Area 5: Persistence Round-Trip Conversion (recordToSimulationConfig)', () => {
    it('faithfully deserializes a raw D1 record into a typed SimulationDefinitionConfig', () => {
      const rawD1Row = {
        id: 'sim-custom-telemetry',
        organization_id: 'org-tenant-a',
        title: 'Telemetry Pipeline Stress Test',
        occupation_code: '15-1254.00',
        target_role: 'Lead Data Engineer',
        domain: 'data_engineering',
        simulation_type: 'data_analysis',
        work_surface_type: 'data_analysis',
        seniority_level: 'lead',
        task_form: 'production_simulation',
        task_family: 'debugging_troubleshooting',
        difficulty_level: 4,
        scenario_json: JSON.stringify({
          background: 'High volume IoT sensors streaming 1M events/sec.',
          objective: 'Detect backpressure and optimize watermark drift.',
          initial_requirements: ['Partition by sensor group', 'Handle late-arriving records'],
          constraints: ['Zero message drop', 'P99 latency < 200ms'],
          starting_data: { stream_speed_eps: 1000000 },
          tools_available: ['Flink Dashboard', 'Kafka Lag Inspector']
        }),
        dynamic_injection_json: JSON.stringify({
          trigger_step: 2,
          alert_title: 'KAFKA BROKER PARTITION FAILURE',
          new_requirement: 'Rebalance partition assignment during active ingest',
          constraint_change: 'Maximum allowable replica lag: 1000 events',
          rationale: 'Tests live resilience under hardware failure'
        }),
        expected_output_schema_json: JSON.stringify({
          type: 'object',
          properties: { pipeline_config_yaml: { type: 'string' } }
        }),
        rubric_json: JSON.stringify({
          dimensions: [
            { name: 'resilience', weight: 0.5, description: 'Tolerates failures', criteria: 'Zero data loss' },
            { name: 'throughput', weight: 0.5, description: 'Sustained TPS', criteria: 'Handles 1M eps' }
          ]
        }),
        metadata_json: JSON.stringify({
          engine: 'apache_flink_1.17',
          kafka_version: '3.4'
        }),
        version: 2,
        is_active: 1,
        created_at: '2026-10-09T12:00:00Z',
        updated_at: '2026-10-09T12:00:00Z'
      };

      const config = recordToSimulationConfig(rawD1Row);
      expect(config.id).toBe('sim-custom-telemetry');
      expect(config.organization_id).toBe('org-tenant-a');
      expect(config.work_surface_type).toBe('data_analysis');
      expect(config.seniority_level).toBe('lead');
      expect(config.task_form).toBe('production_simulation');
      expect(config.task_family).toBe('debugging_troubleshooting');
      expect(config.scenario.objective).toBe('Detect backpressure and optimize watermark drift.');
      expect(config.scenario.starting_data.stream_speed_eps).toBe(1000000);
      expect(config.dynamic_injection?.alert_title).toBe('KAFKA BROKER PARTITION FAILURE');
      expect(config.rubric.dimensions).toHaveLength(2);
      expect(config.metadata.engine).toBe('apache_flink_1.17');
      expect(config.version).toBe(2);
      expect(Boolean(config.is_active)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Area 6: Migration compatibility with legacy schema records
  // --------------------------------------------------------------------------
  describe('Area 6: Migration Compatibility for Legacy Seed Records', () => {
    it('gracefully applies defaults to pre-migration records missing modern columns', () => {
      const legacyD1Row = {
        id: 'sim-legacy-001',
        organization_id: 'org_default_public',
        title: 'Legacy Rate Limiter',
        domain: 'software',
        simulation_type: 'coding',
        difficulty_level: 3,
        scenario_json: JSON.stringify({
          objective: 'Rate limit requests',
          initial_requirements: ['Enforce quota']
        }),
        rubric_json: JSON.stringify({
          dimensions: [{ name: 'correctness', weight: 1.0 }]
        }),
        work_surface_type: null,
        seniority_level: null,
        task_form: null,
        task_family: null,
        metadata_json: null
      };

      const config = recordToSimulationConfig(legacyD1Row);
      expect(config.work_surface_type).toBe('code_editor'); // Default for coding
      expect(config.seniority_level).toBe('mid'); // Default seniority
      expect(config.task_form).toBe('scenario'); // Default task form
      expect(config.task_family).toBe('coding'); // Default task family
      expect(config.metadata).toEqual({});
      expect(config.version).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // Area 7: Backward compatibility of existing M03 API responses
  // --------------------------------------------------------------------------
  describe('Area 7: Backward Compatibility of API Endpoints', () => {
    it('returns seed simulations with all standard legacy properties intact', async () => {
      const env = createMockEnv();
      const req = new Request('http://localhost/api/m3/simulations/definitions/sim-tech-rate-limiter', {
        headers: { Cookie: 'intellihire_session=tenant-a-token' }
      });
      const res = await app.request(req, {}, env as any);
      expect(res.status).toBe(200);

      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.simulation.id).toBe('sim-tech-rate-limiter');
      expect(body.simulation.title).toBe('Distributed Token Bucket Rate Limiter');
      expect(body.simulation.domain).toBe('software');
      expect(body.simulation.simulation_type).toBe('coding');
      expect(body.simulation.difficulty_level).toBe(3);
      expect(body.simulation.scenario).toBeDefined();
      expect(body.simulation.rubric.dimensions.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Area 8: Tenant isolation (cross-tenant definition and session access)
  // --------------------------------------------------------------------------
  describe('Area 8: Tenant Isolation & Cross-Tenant Rejection', () => {
    it('rejects cross-tenant access when Tenant B attempts to retrieve Tenant A private definition', async () => {
      const env = createMockEnv({
        DB: {
          prepare: (query: string) => ({
            bind: (...args: any[]) => ({
              first: vi.fn().mockImplementation(async () => {
                if (query.includes('user_account')) return { organization_id: 'org-tenant-b' };
                if (query.includes('simulation_definition')) {
                  const [, orgId] = args;
                  // If definition belongs to org-tenant-a, org-tenant-b query returns null
                  if (orgId === 'org-tenant-a') {
                    return { id: 'sim-tenant-a-private', organization_id: 'org-tenant-a' };
                  }
                  return null;
                }
                return null;
              }),
              all: vi.fn().mockResolvedValue({ results: [] }),
              run: vi.fn().mockResolvedValue({ success: true })
            })
          })
        }
      });

      const req = new Request('http://localhost/api/m3/simulations/definitions/sim-tenant-a-private', {
        headers: { Cookie: 'intellihire_session=tenant-b-token' }
      });
      const res = await app.request(req, {}, env as any);
      expect(res.status).toBe(404);
      const data = await res.json() as any;
      expect(data.error).toBe('Simulation definition not found');
    });

    it('persists dynamically created definitions with caller organization_id enforced', async () => {
      let insertedOrgId = '';
      const env = createMockEnv({
        DB: {
          prepare: (query: string) => ({
            bind: (...args: any[]) => ({
              first: vi.fn().mockResolvedValue({ organization_id: 'org-tenant-a' }),
              run: vi.fn().mockImplementation(async () => {
                if (query.includes('INSERT INTO simulation_definition')) {
                  insertedOrgId = args[1]; // organization_id is 2nd param
                }
                return { success: true };
              }),
              all: vi.fn().mockResolvedValue({ results: [] })
            })
          })
        }
      });

      const newSimPayload = {
        id: 'sim-new-tenant-a',
        title: 'Custom Tenant A Financial Audit',
        target_role: 'Financial Analyst',
        domain: 'finance',
        simulation_type: 'financial_modeling',
        work_surface_type: 'financial_table',
        difficulty_level: 3,
        scenario: {
          objective: 'Build DCF model for M&A target',
          initial_requirements: ['Forecast 5 years FCF', 'Apply terminal multiple'],
          constraints: ['Discount rate = 10%']
        },
        rubric: {
          dimensions: [
            { name: 'modeling', weight: 0.5, description: 'Accuracy', criteria: 'Matches DCF' },
            { name: 'valuation', weight: 0.5, description: 'Valuation', criteria: 'Sound multiple' }
          ]
        }
      };

      const req = new Request('http://localhost/api/m3/simulations/definitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'intellihire_session=tenant-a-token'
        },
        body: JSON.stringify(newSimPayload)
      });

      const res = await app.request(req, {}, env as any);
      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(insertedOrgId).toBe('org-tenant-a');
    });
  });

  // --------------------------------------------------------------------------
  // Area 9: Missing, malformed, and oversized configuration payloads (>512 KB, prototype pollution)
  // --------------------------------------------------------------------------
  describe('Area 9: Security Boundaries (Payload Limits & Prototype Pollution)', () => {
    it('rejects oversized simulation configurations (> 512 KB)', () => {
      const hugeObject: any = {
        title: 'Massive Payload Task',
        target_role: 'Data Scientist',
        domain: 'deep_learning',
        simulation_type: 'model_tuning',
        work_surface_type: 'code_editor',
        difficulty_level: 4,
        scenario: {
          objective: 'Train model',
          initial_requirements: ['Req 1'],
          starting_data: { massive_weights: 'X'.repeat(600 * 1024) } // 600 KB
        },
        rubric: { dimensions: [{ name: 'accuracy', weight: 1.0 }] }
      };

      const res = validateSimulationDefinitionConfig(hugeObject);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('exceeds maximum allowed size'))).toBe(true);
    });

    it('rejects payloads containing prototype pollution keys (__proto__, constructor, prototype)', () => {
      const maliciousPayload = {
        title: 'Malicious Task',
        target_role: 'Hacker',
        domain: 'security',
        simulation_type: 'coding',
        work_surface_type: 'code_editor',
        difficulty_level: 3,
        scenario: { objective: 'Test', initial_requirements: ['Req'] },
        rubric: { dimensions: [{ name: 'test', weight: 1.0 }] },
        constructor: { polluted: true }
      };

      const res = validateSimulationDefinitionConfig(maliciousPayload);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('Prototype pollution detected'))).toBe(true);
    });

    it('rejects payloads missing mandatory fields', () => {
      const missingScenario = {
        title: 'Missing Scenario',
        target_role: 'Developer',
        domain: 'software',
        simulation_type: 'coding',
        work_surface_type: 'code_editor',
        difficulty_level: 2,
        rubric: { dimensions: [{ name: 'test', weight: 1.0 }] }
      };
      expect(validateSimulationDefinitionConfig(missingScenario).valid).toBe(false);

      const missingRubric = {
        title: 'Missing Rubric',
        target_role: 'Developer',
        domain: 'software',
        simulation_type: 'coding',
        work_surface_type: 'code_editor',
        difficulty_level: 2,
        scenario: { objective: 'Test', initial_requirements: ['Req'] }
      };
      expect(validateSimulationDefinitionConfig(missingRubric).valid).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Area 10: Regression coverage for execution, evaluation and evidence package
  // --------------------------------------------------------------------------
  describe('Area 10: Simulation Session Execution, Evaluation & Evidence Flow', () => {
    it('executes candidate code via sandbox and evaluates submission with full evidence package', async () => {
      let sessionRecord: any = {
        id: 'session-domain-test',
        user_id: 'user-tenant-a',
        organization_id: 'org-tenant-a',
        definition_id: 'sim-tech-rate-limiter',
        status: 'in_progress',
        current_step: 1,
        dynamic_state_json: '{}',
        candidate_work_json: '{}',
        telemetry_events_json: '[]'
      };

      let evaluationRecord: any = null;

      const env = createMockEnv({
        DB: {
          prepare: (query: string) => ({
            bind: (...args: any[]) => ({
              first: vi.fn().mockImplementation(async () => {
                if (query.includes('user_account')) return { organization_id: 'org-tenant-a' };
                if (query.includes('simulation_session')) return sessionRecord;
                if (query.includes('simulation_evaluation')) return evaluationRecord;
                return null;
              }),
              run: vi.fn().mockImplementation(async () => {
                if (query.includes('UPDATE simulation_session')) {
                  if (args[0] === 'completed') {
                    sessionRecord.status = 'completed';
                  }
                }
                if (query.includes('INSERT INTO simulation_evaluation')) {
                  evaluationRecord = {
                    id: args[0],
                    session_id: args[1],
                    user_id: args[2],
                    overall_score: args[3],
                    dimension_scores_json: args[4],
                    observable_evidence_json: args[5],
                    model_interpretation_json: args[6],
                    remediation_recommendation_json: args[7],
                    confidence_score: args[8],
                    uncertainty_score: args[9],
                    observed_facts_json: args[10],
                    provenance_json: args[11],
                    alternative_validity: args[14],
                    deterministic_verification_json: args[15],
                    created_at: new Date().toISOString()
                  };
                }
                return { success: true };
              }),
              all: vi.fn().mockResolvedValue({ results: [] })
            })
          })
        }
      });

      // 1. Execute code in sandbox
      const execReq = new Request('http://localhost/api/m3/simulations/sessions/session-domain-test/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'intellihire_session=tenant-a-token'
        },
        body: JSON.stringify({
          action_type: 'run_code',
          code: 'function isAllowed(userId) { return true; }'
        })
      });
      const execRes = await app.request(execReq, {}, env as any);
      expect(execRes.status).toBe(200);
      const execData = await execRes.json() as any;
      expect(execData.success).toBe(true);
      expect(execData.execution_result).toBeDefined();

      // 2. Submit candidate work
      const submitReq = new Request('http://localhost/api/m3/simulations/sessions/session-domain-test/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'intellihire_session=tenant-a-token'
        },
        body: JSON.stringify({
          final_output: 'class TokenBucketRateLimiter { isAllowed() { return true; } }',
          notes: 'Implemented sliding window'
        })
      });
      const submitRes = await app.request(submitReq, {}, env as any);
      expect(submitRes.status).toBe(200);
      const submitData = await submitRes.json() as any;
      expect(submitData.success).toBe(true);
      expect(submitData.overall_score).toBeDefined();
      expect(submitData.deterministic_verification).toBeDefined();

      // 3. Retrieve structured evidence package
      const pkgReq = new Request('http://localhost/api/m3/simulations/sessions/session-domain-test/evidence-package', {
        headers: { Cookie: 'intellihire_session=tenant-a-token' }
      });
      const pkgRes = await app.request(pkgReq, {}, env as any);
      expect(pkgRes.status).toBe(200);
      const pkgData = await pkgRes.json() as any;
      expect(pkgData.success).toBe(true);
      expect(pkgData.evidence_package).toBeDefined();
      expect(pkgData.evidence_package.organizationId).toBe('org-tenant-a');
      expect(pkgData.evidence_package.taskTitle).toBe('Distributed Token Bucket Rate Limiter');
      expect(pkgData.evidence_package.deterministicVerification).toBeDefined();
    });
  });
});
