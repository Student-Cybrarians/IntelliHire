/**
 * Comprehensive Evidence Strategy Validator
 * IntelliHire M2 Universal Evidence & Competency Assessment Engine
 * Phase 2 - Prompt 18
 * 
 * Enforces strict rejection gates for:
 * 1. missing rubric
 * 2. unsupported modality
 * 3. unavailable modality
 * 4. incompatible accommodation
 * 5. unsupported occupation
 * 6. missing evidence requirement
 * 7. invalid seniority
 * 8. invalid purpose/modality combination
 */

import {
  SeniorityLevel,
  AssessmentPurpose,
  VALID_SENIORITIES,
  VALID_PURPOSES,
} from './evidenceStrategy';
import {
  globalModalityRegistry,
} from './modalityRegistry';
import {
  globalOccupationRegistry,
  OccupationDomainContext,
} from './occupationAdapters';

export const REJECTION_CODES = {
  MISSING_RUBRIC: 'ERR_MISSING_RUBRIC',
  UNSUPPORTED_MODALITY: 'ERR_UNSUPPORTED_MODALITY',
  UNAVAILABLE_MODALITY: 'ERR_UNAVAILABLE_MODALITY',
  INCOMPATIBLE_ACCOMMODATION: 'ERR_INCOMPATIBLE_ACCOMMODATION',
  UNSUPPORTED_OCCUPATION: 'ERR_UNSUPPORTED_OCCUPATION',
  MISSING_EVIDENCE_REQUIREMENT: 'ERR_MISSING_EVIDENCE_REQUIREMENT',
  INVALID_SENIORITY: 'ERR_INVALID_SENIORITY',
  INVALID_PURPOSE_MODALITY_COMBINATION: 'ERR_INVALID_PURPOSE_MODALITY_COMBINATION',
} as const;

export type StrategyRejectionCode = typeof REJECTION_CODES[keyof typeof REJECTION_CODES];

export interface StrategyValidationInput {
  organization_id?: string;
  target_role?: string;
  occupation?: OccupationDomainContext;
  seniority_level?: string;
  assessment_purpose?: string;
  primary_modality?: string;
  allowed_modalities?: string[];
  evaluation_method?: string;
  rubric_id?: string;
  rubric_criteria?: any[];
  required_evidence?: string;
  accessibility_accommodations?: string[];
  requires_screen_reader?: boolean;
}

export interface ComprehensiveValidationResult {
  valid: boolean;
  errors: string[];
  rejection_codes: StrategyRejectionCode[];
  warnings: string[];
}

export class StrategyValidationError extends Error {
  public readonly rejectionCodes: StrategyRejectionCode[];
  public readonly errors: string[];

  constructor(result: ComprehensiveValidationResult) {
    super(`Strategy validation failed: ${result.errors.join('; ')}`);
    this.name = 'StrategyValidationError';
    this.rejectionCodes = result.rejection_codes;
    this.errors = result.errors;
  }
}

/**
 * Validates an evidence strategy against all 8 strict rejection gates
 */
