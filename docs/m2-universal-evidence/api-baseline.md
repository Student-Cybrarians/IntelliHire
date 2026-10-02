# IntelliHire M2 Universal Evidence Engine — API Baseline

**Date:** 2026-10-02  
**Role:** Backend / API Architect + Security Lead  
**Scope:** Complete inventory of M2 endpoints and backward-compatible assessment routes  

---

## 1. M2 Modern Endpoint Inventory (`/api/m2/*`)

### 1.1 Blueprints & Purposes
1. **`POST /api/m2/blueprints`**
   - **Auth:** Session cookie required via `getSessionUser(c)` (401 if missing).
   - **Tenant Check:** `organization_id` looked up from `user_account` for session user.
   - **Request Schema:** `{ target_role: string, purpose_id?: string, configuration: object }`
   - **Response Schema:** `{ success: true, blueprint_id: string }`
   - **Database Access:** `INSERT INTO assessment_blueprint (id, organization_id, target_role, purpose_id, configuration_json)`
   - **Frontend Consumer:** Admin / Recruiter blueprint creator; `AssessmentV2.tsx` auto-blueprint generator.
   - **Status:** Active.

2. **`GET /api/m2/blueprints`**
   - **Auth:** Session required.
   - **Tenant Check:** `WHERE organization_id = ? AND is_active = 1`.
   - **Request Schema:** None (query parameters optional).
   - **Response Schema:** `{ success: true, blueprints: AssessmentBlueprint[] }`
   - **Database Access:** `SELECT * FROM assessment_blueprint WHERE organization_id = ? AND is_active = 1`
   - **Frontend Consumer:** `AssessmentV2.tsx` (`loadBlueprints()`).
   - **Status:** Active.

3. **`GET /api/m2/blueprints/:id`**
   - **Auth:** Session required.
   - **Tenant Check:** `WHERE id = ? AND organization_id = ?`.
   - **Request Schema:** Path param `:id`.
   - **Response Schema:** `{ blueprint: object, stages: object[] }`
   - **Database Access:** `SELECT * FROM assessment_blueprint`, `SELECT * FROM assessment_stage WHERE blueprint_id = ? ORDER BY stage_order`
   - **Frontend Consumer:** Assessment orchestrator.
   - **Status:** Active.

4. **`POST /api/m2/purposes`**
   - **Auth:** Session required.
   - **Tenant Check:** Implicitly authorized user.
   - **Request Schema:** `{ name: string, description: string }`
   - **Response Schema:** `{ success: true, purpose_id: string }`
   - **Database Access:** `INSERT INTO assessment_purpose`
   - **Frontend Consumer:** Setup & configuration.
   - **Status:** Active.

5. **`GET /api/m2/purposes`**
   - **Auth:** Session required.
   - **Response Schema:** `{ purposes: object[] }`
   - **Database Access:** `SELECT * FROM assessment_purpose`
   - **Frontend Consumer:** Blueprint builder.
   - **Status:** Active.

---

### 1.2 Rubrics & Items
6. **`POST /api/m2/rubrics`**
   - **Auth:** Session required; verified organization membership.
   - **Request Schema:** `{ skill_id: string, criteria: object }`
   - **Response Schema:** `{ success: true, rubric_id: string }`
   - **Database Access:** `INSERT INTO assessment_rubric (id, skill_id, criteria_json)`
   - **Frontend Consumer:** Recruiter / Assessment Admin.
   - **Status:** Active.

7. **`GET /api/m2/rubrics/:skill_id`**
   - **Auth:** Session required.
   - **Response Schema:** `{ rubric: object }`
   - **Database Access:** `SELECT * FROM assessment_rubric WHERE skill_id = ? ORDER BY version DESC LIMIT 1`
   - **Frontend Consumer:** Evaluator service.
   - **Status:** Active.

