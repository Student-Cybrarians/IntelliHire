# IntelliHire M2 Universal Evidence Engine — Universality Gaps Audit

**Date:** 2026-10-02  
**Role:** Solution Architect + Product / HR Domain Specialist  
**Target:** Elimination of Technical, MCQ, Linguistic, and Seniority Biases in M2  

---

## 1. Executive Summary

A comprehensive source code audit was conducted across frontend components (`src/client/pages/Assessment.tsx`, `AssessmentV2.tsx`, `App.tsx`, `CandidateWorkspace.tsx`), backend handlers (`functions/api/[[route]].ts`), async workers (`m1-async-worker/src/index.ts`), and D1 schemas (`schema.sql`).

While M2 v2 introduced multi-modal type declarations, significant latent assumptions remain that bias the platform toward technical roles, multiple-choice testing, English fluency, and linear seniority ladders.

---

## 2. Detailed Gap Findings by Dimension

### 2.1 Coding-Only & Technical-Role Bias
- **Route Naming:** In `src/client/App.tsx`, line 29 registers `/technical-sandbox` for simulations, assuming candidate simulations are fundamentally technical or coding-focused.
- **PII Redaction Patterns:** In `functions/api/[[route]].ts`, line 287 explicitly targets `github.com` URLs alongside LinkedIn, reflecting software-first development.
- **Task Modality Absence:** In `functions/api/[[route]].ts` and `AssessmentV2.tsx`, there are no domain-specific practical interfaces for:
  - Financial analysts (spreadsheets, P&L calculations, reconciliation).
  - Legal professionals (contract clause analysis, statutory interpretation).
  - Healthcare workers (triage decision trees, patient communication protocols).
  - Sales & marketing (proposals, pitch critiques, campaign performance review).
  - Operations & trades (process troubleshooting, safety compliance walkthroughs).

---

### 2.2 Multiple-Choice (MCQ) Bias
- **Legacy M1 Assessment:** In `src/client/pages/Assessment.tsx` (183 lines) and legacy endpoint `POST /api/assessment/generate`, questions are 100% hardcoded to 4 options labeled A, B, C, D.
- **M2 AI Generation Default:** In `functions/api/[[route]].ts` (line 1493), `POST /api/m2/items/generate` enforces an MCQ structure in its LLM system prompt:
  ```typescript
  Return valid JSON with: { "question": "...", "options": ["...", "..."], "correct_answer": "..." }
  ```
  This causes the AI generator to output multiple-choice items even when the requested `item_type` is `'scenario'`, `'practical'`, or `'reasoning'`.
- **Item Type Naming Disconnect:**
  - Route handler (line 1689) checks `if (item.item_type === 'mcq')`.
  - Frontend `AssessmentV2.tsx` (line 9) defines `type ItemType = 'multiple_choice' | ...`.
- **Frontend Presentation Limit:** In `AssessmentV2.tsx`, non-MCQ items fall through to a generic text `<textarea>`, lacking structured decision-making interfaces, rubrics, or interactive data inputs.

---

### 2.3 English-Only & Monolingual Bias
- **AI System Prompts:** All system prompts in `functions/api/[[route]].ts` (lines 597, 955, 1025, 1493, 1696, 1810) are hardcoded in English.
- **UI Strings:** In `AssessmentV2.tsx` and `Resume.tsx`, labels, instructions, error states, and confidence metrics are hardcoded in English.
- **Schema Omission:** `assessment_item_v2`, `assessment_rubric`, and `assessment_blueprint` tables do not have `language_code` or `locale` attributes, preventing construct-preserving multilingual assessments or accommodations.

---

### 2.4 Degree & Formal Credential Bias
- **ATS Scoring Heuristic:** In `m1-async-worker/src/index.ts`, structure scoring searches for standard academic resume headers:
  ```typescript
  /(experience|education|skills|summary|objective|qualifications)/i
  ```
  Non-traditional backgrounds, skilled apprenticeships, and portfolio-driven careers risk receiving lower heuristic format scores unless manually adjusted.
- **Evidence Verification:** Prior evidence models treated extracted resume claims as primary facts rather than unverified initial assertions requiring empirical demonstration.

---

### 2.5 Fixed-Seniority & Scalar Difficulty Bias
- **Linear Difficulty:** `assessment_item_v2` models difficulty as a single integer `difficulty_level INTEGER` (1 to 10).
- **Seniority Misconception:** In `AssessmentV2.tsx`, seniority is mapped directly to difficulty:
  ```typescript
  level <= 2 ? 'Foundation' : level <= 4 ? 'Core' : level <= 6 ? 'Applied' : level <= 8 ? 'Advanced' : 'Expert'
  ```
  In professional environments, senior/lead/executive competencies differ in **scope, ambiguity, risk tolerance, systems thinking, trade-offs, and stakeholder governance**, rather than simply obscure technical trivia or complex arithmetic.

---

### 2.6 Fixed-Purpose Bias
- **Single Flow for All Purposes:** An assessment attempt currently executes identical adaptive rules regardless of candidate intent.
- **Missing Purpose Behaviors:**
  - *Practice / Learning:* Requires formative hints, immediate rubric explanations, and low-stakes exploration.
  - *Readiness Diagnostic:* Requires broad competency breadth to identify gaps.
  - *Recruitment Evaluation:* Requires high reliability, tamper-resistant evidence packages, and verified provenance.
  - *Interview Preparation:* Focuses on articulation and decision justification.

---

## 3. Remediation Roadmap for Phase 2+

1. **Phase 2 (Universal Evidence Strategy):**
   - Introduce `EvidenceStrategy` mapping: `(Occupation × Competency × Seniority × Purpose) → Modality`.
   - Implement pluggable `OccupationAdapter` interface (Healthcare, Finance, Trade, Tech, Sales, Legal).
   - Implement `SeniorityEngine` adjusting ambiguity and scope rather than just numerical difficulty.
2. **Phase 3 (Universal Modalities):**
   - Build domain work-sample contracts and interactive scenario engines.
   - Support browser-based spreadsheet/data analysis and document critique.
3. **Phase 7 (Accessibility, Fairness & Multilingual):**
   - Add language/locale tracking and localization validation.
