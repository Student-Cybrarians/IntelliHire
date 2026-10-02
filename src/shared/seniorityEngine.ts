/**
 * Seniority Engine - Multi-Axial Seniority Adaptation
 * IntelliHire M2 Universal Evidence & Competency Assessment Engine
 * Phase 2 - Prompt 15
 * 
 * Supports:
 * - foundation
 * - junior
 * - mid
 * - senior
 * - lead
 * - manager
 * - executive
 * 
 * Adapts across 9 core dimensions (not merely question difficulty):
 * 1. scope
 * 2. ambiguity
 * 3. independence / autonomy
 * 4. decision-making
 * 5. ownership
 * 6. risk
 * 7. trade-offs
 * 8. stakeholder impact
 * 9. mentoring / coaching
 */

import { SeniorityLevel, VALID_SENIORITIES } from './evidenceStrategy';

export type ScopeDimension = 
  | 'task' 
  | 'feature' 
  | 'subsystem' 
  | 'system' 
  | 'cross_system' 
  | 'organizational' 
  | 'enterprise';

export type AmbiguityDimension = 
  | 'structured' 
  | 'low' 
  | 'moderate' 
  | 'high' 
  | 'unconstrained';

export type AutonomyDimension = 
  | 'supervised' 
  | 'guided' 
  | 'autonomous' 
  | 'directional' 
  | 'strategic';

export type DecisionMakingDimension = 
  | 'procedural' 
  | 'tactical' 
  | 'architectural' 
  | 'strategic' 
  | 'governance';

export type OwnershipDimension = 
  | 'individual' 
  | 'component' 
  | 'product_domain' 
  | 'department' 
  | 'enterprise';

export type RiskExposureDimension = 
  | 'negligible' 
  | 'operational' 
  | 'systemic' 
  | 'strategic' 
  | 'existential';

export type MentoringDimension = 
  | 'none' 
  | 'receiving' 
  | 'peer_review' 
  | 'mentoring_coaching' 
  | 'executive_sponsorship';

export interface SeniorityAxes {
  scope: ScopeDimension;
  ambiguity: AmbiguityDimension;
  independence: AutonomyDimension;
  decision_making: DecisionMakingDimension;
  ownership: OwnershipDimension;
  risk: RiskExposureDimension;
  trade_offs: string[];
  stakeholder_impact: string[];
  mentoring: MentoringDimension;
}

export interface SeniorityProfile {
  seniority_level: SeniorityLevel;
  display_title: string;
  summary: string;
  axes: SeniorityAxes;
  evidence_expectations: {
    focus_areas: string[];
    anti_patterns: string[];
    acceptable_modalities: string[];
  };
  adaptive_parameters: {
    target_confidence: number;
    max_uncertainty: number;
    min_evidence_items: number;
    complexity_weight: number;
  };
  version: number;
}

export const SENIORITY_ENGINE_VERSION = '2.0.0';

