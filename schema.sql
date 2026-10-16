-- INTELLIHIRE MASTER RELATIONAL DATABASE SCHEMA (Cloudflare D1 SQLite)

-- 1. Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organization (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 2. User Accounts
CREATE TABLE IF NOT EXISTS user_account (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'candidate' CHECK (role IN ('platform_admin', 'org_admin', 'recruiter', 'hiring_manager', 'interviewer', 'candidate')),
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_login_at INTEGER
);

-- 3. Candidate Profiles
CREATE TABLE IF NOT EXISTS candidate_profile (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id),
  user_id TEXT NOT NULL UNIQUE REFERENCES user_account(id),
  headline TEXT,
  target_role TEXT,
  experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
  primary_domain TEXT,
  skills_json TEXT DEFAULT '[]',
  bio TEXT,
  readiness_score REAL DEFAULT 0.0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 4. Audit Log (Immutable Event Stream)
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 5. Tenant Quota Tracking
CREATE TABLE IF NOT EXISTS tenant_quota (
  organization_id TEXT PRIMARY KEY REFERENCES organization(id),
  daily_ai_call_limit INTEGER NOT NULL DEFAULT 100,
  daily_ai_calls_used INTEGER NOT NULL DEFAULT 0,
  storage_bytes_used INTEGER NOT NULL DEFAULT 0,
  last_reset_timestamp INTEGER NOT NULL DEFAULT (unixepoch())
);

DROP TABLE IF EXISTS candidate_context;
DROP TABLE IF EXISTS candidate_resume;

-- 6. Candidate Resumes (Versioning and Storage)
CREATE TABLE IF NOT EXISTS candidate_resume (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id),
  user_id TEXT NOT NULL REFERENCES user_account(id),
  version INTEGER NOT NULL DEFAULT 1,
  filename TEXT NOT NULL,
  file_format TEXT NOT NULL CHECK (file_format IN ('pdf', 'docx', 'tex', 'txt')),
  file_size_bytes INTEGER NOT NULL,
  content_hash_sha256 TEXT NOT NULL,
  storage_ref TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, version)
);

-- 7. Candidate Context Foundation
CREATE TABLE IF NOT EXISTS candidate_context (
  id TEXT PRIMARY KEY,
  resume_id TEXT NOT NULL REFERENCES candidate_resume(id),
  user_id TEXT NOT NULL REFERENCES user_account(id),
  raw_text TEXT NOT NULL,
  extraction_method TEXT NOT NULL,
  extraction_status TEXT NOT NULL,
  context_data_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Default system organization seed
INSERT OR IGNORE INTO organization (id, name, slug, tier)
VALUES ('org_default_public', 'IntelliHire Public Sandbox', 'public-sandbox', 'free');

-- 8. Candidate Claims (Slice 4 - Provenance)
CREATE TABLE IF NOT EXISTS candidate_claim (
  id TEXT PRIMARY KEY,
  context_id TEXT NOT NULL REFERENCES candidate_context(id),
  claim_type TEXT NOT NULL CHECK (claim_type IN ('skill', 'experience', 'education', 'certification', 'other')),
  claim_value TEXT NOT NULL,
  normalized_value TEXT,
  confidence_score REAL NOT NULL,
  verification_state TEXT NOT NULL CHECK (verification_state IN ('extracted', 'normalized', 'inferred', 'missing', 'unverified', 'contradictory')),
  provenance_start_index INTEGER,
  provenance_end_index INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 9. Job Requisitions (Slice 5)
CREATE TABLE IF NOT EXISTS job_requisition (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id),
  created_by_user_id TEXT NOT NULL REFERENCES user_account(id),
  title TEXT NOT NULL,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'paused', 'closed')),
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 10. Candidate Applications (Slice 5)
CREATE TABLE IF NOT EXISTS candidate_application (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id),
  requisition_id TEXT NOT NULL REFERENCES job_requisition(id),
  candidate_user_id TEXT NOT NULL REFERENCES user_account(id),
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'screening', 'interviewing', 'offered', 'rejected')),
  match_score REAL,
  match_reasoning TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(requisition_id, candidate_user_id)
);

-- SLICE 8: Competency & Taxonomy Framework

