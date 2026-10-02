# IntelliHire M2 Universal Evidence Engine — Repository Discovery & Baseline

**Date:** 2026-10-02  
**Role:** Lead Agent + Git/DevOps + Solution Architect  
**Branch:** `main`  
**Latest Synchronized Commit:** `c458a8c` (`feat(m2): implement domain services, adaptive engine, and assessment UI`)  
**Production URL:** `https://intellihire-v3.pages.dev`  
**Resume Extractor URL:** `https://resume-extractor.codersy17mc.workers.dev`

---

## 1. High-Level Architecture & Stack

| Component | Technology | Detail |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18.3.1 (SPA) | Vite 5.4.6, React Router DOM 6.26.2, Tailwind CSS 3.4.12, Lucide React 0.446.0 |
| **Backend API Framework** | Hono 4.13.10 | Cloudflare Pages Functions (`functions/api/[[route]].ts`) |
| **Package Manager** | npm | Node.js v22.23.2 |
| **Edge Compute / Hosting** | Cloudflare Pages | Project name: `intellihire-v3`, build output: `dist` |
| **Primary Database** | Cloudflare D1 | Database name: `intellihire-db` (UUID: `63fdd68c-ff53-4aea-8327-2336b5e77587`), 32 tables |
| **Key-Value Storage** | Cloudflare KV | `SESSION_KV` (sessions/JWTs), `RESUME_KV` (raw resume binary storage) |
| **Workers** | Cloudflare Workers | 1. Python Pyodide Worker (`resume-extractor`) with `pypdf`<br>2. TypeScript Cron Worker (`m1-async-worker`) for scheduled background tasks |
| **AI / Inference** | Cloudflare AI + NVIDIA NIM | Cloudflare BAAI BGE embeddings (`@cf/baai/bge-base-en-v1.5`) + NVIDIA NIM (`meta/muse-glimmer-30b`) |
| **Testing** | Vitest 2.1.9 | Testing Library (React, DOM, Jest-DOM), jsdom |
| **Deployment Gate** | Custom Preflight | `scripts/preflight.mjs` (Git status, secrets check, placeholder check, vitest, build) |

---

## 2. Source Tree Layout

```
IntelliHire/
├── .wrangler/                    # Wrangler local state (miniflare D1/KV)
├── dist/                         # Vite production build artifacts
├── docs/
│   ├── adr/                      # Architectural Decision Records
│   ├── audit/                    # SDLC governance and mismatch audits
│   └── m2-universal-evidence/    # M2 Universal Evidence Engine documentation
├── functions/
│   └── api/
│       ├── [[route]].ts          # Master Hono backend router (1854 lines)
│       └── *.test.ts             # 10 backend integration test suites
├── m1-async-worker/
│   ├── src/index.ts              # Async Cron worker for background jobs & ATS scoring
│   ├── package.json
│   └── wrangler.toml             # Bound to D1 intellihire-db
├── resume-extractor/
│   ├── src/
│   │   ├── index.py              # Pure Python Pyodide extractor (pypdf + docx XML fallback)
│   │   └── requirements.txt
│   └── wrangler.toml             # python_workers compatibility flag
├── scripts/
│   └── preflight.mjs             # Strict pre-deployment verification script
├── src/
│   ├── client/
│   │   ├── components/           # ProtectedRoute, UI primitives
│   │   ├── pages/                # PublicLanding, Login, Onboarding, Dashboard, Resume, Assessment, AssessmentV2
│   │   │   └── dashboard/        # CandidateWorkspace, RecruiterWorkspace, AdminWorkspace
│   │   ├── App.tsx               # Client router declaration
│   │   └── index.css             # Tailwind base styles
│   ├── main.tsx                  # React entrypoint
│   └── shared/                   # Shared schema & taxonomy contracts
├── tests/                        # Vitest e2e, security, a11y, ai, enhancements test suites
├── package.json
├── schema.sql                    # Authoritative D1 database schema
├── vite.config.ts
├── vitest.config.ts
└── wrangler.jsonc                # Cloudflare Pages configuration & bindings
```

---

## 3. Cloudflare Infrastructure & Bindings

### Configured in `wrangler.jsonc` (Cloudflare Pages):
- **Compatibility Date:** `2024-09-25`
- **Compatibility Flags:** `["nodejs_compat"]`
- **Build Output Directory:** `dist`
- **D1 Database Binding:**
  - Binding: `DB`
  - Database Name: `intellihire-db`
  - Database ID: `63fdd68c-ff53-4aea-8327-2336b5e77587`
- **KV Namespace Bindings:**
  - `SESSION_KV`: ID `ce6547d827444f33b262781d9fecbb33` (User session JWTs, OAuth state tokens)
  - `RESUME_KV`: ID `88a7fca49a7f4baab3a5de663935a5d3` (Raw uploaded resumes)
