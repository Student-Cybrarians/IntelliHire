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
