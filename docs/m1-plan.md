# Module 1 Plan: Resume Intelligence & ATS Matching

## 1. Objective
Build out the complete Module 1 experience, transforming the existing resume extraction pipeline into a full Intelligence Workspace that supports bidirectional JD matching, evidence-based gap analysis, ATS validation, and actionable improvement suggestions.

## 2. Candidate Journey
1. Candidate navigates to the Resume Intelligence Workspace (`/resume`).
2. Candidate uploads their Resume (already implemented).
3. Candidate pastes or uploads a Job Description (JD).
4. System extracts structured `JDRequirements` from the JD using AI.
5. Candidate requests an "ATS & Match Analysis".
6. System compares `candidate_claim` and `candidate_context` evidence against `JDRequirements`.
7. System generates an ATS parseability evaluation and a granular evidence-backed gap analysis.
8. System suggests resume improvements (without fabricating experience) specifically mapped to identified gaps.
9. Candidate reviews the structured results.

## 3. Functional Requirements
- **JD Ingestion**: Support pasting raw text for a Job Description.
- **JD Extraction**: Use Muse Glimmer to extract mandatory/optional skills and qualifications.
- **Match Engine**: Compare Resume `raw_text` and structured claims against JD requirements.
- **ATS Analysis**: Evaluate the resume for standard ATS parseability, missing critical keywords, and formatting issues.
- **Gap Analysis & Improvement**: Highlight missing evidence and provide actionable, safe rewriting suggestions based *only* on existing candidate context.
- **Structured Output**: Save the results so they don't need to be regenerated on every page load.

## 4. Non-Functional Requirements
- **Tenant Isolation**: All operations strictly scoped by `organization_id` and `user_id`.
- **Security**: Model instructions must ignore prompt injections within the uploaded Resume or JD.
- **Observability**: Handle NVIDIA 429 Rate Limits and 500 Provider Outages safely.
- **Performance**: AI extraction processes must respond within standard HTTP timeouts or be handled gracefully.
- **AI Constraints**: The model MUST NOT fabricate candidate experience. All improvement suggestions must rely on pre-existing claims.

## 5. Architecture Impact
- **Database**: Add `job_description_context` table to hold raw JD text and extracted `requirements_json`. Add `match_analysis` table to hold the final match report.
- **API**: 
  - `POST /api/jd/analyze`: Ingests JD text, extracts requirements.
  - `POST /api/match/run`: Triggers the matching process between a resume and a JD.
- **Frontend**: Overhaul `/resume` into a split-pane layout (Resume side, JD side, Analysis center).

## 6. Schema Changes
```sql
CREATE TABLE IF NOT EXISTS job_description_context (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_account(id),
  raw_text TEXT NOT NULL,
  requirements_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS match_analysis (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_account(id),
  resume_id TEXT NOT NULL REFERENCES candidate_resume(id),
  jd_id TEXT NOT NULL REFERENCES job_description_context(id),
  match_report_json TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

## 7. AI Prompt Strategy
- **JD Extraction Prompt**: Instruct model to extract requirements (skill, experience, certification) into an array of objects.
- **Matching Prompt**: Provide both Resume Text and Extracted Requirements. Instruct model to categorize each requirement as `EVIDENCE_FOUND`, `MISSING`, or `CONTRADICTORY`. For `MISSING`, provide an improvement suggestion *if and only if* related evidence exists elsewhere in the resume, otherwise suggest acquiring the skill.

## 8. Definition of Done (Gate Criteria)
- Plan, Design, and Implementation completed.
- Unit and Integration tests added for JD extraction and Matching APIs.
- No secrets exposed.
- Deployed to Cloudflare Pages.
- Live Verified using actual resume and JD inputs.
