# IMPLEMENTATION AUDIT: INTELLIHIRE IEEE SPECIFICATION VS CODEBASE

**Document Date:** November 9, 2026  
**Reference Paper:** *IntelliHire: An Intelligent Recruitment Training Platform* (Mokshith Y Nanda, Suhas N, Ashwini, Dr. Shardadevi K - Global Academy of Technology)  
**System Target:** Full-Stack IntelliHire Web Platform (`https://intellihire-v3.pages.dev`)  
**Architecture:** Cloudflare Pages (React 18 + Vite frontend), Cloudflare Workers / Pages Functions (Hono + TypeScript), Cloudflare D1 (`intellihire-db`), Cloudflare KV, Workers AI, NVIDIA API, Client-Side Web Workers.

---

## 1. Executive Summary

This comprehensive audit reconciles the published IEEE conference paper specifications and mathematical formulations against the actual production codebase of IntelliHire. 

IntelliHire is designed around **five core evaluation modules** integrated through a unified **Candidate Readiness Index (CRI)**:
1. **Module 1 (M01): ATS Resume Analyser** – TF-IDF vectorizer + Cosine similarity, 6-component AHP scoring, BM25 dense-sparse convex fusion, and actionable LLM rewrite suggestions.
2. **Module 2 (M02): Adaptive Aptitude Testing (3PL-IRT CAT)** – Three-Parameter Logistic (3PL) Item Response Theory, Newton-Raphson ability estimation with Levenberg-Marquardt Bayesian MAP damping, and Fisher Information item selection ($SE < 0.25$ or 40 items).
3. **Module 3 (M03): Technical Coding Simulator** – Monaco Editor code surface, Judge0 API sandboxing (5s execution timeout, 256MB memory cap), Azure Speech-to-Text audio transcription, 4-tier rubric evaluation, and Shapley diagnostic attribution.
4. **Module 4 (M04): HR Interview Simulator** – Multi-turn rolling conversational context, STAR-completeness scoring (0–4), VADER compound sentiment ($\alpha = 15$), Type-Token Ratio (TTR) lexical richness, and Gaussian professional affect scoring.
5. **Module 5 (M05): Behavioural Confidence & Stability (In-Browser Computer Vision)** – Client-side Web Worker execution, MediaPipe FaceMesh iris-corner gaze tracking ($\le 15^\circ$), YOLOv8n-pose 17 keypoint posture classification, DeepFace AffectNet emotion distribution, and Behavioral Confidence Index ($\text{BCI} = 0.40 S_{\text{eye}} + 0.30 S_{\text{posture}} + 0.30 S_{\text{emotion}}$).
6. **Integration: Candidate Readiness Index (CRI)** – Composite weighted readiness $\text{CRI} = \sum w_m S_m$ with normative T-score normalization ($T = 50 + 10 \frac{S - \mu}{\sigma}$).

---

## 2. Module-by-Module Audit Matrix

