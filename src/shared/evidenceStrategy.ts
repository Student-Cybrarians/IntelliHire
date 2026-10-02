/**
 * Evidence Strategy Domain Types, Validation and Repository
 * Core Entity for Phase 2 Universal Evidence Engine
 */

export type SeniorityLevel = 
  | 'foundation'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'manager'
  | 'executive';

export type AssessmentPurpose = 
  | 'diagnostic'
  | 'practice'
  | 'training'
  | 'certification'
  | 'readiness'
  | 'recruitment'
  | 'gap_validation'
  | 'interview_prep';

export type EvidenceModalityType = 
  | 'knowledge_inquiry'
  | 'structured_reasoning'
  | 'dynamic_scenario'
  | 'domain_simulation'
  | 'data_analysis_sample'
  | 'written_work_sample'
  | 'practical_execution'
  | 'presentation_defense';

export type EvaluationMethod = 
  | 'objective'
  | 'rubric'
  | 'ai'
  | 'human'
  | 'hybrid';

export interface EvidenceStrategyData {
  id?: string;
  organization_id: string;
  competency_id?: string;
  skill_id?: string;
  occupation_code?: string;
  target_role?: string;
  jd_requirement_id?: string;
  seniority_level: SeniorityLevel;
  assessment_purpose: AssessmentPurpose;
  required_evidence: string;
  allowed_modalities: EvidenceModalityType[];
  preferred_modality: EvidenceModalityType;
  alternative_modalities?: EvidenceModalityType[];
  evaluation_method: EvaluationMethod;
  rubric_id?: string;
  minimum_evidence_items: number;
  stopping_rule: {
    max_items: number;
    min_uncertainty: number; // e.g. 0.20
    target_confidence?: number;
  };
  accessibility_accommodations?: string[];
  language_code: string;
  fairness_constraints?: Record<string, any>;
  confidence_threshold: number;
  provenance?: Record<string, any>;
  version?: number;
  is_active?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const VALID_SENIORITIES: SeniorityLevel[] = [
  'foundation', 'junior', 'mid', 'senior', 'lead', 'manager', 'executive'
];

export const VALID_PURPOSES: AssessmentPurpose[] = [
  'diagnostic', 'practice', 'training', 'certification', 'readiness', 'recruitment', 'gap_validation', 'interview_prep'
];

export const VALID_MODALITIES: EvidenceModalityType[] = [
  'knowledge_inquiry', 'structured_reasoning', 'dynamic_scenario', 'domain_simulation',
  'data_analysis_sample', 'written_work_sample', 'practical_execution', 'presentation_defense'
];

export const VALID_EVALUATION_METHODS: EvaluationMethod[] = [
  'objective', 'rubric', 'ai', 'human', 'hybrid'
];

export function validateEvidenceStrategy(data: Partial<EvidenceStrategyData>): ValidationResult {
  const errors: string[] = [];

  if (!data.organization_id || typeof data.organization_id !== 'string') {
    errors.push('organization_id is required');
  }

  if (!data.required_evidence || typeof data.required_evidence !== 'string' || data.required_evidence.trim().length === 0) {
    errors.push('required_evidence description is required');
  }

  if (!data.seniority_level || !VALID_SENIORITIES.includes(data.seniority_level)) {
    errors.push(`Invalid seniority_level. Must be one of: ${VALID_SENIORITIES.join(', ')}`);
  }

  if (!data.assessment_purpose || !VALID_PURPOSES.includes(data.assessment_purpose)) {
    errors.push(`Invalid assessment_purpose. Must be one of: ${VALID_PURPOSES.join(', ')}`);
  }

  if (!Array.isArray(data.allowed_modalities) || data.allowed_modalities.length === 0) {
    errors.push('allowed_modalities must be a non-empty array of valid modalities');
  } else {
    for (const m of data.allowed_modalities) {
      if (!VALID_MODALITIES.includes(m)) {
        errors.push(`Invalid modality: ${m}`);
      }
    }
  }

  if (!data.preferred_modality || !VALID_MODALITIES.includes(data.preferred_modality)) {
    errors.push(`preferred_modality must be one of: ${VALID_MODALITIES.join(', ')}`);
  } else if (data.allowed_modalities && !data.allowed_modalities.includes(data.preferred_modality)) {
    errors.push('preferred_modality must be included in allowed_modalities');
  }

  if (!data.evaluation_method || !VALID_EVALUATION_METHODS.includes(data.evaluation_method)) {
    errors.push(`evaluation_method must be one of: ${VALID_EVALUATION_METHODS.join(', ')}`);
  }

  if (typeof data.minimum_evidence_items !== 'number' || data.minimum_evidence_items < 1) {
    errors.push('minimum_evidence_items must be a positive integer >= 1');
  }

  if (!data.stopping_rule || typeof data.stopping_rule.max_items !== 'number' || data.stopping_rule.max_items < 1) {
    errors.push('stopping_rule.max_items must be >= 1');
  }

  if (!data.stopping_rule || typeof data.stopping_rule.min_uncertainty !== 'number' || data.stopping_rule.min_uncertainty <= 0 || data.stopping_rule.min_uncertainty > 1) {
    errors.push('stopping_rule.min_uncertainty must be a number between 0 and 1');
  }

  if (typeof data.confidence_threshold !== 'number' || data.confidence_threshold <= 0 || data.confidence_threshold > 1) {
    errors.push('confidence_threshold must be a number between 0 and 1');
  }

  if (!data.language_code || typeof data.language_code !== 'string') {
    errors.push('language_code is required (e.g. "en")');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export class EvidenceStrategyRepository {
  constructor(private db: D1Database) {}

  async create(data: EvidenceStrategyData): Promise<{ id: string }> {
    const validation = validateEvidenceStrategy(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }

    const id = data.id || crypto.randomUUID();
    const allowedJson = JSON.stringify(data.allowed_modalities);
    const altJson = JSON.stringify(data.alternative_modalities || []);
    const stoppingJson = JSON.stringify(data.stopping_rule);
    const accommJson = JSON.stringify(data.accessibility_accommodations || []);
    const fairnessJson = JSON.stringify(data.fairness_constraints || {});
    const provJson = JSON.stringify(data.provenance || {});

    await this.db.prepare(`
      INSERT INTO evidence_strategy (
        id, organization_id, competency_id, skill_id, occupation_code, target_role,
        jd_requirement_id, seniority_level, assessment_purpose, required_evidence,
        allowed_modalities_json, preferred_modality, alternative_modalities_json,
        evaluation_method, rubric_id, minimum_evidence_items, stopping_rule_json,
        accessibility_accommodations_json, language_code, fairness_constraints_json,
        confidence_threshold, provenance_json, version, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, data.organization_id, data.competency_id || null, data.skill_id || null,
      data.occupation_code || null, data.target_role || null, data.jd_requirement_id || null,
      data.seniority_level, data.assessment_purpose, data.required_evidence,
      allowedJson, data.preferred_modality, altJson,
      data.evaluation_method, data.rubric_id || null, data.minimum_evidence_items,
      stoppingJson, accommJson, data.language_code, fairnessJson,
      data.confidence_threshold, provJson, data.version || 1, data.is_active !== false ? 1 : 0
    ).run();

    return { id };
  }

  async findById(id: string, organizationId: string): Promise<any | null> {
    const row = await this.db.prepare(`
      SELECT * FROM evidence_strategy WHERE id = ? AND organization_id = ?
    `).bind(id, organizationId).first();
    return row ? this.mapRow(row) : null;
  }

  async findForSkill(skillId: string, organizationId: string): Promise<any[]> {
    const { results } = await this.db.prepare(`
      SELECT * FROM evidence_strategy 
      WHERE skill_id = ? AND organization_id = ? AND is_active = 1
      ORDER BY version DESC
    `).bind(skillId, organizationId).all();
    return (results || []).map(r => this.mapRow(r));
  }

  private mapRow(row: any): any {
    return {
      ...row,
      allowed_modalities: JSON.parse(row.allowed_modalities_json || '[]'),
      alternative_modalities: JSON.parse(row.alternative_modalities_json || '[]'),
      stopping_rule: JSON.parse(row.stopping_rule_json || '{}'),
      accessibility_accommodations: JSON.parse(row.accessibility_accommodations_json || '[]'),
      fairness_constraints: JSON.parse(row.fairness_constraints_json || '{}'),
      provenance: JSON.parse(row.provenance_json || '{}')
    };
  }
}
