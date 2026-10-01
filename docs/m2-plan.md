# Module 2 (M2) Implementation Plan
## Phase 1: Plan

**Status:** IN PROGRESS
**Date:** 2026-10-01

### 1. Requirements

#### Functional Requirements
- **M2-F-001 (Domain-Neutral Item Generation):** The system shall generate assessment items (questions) without assuming a technical/software engineering context.
- **M2-F-002 (Adaptive Selection):** The system shall select the next question based on the candidate's current performance (e.g., if answering correctly, increase difficulty; if incorrectly, decrease difficulty) rather than pure random selection.
- **M2-F-003 (Score Calibration):** The candidate's `candidate_capability_score` must reflect a weighted calculation of difficulty vs correctness, not a flat +1/-1.
- **M2-F-004 (Session Conclusion):** The assessment session must terminate when a confidence threshold is reached or max questions (e.g., 5) are asked.

#### Non-Functional Requirements
- **M2-NFR-001 (Performance):** Question retrieval must be deterministic and fast (O(1) or O(log N) db lookups). Generation can be asynchronous.
- **M2-NFR-002 (AI Model Consistency):** If generation quality from Llama-3-8b is insufficient for complex domains, migrate to `muse-glimmer-30b`. For now, we will maintain the existing Llama-3 integration but update the prompt.

#### Security Requirements
- **M2-SEC-001 (No Client-Side Answers):** The `correct_answer` must NEVER be transmitted to the client in the `GET /next` payload.
- **M2-SEC-002 (Authorization):** Only `recruiter` or `org_admin` roles can trigger item generation. Only the assigned `candidate` can submit answers for their session.

### 2. API Contracts
- **POST `/api/assessment/generate`:** Update system prompt to "expert assessor in the target domain".
- **GET `/api/assessment/sessions/:id/next`:** 
  - *Current Logic:* `ORDER BY RANDOM()`
  - *New Logic:* Select an item whose `difficulty_level` matches the candidate's current score proxy, ensuring no repeats. Ensure `correct_answer` is stripped before returning JSON.
- **POST `/api/assessment/sessions/:id/submit`:**
  - Update scoring algorithm: `new_score = old_score + (is_correct ? difficulty_level * 0.5 : -difficulty_level * 0.5)`.

### 3. Test Strategy
- **Unit Tests:** Update `functions/api/assessment.test.ts` to assert that adaptive selection returns harder questions after a correct answer, and that `correct_answer` is not leaked.
- **Security Tests:** Verify candidates cannot generate items.

### 4. Acceptance Criteria
- [ ] Item generation prompt is explicitly domain-neutral.
- [ ] Adaptive selection fetches questions based on difficulty rather than randomness.
- [ ] Scoring is weighted by question difficulty.
- [ ] The correct answer is stripped from the frontend payload.
- [ ] All tests pass.
