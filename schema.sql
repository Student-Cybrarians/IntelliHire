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

-- SLICE 15: Phase 1 Free Infrastructure Intelligence Dashboard
CREATE TABLE IF NOT EXISTS free_service_catalog (
    id TEXT PRIMARY KEY,
    provider_name TEXT,
    service_name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    official_url TEXT,
    source_url TEXT,
    description TEXT NOT NULL,
    free_tier_description TEXT,
    free_tier_type TEXT NOT NULL DEFAULT 'unknown',
    quota REAL,
    quota_unit TEXT,
    quota_period TEXT,
    storage_limit TEXT,
    request_limit TEXT,
    compute_limit TEXT,
    bandwidth_limit TEXT,
    retention_limit TEXT,
    user_limit TEXT,
    project_limit TEXT,
    api_limit TEXT,
    credit_card_required INTEGER,
    trial_only INTEGER,
    open_source INTEGER,
    self_hostable INTEGER,
    commercial_use INTEGER,
    production_allowed INTEGER,
    api_available INTEGER,
    sdk_available INTEGER,
    webhook_available INTEGER,
    intellihire_modules_json TEXT NOT NULL DEFAULT '[]',
    capability_tags_json TEXT NOT NULL DEFAULT '[]',
    priority TEXT NOT NULL DEFAULT 'medium',
    risk_level TEXT NOT NULL DEFAULT 'low',
    verification_status TEXT NOT NULL DEFAULT 'unverified',
    source_provenance_json TEXT NOT NULL DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fsc_category ON free_service_catalog (category);
CREATE INDEX IF NOT EXISTS idx_fsc_subcategory ON free_service_catalog (subcategory);
CREATE INDEX IF NOT EXISTS idx_fsc_provider ON free_service_catalog (provider_name);
CREATE INDEX IF NOT EXISTS idx_fsc_service ON free_service_catalog (service_name);
CREATE INDEX IF NOT EXISTS idx_fsc_tier_type ON free_service_catalog (free_tier_type);
CREATE INDEX IF NOT EXISTS idx_fsc_priority ON free_service_catalog (priority);
CREATE INDEX IF NOT EXISTS idx_fsc_open_source ON free_service_catalog (open_source);
CREATE INDEX IF NOT EXISTS idx_fsc_self_hostable ON free_service_catalog (self_hostable);

CREATE TABLE IF NOT EXISTS free_service_sync_log (
    id TEXT PRIMARY KEY,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_commit TEXT,
    services_count INTEGER NOT NULL DEFAULT 0,
    categories_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'success',
    error_message TEXT
);
