// Deterministic ATS Metric Engine
// Strictly calculates objective, verifiable signals from candidate source text vs JD requirements.
// Does NOT hallucinate or delegate deterministic counts to an LLM.

export interface DeterministicAtsResult {
  keyword_coverage_pct: number;
  matched_keywords: string[];
  missing_keywords: string[];
  required_skill_coverage_pct: number;
  matched_skills: string[];
  missing_skills: string[];
  certification_status: 'MATCHED' | 'MISSING' | 'NOT_REQUIRED';
  certification_details: { required: string[]; found: string[] };
  experience_alignment: 'ALIGNED' | 'PARTIAL' | 'BELOW';
  section_completeness: {
    has_contact: boolean;
    has_experience: boolean;
    has_education: boolean;
    has_skills: boolean;
    completeness_pct: number;
  };
  parseability_score: number;
  deterministic_ats_index: number;
  methodology_notes: string;
}

export function computeDeterministicAts(
  resumeText: string,
  extractedSkills: string[],
  jdRequirements: Array<{ requirement: string; category?: string; mandatory?: boolean }>,
  jdKeywords: string[] = []
): DeterministicAtsResult {
  const normResume = (resumeText || '').toLowerCase();
  
  // 1. Keyword Coverage
  const keywordsToTest = Array.from(new Set([
    ...jdKeywords.map(k => k.toLowerCase().trim()),
    ...jdRequirements.filter(r => r.mandatory).map(r => r.requirement.toLowerCase().trim())
  ])).filter(k => k.length > 2);

  const matched_keywords: string[] = [];
  const missing_keywords: string[] = [];

  for (const kw of keywordsToTest) {
    // Simple boundary / substring check
    if (normResume.includes(kw)) {
      matched_keywords.push(kw);
    } else {
      missing_keywords.push(kw);
    }
  }

  const keyword_coverage_pct = keywordsToTest.length > 0
    ? Math.round((matched_keywords.length / keywordsToTest.length) * 100)
    : 100;

  // 2. Required Skill Coverage
  const requiredSkillReqs = jdRequirements.filter(r => 
    r.mandatory && (r.category === 'skill' || r.category === 'technical_skill' || r.category === 'core_competency')
  );

  const matched_skills: string[] = [];
  const missing_skills: string[] = [];
  const normExtractedSkills = extractedSkills.map(s => s.toLowerCase());

  for (const req of requiredSkillReqs) {
    const reqText = req.requirement.toLowerCase();
    const hasMatch = normExtractedSkills.some(s => reqText.includes(s) || s.includes(reqText)) || normResume.includes(reqText);
    if (hasMatch) {
      matched_skills.push(req.requirement);
    } else {
      missing_skills.push(req.requirement);
    }
  }

  const required_skill_coverage_pct = requiredSkillReqs.length > 0
    ? Math.round((matched_skills.length / requiredSkillReqs.length) * 100)
    : keyword_coverage_pct;

  // 3. Certification & License Match
  const certReqs = jdRequirements.filter(r => 
    r.category === 'certification' || r.category === 'certification_license' || 
    r.requirement.toLowerCase().includes('license') || r.requirement.toLowerCase().includes('certified') || r.requirement.toLowerCase().includes('cpa') || r.requirement.toLowerCase().includes('rn')
  );

  let certification_status: 'MATCHED' | 'MISSING' | 'NOT_REQUIRED' = 'NOT_REQUIRED';
  const foundCerts: string[] = [];
  const reqCertNames = certReqs.map(c => c.requirement);

  if (certReqs.length > 0) {
    for (const cr of certReqs) {
      if (normResume.includes(cr.requirement.toLowerCase())) {
        foundCerts.push(cr.requirement);
      }
    }
    certification_status = foundCerts.length >= certReqs.length ? 'MATCHED' : (foundCerts.length > 0 ? 'PARTIAL' as any : 'MISSING');
  }

  // 4. Section Completeness Check
  const has_contact = /(@|phone|tel|email|\.com)/i.test(normResume);
  const has_experience = /(experience|work history|employment|clinical experience|projects|engagements)/i.test(normResume);
  const has_education = /(education|degree|university|college|academy|diploma|apprenticeship|school)/i.test(normResume);
  const has_skills = /(skills|competencies|tools|technologies|proficiencies|licenses)/i.test(normResume) || extractedSkills.length > 0;

  const sectionScore = [has_contact, has_experience, has_education, has_skills].filter(Boolean).length;
  const completeness_pct = Math.round((sectionScore / 4) * 100);

  // 5. Parseability Score (Length, absence of corrupt chars, proper character ratio)
  let parseability_score = 90;
  if (normResume.length < 200) parseability_score -= 30;
  if (normResume.length > 50000) parseability_score -= 10;
  if ((normResume.match(/[\uFFFD\0]/g) || []).length > 2) parseability_score -= 25;
  parseability_score = Math.max(20, Math.min(100, parseability_score));

  // 6. Experience Alignment
  const expMatch = normResume.match(/(\d+)\+?\s*(years|yrs)/i);
  const yearsFound = expMatch ? parseInt(expMatch[1], 10) : 0;
  const experience_alignment = yearsFound >= 5 ? 'ALIGNED' : (yearsFound >= 2 ? 'PARTIAL' : 'ALIGNED'); // Default ALIGNED if not strictly quantitative

  // 7. Weighted Composite Deterministic ATS Index:
  // 40% Keyword Coverage + 30% Required Skills + 15% Section Completeness + 15% Parseability
  const deterministic_ats_index = Math.round(
    (keyword_coverage_pct * 0.40) +
    (required_skill_coverage_pct * 0.30) +
    (completeness_pct * 0.15) +
    (parseability_score * 0.15)
  );

  return {
    keyword_coverage_pct,
    matched_keywords,
    missing_keywords,
    required_skill_coverage_pct,
    matched_skills,
    missing_skills,
    certification_status,
    certification_details: { required: reqCertNames, found: foundCerts },
    experience_alignment,
    section_completeness: {
      has_contact,
      has_experience,
      has_education,
      has_skills,
      completeness_pct
    },
    parseability_score,
    deterministic_ats_index,
    methodology_notes: 'Calculated deterministically: 40% Keyword Coverage, 30% Required Skills, 15% Document Section Completeness, 15% Parsing Integrity. Fully verifiable from source text.'
  };
}
