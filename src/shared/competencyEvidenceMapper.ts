/**
 * Competency Evidence Mapping Engine
 * IntelliHire M2 Universal Evidence & Competency Assessment Engine
 * Phase 2 - Prompt 13
 * 
 * Implements: Competency -> Evidence Requirement -> Modality
 * Considers: occupation, role, JD, seniority, purpose
 * Returns: Explainable mapping with transparent rationale
 */

import {
  SeniorityLevel,
  AssessmentPurpose,
  EvaluationMethod,
  VALID_SENIORITIES,
  VALID_PURPOSES,
} from './evidenceStrategy';
import {
  CanonicalModalityId,
  globalModalityRegistry,
} from './modalityRegistry';

export interface CompetencyMappingInput {
  competency_id: string;
  competency_name: string;
  skill_id?: string;
  skill_name?: string;
  occupation_code?: string;
  occupation_name?: string;
  target_role?: string;
  jd_requirement?: string;
  seniority_level: SeniorityLevel;
  assessment_purpose: AssessmentPurpose;
  custom_preferences?: {
    preferred_modality?: CanonicalModalityId;
    max_duration_minutes?: number;
    requires_screen_reader?: boolean;
  };
}

export interface MappingRationale {
  seniority_impact: string;
  purpose_impact: string;
  occupation_impact: string;
  modality_selection_reason: string;
  alternative_considerations: string[];
}

export interface ExplainableEvidenceMapping {
  competency_id: string;
  competency_name: string;
  skill_id?: string;
  skill_name?: string;
  target_role?: string;
  seniority_level: SeniorityLevel;
  assessment_purpose: AssessmentPurpose;
  required_evidence_description: string;
  primary_modality: CanonicalModalityId;
  alternative_modalities: CanonicalModalityId[];
  evaluation_method: EvaluationMethod;
  minimum_evidence_items: number;
  confidence_threshold: number;
  max_uncertainty: number;
  rationale: MappingRationale;
  provenance: {
    mapper_version: string;
    registry_version: string;
    timestamp: string;
    deterministic_rule_id: string;
  };
}

export const COMPETENCY_MAPPER_VERSION = '2.0.0';

/**
 * Determine broad occupation domain from role/code/name
 */
function classifyOccupationDomain(role: string = '', occupationName: string = ''): 'technology' | 'finance' | 'healthcare' | 'sales' | 'operations' | 'legal' | 'general' {
  const combined = `${role} ${occupationName}`.toLowerCase();
  
  if (/(software|developer|engineer|code|frontend|backend|fullstack|devops|cloud|sre|architect|python|react|java|database)/i.test(combined)) {
    return 'technology';
  }
  if (/(accountant|finance|financial|audit|tax|treasury|controller|banking|actuary)/i.test(combined)) {
    return 'finance';
  }
  if (/(nurse|doctor|physician|clinical|medical|patient|health|pharmacist|therapist)/i.test(combined)) {
    return 'healthcare';
  }
  if (/(sales|account executive|bd|business development|marketing|growth|revenue)/i.test(combined)) {
    return 'sales';
  }
  if (/(operations|project manager|scrum|product manager|logistics|supply chain|program manager)/i.test(combined)) {
    return 'operations';
  }
  if (/(legal|counsel|compliance|regulatory|attorney|lawyer|contracts)/i.test(combined)) {
    return 'legal';
  }
  return 'general';
}

/**
 * Generate explainable competency to evidence requirement mapping
 */
