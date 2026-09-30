# Next Phase Architecture: AI Resume Intelligence Pipeline

## 1. Component Hierarchy
- `Resume.tsx`: Candidate-facing component to view and extract resume data.
  - `FileUpload` (Existing)
  - `ExtractionStatus` (New): Shows loading states during Muse Glimmer processing.
  - `ParsedResumeView` (New): Displays skills, experience, and education with provenance markers.

## 2. API Contracts
**`POST /api/resume/extract/:resume_id`**
- **Auth**: Requires valid session.
- **Request**: `{}` (Empty body, targets specific resume_id).
- **Response**: 
  ```json
  {
    "success": true,
    "data": {
      "skills": ["React", "TypeScript"],
      "experience": [...],
      "provenance": { "source_id": "...", "confidence": 0.95 }
    }
  }
  ```

## 3. Data Flow
1. User requests extraction on `resume_id`.
2. Backend validates ownership: `SELECT * FROM candidate_resume WHERE id = ? AND user_id = ?`.
3. Backend fetches `raw_text` from `candidate_context`.
4. Backend issues POST to `https://integrate.api.nvidia.com/v1/chat/completions` using `meta/muse-glimmer-30b`.
   - **System Prompt**: Strictly instruct to return JSON, no hallucinations, source mapping.
5. Backend parses response, updating `candidate_context.context_data_json`.
6. Returns data to frontend.

## 4. Security & Tenant Isolation
- `NVIDIA_API_KEY` bound to `c.env.NVIDIA_API_KEY`.
- DB Queries strictly bound with `user.id`.

## 5. Evidence Lineage
- The `context_data_json` will include `source_document_id` and `extraction_method: "meta/muse-glimmer-30b"`.