export function validateStrategy(input: StrategyValidationInput): ComprehensiveValidationResult {
  const errors: string[] = [];
  const rejectionCodes: StrategyRejectionCode[] = [];
  const warnings: string[] = [];

  // --- GATE 1: Invalid Seniority ---
  if (!input.seniority_level || !VALID_SENIORITIES.includes(input.seniority_level as SeniorityLevel)) {
    errors.push(
      `Invalid seniority level: "${input.seniority_level}". Allowed: ${VALID_SENIORITIES.join(', ')}.`
    );
    rejectionCodes.push(REJECTION_CODES.INVALID_SENIORITY);
  }

  // --- GATE 2: Missing Evidence Requirement ---
  if (
    !input.required_evidence ||
    typeof input.required_evidence !== 'string' ||
    input.required_evidence.trim().length < 10
  ) {
    errors.push('Missing or insufficient evidence requirement description (minimum 10 characters required).');
    rejectionCodes.push(REJECTION_CODES.MISSING_EVIDENCE_REQUIREMENT);
  }

  // --- GATE 3: Unsupported Modality ---
  const modalityId = input.primary_modality || (input as any).preferred_modality || '';
  if (!modalityId || !globalModalityRegistry.has(modalityId)) {
    errors.push(`Unsupported evidence modality: "${modalityId}".`);
    rejectionCodes.push(REJECTION_CODES.UNSUPPORTED_MODALITY);
  } else {
    // --- GATE 4: Unavailable Modality ---
    const modalityDef = globalModalityRegistry.get(modalityId)!;
    if (!modalityDef.enabled) {
      errors.push(
        `Modality "${modalityDef.name}" is planned for ${modalityDef.implementationPhase} and is not available for live execution.`
      );
      rejectionCodes.push(REJECTION_CODES.UNAVAILABLE_MODALITY);
    }

    // --- GATE 5: Incompatible Accommodation ---
    if (input.requires_screen_reader && !modalityDef.accessibilityAccommodations.screenReaderFriendly) {
      errors.push(
        `Incompatible accommodation: Modality "${modalityDef.name}" is not screen-reader accessible.`
      );
      rejectionCodes.push(REJECTION_CODES.INCOMPATIBLE_ACCOMMODATION);
    }
  }

  // --- GATE 6: Missing Rubric ---
  const evalMethod = input.evaluation_method || 'hybrid';
  const requiresRubric = evalMethod === 'rubric' || evalMethod === 'hybrid';
  const hasRubricId = !!(input.rubric_id && input.rubric_id.trim());
  const hasCriteria = Array.isArray(input.rubric_criteria) && input.rubric_criteria.length > 0;

  if (requiresRubric && !hasRubricId && !hasCriteria) {
    errors.push(
      `Missing rubric: Evaluation method "${evalMethod}" requires a rubric_id or explicit rubric criteria.`
    );
    rejectionCodes.push(REJECTION_CODES.MISSING_RUBRIC);
  }

  // --- GATE 7: Unsupported Occupation ---
  if (
    !input.target_role &&
    (!input.occupation || (!input.occupation.role_title && !input.occupation.occupation_name))
  ) {
    errors.push('Unsupported occupation: Target role or valid occupation context is required.');
    rejectionCodes.push(REJECTION_CODES.UNSUPPORTED_OCCUPATION);
  } else {
    const occupationContext: OccupationDomainContext = input.occupation || {
      role_title: input.target_role,
    };
    const adapter = globalOccupationRegistry.resolveAdapter(occupationContext);
    if (!adapter) {
      errors.push('Unsupported occupation: Failed to resolve domain adapter.');
      rejectionCodes.push(REJECTION_CODES.UNSUPPORTED_OCCUPATION);
    }
  }

  // --- GATE 8: Invalid Purpose / Modality Combination ---
  const purpose = input.assessment_purpose as AssessmentPurpose;
  if (!purpose || !VALID_PURPOSES.includes(purpose)) {
    errors.push(`Invalid assessment purpose: "${purpose}". Allowed: ${VALID_PURPOSES.join(', ')}.`);
    rejectionCodes.push(REJECTION_CODES.INVALID_PURPOSE_MODALITY_COMBINATION);
  } else if (modalityId && globalModalityRegistry.has(modalityId)) {
    const canonicalModality = globalModalityRegistry.resolveCanonicalId(modalityId);

    // Incompatible: Certification with unguided single-choice without rubric or verification
    if (purpose === 'certification' && canonicalModality === 'knowledge_question' && !hasRubricId && !hasCriteria) {
      errors.push(
        'Invalid purpose/modality combination: Formal certification cannot rely solely on unrubriced multiple choice questions.'
      );
      rejectionCodes.push(REJECTION_CODES.INVALID_PURPOSE_MODALITY_COMBINATION);
    }

    // Incompatible: Practice with non-interactive restricted modalities
    if (purpose === 'practice' && evalMethod === 'objective' && canonicalModality === 'reasoning') {
      warnings.push('Objective evaluation on reasoning in practice mode may restrict formative feedback depth.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    rejection_codes: rejectionCodes,
    warnings,
  };
}

/**
 * Asserts that a strategy is valid, throwing a typed error if invalid
 */
export function assertStrategyValid(input: StrategyValidationInput): void {
  const result = validateStrategy(input);
  if (!result.valid) {
    throw new StrategyValidationError(result);
  }
}