export function mapCompetencyToEvidenceRequirement(
  input: CompetencyMappingInput
): ExplainableEvidenceMapping {
  if (!input.competency_id || !input.competency_name) {
    throw new Error('Competency ID and name are mandatory for evidence mapping');
  }
  if (!VALID_SENIORITIES.includes(input.seniority_level)) {
    throw new Error(`Invalid seniority level: "${input.seniority_level}"`);
  }
  if (!VALID_PURPOSES.includes(input.assessment_purpose)) {
    throw new Error(`Invalid assessment purpose: "${input.assessment_purpose}"`);
  }

  const domain = classifyOccupationDomain(input.target_role, input.occupation_name);
  const competencyLower = input.competency_name.toLowerCase();
  const skillLower = (input.skill_name || '').toLowerCase();
  const jdLower = (input.jd_requirement || '').toLowerCase();

  let primaryModality: CanonicalModalityId = 'knowledge_question';
  let alternatives: CanonicalModalityId[] = ['reasoning'];
  let evalMethod: EvaluationMethod = 'hybrid';
  let minItems = 3;
  let confidenceThreshold = 0.70;
  let maxUncertainty = 0.30;
  let evidenceDesc = '';
  let modalityReason = '';

  // 1. Occupation & Competency Domain Heuristics
  const isPracticalCodingSkill =
    domain === 'technology' &&
    (/(algorithm|coding|programming|data structure|api development|frontend|backend|sql|refactoring|unit test)/i.test(competencyLower) ||
     /(javascript|typescript|python|go|rust|c\+\+|java|react|node|sql)/i.test(skillLower) ||
     /(write code|build api|implement function)/i.test(jdLower));

  const isSituationalOrLeadership =
    /(leadership|people management|stakeholder|conflict|incident management|crisis response|client negotiation|bedside manner|bedside|emergency|triage|patient escalation)/i.test(competencyLower) ||
    /(emergency|triage|patient escalation)/i.test(skillLower) ||
    ['manager', 'executive', 'lead'].includes(input.seniority_level);

  const isAnalyticalOrArchitectural =
    /(system design|architecture|security|cloud infrastructure|scalability|performance|risk assessment|compliance|auditing|clinical judgment)/i.test(competencyLower) ||
    /(trade-off|design doc|root cause|threat model)/i.test(jdLower);

  // 2. Map Primary Modality based on Domain and Seniority
  if (isPracticalCodingSkill) {
    if (['foundation', 'junior', 'mid'].includes(input.seniority_level)) {
      primaryModality = 'coding';
      alternatives = ['reasoning', 'knowledge_question'];
      evalMethod = 'hybrid';
      evidenceDesc = `Synthesized, syntactically verified code solution demonstrating correct implementation of ${input.skill_name || input.competency_name}.`;
      modalityReason = `Junior-to-mid technical competency requires direct practical code execution evidence rather than abstract claims.`;
    } else {
      // Senior+ tech roles
      primaryModality = 'scenario';
      alternatives = ['coding', 'reasoning'];
      evalMethod = 'rubric';
      evidenceDesc = `Architectural decision justification, fault tolerance trade-offs, and design review evidence for ${input.competency_name}.`;
      modalityReason = `Senior technical competency requires dynamic scenario evaluation testing architectural trade-offs under ambiguity.`;
    }
  } else if (isSituationalOrLeadership) {
    primaryModality = 'scenario';
    alternatives = ['reasoning', 'structured_response'];
    evalMethod = 'rubric';
    evidenceDesc = `Contextual decision-making trace and consequence analysis under organizational ambiguity for ${input.competency_name}.`;
    modalityReason = `Leadership, emergency clinical triage, and situational competencies require branching scenarios to evaluate multi-stakeholder impact.`;
  } else if (isAnalyticalOrArchitectural) {
    if (['senior', 'lead', 'manager', 'executive'].includes(input.seniority_level)) {
      primaryModality = 'scenario';
      alternatives = ['reasoning', 'structured_response'];
      evalMethod = 'rubric';
      evidenceDesc = `Architectural decision justification, fault tolerance trade-offs, and design review evidence for ${input.competency_name}.`;
      modalityReason = `Senior technical competency requires dynamic scenario evaluation testing architectural trade-offs under ambiguity.`;
    } else {
      primaryModality = 'reasoning';
      alternatives = ['scenario', 'structured_response'];
      evalMethod = 'rubric';
      evidenceDesc = `Structured analytical explanation articulating causal mechanisms, risk vectors, and trade-offs in ${input.competency_name}.`;
      modalityReason = `Analytical competency requires structured reasoning to reveal the candidate's diagnostic rigor and depth.`;
    }
  } else {
    // Foundational / general knowledge
    if (input.seniority_level === 'foundation' || input.seniority_level === 'junior') {
      primaryModality = 'knowledge_question';
      alternatives = ['structured_response', 'reasoning'];
      evalMethod = 'objective';
      evidenceDesc = `Factual recall and conceptual comprehension evidence for core principles of ${input.competency_name}.`;
      modalityReason = `Early-career foundational competency is reliably verified via calibrated objective knowledge items.`;
    } else {
      primaryModality = 'structured_response';
      alternatives = ['reasoning', 'scenario'];
      evalMethod = 'hybrid';
      evidenceDesc = `Structured multi-part response demonstrating methodical execution of ${input.competency_name}.`;
      modalityReason = `Mid-to-senior non-technical competency requires structured multi-part response articulating execution standards.`;
    }
  }

  // 3. Modulate Requirements by Seniority
  let seniorityImpact = '';
  switch (input.seniority_level) {
    case 'foundation':
      minItems = 3;
      confidenceThreshold = 0.65;
      maxUncertainty = 0.35;
      seniorityImpact = 'Foundation level: focuses on fundamental concepts and guided workflows; lower confidence threshold.';
      break;
    case 'junior':
      minItems = 4;
      confidenceThreshold = 0.70;
      maxUncertainty = 0.30;
      seniorityImpact = 'Junior level: verifies operational competence, procedural adherence, and baseline self-sufficiency.';
      break;
    case 'mid':
      minItems = 5;
      confidenceThreshold = 0.75;
      maxUncertainty = 0.25;
      seniorityImpact = 'Mid level: tests unassisted execution, edge case resolution, and practical trade-off navigation.';
      break;
    case 'senior':
      minItems = 6;
      confidenceThreshold = 0.80;
      maxUncertainty = 0.20;
      seniorityImpact = 'Senior level: demands high diagnostic rigor, architectural foresight, and failure-mode anticipation.';
      break;
    case 'lead':
    case 'manager':
      minItems = 6;
      confidenceThreshold = 0.82;
      maxUncertainty = 0.18;
      seniorityImpact = 'Leadership level: assesses cross-team alignment, mentorship, prioritization under constraints, and risk management.';
      break;
    case 'executive':
      minItems = 5;
      confidenceThreshold = 0.85;
      maxUncertainty = 0.15;
      seniorityImpact = 'Executive level: focuses on organizational resilience, strategic capital allocation, and governance.';
      break;
  }

  // 4. Modulate Requirements by Purpose
  let purposeImpact = '';
  switch (input.assessment_purpose) {
    case 'diagnostic':
      confidenceThreshold = Math.max(0.60, confidenceThreshold - 0.05);
      minItems = Math.max(2, minItems - 1);
      purposeImpact = 'Diagnostic purpose: formative survey targeting skill gaps with formative diagnostic hints; reduced item burden.';
      break;
    case 'practice':
    case 'interview_prep':
      confidenceThreshold = 0.65;
      minItems = Math.max(2, minItems - 1);
      purposeImpact = 'Practice/Prep purpose: low-stakes self-discovery; allows retries and explanatory post-mortems.';
      break;
    case 'recruitment':
      confidenceThreshold = Math.min(0.90, confidenceThreshold + 0.05);
      minItems = Math.min(8, minItems + 1);
      evalMethod = 'hybrid';
      purposeImpact = 'Recruitment purpose: summative gate; requires high confidence, anti-cheat validation, and multi-observer auditability.';
      break;
    case 'certification':
      confidenceThreshold = 0.85;
      minItems = Math.max(6, minItems);
      evalMethod = 'rubric';
      purposeImpact = 'Certification purpose: formal standard verification requiring strict rubric alignment and zero unassessed gaps.';
      break;
    case 'gap_validation':
      minItems = 3;
      purposeImpact = 'Gap validation purpose: targeted deep-dive focusing exclusively on unverified or contradicted resume claims.';
      break;
    case 'readiness':
    case 'training':
      purposeImpact = 'Readiness/Training purpose: verifies operational deployment readiness against predefined job competency benchmarks.';
      break;
  }

  // 5. Ensure primary and alternative modalities are registered & enabled
  if (!globalModalityRegistry.isEnabled(primaryModality)) {
    const fallback = globalModalityRegistry.getEnabled()[0]?.id || 'knowledge_question';
    modalityReason += ` (Primary modality ${primaryModality} fallback to ${fallback} because it is planned for future phase).`;
    primaryModality = fallback;
  }

  const enabledAlternatives = alternatives.filter((m) => globalModalityRegistry.isEnabled(m));

  return {
    competency_id: input.competency_id,
    competency_name: input.competency_name,
    skill_id: input.skill_id,
    skill_name: input.skill_name,
    target_role: input.target_role,
    seniority_level: input.seniority_level,
    assessment_purpose: input.assessment_purpose,
    required_evidence_description: evidenceDesc,
    primary_modality: primaryModality,
    alternative_modalities: enabledAlternatives,
    evaluation_method: evalMethod,
    minimum_evidence_items: minItems,
    confidence_threshold: parseFloat(confidenceThreshold.toFixed(2)),
    max_uncertainty: parseFloat(maxUncertainty.toFixed(2)),
    rationale: {
      seniority_impact: seniorityImpact,
      purpose_impact: purposeImpact,
      occupation_impact: `Domain classified as "${domain}" based on role "${input.target_role || 'Unspecified'}" and occupation "${input.occupation_name || 'Unspecified'}".`,
      modality_selection_reason: modalityReason,
      alternative_considerations: enabledAlternatives.map(
        (alt) => `Alternative modality "${alt}" provides construct-preserving fallback with equivalent validity.`
      ),
    },
    provenance: {
      mapper_version: COMPETENCY_MAPPER_VERSION,
      registry_version: globalModalityRegistry.version,
      timestamp: new Date().toISOString(),
      deterministic_rule_id: `RULE_${domain.toUpperCase()}_${input.seniority_level.toUpperCase()}_${primaryModality.toUpperCase()}`,
    },
  };
}

/**
 * Batch mapping helper
 */
export function mapBatchCompetencies(
  inputs: CompetencyMappingInput[]
): ExplainableEvidenceMapping[] {
  return inputs.map((input) => mapCompetencyToEvidenceRequirement(input));
}
