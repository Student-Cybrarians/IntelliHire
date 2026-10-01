# Module 1: Production Gap Analysis
**Date:** 2026-10-01

| Requirement | Current Implementation | Repository Location | Evidence | Status | Severity | Action |
|---|---|---|---|---|---|---|
| **Asynchronous Processing** | `POST /match/run` blocks HTTP thread until AI returns. | `functions/api/[[route]].ts` | Code inspection | `ARCHITECTURE_RISK` | Critical | Migrate extraction and matching to Cloudflare Queues / Workflows. |
| **Evidence Status Model** | Only supports 4 basic gap statuses (EVIDENCE_FOUND, MISSING, etc). | `functions/api/[[route]].ts` | Hardcoded prompt | `PARTIALLY_IMPLEMENTED` | High | Update schema and models to support all 13 required statuses. |
| **ATS Signal Architecture** | Returns arbitrary LLM-generated score `ats_score: 0-100`. | `functions/api/[[route]].ts` | Hardcoded prompt output | `BROKEN` | Critical | Replace LLM score with deterministic document analysis algorithm. |
| **JD Requirement Classification** | Only supports mandatory/preferred. | `functions/api/[[route]].ts` | Hardcoded prompt | `PARTIALLY_IMPLEMENTED` | Medium | Update AI extraction schema to include `CONTEXTUAL`, `POTENTIALLY_INVALID`, etc. |
| **Contradiction Engine** | Flags contradictions but doesn't halt for explicit human review. | `src/client/pages/Resume.tsx` | UI behavior | `MISSING` | High | Build UX flow for resolving identified contradictions. |
| **Candidate Context Package** | Data exists in disparate tables (`candidate_context`, `match_analysis`). | `schema.sql` | Schema | `MISSING` | High | Define a versioned JSON output package and corresponding API endpoint. |
| **Resume Versioning** | Only stores single `raw_text` and `context_data_json`. | `schema.sql` | Schema | `MISSING` | Medium | Add `resume_version` tracking table to support full lineage. |
| **Prompt Injection Defense** | System instructions warn AI, but no formal validation sanitization boundary exists before processing. | `functions/api/[[route]].ts` | Source | `SECURITY_RISK` | Critical | Implement input length bounds and semantic sanitization before feeding to 30b model. |

## Executive Summary
The core workflow (Resume Upload -> JD Ingestion -> AI Matching) exists, but it fundamentally violates the synchronous processing rules and relies on an LLM for ATS scoring which breaches the deterministic requirement. The system must be migrated to an async task architecture and the schema heavily upgraded.
