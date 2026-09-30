# Module 1 UX & Design: Resume Intelligence Workspace

## 1. Overall Layout
The M1 workspace (`/resume`) will transition from a simple upload form into a robust two-column Dashboard.
- **Left Column (Source & Evidence)**: Resume uploading, candidate evidence, ATS analysis.
- **Right Column (Target & Match)**: Job Description input, parsed requirements, Match Analysis, Gap Analysis, Improvement Suggestions.

## 2. Component Hierarchy

### 2.1. M1 Header
- **Title**: "Resume Intelligence & ATS Matching"
- **Actions**: "Reset Workspace", "Export Analysis"

### 2.2. Left Column: Resume Source & Evidence
- **Resume Upload Card**:
  - Drag-and-drop file upload.
  - Displays current active resume version and filename.
  - Extraction status indicator (Loading, Extracted, Error).
- **Candidate Evidence Card**:
  - Displays structured data (Skills, Experience, Education).
  - Badges indicating evidence status (e.g., `extracted`, `normalized`, `inferred`).
- **ATS Analysis Card**:
  - Overall parseability score.
  - Formatting warnings.
  - Keyword density insights.

### 2.3. Right Column: Job Description & Match Analysis
- **Job Description Card**:
  - Textarea to paste raw JD text (MVP).
  - "Analyze JD" button.
  - Read-only view of parsed `JDRequirements` (Skills, Qualifications).
- **Match & Gap Analysis Card** (Appears after JD and Resume are both analyzed):
  - **Match Summary**: Progress bar showing Requirement Coverage.
  - **Gap Analysis List**:
    - Each JD requirement is listed.
    - Status icon: `EVIDENCE FOUND` (Green), `MISSING` (Red), `CONTRADICTORY` (Yellow).
    - Expandable row showing mapping to candidate evidence and reasoning.
- **Resume Improvement Card**:
  - Actionable suggestions to rewrite specific resume bullets.
  - **Crucial UI Pattern**: Side-by-side comparison of "Original Evidence" vs "Suggested Wording".
  - **Warning Banner**: "Generated wording does not establish new experience. Verify suggestions against actual work history."

## 3. Data Flow & Loading States
- **State 1 (Empty)**: Upload Resume and Paste JD inputs are visible.
- **State 2 (Analyzing)**: Skeleton loaders and spinner indicators while waiting on NVIDIA API.
- **State 3 (Results)**: Cards populate with structured `MatchEvidence` and `ImprovementSuggestion` data.

## 4. Accessibility & Responsiveness
- Semantic HTML tags for sections.
- ARIA live regions for AI extraction status updates.
- Stacks vertically on mobile/tablet screens.