8. **`POST /api/m2/items`**
   - **Auth:** Session required; verified organization membership.
   - **Request Schema:** `{ skill_id: string, rubric_id?: string, item_type: string, content: object, expected_answer?: object, difficulty?: number, rationale?: string }`
   - **Response Schema:** `{ success: true, item_id: string }`
   - **Database Access:** `INSERT INTO assessment_item_v2`
   - **Frontend Consumer:** SME question editor / item bank.
   - **Status:** Active.

9. **`GET /api/m2/items`**
   - **Auth:** Session required.
   - **Query Params:** `?skill_id=&status=`
   - **Response Schema:** `{ items: object[] }`
   - **Database Access:** `SELECT * FROM assessment_item_v2 WHERE skill_id = ? [AND validation_status = ?]`
   - **Frontend Consumer:** Item bank viewer / reviewer queue.
   - **Status:** Active.

10. **`PATCH /api/m2/items/:id/status`**
    - **Auth:** Session required.
    - **Request Schema:** `{ status: 'draft' | 'ai_validated' | 'human_reviewed' | 'published' | 'retired' }`
    - **Response Schema:** `{ success: true }`
    - **Database Access:** `UPDATE assessment_item_v2 SET validation_status = ? WHERE id = ?`
    - **Frontend Consumer:** SME review workflow.
    - **Status:** Active.

11. **`POST /api/m2/items/generate`**
    - **Auth:** Session required.
    - **Request Schema:** `{ skill_id: string, difficulty?: number, item_type?: string, role_context?: string }`
    - **External AI Provider:** NVIDIA NIM `meta/muse-glimmer-30b`.
    - **Validation:** JSON format verification, option presence check, sets `validation_status = 'ai_validated'`.
    - **Response Schema:** `{ success: true, item_id: string, item: object }`
    - **Database Access:** `INSERT INTO assessment_item_v2`
    - **Frontend Consumer:** Item generator.
    - **Status:** Active.

---

### 1.3 Assessment Attempts & Adaptive Engine
12. **`POST /api/m2/attempts`**
    - **Auth:** Session required.
    - **Request Schema:** `{ blueprint_id?: string }`
    - **Behavior:** Links or auto-creates a blueprint for user's target role, initializes `adaptive_state_json` with empty used items and prior uncertainty.
    - **Response Schema:** `{ success: true, attempt_id: string }`
    - **Database Access:** `INSERT INTO assessment_attempt`
    - **Frontend Consumer:** `AssessmentV2.tsx` (`startAttempt()`).
    - **Status:** Active.

13. **`GET /api/m2/attempts/:id`**
    - **Auth:** Session required (must own the attempt: `WHERE id = ? AND user_id = ?`).
    - **Response Schema:** `{ attempt: object }`
    - **Database Access:** `SELECT * FROM assessment_attempt WHERE id = ? AND user_id = ?`
    - **Frontend Consumer:** `AssessmentV2.tsx`.
    - **Status:** Active.

14. **`GET /api/m2/attempts/:id/next`** (Adaptive Selection Engine)
    - **Auth:** Session required (must own attempt).
    - **Adaptive Algorithm:**
      - Inspects `adaptive_state_json` for uncertainty across target skills.
      - Finds skill with highest uncertainty or unassessed status.
      - Queries `assessment_item_v2` for published/ai_validated items targeting that skill not yet in `usedItems`.
      - Updates `adaptive_state_json` with selected item ID, incremented count, and selection reason.
      - If no items remain or uncertainty threshold is reached, automatically marks attempt completed and returns `{ completed: true }`.
    - **Response Schema:** `{ item: object, completed: false }` OR `{ completed: true }`
    - **Frontend Consumer:** `AssessmentV2.tsx` (`fetchNextItem()`).
    - **Status:** Active.

