# Module 2 (M2) Architecture & System Design
## Phase 2: Design

**Status:** PASS
**Date:** 2026-10-01

### 1. System Components

#### Frontend (React / Vite)
- **Component:** `Assessment.tsx`
- **Role:** Assessment runner UI handling states: Loading, Presenting Question, Submitting, and Completed. 
- **Security:** Evaluates responses blindly; correct answers are never sent to the client.

#### API Backend (Cloudflare Pages Functions - Hono)
- **`POST /api/assessment/generate`:** Domain-neutral question generator using AI. Output schema strictly requests a multiple-choice item and its traceability rationale.
- **`POST /api/assessment/start`:** Initializes session.
- **`GET /api/assessment/sessions/:id/next`:** Employs an Adaptive Selection algorithm. Looks up the candidate's current proficiency score (0-100), maps it to a target difficulty level (1-5), and retrieves an unanswered question with the closest absolute difficulty.
- **`POST /api/assessment/sessions/:id/submit`:** Evaluates correctness server-side, logs the response, and adjusts the candidate proficiency score dynamically based on the difficulty of the answered question.

#### Data Persistence (Cloudflare D1)
- `assessment_item`
- `assessment_session`
- `candidate_response`
- `candidate_proficiency`

### 2. Failure Handling & Model Fallbacks
- The AI endpoint requires strict JSON parsing (`replace(/```json/g, '')`) due to common model behaviors.
- Fallback UI displays "Assessment Completed" gracefully when no further questions exist.
