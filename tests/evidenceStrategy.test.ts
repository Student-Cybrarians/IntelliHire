import { describe, it, expect, vi } from 'vitest';
import { 
  validateEvidenceStrategy, 
  EvidenceStrategyRepository, 
  EvidenceStrategyData 
} from '../src/shared/evidenceStrategy';

describe('EvidenceStrategy Domain Model & Validation', () => {
  const validStrategy: EvidenceStrategyData = {
    organization_id: 'org_default_public',
    competency_id: 'comp_clinical_triage',
    skill_id: 'skill_patient_prioritization',
    occupation_code: '29-1141.00', // Nurse Practitioner
    target_role: 'Triage Nurse Practitioner',
    seniority_level: 'senior',
    assessment_purpose: 'recruitment',
    required_evidence: 'Demonstrated capacity to prioritize multiple acute patients under clinical ambiguity and communicate protocol justification.',
    allowed_modalities: ['dynamic_scenario', 'domain_simulation', 'structured_reasoning'],
    preferred_modality: 'dynamic_scenario',
    alternative_modalities: ['structured_reasoning'],
    evaluation_method: 'rubric',
    rubric_id: 'rubric_clinical_v1',
    minimum_evidence_items: 4,
    stopping_rule: {
      max_items: 8,
      min_uncertainty: 0.15,
      target_confidence: 0.85
    },
    accessibility_accommodations: ['screen_reader', 'extended_time'],
    language_code: 'en',
    fairness_constraints: {
      subgroup_parity_check: true
    },
    confidence_threshold: 0.80,
    provenance: {
      framework: 'O*NET 29-1141.00',
      authored_by: 'Clinical SME Board'
    },
    version: 1,
    is_active: true
  };

  it('validates a complete, sound universal evidence strategy', () => {
    const result = validateEvidenceStrategy(validStrategy);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects an evidence strategy with missing required evidence description', () => {
    const invalid = { ...validStrategy, required_evidence: '' };
    const result = validateEvidenceStrategy(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('required_evidence'))).toBe(true);
  });

  it('rejects an invalid seniority level', () => {
    const invalid = { ...validStrategy, seniority_level: 'super_hero' as any };
    const result = validateEvidenceStrategy(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('seniority_level'))).toBe(true);
  });

  it('rejects an invalid assessment purpose', () => {
    const invalid = { ...validStrategy, assessment_purpose: 'fun_trivia' as any };
    const result = validateEvidenceStrategy(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('assessment_purpose'))).toBe(true);
  });

  it('rejects preferred modality if not in allowed modalities', () => {
    const invalid = { 
      ...validStrategy, 
      allowed_modalities: ['structured_reasoning'] as any,
      preferred_modality: 'dynamic_scenario' as any
    };
    const result = validateEvidenceStrategy(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('preferred_modality must be included in allowed_modalities'))).toBe(true);
  });

  it('rejects invalid uncertainty bounds (< 0 or > 1)', () => {
    const invalid = { 
      ...validStrategy, 
      stopping_rule: { max_items: 5, min_uncertainty: 1.5 }
    };
    const result = validateEvidenceStrategy(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('min_uncertainty'))).toBe(true);
  });

  it('rejects invalid confidence threshold bounds', () => {
    const invalid = { ...validStrategy, confidence_threshold: 0 };
    const result = validateEvidenceStrategy(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('confidence_threshold'))).toBe(true);
  });
});

describe('EvidenceStrategy D1 Repository Operations', () => {
  it('creates and serializes an evidence strategy into D1 database', async () => {
    const runMock = vi.fn().mockResolvedValue({ success: true });
    const bindMock = vi.fn().mockReturnValue({ run: runMock });
    const prepareMock = vi.fn().mockReturnValue({ bind: bindMock });

    const mockDb = {
      prepare: prepareMock
    } as unknown as D1Database;

    const repo = new EvidenceStrategyRepository(mockDb);
    const result = await repo.create({
      organization_id: 'org_default_public',
      competency_id: 'comp_finance_audit',
      skill_id: 'skill_gaap_reconciliation',
      occupation_code: '13-2011.00',
      target_role: 'Senior Financial Auditor',
      seniority_level: 'senior',
      assessment_purpose: 'readiness',
      required_evidence: 'Reconcile multi-entity journal variances against GAAP standards.',
      allowed_modalities: ['data_analysis_sample', 'structured_reasoning'],
      preferred_modality: 'data_analysis_sample',
      evaluation_method: 'hybrid',
      minimum_evidence_items: 3,
      stopping_rule: { max_items: 6, min_uncertainty: 0.20 },
      language_code: 'en',
      confidence_threshold: 0.75
    });

    expect(result.id).toBeDefined();
    expect(prepareMock).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO evidence_strategy'));
    expect(bindMock).toHaveBeenCalled();
    expect(runMock).toHaveBeenCalled();
  });

  it('retrieves and deserializes an evidence strategy from D1', async () => {
    const rawRow = {
      id: 'strat_test_1',
      organization_id: 'org_default_public',
      skill_id: 'skill_123',
      seniority_level: 'lead',
      assessment_purpose: 'recruitment',
      required_evidence: 'System architecture trade-offs under ambiguity.',
      allowed_modalities_json: '["structured_reasoning", "written_work_sample"]',
      preferred_modality: 'written_work_sample',
      alternative_modalities_json: '["structured_reasoning"]',
      evaluation_method: 'rubric',
      minimum_evidence_items: 3,
      stopping_rule_json: '{"max_items": 5, "min_uncertainty": 0.18}',
      accessibility_accommodations_json: '["color_contrast"]',
      language_code: 'en',
      fairness_constraints_json: '{"disparate_impact_ratio": 0.8}',
      confidence_threshold: 0.85,
      provenance_json: '{"version": 1}',
      version: 1,
      is_active: 1
    };

    const firstMock = vi.fn().mockResolvedValue(rawRow);
    const bindMock = vi.fn().mockReturnValue({ first: firstMock });
    const prepareMock = vi.fn().mockReturnValue({ bind: bindMock });

    const mockDb = {
      prepare: prepareMock
    } as unknown as D1Database;

    const repo = new EvidenceStrategyRepository(mockDb);
    const item = await repo.findById('strat_test_1', 'org_default_public');

    expect(item).not.toBeNull();
    expect(item.preferred_modality).toBe('written_work_sample');
    expect(item.allowed_modalities).toEqual(['structured_reasoning', 'written_work_sample']);
    expect(item.stopping_rule.min_uncertainty).toBe(0.18);
    expect(item.fairness_constraints.disparate_impact_ratio).toBe(0.8);
  });
});
