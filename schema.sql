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

-- Default system organization seed
INSERT OR IGNORE INTO organization (id, name, slug, tier)
VALUES ('org_default_public', 'IntelliHire Public Sandbox', 'public-sandbox', 'free');
