import { describe, it, expect } from 'vitest';
import {
  selectEvidenceStrategy,
  RUNTIME_SELECTOR_VERSION,
} from '../src/shared/runtimeStrategySelector';

describe('Prompt 17 — Runtime Strategy Selector', () => {
  it('exposes version 2.0.0', () => {
    expect(RUNTIME_SELECTOR_VERSION).toBe('2.0.0');
  });

  describe('Comprehensive Input Processing & Output Contract', () => {
    it('returns modality, rationale, alternatives, required evidence, eval method, confidence, and audit record', () => {
      const decision = selectEvidenceStrategy({
        role: 'Fullstack TypeScript Engineer',
        occupation: {
          code: '15-1252.00',
          name: 'Software Developers',
          industry: 'Information Technology',
        },
        competency: {
          id: 'comp_api_01',
          name: 'REST & GraphQL API Design',
          skill_id: 'skill_node_01',
          skill_name: 'Node.js Microservices',
        },
        seniority: 'mid',
        purpose: 'recruitment',
        jd: {
          id: 'jd_123',
          key_requirements: ['Node.js', 'PostgreSQL', 'Docker'],
        },
        organization_id: 'org_acme',
      });

      expect(decision.modality).toBe('coding');
      expect(decision.alternatives.length).toBeGreaterThan(0);
      expect(decision.required_evidence).toBeTruthy();
      expect(decision.evaluation_method).toBeDefined();

      // Rationale inspection
      expect(decision.rationale.primary_reason).toBeTruthy();
      expect(decision.rationale.occupation_factor).toContain('Technical');
      expect(decision.rationale.seniority_factor).toContain('Mid-Level');
      expect(decision.rationale.purpose_factor).toContain('Recruitment');

      // Confidence requirement
      expect(decision.confidence_requirement.threshold).toBeGreaterThanOrEqual(0.75);
      expect(decision.confidence_requirement.max_uncertainty).toBeLessThanOrEqual(0.25);
      expect(decision.confidence_requirement.minimum_items).toBeGreaterThanOrEqual(5);

      // Audit Record
      expect(decision.audit_record).toBeDefined();
      expect(decision.audit_record.decision_id).toMatch(/^DEC_/);
      expect(decision.audit_record.engine_version).toBe('2.0.0');
      expect(decision.audit_record.organization_id).toBe('org_acme');
      expect(decision.audit_record.context_hash).toBeTruthy();
      expect(decision.audit_record.decision_signature).toContain('SIG_M2_MID_CODING_');
      expect(decision.audit_record.timestamp).toBeTruthy();
    });
  });

  describe('Accessibility Accommodation Dynamic Substitution', () => {
    it('substitutes screen-reader incompatible modality with accessible alternative', () => {
      // Junior software engineer normally receives 'coding'
      const normalDecision = selectEvidenceStrategy({
        role: 'Software Developer',
        occupation: { name: 'Software Engineer' },
        competency: { id: 'c1', name: 'Algorithm Implementation' },
        seniority: 'junior',
        purpose: 'recruitment',
      });
      expect(normalDecision.modality).toBe('coding');

      // When screen reader accommodation is requested, coding is swapped for accessible alternative
      const accessibleDecision = selectEvidenceStrategy({
        role: 'Software Developer',
        occupation: { name: 'Software Engineer' },
        competency: { id: 'c1', name: 'Algorithm Implementation' },
        seniority: 'junior',
        purpose: 'recruitment',
        accessibility: {
          requires_screen_reader: true,
          extended_time: true,
        },
      });

      expect(accessibleDecision.modality).not.toBe('coding');
      expect(['structured_response', 'knowledge_question', 'reasoning']).toContain(accessibleDecision.modality);
      expect(accessibleDecision.rationale.accessibility_adjustments.some((adj) => adj.includes('screen reader'))).toBe(true);
      expect(accessibleDecision.rationale.accessibility_adjustments.some((adj) => adj.includes('Extended time'))).toBe(true);
    });
  });

  describe('M1 Contradicted Claim Rigor Escalation', () => {
    it('escalates confidence requirement and item count if candidate has contradicted claims from resume', () => {
      const cleanCandidate = selectEvidenceStrategy({
        role: 'Financial Analyst',
        occupation: { name: 'Finance' },
        competency: { id: 'c1', name: 'Cash Flow Modeling' },
        seniority: 'mid',
        purpose: 'recruitment',
        candidate: { contradicted_claims_count: 0 },
      });

      const suspiciousCandidate = selectEvidenceStrategy({
        role: 'Financial Analyst',
        occupation: { name: 'Finance' },
        competency: { id: 'c1', name: 'Cash Flow Modeling' },
        seniority: 'mid',
        purpose: 'recruitment',
        candidate: { contradicted_claims_count: 3 },
      });

      expect(suspiciousCandidate.confidence_requirement.minimum_items).toBeGreaterThan(
        cleanCandidate.confidence_requirement.minimum_items
      );
      expect(suspiciousCandidate.confidence_requirement.threshold).toBeGreaterThanOrEqual(
        cleanCandidate.confidence_requirement.threshold
      );
    });
  });

  describe('Multilingual Consideration', () => {
    it('documents language-independent criteria for non-English assessments', () => {
      const decision = selectEvidenceStrategy({
        role: 'Clinical Nurse',
        occupation: { name: 'Healthcare' },
        competency: { id: 'c1', name: 'Patient Triage' },
        seniority: 'mid',
        purpose: 'certification',
        language: 'es',
      });

      expect(decision.rationale.language_considerations).toContain('Target language "es"');
      expect(decision.rationale.language_considerations).toContain('language-independent');
    });
  });

  describe('Validation Guards', () => {
    it('rejects incomplete contexts with explicit actionable errors', () => {
      expect(() => {
        selectEvidenceStrategy({
          role: '',
          occupation: {},
          competency: { id: '1', name: 'Test' },
          seniority: 'mid',
          purpose: 'recruitment',
        });
      }).toThrow('Target role is mandatory');

      expect(() => {
        selectEvidenceStrategy({
          role: 'Developer',
          occupation: {},
          competency: { id: '1', name: '' },
          seniority: 'mid',
          purpose: 'recruitment',
        });
      }).toThrow('Competency with a valid name is mandatory');
    });
  });
});
