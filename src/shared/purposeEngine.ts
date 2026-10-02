/**
 * Purpose Engine - Purpose-Aware Assessment Behavior and Provenance
 * IntelliHire M2 Universal Evidence & Competency Assessment Engine
 * Phase 2 - Prompt 14
 * 
 * Supports purpose-aware behaviors for:
 * 1. diagnostic
 * 2. practice
 * 3. training
 * 4. certification
 * 5. readiness
 * 6. recruitment
 * 7. gap_validation
 * 8. interview_prep
 * 
 * Persists purpose, behavior configuration, and audit provenance.
 */

import { AssessmentPurpose, VALID_PURPOSES } from './evidenceStrategy';

export type FeedbackPolicy = 
  | 'immediate_explanatory'
  | 'deferred_summary'
  | 'blinded_evaluator_only';

export type RetryPolicy = 
  | 'unlimited_retries'
  | 'single_retry_with_penalty'
  | 'no_retries';

export type TimeLimitPolicy = 
  | 'untimed_relaxed'
  | 'standard_timed'
  | 'strict_proctored_timed';

export type HintsPolicy = 
  | 'hints_enabled'
  | 'hints_disabled';

export type ScoringModel = 
  | 'formative_mastery'
  | 'summative_standard'
  | 'bayesian_diagnostic'
  | 'gap_verification';

export interface PurposeBehaviorConfig {
  purpose_code: AssessmentPurpose;
  name: string;
  description: string;
  feedback_policy: FeedbackPolicy;
  retry_policy: RetryPolicy;
  time_limit_policy: TimeLimitPolicy;
  hints_policy: HintsPolicy;
  scoring_model: ScoringModel;
  default_confidence_threshold: number;
  default_max_uncertainty: number;
  max_attempts_allowed: number;
  proctoring_required: boolean;
  blind_evaluation: boolean;
  human_decision_boundary_enforced: boolean; // Always true
  provenance_requirements: {
    trackCandidateIp: boolean;
    trackSessionTimeline: boolean;
    recordItemDuration: boolean;
    requireSignOffSignature: boolean;
  };
  version: number;
}

export const PURPOSE_ENGINE_VERSION = '2.0.0';

