# IntelliHire M2 Universal Evidence Engine — Existing M2 Trace & Audit

**Date:** 2026-10-02  
**Role:** Solution Architect + Lead SDLC Orchestrator  
**Audit Target:** End-to-End M1 -> M2 Pipeline Trace  
**Pipeline Contract:**  
`M1 → Candidate Context → Role/JD → Competency → Blueprint → Attempt → Item → Response → Evaluation → Proficiency → Confidence → Gap → Evidence Package`

---

## Stage-by-Stage Trace & Classification Matrix

| # | Stage | Files | Functions / Handlers | APIs | Tables | Tests | Frontend Consumers | Classification |
|---|---|---|---|---|---|---|---|---|
| **1** | **M1 Source Ingestion & Extraction** | `resume-extractor/src/index.py`<br>`functions/api/[[route]].ts` | `POST /resume/upload`<br>`POST /resume/extract/:resume_id`<br>`checkMagicBytes`<br>`redactPII` | `POST /api/resume/upload`<br>`POST /api/resume/extract/:resume_id`<br>`GET /api/resume/latest`<br>`GET /api/resume/status` | `candidate_resume`<br>`candidate_context` | `functions/api/resume.test.ts`<br>`functions/api/m1.test.ts`<br>`tests/enhancements.test.ts` | `src/client/pages/Resume.tsx`<br>`src/client/pages/dashboard/CandidateWorkspace.tsx` | **IMPLEMENTED** |
| **2** | **Candidate Context** | `functions/api/[[route]].ts` | `GET /candidate/context`<br>Context insertion & query logic | `GET /api/candidate/context` | `candidate_context`<br>`candidate_claim` | `functions/api/m1.test.ts` | `src/client/pages/Resume.tsx`<br>`src/client/pages/dashboard/CandidateWorkspace.tsx` | **IMPLEMENTED** |
| **3** | **Role & Job Description (JD)** | `functions/api/[[route]].ts`<br>`m1-async-worker/src/index.ts` | `POST /jd/analyze`<br>`POST /match/run`<br>`POST /m2/role-mapping`<br>`GET /m2/role-mapping/:role` | `POST /api/jd/analyze`<br>`POST /api/match/run`<br>`POST /api/m2/role-mapping`<br>`GET /api/m2/role-mapping/:role` | `job_description_context`<br>`job_requisition`<br>`match_analysis` | `tests/enhancements.test.ts` | `src/client/pages/Resume.tsx`<br>`src/client/pages/dashboard/CandidateWorkspace.tsx`<br>`src/client/pages/AssessmentV2.tsx` | **IMPLEMENTED** |
| **4** | **Competency & Taxonomy** | `functions/api/[[route]].ts` | `GET /competencies`<br>`POST /competencies`<br>`POST /competencies/:id/skills`<br>`GET /taxonomy/domains`<br>`GET /taxonomy/occupations` | `GET /api/competencies`<br>`POST /api/competencies`<br>`POST /api/competencies/:id/skills`<br>`GET /api/taxonomy/domains`<br>`GET /api/taxonomy/occupations` | `competency`<br>`skill`<br>`taxonomy_domain`<br>`taxonomy_occupation` | `functions/api/competency.test.ts` | `src/client/pages/Onboarding.tsx`<br>`src/client/pages/AssessmentV2.tsx` | **IMPLEMENTED** |
| **5** | **Assessment Blueprint & Purpose** | `functions/api/[[route]].ts` | `POST /m2/blueprints`<br>`GET /m2/blueprints`<br>`GET /m2/blueprints/:id`<br>`POST /m2/purposes`<br>`GET /m2/purposes` | `POST /api/m2/blueprints`<br>`GET /api/m2/blueprints`<br>`GET /api/m2/blueprints/:id`<br>`POST /api/m2/purposes`<br>`GET /api/m2/purposes` | `assessment_blueprint`<br>`assessment_purpose`<br>`assessment_stage` | *Pending dedicated M2 test suite* | `src/client/pages/AssessmentV2.tsx` (`loadBlueprints()`) | **PARTIAL** (Backend API & D1 schema complete; Recruiter blueprint authoring UI not yet built) |
| **6** | **Assessment Attempt** | `functions/api/[[route]].ts`<br>`src/client/pages/AssessmentV2.tsx` | `POST /m2/attempts`<br>`GET /m2/attempts/:id`<br>`POST /m2/attempts/:id/complete` | `POST /api/m2/attempts`<br>`GET /api/m2/attempts/:id`<br>`POST /api/m2/attempts/:id/complete` | `assessment_attempt` | *Pending dedicated M2 test suite* | `src/client/pages/AssessmentV2.tsx` (`startAttempt()`, `completeAttempt()`) | **IMPLEMENTED** |
| **7** | **Assessment Item & Adaptive Selection** | `functions/api/[[route]].ts`<br>`src/client/pages/AssessmentV2.tsx` | `POST /m2/items`<br>`GET /m2/items`<br>`PATCH /m2/items/:id/status`<br>`POST /m2/items/generate`<br>`GET /m2/attempts/:id/next` | `POST /api/m2/items`<br>`GET /api/m2/items`<br>`PATCH /api/m2/items/:id/status`<br>`POST /api/m2/items/generate`<br>`GET /api/m2/attempts/:id/next` | `assessment_item_v2` | *Pending dedicated M2 test suite* | `src/client/pages/AssessmentV2.tsx` (`fetchNextItem()`) | **IMPLEMENTED** |
| **8** | **Candidate Response** | `functions/api/[[route]].ts`<br>`src/client/pages/AssessmentV2.tsx` | `POST /m2/attempts/:id/respond` | `POST /api/m2/attempts/:id/respond` | `assessment_response_v2` | *Pending dedicated M2 test suite* | `src/client/pages/AssessmentV2.tsx` (`submitResponse()`) | **IMPLEMENTED** |
| **9** | **Evaluation & Rubric** | `functions/api/[[route]].ts`<br>`src/client/pages/AssessmentV2.tsx` | `POST /m2/evaluate`<br>`POST /m2/rubrics`<br>`GET /m2/rubrics/:skill_id`<br>In-line evaluation in respond handler | `POST /api/m2/evaluate`<br>`POST /api/m2/rubrics`<br>`GET /api/m2/rubrics/:skill_id`<br>`POST /api/m2/attempts/:id/respond` | `assessment_evaluation`<br>`assessment_rubric` | *Pending dedicated M2 test suite* | `src/client/pages/AssessmentV2.tsx` (Evaluator feedback, score, confidence display) | **IMPLEMENTED** |
| **10** | **Proficiency Estimation** | `functions/api/[[route]].ts`<br>`src/client/pages/AssessmentV2.tsx` | `GET /m2/proficiency`<br>Bayesian update in response submission | `GET /api/m2/proficiency`<br>`GET /api/candidates/:id/proficiency` | `candidate_skill_proficiency_v2`<br>`candidate_proficiency` | `functions/api/competency.test.ts` (legacy) | `src/client/pages/AssessmentV2.tsx` (Skill proficiency progress bars & score) | **IMPLEMENTED** |
| **11** | **Confidence & Uncertainty** | `functions/api/[[route]].ts`<br>`src/client/pages/AssessmentV2.tsx` | Uncertainty tracked in `adaptive_state_json` & stored in D1 | `GET /api/m2/proficiency` | `candidate_skill_proficiency_v2` (`uncertainty_estimate`) | *Pending dedicated uncertainty test suite* | `src/client/pages/AssessmentV2.tsx` (`±uncertainty%`, High/Medium/Low confidence labels) | **IMPLEMENTED** |
| **12** | **Gap Analysis** | `functions/api/[[route]].ts`<br>`src/client/pages/AssessmentV2.tsx` | `GET /m2/gaps`<br>Gap record generation on attempt completion | `GET /api/m2/gaps` | `candidate_gap` | *Pending dedicated gap test suite* | `src/client/pages/AssessmentV2.tsx` (Gap entries, severity badges, recommendations) | **IMPLEMENTED** |
| **13** | **Evidence Package** | `functions/api/[[route]].ts` | `GET /m2/evidence-package` | `GET /api/m2/evidence-package` | `evidence_package` | *Pending dedicated evidence package test suite* | *API ready; Recruiter UI evidence viewer pending* | **PARTIAL** |

