-- Migration 0003: Purpose Engine Schema and Seed
-- IntelliHire M2 Universal Evidence & Competency Assessment Engine
-- Phase 2 - Prompt 14

ALTER TABLE assessment_purpose ADD COLUMN purpose_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_purpose_code ON assessment_purpose(purpose_code);
ALTER TABLE assessment_purpose ADD COLUMN behavior_config_json TEXT;
ALTER TABLE assessment_purpose ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE assessment_purpose ADD COLUMN is_active BOOLEAN DEFAULT 1;

-- Seed the 8 canonical purpose behaviors
INSERT OR REPLACE INTO assessment_purpose (id, purpose_code, name, description, behavior_config_json, version, is_active)
VALUES 
(
  'purp_diagnostic',
  'diagnostic',
  'Diagnostic Assessment',
  'Formative baseline evaluation identifying candidate competency gaps and strengths without high-stakes pressure.',
  '{"feedbackPolicy":"deferred_summary","retryPolicy":"single_retry_with_penalty","timeLimitPolicy":"untimed_relaxed","hintsPolicy":"hints_disabled","scoringModel":"bayesian_diagnostic","defaultConfidenceThreshold":0.65,"defaultMaxUncertainty":0.35,"maxAttemptsAllowed":2,"proctoringRequired":false,"blindEvaluation":false,"humanDecisionBoundaryEnforced":true}',
  1,
  1
),
(
  'purp_practice',
  'practice',
  'Practice & Skill Exploration',
  'Low-stakes sandbox allowing candidate exploration, immediate formative explanations, hints, and retries.',
  '{"feedbackPolicy":"immediate_explanatory","retryPolicy":"unlimited_retries","timeLimitPolicy":"untimed_relaxed","hintsPolicy":"hints_enabled","scoringModel":"formative_mastery","defaultConfidenceThreshold":0.60,"defaultMaxUncertainty":0.40,"maxAttemptsAllowed":999,"proctoringRequired":false,"blindEvaluation":false,"humanDecisionBoundaryEnforced":true}',
  1,
  1
),
(
  'purp_training',
  'training',
  'Training & Skill Acquisition',
  'Curriculum-aligned milestone assessments validating learning transfer with targeted formative corrections.',
  '{"feedbackPolicy":"immediate_explanatory","retryPolicy":"unlimited_retries","timeLimitPolicy":"untimed_relaxed","hintsPolicy":"hints_enabled","scoringModel":"formative_mastery","defaultConfidenceThreshold":0.70,"defaultMaxUncertainty":0.30,"maxAttemptsAllowed":5,"proctoringRequired":false,"blindEvaluation":false,"humanDecisionBoundaryEnforced":true}',
  1,
  1
),
(
  'purp_certification',
  'certification',
  'Certification Support',
  'High-integrity benchmark evaluation validating adherence to formal industry standards and regulatory criteria.',
  '{"feedbackPolicy":"blinded_evaluator_only","retryPolicy":"no_retries","timeLimitPolicy":"strict_proctored_timed","hintsPolicy":"hints_disabled","scoringModel":"summative_standard","defaultConfidenceThreshold":0.85,"defaultMaxUncertainty":0.15,"maxAttemptsAllowed":1,"proctoringRequired":true,"blindEvaluation":true,"humanDecisionBoundaryEnforced":true}',
  1,
  1
),
(
  'purp_readiness',
  'readiness',
  'Operational & Deployment Readiness',
  'Job-role simulation verifying whether candidate is ready for unassisted project deployment or client-facing delivery.',
  '{"feedbackPolicy":"deferred_summary","retryPolicy":"no_retries","timeLimitPolicy":"standard_timed","hintsPolicy":"hints_disabled","scoringModel":"summative_standard","defaultConfidenceThreshold":0.80,"defaultMaxUncertainty":0.20,"maxAttemptsAllowed":1,"proctoringRequired":false,"blindEvaluation":false,"humanDecisionBoundaryEnforced":true}',
  1,
  1
),
(
  'purp_recruitment',
  'recruitment',
  'Recruitment & Selection Support',
  'Strictly governed evaluative assessment generating evidence packages for recruiter/hiring manager review.',
  '{"feedbackPolicy":"blinded_evaluator_only","retryPolicy":"no_retries","timeLimitPolicy":"strict_proctored_timed","hintsPolicy":"hints_disabled","scoringModel":"summative_standard","defaultConfidenceThreshold":0.80,"defaultMaxUncertainty":0.20,"maxAttemptsAllowed":1,"proctoringRequired":true,"blindEvaluation":true,"humanDecisionBoundaryEnforced":true}',
  1,
  1
),
(
  'purp_gap_validation',
  'gap_validation',
  'Gap & Claim Validation',
  'Targeted inquiry focusing specifically on unverified, disputed, or contradictory claims from resume/M1 evidence.',
  '{"feedbackPolicy":"deferred_summary","retryPolicy":"no_retries","timeLimitPolicy":"standard_timed","hintsPolicy":"hints_disabled","scoringModel":"gap_verification","defaultConfidenceThreshold":0.75,"defaultMaxUncertainty":0.25,"maxAttemptsAllowed":1,"proctoringRequired":false,"blindEvaluation":false,"humanDecisionBoundaryEnforced":true}',
  1,
  1
),
(
  'purp_interview_prep',
  'interview_prep',
  'Interview Preparation & Coaching',
  'Coaching simulation helping candidates articulate rationale, navigate stress questions, and refine delivery.',
  '{"feedbackPolicy":"immediate_explanatory","retryPolicy":"single_retry_with_penalty","timeLimitPolicy":"standard_timed","hintsPolicy":"hints_enabled","scoringModel":"formative_mastery","defaultConfidenceThreshold":0.65,"defaultMaxUncertainty":0.35,"maxAttemptsAllowed":3,"proctoringRequired":false,"blindEvaluation":false,"humanDecisionBoundaryEnforced":true}',
  1,
  1
);
