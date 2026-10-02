/**
 * Runtime Evidence Strategy Selector
 * IntelliHire M2 Universal Evidence & Competency Assessment Engine
 * Phase 2 - Prompt 17
 * 
 * Implements: selectEvidenceStrategy(context)
 * 
 * Inputs:
 * - candidate
 * - role
 * - JD
 * - occupation
 * - competency
 * - seniority
 * - purpose
 * - accessibility
 * - language
 * - available modalities
 * 
 * Returns:
 * - modality
 * - rationale
 * - alternatives
 * - required evidence
 * - evaluation method
 * - confidence requirement
 * - audit record
 */

import { SeniorityLevel, AssessmentPurpose, EvaluationMethod } from './evidenceStrategy';
import { CanonicalModalityId, globalModalityRegistry } from './modalityRegistry';
import { globalOccupationRegistry } from './occupationAdapters';
import { getSeniorityProfile } from './seniorityEngine';
import { getPurposeBehavior } from './purposeEngine';

export interface CandidateContextInput {
  candidate_id?: string;
  user_id?: string;
  prior_proficiency?: number;
  prior_uncertainty?: number;
  contradicted_claims_count?: number;
}

export interface StrategySelectionContext {
  candidate?: CandidateContextInput;
  role: string;
  jd?: {
    id?: string;
    raw_text?: string;
    key_requirements?: string[];
  };
  occupation: {
    code?: string;
    name?: string;
    industry?: string;
  };
  competency: {
    id: string;
    name: string;
    skill_id?: string;
    skill_name?: string;
  };
  seniority: SeniorityLevel;
  purpose: AssessmentPurpose;
  accessibility?: {
    accommodations?: string[];
    requires_screen_reader?: boolean;
    extended_time?: boolean;
    reduced_sensory_complexity?: boolean;
  };
  language?: string;
  available_modalities?: CanonicalModalityId[];
  organization_id?: string;
}

export interface StrategySelectionDecision {
  strategy_id: string;
  modality: CanonicalModalityId;
  rationale: {
    primary_reason: string;
    occupation_factor: string;
    seniority_factor: string;
    purpose_factor: string;
    accessibility_adjustments: string[];
    language_considerations: string;
    alternative_modalities_evaluation: string[];
  };
  alternatives: CanonicalModalityId[];
  required_evidence: string;
  evaluation_method: EvaluationMethod;
  confidence_requirement: {
    threshold: number;
    max_uncertainty: number;
    minimum_items: number;
  };
  audit_record: {
    decision_id: string;
    engine_version: string;
    timestamp: string;
    organization_id: string;
    user_id?: string;
    context_hash: string;
    decision_signature: string;
  };
}

export const RUNTIME_SELECTOR_VERSION = '2.0.0';

/**
 * Generate lightweight deterministic string hash
 */
function computeContextHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Core Runtime Evidence Strategy Selector
 */
