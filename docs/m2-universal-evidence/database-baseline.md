# IntelliHire M2 Universal Evidence Engine — Database Baseline

**Date:** 2026-10-02  
**Role:** Database / Data Architect + Solution Architect  
**Target Database:** Cloudflare D1 `intellihire-db` (`63fdd68c-ff53-4aea-8327-2336b5e77587`)  
**Production Status:** 32 Live Tables  

---

## 1. Core Schema Inventory

### 1.1 Organization & User Identity
- **`organization`**: Multi-tenant boundary root.
  - Columns: `id TEXT PRIMARY KEY`, `name TEXT NOT NULL`, `slug TEXT NOT NULL UNIQUE`, `tier TEXT NOT NULL DEFAULT 'free'`, `created_at INTEGER NOT NULL`.
- **`user_account`**: User credentials and profile identity.
  - Columns: `id TEXT PRIMARY KEY`, `organization_id TEXT NOT NULL REFERENCES organization(id)`, `email TEXT NOT NULL UNIQUE`, `full_name TEXT NOT NULL`, `avatar_url TEXT`, `role TEXT NOT NULL DEFAULT 'candidate'`, `onboarding_completed INTEGER NOT NULL DEFAULT 0`, `created_at INTEGER NOT NULL`, `last_login_at INTEGER`.
- **`tenant_quota`**: Rate limiting and usage tracking per organization.
  - Columns: `organization_id TEXT PRIMARY KEY REFERENCES organization(id)`, `daily_ai_call_limit INTEGER`, `daily_ai_calls_used INTEGER`, `storage_bytes_used INTEGER`, `last_reset_timestamp INTEGER`.
- **`audit_log`**: Platform-wide audit logs.

---

### 1.2 M1 Ingestion & Candidate Context
- **`candidate_resume`**: Versioned metadata for uploaded resumes (raw file in `RESUME_KV`).
  - Columns: `id TEXT PRIMARY KEY`, `organization_id TEXT NOT NULL REFERENCES organization(id)`, `user_id TEXT NOT NULL REFERENCES user_account(id)`, `version INTEGER NOT NULL DEFAULT 1`, `filename TEXT NOT NULL`, `file_format TEXT NOT NULL`, `file_size_bytes INTEGER NOT NULL`, `content_hash_sha256 TEXT NOT NULL`, `storage_ref TEXT NOT NULL`, `is_active INTEGER NOT NULL DEFAULT 1`, `created_at INTEGER NOT NULL`.
  - Constraints: `UNIQUE(user_id, version)`.
- **`candidate_context`**: Extracted textual context and parsed structured sections.
  - Columns: `id TEXT PRIMARY KEY`, `resume_id TEXT NOT NULL REFERENCES candidate_resume(id)`, `user_id TEXT NOT NULL REFERENCES user_account(id)`, `raw_text TEXT NOT NULL`, `extraction_method TEXT NOT NULL`, `extraction_status TEXT NOT NULL`, `context_data_json TEXT NOT NULL DEFAULT '{}'`, `created_at INTEGER NOT NULL`.
  - JSON Fields: `context_data_json` (sections, parsed contact, extracted facts, provenance).
- **`candidate_claim`**: Extracted granular claims with character offsets.
  - Columns: `id TEXT PRIMARY KEY`, `context_id TEXT NOT NULL REFERENCES candidate_context(id)`, `claim_type TEXT NOT NULL`, `claim_value TEXT NOT NULL`, `normalized_value TEXT`, `confidence_score REAL NOT NULL`, `verification_state TEXT NOT NULL`, `provenance_start_index INTEGER`, `provenance_end_index INTEGER`, `created_at INTEGER NOT NULL`.
- **`candidate_profile`**: Candidate career preferences and embedding representations.
  - Columns: `id TEXT PRIMARY KEY`, `organization_id TEXT NOT NULL REFERENCES organization(id)`, `user_id TEXT NOT NULL UNIQUE REFERENCES user_account(id)`, `headline TEXT`, `target_role TEXT`, `experience_level TEXT`, `primary_domain TEXT`, `skills_json TEXT DEFAULT '[]'`, `bio TEXT`, `readiness_score REAL DEFAULT 0.0`, `embedding_json TEXT`, `target_domain_id TEXT REFERENCES taxonomy_domain(id)`, `target_occupation_id TEXT REFERENCES taxonomy_occupation(id)`, `created_at INTEGER NOT NULL`, `updated_at INTEGER NOT NULL`.
  - JSON Fields: `skills_json`, `embedding_json` (768-dim vector from `@cf/baai/bge-base-en-v1.5`).
- **`job_description_context`**: Target job descriptions and requirements.
  - Columns: `id TEXT PRIMARY KEY`, `user_id TEXT NOT NULL REFERENCES user_account(id)`, `raw_text TEXT NOT NULL`, `requirements_json TEXT NOT NULL DEFAULT '[]'`, `created_at INTEGER NOT NULL`.