---

## Detailed Analysis of Deficiencies & Upgrade Requirements

1. **Blueprint & Purpose (Stage 5):**
   - The backend routes exist, but the blueprints are statically configured or auto-generated.
   - Requirement for M2 Universal Evidence Engine: Dynamic evidence strategies that configure modality, seniority, and purpose rules per competency.
2. **Item & Modality (Stage 7 & 8):**
   - Currently, items support `multiple_choice` and `text_response` (short answer/scenario/reasoning).
   - Requirement for M2 Universal Evidence Engine: Formal `EvidenceStrategy` and `EvidenceModality` registry supporting simulations, spreadsheets, written work samples, and domain work samples across technical and non-technical fields.
3. **Dedicated M2 Test Coverage (Stages 5–13):**
   - Currently, tests cover M1 routes (`profile`, `resume`, `competency`, `analytics`, etc.), while M2 endpoints are tested via build and manual smoke tests.
   - Requirement: A dedicated automated test suite `tests/m2.test.ts` covering blueprint lifecycle, adaptive uncertainty reduction, response evaluation, and evidence package generation.
4. **Recruiter Evidence Map UI (Stage 13):**
   - The `GET /api/m2/evidence-package` endpoint produces a complete JSON structure, but the `/candidates` route is currently a `FeaturePlaceholder`.
   - Requirement: An evidence-grounded recruiter review view (spider/radar + confidence intervals + evidence provenance chain).