export const CANONICAL_PURPOSE_BEHAVIORS: Record<AssessmentPurpose, PurposeBehaviorConfig> = {
  diagnostic: {
    purpose_code: 'diagnostic',
    name: 'Diagnostic Assessment',
    description: 'Formative baseline evaluation identifying candidate competency gaps and strengths without high-stakes pressure.',
    feedback_policy: 'deferred_summary',
    retry_policy: 'single_retry_with_penalty',
    time_limit_policy: 'untimed_relaxed',
    hints_policy: 'hints_disabled',
    scoring_model: 'bayesian_diagnostic',
    default_confidence_threshold: 0.65,
    default_max_uncertainty: 0.35,
    max_attempts_allowed: 2,
    proctoring_required: false,
    blind_evaluation: false,
    human_decision_boundary_enforced: true,
    provenance_requirements: {
      trackCandidateIp: false,
      trackSessionTimeline: true,
      recordItemDuration: true,
      requireSignOffSignature: false,
    },
    version: 1,
  },

  practice: {
    purpose_code: 'practice',
    name: 'Practice & Skill Exploration',
    description: 'Low-stakes sandbox allowing candidate exploration, immediate formative explanations, hints, and retries.',
    feedback_policy: 'immediate_explanatory',
    retry_policy: 'unlimited_retries',
    time_limit_policy: 'untimed_relaxed',
    hints_policy: 'hints_enabled',
    scoring_model: 'formative_mastery',
    default_confidence_threshold: 0.60,
    default_max_uncertainty: 0.40,
    max_attempts_allowed: 999,
    proctoring_required: false,
    blind_evaluation: false,
    human_decision_boundary_enforced: true,
    provenance_requirements: {
      trackCandidateIp: false,
      trackSessionTimeline: false,
      recordItemDuration: false,
      requireSignOffSignature: false,
    },
    version: 1,
  },

  training: {
    purpose_code: 'training',
    name: 'Training & Skill Acquisition',
    description: 'Curriculum-aligned milestone assessments validating learning transfer with targeted formative corrections.',
    feedback_policy: 'immediate_explanatory',
    retry_policy: 'unlimited_retries',
    time_limit_policy: 'untimed_relaxed',
    hints_policy: 'hints_enabled',
    scoring_model: 'formative_mastery',
    default_confidence_threshold: 0.70,
    default_max_uncertainty: 0.30,
    max_attempts_allowed: 5,
    proctoring_required: false,
    blind_evaluation: false,
    human_decision_boundary_enforced: true,
    provenance_requirements: {
      trackCandidateIp: false,
      trackSessionTimeline: true,
      recordItemDuration: true,
      requireSignOffSignature: false,
    },
    version: 1,
  },

  certification: {
    purpose_code: 'certification',
    name: 'Certification Support',
    description: 'High-integrity benchmark evaluation validating adherence to formal industry standards and regulatory criteria.',
    feedback_policy: 'blinded_evaluator_only',
    retry_policy: 'no_retries',
    time_limit_policy: 'strict_proctored_timed',
    hints_policy: 'hints_disabled',
    scoring_model: 'summative_standard',
    default_confidence_threshold: 0.85,
    default_max_uncertainty: 0.15,
    max_attempts_allowed: 1,
    proctoring_required: true,
    blind_evaluation: true,
    human_decision_boundary_enforced: true,
    provenance_requirements: {
      trackCandidateIp: true,
      trackSessionTimeline: true,
      recordItemDuration: true,
      requireSignOffSignature: true,
    },
    version: 1,
  },

  readiness: {
    purpose_code: 'readiness',
    name: 'Operational & Deployment Readiness',
    description: 'Job-role simulation verifying whether candidate is ready for unassisted project deployment or client-facing delivery.',
    feedback_policy: 'deferred_summary',
    retry_policy: 'no_retries',
    time_limit_policy: 'standard_timed',
    hints_policy: 'hints_disabled',
    scoring_model: 'summative_standard',
    default_confidence_threshold: 0.80,
    default_max_uncertainty: 0.20,
    max_attempts_allowed: 1,
    proctoring_required: false,
    blind_evaluation: false,
    human_decision_boundary_enforced: true,
    provenance_requirements: {
      trackCandidateIp: true,
      trackSessionTimeline: true,
      recordItemDuration: true,
      requireSignOffSignature: false,
    },
    version: 1,
  },

  recruitment: {
    purpose_code: 'recruitment',
    name: 'Recruitment & Selection Support',
    description: 'Strictly governed evaluative assessment generating evidence packages for recruiter/hiring manager review.',
    feedback_policy: 'blinded_evaluator_only',
    retry_policy: 'no_retries',
    time_limit_policy: 'strict_proctored_timed',
    hints_policy: 'hints_disabled',
    scoring_model: 'summative_standard',
    default_confidence_threshold: 0.80,
    default_max_uncertainty: 0.20,
    max_attempts_allowed: 1,
    proctoring_required: true,
    blind_evaluation: true,
    human_decision_boundary_enforced: true,
    provenance_requirements: {
      trackCandidateIp: true,
      trackSessionTimeline: true,
      recordItemDuration: true,
      requireSignOffSignature: true,
    },
    version: 1,
  },

  gap_validation: {
    purpose_code: 'gap_validation',
    name: 'Gap & Claim Validation',
    description: 'Targeted inquiry focusing specifically on unverified, disputed, or contradictory claims from resume/M1 evidence.',
    feedback_policy: 'deferred_summary',
    retry_policy: 'no_retries',
    time_limit_policy: 'standard_timed',
    hints_policy: 'hints_disabled',
    scoring_model: 'gap_verification',
    default_confidence_threshold: 0.75,
    default_max_uncertainty: 0.25,
    max_attempts_allowed: 1,
    proctoring_required: false,
    blind_evaluation: false,
    human_decision_boundary_enforced: true,
    provenance_requirements: {
      trackCandidateIp: false,
      trackSessionTimeline: true,
      recordItemDuration: true,
      requireSignOffSignature: false,
    },
    version: 1,
  },

  interview_prep: {
    purpose_code: 'interview_prep',
    name: 'Interview Preparation & Coaching',
    description: 'Coaching simulation helping candidates articulate rationale, navigate stress questions, and refine delivery.',
    feedback_policy: 'immediate_explanatory',
    retry_policy: 'single_retry_with_penalty',
    time_limit_policy: 'standard_timed',
    hints_policy: 'hints_enabled',
    scoring_model: 'formative_mastery',
    default_confidence_threshold: 0.65,
    default_max_uncertainty: 0.35,
    max_attempts_allowed: 3,
    proctoring_required: false,
    blind_evaluation: false,
    human_decision_boundary_enforced: true,
    provenance_requirements: {
      trackCandidateIp: false,
      trackSessionTimeline: true,
      recordItemDuration: true,
      requireSignOffSignature: false,
    },
    version: 1,
  },
};

/**
 * Retrieve purpose behavior configuration
 */
export function getPurposeBehavior(purpose: AssessmentPurpose): PurposeBehaviorConfig {
  const behavior = CANONICAL_PURPOSE_BEHAVIORS[purpose];
  if (!behavior) {
    throw new Error(`Unsupported assessment purpose: "${purpose}". Valid purposes: ${VALID_PURPOSES.join(', ')}`);
  }
  return { ...behavior };
}

/**
 * Retrieve all purpose behavior configurations
 */
export function getAllPurposeBehaviors(): PurposeBehaviorConfig[] {
  return Object.values(CANONICAL_PURPOSE_BEHAVIORS).map((b) => ({ ...b }));
}

/**
 * Validate candidate attempt eligibility under purpose policy
 */
