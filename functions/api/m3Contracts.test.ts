import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';
import {
  validateCandidateContext,
  validateTaskDefinition,
  validateSubmission,
  validateEvaluation,
  seedSimulationToTaskDefinition,
  resolveCandidateJobContext,
  SEED_SIMULATIONS,
  CandidateContext,
  JobContext,
  CompetencyTarget,
  TaskDefinition,
  WorkSurface,
  Submission,
  ObservableEvidence,
  Evaluation,
  Explanation,
  Misconception,
  AdaptationDecision,
  M03Session
} from './simulationEngine';

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'candidate-token') {
      return { id: 'candidate-user-1', role: 'candidate', full_name: 'Alex Rivera', organization_id: 'org-m3' };
    }
    return null;
  })
}));

describe('M03 Phase 1: AI Work Round Engine Foundation Contracts & Context Reconciliation', () => {

  describe('1. Foundational Type Contracts & Validation Helpers', () => {

    it('validates CandidateContext schema compliance', () => {
      const validContext: CandidateContext = {
        userId: 'user-123',
        organizationId: 'org-123',
        targetRole: 'Staff Infrastructure Engineer',
        seniorityLevel: 'senior',
        extractedSkills: ['Distributed Systems', 'Kubernetes', 'Go'],
        verifiedClaims: [
          { claim: 'Led Kubernetes migration', source: 'm01_resume', confidence: 0.95 }
        ],
        currentReadinessScore: 0.82,
        diagnosedGaps: [
          { skillName: 'eBPF Kernel Profiling', gapType: 'unassessed', severity: 'moderate' }
        ]
      };

      expect(validateCandidateContext(validContext)).toBe(true);
      expect(validateCandidateContext({} as any)).toBe(false);
      expect(validateCandidateContext({ userId: '123' } as any)).toBe(false);
    });

    it('transforms SEED_SIMULATIONS into typed domain-agnostic TaskDefinition', () => {
      const rateLimiterSeed = SEED_SIMULATIONS.find(s => s.id === 'sim-tech-rate-limiter')!;
      expect(rateLimiterSeed).toBeDefined();

      const task: TaskDefinition = seedSimulationToTaskDefinition(rateLimiterSeed, 1);
      expect(validateTaskDefinition(task)).toBe(true);
      expect(task.id).toBe('sim-tech-rate-limiter');
      expect(task.roundIndex).toBe(1);
      expect(task.modality).toBe('coding');
      expect(task.competencyTarget.name).toBe('System Architecture & Concurrency');
      expect(task.scenario.toolsAvailable).toContain('TypeScript Code Editor');
      expect(task.dynamicInjection).toBeDefined();
      expect(task.dynamicInjection?.alertTitle).toContain('EMERGENCY CONSTRAINT SHIFT');
      expect(task.rubric.dimensions.length).toBeGreaterThanOrEqual(4);
      expect(task.provenance.generatorMethod).toBe('catalog_seed');
    });

    it('transforms non-technical SEED_SIMULATIONS (Finance & Operations) into valid TaskDefinitions', () => {
      const financeSeed = SEED_SIMULATIONS.find(s => s.domain === 'finance')!;
      const opsSeed = SEED_SIMULATIONS.find(s => s.domain === 'operations')!;

      const financeTask = seedSimulationToTaskDefinition(financeSeed, 1);
      expect(validateTaskDefinition(financeTask)).toBe(true);
      expect(financeTask.modality).toBe('financial_analysis');

      const opsTask = seedSimulationToTaskDefinition(opsSeed, 1);
      expect(validateTaskDefinition(opsTask)).toBe(true);
      expect(opsTask.modality).toBe('operational_triage');
    });

    it('validates Submission contract structure', () => {
      const sampleEvidence: ObservableEvidence = {
        telemetryActions: [
          { timestamp: Date.now(), actionType: 'test_run', payload: { passed: true } }
        ],
        constraintAdherenceScore: 0.95,
        toolUtilizationSummary: { test_runner: 3, editor: 12 },
        tradeOffsIdentified: ['Balanced memory ceiling with lookup latency'],
        behavioralSignals: {
          timeToFirstActionMs: 14000,
          totalActiveDurationMs: 420000,
          revisionCount: 5,
          testRunCount: 3
        }
      };

      const validSubmission: Submission = {
        id: 'sub-1',
        sessionId: 'sess-1',
        taskId: 'sim-tech-rate-limiter',
        roundIndex: 1,
        artifactPayload: {
          primaryOutput: 'class TokenBucketRateLimiter { ... }',
          outputType: 'source_code'
        },
        candidateRationale: 'Used circular ring-buffer for sliding window to preserve O(1) performance.',
        observableEvidence: sampleEvidence,
        submittedAt: new Date().toISOString()
      };

      expect(validateSubmission(validSubmission)).toBe(true);
      expect(validateSubmission({ id: 'sub-1' } as any)).toBe(false);
    });

    it('validates Evaluation, Explanation, and Misconception contracts', () => {
      const sampleMisconception: Misconception = {
        id: 'misc-clock-drift',
        category: 'boundary_condition',
        title: 'Clock Slew Vulnerability',
        description: 'Assumed monotonically strictly increasing wall clocks without handling NTP rewind adjustments.',
        severity: 'moderate',
        remediationGuidance: 'Use monotonic performance timers (process.hrtime or monotonic clock offsets) rather than Date.now().'
      };

      const sampleExplanation: Explanation = {
        stepByStepSolution: [
          'Initialize token count and monotonic epoch baseline',
          'Calculate elapsed delta on each inbound request',
          'Refill tokens proportionally up to maximum capacity'
        ],
        optimalApproachReasoning: 'Token bucket provides immediate burst handling while guaranteeing steady-state throughput bounds.',
        concreteExecutionWalkthrough: 'Maintain state in compact 64-bit word combining remaining tokens and timestamp fraction.',
        contrastAnalysis: {
          whatCandidateDidWell: ['Correct token subtraction logic', 'Sub-millisecond memory footprint'],
          whereCandidateDiverged: ['Clock skew rewind caused negative refill calculation'],
          architecturalOrMethodologicalTradeoffs: 'Prioritized simple Map storage over pre-allocated bitmask.'
        }
      };

      const validEvaluation: Evaluation = {
        id: 'eval-1',
        submissionId: 'sub-1',
        taskId: 'sim-tech-rate-limiter',
        overallScore: 0.88,
        dimensionScores: {
          correctness: { score: 0.90, weight: 0.35, feedback: 'Correct rolling calculation.' },
          resilience: { score: 0.85, weight: 0.35, feedback: 'Handled burst traffic cleanly.' },
          adaptability: { score: 0.90, weight: 0.30, feedback: 'Successfully applied fallback on simulated network cut.' }
        },
        observableEvidence: {
          telemetryActions: [],
          constraintAdherenceScore: 0.92,
          toolUtilizationSummary: {},
          tradeOffsIdentified: ['Evaluated local vs cluster synchronization'],
          behavioralSignals: { totalActiveDurationMs: 300000, revisionCount: 4 }
        },
        identifiedMisconceptions: [sampleMisconception],
        explanation: sampleExplanation,
        evaluatorType: 'hybrid',
        confidenceScore: 0.91,
        evaluatedAt: new Date().toISOString()
      };

      expect(validateEvaluation(validEvaluation)).toBe(true);
      expect(validEvaluation.identifiedMisconceptions[0].category).toBe('boundary_condition');
      expect(validEvaluation.explanation.contrastAnalysis.whatCandidateDidWell.length).toBeGreaterThan(0);
    });

    it('verifies M03Session composite lifecycle contract structure', () => {
      const task = seedSimulationToTaskDefinition(SEED_SIMULATIONS[0], 1);
      const mockSession: M03Session = {
        id: 'sess-full-cycle',
        userId: 'user-alex',
        organizationId: 'org-m3',
        candidateContext: {
          userId: 'user-alex',
          organizationId: 'org-m3',
          targetRole: 'Senior Backend Engineer',
          seniorityLevel: 'senior',
          extractedSkills: ['TypeScript', 'Distributed Systems'],
          verifiedClaims: [],
          currentReadinessScore: 0.75,
          diagnosedGaps: []
        },
        jobContext: {
          jobTitle: 'Senior Backend Engineer',
          targetSeniority: 'senior',
          requiredCompetencies: [{ name: 'System Architecture', priority: 'required' }],
          requiredSkills: ['Distributed Systems', 'TypeScript'],
          keyRequirements: ['Sub-second latency', 'High concurrency']
        },
        currentRoundIndex: 1,
        totalRoundsPlanned: 3,
        completedRounds: 0,
        status: 'in_progress',
        taskHistory: [
          {
            taskId: task.id,
            task,
            workSurface: {
              adapterId: 'code-editor-ts',
              modality: 'coding',
              title: 'TypeScript Concurrency Sandbox',
              editorType: 'code',
              configuration: {
                syntaxLanguage: 'typescript',
                allowedTools: ['TypeScript Code Editor', 'Test Case Runner']
              }
            }
          }
        ],
        cumulativeEvidenceLedger: {
          evaluatedSkills: {
            'Distributed Systems & Concurrency': { proficiency: 0.85, uncertainty: 0.22, observationCount: 1 }
          },
          totalTelemetryActions: 14,
          overallReadinessContribution: 0.82
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      expect(mockSession.status).toBe('in_progress');
      expect(mockSession.taskHistory.length).toBe(1);
      expect(mockSession.cumulativeEvidenceLedger.evaluatedSkills['Distributed Systems & Concurrency'].observationCount).toBe(1);
    });
  });

  describe('2. Context Aggregation & Multi-Source Reconciliation', () => {

    it('resolves CandidateContext and JobContext from D1 database tables', async () => {
      const mockDb = {
        prepare: (query: string) => ({
          bind: (...args: any[]) => ({
            first: vi.fn().mockImplementation(async () => {
              if (query.includes('FROM candidate_profile')) {
                return {
                  headline: 'Senior Cloud Architect',
                  target_role: 'Staff Platform Engineer',
                  experience_level: 'lead',
                  readiness_score: 0.78,
                  skills_json: '["Kubernetes","Terraform","Rust"]',
                  target_domain_id: 'software',
                  target_occupation_id: '15-1252.00'
                };
              }
              if (query.includes('FROM candidate_context')) {
                return { id: 'ctx-resume-active', resume_id: 'res-file-1' };
              }
              if (query.includes('FROM job_requisition')) {
                return {
                  id: 'req-prod-infra',
                  title: 'Staff Platform Engineer',
                  seniority_level: 'lead',
                  role_category: 'software',
                  raw_jd_text: 'Lead our global multi-cloud platform.',
                  parsed_requirements_json: JSON.stringify({
                    requirements: ['10+ years infrastructure experience', 'Deep Kubernetes internals knowledge'],
                    skills: ['Kubernetes', 'Distributed Consensus', 'eBPF']
                  })
                };
              }
              return null;
            }),
            all: vi.fn().mockImplementation(async () => {
              if (query.includes('FROM candidate_claim')) {
                return {
                  results: [
                    { claim_type: 'skill', claim_value: 'Distributed Consensus', confidence_score: 0.90 },
                    { claim_type: 'experience', claim_value: 'Engineered Raft-based cluster sync', confidence_score: 0.88 }
                  ]
                };
              }
              if (query.includes('candidate_skill_proficiency_v2')) {
                return {
                  results: [
                    { skill_id: 'sk-ebpf', skill_name: 'eBPF Profiling', proficiency_estimate: 0.40, uncertainty_estimate: 0.65 }
                  ]
                };
              }
              return { results: [] };
            })
          })
        })
      };

      const resolved = await resolveCandidateJobContext(mockDb, 'cand-alex', 'org-test');
      expect(resolved.candidateContext.targetRole).toBe('Staff Platform Engineer');
      expect(resolved.candidateContext.seniorityLevel).toBe('lead');
      expect(resolved.candidateContext.activeResumeId).toBe('res-file-1');
      expect(resolved.candidateContext.extractedSkills).toContain('Kubernetes');
      expect(resolved.candidateContext.extractedSkills).toContain('Distributed Consensus');
      expect(resolved.candidateContext.diagnosedGaps.length).toBe(1);
      expect(resolved.candidateContext.diagnosedGaps[0].skillName).toBe('eBPF Profiling');

      expect(resolved.jobContext.requisitionId).toBe('req-prod-infra');
      expect(resolved.jobContext.jobTitle).toBe('Staff Platform Engineer');
      expect(resolved.jobContext.keyRequirements.length).toBe(2);

      expect(resolved.targets.length).toBe(1);
      expect(resolved.targets[0].skillName).toBe('eBPF Profiling');
      expect(resolved.targets[0].diagnosisSource).toBe('m02_assessment_gap');
    });

    it('falls back gracefully when resume or job requisition is not yet created', async () => {
      const mockEmptyDb = {
        prepare: () => ({
          bind: () => ({
            first: vi.fn().mockResolvedValue(null),
            all: vi.fn().mockResolvedValue({ results: [] })
          })
        })
      };

      const resolved = await resolveCandidateJobContext(mockEmptyDb, 'cand-new', 'org-test');
      expect(resolved.candidateContext.targetRole).toBe('Senior Software Engineer');
      expect(resolved.candidateContext.currentReadinessScore).toBe(0.5);
      expect(resolved.jobContext.requiredSkills.length).toBeGreaterThan(0);
      expect(resolved.targets.length).toBeGreaterThan(0);
    });
  });

  describe('3. API Route Context Integration & Backward Compatibility', () => {

    it('GET /api/m3/simulations/context returns aggregated CandidateContext and JobContext', async () => {
      const mockEnv = {
        DB: {
          prepare: (query: string) => ({
            bind: (...args: any[]) => ({
              first: vi.fn().mockImplementation(async () => {
                if (query.includes('user_account')) return { organization_id: 'org-m3' };
                if (query.includes('candidate_profile')) {
                  return { target_role: 'Quantitative Financial Analyst', experience_level: 'senior', readiness_score: 0.72 };
                }
                return null;
              }),
              all: vi.fn().mockImplementation(async () => {
                if (query.includes('candidate_skill_proficiency_v2')) {
                  return {
                    results: [
                      { skill_id: 's-fin', skill_name: 'Financial Modeling', proficiency_estimate: 0.48, uncertainty_estimate: 0.55 }
                    ]
                  };
                }
                return { results: [] };
              })
            })
          })
        },
        SESSION_KV: {
          get: vi.fn().mockImplementation(async (id) => (id === 'session:candidate-token' ? 'candidate-token' : null))
        }
      };

      const req = new Request('http://localhost/api/m3/simulations/context', {
        headers: { 'Cookie': 'intellihire_session=candidate-token' }
      });

      const res = await app.request(req, {}, mockEnv as any);
      expect(res.status).toBe(200);

      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.candidate_context).toBeDefined();
      expect(data.candidate_context.targetRole).toBe('Quantitative Financial Analyst');
      expect(data.job_context).toBeDefined();
      expect(data.competency_targets.length).toBeGreaterThan(0);
    });

    it('POST /api/m3/simulations/sessions returns typed task definition while preserving legacy definition', async () => {
      const mockEnv = {
        DB: {
          prepare: (query: string) => ({
            bind: (...args: any[]) => ({
              first: vi.fn().mockImplementation(async () => {
                if (query.includes('user_account')) return { organization_id: 'org-m3' };
                return null;
              }),
              run: vi.fn().mockResolvedValue({ success: true })
            })
          })
        },
        SESSION_KV: {
          get: vi.fn().mockImplementation(async (id) => (id === 'session:candidate-token' ? 'candidate-token' : null))
        }
      };

      const req = new Request('http://localhost/api/m3/simulations/sessions', {
        method: 'POST',
        headers: { 'Cookie': 'intellihire_session=candidate-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ definition_id: 'sim-tech-rate-limiter' })
      });

      const res = await app.request(req, {}, mockEnv as any);
      expect(res.status).toBe(200);

      const data = await res.json() as any;
      expect(data.success).toBe(true);

      // Verify backward compatibility
      expect(data.definition).toBeDefined();
      expect(data.definition.id).toBe('sim-tech-rate-limiter');

      // Verify new Phase 1 typed task contract
      expect(data.task).toBeDefined();
      expect(data.task.id).toBe('sim-tech-rate-limiter');
      expect(data.task.modality).toBe('coding');
      expect(data.task.competencyTarget.name).toBe('System Architecture & Concurrency');
      expect(data.task.provenance.generatorMethod).toBe('catalog_seed');
    });
  });
});
