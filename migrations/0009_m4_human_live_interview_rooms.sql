-- Migration 0009: M04 Human Live Interview Rooms, Scheduling, Signaling & Evaluation

CREATE TABLE IF NOT EXISTS human_interview_invitation (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  candidate_user_id TEXT NOT NULL REFERENCES user_account(id),
  interviewer_user_id TEXT NOT NULL REFERENCES user_account(id),
  target_role TEXT NOT NULL,
  job_description TEXT,
  resume_id TEXT,
  interview_type TEXT NOT NULL DEFAULT 'technical_and_behavioral',
  scheduled_start_time TEXT NOT NULL,
  scheduled_end_time TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('draft', 'invited', 'accepted', 'declined', 'rescheduled', 'scheduled', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show')),
  candidate_token TEXT NOT NULL UNIQUE,
  interviewer_token TEXT NOT NULL UNIQUE,
  candidate_response_notes TEXT,
  cancellation_reason TEXT,
  created_by_user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS human_interview_room (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL REFERENCES human_interview_invitation(id),
  organization_id TEXT NOT NULL,
  room_status TEXT NOT NULL DEFAULT 'waiting' CHECK (room_status IN ('waiting', 'in_progress', 'completed', 'closed')),
  candidate_joined_at DATETIME,
  interviewer_joined_at DATETIME,
  candidate_recording_consent INTEGER NOT NULL DEFAULT 0,
  interviewer_recording_consent INTEGER NOT NULL DEFAULT 0,
  recording_enabled INTEGER NOT NULL DEFAULT 0,
  workspace_state_json TEXT NOT NULL DEFAULT '{}',
  started_at DATETIME,
  ended_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS human_interview_signal (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES human_interview_room(id),
  sender_user_id TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  signal_payload_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS human_interview_evaluation (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES human_interview_room(id),
  invitation_id TEXT NOT NULL REFERENCES human_interview_invitation(id),
  interviewer_user_id TEXT NOT NULL,
  candidate_user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  overall_recommendation TEXT NOT NULL CHECK (overall_recommendation IN ('strong_hire', 'hire', 'further_review', 'no_hire', 'hold')),
  competency_scores_json TEXT NOT NULL DEFAULT '{}',
  interviewer_notes TEXT NOT NULL,
  private_observations_json TEXT NOT NULL DEFAULT '[]',
  m05_evidence_package_json TEXT NOT NULL DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hi_inv_org ON human_interview_invitation(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_hi_inv_cand ON human_interview_invitation(candidate_user_id, status);
CREATE INDEX IF NOT EXISTS idx_hi_inv_intv ON human_interview_invitation(interviewer_user_id, status);
CREATE INDEX IF NOT EXISTS idx_hi_room_inv ON human_interview_room(invitation_id);
CREATE INDEX IF NOT EXISTS idx_hi_sig_room ON human_interview_signal(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_hi_eval_room ON human_interview_evaluation(room_id);