export function validateAttemptEligibility(
  purpose: AssessmentPurpose,
  currentCompletedAttempts: number
): { allowed: boolean; reason?: string } {
  const config = getPurposeBehavior(purpose);
  if (currentCompletedAttempts >= config.max_attempts_allowed) {
    return {
      allowed: false,
      reason: `Maximum attempts limit reached for purpose "${config.name}". Limit is ${config.max_attempts_allowed}, candidate has completed ${currentCompletedAttempts}.`,
    };
  }
  return { allowed: true };
}

/**
 * Generate immutable audit provenance payload for an assessment attempt
 */
export function generatePurposeProvenance(
  purpose: AssessmentPurpose,
  context: {
    organization_id: string;
    user_id: string;
    attempt_id: string;
    ip_address?: string;
    user_agent?: string;
  }
): Record<string, any> {
  const config = getPurposeBehavior(purpose);
  return {
    engine_version: PURPOSE_ENGINE_VERSION,
    purpose_code: purpose,
    purpose_name: config.name,
    feedback_policy: config.feedback_policy,
    retry_policy: config.retry_policy,
    time_limit_policy: config.time_limit_policy,
    hints_policy: config.hints_policy,
    scoring_model: config.scoring_model,
    proctoring_required: config.proctoring_required,
    blind_evaluation: config.blind_evaluation,
    human_decision_boundary_enforced: true,
    session: {
      attempt_id: context.attempt_id,
      organization_id: context.organization_id,
      user_id: context.user_id,
      recorded_ip: config.provenance_requirements.trackCandidateIp ? context.ip_address || 'unknown' : '[REDACTED_BY_POLICY]',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Repository for reading and persisting Purpose configurations in D1
 */
export class PurposeRepository {
  constructor(private db: D1Database) {}

  async findAll(): Promise<PurposeBehaviorConfig[]> {
    const query = 'SELECT * FROM assessment_purpose WHERE is_active = 1 ORDER BY created_at ASC';
    const rows = await this.db.prepare(query).all();
    if (!rows.results || rows.results.length === 0) {
      return getAllPurposeBehaviors();
    }

    return rows.results.map((row: any) => {
      let config = {} as any;
      if (row.behavior_config_json) {
        try {
          config = JSON.parse(row.behavior_config_json);
        } catch (_) {}
      }
      return {
        purpose_code: row.purpose_code || row.id,
        name: row.name,
        description: row.description,
        feedback_policy: config.feedbackPolicy || config.feedback_policy || 'deferred_summary',
        retry_policy: config.retryPolicy || config.retry_policy || 'no_retries',
        time_limit_policy: config.timeLimitPolicy || config.time_limit_policy || 'standard_timed',
        hints_policy: config.hintsPolicy || config.hints_policy || 'hints_disabled',
        scoring_model: config.scoringModel || config.scoring_model || 'summative_standard',
        default_confidence_threshold: config.defaultConfidenceThreshold || 0.75,
        default_max_uncertainty: config.defaultMaxUncertainty || 0.25,
        max_attempts_allowed: config.maxAttemptsAllowed || 1,
        proctoring_required: !!config.proctoringRequired,
        blind_evaluation: !!config.blindEvaluation,
        human_decision_boundary_enforced: true,
        provenance_requirements: config.provenanceRequirements || {
          trackCandidateIp: true,
          trackSessionTimeline: true,
          recordItemDuration: true,
          requireSignOffSignature: false,
        },
        version: row.version || 1,
      };
    });
  }

  async findByCode(code: string): Promise<PurposeBehaviorConfig | null> {
    const query = 'SELECT * FROM assessment_purpose WHERE purpose_code = ? OR id = ? LIMIT 1';
    const row = await this.db.prepare(query).bind(code, code).first<any>();
    if (!row) return null;

    let config = {} as any;
    if (row.behavior_config_json) {
      try {
        config = JSON.parse(row.behavior_config_json);
      } catch (_) {}
    }

    return {
      purpose_code: row.purpose_code || row.id,
      name: row.name,
      description: row.description,
      feedback_policy: config.feedbackPolicy || config.feedback_policy || 'deferred_summary',
      retry_policy: config.retryPolicy || config.retry_policy || 'no_retries',
      time_limit_policy: config.timeLimitPolicy || config.time_limit_policy || 'standard_timed',
      hints_policy: config.hintsPolicy || config.hints_policy || 'hints_disabled',
      scoring_model: config.scoringModel || config.scoring_model || 'summative_standard',
      default_confidence_threshold: config.defaultConfidenceThreshold || 0.75,
      default_max_uncertainty: config.defaultMaxUncertainty || 0.25,
      max_attempts_allowed: config.maxAttemptsAllowed || 1,
      proctoring_required: !!config.proctoringRequired,
      blind_evaluation: !!config.blindEvaluation,
      human_decision_boundary_enforced: true,
      provenance_requirements: config.provenanceRequirements || {
        trackCandidateIp: true,
        trackSessionTimeline: true,
        recordItemDuration: true,
        requireSignOffSignature: false,
      },
      version: row.version || 1,
    };
  }
}