- **AI Binding:**
  - Binding: `AI` (Cloudflare Workers AI)
- **R2 Storage:** None bound in `wrangler.jsonc` (Resumes currently stored in `RESUME_KV`).
- **Durable Objects:** None currently bound in `wrangler.jsonc`.
- **Queues:** None currently configured.
- **Workflows:** None currently configured.

---

## 4. Authentication, Authorization & Tenant Isolation Model

1. **Authentication Flow:**
   - Provider: Google OAuth 2.0 (`/api/auth/google/url` -> `/api/auth/google/callback`).
   - Session Token: Signed HS256 JWT stored in `SESSION_KV` keyed by `session:<uuid>`.
   - Client Cookie: `intellihire_session` (HTTP-only, Secure, SameSite=Lax, 86400s TTL).
   - Session Verification: `getSessionUser(c)` extracts and validates the session cookie and KV record.
   - User Profile: `/api/auth/me`.

2. **Roles:**
   - Supported Roles: `candidate`, `recruiter`, `org_admin`.
   - Assigned dynamically or via `user_account.role`.

3. **Tenant Model & Isolation:**
   - Multi-tenant model keyed by `organization.id`.
   - Default public organization: `org_default_public` (`IntelliHire Public Sandbox`).
   - Tenant isolation enforced server-side in `[[route]].ts` by joining or filtering `organization_id` derived from the authenticated session user.
   - Tables with explicit tenant isolation: `user_account`, `competency`, `job_requisition`, `candidate_application`, `assessment_blueprint`, `evidence_package`, `m2_audit_event`, `tenant_quota`.

---

## 5. Module 1 (M1) vs. Module 2 (M2) Inventory

### Module 1 — Intake, Extraction & Context
- **Resume Upload & Parsing:** `POST /api/resume/upload` -> external Python worker (`resume-extractor`) -> `candidate_resume` and `candidate_context`.
- **Claim Extraction & Provenance:** `candidate_claim` table.
- **JD Context & Matching:** `job_description_context`, `match_analysis`, `POST /api/jd/analyze`, `POST /api/match/run`.
- **M1 Enhancements Deployed:**
  - E-03: Multi-pass extraction (segmentation -> extraction -> taxonomy alignment).
  - E-05: Multi-dimensional hybrid ATS scoring model in `m1-async-worker`.
  - E-11: Pre-computed profile embeddings stored in D1 on `PUT /api/profile`.
  - E-14: Client & server PII redaction (`redactPII`) prior to external LLM calls.
  - E-18: LLM response caching in KV (`getCachedOrFetch`).

### Module 2 — Adaptive Assessment & Competency Engine
- **M2 v2 Foundation Tables (32 tables total in remote D1):**
  - `assessment_purpose`: Purpose of the assessment (diagnostic, recruitment, readiness, etc.).
  - `assessment_blueprint`: Role, purpose, and configuration.
  - `assessment_stage`: Stage progression within blueprints.
  - `assessment_rubric`: Structured scoring criteria and performance levels.
  - `assessment_item_v2`: Versioned items with content JSON, difficulty, calibration data, and validation status (`draft`, `ai_validated`, `human_reviewed`, `published`, `retired`).
  - `assessment_attempt`: Active candidate attempts with `adaptive_state_json`.
  - `assessment_response_v2`: Responses with time tracking and provenance.
  - `assessment_evaluation`: Evaluations with raw scores, criteria breakdown, and confidence.
  - `candidate_skill_proficiency_v2`: Separates proficiency estimates from uncertainty estimates and tracks evidence status.
  - `candidate_gap`: Gaps categorized with severity and recommendations.
  - `evidence_package`: Packaged evidence for downstream M3/M4/M5 consumption.
  - `m2_audit_event`: Audit log of all assessment operations.
- **Legacy M1 Assessment Tables (Preserved for compatibility):**
  - `assessment_item`, `assessment_session`, `candidate_response`, `candidate_proficiency`.
- **Backend API Routes (in `functions/api/[[route]].ts`):**
  - Blueprint/Purpose: `POST /api/m2/blueprints`, `GET /api/m2/blueprints`, `GET /api/m2/blueprints/:id`, `POST /api/m2/purposes`, `GET /api/m2/purposes`.
  - Rubrics: `POST /api/m2/rubrics`, `GET /api/m2/rubrics/:skill_id`.
  - Items & Generation: `POST /api/m2/items`, `GET /api/m2/items`, `PATCH /api/m2/items/:id/status`, `POST /api/m2/items/generate`.
  - Attempts & Adaptive Engine: `POST /api/m2/attempts`, `GET /api/m2/attempts/:id`, `GET /api/m2/attempts/:id/next`, `POST /api/m2/attempts/:id/respond`, `POST /api/m2/attempts/:id/complete`.
  - Evaluation: `POST /api/m2/evaluate`.
  - Proficiency, Gaps & Downstream Contracts: `GET /api/m2/proficiency`, `GET /api/m2/gaps`, `GET /api/m2/evidence-package`.
  - Role Mapping: `POST /api/m2/role-mapping`, `GET /api/m2/role-mapping/:role`.

