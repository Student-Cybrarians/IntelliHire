# Next Phase Plan: AI Resume Intelligence Pipeline

## 1. Objective
Complete Slice 3 by integrating the NVIDIA Muse Glimmer API to extract structured, evidence-backed candidate context from raw resume text, and harden the surrounding infrastructure (D1 integration, DOCX bomb tests, tenant isolation).

## 2. User Journey
1. Candidate navigates to `/resume`.
2. Candidate uploads a resume file (handled by existing `/api/resume/upload`).
3. Frontend triggers `/api/resume/extract`, prompting the backend to call Muse Glimmer.
4. Backend parses and stores structured ATS data along with provenance (source document ID, confidence).
5. Frontend displays the extracted resume summary.

## 3. Functional Requirements
- API endpoint to trigger Muse Glimmer extraction.
- Structured JSON output from the LLM containing work history, skills, and education.
- Provenance lineage explicitly separating claims from evidence.
- Render parsed resume on the frontend.

## 4. Non-functional Requirements
- NVIDIA API key must be strictly server-side (Cloudflare Secrets).
- Handle 429 Rate Limits from NVIDIA gracefully.
- Security: Tenant isolation required on all API reads/writes.

## 5. Architecture Impact
- New Hono route for AI extraction.
- Calls external API (`integrate.api.nvidia.com`).

## 6. Data Model Impact
- Update or utilize `candidate_context` to store the generated JSON payload with exact provenance fields.

## 7. API Impact
- New: `POST /api/resume/extract/:resume_id`

## 8. Frontend Impact
- Update `src/client/pages/Resume.tsx` (or Dashboard) to include extraction state and parsed results.

## 9. Python/AI Impact
- Python extraction stays as-is but requires hardened integration tests.
- Muse Glimmer prompts must be strictly constrained to prevent hallucinations.

## 10. Security Impact
- Avoid XSS when rendering parsed JSON.
- Verify D1 tenant isolation (users can only extract their own resumes).

## 11. Tenant Isolation Impact
- Explicit `WHERE user_id = ?` checks on all DB queries.

## 12. Observability Impact
- Structured logging for NVIDIA API latencies and 429 occurrences.

## 13. Cost Impact
- Adds LLM API call cost per uploaded resume.

## 14. Testing Strategy
- Unit Tests: Extraction logic.
- Integration Tests: Real D1 integration (miniflare), DOCX bomb defense verification.
- AI Tests: Fallback on 429, handle malformed JSON.

## 15. Deployment Strategy
- Normal Cloudflare Pages deployment. Require `NVIDIA_API_KEY` secret.

## 16. Rollback Strategy
- Cloudflare Pages automatic rollback to previous deployment if verification fails.

## 17. Definition of Ready
- Plan, Architecture, and UX reviewed.

## 18. Definition of Done
- Deployed to Cloudflare Pages.
- Live test successfully extracts data using Muse Glimmer.

## 19. Risks
- Upstream NVIDIA API rate limits/timeouts.
- Malformed JSON from the LLM.

## 20. Gate Criteria
- G1-G9 pass. Security review explicitly approves prompt structure.
