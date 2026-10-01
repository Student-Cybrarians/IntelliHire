# Architecture Reconciliation

Audit of Planned System Architecture vs Actual Repository Architecture.

## 1. Boundary Audit

| Boundary | Planned | Actual Implementation | Classification |
|---|---|---|---|
| **Frontend SPA** | React 18 + Vite + Tailwind | React 18, Vite 5.4, Tailwind 3.4. Pages routing handles `/`, `/login`, `/dashboard`. | **APPROVED** |
| **API Layer** | Cloudflare Pages Functions (`functions/api/`) | Hono v4 framework handling all `/api/*` endpoints. Evaluated before SPA fallback. | **APPROVED** |
| **Asynchronous Engine** | Cloudflare Queues Producer/Consumer | D1-backed queue table with Cron Worker polling fallback due to Free tier limits. | **APPROVED (ADR-M1-05)** |
| **Document Extraction** | Python Pyodide Worker | `resume-extractor` Worker handling PDF/DOCX/TXT/TEX extraction. | **APPROVED** |
| **AI / Semantic Engine** | Nvidia NIM (`meta/muse-glimmer-30b`) | Server-side API integration via `m1-async-worker` with strict JSON schema parsing. | **APPROVED** |
| **Database** | Cloudflare D1 (`intellihire-db`) | SQLite-compatible D1 database holding user, profile, resume, taxonomy, and job state. | **APPROVED** |
| **Storage / KV** | Cloudflare KV | `SESSION_KV` (sessions) and `RESUME_KV` (raw resume buffers). | **APPROVED** |

## 2. Queue Architecture Decision & Reconciliation
- **Issue**: Attempting to provision Cloudflare Queues (`npx wrangler queues create m1-jobs-queue`) failed due to account plan restrictions ("The specified queue settings are invalid").
- **Resolution**: Architecture updated per `adr-m1-05-queue-verification.md` to use D1 job state tracking (`status`: `PENDING` -> `PROCESSING` -> `COMPLETED`) with scheduled Cron worker polling.
- **Traceability**: Documented in ADR and implemented in `functions/api/[[route]].ts` and `m1-async-worker/`.
