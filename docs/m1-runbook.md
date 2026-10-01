# Module 1: Operations Runbook & Rollback Procedure
**Date:** 2026-10-01

## 1. Deployment Topology
*   **Frontend & API:** Cloudflare Pages (`intellihire-v3`).
*   **Background Jobs:** Cloudflare Workers (`m1-async-worker`).
*   **Database:** Cloudflare D1 (`intellihire-db`).
*   **Queue:** Cloudflare Queues (`m1-jobs-queue`).

## 2. Rollback Procedure
If a deployment degrades the system (e.g., job processing gets stuck in `PENDING`), perform the following rollback steps:

1.  **Identify Known-Good Deployment:**
    *   Navigate to the Cloudflare Pages dashboard (`intellihire-v3`).
    *   Review the "Deployments" tab for the previous stable commit hash.
2.  **Execute Pages Rollback:**
    *   Click "Rollback" on the known-good deployment.
    *   Alternatively via Wrangler: `npx wrangler pages deployment tail intellihire-v3` to find ID, then redeploy the specific branch commit locally via git revert.
3.  **Worker Rollback (`m1-async-worker`):**
    *   Revert to the previous git commit locally.
    *   Run `npx wrangler deploy` inside `m1-async-worker/`.
4.  **Database Migration Considerations:**
    *   If the failed deployment included a schema migration (e.g., adding `evidence_item`), DO NOT drop the table to rollback, as data loss may occur. Instead, ensure the previous application version safely ignores the new table/columns.

## 3. Incident Recovery: Stuck Jobs
If jobs remain in `PROCESSING` status beyond 5 minutes:
*   **Cause:** Queue worker panic or AI Provider timeout.
*   **Recovery:** Run a SQL query on D1 to reset status:
    `UPDATE async_job SET status = 'PENDING' WHERE status = 'PROCESSING' AND updated_at < datetime('now', '-5 minutes');`
