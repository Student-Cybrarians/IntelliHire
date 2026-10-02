import { describe, it, expect } from 'vitest';
import { selectEvidenceStrategy } from '../src/shared/runtimeStrategySelector';
import { mapCompetencyToEvidenceRequirement } from '../src/shared/competencyEvidenceMapper';
import { globalOccupationRegistry } from '../src/shared/occupationAdapters';
import { getSeniorityProfile } from '../src/shared/seniorityEngine';
import { getPurposeBehavior } from '../src/shared/purposeEngine';
import { validateStrategy, REJECTION_CODES } from '../src/shared/strategyValidator';
import { globalModalityRegistry } from '../src/shared/modalityRegistry';

describe('Prompt 20 — Phase 2 Gate Review & Proof Suite', () => {
  // PROOF 1: Different competencies produce appropriate strategies
  it('Proof 1: Different competencies produce appropriate strategies', () => {
    // 1a. Practical algorithmic competency -> coding
    const codingStrategy = selectEvidenceStrategy({
      role: 'Software Engineer',
      occupation: { name: 'Software Development' },
      competency: { id: 'c_algo', name: 'Algorithm Optimization' },
      seniority: 'mid',
      purpose: 'recruitment',
    });
    expect(codingStrategy.modality).toBe('coding');
    expect(codingStrategy.required_evidence).toContain('code');

    // 1b. Situational emergency leadership -> scenario
    const scenarioStrategy = selectEvidenceStrategy({
      role: 'Clinical Care Nurse',
      occupation: { name: 'Nursing' },
      competency: { id: 'c_triage', name: 'Emergency Patient Triage' },
      seniority: 'mid',
      purpose: 'recruitment',
    });
    expect(scenarioStrategy.modality).toBe('scenario');
    expect(['rubric', 'hybrid']).toContain(scenarioStrategy.evaluation_method);

    // 1c. Conceptual / theoretical competency -> knowledge_question
    const knowledgeMapping = mapCompetencyToEvidenceRequirement({
      competency_id: 'c_db_theory',
      competency_name: 'Database Normalization Forms',
      seniority_level: 'junior',
      assessment_purpose: 'diagnostic',
    });
    expect(knowledgeMapping.primary_modality).toBe('knowledge_question');
  });

  // PROOF 2: Occupations differ across domains
  it('Proof 2: Occupations can differ significantly across distinct domains', () => {
    const techAdapter = globalOccupationRegistry.resolveAdapter({ role_title: 'Backend Engineer' });
    const healthAdapter = globalOccupationRegistry.resolveAdapter({ role_title: 'ICU Charge Nurse' });
    const financeAdapter = globalOccupationRegistry.resolveAdapter({ role_title: 'SOX Auditor' });
    const skilledAdapter = globalOccupationRegistry.resolveAdapter({ role_title: 'Industrial Electrician' });

    expect(techAdapter.domainId).toBe('technical');
    expect(healthAdapter.domainId).toBe('healthcare');
    expect(financeAdapter.domainId).toBe('finance');
    expect(skilledAdapter.domainId).toBe('skilled_work');

    // Different regulatory environments
    expect(techAdapter.regulatoryFrameworks).toContain('SOC 2');
    expect(healthAdapter.regulatoryFrameworks).toContain('HIPAA');
    expect(financeAdapter.regulatoryFrameworks).toContain('SOX');
    expect(skilledAdapter.regulatoryFrameworks).toContain('National Electrical Code (NEC)');

    // Different modality recommendations
    const techModality = techAdapter.getPreferredModalities('junior', 'recruitment');
    const healthModality = healthAdapter.getPreferredModalities('junior', 'recruitment');
    expect(techModality.primary).toBe('coding');
    expect(healthModality.primary).toBe('scenario');
  });

  // PROOF 3: Seniority changes evidence expectations
  it('Proof 3: Seniority changes multi-axial evidence expectations', () => {
    const junior = getSeniorityProfile('junior');
    const mid = getSeniorityProfile('mid');
    const senior = getSeniorityProfile('senior');
    const exec = getSeniorityProfile('executive');

    // Scope scales from feature to enterprise
    expect(junior.axes.scope).toBe('feature');
    expect(mid.axes.scope).toBe('subsystem');
    expect(senior.axes.scope).toBe('system');
    expect(exec.axes.scope).toBe('enterprise');

    // Ambiguity tolerance scales
    expect(junior.axes.ambiguity).toBe('low');
    expect(senior.axes.ambiguity).toBe('high');
    expect(exec.axes.ambiguity).toBe('unconstrained');

    // Confidence requirements scale
    expect(junior.adaptive_parameters.target_confidence).toBe(0.70);
    expect(senior.adaptive_parameters.target_confidence).toBe(0.80);
    expect(exec.adaptive_parameters.target_confidence).toBe(0.85);

    // Trade-offs adapt beyond basic syntax
    expect(junior.axes.trade_offs).toContain('code readability vs local optimization');
    expect(senior.axes.trade_offs).toContain('consistency vs availability (CAP theorem)');
    expect(exec.axes.trade_offs).toContain('capital expenditure vs operational runway');
  });

  // PROOF 4: Purpose changes strategy
  it('Proof 4: Purpose changes assessment strategy, policies, and scoring models', () => {
    const practice = getPurposeBehavior('practice');
    const recruitment = getPurposeBehavior('recruitment');
    const diagnostic = getPurposeBehavior('diagnostic');
    const certification = getPurposeBehavior('certification');

    // Feedback policies
    expect(practice.feedback_policy).toBe('immediate_explanatory');
    expect(recruitment.feedback_policy).toBe('blinded_evaluator_only');
    expect(diagnostic.feedback_policy).toBe('deferred_summary');

    // Retry and timer policies
    expect(practice.retry_policy).toBe('unlimited_retries');
    expect(practice.time_limit_policy).toBe('untimed_relaxed');
    expect(recruitment.retry_policy).toBe('no_retries');
    expect(recruitment.time_limit_policy).toBe('strict_proctored_timed');

    // Scoring models
    expect(practice.scoring_model).toBe('formative_mastery');
    expect(recruitment.scoring_model).toBe('summative_standard');
    expect(diagnostic.scoring_model).toBe('bayesian_diagnostic');

    // Invariant: human authority maintained across all
    expect(practice.human_decision_boundary_enforced).toBe(true);
    expect(recruitment.human_decision_boundary_enforced).toBe(true);
  });

  // PROOF 5: Unsupported strategies fail safely
  it('Proof 5: Unsupported strategies fail safely with clear rejection codes', () => {
    // 5a. Missing rubric
    const resNoRubric = validateStrategy({
      seniority_level: 'mid',
      required_evidence: 'Sample evidence description here.',
      primary_modality: 'scenario',
      evaluation_method: 'rubric',
      target_role: 'Manager',
      assessment_purpose: 'recruitment',
    });
    expect(resNoRubric.valid).toBe(false);
    expect(resNoRubric.rejection_codes).toContain(REJECTION_CODES.MISSING_RUBRIC);

    // 5b. Unavailable modality (e.g. simulation planned for Phase 3)
    const resUnavailable = validateStrategy({
      seniority_level: 'mid',
      required_evidence: 'Sample evidence description here.',
      primary_modality: 'simulation',
      rubric_id: 'rub_123',
      target_role: 'Pilot',
      assessment_purpose: 'recruitment',
    });
    expect(resUnavailable.valid).toBe(false);
    expect(resUnavailable.rejection_codes).toContain(REJECTION_CODES.UNAVAILABLE_MODALITY);

    // 5c. Incompatible accommodation
    const resIncompatible = validateStrategy({
      seniority_level: 'mid',
      required_evidence: 'Sample evidence description here.',
      primary_modality: 'coding',
      requires_screen_reader: true,
      rubric_id: 'rub_123',
      target_role: 'Engineer',
      assessment_purpose: 'recruitment',
    });
    expect(resIncompatible.valid).toBe(false);
    expect(resIncompatible.rejection_codes).toContain(REJECTION_CODES.INCOMPATIBLE_ACCOMMODATION);

    // 5d. Invalid purpose/modality combination
    const resInvalidCombo = validateStrategy({
      seniority_level: 'mid',
      required_evidence: 'Sample evidence description here.',
      primary_modality: 'knowledge_question',
      evaluation_method: 'objective',
      target_role: 'Doctor',
      assessment_purpose: 'certification',
    });
    expect(resInvalidCombo.valid).toBe(false);
    expect(resInvalidCombo.rejection_codes).toContain(REJECTION_CODES.INVALID_PURPOSE_MODALITY_COMBINATION);
  });

  // PROOF 6: Existing M2 behavior remains functional
  it('Proof 6: Existing M2 behavior remains functional', () => {
    // Registry active modalities
    const enabledModalities = globalModalityRegistry.getEnabled();
    expect(enabledModalities.length).toBe(5);
    expect(enabledModalities.map((m) => m.id)).toEqual(
      expect.arrayContaining(['knowledge_question', 'reasoning', 'scenario', 'coding', 'structured_response'])
    );

    // Response validation against active modalities works
    const mcqValid = globalModalityRegistry.validateResponse('knowledge_question', { selected_option: 'B' });
    expect(mcqValid.valid).toBe(true);

    const codeValid = globalModalityRegistry.validateResponse('coding', 'const x = 42;');
    expect(codeValid.valid).toBe(true);
  });
});
