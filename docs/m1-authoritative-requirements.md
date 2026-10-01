# Module 1: Authoritative Requirements
**STATUS: RECONCILED (Source A + Source B)**

## 1. Universal Candidate Evidence & Taxonomy
The system must support domain-neutral career evidence mapping: `Candidate` → `Experience` → `Activity/Task` → `Competency` → `Skill` → `Knowledge` → `Evidence` → `Outcome`.
It must accommodate all legitimate occupations and non-traditional evidence (patents, clinical experience, etc.).

## 2. Evidence Status Model
Every extracted claim must map to a specific status:
`EXPLICITLY_STATED`, `DEMONSTRATED`, `EXPERIENCE_BASED`, `PROJECT_BASED`, `CREDENTIALLED`, `VERIFIED`, `INFERRED`, `WEAKLY_INFERRED`, `MISSING`, `CONTRADICTORY`, `OUTDATED`, `UNKNOWN`, `UNCERTAIN`.

## 3. Candidate Context Package (Output Contract)
M1 must generate a versioned `Candidate Context Package` containing all extracted profile data, evidence, statuses, provenance, and match analysis. This serves as the single source of truth for M3, M4, M5.

## 4. ATS Signal Architecture
The ATS score must be a deterministic measure of document quality (e.g., parseability, text layer, layout) rather than a naive AI hallucinated percentage.

## 5. Job Description Intelligence
Extract and classify JD requirements into: `MANDATORY`, `PREFERRED`, `DESIRABLE`, `CONTEXTUAL`, `UNCLEAR`, `POTENTIALLY_INVALID`, `INFORMATIONAL`.

## 6. Real Resume Versioning
Maintain lineage across versions: `ORIGINAL`, `PARSED`, `NORMALIZED`, `ATS_ANALYSIS`, `JOB_MATCH`, `RECOMMENDATIONS`, `OPTIMIZED`, `JOB_SPECIFIC`, `CANDIDATE_APPROVED`, `HISTORICAL`.

## 7. Contradiction Engine
When contradictory evidence is found (e.g., conflicting dates), the engine must NOT resolve it silently. It must mark it contradictory, show sources, and demand Human Review.

## 8. Asynchronous Processing
Expensive workloads (parsing, extraction, semantic matching) MUST be asynchronous to prevent HTTP timeouts. Progress must be observable to the user (`UPLOADED`, `EXTRACTING`, `MATCHING`, `READY`).

## 9. Security, Fairness & Privacy
Strict isolation, prompt injection defenses, unbiased evaluation, and explicit human control over optimization suggestions.
