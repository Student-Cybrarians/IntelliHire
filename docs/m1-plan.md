# Module 1 (M1) Implementation Plan
## Phase 1: Plan

**Status:** IN PROGRESS
**Date:** 2026-10-01

### 1. Requirements

#### Functional Requirements
- **M1-F-001 (Resume Ingestion):** The system shall accept a candidate resume file (PDF, DOCX, TXT, TEX) up to 5MB, extract the text, and store the raw text securely in KV storage, registering metadata in D1. *(Status: Already Implemented)*
- **M1-F-002 (Evidence Extraction):** The system shall use the AI model to extract structured candidate evidence from the raw resume text.
- **M1-F-003 (JD Ingestion):** The system shall accept a target Job Description text and persist it. *(Status: Already Implemented)*
- **M1-F-004 (JD Requirement Extraction & Normalization):** The system shall extract structured JD requirements and normalize them into a domain-neutral representation (distinguishing mandatory vs. preferred, and identifying the domain).
- **M1-F-005 (Semantic Matching):** The system shall compare candidate evidence against JD requirements using `meta/muse-glimmer-30b`. *(Status: Partially Implemented - Needs strict statuses)*
- **M1-F-006 (Evidence Classification):** The match output MUST explicitly classify each requirement against candidate evidence using one of the following statuses: `EVIDENCE_FOUND`, `MISSING`, `CONTRADICTORY`, or `UNCERTAIN`.
- **M1-F-007 (Improvement Guidance):** The system shall generate evidence-backed resume improvement suggestions based on identified gaps. *(Status: Partially Implemented)*

#### Non-Functional Requirements
- **M1-NFR-001 (Domain Neutrality):** The architecture and prompts must not hardcode assumptions about software engineering or any specific industry.
- **M1-NFR-002 (Provenance):** AI outputs must trace back to source text where practical.
- **M1-NFR-003 (Performance):** Costly AI calls should be minimized; deterministic logic should be used for simple classification/routing.
- **M1-NFR-004 (Globalization):** Must support varying regional terminology without failure.

#### Security & AI Requirements
- **M1-SEC-001 (Secret Management):** AI credentials (`NVIDIA_API_KEY`) must strictly reside in server-side environment bindings. *(Status: Verified)*
- **M1-SEC-002 (Tenant Isolation):** Resume and JD data must be strictly isolated by `user_id` and `organization_id`.
- **M1-AI-001 (Fabrication Defense):** The AI adapter must be strictly prompted to NOT invent employers, dates, skills, or metrics.
- **M1-AI-002 (Prompt Injection Defense):** Candidate and JD inputs must be treated as untrusted data that cannot override system instructions.
- **M1-AI-003 (Structured Output):** AI match results must conform to a strict JSON schema that includes the required classification statuses.

### 2. API Contracts (Changes Needed)
- **POST `/api/jd/analyze`**: Update the system prompt and JSON output schema to ensure domain-neutral requirements extraction.
- **POST `/api/match/run`**: Update the system prompt to enforce strict output statuses (`EVIDENCE_FOUND`, `MISSING`, `CONTRADICTORY`, `UNCERTAIN`) and provenance (referencing the resume text).

### 3. Database Changes
- No new tables are strictly required for the core M1 matching logic as `candidate_resume`, `candidate_context`, `job_description_context`, and `match_analysis` exist.
- Ensure `match_report_json` in `match_analysis` accommodates the new strict schema.

### 4. Test Strategy
- **Unit/API Tests:** Update `functions/api/m1.test.ts` to mock the AI response conforming to the new strict `EVIDENCE_FOUND`/`MISSING`/`CONTRADICTORY`/`UNCERTAIN` schema.
- **Security Tests:** Ensure unauthenticated access to `/match/run` fails. Ensure prompt injection attempts in JD text do not yield non-JSON or overriding output.
- **Browser/E2E Tests:** Ensure `src/client/pages/Resume.tsx` handles and displays the new specific match statuses correctly (e.g., using different colors/icons for `UNCERTAIN` vs `CONTRADICTORY`).

### 5. Deployment & Rollback Strategy
- **Deployment:** Cloudflare Pages deployment via `npm run build` and `npx wrangler pages deploy dist --project-name intellihire-v3`.
- **Rollback:** In case of failure, deploy the previous commit using the same wrangler deployment command.

### 6. Acceptance Criteria
- [ ] JD Analysis output clearly identifies mandatory vs preferred requirements in a domain-neutral way.
- [ ] Match Analysis output strictly uses the 4 required statuses.
- [ ] Match Analysis includes a provenance reasoning field that references the candidate's source resume text.
- [ ] AI does not fabricate any candidate data.
- [ ] UI properly visualizes the 4 distinct match statuses and displays provenance reasoning.
- [ ] All existing and new tests pass.
