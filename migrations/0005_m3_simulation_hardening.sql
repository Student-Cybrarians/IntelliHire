-- Migration: 0005_m3_simulation_hardening.sql
-- Description: Harden M03 universal simulation schema: support arbitrary occupations, dynamic metadata, seniority levels, universal work-surface modalities, evaluation provenance and tenant indexes.

PRAGMA foreign_keys = OFF;

-- Step 1: Upgrade simulation_definition to support arbitrary domains, occupations, seniority, and metadata
CREATE TABLE IF NOT EXISTS simulation_definition_v2 (
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

INSERT OR IGNORE INTO simulation_definition_v2 (
  id, organization_id, title, occupation_code, target_role, domain, simulation_type,
  competency_name, skill_name, difficulty_level, scenario_json, dynamic_injection_json,
  expected_output_schema_json, rubric_json, is_active, created_at
)
SELECT 
  id, organization_id, title, occupation_code, target_role, domain, simulation_type,
  competency_name, skill_name, difficulty_level, scenario_json, dynamic_injection_json,
  expected_output_schema_json, rubric_json, is_active, created_at
FROM simulation_definition;

DROP TABLE IF EXISTS simulation_definition;
ALTER TABLE simulation_definition_v2 RENAME TO simulation_definition;

PRAGMA foreign_keys = ON;

-- Step 2: Ensure simulation_evaluation has full evidence provenance and verification columns
ALTER TABLE simulation_evaluation ADD COLUMN uncertainty_score REAL NOT NULL DEFAULT 0.15;
ALTER TABLE simulation_evaluation ADD COLUMN observed_facts_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE simulation_evaluation ADD COLUMN provenance_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE simulation_evaluation ADD COLUMN submission_hash TEXT;
ALTER TABLE simulation_evaluation ADD COLUMN submission_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE simulation_evaluation ADD COLUMN alternative_validity TEXT DEFAULT 'correct';
ALTER TABLE simulation_evaluation ADD COLUMN deterministic_verification_json TEXT DEFAULT '{}';
ALTER TABLE simulation_evaluation ADD COLUMN teaching_payload_json TEXT DEFAULT '{}';
ALTER TABLE simulation_evaluation ADD COLUMN adaptation_decision_json TEXT DEFAULT '{}';

-- Step 3: Performance and tenant-isolation indexes
CREATE INDEX IF NOT EXISTS idx_sim_def_domain ON simulation_definition(domain, simulation_type);
CREATE INDEX IF NOT EXISTS idx_sim_def_org_active ON simulation_definition(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sim_sess_user ON simulation_session(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sim_sess_org ON simulation_session(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_sim_eval_session ON simulation_evaluation(session_id);
CREATE INDEX IF NOT EXISTS idx_sim_eval_user ON simulation_evaluation(user_id, definition_id);