export const CANONICAL_SENIORITY_PROFILES: Record<SeniorityLevel, SeniorityProfile> = {
  foundation: {
    seniority_level: 'foundation',
    display_title: 'Foundation / Entry Level',
    summary: 'Focuses on understanding basic domain syntax, core definitions, and following structured step-by-step procedures.',
    axes: {
      scope: 'task',
      ambiguity: 'structured',
      independence: 'supervised',
      decision_making: 'procedural',
      ownership: 'individual',
      risk: 'negligible',
      trade_offs: ['accuracy vs speed in basic task execution'],
      stakeholder_impact: ['self', 'mentor'],
      mentoring: 'receiving',
    },
    evidence_expectations: {
      focus_areas: ['Accurate comprehension of fundamentals', 'Ability to follow structured instructions', 'Recognizing errors with guidance'],
      anti_patterns: ['Inability to recall basic syntax/rules', 'Refusing to seek clarification when blocked'],
      acceptable_modalities: ['knowledge_question', 'structured_response', 'coding'],
    },
    adaptive_parameters: {
      target_confidence: 0.65,
      max_uncertainty: 0.35,
      min_evidence_items: 3,
      complexity_weight: 1.0,
    },
    version: 1,
  },

  junior: {
    seniority_level: 'junior',
    display_title: 'Junior Professional',
    summary: 'Executes defined features independently with guidance on edge cases; writes unit tests and follows style guides.',
    axes: {
      scope: 'feature',
      ambiguity: 'low',
      independence: 'guided',
      decision_making: 'tactical',
      ownership: 'component',
      risk: 'operational',
      trade_offs: ['code readability vs local optimization', 'immediate implementation vs clean refactoring'],
      stakeholder_impact: ['direct team members', 'team lead'],
      mentoring: 'receiving',
    },
    evidence_expectations: {
      focus_areas: ['Self-sufficient bug fixing and feature delivery', 'Unit test coverage', 'Adherence to engineering/clinical conventions'],
      anti_patterns: ['Silent failure without reporting blockers', 'Lack of baseline edge case handling'],
      acceptable_modalities: ['coding', 'knowledge_question', 'reasoning', 'structured_response'],
    },
    adaptive_parameters: {
      target_confidence: 0.70,
      max_uncertainty: 0.30,
      min_evidence_items: 4,
      complexity_weight: 1.5,
    },
    version: 1,
  },

  mid: {
    seniority_level: 'mid',
    display_title: 'Mid-Level Professional',
    summary: 'Autonomously owns modules from requirements to production; anticipates edge cases, evaluates algorithmic trade-offs, and conducts peer reviews.',
    axes: {
      scope: 'subsystem',
      ambiguity: 'moderate',
      independence: 'autonomous',
      decision_making: 'tactical',
      ownership: 'component',
      risk: 'operational',
      trade_offs: ['latency vs throughput', 'maintainability vs premature abstraction', 'reusing existing libs vs custom build'],
      stakeholder_impact: ['project team', 'cross-functional peers (QA/Design)'],
      mentoring: 'peer_review',
    },
    evidence_expectations: {
      focus_areas: ['Autonomous end-to-end subsystem delivery', 'Defensive error handling and boundary validation', 'Constructive pull request reviews'],
      anti_patterns: ['Requires constant supervisor nudging', 'Overlooking regression risks'],
      acceptable_modalities: ['coding', 'reasoning', 'scenario', 'structured_response'],
    },
    adaptive_parameters: {
      target_confidence: 0.75,
      max_uncertainty: 0.25,
      min_evidence_items: 5,
      complexity_weight: 2.0,
    },
    version: 1,
  },

  senior: {
    seniority_level: 'senior',
    display_title: 'Senior Specialist / Architect',
    summary: 'Designs scalable, fault-tolerant architectures under high ambiguity; articulates trade-offs, anticipates failure modes, and mentors junior teammates.',
    axes: {
      scope: 'system',
      ambiguity: 'high',
      independence: 'directional',
      decision_making: 'architectural',
      ownership: 'product_domain',
      risk: 'systemic',
      trade_offs: [
        'consistency vs availability (CAP theorem)',
        'operational cost vs developer velocity',
        'backward compatibility vs breaking evolutionary improvements',
      ],
      stakeholder_impact: ['engineering department', 'product management', 'operations'],
      mentoring: 'mentoring_coaching',
    },
    evidence_expectations: {
      focus_areas: ['Architectural foresight under ambiguous constraints', 'Root-cause post-mortem depth', 'Active mentorship and code quality stewardship'],
      anti_patterns: ['Dogmatic tech selection without business rationale', 'Inability to foresee cascade failures'],
      acceptable_modalities: ['scenario', 'reasoning', 'coding', 'structured_response'],
    },
    adaptive_parameters: {
      target_confidence: 0.80,
      max_uncertainty: 0.20,
      min_evidence_items: 6,
      complexity_weight: 2.8,
    },
    version: 1,
  },

  lead: {
    seniority_level: 'lead',
    display_title: 'Staff / Tech Lead',
    summary: 'Orchestrates cross-system technical initiatives, defines standards across multiple teams, aligns engineering roadmaps with business objectives, and coaches senior engineers.',
    axes: {
      scope: 'cross_system',
      ambiguity: 'high',
      independence: 'directional',
      decision_making: 'strategic',
      ownership: 'product_domain',
      risk: 'systemic',
      trade_offs: [
        'short-term business deliverable vs multi-year architectural debt',
        'build vs buy vs open-source adoption',
        'team bandwidth allocation between feature work and technical health',
      ],
      stakeholder_impact: ['multiple product squads', 'engineering directors', 'external partners'],
      mentoring: 'mentoring_coaching',
    },
    evidence_expectations: {
      focus_areas: ['Cross-team technical synthesis', 'De-risking critical migration paths', 'Fostering engineering culture and leadership succession'],
      anti_patterns: ['Siloed decision-making without cross-team consensus', 'Micro-managing individual syntax instead of system contracts'],
      acceptable_modalities: ['scenario', 'reasoning', 'structured_response'],
    },
    adaptive_parameters: {
      target_confidence: 0.82,
      max_uncertainty: 0.18,
      min_evidence_items: 6,
      complexity_weight: 3.2,
    },
    version: 1,
  },

  manager: {
    seniority_level: 'manager',
    display_title: 'Engineering / Domain Manager',
    summary: 'Owns organizational capability, delivery cadence, hiring standards, performance coaching, budget allocation, and cross-functional conflict resolution.',
    axes: {
      scope: 'organizational',
      ambiguity: 'high',
      independence: 'strategic',
      decision_making: 'strategic',
      ownership: 'department',
      risk: 'strategic',
      trade_offs: [
        'team capacity vs aggressive roadmap commitments',
        'immediate hiring velocity vs long-term bar elevation',
        'individual career growth vs immediate squad allocation needs',
      ],
      stakeholder_impact: ['department teams', 'VP/C-suite', 'HR/Finance', 'clients'],
      mentoring: 'mentoring_coaching',
    },
    evidence_expectations: {
      focus_areas: ['People development and psychological safety', 'Resource and capacity forecasting under changing priorities', 'Incident escalation and retrospective governance'],
      anti_patterns: ['Abdication of accountability during project slips', 'Lack of empathy during high-stress operational escalations'],
      acceptable_modalities: ['scenario', 'reasoning', 'structured_response'],
    },
    adaptive_parameters: {
      target_confidence: 0.82,
      max_uncertainty: 0.18,
      min_evidence_items: 5,
      complexity_weight: 3.5,
    },
    version: 1,
  },

  executive: {
    seniority_level: 'executive',
    display_title: 'Executive / VP / C-Level',
    summary: 'Sets company-wide vision, risk tolerance, regulatory posture, organizational structure, capital efficiency, and market differentiation.',
    axes: {
      scope: 'enterprise',
      ambiguity: 'unconstrained',
      independence: 'strategic',
      decision_making: 'governance',
      ownership: 'enterprise',
      risk: 'existential',
      trade_offs: [
        'capital expenditure vs operational runway',
        'aggressive market innovation vs regulatory/compliance exposure',
        'centralized control vs decentralized autonomous team speed',
      ],
      stakeholder_impact: ['board of directors', 'shareholders', 'entire enterprise', 'regulatory bodies'],
      mentoring: 'executive_sponsorship',
    },
    evidence_expectations: {
      focus_areas: ['Enterprise governance and fiduciary responsibility', 'Strategic capital and organizational allocation', 'Navigating systemic regulatory shifts and reputational risk'],
      anti_patterns: ['Short-sighted vanity metrics over durable enterprise value', 'Disregarding compliance and audit obligations'],
      acceptable_modalities: ['scenario', 'reasoning', 'structured_response'],
    },
    adaptive_parameters: {
      target_confidence: 0.85,
      max_uncertainty: 0.15,
      min_evidence_items: 5,
      complexity_weight: 4.0,
    },
    version: 1,
  },
};

