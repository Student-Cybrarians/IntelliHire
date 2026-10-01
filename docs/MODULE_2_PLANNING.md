# Module 2 Planning Package: Adaptive AI Assessment Engine
**STATUS: PROPOSED / NOT APPROVED**

This directory contains the complete planning and research package for **Module 2**, operating under the instruction to explicitly freeze implementation and deliver architecture research for a Universal Adaptive Skill-Proficiency Engine.

## Package Contents
1.  [Executive Summary & System Contracts](./m2-planning/00-executive-summary.md)
2.  [Data, Roles & Competency Models](./m2-planning/01-data-competency-models.md)
3.  [Adaptive Engine & Assessment Lifecycle](./m2-planning/02-adaptive-engine.md)
4.  [AI Provider & Infrastructure Strategy](./m2-planning/03-ai-and-infrastructure.md)
5.  [Security, Privacy & Fairness](./m2-planning/04-security-and-fairness.md)

## Architecture Decision Records (ADRs) Candidates
*   **ADR-M2-01:** Rejecting 3PL IRT in favor of a Hybrid Bayesian Knowledge Tracing model for the cold-start adaptive engine.
*   **ADR-M2-02:** Adopting an AI Router strategy (Cheap vs Strong) rather than relying exclusively on `muse-glimmer-30b` to control costs.
*   **ADR-M2-03:** Enforcing Cloudflare Queues/Workflows for all asynchronous item generation and evaluation tasks to guarantee idempotency.
*   **ADR-M2-04:** Utilizing isolated external microVMs (e.g., Firecracker) instead of Cloudflare Workers for untrusted code execution.

## Outstanding Open Questions
1.  **Framework Licensing:** Which specific competency frameworks (O*NET, ESCO) will the organization legally utilize and map to?
2.  **Multidimensional Scoring:** Exactly which dimensions (Knowledge vs Application) will be surfaced to Module 5 vs hidden as internal confidence metrics?
3.  **Sandbox Provider:** Which external vendor or AWS architecture will host the practical execution environments?

**END OF MODULE 2 PLANNING PACKAGE**
