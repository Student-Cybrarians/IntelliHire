import { describe, it, expect } from 'vitest';
import {
  mapCompetencyToEvidenceRequirement,
  mapBatchCompetencies,
  COMPETENCY_MAPPER_VERSION,
} from '../src/shared/competencyEvidenceMapper';

describe('Prompt 13 — Competency Evidence Mapping Engine', () => {
  it('exposes version 2.0.0', () => {
    expect(COMPETENCY_MAPPER_VERSION).toBe('2.0.0');
  });

  describe('Occupation Domain Impact', () => {
    it('maps junior software engineering competency to practical coding modality', () => {
      const result = mapCompetencyToEvidenceRequirement({
        competency_id: 'comp_algo_01',
        competency_name: 'Algorithms & Data Structures',
        skill_name: 'TypeScript API Development',
        target_role: 'Junior Fullstack Engineer',
        occupation_name: 'Software Developer',
        seniority_level: 'junior',
        assessment_purpose: 'recruitment',
      });

      expect(result.primary_modality).toBe('coding');
      expect(result.alternative_modalities).toContain('reasoning');
      expect(result.rationale.occupation_impact).toContain('technology');
      expect(result.rationale.modality_selection_reason).toContain('practical code execution');
      expect(result.required_evidence_description).toContain('Synthesized, syntactically verified code solution');
    });

    it('maps clinical healthcare competency to dynamic scenario modality', () => {
      const result = mapCompetencyToEvidenceRequirement({
        competency_id: 'comp_nursing_01',
        competency_name: 'Bedside Emergency Triage',
        skill_name: 'Patient Escalation Protocol',
        target_role: 'Registered ICU Nurse',
        occupation_name: 'Healthcare Practitioner',
        seniority_level: 'mid',
        assessment_purpose: 'certification',
      });

      expect(result.primary_modality).toBe('scenario');
      expect(result.rationale.occupation_impact).toContain('healthcare');
      expect(result.required_evidence_description).toContain('Contextual decision-making trace');
    });

    it('maps financial audit competency to structured reasoning or response', () => {
      const result = mapCompetencyToEvidenceRequirement({
        competency_id: 'comp_audit_01',
        competency_name: 'Risk Assessment & Internal Controls',
        skill_name: 'SOX Compliance Auditing',
        target_role: 'Senior Financial Auditor',
        occupation_name: 'Accounting and Finance',
        seniority_level: 'senior',
        assessment_purpose: 'recruitment',
      });

      expect(['reasoning', 'structured_response', 'scenario']).toContain(result.primary_modality);
      expect(result.rationale.occupation_impact).toContain('finance');
    });
  });

  describe('Seniority Modulation', () => {
    it('modulates requirements as seniority increases from foundation to executive', () => {
      const foundation = mapCompetencyToEvidenceRequirement({
        competency_id: 'comp_sql_01',
        competency_name: 'Database Fundamentals',
        skill_name: 'SQL Querying',
        target_role: 'Data Analyst',
        seniority_level: 'foundation',
        assessment_purpose: 'training',
      });

      const executive = mapCompetencyToEvidenceRequirement({
        competency_id: 'comp_sql_01',
        competency_name: 'Database Fundamentals',
        skill_name: 'Data Architecture Strategy',
        target_role: 'Chief Data Officer',
        seniority_level: 'executive',
        assessment_purpose: 'recruitment',
      });

      expect(foundation.confidence_threshold).toBeLessThan(executive.confidence_threshold);
      expect(foundation.max_uncertainty).toBeGreaterThan(executive.max_uncertainty);
      expect(foundation.rationale.seniority_impact).toContain('Foundation level');
      expect(executive.rationale.seniority_impact).toContain('Executive level');
    });

    it('adapts senior engineering competencies toward architectural scenarios rather than simple code snippets', () => {
      const seniorArch = mapCompetencyToEvidenceRequirement({
        competency_id: 'comp_sys_01',
        competency_name: 'System Design & Scalability',
        skill_name: 'Microservice Resilience',
        target_role: 'Principal Staff Engineer',
        seniority_level: 'senior',
        assessment_purpose: 'recruitment',
      });

      expect(seniorArch.primary_modality).toBe('scenario');
      expect(seniorArch.rationale.modality_selection_reason).toContain('architectural trade-offs');
    });
  });

  describe('Purpose Adaptation', () => {
    it('demands higher confidence threshold for recruitment compared to diagnostic', () => {
      const diagnostic = mapCompetencyToEvidenceRequirement({
        competency_id: 'comp_dev_01',
        competency_name: 'Cloud Infrastructure',
        target_role: 'DevOps Engineer',
        seniority_level: 'mid',
        assessment_purpose: 'diagnostic',
      });

      const recruitment = mapCompetencyToEvidenceRequirement({
        competency_id: 'comp_dev_01',
        competency_name: 'Cloud Infrastructure',
        target_role: 'DevOps Engineer',
        seniority_level: 'mid',
        assessment_purpose: 'recruitment',
      });

      expect(recruitment.confidence_threshold).toBeGreaterThan(diagnostic.confidence_threshold);
      expect(diagnostic.rationale.purpose_impact).toContain('Diagnostic purpose');
      expect(recruitment.rationale.purpose_impact).toContain('Recruitment purpose');
    });
  });

  describe('Explainability and Audit Provenance', () => {
    it('includes full explainable rationale and deterministic provenance', () => {
      const result = mapCompetencyToEvidenceRequirement({
        competency_id: 'comp_lead_01',
        competency_name: 'Technical Mentorship',
        target_role: 'Engineering Lead',
        seniority_level: 'lead',
        assessment_purpose: 'readiness',
      });

      expect(result.rationale).toBeDefined();
      expect(result.rationale.seniority_impact).toBeTruthy();
      expect(result.rationale.purpose_impact).toBeTruthy();
      expect(result.rationale.occupation_impact).toBeTruthy();
      expect(result.rationale.modality_selection_reason).toBeTruthy();
      expect(result.rationale.alternative_considerations.length).toBeGreaterThan(0);

      expect(result.provenance).toBeDefined();
      expect(result.provenance.mapper_version).toBe('2.0.0');
      expect(result.provenance.deterministic_rule_id).toMatch(/^RULE_/);
      expect(result.provenance.timestamp).toBeTruthy();
    });
  });

  describe('Batch Mapping and Error Guards', () => {
    it('maps multiple competencies in batch mode', () => {
      const batch = mapBatchCompetencies([
        {
          competency_id: 'c1',
          competency_name: 'Frontend Performance',
          seniority_level: 'mid',
          assessment_purpose: 'recruitment',
          target_role: 'React Engineer',
        },
        {
          competency_id: 'c2',
          competency_name: 'State Management',
          seniority_level: 'junior',
          assessment_purpose: 'diagnostic',
          target_role: 'React Engineer',
        },
      ]);

      expect(batch.length).toBe(2);
      expect(batch[0].competency_id).toBe('c1');
      expect(batch[1].competency_id).toBe('c2');
    });

    it('rejects invalid inputs safely', () => {
      expect(() => {
        mapCompetencyToEvidenceRequirement({
          competency_id: '',
          competency_name: '',
          seniority_level: 'mid',
          assessment_purpose: 'recruitment',
        });
      }).toThrow('Competency ID and name are mandatory');

      expect(() => {
        mapCompetencyToEvidenceRequirement({
          competency_id: 'c1',
          competency_name: 'Test',
          // @ts-expect-error test invalid seniority
          seniority_level: 'ninja',
          assessment_purpose: 'recruitment',
        });
      }).toThrow('Invalid seniority level');
    });
  });
});