/**
 * Retrieve seniority profile for a given level
 */
export function getSeniorityProfile(level: SeniorityLevel): SeniorityProfile {
  const profile = CANONICAL_SENIORITY_PROFILES[level];
  if (!profile) {
    throw new Error(`Unsupported seniority level: "${level}". Valid levels: ${VALID_SENIORITIES.join(', ')}`);
  }
  return { ...profile };
}

/**
 * Retrieve all seniority profiles
 */
export function getAllSeniorityProfiles(): SeniorityProfile[] {
  return Object.values(CANONICAL_SENIORITY_PROFILES).map((p) => ({ ...p }));
}

/**
 * Generate LLM system guidance instructing the evaluation model on seniority-aware criteria
 */
export function generateSeniorityGuidancePrompt(level: SeniorityLevel): string {
  const profile = getSeniorityProfile(level);
  return [
    `=== SENIORITY CALIBRATION GUIDANCE (${profile.display_title.toUpperCase()}) ===`,
    `Expected Scope: ${profile.axes.scope.toUpperCase()}`,
    `Ambiguity Level: ${profile.axes.ambiguity.toUpperCase()}`,
    `Decision Making: ${profile.axes.decision_making.toUpperCase()}`,
    `Risk Exposure: ${profile.axes.risk.toUpperCase()}`,
    `Mentoring Expectation: ${profile.axes.mentoring.toUpperCase()}`,
    `Critical Trade-Offs to Evaluate: ${profile.axes.trade_offs.join('; ')}`,
    `Focus Areas: ${profile.evidence_expectations.focus_areas.join('; ')}`,
    `Disqualifying Anti-Patterns: ${profile.evidence_expectations.anti_patterns.join('; ')}`,
    `Note: Do NOT merely expect harder terminology. Assess whether the candidate demonstrates ${profile.axes.scope}-level judgment and ${profile.axes.ambiguity} tolerance.`,
  ].join('\n');
}

