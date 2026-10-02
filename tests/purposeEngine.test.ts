import { describe, it, expect } from 'vitest';
import {
  getPurposeBehavior,
  getAllPurposeBehaviors,
  validateAttemptEligibility,
  generatePurposeProvenance,
  PurposeRepository,
  PURPOSE_ENGINE_VERSION,
  CANONICAL_PURPOSE_BEHAVIORS,
} from '../src/shared/purposeEngine';
import { AssessmentPurpose } from '../src/shared/evidenceStrategy';

describe('Prompt 14 — Purpose Engine', () => {
  it('exposes version 2.0.0', () => {
    expect(PURPOSE_ENGINE_VERSION).toBe('2.0.0');
  });

  it('supports all 8 canonical purpose behaviors', () => {
    const expectedPurposes: AssessmentPurpose[] = [
      'diagnostic',
      'practice',
      'training',
      'certification',
      'readiness',
      'recruitment',
      'gap_validation',
      'interview_prep',
    ];

    expect(Object.keys(CANONICAL_PURPOSE_BEHAVIORS).length).toBe(8);

    for (const purpose of expectedPurposes) {
      const behavior = getPurposeBehavior(purpose);
      expect(behavior.purpose_code).toBe(purpose);
      expect(behavior.name).toBeTruthy();
      expect(behavior.description).toBeTruthy();
      expect(behavior.feedback_policy).toBeDefined();
      expect(behavior.retry_policy).toBeDefined();
      expect(behavior.time_limit_policy).toBeDefined();
      expect(behavior.hints_policy).toBeDefined();
      expect(behavior.scoring_model).toBeDefined();
      expect(behavior.human_decision_boundary_enforced).toBe(true);
    }
  });

  describe('Purpose-Specific Behavioral Policies', () => {
    it('enforces immediate explanatory feedback and hints for practice and training', () => {
      const practice = getPurposeBehavior('practice');
      expect(practice.feedback_policy).toBe('immediate_explanatory');
      expect(practice.hints_policy).toBe('hints_enabled');
      expect(practice.retry_policy).toBe('unlimited_retries');
      expect(practice.proctoring_required).toBe(false);

      const training = getPurposeBehavior('training');
      expect(training.feedback_policy).toBe('immediate_explanatory');
      expect(training.hints_policy).toBe('hints_enabled');
    });

    it('enforces blinded evaluation, strict timers, and proctoring for recruitment and certification', () => {
      const recruitment = getPurposeBehavior('recruitment');
      expect(recruitment.feedback_policy).toBe('blinded_evaluator_only');
      expect(recruitment.hints_policy).toBe('hints_disabled');
      expect(recruitment.retry_policy).toBe('no_retries');
      expect(recruitment.time_limit_policy).toBe('strict_proctored_timed');
      expect(recruitment.proctoring_required).toBe(true);
      expect(recruitment.blind_evaluation).toBe(true);

      const certification = getPurposeBehavior('certification');
      expect(certification.feedback_policy).toBe('blinded_evaluator_only');
      expect(certification.scoring_model).toBe('summative_standard');
      expect(certification.default_confidence_threshold).toBe(0.85);
    });

    it('enforces gap verification scoring for gap_validation purpose', () => {
      const gapVal = getPurposeBehavior('gap_validation');
      expect(gapVal.scoring_model).toBe('gap_verification');
      expect(gapVal.feedback_policy).toBe('deferred_summary');
      expect(gapVal.retry_policy).toBe('no_retries');
    });

    it('enforces human decision boundary across ALL purposes without exception', () => {
      const all = getAllPurposeBehaviors();
      for (const p of all) {
        expect(p.human_decision_boundary_enforced).toBe(true);
      }
    });
  });

  describe('Attempt Limit Validation', () => {
    it('blocks excessive attempts for single-attempt purposes like recruitment', () => {
      const zeroAttempts = validateAttemptEligibility('recruitment', 0);
      expect(zeroAttempts.allowed).toBe(true);

      const oneAttempt = validateAttemptEligibility('recruitment', 1);
      expect(oneAttempt.allowed).toBe(false);
      expect(oneAttempt.reason).toContain('Maximum attempts limit reached');
    });

    it('allows unlimited attempts for practice mode', () => {
      const hundredAttempts = validateAttemptEligibility('practice', 100);
      expect(hundredAttempts.allowed).toBe(true);
    });
  });

  describe('Audit Provenance Generation', () => {
    it('records candidate IP for proctored high-stakes purposes and redacts it for low-stakes practice', () => {
      const recruitmentProv = generatePurposeProvenance('recruitment', {
        organization_id: 'org_123',
        user_id: 'usr_456',
        attempt_id: 'att_789',
        ip_address: '198.51.100.42',
      });

      expect(recruitmentProv.session.recorded_ip).toBe('198.51.100.42');
      expect(recruitmentProv.proctoring_required).toBe(true);
      expect(recruitmentProv.engine_version).toBe('2.0.0');

      const practiceProv = generatePurposeProvenance('practice', {
        organization_id: 'org_123',
        user_id: 'usr_456',
        attempt_id: 'att_789',
        ip_address: '198.51.100.42',
      });

      expect(practiceProv.session.recorded_ip).toBe('[REDACTED_BY_POLICY]');
      expect(practiceProv.proctoring_required).toBe(false);
    });
  });

  describe('PurposeRepository D1 Queries', () => {
    it('reads all purposes with fallback', async () => {
      const mockDb: any = {
        prepare: () => ({
          all: async () => ({ results: [] }),
        }),
      };

      const repo = new PurposeRepository(mockDb);
      const purposes = await repo.findAll();
      expect(purposes.length).toBe(8);
      expect(purposes.map((p) => p.purpose_code)).toContain('diagnostic');
    });

    it('finds single purpose by code from mocked D1 row', async () => {
      const mockDb: any = {
        prepare: () => ({
          bind: () => ({
            first: async () => ({
              id: 'purp_custom',
              purpose_code: 'diagnostic',
              name: 'Mock Diagnostic',
              description: 'Mock desc',
              behavior_config_json: JSON.stringify({
                feedbackPolicy: 'deferred_summary',
                retryPolicy: 'single_retry_with_penalty',
                timeLimitPolicy: 'untimed_relaxed',
                hintsPolicy: 'hints_disabled',
                scoringModel: 'bayesian_diagnostic',
                defaultConfidenceThreshold: 0.65,
                defaultMaxUncertainty: 0.35,
                maxAttemptsAllowed: 2,
              }),
              version: 1,
            }),
          }),
        }),
      };

      const repo = new PurposeRepository(mockDb);
      const purpose = await repo.findByCode('diagnostic');
      expect(purpose).toBeDefined();
      expect(purpose?.name).toBe('Mock Diagnostic');
      expect(purpose?.scoring_model).toBe('bayesian_diagnostic');
    });
  });
});
