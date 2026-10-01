# Module 1: Asynchronous Processing Architecture
**Date:** 2026-10-01

## 1. Objective
To prevent HTTP timeouts (Cloudflare 100s limit) and provide observable progress during expensive document parsing and AI evaluation workloads.

## 2. Implementation: `async_job`
A central `async_job` table tracks the lifecycle of all background operations.

**States:**
*   `PENDING`: Job queued.
*   `PROCESSING`: Background worker executing (e.g., `doMatch()`).
*   `READY`: Output stored in `result_data_json`.
*   `FAILED`: Execution aborted; reason stored in `error_message`.

## 3. Workflow Example: Job Matching
1.  **Client** calls `POST /api/match/run` with `resume_id` and `jd_id`.
2.  **API** creates an `async_job` record, fires `c.executionCtx.waitUntil(doMatch())`, and immediately returns HTTP 202 Accepted with `job_id`.
3.  **Client** polls `GET /api/match/status/:jobId` every 2000ms.
4.  **Worker** retrieves prompt templates, queries NVIDIA API `meta/muse-glimmer-30b`, parses the JSON output, calculates the deterministic ATS score, and updates `async_job` to `READY` with the full payload.
5.  **Client** receives `READY` and renders the UI.

## 4. Future Scalability
While currently relying on `waitUntil()`, this abstraction allows seamless future migration to dedicated **Cloudflare Queues** or **Cloudflare Workflows** without changing the frontend or database schema.
