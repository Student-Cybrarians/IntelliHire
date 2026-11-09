# TEST EXECUTION AND VERIFICATION REPORT: INTELLIHIRE

**Date:** November 9, 2026  
**Environment:** Cloudflare Pages & Functions (Hono + TypeScript), Cloudflare D1 (`intellihire-db`), Vitest 2.1.9, Node.js 22.23.2  
**Test Suite Status:** **72 Test Suites Passed, 558 Automated Tests Passed (100% Pass Rate)**

---

## 1. Executive Summary

Following full implementation of the IEEE research paper mathematical models (*"IntelliHire: An Intelligent Recruitment Training Platform"*), the comprehensive automated test suite was executed across all unit, component, API, lifecycle, and security layers.

All **72 test suites** passed cleanly with zero test failures or regressions.

---

## 2. Test Execution Summary

| Test Category | Suite Count | Test Count | Pass Rate | Key Verification Scope |
|---|---|---|---|---|
| **M01: ATS Resume Analyser** | 5 | 39 | 100% | TF-IDF (1,2) n-grams, cosine similarity, BM25, convex fusion ($\lambda=0.65$), 6-component AHP scoring, format & persistence |
| **M02: Adaptive Aptitude CAT** | 10 | 83 | 100% | 3PL IRT probability model, Newton-Raphson MAP ability estimation, Fisher Information item selection, stopping rule ($SE < 0.25$), 300+ item bank |
| **M03: Technical Coding Simulator** | 12 | 124 | 100% | Sandboxed execution (5s timeout, 256MB cap), STT verbal explanation grading, 4-tier rubric ($0.40, 0.20, 0.20, 0.20$), Shapley attribution |
| **M04: HR Interview Simulator** | 6 | 63 | 100% | Rolling multi-turn memory, STAR 0-4 scoring, VADER compound sentiment ($\alpha=15$), lexical richness TTR, professional affect curve |
| **M05: Behavioural Stability & Vision** | 3 | 15 | 100% | MediaPipe FaceMesh gaze tracking ($\le 15^\circ$), YOLOv8 17-keypoint posture, AffectNet emotion distribution, BCI ($0.40, 0.30, 0.30$), privacy guarantee |
| **CRI: Candidate Readiness Index** | 4 | 28 | 100% | 5-module composite readiness ($\sum w_m S_m$), normative T-score transform ($T = 50 + 10z$), dynamic pending module redistribution |
| **Cross-Cutting & Enterprise Platform** | 32 | 206 | 100% | RBAC, tenant isolation, D1 audit logging, session persistence, a11y, API security, and dashboard navigation |
| **TOTAL** | **72** | **558** | **100%** | **Complete System Integrity Verified** |

---

## 3. Notable Suite Highlights

1. **`functions/api/m1AtsEngine.test.ts` (7 tests, Passed):**
   - Verified that unigrams and bigrams are extracted while filtering standard stopwords.
   - Verified TF-IDF cosine similarity between resume and job description vectors.
   - Verified BM25 score calculation and dense-sparse convex fusion at $\lambda = 0.65$.
   - Verified that the 6-component ATS score satisfies Equation 1 under both paper baseline and AHP weight profiles.

2. **`functions/api/m2IrtCatEngine.test.ts` (6 tests, Passed):**
   - Validated that the 300+ item bank spans Quantitative, Logical, and Verbal aptitude with parameters $a \in [0.5, 2.5]$, $b \in [-3, 3]$, $c \in [0.1, 0.3]$.
   - Validated 3PL probability model bounds and monotonicity.
   - Validated that Fisher Information peaks near item difficulty $b$.
   - Verified Newton-Raphson MAP ability estimation converges within $|\Delta \theta| < 10^{-4}$.
   - Verified that standard error $\text{SE}(\hat{\theta}) < 0.25$ converges within 25–35 items.

3. **`functions/api/m3Judge0Engine.test.ts` (4 tests, Passed):**
   - Verified execution timeout enforcement ($5.0$s) and memory caps ($256$MB).
   - Validated speech-to-text transcript evaluation of Big-O complexity and data structure selection.
   - Validated 4-criterion technical rubric ($0.40, 0.20, 0.20, 0.20$) and Shapley diagnostic attribution.

4. **`functions/api/m4HrSentimentEngine.test.ts` (5 tests, Passed):**
   - Verified exact VADER compound formulation: $c = \frac{x}{\sqrt{x^2 + 15}}$.
   - Verified Type-Token Ratio lexical diversity calculation ($|V| / N$).
   - Validated Gaussian professional affect curve peaking at $\mu = 0.35$.
   - Validated automated 4-component STAR narrative scoring ($0$ to $4$).

5. **`src/client/utils/behaviouralVisionEngine.test.ts` (5 tests, Passed):**
   - Validated MediaPipe FaceMesh eye contact tracking classifying on-screen gaze when deviation $\le 15^\circ$.
   - Validated YOLOv8 17-keypoint posture classification into confident, neutral, and defensive categories.
   - Validated AffectNet emotion distribution aggregation.
   - Verified Behavioural Confidence Index calculation: $\text{BCI} = 0.40 S_{\text{eye}} + 0.30 S_{\text{posture}} + 0.30 S_{\text{emotion}}$.
   - Certified client-side privacy invariant (`CLIENT_SIDE_ONLY_VERIFIED`).

6. **`functions/api/criEngine.test.ts` (4 tests, Passed):**
   - Verified normative T-Score transformation ($T = 50 + 10 \frac{S - \mu}{\sigma}$).
   - Verified Candidate Readiness Index calculation: $\text{CRI} = 0.20 S_{\text{ATS}} + 0.20 S_{\text{apt}} + 0.25 S_{\text{tech}} + 0.20 S_{\text{HR}} + 0.15 \text{BCI}$.
   - Validated dynamic active weight redistribution for pending modules.
   - Verified placement readiness classification bands.

---

## 4. Production Build Verification

Executed `npm run build`:
- `tsc`: Clean TypeScript compilation with zero type errors.
- `vite build`: Optimized production bundle created in `dist/`:
  - `dist/index.html` (2.12 kB)
  - `dist/assets/index-CPlByZb_.css` (73.20 kB)
  - `dist/assets/index-DPubKcWE.js` (924.86 kB)
- Built in 4.55 seconds. Ready for Cloudflare Pages deployment.
