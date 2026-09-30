# Next Phase Discovery: Resume Intelligence & Extraction Validation

## Current State Observations

1.  **Frontend**: `/resume` route exists as a placeholder/component but lacks full feature integration. `ProtectedRoute` is in place.
2.  **Database**: `schema.sql` defines `candidate_resume` (with `UNIQUE(user_id, version)` for concurrency) and `candidate_context` (for `raw_text` and `context_data_json`).
3.  **API Routes**: `POST /api/resume/upload` exists. It validates files (magic bytes, size), hashes them, prevents duplicates, uploads to Cloudflare KV, and proxies to the Python Pyodide worker.
4.  **Python Extractor**: `resume-extractor/src/index.py` handles PDF, TXT, TEX, and DOCX. It has *some* limits (`MAX_DOCX_ENTRIES = 500`, `MAX_DOCX_XML_SIZE = 10MB`, `MAX_TEXT_SIZE = 2MB`), but the prompt highlights that these resource limits "require real verification" and tests are "too mock-heavy."
5.  **Muse Glimmer (NVIDIA API)**: No integration exists in `functions/api/[[route]].ts`. The AI extraction from raw text to structured ATS data is missing.
6.  **Tests**: Existing `resume.test.ts` likely heavily mocks D1 and the Python service. Real D1 integration tests are required.

## Unresolved Issues Addressed in this Phase
- Implement Muse Glimmer AI extraction for resumes (Server-side, `meta/muse-glimmer-30b`).
- Establish Candidate Context provenance/evidence lineage (distinguish source vs claim vs extraction).
- Write real integration tests verifying DOCX archive bomb limits and Python extraction limits.
- Prove organization/tenant isolation in the API layer.
- Verify resume version concurrency protection.

## Recommended Next Slice
**Slice 3 Completion: AI Resume Intelligence Pipeline & Verification Hardening.**
We will implement the `/api/resume/extract` endpoint using NVIDIA's Muse Glimmer, update the DB to store evidence lineage, write real Vitest integration tests for the security limits, and wire the UI to trigger this pipeline.
