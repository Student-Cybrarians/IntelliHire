-- M05 Candidate Readiness + Evidence Synthesis + Human Decision Support + Governance Schema
-- Cloudflare D1 SQLite Schema Migration

CREATE TABLE IF NOT EXISTS readiness_evidence_ledger (
  id TEXT PRIMARY KEY,
  candidate_user_id TEXT NOT NULL REFERENCES user_account(id),
  organization_id TEXT NOT NULL,
  requisition_id TEXT,
  source_module TEXT NOT NULL CHECK (source_module IN ('m01_resume', 'm02_assessment', 'm02_prep', 'm03_simulation', 'm04_interview', 'human_review')),
  source_record_id TEXT NOT NULL,
  competency_name TEXT NOT NULL,
  skill_name TEXT,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('claim', 'assessment_score', 'misconception', 'work_artifact', 'telemetry', 'rubric_observation', 'interviewer_rating', 'contradiction', 'human_note')),
  observed_fact TEXT NOT NULL,
  model_interpretation TEXT,
  confidence_score REAL NOT NULL DEFAULT 0.85,
  uncertainty_score REAL NOT NULL DEFAULT 0.15,
  provenance_json TEXT NOT NULL DEFAULT '{}',
  human_review_status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (human_review_status IN ('unreviewed', 'verified', 'disputed', 'overridden')),
  reviewed_by_user_id TEXT REFERENCES user_account(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS readiness_profile (
  id TEXT PRIMARY KEY,
  candidate_user_id TEXT NOT NULL REFERENCES user_account(id),
  organization_id TEXT NOT NULL,
  target_role TEXT NOT NULL,
  occupation_code TEXT,
  domain TEXT NOT NULL,
  seniority_level TEXT NOT NULL DEFAULT 'mid',
  overall_readiness_index REAL NOT NULL,
  readiness_composition_json TEXT NOT NULL,
  uncertainty_index REAL NOT NULL,
  evidence_triangulation_json TEXT NOT NULL DEFAULT '{}',
  strengths_json TEXT NOT NULL DEFAULT '[]',
  gaps_json TEXT NOT NULL DEFAULT '[]',
  actionable_remediation_json TEXT NOT NULL DEFAULT '[]',
  last_synthesized_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS decision_review_record (
  id TEXT PRIMARY KEY,
  candidate_user_id TEXT NOT NULL REFERENCES user_account(id),
  organization_id TEXT NOT NULL,
  requisition_id TEXT,
  reviewer_user_id TEXT NOT NULL REFERENCES user_account(id),
  decision_stage TEXT NOT NULL DEFAULT 'committee_review' CHECK (decision_stage IN ('screening', 'technical_review', 'panel_calibration', 'committee_review', 'final_decision')),
  human_decision_status TEXT NOT NULL DEFAULT 'pending' CHECK (human_decision_status IN ('pending', 'endorse_hire', 'request_more_evidence', 'reassign_role', 'decline', 'escalate_committee')),
  decision_rationale TEXT,
  competency_ratings_json TEXT NOT NULL DEFAULT '{}',
  reviewer_disagreement_flag INTEGER NOT NULL DEFAULT 0,
  reviewer_disagreement_notes TEXT,
  adverse_impact_acknowledged INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS governance_audit_event (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  target_candidate_id TEXT,
  payload_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ledger_cand ON readiness_evidence_ledger(candidate_user_id, source_module);
CREATE INDEX IF NOT EXISTS idx_ledger_comp ON readiness_evidence_ledger(competency_name);
CREATE INDEX IF NOT EXISTS idx_readiness_user ON readiness_profile(candidate_user_id);
CREATE INDEX IF NOT EXISTS idx_decision_cand ON decision_review_record(candidate_user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_gov_audit_org ON governance_audit_event(organization_id, event_type);
