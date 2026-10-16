/**
 * IntelliHire Authoritative Dataset & Learning Resource Registry
 * 
 * Tracks provenance, licenses, versioning, verified record counts,
 * intended module mappings, and ethical governance compliance.
 */

export interface DatasetSourceRecord {
  id: string;
  code: string;
  name: string;
  officialSourceUrl: string;
  version: string;
  license: string;
  provenanceType: 'open_government_standard' | 'permissive_open_source' | 'curated_benchmark' | 'excluded_restricted';
  complianceStatus: 'APPROVED_ACTIVE' | 'EXCLUDED_ETHICAL_POLICY' | 'EXCLUDED_PROPRIETARY_COPYRIGHT';
  intendedModule: 'M01' | 'M02' | 'M03' | 'M04' | 'M05' | 'RESEARCH_ONLY';
  historicalClaimedCount: string;
  verifiedRecordCount: number;
  redistributionTerms: string;
  privacyImplications: string;
  complianceNotes: string;
  retrievedAt: string;
}

export interface LearningResourceItem {
  id: string;
  sourceCode: string;
  module: 'M01' | 'M02' | 'M03' | 'M04' | 'M05';
  resourceType: 'job_description' | 'benchmark_resume' | 'aptitude_mcq' | 'coding_challenge' | 'star_interview_scenario';
  title: string;
  domain: string;
  topic: string;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  occupationCode?: string;
  targetRole?: string;
  content: any;
  rubricOrSolution?: any;
  provenanceNotes: string;
  isVerified: boolean;
}

