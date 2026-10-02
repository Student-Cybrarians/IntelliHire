-- Migration: 0002_evidence_strategy.sql
-- Description: Implement EvidenceStrategy entity and indices for Phase 2 Universal Evidence Engine

CREATE TABLE IF NOT EXISTS evidence_strategy (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organization(id),
    competency_id TEXT REFERENCES competency(id),
    skill_id TEXT REFERENCES skill(id),
    occupation_code TEXT,
    target_role TEXT,
    jd_requirement_id TEXT,
    seniority_level TEXT NOT NULL DEFAULT 'mid' CHECK (seniority_level IN ('foundation', 'junior', 'mid', 'senior', 'lead', 'manager', 'executive')),
    assessment_purpose TEXT NOT NULL DEFAULT 'readiness' CHECK (assessment_purpose IN ('diagnostic', 'practice', 'training', 'certification', 'readiness', 'recruitment', 'gap_validation', 'interview_prep')),
    required_evidence TEXT NOT NULL,
    allowed_modalities_json TEXT NOT NULL DEFAULT '["knowledge_inquiry"]',
    preferred_modality TEXT NOT NULL DEFAULT 'knowledge_inquiry',
    alternative_modalities_json TEXT DEFAULT '[]',
    evaluation_method TEXT NOT NULL DEFAULT 'rubric' CHECK (evaluation_method IN ('objective', 'rubric', 'ai', 'human', 'hybrid')),
    rubric_id TEXT REFERENCES assessment_rubric(id),
    minimum_evidence_items INTEGER NOT NULL DEFAULT 3,
    stopping_rule_json TEXT NOT NULL DEFAULT '{"max_items": 10, "min_uncertainty": 0.20}',
    accessibility_accommodations_json TEXT DEFAULT '[]',
    language_code TEXT NOT NULL DEFAULT 'en',
    fairness_constraints_json TEXT DEFAULT '{}',
    confidence_threshold REAL NOT NULL DEFAULT 0.70,
    provenance_json TEXT DEFAULT '{}',
    version INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evidence_strategy_lookup ON evidence_strategy (organization_id, competency_id, skill_id, is_active);
CREATE INDEX IF NOT EXISTS idx_evidence_strategy_role ON evidence_strategy (target_role, seniority_level);
