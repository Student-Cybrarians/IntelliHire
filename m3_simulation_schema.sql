-- M03 Technical / Domain / Professional Simulation Intelligence Framework Schema
-- Cloudflare D1 SQLite Schema Migration

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