- **`match_analysis`**: JD-to-resume matching results.
  - Columns: `id TEXT PRIMARY KEY`, `user_id TEXT NOT NULL`, `resume_id TEXT NOT NULL`, `jd_id TEXT NOT NULL`, `match_report_json TEXT NOT NULL`, `created_at INTEGER NOT NULL`.

---

### 1.3 Competency & Skill Taxonomy
- **`taxonomy_domain`**: Standard occupational domain (e.g. Technology, Healthcare, Finance).
  - Columns: `id TEXT PRIMARY KEY`, `name TEXT NOT NULL`, `code TEXT UNIQUE NOT NULL`.
- **`taxonomy_occupation`**: Standard occupation within domain.
  - Columns: `id TEXT PRIMARY KEY`, `domain_id TEXT NOT NULL REFERENCES taxonomy_domain(id)`, `name TEXT NOT NULL`, `code TEXT UNIQUE NOT NULL`.
- **`competency`**: Organizational or occupational competency umbrella.
  - Columns: `id TEXT PRIMARY KEY`, `organization_id TEXT NOT NULL REFERENCES organization(id)`, `name TEXT NOT NULL`, `description TEXT`, `created_at DATETIME`.
- **`skill`**: Granular verifiable capability.
  - Columns: `id TEXT PRIMARY KEY`, `competency_id TEXT NOT NULL REFERENCES competency(id)`, `name TEXT NOT NULL`, `description TEXT`, `created_at DATETIME`.

---

### 1.4 M2 Assessment Foundation Entities
- **`assessment_purpose`**: Context and purpose for conducting an assessment.
  - Columns: `id TEXT PRIMARY KEY`, `name TEXT NOT NULL`, `description TEXT`, `created_at DATETIME`.
  - Standard Purposive Values: `diagnostic`, `readiness`, `recruitment`, `gap_validation`, `practice`.
- **`assessment_blueprint`**: Configuration blueprint mapping roles and goals to stages and rules.
  - Columns: `id TEXT PRIMARY KEY`, `organization_id TEXT NOT NULL REFERENCES organization(id)`, `target_role TEXT`, `purpose_id TEXT REFERENCES assessment_purpose(id)`, `configuration_json TEXT NOT NULL`, `version INTEGER NOT NULL DEFAULT 1`, `is_active BOOLEAN DEFAULT 1`, `created_at DATETIME`.
  - JSON Fields: `configuration_json` (modalities, time limits, stopping thresholds, stage flow).
- **`assessment_stage`**: Ordered stages within a blueprint.
  - Columns: `id TEXT PRIMARY KEY`, `blueprint_id TEXT NOT NULL REFERENCES assessment_blueprint(id)`, `name TEXT NOT NULL`, `stage_order INTEGER NOT NULL`, `stage_type TEXT NOT NULL DEFAULT 'core'`, `configuration_json TEXT`, `created_at DATETIME`.
- **`assessment_rubric`**: Versioned rubric defining performance criteria and scoring thresholds.
  - Columns: `id TEXT PRIMARY KEY`, `skill_id TEXT NOT NULL REFERENCES skill(id)`, `version INTEGER NOT NULL DEFAULT 1`, `criteria_json TEXT NOT NULL`, `created_at DATETIME`.
  - JSON Fields: `criteria_json` (levels, weights, evidence requirements, evaluator guidelines).
- **`assessment_item_v2`**: Versioned, multi-modal assessment tasks/questions.
  - Columns: `id TEXT PRIMARY KEY`, `skill_id TEXT NOT NULL REFERENCES skill(id)`, `rubric_id TEXT REFERENCES assessment_rubric(id)`, `version INTEGER NOT NULL DEFAULT 1`, `item_type TEXT NOT NULL`, `content_json TEXT NOT NULL`, `expected_answer_json TEXT`, `difficulty_level INTEGER`, `calibration_data_json TEXT`, `rationale TEXT`, `validation_status TEXT NOT NULL DEFAULT 'draft'`, `created_at DATETIME`.
  - Constraints: `validation_status IN ('draft', 'ai_validated', 'human_reviewed', 'published', 'retired')`.
  - JSON Fields: `content_json` (task prompt, options, resources, constraints), `expected_answer_json`, `calibration_data_json` (exposure counts, difficulty parameter, discrimination parameter).
- **`assessment_attempt`**: Candidate assessment session.
  - Columns: `id TEXT PRIMARY KEY`, `user_id TEXT NOT NULL REFERENCES user_account(id)`, `blueprint_id TEXT NOT NULL REFERENCES assessment_blueprint(id)`, `status TEXT NOT NULL DEFAULT 'initialized'`, `started_at DATETIME`, `completed_at DATETIME`, `current_stage TEXT`, `adaptive_state_json TEXT`, `created_at DATETIME`.
  - Constraints: `status IN ('initialized', 'in_progress', 'paused', 'completed', 'terminated')`.
  - JSON Fields: `adaptive_state_json` (running uncertainty estimates, skill coverage, item history, selection rationale).
