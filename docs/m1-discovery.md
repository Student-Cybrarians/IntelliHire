# Module 1 Discovery: Resume Intelligence & ATS Matching

## 1. Current Implemented State
**Resume Intelligence Pipeline (Partially Implemented):**
- `/resume/upload` endpoint securely accepts files, stores them in KV, checks for archive bombs, limits file size, and handles versioning.
- `/resume/extract/:resume_id` endpoint utilizes NVIDIA Muse Glimmer (`meta/muse-glimmer-30b`) to extract ATS structured data into `candidate_context`.
- `candidate_claim` table exists and stores verified skills with `provenance`.
- A candidate-facing `/resume` UI exists for uploading and viewing extraction status and skills.

## 2. Current Unimplemented/Mocked State
**JD Ingestion & Matching (Missing):**
- UI: No interface exists for inputting or selecting a Job Description (JD) to match against.
- Schema: `job_requisition` exists with a `description` field, but no `JDRequirement` granular table or structured JSON field for extracted requirements.
- Schema: `candidate_application` has `match_score` and `match_reasoning`, but this does not cover detailed gap analysis, evidence-backed matching, or improvement suggestions at a granular level.
- AI: No Muse Glimmer prompt/endpoint exists to extract requirements from a JD.
- AI: No Muse Glimmer prompt/endpoint exists to perform a bidirectional semantic match between Resume Evidence and JD Requirements.
- Output: No ATS format validation/improvement suggestion endpoint.

## 3. Required Updates for M1 Completion
- **Database Schema**:
  - Update `job_requisition` to include `requirements_json` or create a `job_requirement` table.
  - Create `match_analysis` table (or expand `candidate_application` / `candidate_context`) to store structured evidence mapping, missing requirements, and improvement suggestions.
- **Backend APIs**:
  - `POST /api/jd/extract`: Parse a raw JD into structured requirements.
  - `POST /api/match/analyze`: Compare a `resume_id` and a `requisition_id` (or raw JD text) using Muse Glimmer, outputting matched evidence, missing evidence, and improvement suggestions.
- **Frontend UI (`Resume.tsx` or new `Workspace.tsx`)**:
  - Two-pane workspace: Resume on the left, Job Description on the right.
  - "Run Match Analysis" button.
  - Detailed Match Analysis View displaying evidence-backed requirement mapping, ATS parseability score, and actionable resume improvement suggestions.
