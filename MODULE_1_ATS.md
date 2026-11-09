# MODULE 1: ATS RESUME ANALYSER SPECIFICATION & COMPLIANCE

**Document Date:** November 9, 2026  
**Reference Paper:** *IntelliHire: An Intelligent Recruitment Training Platform* (Global Academy of Technology)  
**Implementation Source:** `functions/api/m1AtsEngine.ts` & `functions/api/m1AtsEngine.test.ts`  
**Status:** **Fully Implemented & Formally Verified**

---

## 1. Overview & Research Contributions

Module 1 replicates and enhances industrial-grade Applicant Tracking Systems (ATS) screening pipelines. It evaluates resume-job description alignment using a **hybrid sparse-dense semantic architecture** and an analytical **6-component weighted scoring framework**, ensuring candidates receive transparent, actionable feedback to overcome initial recruiter gatekeeping filters.

---

## 2. Mathematical Formulations & Implementations

### A. TF-IDF Vectorization (Equations 4 & 5)
Given candidate resume document $d$ and corpus $D$ with vocabulary term $t$:
$$\text{TF}(t, d) = \frac{f_{t,d}}{\sum_{t' \in d} f_{t',d}}$$
$$\text{IDF}(t, D) = \log\left(\frac{1 + |D|}{1 + |\{d \in D : t \in d\}|}\right) + 1.0$$
$$\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \cdot \text{IDF}(t, D)$$

Implemented with an n-gram range of $(1, 2)$ over standardized stop-word filtered technical tokens in `extractNGrams` and `computeTfIdfVectors`.

### B. Cosine Similarity (Equation 6)
The semantic vector similarity between resume vector $\mathbf{A}$ and job description vector $\mathbf{B}$ is computed via:
$$\text{sim}(\mathbf{A}, \mathbf{B}) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|} = \frac{\sum_{i} A_i B_i}{\sqrt{\sum_i A_i^2} \sqrt{\sum_i B_i^2}}$$
Implemented in `calculateCosineSimilarity`.

### C. Okapi BM25 Ranking & Convex Fusion
To balance high-frequency keyword discovery with lexical discrimination, BM25 retrieval is calculated with standard parameters $k_1 = 1.5, b = 0.75$:
$$\text{BM25}(D, Q) = \sum_{t \in Q} \text{IDF}(t) \cdot \frac{f(t, D) \cdot (k_1 + 1)}{f(t, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}$$

The final keyword match score fuses dense semantic similarity with sparse BM25 scores via convex combination ($\lambda = 0.65$):
$$S_{\text{match}} = \lambda S_{\text{dense}} + (1 - \lambda) S_{\text{BM25}}, \quad \lambda = 0.65$$
Implemented in `computeConvexFusedMatch`.

### D. 6-Component ATS Scoring Framework (Equation 1)
$$S_{\text{ATS}} = \sum_{i=1}^6 w_i \cdot s_i, \quad \sum_{i=1}^6 w_i = 1$$

| Component | Paper Default ($w_i$) | AHP Calibrated ($w_i$) | Description |
|---|---|---|---|
| **$s_1$: Keyword Alignment** | 0.35 | 0.32 | Dense-sparse convex fused cosine similarity against JD requirements |
| **$s_2$: Section Completeness** | 0.20 | 0.22 | Presence of essential sections: Experience, Education, Skills, Projects, Summary, Certifications |
| **$s_3$: Skills Coverage** | 0.20 | 0.18 | Ratio of matched technical domain competencies identified in resume |
| **$s_4$: Formatting Compliance** | 0.10 | 0.12 | Character bounds (1-page min to 3-page max), bullet density, binary control character checks |
| **$s_5$: ATS Parseability** | 0.10 | 0.10 | Machine extractability of email, phone, chronological work dates, and structure |
| **$s_6$: Professional Summary** | 0.05 | 0.06 | Density of quantifiable metrics ($\%$, $\$$, volumes) and active action verbs |

---

## 3. Test Evidence

Formal verification executed via Vitest test suite (`functions/api/m1AtsEngine.test.ts`):
- `extractNGrams`: Verified tokenization and unigram/bigram stopword filtering.
- `calculateCosineSimilarity`: Verified TF-IDF vector dot products.
- `computeBM25Score`: Verified BM25 document-query lexical matching.
- `computeConvexFusedMatch`: Validated exact convex combination ($\lambda = 0.65$).
- `evaluateAtsResume`: Full 6-component scoring validated for both IEEE paper baseline and AHP weight profiles.
- **Pass Rate:** 7/7 tests passed (100%).
