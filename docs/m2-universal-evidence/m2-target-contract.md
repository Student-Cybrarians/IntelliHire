# IntelliHire M2 Universal Evidence Engine — Target Domain Contract

**Date:** 2026-10-02  
**Role:** Solution Architect + Domain Modeler + Psychometric Systems Engineer  
**Status:** Authoritative Specification for Phases 2–10  

---

## 1. Architectural Philosophy: The Evidence-First Invariant

M2 operates on a strict epistemological hierarchy:
```
SOURCE DOCUMENT / CANDIDATE ASSERTION (Untrusted claim)
  ↓
EXTRACTED CLAIM (Unverified assertion with provenance)
  ↓
EVIDENCE STRATEGY (Formal determination of how to measure)
  ↓
ASSESSMENT TASK / WORK SAMPLE (Interactive or practical execution)
  ↓
EMPIRICAL RESPONSE / SUBMITTED ARTIFACT (Direct candidate output)
  ↓
STRUCTURED RUBRIC EVALUATION (Deterministic or rubric-guided evaluation)
  ↓
EVIDENCE ITEM (Atomic unit of verifiable performance)
  ↓
PROFICIENCY ESTIMATE (θ) ± UNCERTAINTY (SE(θ)) (Probabilistic state)
  ↓
EVIDENCE PACKAGE & EVIDENCE GRAPH (Complete audit trail for human decision)
```

**Absolute Invariant:** *M2 measures and proves; it never assumes. An optimized resume is not proficiency. An unassessed skill is never labeled missing.*

---

## 2. Core Domain Concepts (Implementable Specifications)

### 2.1 Evidence Strategy
- **Definition:** The formal specification of how a given competency or skill must be evaluated for a specific candidate within a specific occupational, seniority, and purposive context.
- **Implementable Interface:**
  ```typescript
  export interface EvidenceStrategy {
    id: string;
    organization_id: string;
    competency_id: string;
    skill_id: string;
    occupation_code: string;
    seniority_level: 'foundation' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'executive';
    assessment_purpose: 'diagnostic' | 'readiness' | 'recruitment' | 'gap_validation' | 'practice';
    required_evidence_type: string;
    allowed_modalities: EvidenceModalityType[];
    preferred_modality: EvidenceModalityType;
    fallback_modalities: EvidenceModalityType[];
    rubric_id: string;
    minimum_evidence_items: number;
    stopping_threshold_uncertainty: number; // e.g. SE <= 0.20
    accommodations_supported: string[];
    language_code: string;
    version: number;
    is_active: boolean;
    created_at: string;
  }
  ```

---

### 2.2 Evidence Modality
- **Definition:** The operational interaction mode through which the candidate generates verifiable performance artifacts.
- **Allowed Modality Registry:**
  1. `knowledge_inquiry`: Conceptual and factual inquiry (objective multi-choice or multi-select).
  2. `structured_reasoning`: Explanation, trade-off analysis, architectural or strategic defense.
  3. `dynamic_scenario`: Branching situation with state transitions (`Context → Action → Consequence → New State`).
  4. `domain_simulation`: Interactive domain protocol (e.g. medical triage, customer de-escalation, legal contract negotiation).
  5. `data_analysis_sample`: File/spreadsheet calculation, data reconciliation, formula and variance modeling.
  6. `written_work_sample`: Executive memo, proposal, engineering design document, pedagogical lesson plan.
  7. `practical_execution`: Browser-sandboxed execution (non-privileged runtime).
  8. `presentation_defense`: Structured argument presentation and objection handling.

---

### 2.3 Evidence Item
- **Definition:** An immutable, atomic record of demonstrated capability resulting from an evaluated candidate response or submitted work artifact.
- **Implementable Interface:**
  ```typescript
  export interface EvidenceItem {
    id: string;
    candidate_id: string;
    organization_id: string;
    attempt_id: string;
    competency_id: string;
    skill_id: string;
    modality: EvidenceModalityType;
    task_id: string;
    response_id: string;
    evaluation_id: string;
    raw_score: number;            // 0.0 - 1.0 (normalized)
    rubric_criteria_scores: Record<string, number>;
    demonstrated_level: 'novice' | 'competent' | 'proficient' | 'expert';
    evidence_weight: number;      // Higher for practical work samples vs. knowledge queries
    confidence_score: number;     // Evaluator confidence (0.0 - 1.0)
    provenance_reference: string;
    created_at: string;
  }
  ```

---

### 2.4 Provenance Chain
- **Definition:** An unbroken cryptographic or relational trail tracing every proficiency assertion back to the underlying rubric, model version, raw candidate input, and source JD requirement.
- **Chain Invariant:**
  `JD Requirement (ID) → Competency (ID) → Strategy (ID) → Assessment (ID) → Task/Item (ID+Ver) → Candidate Response (ID+SHA256) → Rubric (ID+Ver) → Evaluator (Model+Ver/Human ID) → Evidence Item (ID) → Proficiency Update (Timestamp)`

