-- Migration: 0004_m1_jd_matching_tables.sql
-- Description: Create job_description_context, match_analysis, async_job, and evidence_item tables for M1 matching engine.

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

-- Indices
CREATE INDEX IF NOT EXISTS idx_jd_context_user ON job_description_context(user_id);
CREATE INDEX IF NOT EXISTS idx_match_analysis_lookup ON match_analysis(resume_id, jd_id);
CREATE INDEX IF NOT EXISTS idx_async_job_status ON async_job(status);
CREATE INDEX IF NOT EXISTS idx_evidence_item_user ON evidence_item(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_item_ctx ON evidence_item(candidate_context_id);