- **`assessment_response_v2`**: Candidate submission per item.
  - Columns: `id TEXT PRIMARY KEY`, `attempt_id TEXT NOT NULL REFERENCES assessment_attempt(id)`, `item_id TEXT NOT NULL REFERENCES assessment_item_v2(id)`, `response_data_json TEXT NOT NULL`, `time_taken_seconds INTEGER`, `created_at DATETIME`.
  - JSON Fields: `response_data_json` (selected options, code text, free response, uploaded artifact reference).
- **`assessment_evaluation`**: Evaluator assessment record.
  - Columns: `id TEXT PRIMARY KEY`, `response_id TEXT NOT NULL REFERENCES assessment_response_v2(id)`, `evaluator_type TEXT NOT NULL CHECK (evaluator_type IN ('ai', 'human', 'objective', 'hybrid'))`, `evaluator_metadata_json TEXT`, `score_raw REAL`, `evaluation_json TEXT NOT NULL`, `confidence_score REAL`, `created_at DATETIME`.
  - JSON Fields: `evaluator_metadata_json` (model, temperature, prompt version, human evaluator ID), `evaluation_json` (criteria scores, justification, strengths, weaknesses).

---

### 1.5 Proficiency, Gaps, Evidence & Downstream Contracts
- **`candidate_skill_proficiency_v2`**: Rigorous proficiency and uncertainty model.
  - Columns: `id TEXT PRIMARY KEY`, `user_id TEXT NOT NULL REFERENCES user_account(id)`, `skill_id TEXT NOT NULL REFERENCES skill(id)`, `proficiency_estimate REAL NOT NULL`, `uncertainty_estimate REAL NOT NULL`, `evidence_status TEXT NOT NULL CHECK (evidence_status IN ('assessed', 'inferred', 'missing', 'unassessed', 'outdated'))`, `latest_attempt_id TEXT REFERENCES assessment_attempt(id)`, `last_updated_at DATETIME`.
  - Constraints: `UNIQUE(user_id, skill_id)`.
- **`candidate_gap`**: Evidence-grounded gaps and actionable recommendations.
  - Columns: `id TEXT PRIMARY KEY`, `user_id TEXT NOT NULL REFERENCES user_account(id)`, `skill_id TEXT NOT NULL REFERENCES skill(id)`, `gap_type TEXT NOT NULL`, `severity TEXT NOT NULL DEFAULT 'unassessed'`, `evidence_json TEXT`, `recommendation TEXT`, `created_at DATETIME`.
  - Constraints: `UNIQUE(user_id, skill_id)`.
- **`evidence_package`**: Comprehensive bundle consumed downstream by M3/M4/M5.
  - Columns: `id TEXT PRIMARY KEY`, `user_id TEXT NOT NULL REFERENCES user_account(id)`, `organization_id TEXT NOT NULL`, `attempt_id TEXT REFERENCES assessment_attempt(id)`, `package_version INTEGER NOT NULL DEFAULT 1`, `package_json TEXT NOT NULL`, `created_at DATETIME`.
  - JSON Fields: `package_json` (complete provenance, skill evaluations, gap matrix, limitations, evaluator audit).
- **`m2_audit_event`**: Granular immutable operational audit log.
  - Columns: `id TEXT PRIMARY KEY`, `organization_id TEXT NOT NULL`, `user_id TEXT NOT NULL`, `event_type TEXT NOT NULL`, `entity_type TEXT NOT NULL`, `entity_id TEXT NOT NULL`, `details_json TEXT`, `created_at DATETIME`.

---

### 1.6 Legacy M1 Assessment Tables (Maintained for Backward Compatibility)
- `assessment_item`
- `assessment_session`
- `candidate_response`
- `candidate_proficiency`

---

## 2. Relationships & Referential Integrity Graph

```
organization
  └── user_account
        ├── candidate_profile
        ├── candidate_resume
        │     └── candidate_context
        │           └── candidate_claim
        ├── assessment_attempt
        │     ├── assessment_response_v2
        │     │     └── assessment_evaluation
        │     └── candidate_skill_proficiency_v2
        ├── candidate_gap
        └── evidence_package

organization
  ├── competency
  │     └── skill
  │           ├── assessment_rubric
  │           └── assessment_item_v2
  └── assessment_blueprint
        ├── assessment_stage
        └── assessment_attempt
```

---

## 3. Database Indexing Analysis & Recommendations for Phase 2+

Currently, SQLite in production only contains auto-created indices for `PRIMARY KEY` and `UNIQUE` constraints.  
For Phase 2+ scaling and latency reduction, explicit indices should be created for:
1. `assessment_attempt(user_id, status)`
2. `assessment_item_v2(skill_id, validation_status)`
3. `assessment_response_v2(attempt_id, item_id)`
4. `candidate_skill_proficiency_v2(user_id, skill_id)`
5. `m2_audit_event(organization_id, event_type, created_at)`
6. `evidence_package(organization_id, user_id)`

These index additions will be executed in Phase 2 schema migrations to maintain non-destructive operations.
