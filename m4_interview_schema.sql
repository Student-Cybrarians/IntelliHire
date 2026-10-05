-- M04 Professional Interaction & Structured Interview Intelligence Schema
-- Cloudflare D1 SQLite Schema Migration

CREATE TABLE IF NOT EXISTS interview_protocol (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  title TEXT NOT NULL,
  occupation_code TEXT,
  target_role TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('software', 'data', 'finance', 'operations', 'marketing', 'hr', 'healthcare_admin', 'general')),
  interview_type TEXT NOT NULL CHECK (interview_type IN (
    'behavioral', 'situational', 'technical', 'functional', 
    'competency', 'structured_panel', 'stakeholder_negotiation', 
    'conflict_resolution', 'leadership_crisis', 'case_discussion'
  )),
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
  protocol_id TEXT NOT NULL REFERENCES interview_protocol(id),
  candidate_user_id TEXT NOT NULL REFERENCES user_account(id),
  interviewer_user_id TEXT NOT NULL REFERENCES user_account(id),
  requisition_id TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  active_panel_role TEXT DEFAULT 'Hiring Manager',
  current_turn INTEGER NOT NULL DEFAULT 1,
  evidence_summary_json TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interview_observation (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES interview_session(id),
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
  session_id TEXT NOT NULL REFERENCES interview_session(id),
  candidate_user_id TEXT NOT NULL REFERENCES user_account(id),
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