/**
 * Check if observed assessment evidence aligns with expected seniority axes
 */
export function validateSeniorityEvidenceFit(
  level: SeniorityLevel,
  observed: {
    demonstrated_scope?: ScopeDimension;
    handled_ambiguity?: AmbiguityDimension;
    addressed_trade_offs?: string[];
  }
): { fits: boolean; deviations: string[] } {
  const profile = getSeniorityProfile(level);
  const deviations: string[] = [];

  const scopeRank: Record<ScopeDimension, number> = {
    task: 1,
    feature: 2,
    subsystem: 3,
    system: 4,
    cross_system: 5,
    organizational: 6,
    enterprise: 7,
  };

  const ambiguityRank: Record<AmbiguityDimension, number> = {
    structured: 1,
    low: 2,
    moderate: 3,
    high: 4,
    unconstrained: 5,
  };

  if (observed.demonstrated_scope) {
    const expectedRank = scopeRank[profile.axes.scope];
    const observedRank = scopeRank[observed.demonstrated_scope];
    if (observedRank < expectedRank - 1) {
      deviations.push(
        `Demonstrated scope "${observed.demonstrated_scope}" falls short of expected "${profile.axes.scope}" for ${profile.display_title}.`
      );
    }
  }

  if (observed.handled_ambiguity) {
    const expectedAmbiguity = ambiguityRank[profile.axes.ambiguity];
    const observedAmbiguity = ambiguityRank[observed.handled_ambiguity];
    if (observedAmbiguity < expectedAmbiguity - 1) {
      deviations.push(
        `Handled ambiguity "${observed.handled_ambiguity}" is significantly below the expected "${profile.axes.ambiguity}" level.`
      );
    }
  }

  return {
    fits: deviations.length === 0,
    deviations,
  };
}
