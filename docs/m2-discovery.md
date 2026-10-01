# Module 2 (M2) Discovery Report
## Phase 0: Discovery

**Status:** PASS
**Date:** 2026-10-01

### 1. Existing M2 Implementation Status
- **Backend (`functions/api/[[route]].ts`):**
  - `POST /assessment/generate`: Generates multiple choice questions using `@cf/meta/llama-3-8b-instruct`. Currently hardcodes the persona as "expert technical assessor". Needs to be domain-neutral.
  - `POST /assessment/start`: Initializes a candidate assessment session in `assessment_session`.
  - `GET /assessment/sessions/:id/next`: Retrieves a random unanswered `assessment_item` for a given skill.
  - `POST /assessment/sessions/:id/submit`: Evaluates a candidate's response, records it in `candidate_response`, and updates the candidate's skill capability score based on a simple +1/-1 logic.
- **Frontend (`src/client/pages/Assessment.tsx`):**
  - Manages the assessment flow loop (`start` -> `next` -> `submit` -> `next`).
  - Displays questions, handles selection, and shows immediate `is_correct` feedback.
- **Data Model (`schema.sql`):**
  - `assessment_item`, `assessment_session`, `candidate_response`, `candidate_capability_score` exist and support the basic flow.

### 2. Gaps Against Product Principles
- **Domain Neutrality:** The AI generation prompt explicitly says "technical assessor", which violates the domain-neutrality requirement. It must support any domain (e.g. nursing, legal, sales).
- **Adaptivity:** The current flow just picks a `RANDOM()` question (`ORDER BY RANDOM() LIMIT 1`). A true adaptive assessment should select questions based on the candidate's current estimated capability vs. question difficulty.
- **Security & Integrity:** The `submit` endpoint assumes trust. Prompt injection during item generation must be mitigated.
- **AI Model Standardization:** M1 relies on `meta/muse-glimmer-30b` via the NVIDIA API for high-quality reasoning. M2 currently uses `@cf/meta/llama-3-8b-instruct`. 

### 3. Discovery Action Items
- Needs `m2-plan.md` to outline the architecture for true adaptivity.
- Needs to upgrade AI generation to standard `muse-glimmer-30b` or ensure Llama-3 usage conforms to domain-neutral output.
- Needs to ensure the UI is fully accessible and accessible to non-technical users.

### Phase 0 Exit Criteria:
- [x] Current M2 implementation analyzed.
- [x] Codebase inspected for M2 artifacts.
- [x] Gaps identified against Global/SDLC rules.
- [x] Discovery Documented.

**Next Action:** Proceed to **PHASE 1 — PLAN**.