CREATE TABLE IF NOT EXISTS competency (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skill (
    id TEXT PRIMARY KEY,
    competency_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competency_id) REFERENCES competency(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS candidate_proficiency (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    confidence REAL NOT NULL DEFAULT 0.0,
    last_assessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skill(id) ON DELETE CASCADE,
    UNIQUE(user_id, skill_id)
);

-- SLICE 9: AI Assessment Item Generation

CREATE TABLE IF NOT EXISTS assessment_item (
    id TEXT PRIMARY KEY,
    skill_id TEXT NOT NULL,
    question_type TEXT NOT NULL,
    question_text TEXT NOT NULL,
    options_json TEXT,
    correct_answer TEXT NOT NULL,
    difficulty_level INTEGER NOT NULL,
    traceability_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (skill_id) REFERENCES skill(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assessment_session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS candidate_response (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    assessment_item_id TEXT NOT NULL,
    response_text TEXT,
    is_correct BOOLEAN,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_session(id) ON DELETE CASCADE,
    FOREIGN KEY (assessment_item_id) REFERENCES assessment_item(id) ON DELETE CASCADE
);

-- SLICE 11: Candidate Pipeline State Machine

CREATE TABLE IF NOT EXISTS application_audit (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL,
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    changed_by_user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES candidate_application(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by_user_id) REFERENCES user_account(id)
);

-- SLICE 12: Semantic Search Embeddings
-- ALTER TABLE candidate_profile ADD COLUMN embedding_json TEXT;
-- Note: SQLite ALTER TABLE ADD COLUMN runs cleanly if the column does not exist, but errors if it does.
-- We will use a safe approach or just run it via wrangler directly.

-- M1: JD and Matching Context
CREATE TABLE IF NOT EXISTS job_description_context (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_account(id),
  raw_text TEXT NOT NULL,
  requirements_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS match_analysis (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_account(id),
  resume_id TEXT NOT NULL REFERENCES candidate_resume(id),
  jd_id TEXT NOT NULL REFERENCES job_description_context(id),
  match_report_json TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
-- M1 Asynchronous Jobs
CREATE TABLE IF NOT EXISTS async_job (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    progress_percentage INTEGER DEFAULT 0,
    result_data_json TEXT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE
);

-- M1 Universal Evidence Item
CREATE TABLE IF NOT EXISTS evidence_item (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    candidate_context_id TEXT,
    category TEXT NOT NULL,
    claimed_value TEXT,
    normalized_value TEXT,
    evidence_status TEXT NOT NULL,
    confidence REAL,
    source_reference TEXT,
    contradiction_notes TEXT,
    needs_human_review BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_context_id) REFERENCES candidate_context(id) ON DELETE CASCADE
);
-- SLICE 13: M2 Adaptive AI Assessment & Universal Skill-Proficiency Engine

CREATE TABLE IF NOT EXISTS assessment_purpose (
    id TEXT PRIMARY KEY,
    purpose_code TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    behavior_config_json TEXT,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_purpose_code ON assessment_purpose(purpose_code);

CREATE TABLE IF NOT EXISTS assessment_blueprint (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organization(id),
    target_role TEXT,
    purpose_id TEXT REFERENCES assessment_purpose(id),
    configuration_json TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_rubric (
    id TEXT PRIMARY KEY,
    skill_id TEXT NOT NULL REFERENCES skill(id),
    version INTEGER NOT NULL DEFAULT 1,
    criteria_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_item_v2 (
    id TEXT PRIMARY KEY,
    skill_id TEXT NOT NULL REFERENCES skill(id),
    rubric_id TEXT REFERENCES assessment_rubric(id),
    version INTEGER NOT NULL DEFAULT 1,
    item_type TEXT NOT NULL,
    content_json TEXT NOT NULL,
    expected_answer_json TEXT,
    difficulty_level INTEGER,
    calibration_data_json TEXT,
    rationale TEXT,
    validation_status TEXT NOT NULL DEFAULT 'draft' CHECK (validation_status IN ('draft', 'ai_validated', 'human_reviewed', 'published', 'retired')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_attempt (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_account(id),
    blueprint_id TEXT NOT NULL REFERENCES assessment_blueprint(id),
    status TEXT NOT NULL DEFAULT 'initialized' CHECK (status IN ('initialized', 'in_progress', 'paused', 'completed', 'terminated')),
    started_at DATETIME,
    completed_at DATETIME,
    current_stage TEXT,
    adaptive_state_json TEXT,
    context_data_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_response_v2 (
    id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL REFERENCES assessment_attempt(id),
    item_id TEXT NOT NULL REFERENCES assessment_item_v2(id),
    response_data_json TEXT NOT NULL,
    time_taken_seconds INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_evaluation (
    id TEXT PRIMARY KEY,
    response_id TEXT NOT NULL REFERENCES assessment_response_v2(id),
    evaluator_type TEXT NOT NULL CHECK (evaluator_type IN ('ai', 'human', 'objective', 'hybrid')),
    evaluator_metadata_json TEXT,
    score_raw REAL,
    evaluation_json TEXT NOT NULL,
    confidence_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_skill_proficiency_v2 (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_account(id),
    skill_id TEXT NOT NULL REFERENCES skill(id),
    proficiency_estimate REAL NOT NULL,
    uncertainty_estimate REAL NOT NULL,
    evidence_status TEXT NOT NULL CHECK (evidence_status IN ('assessed', 'inferred', 'missing', 'unassessed', 'outdated')),
    latest_attempt_id TEXT REFERENCES assessment_attempt(id),
    last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id)
);

-- SLICE 14: Phase 2 Universal Evidence Strategy Engine
CREATE TABLE IF NOT EXISTS evidence_strategy (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organization(id),
    competency_id TEXT REFERENCES competency(id),
    skill_id TEXT REFERENCES skill(id),
    occupation_code TEXT,
    target_role TEXT,
    jd_requirement_id TEXT,
    seniority_level TEXT NOT NULL DEFAULT 'mid' CHECK (seniority_level IN ('foundation', 'junior', 'mid', 'senior', 'lead', 'manager', 'executive')),
    assessment_purpose TEXT NOT NULL DEFAULT 'readiness' CHECK (assessment_purpose IN ('diagnostic', 'practice', 'training', 'certification', 'readiness', 'recruitment', 'gap_validation', 'interview_prep')),
    required_evidence TEXT NOT NULL,
    allowed_modalities_json TEXT NOT NULL DEFAULT '["knowledge_inquiry"]',
    preferred_modality TEXT NOT NULL DEFAULT 'knowledge_inquiry',
    alternative_modalities_json TEXT DEFAULT '[]',
    evaluation_method TEXT NOT NULL DEFAULT 'rubric' CHECK (evaluation_method IN ('objective', 'rubric', 'ai', 'human', 'hybrid')),
    rubric_id TEXT REFERENCES assessment_rubric(id),
    minimum_evidence_items INTEGER NOT NULL DEFAULT 3,
    stopping_rule_json TEXT NOT NULL DEFAULT '{"max_items": 10, "min_uncertainty": 0.20}',
    accessibility_accommodations_json TEXT DEFAULT '[]',
    language_code TEXT NOT NULL DEFAULT 'en',
    fairness_constraints_json TEXT DEFAULT '{}',
    confidence_threshold REAL NOT NULL DEFAULT 0.70,
    provenance_json TEXT DEFAULT '{}',
    version INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evidence_strategy_lookup ON evidence_strategy (organization_id, competency_id, skill_id, is_active);
CREATE INDEX IF NOT EXISTS idx_evidence_strategy_role ON evidence_strategy (target_role, seniority_level);

-- SLICE 15: Module 3 Universal Simulation Framework
CREATE TABLE IF NOT EXISTS simulation_definition (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  title TEXT NOT NULL,
  occupation_code TEXT,
  target_role TEXT,
  domain TEXT NOT NULL,
  simulation_type TEXT NOT NULL,
  competency_name TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  difficulty_level INTEGER NOT NULL DEFAULT 2,
  seniority_level TEXT DEFAULT 'mid',
  task_form TEXT DEFAULT 'scenario',
  task_family TEXT DEFAULT 'coding',
  work_surface_type TEXT DEFAULT 'code_editor',
  scenario_json TEXT NOT NULL,
  dynamic_injection_json TEXT,
  expected_output_schema_json TEXT,
  rubric_json TEXT NOT NULL,
  metadata_json TEXT DEFAULT '{}',
  version INTEGER DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS simulation_session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_account(id),
  organization_id TEXT NOT NULL,
  definition_id TEXT NOT NULL REFERENCES simulation_definition(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'evaluated', 'completed', 'abandoned')),
  current_step INTEGER NOT NULL DEFAULT 1,
  dynamic_state_json TEXT NOT NULL DEFAULT '{}',
  candidate_work_json TEXT NOT NULL DEFAULT '{}',
  telemetry_events_json TEXT NOT NULL DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS simulation_evaluation (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES simulation_session(id),
  user_id TEXT NOT NULL REFERENCES user_account(id),
  definition_id TEXT NOT NULL REFERENCES simulation_definition(id),
  overall_score REAL NOT NULL,
  dimension_scores_json TEXT NOT NULL,
  observable_evidence_json TEXT NOT NULL,
  model_interpretation_json TEXT NOT NULL,
  remediation_recommendation_json TEXT NOT NULL,
  confidence_score REAL NOT NULL DEFAULT 0.85,
  uncertainty_score REAL NOT NULL DEFAULT 0.15,
  observed_facts_json TEXT NOT NULL DEFAULT '[]',
  provenance_json TEXT NOT NULL DEFAULT '{}',
  submission_hash TEXT,
  submission_version INTEGER NOT NULL DEFAULT 1,
  alternative_validity TEXT DEFAULT 'correct',
  deterministic_verification_json TEXT DEFAULT '{}',
  teaching_payload_json TEXT DEFAULT '{}',
  adaptation_decision_json TEXT DEFAULT '{}',
  human_review_status TEXT NOT NULL DEFAULT 'unreviewed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sim_def_domain ON simulation_definition(domain, simulation_type);
CREATE INDEX IF NOT EXISTS idx_sim_def_org_active ON simulation_definition(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sim_sess_user ON simulation_session(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sim_sess_org ON simulation_session(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_sim_eval_session ON simulation_evaluation(session_id);
CREATE INDEX IF NOT EXISTS idx_sim_eval_user ON simulation_evaluation(user_id, definition_id);

-- Migration 0006: M04 Universal Behavioral, Communication & Professional Interaction Simulation
-- Tables for structured interview protocols, sessions, observations, and synthesis

CREATE TABLE IF NOT EXISTS interview_protocol (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  title TEXT NOT NULL,
  occupation_code TEXT,
  target_role TEXT NOT NULL,
  domain TEXT NOT NULL,
  interview_type TEXT NOT NULL DEFAULT 'structured_panel',
  seniority_level TEXT NOT NULL DEFAULT 'mid',
  panel_roles_json TEXT NOT NULL DEFAULT '["Hiring Manager", "Domain Expert"]',
  competency_targets_json TEXT NOT NULL DEFAULT '[]',
  question_sequence_json TEXT NOT NULL DEFAULT '[]',
  rubric_anchors_json TEXT NOT NULL DEFAULT '{}',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interview_session (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  protocol_id TEXT NOT NULL,
  candidate_user_id TEXT NOT NULL,
  interviewer_user_id TEXT NOT NULL,
  requisition_id TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  active_panel_role TEXT DEFAULT 'Hiring Manager',
  current_turn INTEGER NOT NULL DEFAULT 1,
  evidence_summary_json TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interview_observation (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  turn_number INTEGER NOT NULL,
  interviewer_role TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  candidate_response TEXT NOT NULL,
  observable_evidence_json TEXT NOT NULL DEFAULT '[]',
  rubric_evaluation_json TEXT NOT NULL DEFAULT '{}',
  ai_interpretation_json TEXT NOT NULL DEFAULT '{}',
  ai_recommended_probe TEXT,
  human_rating REAL,
  human_notes TEXT,
  confidence_score REAL NOT NULL DEFAULT 0.85,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interview_synthesis (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  candidate_user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  overall_rating REAL NOT NULL,
  competency_coverage_json TEXT NOT NULL DEFAULT '{}',
  strengths_json TEXT NOT NULL DEFAULT '[]',
  gaps_json TEXT NOT NULL DEFAULT '[]',
  unanswered_areas_json TEXT NOT NULL DEFAULT '[]',
  human_review_notes TEXT,
  m05_evidence_package_json TEXT NOT NULL DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_m4_proto_org ON interview_protocol(organization_id, domain);
CREATE INDEX IF NOT EXISTS idx_m4_sess_cand ON interview_session(candidate_user_id, status);
CREATE INDEX IF NOT EXISTS idx_m4_obs_sess ON interview_observation(session_id, turn_number);

-- =========================================================================
-- M02 Phase 1, Phase 2 & Phase 3 Universal Learning, Preparation & Assessment Tables
-- =========================================================================

-- M02 Audit Events & Evidence Packages
CREATE TABLE IF NOT EXISTS m2_audit_event (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_gap (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_account(id),
  skill_id TEXT NOT NULL REFERENCES skill(id),
  gap_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'unassessed',
  evidence_json TEXT,
  recommendation TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS evidence_package (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_account(id),
  organization_id TEXT NOT NULL,
  attempt_id TEXT REFERENCES assessment_attempt(id),
  package_version INTEGER NOT NULL DEFAULT 1,
  package_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- M02 Interview Preparation Engine
CREATE TABLE IF NOT EXISTS interview_prep_session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_account(id),
  organization_id TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'practice' CHECK (mode IN ('practice', 'learning', 'mock', 'assessment', 'targeted')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  target_role TEXT,
  target_jd_id TEXT,
  prep_plan_json TEXT NOT NULL DEFAULT '{}',
  readiness_snapshot_json TEXT NOT NULL DEFAULT '{}',
  questions_json TEXT NOT NULL DEFAULT '[]',
  misconceptions_json TEXT NOT NULL DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interview_prep_response (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES interview_prep_session(id),
  question_json TEXT NOT NULL,
  response_text TEXT NOT NULL,
  evaluation_json TEXT,
  follow_up_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prep_session_user ON interview_prep_session(user_id, status);
CREATE INDEX IF NOT EXISTS idx_prep_response_session ON interview_prep_response(session_id);

-- M02 Phase 1: Universal Market Intelligence Question Bank
CREATE TABLE IF NOT EXISTS interview_intelligence_item (
  id TEXT PRIMARY KEY,
  target_role TEXT NOT NULL,
  domain TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('public_source', 'employer_guidance', 'llm_practice', 'candidate_gap', 'unverified')),
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  question_type TEXT NOT NULL,
  difficulty_level INTEGER NOT NULL DEFAULT 3,
  evaluation_rubric_json TEXT NOT NULL DEFAULT '[]',
  hints_json TEXT NOT NULL DEFAULT '[]',
  source_url TEXT,
  source_publisher TEXT,
  retrieved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  company_context TEXT,
  provenance_type TEXT NOT NULL DEFAULT 'curated_benchmark',
  occupation_id TEXT REFERENCES taxonomy_occupation(id),
  seniority_level TEXT NOT NULL DEFAULT 'mid' CHECK(seniority_level IN ('entry', 'graduate', 'mid', 'senior', 'specialist', 'manager')),
  competency_name TEXT NOT NULL DEFAULT 'Core Competency',
  is_stale INTEGER NOT NULL DEFAULT 0,
  last_verified_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_intel_domain_role ON interview_intelligence_item(domain, target_role);
CREATE INDEX IF NOT EXISTS idx_intel_category ON interview_intelligence_item(category);
CREATE INDEX IF NOT EXISTS idx_intel_seniority ON interview_intelligence_item(seniority_level);
CREATE INDEX IF NOT EXISTS idx_intel_stale ON interview_intelligence_item(is_stale);

-- M02 Phase 2: Learning Pathways, Modules & Pedagogical Units
CREATE TABLE IF NOT EXISTS learning_pathway (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES user_account(id),
  title TEXT NOT NULL,
  target_role TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('software', 'data', 'finance', 'operations', 'marketing', 'hr', 'healthcare_admin', 'general')),
  occupation_code TEXT,
  pathway_type TEXT NOT NULL CHECK (pathway_type IN (
    'role_readiness', 'skill_gap_remediation', 'misconception_remediation', 
    'interview_prep', 'simulation_readiness', 'career_advancement'
  )),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  prerequisite_graph_json TEXT NOT NULL DEFAULT '{}',
  overall_progress REAL NOT NULL DEFAULT 0.0,
  mastery_score REAL NOT NULL DEFAULT 0.0,
  evidence_sources_json TEXT NOT NULL DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS curriculum_module (
  id TEXT PRIMARY KEY,
  pathway_id TEXT NOT NULL REFERENCES learning_pathway(id),
  sequence_order INTEGER NOT NULL,
  competency_name TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_capability TEXT NOT NULL,
  current_capability TEXT NOT NULL,
  evidence_gap_summary TEXT NOT NULL,
  prerequisite_module_ids_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('locked', 'available', 'in_progress', 'completed', 'mastered')),
  mastery_status TEXT NOT NULL DEFAULT 'unassessed' CHECK (mastery_status IN ('unassessed', 'needs_practice', 'proficient', 'mastered')),
  revision_due_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_unit (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES curriculum_module(id),
  unit_order INTEGER NOT NULL,
  unit_type TEXT NOT NULL CHECK (unit_type IN (
    'micro_concept', 'misconception_deepdive', 'guided_exercise', 
    'checkpoint_assessment', 'work_simulation', 'reassessment_gate'
  )),
  title TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  interactive_exercise_json TEXT,
  provenance_json TEXT NOT NULL DEFAULT '{}',
  completion_status TEXT NOT NULL DEFAULT 'not_started' CHECK (completion_status IN ('not_started', 'in_progress', 'completed')),
  demonstrated_score REAL,
  completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS learning_progress_record (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_account(id),
  pathway_id TEXT NOT NULL REFERENCES learning_pathway(id),
  module_id TEXT NOT NULL REFERENCES curriculum_module(id),
  unit_id TEXT NOT NULL REFERENCES learning_unit(id),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'unit_start', 'unit_complete', 'exercise_attempt', 'reassessment_attempt', 'mastery_verified'
  )),
  performance_score REAL,
  evidence_generated_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS curriculum_reassessment_attempt (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES curriculum_module(id),
  user_id TEXT NOT NULL REFERENCES user_account(id),
  challenge_prompt TEXT NOT NULL,
  solution_text TEXT NOT NULL,
  evaluation_score REAL NOT NULL,
  is_mastered INTEGER NOT NULL DEFAULT 0,
  criteria_scores_json TEXT,
  feedback_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pathway_user ON learning_pathway(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pathway_org ON learning_pathway(organization_id, pathway_type);
CREATE INDEX IF NOT EXISTS idx_curr_module_pathway ON curriculum_module(pathway_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_learn_unit_module ON learning_unit(module_id, unit_order);
CREATE INDEX IF NOT EXISTS idx_progress_user ON learning_progress_record(user_id, action_type);
CREATE INDEX IF NOT EXISTS idx_reassess_module ON curriculum_reassessment_attempt(module_id);
CREATE INDEX IF NOT EXISTS idx_reassess_user ON curriculum_reassessment_attempt(user_id);

-- =========================================================================
-- Migration 0009: M04 Human Live Interview Rooms, Scheduling, Signaling & Evaluation
-- =========================================================================

CREATE TABLE IF NOT EXISTS human_interview_invitation (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  candidate_user_id TEXT NOT NULL REFERENCES user_account(id),
  interviewer_user_id TEXT NOT NULL REFERENCES user_account(id),
  target_role TEXT NOT NULL,
  job_description TEXT,
  resume_id TEXT,
  interview_type TEXT NOT NULL DEFAULT 'technical_and_behavioral',
  scheduled_start_time TEXT NOT NULL,
  scheduled_end_time TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('draft', 'invited', 'accepted', 'declined', 'rescheduled', 'scheduled', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show')),
  candidate_token TEXT NOT NULL UNIQUE,
  interviewer_token TEXT NOT NULL UNIQUE,
  candidate_response_notes TEXT,
  cancellation_reason TEXT,
  created_by_user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS human_interview_room (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL REFERENCES human_interview_invitation(id),
  organization_id TEXT NOT NULL,
  room_status TEXT NOT NULL DEFAULT 'waiting' CHECK (room_status IN ('waiting', 'in_progress', 'completed', 'closed')),
  candidate_joined_at DATETIME,
  interviewer_joined_at DATETIME,
  candidate_recording_consent INTEGER NOT NULL DEFAULT 0,
  interviewer_recording_consent INTEGER NOT NULL DEFAULT 0,
  recording_enabled INTEGER NOT NULL DEFAULT 0,
  workspace_state_json TEXT NOT NULL DEFAULT '{}',
  started_at DATETIME,
  ended_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS human_interview_signal (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES human_interview_room(id),
  sender_user_id TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  signal_payload_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS human_interview_evaluation (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES human_interview_room(id),
  invitation_id TEXT NOT NULL REFERENCES human_interview_invitation(id),
  interviewer_user_id TEXT NOT NULL,
  candidate_user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  overall_recommendation TEXT NOT NULL CHECK (overall_recommendation IN ('strong_hire', 'hire', 'further_review', 'no_hire', 'hold')),
  competency_scores_json TEXT NOT NULL DEFAULT '{}',
  interviewer_notes TEXT NOT NULL,
  private_observations_json TEXT NOT NULL DEFAULT '[]',
  m05_evidence_package_json TEXT NOT NULL DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hi_inv_org ON human_interview_invitation(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_hi_inv_cand ON human_interview_invitation(candidate_user_id, status);
CREATE INDEX IF NOT EXISTS idx_hi_inv_intv ON human_interview_invitation(interviewer_user_id, status);
CREATE INDEX IF NOT EXISTS idx_hi_room_inv ON human_interview_room(invitation_id);
CREATE INDEX IF NOT EXISTS idx_hi_sig_room ON human_interview_signal(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_hi_eval_room ON human_interview_evaluation(room_id);

-- Dataset Registry and Curated Learning Resources Bank
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