---

### 2.5 Confidence vs. Uncertainty
- **Distinction:**
  - **Proficiency ($\theta$):** The estimated latent capability parameter on a normalized scale $[0, 1]$ or standard logit scale $[-3.0, +3.0]$.
  - **Uncertainty ($SE(\theta)$):** The measurement error / standard error of the estimate. Drops as more high-discrimination evidence items are evaluated.
  - **Evaluator Confidence ($C_e$):** The evaluator's certainty in its own scoring (e.g. an AI model's confidence in its rubric interpretation).
- **Mathematical Relationship:**
  $$\text{Interval} = [\max(0, \theta - 1.96 \cdot SE(\theta)), \min(1, \theta + 1.96 \cdot SE(\theta))]$$
  No scalar score may be presented without its uncertainty envelope $\pm SE(\theta)$.

---

### 2.6 Evidence Coverage
- **Definition:** The proportion and quality of required skills within a target competency profile that have met minimum evidence standards.
- **States:**
  - `demonstrated`: Robust empirical evidence meeting uncertainty threshold ($SE \le 0.20$, $\theta \ge 0.70$).
  - `partially_demonstrated`: Evidence exists, but performance is borderline or uncertainty remains high ($SE > 0.20$).
  - `insufficient`: Minimum evidence item count not reached.
  - `conflicting`: Opposing evidence items detected.
  - `not_assessed`: Never presented to the candidate (distinct from missing!).
  - `not_applicable`: Irrelevant to the current candidate's seniority or role variant.

---

### 2.7 Contradiction Detection
- **Definition:** The automated detection of incompatible assertions across candidate claims, resume context, work sample outputs, and objective assessments.
- **Rule:** Contradiction triggers `CONFLICTING_EVIDENCE` status and flags the item for human assessor review. M2 never labels a candidate "dishonest"; it documents the contradiction objectively with provenance pointers.

---

### 2.8 Gap Analysis
- **Definition:** The evidence-grounded differential between required target role competency standards and demonstrated candidate capability.
- **Taxonomy of Gaps:**
  1. `mandatory_gap`: Below standard on a non-negotiable role requirement.
  2. `preferred_gap`: Below standard on a desirable but non-essential skill.
  3. `knowledge_gap`: Deficient in conceptual foundations.
  4. `practical_gap`: Understands concepts but fails practical work samples.
  5. `prerequisite_gap`: Missing prerequisite foundational competency.
  6. `unassessed_area`: Insufficient evidence to establish proficiency.

---

### 2.9 Evidence Graph
- **Definition:** A directed relational graph connecting JD requirements, competencies, evidence items, and candidate profile nodes.
- **Structure:**
  - **Nodes:** `JobRequisition`, `Competency`, `Skill`, `EvidenceStrategy`, `EvidenceItem`, `CandidateProfile`.
  - **Edges:** `REQUIRES`, `MEASURED_BY`, `PRODUCES`, `EVIDENCES`, `CONTRADICTS`.

---

### 2.10 Assessment Purpose
- **Definition:** The organizational intent driving the assessment, dictating candidate experience, proctoring rigor, and feedback granularity.
- **Configured Behaviors:**
  - `diagnostic`: Low stakes, exploratory, broad skill breadth, maximum formative feedback.
  - `practice`: Formative, candidate-guided, hints available, no downstream hiring consequence.
  - `recruitment`: High stakes, strict stopping rules, tamper-evident audit logging, minimal answer exposure.
  - `gap_validation`: Targeted specifically at verifying previously flagged gaps.

---

### 2.11 Seniority Dimensions
- **Definition:** Multi-axial criteria that govern task construction beyond scalar difficulty:
  1. **Ambiguity:** From tightly bounded tasks (Junior) to ill-defined, conflicting requirements (Lead/Executive).
  2. **Scope of Impact:** From single function/task (Junior) to cross-functional or enterprise-wide (Lead/Exec).
  3. **Autonomy & Governance:** Independent execution and risk stewardship.
  4. **Trade-off Complexity:** Managing competing priorities (cost vs. speed vs. quality).
  5. **People & Mentorship:** Elevating team capabilities.

---

### 2.12 Occupation Context & Pluggable Adapters
- **Definition:** A domain boundary defining representative modalities, standard taxonomies (ESCO, O*NET), and practical work sample contracts.
- **Supported Adapters:**
  - `TechnologyAdapter`
  - `FinanceAccountingAdapter`
  - `HealthcareClinicalAdapter`
  - `LegalRegulatoryAdapter`
  - `EducationInstructionalAdapter`
  - `SalesMarketingAdapter`
  - `OperationsLogisticsAdapter`
  - `SkilledTradesServicesAdapter`

---

## 3. Human Authority Boundary

M2 strictly generates **verifiable evidence and decision support**.  
No algorithm, rule, or model in M2 has the authority to issue:
- Rejection decisions
- Employment offers
- Adverse employment actions
- Final hiring scores without human review
