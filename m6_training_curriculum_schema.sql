-- Priority 18: Training Curriculum & Learning Pathway Engine Schema
-- Cloudflare D1 SQLite Schema Migration

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

CREATE INDEX IF NOT EXISTS idx_pathway_user ON learning_pathway(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pathway_org ON learning_pathway(organization_id, pathway_type);
CREATE INDEX IF NOT EXISTS idx_curr_module_pathway ON curriculum_module(pathway_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_learn_unit_module ON learning_unit(module_id, unit_order);
CREATE INDEX IF NOT EXISTS idx_progress_user ON learning_progress_record(user_id, action_type);
