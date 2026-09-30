# Module 1 (M1) Architecture & System Design
## Phase 2: Design

**Status:** IN PROGRESS
**Date:** 2026-10-01

### 1. System Components

#### Frontend (React / Vite / Tailwind)
- **Component:** `Resume.tsx`
- **Role:** Split-pane interface presenting Candidate Evidence (Left) and Job Requirements (Right), converging in a Match Analysis pane (Bottom).
- **Key Responsibilities:** Form validation, file upload parsing UI, optimistic loading states for long-running AI operations, rendering semantic match visualizations.

#### API Backend (Cloudflare Pages Functions - Hono)
- **Component:** `[[route]].ts`
- **Role:** Handles routing, authentication, tenant isolation, and orchestrates calls to the AI models and databases.
- **Endpoints:**
  - `POST /api/resume/upload`: File size/type validation, Pyodide extraction invocation, Cloudflare KV storage.
  - `POST /api/jd/analyze`: LLM prompting for JD requirement extraction.
  - `POST /api/match/run`: LLM prompting for semantic matching between resume and JD.

#### AI Model Adapter
- **Model:** `meta/muse-glimmer-30b` via NVIDIA API.
- **Role:** Semantic reasoning component.
- **Boundary Contract:** API must supply strict JSON schema enforcement instructions. The AI adapter must safely fallback or return 502/429 on timeouts or rate limits.

#### Data Persistence (Cloudflare D1 & KV)
- **KV Store (`RESUME_KV`):** Raw blob storage for original uploaded resume files.
- **D1 Table (`candidate_context`):** Structured resume evidence JSON and raw text.
- **D1 Table (`job_description_context`):** Structured JD requirements JSON and raw text.
- **D1 Table (`match_analysis`):** Persisted AI gap analysis and ATS scores to avoid recomputation.

### 2. Request & Data Flows

#### Flow 1: JD Analysis
1. User pastes Job Description text.
2. Frontend `POST /api/jd/analyze`.
3. Backend validates input length, checks session, checks tenant.
4. Backend fetches from `meta/muse-glimmer-30b` with `systemPrompt` enforcing domain-neutral requirement extraction.
5. Backend parses JSON response, generates UUID, saves to `job_description_context`.
6. Backend returns JD data to Frontend.

#### Flow 2: Semantic Matching
1. User triggers Match.
2. Frontend `POST /api/match/run` with `resume_id` and `jd_id`.
3. Backend verifies both IDs exist and belong to user's tenant.
4. Backend retrieves `context_data_json` for Resume and `requirements_json` for JD.
5. Backend constructs strict Prompt demanding `EVIDENCE_FOUND`, `MISSING`, `CONTRADICTORY`, or `UNCERTAIN` classification.
6. Backend fetches from `meta/muse-glimmer-30b`.
7. Backend parses JSON, saves to `match_analysis`.
8. Backend returns Match Data to Frontend.

### 3. Error & Failure Handling
- **429 Rate Limit:** Return 429 status code. UI displays "Provider is busy. Retrying in 10s..."
- **500/Malformed JSON:** Try to extract via Regex (already implemented), if failed, return 500. UI displays "Analysis failed. Please try again."
- **Prompt Injection:** Output strictly validated against expected JSON keys before writing to DB.

### 4. Domain Neutrality
- Prompts use "Domain Requirements" instead of hardcoding "Tech Stack" or "Programming Languages".
- Requirements are categorized as: `knowledge`, `experience`, `certification`, `behavioral`.
