# IntelliHire M2 Universal Evidence Engine — Production Baseline Smoke Test

**Date:** 2026-10-02  
**Role:** DevSecOps + QA / SRE  
**Production Host:** `https://intellihire-v3.pages.dev`  
**Extractor Host:** `https://resume-extractor.codersy17mc.workers.dev`  
**Status:** **ALL 12 PRODUCTION CHECKS PASS**  

---

## 1. Verified Production Endpoints

| Check | Target URL | Method | Expected Status | Actual Status | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Root SPA** | `https://intellihire-v3.pages.dev/` | GET | 200 | 200 | **PASS** |
| **Login Route** | `https://intellihire-v3.pages.dev/login` | GET | 200 | 200 | **PASS** |
| **Assess Route** | `https://intellihire-v3.pages.dev/assess` | GET | 200 | 200 | **PASS** |
| **Resume Route** | `https://intellihire-v3.pages.dev/resume` | GET | 200 | 200 | **PASS** |
| **System Health** | `https://intellihire-v3.pages.dev/api/health` | GET | 200 | 200 | **PASS** |
| **M1 Status Auth** | `https://intellihire-v3.pages.dev/api/resume/status` | GET | 401 | 401 | **PASS** |
| **M2 Blueprints Auth** | `https://intellihire-v3.pages.dev/api/m2/blueprints` | GET | 401 | 401 | **PASS** |
| **M2 Attempts POST Auth**| `https://intellihire-v3.pages.dev/api/m2/attempts` | POST | 401 | 401 | **PASS** |
| **M2 Attempt GET Auth** | `https://intellihire-v3.pages.dev/api/m2/attempts/attempt-test-123` | GET | 401 | 401 | **PASS** |
| **M2 Proficiency Auth** | `https://intellihire-v3.pages.dev/api/m2/proficiency` | GET | 401 | 401 | **PASS** |
| **M2 Evidence Package Auth**| `https://intellihire-v3.pages.dev/api/m2/evidence-package` | GET | 401 | 401 | **PASS** |
| **Pyodide Extractor** | `https://resume-extractor.codersy17mc.workers.dev?format=txt` | POST | 200 | 200 | **PASS** |

---

## 2. Production Observations & Verification

1. **Security & Boundary Integrity:**
   - All stateful M1 and M2 endpoints securely enforce authentication: unauthenticated calls from outside the application boundary are cleanly rejected with HTTP 401 without leaking internal stack traces or database schema details.
   - The public `/api/health` route responds with `{ "status": "ok", "time": ... }`.
2. **SPA Routing Integrity:**
   - Single-page application routes (`/`, `/login`, `/assess`, `/resume`) successfully return the production index bundle (`200 OK`) and execute in client browsers without 404 falling through.
3. **External Worker Availability:**
   - The Python Pyodide Worker is online, responsive, and parses raw text buffers into structured JSON with status `TEXT_DECODING_ONLY`.
4. **Smoke Test Automation:**
   - Automated script `scripts/smoke-test.mjs` provides repeatable, safe, non-destructive verification of production deployment state.
