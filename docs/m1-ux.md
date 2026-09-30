# Module 1 (M1) UX & UI Design
## Phase 2: Design

**Status:** IN PROGRESS
**Date:** 2026-10-01

### 1. UX Principles
- **Clarity Over Complexity:** Do not expose the user to raw JSON, embedding concepts, or API mechanics.
- **Evidence-Backed Transparency:** Users must know *why* the AI assigned a match score.
- **Non-Technical Fallbacks:** Ensure terms like "ATS Score" are explained simply (e.g., "Parseability & Alignment").

### 2. UI Components & States

#### A. Resume Upload Pane (Left)
- **State 1 (Empty):** Drag-and-drop zone or click to upload (`Upload` icon).
- **State 2 (Uploading/Parsing):** Spinning loader with "Extracting Evidence..." text.
- **State 3 (Success):** Checkmark, filename, and a tag cloud of verified skills/attributes extracted.

#### B. JD Input Pane (Right)
- **State 1 (Empty):** `textarea` prompting "Paste Job Description here...". Submit button disabled if empty.
- **State 2 (Analyzing):** Spinning loader with "Extracting Requirements..." text.
- **State 3 (Success):** Checkmark, list of Requirements with chevron bullets.

#### C. Match Analysis Pane (Bottom)
- **Trigger:** Button "Run Intelligence Match" (only visible if both Resume and JD are in Success states).
- **State 1 (Running):** Spinning loader with "Running Match Engine..." text.
- **State 2 (Results):**
  - **ATS Score:** Large typography showing `SCORE/100`.
  - **Evidence Gap Analysis (The Core):** A list of evaluated requirements.
    - `EVIDENCE_FOUND`: Green Check icon. Shows requirement + matching resume quote.
    - `MISSING`: Red X icon. Shows requirement + "No evidence found in resume."
    - `CONTRADICTORY`: Orange Alert icon. Shows requirement + "Resume states [X], requirement asks for [Y]."
    - `UNCERTAIN`: Gray Question icon. Shows requirement + "Resume implies [X] but lacks explicit detail."
  - **Improvement Suggestions:** Actionable bullet points.

### 3. Accessibility & Responsiveness
- **Responsive:** Layout starts stacked (1 column) on mobile/tablet, shifts to 2 columns on `lg:` screens.
- **Accessibility:** Uses semantic HTML. Loading states must use `aria-live="polite"`. Status icons must have corresponding `aria-label`s (e.g., `aria-label="Evidence Found"`).

### 4. Traceability Visualization
For every `gap_analysis` item, the UI must render the `reasoning` field provided by the backend to assure the user the AI is grounding its decision in the source document.