---

## 6. Frontend Routing Matrix

| Route | Component | Access Control | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | `PublicLanding.tsx` | Public | Landing page & feature showcase |
| `/login` | `Login.tsx` | Public | Google OAuth entrypoint |
| `/onboarding` | `Onboarding.tsx` | Authenticated | 3-stage taxonomy-driven profile creation |
| `/dashboard` | `Dashboard.tsx` | Authenticated | Routes to Candidate, Recruiter, or Admin workspace |
| `/assess` | `AssessmentV2.tsx` | Authenticated | M2 Adaptive Multi-Modal Assessment & Evidence engine |
| `/assessment/:skill_id` | `Assessment.tsx` | Authenticated | Legacy M1 single-skill MCQ prototype |
| `/resume` | `Resume.tsx` | Authenticated | M1 Resume Intelligence, ATS breakdown, PII redaction |
| `/technical-sandbox`| `FeaturePlaceholder.tsx` | Authenticated | Placeholder for practical simulations |
| `/requisitions` | `FeaturePlaceholder.tsx` | Recruiter / Org Admin | Requisition management |
| `/candidates` | `FeaturePlaceholder.tsx` | Recruiter / Org Admin | Candidate pipeline & evaluation |
| `/settings` | `FeaturePlaceholder.tsx` | Org Admin | Organization settings |
| `/users` | `FeaturePlaceholder.tsx` | Org Admin | Organization user management |

---

## 7. Test Suite Inventory

| Test File | Target | Test Cases |
| :--- | :--- | :--- |
| `tests/a11y.test.ts` | Frontend Accessibility | ARIA labels, accessible file input |
| `tests/ai.test.ts` | AI Integration | AI schema generation, prompt boundaries |
| `tests/e2e.test.ts` | End-to-End | Candidate profile and navigation lifecycle |
| `tests/enhancements.test.ts` | M1 Enhancements | E-03, E-05, E-11, E-14, E-18 unit & regression |
| `tests/security.test.ts` | Security & Auth | Unauthenticated rejection, tenant isolation |
| `functions/api/analytics.test.ts` | Backend Analytics | Pipeline metrics endpoint |
| `functions/api/assessment.test.ts` | Legacy Assessment | Start and submit endpoints |
| `functions/api/competency.test.ts` | Taxonomy & Skills | Competency and skill CRUD |
| `functions/api/dashboard.test.ts` | Workspace Endpoints | Candidate & recruiter views |
| `functions/api/m1.test.ts` | M1 Core Contracts | Candidate context & claims |
| `functions/api/pipeline.test.ts` | Candidate Pipeline | Status transitions & audits |
| `functions/api/profile.test.ts` | Candidate Profile | Profile retrieval and updates |
| `functions/api/requisition.test.ts`| Job Requisitions | Creation, retrieval, applications |
| `functions/api/resume.test.ts` | Resume Ingestion | Security, formats, file size limits |
| `functions/api/search.test.ts` | Candidate Search | Semantic candidate search |
| **Total Test Count** | **17 Files** | **60 Passing Tests** |

---

## 8. Build & Deployment Pipeline

1. **Local Verification:**
   ```powershell
   npm run build      # tsc && vite build
   npm test           # vitest run
   ```
2. **Preflight Gate (`scripts/preflight.mjs`):**
   - Verifies git working directory is clean.
   - Verifies no secrets or tracked `node_modules` in git index.
   - Verifies no placeholder IDs in `wrangler.jsonc`.
   - Runs full test suite (`npm test`).
   - Runs full production build (`npm run build`).
3. **Deployment Command:**
   ```powershell
   npm run deploy     # npm run preflight && wrangler pages deploy dist --project-name intellihire-v3
   ```
4. **Python Extractor Deployment:**
   ```powershell
   cd resume-extractor
   npx wrangler deploy --config wrangler.toml
   ```

---

## 9. Baseline Findings & Readiness Assessment

1. **Codebase Health:** Clean working directory, 0 TypeScript compile errors, 60/60 tests passing.
2. **Architecture Compliance:** Strict separation between client presentation (`src/client`), API routing (`functions/api`), and standalone worker microservices (`resume-extractor`, `m1-async-worker`).
3. **M2 Upgrade Path:** M2 foundation tables and `/api/m2/*` endpoints are live in production. The Universal Evidence Engine upgrade will transition M2 from basic text/MCQ items to a comprehensive, multi-modal, universal evidence generation engine supporting all occupations and seniorities.