export const DATASET_REGISTRY: DatasetSourceRecord[] = [
  {
    id: 'src-m01-onet-jobs',
    code: 'ONET_JOB_CORPUS',
    name: 'U.S. Department of Labor O*NET Standard Occupational Job Descriptions',
    officialSourceUrl: 'https://www.onetcenter.org/database.html',
    version: 'O*NET 29.0 / Content Model v28',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    provenanceType: 'open_government_standard',
    complianceStatus: 'APPROVED_ACTIVE',
    intendedModule: 'M01',
    historicalClaimedCount: '5,000+ scraped postings (LinkedIn/Naukri)',
    verifiedRecordCount: 30, // Verified curated standard role descriptions mapped to SOC codes
    redistributionTerms: 'Permitted with attribution to USDOL/ETA. Unencumbered by commercial job-board scraping prohibitions.',
    privacyImplications: 'Zero PII. Public standard occupational profiles.',
    complianceNotes: 'Lawful replacement for unauthorized LinkedIn/Naukri scraping. Uses canonical Standard Occupational Classification (SOC) requirements.',
    retrievedAt: '2026-10-15T00:00:00Z'
  },
  {
    id: 'src-m01-benchmark-resumes',
    code: 'BENCHMARK_RESUMES',
    name: 'Curated Multi-Discipline Synthetic & Anonymized Benchmark Resume Corpus',
    officialSourceUrl: 'https://github.com/IntelliHire/curated-benchmark-resumes',
    version: '1.0.0-audited',
    license: 'Creative Commons Zero v1.0 Universal (CC0 1.0)',
    provenanceType: 'curated_benchmark',
    complianceStatus: 'APPROVED_ACTIVE',
    intendedModule: 'M01',
    historicalClaimedCount: '10,000+ documents (Kaggle/GitHub dumps)',
    verifiedRecordCount: 18, // Curated cross-discipline benchmark resumes across Entry/Mid/Senior
    redistributionTerms: 'Public domain / CC0 dedication. Fully permissive commercial and non-commercial reuse.',
    privacyImplications: 'Deterministic synthetic/sanitized PII. Zero real candidate exposure; adheres to GDPR Article 6 & CCPA safe harbor.',
    complianceNotes: 'Replaces raw, unvetted Kaggle student resume dumps that contain unconsented personal identifiable information.',
    retrievedAt: '2026-10-15T00:00:00Z'
  },
  {
    id: 'src-m02-aptitude-questions',
    code: 'APTITUDE_BENCHMARK_BANK',
    name: 'Audited Cognitive, Analytical & Technical Question Bank with Bloom’s Taxonomy',
    officialSourceUrl: 'https://github.com/IntelliHire/m02-validated-assessment-bank',
    version: '2.1.0',
    license: 'Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)',
    provenanceType: 'curated_benchmark',
    complianceStatus: 'APPROVED_ACTIVE',
    intendedModule: 'M02',
    historicalClaimedCount: '2,000+ MCQs',
    verifiedRecordCount: 45, // Audited verified questions across 5 core cognitive/technical disciplines
    redistributionTerms: 'Permitted under CC BY-SA 4.0 with attribution and reciprocal licensing.',
    privacyImplications: 'No personal data.',
    complianceNotes: 'Every question includes verified answer key, distractor explanations, Bloom taxonomy level, and Bayesian initial priors.',
    retrievedAt: '2026-10-15T00:00:00Z'
  },
  {
    id: 'src-m03-coding-challenges',
    code: 'OPEN_ALGORITHMIC_SIMS',
    name: 'Open Algorithmic, System Architecture & Practical Simulation Problem Bank',
    officialSourceUrl: 'https://github.com/IntelliHire/m03-open-simulations',
    version: '2.0.0',
    license: 'MIT License & Apache 2.0 (derived from open benchmark challenges)',
    provenanceType: 'permissive_open_source',
    complianceStatus: 'APPROVED_ACTIVE',
    intendedModule: 'M03',
    historicalClaimedCount: '20,000+ LeetCode solutions',
    verifiedRecordCount: 15, // Multi-discipline sandboxed coding and domain triage challenges
    redistributionTerms: 'Permitted under MIT/Apache 2.0 with copyright notice preserved.',
    privacyImplications: 'No personal data. Untrusted candidate code is evaluated in isolated harnesses with strict timeouts.',
    complianceNotes: 'Lawful replacement for proprietary LeetCode problems/solutions which are strictly copyrighted under LeetCode Terms of Service Section 3.',
    retrievedAt: '2026-10-15T00:00:00Z'
  },
  {
    id: 'src-m04-star-scenarios',
    code: 'OPM_STAR_INTERVIEW_CORPUS',
    name: 'Structured Behavioral Interview Scenarios & Anchored 1–5 Rubrics (OPM/SHRM Standard)',
    officialSourceUrl: 'https://www.opm.gov/policy-data-oversight/assessment-and-selection/structured-interviews/',
    version: '3.0.0-calibrated',
    license: 'U.S. Government Work (Public Domain under 17 U.S.C. § 105) & CC-BY 4.0',
    provenanceType: 'open_government_standard',
    complianceStatus: 'APPROVED_ACTIVE',
    intendedModule: 'M04',
    historicalClaimedCount: '500+ Q&A pairs',
    verifiedRecordCount: 25, // Calibrated multi-role behavioral protocols with STAR exemplars
    redistributionTerms: 'Public domain material. Free to adapt and redistribute.',
    privacyImplications: 'Zero candidate PII. Standard behavioral prompts.',
    complianceNotes: 'Includes anchored rubrics (1: Unsatisfactory, 3: Competent, 5: Exceptional), probing intents, and anti-hallucination model answers.',
    retrievedAt: '2026-10-15T00:00:00Z'
  },
  {
    id: 'src-research-fer2013-affectnet',
    code: 'FER2013_AFFECTNET_RESEARCH',
    name: 'Facial Emotion Recognition Datasets (FER2013 / AffectNet)',
    officialSourceUrl: 'https://www.kaggle.com/c/challenges-in-representation-learning-facial-expression-recognition-challenge',
    version: 'ICML 2013 / AffectNet Academic v1',
    license: 'AffectNet Academic Non-Commercial / Kaggle Open (Restricted Use)',
    provenanceType: 'excluded_restricted',
    complianceStatus: 'EXCLUDED_ETHICAL_POLICY',
    intendedModule: 'RESEARCH_ONLY',
    historicalClaimedCount: '35,887 (FER2013) + ~450,000 (AffectNet) facial crops',
    verifiedRecordCount: 0, // 0 ingested into production
    redistributionTerms: 'Restricted academic research only; commercial deployment prohibited by AffectNet license.',
    privacyImplications: 'High-risk biometric data. Inferred emotions from facial images constitute sensitive biometric profiling.',
    complianceNotes: 'STRICTLY EXCLUDED from candidate scoring and production hiring workflows. Violates EU AI Act Title II/Annex III (prohibiting emotional AI in recruitment) and EEOC disparate impact standards. IntelliHire enforces a Zero-Biometric Invariant.',
    retrievedAt: '2026-10-15T00:00:00Z'
  },
  {
    id: 'src-propr-leetcode',
    code: 'LEETCODE_PROPRIETARY',
    name: 'LeetCode Problem Statements & Official Solution Bank',
    officialSourceUrl: 'https://leetcode.com',
    version: 'Proprietary Live',
    license: 'Proprietary — All Rights Reserved by LeetCode / LeetCode LLC',
    provenanceType: 'excluded_restricted',
    complianceStatus: 'EXCLUDED_PROPRIETARY_COPYRIGHT',
    intendedModule: 'RESEARCH_ONLY',
    historicalClaimedCount: '20,000+ snippets',
    verifiedRecordCount: 0, // 0 ingested into production
    redistributionTerms: 'Prohibited. Section 3 of LeetCode Terms of Service strictly reserves all copyrights.',
    privacyImplications: 'Proprietary IP violation if scraped or redistributed.',
    complianceNotes: 'STRICTLY EXCLUDED from platform redistribution. Lawfully substituted with open algorithmic benchmarks (HumanEval, MBPP, Project Euler) and original domain simulation exercises.',
    retrievedAt: '2026-10-15T00:00:00Z'
  }
];
