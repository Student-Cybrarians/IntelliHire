import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';
import { resolveCandidateJobContext } from './simulationEngine';
import {
  validateAssessmentContext,
  validateRoleContext,
  validateGapSignal,
  validateEvidenceReference,
  sanitizeContextForTaskTargeting,
  AssessmentContext,
  RoleContext
} from '../../src/shared/m3WorkRoundContracts';

describe('M03 Phase 2: Candidate, Resume, Job, Role & Competency Intelligence', () => {

  // Helper mock D1 database generator
  function createMockD1(customOverrides: Record<string, any> = {}) {
    return {
      prepare: vi.fn().mockImplementation((query: string) => ({
        bind: vi.fn().mockImplementation((...params: any[]) => ({
          first: vi.fn().mockImplementation(async () => {
            if (query.includes('FROM user_account')) {
              return customOverrides.userAccount !== undefined
                ? customOverrides.userAccount
                : { id: params[0] || 'cand-usr-1', organization_id: 'org-enterprise-alpha', role: 'candidate' };
            }
            if (query.includes('FROM candidate_profile')) {
              return customOverrides.profile !== undefined
                ? customOverrides.profile
                : {
                    user_id: params[0],
                    target_role: 'Staff ML Infrastructure Engineer',
                    experience_level: 'lead',
                    readiness_score: 0.82,
                    skills_json: '["Distributed Systems","PyTorch","CUDA","Kubernetes"]',
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
                    id: 'req-alpha-ml',
                    title: 'Staff ML Infrastructure Engineer',
                    seniority_level: 'lead',
                    role_category: 'software',
                    raw_jd_text: 'Lead large scale LLM training clusters with distributed fault tolerance.',
                    parsed_requirements_json: JSON.stringify({
                      requirements: ['8+ years distributed systems', 'Experience with Triton, NCCL, and GPU profiling'],
                      skills: ['Distributed Systems', 'GPU Kernel Optimization', 'Fault Tolerance']
                    })
                  };
            }
            if (query.includes('FROM job_description_context')) {
              return customOverrides.jdContext !== undefined ? customOverrides.jdContext : null;
            }
            return null;
          }),
          all: vi.fn().mockImplementation(async () => {
            if (query.includes('FROM candidate_claim')) {
              return customOverrides.claims !== undefined
                ? { results: customOverrides.claims }
                : {
                    results: [
                      { claim_type: 'skill', claim_value: 'Distributed Systems', confidence_score: 0.92 },
                      { claim_type: 'experience', claim_value: 'Designed 4096-GPU training cluster', confidence_score: 0.89 }
                    ]
                  };
            }
            if (query.includes('FROM assessment_evaluation')) {
              return customOverrides.evaluations !== undefined
                ? { results: customOverrides.evaluations }
                : {
                    results: [
                      {
                        score: 0.35,
                        feedback_json: JSON.stringify({
                          skill: 'GPU Kernel Optimization',
                          misconception: 'CUDA Shared Memory Bank Conflicts',
                          remediation: 'Use 32-bit stride padding to avoid serialization across warp threads.'
                        }),
                        created_at: '2026-10-07T10:00:00Z'
                      }
                    ]
                  };
            }
            if (query.includes('FROM candidate_skill_proficiency_v2')) {
              return customOverrides.proficiencies !== undefined
                ? { results: customOverrides.proficiencies }
                : {
                    results: [
                      { skill_id: 'sk-dist-sys', skill_name: 'Distributed Systems', proficiency_estimate: 0.85, uncertainty_estimate: 0.15 },
                      { skill_id: 'sk-gpu-opt', skill_name: 'GPU Kernel Optimization', proficiency_estimate: 0.35, uncertainty_estimate: 0.20 }
                    ]
                  };
            }
            if (query.includes('FROM simulation_evaluation')) {
              return customOverrides.simEvaluations !== undefined
                ? { results: customOverrides.simEvaluations }
                : { results: [] };
            }
            return { results: [] };
          })
        }))
      }))
    };
  }

  // 1. Scenario: Complete Context Aggregation
  it('1. aggregates complete multi-source intelligence into structured AssessmentContext', async () => {
    const mockDb = createMockD1();
    const resolved = await resolveCandidateJobContext(mockDb, 'cand-1', 'org-enterprise-alpha', 'req-alpha-ml', 'practice');

    expect(resolved.assessmentContext).toBeDefined();
    const ctx = resolved.assessmentContext!;

    expect(ctx.candidateContext.targetRole).toBe('Staff ML Infrastructure Engineer');
    expect(ctx.candidateContext.seniorityLevel).toBe('lead');
    expect(ctx.jobContext.requisitionId).toBe('req-alpha-ml');
    expect(ctx.roleContext.domain).toBe('software');

    // 5-layer evidence ledger must be populated
    expect(ctx.evidenceLedger.length).toBeGreaterThan(0);
    const resumeClaimEv = ctx.evidenceLedger.find(e => e.sourceModule === 'm01_ats_match');
    expect(resumeClaimEv).toBeDefined();
    expect(resumeClaimEv?.evidenceLayer).toBe('extracted_facts');

    // Gap signals must capture M02 misconception
    expect(ctx.gapSignals.length).toBeGreaterThan(0);
    const gpuGap = ctx.gapSignals.find(g => g.skillName === 'GPU Kernel Optimization');
    expect(gpuGap).toBeDefined();
    expect(gpuGap?.gapOriginType).toBe('confirmed_weakness');
    expect(gpuGap?.misconceptionDetails?.divergencePattern).toBe('CUDA Shared Memory Bank Conflicts');

    // Validate structure schema contract
    expect(validateAssessmentContext(ctx)).toBe(true);
  });

  // 2. Scenario: Missing Resume (Graceful fallback, zero hallucination)
  it('2. handles missing resume gracefully without fabricating candidate credentials', async () => {
    const mockDb = createMockD1({
      context: null,
      claims: []
    });

    const resolved = await resolveCandidateJobContext(mockDb, 'cand-no-res', 'org-enterprise-alpha');
    const ctx = resolved.assessmentContext!;

    expect(ctx.candidateContext.activeResumeId).toBeUndefined();
    expect(ctx.candidateContext.verifiedClaims).toEqual([]);
    // Ensure no synthetic claims were injected
    const claimEvidence = ctx.evidenceLedger.filter(e => e.sourceModule === 'm01_ats_match');
    expect(claimEvidence.length).toBe(0);
    expect(validateAssessmentContext(ctx)).toBe(true);
  });

  // 3. Scenario: Missing JD / Requisition
  it('3. handles missing JD requisition by deriving taxonomy and role defaults', async () => {
    const mockDb = createMockD1({
      requisition: null,
      jdContext: null
    });

    const resolved = await resolveCandidateJobContext(mockDb, 'cand-no-jd', 'org-enterprise-alpha');
    const ctx = resolved.assessmentContext!;

    expect(ctx.jobContext.requisitionId).toBeUndefined();
    expect(ctx.jobContext.jobTitle).toBe('Staff ML Infrastructure Engineer');
    expect(ctx.jobContext.keyRequirements.length).toBeGreaterThan(0);
    expect(validateAssessmentContext(ctx)).toBe(true);
  });

  // 4. Scenario: Incomplete Profile
  it('4. handles candidate with minimal/incomplete profile', async () => {
    const mockDb = createMockD1({
      profile: null,
      context: null,
      claims: [],
      proficiencies: []
    });

    const resolved = await resolveCandidateJobContext(mockDb, 'cand-bare', 'org-enterprise-alpha');
    const ctx = resolved.assessmentContext!;

    expect(ctx.candidateContext.targetRole).toBe('Senior Software Engineer');
    expect(ctx.candidateContext.seniorityLevel).toBe('senior');
    expect(ctx.prioritizedTargets.length).toBeGreaterThan(0);
    expect(validateAssessmentContext(ctx)).toBe(true);
  });

  // 5. Scenario: Missing Competency Mapping
  it('5. handles missing competency mapping by constructing valid domain-aligned defaults', async () => {
    const mockDb = createMockD1({
      proficiencies: [],
      claims: []
    });

    const resolved = await resolveCandidateJobContext(mockDb, 'cand-no-map', 'org-enterprise-alpha');
    const ctx = resolved.assessmentContext!;

    expect(ctx.roleContext.requiredCompetencies.length).toBeGreaterThan(0);
    expect(validateRoleContext(ctx.roleContext)).toBe(true);
  });

  // 6. Scenario: Conflicting Evidence (Empirical test score overrides self-reported claim)
  it('6. reconciles conflicting evidence with empirical assessment taking precedence over self-claim', async () => {
    const mockDb = createMockD1({
      claims: [
        { claim_type: 'skill', claim_value: 'GPU Kernel Optimization', confidence_score: 0.99 } // High self claim
      ],
      proficiencies: [
        { skill_id: 'sk-gpu-opt', skill_name: 'GPU Kernel Optimization', proficiency_estimate: 0.25, uncertainty_estimate: 0.15 } // Poor empirical score
      ]
    });

    const resolved = await resolveCandidateJobContext(mockDb, 'cand-conflict', 'org-enterprise-alpha');
    const ctx = resolved.assessmentContext!;

    // Find the prioritized target for GPU Kernel Optimization
    const target = ctx.prioritizedTargets.find(t => t.skillName.toLowerCase().includes('gpu kernel'));
    expect(target).toBeDefined();
    // Confirmed weakness must elevate priority despite high self-claim
    expect(target?.diagnosisSource).toBe('m02_assessment_gap');
    expect(target?.rationale).toContain('Confirmed demonstrated deficit');
  });

  // 7. Scenario: Low-Confidence Evidence
  it('7. reflects low-confidence evidence with appropriately elevated epistemic uncertainty', async () => {
    const mockDb = createMockD1({
      proficiencies: [
        { skill_id: 'sk-new', skill_name: 'Vector Database Indexing', proficiency_estimate: 0.50, uncertainty_estimate: 0.85 }
      ]
    });

    const resolved = await resolveCandidateJobContext(mockDb, 'cand-low-conf', 'org-enterprise-alpha', undefined, 'diagnostic');
    const ctx = resolved.assessmentContext!;

    const target = ctx.prioritizedTargets.find(t => t.skillName.toLowerCase().includes('vector database'));
    expect(target).toBeDefined();
    expect(target?.uncertaintyEstimate).toBe(0.85);
    expect(target?.rationale).toContain('High epistemic uncertainty');
  });

  // 8. Scenario: Seniority Calibration
  it('8. scales competency expectations and difficulty by seniority level', async () => {
    const entryDb = createMockD1({
      profile: { target_role: 'Associate Developer', experience_level: 'entry', readiness_score: 0.5 }
    });
    const entryResolved = await resolveCandidateJobContext(entryDb, 'cand-entry', 'org-alpha');
    expect(entryResolved.assessmentContext?.roleContext.expectedProficiencyBaseline).toBe(0.60);

    const staffDb = createMockD1({
      profile: { target_role: 'Principal Architect', experience_level: 'lead', readiness_score: 0.9 }
    });
    const staffResolved = await resolveCandidateJobContext(staffDb, 'cand-lead', 'org-alpha');
    expect(staffResolved.assessmentContext?.roleContext.expectedProficiencyBaseline).toBe(0.70);
  });

  // 9. Scenario: Multiple Modalities / Roles
  it('9. adapts active work modality dynamically to target role and domain', async () => {
    const finDb = createMockD1({
      profile: { target_role: 'Financial Analyst', target_domain_id: 'finance', experience_level: 'mid' }
    });
    const finCtx = (await resolveCandidateJobContext(finDb, 'cand-fin', 'org-alpha')).assessmentContext!;
    expect(finCtx.activeWorkModality).toBe('financial_analysis');

    const opsDb = createMockD1({
      profile: { target_role: 'Clinical Operations Charge Nurse', target_domain_id: 'operations', experience_level: 'senior' }
    });
    const opsCtx = (await resolveCandidateJobContext(opsDb, 'cand-ops', 'org-alpha')).assessmentContext!;
    expect(opsCtx.activeWorkModality).toBe('operational_triage');
  });

  // 10. Scenario: Tenant Isolation
  it('10. strictly enforces tenant isolation and organizational scoping', async () => {
    const mockDb = createMockD1();
    const resolved = await resolveCandidateJobContext(mockDb, 'cand-tenant-1', 'org-tenant-secure');
    const ctx = resolved.assessmentContext!;

    expect(ctx.securityGovernance.organizationId).toBe('org-tenant-secure');
    expect(ctx.securityGovernance.tenantId).toBe('org-tenant-secure');
    expect(ctx.securityGovernance.candidateUserId).toBe('cand-tenant-1');
  });

  // 11. Scenario: Authorization Enforcement on API Endpoint
  it('11. returns 401 Unauthorized when no valid candidate session cookie is provided', async () => {
    const unauthReq = new Request('http://localhost/api/m3/simulations/context', {
      method: 'GET'
    });

    const res = await app.request(unauthReq, {}, { DB: createMockD1() } as any);
    expect(res.status).toBe(401);
  });

  // 12. Scenario: Strict Sensitive Trait Exclusion & Governance
  it('12. strictly strips and audits all protected/sensitive attributes from assessment context', async () => {
    const sampleContext: AssessmentContext = {
      contextId: 'ctx-bias-audit-1',
      candidateContext: {
        userId: 'cand-bias-test',
        organizationId: 'org-1',
        targetRole: 'Staff Software Engineer',
        seniorityLevel: 'staff',
        extractedSkills: ['Rust', 'Distributed Systems'],
        verifiedClaims: [],
        currentReadinessScore: 0.85,
        diagnosedGaps: []
      },
      jobContext: {
        jobTitle: 'Staff Software Engineer',
        targetSeniority: 'staff',
        keyRequirements: ['Rust'],
        requiredSkills: ['Rust']
      },
      roleContext: {
        roleTitle: 'Staff Software Engineer',
        domain: 'software',
        seniorityLevel: 'staff',
        decisionScope: 'Architecture',
        expectedProficiencyBaseline: 0.80,
        requiredCompetencies: []
      },
      assessmentPurpose: 'practice',
      evidenceLedger: [],
      gapSignals: [],
      prioritizedTargets: [],
      primaryRecommendedTarget: {
        id: 'tgt-1',
        name: 'Architecture',
        domain: 'software',
        skillName: 'Rust Architecture',
        targetProficiency: 0.8,
        currentProficiency: 0.5,
        uncertaintyEstimate: 0.5,
        diagnosisSource: 'baseline_target',
        rationale: 'Baseline'
      },
      activeWorkModality: 'coding',
      securityGovernance: {
        tenantId: 'org-1',
        organizationId: 'org-1',
        candidateUserId: 'cand-bias-test',
        sensitiveAttributesExcluded: false,
        exclusionAudit: [],
        createdAt: new Date().toISOString()
      }
    };

    // Inject prohibited sensitive demographic traits into candidateContext
    (sampleContext.candidateContext as any).gender = 'Female';
    (sampleContext.candidateContext as any).age = 34;
    (sampleContext.candidateContext as any).religion = 'Christian';
    (sampleContext.candidateContext as any).ethnicity = 'Hispanic';
    (sampleContext.candidateContext as any).marital_status = 'Married';
    (sampleContext.candidateContext as any).pregnancy = 'None';
    (sampleContext.candidateContext as any).disability = 'None';

    const { sanitized, sensitiveTraitsFound } = sanitizeContextForTaskTargeting(sampleContext);

    // Verify all demographic fields are completely purged
    expect((sanitized.candidateContext as any).gender).toBeUndefined();
    expect((sanitized.candidateContext as any).age).toBeUndefined();
    expect((sanitized.candidateContext as any).religion).toBeUndefined();
    expect((sanitized.candidateContext as any).ethnicity).toBeUndefined();
    expect((sanitized.candidateContext as any).marital_status).toBeUndefined();

    // Verify governance audit records all excluded traits
    expect(sanitized.securityGovernance.sensitiveAttributesExcluded).toBe(true);
    expect(sensitiveTraitsFound).toContain('candidateContext.gender');
    expect(sensitiveTraitsFound).toContain('candidateContext.age');
    expect(sensitiveTraitsFound).toContain('candidateContext.religion');
    expect(sensitiveTraitsFound).toContain('candidateContext.ethnicity');
    expect(sensitiveTraitsFound).toContain('candidateContext.marital_status');
  });

});
