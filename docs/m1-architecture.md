# Module 1: Resume & Career Intelligence Architecture
**Date:** 2026-10-01

## 1. Universal Candidate Evidence Model
Instead of a simple "Resume -> Score" pipeline, M1 utilizes a multi-layered evidence graph:
`Candidate` -> `Experience` -> `Competency` -> `Skill` -> `Evidence`. 
The `evidence_item` table standardizes all candidate claims across 13 distinct status states (e.g., `DEMONSTRATED`, `CONTRADICTORY`).

## 2. ATS & Job Matching Dual-Engine
*   **Deterministic ATS:** A non-AI algorithm calculates parseability (text layer integrity, missing required sections, missing contact info) to yield an `ats_score`.
*   **Semantic AI Match:** The `meta/muse-glimmer-30b` model executes semantic comparison, evaluating JD requirements against candidate evidence.

## 3. Asynchronous Processing
Heavy AI workloads are decoupled from the HTTP request-response cycle using Cloudflare `executionCtx.waitUntil()`. The frontend employs a state machine (`VALIDATING` -> `EXTRACTING` -> `MATCHING` -> `READY`) polling `/api/match/status/:jobId`.

## 4. Tenant Isolation
Every database query strictly enforces `.bind(..., user.id)` and `organization_id` boundaries. AI prompts never share context between tenants.

## 5. Candidate Context Package
M1 outputs a versioned JSON payload containing strengths, gaps, evidence provenance, and match analysis. This serves as the standardized input for Modules 3, 4, and 5.