export function selectEvidenceStrategy(
  context: StrategySelectionContext
): StrategySelectionDecision {
  if (!context.role || !context.role.trim()) {
    throw new Error('Target role is mandatory for evidence strategy selection.');
  }
  if (!context.competency || !context.competency.name) {
    throw new Error('Competency with a valid name is mandatory for strategy selection.');
  }
  if (!context.seniority) {
    throw new Error('Seniority level is mandatory for strategy selection.');
  }
  if (!context.purpose) {
    throw new Error('Assessment purpose is mandatory for strategy selection.');
  }

  // 1. Resolve Pluggable Occupation Adapter
  const occupationAdapter = globalOccupationRegistry.resolveAdapter({
    role_title: context.role,
    occupation_name: context.occupation.name,
    occupation_code: context.occupation.code,
    industry: context.occupation.industry,
  });

  const domainRecommendation = occupationAdapter.getPreferredModalities(
    context.seniority,
    context.purpose
  );
  const domainRequirement = occupationAdapter.getDomainEvidenceRequirement(
    context.competency.name,
    context.seniority
  );

  // 2. Resolve Seniority Multi-Axial Profile
  const seniorityProfile = getSeniorityProfile(context.seniority);

  // 3. Resolve Purpose Behavioral Policies
  const purposeBehavior = getPurposeBehavior(context.purpose);

  // 4. Determine Active & Permitted Modalities
  const registryEnabledModalities = new Set(
    globalModalityRegistry.getEnabled().map((m) => m.id)
  );

  let candidateAllowedModalities = Array.from(registryEnabledModalities);
  if (context.available_modalities && context.available_modalities.length > 0) {
    candidateAllowedModalities = context.available_modalities.filter((m) =>
      registryEnabledModalities.has(m)
    );
  }

  let primaryModality: CanonicalModalityId = domainRecommendation.primary;
  let alternativeModalities: CanonicalModalityId[] = [...domainRecommendation.alternatives];
  const accessibilityAdjustments: string[] = [];

  // Fallback if domain recommendation is not enabled in live registry
  if (!candidateAllowedModalities.includes(primaryModality)) {
    const validFallback = candidateAllowedModalities[0] || 'knowledge_question';
    alternativeModalities = alternativeModalities.filter((m) => m !== validFallback);
    alternativeModalities.unshift(primaryModality);
    primaryModality = validFallback;
  }

  // 5. Accessibility Accommodation Review
  const reqScreenReader = !!context.accessibility?.requires_screen_reader;
  if (reqScreenReader) {
    const modalityDef = globalModalityRegistry.get(primaryModality);
    if (modalityDef && !modalityDef.accessibilityAccommodations.screenReaderFriendly) {
      // Find construct-preserving screen-reader-friendly alternative
      const accessibleAlternative = candidateAllowedModalities.find((m) => {
        const def = globalModalityRegistry.get(m);
        return def?.accessibilityAccommodations.screenReaderFriendly;
      });

      if (accessibleAlternative) {
        accessibilityAdjustments.push(
          `Candidate requires screen reader. Replaced non-compatible "${primaryModality}" with fully screen-reader-accessible "${accessibleAlternative}".`
        );
        alternativeModalities = [primaryModality, ...alternativeModalities.filter((m) => m !== accessibleAlternative)];
        primaryModality = accessibleAlternative;
      }
    }
  }

  if (context.accessibility?.extended_time) {
    accessibilityAdjustments.push('Extended time accommodation enabled (1.5x standard countdown).');
  }

  // 6. Language Considerations
  const language = context.language || 'en';
  let languageNote = `Target language "${language}".`;
  if (language !== 'en') {
    languageNote += ` Enforced language-independent rubric criteria and neutral vernacular tolerance.`;
  }

  // 7. Calculate Calibrated Confidence & Uncertainty Bounds
  let targetConfidence = seniorityProfile.adaptive_parameters.target_confidence;
  let maxUncertainty = seniorityProfile.adaptive_parameters.max_uncertainty;
  let minItems = seniorityProfile.adaptive_parameters.min_evidence_items;

  // Purpose-driven adjustments
  if (context.purpose === 'recruitment' || context.purpose === 'certification') {
    targetConfidence = Math.min(0.90, targetConfidence + 0.05);
    maxUncertainty = Math.max(0.15, maxUncertainty - 0.05);
    minItems = Math.max(minItems, 5);
  } else if (context.purpose === 'diagnostic' || context.purpose === 'practice') {
    targetConfidence = Math.max(0.60, targetConfidence - 0.05);
    maxUncertainty = Math.min(0.35, maxUncertainty + 0.05);
    minItems = Math.max(2, minItems - 1);
  }

  // If candidate has high contradicted claims from M1, increase verification rigor
  if (context.candidate?.contradicted_claims_count && context.candidate.contradicted_claims_count > 0) {
    minItems += 1;
    targetConfidence = Math.min(0.92, targetConfidence + 0.03);
  }

  // 8. Evaluation Method Determination
  let evalMethod: EvaluationMethod = 'hybrid';
  if (primaryModality === 'knowledge_question') {
    evalMethod = 'objective';
  } else if (context.purpose === 'certification') {
    evalMethod = 'rubric';
  }

  // 9. Generate Immutable Audit Record
  const decisionId = `DEC_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const contextRawString = JSON.stringify({
    role: context.role,
    occupation: context.occupation,
    competency: context.competency,
    seniority: context.seniority,
    purpose: context.purpose,
    language,
    primaryModality,
  });
  const contextHash = computeContextHash(contextRawString);
  const decisionSignature = `SIG_M2_${context.seniority.toUpperCase()}_${primaryModality.toUpperCase()}_${contextHash}`;

  return {
    strategy_id: `STRAT_${context.competency.id}_${context.seniority}_${context.purpose}`,
    modality: primaryModality,
    rationale: {
      primary_reason: `Selected "${primaryModality}" as optimal evidence generator for ${context.role} (${context.seniority} level, ${context.purpose} purpose).`,
      occupation_factor: `Domain "${occupationAdapter.displayName}" matches requirements via ${occupationAdapter.standardTaxonomies.join(', ')}.`,
      seniority_factor: `Seniority profile "${seniorityProfile.display_title}" targets scope "${seniorityProfile.axes.scope}" with ${seniorityProfile.axes.ambiguity} ambiguity tolerance.`,
      purpose_factor: `Purpose "${purposeBehavior.name}" enforces scoring model "${purposeBehavior.scoring_model}" and retry policy "${purposeBehavior.retry_policy}".`,
      accessibility_adjustments: accessibilityAdjustments,
      language_considerations: languageNote,
      alternative_modalities_evaluation: alternativeModalities.map(
        (alt) => `Alternative modality "${alt}" maintained as construct-preserving backup.`
      ),
    },
    alternatives: alternativeModalities.filter((m) => candidateAllowedModalities.includes(m)),
    required_evidence: domainRequirement.requiredEvidence,
    evaluation_method: evalMethod,
    confidence_requirement: {
      threshold: parseFloat(targetConfidence.toFixed(2)),
      max_uncertainty: parseFloat(maxUncertainty.toFixed(2)),
      minimum_items: minItems,
    },
    audit_record: {
      decision_id: decisionId,
      engine_version: RUNTIME_SELECTOR_VERSION,
      timestamp: new Date().toISOString(),
      organization_id: context.organization_id || 'org_system_default',
      user_id: context.candidate?.user_id || context.candidate?.candidate_id,
      context_hash: contextHash,
      decision_signature: decisionSignature,
    },
  };
}
