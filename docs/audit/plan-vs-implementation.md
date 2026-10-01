# Plan vs Implementation Matrix

Comparison of M1 Planned Requirements against actual implementation, test suite coverage, and production behavior.

| Requirement ID | Planned Requirement | Implementation | Test Evidence | Production State | Status |
|---|---|---|---|---|---|
| R-001 | Universal Candidate Evidence & Taxonomy | `schema.sql` (`competency`, `skill`, `candidate_proficiency`), `functions/api/[[route]].ts` | `competency.test.ts`, `profile.test.ts` (4 tests passing) | Deployed on `intellihire-db` | **MATCH** |
| R-002 | Universal Evidence Status Model | Explicit status enum (`DEMONSTRATED`, `MISSING`, `CONTRADICTORY`) enforced in matching | `m1.test.ts`, `ai.test.ts` | Handled via API/Worker pipeline | **MATCH** |
| R-003 | Candidate Context Package Output Contract | `GET /api/candidate/context` returning versioned context package | `resume.test.ts` (`/api/candidate/context` unit tests) | Endpoint active in Pages Functions | **MATCH** |
| R-004 | ATS Signal Architecture (Deterministic) | Deterministic keyword/text layer heuristic calculation; non-hallucinated | `m1.test.ts` | Integrated in match logic | **MATCH** |
| R-005 | Job Description Intelligence | `POST /api/jd/analyze` parsing structured requirements | `m1.test.ts` | Integrated in API | **MATCH** |
| R-006 | Real Resume Versioning & Lineage | `POST /api/resume/:id/optimize` creating versioned resume records with approval | `resume.test.ts` | Handled via API & D1 | **MATCH** |
| R-007 | Contradiction Engine | Flags conflicting claims, surfaces `CONTRADICTORY` status, requires human review | `ai.test.ts` | Displayed in Candidate UI | **MATCH** |
| R-008 | Asynchronous Processing Pipeline | D1 queue polling / Cron Worker architecture replacing Cloudflare Queues | `e2e.test.ts`, `m1.test.ts` | Fallback documented in ADR | **MATCH (ADR Approved)** |
| R-009 | Security, Fairness & Privacy | JWT auth, candidate isolation, role enforcement, prompt injection delimiters | `security.test.ts` | Verified in local & deployed simulation | **MATCH** |
