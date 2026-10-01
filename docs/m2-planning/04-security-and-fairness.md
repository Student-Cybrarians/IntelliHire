# Module 2: Security, Privacy & Fairness
**STATUS: PROPOSED / NOT APPROVED**

## 1. Fairness, Validity & Accessibility
Module 2 fundamentally pivots away from "trick questions" and arbitrary difficulty.
*   **Adverse Impact & Bias:** AI evaluators and generated items are monitored for differential item functioning (DIF) across subgroups.
*   **Language & Culture:** Multilingual translation of assessments must undergo language-equivalence validation. US-centric idioms must be detected and removed during the validation phase of the item lifecycle.
*   **Accommodations:** Time limits and presentation modes must be configurable per candidate.

## 2. Security & Assessment Integrity
*   **Leakage Prevention:** `correct_answer` and scoring rubrics are strictly isolated to backend execution and are never transmitted to the client.
*   **Prompt Injection:** Open-ended candidate responses must be treated as untrusted adversarial input. The AI evaluator prompt must strictly sandbox candidate input.
*   **Execution Isolation:** Code/Practical tasks run in isolated microVMs with strict egress network restrictions.

## 3. Privacy & Multi-Tenancy
*   **Tenant Isolation:** Question banks, scoring rules, and candidate data are strictly isolated by `organization_id`.
*   **Data Minimization:** AI prompts must not contain PII from the candidate unless explicitly required for a scenario, in which case it is anonymized.
*   **Consent & Deletion:** Candidates have full rights to request deletion of their evidence package.

## 4. Red-Team Findings & Validation
*   **Risk:** AI evaluator hallucinating a passing grade for a nonsensical response.
    *   *Mitigation:* Use strict rubrics, require the AI to quote candidate evidence, and employ deterministic keyword/regex fallbacks for certain constraints.
*   **Risk:** Adaptive engine oscillating wildly due to a few lucky guesses.
    *   *Mitigation:* Introduce a "burn-in" period of standard questions before fully unconstrained adaptive jumps, and cap maximum difficulty jumps per step.
*   **Risk:** Cost explosion from adversarial candidates submitting massive strings to free-text evaluations.
    *   *Mitigation:* Hard character limits at the edge (Cloudflare WAF / Worker constraints) before hitting Queues.
