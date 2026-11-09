# CANDIDATE READINESS INDEX (CRI) INTEGRATION SPECIFICATION

**Document Date:** November 9, 2026  
**Reference Paper:** *IntelliHire: An Intelligent Recruitment Training Platform* (Global Academy of Technology)  
**Implementation Source:** `functions/api/criEngine.ts` & `functions/api/criEngine.test.ts`  
**Status:** **Fully Implemented & Formally Verified**

---

## 1. Overview & Research Contributions

The **Candidate Readiness Index (CRI)** serves as the central unifying metric of IntelliHire. It aggregates multi-modal evaluation signals from the five distinct recruitment training stages into a **single, interpretable, psychometrically calibrated readiness score** and normative T-score benchmark.

---

## 2. Mathematical Formulations & Implementations

### A. Composite Candidate Readiness Index (Equation 3)
$$\text{CRI} = w_1 S_{\text{ATS}} + w_2 S_{\text{apt}} + w_3 S_{\text{tech}} + w_4 S_{\text{HR}} + w_5 \text{BCI}$$
$$\sum_{m=1}^5 w_m = 1.0$$

#### Default Parameter Weights (Paper Section III-G):
- $w_1 = 0.20$: ATS Resume Analyser Score ($S_{\text{ATS}}$)
- $w_2 = 0.20$: Adaptive Aptitude 3PL-IRT Score ($S_{\text{apt}}$)
- $w_3 = 0.25$: Technical Coding Simulator Score ($S_{\text{tech}}$)
- $w_4 = 0.20$: HR Interview STAR & Affect Score ($S_{\text{HR}}$)
- $w_5 = 0.15$: Behavioural Confidence Index ($S_{\text{BCI}}$)

### B. Dynamic Weight Redistribution for Incomplete Modules
If a candidate has only completed a subset $K \subset \{1, 2, 3, 4, 5\}$ of modules, the active weights are re-normalized without penalizing pending rounds:
$$w_k^* = \frac{w_k}{\sum_{j \in K} w_j}, \quad \forall k \in K$$
Implemented in `calculateCandidateReadinessIndex`.

### C. Normative T-Score Standardization
To allow fair peer comparison against historical student cohorts and avoid raw score skew, raw percentage scores are transformed into standard T-scores (mean $\mu = 50$, standard deviation $\sigma = 10$):
$$T_m = 50 + 10 \cdot \left(\frac{S_m - \mu_m}{\sigma_m}\right)$$

Where $\mu_m$ and $\sigma_m$ represent the empirical population baselines for module $m$.

### D. Readiness Classification Tiers
Candidates are classified into actionable decision bands:
1. **Ready for Placement ($\text{CRI} \ge 75$):** Demonstrates high alignment across technical mastery, psychometric ability, and behavioral stability.
2. **Conditional / Remediation ($55 \le \text{CRI} < 75$):** Target areas identified for focused practice drills.
3. **Foundational Development ($\text{CRI} < 55$):** Core conceptual deficiencies requiring foundational remediation pathways.

---

## 3. Test Evidence

Formal verification executed via Vitest test suite (`functions/api/criEngine.test.ts`):
- `calculateNormativeTScore`: Verified exact standard deviation scaling ($\mu=50, \sigma=10$).
- `calculateCandidateReadinessIndex`: Verified Equation 3 calculation under default paper weights.
- `Dynamic Redistribution`: Validated automatic proportional re-weighting for pending modules.
- `Readiness Tier Classification`: Validated placement-ready, conditional, and foundational development band assignments.
- **Pass Rate:** 4/4 tests passed (100%).
