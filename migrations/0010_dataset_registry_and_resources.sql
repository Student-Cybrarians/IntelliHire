-- Migration 0010: Authoritative Dataset Registry and Curated Learning Resources Bank
-- Establishes legal provenance tracking, verified record counts, and ethical AI governance tables.

CREATE TABLE IF NOT EXISTS dataset_source (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  official_source_url TEXT NOT NULL,
  version TEXT NOT NULL,
  license TEXT NOT NULL,
  provenance_type TEXT NOT NULL,
  compliance_status TEXT NOT NULL,
  intended_module TEXT NOT NULL,
  historical_claimed_count TEXT NOT NULL,
  verified_record_count INTEGER NOT NULL,
  redistribution_terms TEXT NOT NULL,
  privacy_implications TEXT NOT NULL,
  compliance_notes TEXT NOT NULL,
  retrieved_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_resource (
  id TEXT PRIMARY KEY,
  source_id TEXT REFERENCES dataset_source(id),
  module TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty_level INTEGER DEFAULT 3,
  occupation_code TEXT,
  target_role TEXT,
  content_json TEXT NOT NULL,
  rubric_or_solution_json TEXT,
  provenance_notes TEXT NOT NULL,
  is_verified INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_res_module ON learning_resource(module, resource_type);
CREATE INDEX IF NOT EXISTS idx_learning_res_domain ON learning_resource(domain, topic);
CREATE INDEX IF NOT EXISTS idx_dataset_src_status ON dataset_source(compliance_status);

-- Seed Dataset Sources
INSERT OR REPLACE INTO dataset_source (
  id, code, name, official_source_url, version, license, provenance_type,
  compliance_status, intended_module, historical_claimed_count, verified_record_count,
  redistribution_terms, privacy_implications, compliance_notes
) VALUES
(
  'src-m01-onet-jobs',
  'ONET_JOB_CORPUS',
  'U.S. Department of Labor O*NET Standard Occupational Job Descriptions',
  'https://www.onetcenter.org/database.html',
  'O*NET 29.0 / Content Model v28',
  'Creative Commons Attribution 4.0 International (CC BY 4.0)',
  'open_government_standard',
  'APPROVED_ACTIVE',
  'M01',
  '5,000+ scraped postings (LinkedIn/Naukri)',
  30,
  'Permitted with attribution to USDOL/ETA. Unencumbered by commercial job-board scraping prohibitions.',
  'Zero PII. Public standard occupational profiles.',
  'Lawful replacement for unauthorized LinkedIn/Naukri scraping. Uses canonical Standard Occupational Classification (SOC) requirements.'
),
(
  'src-m01-benchmark-resumes',
  'BENCHMARK_RESUMES',
  'Curated Multi-Discipline Synthetic & Anonymized Benchmark Resume Corpus',
  'https://github.com/IntelliHire/curated-benchmark-resumes',
  '1.0.0-audited',
  'Creative Commons Zero v1.0 Universal (CC0 1.0)',
  'curated_benchmark',
  'APPROVED_ACTIVE',
  'M01',
  '10,000+ documents (Kaggle/GitHub dumps)',
  18,
  'Public domain / CC0 dedication. Fully permissive commercial and non-commercial reuse.',
  'Deterministic synthetic/sanitized PII. Zero real candidate exposure; adheres to GDPR Article 6 & CCPA safe harbor.',
  'Replaces raw, unvetted Kaggle student resume dumps that contain unconsented personal identifiable information.'
),
(
  'src-m02-aptitude-questions',
  'APTITUDE_BENCHMARK_BANK',
  'Audited Cognitive, Analytical & Technical Question Bank with Bloom’s Taxonomy',
  'https://github.com/IntelliHire/m02-validated-assessment-bank',
  '2.1.0',
  'Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)',
  'curated_benchmark',
  'APPROVED_ACTIVE',
  'M02',
  '2,000+ MCQs',
  45,
  'Permitted under CC BY-SA 4.0 with attribution and reciprocal licensing.',
  'No personal data.',
  'Every question includes verified answer key, distractor explanations, Bloom taxonomy level, and Bayesian initial priors.'
),
(
  'src-m03-coding-challenges',
  'OPEN_ALGORITHMIC_SIMS',
  'Open Algorithmic, System Architecture & Practical Simulation Problem Bank',
  'https://github.com/IntelliHire/m03-open-simulations',
  '2.0.0',
  'MIT License & Apache 2.0 (derived from open benchmark challenges)',
  'permissive_open_source',
  'APPROVED_ACTIVE',
  'M03',
  '20,000+ LeetCode solutions',
  15,
  'Permitted under MIT/Apache 2.0 with copyright notice preserved.',
  'No personal data. Untrusted candidate code is evaluated in isolated harnesses with strict timeouts.',
  'Lawful replacement for proprietary LeetCode problems/solutions which are strictly copyrighted under LeetCode Terms of Service Section 3.'
),
(
  'src-m04-star-scenarios',
  'OPM_STAR_INTERVIEW_CORPUS',
  'Structured Behavioral Interview Scenarios & Anchored 1–5 Rubrics (OPM/SHRM Standard)',
  'https://www.opm.gov/policy-data-oversight/assessment-and-selection/structured-interviews/',
  '3.0.0-calibrated',
  'U.S. Government Work (Public Domain under 17 U.S.C. § 105) & CC-BY 4.0',
  'open_government_standard',
  'APPROVED_ACTIVE',
  'M04',
  '500+ Q&A pairs',
  25,
  'Public domain material. Free to adapt and redistribute.',
  'Zero candidate PII. Standard behavioral prompts.',
  'Includes anchored rubrics (1: Unsatisfactory, 3: Competent, 5: Exceptional), probing intents, and anti-hallucination model answers.'
),
(
  'src-research-fer2013-affectnet',
  'FER2013_AFFECTNET_RESEARCH',
  'Facial Emotion Recognition Datasets (FER2013 / AffectNet)',
  'https://www.kaggle.com/c/challenges-in-representation-learning-facial-expression-recognition-challenge',
  'ICML 2013 / AffectNet Academic v1',
  'AffectNet Academic Non-Commercial / Kaggle Open (Restricted Use)',
  'excluded_restricted',
  'EXCLUDED_ETHICAL_POLICY',
  'RESEARCH_ONLY',
  '35,887 (FER2013) + ~450,000 (AffectNet) facial crops',
  0,
  'Restricted academic research only; commercial deployment prohibited by AffectNet license.',
  'High-risk biometric data. Inferred emotions from facial images constitute sensitive biometric profiling.',
  'STRICTLY EXCLUDED from candidate scoring and production hiring workflows. Violates EU AI Act Title II/Annex III (prohibiting emotional AI in recruitment) and EEOC disparate impact standards. IntelliHire enforces a Zero-Biometric Invariant.'
),
(
  'src-propr-leetcode',
  'LEETCODE_PROPRIETARY',
  'LeetCode Problem Statements & Official Solution Bank',
  'https://leetcode.com',
  'Proprietary Live',
  'Proprietary — All Rights Reserved by LeetCode / LeetCode LLC',
  'excluded_restricted',
  'EXCLUDED_PROPRIETARY_COPYRIGHT',
  'RESEARCH_ONLY',
  '20,000+ snippets',
  0,
  'Prohibited. Section 3 of LeetCode Terms of Service strictly reserves all copyrights.',
  'Proprietary IP violation if scraped or redistributed.',
  'STRICTLY EXCLUDED from platform redistribution. Lawfully substituted with open algorithmic benchmarks (HumanEval, MBPP, Project Euler) and original domain simulation exercises.'
);
