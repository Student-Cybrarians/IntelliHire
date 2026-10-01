# Module 2: AI, Cloudflare & Infrastructure Strategy
**STATUS: PROPOSED / NOT APPROVED**

## 1. AI Provider Strategy & Routing
A single model is insufficient and costly. The architecture implements a routing layer:
*   **Cheap Workloads (e.g., Llama-3-8b, Cloudflare Workers AI):** Used for metadata extraction, fast classification, and ambiguity detection.
*   **Medium Workloads (e.g., GPT-4o-mini, Claude 3.5 Haiku):** Question generation, rubric assistance, distractor generation.
*   **Strong Reasoning Workloads (e.g., `meta/muse-glimmer-30b`, GPT-4o):** Complex case evaluation, cross-evidence gap analysis, evaluating free-text scenarios.

## 2. Cloudflare Evaluation & Event Architecture
*   **Cloudflare Workers:** Suitable for fast, stateless API routing (e.g., `GET /next` or `POST /submit`). 
*   **Cloudflare Queues / Workflows:** Mandatory for asynchronous AI generation, rubric evaluation, and report synthesis to prevent timeouts and enforce idempotency.
*   **Cloudflare D1 & KV:** Used for relational assessment data (D1) and raw blob/prompt storage (KV).
*   **Durable Objects:** Can maintain real-time adaptive state for concurrent assessment sessions to avoid database read/write bottlenecks.

## 3. Practical / Work-Sample Assessments
Untrusted code execution (for engineering candidates) or complex file processing (for data/finance candidates) **cannot** run in standard Cloudflare Workers due to security and resource limits.
*   **Proposed Architecture:** Specialized, isolated sandboxes (e.g., Firecracker microVMs or Docker containers via AWS ECS / specialized sandbox providers) dedicated solely to untrusted execution.
*   **Scope:** Not every role needs sandboxes. Sales or Legal roles might use asynchronous written work samples evaluated by AI rubrics via Queues.

## 4. Cost Model & Observability
*   **Near-$0 MVP:** Heavily relies on Workers AI and pre-calibrated question banks.
*   **Observability:** Every event logs tokens used, execution time, model provider, and adaptive decision pathway to allow auditing of "Why did the candidate receive this score?"
