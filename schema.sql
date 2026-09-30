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

-- M1: Global Multi-Domain Career Taxonomy
CREATE TABLE IF NOT EXISTS taxonomy_domain (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS taxonomy_occupation (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL REFERENCES taxonomy_domain(id),
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- M1: Targeted Resume Variants & Versioning
CREATE TABLE IF NOT EXISTS resume_variant (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_account(id),
  resume_id TEXT NOT NULL REFERENCES candidate_resume(id),
  target_role TEXT,
  target_jd_id TEXT REFERENCES job_description_context(id),
  variant_text TEXT NOT NULL,
  diff_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Global Taxonomy Seeds
INSERT OR IGNORE INTO taxonomy_domain (id, name, code, description) VALUES
  ('dom_tech', 'Technology & Digital Systems', '15-0000', 'Software, cloud, data, security, AI, infrastructure, and tech design'),
  ('dom_health', 'Healthcare, Clinical & Nursing', '29-0000', 'Physicians, registered nurses, allied health, pharmacy, clinical care'),
  ('dom_corp', 'Business, Finance & Operations', '11-0000', 'Operations, corporate strategy, accounting, marketing, sales, HR'),
  ('dom_legal', 'Legal, Regulatory & Compliance', '23-0000', 'Lawyers, paralegals, compliance officers, contract specialists'),
  ('dom_eng', 'Engineering & Industrial', '17-0000', 'Mechanical, civil, electrical, chemical, aerospace, manufacturing'),
  ('dom_trades', 'Skilled Trades & Vocational', '47-0000', 'Licensed electricians, plumbers, HVAC, welding, maintenance, carpentry'),
  ('dom_creative', 'Creative, Media & Communications', '27-0000', 'Designers, copywriters, video production, animation, technical writing'),
  ('dom_edu', 'Education, Training & Research', '25-0000', 'Teachers, professors, academic researchers, instructional designers'),
  ('dom_public', 'Public Sector, Social & Logistics', '13-0000', 'Public administration, NGO leadership, logistics, supply chain');

INSERT OR IGNORE INTO taxonomy_occupation (id, domain_id, name, code, description) VALUES
  ('occ_sw_eng', 'dom_tech', 'Software / Full-Stack Engineer', '15-1252', 'Builds software systems, web services, and user interfaces'),
  ('occ_data_sci', 'dom_tech', 'Data Scientist / ML Engineer', '15-2051', 'Develops predictive models, data pipelines, and AI systems'),
  ('occ_cloud_devops', 'dom_tech', 'Cloud / DevOps Engineer', '15-1244', 'Manages cloud infrastructure, CI/CD, and site reliability'),
  ('occ_cybersec', 'dom_tech', 'Cybersecurity Specialist', '15-1212', 'Protects systems, evaluates threats, and ensures digital security'),
  ('occ_rn', 'dom_health', 'Registered Nurse (RN)', '29-1141', 'Provides clinical patient care, administering treatments and triage'),
  ('occ_physician', 'dom_health', 'Medical Doctor / Physician', '29-1210', 'Diagnoses, treats medical conditions, and manages patient care'),
  ('occ_pharmacist', 'dom_health', 'Clinical Pharmacist', '29-1051', 'Dispenses medication, manages pharmacotherapy, monitors interactions'),
  ('occ_financial_analyst', 'dom_corp', 'Financial Analyst / Accountant', '13-2051', 'Analyzes financial health, prepares budgets, manages risk'),
  ('occ_ops_mgr', 'dom_corp', 'Operations / Project Manager', '11-1021', 'Oversees organizational delivery, resource planning, and execution'),
  ('occ_hr_specialist', 'dom_corp', 'Human Resources Generalist', '13-1071', 'Talent acquisition, organizational development, employee relations'),
  ('occ_lawyer', 'dom_legal', 'Legal Counsel / Attorney', '23-1011', 'Legal advisory, dispute resolution, contract negotiation'),
  ('occ_paralegal', 'dom_legal', 'Paralegal / Legal Analyst', '23-2011', 'Legal research, document preparation, discovery, compliance'),
  ('occ_mech_eng', 'dom_eng', 'Mechanical Engineer', '17-2141', 'Designs mechanical systems, thermal systems, and manufacturing tools'),
  ('occ_civil_eng', 'dom_eng', 'Civil / Structural Engineer', '17-2051', 'Designs infrastructure, buildings, water systems, and structural work'),
  ('occ_electrician', 'dom_trades', 'Licensed Electrician', '47-2111', 'Installs, maintains, and repairs electrical power and control systems'),
  ('occ_hvac', 'dom_trades', 'HVAC Technician', '49-9021', 'Installs, maintains, and repairs heating, ventilation, and AC units'),
  ('occ_ux_designer', 'dom_creative', 'UX / Product Designer', '27-1024', 'User research, interaction design, prototyping, usability testing'),
  ('occ_copywriter', 'dom_creative', 'Copywriter / Content Strategist', '27-3042', 'Creates persuasive communications, documentation, content strategy'),
  ('occ_teacher', 'dom_edu', 'Secondary / Vocational Educator', '25-2031', 'Curriculum planning, student assessment, classroom instruction');