15. **`POST /api/m2/attempts/:id/respond`**
    - **Auth:** Session required.
    - **Request Schema:** `{ item_id: string, response_data: object, time_taken_seconds?: number }`
    - **Behavior:**
      - Records candidate response in `assessment_response_v2`.
      - Evaluates response (deterministic check for objective items, LLM rubric check for subjective).
      - Stores evaluation record in `assessment_evaluation`.
      - Updates Bayesian proficiency estimate & uncertainty in `candidate_skill_proficiency_v2`.
    - **Response Schema:** `{ success: true, evaluation: object }`
    - **Frontend Consumer:** `AssessmentV2.tsx` (`submitResponse()`).
    - **Status:** Active.

16. **`POST /api/m2/attempts/:id/complete`**
    - **Auth:** Session required (must own attempt).
    - **Behavior:** Sets status to `completed`, completed_at timestamp, auto-detects skill gaps (< 50% proficiency), and populates `candidate_gap`.
    - **Response Schema:** `{ success: true }`
    - **Frontend Consumer:** `AssessmentV2.tsx` (`completeAttempt()`).
    - **Status:** Active.

---

### 1.4 Proficiency, Gaps, Evidence & Role Mapping
17. **`GET /api/m2/proficiency`**
    - **Auth:** Session required.
    - **Response Schema:** `{ proficiency: CandidateSkillProficiencyV2[] }`
    - **Database Access:** `SELECT * FROM candidate_skill_proficiency_v2 WHERE user_id = ?`
    - **Frontend Consumer:** `AssessmentV2.tsx`.
    - **Status:** Active.

18. **`GET /api/m2/gaps`**
    - **Auth:** Session required.
    - **Response Schema:** `{ gaps: CandidateGap[] }`
    - **Database Access:** `SELECT * FROM candidate_gap WHERE user_id = ?`
    - **Frontend Consumer:** `AssessmentV2.tsx`.
    - **Status:** Active.

19. **`GET /api/m2/evidence-package`**
    - **Auth:** Session required.
    - **Behavior:** Assembles complete structured evidence bundle (user, attempts, proficiency estimates with uncertainties, gaps, audit trace), persists to `evidence_package` table.
    - **Response Schema:** `{ success: true, package: object }`
    - **Database Access:** Reads `user_account`, `assessment_attempt`, `candidate_skill_proficiency_v2`, `candidate_gap`; inserts into `evidence_package`.
    - **Frontend Consumer:** M3/M4/M5 downstream integration; Recruiter candidate view.
    - **Status:** Active.

20. **`POST /api/m2/role-mapping`**
    - **Auth:** Session required.
    - **Request Schema:** `{ role_title: string, job_description?: string }`
    - **External AI:** NVIDIA NIM `meta/muse-glimmer-30b` extracts competencies and subskills.
    - **Response Schema:** `{ success: true, competencies: object[] }`
    - **Status:** Active.

21. **`GET /api/m2/role-mapping/:role`**
    - **Status:** Stub (`{ status: 'Not implemented' }`). Candidate for Phase 2 implementation.

---

## 2. Legacy Backward-Compatible Endpoints (Must NOT Break)

| Method | Path | Target Entity | Status |
|---|---|---|---|
| `POST` | `/api/assessment/generate` | `assessment_item` | Maintained for legacy tests |
| `POST` | `/api/assessment/start` | `assessment_session` | Maintained for legacy tests & `/assessment/:skill_id` |
| `GET` | `/api/assessment/sessions/:id/next` | `assessment_item` | Maintained for `/assessment/:skill_id` |
| `POST` | `/api/assessment/sessions/:id/submit` | `candidate_response`, `candidate_proficiency` | Maintained for `/assessment/:skill_id` |
| `GET` | `/api/candidates/:id/proficiency` | `candidate_proficiency` | Maintained for M1 candidate review |

---

## 3. Backward Compatibility Mandate

1. The legacy routes above must continue to respond correctly to avoid breaking legacy tests (`functions/api/assessment.test.ts`, `functions/api/competency.test.ts`).
2. M2 modern routes (`/api/m2/*`) supersede legacy endpoints for all new assessment sessions while maintaining co-existence in database and routing layers.
