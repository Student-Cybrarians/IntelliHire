-- migrations/0008_m2_reassessment_and_revision.sql
-- M02 Phase 2: Dedicated Audit & History Tracking for Server-Validated Module Reassessment Attempts

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

CREATE INDEX IF NOT EXISTS idx_reassess_module ON curriculum_reassessment_attempt(module_id);
CREATE INDEX IF NOT EXISTS idx_reassess_user ON curriculum_reassessment_attempt(user_id);
