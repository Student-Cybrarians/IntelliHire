# IntelliHire M2 Universal Evidence Engine — Regression Baseline

**Date:** 2026-10-02  
**Role:** QA / Test Engineer + Solution Architect  
**Commit:** `74cada6`  

---

## 1. Automated Test Suite Execution

**Command:** `npm test` (`vitest run`)  
**Status:** **PASS** (17 test files, 60 tests passed, 0 failed)  
**Execution Time:** ~10.7s  

### Detailed Breakdown by Suite:
1. `tests/enhancements.test.ts` (20 tests passed) — M1 E-03, E-05, E-11, E-14, E-18 regression & units
2. `functions/api/resume.test.ts` (9 tests passed) — Ingestion, size limits, format restrictions, extraction mock
3. `functions/api/dashboard.test.ts` (5 tests passed) — Candidate & recruiter dashboard endpoints
4. `functions/api/requisition.test.ts` (4 tests passed) — Requisition creation, listing, applying
5. `src/client/pages/Dashboard.test.tsx` (3 tests passed) — Candidate & recruiter workspace role isolation
6. `src/client/pages/Onboarding.test.tsx` (2 tests passed) — 3-step onboarding flow & taxonomy selection
7. `functions/api/competency.test.ts` (2 tests passed) — Competency and skill creation
8. `functions/api/pipeline.test.ts` (2 tests passed) — Candidate pipeline status transitions
9. `functions/api/profile.test.ts` (2 tests passed) — Candidate profile retrieval and update
10. `functions/api/search.test.ts` (2 tests passed) — Semantic search filtering
11. `functions/api/m1.test.ts` (2 tests passed) — Candidate context and claims verification
12. `tests/security.test.ts` (2 tests passed) — Unauthenticated rejection and tenant isolation
13. `functions/api/analytics.test.ts` (1 test passed) — Pipeline metrics endpoint
14. `functions/api/assessment.test.ts` (1 test passed) — Assessment session flow
15. `tests/a11y.test.ts` (1 test passed) — Accessible file input & ARIA attributes
16. `tests/ai.test.ts` (1 test passed) — AI structured output and boundaries
17. `tests/e2e.test.ts` (1 test passed) — Full navigation lifecycle

---

## 2. Production Build Execution

**Command:** `npm run build` (`tsc && vite build`)  
**Status:** **PASS** (0 errors)  
**Modules Transformed:** 1,584  
**Artifact Outputs:**
- `dist/index.html` (0.87 kB)
- `dist/assets/index-F0i7MFTL.css` (23.82 kB)
- `dist/assets/index-CeNNo0HA.js` (255.09 kB)

---

## 3. TypeScript Typecheck

**Command:** `npx tsc --noEmit`  
**Status:** **PASS** (Exit code 0, 0 type errors)

---

## 4. Pages Functions Bundling

**Command:** `npx esbuild functions/api/[[route]].ts --bundle --outfile=nul`  
**Status:** **PASS** (Exit code 0, 152.3kb bundle generated in 33ms)

---

## 5. Deployment Preflight Check

**Command:** `node scripts/preflight.mjs`  
**Status:** **PASS**  
- Git working directory: Clean
- Untracked/tracked secret files: None
- Placeholder KV configuration: None
- Automated vitest: 60/60 tests passing
- Vite build: Successful

---

## 6. Recorded Discrepancies & Non-Fatal Warnings

1. **Lint Script Failure (`npm run lint`):**
   - **Error:** `'eslint' is not recognized as an internal or external command`
   - **Root Cause:** `package.json` defines `"lint": "eslint ."`, but `eslint` is not listed in `devDependencies` and not installed in `node_modules`.
   - **Action:** Documented as an existing baseline deficiency. Not modifying unrelated dependencies in this phase per Prompt 03 instructions.
2. **React Router Future Flag Warnings (Test Environment):**
   - Non-fatal console warnings during React component tests regarding React Router v7 future flags (`v7_startTransition`, `v7_relativeSplatPath`).
   - Does not affect runtime behavior or build outputs.