| Module & Feature | Paper Specification & Formula | Existing Implementation | Missing Functionality | Required Enhancement | Status |
|---|---|---|---|---|---|
| **M01: TF-IDF Vectorization** | Equations 4 & 5: Term Frequency $TF(t,d)$ and Inverse Document Frequency $IDF(t,D)$ with n-gram $(1,2)$ | Regex keyword tokenizer and stopword filter in `functions/api/[[route]].ts` | Scikit-learn style n-gram (1,2) sublinear TF-IDF vectorization across resume and JD text | Implement dedicated `functions/api/m1AtsEngine.ts` with n-gram (1,2) TF-IDF matrix computation | Partially implemented |
| **M01: Cosine Similarity** | Equation 6: $\text{sim}(A,B) = \frac{A \cdot B}{\|A\| \|B\|}$ | Keyword ratio matching and LLM gap analysis | True vector cosine dot product over TF-IDF space | Add exact cosine similarity calculation between candidate resume vector and job description vector | Partially implemented |
| **M01: 6-Component Scoring** | Equation 1: $S_{\text{ATS}} = \sum_{i=1}^6 w_i s_i$ with weights $(0.35, 0.20, 0.20, 0.10, 0.10, 0.05)$ and AHP variant $(0.32, 0.22, 0.18, 0.12, 0.10, 0.06)$ | 4 components evaluated: format (0.30), keyword (0.35), structure (0.10), AI match (0.25) | Section completeness, skills coverage, formatting compliance, ATS parseability, quantifiable density, and summary quality | Implement full 6-dimensional AHP scoring model with support for both paper weight profiles | Needs validation |
| **M01: Dense-Sparse Fusion** | $S_{\text{match}} = \lambda S_{\text{dense}} + (1 - \lambda) S_{\text{BM25}}$, $\lambda = 0.65$ | Hardcoded heuristic match score combining keyword and LLM status | BM25 retrieval score fused with dense semantic similarity at $\lambda = 0.65$ | Implement Okapi BM25 scoring with convex combination $\lambda=0.65$ | Missing |
| **M01: Actionable Suggestions** | Line-tied GPT-4o rewrite suggestions with evidence provenance | Evidence-grounded text rewrites in `improvement_suggestions` | Structured line numbering, diff highlights, and quantifiable metric prompts | Anchor rewrites to specific identified gap categories and resume sections | Partially implemented |
| **M02: 3PL-IRT Model** | Equation 7: $P_i(\theta) = c_i + \frac{1 - c_i}{1 + e^{-a_i(\theta - b_i)}}$, $a_i \in [0.5, 2.5]$, $b_i \in [-3, 3]$, $c_i \in [0.1, 0.3]$ | Discrete 1-5 difficulty levels with heuristic Kalman gain updates in `functions/api/[[route]].ts` | True continuous 3PL latent trait model with item discrimination $a$, difficulty $b$, and pseudo-guessing $c$ | Implement `functions/api/m2IrtCatEngine.ts` implementing the exact 3PL probability model | Partially implemented |
| **M02: Ability Estimation** | Equations 8 & 9: Newton-Raphson MLE update $\theta^{(k+1)} = \theta^{(k)} - \frac{\ell'(\theta^{(k)})}{\ell''(\theta^{(k)})}$, convergence $|\Delta \theta| < 10^{-4}$ with Bayesian MAP damping | Score scalar 0–100 updated via Kalman filter approximation | Newton-Raphson root-finding on 3PL log-likelihood with first and second derivatives and Gaussian prior $\mathcal{N}(0,1)$ | Implement full Newton-Raphson optimizer with Levenberg-Marquardt damping and prior shrinkage | Missing |
| **M02: Fisher Information** | Equation 10: $I_i(\theta) = \frac{a_i^2 [P_i(\theta) - c_i]^2 Q_i(\theta)}{(1 - c_i)^2 P_i(\theta)}$ for optimal item selection | Heuristic difficulty search $| \text{diff} - \text{target} |$ | Item selection via argmax $I_i(\hat{\theta})$ across unadministered items subject to domain balance | Implement Fisher Information item selection engine | Missing |
| **M02: Stopping Criteria** | Standard Error $SE(\hat{\theta}) = \frac{1}{\sqrt{\sum I_i(\hat{\theta})}} < 0.25$ or max 40 items | Fixed 20-item threshold | Psychometric convergence check using asymptotic standard error ($SE < 0.25$) or max 40 items | Implement stopping condition checking $SE(\hat{\theta})$ after each response | Partially implemented |
| **M02: Item Bank Calibration** | Calibrated item bank with 300+ items across Quantitative, Logical, and Verbal domains | Database schema has `assessment_item_v2` with diverse items, but lacking explicit $(a, b, c)$ parameters | Standardized 3PL parameters $(a, b, c)$ for Quantitative, Logical, and Verbal aptitude domains | Provide calibrated item bank loader with 300+ items having pre-computed 3PL psychometric properties | Partially implemented |
| **M03: Sandboxed Code Execution** | Monaco editor with Judge0 Community API integration (15+ languages, 5s timeout, 256MB memory cap) | Multi-modality simulation engine in `simulationEngine.ts` with local mock code validator | Direct Judge0 API client with 5s timeout and 256MB limit, runtime and memory telemetry | Implement `functions/api/m3Judge0Engine.ts` with real Judge0 endpoint dispatch and resilient offline sandbox fallback | Partially implemented |
| **M03: Speech-to-Text Transcription** | Azure Speech-to-Text for candidate verbal explanation of algorithmic solution | Text notes input in simulation submission | Azure STT integration / Web Speech API speech-to-text audio capture and transcription processing | Add voice explanation capture and transcription evaluation pipeline | Partially implemented |
| **M03: 4-Tier Technical Rubric** | 4 evaluation criteria: Execution correctness (0.40), Complexity analysis (0.20), Boundary/edge-case defense (0.20), Verbal explanation clarity (0.20) | Multi-attribute rubric in `simulationEngine.ts` | Explicit 4-tier weighted scoring aligning with paper weights $(0.40, 0.20, 0.20, 0.20)$ | Formalize the 4-tier rubric in evaluation engine | Partially implemented |
| **M03: Shapley Attribution** | Shapley diagnostic attribution for feature contribution to solution performance | Explanations and counterexamples in teaching payload | Shapley value decomposition for rubric components | Implement Shapley value calculation engine for candidate score breakdown | Missing |
| **M04: Rolling Context Memory** | GPT-4o multi-turn interview with rolling context history preservation (prevents 4-5 turn degradation) | Multi-turn interview session in `interviewIntelligence.ts` with turn history tracking | Full conversation transcript threading into prompt generation | Ensure complete rolling dialogue state is maintained across all interaction turns | Fully implemented |
| **M04: STAR-Completeness Scoring** | Automated detection and 0–4 scale scoring of Situation, Task, Action, and Result components | STAR component checks in prompt and structured rubric | Explicit 0–4 STAR rating with granular sub-scores for S, T, A, R | Implement STAR scoring function with explicit 0–4 rating breakdown | Partially implemented |
| **M04: VADER Sentiment Analysis** | Equation 11: $\text{compound} = \frac{x}{\sqrt{x^2 + \alpha}}$ with $\alpha = 15$, positive $> 0.05$, negative $< -0.05$, target $[0.1, 0.6]$ | Basic sentiment heuristics in feedback generation | Standard VADER sentiment lexicon and compound score calculation with $\alpha = 15$ | Implement `vaderSentimentAnalysis` function adhering strictly to Equation 11 | Missing |
| **M04: Vocabulary Richness (TTR)** | Type-Token Ratio $\text{TTR} = \frac{|V|}{N}$ (unique tokens divided by total tokens) | Length check and word count | True lexical diversity Type-Token Ratio computation | Implement TTR metric calculation in M04 response evaluator | Missing |
| **M04: Professional Affect Scoring** | $S_{\text{affect}} = \exp\left(-\frac{(c - \mu_{\text{prof}})^2}{2 \sigma_{\text{prof}}^2}\right)$ with $\mu_{\text{prof}} = 0.35, \sigma_{\text{prof}} = 0.25$ | General feedback tone evaluation | Gaussian bell-curve scoring measuring distance from ideal professional sentiment | Implement Gaussian affect score function | Missing |
| **M05: Eye-Contact Quantification** | MediaPipe FaceMesh (468 landmarks, iris 468–477, 469–476 vs corners 33, 133, 263, 362; gaze deviation $\le 15^\circ$, 5-frame smoothing) | Camera preview in `InterviewCameraPreview.tsx` with audio meter | Full FaceMesh landmark extraction and gaze vector calculation | Implement client-side Web Worker / visual pipeline with gaze angle calculation and 30s sliding window | Partially implemented |
| **M05: YOLOv8 Pose Estimation** | YOLOv8n-pose in browser ONNX Web (17 COCO keypoints: shoulder slope, head offset, forward lean; confident, neutral, defensive) | Not implemented in frontend camera preview | ONNX Web runtime model loading and pose keypoint angle calculations | Implement pose classifier analyzing shoulder angle and forward lean | Missing |
| **M05: Emotion Expressiveness** | DeepFace / AffectNet emotion distribution (sampled every 2s, accumulated into session probability distribution) | Not present in camera preview | CNN emotion classifier running at 0.5 Hz producing valence/arousal distribution | Implement emotion recognition pipeline with 2-second interval sampling | Missing |
| **M05: Behavioural Confidence Index** | Equation 2: $\text{BCI} = 0.40 S_{\text{eye}} + 0.30 S_{\text{posture}} + 0.30 S_{\text{emotion}}$ | Basic camera active boolean | Unified composite BCI metric calculated client-side in Web Worker | Implement BCI calculation function combining eye contact, posture, and emotion | Missing |
| **M05: Client-Side Privacy Guarantee** | Strict Web Worker processing; zero raw video upload to server | MediaStream stays in browser video tag | Strict architectural guarantee with automated verification that video frames never leave client | Verify zero video upload and document privacy-preserving pipeline | Fully implemented |
| **CRI: Composite Readiness Index** | Equation 3: $\text{CRI} = w_1 S_{\text{ATS}} + w_2 S_{\text{apt}} + w_3 S_{\text{tech}} + w_4 S_{\text{HR}} + w_5 \text{BCI}$, default $(0.20, 0.20, 0.25, 0.20, 0.15)$ | Readiness Profile in `readinessEvidence.ts` using heuristic evidence weights | Configurable 5-module CRI formula with exact paper weights | Implement dedicated `functions/api/criEngine.ts` with CRI calculation and endpoint | Partially implemented |
| **CRI: Normative T-Score Normalization** | $T_m = 50 + 10 \left(\frac{S_m - \mu_m}{\sigma_m}\right)$ with cohort mean and variance baselines | Raw percentage scores displayed | Normative T-score normalization with empirical cohort benchmarks | Implement T-score transform function with standard population priors | Missing |
| **CRI: 360-Degree Visualisation** | Recharts radar chart, time-series progression, bar charts, and Puppeteer PDF export | Tailwind CSS UI cards in `Module5Analytics.tsx` and PDF export trigger | Recharts Radar diagram displaying the 5 dimensions, printable report styling | Implement SVG/Canvas radar visualization and complete dossier export | Partially implemented |

---

## 3. High-Priority Implementation Plan

To achieve 100% compliance with the IEEE publication, we will implement the missing mathematical engines in dedicated, modular TypeScript libraries with full Vitest coverage:

1. **`functions/api/m1AtsEngine.ts`:**
   - TF-IDF Vectorizer with n-grams $(1,2)$ and sublinear scaling.
   - Cosine Similarity dot product between resume and JD vectors.
   - Okapi BM25 implementation and dense-sparse convex fusion ($\lambda = 0.65$).
   - 6-dimension AHP scoring ($S_{\text{ATS}} = \sum_{i=1}^6 w_i s_i$).
   
2. **`functions/api/m2IrtCatEngine.ts`:**
   - 3PL-IRT probability model $P_i(\theta) = c_i + \frac{1 - c_i}{1 + e^{-a_i(\theta - b_i)}}$.
   - Newton-Raphson MLE ability estimation with Bayesian MAP Gaussian prior $\mathcal{N}(0, 1)$ and Levenberg-Marquardt damping.
   - Fisher Information item selection $I_i(\theta)$ and asymptotic standard error stopping rule ($SE(\hat{\theta}) < 0.25$ or 40 items).
   - Calibrated 300+ item bank loader covering Quantitative, Logical, and Verbal aptitude.

3. **`functions/api/m3Judge0Engine.ts`:**
   - Sandboxed code execution interface for Judge0 Community API (5s timeout, 256MB memory cap).
   - 4-criterion rubric scoring: Execution (0.40), Complexity (0.20), Boundary defense (0.20), Verbal explanation (0.20).
   - Audio explanation transcript parser and Shapley diagnostic attribution breakdown.

4. **`functions/api/m4HrSentimentEngine.ts`:**
   - VADER sentiment analysis engine with exact compound formula $\frac{x}{\sqrt{x^2 + 15}}$.
   - Type-Token Ratio (TTR) lexical richness calculator.
   - Gaussian professional affect score function $S_{\text{affect}} = \exp\left(-\frac{(c - 0.35)^2}{2(0.25)^2}\right)$.
   - STAR 0–4 scoring evaluation.

5. **`src/client/utils/behaviouralVisionEngine.ts` & `src/client/components/m4/BehaviouralStabilityTracker.tsx`:**
   - In-browser Web Worker computer vision pipeline.
   - MediaPipe FaceMesh iris/eye-corner gaze tracking ($\le 15^\circ$).
   - YOLOv8 pose classification (confident, neutral, defensive).
   - Emotion distribution tracker (AffectNet categories).
   - Behavioural Confidence Index calculation ($\text{BCI} = 0.40 S_{\text{eye}} + 0.30 S_{\text{posture}} + 0.30 S_{\text{emotion}}$).

6. **`functions/api/criEngine.ts`:**
   - Unified Candidate Readiness Index $\text{CRI} = 0.20 S_{\text{ATS}} + 0.20 S_{\text{apt}} + 0.25 S_{\text{tech}} + 0.20 S_{\text{HR}} + 0.15 \text{BCI}$.
   - Normative T-Score normalization $T_m = 50 + 10\left(\frac{S_m - \mu_m}{\sigma_m}\right)$.
   - Recharts Radar chart integration in `Module5Analytics.tsx`.
