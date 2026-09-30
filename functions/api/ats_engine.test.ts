import { describe, it, expect } from 'vitest';
import { computeDeterministicAts } from './ats_engine';

describe('Deterministic ATS Engine Unit Tests', () => {
  it('computes keyword coverage, skill matching, and section completeness correctly', () => {
    const resumeText = `
      John Doe | Registered Nurse (RN) | email: john.doe@hospital.org | Phone: 555-123-4567
      Summary: Experienced Registered Nurse specializing in intensive care and patient triage.
      Experience: 5 years clinical nursing at City Hospital. Handled emergency triage, IV therapy, and medication administration.
      Education: Bachelor of Science in Nursing (BSN), State University.
      Skills: Patient Triage, IV Therapy, Electronic Health Records (EHR), Medication Administration, ACLS, BLS.
    `;

    const extractedSkills = ['Patient Triage', 'IV Therapy', 'EHR', 'Medication Administration', 'ACLS'];
    const jdRequirements = [
      { requirement: 'Registered Nurse', category: 'certification_license', mandatory: true },
      { requirement: 'Patient Triage', category: 'core_competency', mandatory: true },
      { requirement: 'IV Therapy', category: 'technical_skill', mandatory: true },
      { requirement: 'Pediatric Care', category: 'technical_skill', mandatory: false }
    ];
    const jdKeywords = ['Registered Nurse', 'Triage', 'IV Therapy', 'Clinical'];

    const result = computeDeterministicAts(resumeText, extractedSkills, jdRequirements, jdKeywords);

    expect(result.keyword_coverage_pct).toBeGreaterThan(50);
    expect(result.matched_keywords).toContain('registered nurse');
    expect(result.matched_keywords).toContain('iv therapy');
    expect(result.required_skill_coverage_pct).toBe(100); // Both mandatory skills matched
    expect(result.section_completeness.has_contact).toBe(true);
    expect(result.section_completeness.has_experience).toBe(true);
    expect(result.section_completeness.has_education).toBe(true);
    expect(result.section_completeness.has_skills).toBe(true);
    expect(result.section_completeness.completeness_pct).toBe(100);
    expect(result.parseability_score).toBeGreaterThanOrEqual(80);
    expect(result.deterministic_ats_index).toBeGreaterThanOrEqual(70);
    expect(result.methodology_notes).toContain('Calculated deterministically');
  });

  it('detects missing certifications and skills for non-tech roles like electrician', () => {
    const resumeText = `
      Apprentice Technician. Handled general tool maintenance and site cleanup.
    `;
    const extractedSkills = ['Tool Maintenance'];
    const jdRequirements = [
      { requirement: 'Master Electrician License', category: 'certification_license', mandatory: true },
      { requirement: 'High Voltage Conduit Bending', category: 'skill', mandatory: true }
    ];

    const result = computeDeterministicAts(resumeText, extractedSkills, jdRequirements, ['Electrician', 'Conduit']);

    expect(result.certification_status).toBe('MISSING');
    expect(result.required_skill_coverage_pct).toBe(0);
    expect(result.missing_skills).toContain('High Voltage Conduit Bending');
  });
});
