-- M2 Interview Preparation Engine Schema Patch
-- Priority 14: interview_prep_session + interview_prep_response tables

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
